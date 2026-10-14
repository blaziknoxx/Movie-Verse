import React, { useState } from 'react';
import { Movie } from '../../types/movie';
import { Bookmark, Star, Film, Play } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onSelectMovie: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  showUniverseTag?: boolean;
  aspectRatio?: 'poster' | 'landscape';
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelectMovie,
  isWatchlisted,
  onToggleWatchlist,
  showUniverseTag = true,
  aspectRatio = 'poster'
}) => {
  const [imgError, setImgError] = useState(false);

  const isLandscape = aspectRatio === 'landscape';

  return (
    <div
      onClick={() => onSelectMovie(movie)}
      className="group relative flex flex-col cursor-pointer transition-transform duration-300 active:scale-[0.98] hover:scale-[1.02] min-w-0 w-full"
    >
      {/* Poster Media Box */}
      <div 
        className={`relative w-full rounded-2xl overflow-hidden bg-[#160610] border border-white/[0.08] group-hover:border-rose-500/40 shadow-lg group-hover:shadow-[0_8px_24px_rgba(225,29,72,0.2)] transition-all ${
          isLandscape ? 'aspect-[16/10]' : 'aspect-[2/3]'
        }`}
      >
        {!imgError ? (
          <img
            src={isLandscape && movie.backdropUrl ? movie.backdropUrl : movie.posterUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-b from-rose-950/70 to-black text-center">
            <Film className="w-6 h-6 text-rose-400 mb-1.5 opacity-60" />
            <span className="text-[11px] font-semibold text-rose-200 line-clamp-2">{movie.title}</span>
            <span className="text-[9px] text-neutral-400 mt-0.5">{movie.year}</span>
          </div>
        )}

        {/* Ambient Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges: Rating & Watchlist Toggle */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          {/* Subtle Rating Badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold tabular-nums">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span>{movie.rating ? movie.rating.toFixed(1) : '7.5'}</span>
          </div>

          {/* Quick Watchlist Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(movie.id, e);
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all pointer-events-auto ${
              isWatchlisted
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(229,9,20,0.6)]'
                : 'bg-black/60 backdrop-blur-md text-neutral-300 hover:text-white hover:bg-black/80'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label={`Toggle watchlist for ${movie.title}`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Quick Play Hover / Touch Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-white translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Metadata Below Poster */}
      <div className="pt-2 px-0.5 space-y-0.5">
        <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-rose-200 transition-colors truncate">
          {movie.title}
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <span>{movie.year}</span>
          {movie.genres && movie.genres[0] && (
            <>
              <span className="text-neutral-600">·</span>
              <span className="text-rose-300/80 truncate max-w-[90px]">{movie.genres[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
