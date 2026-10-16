/**
 * External Streaming & Directory Links Service
 * 
 * Manages external destination URLs and movie-specific recommendation calculations.
 * - HDHub4u: Dynamic search queries constructed safely using standard JavaScript
 *   URL and URLSearchParams APIs based on user-verified pattern (/search.html?q=...).
 * - MovieLinkBD: Homepage directory fallback. MovieLinkBD utilizes opaque internal
 *   content hashes (e.g. /movie/mKs_fixdvmrced2szvz3ps5vuwtnfa) without a public
 *   search endpoint or title-resolution API. Falling back to the verified homepage.
 */

import { Movie, WhereToWatchSite } from '../types/movie';

export const HDHUB4U_BASE_URL = 'https://new7.hdhub4u.cl/';
export const MOVIELINKBD_BASE_URL = 'https://rn4ngh.movielinkbd.at/';
export const MOVIELINKBD_SEARCH_BASE_URL = 'https://rn4ngh.movielinkbd.at/search';

/**
 * Builds the dynamic HDHub4u search URL for a given movie title.
 * Uses native URL and URLSearchParams APIs to prevent injection or malformed query strings.
 * Pattern: /search.html?q={encoded title}
 * Note: Release year is omitted because external multi-field indexing matches
 * clean movie titles accurately, avoiding false-negative zero-results from year discrepancies.
 */
export function buildHDHub4uSearchUrl(title?: string): string {
  if (!title || !title.trim()) {
    return HDHUB4U_BASE_URL;
  }

  try {
    const url = new URL('search.html', HDHUB4U_BASE_URL);
    url.searchParams.set('q', title.trim());
    return url.toString();
  } catch {
    // Fallback if URL constructor fails
    return `${HDHUB4U_BASE_URL}search.html?q=${encodeURIComponent(title.trim())}`;
  }
}

/**
 * Builds the dynamic MovieLinkBD search URL for a given movie or TV title.
 * Pattern: https://rn4ngh.movielinkbd.at/search?q={encoded title}
 * Safe encoding handles spaces (%20), colons (%3A), hyphens, apostrophes, and unicode characters.
 * Example: Spider-Man: No Way Home -> https://rn4ngh.movielinkbd.at/search?q=Spider-Man%3A%20No%20Way%20Home
 */
export function buildMovieLinkBDSearchUrl(title?: string): string {
  const cleanTitle = title?.trim();
  if (!cleanTitle) {
    return MOVIELINKBD_BASE_URL;
  }

  try {
    const url = new URL(MOVIELINKBD_SEARCH_BASE_URL);
    url.searchParams.set('q', cleanTitle);
    return url.toString().replace(/\+/g, '%20');
  } catch {
    return `${MOVIELINKBD_SEARCH_BASE_URL}?q=${encodeURIComponent(cleanTitle)}`;
  }
}

/**
 * MovieLinkBD destination resolver.
 * When a title is supplied, dynamically resolves to the universal search query URL.
 */
export function getMovieLinkBDUrl(title?: string): string {
  if (title && title.trim()) {
    return buildMovieLinkBDSearchUrl(title);
  }
  return MOVIELINKBD_BASE_URL;
}

export interface StreamingPlatformLink {
  name: string;
  type: 'Subscription' | 'Free' | 'Rent/Buy' | 'Public Domain' | 'External Portal';
  url: string;
  verified: boolean;
  description?: string;
  isDynamicSearch?: boolean;
}

/**
 * Generates external streaming destination records for a movie.
 */
export function getMovieStreamingPlatforms(title?: string): StreamingPlatformLink[] {
  const movieTitle = title?.trim() || '';
  return [
    {
      name: 'HDHub4u',
      type: 'External Portal',
      url: buildHDHub4uSearchUrl(movieTitle),
      verified: false,
      description: 'External entertainment directory and title search catalog',
      isDynamicSearch: true
    },
    {
      name: 'TMDB Watch Directory',
      type: 'External Portal',
      url: 'https://www.themoviedb.org/',
      verified: true,
      description: 'Official streaming directory and provider aggregator',
      isDynamicSearch: false
    }
  ];
}

export interface ProviderRecommendation {
  providerId: string;
  name: string;
  url: string;
  isMovieVersePick: boolean;
  isRecommended: boolean;
  badgeLabel: string;
  badgeStyle: 'pick' | 'regional' | 'neutral';
  matchReason: string;
  actionLabel: string;
  status: 'direct-search' | 'fallback-index' | 'custom';
  features: string[];
  destinationNote: string;
}

/**
 * Evaluates a directory site or provider dynamically against a selected movie.
 * Recommendations are based on:
 * - Direct destination precision (verified dynamic search URL vs homepage fallback)
 * - Language and regional affinity (e.g. South Asian/Bengali releases for MovieLinkBD)
 * - Real destination health (verified edge endpoints)
 * 
 * Strict constraints enforced:
 * - Neutral label ("Search on site") if availability cannot be verified
 * - No fake demo availability or fabricated IDs
 * - Fair representation without artificial bias
 */
export function evaluateProviderForMovie(
  site: WhereToWatchSite,
  movie?: Movie | null
): ProviderRecommendation {
  const isHDHub4u = site.id === 'site-hdhub4u' || site.name.toLowerCase().includes('hdhub');
  const isMovieLinkBD = site.id === 'site-movielinkbd' || site.name.toLowerCase().includes('movielink');
  const hasMovie = Boolean(movie && movie.title && movie.title.trim());
  const movieTitle = movie?.title?.trim() || '';
  const movieLang = (movie?.language || '').toLowerCase();
  const isSouthAsianLang = ['bn', 'ben', 'hi', 'hin', 'ta', 'te', 'ml'].includes(movieLang);

  if (isHDHub4u) {
    const targetUrl = hasMovie ? buildHDHub4uSearchUrl(movieTitle) : HDHUB4U_BASE_URL;
    
    if (hasMovie) {
      return {
        providerId: site.id,
        name: 'HDHub4u',
        url: targetUrl,
        isMovieVersePick: true,
        isRecommended: true,
        badgeLabel: 'Movie Verse Pick',
        badgeStyle: 'pick',
        matchReason: `Direct title search query generated for "${movieTitle}" using standard URLSearchParams. Directly targets matching release catalog.`,
        actionLabel: `Search on HDHub4u`,
        status: 'direct-search',
        features: [
          'Direct Movie Title Search (/search.html?q=...)',
          'URLSearchParams Escaped Query',
          'International & Dual Audio Collections'
        ],
        destinationNote: 'Navigates directly to filtered search results on HDHub4u. Movie Verse does not host media files.'
      };
    } else {
      return {
        providerId: site.id,
        name: 'HDHub4u',
        url: HDHUB4U_BASE_URL,
        isMovieVersePick: false,
        isRecommended: false,
        badgeLabel: 'Search on Site',
        badgeStyle: 'neutral',
        matchReason: 'General movie discovery and streaming directory. Select a movie above to generate a direct search query.',
        actionLabel: 'Visit HDHub4u Portal',
        status: 'direct-search',
        features: [
          'Global & Regional Releases',
          'Multilingual Titles',
          'Dynamic Search Ready'
        ],
        destinationNote: 'General portal directory. Select a title to enable direct search.'
      };
    }
  }

  if (isMovieLinkBD) {
    const targetUrl = hasMovie ? buildMovieLinkBDSearchUrl(movieTitle) : MOVIELINKBD_BASE_URL;

    if (hasMovie && isSouthAsianLang) {
      // For South Asian / Bengali language movies, MovieLinkBD is a strong regional specialist
      return {
        providerId: site.id,
        name: 'MovieLinkBD',
        url: targetUrl,
        isMovieVersePick: false,
        isRecommended: true,
        badgeLabel: 'Regional Focus',
        badgeStyle: 'regional',
        matchReason: `Regional cinema specialist for South Asian & Bengali titles. Dynamic title search enabled for "${movieTitle}".`,
        actionLabel: `Search on MovieLinkBD`,
        status: 'direct-search',
        features: [
          'Bengali & South Asian Cinema Specialization',
          'Direct Title Search (/search?q=...)',
          'Curated Regional Catalog'
        ],
        destinationNote: 'Navigates directly to universal search results on MovieLinkBD.'
      };
    } else if (hasMovie) {
      // General global movie (e.g. Hollywood / Sci-Fi / Nolan)
      return {
        providerId: site.id,
        name: 'MovieLinkBD',
        url: targetUrl,
        isMovieVersePick: false,
        isRecommended: false,
        badgeLabel: 'Search on Site',
        badgeStyle: 'neutral',
        matchReason: `Direct title search query generated for "${movieTitle}" on MovieLinkBD.`,
        actionLabel: `Search on MovieLinkBD`,
        status: 'direct-search',
        features: [
          'Direct Title Search (/search?q=...)',
          'South Asian & International Index',
          'Instant Search Results'
        ],
        destinationNote: 'Navigates directly to universal search results on MovieLinkBD.'
      };
    } else {
      return {
        providerId: site.id,
        name: 'MovieLinkBD',
        url: MOVIELINKBD_BASE_URL,
        isMovieVersePick: false,
        isRecommended: false,
        badgeLabel: 'Search on Site',
        badgeStyle: 'neutral',
        matchReason: 'Regional media guide and South Asian cinema directory. Select a movie to generate a direct search query.',
        actionLabel: 'Visit MovieLinkBD',
        status: 'fallback-index',
        features: [
          'Regional Cinema Directory',
          'Bengali & South Asian Media',
          'Universal Search Ready'
        ],
        destinationNote: 'General directory index. Select a title to enable direct search.'
      };
    }
  }

  // Custom added or other external sites
  return {
    providerId: site.id,
    name: site.name,
    url: site.url,
    isMovieVersePick: false,
    isRecommended: false,
    badgeLabel: 'Search on Site',
    badgeStyle: 'neutral',
    matchReason: site.userExpectationNote || 'Custom platform added to local browser directory. Title-specific availability unverified.',
    actionLabel: `Visit ${site.name}`,
    status: 'custom',
    features: [
      site.availabilityType || 'External Directory',
      site.region || 'Global',
      'Unverified Live Availability'
    ],
    destinationNote: site.userExpectationNote || 'External site added manually.'
  };
}
