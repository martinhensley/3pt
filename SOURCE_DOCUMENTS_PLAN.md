# Source Documents Library - Feature Plan

## Overview

The Source Documents library will track all files (PDFs, DOCs, images, etc.) used to create content in the Footy Bot system. This includes sell sheets, checklists, press releases, and any other documents used for AI-powered content generation.

## Problem Statement

Currently, when creating releases and posts using GenAI:
- Source files are uploaded to Vercel Blob but not tracked in the database
- No way to see which documents were used for which content
- Cannot browse or search through all source documents
- Difficult to reuse documents across multiple releases/posts
- No metadata tracking (upload date, file type, usage count)

## Solution

Build a comprehensive Source Documents library that:
1. Stores all source documents with metadata
2. Links documents to the content they were used to create
3. Provides a browsable/searchable interface
4. Tracks document usage and relationships
5. Integrates with existing release/post creation workflows

---

## 1. Database Schema Design

### New Models

#### SourceDocument Model

```prisma
model SourceDocument {
  id              String   @id @default(cuid())

  // File information
  filename        String   // Original filename
  displayName     String   // User-friendly name (editable)
  blobUrl         String   // Vercel Blob storage URL
  mimeType        String   // e.g., "application/pdf", "image/jpeg"
  fileSize        Int      // Size in bytes

  // Classification
  documentType    DocumentType // SELL_SHEET, CHECKLIST, PRESS_RELEASE, etc.
  tags            String[] // Searchable tags (e.g., ["2024", "Topps", "Chrome"])

  // Content extraction
  extractedText   String?  @db.Text // OCR/extracted text for search

  // Metadata
  uploadedById    String   // References neon_auth.admin_users.id
  uploadedAt      DateTime @default(now())
  lastUsedAt      DateTime? // Last time doc was linked to content
  usageCount      Int      @default(0) // How many times it's been used

  // Notes
  description     String?  @db.Text // Admin notes about the document

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  releases        ReleaseSourceDocument[]
  posts           PostSourceDocument[]
}

enum DocumentType {
  SELL_SHEET       // Product sell sheets
  CHECKLIST        // Card checklists
  PRESS_RELEASE    // Official press releases
  PRICE_GUIDE      // Pricing information
  IMAGE            // Reference images
  OTHER            // Other document types
}
```

#### Join Tables for Many-to-Many Relations

```prisma
// Links source documents to releases
model ReleaseSourceDocument {
  id              String          @id @default(cuid())
  releaseId       String
  release         Release         @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  documentId      String
  document        SourceDocument  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  // Context for how this doc was used
  usageContext    String?         // e.g., "Used for set descriptions", "Used for card list"
  linkedAt        DateTime        @default(now())
  linkedById      String          // Who linked it

  @@unique([releaseId, documentId])
}

// Links source documents to posts
model PostSourceDocument {
  id              String          @id @default(cuid())
  postId          String
  post            Post            @relation(fields: [postId], references: [id], onDelete: Cascade)
  documentId      String
  document        SourceDocument  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  // Context for how this doc was used
  usageContext    String?         // e.g., "Source for market analysis"
  linkedAt        DateTime        @default(now())
  linkedById      String          // Who linked it

  @@unique([postId, documentId])
}
```

#### Schema Updates to Existing Models

```prisma
// Add to Release model
model Release {
  // ... existing fields ...
  sourceDocuments ReleaseSourceDocument[]
}

// Add to Post model
model Post {
  // ... existing fields ...
  sourceDocuments PostSourceDocument[]
}
```

---

## 2. File Organization in Vercel Blob

### Directory Structure

```
source-documents/
  ├── {year}/
  │   ├── {month}/
  │   │   ├── {uuid}-{sanitized-filename}.pdf
  │   │   ├── {uuid}-{sanitized-filename}.docx
  │   │   └── {uuid}-{sanitized-filename}.jpg
```

### Naming Convention

- Format: `{uuid}-{sanitized-filename}.{ext}`
- UUID ensures uniqueness
- Sanitized filename preserves original name for reference
- Year/month folders for organization

### Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT, MD
- **Images**: JPG, JPEG, PNG, WEBP
- **Spreadsheets**: XLS, XLSX, CSV (for checklists)

---

## 3. API Endpoints

### Upload & Management

#### `POST /api/admin/library/source-documents`
Upload a new source document

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (File, required)
  - `documentType` (string, required)
  - `displayName` (string, optional)
  - `description` (string, optional)
  - `tags` (string[], optional)

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "clx...",
    "filename": "2024-topps-chrome-sell-sheet.pdf",
    "displayName": "2024 Topps Chrome Sell Sheet",
    "blobUrl": "https://...",
    "documentType": "SELL_SHEET",
    "fileSize": 2456789,
    "mimeType": "application/pdf"
  }
}
```

#### `GET /api/admin/library/source-documents`
List all source documents with filtering and pagination

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `documentType` (DocumentType, optional)
- `search` (string, optional) - searches filename, displayName, tags, extractedText
- `sortBy` (string, optional) - "uploadedAt" | "usageCount" | "displayName"
- `sortOrder` (string, optional) - "asc" | "desc"

**Response:**
```json
{
  "documents": [
    {
      "id": "clx...",
      "displayName": "2024 Topps Chrome Sell Sheet",
      "documentType": "SELL_SHEET",
      "fileSize": 2456789,
      "mimeType": "application/pdf",
      "blobUrl": "https://...",
      "tags": ["2024", "Topps", "Chrome"],
      "uploadedAt": "2024-01-15T10:30:00Z",
      "usageCount": 3,
      "lastUsedAt": "2024-01-20T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### `GET /api/admin/library/source-documents/[id]`
Get single document with full details and usage

**Response:**
```json
{
  "id": "clx...",
  "filename": "2024-topps-chrome-sell-sheet.pdf",
  "displayName": "2024 Topps Chrome Sell Sheet",
  "blobUrl": "https://...",
  "documentType": "SELL_SHEET",
  "mimeType": "application/pdf",
  "fileSize": 2456789,
  "tags": ["2024", "Topps", "Chrome"],
  "description": "Official sell sheet from Topps",
  "extractedText": "2024 Topps Chrome Soccer...",
  "uploadedAt": "2024-01-15T10:30:00Z",
  "usageCount": 3,
  "lastUsedAt": "2024-01-20T14:22:00Z",
  "usedIn": {
    "releases": [
      {
        "id": "clx...",
        "name": "2024 Topps Chrome Soccer",
        "linkedAt": "2024-01-15T11:00:00Z",
        "usageContext": "Used for set descriptions"
      }
    ],
    "posts": [
      {
        "id": "clx...",
        "title": "2024 Topps Chrome Soccer Review",
        "linkedAt": "2024-01-20T14:22:00Z",
        "usageContext": "Source for product review"
      }
    ]
  }
}
```

#### `PATCH /api/admin/library/source-documents/[id]`
Update document metadata

**Request:**
```json
{
  "displayName": "Updated Name",
  "description": "Updated description",
  "tags": ["tag1", "tag2"],
  "documentType": "SELL_SHEET"
}
```

#### `DELETE /api/admin/library/source-documents/[id]`
Delete a source document (also deletes from Vercel Blob)

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Linking Operations

#### `POST /api/admin/library/source-documents/[id]/link`
Link a document to content (release or post)

**Request:**
```json
{
  "contentType": "release", // or "post"
  "contentId": "clx...",
  "usageContext": "Used for set descriptions"
}
```

#### `DELETE /api/admin/library/source-documents/[id]/link`
Unlink a document from content

**Request:**
```json
{
  "contentType": "release",
  "contentId": "clx..."
}
```

### Batch Operations

#### `POST /api/admin/library/source-documents/batch-upload`
Upload multiple documents at once

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `files` (File[], required)
  - `documentType` (string, required)
  - `tags` (string[], optional)

---

## 4. UI Components & Pages

### Main Library Page: `/admin/library/source-documents`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Source Documents Library                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Upload New Document] [Batch Upload]                   │
│                                                          │
│  Filters:                                               │
│  [Document Type ▼] [Search...] [Sort: Recent ▼]        │
│                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ 📄 PDF      │ │ 📄 PDF      │ │ 📄 PDF      │      │
│  │ Topps       │ │ Panini      │ │ Select      │      │
│  │ Chrome 2024 │ │ Prizm 2024  │ │ La Liga 24  │      │
│  │             │ │             │ │             │      │
│  │ 3 uses      │ │ 1 use       │ │ 0 uses      │      │
│  │ Jan 15      │ │ Jan 20      │ │ Jan 22      │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                          │
│  [< Previous] Page 1 of 3 [Next >]                      │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Grid/list view toggle
- Drag-and-drop upload area
- Document type badges with color coding
- Usage count indicator
- Quick actions (view, edit, delete)
- Real-time search
- Filter by document type, date range, tags

### Document Detail Page: `/admin/library/source-documents/[id]`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Library                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📄 2024 Topps Chrome Soccer Sell Sheet                │
│  [Edit] [Delete] [Download]                             │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Document Preview                                 │   │
│  │ [PDF/Image preview or download link]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Details:                                               │
│  • Type: Sell Sheet                                     │
│  • File Size: 2.4 MB                                    │
│  • Uploaded: Jan 15, 2024 by Admin                     │
│  • Used: 3 times (last: Jan 20, 2024)                  │
│  • Tags: 2024, Topps, Chrome                           │
│                                                          │
│  Description:                                           │
│  Official sell sheet from Topps for 2024 Chrome...     │
│                                                          │
│  Used In:                                               │
│  📦 2024 Topps Chrome Soccer (Release)                  │
│     Linked Jan 15, 2024 • Used for set descriptions    │
│                                                          │
│  📝 2024 Topps Chrome Review (Post)                     │
│     Linked Jan 20, 2024 • Source for product review    │
│                                                          │
│  [+ Link to Content]                                    │
└─────────────────────────────────────────────────────────┘
```

### Upload Modal Component

**Features:**
- Drag-and-drop file area
- File type validation
- Progress indicator
- Metadata input (type, tags, description)
- Preview before upload
- Batch upload support

### Document Card Component

Reusable component showing:
- Document type icon
- Display name
- File size
- Upload date
- Usage count
- Quick actions

---

## 5. Integration Points

### Release Creation Flow

**Current:**
- Admin uploads PDF → stored in Vercel Blob
- Text extracted and stored in `sellSheetText`
- URLs stored in `sourceFiles` JSON

**Enhanced:**
1. Admin uploads PDF via Source Documents library first
2. OR uploads during release creation → automatically creates SourceDocument
3. Document automatically linked to release via ReleaseSourceDocument
4. Extracted text stored in both SourceDocument and Release
5. Can link additional existing documents from library

**UI Changes:**
- Add "Select from Library" button in release form
- Show linked documents in release edit view
- One-click to view source document

### Post Creation Flow

**Enhanced:**
1. When creating post, option to "Link Source Documents"
2. Search/browse source documents library
3. Select documents used for research/content
4. Automatically creates PostSourceDocument link
5. Documents shown in post edit view

### AI Content Generation

**Workflow:**
1. Admin uploads source document
2. System extracts text (PDF → text, OCR for images)
3. Admin initiates AI generation (release description, post content)
4. AI uses extracted text from linked documents
5. System automatically tracks which documents were used

---

## 6. Technical Implementation Details

### File Upload Process

1. **Client-side:**
   - Validate file type and size
   - Show upload progress
   - Handle drag-and-drop

2. **Server-side:**
   - Receive multipart/form-data
   - Validate file
   - Generate UUID for unique filename
   - Upload to Vercel Blob with organized path
   - Extract text if PDF (using pdf-parse or similar)
   - Create SourceDocument database record
   - Return document metadata

### Text Extraction

**For PDFs:**
```typescript
import { parse } from 'pdf-parse';

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const data = await parse(buffer);
  return data.text;
}
```

**For Images (OCR):**
- Use Tesseract.js or cloud OCR service
- Extract text for searchability
- Store in `extractedText` field

### Search Implementation

**Database Query:**
```typescript
const documents = await prisma.sourceDocument.findMany({
  where: {
    OR: [
      { displayName: { contains: searchTerm, mode: 'insensitive' } },
      { filename: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { has: searchTerm } },
      { extractedText: { contains: searchTerm, mode: 'insensitive' } },
    ],
    documentType: documentTypeFilter, // if provided
  },
  orderBy: { [sortBy]: sortOrder },
  skip: (page - 1) * limit,
  take: limit,
});
```

### Automatic Linking on Upload

When uploading during release/post creation:

```typescript
async function uploadAndLinkDocument(
  file: File,
  documentType: DocumentType,
  linkTo: { type: 'release' | 'post', id: string },
  userId: string
) {
  // 1. Upload to Vercel Blob
  const blobUrl = await uploadToBlob(file);

  // 2. Extract text
  const extractedText = await extractText(file);

  // 3. Create SourceDocument
  const document = await prisma.sourceDocument.create({
    data: {
      filename: file.name,
      displayName: file.name.replace(/\.[^/.]+$/, ''), // remove extension
      blobUrl,
      mimeType: file.type,
      fileSize: file.size,
      documentType,
      extractedText,
      uploadedById: userId,
    },
  });

  // 4. Create link
  if (linkTo.type === 'release') {
    await prisma.releaseSourceDocument.create({
      data: {
        releaseId: linkTo.id,
        documentId: document.id,
        linkedById: userId,
      },
    });
  } else {
    await prisma.postSourceDocument.create({
      data: {
        postId: linkTo.id,
        documentId: document.id,
        linkedById: userId,
      },
    });
  }

  // 5. Update usage count
  await prisma.sourceDocument.update({
    where: { id: document.id },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  return document;
}
```

---

## 7. Security & Permissions

### Authentication
- All endpoints require admin authentication via NextAuth
- Check `session.user` is present and is admin

### Authorization
- Only admins can upload, edit, delete documents
- Document URLs are public (Vercel Blob with `access: 'public'`)
- Sensitive documents should be marked and handled separately

### File Validation
- Whitelist allowed MIME types
- Enforce file size limits (e.g., 10MB max)
- Sanitize filenames to prevent path traversal
- Scan for malicious content (if required)

---

## 8. Migration Strategy

### Existing Data
The Release model already has `sourceFiles` as JSON:
```typescript
sourceFiles: Json? // Array of {url: string, type: string, filename: string}
```

**Migration Plan:**
1. Create migration to add new models (SourceDocument, join tables)
2. Run script to migrate existing `sourceFiles` to SourceDocument records
3. Create ReleaseSourceDocument links for migrated data
4. Keep `sourceFiles` field for backwards compatibility (mark as deprecated)

**Migration Script:**
```typescript
async function migrateExistingSourceFiles() {
  const releases = await prisma.release.findMany({
    where: { sourceFiles: { not: null } },
  });

  for (const release of releases) {
    const files = release.sourceFiles as Array<{
      url: string;
      type: string;
      filename: string;
    }>;

    for (const file of files) {
      // Create SourceDocument
      const document = await prisma.sourceDocument.create({
        data: {
          filename: file.filename,
          displayName: file.filename,
          blobUrl: file.url,
          mimeType: file.type,
          documentType: 'SELL_SHEET', // assume sell sheet
          uploadedById: 'system', // or first admin user
          usageCount: 1,
        },
      });

      // Link to release
      await prisma.releaseSourceDocument.create({
        data: {
          releaseId: release.id,
          documentId: document.id,
          linkedById: 'system',
        },
      });
    }
  }
}
```

---

## 9. Future Enhancements

### Phase 2 Features
- **OCR Integration**: Automatic text extraction from images
- **Document Versioning**: Track multiple versions of same document
- **Duplicate Detection**: Warn when uploading similar files
- **Bulk Tagging**: Tag multiple documents at once
- **Export**: Download all documents or filtered set as ZIP
- **Analytics**: Usage reports, most-used documents, etc.

### Phase 3 Features
- **AI Auto-Tagging**: Automatically tag documents based on content
- **Smart Recommendations**: Suggest relevant documents when creating content
- **Document Templates**: Create templates for common document types
- **Collaboration**: Comments and notes on documents
- **Audit Log**: Track all changes to documents

---

## 10. Success Metrics

### Key Metrics to Track
1. **Total Documents**: Number of source documents in library
2. **Usage Rate**: % of content with linked source documents
3. **Search Usage**: How often admins search the library
4. **Reuse Rate**: % of documents used in multiple pieces of content
5. **Time Saved**: Reduction in time to create content (qualitative)

### Monitoring
- Track document uploads per month
- Monitor storage usage in Vercel Blob
- Log search queries for improving search
- Track linking operations

---

## Implementation Checklist

### Database
- [ ] Create Prisma schema changes
- [ ] Write and test migration
- [ ] Migrate existing `sourceFiles` data
- [ ] Add indexes for performance

### API
- [ ] Implement upload endpoint
- [ ] Implement list/search endpoint
- [ ] Implement detail endpoint
- [ ] Implement update endpoint
- [ ] Implement delete endpoint
- [ ] Implement linking endpoints
- [ ] Add text extraction for PDFs
- [ ] Add file validation

### UI
- [ ] Create library main page
- [ ] Create document detail page
- [ ] Build upload modal component
- [ ] Build document card component
- [ ] Add drag-and-drop upload
- [ ] Implement search/filter UI
- [ ] Add pagination
- [ ] Integrate with release form
- [ ] Integrate with post form

### Testing
- [ ] Test file upload (various types)
- [ ] Test text extraction
- [ ] Test search functionality
- [ ] Test linking operations
- [ ] Test deletion (cascade to links)
- [ ] Test pagination
- [ ] Test file size limits

### Documentation
- [ ] API documentation
- [ ] Admin user guide
- [ ] Migration guide

---

## Timeline Estimate

**Phase 1 - Core Functionality (2-3 weeks)**
- Week 1: Database schema, migrations, basic API endpoints
- Week 2: File upload, text extraction, main library UI
- Week 3: Document detail page, search/filter, testing

**Phase 2 - Integration (1 week)**
- Integrate with release creation
- Integrate with post creation
- Migration of existing data

**Phase 3 - Polish (1 week)**
- UI refinements
- Performance optimization
- Documentation
- Admin testing and feedback

**Total: 4-5 weeks**

---

## Questions to Answer Before Starting

1. **File Size Limits**: What's the maximum file size we want to support?
   - Recommendation: 10MB for PDFs, 5MB for images

2. **Storage Costs**: Current Vercel Blob usage and budget?
   - Need to monitor and potentially add cleanup for unused documents

3. **Text Extraction**: Use client library or cloud service?
   - Recommendation: pdf-parse for PDFs (free, runs on server)

4. **OCR for Images**: Required for Phase 1?
   - Recommendation: Phase 2 feature, use Tesseract.js

5. **Document Privacy**: Any documents that should be admin-only?
   - Current assumption: all documents are public via blob URLs

6. **Batch Upload Limit**: How many files at once?
   - Recommendation: 10 files max per batch

7. **Existing Data**: How many releases have sourceFiles to migrate?
   - Need to check database and plan migration time
