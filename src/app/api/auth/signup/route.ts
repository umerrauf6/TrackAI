import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, upsertOtp } from '@/app/utils/db-server';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email: string, name: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.log(`\n=============================`);
    console.log(`Signup OTP for ${email}: ${code}`);
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
      subject: `Welcome to TrackAI! Verify your email: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f17; border-radius: 12px; border: 1px solid #2a2a3e; color: #e2e8f0;">
          <h2 style="color: #c084fc; margin: 0 0 8px;">Welcome to TrackAI, ${name}! 🎉</h2>
          <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px;">Enter this code to verify your email and activate your account. It expires in 10 minutes.</p>
          <div style="background: #1a1a2e; border: 1px solid #c084fc44; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #c084fc;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Create the user (unverified until OTP confirmed)
    await createUser(email, password, name, 'email');

    // Generate and send OTP for email verification
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await upsertOtp(email, code, expiresAt);
    await sendOtpEmail(email, name, code);

    // Tell the client to show the OTP screen (session not issued yet)
    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email,
      message: 'Account created! Please check your email for a verification code.',
    });
  } catch (error: any) {
    console.error('Signup API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during sign up' },
      { status: 500 }
    );
  }
}
