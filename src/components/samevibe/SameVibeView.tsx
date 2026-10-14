/**
 * Movie Verse — Same Vibe Discovery
 * Developer — Estiaq Mehedi
 * 
 * Powered by live TMDB thematic recommendations and similarity clustering.
 * Strictly zero fake fallbacks, zero mock movies.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Movie } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { MovieCard } from '../discover/MovieCard';
import { Sparkles, Loader2, RefreshCw, Compass, AlertCircle, Film, Search, Star } from 'lucide-react';

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
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [seedCandidates, setSeedCandidates] = useState<Movie[]>([]);
  const [similarList, setSimilarList] = useState<Movie[]>([]);
  const [isLoadingSeeds, setIsLoadingSeeds] = useState(true);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeFilterGenre, setActiveFilterGenre] = useState<string | null>(null);

  // Quick anchor search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Initialize anchor movie from initialSeedMovieId or live trending
  useEffect(() => {
    let isCancelled = false;
    const initSeed = async () => {
      setIsLoadingSeeds(true);
      setApiError(null);

      try {
        let initialSeed: Movie | null = null;
        if (initialSeedMovieId) {
          const cached = storageService.getCachedMovie(initialSeedMovieId);
          if (cached) {
            initialSeed = cached;
          } else {
            const cleanId = String(initialSeedMovieId).replace(/\D/g, '');
            if (cleanId) {
              initialSeed = await tmdbService.getMovieDetails(cleanId).catch(() => null);
            }
          }
        }

        const trending = await tmdbService.getTrending('week', 1);
        if (isCancelled) return;

        const liveMovies = trending.movies;
        setSeedCandidates(liveMovies);

        if (initialSeed) {
          setSelectedMovie(initialSeed);
          storageService.saveCachedMovie(initialSeed);
        } else if (liveMovies.length > 0) {
          setSelectedMovie(liveMovies[0]);
          storageService.saveCachedMovie(liveMovies[0]);
        } else {
          setSelectedMovie(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[SameVibe] Failed to initialize seed movies:', err);
          setApiError(err.message || 'Unable to connect to TMDB API. Please verify network or API token configuration.');
          setSelectedMovie(null);
          setSeedCandidates([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSeeds(false);
        }
      }
    };

    initSeed();
    return () => {
      isCancelled = true;
    };
  }, [initialSeedMovieId]);

  // 2. Fetch genuine TMDB similar and recommended movies for the selected movie
  useEffect(() => {
    if (!selectedMovie) {
      setSimilarList([]);
      return;
    }

    let isCancelled = false;
    const fetchSameVibes = async () => {
      setIsLoadingSimilar(true);
      setApiError(null);

      try {
        const numericId = String(selectedMovie.tmdbId || selectedMovie.id).replace(/\D/g, '');
        if (!numericId) {
          throw new Error('Selected movie does not have a valid TMDB ID.');
        }

        const [sim, recs] = await Promise.all([
          tmdbService.getSimilarMovies(numericId).catch(() => []),
          tmdbService.getMovieRecommendations(numericId).catch(() => [])
        ]);

        if (isCancelled) return;

        // Merge, deduplicate, and exclude the seed movie itself
        const mergedMap = new Map<string, Movie>();
        for (const m of [...sim, ...recs]) {
          const mId = String(m.tmdbId || m.id);
          if (mId !== numericId && !mergedMap.has(mId)) {
            mergedMap.set(mId, m);
          }
        }

        const results = Array.from(mergedMap.values());
        // Cache for smooth navigation
        storageService.saveMultipleCachedMovies(results);

        setSimilarList(results);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[SameVibe] Error fetching same vibe recommendations:', err);
          setApiError(err.message || 'Failed to fetch recommendations from TMDB.');
          setSimilarList([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSimilar(false);
        }
      }
    };

    fetchSameVibes();
    return () => {
      isCancelled = true;
    };
  }, [selectedMovie]);

  // Search for custom anchor movie
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await tmdbService.searchMovies(trimmed, 1);
        setSearchResults(data.movies.slice(0, 6));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectAnchor = (movie: Movie) => {
    setSelectedMovie(movie);
    setActiveFilterGenre(null);
    setSearchQuery('');
    setSearchResults([]);
    storageService.saveCachedMovie(movie);
  };

  // Filtered by selected genre if active
  const filteredList = activeFilterGenre
    ? similarList.filter(m => (m.genres || []).includes(activeFilterGenre))
    : similarList;

  // Extract all unique genres from the current similar list
  const availableGenres = Array.from(new Set(similarList.flatMap(m => m.genres || [])));

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* Header section matching reference sunset style */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#EA6113]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FBB931]">
            Cinematic Resonance
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Same Vibe Discovery
        </h1>
        <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
          Powered by real-time TMDB thematic recommendations and similarity clustering. Pick any anchor film to discover works with comparable tone, pacing, and visual style.
        </p>
      </div>

      {/* Anchor Movie Switcher & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Choose Seed Movie for Similar Vibes
          </label>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search movie to match vibe..."
              className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-[#140A05] border border-[#F88F22]/20 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#F88F22]"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#FBB931] animate-spin" />
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <div className="p-2 rounded-2xl liquid-glass border border-[#F88F22]/30 space-y-1 max-h-60 overflow-y-auto shadow-2xl">
            <div className="text-[10px] font-bold text-[#FBB931] uppercase px-2 py-1">
              Select TMDB Search Result to Anchor
            </div>
            {searchResults.map(movie => (
              <button
                key={movie.id}
                onClick={() => handleSelectAnchor(movie)}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 flex items-center gap-3 transition-colors group"
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-8 h-11 object-cover rounded shadow shrink-0"
                />
                <div className="truncate">
                  <div className="text-xs font-bold text-white group-hover:text-[#FFE3B3] truncate">
                    {movie.title}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {movie.year} · {movie.genres.join(', ')} · ★ {movie.rating.toFixed(1)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Live Seeds Switcher */}
        {seedCandidates.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-touch py-1">
            {seedCandidates.map(movie => {
              const isSelected = selectedMovie?.id === movie.id;
              return (
                <button
                  key={movie.id}
                  onClick={() => handleSelectAnchor(movie)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#2A1308] border-[#F88F22] text-white shadow-[0_0_15px_rgba(234,97,19,0.35)]'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5 text-neutral-300'
                  }`}
                >
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-5 h-7 object-cover rounded shadow shrink-0"
                  />
                  <span className="whitespace-nowrap max-w-[130px] truncate">{movie.title}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading Seed State */}
      {isLoadingSeeds && (
        <div className="p-12 rounded-3xl liquid-glass border border-white/5 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FBB931] animate-spin" />
          <div className="text-xs text-neutral-400">Loading movie anchors from TMDB...</div>
        </div>
      )}

      {/* API Error State */}
      {apiError && !isLoadingSeeds && (
        <div className="p-6 rounded-3xl bg-[#1E0B05] border border-red-500/30 text-neutral-200 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>TMDB API Feed Unavailable</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {apiError}
          </p>
          <div className="text-[11px] text-neutral-400 bg-black/40 p-3 rounded-xl border border-white/5">
            <strong>Genuine Data Discipline:</strong> Movie Verse does not substitute mock movies when TMDB requests fail. Please ensure your TMDB API token is configured in your server environment.
          </div>
        </div>
      )}

      {/* Active Seed Card Showcase */}
      {selectedMovie && (
        <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-[#F88F22]/30 relative overflow-hidden flex flex-col sm:flex-row items-center gap-5">
          <img
            src={selectedMovie.posterUrl}
            alt={selectedMovie.title}
            className="w-20 sm:w-28 aspect-[3/4] object-cover rounded-2xl border border-white/10 shadow-2xl shrink-0"
          />
          <div className="space-y-1.5 flex-1 text-center sm:text-left min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#FBB931]">
              Current Vibe Reference Anchor
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
              {selectedMovie.title} ({selectedMovie.year})
            </h2>
            <div className="text-xs text-neutral-300">
              {selectedMovie.genres.join(' · ')} · {selectedMovie.duration}
            </div>
            <p className="text-xs text-neutral-400 line-clamp-2 max-w-2xl leading-relaxed pt-1">
              {selectedMovie.overview}
            </p>
            {selectedMovie.vibeTags && selectedMovie.vibeTags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                {selectedMovie.vibeTags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-[#241108] border border-[#F88F22]/30 text-[10px] text-[#FFE3B3] font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Genre Filter Pills */}
      {availableGenres.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Filter Similar Movies by Genre
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilterGenre(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activeFilterGenre === null
                  ? 'bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white border-[#F88F22] shadow-md'
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
                    ? 'bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white border-[#F88F22]'
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
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EA6113]/30 text-[#FFE3B3] border border-[#F88F22]/30">
              {filteredList.length}
            </span>
          </h2>
          <span className="text-xs text-neutral-400">Excludes seed movie</span>
        </div>

        {isLoadingSimilar ? (
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
          <div className="p-12 rounded-3xl liquid-glass text-center text-neutral-400 text-sm border border-white/5 space-y-2">
            <Compass className="w-8 h-8 text-[#FBB931]/60 mx-auto" />
            <div className="font-semibold text-white">No Thematically Related Movies Found</div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              No genuine similar films found for the selected genre filter. Try another genre or select another anchor movie.
            </p>
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
