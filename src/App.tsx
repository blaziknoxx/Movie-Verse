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

import { MovieDetailModal } from './components/detail/MovieDetailModal';
import { SearchModal } from './components/search/SearchModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  // Cross-view state parameters
  const [targetUniverseId, setTargetUniverseId] = useState<string | undefined>(undefined);
  const [targetSeedMovieId, setTargetSeedMovieId] = useState<string | undefined>(undefined);
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

  // Handlers
  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    const updatedRecents = storageService.addRecentMovie(movie.id);
    setRecentMovieIds(updatedRecents);
  };

  const handleOpenTrailer = (movie: Movie) => {
    setTrailerMovie(movie);
    setIsTrailerOpen(true);
  };

  const handleToggleWatchlist = (movieId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = storageService.toggleWatchlist(movieId);
    setWatchlist(updated);
  };

  const handleToggleWatched = (movieId: string) => {
    const updated = storageService.toggleWatched(movieId);
    setWatched(updated);
  };

  const handleExploreConnections = (movieOrUniverse?: any) => {
    if (movieOrUniverse && movieOrUniverse.universeId) {
      setTargetUniverseId(movieOrUniverse.universeId);
    } else if (movieOrUniverse && movieOrUniverse.id) {
      setTargetUniverseId(movieOrUniverse.id);
    }
    setActiveTab('connections');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreWatchOrder = (universeId?: string) => {
    if (universeId) {
      setTargetUniverseId(universeId);
    }
    setActiveTab('watch-order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreSameVibe = (movieId?: string) => {
    if (movieId) {
      setTargetSeedMovieId(movieId);
    }
    setActiveTab('same-vibe');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreVibeMatch = (movieId?: string) => {
    if (movieId) {
      setTargetSeedMovieId(movieId);
    }
    setActiveTab('vibe-match');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreWhereToWatch = () => {
    setActiveTab('where-to-watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
              onOpenSearch={() => setIsSearchOpen(true)}
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
            />
          )}

          {activeTab === 'same-vibe' && (
            <SameVibeView
              onSelectMovie={handleSelectMovie}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              initialSeedMovieId={targetSeedMovieId}
            />
          )}

          {activeTab === 'where-to-watch' && (
            <WhereToWatchView />
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
            />
          )}
        </main>

        {/* Footer */}
        <Footer onOpenAbout={() => setIsAboutOpen(true)} />

        {/* Mobile Fixed Bottom Navigation Bar matching Reference 1 */}
        <MobileNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
      />

      {/* Official Trailer Playback Modal */}
      <TrailerModal
        movie={trailerMovie}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
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
