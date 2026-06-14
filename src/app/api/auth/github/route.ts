import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback';

  if (!clientId) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'github_config_missing');
    return NextResponse.redirect(loginUrl.toString());
  }

  // Requesting user:email scope to identify and register users
  const scope = 'user:email';
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(crypto.randomUUID())}`;

  return NextResponse.redirect(authUrl);
}
