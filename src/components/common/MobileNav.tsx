import React from 'react';
import { Home, Search, Network, Sparkles, Bookmark } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  watchlistCount: number;
  onResetScroll?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  watchlistCount,
  onResetScroll
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search-trigger', label: 'Search', icon: Search, isAction: true },
    { id: 'connections', label: 'Connected', icon: Network },
    { id: 'vibe-match', label: 'Vibe Match', icon: Sparkles },
    { id: 'library', label: 'Library', icon: Bookmark, badge: watchlistCount },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070104]/95 backdrop-blur-2xl border-t border-white/[0.08] pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'listing');

          const handleClick = () => {
            if (item.isAction) {
              onOpenSearch();
            } else if (isActive) {
              // Tapping active tab scrolls back to top
              if (onResetScroll) {
                onResetScroll();
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            } else {
              setActiveTab(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all select-none cursor-pointer ${
                isActive ? 'text-[#FBB931] font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.2] text-[#F88F22] header-icon-glow fill-[#EA6113]/25' : 'stroke-[1.8]'
                  }`} 
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white rounded-full leading-tight border border-black shadow-[0_0_8px_rgba(234,97,19,0.8)]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 whitespace-nowrap ${
                isActive ? 'text-[#FFE3B3] font-bold header-subtext-glow' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
