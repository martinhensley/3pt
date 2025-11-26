# 3pt.bot Development Documentation

Quick reference for development patterns and critical rules. For comprehensive guides, see [/docs/README.md](/docs/README.md).

## Table of Contents
1. [AI Integration](#ai-integration)
2. [Standardized Page Layout](#standardized-page-layout)
3. [URL Slug Conventions](#url-slug-conventions)
4. [Parallel Set Architecture](#parallel-set-architecture)
5. [Component Patterns](#component-patterns)
6. [Database Schema](#database-schema)
7. [Development Guidelines](#development-guidelines)
8. [Recent Changes](#recent-changes)

---

## AI Integration

**Uses [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) directly for serverless compatibility.**

All AI functions centralized in `/lib/ai.ts`:
- Model: `claude-sonnet-4-20250514`
- Supports PDFs and images via base64 encoding
- Always validate outputs with Zod schemas

**📚 Complete guide:** [AI Integration Guide](/docs/AI_INTEGRATION.md)

---

## Standardized Page Layout

**CRITICAL**: All public pages follow a standardized three-column layout pattern.

### Key Principles

1. **Header renders immediately** - before any loading conditional
2. **Consistent background** - same gradient in all states
3. **Sidebars always render** - left and right columns render immediately
4. **Three-column layout** - Left sidebar (288px) + Main content (max-w-5xl) + Right sidebar (288px)
5. **No early returns** - use conditional rendering instead

### Pattern

```tsx
return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <EbayAd ... />
      </aside>
      <main className="flex-grow max-w-5xl space-y-6">
        <Header rounded={true} />
        {loading ? <LoadingSpinner /> : <Content />}
      </main>
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <EbayAd ... />
      </aside>
    </div>
  </div>
);
```

**📚 Complete guide:** [Frontend Patterns Guide](/docs/FRONTEND_PATTERNS.md)

---

## URL Slug Conventions

### Card Slugs

**Base cards:**
```
{year}-{release}-{set}-{cardNumber}-{player}-{printRun}
```

**Parallel cards (set name excluded):**
```
{year}-{release}-{cardNumber}-{player}-{parallelName}-{printRun}
```

**Exception:** Optic cards KEEP "optic" in slugs.

### Set Slugs

```
{year}-{release}-{type-prefix}-{setname}[-{parallel}]
```

Type prefixes: `base`, `auto`, `mem`, `insert`

### Special Cases

- **1/1 cards**: Database `"1/1"` → URL `"1-of-1"` → Display `"1 of 1"`
- **Optic Base**: Database `"Optic Base Set"` → URL `"optic"` → Display `"Optic"`

**📚 Complete guide:** [URL Slug Conventions](/docs/SLUG_CONVENTIONS.md)

---

## Parallel Set Architecture

**Simplified independent model** - all sets are standalone entities.

### Key Principles

1. **Each set has own cards** - cards duplicated across base and parallels
2. **Parallels identified by naming** - sets with `-parallel` in slug
3. **No parent-child relationships** - simpler data model
4. **Smart ordering** - non-parallels first, then unnumbered parallels, then numbered parallels (highest to lowest)

### Naming Convention

```
Base:           {year}-{release}-{setname}
Parallel:       {year}-{release}-{setname}-{variant}-parallel[-{printrun}]
```

**📚 Complete guide:** [Parallel Architecture Guide](/docs/PARALLEL_ARCHITECTURE.md)

---

## Component Patterns

### Header Component
```tsx
<Header showBackButton={false} rounded={true} />
```

### Footer Component
```tsx
<Footer rounded={true} />
```

### EbayAd Component
```tsx
<EbayAd query="basketball cards" limit={3} title="Latest Basketball Cards" />
```

### Breadcrumb Component
```tsx
<Breadcrumb items={[
  { label: "Home", href: "/" },
  { label: "Releases", href: "/releases" }
]} />
```

---

## Database Schema

> **📊 For complete database reference, see [DATABASE.md](/docs/DATABASE.md)**

### Hierarchy

```
Manufacturer
  └── Release (year, name, slug, summary, releaseDate)
       └── Set (name, slug, type, isParallel, baseSetSlug, printRun, expectedCardCount)
            └── Card (playerName, team, cardNumber, variant, printRun, slug)
```

### Set Model (Key Fields)

```prisma
model Set {
  slug              String   @unique  // URL-friendly slug
  type              SetType           // Base, Autograph, Memorabilia, Insert
  isParallel        Boolean           // true for parallel sets
  baseSetSlug       String?           // Reference to base set slug (for parallels)
  printRun          Int?              // Standard print run for all cards in set
  expectedCardCount Int?              // Official card count from checklist
  cards             Card[]
}
```

### Print Run Fields

- **Card.printRun** - Individual card print run (e.g., 8 for "/8")
- **Set.printRun** - Standard print run for all cards in set (e.g., 99 for "/99")
- **Card.numbered** - Display string (e.g., "1 of 1", "/99")

---

## Development Guidelines

### Data Import Requirements

**Use the `checklist-release-etl` skill to import releases.**

The skill handles:
- Analyzing checklist files (PDF or Excel)
- Creating release records
- Generating sets and cards
- Uploading source files to the database

**Usage:**
```
/checklist-release-etl
```

The skill will guide you through the import process interactively.

**📚 Complete guide:** [Data Import Guide](/docs/IMPORT_GUIDE.md)

### Donruss Products

**CRITICAL:** Donruss Rated Rookies are NOT separate sets - they are cards 176-200 within Base and Optic sets.

**Strategy:**
1. Import as listed in checklist (creates split sets)
2. Run merge script to combine Rated Rookies into Base/Optic
3. Verify all Base/Optic sets have 200 cards

**📚 Complete guide:** [Donruss Product Guide](/docs/DONRUSS_GUIDE.md)

### TypeScript Best Practices

1. **Null Checks**
   - Use optional chaining: `card?.set?.release?.name`
   - Add TypeScript guards in conditionals

2. **Type Safety**
   ```typescript
   const [data, setData] = useState<DataType | null>(null);

   {data && data.property && (
     <Component data={data} />
   )}
   ```

### Component Development

1. **Use Existing Patterns** - Reference existing pages before creating new ones
2. **Loading States** - Always provide loading feedback with consistent spinner
3. **Error Handling** - Provide clear messages and navigation back to safety

### Styling Guidelines

**Colors:**
- Primary Green: `#005031` (3pt-green)
- Primary Orange: `#F47322` (3pt-orange)
- Backgrounds: `bg-gradient-to-br from-gray-50 via-white to-gray-50`

**Spacing:**
- Page padding: `px-4 pt-6 pb-12`
- Component spacing: `space-y-6`
- Gap between columns: `gap-4`

**Rounded Corners:**
- Public pages (major sections): `rounded-2xl`
- Cards/items: `rounded-lg`

### Testing Checklist

Before committing changes to page layouts:

- ✅ Header renders immediately without flash/resize
- ✅ Loading state shows spinner in content area only
- ✅ Error state shows message in content area only
- ✅ All three columns render immediately
- ✅ Same background gradient in all states
- ✅ Mobile responsive (sidebars hidden on small screens)
- ✅ TypeScript builds without errors
- ✅ No console errors in browser

---

## Recent Changes

### November 26, 2025 - Schema Simplification

**Removed Fields:**
- Release: `sourceFiles`, `description`, `isApproved`, `approvedAt`, `approvedBy`, `postDate`, `summaryDate`, `sellSheetText`
- Set: `parallels`, `parentSetId`, `hasVariableChecklist`, `mirrorsParentChecklist`, `isBaseSet`, `totalCards`
- SourceDocument: `fileSize`, `lastUsedAt`, `usageCount`

**Key Changes:**
- All releases are now public (no approval workflow)
- Independent parallel architecture (no parent-child relationships)
- Use `SourceDocument` table instead of `sourceFiles` JSON
- Use `expectedCardCount` instead of `totalCards`

### November 17, 2025 - Documentation Reorganization

- Reorganized documentation into dedicated guides in `/docs/`
- Created 7 new comprehensive documentation files
- Streamlined CLAUDE.md to ~450 lines

**📚 Full history:** [Changelog](/docs/CHANGELOG.md)

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Anthropic SDK Documentation](https://github.com/anthropics/anthropic-sdk-typescript)

---

## Documentation Hub

**📚 For comprehensive guides and detailed documentation, see [/docs/README.md](/docs/README.md)**

### Core Reference
- [Database Reference](/docs/DATABASE.md) - Complete schema documentation
- [API Reference](/docs/API.md) - REST API documentation

### Development Guides
- [AI Integration](/docs/AI_INTEGRATION.md) - Anthropic SDK usage
- [Frontend Patterns](/docs/FRONTEND_PATTERNS.md) - UI patterns and layouts
- [URL Slug Conventions](/docs/SLUG_CONVENTIONS.md) - Slug formatting rules
- [Parallel Architecture](/docs/PARALLEL_ARCHITECTURE.md) - Set relationships
- [Data Import](/docs/IMPORT_GUIDE.md) - Import workflows
- [Donruss Products](/docs/DONRUSS_GUIDE.md) - Special handling

### Project Documentation
- [Project README](../README.md) - Setup and overview
- [Changelog](/docs/CHANGELOG.md) - Complete history

---

*Last Updated: November 26, 2025*
