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
  },
  sets?: Array<{
    name: string;
    totalCards?: string;
  }>
): Promise<Release & { sets: Set[]; manufacturer: Manufacturer }> {
  return await prisma.release.create({
    data: {
      name: releaseData.name,
      year: releaseData.year,
      manufacturerId,
      sets: sets
        ? {
            create: sets,
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
    totalCards?: string;
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
 */
export async function addCardsToSet(
  setId: string,
  cards: Array<{
    playerName?: string;
    team?: string;
    cardNumber?: string;
    variant?: string;
  }>
): Promise<{ count: number }> {
  return await prisma.card.createMany({
    data: cards.map((card) => ({
      ...card,
      setId,
    })),
    skipDuplicates: true, // Skip if duplicate card numbers exist
  });
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
  const [manufacturerCount, releaseCount, setCount, cardCount] =
    await Promise.all([
      prisma.manufacturer.count(),
      prisma.release.count(),
      prisma.set.count(),
      prisma.card.count(),
    ]);

  return {
    manufacturers: manufacturerCount,
    releases: releaseCount,
    sets: setCount,
    cards: cardCount,
  };
}
