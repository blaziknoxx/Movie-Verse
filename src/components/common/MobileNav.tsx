import React from 'react';
import { Home, Network, ListOrdered, Sparkles, Tv, Bookmark } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  watchlistCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  watchlistCount
}) => {
  const navItems = [
    { id: 'home', label: 'Discover', icon: Home },
    { id: 'connections', label: 'Connections', icon: Network },
    { id: 'watch-order', label: 'Watch Order', icon: ListOrdered },
    { id: 'same-vibe', label: 'Same Vibe', icon: Sparkles },
    { id: 'where-to-watch', label: 'Where Watch', icon: Tv },
    { id: 'library', label: 'Library', icon: Bookmark, badge: watchlistCount },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 liquid-glass border-t border-rose-950/40 pb-safe">
      <div className="grid grid-cols-6 items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${
                isActive ? 'text-rose-400' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-rose-600 text-white rounded-full leading-tight">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 whitespace-nowrap ${isActive ? 'font-semibold text-rose-200' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
