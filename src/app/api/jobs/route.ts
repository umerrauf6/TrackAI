import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { getUserJobs, createJob } from '@/app/utils/db-server';

export const dynamic = 'force-dynamic';

// Get current user id from JWT token in cookies
function getAuthenticatedUserId(req: NextRequest): string | null {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}

export async function GET(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jobs = await getUserJobs(userId);
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { company, position, salary, status, url, notes, dateApplied, source } = body;

    if (!company || !position || !status) {
      return NextResponse.json(
        { error: 'Company, position, and status are required fields' },
        { status: 400 }
      );
    }

    const job = await createJob(userId, {
      company,
      position,
      salary: salary || 'Not Specified',
      status,
      url: url || '',
      notes: notes || '',
      dateApplied: dateApplied || new Date().toISOString().split('T')[0],
      source: source || 'manual'
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    console.error('Create Job API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create job' }, { status: 500 });
  }
}
