import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { syncUserGmail } from '@/app/utils/sync-server';

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
    const jobsFound = await syncUserGmail(userId);
    return NextResponse.json({
      success: true,
      jobsFound,
      lastSyncedTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gmail Sync Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to synchronize with Gmail' }, { status: 500 });
  }
}
