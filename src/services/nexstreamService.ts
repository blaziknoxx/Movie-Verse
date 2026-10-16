/**
 * Movie Verse — NexStream Embedded Movie Player Service
 * Developer — Estiaq Mehedi
 * 
 * Provides centralized configuration, local storage persistence for user-configured keys,
 * and dynamic URL generation for NexStream movie and television embed streams based on authentic TMDB IDs.
 */

const STORAGE_KEY = 'movieverse_nexstream_api_key';

/**
 * Generates the active NexStream demo key matching the official Codespecters algorithm.
 * Synchronizes with Codespecters' 5-minute hash window so test playback works consistently across devices.
 */
export function getDynamicDemoKey(): string {
  try {
    const timeWindow = Math.floor(Date.now() / 300000);
    const str = 'NEXSTREAM' + timeWindow;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'DEMO_' + Math.abs(hash).toString(16).padEnd(8, '0');
  } catch {
    return 'DEMO_36cce954';
  }
}

const DEFAULT_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_NEXSTREAM_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_NEXSTREAM_API_KEY) ||
  '';

export const NEXSTREAM_CONFIG = {
  baseUrl: 'https://api.codespecters.com/embed',
  apiKey: DEFAULT_API_KEY,
  providerName: 'NexStream HD Cinema Player',
  domain: 'api.codespecters.com',
};

// Check server-side config on client startup
if (typeof window !== 'undefined') {
  fetch('/api/config/nexstream')
    .then((r) => r.json())
    .then((data: any) => {
      if (data?.configured && data?.apiKey) {
        NEXSTREAM_CONFIG.apiKey = String(data.apiKey).trim();
      }
    })
    .catch(() => {});
}

export const nexstreamService = {
  /**
   * Retrieves the configured NexStream API key from localStorage, environment, or active demo window.
   */
  getApiKey(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && stored.trim() && stored.trim() !== 'undefined' && stored.trim() !== 'null') {
          return stored.trim();
        }
      }
    } catch {
      // ignore storage access errors
    }
    const envKey =
      (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_NEXSTREAM_API_KEY) ||
      (typeof process !== 'undefined' && process.env && process.env.VITE_NEXSTREAM_API_KEY);
    if (envKey && String(envKey).trim()) {
      return String(envKey).trim();
    }
    if (NEXSTREAM_CONFIG.apiKey && NEXSTREAM_CONFIG.apiKey.trim() && NEXSTREAM_CONFIG.apiKey !== 'DEMO_36cce954') {
      return NEXSTREAM_CONFIG.apiKey.trim();
    }
    return getDynamicDemoKey();
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
    NEXSTREAM_CONFIG.apiKey = trimmed;
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
