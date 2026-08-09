import { Server as SocketServer } from 'socket.io';
// IMPORTANT: relative import — server.ts runs via tsx (no @/ alias resolution)
import { prisma } from './prisma';

// Global singleton so API routes can emit events
declare global {
  // eslint-disable-next-line no-var
  var socketIO: SocketServer | undefined;
}

export function getIO(): SocketServer {
  if (!global.socketIO) {
    throw new Error('Socket.io not initialized. Is server.ts running?');
  }
  return global.socketIO;
}

// In-memory presence: userId → socketId
const connectedUsers = new Map<string, string>();

export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}

export function getOnlineUserIds(): string[] {
  return Array.from(connectedUsers.keys());
}

interface SocketWithUser {
  userId: string;
  [key: string]: unknown;
}

export function initSocketServer(io: SocketServer): void {
  global.socketIO = io;

  // Auth middleware: require userId in handshake
  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId as string | undefined;
    if (!userId) return next(new Error('userId required'));
    (socket as unknown as SocketWithUser).userId = userId;
    next();
  });

  io.on('connection', async (socket) => {
    const s = socket as unknown as SocketWithUser;
    const userId = s.userId;

    connectedUsers.set(userId, socket.id);

    // Mark online in DB (non-blocking)
    prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    }).catch(() => undefined);

    // Send online friends list to this user
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userId }, { friendId: userId }], status: 'ACCEPTED' },
      select: { userId: true, friendId: true },
    }).catch(() => []);

    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );
    const onlineFriendIds = friendIds.filter((id) => connectedUsers.has(id));
    socket.emit('friends_online', onlineFriendIds);

    // Notify friends this user came online
    for (const friendId of friendIds) {
      const fSocketId = connectedUsers.get(friendId);
      if (fSocketId) {
        io.to(fSocketId).emit('friend_status', { userId, isOnline: true });
      }
    }

    // Join group rooms
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    }).catch(() => []);

    for (const { groupId } of memberships) {
      socket.join(`group:${groupId}`);
    }

    // ── Direct Message relay ────────────────────────────────────
    socket.on('dm:send', (data: {
      receiverId: string;
      ciphertext: string;
      nonce: string;
      messageId: string;
    }) => {
      const receiverSocketId = connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('dm:receive', {
          senderId: userId,
          ciphertext: data.ciphertext,
          nonce: data.nonce,
          messageId: data.messageId,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // ── Group chat ──────────────────────────────────────────────
    socket.on('group:message', (data: {
      groupId: string;
      content: string;
      messageId: string;
      authorName: string;
      authorAvatar?: string;
    }) => {
      socket.to(`group:${data.groupId}`).emit('group:message', {
        groupId: data.groupId,
        messageId: data.messageId,
        content: data.content,
        authorId: userId,
        authorName: data.authorName,
        authorAvatar: data.authorAvatar,
        createdAt: new Date().toISOString(),
      });
    });

    // ── Typing indicators ───────────────────────────────────────
    socket.on('dm:typing', (data: { receiverId: string }) => {
      const receiverSocketId = connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('dm:typing', { senderId: userId });
      }
    });

    socket.on('group:typing', (data: { groupId: string }) => {
      socket.to(`group:${data.groupId}`).emit('group:typing', {
        userId,
        groupId: data.groupId,
      });
    });

    // ── Disconnect ──────────────────────────────────────────────
    socket.on('disconnect', async () => {
      connectedUsers.delete(userId);

      prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      }).catch(() => undefined);

      for (const friendId of friendIds) {
        const fSocketId = connectedUsers.get(friendId);
        if (fSocketId) {
          io.to(fSocketId).emit('friend_status', { userId, isOnline: false });
        }
      }
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error for user ${userId}:`, err.message);
    });
  });
}
