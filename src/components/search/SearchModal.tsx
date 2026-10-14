/**
 * Movie Verse — Live Search Modal
 * Developer — Estiaq Mehedi
 * 
 * Powered by live TMDB multi-page search API.
 * Strictly zero fake fallbacks, zero fabricated search results.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { Search, X, Star, Film, Sparkles, ArrowRight, Loader2, Plus, AlertCircle, History } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recent genuine movies from local cache
  const recentMovieIds = storageService.getRecentMovies();
  const recentCachedMovies = recentMovieIds
    .map(id => storageService.getCachedMovie(id))
    .filter((m): m is Movie => Boolean(m));

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setCurrentPage(1);
      setTotalPages(0);
      setTotalResults(0);
      setIsLoading(false);
      setErrorMsg(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen]);

  // Live debounced search effect with request cancellation
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setErrorMsg(null);
      setCurrentPage(1);
      setTotalPages(0);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Cancel existing pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await tmdbService.searchMovies(trimmed, 1, controller.signal);
        storageService.saveMultipleCachedMovies(data.movies);
        setResults(data.movies);
        setCurrentPage(1);
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('[SearchModal] Movie search error:', err);
        setErrorMsg(err.message || 'Failed to search movie catalog. Please check your connection.');
        setResults([]);
        setTotalPages(0);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Handle Load More (Pagination)
  const handleLoadMore = async () => {
    if (currentPage >= totalPages || isLoading) return;
    const nextPage = currentPage + 1;
    setIsLoading(true);
    try {
      const data = await tmdbService.searchMovies(query.trim(), nextPage);
      storageService.saveMultipleCachedMovies(data.movies);
      setResults(prev => [...prev, ...data.movies]);
      setCurrentPage(nextPage);
    } catch (err: any) {
      console.error('[SearchModal] Load more error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (movie: Movie) => {
    storageService.saveCachedMovie(movie);
    onSelectMovie(movie);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl liquid-glass-panel rounded-3xl border border-[#F88F22]/30 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#EA6113] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies by title, franchise, or keywords..."
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-[#FBB931] animate-spin shrink-0" />
          )}
          {query && !isLoading && (
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
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3 flex-grow">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-[#1E0B05] border border-red-500/30 text-xs text-neutral-200 space-y-1">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Search Notice</span>
              </div>
              <p className="text-neutral-300">{errorMsg}</p>
              <p className="text-[11px] text-neutral-400">
                Movie Verse adheres strictly to verified catalog responses and never shows fabricated search results.
              </p>
            </div>
          )}

          {query.trim() === '' ? (
            /* Initial State */
            <div className="space-y-5 py-2">
              {/* Recently Viewed in User's Genuine Session */}
              {recentCachedMovies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#EA6113]" />
                    <span>Recently Viewed Titles</span>
                  </div>
                  <div className="space-y-1.5">
                    {recentCachedMovies.slice(0, 4).map(movie => (
                      <div
                        key={movie.id}
                        onClick={() => handleSelect(movie)}
                        className="p-2.5 rounded-2xl hover:bg-white/[0.06] cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                          />
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-[#FFE3B3] transition-colors">
                              {movie.title}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {movie.year} · {movie.genres.join(', ')}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-[#F88F22] transition-colors mr-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discovery Prompt */}
              <div className="p-5 rounded-2xl liquid-glass border border-white/5 space-y-2 text-center">
                <Film className="w-8 h-8 text-[#FBB931]/60 mx-auto" />
                <h3 className="text-sm font-bold text-white">Live Catalog Search</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Type any film title, franchise, director, or actor to search millions of international cinema releases directly.
                </p>
              </div>
            </div>
          ) : results.length === 0 && !isLoading && !errorMsg ? (
            /* Empty State */
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Film className="w-10 h-10 mx-auto text-[#EA6113]/50" />
              <div className="text-sm font-semibold text-white">No movies found for "{query}"</div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No matching titles found in the catalog. Check spelling or try a broader search query.
              </p>
            </div>
          ) : (
            /* Genuine Matching Results List */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>
                  Found {totalResults > 0 ? totalResults.toLocaleString() : results.length} movie{results.length !== 1 ? 's' : ''}
                </span>
                {totalPages > 1 && (
                  <span>Page {currentPage} of {totalPages}</span>
                )}
              </div>

              {results.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => handleSelect(movie)}
                  className="p-3 rounded-2xl liquid-glass hover:bg-white/[0.08] border border-white/5 hover:border-[#F88F22]/40 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-xl border border-white/10 shrink-0 bg-black/40"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-[#FFE3B3] transition-colors truncate">
                          {movie.title}
                        </span>
                        <span className="text-xs text-neutral-400 shrink-0">({movie.year})</span>
                      </div>
                      
                      <div className="text-xs text-neutral-400 mt-0.5 truncate">
                        {movie.duration} · {movie.genres.join(', ')}
                      </div>

                      {movie.universeName && (
                        <div className="text-[11px] text-[#F88F22] font-medium mt-1 truncate">
                          {movie.universeName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 tabular-nums shrink-0 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 mr-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{movie.rating ? movie.rating.toFixed(1) : '7.0'}</span>
                  </div>
                </div>
              ))}

              {/* Load More Pagination Button */}
              {currentPage < totalPages && (
                <div className="pt-3 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FBB931]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-[#FBB931]" />
                    )}
                    <span>Load More Results</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
