import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: 'MEMBER' | 'ADMIN';
      avatarUrl: string | null;
      publicKey: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    role: 'MEMBER' | 'ADMIN';
    avatarUrl: string | null;
    publicKey: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: 'MEMBER' | 'ADMIN';
    avatarUrl: string | null;
    publicKey: string;
  }
}
