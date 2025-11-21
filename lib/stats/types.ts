// Type definitions for statistics and analytics

export interface OverviewStats {
  totalReleases: number;
  totalSets: number;
  totalCards: number;
  cardsWithImages: number;
  publishedPosts: number;
  totalPosts: number;
  setsWithoutChecklists: number;
  cardsMissingImages: number;
  releasesWithoutPosts: number;
  imageCoveragePercent: number;
  postPublicationRate: number;
  setsWithChecklistsPercent: number;
}

export interface RarityTier {
  tier: string;
  tierLabel: string;
  count: number;
  minPrintRun: number | null;
  maxPrintRun: number | null;
}

export interface SetTypeStat {
  type: string;
  setCount: number;
  cardCount: number;
  percentage: number;
}

export interface PlayerStat {
  playerName: string;
  cardCount: number;
  baseCards: number;
  autographCards: number;
  memorabiliaCards: number;
  insertCards: number;
}

export interface ManufacturerStat {
  manufacturer: string;
  releaseCount: number;
  setCount: number;
  cardCount: number;
  percentage: number;
}

export interface AIStats {
  averageConfidence: number;
  totalCards: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  noConfidence: number;
  detectionMethodCounts: Record<string, number>;
}

export interface MetadataCompletenessField {
  field: string;
  fieldLabel: string;
  totalCards: number;
  cardsWithData: number;
  percentage: number;
}

export interface QualityAlert {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  count: number;
  link?: string;
}

export interface MonthlyGrowthData {
  month: string;
  monthLabel: string;
  releases: number;
  sets: number;
  cards: number;
}

export interface VelocityMetrics {
  cardsThisWeek: number;
  cardsThisMonth: number;
  cardsLastMonth: number;
  releasesThisMonth: number;
  releasesLastMonth: number;
  avgDaysToComplete: number;
  pendingReleases: number;
}

export interface ParallelComplexityStat {
  releaseSlug: string;
  releaseName: string;
  year: string;
  baseSetCount: number;
  parallelSetCount: number;
  avgParallelsPerBase: number;
  totalCards: number;
}

export interface HealthScoreComponents {
  imageCoverage: number;
  metadataCompleteness: number;
  postPublication: number;
  aiConfidence: number;
}

export interface HealthScore {
  overall: number;
  components: HealthScoreComponents;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
}

export interface DetailedStats {
  overview: OverviewStats;
  rarityDistribution: RarityTier[];
  setTypeDistribution: SetTypeStat[];
  topPlayers: PlayerStat[];
  manufacturerShare: ManufacturerStat[];
  aiPerformance: AIStats;
  metadataCompleteness: MetadataCompletenessField[];
  qualityAlerts: QualityAlert[];
  monthlyGrowth: MonthlyGrowthData[];
  velocity: VelocityMetrics;
  parallelComplexity: ParallelComplexityStat[];
  healthScore: HealthScore;
}
