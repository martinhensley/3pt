# Checklist Upload Workflow

When creating sets and cards from Excel/CSV checklists using import scripts, the checklist files should be saved as Source Documents for the release.

## Why Upload Checklists?

1. **Transparency**: Users can see the source data used to create the card database
2. **Reference**: Future updates can reference the original checklist
3. **Verification**: Collectors can verify our data against the official checklist

## How to Upload a Checklist

### Option 1: Standalone Upload Script

Use the provided utility to upload a checklist for an existing release:

```bash
npx tsx scripts/upload-donruss-checklist.ts
```

This script:
- Uploads the Excel file to Vercel Blob Storage
- Creates a SourceDocument record with type `CHECKLIST`
- Links it to the release
- Prevents duplicate uploads

### Option 2: Integrate into Import Scripts

Add this code to your import script (e.g., `import-donruss-basketball-2024.ts`):

```typescript
import { uploadChecklistToRelease, getExistingChecklist } from '../lib/checklistUploader';

// At the start of your main() function:
const EXCEL_FILE_PATH = '/Users/mh/Desktop/2025-26-Topps-Basketball-Checklist.xlsx';

// After finding the release:
const existing = await getExistingChecklist(release.id, '2025-26-Topps-Basketball-Checklist.xlsx');

if (!existing) {
  console.log('\n📤 Uploading checklist to release...');
  await uploadChecklistToRelease(
    EXCEL_FILE_PATH,
    release.id,
    'Topps Basketball 2025-26 Master Checklist'
  );
  console.log('✅ Checklist uploaded');
} else {
  console.log('✅ Checklist already uploaded');
}

// Then proceed with your import logic...
```

## Utility Functions

Located in `/lib/checklistUploader.ts`:

### `uploadChecklistToRelease()`
Uploads a checklist file and creates a SourceDocument record.

**Parameters:**
- `filePath`: Absolute path to the checklist file
- `releaseId`: ID of the release
- `displayName`: Optional custom display name

**Returns:** The created SourceDocument record

### `getExistingChecklist()`
Checks if a checklist has already been uploaded for a release.

**Parameters:**
- `releaseId`: ID of the release
- `filename`: Filename to check for

**Returns:** Existing SourceDocument if found, null otherwise

## Supported File Types

- Excel: `.xlsx`, `.xls`
- CSV: `.csv`
- PDF: `.pdf`
- Text: `.txt`

## Where Checklists Appear

Once uploaded, checklists are displayed:

1. **Release Page** (`/releases/{slug}`): In the "Source Documents" section
2. **Edit Release Page** (`/admin/releases/edit/{id}`): In the "Source Documents" section
3. **Checklists Library** (`/admin/library/checklists`): Searchable list of all checklists

## Example: Topps Basketball 2025-26

```bash
# 1. Upload the checklist
npx tsx scripts/upload-topps-checklist.ts

# 2. View on the release page
open http://localhost:3000/releases/2025-26-topps-basketball
```

You should now see both:
- The sell sheet PDF
- The Excel checklist

## Best Practices

1. **Upload before importing data**: Upload the checklist before running the import script
2. **Use descriptive names**: Use clear display names like "Panini Donruss Basketball 2024-25 Master Checklist"
3. **Don't duplicate**: The utility automatically checks for existing checklists
4. **Keep original files**: Keep the original Excel files on Desktop for reference

## Future Improvements

- Auto-detect checklist files in import scripts
- Support for multiple checklists per release (e.g., base checklist + insert checklist)
- Download button on release pages to get the original checklist
