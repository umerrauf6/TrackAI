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
  
  // Job keywords to check relevance (English + German)
  const jobKeywords = [
    'application', 'apply', 'applying', 'interview', 'job offer', 'resume', 
    'candidate', 'hiring', 'position of', 'role of', 'career opportunity',
    'thank you for applying', 'recruitment', 'offer letter', 'rejection',
    'bewerbung', 'beworben', 'eingegangen', 'unterlagen', 'vorstellungsgespräch',
    'gespräch', 'kennenlernen', 'eingangsbestätigung', 'bestätigung', 'angebot',
    'absage', 'arbeitsvertrag', 'zusage'
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
    /bewerbung bei ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /bewerbung als [a-zA-Z0-9\s\.\,\-\&]+ bei ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /vielen dank für ihre bewerbung bei ([a-zA-Z0-9\s\.\,\-\&]+)/i,
    /eingangsbestätigung[:\-\s]+([a-zA-Z0-9\s\.\,\-\&]+)/i
  ];

  for (const pattern of companyPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 1 && candidate.length < 50 && !candidate.includes('thank you') && !candidate.includes('confirm') && !candidate.includes('vielen dank')) {
        company = candidate;
        break;
      }
    }
  }

  // 2. Detect Position
  let position = 'Software Engineer';
  const positionPatterns = [
    /(?:role of|position of|job application for|for the position of|role:) ([a-zA-Z0-9\s\.\-\&\/\#]+)/i,
    /([a-zA-Z0-9\s\.\-\&\/\#]+) (?:application|role|position|job)/i,
    /bewerbung als ([a-zA-Z0-9\s\.\-\&\/\#]+)/i
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

  // 3. Detect Status (English + German)
  let status: ParsedJobInfo['status'] = 'Applied';
  
  const hasRejectionKeywords = 
    cleanSubject.includes('rejection') || 
    cleanSubject.includes('absage') || 
    cleanSubject.includes('unfortunately') || 
    cleanSubject.includes('leider') || 
    cleanSubject.includes('not select') ||
    cleanSubject.includes('unsuccessful') ||
    cleanBody.includes('not moving forward') || 
    cleanBody.includes('not be moving forward') || 
    cleanBody.includes('unable to move forward') || 
    cleanBody.includes('decided to pass') || 
    cleanBody.includes('decided not to proceed') || 
    cleanBody.includes('not proceeding') || 
    cleanBody.includes('unable to proceed') || 
    cleanBody.includes('not select') || 
    cleanBody.includes('not to select') || 
    cleanBody.includes('not selected') || 
    cleanBody.includes('unsuccessful') || 
    cleanBody.includes('unfortunately') || 
    cleanBody.includes('leider') || 
    cleanBody.includes('absage') || 
    cleanBody.includes('nicht berücksichtigt') || 
    cleanBody.includes('kein angebot') || 
    cleanBody.includes('anderweitig entschieden') || 
    cleanBody.includes('other candidates') || 
    cleanBody.includes('another candidate') || 
    cleanBody.includes('filled the position') || 
    cleanBody.includes('position has been filled') || 
    cleanBody.includes('thank you for your interest, but') || 
    cleanBody.includes('wish you the best') || 
    cleanBody.includes('wish you success') || 
    cleanBody.includes('success in your job search') || 
    cleanBody.includes('best of luck') ||
    cleanBody.includes('not the right fit') ||
    cleanBody.includes('not a match') ||
    cleanBody.includes('cannot offer you') ||
    cleanBody.includes('unable to offer') ||
    cleanBody.includes('cannot move forward') ||
    cleanBody.includes('unable to move forward') ||
    cleanBody.includes('do not see a match') ||
    cleanBody.includes('not proceeding with your application') ||
    cleanBody.includes('decided to proceed with other') ||
    cleanBody.includes('unable to proceed with your application');

  const hasOfferKeywords = 
    cleanSubject.includes('offer') || 
    cleanSubject.includes('angebot') || 
    cleanSubject.includes('zusage') || 
    cleanSubject.includes('contract') || 
    cleanSubject.includes('vertrag') || 
    cleanBody.includes('pleased to offer') || 
    cleanBody.includes('offer letter') || 
    cleanBody.includes('zusage') || 
    cleanBody.includes('angebot') || 
    cleanBody.includes('arbeitsvertrag') || 
    cleanBody.includes('employment agreement') || 
    cleanBody.includes('welcome to the team') || 
    cleanBody.includes('congratulations');

  const hasInterviewKeywords = 
    cleanSubject.includes('interview') || 
    cleanSubject.includes('gespräch') || 
    cleanSubject.includes('kennenlernen') || 
    cleanSubject.includes('screening') || 
    cleanSubject.includes('phone screen') || 
    cleanBody.includes('schedule') || 
    cleanBody.includes('interview') || 
    cleanBody.includes('gespräch') || 
    cleanBody.includes('kennenlernen') || 
    cleanBody.includes('telefonat') || 
    cleanBody.includes('vorstellungsgespräch') || 
    cleanBody.includes('phone call') || 
    cleanBody.includes('video call') || 
    cleanBody.includes('hackerank') || 
    cleanBody.includes('codility') || 
    cleanBody.includes('technical assessment') || 
    cleanBody.includes('take-home');

  if (hasRejectionKeywords) {
    status = 'Rejected';
  } else if (hasOfferKeywords) {
    status = 'Offer';
  } else if (hasInterviewKeywords) {
    status = 'Interviewing';
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
    const prompt = `You are an expert AI parser designed to scan emails in both English and German, detecting job application status updates. Analyze the email subject and body carefully.

First, determine if this email is directly related to a job application process (e.g. applying to a job, scheduling interviews, candidate follow-ups, rejections, or job offers). Set "isJobRelated" to true if it is.

CRITICAL: Set "isJobRelated" to false for:
- Account creation/authorization notifications (e.g. "An authorized OAuth Application was added", GitHub security alerts, GitLab login notifications).
- Password resets, email verifications, and multi-factor auth codes.
- Marketing promotions, sales pitches, newsletters, or purchase receipts.
Only set "isJobRelated" to true if the email is a genuine communication from a recruiter, hiring team, or automated jobs platform regarding an actual job application.

Extract the following information:
- company: The official brand name of the company hiring (e.g. "Stripe", "Google", "BMW"). Be extremely precise. Avoid generic terms like "Careers Team", "Jobs", "Recruitment", "HR", or "No-Reply". If you cannot extract a specific company, default to "Unknown Company".
- position: The job title. For German job titles, please translate them to their English equivalent (e.g. "Softwareentwickler" should be translated to "Software Engineer") for consistency. If not explicitly mentioned, default to "Software Engineer".
- salary: Expected salary or rate if mentioned, otherwise "Not Specified".
- status: Set this to exactly one of the following based on the context: 
  * "Applied" (for standard submission confirmations, application receipts, thank-you-for-applying / "Vielen Dank für Ihre Bewerbung" emails)
  * "Interviewing" (if the email talks about next steps, scheduling calls, phone screens, technical tests, or virtual chats / "Vorstellungsgespräch" / "Kennenlernen")
  * "Offer" (if an official offer letter, package details, or draft employment contract / "Arbeitsvertrag" / "Zusage" is sent)
  * "Rejected" (if they decline, pass, send a rejection, state they are not moving forward with your candidacy, or write that they cannot offer you the role / "Absage" / "Leider nicht berücksichtigt" / "Unfortunately")
- notes: A concise 1-2 sentence professional summary of what this email says and if there are immediate steps required. If the email is in German, write the summary notes in English.

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
