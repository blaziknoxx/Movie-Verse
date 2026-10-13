import React from 'react';
import { Search, Bookmark, Compass, Sparkles, Film } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  watchlistCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  watchlistCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full liquid-glass-nav transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element Brand wordmark */}
        <button
          onClick={() => setActiveTab('home')}
          className="text-left group flex items-center gap-2.5 whitespace-nowrap shrink-0 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-rose-950 flex items-center justify-center border border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.35)]">
            <Film className="w-4 h-4 text-rose-100" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-rose-200 transition-colors">
            Movie Verse
          </span>
        </button>

        {/* Zone 2: 4–5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'home'
                ? 'text-white border-rose-500 font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'connections'
                ? 'text-white border-rose-500 font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveTab('watch-order')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'watch-order'
                ? 'text-white border-rose-500 font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            Watch Order
          </button>
          <button
            onClick={() => setActiveTab('same-vibe')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'same-vibe'
                ? 'text-white border-rose-500 font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            Same Vibe
          </button>
          <button
            onClick={() => setActiveTab('where-to-watch')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
              activeTab === 'where-to-watch'
                ? 'text-white border-rose-500 font-semibold'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            Where to Watch
          </button>
        </nav>

        {/* Zone 3: 1 primary action cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500/50"
            title="Search movies (⌘K or /)"
          >
            <Search className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-black/40 rounded border border-white/10 text-neutral-400">⌘K</kbd>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-rose-900/60 border-rose-500/40 text-white shadow-[0_0_15px_rgba(225,29,72,0.25)]'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-neutral-300 hover:text-white'
            }`}
            title="My Library & Watchlist"
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Library</span>
            {watchlistCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                {watchlistCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
