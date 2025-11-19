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
| `description` | String | | | - | **DEPRECATED:** Use `summary` instead |
| `summary` | String (Text) | | | - | AI-generated summary of the release |
| `summaryDate` | DateTime | | | - | When summary was generated/updated |
| `releaseDate` | String | | | - | Free-form release date (e.g., "May 4, 2025" or "1978") |
| `postDate` | DateTime | | | - | Date for chronological ordering (auto-populated or manual) |
| `isApproved` | Boolean | ✓ | | `false` | Approval flag for public visibility |
| `approvedAt` | DateTime | | | - | Approval timestamp |
| `approvedBy` | String | | | - | Email of admin who approved |
| `sellSheetText` | String (Text) | | | - | Extracted text from sell sheets for AI analysis |
| `sourceFiles` | Json | | | - | Array of `{url, type, filename}` for uploaded files |
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
  description    String?         @db.Text // Legacy field
  summary        String?         @db.Text
  summaryDate    DateTime?
  releaseDate    String?
  postDate       DateTime?
  isApproved     Boolean         @default(false)
  approvedAt     DateTime?
  approvedBy     String?
  sellSheetText  String?         @db.Text
  sourceFiles    Json?
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

**Release Date Fields:**
- `releaseDate` (String): Free-form date for display (e.g., "May 4, 2025", "Spring 2025", "1978")
- `postDate` (DateTime): Structured date for sorting and filtering (auto-populated from `releaseDate` or manually set)
- `summaryDate` (DateTime): When AI-generated summary was created/updated

**Approval Workflow:**
Only releases with `isApproved = true` are shown on public pages. This allows admins to:
- Build release data privately before making it public
- Schedule releases for future publication
- Review content before exposing it to users

**Usage Examples:**
```typescript
// Create release with approval
const release = await prisma.release.create({
  data: {
    name: "Obsidian Soccer",
    year: "2024-25",
    slug: "2024-25-panini-obsidian-soccer",
    releaseDate: "May 4, 2025",
    postDate: new Date("2025-05-04"),
    manufacturerId: manufacturer.id,
    isApproved: true,
    approvedBy: "admin@3pt.bot",
    approvedAt: new Date()
  }
});

// Fetch approved releases only (public view)
const releases = await prisma.release.findMany({
  where: { isApproved: true },
  include: {
    manufacturer: true,
    sets: {
      where: { parentSetId: null } // Parent sets only
    },
    images: true
  },
  orderBy: { postDate: 'desc' }
});

// Fetch single release with full data
const release = await prisma.release.findUnique({
  where: { slug: "2024-25-panini-obsidian-soccer" },
  include: {
    manufacturer: true,
    sets: {
      where: { parentSetId: null },
      include: {
        parallelSets: true,
        _count: { select: { cards: true } }
      }
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
| `isBaseSet` | Boolean | ✓ | | `false` | **DEPRECATED:** Use `type` instead |
| `releaseId` | String | ✓ | | - | Foreign key to Release |
| `totalCards` | String | | | - | Total cards in set (e.g., "200", "varies") |
| `printRun` | Int | | | - | Standard print run for all cards (e.g., 99 for "/99" parallels) |
| `description` | String | | | - | Optional set description |
| `sourceText` | String (Text) | | | - | Original checklist text (parent sets only) |
| `parallels` | Json | | | - | **DEPRECATED:** Use `parallelSets` relation instead |
| `parentSetId` | String | | | - | Foreign key to parent set (null for parent sets) |
| `hasVariableChecklist` | Boolean | ✓ | | `false` | True if parallels have different checklists |
| `mirrorsParentChecklist` | Boolean | ✓ | | `true` | True if parallel cards mirror parent's checklist |
| `createdAt` | DateTime | ✓ | | `now()` | Created timestamp |
| `updatedAt` | DateTime | ✓ | | `now()` | Last updated timestamp |

**Relationships:**
- Belongs to: `Release` (many-to-one)
- Belongs to: `Set` (many-to-one, self-referential for parallels)
- Has many: `Set[]` (one-to-many, self-referential for parallels)
- Has many: `Card[]` (one-to-many)
- Has many: `Post[]` (one-to-many, optional reference)
- Has many: `Image[]` (one-to-many)

**Prisma Schema:**
```prisma
model Set {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  type        SetType  @default(Base)
  isBaseSet   Boolean  @default(false) // Deprecated
  releaseId   String
  release     Release  @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  totalCards  String?
  printRun    Int?
  description String?
  sourceText  String?  @db.Text
  parallels   Json?    // DEPRECATED
  parentSetId String?
  parentSet   Set?     @relation("ParallelSets", fields: [parentSetId], references: [id], onDelete: Cascade)
  parallelSets Set[]   @relation("ParallelSets")
  hasVariableChecklist Boolean @default(false)
  mirrorsParentChecklist Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cards       Card[]
  posts       Post[]
  images      Image[]
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
- `totalCards`: Display string for total cards (can be "varies" or "or fewer")
- For individual card print runs, use `Card.printRun` instead

**Parent-Child Parallel Architecture:**
See [Parent-Child Parallel Sets](#parent-child-parallel-sets) section below for detailed explanation.

**Usage Examples:**
```typescript
// Create parent set with cards
const parentSet = await prisma.set.create({
  data: {
    name: "Obsidian Base",
    slug: "2024-25-obsidian-soccer-obsidian-base",
    type: "Base",
    releaseId: release.id,
    totalCards: "145",
    cards: {
      create: [
        {
          playerName: "Jude Bellingham",
          cardNumber: "1",
          printRun: 145
        }
        // ... more cards
      ]
    }
  }
});

// Create parallel set (references parent's cards)
const parallelSet = await prisma.set.create({
  data: {
    name: "Electric Etch Orange",
    slug: "2024-25-obsidian-soccer-obsidian-base-electric-etch-orange-149",
    type: "Base",
    releaseId: release.id,
    parentSetId: parentSet.id,
    printRun: 149,
    mirrorsParentChecklist: true
  }
});

// Fetch set with parallel info
const set = await prisma.set.findUnique({
  where: { slug: "2024-25-obsidian-soccer-obsidian-base" },
  include: {
    release: {
      include: { manufacturer: true }
    },
    parallelSets: true, // Child parallels
    parentSet: true,    // Parent info (if this is a parallel)
    cards: true,
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
| `footyNotes` | String (Text) | | | - | Internal admin notes |
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
  footyNotes            String?  @db.Text
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
| `fileSize` | Int | ✓ | | - | File size in bytes |
| `documentType` | DocumentType | ✓ | | - | Type enum (SELL_SHEET, CHECKLIST, etc.) |
| `entityType` | SourceDocumentEntityType | ✓ | | - | Entity type enum (RELEASE, POST) |
| `tags` | String[] | ✓ | | `[]` | Searchable tags |
| `extractedText` | String (Text) | | | - | OCR/extracted text for search |
| `uploadedById` | String | ✓ | | - | References `neon_auth.admin_users.id` |
| `uploadedAt` | DateTime | ✓ | | `now()` | Upload timestamp |
| `lastUsedAt` | DateTime | | | - | Last usage timestamp |
| `usageCount` | Int | ✓ | | `0` | Usage counter |
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
  fileSize        Int
  documentType    DocumentType
  entityType      SourceDocumentEntityType
  tags            String[]
  extractedText   String?      @db.Text
  uploadedById    String
  uploadedAt      DateTime     @default(now())
  lastUsedAt      DateTime?
  usageCount      Int          @default(0)
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
    fileSize: 1024000,
    documentType: "SELL_SHEET",
    entityType: "RELEASE",
    releaseId: release.id,
    tags: ["2024-25", "Panini", "Obsidian"],
    uploadedById: "admin-user-id"
  }
});

// Track usage
await prisma.sourceDocument.update({
  where: { id: doc.id },
  data: {
    lastUsedAt: new Date(),
    usageCount: { increment: 1 },
    usageContext: "Used for release review generation"
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

### Parent-Child Parallel Sets

Parallel sets use a **parent-child architecture** to avoid duplicating card data.

**Key Concepts:**

1. **Parent Sets** (`parentSetId = null`)
   - Contain the actual card checklist
   - Example: "Obsidian Base" with 145 cards

2. **Child Parallel Sets** (`parentSetId` points to parent)
   - Reference the parent's cards
   - Store parallel-specific metadata (name, printRun)
   - Cards array is empty (not duplicated)
   - Example: "Electric Etch Orange /149" references "Obsidian Base" cards

**Database Structure:**

```typescript
// Parent set
const parentSet = {
  id: 'abc123',
  name: 'Obsidian Base',
  slug: '2024-25-obsidian-soccer-obsidian-base',
  type: 'Base',
  parentSetId: null,          // null = parent set
  parallelSets: [child1, child2, ...], // Array of child parallels
  cards: [card1, card2, ...]   // Cards stored here
};

// Child parallel set
const parallelSet = {
  id: 'xyz789',
  name: 'Electric Etch Orange',
  slug: '2024-25-obsidian-soccer-obsidian-base-electric-etch-orange-149',
  type: 'Base',
  parentSetId: 'abc123',      // Points to parent
  printRun: 149,
  parallelSets: [],           // Parallels don't have children
  cards: []                   // Empty - references parent's cards
};
```

**Benefits:**
- **Storage Efficiency:** Cards not duplicated across parallels
- **Consistency:** Single source of truth for card data
- **Maintainability:** Update cards once, reflects across all parallels
- **Query Performance:** Simpler joins, fewer records

**Query Pattern:**

```typescript
// Fetch set with parallel support
const set = await prisma.set.findUnique({
  where: { slug: params.slug },
  include: {
    release: { include: { manufacturer: true } },
    cards: true,              // Cards (if parent)
    parallelSets: true,       // Child parallels (if parent)
    parentSet: {              // Parent info (if parallel)
      include: { cards: true } // Parent's cards (if this is parallel)
    }
  }
});

// Display cards: use parent's cards if this is a parallel
const cardsToDisplay = set.parentSetId
  ? set.parentSet.cards
  : set.cards;
```

**Edge Cases:**

1. **Sets with no parallels:** Create only parent set, no children
2. **Variable parallels:** Some parallels have player-specific print runs (stored as separate cards)
3. **Cascading deletes:** Deleting parent cascades to children (Prisma `onDelete: Cascade`)
4. **Orphaned parallels:** Foreign key constraint ensures valid `parentSetId`

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
| Set (Parent) | Set (Parallel) | CASCADE |
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
- Parallel sets cascade delete when parent is deleted

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
- Date parsing for `releaseDate` → `postDate` conversion
- File size limits for uploads (enforced in API routes)
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
      where: { parentSetId: null }, // Parent sets only
      include: {
        parallelSets: true,          // Include child parallels
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

### Fetch Set with Parallel Info

```typescript
const set = await prisma.set.findUnique({
  where: { slug: params.slug },
  include: {
    release: {
      include: { manufacturer: true }
    },
    cards: true,              // Cards (if parent)
    parallelSets: {           // Child parallels (if parent)
      orderBy: { printRun: 'asc' }
    },
    parentSet: {              // Parent info (if parallel)
      include: {
        cards: true,          // Parent's cards
        parallelSets: true    // All parallels (siblings)
      }
    },
    images: {
      where: { type: 'SET' },
      orderBy: { order: 'asc' }
    }
  }
});

// Determine which cards to display
const cardsToDisplay = set.parentSetId
  ? set.parentSet.cards
  : set.cards;
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
        },
        parentSet: true // If card's set is a parallel
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
    { set: { release: { postDate: 'desc' } } },
    { cardNumber: 'asc' }
  ]
});
```

---

### Fetch Approved Releases Only (Public View)

```typescript
const releases = await prisma.release.findMany({
  where: {
    isApproved: true
  },
  include: {
    manufacturer: true,
    sets: {
      where: { parentSetId: null }
    },
    images: {
      where: { type: 'RELEASE' },
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { postDate: 'desc' }
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

### Deprecated Fields

**Current Deprecated Fields:**

| Model | Field | Replacement | Migration Plan |
|-------|-------|-------------|----------------|
| Release | `description` | `review` | Keep for backward compatibility, use `review` for new data |
| Set | `isBaseSet` | `type` | Keep for backward compatibility, use `type` for all logic |
| Set | `parallels` (Json) | `parallelSets` relation | Migrate to parent-child architecture, remove field in future version |

**Handling Deprecated Fields:**
- DO NOT use in new code
- DO NOT delete until all data migrated
- Mark with comments in schema: `// DEPRECATED: use X instead`
- Update documentation to reflect preferred approach
- Plan removal in future major version

---

## Additional Resources

- [API Reference](./API.md) - Complete REST API documentation
- [Development Guide](../.claude/CLAUDE.md) - Development patterns and best practices
- [Prisma Documentation](https://www.prisma.io/docs) - Official Prisma ORM docs
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - PostgreSQL reference

---

*Last Updated: 2025-11-14*
