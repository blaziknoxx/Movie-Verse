/**
 * Movie Verse — Cast & Crew Section Component
 * Developer — Estiaq Mehedi
 * 
 * Features:
 * - Distinctive Featured Director profile(s) with larger circular portrait and prominent glow
 * - Horizontal swipeable row of compact circular cast profiles with sunset gradients and glowing depth
 * - 100% native smooth manual touch swiping (touch-action: pan-x pan-y, zero autoplay)
 * - Tappable profiles opening verified TMDB Person Detail Pages
 * - Expandable "View All Cast & Crew" modal for complete department credits
 */

import React, { useState, useEffect } from 'react';
import { CastMember, CrewMember, MovieCredits } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { Clapperboard, Users, ChevronRight, X, Sparkles, Film, Award } from 'lucide-react';

interface CastSectionProps {
  movieId: string | number;
  movieTitle: string;
  onSelectPerson: (personId: number) => void;
}

export const CastSection: React.FC<CastSectionProps> = ({
  movieId,
  movieTitle,
  onSelectPerson,
}) => {
  const [credits, setCredits] = useState<MovieCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllCreditsOpen, setIsAllCreditsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    tmdbService.getMovieCredits(movieId)
      .then((res) => {
        if (!isMounted) return;
        setCredits(res);
      })
      .catch((err) => {
        console.warn('[CastSection] Error loading credits:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="space-y-3.5 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Cast & Crew
            </span>
          </div>
        </div>
        {/* Loading skeleton */}
        <div className="flex items-center gap-3 overflow-hidden py-1">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse border border-white/10" />
            <div className="w-14 h-2.5 rounded bg-white/5 animate-pulse" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse border border-white/5" />
              <div className="w-12 h-2 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!credits || (credits.cast.length === 0 && credits.crew.length === 0)) {
    return null;
  }

  // Strictly identify all directors through job === "Director"
  const directors = credits.crew.filter((c) => c.job === 'Director');
  // Deduplicate directors by ID
  const uniqueDirectors = Array.from(new Map(directors.map((d) => [d.id, d])).values());

  // Cast members list
  const castList = credits.cast;

  // Key writers, cinematographers, composers for "All Credits" modal
  const writers = credits.crew.filter((c) => ['Screenplay', 'Writer', 'Author', 'Story'].includes(c.job));
  const uniqueWriters = Array.from(new Map(writers.map((w) => [w.id, w])).values());

  const composers = credits.crew.filter((c) => ['Original Music Composer', 'Music', 'Composer'].includes(c.job));
  const uniqueComposers = Array.from(new Map(composers.map((comp) => [comp.id, comp])).values());

  const cinematographers = credits.crew.filter((c) => ['Director of Photography', 'Cinematography'].includes(c.job));
  const uniqueCinematographers = Array.from(new Map(cinematographers.map((dop) => [dop.id, dop])).values());

  const producers = credits.crew.filter((c) => c.job === 'Producer');
  const uniqueProducers = Array.from(new Map(producers.map((p) => [p.id, p])).values()).slice(0, 4);

  return (
    <div className="space-y-4 py-2 border-t border-b border-[#F88F22]/15">
      {/* Section Header with "View All Credits" */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-[#EA6113]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFE3B3]">
            Director & Cast Ensemble
          </h3>
          <span className="text-[10px] text-neutral-400">
            ({castList.length + uniqueDirectors.length})
          </span>
        </div>

        {castList.length > 5 && (
          <button
            type="button"
            onClick={() => setIsAllCreditsOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FBB931] hover:text-[#FFE3B3] transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-white/5 active:scale-95"
          >
            <span>All Credits</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 1. Distinctive Featured Director Section (Placed distinctively above the cast) */}
      {uniqueDirectors.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#241108]/90 via-[#190C05]/80 to-[#120603]/70 border border-[#F88F22]/30 shadow-md">
          <div className="flex items-center gap-3.5">
            {uniqueDirectors.map((director) => (
              <button
                key={director.id}
                type="button"
                onClick={() => onSelectPerson(director.id)}
                className="group/director flex items-center gap-3.5 text-left transition-transform active:scale-95 cursor-pointer flex-1 min-w-0"
                title={`View ${director.name}'s profile`}
                aria-label={`Director ${director.name}`}
              >
                {/* Director Circular Portrait with prominent glowing halo */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#EA6113] via-[#F88F22] to-[#FBB931] blur-[6px] opacity-70 group-hover/director:opacity-100 transition-opacity" />
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#EA6113] via-[#F88F22] to-[#FBB931] shadow-[0_0_18px_rgba(234,97,19,0.5)]">
                    <img
                      src={director.profileUrl || tmdbService.getOptimizedProfileUrl(director.profilePath, 'w185', director.name)}
                      alt={director.name}
                      className="w-full h-full rounded-full object-cover bg-[#160A05]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Director Meta & Label */}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EA6113]/20 border border-[#EA6113]/40 text-[#FBB931] text-[9px] font-extrabold uppercase tracking-widest">
                    <Award className="w-2.5 h-2.5 text-[#FBB931]" />
                    <span>DIRECTOR</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white group-hover/director:text-[#FFE3B3] transition-colors truncate">
                    {director.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                    <span>Visionary filmmaker</span>
                    <span className="text-[#F88F22]">· View filmography &rarr;</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Horizontal Scrolling Row of Compact Circular Cast Profiles */}
      {castList.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
            Cast Ensemble
          </div>

          <div className="relative w-full group/cast">
            {/* Subtle Edge Glow Masks */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-[#0A0402] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-[#0A0402] to-transparent z-10" />

            {/* Native Touch & Pointer Swiping Row */}
            <div
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-touch py-1.5 px-1 select-none"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                touchAction: 'pan-x pan-y',
                scrollBehavior: 'auto',
              }}
            >
              {castList.slice(0, 16).map((actor) => (
                <button
                  key={`${actor.id}-${actor.character}`}
                  type="button"
                  onClick={() => onSelectPerson(actor.id)}
                  className="group/actor flex flex-col items-center text-center shrink-0 w-[74px] sm:w-[84px] cursor-pointer transition-transform duration-200 active:scale-95"
                  title={`${actor.name} as ${actor.character}`}
                  aria-label={`${actor.name} as ${actor.character}`}
                >
                  {/* Circular Avatar Container with Sunset Glow */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2">
                    {/* Small cinematic orange/yellow glow behind circle */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#EA6113] to-[#FBB931] blur-[4px] opacity-40 group-hover/actor:opacity-85 transition-opacity" />
                    
                    {/* Sunset theme gradient border */}
                    <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-[#EA6113]/80 via-[#F88F22]/70 to-[#FBB931] shadow-md group-hover/actor:shadow-[0_0_16px_rgba(234,97,19,0.5)] transition-all">
                      <img
                        src={actor.profileUrl || tmdbService.getOptimizedProfileUrl(actor.profilePath, 'w185', actor.name)}
                        alt={actor.name}
                        className="w-full h-full rounded-full object-cover bg-[#1A0B05]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>

                  {/* Actor Real Name */}
                  <span className="text-[11px] sm:text-xs font-bold text-white group-hover/actor:text-[#FFE3B3] transition-colors leading-tight line-clamp-1 w-full">
                    {actor.name}
                  </span>

                  {/* Character Name */}
                  <span className="text-[10px] text-neutral-400 group-hover/actor:text-neutral-300 transition-colors leading-tight line-clamp-1 w-full mt-0.5">
                    {actor.character || 'Actor'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. "View All Cast & Crew" Modal */}
      {isAllCreditsOpen && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[85vh] bg-[#120603] border border-[#F88F22]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#F88F22]/20 flex items-center justify-between bg-[#1A0B05]/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#F88F22]" />
                  <h3 className="text-base font-extrabold text-white">Full Cast & Crew</h3>
                </div>
                <p className="text-xs text-neutral-400 truncate max-w-sm">
                  {movieTitle} — Official TMDB Credits
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAllCreditsOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
                aria-label="Close credits modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Directing & Writing Department */}
              {(uniqueDirectors.length > 0 || uniqueWriters.length > 0) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#EA6113]" />
                    <span>Directing & Writing</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {uniqueDirectors.map((dir) => (
                      <button
                        key={`modal-dir-${dir.id}`}
                        type="button"
                        onClick={() => {
                          setIsAllCreditsOpen(false);
                          onSelectPerson(dir.id);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1D0D06] hover:bg-[#2A1409] border border-[#F88F22]/25 text-left transition-all active:scale-98"
                      >
                        <img
                          src={dir.profileUrl || tmdbService.getOptimizedProfileUrl(dir.profilePath, 'w185', dir.name)}
                          alt={dir.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#F88F22]/40"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-[#EA6113] block">Director</span>
                          <span className="text-xs font-bold text-white truncate block">{dir.name}</span>
                        </div>
                      </button>
                    ))}

                    {uniqueWriters.map((writer) => (
                      <button
                        key={`modal-writer-${writer.id}-${writer.job}`}
                        type="button"
                        onClick={() => {
                          setIsAllCreditsOpen(false);
                          onSelectPerson(writer.id);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1D0D06] hover:bg-[#2A1409] border border-[#F88F22]/25 text-left transition-all active:scale-98"
                      >
                        <img
                          src={writer.profileUrl || tmdbService.getOptimizedProfileUrl(writer.profilePath, 'w185', writer.name)}
                          alt={writer.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-medium text-neutral-400 block">{writer.job}</span>
                          <span className="text-xs font-bold text-white truncate block">{writer.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Department Leads: Music & Cinematography */}
              {(uniqueComposers.length > 0 || uniqueCinematographers.length > 0 || uniqueProducers.length > 0) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F88F22]" />
                    <span>Creative & Technical Leads</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {uniqueComposers.map((comp) => (
                      <button
                        key={`modal-comp-${comp.id}`}
                        type="button"
                        onClick={() => {
                          setIsAllCreditsOpen(false);
                          onSelectPerson(comp.id);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1D0D06] hover:bg-[#2A1409] border border-white/10 text-left transition-all active:scale-98"
                      >
                        <img
                          src={comp.profileUrl || tmdbService.getOptimizedProfileUrl(comp.profilePath, 'w185', comp.name)}
                          alt={comp.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#F88F22] block">Original Score</span>
                          <span className="text-xs font-bold text-white truncate block">{comp.name}</span>
                        </div>
                      </button>
                    ))}

                    {uniqueCinematographers.map((dop) => (
                      <button
                        key={`modal-dop-${dop.id}`}
                        type="button"
                        onClick={() => {
                          setIsAllCreditsOpen(false);
                          onSelectPerson(dop.id);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1D0D06] hover:bg-[#2A1409] border border-white/10 text-left transition-all active:scale-98"
                      >
                        <img
                          src={dop.profileUrl || tmdbService.getOptimizedProfileUrl(dop.profilePath, 'w185', dop.name)}
                          alt={dop.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#F88F22] block">Cinematography</span>
                          <span className="text-xs font-bold text-white truncate block">{dop.name}</span>
                        </div>
                      </button>
                    ))}

                    {uniqueProducers.map((prod) => (
                      <button
                        key={`modal-prod-${prod.id}`}
                        type="button"
                        onClick={() => {
                          setIsAllCreditsOpen(false);
                          onSelectPerson(prod.id);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1D0D06] hover:bg-[#2A1409] border border-white/10 text-left transition-all active:scale-98"
                      >
                        <img
                          src={prod.profileUrl || tmdbService.getOptimizedProfileUrl(prod.profilePath, 'w185', prod.name)}
                          alt={prod.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] text-neutral-400 block">Producer</span>
                          <span className="text-xs font-bold text-white truncate block">{prod.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Cast Roster */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#EA6113]" />
                  <span>Full Cast List ({castList.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {castList.map((actor) => (
                    <button
                      key={`modal-actor-${actor.id}-${actor.character}`}
                      type="button"
                      onClick={() => {
                        setIsAllCreditsOpen(false);
                        onSelectPerson(actor.id);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1D0D06] hover:bg-[#2A1409] border border-white/10 text-left transition-all active:scale-98"
                    >
                      <img
                        src={actor.profileUrl || tmdbService.getOptimizedProfileUrl(actor.profilePath, 'w185', actor.name)}
                        alt={actor.name}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#F88F22]/30"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white truncate block">{actor.name}</span>
                        <span className="text-[11px] text-neutral-400 truncate block">{actor.character || 'Actor'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
