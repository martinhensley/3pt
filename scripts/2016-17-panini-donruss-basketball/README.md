# 2016-17 Panini Donruss Basketball Import

This directory contains the import script and source data for the 2016-17 Panini Donruss Basketball release.

## Files

- `import-donruss-basketball-2016.ts` - Main import script
- `2016-17-Panini-Donruss-Basketball-Checklist.csv` - Source checklist data (1,033 cards)

## Import Summary

**Release:** 2016-17 Panini Donruss Basketball
**Release Date:** November 23, 2016
**Total Sets:** 22
**Total Cards:** 1,033

### Set Breakdown

- **Base Sets:** 6 sets (605 cards)
  - Base (200 cards) - includes merged Rookies (151-200)
  - Base Holo Blue Laser (150 cards)
  - Base Holo Green Laser (150 cards)
  - Optic Preview (100 cards)
  - The Rookies (5 cards)

- **Insert Sets:** 10 sets (254 cards)
  - All-Stars + Press Proof variants
  - Court Kings, Crashers, Dimes, Elite Series, Hall Kings, The Champ is Here

- **Autograph Sets:** 4 sets (119 cards)
  - Dominator Signatures, Elite Signatures, Next Day Autographs, Timeless Treasures Materials Signatures

- **Memorabilia Sets:** 2 sets (55 cards)
  - Back to the Future Materials, Jersey Kings

## How to Run

From the project root:

```bash
npx tsx scripts/2016-17-panini-donruss-basketball/import-donruss-basketball-2016.ts
```

## Key Features

- **Rookies Merge:** Cards 151-200 from "Rookies" set are merged into the "Base" set
- **Press Proof Parallels:** All Press Proof variants are properly linked to their base sets
- **Print Runs:** Card-specific print runs preserved from CSV data
- **Set Types:** Correctly categorized as Base, Insert, Autograph, or Memorabilia

## CSV Format

The source CSV has an unusual format with each line wrapped in quotes. The import script handles this by:

```typescript
csvContent = csvContent.replace(/^"(.+)"$/gm, '$1');
```

Columns:
- Card Set
- Card Number
- Player
- Team
- Print Run (optional)

## Basketball-Specific Parallels

```typescript
const PRINT_RUNS = {
  'Black': 1,
  'Blue': 99,
  'Press Proof': null,  // Unnumbered
  'Press Proof Black': 1,
  'Press Proof Blue': 99,
  'Holo Blue Laser': null,
  'Holo Green Laser': null,
};
```
