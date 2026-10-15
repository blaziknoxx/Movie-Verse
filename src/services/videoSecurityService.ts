/**
 * Movie Verse — Video Security & Source Validation Service
 * Developer — Estiaq Mehedi
 * 
 * Enforces strict URL validation, embed allowlists, and authorized streaming endpoints.
 * Integrates official NexStream embed streaming (https://api.codespecters.com/).
 */

import { PlaybackSource, PlaybackType, Movie } from '../types/movie';
import { nexstreamService } from './nexstreamService';

// Strict allowlist for approved in-app iframe embed providers
const ALLOWED_EMBED_DOMAINS = [
  'api.codespecters.com',
  'codespecters.com',
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

  // 1. NexStream Embed Provider (api.codespecters.com)
  if (hostname === 'api.codespecters.com' || hostname.endsWith('.codespecters.com')) {
    if (pathname.startsWith('/embed/')) {
      return {
        isValid: true,
        sanitizedUrl: parsed.toString(),
        type: 'embed',
        providerName: 'NexStream',
        canEmbedInIframe: true,
      };
    }
  }

  // 2. Check for approved YouTube domains & extract embed URL
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

  // 3. Check for approved Vimeo domains
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

  // 4. Check for Internet Archive embeds
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

  // 5. Check for HLS (HTTP Live Streaming) .m3u8 playlist
  if (pathname.endsWith('.m3u8') || parsed.search.toLowerCase().includes('.m3u8')) {
    return {
      isValid: true,
      sanitizedUrl: parsed.toString(),
      type: 'hls',
      providerName: 'HLS Live Stream',
      canEmbedInIframe: false,
    };
  }

  // 6. Check for direct MP4 / WebM / OGG video file
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

  // 7. General external destination
  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
    type: 'webpage',
    providerName: hostname,
    canEmbedInIframe: false,
  };
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

export interface ResolveSourceOptions {
  isTv?: boolean;
  season?: number;
  episode?: number;
  apiKey?: string;
}

/**
 * Resolves all authorized playback sources for a given movie or TV episode using NexStream.
 * Strictly uses authentic TMDB ID.
 */
export function resolveMoviePlaybackSources(
  movie: Movie,
  options: ResolveSourceOptions = {}
): PlaybackSource[] {
  const sources: PlaybackSource[] = [];

  // Determine actual numeric TMDB ID
  const rawTmdb = movie.tmdbId ?? (Number(movie.id) ? Number(movie.id) : null);
  const cleanTmdbId = nexstreamService.parseTmdbId(rawTmdb);

  const isTv = options.isTv ?? (
    movie.mediaType === 'tv' ||
    (movie.duration && (movie.duration.toLowerCase().includes('series') || movie.duration.toLowerCase().includes('ep')))
  );

  const season = Math.max(1, options.season || 1);
  const episode = Math.max(1, options.episode || 1);

  if (cleanTmdbId) {
    if (isTv) {
      const tvUrl = nexstreamService.buildTvEmbedUrl(cleanTmdbId, season, episode, options.apiKey);
      if (tvUrl) {
        sources.push({
          id: `nexstream-tv-${cleanTmdbId}-s${season}e${episode}`,
          name: `NexStream Server 1 (S${season}:E${episode})`,
          type: 'embed',
          url: tvUrl,
          quality: '1080p',
          isOfficial: true,
          badge: 'NexStream HD',
          note: `Live high-definition TV stream via NexStream (TMDB ${cleanTmdbId}, Season ${season}, Episode ${episode}).`,
        });
      }
    } else {
      const movieUrl = nexstreamService.buildMovieEmbedUrl(cleanTmdbId, options.apiKey);
      if (movieUrl) {
        sources.push({
          id: `nexstream-movie-${cleanTmdbId}`,
          name: 'NexStream Server 1 (Full Movie)',
          type: 'embed',
          url: movieUrl,
          quality: '1080p',
          isOfficial: true,
          badge: 'NexStream HD',
          note: `High-definition movie stream via NexStream (TMDB ID ${cleanTmdbId}).`,
        });
      }
    }
  }

  // Official Studio Trailer (YouTube)
  if (movie.trailerKey) {
    sources.push({
      id: 'source-trailer-embed',
      name: 'Official Studio Preview (Trailer)',
      type: 'embed',
      url: getYouTubeEmbedUrl(movie.trailerKey, false),
      quality: '1080p',
      isOfficial: true,
      badge: 'Official Trailer',
      note: 'Verified studio video preview embedded via YouTube No-Cookie.',
    });
  }

  // Custom movie sources if defined
  if (Array.isArray(movie.sources)) {
    for (const customSrc of movie.sources) {
      if (customSrc && customSrc.url) {
        sources.push(customSrc);
      }
    }
  }

  return sources;
}
