import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Define protected and public routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');
  const isAuthRoute = pathname === '/' || pathname === '/login';

  // If there's no token and user is trying to access protected routes, redirect to landing page '/'
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If there is a token and user is visiting landing page '/' or login page '/login', redirect to '/dashboard'
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Matching Paths
export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/profile/:path*'
  ],
};
