# Technical Specification: Parallel-as-Set Architecture

## Overview
Implement a system where each parallel variation of a set is stored as its own independent Set record in the database, with flat URL structure.

## Current vs. Proposed Architecture

### Current System
- **Data Model**: One Set record contains multiple parallels in JSON array
- **Card References**: Cards have `setId` + `parallelType` field
- **URL Structure**: `/sets/{base-slug}/parallels/{parallel-slug}` (nested)
- **Example**: `/sets/2024-25-panini-obsidian-soccer-base/parallels/electric-etch-red-pulsar`

### Proposed System
- **Data Model**: Each parallel is its own Set record
- **Card References**: Cards only need `setId` (no `parallelType` field needed)
- **URL Structure**: `/sets/{combined-slug}` (flat)
- **Examples**:
  - Base: `/sets/2024-25-panini-obsidian-soccer-base`
  - Parallel: `/sets/2024-25-panini-obsidian-soccer-base-electric-etch-red-pulsar`
  - Auto: `/sets/2024-25-panini-obsidian-soccer-auto-dual-jersey-ink`
  - Auto Parallel: `/sets/2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-orange`

## Slug Generation Rules

### Format
```
{year}-{release}-{type-prefix}-{setname}[-{parallel}]
```

### Type Prefixes
- `Base` → `base` (or omit if setName already contains "base")
- `Autograph` → `auto`
- `Memorabilia` → `mem`
- `Insert` → `insert`
- `Other` → (no prefix)

### Special Cases
1. **Optic Base Sets**
   - "Optic Base Set" → "base" (not "base-optic")
   - "Base Optic" → "base"

2. **1/1 Cards**
   - "1/1" or "1 of 1" → "1-of-1" in slugs
   - Display: "1 of 1" (use `formatParallelName()` from `/lib/formatters.ts`)

3. **Print Runs in Parallels**
   - Input: "Electric Etch Orange /149"
   - Slug: "electric-etch-orange-149"
   - Stored name: "Electric Etch Orange"
   - Print run stored separately in Set.totalCards or parallel metadata

### Examples

#### Base Set with Parallels
**Input:**
```
Base Set Checklist
107 cards
Parallels
Electric Etch Red Pulsar /44
Electric Etch Orange /40
Electric Etch Purple Flood /30
```

**Output Sets:**
| Set Name | Type | Slug | totalCards |
|----------|------|------|------------|
| Base | Base | `2024-25-panini-obsidian-soccer-base` | "107" |
| Base Electric Etch Red Pulsar | Base | `2024-25-panini-obsidian-soccer-base-electric-etch-red-pulsar` | "107" |
| Base Electric Etch Orange | Base | `2024-25-panini-obsidian-soccer-base-electric-etch-orange` | "107" |
| Base Electric Etch Purple Flood | Base | `2024-25-panini-obsidian-soccer-base-electric-etch-purple-flood` | "107" |

#### Autograph Set with Parallels
**Input:**
```
Dual Jersey Ink
25 cards
Parallels
Electric Etch Orange /149 or fewer
Electric Etch Red Pulsar /99 or fewer
Electric Etch Purple /50 or fewer
```

**Output Sets:**
| Set Name | Type | Slug | totalCards |
|----------|------|------|------------|
| Dual Jersey Ink | Autograph | `2024-25-panini-obsidian-soccer-auto-dual-jersey-ink` | "25" |
| Dual Jersey Ink Electric Etch Orange | Autograph | `2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-orange` | "25" |
| Dual Jersey Ink Electric Etch Red Pulsar | Autograph | `2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-red-pulsar` | "25" |
| Dual Jersey Ink Electric Etch Purple | Autograph | `2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-purple` | "25" |

## Database Schema Changes

### Already Completed ✅
```prisma
model Set {
  id          String   @id @default(cuid())
  name        String   // Now includes parallel name: "Dual Jersey Ink Electric Etch Orange"
  slug        String   @unique // Combined slug with parallel
  type        SetType  @default(Other)
  isBaseSet   Boolean  @default(false) // Deprecated
  releaseId   String
  release     Release  @relation(...)
  totalCards  String?  // Same for all parallels of a set
  parallels   Json?    // DEPRECATED - no longer needed
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cards       Card[]
  // ... other fields
}
```

### Fields to Deprecate
- `Set.parallels` - No longer needed since each parallel is its own Set
- `Set.isBaseSet` - Use `Set.type` instead
- `Card.parallelType` - No longer needed since Set already identifies the parallel

### New Field Considerations
Consider adding:
```prisma
model Set {
  // ... existing fields
  baseSetSlug  String?  // Reference to the base set (for parallel sets)
  printRun     String?  // "/44", "/99", "1/1", etc.
  isParallel   Boolean  @default(false) // Quick filter for parallel sets
}
```

## Implementation Steps

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] Add `generateSetSlug()` function with parallel parameter
- [x] Make `Set.slug` unique and required
- [x] Update API POST/PUT endpoints to use slug generation
- [x] Update API GET endpoint to use direct slug lookup

### Phase 2: Admin Interface (IN PROGRESS)
File: `/app/admin/releases/edit/[id]/page.tsx`

#### 2.1: Add Set Type Selector
**Location**: In the "Paste set data" section (around line 250)

**UI Component**:
```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Set Type
  </label>
  <select
    value={setType}
    onChange={(e) => setSetType(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
  >
    <option value="Base">Base Set</option>
    <option value="Autograph">Autograph</option>
    <option value="Memorabilia">Memorabilia</option>
    <option value="Insert">Insert</option>
    <option value="Other">Other</option>
  </select>
</div>
```

**State Management**:
```tsx
const [setType, setSetType] = useState<'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other'>('Base');
```

#### 2.2: Modify Set Data Parser
**Current Function**: `parseSetData()` (around line 380)

**Current Behavior**:
- Parses set name, total cards, parallels array, and checklist
- Returns ONE set object with parallels in JSON

**New Behavior**:
- Parse set name, total cards, parallels array, and checklist
- Return ARRAY of set objects (one per parallel + base)
- Each set has:
  - Unique name with parallel included
  - Unique slug with parallel included
  - Same totalCards count
  - Same checklist (cards will be created for each set)

**New Function Signature**:
```typescript
interface SetData {
  name: string;          // "Dual Jersey Ink" or "Dual Jersey Ink Electric Etch Orange"
  type: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other';
  slug: string;          // Pre-generated slug
  totalCards: string;
  parallels: string[];   // DEPRECATED - always empty array
  cards: CardInfo[];     // Same cards for all parallel sets
  isParallel: boolean;   // true if this is a parallel set
  baseSetName: string;   // Original set name without parallel
}

function parseSetDataIntoMultipleSets(
  pastedText: string,
  setType: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
  releaseYear: string,
  releaseName: string
): SetData[]
```

**Implementation Logic**:
```typescript
function parseSetDataIntoMultipleSets(
  pastedText: string,
  setType: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert' | 'Other',
  releaseYear: string,
  releaseName: string
): SetData[] {
  // 1. Parse using existing logic
  const parsed = parseSetData(pastedText);
  const { name: baseSetName, totalCards, standardParallels, cards } = parsed;

  // 2. Import slug generator
  const { generateSetSlug } = require('@/lib/slugGenerator');

  // 3. Create base set
  const sets: SetData[] = [];

  sets.push({
    name: baseSetName,
    type: setType,
    slug: generateSetSlug(releaseYear, releaseName, baseSetName, setType),
    totalCards,
    parallels: [], // Deprecated
    cards: cards,
    isParallel: false,
    baseSetName: baseSetName,
  });

  // 4. Create parallel sets
  for (const parallel of standardParallels) {
    // Extract print run if present: "Electric Etch Orange /149" → "/149"
    const printRunMatch = parallel.match(/\/\d+/);
    const printRun = printRunMatch ? printRunMatch[0] : null;

    // Clean parallel name (remove print run)
    const cleanParallelName = parallel.replace(/\s*\/\d+.*$/, '').trim();

    sets.push({
      name: `${baseSetName} ${cleanParallelName}`,
      type: setType,
      slug: generateSetSlug(releaseYear, releaseName, baseSetName, setType, cleanParallelName),
      totalCards,
      parallels: [], // Deprecated
      cards: cards, // Same cards, will have parallel in Set name
      isParallel: true,
      baseSetName: baseSetName,
      printRun: printRun,
    });
  }

  return sets;
}
```

#### 2.3: Update Save Logic
**Current**: Saves one set at a time
**New**: Save multiple sets in a batch

```typescript
async function handleSaveSetData() {
  const setDataArray = parseSetDataIntoMultipleSets(
    pastedText,
    setType,
    release.year,
    release.name
  );

  // Save all sets
  for (const setData of setDataArray) {
    await fetch('/api/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: setData.name,
        type: setData.type,
        slug: setData.slug, // Already generated
        totalCards: setData.totalCards,
        releaseId: release.id,
        parallels: [], // Empty - deprecated field
      }),
    });

    // Then create cards for this set...
  }

  setMessage({
    type: 'success',
    text: `Created ${setDataArray.length} sets (1 base + ${setDataArray.length - 1} parallels)`
  });
}
```

### Phase 3: Display Updates

#### 3.1: Release Detail Page
File: `/app/releases/[slug]/page.tsx`

**Current**: Shows sets with "View parallels" links
**New**: Shows all sets (base + parallels) as flat list

Group display by base set:
```tsx
{/* Group sets by base set name */}
{groupedSets.map(group => (
  <div key={group.baseSetName} className="mb-6">
    <h3 className="text-lg font-semibold mb-2">{group.baseSetName}</h3>

    {/* Base set */}
    <Link href={`/sets/${group.baseSet.slug}`} className="...">
      {group.baseSet.name} ({group.baseSet.totalCards} cards)
    </Link>

    {/* Parallel sets */}
    {group.parallels.map(parallel => (
      <Link key={parallel.id} href={`/sets/${parallel.slug}`} className="...">
        {parallel.name} ({parallel.totalCards} cards)
      </Link>
    ))}
  </div>
))}
```

#### 3.2: Set Detail Page
File: `/app/sets/[slug]/page.tsx`

**Current**: Shows parallel selector dropdown
**New**: No parallel selector needed - URL directly identifies the set+parallel

Remove:
- Parallel selection dropdown
- `?parallel=` query parameter logic
- Complex set matching logic

Simplify to:
```tsx
// Direct lookup by slug
const set = await prisma.set.findUnique({
  where: { slug: params.slug },
  include: { cards: true, release: true }
});
```

### Phase 4: Card Slug Consistency

Card slugs should match the set structure:

**Current card slug**: `{year}-{release}-{set}-{card#}-{player}-{parallel}`

**Ensure consistency**:
- When creating cards for a parallel set, the set name already contains the parallel
- Card slug generation should work automatically

Example:
- Set slug: `2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-orange`
- Card slug: `2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-orange-2-giovani-lo-celso`

### Phase 5: Migration Strategy

#### Option A: Fresh Start (Recommended for Development)
Since you're in active development:
1. Clear existing sets
2. Re-import with new structure
3. Faster and cleaner

#### Option B: Data Migration
Create migration script `/backfill_parallel_sets.ts`:
```typescript
// For each existing set with parallels:
// 1. Keep as base set (clear parallels array)
// 2. Create new set records for each parallel
// 3. Reassign cards to appropriate parallel sets based on Card.parallelType
// 4. Update all slugs
```

## Testing Checklist

### Unit Tests
- [ ] `generateSetSlug()` with and without parallel parameter
- [ ] `generateSetSlug()` with special cases (1/1, Optic Base)
- [ ] `parseSetDataIntoMultipleSets()` with various input formats

### Integration Tests
- [ ] Create base set via admin interface
- [ ] Create autograph set with 5 parallels via admin interface
- [ ] Verify all sets created with correct slugs
- [ ] Verify all cards created and associated correctly
- [ ] Access base set URL directly
- [ ] Access parallel set URL directly
- [ ] Verify set detail page shows correct cards

### Regression Tests
- [ ] Existing base set URLs still work
- [ ] Card slugs remain consistent
- [ ] Release detail page displays correctly

## Rollout Plan

### Step 1: Add Set Type Selector (No Breaking Changes)
- Add dropdown to admin interface
- Save `type` field when creating sets
- Existing functionality continues to work

### Step 2: Implement Parallel-as-Set Creation
- Add new parsing function
- Create multiple sets when pasting data
- Old sets still work, new sets use new structure

### Step 3: Update Display Logic
- Update release page to show flat list
- Update set page to remove parallel selector
- Both old and new structures display correctly

### Step 4: Migrate Existing Data
- Run migration script on existing sets
- Verify all URLs redirect correctly
- Remove deprecated fields

## API Endpoints Summary

### POST /api/sets
**Input**:
```json
{
  "name": "Dual Jersey Ink Electric Etch Orange",
  "type": "Autograph",
  "totalCards": "25",
  "releaseId": "...",
  "parallels": []
}
```

**Behavior**: Automatically generates slug, creates set

### GET /api/sets?slug={slug}
**Input**: `slug=2024-25-panini-obsidian-soccer-auto-dual-jersey-ink-electric-etch-orange`

**Behavior**: Direct lookup, returns set with cards

### PUT /api/sets
**Input**: Update name or type
**Behavior**: Regenerates slug automatically

## Files to Modify

### Core Files
- [x] `/lib/slugGenerator.ts` - Add parallel parameter ✅
- [ ] `/app/admin/releases/edit/[id]/page.tsx` - Add UI and parsing logic
- [ ] `/app/api/sets/route.ts` - Already updated ✅
- [ ] `/app/releases/[slug]/page.tsx` - Update set display
- [ ] `/app/sets/[slug]/page.tsx` - Simplify (remove parallel logic)

### Optional/Later
- [ ] `/backfill_parallel_sets.ts` - Migration script
- [ ] `/prisma/schema.prisma` - Add baseSetSlug, printRun fields
- [ ] Update CLAUDE.md documentation

## Notes & Considerations

1. **Print Runs**: Currently stored in parallel name string. Consider extracting to separate field.

2. **Variable Parallels**: Some parallels have player-specific print runs (e.g., "Messi /10, Ronaldo /25"). May need special handling.

3. **Performance**: Creating N sets for N parallels is more database records but simpler query logic. Trade-off is acceptable.

4. **Backwards Compatibility**: During transition, both old (single set + parallels array) and new (multiple sets) should work.

5. **URL Redirects**: If migrating existing URLs, set up redirects from old `/sets/{slug}/parallels/{parallel}` to new `/sets/{slug-parallel}`.

## Questions to Resolve

1. Should we keep `Set.parallels` field for backwards compatibility or remove it entirely?
   - **Recommendation**: Keep but always set to `[]` for new sets

2. Should cards reference the specific parallel set, or still use `parallelType` field?
   - **Recommendation**: Remove `parallelType`, cards reference set directly

3. How to handle sets with no parallels (simple base sets)?
   - **Recommendation**: Create single set record, no parallel sets

4. Should we show base + parallels together or separate in admin interface?
   - **Recommendation**: Group visually but treat as separate sets in database

## Success Metrics

- [ ] Can paste checklist with 10 parallels and create 11 sets (1 base + 10 parallels) in <2 seconds
- [ ] All set URLs follow consistent pattern
- [ ] Card slugs match set structure
- [ ] Admin interface is intuitive
- [ ] No breaking changes to existing functionality

---

**Document Version**: 1.0
**Last Updated**: 2025-01-02
**Status**: Specification Phase
