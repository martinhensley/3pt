# Changelog

Complete history of changes to the 3pt.bot project.

---

## November 14, 2025 - Enhanced Set Sorting & Donruss Soccer Import

**Changes:**
- Implemented comprehensive set sorting system that groups sets with their parallels
- Enhanced `sortSetsGrouped` function to work with all set types (Base, Insert, Autograph, Memorabilia)
- Imported 2024-25 Panini Donruss Soccer: 116 sets with 8,947 cards
- Fixed Optic parallel print runs to match official specifications

**Set Sorting Enhancement:**
- Updated `parseSetName` in `/lib/setUtils.ts` to detect base names and variants for all sets
- Added comprehensive color/variant pattern detection (Red, Blue, Gold, Silver, Black, Pink, Green, Purple, Dragon Scale, Plum Blossom, Pink Ice, Pink Velocity, etc.)
- Sets now properly group by base name (e.g., all "Craftsmen" variants together, all "Beautiful Game Autographs" variants together)
- Within each group: base set first, unnumbered parallels (alphabetical), numbered parallels (highest to lowest)
- Base and Optic sets maintain special priority ordering (Base group first, then Optic group)

**Sorting Logic:**
```
Group Structure:
- Base/Optic sets appear first
- Other sets sorted alphabetically by base name
- Within each group:
  1. Base set (no variant)
  2. Parallels without print runs (alphabetical by variant)
  3. Parallels with print runs (sorted highest to lowest)
  4. Same print runs sorted alphabetically by variant
```

**Donruss Soccer Import:**
- Successfully imported all 116 sets from Excel checklist
- Base and Optic sets: 200 cards each (cards 1-175 base + 176-200 Rated Rookies)
- Insert sets: 53 sets with various parallels (Animation, Craftsmen, Kaboom, Magicians, etc.)
- Autograph sets: 24 sets (Beautiful Game Autographs, Signature Series, etc.)
- Memorabilia sets: 6 sets (Kit Kings, Kit Series)
- Fixed Optic parallel print runs: Blue /149, Dragon Scale /8, Gold Power 1/1, Pink Velocity /99, Plum Blossom (unnumbered), Red /299, Teal Mojo /49

**Optic Parallel Print Runs (Official Specifications):**
- Argyle, Holo, Ice, Plum Blossom, Velocity: Unnumbered
- Red: /299
- Blue: /149
- Pink Velocity: /99
- Teal Mojo: /49
- Pink Ice, Purple Mojo: /25
- Gold: /10
- Dragon Scale: /8
- Green: /5
- Black, Black Pandora, Gold Power: 1/1

**Files Modified:**
1. `/lib/setUtils.ts` - Enhanced `sortSetsGrouped` and `parseSetName` functions
2. `/app/releases/[slug]/page.tsx` - Applied enhanced sorting to all set types
3. `/scripts/import-donruss-soccer-2024.ts` - Main import script
4. `/scripts/fix-optic-print-runs.ts` - Script to correct Optic parallel print runs
5. `/scripts/fix-complete-donruss-import.ts` - Script to fix 200-card sets
6. `/scripts/test-sorting-all-types.ts` - Comprehensive sorting validation
7. Various utility scripts for validation and testing

**Key Learnings:**
- Pattern-based name parsing is effective for grouping sets with their parallels
- Updating both set AND card print runs ensures data consistency
- Enhanced sorting significantly improves user experience on release pages
- Grouping sets by base name makes it easy to find all variants of a set

---

## November 14, 2025 - Documentation Cleanup

**Changes:**
- Removed legacy "AI-Powered Excel Import Workflow" section (components and API routes no longer exist)
- Corrected Image model documentation to reflect actual schema (uses direct foreign keys with `type` discriminator, not junction tables)
- Removed duplicate "Recent Changes Log" section
- Updated table of contents to reflect current documentation structure

---

## November 12, 2025 - Database Schema Cleanup & Checklists Feature

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
8. `.claude/CLAUDE.md` - Documentation update

**Key Learnings:**
- Always verify authentication is using correct schema before removing tables
- Direct foreign keys with type discriminators are simpler than junction tables for this use case
- TypeScript interfaces in frontend code may reference non-existent DB models
- Database reset confirmed clean slate after removing legacy User table

---

## November 11, 2025 - Documentation Consolidation & Parallel Architecture

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

---

## October 2025 - Layout Standardization

**Changes:**
- Standardized all public pages to use three-column layout
- Fixed header resizing issues on 4 pages
- Documented standardized pattern in CLAUDE.md

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

## November 9, 2025 - Donruss Soccer Import and Slug Generator Fix

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

*Last Updated: November 17, 2025*
