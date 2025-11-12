import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { put } from '@vercel/blob';
import {
  analyzeExcelChecklistFlow,
  type ExcelCard,
  type BaseSet,
} from '@/lib/genkit';
import { generateSetSlug, generateCardSlug } from '@/lib/slugGenerator';
import { DocumentType } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large sets

interface ImportExcelRequest {
  releaseId?: string; // Optional - will be detected from Excel if not provided
  fileData: string; // Base64 encoded Excel file
  dryRun?: boolean; // If true, just analyze and return preview
  confirmOverwrite?: boolean; // If true, delete existing sets before creating new ones
}

interface ParsedCard {
  cardNumber: string;
  setName: string;
  playerName: string;
  team: string;
  position: string;
  printRun: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ImportExcelRequest = await request.json();
    const { releaseId, fileData, dryRun = false, confirmOverwrite = false } = body;

    if (!fileData) {
      return NextResponse.json(
        { error: 'fileData is required' },
        { status: 400 }
      );
    }

    // Step 1: Parse Excel file
    console.log('📖 Reading Excel file...');
    const buffer = Buffer.from(fileData, 'base64');
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });

    console.log(`Found ${rows.length} rows`);

    // Step 2: Find header row and parse cards
    console.log('🔍 Parsing cards...');
    const cards: ParsedCard[] = [];

    // Find header row - look for various header formats
    const headerRow = rows.findIndex((row: any[]) => {
      if (!row || row.length === 0) return false;
      const firstCol = String(row[0] || '').toUpperCase().trim();
      return firstCol === 'CARD #' ||
             firstCol === 'CARD#' ||
             firstCol === 'CARD NUMBER' ||
             firstCol.includes('CARD');
    });

    if (headerRow === -1) {
      // Log first 5 rows for debugging
      console.log('Header not found. First 5 rows:', rows.slice(0, 5).map((r: any) => r?.[0]));
      return NextResponse.json(
        {
          error: 'Invalid Excel format - CARD # header not found',
          details: 'First few rows: ' + JSON.stringify(rows.slice(0, 5).map((r: any) => r?.[0]))
        },
        { status: 400 }
      );
    }

    // Parse data rows (skip header + 1)
    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i] as any[];

      if (!row || row.length === 0 || !row[0]) continue;

      // Handle different column orders - the file uses:
      // CARD #, CARD SET, ATHLETE, TEAM, POSITION, SEQUENCE
      const [cardNum, setName, playerName, team, position, sequence] = row;

      if (cardNum && setName && playerName) {
        cards.push({
          cardNumber: String(cardNum),
          setName: String(setName).trim(),
          playerName: String(playerName).trim(),
          team: String(team || '').trim(),
          position: String(position || '').trim(),
          printRun: Number(sequence) || 0,
        });
      }
    }

    console.log(`Parsed ${cards.length} cards`);

    // Step 3: Group by set name
    const cardsBySet = new Map<string, ParsedCard[]>();
    for (const card of cards) {
      if (!cardsBySet.has(card.setName)) {
        cardsBySet.set(card.setName, []);
      }
      cardsBySet.get(card.setName)!.push(card);
    }

    const setNames = Array.from(cardsBySet.keys());
    console.log(`Found ${setNames.length} unique set names`);

    // Step 4: Analyze with Claude via Genkit
    console.log('🤖 Analyzing sets with Claude...');

    const sampleCards: ExcelCard[] = cards.slice(0, 20).map(card => ({
      cardNumber: card.cardNumber,
      setName: card.setName,
      playerName: card.playerName,
      team: card.team,
      position: card.position,
      printRun: card.printRun,
    }));

    const analysis = await analyzeExcelChecklistFlow({
      setNames,
      sampleCards,
    });

    console.log(`Claude identified ${analysis.baseSets.length} base sets`);
    console.log(`Detected release: ${analysis.release.year} ${analysis.release.manufacturer} ${analysis.release.releaseName}`);

    // If dry run, return analysis preview
    if (dryRun) {
      return NextResponse.json({
        success: true,
        preview: {
          totalCards: cards.length,
          uniqueSetNames: setNames.length,
          detectedRelease: analysis.release,
          baseSets: analysis.baseSets.map(bs => ({
            name: bs.name,
            type: bs.type,
            description: bs.description,
            parallelsCount: bs.parallels.length,
            parallels: bs.parallels,
            cardsCount: cardsBySet.get(bs.name)?.length || 0,
          })),
        },
        message: 'Dry run - analysis complete, no data created',
      });
    }

    // Step 5: Get or create release
    let release;

    if (releaseId) {
      // Use provided release ID
      release = await prisma.release.findUnique({
        where: { id: releaseId },
        include: { manufacturer: true },
      });

      if (!release) {
        return NextResponse.json({ error: 'Release not found' }, { status: 404 });
      }
    } else {
      // Find or create release based on detected info
      const { year, manufacturer: mfgName, releaseName, sport } = analysis.release;

      // Find manufacturer
      let manufacturer = await prisma.manufacturer.findFirst({
        where: { name: { equals: mfgName, mode: 'insensitive' } },
      });

      if (!manufacturer) {
        // Create manufacturer if it doesn't exist
        manufacturer = await prisma.manufacturer.create({
          data: { name: mfgName },
        });
      }

      // Generate release slug
      const releaseSlug = `${year}-${mfgName}-${releaseName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Find or create release
      release = await prisma.release.findUnique({
        where: { slug: releaseSlug },
        include: { manufacturer: true },
      });

      if (!release) {
        release = await prisma.release.create({
          data: {
            name: releaseName,
            slug: releaseSlug,
            year,
            manufacturerId: manufacturer.id,
          },
          include: { manufacturer: true },
        });
        console.log(`Created new release: ${release.name} (${sport})`);
      } else {
        console.log(`Found existing release: ${release.name}`);
      }
    }

    console.log(`\n✅ Found release: ${release.name}\n`);

    // Step 5.5: Save checklist to blob storage and create SourceDocument
    if (!dryRun) {
      console.log('📁 Saving checklist to library...');

      // Generate filename
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const sanitizedReleaseName = release.name
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
      const filename = `${release.year || year}-${sanitizedReleaseName}-checklist.xlsx`;
      const blobPath = `checklists/${year}/${month}/${timestamp}-${filename}`;

      // Get the file extension
      const fileExtension = filename.split('.').pop() || 'xlsx';
      const mimeType = fileExtension === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      try {
        // Upload to Vercel Blob
        const blob = await put(blobPath, buffer, {
          access: 'public',
          addRandomSuffix: false,
        });

        console.log(`  ✓ Uploaded checklist to: ${blob.url}`);

        // Check if document already exists (by URL)
        let sourceDocument = await prisma.sourceDocument.findFirst({
          where: { blobUrl: blob.url }
        });

        if (!sourceDocument) {
          // Generate tags
          const tags: string[] = [];
          if (release.year) tags.push(release.year);
          if (release.manufacturer?.name) tags.push(release.manufacturer.name);
          if (release.name) {
            const keywords = release.name.split(/\s+/).filter((word: string) => word.length > 3);
            tags.push(...keywords);
          }
          tags.push('checklist');

          // Create source document
          sourceDocument = await prisma.sourceDocument.create({
            data: {
              filename,
              displayName: `${release.year} ${release.manufacturer?.name} ${release.name} Checklist`,
              blobUrl: blob.url,
              mimeType,
              fileSize: buffer.length,
              documentType: DocumentType.CHECKLIST,
              tags: Array.from(new Set(tags)), // Remove duplicates
              uploadedById: session.user.email || 'unknown',
              usageCount: 1,
              lastUsedAt: new Date(),
            }
          });

          console.log(`  ✓ Created source document: ${sourceDocument.displayName}`);
        } else {
          // Update usage count
          await prisma.sourceDocument.update({
            where: { id: sourceDocument.id },
            data: {
              usageCount: { increment: 1 },
              lastUsedAt: new Date(),
            }
          });
          console.log(`  ℹ️  Source document already exists, updated usage count`);
        }

        // Check if link already exists
        const existingLink = await prisma.releaseSourceDocument.findUnique({
          where: {
            releaseId_documentId: {
              releaseId: release.id,
              documentId: sourceDocument.id
            }
          }
        });

        if (!existingLink) {
          // Link to release
          await prisma.releaseSourceDocument.create({
            data: {
              releaseId: release.id,
              documentId: sourceDocument.id,
              usageContext: 'Checklist used for set and card creation',
              linkedById: session.user.email || 'unknown',
            }
          });
          console.log(`  ✓ Linked checklist to release\n`);
        } else {
          console.log(`  ℹ️  Checklist already linked to release\n`);
        }

      } catch (blobError) {
        console.error('  ❌ Failed to save checklist to library:', blobError);
        // Continue with import even if checklist save fails
      }
    }

    // Step 5.6: Check for existing sets (conflict detection)
    if (!dryRun && !confirmOverwrite) {
      console.log('🔍 Checking for existing sets...\n');
      const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');
      const existingSetConflicts = [];

      for (const baseSetInfo of analysis.baseSets) {
        const parentSetSlug = generateSetSlug(
          release.year || '',
          cleanReleaseName,
          baseSetInfo.name,
          baseSetInfo.type
        );

        const existingSet = await prisma.set.findUnique({
          where: { slug: parentSetSlug },
          include: {
            _count: {
              select: { cards: true, parallelSets: true }
            }
          }
        });

        if (existingSet) {
          existingSetConflicts.push({
            name: baseSetInfo.name,
            slug: parentSetSlug,
            cardsCount: existingSet._count.cards,
            parallelsCount: existingSet._count.parallelSets,
          });
        }
      }

      if (existingSetConflicts.length > 0) {
        console.log(`⚠️  Found ${existingSetConflicts.length} existing sets that would be overwritten`);
        return NextResponse.json({
          error: 'CONFLICT',
          message: 'Some sets already exist and would be overwritten',
          conflicts: existingSetConflicts,
          requiresConfirmation: true,
        }, { status: 409 }); // 409 Conflict
      }
    }

    // Step 5.6: Delete existing sets if confirmOverwrite is true
    if (!dryRun && confirmOverwrite) {
      console.log('🗑️  Deleting existing sets (confirmOverwrite=true)...\n');
      const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

      for (const baseSetInfo of analysis.baseSets) {
        const parentSetSlug = generateSetSlug(
          release.year || '',
          cleanReleaseName,
          baseSetInfo.name,
          baseSetInfo.type
        );

        const existingSet = await prisma.set.findUnique({
          where: { slug: parentSetSlug },
          include: {
            _count: {
              select: { cards: true, parallelSets: true }
            }
          }
        });

        if (existingSet) {
          console.log(`  Deleting existing set: ${existingSet.name} (${existingSet._count.cards} cards, ${existingSet._count.parallelSets} parallels)`);
          await prisma.set.delete({
            where: { id: existingSet.id }
          });
        }
      }
      console.log('✅ Existing sets deleted\n');
    }

    // Step 6: Create all sets and cards
    console.log('📝 Creating sets and cards...\n');
    const cleanReleaseName = release.name.replace(/^\d{4}(-\d{2,4})?\s+/i, '');

    const createdSets = [];
    let totalCardsCreated = 0;

    for (const baseSetInfo of analysis.baseSets) {
      console.log(`\nProcessing: ${baseSetInfo.name}`);

      // Find all variations (base + parallels)
      const setVariations = setNames.filter(name => {
        return name === baseSetInfo.name ||
               baseSetInfo.parallels.includes(name);
      });

      console.log(`Found ${setVariations.length} variations`);

      // Create parent set
      const baseCards = cardsBySet.get(baseSetInfo.name) || [];
      const baseSetPrintRun = baseCards.length > 0 ? baseCards[0].printRun : null;

      const parentSetSlug = generateSetSlug(
        release.year || '',
        cleanReleaseName,
        baseSetInfo.name,
        baseSetInfo.type
      );

      console.log(`Creating parent set: ${baseSetInfo.name}`);

      // Check if parent set already exists
      let parentSet = await prisma.set.findUnique({
        where: { slug: parentSetSlug },
      });

      if (parentSet) {
        console.log(`⚠️  Parent set already exists: ${baseSetInfo.name} (${parentSetSlug})`);
      } else {
        parentSet = await prisma.set.create({
          data: {
            name: baseSetInfo.name,
            slug: parentSetSlug,
            type: baseSetInfo.type,
            isBaseSet: baseSetInfo.type === 'Base',
            releaseId: release.id,
            totalCards: String(baseCards.length),
            printRun: baseSetPrintRun,
            description: baseSetInfo.description,
            hasVariableChecklist: false,
            mirrorsParentChecklist: true,
          },
        });
        console.log(`✅ Created parent set: ${baseSetInfo.name}`);
      }

      // Create base cards
      console.log(`Creating ${baseCards.length} base cards...`);
      let baseCardsCreated = 0;
      for (const card of baseCards) {
        const slug = generateCardSlug(
          release.manufacturer.name,
          release.name,
          release.year || '',
          baseSetInfo.name,
          card.cardNumber,
          card.playerName,
          null,
          card.printRun
        );

        // Check if card with this slug already exists
        const existingCard = await prisma.card.findUnique({
          where: { slug },
        });

        if (existingCard) {
          console.log(`  ⚠️  Skipping duplicate base card: ${card.cardNumber} ${card.playerName} (slug: ${slug})`);
          continue;
        }

        await prisma.card.create({
          data: {
            slug,
            playerName: card.playerName,
            team: card.team,
            cardNumber: card.cardNumber,
            printRun: card.printRun,
            isNumbered: card.printRun > 0,
            numbered: card.printRun > 0 ? `/${card.printRun}` : null,
            setId: parentSet.id,
          },
        });
        baseCardsCreated++;
      }

      totalCardsCreated += baseCardsCreated;

      // Create parallel sets
      const parallelVariations = setVariations.filter(name => name !== baseSetInfo.name);
      const parallelSetsCreated = [];

      for (const parallelName of parallelVariations) {
        const parallelCards = cardsBySet.get(parallelName) || [];

        // Extract parallel type from name
        const parallelType = parallelName.replace(baseSetInfo.name, '').trim();

        // Check if variable checklist
        const basePlayerSet = new Set(baseCards.map(c => c.cardNumber));
        const parallelPlayerSet = new Set(parallelCards.map(c => c.cardNumber));
        const hasVariableChecklist = !([...parallelPlayerSet].every(num => basePlayerSet.has(num)));

        // Get typical print run
        const typicalPrintRun = parallelCards.length > 0 ? parallelCards[0].printRun : null;

        const parallelSlug = generateSetSlug(
          release.year || '',
          cleanReleaseName,
          baseSetInfo.name,
          baseSetInfo.type,
          `${parallelType} /${typicalPrintRun}`
        );

        console.log(`Creating parallel: ${parallelType} (${parallelCards.length} cards)`);

        // Check if parallel set already exists
        let parallelSet = await prisma.set.findUnique({
          where: { slug: parallelSlug },
        });

        if (parallelSet) {
          console.log(`  ⚠️  Parallel set already exists: ${parallelType} (${parallelSlug})`);
        } else {
          parallelSet = await prisma.set.create({
            data: {
              name: parallelName,
              slug: parallelSlug,
              type: baseSetInfo.type,
              isBaseSet: false,
              releaseId: release.id,
              printRun: typicalPrintRun,
              parentSetId: parentSet.id,
              hasVariableChecklist,
              mirrorsParentChecklist: !hasVariableChecklist,
            },
          });
          console.log(`  ✅ Created parallel set: ${parallelType}`);
        }

        // Create parallel cards
        let parallelCardsCreated = 0;
        for (const card of parallelCards) {
          // Don't include print run in variant since generateCardSlug will add it
          const slug = generateCardSlug(
            release.manufacturer.name,
            release.name,
            release.year || '',
            baseSetInfo.name,
            card.cardNumber,
            card.playerName,
            parallelType,
            card.printRun
          );

          // Check if card with this slug already exists
          const existingCard = await prisma.card.findUnique({
            where: { slug },
          });

          if (existingCard) {
            console.log(`  ⚠️  Skipping duplicate card: ${card.cardNumber} ${card.playerName} - ${parallelType} /${card.printRun} (slug: ${slug})`);
            continue;
          }

          console.log(`  Creating card: ${card.cardNumber} ${card.playerName} - ${parallelType} /${card.printRun} -> ${slug}`);

          await prisma.card.create({
            data: {
              slug,
              playerName: card.playerName,
              team: card.team,
              cardNumber: card.cardNumber,
              parallelType: `${parallelType} /${card.printRun}`,
              printRun: card.printRun,
              isNumbered: true,
              numbered: `/${card.printRun}`,
              setId: parallelSet.id,
            },
          });
          parallelCardsCreated++;
        }

        totalCardsCreated += parallelCardsCreated;

        parallelSetsCreated.push({
          name: parallelSet.name,
          slug: parallelSet.slug,
          cardsCreated: parallelCardsCreated,
        });
      }

      createdSets.push({
        parentSet: {
          name: parentSet.name,
          slug: parentSet.slug,
          cardsCreated: baseCardsCreated,
        },
        parallels: parallelSetsCreated,
      });

      console.log(`✅ Completed: ${baseSetInfo.name}`);
    }

    console.log(`\n🎉 Import complete!`);

    // Step 7: Return summary
    return NextResponse.json({
      success: true,
      summary: {
        baseSetsCreated: analysis.baseSets.length,
        totalSetsCreated: createdSets.reduce((sum, s) => sum + 1 + s.parallels.length, 0),
        totalCardsCreated,
      },
      sets: createdSets,
    });
  } catch (error) {
    console.error('Excel import error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import Excel file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
