/**
 * Movie Verse — Streaming Provider Architecture & Registry
 * Developer — Estiaq Mehedi
 * 
 * Scalable, data-driven provider registry supporting:
 * - Stable provider ID
 * - Display name & prominent branding
 * - Provider verification badge / label
 * - Embed URL builder or custom provider component
 * - Optional language preferences
 * - Enabled / disabled toggle
 * 
 * Initially configured with NexStream as the sole enabled source.
 * When additional providers are configured here in the future, they automatically
 * appear in the Streaming Sources section without UI alterations.
 */

import React from 'react';
import { nexstreamService } from './nexstreamService';

export interface ProviderBuildContext {
  tmdbId: number;
  title: string;
  isTv?: boolean;
  season?: number;
  episode?: number;
  apiKey?: string;
}

export interface StreamingProviderConfig {
  /** Stable provider ID (e.g. 'nexstream') */
  id: string;
  /** Display name shown prominently as the main text */
  name: string;
  /** Provider badge/label (e.g. 'Verified HD', 'Official Stream') */
  badgeLabel: string;
  /** Clean summary description */
  description?: string;
  /** Enabled/disabled state */
  enabled: boolean;
  /** Supported media classifications */
  supportedMediaTypes?: ('movie' | 'tv')[];
  /** Optional language preferences / supported audio */
  languagePreferences?: string[];
  /** Dynamic embed URL builder function */
  buildEmbedUrl: (context: ProviderBuildContext) => string | null;
  /** Optional provider-specific embed component if non-standard iframe needed */
  customEmbedComponent?: React.ComponentType<{
    context: ProviderBuildContext;
    onLoad?: () => void;
    onError?: (err: any) => void;
  }>;
}

/**
 * Global provider registry.
 * NexStream is the single active provider in this implementation.
 */
export const STREAMING_PROVIDERS: StreamingProviderConfig[] = [
  {
    id: 'nexstream',
    name: 'NexStream',
    badgeLabel: 'Verified HD',
    description: 'High-definition fast streaming with multi-audio & subtitles',
    enabled: true,
    supportedMediaTypes: ['movie', 'tv'],
    languagePreferences: ['English', 'Multi-Audio', 'Regional'],
    buildEmbedUrl: ({ tmdbId, isTv, season = 1, episode = 1, apiKey }) => {
      const cleanId = nexstreamService.parseTmdbId(tmdbId);
      if (!cleanId) return null;

      if (isTv) {
        return nexstreamService.buildTvEmbedUrl(cleanId, season, episode, apiKey);
      }
      return nexstreamService.buildMovieEmbedUrl(cleanId, apiKey);
    },
  },
  // Future providers can be registered here:
  // e.g. { id: 'stream-alpha', name: 'AlphaStream', badgeLabel: 'Verified 4K', enabled: false, buildEmbedUrl: ... }
];

/**
 * Returns all currently active and enabled providers.
 */
export function getActiveStreamingProviders(): StreamingProviderConfig[] {
  return STREAMING_PROVIDERS.filter((provider) => provider.enabled);
}

/**
 * Looks up a specific provider configuration by stable ID.
 */
export function getStreamingProviderById(id: string): StreamingProviderConfig | undefined {
  return STREAMING_PROVIDERS.find((provider) => provider.id === id && provider.enabled);
}

/**
 * Default fallback provider ID.
 */
export const DEFAULT_PROVIDER_ID = 'nexstream';
