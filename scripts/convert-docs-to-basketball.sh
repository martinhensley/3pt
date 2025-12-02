#!/bin/bash
# Script to convert documentation files from soccer to basketball

DOC_FILES=(
  "docs/DATABASE.md"
  "docs/DONRUSS_GUIDE.md"
  "docs/IMPORT_GUIDE.md"
  "docs/FRONTEND_PATTERNS.md"
  "scripts/README.md"
  "scripts/README-CHECKLIST-UPLOAD.md"
  ".claude/commands/checklist-release-etl.md"
)

for file in "${DOC_FILES[@]}"; do
  if [ -f "/Users/mh/3pt/$file" ]; then
    echo "Processing $file..."

    # Backup original
    cp "/Users/mh/3pt/$file" "/Users/mh/3pt/$file.backup"

    # Replace sport-specific terms
    sed -i '' 's/soccer card platform/basketball card platform/g' "/Users/mh/3pt/$file"
    sed -i '' 's/Donruss soccer/Donruss basketball/g' "/Users/mh/3pt/$file"
    sed -i '' 's/donruss-soccer/donruss-basketball/g' "/Users/mh/3pt/$file"
    sed -i '' 's/obsidian-soccer/obsidian-basketball/g' "/Users/mh/3pt/$file"
    sed -i '' 's/Obsidian Soccer/Obsidian Basketball/g' "/Users/mh/3pt/$file"
    sed -i '' 's/soccer release/basketball release/g' "/Users/mh/3pt/$file"
    sed -i '' 's/soccer products/basketball products/g' "/Users/mh/3pt/$file"
    sed -i '' 's/Donruss Soccer/Donruss Basketball/g' "/Users/mh/3pt/$file"
    sed -i '' 's/Premium soccer cards/Premium basketball cards/g' "/Users/mh/3pt/$file"

    # Replace Footy persona references
    sed -i '' 's/footyGreen/primaryGreen/g' "/Users/mh/3pt/$file"
    sed -i '' 's/footyOrange/primaryOrange/g' "/Users/mh/3pt/$file"
    sed -i '' 's/Footy\.bot database/3pt.bot database/g' "/Users/mh/3pt/$file"

    echo "Done with $file"
  else
    echo "File not found: $file"
  fi
done

echo "All documentation files converted!"
