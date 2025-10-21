# Enhanced Data Model - Implementation Summary

## Completed Work (Phases 1-3)

### Phase 1: Foundation ✅
1. **Installed Libraries**: `pdf-parse` and `csv-parse`
2. **Created `/lib/documentParser.ts`**: Universal document parser supporting PDFs, CSVs, HTML, text, and images
3. **Updated `/app/api/upload/route.ts`**: Now accepts PDFs, CSVs, HTML, and text files in addition to images
4. **Created `/lib/database.ts`**: Complete set of database helper functions for Manufacturers, Releases, Sets, and Cards
5. **Created API Endpoints**:
   - `/app/api/library/manufacturers/route.ts`
   - `/app/api/library/releases/route.ts`
   - `/app/api/library/sets/route.ts`

### Phase 2: Enhanced AI Analysis ✅
1. **Updated `/lib/ai.ts`** with new analysis functions:
   - `analyzeReleaseDocuments()`: Analyzes multiple documents (PDFs, CSVs, images) for release info
   - `analyzeSetDocumentsWithCards()`: Analyzes set documents and extracts individual cards
   - `analyzeCardWithContext()`: Analyzes cards with Set/Release context
2. **Added Zod Schemas** for structured data extraction
3. **Multi-document support**: Can now parse and analyze any combination of files

### Phase 3: API Endpoint Updates ✅
1. **Updated `/app/api/analyze/release/route.ts`**:
   - Accepts array of files (any type)
   - Parses all documents
   - Creates Manufacturer → Release → Sets in database
   - Returns analysis + created records

2. **Updated `/app/api/analyze/set/route.ts`**:
   - Accepts array of files
   - Requires `releaseId` parameter
   - Creates Set with Cards in database
   - Returns analysis + created records

3. **Updated `/app/api/analyze/card/route.ts`**:
   - Accepts card images + `setId` parameter
   - Creates Card record in database
   - Uses Set/Release context for better AI analysis

### Phase 4: UI Components ✅
1. **Created `/components/MultiFileUpload.tsx`**:
   - Supports multiple file selection
   - Uploads files sequentially with progress tracking
   - Shows uploaded files with type badges
   - Allows removal of files before/after upload

2. **Created `/components/EntitySelectors.tsx`**:
   - `ReleaseSelect`: Dropdown to select existing releases
   - `SetSelect`: Dropdown to select sets from a release
   - Auto-loads data from API
   - Shows helpful context (manufacturer, year, card counts)

## Remaining Work

### Update Admin Portal (`/app/fa/page.tsx`)

The admin portal needs to be updated to use the new components. Here's what needs to be changed:

#### 1. Add Imports
```tsx
import MultiFileUpload from "@/components/MultiFileUpload";
import { ReleaseSelect, SetSelect } from "@/components/EntitySelectors";
```

#### 2. Add State Variables
```tsx
// Release tab state
const [releaseFiles, setReleaseFiles] = useState<Array<{ url: string; type: string }>>([]);
const [releaseAnalysisResult, setReleaseAnalysisResult] = useState<any>(null);

// Set tab state
const [setFiles, setSetFiles] = useState<Array<{ url: string; type: string }>>([]);
const [selectedRelease, setSelectedRelease] = useState<string>("");
const [setAnalysisResult, setSetAnalysisResult] = useState<any>(null);

// Card tab state
const [selectedCardRelease, setSelectedCardRelease] = useState<string>("");
const [selectedCardSet, setSelectedCardSet] = useState<string>("");
```

#### 3. Update Handler Functions

**Release Handler:**
```tsx
const handleReleaseAnalysis = async () => {
  if (releaseFiles.length === 0) {
    setMessage({ type: "error", text: "Please upload at least one file" });
    return;
  }

  setLoading(true);
  setMessage(null);

  try {
    const response = await fetch("/api/analyze/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: releaseFiles,
        createDatabaseRecords: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze release");
    }

    const analysis = await response.json();
    setReleaseAnalysisResult(analysis);

    if (analysis.createdRecords) {
      setMessage({
        type: "success",
        text: `Release "${analysis.releaseName}" created with ${analysis.sets.length} sets!`,
      });
    }

    // Optionally create blog post if analysis includes title/content
    if (analysis.title && analysis.content) {
      setGeneratedPost({ ...analysis, type: "RELEASE", imageUrls: releaseFiles.map(f => f.url) });
      setEditedTitle(analysis.title);
      setEditedContent(analysis.content);
      setEditedExcerpt(analysis.excerpt);
    }
  } catch (error) {
    setMessage({ type: "error", text: "Failed to analyze release. Please try again." });
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

**Set Handler:**
```tsx
const handleSetAnalysis = async () => {
  if (setFiles.length === 0) {
    setMessage({ type: "error", text: "Please upload at least one file" });
    return;
  }

  if (!selectedRelease) {
    setMessage({ type: "error", text: "Please select a release" });
    return;
  }

  setLoading(true);
  setMessage(null);

  try {
    const response = await fetch("/api/analyze/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: setFiles,
        releaseId: selectedRelease,
        createDatabaseRecords: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze set");
    }

    const analysis = await response.json();
    setSetAnalysisResult(analysis);

    if (analysis.createdRecords) {
      const cardsMsg = analysis.createdRecords.cardsCreated > 0
        ? ` with ${analysis.createdRecords.cardsCreated} cards`
        : "";
      setMessage({
        type: "success",
        text: `Set "${analysis.setName}" created${cardsMsg}!`,
      });
    }

    // Optionally create blog post
    if (analysis.title && analysis.content) {
      setGeneratedPost({ ...analysis, type: "SET", imageUrls: setFiles.map(f => f.url) });
      setEditedTitle(analysis.title);
      setEditedContent(analysis.content);
      setEditedExcerpt(analysis.excerpt);
    }
  } catch (error) {
    setMessage({ type: "error", text: "Failed to analyze set. Please try again." });
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

**Card Handler:**
```tsx
const handleCardAnalysis = async () => {
  if (!cardFrontImage) {
    setMessage({ type: "error", text: "Please upload the front image" });
    return;
  }

  if (!selectedCardSet) {
    setMessage({ type: "error", text: "Please select a set" });
    return;
  }

  setLoading(true);
  setMessage(null);

  try {
    // Upload images
    const frontUrl = await uploadFile(cardFrontImage);
    let backUrl = "";
    if (cardBackImage) {
      backUrl = await uploadFile(cardBackImage);
    }

    // Analyze card with set context
    const response = await fetch("/api/analyze/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontImageUrl: frontUrl,
        backImageUrl: backUrl || undefined,
        setId: selectedCardSet,
        createDatabaseRecords: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze card");
    }

    const analysis = await response.json();

    if (analysis.createdRecords) {
      setMessage({
        type: "success",
        text: `Card created successfully!`,
      });
    }

    setGeneratedPost({ ...analysis, type: "CARD", imageUrls: [frontUrl, backUrl].filter(Boolean) });
    setEditedTitle(analysis.title);
    setEditedContent(analysis.content);
    setEditedExcerpt(analysis.excerpt);
  } catch (error) {
    setMessage({ type: "error", text: "Failed to analyze card. Please try again." });
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

#### 4. Update JSX for Each Tab

**Release Tab:**
```tsx
{activeTab === "release" && (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-footy-dark-green">
      Analyze Release
    </h2>
    <p className="text-gray-700">
      Upload multiple documents about a release: PDFs, CSVs, images, HTML pages.
      The system will extract manufacturer, release info, sets, and create database records.
    </p>

    <MultiFileUpload
      onFilesUploaded={setReleaseFiles}
      label="Upload Release Documents"
      acceptedTypes="image/*,.pdf,.csv,.html,.txt"
    />

    {releaseAnalysisResult && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Analysis Result:</h3>
        <p><strong>Manufacturer:</strong> {releaseAnalysisResult.manufacturer}</p>
        <p><strong>Release:</strong> {releaseAnalysisResult.releaseName} ({releaseAnalysisResult.year})</p>
        <p><strong>Sets:</strong> {releaseAnalysisResult.sets?.length || 0} sets identified</p>
      </div>
    )}

    <button
      onClick={handleReleaseAnalysis}
      disabled={loading || releaseFiles.length === 0}
      className="w-full bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? "Analyzing..." : "Analyze Release & Create Records"}
    </button>
  </div>
)}
```

**Set Tab:**
```tsx
{activeTab === "set" && (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-footy-dark-green">
      Analyze Set
    </h2>
    <p className="text-gray-700">
      Upload documents about a specific set within an existing release. Can extract individual cards from checklists.
    </p>

    <ReleaseSelect
      onReleaseSelected={(releaseId) => setSelectedRelease(releaseId)}
      value={selectedRelease}
      label="Select Release"
    />

    <MultiFileUpload
      onFilesUploaded={setSetFiles}
      label="Upload Set Documents"
      acceptedTypes="image/*,.pdf,.csv,.html,.txt"
    />

    {setAnalysisResult && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Analysis Result:</h3>
        <p><strong>Set:</strong> {setAnalysisResult.setName}</p>
        <p><strong>Total Cards:</strong> {setAnalysisResult.totalCards || "Unknown"}</p>
        <p><strong>Cards Extracted:</strong> {setAnalysisResult.createdRecords?.cardsCreated || 0}</p>
      </div>
    )}

    <button
      onClick={handleSetAnalysis}
      disabled={loading || setFiles.length === 0 || !selectedRelease}
      className="w-full bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? "Analyzing..." : "Analyze Set & Create Records"}
    </button>
  </div>
)}
```

**Card Tab:**
```tsx
{activeTab === "card" && (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-footy-dark-green">
      Analyze Card
    </h2>
    <p className="text-gray-700">
      Upload card images and associate with a set in a release.
    </p>

    <ReleaseSelect
      onReleaseSelected={(releaseId) => {
        setSelectedCardRelease(releaseId);
        setSelectedCardSet(""); // Reset set selection
      }}
      value={selectedCardRelease}
      label="Select Release"
    />

    <SetSelect
      releaseId={selectedCardRelease}
      onSetSelected={(setId) => setSelectedCardSet(setId)}
      value={selectedCardSet}
      label="Select Set"
    />

    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Card Front (Required)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCardFrontImage(e.target.files?.[0] || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
        />
        {cardFrontImage && (
          <p className="mt-2 text-sm text-gray-800 font-medium">{cardFrontImage.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Card Back (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCardBackImage(e.target.files?.[0] || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900"
        />
        {cardBackImage && (
          <p className="mt-2 text-sm text-gray-800 font-medium">{cardBackImage.name}</p>
        )}
      </div>
    </div>

    <button
      onClick={handleCardAnalysis}
      disabled={loading || !cardFrontImage || !selectedCardSet}
      className="w-full bg-footy-dark-green text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? "Analyzing..." : "Analyze Card & Create Record"}
    </button>
  </div>
)}
```

## Testing Checklist

1. **Upload Endpoint**: Test uploading PDF, CSV, image files
2. **Release Analysis**: Upload mix of documents (PDF release guide + CSV checklist)
3. **Set Analysis**: Select a created release, upload set documents
4. **Card Analysis**: Select a set, upload card images
5. **Library Endpoints**: Verify dropdowns load correctly
6. **Database Records**: Check that Manufacturers, Releases, Sets, Cards are created
7. **Blog Posts**: Verify optional blog post generation still works

## Next Steps (Optional - Library View Tab)

Add a "Library" tab to view the hierarchical structure:

```tsx
// Add to tab navigation
<button onClick={() => setActiveTab("library")}>
  View Library
</button>

// Add tab content
{activeTab === "library" && (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-footy-dark-green">
      Card Library
    </h2>
    {/* Tree view of Manufacturers → Releases → Sets → Cards */}
    {/* Can use the manufacturers API endpoint to fetch full hierarchy */}
  </div>
)}
```

## Benefits of This Implementation

1. **Multi-file Upload**: Can analyze entire releases with multiple documents
2. **Hierarchical Data**: Properly structured Manufacturers → Releases → Sets → Cards
3. **Context-Aware AI**: AI gets release/set context for better card analysis
4. **Flexible**: Can create blog posts OR just database records
5. **User-Friendly**: Dropdowns make it easy to select existing entities
6. **Scalable**: Easy to add more document types or analysis features

## File Changes Summary

**New Files:**
- `/lib/documentParser.ts`
- `/lib/database.ts`
- `/app/api/library/manufacturers/route.ts`
- `/app/api/library/releases/route.ts`
- `/app/api/library/sets/route.ts`
- `/components/MultiFileUpload.tsx`
- `/components/EntitySelectors.tsx`

**Modified Files:**
- `/lib/ai.ts` (added new analysis functions)
- `/app/api/upload/route.ts` (support for multiple file types)
- `/app/api/analyze/release/route.ts` (multi-file + database integration)
- `/app/api/analyze/set/route.ts` (multi-file + database integration)
- `/app/api/analyze/card/route.ts` (set context + database integration)
- `/app/fa/page.tsx` (NEEDS TO BE UPDATED - see instructions above)

**Dependencies Added:**
- `pdf-parse`
- `csv-parse`
