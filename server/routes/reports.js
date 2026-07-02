const express = require('express');
const { getPool } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { type, subject, message, isAnonymous } = req.body;

    if (!type || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Type, subject, and message are required' });
    }

    const validTypes = ['report', 'advice', 'suggestion'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    const anonymous = isAnonymous !== false;
    const reporterId = anonymous ? null : req.user.id;

    const db = getPool();
    const [result] = await db.query(
      'INSERT INTO reports (type, subject, message, reporter_id, is_anonymous) VALUES (?, ?, ?, ?, ?)',
      [type, subject.trim(), message.trim(), reporterId, anonymous ? 1 : 0]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Your submission has been received. Thank you for helping improve ISA Link.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [reports] = await db.query(
      `SELECT id, type, subject, message, is_anonymous, status, created_at, resolved_at
       FROM reports WHERE reporter_id = ? AND is_anonymous = 0 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

module.exports = router;
