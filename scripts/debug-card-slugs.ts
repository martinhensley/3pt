import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function debugCardSlugs() {
  // Test slug 1: 2024-25-donruss-soccer-base-4-folarin-balogun-black-1of1
  console.log('\n=== Testing Slug 1 ===');
  console.log('URL: /cards/2024-25-donruss-soccer-base-4-folarin-balogun-black-1of1');

  const card1 = await prisma.card.findFirst({
    where: {
      AND: [
        { playerName: { contains: 'Balogun', mode: 'insensitive' } },
        { cardNumber: '4' }
      ]
    },
    include: {
      set: {
        include: {
          release: {
            include: { manufacturer: true }
          }
        }
      }
    }
  });

  if (card1) {
    console.log('\nFound card:');
    console.log('- Player:', card1.playerName);
    console.log('- Card #:', card1.cardNumber);
    console.log('- Parallel:', card1.parallelType);
    console.log('- Variant:', card1.variant);
    console.log('- Color Variant:', card1.colorVariant);
    console.log('- Print Run:', card1.printRun);
    console.log('- Set:', card1.set.name);
    console.log('- Release:', card1.set.release.name);
    console.log('- Year:', card1.set.release.year);

    // Generate slug as the code would
    const cleanSetName = card1.set.name
      .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
      .replace(/\boptic\s+base\b/gi, 'Optic')
      .replace(/\bbase\s+set\b/gi, '')
      .replace(/\bsets?\b/gi, '')
      .trim();

    const slugParts = [
      card1.set.release.year,
      card1.set.release.name,
      cleanSetName,
      card1.cardNumber || '',
      card1.playerName || 'unknown',
    ];

    if (card1.parallelType && card1.parallelType.toLowerCase() !== 'base') {
      slugParts.push(card1.parallelType);
    } else if (card1.variant && card1.variant.toLowerCase() !== 'base') {
      slugParts.push(card1.variant);
    }

    // Add color variant if present
    if (card1.colorVariant) {
      slugParts.push(card1.colorVariant);
    }

    // Add print run if /1
    if (card1.isNumbered && card1.printRun === 1) {
      slugParts.push('1of1');
    }

    const generatedSlug = slugParts
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    console.log('\nGenerated slug:', generatedSlug);
    console.log('Expected slug:  2024-25-donruss-soccer-base-4-folarin-balogun-black-1of1');
    console.log('Match:', generatedSlug === '2024-25-donruss-soccer-base-4-folarin-balogun-black-1of1');
  } else {
    console.log('Card not found!');
  }

  // Test slug 2: 2024-25-donruss-soccer-base-5-tyler-adams-blue-49
  console.log('\n\n=== Testing Slug 2 ===');
  console.log('URL: /cards/2024-25-donruss-soccer-base-5-tyler-adams-blue-49');

  const card2 = await prisma.card.findFirst({
    where: {
      AND: [
        { playerName: { contains: 'Adams', mode: 'insensitive' } },
        { cardNumber: '5' }
      ]
    },
    include: {
      set: {
        include: {
          release: {
            include: { manufacturer: true }
          }
        }
      }
    }
  });

  if (card2) {
    console.log('\nFound card:');
    console.log('- Player:', card2.playerName);
    console.log('- Card #:', card2.cardNumber);
    console.log('- Parallel:', card2.parallelType);
    console.log('- Variant:', card2.variant);
    console.log('- Color Variant:', card2.colorVariant);
    console.log('- Print Run:', card2.printRun);
    console.log('- Set:', card2.set.name);
    console.log('- Release:', card2.set.release.name);
    console.log('- Year:', card2.set.release.year);

    // Generate slug as the code would
    const cleanSetName = card2.set.name
      .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
      .replace(/\boptic\s+base\b/gi, 'Optic')
      .replace(/\bbase\s+set\b/gi, '')
      .replace(/\bsets?\b/gi, '')
      .trim();

    const slugParts = [
      card2.set.release.year,
      card2.set.release.name,
      cleanSetName,
      card2.cardNumber || '',
      card2.playerName || 'unknown',
    ];

    if (card2.parallelType && card2.parallelType.toLowerCase() !== 'base') {
      slugParts.push(card2.parallelType);
    } else if (card2.variant && card2.variant.toLowerCase() !== 'base') {
      slugParts.push(card2.variant);
    }

    // Add color variant if present
    if (card2.colorVariant) {
      slugParts.push(card2.colorVariant);
    }

    // Add print run if numbered
    if (card2.isNumbered && card2.printRun) {
      slugParts.push(card2.printRun.toString());
    }

    const generatedSlug = slugParts
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    console.log('\nGenerated slug:', generatedSlug);
    console.log('Expected slug:  2024-25-donruss-soccer-base-5-tyler-adams-blue-49');
    console.log('Match:', generatedSlug === '2024-25-donruss-soccer-base-5-tyler-adams-blue-49');
  } else {
    console.log('Card not found!');
  }

  await prisma.$disconnect();
}

debugCardSlugs().catch(console.error);
