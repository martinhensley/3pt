# AI Card Scanning Workflow Analysis

## Overview

The QB1 project implements a sophisticated AI-powered card scanning system that extracts metadata from card images and intelligently associates cards with existing checklists. This document provides a detailed analysis of the workflow to help implement a similar feature in the footy.bot project.

---

## 1. Scanning Architecture Overview

### Data Flow Diagram
```
Physical Card Photo
       ↓
[Image Capture & Compression]
       ↓
[Claude Vision API - OCR Text Extraction]
       ↓
[Multi-Method Detection]
  ├─ OCR Text Matching
  ├─ Visual Pattern Analysis
  └─ AI Descriptor Parsing
       ↓
[Parallel Database Lookup]
       ↓
[Card Metadata Extraction]
  ├─ Set Name
  ├─ Player
  ├─ Card Number
  ├─ Descriptors (Parallel, Grade, Auto, etc.)
  └─ Confidence Scores
       ↓
[Smart Card Association]
  ├─ Match Against Existing Cards
  ├─ Calculate Match Scores
  └─ Suggest Collections
       ↓
[Card Creation & Storage]
  └─ Save to Database
```

---

## 2. Core Components & Files

### 2.1 AI Vision Analysis (`/Users/mh/qb1/src/ai/ai-vision.ts`)

**Purpose**: Uses Claude Vision to extract card details from images

**Key Features**:
- Accepts front and back images as data URIs (base64 encoded)
- Uses Claude Sonnet 4 model for image analysis
- Extracts: set, player, cardNumber, descriptors, category, confidence, grading info

**Critical Instructions in Prompt**:
```
- Set must include YEAR: "2023-24 Panini Prizm NBA" (not just "Panini Prizm NBA")
- Parallel identification: Look for text on back near card number
- Common Donruss parallels: Dragon Scale, Optic, Rated Rookie
- Common Panini parallels: Prizm (Silver, Red, Blue), Mosaic, Select
- Serial numbers: Look for formats like "15/99", "1 of 1", "023/150"
- Grading ONLY if: 1) Professional company (PSA, BGS, SGC, CGC), 2) Numerical grade, 3) Certification number
- Authentication (eBay Authenticity) is NOT grading
```

**Output Interface**:
```typescript
export interface ClaudeImageAnalysisOutput {
  set: string;
  player: string;
  cardNumber?: string;
  descriptors: string;  // "Dragon Scale, Numbered 15/99, Autograph"
  category?: 'baseball' | 'basketball' | 'football' | 'hockey' | 'pokemon' | 'magic' | 'soccer' | 'wrestling' | 'other';
  confidence: number;   // 0-100
  isGraded?: boolean;
  grade?: string;       // "9.8"
  gradingCompany?: string; // "CGC"
  certificationNumber?: string;
}
```

### 2.2 Enhanced Scanning Flow (`/Users/mh/qb1/src/ai/flows/enhanced-scan-card-image.ts`)

**Purpose**: Combines multiple detection methods for maximum accuracy

**Three Detection Methods** (run in parallel):

#### Method 1: AI Analysis
- Uses `analyzeCardImages()` from ai-vision.ts
- Extracts descriptors that mention parallel types
- Searches parallel database against descriptor text

#### Method 2: OCR Text Detection
- Uses Tesseract.js via `extractParallelsFromImages()`
- Focuses on specific card regions (back of card highest priority)
- Detects serial number patterns (e.g., "15/99")
- Matches OCR text against parallel database

#### Method 3: Visual Pattern Analysis
- Analyzes card texture using `analyzeCardTexture()`
- Matches visual characteristics (shimmer, embossing, texture type)
- Maps visual features to known parallel types

**Consolidation Logic**:
- Removes duplicate detections
- Combines evidence from multiple methods
- Uses highest confidence score for each parallel
- Returns results sorted by confidence descending

**Output Interface**:
```typescript
export interface EnhancedScanResult {
  set: string;
  player: string;
  cardNumber?: string;
  descriptors: string;
  confidence: number;
  isGraded?: boolean;
  grade?: string;
  gradingCompany?: string;
  certificationNumber?: string;
  
  // NEW FIELDS
  parallelDetection: ParallelDetectionResult;
  enhancedDescriptors: string;  // Original + detected parallels
}

export interface ParallelDetectionResult {
  detectedParallels: DetectedParallel[];
  confidence: number;  // Overall confidence 0-100
  detectionMethods: DetectionMethod[];  // Which methods were used
  processingTime: number;  // ms to process
}
```

### 2.3 OCR Text Extraction (`/Users/mh/qb1/src/lib/ocr/parallel-ocr.ts`)

**Purpose**: Advanced OCR system specialized for finding parallel information

**Key Strategies**:

1. **Region-Based Scanning** (Prioritized):
   - Back of card regions (highest priority):
     - `back-serial`: Top-left area (Optic serials)
     - `back-center`: Center area (prominent serials)
     - `back-card-number`: Bottom-right (traditional card numbers)
   - Front of card regions (secondary):
     - `front-bottom-left`: Corner serial
     - `front-bottom-right`: Corner serial

2. **Serial Number Detection**:
   ```typescript
   // Patterns detected: #/999, #/299, #/149, #/99, #/49, #/25, #/10, #/5, #/1
   Serial Pattern: /(\d+)\/(\d+)/
   
   // Denominator classification:
   1 → "One of One (1/1)"
   2-5 → "Ultra Rare Serial"
   6-10 → "Super Rare Serial"
   11-25 → "Rare Serial"
   26-50 → "Short Print Serial"
   51-99 → "Limited Serial"
   100-199 → "Numbered Parallel"
   200-299 → "Serial Numbered"
   300-499 → "Numbered Card"
   500-999 → "Base Serial"
   ```

3. **Configuration**:
   ```typescript
   const DEFAULT_OCR_CONFIG: OCRConfig = {
     enablePreprocessing: true,
     confidenceThreshold: 50,  // 0-100
     maxRegions: 4,  // Scan top 4 priority regions
     languages: ['eng'],
     whitelistPatterns: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -#/()[]'
   };
   ```

4. **Tesseract Configuration**:
   - `tessedit_pageseg_mode: '6'` - Uniform block of text
   - `tessedit_ocr_engine_mode: '1'` - LSTM only
   - `preserve_interword_spaces: '1'` - Preserve spacing for serials
   - `user_defined_dpi: '300'` - Higher DPI for small text

### 2.4 Parallel Detection Database (`/Users/mh/qb1/src/lib/parallel-database.ts`)

**Purpose**: Reference database of all known card parallels

**Example Entry**:
```typescript
'dragon-scale': {
  id: 'dragon-scale',
  name: 'Dragon Scale',
  brand: 'Donruss',
  setTypes: ['Donruss Optic', 'Donruss Elite', 'Donruss Racing'],
  visualCharacteristics: {
    texture: 'scale',
    colors: ['silver', 'gold', 'rainbow'],
    finish: 'textured',
    hasShimmer: true,
    hasEmbossing: true,
  },
  ocrPatterns: ['dragon scale', 'dragon', 'scale'],
  commonLocations: ['back-card-number', 'back-description'],
  rarity: 'rare',
  yearRange: { start: 2019 }
}
```

**Key Parallel Types**:
- **Donruss**: Dragon Scale, Optic, Rated Rookie, Press Proof, Elite
- **Panini**: Prizm (Silver, Red, Blue, Gold, Black), Mosaic, Select
- **Topps**: Chrome, Finest, etc.
- **Upper Deck**: Series 1, OPC, etc.

---

## 3. Smart Card Association / Matching

### 3.1 Smart Match Algorithm (`/Users/mh/qb1/src/app/api/smart-match/route.ts`)

**Purpose**: Find matching cards from a checklist based on extracted metadata

**Scoring System** (Higher score = better match):

```
Player Name Matching:
  - Full name match: +100 points
  - Partial name (N/M words): +50 * (N/M) points
  - Last name only: +30 points

Year Matching:
  - Exact year match: +40 points
  - Year range match (e.g., "2023-24" matches "2023"): +35 points

Set Matching:
  - Each word match: +30 * (matches/total_words) points
  - Set abbreviation match: +20 points

Special Features:
  - Auto/Autograph/Signed: +25 points
  - Rookie/RC: +20 points
  - Serial/Numbered: +15 points
  - Parallel/Refractor/Prizm: +15 points
  - Patch/Jersey/Relic: +20 points
  - Color variants: +10 points
  - Base/Insert: +5 points

Card Number Matching:
  - Card number match: +30 points

Serial Number Matching:
  - Serial format match (#/###): +35 points

Brand Matching:
  - Brand match (Panini, Topps, etc.): +15 points

Penalties:
  - Rookie mismatch: -10 points
```

**Example Matching Flow**:
```
Input: "2023-24 Panini Prizm NBA Lebron James #25"
Available Cards in Checklist:
  - "Lebron James", "2023-24 Panini Prizm NBA", "25"
    Score: 100 (name) + 40 (year) + 30 (set) + 30 (card#) = 200 → TOP MATCH

  - "Lebron James", "2024 Panini Donruss", "100"
    Score: 100 (name) + 35 (year range) + 0 (diff set) = 135 → SECONDARY

  - "Michael Jordan", "2024 Topps Chrome", "50"
    Score: 0 (diff player) = 0 → NOT SUGGESTED
```

**Learning System**:
- Tracks user corrections to suggestions
- Stores feedback in `MatchingFeedback` table
- Improves ranking for future similar items

### 3.2 Collection Inference (`/Users/mh/qb1/src/lib/collection-inference.ts`)

**Purpose**: AI-suggests collections a card should belong to

**Inference Rules** (Priority Order):

1. **Player Collection** (100% confidence)
   - "All [Player Name] cards"

2. **Team Collection** (85% confidence)
   - Detects team names in card metadata
   - Supports multiple sports: Football, Basketball, Baseball, NFL

3. **Country Collection** (80% confidence)
   - Identifies player nationality

4. **Set Collection** (90% confidence)
   - "All cards from [Set Name] set"

5. **Year Collection** (70% confidence)
   - "[Year] Cards"

6. **Special Features** (95% confidence):
   - Rookie Cards (includes "rookie" or "rc")
   - Autographed Cards (includes "auto", "autograph", "signed")
   - Graded Cards (isGraded flag)

**Output Example**:
```typescript
{
  cardId: "card-123",
  suggestions: [
    {
      name: "Lebron James",
      type: "player",
      confidence: 100,
      reason: "All Lebron James cards"
    },
    {
      name: "2023-24 Panini Prizm NBA",
      type: "set",
      confidence: 90,
      reason: "All cards from 2023-24 Panini Prizm NBA set"
    },
    {
      name: "Rookie Cards",
      type: "custom",
      confidence: 95,
      reason: "Card is marked as rookie"
    }
  ]
}
```

---

## 4. API Routes and Endpoints

### 4.1 Card Scanning

**POST `/api/cards/scan-enhanced`**
```typescript
Request Body:
{
  photoFrontDataUri: string,        // Base64 data URI
  photoBackDataUri: string,         // Base64 data URI
  config?: {
    enableOCR?: boolean,            // Default: true
    enableVisualAnalysis?: boolean, // Default: true
    enableAIAnalysis?: boolean,     // Default: true
    confidenceThreshold?: number,   // Default: 30 (0-100)
    maxProcessingTime?: number      // Default: 10000ms
  }
}

Response:
{
  success: true,
  data: EnhancedScanResult,
  metadata: {
    processingTime: number,
    detectionMethods: string[],
    parallelCount: number
  }
}
```

**GET `/api/cards/scan-enhanced/status`**
```typescript
Response:
{
  capabilities: {
    ocrSupported: true,
    visualAnalysisSupported: true,
    aiAnalysisSupported: true
  },
  defaultConfig: ParallelDetectionConfig
}
```

### 4.2 Card CRUD

**POST `/api/cards`** - Create card from scanned data
```typescript
Request Body:
{
  year: string,
  set: string,
  player: string,
  cardNumber?: string,
  descriptors?: string,
  category?: string,
  imageFront?: string,
  imageBack?: string,
  isGraded?: boolean,
  grade?: string,
  gradingCompany?: string,
  certificationNumber?: string
}
```

### 4.3 Smart Matching

**POST `/api/smart-match`** - Find matching cards for item description
```typescript
Request Body:
{
  itemDescription: string,    // "2023-24 Panini Prizm Lebron James"
  purchaseItemId?: string     // For learning feedback
}

Response:
{
  matches: CardMatch[],        // Top 10 matches sorted by score
  totalAvailableCards: number
}

interface CardMatch {
  id: string;
  player: string;
  year: string;
  set: string;
  descriptors: string;
  matchScore: number;         // 0-1000+
  matchReasons: string[];     // Why this matched
}
```

### 4.4 Collection Management

**GET `/api/collections`** - Get user's collections
**POST `/api/collections`** - Create new collection
**POST `/api/collections/[id]/cards`** - Add card to collection
**DELETE `/api/collections/[id]/cards?cardId=...`** - Remove card

---

## 5. Image Processing Pipeline

### 5.1 Image Capture & Compression

**Frontend Component**: `scan-card-form.tsx`

**Steps**:
1. Capture front and back images via camera or file upload
2. Compress images (JPEG, max 10MB)
3. Convert to data URIs (base64 encoded)
4. Crop/adjust if needed using react-image-crop

**Image Validation**:
- Supported formats: JPEG, PNG, WebP
- Max size: 5MB base64
- Must include both front and back

### 5.2 Data URI Format

**Example**:
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABAAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWmJmaoqOkpaanqKmqsrO0tba2uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba2uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z
```

---

## 6. Implementation Considerations for footy.bot

### 6.1 Key Differences from QB1

**QB1 Context**: Trading card inventory management
- Cards have defined sets with numbered positions
- Focus on card condition, grading, rarity
- Player-centric organization

**footy.bot Context**: Football/Soccer card collections (assume)
- Different sports have different card structures
- May need sport-specific parallel types
- Collection organization by team, league, season

### 6.2 Required Components

1. **Vision Analysis Adapter**
   - Modify prompts for football/soccer cards
   - Adjust descriptor extraction
   - Update parallel database for sport-specific variants

2. **Set Checklist Matching**
   - Query existing set checklists
   - Match scanned card against checklist items
   - Score based on card attributes (player, number, special edition)

3. **Collection System**
   - Adapt inference rules for football context
   - Support different collection types (League, Team, Season, etc.)
   - Auto-organize scanned cards

### 6.3 Implementation Steps

**Phase 1: Image Analysis**
```
1. Adapt ai-vision.ts for football cards
2. Update Claude prompts with football-specific instructions
3. Define football card attributes (position, club, league, etc.)
```

**Phase 2: Set Matching**
```
1. Build database of football sets and checklists
2. Create matching algorithm for set items
3. Map scanned metadata to set positions
```

**Phase 3: Smart Assignment**
```
1. Implement smart-match for checklist items
2. Suggest collection assignments
3. Support user corrections for learning
```

**Phase 4: UI Integration**
```
1. Create scanning interface
2. Show match suggestions
3. Allow manual assignment if needed
4. Support batch scanning
```

### 6.4 Data Models

**Football Card Structure**:
```typescript
interface FootballCard {
  id: string;
  // Scanned data
  playerName: string;
  teamName: string;
  cardSet: string;        // e.g., "2024 Panini Prizm Premier League"
  cardNumber: string;
  playerPosition?: string; // GK, DEF, MID, FWD
  
  // Metadata
  cardEdition?: string;    // "Base", "Refractor", "Auto", etc.
  season: string;          // "2023-24"
  league?: string;         // "Premier League", "La Liga", etc.
  confidence: number;
  
  // Assignment
  checklistSetId: string;  // Reference to set
  checklistItemId: string; // Position in set
  
  // Media
  imageFront: string;
  imageBack: string;
  
  // Collections
  collectionIds: string[];
}

interface FootballChecklist {
  id: string;
  name: string;
  season: string;
  league: string;
  totalCards: number;
  items: ChecklistItem[];
}

interface ChecklistItem {
  position: number;
  playerName: string;
  teamName: string;
  cardNumber: string;
  variants: CardVariant[];
}

interface CardVariant {
  edition: string;
  rarity: string;
  notes?: string;
}
```

---

## 7. Performance & Optimization

### 7.1 Processing Time Targets

From QB1 documentation:
- OCR Accuracy: >95% for clear images
- Processing Time: <3 seconds per card
- Comp Match Accuracy: >90% for common cards
- Parallel Detection: <10 seconds with all methods

### 7.2 Optimization Strategies

1. **Caching**:
   - Cache OCR results for 24 hours
   - Store embedding vectors permanently
   - Reuse market analysis for 6 hours

2. **Batch Processing**:
   - Group similar cards for analysis
   - Bulk operations on collections
   - Off-peak processing for non-urgent scans

3. **Model Selection**:
   - Claude Sonnet 4 for initial scanning (highest accuracy)
   - Claude 3.5 Haiku for validation (faster, cost-effective)
   - Cached embeddings for similarity

### 7.3 Database Queries

**Optimization**: Use indexed queries
```sql
-- Create indexes for common searches
CREATE INDEX idx_card_player ON "Card"(player);
CREATE INDEX idx_card_set ON "Card"(set);
CREATE INDEX idx_card_year ON "Card"(year);
CREATE INDEX idx_collection_user ON "Collection"("userId");
```

---

## 8. Error Handling & Fallbacks

### 8.1 OCR Failures

1. Retry with enhanced image (contrast/brightness adjustment)
2. Manual review queue for human verification
3. Partial data acceptance with user confirmation

### 8.2 AI Response Validation

```typescript
const validateAIResponse = (response) => {
  // Check required fields
  if (!response.playerName || !response.set) {
    return { valid: false, reason: 'Missing critical fields' };
  }
  
  // Validate confidence threshold
  if (response.confidence < 0.7) {
    return { valid: false, reason: 'Low confidence score' };
  }
  
  // Validate year format
  if (!/^\d{4}/.test(response.year) && !/^\d{4}-\d{2,4}/.test(response.year)) {
    return { valid: false, reason: 'Invalid year format' };
  }
  
  return { valid: true };
};
```

### 8.3 Matching Fallbacks

- If no high-confidence matches: show top 5 candidates for user selection
- If match confidence < 50: mark as "needs review"
- Provide manual override capability

---

## 9. Security Considerations

### 9.1 Data Protection

- PII removal from stored prompts
- Encrypted storage of card images
- Rate limiting on AI endpoints (prevent API abuse)
- User-specific access tokens

### 9.2 Prompt Injection Prevention

```typescript
const sanitizeUserInput = (input) => {
  return input
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:/gi, '')
    .replace(/\{\{.*\}\}/g, '')
    .substring(0, 1000);  // Max length
};
```

### 9.3 Image Validation

- Validate MIME types
- Check file size limits (max 5MB)
- Scan for malicious content
- Require authentication for uploads

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// Test card metadata extraction
test('extracts player name correctly', async () => {
  const result = await analyzeCardImages({ 
    photoFrontDataUri: mockImage,
    photoBackDataUri: mockImage 
  });
  expect(result.player).toBe('Lionel Messi');
});

// Test smart matching
test('scores exact name match highest', () => {
  const score = calculateMatchScore('2024 Panini Prizm Messi', cardData);
  expect(score.score).toBeGreaterThan(150);
});

// Test parallel detection
test('detects serial numbers', async () => {
  const matches = await extractParallelsFromImages(frontURI, backURI);
  expect(matches.some(m => m.text.includes('/')));
});
```

### 10.2 Integration Tests

- End-to-end scan workflow
- API mock responses
- Database transactions
- Collection creation and assignment

### 10.3 Performance Tests

- Concurrent scan processing
- Large image handling
- API throttling behavior
- Database query performance

---

## 11. File Reference Summary

### QB1 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `/src/ai/ai-vision.ts` | Claude Vision analysis | 450 |
| `/src/ai/flows/enhanced-scan-card-image.ts` | Multi-method detection | 406 |
| `/src/ai/flows/scan-card-image.ts` | Basic scanning | 34 |
| `/src/lib/ocr/parallel-ocr.ts` | Tesseract OCR engine | 393 |
| `/src/lib/parallel-database.ts` | Parallel types DB | 500+ |
| `/src/types/parallel-types.ts` | TypeScript interfaces | 150+ |
| `/src/app/api/cards/scan-enhanced/route.ts` | Scan endpoint | 80 |
| `/src/app/api/smart-match/route.ts` | Matching endpoint | 266 |
| `/src/app/api/collections/route.ts` | Collection CRUD | 90 |
| `/src/app/api/collections/[id]/cards/route.ts` | Collection management | 83 |
| `/src/lib/collection-inference.ts` | Auto-collection suggestion | 324 |
| `/src/components/scan-card-form.tsx` | UI component | 400+ |
| `/src/components/card-collection-assignment.tsx` | Collection UI | 250+ |
| `/src/lib/db.ts` | Database operations | 500+ |

---

## 12. Next Steps for Implementation

1. **Review** the QB1 codebase in detail, especially:
   - ai-vision.ts prompt engineering
   - parallel-ocr.ts region detection strategy
   - smart-match.ts scoring algorithm

2. **Adapt** for football/soccer context:
   - Modify AI prompts for sport-specific cards
   - Create football-specific parallel database
   - Build set/checklist matching logic

3. **Implement** core features incrementally:
   - Start with basic vision analysis
   - Add OCR enhancement layer
   - Implement smart matching
   - Build collection inference

4. **Test** thoroughly:
   - Unit test each component
   - Integration test full workflow
   - Performance test with real data

5. **Deploy** and monitor:
   - Set up analytics for detection accuracy
   - Track user corrections
   - Iterate on matching algorithm

---

## References

- QB1 Documentation: `/Users/mh/qb1/ai-scancard-flow.md`
- Claude Vision API: https://docs.anthropic.com/claude/reference/vision
- Tesseract.js: https://tesseract.projectnaptha.com/
- Card Database Patterns: QB1 parallel-database.ts structure

