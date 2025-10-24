# Bulk Scan Implementation Plan for footy.bot

## Overview

This document outlines the implementation plan for a bulk card scanning feature that will allow administrators to efficiently populate the card database with images and extracted metadata using AI-powered image analysis.

---

## Core Objectives

1. **Streamline card data entry** - Replace manual entry with automated AI extraction
2. **Populate card images** - Add front/back images to existing card records
3. **Context-aware scanning** - Use pre-selected Release, Set, and Parallel to guide AI extraction
4. **Bulk processing** - Handle multiple cards in a single session
5. **Quality control** - Review and edit extracted data before saving

---

## Architecture Overview

### User Flow

```
1. Admin selects Release → Set → Parallel/Variation (optional)
2. Upload multiple front images (required)
3. Upload matching back images (optional)
4. System pairs images and displays preview grid
5. Click "Scan All" to process all cards with AI
6. Review extracted data in editable form
7. Make corrections as needed
8. Save all cards to database with images uploaded to Vercel Blob
```

### Context Hierarchy

```
Release (2024-25 Panini Donruss Soccer)
  └─ Set (Base Set)
      └─ Parallel (Gold Prizm, Purple Pulsar, etc.)
```

This context helps the AI understand:
- Expected card format and design
- Year and manufacturer
- Parallel characteristics (foil, color, texture)
- Card numbering scheme

---

## Database Schema Updates

### Current Schema (Already exists)
```prisma
model Card {
  id              String   @id @default(cuid())
  playerName      String?
  team            String?
  cardNumber      String?
  variant         String?
  parallelType    String?
  serialNumber    String?
  isNumbered      Boolean  @default(false)
  printRun        Int?
  rarity          Rarity?
  finish          Finish?
  hasAutograph    Boolean  @default(false)
  hasMemorabilia  Boolean  @default(false)
  specialFeatures String[]
  colorVariant    String?
  imageFront      String?  // Store Vercel Blob URL
  imageBack       String?  // Store Vercel Blob URL

  set             Set      @relation(fields: [setId], references: [id])
  setId           String

  images          CardImage[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model CardImage {
  id        String   @id @default(cuid())
  url       String   // Vercel Blob URL
  caption   String?
  order     Int      @default(0)

  card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  cardId    String

  createdAt DateTime @default(now())
}
```

**No schema changes needed** - existing structure supports all requirements.

---

## Technology Stack

### Core Technologies

**AI & Image Processing:**
- `@anthropic-ai/sdk` - Claude Sonnet 4 for image analysis
- `sharp` - Server-side image processing and optimization
- Image format conversion (HEIC/HEIF to JPEG)

**Storage:**
- `@vercel/blob` - Cloud storage for card images
- Existing Neon PostgreSQL database

**UI Components:**
- React Hook Form with Zod validation
- Radix UI components (already in use)
- Custom file upload with drag-and-drop
- Image preview grid

**Dependencies to Add:**
```json
{
  "@anthropic-ai/sdk": "^0.30.0",
  "sharp": "^0.34.3"
}
```

---

## Component Architecture

### 1. Admin Bulk Scan Page
**Location:** `/app/admin/bulk-scan/page.tsx`

**Features:**
- Release/Set/Parallel selector (cascading dropdowns)
- Multi-file upload for front images (required)
- Multi-file upload for back images (optional)
- Image pairing validation (counts must match if backs provided)
- Preview grid with thumbnails
- "Scan All" batch processing
- Individual card edit forms
- Bulk save functionality

**State Management:**
```typescript
interface BulkScanState {
  releaseId: string;
  setId: string;
  parallelType?: string;
  frontImages: File[];
  backImages: File[];
  cards: ScannedCard[];
  processing: boolean;
  currentProcessing: number;
}

interface ScannedCard {
  id: string; // temp ID for UI
  frontImage: string; // data URI
  backImage?: string; // data URI
  extracted: {
    playerName: string;
    cardNumber: string;
    team?: string;
    hasAutograph: boolean;
    hasMemorabilia: boolean;
    isNumbered: boolean;
    serialNumber?: string;
    printRun?: number;
    confidence: number;
  };
  edited: boolean;
  saved: boolean;
}
```

### 2. Image Upload Component
**Location:** `/components/admin/ImageUpload.tsx`

**Features:**
- Drag-and-drop zone
- Multi-file selection
- Preview thumbnails with remove option
- HEIC/HEIF format conversion
- Image rotation controls
- Progress indicators

### 3. Card Scan Form
**Location:** `/components/admin/CardScanForm.tsx`

**Features:**
- Display front/back images
- Editable form fields for extracted data
- Confidence score indicator
- "Rescan" button for individual cards
- Save status indicator
- Remove card from batch

---

## AI Image Analysis

### API Endpoint
**Location:** `/app/api/admin/scan-card/route.ts`

**Input:**
```typescript
{
  frontImage: string;  // base64 data URI
  backImage?: string;  // base64 data URI
  context: {
    release: {
      name: string;
      year: string;
      manufacturer: string;
    };
    set: {
      name: string;
      totalCards?: string;
    };
    parallel?: {
      name: string;
      characteristics?: string;
    };
  };
}
```

**Output:**
```typescript
{
  playerName: string;
  cardNumber: string;
  team?: string;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  isNumbered: boolean;
  serialNumber?: string;  // e.g., "15/99"
  printRun?: number;  // extracted from serialNumber
  confidence: number;  // 0-100
  rawResponse: string;  // for debugging
}
```

### AI Prompt Structure

```
You are analyzing a soccer trading card image.

CONTEXT:
- Release: {year} {manufacturer} {releaseName}
- Set: {setName}
- Parallel/Variation: {parallelName} (if applicable)
- Total Cards in Set: {totalCards}

IMAGES PROVIDED:
- Front image: [attached]
- Back image: [attached] (if provided)

Extract the following information:

1. PLAYER NAME: The player's full name as shown on the card
2. CARD NUMBER: Just the number (e.g., "15" not "#15")
3. TEAM/CLUB: The team/club name if visible
4. AUTOGRAPH: true/false - Does the card have an autograph?
5. MEMORABILIA: true/false - Does the card have a memorabilia piece (jersey, patch)?
6. NUMBERED: true/false - Is the card serially numbered?
7. SERIAL NUMBER: If numbered, the serial (e.g., "15/99", "1/1")

IMPORTANT NOTES:
- The parallel/variation is: {parallelName}
- Look for visual characteristics: foil patterns, colors, textures
- Serial numbers often appear in corners or on the back
- Autographs are typically signed on the card surface
- Memorabilia is usually a piece of fabric embedded in the card

Return ONLY valid JSON:
{
  "playerName": "string",
  "cardNumber": "string",
  "team": "string or null",
  "hasAutograph": boolean,
  "hasMemorabilia": boolean,
  "isNumbered": boolean,
  "serialNumber": "string or null",
  "confidence": number (0-100)
}
```

### Claude Configuration

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: frontImageBase64,
          },
        },
        backImageBase64 && {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: backImageBase64,
          },
        },
        {
          type: 'text',
          text: promptText,
        },
      ].filter(Boolean),
    },
  ],
});
```

---

## Image Processing Pipeline

### 1. Upload & Conversion
**Location:** `/lib/utils/image-converter.ts`

```typescript
async function convertImage(file: File): Promise<string> {
  // Convert HEIC/HEIF/PNG/WEBP to JPEG
  // Resize to max 1600x2400 (maintain aspect ratio)
  // Quality: 0.85
  // Return: base64 data URI
}
```

### 2. Compression
**Location:** `/lib/utils/image-compression.ts`

```typescript
async function compressForStorage(dataUri: string): Promise<string> {
  // Resize to 800x1200 for storage
  // Quality: 0.7
  // Return: compressed base64 data URI
}
```

### 3. Blob Upload
**Location:** `/lib/utils/blob-upload.ts`

```typescript
async function uploadCardImage(
  dataUri: string,
  cardId: string,
  side: 'front' | 'back'
): Promise<string> {
  // Convert data URI to Blob
  // Upload to Vercel Blob
  // Return: blob URL
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
**Tasks:**
- [ ] Add Anthropic SDK and Sharp dependencies
- [ ] Create image conversion utilities
- [ ] Create compression utilities
- [ ] Set up Vercel Blob integration
- [ ] Create `/api/admin/scan-card` endpoint
- [ ] Test AI scanning with sample cards

**Deliverables:**
- Working API endpoint that can scan a single card
- Image processing pipeline functional
- Test results documented

---

### Phase 2: Bulk Upload UI (Week 2)
**Tasks:**
- [ ] Create `/admin/bulk-scan` page
- [ ] Build Release/Set/Parallel selector component
- [ ] Build image upload component with drag-and-drop
- [ ] Implement image pairing logic
- [ ] Create preview grid
- [ ] Add image rotation controls

**Deliverables:**
- Functional bulk upload interface
- Image pairing validation
- Preview working correctly

---

### Phase 3: Scanning & Editing (Week 3)
**Tasks:**
- [ ] Implement "Scan All" batch processing
- [ ] Create card edit form component
- [ ] Add individual "Rescan" functionality
- [ ] Implement validation rules
- [ ] Add confidence score indicators
- [ ] Create error handling for failed scans

**Deliverables:**
- Batch scanning working
- Individual card editing functional
- Error states handled

---

### Phase 4: Save & Storage (Week 4)
**Tasks:**
- [ ] Implement bulk save to database
- [ ] Upload images to Vercel Blob
- [ ] Create success/error notifications
- [ ] Add progress indicators
- [ ] Implement rollback on failure
- [ ] Create audit logging

**Deliverables:**
- Cards saving to database
- Images uploading to Blob storage
- Proper error handling and rollback

---

### Phase 5: Testing & Optimization (Week 5)
**Tasks:**
- [ ] Test with various card types
- [ ] Test with different parallels
- [ ] Optimize AI prompt for accuracy
- [ ] Add loading states and skeletons
- [ ] Performance testing with 50+ cards
- [ ] Mobile responsive testing

**Deliverables:**
- Production-ready feature
- Documentation
- Test results and accuracy metrics

---

## API Endpoints

### 1. Scan Card
`POST /api/admin/scan-card`

**Request:**
```json
{
  "frontImage": "data:image/jpeg;base64,...",
  "backImage": "data:image/jpeg;base64,...",
  "context": {
    "release": { "name": "...", "year": "...", "manufacturer": "..." },
    "set": { "name": "...", "totalCards": "..." },
    "parallel": { "name": "...", "characteristics": "..." }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playerName": "Lionel Messi",
    "cardNumber": "15",
    "team": "Inter Miami CF",
    "hasAutograph": false,
    "hasMemorabilia": false,
    "isNumbered": true,
    "serialNumber": "15/99",
    "printRun": 99,
    "confidence": 95
  }
}
```

### 2. Bulk Save Cards
`POST /api/admin/bulk-save-cards`

**Request:**
```json
{
  "setId": "cmh43s5vr00058op3itx4g2al",
  "cards": [
    {
      "playerName": "Lionel Messi",
      "cardNumber": "15",
      "team": "Inter Miami CF",
      "parallelType": "Gold Prizm",
      "frontImage": "data:image/jpeg;base64,...",
      "backImage": "data:image/jpeg;base64,...",
      "hasAutograph": false,
      "hasMemorabilia": false,
      "isNumbered": true,
      "serialNumber": "15/99",
      "printRun": 99
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "savedCount": 25,
  "failedCount": 0,
  "cards": [
    {
      "id": "cmh44nhrl00008owvp0gnogp7",
      "playerName": "Lionel Messi",
      "imageFront": "https://blob.vercel-storage.com/...",
      "imageBack": "https://blob.vercel-storage.com/..."
    }
  ]
}
```

---

## Security & Authorization

### Admin-Only Access
```typescript
// Middleware check in API routes
const session = await getServerSession(authOptions);
if (!session?.user || session.user.email !== process.env.ADMIN_EMAIL) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Rate Limiting
- Implement rate limiting on scan endpoint
- Max 100 scans per hour per user
- Cost control for AI API usage

---

## Cost Considerations

### Anthropic API Costs
- Claude Sonnet 4: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Average card scan: ~1500 input tokens (images + prompt)
- Average response: ~200 output tokens
- **Cost per card: ~$0.008** (less than 1 cent)
- **100 cards: ~$0.80**
- **1000 cards: ~$8.00**

### Vercel Blob Storage Costs
- Hobby plan: 1GB free
- Pro plan: Unlimited (included)
- Average card image: 200KB (front) + 200KB (back) = 400KB
- **1000 cards: ~400MB**

### Total Cost Estimate
- **Setup: $0** (using existing infrastructure)
- **Per 1000 cards: ~$8** (AI scanning only)
- Storage costs covered by existing Vercel plan

---

## Error Handling

### Image Processing Errors
- Unsupported format → Convert with fallback
- Corrupted image → Skip with error message
- File too large → Compress before processing

### AI Scanning Errors
- API timeout → Retry with exponential backoff
- Low confidence (<70%) → Flag for manual review
- Invalid JSON response → Parse and fix or request rescan

### Storage Errors
- Blob upload failure → Retry 3 times, then fail gracefully
- Database save failure → Rollback all saves in batch
- Partial success → Save what worked, report failures

---

## Testing Strategy

### Unit Tests
- Image conversion functions
- Data extraction parsing
- Serial number parsing (e.g., "15/99" → printRun: 99)

### Integration Tests
- Full scan workflow
- Batch processing
- Database saves with Blob uploads

### E2E Tests
- Complete user flow from upload to save
- Multiple card types and parallels
- Error scenarios

### Test Data
- Sample cards from different sets
- Various parallel types
- Edge cases (1/1, missing data, etc.)

---

## Success Metrics

### Performance Targets
- **Scan Speed:** <5 seconds per card
- **Accuracy:** >90% for player name and card number
- **Batch Processing:** 50 cards in <5 minutes
- **User Time Saved:** 90% reduction vs manual entry

### Quality Metrics
- Confidence score tracking
- Manual correction rate
- User satisfaction surveys
- Data accuracy validation

---

## Future Enhancements

### Phase 2 Features
- [ ] OCR fallback for low-confidence AI scans
- [ ] Texture detection for parallel identification
- [ ] Auto-rotation using image orientation
- [ ] Card condition assessment (PSA-style)
- [ ] Market value estimation integration
- [ ] Duplicate detection
- [ ] CSV export of scanned data

### Advanced Features
- [ ] Mobile app with camera integration
- [ ] Real-time scanning preview
- [ ] Batch parallel identification across sets
- [ ] Integration with Beckett/PSA databases
- [ ] Community contributions (non-admin users)

---

## File Structure

```
/app
  /admin
    /bulk-scan
      page.tsx                 # Main bulk scan interface
  /api
    /admin
      /scan-card
        route.ts               # AI scanning endpoint
      /bulk-save-cards
        route.ts               # Bulk save endpoint

/components
  /admin
    ImageUpload.tsx            # Multi-file upload component
    CardScanForm.tsx           # Individual card edit form
    ReleasePicker.tsx          # Release/Set/Parallel selector
    ScanProgress.tsx           # Batch processing progress

/lib
  /ai
    scan-card.ts               # AI scanning logic
  /utils
    image-converter.ts         # Format conversion
    image-compression.ts       # Size optimization
    blob-upload.ts             # Vercel Blob integration
    serial-parser.ts           # Parse "15/99" format

/types
  bulk-scan.ts                 # TypeScript interfaces
```

---

## Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

---

## Migration Path

### For Existing Cards
1. Bulk scan can add images to existing card records
2. Match by card number + set ID
3. Update only missing fields
4. Preserve manually entered data

### Data Validation
- Compare AI extracted vs existing data
- Flag discrepancies for review
- Admin approval for overwrites

---

## Conclusion

This implementation plan provides a comprehensive, production-ready bulk scanning system that will:

1. **Save massive time** - Reduce card entry from minutes to seconds
2. **Improve accuracy** - AI extraction is more consistent than manual entry
3. **Scale efficiently** - Handle hundreds of cards per session
4. **Maintain quality** - Review and edit before saving
5. **Cost-effective** - Less than 1 cent per card to scan

The phased approach allows for iterative development and testing, ensuring each component works correctly before moving to the next phase.

**Estimated Timeline:** 5 weeks for full implementation
**Estimated Cost:** <$100 for 10,000 cards scanned
**Expected ROI:** 90%+ time savings on card data entry
