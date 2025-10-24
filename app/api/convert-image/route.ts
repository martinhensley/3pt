import { NextRequest, NextResponse } from 'next/server';
import { convertImageToJpeg } from '@/lib/utils/image-converter';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert the file
    const dataUri = await convertImageToJpeg(file);

    return NextResponse.json({ dataUri });
  } catch (error) {
    console.error('Image conversion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert image' },
      { status: 500 }
    );
  }
}
