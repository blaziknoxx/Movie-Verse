import React, { useState, memo } from 'react';
import { Movie } from '../../types/movie';
import { Bookmark, Star, Film, Play } from 'lucide-react';
import { getPosterThumbnailUrl } from '../../services/tmdbService';

interface MovieCardProps {
  movie: Movie;
  onSelectMovie: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  showUniverseTag?: boolean;
  aspectRatio?: 'poster' | 'landscape';
  onOpenTrailer?: (movie: Movie) => void;
  onOpenWatch?: (movie: Movie) => void;
}

const MovieCardComponent: React.FC<MovieCardProps> = ({
  movie,
  onSelectMovie,
  isWatchlisted,
  onToggleWatchlist,
  showUniverseTag = true,
  aspectRatio = 'poster',
  onOpenTrailer,
  onOpenWatch
}) => {
  const [imgError, setImgError] = useState(false);

  const isLandscape = aspectRatio === 'landscape';

  // Compute optimized thumbnail for portrait cards to cut memory & network bandwidth
  const imageSource = isLandscape && movie.backdropUrl
    ? movie.backdropUrl
    : (movie.posterUrl?.includes('w500') ? movie.posterUrl.replace('/w500/', '/w342/') : movie.posterUrl);

  return (
    <div
      onClick={() => onSelectMovie(movie)}
      className="group sunset-card-glow animate-card-in relative flex flex-col cursor-pointer transition-transform duration-200 active:scale-[0.98] min-w-0 w-full select-none"
    >
      {/* Poster Media Box with Sunset Ambient Lighting */}
      <div 
        className={`relative w-full rounded-2xl overflow-hidden bg-[#160A05] border border-[#F88F22]/20 group-hover:border-[#FBB931]/60 shadow-lg group-hover:shadow-[0_0_20px_rgba(248,143,34,0.3)] transition-all z-10 ${
          isLandscape ? 'aspect-[16/10]' : 'aspect-[2/3]'
        }`}
      >
        {!imgError ? (
          <img
            src={imageSource}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-b from-[#2A1207] to-[#0A0402] text-center">
            <Film className="w-6 h-6 text-[#F88F22] mb-1.5 opacity-60" />
            <span className="text-[11px] font-semibold text-[#FFE3B3] line-clamp-2">{movie.title}</span>
            <span className="text-[9px] text-neutral-400 mt-0.5">{movie.year}</span>
          </div>
        )}

        {/* Ambient Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

        {/* Top Badges: Rating & Watchlist Toggle */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          {/* Subtle Rating Badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-[#F88F22]/25 text-white text-[10px] font-bold tabular-nums">
            <Star className="w-2.5 h-2.5 text-[#FBB931] fill-[#FBB931]" />
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
                ? 'bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white shadow-[0_0_14px_rgba(234,97,19,0.7)]'
                : 'bg-black/65 backdrop-blur-md text-neutral-300 hover:text-white hover:bg-black/85 border border-[#F88F22]/20'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label={`Toggle watchlist for ${movie.title}`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Quick Play Hover / Touch Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenWatch) {
                onOpenWatch(movie);
              } else if (onOpenTrailer) {
                onOpenTrailer(movie);
              } else {
                onSelectMovie(movie);
              }
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sunset-gradient-btn text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
            title={`Play Movie — ${movie.title}`}
            aria-label={`Play Movie ${movie.title}`}
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Metadata Below Poster */}
      <div className="pt-2 px-0.5 space-y-0.5 z-10">
        <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#FFE3B3] transition-colors truncate">
          {movie.title}
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
          <span>{movie.year}</span>
          {movie.genres && movie.genres[0] && (
            <>
              <span className="text-neutral-600">·</span>
              <span className="text-[#FBB931]/90 truncate max-w-[95px]">{movie.genres[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const MovieCard = memo(MovieCardComponent, (prev, next) => {
  return (
    prev.movie.id === next.movie.id &&
    prev.isWatchlisted === next.isWatchlisted &&
    prev.aspectRatio === next.aspectRatio &&
    prev.movie.title === next.movie.title &&
    prev.movie.rating === next.movie.rating &&
    prev.movie.posterUrl === next.movie.posterUrl
  );
});
