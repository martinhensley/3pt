# Card Scanning Workflow - Quick Reference Guide

## 1. End-to-End Data Flow

```
STEP 1: Image Capture
├─ Front photo: base64 data URI
├─ Back photo: base64 data URI
└─ Validation: JPEG/PNG, <5MB

STEP 2: AI Vision Analysis (Claude Sonnet 4)
├─ Input: Both image URIs
├─ Prompt: Extract player, set, year, descriptors
├─ Output: Card metadata + confidence score
└─ Time: ~1-2 seconds

STEP 3: Multi-Method Parallel Detection
├─ Method A: OCR Text Detection (Tesseract)
│   ├─ Scan back-serial region (top priority)
│   ├─ Detect serial patterns: /(\d+)\/(\d+)/
│   └─ Match against parallel database
├─ Method B: Visual Analysis
│   ├─ Analyze texture (scale, mosaic, chrome)
│   ├─ Detect shimmer/embossing
│   └─ Map to known parallel types
└─ Method C: AI Descriptor Parsing
    ├─ Search descriptors for parallel names
    └─ Cross-reference database

STEP 4: Consolidate Results
├─ Merge duplicate detections
├─ Calculate overall confidence
└─ Sort by confidence descending

STEP 5: Smart Matching Against Checklist
├─ Query available checklist items
├─ Score each match:
│   ├─ Player name: 0-100 points
│   ├─ Year: 0-40 points
│   ├─ Set: 0-30 points
│   ├─ Card number: 0-30 points
│   └─ Special features: 0-25 points
├─ Sort matches by score
└─ Return top 10 suggestions

STEP 6: Collection Inference
├─ Suggest Player collection
├─ Suggest Team collection
├─ Suggest Set collection
├─ Suggest Year collection
├─ Suggest Special collections (Rookie, Auto, Graded)
└─ Auto-assign to existing or create new

STEP 7: Store to Database
├─ Create Card record
├─ Add to Collections
├─ Store images (front/back)
└─ Record confidence & detection methods
```

## 2. Key Algorithms

### Smart Match Scoring Formula
```
SCORE = playerNameMatch + yearMatch + setMatch + cardNumberMatch + specialFeatures + brands - penalties

Example:
  Item: "2024 Panini Prizm Messi #10"
  
  Match vs Checklist Item:
  - Player "Messi": +100 (full name)
  - Year "2024": +40 (exact match)
  - Set "Panini Prizm": +30 (set match)
  - Card #10: +30 (card number match)
  - Brand "Panini": +15 (brand match)
  ────────────
  TOTAL SCORE: 215 ✓ TOP MATCH
```

### OCR Serial Number Classification
```
Denominator → Classification
1          → One of One (1/1)
2-5        → Ultra Rare Serial
6-10       → Super Rare Serial
11-25      → Rare Serial
26-50      → Short Print Serial
51-99      → Limited Serial
100-199    → Numbered Parallel
200-299    → Serial Numbered
300-499    → Numbered Card
500-999    → Base Serial
```

### Confidence Calculation
```
PARALLEL_DETECTION_CONFIDENCE = Average(detected_parallel_confidences)

Example:
  Dragon Scale detected by:
  - OCR: 85% confidence
  - AI: 70% confidence
  ────────────────────
  Overall: 77.5% confidence ✓
```

## 3. Critical Code Sections

### Image Analysis Prompt (Claude Vision)
```
Key Instructions:
1. Set MUST include year: "2024 Panini Prizm" not just "Panini Prizm"
2. Look for parallel text on back near card number
3. Common parallels: Dragon Scale, Optic, Prizm Silver, etc.
4. Serial format: "15/99", "1 of 1", "023/150"
5. Grading = Professional company + numerical grade + cert number
   (Authentication alone ≠ Grading)
6. Include ALL descriptors: parallels, autos, rookies, serials
```

### Parallel Database Entry Structure
```typescript
{
  id: 'dragon-scale',
  name: 'Dragon Scale',
  brand: 'Donruss',
  setTypes: ['Donruss Optic'],
  visualCharacteristics: {
    texture: 'scale',      // From texture-detector
    colors: ['silver'],
    finish: 'textured',    // foil, chrome, holographic, etc.
    hasShimmer: true,
    hasEmbossing: true
  },
  ocrPatterns: ['dragon scale', 'dragon', 'scale'],
  commonLocations: ['back-card-number'],
  rarity: 'rare',
  yearRange: { start: 2019 }
}
```

### Region Priority for OCR
```
HIGHEST: back-serial, back-center (Optic serials on back)
HIGH:    back-card-number (traditional card numbers)
MEDIUM:  front-bottom-left, front-bottom-right (corner serials)
LOW:     front-top, back-header, back-footer (less likely)
```

## 4. API Usage Examples

### Scan Card
```bash
POST /api/cards/scan-enhanced

{
  "photoFrontDataUri": "data:image/jpeg;base64,...",
  "photoBackDataUri": "data:image/jpeg;base64,...",
  "config": {
    "enableOCR": true,
    "enableVisualAnalysis": true,
    "enableAIAnalysis": true,
    "confidenceThreshold": 30
  }
}

Response:
{
  "success": true,
  "data": {
    "set": "2024 Panini Prizm Premier League",
    "player": "Lionel Messi",
    "cardNumber": "10",
    "descriptors": "Base, Prizm Silver, Numbered 15/99",
    "confidence": 92,
    "parallelDetection": {
      "detectedParallels": [
        {
          "parallelType": { "name": "Prizm Silver", "rarity": "common" },
          "confidence": 85
        }
      ],
      "detectionMethods": ["ai-analysis", "ocr-text"]
    }
  }
}
```

### Smart Match
```bash
POST /api/smart-match

{
  "itemDescription": "2024 Panini Prizm Messi #10"
}

Response:
{
  "matches": [
    {
      "id": "card-123",
      "player": "Lionel Messi",
      "year": "2024",
      "set": "2024 Panini Prizm Premier League",
      "matchScore": 215,
      "matchReasons": ["Full player name match", "Year match", "Set match", "Card number match"]
    },
    {
      "id": "card-456",
      "player": "Lionel Messi",
      "year": "2023",
      "set": "2023 Panini Donruss",
      "matchScore": 135,
      "matchReasons": ["Full player name match", "Year range match"]
    }
  ],
  "totalAvailableCards": 1250
}
```

### Collection Inference
```bash
Request: Card with metadata
  {
    "player": "Lionel Messi",
    "year": "2024",
    "set": "2024 Panini Prizm Premier League",
    "team": "Inter Miami",
    "descriptors": "rookie"
  }

Response:
  {
    "cardId": "card-123",
    "suggestions": [
      { "name": "Lionel Messi", "type": "player", "confidence": 100 },
      { "name": "Inter Miami", "type": "team", "confidence": 85 },
      { "name": "2024 Panini Prizm Premier League", "type": "set", "confidence": 90 },
      { "name": "Rookie Cards", "type": "custom", "confidence": 95 }
    ]
  }
```

## 5. Database Schema (Simplified)

```sql
-- Cards Table
CREATE TABLE "Card" (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  year VARCHAR(10),           -- "2024" or "2023-24"
  set VARCHAR(255),           -- Full set name with year
  player VARCHAR(255),
  cardNumber VARCHAR(50),
  descriptors TEXT,           -- Comma-separated
  imageFront TEXT,            -- Base64 data URI
  imageBack TEXT,
  isGraded BOOLEAN,
  grade VARCHAR(10),          -- "9.8"
  gradingCompany VARCHAR(50), -- "PSA", "CGC", etc.
  certificationNumber VARCHAR(50),
  confidence INTEGER,         -- 0-100
  parallelDetectionMethods TEXT[], -- ["ocr-text", "ai-analysis"]
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Collections Table
CREATE TABLE "Collection" (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  name VARCHAR(255),
  type VARCHAR(50),           -- "player", "team", "set", "custom"
  cardIds UUID[],             -- Array of card IDs
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Matching Feedback (for learning)
CREATE TABLE "MatchingFeedback" (
  id UUID PRIMARY KEY,
  purchaseItemId UUID,
  suggestedCardId UUID,
  actualCardId UUID,
  suggestionRank INTEGER,
  wasCorrect BOOLEAN,
  createdAt TIMESTAMP
);
```

## 6. Important Constants

### Confidence Thresholds
```typescript
OCR_CONFIDENCE_THRESHOLD = 50      // Minimum OCR score to consider
PARALLEL_CONFIDENCE_MINIMUM = 30   // Below 30% not returned
MATCH_SCORE_THRESHOLD_HIGH = 150   // Highly confident match
MATCH_SCORE_THRESHOLD_MEDIUM = 75  // Review suggested
MATCH_SCORE_THRESHOLD_LOW = 30     // Manual review needed
```

### Processing Limits
```typescript
MAX_OCR_REGIONS = 4                // Scan top 4 priority regions
MAX_PARALLEL_DETECTIONS = 5        // Return top 5 parallels
MAX_MATCH_SUGGESTIONS = 10         // Return top 10 card matches
MAX_COLLECTION_SUGGESTIONS = 8     // Suggest top 8 collections
MAX_IMAGE_SIZE = 5_000_000         // 5MB base64
MAX_PROCESSING_TIME = 10_000       // 10 seconds total
```

## 7. Collection Types & Examples

```
player          "Lionel Messi"
team            "Inter Miami", "Barcelona"
country         "Argentina", "Spain"
set             "2024 Panini Prizm Premier League"
year            "2024 Cards"
custom          "Rookie Cards", "Autographed Cards", "Graded Cards"
```

## 8. Special Case Handling

### Two-Year Formats (Hockey, Basketball, Soccer)
```
Input from card: "2023-24 Season"
Output: set = "2023-24 [Brand] [League]" (KEEP FULL YEAR)
Not: "2024" (INCORRECT)
```

### Grading Validation
```
VALID GRADING:
  "CGC 9.8 Certificate 987654"
  "PSA 10 Cert #123456"

INVALID (Authentication only):
  "eBay Authenticity Guarantee"
  "PWCC Authentication"
  "Raw, ungraded"
```

### Serial Number Examples
```
Valid:
  "15/99"
  "1 of 1" → "One of One (1/1)"
  "023/150" → "Numbered Parallel"

Invalid (not matched):
  "15" (missing denominator)
  "99" (missing numerator)
  "Serial #1234" (missing format)
```

## 9. Testing Checklist

```
UNIT TESTS:
[ ] AI Vision extracts all fields correctly
[ ] OCR detects serial patterns: /(\d+)\/(\d+)/
[ ] Parallel database lookups work
[ ] Confidence scores calculated correctly

INTEGRATION TESTS:
[ ] Full scan-to-match workflow
[ ] Database CRUD operations
[ ] Collection creation & assignment
[ ] API endpoints respond correctly

PERFORMANCE TESTS:
[ ] Scan processing < 3 seconds
[ ] Match scoring < 1 second
[ ] Collection inference < 500ms
[ ] Concurrent scans handled properly
```

## 10. Common Issues & Solutions

```
ISSUE: Parallel detected but low confidence
SOLUTION: Check if parallel name in descriptor vs OCR patterns

ISSUE: Wrong card matched in checklist
SOLUTION: Adjust scoring weights in calculateMatchScore()

ISSUE: OCR missing serial numbers
SOLUTION: Check image quality, adjust Tesseract DPI/mode

ISSUE: Collection inference missing type
SOLUTION: Add team/country to detection rules

ISSUE: Processing timeout
SOLUTION: Reduce maxRegions in OCR config or increase maxProcessingTime
```

## 11. File Locations (QB1 Reference)

```
Core Logic:
  /src/ai/ai-vision.ts (Vision analysis)
  /src/ai/flows/enhanced-scan-card-image.ts (Multi-method detection)
  /src/lib/ocr/parallel-ocr.ts (OCR engine)
  /src/lib/parallel-database.ts (Parallel types)

API Routes:
  /src/app/api/cards/scan-enhanced/route.ts (Scan endpoint)
  /src/app/api/smart-match/route.ts (Matching)
  /src/app/api/collections/route.ts (Collections CRUD)

UI Components:
  /src/components/scan-card-form.tsx (Scanning form)
  /src/components/card-collection-assignment.tsx (Collections)

Database:
  /src/lib/db.ts (Database operations)
  /src/lib/collection-inference.ts (Auto-suggestions)
```

---

**Last Updated**: 2024-10-24
**Source Project**: QB1 (/Users/mh/qb1/)
**Target Project**: footy.bot (/Users/mh/footy/)
