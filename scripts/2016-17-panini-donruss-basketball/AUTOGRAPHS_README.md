# 2016-17 Donruss Basketball Autographs Import

## Overview
This release contains 19 autograph sets with approximately 1,007 total cards.

## Set Structure

### Dominator Signatures (3 sets) - ✅ COMPLETE
- Dominator Signatures (40 cards, various /25-/49)
- Dominator Signatures Black (40 cards, 1/1)  
- Dominator Signatures Gold (40 cards, /10)

### Elite Signatures (3 sets) - PENDING
- Elite Signatures (96 cards, various /25-/99)
- Elite Signatures Black (96 cards, 1/1)
- Elite Signatures Green (96 cards, /5)

### Hall Dominator Signatures (3 sets) - PENDING
- Hall Dominator Signatures (30 cards, /25 or /49)
- Hall Dominator Signatures Black (30 cards, 1/1)
- Hall Dominator Signatures Gold (30 cards, /10)

### Rookie Autographs (5 sets) - PENDING
- Next Day Signatures (39 cards, unnumbered)
- Rookie Dominator Signatures (30 cards, /50-/65)
- Rookie Dominator Signatures Black (30 cards, 1/1)
- Rookie Dominator Signatures Gold (30 cards, /10)
- Rookie Materials Signatures (35 cards, /75) - AUTO + MEM
- Rookie Materials Signatures Prime (35 cards, /10) - AUTO + MEM

### Signature Series (2 sets) - PENDING
- Signature Series (50 cards, unnumbered)
- Signature Series Gold (50 cards, /10)

### Timeless Treasures (2 sets) - PENDING
- Timeless Treasures Materials Signatures (25 cards, /49 or /99) - AUTO + MEM
- Timeless Treasures Materials Signatures Prime (25 cards, /5 or /25) - AUTO + MEM

## Import Strategy
Due to the large size (~1000 cards), the data will be imported in batches using the following scripts:

1. `import-autographs-complete.ts` - Dominator Signatures (already run)
2. `import-autographs-batch-2.ts` - Elite Signatures + Hall Dominator
3. `import-autographs-batch-3.ts` - Rookie autographs  
4. `import-autographs-batch-4.ts` - Signature Series + Timeless Treasures

## Notes
- Sets with "Materials" in the name have both autograph AND memorabilia
- These should have both `hasAutograph: true` and `hasMemorabilia: true`
- Several sets have missing card numbers in the checklist (gaps in numbering)
