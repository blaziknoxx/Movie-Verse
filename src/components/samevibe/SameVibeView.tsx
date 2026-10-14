import React, { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import { MOVIES } from '../../data/moviesData';
import { tmdbService } from '../../services/tmdbService';
import { MovieCard } from '../discover/MovieCard';
import { Sparkles, Loader2, RefreshCw, Compass, AlertCircle, Film, ArrowRight } from 'lucide-react';

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
  const [selectedMovie, setSelectedMovie] = useState<Movie>(() => {
    if (initialSeedMovieId) {
      const found = MOVIES.find(m => m.id === initialSeedMovieId || String(m.tmdbId) === initialSeedMovieId);
      if (found) return found;
    }
    return MOVIES[0];
  });

  const [similarList, setSimilarList] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilterGenre, setActiveFilterGenre] = useState<string | null>(null);

  // Sync when initialSeedMovieId changes from outside
  useEffect(() => {
    if (initialSeedMovieId) {
      const found = MOVIES.find(m => m.id === initialSeedMovieId || String(m.tmdbId) === initialSeedMovieId);
      if (found && found.id !== selectedMovie.id) {
        setSelectedMovie(found);
      }
    }
  }, [initialSeedMovieId]);

  // Fetch genuine TMDB similar and recommended movies for the selected movie
  useEffect(() => {
    let isCancelled = false;
    const fetchSameVibes = async () => {
      setIsLoading(true);
      try {
        const numericId = String(selectedMovie.tmdbId || selectedMovie.id).replace(/\D/g, '');
        
        let tmdbResults: Movie[] = [];
        if (numericId) {
          const [sim, recs] = await Promise.all([
            tmdbService.getSimilarMovies(numericId).catch(() => []),
            tmdbService.getMovieRecommendations(numericId).catch(() => [])
          ]);
          // Merge and deduplicate, excluding the selected movie itself
          const merged = [...sim, ...recs];
          const seen = new Set<string>();
          for (const m of merged) {
            const mId = String(m.tmdbId || m.id);
            if (mId !== numericId && !seen.has(mId)) {
              seen.add(mId);
              tmdbResults.push(m);
            }
          }
        }

        // If TMDB returns empty (or unconfigured/offline), fall back to thematic matches from our rich dataset
        if (tmdbResults.length === 0) {
          tmdbResults = MOVIES.filter(m => {
            if (m.id === selectedMovie.id) return false;
            // Overlapping genres
            const sharesGenre = m.genres.some(g => selectedMovie.genres.includes(g));
            // Overlapping vibe tags
            const sharesVibe = m.vibeTags.some(t => selectedMovie.vibeTags.includes(t));
            return sharesGenre || sharesVibe;
          });
        }

        if (!isCancelled) {
          setSimilarList(tmdbResults);
        }
      } catch (err) {
        console.error('Error fetching same vibe recommendations:', err);
        if (!isCancelled) {
          // Fall back gracefully
          const fallback = MOVIES.filter(m => m.id !== selectedMovie.id && m.genres.some(g => selectedMovie.genres.includes(g)));
          setSimilarList(fallback);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSameVibes();
    return () => {
      isCancelled = true;
    };
  }, [selectedMovie]);

  // Filtered by selected genre if active
  const filteredList = activeFilterGenre
    ? similarList.filter(m => m.genres.includes(activeFilterGenre))
    : similarList;

  // Extract all unique genres from the current similar list
  const availableGenres = Array.from(new Set(similarList.flatMap(m => m.genres)));

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* Header section */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Cinematic Resonance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Same Vibe Discovery
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
          Powered by real-time TMDB thematic recommendations and similarity clustering. Pick any anchor film to discover works with comparable tone, pacing, and visual style.
        </p>
      </div>

      {/* Anchor Movie Horizontal Switcher */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Choose Seed Movie for Similar Vibes
        </label>
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-touch py-1">
          {MOVIES.map(movie => {
            const isSelected = movie.id === selectedMovie.id;
            return (
              <button
                key={movie.id}
                onClick={() => {
                  setSelectedMovie(movie);
                  setActiveFilterGenre(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border shrink-0 transition-all ${
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

      {/* Active Seed Card Showcase */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-rose-500/25 relative overflow-hidden flex flex-col sm:flex-row items-center gap-5">
        <img
          src={selectedMovie.posterUrl}
          alt={selectedMovie.title}
          className="w-20 sm:w-28 aspect-[3/4] object-cover rounded-2xl border border-white/10 shadow-2xl shrink-0"
        />
        <div className="space-y-1.5 flex-1 text-center sm:text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            Current Vibe Reference
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {selectedMovie.title} ({selectedMovie.year})
          </h2>
          <div className="text-xs text-neutral-300">
            {selectedMovie.genres.join(' · ')} · {selectedMovie.duration}
          </div>
          <p className="text-xs text-neutral-400 line-clamp-2 max-w-2xl leading-relaxed pt-1">
            {selectedMovie.overview}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
            {selectedMovie.vibeTags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-rose-950/50 border border-rose-500/30 text-[10px] text-rose-300 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Genre Filter Pills */}
      {availableGenres.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Filter Similar Movies by Genre
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilterGenre(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activeFilterGenre === null
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : 'bg-white/5 text-neutral-300 border-white/10 hover:text-white'
              }`}
            >
              All Genres ({similarList.length})
            </button>
            {availableGenres.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveFilterGenre(activeFilterGenre === genre ? null : genre)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  activeFilterGenre === genre
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Movies Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Thematically Related Movies</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/30">
              {filteredList.length}
            </span>
          </h2>
          <span className="text-xs text-neutral-400">Excludes seed movie</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="liquid-glass-card rounded-2xl overflow-hidden aspect-[3/4] animate-pulse flex flex-col justify-end p-4 border border-white/5"
              >
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 rounded-3xl liquid-glass text-center text-neutral-400 text-sm">
            No related films found for the selected genre filter. Try another genre.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredList.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelectMovie={onSelectMovie}
                isWatchlisted={watchlist.includes(movie.id)}
                onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
