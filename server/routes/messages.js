const express = require('express');
const { getPool } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { areFriends, orderedPair } = require('./friends');

const router = express.Router();

router.get('/conversations', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;

    const [conversations] = await db.query(`
      SELECT c.id, c.updated_at,
             CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS friend_id,
             u.full_name AS friend_name, u.avatar_url AS friend_avatar,
             (SELECT COUNT(*) FROM dm_messages dm WHERE dm.conversation_id = c.id) AS message_count,
             (SELECT dm.created_at FROM dm_messages dm WHERE dm.conversation_id = c.id ORDER BY dm.created_at DESC LIMIT 1) AS last_message_at
      FROM conversations c
      JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.updated_at DESC
    `, [userId, userId, userId, userId]);

    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.post('/conversations/:friendId', authenticate, async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);
    if (!(await areFriends(req.user.id, friendId))) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    const [u1, u2] = orderedPair(req.user.id, friendId);
    const db = getPool();

    const [existing] = await db.query(
      'SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?',
      [u1, u2]
    );

    let conversationId;
    if (existing.length > 0) {
      conversationId = existing[0].id;
    } else {
      const [result] = await db.query(
        'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
        [u1, u2]
      );
      conversationId = result.insertId;
    }

    const [users] = await db.query(
      'SELECT id, full_name, avatar_url FROM users WHERE id = ?',
      [friendId]
    );

    res.json({ conversationId, friend: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

router.get('/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const db = getPool();

    const [convs] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, req.user.id, req.user.id]
    );
    if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const [messages] = await db.query(`
      SELECT id, conversation_id, sender_id, ciphertext, iv, created_at
      FROM dm_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      LIMIT 200
    `, [conversationId]);

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const { ciphertext, iv } = req.body;
    if (!ciphertext || !iv) {
      return res.status(400).json({ error: 'Encrypted message required' });
    }

    const conversationId = parseInt(req.params.id);
    const db = getPool();

    const [convs] = await db.query(
      'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, req.user.id, req.user.id]
    );
    if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });

    const conv = convs[0];
    const otherId = conv.user1_id === req.user.id ? conv.user2_id : conv.user1_id;
    if (!(await areFriends(req.user.id, otherId))) {
      return res.status(403).json({ error: 'You can only message friends' });
    }

    const [result] = await db.query(
      'INSERT INTO dm_messages (conversation_id, sender_id, ciphertext, iv) VALUES (?, ?, ?, ?)',
      [conversationId, req.user.id, ciphertext, iv]
    );

    await db.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

    const message = {
      id: result.insertId,
      conversation_id: conversationId,
      sender_id: req.user.id,
      ciphertext,
      iv,
      created_at: new Date().toISOString(),
    };

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    if (io && connectedUsers) {
      const recipientSocket = connectedUsers.get(otherId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('new_dm', { conversationId, message });
      }
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
