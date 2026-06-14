import { getUserById, updateUser, createJob, getUserJobs } from './db-server';
import { parseEmailWithAI } from './ai-parser';

// Helper to request a new access token using Google Refresh Token
export async function refreshGoogleAccessToken(userId: string, refreshToken: string): Promise<string> {
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

// Recursive helpers to parse nested multipart mime-types and clean HTML content
function findPartByMimeType(parts: any[], mimeType: string): any {
  for (const part of parts) {
    if (part.mimeType === mimeType) {
      return part;
    }
    if (part.parts) {
      const found = findPartByMimeType(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function stripHtml(html: string): string {
  let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  return text.trim();
}

function extractBodyText(payload: any): string {
  if (!payload) return '';
  
  if (payload.body && payload.body.data) {
    const raw = Buffer.from(payload.body.data, 'base64').toString('utf8');
    if (payload.mimeType === 'text/html') {
      return stripHtml(raw);
    }
    return raw;
  }
  
  if (payload.parts && Array.isArray(payload.parts)) {
    const plainPart = findPartByMimeType(payload.parts, 'text/plain');
    if (plainPart && plainPart.body && plainPart.body.data) {
      return Buffer.from(plainPart.body.data, 'base64').toString('utf8');
    }
    
    const htmlPart = findPartByMimeType(payload.parts, 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      const rawHtml = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
      return stripHtml(rawHtml);
    }
    
    for (const part of payload.parts) {
      const text = extractBodyText(part);
      if (text) return text;
    }
  }
  
  return '';
}

// Main logic to sync a single user's Gmail inbox
export async function syncUserGmail(userId: string): Promise<number> {
  const user = await getUserById(userId);
  if (!user || !user.googleAccessToken) {
    throw new Error('Google Account not connected.');
  }

  let accessToken = user.googleAccessToken;
  const query = encodeURIComponent('subject:(application OR applied OR applying OR interview OR "thank you" OR "thanks for" OR "received your" OR confirm OR confirmation OR candidate OR update OR schedule OR offer)');

  // 1. Fetch recent message headers from Gmail API
  let listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // If token is expired (401), try to auto-refresh using the stored refresh token
  if (listResponse.status === 401 && user.googleRefreshToken) {
    console.log(`Google Access Token expired for user ${userId}. Attempting token refresh...`);
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
      console.error(`Automatic Google Token refresh failed for user ${userId}:`, refreshError);
      throw new Error('Gmail connection expired. Please reconnect Gmail account.');
    }
  }

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Failed to access Gmail API: ${listResponse.status} - ${errorText}`);
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];
  let newJobsAddedCount = 0;

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

    // Retry handle if token expired mid-loop
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

    let bodyText = extractBodyText(msgData.payload);
    if (!bodyText && msgData.snippet) {
      bodyText = msgData.snippet;
    }

    // 3. AI Parse Email Content
    const parsedInfo = await parseEmailWithAI(subject, bodyText);

    // 4. Create Job in database
    await createJob(userId, {
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

    newJobsAddedCount++;
  }

  // Update last sync time
  await updateUser(userId, {
    lastSyncedTime: new Date().toISOString(),
  });

  return newJobsAddedCount;
}
