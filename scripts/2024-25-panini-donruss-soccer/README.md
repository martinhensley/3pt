# 2024-25 Panini Donruss Soccer Import Scripts

This folder contains all scripts used to import sets and cards for the **2024-25 Panini Donruss Soccer** release.

## 📁 Source Data

**Excel File:** `/Users/mh/Desktop/2024-25-Donruss-Soccer-Checklist.xlsx`

**Worksheets:**
- `Master` - Complete checklist (8,977 card entries across 149 set variations)
- `Base` - Base set details and parallels
- `Inserts` - Insert sets details
- `Autographs` - Autograph sets details
- `Memorabilia` - Memorabilia sets details
- `Teams` - Cards organized by team

## 📊 Import Summary

### Final Results
- **Total Sets:** 147 (18 parent sets + 129 parallel sets)
- **Total Cards:** 872 unique cards (stored on parent sets only)
- **Release Slug:** `2024-25-panini-donruss-soccer`

### Set Breakdown
| Type | Parent Sets | Parallel Sets | Total |
|------|-------------|---------------|-------|
| Base | 2 | 62 | 64 |
| Insert | 12 | 49 | 61 |
| Autograph | 2 | 14 | 16 |
| Memorabilia | 2 | 4 | 6 |

### Key Parent Sets
1. **Base** - 200 cards (#1-200) with 62 parallels
2. **Optic** - 200 cards (#1-200) with 0 parallels
3. **Animation** - 25 cards (Insert, no parallels)
4. **Craftsmen** - 25 cards (Insert, 5 parallels)
5. **Crunch Time** - 25 cards (Insert, 5 parallels)
6. **Kaboom** - 25 cards (Insert, 2 parallels)
7. **Kit Kings** - 50 cards (Memorabilia, 2 parallels)
8. **Kit Series** - 50 cards (Memorabilia, 2 parallels)
9. **Magicians** - 25 cards (Insert, 5 parallels)
10. **Net Marvels** - 25 cards (Insert, 5 parallels)
11. **Night Moves** - 25 cards (Insert, no parallels)
12. **Pitch Kings** - 25 cards (Insert, 5 parallels)
13. **Rookie Kings** - 25 cards (Insert, 5 parallels)
14. **The Rookies** - 25 cards (Insert, 5 parallels)
15. **Zero Gravity** - 25 cards (Insert, 5 parallels)
16. **Beautiful Game Autographs** - 43 cards (Autograph, 7 parallels)
17. **Beautiful Game Dual Autographs** - 10 cards (Autograph, 7 parallels)
18. **Signature Series** - 44 cards (Autograph, 7 parallels)

## 📜 Scripts

### 1. `import-donruss-from-excel.ts`
**Primary import script** - Reads the Excel file and creates all sets and cards.

**Usage:**
```bash
# Full import (all sets)
npx tsx scripts/2024-25-panini-donruss-soccer/import-donruss-from-excel.ts

# Test mode (Base and Base Optic only)
npx tsx scripts/2024-25-panini-donruss-soccer/import-donruss-from-excel.ts --test
```

**What it does:**
- Parses the Master worksheet to extract all cards and sets
- Identifies parent vs parallel sets
- Creates parent-child relationships
- Generates proper slugs for sets and cards
- Handles special cases (Base Optic → Optic)
- Stores cards only on parent sets (parallels inherit)

**Key Features:**
- Automatic set type detection (Base, Insert, Autograph, Memorabilia)
- Print run mapping for parallel sets
- Slug generation using `/lib/slugGenerator.ts`
- Test mode for validation before full import

---

### 2. `fix-rated-rookies.ts`
**Post-import fix** - Merges Rated Rookies into Base/Optic sets.

**Usage:**
```bash
npx tsx scripts/2024-25-panini-donruss-soccer/fix-rated-rookies.ts
```

**What it does:**
- Moves Rated Rookies cards (#176-200) into Base set
- Moves Rated Rookies Optic cards (#176-200) into Optic set
- Reassigns all Rated Rookies parallels to Base as parent
- Deletes empty Rated Rookies parent sets
- Updates totalCards fields

**Why needed:**
The Excel file treats "Rated Rookies" as separate sets, but they're actually cards 176-200 of the Base and Optic checklists. This script corrects the structure.

---

### 3. `delete-donruss-data.ts`
**Cleanup utility** - Deletes all sets and cards for the release.

**Usage:**
```bash
npx tsx scripts/2024-25-panini-donruss-soccer/delete-donruss-data.ts
```

**What it does:**
- Finds the Donruss Soccer release
- Deletes all cards
- Deletes all sets (parent and parallel)
- Keeps the release record intact

**Use cases:**
- Before re-running import after fixes
- Testing import scripts
- Cleaning up failed imports

---

### 4. `verify-donruss-import.ts`
**Basic verification** - Compares Excel file to database.

**Usage:**
```bash
npx tsx scripts/2024-25-panini-donruss-soccer/verify-donruss-import.ts
```

**What it checks:**
- Total set count matches Excel
- Cards stored correctly on parent sets
- Breakdown by set type
- Parent set summaries
- Key sets exist (Base, Optic, etc.)
- Sample parallel sets

---

### 5. `final-verification.ts`
**Comprehensive verification** - Full import validation.

**Usage:**
```bash
npx tsx scripts/2024-25-panini-donruss-soccer/final-verification.ts
```

**What it checks:**
- Overall statistics (sets, cards, types)
- Key parent sets details
- Base set: all cards 1-200 present
- Optic set: all cards 1-200 present
- Rated Rookies sets deleted correctly
- Parallel set samples

---

### 6. `check-rated-rookies.ts`
**Diagnostic tool** - Checks Rated Rookies structure.

**Usage:**
```bash
npx tsx scripts/2024-25-panini-donruss-soccer/check-rated-rookies.ts
```

**What it shows:**
- Current card counts for Base, Optic, Rated Rookies
- Card number ranges
- Whether Rated Rookies needs fixing

---

## 🔄 Import Process (Step-by-Step)

### Initial Import
```bash
# Step 1: Run full import
npx tsx scripts/2024-25-panini-donruss-soccer/import-donruss-from-excel.ts

# Step 2: Fix Rated Rookies structure
npx tsx scripts/2024-25-panini-donruss-soccer/fix-rated-rookies.ts

# Step 3: Verify results
npx tsx scripts/2024-25-panini-donruss-soccer/final-verification.ts
```

### Re-import (if needed)
```bash
# Step 1: Delete existing data
npx tsx scripts/2024-25-panini-donruss-soccer/delete-donruss-data.ts

# Step 2: Run import again
npx tsx scripts/2024-25-panini-donruss-soccer/import-donruss-from-excel.ts

# Step 3: Fix Rated Rookies
npx tsx scripts/2024-25-panini-donruss-soccer/fix-rated-rookies.ts

# Step 4: Verify
npx tsx scripts/2024-25-panini-donruss-soccer/final-verification.ts
```

---

## 🔑 Key Learnings & Special Cases

### 1. Rated Rookies Structure
**Issue:** Excel lists "Rated Rookies" as separate sets
**Reality:** They're cards #176-200 of Base and Optic sets
**Fix:** `fix-rated-rookies.ts` merges them into parent sets

### 2. Base Optic Naming
**Excel name:** "Base Optic"
**Display name:** "Optic"
**Reason:** "Base" is redundant when Optic is already a base set variant

### 3. Parent-Child Architecture
- Cards stored ONLY on parent sets (872 cards)
- Parallel sets reference parent via `parentSetId`
- Parallel sets inherit parent's cards automatically
- Excel shows 8,977 entries (872 cards × parallels)

### 4. Slug Generation
- Base parallels: `2024-25-donruss-soccer-{parallel}` (no "base" prefix)
- Other parallels: `2024-25-donruss-soccer-{setname}-{parallel}`
- Optic becomes "base-optic" in slug to differentiate from Base

### 5. Print Runs
- Stored in `Set.printRun` field
- Mapped from parallel names (Black=1, Gold=10, Red=99, etc.)
- Unlimited parallels have `printRun: null`

---

## 📦 Dependencies

- `xlsx` - Excel file parsing
- `@prisma/client` - Database access
- `/lib/slugGenerator.ts` - Slug generation utilities
- `/lib/database.ts` - Database helpers (not used in current scripts)

---

## 🎯 Replication Guide

To use these scripts as a template for other releases:

1. **Copy this folder** to `/scripts/{year}-{manufacturer}-{release}/`
2. **Update the Excel file path** in `import-*-from-excel.ts`
3. **Update release slug** in all scripts (search for `2024-25-panini-donruss-soccer`)
4. **Adjust set parsing logic** in `import-*-from-excel.ts`:
   - Update `PARENT_SETS` array if needed
   - Update `PARALLEL_PRINT_RUNS` mapping
   - Adjust `determineSetType()` function
   - Modify `parseSetName()` for release-specific patterns
5. **Update README** with release-specific details
6. **Test with `--test` flag** before full import

---

## 📝 Notes

- All scripts use TypeScript and run via `tsx`
- Scripts assume release already exists in database
- Card slugs follow conventions in `/lib/slugGenerator.ts`
- Parallel sets use `mirrorsParentChecklist: true` flag

---

**Import Date:** November 14, 2025
**Imported By:** Claude Code
**Status:** ✅ Complete and Verified
