/**
 * Integration tests for /api/admin/cards
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSession,
  createMockRequest,
  testData,
} from './test-utils';

// Use vi.hoisted to define mocks that are hoisted with vi.mock
const { mockPrisma, mockGetServerSession, mockUploadCardFrontBack, mockCompressCardImages } = vi.hoisted(() => {
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
    mockUploadCardFrontBack: vi.fn(),
    mockCompressCardImages: vi.fn(),
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

vi.mock('@/lib/utils/blob-upload', () => ({
  uploadCardFrontBack: mockUploadCardFrontBack,
}));

vi.mock('@/lib/utils/image-compression', () => ({
  compressCardImages: mockCompressCardImages,
}));

vi.mock('@/lib/slugGenerator', () => ({
  generateCardSlug: vi.fn(() => 'test-card-slug'),
}));

// Import after mocking
import { POST } from '@/app/api/admin/cards/route';

describe('/api/admin/cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    const mockSetWithRelease = {
      ...testData.set,
      release: {
        ...testData.release,
        manufacturer: testData.manufacturer,
      },
    };

    it('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: { setId: 'set-test-id', playerName: 'LeBron James' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when setId is missing', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: { playerName: 'LeBron James' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('setId is required');
    });

    it('returns 404 when set not found', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: { setId: 'non-existent-set' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Set not found');
    });

    it('creates card successfully without images', async () => {
      const mockNewCard = {
        ...testData.card,
        set: mockSetWithRelease,
      };

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockResolvedValue(mockNewCard);

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'LeBron James',
          team: 'Los Angeles Lakers',
          cardNumber: '1',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.card).toBeDefined();
      expect(mockPrisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            setId: 'set-test-id',
            playerName: 'LeBron James',
            team: 'Los Angeles Lakers',
            cardNumber: '1',
          }),
        })
      );
    });

    it('creates card with all optional fields', async () => {
      const mockNewCard = {
        ...testData.card,
        variant: 'Gold',
        parallelType: 'Gold Parallel',
        printRun: 25,
        isNumbered: true,
        hasAutograph: true,
        hasMemorabilia: false,
        set: mockSetWithRelease,
      };

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockResolvedValue(mockNewCard);

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'LeBron James',
          team: 'Los Angeles Lakers',
          cardNumber: '1',
          variant: 'Gold',
          parallelType: 'Gold Parallel',
          serialNumber: '12',
          isNumbered: true,
          printRun: 25,
          numbered: '12/25',
          rarity: 'Rare',
          finish: 'Glossy',
          hasAutograph: true,
          hasMemorabilia: false,
          colorVariant: 'Gold',
          notes: 'Test card',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variant: 'Gold',
            parallelType: 'Gold Parallel',
            printRun: 25,
            isNumbered: true,
            hasAutograph: true,
            hasMemorabilia: false,
          }),
        })
      );
    });

    it('creates card with front and back images', async () => {
      const mockNewCard = {
        ...testData.card,
        imageFront: null,
        imageBack: null,
        set: mockSetWithRelease,
      };

      const mockUpdatedCard = {
        ...mockNewCard,
        imageFront: 'https://blob.vercel.com/front.jpg',
        imageBack: 'https://blob.vercel.com/back.jpg',
      };

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockResolvedValue(mockNewCard);
      mockPrisma.card.update.mockResolvedValue(mockUpdatedCard);
      mockCompressCardImages.mockResolvedValue({
        front: 'compressed-front-data',
        back: 'compressed-back-data',
      });
      mockUploadCardFrontBack.mockResolvedValue({
        front: 'https://blob.vercel.com/front.jpg',
        back: 'https://blob.vercel.com/back.jpg',
      });

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'LeBron James',
          cardNumber: '1',
          imageFront: 'base64-front-image',
          imageBack: 'base64-back-image',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCompressCardImages).toHaveBeenCalledWith(
        'base64-front-image',
        'base64-back-image',
        { mode: 'standard' }
      );
      expect(mockUploadCardFrontBack).toHaveBeenCalledWith(
        mockNewCard.id,
        'compressed-front-data',
        'compressed-back-data'
      );
      expect(mockPrisma.card.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockNewCard.id },
          data: {
            imageFront: 'https://blob.vercel.com/front.jpg',
            imageBack: 'https://blob.vercel.com/back.jpg',
          },
        })
      );
    });

    it('creates card with only front image', async () => {
      const mockNewCard = {
        ...testData.card,
        imageFront: null,
        imageBack: null,
        set: mockSetWithRelease,
      };

      const mockUpdatedCard = {
        ...mockNewCard,
        imageFront: 'https://blob.vercel.com/front.jpg',
      };

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockResolvedValue(mockNewCard);
      mockPrisma.card.update.mockResolvedValue(mockUpdatedCard);
      mockCompressCardImages.mockResolvedValue({
        front: 'compressed-front-data',
      });
      mockUploadCardFrontBack.mockResolvedValue({
        front: 'https://blob.vercel.com/front.jpg',
      });

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'LeBron James',
          cardNumber: '1',
          imageFront: 'base64-front-image',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCompressCardImages).toHaveBeenCalledWith(
        'base64-front-image',
        undefined,
        { mode: 'standard' }
      );
    });

    it('creates card with only back image', async () => {
      const mockNewCard = {
        ...testData.card,
        imageFront: null,
        imageBack: null,
        set: mockSetWithRelease,
      };

      const mockUpdatedCard = {
        ...mockNewCard,
        imageBack: 'https://blob.vercel.com/back.jpg',
      };

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockResolvedValue(mockNewCard);
      mockPrisma.card.update.mockResolvedValue(mockUpdatedCard);
      mockCompressCardImages.mockResolvedValue({
        back: 'compressed-back-data',
      });
      mockUploadCardFrontBack.mockResolvedValue({
        back: 'https://blob.vercel.com/back.jpg',
      });

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'LeBron James',
          cardNumber: '1',
          imageBack: 'base64-back-image',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCompressCardImages).toHaveBeenCalledWith(
        undefined,
        'base64-back-image',
        { mode: 'standard' }
      );
    });

    it('returns 500 when database error occurs', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'LeBron James',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create card');
      expect(data.message).toBe('Database error');
    });

    it('returns 500 when image upload fails', async () => {
      const mockNewCard = {
        ...testData.card,
        set: mockSetWithRelease,
      };

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockResolvedValue(mockNewCard);
      mockCompressCardImages.mockRejectedValue(new Error('Image compression failed'));

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'LeBron James',
          imageFront: 'invalid-image-data',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create card');
    });

    it('handles boolean field conversion correctly', async () => {
      const mockNewCard = {
        ...testData.card,
        isNumbered: true,
        hasAutograph: false,
        hasMemorabilia: true,
        set: mockSetWithRelease,
      };

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.set.findUnique.mockResolvedValue(mockSetWithRelease);
      mockPrisma.card.create.mockResolvedValue(mockNewCard);

      const request = createMockRequest('POST', '/api/admin/cards', {
        body: {
          setId: 'set-test-id',
          playerName: 'Test Player',
          isNumbered: 'true', // String should be converted to boolean
          hasAutograph: false,
          hasMemorabilia: 1, // Truthy value should become true
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isNumbered: true,
            hasAutograph: false,
            hasMemorabilia: true,
          }),
        })
      );
    });
  });
});
