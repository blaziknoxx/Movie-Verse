import React from 'react';
import { Film, ShieldCheck, Heart, Info, ExternalLink } from 'lucide-react';
import { DeveloperCard } from './DeveloperCard';

interface FooterProps {
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  return (
    <footer className="w-full mt-24 border-t border-rose-950/40 bg-[#090206]/90 backdrop-blur-xl pb-24 md:pb-12 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand & Developer Credit */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-500/30 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-rose-300" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">Movie Verse</span>
            </div>
            
            <p className="text-neutral-400 text-sm max-w-md leading-relaxed">
              A cinematic movie discovery and universe exploration platform. Navigating narrative continuity, watch orders, similar vibes, and verified streaming availability.
            </p>

            <div className="pt-2 max-w-sm">
              <DeveloperCard variant="compact" />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Exploration</h4>
            <ul className="space-y-2">
              <li><button onClick={onOpenAbout} className="hover:text-rose-300 transition-colors">About Movie Verse</button></li>
              <li><span className="text-neutral-400">Storyline Connections</span></li>
              <li><span className="text-neutral-400">Chronological & Release Guides</span></li>
              <li><span className="text-neutral-400">Same Vibe Discovery</span></li>
              <li><span className="text-neutral-400">Where to Watch Directory</span></li>
            </ul>
          </div>

          {/* Legal & Attribution */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Transparency & Attribution</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Movie Verse is a discovery guide and index. We do not host, store, or stream media.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
              <span>Independent & Curated Content</span>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div>
            © {new Date().getFullYear()} Movie Verse. All cinematic rights belong to their respective creators and studios.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onOpenAbout} className="hover:text-white transition-colors underline-offset-4 hover:underline">
              Credits & Info
            </button>
            <span>·</span>
            <span className="text-neutral-300 font-medium">Developer — Estiaq Mehedi</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
