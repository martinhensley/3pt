---
description: "Generate TypeScript import scripts for trading card release checklists (PDF/Excel)"
---

You are helping the user import a trading card release checklist into the Footy.bot database.

# Your Task

Guide the user through an interactive ETL process to:
1. Extract data from checklist files (PDF/Excel)
2. Transform into structured TypeScript import scripts
3. Help user run scripts to load data into PostgreSQL

# Step-by-Step Workflow

## Step 1: Gather Release Information

**CRITICAL REQUIREMENT**: The release MUST already exist in the database. The ETL process can ONLY add sets and cards to existing releases. It CANNOT create new releases.

Before proceeding, verify the release exists:
1. Query the database to list existing releases
2. Show the user the available releases
3. Ask which existing release they want to add data to

Then gather:
- **Existing release slug** (REQUIRED - must match exactly)
- Checklist file path
- Expected number of sets (if known)

Example query to find releases:
```typescript
const releases = await prisma.release.findMany({
  select: { slug: true, name: true, year: true }
});
```

If the release doesn't exist, instruct the user to create it first through the admin interface or a separate script.

## Step 2: Analyze Checklist Structure

Use the Read tool to examine the checklist file:
- If PDF: Use AI vision to extract table data
- If Excel/CSV: Parse directly

Identify sections:
- Base sets (pages/rows X-Y)
- Insert sets (pages/rows X-Y)
- Autograph sets (pages/rows X-Y)
- Memorabilia sets (pages/rows X-Y)

**CRITICAL**: Process large PDFs section-by-section to avoid missing data!

## Step 3: Extract Data Section-by-Section

For EACH section:

1. **Extract structured data** using AI or CSV parsing
2. **Show summary** to user:
   ```
   📊 Extraction Summary - Base Sets:
     Sets: 3 (Base, Base Holo, Base Gold /10)
     Cards: 600 total
   ```
3. **Get confirmation** before moving to next section

Expected data structure:
```typescript
{
  setName: string,
  cardNumber: string,
  playerName: string,
  team: string,
  printRun: number | null
}
```

## Step 4: Transform & Generate Import Script

Create a TypeScript script at `/scripts/etl/{year}-{release}/import-{section}.ts` with:

1. **Import statements**:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

2. **Slug generation utilities** (from /lib/slugGenerator.ts)

3. **Parallel detection logic**:
```typescript
const PRINT_RUNS: Record<string, number | null> = {
  'Black': 1,
  'Gold': 10,
  'Purple': 25,
  'Blue': 49,
  'Red': 99,
  'Press Proof': null,
};
```

4. **Set type classification**:
```typescript
function determineSetType(setName: string): 'Base' | 'Insert' | 'Autograph' | 'Memorabilia' {
  const lower = setName.toLowerCase();
  if (lower.includes('autograph') || lower.includes('signature')) return 'Autograph';
  if (lower.includes('materials') || lower.includes('jersey')) return 'Memorabilia';
  if (lower.includes('base') || lower.includes('optic')) return 'Base';
  return 'Insert';
}
```

5. **Main import logic**:
```typescript
async function importData() {
  // CRITICAL: Find existing release - do NOT create if not found
  const release = await prisma.release.findUnique({
    where: { slug: RELEASE_SLUG }
  });

  if (!release) {
    throw new Error(`Release '${RELEASE_SLUG}' not found in database. Please create the release first.`);
  }

  console.log(`✅ Found existing release: ${release.name} (${release.slug})\n`);

  // Upload source file to release.sourceFiles JSON array
  const csvFilename = path.basename(CSV_PATH);
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const currentSourceFiles = (release.sourceFiles as any[]) || [];
  const fileExists = currentSourceFiles.some((file: any) => file.filename === csvFilename);

  if (!fileExists) {
    const updatedSourceFiles = [
      ...currentSourceFiles,
      {
        filename: csvFilename,
        type: 'csv', // or 'pdf', 'xlsx'
        content: csvContent,
        uploadedAt: new Date().toISOString(),
      },
    ];
    await prisma.release.update({
      where: { id: release.id },
      data: { sourceFiles: updatedSourceFiles },
    });
  }

  // For each set
  for (const [setName, cards] of cardsBySet.entries()) {
    // Detect parallels
    const { baseSetName, variantName, printRun } = extractParallelInfo(setName);

    // Generate slug
    const slug = generateSetSlug(year, release, baseSetName, setType, variantName, printRun);

    // Upsert set
    const dbSet = await prisma.set.upsert({...});

    // Insert cards
    for (const card of cards) {
      await prisma.card.create({...});
    }
  }
}
```

## Step 5: Guide User to Run Script

Show instructions:
```
✅ Import script created: /scripts/etl/2024-25-donruss-soccer/import-base.ts

To import this data, run:
  npx tsx scripts/etl/2024-25-donruss-soccer/import-base.ts

The script will:
  - Create/update the release record
  - Upload source checklist file to release.sourceFiles
  - Create all sets with proper types and parallel relationships
  - Import all cards with slugs and metadata
```

## Step 6: Verification

After user runs script, verify:
```sql
-- Check set count
SELECT COUNT(*) FROM "Set" WHERE "releaseId" = '...';

-- Check card count
SELECT COUNT(*) FROM "Card" WHERE "setId" IN (...);

-- Check parallel relationships
SELECT name, "isParallel", "baseSetSlug" FROM "Set" WHERE "releaseId" = '...';
```

# Important Business Rules

## Donruss Rated Rookies
**CRITICAL**: Donruss Rated Rookies (cards 176-200) should be merged into Base/Optic sets, NOT separate sets.

If checklist lists them separately:
1. Import as-is first
2. Run merge script to combine
3. Verify Base/Optic sets have 200 cards

## Print Run Mapping

Standard parallel print runs:
- Black: 1/1
- Green: /5
- Gold: /10
- Purple: /25
- Blue: /49
- Red: /99
- Press Proof: Unnumbered
- Holo variations: Unnumbered

## Slug Generation Rules

**Set slugs:**
```
{year}-{release}-{type-prefix}-{setname}[-{parallel}][-{printrun}]
```

**Card slugs:**
```
{year}-{release}-{set}-{cardNumber}-{player}-{printRun}
```

Exception: Parallel cards exclude base set name from slug.

## Set Type Classification

- **Base**: Base sets and their parallels, Optic variations
- **Insert**: Special insert sets (All-Stars, Rookies, etc.)
- **Autograph**: Sets with autographs/signatures
- **Memorabilia**: Jersey/patch cards

# Error Handling

- **Missing columns**: Halt with clear error message
- **Invalid data**: Skip row with warning, log to console
- **Duplicate slugs**: Use upsert (idempotent)
- **Connection errors**: Show clear database connection instructions

# Data Quality Checks

Before generating script, verify:
- ✅ All required fields present (Set, Number, Player)
- ✅ Print runs are numeric or null
- ✅ Set types correctly classified
- ✅ Parallel relationships identified
- ✅ Expected set count matches (if provided)
- ✅ Source file will be uploaded to release.sourceFiles (REQUIRED)

# Reference Files

- `/lib/slugGenerator.ts` - Slug utilities
- `/docs/IMPORT_GUIDE.md` - Import documentation
- `/docs/SLUG_CONVENTIONS.md` - Slug rules
- `/docs/PARALLEL_ARCHITECTURE.md` - Parallel set architecture
- `/scripts/etl/` - Release-specific ETL import scripts

# Tips

1. **Process PDFs section-by-section** - Don't try to extract entire PDF at once
2. **Show summaries after each section** - Let user verify before continuing
3. **Use upsert for idempotence** - Scripts can be run multiple times safely
4. **Generate one script per section** - Easier to debug and re-run
5. **Verify counts** - Always compare extracted counts to expected totals

---

**Now begin by asking the user for the release information!**
