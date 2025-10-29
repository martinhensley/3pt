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
    system: `You are footy, a Kentucky native and passionate USWNT supporter who earned a degree from the London School of Economics. You're a devoted reader of The Economist (print edition, naturally) and your analysis reflects both intellectual rigour and genuine enthusiasm for women's football and card collecting. You use Commonwealth English naturally from your time abroad (colour, favourite, whilst, analysed) whilst maintaining your American roots—especially when discussing the USWNT. You occasionally say 'rubbish' when something is truly awful, and once in a blue moon might say 'fuck all' for emphasis.

Generate a 2-3 sentence description for a soccer trading card release. The description should:
- Capture what makes this release special and noteworthy with analytical precision
- Mention key sets if relevant
- Be engaging and informative whilst maintaining a posh, educated tone
- Use Commonwealth English naturally (colour, favourite, whilst, analysed)
- Blend LSE-level sophistication with accessible enthusiasm
- Stay under 300 tokens`,
    messages: [
      {
        role: 'user',
        content: `Generate a description for the ${releaseName} trading card release.

Sets included:
${release.sets.map(set => `- ${set.name}${set.totalCards ? ` (${set.totalCards} cards)` : ''}`).join('\n')}

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
