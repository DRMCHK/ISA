const express = require('express');
const crypto = require('crypto');
const { getPool } = require('../db/database');
const { authenticate, requireAdminOnly } = require('../middleware/auth');

const router = express.Router();

function generateInviteCode() {
  return crypto.randomBytes(16).toString('hex');
}

async function isGroupMember(groupId, userId) {
  const db = getPool();
  const [rows] = await db.query(
    'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId]
  );
  return rows[0] || null;
}

async function isGroupLeader(groupId, userId) {
  const member = await isGroupMember(groupId, userId);
  return member && (member.role === 'leader' || member.role === 'member');
}

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [groups] = await db.query(`
      SELECT g.*, gm.role AS my_role,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
      ORDER BY g.name
    `, [req.user.id]);

    res.json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load groups' });
  }
});

router.post('/', authenticate, requireAdminOnly, async (req, res) => {
  try {
    const { name, description, groupType } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });

    const validTypes = ['directive', 'execution', 'general'];
    const type = validTypes.includes(groupType) ? groupType : 'general';

    const db = getPool();
    const inviteCode = generateInviteCode();

    const [result] = await db.query(
      'INSERT INTO groups (name, description, group_type, created_by, invite_code) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), (description || '').trim(), type, req.user.id, inviteCode]
    );

    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'leader']
    );

    const [groups] = await db.query('SELECT * FROM groups WHERE id = ?', [result.insertId]);
    res.status(201).json({ group: groups[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/join/:inviteCode', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [groups] = await db.query('SELECT * FROM groups WHERE invite_code = ?', [req.params.inviteCode]);
    if (groups.length === 0) return res.status(404).json({ error: 'Invalid invite link' });

    const group = groups[0];
    const existing = await isGroupMember(group.id, req.user.id);
    if (existing) return res.json({ group, alreadyMember: true });

    res.json({ group, alreadyMember: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load invite' });
  }
});

router.post('/join/:inviteCode', authenticate, async (req, res) => {
  try {
    const db = getPool();
    const [groups] = await db.query('SELECT * FROM groups WHERE invite_code = ?', [req.params.inviteCode]);
    if (groups.length === 0) return res.status(404).json({ error: 'Invalid invite link' });

    const group = groups[0];
    const existing = await isGroupMember(group.id, req.user.id);
    if (existing) return res.json({ group, message: 'Already a member' });

    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [group.id, req.user.id, 'member']
    );

    res.json({ group, message: 'Joined group successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

router.get('/admin/all', authenticate, requireAdminOnly, async (req, res) => {
  try {
    const db = getPool();
    const [groups] = await db.query(`
      SELECT g.*, u.full_name AS creator_name,
             (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
      FROM groups g
      JOIN users u ON u.id = g.created_by
      ORDER BY g.created_at DESC
    `);
    res.json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load groups' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const member = await isGroupMember(groupId, req.user.id);
    if (!member && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const db = getPool();
    const [groups] = await db.query('SELECT * FROM groups WHERE id = ?', [groupId]);
    if (groups.length === 0) return res.status(404).json({ error: 'Group not found' });

    const [members] = await db.query(`
      SELECT gm.user_id, gm.role, gm.joined_at, u.full_name, u.avatar_url, u.email
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.role DESC, u.full_name
    `, [groupId]);

    res.json({ group: groups[0], members, myRole: member?.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load group' });
  }
});

router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const member = await isGroupMember(groupId, req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!member && !isAdmin) return res.status(403).json({ error: 'Not authorized' });
    if (member && member.role !== 'leader' && !isAdmin) {
      return res.status(403).json({ error: 'Only group leaders can add members' });
    }

    const db = getPool();
    const [users] = await db.query('SELECT id FROM users WHERE id = ? AND is_active = 1', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const existing = await isGroupMember(groupId, userId);
    if (existing) return res.status(409).json({ error: 'User already in group' });

    await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [groupId, userId, 'member']
    );

    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    const member = await isGroupMember(groupId, req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!member && !isAdmin) return res.status(403).json({ error: 'Not authorized' });
    if (member && member.role !== 'leader' && !isAdmin && targetUserId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to remove this member' });
    }

    const db = getPool();
    await db.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, targetUserId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    if (!(await isGroupMember(groupId, req.user.id))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const db = getPool();
    const [messages] = await db.query(`
      SELECT gm.*, u.full_name, u.avatar_url
      FROM group_messages gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.created_at ASC
      LIMIT 200
    `, [groupId]);

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const groupId = parseInt(req.params.id);
    if (!(await isGroupMember(groupId, req.user.id))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const db = getPool();
    const [result] = await db.query(
      'INSERT INTO group_messages (group_id, user_id, content) VALUES (?, ?, ?)',
      [groupId, req.user.id, content.trim()]
    );

    const [rows] = await db.query(`
      SELECT gm.*, u.full_name, u.avatar_url
      FROM group_messages gm JOIN users u ON u.id = gm.user_id WHERE gm.id = ?
    `, [result.insertId]);

    const io = req.app.get('io');
    if (io) io.to(`group_${groupId}`).emit('group_message', rows[0]);

    res.status(201).json({ message: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
