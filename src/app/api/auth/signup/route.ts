import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/app/utils/db-server';
import { signToken } from '@/app/utils/jwt-server';

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

    const user = await createUser(email, password, name);
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Set HTTP-only cookie for secure session authentication
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error: any) {
    console.error('Signup API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during sign up' },
      { status: 500 }
    );
  }
}
