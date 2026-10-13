import React, { useState, useEffect } from 'react';
import { Movie } from '../../types/movie';
import { UNIVERSES, WHERE_TO_WATCH_DIRECTORY, MOVIES } from '../../data/moviesData';
import { tmdbService } from '../../services/tmdbService';
import { HeroBanner } from './HeroBanner';
import { MoodBrowser } from './MoodBrowser';
import { MovieCard } from '../discover/MovieCard';
import { 
  ChevronRight, Network, ListOrdered, Sparkles, Tv, 
  ExternalLink, ArrowRight, History, Flame, Film, 
  RefreshCw, AlertCircle, TrendingUp, Clock, Award
} from 'lucide-react';

interface HomeViewProps {
  onSelectMovie: (movie: Movie) => void;
  onExploreConnections: (movieOrUniverse?: any) => void;
  onExploreWatchOrder: (universeId?: string) => void;
  onExploreSameVibe: (movieId?: string) => void;
  onExploreWhereToWatch: () => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  recentMovieIds: string[];
  selectedMoodId: string | null;
  onSelectMood: (moodId: string | null) => void;
}

type DiscoveryFeedType = 'trending' | 'popular' | 'now_playing' | 'top_rated' | 'upcoming';

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMovie,
  onExploreConnections,
  onExploreWatchOrder,
  onExploreSameVibe,
  onExploreWhereToWatch,
  watchlist,
  onToggleWatchlist,
  recentMovieIds,
  selectedMoodId,
  onSelectMood
}) => {
  const [activeFeed, setActiveFeed] = useState<DiscoveryFeedType>('trending');
  const [feedMovies, setFeedMovies] = useState<Movie[]>([]);
  const [heroMovie, setHeroMovie] = useState<Movie>(MOVIES[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch real TMDB data based on active feed or mood selection
  const fetchFeedData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (selectedMoodId) {
        const moodData = await tmdbService.discoverByMood(selectedMoodId);
        setFeedMovies(moodData);
        if (moodData.length > 0 && !heroMovie) {
          setHeroMovie(moodData[0]);
        }
      } else {
        let result: { movies: Movie[]; totalPages: number };
        switch (activeFeed) {
          case 'popular':
            result = await tmdbService.getPopular(1);
            break;
          case 'now_playing':
            result = await tmdbService.getNowPlaying(1);
            break;
          case 'top_rated':
            result = await tmdbService.getTopRated(1);
            break;
          case 'upcoming':
            result = await tmdbService.getUpcoming(1);
            break;
          case 'trending':
          default:
            result = await tmdbService.getTrending('week', 1);
            break;
        }

        setFeedMovies(result.movies);
        if (result.movies.length > 0) {
          // Find a great hero candidate with a rich backdrop
          const candidate = result.movies.find(m => m.backdropUrl && m.overview && m.overview.length > 60) || result.movies[0];
          setHeroMovie(candidate);
        }
      }
    } catch (err: any) {
      console.error('[Movie Verse] TMDB Fetch Error:', err);
      setErrorMsg(err.message || 'Unable to connect to TMDB API. Check your TMDB_READ_TOKEN.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedData();
  }, [activeFeed, selectedMoodId]);

  // Recently viewed movie objects from storage or fallback
  const recentMovies = recentMovieIds
    .map(id => feedMovies.find(m => m.id === id) || MOVIES.find(m => m.id === id))
    .filter((m): m is Movie => m !== undefined);

  // Essential movies row
  const essentialMovies = (feedMovies.length > 0 ? feedMovies : MOVIES)
    .filter(m => m.rating >= 7.8)
    .slice(0, 5);

  const feedTabs = [
    { id: 'trending', label: 'Trending This Week', icon: Flame },
    { id: 'popular', label: 'Popular Discoveries', icon: TrendingUp },
    { id: 'now_playing', label: 'In Theaters Now', icon: Film },
    { id: 'top_rated', label: 'All-Time Masterpieces', icon: Award },
    { id: 'upcoming', label: 'Upcoming Releases', icon: Clock },
  ];

  return (
    <div className="space-y-16 animate-fade-in">
      
      {/* 1. Cinematic Hero Section with Real TMDB Movie */}
      <HeroBanner
        movie={heroMovie}
        onExploreMovie={onSelectMovie}
        onExploreConnections={() => onExploreConnections(heroMovie)}
        isWatchlisted={watchlist.includes(heroMovie.id)}
        onToggleWatchlist={onToggleWatchlist}
      />

      {/* 2. Mood Atmospheric Filter */}
      <MoodBrowser
        selectedMoodId={selectedMoodId}
        onSelectMood={onSelectMood}
      />

      {/* 3. Continue Exploring (Locally stored on device) */}
      {recentMovies.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-rose-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Continue Exploring
              </h2>
            </div>
            <span className="text-xs text-neutral-400">Locally saved history</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {recentMovies.map(movie => (
              <div key={movie.id} className="w-44 sm:w-52 shrink-0">
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

      {/* 4. Real TMDB Live Feeds Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <Film className="w-3.5 h-3.5" />
              <span>Real-Time Cinema Feed</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {selectedMoodId ? 'Atmospheric Selection' : 'Real-Time TMDB Discovery'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Powered by official TMDB API endpoints with high-resolution artwork
            </p>
          </div>

          {/* Feed Category Segmented Controls (Visible when no mood filter active) */}
          {!selectedMoodId && (
            <div className="flex gap-1.5 p-1 rounded-2xl liquid-glass overflow-x-auto no-scrollbar max-w-full">
              {feedTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeFeed === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeed(tab.id as DiscoveryFeedType)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error Notification with Friendly Retry */}
        {errorMsg && (
          <div className="p-6 rounded-3xl liquid-glass border border-rose-500/40 bg-rose-950/20 text-neutral-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>TMDB API Connection Notice</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
              {errorMsg}
            </p>
            <div className="text-[11px] text-neutral-400">
              Ensure <code className="px-1.5 py-0.5 rounded bg-black/60 text-rose-300">TMDB_READ_TOKEN</code> is bound in Cloudflare Worker secrets or local environment variables.
            </div>
            <button
              onClick={fetchFeedData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry TMDB Connection</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
        )}

        {/* Movies Grid */}
        {!isLoading && !errorMsg && feedMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {feedMovies.map(movie => (
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

        {!isLoading && !errorMsg && feedMovies.length === 0 && (
          <div className="p-12 rounded-3xl liquid-glass text-center text-neutral-400 text-sm">
            No movies returned for the selected filter. Try another category.
          </div>
        )}
      </section>

      {/* 5. Connected Universes Banner Showcase */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <Network className="w-3.5 h-3.5" />
              <span>Cinematic Franchises</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Connected Universes
            </h2>
          </div>
          <button
            onClick={() => onExploreConnections()}
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>All Universes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {UNIVERSES.slice(0, 3).map(universe => (
            <div
              key={universe.id}
              onClick={() => onExploreConnections(universe as any)}
              className="group relative liquid-glass-card rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-rose-500/40 transition-all p-6 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-rose-400 tracking-wider uppercase">
                  {universe.genres.join(' · ')}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-rose-200 transition-colors">
                  {universe.name}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                  {universe.tagline}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span>{universe.movieCount} Curated Films</span>
                <span className="flex items-center gap-1 text-rose-400 font-semibold group-hover:translate-x-1 transition-transform">
                  Explore Lore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Essential Watchlist Feature Strip */}
      <section className="liquid-glass rounded-3xl p-6 sm:p-8 border border-rose-500/20 relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Curated Story Arcs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Essential Watchlist Paths
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              Don't get bogged down in endless filler. Our watch orders delineate what is strictly essential for following the overarching narrative.
            </p>
          </div>

          <button
            onClick={() => onExploreWatchOrder()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-950/50 shrink-0"
          >
            <span>View Watch Order Guides</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {essentialMovies.map(movie => (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="p-3 rounded-2xl bg-black/40 hover:bg-white/[0.05] border border-white/5 cursor-pointer transition-colors group"
            >
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full aspect-[3/4] object-cover rounded-xl border border-white/10 mb-2 group-hover:scale-102 transition-transform"
              />
              <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                {movie.title}
              </div>
              <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                Must Watch Entry
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Same Vibe, Different Story Teaser */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Atmospheric Affinity</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Same Vibe, Different Story
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Films that share aesthetic DNA, psychological tension, or choreography without shared storylines
            </p>
          </div>
          <button
            onClick={() => onExploreSameVibe()}
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>Vibe Explorer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => onExploreSameVibe('the-batman')}
            className="liquid-glass-card rounded-2xl p-5 border border-white/10 hover:border-rose-500/30 cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-300 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-rose-200 transition-colors">
                If you loved The Batman (2022)
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Match: Rain-Soaked Noir · Detective Procedure · Pounding Bass
              </div>
            </div>
          </div>

          <div
            onClick={() => onExploreSameVibe('dune-part-2')}
            className="liquid-glass-card rounded-2xl p-5 border border-white/10 hover:border-rose-500/30 cursor-pointer transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-300 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-rose-200 transition-colors">
                If you loved Dune: Part Two (2024)
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Match: Epic Scale · Religious Fervor · Visceral Soundscapes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Where to Watch Teaser Strip */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <Tv className="w-3.5 h-3.5" />
              <span>Availability Directory</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Where to Watch Directory
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Verified legal streaming outlets, from ad-supported free vaults to digital 4K storefronts
            </p>
          </div>
          <button
            onClick={onExploreWhereToWatch}
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>Full Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WHERE_TO_WATCH_DIRECTORY.slice(0, 3).map(site => (
            <div
              key={site.id}
              className="liquid-glass-card rounded-2xl p-4 border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-bold text-rose-400 uppercase mb-1">
                  {site.category}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{site.name}</h4>
                <p className="text-xs text-neutral-400 line-clamp-2">{site.description}</p>
              </div>

              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-rose-300 hover:text-white pt-2 border-t border-white/5"
              >
                <span>Visit {site.name}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
