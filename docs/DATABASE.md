# 3pt.bot Database Reference

Complete database schema documentation for the 3pt.bot soccer card platform.

## Table of Contents

- [Introduction](#introduction)
- [Schema Overview](#schema-overview)
- [Core Entities](#core-entities)
  - [Manufacturer](#manufacturer)
  - [Release](#release)
  - [Set](#set)
  - [Card](#card)
- [Content & Media](#content--media)
  - [Post](#post)
  - [Image](#image)
  - [SourceDocument](#sourcedocument)
- [Enums](#enums)
  - [SetType](#settype)
  - [ImageType](#imagetype)
  - [PostType](#posttype)
  - [DocumentType](#documenttype)
  - [SourceDocumentEntityType](#sourcedocumententitytype)
- [Relationships & Architecture](#relationships--architecture)
  - [Hierarchical Data Flow](#hierarchical-data-flow)
  - [Parent-Child Parallel Sets](#parent-child-parallel-sets)
  - [Content Linking Pattern](#content-linking-pattern)
- [Data Integrity](#data-integrity)
  - [Cascading Deletes](#cascading-deletes)
  - [Unique Constraints](#unique-constraints)
  - [Validation Rules](#validation-rules)
- [Common Query Patterns](#common-query-patterns)
  - [Fetch Release with Sets](#fetch-release-with-sets)
  - [Fetch Set with Parallel Info](#fetch-set-with-parallel-info)
  - [Fetch Card with Full Hierarchy](#fetch-card-with-full-hierarchy)
  - [Find Cards by Player](#find-cards-by-player)
- [Migration Guide](#migration-guide)
  - [Running Migrations](#running-migrations)
  - [Schema Changes](#schema-changes)
  - [Deprecated Fields](#deprecated-fields)

---

## Introduction

The 3pt.bot database uses PostgreSQL with Prisma ORM. The schema is designed around a **hierarchical data model** that mirrors the physical structure of trading card products:

```
Manufacturer → Release → Set → Card
```

This hierarchy provides:
- **Context for AI analysis** - Each level provides metadata for Claude AI operations
- **SEO-friendly URL structure** - Slugs follow the hierarchy (e.g., `/releases/2024-25-panini-obsidian-soccer/sets/obsidian-base`)
- **Data integrity** - Cascading relationships ensure consistency
- **Efficient querying** - Normalized structure with strategic denormalization

---

## Schema Overview

### Entity Summary

| Entity | Description | Key Use Cases |
|--------|-------------|---------------|
| **Manufacturer** | Card manufacturers (Panini, Topps, etc.) | Filtering, categorization, branding |
| **Release** | Product releases (e.g., "2024-25 Obsidian Soccer") | Release database, reviews, approval workflow |
| **Set** | Card sets within releases (Base, Insert, Auto, Mem) | Checklists, parallel architecture, set pages |
| **Card** | Individual cards with variants and serials | Card identification, collection tracking, detail pages |
| **Post** | Blog posts and articles | Content management, reviews, guides |
| **Image** | Images for all entity types | Visual content, galleries, card images |
| **SourceDocument** | Reference documents (PDFs, checklists) | AI analysis source material, admin library |

### Key Relationships

```
┌─────────────────┐
│  Manufacturer   │
│  (1)            │
└────────┬────────┘
         │
         │ 1:N
         ▼
    ┌────────────┐
    │  Release   │
    │  (1)       │
    └─────┬──────┘
          │
          │ 1:N
          ▼
     ┌────────┐
     │  Set   │◄───┐ Parent-child
     │  (1)   │    │ parallel
     └────┬───┘    │ relationship
          │        │ (self-referential)
          │ 1:N    │
          ▼        │
      ┌──────┐    │
      │ Card │────┘
      │      │
      └──────┘

Optional References (Posts can link to Release, Set, or Card)
Images and SourceDocuments use direct foreign keys with type discriminators
```

---

## Core Entities

### Manufacturer

Card manufacturers like Panini, Topps, Upper Deck, etc.

**Fields:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | String | ✓ | ✓ | `cuid()` | Primary key |
| `name` | String | ✓ | ✓ | - | Manufacturer name (e.g., "Panini") |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |
| `updatedAt` | DateTime | ✓ | | `now()` | Last updated timestamp |

**Relationships:**
- Has many: `Release[]` (one-to-many)

**Prisma Schema:**
```prisma
model Manufacturer {
  id        String    @id @default(cuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  releases  Release[]
}
```

**Usage Examples:**
```typescript
// Create manufacturer
const manufacturer = await prisma.manufacturer.create({
  data: {
    name: "Panini"
  }
});

// Fetch with releases
const manufacturer = await prisma.manufacturer.findUnique({
  where: { name: "Panini" },
  include: { releases: true }
});
```

---

### Release

Product releases (e.g., "2024-25 Panini Obsidian Soccer").

**Fields:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | String | ✓ | ✓ | `cuid()` | Primary key |
| `name` | String | ✓ | | - | Release name (e.g., "Obsidian Soccer") |
| `year` | String | | | - | Release year or season (e.g., "2024-25") |
| `slug` | String | ✓ | ✓ | - | URL slug (auto-generated, e.g., "2024-25-panini-obsidian-soccer") |
| `summary` | String (Text) | | | - | AI-generated summary of the release |
| `releaseDate` | String | | | - | Free-form release date (e.g., "May 4, 2025" or "1978") |
| `manufacturerId` | String | ✓ | | - | Foreign key to Manufacturer |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |
| `updatedAt` | DateTime | ✓ | | `now()` | Last updated timestamp |

**Relationships:**
- Belongs to: `Manufacturer` (many-to-one)
- Has many: `Set[]` (one-to-many)
- Has many: `Post[]` (one-to-many, optional reference)
- Has many: `Image[]` (one-to-many)
- Has many: `SourceDocument[]` (one-to-many)

**Prisma Schema:**
```prisma
model Release {
  id             String          @id @default(cuid())
  name           String
  year           String?
  slug           String          @unique
  summary        String?         @db.Text
  releaseDate    String?
  manufacturerId String
  manufacturer   Manufacturer    @relation(fields: [manufacturerId], references: [id], onDelete: Cascade)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  sets           Set[]
  posts          Post[]
  images         Image[]
  sourceDocuments SourceDocument[]
}
```

**Field Notes:**

- `releaseDate` (String): Free-form date for display (e.g., "May 4, 2025", "Spring 2025", "1978")
- `summary` (String): AI-generated description based on source materials
- All releases are publicly visible (no approval workflow)

**Usage Examples:**
```typescript
// Create release
const release = await prisma.release.create({
  data: {
    name: "Obsidian Soccer",
    year: "2024-25",
    slug: "2024-25-panini-obsidian-soccer",
    releaseDate: "May 4, 2025",
    manufacturerId: manufacturer.id
  }
});

// Fetch all releases
const releases = await prisma.release.findMany({
  include: {
    manufacturer: true,
    sets: true,
    images: { where: { type: 'RELEASE' }, orderBy: { order: 'asc' } }
  },
  orderBy: { createdAt: 'desc' }
});

// Fetch single release with full data
const release = await prisma.release.findUnique({
  where: { slug: "2024-25-panini-obsidian-soccer" },
  include: {
    manufacturer: true,
    sets: {
      include: { _count: { select: { cards: true } } }
    },
    images: { orderBy: { order: 'asc' } },
    sourceDocuments: true
  }
});
```

---

### Set

Card sets within releases (Base, Insert, Autograph, Memorabilia).

**Fields:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | String | ✓ | ✓ | `cuid()` | Primary key |
| `name` | String | ✓ | | - | Set name (e.g., "Obsidian Base", "Electric Etch Orange") |
| `slug` | String | ✓ | ✓ | - | URL slug (auto-generated) |
| `type` | SetType | ✓ | | `Base` | Set type enum (Base, Insert, Autograph, Memorabilia) |
| `releaseId` | String | ✓ | | - | Foreign key to Release |
| `expectedCardCount` | Int | | | - | Official/expected number of cards from manufacturer's checklist |
| `printRun` | Int | | | - | Standard print run for all cards (e.g., 99 for "/99" parallels) |
| `description` | String | | | - | Optional set description |
| `sourceText` | String (Text) | | | - | Original checklist text for reference |
| `isParallel` | Boolean | ✓ | | `false` | True if this is a parallel set (identified by naming convention) |
| `baseSetSlug` | String | | | - | Reference to the base set's slug (for parallels only) |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |
| `updatedAt` | DateTime | ✓ | | `now()` | Last updated timestamp |

**Relationships:**
- Belongs to: `Release` (many-to-one)
- Has many: `Card[]` (one-to-many)
- Has many: `Post[]` (one-to-many, optional reference)
- Has many: `Image[]` (one-to-many)

**Prisma Schema:**
```prisma
model Set {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  type              SetType  @default(Base)
  releaseId         String
  release           Release  @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  expectedCardCount Int?
  printRun          Int?
  description       String?
  sourceText        String?  @db.Text
  isParallel        Boolean  @default(false)
  baseSetSlug       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  cards             Card[]
  posts             Post[]
  images            Image[]
}
```

**Field Notes:**

**Set Types:**
- `Base`: Standard base cards
- `Insert`: Insert sets (numbered or unnumbered)
- `Autograph`: Autograph cards
- `Memorabilia`: Memorabilia/relic cards

**Print Run Fields:**
- `printRun`: Standard print run for all cards in set (e.g., 99 for "/99" parallels)
- `expectedCardCount`: Official card count from manufacturer's checklist
- For individual card print runs, use `Card.printRun` instead

**Independent Parallel Architecture:**
All sets are standalone entities. Parallels are identified by naming convention (slug contains `-parallel`).
See [Parallel Architecture Guide](/docs/PARALLEL_ARCHITECTURE.md) for detailed explanation.

**Usage Examples:**
```typescript
// Create base set with cards
const baseSet = await prisma.set.create({
  data: {
    name: "Obsidian Base",
    slug: "2024-25-obsidian-soccer-base-obsidian-base",
    type: "Base",
    releaseId: release.id,
    expectedCardCount: 145,
    isParallel: false,
    cards: {
      create: [
        { playerName: "Jude Bellingham", cardNumber: "1" },
        { playerName: "Kylian Mbappe", cardNumber: "2" }
        // ... more cards
      ]
    }
  }
});

// Create parallel set (independent, with its own cards)
const parallelSet = await prisma.set.create({
  data: {
    name: "Electric Etch Orange",
    slug: "2024-25-obsidian-soccer-base-obsidian-base-electric-etch-orange-parallel-149",
    type: "Base",
    releaseId: release.id,
    printRun: 149,
    isParallel: true,
    baseSetSlug: "2024-25-obsidian-soccer-base-obsidian-base",
    cards: {
      create: [
        { playerName: "Jude Bellingham", cardNumber: "1", printRun: 149 },
        { playerName: "Kylian Mbappe", cardNumber: "2", printRun: 149 }
        // ... same cards as base, with parallel-specific data
      ]
    }
  }
});

// Fetch set with cards
const set = await prisma.set.findUnique({
  where: { slug: "2024-25-obsidian-soccer-base-obsidian-base" },
  include: {
    release: { include: { manufacturer: true } },
    cards: { orderBy: { cardNumber: 'asc' } },
    _count: { select: { cards: true } }
  }
});
```

---

### Card

Individual cards with variants, serials, and metadata.

**Fields:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | String | ✓ | ✓ | `cuid()` | Primary key |
| `slug` | String | | ✓ | - | URL slug (auto-generated, includes print run) |
| `playerName` | String | | | - | Player name |
| `team` | String | | | - | Player team |
| `cardNumber` | String | | | - | Card number (e.g., "1", "RC-1") |
| `variant` | String | | | - | Basic variant name (e.g., "Refractor", "Chrome") |
| `parallelType` | String | | | - | Specific parallel type (e.g., "Gold Refractor") |
| `serialNumber` | String | | | - | Serial number if numbered (e.g., "123/299") |
| `isNumbered` | Boolean | ✓ | | `false` | Flag for numbered cards |
| `printRun` | Int | | | - | Total print run (e.g., 299 for /299) |
| `numbered` | String | | | - | Display string (e.g., "1 of 1", "/99") |
| `rarity` | String | | | - | Rarity level (base, rare, super_rare, etc.) |
| `finish` | String | | | - | Card finish (refractor, chrome, matte, etc.) |
| `hasAutograph` | Boolean | ✓ | | `false` | Has autograph |
| `hasMemorabilia` | Boolean | ✓ | | `false` | Has memorabilia/relic |
| `specialFeatures` | String[] | ✓ | | `[]` | Special features (rookie, insert, short_print) |
| `colorVariant` | String | | | - | Color designation (gold, red, blue, etc.) |
| `detectionConfidence` | Int | | | - | AI confidence score (0-100) |
| `detectionMethods` | String[] | ✓ | | `[]` | Detection methods (ocr, visual, ai_analysis) |
| `detectedText` | String | | | - | Raw OCR text for reference |
| `imageFront` | String | | | - | Front image URL |
| `imageBack` | String | | | - | Back image URL |
| `notes` | String (Text) | | | - | Internal admin notes |
| `setId` | String | ✓ | | - | Foreign key to Set |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |
| `updatedAt` | DateTime | ✓ | | `now()` | Last updated timestamp |

**Relationships:**
- Belongs to: `Set` (many-to-one)
- Has many: `Post[]` (one-to-many, optional reference)
- Has many: `Image[]` (one-to-many)

**Prisma Schema:**
```prisma
model Card {
  id                    String   @id @default(cuid())
  slug                  String?  @unique
  playerName            String?
  team                  String?
  cardNumber            String?
  variant               String?
  parallelType          String?
  serialNumber          String?
  isNumbered            Boolean  @default(false)
  printRun              Int?
  numbered              String?
  rarity                String?
  finish                String?
  hasAutograph          Boolean  @default(false)
  hasMemorabilia        Boolean  @default(false)
  specialFeatures       String[]
  colorVariant          String?
  detectionConfidence   Int?
  detectionMethods      String[]
  detectedText          String?
  imageFront            String?
  imageBack             String?
  notes            String?  @db.Text
  setId                 String
  set                   Set      @relation(fields: [setId], references: [id], onDelete: Cascade)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  posts                 Post[]
  images                Image[]
}
```

**Field Notes:**

**Serial Number Handling:**
Cards use multiple fields to handle serial numbering:
- `serialNumber` (String): Raw format as detected (e.g., "/49", "1/1", "123/299")
- `printRun` (Int): Numeric total print run (e.g., 49, 1, 299)
- `numbered` (String): Display format for UI (e.g., "/49", "1 of 1")
- `isNumbered` (Boolean): Quick flag for numbered cards

**Parallel/Variation System:**
- `variant`: Basic variant name (e.g., "Refractor")
- `parallelType`: Specific parallel designation (e.g., "Gold Refractor", "Red Wave")
- `colorVariant`: Color designation extracted from parallel name
- `specialFeatures`: Array of attributes (e.g., ["rookie", "short_print"])

**AI Detection Metadata:**
- `detectionConfidence`: 0-100 score from Claude AI analysis
- `detectionMethods`: Array of methods used (e.g., ["ocr", "ai_analysis"])
- `detectedText`: Raw OCR text for debugging and verification

**Usage Examples:**
```typescript
// Create base card
const card = await prisma.card.create({
  data: {
    playerName: "Jude Bellingham",
    team: "Real Madrid",
    cardNumber: "1",
    setId: set.id,
    printRun: 145,
    numbered: "/145",
    isNumbered: true
  }
});

// Create numbered parallel card
const parallelCard = await prisma.card.create({
  data: {
    playerName: "Jude Bellingham",
    team: "Real Madrid",
    cardNumber: "1",
    variant: "Electric Etch Orange",
    parallelType: "Electric Etch Orange",
    colorVariant: "orange",
    setId: parallelSet.id,
    printRun: 149,
    numbered: "/149",
    isNumbered: true,
    slug: "2024-25-obsidian-soccer-1-jude-bellingham-electric-etch-orange-149"
  }
});

// Find cards by player
const cards = await prisma.card.findMany({
  where: {
    playerName: { contains: "Bellingham", mode: 'insensitive' }
  },
  include: {
    set: {
      include: {
        release: {
          include: { manufacturer: true }
        }
      }
    }
  },
  orderBy: [
    { set: { release: { postDate: 'desc' } } },
    { cardNumber: 'asc' }
  ]
});
```

---

## Content & Media

### Post

Blog posts, reviews, guides, and articles.

**Fields:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | String | ✓ | ✓ | `cuid()` | Primary key |
| `title` | String | ✓ | | - | Post title |
| `slug` | String | ✓ | ✓ | - | URL slug |
| `content` | String | ✓ | | - | Post content (markdown or HTML) |
| `excerpt` | String | | | - | Short excerpt for previews |
| `type` | PostType | ✓ | | - | Post type enum (NEWS, REVIEW, GUIDE, ANALYSIS, GENERAL) |
| `published` | Boolean | ✓ | | `false` | Published flag |
| `postDate` | DateTime | | | - | Date for chronological ordering (defaults to createdAt) |
| `releaseId` | String | | | - | Optional foreign key to Release |
| `setId` | String | | | - | Optional foreign key to Set |
| `cardId` | String | | | - | Optional foreign key to Card |
| `authorId` | String | ✓ | | - | References `neon_auth.admin_users.id` (not enforced) |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |
| `updatedAt` | DateTime | ✓ | | `now()` | Last updated timestamp |

**Relationships:**
- Belongs to: `Release` (many-to-one, optional)
- Belongs to: `Set` (many-to-one, optional)
- Belongs to: `Card` (many-to-one, optional)
- Has many: `Image[]` (one-to-many)
- Has many: `SourceDocument[]` (one-to-many)

**Prisma Schema:**
```prisma
model Post {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  content     String
  excerpt     String?
  type        PostType
  published   Boolean     @default(false)
  postDate    DateTime?
  releaseId   String?
  release     Release?    @relation(fields: [releaseId], references: [id])
  setId       String?
  set         Set?        @relation(fields: [setId], references: [id])
  cardId      String?
  card        Card?       @relation(fields: [cardId], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  authorId    String
  images      Image[]
  sourceDocuments SourceDocument[]
}
```

**Usage Examples:**
```typescript
// Create release review post
const post = await prisma.post.create({
  data: {
    title: "2024-25 Panini Obsidian Soccer Review",
    slug: "2024-25-panini-obsidian-soccer-review",
    content: "Full review content here...",
    excerpt: "A comprehensive review of Panini's latest soccer release.",
    type: "REVIEW",
    published: true,
    postDate: new Date(),
    releaseId: release.id,
    authorId: "admin-user-id"
  }
});

// Fetch published posts
const posts = await prisma.post.findMany({
  where: { published: true },
  include: {
    release: { include: { manufacturer: true } },
    images: { orderBy: { order: 'asc' } }
  },
  orderBy: { postDate: 'desc' }
});
```

---

### Image

Images for releases, sets, cards, and posts.

**Fields:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | String | ✓ | ✓ | `cuid()` | Primary key |
| `url` | String | ✓ | | - | Image URL (Vercel Blob or external) |
| `caption` | String | | | - | Image caption |
| `order` | Int | ✓ | | `0` | Display order for galleries |
| `type` | ImageType | ✓ | | - | Type enum (RELEASE, SET, CARD, POST) |
| `releaseId` | String | | | - | Foreign key to Release (only set if type=RELEASE) |
| `setId` | String | | | - | Foreign key to Set (only set if type=SET) |
| `cardId` | String | | | - | Foreign key to Card (only set if type=CARD) |
| `postId` | String | | | - | Foreign key to Post (only set if type=POST) |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |

**Relationships:**
- Belongs to: `Release` (many-to-one, optional)
- Belongs to: `Set` (many-to-one, optional)
- Belongs to: `Card` (many-to-one, optional)
- Belongs to: `Post` (many-to-one, optional)

**Prisma Schema:**
```prisma
model Image {
  id        String    @id @default(cuid())
  url       String
  caption   String?
  order     Int       @default(0)
  type      ImageType
  createdAt DateTime  @default(now())
  releaseId String?
  release   Release?  @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  setId     String?
  set       Set?      @relation(fields: [setId], references: [id], onDelete: Cascade)
  cardId    String?
  card      Card?     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  postId    String?
  post      Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

**Field Notes:**

**Type Discriminator Pattern:**
The `type` field determines which foreign key is set:
- `type: "RELEASE"` → `releaseId` is set
- `type: "SET"` → `setId` is set
- `type: "CARD"` → `cardId` is set
- `type: "POST"` → `postId` is set

This pattern avoids junction tables while maintaining clear relationships.

**Usage Examples:**
```typescript
// Create release image
const image = await prisma.image.create({
  data: {
    url: "https://blob.vercel-storage.com/obsidian-box.jpg",
    caption: "2024-25 Panini Obsidian Soccer Hobby Box",
    type: "RELEASE",
    releaseId: release.id,
    order: 0
  }
});

// Fetch images for entity
const images = await prisma.image.findMany({
  where: {
    releaseId: release.id,
    type: "RELEASE"
  },
  orderBy: { order: 'asc' }
});
```

---

### SourceDocument

Reference documents (sell sheets, checklists, PDFs) used for content creation.

**Fields:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `id` | String | ✓ | ✓ | `cuid()` | Primary key |
| `filename` | String | ✓ | | - | Original filename |
| `displayName` | String | ✓ | | - | User-friendly name (editable) |
| `blobUrl` | String | ✓ | | - | Vercel Blob storage URL |
| `mimeType` | String | ✓ | | - | MIME type (e.g., "application/pdf") |
| `documentType` | DocumentType | ✓ | | - | Type enum (SELL_SHEET, CHECKLIST, etc.) |
| `entityType` | SourceDocumentEntityType | ✓ | | - | Entity type enum (RELEASE, POST) |
| `tags` | String[] | ✓ | | `[]` | Searchable tags |
| `extractedText` | String (Text) | | | - | OCR/extracted text for search |
| `uploadedById` | String | ✓ | | - | References `neon_auth.admin_users.id` |
| `uploadedAt` | DateTime | ✓ | | `now()` | Upload timestamp |
| `usageContext` | String | | | - | Usage context notes |
| `description` | String (Text) | | | - | Admin notes about document |
| `releaseId` | String | | | - | Foreign key to Release (only set if entityType=RELEASE) |
| `postId` | String | | | - | Foreign key to Post (only set if entityType=POST) |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |
| `updatedAt` | DateTime | ✓ | | `now()` | Last updated timestamp |

**Relationships:**
- Belongs to: `Release` (many-to-one, optional)
- Belongs to: `Post` (many-to-one, optional)

**Prisma Schema:**
```prisma
model SourceDocument {
  id              String       @id @default(cuid())
  filename        String
  displayName     String
  blobUrl         String
  mimeType        String
  documentType    DocumentType
  entityType      SourceDocumentEntityType
  tags            String[]
  extractedText   String?      @db.Text
  uploadedById    String
  uploadedAt      DateTime     @default(now())
  usageContext    String?
  description     String?      @db.Text
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  releaseId       String?
  release         Release?     @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  postId          String?
  post            Post?        @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

**Usage Examples:**
```typescript
// Upload source document
const doc = await prisma.sourceDocument.create({
  data: {
    filename: "obsidian-sell-sheet.pdf",
    displayName: "Obsidian Soccer Sell Sheet",
    blobUrl: blobUrl,
    mimeType: "application/pdf",
    documentType: "SELL_SHEET",
    entityType: "RELEASE",
    releaseId: release.id,
    tags: ["2024-25", "Panini", "Obsidian"],
    uploadedById: "admin-user-id"
  }
});
```

---

## Enums

### SetType

Card set type classification.

```prisma
enum SetType {
  Base         // Standard base cards
  Autograph    // Autograph cards
  Memorabilia  // Memorabilia/relic cards
  Insert       // Insert sets
}
```

**Usage:**
- Categorization on release pages
- Filtering in checklist browser
- URL slug generation (auto, insert, mem prefixes)

---

### ImageType

Image type discriminator.

```prisma
enum ImageType {
  RELEASE    // Release product image
  SET        // Set/insert image
  CARD       // Individual card image
  POST       // Post/article image
}
```

**Usage:**
Determines which foreign key is set in the `Image` model.

---

### PostType

Post/article type classification.

```prisma
enum PostType {
  NEWS       // News article
  REVIEW     // Product review
  GUIDE      // How-to or buying guide
  ANALYSIS   // Market analysis or trends
  GENERAL    // General content
}
```

**Usage:**
- Content categorization
- Filtering in post lists
- SEO metadata generation

---

### DocumentType

Source document type classification.

```prisma
enum DocumentType {
  SELL_SHEET       // Product sell sheets
  CHECKLIST        // Card checklists
  PRESS_RELEASE    // Official press releases
  PRICE_GUIDE      // Pricing information
  IMAGE            // Reference images
  OTHER            // Other document types
}
```

**Usage:**
- Document library organization
- AI analysis source selection
- Admin filtering and search

---

### SourceDocumentEntityType

Entity type discriminator for source documents.

```prisma
enum SourceDocumentEntityType {
  RELEASE  // Document for a release
  POST     // Document for a post/article
}
```

**Usage:**
Determines which foreign key is set in the `SourceDocument` model.

---

## Relationships & Architecture

### Hierarchical Data Flow

The database follows a strict hierarchy that mirrors physical card products:

```
Manufacturer
    └── Release (Product)
         └── Set (Base, Insert, Auto, Mem)
              └── Card (Individual cards with variants)
```

**Benefits:**
1. **Context for AI:** Each level provides metadata for Claude AI analysis
2. **URL Structure:** Slugs follow hierarchy for SEO
3. **Data Integrity:** Cascading deletes ensure consistency
4. **Query Efficiency:** Normalized structure with strategic denormalization

**Example Hierarchy:**
```
Panini
  └── 2024-25 Obsidian Soccer
       ├── Obsidian Base (145 cards)
       │    ├── Card #1: Jude Bellingham
       │    └── Card #2: Kylian Mbappe
       ├── Electric Etch Orange (parallel of Obsidian Base, /149)
       └── Equinox Insert (20 cards)
            └── Card #1: Erling Haaland
```

---

### Independent Parallel Architecture

All sets are **standalone entities** with their own cards. Parallels are identified by naming convention.

**Key Concepts:**

1. **Base Sets** (`isParallel = false`)
   - Standard sets with their own card checklist
   - Example: "Obsidian Base" with 145 cards

2. **Parallel Sets** (`isParallel = true`)
   - Identified by `-parallel` in slug
   - Store their own cards (duplicated from base)
   - Reference base set via `baseSetSlug` for grouping
   - Example: "Electric Etch Orange /149" has same cards as base

**Database Structure:**

```typescript
// Base set
const baseSet = {
  id: 'abc123',
  name: 'Obsidian Base',
  slug: '2024-25-obsidian-soccer-base-obsidian-base',
  type: 'Base',
  isParallel: false,
  baseSetSlug: null,
  cards: [card1, card2, ...]   // Cards stored here
};

// Parallel set (independent)
const parallelSet = {
  id: 'xyz789',
  name: 'Electric Etch Orange',
  slug: '2024-25-obsidian-soccer-base-obsidian-base-electric-etch-orange-parallel-149',
  type: 'Base',
  isParallel: true,
  baseSetSlug: '2024-25-obsidian-soccer-base-obsidian-base',
  printRun: 149,
  cards: [card1, card2, ...]   // Own cards (duplicated)
};
```

**Benefits:**
- **Simplicity:** No complex parent-child relationships
- **Independence:** Each set fully self-contained
- **Flexibility:** Parallels can have different card lists if needed
- **Query Performance:** Simple queries without joins

**Set Sorting:**
Sets are sorted to group parallels with their base sets:
1. Non-parallels first (alphabetical)
2. Unnumbered parallels next
3. Numbered parallels (highest to lowest print run)

See [Parallel Architecture Guide](/docs/PARALLEL_ARCHITECTURE.md) for implementation details.

---

### Content Linking Pattern

Posts, Images, and SourceDocuments can link to multiple entity types using **direct foreign keys with type discriminators**.

**Pattern:**

```typescript
// Instead of junction tables, use:
{
  type: ImageType,           // Discriminator enum
  releaseId?: string,        // Foreign key (optional)
  setId?: string,            // Foreign key (optional)
  cardId?: string,           // Foreign key (optional)
  postId?: string            // Foreign key (optional)
}
```

**Benefits:**
- Simpler schema (no junction tables)
- Type-safe queries
- Easier to understand and maintain
- Clear ownership (only one foreign key set at a time)

**Query Pattern:**

```typescript
// Create image for release
await prisma.image.create({
  data: {
    url: imageUrl,
    type: "RELEASE",
    releaseId: release.id  // Only releaseId is set
  }
});

// Fetch all images for release
const images = await prisma.image.findMany({
  where: {
    releaseId: release.id,
    type: "RELEASE"
  }
});
```

---

## Data Integrity

### Cascading Deletes

All relationships use cascading deletes to maintain referential integrity:

| Parent | Child | Behavior |
|--------|-------|----------|
| Manufacturer | Release | CASCADE |
| Release | Set | CASCADE |
| Release | Image | CASCADE |
| Release | SourceDocument | CASCADE |
| Set | Card | CASCADE |
| Set | Image | CASCADE |
| Card | Image | CASCADE |
| Post | Image | CASCADE |
| Post | SourceDocument | CASCADE |

**Example:**
Deleting a Release automatically deletes:
- All Sets in that release
- All Cards in those sets
- All Images for the release and its sets/cards
- All SourceDocuments for the release

**Important Notes:**
- Post references to Release/Set/Card are **optional** and do NOT cascade (posts remain if referenced entity is deleted)
- Each set is independent, deleting a base set does NOT delete related parallel sets

---

### Unique Constraints

| Model | Field(s) | Notes |
|-------|----------|-------|
| Manufacturer | `name` | Prevents duplicate manufacturers |
| Release | `slug` | SEO-friendly unique URLs |
| Set | `slug` | SEO-friendly unique URLs |
| Card | `slug` | SEO-friendly unique URLs (includes print run for numbered cards) |
| Post | `slug` | SEO-friendly unique URLs |
| Image | None | Images can be reused across entities |
| SourceDocument | None | Documents can be reused |

**Slug Generation:**
All slugs are auto-generated using `/lib/slugGenerator.ts` functions. See [URL Slug Conventions](../docs/API.md#url-slug-conventions) in API documentation for details.

---

### Validation Rules

**At Database Level (Prisma):**
- Required fields enforced with `@default()` or required type
- Enum values validated automatically
- Foreign key constraints enforced
- Unique constraints enforced
- Cascading deletes configured

**At Application Level:**
- Slug uniqueness checked before creation
- Print run validation (must be positive integer)
- File upload limits (enforced in API routes)
- Admin authentication for write operations

---

## Common Query Patterns

### Fetch Release with Sets

```typescript
const release = await prisma.release.findUnique({
  where: { slug: "2024-25-panini-obsidian-soccer" },
  include: {
    manufacturer: true,
    sets: {
      include: {
        _count: { select: { cards: true } }
      },
      orderBy: { name: 'asc' }
    },
    images: {
      where: { type: 'RELEASE' },
      orderBy: { order: 'asc' }
    },
    sourceDocuments: {
      orderBy: { uploadedAt: 'desc' }
    }
  }
});
```

---

### Fetch Set with Cards

```typescript
const set = await prisma.set.findUnique({
  where: { slug: params.slug },
  include: {
    release: {
      include: { manufacturer: true }
    },
    cards: {
      orderBy: { cardNumber: 'asc' }
    },
    images: {
      where: { type: 'SET' },
      orderBy: { order: 'asc' }
    }
  }
});
```

---

### Fetch Card with Full Hierarchy

```typescript
const card = await prisma.card.findUnique({
  where: { slug: params.slug },
  include: {
    set: {
      include: {
        release: {
          include: { manufacturer: true }
        }
      }
    },
    images: {
      where: { type: 'CARD' },
      orderBy: { order: 'asc' }
    }
  }
});

// Get manufacturer name
const manufacturerName = card.set.release.manufacturer.name;
```

---

### Find Cards by Player

```typescript
const cards = await prisma.card.findMany({
  where: {
    playerName: {
      contains: "Bellingham",
      mode: 'insensitive'
    }
  },
  include: {
    set: {
      include: {
        release: {
          include: { manufacturer: true }
        }
      }
    }
  },
  orderBy: [
    { set: { release: { createdAt: 'desc' } } },
    { cardNumber: 'asc' }
  ]
});
```

---

### Fetch All Releases

```typescript
const releases = await prisma.release.findMany({
  include: {
    manufacturer: true,
    sets: {
      include: {
        _count: { select: { cards: true } }
      }
    },
    images: {
      where: { type: 'RELEASE' },
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## Migration Guide

### Running Migrations

**Development:**
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Generate Prisma Client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

**Production:**
```bash
# Apply pending migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

### Schema Changes

**Before Making Changes:**
1. Review current schema in `prisma/schema.prisma`
2. Consider impact on existing data
3. Plan data migration strategy if needed
4. Update TypeScript types in API routes

**After Making Changes:**
1. Create migration: `npx prisma migrate dev --name descriptive_name`
2. Update affected API routes and components
3. Update tests if applicable
4. Update documentation (this file, API.md, CLAUDE.md)
5. Test thoroughly in development before deploying

**Breaking Changes:**
- Always use migration scripts for data transformations
- Never delete fields with existing data without migrating first
- Use `@default()` values when adding required fields to existing models
- Consider deprecation period for major schema changes

---

### Removed Fields (November 2025)

The following fields were removed from the schema as part of simplification:

**Release Model:**
- `sourceFiles` (Json) - Use `SourceDocument` table instead
- `description` - Use `summary` instead
- `isApproved`, `approvedAt`, `approvedBy` - All releases now public
- `postDate`, `summaryDate` - Simplified date handling
- `sellSheetText` - Use `SourceDocument.extractedText` instead

**Set Model:**
- `parallels` (Json) - Replaced with independent parallel architecture
- `parentSetId`, `parentSet`, `parallelSets` - Removed parent-child relationships
- `hasVariableChecklist`, `mirrorsParentChecklist` - No longer needed
- `isBaseSet` - Use `type` enum instead
- `totalCards` - Use `expectedCardCount` instead

**SourceDocument Model:**
- `fileSize` - No longer tracked
- `lastUsedAt`, `usageCount` - Usage tracking removed

---

## Additional Resources

- [API Reference](./API.md) - Complete REST API documentation
- [Development Guide](../.claude/CLAUDE.md) - Development patterns and best practices
- [Prisma Documentation](https://www.prisma.io/docs) - Official Prisma ORM docs
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - PostgreSQL reference

---

*Last Updated: 2025-11-26*
