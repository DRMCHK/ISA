require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const { initDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const friendRoutes = require('./routes/friends');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const { JWT_SECRET } = require('./middleware/auth');
const { getFriendIds, notifyFriendsPresence } = require('./services/presence');
const { getPool } = require('./db/database');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);

async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    console.error('Make sure MySQL is running in XAMPP and credentials in .env are correct.');
    process.exit(1);
  }

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: 'Too many requests, please try again later' },
  });
  app.use('/api/', limiter);

  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/groups', groupRoutes);

  const connectedUsers = new Map();
  app.set('connectedUsers', connectedUsers);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', platform: 'ISA Link', version: '1.0.0' });
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    connectedUsers.set(socket.userId, socket.id);

    try {
      const friendIds = await getFriendIds(socket.userId);
      const onlineFriends = friendIds.filter(fid => connectedUsers.has(fid));
      socket.emit('friends_online', onlineFriends);

      await notifyFriendsPresence(io, connectedUsers, socket.userId, true);

      const db = getPool();
      const [groups] = await db.query(
        'SELECT group_id FROM group_members WHERE user_id = ?',
        [socket.userId]
      );
      for (const g of groups) {
        socket.join(`group_${g.group_id}`);
      }
    } catch (err) {
      console.error('Socket connection setup error:', err.message);
    }

    socket.on('disconnect', async () => {
      connectedUsers.delete(socket.userId);
      try {
        await notifyFriendsPresence(io, connectedUsers, socket.userId, false);
      } catch (err) {
        console.error('Socket disconnect error:', err.message);
      }
    });
  });

  const clientDist = path.join(__dirname, '../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientDist, 'index.html'));
      }
    });
  }

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║         ISA Link Server Running          ║
  ║   International Student Association      ║
  ║      "Empowered To Succeed"              ║
  ╠══════════════════════════════════════════╣
  ║  API:  http://localhost:${PORT}/api       ║
  ║  Health: http://localhost:${PORT}/api/health ║
  ╚══════════════════════════════════════════╝
    `);
  });
}

startServer();

module.exports = { app, server, io };
