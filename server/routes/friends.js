const express = require('express');
const { getPool } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function orderedPair(id1, id2) {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

async function areFriends(userId1, userId2) {
  const db = getPool();
  const [rows] = await db.query(`
    SELECT id FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))
  `, [userId1, userId2, userId2, userId1]);
  return rows.length > 0;
}

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const connectedUsers = req.app.get('connectedUsers') || new Map();

    const [friends] = await db.query(`
      SELECT u.id, u.full_name, u.avatar_url, u.bio, f.updated_at AS friends_since
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
      WHERE f.status = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?) AND u.is_active = 1
      ORDER BY u.full_name
    `, [userId, userId, userId]);

    res.json({
      friends: friends.map(f => ({
        ...f,
        online: connectedUsers.has(f.id),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

router.get('/requests', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [incoming] = await db.query(`
      SELECT f.id, f.requester_id, f.created_at, u.full_name, u.avatar_url
      FROM friendships f
      JOIN users u ON u.id = f.requester_id
      WHERE f.addressee_id = ? AND f.status = 'pending' AND u.is_active = 1
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    const [outgoing] = await db.query(`
      SELECT f.id, f.addressee_id, f.created_at, u.full_name, u.avatar_url
      FROM friendships f
      JOIN users u ON u.id = f.addressee_id
      WHERE f.requester_id = ? AND f.status = 'pending' AND u.is_active = 1
    `, [req.user.id]);

    res.json({ incoming, outgoing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load friend requests' });
  }
});

router.post('/request/:userId', authenticate, async (req, res) => {
  try {
    const targetId = parseInt(req.params.userId);
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    const db = getPool();
    const [users] = await db.query('SELECT id FROM users WHERE id = ? AND is_active = 1', [targetId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const [existing] = await db.query(`
      SELECT id, status FROM friendships
      WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
    `, [req.user.id, targetId, targetId, req.user.id]);

    if (existing.length > 0) {
      const f = existing[0];
      if (f.status === 'accepted') return res.status(409).json({ error: 'Already friends' });
      if (f.status === 'pending') return res.status(409).json({ error: 'Friend request already pending' });
    }

    await db.query(
      'INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, ?)',
      [req.user.id, targetId, 'pending']
    );

    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

router.post('/accept/:requestId', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?',
      [req.params.requestId, req.user.id, 'pending']
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });

    await db.query('UPDATE friendships SET status = ? WHERE id = ?', ['accepted', req.params.requestId]);
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

router.post('/reject/:requestId', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      'SELECT id FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?',
      [req.params.requestId, req.user.id, 'pending']
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });

    await db.query('UPDATE friendships SET status = ? WHERE id = ?', ['rejected', req.params.requestId]);
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

router.delete('/:friendId', authenticate, async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);
    const db = getPool();
    await db.query(`
      DELETE FROM friendships
      WHERE status = 'accepted'
        AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))
    `, [req.user.id, friendId, friendId, req.user.id]);
    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

router.get('/status/:userId', authenticate, async (req, res) => {
  try {
    const targetId = parseInt(req.params.userId);
    const db = getPool();
    const connectedUsers = req.app.get('connectedUsers') || new Map();

    const [rows] = await db.query(`
      SELECT id, status, requester_id, addressee_id FROM friendships
      WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
    `, [req.user.id, targetId, targetId, req.user.id]);

    const friendship = rows[0] || null;
    let status = 'none';
    let requestId = null;

    if (friendship) {
      if (friendship.status === 'accepted') status = 'friends';
      else if (friendship.status === 'pending') {
        status = friendship.requester_id === req.user.id ? 'pending_sent' : 'pending_received';
        requestId = friendship.id;
      }
    }

    const isFriend = status === 'friends';
    res.json({
      status,
      requestId,
      online: isFriend ? connectedUsers.has(targetId) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get friend status' });
  }
});

module.exports = router;
module.exports.areFriends = areFriends;
module.exports.orderedPair = orderedPair;
