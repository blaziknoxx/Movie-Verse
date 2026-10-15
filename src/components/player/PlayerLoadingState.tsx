/**
 * Movie Verse — Player Loading State Component
 * Developer — Estiaq Mehedi
 * Cinematic skeleton and smooth ambient pulse during stream resolution and buffering.
 */

import React from 'react';
import { Film, Loader2, Sparkles } from 'lucide-react';

interface PlayerLoadingStateProps {
  title?: string;
  sourceName?: string;
}

export const PlayerLoadingState: React.FC<PlayerLoadingStateProps> = ({
  title = 'Movie Verse Stream',
  sourceName
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1A0B05] via-[#100602] to-[#080301] text-center overflow-hidden select-none">
      {/* Ambient background glow ring */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#EA6113]/25 via-[#F88F22]/15 to-transparent blur-3xl pointer-events-none animate-pulse" />

      {/* Center Cinematic Icon + Spinner */}
      <div className="relative z-10 space-y-4 max-w-sm">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
          {/* Glowing outer rotating ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-[#F88F22]/30 border-t-[#FBB931] animate-spin" />
          
          {/* Inner badge */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#241107] border border-[#F88F22]/40 flex items-center justify-center shadow-[0_0_20px_rgba(234,97,19,0.35)]">
            <Film className="w-6 h-6 sm:w-7 sm:h-7 text-[#FBB931]" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#FFE3B3] uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#F88F22]" />
            <span>Establishing Stream Connection</span>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
            {title}
          </h4>

          {sourceName && (
            <p className="text-xs text-[#FFE3B3]/75 font-medium">
              Source: <span className="text-white font-semibold">{sourceName}</span>
            </p>
          )}

          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-neutral-400">
            <Loader2 className="w-3.5 h-3.5 text-[#F88F22] animate-spin" />
            <span>Synchronizing audio & high-definition video...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
