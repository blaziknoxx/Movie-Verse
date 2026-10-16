/**
 * Movie Verse — Streaming Provider Registry
 * Developer — Estiaq Mehedi
 * 
 * Maintainable, data-driven streaming provider configuration supporting:
 * - Stable provider ID
 * - Display name & quality badges
 * - Embed URL builder with movie & TV episode parameters
 * - Verification status
 * - Optional language preferences
 * - Enabled / disabled flags
 */

import { buildNexStreamMovieUrl, buildNexStreamTvUrl } from './nexstreamService';
import { PlaybackSource } from '../types/movie';

export interface ProviderUrlParams {
  tmdbId: number | string;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export interface StreamingProviderConfig {
  id: string;
  name: string;
  badge?: string;
  quality?: string;
  isVerified?: boolean;
  enabled: boolean;
  description?: string;
  supportedLanguages?: string[];
  preferredLanguage?: string;
  supportsTv?: boolean;
  buildEmbedUrl: (params: ProviderUrlParams) => string;
}

/**
 * Builds the dynamic CineSRC movie embed URL for a given TMDB movie ID.
 * Format: https://cinesrc.st/embed/movie/{tmdbId}
 */
export function buildCineSrcMovieUrl(tmdbId: string | number): string {
  const cleanId = String(tmdbId).trim().replace(/\D/g, '');
  if (!cleanId) return '';
  return `https://cinesrc.st/embed/movie/${cleanId}`;
}

/**
 * Data-driven registry of streaming providers.
 * Provider Order:
 * 1. CineSRC — Primary default movie streaming provider
 * 2. NexStream — High-definition adaptive streaming provider
 */
export const STREAMING_PROVIDERS: StreamingProviderConfig[] = [
  {
    id: 'cinesrc',
    name: 'CineSRC',
    badge: '1080p HD',
    quality: '1080p',
    isVerified: true,
    enabled: true,
    description: 'High-definition cinema stream with fast cloud player',
    supportsTv: false,
    buildEmbedUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }: ProviderUrlParams) => {
      if (mediaType === 'tv') {
        // CineSRC TV endpoints cannot be confirmed; do not send TV IDs to movie endpoint.
        // Safely preserve TV playback via verified NexStream TV stream.
        return buildNexStreamTvUrl(tmdbId, season, episode);
      }
      return buildCineSrcMovieUrl(tmdbId);
    },
  },
  {
    id: 'nexstream',
    name: 'NexStream',
    badge: '1080p HD',
    quality: '1080p',
    isVerified: true,
    enabled: true,
    description: 'High-definition cinema stream with adaptive player',
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'hi', 'bn', 'ja', 'ko'],
    supportsTv: true,
    buildEmbedUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }: ProviderUrlParams) => {
      if (mediaType === 'tv') {
        return buildNexStreamTvUrl(tmdbId, season, episode);
      }
      return buildNexStreamMovieUrl(tmdbId);
    },
  },
];

/**
 * Returns all active, enabled streaming providers.
 */
export function getActiveStreamingProviders(): StreamingProviderConfig[] {
  return STREAMING_PROVIDERS.filter((provider) => provider.enabled);
}

/**
 * Resolves a streaming provider by its stable ID.
 */
export function getStreamingProviderById(id: string): StreamingProviderConfig | undefined {
  return STREAMING_PROVIDERS.find((provider) => provider.id === id && provider.enabled);
}

/**
 * Default provider ID used on initial watch page load for movies.
 */
export const DEFAULT_STREAMING_PROVIDER_ID = 'cinesrc';

/**
 * Converts a provider configuration and movie/TV parameters into a PlaybackSource object.
 */
export function buildPlaybackSourceFromProvider(
  provider: StreamingProviderConfig,
  params: ProviderUrlParams,
  reloadToken?: number
): PlaybackSource {
  const embedUrl = provider.buildEmbedUrl(params);
  return {
    id: `provider-${provider.id}-${params.tmdbId}${reloadToken ? `-${reloadToken}` : ''}`,
    name: provider.name,
    type: 'embed',
    url: embedUrl,
    quality: (provider.quality as any) || '1080p',
    isOfficial: provider.isVerified ?? true,
    badge: provider.badge || 'HD',
  };
}
