import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getOtp, deleteOtp } from '@/app/utils/db-server';
import { signToken } from '@/app/utils/jwt-server';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    const storedOtp = await getOtp(email);

    if (!storedOtp) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (new Date() > storedOtp.expiresAt) {
      await deleteOtp(email);
      return NextResponse.json(
        { error: 'Your OTP has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (storedOtp.code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect OTP code. Please try again.' }, { status: 400 });
    }

    // OTP is valid — clean up and issue session
    await deleteOtp(email);

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP. Please try again.' }, { status: 500 });
  }
}
