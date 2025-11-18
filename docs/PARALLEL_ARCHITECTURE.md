# Parallel Set Architecture

Complete guide for the simplified independent parallel set architecture in Footy.bot.

## Table of Contents
- [Overview](#overview)
- [Database Structure](#database-structure)
- [Naming Conventions](#naming-conventions)
- [Key Principles](#key-principles)
- [Query Patterns](#query-patterns)
- [Testing Checklist](#testing-checklist)

---

## Overview

The database uses a **simplified independent model** for parallel sets where each set is a standalone entity with its own cards.

### Core Concept

- **All sets are independent entities** with their own cards
- **Parallels identified by naming convention**: Sets with "-parallel" in slug
- **No parent-child relationships**: Each set stands alone
- **Simpler data model**: Easier to maintain and query

---

## Database Structure

### Base Set Example

```typescript
const baseSet = {
  id: 'abc123',
  name: 'Optic',
  slug: '2024-25-donruss-soccer-optic',
  type: 'Base',
  isParallel: false,
  baseSetSlug: null,
  printRun: null,
  cards: [card1, card2, ...] // Own cards (200 cards)
};
```

### Parallel Set Example

```typescript
const parallelSet = {
  id: 'xyz789',
  name: 'Cubic',
  slug: '2024-25-donruss-soccer-optic-cubic-parallel-99',
  type: 'Base',
  isParallel: true,
  baseSetSlug: '2024-25-donruss-soccer-optic',
  printRun: 99,
  cards: [card1, card2, ...] // Own cards (200 cards)
};
```

### Schema Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier |
| `name` | String | Display name (e.g., "Cubic", "Electric Etch Green 5") |
| `slug` | String | URL-friendly slug (includes "-parallel" for parallels) |
| `type` | SetType | Base, Insert, Autograph, or Memorabilia |
| `isParallel` | Boolean | `true` for parallel sets |
| `baseSetSlug` | String? | Reference to base set slug (for parallels only) |
| `printRun` | Int? | Standard print run for all cards in set |
| `cards` | Card[] | Array of cards belonging to this set |

---

## Naming Conventions

### Base Sets

```
{year}-{release}-{setname}
```

**Examples:**
```
2024-25-donruss-soccer-optic
2024-25-obsidian-soccer-obsidian-base
2024-25-donruss-soccer-insert-craftsmen
```

### Parallel Sets (No Print Run)

```
{year}-{release}-{setname}-{variant}-parallel
```

**Examples:**
```
2024-25-donruss-soccer-optic-cubic-parallel
2024-25-donruss-soccer-optic-holo-parallel
2024-25-obsidian-soccer-obsidian-base-electric-etch-parallel
```

### Parallel Sets (With Print Run)

```
{year}-{release}-{setname}-{variant}-parallel-{printrun}
```

**Examples:**
```
2024-25-donruss-soccer-optic-blue-cubic-parallel-99
2024-25-donruss-soccer-optic-red-parallel-299
2024-25-obsidian-soccer-obsidian-base-electric-etch-green-parallel-5
```

---

## Key Principles

### 1. Each Set Has Own Cards

Cards are duplicated across base and parallel sets. A base set card and its parallel are separate database entities.

**Example:**
```typescript
// Base set card
{
  id: 'card-base-1',
  setId: 'set-optic',
  playerName: 'Lionel Messi',
  cardNumber: '1',
  variant: null,
  printRun: null
}

// Parallel set card
{
  id: 'card-parallel-1',
  setId: 'set-optic-red-299',
  playerName: 'Lionel Messi',
  cardNumber: '1',
  variant: 'Red',
  printRun: 299
}
```

### 2. Release Pages Show All Sets

Both base and parallel sets are displayed on release pages, allowing users to browse all variations.

```tsx
// All sets for a release
const sets = await prisma.set.findMany({
  where: { releaseId },
  include: { cards: true }
});
```

### 3. Smart Ordering

Sets are sorted intelligently:

1. **Non-parallels** (base sets) first
2. **Parallels without print runs** (alphabetical by variant)
3. **Parallels with print runs** (highest to lowest)

**Example Order:**
```
1. Optic (base)
2. Optic Cubic (no print run)
3. Optic Holo (no print run)
4. Optic Red /299 (print run)
5. Optic Blue /149 (print run)
6. Optic Green /5 (print run)
7. Optic Gold Power 1/1 (print run)
```

### 4. No Complex Relationships

Simpler data model without parent-child relationships makes queries straightforward and maintenance easier.

---

## Query Patterns

### Fetch Set Independently

```typescript
const set = await prisma.set.findUnique({
  where: { slug: params.slug },
  include: {
    cards: true,
    release: {
      include: { manufacturer: true }
    }
  }
});
```

### Check if Set is Parallel

```typescript
import { isParallelSet, getBaseSetSlug } from '@/lib/setUtils';

const isParallel = isParallelSet(set.slug);
// true if slug contains "-parallel"

const baseSlug = getBaseSetSlug(set.slug);
// Returns base set slug for parallels
```

### Sort Sets on Release Page

```typescript
import { sortSets } from '@/lib/setUtils';

const sortedSets = sortSets(release.sets);
// Automatically sorts: non-parallels, unnumbered parallels, numbered parallels
```

### Find All Parallels for a Base Set

```typescript
const baseSet = await prisma.set.findUnique({
  where: { slug: baseSetSlug }
});

const parallels = await prisma.set.findMany({
  where: {
    releaseId: baseSet.releaseId,
    isParallel: true,
    baseSetSlug: baseSet.slug
  }
});
```

### Create a Parallel Set

```typescript
const parallelSet = await prisma.set.create({
  data: {
    name: 'Cubic',
    slug: '2024-25-donruss-soccer-optic-cubic-parallel-99',
    type: 'Base',
    isParallel: true,
    baseSetSlug: '2024-25-donruss-soccer-optic',
    printRun: 99,
    releaseId: release.id
  }
});

// Create cards for the parallel set
for (const baseCard of baseCards) {
  await prisma.card.create({
    data: {
      ...baseCard,
      id: undefined, // Generate new ID
      setId: parallelSet.id,
      variant: 'Cubic',
      printRun: 99
    }
  });
}
```

---

## Testing Checklist

### Database Level

When implementing sets with this architecture:

- [ ] All sets have unique slugs following naming conventions
- [ ] Parallel sets have `isParallel = true`
- [ ] Parallel sets have `baseSetSlug` pointing to base set slug
- [ ] Each set has its own cards (base cards duplicated into parallel sets)
- [ ] Print runs stored correctly on parallel sets
- [ ] No orphaned cards (all cards belong to valid sets)

### Release Page (`/releases/[slug]`)

- [ ] All sets displayed (both base and parallel sets)
- [ ] Sets sorted correctly:
  - Non-parallels first
  - Parallels without print runs (alphabetical)
  - Parallels with print runs (highest to lowest)
- [ ] Correct card counts for each set
- [ ] Set type badges display correctly (Base, Insert, Auto, Mem)
- [ ] Parallel indicators show when appropriate

### Set Detail Page (`/sets/[slug]`)

- [ ] Both base and parallel sets work independently
- [ ] Correct cards displayed for each set
- [ ] Print run displayed in header for parallels
- [ ] Breadcrumbs show Release → Set
- [ ] "View Base Set" link appears on parallel pages
- [ ] Card images load correctly

### Admin Interface

- [ ] Can create base sets independently
- [ ] Can create parallel sets independently
- [ ] Cards created for each set
- [ ] Slug generation follows naming convention
- [ ] Import scripts create separate sets for each parallel
- [ ] Can edit sets without affecting related parallels

---

## Benefits of This Architecture

### Simplicity

No complex parent-child relationships to manage. Each set is self-contained and independent.

```typescript
// ✅ Simple: Just fetch the set
const set = await prisma.set.findUnique({ where: { slug } });

// ❌ Complex: Would need to fetch parent and all children
const set = await prisma.set.findUnique({
  where: { slug },
  include: { parentSet: true, parallelSets: true }
});
```

### Independence

Each set is fully self-contained. Changes to one set don't affect others.

```typescript
// Update a parallel set without affecting base
await prisma.set.update({
  where: { id: parallelSetId },
  data: { printRun: 149 }
});
```

### Flexibility

Easy to add/modify individual sets without worrying about relationships.

```typescript
// Add a new parallel anytime
await prisma.set.create({
  data: {
    name: 'New Parallel',
    slug: generateSlug(),
    isParallel: true,
    baseSetSlug: baseSet.slug,
    // ... rest of data
  }
});
```

### Clear Naming

Parallels are explicitly identified in URLs, making it obvious what type of set it is.

```
// Clear that this is a parallel
/sets/2024-25-donruss-soccer-optic-red-parallel-299

// Clear that this is a base set
/sets/2024-25-donruss-soccer-optic
```

---

## Related Documentation

- [Database Schema](/docs/DATABASE.md) - Complete schema reference
- [Slug Conventions](/docs/SLUG_CONVENTIONS.md) - URL formatting rules
- [Import Guide](/docs/IMPORT_GUIDE.md) - Creating sets during import

---

*Last Updated: November 17, 2025*
