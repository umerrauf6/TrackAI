import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { updateUser } from '@/app/utils/db-server';

export const dynamic = 'force-dynamic';

function getAuthenticatedUserId(req: NextRequest): string | null {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Clear Google OAuth connection fields in the database
    await updateUser(userId, {
      googleAccessToken: null as any,
      googleRefreshToken: null as any,
      googleEmail: null as any,
      gmailSyncActive: false,
      lastSyncedTime: null as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Gmail integration successfully disconnected.',
    });
  } catch (error: any) {
    console.error('Gmail Disconnect Route Error:', error);
    return NextResponse.json({ error: 'Failed to disconnect Gmail integration' }, { status: 500 });
  }
}
