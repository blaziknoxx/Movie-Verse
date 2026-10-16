/**
 * Movie Verse — Streaming Sources Selector Component
 * Developer — Estiaq Mehedi
 * 
 * Renders the dedicated "Streaming Sources" section immediately below the embedded player.
 * Compact and elegant streaming-platform appearance (15–25% more compact than reference),
 * preserving exact sunset palette, gradients, typography, and active feedback.
 */

import React from 'react';
import { StreamingProviderConfig } from '../../services/streamingSourceRegistry';
import { Play } from 'lucide-react';

interface StreamingSourceSelectorProps {
  providers: StreamingProviderConfig[];
  selectedProviderId: string;
  onSelectProvider: (providerId: string) => void;
  isReloading?: boolean;
}

export const StreamingSourceSelector: React.FC<StreamingSourceSelectorProps> = ({
  providers,
  selectedProviderId,
  onSelectProvider,
  isReloading = false,
}) => {
  if (!providers || providers.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#FFE3B3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113] animate-pulse" />
          <span>Streaming Sources</span>
        </div>
        <span className="text-[10px] text-neutral-400">
          {providers.length === 1 ? '1 provider available' : `${providers.length} providers`}
        </span>
      </div>

      {/* Provider Cards (Balanced, compact, no unnecessary oversized stretch) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {providers.map((provider) => {
          const isSelected = provider.id === selectedProviderId;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelectProvider(provider.id)}
              className={`w-full sm:w-auto sm:min-w-[160px] md:min-w-[180px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? 'sunset-gradient-btn text-white shadow-lg'
                  : 'bg-[#1A0B05] hover:bg-[#281308] text-[#FFE3B3] hover:text-white border border-[#F88F22]/35 shadow-sm'
              }`}
              aria-pressed={isSelected}
              title={isSelected ? `Reload ${provider.name} stream` : `Switch to ${provider.name}`}
            >
              <Play className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span>{provider.name}</span>
              {isReloading && isSelected && (
                <span className="text-[10px] font-normal opacity-85">· Reloading...</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
