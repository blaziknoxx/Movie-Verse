/**
 * Movie Verse — Complete Cinematic Universe & Discovery Platform
 * Developer — Estiaq Mehedi
 */

import React, { useState, useEffect } from 'react';
import { Movie } from './types/movie';
import { storageService } from './services/storageService';

import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { Footer } from './components/common/Footer';
import { AboutModal } from './components/common/AboutModal';
import { TrailerModal } from './components/common/TrailerModal';

import { HomeView } from './components/home/HomeView';
import { ConnectionsView } from './components/connections/ConnectionsView';
import { WatchOrderView } from './components/watchorder/WatchOrderView';
import { SameVibeView } from './components/samevibe/SameVibeView';
import { VibeMatchView } from './components/vibematch/VibeMatchView';
import { WhereToWatchView } from './components/wheretowatch/WhereToWatchView';
import { LibraryView } from './components/library/LibraryView';
import { CineProfileView } from './components/profile/CineProfileView';
import { CategoryListingView } from './components/listing/CategoryListingView';
import { TrailerPage } from './components/watch/TrailerPage';
import { WatchPage } from './components/watch/WatchPage';

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

  // Bulletproof scroll position reset for seamless mobile and desktop navigation
  const resetScrollPosition = (behavior: ScrollBehavior = 'instant') => {
    // 1. Reset browser window scroll
    window.scrollTo({ top: 0, left: 0, behavior });
    
    // 2. Reset document root scrolling elements
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 3. Reset main element and any nested containers with overflow
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    const scrollContainers = document.querySelectorAll('[data-scroll-root]');
    scrollContainers.forEach(el => { el.scrollTop = 0; });

    // 4. Delayed check on next frame for asynchronously rendered or reflowed content
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      if (mainEl) mainEl.scrollTop = 0;
    });
  };

  // Synchronize browser history and refresh-safe URLs
  useEffect(() => {
    const handleUrlState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || params.get('tab');
        const cat = params.get('category');
        const mid = params.get('movieId') || params.get('id');

        if (view === 'listing' && cat) {
          setListingCategory(cat);
          setActiveTab('listing');
        } else if (view === 'trailer') {
          if (mid) {
            setTrailerMovieId(mid);
            const cached = storageService.getCachedMovie(mid);
            if (cached) setTrailerMovie(cached);
          }
          setActiveTab('trailer');
        } else if (view === 'watch') {
          if (mid) {
            setWatchMovieId(mid);
            const cached = storageService.getCachedMovie(mid);
            if (cached) setWatchMovie(cached);
          }
          setActiveTab('watch');
        } else if (view && ['home', 'connections', 'watch-order', 'vibe-match', 'same-vibe', 'where-to-watch', 'library', 'profile'].includes(view)) {
          if (view === 'connections') {
            setTargetUniverseId(undefined);
          }
          setActiveTab(view);
        } else if (!view || view === 'home') {
          setActiveTab('home');
        }
      } catch {
        // ignore
      }
    };

    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    return () => window.removeEventListener('popstate', handleUrlState);
  }, []);

  // Ensure scroll resets immediately whenever activeTab changes
  useEffect(() => {
    resetScrollPosition('instant');
  }, [activeTab]);

  const handleNavSelect = (tab: string) => {
    if (tab === activeTab) {
      // Tapping already-selected tab returns smoothly to top
      resetScrollPosition('smooth');
    } else {
      if (tab === 'connections') {
        setTargetUniverseId(undefined);
      }
      setActiveTab(tab);
      try {
        window.history.pushState(
          { tab },
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
    setListingCategory(categoryKey);
    setActiveTab('listing');
    try {
      window.history.pushState(
        { tab: 'listing', category: categoryKey },
        '',
        `?view=listing&category=${categoryKey}`
      );
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  // Handlers
  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    const updatedRecents = storageService.addRecentMovie(movie.id);
    setRecentMovieIds(updatedRecents);
  };

  const handleOpenTrailer = (movie: Movie) => {
    setTrailerMovie(movie);
    setTrailerMovieId(movie.id);
    setSelectedMovie(null);
    setActiveTab('trailer');
    try {
      window.history.pushState(
        { tab: 'trailer', movieId: movie.id },
        '',
        `?view=trailer&movieId=${movie.id}`
      );
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleOpenWatch = (movie: Movie) => {
    setWatchMovie(movie);
    setWatchMovieId(movie.id);
    setSelectedMovie(null);
    setActiveTab('watch');
    try {
      window.history.pushState(
        { tab: 'watch', movieId: movie.id },
        '',
        `?view=watch&movieId=${movie.id}`
      );
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleBackFromWatchOrTrailer = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleNavSelect('home');
    }
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
        <div className="ambient-glow-crimson top-0 left-1/4 w-[380px] h-[380px] -translate-x-1/2 opacity-25" />
        <div className="ambient-glow-wine top-[35%] right-0 w-[420px] h-[420px] opacity-20" />
        <div className="ambient-glow-crimson bottom-10 left-10 w-[350px] h-[350px] opacity-15" />
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
                if (window.history.length > 1 && window.history.state?.tab === 'listing') {
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
        onClose={() => setSelectedMovie(null)}
        isWatchlisted={selectedMovie ? watchlist.includes(selectedMovie.id) : false}
        isWatched={selectedMovie ? watched.includes(selectedMovie.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleWatched={handleToggleWatched}
        onNavigateToConnections={handleExploreConnections}
        onNavigateToWatchOrder={handleExploreWatchOrder}
        onNavigateToSameVibe={handleExploreSameVibe}
        onNavigateToVibeMatch={handleExploreVibeMatch}
        onNavigateToWhereToWatch={handleExploreWhereToWatch}
        onSelectMovie={handleSelectMovie}
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
        onSelectMovie={handleSelectMovie}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

    </div>
  );
}
