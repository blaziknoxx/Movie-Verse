import React, { useState, useEffect } from 'react';
import { Movie, MoodCategory } from '../../types/movie';
import { UNIVERSES, WHERE_TO_WATCH_DIRECTORY, MOVIES, MOODS } from '../../data/moviesData';
import { tmdbService } from '../../services/tmdbService';
import { HeroBanner } from './HeroBanner';
import { MovieCard } from '../discover/MovieCard';
import { 
  ChevronRight, Network, ListOrdered, Sparkles, Tv, 
  ExternalLink, ArrowRight, History, Flame, Film, 
  RefreshCw, AlertCircle, TrendingUp, Clock, Award, Bookmark, Play
} from 'lucide-react';

interface HomeViewProps {
  onSelectMovie: (movie: Movie) => void;
  onExploreConnections: (movieOrUniverse?: any) => void;
  onExploreWatchOrder: (universeId?: string) => void;
  onExploreSameVibe: (movieId?: string) => void;
  onExploreVibeMatch: (movieId?: string) => void;
  onExploreWhereToWatch: () => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  recentMovieIds: string[];
  selectedMoodId: string | null;
  onSelectMood: (moodId: string | null) => void;
  onOpenTrailer: (movie: Movie) => void;
  onOpenSearch: () => void;
}

type CategoryTab = 'all' | 'movies' | 'trending' | 'popular' | 'top_rated' | 'upcoming';

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMovie,
  onExploreConnections,
  onExploreWatchOrder,
  onExploreSameVibe,
  onExploreVibeMatch,
  onExploreWhereToWatch,
  watchlist,
  onToggleWatchlist,
  recentMovieIds,
  selectedMoodId,
  onSelectMood,
  onOpenTrailer,
  onOpenSearch
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data feeds from TMDB (with graceful fallback to curated library)
  useEffect(() => {
    let isMounted = true;
    const fetchFeeds = async () => {
      setIsLoading(true);
      try {
        const [trendRes, popRes, topRes, upRes] = await Promise.all([
          tmdbService.getTrending('week', 1).catch(() => ({ movies: [] })),
          tmdbService.getPopular(1).catch(() => ({ movies: [] })),
          tmdbService.getTopRated(1).catch(() => ({ movies: [] })),
          tmdbService.getUpcoming(1).catch(() => ({ movies: [] }))
        ]);

        if (!isMounted) return;

        // If TMDB returned results, use them; otherwise populate from offline MOVIES
        setTrendingMovies(trendRes.movies.length > 0 ? trendRes.movies : MOVIES.slice(0, 8));
        setPopularMovies(popRes.movies.length > 0 ? popRes.movies : [...MOVIES].reverse().slice(0, 8));
        setTopRatedMovies(topRes.movies.length > 0 ? topRes.movies : [...MOVIES].sort((a, b) => b.rating - a.rating).slice(0, 8));
        setUpcomingMovies(upRes.movies.length > 0 ? upRes.movies : MOVIES.slice(4, 12));
      } catch (err) {
        console.warn('Using offline curated feeds:', err);
        if (isMounted) {
          setTrendingMovies(MOVIES.slice(0, 8));
          setPopularMovies([...MOVIES].reverse().slice(0, 8));
          setTopRatedMovies([...MOVIES].sort((a, b) => b.rating - a.rating).slice(0, 8));
          setUpcomingMovies(MOVIES.slice(4, 12));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFeeds();
    return () => {
      isMounted = false;
    };
  }, []);

  // Continue watching / recently viewed movies
  const continueWatchingMovies = recentMovieIds
    .map(id => MOVIES.find(m => m.id === id) || trendingMovies.find(m => m.id === id))
    .filter(Boolean) as Movie[];

  // If user has watchlist movies, gather them for "My List"
  const watchlistMovies = watchlist
    .map(id => MOVIES.find(m => m.id === id) || trendingMovies.find(m => m.id === id))
    .filter(Boolean) as Movie[];

  const heroCandidates = trendingMovies.length > 0 ? trendingMovies : MOVIES;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* 1. Featured Movie Carousel matching Reference 1 */}
      <HeroBanner
        movies={heroCandidates}
        onSelectMovie={onSelectMovie}
        isWatchlisted={(id) => watchlist.includes(id)}
        onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
        onOpenTrailer={onOpenTrailer}
      />

      {/* 2. Category Navigation Tabs matching Reference 1: "All  Movies  Drama  TV Show  Webseries" */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-touch py-1 px-1 -mx-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'movies', label: 'Movies' },
          { id: 'trending', label: 'Trending' },
          { id: 'popular', label: 'Popular' },
          { id: 'top_rated', label: 'Top Rated' },
          { id: 'upcoming', label: 'Upcoming' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CategoryTab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-[0_2px_12px_rgba(229,9,20,0.5)]'
                : 'bg-white/[0.05] hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="h-4 w-px bg-white/10 shrink-0 mx-1" />

        <button
          onClick={() => onExploreVibeMatch()}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3 h-3 text-rose-400" />
          <span>Vibe Match</span>
        </button>

        <button
          onClick={() => onExploreConnections()}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 flex items-center gap-1.5 shrink-0"
        >
          <Network className="w-3 h-3 text-rose-400" />
          <span>Connected</span>
        </button>

        <button
          onClick={onExploreWhereToWatch}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 flex items-center gap-1.5 shrink-0"
        >
          <Tv className="w-3.5 h-3.5 text-rose-400" />
          <span>Where to Watch</span>
        </button>
      </div>

      {/* 3. Continue Watching / History Section matching Reference 1 (Only if history exists) */}
      {continueWatchingMovies.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-red-500" />
              <span>Continue Watching</span>
            </h2>
            <span className="text-xs text-neutral-400 font-semibold cursor-pointer hover:text-white">
              View All
            </span>
          </div>

          {/* Horizontal landscape cards matching Reference 1 */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
            {continueWatchingMovies.slice(0, 5).map((movie, idx) => (
              <div
                key={movie.id}
                onClick={() => onSelectMovie(movie)}
                className="w-[200px] sm:w-[240px] shrink-0 cursor-pointer group"
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 group-hover:border-red-500/50 bg-[#160610] shadow-md">
                  <img
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Center Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Red Progress Bar matching Reference 1 */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div 
                      className="h-full bg-red-600" 
                      style={{ width: `${(idx * 27 + 42) % 85 + 15}%` }} 
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white group-hover:text-red-300 truncate">
                    {movie.title}
                  </h3>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {movie.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Top Trending Section matching Reference 1 */}
      {(activeTab === 'all' || activeTab === 'trending' || activeTab === 'movies') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <span>Top Trending</span>
            </h2>
            <button
              onClick={() => setActiveTab('trending')}
              className="text-xs font-semibold text-neutral-400 hover:text-white"
            >
              View All
            </button>
          </div>

          {/* Horizontal Poster Row: 3 visible + partial next-card peek matching Reference 1 */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
            {trendingMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="w-[110px] sm:w-[135px] md:w-[155px] shrink-0"
              >
                <MovieCard
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  isWatchlisted={watchlist.includes(movie.id)}
                  onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Vibe Match Mood Pills matching Bottom Reference */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span>Categories & Atmospheric Vibes</span>
          </h2>
          <button
            onClick={() => onExploreVibeMatch()}
            className="text-xs font-semibold text-neutral-400 hover:text-white"
          >
            See all
          </button>
        </div>

        {/* Category Pills matching Reference */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-touch py-1">
          {MOODS.map(mood => {
            const isSelected = selectedMoodId === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => {
                  onSelectMood(isSelected ? null : mood.id);
                  onExploreVibeMatch();
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-500 shadow-[0_2px_14px_rgba(229,9,20,0.4)]'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/5 text-neutral-300 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.accent }} />
                <span>{mood.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Popular on Movie Verse matching Reference 1 */}
      {(activeTab === 'all' || activeTab === 'popular' || activeTab === 'movies') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              <span>Popular on Movie Verse</span>
            </h2>
            <button
              onClick={() => setActiveTab('popular')}
              className="text-xs font-semibold text-neutral-400 hover:text-white"
            >
              View All
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
            {popularMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="w-[110px] sm:w-[135px] md:w-[155px] shrink-0"
              >
                <MovieCard
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  isWatchlisted={watchlist.includes(movie.id)}
                  onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. My List / Saved Strip (If user has watchlisted items) */}
      {watchlistMovies.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-red-500 fill-red-500" />
              <span>My List</span>
            </h2>
            <span className="text-xs text-neutral-400 font-semibold">
              {watchlistMovies.length} saved
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
            {watchlistMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="w-[110px] sm:w-[135px] md:w-[155px] shrink-0"
              >
                <MovieCard
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  isWatchlisted={true}
                  onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Connected Universes Showcase (Dedicated Movie Verse Feature) */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-red-500" />
              <span>Connected Universes & Franchises</span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Untangle sequels, prequels, and overarching franchise mythology
            </p>
          </div>
          <button
            onClick={() => onExploreConnections()}
            className="text-xs font-semibold text-red-400 hover:text-red-300 shrink-0"
          >
            All Lore
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UNIVERSES.slice(0, 3).map((universe) => (
            <div
              key={universe.id}
              onClick={() => onExploreConnections(universe as any)}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-red-500/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  {universe.genres.join(' · ')}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {universe.movieCount} Films
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-red-200 transition-colors">
                {universe.name}
              </h3>
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {universe.tagline}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Top Rated Epics */}
      {(activeTab === 'all' || activeTab === 'top_rated') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Rated Masterpieces</span>
            </h2>
            <button
              onClick={() => setActiveTab('top_rated')}
              className="text-xs font-semibold text-neutral-400 hover:text-white"
            >
              View All
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
            {topRatedMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="w-[110px] sm:w-[135px] md:w-[155px] shrink-0"
              >
                <MovieCard
                  movie={movie}
                  onSelectMovie={onSelectMovie}
                  isWatchlisted={watchlist.includes(movie.id)}
                  onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. Where to Watch Streaming Directory Banner */}
      <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/40 to-black/80 border border-red-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider">
            <Tv className="w-3.5 h-3.5" />
            <span>Streaming Availability Hub</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Where to Watch Official Directory
          </h3>
          <p className="text-xs text-neutral-400 max-w-lg leading-relaxed">
            Direct viewing paths across Apple TV, Amazon Prime, Netflix, Disney+, Max, and JustWatch verified guides.
          </p>
        </div>

        <button
          onClick={onExploreWhereToWatch}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 shadow-lg shadow-red-950/60 transition-all self-start sm:self-center active:scale-95"
        >
          <span>Open Directory</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

    </div>
  );
};
