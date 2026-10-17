/**
 * Movie Verse — Complete Cinematic Universe & Discovery Platform
 * Developer — Estiaq Mehedi
 */

import React, { useState, useEffect, useRef } from 'react';
import { Movie } from './types/movie';
import { storageService } from './services/storageService';
import { tmdbService } from './services/tmdbService';

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
import { PersonDetailView } from './components/person/PersonDetailView';

import { MovieDetailModal } from './components/detail/MovieDetailModal';
import { SearchModal } from './components/search/SearchModal';

interface NavState {
  tab: string;
  category?: string;
  movieId?: string;
  watchId?: string;
  trailerId?: string;
  personId?: string | number;
  searchOpen?: boolean;
  searchQuery?: string;
  inApp?: boolean;
}

function parseUrlToNavState(): NavState {
  try {
    const pathname = window.location.pathname;
    const personPathMatch = pathname.match(/^\/person\/?(\d+)?/i);
    if (personPathMatch && personPathMatch[1]) {
      return { tab: 'person', personId: personPathMatch[1], inApp: false };
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || params.get('tab') || 'home';
    const cat = params.get('category') || undefined;
    const mid = params.get('movieId') || params.get('id') || undefined;
    const movieParam = params.get('movie') || undefined;
    const searchParam = params.get('search') || params.get('q') || undefined;
    const isSearch = params.has('search') || params.has('q');

    if (view === 'person' || params.has('personId')) {
      const pid = params.get('personId') || params.get('id') || mid;
      return { tab: 'person', personId: pid, inApp: false };
    }

    if (view === 'trailer') {
      return { tab: 'trailer', trailerId: mid || movieParam, inApp: false };
    }
    if (view === 'watch') {
      return { tab: 'watch', watchId: mid || movieParam, inApp: false };
    }
    if (view === 'listing') {
      return { tab: 'listing', category: cat || 'trending', movieId: movieParam, inApp: false };
    }

    const validTabs = ['home', 'connections', 'watch-order', 'vibe-match', 'same-vibe', 'where-to-watch', 'library', 'profile', 'person'];
    const tab = validTabs.includes(view) ? view : 'home';

    return {
      tab,
      movieId: movieParam || (view === 'home' && mid ? mid : undefined),
      searchOpen: isSearch,
      searchQuery: searchParam || '',
      inApp: false,
    };
  } catch {
    return { tab: 'home', inApp: false };
  }
}

function buildUrlFromState(state: NavState): string {
  if (state.tab === 'person') {
    if (state.personId) {
      return `/person/${state.personId}`;
    }
    return '/person';
  }
  const params = new URLSearchParams();
  if (state.tab === 'trailer') {
    params.set('view', 'trailer');
    if (state.trailerId) params.set('movieId', state.trailerId);
    return `?${params.toString()}`;
  }
  if (state.tab === 'watch') {
    params.set('view', 'watch');
    if (state.watchId) params.set('movieId', state.watchId);
    return `?${params.toString()}`;
  }
  if (state.tab === 'listing') {
    params.set('view', 'listing');
    if (state.category) params.set('category', state.category);
    if (state.movieId) params.set('movie', state.movieId);
    return `?${params.toString()}`;
  }
  if (state.tab !== 'home') {
    params.set('tab', state.tab);
  }
  if (state.movieId) {
    params.set('movie', state.movieId);
  }
  if (state.searchOpen) {
    params.set('search', state.searchQuery || '');
  }
  const str = params.toString();
  return str ? `?${str}` : '/';
}

export default function App() {
  const initialState = parseUrlToNavState();

  const [activeTab, setActiveTab] = useState<string>(initialState.tab);
  const [listingCategory, setListingCategory] = useState<string>(initialState.category || 'trending');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | number | undefined>(initialState.personId);
  
  // Dedicated Watch & Trailer states
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [trailerMovieId, setTrailerMovieId] = useState<string | undefined>(initialState.trailerId);
  const [watchMovie, setWatchMovie] = useState<Movie | null>(null);
  const [watchMovieId, setWatchMovieId] = useState<string | undefined>(initialState.watchId);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(initialState.searchOpen));
  const [activeSearchQuery, setActiveSearchQuery] = useState(initialState.searchQuery || '');
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

  // History depth & scroll position tracker
  const inAppHistoryDepthRef = useRef<number>(0);
  const scrollPositionsRef = useRef<Record<string, number>>({});

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
        if (selectedMovie) {
          handleCloseMovieDetail();
        } else if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isAboutOpen) {
          setIsAboutOpen(false);
        } else if (isTrailerOpen) {
          setIsTrailerOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMovie, isSearchOpen, isAboutOpen, isTrailerOpen]);

  // Bulletproof scroll position reset for new views
  const resetScrollPosition = (behavior: ScrollBehavior = 'instant') => {
    window.scrollTo({ top: 0, left: 0, behavior });
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      if (mainEl) mainEl.scrollTop = 0;
    });
  };

  // Synchronize browser history, back/forward navigation, and refresh-safe URLs
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state: NavState = e.state || parseUrlToNavState();
      if (inAppHistoryDepthRef.current > 0) {
        inAppHistoryDepthRef.current -= 1;
      }

      const nextTab = state.tab || 'home';
      setActiveTab(nextTab);

      if (state.category) {
        setListingCategory(state.category);
      }

      // Handle Person View
      if (nextTab === 'person') {
        setSelectedPersonId(state.personId);
        setSelectedMovie(null);
        setWatchMovie(null);
        setWatchMovieId(undefined);
        setTrailerMovie(null);
        setTrailerMovieId(undefined);
      }
      // Handle Watch View
      else if (nextTab === 'watch') {
        const wid = state.watchId || state.movieId;
        setWatchMovieId(wid);
        setTrailerMovie(null);
        setTrailerMovieId(undefined);
        setSelectedPersonId(undefined);
        if (wid) {
          const cached = storageService.getCachedMovie(wid);
          if (cached) setWatchMovie(cached);
          else {
            tmdbService.getMovieDetails(wid).then(m => setWatchMovie(m)).catch(() => {});
          }
        }
        setSelectedMovie(null);
      } 
      // Handle Trailer View
      else if (nextTab === 'trailer') {
        const tid = state.trailerId || state.movieId;
        setTrailerMovieId(tid);
        setWatchMovie(null);
        setWatchMovieId(undefined);
        setSelectedPersonId(undefined);
        if (tid) {
          const cached = storageService.getCachedMovie(tid);
          if (cached) setTrailerMovie(cached);
          else {
            tmdbService.getMovieDetails(tid).then(m => setTrailerMovie(m)).catch(() => {});
          }
        }
        setSelectedMovie(null);
      } 
      // Other Views: Restore Movie Details Modal or Close it
      else {
        setWatchMovie(null);
        setWatchMovieId(undefined);
        setTrailerMovie(null);
        setTrailerMovieId(undefined);
        setSelectedPersonId(undefined);

        if (state.movieId) {
          const cached = storageService.getCachedMovie(state.movieId);
          if (cached) {
            setSelectedMovie(cached);
          } else {
            tmdbService.getMovieDetails(state.movieId).then(m => setSelectedMovie(m)).catch(() => {});
          }
        } else {
          setSelectedMovie(null);
        }

        // Restore scroll position when returning from details or subpage
        if (!state.movieId) {
          const scrollKey = nextTab === 'listing' ? `listing_${state.category || 'trending'}` : nextTab;
          const targetY = scrollPositionsRef.current[scrollKey] ?? 0;
          requestAnimationFrame(() => {
            window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
          });
        }
      }

      // Restore Search modal state
      if (state.searchOpen) {
        setIsSearchOpen(true);
        if (state.searchQuery !== undefined) {
          setActiveSearchQuery(state.searchQuery);
        }
      } else {
        setIsSearchOpen(false);
      }
    };

    // On initial mount, if URL has movie ID or watch/trailer ID, resolve metadata
    const init = parseUrlToNavState();
    if (init.movieId) {
      const cached = storageService.getCachedMovie(init.movieId);
      if (cached) {
        setSelectedMovie(cached);
      } else {
        tmdbService.getMovieDetails(init.movieId).then(m => setSelectedMovie(m)).catch(() => {});
      }
    }
    if (init.watchId) {
      const cached = storageService.getCachedMovie(init.watchId);
      if (cached) setWatchMovie(cached);
      else tmdbService.getMovieDetails(init.watchId).then(m => setWatchMovie(m)).catch(() => {});
    }
    if (init.trailerId) {
      const cached = storageService.getCachedMovie(init.trailerId);
      if (cached) setTrailerMovie(cached);
      else tmdbService.getMovieDetails(init.trailerId).then(m => setTrailerMovie(m)).catch(() => {});
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavSelect = (tab: string) => {
    if (tab === activeTab && !selectedMovie && !selectedPersonId) {
      // Tapping already-selected tab smoothly returns to top
      resetScrollPosition('smooth');
    } else {
      // Save current scroll position
      const currentKey = activeTab === 'listing' ? `listing_${listingCategory}` : activeTab;
      scrollPositionsRef.current[currentKey] = window.scrollY || document.documentElement.scrollTop || 0;

      if (tab === 'connections') {
        setTargetUniverseId(undefined);
      }
      setActiveTab(tab);
      setSelectedMovie(null);
      setSelectedPersonId(undefined);
      setIsSearchOpen(false);

      const nextState: NavState = { tab, inApp: true };
      inAppHistoryDepthRef.current += 1;
      try {
        window.history.pushState(nextState, '', buildUrlFromState(nextState));
      } catch {
        // ignore
      }

      // If we previously visited this tab, restore its scroll, otherwise scroll to top
      const prevScroll = scrollPositionsRef.current[tab] ?? 0;
      if (prevScroll > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: prevScroll, left: 0, behavior: 'instant' });
        });
      } else {
        resetScrollPosition('instant');
      }
    }
  };

  const handleSelectPerson = (personId: string | number) => {
    const currentKey = activeTab === 'listing' ? `listing_${listingCategory}` : activeTab;
    scrollPositionsRef.current[currentKey] = window.scrollY || document.documentElement.scrollTop || 0;

    setSelectedPersonId(personId);
    setSelectedMovie(null);
    setIsSearchOpen(false);
    setActiveTab('person');

    const nextState: NavState = {
      tab: 'person',
      personId,
      inApp: true,
    };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleBackFromPerson = () => {
    if (inAppHistoryDepthRef.current > 0) {
      window.history.back();
    } else {
      handleNavSelect('home');
    }
  };

  const handleOpenCategoryListing = (categoryKey: string) => {
    // Save current scroll position before entering listing
    const currentKey = activeTab === 'listing' ? `listing_${listingCategory}` : activeTab;
    scrollPositionsRef.current[currentKey] = window.scrollY || document.documentElement.scrollTop || 0;

    setListingCategory(categoryKey);
    setActiveTab('listing');
    setSelectedMovie(null);
    setIsSearchOpen(false);

    const nextState: NavState = {
      tab: 'listing',
      category: categoryKey,
      inApp: true,
    };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  // Handlers for movie selection and modals
  const handleSelectMovie = (movie: Movie) => {
    // Save current scroll position
    const currentKey = activeTab === 'listing' ? `listing_${listingCategory}` : activeTab;
    scrollPositionsRef.current[currentKey] = window.scrollY || document.documentElement.scrollTop || 0;

    setSelectedMovie(movie);
    storageService.saveCachedMovie(movie);
    const updatedRecents = storageService.addRecentMovie(movie.id);
    setRecentMovieIds(updatedRecents);

    const nextState: NavState = {
      tab: activeTab,
      category: activeTab === 'listing' ? listingCategory : undefined,
      movieId: movie.id,
      searchOpen: isSearchOpen,
      searchQuery: activeSearchQuery,
      inApp: true,
    };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
  };

  const handleCloseMovieDetail = () => {
    if (inAppHistoryDepthRef.current > 0) {
      window.history.back();
    } else {
      setSelectedMovie(null);
      const nextState: NavState = {
        tab: activeTab === 'watch' || activeTab === 'trailer' ? 'home' : activeTab,
        category: activeTab === 'listing' ? listingCategory : undefined,
        inApp: false,
      };
      try {
        window.history.replaceState(nextState, '', buildUrlFromState(nextState));
      } catch {
        // ignore
      }
    }
  };

  const handleOpenSearch = (initialQ?: string) => {
    // Save current scroll position before entering search
    const currentKey = activeTab === 'listing' ? `listing_${listingCategory}` : activeTab;
    scrollPositionsRef.current[currentKey] = window.scrollY || document.documentElement.scrollTop || 0;

    setIsSearchOpen(true);
    const queryToUse = initialQ !== undefined ? initialQ : activeSearchQuery;
    if (initialQ !== undefined) {
      setActiveSearchQuery(initialQ);
    }
    const nextState: NavState = {
      tab: activeTab,
      category: activeTab === 'listing' ? listingCategory : undefined,
      movieId: selectedMovie?.id,
      searchOpen: true,
      searchQuery: queryToUse,
      inApp: true,
    };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
  };

  const handleCloseSearch = () => {
    if (inAppHistoryDepthRef.current > 0) {
      window.history.back();
    } else {
      // Direct visit to Search without previous in-app history entry: safely return to home
      setIsSearchOpen(false);
      setActiveSearchQuery('');
      setSelectedMovie(null);
      setActiveTab('home');
      const nextState: NavState = {
        tab: 'home',
        inApp: false,
      };
      try {
        window.history.replaceState(nextState, '', buildUrlFromState(nextState));
      } catch {
        // ignore
      }
      resetScrollPosition('instant');
    }
  };

  const handleSearchQueryChange = (q: string) => {
    setActiveSearchQuery(q);
    const nextState: NavState = {
      tab: activeTab,
      category: activeTab === 'listing' ? listingCategory : undefined,
      movieId: selectedMovie?.id,
      searchOpen: true,
      searchQuery: q,
      inApp: true,
    };
    try {
      window.history.replaceState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
  };

  const handleOpenTrailer = (movie: Movie) => {
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
    setIsSearchOpen(false);
    setActiveTab('trailer');

    const nextState: NavState = {
      tab: 'trailer',
      trailerId: targetId,
      movieId: targetId,
      inApp: true,
    };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleOpenWatch = (movie: Movie) => {
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
    setIsSearchOpen(false);
    setActiveTab('watch');

    const nextState: NavState = {
      tab: 'watch',
      watchId: targetId,
      movieId: targetId,
      inApp: true,
    };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleBackFromWatchOrTrailer = () => {
    if (inAppHistoryDepthRef.current > 0) {
      window.history.back();
    } else {
      // Fallback: Return to Movie Details for this title on Home
      const mid = watchMovieId || trailerMovieId;
      if (mid) {
        const cached = storageService.getCachedMovie(mid);
        if (cached) {
          setSelectedMovie(cached);
        } else {
          tmdbService.getMovieDetails(mid).then(m => setSelectedMovie(m)).catch(() => {});
        }
        setActiveTab('home');
        const nextState: NavState = { tab: 'home', movieId: mid, inApp: false };
        try {
          window.history.replaceState(nextState, '', buildUrlFromState(nextState));
        } catch {
          // ignore
        }
      } else {
        handleNavSelect('home');
      }
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
    setSelectedMovie(null);
    setIsSearchOpen(false);
    setActiveTab('connections');
    const nextState: NavState = { tab: 'connections', inApp: true };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleExploreWatchOrder = (universeId?: string) => {
    if (universeId) {
      setTargetUniverseId(universeId);
    }
    setSelectedMovie(null);
    setIsSearchOpen(false);
    setActiveTab('watch-order');
    const nextState: NavState = { tab: 'watch-order', inApp: true };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleExploreSameVibe = (movieId?: string) => {
    if (movieId) {
      setTargetSeedMovieId(movieId);
    }
    setSelectedMovie(null);
    setIsSearchOpen(false);
    setActiveTab('same-vibe');
    const nextState: NavState = { tab: 'same-vibe', inApp: true };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleExploreVibeMatch = (movieId?: string) => {
    if (movieId) {
      setTargetSeedMovieId(movieId);
    }
    setSelectedMovie(null);
    setIsSearchOpen(false);
    setActiveTab('vibe-match');
    const nextState: NavState = { tab: 'vibe-match', inApp: true };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  const handleExploreWhereToWatch = (movieId?: string) => {
    if (movieId) {
      setTargetWatchMovieId(movieId);
    }
    setSelectedMovie(null);
    setIsSearchOpen(false);
    setActiveTab('where-to-watch');
    const nextState: NavState = { tab: 'where-to-watch', inApp: true };
    inAppHistoryDepthRef.current += 1;
    try {
      window.history.pushState(nextState, '', buildUrlFromState(nextState));
    } catch {
      // ignore
    }
    resetScrollPosition('instant');
  };

  return (
    <div className="min-h-screen bg-[#0A0402] text-[#FFE3B3] relative selection:bg-[#EA6113]/50 selection:text-white flex flex-col justify-between w-full max-w-full overflow-x-hidden">
      
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
          onOpenSearch={() => handleOpenSearch()}
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
              onOpenSearch={() => handleOpenSearch()}
              onViewAll={handleOpenCategoryListing}
            />
          )}

          {activeTab === 'listing' && (
            <CategoryListingView
              categoryKey={listingCategory}
              onBack={() => {
                if (inAppHistoryDepthRef.current > 0) {
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
              onSelectPerson={handleSelectPerson}
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
              onSelectPerson={handleSelectPerson}
            />
          )}

          {activeTab === 'person' && selectedPersonId && (
            <PersonDetailView
              personId={selectedPersonId}
              onBack={handleBackFromPerson}
              onSelectMovie={handleSelectMovie}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenTrailer={handleOpenTrailer}
              onOpenWatch={handleOpenWatch}
              onSelectPerson={handleSelectPerson}
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

        {/* Unified Footer System (Full on Home Page, Minimal on all other views) */}
        <Footer
          onOpenAbout={() => setIsAboutOpen(true)}
          onNavigate={handleNavSelect}
          isHome={activeTab === 'home' && !selectedMovie}
        />

        {/* Mobile Fixed Bottom Navigation Bar matching Reference 1 */}
        <MobileNav
          activeTab={activeTab}
          setActiveTab={handleNavSelect}
          onResetScroll={() => resetScrollPosition('smooth')}
          onOpenSearch={() => handleOpenSearch()}
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
        onSelectMovie={handleSelectMovie}
        onOpenTrailer={handleOpenTrailer}
        onOpenWatch={handleOpenWatch}
        onSelectPerson={handleSelectPerson}
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
        onClose={handleCloseSearch}
        onBack={handleCloseSearch}
        onSelectMovie={handleSelectMovie}
        initialQuery={activeSearchQuery}
        onQueryChange={handleSearchQueryChange}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

    </div>
  );
}
