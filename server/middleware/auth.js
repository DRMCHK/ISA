const jwt = require('jsonwebtoken');
const { getPool } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'isa-link-secret';

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const db = getPool();
    const [rows] = await db.query(
      'SELECT id, email, full_name, bio, avatar_url, role, can_post_pictures, can_post_videos, can_post_links, is_active FROM users WHERE id = ?',
      [payload.userId]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account inactive or not found' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireAdminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, requireAdmin, requireAdminOnly, signToken, JWT_SECRET };
