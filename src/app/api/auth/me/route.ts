import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { getUserById } from '@/app/utils/db-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        googleEmail: user.googleEmail,
        gmailSyncActive: user.gmailSyncActive,
        lastSyncedTime: user.lastSyncedTime
      }
    });
  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ authenticated: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
