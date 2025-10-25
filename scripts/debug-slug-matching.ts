import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function debugSlugMatching() {
  const slug = '2024-25-donruss-soccer-base-4-folarin-balogun-black-1of1';

  console.log('\n=== Testing Slug ===');
  console.log('Input slug:', slug);

  // Extract player name for searching (use "balogun")
  const searchName = 'balogun';

  const cards = await prisma.card.findMany({
    where: {
      playerName: {
        contains: searchName,
        mode: 'insensitive'
      }
    },
    include: {
      set: {
        include: {
          release: {
            include: { manufacturer: true }
          }
        }
      }
    },
    take: 5
  });

  console.log(`\nFound ${cards.length} cards matching "${searchName}"`);

  for (const c of cards) {
    console.log('\n---');
    console.log('Card:', c.playerName, '#' + c.cardNumber);
    console.log('Set:', c.set.name);
    console.log('Release:', c.set.release.name);

    // Clean set name
    const cleanSetName = c.set.name
      .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
      .replace(/\boptic\s+base\b/gi, 'Optic')
      .replace(/\bbase\s+set\b/gi, '')
      .replace(/\bsets?\b/gi, '')
      .trim();

    console.log('Cleaned set name:', cleanSetName);

    const cardSlugParts = [
      c.set.release.year,
      c.set.release.name,
      cleanSetName,
      c.cardNumber || '',
      c.playerName || 'unknown',
    ];

    if (c.parallelType && c.parallelType.toLowerCase() !== 'base') {
      cardSlugParts.push(c.parallelType);
    } else if (c.variant && c.variant.toLowerCase() !== 'base') {
      cardSlugParts.push(c.variant);
    }

    const generatedSlug = cardSlugParts
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    console.log('Generated slug:', generatedSlug);
    console.log('Expected slug: ', slug);
    console.log('Exact match?', generatedSlug === slug);

    // Try base pattern (first 5 parts)
    const baseSlugPattern = cardSlugParts.slice(0, 5)
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    console.log('Base pattern:  ', baseSlugPattern);
    console.log('Slug starts with pattern?', slug.startsWith(baseSlugPattern));
  }

  await prisma.$disconnect();
}

debugSlugMatching().catch(console.error);
