import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/utils/jwt-server';
import { getUserById, updateUser, createJob, getUserJobs } from '@/app/utils/db-server';
import { parseEmailWithAI } from '@/app/utils/ai-parser';

function getAuthenticatedUserId(req: NextRequest): string | null {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}

// Helper to request a new access token using Google Refresh Token
async function refreshGoogleAccessToken(userId: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || 'Failed to refresh Google access token');
  }

  // Update access token in the database
  await updateUser(userId, {
    googleAccessToken: data.access_token,
  });

  return data.access_token;
}

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user || !user.googleAccessToken) {
    return NextResponse.json(
      { error: 'Google Account not connected. Please connect Gmail first.' },
      { status: 400 }
    );
  }

  try {
    let accessToken = user.googleAccessToken;
    const query = encodeURIComponent('subject:("application received" OR "thank you for applying" OR "application update" OR "interview")');
    
    // 1. Fetch recent message headers from Gmail API
    let listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // If token is expired (401), try to auto-refresh using the stored refresh token
    if (listResponse.status === 401 && user.googleRefreshToken) {
      console.log('Google Access Token expired. Attempting token refresh...');
      try {
        accessToken = await refreshGoogleAccessToken(userId, user.googleRefreshToken);
        
        // Retry fetch with the fresh access token
        listResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      } catch (refreshError: any) {
        console.error('Automatic Google Token refresh failed:', refreshError);
        return NextResponse.json(
          { error: 'Gmail connection expired. Please reconnect your Gmail account from the dashboard.' },
          { status: 401 }
        );
      }
    }

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error(`Gmail API access failed with status ${listResponse.status}:`, errorText);
      return NextResponse.json(
        { error: `Failed to access Gmail API: ${listResponse.status} - ${errorText}` },
        { status: listResponse.status }
      );
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];
    const newJobsAdded = [];

    // Query active jobs from DB to prevent duplicate syncs
    const activeJobs = await getUserJobs(userId);
    const existingMessageIds = new Set(
      activeJobs.filter(j => j.source === 'gmail').map(j => j.gmailMessageId)
    );

    // 2. Fetch full body and subject for each message
    for (const msg of messages) {
      if (existingMessageIds.has(msg.id)) continue;

      let msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // Retry handle if token expired mid-loop (rare but possible)
      if (msgResponse.status === 401 && user.googleRefreshToken) {
        accessToken = await refreshGoogleAccessToken(userId, user.googleRefreshToken);
        msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }

      if (!msgResponse.ok) continue;
      const msgData = await msgResponse.json();

      const headers = msgData.payload.headers || [];
      const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
      const sender = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';

      let bodyText = '';
      if (msgData.snippet) {
        bodyText = msgData.snippet;
      }
      
      if (msgData.payload.parts) {
        const textPart = msgData.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart && textPart.body && textPart.body.data) {
          bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
        }
      } else if (msgData.payload.body && msgData.payload.body.data) {
        bodyText = Buffer.from(msgData.payload.body.data, 'base64').toString('utf8');
      }

      // 3. AI Parse Email Content (powered by Groq Llama 3)
      const parsedInfo = await parseEmailWithAI(subject, bodyText);

      // 4. Create Job in database
      const newJob = await createJob(userId, {
        company: parsedInfo.company,
        position: parsedInfo.position,
        salary: parsedInfo.salary,
        status: parsedInfo.status,
        url: '',
        notes: parsedInfo.notes,
        dateApplied: new Date().toISOString().split('T')[0],
        source: 'gmail',
        gmailMessageId: msg.id,
        emailSender: sender,
      });

      newJobsAdded.push(newJob);
    }

    // Update last sync time
    await updateUser(userId, {
      lastSyncedTime: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      jobsFound: newJobsAdded.length,
      jobs: newJobsAdded,
      lastSyncedTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gmail Sync Error:', error);
    return NextResponse.json({ error: 'Failed to synchronize with Gmail' }, { status: 500 });
  }
}
