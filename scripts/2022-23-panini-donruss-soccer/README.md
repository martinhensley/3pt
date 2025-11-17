# 2022-23 Panini Donruss Soccer - Import Scripts

This directory contains scripts used to import and fix data for the 2022-23 Panini Donruss Soccer release.

## Release Information

- **Product:** Donruss Soccer
- **Manufacturer:** Panini
- **Year:** 2022-23
- **Release Slug:** `2022-23-panini-donruss-soccer`
- **Total Sets:** 123 sets
- **Total Cards:** 6,609 cards

## Scripts Overview

### `import-donruss-soccer-2022-23.ts`

Main import script that imports all sets and cards from the Excel checklist.

- **Source File:** `/Users/mh/Desktop/2022-23-Donruss-Soccer-Cards-Checklist.xls`
- **Sheet Name:** `2022 Donruss Donruss (22-23) (S`
- **Initial Import:** 138 sets, 7,505 cards
- **Uploads checklist** as source document to Vercel Blob Storage
- **Applies print run mapping** for parallels (Black /1, Green /5, Gold /10, etc.)
- **Creates sets and cards** with proper slugs and relationships

### `fix-rated-rookies-merge.ts`

Merges Rated Rookies sets into their corresponding Base/Optic sets.

- **Sets merged:** 15 (1 Rated Rookies + 14 Rated Rookies Optic)
- **Cards moved:** 300 cards
- **Updates:**
  - Moves cards from "Rated Rookies" to "Base Set"
  - Moves cards from "Rated Rookies Optic *" to "Base Optic *"
  - Updates totalCards to 200 for merged sets
  - Deletes empty Rated Rookies sets

**Note:** 10 Rated Rookies parallel sets (Black, Blue, Gold, Green, Orange, Pink, Purple, Red, Silver, Teal) remain separate because the import created "Base Black" instead of "Base Set Black". These sets contain 25 cards each and represent the Rated Rookies variants for each parallel.

### `verify-import.ts`

Verification script to validate the import results.

- **Checks:**
  - Total set count (123)
  - Total card count (6,609)
  - Base/Optic sets have 200 cards each
  - Correct distribution by set type
  - Identifies remaining Rated Rookies sets

## Running the Scripts

All scripts can be run using `npx tsx`:

```bash
# 1. Main import (run once)
npx tsx scripts/2022-23-panini-donruss-soccer/import-donruss-soccer-2022-23.ts

# 2. Merge Rated Rookies (run once after import)
npx tsx scripts/2022-23-panini-donruss-soccer/fix-rated-rookies-merge.ts

# 3. Verify import (run anytime)
npx tsx scripts/2022-23-panini-donruss-soccer/verify-import.ts
```

## Final Database State

### Total Sets: 123

**By Type:**
- **Base:** 35 sets
  - Base Set (200 cards)
  - Base Optic (200 cards)
  - Base parallels (175 cards each): Black, Blue, Gold, Green, Orange, Pink, Purple, Red, Silver, Teal
  - Base Optic parallels (varies): Black, Blue, Dragon, Gold, Green Ice, Holo, Orange Ice, Photon, Pink Ice, Purple Ice, Purple Mojo, Red, Teal Mojo
  - Rated Rookies parallels (25 cards each): Black, Blue, Gold, Green, Orange, Pink, Purple, Red, Silver, Teal

- **Insert:** 58 sets
  - 1992 Donruss Tribute (base + 6 parallels) = 7 sets
  - Craftsmen (base + 6 parallels) = 7 sets
  - Elite Series (base + 6 parallels) = 7 sets
  - Kaboom (1 set)
  - Net Marvels (base + 6 parallels) = 7 sets
  - Night Moves (1 set)
  - Pitch Kings (base + 6 parallels, Purple has 24 cards) = 7 sets
  - Rookie Kings (base + 6 parallels) = 7 sets
  - The Rookies (base + 6 parallels) = 7 sets
  - Zero Gravity (base + 6 parallels) = 7 sets

- **Autograph:** 24 sets
  - Beautiful Game Autographs (base + 7 parallels) = 8 sets
  - Beautiful Game Dual Autographs (base + 7 parallels) = 8 sets
  - Signature Series (base + 7 parallels) = 8 sets

- **Memorabilia:** 6 sets
  - Kit Kings (base + 2 parallels) = 3 sets
  - Kit Series (base + 2 parallels) = 3 sets

### Total Cards: 6,609

## Print Run Mapping

The import uses official Donruss print run specifications:

```typescript
const PRINT_RUNS = {
  // Base/Rated Rookies Parallels
  'Black': 1,
  'Green': 5,
  'Gold': 10,
  'Purple': 25,
  'Blue': 49,
  'Red': 99,
  'Teal': 199,
  'Silver': null,  // Unlimited
  'Orange': null,  // Unlimited
  'Pink': null,    // Unlimited

  // Optic Parallels
  'Dragon': 8,
  'Photon': null,
  'Holo': null,
  'Green Ice': null,
  'Orange Ice': null,
  'Pink Ice': 25,
  'Purple Ice': null,
  'Purple Mojo': 25,
  'Teal Mojo': 199,
};
```

## Key Learnings

1. **Excel File Format:** The source file is in old .xls format, requiring special handling in the XLSX library. Column headers are mapped to weird names (`__EMPTY`, `__EMPTY_1`, etc.).

2. **Rated Rookies Structure:** Per Donruss product structure, Rated Rookies should be the last 25 cards (176-200) of Base/Optic sets, not separate sets. The merge script consolidates this structure.

3. **Partial Merge:** Only Rated Rookies Optic sets fully merged because Base parallels were named "Base Black" instead of "Base Set Black". The 10 remaining Rated Rookies parallel sets are acceptable as standalone sets.

4. **Card Counts:** Some sets have irregular card counts (e.g., Pitch Kings Purple has 24 instead of 25, Kit Kings/Series parallels have 39 instead of 50). These variations match the official checklist.

## Data Sources

**Source Document:** `/Users/mh/Desktop/2022-23-Donruss-Soccer-Cards-Checklist.xls`

Uploaded to Vercel Blob Storage as part of the import process. Available for download via the admin interface for verification and reference.

## Comparison to 2024-25 Donruss

The 2022-23 release has fewer sets than 2024-25:
- 2022-23: 123 sets, 6,609 cards
- 2024-25: 116 sets, 8,947 cards (after merge)

Both releases follow the same Donruss product structure with Base, Optic, inserts, autographs, and memorabilia sets.

---

*Last Updated: November 17, 2025*
