import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface SmartMatchRequest {
  setId: string;
  scannedData: {
    playerName: string;
    cardNumber: string;
    team?: string;
    parallelType?: string;
  };
}

interface MatchScore {
  cardId: string;
  score: number;
  breakdown: {
    playerName: number;
    cardNumber: number;
    team: number;
    parallel: number;
  };
  card: {
    id: string;
    playerName: string | null;
    cardNumber: string | null;
    team: string | null;
    parallelType: string | null;
    variant: string | null;
    imageFront: string | null;
    imageBack: string | null;
  };
}

/**
 * POST /api/admin/smart-match
 *
 * Smart matching algorithm to find existing cards in checklist that match scanned card data.
 * Uses fuzzy matching with scoring based on player name, card number, team, and parallel type.
 *
 * Scoring:
 * - Player Name: 0-100 points (exact match = 100, fuzzy match = 50-99, no match = 0)
 * - Card Number: 0-30 points (exact match = 30, close match = 15, no match = 0)
 * - Team: 0-20 points (exact match = 20, fuzzy match = 10, no match = 0)
 * - Parallel: 0-25 points (exact match = 25, similar = 12, no match = 0)
 *
 * Total possible: 175 points
 * High confidence: >= 140 points (80%)
 * Medium confidence: >= 105 points (60%)
 * Low confidence: < 105 points
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SmartMatchRequest = await request.json();
    const { setId, scannedData } = body;

    // Validate required fields
    if (!setId || !scannedData || !scannedData.playerName || !scannedData.cardNumber) {
      return NextResponse.json(
        { error: 'Set ID, player name, and card number are required' },
        { status: 400 }
      );
    }

    console.log(`Smart matching for: ${scannedData.playerName} #${scannedData.cardNumber}`);

    // Get all cards in the set
    const cardsInSet = await prisma.card.findMany({
      where: { setId },
      select: {
        id: true,
        playerName: true,
        cardNumber: true,
        team: true,
        parallelType: true,
        variant: true,
        imageFront: true,
        imageBack: true,
      },
    });

    if (cardsInSet.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No cards found in set checklist',
      });
    }

    // Score each card in the checklist
    const matches: MatchScore[] = cardsInSet.map((card) => {
      const breakdown = {
        playerName: scorePlayerName(scannedData.playerName, card.playerName),
        cardNumber: scoreCardNumber(scannedData.cardNumber, card.cardNumber),
        team: scoreTeam(scannedData.team, card.team),
        parallel: scoreParallel(scannedData.parallelType, card.parallelType || card.variant),
      };

      const totalScore = breakdown.playerName + breakdown.cardNumber + breakdown.team + breakdown.parallel;

      return {
        cardId: card.id,
        score: totalScore,
        breakdown,
        card,
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Get top matches
    const topMatches = matches.slice(0, 5);
    const bestMatch = matches[0];

    // Determine confidence level
    const confidence = bestMatch.score >= 140 ? 'high' : bestMatch.score >= 105 ? 'medium' : 'low';

    console.log(`Best match: ${bestMatch.card.playerName} #${bestMatch.card.cardNumber} (score: ${bestMatch.score}/175)`);

    return NextResponse.json({
      success: true,
      bestMatch: {
        ...bestMatch,
        confidence,
        percentage: Math.round((bestMatch.score / 175) * 100),
      },
      topMatches: topMatches.map((m) => ({
        ...m,
        percentage: Math.round((m.score / 175) * 100),
      })),
      totalCandidates: cardsInSet.length,
    });
  } catch (error) {
    console.error('Smart match API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to match card',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Score player name match (0-100 points)
 */
function scorePlayerName(scanned: string, checklist: string | null): number {
  if (!checklist) return 0;

  const s = normalize(scanned);
  const c = normalize(checklist);

  // Exact match
  if (s === c) return 100;

  // One contains the other (handles "Kylian Mbappé" vs "Mbappé")
  if (s.includes(c) || c.includes(s)) return 90;

  // Check last name match (most important for basketball cards)
  const sLast = s.split(' ').pop() || '';
  const cLast = c.split(' ').pop() || '';
  if (sLast && cLast && sLast === cLast) return 80;

  // Fuzzy match using Levenshtein-like approach
  const similarity = stringSimilarity(s, c);
  if (similarity >= 0.8) return Math.round(similarity * 100);
  if (similarity >= 0.6) return Math.round(similarity * 80);

  return 0;
}

/**
 * Score card number match (0-30 points)
 */
function scoreCardNumber(scanned: string, checklist: string | null): number {
  if (!checklist) return 0;

  const s = normalize(scanned);
  const c = normalize(checklist);

  // Exact match
  if (s === c) return 30;

  // Extract numeric parts and compare
  const sNum = extractNumber(s);
  const cNum = extractNumber(c);

  if (sNum && cNum) {
    if (sNum === cNum) return 25;
    // Close numbers (off by 1-2)
    if (Math.abs(parseInt(sNum) - parseInt(cNum)) <= 2) return 15;
  }

  return 0;
}

/**
 * Score team match (0-20 points)
 */
function scoreTeam(scanned: string | undefined, checklist: string | null): number {
  if (!scanned || !checklist) return 0;

  const s = normalize(scanned);
  const c = normalize(checklist);

  // Exact match
  if (s === c) return 20;

  // Partial match
  if (s.includes(c) || c.includes(s)) return 15;

  // Common abbreviations (e.g., "PSG" vs "Paris Saint-Germain")
  if (s.length <= 4 && c.includes(s)) return 10;
  if (c.length <= 4 && s.includes(c)) return 10;

  return 0;
}

/**
 * Score parallel/variation match (0-25 points)
 */
function scoreParallel(scanned: string | undefined, checklist: string | null): number {
  if (!scanned && !checklist) return 25; // Both base
  if (!scanned || !checklist) return 0;

  const s = normalize(scanned);
  const c = normalize(checklist);

  // Exact match
  if (s === c) return 25;

  // Handle "base" variations
  if ((s === 'base' || s === '') && (c === 'base' || c === '')) return 25;

  // Partial match
  if (s.includes(c) || c.includes(s)) return 15;

  return 0;
}

/**
 * Normalize string for comparison
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Extract numeric value from string
 */
function extractNumber(str: string): string | null {
  const match = str.match(/\d+/);
  return match ? match[0] : null;
}

/**
 * Calculate string similarity (0-1)
 * Simple implementation using character overlap
 */
function stringSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Count matching characters in order
  let matches = 0;
  let s1Index = 0;
  let s2Index = 0;

  while (s1Index < s1.length && s2Index < s2.length) {
    if (s1[s1Index] === s2[s2Index]) {
      matches++;
      s1Index++;
      s2Index++;
    } else {
      s1Index++;
    }
  }

  // Normalize by average length
  const avgLength = (s1.length + s2.length) / 2;
  return matches / avgLength;
}
