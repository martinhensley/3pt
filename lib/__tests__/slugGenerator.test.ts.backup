import { describe, it, expect } from 'vitest';
import {
  generateReleaseSlug,
  generateSetSlug,
  generateCardSlug,
} from '../slugGenerator';

describe('slugGenerator', () => {
  describe('generateReleaseSlug', () => {
    it('generates slug from year, manufacturer, and name', () => {
      expect(generateReleaseSlug('Panini', 'Donruss Soccer', '2024-25')).toBe(
        '2024-25-panini-donruss-soccer'
      );
    });

    it('handles missing year', () => {
      expect(generateReleaseSlug('Panini', 'Donruss Soccer')).toBe(
        'panini-donruss-soccer'
      );
    });

    it('converts to lowercase', () => {
      expect(generateReleaseSlug('PANINI', 'DONRUSS SOCCER', '2024')).toBe(
        '2024-panini-donruss-soccer'
      );
    });

    it('replaces special characters with hyphens', () => {
      expect(generateReleaseSlug('Panini', "Donruss's Soccer!", '2024')).toBe(
        '2024-panini-donruss-s-soccer'
      );
    });

    it('removes leading and trailing hyphens', () => {
      expect(generateReleaseSlug('Panini', '-Soccer-', '2024')).toBe(
        '2024-panini-soccer'
      );
    });

    it('handles multiple spaces and special chars', () => {
      expect(generateReleaseSlug('Panini', 'Donruss   Soccer & More', '2024')).toBe(
        '2024-panini-donruss-soccer-more'
      );
    });
  });

  describe('generateSetSlug', () => {
    describe('non-parallel sets', () => {
      it('generates slug for base set', () => {
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Base', 'Base')).toBe(
          '2024-25-donruss-soccer-base'
        );
      });

      it('generates slug for base set variations', () => {
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Base Set', 'Base')).toBe(
          '2024-25-donruss-soccer-base'
        );
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Base Checklist', 'Base')).toBe(
          '2024-25-donruss-soccer-base'
        );
      });

      it('normalizes Optic set names', () => {
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base')).toBe(
          '2024-25-donruss-soccer-optic'
        );
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Optic Base Set', 'Base')).toBe(
          '2024-25-donruss-soccer-optic'
        );
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Base Optic', 'Base')).toBe(
          '2024-25-donruss-soccer-optic'
        );
      });

      it('generates slug for insert sets', () => {
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Kaboom', 'Insert')).toBe(
          '2024-25-donruss-soccer-kaboom'
        );
      });

      it('cleans up set names with "Set" and "Checklist"', () => {
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Kaboom Set', 'Insert')).toBe(
          '2024-25-donruss-soccer-kaboom'
        );
        expect(generateSetSlug('2024-25', 'Donruss Soccer', 'Downtown Checklist', 'Insert')).toBe(
          '2024-25-donruss-soccer-downtown'
        );
      });
    });

    describe('parallel sets', () => {
      it('generates slug for parallel without print run', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base', 'Cubic')
        ).toBe('2024-25-donruss-soccer-optic-cubic-parallel');
      });

      it('generates slug for parallel with print run', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base', 'Cubic', 99)
        ).toBe('2024-25-donruss-soccer-optic-cubic-parallel-99');
      });

      it('generates slug for 1/1 parallel', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base', 'Gold', 1)
        ).toBe('2024-25-donruss-soccer-optic-gold-parallel-1');
      });

      it('normalizes 1/1 in parallel name', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base', '1/1')
        ).toBe('2024-25-donruss-soccer-optic-1-of-1-parallel');
      });

      it('normalizes "1 of 1" in parallel name', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base', '1 of 1')
        ).toBe('2024-25-donruss-soccer-optic-1-of-1-parallel');
      });

      it('removes trailing print run from parallel name', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base', 'Cubic /99', 99)
        ).toBe('2024-25-donruss-soccer-optic-cubic-parallel-99');
      });

      it('handles complex parallel names', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Optic', 'Base', 'Blue Cubic', 99)
        ).toBe('2024-25-donruss-soccer-optic-blue-cubic-parallel-99');
      });

      it('handles insert parallels', () => {
        expect(
          generateSetSlug('2024-25', 'Donruss Soccer', 'Kaboom', 'Insert', 'Gold', 10)
        ).toBe('2024-25-donruss-soccer-kaboom-gold-parallel-10');
      });
    });
  });

  describe('generateCardSlug', () => {
    describe('base cards', () => {
      it('generates slug for base card without variant', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Base',
            '1',
            'Jude Bellingham',
            null,
            null,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-base-1-jude-bellingham');
      });

      it('generates slug for optic card', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Optic',
            '2',
            'Malik Tillman',
            null,
            null,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-optic-2-malik-tillman');
      });
    });

    describe('base parallel cards', () => {
      it('excludes set name for base set parallels', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Optic',
            '1',
            'Jude Bellingham',
            'Pink Velocity',
            99,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-1-jude-bellingham-pink-velocity-99');
      });

      it('handles 1/1 cards - converts to 1-of-1', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Optic',
            '1',
            'Jude Bellingham',
            '1/1',
            1,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-1-jude-bellingham-1-of-1');
      });

      it('handles "1 of 1" variant text', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Optic',
            '1',
            'Jude Bellingham',
            '1 of 1',
            1,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-1-jude-bellingham-1-of-1');
      });

      it('handles variant with spaces around slash', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Optic',
            '1',
            'Jude Bellingham',
            '1 / 1',
            1,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-1-jude-bellingham-1-of-1');
      });
    });

    describe('insert/auto/mem cards', () => {
      it('always includes set name for insert cards', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Kaboom',
            '5',
            'Erling Haaland',
            'Gold',
            10,
            'Insert'
          )
        ).toBe('2024-25-donruss-soccer-kaboom-5-erling-haaland-gold-10');
      });

      it('always includes set name for autograph cards', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Beautiful Game Autographs',
            '9',
            'Abby Dahlkemper',
            'Black',
            1,
            'Autograph'
          )
        ).toBe('2024-25-donruss-soccer-beautiful-game-autographs-9-abby-dahlkemper-black-1');
      });

      it('always includes set name for memorabilia cards', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Jersey Series',
            '10',
            'Kylian Mbappe',
            'Prime',
            25,
            'Memorabilia'
          )
        ).toBe('2024-25-donruss-soccer-jersey-series-10-kylian-mbappe-prime-25');
      });
    });

    describe('duplicate print run handling', () => {
      it('does not duplicate print run when already in variant', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Base',
            '1',
            'Jude Bellingham',
            'Gold 10',
            10,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-1-jude-bellingham-gold-10');
      });

      it('does not add print run when variant ends with 1-of-1 and printRun is 1', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Base',
            '1',
            'Jude Bellingham',
            'Gold 1/1',
            1,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-1-jude-bellingham-gold-1-of-1');
      });
    });

    describe('edge cases', () => {
      it('handles special characters in player name', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Base',
            '1',
            "Mbappé-Lottin, Kylian",
            null,
            null,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-base-1-mbapp-lottin-kylian');
      });

      it('handles card number with letters', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Base',
            'RC-1',
            'Player Name',
            null,
            null,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-base-rc-1-player-name');
      });

      it('handles when setType is not provided (backward compatibility)', () => {
        // When setType is undefined, it should behave like Base
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Optic',
            '1',
            'Jude Bellingham',
            'Pink',
            99
          )
        ).toBe('2024-25-donruss-soccer-1-jude-bellingham-pink-99');
      });

      it('includes set name when variant matches set name', () => {
        // Variant same as set name should NOT exclude set name
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Base',
            '1',
            'Player',
            'Base',
            null,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-base-1-player-base');
      });

      it('includes set name when variant contains "base"', () => {
        expect(
          generateCardSlug(
            'Panini',
            'Donruss Soccer',
            '2024-25',
            'Optic',
            '1',
            'Player',
            'Base Gold',
            10,
            'Base'
          )
        ).toBe('2024-25-donruss-soccer-optic-1-player-base-gold-10');
      });
    });
  });
});
