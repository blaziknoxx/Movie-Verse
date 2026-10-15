/**
 * Movie Verse — Full Movie & TV Series Watch Page Component
 * Developer — Estiaq Mehedi
 * 
 * Powered by NexStream API (https://api.codespecters.com/):
 * - Movies: https://api.codespecters.com/embed/movie/{tmdbId}?apikey={NEXSTREAM_API_KEY}
 * - TV:     https://api.codespecters.com/embed/tv/{tmdbId}/{season}/{episode}?apikey={NEXSTREAM_API_KEY}
 * 
 * Uses authentic TMDB IDs, responsive iframe embed player, interactive season/episode selection,
 * API key configuration, and verified studio previews.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Movie, PlaybackSource } from '../../types/movie';
import { tmdbService, getPosterUrl, getBackdropUrl } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { nexstreamService } from '../../services/nexstreamService';
import { resolveMoviePlaybackSources } from '../../services/videoSecurityService';
import { VideoPlayer } from '../player/VideoPlayer';
import { PlaybackSourceSelector } from '../player/PlaybackSourceSelector';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Star, Clock, Calendar, Bookmark, Share2, 
  Film, Sparkles, Tv, Clapperboard, CheckCircle2, Shield,
  ChevronRight, ChevronLeft, Play, AlertCircle, Layers
} from 'lucide-react';

interface WatchPageProps {
  movie: Movie | null;
  movieId?: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  isWatchlisted: boolean;
  isWatched: boolean;
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  onToggleWatched: (movieId: string, movieObj?: Movie) => void;
}

interface EpisodeItem {
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview?: string;
  stillUrl?: string;
  runtime?: number;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  movieId,
  onBack,
  onSelectMovie,
  onOpenTrailer,
  isWatchlisted,
  isWatched,
  onToggleWatchlist,
  onToggleWatched,
}) => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(movie);
  const [sources, setSources] = useState<PlaybackSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<PlaybackSource | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  // Media Type: 'movie' | 'tv'
  const [isTvShow, setIsTvShow] = useState<boolean>(() => {
    if (!movie) return false;
    return (
      movie.mediaType === 'tv' ||
      (Boolean(movie.duration) && (movie.duration.toLowerCase().includes('series') || movie.duration.toLowerCase().includes('ep')))
    );
  });

  // TV Seasons & Episodes state
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [availableSeasons, setAvailableSeasons] = useState<{ seasonNumber: number; name: string; episodeCount: number }[]>([
    { seasonNumber: 1, name: 'Season 1', episodeCount: 10 }
  ]);
  const [episodesList, setEpisodesList] = useState<EpisodeItem[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Playback Active State (starts on user action)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // NexStream API Key Reactive State (synced from nexstreamService and Profile Settings)
  const [apiKey, setApiKey] = useState<string>(() => nexstreamService.getApiKey());

  useEffect(() => {
    const unsubscribe = nexstreamService.subscribe((newKey) => {
      setApiKey(newKey);
    });
    // Ensure key is fetched if not yet in memory
    if (!nexstreamService.hasApiKey()) {
      nexstreamService.fetchServerKey().then((fetched) => {
        if (fetched) setApiKey(fetched);
      });
    }
    return unsubscribe;
  }, []);

  // Synchronize movie state from props or from URL movieId
  useEffect(() => {
    if (movie) {
      setCurrentMovie(movie);
      const isTv = (
        movie.mediaType === 'tv' ||
        (Boolean(movie.duration) && (movie.duration.toLowerCase().includes('series') || movie.duration.toLowerCase().includes('ep')))
      );
      setIsTvShow(isTv);
      setIsLoading(false);
      return;
    }

    if (movieId) {
      const cached = storageService.getCachedMovie(movieId);
      if (cached) {
        setCurrentMovie(cached);
        const isTv = (
          cached.mediaType === 'tv' ||
          (Boolean(cached.duration) && (cached.duration.toLowerCase().includes('series') || cached.duration.toLowerCase().includes('ep')))
        );
        setIsTvShow(isTv);
        setIsLoading(false);
        return;
      }

      const cleanId = String(movieId).replace(/\D/g, '');
      if (cleanId) {
        setIsLoading(true);
        // 1. Attempt to fetch details from TMDB proxy
        tmdbService.getMovieDetails(cleanId)
          .then((loaded) => {
            setCurrentMovie(loaded);
            storageService.saveCachedMovie(loaded);
          })
          .catch(async () => {
            // 2. Fallback to NexStream metadata API if TMDB token is not configured or blocked
            try {
              const meta = await nexstreamService.fetchMetadata(cleanId, isTvShow);
              if (meta) {
                const titleStr = meta.title || `TMDB Title ${cleanId}`;
                const synthesized: Movie = {
                  id: String(cleanId),
                  tmdbId: Number(cleanId),
                  title: titleStr,
                  slug: titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  year: meta.year || 2024,
                  duration: '2h 00m',
                  tagline: '',
                  rating: 7.5,
                  genres: ['Cinema'],
                  director: 'Cinema Production',
                  cast: [],
                  overview: meta.overview || `Streaming cinematic presentation (TMDB ID: ${cleanId}).`,
                  posterUrl: meta.poster || getPosterUrl(null, titleStr),
                  backdropUrl: meta.backdrop || meta.poster || getBackdropUrl(null, titleStr),
                  streamingPlatforms: [],
                  vibeTags: ['Cinematic Experience'],
                  vibeProfile: {
                    darkAtmosphere: 6,
                    actionIntensity: 6,
                    psychologicalComplexity: 6,
                    mysterySuspense: 6,
                    emotionalWeight: 6,
                    pacing: 'Balanced',
                    visualStyle: 'Cinematic'
                  },
                  mediaType: isTvShow ? 'tv' : 'movie',
                  moodIds: ['sci-fi-epic'],
                };
                setCurrentMovie(synthesized);
                storageService.saveCachedMovie(synthesized);
              }
            } catch {
              // ignore
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [movie, movieId]);

  // Load TV show details and episodes if TV series
  useEffect(() => {
    if (!currentMovie) return;
    const cleanTmdbId = nexstreamService.parseTmdbId(currentMovie.tmdbId ?? currentMovie.id);
    if (!cleanTmdbId) return;

    if (isTvShow) {
      tmdbService.getTvDetails(cleanTmdbId)
        .then((tvData) => {
          if (tvData && tvData.seasons && tvData.seasons.length > 0) {
            setAvailableSeasons(tvData.seasons);
          }
        })
        .catch(() => {});

      setIsLoadingEpisodes(true);
      tmdbService.getTvSeasonEpisodes(cleanTmdbId, selectedSeason)
        .then((eps) => {
          if (eps && eps.length > 0) {
            setEpisodesList(eps);
          } else {
            // Fallback generated list of episodes for the season
            const seasonObj = availableSeasons.find(s => s.seasonNumber === selectedSeason);
            const count = seasonObj?.episodeCount || 10;
            const fallback: EpisodeItem[] = Array.from({ length: count }, (_, i) => ({
              episodeNumber: i + 1,
              seasonNumber: selectedSeason,
              name: `Episode ${i + 1}`,
              overview: `Episode ${i + 1} of Season ${selectedSeason}.`,
            }));
            setEpisodesList(fallback);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingEpisodes(false));
    }
  }, [currentMovie, isTvShow, selectedSeason]);

  // Resolve playback sources whenever movie, tv mode, season, episode, or key changes
  useEffect(() => {
    if (!currentMovie) return;

    const resolvedSources = resolveMoviePlaybackSources(currentMovie, {
      isTv: isTvShow,
      season: selectedSeason,
      episode: selectedEpisode,
      apiKey: apiKey.trim() || undefined,
    });

    setSources(resolvedSources);
    setSelectedSource(resolvedSources[0] || null);
    setIsLoading(false);

    // Save as recently viewed
    storageService.addRecentMovie(currentMovie.id);

    // Fetch related titles from TMDB
    const cleanId = String(currentMovie.tmdbId || currentMovie.id).replace(/\D/g, '');
    if (cleanId) {
      tmdbService.getMovieRecommendations(cleanId)
        .then((recs) => {
          const filtered = (recs || []).filter(
            (m) => String(m.tmdbId || m.id) !== cleanId
          );
          setRelatedMovies(filtered.slice(0, 5));
        })
        .catch(() => {
          tmdbService.getSimilarMovies(cleanId).then((sim) => {
            const filtered = (sim || []).filter(
              (m) => String(m.tmdbId || m.id) !== cleanId
            );
            setRelatedMovies(filtered.slice(0, 5));
          }).catch(() => {});
        });
    }
  }, [currentMovie, isTvShow, selectedSeason, selectedEpisode, apiKey]);

  const handleShare = () => {
    if (navigator.share && currentMovie) {
      navigator.share({
        title: `${currentMovie.title} — Watch on Movie Verse`,
        text: `Stream ${currentMovie.title} in HD via NexStream on Movie Verse.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Episode navigation
  const handlePrevEpisode = () => {
    if (selectedEpisode > 1) {
      setSelectedEpisode(selectedEpisode - 1);
    } else if (selectedSeason > 1) {
      setSelectedSeason(selectedSeason - 1);
      setSelectedEpisode(1);
    }
  };

  const handleNextEpisode = () => {
    const currentSeasonObj = availableSeasons.find(s => s.seasonNumber === selectedSeason);
    const maxEp = currentSeasonObj?.episodeCount || episodesList.length || 10;
    if (selectedEpisode < maxEp) {
      setSelectedEpisode(selectedEpisode + 1);
    } else if (selectedSeason < availableSeasons.length) {
      setSelectedSeason(selectedSeason + 1);
      setSelectedEpisode(1);
    }
  };

  if (!currentMovie) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#200D06] border border-[#F88F22]/30 flex items-center justify-center text-[#FBB931] animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[#FFE3B3]">Loading streaming theater...</p>
      </div>
    );
  }

  const cleanTmdbId = nexstreamService.parseTmdbId(currentMovie.tmdbId ?? currentMovie.id);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 sm:space-y-7 animate-fade-in pb-16">
      {/* 1. Compact Top Bar with Back Button & Movie Verse Branding */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-2 border-b border-[#F88F22]/15">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white text-xs font-bold transition-all active:scale-95"
          aria-label="Back to movie details"
        >
          <ArrowLeft className="w-4 h-4 text-[#FBB931]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EA6113] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFE3B3] flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#F88F22]" />
            <span>Theater Screen</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            title={copiedShare ? 'Link copied!' : 'Share stream'}
            aria-label="Share movie"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Mark Watched */}
          <button
            type="button"
            onClick={() => onToggleWatched(currentMovie.id, currentMovie)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border active:scale-95 ${
              isWatched
                ? 'bg-amber-500/20 text-[#FBB931] border-[#FBB931]/60 shadow-[0_0_12px_rgba(251,185,49,0.3)]'
                : 'bg-[#1A0B05] hover:bg-[#281308] text-neutral-300 hover:text-white border-[#F88F22]/25'
            }`}
            title={isWatched ? 'Marked as Watched' : 'Mark Watched'}
            aria-label="Toggle watched"
          >
            <CheckCircle2 className={`w-4 h-4 ${isWatched ? 'text-[#FBB931] fill-[#FBB931]/20' : ''}`} />
          </button>

          {/* Watchlist Toggle */}
          <button
            type="button"
            onClick={(e) => onToggleWatchlist(currentMovie.id, e)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border active:scale-95 ${
              isWatchlisted
                ? 'sunset-gradient-btn text-white border-[#F88F22] shadow-[0_0_12px_rgba(234,97,19,0.5)]'
                : 'bg-[#1A0B05] hover:bg-[#281308] text-neutral-300 hover:text-white border-[#F88F22]/25'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label="Toggle watchlist"
          >
            <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Format Switcher (Movie vs TV Series) */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-[#140804] border border-[#F88F22]/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-400 pl-0.5">Format:</span>
          <div className="inline-flex rounded-xl bg-black/60 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setIsTvShow(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                !isTvShow
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Movie
            </button>
            <button
              type="button"
              onClick={() => setIsTvShow(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                isTvShow
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              TV Series
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold text-[#FFE3B3]">NexStream HD</span>
        </div>
      </div>

      {/* 4. TV Series Season & Episode Controls (Strictly for TV Shows) */}
      {isTvShow && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#140804] border border-[#F88F22]/25 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#EA6113]" />
                <span>Select Season & Episode</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Pick your episode to stream with NexStream embed
              </p>
            </div>

            {/* Quick Prev / Next Episode Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevEpisode}
                disabled={selectedSeason === 1 && selectedEpisode === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1F0E06] hover:bg-[#2A1409] disabled:opacity-40 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="text-xs font-bold text-[#FBB931] px-2 font-mono tabular-nums">
                S{selectedSeason}:E{selectedEpisode}
              </span>
              <button
                type="button"
                onClick={handleNextEpisode}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1F0E06] hover:bg-[#2A1409] text-neutral-300 hover:text-white text-xs font-semibold border border-white/10"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Season Selector Tabs */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Seasons ({availableSeasons.length})
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-touch">
              {availableSeasons.map((s) => {
                const isCurrent = s.seasonNumber === selectedSeason;
                return (
                  <button
                    key={s.seasonNumber}
                    type="button"
                    onClick={() => {
                      setSelectedSeason(s.seasonNumber);
                      setSelectedEpisode(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                      isCurrent
                        ? 'sunset-gradient-btn text-white border-[#F88F22] shadow-[0_0_12px_rgba(234,97,19,0.5)]'
                        : 'bg-[#1C0D06] hover:bg-[#281308] text-neutral-300 hover:text-white border-white/10'
                    }`}
                  >
                    {s.name} ({s.episodeCount} eps)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Episode Grid Selector */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Episodes in Season {selectedSeason}
            </span>
            {isLoadingEpisodes ? (
              <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-[#F88F22] border-t-transparent animate-spin" />
                <span>Loading episode list...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                {episodesList.map((ep) => {
                  const isCurEp = ep.episodeNumber === selectedEpisode;
                  return (
                    <button
                      key={ep.episodeNumber}
                      type="button"
                      onClick={() => setSelectedEpisode(ep.episodeNumber)}
                      className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between space-y-1 ${
                        isCurEp
                          ? 'bg-[#2E1508] border-[#FBB931] shadow-[0_0_14px_rgba(251,185,49,0.3)]'
                          : 'bg-black/50 hover:bg-[#1E0D06] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[11px] font-mono font-bold ${isCurEp ? 'text-[#FBB931]' : 'text-neutral-400'}`}>
                          Ep {ep.episodeNumber}
                        </span>
                        {isCurEp && <Play className="w-3 h-3 text-[#FBB931] fill-[#FBB931]" />}
                      </div>
                      <div className="text-xs font-semibold text-white truncate w-full">
                        {ep.name || `Episode ${ep.episodeNumber}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Large 16:9 Video Player inside a Premium Glowing Card */}
      <div className="relative w-full space-y-3">
        {selectedSource && (
          <VideoPlayer
            source={selectedSource}
            title={
              isTvShow
                ? `${currentMovie.title} — Season ${selectedSeason}, Episode ${selectedEpisode}`
                : currentMovie.title
            }
            posterUrl={currentMovie.backdropUrl || currentMovie.posterUrl}
            autoPlay={isPlaying}
          />
        )}

        {/* 6. Compact Playback Source Selector */}
        {sources.length > 1 && (
          <div className="pt-1">
            <PlaybackSourceSelector
              sources={sources}
              selectedSourceId={selectedSource?.id || ''}
              onSelectSource={(src) => setSelectedSource(src)}
            />
          </div>
        )}
      </div>

      {/* 7. Movie Details, Metadata, Trailer Shortcut, and Synopsis */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {currentMovie.title}
              </h1>
              <span className="px-2 py-0.5 rounded bg-orange-500/15 border border-[#F88F22]/40 text-[10px] font-bold text-[#FBB931] uppercase tracking-wider">
                {isTvShow ? `TV Series · S${selectedSeason}:E${selectedEpisode}` : 'Full Movie'}
              </span>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium">
              <span className="flex items-center gap-1 text-neutral-300">
                <Calendar className="w-3 h-3 text-[#F88F22]" />
                {currentMovie.year}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {currentMovie.rating ? currentMovie.rating.toFixed(1) : '7.5'} Rating
              </span>
              {currentMovie.duration && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {currentMovie.duration}
                  </span>
                </>
              )}
              {currentMovie.genres && currentMovie.genres.length > 0 && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="text-[#FFE3B3]/90">{currentMovie.genres.slice(0, 3).join(', ')}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Action: Watch Official Trailer */}
          <button
            type="button"
            onClick={() => onOpenTrailer(currentMovie)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#281308] hover:bg-[#381B0B] border border-[#F88F22]/35 text-[#FFE3B3] hover:text-white text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            <Clapperboard className="w-3.5 h-3.5 text-[#FBB931]" />
            <span>Watch Official Trailer</span>
          </button>
        </div>

        {/* Short Synopsis */}
        {currentMovie.overview && (
          <div className="space-y-1.5 pt-1">
            <p className={`text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl ${!isOverviewExpanded ? 'line-clamp-3' : ''}`}>
              {currentMovie.overview}
            </p>
            {currentMovie.overview.length > 200 && (
              <button
                type="button"
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="text-xs font-bold text-[#F88F22] hover:text-[#FBB931]"
              >
                {isOverviewExpanded ? 'Show less' : 'Read more synopsis'}
              </button>
            )}
          </div>
        )}

        {/* Selected source info banner */}
        {selectedSource?.note && (
          <div className="pt-2 flex items-start gap-2 p-3 rounded-xl bg-black/40 border border-[#F88F22]/15 text-[11px] text-neutral-400">
            <Shield className="w-4 h-4 text-[#FBB931] shrink-0 mt-0.5" />
            <span>{selectedSource.note}</span>
          </div>
        )}
      </div>

      {/* 8. Compact Related Movies Section */}
      {relatedMovies.length > 0 && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EA6113]" />
              <span>Related Titles</span>
            </h3>
            <span className="text-xs text-neutral-400">
              More cinematic universe entries
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {relatedMovies.map((relMovie) => (
              <MovieCard
                key={relMovie.id}
                movie={relMovie}
                onSelectMovie={onSelectMovie}
                isWatchlisted={storageService.getWatchlist().includes(relMovie.id)}
                onToggleWatchlist={(id, e) => onToggleWatchlist(id, e)}
                showUniverseTag={false}
                onOpenTrailer={onOpenTrailer}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
