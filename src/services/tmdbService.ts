/**
 * Movie Verse — TMDB Client Service
 * Developer — Estiaq Mehedi
 * Connects frontend components to the secure server-side TMDB proxy.
 */

import { Movie } from '../types/movie';
import { UNIVERSES } from '../data/moviesData';
import { getMovieStreamingPlatforms } from './streamingProviders';

// Known TMDB Universe associations mapping (links real TMDB IDs to Movie Verse curated universes)
const TMDB_TO_UNIVERSE_MAP: Record<number, { universeId: string; universeName: string }> = {
  // Dune Universe
  693134: { universeId: 'dune-universe', universeName: 'The Arrakis Chronicles' }, // Dune Part 2
  438631: { universeId: 'dune-universe', universeName: 'The Arrakis Chronicles' }, // Dune Part 1
  841: { universeId: 'dune-universe', universeName: 'The Arrakis Chronicles' }, // Dune 1984
  
  // Batman / Gotham Noir
  414906: { universeId: 'gotham-noir', universeName: 'Gotham Underworld' }, // The Batman (2022)
  155: { universeId: 'gotham-noir', universeName: 'Gotham Underworld' }, // The Dark Knight (2008)
  272: { universeId: 'gotham-noir', universeName: 'Gotham Underworld' }, // Batman Begins (2005)
  49026: { universeId: 'gotham-noir', universeName: 'Gotham Underworld' }, // The Dark Knight Rises (2012)
  475557: { universeId: 'gotham-noir', universeName: 'Gotham Underworld' }, // Joker (2019)
  
  // Nolan Cosmos
  157336: { universeId: 'nolan-cosmos', universeName: 'The Quantum & Temporal Cosmos' }, // Interstellar
  872585: { universeId: 'nolan-cosmos', universeName: 'The Quantum & Temporal Cosmos' }, // Oppenheimer
  27205: { universeId: 'nolan-cosmos', universeName: 'The Quantum & Temporal Cosmos' }, // Inception
  577922: { universeId: 'nolan-cosmos', universeName: 'The Quantum & Temporal Cosmos' }, // Tenet
  
  // John Wick
  603692: { universeId: 'wick-continental', universeName: 'The High Table & Continental' }, // John Wick 4
  245891: { universeId: 'wick-continental', universeName: 'The High Table & Continental' }, // John Wick 1
  324552: { universeId: 'wick-continental', universeName: 'The High Table & Continental' }, // John Wick 2
  458156: { universeId: 'wick-continental', universeName: 'The High Table & Continental' }, // John Wick 3
  
  // Cyberpunk & Blade Runner
  335984: { universeId: 'cyber-dystopia', universeName: 'Cybernetic Futures' }, // Blade Runner 2049
  78: { universeId: 'cyber-dystopia', universeName: 'Cybernetic Futures' }, // Blade Runner (1982)
};

// TMDB Genre ID dictionary
const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Mood to TMDB Discover Genre mapping
export const MOOD_TO_GENRE_IDS: Record<string, string> = {
  'dark-gritty': '80,53', // Crime, Thriller
  'mind-bending': '878,9648', // Sci-Fi, Mystery
  'action-heavy': '28,12', // Action, Adventure
  'sci-fi-epic': '878', // Sci-Fi
  'psychological': '18,53', // Drama, Thriller
  'feel-good': '16,35,10751', // Animation, Comedy, Family
  'mystery-suspense': '9648,53', // Mystery, Thriller
  'cyberpunk': '878,28', // Sci-Fi, Action
};

export const TMDB_IMAGE_BASE = {
  posterW342: 'https://image.tmdb.org/t/p/w342',
  posterW500: 'https://image.tmdb.org/t/p/w500',
  backdropW780: 'https://image.tmdb.org/t/p/w780',
  backdropW1280: 'https://image.tmdb.org/t/p/w1280',
  original: 'https://image.tmdb.org/t/p/original',
};

/**
 * Generates an elegant liquid-glass sunset SVG placeholder if TMDB has no image.
 */
export function getPlaceholderImage(title: string, width = 500, height = 750): string {
  const safeTitle = title ? title.replace(/[<>&"]/g, '') : 'Movie Verse';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E0A04"/>
        <stop offset="50%" stop-color="#120602"/>
        <stop offset="100%" stop-color="#080301"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#EA6113" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#EA6113" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="${width/2}" cy="${height*0.35}" r="${width*0.4}" fill="url(#glow)"/>
    <rect x="${width*0.08}" y="${height*0.08}" width="${width*0.84}" height="${height*0.84}" rx="20" fill="rgba(255,255,255,0.02)" stroke="rgba(248,143,34,0.25)" stroke-width="2"/>
    <text x="50%" y="38%" font-family="system-ui, sans-serif" font-weight="800" font-size="24" fill="#FBB931" text-anchor="middle" letter-spacing="3">MOVIE VERSE</text>
    <text x="50%" y="46%" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#FFE3B3" text-anchor="middle">${safeTitle.slice(0, 32)}</text>
    <text x="50%" y="86%" font-family="system-ui, sans-serif" font-weight="500" font-size="11" fill="#F88F22" text-anchor="middle" letter-spacing="1">DEVELOPER — ESTIAQ MEHEDI</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves an optimized TMDB poster URL at the requested width.
 * Handles:
 * - relative TMDB paths (e.g. "/abc.jpg")
 * - full TMDB image URLs (e.g. "https://image.tmdb.org/t/p/w500/abc.jpg" -> dynamically rewrites to requested size)
 * - data URIs and local asset URLs (preserved as-is)
 * - null, undefined, or empty values (returns SVG liquid-glass placeholder)
 */
export function getOptimizedPosterUrl(
  posterPathOrUrl?: string | null,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342',
  title = ''
): string {
  if (!posterPathOrUrl || typeof posterPathOrUrl !== 'string' || posterPathOrUrl.trim() === '') {
    const width = size === 'w92' ? 92 : size === 'w154' ? 154 : size === 'w185' ? 185 : size === 'w500' ? 500 : size === 'w780' ? 780 : 342;
    const height = Math.round(width * 1.5);
    return getPlaceholderImage(title, width, height);
  }

  const cleanPath = posterPathOrUrl.trim();

  // If already a local data URI, blob, or bundled asset path, preserve as-is
  if (cleanPath.startsWith('data:') || cleanPath.startsWith('blob:') || cleanPath.startsWith('/assets/') || cleanPath.startsWith('./') || cleanPath.startsWith('asset:')) {
    return cleanPath;
  }

  // If already a full TMDB URL, rewrite the size segment
  if (cleanPath.includes('image.tmdb.org/t/p/')) {
    return cleanPath.replace(/\/t\/p\/[^\/]+/, `/t/p/${size}`);
  }

  // If it's a relative TMDB path (e.g., "/abc.jpg")
  if (cleanPath.startsWith('/')) {
    return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
  }

  // If it's a non-TMDB external URL, preserve as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Otherwise treat as TMDB path segment
  return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
}

export function getPosterUrl(posterPath?: string | null, title = ''): string {
  return getOptimizedPosterUrl(posterPath, 'w500', title);
}

/**
 * Resolves an optimized TMDB backdrop URL at the requested width.
 * Handles:
 * - relative TMDB paths (e.g. "/abc.jpg")
 * - full TMDB image URLs (e.g. "https://image.tmdb.org/t/p/w1280/abc.jpg" -> dynamically rewrites to requested size)
 * - data URIs and local asset URLs (preserved as-is)
 * - null, undefined, or empty values (returns SVG liquid-glass landscape placeholder)
 */
export function getBackdropUrl(
  backdropPathOrUrl?: string | null,
  title = '',
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
): string {
  if (!backdropPathOrUrl || typeof backdropPathOrUrl !== 'string' || backdropPathOrUrl.trim() === '') {
    const width = size === 'w300' ? 300 : size === 'w780' ? 780 : 1280;
    const height = Math.round(width * (9 / 16));
    return getPlaceholderImage(title, width, height);
  }

  const cleanPath = backdropPathOrUrl.trim();

  // If already a local data URI, blob, or bundled asset path, preserve as-is
  if (cleanPath.startsWith('data:') || cleanPath.startsWith('blob:') || cleanPath.startsWith('/assets/') || cleanPath.startsWith('./') || cleanPath.startsWith('asset:')) {
    return cleanPath;
  }

  // If already a full TMDB URL, rewrite the size segment
  if (cleanPath.includes('image.tmdb.org/t/p/')) {
    return cleanPath.replace(/\/t\/p\/[^\/]+/, `/t/p/${size}`);
  }

  // If it's a relative TMDB path (e.g., "/abc.jpg")
  if (cleanPath.startsWith('/')) {
    return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
  }

  // If it's a non-TMDB external URL, preserve as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Otherwise treat as TMDB path segment
  return `https://image.tmdb.org/t/p/${size}/${cleanPath}`;
}

/**
 * Format runtime (e.g., 166 min -> "2h 46m")
 */
function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Convert TMDB payload into our structured Movie model.
 */
export function normalizeTMDBMovie(raw: any, credits?: any): Movie {
  const id = String(raw.id);
  const numericId = Number(raw.id);
  const title = raw.title || raw.original_title || 'Untitled';
  const year = raw.release_date ? parseInt(raw.release_date.slice(0, 4), 10) : 2024;
  const rating = raw.vote_average ? Number(raw.vote_average.toFixed(1)) : 0;
  const duration = formatRuntime(raw.runtime);

  // Extract genres
  let genres: string[] = [];
  if (Array.isArray(raw.genres) && raw.genres.length > 0) {
    genres = raw.genres.map((g: any) => g.name || '');
  } else if (Array.isArray(raw.genre_ids)) {
    genres = raw.genre_ids.map((gid: number) => TMDB_GENRES[gid]).filter(Boolean);
  }
  if (genres.length === 0) genres = ['Cinema'];

  // Extract Cast and Crew (Dynamically resolved from credits response)
  let director = '';
  let cast: string[] = [];
  let detailedCast: { name: string; character: string; profileUrl?: string }[] = [];
  let writers: string[] = [];

  if (credits) {
    if (Array.isArray(credits.crew)) {
      const dirObj = credits.crew.find((c: any) => c.job === 'Director');
      if (dirObj && dirObj.name) director = dirObj.name;

      writers = Array.from(
        new Set(
          credits.crew
            .filter((c: any) => ['Writer', 'Screenplay', 'Author', 'Story'].includes(c.job))
            .map((c: any) => c.name)
        )
      ).slice(0, 3) as string[];
    }
    if (Array.isArray(credits.cast)) {
      cast = credits.cast.slice(0, 8).map((c: any) => c.name);
      detailedCast = credits.cast.slice(0, 10).map((c: any) => ({
        name: c.name,
        character: c.character || 'Actor',
        profileUrl: c.profile_path ? `${TMDB_IMAGE_BASE.posterW342}${c.profile_path}` : undefined,
      }));
    }
  }

  // Universe connection check
  const universeAffiliation = TMDB_TO_UNIVERSE_MAP[numericId];
  const universeId = universeAffiliation?.universeId;
  const universeName = universeAffiliation?.universeName;

  // Synthesize Vibe Tags & Profile from genres and rating
  const vibeTags: string[] = [];
  if (genres.includes('Action')) vibeTags.push('High Octane', 'Kinetic Stunts');
  if (genres.includes('Crime') || genres.includes('Thriller')) vibeTags.push('Dark Tone', 'Methodical Tension');
  if (genres.includes('Sci-Fi')) vibeTags.push('Futuristic Scale', 'Mind-Bending');
  if (genres.includes('Drama')) vibeTags.push('Emotional Resonance');
  if (genres.includes('Mystery')) vibeTags.push('Enigmatic Puzzle');
  if (genres.includes('Animation')) vibeTags.push('Visual Artistry');
  if (vibeTags.length === 0) vibeTags.push('Cinematic Atmosphere', 'Compelling Narrative');

  // Compute mood IDs
  const moodIds: string[] = [];
  if (genres.includes('Crime') || genres.includes('Horror')) moodIds.push('dark-gritty');
  if (genres.includes('Sci-Fi') && genres.includes('Mystery')) moodIds.push('mind-bending');
  if (genres.includes('Action')) moodIds.push('action-heavy');
  if (genres.includes('Sci-Fi')) moodIds.push('sci-fi-epic');
  if (genres.includes('Drama') && genres.includes('Thriller')) moodIds.push('psychological');
  if (genres.includes('Animation') || genres.includes('Comedy')) moodIds.push('feel-good');
  if (genres.includes('Mystery')) moodIds.push('mystery-suspense');
  if (genres.includes('Sci-Fi') && genres.includes('Action')) moodIds.push('cyberpunk');
  if (moodIds.length === 0) moodIds.push('sci-fi-epic');

  // Estimated vibe profile
  const darkAtmosphere = genres.includes('Crime') || genres.includes('Horror') ? 9 : genres.includes('Sci-Fi') ? 8 : 6;
  const actionIntensity = genres.includes('Action') ? 9 : genres.includes('Thriller') ? 7 : 4;
  const psychologicalComplexity = genres.includes('Mystery') || genres.includes('Drama') ? 9 : 7;
  const mysterySuspense = genres.includes('Mystery') || genres.includes('Thriller') ? 9 : 6;
  const emotionalWeight = genres.includes('Drama') ? 9 : 7;

  // Extract Collection if part of franchise
  let collection: { id: number; name: string; posterPath?: string; backdropPath?: string } | undefined = undefined;
  if (raw.belongs_to_collection) {
    collection = {
      id: raw.belongs_to_collection.id,
      name: raw.belongs_to_collection.name,
      posterPath: raw.belongs_to_collection.poster_path ? `${TMDB_IMAGE_BASE.posterW500}${raw.belongs_to_collection.poster_path}` : undefined,
      backdropPath: raw.belongs_to_collection.backdrop_path ? `${TMDB_IMAGE_BASE.backdropW1280}${raw.belongs_to_collection.backdrop_path}` : undefined,
    };
  }

  const language = raw.spoken_languages?.[0]?.english_name || raw.original_language?.toUpperCase() || 'English';

  return {
    id,
    tmdbId: numericId,
    title,
    originalTitle: raw.original_title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    year: isNaN(year) ? 2024 : year,
    duration,
    rating,
    voteCount: raw.vote_count,
    genres,
    tagline: raw.tagline || '',
    overview: raw.overview || 'No synopsis currently provided for this title.',
    director,
    writers,
    cast: cast.length > 0 ? cast : [],
    detailedCast,
    language,
    posterUrl: getPosterUrl(raw.poster_path, title),
    backdropUrl: getBackdropUrl(raw.backdrop_path, title),
    universeId,
    universeName,
    collection,
    trailerKey: raw.trailerKey,
    vibeTags: vibeTags.slice(0, 4),
    vibeProfile: {
      darkAtmosphere,
      actionIntensity,
      psychologicalComplexity,
      mysterySuspense,
      emotionalWeight,
      pacing: actionIntensity >= 8 ? 'Propulsive' : darkAtmosphere >= 8 ? 'Methodical' : 'Balanced',
      visualStyle: `${genres[0] || 'Modern'} Cinematic Direction`
    },
    streamingPlatforms: getMovieStreamingPlatforms(title),
    moodIds,
    releaseDate: raw.release_date
  };
}

// -------------------------------------------------------------
// In-Memory Client Cache & In-Flight Request Deduplication
// -------------------------------------------------------------
interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
const clientCache = new Map<string, ClientCacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

async function cachedFetchJson<T>(url: string, ttlMs: number = 5 * 60 * 1000, signal?: AbortSignal): Promise<T> {
  const now = Date.now();
  const cached = clientCache.get(url);
  if (cached && (now - cached.timestamp < cached.ttl)) {
    return cached.data;
  }

  // Deduplicate in-flight requests for the exact same URL
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)! as Promise<T>;
  }

  const promise = (async (): Promise<T> => {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) {
        const errorJson: any = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Failed to fetch data (${res.status})`);
      }
      const data: T = await res.json();
      clientCache.set(url, { data, timestamp: Date.now(), ttl: ttlMs });
      return data;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, promise);
  return promise;
}

// Dynamic date helpers for accurate release-date filtering
function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function getPastDateIso(years = 2): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

function filterAndSortRecent(movies: Movie[], today: string): Movie[] {
  return movies
    .filter(m => {
      // Must not be in the future for released movie sections
      if (m.releaseDate && m.releaseDate > today) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort strictly by descending release date
      const dateA = a.releaseDate || `${a.year}-01-01`;
      const dateB = b.releaseDate || `${b.year}-01-01`;
      return dateB.localeCompare(dateA);
    });
}

export const tmdbService = {
  /**
   * Check proxy status and token configuration.
   */
  async getStatus(): Promise<{ configured: boolean; error?: string }> {
    try {
      const res = await fetch('/api/tmdb/status');
      if (!res.ok) return { configured: false, error: `HTTP ${res.status}` };
      const data: any = await res.json();
      return { configured: Boolean(data.configured) };
    } catch (err: any) {
      return { configured: false, error: err.message };
    }
  },

  /**
   * Fetch weekly or daily trending movies.
   * STRICT: Preserves TMDB's actual trending ranking! Does NOT re-sort by release date.
   */
  async getTrending(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const url = `/api/tmdb/trending?time_window=${timeWindow}&page=${page}`;
    // 5-minute cache TTL for live trending
    const data = await cachedFetchJson<any>(url, 5 * 60 * 1000);
    const movies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch popular movies.
   */
  async getPopular(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const url = `/api/tmdb/popular?page=${page}`;
    const data = await cachedFetchJson<any>(url, 10 * 60 * 1000);
    const movies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch now playing movies in theaters.
   * Ensures future releases are filtered out from now-playing list.
   */
  async getNowPlaying(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const today = getTodayIso();
    const url = `/api/tmdb/now_playing?page=${page}`;
    const data = await cachedFetchJson<any>(url, 10 * 60 * 1000);
    const rawMovies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    // Filter out unreleased titles
    const movies = rawMovies.filter((m: Movie) => !m.releaseDate || m.releaseDate <= today);
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch upcoming movies.
   * STRICT: Only future releases (release date >= today).
   * Sorted in ascending order by release date (soonest upcoming first).
   */
  async getUpcoming(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const today = getTodayIso();
    const url = `/api/tmdb/upcoming?page=${page}`;
    const data = await cachedFetchJson<any>(url, 15 * 60 * 1000);
    const rawMovies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    // Strictly future releases
    const movies = rawMovies
      .filter((m: Movie) => m.releaseDate && m.releaseDate >= today)
      .sort((a: Movie, b: Movie) => (a.releaseDate || '').localeCompare(b.releaseDate || ''));
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch top rated movies with sensible vote count.
   */
  async getTopRated(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const url = `/api/tmdb/top_rated?page=${page}`;
    const data = await cachedFetchJson<any>(url, 30 * 60 * 1000);
    const movies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch recent Hollywood (US productions in English).
   * Filters: with_original_language=en, with_origin_country=US, primary_release_date.lte=today,
   * primary_release_date.gte=2 years back, sorted by primary_release_date.desc.
   */
  async getHollywood(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const today = getTodayIso();
    const pastDate = getPastDateIso(2);
    const url = `/api/tmdb/discover?with_original_language=en&with_origin_country=US&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&primary_release_date.gte=${pastDate}&vote_count.gte=10&page=${page}`;
    const data = await cachedFetchJson<any>(url, 10 * 60 * 1000);
    const rawMovies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    const movies = filterAndSortRecent(rawMovies, today);
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch recent Hindi movies.
   * Filters: with_original_language=hi, primary_release_date.lte=today,
   * sorted by primary_release_date.desc.
   */
  async getHindi(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const today = getTodayIso();
    const pastDate = getPastDateIso(2);
    const url = `/api/tmdb/discover?with_original_language=hi&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&primary_release_date.gte=${pastDate}&vote_count.gte=5&page=${page}`;
    const data = await cachedFetchJson<any>(url, 10 * 60 * 1000);
    const rawMovies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    const movies = filterAndSortRecent(rawMovies, today);
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch recent Animation movies.
   * Filters: with_genres=16, primary_release_date.lte=today,
   * sorted by primary_release_date.desc.
   */
  async getAnimation(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const today = getTodayIso();
    const pastDate = getPastDateIso(2);
    const url = `/api/tmdb/discover?with_genres=16&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&primary_release_date.gte=${pastDate}&vote_count.gte=10&page=${page}`;
    const data = await cachedFetchJson<any>(url, 10 * 60 * 1000);
    const rawMovies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    const movies = filterAndSortRecent(rawMovies, today);
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch recent Tamil movies.
   * Filters: with_original_language=ta, primary_release_date.lte=today,
   * sorted by primary_release_date.desc.
   */
  async getTamil(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const today = getTodayIso();
    const pastDate = getPastDateIso(2);
    const url = `/api/tmdb/discover?with_original_language=ta&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&primary_release_date.gte=${pastDate}&vote_count.gte=3&page=${page}`;
    const data = await cachedFetchJson<any>(url, 10 * 60 * 1000);
    const rawMovies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    const movies = filterAndSortRecent(rawMovies, today);
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Fetch recent Bangladeshi movies.
   * Filters: with_origin_country=BD, primary_release_date.lte=today,
   * sorted by primary_release_date.desc.
   * Note: No artificial vote count threshold to ensure all legitimate releases are preserved.
   */
  async getBangladeshi(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const today = getTodayIso();
    const url = `/api/tmdb/discover?with_origin_country=BD&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&page=${page}`;
    const data = await cachedFetchJson<any>(url, 10 * 60 * 1000);
    const rawMovies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    const movies = filterAndSortRecent(rawMovies, today);
    return { movies, totalPages: data.total_pages || 1 };
  },

  /**
   * Dispatch to the correct TMDB endpoint based on category ID.
   */
  async getCategoryMovies(category: string, page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    switch (category) {
      case 'trending':
        return this.getTrending('week', page);
      case 'popular':
        return this.getPopular(page);
      case 'now_playing':
        return this.getNowPlaying(page);
      case 'upcoming':
        return this.getUpcoming(page);
      case 'top_rated':
        return this.getTopRated(page);
      case 'hollywood':
        return this.getHollywood(page);
      case 'hindi':
        return this.getHindi(page);
      case 'animation':
        return this.getAnimation(page);
      case 'tamil':
        return this.getTamil(page);
      case 'bangladeshi':
        return this.getBangladeshi(page);
      default:
        return this.getTrending('week', page);
    }
  },

  /**
   * Invalidate cached client results.
   */
  clearCache(): void {
    clientCache.clear();
  },

  /**
   * Search movies with pagination and optional abort signal.
   */
  async searchMovies(
    query: string,
    page = 1,
    signal?: AbortSignal
  ): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { movies: [], totalPages: 0, totalResults: 0 };
    }
    const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(trimmed)}&page=${page}`, {
      signal
    });
    if (!res.ok) {
      const errorJson: any = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `Failed to search movies (${res.status})`);
    }
    const data: any = await res.json();
    const movies = (data.results || []).map((m: any) => normalizeTMDBMovie(m));
    return {
      movies,
      totalPages: data.total_pages || 0,
      totalResults: data.total_results || 0
    };
  },

  /**
   * Fetch detailed movie information including credits and official trailers.
   */
  async getMovieDetails(id: string | number): Promise<Movie> {
    const numericId = String(id).replace(/\D/g, '');
    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      fetch(`/api/tmdb/movie/${numericId}`),
      fetch(`/api/tmdb/movie/${numericId}/credits`).catch(() => null),
      fetch(`/api/tmdb/movie/${numericId}/videos`).catch(() => null)
    ]);

    if (!detailsRes.ok) {
      const errorJson: any = await detailsRes.json().catch(() => ({}));
      throw new Error(errorJson.error || `Failed to fetch movie details for ID ${id}`);
    }

    const detailsData: any = await detailsRes.json();
    let creditsData: any = null;
    if (creditsRes && creditsRes.ok) {
      creditsData = await creditsRes.json().catch(() => null);
    }

    let trailerKey: string | undefined = undefined;
    if (videosRes && videosRes.ok) {
      const vids: any = await videosRes.json().catch(() => null);
      if (vids && Array.isArray(vids.results)) {
        const officialTrailer = vids.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
                                vids.results.find((v: any) => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip'));
        if (officialTrailer) trailerKey = officialTrailer.key;
      }
    }

    const movie = normalizeTMDBMovie(detailsData, creditsData);
    if (trailerKey) {
      movie.trailerKey = trailerKey;
    }
    return movie;
  },

  /**
   * Fetch official trailers / videos for a movie.
   */
  async getMovieVideos(id: string | number): Promise<{ key: string; name: string; site: string; type: string }[]> {
    const numericId = String(id).replace(/\D/g, '');
    const res = await fetch(`/api/tmdb/movie/${numericId}/videos`);
    if (!res.ok) return [];
    const data: any = await res.json();
    return data.results || [];
  },

  /**
   * Fetch official TMDB watch providers for a movie (e.g. Netflix, Prime Video, Apple TV, Disney+).
   */
  async getMovieWatchProviders(id: string | number): Promise<{
    link?: string;
    flatrate?: { provider_id: number; provider_name: string; logo_path?: string }[];
    rent?: { provider_id: number; provider_name: string; logo_path?: string }[];
    buy?: { provider_id: number; provider_name: string; logo_path?: string }[];
  } | null> {
    const numericId = String(id).replace(/\D/g, '');
    if (!numericId) return null;
    try {
      const data = await cachedFetchJson<any>(`/api/tmdb/movie/${numericId}/watch/providers`, 30 * 60 * 1000);
      const results = data?.results || {};
      const regionData = results['US'] || results['BD'] || results['IN'] || results['GB'] || Object.values(results)[0] as any;
      if (!regionData) return null;
      return {
        link: regionData.link,
        flatrate: regionData.flatrate,
        rent: regionData.rent,
        buy: regionData.buy,
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetch connected franchise films from TMDB collection.
   * Dynamically loads real credits for each part to ensure genuine director and cast names.
   */
  async getCollection(collectionId: number | string): Promise<Movie[]> {
    const numericId = String(collectionId).replace(/\D/g, '');
    if (!numericId) return [];
    const res = await fetch(`/api/tmdb/collection/${numericId}`);
    if (!res.ok) return [];
    const data: any = await res.json();
    const rawParts: any[] = data.parts || [];

    // Fetch credits for each part in parallel so the genuine director (e.g. James Cameron) is resolved
    const partsWithCredits = await Promise.all(
      rawParts.map(async (part: any) => {
        try {
          const creditsRes = await fetch(`/api/tmdb/movie/${part.id}/credits`).catch(() => null);
          let credits = null;
          if (creditsRes && creditsRes.ok) {
            credits = await creditsRes.json().catch(() => null);
          }
          return normalizeTMDBMovie(part, credits);
        } catch {
          return normalizeTMDBMovie(part);
        }
      })
    );

    return partsWithCredits;
  },

  /**
   * Fetch real movie director dynamically by TMDB ID.
   */
  async getMovieDirector(id: string | number): Promise<string | null> {
    const numericId = String(id).replace(/\D/g, '');
    if (!numericId) return null;
    try {
      const res = await fetch(`/api/tmdb/movie/${numericId}/credits`);
      if (!res.ok) return null;
      const data: any = await res.json();
      const dirObj = (data.crew || []).find((c: any) => c.job === 'Director');
      return dirObj?.name || null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch similar movies by TMDB ID.
   */
  async getSimilarMovies(id: string | number, page = 1): Promise<Movie[]> {
    const numericId = String(id).replace(/\D/g, '');
    const res = await fetch(`/api/tmdb/movie/${numericId}/similar?page=${page}`);
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.results || []).map((m: any) => normalizeTMDBMovie(m));
  },

  /**
   * Fetch recommended movies by TMDB ID.
   */
  async getMovieRecommendations(id: string | number, page = 1): Promise<Movie[]> {
    const numericId = String(id).replace(/\D/g, '');
    const res = await fetch(`/api/tmdb/movie/${numericId}/recommendations?page=${page}`);
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.results || []).map((m: any) => normalizeTMDBMovie(m));
  },

  /**
   * Discover movies by mood / genre query.
   */
  async discoverByMood(moodId: string, page = 1): Promise<Movie[]> {
    const genreIds = MOOD_TO_GENRE_IDS[moodId] || '28';
    const res = await fetch(`/api/tmdb/discover?with_genres=${genreIds}&sort_by=popularity.desc&page=${page}`);
    if (!res.ok) {
      const errorJson: any = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `Failed to discover movies by mood (${res.status})`);
    }
    const data: any = await res.json();
    return (data.results || []).map((m: any) => normalizeTMDBMovie(m));
  }
};
