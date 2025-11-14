# Footy.bot Development Documentation

## Table of Contents
1. [AI Integration Requirements](#ai-integration-requirements)
2. [Standardized Page Layout](#standardized-page-layout)
3. [URL Slug Conventions](#url-slug-conventions)
4. [Component Patterns](#component-patterns)
5. [Database Schema](#database-schema)
6. [Development Guidelines](#development-guidelines)

---

## AI Integration Requirements

### Anthropic SDK for Serverless Compatibility

**This project uses the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) directly for all AI operations.**

The application is deployed serverless on Vercel with a database-as-a-service backend. All AI functionality uses the Anthropic SDK for maximum compatibility and minimal overhead.

#### Configuration

All AI functions are centralized in `/lib/genkit.ts` (legacy filename retained for backward compatibility):

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

#### Creating AI Functions

Define reusable AI functions with Zod schema validation:

```typescript
export const ReleaseInfoSchema = z.object({
  manufacturer: z.string(),
  releaseName: z.string(),
  year: z.string(),
  slug: z.string(),
  // ... more fields
});

export type ReleaseInfo = z.infer<typeof ReleaseInfoSchema>;

export async function analyzeRelease(input: {
  documentText?: string;
  documentUrl?: string;
  mimeType?: string;
}): Promise<ReleaseInfo> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Your prompt here...`,
      },
    ],
  });

  // Extract and validate response
  const output = JSON.parse(extractedJson);
  return ReleaseInfoSchema.parse(output);
}
```

#### Using AI Functions

Call functions from API routes:

```typescript
import { analyzeRelease, generateDescription } from '@/lib/genkit';

const result = await analyzeRelease({
  documentText: extractedText,
});
```

#### PDF and Image Handling

Claude supports PDFs and images via base64 encoding:

```typescript
// Download file
const response = await fetch(fileUrl);
const arrayBuffer = await response.arrayBuffer();
const base64Data = Buffer.from(arrayBuffer).toString('base64');

// For PDFs
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: 'Analyze this PDF...',
        },
      ],
    },
  ],
});

// For images
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: 'Analyze this image...',
        },
      ],
    },
  ],
});
```

#### Best Practices

1. **Schema Validation**: Always use Zod schemas to validate AI outputs
2. **Error Handling**: Wrap AI calls in try-catch blocks
3. **Timeouts**: Set appropriate `maxDuration` in API routes (e.g., 300 seconds)
4. **Token Limits**: Use appropriate `max_tokens` based on expected response size
5. **Model Selection**: Use `claude-sonnet-4-20250514` for production workloads

#### Environment Variables

Required environment variable:

```bash
ANTHROPIC_API_KEY=your-api-key-here
```

---

## Standardized Page Layout

### Overview
All public-facing pages in the application follow a **standardized three-column layout pattern** to ensure consistent user experience and prevent layout shifts during loading states.

### Critical Pattern: Header Placement
**IMPORTANT**: This pattern was established during extensive development sessions to eliminate header resizing issues. DO NOT deviate from this pattern without careful consideration.

### Layout Structure

```tsx
export default function PageComponent() {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
        {/* Left Sidebar - Always renders */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="primary-keywords" limit={3} title="Ad Title" />
        </aside>

        {/* Main Content - Always renders */}
        <main className="flex-grow max-w-5xl space-y-6">
          {/* Header ALWAYS renders immediately */}
          <Header rounded={true} />

          {/* Conditional content based on loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h1>
                <p className="text-gray-600 mb-8">The content you're looking for doesn't exist.</p>
                <Link href="/" className="text-footy-green hover:underline">
                  ← Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Breadcrumb items={[...]} />

              {/* Main content here */}

              <Footer rounded={true} />
            </>
          )}
        </main>

        {/* Right Sidebar - Always renders */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="secondary-keywords" limit={3} title="Ad Title" />
        </aside>
      </div>
    </div>
  );
}
```

### Key Principles

1. **Header Renders Immediately**
   - Header component MUST render before any loading conditional
   - This prevents visual layout shift when transitioning from loading to content
   - Header is placed inside `<main>` tag, NOT in a separate wrapper

2. **Consistent Background**
   - All states (loading, error, content) use the same background gradient
   - Background: `bg-gradient-to-br from-gray-50 via-white to-gray-50`

3. **Sidebars Always Render**
   - Left and right sidebars render immediately
   - Hidden on mobile/tablet with `hidden lg:block`
   - Maintain consistent width: `w-72`

4. **Three-Column Layout**
   - Left Sidebar (288px / w-72)
   - Main Content (max-w-5xl / ~1024px)
   - Right Sidebar (288px / w-72)
   - Total max width: 1600px

5. **No Early Returns**
   - NEVER use early returns for loading/error states
   - Use conditional rendering (`{loading ? ... : ...}`) instead
   - This ensures consistent outer layout structure

### Pages Following This Pattern

✅ **All pages standardized as of October 2025:**
- `/` - Homepage
- `/releases` - Release index
- `/releases/[slug]` - Release detail pages
- `/posts` - Post index
- `/posts/[slug]` - Post detail pages
- `/sets/[slug]` - Set detail pages
- `/sets/[slug]/parallels/[parallel]` - Parallel pages
- `/cards/[slug]` - Card detail pages

### Common Mistakes to Avoid

❌ **Don't do this:**
```tsx
// BAD: Early return with different layout
if (loading) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div>Loading...</div>
    </div>
  );
}

// BAD: Header in separate wrapper with custom positioning
<div className="w-full px-4 pt-6">
  <div className="max-w-5xl mx-auto lg:ml-[304px]">
    <Header />
  </div>
</div>
```

✅ **Do this instead:**
```tsx
// GOOD: Single return with conditional content
return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
      <aside>...</aside>
      <main>
        <Header rounded={true} />
        {loading ? <LoadingSpinner /> : <Content />}
      </main>
      <aside>...</aside>
    </div>
  </div>
);
```

---

## URL Slug Conventions

### Card Slugs

**Base Card Format:** `{year}-{release}-{set}-{cardNumber}-{player}-{printRun}`
- Example: `2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-145`

**Parallel Card Format:** `{year}-{release}-{cardNumber}-{player}-{parallelName}-{printRun}`
- Example: `2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8`
- **Note:** Set name is excluded for parallel cards since parallel name is more specific

**Key Rules:**
1. **Parallel cards exclude the base set name** from slugs to avoid redundancy
2. **Print runs are not duplicated** - if the parallel name ends with the print run, it's not added again
3. **1/1 cards** use special formatting (see below)

### Set Slugs

**Format:** `{year}-{release}-{type-prefix}-{setname}[-{parallel}]`

**Type Prefixes:**
- `Base` → `base` (or omit if setName already contains "base")
- `Autograph` → `auto`
- `Memorabilia` → `mem`
- `Insert` → `insert`
- `Other` → (no prefix)

**Examples:**
- Base: `2024-25-obsidian-soccer-obsidian-base`
- Insert: `2024-25-obsidian-soccer-insert-equinox`
- Autograph: `2024-25-obsidian-soccer-auto-dual-jersey-ink`
- Parallel: `2024-25-obsidian-soccer-obsidian-base-electric-etch-green-5`

### Special Cases

#### 1/1 Cards (Chase/Grail Cards)
- **Database stores:** `"1/1"` or `"Black 1/1"`
- **URLs use:** `"1-of-1"` or `"black-1-of-1"`
- **Display shows:** `"1 of 1"` or `"Black 1 of 1"`

**Slug Generation Pattern:**
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

**Display Formatting:**
```typescript
// Use formatParallelName from /lib/formatters.ts
import { formatParallelName } from '@/lib/formatters';

// Converts URL slugs to display format
// "1-of-1" → "1 of 1"
// "gold-power-1-of-1" → "Gold Power 1 of 1"
<span>{formatParallelName(parallelName)}</span>
```

#### Optic Base Set Naming
- **Database:** `"Optic Base Set"` or `"Base Optic"`
- **URLs:** `"optic"` (Base is removed)
- **Display:** `"Optic"` (Base is removed)

**Pattern:**
```typescript
const displayName = setName
  .replace(/\boptic\s+base\s+set\b/gi, 'Optic')
  .replace(/\boptic\s+base\b/gi, 'Optic')
  .replace(/\bbase\s+optic\b/gi, 'Optic')
  .trim();
```

#### Regular Base Sets
- **Database:** `"Base Set"`
- **URLs:** `"base"` (keep "Base")
- **Display:** `"Base"` (keep "Base")

#### Print Runs in Parallels
When a parallel name includes a print run indicator (e.g., "Electric Etch Orange /149"):
- **Stored name:** Extract and clean the parallel name (e.g., "Electric Etch Orange")
- **Set.printRun or Set.totalCards:** Store the print run separately
- **Slug:** Include the print run number (e.g., `electric-etch-orange-149`)
- **Display:** Show the full name with formatting (e.g., "Electric Etch Orange /149")

### Card Slug Generation Logic

**Location:** `/lib/slugGenerator.ts` - `generateCardSlug()` function

**Implementation Details:**

1. **Parallel Card Detection:**
   - A card is considered a parallel if the variant differs from the set name
   - Parallel cards have the set name excluded from the slug
   - Example: Variant "Electric Etch Marble Flood 8" != Set "Obsidian Base" → parallel card

2. **Print Run Deduplication:**
   - Checks if variant already ends with the print run number
   - Prevents duplicate print runs (e.g., `-8-8` becomes `-8`)
   - Example: Variant "Electric Etch Marble Flood 8" with printRun=8 → only includes `-8` once

3. **1/1 Card Handling:**
   - Converts "1/1" or "1 of 1" to "1-of-1" format
   - Detects if variant ends with "1-of-1" and printRun is 1
   - Prevents adding extra `-1` to the slug

**Code Reference:**
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

**Examples:**
- Parallel: `generateCardSlug('Panini', 'Obsidian Soccer', '2024-25', 'Obsidian Base', '1', 'Jude Bellingham', 'Electric Etch Marble Flood 8', 8)`
  → `2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-marble-flood-8`
- Base: `generateCardSlug('Panini', 'Obsidian Soccer', '2024-25', 'Obsidian Base', '1', 'Jude Bellingham', null, 145)`
  → `2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-145`
- 1/1: `generateCardSlug('Panini', 'Obsidian Soccer', '2024-25', 'Obsidian Base', '1', 'Jude Bellingham', 'Gold Power 1/1', 1)`
  → `2024-25-obsidian-soccer-1-jude-bellingham-gold-power-1-of-1`

### Set Slugs
Format: `{year}-{release}-{setName}`

Example: `2024-25-donruss-soccer-optic`

### Release Slugs
Format: `{year}-{manufacturer}-{release}`

Example: `2024-25-panini-donruss-soccer`

---

## Set & Parallel Architecture

### Parent-Child Parallel Relationships

The database uses a **parent-child model** for parallel sets:

- **Parent Sets**: Base sets, insert sets, autograph sets, etc. that contain the actual card checklist
- **Child Parallel Sets**: Variations of the parent set (e.g., "Electric Etch Orange", "Gold Power") that reference the parent's cards

**Database Structure:**
```typescript
// Parent set (e.g., "Obsidian Base")
const parentSet = {
  id: 'abc123',
  name: 'Obsidian Base',
  type: 'Base',
  parentSetId: null,          // null indicates this is a parent
  parallelSets: [child1, child2, ...], // Array of children
  cards: [card1, card2, ...]   // Cards stored here
};

// Child parallel set (e.g., "Electric Etch Orange")
const parallelSet = {
  id: 'xyz789',
  name: 'Electric Etch Orange',
  type: 'Base',
  parentSetId: 'abc123',      // Points to parent
  parallelSets: [],           // Parallels don't have children
  cards: []                   // Empty - references parent's cards
};
```

**Key Principles:**

1. **Cards stored once**: Cards exist only on the parent set, not duplicated for each parallel
2. **Release pages show parents only**: Only parent sets displayed on release pages (not child parallels)
3. **Set pages show parallels**: Parent set pages display links to their child parallel sets
4. **Parallel pages reference parent cards**: When viewing a parallel, the page fetches and displays the parent's cards

**Query Pattern:**
```typescript
// Fetch set with parallel relationships
const set = await prisma.set.findUnique({
  where: { slug: params.slug },
  include: {
    cards: true,              // Cards (if parent)
    parallelSets: true,       // Child parallels (if parent)
    parentSet: {              // Parent info (if parallel)
      include: { cards: true } // Parent's cards (if this is parallel)
    }
  }
});

// Display cards: use parent's cards if this is a parallel
const cardsToDisplay = set.parentSetId
  ? set.parentSet.cards
  : set.cards;
```

**Benefits:**
- **Storage efficiency**: Cards not duplicated across parallels
- **Consistency**: Single source of truth for card data
- **Maintainability**: Update cards in one place, reflects across all parallels
- **Query performance**: Simpler joins, fewer records to fetch

### Edge Cases to Handle

1. **Sets with no parallels**: Create only 1 parent set, no children
2. **Variable parallels**: Some parallels have player-specific print runs (e.g., "Messi /10, Ronaldo /25")
3. **Cascading deletes**: Deleting parent should cascade delete children (handled by Prisma `onDelete: Cascade`)
4. **Orphaned parallels**: Ensure parallel sets always have valid `parentSetId` reference

### Testing Checklist for Parallel Sets

When implementing or modifying parallel set functionality:

**Database Level:**
- [ ] Parent sets have `parentSetId = null`
- [ ] Parallel sets have `parentSetId` pointing to valid parent
- [ ] Cards only exist for parent sets
- [ ] Slugs are unique and follow conventions
- [ ] Cascading deletes work correctly

**Release Page (`/releases/[slug]`):**
- [ ] Only parent sets displayed
- [ ] No parallel sets shown
- [ ] Correct card counts
- [ ] Set type badges display correctly (Base, Insert, Auto, Mem)

**Set Detail Page (`/sets/[slug]`):**
- [ ] Parent set shows list of parallels as links
- [ ] Clicking parallel navigates to `/sets/{parallel-slug}`
- [ ] Parallel page shows same checklist as parent
- [ ] Parallel page shows link back to parent
- [ ] Breadcrumbs work correctly for both parent and parallel

**Admin Interface:**
- [ ] Creating set with parallels creates parent + children
- [ ] Cards only created for parent
- [ ] Progress indicator shows accurate counts
- [ ] Duplicate detection prevents errors on re-import

---

## Component Patterns

### Header Component
Location: `/components/Header.tsx`

**Props:**
- `showBackButton?: boolean` - Show back navigation (default: false)
- `rounded?: boolean` - Apply rounded corners (default: false, use true on public pages)

**Usage:**
```tsx
// Public pages
<Header showBackButton={false} rounded={true} />

// Admin pages
<Header showBackButton={true} rounded={false} />
```

### Footer Component
Location: `/components/Footer.tsx`

**Props:**
- `rounded?: boolean` - Apply rounded corners (default: false, use true on public pages)

**Usage:**
```tsx
<Footer rounded={true} />
```

### EbayAd Component
Location: `/components/EbayAd.tsx`

**Props:**
- `query: string` - Search keywords for eBay API
- `limit?: number` - Number of ads to display (default: 3)
- `title?: string` - Ad section title

**Usage:**
```tsx
<EbayAd
  query="soccer cards"
  limit={3}
  title="Latest Soccer Cards"
/>
```

### Breadcrumb Component
Location: `/components/Breadcrumb.tsx`

**Props:**
- `items: Array<{ label: string; href: string }>`

**Usage:**
```tsx
<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Releases", href: "/releases" },
    { label: "2024-25 Panini Obsidian Soccer", href: "/releases/2024-25-panini-obsidian-soccer" },
  ]}
/>
```

---

## Database Schema

> **📊 For complete database reference documentation, see [docs/DATABASE.md](/docs/DATABASE.md)**
>
> This section contains development-specific schema patterns and quick reference. For detailed field descriptions, query patterns, and migration guides, refer to the comprehensive database documentation.

### Hierarchy
```
Manufacturer
  └── Release (year, name, slug, description, releaseDate, sourceFiles)
       └── Set (name, slug, type, parentSet, parallelSets, printRun)
            └── Card (playerName, team, cardNumber, variant, parallelType, printRun, slug)
```

### Key Models (Quick Reference)

#### Card
```prisma
model Card {
  id                    String   @id @default(cuid())
  slug                  String?  @unique
  playerName            String?
  team                  String?
  cardNumber            String?
  variant               String?  // Basic variant name (e.g., "Refractor", "Chrome")

  // Enhanced parallel/variation detection fields
  parallelType          String?  // Specific parallel type (e.g., "Gold Refractor", "Red Wave")
  serialNumber          String?  // Serial number if numbered (e.g., "123/299")
  isNumbered            Boolean  @default(false)
  printRun              Int?     // Total print run (e.g., 299 for /299)
  numbered              String?  // Display string for numbering (e.g., "1 of 1", "/99", "/199")
  rarity                String?  // Rarity level (base, rare, super_rare, ultra_rare, one_of_one)
  finish                String?  // Card finish (refractor, chrome, matte, glossy, holographic)
  hasAutograph          Boolean  @default(false)
  hasMemorabilia        Boolean  @default(false)
  specialFeatures       String[] // Array of special features (rookie, insert, short_print, etc.)
  colorVariant          String?  // Color designation (gold, red, blue, green, orange, etc.)

  // OCR and detection metadata
  detectionConfidence   Int?     // AI confidence score (0-100)
  detectionMethods      String[] // Methods used (ocr, visual, ai_analysis)
  detectedText          String?  // Raw OCR text for reference

  // Images
  imageFront            String?  // Front image URL
  imageBack             String?  // Back image URL

  // Admin notes
  footyNotes            String?  @db.Text // Internal notes about this card

  setId                 String
  set                   Set      @relation(fields: [setId], references: [id], onDelete: Cascade)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  posts                 Post[]   // Posts that reference this card
  images                Image[]
}
```

#### Set
```prisma
model Set {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // URL-friendly slug - required for public access
  type        SetType  @default(Base) // Base, Autograph, Memorabilia, or Insert
  isBaseSet   Boolean  @default(false) // Deprecated: use type field instead
  releaseId   String
  release     Release  @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  totalCards  String?
  printRun    Int?     // Standard print run for this set (e.g., 99 for "/99" parallels)
  description String?  // Optional description for this set

  // Source data for regeneration and reference
  sourceText  String?  @db.Text // Original pasted checklist text (parent sets only)

  parallels   Json?    // DEPRECATED: Array of {name: string, printRun: string}

  // Parent-child relationship for parallel sets
  parentSetId String?  // Reference to parent set (null for parent sets)
  parentSet   Set?     @relation("ParallelSets", fields: [parentSetId], references: [id], onDelete: Cascade)
  parallelSets Set[]   @relation("ParallelSets") // Child parallel sets of this parent

  // Flags for parallel behavior
  hasVariableChecklist Boolean @default(false) // True if parallels have different checklists
  mirrorsParentChecklist Boolean @default(true) // True if parallel cards should mirror parent set

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cards       Card[]
  posts       Post[]   // Posts that reference this set
  images      Image[]
}

enum SetType {
  Base
  Autograph
  Memorabilia
  Insert
}
```

#### Release
```prisma
model Release {
  id             String          @id @default(cuid())
  name           String
  year           String?
  slug           String          @unique
  description    String?         // Brief summary displayed in previews
  releaseDate    DateTime?       // Official release date

  // Source files used for AI analysis
  sellSheetText  String?         @db.Text // Extracted text from sell sheets
  sourceFiles    Json?           // Array of {url, type, filename} for PDFs/images

  manufacturerId String
  manufacturer   Manufacturer    @relation(fields: [manufacturerId], references: [id], onDelete: Cascade)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  sets           Set[]
  posts          Post[]
  images         Image[]
  sourceDocuments ReleaseSourceDocument[]
}
```

#### Image
```prisma
model Image {
  id        String    @id @default(cuid())
  url       String
  caption   String?
  order     Int       @default(0)
  type      ImageType // What this image belongs to
  createdAt DateTime  @default(now())

  // Foreign keys - only one will be set based on type
  releaseId String?
  release   Release?  @relation(fields: [releaseId], references: [id], onDelete: Cascade)

  setId     String?
  set       Set?      @relation(fields: [setId], references: [id], onDelete: Cascade)

  cardId    String?
  card      Card?     @relation(fields: [cardId], references: [id], onDelete: Cascade)

  postId    String?
  post      Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
}

enum ImageType {
  RELEASE    // Release product image
  SET        // Set/insert image
  CARD       // Individual card image
  POST       // Post/article image
}
```

### Important Schema Notes

> **For comprehensive documentation on all schema fields, relationships, and query patterns, see [docs/DATABASE.md](/docs/DATABASE.md)**

#### Set Parent-Child Relationships

Sets use a self-referential relationship for parallel sets. See [Parent-Child Parallel Sets](/docs/DATABASE.md#parent-child-parallel-sets) in the database reference for complete documentation.

```typescript
// Parent set (e.g., "Obsidian Base")
const parentSet = {
  id: 'abc123',
  name: 'Obsidian Base',
  type: 'Base',
  parentSetId: null,          // null indicates this is a parent
  parallelSets: [child1, child2, ...] // Array of children
};

// Child parallel set (e.g., "Electric Etch Marble Flood 8")
const parallelSet = {
  id: 'xyz789',
  name: 'Electric Etch Marble Flood 8',
  type: 'Insert',
  parentSetId: 'abc123',      // Points to parent
  parallelSets: []            // Parallels don't have children
};
```

#### Print Run Fields

Print runs appear in multiple places. See [Card model](/docs/DATABASE.md#card) and [Set model](/docs/DATABASE.md#set) in the database reference for complete field documentation.

1. **Card.printRun** - Individual card print run (e.g., 8 for "/8")
2. **Set.printRun** - Standard print run for all cards in set (e.g., 99 for all cards "/99")
3. **Card.numbered** - Display string (e.g., "1 of 1", "/99")

**Best Practice:** For parallel sets where all cards have the same print run, store in `Set.printRun`. For individual numbered cards, store in `Card.printRun`.

#### Deprecated Fields

See [Deprecated Fields](/docs/DATABASE.md#deprecated-fields) in the database reference for migration plans and handling guidance.

- **Set.isBaseSet** - Deprecated, use `Set.type` instead
- **Set.parallels** (Json) - Deprecated, use `Set.parallelSets` relation instead

---

## Development Guidelines

### TypeScript Best Practices

1. **Null Checks**
   - Always check for null/undefined when accessing nested properties
   - Use optional chaining: `card?.set?.release?.name`
   - Add TypeScript guards in conditionals

2. **Type Safety**
   ```typescript
   // Good: Proper typing
   const [data, setData] = useState<DataType | null>(null);

   // Good: Type guards in conditionals
   {data && data.property && (
     <Component data={data} />
   )}
   ```

### Component Development

1. **Use Existing Patterns**
   - Reference existing pages before creating new ones
   - Maintain consistent styling with Tailwind
   - Follow the standardized layout structure

2. **Loading States**
   - Always provide loading feedback
   - Use consistent spinner design
   - Show loading state in place of content, not entire page

3. **Error Handling**
   - Provide clear error messages
   - Offer navigation back to safety (home, back button)
   - Log errors to console for debugging

### Styling Guidelines

**Color Palette:**
- Primary Green: `#005031` (footy-green)
- Primary Orange: `#F47322` (footy-orange)
- Backgrounds: Gradient from `gray-50` via `white` to `gray-50`

**Spacing:**
- Page padding: `px-4 pt-6 pb-12`
- Component spacing: `space-y-6`
- Gap between columns: `gap-4`

**Rounded Corners:**
- Public pages: Use `rounded-2xl` for major sections
- Cards/items: Use `rounded-lg`

### Testing Checklist

Before committing changes to page layouts:

- ✅ Header renders immediately without flash/resize
- ✅ Loading state shows spinner in content area only
- ✅ Error state shows message in content area only
- ✅ All three columns (sidebars + main) render immediately
- ✅ Same background gradient in all states
- ✅ Mobile responsive (sidebars hidden on small screens)
- ✅ TypeScript builds without errors
- ✅ No console errors in browser
- ✅ Breadcrumbs display correctly
- ✅ Footer appears at bottom of content

---

## Recent Changes Log

### November 14, 2025 - Documentation Cleanup

**Changes:**
- Removed legacy "AI-Powered Excel Import Workflow" section (components and API routes no longer exist)
- Corrected Image model documentation to reflect actual schema (uses direct foreign keys with `type` discriminator, not junction tables)
- Removed duplicate "Recent Changes Log" section
- Updated table of contents to reflect current documentation structure

### November 12, 2025 - Database Schema Cleanup & Checklists Feature

**Changes:**
- Removed legacy User table from public schema (authentication uses neon_auth.admin_users)
- Added Checklists page with filtering by manufacturer, release, and set type
- Fixed database cleanup script to remove references to non-existent junction tables
- Updated delete-all-data script to reflect current schema architecture

**Authentication Architecture:**
- Verified authentication queries `neon_auth.admin_users` table (separate schema)
- Removed unused `public.User` table from Prisma schema
- Authentication remains fully functional via neon_auth integration

**Checklists Feature:**
- New `/checklists` route with filterable table of all card sets
- Filters: search, manufacturer, release, and set type
- Users can browse checklists without navigating manufacturer→release hierarchy
- Direct links to set detail pages with full card checklists

**Database Schema Architecture:**
- Uses direct foreign keys with `ImageType` enum discriminator
- Image model: `releaseId`, `setId`, `cardId`, `postId` with `type` field for relationship identification
- SourceDocument model: `releaseId`, `postId` with `entityType` field
- No junction tables needed - simpler direct foreign key approach

**Files Modified:**
1. `prisma/schema.prisma` - Removed User model
2. `scripts/delete-all-data.ts` - Removed User deletion and fixed junction table references
3. `scripts/verify-auth-schema.ts` - Created verification script
4. `app/api/checklists/route.ts` - New API endpoint for fetching filtered sets
5. `app/api/checklists/filters/route.ts` - New API endpoint for filter options
6. `app/checklists/page.tsx` - New checklists browser page
7. `components/Header.tsx` - Added "Checklists" navigation link
8. `.claude/CLAUDE.md` - This documentation update

**Key Learnings:**
- Always verify authentication is using correct schema before removing tables
- Direct foreign keys with type discriminators are simpler than junction tables for this use case
- TypeScript interfaces in frontend code may reference non-existent DB models
- Database reset confirmed clean slate after removing legacy User table

### November 11, 2025 - Documentation Consolidation & Parallel Architecture
**Changes:**
- Consolidated parallel set architecture documentation from spec files into `.claude/CLAUDE.md`
- Added comprehensive "Set & Parallel Architecture" section documenting parent-child relationships
- Enhanced "URL Slug Conventions" with set slug formatting and type prefixes
- Added testing checklists for parallel set functionality
- Documented edge cases and query patterns

**Sections Added:**
- **Set & Parallel Architecture**: Parent-child model, database structure, query patterns, and benefits
- **Edge Cases to Handle**: Sets without parallels, variable parallels, cascading deletes
- **Testing Checklist for Parallel Sets**: Database, release page, set page, and admin interface tests

**Files Consolidated:**
- `/PARALLEL_AS_SET_SPEC.md` → Extracted slug conventions, type prefixes, and special cases
- `/PARENT_CHILD_PARALLEL_TODO.md` → Extracted testing checklist and edge cases
- Both spec files deleted as content preserved in permanent documentation

### October 2025 - Layout Standardization
**Changes:**
- Standardized all public pages to use three-column layout
- Fixed header resizing issues on 4 pages
- Documented standardized pattern in this file

**Commits:**
- `3bdbf62` - Fix header resizing on all public pages
- `4fdb904` - Fix TypeScript error in parallel page
- `c422ec0` - Standardize release detail page layout

**Pages Fixed:**
1. `/cards/[slug]` - Card detail pages
2. `/sets/[slug]/parallels/[parallel]` - Parallel pages
3. `/posts/[slug]` - Post detail pages
4. `/releases/[slug]` - Release detail pages

---

## Future Considerations

### Layout Enhancements
- Consider lazy loading sidebar ads for performance
- Evaluate sticky header for long pages
- Implement skeleton loading for better perceived performance

### Accessibility
- Add ARIA labels to navigation
- Ensure keyboard navigation works correctly
- Test with screen readers

### Performance
- Implement image optimization strategies
- Consider static generation for popular pages
- Add loading priorities for critical resources

### November 9, 2025 - Donruss Soccer Import and Slug Generator Fix

**Changes:**
- Fixed `generateSetSlug()` function parameter order issue in import scripts
- Successfully imported all 149 sets and 8,977 cards from 2024-25 Donruss Soccer Master tab
- Reclassified "Rated Rookies" sets from Insert to Base type (Rated Rookies are special rookie base cards, not inserts)
- Created utility scripts for data cleanup and verification

**Key Fixes:**
- **Slug Generator Bug**: The `import-donruss-soccer.ts` script was calling `generateSetSlug()` with outdated parameter order
  - Old call: `generateSetSlug('Panini', 'Donruss Soccer', '2024-25', setName)`
  - Correct signature: `generateSetSlug(year, releaseName, setName, setType, parallelName?)`
  - Fixed call: `generateSetSlug('2024-25', 'Panini Donruss Soccer', setName, setType)`
  - This bug caused all sets to generate the same slug, resulting in only 2 sets being created

- **Rated Rookies Classification**: Updated `determineSetType()` to classify "Rated Rookies" as Base type
  - Rated Rookies are NOT parallels or inserts - they are a special subset of base cards featuring notable rookies
  - Updated 33 Rated Rookies sets (parent + all parallels) to type "Base"

**Import Results:**
- **35 Base Sets**: Base (2 entries), Rated Rookies + all parallels
- **84 Insert Sets**: Animation, Craftsmen, Crunch Time, Kaboom, Kit Kings, Kit Series, Magicians, Net Marvels, Night Moves, Pitch Kings, Rookie Kings, The Rookies, Zero Gravity (all with parallels)
- **24 Autograph Sets**: Beautiful Game Autographs, Beautiful Game Dual Autographs, Signature Series (all with parallels)
- **6 Memorabilia Sets**: Kit Kings, Kit Series (with parallels)
- **Total**: 149 sets, 8,977 cards

**Files Modified:**
1. `/scripts/import-donruss-soccer.ts` - Fixed `generateSetSlug()` calls (3 locations)
2. `/scripts/import-donruss-soccer.ts` - Updated `determineSetType()` to include Rated Rookies as Base
3. `/scripts/clean-donruss-data.ts` - Created cleanup script to remove incorrect data
4. `/scripts/fix-rated-rookies-type.ts` - Created script to update Rated Rookies classification
5. `/scripts/check-donruss-sets.ts` - Created verification script
6. `/scripts/debug-donruss-slugs.ts` - Created debugging script

**Problem Solved:**
- **Issue**: `generateSetSlug()` was being called with parameters in wrong order
- **Impact**: All sets generated the same slug, causing only 2 sets to be created with 8,772 cards incorrectly assigned
- **Solution**: Updated all calls to use correct parameter order: `(year, releaseName, setName, setType, parallelName?)`
- **Result**: All 149 sets now have unique slugs and correct card assignments

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Anthropic SDK Documentation](https://github.com/anthropics/anthropic-sdk-typescript)

---

*Last Updated: November 14, 2025*
