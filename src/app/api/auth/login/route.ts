import { NextResponse } from 'next/server';

// Email+password login is deprecated in favour of OTP-only auth.
// All email sign-ins now go through /api/auth/otp/send + /api/auth/otp/verify.
export async function POST() {
  return NextResponse.json(
    { error: 'Password login is disabled. Please use the email OTP sign-in flow.' },
    { status: 410 }
  );
}
