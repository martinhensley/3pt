/**
 * Tests for Database module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mocks
const { mockPrisma } = vi.hoisted(() => {
  const createMockPrismaModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });

  return {
    mockPrisma: {
      manufacturer: createMockPrismaModel(),
      release: createMockPrismaModel(),
      set: createMockPrismaModel(),
      card: createMockPrismaModel(),
    },
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('./slugGenerator', () => ({
  generateCardSlug: vi.fn((mfr, rel, year, set, num, player, variant) =>
    `${year}-${mfr}-${rel}-${set}-${num}-${player}${variant ? `-${variant}` : ''}`.toLowerCase().replace(/\s+/g, '-')
  ),
}));

// Import after mocking
import {
  getOrCreateManufacturer,
  createReleaseWithSets,
  addSetToRelease,
  addCardsToSet,
  createCard,
  getAllManufacturers,
  getAllReleases,
  getManufacturerReleases,
  getRelease,
  getReleaseSets,
  getSet,
  getSetCards,
  releaseExists,
  findExistingRelease,
  findReleaseBySlug,
  setExists,
  getLibraryStats,
} from '../database';

describe('database', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateManufacturer', () => {
    it('returns existing manufacturer when found', async () => {
      const existingManufacturer = {
        id: 'mfr-1',
        name: 'Panini',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.manufacturer.findFirst.mockResolvedValue(existingManufacturer);

      const result = await getOrCreateManufacturer('Panini');

      expect(result).toEqual(existingManufacturer);
      expect(mockPrisma.manufacturer.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'Panini',
            mode: 'insensitive',
          },
        },
      });
      expect(mockPrisma.manufacturer.create).not.toHaveBeenCalled();
    });

    it('creates new manufacturer when not found', async () => {
      const newManufacturer = {
        id: 'mfr-2',
        name: 'Topps',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.manufacturer.findFirst.mockResolvedValue(null);
      mockPrisma.manufacturer.create.mockResolvedValue(newManufacturer);

      const result = await getOrCreateManufacturer('Topps');

      expect(result).toEqual(newManufacturer);
      expect(mockPrisma.manufacturer.create).toHaveBeenCalledWith({
        data: { name: 'Topps' },
      });
    });

    it('performs case-insensitive search', async () => {
      mockPrisma.manufacturer.findFirst.mockResolvedValue(null);
      mockPrisma.manufacturer.create.mockResolvedValue({ id: 'mfr-3', name: 'PANINI' });

      await getOrCreateManufacturer('PANINI');

      expect(mockPrisma.manufacturer.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: 'PANINI',
            mode: 'insensitive',
          },
        },
      });
    });
  });

  describe('createReleaseWithSets', () => {
    const manufacturerId = 'mfr-1';
    const releaseData = {
      name: 'Prizm Basketball',
      year: '2024-25',
      slug: '2024-25-panini-prizm',
      summary: 'Popular basketball release',
      releaseDate: new Date('2024-10-15'),
    };

    it('creates release without sets', async () => {
      const createdRelease = {
        id: 'rel-1',
        ...releaseData,
        manufacturerId,
        sets: [],
        manufacturer: { id: manufacturerId, name: 'Panini' },
      };

      mockPrisma.release.create.mockResolvedValue(createdRelease);

      const result = await createReleaseWithSets(manufacturerId, releaseData);

      expect(result).toEqual(createdRelease);
      expect(mockPrisma.release.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Prizm Basketball',
          year: '2024-25',
          manufacturerId,
          sets: undefined,
        }),
        include: {
          sets: true,
          manufacturer: true,
        },
      });
    });

    it('creates release with sets', async () => {
      const sets = [
        { name: 'Base Set', expectedCardCount: 200 },
        { name: 'Autographs', expectedCardCount: 50 },
      ];

      const createdRelease = {
        id: 'rel-1',
        ...releaseData,
        manufacturerId,
        sets: [
          { id: 'set-1', name: 'Base Set', expectedCardCount: 200 },
          { id: 'set-2', name: 'Autographs', expectedCardCount: 50 },
        ],
        manufacturer: { id: manufacturerId, name: 'Panini' },
      };

      mockPrisma.release.create.mockResolvedValue(createdRelease);

      const result = await createReleaseWithSets(manufacturerId, releaseData, sets);

      expect(result.sets).toHaveLength(2);
      expect(mockPrisma.release.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sets: {
            create: [
              { name: 'Base Set', expectedCardCount: 200, parallels: [] },
              { name: 'Autographs', expectedCardCount: 50, parallels: [] },
            ],
          },
        }),
        include: {
          sets: true,
          manufacturer: true,
        },
      });
    });

    it('creates release with sets and parallels', async () => {
      const setsWithParallels = [
        { name: 'Base Set', expectedCardCount: 200, parallels: ['Gold', 'Silver'] },
      ];

      mockPrisma.release.create.mockResolvedValue({
        id: 'rel-1',
        sets: [{ id: 'set-1', name: 'Base Set', parallels: ['Gold', 'Silver'] }],
        manufacturer: { id: manufacturerId, name: 'Panini' },
      });

      await createReleaseWithSets(manufacturerId, releaseData, setsWithParallels);

      expect(mockPrisma.release.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sets: {
            create: [
              { name: 'Base Set', expectedCardCount: 200, parallels: ['Gold', 'Silver'] },
            ],
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('addSetToRelease', () => {
    it('creates a new set for release', async () => {
      const releaseId = 'rel-1';
      const setData = { name: 'Insert Set', expectedCardCount: 30 };
      const createdSet = { id: 'set-1', ...setData, releaseId };

      mockPrisma.set.create.mockResolvedValue(createdSet);

      const result = await addSetToRelease(releaseId, setData);

      expect(result).toEqual(createdSet);
      expect(mockPrisma.set.create).toHaveBeenCalledWith({
        data: {
          ...setData,
          releaseId,
        },
      });
    });
  });

  describe('addCardsToSet', () => {
    const setId = 'set-1';
    const mockSet = {
      name: 'Base Set',
      parallels: [],
      release: {
        name: 'Prizm',
        year: '2024-25',
        manufacturer: { name: 'Panini' },
      },
    };

    it('creates base cards for set without parallels', async () => {
      const cards = [
        { playerName: 'LeBron James', team: 'Lakers', cardNumber: '1' },
        { playerName: 'Stephen Curry', team: 'Warriors', cardNumber: '2' },
      ];

      mockPrisma.set.findUnique.mockResolvedValue(mockSet);
      mockPrisma.card.createMany.mockResolvedValue({ count: 2 });

      const result = await addCardsToSet(setId, cards);

      expect(result.count).toBe(2);
      expect(result.breakdown.base).toBe(2);
      expect(result.breakdown.parallels).toBe(0);
      expect(mockPrisma.card.createMany).toHaveBeenCalledTimes(1);
    });

    it('creates base and parallel cards when set has parallels', async () => {
      const setWithParallels = {
        ...mockSet,
        parallels: ['Gold', 'Silver'],
      };
      const cards = [{ playerName: 'Test', team: 'Team', cardNumber: '1' }];

      mockPrisma.set.findUnique.mockResolvedValue(setWithParallels);
      mockPrisma.card.createMany
        .mockResolvedValueOnce({ count: 1 }) // Base
        .mockResolvedValueOnce({ count: 1 }) // Gold
        .mockResolvedValueOnce({ count: 1 }); // Silver

      const result = await addCardsToSet(setId, cards);

      expect(result.count).toBe(3);
      expect(result.breakdown.base).toBe(1);
      expect(result.breakdown.parallels).toBe(2);
      expect(mockPrisma.card.createMany).toHaveBeenCalledTimes(3);
    });

    it('throws error when set not found', async () => {
      mockPrisma.set.findUnique.mockResolvedValue(null);

      await expect(addCardsToSet('non-existent', [])).rejects.toThrow(
        'Set with id non-existent not found'
      );
    });

    it('generates correct slugs for cards', async () => {
      const cards = [{ playerName: 'LeBron James', cardNumber: '1' }];

      mockPrisma.set.findUnique.mockResolvedValue(mockSet);
      mockPrisma.card.createMany.mockResolvedValue({ count: 1 });

      await addCardsToSet(setId, cards);

      const createCall = mockPrisma.card.createMany.mock.calls[0][0];
      expect(createCall.data[0].slug).toBeDefined();
      expect(createCall.data[0].parallelType).toBe('Base');
    });
  });

  describe('createCard', () => {
    it('creates a single card', async () => {
      const setId = 'set-1';
      const cardData = {
        playerName: 'LeBron James',
        team: 'Lakers',
        cardNumber: '1',
      };
      const createdCard = { id: 'card-1', ...cardData, setId };

      mockPrisma.card.create.mockResolvedValue(createdCard);

      const result = await createCard(setId, cardData);

      expect(result).toEqual(createdCard);
      expect(mockPrisma.card.create).toHaveBeenCalledWith({
        data: { ...cardData, setId },
      });
    });
  });

  describe('getAllManufacturers', () => {
    it('returns all manufacturers with releases', async () => {
      const manufacturers = [
        {
          id: 'mfr-1',
          name: 'Panini',
          releases: [{ id: 'rel-1', sets: [] }],
        },
      ];

      mockPrisma.manufacturer.findMany.mockResolvedValue(manufacturers);

      const result = await getAllManufacturers();

      expect(result).toEqual(manufacturers);
      expect(mockPrisma.manufacturer.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          releases: expect.any(Object),
        }),
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getAllReleases', () => {
    it('returns all releases with manufacturer and sets', async () => {
      const releases = [
        {
          id: 'rel-1',
          name: 'Prizm',
          manufacturer: { name: 'Panini' },
          sets: [],
        },
      ];

      mockPrisma.release.findMany.mockResolvedValue(releases);

      const result = await getAllReleases();

      expect(result).toEqual(releases);
      expect(mockPrisma.release.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          manufacturer: true,
          sets: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getManufacturerReleases', () => {
    it('returns releases for specific manufacturer', async () => {
      const manufacturerId = 'mfr-1';
      const releases = [{ id: 'rel-1', manufacturerId }];

      mockPrisma.release.findMany.mockResolvedValue(releases);

      const result = await getManufacturerReleases(manufacturerId);

      expect(result).toEqual(releases);
      expect(mockPrisma.release.findMany).toHaveBeenCalledWith({
        where: { manufacturerId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getRelease', () => {
    it('returns single release with sets and manufacturer', async () => {
      const release = {
        id: 'rel-1',
        name: 'Prizm',
        manufacturer: { name: 'Panini' },
        sets: [],
      };

      mockPrisma.release.findUnique.mockResolvedValue(release);

      const result = await getRelease('rel-1');

      expect(result).toEqual(release);
      expect(mockPrisma.release.findUnique).toHaveBeenCalledWith({
        where: { id: 'rel-1' },
        include: expect.any(Object),
      });
    });

    it('returns null when release not found', async () => {
      mockPrisma.release.findUnique.mockResolvedValue(null);

      const result = await getRelease('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getReleaseSets', () => {
    it('returns sets for specific release', async () => {
      const releaseId = 'rel-1';
      const sets = [{ id: 'set-1', releaseId, name: 'Base Set' }];

      mockPrisma.set.findMany.mockResolvedValue(sets);

      const result = await getReleaseSets(releaseId);

      expect(result).toEqual(sets);
      expect(mockPrisma.set.findMany).toHaveBeenCalledWith({
        where: { releaseId },
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getSet', () => {
    it('returns single set with release info', async () => {
      const set = {
        id: 'set-1',
        name: 'Base Set',
        release: { name: 'Prizm', manufacturer: { name: 'Panini' } },
      };

      mockPrisma.set.findUnique.mockResolvedValue(set);

      const result = await getSet('set-1');

      expect(result).toEqual(set);
    });
  });

  describe('getSetCards', () => {
    it('returns cards for specific set', async () => {
      const setId = 'set-1';
      const cards = [
        { id: 'card-1', playerName: 'LeBron', setId },
        { id: 'card-2', playerName: 'Curry', setId },
      ];

      mockPrisma.card.findMany.mockResolvedValue(cards);

      const result = await getSetCards(setId);

      expect(result).toEqual(cards);
      expect(mockPrisma.card.findMany).toHaveBeenCalledWith({
        where: { setId },
        include: expect.any(Object),
        orderBy: { cardNumber: 'asc' },
      });
    });
  });

  describe('releaseExists', () => {
    it('returns true when release exists', async () => {
      mockPrisma.release.findFirst.mockResolvedValue({ id: 'rel-1' });

      const result = await releaseExists('mfr-1', 'Prizm', '2024-25');

      expect(result).toBe(true);
    });

    it('returns false when release does not exist', async () => {
      mockPrisma.release.findFirst.mockResolvedValue(null);

      const result = await releaseExists('mfr-1', 'Unknown', '2024-25');

      expect(result).toBe(false);
    });

    it('performs case-insensitive search', async () => {
      mockPrisma.release.findFirst.mockResolvedValue(null);

      await releaseExists('mfr-1', 'PRIZM', '2024-25');

      expect(mockPrisma.release.findFirst).toHaveBeenCalledWith({
        where: {
          manufacturerId: 'mfr-1',
          name: {
            equals: 'PRIZM',
            mode: 'insensitive',
          },
          year: '2024-25',
        },
      });
    });
  });

  describe('findExistingRelease', () => {
    it('returns release with manufacturer when found', async () => {
      const release = {
        id: 'rel-1',
        name: 'Prizm',
        manufacturer: { id: 'mfr-1', name: 'Panini' },
      };

      mockPrisma.release.findFirst.mockResolvedValue(release);

      const result = await findExistingRelease('mfr-1', 'Prizm', '2024-25');

      expect(result).toEqual(release);
    });

    it('returns null when release not found', async () => {
      mockPrisma.release.findFirst.mockResolvedValue(null);

      const result = await findExistingRelease('mfr-1', 'Unknown');

      expect(result).toBeNull();
    });
  });

  describe('findReleaseBySlug', () => {
    it('returns release with manufacturer and set count', async () => {
      const release = {
        id: 'rel-1',
        slug: '2024-25-panini-prizm',
        manufacturer: { name: 'Panini' },
        _count: { sets: 5 },
      };

      mockPrisma.release.findUnique.mockResolvedValue(release);

      const result = await findReleaseBySlug('2024-25-panini-prizm');

      expect(result).toEqual(release);
      expect(mockPrisma.release.findUnique).toHaveBeenCalledWith({
        where: { slug: '2024-25-panini-prizm' },
        include: expect.objectContaining({
          manufacturer: true,
          _count: expect.any(Object),
        }),
      });
    });
  });

  describe('setExists', () => {
    it('returns true when set exists', async () => {
      mockPrisma.set.findFirst.mockResolvedValue({ id: 'set-1' });

      const result = await setExists('rel-1', 'Base Set');

      expect(result).toBe(true);
    });

    it('returns false when set does not exist', async () => {
      mockPrisma.set.findFirst.mockResolvedValue(null);

      const result = await setExists('rel-1', 'Unknown Set');

      expect(result).toBe(false);
    });
  });

  describe('getLibraryStats', () => {
    it('returns all counts', async () => {
      mockPrisma.manufacturer.count.mockResolvedValue(5);
      mockPrisma.release.count.mockResolvedValue(20);
      mockPrisma.set.count.mockResolvedValue(100);
      mockPrisma.card.count.mockResolvedValue(5000);

      const result = await getLibraryStats();

      expect(result).toEqual({
        manufacturers: 5,
        releases: 20,
        sets: 100,
        cards: 5000,
      });
    });

    it('runs counts in parallel', async () => {
      mockPrisma.manufacturer.count.mockResolvedValue(0);
      mockPrisma.release.count.mockResolvedValue(0);
      mockPrisma.set.count.mockResolvedValue(0);
      mockPrisma.card.count.mockResolvedValue(0);

      await getLibraryStats();

      expect(mockPrisma.manufacturer.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.release.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.set.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.card.count).toHaveBeenCalledTimes(1);
    });
  });
});
