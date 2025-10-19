import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('hereisalongtokenforebaytodosomestuff', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
