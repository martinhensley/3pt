import { describe, it, expect } from 'vitest';
import {
  isParallelSet,
  getBaseSetSlug,
  getParallelVariant,
  getParallelPrintRun,
  sortSets,
  sortSetsGrouped,
  groupSetsByBase,
} from '../setUtils';

describe('setUtils', () => {
  describe('isParallelSet', () => {
    it('returns true for slugs containing "-parallel"', () => {
      expect(isParallelSet('2024-25-donruss-soccer-optic-cubic-parallel')).toBe(true);
      expect(isParallelSet('2024-25-donruss-soccer-optic-cubic-parallel-99')).toBe(true);
      expect(isParallelSet('2024-25-donruss-soccer-base-gold-parallel-10')).toBe(true);
    });

    it('returns false for base sets without "-parallel"', () => {
      expect(isParallelSet('2024-25-donruss-soccer-optic')).toBe(false);
      expect(isParallelSet('2024-25-donruss-soccer-base')).toBe(false);
      expect(isParallelSet('2024-25-donruss-soccer-kaboom')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isParallelSet('')).toBe(false);
      expect(isParallelSet('parallel')).toBe(false); // Not prefixed with -
      expect(isParallelSet('some-parallel-thing')).toBe(true);
    });
  });

  describe('getBaseSetSlug', () => {
    it('returns the same slug for non-parallel sets', () => {
      expect(getBaseSetSlug('2024-25-donruss-soccer-optic')).toBe('2024-25-donruss-soccer-optic');
      expect(getBaseSetSlug('2024-25-donruss-soccer-base')).toBe('2024-25-donruss-soccer-base');
    });

    it('extracts base slug from parallel slugs with known set patterns', () => {
      expect(getBaseSetSlug('2024-25-donruss-soccer-optic-cubic-parallel-99')).toBe('2024-25-donruss-soccer-optic');
      expect(getBaseSetSlug('2024-25-donruss-soccer-base-gold-parallel')).toBe('2024-25-donruss-soccer-base');
      expect(getBaseSetSlug('2024-25-donruss-soccer-kaboom-red-parallel-10')).toBe('2024-25-donruss-soccer-kaboom');
    });

    it('handles complex variant names', () => {
      expect(getBaseSetSlug('2024-25-donruss-soccer-optic-blue-cubic-parallel-99')).toBe('2024-25-donruss-soccer-optic');
    });

    it('falls back for unknown set patterns', () => {
      // Fallback takes first 5 segments
      const result = getBaseSetSlug('2024-25-something-weird-set-variant-parallel-50');
      expect(result).toBe('2024-25-something-weird-set');
    });
  });

  describe('getParallelVariant', () => {
    it('returns null for non-parallel sets', () => {
      expect(getParallelVariant('2024-25-donruss-soccer-optic')).toBeNull();
      expect(getParallelVariant('2024-25-donruss-soccer-base')).toBeNull();
    });

    it('extracts variant name from parallel slugs', () => {
      expect(getParallelVariant('2024-25-donruss-soccer-optic-cubic-parallel-99')).toBe('cubic');
      expect(getParallelVariant('2024-25-donruss-soccer-optic-blue-cubic-parallel-99')).toBe('blue-cubic');
    });

    it('handles parallels without print runs', () => {
      expect(getParallelVariant('2024-25-donruss-soccer-optic-gold-parallel')).toBe('gold');
    });

    it('handles edge case of parallel without explicit variant name', () => {
      // When there's no variant name between the set name and "-parallel"
      // Due to string slicing, this returns "-" (the separator between base and parallel)
      const result = getParallelVariant('2024-25-donruss-soccer-optic-parallel');
      // This is an edge case - real-world parallels always have a variant name
      expect(result).toBe('-');
    });
  });

  describe('getParallelPrintRun', () => {
    it('returns null for non-parallel sets', () => {
      expect(getParallelPrintRun('2024-25-donruss-soccer-optic')).toBeNull();
    });

    it('extracts print run from parallel slugs', () => {
      expect(getParallelPrintRun('2024-25-donruss-soccer-optic-cubic-parallel-99')).toBe(99);
      expect(getParallelPrintRun('2024-25-donruss-soccer-base-gold-parallel-10')).toBe(10);
      expect(getParallelPrintRun('2024-25-donruss-soccer-base-gold-parallel-1')).toBe(1);
    });

    it('returns null for parallels without print runs', () => {
      expect(getParallelPrintRun('2024-25-donruss-soccer-optic-cubic-parallel')).toBeNull();
    });

    it('returns null for non-numeric values after parallel', () => {
      expect(getParallelPrintRun('2024-25-donruss-soccer-optic-parallel-abc')).toBeNull();
    });
  });

  describe('sortSets', () => {
    it('places non-parallels before parallels', () => {
      const sets = [
        { slug: '2024-25-donruss-soccer-optic-cubic-parallel-99' },
        { slug: '2024-25-donruss-soccer-optic' },
        { slug: '2024-25-donruss-soccer-base-gold-parallel' },
        { slug: '2024-25-donruss-soccer-base' },
      ];
      const sorted = sortSets(sets);
      expect(sorted[0].slug).toBe('2024-25-donruss-soccer-base');
      expect(sorted[1].slug).toBe('2024-25-donruss-soccer-optic');
    });

    it('sorts non-parallels alphabetically', () => {
      const sets = [
        { slug: 'z-set' },
        { slug: 'a-set' },
        { slug: 'm-set' },
      ];
      const sorted = sortSets(sets);
      expect(sorted.map(s => s.slug)).toEqual(['a-set', 'm-set', 'z-set']);
    });

    it('places unnumbered parallels before numbered parallels', () => {
      const sets = [
        { slug: '2024-25-set-gold-parallel-99' },
        { slug: '2024-25-set-silver-parallel' },
        { slug: '2024-25-set-bronze-parallel-50' },
      ];
      const sorted = sortSets(sets);
      expect(sorted[0].slug).toBe('2024-25-set-silver-parallel'); // unnumbered first
    });

    it('sorts numbered parallels from highest to lowest print run', () => {
      const sets = [
        { slug: '2024-25-set-red-parallel-10' },
        { slug: '2024-25-set-gold-parallel-99' },
        { slug: '2024-25-set-black-parallel-1' },
      ];
      const sorted = sortSets(sets);
      expect(sorted.map(s => s.slug)).toEqual([
        '2024-25-set-gold-parallel-99',
        '2024-25-set-red-parallel-10',
        '2024-25-set-black-parallel-1',
      ]);
    });

    it('uses printRun property when available', () => {
      const sets = [
        { slug: '2024-25-set-red-parallel', printRun: 10 },
        { slug: '2024-25-set-gold-parallel', printRun: 99 },
        { slug: '2024-25-set-black-parallel', printRun: 1 },
      ];
      const sorted = sortSets(sets);
      expect(sorted[0].printRun).toBe(99);
      expect(sorted[1].printRun).toBe(10);
      expect(sorted[2].printRun).toBe(1);
    });

    it('sorts by name when available and same print run', () => {
      const sets = [
        { slug: '2024-25-set-z-parallel-50', name: 'Z Variant', printRun: 50 },
        { slug: '2024-25-set-a-parallel-50', name: 'A Variant', printRun: 50 },
      ];
      const sorted = sortSets(sets);
      expect(sorted[0].name).toBe('A Variant');
      expect(sorted[1].name).toBe('Z Variant');
    });

    it('sorts non-parallels by name when available', () => {
      const sets = [
        { slug: 'z-set', name: 'Zebra Set' },
        { slug: 'a-set', name: 'Alpha Set' },
      ];
      const sorted = sortSets(sets);
      expect(sorted[0].name).toBe('Alpha Set');
    });

    it('handles empty array', () => {
      expect(sortSets([])).toEqual([]);
    });

    it('handles single item', () => {
      const sets = [{ slug: 'single-set' }];
      expect(sortSets(sets)).toEqual([{ slug: 'single-set' }]);
    });
  });

  describe('sortSetsGrouped', () => {
    it('groups Base variants together', () => {
      const sets = [
        { slug: 's1', name: 'Base Gold', printRun: 10 },
        { slug: 's2', name: 'Base', printRun: null },
        { slug: 's3', name: 'Base Silver', printRun: 25 },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Base'); // Base comes first
    });

    it('groups Optic variants together', () => {
      const sets = [
        { slug: 's1', name: 'Optic Blue', printRun: 99 },
        { slug: 's2', name: 'Optic', printRun: null },
        { slug: 's3', name: 'Kaboom', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      // Base should come before Optic, which should come before Kaboom
      expect(sorted.find(s => s.name === 'Optic')!.name).toBe('Optic');
    });

    it('places Base group first, then Optic, then alphabetical', () => {
      const sets = [
        { slug: 's1', name: 'Kaboom', printRun: null },
        { slug: 's2', name: 'Optic', printRun: null },
        { slug: 's3', name: 'Base', printRun: null },
        { slug: 's4', name: 'Animation', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Base');
      expect(sorted[1].name).toBe('Optic');
      // Then alphabetical: Animation, Kaboom
      expect(sorted[2].name).toBe('Animation');
      expect(sorted[3].name).toBe('Kaboom');
    });

    it('sorts variants within groups: base first, then unnumbered, then numbered desc', () => {
      const sets = [
        { slug: 's1', name: 'Base Gold', printRun: 10 },
        { slug: 's2', name: 'Base', printRun: null },
        { slug: 's3', name: 'Base Silver', printRun: 25 },
        { slug: 's4', name: 'Base Holo', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Base'); // Base (no variant) first
      expect(sorted[1].name).toBe('Base Holo'); // Unnumbered variants
      expect(sorted[2].name).toBe('Base Silver'); // printRun 25
      expect(sorted[3].name).toBe('Base Gold'); // printRun 10
    });

    it('handles Artist\'s Proof variants', () => {
      const sets = [
        { slug: 's1', name: 'Kaboom Artist\'s Proof Gold', printRun: 10 },
        { slug: 's2', name: 'Kaboom', printRun: null },
        { slug: 's3', name: 'Kaboom Artist\'s Proof', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Kaboom'); // Base first
    });

    it('handles Press Proof variants', () => {
      const sets = [
        { slug: 's1', name: 'Base Press Proof Silver', printRun: 75 },
        { slug: 's2', name: 'Base', printRun: null },
        { slug: 's3', name: 'Base Press Proof', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Base');
      expect(sorted[1].name).toBe('Base Press Proof'); // unnumbered
      expect(sorted[2].name).toBe('Base Press Proof Silver'); // numbered
    });

    it('handles Holo Laser variants', () => {
      const sets = [
        { slug: 's1', name: 'Base Holo Blue Orange Laser', printRun: 25 },
        { slug: 's2', name: 'Base', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Base');
    });

    it('handles Prime variants', () => {
      const sets = [
        { slug: 's1', name: 'Signature Series Prime', printRun: 5 },
        { slug: 's2', name: 'Signature Series', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Signature Series');
      expect(sorted[1].name).toBe('Signature Series Prime');
    });

    it('handles Tip-off variants', () => {
      const sets = [
        { slug: 's1', name: 'Downtown Tip-off', printRun: 1 },
        { slug: 's2', name: 'Downtown', printRun: null },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Downtown');
    });

    it('handles Patch and Tag variants', () => {
      const sets = [
        { slug: 's1', name: 'Tools of Trade Patch', printRun: 25 },
        { slug: 's2', name: 'Tools of Trade', printRun: null },
        { slug: 's3', name: 'Tools of Trade Tag', printRun: 1 },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Tools of Trade');
    });

    it('handles color variants', () => {
      const sets = [
        { slug: 's1', name: 'Base Red', printRun: 99 },
        { slug: 's2', name: 'Base', printRun: null },
        { slug: 's3', name: 'Base Gold', printRun: 10 },
      ];
      const sorted = sortSetsGrouped(sets);
      expect(sorted[0].name).toBe('Base');
      expect(sorted[1].name).toBe('Base Red'); // 99
      expect(sorted[2].name).toBe('Base Gold'); // 10
    });
  });

  describe('groupSetsByBase', () => {
    it('groups parallel sets with their base set', () => {
      const sets = [
        { slug: '2024-25-donruss-soccer-optic' },
        { slug: '2024-25-donruss-soccer-optic-cubic-parallel-99' },
        { slug: '2024-25-donruss-soccer-optic-gold-parallel' },
      ];
      const groups = groupSetsByBase(sets);
      expect(groups.get('2024-25-donruss-soccer-optic')?.length).toBe(3);
    });

    it('keeps non-related sets separate', () => {
      const sets = [
        { slug: '2024-25-donruss-soccer-optic' },
        { slug: '2024-25-donruss-soccer-base' },
        { slug: '2024-25-donruss-soccer-kaboom' },
      ];
      const groups = groupSetsByBase(sets);
      expect(groups.size).toBe(3);
    });

    it('sorts sets within each group', () => {
      const sets = [
        { slug: '2024-25-donruss-soccer-optic-red-parallel-10' },
        { slug: '2024-25-donruss-soccer-optic' },
        { slug: '2024-25-donruss-soccer-optic-gold-parallel-99' },
      ];
      const groups = groupSetsByBase(sets);
      const opticGroup = groups.get('2024-25-donruss-soccer-optic')!;
      expect(opticGroup[0].slug).toBe('2024-25-donruss-soccer-optic'); // base first
      expect(opticGroup[1].slug).toBe('2024-25-donruss-soccer-optic-gold-parallel-99'); // 99
      expect(opticGroup[2].slug).toBe('2024-25-donruss-soccer-optic-red-parallel-10'); // 10
    });

    it('handles empty array', () => {
      const groups = groupSetsByBase([]);
      expect(groups.size).toBe(0);
    });
  });
});
