const express = require('express');
const { getPool } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { postMediaUpload } = require('../middleware/upload');
const { moderatePost, moderateSearchQuery } = require('../services/moderation');

const router = express.Router();

function parseFlags(flags) {
  if (!flags) return [];
  if (typeof flags === 'string') {
    try { return JSON.parse(flags); } catch { return []; }
  }
  return flags;
}

async function formatPost(post, currentUserId) {
  const db = getPool();
  let liked = false;
  if (currentUserId) {
    const [rows] = await db.query('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [post.id, currentUserId]);
    liked = rows.length > 0;
  }

  return {
    ...post,
    moderation_flags: parseFlags(post.moderation_flags),
    liked,
    author: {
      id: post.author_id,
      full_name: post.author_name,
      avatar_url: post.author_avatar,
      role: post.author_role,
    },
  };
}

router.get('/feed', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const db = getPool();
    const [posts] = await db.query(`
      SELECT p.*, u.id as author_id, u.full_name as author_name,
             u.avatar_url as author_avatar, u.role as author_role
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.status IN ('published', 'flagged') AND u.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const formatted = await Promise.all(posts.map(p => formatPost(p, req.user.id)));

    res.json({ posts: formatted, page, hasMore: posts.length === limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ posts: [] });

    const moderation = moderateSearchQuery(q);
    if (!moderation.allowed) {
      return res.status(400).json({ error: 'Search query contains inappropriate content' });
    }

    const term = `%${moderation.sanitized}%`;
    const db = getPool();
    const [posts] = await db.query(`
      SELECT p.*, u.id as author_id, u.full_name as author_name,
             u.avatar_url as author_avatar, u.role as author_role
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'published' AND u.is_active = 1
        AND (p.content LIKE ? OR p.link_title LIKE ?)
      ORDER BY p.created_at DESC
      LIMIT 30
    `, [term, term]);

    const formatted = await Promise.all(posts.map(p => formatPost(p, req.user.id)));
    res.json({ posts: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [posts] = await db.query(`
      SELECT p.*, u.id as author_id, u.full_name as author_name,
             u.avatar_url as author_avatar, u.role as author_role
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? AND p.status IN ('published', 'flagged') AND u.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.params.userId]);

    const formatted = await Promise.all(posts.map(p => formatPost(p, req.user.id)));
    res.json({ posts: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

router.post('/', authenticate, (req, res, next) => {
  req.uploadFolder = 'posts';
  postMediaUpload.single('media')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { content, linkUrl, linkTitle, mediaType } = req.body;
    const user = req.user;

    if (!content?.trim() && !req.file && !linkUrl) {
      return res.status(400).json({ error: 'Post must contain text, media, or a link' });
    }

    const type = mediaType || (req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : linkUrl ? 'link' : 'text');

    if (type === 'image' && !user.can_post_pictures) {
      return res.status(403).json({ error: 'You do not have permission to post pictures' });
    }
    if (type === 'video' && !user.can_post_videos) {
      return res.status(403).json({ error: 'You do not have permission to post videos' });
    }
    if (type === 'link' && !user.can_post_links) {
      return res.status(403).json({ error: 'You do not have permission to post links' });
    }

    const moderation = moderatePost({
      content: content || '',
      linkUrl: linkUrl || '',
      mediaType: type,
    });

    if (moderation.blocked) {
      return res.status(400).json({
        error: 'Your post was blocked due to inappropriate or suspicious content',
        flags: moderation.flags,
      });
    }

    let mediaUrl = '';
    if (req.file) mediaUrl = `/uploads/posts/${req.file.filename}`;

    const db = getPool();
    const [result] = await db.query(`
      INSERT INTO posts (user_id, content, media_type, media_url, link_url, link_title, status, moderation_score, moderation_flags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, (content || '').trim(), type, mediaUrl,
      linkUrl || '', linkTitle || '', moderation.status,
      moderation.score, JSON.stringify(moderation.flags),
    ]);

    const [postRows] = await db.query(`
      SELECT p.*, u.id as author_id, u.full_name as author_name,
             u.avatar_url as author_avatar, u.role as author_role
      FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [result.insertId]);

    const post = await formatPost(postRows[0], user.id);

    const io = req.app.get('io');
    if (io && moderation.status === 'published') {
      io.emit('new_post', post);
    }

    res.status(201).json({
      post,
      flagged: moderation.flagged,
      message: moderation.flagged ? 'Your post has been flagged for review' : 'Post published successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const db = getPool();

    const [posts] = await db.query("SELECT id FROM posts WHERE id = ? AND status = 'published'", [postId]);
    if (posts.length === 0) return res.status(404).json({ error: 'Post not found' });

    const [existing] = await db.query('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id]);

    if (existing.length > 0) {
      await db.query('DELETE FROM likes WHERE id = ?', [existing[0].id]);
      await db.query('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?', [postId]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, req.user.id]);
      await db.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Like action failed' });
  }
});

router.get('/:id/comments', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [comments] = await db.query(`
      SELECT c.*, u.full_name, u.avatar_url, u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.status = 'published'
      ORDER BY c.created_at ASC
    `, [req.params.id]);

    res.json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const moderation = moderatePost({ content, mediaType: 'text' });
    if (moderation.blocked) {
      return res.status(400).json({ error: 'Comment blocked due to inappropriate content' });
    }

    const postId = parseInt(req.params.id);
    const db = getPool();
    const [result] = await db.query(
      'INSERT INTO comments (post_id, user_id, content, status) VALUES (?, ?, ?, ?)',
      [postId, req.user.id, content.trim(), moderation.flagged ? 'flagged' : 'published']
    );

    await db.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId]);

    const [commentRows] = await db.query(`
      SELECT c.*, u.full_name, u.avatar_url, u.role
      FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({ comment: commentRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    const post = rows[0];

    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await db.query("UPDATE posts SET status = 'removed' WHERE id = ?", [post.id]);
    res.json({ message: 'Post removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
