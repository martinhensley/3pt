/**
 * Intelligent Checklist Parser
 *
 * Parses pasted checklist text to extract:
 * - Set name and metadata
 * - Base set parallels
 * - Base set cards
 * - Parallel-specific checklists (for "or fewer" cases)
 */

export interface ParsedCard {
  cardNumber: string;
  playerName: string;
  team: string;
  printRun: number | null;
}

export interface ParsedParallel {
  name: string;
  printRun: number | null;
  cards: ParsedCard[] | null; // null = mirrors base checklist
}

export interface ParsedSet {
  setName: string;
  expectedCardCount: number | null;
  baseSetPrintRun: number | null; // e.g., 145 for base cards
  parallels: ParsedParallel[];
  baseCards: ParsedCard[];
}

/**
 * Main parser function
 */
export function parseChecklistText(text: string): ParsedSet {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  if (lines.length === 0) {
    throw new Error('Empty checklist text');
  }

  // Parse set header (first line)
  const setName = lines[0];

  // Parse total cards (second line if it's a number followed by "cards")
  let expectedCardCount: number | null = null;
  let startIndex = 1;

  if (lines[1]?.match(/^(\d+)\s+cards?$/i)) {
    expectedCardCount = parseInt(lines[1], 10);
    startIndex = 2;
  }

  // Find "Parallels" section
  const parallelsIndex = lines.findIndex((line, idx) =>
    idx >= startIndex && line.toLowerCase() === 'parallels'
  );

  if (parallelsIndex === -1) {
    throw new Error('No "Parallels" section found');
  }

  // Parse parallels list (between "Parallels" and first card number)
  const parallels: ParsedParallel[] = [];
  let baseCardsStartIndex = parallelsIndex + 1;

  for (let i = parallelsIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a parallel line or a card line
    // Card lines start with a number followed by space and player name
    if (/^\d+\s+[A-Z]/.test(line)) {
      baseCardsStartIndex = i;
      break;
    }

    // Parse parallel line
    const parallel = parseParallelLine(line);
    if (parallel) {
      parallels.push(parallel);
    }
  }

  // Parse base cards
  const baseCards: ParsedCard[] = [];
  let baseSetPrintRun: number | null = null;

  for (let i = baseCardsStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Stop if we hit another parallel-specific checklist section
    if (isParallelChecklistHeader(line)) {
      break;
    }

    // Parse card line
    const card = parseCardLine(line);
    if (card) {
      baseCards.push(card);
      // Extract base set print run from first card if not set
      if (baseSetPrintRun === null && card.printRun) {
        baseSetPrintRun = card.printRun;
      }
    }
  }

  // Parse parallel-specific checklists (for "or fewer" cases)
  const parallelChecklistSections = findParallelChecklistSections(lines, baseCardsStartIndex);

  for (const section of parallelChecklistSections) {
    const parallelIndex = parallels.findIndex(p =>
      section.parallelName.includes(p.name) || p.name.includes(section.parallelName)
    );

    if (parallelIndex !== -1) {
      parallels[parallelIndex].cards = section.cards;
    }
  }

  return {
    setName,
    totalCards,
    baseSetPrintRun,
    parallels,
    baseCards,
  };
}

/**
 * Parse a parallel line
 * Examples:
 * - "Electric Etch Red Pulsar /44" -> { name: "Electric Etch Red Pulsar", printRun: 44 }
 * - "Electric Etch Blue Finite /1" -> { name: "Electric Etch Blue Finite", printRun: 1 }
 */
function parseParallelLine(line: string): ParsedParallel | null {
  // Match pattern: Name /printRun
  const match = line.match(/^(.+?)\s+\/(\d+)$/);

  if (match) {
    const name = match[1].trim();
    const printRun = parseInt(match[2], 10);

    return {
      name,
      printRun,
      cards: null, // Will be filled if there's a specific checklist
    };
  }

  return null;
}

/**
 * Parse a card line
 * Examples:
 * - "1 Jude Bellingham, Real Madrid /145" -> { cardNumber: "1", playerName: "Jude Bellingham", team: "Real Madrid", printRun: 145 }
 * - "25 Joan Martinez, Real Madrid (NO BASE)" -> { cardNumber: "25", playerName: "Joan Martinez", team: "Real Madrid", printRun: null }
 */
function parseCardLine(line: string): ParsedCard | null {
  // Match pattern: NUMBER PlayerName, Team /printRun
  // or: NUMBER PlayerName, Team (NO BASE)
  const match = line.match(/^(\d+)\s+(.+?),\s+(.+?)(?:\s+\/(\d+)|\s+\(NO BASE\))?$/);

  if (match) {
    const cardNumber = match[1];
    const playerName = match[2].trim();
    const team = match[3].trim();
    const printRun = match[4] ? parseInt(match[4], 10) : null;

    return {
      cardNumber,
      playerName,
      team,
      printRun,
    };
  }

  return null;
}

/**
 * Check if a line is a parallel checklist header
 * Examples:
 * - "Dual Jersey Ink Electric Etch Orange"
 * - "Dual Jersey Ink Electric Etch Red Pulsar"
 */
function isParallelChecklistHeader(line: string): boolean {
  // Heuristic: lines with multiple words, no numbers at start, and contains parallel keywords
  return (
    !/^\d+\s/.test(line) && // Not a card line
    line.split(/\s+/).length >= 3 && // At least 3 words
    !line.toLowerCase().includes('parallels') && // Not the main "Parallels" header
    !/\/\d+$/.test(line) // Not a parallel definition line (no /XX at end)
  );
}

/**
 * Find and parse parallel-specific checklist sections
 */
interface ParallelChecklistSection {
  parallelName: string;
  cards: ParsedCard[];
}

function findParallelChecklistSections(
  lines: string[],
  startIndex: number
): ParallelChecklistSection[] {
  const sections: ParallelChecklistSection[] = [];
  let currentSection: ParallelChecklistSection | null = null;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a parallel checklist header
    if (isParallelChecklistHeader(line)) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        parallelName: line,
        cards: [],
      };
      continue;
    }

    // If we're in a section, try to parse card
    if (currentSection) {
      const card = parseCardLine(line);
      if (card) {
        currentSection.cards.push(card);
      }
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Validate parsed set data
 */
export function validateParsedSet(parsed: ParsedSet): string[] {
  const errors: string[] = [];

  if (!parsed.setName) {
    errors.push('Missing set name');
  }

  if (parsed.baseCards.length === 0) {
    errors.push('No base cards found');
  }

  if (parsed.parallels.length === 0) {
    errors.push('No parallels found');
  }

  // Check for duplicate card numbers in base set
  const cardNumbers = new Set<string>();
  for (const card of parsed.baseCards) {
    if (cardNumbers.has(card.cardNumber)) {
      errors.push(`Duplicate card number: ${card.cardNumber}`);
    }
    cardNumbers.add(card.cardNumber);
  }

  // Check for parallels with variable checklists
  for (const parallel of parsed.parallels) {
    if (parallel.cards && parallel.cards.length > 0) {
      // This parallel has a custom checklist
      const parallelCardNumbers = new Set<string>();
      for (const card of parallel.cards) {
        if (parallelCardNumbers.has(card.cardNumber)) {
          errors.push(`Duplicate card number in ${parallel.name}: ${card.cardNumber}`);
        }
        parallelCardNumbers.add(card.cardNumber);
      }
    }
  }

  return errors;
}

/**
 * Generate summary of parsed data for display
 */
export function generateParseSummary(parsed: ParsedSet): string {
  let summary = `Set: ${parsed.setName}\n`;
  summary += `Total Cards: ${parsed.expectedCardCount || 'Unknown'}\n`;
  summary += `Base Cards: ${parsed.baseCards.length}\n`;
  summary += `Base Print Run: ${parsed.baseSetPrintRun ? `/${parsed.baseSetPrintRun}` : 'Unlimited'}\n`;
  summary += `\nParallels: ${parsed.parallels.length}\n`;

  for (const parallel of parsed.parallels) {
    const hasCustomChecklist = parallel.cards && parallel.cards.length > 0;
    const cardCount = hasCustomChecklist
      ? `${parallel.cards!.length} cards (custom checklist)`
      : `${parsed.baseCards.length} cards (mirrors base)`;
    summary += `  - ${parallel.name} /${parallel.printRun}: ${cardCount}\n`;
  }

  return summary;
}
