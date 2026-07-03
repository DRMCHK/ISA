import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@isa-link.org';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'Admin@ISA2026!';

  // Password strength validation
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?`~\-]).{12,}$/;
  if (!strongPasswordRegex.test(adminPassword)) {
    throw new Error(
      'ADMIN_SEED_PASSWORD must be at least 12 characters with uppercase, lowercase, digit and symbol.'
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`✓ Admin already exists: ${adminEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Generate E2E keypair (public key stored, private key is for the admin to save)
  const keyPair = nacl.box.keyPair();
  const publicKey = encodeBase64(keyPair.publicKey);
  const privateKey = encodeBase64(keyPair.secretKey);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: 'ISA Administrator',
      username: 'admin',
      role: Role.ADMIN,
      publicKey,
    },
  });

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         ISA Link — Admin Seed Created        ║
  ╠══════════════════════════════════════════════╣
  ║  Email:    ${admin.email.padEnd(32)}  ║
  ║  Username: ${admin.username.padEnd(32)}  ║
  ║  Role:     ${admin.role.padEnd(32)}  ║
  ╠══════════════════════════════════════════════╣
  ║  SAVE THIS PRIVATE KEY (shown only once):    ║
  ║  ${privateKey.substring(0, 44)}  ║
  ╚══════════════════════════════════════════════╝
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
