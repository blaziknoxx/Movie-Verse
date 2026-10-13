import React, { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import { MOVIES } from '../../data/moviesData';
import { MovieCard } from '../discover/MovieCard';
import { Sparkles, SlidersHorizontal, ArrowRight, Eye, Flame, Compass } from 'lucide-react';

interface SameVibeViewProps {
  onSelectMovie: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  initialSeedMovieId?: string;
}

export const SameVibeView: React.FC<SameVibeViewProps> = ({
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
    <div className="space-y-10 animate-fade-in">
      
      {/* Header section */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-rose-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Atmospheric Vibration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Same Vibe, Different Story
        </h1>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          Movies that share an identical aesthetic heartbeat, tension level, or visceral soundscape—completely independent of franchise lore or plot continuity.
        </p>
      </div>

      {/* Seed Film Selector Bar */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Choose Seed Movie to Match Vibration</label>
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {MOVIES.map(movie => {
            const isSelected = movie.id === seedMovie.id;
            return (
              <button
                key={movie.id}
                onClick={() => {
                  setSeedMovieId(movie.id);
                  setSelectedVibeTag(null);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl whitespace-nowrap text-xs font-semibold border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-rose-950/80 border-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-5 h-7 object-cover rounded"
                />
                <span>{movie.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seed Movie Profile Card */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-rose-500/25 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={seedMovie.posterUrl}
              alt={seedMovie.title}
              className="w-16 sm:w-20 aspect-[3/4] object-cover rounded-xl border border-white/10 shrink-0"
            />
            <div>
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                Active Benchmark Film
              </div>
              <h2 className="text-2xl font-bold text-white">
                {seedMovie.title} ({seedMovie.year})
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300 font-medium mt-1">
                <span>{seedMovie.vibeProfile.visualStyle}</span>
                <span className="text-neutral-600">·</span>
                <span>Pacing: {seedMovie.vibeProfile.pacing}</span>
              </div>
              <div className="mt-2 text-xs text-rose-200">
                {seedMovie.vibeTags.join(' · ')}
              </div>
            </div>
          </div>

          {/* Radar / Vibe Spectrum Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/40 p-4 rounded-2xl border border-white/5 shrink-0">
            <div className="text-center">
              <div className="text-[10px] text-neutral-400 uppercase">Dark Tone</div>
              <div className="text-sm font-bold text-white tabular-nums mt-0.5">{seedMovie.vibeProfile.darkAtmosphere}/10</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-neutral-400 uppercase">Action Intensity</div>
              <div className="text-sm font-bold text-white tabular-nums mt-0.5">{seedMovie.vibeProfile.actionIntensity}/10</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-neutral-400 uppercase">Psychological</div>
              <div className="text-sm font-bold text-white tabular-nums mt-0.5">{seedMovie.vibeProfile.psychologicalComplexity}/10</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-neutral-400 uppercase">Suspense</div>
              <div className="text-sm font-bold text-white tabular-nums mt-0.5">{seedMovie.vibeProfile.mysterySuspense}/10</div>
            </div>
          </div>

        </div>
      </div>

      {/* Filter by Specific Vibe Tag */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Refine By Key Vibe Dimension</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedVibeTag(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              selectedVibeTag === null
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            All Compatible Matches
          </button>
          {seedMovie.vibeTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedVibeTag(selectedVibeTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                selectedVibeTag === tag
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Matched Movies Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">
            Matching Films With Similar Vibe ({matchedMovies.length})
          </h3>
          <span className="text-xs text-neutral-400">Ranked by aesthetic congruence</span>
        </div>

        {matchedMovies.length === 0 ? (
          <div className="p-12 rounded-3xl liquid-glass text-center text-neutral-400 text-sm">
            No companion films found with the specific selected vibe filters. Try selecting a different mood dimension.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {matchedMovies.map(({ movie }) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelectMovie={onSelectMovie}
                isWatchlisted={watchlist.includes(movie.id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
