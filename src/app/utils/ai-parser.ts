interface ParsedJobInfo {
  company: string;
  position: string;
  salary: string;
  status: 'Bookmarked' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  notes: string;
}

// Smart Regex Heuristics fallback parser
function parseEmailHeuristics(subject: string, body: string): ParsedJobInfo {
  const cleanSubject = subject.toLowerCase();
  const cleanBody = body.toLowerCase();
  
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
    notes
  };
}

// AI Groq Llama 3 API email parser
export async function parseEmailWithAI(subject: string, body: string): Promise<ParsedJobInfo> {
  const apiKey = process.env.GROQ_API_KEY;

  // Fallback to heuristics if Groq API key is not configured
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY' || apiKey.trim() === '') {
    console.log('Groq API key not found. Using local regex/heuristics parser.');
    return parseEmailHeuristics(subject, body);
  }

  try {
    const prompt = `You are a parser designed to scan job application emails. Extract the following information from the email subject and email body and return a clean JSON object containing:
- company: The company name (e.g. Stripe, Google). Be concise and extract only the official brand name.
- position: The job title (e.g. Senior Frontend Engineer, Devops Intern).
- salary: Expected salary if mentioned, otherwise write "Not Specified".
- status: Set this string to exactly one of the following based on the content: "Applied" (for thank you for applying / received emails), "Interviewing" (if asking to schedule a call, chat, interview, or code test), "Offer" (if an offer letter is sent or verbal offer made), or "Rejected" (if they are not moving forward).
- notes: A short, professional 1-2 sentence summary of what this email says and if there are any immediate next steps mentioned.

Email Subject: ${subject}
Email Body:
${body}

You MUST return only a valid JSON matching this format:
{
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
        model: 'llama3-8b-8192',
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
    
    return parsedJson;
  } catch (error) {
    console.error('Groq AI email parsing failed, falling back to heuristics:', error);
    return parseEmailHeuristics(subject, body);
  }
}
