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

// NBA, WNBA, and College Basketball Teams and Leagues
const TEAMS = [
  // NBA Teams (30)
  'Lakers', 'Celtics', 'Warriors', 'Heat', 'Bulls', 'Knicks', 'Nets', 'Clippers',
  'Mavericks', 'Nuggets', 'Suns', 'Bucks', 'Sixers', '76ers', 'Raptors', 'Rockets',
  'Spurs', 'Thunder', 'Trail Blazers', 'Jazz', 'Grizzlies', 'Pelicans', 'Kings',
  'Hawks', 'Hornets', 'Wizards', 'Pistons', 'Pacers', 'Cavaliers', 'Timberwolves',
  'Magic',

  // WNBA Teams (12)
  'Aces', 'Liberty', 'Lynx', 'Storm', 'Sun', 'Wings', 'Mercury', 'Sky', 'Fever',
  'Sparks', 'Mystics', 'Dream',

  // College Programs (Major)
  'Duke', 'North Carolina', 'Kentucky', 'Kansas', 'UCLA', 'Villanova', 'UConn',
  'Michigan State', 'Syracuse', 'Louisville', 'Arizona', 'Florida', 'Michigan',
  'Gonzaga', 'Indiana', 'Ohio State', 'Tennessee',

  // Leagues and Events
  'NBA', 'WNBA', 'NCAA', 'March Madness', 'NBA Finals', 'All-Star'
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
  let primaryQuery = 'basketball cards';
  let autographQuery = 'basketball autographs';
  let relatedQuery = 'basketball cards';

  // Priority 1: Player-specific queries
  if (playerName) {
    primaryQuery = `${playerName} basketball cards`;
    autographQuery = `${playerName} autograph`;
    relatedQuery = teamName
      ? `${teamName} ${playerName} cards`
      : `${playerName} rookie cards`;
  }
  // Priority 2: Brand/Series queries
  else if (brand && type === 'SET') {
    primaryQuery = `${brand} basketball cards`;
    autographQuery = `${brand} autographs`;
    relatedQuery = `${brand} basketball`;
  }
  // Priority 3: Team-based queries
  else if (teamName) {
    primaryQuery = `${teamName} basketball cards`;
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
  if (query !== 'basketball cards' && query !== 'basketball autographs') {
    const words = query.split(' ');
    if (words.length >= 2) {
      // Capitalize first letter of each word
      const capitalizedWords = words
        .filter(w => !['basketball', 'cards', 'card', 'the'].includes(w.toLowerCase()))
        .map(w => w.charAt(0).toUpperCase() + w.slice(1));

      if (capitalizedWords.length > 0) {
        return capitalizedWords.join(' ') + ' Cards';
      }
    }
  }

  return defaultTitle;
}
