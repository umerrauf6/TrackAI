import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser, upsertOtp } from '@/app/utils/db-server';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email: string, name: string, code: string, isNew: boolean): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.log(`\n=============================`);
    console.log(`OTP for ${email}: ${code}`);
    console.log(`=============================\n`);
    return;
  }

  const subject = isNew
    ? `Welcome to TrackAI! Your code: ${code}`
    : `Your TrackAI login code: ${code}`;

  const heading = isNew
    ? `Welcome to TrackAI, ${name}! 🎉`
    : `Your TrackAI Sign-In Code`;

  const subtext = isNew
    ? `Your account has been created. Use this code to sign in. It expires in 10 minutes.`
    : `Use this code to sign in. It expires in 10 minutes.`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TrackAI <onboarding@resend.dev>',
      to: [email],
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f17; border-radius: 12px; border: 1px solid #2a2a3e; color: #e2e8f0;">
          <h2 style="color: #c084fc; margin: 0 0 8px;">${heading}</h2>
          <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px;">${subtext}</p>
          <div style="background: #1a1a2e; border: 1px solid #c084fc44; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #c084fc;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    // Find existing user or create a new one automatically (no signup step needed)
    const nameFallback = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const { user, isNew } = await findOrCreateEmailUser(email, nameFallback);

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await upsertOtp(email, code, expiresAt);
    await sendOtpEmail(email, user.name, code, isNew);

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

// Helper: find or create a user by email for OTP-based auth
async function findOrCreateEmailUser(email: string, nameFallback: string) {
  const { getUserByEmail, findOrCreateUser } = await import('@/app/utils/db-server');
  const existing = await getUserByEmail(email);
  if (existing) {
    return { user: existing, isNew: false };
  }
  const user = await findOrCreateUser(email, nameFallback, 'email');
  return { user, isNew: true };
}
