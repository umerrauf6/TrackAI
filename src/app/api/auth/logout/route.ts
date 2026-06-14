import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0), // Expire immediately
  });

  return response;
}
