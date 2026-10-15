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
    <header className="sticky top-0 z-40 w-full bg-[#0A0402]/95 backdrop-blur-xl border-b border-[#F88F22]/15 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Coordinated Glowing Brand Identity (Logo + "Hello Cinephile" + "Movie Verse") */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0"
        >
          {/* Movie Verse Logo Box with Coordinated Glow */}
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl header-logo-glow flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 active:scale-95"
            title="Movie Verse Home"
          >
            <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] header-icon-glow" />
          </div>

          <div className="flex flex-col min-w-0">
            {/* "Hello Cinephile" with subtle warm gold glow */}
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase header-subtext-glow truncate leading-tight">
              Hello Cinephile
            </span>
            {/* "Movie Verse" Wordmark with Distinctive Brand Glow */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base md:text-lg font-black text-white header-brand-glow tracking-tight group-hover:text-[#FFE3B3] transition-colors truncate">
                Movie Verse
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBB931] shadow-[0_0_8px_#FBB931] hidden sm:inline-block" />
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
                  ? 'text-[#FFE3B3] border-b-2 border-[#EA6113] font-bold header-subtext-glow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Header Actions: Coordinated Glowing Search, Saved, Account/Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Search Button with Glowing Search Icon */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl header-btn-glow text-neutral-200 hover:text-white transition-all text-xs font-semibold focus:outline-none cursor-pointer"
            title="Search movies (⌘K or /)"
            aria-label="Search movies"
          >
            <Search className="w-4 h-4 text-[#F88F22] header-icon-glow shrink-0" />
            <span className="hidden sm:inline text-xs">Search</span>
            <kbd className="hidden sm:inline px-1 py-0.5 text-[9px] bg-black/50 rounded border border-[#F88F22]/20 text-[#FFE3B3]/80">⌘K</kbd>
          </button>

          {/* Saved / Watchlist Button with Glowing Saved Icon */}
          <button
            onClick={() => setActiveTab('library')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
              activeTab === 'library'
                ? 'header-btn-active text-white'
                : 'header-btn-glow text-neutral-300 hover:text-white'
            }`}
            title="My Library & Saved Movies"
            aria-label="Saved Movies"
          >
            <Bookmark className={`w-4 h-4 header-icon-glow ${activeTab === 'library' ? 'text-white fill-white' : 'text-[#F88F22]'}`} />
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-black shadow-[0_0_8px_rgba(234,97,19,0.8)]">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* Account / Profile Button with Glowing Profile Icon */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'header-btn-active text-white'
                : 'header-btn-glow text-neutral-300 hover:text-white'
            }`}
            title="Account & CineProfile"
            aria-label="Account Profile"
          >
            <User className={`w-4 h-4 header-icon-glow ${activeTab === 'profile' ? 'text-white' : 'text-[#FBB931]'}`} />
          </button>
        </div>

      </div>
    </header>
  );
};
