/**
 * Integration tests for /api/releases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSession,
  createMockRequest,
  testData,
} from './test-utils';

// Use vi.hoisted to define mocks that are hoisted with vi.mock
const { mockPrisma, mockGetServerSession } = vi.hoisted(() => {
  const createMockPrismaModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
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
      image: { ...createMockPrismaModel(), deleteMany: vi.fn() },
      post: createMockPrismaModel(),
      $transaction: vi.fn((cb: unknown) => typeof cb === 'function' ? cb({}) : cb),
    },
    mockGetServerSession: vi.fn(),
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/formatters', () => ({
  parseReleaseDateToPostDate: vi.fn((date: string) => new Date(date)),
}));

// Import after mocking
import { GET, PUT, DELETE } from '@/app/api/releases/route';

describe('/api/releases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    describe('fetch by slug', () => {
      it('returns release when found by slug', async () => {
        const mockRelease = testData.createRelease({
          manufacturer: testData.manufacturer,
          images: [],
          sets: [],
          sourceDocuments: [],
        });

        mockPrisma.release.findUnique.mockResolvedValue(mockRelease);
        mockGetServerSession.mockResolvedValue(null);

        const request = createMockRequest('GET', '/api/releases', {
          searchParams: { slug: '2024-25-panini-obsidian' },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.slug).toBe('2024-25-panini-obsidian');
        expect(mockPrisma.release.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { slug: '2024-25-panini-obsidian' },
          })
        );
      });

      it('returns 404 when release not found by slug', async () => {
        mockPrisma.release.findUnique.mockResolvedValue(null);
        mockGetServerSession.mockResolvedValue(null);

        const request = createMockRequest('GET', '/api/releases', {
          searchParams: { slug: 'non-existent-release' },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Release not found');
      });
    });

    describe('fetch by id', () => {
      it('returns release when found by id', async () => {
        const mockRelease = testData.createRelease({
          manufacturer: testData.manufacturer,
          images: [],
          sets: [],
          sourceDocuments: [],
        });

        mockPrisma.release.findUnique.mockResolvedValue(mockRelease);
        mockGetServerSession.mockResolvedValue(null);

        const request = createMockRequest('GET', '/api/releases', {
          searchParams: { id: 'rel-test-id' },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.id).toBe('rel-test-id');
      });

      it('returns 404 when release not found by id', async () => {
        mockPrisma.release.findUnique.mockResolvedValue(null);
        mockGetServerSession.mockResolvedValue(null);

        const request = createMockRequest('GET', '/api/releases', {
          searchParams: { id: 'non-existent-id' },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Release not found');
      });
    });

    describe('fetch all releases', () => {
      it('returns all releases when no slug or id provided', async () => {
        const mockReleases = [
          testData.createRelease({ id: 'rel-1', name: 'Release 1', manufacturer: testData.manufacturer, images: [], sets: [] }),
          testData.createRelease({ id: 'rel-2', name: 'Release 2', manufacturer: testData.manufacturer, images: [], sets: [] }),
        ];

        mockPrisma.release.findMany.mockResolvedValue(mockReleases);
        mockGetServerSession.mockResolvedValue(null);

        const request = createMockRequest('GET', '/api/releases');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(2);
        expect(mockPrisma.release.findMany).toHaveBeenCalled();
      });

      it('returns empty array when no releases exist', async () => {
        mockPrisma.release.findMany.mockResolvedValue([]);
        mockGetServerSession.mockResolvedValue(null);

        const request = createMockRequest('GET', '/api/releases');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([]);
      });
    });

    describe('error handling', () => {
      it('returns 500 when database error occurs', async () => {
        mockPrisma.release.findMany.mockRejectedValue(new Error('Database error'));
        mockGetServerSession.mockResolvedValue(null);

        const request = createMockRequest('GET', '/api/releases');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch release');
      });
    });
  });

  describe('PUT', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('PUT', '/api/releases', {
        body: { id: 'rel-test-id', name: 'Updated Release' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when release ID is missing', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());

      const request = createMockRequest('PUT', '/api/releases', {
        body: { name: 'Updated Release' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Release ID is required');
    });

    it('updates release when authenticated with valid data', async () => {
      const mockUpdatedRelease = testData.createRelease({
        name: 'Updated Release Name',
        manufacturer: testData.manufacturer,
        images: [],
        sets: [],
      });

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.release.update.mockResolvedValue(mockUpdatedRelease);

      const request = createMockRequest('PUT', '/api/releases', {
        body: {
          id: 'rel-test-id',
          name: 'Updated Release Name',
          year: '2024-25',
          releaseDate: '2024-10-15',
          summary: 'Updated summary',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Release Name');
      expect(mockPrisma.release.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rel-test-id' },
        })
      );
    });

    it('handles createdAt auto-population from releaseDate', async () => {
      const mockUpdatedRelease = testData.createRelease({
        manufacturer: testData.manufacturer,
        images: [],
        sets: [],
      });

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.release.update.mockResolvedValue(mockUpdatedRelease);

      const request = createMockRequest('PUT', '/api/releases', {
        body: {
          id: 'rel-test-id',
          name: 'Test Release',
          releaseDate: '2024-10-15',
          // createdAt should be auto-populated from releaseDate at 4:20pm MT
        },
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.release.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdAt: expect.any(Date),
          }),
        })
      );
    });

    it('returns 500 when database error occurs during update', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.release.update.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('PUT', '/api/releases', {
        body: { id: 'rel-test-id', name: 'Updated Release' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update release');
    });
  });

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('DELETE', '/api/releases', {
        searchParams: { id: 'rel-test-id' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when release ID is missing', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());

      const request = createMockRequest('DELETE', '/api/releases');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Release ID is required');
    });

    it('deletes release when authenticated with valid ID', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.release.delete.mockResolvedValue(testData.release);

      const request = createMockRequest('DELETE', '/api/releases', {
        searchParams: { id: 'rel-test-id' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Release deleted successfully');
      expect(mockPrisma.release.delete).toHaveBeenCalledWith({
        where: { id: 'rel-test-id' },
      });
    });

    it('returns 500 when database error occurs during delete', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.release.delete.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('DELETE', '/api/releases', {
        searchParams: { id: 'rel-test-id' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete release');
    });
  });
});
