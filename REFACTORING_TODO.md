# Public Page Layout Refactoring - TODO

## Completed ✅
- [x] Created `PublicPageLayout` component
- [x] Refactored homepage (`app/page.tsx`) - 21 lines removed

## In Progress 🚧

### Pages Still Needing Refactoring (9 remaining)

All of these pages duplicate the three-column layout pattern and need to be refactored to use `PublicPageLayout`:

1. **`app/releases/[slug]/page.tsx`** ⭐ PRIORITY - Has mobile centering bug
   - 690 lines - Complex page with image carousel, breadcrumbs, sets grid
   - Currently has `flex flex-col` on outer div causing centering issue

2. **`app/releases/page.tsx`**
   - Releases index page

3. **`app/posts/page.tsx`**
   - Posts index page

4. **`app/posts/[slug]/page.tsx`**
   - Post detail page

5. **`app/cards/page.tsx`**
   - Cards index page

6. **`app/cards/[slug]/page.tsx`**
   - Card detail page

7. **`app/sets/page.tsx`**
   - Sets index page

8. **`app/sets/[slug]/page.tsx`**
   - Set detail page

9. **`app/checklists/page.tsx`**
   - Checklists page

## Expected Benefits

Once all pages are refactored:
- **~200+ lines of duplicated code eliminated**
- **Single source of truth for layout**
- **Mobile centering fixed on all pages**
- **Future layout changes only need to edit one component**
- **Consistent behavior across all pages**

## Refactoring Pattern

Each page should be converted from:

```tsx
// OLD PATTERN (duplicated)
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
  <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <EbayAd ... />
    </aside>
    <main className="flex-grow max-w-5xl lg:mx-auto space-y-6">
      <Header ... />
      {/* content */}
      <Footer ... />
    </main>
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <EbayAd ... />
    </aside>
  </div>
</div>
```

To:

```tsx
// NEW PATTERN (reusable)
<PublicPageLayout
  leftAdQuery="..."
  leftAdTitle="..."
  rightAdQuery="..."
  rightAdTitle="..."
  horizontalAdQuery="..." // optional
  horizontalAdTitle="..." // optional
  breadcrumbs={[...]} // optional
  loading={loading}
>
  {/* Page-specific content only */}
</PublicPageLayout>
```

## Notes

- The release detail page is the most complex and should be tackled carefully
- All other pages follow similar patterns and can be batch-refactored
- Testing required after each refactor to ensure functionality unchanged
