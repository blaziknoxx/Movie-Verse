/**
 * Movie Verse — NexStream Embedded Movie Player Service
 * Developer — Estiaq Mehedi
 * 
 * Provides centralized configuration, local storage persistence for user-configured keys,
 * and dynamic URL generation for NexStream movie and television embed streams based on authentic TMDB IDs.
 */

const STORAGE_KEY = 'movieverse_nexstream_api_key';

const DEFAULT_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_NEXSTREAM_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_NEXSTREAM_API_KEY) ||
  'DEMO_36cce954';

export const NEXSTREAM_CONFIG = {
  baseUrl: 'https://api.codespecters.com/embed',
  apiKey: DEFAULT_API_KEY,
  providerName: 'NexStream HD Cinema Player',
  domain: 'api.codespecters.com',
};

export const nexstreamService = {
  /**
   * Retrieves the configured NexStream API key from localStorage or falls back to default.
   */
  getApiKey(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && stored.trim()) {
          return stored.trim();
        }
      }
    } catch {
      // ignore storage access errors
    }
    return NEXSTREAM_CONFIG.apiKey || DEFAULT_API_KEY;
  },

  /**
   * Updates and saves the NexStream API key to localStorage and active runtime config.
   */
  setApiKey(key: string): void {
    const trimmed = (key || '').trim();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (trimmed) {
          window.localStorage.setItem(STORAGE_KEY, trimmed);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore storage access errors
    }
    NEXSTREAM_CONFIG.apiKey = trimmed || DEFAULT_API_KEY;
  },

  /**
   * Checks whether a valid API key is configured.
   */
  hasApiKey(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  },

  /**
   * Builds the dynamic movie embed URL.
   */
  buildMovieUrl(tmdbId: string | number): string {
    return buildNexStreamMovieUrl(tmdbId);
  },

  /**
   * Builds the dynamic TV episode embed URL.
   */
  buildTvUrl(tmdbId: string | number, season: number = 1, episode: number = 1): string {
    return buildNexStreamTvUrl(tmdbId, season, episode);
  },
};

/**
 * Builds the dynamic NexStream movie embed URL for a given TMDB movie ID.
 * Format: https://api.codespecters.com/embed/movie/{tmdbId}?apikey={apiKey}
 */
export function buildNexStreamMovieUrl(tmdbId: string | number): string {
  const cleanId = String(tmdbId).trim().replace(/\D/g, '');
  if (!cleanId) return '';
  const apiKey = nexstreamService.getApiKey();
  return `${NEXSTREAM_CONFIG.baseUrl}/movie/${cleanId}?apikey=${apiKey}`;
}

/**
 * Builds the dynamic NexStream TV episode embed URL.
 * Format: https://api.codespecters.com/embed/tv/{tmdbId}/{season}/{episode}?apikey={apiKey}
 */
export function buildNexStreamTvUrl(
  tmdbId: string | number,
  season: number = 1,
  episode: number = 1
): string {
  const cleanId = String(tmdbId).trim().replace(/\D/g, '');
  if (!cleanId) return '';
  const s = Math.max(1, Math.floor(Number(season) || 1));
  const ep = Math.max(1, Math.floor(Number(episode) || 1));
  const apiKey = nexstreamService.getApiKey();
  return `${NEXSTREAM_CONFIG.baseUrl}/tv/${cleanId}/${s}/${ep}?apikey=${apiKey}`;
}

export default nexstreamService;
