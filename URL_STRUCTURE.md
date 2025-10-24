# footy.bot URL Structure

## Overview

This document outlines the complete URL structure for the footy.bot trading card database.

---

## URL Patterns

### 1. Release Pages
**Pattern:** `/release/[slug]`

**Format:** `year-manufacturer-release-name`

**Examples:**
- `/release/2024-25-panini-donruss-soccer`
- `/release/2023-24-topps-chrome-uefa`

**Content:**
- Release overview
- List of all sets in the release
- Release-specific eBay ads

---

### 2. Set Pages
**Pattern:** `/set/[slug]`

**Format:** `year-release-name-set-name`

**Examples:**
- `/set/2024-25-donruss-soccer-base-set`
- `/set/2024-25-donruss-soccer-rated-rookies`
- `/set/2023-24-topps-chrome-uefa-base-set`

**Content:**
- Set overview with total cards and parallel count
- List of parallels/variations (clickable to parallel pages)
- Complete card checklist (clickable to individual card pages)
- Set-specific eBay ads

---

### 3. Parallel/Variation Pages
**Pattern:** `/parallel/[slug]`

**Format:** `year-release-name-set-name-parallel-name`

**Examples:**
- `/parallel/2024-25-donruss-soccer-base-set-cubic`
- `/parallel/2024-25-donruss-soccer-base-set-gold-prizm`
- `/parallel/2023-24-topps-chrome-uefa-base-set-purple-refractor`

**Purpose:**
- Show all cards that exist in a specific parallel/variation
- Allow collectors to see visual examples of what distinguishes this parallel
- Useful when specific serial numbers (like 1/1) haven't been found
- Compare parallel characteristics across different players

**Content:**
- Parallel overview with card count
- Grid of all cards in this parallel
- Card images when available (front/back)
- Links to individual card detail pages
- Parallel-specific eBay ads

---

### 4. Individual Card Pages
**Pattern:** `/card/[slug]`

**Format:** `year-set-name-card-number-player-name-parallel-name`

**Examples:**

**Base Cards:**
- `/card/2024-25-base-set-card-1-matt-turner`
- `/card/2024-25-base-set-card-15-lionel-messi`

**Parallel Cards:**
- `/card/2024-25-base-set-card-1-matt-turner-gold-prizm`
- `/card/2024-25-base-set-card-15-lionel-messi-cubic`
- `/card/2024-25-base-set-card-20-erling-haaland-purple-pulsar`

**Note:**
- Parallel name is only included if it's NOT "base"
- Player names and special characters are sanitized (lowercase, hyphens only)

**Content:**
- Full card details (player, team, number, etc.)
- Front and back images
- Additional gallery images
- Special features (autograph, memorabilia, numbered)
- Serial number and print run
- Parallel/variation information
- Card-specific eBay ads

---

## URL Hierarchy

```
Release
  └─ Sets
      ├─ Parallels/Variations
      │   └─ Individual Cards
      └─ Individual Cards (from checklist)
```

**Navigation Flow:**

1. **Release Page** → Click a Set → **Set Page**
2. **Set Page** → Click a Parallel → **Parallel Page**
3. **Parallel Page** → Click a Card → **Individual Card Page**
4. **Set Page** → Click a Card in Checklist → **Individual Card Page**

---

## Slug Generation Rules

### General Rules:
1. All lowercase
2. Spaces replaced with hyphens (-)
3. Special characters removed (only a-z, 0-9, and hyphens allowed)
4. Multiple hyphens collapsed to single hyphen

### Year Formats:
- Single year: `2024`
- Range: `2024-25` (not `2024-2025`)

### Component Sanitization:

**Before:**
```
"2024-25 Panini Donruss Soccer"
"Base Set"
"Gold Prizm #/10"
"Lionel Messi"
```

**After:**
```
"2024-25"
"panini-donruss-soccer"
"base-set"
"gold-prizm"
"lionel-messi"
```

---

## Slug Parsing

### Parallel Page Parsing

**Input:** `/parallel/2024-25-donruss-soccer-base-set-cubic`

**Parsing Steps:**
1. Extract year: `2024-25`
2. Extract parallel (last 1-3 parts): `cubic`
3. Remaining parts are release/set context: `donruss soccer base set`

**Filtering Logic:**
```typescript
// Match cards where:
1. parallelType or variant contains "cubic"
2. AND release year contains "2024-25" (if year found)
3. AND release/set name contains "donruss soccer base set" (if context found)
```

### Card Page Parsing

**Input:** `/card/2024-25-base-set-card-15-lionel-messi-gold-prizm`

**Parsing Steps:**
1. Extract year: `2024-25`
2. Extract set name: `base-set`
3. Extract card number: `15` (follows "card-" prefix)
4. Extract player name: `lionel-messi`
5. Extract parallel: `gold-prizm` (if present and not "base")

**Matching Logic:**
```typescript
// Generate slug from database card and compare:
const generatedSlug = [
  card.set.release.year,        // "2024-25"
  card.set.name,                 // "base-set"
  `card-${card.cardNumber}`,     // "card-15"
  card.playerName,               // "lionel-messi"
  card.parallelType !== 'base' ? card.parallelType : null  // "gold-prizm"
]
  .filter(Boolean)
  .join('-')
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '');

// Compare generatedSlug === requestedSlug
```

---

## SEO Benefits

### Descriptive URLs
- Search engines can understand page content from URL alone
- Users can understand what the page is about before clicking
- Better link sharing on social media

### Keyword-Rich
- Year, manufacturer, release name, set name all in URL
- Player names and parallel types included
- Helps with long-tail search queries

### Examples:

**Good URL:**
```
/card/2024-25-base-set-card-15-lionel-messi-gold-prizm
```
- Contains: year, set, card number, player name, parallel
- Clearly describes the content
- Search-friendly

**Bad URL (what we're NOT doing):**
```
/card/cmh44nhrl00008owvp0gnogp7
```
- Database ID is meaningless to users and search engines
- No content description
- Not shareable

---

## Routing Priority

Next.js evaluates routes in this order:

1. Static routes (if any exist)
2. Dynamic routes with more specific patterns
3. Catch-all routes

**Current Route Structure:**
```
/release/[slug]    - Release pages
/set/[slug]        - Set pages
/parallel/[slug]   - Parallel pages
/card/[slug]       - Individual card pages
```

**No Conflicts:**
- Each route has a different prefix
- Slug parameters are named consistently
- No overlapping patterns

---

## Fallback Behavior

### 404 Handling

**When slug doesn't match any card:**
- Show "Card Not Found" page
- Suggest going back to home or release page
- Display search option (future feature)

**When parallel has no cards:**
- Show "No Cards Found" message
- Explain that cards haven't been added yet
- Link back to set page
- Note: This will be resolved once bulk scan feature is implemented

---

## Future Enhancements

### Potential URL Additions:

1. **Player Pages**
   - `/player/lionel-messi`
   - Show all cards of a specific player across all sets

2. **Team Pages**
   - `/team/inter-miami-cf`
   - Show all cards from a specific team

3. **Manufacturer Pages**
   - `/manufacturer/panini`
   - `/manufacturer/topps`
   - Show all releases from a manufacturer

4. **Year/Season Pages**
   - `/year/2024-25`
   - Show all releases from a specific year

5. **Search Results**
   - `/search?q=messi+gold+prizm`
   - Full-text search across all cards

---

## URL Length Considerations

### Maximum Lengths:

**Typical URLs:**
- Release: ~40-60 characters
- Set: ~60-80 characters
- Parallel: ~80-100 characters
- Individual Card: ~100-140 characters

**Edge Cases:**

Long player names:
```
/card/2024-25-base-set-card-123-cristiano-ronaldo-dos-santos-aveiro-gold-prizm
```
(~90 characters - still acceptable)

Long parallel names:
```
/parallel/2024-25-donruss-soccer-base-set-purple-pulsar-prizm-refractor
```
(~80 characters - acceptable)

**Browser Limits:**
- Chrome: ~2000 characters
- Firefox: ~65,000 characters
- IE: ~2048 characters

**Our URLs:** Well within all browser limits (< 150 characters max)

---

## Canonical URLs

For SEO, we should implement canonical URLs to handle:

1. **Case variations** - Redirect uppercase to lowercase
2. **Trailing slashes** - Consistent handling
3. **Special characters** - Sanitize in URL bar

**Example:**
```
/card/2024-25-Base-Set-Card-15-Lionel-Messi/
  ↓ Redirect to ↓
/card/2024-25-base-set-card-15-lionel-messi
```

---

## Summary

### Current URL Structure:

| Type | Pattern | Example |
|------|---------|---------|
| Release | `/release/{year-manufacturer-release}` | `/release/2024-25-panini-donruss-soccer` |
| Set | `/set/{year-release-set}` | `/set/2024-25-donruss-soccer-base-set` |
| Parallel | `/parallel/{year-release-set-parallel}` | `/parallel/2024-25-donruss-soccer-base-set-cubic` |
| Card | `/card/{year-set-card#-player-parallel}` | `/card/2024-25-base-set-card-15-lionel-messi-gold-prizm` |

### Benefits:

✅ **SEO-friendly** - Descriptive, keyword-rich URLs
✅ **User-friendly** - Readable and shareable
✅ **Hierarchical** - Clear content structure
✅ **Consistent** - Predictable patterns
✅ **Future-proof** - Extensible for new features
✅ **No conflicts** - Clear route separation

### Next Steps:

1. **Populate cards** - Use bulk scan feature to add cards with images
2. **Test URLs** - Verify all URL patterns work correctly
3. **Add redirects** - Handle old URLs or variations
4. **Monitor SEO** - Track URL performance in search results
