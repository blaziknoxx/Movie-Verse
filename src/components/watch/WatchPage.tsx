/**
 * Movie Verse — Watch Page & External Discovery Experience
 * Developer — Estiaq Mehedi
 * 
 * Replaces in-site video playback with an elegant, informative notice card,
 * and restores the premium external watch/search card system featuring:
 * - HDHub4u dynamic title-search cards
 * - TMDB & JustWatch official streaming directory
 * - Google Streaming Search
 * - MovieLinkBD regional directory
 * - Verified TMDB streaming providers when available
 * - Clean metadata, synopsis, and direct trailer access
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Movie, WhereToWatchSite } from '../../types/movie';
import { tmdbService, getPosterUrl, getBackdropUrl } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { buildHDHub4uSearchUrl, MOVIELINKBD_BASE_URL } from '../../services/streamingProviders';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Star, Clock, Calendar, Bookmark, Share2, 
  Film, Sparkles, Clapperboard, CheckCircle2, Shield,
  ExternalLink, Search, Tv, Globe, Info, Flame, AlertCircle, Compass, User
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

interface ExternalCardItem {
  id: string;
  name: string;
  category: string;
  region: string;
  url: string;
  badgeLabel: string;
  badgeType: 'pick' | 'official' | 'regional' | 'search';
  description: string;
  actionLabel: string;
  features: string[];
  destinationNotice: string;
  isMovieVersePick?: boolean;
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
  const [customSites, setCustomSites] = useState<WhereToWatchSite[]>(() => 
    storageService.getAllSites().filter(s => s.isCustom && s.id !== 'site-hdhub4u' && s.id !== 'site-movielinkbd')
  );

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
              overview: 'Explore external streaming options and official directories below.',
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

  const handleShare = () => {
    if (navigator.share && currentMovie) {
      navigator.share({
        title: `${currentMovie.title} — Watch on Movie Verse`,
        text: `Explore where to watch ${currentMovie.title} (${currentMovie.year || ''}) on Movie Verse.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Build the list of external watch and search cards dynamically for the selected movie
  const externalCards: ExternalCardItem[] = useMemo(() => {
    if (!currentMovie) return [];

    const movieTitle = currentMovie.title?.trim() || '';
    const movieYear = currentMovie.year ? String(currentMovie.year) : '';
    const cleanId = String(currentMovie.tmdbId || currentMovie.id).replace(/\D/g, '');

    const cards: ExternalCardItem[] = [];

    // 1. HDHub4u External Search Destination (Previous Movie Verse Favorite)
    const hdhubSearchUrl = buildHDHub4uSearchUrl(movieTitle);
    cards.push({
      id: 'ext-hdhub4u',
      name: 'HDHub4u',
      category: 'External Search Destination',
      region: 'Global / Multilingual',
      url: hdhubSearchUrl,
      badgeLabel: 'Movie Verse Pick',
      badgeType: 'pick',
      description: 'External movie directory and search portal. Search matching release catalog for international, dual-audio, and regional titles.',
      actionLabel: `Search "${movieTitle}" on HDHub4u`,
      features: [
        `Direct Title Query: /search.html?q=${encodeURIComponent(movieTitle)}`,
        'International & Dual Audio Catalog Search',
        'External Search Destination — No media hosted on Movie Verse'
      ],
      destinationNotice: 'Navigates to external search results on HDHub4u. Movie Verse does not host or distribute media files.',
      isMovieVersePick: true,
    });

    // 2. Official TMDB / JustWatch Streaming Options Page
    const tmdbWatchUrl = tmdbProviders?.link || (cleanId ? `https://www.themoviedb.org/movie/${cleanId}/watch` : 'https://www.themoviedb.org/');
    cards.push({
      id: 'ext-tmdb-watch',
      name: 'TMDB & JustWatch Directory',
      category: 'Official Streaming Guide',
      region: 'Verified Regional Platforms',
      url: tmdbWatchUrl,
      badgeLabel: 'Official Guide',
      badgeType: 'official',
      description: 'Official TMDB and JustWatch availability guide. Check authorized subscription, digital rental, and purchase platforms in your country.',
      actionLabel: `View Streaming Options on TMDB`,
      features: [
        'Official Licensed Streaming Directory',
        'Authorized Subscription, Rent & Buy Options',
        'Dynamic Region & Country Localization'
      ],
      destinationNotice: 'Opens the official TMDB streaming availability overview powered by JustWatch.',
      isMovieVersePick: false,
    });

    // 3. Google Streaming Search (Universal Web Guide)
    const googleQuery = `where to watch ${movieTitle} ${movieYear} movie streaming online`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
    cards.push({
      id: 'ext-google-search',
      name: 'Google Streaming Search',
      category: 'Search Engine Directory',
      region: 'Global',
      url: googleSearchUrl,
      badgeLabel: 'Universal Search',
      badgeType: 'search',
      description: 'Direct web search for available streaming providers, local theatrical screenings, digital rental storefronts, and availability updates.',
      actionLabel: `Search Streaming Options on Google`,
      features: [
        'Real-time Local Availability Search',
        'Aggregated Digital Storefronts & Theaters',
        'Instant Query with Title & Release Year'
      ],
      destinationNotice: 'Searches Google for verified streaming platforms and regional viewing options.',
      isMovieVersePick: false,
    });

    // 4. MovieLinkBD (Regional Entertainment Directory)
    cards.push({
      id: 'ext-movielinkbd',
      name: 'MovieLinkBD',
      category: 'External Entertainment Directory',
      region: 'South Asia & Global',
      url: MOVIELINKBD_BASE_URL,
      badgeLabel: 'Regional Directory',
      badgeType: 'regional',
      description: 'External entertainment directory index and cinema guide. Catalogs South Asian media and international releases via its homepage index.',
      actionLabel: `Browse MovieLinkBD Directory`,
      features: [
        'South Asian & International Catalog Index',
        'Homepage Directory Navigation',
        'Manual Search on Destination Required'
      ],
      destinationNotice: 'Links directly to the MovieLinkBD homepage directory. Availability is managed externally.',
      isMovieVersePick: false,
    });

    // 5. User-added Custom Sites
    customSites.forEach((site) => {
      cards.push({
        id: site.id,
        name: site.name,
        category: site.category || 'Custom Directory Entry',
        region: site.region || 'Global',
        url: site.url,
        badgeLabel: 'Custom Entry',
        badgeType: 'search',
        description: site.description || 'Custom streaming directory platform added to local browser storage.',
        actionLabel: `Visit ${site.name}`,
        features: [
          site.availabilityType || 'External Directory',
          'Locally Saved Destination',
          'Unverified Title Availability'
        ],
        destinationNotice: site.userExpectationNote || 'Custom platform saved on your device.',
        isMovieVersePick: false,
      });
    });

    return cards;
  }, [currentMovie, tmdbProviders, customSites]);

  if (!currentMovie || isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#200D06] border border-[#F88F22]/30 flex items-center justify-center text-[#FBB931] animate-spin">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[#FFE3B3]">Loading movie watch experience...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      
      {/* 1. Top Navigation Bar: Back Button, Title Anchor & Quick Actions */}
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

      {/* 2. Movie Title & Essential Info Header */}
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

        {/* Dedicated "Watch Official Trailer" Button */}
        <button
          type="button"
          onClick={() => onOpenTrailer(currentMovie)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#281308] hover:bg-[#381B0B] border border-[#F88F22]/35 text-[#FFE3B3] hover:text-white text-xs font-bold transition-all active:scale-95 shrink-0 self-start sm:self-auto shadow-md"
        >
          <Clapperboard className="w-4 h-4 text-[#FBB931]" />
          <span>Watch Official Trailer</span>
        </button>
      </div>

      {/* 3. Playback Temporarily Unavailable Premium Information Card (Replaces Video Player Area) */}
      <section className="relative overflow-hidden rounded-3xl border border-[#F88F22]/30 bg-gradient-to-br from-[#241108]/95 via-[#160B05]/95 to-[#0D0704] shadow-[0_12px_40px_rgba(234,97,19,0.22)] sunset-card-glow">
        
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#EA6113]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#FBB931]/10 blur-3xl pointer-events-none" />

        {/* Backdrop Artwork Scrim */}
        <div className="relative w-full h-48 sm:h-64 overflow-hidden">
          <img
            src={currentMovie.backdropUrl || currentMovie.posterUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center opacity-30 filter blur-xs transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140804] via-[#140804]/80 to-black/60" />
          
          {/* Centered Notice Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
            {/* Tasteful Play/Cinema Reel Illustration */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#2A1308]/90 border border-[#F88F22]/50 flex items-center justify-center text-[#FBB931] shadow-[0_0_28px_rgba(234,97,19,0.4)] backdrop-blur-md">
                <Film className="w-8 h-8 sm:w-10 sm:h-10 text-[#FBB931]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA6113] opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#F88F22] border-2 border-[#140804]" />
              </span>
            </div>

            <div className="space-y-1 max-w-lg">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-500/15 border border-[#F88F22]/40 text-[11px] font-extrabold uppercase tracking-widest text-[#FBB931]">
                Viewing Directory Notice
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Video Playback Temporarily Unavailable
              </h2>
            </div>
          </div>
        </div>

        {/* Supporting text banner */}
        <div className="p-5 sm:p-6 bg-[#0E0603]/85 border-t border-white/5 space-y-3">
          <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-3xl">
            In-site video playback is currently disabled inside Movie Verse. You can explore external viewing options, streaming directories, and dynamic title searches for <strong className="text-[#FFE3B3] font-semibold">{currentMovie.title}</strong> ({currentMovie.year || 'Cinema'}) below.
          </p>

          <div className="flex items-center gap-2 text-xs text-[#FBB931] font-semibold">
            <Compass className="w-4 h-4 text-[#F88F22]" />
            <span>Select any external option below to open verified search or streaming directory:</span>
          </div>
        </div>
      </section>

      {/* 4. Verified TMDB Stream Providers (If Available for this Title) */}
      {tmdbProviders && (
        (tmdbProviders.flatrate && tmdbProviders.flatrate.length > 0) ||
        (tmdbProviders.rent && tmdbProviders.rent.length > 0)
      ) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FBB931]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Official Streaming Providers for This Title
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">Powered by TMDB / JustWatch</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {tmdbProviders.flatrate && tmdbProviders.flatrate.map((prov) => (
              <a
                key={prov.provider_id}
                href={tmdbProviders.link || `https://www.themoviedb.org/movie/${currentMovie.tmdbId}/watch`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F88F22]/50 text-xs font-semibold text-white transition-all group"
              >
                {prov.logo_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`}
                    alt={prov.provider_name}
                    className="w-5 h-5 rounded-md object-cover"
                  />
                ) : (
                  <Tv className="w-4 h-4 text-[#F88F22]" />
                )}
                <span>{prov.provider_name}</span>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Stream</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-white" />
              </a>
            ))}

            {tmdbProviders.rent && tmdbProviders.rent.slice(0, 4).map((prov) => (
              <a
                key={prov.provider_id}
                href={tmdbProviders.link || `https://www.themoviedb.org/movie/${currentMovie.tmdbId}/watch`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs font-medium text-neutral-300 transition-all group"
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

      {/* 5. Restored External Watch-Link Cards System (HDHub4u, TMDB Watch, Google Search, MovieLinkBD) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#F88F22]" />
              <span>External Watch & Search Destinations</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Curated directories and verified title queries for <strong className="text-[#FFE3B3]">{currentMovie.title}</strong>
            </p>
          </div>

          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Title-Specific URL Encoded Queries</span>
          </div>
        </div>

        {/* External Link Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {externalCards.map((card) => {
            const isPick = card.isMovieVersePick;

            return (
              <div
                key={card.id}
                className={`sunset-card-glow relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
                  isPick 
                    ? 'border-2 border-[#FBB931]/70 bg-gradient-to-br from-[#241108]/95 via-[#160B05]/95 to-[#0D0704] shadow-[0_0_32px_rgba(251,185,49,0.22)]' 
                    : 'border border-[#F88F22]/20 bg-[#160B05]/90 hover:border-[#FBB931]/50 shadow-lg hover:shadow-[0_0_24px_rgba(248,143,34,0.25)]'
                }`}
              >
                {/* Top accent highlight for Movie Verse Pick */}
                {isPick && (
                  <div className="absolute top-0 left-0 right-0 h-1 sunset-gradient-bar" />
                )}

                {/* Ambient glow inside card */}
                <div 
                  className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-opacity ${
                    isPick ? 'bg-[#FBB931]/20 opacity-80' : 'bg-[#EA6113]/15 opacity-50 group-hover:opacity-80'
                  }`} 
                />

                <div className="space-y-4 relative z-10">
                  {/* Category / Region & Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#FBB931]">
                        <Globe className="w-3.5 h-3.5 text-[#F88F22]" />
                        <span>{card.region}</span>
                      </span>
                      <span className="text-neutral-600 text-xs">·</span>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {card.category}
                      </span>
                    </div>

                    {/* Badge */}
                    <div>
                      {card.badgeType === 'pick' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#EA6113]/30 via-[#F88F22]/30 to-[#FBB931]/30 border border-[#FBB931]/60 text-[#FFE3B3] text-xs font-extrabold shadow-[0_0_16px_rgba(251,185,49,0.35)] animate-pulse">
                          <Flame className="w-3.5 h-3.5 text-[#FBB931] fill-[#FBB931]" />
                          <span>{card.badgeLabel}</span>
                        </div>
                      )}

                      {card.badgeType === 'official' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{card.badgeLabel}</span>
                        </div>
                      )}

                      {card.badgeType === 'regional' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EA6113]/25 border border-[#F88F22]/40 text-[#FFE3B3] text-xs font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-[#F88F22]" />
                          <span>{card.badgeLabel}</span>
                        </div>
                      )}

                      {card.badgeType === 'search' && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-300 text-[11px] font-medium">
                          <Search className="w-3 h-3 text-[#FBB931]" />
                          <span>{card.badgeLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title and Domain */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#FFE3B3] transition-colors tracking-tight flex items-center gap-2">
                      <span>{card.name}</span>
                    </h3>
                    <div className="text-xs text-[#F88F22] font-mono truncate mt-0.5 opacity-90">
                      {card.url}
                    </div>
                  </div>

                  {/* Query Details / Movie Context */}
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed transition-all ${
                    isPick 
                      ? 'bg-[#2A1308]/70 border-[#FBB931]/30 text-[#FFE3B3]' 
                      : 'bg-[#120703]/80 border-white/5 text-neutral-300'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-white">
                      {isPick ? (
                        <Flame className="w-3.5 h-3.5 text-[#FBB931]" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 text-[#F88F22]" />
                      )}
                      <span>Querying: <span className="text-[#FBB931]">{currentMovie.title}</span> {currentMovie.year ? `(${currentMovie.year})` : ''}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 pl-5">
                      {card.description}
                    </p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-1.5 pt-1">
                    {card.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isPick ? 'text-[#FBB931]' : 'text-[#F88F22]'}`} />
                        <span className="font-medium">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Transparency Notice */}
                  <div className="p-3 rounded-2xl bg-[#0E0603]/90 border border-white/5 text-[11px] text-neutral-400 leading-relaxed flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#FBB931] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#FFE3B3]">Destination Notice:</strong> {card.destinationNotice}
                    </span>
                  </div>
                </div>

                {/* Visit Platform Button */}
                <div className="pt-5 mt-3 relative z-10">
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-md group-hover:shadow-[0_4px_20px_rgba(234,97,19,0.5)] active:scale-[0.98] min-h-[44px] ${
                      isPick 
                        ? 'sunset-gradient-btn' 
                        : 'bg-white/10 hover:bg-white/15 border border-[#F88F22]/30 hover:border-[#FBB931]/60'
                    }`}
                    aria-label={`${card.actionLabel} for ${card.name}`}
                  >
                    <span>{card.actionLabel}</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Legal / External Navigation Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#140A05]/80 border border-[#F88F22]/20 flex items-start gap-3 text-xs text-neutral-300">
        <Info className="w-4 h-4 text-[#FBB931] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>External Directory Notice:</strong> You are leaving Movie Verse when visiting external links. Movie Verse is an informational cinematic discovery guide and does not host, broadcast, or store media files on our servers. Movie-specific availability is maintained by independent third-party platforms.
        </span>
      </div>

      {/* 7. Brave Browser Recommendation Card (From Previous Movie Verse Design) */}
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

      {/* 8. Movie Details, Cast & Director */}
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

      {/* 9. Related Movies Section */}
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
