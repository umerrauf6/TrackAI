import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, upsertOtp } from '@/app/utils/db-server';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email: string, name: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    // Dev fallback: log OTP to console
    console.log(`\n=============================`);
    console.log(`OTP for ${email}: ${code}`);
    console.log(`=============================\n`);
    return;
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TrackAI <onboarding@resend.dev>',
      to: [email],
      subject: `Your TrackAI login code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f17; border-radius: 12px; border: 1px solid #2a2a3e; color: #e2e8f0;">
          <h2 style="color: #c084fc; margin: 0 0 8px;">TrackAI Verification Code</h2>
          <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px;">Hi ${name}, use this code to sign in. It expires in 10 minutes.</p>
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

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email. Please sign up first.' },
        { status: 404 }
      );
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await upsertOtp(email, code, expiresAt);
    await sendOtpEmail(email, user.name, code);

    return NextResponse.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
