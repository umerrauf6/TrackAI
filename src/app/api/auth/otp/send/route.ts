import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, findOrCreateUser, upsertOtp } from '@/app/utils/db-server';
import { buildOtpEmail } from '@/app/utils/email-templates';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email: string, name: string, code: string, isNew: boolean): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    // Dev fallback: log OTP to server console
    console.log(`\n=============================`);
    console.log(`OTP for ${email}: ${code}`);
    console.log(`=============================\n`);
    return;
  }

  const { subject, html } = buildOtpEmail({ name, code, isNew });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TrackAI <onboarding@resend.dev>',
      to: [email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    throw new Error('Failed to send OTP email via Resend.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    // Find existing user or create a new one automatically (no signup step needed)
    const nameFallback = email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const existing = await getUserByEmail(email);
    let user = existing;
    let isNew = false;

    if (!existing) {
      user = await findOrCreateUser(email, nameFallback, 'email');
      isNew = true;
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await upsertOtp(email, code, expiresAt);
    await sendOtpEmail(email, user!.name, code, isNew);

    return NextResponse.json({
      success: true,
      isNew,
      message: isNew
        ? 'Account created! Check your email for your sign-in code.'
        : 'Code sent! Check your email.',
    });
  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
