/**
 * Context-Aware eBay Query Builder
 * Generates targeted search queries based on card, set, release, or post context
 */

import { normalizePlayerName } from './playerNames';

export interface EbayQueries {
  primary: string;
  autograph: string;
  related: string;
  primaryTitle: string;
  autographTitle: string;
  relatedTitle: string;
}

// Type definitions for the data we'll receive
interface CardWithRelations {
  playerName?: string | null;
  team?: string | null;
  hasAutograph?: boolean;
  hasMemorabilia?: boolean;
  parallelType?: string | null;
  colorVariant?: string | null;
  printRun?: number | null;
  specialFeatures?: string[];
  set?: {
    name: string;
    type: string;
    release?: {
      name: string;
      year?: string | null;
      manufacturer?: {
        name: string;
      };
    };
  };
}

interface SetWithRelations {
  name: string;
  type: string;
  isParallel?: boolean;
  printRun?: number | null;
  release?: {
    name: string;
    year?: string | null;
    manufacturer?: {
      name: string;
    };
  };
}

interface ReleaseWithRelations {
  name: string;
  year?: string | null;
  manufacturer?: {
    name: string;
  };
}

interface PostWithRelations {
  title: string;
  content?: string;
  excerpt?: string;
  type?: string;
  release?: {
    name: string;
    year?: string | null;
  };
  set?: {
    name: string;
  };
  card?: {
    playerName?: string | null;
  };
}

/**
 * Build eBay queries for a specific card page
 * Prioritizes player name, then set/release context
 */
export function buildCardQueries(card: CardWithRelations): EbayQueries {
  const playerName = card.playerName ? normalizePlayerName(card.playerName) : null;
  const year = card.set?.release?.year || '';
  const manufacturer = card.set?.release?.manufacturer?.name || '';
  const release = card.set?.release?.name || '';
  const team = card.team || '';
  const setType = card.set?.type || '';

  // Primary query: Player + Year + Manufacturer + Release
  let primary = '';
  let primaryTitle = 'Basketball Cards';

  if (playerName) {
    primary = `${playerName}`;
    if (year) primary += ` ${year}`;
    if (manufacturer) primary += ` ${manufacturer}`;
    if (release) primary += ` ${release}`;
    primary += ' basketball cards';
    primaryTitle = `${playerName} Cards`;
  } else if (release && manufacturer) {
    primary = `${year} ${manufacturer} ${release} basketball cards`.trim();
    primaryTitle = `${release} Cards`;
  } else {
    primary = 'basketball cards';
  }

  // Autograph query: Player-specific autographs or general
  let autograph = '';
  let autographTitle = 'Autographs';

  if (playerName) {
    autograph = `${playerName} autograph basketball cards`;
    autographTitle = `${playerName} Autos`;
  } else if (card.hasAutograph && manufacturer) {
    autograph = `${year} ${manufacturer} autograph basketball cards`.trim();
  } else {
    autograph = 'basketball autograph cards';
  }

  // Related query: Team + Player or Manufacturer + Release
  let related = '';
  let relatedTitle = 'Related Cards';

  if (playerName && team) {
    related = `${team} ${playerName} basketball cards`;
    relatedTitle = `${team} Cards`;
  } else if (playerName) {
    related = `${playerName} basketball memorabilia cards`;
    relatedTitle = 'Memorabilia';
  } else if (manufacturer && release) {
    related = `${manufacturer} ${release} basketball cards`;
    relatedTitle = `${manufacturer} Cards`;
  } else {
    related = 'NBA basketball cards';
  }

  return {
    primary: primary.trim(),
    autograph: autograph.trim(),
    related: related.trim(),
    primaryTitle,
    autographTitle,
    relatedTitle,
  };
}

/**
 * Build eBay queries for a set page
 * Focuses on release + set type context
 */
export function buildSetQueries(set: SetWithRelations): EbayQueries {
  const year = set.release?.year || '';
  const manufacturer = set.release?.manufacturer?.name || '';
  const release = set.release?.name || '';
  const setName = set.name;
  const setType = set.type;

  // Primary query: Year + Manufacturer + Release + Set Type
  let primary = '';
  let primaryTitle = 'Basketball Cards';

  if (year && manufacturer && release) {
    primary = `${year} ${manufacturer} ${release}`;
    if (setType === 'Autograph') {
      primary += ' autographs';
    } else if (setType === 'Memorabilia') {
      primary += ' memorabilia';
    } else if (setType === 'Insert') {
      primary += ' inserts';
    } else {
      primary += ` ${setName}`;
    }
    primary += ' basketball cards';
    primaryTitle = `${release} ${setType}s`;
  } else if (manufacturer && release) {
    primary = `${manufacturer} ${release} basketball cards`;
    primaryTitle = `${release} Cards`;
  } else {
    primary = 'basketball cards';
  }

  // Autograph query: Release-specific autographs
  let autograph = '';
  let autographTitle = 'Autographs';

  if (setType === 'Autograph' && manufacturer) {
    autograph = `${year} ${manufacturer} autograph basketball cards`.trim();
    autographTitle = `${manufacturer} Autos`;
  } else if (year && manufacturer) {
    autograph = `${year} ${manufacturer} autograph basketball cards`.trim();
  } else {
    autograph = 'basketball autograph cards';
  }

  // Related query: Manufacturer + Release
  let related = '';
  let relatedTitle = 'Related Cards';

  if (manufacturer && release) {
    related = `${manufacturer} ${release} basketball cards`;
    relatedTitle = `${manufacturer} ${release}`;
  } else if (manufacturer) {
    related = `${manufacturer} basketball cards`;
    relatedTitle = `${manufacturer} Cards`;
  } else {
    related = 'NBA basketball cards';
  }

  return {
    primary: primary.trim(),
    autograph: autograph.trim(),
    related: related.trim(),
    primaryTitle,
    autographTitle,
    relatedTitle,
  };
}

/**
 * Build eBay queries for a release page
 * Focuses on year + manufacturer + release name
 */
export function buildReleaseQueries(release: ReleaseWithRelations): EbayQueries {
  const year = release.year || '';
  const manufacturer = release.manufacturer?.name || '';
  const releaseName = release.name;

  // Primary query: Year + Manufacturer + Release
  let primary = '';
  let primaryTitle = 'Basketball Cards';

  if (year && manufacturer && releaseName) {
    primary = `${year} ${manufacturer} ${releaseName} basketball cards`;
    primaryTitle = `${releaseName} Cards`;
  } else if (manufacturer && releaseName) {
    primary = `${manufacturer} ${releaseName} basketball cards`;
    primaryTitle = `${releaseName} Cards`;
  } else if (releaseName) {
    primary = `${releaseName} basketball cards`;
    primaryTitle = `${releaseName} Cards`;
  } else {
    primary = 'basketball cards';
  }

  // Autograph query: Release-specific autographs
  let autograph = '';
  let autographTitle = 'Autographs';

  if (year && manufacturer) {
    autograph = `${year} ${manufacturer} autograph basketball cards`;
    autographTitle = `${manufacturer} Autos`;
  } else if (manufacturer) {
    autograph = `${manufacturer} autograph basketball cards`;
  } else {
    autograph = 'basketball autograph cards';
  }

  // Related query: Manufacturer focus
  let related = '';
  let relatedTitle = 'Related Cards';

  if (manufacturer && year) {
    related = `${manufacturer} ${year} basketball cards`;
    relatedTitle = `${manufacturer} ${year}`;
  } else if (manufacturer) {
    related = `${manufacturer} basketball cards`;
    relatedTitle = `${manufacturer} Cards`;
  } else {
    related = 'NBA basketball cards';
  }

  return {
    primary: primary.trim(),
    autograph: autograph.trim(),
    related: related.trim(),
    primaryTitle,
    autographTitle,
    relatedTitle,
  };
}

/**
 * Build eBay queries for a post page
 * Extracts context from title, content, and related entities
 */
export function buildPostQueries(post: PostWithRelations): EbayQueries {
  // Try to extract player name from title
  const playerMatch = extractPlayerFromTitle(post.title);
  const playerName = playerMatch ? normalizePlayerName(playerMatch) : null;

  // Get context from related entities
  const relatedPlayer = post.card?.playerName ? normalizePlayerName(post.card.playerName) : null;
  const release = post.release?.name || '';
  const year = post.release?.year || '';
  const setName = post.set?.name || '';

  const finalPlayer = playerName || relatedPlayer;

  // Primary query: Player or release-focused
  let primary = '';
  let primaryTitle = 'Basketball Cards';

  if (finalPlayer) {
    primary = `${finalPlayer} basketball cards`;
    primaryTitle = `${finalPlayer} Cards`;
  } else if (release && year) {
    primary = `${year} ${release} basketball cards`;
    primaryTitle = `${release} Cards`;
  } else if (release) {
    primary = `${release} basketball cards`;
    primaryTitle = `${release} Cards`;
  } else {
    primary = 'basketball cards';
  }

  // Autograph query
  let autograph = '';
  let autographTitle = 'Autographs';

  if (finalPlayer) {
    autograph = `${finalPlayer} autograph basketball cards`;
    autographTitle = `${finalPlayer} Autos`;
  } else if (release) {
    autograph = `${release} autograph basketball cards`;
  } else {
    autograph = 'basketball autograph cards';
  }

  // Related query
  let related = '';
  let relatedTitle = 'Related Cards';

  if (finalPlayer) {
    related = `${finalPlayer} memorabilia basketball cards`;
    relatedTitle = 'Memorabilia';
  } else if (setName) {
    related = `${setName} basketball cards`;
    relatedTitle = `${setName} Cards`;
  } else {
    related = 'NBA basketball cards';
  }

  return {
    primary: primary.trim(),
    autograph: autograph.trim(),
    related: related.trim(),
    primaryTitle,
    autographTitle,
    relatedTitle,
  };
}

/**
 * Generic basketball card queries for listing pages
 */
export function buildGenericBasketballQueries(): EbayQueries {
  return {
    primary: 'basketball cards',
    autograph: 'basketball autograph cards',
    related: 'NBA basketball cards',
    primaryTitle: 'Basketball Cards',
    autographTitle: 'Autographs',
    relatedTitle: 'NBA Cards',
  };
}

/**
 * Extract player name from title using common patterns
 * Looks for capitalized First Last patterns
 */
function extractPlayerFromTitle(title: string): string | null {
  // Pattern: Capitalized First Last (e.g., "LeBron James", "Michael Jordan")
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/;
  const match = title.match(namePattern);
  return match ? match[1] : null;
}
