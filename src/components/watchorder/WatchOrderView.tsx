import React, { useState } from 'react';
import { WatchOrderGuide, WatchPriority, Movie } from '../../types/movie';
import { WATCH_ORDERS, MOVIES, UNIVERSES } from '../../data/moviesData';
import { storageService } from '../../services/storageService';
import { ListOrdered, CheckCircle, Circle, AlertCircle, Sparkles, Trophy } from 'lucide-react';

interface WatchOrderViewProps {
  onSelectMovie: (movie: Movie) => void;
}

export const WatchOrderView: React.FC<WatchOrderViewProps> = ({ onSelectMovie }) => {
  const [selectedGuideId, setSelectedGuideId] = useState<string>(WATCH_ORDERS[0].id);
  
  const activeGuide = WATCH_ORDERS.find(g => g.id === selectedGuideId) || WATCH_ORDERS[0];
  
  // Progress tracker from storage
  const [completedMovieIds, setCompletedMovieIds] = useState<string[]>(() => 
    storageService.getWatchOrderProgress(activeGuide.id)
  );

  const handleToggleWatched = (movieId: string) => {
    const updated = storageService.toggleWatchOrderProgress(activeGuide.id, movieId);
    setCompletedMovieIds(updated);
  };

  const getMovie = (id: string) => MOVIES.find(m => m.id === id);

  const totalEntries = activeGuide.entries.length;
  const completedCount = activeGuide.entries.filter(e => completedMovieIds.includes(e.movieId)).length;
  const progressPercent = totalEntries > 0 ? Math.round((completedCount / totalEntries) * 100) : 0;

  const getPriorityBadge = (priority: WatchPriority) => {
    switch (priority) {
      case 'MUST WATCH':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-600/90 text-white border border-rose-400/40">
            MUST WATCH
          </span>
        );
      case 'OPTIONAL':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            OPTIONAL
          </span>
        );
      case 'SKIP FOR THIS STORY':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
            SKIP FOR THIS STORY
          </span>
        );
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header section */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <ListOrdered className="w-5 h-5 text-rose-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Viewing Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Watch Order Sequences
        </h1>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          Curated viewing paths separating story importance from film ratings. Choose between Recommended Story Order, In-Universe Chronology, or Essential-Only arcs.
        </p>
      </div>

      {/* Guide Selector Tabs */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Available Franchise Guides</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WATCH_ORDERS.map((guide) => {
            const isSelected = selectedGuideId === guide.id;
            return (
              <button
                key={guide.id}
                onClick={() => {
                  setSelectedGuideId(guide.id);
                  setCompletedMovieIds(storageService.getWatchOrderProgress(guide.id));
                }}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-rose-950/70 border-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-neutral-300'
                }`}
              >
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                  {guide.orderTypeLabel}
                </div>
                <div className="text-sm font-semibold text-white line-clamp-1">{guide.title}</div>
                <div className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{guide.universeName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Guide Info & Interactive Progress Bar */}
      <div className="liquid-glass rounded-3xl p-6 border border-rose-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              {activeGuide.orderTypeLabel}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {activeGuide.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1">
              {activeGuide.description}
            </p>
          </div>

          {/* Progress Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 shrink-0 text-center min-w-[160px]">
            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 font-medium mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Your Progress</span>
            </div>
            <div className="text-2xl font-extrabold text-white tabular-nums">
              {completedCount} <span className="text-sm text-neutral-400 font-normal">/ {totalEntries}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-rose-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Legend Notice */}
      <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
        <span className="font-semibold text-neutral-200">Priority Definition:</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span><strong className="text-neutral-300">MUST WATCH:</strong> Integral to core narrative</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span><strong className="text-neutral-300">OPTIONAL:</strong> Enriches lore & depth</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neutral-600" />
          <span><strong className="text-neutral-300">SKIP FOR THIS STORY:</strong> Divergent tangent (not a quality judgment)</span>
        </div>
      </div>

      {/* Ordered List of Entries */}
      <div className="space-y-4">
        {activeGuide.entries.map((entry) => {
          const movie = getMovie(entry.movieId);
          if (!movie) return null;
          const isCompleted = completedMovieIds.includes(movie.id);

          return (
            <div
              key={entry.movieId}
              className={`liquid-glass-card rounded-2xl p-4 sm:p-5 border transition-all ${
                isCompleted
                  ? 'border-emerald-500/25 bg-emerald-950/10'
                  : 'border-white/10 hover:border-rose-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Left: Number + Poster + Title info */}
                <div className="flex items-center gap-4 flex-1">
                  
                  {/* Sequence Number Indicator */}
                  <div className="w-8 h-8 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-sm font-extrabold text-white shrink-0 tabular-nums">
                    {entry.orderNumber}
                  </div>

                  {/* Thumbnail Poster */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    onClick={() => onSelectMovie(movie)}
                    className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  />

                  {/* Text Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectMovie(movie)}
                        className="text-base font-bold text-white hover:text-rose-300 transition-colors text-left"
                      >
                        {movie.title}
                      </button>
                      <span className="text-xs text-neutral-400 font-medium">({movie.year})</span>
                    </div>

                    <div className="text-xs text-rose-300 font-medium">
                      {entry.role}
                    </div>
                  </div>
                </div>

                {/* Right: Priority tag & Mark Watched Button */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {getPriorityBadge(entry.priority)}

                  <button
                    onClick={() => handleToggleWatched(movie.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Watched</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5" />
                        <span>Mark Watched</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Rationale description banner */}
              <div className="mt-3.5 pt-3 border-t border-white/[0.06] text-xs text-neutral-300 leading-relaxed">
                <span className="text-neutral-400 font-semibold mr-1.5">Why Watch Here:</span>
                {entry.reason}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
