#!/bin/bash

# Script to update all pages from old extractKeywords to new buildQueries functions

echo "Updating eBay query imports across all pages..."

# Update sets/[slug]/page.tsx
echo "Updating sets/[slug]/page.tsx..."
sed -i '' 's/import { extractKeywordsFromPost, getAdTitle } from "@\/lib\/extractKeywords";/import { buildSetQueries } from "@\/lib\/ebayQueries";/g' /Users/mh/3pt/app/sets/[slug]/page.tsx

# Update sets/[slug]/parallels/[parallel]/page.tsx
echo "Updating sets/[slug]/parallels/[parallel]/page.tsx..."
sed -i '' 's/import { extractKeywordsFromPost, getAdTitle } from "@\/lib\/extractKeywords";/import { buildSetQueries } from "@\/lib\/ebayQueries";/g' /Users/mh/3pt/app/sets/[slug]/parallels/[parallel]/page.tsx

# Update releases/[slug]/page.tsx
echo "Updating releases/[slug]/page.tsx..."
sed -i '' 's/import { extractKeywordsFromPost, getAdTitle } from "@\/lib\/extractKeywords";/import { buildReleaseQueries } from "@\/lib\/ebayQueries";/g' /Users/mh/3pt/app/releases/[slug]/page.tsx

# Update posts/[slug]/page.tsx
echo "Updating posts/[slug]/page.tsx..."
sed -i '' 's/import { extractKeywordsFromPost, getAdTitle } from "@\/lib\/extractKeywords";/import { buildPostQueries } from "@\/lib\/ebayQueries";/g' /Users/mh/3pt/app/posts/[slug]/page.tsx

echo "Done! Please review the changes and update the query building logic manually."
