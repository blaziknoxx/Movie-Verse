/**
 * Movie Verse — Touch-Friendly Horizontal Movie Row
 * Developer — Estiaq Mehedi
 * 
 * Supports:
 * - 100% native smooth manual touch swiping & horizontal scrolling on iOS, Android, and Desktop
 * - Safe touch-action: pan-x pan-y ensuring vertical page scrolling is never blocked
 * - Zero automatic card movement or auto-glide animation everywhere
 * - Functional View All navigation and clean category counters
 */

import React, { memo } from 'react';
import { Movie } from '../../types/movie';
import { MovieCard } from '../discover/MovieCard';
import { ChevronRight } from 'lucide-react';

interface HorizontalMovieRowProps {
  title: string;
  icon?: React.ReactNode;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  onOpenTrailer?: (movie: Movie) => void;
  onOpenWatch?: (movie: Movie) => void;
  onViewAll?: () => void;
  viewAllLabel?: string;
  totalCount?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  speed?: number; // legacy prop accepted without effect
}

export const HorizontalMovieRow: React.FC<HorizontalMovieRowProps> = memo(({
  title,
  icon,
  movies,
  onSelectMovie,
  watchlist,
  onToggleWatchlist,
  onOpenTrailer,
  onOpenWatch,
  onViewAll,
  viewAllLabel,
  totalCount,
  isLoading = false,
  emptyMessage = 'No titles found in this category.',
}) => {
  // If loading, render elegant pulse cards
  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[115px] sm:w-[138px] md:w-[158px] aspect-[2/3] rounded-2xl bg-white/5 animate-pulse shrink-0 border border-white/5"
            />
          ))}
        </div>
      </section>
    );
  }

  // If no movies, show honest empty state
  if (movies.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
          </div>
        </div>
        <div className="p-5 rounded-2xl liquid-glass border border-white/5 text-center text-xs text-neutral-400">
          {emptyMessage}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {/* Row Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {title}
          </h2>
          {totalCount !== undefined && totalCount > 0 && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-neutral-400">
              ({totalCount})
            </span>
          )}
        </div>

        {/* View All Button */}
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5 shrink-0"
          >
            <span>{viewAllLabel || `View All${totalCount ? ` (${totalCount})` : ''}`}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Row Track Container with Cinematic Edge Gradients */}
      <div className="relative w-full rounded-2xl py-1 group/row">
        {/* Subtle Ambient Edge Glow Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-12 bg-gradient-to-r from-[#070104] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-12 bg-gradient-to-l from-[#070104] to-transparent z-10" />

        {/* 
          Native Touch & Pointer Scroll Container:
          - touch-action: pan-x pan-y guarantees vertical scrolling is never hijacked
          - overflow-x: auto with -webkit-overflow-scrolling: touch gives smooth native iOS & Android swiping
          - completely static when idle (no automatic horizontal card animation)
        */}
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch movie-row-track py-1 select-none"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            touchAction: 'pan-x pan-y',
            scrollBehavior: 'auto',
          }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[115px] sm:w-[138px] md:w-[158px] shrink-0"
            >
              <MovieCard
                movie={movie}
                onSelectMovie={onSelectMovie}
                isWatchlisted={watchlist.includes(movie.id)}
                onToggleWatchlist={onToggleWatchlist}
                onOpenTrailer={onOpenTrailer}
                onOpenWatch={onOpenWatch}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

HorizontalMovieRow.displayName = 'HorizontalMovieRow';
