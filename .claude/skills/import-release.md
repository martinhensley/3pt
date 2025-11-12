# Import Release Checklist

Import sets and cards from a release checklist file (Excel, CSV, etc.) into the Footy database.

## Behavior

This skill guides the user through importing a complete card release checklist:

1. **Fetch Available Releases** - Query the database for releases that don't have cards yet (need importing) and present them to the user
2. **User Selects Release** - Show releases in a readable format and ask which one to import
3. **Request Checklist File** - Ask user for the path to the checklist file
4. **Detect Import Script** - Determine which import script to use based on release name
5. **Run Import** - Execute the appropriate import script with progress monitoring
6. **Save to Library** - Upload checklist file and save as SourceDocument with documentType='CHECKLIST'
7. **Report Results** - Display summary of sets, cards imported, and library confirmation

## User Interaction Flow

```
🎯 Import Release Checklist

Step 1: Select a release to import
Available releases (without cards):
  1. 2024-25 Panini Obsidian Soccer
  2. 2024-25 Panini Donruss Soccer
  3. 2023-24 Panini Prizm Soccer
  ... (shows only releases that need importing)

Which release? (enter number or name): 1

Step 2: Provide checklist file
Please provide the path to the checklist file (Excel, CSV, etc.):
User: /Users/mh/Desktop/2024-25-Panini-Obsidian-Soccer-Checklist.xls

Step 3: Running import...
🚀 Starting import for 2024-25 Panini Obsidian Soccer
📁 Using: /Users/mh/Desktop/2024-25-Panini-Obsidian-Soccer-Checklist.xls
🤖 Analyzing checklist structure with AI...

✅ Import complete!
   📦 Created 47 sets
   🎴 Imported 1,234 cards
```

## Implementation Steps

### 1. Query Available Releases

```typescript
// Fetch releases that don't have cards yet (need importing)
const releases = await prisma.release.findMany({
  include: {
    manufacturer: true,
    sets: {
      include: {
        _count: {
          select: { cards: true }
        }
      }
    }
  },
  orderBy: [
    { year: 'desc' },
    { name: 'asc' }
  ],
});

// Filter to only releases without cards
const releasesNeedingImport = releases.filter(release => {
  const totalCards = release.sets.reduce((sum, set) => sum + set._count.cards, 0);
  return totalCards === 0;
});

// Format for display
releasesNeedingImport.forEach((release, index) => {
  console.log(`  ${index + 1}. ${release.year} ${release.manufacturer.name} ${release.name}`);
});
```

### 2. Present Release Selection

Use interactive prompt to let user select:
- By number (1-N)
- By typing release name (fuzzy match)
- Show release slug for confirmation

### 3. Determine Import Script

Based on release name patterns:

```typescript
function getImportScript(releaseName: string): string {
  const name = releaseName.toLowerCase();
  
  if (name.includes('obsidian')) {
    return 'scripts/imports/import-obsidian-from-excel.ts';
  } else if (name.includes('donruss')) {
    return 'scripts/imports/import-donruss-soccer.ts';
  } else {
    // Use generic importer
    return 'scripts/imports/import-checklist.ts';
  }
}
```

### 4. Execute Import Script

Run the selected import script with:
- Release slug as argument
- Checklist file path
- Monitor stdout for progress
- Parse completion message for stats

```bash
npx tsx scripts/imports/import-obsidian-from-excel.ts \
  --release-slug=2024-25-panini-obsidian-soccer \
  --file=/path/to/checklist.xls
```

###5. Save Checklist to Library

After successful import, save the checklist file to the library:

```typescript
// Create a SourceDocument record for the checklist
await prisma.sourceDocument.create({
  data: {
    displayName: `${release.year} ${release.manufacturer.name} ${release.name} Checklist`,
    filename: path.basename(checklistPath),
    blobUrl: uploadedFileUrl, // Upload file to blob storage first
    fileSize: fs.statSync(checklistPath).size,
    mimeType: getMimeType(checklistPath),
    documentType: 'CHECKLIST',
    uploadedAt: new Date(),
    releases: {
      create: {
        releaseId: release.id,
      },
    },
  },
});
```

### 6. Parse Results

Extract and display:
- Number of sets created
- Number of cards imported
- Checklist saved to library
- Any errors or warnings
- Link to view release in app

## Error Handling

### File Not Found
```
❌ Error: Checklist file not found
   Path: /Users/mh/Desktop/checklist.xls
   
Would you like to try a different file? (y/n)
```

### Duplicate Data
```
⚠️  Warning: Some data already exists
   - 12 sets already in database (skipped)
   - 234 cards already exist (skipped)
   - 89 new cards imported
   
Import completed with warnings.
```

### Invalid File Format
```
❌ Error: Unable to parse checklist file
   The file format is not recognized or is corrupted.
   
Supported formats:
   - Excel (.xls, .xlsx)
   - CSV (.csv)
   
Please check the file and try again.
```

## Advanced Options

Allow optional flags:
- `--dry-run` - Preview what would be imported without making changes
- `--force` - Overwrite existing data
- `--skip-duplicates` - Silently skip existing entries (default)
- `--clear-existing` - Delete existing sets/cards for this release first

## Integration Points

### Database Queries
```typescript
// Get releases without cards (need importing)
GET /api/releases?include=manufacturer,sets&needsImport=true

// Verify release exists
GET /api/releases/:slug

// Check for existing cards in release
GET /api/cards?releaseId=xxx&count=true
```

### Import Scripts
Located in: `/scripts/imports/`
- `import-checklist.ts` - Generic importer (fallback)
- `import-obsidian-from-excel.ts` - Obsidian-specific
- `import-donruss-soccer.ts` - Donruss-specific
- More to be added...

### Genkit AI Flows
Used by import scripts:
- `analyzeChecklistFlow` - Analyze Excel structure
- Identifies base sets, parallels, insert sets
- Extracts print runs and parallel types
- Returns structured data for import

## Success Criteria

The import is considered successful when:
1. ✅ User successfully selects a release
2. ✅ Checklist file is found and readable
3. ✅ AI successfully analyzes checklist structure
4. ✅ Sets are created/found in database
5. ✅ Cards are imported with correct relationships
6. ✅ Checklist file is saved to library (SourceDocument table)
7. ✅ No critical errors occurred
8. ✅ Summary statistics are displayed

## Example Outputs

### Successful Import
```
🎉 Import Complete!

Release: 2024-25 Panini Obsidian Soccer
File: /Users/mh/Desktop/checklist.xls

Results:
  📦 47 sets created
     - 2 base sets
     - 38 parallel sets
     - 7 insert sets

  🎴 1,234 cards imported
     - 145 base cards
     - 1,089 parallel cards

  📚 Checklist saved to library
     - Available at /admin/library/checklists

View release: http://localhost:3000/releases/2024-25-panini-obsidian-soccer
```

### Dry Run Output
```
🔍 Dry Run - No changes will be made

Release: 2024-25 Panini Donruss Soccer
File: /Users/mh/Desktop/donruss-checklist.xlsx

Analysis:
  Would create 149 sets:
     - Base (2 variations)
     - Rated Rookies (33 parallels)
     - 84 insert sets
     - 24 autograph sets
     - 6 memorabilia sets
  
  Would import 8,977 cards:
     - 200 base cards
     - 8,777 parallel/insert cards

Run without --dry-run to perform import.
```

## Future Enhancements

1. **Image Import** - Support uploading card images alongside checklist
2. **Validation Report** - Check for missing data before import
3. **Partial Import** - Import specific sets instead of entire checklist
4. **Update Mode** - Update existing cards with new data
5. **Template Generator** - Create checklist templates for manual data entry
6. **Batch Import** - Import multiple releases at once
7. **Rollback Support** - Undo an import if something goes wrong

## Related Files

- `/scripts/imports/README.md` - Import scripts documentation
- `/lib/genkit.ts` - AI analysis flows
- `/lib/slugGenerator.ts` - Slug generation utilities
- `/.claude/CLAUDE.md` - AI Excel import workflow documentation
