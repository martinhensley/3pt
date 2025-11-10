import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { releaseId, approve } = body;

    if (!releaseId) {
      return NextResponse.json(
        { error: 'Release ID is required' },
        { status: 400 }
      );
    }

    // Update the release
    const release = await prisma.release.update({
      where: { id: releaseId },
      data: {
        isApproved: approve === true,
        approvedAt: approve === true ? new Date() : null,
        approvedBy: approve === true ? session.user.email : null,
      },
    });

    return NextResponse.json(release);
  } catch (error) {
    console.error('Error updating release approval:', error);
    return NextResponse.json(
      { error: 'Failed to update release approval' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
