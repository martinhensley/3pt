# Scripts Directory

This directory contains utility scripts for managing the 3pt.bot database and imports.

## 📁 Folder Structure

### Release-Specific Scripts
Scripts for importing data for specific releases are organized into release-specific folders:

```
scripts/
├── {year}-{manufacturer}-{release}/
│   ├── README.md                    # Release-specific documentation
│   ├── import-*.ts                  # Primary import script(s)
│   ├── fix-*.ts                     # Post-import fixes
│   ├── delete-*.ts                  # Cleanup utilities
│   ├── verify-*.ts                  # Verification scripts
│   └── check-*.ts                   # Diagnostic tools
```

**Example:**
```
scripts/2024-25-panini-donruss-soccer/
├── README.md
├── import-donruss-from-excel.ts
├── fix-rated-rookies.ts
├── delete-donruss-data.ts
├── verify-donruss-import.ts
├── final-verification.ts
└── check-rated-rookies.ts
```

### General Utilities
Scripts that work across all releases remain in the root `/scripts` folder:

```
scripts/
├── setup-neon-auth.ts              # Initial authentication setup
├── init-admin.ts                   # Initialize admin user
├── delete-all-data.ts              # Delete ALL database data
├── delete-all-releases.ts          # Delete all releases
├── update-donruss-postdate.ts      # Update specific release fields
└── migrate-description-to-review.ts # Schema migrations
```

## 🎯 Benefits of Release-Specific Folders

### 1. **Organization**
- Scripts for each release are self-contained
- Easy to find all related scripts for a release
- Prevents `/scripts` folder from becoming cluttered

### 2. **Replication**
- Copy a release folder as a template for new imports
- Each folder's README documents release-specific patterns
- Easier to compare approaches across similar releases

### 3. **Documentation**
- Each release folder has its own README with:
  - Source data information
  - Import summary statistics
  - Script descriptions and usage
  - Special cases and learnings
  - Replication guide

### 4. **Maintenance**
- Update scripts for one release without affecting others
- Debug release-specific issues in isolation
- Track which scripts were used for each import

### 5. **Knowledge Transfer**
- New developers can review past imports
- Document quirks and edge cases per release
- Build institutional knowledge over time

## 📋 Naming Convention

### Folder Names
Format: `{year}-{manufacturer}-{release}`

**Examples:**
- `2024-25-panini-donruss-soccer`
- `2024-25-panini-obsidian-soccer`
- `2023-24-topps-chrome-uefa`

**Rules:**
- Use lowercase with hyphens
- Match the release slug format
- Be specific (include year, manufacturer, product line)

### Script Names
Use descriptive, action-oriented names:

**Import Scripts:**
- `import-{release}-from-{source}.ts`
- Example: `import-donruss-from-excel.ts`

**Fix Scripts:**
- `fix-{issue}.ts`
- Example: `fix-rated-rookies.ts`

**Delete Scripts:**
- `delete-{release}-data.ts`
- Example: `delete-donruss-data.ts`

**Verification Scripts:**
- `verify-{release}-import.ts`
- `final-verification.ts`
- `check-{specific-issue}.ts`

## 🔄 Typical Import Workflow

### 1. Create Release Folder
```bash
mkdir scripts/{year}-{manufacturer}-{release}
```

### 2. Develop Import Scripts
Create scripts in the release folder:
- Primary import script
- Any fix scripts needed
- Verification scripts
- Cleanup utilities

### 3. Document the Process
Create `README.md` documenting:
- Source data details
- Import statistics
- Script usage instructions
- Special cases handled
- Replication guide

### 4. Run Import
```bash
# Run from project root
npx tsx scripts/{release-folder}/import-*.ts
```

### 5. Archive
Keep the folder for:
- Future reference
- Re-imports if needed
- Template for similar releases

## 📚 Existing Release Folders

### 2024-25 Panini Donruss Soccer
**Path:** `/scripts/2024-25-panini-donruss-soccer/`
**Status:** ✅ Complete
**Source:** Excel file (Master worksheet)
**Results:** 147 sets, 872 cards
**Special Cases:**
- Rated Rookies merged into Base/Optic
- Base Optic renamed to Optic
- Parent-child parallel architecture

See folder's README for full details.

## 🛠️ General Utility Scripts

### setup-neon-auth.ts
**Purpose:** Configure Neon database authentication
**Usage:** Run once during initial setup
**Type:** Setup

### init-admin.ts
**Purpose:** Create initial admin user
**Usage:** Run once after authentication setup
**Type:** Setup

### delete-all-data.ts
**Purpose:** Delete ALL data from database (nuclear option)
**Usage:** Use with extreme caution, typically for development resets
**Type:** Utility - Dangerous

### delete-all-releases.ts
**Purpose:** Delete all releases (keeps manufacturers)
**Usage:** Clean slate for testing imports
**Type:** Utility - Dangerous

### update-donruss-postdate.ts
**Purpose:** Update postDate field for Donruss release
**Usage:** One-off migration script
**Type:** Migration

### migrate-description-to-review.ts
**Purpose:** Migrate description field to review field
**Usage:** One-off schema migration
**Type:** Migration

## 📖 Best Practices

### DO:
✅ Create a release folder for each new import
✅ Document special cases in the README
✅ Include verification scripts
✅ Test with a subset before full import
✅ Keep cleanup utilities for re-imports

### DON'T:
❌ Put release-specific scripts in root `/scripts`
❌ Hardcode file paths without documentation
❌ Skip verification steps
❌ Delete scripts after successful import (keep for reference)
❌ Copy scripts without updating release-specific values

## 🔍 Finding Scripts

### For a Specific Release
```bash
ls scripts/{year}-{manufacturer}-{release}/
```

### For All Releases
```bash
ls -d scripts/*/
```

### For General Utilities
```bash
ls scripts/*.ts
```

## 📝 Contributing New Imports

When adding a new release import:

1. Create release folder: `scripts/{release-slug}/`
2. Copy template from similar release (e.g., Donruss Soccer)
3. Update all release-specific values
4. Create comprehensive README
5. Test thoroughly before full import
6. Document any issues or special cases

---

**Last Updated:** November 14, 2025
