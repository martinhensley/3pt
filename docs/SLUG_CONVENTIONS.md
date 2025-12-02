# URL Slug Conventions

Complete guide for generating and formatting URL slugs in the 3pt.bot application.

## Table of Contents
- [Card Slugs](#card-slugs)
- [Set Slugs](#set-slugs)
- [Release Slugs](#release-slugs)
- [Special Cases](#special-cases)
- [Implementation Reference](#implementation-reference)

---

## Card Slugs

### Base Card Format

```
{year}-{release}-{set}-{cardNumber}-{player}-{printRun}
```

**Example:**
```
2016-17-absolute-basketball-base-133-jamal-mashburn-999
```

**Components:**
- `year`: `2016-17`
- `release`: `absolute-basketball`
- `set`: `base`
- `cardNumber`: `133`
- `player`: `jamal-mashburn`
- `printRun`: `999`

### Parallel Card Formats

**IMPORTANT**: The slug format varies by set type.

#### Base Set Parallels (Set Name Excluded)

```
{year}-{release}-{cardNumber}-{player}-{parallelName}-{printRun}
```

**Example:**
```
2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5
```

**Components:**
- `year`: `2016-17`
- `release`: `donruss-optic-basketball`
- `cardNumber`: `2`
- `player`: `jahlil-okafor`
- `parallelName`: `green`
- `printRun`: `5`

#### Insert/Autograph/Memorabilia Parallels (Set Name Included)

```
{year}-{release}-{setName}-{cardNumber}-{player}-{parallelName}-{printRun}
```

**Example:**
```
2016-17-donruss-optic-basketball-all-stars-1-kobe-bryant-gold-10
```

**Components:**
- `year`: `2016-17`
- `release`: `donruss-optic-basketball`
- `setName`: `all-stars`
- `cardNumber`: `1`
- `player`: `kobe-bryant`
- `parallelName`: `gold`
- `printRun`: `10`

### Key Rules

#### 1. Parallel Card Set Name Logic

**Base set parallels** exclude the set name to avoid redundancy:

```tsx
// ✅ CORRECT - Base parallel (Optic Base Green /5)
2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5

// ❌ WRONG - Don't include "base" for Base parallels
2016-17-donruss-optic-basketball-base-2-jahlil-okafor-green-5
```

**Insert/Autograph/Memorabilia parallels** ALWAYS include the set name for clarity:

```tsx
// ✅ CORRECT - Insert parallel (All-Stars Gold /10)
2016-17-donruss-optic-basketball-all-stars-1-kobe-bryant-gold-10

// ❌ WRONG - Missing "all-stars" makes it unclear which set this is
2016-17-donruss-optic-basketball-1-kobe-bryant-gold-10
```

**Why?** Without the set name, you can't distinguish between parallels of different Insert sets (e.g., All-Stars Gold vs. Elite Series Gold).

**Exception**: Optic cards KEEP "optic" in slugs because Optic is a distinct product line, not just a parallel.

```tsx
// ✅ CORRECT - Base Optic card
2016-17-donruss-optic-basketball-1-joel-embiid

// ✅ CORRECT - Optic Green parallel
2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5
```

#### 2. Print Runs Are Not Duplicated

If the parallel name already ends with the print run, don't add it again.

```tsx
// Variant: "Green 5"
// Print run: 5
// ✅ CORRECT
2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5

// ❌ WRONG
2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5-5
```

#### 3. 1/1 Cards Use Special Formatting

See [Special Cases](#special-cases) below for 1/1 card formatting.

---

## Set Slugs

### Format

```
{year}-{release}-{type-prefix}-{setname}[-{parallel}]
```

### Type Prefixes

| Set Type | Prefix | Example |
|----------|--------|---------|
| Base | `base` or omit if name contains "base" | `2016-17-donruss-basketball-base` |
| Autograph | `auto` | `2016-17-donruss-basketball-auto-dominator-signatures` |
| Memorabilia | `mem` | `2016-17-donruss-basketball-mem-jersey-series` |
| Insert | `insert` | `2016-17-donruss-basketball-insert-elite-series` |
| Other | (no prefix) | `2016-17-donruss-basketball-special-cards` |

### Examples

**Base Set:**
```
2016-17-donruss-basketball-base
```

**Insert Set:**
```
2016-17-donruss-basketball-insert-elite-series
```

**Autograph Set:**
```
2016-17-donruss-basketball-auto-dominator-signatures
```

**Parallel Set:**
```
2016-17-donruss-optic-basketball-base-green-parallel-5
```

---

## Release Slugs

### Format

```
{year}-{manufacturer}-{release}
```

### Examples

**Standard Release:**
```
2016-17-panini-donruss-basketball
```

**With Manufacturer:**
```
2024-25-topps-chrome-uefa
```

**Multi-Year:**
```
2021-22-panini-road-to-qatar
```

---

## Special Cases

### 1/1 Cards (Chase/Grail Cards)

1/1 cards require special handling for database storage, URLs, and display.

#### Database Storage

Store as `"1/1"` or include variant name:

```
"1/1"
"Black 1/1"
"Gold Power 1/1"
```

#### URL Format

Convert to `"1-of-1"`:

```
1-of-1
black-1-of-1
gold-power-1-of-1
```

#### Display Format

Show as `"1 of 1"`:

```
1 of 1
Black 1 of 1
Gold Power 1 of 1
```

#### Slug Generation Pattern

```typescript
const slug = parallelName
  .replace(/\b1\s*\/\s*1\b/gi, '1-of-1')  // Convert "1/1" FIRST
  .replace(/\b1\s*of\s*1\b/gi, '1-of-1')  // Convert "1 of 1"
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');
```

#### Display Formatting

```typescript
// Use formatParallelName from /lib/formatters.ts
import { formatParallelName } from '@/lib/formatters';

// Converts URL slugs to display format
// "1-of-1" → "1 of 1"
// "gold-power-1-of-1" → "Gold Power 1 of 1"
<span>{formatParallelName(parallelName)}</span>
```

### Optic Base Set Naming

Optic sets use special naming conventions.

#### Database

Store as:
```
"Optic Base Set"
"Base Optic"
```

#### URLs

Remove "Base":
```
optic
```

#### Display

Show simplified name:
```
"Optic"
```

#### Pattern

```typescript
const displayName = setName
  .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
  .replace(/\boptic\s+base\b/gi, 'Optic')
  .replace(/\bbase\s+optic\b/gi, 'Optic')
  .trim();
```

### Regular Base Sets

Regular base sets keep the "Base" designation.

#### Database
```
"Base Set"
```

#### URLs
```
base
```

#### Display
```
"Base"
```

### Print Runs in Parallels

When a parallel name includes a print run indicator (e.g., "Electric Etch Orange /149"):

1. **Stored Name**: Extract and clean the parallel name
   ```
   "Electric Etch Orange"
   ```

2. **Set.printRun or Set.totalCards**: Store the print run separately
   ```
   printRun: 149
   ```

3. **Slug**: Include the print run number
   ```
   electric-etch-orange-149
   ```

4. **Display**: Show the full name with formatting
   ```
   "Electric Etch Orange /149"
   ```

---

## Implementation Reference

### Card Slug Generation Logic

**Location**: `/lib/slugGenerator.ts` - `generateCardSlug()` function

#### Set Name Inclusion Logic

The set name is excluded ONLY for Base set parallels. For Insert/Autograph/Memorabilia sets, the set name is ALWAYS included.

```typescript
let excludeSetName = false;

if (setType === 'Base' || !setType) {
  // Only for Base sets, check if this is a parallel card
  const isBaseSetParallel = processedVariant &&
    processedVariant.toLowerCase() !== setName.toLowerCase() &&
    !processedVariant.toLowerCase().includes('base');

  excludeSetName = isBaseSetParallel;
}
// For Insert, Autograph, Memorabilia, Other - never exclude set name
```

**Examples:**

| Set Type | Variant | Set Name | Excluded? | Result |
|----------|---------|----------|-----------|--------|
| Base | "Green" | "Base" | YES | `2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5` |
| Insert | "Gold" | "All-Stars" | NO | `2016-17-donruss-optic-basketball-all-stars-1-kobe-bryant-gold-10` |
| Autograph | "Black" | "Dominator Signatures" | NO | `2016-17-donruss-basketball-dominator-signatures-2-kristaps-porzingis-black-1-of-1` |
| Memorabilia | "Prime" | "Jersey Series" | NO | `2016-17-donruss-basketball-jersey-series-prime-1-jusuf-nurkic-prime-10` |

#### Print Run Deduplication

Checks if variant already ends with the print run number to prevent duplicates.

```typescript
const variantEndsWithPrintRun = processedVariant && printRun && (
  processedVariant.trim().endsWith(` ${printRun}`) ||
  (printRun === 1 && processedVariant.trim().endsWith('1-of-1'))
);
```

**Example:**
- Variant: `"Electric Etch Marble Flood 8"`
- Print run: `8`
- Result: Only includes `-8` once in slug

#### 1/1 Card Handling

Converts "1/1" or "1 of 1" to "1-of-1" format and prevents adding extra `-1`.

```typescript
// Detects if variant ends with "1-of-1" and printRun is 1
// Prevents adding extra `-1` to the slug
```

#### Code Reference

```typescript
// lib/slugGenerator.ts:141-167
let excludeSetName = false;

if (setType === 'Base' || !setType) {
  // Only for Base sets, check if this is a parallel card
  const isBaseSetParallel = processedVariant &&
    processedVariant.toLowerCase() !== setName.toLowerCase() &&
    !processedVariant.toLowerCase().includes('base');

  excludeSetName = isBaseSetParallel;
}
// For Insert, Autograph, Memorabilia - never exclude set name

const variantEndsWithPrintRun = processedVariant && printRun && (
  processedVariant.trim().endsWith(` ${printRun}`) ||
  (printRun === 1 && processedVariant.trim().endsWith('1-of-1'))
);

const parts = [
  year,
  releaseName,
  excludeSetName ? null : setName,  // Only exclude for Base parallels
  cardNumber,
  playerName,
  processedVariant,
  (printRun && !variantEndsWithPrintRun) ? printRun.toString() : null
].filter(Boolean);
```

### Examples

#### Base Card (No Parallel)

```typescript
generateCardSlug(
  'Panini',
  'Absolute Basketball',
  '2016-17',
  'Base',
  '133',
  'Jamal Mashburn',
  null,
  999,
  'Base'
)
// → 2016-17-absolute-basketball-base-133-jamal-mashburn-999
```

#### Base Set Parallel (Set Name Excluded)

```typescript
generateCardSlug(
  'Panini',
  'Donruss Optic Basketball',
  '2016-17',
  'Base',
  '2',
  'Jahlil Okafor',
  'Green',
  5,
  'Base'
)
// → 2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5
//    Note: "base" is excluded for Base parallels
```

#### Insert Parallel (Set Name Included)

```typescript
generateCardSlug(
  'Panini',
  'Donruss Optic Basketball',
  '2016-17',
  'All-Stars',
  '1',
  'Kobe Bryant',
  'Gold',
  10,
  'Insert'
)
// → 2016-17-donruss-optic-basketball-all-stars-1-kobe-bryant-gold-10
//    Note: "all-stars" is included for Insert parallels
```

#### Autograph Parallel (Set Name Included)

```typescript
generateCardSlug(
  'Panini',
  'Donruss Basketball',
  '2016-17',
  'Dominator Signatures',
  '2',
  'Kristaps Porzingis',
  'Black',
  1,
  'Autograph'
)
// → 2016-17-donruss-basketball-dominator-signatures-2-kristaps-porzingis-black-1-of-1
//    Note: "dominator-signatures" is included for Autograph parallels
```

#### Memorabilia Parallel (Set Name Included)

```typescript
generateCardSlug(
  'Panini',
  'Donruss Basketball',
  '2016-17',
  'Jersey Series',
  '1',
  'Jusuf Nurkic',
  'Prime',
  10,
  'Memorabilia'
)
// → 2016-17-donruss-basketball-jersey-series-prime-1-jusuf-nurkic-prime-10
//    Note: "jersey-series" is included for Memorabilia parallels
```

#### 1/1 Card

```typescript
generateCardSlug(
  'Panini',
  'Donruss Basketball',
  '2016-17',
  'All-Stars',
  '2',
  'Larry Bird',
  'Press Proof Black 1/1',
  1,
  'Insert'
)
// → 2016-17-donruss-basketball-all-stars-2-larry-bird-press-proof-black-1-of-1
```

---

## Related Documentation

- [Database Schema](/docs/DATABASE.md) - Card and Set models
- [Parallel Architecture](/docs/PARALLEL_ARCHITECTURE.md) - Set relationships
- [Import Guide](/docs/IMPORT_GUIDE.md) - Creating slugs during import

---

*Last Updated: November 17, 2025*
