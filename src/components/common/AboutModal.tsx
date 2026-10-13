import React from 'react';
import { X, Film, CheckCircle2, Shield, Sparkles, UserCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto liquid-glass-panel rounded-3xl p-6 sm:p-8 text-neutral-200 border border-rose-500/20 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-950 flex items-center justify-center border border-rose-500/30">
            <Film className="w-5 h-5 text-rose-100" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Movie Verse</h2>
            <p className="text-xs text-rose-400 font-medium">Developer — Estiaq Mehedi</p>
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">The 5 Core Pillars</h3>
          <ul className="space-y-2 text-xs text-neutral-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Universe Lore & Connections:</strong> Map sequels, prequels, spin-offs, and companion films with clarity.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Intelligent Watch Orders:</strong> Filter by Story Order, Chronological, or Essential-Only with Must Watch vs Optional priority.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Same Vibe Discovery:</strong> Discover films that share tone, pacing, and choreography without shared plot continuity.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Where to Watch Directory:</strong> Curated index of legal, verified platforms from free ad-supported to arthouse subscriptions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Local Personal Library:</strong> Private watchlist, completed viewing history, and universe progress saved locally on device.</span>
            </li>
          </ul>
        </div>

        {/* Credits Box */}
        <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/20 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Lead Architecture & Development</div>
            <div className="text-sm font-bold text-rose-200 mt-0.5">Developer — Estiaq Mehedi</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-900/50 flex items-center justify-center text-rose-300 border border-rose-500/30">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        {/* TMDB Attribution Box */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 mb-6 flex items-center gap-3">
          <div className="px-2 py-1 rounded bg-emerald-950/70 border border-emerald-500/30 text-xs font-bold text-emerald-400 shrink-0">
            TMDB
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Movie metadata, cast lists, and poster imagery are sourced via The Movie Database.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-neutral-400">
          <Shield className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <span>
            Movie Verse is an editorial directory and story guide. It does not stream or host copyrighted media files. All movie trademarks and imagery belong to their respective studios and creators.
          </span>
        </div>

      </div>
    </div>
  );
};
