interface ParsedJobInfo {
  company: string;
  position: string;
  salary: string;
  status: 'Bookmarked' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  notes: string;
  isJobRelated: boolean;
}

export const UNKNOWN_COMPANY = 'Unknown Company';
export const UNKNOWN_POSITION = 'Unknown Position';

const NOT_JOB_RELATED: ParsedJobInfo = {
  company: UNKNOWN_COMPANY,
  position: UNKNOWN_POSITION,
  salary: 'Not Specified',
  status: 'Applied',
  notes: 'Ignored non-job email.',
  isJobRelated: false
};

const includesAny = (text: string, terms: string[]) => terms.some(t => text.includes(t));

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

  // Job alerts / recommendations / newsletters are not applications the user made.
  // Only checked against the subject: ATS emails often contain these words in the footer.
  const subjectOnlyBlacklist = [
    'job alert', 'jobs for you', 'recommended jobs', 'jobs you may be interested', 'new jobs',
    'jobs matching', 'top jobs', 'job recommendations', 'jobalarm', 'neue jobs', 'passende jobs',
    'newsletter', 'webinar', 'your order', 'order confirmation', 'invoice', 'rechnung',
    'bestellbestätigung', 'subscription', 'abonnement', '% off', 'rabatt'
  ];

  return (
    blacklist.some(term => cleanSubject.includes(term) || cleanBody.includes(term)) ||
    subjectOnlyBlacklist.some(term => cleanSubject.includes(term))
  );
}

// Phrases that only show up when the email is about the user's own application.
// Generic words like "apply", "offer", "angebot" or "bestätigung" are deliberately
// left out — they appear in marketing emails and caused non-job emails to be imported.
const APPLICATION_PHRASES = [
  'your application', 'thank you for applying', 'thanks for applying', 'thank you for your application',
  'application received', 'received your application', 'application for', 'application to',
  'application status', 'application update', 'your candidacy', 'your candidature', 'your interest in the',
  'interview', 'phone screen', 'offer letter', 'job offer', 'hiring team', 'talent acquisition',
  'ihre bewerbung', 'deine bewerbung', 'bewerbung als', 'bewerbung bei', 'bewerbung für',
  'eingangsbestätigung', 'vorstellungsgespräch', 'arbeitsvertrag', 'bewerbungsprozess'
];

const REJECTION_PHRASES = [
  'not moving forward', 'not be moving forward', 'unable to move forward', 'cannot move forward',
  'decided to pass', 'decided not to proceed', 'not proceeding with your application',
  'unable to proceed with your application', 'decided to proceed with other', 'decided to move forward with other',
  'not been selected', 'were not selected', 'not to select', 'other candidates', 'another candidate',
  'filled the position', 'position has been filled', 'not the right fit', 'do not see a match',
  'cannot offer you', 'unable to offer you', 'regret to inform', 'will not be progressing',
  'not be progressing', 'unsuccessful',
  'absage', 'nicht berücksichtigen', 'nicht berücksichtigt', 'anderweitig entschieden',
  'für einen anderen kandidaten', 'für eine andere kandidatin', 'nicht weiter berücksichtigen',
  'leider mitteilen', 'leider absagen', 'leider nicht'
];

const OFFER_PHRASES = [
  'pleased to offer', 'happy to offer', 'delighted to offer', 'offer letter', 'job offer',
  'offer of employment', 'employment agreement', 'employment contract', 'welcome to the team',
  'arbeitsvertrag', 'vertragsangebot', 'zusage'
];

// "interview" alone is not enough: confirmation emails say "if your profile matches we will invite
// you to an interview". These phrases indicate an interview is actually being arranged.
const INTERVIEW_PHRASES = [
  'invite you to an interview', 'invite you for an interview', 'invitation to interview',
  'interview invitation', 'schedule an interview', 'schedule a call', 'schedule time with',
  'book a time', 'pick a time', 'select a time', 'your availability', 'phone screen',
  'video interview', 'technical interview', 'next round', 'next step in the process',
  'hackerrank', 'codility', 'technical assessment', 'take-home', 'coding challenge',
  'einladung zum vorstellungsgespräch', 'einladung zum gespräch', 'laden sie herzlich',
  'laden dich herzlich', 'kennenlerngespräch', 'terminvorschlag', 'terminvorschläge'
];

// Smart Regex Heuristics fallback parser
function parseEmailHeuristics(subject: string, body: string, sender: string = ''): ParsedJobInfo {
  if (isEmailBlacklisted(subject, body)) {
    return NOT_JOB_RELATED;
  }

  const cleanSubject = subject.toLowerCase();
  const cleanBody = body.toLowerCase();
  const text = `${cleanSubject} ${cleanBody}`;

  const isJobRelated = includesAny(text, APPLICATION_PHRASES) || /\bbewerbung\b/.test(cleanSubject);
  if (!isJobRelated) {
    return NOT_JOB_RELATED;
  }

  // 1. Detect Company
  const companyName = '([A-Z][A-Za-z0-9\\.\\&\\-]*(?: [A-Z][A-Za-z0-9\\.\\&\\-]*){0,3})';
  let company = UNKNOWN_COMPANY;
  const companyPatterns = [
    new RegExp(`application (?:to|at|with) ${companyName}`),
    new RegExp(`(?:applying|applied) (?:to|at|with) ${companyName}`),
    new RegExp(`interest in (?:joining |working at )?${companyName}`),
    new RegExp(`opportunit(?:y|ies) at ${companyName}`),
    new RegExp(`(?:role|position) at ${companyName}`),
    new RegExp(`\\bat ${companyName}(?:[\\.,!:]|$)`),
    new RegExp(`[Bb]ewerbung (?:bei|an) (?:der |die |das )?${companyName}`),
    new RegExp(`bei (?:der |die |das )?${companyName} beworben`)
  ];

  for (const pattern of companyPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 1 && candidate.length < 50) {
        company = candidate;
        break;
      }
    }
  }

  // Fallback company extraction from Sender header (display name or domain)
  if (company === UNKNOWN_COMPANY && sender) {
    // E.g. "Stripe Recruiting <recruiting@stripe.com>" -> "Stripe"
    const nameMatch = sender.match(/^"?([^"<]+)"?\s*</);
    if (nameMatch && nameMatch[1]) {
      const display = nameMatch[1]
        .replace(/\b(careers|career|recruiting|recruitment|jobs|team|hiring|talent|hr|no-?reply|notifications?|via \w+)\b/gi, '')
        .replace(/[\-|@·]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (display.length >= 2) company = display;
    }
    if (company === UNKNOWN_COMPANY) {
      const domainMatch = sender.match(/@(?:[a-zA-Z0-9\-]+\.)*?([a-zA-Z0-9\-]+)\.[a-zA-Z]{2,}>?$/);
      const ignoredDomains = ['gmail', 'googlemail', 'yahoo', 'outlook', 'hotmail', 'greenhouse', 'lever', 'workday', 'myworkday', 'ashbyhq', 'smartrecruiters', 'personio', 'workable', 'successfactors', 'icims', 'linkedin', 'indeed', 'stepstone', 'xing'];
      if (domainMatch && domainMatch[1] && !ignoredDomains.includes(domainMatch[1].toLowerCase())) {
        company = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
      }
    }
  }

  // 2. Detect Position (each pattern needs explicit context so we don't grab random sentence fragments)
  const title = '([A-Za-z0-9][A-Za-z0-9 \\.\\-\\&\\/\\#\\(\\)\\+]{1,58}?)';
  let position = UNKNOWN_POSITION;
  const positionPatterns = [
    new RegExp(`(?:role of|position of|for the position|for the role|job application for|application for(?: the)?)[:\\s]+(?:an? )?${title}(?: role| position| job)?(?: at | with | bei |[\\.,!\\n]|$)`, 'i'),
    new RegExp(`(?:role|position|job title|stelle)\\s*:\\s*${title}(?:[\\.,!\\n]|$)`, 'i'),
    new RegExp(`(?:application|applying|applied) (?:to|for) (?:the |our |an? )?${title} (?:role|position|opening|job)`, 'i'),
    new RegExp(`for (?:the|our) ${title} (?:role|position|opening)`, 'i'),
    new RegExp(`bewerbung (?:als|für die position|für die stelle|auf die stelle)(?: als)? ${title}(?: bei | an |[\\.,!\\n]|$)`, 'i'),
    new RegExp(`:\\s*${title}\\s*$`, 'i') // e.g. "Your application to Google: Software Engineer (L3)"
  ];

  for (const pattern of positionPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].replace(/^(the|a|an)\s+/i, '').replace(/\s+(at|bei|@|with)\s+.*$/i, '').trim();
      const generic = /^(your|our|this|that|it|you|us|the|application|job|role|position)$/i.test(candidate);
      if (candidate.length > 2 && candidate.length < 60 && !generic && candidate.toLowerCase() !== company.toLowerCase()) {
        position = candidate;
        break;
      }
    }
  }

  // 3. Detect Status (English + German)
  // Drop conditional sentences ("if your profile matches, we will invite you to an interview")
  // so a plain confirmation isn't mistaken for an interview invitation.
  const unconditionalText = text
    .split(/(?<=[\.!?\n])\s+/)
    .filter(sentence => !/\b(if|should|once|falls|sofern|wenn|sobald)\b/.test(sentence))
    .join(' ');
  let status: ParsedJobInfo['status'] = 'Applied';
  if (includesAny(text, REJECTION_PHRASES) || /\b(rejection|absage)\b/.test(cleanSubject)) {
    status = 'Rejected';
  } else if (includesAny(text, OFFER_PHRASES)) {
    status = 'Offer';
  } else if (includesAny(unconditionalText, INTERVIEW_PHRASES) || /\b(interview|vorstellungsgespräch)\b/.test(cleanSubject)) {
    status = 'Interviewing';
  }

  // 4. Notes & Salary
  let salary = 'Not Specified';
  const salaryMatch = body.match(/(?:salary|compensation|package|gehalt)(?:\s+is)?(?:\s+of)?(?:\s+around)?\s*([\$€£]\s?\d+[\d\s,\.]*k?)/i);
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
    isJobRelated: true
  };
}

// Normalizes whatever the LLM returned into a safe ParsedJobInfo.
// Small models sometimes return "false" as a string, omit fields, or invent statuses.
function normalizeAIResult(raw: any, subject: string): ParsedJobInfo {
  const isJobRelated = raw?.isJobRelated === true || raw?.isJobRelated === 'true';
  if (!isJobRelated) {
    return NOT_JOB_RELATED;
  }

  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);

  let company = str(raw.company, UNKNOWN_COMPANY);
  if (/^(unknown|n\/a|none|null|careers?( team)?|jobs|recruiting|recruitment|hr|hiring team|no-?reply|sender)$/i.test(company)) {
    company = UNKNOWN_COMPANY;
  }

  let position = str(raw.position, UNKNOWN_POSITION);
  if (/^(unknown|n\/a|none|null|not specified|position|role|job)$/i.test(position)) {
    position = UNKNOWN_POSITION;
  }

  // An email never means "Bookmarked" (that column is for jobs the user saved manually)
  const allowedStatuses: ParsedJobInfo['status'][] = ['Applied', 'Interviewing', 'Offer', 'Rejected'];
  const status = allowedStatuses.find(s => s.toLowerCase() === String(raw.status || '').trim().toLowerCase()) || 'Applied';

  return {
    company,
    position,
    salary: str(raw.salary, 'Not Specified'),
    status,
    notes: str(raw.notes, `Automatically synced from email with subject: "${subject}".`),
    isJobRelated: true
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// AI Groq Llama 3 API email parser
export async function parseEmailWithAI(subject: string, body: string, sender: string = ''): Promise<ParsedJobInfo> {
  if (isEmailBlacklisted(subject, body)) {
    console.log(`Programmatically filtered out blacklist email: "${subject}"`);
    return NOT_JOB_RELATED;
  }

  const apiKey = process.env.GROQ_API_KEY;

  // Fallback to heuristics if Groq API key is not configured
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY' || apiKey.trim() === '') {
    console.log('Groq API key not found. Using local regex/heuristics parser.');
    return parseEmailHeuristics(subject, body, sender);
  }

  // Truncate email body to max 4000 characters to prevent prompt pollution or context overload
  const truncatedBody = body.length > 4000 ? body.substring(0, 4000) + '... [truncated]' : body;

  const prompt = `You are an expert AI parser designed to scan emails in both English and German, detecting updates about job applications that the RECIPIENT personally submitted. Analyze the email sender (From field), subject, and body carefully.

Step 1 — decide "isJobRelated".
Set "isJobRelated" to true ONLY if the email is a message from a company, recruiter, or applicant tracking system (Greenhouse, Lever, Workday, Personio, SmartRecruiters, etc.) about a specific application of the recipient: application received confirmation, interview invitation/scheduling, assessment, offer, or rejection.

Set "isJobRelated" to false for everything else, including:
- Job alerts, job recommendations, "new jobs for you", "jobs matching your profile" digests (LinkedIn, Indeed, StepStone, XING, Glassdoor…) — these are NOT applications.
- Newsletters, career-site marketing, webinars, event invitations, recruiter cold outreach about a role the recipient never applied to.
- Shopping "offers", discounts, order confirmations, receipts, invoices, shipping updates, subscription notices.
- Account creation, OAuth/security alerts, password resets, email verifications, 2FA codes.
- Any other personal or business email. When in doubt, answer false.

Step 2 — if job related, extract:
- company: The official brand name of the company hiring (e.g. "Stripe", "Google", "BMW", "Siemens"). Use body, subject, or the Sender field (e.g. "Stripe Careers <recruiting@stripe.com>" → "Stripe"). Never use the name of the ATS or job board (Greenhouse, Lever, Workday, LinkedIn, Indeed) as the company. Avoid generic terms like "Careers Team", "Recruitment", "HR", "No-Reply". If unclear, use "Unknown Company".
- position: The exact job title applied for, as written in the email (e.g. "Senior Software Engineer", "Product Manager"). Translate German titles to English (e.g. "Softwareentwickler" → "Software Engineer"). Do NOT guess: if no title is mentioned, use "Unknown Position".
- salary: Expected salary or rate if mentioned, otherwise "Not Specified".
- status: exactly one of:
  * "Applied" — confirmation that the application was received / is being reviewed ("Vielen Dank für Ihre Bewerbung"). This includes emails that say they WILL contact you for an interview IF your profile matches — that is still "Applied".
  * "Interviewing" — the company is actually inviting you to or scheduling an interview, call, phone screen, assessment, or coding test ("Einladung zum Vorstellungsgespräch").
  * "Offer" — an official job offer, offer letter, or employment contract ("Arbeitsvertrag", "Zusage").
  * "Rejected" — they decline, will not move forward, chose another candidate ("Absage", "leider nicht berücksichtigen"). Polite phrases like "we wish you the best" inside a normal confirmation do NOT make it a rejection.
- notes: A concise 1-2 sentence professional summary in English of what this email says and any immediate next steps.

Email Sender (From): ${sender || 'Unknown Sender'}
Email Subject: ${subject}
Email Body:
${truncatedBody}

You MUST return only a valid JSON object matching this schema:
{
  "isJobRelated": boolean,
  "company": "string",
  "position": "string",
  "salary": "string",
  "status": "Applied" | "Interviewing" | "Offer" | "Rejected",
  "notes": "string"
}`;

  const requestBody = JSON.stringify({
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
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
    temperature: 0 // Deterministic parsing: the same email must always land in the same column
  });

  try {
    let response: Response | null = null;
    // Retry on rate limiting instead of silently switching to the (less accurate) heuristic parser
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: requestBody
      });
      if (response.status !== 429) break;
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep(Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * (attempt + 1), 10000));
    }

    if (!response || !response.ok) {
      const errorDetails = response ? await response.text() : 'no response';
      throw new Error(`Groq API returned status ${response?.status}: ${errorDetails}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    return normalizeAIResult(JSON.parse(content), subject);
  } catch (error) {
    console.error('Groq AI email parsing failed, falling back to heuristics:', error);
    return parseEmailHeuristics(subject, body, sender);
  }
}
