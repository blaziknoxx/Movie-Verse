/**
 * Movie Verse — NexStream Embedded Movie Player Service
 * Developer — Estiaq Mehedi
 * 
 * Provides centralized configuration and dynamic URL generation for NexStream
 * movie and television embed streams based on authentic TMDB IDs.
 */

export const NEXSTREAM_CONFIG = {
  baseUrl: 'https://api.codespecters.com/embed',
  // Centralized demo key configured for testing. Production key can be overridden via VITE_NEXSTREAM_API_KEY.
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_NEXSTREAM_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_NEXSTREAM_API_KEY) ||
    'DEMO_36cce954',
  providerName: 'NexStream HD Cinema Player',
  domain: 'api.codespecters.com',
};

/**
 * Builds the dynamic NexStream movie embed URL for a given TMDB movie ID.
 * Format: https://api.codespecters.com/embed/movie/{tmdbId}?apikey={apiKey}
 */
export function buildNexStreamMovieUrl(tmdbId: string | number): string {
  const cleanId = String(tmdbId).trim().replace(/\D/g, '');
  if (!cleanId) return '';
  return `${NEXSTREAM_CONFIG.baseUrl}/movie/${cleanId}?apikey=${NEXSTREAM_CONFIG.apiKey}`;
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
  return `${NEXSTREAM_CONFIG.baseUrl}/tv/${cleanId}/${s}/${ep}?apikey=${NEXSTREAM_CONFIG.apiKey}`;
}
