# Frontend Patterns Guide

Complete guide for implementing standardized UI patterns in the Footy.bot application.

## Table of Contents
- [Standardized Page Layout](#standardized-page-layout)
- [Component Development](#component-development)
- [Styling Guidelines](#styling-guidelines)
- [Testing Checklist](#testing-checklist)

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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-3pt-green"></div>
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h1>
                <p className="text-gray-600 mb-8">The content you're looking for doesn't exist.</p>
                <Link href="/" className="text-3pt-green hover:underline">
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

#### 1. Header Renders Immediately

The header component **MUST** render before any loading conditional.

**Why**: This prevents visual layout shift when transitioning from loading to content state.

**Important**: Header is placed inside `<main>` tag, NOT in a separate wrapper.

```tsx
// ✅ CORRECT
<main className="flex-grow max-w-5xl space-y-6">
  <Header rounded={true} />
  {loading ? <LoadingSpinner /> : <Content />}
</main>

// ❌ WRONG
<main className="flex-grow max-w-5xl space-y-6">
  {loading ? (
    <>
      <Header rounded={true} />
      <LoadingSpinner />
    </>
  ) : (
    <>
      <Header rounded={true} />
      <Content />
    </>
  )}
</main>
```

#### 2. Consistent Background

All states (loading, error, content) use the same background gradient.

```tsx
className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50"
```

This ensures visual consistency across all page states.

#### 3. Sidebars Always Render

Left and right sidebars render immediately, regardless of content state.

- Hidden on mobile/tablet with `hidden lg:block`
- Maintain consistent width: `w-72` (288px)
- Use `flex-shrink-0` to prevent compression

```tsx
<aside className="hidden lg:block w-72 flex-shrink-0">
  <EbayAd query="keywords" limit={3} title="Ad Title" />
</aside>
```

#### 4. Three-Column Layout

The layout uses a three-column structure:

| Column | Width | Max Width | Class |
|--------|-------|-----------|-------|
| Left Sidebar | 288px | - | `w-72` |
| Main Content | Flexible | 1024px | `max-w-5xl` |
| Right Sidebar | 288px | - | `w-72` |
| **Total Container** | - | **1600px** | `max-w-[1600px]` |

```tsx
<div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
  {/* ... columns ... */}
</div>
```

#### 5. No Early Returns

**NEVER** use early returns for loading/error states.

```tsx
// ❌ BAD: Early return with different layout
if (loading) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div>Loading...</div>
    </div>
  );
}

// ✅ GOOD: Single return with conditional content
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

### Pages Following This Pattern

All pages standardized as of October 2025:

- ✅ `/` - Homepage
- ✅ `/releases` - Release index
- ✅ `/releases/[slug]` - Release detail pages
- ✅ `/posts` - Post index
- ✅ `/posts/[slug]` - Post detail pages
- ✅ `/sets/[slug]` - Set detail pages
- ✅ `/sets/[slug]/parallels/[parallel]` - Parallel pages
- ✅ `/cards/[slug]` - Card detail pages

### Common Mistakes to Avoid

#### Mistake 1: Early Returns

```tsx
// ❌ DON'T DO THIS
if (loading) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <LoadingSpinner />
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
      <aside>...</aside>
      <main>
        <Header />
        <Content />
      </main>
      <aside>...</aside>
    </div>
  </div>
);
```

**Problem**: Different layouts for loading vs. loaded states cause layout shift.

#### Mistake 2: Header in Separate Wrapper

```tsx
// ❌ DON'T DO THIS
<div className="w-full px-4 pt-6">
  <div className="max-w-5xl mx-auto lg:ml-[304px]">
    <Header />
  </div>
</div>

<div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4">
  <aside>...</aside>
  <main>
    {loading ? <LoadingSpinner /> : <Content />}
  </main>
  <aside>...</aside>
</div>
```

**Problem**: Header outside main content area causes misalignment and complexity.

#### Mistake 3: Conditional Header Rendering

```tsx
// ❌ DON'T DO THIS
<main>
  {loading ? (
    <>
      <Header rounded={true} />
      <LoadingSpinner />
    </>
  ) : (
    <>
      <Header rounded={true} />
      <Content />
    </>
  )}
</main>
```

**Problem**: Header re-renders between states, causing flash/resize.

---

## Component Development

### 1. Use Existing Patterns

**Before creating new components:**

- Review existing pages in `/app` directory
- Check `/components` directory for reusable components
- Maintain consistent styling with Tailwind
- Follow the standardized layout structure

**Example**: Creating a new detail page

```tsx
// Reference: /app/releases/[slug]/page.tsx
// Pattern: Three-column layout with immediate header render

export default function NewDetailPage({ params }: { params: { slug: string } }) {
  // Use existing pattern
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    // ... fetch logic
  }, [params.slug]);

  // Single return with conditional content
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* ... standard three-column layout ... */}
    </div>
  );
}
```

### 2. Loading States

Always provide loading feedback to users.

**Use consistent spinner design:**

```tsx
<div className="flex items-center justify-center py-20">
  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-3pt-green"></div>
</div>
```

**Show loading state in place of content:**

```tsx
{loading ? (
  <div className="flex items-center justify-center py-20">
    <LoadingSpinner />
  </div>
) : (
  <ContentComponent data={data} />
)}
```

**Don't replace entire page layout:**

```tsx
// ❌ BAD
if (loading) return <FullPageSpinner />;

// ✅ GOOD
return (
  <PageLayout>
    <Header />
    {loading ? <Spinner /> : <Content />}
  </PageLayout>
);
```

### 3. Error Handling

Provide clear, actionable error messages.

**Error state pattern:**

```tsx
{!data ? (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Not Found
      </h1>
      <p className="text-gray-600 mb-8">
        The content you're looking for doesn't exist.
      </p>
      <Link href="/" className="text-3pt-green hover:underline">
        ← Back to Home
      </Link>
    </div>
  </div>
) : (
  <Content data={data} />
)}
```

**Log errors to console:**

```tsx
useEffect(() => {
  async function fetchData() {
    try {
      const response = await fetch(`/api/data/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [slug]);
```

---

## Styling Guidelines

### Color Palette

```tsx
// Primary Colors
const colors = {
  footyGreen: '#005031',   // Primary brand color
  footyOrange: '#F47322',  // Secondary brand color

  // Backgrounds
  bgGradient: 'from-gray-50 via-white to-gray-50',

  // Text
  textPrimary: 'gray-900',
  textSecondary: 'gray-600',
  textMuted: 'gray-400',
};
```

**Usage:**

```tsx
// Text colors
className="text-3pt-green"
className="text-3pt-orange"
className="text-gray-900"

// Background gradient
className="bg-gradient-to-br from-gray-50 via-white to-gray-50"

// Border colors
className="border-3pt-green"
className="border-b-2 border-3pt-green" // Spinner
```

### Spacing

Consistent spacing creates visual harmony.

```tsx
// Page padding
className="px-4 pt-6 pb-12"

// Component spacing (vertical)
className="space-y-6"

// Gap between columns
className="gap-4"

// Section padding
className="p-6"
className="py-8 px-6"
```

### Rounded Corners

```tsx
// Public pages - major sections
className="rounded-2xl"

// Cards and items
className="rounded-lg"

// Buttons
className="rounded-md"

// Small elements
className="rounded"
```

### Responsive Design

Use Tailwind's responsive prefixes:

```tsx
// Hide on mobile, show on desktop
className="hidden lg:block"

// Full width on mobile, fixed on desktop
className="w-full lg:w-72"

// Stack on mobile, row on desktop
className="flex flex-col lg:flex-row"

// Responsive padding
className="p-4 lg:p-6"

// Responsive text
className="text-xl lg:text-2xl"
```

---

## Testing Checklist

Before committing changes to page layouts, verify:

### Visual Testing

- ✅ **Header renders immediately** without flash/resize
- ✅ **Loading state** shows spinner in content area only
- ✅ **Error state** shows message in content area only
- ✅ **All three columns** (sidebars + main) render immediately
- ✅ **Same background gradient** in all states (loading, error, content)
- ✅ **Breadcrumbs** display correctly
- ✅ **Footer** appears at bottom of content

### Responsive Testing

- ✅ **Mobile responsive** - sidebars hidden on small screens (`< 1024px`)
- ✅ **Tablet responsive** - content adjusts appropriately
- ✅ **Desktop layout** - all three columns visible
- ✅ **No horizontal scroll** on any breakpoint
- ✅ **Touch targets** are appropriately sized (minimum 44x44px)

### Technical Testing

- ✅ **TypeScript builds** without errors: `npm run build`
- ✅ **No console errors** in browser
- ✅ **No console warnings** in browser
- ✅ **Network requests** complete successfully
- ✅ **Loading states** transition smoothly
- ✅ **Error states** display when appropriate

### Accessibility Testing

- ✅ **Keyboard navigation** works correctly
- ✅ **Focus indicators** are visible
- ✅ **Screen reader** compatibility (test with VoiceOver/NVDA)
- ✅ **Color contrast** meets WCAG AA standards
- ✅ **Alt text** on all images

### Performance Testing

- ✅ **Page loads** in < 3 seconds on 3G
- ✅ **No layout shift** (CLS score < 0.1)
- ✅ **Images optimized** (using Next.js Image component)
- ✅ **No unnecessary re-renders**

---

## Related Documentation

- [Component Patterns](/docs/CLAUDE.md#component-patterns) - Reusable component reference
- [Styling Guidelines](/docs/CLAUDE.md#styling-guidelines) - Detailed style guide
- [Database Schema](/docs/DATABASE.md) - Data models for components

---

*Last Updated: November 17, 2025*
