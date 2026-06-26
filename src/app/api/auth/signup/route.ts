import { NextResponse } from 'next/server';

// Separate signup is no longer needed.
// Email OTP flow (/api/auth/otp/send) auto-creates new accounts on first sign-in.
// Google/GitHub OAuth callbacks handle their own account creation via findOrCreateUser.
export async function POST() {
  return NextResponse.json(
    { error: 'Separate sign-up is disabled. Enter your email at /login to create an account automatically.' },
    { status: 410 }
  );
}
