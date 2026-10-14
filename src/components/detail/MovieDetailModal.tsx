import React, { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import { CONNECTIONS, WATCH_ORDERS, MOVIES } from '../../data/moviesData';
import { tmdbService } from '../../services/tmdbService';
import { 
  ArrowLeft, Star, Bookmark, CheckCircle2, Network, ListOrdered, 
  Tv, ExternalLink, Sparkles, User, Calendar, Clock, Film,
  Loader2, ThumbsUp, Play, Share2, Eye, ChevronRight
} from 'lucide-react';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  isWatchlisted: boolean;
  isWatched: boolean;
  onToggleWatchlist: (movieId: string) => void;
  onToggleWatched: (movieId: string) => void;
  onNavigateToConnections: (universeId?: string) => void;
  onNavigateToWatchOrder: (universeId?: string) => void;
  onNavigateToSameVibe: (movieId: string) => void;
  onNavigateToVibeMatch: (movieId: string) => void;
  onNavigateToWhereToWatch: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  isWatchlisted,
  isWatched,
  onToggleWatchlist,
  onToggleWatched,
  onNavigateToConnections,
  onNavigateToWatchOrder,
  onNavigateToSameVibe,
  onNavigateToVibeMatch,
  onNavigateToWhereToWatch,
  onSelectMovie,
  onOpenTrailer
}) => {
  const [detailedMovie, setDetailedMovie] = useState<Movie | null>(movie);
  const [collectionMovies, setCollectionMovies] = useState<Movie[]>([]);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!movie) {
      setDetailedMovie(null);
      setCollectionMovies([]);
      setSimilarMovies([]);
      setRecommendedMovies([]);
      setIsOverviewExpanded(false);
      return;
    }

    setDetailedMovie(movie);
    setIsOverviewExpanded(false);

    // Fetch live TMDB details, credits, videos, and recommendations
    const numericId = String(movie.tmdbId || movie.id).replace(/\D/g, '');
    if (numericId) {
      setIsLoadingDetails(true);
      Promise.all([
        tmdbService.getMovieDetails(numericId).catch(() => null),
        tmdbService.getSimilarMovies(numericId).catch(() => []),
        tmdbService.getMovieRecommendations(numericId).catch(() => [])
      ]).then(async ([details, similar, recommended]) => {
        if (details) {
          setDetailedMovie({
            ...details,
            universeId: movie.universeId || details.universeId,
            universeName: movie.universeName || details.universeName,
            vibeTags: movie.vibeTags?.length ? movie.vibeTags : details.vibeTags,
            streamingPlatforms: movie.streamingPlatforms?.length ? movie.streamingPlatforms : details.streamingPlatforms
          });

          // If movie belongs to TMDB collection, fetch real franchise collection films
          if (details.collection?.id) {
            try {
              const collParts = await tmdbService.getCollection(details.collection.id);
              // Filter out the selected movie itself and duplicates
              const filteredParts = collParts.filter(m => String(m.tmdbId || m.id) !== numericId);
              setCollectionMovies(filteredParts);
            } catch (err) {
              console.warn('Could not fetch collection parts:', err);
            }
          }
        }

        // Deduplicate and filter out current movie from similar & recommended
        const cleanSimilar = (similar || []).filter(m => String(m.tmdbId || m.id) !== numericId);
        const cleanRecs = (recommended || []).filter(m => String(m.tmdbId || m.id) !== numericId);
        
        setSimilarMovies(cleanSimilar.slice(0, 10));
        setRecommendedMovies(cleanRecs.slice(0, 10));
      }).finally(() => {
        setIsLoadingDetails(false);
      });
    } else {
      // If purely curated offline movie, find similar by genre/universe
      const similar = MOVIES.filter(m => m.id !== movie.id && (m.universeId === movie.universeId || m.genres.some(g => movie.genres.includes(g))));
      setSimilarMovies(similar.slice(0, 6));
    }
  }, [movie]);

  if (!movie) return null;
  const current = detailedMovie || movie;

  // Verified narrative connections for this film
  const verifiedConnections = CONNECTIONS.filter(
    c => c.sourceMovieId === current.id || c.targetMovieId === current.id
  );

  // Watch order guides featuring this movie
  const relevantGuides = WATCH_ORDERS.filter(g => 
    g.entries.some(e => e.movieId === current.id)
  );

  const getCuratedMovie = (id: string) => MOVIES.find(m => m.id === id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${current.title} — Movie Verse`,
        text: current.overview,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-2xl animate-fade-in text-neutral-200">
      
      {/* Phone-Framed Screen Container matching Reference 2 */}
      <div className="relative w-full max-w-2xl mx-auto min-h-screen bg-[#070104] pb-24 border-x border-white/5 shadow-2xl">
        
        {/* Hero Artwork with Overlay Navigation matching Reference 2 */}
        <div className="relative w-full aspect-[16/11] sm:aspect-[16/10] bg-[#110309] overflow-hidden">
          <img
            src={current.backdropUrl || current.posterUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center"
          />

          {/* Cinematic Scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070104] via-[#070104]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent h-24" />

          {/* Top Overlaid Action Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            {/* Back Arrow Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/10 active:scale-90"
              aria-label="Back to previous screen"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Right Buttons: Share & Save */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/10 active:scale-90"
                title="Share movie"
                aria-label="Share movie"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => onToggleWatchlist(current.id)}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border active:scale-90 ${
                  isWatchlisted
                    ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(229,9,20,0.6)]'
                    : 'bg-black/60 text-white border-white/10 hover:bg-black/80'
                }`}
                title="Save to Watchlist"
                aria-label="Toggle watchlist"
              >
                <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>

          {/* Overlay Center Play Badge if trailer is available */}
          <div 
            onClick={() => onOpenTrailer(current)}
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-950/80 transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-5 sm:px-6 pt-4 space-y-5">
          
          {/* Movie Title & Quality Badges matching Reference 2 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {current.title}
              </h1>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
                4K Ultra
              </span>
            </div>

            {/* Metadata Line matching Reference 2: "2018 ▶ Comedy | ⏱ 1:41:19 | ★ 4.5 Ratings" */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium">
              <span>{current.year}</span>
              <span className="text-red-500 font-bold">▶</span>
              <span className="text-neutral-300">{current.genres.join(', ')}</span>
              <span className="text-neutral-600">|</span>
              <span className="flex items-center gap-1 text-neutral-300">
                <Clock className="w-3 h-3 text-neutral-400" />
                {current.duration}
              </span>
              <span className="text-neutral-600">|</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {current.rating ? current.rating.toFixed(1) : '7.8'} Ratings
              </span>
            </div>
          </div>

          {/* PROMINENT RED PLAY BUTTON (MANDATORY) matching Reference 2 */}
          <button
            onClick={() => onOpenTrailer(current)}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm sm:text-base shadow-[0_4px_24px_rgba(225,29,72,0.45)] flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-white text-white" />
            <span>Play Free Now</span>
          </button>

          {/* Synopsis with Read More / Read Less matching Reference 2 */}
          <div className="space-y-1.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <p className={!isOverviewExpanded ? 'line-clamp-3' : ''}>
              {current.overview}
            </p>
            {current.overview && current.overview.length > 140 && (
              <button
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="text-xs font-bold text-red-400 hover:text-red-300 focus:outline-none"
              >
                {isOverviewExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </div>

          {/* Action Icons Bar matching Reference 2 (Like, Review, Save, Where to Watch) */}
          <div className="flex items-center justify-around py-3 border-y border-white/[0.08] text-xs">
            {/* Like / Watched Button */}
            <button
              onClick={() => onToggleWatched(current.id)}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                isWatched ? 'text-red-400 font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${isWatched ? 'text-red-400 fill-red-400/20' : ''}`} />
              <span className="text-[11px]">{isWatched ? 'Liked' : 'Like'}</span>
            </button>

            {/* Vibe Match Shortcut */}
            <button
              onClick={() => {
                onClose();
                onNavigateToVibeMatch(current.id);
              }}
              className="flex flex-col items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <Sparkles className="w-5 h-5 text-rose-400" />
              <span className="text-[11px]">Vibe Match</span>
            </button>

            {/* Save / Watchlist Button */}
            <button
              onClick={() => onToggleWatchlist(current.id)}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                isWatchlisted ? 'text-red-400 font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isWatchlisted ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-[11px]">{isWatchlisted ? 'Saved' : 'Save'}</span>
            </button>

            {/* Where to Watch Stream Directory */}
            <button
              onClick={() => {
                onClose();
                onNavigateToWhereToWatch();
              }}
              className="flex flex-col items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <Tv className="w-5 h-5 text-neutral-300" />
              <span className="text-[11px]">Stream</span>
            </button>
          </div>

          {/* Director & Lead Cast Chips */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-semibold w-16 shrink-0">Director:</span>
              <span className="text-white font-medium">{current.director}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-semibold w-16 shrink-0">Cast:</span>
              <span className="text-neutral-300 line-clamp-1">{current.cast.join(', ')}</span>
            </div>
          </div>

          {/* Where to Watch Verified Providers */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-red-500" />
                <span>Where to Watch Verified Platforms</span>
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToWhereToWatch();
                }}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
              >
                Full Directory
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {current.streamingPlatforms.map((platform, idx) => (
                <a
                  key={idx}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between transition-all group"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-white group-hover:text-red-300 truncate">
                      {platform.name}
                    </div>
                    <div className="text-[10px] text-neutral-400">{platform.type}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white shrink-0 ml-1" />
                </a>
              ))}
            </div>
          </div>

          {/* Section: Connected Movies (TMDB Collection or Curated Franchise) */}
          {(collectionMovies.length > 0 || verifiedConnections.length > 0) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Network className="w-4 h-4 text-red-500" />
                    <span>Connected Movies & Franchise Lineage</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Official prequels, sequels & cinematic universe connections
                  </p>
                </div>
                {current.universeId && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToConnections(current.universeId);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold shrink-0"
                  >
                    View All
                  </button>
                )}
              </div>

              {/* Horizontal Scrollable Row matching Reference 2 */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {collectionMovies.length > 0
                  ? collectionMovies.map(colMovie => (
                      <div
                        key={colMovie.id}
                        onClick={() => onSelectMovie(colMovie)}
                        className="w-[110px] sm:w-[130px] shrink-0 cursor-pointer group"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-red-500/50 shadow-md">
                          <img
                            src={colMovie.posterUrl}
                            alt={colMovie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="text-xs font-semibold text-white group-hover:text-red-300 truncate mt-1.5">
                          {colMovie.title}
                        </div>
                        <div className="text-[10px] text-neutral-400">{colMovie.year}</div>
                      </div>
                    ))
                  : verifiedConnections.map(conn => {
                      const partnerId = conn.sourceMovieId === current.id ? conn.targetMovieId : conn.sourceMovieId;
                      const partner = getCuratedMovie(partnerId);
                      if (!partner) return null;
                      return (
                        <div
                          key={conn.id}
                          onClick={() => onSelectMovie(partner)}
                          className="w-[110px] sm:w-[130px] shrink-0 cursor-pointer group"
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-red-500/50 shadow-md">
                            <img
                              src={partner.posterUrl}
                              alt={partner.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded bg-red-600/90 text-[9px] font-bold text-white">
                              {conn.relationshipLabel}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-white group-hover:text-red-300 truncate mt-1.5">
                            {partner.title}
                          </div>
                          <div className="text-[10px] text-neutral-400">{partner.year}</div>
                        </div>
                      );
                    })}
              </div>
            </div>
          )}

          {/* Section: Same Vibe (TMDB Similar Movies matching Reference 2) */}
          {similarMovies.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    <span>Same Vibe & Thematic Recommendations</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Films with matching tone, pacing, and atmosphere
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSameVibe(current.id);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold shrink-0"
                >
                  View All
                </button>
              </div>

              {/* Horizontal Row matching Reference 2 */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {similarMovies.map(sim => (
                  <div
                    key={sim.id}
                    onClick={() => onSelectMovie(sim)}
                    className="w-[110px] sm:w-[130px] shrink-0 cursor-pointer group"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-red-500/50 shadow-md">
                      <img
                        src={sim.posterUrl}
                        alt={sim.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-amber-400">
                        ★ {sim.rating ? sim.rating.toFixed(1) : '7.5'}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-white group-hover:text-red-300 truncate mt-1.5">
                      {sim.title}
                    </div>
                    <div className="text-[10px] text-neutral-400">{sim.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
