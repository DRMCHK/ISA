require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@isalink.org';
  const password = process.env.ADMIN_PASSWORD || 'Admin@ISA2026!';

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'isa_link',
    port: parseInt(process.env.DB_PORT) || 3306,
  });

  const [admins] = await pool.query(
    'SELECT id, email, role, is_active FROM users WHERE email = ? OR role = ?',
    [email.toLowerCase(), 'admin']
  );

  console.log('Existing admin accounts:', admins);

  const hash = bcrypt.hashSync(password, 12);

  if (admins.length === 0) {
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, bio, can_post_pictures, can_post_videos, can_post_links, is_active)
       VALUES (?, ?, ?, 'admin', 'ISA Link Administrator', 1, 1, 1, 1)`,
      [email.toLowerCase(), hash, 'ISA Administrator']
    );
    console.log('Admin account CREATED');
  } else {
    await pool.query(
      'UPDATE users SET email = ?, password_hash = ?, role = ?, is_active = 1 WHERE id = ?',
      [email.toLowerCase(), hash, 'admin', admins[0].id]
    );
    console.log('Admin account RESET (id:', admins[0].id, ')');
  }

  const ok = bcrypt.compareSync(password, hash);
  console.log('Password verification:', ok ? 'OK' : 'FAILED');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email:   ', email.toLowerCase());
  console.log('  Password:', password);

  await pool.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
