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
  buildEmbedUrl: (params: ProviderUrlParams) => string;
}

/**
 * Data-driven registry of streaming providers.
 * To add future providers, simply append a configuration object with enabled: true.
 * Initial implementation registers NexStream as the active embedded provider.
 */
export const STREAMING_PROVIDERS: StreamingProviderConfig[] = [
  {
    id: 'nexstream',
    name: 'NexStream',
    badge: '1080p HD',
    quality: '1080p',
    isVerified: true,
    enabled: true,
    description: 'High-definition cinema stream with adaptive player',
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'hi', 'bn', 'ja', 'ko'],
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
 * Default provider ID used on initial watch page load.
 */
export const DEFAULT_STREAMING_PROVIDER_ID = 'nexstream';

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
    id: `provider-${provider.id}${reloadToken ? `-${reloadToken}` : ''}`,
    name: provider.name,
    type: 'embed',
    url: embedUrl,
    quality: (provider.quality as any) || '1080p',
    isOfficial: provider.isVerified ?? true,
    badge: provider.badge || 'HD',
  };
}
