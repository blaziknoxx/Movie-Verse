/**
 * Movie Verse — Personal Movie Library
 * Developer — Estiaq Mehedi
 * 
 * Privately stores genuine user selections on-device.
 * Zero demo movies.
 */

import React, { useState } from 'react';
import { Movie } from '../../types/movie';
import { storageService } from '../../services/storageService';
import { MovieCard } from '../discover/MovieCard';
import { Bookmark, CheckCircle2, History, Trash2, Film, ArrowRight } from 'lucide-react';

interface LibraryViewProps {
  watchlist: string[];
  watched: string[];
  recentMovieIds: string[];
  onSelectMovie: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  onToggleWatched: (movieId: string) => void;
  onGoToDiscover: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  watchlist,
  watched,
  recentMovieIds,
  onSelectMovie,
  onToggleWatchlist,
  onToggleWatched,
  onGoToDiscover
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched' | 'recent'>('watchlist');

  // Look up genuine movie objects from local device cache
  const watchlistedMovies = watchlist
    .map(id => storageService.getCachedMovie(id))
    .filter((m): m is Movie => Boolean(m));

  const watchedMovies = watched
    .map(id => storageService.getCachedMovie(id))
    .filter((m): m is Movie => Boolean(m));

  const recentMovies = recentMovieIds
    .map(id => storageService.getCachedMovie(id))
    .filter((m): m is Movie => Boolean(m));

  return (
    <div className="space-y-10 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-5 h-5 text-[#EA6113]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FBB931]">
              Personal Vault
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Movie Library
          </h1>
          <p className="text-sm text-neutral-300 mt-2">
            Privately stored on your device. Track films to experience, completed viewings, and recently browsed titles.
          </p>
        </div>

        {/* Quick summary metric cards */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl liquid-glass border border-white/10 text-center min-w-[100px]">
            <div className="text-[10px] text-neutral-400 uppercase font-semibold">Watchlist</div>
            <div className="text-lg font-bold text-white tabular-nums">{watchlist.length}</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl liquid-glass border border-white/10 text-center min-w-[100px]">
            <div className="text-[10px] text-neutral-400 uppercase font-semibold">Watched</div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">{watched.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 max-w-md">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'watchlist'
              ? 'sunset-gradient-btn text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Watchlist ({watchlistedMovies.length})
        </button>

        <button
          onClick={() => setActiveTab('watched')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'watched'
              ? 'sunset-gradient-btn text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Watched ({watchedMovies.length})
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'recent'
              ? 'sunset-gradient-btn text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Recent ({recentMovies.length})
        </button>
      </div>

      {/* Content for Watchlist */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlistedMovies.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl liquid-glass text-center border border-white/5 max-w-lg mx-auto">
              <Film className="w-12 h-12 text-[#EA6113]/60 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Your Watchlist is Empty</h3>
              <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                Explore movies and tap the bookmark icon on any film card to curate your upcoming viewing list.
              </p>
              <button
                onClick={onGoToDiscover}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-semibold transition-all"
              >
                <span>Discover Movies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlistedMovies.map(movie => (
                <div key={movie.id} className="relative group">
                  <MovieCard
                    movie={movie}
                    onSelectMovie={onSelectMovie}
                    isWatchlisted={true}
                    onToggleWatchlist={onToggleWatchlist}
                  />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <button
                      onClick={() => onToggleWatched(movie.id)}
                      className="text-[11px] text-neutral-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{watched.includes(movie.id) ? 'Watched' : 'Mark Watched'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content for Watched */}
      {activeTab === 'watched' && (
        <div>
          {watchedMovies.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl liquid-glass text-center border border-white/5 max-w-lg mx-auto">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Movies Marked as Watched Yet</h3>
              <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                Mark movies as watched from detail sheets or the Watch Order guides to keep an aesthetic chronicle of your viewing journey.
              </p>
              <button
                onClick={onGoToDiscover}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-semibold transition-all"
              >
                <span>Explore Movies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchedMovies.map(movie => (
                <div key={movie.id} className="relative">
                  <MovieCard
                    movie={movie}
                    onSelectMovie={onSelectMovie}
                    isWatchlisted={watchlist.includes(movie.id)}
                    onToggleWatchlist={onToggleWatchlist}
                  />
                  <div className="mt-2 flex items-center justify-between px-1 text-[11px]">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Watched
                    </span>
                    <button
                      onClick={() => onToggleWatched(movie.id)}
                      className="text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content for Recent */}
      {activeTab === 'recent' && (
        <div>
          {recentMovies.length === 0 ? (
            <div className="p-12 rounded-3xl liquid-glass text-center text-neutral-400 text-sm">
              No recently viewed films.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recentMovies.map(movie => (
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
      )}

    </div>
  );
};
