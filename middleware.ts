import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: { role?: string } | null } }) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin route protection
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/feed', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes — no auth required
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/'
        ) {
          return true;
        }

        // All other routes require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth).*)',
  ],
};
