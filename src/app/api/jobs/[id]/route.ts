import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { updateJob, deleteJob } from '@/app/utils/db-server';

function getAuthenticatedUserId(req: NextRequest): string | null {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = params.id;

  try {
    const updates = await req.json();
    const updatedJob = await updateJob(userId, jobId, updates);
    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: any) {
    console.error('Update Job API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = params.id;

  try {
    await deleteJob(userId, jobId);
    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (error: any) {
    console.error('Delete Job API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
