/**
 * Movie Verse — Streaming Sources Selector Component
 * Developer — Estiaq Mehedi
 * 
 * Renders the dedicated "Streaming Sources" section immediately below the embedded player.
 * Driven by the data configuration from streamingSourceRegistry so future providers
 * are automatically rendered and selectable.
 */

import React from 'react';
import { StreamingProviderConfig } from '../../services/streamingSourceRegistry';
import { Check, Radio, Play } from 'lucide-react';

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
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-[#FFE3B3]">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Streaming Sources</span>
        </div>
        <span className="text-[10px] text-emerald-300/80 font-medium">
          {providers.length === 1 ? '1 active embed provider' : `${providers.length} embed providers`}
        </span>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {providers.map((provider) => {
          const isSelected = provider.id === selectedProviderId;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelectProvider(provider.id)}
              className={`w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 text-left cursor-pointer transition-all ${
                isSelected ? 'green-card-active' : 'green-card-surface'
              }`}
              aria-pressed={isSelected}
              title={isSelected ? `Reload ${provider.name} stream` : `Switch to ${provider.name}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Provider Icon Container */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                    isSelected
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <Play className={`w-4 h-4 sm:w-5 sm:h-5 fill-current ${isSelected ? 'translate-x-0.5' : ''}`} />
                </div>

                {/* Provider Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                      {provider.name}
                    </span>

                    {/* Green Verification-Style Badge with Subtle Continuous Glow Animation */}
                    {provider.isVerified && (
                      <span
                        className="green-verified-badge w-4 h-4 p-0.5"
                        title="Verified Stream Provider"
                        aria-label="Verified provider"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-200" />
                      </span>
                    )}

                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        {isReloading ? 'Reloading...' : 'Active'}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-emerald-200/80 truncate">
                    {isSelected
                      ? 'Embedded Cinema Player Active'
                      : 'Click to stream from this player'}
                  </div>
                </div>
              </div>

              {/* Quality & Selected Status Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                {provider.quality && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/35 text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                    {provider.quality}
                  </span>
                )}

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-emerald-400 border-emerald-200 text-black shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                      : 'border-emerald-500/40 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
