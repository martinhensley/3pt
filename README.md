# footy.bot

A football (soccer) card AI and Data Platform

**footy.bot** is a comprehensive database and content platform for soccer trading cards, powered by Claude AI (Sonnet 4). The platform combines structured data management with AI-assisted content creation to build the most complete soccer card reference available.

## Overview

- **Database**: 8,977+ cards from 149+ sets across multiple releases (2024-25 Donruss Soccer, Obsidian, etc.)
- **AI-Powered**: Claude Sonnet 4 for card identification, set analysis, and content generation
- **Admin Tools**: Bulk card scanning, smart matching, source document library
- **Public Features**: Searchable checklists, release database, eBay marketplace integration
- **Architecture**: Next.js 15, PostgreSQL (Neon), Vercel Blob storage, Anthropic SDK

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

### Core Database
- **Hierarchical Data Model**: Manufacturers → Releases → Sets → Cards
- **Parent-Child Parallel Architecture**: Efficient storage with parallels referencing parent set cards
- **149+ Sets**: Complete checklists from major releases (Donruss, Obsidian, etc.)
- **8,977+ Cards**: Comprehensive card database with images and metadata
- **Release Management**: Approval workflow, reviews, source document tracking

### AI Integration
- **Card Identification**: Analyze card images to identify player, set, variant, and print run
- **Smart Matching**: Match scanned cards to existing database with confidence scores
- **Bulk Scanning**: Process multiple cards at once with AI-assisted identification
- **Content Generation**: Auto-generate release reviews and blog posts
- **Set Analysis**: Extract card data from checklist documents

### Admin Tools
- **Source Document Library**: Manage PDFs, checklists, and reference images
- **Activity Tracking**: Monitor all data changes and admin actions
- **Bulk Operations**: Import/export, bulk card saves, batch processing
- **Card Management**: Full CRUD with image uploads and metadata editing

### Public Features
- **Searchable Checklists**: Browse and filter all sets by manufacturer, release, and type
- **Release Database**: Public catalog of approved releases with reviews
- **eBay Integration**: Live marketplace listings via eBay Partner Network API
- **SEO Optimized**: Dynamic metadata, sitemap, structured data, and Open Graph tags
- **Responsive Design**: Mobile-friendly interface with footy.bot branding (Green #005031 & Orange #F47322)

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

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: Anthropic SDK (TypeScript)
- **AI Models**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Image Processing**: Sharp

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
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── analyze/        # AI analysis endpoints
│   │   ├── auth/           # NextAuth
│   │   ├── cards/          # Card API
│   │   ├── checklists/     # Checklist browser API
│   │   ├── ebay/           # eBay API integration
│   │   ├── generate/       # AI content generation
│   │   ├── images/         # Image management
│   │   ├── library/        # Library endpoints
│   │   ├── posts/          # Post CRUD
│   │   ├── releases/       # Release API
│   │   ├── sets/           # Set API
│   │   └── upload/         # File upload
│   ├── cards/[slug]/       # Card detail pages
│   ├── checklists/         # Public checklist browser
│   ├── posts/              # Post index & detail pages
│   ├── releases/           # Release index & detail pages
│   ├── sets/[slug]/        # Set detail pages (parent & parallel)
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Homepage
│   ├── sitemap.ts          # Dynamic sitemap
│   └── robots.ts           # Robots.txt
├── components/
│   ├── Breadcrumb.tsx      # Navigation breadcrumbs
│   ├── EbayAd.tsx          # eBay affiliate ads
│   ├── EntitySelectors.tsx # Release/Set dropdowns
│   ├── Footer.tsx          # Site footer
│   ├── Header.tsx          # Site header (standardized)
│   └── MultiFileUpload.tsx # Multi-file upload component
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── checklistParser.ts  # Excel checklist parser
│   ├── database.ts         # Database helpers
│   ├── ebay.ts             # eBay API client
│   ├── extractKeywords.ts  # Keyword extraction
│   ├── formatters.ts       # Display formatting utilities
│   ├── genkit.ts           # Anthropic SDK AI functions
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
- `/checklists` - Searchable checklist browser
- `/posts` - Post index
- `/posts/[slug]` - Post detail pages
- `/sets/[slug]` - Set detail pages (parent sets and parallel sets use same route)
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
                   │ description (legacy)  │     │
                   │ review                │     │ Footy's review
                   │ reviewDate            │     │
                   │ releaseDate (string)  │     │ Free-form date
                   │ postDate              │     │ Chronological ordering
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
                          │ postDate              │      │ - REVIEW
                          │ releaseId  (optional) │──┐   │ - GUIDE
                          │ setId      (optional) │──┼───│ - ANALYSIS
                          │ cardId     (optional) │──┼───│ - GENERAL
                          │ authorId              │  │   │
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
                     │ blobUrl                      │ Vercel Blob storage
                     │ mimeType                     │
                     │ fileSize                     │
                     │ documentType                 │──────┐ DocumentType ENUM:
                     │ entityType                   │──────┼─ - SELL_SHEET
                     │ tags          (String[])     │      │ - CHECKLIST
                     │ extractedText                │      │ - PRESS_RELEASE
                     │ uploadedById                 │      │ - PRICE_GUIDE
                     │ uploadedAt                   │      │ - IMAGE
                     │ lastUsedAt                   │      │ - OTHER
                     │ usageCount                   │      └────────────
                     │ usageContext                 │
                     │ description                  │      EntityType ENUM:
                     │ createdAt                    │      - RELEASE
                     │ updatedAt                    │      - POST
                     │                              │
                     │ releaseId     (optional)     │──┐ Direct foreign keys
                     │ postId        (optional)     │──┘ with type discriminator
                     └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION                                        │
└──────────────────────────────────────────────────────────────────────────────┘

Note: Authentication is handled by neon_auth.admin_users table (separate schema).
No User model in public schema. Post.authorId and SourceDocument.uploadedById
reference neon_auth.admin_users.id without enforced foreign key constraints.
```

### Key Relationships

**Hierarchical Data Flow:**
- Manufacturer → Release → Set → Card
- Each level provides context for AI analysis and URL structure

**Release Fields:**
- `description`: Legacy field, use `review` instead
- `review`: Footy's editorial review of the release
- `reviewDate`: When the review was written/updated
- `releaseDate`: Free-form string (e.g., "May 4, 2025" or "1978")
- `postDate`: DateTime for chronological ordering (auto-populated from releaseDate)

**Release Approval Workflow:**
- `isApproved`: Boolean flag controlling public visibility
- `approvedAt`: Timestamp when release was approved
- `approvedBy`: Email of admin who approved the release
- Only approved releases are shown on public-facing pages

**Post Fields:**
- `postDate`: DateTime for chronological ordering (defaults to createdAt, can be backdated)

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
- Posts can reference Release, Set, or Card (optional foreign keys)
- Images use direct foreign keys with `ImageType` enum discriminator (RELEASE, SET, CARD, POST)
- Source Documents use direct foreign keys with `SourceDocumentEntityType` enum (RELEASE, POST)
- No junction tables - simpler architecture with type discriminators

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

## API Reference

footy.bot provides a comprehensive REST API for managing soccer card data, AI-powered analysis, and content generation.

### Quick Reference

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Releases** | `/api/releases` | Manage card releases and approvals |
| **Sets** | `/api/sets` | Manage card sets and parallels |
| **Cards** | `/api/cards` | Individual card CRUD operations |
| **Posts** | `/api/posts` | Blog posts and content management |
| **AI Analysis** | `/api/analyze/*` | Claude AI card/set/release analysis |
| **AI Generation** | `/api/generate/*` | Auto-generate reviews and content |
| **Checklists** | `/api/checklists` | Public searchable checklist browser |
| **Admin** | `/api/admin/*` | Admin-only operations (scanning, matching, bulk ops) |
| **Uploads** | `/api/upload/*` | File and image uploads |

### Authentication

Most API endpoints require authentication via NextAuth.js session cookies. Public endpoints include:
- `GET /api/releases?slug={slug}` - Fetch single release
- `GET /api/sets?slug={slug}` - Fetch single set
- `GET /api/cards?slug={slug}` - Fetch single card
- `GET /api/posts` - List published posts
- `GET /api/checklists` - Browse checklists

### Complete Documentation

**[📖 View Complete API Documentation →](/docs/API.md)**

Includes:
- Detailed endpoint specifications with HTTP methods and parameters
- TypeScript request/response types for all endpoints
- cURL examples for testing
- Success and error response samples
- Authentication details and session management
- URL slug conventions and auto-generation rules
- Parent-child parallel architecture explained
- Error handling and status codes

### Key Features

- **Auto-generated Slugs**: All entities get SEO-friendly URLs automatically
- **TypeScript-first**: Strongly typed request/response interfaces
- **AI-Powered**: Claude Sonnet 4 for card identification and content generation
- **Cascading Operations**: Deletes cascade through relationships (Release → Sets → Cards)
- **Efficient Parallels**: Cards stored once on parent sets, referenced by parallel sets

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

