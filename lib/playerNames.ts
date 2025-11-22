/**
 * Basketball Player Name Mapper
 * Maps common nicknames and abbreviations to full player names for better eBay search results
 */

export const PLAYER_NAME_MAP: Record<string, string> = {
  // Legends
  "Shaq": "Shaquille O'Neal",
  "MJ": "Michael Jordan",
  "Magic": "Magic Johnson",
  "The Dream": "Hakeem Olajuwon",
  "Sir Charles": "Charles Barkley",
  "The Mailman": "Karl Malone",
  "The Admiral": "David Robinson",
  "The Answer": "Allen Iverson",
  "AI": "Allen Iverson",
  "The Truth": "Paul Pierce",
  "King James": "LeBron James",
  "CP3": "Chris Paul",
  "D-Wade": "Dwyane Wade",
  "Flash": "Dwyane Wade",

  // Current Stars
  "LeBron": "LeBron James",
  "KD": "Kevin Durant",
  "Steph": "Stephen Curry",
  "The Greek Freak": "Giannis Antetokounmpo",
  "Giannis": "Giannis Antetokounmpo",
  "The Beard": "James Harden",
  "Playoff P": "Paul George",
  "PG13": "Paul George",
  "Dame": "Damian Lillard",
  "Dame Time": "Damian Lillard",
  "Luka": "Luka Doncic",
  "The Joker": "Nikola Jokic",
  "The Process": "Joel Embiid",
  "The Brow": "Anthony Davis",
  "AD": "Anthony Davis",
  "Boogie": "DeMarcus Cousins",
  "Kyrie": "Kyrie Irving",
  "Uncle Drew": "Kyrie Irving",
  "Russ": "Russell Westbrook",
  "Westbrook": "Russell Westbrook",
  "The Claw": "Kawhi Leonard",
  "Kawhi": "Kawhi Leonard",
  "The Slim Reaper": "Kevin Durant",
  "The Servant": "Kevin Durant",
  "Klay": "Klay Thompson",
  "Dray": "Draymond Green",
  "Ja": "Ja Morant",
  "Trae": "Trae Young",
  "Ice Trae": "Trae Young",
  "The Unicorn": "Kristaps Porzingis",
  "KP": "Kristaps Porzingis",
  "Zion": "Zion Williamson",
  "Ant": "Anthony Edwards",
  "Ant-Man": "Anthony Edwards",
  "SGA": "Shai Gilgeous-Alexander",
  "Book": "Devin Booker",
  "DBook": "Devin Booker",
  "Jimmy Buckets": "Jimmy Butler",
  "Spida": "Donovan Mitchell",
  "JT": "Jayson Tatum",
  "JB": "Jaylen Brown",
  "Bam": "Bam Adebayo",

  // Rising Stars
  "Wemby": "Victor Wembanyama",
  "Chet": "Chet Holmgren",
  "Scoot": "Scoot Henderson",
  "Paolo": "Paolo Banchero",
  "Cade": "Cade Cunningham",
  "Evan Mobley": "Evan Mobley",
  "Scottie": "Scottie Barnes",
  "Franz": "Franz Wagner",
  "Jalen": "Jalen Green", // Common, but context-dependent
  "Jabari": "Jabari Smith Jr.",
  "Keegan": "Keegan Murray",
};

/**
 * Normalizes a player name by checking for common nicknames
 * @param name - Player name (could be nickname or full name)
 * @returns Normalized full name
 */
export function normalizePlayerName(name: string): string {
  if (!name) return name;

  // Check if it's a known nickname
  const normalized = PLAYER_NAME_MAP[name];
  if (normalized) return normalized;

  // Check case-insensitive match
  const nameKey = Object.keys(PLAYER_NAME_MAP).find(
    key => key.toLowerCase() === name.toLowerCase()
  );
  if (nameKey) return PLAYER_NAME_MAP[nameKey];

  // Return original name if no mapping found
  return name;
}

/**
 * Extracts player name from text and normalizes it
 * Handles common patterns like "Player Name RC", "Player Name Auto", etc.
 * @param text - Text containing player name
 * @returns Normalized player name or null if not found
 */
export function extractPlayerName(text: string): string | null {
  if (!text) return null;

  // Remove common card suffixes
  const cleaned = text
    .replace(/\s+(RC|AUTO|JSY|MEM|SSP|SP|BASE|PARALLEL|REFRACTOR|PRIZM)$/i, '')
    .replace(/\s+\d+\/\d+$/i, '') // Remove print runs like "/99"
    .replace(/\s+#\d+$/i, '') // Remove card numbers
    .trim();

  // Try to normalize the cleaned name
  return normalizePlayerName(cleaned);
}
