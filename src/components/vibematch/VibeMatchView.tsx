import React, { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import { MOVIES } from '../../data/moviesData';
import { MovieCard } from '../discover/MovieCard';
import { Sparkles, SlidersHorizontal, ArrowRight, Eye, Flame, Compass, Check, Layers } from 'lucide-react';

interface VibeMatchViewProps {
  onSelectMovie: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  initialSeedMovieId?: string;
}

export const VibeMatchView: React.FC<VibeMatchViewProps> = ({
  onSelectMovie,
  watchlist,
  onToggleWatchlist,
  initialSeedMovieId
}) => {
  const [seedMovieId, setSeedMovieId] = useState<string>(initialSeedMovieId || 'the-batman');
  const [selectedVibeTag, setSelectedVibeTag] = useState<string | null>(null);

  useEffect(() => {
    if (initialSeedMovieId) {
      setSeedMovieId(initialSeedMovieId);
    }
  }, [initialSeedMovieId]);

  const seedMovie = MOVIES.find(m => m.id === seedMovieId) || MOVIES[0];

  // All unique vibe tags
  const allVibeTags = Array.from(new Set(MOVIES.flatMap(m => m.vibeTags)));

  // Calculate similarity based on vibe dimensions and overlapping tags
  const matchedMovies = MOVIES.filter(m => m.id !== seedMovie.id).map(m => {
    let score = 0;
    // Check dark atmosphere delta
    const darkDelta = Math.abs(m.vibeProfile.darkAtmosphere - seedMovie.vibeProfile.darkAtmosphere);
    if (darkDelta <= 2) score += 3;
    // Check action intensity delta
    const actionDelta = Math.abs(m.vibeProfile.actionIntensity - seedMovie.vibeProfile.actionIntensity);
    if (actionDelta <= 2) score += 3;
    // Check psychological complexity delta
    const psychDelta = Math.abs(m.vibeProfile.psychologicalComplexity - seedMovie.vibeProfile.psychologicalComplexity);
    if (psychDelta <= 2) score += 3;
    // Shared tag bonus
    const sharedTags = m.vibeTags.filter(t => seedMovie.vibeTags.includes(t));
    score += sharedTags.length * 2;

    // Filter tag if active
    if (selectedVibeTag && !m.vibeTags.includes(selectedVibeTag)) {
      score = -100;
    }

    return {
      movie: m,
      score,
      sharedVibeCount: sharedTags.length,
      sharedTags
    };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* Header section */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Atmospheric Vibration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Vibe Match Engine
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
          Find movies sharing identical tone, pacing, visual grammar, and emotional weight, independent of franchise continuity or studio bounds.
        </p>
      </div>

      {/* Seed Movie Selector */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Anchor Movie (Match Seed)
        </label>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-touch py-1">
          {MOVIES.map((movie) => {
            const isSelected = movie.id === seedMovie.id;
            return (
              <button
                key={movie.id}
                onClick={() => {
                  setSeedMovieId(movie.id);
                  setSelectedVibeTag(null);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium border shrink-0 transition-all ${
                  isSelected
                    ? 'bg-rose-950/80 border-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5 text-neutral-300'
                }`}
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-5 h-7 object-cover rounded shadow"
                />
                <span className="whitespace-nowrap">{movie.title}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Anchor Profile Card */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-7 border border-rose-500/25 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          <div className="flex items-center gap-4">
            <img
              src={seedMovie.posterUrl}
              alt={seedMovie.title}
              className="w-20 sm:w-24 aspect-[3/4] object-cover rounded-2xl border border-white/10 shadow-2xl shrink-0"
            />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Target Frequency
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {seedMovie.title}
              </h2>
              <div className="text-xs text-neutral-400">
                {seedMovie.year} · {seedMovie.genres.join(', ')}
              </div>
              <div className="text-[11px] text-rose-300/90 font-medium pt-1">
                {seedMovie.vibeTags.join(' · ')}
              </div>
            </div>
          </div>

          {/* Vibe Dimensions */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Dark Atmosphere</div>
              <div className="text-lg font-bold text-white tabular-nums mt-0.5">{seedMovie.vibeProfile.darkAtmosphere}/10</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Action Intensity</div>
              <div className="text-lg font-bold text-white tabular-nums mt-0.5">{seedMovie.vibeProfile.actionIntensity}/10</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Psychology</div>
              <div className="text-lg font-bold text-white tabular-nums mt-0.5">{seedMovie.vibeProfile.psychologicalComplexity}/10</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Pacing</div>
              <div className="text-xs font-bold text-rose-400 mt-1">{seedMovie.vibeProfile.pacing}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Filter by Specific Vibe Tag */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Refine By Key Vibe Dimension
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedVibeTag(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              selectedVibeTag === null
                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                : 'bg-white/5 text-neutral-300 border-white/10 hover:text-white'
            }`}
          >
            All Dimensions
          </button>
          {allVibeTags.map(tag => {
            const isSeedTag = seedMovie.vibeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => setSelectedVibeTag(selectedVibeTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  selectedVibeTag === tag
                    ? 'bg-rose-600 text-white border-rose-500'
                    : isSeedTag
                    ? 'bg-rose-950/40 text-rose-200 border-rose-500/30 hover:border-rose-400'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                }`}
              >
                <span>{tag}</span>
                {isSeedTag && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Matching Films With Similar Vibe</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/30">
              {matchedMovies.length}
            </span>
          </h2>
          <span className="text-xs text-neutral-400">Ranked by Atmospheric Cohesion</span>
        </div>

        {matchedMovies.length === 0 ? (
          <div className="p-12 rounded-3xl liquid-glass text-center text-neutral-400 text-sm">
            No films matched all active vibe filters. Try clearing the tag filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {matchedMovies.map(({ movie, score, sharedTags }) => (
              <div key={movie.id} className="relative flex flex-col">
                <MovieCard
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  isWatchlisted={watchlist.includes(movie.id)}
                  onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                />
                <div className="mt-1.5 px-2 py-1 rounded-lg bg-black/60 border border-rose-500/20 text-[10px] text-rose-300 font-semibold flex items-center justify-between">
                  <span>Match Score</span>
                  <span className="tabular-nums font-bold text-white">{score} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
