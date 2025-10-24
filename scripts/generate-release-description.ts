import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function generateReleaseDescription(releaseId: string) {
  // Fetch release details
  const release = await prisma.release.findUnique({
    where: { id: releaseId },
    include: {
      manufacturer: true,
      sets: {
        select: {
          name: true,
          description: true,
          totalCards: true,
          parallels: true,
        },
      },
    },
  });

  if (!release) {
    throw new Error('Release not found');
  }

  const releaseName = `${release.year || ''} ${release.manufacturer.name} ${release.name}`.trim();

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Generate description using Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    temperature: 0.1,
    system: `You are a Kentucky native who occasionally uses Commonwealth English spellings and subtle British/Commonwealth phrases when they feel natural. Your persona blends American sports card knowledge with subtle Commonwealth influences.

Generate a 2-3 sentence description for a soccer trading card release. The description should:
- Capture what makes this release special and noteworthy
- Mention key sets if relevant
- Be engaging and informative
- Use a conversational tone with subtle Commonwealth touches
- Stay under 300 tokens`,
    messages: [
      {
        role: 'user',
        content: `Generate a description for the ${releaseName} trading card release.

Sets included:
${release.sets.map(set => `- ${set.name}${set.totalCards ? ` (${set.totalCards} cards)` : ''}${set.description ? `\n  ${set.description}` : ''}`).join('\n')}

Provide only the description text, no additional commentary.`,
      },
    ],
  });

  const description = message.content[0].type === 'text' ? message.content[0].text : '';

  // Update the release with the generated description
  await prisma.release.update({
    where: { id: releaseId },
    data: { description },
  });

  console.log('Generated description:');
  console.log(description);
  console.log('\nRelease updated successfully!');

  return description;
}

// Run the script
const releaseId = process.argv[2];
if (!releaseId) {
  console.error('Usage: npx tsx scripts/generate-release-description.ts <releaseId>');
  process.exit(1);
}

generateReleaseDescription(releaseId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
