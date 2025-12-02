# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Build for production (runs prisma generate first)
npm run lint             # Run ESLint
npm run init-admin       # Create admin user
npx prisma migrate dev --name <name>  # Create database migration
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Project Overview

3pt.bot is a basketball trading card database platform powered by Claude AI. Built with Next.js 15 (App Router), PostgreSQL (Neon), and the Anthropic SDK.

## Architecture

### Data Hierarchy
```
Manufacturer → Release → Set → Card
```

All releases are public. Sets have four types: Base, Autograph, Memorabilia, Insert.

### Parallel Set Architecture

All sets are standalone entities—no parent-child relationships. Parallels identified by naming convention:
- Base: `{year}-{release}-{setname}`
- Parallel: `{year}-{release}-{setname}-{variant}-parallel[-{printrun}]`

Sets sorted: non-parallels first, then unnumbered parallels, then numbered parallels (highest to lowest print run).

### Key Modules

| File | Purpose |
|------|---------|
| `lib/ai.ts` | Anthropic SDK integration (claude-sonnet-4-20250514) |
| `lib/prisma.ts` | Database client singleton |
| `lib/database.ts` | CRUD helpers and entity creation |
| `lib/setUtils.ts` | Set sorting, grouping, parallel logic |
| `lib/slugGenerator.ts` | SEO-friendly URL slug generation |
| `lib/auth.ts` | NextAuth configuration |
| `lib/ebay.ts` | eBay Partner Network API client |

### URL Slug Conventions

**Cards:**
- Base: `{year}-{release}-{set}-{cardNumber}-{player}-{printRun}`
- Base parallels (set name excluded): `{year}-{release}-{cardNumber}-{player}-{parallelName}-{printRun}`
- Insert/Auto/Mem parallels (set name included): `{year}-{release}-{setName}-{cardNumber}-{player}-{parallelName}-{printRun}`
- Exception: Optic cards KEEP "optic" in slugs

**Sets:** `{year}-{release}-{type-prefix}-{setname}[-{parallel}]` (prefixes: base, auto, mem, insert)

**Special:** Database `"1/1"` → URL `"1-of-1"` → Display `"1 of 1"`

### Three-Column Page Layout

All public pages follow this pattern—header renders immediately before loading conditional:

```tsx
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
```

Critical: No early returns—use conditional rendering. Same background gradient in all states.

## AI Integration

All AI functions in `/lib/ai.ts` using Anthropic SDK directly (not Genkit—serverless compatible). Model: `claude-sonnet-4-20250514`. Always validate AI outputs with Zod schemas.

## Data Import

Use the `/checklist-release-etl` skill for importing releases. It handles checklist analysis, record creation, and source file uploads interactively.

**Donruss Note:** Rated Rookies are cards 176-200 within Base/Optic sets, NOT separate sets.

## Branding Colors

- Primary Green: `#005031` (3pt-green)
- Primary Orange: `#F47322` (3pt-orange)

## Documentation

Detailed guides in `/docs/`:
- `DATABASE.md` - Complete schema reference
- `API.md` - REST API documentation
- `AI_INTEGRATION.md` - Anthropic SDK usage
- `FRONTEND_PATTERNS.md` - UI patterns
- `SLUG_CONVENTIONS.md` - URL formatting
- `PARALLEL_ARCHITECTURE.md` - Set relationships
- `IMPORT_GUIDE.md` - Data import workflows
