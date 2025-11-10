# Release Import Scripts

This directory contains scripts for importing card release data into the database.

## Purpose

These scripts are designed to be used by a Claude Code skill that will automate the process of importing new card releases from Excel files, PDFs, or other data sources.

## Available Import Scripts

### Generic Importers

- **import-checklist.ts** - Generic Excel checklist importer
  - Usage: `npx tsx scripts/imports/import-checklist.ts <path-to-excel-file> [release-slug]`
  - Imports any Excel checklist with auto-detection of release structure

### Release-Specific Importers

- **import-obsidian-from-excel.ts** - Panini Obsidian Soccer importer
  - Specialized for Obsidian Soccer checklists with parallel sets

- **import-donruss-soccer.ts** - Panini Donruss Soccer importer
  - Specialized for Donruss Soccer checklists with Optic parallels

- **import-donruss-master.ts** - Alternative Donruss importer
  - Handles Master tab format from Donruss checklists

### Utility Scripts

- **import-missing-obsidian-cards.ts** - Import missing cards from existing release
- **reset-and-import-obsidian.ts** - Reset and re-import Obsidian release

## Future Claude Skill

A Claude Code skill will be created to:
1. Accept a release name and checklist file
2. Automatically determine which importer to use
3. Run the appropriate import script
4. Validate the imported data
5. Report results to the user

The skill will use this directory to discover available importers and their capabilities.

## Adding New Importers

When adding a new release-specific importer:
1. Create the script in this directory with naming pattern: `import-<release-name>.ts`
2. Follow the existing import script patterns
3. Use the `generateSetSlug()` and `generateCardSlug()` functions from `/lib/slugGenerator.ts`
4. Implement AI analysis using Genkit flows from `/lib/genkit.ts`
5. Update this README with the new importer
