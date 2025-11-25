/**
 * Tests for /api/admin/smart-match route
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession, createMockRequest } from './test-utils';

// Use vi.hoisted to define mocks
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

// Import after mocking
import { POST } from '@/app/api/admin/smart-match/route';

describe('/api/admin/smart-match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCards = [
    {
      id: 'card-1',
      playerName: 'LeBron James',
      cardNumber: '1',
      team: 'Los Angeles Lakers',
      parallelType: 'Base',
      variant: null,
      imageFront: null,
      imageBack: null,
    },
    {
      id: 'card-2',
      playerName: 'Stephen Curry',
      cardNumber: '2',
      team: 'Golden State Warriors',
      parallelType: 'Base',
      variant: null,
      imageFront: null,
      imageBack: null,
    },
    {
      id: 'card-3',
      playerName: 'LeBron James',
      cardNumber: '1',
      team: 'Los Angeles Lakers',
      parallelType: 'Gold',
      variant: 'Gold /10',
      imageFront: null,
      imageBack: null,
    },
  ];

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: { playerName: 'LeBron James', cardNumber: '1' },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('validation', () => {
    it('returns 400 when setId is missing', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          scannedData: { playerName: 'LeBron', cardNumber: '1' },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('returns 400 when playerName is missing', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: { cardNumber: '1' },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('returns 400 when cardNumber is missing', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: { playerName: 'LeBron' },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });
  });

  describe('matching', () => {
    it('returns best match when cards found in set', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'LeBron James',
            cardNumber: '1',
            team: 'Los Angeles Lakers',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bestMatch).toBeDefined();
      expect(data.bestMatch.card.playerName).toBe('LeBron James');
      expect(data.bestMatch.card.cardNumber).toBe('1');
    });

    it('returns error when no cards in set', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue([]);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: { playerName: 'Test', cardNumber: '1' },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No cards found');
    });

    it('returns confidence level for best match', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'LeBron James',
            cardNumber: '1',
            team: 'Los Angeles Lakers',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.bestMatch.confidence).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(data.bestMatch.confidence);
      expect(data.bestMatch.percentage).toBeDefined();
      expect(data.bestMatch.percentage).toBeGreaterThanOrEqual(0);
      expect(data.bestMatch.percentage).toBeLessThanOrEqual(100);
    });

    it('returns top 5 matches', async () => {
      const manyCards = Array.from({ length: 10 }, (_, i) => ({
        id: `card-${i}`,
        playerName: `Player ${i}`,
        cardNumber: String(i + 1),
        team: 'Team',
        parallelType: 'Base',
        variant: null,
        imageFront: null,
        imageBack: null,
      }));

      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(manyCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: { playerName: 'Player 5', cardNumber: '5' },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.topMatches).toHaveLength(5);
      expect(data.totalCandidates).toBe(10);
    });

    it('returns breakdown of scoring components', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'LeBron James',
            cardNumber: '1',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.bestMatch.breakdown).toBeDefined();
      expect(data.bestMatch.breakdown.playerName).toBeDefined();
      expect(data.bestMatch.breakdown.cardNumber).toBeDefined();
      expect(data.bestMatch.breakdown.team).toBeDefined();
      expect(data.bestMatch.breakdown.parallel).toBeDefined();
    });
  });

  describe('scoring behavior', () => {
    it('gives high score for exact player name match', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'LeBron James',
            cardNumber: '1',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Exact match should give 100 points for player name
      expect(data.bestMatch.breakdown.playerName).toBe(100);
    });

    it('gives high score for exact card number match', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'LeBron James',
            cardNumber: '1',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Exact match should give 30 points for card number
      expect(data.bestMatch.breakdown.cardNumber).toBe(30);
    });

    it('gives high score for exact team match', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'LeBron James',
            cardNumber: '1',
            team: 'Los Angeles Lakers',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Exact match should give 20 points for team
      expect(data.bestMatch.breakdown.team).toBe(20);
    });

    it('prefers matching parallel type when specified', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'LeBron James',
            cardNumber: '1',
            parallelType: 'Gold',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should match the Gold parallel card
      expect(data.bestMatch.card.parallelType).toBe('Gold');
    });

    it('handles fuzzy player name matching', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'Lebron', // Missing 'James', different case
            cardNumber: '1',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still find LeBron James with partial match
      expect(data.bestMatch.card.playerName).toBe('LeBron James');
      // Partial match should give less than 100 points
      expect(data.bestMatch.breakdown.playerName).toBeLessThan(100);
      expect(data.bestMatch.breakdown.playerName).toBeGreaterThan(0);
    });

    it('matches last name when only last name provided', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockResolvedValue(mockCards);

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: {
            playerName: 'Curry',
            cardNumber: '2',
          },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.bestMatch.card.playerName).toBe('Stephen Curry');
    });
  });

  describe('error handling', () => {
    it('returns 500 when database error occurs', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession());
      mockPrisma.card.findMany.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('POST', '/api/admin/smart-match', {
        body: {
          setId: 'set-1',
          scannedData: { playerName: 'Test', cardNumber: '1' },
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to match card');
    });
  });
});
