import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'google_config_missing');
    return NextResponse.redirect(loginUrl.toString());
  }

  // Determine if this is a Gmail Sync Connection flow (logged-in user) or Authentication flow (not logged-in user)
  const token = req.cookies.get('token')?.value;
  const isLoggedIn = token ? verifyToken(token) !== null : false;

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  if (isLoggedIn) {
    // Escalate permission scope to read Gmail messages for job application parsing
    scopes.push('https://www.googleapis.com/auth/gmail.readonly');
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&access_type=offline` +
    `&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
