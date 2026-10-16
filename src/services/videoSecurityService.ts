/**
 * Movie Verse — Video Security & Source Validation Service
 * Developer — Estiaq Mehedi
 * 
 * Enforces strict URL validation, embed allowlists, privacy-preserving embed transformation,
 * and clear separation between playable media streams (MP4/HLS) and external webpage links.
 */

import { PlaybackSource, PlaybackType, Movie } from '../types/movie';
import { buildHDHub4uSearchUrl, getMovieLinkBDUrl } from './streamingProviders';
import { buildNexStreamMovieUrl, NEXSTREAM_CONFIG } from './nexstreamService';
import { buildCineSrcMovieUrl, buildMultiembedMovieUrl } from './streamingSourceRegistry';
import { storageService } from './storageService';

// Strict allowlist for approved in-app iframe embed providers
const ALLOWED_EMBED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
  'archive.org',
  'www.archive.org',
  'api.codespecters.com',
  'codespecters.com',
  'cinesrc.st',
  'www.cinesrc.st',
  'multiembed.mov',
  'www.multiembed.mov',
];

export interface ValidationResult {
  isValid: boolean;
  sanitizedUrl: string;
  type: PlaybackType;
  providerName: string;
  errorMessage?: string;
  canEmbedInIframe: boolean;
}

/**
 * Validates a video or destination URL against security rules and content classifications.
 */
export function validatePlaybackUrl(rawUrl: string): ValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      sanitizedUrl: '',
      type: 'webpage',
      providerName: 'Unknown',
      errorMessage: 'Empty or missing URL string',
      canEmbedInIframe: false,
    };
  }

  const trimmed = rawUrl.trim();

  // Explicitly reject dangerous or unauthorized pseudo-protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:')
  ) {
    return {
      isValid: false,
      sanitizedUrl: '',
      type: 'webpage',
      providerName: 'Blocked Protocol',
      errorMessage: 'Security violation: Unsafe URL scheme rejected',
      canEmbedInIframe: false,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      sanitizedUrl: '',
      type: 'webpage',
      providerName: 'Invalid URL',
      errorMessage: 'Malformed URL format',
      canEmbedInIframe: false,
    };
  }

  // Accept HTTPS by default (permit localhost HTTP for development testing)
  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !isLocal) {
    return {
      isValid: false,
      sanitizedUrl: '',
      type: 'webpage',
      providerName: 'Insecure Protocol',
      errorMessage: 'Insecure HTTP URLs are blocked. HTTPS is required.',
      canEmbedInIframe: false,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  // 1. Check for HLS (HTTP Live Streaming) .m3u8 playlist
  if (pathname.endsWith('.m3u8') || parsed.search.toLowerCase().includes('.m3u8')) {
    return {
      isValid: true,
      sanitizedUrl: parsed.toString(),
      type: 'hls',
      providerName: 'HLS Live Stream',
      canEmbedInIframe: false,
    };
  }

  // 2. Check for direct MP4 / WebM / OGG video file
  if (
    pathname.endsWith('.mp4') ||
    pathname.endsWith('.webm') ||
    pathname.endsWith('.ogg') ||
    pathname.endsWith('.mov') ||
    parsed.search.toLowerCase().includes('.mp4')
  ) {
    return {
      isValid: true,
      sanitizedUrl: parsed.toString(),
      type: 'mp4',
      providerName: 'Direct Video Stream',
      canEmbedInIframe: false,
    };
  }

  // 3. Check for approved YouTube domains & extract embed URL
  if (
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname === 'm.youtube.com' ||
    hostname === 'youtu.be' ||
    hostname === 'youtube-nocookie.com' ||
    hostname === 'www.youtube-nocookie.com'
  ) {
    let videoId: string | null = null;
    if (hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0];
    } else if (parsed.searchParams.has('v')) {
      videoId = parsed.searchParams.get('v');
    } else if (pathname.startsWith('/embed/')) {
      videoId = pathname.replace('/embed/', '').split('/')[0];
    }

    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return {
        isValid: true,
        sanitizedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
        type: 'embed',
        providerName: 'YouTube Official',
        canEmbedInIframe: true,
      };
    }
  }

  // 4. Check for approved Vimeo domains
  if (hostname.includes('vimeo.com')) {
    const idMatch = pathname.match(/\/(\d+)/);
    if (idMatch && idMatch[1]) {
      return {
        isValid: true,
        sanitizedUrl: `https://player.vimeo.com/video/${idMatch[1]}?autoplay=1&title=0&byline=0`,
        type: 'embed',
        providerName: 'Vimeo Video',
        canEmbedInIframe: true,
      };
    }
  }

  // 5. Check for approved Internet Archive embeds
  if (hostname.includes('archive.org')) {
    if (pathname.startsWith('/embed/')) {
      return {
        isValid: true,
        sanitizedUrl: parsed.toString(),
        type: 'embed',
        providerName: 'Internet Archive',
        canEmbedInIframe: true,
      };
    }
  }

  // 6. Check for approved CineSRC embeds (cinesrc.st)
  if (
    hostname === 'cinesrc.st' ||
    hostname === 'www.cinesrc.st' ||
    hostname.endsWith('.cinesrc.st')
  ) {
    if (pathname.startsWith('/embed/')) {
      return {
        isValid: true,
        sanitizedUrl: parsed.toString(),
        type: 'embed',
        providerName: 'CineSRC',
        canEmbedInIframe: true,
      };
    }
  }

  // 7. Check for approved Multiembed embeds (multiembed.mov)
  if (
    hostname === 'multiembed.mov' ||
    hostname === 'www.multiembed.mov' ||
    hostname.endsWith('.multiembed.mov')
  ) {
    const videoId = parsed.searchParams.get('video_id');
    const cleanId = videoId ? videoId.trim().replace(/\D/g, '') : '';
    if (cleanId) {
      // Re-construct sanitized canonical URL preserving tmdb=1
      const sanitized = new URL('https://multiembed.mov/');
      sanitized.searchParams.set('video_id', cleanId);
      sanitized.searchParams.set('tmdb', '1');
      return {
        isValid: true,
        sanitizedUrl: sanitized.toString(),
        type: 'embed',
        providerName: 'Multiembed',
        canEmbedInIframe: true,
      };
    }
  }

  // 8. Check for approved NexStream embeds (api.codespecters.com)
  if (
    hostname === 'api.codespecters.com' ||
    hostname === 'codespecters.com' ||
    hostname.endsWith('.codespecters.com')
  ) {
    if (pathname.startsWith('/embed/')) {
      return {
        isValid: true,
        sanitizedUrl: parsed.toString(),
        type: 'embed',
        providerName: NEXSTREAM_CONFIG.providerName,
        canEmbedInIframe: true,
      };
    }
  }

  // 8. External webpage links (HDHub4u, MovieLinkBD, external portals)
  // These are valid HTTPS links but CANNOT and MUST NOT be embedded in an iframe.
  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
    type: 'webpage',
    providerName: hostname,
    canEmbedInIframe: false,
  };
}

/**
 * Safely extracts the numeric TMDB ID from a movie record.
 */
export function getTmdbIdFromMovie(movie?: Movie | null): number | null {
  if (!movie) return null;
  if (movie.tmdbId && !isNaN(Number(movie.tmdbId)) && Number(movie.tmdbId) > 0) {
    return Number(movie.tmdbId);
  }
  if (movie.id && /^\d+$/.test(String(movie.id).trim())) {
    return Number(movie.id);
  }
  if (movie.id) {
    try {
      const cached = storageService.getCachedMovie(movie.id);
      if (cached?.tmdbId && !isNaN(Number(cached.tmdbId)) && Number(cached.tmdbId) > 0) {
        return Number(cached.tmdbId);
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Builds the canonical YouTube embed URL from an 11-char video key.
 */
export function getYouTubeEmbedUrl(key: string, autoplay = true): string {
  const cleanKey = key.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanKey) return '';
  const autoParam = autoplay ? '1' : '0';
  return `https://www.youtube-nocookie.com/embed/${cleanKey}?autoplay=${autoParam}&rel=0&modestbranding=1`;
}

/**
 * High-performance, public-domain & creative-commons test media streams
 * preserved for testing or fallback reference.
 */
export const VERIFIED_TEST_STREAMS = {
  // Sintel / Tears of Steel multi-bitrate HLS stream
  hlsStream: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  // Big Buck Bunny 1080p MP4 direct video stream
  directMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  // Alternative MP4
  backupMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
};

/**
 * Resolves all authorized playback sources for a given movie.
 * NexStream is the single embedded player used for internal movie playback,
 * dynamically resolved from the movie's authentic TMDB ID.
 * Redundant internal server cards (HLS, MP4, and TMDB Preview embed) have been removed.
 */
export function resolveMoviePlaybackSources(movie: Movie): PlaybackSource[] {
  const sources: PlaybackSource[] = [];
  const tmdbId = getTmdbIdFromMovie(movie);

  // Primary In-App Players: CineSRC (Default), Multiembed, and NexStream
  if (tmdbId) {
    sources.push({
      id: `source-cinesrc-${tmdbId}`,
      name: 'CineSRC',
      type: 'embed',
      url: buildCineSrcMovieUrl(tmdbId),
      quality: '1080p',
      isOfficial: true,
      badge: 'CineSRC HD',
      note: `Stream dynamically generated from TMDB ID: ${tmdbId}. Powered by CineSRC engine.`,
    });
    sources.push({
      id: `source-multiembed-${tmdbId}`,
      name: 'Multiembed',
      type: 'embed',
      url: buildMultiembedMovieUrl(tmdbId),
      quality: '1080p',
      isOfficial: true,
      badge: 'Multiembed HD',
      note: `Stream dynamically generated from TMDB ID: ${tmdbId}. Powered by Multiembed engine.`,
    });
    sources.push({
      id: `source-nexstream-${tmdbId}`,
      name: 'NexStream HD Cinema Player',
      type: 'embed',
      url: buildNexStreamMovieUrl(tmdbId),
      quality: '1080p',
      isOfficial: true,
      badge: 'NexStream HD',
      note: `Stream dynamically generated from TMDB ID: ${tmdbId}. Powered by NexStream engine.`,
    });
  }

  // Preserve any custom sources explicitly defined on the movie object
  // (filtering out the 3 removed internal test sources if present)
  if (Array.isArray(movie.sources)) {
    for (const customSrc of movie.sources) {
      if (
        customSrc &&
        customSrc.url &&
        customSrc.id !== 'source-hls-auto' &&
        customSrc.id !== 'source-mp4-1080p' &&
        customSrc.id !== 'source-trailer-embed'
      ) {
        sources.push(customSrc);
      }
    }
  }

  return sources;
}
