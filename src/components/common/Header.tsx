import React from 'react';
import { Search, Bookmark, Film, Bell, Sparkles, Network, Tv, ListOrdered, User } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAbout: () => void;
  watchlistCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAbout,
  watchlistCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#070104]/90 backdrop-blur-xl border-b border-white/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Greeting + Wordmark matching Reference 1 ("Hello / Venkatesh M") */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-950 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(229,9,20,0.4)] shrink-0">
            <Film className="w-4 h-4 text-white" />
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-medium leading-tight">
              Hello, Cinephile
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-white tracking-tight group-hover:text-red-200 transition-colors">
                Movie Verse
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 hidden sm:inline-block" />
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold">
          {[
            { id: 'home', label: 'Discover' },
            { id: 'connections', label: 'Connected Movies' },
            { id: 'watch-order', label: 'Watch Order' },
            { id: 'vibe-match', label: 'Vibe Match' },
            { id: 'same-vibe', label: 'Same Vibe' },
            { id: 'where-to-watch', label: 'Where to Watch' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === item.id
                  ? 'text-white border-b-2 border-red-600 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Header Actions matching Reference 1: Bell, Search, Watchlist, Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-all text-xs font-medium focus:outline-none"
            title="Search movies (⌘K or /)"
            aria-label="Search movies"
          >
            <Search className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline px-1 py-0.5 text-[9px] bg-black/50 rounded border border-white/10 text-neutral-400">⌘K</kbd>
          </button>

          {/* Watchlist / Saved Icon Button */}
          <button
            onClick={() => setActiveTab('library')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all border relative ${
              activeTab === 'library'
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(229,9,20,0.5)]'
                : 'bg-white/[0.05] hover:bg-white/10 text-neutral-300 hover:text-white border-white/10'
            }`}
            title="My Library & Watchlist"
            aria-label="Library and Watchlist"
          >
            <Bookmark className="w-4 h-4" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-black">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* About / Info Modal Button */}
          <button
            onClick={onOpenAbout}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 flex items-center justify-center transition-all"
            title="About Movie Verse & Developer"
            aria-label="About Movie Verse"
          >
            <User className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
