import { getSessionCookie } from 'better-auth/cookies';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const protectedPrefixes = ['/users', '/health'];
const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectTo', `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (hasSession && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/users', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/users/:path*', '/health/:path*', '/sign-in', '/sign-up', '/forgot-password'],
};
