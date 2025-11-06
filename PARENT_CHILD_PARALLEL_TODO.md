# Parent-Child Parallel Set Architecture - TODO

## Overview
Complete the refactoring from "flat parallel sets" to "parent-child parallel sets" where:
- **Parent sets** (Base, Auto, Memorabilia, Insert) are shown on Release pages
- **Child parallel sets** are linked from parent set pages, not shown on Release pages
- Cards are only stored once on the parent set (not duplicated for each parallel)

---

## ✅ Completed

1. **Database Schema** - Added `parentSetId` field to Set model
   - File: `/prisma/schema.prisma`
   - Fields added: `parentSetId`, `parentSet` relation, `parallelSets` array
   - Schema pushed to database with `npx prisma db push`

2. **Progress Indicator** - Added visual feedback during multi-set creation
   - File: `/app/admin/releases/edit/[id]/page.tsx`
   - Shows spinner, progress bar, and current set being created

---

## 🔧 Remaining Tasks

### 1. Update Parser Function
**File**: `/app/admin/releases/edit/[id]/page.tsx`
**Function**: `parseSetDataIntoMultipleSets()` (starts around line 451)

**Changes Needed**:

```typescript
// Clean up set name - remove "Checklist", "Set", etc.
let cleanedSetName = rawSetName
  .replace(/\bset\s+checklist\b/gi, '')  // Remove "Set Checklist"
  .replace(/\bchecklist\b/gi, '')        // Remove "Checklist"
  .replace(/\bbase\s+set\b/gi, 'Base')   // "Base Set" → "Base"
  .trim();

// If name is empty, default to set type
if (!cleanedSetName) cleanedSetName = setType;

// For parallel sets:
// - name: just the parallel name (e.g., "Electric Etch Orange")
// - cards: empty array (don't duplicate cards)
// - parentSetId: 'PLACEHOLDER' (will be replaced after parent created)
```

**Update return type** to include `parentSetId?:string` field.

---

### 2. Update Creation Logic
**File**: `/app/admin/releases/edit/[id]/page.tsx`
**Function**: `handleChecklistPaste()` (starts around line 858)

**Changes Needed**:

```typescript
// 1. Create parent set FIRST
const parentSetData = multiSetData[0]; // First item is always parent
const parentResponse = await fetch('/api/sets', {
  method: 'POST',
  body: JSON.stringify({
    name: parentSetData.name,
    type: parentSetData.type,
    totalCards: parentSetData.totalCards,
    releaseId: release.id,
    parentSetId: null, // Explicitly null for parent sets
  }),
});
const parentSet = await parentResponse.json();

// 2. Create cards ONLY for parent set
await createCardsInDatabase(
  parentSet.id,
  parentSetData.cards,
  [], // No parallels - cards are just base cards
  false
);

// 3. Create child parallel sets with parentSetId
const parallelSets = multiSetData.slice(1); // All except first
for (const parallelData of parallelSets) {
  await fetch('/api/sets', {
    method: 'POST',
    body: JSON.stringify({
      name: parallelData.name,
      type: parallelData.type,
      totalCards: parallelData.totalCards,
      releaseId: release.id,
      parentSetId: parentSet.id, // Link to parent
    }),
  });
  // NO cards created for parallels - they reference parent's cards
}
```

**Update progress tracking** to show:
- "Creating parent set..."
- "Creating parallel 1/N..."
- "Creating parallel 2/N..."

---

### 3. Update Release Page Query
**File**: `/app/releases/[slug]/page.tsx`

**Changes Needed**:

Find the query that fetches sets for a release and add filter:

```typescript
const sets = await prisma.set.findMany({
  where: {
    releaseId: release.id,
    parentSetId: null, // ONLY show parent sets on release page
  },
  orderBy: { createdAt: 'desc' },
  include: {
    parallelSets: true, // Include count of child parallels
    cards: true,
  },
});
```

**Display changes**:
- Show parent sets only (Base, Auto, Memorabilia, Insert)
- Optionally show count: "Base Set (8 parallels)"

---

### 4. Update Set Detail Page
**File**: `/app/sets/[slug]/page.tsx`

**Changes Needed**:

```typescript
// Fetch the set with its parallel children
const set = await prisma.set.findUnique({
  where: { slug: params.slug },
  include: {
    cards: true,
    release: true,
    parallelSets: { // Child parallels
      orderBy: { name: 'asc' },
    },
    parentSet: true, // If this IS a parallel, show parent
  },
});

// If this is a parallel set (has parentSetId), fetch parent's cards
const cardsToDisplay = set.parentSetId
  ? await prisma.card.findMany({ where: { setId: set.parentSetId }})
  : set.cards;
```

**UI Changes**:
- If parent set: Show "Parallels" section with links to each child
- If parallel set: Show link back to parent + "Viewing: [Parallel Name]"
- Display checklist (from parent if this is a parallel)

**Example UI**:

```tsx
{set.parallelSets && set.parallelSets.length > 0 && (
  <div className="mb-6">
    <h3 className="text-lg font-semibold mb-2">Parallels</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {set.parallelSets.map(parallel => (
        <Link
          key={parallel.id}
          href={`/sets/${parallel.slug}`}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          {parallel.name}
        </Link>
      ))}
    </div>
  </div>
)}

{set.parentSet && (
  <div className="mb-4 text-sm">
    <Link href={`/sets/${set.parentSet.slug}`} className="text-blue-600 hover:underline">
      ← Back to {set.parentSet.name}
    </Link>
    <span className="ml-2 text-gray-600">Viewing: {set.name}</span>
  </div>
)}
```

---

### 5. Update API Endpoints (if needed)
**File**: `/app/api/sets/route.ts`

**Verify** that POST endpoint accepts `parentSetId`:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, totalCards, releaseId, parentSetId } = body;

  const set = await prisma.set.create({
    data: {
      name,
      type,
      totalCards,
      releaseId,
      parentSetId: parentSetId || null, // Accept parentSetId
      // ... other fields
    },
  });

  return NextResponse.json(set);
}
```

---

## 📋 Testing Checklist

After implementing all changes:

### Admin Interface
- [ ] Paste a base set checklist with parallels
- [ ] Verify 1 parent set created (e.g., "Base")
- [ ] Verify N child parallel sets created (e.g., "Electric Etch Orange")
- [ ] Verify parent has `parentSetId = null`
- [ ] Verify children have `parentSetId = {parent.id}`
- [ ] Verify cards only created for parent set
- [ ] Verify progress indicator shows during creation

### Release Page (`/releases/[slug]`)
- [ ] Only parent sets displayed (Base, Auto, Memorabilia, Insert)
- [ ] No parallel sets displayed
- [ ] Correct card counts shown

### Set Detail Page (`/sets/[slug]`)
- [ ] Parent set shows list of parallels as clickable links
- [ ] Clicking parallel link goes to `/sets/{parallel-slug}`
- [ ] Parallel page shows same checklist as parent
- [ ] Parallel page shows link back to parent
- [ ] Both parent and parallel pages display correctly

### Database
- [ ] Check Prisma Studio: parent sets have `parentSetId = null`
- [ ] Check Prisma Studio: parallel sets have `parentSetId = {parent id}`
- [ ] Cards only exist for parent sets
- [ ] Slugs are unique and correct

---

## 🚨 Edge Cases to Handle

1. **Sets with no parallels**: Should only create 1 parent set, no children
2. **Variable parallels**: May need special handling (numbered /10, /25, etc.)
3. **Existing data**: May need migration script to convert flat parallels to parent-child
4. **Delete operations**: Deleting parent should cascade delete children (already handled by Prisma `onDelete: Cascade`)

---

## 📝 Migration Strategy (Optional)

If you have existing sets created with the old flat structure:

**Option A**: Delete all existing sets and re-import
- Fastest for development
- Clean slate

**Option B**: Write migration script `/backfill_parent_child_sets.ts`:
```typescript
// 1. Find all sets with same baseSetName
// 2. Pick one as parent (usually the one without parallel in name)
// 3. Set others' parentSetId to parent.id
// 4. Move all cards to parent set
// 5. Delete cards from child sets
```

---

## 🎯 Success Criteria

Implementation is complete when:

1. ✅ Release page shows only parent sets (Base, Auto, Mem, Insert)
2. ✅ Set detail page shows parallel options for parent sets
3. ✅ Clicking parallel navigates to parallel-specific page
4. ✅ Parallel page shows same checklist as parent
5. ✅ Cards are stored only once (on parent set)
6. ✅ Database has proper parent-child relationships
7. ✅ New sets can be created with proper structure
8. ✅ No duplicate cards in database

---

## 📚 Reference Files

- **Spec**: `/PARALLEL_AS_SET_SPEC.md`
- **Schema**: `/prisma/schema.prisma`
- **Admin**: `/app/admin/releases/edit/[id]/page.tsx`
- **Release Page**: `/app/releases/[slug]/page.tsx`
- **Set Page**: `/app/sets/[slug]/page.tsx`
- **API**: `/app/api/sets/route.ts`
- **Slug Generator**: `/lib/slugGenerator.ts`

---

**Last Updated**: 2025-01-03
**Status**: Ready for implementation
