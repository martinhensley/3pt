# footy.bot - Soccer Card Information Platform

A modern platform for soccer card enthusiasts at footy.bot. Features AI-powered content generation using Claude for card and set analysis, with comprehensive database management for manufacturers, releases, sets, and individual cards.

## Features

- **AI-Powered Content Generation**: Upload card images or set documents and automatically generate engaging blog posts
- **Hierarchical Data Model**: Manufacturers → Releases → Sets → Cards
- **Multi-Document Analysis**: Upload PDFs, CSVs, images, and HTML files for comprehensive release analysis
- **Card Library Management**: Build and manage a complete soccer card database
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

Navigate to [http://localhost:3000/fa/login](http://localhost:3000/fa/login)

Login credentials are configured in your environment variables.

## Database Schema

### Hierarchical Structure
```
Manufacturer
  └── Release (year, name)
       └── Set (name, totalCards)
            └── Card (playerName, team, cardNumber, variant)
```

### Additional Models
- **User**: Admin authentication
- **Post**: Blog posts (can reference Release, Set, or Card)
- **PostImage**: Images associated with posts

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

## Project Structure

```
footy/
├── app/
│   ├── fa/                 # Admin portal
│   ├── api/                # API routes
│   │   ├── analyze/        # AI analysis endpoints
│   │   ├── library/        # Data retrieval endpoints
│   │   ├── auth/           # NextAuth
│   │   ├── posts/          # Post CRUD
│   │   └── upload/         # File upload
│   ├── posts/[slug]/       # Post pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Homepage
│   ├── sitemap.ts          # Dynamic sitemap
│   └── robots.ts           # Robots.txt
├── components/
│   ├── Header.tsx          # Site header
│   ├── EbayAd.tsx          # eBay affiliate ads
│   ├── EntitySelectors.tsx # Release/Set dropdowns
│   └── MultiFileUpload.tsx # Multi-file upload component
├── lib/
│   ├── prisma.ts           # Database client
│   ├── auth.ts             # NextAuth config
│   ├── ai.ts               # Claude AI integration
│   ├── database.ts         # Database helpers
│   └── documentParser.ts   # PDF/CSV parsing
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
Uses Claude 3.5 Sonnet with structured output (Zod schemas) to ensure consistent data extraction from diverse document types.

### Database Design
Hierarchical structure allows for:
- Complete card library organization
- Context-aware AI analysis
- Efficient querying and relationships
- Future expansion (price tracking, collection management)

