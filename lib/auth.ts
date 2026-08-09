import { type AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
// IMPORTANT: relative import — this file is used by NextAuth (server-side) but also
// indirectly loaded by tsx. Keep it relative to avoid @/ alias resolution failures.
import { prisma } from './prisma';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            passwordHash: true,
            role: true,
            avatarUrl: true,
            publicKey: true,
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        // Update online status
        await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: true },
        }).catch(() => undefined);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl ?? undefined,
          publicKey: user.publicKey,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username: string }).username;
        token.role = (user as { role: string }).role;
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl;
        token.publicKey = (user as { publicKey: string }).publicKey;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.role = token.role as string;
      session.user.avatarUrl = token.avatarUrl as string | undefined;
      session.user.publicKey = token.publicKey as string;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await prisma.user.update({
          where: { id: token.id as string },
          data: { isOnline: false, lastSeen: new Date() },
        }).catch(() => undefined);
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
