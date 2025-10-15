import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0,
    NEXTAUTH_SECRET_prefix: process.env.NEXTAUTH_SECRET?.substring(0, 8) || 'undefined',
    NEXTAUTH_URL_exists: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_URL_value: process.env.NEXTAUTH_URL || 'undefined',
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
  };

  console.log('[ENV CHECK]', JSON.stringify(checks, null, 2));

  return NextResponse.json(checks);
}
