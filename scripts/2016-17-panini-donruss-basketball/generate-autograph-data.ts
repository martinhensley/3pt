/**
 * Helper script to generate autograph card data from checklist text
 * This converts the human-readable checklist into TypeScript card data arrays
 */

// Helper to parse a single card line
function parseCardLine(line: string): { number: string; player: string; team: string; printRun: number | null } | null {
  // Format: "1 Karl-Anthony Towns, Minnesota Timberwolves /49"
  // or: "1 Karl-Anthony Towns, Minnesota Timberwolves 1/1"
  // or: "1 Brandon Ingram, Los Angeles Lakers" (unnumbered)

  const match = line.match(/^(\d+)\s+([^,]+),\s+([^/\d]+)(?:\s+(?:(\d+)\/(\d+)|\/(\d+)))?$/);

  if (!match) return null;

  const [, number, player, team, oneOfOneNumerator, oneOfOneDenominator, printRun] = match;

  let finalPrintRun: number | null = null;

  if (oneOfOneNumerator && oneOfOneDenominator) {
    // Handle "1/1" format
    if (oneOfOneNumerator === '1' && oneOfOneDenominator === '1') {
      finalPrintRun = 1;
    } else {
      console.warn(`Unexpected fraction: ${oneOfOneNumerator}/${oneOfOneDenominator} for ${player}`);
    }
  } else if (printRun) {
    // Handle "/49" format
    finalPrintRun = parseInt(printRun, 10);
  }

  return {
    number: number.trim(),
    player: player.trim(),
    team: team.trim(),
    printRun: finalPrintRun
  };
}

// Helper to generate TypeScript card array from checklist text
function generateCardArray(checklistText: string): string {
  const lines = checklistText.trim().split('\n');
  const cards: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes('cards.')) continue; // Skip headers

    const card = parseCardLine(trimmed);
    if (card) {
      cards.push(card);
    }
  }

  // Generate TypeScript array literal
  const cardEntries = cards.map(card =>
    `      { number: '${card.number}', player: '${card.player}', team: '${card.team}', printRun: ${card.printRun || 'null'} }`
  );

  return `[\n${cardEntries.join(',\n')}\n    ]`;
}

// Example usage - you can call this function with your checklist data
console.log('Helper functions loaded. Use generateCardArray(checklistText) to convert checklist to TypeScript.');

// Export for use in other scripts
export { parseCardLine, generateCardArray };
