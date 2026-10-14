/**
 * Movie Verse — Premium Verified Developer Identity Card
 * Developer — Estiaq Mehedi
 * 
 * Elegant cinematic card with restrained Sunset ambient glow,
 * refined border illumination, and a tasteful green verified checkmark.
 */

import React from 'react';
import { Check, Sparkles, Film } from 'lucide-react';

interface DeveloperCardProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({
  className = '',
  variant = 'full'
}) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
        variant === 'compact' ? 'p-4' : 'p-5 sm:p-6'
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(26, 12, 6, 0.94) 0%, rgba(16, 7, 3, 0.96) 60%, rgba(10, 4, 2, 0.98) 100%)',
        border: '1px solid rgba(248, 143, 34, 0.28)',
        boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.7), 0 0 20px -2px rgba(234, 97, 19, 0.16), inset 0 1px 0 rgba(255, 227, 179, 0.08)'
      }}
    >
      {/* Subtle ambient warm glow in card background */}
      <div 
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none transition-opacity duration-300 opacity-40 group-hover:opacity-75"
        style={{
          background: 'radial-gradient(circle, rgba(234, 97, 19, 0.25) 0%, rgba(248, 143, 34, 0.12) 50%, transparent 70%)',
          filter: 'blur(24px)'
        }}
      />
      <div 
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-300 opacity-30 group-hover:opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(251, 185, 49, 0.2) 0%, rgba(234, 97, 19, 0.08) 50%, transparent 70%)',
          filter: 'blur(20px)'
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          
          {/* Developer Emblem / Monogram */}
          <div 
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-extrabold text-white text-sm sm:text-base shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #EA6113 0%, #F88F22 60%, #FBB931 100%)',
              boxShadow: '0 4px 16px -2px rgba(234, 97, 19, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
            }}
          >
            <span>EM</span>
          </div>

          {/* Identity & Verified Title */}
          <div className="space-y-0.5 min-w-0">
            {/* Name with tasteful green verified checkmark */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">
                ESTIAQ MEHEDI
              </span>
              
              {/* Circular verified-style checkmark with subtle green accent glow */}
              <span
                className="inline-flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: '#052e16',
                  border: '1px solid rgba(74, 222, 128, 0.65)',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.45), inset 0 0 4px rgba(74, 222, 128, 0.2)'
                }}
                title="Verified Developer"
                aria-label="Verified Developer"
              >
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#4ade80]" strokeWidth={3} />
              </span>
            </div>

            {/* Role Title */}
            <div 
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest truncate"
              style={{ color: '#FBB931' }}
            >
              DEVELOPER OF MOVIE VERSE
            </div>

            {/* Supporting Tagline */}
            {variant === 'full' && (
              <p className="text-[11px] sm:text-xs text-[#FFE3B3]/80 italic pt-0.5 leading-snug truncate">
                “Designed with a passion for cinema.”
              </p>
            )}
          </div>

        </div>

        {/* Subtle Decorative Star Icon on Desktop */}
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 text-[#F88F22] shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-3.5 h-3.5 text-[#FBB931]" />
        </div>
      </div>

      {/* Refined glowing bottom accent line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #EA6113 25%, #F88F22 50%, #FBB931 75%, transparent 100%)'
        }}
      />
    </div>
  );
};
