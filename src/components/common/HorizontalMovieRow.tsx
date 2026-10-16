/**
 * Movie Verse — Premium Animated Touch-Friendly Horizontal Movie Row
 * Developer — Estiaq Mehedi
 * 
 * Supports:
 * - Fluid slow horizontal auto-glide when idle
 * - 100% native touch swiping in both directions (left & right)
 * - Safe touch-action: pan-x pan-y ensuring vertical page scrolling is never blocked
 * - Instant auto-glide pause on touch/pointer/wheel/hover
 * - Smooth delayed resumption after interaction ceases
 * - Zero fighting over scrollLeft during gestures
 * - Respects prefers-reduced-motion
 * - Per-row pause/play control & functional View All button
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Movie } from '../../types/movie';
import { MovieCard } from '../discover/MovieCard';
import { Play, Pause, ChevronRight } from 'lucide-react';

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
  speed?: number; // px per second, default 24
}

const HorizontalMovieRowComponent: React.FC<HorizontalMovieRowProps> = ({
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
  speed = 24
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const isVisibleRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Check for reduced motion preference
  const isReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Viewport IntersectionObserver: strictly pause auto-glide when row is off-screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      isVisibleRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = Boolean(entry && entry.isIntersecting);
      },
      { rootMargin: '100px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Listen to window scroll: pause auto-glide during active vertical page scrolling
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;
    const handleWindowScroll = () => {
      isInteractingRef.current = true;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isInteractingRef.current = false;
      }, 350);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // Seamless auto-scroll step loop: only ticks when visible on screen and not interacting
  useEffect(() => {
    if (isPaused || isReducedMotion || movies.length < 3) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      // Only move if row is visible in viewport, not interacting, and not paused
      if (isVisibleRef.current && !isInteractingRef.current && !isPaused && trackRef.current) {
        const el = trackRef.current;
        const move = (speed * delta) / 1000;
        el.scrollLeft += move;

        // Wrap around seamlessly at half track width (double-buffered)
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [isPaused, isReducedMotion, movies.length, speed]);

  // Touch and interaction handlers: completely yields control to user during manual gestures
  const handleInteractionStart = useCallback(() => {
    isInteractingRef.current = true;
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback((delayMs = 2200) => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      // Normalize scroll bounds before resuming auto-glide
      if (trackRef.current) {
        const el = trackRef.current;
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0) {
          if (el.scrollLeft >= halfWidth) {
            el.scrollLeft -= halfWidth;
          } else if (el.scrollLeft <= 0) {
            el.scrollLeft += halfWidth;
          }
        }
      }
      isInteractingRef.current = false;
    }, delayMs);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    scheduleResume(2000);
  }, [scheduleResume]);

  // Scroll event fires during manual drag & momentum scroll
  const handleScroll = useCallback(() => {
    if (isInteractingRef.current) {
      // Extend timer while momentum scrolling continues
      scheduleResume(2200);
    }
  }, [scheduleResume]);

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

  // If no movies, show honest empty state or return null
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

  const canInfiniteGlide = movies.length >= 3 && !isReducedMotion;

  return (
    <section ref={sectionRef} className="space-y-3 content-visibility-auto">
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

        <div className="flex items-center gap-2 shrink-0">
          {/* Pause / Resume Auto-Glide Button */}
          {canInfiniteGlide && (
            <button
              type="button"
              onClick={() => setIsPaused(prev => !prev)}
              className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isPaused ? 'Resume auto-glide' : 'Pause auto-glide'}
              aria-label={isPaused ? `Resume auto-glide for ${title}` : `Pause auto-glide for ${title}`}
            >
              {isPaused ? (
                <>
                  <Play className="w-3 h-3 text-[#FBB931]" />
                  <span className="hidden md:inline">Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-[#EA6113]" />
                  <span className="hidden md:inline">Auto-Glide</span>
                </>
              )}
            </button>
          )}

          {/* View All Button */}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <span>{viewAllLabel || `View All${totalCount ? ` (${totalCount})` : ''}`}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row Track Container with Cinematic Edge Gradients */}
      <div 
        className="relative w-full rounded-2xl py-1 group/row"
        onMouseEnter={() => {
          isInteractingRef.current = true;
          if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        }}
        onMouseLeave={() => {
          scheduleResume(1500);
        }}
      >
        {/* Subtle Ambient Edge Glow Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-12 bg-gradient-to-r from-[#070104] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-12 bg-gradient-to-l from-[#070104] to-transparent z-10" />

        {/* 
          Native Scroll Container:
          - touch-action: pan-x pan-y guarantees vertical scrolling is never hijacked
          - overflow-x: auto with -webkit-overflow-scrolling: touch gives smooth native iOS & Android swiping
          - zero scroll-behavior: smooth so programmatic updates don't conflict with browser inertia
        */}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
          onTouchCancel={handleInteractionEnd}
          onPointerDown={handleInteractionStart}
          onPointerUp={handleInteractionEnd}
          onPointerCancel={handleInteractionEnd}
          className="flex gap-3 overflow-x-auto no-scrollbar py-1 select-none cursor-grab active:cursor-grabbing"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            touchAction: 'pan-x pan-y',
            scrollBehavior: 'auto'
          }}
        >
          {/* Primary Movie Cards */}
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

          {/* Double-buffered Clone Cards for seamless loop if enough cards */}
          {canInfiniteGlide && movies.map((movie, idx) => (
            <div
              key={`${movie.id}-glide-clone-${idx}`}
              className="w-[115px] sm:w-[138px] md:w-[158px] shrink-0"
              aria-hidden="true"
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
};

export const HorizontalMovieRow = React.memo(HorizontalMovieRowComponent, (prev, next) => {
  if (prev.title !== next.title) return false;
  if (prev.isLoading !== next.isLoading) return false;
  if (prev.totalCount !== next.totalCount) return false;
  if (prev.movies.length !== next.movies.length) return false;
  if (prev.watchlist.length !== next.watchlist.length) return false;
  // If same length, quick check first and last id
  if (prev.movies[0]?.id !== next.movies[0]?.id) return false;
  if (prev.movies[prev.movies.length - 1]?.id !== next.movies[next.movies.length - 1]?.id) return false;
  return true;
});
