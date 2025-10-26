import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

// POST - Upload card images (front and/or back) to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const frontImage = formData.get('frontImage') as File | null;
    const backImage = formData.get('backImage') as File | null;
    const cardId = formData.get('cardId') as string | null;

    if (!frontImage && !backImage) {
      return NextResponse.json(
        { error: 'At least one image (front or back) is required' },
        { status: 400 }
      );
    }

    const uploadedUrls: { frontImageUrl?: string; backImageUrl?: string } = {};

    // Upload front image if provided
    if (frontImage) {
      const frontFilename = cardId
        ? `cards/${cardId}/front-${Date.now()}.${frontImage.name.split('.').pop()}`
        : `cards/temp/front-${Date.now()}.${frontImage.name.split('.').pop()}`;

      const frontBlob = await put(frontFilename, frontImage, {
        access: 'public',
        addRandomSuffix: false,
      });

      uploadedUrls.frontImageUrl = frontBlob.url;
    }

    // Upload back image if provided
    if (backImage) {
      const backFilename = cardId
        ? `cards/${cardId}/back-${Date.now()}.${backImage.name.split('.').pop()}`
        : `cards/temp/back-${Date.now()}.${backImage.name.split('.').pop()}`;

      const backBlob = await put(backFilename, backImage, {
        access: 'public',
        addRandomSuffix: false,
      });

      uploadedUrls.backImageUrl = backBlob.url;
    }

    return NextResponse.json({
      success: true,
      ...uploadedUrls,
    });
  } catch (error) {
    console.error('Card image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload card images' },
      { status: 500 }
    );
  }
}
