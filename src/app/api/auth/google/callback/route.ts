import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { findOrCreateUser, updateUser } from '@/app/utils/db-server';
import { signToken } from '@/app/utils/jwt-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const loginUrl = new URL('/login', req.url);
  const dashboardUrl = new URL('/dashboard', req.url);

  if (error || !code) {
    loginUrl.searchParams.set('error', 'google_auth_failed');
    return NextResponse.redirect(loginUrl.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  // Check if a session is already active (Google Sync Connection Flow vs Login Flow)
  const sessionToken = req.cookies.get('token')?.value;
  const session = sessionToken ? verifyToken(sessionToken) : null;

  try {
    // 1. Exchange authorization code for Google tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || 'Failed to exchange tokens');
    }

    // 2. Fetch User Profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    if (!profileResponse.ok) {
      throw new Error('Failed to retrieve Google profile');
    }
    const profile = await profileResponse.json();

    // 3. Branching Flow Logic
    if (session) {
      // FLOW A: User is already logged in -> Connecting Gmail Sync Integration
      await updateUser(session.userId, {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleEmail: profile.email || 'connected@gmail.com',
        gmailSyncActive: true,
        lastSyncedTime: new Date().toISOString(),
      });

      dashboardUrl.searchParams.set('gmail_connected', 'true');
      return NextResponse.redirect(dashboardUrl.toString());
    } else {
      // FLOW B: User is not logged in -> Authenticating (Login / Signup)
      const email = profile.email;
      const name = profile.name || profile.given_name || 'Google User';

      if (!email) {
        throw new Error('Google profile did not contain an email address');
      }

      // Find or register user in SQLite/Prisma
      const user = await findOrCreateUser(email, name);

      // Sign session JWT
      const token = signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const response = NextResponse.redirect(dashboardUrl.toString());
      
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return response;
    }
  } catch (err: any) {
    console.error('Google Callback Error:', err);
    const targetUrl = session ? dashboardUrl : loginUrl;
    targetUrl.searchParams.set('error', 'google_token_exchange_failed');
    return NextResponse.redirect(targetUrl.toString());
  }
}
