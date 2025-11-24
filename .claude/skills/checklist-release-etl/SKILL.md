---
name: checklist-release-etl
description: "Local-First ETL for trading card releases. Generate TypeScript import scripts for PDF/Excel checklists with parallel detection and print run mapping."
---

# Checklist Release ETL

**Local-First ETL**: Generate TypeScript import scripts for trading card releases. Each release gets a dedicated script in `/scripts/{year}-{release}/`.

## Philosophy: One-Off Scripts > Generic Web App

This skill helps you create **custom import scripts per release** rather than building a generic web app. Benefits:

- ✅ **No hosting costs** - Scripts run locally via Claude Code
- ✅ **Version controlled** - Each release's script lives in your repo
- ✅ **Customizable** - Easy to handle per-release quirks
- ✅ **Debuggable** - TypeScript with full IDE support
- ✅ **No API costs** - Direct database writes via Prisma

## ETL Process Overview

This skill guides you through creating local TypeScript import scripts:

### **Extract** 📥
- Parse checklist files (Excel/CSV/PDF) using Claude Code's vision
- Split large PDFs into logical sections (Base, Insert, Autograph, Memorabilia)
- Extract structured data: Set names, card numbers, players, teams, print runs
- **Process each section separately** to avoid missing data

**PDF Extraction Strategy:**
1. **Section-by-Section Processing** - Don't process entire PDF at once
2. **Split by Set Type**:
   - Pages 1-X: Base sets → Extract separately
   - Pages X-Y: Insert sets → Extract separately
   - Pages Y-Z: Autograph sets → Extract separately
   - Pages Z-End: Memorabilia sets → Extract separately
3. **Verification After Each Section** - Confirm counts before moving on
4. **Combine Results** - Merge all sections into final dataset

### **Transform** 🔄
- Generate TypeScript import script with structured data
- Determine set types (Base, Insert, Autograph, Memorabilia)
- Identify parallels and variants
- Generate slugs for sets and cards
- Apply business rules (Rated Rookies merging, print run mappings)

### **Load** 💾
- User runs generated TypeScript script locally
- Script inserts data via Prisma ORM to Neon PostgreSQL
- Handles duplicate detection (idempotent scripts)
- (Optional) Upload source files to Vercel Blob

## Database Schema Mapping

### Source Format (Excel/CSV)
```csv
Card Set,Card Number,Player,Team,Print Run
"Base,1,Joel Embiid,Philadelphia 76ers,"
"Base Holo Blue Laser,1,Joel Embiid,Philadelphia 76ers,"
"All-Stars Press Proof Black,1,Kobe Bryant,Los Angeles Lakers,1"
```

### Target Schema (PostgreSQL)
```typescript
Manufacturer
  └── Release {
      id: string
      name: string
      year: string
      slug: string (unique)
      releaseDate: string
  }
      └── Set {
          id: string
          name: string
          slug: string (unique)
          type: 'Base' | 'Insert' | 'Autograph' | 'Memorabilia'
          isParallel: boolean
          baseSetSlug: string?
          printRun: number?
          releaseId: string (FK)
      }
          └── Card {
              id: string
              slug: string (unique)
              cardNumber: string
              playerName: string
              team: string
              variant: string?
              printRun: number?
              numbered: string? ("1 of 1", "/99")
              rarity: 'base' | 'rare' | 'super_rare' | 'ultra_rare' | 'one_of_one'
              setId: string (FK)
          }
```

## Transformation Rules

### Set Type Classification
```typescript
function determineSetType(setName: string): SetType {
  const lower = setName.toLowerCase();

  // Autograph sets
  if (lower.includes('autograph') || lower.includes('signature')) {
    return 'Autograph';
  }

  // Memorabilia sets
  if (lower.includes('materials') || lower.includes('jersey')) {
    return 'Memorabilia';
  }

  // Base sets (includes variations)
  if (lower.includes('base') || lower.includes('optic') || lower.includes('rookies')) {
    return 'Base';
  }

  // Default to Insert
  return 'Insert';
}
```

### Parallel Detection & Print Run Mapping
```typescript
const PRINT_RUNS: Record<string, number | null> = {
  'Black': 1,              // 1/1
  'Green': 5,              // /5
  'Gold': 10,              // /10
  'Purple': 25,            // /25
  'Blue': 49,              // /49
  'Red': 99,               // /99
  'Press Proof': null,     // Unnumbered
  'Holo Blue Laser': null, // Unnumbered
};

function extractParallelInfo(setName: string): {
  baseSetName: string;
  variantName: string | null;
  printRun: number | null;
} {
  // Check for known parallel suffixes
  for (const parallel of KNOWN_PARALLELS) {
    if (setName.endsWith(' ' + parallel)) {
      const baseSetName = setName.substring(0, setName.length - parallel.length - 1);
      return {
        baseSetName,
        variantName: parallel,
        printRun: PRINT_RUNS[parallel] ?? null
      };
    }
  }

  // Not a parallel - return as-is
  return { baseSetName: setName, variantName: null, printRun: null };
}
```

### Slug Generation
```typescript
// Set slugs
generateSetSlug(year, release, setName, setType, variantName?, printRun?)
// Example: "2016-17-donruss-basketball-base-holo-blue-laser-parallel"

// Card slugs
generateCardSlug(manufacturer, release, year, setName, cardNumber, player, variant?, printRun?, setType)
// Example: "2016-17-donruss-basketball-all-stars-1-kobe-bryant-press-proof-black-1"
```

## User Workflow

### New Workflow: Generate TypeScript Import Script
```
🎯 Checklist Release ETL - Local Script Generation

Step 1: Identify Release & Sections
Release: 2016-17 Panini Absolute Basketball
Checklist file: /path/to/checklist.pdf (148 pages)

📋 Completeness Checklist:
  □ Base sets (pages 1-20)
  □ Insert sets (pages 21-25)
  □ Autograph sets (pages 26-85)
  □ Memorabilia sets (pages 86-148)

Step 2: Extract Section-by-Section
Processing Base Sets (pages 1-20):
  ✅ Extracted 3 sets, 600 cards

Processing Insert Sets (pages 21-25):
  ✅ Extracted 1 set, 25 cards

Processing Autograph Sets (pages 26-85):
  ✅ Extracted 15 sets, 453 cards

Processing Memorabilia Sets (pages 86-148):
  ✅ Extracted 24 sets, 687 cards

📊 Verification Summary:
  - Base: 3 sets ✓
  - Insert: 1 set ✓
  - Autograph: 15 sets ✓
  - Memorabilia: 24 sets ✓
  - Total: 43 sets, 1,765 cards

❓ Does this look complete? (y/n): y

Step 3: Generate Import Scripts
Creating scripts in /scripts/2016-17-panini-absolute-basketball/:
  ✅ import-autographs.ts (15 sets, 453 cards)
  ✅ import-memorabilia.ts (24 sets, 687 cards)
  ✅ import-inserts.ts (1 set, 25 cards)

Step 4: User Runs Scripts Locally
$ npx tsx scripts/2016-17-panini-absolute-basketball/import-autographs.ts
  ✅ Imported 15 autograph sets, 453 cards

$ npx tsx scripts/2016-17-panini-absolute-basketball/import-memorabilia.ts
  ✅ Imported 24 memorabilia sets, 687 cards

$ npx tsx scripts/2016-17-panini-absolute-basketball/import-inserts.ts
  ✅ Imported 1 insert set, 25 cards

✅ Import Complete!
  Scripts saved to: /scripts/2016-17-panini-absolute-basketball/
  Database: 43 sets, 1,765 cards imported
```

## Implementation Pattern

```typescript
async function etlChecklistToDatabase(
  checklistPath: string,
  releaseSlug: string
) {
  // EXTRACT
  console.log('📥 Extracting from:', checklistPath);
  const csvContent = fs.readFileSync(checklistPath, 'utf-8');
  const records = parse(csvContent, { columns: true });

  // TRANSFORM
  console.log('🔄 Transforming data...');
  const cardsBySet = new Map<string, CardData[]>();

  for (const record of records) {
    // Parse CSV row
    let setName = record['Card Set'];
    const cardNumber = record['Card Number'];
    const playerName = record['Player'];
    const team = record['Team'];
    const printRun = record['Print Run'] ? parseInt(record['Print Run']) : null;

    // Apply business rules
    if (setName === 'Rookies') {
      setName = 'Base'; // Merge Rookies into Base
    }

    // Group by set
    if (!cardsBySet.has(setName)) {
      cardsBySet.set(setName, []);
    }
    cardsBySet.get(setName)!.push({
      setName, cardNumber, playerName, team, printRun
    });
  }

  // LOAD
  console.log('💾 Loading to Neon PostgreSQL...');

  for (const [fullSetName, cards] of cardsBySet.entries()) {
    // Classify and extract parallel info
    const { baseSetName, variantName, printRun } = extractParallelInfo(fullSetName);
    const setType = determineSetType(baseSetName);
    const isParallel = variantName !== null;

    // Generate slug
    const slug = generateSetSlug(year, release, baseSetName, setType, variantName, printRun);

    // Insert Set
    const dbSet = await prisma.set.upsert({
      where: { slug },
      update: {},
      create: {
        name: fullSetName,
        slug,
        type: setType,
        isParallel,
        baseSetSlug: isParallel ? generateSetSlug(year, release, baseSetName, setType) : null,
        printRun,
        releaseId: release.id
      }
    });

    // Insert Cards
    for (const card of cards) {
      const cardSlug = generateCardSlug(
        manufacturer, release, year, baseSetName,
        card.cardNumber, card.playerName, variantName,
        card.printRun ?? printRun, setType
      );

      await prisma.card.create({
        data: {
          slug: cardSlug,
          cardNumber: card.cardNumber,
          playerName: card.playerName,
          team: card.team,
          variant: variantName,
          printRun: card.printRun ?? printRun,
          numbered: formatPrintRun(card.printRun ?? printRun),
          rarity: calculateRarity(card.printRun ?? printRun),
          setId: dbSet.id
        }
      });
    }
  }

  // Optional: Upload source to blob storage
  // await uploadChecklistToRelease(checklistPath, release.id, displayName);

  console.log('✅ ETL Complete!');
  console.log(`Imported ${setCount} sets and ${cardCount} cards`);
}
```

## Verification Steps

**CRITICAL: Verify completeness before running import**

### Pre-Import Checklist
Before running generated scripts, confirm:
- ✅ All Base sets extracted (including parallels)?
- ✅ All Insert sets extracted?
- ✅ All Autograph sets extracted?
- ✅ All Memorabilia sets extracted?

### Post-Extraction Verification
After each section, show summary:
```
📊 Extraction Summary - Base Sets:
  Sets: 3 (Base, Base Spectrum Black /1, Base Spectrum Gold /10)
  Cards: 600 total
  Expected: ~3 sets, ~600 cards ✓

Continue to next section? (y/n)
```

### Expected Set Counts
Ask user at start:
```
How many total sets do you expect in this release?
(Leave blank if unknown): 43

We'll validate against this count at the end.
```

## Error Handling

### Extract Phase Errors
- **File not found**: Verify path and retry
- **Invalid format**: Check CSV/Excel structure
- **Corrupted file**: Request new copy

### Transform Phase Errors
- **Missing columns**: Halt with clear message
- **Invalid data types**: Skip row with warning
- **Slug conflicts**: Auto-increment or prompt user

### Load Phase Errors
- **Duplicate slugs**: Skip existing (idempotent)
- **Database connection**: Retry with exponential backoff
- **Foreign key violations**: Verify release exists first

## Data Quality Checks

Before loading:
1. ✅ All required fields present (Card Set, Card Number, Player)
2. ✅ Valid print runs (numeric or null)
3. ✅ Set types correctly classified
4. ✅ Parallel relationships identified
5. ✅ Slugs are unique and valid
6. ✅ No orphaned records

## Integration with Neon PostgreSQL

### Connection Setup
```typescript
// Prisma connects to Neon via DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Neon connection string
    }
  }
});
```

### Transaction Support
```typescript
// Wrap in transaction for atomicity
await prisma.$transaction(async (tx) => {
  // Create sets
  const sets = await tx.set.createMany({ data: setsData });

  // Create cards
  const cards = await tx.card.createMany({ data: cardsData });

  // Upload checklist
  await uploadChecklistToRelease(path, releaseId, name);
});
```

## Performance Considerations

- **Batch inserts**: Use `createMany()` for bulk operations
- **Indexing**: Slugs are indexed for fast lookups
- **Connection pooling**: Prisma manages connection pool to Neon
- **Streaming**: For large files, process in chunks
- **Caching**: Cache print run mappings and set types

## Related Files

- `/lib/slugGenerator.ts` - Slug generation utilities
- `/lib/checklistUploader.ts` - Blob storage upload
- `/scripts/2016-17-panini-donruss-basketball/` - Example import
- `/.claude/CLAUDE.md` - Data import requirements
- `/prisma/schema.prisma` - Database schema definition
