/**
 * Movie Verse — Cinematic Trailer & Stream Hub Modal
 * Developer — Estiaq Mehedi
 * 
 * Visually integrated player and watch hub matching the Sunset neon theme.
 * Displays official TMDB video playback, polished empty state for unindexed titles,
 * and verified Where to Watch provider cards with genuine recommendation logic.
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Play, AlertCircle, Film, Star, Bookmark, 
  Share2, Tv, Sparkles, Flame, CheckCircle2, ArrowLeft, Loader2, Compass 
} from 'lucide-react';
import { Movie, WhereToWatchSite } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { WhereToWatchCard } from '../wheretowatch/WhereToWatchCard';

interface TrailerModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie?: (movie: Movie) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (movieId: string, e?: React.MouseEvent) => void;
  onNavigateToWhereToWatch?: (movieId?: string) => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ 
  movie, 
  isOpen, 
  onClose,
  onSelectMovie,
  isWatchlisted = false,
  onToggleWatchlist,
  onNavigateToWhereToWatch
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>('Official Trailer');
  const [availableVideos, setAvailableVideos] = useState<{ key: string; name: string; type: string }[]>([]);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [sites, setSites] = useState<WhereToWatchSite[]>(() => storageService.getAllSites());

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Synchronize and resolve official trailer key
  useEffect(() => {
    if (!isOpen || !movie) {
      setTrailerKey(null);
      setIsLoadingTrailer(false);
      setAvailableVideos([]);
      setIsOverviewExpanded(false);
      return;
    }

    setSites(storageService.getAllSites());

    // If movie already has a valid trailerKey attached
    if (movie.trailerKey) {
      setTrailerKey(movie.trailerKey);
      setVideoTitle('Official Trailer');
      setIsLoadingTrailer(false);
      return;
    }

    // Attempt to fetch live video records from TMDB
    const cleanId = String(movie.tmdbId || movie.id).replace(/\D/g, '');
    if (!cleanId) {
      setTrailerKey(null);
      setIsLoadingTrailer(false);
      return;
    }

    let isMounted = true;
    setIsLoadingTrailer(true);

    tmdbService.getMovieVideos(cleanId)
      .then(videos => {
        if (!isMounted) return;
        if (Array.isArray(videos) && videos.length > 0) {
          const ytVideos = videos.filter((v: any) => v.site === 'YouTube');
          setAvailableVideos(ytVideos);

          const officialTrailer = ytVideos.find((v: any) => v.type === 'Trailer') ||
                                  ytVideos.find((v: any) => v.type === 'Teaser') ||
                                  ytVideos.find((v: any) => v.type === 'Clip') ||
                                  ytVideos[0];

          if (officialTrailer && officialTrailer.key) {
            setTrailerKey(officialTrailer.key);
            setVideoTitle(officialTrailer.name || `${officialTrailer.type || 'Official'} Preview`);
            // Cache trailerKey locally on movie
            const updated: Movie = { ...movie, trailerKey: officialTrailer.key };
            storageService.saveCachedMovie(updated);
          } else {
            setTrailerKey(null);
          }
        } else {
          setTrailerKey(null);
        }
      })
      .catch(err => {
        console.warn('[TrailerModal] Unable to fetch trailer videos:', err);
        if (isMounted) setTrailerKey(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTrailer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, movie]);

  if (!isOpen || !movie) return null;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${movie.title} — Trailer & Stream Hub`,
        text: `Watch the official trailer for ${movie.title} on Movie Verse.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-4xl lg:max-w-5xl my-auto rounded-3xl border border-[#F88F22]/25 bg-gradient-to-b from-[#180C05]/98 via-[#120703]/98 to-[#090402]/98 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col sunset-card-glow max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Ambient Accent Bar */}
        <div className="h-1 w-full sunset-gradient-bar shrink-0" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#F88F22]/15 bg-black/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back / Close Arrow for mobile navigation */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all border border-[#F88F22]/20 hover:border-[#FBB931]/50 active:scale-95 shrink-0"
              title="Close player"
              aria-label="Close player"
            >
              <ArrowLeft className="w-4 h-4 sm:hidden" />
              <X className="w-4 h-4 hidden sm:block" />
            </button>

            {/* Glowing Icon Badge */}
            <div className="w-9 h-9 rounded-xl sunset-gradient-btn flex items-center justify-center text-white shrink-0 shadow-[0_0_12px_rgba(234,97,19,0.5)]">
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            </div>

            {/* Title & Metadata Line */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {movie.title}
                </h3>
                {movie.universeName && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-[#2A1308] border border-[#F88F22]/30 text-[10px] font-bold text-[#FBB931] shrink-0">
                    {movie.universeName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
                <span className="text-[#FBB931] font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#FBB931]" />
                  {movie.rating ? movie.rating.toFixed(1) : '7.5'}
                </span>
                <span>•</span>
                <span>{movie.year}</span>
                {movie.duration && (
                  <>
                    <span>•</span>
                    <span>{movie.duration}</span>
                  </>
                )}
                <span className="hidden md:inline text-neutral-500">•</span>
                <span className="hidden md:inline text-[#FFE3B3]/80 truncate">
                  {videoTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all border border-[#F88F22]/20 hover:border-[#FBB931]/50 active:scale-95"
              title={copiedShare ? 'Link copied!' : 'Share'}
              aria-label="Share trailer"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Watchlist Toggle Button */}
            {onToggleWatchlist && (
              <button
                onClick={(e) => onToggleWatchlist(movie.id, e)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border active:scale-95 ${
                  isWatchlisted
                    ? 'sunset-gradient-btn text-white border-[#F88F22] shadow-[0_0_12px_rgba(234,97,19,0.6)]'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border-[#F88F22]/20 hover:border-[#FBB931]/50'
                }`}
                title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                aria-label="Toggle watchlist"
              >
                <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-white' : ''}`} />
              </button>
            )}

            {/* Prominent Desktop Close Button */}
            <button
              onClick={onClose}
              className="hidden sm:flex w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white items-center justify-center transition-all border border-[#F88F22]/20 hover:border-[#FBB931]/50 active:scale-95"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto space-y-6 no-scrollbar scroll-touch flex-grow">
          
          {/* 1. Cinematic Video Player Frame */}
          <div className="space-y-3">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[#F88F22]/30 shadow-[0_12px_40px_rgba(0,0,0,0.9)] sunset-card-glow">
              {/* Inner ambient vignette shadow */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.85)] z-10" />

              {isLoadingTrailer ? (
                /* Sleek Loading State */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1E0D05] via-[#120703] to-[#0A0402] text-center space-y-3">
                  <Loader2 className="w-10 h-10 text-[#FBB931] animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white tracking-wide">
                      Loading Official Trailer
                    </p>
                    <p className="text-xs text-[#FFE3B3]/70">
                      Querying verified TMDB video archives for {movie.title}...
                    </p>
                  </div>
                </div>
              ) : trailerKey ? (
                /* Official YouTube Trailer Playback */
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${movie.title} — ${videoTitle}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 relative z-0"
                />
              ) : (
                /* Polished Empty State for Titles with No Valid Trailer */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-10 bg-gradient-to-b from-[#241108]/95 via-[#180C05] to-[#0A0402] text-center relative overflow-hidden">
                  {/* Subtle ambient lighting behind empty state */}
                  <div className="absolute w-56 h-56 rounded-full bg-[#EA6113]/20 blur-3xl pointer-events-none" />

                  <div className="relative z-10 max-w-md space-y-3.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2A1308] to-[#160B05] border border-[#F88F22]/40 shadow-[0_0_24px_rgba(234,97,19,0.35)] flex items-center justify-center mx-auto text-[#FBB931]">
                      <Film className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Official Trailer Currently Unavailable
                      </h4>
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                        An official video preview has not been published to TMDB for <strong className="text-[#FFE3B3]">{movie.title}</strong> ({movie.year}). Verified streaming links and directory indexes are ready below.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' official trailer')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-bold shadow-md hover:shadow-[0_4px_16px_rgba(234,97,19,0.5)] transition-all active:scale-95 min-h-[40px]"
                      >
                        <span>Search YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {onNavigateToWhereToWatch && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToWhereToWatch(movie.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#F88F22]/30 text-white text-xs font-semibold transition-all min-h-[40px]"
                        >
                          <Tv className="w-3.5 h-3.5 text-[#FBB931]" />
                          <span>Browse Where to Watch</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Multiple Video Cut Selector (if TMDB returned multiple trailers/teasers) */}
            {availableVideos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-[11px] font-bold text-[#FBB931] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Play className="w-3 h-3 fill-[#FBB931]" />
                  <span>Available Previews:</span>
                </span>
                {availableVideos.map((vid) => (
                  <button
                    key={vid.key}
                    onClick={() => {
                      setTrailerKey(vid.key);
                      setVideoTitle(vid.name);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      trailerKey === vid.key
                        ? 'sunset-gradient-btn text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                    }`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span className="max-w-[150px] truncate">{vid.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Movie Synopsis & Metadata Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#EA6113] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FBB931]" />
                  <span>Movie Synopsis & Details</span>
                </div>
                {movie.tagline && (
                  <p className="text-xs text-[#FFE3B3] italic">
                    "{movie.tagline}"
                  </p>
                )}
              </div>

              {/* View Full Movie Details Button */}
              {onSelectMovie && (
                <button
                  onClick={() => {
                    onClose();
                    onSelectMovie(movie);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A1308] hover:bg-[#381B0B] border border-[#F88F22]/35 text-[#FFE3B3] hover:text-white text-xs font-bold transition-all self-start sm:self-auto active:scale-95"
                >
                  <span>Full Movie Details</span>
                  <ExternalLink className="w-3 h-3 text-[#FBB931]" />
                </button>
              )}
            </div>

            {/* Overview Text */}
            <p className={`text-xs sm:text-sm text-neutral-300 leading-relaxed ${!isOverviewExpanded ? 'line-clamp-3 sm:line-clamp-4' : ''}`}>
              {movie.overview}
            </p>

            {movie.overview && movie.overview.length > 200 && (
              <button
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="text-[11px] font-bold text-[#FBB931] hover:underline"
              >
                {isOverviewExpanded ? 'Show less' : 'Read more synopsis'}
              </button>
            )}

            {/* Genre & Tag Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {movie.genres?.map((genre, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-[#FFE3B3]"
                >
                  {genre}
                </span>
              ))}

              {movie.director && (
                <span className="px-2.5 py-1 rounded-lg bg-[#2A1308]/60 border border-[#F88F22]/25 text-[11px] font-medium text-neutral-300">
                  Dir. <strong className="text-white">{movie.director}</strong>
                </span>
              )}
            </div>
          </div>

          {/* 3. Verified Where to Watch Directory Section */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#EA6113]" />
                  <span>Where to Watch Full Film</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Verified external portals and directory indexes dynamically evaluated for <span className="text-[#FFE3B3] font-semibold">{movie.title}</span>
                </p>
              </div>

              {onNavigateToWhereToWatch && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToWhereToWatch(movie.id);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FBB931] hover:text-[#FFE3B3] transition-colors self-start sm:self-auto"
                >
                  <span>Open Directory Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Glowing Where to Watch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map(site => (
                <WhereToWatchCard
                  key={site.id}
                  site={site}
                  movie={movie}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Modal Bottom Status Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#F88F22]/15 bg-[#0D0502] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EA6113] animate-pulse" />
            <span>Developer — <strong className="text-white">Estiaq Mehedi</strong> · Movie Verse Cinematic Player</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
