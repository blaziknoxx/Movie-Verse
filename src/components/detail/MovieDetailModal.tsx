import React, { useState } from 'react';
import { Movie } from '../../types/movie';
import { MOVIES, CONNECTIONS, WATCH_ORDERS } from '../../data/moviesData';
import { 
  X, Star, Bookmark, CheckCircle2, Network, ListOrdered, 
  Tv, ExternalLink, Sparkles, User, Calendar, Clock, Film
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
  onNavigateToWhereToWatch: () => void;
  onSelectMovie: (movie: Movie) => void;
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
  onNavigateToWhereToWatch,
  onSelectMovie
}) => {
  if (!movie) return null;

  // Find connections related to this movie
  const relatedConnections = CONNECTIONS.filter(
    c => c.sourceMovieId === movie.id || c.targetMovieId === movie.id
  );

  // Find watch order guides featuring this movie
  const relevantGuides = WATCH_ORDERS.filter(g => 
    g.entries.some(e => e.movieId === movie.id)
  );

  // Find same vibe movies
  const sameVibeMovies = MOVIES.filter(m => m.id !== movie.id && (
    m.moodIds.some(mood => movie.moodIds.includes(mood)) ||
    m.vibeTags.some(tag => movie.vibeTags.includes(tag))
  )).slice(0, 3);

  const getMovie = (id: string) => MOVIES.find(m => m.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto liquid-glass-panel rounded-3xl border border-rose-500/25 shadow-2xl text-neutral-200">
        
        {/* Sticky Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-neutral-300 hover:text-white flex items-center justify-center transition-colors border border-white/10"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[2.5/1] w-full overflow-hidden bg-[#0c0307]">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14040c] via-[#14040c]/70 to-transparent" />
          <div className="absolute inset-0 bg-rose-950/20 mix-blend-color" />
        </div>

        {/* Core Info Body */}
        <div className="px-5 sm:px-8 pb-8 -mt-16 sm:-mt-24 relative z-10 space-y-8">
          
          {/* Top Row: Poster Thumbnail + Main Headings */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-28 sm:w-36 aspect-[3/4] object-cover rounded-2xl border-2 border-white/10 shadow-2xl shrink-0 bg-rose-950/40"
            />

            <div className="space-y-2 flex-1">
              {movie.universeName && (
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  {movie.universeName}
                </div>
              )}
              
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Clean unboxed metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium">
                <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {movie.rating.toFixed(1)}
                </span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{movie.year}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{movie.duration}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-rose-300">{movie.genres.join(', ')}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggleWatchlist(movie.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isWatchlisted
                    ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-white' : ''}`} />
                <span>{isWatchlisted ? 'In Watchlist' : 'Watchlist'}</span>
              </button>

              <button
                onClick={() => onToggleWatched(movie.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isWatched
                    ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isWatched ? 'text-emerald-400' : ''}`} />
                <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
              </button>
            </div>

          </div>

          {/* Tagline & Overview */}
          <div className="space-y-2">
            {movie.tagline && (
              <div className="text-xs sm:text-sm italic text-rose-300/90 font-medium">
                "{movie.tagline}"
              </div>
            )}
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              {movie.overview}
            </p>
          </div>

          {/* Credits Strip: Director & Cast */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 text-xs">
            <div>
              <span className="text-neutral-400 font-semibold block mb-0.5">Director</span>
              <span className="text-white font-medium">{movie.director}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-semibold block mb-0.5">Key Cast</span>
              <span className="text-white font-medium">{movie.cast.join(', ')}</span>
            </div>
          </div>

          {/* Atmosphere & Vibe Breakdown */}
          <div className="liquid-glass rounded-2xl p-5 border border-rose-500/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Atmospheric DNA</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToSameVibe(movie.id);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                <span>Find Same Vibe Movies</span>
                <span>→</span>
              </button>
            </div>

            <div className="text-xs text-rose-200 font-medium">
              {movie.vibeTags.join(' · ')}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                <div className="text-[10px] text-neutral-400">Dark Tone</div>
                <div className="font-bold text-white tabular-nums mt-0.5">{movie.vibeProfile.darkAtmosphere}/10</div>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                <div className="text-[10px] text-neutral-400">Action Pacing</div>
                <div className="font-bold text-white tabular-nums mt-0.5">{movie.vibeProfile.actionIntensity}/10</div>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                <div className="text-[10px] text-neutral-400">Psychology</div>
                <div className="font-bold text-white tabular-nums mt-0.5">{movie.vibeProfile.psychologicalComplexity}/10</div>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                <div className="text-[10px] text-neutral-400">Style</div>
                <div className="font-medium text-white truncate mt-0.5">{movie.vibeProfile.visualStyle}</div>
              </div>
            </div>
          </div>

          {/* Where to Watch Availability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Tv className="w-4 h-4 text-rose-500" />
                <span>Where to Watch Verified Platforms</span>
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToWhereToWatch();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                View Full Directory
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {movie.streamingPlatforms.map((platform, idx) => (
                <a
                  key={idx}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between group transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                      {platform.name}
                    </div>
                    <div className="text-[10px] text-neutral-400">{platform.type}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Connected Universe Relations */}
          {relatedConnections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Network className="w-4 h-4 text-rose-500" />
                  <span>Narrative Connections ({relatedConnections.length})</span>
                </h3>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToConnections(movie.universeId);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Explore Interactive Graph
                </button>
              </div>

              <div className="space-y-2">
                {relatedConnections.map(conn => {
                  const partnerId = conn.sourceMovieId === movie.id ? conn.targetMovieId : conn.sourceMovieId;
                  const partner = getMovie(partnerId);
                  if (!partner) return null;

                  return (
                    <div
                      key={conn.id}
                      onClick={() => onSelectMovie(partner)}
                      className="p-3 rounded-xl bg-black/40 hover:bg-white/[0.05] border border-white/5 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={partner.posterUrl}
                          alt={partner.title}
                          className="w-9 h-12 object-cover rounded border border-white/10 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-white hover:text-rose-300 transition-colors">
                            {partner.title} ({partner.year})
                          </div>
                          <div className="text-[11px] text-rose-400 font-medium">
                            {conn.relationshipLabel}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-400 mr-2">View →</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Watch Order Placement */}
          {relevantGuides.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                  Watch Order Sequence
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  Featured in: {relevantGuides[0].title}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {relevantGuides[0].orderTypeLabel}
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onNavigateToWatchOrder(movie.universeId);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold shrink-0"
              >
                Inspect Sequence Guide
              </button>
            </div>
          )}

          {/* Similar Vibe Recommendations */}
          {sameVibeMovies.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Films Sharing Same Aesthetic Vibe</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sameVibeMovies.map(similar => (
                  <div
                    key={similar.id}
                    onClick={() => onSelectMovie(similar)}
                    className="p-3 rounded-xl bg-black/40 hover:bg-white/[0.05] border border-white/5 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={similar.posterUrl}
                      alt={similar.title}
                      className="w-10 h-14 object-cover rounded border border-white/10 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">{similar.title}</div>
                      <div className="text-[10px] text-neutral-400">{similar.year} · {similar.genres[0]}</div>
                      <div className="text-[10px] text-rose-300 truncate mt-1">{similar.vibeTags[0]}</div>
                    </div>
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
