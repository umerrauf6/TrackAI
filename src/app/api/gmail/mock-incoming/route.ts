import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { createJob, getUserJobs, updateUser } from '@/app/utils/db-server';
import { parseEmailWithAI } from '@/app/utils/ai-parser';
import crypto from 'crypto';

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
    const { subject, sender, bodyText } = await req.json();

    if (!subject || !sender || !bodyText) {
      return NextResponse.json(
        { error: 'Subject, sender, and bodyText are required' },
        { status: 400 }
      );
    }

    const mockMessageId = 'mock_msg_' + crypto.createHash('md5').update(`${subject}-${sender}`).digest('hex');

    // Query active jobs to prevent duplicates
    const activeJobs = await getUserJobs(userId);
    const isDuplicate = activeJobs.some(
      j => j.source === 'gmail' && j.gmailMessageId === mockMessageId
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'This email has already been synced and added.' },
        { status: 409 }
      );
    }

    // Run AI parser (powered by Groq)
    const parsedInfo = await parseEmailWithAI(subject, bodyText);

    // Save job to db
    const job = await createJob(userId, {
      company: parsedInfo.company,
      position: parsedInfo.position,
      salary: parsedInfo.salary,
      status: parsedInfo.status,
      url: '',
      notes: parsedInfo.notes,
      dateApplied: new Date().toISOString().split('T')[0],
      source: 'gmail',
      gmailMessageId: mockMessageId,
      emailSender: sender,
    });

    // Update synced time
    await updateUser(userId, {
      lastSyncedTime: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      job,
      lastSyncedTime: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Mock Sync Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process mock email sync' },
      { status: 500 }
    );
  }
}
