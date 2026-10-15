/**
 * Movie Verse — Complete Homepage Experience
 * Developer — Estiaq Mehedi
 * 
 * Section Order:
 * 1. Top Trending Movies
 * 2. Hollywood Movies
 * 3. Hindi Movies
 * 4. Animation Movies
 * 5. Tamil Movies
 * 6. Bangladeshi Movies
 * 
 * Includes fully functional category discovery:
 * All, Trending, Popular, Now Playing, Upcoming, Top Rated, Hollywood, Hindi, Animation, Tamil, Bangladeshi.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from '../../types/movie';
import { UNIVERSES, MOODS } from '../../data/moviesData';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { HeroBanner } from './HeroBanner';
import { MovieCard } from '../discover/MovieCard';
import { DeveloperCard } from '../common/DeveloperCard';
import { 
  Flame, Film, Sparkles, Tv, Globe, Award, Star, 
  Clock, PlayCircle, Network, History, Bookmark, 
  RefreshCw, AlertCircle, ArrowRight, ArrowLeft, 
  Play, Search, Loader2, ChevronRight
} from 'lucide-react';

export type HomepageCategory = 
  | 'all' 
  | 'trending' 
  | 'popular' 
  | 'now_playing' 
  | 'upcoming' 
  | 'top_rated' 
  | 'hollywood' 
  | 'hindi' 
  | 'animation' 
  | 'tamil' 
  | 'bangladeshi';

export interface CategoryMeta {
  id: HomepageCategory;
  label: string;
  title: string;
  description: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORY_DEFINITIONS: CategoryMeta[] = [
  { id: 'all', label: 'All', title: 'Curated World Cinema', description: 'Curated cinematic discovery feed across world cinema', icon: Film },
  { id: 'trending', label: 'Trending', title: 'Top Trending Movies', description: 'Real-time trending movies ranked worldwide by TMDB', badge: 'Live TMDB Ranking', icon: Flame },
  { id: 'popular', label: 'Popular', title: 'Popular Movies', description: 'Most viewed and talked-about titles right now', badge: 'Worldwide Popular', icon: Star },
  { id: 'now_playing', label: 'Now Playing', title: 'Now Playing in Theaters', description: 'Movies currently playing on cinema screens', badge: 'In Theaters', icon: PlayCircle },
  { id: 'upcoming', label: 'Upcoming', title: 'Upcoming Releases', description: 'Future theatrical and digital premieres', badge: 'Future Premieres', icon: Clock },
  { id: 'top_rated', label: 'Top Rated', title: 'Top Rated Masterpieces', description: 'Critically acclaimed and highest rated cinematic masterpieces', badge: 'TMDB All-Time', icon: Award },
  { id: 'hollywood', label: 'Hollywood', title: 'Hollywood Movies', description: 'Recent major American studio productions in English', badge: 'US Productions · English', icon: Film },
  { id: 'hindi', label: 'Hindi', title: 'Hindi Movies (Bollywood)', description: 'Recent Hindi-language cinema and Bollywood releases', badge: 'Original Language: Hindi', icon: Sparkles },
  { id: 'animation', label: 'Animation', title: 'Animation Movies', description: 'Recent animated features and cinematic animation art', badge: 'TMDB Genre #16', icon: Tv },
  { id: 'tamil', label: 'Tamil', title: 'Tamil Movies (Kollywood)', description: 'Recent Tamil-language cinema and Kollywood releases', badge: 'Original Language: Tamil', icon: Film },
  { id: 'bangladeshi', label: 'Bangladeshi', title: 'Bangladeshi Movies (Dhallywood)', description: 'Recent cinema originating from Bangladesh', badge: 'Country of Origin: Bangladesh (BD)', icon: Globe },
];

interface HomeViewProps {
  onSelectMovie: (movie: Movie) => void;
  onExploreConnections: (movieOrUniverse?: any) => void;
  onExploreWatchOrder: (universeId?: string) => void;
  onExploreSameVibe: (movieId?: string) => void;
  onExploreVibeMatch: (movieId?: string) => void;
  onExploreWhereToWatch: () => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  recentMovieIds: string[];
  selectedMoodId: string | null;
  onSelectMood: (moodId: string | null) => void;
  onOpenTrailer: (movie: Movie) => void;
  onOpenSearch: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMovie,
  onExploreConnections,
  onExploreWatchOrder,
  onExploreSameVibe,
  onExploreVibeMatch,
  onExploreWhereToWatch,
  watchlist,
  onToggleWatchlist,
  recentMovieIds,
  selectedMoodId,
  onSelectMood,
  onOpenTrailer,
  onOpenSearch
}) => {
  // Read initial category from URL hash if available (e.g. #category=hollywood)
  const getInitialCategory = (): HomepageCategory => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/#category=([a-z_]+)/i);
      if (match && CATEGORY_DEFINITIONS.some(c => c.id === match[1])) {
        return match[1] as HomepageCategory;
      }
    }
    return 'all';
  };

  const [activeCategory, setActiveCategory] = useState<HomepageCategory>(getInitialCategory);

  // 6 Primary Homepage Section States
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [hollywoodMovies, setHollywoodMovies] = useState<Movie[]>([]);
  const [hindiMovies, setHindiMovies] = useState<Movie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Movie[]>([]);
  const [tamilMovies, setTamilMovies] = useState<Movie[]>([]);
  const [bangladeshiMovies, setBangladeshiMovies] = useState<Movie[]>([]);

  // Category Discovery State (caches movies loaded per category ID)
  const [categoryMoviesMap, setCategoryMoviesMap] = useState<Record<string, Movie[]>>({});
  const [categoryPagesMap, setCategoryPagesMap] = useState<Record<string, number>>({});
  const [categoryTotalPagesMap, setCategoryTotalPagesMap] = useState<Record<string, number>>({});
  const [isLoadingCategory, setIsLoadingCategory] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // General Feed States
  const [moodMovies, setMoodMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMood, setIsLoadingMood] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync category changes with Browser History
  const handleSelectCategory = (catId: HomepageCategory) => {
    setActiveCategory(catId);
    if (typeof window !== 'undefined') {
      const targetHash = catId === 'all' ? '' : `#category=${catId}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ category: catId }, '', targetHash || window.location.pathname);
      }
    }
  };

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const cat = getInitialCategory();
      setActiveCategory(cat);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch all 6 main homepage sections concurrently on mount
  const fetchHomepageSections = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const [trendRes, hollyRes, hindiRes, animRes, tamilRes, bdRes] = await Promise.allSettled([
        tmdbService.getTrending('week', 1),
        tmdbService.getHollywood(1),
        tmdbService.getHindi(1),
        tmdbService.getAnimation(1),
        tmdbService.getTamil(1),
        tmdbService.getBangladeshi(1),
      ]);

      const trending = trendRes.status === 'fulfilled' ? trendRes.value.movies : [];
      const hollywood = hollyRes.status === 'fulfilled' ? hollyRes.value.movies : [];
      const hindi = hindiRes.status === 'fulfilled' ? hindiRes.value.movies : [];
      const animation = animRes.status === 'fulfilled' ? animRes.value.movies : [];
      const tamil = tamilRes.status === 'fulfilled' ? tamilRes.value.movies : [];
      const bangladeshi = bdRes.status === 'fulfilled' ? bdRes.value.movies : [];

      setTrendingMovies(trending);
      setHollywoodMovies(hollywood);
      setHindiMovies(hindi);
      setAnimationMovies(animation);
      setTamilMovies(tamil);
      setBangladeshiMovies(bangladeshi);

      // Pre-seed category cache with initial page 1 results to prevent duplicate network calls
      setCategoryMoviesMap(prev => ({
        ...prev,
        trending,
        hollywood,
        hindi,
        animation,
        tamil,
        bangladeshi,
      }));

      setCategoryPagesMap(prev => ({
        ...prev,
        trending: 1,
        hollywood: 1,
        hindi: 1,
        animation: 1,
        tamil: 1,
        bangladeshi: 1,
      }));

      // Cache all normalized movies in persistent storage for instant modal hydration
      const allFetched = [...trending, ...hollywood, ...hindi, ...animation, ...tamil, ...bangladeshi];
      if (allFetched.length > 0) {
        storageService.saveMultipleCachedMovies(allFetched);
      }

      // If all 6 queries failed (e.g. unconfigured secret or network error)
      const allRejected = [trendRes, hollyRes, hindiRes, animRes, tamilRes, bdRes].every(r => r.status === 'rejected');
      if (allRejected) {
        const firstErr = (trendRes as PromiseRejectedResult).reason;
        setApiError(firstErr?.message || 'Unable to connect to live TMDB catalog. Verify API credentials.');
      }
    } catch (err: any) {
      console.error('[HomeView] Feed error:', err);
      setApiError(err.message || 'Unable to load live movie catalog.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomepageSections();
  }, [fetchHomepageSections]);

  // Load category movies when switching to a category that hasn't been pre-seeded yet
  useEffect(() => {
    if (activeCategory === 'all') return;

    // If movies already exist in cache for this category, skip fetching
    if (categoryMoviesMap[activeCategory] && categoryMoviesMap[activeCategory].length > 0) {
      return;
    }

    let isCancelled = false;
    const fetchCategory = async () => {
      setIsLoadingCategory(true);
      setCategoryError(null);
      try {
        const res = await tmdbService.getCategoryMovies(activeCategory, 1);
        if (!isCancelled) {
          storageService.saveMultipleCachedMovies(res.movies);
          setCategoryMoviesMap(prev => ({
            ...prev,
            [activeCategory]: res.movies
          }));
          setCategoryPagesMap(prev => ({
            ...prev,
            [activeCategory]: 1
          }));
          setCategoryTotalPagesMap(prev => ({
            ...prev,
            [activeCategory]: res.totalPages
          }));
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error(`[HomeView] Error loading category ${activeCategory}:`, err);
          setCategoryError(err.message || `Failed to load ${activeCategory} movies`);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCategory(false);
        }
      }
    };

    fetchCategory();
    return () => {
      isCancelled = true;
    };
  }, [activeCategory, categoryMoviesMap]);

  // Load Next Page of Movies for the Active Category
  const handleLoadMoreCategory = async () => {
    if (activeCategory === 'all' || isLoadingMore) return;
    const currentPage = categoryPagesMap[activeCategory] || 1;
    const nextPage = currentPage + 1;

    setIsLoadingMore(true);
    try {
      const res = await tmdbService.getCategoryMovies(activeCategory, nextPage);
      storageService.saveMultipleCachedMovies(res.movies);

      setCategoryMoviesMap(prev => {
        const existing = prev[activeCategory] || [];
        const existingIds = new Set(existing.map(m => m.id));
        const newMovies = res.movies.filter(m => !existingIds.has(m.id));
        return {
          ...prev,
          [activeCategory]: [...existing, ...newMovies]
        };
      });

      setCategoryPagesMap(prev => ({
        ...prev,
        [activeCategory]: nextPage
      }));

      setCategoryTotalPagesMap(prev => ({
        ...prev,
        [activeCategory]: res.totalPages
      }));
    } catch (err: any) {
      console.warn(`[HomeView] Error loading more for ${activeCategory}:`, err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Discover movies when an Atmospheric Vibe mood pill is selected
  useEffect(() => {
    if (!selectedMoodId) {
      setMoodMovies([]);
      return;
    }

    let isCancelled = false;
    const fetchMoodMovies = async () => {
      setIsLoadingMood(true);
      try {
        const results = await tmdbService.discoverByMood(selectedMoodId, 1);
        if (!isCancelled) {
          storageService.saveMultipleCachedMovies(results);
          setMoodMovies(results);
        }
      } catch (err) {
        if (!isCancelled) setMoodMovies([]);
      } finally {
        if (!isCancelled) setIsLoadingMood(false);
      }
    };

    fetchMoodMovies();
    return () => {
      isCancelled = true;
    };
  }, [selectedMoodId]);

  // Continue Watching from local storage
  const continueWatchingMovies = recentMovieIds
    .map(id => storageService.getCachedMovie(id))
    .filter((m): m is Movie => Boolean(m));

  // Watchlist from local storage
  const watchlistMovies = watchlist
    .map(id => storageService.getCachedMovie(id))
    .filter((m): m is Movie => Boolean(m));

  // Current active category definition
  const currentCategoryMeta = CATEGORY_DEFINITIONS.find(c => c.id === activeCategory) || CATEGORY_DEFINITIONS[0];
  const activeCategoryMovies = categoryMoviesMap[activeCategory] || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* 1. HERO FEATURED CAROUSEL (Always prominent at the top of discovery) */}
      {trendingMovies.length > 0 || hollywoodMovies.length > 0 ? (
        <HeroBanner
          movies={trendingMovies.length > 0 ? trendingMovies : hollywoodMovies}
          onSelectMovie={onSelectMovie}
          isWatchlisted={(id) => watchlist.includes(id)}
          onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
          onOpenTrailer={onOpenTrailer}
        />
      ) : isLoading ? (
        <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl liquid-glass border border-white/5 animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FBB931] animate-spin" />
        </div>
      ) : (
        /* Cinematic Welcome Hub if TMDB is offline or not configured */
        <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-[#F88F22]/30 bg-gradient-to-br from-[#241108]/90 via-[#160B05]/95 to-[#0D0704] shadow-2xl overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-[11px] font-bold text-[#FBB931] uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#EA6113]" />
              <span>Cinematic Discovery Platform</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome to Movie Verse
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Explore cinematic universe lineages, watch orders, reproducible vibe matching, and external streaming directories.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenSearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white font-bold text-xs cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Search Movies</span>
              </button>
              <button
                onClick={fetchHomepageSections}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FBB931]" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Notice Banner if TMDB endpoint error occurred */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-[#1E0B05] border border-[#F88F22]/30 flex items-start gap-3 text-xs text-neutral-200">
          <AlertCircle className="w-4 h-4 text-[#F88F22] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">Live Catalog Notice: </span>
            <span>{apiError}</span>
            <div className="text-[11px] text-neutral-400">
              Per strict data integrity standards, Movie Verse displays live TMDB cinematic responses and never substitutes fake placeholder movie arrays.
            </div>
          </div>
        </div>
      )}

      {/* 2. CATEGORY NAVIGATION TABS (All, Trending, Popular, Now Playing, Upcoming, Top Rated, Hollywood, Hindi, Animation, Tamil, Bangladeshi) */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-touch py-1 px-1 -mx-1">
          {CATEGORY_DEFINITIONS.map(cat => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'sunset-gradient-btn text-white shadow-[0_4px_16px_rgba(234,97,19,0.4)] scale-105'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/5'
                }`}
                title={cat.description}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-white/10 shrink-0 mx-1" />

          {/* Quick Shortcuts to Features */}
          <button
            onClick={() => onExploreVibeMatch()}
            className="px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-[#241108] border border-[#F88F22]/30 text-[#FFE3B3] hover:border-[#FBB931] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[#EA6113]" />
            <span>Vibe Match</span>
          </button>

          <button
            onClick={() => onExploreConnections()}
            className="px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-[#241108] border border-[#F88F22]/30 text-[#FFE3B3] hover:border-[#FBB931] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Network className="w-3 h-3 text-[#EA6113]" />
            <span>Lore</span>
          </button>

          <button
            onClick={onExploreWhereToWatch}
            className="px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-[#241108] border border-[#F88F22]/30 text-[#FFE3B3] hover:border-[#FBB931] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-[#EA6113]" />
            <span>Where to Watch</span>
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          VIEW ROUTING:
          If activeCategory !== 'all', render DEDICATED CATEGORY VIEW.
          If activeCategory === 'all', render DEFAULT 6 HOMEPAGE SECTIONS.
         ------------------------------------------------------------- */}

      {activeCategory !== 'all' ? (
        /* DEDICATED CATEGORY VIEW */
        <section className="space-y-5 animate-fade-in">
          {/* Category View Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#200E06]/90 to-[#120603] border border-[#F88F22]/25">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectCategory('all')}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Back to All"
                  aria-label="Back to all discovery"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FBB931]" />
                </button>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <currentCategoryMeta.icon className="w-5 h-5 text-[#EA6113]" />
                  <span>{currentCategoryMeta.title}</span>
                </h1>
                {currentCategoryMeta.badge && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#EA6113]/20 border border-[#EA6113]/40 text-[10px] font-bold text-[#FFE3B3]">
                    {currentCategoryMeta.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300">
                {currentCategoryMeta.description}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-semibold text-[#FBB931]">
                {activeCategoryMovies.length} title{activeCategoryMovies.length !== 1 ? 's' : ''} loaded
              </span>
              <button
                onClick={() => handleSelectCategory('all')}
                className="text-xs text-neutral-400 hover:text-white underline ml-2 cursor-pointer"
              >
                View All Categories
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoadingCategory ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse border border-white/5" />
              ))}
            </div>
          ) : categoryError ? (
            /* Error State with Retry */
            <div className="p-8 rounded-3xl liquid-glass text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#EA6113] mx-auto" />
              <h3 className="text-sm font-bold text-white">{categoryError}</h3>
              <p className="text-xs text-neutral-400">Could not fetch movies for this category from TMDB.</p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setCategoryMoviesMap(prev => {
                      const updated = { ...prev };
                      delete updated[activeCategory];
                      return updated;
                    });
                  }}
                  className="px-4 py-2 rounded-xl sunset-gradient-btn text-white text-xs font-bold cursor-pointer"
                >
                  Retry
                </button>
                <button
                  onClick={() => handleSelectCategory('all')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
                >
                  Back to All
                </button>
              </div>
            </div>
          ) : activeCategoryMovies.length > 0 ? (
            /* Responsive Grid of Category Movies */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {activeCategoryMovies.map((movie) => (
                  <MovieCard
                    key={`${activeCategory}-${movie.id}`}
                    movie={movie}
                    onSelectMovie={onSelectMovie}
                    isWatchlisted={watchlist.includes(movie.id)}
                    onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                    onOpenTrailer={onOpenTrailer}
                  />
                ))}
              </div>

              {/* Load More Pagination Button */}
              <div className="flex justify-center pt-2 pb-6">
                <button
                  onClick={handleLoadMoreCategory}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl sunset-gradient-btn text-white font-bold text-xs cursor-pointer shadow-xl disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading More Titles...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More {currentCategoryMeta.label} Movies</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-8 rounded-3xl liquid-glass text-center space-y-3">
              <Film className="w-8 h-8 text-[#F88F22] mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white">No Movies Found</h3>
              <p className="text-xs text-neutral-400">No matching titles currently returned by TMDB for this filter.</p>
              <button
                onClick={() => handleSelectCategory('all')}
                className="px-4 py-2 rounded-xl sunset-gradient-btn text-white text-xs font-bold cursor-pointer"
              >
                Return to All Discovery
              </button>
            </div>
          )}
        </section>
      ) : (
        /* ============================================================
           DEFAULT HOMEPAGE VIEW: EXACT 6 SECTIONS IN REQUIRED ORDER
           1. Top Trending Movies
           2. Hollywood Movies
           3. Hindi Movies
           4. Animation Movies
           5. Tamil Movies
           6. Bangladeshi Movies
           ============================================================ */
        <div className="space-y-8 sm:space-y-10">

          {/* Continue Watching Strip (Only if genuine user history exists) */}
          {continueWatchingMovies.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-[#EA6113]" />
                  <span>Continue Watching</span>
                </h2>
                <span className="text-xs text-neutral-400 font-semibold">
                  {continueWatchingMovies.length} title{continueWatchingMovies.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {continueWatchingMovies.slice(0, 6).map((movie, idx) => (
                  <div
                    key={movie.id}
                    onClick={() => onSelectMovie(movie)}
                    className="w-[200px] sm:w-[240px] shrink-0 cursor-pointer group"
                  >
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 group-hover:border-[#F88F22]/60 bg-[#160610] shadow-md">
                      <img
                        src={movie.backdropUrl || movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTrailer(movie);
                          }}
                          className="w-10 h-10 rounded-full sunset-gradient-btn text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                          title={`Play Trailer — ${movie.title}`}
                          aria-label={`Play Trailer for ${movie.title}`}
                        >
                          <Play className="w-4 h-4 fill-white translate-x-0.5" />
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div 
                          className="h-full bg-gradient-to-r from-[#EA6113] to-[#F88F22]" 
                          style={{ width: `${(idx * 27 + 42) % 85 + 15}%` }} 
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-white group-hover:text-[#FFE3B3] truncate">
                        {movie.title}
                      </h3>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {movie.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------
              SECTION 1: TOP TRENDING MOVIES
              Preserves TMDB's actual trending ranking!
             --------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#EA6113]" />
                  <span>Top Trending Movies</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Global trending ranking direct from TMDB
                </p>
              </div>
              <button
                onClick={() => handleSelectCategory('trending')}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({trendingMovies.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading && trendingMovies.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[115px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse shrink-0" />
                ))}
              </div>
            ) : trendingMovies.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {trendingMovies.map((movie) => (
                  <div key={`trend-${movie.id}`} className="w-[115px] sm:w-[140px] md:w-[160px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movie.id)}
                      onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 p-4 rounded-xl liquid-glass">
                No trending titles currently available.
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------
              SECTION 2: HOLLYWOOD MOVIES
              US productions in English, sorted by recent release date <= today
             --------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#F88F22]" />
                  <span>Hollywood Movies</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Recent major American studio releases in English
                </p>
              </div>
              <button
                onClick={() => handleSelectCategory('hollywood')}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({hollywoodMovies.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading && hollywoodMovies.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[115px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse shrink-0" />
                ))}
              </div>
            ) : hollywoodMovies.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {hollywoodMovies.map((movie) => (
                  <div key={`holly-${movie.id}`} className="w-[115px] sm:w-[140px] md:w-[160px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movie.id)}
                      onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 p-4 rounded-xl liquid-glass">
                No recent Hollywood titles returned by TMDB.
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------
              SECTION 3: HINDI MOVIES
              Original language: hi, sorted by recent release date <= today
             --------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FBB931]" />
                  <span>Hindi Movies</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Recent Hindi cinema and Bollywood releases
                </p>
              </div>
              <button
                onClick={() => handleSelectCategory('hindi')}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({hindiMovies.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading && hindiMovies.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[115px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse shrink-0" />
                ))}
              </div>
            ) : hindiMovies.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {hindiMovies.map((movie) => (
                  <div key={`hindi-${movie.id}`} className="w-[115px] sm:w-[140px] md:w-[160px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movie.id)}
                      onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 p-4 rounded-xl liquid-glass">
                No recent Hindi titles returned by TMDB.
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------
              SECTION 4: ANIMATION MOVIES
              TMDB Genre ID 16, sorted by recent release date <= today
             --------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#FFE3B3]" />
                  <span>Animation Movies</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Recent animated feature films (TMDB Genre #16)
                </p>
              </div>
              <button
                onClick={() => handleSelectCategory('animation')}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({animationMovies.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading && animationMovies.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[115px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse shrink-0" />
                ))}
              </div>
            ) : animationMovies.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {animationMovies.map((movie) => (
                  <div key={`anim-${movie.id}`} className="w-[115px] sm:w-[140px] md:w-[160px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movie.id)}
                      onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 p-4 rounded-xl liquid-glass">
                No recent animation titles returned by TMDB.
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------
              SECTION 5: TAMIL MOVIES
              Original language: ta, sorted by recent release date <= today
             --------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#EA6113]" />
                  <span>Tamil Movies</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Recent Tamil cinema and Kollywood releases
                </p>
              </div>
              <button
                onClick={() => handleSelectCategory('tamil')}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({tamilMovies.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading && tamilMovies.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[115px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse shrink-0" />
                ))}
              </div>
            ) : tamilMovies.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {tamilMovies.map((movie) => (
                  <div key={`tamil-${movie.id}`} className="w-[115px] sm:w-[140px] md:w-[160px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movie.id)}
                      onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 p-4 rounded-xl liquid-glass">
                No recent Tamil titles returned by TMDB.
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------
              SECTION 6: BANGLADESHI MOVIES
              Country of origin: BD, sorted by recent release date <= today
             --------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#FBB931]" />
                  <span>Bangladeshi Movies</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Recent cinema originating from Bangladesh (BD)
                </p>
              </div>
              <button
                onClick={() => handleSelectCategory('bangladeshi')}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({bangladeshiMovies.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading && bangladeshiMovies.length === 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[115px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse shrink-0" />
                ))}
              </div>
            ) : bangladeshiMovies.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {bangladeshiMovies.map((movie) => (
                  <div key={`bd-${movie.id}`} className="w-[115px] sm:w-[140px] md:w-[160px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movie.id)}
                      onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 p-4 rounded-xl liquid-glass">
                No recent Bangladeshi titles currently returned by TMDB.
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------
              ADDITIONAL DISCOVERY & ATMOSPHERE SECTIONS
             --------------------------------------------------------- */}

          {/* Atmospheric Vibe Mood Filter Pills */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EA6113]" />
                  <span>Atmospheric Vibe Categories</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Filter cinema by emotional atmospheric resonance
                </p>
              </div>
              <button
                onClick={() => onExploreVibeMatch()}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] cursor-pointer"
              >
                Open Vibe Match
              </button>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-touch py-1">
              {MOODS.map(mood => {
                const isSelected = selectedMoodId === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => onSelectMood(isSelected ? null : mood.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'sunset-gradient-btn text-white border-[#F88F22] shadow-md'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.accent }} />
                    <span>{mood.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Discovered Movies for the selected Mood */}
            {selectedMoodId && (
              <div className="pt-2 space-y-3">
                <div className="text-xs font-semibold text-[#FBB931]">
                  Live titles discovered for {MOODS.find(m => m.id === selectedMoodId)?.name}:
                </div>
                {isLoadingMood ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="w-[120px] aspect-[2/3] rounded-2xl bg-white/5 animate-pulse shrink-0" />
                    ))}
                  </div>
                ) : moodMovies.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                    {moodMovies.map(movie => (
                      <div key={`mood-${movie.id}`} className="w-[115px] sm:w-[140px] shrink-0">
                        <MovieCard
                          movie={movie}
                          onSelectMovie={onSelectMovie}
                          isWatchlisted={watchlist.includes(movie.id)}
                          onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                          onOpenTrailer={onOpenTrailer}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neutral-400 p-4 rounded-xl liquid-glass">
                    No live titles found for this category in the catalog.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Saved / My List Strip (Only if genuine watchlisted items exist) */}
          {watchlistMovies.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#EA6113] fill-[#EA6113]" />
                  <span>My List</span>
                </h2>
                <span className="text-xs text-neutral-400 font-semibold">
                  {watchlistMovies.length} saved
                </span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {watchlistMovies.map((movie) => (
                  <div key={`saved-${movie.id}`} className="w-[115px] sm:w-[140px] md:w-[160px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={true}
                      onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Connected Universes & Lore Showcase */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#EA6113]" />
                  <span>Connected Universes & Franchises</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Explore sequels, prequels, and overarching cinematic mythology
                </p>
              </div>
              <button
                onClick={() => onExploreConnections()}
                className="text-xs font-semibold text-[#FBB931] hover:text-[#FFE3B3] shrink-0 cursor-pointer"
              >
                All Lore
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {UNIVERSES.slice(0, 3).map((universe) => (
                <div
                  key={universe.id}
                  onClick={() => onExploreConnections(universe as any)}
                  className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#F88F22]/40 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#FBB931] uppercase tracking-wider">
                      {universe.genres.join(' · ')}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {universe.movieCount} Films
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#FFE3B3] transition-colors">
                    {universe.name}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {universe.tagline}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Where to Watch Official Directory Banner */}
          <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#241108]/90 via-[#180C06] to-[#0A0402] border border-[#F88F22]/25 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FBB931] uppercase tracking-wider">
                <Tv className="w-3.5 h-3.5" />
                <span>Streaming Availability Hub</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Where to Watch Official Directory
              </h3>
              <p className="text-xs text-neutral-300 max-w-lg leading-relaxed">
                Curated movie discovery portals, regional guides, and streaming destinations including HDHub4u and MovieLinkBD.
              </p>
            </div>

            <button
              onClick={onExploreWhereToWatch}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white font-bold text-xs shrink-0 shadow-lg transition-all self-start sm:self-center active:scale-95 cursor-pointer"
            >
              <span>Open Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>

          {/* Lead Developer Signature Identity */}
          <section className="pt-2">
            <DeveloperCard variant="full" />
          </section>

        </div>
      )}

    </div>
  );
};
