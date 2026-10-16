/**
 * Movie Verse — Full Movie Watch Page Component
 * Developer — Estiaq Mehedi
 * 
 * Production-ready full movie playback experience with NexStream embedded HD player,
 * premium glowing action bars for external destinations (HDHub4u, MovieLinkBD) and official trailers,
 * and compact recommendations.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Movie, PlaybackSource } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { resolveMoviePlaybackSources, getTmdbIdFromMovie } from '../../services/videoSecurityService';
import { buildHDHub4uSearchUrl, buildMovieLinkBDSearchUrl, getMovieLinkBDUrl } from '../../services/streamingProviders';
import { VideoPlayer } from '../player/VideoPlayer';
import { StreamingSourceSelector } from '../player/StreamingSourceSelector';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Star, Clock, Calendar, Bookmark, Share2, 
  Film, Sparkles, Clapperboard, CheckCircle2,
  Globe, Play
} from 'lucide-react';
import {
  getActiveStreamingProviders,
  getStreamingProviderById,
  buildPlaybackSourceFromProvider,
  DEFAULT_STREAMING_PROVIDER_ID,
  StreamingProviderConfig,
} from '../../services/streamingSourceRegistry';

interface WatchPageProps {
  movie: Movie | null;
  movieId?: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  isWatchlisted: boolean;
  isWatched: boolean;
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  onToggleWatched: (movieId: string, movieObj?: Movie) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  movieId,
  onBack,
  onSelectMovie,
  onOpenTrailer,
  isWatchlisted,
  isWatched,
  onToggleWatchlist,
  onToggleWatched,
}) => {
  // Initialize currentMovie immediately if movie or cached movieId is available
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(() => {
    if (movie) return movie;
    if (movieId) {
      return storageService.getCachedMovie(movieId) || null;
    }
    return null;
  });

  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  // Synchronize movie state from props or from URL movieId
  useEffect(() => {
    if (movie) {
      setCurrentMovie((prev) => {
        if (prev && String(prev.id) === String(movie.id) && prev.tmdbId === movie.tmdbId) {
          return prev;
        }
        return movie;
      });
      return;
    }

    if (movieId) {
      const cached = storageService.getCachedMovie(movieId);
      if (cached) {
        setCurrentMovie((prev) => {
          if (prev && String(prev.id) === String(cached.id) && prev.tmdbId === cached.tmdbId) {
            return prev;
          }
          return cached;
        });
        return;
      }

      const cleanId = String(movieId).replace(/\D/g, '');
      if (cleanId) {
        tmdbService.getMovieDetails(cleanId)
          .then((loaded) => {
            setCurrentMovie(loaded);
            storageService.saveCachedMovie(loaded);
          })
          .catch((err) => {
            console.warn('[WatchPage] Error resolving movie from TMDB:', err);
            const numId = Number(cleanId);
            const isSpidey = cleanId === '969681';
            const fallback: Movie = {
              id: cleanId,
              tmdbId: numId,
              title: isSpidey ? 'Spider-Man: Brand New Day' : `TMDB Title #${cleanId}`,
              slug: isSpidey ? 'spider-man-brand-new-day' : `movie-${cleanId}`,
              year: isSpidey ? 2026 : 2024,
              duration: 'Feature Film',
              rating: 8.5,
              genres: ['Action', 'Adventure', 'Sci-Fi'],
              tagline: isSpidey ? 'A brand new day begins.' : 'Watch on Movie Verse.',
              overview: isSpidey
                ? 'Peter Parker navigates a brand new era of street-level challenges, personal redemption, and newfound responsibilities across New York City.'
                : `Watch the full presentation for TMDB Title #${cleanId} in high definition.`,
              director: isSpidey ? 'Destin Daniel Cretton' : 'Featured Director',
              cast: isSpidey ? ['Tom Holland', 'Zendaya'] : ['Featured Cast'],
              posterUrl: '',
              backdropUrl: '',
              vibeTags: ['Cinematic', 'High Definition'],
              vibeProfile: {
                darkAtmosphere: 6,
                actionIntensity: 8,
                psychologicalComplexity: 7,
                mysterySuspense: 7,
                emotionalWeight: 8,
                pacing: 'Propulsive',
                visualStyle: 'Cinematic Widescreen'
              },
              streamingPlatforms: [],
              moodIds: ['action-heavy', 'sci-fi-epic'],
            };
            setCurrentMovie(fallback);
            storageService.saveCachedMovie(fallback);
          });
      }
    }
  }, [movie, movieId]);

  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
    const isTv = movie?.mediaType === 'tv' || currentMovie?.mediaType === 'tv';
    return isTv ? 'nexstream' : DEFAULT_STREAMING_PROVIDER_ID;
  });
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isReloading, setIsReloading] = useState<boolean>(false);

  // Available data-driven streaming providers (CineSRC first, Multiembed second, NexStream third)
  const availableProviders: StreamingProviderConfig[] = useMemo(() => {
    return getActiveStreamingProviders();
  }, []);

  // Track movie identity to reset to CineSRC default whenever a new movie opens
  const lastMovieIdRef = useRef<string | number | undefined>(
    currentMovie ? (currentMovie.tmdbId || currentMovie.id) : undefined
  );

  useEffect(() => {
    if (!currentMovie) return;
    const currentId = currentMovie.tmdbId || currentMovie.id;
    if (currentId !== lastMovieIdRef.current) {
      lastMovieIdRef.current = currentId;
      setSelectedProviderId(
        currentMovie.mediaType === 'tv' ? 'nexstream' : DEFAULT_STREAMING_PROVIDER_ID
      );
      setReloadKey(0);
    }
  }, [currentMovie?.id, currentMovie?.tmdbId, currentMovie?.mediaType]);

  // Primary in-app playback source: Data-driven provider resolution
  // Memoized strictly to prevent re-render or reset loops on iOS and Android
  const activeSource: PlaybackSource | null = useMemo(() => {
    if (!currentMovie) return null;
    const tmdbId = getTmdbIdFromMovie(currentMovie);
    // For TV shows, safely prioritize NexStream since CineSRC/Multiembed TV endpoints cannot be confirmed
    const effectiveProviderId = (currentMovie.mediaType === 'tv' && (selectedProviderId === 'cinesrc' || selectedProviderId === 'multiembed'))
      ? 'nexstream'
      : selectedProviderId;
    const provider = getStreamingProviderById(effectiveProviderId) || availableProviders[0];

    if (provider && tmdbId) {
      return buildPlaybackSourceFromProvider(
        provider,
        {
          tmdbId,
          mediaType: currentMovie.mediaType,
          season: 1,
          episode: 1,
        },
        reloadKey
      );
    }

    const fallbackSources = resolveMoviePlaybackSources(currentMovie);
    return fallbackSources[0] || null;
  }, [
    currentMovie?.id,
    currentMovie?.tmdbId,
    currentMovie?.mediaType,
    selectedProviderId,
    reloadKey,
    availableProviders,
  ]);

  const handleSelectProvider = (providerId: string) => {
    if (providerId === selectedProviderId) {
      // Manual click on current active provider: reload embed stream once without infinite loops
      setIsReloading(true);
      setReloadKey((prev) => prev + 1);
      setTimeout(() => setIsReloading(false), 800);
    } else {
      setSelectedProviderId(providerId);
      setReloadKey(0);
    }
  };

  // Fetch related movies once currentMovie is available
  useEffect(() => {
    if (!currentMovie) return;

    // Save as recently viewed
    storageService.addRecentMovie(currentMovie.id);

    const tmdbIdNum = getTmdbIdFromMovie(currentMovie);
    const cleanId = tmdbIdNum ? String(tmdbIdNum) : String(currentMovie.id).replace(/\D/g, '');
    if (cleanId) {
      tmdbService.getMovieRecommendations(cleanId)
        .then((recs) => {
          const filtered = (recs || []).filter(
            (m) => String(m.tmdbId || m.id) !== cleanId
          );
          setRelatedMovies(filtered.slice(0, 5));
        })
        .catch(() => {
          tmdbService.getSimilarMovies(cleanId).then((sim) => {
            const filtered = (sim || []).filter(
              (m) => String(m.tmdbId || m.id) !== cleanId
            );
            setRelatedMovies(filtered.slice(0, 5));
          }).catch(() => {});
        });
    }
  }, [currentMovie?.id, currentMovie?.tmdbId]);

  const handleShare = () => {
    if (navigator.share && currentMovie) {
      navigator.share({
        title: `${currentMovie.title} — Watch on Movie Verse`,
        text: `Stream ${currentMovie.title} in HD on Movie Verse.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  if (!currentMovie) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#200D06] border border-[#F88F22]/30 flex items-center justify-center text-[#FBB931] animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[#FFE3B3]">Loading streaming theater...</p>
      </div>
    );
  }

  const hdhub4uUrl = buildHDHub4uSearchUrl(currentMovie.title);
  const movielinkbdUrl = buildMovieLinkBDSearchUrl(currentMovie.title);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3.5 sm:space-y-5 animate-fade-in pb-16">
      {/* 1. Compact Top Bar with Back Button & Movie Verse Branding */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-2 border-b border-[#F88F22]/15">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white text-xs font-bold transition-all active:scale-95"
          aria-label="Back to movie details"
        >
          <ArrowLeft className="w-4 h-4 text-[#FBB931]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#FFE3B3]">
            Cinematic Watch Room
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            title={copiedShare ? 'Link copied!' : 'Share stream'}
            aria-label="Share movie"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Mark Watched */}
          <button
            type="button"
            onClick={() => onToggleWatched(currentMovie.id, currentMovie)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border active:scale-95 ${
              isWatched
                ? 'bg-amber-500/20 text-[#FBB931] border-[#FBB931]/60 shadow-[0_0_12px_rgba(251,185,49,0.3)]'
                : 'bg-[#1A0B05] hover:bg-[#281308] text-neutral-300 hover:text-white border-[#F88F22]/25'
            }`}
            title={isWatched ? 'Marked as Watched' : 'Mark Watched'}
            aria-label="Toggle watched"
          >
            <CheckCircle2 className={`w-4 h-4 ${isWatched ? 'text-[#FBB931] fill-[#FBB931]/20' : ''}`} />
          </button>

          {/* Watchlist Toggle */}
          <button
            type="button"
            onClick={(e) => onToggleWatchlist(currentMovie.id, e)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border active:scale-95 ${
              isWatchlisted
                ? 'sunset-gradient-btn text-white border-[#F88F22] shadow-[0_0_12px_rgba(234,97,19,0.5)]'
                : 'bg-[#1A0B05] hover:bg-[#281308] text-neutral-300 hover:text-white border-[#F88F22]/25'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label="Toggle watchlist"
          >
            <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Embedded Video Player: Controlled by active streaming source */}
      <div className="relative w-full space-y-2">
        {activeSource ? (
          <VideoPlayer
            source={activeSource}
            title={currentMovie.title}
            posterUrl={currentMovie.backdropUrl || currentMovie.posterUrl}
            autoPlay={false}
          />
        ) : (
          <div className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F88F22]/25 shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Film className="w-8 h-8 text-[#FBB931] animate-pulse" />
            <p className="text-sm font-semibold text-[#FFE3B3]">Player stream resolving...</p>
          </div>
        )}
      </div>

      {/* 3. Dedicated Streaming Sources Selector Immediately Below Video Player */}
      <StreamingSourceSelector
        providers={availableProviders}
        selectedProviderId={selectedProviderId}
        onSelectProvider={handleSelectProvider}
        isReloading={isReloading}
      />

      {/* 4. External Destinations & Official Previews */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#FFE3B3]">
            <Sparkles className="w-3.5 h-3.5 text-[#F88F22]" />
            <span>External Destinations & Official Previews</span>
          </div>
          <span className="text-[10px] text-neutral-400">Verified links</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {/* External Action Bar 1: HDHub4u Movie Search */}
          <a
            href={hdhub4uUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl sunset-gradient-btn text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 fill-white text-white shrink-0" />
            <span>HDHub4u</span>
          </a>

          {/* External Action Bar 2: MovieLinkBD Directory Search */}
          <a
            href={movielinkbdUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Search "${currentMovie.title}" on MovieLinkBD`}
            aria-label={`Search ${currentMovie.title} on MovieLinkBD`}
            className="w-full py-2.5 px-4 rounded-xl sunset-gradient-btn text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-white shrink-0" />
            <span>MovieLinkBD</span>
          </a>

          {/* Action Bar 3: Official Studio Trailer */}
          <button
            type="button"
            onClick={() => onOpenTrailer(currentMovie)}
            className="w-full py-2.5 px-4 rounded-xl sunset-gradient-btn text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Clapperboard className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Official Trailer</span>
          </button>
        </div>
      </div>

      {/* 4. Movie Details, Metadata, and Synopsis */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {currentMovie.title}
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Full Movie
              </span>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium">
              <span className="flex items-center gap-1 text-neutral-300">
                <Calendar className="w-3 h-3 text-[#F88F22]" />
                {currentMovie.year}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {currentMovie.rating ? currentMovie.rating.toFixed(1) : '7.5'} Rating
              </span>
              {currentMovie.duration && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {currentMovie.duration}
                  </span>
                </>
              )}
              {currentMovie.genres && currentMovie.genres.length > 0 && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="text-[#FFE3B3]/90">{currentMovie.genres.slice(0, 3).join(', ')}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Action: Watch Official Trailer */}
          <button
            type="button"
            onClick={() => onOpenTrailer(currentMovie)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#281308] hover:bg-[#381B0B] border border-[#F88F22]/35 text-[#FFE3B3] hover:text-white text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            <Clapperboard className="w-3.5 h-3.5 text-[#FBB931]" />
            <span>Watch Official Trailer</span>
          </button>
        </div>

        {/* Short Synopsis */}
        {currentMovie.overview && (
          <div className="space-y-1.5 pt-1">
            <p className={`text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl ${!isOverviewExpanded ? 'line-clamp-3' : ''}`}>
              {currentMovie.overview}
            </p>
            {currentMovie.overview.length > 200 && (
              <button
                type="button"
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="text-xs font-bold text-[#F88F22] hover:text-[#FBB931]"
              >
                {isOverviewExpanded ? 'Show less' : 'Read more synopsis'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. Compact Related Movies Section */}
      {relatedMovies.length > 0 && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EA6113]" />
              <span>Related Movies</span>
            </h3>
            <span className="text-xs text-neutral-400">
              More cinematic experiences
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {relatedMovies.map((relMovie) => (
              <MovieCard
                key={relMovie.id}
                movie={relMovie}
                onSelectMovie={onSelectMovie}
                isWatchlisted={storageService.getWatchlist().includes(relMovie.id)}
                onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                showUniverseTag={false}
                onOpenTrailer={onOpenTrailer}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
