import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser } from '@/app/utils/db-server';
import { signToken } from '@/app/utils/jwt-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const loginUrl = new URL('/login', req.url);

  if (error || !code) {
    loginUrl.searchParams.set('error', 'github_auth_failed');
    return NextResponse.redirect(loginUrl.toString());
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || 'Failed to exchange GitHub tokens');
    }

    // 2. Fetch User Profile from GitHub
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json',
      },
    });
    
    if (!profileResponse.ok) {
      throw new Error('Failed to retrieve GitHub profile');
    }
    const profile = await profileResponse.json();

    // 3. Fetch User Emails from GitHub (emails can be private/null in primary profile)
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json',
      },
    });

    let email = '';
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      // Find primary email
      const primaryEmail = emails.find((e: any) => e.primary && e.verified);
      email = primaryEmail ? primaryEmail.email : (emails[0]?.email || '');
    }

    if (!email) {
      // Fallback if email list couldn't be loaded
      email = profile.email || `${profile.login}@github.com`;
    }

    const name = profile.name || profile.login || 'GitHub User';

    // 4. Find or Create User in DB
    const user = await findOrCreateUser(email, name);

    // 5. Generate secure session JWT and redirect to dashboard
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const dashboardUrl = new URL('/dashboard', req.url);
    const response = NextResponse.redirect(dashboardUrl.toString());

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (err: any) {
    console.error('GitHub Callback Error:', err);
    loginUrl.searchParams.set('error', 'github_token_exchange_failed');
    return NextResponse.redirect(loginUrl.toString());
  }
}
