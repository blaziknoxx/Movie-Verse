/**
 * External Streaming & Directory Links Service
 * 
 * Manages external destination URLs for movie discovery portals.
 * - HDHub4u: Dynamic search queries constructed safely using standard JavaScript
 *   URL and URLSearchParams APIs based on user-verified pattern (/search.html?q=...).
 * - MovieLinkBD: Homepage directory fallback. MovieLinkBD utilizes opaque internal
 *   content hashes (e.g. /movie/mKs_fixdvmrced2szvz3ps5vuwtnfa) without a public
 *   search endpoint or title-resolution API. Falling back to the verified homepage.
 */

export const HDHUB4U_BASE_URL = 'https://new7.hdhub4u.cl/';
export const MOVIELINKBD_BASE_URL = 'https://movielinkbd.tv/';

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
 * MovieLinkBD destination resolver.
 * Since MovieLinkBD relies on opaque internal movie hashes (e.g., mKs_fixdvmrced2szvz3ps5vuwtnfa)
 * and does not expose a public title-search endpoint or API, we safely fall back to the
 * verified homepage directory rather than fabricating IDs or appending unsupported paths.
 */
export function getMovieLinkBDUrl(): string {
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
      description: movieTitle ? `Search for "${movieTitle}" on HDHub4u` : 'External entertainment portal',
      isDynamicSearch: Boolean(movieTitle)
    },
    {
      name: 'MovieLinkBD',
      type: 'External Portal',
      url: getMovieLinkBDUrl(),
      verified: false,
      description: 'Homepage directory index (opaque ID resolution fallback)',
      isDynamicSearch: false
    }
  ];
}
