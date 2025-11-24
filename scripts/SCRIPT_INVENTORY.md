# Script Inventory

This document lists all utility scripts in the codebase.

## Active Scripts

### `/scripts` Directory

**Setup Scripts:**
- `setup-neon-auth.ts` - Initial auth schema setup
- `init-admin.ts` - Create admin user

**Utility Scripts:**
- `delete-all-data.ts` - Complete database and blob storage reset

### Root Directory

**Configuration:**
- `next.config.ts` - Next.js configuration
- `next-env.d.ts` - TypeScript definitions for Next.js

## Deleted Scripts

All one-off migration, fix, check, and debugging scripts have been deleted to keep the codebase clean. This includes:
- Migration scripts (source documents, images, parallel slugs, etc.)
- One-off fix scripts (Donruss structure, Equinox parallels, etc.)
- Check/debug scripts (database state, image table, post table, etc.)
- Import scripts (Donruss, PDF checklist)
- Generation scripts (release descriptions)
- Analysis scripts (autograph counts)

These scripts served their purpose and are no longer needed. The codebase now only contains:
1. Essential setup scripts for initial auth configuration
2. The database reset utility for development workflow
3. Required configuration files

## Last Updated
November 12, 2025
