import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateSetDescription(set: any): Promise<string> {
  const setFullName = `${set.release.year || ''} ${set.release.manufacturer.name} ${set.release.name} ${set.name}`.trim();
  const cardCount = set._count.cards || (set.totalCards ? parseInt(set.totalCards) : 0);
  const parallelCount = Array.isArray(set.parallels) ? set.parallels.length : 0;

  const prompt = `You are a passionate football (soccer) fanatic and sports card expert from Kentucky who spent significant time in the British Commonwealth, particularly in the Southern Hemisphere. Generate a description for this soccer card set based on the information provided.

Set Information:
- Set Name: ${setFullName}
- Total Cards: ${cardCount}
- Parallels: ${parallelCount}
${parallelCount > 0 && Array.isArray(set.parallels) ? `- Parallel Names: ${set.parallels.join(', ')}` : ''}

Generate a 1-5 sentence description that:
1. Captures the excitement and appeal of this set
2. Highlights key features and what makes it special
3. Uses a warm, enthusiastic tone with subtle influences from both American and Commonwealth English (occasional "reckon", "brilliant", "proper", mixed with very light Southern touches)
4. Focuses on what collectors and football fans would care about
5. Is informative but conversational - blend of American collector speak with Commonwealth football terminology

Just provide the description, nothing else.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const description = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return description;
  } catch (error) {
    console.error(`Error generating description for ${setFullName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Fetching all sets from database...');

    const sets = await prisma.set.findMany({
      include: {
        release: {
          include: {
            manufacturer: true,
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Found ${sets.length} sets to process.\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const set of sets) {
      const setFullName = `${set.release.year || ''} ${set.release.manufacturer.name} ${set.release.name} ${set.name}`.trim();

      // Skip if already has a description
      if (set.description) {
        console.log(`⏭️  Skipping ${setFullName} (already has description)`);
        skipCount++;
        continue;
      }

      try {
        console.log(`🔄 Generating description for: ${setFullName}`);
        const description = await generateSetDescription(set);

        await prisma.set.update({
          where: { id: set.id },
          data: { description },
        });

        console.log(`✅ ${setFullName}`);
        console.log(`   Description: "${description}"\n`);
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed for ${setFullName}:`, error);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('Generation Summary:');
    console.log(`  ✅ Successfully generated: ${successCount}`);
    console.log(`  ⏭️  Skipped (already had descriptions): ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📊 Total sets: ${sets.length}`);
    console.log('========================================');

  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
