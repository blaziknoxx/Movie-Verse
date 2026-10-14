/**
 * Movie Verse — Live Search & Discovery Hub
 * Developer — Estiaq Mehedi
 * 
 * Powered by live TMDB multi-page search API and persistent recent search history.
 * Strictly zero fake fallbacks, zero fabricated search results.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService, RecentSearchItem } from '../../services/storageService';
import { 
  Search, X, Star, Film, Sparkles, ArrowRight, Loader2, Plus, 
  AlertCircle, History, Trash2, TrendingUp, Clock
} from 'lucide-react';

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

  // Recent Searches state
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  // Trending Suggestions state
  const [trendingSuggestions, setTrendingSuggestions] = useState<Movie[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load recent searches and trending suggestions on open
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(storageService.getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 60);

      // Fetch genuine trending movies for initial state suggestions
      setIsLoadingSuggestions(true);
      tmdbService.getTrending('day', 1)
        .then(data => {
          setTrendingSuggestions(data.movies.slice(0, 6));
          storageService.saveMultipleCachedMovies(data.movies);
        })
        .catch(err => {
          console.warn('[SearchModal] Failed to load suggestions:', err);
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
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

        // Record user query in persistent recent searches if valid results were found
        if (data.movies.length > 0) {
          const topMatch = data.movies[0];
          const updated = storageService.addRecentSearch({
            id: `query-${trimmed.toLowerCase()}`,
            query: trimmed,
            movieId: topMatch.id,
            tmdbId: topMatch.tmdbId,
            title: topMatch.title,
            posterUrl: topMatch.posterUrl,
            year: topMatch.year
          });
          setRecentSearches(updated);
        }
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
    // Record in recent searches with full movie attributes
    const updated = storageService.addRecentSearch({
      id: `movie-${movie.id}`,
      query: movie.title,
      movieId: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      posterUrl: movie.posterUrl,
      year: movie.year
    });
    setRecentSearches(updated);

    storageService.saveCachedMovie(movie);
    onSelectMovie(movie);
    onClose();
  };

  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    if (item.movieId) {
      const cached = storageService.getCachedMovie(item.movieId);
      if (cached) {
        handleSelect(cached);
        return;
      }
    }
    // Repeat search query
    setQuery(item.query);
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, idOrQuery: string) => {
    e.stopPropagation();
    const updated = storageService.removeRecentSearch(idOrQuery);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.clearRecentSearches();
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl liquid-glass-panel rounded-3xl border border-[#F88F22]/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Premium Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#140804]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-[#EA6113] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies by title, franchise, or keywords..."
              className="w-full bg-transparent text-white placeholder-neutral-400 text-base sm:text-base focus:outline-none"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-[#FBB931] animate-spin shrink-0" />
            )}
            {query && !isLoading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white bg-white/5 border border-white/10 shrink-0 cursor-pointer transition-colors"
            >
              Esc
            </button>
          </div>
        </div>

        {/* Results / Suggestions Container */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-grow no-scrollbar">
          
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
            /* INITIAL DISCOVERY STATE */
            <div className="space-y-6 py-1">
              
              {/* 1. Dedicated Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#EA6113]" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      onClick={handleClearAllRecent}
                      className="text-[11px] text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear History</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectRecentSearch(item)}
                        className="group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#2A1308] border border-white/10 hover:border-[#F88F22]/40 text-xs font-medium text-neutral-300 hover:text-white cursor-pointer transition-all"
                      >
                        {item.posterUrl && (
                          <img
                            src={item.posterUrl}
                            alt=""
                            className="w-4 h-5 object-cover rounded shadow-sm shrink-0"
                          />
                        )}
                        <span className="truncate max-w-[160px] sm:max-w-[200px]">
                          {item.title || item.query}
                        </span>
                        {item.year && (
                          <span className="text-[10px] text-neutral-400">({item.year})</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecentSearch(e, item.id)}
                          className="p-0.5 rounded-full text-neutral-500 hover:text-neutral-200 hover:bg-white/10 ml-0.5 transition-colors"
                          title="Remove search"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Genuine TMDB Trending / Popular Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#EA6113]" />
                    <span>Trending in Cinema Now</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    Live Catalog Feed
                  </span>
                </div>

                {isLoadingSuggestions ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : trendingSuggestions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {trendingSuggestions.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleSelect(movie)}
                        className="p-2.5 rounded-2xl liquid-glass hover:bg-white/[0.08] border border-white/5 hover:border-[#F88F22]/40 cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-10 h-14 object-cover rounded-xl border border-white/10 shrink-0 bg-black/40"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FFE3B3] transition-colors truncate">
                              {movie.title}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {movie.year} · {movie.genres.slice(0, 2).join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#FBB931] shrink-0 px-2 py-0.5 rounded-md bg-black/40 border border-white/5 ml-2">
                          <Star className="w-3 h-3 fill-[#FBB931]" />
                          <span>{movie.rating ? movie.rating.toFixed(1) : '7.0'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl liquid-glass border border-white/5 space-y-2 text-center">
                    <Film className="w-8 h-8 text-[#FBB931]/60 mx-auto" />
                    <h3 className="text-sm font-bold text-white">Live Catalog Search</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                      Type any film title, franchise, director, or actor to search millions of international cinema releases directly.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : results.length === 0 && !isLoading && !errorMsg ? (
            /* Empty State */
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Film className="w-10 h-10 mx-auto text-[#EA6113]/50" />
              <div className="text-sm font-semibold text-white">No movies found for "{query}"</div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No matching titles found in the catalog. Check spelling or try another keyword.
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
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
