# Data Import Guide

Complete guide for importing trading card data into 3pt.bot.

## Table of Contents
- [Checklist Upload Requirement](#checklist-upload-requirement)
- [Script Organization](#script-organization)
- [Import Workflow](#import-workflow)

---

## Checklist Upload Requirement

**CRITICAL**: All import scripts MUST upload the source checklist file to ensure traceability and data integrity.

### Why This Matters

- **Traceability**: Always able to reference the original source data
- **Verification**: Users can download and verify card data
- **Compliance**: Proper attribution to manufacturers
- **Data Integrity**: Ability to re-import or correct data from original source

### Upload Process

Every import script must include these steps:

1. **Upload the checklist file** to Vercel Blob Storage
2. **Create a SourceDocument record** linking the checklist to the release
3. **Import sets and cards** from the checklist data

### Example Implementation

```typescript
import { uploadChecklistToRelease, getExistingChecklist } from '@/lib/checklistUploader';
import path from 'path';

async function main() {
  // 1. Create/find the release
  const release = await prisma.release.create({
    data: {
      name: 'Obsidian Soccer',
      year: '2024-25',
      slug: '2024-25-panini-obsidian-soccer',
      manufacturerId: manufacturerId
    }
  });

  // 2. Upload the checklist (REQUIRED)
  const checklistPath = '/Users/mh/Desktop/2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls';
  const filename = path.basename(checklistPath);

  const existing = await getExistingChecklist(release.id, filename);

  if (!existing) {
    console.log('\n📤 Uploading checklist...');
    await uploadChecklistToRelease(
      checklistPath,
      release.id,
      '2024-25 Panini Obsidian Soccer Checklist'
    );
    console.log('✅ Checklist uploaded successfully\n');
  } else {
    console.log('ℹ️  Checklist already uploaded\n');
  }

  // 3. Import sets and cards
  // ... rest of import logic
}
```

### Detailed Documentation

- See `/scripts/README-CHECKLIST-UPLOAD.md` for complete implementation guide
- See `/lib/checklistUploader.ts` for utility functions

---

## Script Organization

**REQUIRED**: After completing an import or developing correction scripts for a release, all related scripts MUST be organized into a dedicated folder with comprehensive documentation.

### Folder Structure

```
/scripts/{release-slug}/
  ├── README.md                          # Comprehensive documentation
  ├── import-{release}.ts                # Main import script
  ├── fix-*.ts                           # Data correction scripts
  ├── check-*.ts                         # Diagnostic/verification scripts
  └── verify-*.ts                        # Post-import validation scripts
```

### Naming Convention

- Use the release slug as the folder name (e.g., `road-to-qatar-2021-22`, `obsidian-2024-25`)
- Prefix scripts with their purpose:
  - `import-` - Initial data import
  - `fix-` - Data corrections
  - `check-` - Diagnostic queries
  - `verify-` - Validation scripts

### README.md Requirements

Every script folder MUST include a comprehensive README.md with:

1. **Release Information**
   - Product name
   - Manufacturer
   - Release slug
   - Total sets and cards

2. **Scripts Overview**
   - Description of each script
   - What it fixes/checks
   - Number of sets/cards affected
   - Official specifications (for fix scripts)

3. **Running Instructions**
   - Example commands for each script
   - Order of execution if dependencies exist

4. **Summary of Corrections**
   - Total updates made
   - Issues fixed
   - Database changes
   - Data sources

### Example README Template

```markdown
# {Year} {Manufacturer} {Product Name} - Data Correction Scripts

This directory contains scripts used to correct and fix data issues in the {Product Name} release.

## Release Information

- **Product:** {Product Name}
- **Manufacturer:** {Manufacturer}
- **Release Slug:** `{release-slug}`
- **Total Sets:** X sets
- **Total Cards:** Y cards

## Scripts Overview

### Category Name

**`script-name.ts`**
- Description of what it does
- Updates X sets and Y cards
- Official specs:
  - Spec 1
  - Spec 2

## Running the Scripts

All scripts can be run using `npx tsx`:

\`\`\`bash
npx tsx scripts/{release-slug}/script-name.ts
\`\`\`

## Summary of Corrections

### Total Updates
- **X sets corrected**
- **Y cards updated**

### Issues Fixed
1. ✅ Issue description (X sets)
2. ✅ Issue description (Y sets)

### Database Changes
- Field updates made
- Cascade effects

### Data Sources

**Source Document:** Path to checklist file

## Notes

- Any special notes about the data
- Edge cases handled
- Known limitations
```

### When to Consolidate

Consolidate scripts into a dedicated folder when:
- Import is complete and verified
- Multiple fix scripts have been created
- Ready for final documentation
- Moving on to next release

### Example Implementations

- `/scripts/road-to-qatar-2021-22/` - 11 scripts with comprehensive README
- `/scripts/obsidian-2024-25/` - Import and verification scripts
- `/scripts/donruss-2024-25/` - Import and fix scripts

### Benefits

- **Organization**: All related scripts in one place
- **Documentation**: Clear purpose and usage for each script
- **Traceability**: Official specs documented alongside corrections
- **Maintainability**: Easy to find and update scripts
- **Knowledge Transfer**: Future developers can understand the import process

---

## Import Workflow

### Step 1: Prepare Data

1. Obtain official manufacturer checklist (Excel, PDF, etc.)
2. Review for data quality and completeness
3. Identify any known issues or special cases

### Step 2: Create Import Script

```typescript
// scripts/import-{product}.ts
import { PrismaClient } from '@prisma/client';
import { uploadChecklistToRelease } from '@/lib/checklistUploader';

const prisma = new PrismaClient();

async function main() {
  // Find or create manufacturer
  const manufacturer = await prisma.manufacturer.upsert({
    where: { name: 'Panini' },
    update: {},
    create: { name: 'Panini', slug: 'panini' }
  });

  // Create release
  const release = await prisma.release.create({
    data: {
      name: 'Obsidian Soccer',
      year: '2024-25',
      slug: '2024-25-panini-obsidian-soccer',
      manufacturerId: manufacturer.id
    }
  });

  // Upload checklist (REQUIRED)
  await uploadChecklistToRelease(
    '/path/to/checklist.xls',
    release.id,
    'Checklist Name'
  );

  // Import sets and cards
  // ... your import logic ...

  console.log('✅ Import complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 3: Run Import

```bash
npx tsx scripts/import-{product}.ts
```

### Step 4: Verify Import

Create a verification script to check:

```typescript
// scripts/verify-{product}.ts
const release = await prisma.release.findUnique({
  where: { slug: 'release-slug' },
  include: {
    sets: {
      include: { cards: true }
    }
  }
});

console.log(`Total sets: ${release.sets.length}`);
console.log(`Total cards: ${release.sets.reduce((sum, s) => sum + s.cards.length, 0)}`);

// Check for issues
const setsWithoutCards = release.sets.filter(s => s.cards.length === 0);
if (setsWithoutCards.length > 0) {
  console.warn(`⚠️  ${setsWithoutCards.length} sets have no cards`);
}
```

### Step 5: Create Fix Scripts

If issues are found, create fix scripts:

```typescript
// scripts/fix-{issue}.ts
await prisma.set.updateMany({
  where: { releaseId, printRun: null },
  data: { printRun: 299 }
});
```

### Step 6: Organize Scripts

Once import is complete and verified, consolidate all scripts into a dedicated folder with comprehensive README.

---

## Related Documentation

- [Checklist Upload README](/scripts/README-CHECKLIST-UPLOAD.md) - Detailed upload guide
- [Database Schema](/docs/DATABASE.md) - Understanding data models
- [Slug Conventions](/docs/SLUG_CONVENTIONS.md) - Generating proper slugs
- [Donruss Guide](/docs/DONRUSS_GUIDE.md) - Special handling for Donruss products

---

*Last Updated: November 26, 2025*
