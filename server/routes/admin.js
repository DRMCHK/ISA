const express = require('express');
const { getPool } = require('../db/database');
const { authenticate, requireAdmin, requireAdminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

function parseFlags(flags) {
  if (!flags) return [];
  if (typeof flags === 'string') {
    try { return JSON.parse(flags); } catch { return []; }
  }
  return flags;
}

router.get('/dashboard', async (req, res) => {
  try {
    const db = getPool();
    const [[users]] = await db.query('SELECT COUNT(*) as c FROM users WHERE is_active = 1');
    const [[posts]] = await db.query("SELECT COUNT(*) as c FROM posts WHERE status = 'published'");
    const [[flagged]] = await db.query("SELECT COUNT(*) as c FROM posts WHERE status = 'flagged'");
    const [[reports]] = await db.query("SELECT COUNT(*) as c FROM reports WHERE status = 'open'");

    res.json({
      stats: {
        totalUsers: users.c,
        totalPosts: posts.c,
        flaggedPosts: flagged.c,
        openReports: reports.c,
        pendingReview: flagged.c,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const db = getPool();
    const [users] = await db.query(`
      SELECT id, email, full_name, bio, avatar_url, role,
             can_post_pictures, can_post_videos, can_post_links,
             is_active, created_at
      FROM users ORDER BY created_at DESC
    `);
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.put('/users/:id/permissions', requireAdminOnly, async (req, res) => {
  try {
    const { canPostPictures, canPostVideos, canPostLinks, role, isActive } = req.body;
    const userId = parseInt(req.params.id);

    if (userId === req.user.id && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const db = getPool();
    const [current] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (current.length === 0) return res.status(404).json({ error: 'User not found' });

    const u = current[0];
    await db.query(`
      UPDATE users SET
        can_post_pictures = ?,
        can_post_videos = ?,
        can_post_links = ?,
        role = ?,
        is_active = ?
      WHERE id = ?
    `, [
      canPostPictures !== undefined ? (canPostPictures ? 1 : 0) : u.can_post_pictures,
      canPostVideos !== undefined ? (canPostVideos ? 1 : 0) : u.can_post_videos,
      canPostLinks !== undefined ? (canPostLinks ? 1 : 0) : u.can_post_links,
      role || u.role,
      isActive !== undefined ? (isActive ? 1 : 0) : u.is_active,
      userId,
    ]);

    const [users] = await db.query(
      'SELECT id, email, full_name, role, can_post_pictures, can_post_videos, can_post_links, is_active FROM users WHERE id = ?',
      [userId]
    );

    res.json({ user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

router.get('/flagged-posts', async (req, res) => {
  try {
    const db = getPool();
    const [posts] = await db.query(`
      SELECT p.*, u.full_name as author_name, u.email as author_email
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.status IN ('flagged', 'removed')
      ORDER BY p.moderation_score DESC, p.created_at DESC
    `);

    res.json({
      posts: posts.map(p => ({ ...p, moderation_flags: parseFlags(p.moderation_flags) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load flagged posts' });
  }
});

router.put('/posts/:id/moderate', async (req, res) => {
  try {
    const { action, reason } = req.body;
    const postId = parseInt(req.params.id);

    const validActions = ['approve', 'remove', 'restore'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid moderation action' });
    }

    const statusMap = { approve: 'published', remove: 'removed', restore: 'published' };
    const db = getPool();
    await db.query('UPDATE posts SET status = ? WHERE id = ?', [statusMap[action], postId]);

    await db.query(
      'INSERT INTO moderation_log (content_type, content_id, action, reason, moderator_id) VALUES (?, ?, ?, ?, ?)',
      ['post', postId, action, reason || '', req.user.id]
    );

    res.json({ message: `Post ${action}d successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Moderation failed' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const { status } = req.query;
    const db = getPool();
    let query = `
      SELECT r.*, u.full_name as reporter_name, u.email as reporter_email
      FROM reports r LEFT JOIN users u ON r.reporter_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';
    const [reports] = await db.query(query, params);

    res.json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const reportId = parseInt(req.params.id);

    const validStatuses = ['open', 'reviewing', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = getPool();
    const [current] = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (current.length === 0) return res.status(404).json({ error: 'Report not found' });

    const r = current[0];
    await db.query(
      `UPDATE reports SET status = ?, admin_notes = ?, resolved_at = ? WHERE id = ?`,
      [
        status || r.status,
        adminNotes !== undefined ? adminNotes : r.admin_notes,
        ['resolved', 'dismissed'].includes(status) ? new Date() : r.resolved_at,
        reportId,
      ]
    );

    const [reports] = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    res.json({ report: reports[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.get('/moderation-log', async (req, res) => {
  try {
    const db = getPool();
    const [logs] = await db.query(`
      SELECT ml.*, u.full_name as moderator_name
      FROM moderation_log ml
      LEFT JOIN users u ON ml.moderator_id = u.id
      ORDER BY ml.created_at DESC
      LIMIT 100
    `);
    res.json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load moderation log' });
  }
});

module.exports = router;
