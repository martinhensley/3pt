# Script Inventory

This document lists all utility scripts in the codebase.

## Active Scripts

### `/scripts` Directory

**Setup Scripts:**
- `setup-neon-auth.ts` - Initial auth schema setup
- `init-admin.ts` - Create admin user

**Utility Scripts:**
- `delete-all-data.ts` - Complete database and blob storage reset
- `delete-all-releases.ts` - Delete all releases (keeps manufacturers)
- `approve-all-releases.ts` - Batch approve all releases
- `purge-blob-store.ts` - Purge all blobs from storage
- `cleanup-orphaned-blobs.ts` - Clean up orphaned blob files

### `/scripts/etl` Directory

Release-specific ETL scripts are organized by release:
- `2016-17-panini-absolute-basketball/` - Autographs and memorabilia imports
- `2016-17-panini-aficionado-basketball/` - Full checklist import with classification
- `2016-17-panini-donruss-basketball/` - Base, autograph, and memorabilia imports
- `2016-17-panini-donruss-optic-basketball/` - Optic parallel imports
- `2016-panini-contenders-draft-picks/` - Contenders import with fixes

## Last Updated
November 25, 2025
