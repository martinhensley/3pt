# 2021-22 Panini Donruss Road to Qatar Soccer - Data Correction Scripts

This directory contains scripts used to correct and fix data issues in the 2021-22 Panini Donruss Road to Qatar Soccer release.

## Release Information

- **Product:** 2021-22 Panini Donruss Road to Qatar Soccer
- **Manufacturer:** Panini
- **Release Slug:** `2021-22-panini-donruss-road-to-qatar-soccer`
- **Total Sets:** ~48 sets
- **Total Cards:** ~5,918 cards

## Scripts Overview

### Base & Optic Parallel Print Runs

**`fix-road-to-qatar-base-parallels.ts`**
- Corrects print runs for all Base parallel sets
- Updates 11 sets and 2,200 cards
- Official specs:
  - Base: Unnumbered
  - Press Proof Gold: /349
  - Press Proof Purple: /199
  - Holo Purple Laser: /99
  - Holo Red Laser: /99
  - Holo Blue Laser: /49
  - Holo Pink Laser: /25
  - Holo Gold Laser: /10
  - Holo Green Laser: Unnumbered
  - Holo Orange Laser: Unnumbered
  - Holo Black Laser: 1/1

**`fix-road-to-qatar-optic-parallels.ts`**
- Corrects print runs for all Optic parallel sets
- Updates 14 sets and 2,800 cards
- Official specs:
  - Optic: Unnumbered
  - Optic Holo: Unnumbered
  - Blue Velocity, Green Velocity, Red Velocity: Unnumbered
  - Red: /149
  - Blue: /99
  - Purple Velocity: /99
  - Orange Velocity: /49
  - Black Velocity: /25
  - Pink Velocity: /25
  - Gold: /10
  - Red and Gold Velocity: /8
  - Gold Vinyl: 1/1

### Autograph Sets

**`fix-beautiful-game-names.ts`**
- Renames Beautiful Game sets to include "Autographs" in names
- Updated 7 sets (315 cards)

**`fix-beautiful-game-types-and-slugs.ts`**
- Changes Beautiful Game sets from "Insert" to "Autograph" type
- Fixes baseSetSlug references for parallel sets
- Updated 6 parallel sets

**`fix-dual-autographs.ts`**
- Changes Beautiful Game Dual Autographs from "Insert" to "Autograph" type
- Fixes isParallel and baseSetSlug references
- Updated 3 sets (15 cards)

**`fix-signature-series-print-runs.ts`**
- Sets Signature Series Black to 1/1
- Updated 1 set (45 cards)

### Memorabilia Sets

**`fix-kit-kings-print-runs.ts`**
- Sets Kit Kings Prime to /10 (variable /3 to /10)
- Sets Kit Kings Super Prime to 1/1
- Updated 2 sets (95 cards)

**`fix-kit-series-print-runs.ts`**
- Sets Kit Series Prime to /10 (variable /2 to /10)
- Sets Kit Series Super Prime to 1/1
- Updated 2 sets (94 cards)

### Diagnostic Scripts

**`check-beautiful-game-sets.ts`**
- Lists all Beautiful Game sets with card counts

**`check-beautiful-game-slugs.ts`**
- Shows set names, slugs, types, and parallel relationships for Beautiful Game sets

**`check-signature-series.ts`**
- Lists all Signature Series sets with print runs and card counts

## Running the Scripts

All scripts can be run using `npx tsx`:

```bash
# Base parallels
npx tsx scripts/road-to-qatar-2021-22/fix-road-to-qatar-base-parallels.ts

# Optic parallels
npx tsx scripts/road-to-qatar-2021-22/fix-road-to-qatar-optic-parallels.ts

# Beautiful Game Autographs
npx tsx scripts/road-to-qatar-2021-22/fix-beautiful-game-names.ts
npx tsx scripts/road-to-qatar-2021-22/fix-beautiful-game-types-and-slugs.ts
npx tsx scripts/road-to-qatar-2021-22/fix-dual-autographs.ts

# Signature Series
npx tsx scripts/road-to-qatar-2021-22/fix-signature-series-print-runs.ts

# Kit Kings and Kit Series
npx tsx scripts/road-to-qatar-2021-22/fix-kit-kings-print-runs.ts
npx tsx scripts/road-to-qatar-2021-22/fix-kit-series-print-runs.ts
```

## Summary of Corrections

### Total Updates
- **48 sets corrected**
- **5,918 cards updated**

### Issues Fixed
1. ✅ Base parallel print runs corrected (11 sets)
2. ✅ Optic parallel print runs corrected (14 sets)
3. ✅ Beautiful Game Autographs naming and typing (7 sets)
4. ✅ Beautiful Game Dual Autographs typing (3 sets)
5. ✅ Signature Series Black set to 1/1 (1 set)
6. ✅ Kit Kings print runs added (2 sets)
7. ✅ Kit Series print runs added (2 sets)

### Database Changes
- Set.printRun field updated for all parallel sets
- Card.printRun, Card.isNumbered, Card.numbered, Card.rarity updated for numbered parallels
- Set.type changed from "Insert" to "Autograph" for autograph sets
- Set.isParallel and Set.baseSetSlug corrected for parallel relationships
- Set.description added for sets with variable print runs

## Data Sources

All corrections are based on official Panini specifications and checklists.

**Source Document:** `/Users/mh/Desktop/2021-22-Donruss-Soccer-Road-to-Qatar-checklist-Excel-spreadsheet-updated.xlsx`

## Notes

- All sets with variable print runs (Kit Kings Prime, Kit Series Prime) have notes in the Set.description field
- 1/1 cards have rarity set to "one_of_one" and numbered as "1 of 1"
- Unnumbered parallels have printRun set to null
- All fixes maintain data integrity with proper cascade updates to cards
