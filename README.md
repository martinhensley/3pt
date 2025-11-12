# footy.bot

A football (soccer) trading card management assistant with human-curated card sets and sales data.

## Roadmap / TODO

### Future Features
- **Sales Data Collection**: Aggregate and track historical sales data from major marketplaces (eBay, PWCC, Goldin, etc.) to provide market insights and pricing trends
- **Comps (Comparable Valuations)**: Feature-as-a-service component providing third-party valuation services with comparable sales data, market analysis, and automated valuation models for grading companies and auction houses
- **SEO Strategy & Optimization**: Once development slows and the app is ready for content production, focus on:
  - Keyword research and targeting (primary: soccer card database, football trading cards; secondary: panini soccer cards, topps soccer cards)
  - Content optimization for target keywords
  - Link building and backlink strategy
  - Performance optimization (Core Web Vitals)
  - Advanced schema.org markup for rich snippets
  - Content calendar for regular releases and guides

## Security Notes

**Production Security Checklist:**
- Change default admin credentials immediately
- Use strong, unique secrets for `NEXTAUTH_SECRET`
- Keep all API keys secure and never commit `.env` files
- Implement rate limiting for public APIs
- Validate and sanitize all user inputs
- Enable HTTPS only in production
- Regularly update dependencies for security patches
- Monitor for suspicious activity and unauthorized access

## Features

- **Hand-Crafted Data Curation**: AI-assisted data organization for checklists, sales, and grading information at global scale
- **Hierarchical Data Model**: Manufacturers → Releases → Sets → Cards
- **Content Publishing**: Create and manage blog posts about releases, sets, cards, and industry news
- **SEO Optimized**: Dynamic metadata, sitemap, structured data, and Open Graph tags
- **Responsive Design**: Mobile-friendly interface with footy.bot branding (Green #005031 & Orange #F47322)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Orchestration**: Firebase Genkit (all AI operations use Genkit framework)
- **AI Models**: Anthropic Claude 3.5 Sonnet (via Genkit)
- **Image Processing**: Sharp
- **Document Parsing**: pdfjs-dist, csv-parse

## Branding and Color Scheme

- Footy Green: #005031
- Footy Orange: #F47322
- White: #FFFFFF

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database (Neon recommended)

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables (see Environment Variables section below)
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Admin Access

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)

Login credentials are configured in your environment variables.

### Database Migrations

When updating the schema:

```bash
npx prisma migrate dev --name migration_name
npx prisma generate
```

### Production Deployment (Vercel)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Update `NEXTAUTH_URL` to production domain
4. Vercel will automatically deploy on push to main branch

**Production Checklist:**
- Use PostgreSQL database (Neon recommended)
- Ensure all API keys are securely configured
- Update domain references to production URL
- Change default admin credentials
- Use strong secrets for NEXTAUTH_SECRET

## Project Structure

```
footy/
├── .claude/
│   ├── CLAUDE.md           # Development documentation & patterns
│   └── skills/             # Claude Code skills directory
├── app/
│   ├── admin/              # Admin portal
│   │   ├── activity/       # Activity history
│   │   ├── bulk-scan/      # Bulk card scanning
│   │   ├── cards/          # Card management
│   │   ├── library/        # Source document library
│   │   │   ├── card-images/     # Card image uploads
│   │   │   ├── checklists/      # Checklist documents
│   │   │   └── source-documents/ # Source file management
│   │   ├── posts/          # Post management
│   │   └── releases/       # Release management
│   ├── api/                # API routes
│   │   ├── analyze/        # AI analysis endpoints
│   │   ├── auth/           # NextAuth
│   │   ├── cards/          # Card API
│   │   ├── ebay/           # eBay API integration
│   │   ├── library/        # Library endpoints
│   │   ├── pdf-to-images/  # PDF conversion
│   │   ├── posts/          # Post CRUD
│   │   ├── releases/       # Release API
│   │   ├── sets/           # Set API
│   │   └── upload/         # File upload
│   ├── cards/[slug]/       # Card detail pages
│   ├── posts/[slug]/       # Post pages
│   ├── releases/           # Release listing
│   │   └── [slug]/         # Release detail pages
│   ├── sets/[slug]/        # Set pages
│   │   └── parallels/[parallel]/ # Parallel/variation pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Homepage
│   ├── sitemap.ts          # Dynamic sitemap
│   └── robots.ts           # Robots.txt
├── components/
│   ├── Breadcrumb.tsx      # Navigation breadcrumbs
│   ├── EbayAd.tsx          # eBay affiliate ads
│   ├── EntitySelectors.tsx # Release/Set dropdowns
│   ├── ExcelImport.tsx     # Excel checklist importer
│   ├── Footer.tsx          # Site footer
│   ├── Header.tsx          # Site header (standardized)
│   └── MultiFileUpload.tsx # Multi-file upload component
├── lib/
│   ├── ai.ts               # Claude AI integration (legacy)
│   ├── auth.ts             # NextAuth config
│   ├── checklistParser.ts  # Excel checklist parser
│   ├── database.ts         # Database helpers
│   ├── documentParser.ts   # PDF/CSV parsing
│   ├── ebay.ts             # eBay API client
│   ├── enhancedCardAnalysis.ts # AI card analysis
│   ├── extractKeywords.ts  # Keyword extraction
│   ├── formatters.ts       # Display formatting utilities
│   ├── genkit.ts           # Firebase Genkit AI flows
│   ├── neon-auth.ts        # Neon database auth
│   ├── prisma.ts           # Database client
│   └── slugGenerator.ts    # URL slug generation
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/                # Data import/migration scripts
└── public/
    └── uploads/            # Uploaded files
```

## Standardized Page Layout

All public-facing pages follow a **standardized three-column layout** to ensure consistent user experience:

```tsx
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
  <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
    {/* Left Sidebar - eBay Ads */}
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <EbayAd query="primary-keywords" limit={3} title="Ad Title" />
    </aside>

    {/* Main Content */}
    <main className="flex-grow max-w-5xl space-y-6">
      <Header rounded={true} /> {/* Always renders first */}

      {loading ? (
        <LoadingSpinner />
      ) : !data ? (
        <ErrorMessage />
      ) : (
        <>
          <Breadcrumb items={[...]} />
          {/* Content */}
          <Footer rounded={true} />
        </>
      )}
    </main>

    {/* Right Sidebar - eBay Ads */}
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <EbayAd query="secondary-keywords" limit={3} title="Ad Title" />
    </aside>
  </div>
</div>
```

**Key Principles:**
1. Header renders **immediately** before loading conditional (prevents resize)
2. All three columns render **immediately** (sidebars + main)
3. Same background gradient in **all states** (loading, error, content)
4. No early returns - use conditional rendering instead
5. Footer wraps inside content conditional, not outside

**Pages Following This Pattern:**
- `/` - Homepage
- `/releases` - Release index
- `/releases/[slug]` - Release detail pages
- `/posts` - Post index
- `/posts/[slug]` - Post detail pages
- `/sets/[slug]` - Set detail pages
- `/sets/[slug]/parallels/[parallel]` - Parallel pages
- `/cards/[slug]` - Card detail pages

**See `.claude/CLAUDE.md` for detailed documentation.**

## Database Schema

### Complete Entity-Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CORE HIERARCHY                                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Manufacturer   │
│─────────────────│
│ id              │◄────┐
│ name            │     │
│ createdAt       │     │
│ updatedAt       │     │
└─────────────────┘     │
                        │ 1:N
                   ┌────┴──────────────────┐
                   │     Release           │
                   │───────────────────────│
                   │ id                    │◄────┐
                   │ name                  │     │
                   │ year                  │     │
                   │ slug                  │     │
                   │ description           │     │
                   │ releaseDate           │     │
                   │ isApproved            │     │ Approval workflow
                   │ approvedAt            │     │ for public visibility
                   │ approvedBy            │     │
                   │ sellSheetText         │     │
                   │ sourceFiles (JSON)    │     │
                   │ manufacturerId        │     │
                   │ createdAt             │     │
                   │ updatedAt             │     │
                   └───────────────────────┘     │ 1:N
                                            ┌────┴──────────────────────┐
                                            │       Set                 │
                                            │───────────────────────────│
                                            │ id                        │◄────┐
                                            │ name                      │  │  │
                                            │ slug                      │  │  │
                                            │ type (SetType ENUM)       │──┼──┼── Base, Insert,
                                            │ isBaseSet (deprecated)    │  │  │   Autograph, Memorabilia
                                            │ releaseId                 │  │  │
                                            │ totalCards                │  │  │
                                            │ printRun                  │  │  │
                                            │ description               │  │  │
                                            │ sourceText                │  │  │
                                            │ parallels (JSON, dep.)    │  │  │
                                            │ parentSetId               │──┘  │ Parent-child
                                            │ hasVariableChecklist      │     │ parallel relationship
                                            │ mirrorsParentChecklist    │     │
                                            │ createdAt                 │     │
                                            │ updatedAt                 │     │
                                            └───────────────────────────┘     │ 1:N
                                                             ┌────┴──────────────────┐
                                                             │       Card            │
                                                             │───────────────────────│
                                                             │ id                    │
                                                             │ slug                  │
                                                             │ playerName            │
                                                             │ team                  │
                                                             │ cardNumber            │
                                                             │ variant               │
                                                             │ parallelType          │
                                                             │ serialNumber          │
                                                             │ isNumbered            │
                                                             │ printRun              │
                                                             │ numbered              │
                                                             │ rarity                │
                                                             │ finish                │
                                                             │ hasAutograph          │
                                                             │ hasMemorabilia        │
                                                             │ specialFeatures       │
                                                             │ colorVariant          │
                                                             │ detectionConfidence   │
                                                             │ detectionMethods      │
                                                             │ detectedText          │
                                                             │ imageFront            │
                                                             │ imageBack             │
                                                             │ footyNotes            │
                                                             │ setId                 │
                                                             │ createdAt             │
                                                             │ updatedAt             │
                                                             └───────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT & MEDIA                                       │
└──────────────────────────────────────────────────────────────────────────────┘

                          ┌───────────────────────┐
                          │        Post           │
                          │───────────────────────│
                          │ id                    │
                          │ title                 │
                          │ slug                  │
                          │ content               │
                          │ excerpt               │
                          │ type                  │──────┐ PostType ENUM:
                          │ published             │      │ - NEWS
                          │ releaseId  (optional) │──┐   │ - REVIEW
                          │ setId      (optional) │──┼───│ - GUIDE
                          │ cardId     (optional) │──┼───│ - ANALYSIS
                          │ authorId              │  │   │ - GENERAL
                          │ createdAt             │  │   └────────────
                          │ updatedAt             │  │
                          └───────────────────────┘  │
                                   │                 │ Optional References:
                                   │ 1:N             │ Post can reference
                                   ▼                 │ Release, Set, or Card
                          ┌───────────────────────┐  │
                          │       Image           │◄─┼──┐
                          │───────────────────────│  │  │
                          │ id                    │  │  │
                          │ url                   │  │  │
                          │ caption               │  │  │ Images can belong to:
                          │ order                 │  │  │ - Release
                          │ releaseId  (optional) │──┘  │ - Set
                          │ setId      (optional) │─────┘ - Card
                          │ cardId     (optional) │─────┐ - Post
                          │ postId     (optional) │──┐  │
                          │ createdAt             │  │  │
                          └───────────────────────┘  │  │
                                                     ▼  ▼

┌──────────────────────────────────────────────────────────────────────────────┐
│                      SOURCE DOCUMENT MANAGEMENT                               │
└──────────────────────────────────────────────────────────────────────────────┘

                     ┌──────────────────────────────┐
                     │      SourceDocument          │
                     │──────────────────────────────│
                     │ id                           │
                     │ filename                     │
                     │ displayName                  │
                     │ blobUrl                      │
                     │ mimeType                     │
                     │ fileSize                     │
                     │ documentType                 │──────┐ DocumentType ENUM:
                     │ tags          (String[])     │      │ - SELL_SHEET
                     │ extractedText                │      │ - CHECKLIST
                     │ uploadedById                 │      │ - PRESS_RELEASE
                     │ uploadedAt                   │      │ - PRICE_GUIDE
                     │ lastUsedAt                   │      │ - IMAGE
                     │ usageCount                   │      │ - OTHER
                     │ description                  │      └────────────
                     │ createdAt                    │
                     │ updatedAt                    │
                     └──────────────────────────────┘
                              │           │
                              │ N:N       │ N:N
                              ▼           ▼
           ┌──────────────────────────┐  ┌──────────────────────────┐
           │ ReleaseSourceDocument    │  │  PostSourceDocument      │
           │──────────────────────────│  │──────────────────────────│
           │ id                       │  │ id                       │
           │ releaseId                │  │ postId                   │
           │ documentId               │  │ documentId               │
           │ usageContext             │  │ usageContext             │
           │ linkedAt                 │  │ linkedAt                 │
           │ linkedById               │  │ linkedById               │
           └──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION                                        │
└──────────────────────────────────────────────────────────────────────────────┘

                          ┌───────────────────────┐
                          │        User           │
                          │───────────────────────│
                          │ id                    │
                          │ username              │  Note: Authentication is
                          │ password              │  handled by neon_auth
                          │ createdAt             │  .admin_users table.
                          │ updatedAt             │  This model kept for
                          └───────────────────────┘  future use.
```

### Key Relationships

**Hierarchical Data Flow:**
- Manufacturer → Release → Set → Card
- Each level provides context for AI analysis and URL structure

**Release Approval Workflow:**
- `isApproved`: Boolean flag controlling public visibility
- `approvedAt`: Timestamp when release was approved
- `approvedBy`: Email of admin who approved the release
- Only approved releases are shown on public-facing pages

**Parent-Child Parallel Sets:**
- Sets can have a parent-child relationship via `parentSetId`
- Parent sets (null `parentSetId`) contain the card checklist
- Child parallel sets reference the parent's cards
- Flags: `hasVariableChecklist`, `mirrorsParentChecklist`
- Cards are stored once on parent, not duplicated per parallel

**Set Types:**
- `SetType` enum: Base, Insert, Autograph, Memorabilia
- `isBaseSet` field is deprecated (use `type` instead)
- Type affects slug generation and display categorization

**Content Linking:**
- Posts can reference Release, Set, or Card (optional)
- Images can belong to Release, Set, Card, or Post
- Source Documents can be linked to Releases or Posts

**Serial Number Handling:**
- `serialNumber`: Raw format (e.g., "/49", "1/1")
- `printRun`: Numeric value (e.g., 49, 1)
- `numbered`: Display format (e.g., "/49", "1 of 1")
- `isNumbered`: Boolean flag for numbered cards

**Parallel/Variation System:**
- `parallelType`: Specific parallel name (e.g., "Gold Refractor", "Base")
- `variant`: Basic variant designation
- `specialFeatures`: Array of special attributes (rookie, insert, short_print)
- `colorVariant`: Color designation (gold, red, blue, etc.)

### Data Integrity

**Cascading Deletes:**
- Deleting a Manufacturer cascades to all Releases
- Deleting a Release cascades to all Sets
- Deleting a Set cascades to all Cards
- Deleting a Post/Release/Set/Card cascades to associated Images

**Unique Constraints:**
- Card slugs must be unique (includes print run for serial numbered cards)
- Manufacturer names must be unique
- Release slugs must be unique
- Post slugs must be unique

## API Endpoints

### Releases
**GET** `/api/releases?slug={slug}`
- Fetch release by slug with sets, manufacturer, and images
- Returns: Release object with nested relationships

**POST** `/api/releases` (Auth required)
- Create new release
- Body: `{ name, year, manufacturerId, description?, releaseDate? }`
- Auto-generates slug using `generateReleaseSlug()`

**PUT** `/api/releases` (Auth required)
- Update existing release
- Body: `{ id, name?, year?, description?, releaseDate? }`

**DELETE** `/api/releases?id={id}` (Auth required)
- Delete release and cascade to all sets/cards/images

---

### Sets
**GET** `/api/sets?slug={slug}`
- Fetch set by slug with cards, release, and parallel relationships
- Returns: Set object with cards array

**GET** `/api/sets?releaseId={releaseId}` (Auth required)
- Fetch all sets for a release
- Returns: Array of sets

**GET** `/api/sets?id={id}` (Auth required)
- Fetch set by ID with cards count
- Returns: Set object

**POST** `/api/sets` (Auth required)
- Create new set
- Body: `{ name, type, isBaseSet, totalCards?, releaseId, parallels?, parentSetId?, printRun?, description? }`
- Auto-generates slug using `generateSetSlug()` with type prefixes:
  - Base: `year-release-base-setname` (or just `year-release-setname` if name includes "base")
  - Insert: `year-release-insert-setname`
  - Autograph: `year-release-auto-setname`
  - Memorabilia: `year-release-mem-setname`
  - Other: `year-release-setname`
- Parallel sets include parent name and print run in slug

**PUT** `/api/sets` (Auth required)
- Update existing set
- Body: `{ id, name?, type?, totalCards?, parallels?, description? }`
- Regenerates slug if name changes

**DELETE** `/api/sets?setId={setId}` (Auth required)
- Delete set and cascade to all cards

---

### Cards
**GET** `/api/cards?slug={slug}`
- Fetch card by slug with set, release, and images
- Returns: Card object with nested relationships

**GET** `/api/cards?id={id}`
- Fetch card by ID
- Returns: Card object

**POST** `/api/cards` (Auth required)
- Add cards to a set
- Body: `{ setId, cards: [...] }`
- Auto-generates slugs using `generateCardSlug()`
- Slug format: `year-release-set-cardnumber-playername-variant-printrun`
- Special handling for 1/1 cards: converts to "1-of-1" in slug

**DELETE** `/api/cards?setId={setId}` (Auth required)
- Delete all cards in a set
- Returns: Count of deleted cards

---

### Posts
**GET** `/api/posts?slug={slug}`
- Fetch post by slug
- Returns: Post object with optional release/set/card references

**GET** `/api/posts` (Public)
- Fetch all published posts
- Returns: Array of posts ordered by creation date

**POST** `/api/posts` (Auth required)
- Create new post
- Body: `{ title, content, excerpt?, type, published?, releaseId?, setId?, cardId? }`
- Auto-generates slug from title

**PUT** `/api/posts` (Auth required)
- Update existing post
- Body: `{ id, title?, content?, excerpt?, published? }`

**DELETE** `/api/posts?id={id}` (Auth required)
- Delete post and cascade to images

---

### Analysis (Genkit AI Flows)
**POST** `/api/analyze/release`
- Analyze release documents using Genkit AI flow
- Body: `{ documentText }`
- Returns: Structured release information (name, year, description, sets)

**POST** `/api/generate-description`
- Generate AI-assisted descriptions for releases
- Body: `{ name, sellSheetText }`
- Returns: Generated description text

**POST** `/api/sets/import-excel` (Auth required)
- **AI-Powered Excel Import Workflow**
- Automatically imports complete checklists from Excel files
- Body: `{ releaseId, fileData (base64), dryRun? }`
- Workflow:
  1. Parses Excel file and extracts all cards
  2. Uses Claude AI via Genkit to analyze set structure
  3. Identifies base sets and their parallel variations
  4. Determines set types (Base, Insert, Autograph, Memorabilia)
  5. Creates hierarchical structure: parent sets → parallel sets → cards
  6. Handles duplicate detection (idempotent - safe to run multiple times)
- Features:
  - **Dry run mode**: Preview analysis before creating data
  - **Smart parallel detection**: Groups parallels under parent sets
  - **Type classification**: Auto-categorizes sets by type
  - **Print run extraction**: Automatically detects and assigns print runs
  - **Release selector**: User explicitly chooses target release (prevents wrong imports)
- Returns: Import summary with counts of sets and cards created

---

### Uploads
**POST** `/api/upload`
- Upload images and documents
- Supports: PNG, JPG, GIF, WebP, PDF, CSV
- Returns: Public URL and metadata

**POST** `/api/pdf-to-images`
- Convert PDF pages to high-quality images
- Body: `{ pdfUrl, releaseId }`
- Returns: Array of image URLs

**POST** `/api/uploads/release-images`
- Upload and associate images with release
- Body: FormData with images and releaseId
- Returns: Array of created image records

---

### SEO
**GET** `/sitemap.xml`
- Dynamic sitemap with all releases, sets, cards, and posts
- Updates automatically when content changes

**GET** `/robots.txt`
- Search engine directives

---

### URL Slug Conventions

**Release Slugs:**
- Format: `{year}-{manufacturer}-{name}`
- Example: `2024-25-panini-obsidian-soccer`

**Set Slugs:**
- Format: `{year}-{release}-{type-prefix}-{setname}[-{parallel}]`
- Type prefixes: `base`, `insert`, `auto`, `mem` (or omit for Other)
- Examples:
  - Base: `2024-25-obsidian-soccer-obsidian-base`
  - Insert: `2024-25-obsidian-soccer-insert-equinox`
  - Autograph: `2024-25-obsidian-soccer-auto-dual-jersey-ink`
  - Parallel: `2024-25-obsidian-soccer-obsidian-base-electric-etch-green-5`

**Card Slugs:**
- Format: `{year}-{release}-{set}-{cardnumber}-{player}-{parallel}-{printrun}`
- Parallel cards exclude base set name from slug
- 1/1 cards use "1-of-1" format
- Examples:
  - Base: `2024-25-obsidian-soccer-obsidian-base-1-jude-bellingham-145`
  - Parallel: `2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-orange-8`
  - 1/1: `2024-25-obsidian-soccer-1-jude-bellingham-gold-power-1-of-1`

**Special Handling:**
- "Optic Base Set" → "optic" (base removed from slug)
- "Base Set" → "base" (base kept in slug)
- "1/1" or "1 of 1" → "1-of-1" in URLs
- Print runs: " /5" → "-5" in URLs

### Parent-Child Parallel Architecture

The database uses a **parent-child model** for parallel sets:

- **Parent Sets**: Base/Insert/Auto/Memorabilia sets containing the actual card checklist
- **Child Parallel Sets**: Variations (e.g., "Electric Etch Orange", "Gold Power") that reference parent's cards
- **Cards stored once**: Cards exist only on parent sets, not duplicated for each parallel
- **Query efficiency**: Simpler joins, fewer records, single source of truth

See `.claude/CLAUDE.md` for detailed documentation on parallel set architecture, query patterns, and testing checklists.

## Environment Variables

Required environment variables (see `.env` file):

```env
# Database
DATABASE_URL=

# API Keys
ANTHROPIC_API_KEY=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# eBay Partner Network
EBAY_APP_ID=
EBAY_CLIENT_SECRET=
EBAY_CAMPAIGN_ID=
EBAY_VERIFICATION_TOKEN=
EBAY_DELETION_ENDPOINT_URL=
```

## License

Private project for footy.bot

---

## Technical Notes

### Multi-Document Analysis
The system can analyze multiple document types simultaneously:
- PDFs: Extracted text is analyzed for release/set/card information
- CSVs: Parsed and used for card checklists
- Images: Analyzed using Claude Vision
- HTML: Web pages fetched and parsed for product information

### AI Integration
Uses Claude 3.5 Sonnet with structured output (Zod schemas) to curate and analyze data from diverse sources. The AI assists in:
- Extracting and structuring card data with professional accuracy
- Analyzing market trends and card variations
- Creating expert-level content that provides genuine value to collectors
- Ensuring data consistency and completeness across the platform

### Database Design
Hierarchical structure allows for:
- Complete card library organization
- Context-aware AI analysis
- Efficient querying and relationships
- Future expansion (price tracking, collection management)

