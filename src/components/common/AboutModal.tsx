import React from 'react';
import { X, Film, CheckCircle2, Shield } from 'lucide-react';
import { DeveloperCard } from './DeveloperCard';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto liquid-glass-panel rounded-3xl p-6 sm:p-8 text-neutral-200 border border-[#F88F22]/20 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-white/10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl sunset-gradient-btn flex items-center justify-center text-white shadow-[0_0_15px_rgba(234,97,19,0.5)]">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Movie Verse</h2>
            <p className="text-xs text-[#F88F22] font-medium">Developer — Estiaq Mehedi</p>
          </div>
        </div>

        {/* Mission */}
        <div className="space-y-4 text-sm text-neutral-300 leading-relaxed mb-6">
          <p>
            <strong className="text-white">Movie Verse</strong> is a luxury cinematic universe navigator and discovery platform crafted to elevate how audiences explore complex storylines, franchise lore, and cinema atmospheres.
          </p>
          <p>
            Unlike conventional flat movie databases, Movie Verse connects films by narrative genealogy, viewing priority, atmospheric DNA, and legitimate viewing destinations.
          </p>
        </div>

        {/* 5 Core Pillars */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#FBB931]">The 5 Core Pillars</h3>
          <ul className="space-y-2 text-xs text-neutral-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F88F22] shrink-0 mt-0.5" />
              <span><strong>Universe Lore & Connections:</strong> Map sequels, prequels, spin-offs, and companion films with clarity.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F88F22] shrink-0 mt-0.5" />
              <span><strong>Intelligent Watch Orders:</strong> Filter by Story Order, Chronological, or Essential-Only with Must Watch vs Optional priority.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F88F22] shrink-0 mt-0.5" />
              <span><strong>Same Vibe Discovery:</strong> Discover films that share tone, pacing, and choreography without shared plot continuity.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F88F22] shrink-0 mt-0.5" />
              <span><strong>Where to Watch Directory:</strong> Curated index of legal, verified platforms from free ad-supported to arthouse subscriptions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F88F22] shrink-0 mt-0.5" />
              <span><strong>Local Personal Library:</strong> Private watchlist, completed viewing history, and universe progress saved locally on device.</span>
            </li>
          </ul>
        </div>

        {/* Developer Identity Card */}
        <div className="mb-6">
          <DeveloperCard variant="full" />
        </div>

        {/* Official Consolidated TMDB Attribution with Required Logo & Disclaimer */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#031d27]/95 via-[#0d253f]/90 to-[#01141e]/95 border border-[#01b4e4]/30 mb-6 flex flex-col sm:flex-row items-center gap-4 shadow-lg">
          {/* TMDB Official Primary Logo SVG */}
          <div className="shrink-0 flex items-center justify-center bg-[#0d253f] p-2.5 rounded-xl border border-[#01b4e4]/20">
            <svg className="w-24 h-7" viewBox="0 0 273.42 114.71" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="The Movie Database (TMDB) Official Logo">
              <path d="M112.56 37.11h-17.7v40.49h-9.87V37.11H67.29v-8.49h45.27v8.49z" fill="#01b4e4"/>
              <path d="M157.06 77.6h-9.87V44.47l-10.74 24.64h-6.88l-10.74-24.64v33.13h-9.87V28.62h12.82l11.23 25.43 11.23-25.43h12.82V77.6z" fill="#90cea1"/>
              <path d="M198.81 54.02c0 14.62-8.37 23.58-21.72 23.58h-16.71V28.62h16.71c13.35 0 21.72 8.96 21.72 25.4zm-9.87 0c0-10.63-5.3-16.91-11.85-16.91h-6.84v33.82h6.84c6.55 0 11.85-6.28 11.85-16.91z" fill="#01b4e4"/>
              <path d="M239.52 64.91c0 8.04-5.91 12.69-14.93 12.69h-17.82V28.62h17.1c8.49 0 13.91 4.5 13.91 11.39 0 5.43-3.23 9.07-7.82 10.38 5.74 1.15 9.56 5.51 9.56 14.52zm-9.87-24.47c0-4.04-2.87-6.23-7.51-6.23h-5.48v12.46h5.48c4.64 0 7.51-2.19 7.51-6.23zm1.15 24.08c0-4.47-3.15-6.93-8.08-6.93h-6.19v13.86h6.19c4.93 0 8.08-2.46 8.08-6.93z" fill="#90cea1"/>
            </svg>
          </div>
          
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs text-white font-semibold leading-relaxed">
              “This product uses the TMDB API but is not endorsed or certified by TMDB.”
            </p>
            <p className="text-[10px] text-neutral-400">
              Movie metadata, credits, release dates, and imagery sourced via The Movie Database.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-neutral-400">
          <Shield className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <span>
            Movie Verse is an editorial directory and story guide. It does not stream or host copyrighted media files. All movie trademarks and imagery belong to their respective studios and creators.
          </span>
        </div>

      </div>
    </div>
  );
};
