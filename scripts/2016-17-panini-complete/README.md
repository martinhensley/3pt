# 2016-17 Panini Complete Basketball Import

This directory contains the import script for the 2016-17 Panini Complete Basketball release.

## Release Information

- **Release Name**: Complete Basketball
- **Year**: 2016-17
- **Manufacturer**: Panini
- **Release Slug**: `2016-17-panini-complete-basketball`
- **Release Date**: December 4, 2016

## Sets Included

1. **Base Set** (400 cards)
   - Parallels: Silver, Gold, No Back

2. **Autographs** (30 cards)
   - Mix of rookies and veterans
   - Some cards available only through Panini Rewards

3. **Complete Players** (15 cards)
   - Star players insert set

4. **First Steps** (15 cards)
   - Rookie-focused insert set

5. **Home and Away** (40 cards)
   - 20 players with both home and away versions

## Source File

- **Location**: `/Users/mh/Desktop/2016-17 Panini Complete Basketball Cards/2016-17 Panini Complete Basketball Set Checklist.csv`
- **Format**: CSV with quoted fields
- **Sections**: Base Set, Autographs, Complete Players, First Steps, Home and Away

## Running the Import

### Prerequisites

1. Ensure the release exists in the database (it should already exist)
2. Ensure the CSV file is in the correct location

### Execute the Import

```bash
# From the project root directory
npx tsx scripts/2016-17-panini-complete/import-complete.ts
```

### What the Script Does

1. Finds the existing release by slug
2. Uploads the source CSV file to the release's `sourceFiles` field
3. Creates the Base Set and imports all 400 base cards
4. Creates 3 parallel sets (Silver, Gold, No Back) with all 400 cards each
5. Creates Autographs set and imports all 30 autograph cards
6. Creates Complete Players insert set with 15 cards
7. Creates First Steps insert set with 15 cards
8. Creates Home and Away insert set with 40 cards (20 players x 2 versions)

### Expected Results

After running the script, you should see:

- **7 sets created**:
  - Base Set
  - Base Set - Silver Parallel
  - Base Set - Gold Parallel
  - Base Set - No Back Parallel
  - Autographs
  - Complete Players
  - First Steps
  - Home and Away

- **Total cards**: 1,720 cards
  - 400 base cards
  - 1,200 parallel cards (400 x 3 parallels)
  - 30 autograph cards
  - 15 Complete Players cards
  - 15 First Steps cards
  - 40 Home and Away cards (20 home + 20 away)

## Verification

After import, verify the data:

```typescript
// Check set counts
const release = await prisma.release.findUnique({
  where: { slug: '2016-17-panini-complete-basketball' },
  include: {
    sets: {
      include: {
        _count: {
          select: { cards: true }
        }
      }
    }
  }
});

console.log('Sets:', release.sets.map(s => ({
  name: s.name,
  cardCount: s._count.cards
})));
```

## Notable Cards

### Key Rookies (Base Set)
- Card #1: Joel Embiid (Philadelphia 76ers)
- Card #4: Ben Simmons (Philadelphia 76ers)
- Card #5: Dario Saric (Philadelphia 76ers)
- Card #10: Timothe Luwawu-Cabarrot (Philadelphia 76ers)
- Card #15: Malcolm Brogdon (Milwaukee Bucks)
- Card #20: Thon Maker (Milwaukee Bucks)
- Card #37: Denzel Valentine (Chicago Bulls)
- Card #56: Jaylen Brown (Boston Celtics)
- Card #175: Brandon Ingram (Los Angeles Lakers)
- Card #231: Jamal Murray (Denver Nuggets)

### Key Autographs
- Brandon Ingram (#1)
- Jaylen Brown (#2)
- Kris Dunn (#3)
- Buddy Hield (#4)
- Jamal Murray (#5)
- Dwyane Wade (#16)
- Kevin Durant (#17)
- Chris Paul (#18)
- Kyrie Irving (#19)
- Anthony Davis (#20)

## Notes

- The script uses `upsert` operations for idempotency - safe to run multiple times
- All slugs follow the 3pt.bot URL slug conventions
- Rookie status is preserved from the CSV's "Rookie" column
- Panini Rewards exclusive autographs are marked with a variant field
- Home and Away cards use "Home" and "Away" as variants
