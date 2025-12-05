# 3pt.bot

A basketball card AI and Data Platform

**3pt.bot** is a comprehensive database and content platform for basketball trading cards, powered by Claude AI (Sonnet 4). The platform combines structured data management with AI-assisted content creation to build the most complete basketball card reference available.

## Overview

- **Database**: Comprehensive card database with support for manufacturers, releases, sets, and individual cards
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
- **Independent Parallel Architecture**: Sets with parallels grouped by base name with intelligent sorting
- **Smart Set Sorting**: Automatic grouping of sets with their parallels (Base/Optic first, then alphabetical by base name)
- **Complete Checklists**: Major releases from Panini, Topps, and other manufacturers
- **Card Database**: Comprehensive card database with images and metadata
- **Release Management**: Reviews and source document tracking

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
- **Card Search**: Basic search with manual trigger (Enter key or Search button)
- **Release Database**: Public catalog of approved releases with reviews
- **eBay Integration**: Live marketplace listings via eBay Partner Network API
- **SEO Optimized**: Dynamic metadata, sitemap, structured data, and Open Graph tags
- **Responsive Design**: Mobile-friendly interface with 3pt.bot branding (Green #005031 & Orange #F47322)

## Roadmap / TODO

### Future Features
- **Advanced Search & Database Optimization**:
  - **Search Improvements**: Current search is basic pattern matching; need to implement:
    - Boolean search operators (AND, OR, NOT)
    - Multi-term search with phrase matching
    - Fuzzy matching for misspellings
    - Search result relevance scoring
    - Autocomplete/typeahead suggestions
  - **Database Indexing**: Add indexes to Card table for search performance:
    - `playerName` - most common search field
    - `team` - frequently filtered
    - `cardNumber` - exact match searches
    - Composite indexes for common filter combinations
    - Full-text search indexes for advanced search capabilities
  - **Performance**: Current search scans entire table; with proper indexes and search optimization, query times should improve significantly
- **Sales Data Collection**: Aggregate and track historical sales data from major marketplaces (eBay, PWCC, Goldin, etc.) to provide market insights and pricing trends
- **Comps (Comparable Valuations)**: Feature-as-a-service component providing third-party valuation services with comparable sales data, market analysis, and automated valuation models for grading companies and auction houses
- **SEO Strategy & Optimization**: Once development slows and the app is ready for content production, focus on:
  - Keyword research and targeting (primary: basketball card database, NBA trading cards; secondary: panini basketball cards, topps basketball cards)
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

- 3pt Green: #005031
- 3pt Orange: #F47322
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
3pt/
├── .claude/
│   ├── claude.md           # Claude Code configuration
│   ├── commands/           # Custom slash commands
│   │   └── checklist-release-etl.md
│   └── skills/             # Claude Code skills
│       └── checklist-release-etl/
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
├── docs/                   # Project documentation
│   ├── API.md              # REST API documentation
│   ├── AI_INTEGRATION.md   # Anthropic SDK usage
│   ├── DATABASE.md         # Complete schema reference
│   ├── FRONTEND_PATTERNS.md # UI patterns
│   ├── IMPORT_GUIDE.md     # Data import workflows
│   ├── PARALLEL_ARCHITECTURE.md # Set relationships
│   └── SLUG_CONVENTIONS.md # URL formatting
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── checklistParser.ts  # Excel checklist parser
│   ├── database.ts         # Database helpers
│   ├── ebay.ts             # eBay API client
│   ├── extractKeywords.ts  # Keyword extraction
│   ├── formatters.ts       # Display formatting utilities
│   ├── ai.ts               # Anthropic SDK AI functions
│   ├── neon-auth.ts        # Neon database auth
│   ├── prisma.ts           # Database client
│   ├── setUtils.ts         # Set sorting and grouping utilities
│   └── slugGenerator.ts    # URL slug generation
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/
│   ├── etl/                # Release ETL import scripts
│   │   └── {release-name}/ # Per-release import folders
│   └── *.ts                # Utility and migration scripts
├── CLAUDE.md               # Development documentation & patterns
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

**See `CLAUDE.md` for detailed development documentation.**

## Database Schema

The 3pt.bot database uses PostgreSQL with Prisma ORM, designed around a hierarchical data model:

```
Manufacturer → Release → Set → Card
```

### Quick Reference

| Entity | Description |
|--------|-------------|
| **Manufacturer** | Card manufacturers (Panini, Topps, etc.) |
| **Release** | Product releases (e.g., "2025-26 Topps Basketball") |
| **Set** | Card sets within releases (Base, Insert, Auto, Mem) |
| **Card** | Individual cards with variants and serials |
| **Post** | Blog posts, reviews, and articles |
| **Image** | Images for all entity types |
| **SourceDocument** | Reference documents (PDFs, checklists) |

### Key Features

- **Independent Parallel Architecture**: Each set (base and parallel) stores its own cards with simplified architecture
- **Intelligent Set Sorting**: Automatic grouping by base name with smart sorting (unnumbered first, then numbered highest to lowest)
- **Content Linking**: Posts, Images, and SourceDocuments use direct foreign keys with type discriminators
- **Cascading Deletes**: Hierarchical relationships maintain referential integrity
- **AI Metadata**: Cards store detection confidence, methods, and OCR text for Claude AI operations

### Complete Documentation

**[📖 View Complete Database Reference →](/docs/DATABASE.md)**

Includes:
- Detailed field descriptions for all models
- Enum definitions (SetType, ImageType, PostType, etc.)
- Independent parallel architecture explained
- Common query patterns with TypeScript/Prisma examples
- Data integrity rules and cascading deletes
- Migration guide and removed fields history
- Relationship diagrams and entity descriptions

## API Reference

3pt.bot provides a comprehensive REST API for managing basketball card data, AI-powered analysis, and content generation.

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
- **Independent Parallels**: Each set stores its own cards for simplicity

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

Private project for 3pt.bot

