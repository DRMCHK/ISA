const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'isa_link',
      port: parseInt(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 50,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }
  return pool;
}

async function initDatabase() {
  const rootPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 2,
  });

  const dbName = process.env.DB_NAME || 'isa_link';
  await rootPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await rootPool.end();

  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      bio TEXT DEFAULT '',
      avatar_url VARCHAR(500) DEFAULT '',
      role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
      can_post_pictures TINYINT(1) DEFAULT 1,
      can_post_videos TINYINT(1) DEFAULT 1,
      can_post_links TINYINT(1) DEFAULT 1,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      media_type ENUM('text', 'image', 'video', 'link') DEFAULT 'text',
      media_url VARCHAR(500) DEFAULT '',
      link_url VARCHAR(500) DEFAULT '',
      link_title VARCHAR(255) DEFAULT '',
      status ENUM('published', 'pending', 'flagged', 'removed') DEFAULT 'published',
      moderation_score FLOAT DEFAULT 0,
      moderation_flags JSON DEFAULT ('[]'),
      likes_count INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_posts_user (user_id),
      INDEX idx_posts_status (status),
      INDEX idx_posts_created (created_at DESC)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      status ENUM('published', 'flagged', 'removed') DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_comments_post (post_id)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_like (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('report', 'advice', 'suggestion') NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      reporter_id INT NULL,
      is_anonymous TINYINT(1) DEFAULT 1,
      status ENUM('open', 'reviewing', 'resolved', 'dismissed') DEFAULT 'open',
      admin_notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_reports_status (status)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS moderation_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content_type VARCHAR(50) NOT NULL,
      content_id INT NOT NULL,
      action VARCHAR(50) NOT NULL,
      reason TEXT,
      moderator_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_id INT NOT NULL,
      addressee_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_friendship (requester_id, addressee_id),
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_friendships_addressee (addressee_id, status)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user1_id INT NOT NULL,
      user2_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_conversation (user1_id, user2_id),
      FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS dm_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_dm_conversation (conversation_id, created_at)
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      group_type ENUM('directive', 'execution', 'general') DEFAULT 'general',
      created_by INT NOT NULL,
      invite_code VARCHAR(32) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      user_id INT NOT NULL,
      role ENUM('member', 'leader') DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_group_member (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS group_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_group_messages (group_id, created_at)
    ) ENGINE=InnoDB
  `);

  const [admins] = await db.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
  if (admins.length === 0) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@ISA2026!', 12);
    await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, bio, can_post_pictures, can_post_videos, can_post_links)
       VALUES (?, ?, ?, 'admin', 'ISA Link Administrator', 1, 1, 1)`,
      [process.env.ADMIN_EMAIL || 'admin@isalink.org', hash, 'ISA Administrator']
    );
    console.log('Default admin account created');
  }
}

module.exports = { getPool, initDatabase };
