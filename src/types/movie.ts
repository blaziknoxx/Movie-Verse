export type RelationshipType = 
  | 'direct-sequel'
  | 'prequel'
  | 'shared-universe'
  | 'spin-off'
  | 'crossover'
  | 'shared-characters'
  | 'story-related'
  | 'optional-companion';

export type WatchPriority = 'MUST WATCH' | 'OPTIONAL' | 'RECOMMENDED' | 'SKIP FOR THIS STORY';

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
    type: 'Subscription' | 'Free' | 'Rent/Buy' | 'Public Domain' | 'External Portal';
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
  detailedCast?: {
    id?: number;
    name: string;
    character: string;
    profileUrl?: string;
  }[];
  writers?: string[];
  language?: string;
  sources?: PlaybackSource[];
  mediaType?: 'movie' | 'tv';
  seasonsCount?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string | null;
  profileUrl?: string;
  order?: number;
  knownForDepartment?: string;
  gender?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath?: string | null;
  profileUrl?: string;
  gender?: number;
}

export interface MovieCredits {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

export interface PersonDetails {
  id: number;
  name: string;
  alsoKnownAs?: string[];
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  gender?: number;
  homepage?: string | null;
  imdbId?: string | null;
  knownForDepartment?: string;
  placeOfBirth?: string | null;
  popularity?: number;
  profilePath?: string | null;
  profileUrl?: string;
}

export interface PersonCreditItem {
  id: number;
  title: string;
  character?: string;
  job?: string;
  department?: string;
  releaseDate?: string;
  year?: number;
  posterPath?: string | null;
  posterUrl?: string;
  backdropPath?: string | null;
  backdropUrl?: string;
  voteAverage?: number;
  voteCount?: number;
  popularity?: number;
  overview?: string;
  mediaType?: 'movie' | 'tv';
  genreIds?: number[];
  genres?: string[];
}

export interface PersonCreditsResponse {
  cast: PersonCreditItem[];
  crew: PersonCreditItem[];
}

export type PlaybackType = 'embed' | 'mp4' | 'hls' | 'webpage';

export interface PlaybackSource {
  id: string;
  name: string;
  type: PlaybackType;
  url: string;
  quality?: '4K' | '1080p' | '720p' | 'Auto';
  isOfficial?: boolean;
  requiresExternalLink?: boolean;
  badge?: string;
  note?: string;
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

export interface UserProfile {
  displayName: string;
  avatarId: string;
  bio?: string;
  preferredStreamingProvider?: 'all' | 'nexstream';
  showTransparencyNotice?: boolean;
  joinedTimestamp: number;
}

export interface CustomCollection {
  id: string;
  name: string;
  description: string;
  movieIds: string[];
  createdAt: number;
  colorAccent?: string;
}
