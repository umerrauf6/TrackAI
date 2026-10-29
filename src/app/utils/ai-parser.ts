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

// "Data Analyst (m/w/d)" -> "Data Analyst"
const cleanTitle = (title: string) =>
  title.replace(/\s*[\(\[]\s*(m|w|f|d|x|div|all genders?|alle geschlechter|gn\*?)(\s*[\/\|,]\s*(m|w|f|d|x|div))*\s*[\)\]]/gi, '').replace(/\s+/g, ' ').trim();

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
  'application status', 'application update', 'your candidacy', 'your candidature', 'your interest in',
  'thank you for your interest', 'thanks for your interest', 'thank you for considering',
  'interview', 'phone screen', 'offer letter', 'job offer', 'hiring team', 'talent acquisition',
  'bewerbung', 'ihr interesse an', 'dein interesse an', 'ihrem interesse an', 'deinem interesse an',
  'eingangsbestätigung', 'vorstellungsgespräch', 'arbeitsvertrag', 'bewerbungsprozess'
];

const REJECTION_PHRASES = [
  // English
  'not moving forward', 'not be moving forward', "won't be moving forward", 'not to move forward',
  'unable to move forward', 'cannot move forward', "can't move forward", 'not able to move forward',
  'move forward with other', 'moving forward with other', 'proceed with other', 'proceeding with other',
  'pursue other', 'pursuing other', 'go with other', 'go with another', 'other candidates', 'another candidate',
  'other applicants', 'another applicant', 'more closely match', 'more closely aligned', 'better match',
  'decided to pass', 'decided not to proceed', 'decided not to continue', 'decided against',
  'not proceeding with your', 'not be proceeding', "won't be proceeding", 'unable to proceed with your',
  'not been selected', 'were not selected', 'not to select', 'not selected for',
  'filled the position', 'position has been filled', 'role has been filled', 'position has been closed',
  'not the right fit', 'not a fit', 'do not see a match', "don't see a match",
  'cannot offer you', 'unable to offer you', 'not able to offer you', "can't offer you",
  'regret to inform', 'regrettably', 'will not be progressing', 'not be progressing', 'not progress your',
  'unsuccessful', 'not be taking your application', 'not to pursue your',
  // German
  'absage', 'nicht berücksichtigen', 'nicht berücksichtigt', 'anderweitig entschieden', 'anderweitig besetzt',
  'für einen anderen kandidaten', 'für eine andere kandidatin', 'für andere bewerber', 'für eine andere bewerb',
  'für einen anderen bewerb', 'andere kandidat', 'nicht weiter berücksichtigen', 'nicht weiter zu verfolgen',
  'nicht weiterverfolgen', 'nicht weiter verfolgen', 'nicht in die engere auswahl', 'keine positive rückmeldung',
  'stelle bereits besetzt', 'stelle wurde besetzt', 'leider mitteilen', 'leider müssen wir', 'leider können wir',
  'leider absagen', 'leider nicht', 'gegen ihre bewerbung', 'gegen deine bewerbung'
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

// Curly apostrophes ("won’t") would otherwise never match the phrase lists
const normalizeQuotes = (text: string) => text.replace(/[\u2018\u2019\u201B\u2032]/g, "'");

function looksLikeApplicationEmail(subject: string, body: string): boolean {
  return includesAny(normalizeQuotes(`${subject} ${body}`).toLowerCase(), APPLICATION_PHRASES);
}

// Smart Regex Heuristics fallback parser
function parseEmailHeuristics(subject: string, body: string, sender: string = ''): ParsedJobInfo {
  if (isEmailBlacklisted(subject, body) || !looksLikeApplicationEmail(subject, body)) {
    return NOT_JOB_RELATED;
  }
  return extractJobDetails(subject, body, sender);
}

// Rule-based extraction of company, title and status. Used on its own when the AI is unavailable,
// and to cross-check / fill in the AI result otherwise.
function extractJobDetails(subject: string, body: string, sender: string = ''): ParsedJobInfo {
  subject = normalizeQuotes(subject);
  body = normalizeQuotes(body);
  const cleanSubject = subject.toLowerCase();
  const cleanBody = body.toLowerCase();
  const text = `${cleanSubject} ${cleanBody}`;

  // 1. Detect Company
  const companyName = '([A-Z0-9][A-Za-z0-9\\&\\-]*(?: [A-Z][A-Za-z0-9\\&\\-]*){0,3})';
  let company = UNKNOWN_COMPANY;
  const companyPatterns = [
    new RegExp(`application (?:to|at|with) ${companyName}`),
    new RegExp(`(?:applying|applied) (?:to|at|with) ${companyName}`),
    new RegExp(`interest in (?:joining |working (?:at|for) )?${companyName}`),
    new RegExp(`[Ii]nteresse an (?:der |die |das |einer Tätigkeit bei )?${companyName}`),
    new RegExp(`opportunit(?:y|ies) at ${companyName}`),
    new RegExp(`(?:role|position) at ${companyName}`),
    new RegExp(`\\bat ${companyName}(?=[\\.,!:;\\)]|\\s+[a-z]|\\s*$)`),
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
        .replace(/\b(careers|career|recruiting|recruitment|jobs|team|hiring|talent acquisition|talent|hr|no-?reply|notifications?|via \w+|successfactors|greenhouse|workday|lever|ashby|smartrecruiters)\b/gi, '')
        .replace(/[\-|@·]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (display.length >= 2) company = display;
    }
    if (company === UNKNOWN_COMPANY) {
      const domainMatch = sender.match(/@(?:[a-zA-Z0-9\-]+\.)*?([a-zA-Z0-9\-]+)\.[a-zA-Z]{2,}>?$/);
      const ignoredDomains = ['gmail', 'googlemail', 'yahoo', 'outlook', 'hotmail', 'gmx', 'web', 'greenhouse', 'greenhouse-mail', 'lever', 'hire', 'workday', 'myworkday', 'ashbyhq', 'smartrecruiters', 'workable', 'successfactors', 'icims', 'recruitee', 'teamtailor', 'join', 'jobvite', 'bamboohr', 'taleo', 'linkedin', 'indeed', 'stepstone', 'xing'];
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
    new RegExp(`(?:for|in) (?:the|our) ${title} (?:role|position|opening)`, 'i'),
    new RegExp(`bewerbung (?:als|für die position|für die stelle|auf die stelle)(?: als)? ${title}(?: bei | an |[\\.,!\\n]|$)`, 'i'),
    new RegExp(`:\\s*${title}\\s*$`, 'i') // e.g. "Your application to Google: Software Engineer (L3)"
  ];

  for (const pattern of positionPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match && match[1]) {
      const candidate = cleanTitle(match[1].replace(/^(the|a|an)\s+/i, '').replace(/\s+(at|bei|@|with)\s+.*$/i, ''));
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

  let position = cleanTitle(str(raw.position, UNKNOWN_POSITION)) || UNKNOWN_POSITION;
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

// Names of applicant-tracking systems and job boards: these send the emails but are never the employer
const ATS_OR_BOARD = /^(greenhouse|lever|workday|myworkday|ashby|ashbyhq|smartrecruiters|personio recruiting|workable|successfactors|sap successfactors|icims|recruitee|teamtailor|join|jobvite|bamboohr|taleo|linkedin|indeed|stepstone|xing|glassdoor|talent acquisition( team)?|recruiting team|careers team|hr team)$/i;

// The small Llama model regularly (a) answers "Unknown" for company/title even when they're in the
// email and (b) labels polite rejections ("thank you for your interest… we decided to move forward
// with other candidates") as "Applied". The rule-based extractor is precise on both, so use it to
// fill the gaps and to catch rejections the model missed.
function combineWithRules(aiResult: ParsedJobInfo, subject: string, body: string, sender: string): ParsedJobInfo {
  const rules = extractJobDetails(subject, body, sender);

  if (!aiResult.isJobRelated) {
    // Trust the AI's "not a job email" unless the rules see a clear application email with a status change
    const clearStatusChange = rules.status === 'Rejected' || rules.status === 'Interviewing' || rules.status === 'Offer';
    return clearStatusChange && looksLikeApplicationEmail(subject, body) ? rules : aiResult;
  }

  return {
    ...aiResult,
    company: aiResult.company === UNKNOWN_COMPANY || ATS_OR_BOARD.test(aiResult.company) ? rules.company : aiResult.company,
    position: aiResult.position === UNKNOWN_POSITION ? rules.position : aiResult.position,
    status: rules.status === 'Rejected' ? 'Rejected' : aiResult.status
  };
}

const DEFAULT_GROQ_MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

// Make it visible on the card when the AI didn't run, instead of failing silently
function withFallbackNote(result: ParsedJobInfo, reason: string): ParsedJobInfo {
  if (!result.isJobRelated) return result;
  return { ...result, notes: `${result.notes} [AI not used: ${reason}]` };
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
    console.warn('GROQ_API_KEY is not set. Using local rule-based parser only.');
    return withFallbackNote(parseEmailHeuristics(subject, body, sender), 'GROQ_API_KEY is not set');
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
- position: The exact job title applied for. Look in the SUBJECT first (e.g. "Your application: Senior Data Analyst (m/w/d)"), then in the body (e.g. "for the position of …", "Bewerbung als …"). Copy it exactly as written, without translating; drop gender suffixes like "(m/w/d)", "(f/m/x)", "(all genders)". Do NOT guess: if no title is mentioned anywhere, use "Unknown Position".
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

  // llama-3.1-8b-instant / llama-3.3-70b-versatile were shut down by Groq on 2026-08-16; every request
  // to them fails, which silently sent ALL emails to the weaker rule-based parser. Try the configured
  // model first, then current Groq models, so one retired model can't break parsing again.
  const models = Array.from(new Set([process.env.GROQ_MODEL, ...DEFAULT_GROQ_MODELS].filter(Boolean) as string[]));
  let lastError = '';

  for (const model of models) {
    const requestBody = JSON.stringify({
      model,
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
      temperature: 0, // Deterministic parsing: the same email must always land in the same column
      ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {})
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
        lastError = `${model}: HTTP ${response?.status} ${errorDetails.slice(0, 200)}`;
        console.error(`Groq request failed (${lastError}). Trying next model.`);
        if (response?.status === 401) break; // bad API key: other models won't help
        continue;
      }

      const data = await response.json();
      const content = (data.choices?.[0]?.message?.content || '').trim();
      const aiResult = normalizeAIResult(JSON.parse(content), subject);
      return combineWithRules(aiResult, subject, body, sender);
    } catch (error: any) {
      lastError = `${model}: ${error?.message || error}`;
      console.error(`Groq AI email parsing failed (${lastError}). Trying next model.`);
    }
  }

  console.error('All Groq models failed, falling back to rule-based parser:', lastError);
  return withFallbackNote(parseEmailHeuristics(subject, body, sender), lastError.includes('HTTP 401') ? 'GROQ_API_KEY is invalid' : `AI request failed — ${lastError}`);
}
