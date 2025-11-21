import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { generateSetSlug, generateCardSlug } from '../../lib/slugGenerator';
import { z } from 'zod';

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define set types
type SetType = 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';

// Schema for AI extraction
const checklistSchema = z.object({
  sets: z.array(z.object({
    setName: z.string().describe('The name of the card set'),
    setType: z.enum(['Base', 'Insert', 'Autograph', 'Memorabilia']).describe('The type of set'),
    printRun: z.number().nullable().describe('Standard print run for all cards in this set (e.g., 1 for /1, 10 for /10, null for unlimited)'),
    isParallel: z.boolean().describe('True if this is a parallel variant of another set'),
    baseSetName: z.string().nullable().describe('For parallels, the name of the base set this is a parallel of'),
    cards: z.array(z.object({
      cardNumber: z.string().describe('Card number'),
      playerName: z.string().describe('Player name'),
      team: z.string().nullable().describe('Team name if available'),
      printRun: z.number().nullable().describe('Card-specific print run if different from set print run'),
    })).describe('List of all cards in this set'),
  })).describe('All card sets found in the checklist'),
});

async function extractChecklistData(pdfPath: string): Promise<z.infer<typeof checklistSchema>> {
  console.log('Reading PDF file...');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  console.log('Sending to Claude for analysis...');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze this 2016-17 Panini Absolute Basketball checklist PDF and extract ALL card sets and cards.

IMPORTANT INSTRUCTIONS:
1. Extract EVERY set mentioned in the PDF
2. For each set, extract ALL cards listed
3. Identify the set type: Base, Insert, Autograph, or Memorabilia
4. Identify parallels (e.g., "Base Spectrum Black" is a parallel of "Base")
5. Extract print runs (e.g., "/1", "/10", "/25", "/149")
6. The format in the PDF is typically: Card Set name, # (card number), player name, team, sequence number

PARALLEL IDENTIFICATION:
- "Base Spectrum Black", "Base Spectrum Gold" are parallels of "Base"
- Sets ending in "Prime" are often parallels of the non-Prime version
- For parallels, set baseSetName to the base set name and isParallel to true

SET TYPE RULES:
- Base: Base sets and their parallels (Base, Base Spectrum Black/Gold, Retired, Rookies)
- Insert: Special insert sets (Glass, etc.)
- Autograph: Any set with signatures/autographs (Draft Day Ink, Freshman Flyer Jersey Autographs, etc.)
- Memorabilia: Jersey/patch cards without autographs (Frequent Flyer Materials, Heroes Materials, etc.)

Return structured data for ALL sets and cards found in the PDF.`,
          },
        ],
      },
    ],
  });

  // Extract the text content
  const textContent = message.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in AI response');
  }

  // Parse the response as JSON
  let jsonText = textContent.text.trim();

  // Try to extract JSON from the response
  // Look for JSON object or array
  let jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    jsonMatch = jsonText.match(/\[[\s\S]*\]/);
  }

  if (jsonMatch) {
    jsonText = jsonMatch[0];
  } else {
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
  }

  const parsed = JSON.parse(jsonText);

  // Validate with Zod schema
  return checklistSchema.parse(parsed);
}

async function importAbsoluteBasketball() {
  try {
    console.log('Starting 2016-17 Panini Absolute Basketball import...\n');

    // 1. Find or create Panini manufacturer
    let manufacturer = await prisma.manufacturer.findUnique({
      where: { name: 'Panini' }
    });

    if (!manufacturer) {
      manufacturer = await prisma.manufacturer.create({
        data: { name: 'Panini' }
      });
      console.log('Created Panini manufacturer\n');
    } else {
      console.log('Found Panini manufacturer\n');
    }

    // 2. Find or create release
    const releaseSlug = '2016-17-panini-absolute-basketball';
    let release = await prisma.release.findUnique({
      where: { slug: releaseSlug },
      include: { manufacturer: true }
    });

    if (!release) {
      release = await prisma.release.create({
        data: {
          name: 'Absolute Basketball',
          year: '2016-17',
          slug: releaseSlug,
          releaseDate: 'December 14, 2016',
          manufacturerId: manufacturer.id,
          postDate: new Date('2016-12-14')
        },
        include: { manufacturer: true }
      });
      console.log(`Created release: ${release.name} (${release.id})\n`);
    } else {
      console.log(`Found release: ${release.name} (${release.id})\n`);
    }

    // 3. Extract data from PDF using AI
    const pdfPath = '/Users/mh/Desktop/202016-17-absolute/2016-17-Panini-Absolute-Basketball-Cards-Checklist.pdf';
    console.log('Extracting checklist data from PDF using AI...\n');
    const checklistData = await extractChecklistData(pdfPath);

    console.log(`Extracted ${checklistData.sets.length} sets from PDF\n`);

    // 4. Process each set
    console.log('Creating sets and cards...\n');
    let setCount = 0;
    let cardCount = 0;

    for (const setData of checklistData.sets) {
      console.log(`Processing: ${setData.setName} (${setData.cards.length} cards)`);
      console.log(`  Type: ${setData.setType}`);
      console.log(`  Is Parallel: ${setData.isParallel}`);
      console.log(`  Base Set: ${setData.baseSetName || 'N/A'}`);
      console.log(`  Print Run: ${setData.printRun || 'Unlimited'}`);

      // Generate slug
      let slug: string;
      if (setData.isParallel && setData.baseSetName) {
        // For parallels, extract the variant name
        const variantName = setData.setName.replace(setData.baseSetName, '').trim();
        const parallelSlug = variantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const baseSlug = generateSetSlug('2016-17', 'Absolute Basketball', setData.baseSetName, setData.setType);
        slug = setData.printRun
          ? `${baseSlug}-${parallelSlug}-parallel-${setData.printRun}`
          : `${baseSlug}-${parallelSlug}-parallel`;
      } else {
        slug = generateSetSlug('2016-17', 'Absolute Basketball', setData.setName, setData.setType);
      }

      // Calculate base set slug for parallels
      let baseSetSlug: string | null = null;
      if (setData.isParallel && setData.baseSetName) {
        baseSetSlug = generateSetSlug('2016-17', 'Absolute Basketball', setData.baseSetName, setData.setType);
      }

      console.log(`  Slug: ${slug}`);
      console.log(`  Base Set Slug: ${baseSetSlug || 'N/A'}`);

      // Check if set already exists
      const existingSet = await prisma.set.findUnique({
        where: { slug }
      });

      if (existingSet) {
        console.log(`  ⚠️ Set already exists, skipping...\n`);
        continue;
      }

      // Create set
      const dbSet = await prisma.set.create({
        data: {
          name: setData.setName,
          slug,
          type: setData.setType,
          releaseId: release.id,
          expectedCardCount: setData.cards.length,
          printRun: setData.printRun,
          isParallel: setData.isParallel,
          baseSetSlug,
        },
      });
      setCount++;
      console.log(`  ✅ Created set: ${dbSet.id}`);

      // Create cards for this set
      let createdCards = 0;
      for (const card of setData.cards) {
        // Use card-specific print run if available, otherwise fall back to set print run
        const cardPrintRun = card.printRun ?? setData.printRun;

        // For parallels, extract the variant name
        const variantName = setData.isParallel && setData.baseSetName
          ? setData.setName.replace(setData.baseSetName, '').trim()
          : null;

        // Generate card slug
        const cardSlug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '2016-17',
          setData.baseSetName || setData.setName,
          card.cardNumber,
          card.playerName,
          variantName,
          cardPrintRun || undefined,
          setData.setType
        );

        try {
          await prisma.card.create({
            data: {
              slug: cardSlug,
              playerName: card.playerName,
              team: card.team,
              cardNumber: card.cardNumber,
              variant: variantName,
              printRun: cardPrintRun,
              isNumbered: cardPrintRun !== null,
              numbered: cardPrintRun ? (cardPrintRun === 1 ? '1 of 1' : `/${cardPrintRun}`) : null,
              rarity: cardPrintRun === 1 ? 'one_of_one' :
                      cardPrintRun && cardPrintRun <= 10 ? 'ultra_rare' :
                      cardPrintRun && cardPrintRun <= 50 ? 'super_rare' :
                      cardPrintRun && cardPrintRun <= 199 ? 'rare' : 'base',
              hasAutograph: setData.setType === 'Autograph',
              hasMemorabilia: setData.setType === 'Memorabilia',
              setId: dbSet.id,
            },
          });
          createdCards++;
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`    ⚠️ Card slug already exists: ${cardSlug}`);
          } else {
            throw error;
          }
        }
      }

      cardCount += createdCards;
      console.log(`  ✅ Created ${createdCards}/${setData.cards.length} cards\n`);
    }

    // 5. Final summary
    console.log('='.repeat(60));
    console.log(`Successfully imported ${setCount} sets and ${cardCount} cards`);
    console.log('='.repeat(60));

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importAbsoluteBasketball();
