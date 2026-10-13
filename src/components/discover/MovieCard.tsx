import React, { useState } from 'react';
import { Movie } from '../../types/movie';
import { Bookmark, Star, ArrowUpRight, Film } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onSelectMovie: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  showUniverseTag?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelectMovie,
  isWatchlisted,
  onToggleWatchlist,
  showUniverseTag = true
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onSelectMovie(movie)}
      className="group relative liquid-glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Poster Media Slot */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-rose-950/20">
        {!imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-rose-950/60 to-black text-center">
            <Film className="w-8 h-8 text-rose-400 mb-2 opacity-60" />
            <span className="text-xs font-semibold text-rose-200">{movie.title}</span>
            <span className="text-[10px] text-neutral-400 mt-1">{movie.year}</span>
          </div>
        )}

        {/* Ambient Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090206] via-transparent to-black/30 pointer-events-none" />

        {/* Top Floating Controls */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          {/* Rating - Clean text on subtle glass */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold tabular-nums">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>

          {/* Watchlist Toggle Button (touch-target >= 40px) */}
          <button
            onClick={(e) => onToggleWatchlist(movie.id, e)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isWatchlisted
                ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.5)] border border-rose-400/50'
                : 'bg-black/60 backdrop-blur-md text-neutral-300 hover:text-white border border-white/10 hover:bg-black/80'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label={`Toggle watchlist for ${movie.title}`}
          >
            <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Hover Quick Open Cue */}
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="w-7 h-7 rounded-lg bg-rose-600/90 text-white flex items-center justify-center shadow-lg">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Content Slot */}
      <div className="p-3.5 flex flex-col flex-grow justify-between">
        <div>
          {/* Clean Unboxed Metadata: Year · Duration · Genre */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium tracking-tight mb-1">
            <span>{movie.year}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{movie.duration}</span>
            {movie.genres[0] && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-rose-300/90">{movie.genres[0]}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white group-hover:text-rose-200 transition-colors line-clamp-1">
            {movie.title}
          </h3>

          {/* Universe Lineage if applicable */}
          {showUniverseTag && movie.universeName && (
            <p className="text-[11px] text-rose-400/80 mt-0.5 line-clamp-1 font-medium">
              {movie.universeName}
            </p>
          )}
        </div>

        {/* Vibe Descriptors (Clean unboxed inline list) */}
        {movie.vibeTags && movie.vibeTags.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] text-neutral-400 flex items-center gap-1.5 overflow-hidden">
            <span className="truncate">{movie.vibeTags.slice(0, 2).join(' · ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
