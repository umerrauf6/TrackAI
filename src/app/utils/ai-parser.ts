interface ParsedJobInfo {
  company: string;
  position: string;
  salary: string;
  status: 'Bookmarked' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  notes: string;
  isJobRelated: boolean;
}

// Programmatic filter for non-job, account/security confirmation emails
function isEmailBlacklisted(subject: string, body: string): boolean {
  const cleanSubject = subject.toLowerCase();
  const cleanBody = body.toLowerCase();

  const blacklist = [
    'oauth', 'security alert', 'authorized application', 'authorized app', 
    'password reset', 'verify your email', 'two-factor', '2fa', 
    'sign-in', 'signed in', 'login attempt', 'action required:', 'security key',
    'connected to your account', 'device sign-in', 'account access', 'connected app',
    'revoke access', 'revocation'
  ];

  return blacklist.some(term => cleanSubject.includes(term) || cleanBody.includes(term));
}

// Smart Regex Heuristics fallback parser
function parseEmailHeuristics(subject: string, body: string): ParsedJobInfo {
  if (isEmailBlacklisted(subject, body)) {
    return {
      company: 'Unknown Company',
      position: 'Software Engineer',
      salary: 'Not Specified',
      status: 'Applied',
      notes: 'Ignored account/security email.',
      isJobRelated: false
    };
  }

  const cleanSubject = subject.toLowerCase();
  const cleanBody = body.toLowerCase();
  
  // Job keywords to check relevance
  const jobKeywords = [
    'application', 'apply', 'applying', 'interview', 'job offer', 'resume', 
    'candidate', 'hiring', 'position of', 'role of', 'career opportunity',
    'thank you for applying', 'recruitment', 'offer letter', 'rejection'
  ];
  const isJobRelated = jobKeywords.some(kw => cleanSubject.includes(kw) || cleanBody.includes(kw));

  // 1. Detect Company
  let company = 'Unknown Company';
  const companyPatterns = [
    /your application to ([a-zA-Z0-9\s\.\,\-\&]+)(?: has| was| received| confirmation)/i,
    /applying to ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /application at ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /thank you for applying to ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /opportunity at ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /([a-zA-Z0-9\s\.\,\-\&]+) application update/i,
    /career opportunities at ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /([a-zA-Z0-9\s\.\,\-\&]+) team/i,
  ];

  for (const pattern of companyPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 1 && candidate.length < 50 && !candidate.includes('thank you') && !candidate.includes('confirm')) {
        company = candidate;
        break;
      }
    }
  }

  // 2. Detect Position
  let position = 'Software Engineer';
  const positionPatterns = [
    /(?:role of|position of|job application for|for the position of|role:) ([a-zA-Z0-9\s\.\-\&\/\#]+)/i,
    /([a-zA-Z0-9\s\.\-\&\/\#]+) (?:application|role|position|job)/i
  ];
  
  for (const pattern of positionPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && candidate.length < 60) {
        position = candidate;
        break;
      }
    }
  }

  if (company.toLowerCase() === position.toLowerCase()) {
    company = 'Selected Company';
  }

  // 3. Detect Status
  let status: ParsedJobInfo['status'] = 'Applied';
  if (cleanSubject.includes('interview') || cleanBody.includes('schedule an interview') || cleanBody.includes('phone screen') || cleanBody.includes('chat about your application')) {
    status = 'Interviewing';
  } else if (cleanSubject.includes('offer') || cleanBody.includes('pleased to offer') || cleanBody.includes('letter of offer')) {
    status = 'Offer';
  } else if (cleanBody.includes('not moving forward') || cleanBody.includes('unfortunately') || cleanBody.includes('pursue other candidates') || cleanBody.includes('decided to pass')) {
    status = 'Rejected';
  }

  // 4. Notes & Salary
  let salary = 'Not Specified';
  const salaryMatch = body.match(/(?:salary|compensation|package|offering)(?:\s+is)?(?:\s+of)?(?:\s+around)?\s*([\$€£]\d+[\d\s,]*k?)/i);
  if (salaryMatch && salaryMatch[1]) {
    salary = salaryMatch[1].trim();
  }

  const notes = `Automatically synced from email with subject: "${subject}". Parsed via local parser engine.`;

  return {
    company,
    position,
    salary,
    status,
    notes,
    isJobRelated: isJobRelated && company !== 'Unknown Company'
  };
}

// AI Groq Llama 3 API email parser
export async function parseEmailWithAI(subject: string, body: string): Promise<ParsedJobInfo> {
  if (isEmailBlacklisted(subject, body)) {
    console.log(`Programmatically filtered out blacklist email: "${subject}"`);
    return {
      company: 'Unknown Company',
      position: 'Software Engineer',
      salary: 'Not Specified',
      status: 'Applied',
      notes: 'Ignored account/security email.',
      isJobRelated: false
    };
  }

  const apiKey = process.env.GROQ_API_KEY;

  // Fallback to heuristics if Groq API key is not configured
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY' || apiKey.trim() === '') {
    console.log('Groq API key not found. Using local regex/heuristics parser.');
    return parseEmailHeuristics(subject, body);
  }

  try {
    const prompt = `You are an expert AI parser designed to scan emails and detect job application status updates. Analyze the email subject and body carefully.

First, determine if this email is directly related to a job application process (e.g. applying to a job, scheduling interviews, candidate follow-ups, rejections, or job offers). Set "isJobRelated" to true if it is.

CRITICAL: Set "isJobRelated" to false for:
- Account creation/authorization notifications (e.g. "An authorized OAuth Application was added", GitHub security alerts, GitLab login notifications).
- Password resets, email verifications, and multi-factor auth codes.
- Marketing promotions, sales pitches, newsletters, or purchase receipts.
Only set "isJobRelated" to true if the email is a genuine communication from a recruiter, hiring team, or automated jobs platform regarding an actual job application.

Extract the following information:
- company: The official brand name of the company hiring (e.g. "Stripe", "Google"). Be extremely precise. Avoid generic terms like "Careers Team", "Jobs", "Recruitment", "HR", or "No-Reply". If you cannot extract a specific company, default to "Unknown Company".
- position: The job title (e.g. "Senior Frontend Architect", "Software Engineer"). If not explicitly mentioned, default to "Software Engineer".
- salary: Expected salary or rate if mentioned, otherwise "Not Specified".
- status: Set this to exactly one of the following based on the context: 
  * "Applied" (for standard submission confirmations, application receipts, thank-you-for-applying emails)
  * "Interviewing" (if the email talks about next steps, scheduling calls, phone screens, technical tests, or virtual chats)
  * "Offer" (if an official offer letter or package is details)
  * "Rejected" (if they pass, decline, or are not moving forward with your candidacy)
- notes: A concise 1-2 sentence professional summary of what this email says and if there are immediate steps required.

Email Subject: ${subject}
Email Body:
${body}

You MUST return only a valid JSON object matching this schema:
{
  "isJobRelated": boolean,
  "company": "string",
  "position": "string",
  "salary": "string",
  "status": "Applied" | "Interviewing" | "Offer" | "Rejected",
  "notes": "string"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an email parsing agent that strictly outputs JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1 // Keep temperature low for deterministic parsing
      })
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errorDetails}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const parsedJson = JSON.parse(content) as ParsedJobInfo;
    
    // Safety check on status
    const allowedStatuses: ParsedJobInfo['status'][] = ['Bookmarked', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
    if (!allowedStatuses.includes(parsedJson.status)) {
      parsedJson.status = 'Applied';
    }
    
    // Safety check on isJobRelated
    if (parsedJson.company === 'Unknown Company' || !parsedJson.company) {
      parsedJson.isJobRelated = false;
    }
    
    return parsedJson;
  } catch (error) {
    console.error('Groq AI email parsing failed, falling back to heuristics:', error);
    return parseEmailHeuristics(subject, body);
  }
}
