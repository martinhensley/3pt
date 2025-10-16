interface Post {
  title: string;
  excerpt: string;
  content: string;
  type: string;
}

interface ExtractedKeywords {
  primaryQuery: string;
  autographQuery: string;
  relatedQuery: string;
  playerName: string | null;
  teamName: string | null;
}

// Common soccer teams and leagues
const TEAMS = [
  'USWNT', 'USMNT', 'Barcelona', 'Real Madrid', 'Manchester United', 'Manchester City',
  'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham', 'PSG', 'Bayern Munich', 'Juventus',
  'Inter Milan', 'AC Milan', 'Atletico Madrid', 'Borussia Dortmund', 'Ajax', 'Porto',
  'Benfica', 'Celtic', 'Rangers', 'LA Galaxy', 'LAFC', 'Atlanta United', 'Seattle Sounders',
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS', 'Champions League',
  'World Cup', 'UEFA', 'FIFA'
];

// Common card brands and series
const BRANDS = [
  'Topps', 'Panini', 'Prizm', 'Select', 'Donruss', 'Chrome', 'Mosaic', 'Immaculate',
  'National Treasures', 'Flawless', 'Noir', 'Optic', 'Certified', 'Revolution',
  'Signature Series', 'Autograph', 'Rookie', 'Patch', 'Relic', 'Jersey'
];

/**
 * Extract player name from title
 * Looks for capitalized names (first and last name patterns)
 */
function extractPlayerName(title: string): string | null {
  // Remove common prefixes and suffixes
  const cleanTitle = title
    .replace(/\b(Card|Cards|Autograph|Autographed|Signature|Series|Review|Analysis|Spotlight|Shines|Limited|Edition)\b/gi, '')
    .trim();

  // Match pattern: FirstName LastName (capitalized words)
  const nameMatch = cleanTitle.match(/\b([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)\s+([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)\b/);

  if (nameMatch) {
    return `${nameMatch[1]} ${nameMatch[2]}`;
  }

  return null;
}

/**
 * Extract team name from text
 */
function extractTeamName(text: string): string | null {
  const upperText = text.toUpperCase();

  for (const team of TEAMS) {
    if (upperText.includes(team.toUpperCase())) {
      return team;
    }
  }

  return null;
}

/**
 * Extract card brand or series from text
 */
function extractBrand(text: string): string | null {
  const upperText = text.toUpperCase();

  for (const brand of BRANDS) {
    if (upperText.includes(brand.toUpperCase())) {
      return brand;
    }
  }

  return null;
}

/**
 * Main keyword extraction function
 * Analyzes post content and generates targeted eBay search queries
 */
export function extractKeywordsFromPost(post: Post): ExtractedKeywords {
  const { title, excerpt, type } = post;

  // Extract entities
  const playerName = extractPlayerName(title);
  const teamName = extractTeamName(title + ' ' + excerpt);
  const brand = extractBrand(title + ' ' + excerpt);

  // Generate queries based on what we found
  let primaryQuery = 'soccer cards';
  let autographQuery = 'soccer autographs';
  let relatedQuery = 'soccer cards';

  // Priority 1: Player-specific queries
  if (playerName) {
    primaryQuery = `${playerName} soccer cards`;
    autographQuery = `${playerName} autograph`;
    relatedQuery = teamName
      ? `${teamName} ${playerName} cards`
      : `${playerName} rookie cards`;
  }
  // Priority 2: Brand/Series queries
  else if (brand && type === 'SET') {
    primaryQuery = `${brand} soccer cards`;
    autographQuery = `${brand} autographs`;
    relatedQuery = `${brand} soccer`;
  }
  // Priority 3: Team-based queries
  else if (teamName) {
    primaryQuery = `${teamName} soccer cards`;
    autographQuery = `${teamName} autographs`;
    relatedQuery = `${teamName} memorabilia`;
  }

  return {
    primaryQuery,
    autographQuery,
    relatedQuery,
    playerName,
    teamName,
  };
}

/**
 * Get a descriptive title for the ad based on the query
 */
export function getAdTitle(query: string, defaultTitle: string): string {
  // If query contains a player name or specific term, use it
  if (query !== 'soccer cards' && query !== 'soccer autographs') {
    const words = query.split(' ');
    if (words.length >= 2) {
      // Capitalize first letter of each word
      const capitalizedWords = words
        .filter(w => !['soccer', 'cards', 'card', 'the'].includes(w.toLowerCase()))
        .map(w => w.charAt(0).toUpperCase() + w.slice(1));

      if (capitalizedWords.length > 0) {
        return capitalizedWords.join(' ') + ' Cards';
      }
    }
  }

  return defaultTitle;
}
