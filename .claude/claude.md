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

### Genkit Framework Mandate

**CRITICAL: All AI operations MUST use the Genkit framework.**

This project uses [Firebase Genkit](https://github.com/firebase/genkit) as the unified AI orchestration layer. Direct SDK calls to AI providers (Anthropic, Google AI, etc.) are **strictly prohibited**.

#### Why Genkit?

1. **Unified Interface**: Single API for multiple AI providers
2. **Type Safety**: Zod schema validation for all AI inputs/outputs
3. **Flow Management**: Structured prompts and reusable AI workflows
4. **Observability**: Built-in tracing and debugging via Genkit Dev UI
5. **Version Control**: AI prompts are code, not scattered strings
6. **Testing**: Flows can be tested in isolation

#### Configuration

All AI providers are configured in `/lib/genkit.ts`:

```typescript
export const ai = genkit({
  plugins: [
    anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  ],
});
```

#### Creating AI Flows

Define reusable AI workflows using `ai.defineFlow()`:

```typescript
export const analyzeReleaseFlow = ai.defineFlow(
  {
    name: 'analyzeRelease',
    inputSchema: z.object({
      documentText: z.string(),
    }),
    outputSchema: ReleaseInfoSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      model: claude35Sonnet,
      output: { schema: ReleaseInfoSchema },
      prompt: `Your prompt here...`,
    });
    return text;
  }
);
```

#### Using AI Flows

Call flows from API routes or server components:

```typescript
import { analyzeReleaseFlow } from '@/lib/genkit';

const result = await analyzeReleaseFlow({
  documentText: extractedText,
});
```

#### Prohibited Patterns

**DO NOT** call AI provider SDKs directly:

```typescript
// ❌ WRONG - Direct Anthropic SDK usage
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: '...' });
const response = await anthropic.messages.create({...});

// ❌ WRONG - Direct Google AI SDK usage
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(apiKey);
const response = await model.generateContent({...});

// ✅ CORRECT - Use Genkit flow
import { analyzeReleaseFlow } from '@/lib/genkit';
const result = await analyzeReleaseFlow({...});
```

#### Development Tools

Run the Genkit Dev UI to inspect and test flows:

```bash
npm run genkit
```

This starts a web interface at http://localhost:4000 where you can:
- View all defined flows
- Test flows with sample inputs
- Inspect AI responses and traces
- Debug prompt performance

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
Format: `{year}-{release}-{set}-{cardNumber}-{player}-{parallel}`

Example: `2024-25-donruss-soccer-optic-1-matt-turner-gold-power-1-of-1`

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

### Set Slugs
Format: `{year}-{release}-{setName}`

Example: `2024-25-donruss-soccer-optic`

### Release Slugs
Format: `{year}-{manufacturer}-{release}`

Example: `2024-25-panini-donruss-soccer`

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

### Hierarchy
```
Manufacturer
  └── Release (year, name, slug)
       └── Set (name, totalCards, parallels[], isBaseSet)
            └── Card (playerName, team, cardNumber, variant, parallelType, slug)
```

### Key Models

#### Card
```prisma
model Card {
  id              String   @id @default(cuid())
  slug            String   @unique
  playerName      String?
  team            String?
  cardNumber      String?
  variant         String?   // Base, Rookie, etc.
  parallelType    String?   // Prizm, Optic, Gold, etc.
  serialNumber    String?
  isNumbered      Boolean  @default(false)
  printRun        Int?
  hasAutograph    Boolean  @default(false)
  hasMemorabilia  Boolean  @default(false)
  rarity          String?
  finish          String?
  colorVariant    String?
  specialFeatures String[]
  imageFront      String?
  imageBack       String?
  setId           String
  set             Set      @relation(fields: [setId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### Set
```prisma
model Set {
  id          String   @id @default(cuid())
  name        String
  description String?
  totalCards  String?
  isBaseSet   Boolean  @default(false)
  parallels   String[] // Array of parallel names
  releaseId   String
  release     Release  @relation(fields: [releaseId], references: [id])
  cards       Card[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

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

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

*Last Updated: October 29, 2025*
