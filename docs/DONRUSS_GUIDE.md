# Donruss Product Guide

Special handling guide for Donruss soccer products and Rated Rookies structure.

## Table of Contents
- [Rated Rookies Structure](#rated-rookies-structure)
- [The Checklist Problem](#the-checklist-problem)
- [Import Strategy](#import-strategy)
- [Expected Results](#expected-results)

---

## Rated Rookies Structure

**CRITICAL KNOWLEDGE**: Donruss products have a specific structure for Rated Rookies that differs from how checklists represent them.

### How Rated Rookies Actually Work

Donruss Rated Rookies are **NOT separate sets** - they are the last 25 cards within the Base and Optic sets:

- **Base Set**: Cards 1-200 (175 regular cards + 25 Rated Rookies as cards 176-200)
- **Optic Set**: Cards 1-200 (175 regular cards + 25 Rated Rookies as cards 176-200)
- **All Parallels**: Also 200 cards each (same structure)

### Products Affected

This applies to **all Donruss soccer products**:
- Donruss Soccer (2024-25, 2023-24, etc.)
- Donruss Road to Qatar (2021-22)
- Any future Donruss releases

**Important**: Other manufacturers (Panini Select, Prizm, etc.) do NOT follow this pattern.

---

## The Checklist Problem

Manufacturer checklists **incorrectly** list these as separate sets:

❌ **Wrong (as listed in checklists)**:
- "Base" (175 cards)
- "Rated Rookies" (25 cards)
- "Base Optic" (175 cards)
- "Rated Rookies Optic" (25 cards)

✅ **Correct (actual structure)**:
- "Base" (200 cards total: 1-175 regular + 176-200 Rated Rookies)
- "Optic" (200 cards total: 1-175 regular + 176-200 Rated Rookies)

---

## Import Strategy

When importing Donruss products, follow this three-step process:

### Step 1: Initial Import

Import as listed in checklist (will create split sets).

```bash
npx tsx scripts/import-donruss-{product}.ts
```

This creates:
- Base set (175 cards)
- Rated Rookies set (25 cards)
- Optic set (175 cards)
- Rated Rookies Optic set (25 cards)
- All parallels split similarly

### Step 2: Merge Rated Rookies

Create and run a fix script to merge Rated Rookies into Base/Optic sets.

```typescript
// scripts/fix-{product}-rated-rookies.ts

async function mergeRatedRookies() {
  const release = await prisma.release.findUnique({
    where: { slug: 'release-slug' },
    include: { sets: true }
  });

  // Find all "Rated Rookies" sets
  const ratedRookiesSets = release.sets.filter(s =>
    s.name === 'Rated Rookies' ||
    s.name.startsWith('Rated Rookies ')
  );

  for (const rrSet of ratedRookiesSets) {
    // Convert "Rated Rookies Holo Blue Laser" → "Base Holo Blue Laser"
    const baseName = rrSet.name
      .replace('Rated Rookies Optic', 'Optic')
      .replace('Rated Rookies', 'Base');

    // Find matching Base set
    const matchingBase = release.sets.find(s => s.name === baseName);

    if (!matchingBase) {
      console.warn(`No matching base set for: ${rrSet.name}`);
      continue;
    }

    // Move all cards from RR set to Base set
    await prisma.card.updateMany({
      where: { setId: rrSet.id },
      data: { setId: matchingBase.id }
    });

    // Update totalCards count
    await prisma.set.update({
      where: { id: matchingBase.id },
      data: { totalCards: '200' }
    });

    // Delete the empty RR set
    await prisma.set.delete({
      where: { id: rrSet.id }
    });

    console.log(`✅ Merged ${rrSet.name} into ${matchingBase.name}`);
  }
}
```

### Step 3: Verify

Run verification script to ensure all Base and Optic sets have 200 cards.

```typescript
// scripts/verify-{product}-import.ts

const sets = await prisma.set.findMany({
  where: {
    releaseId: release.id,
    OR: [
      { name: { contains: 'Base' } },
      { name: { contains: 'Optic' } }
    ]
  },
  include: { cards: true }
});

for (const set of sets) {
  const cardCount = set.cards.length;
  const expected = 200;

  if (cardCount !== expected) {
    console.error(`❌ ${set.name}: ${cardCount} cards (expected ${expected})`);
  } else {
    console.log(`✅ ${set.name}: ${cardCount} cards`);
  }
}
```

---

## Expected Results

After merging Rated Rookies:

### Set Counts

- **Base sets**: 11-25 sets (Base + all parallels), each with 200 cards
- **Optic sets**: 14+ sets (Optic + all parallels), each with 200 cards
- **Total set reduction**: ~24 sets removed (all "Rated Rookies" sets deleted)
- **Card count**: Unchanged (just moved, not deleted)

### Example: Road to Qatar

**Before merge:**
- 35 sets total
- Base: 175 cards
- Rated Rookies: 25 cards
- Multiple parallel sets split similarly

**After merge:**
- 11 sets total
- Base: 200 cards (including Rated Rookies)
- All parallels: 200 cards each
- 24 sets removed (Rated Rookies sets merged)

---

## Reference Implementations

Existing scripts that follow this pattern:

### Road to Qatar (2021-22)

```
/scripts/road-to-qatar-2021-22/
  ├── fix-road-to-qatar-rated-rookies.ts    # Merges Base Rated Rookies
  ├── fix-optic-parallels.ts                # Merges Optic Rated Rookies parallels
  └── verify-road-to-qatar-import.ts        # Verifies 200-card sets
```

### Donruss Soccer (2024-25)

```
/scripts/donruss-2024-25/
  ├── import-donruss-soccer-2024.ts         # Main import script
  ├── fix-complete-donruss-import.ts        # Merges all Rated Rookies
  └── verify-donruss-import.ts              # Verification script
```

---

## Common Issues

### Issue 1: Sets Without Cards

**Symptom**: Some Base sets have 0 cards after merge

**Cause**: Name matching logic didn't find the corresponding Rated Rookies set

**Solution**: Check set names for variations:
```typescript
// Handle variations
const baseName = rrSet.name
  .replace(/Rated Rookies Optic/gi, 'Optic')
  .replace(/Rated Rookies/gi, 'Base')
  .replace(/\s+/g, ' ')
  .trim();
```

### Issue 2: Duplicate Cards

**Symptom**: Same card appears multiple times in a set

**Cause**: Rated Rookies cards weren't deleted before merge

**Solution**: Delete before merging or use transactions:
```typescript
await prisma.$transaction([
  prisma.card.updateMany({ ... }),
  prisma.set.delete({ ... })
]);
```

### Issue 3: Wrong Card Counts

**Symptom**: Sets have unexpected card counts (e.g., 225, 175)

**Cause**: Partial merge or incorrect source data

**Solution**: Verify source data and re-run full merge:
```bash
# Delete all sets for release
npx tsx scripts/delete-release-data.ts

# Re-import from scratch
npx tsx scripts/import-{product}.ts

# Run merge script
npx tsx scripts/fix-{product}-rated-rookies.ts
```

---

## Related Documentation

- [Import Guide](/docs/IMPORT_GUIDE.md) - General import workflow
- [Database Schema](/docs/DATABASE.md) - Set and Card models
- [Parallel Architecture](/docs/PARALLEL_ARCHITECTURE.md) - Set relationships

---

*Last Updated: November 17, 2025*
