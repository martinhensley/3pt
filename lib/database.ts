import { prisma } from "@/lib/prisma";
import type { Manufacturer, Release, Set, Card } from "@prisma/client";

/**
 * Get or create manufacturer by name (case-insensitive)
 */
export async function getOrCreateManufacturer(
  name: string
): Promise<Manufacturer> {
  // First try to find existing manufacturer (case-insensitive)
  const existing = await prisma.manufacturer.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    return existing;
  }

  // Create new manufacturer if not found
  return await prisma.manufacturer.create({
    data: { name },
  });
}

/**
 * Create a release with its sets
 */
export async function createReleaseWithSets(
  manufacturerId: string,
  releaseData: {
    name: string;
    year?: string;
    slug: string;
    summary?: string;
    releaseDate?: Date | null;
  },
  sets?: Array<{
    name: string;
    expectedCardCount?: number;
    parallels?: string[];
  }>
): Promise<Release & { sets: Set[]; manufacturer: Manufacturer }> {
  return await prisma.release.create({
    data: {
      name: releaseData.name,
      year: releaseData.year,
      slug: releaseData.slug,
      summary: releaseData.summary,
      releaseDate: releaseData.releaseDate,
      manufacturerId,
      sets: sets
        ? {
            create: sets.map(set => ({
              name: set.name,
              expectedCardCount: set.expectedCardCount,
              parallels: set.parallels || [],
            })),
          }
        : undefined,
    },
    include: {
      sets: true,
      manufacturer: true,
    },
  });
}

/**
 * Add a set to an existing release
 */
export async function addSetToRelease(
  releaseId: string,
  setData: {
    name: string;
    expectedCardCount?: number;
  }
): Promise<Set> {
  return await prisma.set.create({
    data: {
      ...setData,
      releaseId,
    },
  });
}

/**
 * Add cards to a set
 *
 * IMPORTANT: This function automatically creates cards for ALL parallels defined in the set.
 * When a set has parallels (e.g., ["Gold", "Silver", "Bronze"]), this function will:
 * 1. Create base cards (parallelType = "Base")
 * 2. Create parallel cards for each parallel type defined in set.parallels
 *
 * Example: If checklist has 200 cards and set has 14 parallels:
 * - Creates 200 base cards (parallelType = "Base")
 * - Creates 200 × 14 = 2,800 parallel cards
 * - Total: 3,000 cards
 */
export async function addCardsToSet(
  setId: string,
  cards: Array<{
    playerName?: string;
    team?: string;
    cardNumber?: string;
    variant?: string;
  }>
): Promise<{ count: number; breakdown: { base: number; parallels: number } }> {
  // Get the set with release info to generate slugs
  const set = await prisma.set.findUnique({
    where: { id: setId },
    select: {
      name: true,
      parallels: true,
      release: {
        select: {
          name: true,
          year: true,
          manufacturer: {
            select: {
              name: true
            }
          }
        }
      }
    },
  });

  if (!set) {
    throw new Error(`Set with id ${setId} not found`);
  }

  // Extract parallels array from Json type
  const parallelsArray = (set?.parallels as string[] | null) || [];
  const parallels = parallelsArray.filter((p): p is string => p !== null);

  // Import slug generator
  const { generateCardSlug } = await import('./slugGenerator');

  // Create base cards
  const baseResult = await prisma.card.createMany({
    data: cards.map((card) => {
      const slug = generateCardSlug(
        set.release.manufacturer.name,
        set.release.name,
        set.release.year || '',
        set.name,
        card.cardNumber || '',
        card.playerName || '',
        null // Base cards have no variant
      );

      return {
        ...card,
        setId,
        slug,
        parallelType: "Base", // Explicitly set as "Base" instead of null
      };
    }),
    skipDuplicates: true,
  });

  let parallelCount = 0;

  // Create parallel cards if set has parallels defined
  if (parallels.length > 0) {
    for (const parallel of parallels) {
      const parallelResult = await prisma.card.createMany({
        data: cards.map((card) => {
          const slug = generateCardSlug(
            set.release.manufacturer.name,
            set.release.name,
            set.release.year || '',
            set.name,
            card.cardNumber || '',
            card.playerName || '',
            parallel
          );

          return {
            ...card,
            setId,
            slug,
            parallelType: parallel,
          };
        }),
        skipDuplicates: true,
      });
      parallelCount += parallelResult.count;
    }
  }

  const totalCount = baseResult.count + parallelCount;

  console.log(`Created ${totalCount} total cards: ${baseResult.count} base + ${parallelCount} parallel cards`);

  return {
    count: totalCount,
    breakdown: {
      base: baseResult.count,
      parallels: parallelCount,
    }
  };
}

/**
 * Create a single card in a set
 */
export async function createCard(
  setId: string,
  cardData: {
    playerName?: string;
    team?: string;
    cardNumber?: string;
    variant?: string;
  }
): Promise<Card> {
  return await prisma.card.create({
    data: {
      ...cardData,
      setId,
    },
  });
}

/**
 * Get all manufacturers with their releases
 */
export async function getAllManufacturers() {
  return await prisma.manufacturer.findMany({
    include: {
      releases: {
        include: {
          sets: {
            include: {
              _count: {
                select: { cards: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get all releases with manufacturer and sets
 */
export async function getAllReleases() {
  return await prisma.release.findMany({
    include: {
      manufacturer: true,
      sets: {
        include: {
          _count: {
            select: { cards: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get releases for a specific manufacturer
 */
export async function getManufacturerReleases(manufacturerId: string) {
  return await prisma.release.findMany({
    where: { manufacturerId },
    include: {
      manufacturer: true,
      sets: {
        include: {
          _count: {
            select: { cards: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a single release with all its sets and manufacturer
 */
export async function getRelease(releaseId: string) {
  return await prisma.release.findUnique({
    where: { id: releaseId },
    include: {
      manufacturer: true,
      sets: {
        include: {
          _count: {
            select: { cards: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });
}

/**
 * Get sets for a specific release
 */
export async function getReleaseSets(releaseId: string) {
  return await prisma.set.findMany({
    where: { releaseId },
    include: {
      release: {
        include: {
          manufacturer: true,
        },
      },
      _count: {
        select: { cards: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get a single set with release and manufacturer info
 */
export async function getSet(setId: string) {
  return await prisma.set.findUnique({
    where: { id: setId },
    include: {
      release: {
        include: {
          manufacturer: true,
        },
      },
      _count: {
        select: { cards: true },
      },
    },
  });
}

/**
 * Get cards for a specific set
 */
export async function getSetCards(setId: string) {
  return await prisma.card.findMany({
    where: { setId },
    include: {
      set: {
        include: {
          release: {
            include: {
              manufacturer: true,
            },
          },
        },
      },
    },
    orderBy: { cardNumber: "asc" },
  });
}

/**
 * Check if a release already exists for a manufacturer
 */
export async function releaseExists(
  manufacturerId: string,
  releaseName: string,
  year?: string
): Promise<boolean> {
  const existing = await prisma.release.findFirst({
    where: {
      manufacturerId,
      name: {
        equals: releaseName,
        mode: "insensitive",
      },
      year: year || undefined,
    },
  });

  return !!existing;
}

/**
 * Find an existing release by manufacturer, name, and year
 * Returns the release object with manufacturer relation if found, null otherwise
 */
export async function findExistingRelease(
  manufacturerId: string,
  releaseName: string,
  year?: string
): Promise<(Release & { manufacturer: Manufacturer }) | null> {
  return await prisma.release.findFirst({
    where: {
      manufacturerId,
      name: {
        equals: releaseName,
        mode: "insensitive",
      },
      year: year || undefined,
    },
    include: {
      manufacturer: true,
    },
  });
}

/**
 * Find an existing release by slug
 * Returns the release object with manufacturer relation if found, null otherwise
 */
export async function findReleaseBySlug(
  slug: string
): Promise<(Release & { manufacturer: Manufacturer; _count: { sets: number; } }) | null> {
  return await prisma.release.findUnique({
    where: { slug },
    include: {
      manufacturer: true,
      _count: {
        select: { sets: true },
      },
    },
  });
}

/**
 * Check if a set already exists in a release
 */
export async function setExists(
  releaseId: string,
  setName: string
): Promise<boolean> {
  const existing = await prisma.set.findFirst({
    where: {
      releaseId,
      name: {
        equals: setName,
        mode: "insensitive",
      },
    },
  });

  return !!existing;
}

/**
 * Get library statistics
 */
export async function getLibraryStats() {
  const [manufacturerCount, releaseCount, setCount, cardCount, uniquePlayers] =
    await Promise.all([
      prisma.manufacturer.count(),
      prisma.release.count(),
      prisma.set.count(),
      prisma.card.count(),
      prisma.card.findMany({
        where: { playerName: { not: null } },
        select: { playerName: true },
        distinct: ["playerName"],
      }),
    ]);

  return {
    manufacturers: manufacturerCount,
    releases: releaseCount,
    sets: setCount,
    cards: cardCount,
    players: uniquePlayers.length,
  };
}
