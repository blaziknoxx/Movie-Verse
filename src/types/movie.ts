export type RelationshipType = 
  | 'direct-sequel'
  | 'prequel'
  | 'shared-universe'
  | 'spin-off'
  | 'crossover'
  | 'shared-characters'
  | 'story-related'
  | 'optional-companion';

export type WatchPriority = 'MUST WATCH' | 'OPTIONAL' | 'SKIP FOR THIS STORY';

export type WatchOrderType = 
  | 'recommended-story' 
  | 'release-order' 
  | 'chronological' 
  | 'essential-only' 
  | 'completionist';

export type SiteCategory = 
  | 'Official Free Streaming'
  | 'Ad-Supported Streaming'
  | 'Subscription Streaming'
  | 'Free Public-Domain Films'
  | 'Official Movie Platforms'
  | 'Movie Discovery and Availability Guides';

export interface Movie {
  id: string;
  title: string;
  slug: string;
  year: number;
  duration: string;
  rating: number; // e.g. 8.6
  genres: string[];
  tagline: string;
  overview: string;
  director: string;
  cast: string[];
  posterUrl: string;
  backdropUrl: string;
  universeId?: string;
  universeName?: string;
  vibeTags: string[]; // e.g. ["High Action", "Dark Tone", "Intense Fights"]
  vibeProfile: {
    darkAtmosphere: number; // 1-10
    actionIntensity: number; // 1-10
    psychologicalComplexity: number; // 1-10
    mysterySuspense: number; // 1-10
    emotionalWeight: number; // 1-10
    pacing: 'Methodical' | 'Relentless' | 'Slow-Burn' | 'Propulsive' | 'Balanced';
    visualStyle: string;
  };
  streamingPlatforms: {
    name: string;
    type: 'Subscription' | 'Free' | 'Rent/Buy' | 'Public Domain';
    url: string;
    verified: boolean;
  }[];
  featured?: boolean;
  moodIds: string[];
  tmdbId?: number;
  voteCount?: number;
  originalTitle?: string;
  releaseDate?: string;
  collection?: {
    id: number;
    name: string;
    posterPath?: string;
    backdropPath?: string;
  };
  trailerKey?: string;
}

export interface MovieUniverse {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  coverImage: string;
  movieCount: number;
  genres: string[];
  movieIds: string[];
}

export interface MovieConnection {
  id: string;
  sourceMovieId: string;
  targetMovieId: string;
  relationshipType: RelationshipType;
  relationshipLabel: string;
  description: string;
  isCanonical: boolean;
}

export interface WatchOrderEntry {
  movieId: string;
  orderNumber: number;
  role: string; // e.g. "Origin & Foundation", "Climax & Catalyst"
  priority: WatchPriority;
  reason: string; // e.g. "Crucial for understanding the spice mythology and Paul's rise"
}

export interface WatchOrderGuide {
  id: string;
  universeId: string;
  universeName: string;
  title: string;
  orderType: WatchOrderType;
  orderTypeLabel: string;
  description: string;
  entries: WatchOrderEntry[];
}

export interface MoodCategory {
  id: string;
  name: string;
  description: string;
  accent: string;
}

export interface WhereToWatchSite {
  id: string;
  name: string;
  url: string;
  description: string;
  category: SiteCategory;
  availabilityType: string;
  region: string;
  verified: boolean;
  userExpectationNote: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface UserPreferences {
  watchlist: string[];
  watched: string[];
  recentlyViewed: string[];
  customSites: WhereToWatchSite[];
}
