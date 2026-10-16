/**
 * Movie Verse — Unified Cinematic Footer System
 * Developer — Estiaq Mehedi
 * 
 * Provides:
 * 1. Home Page: Premium full footer with brand mission, verified developer signature (EM monogram),
 *    working exploration navigation links, transparency notice, and bottom copyright bar.
 * 2. All Other Pages: Small, minimal, low-profile copyright footer ("© 2026 Movie Verse · Developer — Estiaq Mehedi").
 */

import React from 'react';
import { Film, ShieldCheck, Check } from 'lucide-react';

interface FooterProps {
  onOpenAbout: () => void;
  onNavigate?: (tab: string) => void;
  isHome?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAbout,
  onNavigate,
  isHome = false,
}) => {
  // -------------------------------------------------------------
  // ALL OTHER PAGES — MINIMAL FOOTER ONLY
  // -------------------------------------------------------------
  if (!isHome) {
    return (
      <footer className="w-full mt-8 sm:mt-12 border-t border-[#F88F22]/15 bg-[#0A0402]/90 backdrop-blur-md py-4 pb-24 sm:pb-8 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 flex-wrap">
          <span>© 2026 Movie Verse</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400 hover:text-[#FFE3B3] transition-colors">
            Developer — Estiaq Mehedi
          </span>
        </div>
      </footer>
    );
  }

  // -------------------------------------------------------------
  // HOME PAGE — PREMIUM FULL FOOTER
  // -------------------------------------------------------------
  return (
    <footer className="w-full mt-16 sm:mt-24 border-t border-[#F88F22]/20 bg-[#0A0402]/95 backdrop-blur-2xl text-neutral-400 text-xs pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 mb-10 sm:mb-12">
          
          {/* Brand & Developer Identity (Col Span 5) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl sunset-gradient-btn flex items-center justify-center shadow-[0_0_14px_rgba(234,97,19,0.4)]">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">Movie Verse</span>
            </div>
            
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-md">
              A cinematic movie discovery and universe exploration platform. Navigating narrative continuity, watch orders, similar vibes, and verified streaming availability.
            </p>

            {/* Developer Identity — EM Monogram & Verified Signature */}
            <div className="pt-1.5">
              <div className="inline-flex items-center gap-3.5 p-3 rounded-2xl bg-[#140804]/90 border border-[#F88F22]/25 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                {/* EM Monogram */}
                <div className="w-10 h-10 rounded-xl sunset-gradient-btn flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-[0_2px_12px_rgba(234,97,19,0.45)]">
                  <span>EM</span>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                      ESTIAQ MEHEDI
                    </span>
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-950 border border-emerald-400/70 text-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.4)] shrink-0"
                      title="Verified Developer"
                      aria-label="Verified Developer"
                    >
                      <Check className="w-2 h-2 stroke-[3]" />
                    </span>
                  </div>

                  <div className="text-[10px] font-bold text-[#FBB931] uppercase tracking-widest">
                    DEVELOPER OF MOVIE VERSE
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EXPLORATION (Col Span 4) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFE3B3]">Exploration</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="text-neutral-400 hover:text-[#FFE3B3] transition-colors text-left flex items-center gap-2 cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113] group-hover:scale-125 transition-transform shrink-0" />
                  <span>About Movie Verse</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('connections')}
                  className="text-neutral-400 hover:text-[#FFE3B3] transition-colors text-left flex items-center gap-2 cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113] group-hover:scale-125 transition-transform shrink-0" />
                  <span>Storyline Connections</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('watch-order')}
                  className="text-neutral-400 hover:text-[#FFE3B3] transition-colors text-left flex items-center gap-2 cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113] group-hover:scale-125 transition-transform shrink-0" />
                  <span>Chronological & Release Guides</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('same-vibe')}
                  className="text-neutral-400 hover:text-[#FFE3B3] transition-colors text-left flex items-center gap-2 cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113] group-hover:scale-125 transition-transform shrink-0" />
                  <span>Same Vibe Discovery</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('where-to-watch')}
                  className="text-neutral-400 hover:text-[#FFE3B3] transition-colors text-left flex items-center gap-2 cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113] group-hover:scale-125 transition-transform shrink-0" />
                  <span>Where to Watch Directory</span>
                </button>
              </li>
            </ul>
          </div>

          {/* TRANSPARENCY & ATTRIBUTION (Col Span 3) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFE3B3]">Transparency & Attribution</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Movie Verse is a discovery guide and index. We do not host, store, or stream media.
            </p>
            <div className="pt-1.5 flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Independent & Curated Content</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright bar */}
        <div className="pt-6 border-t border-[#F88F22]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-400 text-center sm:text-left">
          <div>
            © 2026 Movie Verse. All cinematic rights belong to their respective creators and studios.
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              type="button"
              onClick={onOpenAbout}
              className="hover:text-white transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              Credits & Info
            </button>
            <span>·</span>
            <span className="text-[#FFE3B3] font-semibold">Developer — Estiaq Mehedi</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
