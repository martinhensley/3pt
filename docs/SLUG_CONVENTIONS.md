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
2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-145
```

**Components:**
- `year`: `2024-25`
- `release`: `obsidian-soccer`
- `set`: `obsidian-base`
- `cardNumber`: `1`
- `player`: `jude-bellingham`
- `printRun`: `145`

### Parallel Card Format

```
{year}-{release}-{cardNumber}-{player}-{parallelName}-{printRun}
```

**Example:**
```
2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8
```

**Important**: Set name is excluded for parallel cards since the parallel name is more specific.

**Components:**
- `year`: `2024-25`
- `release`: `obsidian-soccer`
- `cardNumber`: `1`
- `player`: `jude-bellingham`
- `parallelName`: `electric-etch-marble-flood`
- `printRun`: `8`

### Key Rules

#### 1. Parallel Cards Exclude Base Set Name

Parallel cards do NOT include the base set name in their slugs to avoid redundancy.

```tsx
// ✅ CORRECT
2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-green-5

// ❌ WRONG
2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-electric-etch-green-5
```

**Exception**: Optic cards KEEP "optic" in slugs because Optic is a distinct product line, not just a parallel.

```tsx
// ✅ CORRECT - Base Optic card
2024-25-donruss-soccer-optic-1-matt-turner

// ✅ CORRECT - Optic Argyle parallel
2024-25-donruss-soccer-optic-1-matt-turner-argyle
```

#### 2. Print Runs Are Not Duplicated

If the parallel name already ends with the print run, don't add it again.

```tsx
// Variant: "Electric Etch Marble Flood 8"
// Print run: 8
// ✅ CORRECT
2024-25-obsidian-soccer-1-player-electric-etch-marble-flood-8

// ❌ WRONG
2024-25-obsidian-soccer-1-player-electric-etch-marble-flood-8-8
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
| Base | `base` or omit if name contains "base" | `2024-25-obsidian-soccer-obsidian-base` |
| Autograph | `auto` | `2024-25-obsidian-soccer-auto-dual-jersey-ink` |
| Memorabilia | `mem` | `2024-25-obsidian-soccer-mem-patch-cards` |
| Insert | `insert` | `2024-25-obsidian-soccer-insert-equinox` |
| Other | (no prefix) | `2024-25-obsidian-soccer-special-cards` |

### Examples

**Base Set:**
```
2024-25-obsidian-soccer-obsidian-base
```

**Insert Set:**
```
2024-25-obsidian-soccer-insert-equinox
```

**Autograph Set:**
```
2024-25-obsidian-soccer-auto-dual-jersey-ink
```

**Parallel Set:**
```
2024-25-obsidian-soccer-obsidian-base-electric-etch-green-5
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
2024-25-panini-donruss-soccer
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

#### Parallel Card Detection

A card is considered a parallel if:
- The variant differs from the set name
- The variant doesn't include "base"

```typescript
const isParallelCard = processedVariant &&
  processedVariant.toLowerCase() !== setName.toLowerCase() &&
  !processedVariant.toLowerCase().includes('base');
```

**Example:**
- Variant: `"Electric Etch Marble Flood 8"`
- Set: `"Obsidian Base"`
- Result: `true` (is parallel)

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
// lib/slugGenerator.ts:117-167
const isParallelCard = processedVariant &&
  processedVariant.toLowerCase() !== setName.toLowerCase() &&
  !processedVariant.toLowerCase().includes('base');

const variantEndsWithPrintRun = processedVariant && printRun && (
  processedVariant.trim().endsWith(` ${printRun}`) ||
  (printRun === 1 && processedVariant.trim().endsWith('1-of-1'))
);

const parts = [
  year,
  releaseName,
  isParallelCard ? null : setName,  // Exclude setName for parallels
  cardNumber,
  playerName,
  processedVariant,
  (printRun && !variantEndsWithPrintRun) ? printRun.toString() : null
].filter(Boolean);
```

### Examples

#### Parallel Card

```typescript
generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  'Electric Etch Marble Flood 8',
  8
)
// → 2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8
```

#### Base Card

```typescript
generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  null,
  145
)
// → 2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-145
```

#### 1/1 Card

```typescript
generateCardSlug(
  'Panini',
  'Obsidian Soccer',
  '2024-25',
  'Obsidian Base',
  '1',
  'Jude Bellingham',
  'Gold Power 1/1',
  1
)
// → 2024-25-obsidian-soccer-1-jude-bellingham-gold-power-1-of-1
```

---

## Related Documentation

- [Database Schema](/docs/DATABASE.md) - Card and Set models
- [Parallel Architecture](/docs/PARALLEL_ARCHITECTURE.md) - Set relationships
- [Import Guide](/docs/IMPORT_GUIDE.md) - Creating slugs during import

---

*Last Updated: November 17, 2025*
