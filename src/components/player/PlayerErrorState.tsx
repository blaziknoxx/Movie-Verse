/**
 * Movie Verse — Player Error & Fallback State Component
 * Developer — Estiaq Mehedi
 * 
 * Elegant fallback state with Retry and Open Original Website actions.
 * Safely handles un-embeddable portals, network dropouts, and provider DRM restrictions.
 */

import React from 'react';
import { AlertCircle, ExternalLink, RefreshCw, ShieldAlert, Globe } from 'lucide-react';

interface PlayerErrorStateProps {
  title?: string;
  errorMessage?: string;
  onRetry?: () => void;
  externalUrl?: string;
  providerName?: string;
  isWebpageFallback?: boolean;
}

export const PlayerErrorState: React.FC<PlayerErrorStateProps> = ({
  title = 'Movie Verse Player',
  errorMessage,
  onRetry,
  externalUrl,
  providerName = 'External Stream Provider',
  isWebpageFallback = false,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-[#200D06]/98 via-[#140703]/98 to-[#090301]/98 text-center overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute w-80 h-80 rounded-full bg-[#EA6113]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-4 px-2">
        {/* State Icon Badge */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2E1408] to-[#180A04] border border-[#F88F22]/40 shadow-[0_0_24px_rgba(234,97,19,0.3)] flex items-center justify-center mx-auto text-[#FBB931]">
          {isWebpageFallback ? (
            <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-[#FBB931]" />
          ) : (
            <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#EA6113]" />
          )}
        </div>

        {/* Heading & Reason Description */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            {isWebpageFallback
              ? 'External Portal — In-Page Playback Restricted'
              : 'Stream Temporarily Unavailable'}
          </h3>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {isWebpageFallback ? (
              <>
                <strong className="text-[#FFE3B3]">{providerName}</strong> requires direct browser navigation to protect account session security, search cookies, and provider terms.
              </>
            ) : errorMessage ? (
              errorMessage
            ) : (
              <>
                Unable to establish an uninterrupted stream connection for <strong className="text-white">{title}</strong>. You may retry this connection, switch to another playback server above, or browse the external source.
              </>
            )}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-all active:scale-95 min-h-[40px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FBB931]" />
              <span>Retry Connection</span>
            </button>
          )}

          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-bold shadow-lg hover:shadow-[0_4px_16px_rgba(234,97,19,0.5)] transition-all active:scale-95 min-h-[40px]"
            >
              <span>Open Original Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Security & Integrity Note */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
          <ShieldAlert className="w-3 h-3 text-[#F88F22]" />
          <span>Movie Verse validates HTTPS origins & respects provider copyright guidelines</span>
        </div>
      </div>
    </div>
  );
};
