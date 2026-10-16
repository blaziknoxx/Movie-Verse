/**
 * Movie Verse — Complete Cinematic Universe & Discovery Platform
 * Developer — Estiaq Mehedi
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Movie } from './types/movie';
import { storageService } from './services/storageService';
import { tmdbService } from './services/tmdbService';

import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { Footer } from './components/common/Footer';
import { AboutModal } from './components/common/AboutModal';
import { TrailerModal } from './components/common/TrailerModal';

import { HomeView } from './components/home/HomeView';

const ConnectionsView = React.lazy(() => import('./components/connections/ConnectionsView').then(m => ({ default: m.ConnectionsView })));
const WatchOrderView = React.lazy(() => import('./components/watchorder/WatchOrderView').then(m => ({ default: m.WatchOrderView })));
const SameVibeView = React.lazy(() => import('./components/samevibe/SameVibeView').then(m => ({ default: m.SameVibeView })));
const VibeMatchView = React.lazy(() => import('./components/vibematch/VibeMatchView').then(m => ({ default: m.VibeMatchView })));
const WhereToWatchView = React.lazy(() => import('./components/wheretowatch/WhereToWatchView').then(m => ({ default: m.WhereToWatchView })));
const LibraryView = React.lazy(() => import('./components/library/LibraryView').then(m => ({ default: m.LibraryView })));
const CineProfileView = React.lazy(() => import('./components/profile/CineProfileView').then(m => ({ default: m.CineProfileView })));
const CategoryListingView = React.lazy(() => import('./components/listing/CategoryListingView').then(m => ({ default: m.CategoryListingView })));
const TrailerPage = React.lazy(() => import('./components/watch/TrailerPage').then(m => ({ default: m.TrailerPage })));
const WatchPage = React.lazy(() => import('./components/watch/WatchPage').then(m => ({ default: m.WatchPage })));

import { MovieDetailModal } from './components/detail/MovieDetailModal';
import { SearchModal } from './components/search/SearchModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [listingCategory, setListingCategory] = useState<string>('trending');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  
  // Dedicated Watch & Trailer states
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [trailerMovieId, setTrailerMovieId] = useState<string | undefined>(undefined);
  const [watchMovie, setWatchMovie] = useState<Movie | null>(null);
  const [watchMovieId, setWatchMovieId] = useState<string | undefined>(undefined);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  // Cross-view state parameters
  const [targetUniverseId, setTargetUniverseId] = useState<string | undefined>(undefined);
  const [targetSeedMovieId, setTargetSeedMovieId] = useState<string | undefined>(undefined);
  const [targetWatchMovieId, setTargetWatchMovieId] = useState<string | undefined>(undefined);
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);

  // Local storage state
  const [watchlist, setWatchlist] = useState<string[]>(() => storageService.getWatchlist());
  const [watched, setWatched] = useState<string[]>(() => storageService.getWatched());
  const [recentMovieIds, setRecentMovieIds] = useState<string[]>(() => storageService.getRecentMovies());

  // Global keyboard shortcuts (⌘K or / for search, Esc for close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAboutOpen(false);
        setIsTrailerOpen(false);
        setSelectedMovie(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // In-memory view scroll position cache
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const listingCategoryRef = useRef(listingCategory);
  listingCategoryRef.current = listingCategory;

  const getViewKey = (tab: string, category?: string) => {
    return tab === 'listing' ? `listing:${category || listingCategoryRef.current}` : tab;
  };

  const saveCurrentScroll = () => {
    const key = getViewKey(activeTabRef.current, listingCategoryRef.current);
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    scrollPositionsRef.current.set(key, y);
  };

  const restoreScrollPosition = (key: string) => {
    const y = scrollPositionsRef.current.get(key) || 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'instant' });
    });
  };

  // Bulletproof scroll position reset for seamless mobile and desktop navigation
  const resetScrollPosition = (behavior: ScrollBehavior = 'instant') => {
    window.scrollTo({ top: 0, left: 0, behavior });
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  };

  // Synchronize browser history, direct URLs, and refresh-safe query state
  useEffect(() => {
    const handleUrlState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || params.get('tab');
        const cat = params.get('category');
        const mid = params.get('movieId') || params.get('id');
        const movieModalId = params.get('movie') || window.history.state?.movieModalId;
        const isFromSearch = Boolean(window.history.state?.fromSearch);

        // 1. Synchronize Tab / View
        if (view === 'listing' && cat) {
          setListingCategory(cat);
          setActiveTab('listing');
          restoreScrollPosition(`listing:${cat}`);
        } else if (view === 'trailer') {
          if (mid) {
            setTrailerMovieId(mid);
            const cached = storageService.getCachedMovie(mid);
            if (cached) setTrailerMovie(cached);
          }
          setActiveTab('trailer');
          setSelectedMovie(null);
        } else if (view === 'watch') {
          if (mid) {
            setWatchMovieId(mid);
            const cached = storageService.getCachedMovie(mid);
            if (cached) setWatchMovie(cached);
          }
          setActiveTab('watch');
          setSelectedMovie(null);
        } else if (view && ['home', 'connections', 'watch-order', 'vibe-match', 'same-vibe', 'where-to-watch', 'library', 'profile'].includes(view)) {
          if (view === 'connections' && !targetUniverseId) {
            setTargetUniverseId(undefined);
          }
          setActiveTab(view);
          restoreScrollPosition(view);
        } else {
          setActiveTab('home');
          restoreScrollPosition('home');
        }

        // 2. Synchronize Movie Details Modal
        if (movieModalId && view !== 'watch' && view !== 'trailer') {
          const cached = storageService.getCachedMovie(movieModalId);
          if (cached) {
            setSelectedMovie(cached);
          } else {
            // Direct URL entry or reload: dynamically resolve genuine TMDB details
            const cleanId = String(movieModalId).replace(/\D/g, '');
            if (cleanId) {
              tmdbService.getMovieDetails(cleanId).then(loaded => {
                setSelectedMovie(loaded);
                storageService.saveCachedMovie(loaded);
              }).catch(() => {});
            }
          }
        } else if (!movieModalId) {
          setSelectedMovie(null);
        }

        // 3. Restore Search Modal if returning to search results
        if (isFromSearch && !movieModalId && view !== 'watch' && view !== 'trailer') {
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.warn('History synchronization notice:', err);
      }
    };

    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    return () => window.removeEventListener('popstate', handleUrlState);
  }, []);

  const handleNavSelect = (tab: string) => {
    if (tab === activeTab) {
      resetScrollPosition('smooth');
    } else {
      saveCurrentScroll();
      if (tab === 'connections') {
        setTargetUniverseId(undefined);
      }
      setSelectedMovie(null);
      setActiveTab(tab);
      try {
        window.history.pushState(
          { tab, inAppNavigation: true },
          '',
          tab === 'home' ? '/' : `?tab=${tab}`
        );
      } catch {
        // ignore
      }
      resetScrollPosition('instant');
    }
  };

  const handleOpenCategoryListing = (categoryKey: string) => {
    saveCurrentScroll();
    setSelectedMovie(null);
    setListingCategory(categoryKey);
    setActiveTab('listing');
    try {
      window.history.pushState(
        { tab: 'listing', category: categoryKey, inAppNavigation: true },
        '',
        `?view=listing&category=${categoryKey}`
      );
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  // Movie Details Modal handler: history-aware, preserves previous view & search query
  const handleSelectMovie = (movie: Movie, fromSearch = false) => {
    saveCurrentScroll();
    setSelectedMovie(movie);
    const updatedRecents = storageService.addRecentMovie(movie.id);
    setRecentMovieIds(updatedRecents);
    storageService.saveCachedMovie(movie);

    try {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('movie', movie.id);
      window.history.pushState(
        {
          tab: activeTab,
          category: listingCategory,
          movieModalId: movie.id,
          fromSearch: Boolean(fromSearch || isSearchOpen),
          inAppNavigation: true
        },
        '',
        `?${currentParams.toString()}`
      );
    } catch {
      // ignore
    }

    if (fromSearch) {
      setIsSearchOpen(false);
    }
  };

  const handleCloseMovieDetail = () => {
    if (window.history.state?.movieModalId) {
      window.history.back();
    } else {
      setSelectedMovie(null);
      const params = new URLSearchParams(window.location.search);
      params.delete('movie');
      const queryStr = params.toString();
      try {
        window.history.replaceState(
          window.history.state,
          '',
          queryStr ? `?${queryStr}` : (activeTab === 'home' ? '/' : `?tab=${activeTab}`)
        );
      } catch {
        // ignore
      }
      if (window.history.state?.fromSearch) {
        setIsSearchOpen(true);
      }
    }
  };

  const handleOpenTrailer = (movie: Movie) => {
    saveCurrentScroll();
    const cached = storageService.getCachedMovie(movie.id);
    const numericTmdbId = movie.tmdbId || (Number(movie.id) ? Number(movie.id) : undefined) || cached?.tmdbId;
    const resolvedMovie: Movie = {
      ...movie,
      ...(numericTmdbId ? { tmdbId: numericTmdbId } : {})
    };
    const targetId = numericTmdbId ? String(numericTmdbId) : movie.id;

    setTrailerMovie(resolvedMovie);
    setTrailerMovieId(targetId);
    storageService.saveCachedMovie(resolvedMovie);
    setSelectedMovie(null);
    setActiveTab('trailer');
    try {
      window.history.pushState(
        { 
          tab: 'trailer', 
          movieId: targetId, 
          previousMovieDetailId: movie.id,
          fromTab: activeTab,
          fromCategory: listingCategory,
          inAppNavigation: true 
        },
        '',
        `?view=trailer&movieId=${targetId}`
      );
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleOpenWatch = (movie: Movie) => {
    saveCurrentScroll();
    const cached = storageService.getCachedMovie(movie.id);
    const numericTmdbId = movie.tmdbId || (Number(movie.id) ? Number(movie.id) : undefined) || cached?.tmdbId;
    const resolvedMovie: Movie = {
      ...movie,
      ...(numericTmdbId ? { tmdbId: numericTmdbId } : {})
    };
    const targetId = numericTmdbId ? String(numericTmdbId) : movie.id;

    setWatchMovie(resolvedMovie);
    setWatchMovieId(targetId);
    storageService.saveCachedMovie(resolvedMovie);
    setSelectedMovie(null);
    setActiveTab('watch');
    try {
      window.history.pushState(
        { 
          tab: 'watch', 
          movieId: targetId, 
          previousMovieDetailId: movie.id,
          fromTab: activeTab,
          fromCategory: listingCategory,
          inAppNavigation: true 
        },
        '',
        `?view=watch&movieId=${targetId}`
      );
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleBackFromWatchOrTrailer = () => {
    // If in-site history exists, use browser back to return to movie details or previous view
    if (window.history.state?.inAppNavigation) {
      window.history.back();
      return;
    }

    // Fallback for direct URL or fresh reload: return to Movie Details if known, or to Home
    const fallbackId = window.history.state?.previousMovieDetailId || watchMovieId || trailerMovieId;
    if (fallbackId) {
      const cached = storageService.getCachedMovie(fallbackId);
      if (cached) {
        setSelectedMovie(cached);
        setActiveTab('home');
        try {
          window.history.replaceState({ tab: 'home', movieModalId: fallbackId, inAppNavigation: true }, '', `/?movie=${fallbackId}`);
        } catch {
          // ignore
        }
        return;
      }
    }
    handleNavSelect('home');
  };

  const handleToggleWatchlist = (movieId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = storageService.toggleWatchlist(movieId);
    setWatchlist(updated);
  };

  const handleToggleWatched = (movieId: string, movieObj?: Movie) => {
    const updated = storageService.toggleWatched(movieId, movieObj);
    setWatched(updated);
  };

  const handleExploreConnections = (movieOrUniverse?: any) => {
    if (movieOrUniverse && movieOrUniverse.universeId) {
      setTargetUniverseId(movieOrUniverse.universeId);
    } else if (movieOrUniverse && movieOrUniverse.id) {
      setTargetUniverseId(movieOrUniverse.id);
    }
    setActiveTab('connections');
    resetScrollPosition('instant');
  };

  const handleExploreWatchOrder = (universeId?: string) => {
    if (universeId) {
      setTargetUniverseId(universeId);
    }
    setActiveTab('watch-order');
    resetScrollPosition('instant');
  };

  const handleExploreSameVibe = (movieId?: string) => {
    if (movieId) {
      setTargetSeedMovieId(movieId);
    }
    setActiveTab('same-vibe');
    resetScrollPosition('instant');
  };

  const handleExploreVibeMatch = (movieId?: string) => {
    if (movieId) {
      setTargetSeedMovieId(movieId);
    }
    setActiveTab('vibe-match');
    resetScrollPosition('instant');
  };

  const handleExploreWhereToWatch = (movieId?: string) => {
    if (movieId) {
      setTargetWatchMovieId(movieId);
    }
    setActiveTab('where-to-watch');
    resetScrollPosition('instant');
  };

  return (
    <div className="min-h-screen bg-[#070104] text-[#f4eff1] relative selection:bg-red-900/60 selection:text-white flex flex-col justify-between w-full max-w-full overflow-x-hidden">
      
      {/* Contained Ambient Background Glows — Overflow strictly isolated to prevent mobile drift */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ambient-glow-sunset-flame top-0 left-1/4 w-[380px] h-[380px] -translate-x-1/2 opacity-25" />
        <div className="ambient-glow-sunset-gold top-[35%] right-0 w-[420px] h-[420px] opacity-20" />
        <div className="ambient-glow-sunset-flame bottom-10 left-10 w-[350px] h-[350px] opacity-15" />
      </div>

      {/* Main App Container */}
      <div className="relative z-10 w-full max-w-full flex-grow flex flex-col min-w-0">
        
        {/* Top Header matching Reference 1 */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleNavSelect}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          watchlistCount={watchlist.length}
        />

        {/* Content Area */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 w-full flex-grow pb-24 lg:pb-12 min-w-0 max-w-full overflow-x-hidden">
          {activeTab === 'home' && (
            <HomeView
              onSelectMovie={handleSelectMovie}
              onExploreConnections={handleExploreConnections}
              onExploreWatchOrder={handleExploreWatchOrder}
              onExploreSameVibe={handleExploreSameVibe}
              onExploreVibeMatch={handleExploreVibeMatch}
              onExploreWhereToWatch={handleExploreWhereToWatch}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              recentMovieIds={recentMovieIds}
              selectedMoodId={selectedMoodId}
              onSelectMood={setSelectedMoodId}
              onOpenTrailer={handleOpenTrailer}
              onOpenWatch={handleOpenWatch}
              onOpenSearch={() => setIsSearchOpen(true)}
              onViewAll={handleOpenCategoryListing}
            />
          )}

          {activeTab === 'listing' && (
            <CategoryListingView
              categoryKey={listingCategory}
              onBack={() => {
                if (window.history.state?.inAppNavigation) {
                  window.history.back();
                } else {
                  handleNavSelect('home');
                }
              }}
              onSelectMovie={handleSelectMovie}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenTrailer={handleOpenTrailer}
              onOpenWatch={handleOpenWatch}
            />
          )}

          {activeTab === 'trailer' && (
            <TrailerPage
              movie={trailerMovie}
              movieId={trailerMovieId}
              onBack={handleBackFromWatchOrTrailer}
              onSelectMovie={handleSelectMovie}
              onOpenWatch={handleOpenWatch}
              isWatchlisted={trailerMovie ? watchlist.includes(trailerMovie.id) : false}
              onToggleWatchlist={handleToggleWatchlist}
            />
          )}

          {activeTab === 'watch' && (
            <WatchPage
              movie={watchMovie}
              movieId={watchMovieId}
              onBack={handleBackFromWatchOrTrailer}
              onSelectMovie={handleSelectMovie}
              onOpenTrailer={handleOpenTrailer}
              isWatchlisted={watchMovie ? watchlist.includes(watchMovie.id) : false}
              isWatched={watchMovie ? watched.includes(watchMovie.id) : false}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
            />
          )}

          {activeTab === 'connections' && (
            <ConnectionsView
              onSelectMovie={handleSelectMovie}
              selectedUniverseId={targetUniverseId}
            />
          )}

          {activeTab === 'watch-order' && (
            <WatchOrderView
              onSelectMovie={handleSelectMovie}
            />
          )}

          {activeTab === 'vibe-match' && (
            <VibeMatchView
              onSelectMovie={handleSelectMovie}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              initialSeedMovieId={targetSeedMovieId}
              onOpenTrailer={handleOpenTrailer}
              onOpenWatch={handleOpenWatch}
            />
          )}

          {activeTab === 'same-vibe' && (
            <SameVibeView
              onSelectMovie={handleSelectMovie}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              initialSeedMovieId={targetSeedMovieId}
              onOpenTrailer={handleOpenTrailer}
              onOpenWatch={handleOpenWatch}
            />
          )}

          {activeTab === 'where-to-watch' && (
            <WhereToWatchView
              initialMovieId={targetWatchMovieId}
              onSelectMovie={handleSelectMovie}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              watchlist={watchlist}
              watched={watched}
              recentMovieIds={recentMovieIds}
              onSelectMovie={handleSelectMovie}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onGoToDiscover={() => setActiveTab('home')}
              onOpenTrailer={handleOpenTrailer}
              onOpenWatch={handleOpenWatch}
            />
          )}

          {activeTab === 'profile' && (
            <CineProfileView
              onBack={() => setActiveTab('home')}
              onSelectMovie={handleSelectMovie}
              watchlist={watchlist}
              watched={watched}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleWatched={handleToggleWatched}
              onOpenTrailer={handleOpenTrailer}
            />
          )}
        </main>

        {/* Footer */}
        <Footer onOpenAbout={() => setIsAboutOpen(true)} />

        {/* Mobile Fixed Bottom Navigation Bar matching Reference 1 */}
        <MobileNav
          activeTab={activeTab}
          setActiveTab={handleNavSelect}
          onResetScroll={() => resetScrollPosition('smooth')}
          onOpenSearch={() => setIsSearchOpen(true)}
          watchlistCount={watchlist.length}
        />

      </div>

      {/* Global Movie Details Screen Modal matching Reference 2 */}
      <MovieDetailModal
        movie={selectedMovie}
        onClose={handleCloseMovieDetail}
        isWatchlisted={selectedMovie ? watchlist.includes(selectedMovie.id) : false}
        isWatched={selectedMovie ? watched.includes(selectedMovie.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleWatched={handleToggleWatched}
        onNavigateToConnections={handleExploreConnections}
        onNavigateToWatchOrder={handleExploreWatchOrder}
        onNavigateToSameVibe={handleExploreSameVibe}
        onNavigateToVibeMatch={handleExploreVibeMatch}
        onNavigateToWhereToWatch={handleExploreWhereToWatch}
        onSelectMovie={(m) => handleSelectMovie(m)}
        onOpenTrailer={handleOpenTrailer}
        onOpenWatch={handleOpenWatch}
      />

      {/* Official Trailer Playback Modal */}
      <TrailerModal
        movie={trailerMovie}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        onSelectMovie={handleSelectMovie}
        isWatchlisted={trailerMovie ? watchlist.includes(trailerMovie.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
        onNavigateToWhereToWatch={handleExploreWhereToWatch}
      />

      {/* Instant Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMovie={(movie) => handleSelectMovie(movie, true)}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

    </div>
  );
}
