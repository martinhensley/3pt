# Checklist Release ETL

**Extract, Transform, and Load** sets and cards from release checklist files (Excel/CSV) into Neon PostgreSQL via Prisma ORM.

## ETL Process Overview

This skill implements a complete ETL pipeline for trading card release data:

### **Extract** 📥
- Parse Excel (.xls, .xlsx) or CSV files containing card checklists
- Handle various checklist formats and structures
- Identify columns: Card Set, Card Number, Player, Team, Print Run
- Handle edge cases: wrapped quotes, special characters, empty fields

### **Transform** 🔄
- Map flat checklist data to relational database schema
- Determine set types (Base, Insert, Autograph, Memorabilia)
- Identify and process parallel sets with variants and print runs
- Generate URL-friendly slugs for all entities
- Merge special cases (e.g., Rated Rookies into Base sets)
- Apply business rules (print run mappings, parallel naming)
- Validate data integrity and relationships

### **Load** 💾
- Insert data into Neon PostgreSQL via Prisma ORM
- Create/update Manufacturer → Release → Set → Card hierarchy
- Handle duplicate detection and conflict resolution
- Upload source checklist to Vercel Blob Storage
- Create SourceDocument records linking files to releases
- Maintain referential integrity across all tables

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

```
🎯 Checklist Release ETL

Step 1: Extract - Select Release
Available releases needing import:
  1. 2016-17 Panini Donruss Basketball
  2. 2024-25 Panini Revolution Basketball

Which release? 1

Step 2: Extract - Provide Source File
Path to checklist (Excel/CSV): /Users/mh/Desktop/checklist.csv

Step 3: Transform - Analyzing Structure
📊 Parsing CSV with 1,033 rows
🔍 Detected 22 unique sets
🔄 Identifying parallels and variants
   - Base (200 cards)
   - Base Holo Blue Laser (150 cards) → Parallel of Base
   - All-Stars Press Proof Black (30 cards) → Parallel of All-Stars

⚙️  Applying transformation rules:
   - Merging Rookies (151-200) into Base set
   - Mapping print runs (Black=1, Blue=99)
   - Generating slugs for 1,033 cards

Step 4: Load - Writing to Neon PostgreSQL
💾 Creating sets...
   ✅ Created 22 sets
💾 Inserting cards...
   ✅ Inserted 1,033 cards
📦 Uploading checklist to blob storage...
   ✅ Saved to library

✅ ETL Complete!
   Source: 1,033 rows (CSV)
   Target: 22 sets, 1,033 cards (PostgreSQL)
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

  // Upload source to blob storage
  await uploadChecklistToRelease(checklistPath, release.id, displayName);

  console.log('✅ ETL Complete!');
}
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
