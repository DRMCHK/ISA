const express = require('express');
const { getPool } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');
const { moderateSearchQuery } = require('../services/moderation');

const router = express.Router();

router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ users: [] });

    const moderation = moderateSearchQuery(q);
    if (!moderation.allowed) {
      return res.status(400).json({ error: 'Search query contains inappropriate content' });
    }

    const db = getPool();
    const term = `%${moderation.sanitized}%`;
    const [users] = await db.query(
      `SELECT id, full_name, bio, avatar_url, role, created_at
       FROM users WHERE is_active = 1 AND (full_name LIKE ? OR email LIKE ?) LIMIT 20`,
      [term, term]
    );

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      'SELECT id, full_name, bio, avatar_url, role, created_at FROM users WHERE id = ? AND is_active = 1',
      [req.params.id]
    );

    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [countRows] = await db.query(
      "SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND status = 'published'",
      [user.id]
    );

    res.json({ user: { ...user, postCount: countRows[0].count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, bio } = req.body;
    const updates = [];
    const params = [];

    if (fullName?.trim()) {
      updates.push('full_name = ?');
      params.push(fullName.trim());
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.user.id);
    const db = getPool();
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [users] = await db.query(
      'SELECT id, email, full_name, bio, avatar_url, role, can_post_pictures, can_post_videos, can_post_links FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

router.post('/avatar', authenticate, (req, res, next) => {
  req.uploadFolder = 'avatars';
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const db = getPool();
    await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);

    const [users] = await db.query(
      'SELECT id, email, full_name, bio, avatar_url, role, can_post_pictures, can_post_videos, can_post_links FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Avatar upload failed' });
  }
});

module.exports = router;
