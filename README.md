# footy.bot - Soccer Card Information Platform

footy.bot is an information platform for soccer (footy) cards. Featuring hand crafted data curation assisted by AI to organize checklists, sales, and grading information at scale globally. footy.bot publishes daily at footy.bot and at Facebook, Instagram, TikTok, and X.

## Features

- **Hand-Crafted Data Curation**: AI-assisted data organization for checklists, sales, and grading information at global scale
- **Hierarchical Data Model**: Manufacturers → Releases → Sets → Cards
- **Card Library Management**: Build and manage a complete soccer card database
- **Content Publishing**: Create and manage blog posts about releases, sets, cards, and industry news
- **Admin Portal**: Secure interface for content and data management
- **SEO Optimized**: Dynamic metadata, sitemap, structured data, and Open Graph tags
- **Responsive Design**: Mobile-friendly interface with footy.bot branding (Green #005031 & Orange #F47322)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Anthropic Claude API (Claude 3.5 Sonnet)
- **Image Processing**: Sharp
- **Document Parsing**: pdf-parse, csv-parse

## Color Scheme

- Footy Green: #005031
- Footy Orange: #F47322
- White: #FFFFFF

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Admin Access

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)

Login credentials are configured in your environment variables.

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
                   ┌────┴──────────────┐
                   │     Release       │
                   │───────────────────│
                   │ id                │◄────┐
                   │ name              │     │
                   │ year              │     │
                   │ slug              │     │
                   │ description       │     │
                   │ releaseDate       │     │
                   │ sellSheetText     │     │
                   │ sourceFiles       │     │
                   │ manufacturerId    │     │
                   │ createdAt         │     │
                   │ updatedAt         │     │
                   └───────────────────┘     │ 1:N
                                        ┌────┴──────────────┐
                                        │       Set         │
                                        │───────────────────│
                                        │ id                │◄────┐
                                        │ name              │     │
                                        │ isBaseSet         │     │
                                        │ releaseId         │     │
                                        │ totalCards        │     │
                                        │ parallels  (JSON) │     │
                                        │ createdAt         │     │
                                        │ updatedAt         │     │
                                        └───────────────────┘     │ 1:N
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

## Key Features

### 1. Analyze Release
Upload multiple documents (PDFs, CSVs, images, URLs) about a release:
- Extracts manufacturer, release name, year
- Identifies all sets within the release
- Optionally extracts card checklists
- Creates hierarchical database records
- Generates blog post (optional)

### 2. Analyze Set
Add sets to existing releases:
- Select parent release from dropdown
- Upload set documents (checklists, sell sheets)
- Extracts individual cards from checklists
- Creates set and card records
- Generates blog post (optional)

### 3. Analyze Card
Add individual cards to sets:
- Select release → set from dropdowns
- Upload card images (front/back)
- AI analyzes with context from set/release
- Creates card database record
- Generates blog post (optional)

### 4. Manage Posts
- View all posts (published and drafts)
- Edit post content, title, excerpt
- Manage images
- Publish/unpublish posts
- Delete posts

### 5. Generate Posts
Create general content using AI:
- Enter topic or idea
- AI generates full blog post
- Review and edit before publishing

## API Endpoints

### Analysis
- `POST /api/analyze/release` - Analyze release documents
- `POST /api/analyze/set` - Analyze set documents
- `POST /api/analyze/card` - Analyze card images

### Library
- `GET /api/library/manufacturers` - Get all manufacturers
- `GET /api/library/releases` - Get all releases
- `GET /api/library/sets?releaseId=` - Get sets for a release

### Content
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `PUT /api/posts` - Update post
- `DELETE /api/posts?id=` - Delete post
- `POST /api/upload` - Upload files (images, PDFs, CSVs)

### SEO
- `GET /sitemap.xml` - Dynamic sitemap
- `GET /robots.txt` - Search engine directives

## Standardized Page Layout

### Public Page Pattern
All public-facing pages follow a **standardized three-column layout** to ensure consistent user experience:

```tsx
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
  <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
    <aside className="hidden lg:block w-72 flex-shrink-0">
      {/* Left Sidebar - eBay Ads */}
    </aside>

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

    <aside className="hidden lg:block w-72 flex-shrink-0">
      {/* Right Sidebar - eBay Ads */}
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

**See `.claude/claude.md` for detailed documentation.**

## Project Structure

```
footy/
├── .claude/
│   └── claude.md           # Development documentation & patterns
├── app/
│   ├── admin/              # Admin portal
│   │   ├── releases/       # Release management
│   │   ├── posts/          # Post management
│   │   ├── cards/          # Card creation
│   │   ├── bulk-scan/      # Bulk card scanning
│   │   └── activity/       # Activity history
│   ├── api/                # API routes
│   │   ├── analyze/        # AI analysis endpoints
│   │   ├── library/        # Data retrieval endpoints
│   │   ├── auth/           # NextAuth
│   │   ├── posts/          # Post CRUD
│   │   ├── cards/          # Card API
│   │   ├── sets/           # Set API
│   │   ├── releases/       # Release API
│   │   └── upload/         # File upload
│   ├── releases/[slug]/    # Release pages
│   ├── sets/[slug]/        # Set pages
│   │   └── parallels/[parallel]/ # Parallel/variation pages
│   ├── card/[slug]/        # Card detail pages
│   ├── posts/[slug]/       # Post pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Homepage
│   ├── sitemap.ts          # Dynamic sitemap
│   └── robots.ts           # Robots.txt
├── components/
│   ├── Header.tsx          # Site header (standardized)
│   ├── Footer.tsx          # Site footer
│   ├── Breadcrumb.tsx      # Navigation breadcrumbs
│   ├── EbayAd.tsx          # eBay affiliate ads
│   ├── EntitySelectors.tsx # Release/Set dropdowns
│   └── MultiFileUpload.tsx # Multi-file upload component
├── lib/
│   ├── prisma.ts           # Database client
│   ├── auth.ts             # NextAuth config
│   ├── ai.ts               # Claude AI integration
│   ├── database.ts         # Database helpers
│   ├── documentParser.ts   # PDF/CSV parsing
│   ├── formatters.ts       # Display formatting utilities
│   └── slugGenerator.ts    # URL slug generation
├── prisma/
│   └── schema.prisma       # Database schema
└── public/
    └── uploads/            # Uploaded files
```

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

## SEO Strategy

### Current Implementation
- Enhanced metadata (title, description, keywords)
- Open Graph tags for social sharing
- Twitter Cards
- Dynamic sitemap generation
- Robots.txt configuration
- Schema.org structured data (Article, Organization)
- Canonical URLs
- Mobile optimization
- Image optimization with Next.js Image component

### Target Keywords
- Primary: soccer card database, football trading cards, soccer card information
- Secondary: panini soccer cards, topps soccer cards, soccer card sets
- Long-tail: soccer card collector guide, new soccer card releases

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Update `NEXTAUTH_URL` to production domain
4. Deploy

### Environment Setup
- Use PostgreSQL database in production (Neon recommended)
- Ensure all API keys are securely configured
- Update domain references to production URL

## Development

### Adding New Features
1. Update Prisma schema if needed
2. Run `npx prisma generate` to update client
3. Create/update API routes
4. Update admin portal UI
5. Test thoroughly

### Database Migrations
```bash
npx prisma migrate dev --name migration_name
npx prisma generate
```

## Security Notes

- Change default admin credentials
- Use strong secrets in production
- Keep API keys secure
- Never commit .env files
- Implement rate limiting for APIs
- Validate all user inputs

## Roadmap / TODO

### Future Features
- **Sales Data Collection**: Aggregate and track historical sales data from major marketplaces (eBay, PWCC, Goldin, etc.) to provide market insights and pricing trends
- **Comps (Comparable Valuations)**: Feature-as-a-service component providing third-party valuation services with comparable sales data, market analysis, and automated valuation models for grading companies and auction houses

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

