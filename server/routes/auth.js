const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../db/database');
const { authenticate, signToken } = require('../middleware/auth');

const router = express.Router();

const { validatePassword } = require('../utils/password');

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ error: pwCheck.error });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const db = getPool();
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = bcrypt.hashSync(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
      [email.toLowerCase(), hash, fullName.trim()]
    );

    const [users] = await db.query(
      'SELECT id, email, full_name, bio, avatar_url, role, can_post_pictures, can_post_videos, can_post_links FROM users WHERE id = ?',
      [result.insertId]
    );

    const token = signToken(users[0].id);
    res.status(201).json({ user: users[0], token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getPool();
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated. Contact an administrator.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(user.id);
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
