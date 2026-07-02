const { getPool } = require('../db/database');

async function getFriendIds(userId) {
  const db = getPool();
  const [rows] = await db.query(`
    SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END AS friend_id
    FROM friendships
    WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?)
  `, [userId, userId, userId]);
  return rows.map(r => r.friend_id);
}

async function notifyFriendsPresence(io, connectedUsers, userId, online) {
  const friendIds = await getFriendIds(userId);
  for (const friendId of friendIds) {
    const socketId = connectedUsers.get(friendId);
    if (socketId) {
      io.to(socketId).emit('friend_presence', { userId, online });
    }
  }
}

module.exports = { getFriendIds, notifyFriendsPresence };
