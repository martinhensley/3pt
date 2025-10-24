# AI Card Scanning - Implementation Guide for footy.bot

## Executive Summary

The QB1 project contains a complete, production-ready card scanning system. This guide explains how to adapt it for football/soccer card collections.

**Key Assets Available**:
- Claude Vision API integration for image analysis
- Multi-method parallel detection (OCR + AI + Visual)
- Smart matching algorithm with scoring system
- Collection inference engine
- Full database integration

**Time Estimate**: 3-4 weeks for complete implementation

---

## Phase 1: Planning & Design (Days 1-3)

### 1.1 Understand QB1 Architecture
- Read: `/Users/mh/qb1/ai-scancard-flow.md`
- Read: `/Users/mh/qb1/src/ai/ai-vision.ts` (Claude Vision integration)
- Read: `/Users/mh/qb1/src/app/api/smart-match/route.ts` (Matching algorithm)
- Review types: `/Users/mh/qb1/src/lib/parallel-database.ts`

### 1.2 Define Football Card Structure
```typescript
// Example structure for football cards
interface FootballCard {
  // Identification
  playerName: string;
  teamName: string;
  playerNumber: string;
  playerPosition: 'GK' | 'DEF' | 'MID' | 'FWD';
  
  // Set Information
  setName: string;              // "2024 Panini Prizm Premier League"
  setSeason: string;            // "2023-24"
  setLeague: string;            // "Premier League", "La Liga", etc.
  cardEdition: string;          // "Base", "Refractor", "Auto"
  
  // Matching & Organization
  checklistId: string;
  checklistPosition: number;
  matchConfidence: number;      // 0-100
  
  // Media & Storage
  imageFront: string;           // Base64 data URI
  imageBack: string;
  
  // Collections
  collectionIds: string[];
}
```

### 1.3 Define Set/Checklist Structure
```typescript
interface FootballChecklist {
  id: string;
  name: string;                 // "2024 Panini Prizm Premier League"
  brand: string;                // "Panini"
  season: string;               // "2023-24"
  league: string;
  totalCards: number;
  items: ChecklistItem[];
}

interface ChecklistItem {
  position: number;
  playerName: string;
  teamId: string;
  playerNumber: string;
  position: string;             // GK, DEF, MID, FWD
  variants: CardVariant[];      // Base, Refractor, etc.
}
```

### 1.4 Create Migration Plan
- Import existing QB1 code as reference
- Identify reusable components (OCR, matching, collections)
- Plan sport-specific customizations
- Design database schema

---

## Phase 2: Core Infrastructure (Days 4-7)

### 2.1 Set Up AI Vision Integration

**Location**: Create `lib/card-scanner/vision.ts`

**Based on**: `/Users/mh/qb1/src/ai/ai-vision.ts`

**Customize**:
```typescript
// Adapt the Claude Vision prompt for football
const FOOTBALL_CARD_ANALYSIS_PROMPT = `
You are an expert in football/soccer trading cards.

Extract the following from card images:
- Player name
- Team name
- Player number
- Player position (GK/DEF/MID/FWD)
- Set name (include year/season)
- Card edition (Base, Refractor, Autograph, etc.)
- Card number in set
- Special features (limited edition, serial number, etc.)

Key differences from sports cards:
- Look for team logo/colors
- Identify player position from card
- Common football card parallels: Refractor, Autograph, Serial Numbered
- Two-year format for seasons: "2023-24" not "2024"

Return JSON with: player, team, playerNumber, position, set, cardNumber, edition, descriptors, confidence
`;
```

**Key Files to Review**:
- `/Users/mh/qb1/src/ai/ai-vision.ts` (Lines 26-240: analyzeCardImages function)
- `/Users/mh/qb1/src/ai/flows/scan-card-image.ts` (Lines 31-33: Function wrapper)

### 2.2 Set Up OCR Enhancement

**Location**: Create `lib/card-scanner/ocr.ts`

**Based on**: `/Users/mh/qb1/src/lib/ocr/parallel-ocr.ts`

**Key Components**:
```typescript
// Region priorities for football cards
export const FOOTBALL_TEXT_REGIONS: Record<TextLocation, BoundingBox> = {
  // Serial numbers on back (top priority)
  'back-serial': { x: 0, y: 0, width: 0.3, height: 0.15 },
  'back-card-number': { x: 0.7, y: 0.85, width: 0.3, height: 0.15 },
  
  // Front corner numbers
  'front-top-left': { x: 0, y: 0, width: 0.3, height: 0.15 },
  'front-bottom-left': { x: 0, y: 0.85, width: 0.3, height: 0.15 },
  
  // Card description areas
  'back-center': { x: 0.25, y: 0.4, width: 0.5, height: 0.2 },
};
```

**Serial Pattern Detection**:
```typescript
// Football cards often have serials like:
// "15/99", "25/49", "1/1"
const serialPatterns = [
  /(\d+)\/(\d+)/g,  // Standard: 15/99
  /(\d+) of (\d+)/gi  // Alternative: "15 of 99"
];
```

**Key Files to Review**:
- `/Users/mh/qb1/src/lib/ocr/parallel-ocr.ts` (Lines 99-225: extractParallelText method)
- `/Users/mh/qb1/src/lib/ocr/parallel-ocr.ts` (Lines 256-314: Serial number detection)

### 2.3 Create Parallel Database

**Location**: Create `lib/card-data/football-parallels.ts`

**Based on**: `/Users/mh/qb1/src/lib/parallel-database.ts`

**Football Card Parallels**:
```typescript
export const FOOTBALL_PARALLELS: Record<string, ParallelType> = {
  'refractor': {
    id: 'refractor',
    name: 'Refractor',
    brands: ['Panini', 'Topps'],
    visualCharacteristics: {
      texture: 'smooth',
      colors: ['rainbow', 'chrome'],
      finish: 'refractor',
      hasShimmer: true
    },
    ocrPatterns: ['refractor', 'refract'],
    commonLocations: ['back-card-number']
  },
  'autograph': {
    id: 'autograph',
    name: 'Autograph',
    brands: ['Panini', 'Upper Deck'],
    ocrPatterns: ['auto', 'autograph', 'signed', 'autos'],
    commonLocations: ['front-bottom', 'back-center']
  },
  // ... more parallels
};
```

**Key Files to Review**:
- `/Users/mh/qb1/src/lib/parallel-database.ts` (Lines 1-150: Database structure)
- `/Users/mh/qb1/src/types/parallel-types.ts` (Lines 1-70: ParallelType interface)

---

## Phase 3: Matching & Collection Logic (Days 8-12)

### 3.1 Implement Smart Matching

**Location**: Create `lib/card-matching/smart-match.ts`

**Based on**: `/Users/mh/qb1/src/app/api/smart-match/route.ts`

**Football-Specific Scoring**:
```typescript
function calculateFootballMatchScore(
  scannedCard: ScannedCardData,
  checklistItem: ChecklistItem
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // Player name: +100 (exact) or +50 (last name only)
  if (normalizeString(scannedCard.playerName) === 
      normalizeString(checklistItem.playerName)) {
    score += 100;
    reasons.push('Player name exact match');
  }
  
  // Team: +40 points
  if (normalizeString(scannedCard.team) === 
      normalizeString(checklistItem.team)) {
    score += 40;
    reasons.push('Team match');
  }
  
  // Player number: +50 points (high priority in football)
  if (scannedCard.playerNumber === checklistItem.playerNumber) {
    score += 50;
    reasons.push('Player number match');
  }
  
  // Position: +20 points
  if (scannedCard.position === checklistItem.position) {
    score += 20;
    reasons.push('Position match');
  }
  
  // Set/Season: +30 points
  if (scannedCard.season === checklistItem.season) {
    score += 30;
    reasons.push('Season match');
  }
  
  // Edition/parallel: +15 points
  if (scannedCard.edition === checklistItem.edition) {
    score += 15;
    reasons.push('Edition match');
  }
  
  return { score, reasons };
}
```

**Key Differences from QB1**:
- Add player position matching (GK/DEF/MID/FWD)
- Prioritize player number (football-specific identifier)
- Add season matching for multi-year formats
- Less emphasis on card number (football cards organized by player number)

**Key Files to Review**:
- `/Users/mh/qb1/src/app/api/smart-match/route.ts` (Lines 92-231: calculateMatchScore)

### 3.2 Implement Collection Inference

**Location**: Create `lib/collections/inference.ts`

**Based on**: `/Users/mh/qb1/src/lib/collection-inference.ts`

**Football-Specific Collections**:
```typescript
export function inferFootballCollections(
  card: FootballCard,
  existingCollections: Collection[]
): InferenceResult {
  const suggestions: InferenceResult['suggestions'] = [];
  
  // 1. Player Collection (100%)
  suggestions.push({
    name: card.playerName,
    type: 'player',
    confidence: 100,
    reason: `All ${card.playerName} cards`
  });
  
  // 2. Team Collection (90%)
  suggestions.push({
    name: card.teamName,
    type: 'team',
    confidence: 90,
    reason: `All ${card.teamName} cards`
  });
  
  // 3. League Collection (85%)
  if (card.league) {
    suggestions.push({
      name: card.league,
      type: 'league',  // Add new type
      confidence: 85,
      reason: `All ${card.league} cards`
    });
  }
  
  // 4. Season Collection (80%)
  suggestions.push({
    name: `${card.season} Season`,
    type: 'season',  // Add new type
    confidence: 80,
    reason: `All cards from ${card.season} season`
  });
  
  // 5. Position Collection (75%)
  if (card.playerPosition) {
    const positionNames = {
      'GK': 'Goalkeepers',
      'DEF': 'Defenders',
      'MID': 'Midfielders',
      'FWD': 'Forwards'
    };
    suggestions.push({
      name: positionNames[card.playerPosition],
      type: 'position',  // Add new type
      confidence: 75,
      reason: `All ${card.playerPosition} cards`
    });
  }
  
  // 6. Special Features
  if (card.cardEdition !== 'Base') {
    suggestions.push({
      name: `${card.cardEdition} Cards`,
      type: 'special',
      confidence: 90,
      reason: `All ${card.cardEdition} edition cards`
    });
  }
  
  return { cardId: card.id, suggestions };
}
```

**New Collection Types for Football**:
- `league`: "Premier League", "La Liga", etc.
- `season`: "2023-24 Season"
- `position`: "Goalkeepers", "Defenders", "Midfielders", "Forwards"
- `special`: "Refractor Cards", "Autograph Cards", etc.

**Key Files to Review**:
- `/Users/mh/qb1/src/lib/collection-inference.ts` (Lines 90-250: inferCollections)

---

## Phase 4: API Routes & Database (Days 13-17)

### 4.1 Create Scanning API Route

**Location**: Create `app/api/scan-football-card/route.ts`

**Based on**: `/Users/mh/qb1/src/app/api/cards/scan-enhanced/route.ts`

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { photoFrontDataUri, photoBackDataUri } = body;

  // Step 1: Analyze with Claude Vision
  const visionResult = await analyzeFootballCardImage({
    photoFrontDataUri,
    photoBackDataUri
  });

  // Step 2: OCR Enhancement
  const ocrResults = await extractParallelsFromImages(
    photoFrontDataUri,
    photoBackDataUri
  );

  // Step 3: Combine results
  const enhancedResult = combineDetectionResults(
    visionResult,
    ocrResults
  );

  // Step 4: Find matching checklist items
  const matches = await findChecklistMatches(enhancedResult);

  // Step 5: Infer collections
  const collections = inferFootballCollections(enhancedResult, userCollections);

  return NextResponse.json({
    success: true,
    scannedCard: enhancedResult,
    suggestedMatches: matches,
    suggestedCollections: collections
  });
}
```

**Key Files to Review**:
- `/Users/mh/qb1/src/app/api/cards/scan-enhanced/route.ts` (All lines: Full endpoint)

### 4.2 Create Smart Match API

**Location**: Create `app/api/smart-match-football/route.ts`

**Based on**: `/Users/mh/qb1/src/app/api/smart-match/route.ts`

**Football Differences**:
- Query checklist items instead of general cards
- Use player number as key identifier
- Match against specific set
- Return position information

### 4.3 Update Database Schema

**Location**: Update `lib/db.ts`

**Add Football-Specific Tables**:
```sql
-- Football Checklists
CREATE TABLE "FootballChecklist" (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  brand VARCHAR(100),
  season VARCHAR(10),        -- "2023-24"
  league VARCHAR(100),       -- "Premier League"
  totalCards INTEGER,
  createdAt TIMESTAMP
);

-- Checklist Items
CREATE TABLE "ChecklistItem" (
  id UUID PRIMARY KEY,
  checklistId UUID NOT NULL,
  position INTEGER,          -- Order in set
  playerName VARCHAR(255),
  teamId VARCHAR(100),
  playerNumber VARCHAR(10),
  playerPosition VARCHAR(3), -- GK, DEF, MID, FWD
  variants TEXT[],           -- ["Base", "Refractor", "Auto"]
  createdAt TIMESTAMP,
  FOREIGN KEY (checklistId) REFERENCES "FootballChecklist"(id)
);

-- Update Card Table
ALTER TABLE "Card" ADD COLUMN (
  league VARCHAR(100),
  playerPosition VARCHAR(3),
  checklistItemId UUID,
  detectionMethods TEXT[]
);
```

**Key Files to Review**:
- `/Users/mh/qb1/src/lib/db.ts` (Lines 52-195: Card creation and operations)

---

## Phase 5: UI Components (Days 18-21)

### 5.1 Create Scanning Form

**Location**: Create `components/football-scan-form.tsx`

**Based on**: `/Users/mh/qb1/src/components/scan-card-form.tsx`

**Customizations for Football**:
- Add team selector/display
- Show player position
- Display player number prominently
- Add league selector
- Show season year

### 5.2 Create Match Suggestion UI

**Location**: Create `components/match-suggestion.tsx`

**Football-Specific Display**:
```tsx
export function MatchSuggestion({ match }: { match: MatchResult }) {
  return (
    <Card className="cursor-pointer hover:bg-gray-50">
      <CardContent className="pt-6">
        {/* Team logo or badge */}
        <TeamBadge team={match.team} />
        
        {/* Player info */}
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold">{match.playerNumber}</div>
          <div>
            <h3 className="font-bold">{match.playerName}</h3>
            <p className="text-sm text-gray-600">{match.position}</p>
          </div>
        </div>
        
        {/* Set info */}
        <div className="text-sm mt-2">
          <span className="text-gray-600">{match.season} {match.league}</span>
        </div>
        
        {/* Match score */}
        <MatchScore score={match.score} reasons={match.matchReasons} />
      </CardContent>
    </Card>
  );
}
```

**Key Files to Review**:
- `/Users/mh/qb1/src/components/scan-card-form.tsx` (Lines 1-150: Form structure)
- `/Users/mh/qb1/src/components/card-collection-assignment.tsx` (Lines 30-95: Collection UI)

---

## Phase 6: Testing & Deployment (Days 22-28)

### 6.1 Unit Tests

**Location**: Create `__tests__/card-scanning.test.ts`

```typescript
describe('Football Card Scanning', () => {
  test('extracts player name and number correctly', async () => {
    const result = await analyzeFootballCardImage(mockCardImages);
    expect(result.playerName).toBe('Lionel Messi');
    expect(result.playerNumber).toBe('10');
  });

  test('detects serial numbers in OCR', async () => {
    const matches = await extractParallelsFromImages(front, back);
    expect(matches.some(m => m.text.includes('/'))).toBe(true);
  });

  test('calculates match score correctly', () => {
    const score = calculateFootballMatchScore(scannedCard, checklistItem);
    expect(score.score).toBeGreaterThan(100);
  });
});
```

### 6.2 Integration Tests

- End-to-end scan workflow
- Database operations
- Collection creation
- Smart matching accuracy

### 6.3 Performance Tests

- Scan processing < 3 seconds
- Match queries < 1 second
- Batch scanning (10+ cards)
- Concurrent user scans

### 6.4 Quality Assurance

- Test with real football cards
- Verify OCR accuracy on various card brands
- Test edge cases:
  - Cards with player name variants
  - Multi-language team names
  - Damaged/worn cards
  - High-gloss vs matte finishes
- User acceptance testing

---

## Code Reuse Strategy

### Components to Copy Directly
1. `/Users/mh/qb1/src/lib/ocr/parallel-ocr.ts` - Tesseract integration
2. `/Users/mh/qb1/src/components/card-collection-assignment.tsx` - Collection UI
3. `/Users/mh/qb1/src/lib/db.ts` - Database utilities (with modifications)

### Components to Adapt
1. `/Users/mh/qb1/src/ai/ai-vision.ts` - Modify prompts for football
2. `/Users/mh/qb1/src/app/api/smart-match/route.ts` - Add football-specific scoring
3. `/Users/mh/qb1/src/lib/collection-inference.ts` - Add position/league collections

### Components to Create New
1. Football parallel database (analog to parallel-database.ts)
2. Football-specific vision prompt
3. Checklist matching logic
4. Football card UI components

---

## Deployment Checklist

- [ ] Set up Claude API key
- [ ] Configure database with football schema
- [ ] Deploy scanning API endpoint
- [ ] Deploy matching API endpoint
- [ ] Populate initial checklist data
- [ ] Set up image storage
- [ ] Configure file upload limits
- [ ] Set up error logging
- [ ] Configure rate limiting
- [ ] Deploy UI components
- [ ] QA testing on staging
- [ ] Production deployment
- [ ] Monitor API performance
- [ ] Gather user feedback

---

## Key Metrics to Track

1. **Scanning Accuracy**:
   - Player name extraction accuracy
   - Card number accuracy
   - Parallel detection accuracy

2. **Matching Performance**:
   - Top-1 match accuracy
   - Top-5 match accuracy
   - Average match score

3. **Performance**:
   - Scan processing time
   - Match query time
   - API response time

4. **User Behavior**:
   - Scanning volume
   - User corrections
   - Collection creation rate

---

## Future Enhancements

1. **Batch Scanning**: Process multiple cards at once
2. **Card Grading**: Add grading estimation
3. **Price Estimation**: Market value lookup
4. **Duplicate Detection**: Flag when same card scanned twice
5. **Team Stats**: Show player stats and team info
6. **Social Features**: Share collections, compare with other users
7. **Mobile App**: Native iOS/Android scanning app
8. **AR Features**: Augmented reality card preview

---

## Support Resources

**QB1 Reference Code**:
- `/Users/mh/qb1/src/ai/ai-vision.ts` - Vision analysis
- `/Users/mh/qb1/src/lib/ocr/parallel-ocr.ts` - OCR engine
- `/Users/mh/qb1/src/app/api/smart-match/route.ts` - Matching algorithm

**Documentation**:
- `/Users/mh/qb1/ai-scancard-flow.md` - Architecture overview
- This document - Implementation guide

**External Resources**:
- Claude Vision API: https://docs.anthropic.com/claude/reference/vision
- Tesseract.js: https://tesseract.projectnaptha.com/
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction

---

**Document Version**: 1.0
**Last Updated**: 2024-10-24
**Author**: Analysis of QB1 Project
**Target**: footy.bot Implementation
