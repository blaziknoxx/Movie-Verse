import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../../types/movie';
import { MOVIES } from '../../data/moviesData';
import { Search, X, Star, Film, Sparkles, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMovie
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const filtered = MOVIES.filter(m => 
        m.title.toLowerCase().includes(trimmed) ||
        m.director.toLowerCase().includes(trimmed) ||
        m.genres.some(g => g.toLowerCase().includes(trimmed)) ||
        (m.universeName && m.universeName.toLowerCase().includes(trimmed)) ||
        m.vibeTags.some(t => t.toLowerCase().includes(trimmed))
      );
      setResults(filtered);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl liquid-glass-panel rounded-3xl border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-rose-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by movie title, franchise, director, or vibe..."
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-neutral-400 hover:text-white"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white bg-white/5 border border-white/10 shrink-0"
          >
            Esc
          </button>
        </div>

        {/* Results / Suggestions Container */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3">
          {query.trim() === '' ? (
            /* Initial State with Quick Suggestions */
            <div className="space-y-4 py-2">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Popular Discoveries
              </div>
              <div className="space-y-2">
                {MOVIES.slice(0, 4).map(movie => (
                  <div
                    key={movie.id}
                    onClick={() => {
                      onSelectMovie(movie);
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl hover:bg-white/[0.06] cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                          {movie.title}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {movie.year} · {movie.genres.join(', ')}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-rose-400 transition-colors mr-2" />
                  </div>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Film className="w-10 h-10 mx-auto text-rose-500/50" />
              <div className="text-sm font-semibold text-white">No results found for "{query}"</div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Try searching for franchises like "Dune", "Batman", "Nolan", or moods like "Noir".
              </p>
            </div>
          ) : (
            /* Matching Results List */
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-400 mb-2">
                Found {results.length} movie{results.length !== 1 ? 's' : ''}
              </div>
              {results.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => {
                    onSelectMovie(movie);
                    onClose();
                  }}
                  className="p-3 rounded-2xl liquid-glass hover:bg-white/[0.08] border border-white/5 hover:border-rose-500/30 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                          {movie.title}
                        </span>
                        <span className="text-xs text-neutral-400">({movie.year})</span>
                      </div>
                      
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {movie.duration} · {movie.genres.join(', ')}
                      </div>

                      {movie.universeName && (
                        <div className="text-[11px] text-rose-400 font-medium mt-1">
                          {movie.universeName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 tabular-nums shrink-0 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 mr-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
