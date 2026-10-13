import React, { useState } from 'react';
import { Movie } from '../../types/movie';
import { Play, Network, Bookmark, Star, Sparkles, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  movie: Movie;
  onExploreMovie: (movie: Movie) => void;
  onExploreConnections: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onExploreMovie,
  onExploreConnections,
  isWatchlisted,
  onToggleWatchlist
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl mb-12 border border-rose-500/20 shadow-2xl">
      {/* Background Cinematic Visual */}
      <div className="absolute inset-0 w-full h-full bg-[#0a0205]">
        {!imgError ? (
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center scale-[1.02] transform transition-transform duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-rose-950 via-[#18040d] to-[#070104]" />
        )}
        
        {/* Cinematic Scrims: Multi-stop gradients for flawless text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080205] via-[#080205]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080205] via-[#080205]/85 to-transparent sm:w-3/4" />
        <div className="absolute inset-0 bg-rose-950/20 mix-blend-color" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 px-5 sm:px-8 md:px-12 py-12 sm:py-16 md:py-20 max-w-4xl">
        
        {/* Editorial Eyebrow Label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
            {movie.universeName ? `FEATURED UNIVERSE · ${movie.universeName}` : 'FEATURED CINEMA'}
          </span>
        </div>

        {/* Large Headline Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] text-balance mb-4">
          {movie.title}
        </h1>

        {/* Unboxed Metadata Line */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium mb-4">
          <span className="flex items-center gap-1 text-amber-400 font-semibold tabular-nums">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {movie.rating.toFixed(1)}
          </span>
          <span aria-hidden="true" className="text-neutral-500">·</span>
          <span>{movie.year}</span>
          <span aria-hidden="true" className="text-neutral-500">·</span>
          <span>{movie.duration}</span>
          <span aria-hidden="true" className="text-neutral-500">·</span>
          <span className="text-rose-300">{movie.genres.join(', ')}</span>
        </div>

        {/* Short Synopsis */}
        <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl line-clamp-3 mb-6">
          {movie.overview}
        </p>

        {/* Vibe Descriptors Preview */}
        {movie.vibeTags && (
          <div className="flex items-center gap-2 text-xs text-rose-200/90 font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{movie.vibeTags.join(' · ')}</span>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onExploreMovie(movie)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Movie</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onExploreConnections(movie)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl liquid-glass hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Network className="w-4 h-4 text-rose-400" />
            <span>Explore Connections</span>
          </button>

          <button
            onClick={() => onToggleWatchlist(movie.id)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isWatchlisted
                ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-400'
                : 'liquid-glass text-neutral-300 hover:text-white border border-white/10'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label={`Toggle watchlist for ${movie.title}`}
          >
            <Bookmark className={`w-5 h-5 ${isWatchlisted ? 'fill-white' : ''}`} />
          </button>
        </div>

      </div>
    </section>
  );
};
