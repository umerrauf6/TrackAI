import { getUserById, updateUser, createJob, getUserJobs, updateJob, JobApplication } from './db-server';
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

export function cleanPosition(pos: string): string {
  return pos
    .toLowerCase()
    .replace(/\b(senior|sr|junior|jr|lead|staff|principal|intern|co-op|coop|apprentice|contractor|temp)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function isSimilarPosition(pos1: string, pos2: string): boolean {
  const p1 = cleanPosition(pos1);
  const p2 = cleanPosition(pos2);
  
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  
  // Guard against matching different roles with shared terms (e.g. frontend vs backend)
  const hasFrontend1 = p1.includes('frontend') || p1.includes('ui') || p1.includes('client');
  const hasFrontend2 = p2.includes('frontend') || p2.includes('ui') || p2.includes('client');
  const hasBackend1 = p1.includes('backend') || p1.includes('server') || p1.includes('api');
  const hasBackend2 = p2.includes('backend') || p2.includes('server') || p2.includes('api');
  
  if ((hasFrontend1 !== hasFrontend2) || (hasBackend1 !== hasBackend2)) {
    return false;
  }
  
  // Only treat as similar if the substring match is substantial (≥80% of the longer string).
  // This prevents "softwareengineer" from matching "softwareengineerbackendteamlead".
  if (p1.includes(p2) || p2.includes(p1)) {
    const shorter = Math.min(p1.length, p2.length);
    const longer = Math.max(p1.length, p2.length);
    return shorter / longer >= 0.8;
  }
  
  return false;
}

export function normalizeCompanyName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/\b(gmbh|llc|inc|co|corp|corporation|ltd|ag|s\.a\.|team|careers|recruiting|recruitment|jobs|hiring|hr|solutions|technologies|tech|systems)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return normalized || name.toLowerCase().trim();
}

export async function upsertGmailJob(
  userId: string,
  parsedInfo: {
    company: string;
    position: string;
    salary: string;
    status: 'Bookmarked' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
    notes: string;
    isJobRelated: boolean;
  },
  messageId: string,
  sender: string,
  activeJobs: JobApplication[],
  emailSubject?: string,
  emailBody?: string
 ): Promise<JobApplication> {
  // Check if job for same company AND similar position already exists.
  // Rejected jobs ARE included in this check — if the same company + same position
  // appears again, it is truly a duplicate and should not be re-added.
  // If the position name is different, isSimilarPosition will return false and
  // a brand-new entry will be created (even for the same company).
  const existingJob = activeJobs.find(j => {
    const dbCompany = j.company.toLowerCase().trim();
    const parsedCompany = parsedInfo.company.toLowerCase().trim();
    
    let companyMatches = dbCompany === parsedCompany;
    
    if (!companyMatches) {
      const normDb = normalizeCompanyName(dbCompany);
      const normParsed = normalizeCompanyName(parsedCompany);
      if (normDb === normParsed) {
        companyMatches = true;
      } else if (normDb.length >= 3 && normParsed.length >= 3 && (normDb.includes(normParsed) || normParsed.includes(normDb))) {
        companyMatches = true;
      }
    }
    
    if (!companyMatches) return false;
    
    // If the company matches, verify the position is also similar
    return isSimilarPosition(j.position, parsedInfo.position);
  });

  if (existingJob) {
    const STATUS_RANKS: Record<string, number> = {
      'Bookmarked': 0,
      'Applied': 1,
      'Interviewing': 2,
      'Rejected': 3,
      'Offer': 4
    };

    const currentRank = STATUS_RANKS[existingJob.status] ?? -1;
    const newRank = STATUS_RANKS[parsedInfo.status] ?? -1;
    const shouldUpdateStatus = newRank > currentRank;

    // Format date for notes update
    const dateObj = new Date();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    const formattedDate = `${mm}/${dd}/${yyyy}`;

    let updatedNotes = existingJob.notes || '';
    // Only append notes if this specific email hasn't been seen before on this job
    const alreadySeen = existingJob.gmailMessageId
      ? existingJob.gmailMessageId.split(',').map(id => id.trim()).includes(messageId)
      : false;
    if (parsedInfo.notes && !alreadySeen) {
      const updateHeader = `\n\n[Update ${formattedDate}] `;
      updatedNotes = updatedNotes ? `${updatedNotes}${updateHeader}${parsedInfo.notes}` : `[Update ${formattedDate}] ${parsedInfo.notes}`;
    }

    // Append the messageId to comma-separated list of gmailMessageIds
    let updatedGmailMessageId = messageId;
    if (existingJob.gmailMessageId) {
      const messageIds = existingJob.gmailMessageId.split(',').map(id => id.trim()).filter(Boolean);
      if (!messageIds.includes(messageId)) {
        messageIds.push(messageId);
      }
      updatedGmailMessageId = messageIds.join(',');
    }

    const updates: any = {
      notes: updatedNotes,
      gmailMessageId: updatedGmailMessageId,
      source: 'gmail',
      emailSubject,
      emailBody,
      emailSender: sender,
    };

    if (shouldUpdateStatus) {
      updates.status = parsedInfo.status;
    }

    return await updateJob(userId, existingJob.id, updates);
  } else {
    return await createJob(userId, {
      company: parsedInfo.company,
      position: parsedInfo.position,
      salary: parsedInfo.salary,
      status: parsedInfo.status,
      url: '',
      notes: parsedInfo.notes,
      dateApplied: new Date().toISOString().split('T')[0],
      source: 'gmail',
      gmailMessageId: messageId,
      emailSender: sender,
      emailSubject,
      emailBody,
    });
  }
}

// Main logic to sync a single user's Gmail inbox
export async function syncUserGmail(userId: string): Promise<number> {
  const user = await getUserById(userId);
  if (!user || !user.googleAccessToken) {
    throw new Error('Google Account not connected.');
  }

  let accessToken = user.googleAccessToken;
  const query = encodeURIComponent('subject:(application OR applied OR applying OR interview OR "thank you" OR "thanks for" OR "received your" OR confirm OR confirmation OR candidate OR update OR schedule OR offer OR bewerbung OR beworben OR eingegangen OR vorstellungsgespräch OR gespräch OR kennenlernen OR eingangsbestätigung OR bestätigung OR angebot OR absage)');

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
    if (listResponse.status === 403) {
      await updateUser(userId, { gmailSyncActive: false });
      throw new Error('Gmail API access denied (insufficient permissions). Please reconnect your Google Account and check all required permission boxes.');
    }
    throw new Error(`Failed to access Gmail API: ${listResponse.status} - ${errorText}`);
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];
  let newJobsAddedCount = 0;

  // Query active jobs from DB to prevent duplicate syncs.
  // IMPORTANT: We deliberately exclude message IDs from Rejected jobs.
  // Why: a previous sync may have merged a *new* application email's ID into
  // an old rejected job entry (same company, matched position). That would
  // permanently skip the email on all future syncs. By excluding Rejected job
  // IDs here, those emails are re-evaluated — if the position is different, a
  // brand-new job entry is correctly created.
  const activeJobs = await getUserJobs(userId);
  const existingMessageIds = new Set<string>();
  for (const j of activeJobs) {
    if (j.status === 'Rejected') continue; // let rejected-job emails be re-evaluated
    if (j.gmailMessageId) {
      j.gmailMessageId.split(',').forEach(id => {
        const trimmed = id.trim();
        if (trimmed) existingMessageIds.add(trimmed);
      });
    }
  }

  // 2. Fetch full body and subject for each message
  for (const msg of messages) {
    if (existingMessageIds.has(msg.id)) {
      console.log(`Skipping message ${msg.id}: already tracked in DB.`);
      continue;
    }

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
    console.log(`Message ${msg.id} ("${subject}") parsed:`, JSON.stringify({ isJobRelated: parsedInfo.isJobRelated, company: parsedInfo.company, position: parsedInfo.position, status: parsedInfo.status }));

    // Skip if the email is classified as not job related
    if (parsedInfo.isJobRelated === false) {
      console.log(`Skipping message ${msg.id} ("${subject}"): classified as not job-related.`);
      continue;
    }

    // 4. Create or Update Job in database
    const updatedJob = await upsertGmailJob(userId, parsedInfo, msg.id, sender, activeJobs, subject, bodyText);

    // Update local activeJobs array and existingMessageIds set
    const jobIndex = activeJobs.findIndex(j => j.id === updatedJob.id);
    if (jobIndex > -1) {
      activeJobs[jobIndex] = updatedJob;
    } else {
      activeJobs.push(updatedJob);
    }
    existingMessageIds.add(msg.id);

    newJobsAddedCount++;
  }

  // Update last sync time
  await updateUser(userId, {
    lastSyncedTime: new Date().toISOString(),
  });

  return newJobsAddedCount;
}
