/**
 * Movie Verse — Watch Page & Cinematic Streaming Experience
 * Developer — Estiaq Mehedi
 * 
 * Features:
 * - Responsive 16:9 embedded video player supporting NexStream with iOS/Android optimizations
 * - Clean UI with complete exclusion of technical labels (no "NexStream HD Embed Active", no "Direct Player" text/links)
 * - Dedicated data-driven "Streaming Sources" selector below the video player with rich green glow cards
 * - Rich full-surface green glow redesign for all External Action Cards (HDHub4u, MovieLinkBD, Official Trailer, TMDB, Google)
 * - Prominent provider titles with elegant green verification badges with continuous subtle pulse
 * - Future-proof provider configuration registry
 * - Preserved navigation, TMDB metadata, related titles, and external destination URLs
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Movie, WhereToWatchSite } from '../../types/movie';
import { tmdbService, getPosterUrl, getBackdropUrl } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { nexstreamService } from '../../services/nexstreamService';
import { buildHDHub4uSearchUrl, MOVIELINKBD_BASE_URL } from '../../services/streamingProviders';
import { 
  getActiveStreamingProviders, 
  getStreamingProviderById, 
  DEFAULT_PROVIDER_ID,
  StreamingProviderConfig 
} from '../../services/streamingSourceConfig';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Star, Clock, Bookmark, Share2, 
  Film, Sparkles, Clapperboard, CheckCircle2, Shield,
  ExternalLink, Search, Tv, Globe, Info, Flame, AlertCircle, 
  Compass, Maximize, Minimize, RefreshCw, Check, Layers
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

interface ExternalActionItem {
  id: string;
  name: string;
  category: string;
  region: string;
  url?: string;
  badgeLabel: string;
  description: string;
  actionLabel: string;
  features: string[];
  isTrailerTrigger?: boolean;
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
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [tmdbProviders, setTmdbProviders] = useState<{
    link?: string;
    flatrate?: { provider_id: number; provider_name: string; logo_path?: string }[];
    rent?: { provider_id: number; provider_name: string; logo_path?: string }[];
    buy?: { provider_id: number; provider_name: string; logo_path?: string }[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  
  // Streaming Provider State (Default: NexStream)
  const [selectedProviderId, setSelectedProviderId] = useState<string>(DEFAULT_PROVIDER_ID);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [playerHasError, setPlayerHasError] = useState(false);
  const [playerReloadNonce, setPlayerReloadNonce] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // TV series parameters
  const [currentSeason, setCurrentSeason] = useState<number>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('season') || sp.get('s');
      return s ? Math.max(1, parseInt(s, 10) || 1) : 1;
    } catch {
      return 1;
    }
  });

  const [currentEpisode, setCurrentEpisode] = useState<number>(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const ep = sp.get('episode') || sp.get('ep');
      return ep ? Math.max(1, parseInt(ep, 10) || 1) : 1;
    } catch {
      return 1;
    }
  });

  const [customSites] = useState<WhereToWatchSite[]>(() => 
    storageService.getAllSites().filter(s => s.isCustom && s.id !== 'site-hdhub4u' && s.id !== 'site-movielinkbd')
  );

  // Available data-driven streaming providers
  const availableProviders = useMemo(() => getActiveStreamingProviders(), []);
  
  const activeProvider = useMemo(() => {
    return getStreamingProviderById(selectedProviderId) || availableProviders[0];
  }, [selectedProviderId, availableProviders]);

  // Synchronize movie state from props or from URL movieId
  useEffect(() => {
    if (movie) {
      setCurrentMovie(movie);
      setIsLoading(false);
      return;
    }

    if (movieId) {
      const cached = storageService.getCachedMovie(movieId);
      if (cached) {
        setCurrentMovie(cached);
        setIsLoading(false);
        return;
      }

      const cleanId = String(movieId).replace(/\D/g, '');
      if (cleanId) {
        setIsLoading(true);
        tmdbService.getMovieDetails(cleanId)
          .then((loaded) => {
            setCurrentMovie(loaded);
            storageService.saveCachedMovie(loaded);
          })
          .catch(() => {
            // Curated fallback if offline or not in TMDB
            const fallbackMovie: Movie = {
              id: cleanId,
              tmdbId: Number(cleanId),
              title: `Movie Title (${cleanId})`,
              slug: `movie-${cleanId}`,
              year: 2024,
              duration: '2h 00m',
              tagline: '',
              rating: 7.5,
              genres: ['Cinema'],
              director: 'Cinema Production',
              cast: [],
              overview: 'Explore streaming options and official directories below.',
              posterUrl: getPosterUrl(null, `Movie ${cleanId}`),
              backdropUrl: getBackdropUrl(null, `Movie ${cleanId}`),
              streamingPlatforms: [],
              vibeTags: ['Cinema Experience'],
              vibeProfile: {
                darkAtmosphere: 6,
                actionIntensity: 6,
                psychologicalComplexity: 6,
                mysterySuspense: 6,
                emotionalWeight: 6,
                pacing: 'Balanced',
                visualStyle: 'Cinematic'
              },
              moodIds: ['sci-fi-epic'],
            };
            setCurrentMovie(fallbackMovie);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [movie, movieId]);

  // Load related titles & verified watch providers whenever currentMovie changes
  useEffect(() => {
    if (!currentMovie) return;

    // Save as recently viewed
    storageService.addRecentMovie(currentMovie.id);

    const cleanId = String(currentMovie.tmdbId || currentMovie.id).replace(/\D/g, '');
    if (cleanId) {
      // 1. Fetch recommendations or similar movies
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

      // 2. Fetch official watch providers from TMDB
      tmdbService.getMovieWatchProviders(cleanId)
        .then((providers) => {
          if (providers) {
            setTmdbProviders(providers);
          }
        })
        .catch(() => {});
    }
  }, [currentMovie]);

  // Determine if content is TV or Movie
  const isTvSeries = useMemo(() => {
    if (!currentMovie) return false;
    return (
      currentMovie.mediaType === 'tv' ||
      (currentMovie.duration && (
        currentMovie.duration.toLowerCase().includes('series') || 
        currentMovie.duration.toLowerCase().includes('season') || 
        currentMovie.duration.toLowerCase().includes('ep')
      )) ||
      Boolean(new URLSearchParams(window.location.search).get('season'))
    );
  }, [currentMovie]);

  // Clean numeric TMDB ID
  const cleanTmdbId = useMemo(() => {
    if (!currentMovie) return 0;
    const raw = currentMovie.tmdbId ?? (Number(currentMovie.id) ? Number(currentMovie.id) : null);
    return nexstreamService.parseTmdbId(raw) || 0;
  }, [currentMovie]);

  // Build the active provider's embed URL (NexStream or future providers)
  const activeEmbedUrl = useMemo(() => {
    if (!cleanTmdbId || !activeProvider) return null;
    return activeProvider.buildEmbedUrl({
      tmdbId: cleanTmdbId,
      title: currentMovie?.title || '',
      isTv: isTvSeries,
      season: currentSeason,
      episode: currentEpisode,
    });
  }, [cleanTmdbId, activeProvider, isTvSeries, currentSeason, currentEpisode, playerReloadNonce]);

  // Reset player loading/error state ONLY when embed URL changes
  useEffect(() => {
    if (activeEmbedUrl) {
      setIsPlayerLoading(true);
      setPlayerHasError(false);
    }
  }, [activeEmbedUrl]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement;
      setIsFullscreen(Boolean(fsEl));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const handleShare = () => {
    if (navigator.share && currentMovie) {
      navigator.share({
        title: `${currentMovie.title} — Watch on Movie Verse`,
        text: `Watch ${currentMovie.title} (${currentMovie.year || ''}) on Movie Verse.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Provider Selection Handler
  const handleSelectProvider = (providerId: string) => {
    if (providerId === selectedProviderId) {
      // Avoid unnecessary player re-render loops when clicking already active provider
      if (playerHasError) {
        setPlayerReloadNonce((prev) => prev + 1);
      }
      return;
    }
    setSelectedProviderId(providerId);
  };

  // Build the list of external action cards with preserved URLs and official trailer trigger
  const externalActionCards: ExternalActionItem[] = useMemo(() => {
    if (!currentMovie) return [];

    const movieTitle = currentMovie.title?.trim() || '';
    const movieYear = currentMovie.year ? String(currentMovie.year) : '';
    const cleanId = String(currentMovie.tmdbId || currentMovie.id).replace(/\D/g, '');

    const cards: ExternalActionItem[] = [];

    // 1. HDHub4u Dynamic Title Search
    cards.push({
      id: 'ext-hdhub4u',
      name: 'HDHub4u',
      category: 'External Search Directory',
      region: 'Global / Multi-Audio',
      url: buildHDHub4uSearchUrl(movieTitle),
      badgeLabel: 'Movie Verse Pick',
      description: 'Search matching release catalog for dual-audio, multilingual, and high-definition titles.',
      actionLabel: `Search "${movieTitle}" on HDHub4u`,
      features: [
        'Direct Title-Matched Search Query',
        'Dual-Audio & High-Definition Releases',
        'Independent External Directory'
      ],
    });

    // 2. MovieLinkBD Regional Directory
    cards.push({
      id: 'ext-movielinkbd',
      name: 'MovieLinkBD',
      category: 'Regional Entertainment Directory',
      region: 'South Asia & Global',
      url: MOVIELINKBD_BASE_URL,
      badgeLabel: 'Regional Directory',
      description: 'Curated regional media index and South Asian cinema catalog navigation.',
      actionLabel: `Browse MovieLinkBD Directory`,
      features: [
        'South Asian & International Catalog',
        'Homepage Media Index Navigation',
        'Independent External Directory'
      ],
    });

    // 3. Official Studio Trailer
    cards.push({
      id: 'action-official-trailer',
      name: 'Official Trailer',
      category: 'Verified Video Preview',
      region: 'Global HQ',
      isTrailerTrigger: true,
      badgeLabel: 'Official Studio Cut',
      description: 'Watch the verified high-definition teaser and official trailer cut for this title.',
      actionLabel: `Play Official Trailer`,
      features: [
        'Authentic Studio Preview',
        'Teasers, Clips & Full Trailers',
        'Instant In-App Video Playback'
      ],
    });

    // 4. Official TMDB & JustWatch Guide
    const tmdbWatchUrl = tmdbProviders?.link || (cleanId ? `https://www.themoviedb.org/movie/${cleanId}/watch` : 'https://www.themoviedb.org/');
    cards.push({
      id: 'ext-tmdb-watch',
      name: 'TMDB & JustWatch Directory',
      category: 'Licensed Streaming Guide',
      region: 'Regional Platforms',
      url: tmdbWatchUrl,
      badgeLabel: 'Official Guide',
      description: 'Check official licensed subscription, digital rental, and purchase platforms in your country.',
      actionLabel: `View Options on TMDB`,
      features: [
        'Official Licensed Streaming Directory',
        'Subscription, Rent & Purchase Info',
        'Country & Region Localization'
      ],
    });

    // 5. Google Streaming Search
    const googleQuery = `where to watch ${movieTitle} ${movieYear} movie streaming online`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
    cards.push({
      id: 'ext-google-search',
      name: 'Google Streaming Search',
      category: 'Universal Search Engine',
      region: 'Global',
      url: googleSearchUrl,
      badgeLabel: 'Universal Search',
      description: 'Direct web search for local digital storefronts, availability dates, and regional providers.',
      actionLabel: `Search on Google`,
      features: [
        'Real-time Local Availability Search',
        'Storefronts & Digital Aggregators',
        'Instant Title & Year Query'
      ],
    });

    // 6. User Custom Sites
    customSites.forEach((site) => {
      cards.push({
        id: site.id,
        name: site.name,
        category: site.category || 'Custom Directory',
        region: site.region || 'Global',
        url: site.url,
        badgeLabel: 'Custom Entry',
        description: site.description || 'Custom streaming platform saved to local browser storage.',
        actionLabel: `Visit ${site.name}`,
        features: [
          site.availabilityType || 'External Directory',
          'Locally Saved Destination',
          'Independent Portal'
        ],
      });
    });

    return cards;
  }, [currentMovie, tmdbProviders, customSites]);

  if (!currentMovie || isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#082012] border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-emerald-100">Loading cinema player...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      
      {/* 1. Top Navigation Bar: Back, Anchor & Quick Actions */}
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
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFE3B3] flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-[#F88F22]" />
            <span>Watch Experience</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            title={copiedShare ? 'Link copied!' : 'Share movie'}
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

      {/* 2. Movie Title & Essential Details Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {currentMovie.title}
            </h1>
            {currentMovie.year && (
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-[#FFE3B3]">
                {currentMovie.year}
              </span>
            )}
            {isTvSeries && (
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-300">
                TV Series
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium pt-0.5">
            <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {currentMovie.rating ? currentMovie.rating.toFixed(1) : '7.5'} Rating
            </span>
            {currentMovie.duration && (
              <>
                <span className="text-neutral-600">·</span>
                <span className="flex items-center gap-1 text-neutral-300">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
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

        {/* TV Series Season & Episode Picker (if TV) */}
        {isTvSeries && (
          <div className="flex items-center gap-2 bg-[#120703] border border-[#F88F22]/25 px-3 py-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
              <span className="text-neutral-400">Season</span>
              <select
                value={currentSeason}
                onChange={(e) => setCurrentSeason(Number(e.target.value))}
                className="bg-black/50 text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#F88F22]"
                aria-label="Select season"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s} className="bg-[#120703] text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-neutral-600">·</span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
              <span className="text-neutral-400">Episode</span>
              <select
                value={currentEpisode}
                onChange={(e) => setCurrentEpisode(Number(e.target.value))}
                className="bg-black/50 text-white border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#F88F22]"
                aria-label="Select episode"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((ep) => (
                  <option key={ep} value={ep} className="bg-[#120703] text-white">
                    {ep}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. Dedicated Embedded Streaming Video Player */}
      <section 
        ref={playerContainerRef}
        className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-emerald-500/30 shadow-[0_12px_45px_rgba(4,30,15,0.7)] group"
      >
        {/* Loading State Overlay */}
        {isPlayerLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xs transition-opacity">
            <div className="w-12 h-12 rounded-2xl bg-[#072413] border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-spin">
              <Film className="w-6 h-6" />
            </div>
            <p className="mt-3 text-xs sm:text-sm font-semibold text-emerald-200">
              Initializing player stream...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {playerHasError ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#07170e]/95 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Player Initialization Paused
              </h3>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Unable to load the current video stream. Click below to retry or select an alternate source.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPlayerHasError(false);
                setIsPlayerLoading(true);
                setPlayerReloadNonce((prev) => prev + 1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Player</span>
            </button>
          </div>
        ) : activeEmbedUrl ? (
          /* Real Embedded Player with iOS / Android optimizations */
          <iframe
            ref={iframeRef}
            key={`${activeProvider.id}-${cleanTmdbId}-${isTvSeries ? `${currentSeason}-${currentEpisode}` : 'm'}-${playerReloadNonce}`}
            src={activeEmbedUrl}
            title={`${currentMovie.title} Player`}
            onLoad={() => setIsPlayerLoading(false)}
            onError={() => {
              setIsPlayerLoading(false);
              setPlayerHasError(true);
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            loading="eager"
            referrerPolicy="origin"
            className="w-full h-full border-0 relative z-10"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
            Player source not resolved
          </div>
        )}

        {/* Quick Fullscreen Overlay Button */}
        <div className="absolute top-3 right-3 z-30 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-black/75 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 active:scale-95 shadow-md transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* 4. Dedicated Streaming Sources Section (Requirement 3 & 4) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Streaming Sources
            </h2>
          </div>
          <span className="text-[11px] text-emerald-300/80 font-medium">
            Active Embedded Provider
          </span>
        </div>

        {/* Provider Cards Grid: Data-driven, automatically supports future providers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {availableProviders.map((provider) => {
            const isSelected = provider.id === selectedProviderId;

            return (
              <div
                key={provider.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectProvider(provider.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectProvider(provider.id);
                  }
                }}
                className={`green-glow-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer flex flex-col justify-between select-none ${
                  isSelected ? 'green-glow-card-active' : ''
                }`}
                aria-pressed={isSelected}
                aria-label={`Select ${provider.name} streaming source`}
              >
                {/* Top Row: Provider Name + Verification Badge */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    {/* Website / Provider Name prominently as main text */}
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {provider.name}
                    </h3>

                    {/* Green Verification-Style Badge with subtle continuous glow/pulse */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold green-badge-pulse shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                      <span>{provider.badgeLabel}</span>
                    </div>
                  </div>

                  {/* Clean summary note */}
                  <p className="text-xs text-emerald-100/80 leading-relaxed">
                    {provider.description || 'High-definition fast video playback.'}
                  </p>
                </div>

                {/* Bottom Row: Active State Indicator & Touch Target */}
                <div className="pt-3 mt-2 border-t border-emerald-500/20 flex items-center justify-between relative z-10 text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`w-2.5 h-2.5 rounded-full ${
                        isSelected 
                          ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' 
                          : 'bg-emerald-800'
                      }`} 
                    />
                    <span className="font-bold text-emerald-200">
                      {isSelected ? 'Active Player' : 'Select Source'}
                    </span>
                  </div>

                  <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    isSelected 
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50' 
                      : 'bg-white/5 text-neutral-300'
                  }`}>
                    {isSelected ? 'Selected' : 'Switch'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Verified TMDB Stream Providers (If Available from JustWatch) */}
      {tmdbProviders && (
        (tmdbProviders.flatrate && tmdbProviders.flatrate.length > 0) ||
        (tmdbProviders.rent && tmdbProviders.rent.length > 0)
      ) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#092013]/90 border border-emerald-500/25 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Official Streaming Providers for This Title
              </h3>
            </div>
            <span className="text-[11px] text-emerald-300/70">Powered by TMDB / JustWatch</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {tmdbProviders.flatrate && tmdbProviders.flatrate.map((prov) => (
              <a
                key={prov.provider_id}
                href={tmdbProviders.link || `https://www.themoviedb.org/movie/${currentMovie.tmdbId}/watch`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/30 text-xs font-semibold text-white transition-all group"
              >
                {prov.logo_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`}
                    alt={prov.provider_name}
                    className="w-5 h-5 rounded-md object-cover"
                  />
                ) : (
                  <Tv className="w-4 h-4 text-emerald-400" />
                )}
                <span>{prov.provider_name}</span>
                <span className="text-[10px] text-emerald-300 uppercase font-bold">Stream</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-white" />
              </a>
            ))}

            {tmdbProviders.rent && tmdbProviders.rent.slice(0, 4).map((prov) => (
              <a
                key={prov.provider_id}
                href={tmdbProviders.link || `https://www.themoviedb.org/movie/${currentMovie.tmdbId}/watch`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 text-xs font-medium text-neutral-300 transition-all group"
              >
                {prov.logo_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`}
                    alt={prov.provider_name}
                    className="w-5 h-5 rounded-md object-cover"
                  />
                ) : (
                  <Tv className="w-4 h-4 text-neutral-400" />
                )}
                <span>{prov.provider_name}</span>
                <span className="text-[10px] text-amber-400 uppercase font-bold">Rent/Buy</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-white" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 6. Redesigned External Action Cards (Requirement 2) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>External Watch & Action Destinations</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Verified directories, search portals, and official trailer previews for <strong className="text-emerald-300">{currentMovie.title}</strong>
            </p>
          </div>

          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Preserved External Links</span>
          </div>
        </div>

        {/* External Link Cards Grid with Rich Green Glow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {externalActionCards.map((card) => {
            const isTrailer = card.isTrailerTrigger;

            return (
              <div
                key={card.id}
                className="green-glow-card rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4 relative z-10">
                  {/* Category / Region & Green Verification-Style Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{card.region}</span>
                      </span>
                      <span className="text-emerald-800 text-xs">·</span>
                      <span className="text-[11px] text-neutral-300 font-medium">
                        {card.category}
                      </span>
                    </div>

                    {/* Verification-Style Badge with Subtle Continuous Glow Pulse */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold green-badge-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                      <span>{card.badgeLabel}</span>
                    </div>
                  </div>

                  {/* Website / Provider Name prominently as main text */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-200 transition-colors tracking-tight">
                      {card.name}
                    </h3>
                    {card.url && (
                      <div className="text-xs text-emerald-400/80 font-mono truncate mt-0.5">
                        {card.url}
                      </div>
                    )}
                  </div>

                  {/* Context Note */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20 text-xs leading-relaxed text-emerald-100/90">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-white">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Context: <span className="text-emerald-300">{currentMovie.title}</span> {currentMovie.year ? `(${currentMovie.year})` : ''}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 pl-5">
                      {card.description}
                    </p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-1.5 pt-1">
                    {card.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span className="font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Trigger Button */}
                <div className="pt-5 mt-3 relative z-10">
                  {isTrailer ? (
                    <button
                      type="button"
                      onClick={() => onOpenTrailer(currentMovie)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-md bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-400/50 hover:border-emerald-300 active:scale-[0.98] min-h-[46px]"
                      aria-label={`${card.actionLabel} for ${card.name}`}
                    >
                      <Clapperboard className="w-4 h-4 text-emerald-300" />
                      <span>{card.actionLabel}</span>
                    </button>
                  ) : (
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-md bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-400/50 hover:border-emerald-300 active:scale-[0.98] min-h-[46px]"
                      aria-label={`${card.actionLabel} for ${card.name}`}
                    >
                      <span>{card.actionLabel}</span>
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Legal & Transparency Notice */}
      <div className="p-4 rounded-2xl bg-[#092013]/70 border border-emerald-500/20 flex items-start gap-3 text-xs text-neutral-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>External Directory Notice:</strong> You are leaving Movie Verse when visiting external links. Movie Verse is a cinematic discovery guide and does not host or store media files on its servers. Availability on external sites is maintained independently.
        </span>
      </div>

      {/* 8. Brave Browser Recommendation Card */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[#F88F22]/30 bg-gradient-to-br from-[#241108]/90 via-[#160B05]/95 to-[#0D0704] shadow-[0_8px_32px_rgba(234,97,19,0.2)]">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#EA6113]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#FBB931]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA6113] to-[#F88F22] flex items-center justify-center text-white shadow-md shadow-[#EA6113]/40 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                A Cleaner External Browsing Experience
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#FFE3B3]/90 leading-relaxed pl-0 sm:pl-11">
              "Want fewer intrusive popups while exploring external websites? Try Brave Browser with its built-in Shields ad protection for a smoother and cleaner experience."
            </p>
          </div>

          <a
            href="https://brave.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl sunset-gradient-btn text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#EA6113]/30 transition-all shrink-0 self-start sm:self-center active:scale-95 group"
          >
            <span>Get Brave</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* 9. Movie Details, Cast & Director */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-4 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#FBB931] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#EA6113]" />
            <span>Synopsis & Credits</span>
          </h3>
          {currentMovie.tagline && (
            <p className="text-xs text-[#FFE3B3] italic">
              "{currentMovie.tagline}"
            </p>
          )}
        </div>

        {/* Overview Text */}
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

        {/* Director and Cast */}
        {(currentMovie.director || (currentMovie.cast && currentMovie.cast.length > 0)) && (
          <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {currentMovie.director && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-semibold">Director:</span>
                <span className="text-white font-medium">{currentMovie.director}</span>
              </div>
            )}
            {currentMovie.cast && currentMovie.cast.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-semibold">Starring:</span>
                <span className="text-neutral-300 truncate">{currentMovie.cast.slice(0, 4).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 10. Related Movies Section */}
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
                onOpenWatch={(m) => {
                  setCurrentMovie(m);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
