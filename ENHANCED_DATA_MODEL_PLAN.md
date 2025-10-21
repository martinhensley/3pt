# Enhanced Data Model Implementation Plan

## Overview

This document outlines the plan to enhance the analyze endpoints to support hierarchical data entry for building a comprehensive library of **Manufacturers → Releases → Sets → Cards**.

## Current State Analysis

### Database Schema ✅
The Prisma schema already has the correct hierarchical relationships:
- `Manufacturer` → `Release[]` (one-to-many)
- `Release` → `Set[]` (one-to-many)
- `Set` → `Card[]` (one-to-many)
- `Post` can optionally reference a `Release`, `Set`, or `Card`

**Status**: Database structure is ready - no schema changes needed.

### Current Analyze Endpoints

#### 1. **Analyze Card** (`/app/api/analyze/card/route.ts`)
- **Current**: Accepts front and back card images (single file each)
- **Output**: Generates blog post with card metadata (player, team, set, etc.)
- **Limitation**: Does not create Card records in database, only generates Post content

#### 2. **Analyze Set** (`/app/api/analyze/set/route.ts`)
- **Current**: Accepts checklist image and optional sell sheet (single file each)
- **Output**: Generates blog post with set metadata (name, manufacturer, features, etc.)
- **Limitation**: Does not create Set records in database, only generates Post content

#### 3. **Analyze Release** (`/app/api/analyze/release/route.ts`)
- **Current**: Accepts single release document image
- **Output**: Generates blog post with release metadata (manufacturer, name, year, sets[], features[])
- **Limitation**: Does not create Release/Manufacturer records, only generates Post content

### Key Limitations to Address

1. **Single File Upload Only**: All endpoints accept only 1-2 files, but releases often have multiple PDFs, CSVs, web pages, etc.
2. **Image-Only Support**: Current implementation only handles images, but need to parse PDFs, CSVs, and HTML content
3. **No Database Integration**: Analysis results don't create Manufacturer/Release/Set/Card records
4. **No Entity Relationships**: Cards aren't associated with Sets, Sets aren't associated with Releases

---

## Requirements

### 1. Analyze Release (Enhanced)
**Goal**: Parse multiple documents about a release to extract comprehensive information about the release, its sets, and card checklists.

**Inputs**:
- Multiple file uploads (PDFs, CSVs, images, HTML/web pages)
- Each file could contain:
  - Release overview/announcement
  - Set information (multiple sets in a release)
  - Card checklists for sets
  - Sell sheets
  - Product details

**Outputs**:
1. Create/update **Manufacturer** record
2. Create **Release** record with relationship to Manufacturer
3. Create **Set** records with relationships to Release
4. Create **Card** records with relationships to Sets
5. Generate blog post about the release (optional)

**Example Use Case**:
User uploads:
- PDF: "2025/26 Topps Premier League Release Guide"
- PDF: "Complete Checklist - Base Set"
- PDF: "Complete Checklist - Insert Sets"
- CSV: "Full card list with numbers"
- Image: Sell sheet

System extracts:
- Manufacturer: Topps
- Release: "2025/26 Topps Premier League"
- Sets: Base Set, Starball, Golazo, etc.
- Cards: All individual cards with numbers, players, teams

### 2. Analyze Set (Enhanced)
**Goal**: Enable updating/adding sets within an existing release.

**Inputs**:
- Multiple file uploads (PDFs, CSVs, images)
- **Release selection** (dropdown to pick existing release)
- Files contain set-specific information and checklists

**Outputs**:
1. Create **Set** record linked to selected Release
2. Create **Card** records linked to the Set
3. Generate blog post about the set (optional)

**Example Use Case**:
User selects: "2025/26 Topps Premier League" release
User uploads:
- PDF: "Starball Insert Set Checklist"
- Image: Starball sell sheet

System creates:
- Set: "Starball" linked to the release
- Cards: All Starball insert cards

### 3. Analyze Card (Enhanced)
**Goal**: Associate individual card analysis with a Set in a Release.

**Inputs**:
- Card images (front, back)
- **Release selection** (dropdown)
- **Set selection** (dropdown, filtered by selected release)

**Outputs**:
1. Create **Card** record linked to selected Set
2. Generate blog post about the card

**Example Use Case**:
User selects: "2025/26 Topps Premier League" → "Base Set"
User uploads: Card front/back images

System creates:
- Card record with player info, linked to "Base Set" in "2025/26 Topps Premier League"
- Blog post about the card

---

## Technical Implementation Plan

### Phase 1: File Upload Infrastructure

#### 1.1 Update Upload Endpoint
**File**: `/app/api/upload/route.ts`

**Changes**:
- Add support for PDF file uploads
- Add support for CSV file uploads
- Add support for HTML/text file uploads
- Update MIME type validation
- Return file type metadata along with URL

**File Type Detection**:
```typescript
const mimeTypeMap = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/pdf': 'pdf',
  'text/csv': 'csv',
  'text/html': 'html',
  'text/plain': 'text'
};
```

#### 1.2 Document Parsing Library
**New File**: `/lib/documentParser.ts`

**Functions**:
```typescript
// Parse PDF files using pdf-parse or similar
async function parsePDF(filePath: string): Promise<string>

// Parse CSV files
async function parseCSV(filePath: string): Promise<string[][]>

// Parse HTML/web page content
async function parseHTML(content: string): Promise<string>

// Universal parser that detects type and routes to correct parser
async function parseDocument(
  filePath: string,
  fileType: 'image' | 'pdf' | 'csv' | 'html'
): Promise<ParsedDocument>

interface ParsedDocument {
  type: string;
  content: string | string[][]; // Text for PDF/HTML, array for CSV
  metadata?: Record<string, any>;
}
```

**Dependencies to Add**:
```bash
npm install pdf-parse csv-parse
```

### Phase 2: Enhanced AI Analysis

#### 2.1 Update AI Library
**File**: `/lib/ai.ts`

**New Analysis Types**:
```typescript
export interface ReleaseAnalysis {
  manufacturer: string;
  releaseName: string;
  year: string;
  sets: SetInfo[];
  features: string[];
  // Blog post fields (optional)
  title?: string;
  content?: string;
  excerpt?: string;
}

export interface SetInfo {
  name: string;
  description?: string;
  totalCards?: string;
  features?: string[];
  cards?: CardInfo[];
}

export interface CardInfo {
  playerName: string;
  team?: string;
  cardNumber: string;
  variant?: string;
  setName: string; // Which set within the release
}
```

**New Functions**:
```typescript
// Analyze multiple documents for release information
export async function analyzeReleaseDocuments(
  documents: ParsedDocument[]
): Promise<ReleaseAnalysis>

// Analyze set documents with Release context
export async function analyzeSetDocuments(
  documents: ParsedDocument[],
  releaseContext?: string
): Promise<SetAnalysis & { cards: CardInfo[] }>

// Enhanced card analysis with Set/Release context
export async function analyzeCardWithContext(
  frontImageBase64: string,
  backImageBase64?: string,
  setContext?: string,
  releaseContext?: string
): Promise<CardAnalysis>
```

**AI Prompt Strategy**:
- For releases: Pass all document texts/images to Claude, ask to extract structured data
- For CSV checklists: Parse CSV first, then use AI to clean/structure data
- For PDFs: Extract text, then use AI to identify sets, cards, and relationships
- Use structured output with Zod schemas to ensure consistent data format

#### 2.2 Zod Schemas
```typescript
const releaseAnalysisSchema = z.object({
  manufacturer: z.string(),
  releaseName: z.string(),
  year: z.string(),
  sets: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    totalCards: z.string().optional(),
    features: z.array(z.string()).optional(),
  })),
  features: z.array(z.string()),
  // Optional blog post fields
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
});

const cardChecklistSchema = z.array(z.object({
  playerName: z.string(),
  team: z.string().optional(),
  cardNumber: z.string(),
  variant: z.string().optional(),
  setName: z.string(),
}));
```

### Phase 3: Database Operations

#### 3.1 Database Helper Functions
**New File**: `/lib/database.ts`

```typescript
import { prisma } from '@/lib/prisma';

// Get or create manufacturer
export async function getOrCreateManufacturer(name: string) {
  return await prisma.manufacturer.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

// Create release with sets
export async function createReleaseWithSets(
  manufacturerId: string,
  releaseData: {
    name: string;
    year?: string;
  },
  sets: Array<{
    name: string;
    totalCards?: string;
  }>
) {
  return await prisma.release.create({
    data: {
      name: releaseData.name,
      year: releaseData.year,
      manufacturerId,
      sets: {
        create: sets,
      },
    },
    include: {
      sets: true,
      manufacturer: true,
    },
  });
}

// Add cards to a set
export async function addCardsToSet(
  setId: string,
  cards: Array<{
    playerName?: string;
    team?: string;
    cardNumber?: string;
    variant?: string;
  }>
) {
  return await prisma.card.createMany({
    data: cards.map(card => ({
      ...card,
      setId,
    })),
  });
}

// Get all releases for a manufacturer (for dropdowns)
export async function getManufacturerReleases(manufacturerId: string) {
  return await prisma.release.findMany({
    where: { manufacturerId },
    include: { sets: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Get all manufacturers (for dropdowns)
export async function getAllManufacturers() {
  return await prisma.manufacturer.findMany({
    orderBy: { name: 'asc' },
  });
}

// Get all releases (for dropdowns)
export async function getAllReleases() {
  return await prisma.release.findMany({
    include: { manufacturer: true, sets: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Get sets for a release (for dropdowns)
export async function getReleaseSets(releaseId: string) {
  return await prisma.set.findMany({
    where: { releaseId },
    orderBy: { name: 'asc' },
  });
}
```

### Phase 4: API Endpoint Updates

#### 4.1 Enhanced Analyze Release Endpoint
**File**: `/app/api/analyze/release/route.ts`

**Changes**:
```typescript
export async function POST(request: NextRequest) {
  // 1. Accept array of file URLs and types from request body
  const { files } = await request.json();
  // files: Array<{ url: string, type: 'image' | 'pdf' | 'csv' | 'html' }>

  // 2. Parse all documents
  const parsedDocuments = await Promise.all(
    files.map(file => parseDocument(file.url, file.type))
  );

  // 3. Analyze with AI
  const analysis = await analyzeReleaseDocuments(parsedDocuments);

  // 4. Create database records
  const manufacturer = await getOrCreateManufacturer(analysis.manufacturer);
  const release = await createReleaseWithSets(
    manufacturer.id,
    { name: analysis.releaseName, year: analysis.year },
    analysis.sets
  );

  // 5. Return analysis + created records
  return NextResponse.json({
    ...analysis,
    createdRecords: {
      manufacturer,
      release,
    },
  });
}
```

#### 4.2 Enhanced Analyze Set Endpoint
**File**: `/app/api/analyze/set/route.ts`

**Changes**:
```typescript
export async function POST(request: NextRequest) {
  // 1. Accept array of file URLs and releaseId
  const { files, releaseId } = await request.json();

  // 2. Get release context for AI
  const release = await prisma.release.findUnique({
    where: { id: releaseId },
    include: { manufacturer: true },
  });

  // 3. Parse documents
  const parsedDocuments = await Promise.all(
    files.map(file => parseDocument(file.url, file.type))
  );

  // 4. Analyze with release context
  const analysis = await analyzeSetDocuments(
    parsedDocuments,
    `Release: ${release.manufacturer.name} ${release.name} (${release.year})`
  );

  // 5. Create Set and Cards
  const set = await prisma.set.create({
    data: {
      name: analysis.setName,
      totalCards: analysis.totalCards,
      releaseId: release.id,
    },
  });

  if (analysis.cards && analysis.cards.length > 0) {
    await addCardsToSet(set.id, analysis.cards);
  }

  // 6. Return analysis + created records
  return NextResponse.json({
    ...analysis,
    createdRecords: { set },
  });
}
```

#### 4.3 Enhanced Analyze Card Endpoint
**File**: `/app/api/analyze/card/route.ts`

**Changes**:
```typescript
export async function POST(request: NextRequest) {
  // 1. Accept images and setId
  const { frontImageUrl, backImageUrl, setId } = await request.json();

  // 2. Get set and release context
  const set = await prisma.set.findUnique({
    where: { id: setId },
    include: { release: { include: { manufacturer: true } } },
  });

  // 3. Read and convert images
  const frontImageBase64 = await imageToBase64(frontImageUrl);
  const backImageBase64 = backImageUrl
    ? await imageToBase64(backImageUrl)
    : undefined;

  // 4. Analyze with context
  const analysis = await analyzeCardWithContext(
    frontImageBase64,
    backImageBase64,
    set.name,
    `${set.release.manufacturer.name} ${set.release.name}`
  );

  // 5. Create Card record
  const card = await prisma.card.create({
    data: {
      playerName: analysis.playerName,
      team: analysis.team,
      cardNumber: analysis.cardNumber,
      variant: analysis.variant,
      setId: set.id,
    },
  });

  // 6. Return analysis + created record
  return NextResponse.json({
    ...analysis,
    createdRecords: { card },
  });
}
```

#### 4.4 New API Endpoints for Dropdowns
**New File**: `/app/api/library/manufacturers/route.ts`
```typescript
export async function GET() {
  const manufacturers = await getAllManufacturers();
  return NextResponse.json(manufacturers);
}
```

**New File**: `/app/api/library/releases/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const manufacturerId = searchParams.get('manufacturerId');

  const releases = manufacturerId
    ? await getManufacturerReleases(manufacturerId)
    : await getAllReleases();

  return NextResponse.json(releases);
}
```

**New File**: `/app/api/library/sets/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const releaseId = searchParams.get('releaseId');

  if (!releaseId) {
    return NextResponse.json({ error: 'releaseId required' }, { status: 400 });
  }

  const sets = await getReleaseSets(releaseId);
  return NextResponse.json(sets);
}
```

### Phase 5: Admin UI Updates

#### 5.1 Multi-File Upload Component
**New Component**: `/components/MultiFileUpload.tsx`

```tsx
interface MultiFileUploadProps {
  onFilesUploaded: (files: Array<{ url: string; type: string }>) => void;
  acceptedTypes?: string;
}

export default function MultiFileUpload({
  onFilesUploaded,
  acceptedTypes = "image/*,.pdf,.csv,.html"
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Upload all files and return URLs with types
  const handleUpload = async () => {
    // Implementation
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />
      {/* Display file list with remove buttons */}
      <button onClick={handleUpload}>Upload All</button>
    </div>
  );
}
```

#### 5.2 Entity Selection Dropdowns
**New Component**: `/components/EntitySelectors.tsx`

```tsx
interface ReleaseSelectProps {
  onReleaseSelected: (releaseId: string) => void;
}

export function ReleaseSelect({ onReleaseSelected }: ReleaseSelectProps) {
  const [releases, setReleases] = useState([]);

  useEffect(() => {
    fetch('/api/library/releases')
      .then(res => res.json())
      .then(setReleases);
  }, []);

  return (
    <select onChange={(e) => onReleaseSelected(e.target.value)}>
      <option value="">Select Release</option>
      {releases.map(r => (
        <option key={r.id} value={r.id}>
          {r.manufacturer.name} - {r.name} ({r.year})
        </option>
      ))}
    </select>
  );
}

interface SetSelectProps {
  releaseId: string;
  onSetSelected: (setId: string) => void;
}

export function SetSelect({ releaseId, onSetSelected }: SetSelectProps) {
  // Similar implementation
}
```

#### 5.3 Update Admin Portal
**File**: `/app/fa/page.tsx`

**Changes for "Analyze Release" Tab**:
```tsx
// State
const [releaseFiles, setReleaseFiles] = useState<Array<{ url: string; type: string }>>([]);

// UI
{activeTab === "release" && (
  <div className="space-y-6">
    <h2>Upload Release Documents</h2>
    <p>Upload PDFs, CSVs, images, or web pages about the release</p>

    <MultiFileUpload
      onFilesUploaded={setReleaseFiles}
      acceptedTypes="image/*,.pdf,.csv,.html"
    />

    <button onClick={handleReleaseAnalysis}>
      Analyze Release & Create Records
    </button>
  </div>
)}
```

**Changes for "Analyze Set" Tab**:
```tsx
// State
const [selectedRelease, setSelectedRelease] = useState("");
const [setFiles, setSetFiles] = useState<Array<{ url: string; type: string }>>([]);

// UI
{activeTab === "set" && (
  <div className="space-y-6">
    <h2>Add Set to Existing Release</h2>

    <ReleaseSelect onReleaseSelected={setSelectedRelease} />

    <MultiFileUpload
      onFilesUploaded={setSetFiles}
      acceptedTypes="image/*,.pdf,.csv"
    />

    <button onClick={handleSetAnalysis}>
      Analyze Set & Create Records
    </button>
  </div>
)}
```

**Changes for "Analyze Card" Tab**:
```tsx
// State
const [selectedRelease, setSelectedRelease] = useState("");
const [selectedSet, setSelectedSet] = useState("");

// UI
{activeTab === "card" && (
  <div className="space-y-6">
    <h2>Add Card to Existing Set</h2>

    <ReleaseSelect onReleaseSelected={setSelectedRelease} />

    {selectedRelease && (
      <SetSelect
        releaseId={selectedRelease}
        onSetSelected={setSelectedSet}
      />
    )}

    <div className="grid grid-cols-2 gap-4">
      <FileInput label="Card Front" />
      <FileInput label="Card Back (Optional)" />
    </div>

    <button onClick={handleCardAnalysis}>
      Analyze Card & Create Record
    </button>
  </div>
)}
```

### Phase 6: Library Management UI

#### 6.1 New Tab: "View Library"
Add a new tab to admin portal to view the hierarchical library:

```tsx
{activeTab === "library" && (
  <div className="space-y-6">
    <h2>Card Library</h2>

    {/* Accordion/tree view of Manufacturers → Releases → Sets → Cards */}
    {manufacturers.map(mfr => (
      <div key={mfr.id}>
        <h3>{mfr.name}</h3>
        {mfr.releases.map(release => (
          <div key={release.id}>
            <h4>{release.name} ({release.year})</h4>
            {release.sets.map(set => (
              <div key={set.id}>
                <h5>{set.name} - {set.totalCards} cards</h5>
                <button onClick={() => loadCards(set.id)}>
                  View Cards
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    ))}
  </div>
)}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Database schema review (COMPLETE - no changes needed)
- Add PDF/CSV parsing libraries
- Create `/lib/documentParser.ts`
- Update upload endpoint to support PDFs, CSVs, HTML
- Create `/lib/database.ts` with helper functions
- Create dropdown API endpoints

### Phase 2: Enhanced Analysis (Week 2)
- Update `/lib/ai.ts` with new analysis functions
- Add Zod schemas for structured output
- Test with sample PDFs and CSVs
- Implement multi-document parsing and analysis

### Phase 3: API Updates (Week 3)
- Update all three analyze endpoints
- Add error handling for partial failures
- Test end-to-end with real data
- Create comprehensive error messages

### Phase 4: UI Components (Week 4)
- Build `MultiFileUpload` component
- Build entity selector components (`ReleaseSelect`, `SetSelect`)
- Update admin portal tabs
- Add "View Library" tab
- Polish UI/UX

### Phase 5: Testing & Polish (Week 5)
- Integration testing
- Handle edge cases (duplicate entities, missing data)
- Add loading states and progress indicators
- Documentation updates
- User acceptance testing

---

## Error Handling Strategy

### Partial Success Scenarios
When analyzing a release with multiple files:
- Some files may fail to parse
- Some cards in a checklist may have missing data
- AI may fail to extract some fields

**Strategy**:
```typescript
interface AnalysisResult {
  success: boolean;
  data: ReleaseAnalysis | null;
  errors: Array<{
    file?: string;
    message: string;
    severity: 'warning' | 'error';
  }>;
  warnings: string[];
}
```

Return partial results with warnings, allow user to review and correct before saving to database.

### Duplicate Detection
- Before creating Manufacturer: Check if name exists (case-insensitive)
- Before creating Release: Check if manufacturer + name + year combination exists
- Before creating Set: Check if release + name combination exists
- For Cards: Allow duplicates (same card could appear in multiple sets)

### Validation
- Required fields: Manufacturer name, Release name
- Optional fields: Year, total cards, features
- Card validation: At least one of playerName or cardNumber required

---

## Success Metrics

### Data Quality
- 90%+ accuracy on manufacturer/release/set extraction
- 80%+ accuracy on card-level details (player names, numbers)
- CSV checklists: 95%+ import success rate

### User Experience
- Multi-file upload works smoothly
- Clear progress indicators during analysis
- Error messages are actionable
- Dropdown loading is fast (<500ms)

### System Performance
- PDF parsing: <5 seconds per document
- AI analysis: <30 seconds for full release (5-10 documents)
- Database operations: <1 second for full hierarchy creation

---

## Future Enhancements

### Phase 7+ (Future)
- Bulk import from external APIs (Beckett, CardboardConnection)
- Card image recognition to auto-detect set/release
- Price tracking integration
- User-submitted corrections/additions
- Public API for library data
- Advanced search across entire library
- Export library data (JSON, CSV)

---

## Risk Mitigation

### Technical Risks
1. **PDF parsing accuracy**: Some PDFs may be scanned images
   - Mitigation: Add OCR support using Tesseract.js

2. **AI hallucination**: AI may invent card details
   - Mitigation: Always show preview before saving, add confidence scores

3. **CSV format variations**: Different manufacturers use different formats
   - Mitigation: Flexible CSV parser, allow manual column mapping

### User Risks
1. **Data loss**: User might accidentally create duplicates
   - Mitigation: Duplicate detection, confirmation dialogs

2. **Complex UI**: Too many steps to complete analysis
   - Mitigation: Progressive disclosure, good defaults, save progress

---

## Dependencies to Install

```bash
npm install pdf-parse csv-parse
```

Optional (for OCR support):
```bash
npm install tesseract.js
```

---

## Conclusion

This plan provides a comprehensive roadmap to transform the analyze endpoints from simple blog post generators into a powerful library building tool. The database schema is already perfect for this use case, so the majority of work will be in:

1. Multi-file upload infrastructure
2. Document parsing (PDF, CSV, HTML)
3. Enhanced AI prompts for structured data extraction
4. Database integration functions
5. UI updates for entity selection and library viewing

The implementation is broken into manageable phases, with clear success metrics and risk mitigation strategies.
