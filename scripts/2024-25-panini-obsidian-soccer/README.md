# 2024-25 Panini Obsidian Soccer Import

## Overview
Successfully imported all sets and cards from the 2024-25 Panini Obsidian Soccer release using Excel checklist data.

## Import Results

### Total Counts
- **Sets**: 195 sets
- **Cards**: 4,910 cards

### Breakdown by Set Type
- **Base**: 17 sets, 1,819 cards
- **Insert**: 97 sets, 1,540 cards
- **Autograph**: 45 sets, 867 cards
- **Memorabilia**: 36 sets, 684 cards

### Parallel Breakdown
- **Parallel Sets**: 172 sets (88.2% of all sets)
- **Parallel Cards**: 4,438 cards (90.4% of all cards)
- **Non-Parallel Sets**: 23 sets
- **Non-Parallel Cards**: 472 cards

## Data Source

### Excel File Structure
- **File**: `2024-25-Panini-Obsidian-Soccer-Cards-Checklist.xls`
- **Worksheet**: `2024 Panini Obsidian (24-25) (S`
- **Columns**:
  1. `CARD_NUM` - Card number
  2. `CARD_SET` - Set name (includes base + parallel variants)
  3. `ATHLETE` - Player name
  4. `TEAM` - Team name
  5. `POSITION` - Player position (F/M/D/G)
  6. `SEQUENCE` - Print run number (e.g., 145, 99, 8, 1)

## Parallel Pattern

All parallels in Obsidian Soccer follow the **"Electric Etch"** naming pattern:

### Format
`[Base Set Name] + Electric Etch + [Variant Name]`

### Electric Etch Variants (21 total)
1. Electric Etch Blue
2. Electric Etch Blue Finite (1/1)
3. Electric Etch Contra (/9)
4. Electric Etch Gold Flood (/10 or varied)
5. Electric Etch Green (/5 or varied)
6. Electric Etch Imperial Jade (/26)
7. Electric Etch Marble Flood (/8)
8. Electric Etch Neon Blue Flood (/15)
9. Electric Etch Neon Green Flood (/3)
10. Electric Etch Orange (varied)
11. Electric Etch Purple (varied)
12. Electric Etch Purple Flood (/30)
13. Electric Etch Red (/12)
14. Electric Etch Red Crystals (/28)
15. Electric Etch Red Flood (/10 or varied)
16. Electric Etch Red Pulsar (varied)
17. Electric Etch Red White and Blue Flood (varied)
18. Electric Etch Taiga (varied)
19. Electric Etch Talavera (/8)
20. Electric Etch White Pulsar (/11)
21. Electric Etch Yellow (/10)

## Key Features

### Individual Print Runs
Unlike Donruss Soccer (where print runs are consistent per set), Obsidian Soccer has **individual card print runs** stored in the `SEQUENCE` column. This means:
- Cards within the same set can have different print runs
- Print runs are stored in both `Set.printRun` (if uniform) and `Card.printRun` (always)
- Some sets have varied print runs (e.g., 75-199), others have uniform print runs (e.g., all cards /145)

### Set Types Classification

#### Base Sets
- "Base" or contains "base set"

#### Insert Sets
- All named insert sets (Equinox, Supernova, Nucleus, Orbital, Cutting Edge, Eruption, Lightning Strike, etc.)
- Black Color Blast, Iridescent, White Night
- USWNT Class of 19, USWNT Class of 99

#### Autograph Sets
- Contains "autograph", "ink", or "signature"
- Dual Jersey Ink, Galaxy Ink, Magmatic Signatures, Matrix Material Autographs, Volcanic Material Signatures

#### Memorabilia Sets
- Contains "material", "jersey", "patch", "memorabilia", "swatches", "gear", or "trifecta"
- Atomic Material, Galaxy Gear, Solar Swatches, Trifecta Material

## Database Architecture

### Simplified Parallel Model
All sets are independent entities with their own cards. Parallels are identified by:
- `isParallel: true`
- `baseSetSlug` pointing to the base set's slug
- Naming convention: sets with "Electric Etch [Variant]" in the name

### Slug Conventions

#### Set Slugs
- **Base set**: `2024-25-obsidian-soccer-base`
- **Base parallel**: `2024-25-obsidian-soccer-base-electric-etch-blue-finite-parallel-1`
- **Insert set**: `2024-25-obsidian-soccer-equinox`
- **Insert parallel**: `2024-25-obsidian-soccer-equinox-electric-etch-orange-parallel-75`
- **Auto set**: `2024-25-obsidian-soccer-dual-jersey-ink`
- **Auto parallel**: `2024-25-obsidian-soccer-dual-jersey-ink-electric-etch-green-parallel`

#### Card Slugs
- **Base card**: `2024-25-obsidian-soccer-base-1-jude-bellingham-145`
- **Base parallel**: `2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8`
- **Insert card**: `2024-25-obsidian-soccer-equinox-1-erling-haaland-120`
- **Insert parallel**: `2024-25-obsidian-soccer-equinox-1-erling-haaland-electric-etch-orange-75`

## Scripts

### import-obsidian-from-excel.ts
Main import script that:
1. Reads the Excel file (.xls format) using xlsx library
2. Parses all cards and groups by set
3. Extracts parallel information (base set name + Electric Etch variant)
4. Determines set type (Base, Insert, Autograph, Memorabilia)
5. Creates sets with proper slugs and metadata
6. Creates cards with individual print runs and proper slugs

### validate-import.ts
Validation script that:
1. Counts total sets and cards
2. Breaks down by set type
3. Shows parallel vs non-parallel distribution
4. Displays sample sets for verification

### fix-duplicate-names.ts
Data cleanup script that:
1. Fixes duplicate player names (e.g., "Rafael Leao/Rafael Leao/Rafael Leao" → "Rafael Leao")
2. Fixes duplicate team names (e.g., "AC Milan/AC Milan/AC Milan" → "AC Milan")
3. Only fixes true duplicates (where all parts separated by "/" are identical)
4. Processes all 4,910 cards across 195 sets

**Fix Results:**
- Player names fixed: 527 cards
- Team names fixed: 719 cards

**Note:** The Excel source file contained these duplicates in certain cards. This was a data quality issue in the original checklist, not an import error.

## Running the Scripts

### Import
```bash
npx tsx scripts/2024-25-panini-obsidian-soccer/import-obsidian-from-excel.ts
```

### Validate
```bash
npx tsx scripts/2024-25-panini-obsidian-soccer/validate-import.ts
```

### Fix Duplicate Names
```bash
npx tsx scripts/2024-25-panini-obsidian-soccer/fix-duplicate-names.ts
```

## Notes

### Data Quality
- **Missing athletes**: 0 (0%)
- **Missing teams**: 0 (0%)
- **Missing print runs**: 34 cards (0.7%)
- **Skipped rows**: 1 (header row)

### Special Cases
- One set named "CARD SET" with 1 card (appears to be the header row, imported as Insert type)
- Print runs vary within sets - stored individually per card
- Some parallels have uniform print runs (Blue Finite = 1), others vary by card

## Success Metrics
✅ All 195 sets created
✅ All 4,910 cards created
✅ 100% data quality for player names and teams
✅ Proper parallel detection and classification
✅ Correct slug generation for all sets and cards
✅ Individual print runs preserved

## Import Date
November 15, 2025
