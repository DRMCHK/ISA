import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@isa-link.org';
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'Admin@ISA2026!';

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const keyPair = nacl.box.keyPair();
  const publicKey = encodeBase64(keyPair.publicKey);
  const secretKey = encodeBase64(keyPair.secretKey);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'ISA Admin',
      username: 'admin',
      role: 'ADMIN',
      publicKey,
      bio: 'International Student Association Administrator',
    },
  });

  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║         ISA Link — Admin Account Created         ║
  ╠══════════════════════════════════════════════════╣
  ║  Email:      ${admin.email.padEnd(36)}  ║
  ║  Username:   ${admin.username.padEnd(36)}  ║
  ║  Password:   ${password.padEnd(36)}  ║
  ╠══════════════════════════════════════════════════╣
  ║  ⚠️  SAVE THE PRIVATE KEY BELOW (shown once!)   ║
  ╚══════════════════════════════════════════════════╝

  Private Key (base64):
  ${secretKey}

  Change your password immediately after first login!
  `);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
