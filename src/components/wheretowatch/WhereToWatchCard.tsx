import React from 'react';
import { WhereToWatchSite, Movie } from '../../types/movie';
import { evaluateProviderForMovie } from '../../services/streamingProviders';
import { 
  ExternalLink, Trash2, Globe, Flame, Sparkles, 
  Info, CheckCircle2, Search, ArrowUpRight, Compass, ShieldCheck 
} from 'lucide-react';

interface WhereToWatchCardProps {
  site: WhereToWatchSite;
  movie?: Movie | null;
  onDeleteCustomSite?: (siteId: string) => void;
}

export const WhereToWatchCard: React.FC<WhereToWatchCardProps> = ({
  site,
  movie,
  onDeleteCustomSite
}) => {
  const rec = evaluateProviderForMovie(site, movie);
  const isPick = rec.isMovieVersePick;

  return (
    <div
      className={`sunset-card-glow relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
        isPick 
          ? 'border-2 border-[#FBB931]/70 bg-gradient-to-br from-[#241108]/95 via-[#160B05]/95 to-[#0D0704] shadow-[0_0_32px_rgba(251,185,49,0.22)]' 
          : 'border border-[#F88F22]/20 bg-[#160B05]/90 hover:border-[#FBB931]/50 shadow-lg hover:shadow-[0_0_24px_rgba(248,143,34,0.25)]'
      }`}
    >
      {/* Top ambient accent highlight for Movie Verse Pick */}
      {isPick && (
        <div className="absolute top-0 left-0 right-0 h-1 sunset-gradient-bar" />
      )}

      {/* Ambient background glow inside the card */}
      <div 
        className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-opacity ${
          isPick ? 'bg-[#FBB931]/20 opacity-80' : 'bg-[#EA6113]/15 opacity-50 group-hover:opacity-80'
        }`} 
      />

      <div className="space-y-4 relative z-10">
        
        {/* Header row: Category / Region / Pick Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#FBB931]">
              <Globe className="w-3.5 h-3.5 text-[#F88F22]" />
              <span>{site.region || 'Global'}</span>
            </span>
            <span className="text-neutral-600 text-xs">·</span>
            <span className="text-[11px] text-neutral-400 font-medium">
              {site.availabilityType || site.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Dynamic Recommendation Indicator */}
            {rec.badgeStyle === 'pick' && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#EA6113]/30 via-[#F88F22]/30 to-[#FBB931]/30 border border-[#FBB931]/60 text-[#FFE3B3] text-xs font-extrabold shadow-[0_0_16px_rgba(251,185,49,0.35)] animate-pulse"
                title="Recommended for this title based on direct query parameter matching"
              >
                <Flame className="w-3.5 h-3.5 text-[#FBB931] fill-[#FBB931]" />
                <span>Movie Verse Pick</span>
              </div>
            )}

            {rec.badgeStyle === 'regional' && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EA6113]/25 border border-[#F88F22]/40 text-[#FFE3B3] text-xs font-bold"
                title="Regional specialist for this language and origin"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F88F22]" />
                <span>Regional Focus</span>
              </div>
            )}

            {rec.badgeStyle === 'neutral' && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-400 text-[11px] font-medium">
                <Search className="w-3 h-3 text-neutral-400" />
                <span>Search on Site</span>
              </div>
            )}

            {/* Custom Site Delete Button */}
            {site.isCustom && onDeleteCustomSite && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteCustomSite(site.id);
                }}
                className="text-neutral-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title="Delete local entry"
                aria-label={`Delete ${site.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title and Domain */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#FFE3B3] transition-colors tracking-tight flex items-center gap-2">
              <span>{site.name}</span>
              {isPick && (
                <ShieldCheck className="w-4 h-4 text-[#FBB931] shrink-0" />
              )}
            </h3>
          </div>
          <div className="text-xs text-[#F88F22] font-mono truncate mt-0.5 opacity-90">
            {rec.url}
          </div>
        </div>

        {/* Dynamic Movie Context Banner (when movie is active) */}
        {movie && (
          <div className={`p-3 rounded-2xl border text-xs leading-relaxed transition-all ${
            isPick 
              ? 'bg-[#2A1308]/70 border-[#FBB931]/30 text-[#FFE3B3]' 
              : 'bg-[#120703]/80 border-white/5 text-neutral-300'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1 text-white">
              {isPick ? (
                <Flame className="w-3.5 h-3.5 text-[#FBB931]" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-[#F88F22]" />
              )}
              <span>Querying: <span className="text-[#FBB931]">{movie.title}</span> {movie.year ? `(${movie.year})` : ''}</span>
            </div>
            <p className="text-[11px] text-neutral-300 pl-5">
              {rec.matchReason}
            </p>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="space-y-1.5 pt-1">
          {rec.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isPick ? 'text-[#FBB931]' : 'text-[#F88F22]'}`} />
              <span className="font-medium">{feat}</span>
            </div>
          ))}
        </div>

        {/* Description & Transparency Guidance */}
        <div className="p-3 rounded-2xl bg-[#0E0603]/90 border border-white/5 text-[11px] text-neutral-400 leading-relaxed space-y-1">
          <p className="text-neutral-300">{site.description}</p>
          <div className="pt-1 flex items-start gap-1.5 border-t border-white/5">
            <Info className="w-3.5 h-3.5 text-[#FBB931] shrink-0 mt-0.5" />
            <span className="text-[10px] text-neutral-400 leading-normal">
              <strong className="text-[#FFE3B3]">Destination Notice:</strong> {rec.destinationNote}
            </span>
          </div>
        </div>

      </div>

      {/* Visit Platform Action Button */}
      <div className="pt-5 mt-3 relative z-10">
        <a
          href={rec.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-md group-hover:shadow-[0_4px_20px_rgba(234,97,19,0.5)] active:scale-[0.98] min-h-[44px] ${
            isPick 
              ? 'sunset-gradient-btn' 
              : 'bg-white/10 hover:bg-white/15 border border-[#F88F22]/30 hover:border-[#FBB931]/60'
          }`}
          aria-label={`${rec.actionLabel} for ${site.name}`}
        >
          <span>{rec.actionLabel}</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      </div>

    </div>
  );
};
