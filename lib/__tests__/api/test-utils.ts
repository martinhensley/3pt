/**
 * Test utilities for API route testing
 */
import { vi } from 'vitest';

// Mock Prisma client type
export interface MockPrismaClient {
  manufacturer: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  release: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  set: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  card: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  image: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  post: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
}

/**
 * Create a fresh mock Prisma client
 */
export function createMockPrismaClient(): MockPrismaClient {
  return {
    manufacturer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    release: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    set: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    card: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    image: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({} as MockPrismaClient)),
  };
}

/**
 * Create a mock NextAuth session
 */
export function createMockSession(overrides?: Record<string, unknown>) {
  return {
    user: {
      id: 'test-user-id',
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin',
      ...overrides?.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock Request object for API route testing
 */
export function createMockRequest(
  method: string,
  url: string,
  options?: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  }
): Request {
  const baseUrl = 'http://localhost:3000';
  const urlObj = new URL(url, baseUrl);

  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
  }

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  if (options?.body && method !== 'GET') {
    requestInit.body = JSON.stringify(options.body);
  }

  return new Request(urlObj.toString(), requestInit);
}

/**
 * Parse JSON response from API route
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

// Sample test data factories

export const testData = {
  manufacturer: {
    id: 'mfr-test-id',
    name: 'Panini',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  release: {
    id: 'rel-test-id',
    name: '2024-25 Panini Obsidian',
    slug: '2024-25-panini-obsidian',
    year: '2024-25',
    releaseDate: '2024-10-15',
    postDate: new Date('2024-10-15'),
    summary: 'High-end basketball release',
    sourceFiles: [],
    isApproved: true,
    manufacturerId: 'mfr-test-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  set: {
    id: 'set-test-id',
    name: 'Base',
    slug: '2024-25-panini-obsidian-base',
    type: 'Base' as const,
    expectedCardCount: 200,
    printRun: null,
    isParallel: false,
    description: 'Base set cards',
    notes: null,
    releaseId: 'rel-test-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  card: {
    id: 'card-test-id',
    slug: '2024-25-panini-obsidian-base-1-lebron-james',
    playerName: 'LeBron James',
    team: 'Los Angeles Lakers',
    cardNumber: '1',
    variant: null,
    parallelType: null,
    serialNumber: null,
    isNumbered: false,
    printRun: null,
    numbered: null,
    rarity: null,
    finish: null,
    hasAutograph: false,
    hasMemorabilia: false,
    colorVariant: null,
    notes: null,
    imageFront: null,
    imageBack: null,
    setId: 'set-test-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  createRelease(overrides?: Partial<typeof testData.release>) {
    return { ...this.release, ...overrides };
  },

  createSet(overrides?: Partial<typeof testData.set>) {
    return { ...this.set, ...overrides };
  },

  createCard(overrides?: Partial<typeof testData.card>) {
    return { ...this.card, ...overrides };
  },

  createManufacturer(overrides?: Partial<typeof testData.manufacturer>) {
    return { ...this.manufacturer, ...overrides };
  },
};
