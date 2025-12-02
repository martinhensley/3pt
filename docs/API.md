# 3pt.bot API Reference

Complete REST API documentation for the 3pt.bot basketball card platform.

## Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [Releases API](#releases-api)
- [Sets API](#sets-api)
- [Cards API](#cards-api)
- [Posts API](#posts-api)
- [AI Analysis & Generation](#ai-analysis--generation)
- [Checklists API](#checklists-api)
- [Admin APIs](#admin-apis)
- [Uploads API](#uploads-api)
- [Error Handling](#error-handling)
- [URL Slug Conventions](#url-slug-conventions)

---

## Introduction

The 3pt.bot API provides programmatic access to basketball card data, AI-powered analysis, and content management features.

**Base URL:** `http://localhost:3000` (development) or `https://3pt.bot` (production)

**Content Type:** All requests and responses use `application/json` unless otherwise specified.

---

## Authentication

Most API endpoints require authentication via NextAuth.js session cookies.

### Public Endpoints (No Auth Required)

- `GET /api/releases?slug={slug}` - Fetch single release
- `GET /api/sets?slug={slug}` - Fetch single set
- `GET /api/cards?slug={slug}` - Fetch single card
- `GET /api/posts` - List published posts
- `GET /api/posts?slug={slug}` - Fetch single post
- `GET /api/checklists` - Browse checklists
- `GET /api/checklists/filters` - Get filter options

### Authenticated Endpoints

All other endpoints require an active admin session. Authentication is handled by NextAuth.js with session cookies.

**Session Management:**
- Login: `POST /api/auth/signin`
- Logout: `POST /api/auth/signout`
- Session check: `GET /api/auth/session`

---

## Releases API

Manage card releases (e.g., "2024-25 Panini Obsidian Soccer").

### GET /api/releases

Fetch release by slug with sets, manufacturer, and images.

**Query Parameters:**
- `slug` (string, required) - Release slug

**TypeScript Types:**
```typescript
type ReleaseResponse = {
  id: string;
  name: string;
  year: string;
  slug: string;
  summary: string | null;
  releaseDate: string | null;
  manufacturer: {
    id: string;
    name: string;
  };
  sets: Set[];
  images: Image[];
};
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/releases?slug=2016-17-panini-donruss-basketball"
```

**Example Response:**
```json
{
  "id": "cm3abc123",
  "name": "Donruss Basketball",
  "year": "2016-17",
  "slug": "2016-17-panini-donruss-basketball",
  "summary": "Panini's Donruss Basketball delivers premium card stock...",
  "releaseDate": "December 2016",
  "manufacturer": {
    "id": "cm3xyz789",
    "name": "Panini"
  },
  "sets": [...],
  "images": [...]
}
```

---

### POST /api/releases

Create new release.

**Authentication:** Required

**Request Body:**
```typescript
{
  name: string;
  year: string;
  manufacturerId: string;
  summary?: string;
  releaseDate?: string;
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/releases" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chrome Soccer",
    "year": "2024-25",
    "manufacturerId": "cm3xyz789",
    "releaseDate": "March 2025"
  }'
```

**Example Response:**
```json
{
  "id": "cm3new123",
  "name": "Chrome Soccer",
  "year": "2024-25",
  "slug": "2024-25-panini-chrome-soccer",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

### PUT /api/releases

Update existing release.

**Authentication:** Required

**Request Body:**
```typescript
{
  id: string;
  name?: string;
  year?: string;
  summary?: string;
  releaseDate?: string;
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/releases" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cm3abc123",
    "summary": "Updated summary text...",
    "releaseDate": "January 2025"
  }'
```

---

### DELETE /api/releases

Delete release and cascade to all sets/cards/images.

**Authentication:** Required

**Query Parameters:**
- `id` (string, required) - Release ID

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/releases?id=cm3abc123"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Release deleted successfully"
}
```

---

## Sets API

Manage card sets and parallel variations.

### GET /api/sets

Fetch set by slug with cards and release. Uses independent parallel architecture where each set stores its own cards.

**Query Parameters:**
- `slug` (string) - Set slug
- `releaseId` (string) - Filter by release (auth required)
- `id` (string) - Get by ID (auth required)

**TypeScript Types:**
```typescript
type SetResponse = {
  id: string;
  name: string;
  slug: string;
  type: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert';
  isParallel: boolean;
  baseSetSlug: string | null;
  printRun: number | null;
  expectedCardCount: number | null;
  release: {
    id: string;
    name: string;
    year: string;
    slug: string;
    manufacturer: { name: string };
  };
  cards: Card[];
};
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/sets?slug=2016-17-donruss-basketball-base"
```

**Example Response:**
```json
{
  "id": "cm3set123",
  "name": "Base",
  "slug": "2016-17-donruss-basketball-base",
  "type": "Base",
  "isParallel": false,
  "baseSetSlug": null,
  "printRun": null,
  "expectedCardCount": 200,
  "release": {
    "id": "cm3rel123",
    "name": "Donruss Basketball",
    "year": "2016-17",
    "slug": "2016-17-panini-donruss-basketball",
    "manufacturer": { "name": "Panini" }
  },
  "cards": [...]
}
```

---

### POST /api/sets

Create new set.

**Authentication:** Required

**Request Body:**
```typescript
{
  name: string;
  type: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert';
  releaseId: string;
  isParallel?: boolean;
  baseSetSlug?: string; // Reference to base set (for parallels)
  printRun?: number;
  expectedCardCount?: number;
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/sets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rookie Kings",
    "type": "Insert",
    "releaseId": "cm3rel123",
    "expectedCardCount": 50
  }'
```

**Auto-generates slug based on type:**
- Base: `{year}-{release}-base-{setname}`
- Insert: `{year}-{release}-insert-{setname}`
- Autograph: `{year}-{release}-auto-{setname}`
- Memorabilia: `{year}-{release}-mem-{setname}`

---

### PUT /api/sets

Update existing set.

**Authentication:** Required

**Request Body:**
```typescript
{
  id: string;
  name?: string;
  type?: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert';
  printRun?: number;
  expectedCardCount?: number;
}
```

**Note:** Regenerates slug if name changes.

---

### DELETE /api/sets

Delete set and cascade to all cards.

**Authentication:** Required

**Query Parameters:**
- `setId` (string, required) - Set ID

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/sets?setId=cm3set123"
```

---

## Cards API

Manage individual cards.

### GET /api/cards

Fetch card by slug or ID.

**Query Parameters:**
- `slug` (string) - Card slug
- `id` (string) - Card ID

**TypeScript Types:**
```typescript
type CardResponse = {
  id: string;
  slug: string;
  playerName: string;
  team: string | null;
  cardNumber: string;
  variant: string | null;
  parallelType: string | null;
  printRun: number | null;
  numbered: string | null;
  imageFront: string | null;
  imageBack: string | null;
  set: {
    id: string;
    name: string;
    slug: string;
    type: string;
    release: {
      name: string;
      year: string;
      slug: string;
      manufacturer: { name: string };
    };
  };
  images: Image[];
};
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/cards?slug=2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5"
```

**Example Response:**
```json
{
  "id": "cm3card123",
  "slug": "2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5",
  "playerName": "Jahlil Okafor",
  "team": "Philadelphia 76ers",
  "cardNumber": "2",
  "variant": "Green",
  "parallelType": "Green",
  "printRun": 5,
  "numbered": "/5",
  "imageFront": "https://blob.vercel-storage.com/card-front-abc123.jpg",
  "imageBack": null,
  "set": {
    "id": "cm3set123",
    "name": "Base Green",
    "slug": "2016-17-donruss-optic-basketball-base-green-parallel-5",
    "type": "Base",
    "release": {
      "name": "Donruss Optic Basketball",
      "year": "2016-17",
      "slug": "2016-17-panini-donruss-optic-basketball",
      "manufacturer": { "name": "Panini" }
    }
  },
  "images": []
}
```

---

### POST /api/cards

Add cards to a set.

**Authentication:** Required

**Request Body:**
```typescript
{
  setId: string;
  cards: Array<{
    playerName: string;
    team?: string;
    cardNumber: string;
    variant?: string;
    parallelType?: string;
    printRun?: number;
    numbered?: string;
    imageFront?: string;
    imageBack?: string;
  }>;
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/cards" \
  -H "Content-Type: application/json" \
  -d '{
    "setId": "cm3set123",
    "cards": [
      {
        "playerName": "Kylian Mbappé",
        "team": "Real Madrid",
        "cardNumber": "2",
        "printRun": 145
      }
    ]
  }'
```

**Auto-generates slugs:**
- Format: `{year}-{release}-{set}-{cardnumber}-{player}-{variant}-{printrun}`
- Parallel cards exclude base set name from slug
- Special handling for 1/1 cards: converts to "1-of-1" in slug

---

### DELETE /api/cards

Delete all cards in a set.

**Authentication:** Required

**Query Parameters:**
- `setId` (string, required) - Set ID

**Example Response:**
```json
{
  "success": true,
  "count": 145,
  "message": "Deleted 145 cards"
}
```

---

## Posts API

Manage blog posts and content.

### GET /api/posts

Fetch all published posts or single post by slug.

**Query Parameters:**
- `slug` (string, optional) - Post slug

**TypeScript Types:**
```typescript
type PostResponse = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  type: 'NEWS' | 'REVIEW' | 'GUIDE' | 'ANALYSIS' | 'GENERAL';
  published: boolean;
  postDate: Date | null;
  createdAt: Date;
  release?: Release;
  set?: Set;
  card?: Card;
  images: Image[];
};
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/posts"
```

**Example Response:**
```json
[
  {
    "id": "cm3post123",
    "title": "2024-25 Obsidian Soccer Review",
    "slug": "2016-17-donruss-basketball-review",
    "content": "Full review content...",
    "excerpt": "Panini's latest Obsidian release...",
    "type": "REVIEW",
    "published": true,
    "postDate": "2025-01-15T00:00:00.000Z",
    "createdAt": "2025-01-14T10:00:00.000Z"
  }
]
```

---

### POST /api/posts

Create new post.

**Authentication:** Required

**Request Body:**
```typescript
{
  title: string;
  content: string;
  excerpt?: string;
  type: 'NEWS' | 'REVIEW' | 'GUIDE' | 'ANALYSIS' | 'GENERAL';
  published?: boolean;
  postDate?: Date;
  releaseId?: string;
  setId?: string;
  cardId?: string;
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Top 10 Rookies to Watch",
    "content": "Article content...",
    "type": "GUIDE",
    "published": true
  }'
```

**Auto-generates slug from title.**

---

### PUT /api/posts

Update existing post.

**Authentication:** Required

**Request Body:**
```typescript
{
  id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  published?: boolean;
  postDate?: Date;
}
```

---

### DELETE /api/posts

Delete post and cascade to images.

**Authentication:** Required

**Query Parameters:**
- `id` (string, required) - Post ID

---

## AI Analysis & Generation

Claude AI-powered endpoints for card identification, content generation, and data extraction.

### POST /api/analyze/release

Analyze release documents using Claude AI.

**Authentication:** Required

**Request Body:**
```typescript
{
  documentText: string;
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/analyze/release" \
  -H "Content-Type: application/json" \
  -d '{
    "documentText": "2024-25 Panini Obsidian Soccer..."
  }'
```

**Example Response:**
```json
{
  "manufacturer": "Panini",
  "releaseName": "Obsidian Soccer",
  "year": "2024-25",
  "slug": "2016-17-panini-donruss-basketball",
  "description": "Premium soccer cards...",
  "sets": [
    {
      "name": "Obsidian Base",
      "type": "Base",
      "totalCards": "200"
    }
  ]
}
```

---

### POST /api/analyze/set

Analyze checklist text to extract set structure.

**Authentication:** Required

**Request Body:**
```typescript
{
  checklistText: string;
  releaseId: string;
}
```

**Returns:** Structured set and card data ready for import.

---

### POST /api/analyze/card

Analyze card images for identification.

**Authentication:** Required

**Request Body:**
```typescript
{
  imageUrl: string;
  mimeType: string; // e.g., "image/jpeg"
}
```

**Example Response:**
```json
{
  "playerName": "Jude Bellingham",
  "cardNumber": "1",
  "team": "Real Madrid",
  "manufacturer": "Panini",
  "release": "Obsidian Soccer",
  "year": "2024-25",
  "variant": "Electric Etch Orange",
  "printRun": 8,
  "confidence": 95
}
```

---

### POST /api/generate-review

Generate AI-assisted reviews for releases.

**Authentication:** Required

**Request Body:**
```typescript
{
  name: string;
  sellSheetText?: string;
  releaseDate?: string;
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/generate-review" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2024-25 Panini Obsidian Soccer",
    "sellSheetText": "Product details...",
    "releaseDate": "December 2024"
  }'
```

**Example Response:**
```json
{
  "review": "Panini's Obsidian Soccer delivers premium card stock and stunning designs...",
  "summaryDate": "2025-01-15T00:00:00.000Z"
}
```

---

### POST /api/generate/post

Generate post content using AI.

**Authentication:** Required

**Request Body:**
```typescript
{
  title: string;
  type: 'NEWS' | 'REVIEW' | 'GUIDE' | 'ANALYSIS' | 'GENERAL';
  releaseId?: string;
  setId?: string;
  cardId?: string;
}
```

**Returns:** Generated post content and excerpt.

---

### POST /api/posts/generate-content

Generate or regenerate post content.

**Authentication:** Required

**Request Body:**
```typescript
{
  postId: string;
  prompt?: string;
}
```

**Returns:** Updated post content.

---

## Checklists API

Public API for browsing and filtering card checklists.

### GET /api/checklists

Fetch all sets with optional filtering.

**Query Parameters:**
- `search` (string, optional) - Search set names
- `manufacturer` (string, optional) - Filter by manufacturer name
- `release` (string, optional) - Filter by release slug
- `type` (string, optional) - Filter by set type (Base, Insert, Autograph, Memorabilia)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/checklists?manufacturer=Panini&type=Base"
```

**Example Response:**
```json
[
  {
    "id": "cm3set123",
    "name": "Obsidian Base",
    "slug": "2016-17-donruss-basketball-base",
    "type": "Base",
    "isParallel": false,
    "printRun": null,
    "expectedCardCount": 200,
    "release": {
      "name": "Obsidian Soccer",
      "year": "2024-25",
      "slug": "2016-17-panini-donruss-basketball",
      "manufacturer": {
        "name": "Panini"
      }
    },
    "_count": {
      "cards": 200
    }
  }
]
```

---

### GET /api/checklists/filters

Get available filter options for checklist browser.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/checklists/filters"
```

**Example Response:**
```json
{
  "manufacturers": [
    { "name": "Panini" },
    { "name": "Topps" }
  ],
  "releases": [
    {
      "slug": "2016-17-panini-donruss-basketball",
      "name": "Obsidian Soccer",
      "year": "2024-25"
    }
  ],
  "types": ["Base", "Insert", "Autograph", "Memorabilia"]
}
```

---

## Admin APIs

Admin-only endpoints for card scanning, smart matching, and bulk operations.

### POST /api/admin/scan-card

Scan and analyze a card image.

**Authentication:** Required (Admin)

**Request Body:**
```typescript
{
  imageUrl: string;
  mimeType: string;
}
```

**Returns:** Card analysis and matching results.

---

### POST /api/admin/identify-card

Identify a card from image with smart matching.

**Authentication:** Required (Admin)

**Request Body:**
```typescript
{
  imageUrl: string;
  mimeType: string;
}
```

**Returns:** Card identification with confidence scores and potential matches.

---

### POST /api/admin/smart-match

Match analyzed card data to existing cards.

**Authentication:** Required (Admin)

**Request Body:**
```typescript
{
  analyzedCard: {
    playerName: string;
    cardNumber?: string;
    manufacturer?: string;
    release?: string;
    year?: string;
  };
  releaseId?: string;
  setId?: string;
}
```

**Returns:** Array of matching cards with similarity scores.

---

### POST /api/admin/bulk-save-cards

Save multiple scanned cards at once.

**Authentication:** Required (Admin)

**Request Body:**
```typescript
{
  cards: Array<{
    setId: string;
    playerName: string;
    cardNumber: string;
    variant?: string;
    printRun?: number;
    imageFront?: string;
  }>;
}
```

**Returns:** Created card records.

---

### GET /api/admin/activity

Fetch recent admin activity log.

**Authentication:** Required (Admin)

**Example Response:**
```json
[
  {
    "id": "cm3act123",
    "action": "CREATE_CARD",
    "entityType": "Card",
    "entityId": "cm3card123",
    "details": "Created card: Jude Bellingham #1",
    "userId": "admin@3pt.bot",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

### GET /api/admin/stats

Get database statistics.

**Authentication:** Required (Admin)

**Example Response:**
```json
{
  "releases": 5,
  "sets": 149,
  "cards": 8977,
  "posts": 12,
  "manufacturers": 2
}
```

---

### GET/POST/DELETE /api/admin/cards/[id]

Manage individual cards.

**Authentication:** Required (Admin)

**GET:** Fetch card details
**POST:** Update card
**DELETE:** Delete card

---

### GET/POST/PUT/DELETE /api/admin/library/source-documents

Manage source document library.

**Authentication:** Required (Admin)

**Example POST Request:**
```bash
curl -X POST "http://localhost:3000/api/admin/library/source-documents" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "obsidian-sellsheet.pdf",
    "displayName": "Obsidian Soccer Sell Sheet",
    "blobUrl": "https://blob.vercel-storage.com/...",
    "mimeType": "application/pdf",
    "fileSize": 2048576,
    "documentType": "SELL_SHEET",
    "entityType": "RELEASE",
    "releaseId": "cm3rel123",
    "tags": ["2024-25", "Panini", "Obsidian"]
  }'
```

---

### POST /api/admin/library/source-documents/[id]/link

Link a source document to a release or post.

**Authentication:** Required (Admin)

**Request Body:**
```typescript
{
  entityType: 'RELEASE' | 'POST';
  entityId: string;
}
```

---

## Uploads API

File and image upload endpoints.

### POST /api/upload

Upload images and documents.

**Authentication:** Required

**Supported Formats:** PNG, JPG, GIF, WebP, PDF, CSV

**Request:** multipart/form-data

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/upload" \
  -F "file=@card-front.jpg"
```

**Example Response:**
```json
{
  "url": "https://blob.vercel-storage.com/card-front-abc123.jpg",
  "pathname": "card-front-abc123.jpg",
  "contentType": "image/jpeg",
  "size": 524288
}
```

---

### POST /api/uploads/release-images

Upload and associate images with release.

**Authentication:** Required

**Request:** multipart/form-data with `releaseId` field

**Example Response:**
```json
{
  "images": [
    {
      "id": "cm3img123",
      "url": "https://blob.vercel-storage.com/release-img-abc123.jpg",
      "type": "RELEASE",
      "releaseId": "cm3rel123",
      "order": 0
    }
  ]
}
```

---

### POST /api/upload/card-images

Upload card images (front/back).

**Authentication:** Required

**Request:** multipart/form-data with optional `cardId` field

---

## Error Handling

All API endpoints follow consistent error response format:

**Error Response Structure:**
```typescript
{
  error: string;         // Error message
  details?: string;      // Additional details
  code?: string;         // Error code
  statusCode: number;    // HTTP status code
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Example Error Response:**
```json
{
  "error": "Release not found",
  "details": "No release exists with slug '2024-25-invalid-slug'",
  "statusCode": 404
}
```

---

## URL Slug Conventions

The API auto-generates URL-friendly slugs for all entities.

### Release Slugs
**Format:** `{year}-{manufacturer}-{name}`
**Example:** `2016-17-panini-donruss-basketball`

### Set Slugs
**Format:** `{year}-{release}-{type-prefix}-{setname}[-{parallel}]`
**Type Prefixes:**
- Base: `base` (or omit if name includes "base")
- Insert: `insert`
- Autograph: `auto`
- Memorabilia: `mem`

**Examples:**
- Base: `2016-17-donruss-basketball-base`
- Insert: `2016-17-donruss-basketball-insert-elite-series`
- Autograph: `2016-17-donruss-basketball-auto-dominator-signatures`
- Parallel: `2016-17-donruss-optic-basketball-base-green-parallel-5`

### Card Slugs
**Format:** `{year}-{release}-{set}-{cardnumber}-{player}-{parallel}-{printrun}`

**Rules:**
- Base parallel cards exclude set name from slug
- Insert/Auto/Mem parallel cards INCLUDE set name for clarity
- 1/1 cards use "1-of-1" format
- Print runs appended to slug (e.g., `-5` for /5)

**Examples:**
- Base: `2016-17-absolute-basketball-base-133-jamal-mashburn-999`
- Base Parallel: `2016-17-donruss-optic-basketball-2-jahlil-okafor-green-5`
- Insert Parallel: `2016-17-donruss-optic-basketball-all-stars-1-kobe-bryant-gold-10`
- 1/1: `2016-17-donruss-basketball-all-stars-2-larry-bird-press-proof-black-1-of-1`

### Special Handling
- "Optic Base Set" → "optic" (base removed from slug)
- "Base Set" → "base" (base kept in slug)
- "1/1" or "1 of 1" → "1-of-1" in URLs
- Print runs: " /5" → "-5" in URLs

---

## Independent Parallel Architecture

Sets use an independent model for parallel variations where each set stores its own cards. See the **[Parallel Architecture Guide](./PARALLEL_ARCHITECTURE.md)** for complete documentation including:

- Architecture overview and benefits
- Database structure and naming conventions
- Query patterns with Prisma examples
- Sorting and display logic

**Quick Summary:**
- **All sets are standalone entities** with their own cards
- **Parallels identified by naming convention**: Sets with `-parallel` in slug
- **No parent-child relationships**: Each set is independent
- **Simpler data model**: Cards duplicated for independence, easier maintenance

---

## Rate Limiting

Currently no rate limiting is enforced. Future versions may implement:
- 100 requests per minute for authenticated users
- 10 requests per minute for public endpoints

---

## Changelog

### Version 1.1 (November 2025)
- Simplified Release model (removed approval workflow fields)
- Independent parallel set architecture (replaced parent-child model)
- Removed deprecated fields: `isApproved`, `approvedAt`, `approvedBy`, `postDate`, `summaryDate`, `sellSheetText`, `description` from Release
- Removed deprecated fields: `parentSetId`, `parallelSets`, `parentSet`, `totalCards` from Set
- Added `isParallel`, `baseSetSlug`, `expectedCardCount` to Set

### Version 1.0 (January 2025)
- Initial API release
- Claude Sonnet 4 AI integration
- Comprehensive admin APIs
- Public checklist browser

---

**Questions or Issues?**
See the [main README](../README.md) or contact the development team.
