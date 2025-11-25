/**
 * Tests for Checklist Parser module
 */
import { describe, it, expect } from 'vitest';
import {
  parseChecklistText,
  validateParsedSet,
  generateParseSummary,
  type ParsedSet,
  type ParsedCard,
} from '../checklistParser';

describe('checklistParser', () => {
  describe('parseChecklistText', () => {
    const validChecklist = `Base Set
200 cards
Parallels
Gold /99
Silver /199
Bronze /299
1 LeBron James, Los Angeles Lakers /145
2 Stephen Curry, Golden State Warriors /145
3 Kevin Durant, Phoenix Suns /145`;

    it('parses a valid checklist with all components', () => {
      const result = parseChecklistText(validChecklist);

      expect(result.setName).toBe('Base Set');
      expect(result.expectedCardCount).toBe(200);
      expect(result.parallels).toHaveLength(3);
      expect(result.baseCards).toHaveLength(3);
    });

    it('extracts set name from first line', () => {
      const result = parseChecklistText(validChecklist);
      expect(result.setName).toBe('Base Set');
    });

    it('extracts expected card count from second line', () => {
      const result = parseChecklistText(validChecklist);
      expect(result.expectedCardCount).toBe(200);
    });

    it('handles singular "card" in count line', () => {
      const singleCard = `Test Set
1 card
Parallels
Gold /10
1 Test Player, Test Team /100`;

      const result = parseChecklistText(singleCard);
      expect(result.expectedCardCount).toBe(1);
    });

    it('parses parallels correctly', () => {
      const result = parseChecklistText(validChecklist);

      expect(result.parallels[0]).toEqual({
        name: 'Gold',
        printRun: 99,
        cards: null,
      });
      expect(result.parallels[1]).toEqual({
        name: 'Silver',
        printRun: 199,
        cards: null,
      });
      expect(result.parallels[2]).toEqual({
        name: 'Bronze',
        printRun: 299,
        cards: null,
      });
    });

    it('parses base cards correctly', () => {
      const result = parseChecklistText(validChecklist);

      expect(result.baseCards[0]).toEqual({
        cardNumber: '1',
        playerName: 'LeBron James',
        team: 'Los Angeles Lakers',
        printRun: 145,
      });
      expect(result.baseCards[1]).toEqual({
        cardNumber: '2',
        playerName: 'Stephen Curry',
        team: 'Golden State Warriors',
        printRun: 145,
      });
    });

    it('extracts base set print run from first card', () => {
      const result = parseChecklistText(validChecklist);
      expect(result.baseSetPrintRun).toBe(145);
    });

    it('handles checklist without card count', () => {
      const noCount = `Insert Set
Parallels
Gold /25
1 Test Player, Test Team /50`;

      const result = parseChecklistText(noCount);
      expect(result.setName).toBe('Insert Set');
      expect(result.expectedCardCount).toBeNull();
      expect(result.baseCards).toHaveLength(1);
    });

    it('handles (NO BASE) cards', () => {
      const noBaseChecklist = `Special Set
Parallels
Gold /10
25 Joan Martinez, Real Madrid (NO BASE)`;

      const result = parseChecklistText(noBaseChecklist);
      const card = result.baseCards[0];

      expect(card.cardNumber).toBe('25');
      expect(card.playerName).toBe('Joan Martinez');
      expect(card.team).toBe('Real Madrid');
      expect(card.printRun).toBeNull();
    });

    it('handles multi-word parallel names', () => {
      const multiWordParallel = `Test Set
Parallels
Electric Etch Red Pulsar /44
Electric Etch Blue Finite /1
1 Player Name, Team /100`;

      const result = parseChecklistText(multiWordParallel);

      expect(result.parallels[0]).toEqual({
        name: 'Electric Etch Red Pulsar',
        printRun: 44,
        cards: null,
      });
      expect(result.parallels[1]).toEqual({
        name: 'Electric Etch Blue Finite',
        printRun: 1,
        cards: null,
      });
    });

    it('throws error on empty checklist', () => {
      expect(() => parseChecklistText('')).toThrow('Empty checklist text');
    });

    it('throws error on whitespace-only checklist', () => {
      expect(() => parseChecklistText('   \n\n   ')).toThrow('Empty checklist text');
    });

    it('throws error when no Parallels section found', () => {
      const noParallels = `Test Set
200 cards
1 Player Name, Team /100`;

      expect(() => parseChecklistText(noParallels)).toThrow('No "Parallels" section found');
    });

    it('handles various whitespace in lines', () => {
      const whitespaceChecklist = `  Base Set
  200 cards
  Parallels
  Gold /99
  1 Player Name, Team /100  `;

      const result = parseChecklistText(whitespaceChecklist);
      expect(result.setName).toBe('Base Set');
      expect(result.parallels[0].name).toBe('Gold');
    });

    it('handles case-insensitive Parallels header', () => {
      const lowercaseHeader = `Test Set
parallels
Gold /10
1 Player, Team /100`;

      const result = parseChecklistText(lowercaseHeader);
      expect(result.parallels).toHaveLength(1);
    });
  });

  describe('validateParsedSet', () => {
    const createValidSet = (): ParsedSet => ({
      setName: 'Test Set',
      expectedCardCount: 10,
      baseSetPrintRun: 100,
      parallels: [{ name: 'Gold', printRun: 10, cards: null }],
      baseCards: [{ cardNumber: '1', playerName: 'Test', team: 'Team', printRun: 100 }],
    });

    it('returns empty array for valid set', () => {
      const errors = validateParsedSet(createValidSet());
      expect(errors).toHaveLength(0);
    });

    it('reports missing set name', () => {
      const parsed = createValidSet();
      parsed.setName = '';

      const errors = validateParsedSet(parsed);
      expect(errors).toContain('Missing set name');
    });

    it('reports no base cards', () => {
      const parsed = createValidSet();
      parsed.baseCards = [];

      const errors = validateParsedSet(parsed);
      expect(errors).toContain('No base cards found');
    });

    it('reports no parallels', () => {
      const parsed = createValidSet();
      parsed.parallels = [];

      const errors = validateParsedSet(parsed);
      expect(errors).toContain('No parallels found');
    });

    it('reports duplicate card numbers in base set', () => {
      const parsed = createValidSet();
      parsed.baseCards = [
        { cardNumber: '1', playerName: 'Player A', team: 'Team', printRun: 100 },
        { cardNumber: '1', playerName: 'Player B', team: 'Team', printRun: 100 },
      ];

      const errors = validateParsedSet(parsed);
      expect(errors).toContain('Duplicate card number: 1');
    });

    it('reports duplicate card numbers in parallel checklist', () => {
      const parsed = createValidSet();
      parsed.parallels = [{
        name: 'Gold',
        printRun: 10,
        cards: [
          { cardNumber: '5', playerName: 'Player A', team: 'Team', printRun: 10 },
          { cardNumber: '5', playerName: 'Player B', team: 'Team', printRun: 10 },
        ],
      }];

      const errors = validateParsedSet(parsed);
      expect(errors).toContain('Duplicate card number in Gold: 5');
    });

    it('returns multiple errors when applicable', () => {
      const parsed: ParsedSet = {
        setName: '',
        expectedCardCount: null,
        baseSetPrintRun: null,
        parallels: [],
        baseCards: [],
      };

      const errors = validateParsedSet(parsed);
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('generateParseSummary', () => {
    const createSampleSet = (): ParsedSet => ({
      setName: 'Prizm Basketball',
      expectedCardCount: 200,
      baseSetPrintRun: 145,
      parallels: [
        { name: 'Gold', printRun: 10, cards: null },
        { name: 'Silver', printRun: 25, cards: [
          { cardNumber: '1', playerName: 'Player', team: 'Team', printRun: 25 },
        ]},
      ],
      baseCards: [
        { cardNumber: '1', playerName: 'LeBron James', team: 'Lakers', printRun: 145 },
        { cardNumber: '2', playerName: 'Stephen Curry', team: 'Warriors', printRun: 145 },
      ],
    });

    it('generates summary with set name', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('Set: Prizm Basketball');
    });

    it('includes total cards count', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('Total Cards: 200');
    });

    it('shows "Unknown" for missing card count', () => {
      const set = createSampleSet();
      set.expectedCardCount = null;

      const summary = generateParseSummary(set);
      expect(summary).toContain('Total Cards: Unknown');
    });

    it('includes base cards count', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('Base Cards: 2');
    });

    it('includes base print run', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('Base Print Run: /145');
    });

    it('shows "Unlimited" for missing base print run', () => {
      const set = createSampleSet();
      set.baseSetPrintRun = null;

      const summary = generateParseSummary(set);
      expect(summary).toContain('Base Print Run: Unlimited');
    });

    it('includes parallel count', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('Parallels: 2');
    });

    it('shows parallel details with print runs', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('Gold /10');
      expect(summary).toContain('Silver /25');
    });

    it('indicates custom checklist for parallels with cards', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('custom checklist');
    });

    it('indicates mirrors base for parallels without custom cards', () => {
      const summary = generateParseSummary(createSampleSet());
      expect(summary).toContain('mirrors base');
    });
  });

  describe('edge cases', () => {
    it('handles cards with special characters in names', () => {
      const specialChars = `Test Set
Parallels
Gold /10
1 Kylian Mbappé, Paris Saint-Germain /100`;

      const result = parseChecklistText(specialChars);
      expect(result.baseCards[0].playerName).toBe('Kylian Mbappé');
    });

    it('handles very long parallel names', () => {
      const longName = `Test Set
Parallels
Dual Jersey Ink Electric Etch Orange Pulsar Mojo Refractor /5
1 Player, Team /100`;

      const result = parseChecklistText(longName);
      expect(result.parallels[0].name).toBe('Dual Jersey Ink Electric Etch Orange Pulsar Mojo Refractor');
    });

    it('handles 1/1 parallels', () => {
      const oneOfOne = `Test Set
Parallels
Black /1
1 Player, Team /100`;

      const result = parseChecklistText(oneOfOne);
      expect(result.parallels[0].printRun).toBe(1);
    });

    it('handles cards with hyphenated teams', () => {
      const hyphenated = `Test Set
Parallels
Gold /10
1 Player Name, Saint-Germain FC /100`;

      const result = parseChecklistText(hyphenated);
      expect(result.baseCards[0].team).toBe('Saint-Germain FC');
    });

    it('handles cards with Jr./Sr. in names', () => {
      const suffix = `Test Set
Parallels
Gold /10
1 Ken Griffey Jr., Seattle Mariners /100`;

      const result = parseChecklistText(suffix);
      expect(result.baseCards[0].playerName).toBe('Ken Griffey Jr.');
    });
  });
});
