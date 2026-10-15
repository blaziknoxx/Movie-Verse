/**
 * Movie Verse — Playback Source Selector Component
 * Developer — Estiaq Mehedi
 * 
 * Compact, responsive source switcher supporting adaptive HLS, direct MP4,
 * official embeds, and external directory fallback targets.
 */

import React from 'react';
import { PlaybackSource } from '../../types/movie';
import { Server, Play, Globe, Sparkles, Check, Film } from 'lucide-react';

interface PlaybackSourceSelectorProps {
  sources: PlaybackSource[];
  selectedSourceId: string;
  onSelectSource: (source: PlaybackSource) => void;
}

export const PlaybackSourceSelector: React.FC<PlaybackSourceSelectorProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
}) => {
  if (!sources || sources.length <= 1) return null;

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'hls':
        return <Server className="w-3.5 h-3.5 shrink-0" />;
      case 'mp4':
        return <Film className="w-3.5 h-3.5 shrink-0" />;
      case 'embed':
        return <Play className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <Globe className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#FFE3B3]">
          <Sparkles className="w-3.5 h-3.5 text-[#F88F22]" />
          <span>Playback Sources & Servers ({sources.length})</span>
        </div>
        <span className="text-[10px] text-neutral-400 hidden sm:inline">
          Select preferred server for optimal speed
        </span>
      </div>

      {/* Horizontally scrollable source pills without layout breaking */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-touch">
        {sources.map((src) => {
          const isSelected = src.id === selectedSourceId;

          return (
            <button
              key={src.id}
              type="button"
              onClick={() => onSelectSource(src)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 active:scale-95 ${
                isSelected
                  ? 'sunset-gradient-btn text-white border-[#F88F22] shadow-[0_0_16px_rgba(234,97,19,0.45)]'
                  : 'bg-[#180C05]/90 hover:bg-[#251308] text-neutral-300 hover:text-white border-[#F88F22]/20 hover:border-[#FBB931]/40'
              }`}
              title={src.note || src.name}
            >
              <span className={isSelected ? 'text-white' : 'text-[#FBB931]'}>
                {getSourceIcon(src.type)}
              </span>

              <span className="max-w-[170px] sm:max-w-[220px] truncate">
                {src.name}
              </span>

              {src.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isSelected
                      ? 'bg-black/30 text-[#FFE3B3]'
                      : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  {src.badge}
                </span>
              )}

              {isSelected && (
                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
