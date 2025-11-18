# How to Refactor Remaining Pages to Use PublicPageLayout

This guide provides step-by-step instructions for refactoring the remaining 6 pages to use the `PublicPageLayout` component.

## Completed Pages (Reference Examples)

These pages have been successfully refactored and can serve as examples:

1. ✅ `app/page.tsx` - Simple grid layout
2. ✅ `app/releases/page.tsx` - Simple grid layout
3. ✅ `app/posts/page.tsx` - Simple grid layout
4. ✅ `app/checklists/page.tsx` - **Filters example** (best reference for cards/sets pages)

## Remaining Pages

### 1. Cards Index Page (`app/cards/page.tsx` - 574 lines)

**Complexity:** High - Multiple filters, search, sorting, pagination

**Refactoring Steps:**

1. **Update imports:**
   ```typescript
   // Remove these:
   import Header from "@/components/Header";
   import Footer from "@/components/Footer";
   import EbayAd from "@/components/EbayAd";

   // Add this:
   import PublicPageLayout from "@/components/PublicPageLayout";
   ```

2. **Find the return statement** (around line 211)

3. **Replace the layout wrapper:**
   ```typescript
   // OLD:
   return (
     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
       <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
         <aside className="hidden lg:block w-72 flex-shrink-0">
           <EbayAd query="..." />
         </aside>
         <main className="flex-grow max-w-5xl lg:mx-auto space-y-6">
           <Header rounded={true} />
           {/* content */}
           <Footer rounded={true} />
         </main>
         <aside className="hidden lg:block w-72 flex-shrink-0">
           <EbayAd query="..." />
         </aside>
       </div>
     </div>
   );

   // NEW:
   return (
     <PublicPageLayout
       leftAdQuery="basketball player cards"
       leftAdTitle="Player Cards"
       rightAdQuery="basketball rookie cards"
       rightAdTitle="Rookie Cards"
       loading={loading}
     >
       {/* Keep ALL filter UI, search, results grid here */}
     </PublicPageLayout>
   );
   ```

4. **Keep all state management and filter logic intact**

5. **Remove the standalone Header and Footer components** - they're now in PublicPageLayout

### 2. Sets Index Page (`app/sets/page.tsx` - 519 lines)

**Complexity:** High - Multiple filters, search, grid layout

**Steps:** Same as Cards Index Page

**Ad Configuration:**
```typescript
<PublicPageLayout
  leftAdQuery="basketball card sets"
  leftAdTitle="Card Sets"
  rightAdQuery="basketball complete sets"
  rightAdTitle="Complete Sets"
  loading={loading}
>
```

### 3. Posts Detail Page (`app/posts/[slug]/page.tsx`)

**Complexity:** Medium - Breadcrumbs, markdown rendering

**Refactoring Steps:**

1. **Update imports** (same as above)

2. **Extract breadcrumbs:**
   ```typescript
   const breadcrumbs = post ? [
     { label: "Home", href: "/" },
     { label: "Posts", href: "/posts" },
     { label: post.title, href: `/posts/${post.slug}` }
   ] : undefined;
   ```

3. **Use PublicPageLayout with breadcrumbs:**
   ```typescript
   return (
     <PublicPageLayout
       leftAdQuery="soccer news"
       leftAdTitle="Soccer News"
       rightAdQuery="soccer analysis"
       rightAdTitle="Soccer Analysis"
       breadcrumbs={breadcrumbs}
       loading={loading}
     >
       {/* Post content here */}
     </PublicPageLayout>
   );
   ```

### 4. Cards Detail Page (`app/cards/[slug]/page.tsx`)

**Complexity:** Medium - Breadcrumbs, card images, details

**Ad Configuration:**
```typescript
<PublicPageLayout
  leftAdQuery="basketball cards for sale"
  leftAdTitle="Cards For Sale"
  rightAdQuery="basketball card values"
  rightAdTitle="Card Values"
  breadcrumbs={breadcrumbs}
  loading={loading}
>
```

**Breadcrumbs:**
```typescript
const breadcrumbs = card ? [
  { label: "Home", href: "/" },
  { label: "Cards", href: "/cards" },
  { label: card.playerName || "Card", href: `/cards/${card.slug}` }
] : undefined;
```

### 5. Sets Detail Page (`app/sets/[slug]/page.tsx`)

**Complexity:** High - Breadcrumbs, parallel sets, card grid

**Ad Configuration:**
```typescript
<PublicPageLayout
  leftAdQuery="basketball card checklists"
  leftAdTitle="Card Checklists"
  rightAdQuery="basketball parallel cards"
  rightAdTitle="Parallel Cards"
  breadcrumbs={breadcrumbs}
  loading={loading}
>
```

**Breadcrumbs:**
```typescript
const breadcrumbs = set ? [
  { label: "Home", href: "/" },
  { label: "Releases", href: "/releases" },
  { label: `${set.release.year} ${set.release.manufacturer.name} ${set.release.name}`,
    href: `/releases/${set.release.slug}` },
  { label: set.name, href: `/sets/${set.slug}` }
] : undefined;
```

## Common Pattern for ALL Pages

```typescript
// 1. Update imports
import PublicPageLayout from "@/components/PublicPageLayout";

// 2. (For detail pages) Extract breadcrumbs
const breadcrumbs = data ? [...] : undefined;

// 3. Wrap content in PublicPageLayout
return (
  <PublicPageLayout
    leftAdQuery="..."
    leftAdTitle="..."
    rightAdQuery="..."
    rightAdTitle="..."
    horizontalAdQuery="..." // optional
    horizontalAdTitle="..." // optional
    breadcrumbs={breadcrumbs} // optional, for detail pages
    loading={loading}
    error={error} // optional
  >
    {/* ALL page-specific content goes here */}
    {/* Filters, grids, tables, markdown, etc. */}
  </PublicPageLayout>
);
```

## Testing Checklist

After refactoring each page, verify:

- [ ] Page loads without errors
- [ ] Mobile centering is perfect
- [ ] Filters work correctly (if applicable)
- [ ] Search works correctly (if applicable)
- [ ] Pagination works correctly (if applicable)
- [ ] Breadcrumbs display correctly (if applicable)
- [ ] Loading state shows spinner
- [ ] Error state shows message
- [ ] Ads display with correct queries
- [ ] Footer appears at bottom
- [ ] TypeScript compiles without errors

## Estimated Time

- Cards index: 30-45 min (complex filters)
- Sets index: 30-45 min (complex filters)
- Posts detail: 15-20 min (breadcrumbs)
- Cards detail: 15-20 min (breadcrumbs)
- Sets detail: 20-30 min (breadcrumbs + card grid)

**Total: ~2-3 hours for all 5 pages**

## Benefits After Completion

- **~200+ lines of duplicated code eliminated**
- **Perfect mobile centering everywhere**
- **Single source of truth for all layout changes**
- **Consistent user experience across all pages**

## Notes

- All pages maintain existing functionality
- No breaking changes expected
- State management remains unchanged
- API calls remain unchanged
- Only layout wrapper changes
