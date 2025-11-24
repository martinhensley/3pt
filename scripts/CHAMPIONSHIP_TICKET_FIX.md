# Championship Ticket Print Run Fix

## Issue
All Championship Ticket parallel sets in the 2016 Panini Contenders Draft Picks Basketball release had incorrect print run information:
- **Set.printRun**: 299 (incorrect) → Should be 1
- **Set.slug**: Ended with `-parallel-299` → Should end with `-parallel-1`
- **Card.numbered**: "/1" (non-standard) → Should be "1 of 1"
- **Card.printRun**: Already correct at 1

## Root Cause
Championship Ticket parallels are 1-of-1 cards (the most rare parallel), but the sets were created with printRun: 299, which is the standard for other ticket parallels.

## Sets Affected
1. **Season Championship Ticket** - 96 cards
2. **International Tickets Championship Ticket** - 7 cards
3. **College Championship Ticket** - 75 cards
4. **College Championship Ticket Variation** - 0 cards (empty set)

**Total**: 4 sets, 178 cards

## Fix Applied

### Set Updates
For each Championship Ticket set:
1. Changed `printRun` from 299 to 1
2. Updated `slug` to end with `-parallel-1` instead of `-parallel-299`

### Card Updates
For all cards in these sets:
1. Verified `printRun` was already 1 (no changes needed)
2. Changed `numbered` from "/1" to "1 of 1" (standard format)

## Scripts Created

### Primary Fix Scripts
1. **fix-season-championship-ticket.ts** - Original fix for Season Championship Ticket
2. **update-championship-numbered.ts** - Updates numbered field format
3. **fix-all-championship-tickets.ts** - Comprehensive fix for all Championship Ticket sets

### Execution Order
```bash
# Initial fix (Season only)
npx ts-node scripts/fix-season-championship-ticket.ts
npx ts-node scripts/update-championship-numbered.ts

# Comprehensive fix (all sets)
npx ts-node scripts/fix-all-championship-tickets.ts
```

## Verification
All 4 Championship Ticket sets now have:
- ✓ Set.printRun: 1
- ✓ Set.slug: ends with `-parallel-1`
- ✓ Card.printRun: 1 (all 178 cards)
- ✓ Card.numbered: "1 of 1" (all 178 cards)

## Example Results

### Before
```
Set: Season Championship Ticket
  Slug: 2016-contenders-draft-picks-season-ticket-championship-ticket-parallel-299
  Print Run: 299

Card: #1 Aaron Gordon
  printRun: 1
  numbered: "/1"
```

### After
```
Set: Season Championship Ticket
  Slug: 2016-contenders-draft-picks-season-ticket-championship-ticket-parallel-1
  Print Run: 1

Card: #1 Aaron Gordon
  printRun: 1
  numbered: "1 of 1"
```

## Notes
- The "1 of 1" format is the standard used by 63% of 1/1 cards in the database
- Championship Ticket is the highest rarity parallel (1/1 cards)
- Other ticket parallels (Draft Ticket, Cracked Ice Ticket, etc.) correctly use their respective print runs
- Empty "College Championship Ticket Variation" set was also corrected for consistency

## Date
November 24, 2025
