/**
 * Movie Verse — Official Trailer Page Component
 * Developer — Estiaq Mehedi
 * 
 * Dedicated official trailer streaming page featuring a responsive 16:9 player,
 * authentic TMDB video resolution, elegant empty state, and compact "More Like This" recommendations.
 */

import React, { useState, useEffect } from 'react';
import { Movie, PlaybackSource } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { getYouTubeEmbedUrl } from '../../services/videoSecurityService';
import { VideoPlayer } from '../player/VideoPlayer';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Star, Clock, Calendar, Bookmark, Share2, 
  Play, Film, Sparkles, ExternalLink, Clapperboard, ChevronRight 
} from 'lucide-react';

interface TrailerPageProps {
  movie: Movie | null;
  movieId?: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenWatch: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
}

export const TrailerPage: React.FC<TrailerPageProps> = ({
  movie,
  movieId,
  onBack,
  onSelectMovie,
  onOpenWatch,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(movie);
  const [trailerSource, setTrailerSource] = useState<PlaybackSource | null>(null);
  const [availableTrailers, setAvailableTrailers] = useState<{ key: string; name: string; type: string }[]>([]);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(true);
  const [hasNoTrailer, setHasNoTrailer] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);

  // If movie prop is not supplied but movieId is provided (e.g. from URL refresh), resolve movie
  useEffect(() => {
    if (movie) {
      setCurrentMovie(movie);
      return;
    }

    if (movieId) {
      const cached = storageService.getCachedMovie(movieId);
      if (cached) {
        setCurrentMovie(cached);
        return;
      }

      // Fetch from TMDB if not in local cache
      const cleanId = String(movieId).replace(/\D/g, '');
      if (cleanId) {
        tmdbService.getMovieDetails(cleanId)
          .then((loaded) => {
            setCurrentMovie(loaded);
            storageService.saveCachedMovie(loaded);
          })
          .catch((err) => {
            console.warn('[TrailerPage] Could not load movie metadata:', err);
          });
      }
    }
  }, [movie, movieId]);

  // Fetch official videos & similar movies for the selected title
  useEffect(() => {
    if (!currentMovie) return;

    let isMounted = true;
    setIsLoadingTrailer(true);
    setHasNoTrailer(false);

    const cleanId = String(currentMovie.tmdbId || currentMovie.id).replace(/\D/g, '');

    // If movie already has a verified trailerKey attached
    if (currentMovie.trailerKey) {
      const src: PlaybackSource = {
        id: 'tmdb-trailer',
        name: `${currentMovie.title} — Official Trailer`,
        type: 'embed',
        url: getYouTubeEmbedUrl(currentMovie.trailerKey, true),
        quality: '1080p',
        isOfficial: true,
        badge: 'Official Preview',
      };
      setTrailerSource(src);
      setIsLoadingTrailer(false);
    }

    // Always query TMDB videos endpoint to check for alternative teasers and confirm official trailer
    if (cleanId) {
      Promise.all([
        tmdbService.getMovieVideos(cleanId).catch(() => []),
        tmdbService.getSimilarMovies(cleanId).catch(() => []),
      ]).then(([videos, similar]) => {
        if (!isMounted) return;

        if (Array.isArray(videos) && videos.length > 0) {
          const ytVideos = videos.filter((v: any) => v.site === 'YouTube');
          setAvailableTrailers(ytVideos);

          const officialTrailer =
            ytVideos.find((v: any) => v.type === 'Trailer') ||
            ytVideos.find((v: any) => v.type === 'Teaser') ||
            ytVideos.find((v: any) => v.type === 'Clip') ||
            ytVideos[0];

          if (officialTrailer && officialTrailer.key) {
            const src: PlaybackSource = {
              id: `trailer-${officialTrailer.key}`,
              name: officialTrailer.name || `${currentMovie.title} — Official Preview`,
              type: 'embed',
              url: getYouTubeEmbedUrl(officialTrailer.key, true),
              quality: '1080p',
              isOfficial: true,
              badge: officialTrailer.type || 'Official',
            };
            setTrailerSource(src);
            setHasNoTrailer(false);

            // Update cached movie with key
            if (!currentMovie.trailerKey) {
              const updated = { ...currentMovie, trailerKey: officialTrailer.key };
              setCurrentMovie(updated);
              storageService.saveCachedMovie(updated);
            }
          } else if (!currentMovie.trailerKey) {
            setHasNoTrailer(true);
            setTrailerSource(null);
          }
        } else if (!currentMovie.trailerKey) {
          setHasNoTrailer(true);
          setTrailerSource(null);
        }

        // Set compact similar movies (filtered)
        const filteredSimilar = (similar || []).filter(
          (m) => String(m.tmdbId || m.id) !== cleanId
        );
        setRelatedMovies(filteredSimilar.slice(0, 5));
      }).catch((err) => {
        console.warn('[TrailerPage] Error resolving trailer:', err);
        if (isMounted && !currentMovie.trailerKey) {
          setHasNoTrailer(true);
        }
      }).finally(() => {
        if (isMounted) setIsLoadingTrailer(false);
      });
    } else if (!currentMovie.trailerKey) {
      setHasNoTrailer(true);
      setIsLoadingTrailer(false);
    }

    return () => {
      isMounted = false;
    };
  }, [currentMovie]);

  const handleShare = () => {
    if (navigator.share && currentMovie) {
      navigator.share({
        title: `${currentMovie.title} — Official Trailer`,
        text: `Watch the official trailer for ${currentMovie.title} on Movie Verse.`,
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
          <Clapperboard className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[#FFE3B3]">Loading movie trailer...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
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
          <span className="w-2 h-2 rounded-full bg-[#EA6113] animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#FFE3B3] hidden sm:inline">
            Official Trailer Hub
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            title={copiedShare ? 'Link copied!' : 'Share trailer'}
            aria-label="Share trailer"
          >
            <Share2 className="w-4 h-4" />
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

      {/* 2. Large 16:9 Cinematic Video Player or Premium Empty State */}
      <div className="relative w-full">
        {hasNoTrailer ? (
          /* Premium Empty State when no official trailer exists */
          <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#220E06] via-[#140804] to-[#0A0402] border border-[#F88F22]/30 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center overflow-hidden sunset-card-glow">
            <div className="absolute w-72 h-72 rounded-full bg-[#EA6113]/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#2C1409] border border-[#F88F22]/40 flex items-center justify-center mx-auto text-[#FBB931] shadow-[0_0_20px_rgba(234,97,19,0.3)]">
                <Film className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                  No Official Trailer Indexed for This Title
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  An official video trailer has not yet been submitted to TMDB archives for <strong className="text-[#FFE3B3]">{currentMovie.title}</strong> ({currentMovie.year}). You can return to movie details or search YouTube directly.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Movie Details</span>
                </button>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentMovie.title + ' official trailer ' + currentMovie.year)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-bold shadow-lg transition-all active:scale-95"
                >
                  <span>Search YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : trailerSource ? (
          <VideoPlayer
            source={trailerSource}
            title={currentMovie.title}
            posterUrl={currentMovie.backdropUrl || currentMovie.posterUrl}
            autoPlay={true}
          />
        ) : null}

        {/* Video Cut Selector (if multiple trailers/clips exist) */}
        {availableTrailers.length > 1 && !hasNoTrailer && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
            <span className="text-[11px] font-bold text-[#FBB931] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Clapperboard className="w-3 h-3 text-[#F88F22]" />
              <span>Available Cuts:</span>
            </span>
            {availableTrailers.map((vid) => (
              <button
                key={vid.key}
                type="button"
                onClick={() => {
                  setTrailerSource({
                    id: `trailer-${vid.key}`,
                    name: vid.name,
                    type: 'embed',
                    url: getYouTubeEmbedUrl(vid.key, true),
                    quality: '1080p',
                    isOfficial: true,
                    badge: vid.type || 'Trailer',
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
                  trailerSource?.id === `trailer-${vid.key}`
                    ? 'sunset-gradient-btn text-white shadow-md'
                    : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
                }`}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span className="max-w-[160px] truncate">{vid.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Movie Title, Metadata, Fast Full-Movie CTA, and Synopsis */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {currentMovie.title}
              </h1>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-bold text-[#FFE3B3] uppercase tracking-wider">
                Official Trailer
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

          {/* Jump to Full Movie Watch Page */}
          <button
            type="button"
            onClick={() => onOpenWatch(currentMovie)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sunset-gradient-btn text-white text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Watch Full Movie</span>
          </button>
        </div>

        {/* Short Synopsis */}
        {currentMovie.overview && (
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl pt-1">
            {currentMovie.overview}
          </p>
        )}
      </div>

      {/* 4. Compact "More Like This" Row */}
      {relatedMovies.length > 0 && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EA6113]" />
              <span>More Like This</span>
            </h3>
            <span className="text-xs text-neutral-400">
              Related cinematic titles
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
                onOpenTrailer={() => {
                  setCurrentMovie(relMovie);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
