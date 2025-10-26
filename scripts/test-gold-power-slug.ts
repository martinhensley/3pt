import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSlugGeneration() {
  const card = await prisma.card.findFirst({
    where: {
      playerName: { contains: 'Matt Turner', mode: 'insensitive' },
      cardNumber: '1',
      parallelType: { contains: 'Gold Power', mode: 'insensitive' }
    },
    include: {
      set: {
        include: {
          release: { include: { manufacturer: true } }
        }
      }
    }
  });

  if (!card) {
    console.log('Card not found');
    return;
  }

  // Clean set name
  let cleanSetName = card.set.name;
  if (cleanSetName.toLowerCase().includes('optic')) {
    cleanSetName = cleanSetName
      .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
      .replace(/\boptic\s+base\b/gi, 'Optic')
      .replace(/\bbase\s+optic\b/gi, 'Optic');
  } else {
    cleanSetName = cleanSetName.replace(/\bbase\s+set\b/gi, 'Base');
  }
  cleanSetName = cleanSetName.replace(/\bsets?\b/gi, '').trim();

  const cardSlugParts = [
    card.set.release.year,
    card.set.release.name,
    cleanSetName,
    card.cardNumber || '',
    card.playerName || 'unknown',
  ];

  if (card.parallelType && card.parallelType.toLowerCase() !== 'base') {
    cardSlugParts.push(card.parallelType);
  }

  const generatedSlug = cardSlugParts
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/1-of-1/g, '1of1');

  console.log('Card details:');
  console.log('- Player:', card.playerName);
  console.log('- Number:', card.cardNumber);
  console.log('- Set:', card.set.name);
  console.log('- Parallel:', card.parallelType);
  console.log('\nGenerated slug:', generatedSlug);
  console.log('\nExpected URL from screenshot: 2024-25-donruss-soccer-optic-1-matt-turner-gold-power-1of1');
}

testSlugGeneration()
  .then(() => prisma.$disconnect())
  .catch(console.error);
