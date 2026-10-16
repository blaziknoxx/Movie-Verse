/**
 * Movie Verse — Dedicated Category Listing View
 * Developer — Estiaq Mehedi
 * 
 * Provides full paginated grid discovery for all "View All" actions:
 * - Trending Now
 * - Popular Movies
 * - Tamil Cinema
 * - Bangladeshi Cinema
 * - Now Playing
 * - Upcoming Movies
 * - Top Rated
 */

import React, { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Flame, Film, Award, Clock, Sparkles, 
  Loader2, AlertCircle, RefreshCw, ChevronDown, Globe2 
} from 'lucide-react';

export interface CategoryListingConfig {
  key: string;
  title: string;
  description: string;
  iconType: 'flame' | 'film' | 'award' | 'clock' | 'sparkles' | 'globe';
}

export const CATEGORY_CONFIGS: Record<string, CategoryListingConfig> = {
  trending: {
    key: 'trending',
    title: 'Top Trending Movies',
    description: 'The most popular and watched films this week across global cinema.',
    iconType: 'flame'
  },
  hollywood: {
    key: 'hollywood',
    title: 'Hollywood Movies',
    description: 'Major studio blockbusters, acclaimed American releases, and visionary cinematic achievements.',
    iconType: 'film'
  },
  hindi: {
    key: 'hindi',
    title: 'Hindi Movies',
    description: 'Heartfelt storytelling, blockbuster spectacles, and celebrated Hindi cinema masterpieces.',
    iconType: 'globe'
  },
  animation: {
    key: 'animation',
    title: 'Animation Movies',
    description: 'Breathtaking visual animation, family classics, and masterworks from legendary animation studios.',
    iconType: 'sparkles'
  },
  tamil: {
    key: 'tamil',
    title: 'Tamil Movies',
    description: 'High-octane action, dramatic narratives, and visionary works from Tamil cinema (Kollywood).',
    iconType: 'globe'
  },
  bangladeshi: {
    key: 'bangladeshi',
    title: 'Bangladeshi Movies',
    description: 'Genuine Bangladeshi motion pictures, acclaimed indie stories, and national cinematic milestones (Dhallywood).',
    iconType: 'globe'
  },
  popular: {
    key: 'popular',
    title: 'Popular Movies',
    description: 'Current crowd favorites and widely celebrated theatrical and streaming titles.',
    iconType: 'film'
  },
  now_playing: {
    key: 'now_playing',
    title: 'Now Playing in Theaters',
    description: 'Films currently in global cinema distribution and theatrical exhibition.',
    iconType: 'film'
  },
  upcoming: {
    key: 'upcoming',
    title: 'Upcoming Releases',
    description: 'Anticipated upcoming titles arriving soon in theaters and streaming.',
    iconType: 'clock'
  },
  top_rated: {
    key: 'top_rated',
    title: 'Top Rated Masterpieces',
    description: 'All-time cinematic milestones, critical masterpieces, and legendary films.',
    iconType: 'award'
  }
};

interface CategoryListingViewProps {
  categoryKey: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  onOpenTrailer: (movie: Movie) => void;
  onOpenWatch?: (movie: Movie) => void;
}

export const CategoryListingView: React.FC<CategoryListingViewProps> = ({
  categoryKey,
  onBack,
  onSelectMovie,
  watchlist,
  onToggleWatchlist,
  onOpenTrailer,
  onOpenWatch
}) => {
  const config = CATEGORY_CONFIGS[categoryKey] || {
    key: categoryKey,
    title: `${categoryKey.replace(/[-_]/g, ' ').toUpperCase()} Movies`,
    description: 'Curated selection from the live TMDB catalog.',
    iconType: 'film'
  };

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMoviesForCategory = async (targetPage = 1, append = false) => {
    if (targetPage === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const res = await tmdbService.getCategoryMovies(categoryKey, targetPage);
      storageService.saveMultipleCachedMovies(res.movies);

      setTotalPages(res.totalPages || 1);
      setPage(targetPage);

      if (append) {
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newUnique = res.movies.filter(m => !existingIds.has(m.id));
          return [...prev, ...newUnique];
        });
      } else {
        setMovies(res.movies);
      }
    } catch (err: any) {
      console.error(`[CategoryListingView] Error loading ${categoryKey}:`, err);
      setError(err.message || 'Unable to load movies. Please check your connection.');
      if (!append) {
        setMovies([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMoviesForCategory(1, false);
  }, [categoryKey]);

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchMoviesForCategory(page + 1, true);
    }
  };

  const renderIcon = () => {
    switch (config.iconType) {
      case 'flame':
        return <Flame className="w-5 h-5 text-[#EA6113]" />;
      case 'award':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-[#FBB931]" />;
      case 'globe':
        return <Globe2 className="w-5 h-5 text-[#EA6113]" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-[#FBB931]" />;
      default:
        return <Film className="w-5 h-5 text-[#EA6113]" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* Top Navigation Bar with Back Action */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#EA6113]" />
          <span>Back to Home</span>
        </button>

        <div className="text-[11px] font-semibold text-neutral-400">
          {movies.length > 0 && `Showing ${movies.length} titles`}
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-[#F88F22]/25 relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#2A1308] border border-[#F88F22]/30 text-[10px] font-bold uppercase tracking-wider text-[#FBB931]">
            {renderIcon()}
            <span>Full Catalog Listing</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {config.title}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#1E0B05] border border-red-500/30 flex items-start justify-between gap-3 text-xs text-neutral-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Live Catalog Notice: </span>
              <span>{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchMoviesForCategory(page, false)}
            className="px-3 py-1.5 rounded-lg sunset-gradient-btn text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Movie Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="py-16 text-center rounded-3xl liquid-glass border border-white/5 space-y-3 max-w-md mx-auto">
          <Film className="w-8 h-8 text-neutral-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Movies Found</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            TMDB returned no current titles for this category or language filter. Please try again later.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelectMovie={onSelectMovie}
                isWatchlisted={watchlist.includes(movie.id)}
                onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                onOpenTrailer={onOpenTrailer}
                onOpenWatch={onOpenWatch}
              />
            ))}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl sunset-gradient-btn text-white text-xs font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading Next Page...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Titles</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
              <div className="text-[11px] text-neutral-400 mt-2 font-medium">
                Page {page} of {totalPages}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
