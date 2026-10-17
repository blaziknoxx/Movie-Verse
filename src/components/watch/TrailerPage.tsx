/**
 * Movie Verse — Official Trailer Page Component
 * Developer — Estiaq Mehedi
 * 
 * Dedicated official trailer viewing experience featuring:
 * - Responsive 16:9 YouTube trailer player with authentic TMDB video resolution
 * - Cut selection for teaser/trailer when multiple official cuts exist
 * - Elegant "Trailer Unavailable" fallback with direct YouTube search link
 * - Polished collection of movie detail cards (Poster, Director, Cast, Release Date, Runtime, Rating, Synopsis)
 * - Navigation to Where to Watch external directory options
 * - "More Like This" cinematic recommendations
 */

import React, { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { getYouTubeEmbedUrl } from '../../services/videoSecurityService';
import { MovieCard } from '../discover/MovieCard';
import { CastSection } from '../cast/CastSection';
import { 
  ArrowLeft, Star, Clock, Calendar, Bookmark, Share2, 
  Play, Film, Sparkles, ExternalLink, Clapperboard, 
  User, CheckCircle2, Tv, Tag, Info
} from 'lucide-react';

interface TrailerPageProps {
  movie: Movie | null;
  movieId?: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenWatch: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  onSelectPerson?: (personId: number) => void;
}

interface TrailerVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export const TrailerPage: React.FC<TrailerPageProps> = ({
  movie,
  movieId,
  onBack,
  onSelectMovie,
  onOpenWatch,
  isWatchlisted,
  onToggleWatchlist,
  onSelectPerson,
}) => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(movie);
  const [selectedTrailerKey, setSelectedTrailerKey] = useState<string | null>(null);
  const [availableTrailers, setAvailableTrailers] = useState<TrailerVideo[]>([]);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(true);
  const [hasNoTrailer, setHasNoTrailer] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  // Synchronize movie from props or fetch from TMDB if accessed via URL / refresh
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

  // Ensure full movie details (director, cast, releaseDate) are resolved
  useEffect(() => {
    if (!currentMovie) return;
    const cleanId = String(currentMovie.tmdbId || currentMovie.id).replace(/\D/g, '');
    if (!cleanId) return;

    if (!currentMovie.director || !currentMovie.cast || currentMovie.cast.length === 0) {
      tmdbService.getMovieDetails(cleanId)
        .then((full) => {
          if (full) {
            const merged = { ...currentMovie, ...full };
            setCurrentMovie(merged);
            storageService.saveCachedMovie(merged);
          }
        })
        .catch(() => {});
    }
  }, [currentMovie]);

  // Fetch official videos & similar movies for the selected title
  useEffect(() => {
    if (!currentMovie) return;

    let isMounted = true;
    setIsLoadingTrailer(true);
    setHasNoTrailer(false);

    const cleanId = String(currentMovie.tmdbId || currentMovie.id).replace(/\D/g, '');

    // Check pre-attached trailer key
    if (currentMovie.trailerKey) {
      setSelectedTrailerKey(currentMovie.trailerKey);
    }

    if (cleanId) {
      Promise.all([
        tmdbService.getMovieVideos(cleanId).catch(() => []),
        tmdbService.getSimilarMovies(cleanId).catch(() => []),
      ]).then(([videos, similar]) => {
        if (!isMounted) return;

        if (Array.isArray(videos) && videos.length > 0) {
          const ytVideos: TrailerVideo[] = videos.filter((v: any) => v.site === 'YouTube');
          setAvailableTrailers(ytVideos);

          // Prioritize official trailer > teaser > clip
          const officialTrailer =
            ytVideos.find((v) => v.type === 'Trailer' && v.official) ||
            ytVideos.find((v) => v.type === 'Trailer') ||
            ytVideos.find((v) => v.type === 'Teaser') ||
            ytVideos.find((v) => v.type === 'Clip') ||
            ytVideos[0];

          if (officialTrailer && officialTrailer.key) {
            setSelectedTrailerKey(officialTrailer.key);
            setHasNoTrailer(false);

            if (!currentMovie.trailerKey) {
              const updated = { ...currentMovie, trailerKey: officialTrailer.key };
              setCurrentMovie(updated);
              storageService.saveCachedMovie(updated);
            }
          } else if (!currentMovie.trailerKey) {
            setHasNoTrailer(true);
            setSelectedTrailerKey(null);
          }
        } else if (!currentMovie.trailerKey) {
          setHasNoTrailer(true);
          setSelectedTrailerKey(null);
        }

        // Set similar movies
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
  }, [currentMovie?.id, currentMovie?.tmdbId]);

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
      
      {/* 1. Header with Back Button, Title Anchor, Share, and Watchlist */}
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
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#FFE3B3] flex items-center gap-1.5">
            <Clapperboard className="w-3.5 h-3.5 text-[#F88F22]" />
            <span>Official Trailer Hub</span>
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

      {/* 2. Movie Title & Essential Details Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {currentMovie.title}
            </h1>
            {currentMovie.year && (
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-[#FFE3B3]">
                {currentMovie.year}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium">
            <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {currentMovie.rating ? currentMovie.rating.toFixed(1) : '7.5'} Rating
            </span>
            {currentMovie.duration && (
              <>
                <span className="text-neutral-600">·</span>
                <span className="flex items-center gap-1 text-neutral-300">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
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

        {/* CTA: Go to External Watch Page */}
        <button
          type="button"
          onClick={() => onOpenWatch(currentMovie)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Tv className="w-4 h-4" />
          <span>Explore Where to Watch</span>
        </button>
      </div>

      {/* 3. Responsive 16:9 YouTube Trailer Player or Elegant Fallback */}
      <div className="relative w-full space-y-3">
        {hasNoTrailer ? (
          /* Elegant "Trailer Unavailable" Card */
          <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#220E06] via-[#140804] to-[#0A0402] border border-[#F88F22]/30 shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 text-center overflow-hidden sunset-card-glow">
            <div className="absolute w-72 h-72 rounded-full bg-[#EA6113]/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#2C1409] border border-[#F88F22]/40 flex items-center justify-center mx-auto text-[#FBB931] shadow-[0_0_20px_rgba(234,97,19,0.3)]">
                <Film className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                  Official Trailer Unavailable in Archives
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  An official video trailer is not currently indexed in TMDB records for <strong className="text-[#FFE3B3]">{currentMovie.title}</strong> ({currentMovie.year || 'Cinema'}). You can search YouTube directly or return to movie details.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-all active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Details</span>
                </button>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentMovie.title + ' official trailer ' + (currentMovie.year || ''))}`}
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
        ) : selectedTrailerKey ? (
          /* Responsive 16:9 YouTube Embed */
          <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-[#F88F22]/30 shadow-[0_16px_50px_rgba(0,0,0,0.95)] sunset-card-glow">
            <iframe
              src={getYouTubeEmbedUrl(selectedTrailerKey, true)}
              title={`${currentMovie.title} — Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              loading="eager"
              className="w-full h-full border-0"
            />
          </div>
        ) : isLoadingTrailer ? (
          <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl bg-[#140804] border border-[#F88F22]/20 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#F88F22] border-t-transparent animate-spin" />
            <span className="text-xs text-neutral-300">Resolving official trailer video...</span>
          </div>
        ) : null}

        {/* Video Cut Selector (when multiple official trailers/teasers exist) */}
        {availableTrailers.length > 1 && !hasNoTrailer && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 pb-1">
            <span className="text-[11px] font-bold text-[#FBB931] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Clapperboard className="w-3.5 h-3.5 text-[#F88F22]" />
              <span>Available Previews:</span>
            </span>
            {availableTrailers.map((vid) => (
              <button
                key={vid.key}
                type="button"
                onClick={() => setSelectedTrailerKey(vid.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
                  selectedTrailerKey === vid.key
                    ? 'sunset-gradient-btn text-white shadow-md'
                    : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
                }`}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span className="max-w-[170px] truncate">{vid.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Beautiful Collection of Movie Detail Cards Below the Trailer */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#EA6113]" />
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Movie Details & Production Overview
          </h2>
        </div>

        {/* Primary Showcase Card: Poster, Title, Synopsis, Director, Cast, and Release Date */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#140804]/90 border border-[#F88F22]/20 p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
            
            {/* Movie Poster */}
            {currentMovie.posterUrl && (
              <div className="w-28 sm:w-36 md:w-44 shrink-0 rounded-2xl overflow-hidden border border-[#F88F22]/30 shadow-2xl sunset-card-glow">
                <img
                  src={currentMovie.posterUrl}
                  alt={currentMovie.title}
                  className="w-full h-auto aspect-[2/3] object-cover"
                />
              </div>
            )}

            {/* Main Info Columns */}
            <div className="flex-1 space-y-4 min-w-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {currentMovie.title}
                  </h3>
                  {currentMovie.year && (
                    <span className="text-sm font-bold text-neutral-400">
                      ({currentMovie.year})
                    </span>
                  )}
                </div>

                {currentMovie.tagline && (
                  <p className="text-xs text-[#FFE3B3] italic font-serif">
                    "{currentMovie.tagline}"
                  </p>
                )}
              </div>

              {/* Badges Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {/* Rating */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">TMDB Rating</span>
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{currentMovie.rating ? currentMovie.rating.toFixed(1) : '7.5'} / 10</span>
                  </div>
                </div>

                {/* Runtime */}
                {currentMovie.duration && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Runtime</span>
                    <div className="flex items-center gap-1.5 font-bold text-neutral-200">
                      <Clock className="w-3.5 h-3.5 text-[#F88F22]" />
                      <span>{currentMovie.duration}</span>
                    </div>
                  </div>
                )}

                {/* Release Year / Date */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Release</span>
                  <div className="flex items-center gap-1.5 font-bold text-neutral-200">
                    <Calendar className="w-3.5 h-3.5 text-[#FBB931]" />
                    <span>{currentMovie.year || 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* Genres */}
              {currentMovie.genres && currentMovie.genres.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentMovie.genres.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#2A1308] border border-[#F88F22]/30 text-xs font-semibold text-[#FFE3B3]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview / Synopsis */}
              {currentMovie.overview && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Synopsis</span>
                  <p className={`text-xs sm:text-sm text-neutral-300 leading-relaxed ${!isOverviewExpanded ? 'line-clamp-3 sm:line-clamp-4' : ''}`}>
                    {currentMovie.overview}
                  </p>
                  {currentMovie.overview.length > 220 && (
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
          </div>

          {/* Director & Cast Grid */}
          {(currentMovie.director || (currentMovie.cast && currentMovie.cast.length > 0)) && (
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {currentMovie.director && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <User className="w-3 h-3 text-[#FBB931]" />
                    <span>Director</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {currentMovie.director}
                  </div>
                </div>
              )}

              {currentMovie.cast && currentMovie.cast.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <Sparkles className="w-3 h-3 text-[#EA6113]" />
                    <span>Key Cast</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-200 line-clamp-2">
                    {currentMovie.cast.slice(0, 6).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA Footer: Open Where to Watch Options */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
            <div className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#FBB931] shrink-0" />
              <span>Looking to stream the full film? Explore verified external destinations.</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenWatch(currentMovie)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-bold shadow-lg transition-all active:scale-95"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Where to Watch Options</span>
            </button>
          </div>
        </div>
      </section>

      {/* Cinematic Cast & Crew Intelligence Section */}
      <CastSection
        movieId={currentMovie.tmdbId || currentMovie.id}
        movieTitle={currentMovie.title}
        onSelectPerson={(pid) => {
          if (onSelectPerson) {
            onSelectPerson(pid);
          }
        }}
      />

      {/* 5. Compact "More Like This" Recommendations */}
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
                onOpenTrailer={(m) => {
                  setCurrentMovie(m);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenWatch={onOpenWatch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
