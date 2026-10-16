/**
 * Movie Verse — Streaming Sources Selector Component
 * Developer — Estiaq Mehedi
 * 
 * Renders the dedicated "Streaming Sources" section immediately below the embedded player.
 * Matches the exact "Watch Full Movie" reference card styling:
 * - Exact background gradient (sunset-gradient-btn)
 * - Exact text styling, font weight, size, and centering
 * - Exact padding (py-3.5 px-5), rounded-2xl shape, shadow-xl, and active scale
 * - Data-driven support for future providers
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
    <div className="w-full space-y-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#FFE3B3]">
          <span className="w-2 h-2 rounded-full bg-[#EA6113] animate-pulse" />
          <span>Streaming Sources</span>
        </div>
        <span className="text-[10px] text-neutral-400">
          {providers.length === 1 ? '1 provider available' : `${providers.length} providers available`}
        </span>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {providers.map((provider) => {
          const isSelected = provider.id === selectedProviderId;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelectProvider(provider.id)}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? 'sunset-gradient-btn text-white shadow-xl'
                  : 'bg-[#1A0B05] hover:bg-[#281308] text-[#FFE3B3] hover:text-white border border-[#F88F22]/35 shadow-md'
              }`}
              aria-pressed={isSelected}
              title={isSelected ? `Reload ${provider.name} stream` : `Switch to ${provider.name}`}
            >
              <Play className="w-4 h-4 fill-white text-white shrink-0" />
              <span>{provider.name}</span>
              {isReloading && isSelected && (
                <span className="text-xs font-normal opacity-85">· Reloading...</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
