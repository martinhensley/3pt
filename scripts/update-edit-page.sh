#!/bin/bash

# This script removes the legacy "Source Files" section from the edit release page
# The section spans from line 1777 ("Source Files Section") to line 1877 (end of section)

FILE="/Users/mh/footy/app/admin/releases/edit/[id]/page.tsx"

# Create a backup
cp "$FILE" "$FILE.backup"

# Remove lines 1777-1877 (the entire legacy Source Files section)
sed -i '' '1777,1877d' "$FILE"

echo "✅ Removed legacy Source Files section (lines 1777-1877)"
echo "📝 Backup created at: $FILE.backup"
