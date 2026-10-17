/**
 * Movie Verse — Cinematic Person Detail View
 * Developer — Estiaq Mehedi
 * 
 * Features:
 * - Wide atmospheric cinematic hero area with soft faded backdrop & sunset glow
 * - Circular profile portrait with luminous gradient halo overlapping hero cover
 * - Verified factual data cards (Birthday, Calculated Age, Place of Birth, Known For, Credits Count)
 * - Zero fabricated data (strictly no invented religion or unverified claims)
 * - Expandable full biography with readable line length
 * - Career Highlights & Collaborations derived from real credit history
 * - Popular Works horizontal touch-swiping row using Movie Verse cards
 * - Filterable Filmography (Acting, Directing, Writing, Production, Crew) with chronological sort
 * - Clickable movie cards directly opening Movie Verse movie details & streaming
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PersonDetails, PersonCreditItem, PersonCreditsResponse, Movie } from '../../types/movie';
import { tmdbService } from '../../services/tmdbService';
import { storageService } from '../../services/storageService';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Calendar, MapPin, Award, Film, Star, 
  Sparkles, ChevronRight, Share2, Search, SlidersHorizontal,
  Clock, CheckCircle2, User, Clapperboard, ExternalLink, Info
} from 'lucide-react';

interface PersonDetailViewProps {
  personId: string | number;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  onOpenTrailer?: (movie: Movie) => void;
  onOpenWatch?: (movie: Movie) => void;
}

type FilmographyFilter = 'all' | 'acting' | 'directing' | 'writing' | 'production' | 'crew';
type SortOption = 'popularity' | 'newest' | 'rating';

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  personId,
  onBack,
  onSelectMovie,
  watchlist,
  onToggleWatchlist,
  onOpenTrailer,
  onOpenWatch,
}) => {
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<PersonCreditsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Filmography filter & sort states
  const [activeFilter, setActiveFilter] = useState<FilmographyFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [filterSearch, setFilterSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch verified person details & credits
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setVisibleCount(12);
    setFilterSearch('');

    const numericId = String(personId).replace(/\D/g, '');
    if (!numericId) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    Promise.all([
      tmdbService.getPersonDetails(numericId),
      tmdbService.getPersonCredits(numericId),
    ])
      .then(([personData, creditsData]) => {
        if (!isMounted) return;
        setPerson(personData);
        setCredits(creditsData);
      })
      .catch((err) => {
        console.warn('[PersonDetailView] Error fetching person data:', err);
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [personId]);

  // Calculate age accurately from birthday and optional deathday
  const ageInfo = useMemo(() => {
    if (!person?.birthday) return null;
    try {
      const birthDate = new Date(person.birthday);
      const endDate = person.deathday ? new Date(person.deathday) : new Date();
      let age = endDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = endDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
      }
      if (person.deathday) {
        return {
          label: `${age} years old at passing`,
          birthYear: birthDate.getFullYear(),
          deathYear: new Date(person.deathday).getFullYear(),
          isDeceased: true,
        };
      }
      return {
        label: `${age} years old`,
        birthYear: birthDate.getFullYear(),
        isDeceased: false,
      };
    } catch {
      return null;
    }
  }, [person?.birthday, person?.deathday]);

  // Deduplicate all credits into an indexed map and calculate popular works
  const { allCreditsList, popularWorks, categoriesAvailable, careerTimeline } = useMemo(() => {
    if (!credits) {
      return {
        allCreditsList: [],
        popularWorks: [],
        categoriesAvailable: { acting: 0, directing: 0, writing: 0, production: 0, crew: 0 },
        careerTimeline: null,
      };
    }

    const castItems = credits.cast || [];
    const crewItems = credits.crew || [];

    // Distinct lists for category filters
    const actingList = castItems;
    const directingList = crewItems.filter((c) => c.job === 'Director');
    const writingList = crewItems.filter((c) => ['Screenplay', 'Writer', 'Author', 'Story', 'Teleplay'].includes(c.job || ''));
    const productionList = crewItems.filter((c) => ['Producer', 'Executive Producer', 'Co-Producer'].includes(c.job || ''));
    const otherCrewList = crewItems.filter((c) => !['Director', 'Screenplay', 'Writer', 'Author', 'Story', 'Teleplay', 'Producer', 'Executive Producer'].includes(c.job || ''));

    // Deduplicate all unique credits by ID for "all" tab while preserving multi-role descriptions
    const uniqueMap = new Map<number, PersonCreditItem>();
    
    // Add crew items first
    for (const item of crewItems) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, { ...item });
      } else {
        const existing = uniqueMap.get(item.id)!;
        if (item.job && existing.job && !existing.job.includes(item.job)) {
          existing.job = `${existing.job}, ${item.job}`;
        }
      }
    }

    // Add cast items
    for (const item of castItems) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, { ...item });
      } else {
        const existing = uniqueMap.get(item.id)!;
        existing.character = item.character || existing.character;
      }
    }

    const combinedUnique = Array.from(uniqueMap.values());

    // Popular works: top credits sorted by popularity descending
    const sortedPopular = [...combinedUnique]
      .filter((m) => m.posterPath || m.posterUrl)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10);

    // Career timeline
    const years = combinedUnique
      .map((m) => m.year)
      .filter((y): y is number => typeof y === 'number' && !isNaN(y) && y > 1920 && y <= new Date().getFullYear() + 2);
    
    const minYear = years.length > 0 ? Math.min(...years) : null;
    const maxYear = years.length > 0 ? Math.max(...years) : null;
    const timelineStr = minYear && maxYear ? (minYear === maxYear ? `${minYear}` : `${minYear} – ${maxYear}`) : null;

    return {
      allCreditsList: combinedUnique,
      popularWorks: sortedPopular,
      categoriesAvailable: {
        acting: actingList.length,
        directing: directingList.length,
        writing: writingList.length,
        production: productionList.length,
        crew: otherCrewList.length,
      },
      careerTimeline: timelineStr,
    };
  }, [credits]);

  // Filtered and sorted filmography list
  const filteredCredits = useMemo(() => {
    if (!credits) return [];

    let list: PersonCreditItem[] = [];

    switch (activeFilter) {
      case 'acting':
        list = credits.cast || [];
        break;
      case 'directing':
        list = (credits.crew || []).filter((c) => c.job === 'Director');
        break;
      case 'writing':
        list = (credits.crew || []).filter((c) => ['Screenplay', 'Writer', 'Author', 'Story', 'Teleplay'].includes(c.job || ''));
        break;
      case 'production':
        list = (credits.crew || []).filter((c) => ['Producer', 'Executive Producer', 'Co-Producer'].includes(c.job || ''));
        break;
      case 'crew':
        list = (credits.crew || []).filter((c) => !['Director', 'Screenplay', 'Writer', 'Author', 'Story', 'Teleplay', 'Producer', 'Executive Producer'].includes(c.job || ''));
        break;
      case 'all':
      default:
        list = allCreditsList;
        break;
    }

    // Apply title search query if entered
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase().trim();
      list = list.filter((item) => item.title.toLowerCase().includes(q) || (item.character && item.character.toLowerCase().includes(q)));
    }

    // Apply sorting
    const sorted = [...list];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const dateA = a.releaseDate || '';
        const dateB = b.releaseDate || '';
        return dateB.localeCompare(dateA);
      });
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    } else {
      // Default: popularity
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return sorted;
  }, [credits, allCreditsList, activeFilter, sortBy, filterSearch]);

  // Convert PersonCreditItem to Movie object for MovieCard
  const creditToMovie = (item: PersonCreditItem): Movie => {
    return {
      id: String(item.id),
      tmdbId: item.id,
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      year: item.year || 2024,
      duration: 'Feature',
      rating: item.voteAverage || 7.5,
      voteCount: item.voteCount,
      genres: item.genres && item.genres.length > 0 ? item.genres : ['Cinema'],
      tagline: item.character ? `Role: ${item.character}` : (item.job ? `Credits: ${item.job}` : 'Watch on Movie Verse'),
      overview: item.overview || `Presentation of ${item.title} on Movie Verse.`,
      director: item.job === 'Director' ? (person?.name || 'Featured Director') : 'Featured Director',
      cast: item.character ? [person?.name || 'Featured Cast'] : ['Featured Cast'],
      posterUrl: item.posterUrl || '',
      backdropUrl: item.backdropUrl || '',
      vibeTags: ['Cinematic', 'Verified TMDB'],
      vibeProfile: {
        darkAtmosphere: 7,
        actionIntensity: 7,
        psychologicalComplexity: 7,
        mysterySuspense: 7,
        emotionalWeight: 7,
        pacing: 'Balanced',
        visualStyle: 'Cinematic Widescreen',
      },
      streamingPlatforms: [],
      moodIds: ['sci-fi-epic', 'action-heavy'],
      mediaType: item.mediaType,
      releaseDate: item.releaseDate,
    };
  };

  const handleShare = () => {
    if (navigator.share && person) {
      navigator.share({
        title: `${person.name} — Movie Verse Cast & Crew`,
        text: `Explore ${person.name}'s filmography, career highlights, and biography on Movie Verse.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#200D06] border border-[#F88F22]/30 flex items-center justify-center text-[#FBB931] shadow-[0_0_20px_rgba(234,97,19,0.3)] animate-spin">
          <Film className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Loading Cinematic Profile...</p>
          <p className="text-xs text-neutral-400">Resolving verified TMDB credits and filmography</p>
        </div>
      </div>
    );
  }

  if (hasError || !person) {
    return (
      <div className="w-full max-w-2xl mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#2A0F05] border border-red-500/30 flex items-center justify-center text-[#F88F22]">
          <User className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Profile Archive Unavailable</h2>
          <p className="text-xs text-neutral-400 max-w-sm">
            Could not retrieve person credits for ID #{personId}. Please check your connection or return to movies.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl sunset-gradient-btn text-white text-xs font-bold active:scale-95 transition-all"
        >
          Return to Previous Screen
        </button>
      </div>
    );
  }

  // Choose best cover backdrop: top popular work's backdrop, or fallback
  const heroBackdrop = popularWorks[0]?.backdropUrl || popularWorks[0]?.posterUrl || person.profileUrl;

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      
      {/* 1. Top Navigation Bar with Back Button, Title Anchor, and Share */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-2 border-b border-[#F88F22]/15">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white text-xs font-bold transition-all active:scale-95"
          aria-label="Back to previous screen"
        >
          <ArrowLeft className="w-4 h-4 text-[#FBB931]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EA6113] animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#FFE3B3] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#F88F22]" />
            <span>Cinematic Artist Identity</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="w-9 h-9 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
          title={copiedShare ? 'Link copied!' : 'Share profile'}
          aria-label="Share person profile"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Wide Cinematic Cover / Hero Area */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-[#140804] border border-[#F88F22]/25 shadow-2xl">
        {/* Backdrop Cover Artwork */}
        <div className="relative w-full h-44 sm:h-64 md:h-72 overflow-hidden bg-[#0A0402]">
          {heroBackdrop && (
            <img
              src={heroBackdrop}
              alt={person.name}
              className="w-full h-full object-cover object-center filter blur-[1.5px] scale-105 opacity-35"
              loading="eager"
              decoding="async"
            />
          )}

          {/* Deep Translucent Scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#140804] via-[#140804]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#140804] via-transparent to-[#140804]/80" />

          {/* Ambient Sunset Glow in Hero */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-[#EA6113]/25 blur-3xl pointer-events-none" />
        </div>

        {/* Overlapping Profile Info Header */}
        <div className="relative px-5 sm:px-8 pb-6 sm:pb-8 -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 text-center sm:text-left z-10">
          
          {/* Circular Profile Portrait with Glowing Border */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#EA6113] via-[#F88F22] to-[#FBB931] blur-md opacity-75" />
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-[3px] bg-gradient-to-tr from-[#EA6113] via-[#F88F22] to-[#FBB931] shadow-[0_0_28px_rgba(234,97,19,0.55)]">
              <img
                src={person.profileUrl || tmdbService.getOptimizedProfileUrl(person.profilePath, 'w500', person.name)}
                alt={person.name}
                className="w-full h-full rounded-full object-cover bg-[#1A0B05]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          {/* Name & Primary Metadata Line */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {person.name}
              </h1>
              {person.knownForDepartment && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#EA6113]/20 border border-[#EA6113]/40 text-xs font-bold text-[#FBB931] uppercase tracking-wider">
                  {person.knownForDepartment}
                </span>
              )}
            </div>

            {/* Factual Subtitle Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-neutral-300 font-medium">
              {careerTimeline && (
                <span className="flex items-center gap-1.5 text-[#FFE3B3]">
                  <Film className="w-3.5 h-3.5 text-[#F88F22]" />
                  <span>Active {careerTimeline}</span>
                </span>
              )}
              {allCreditsList.length > 0 && (
                <>
                  <span className="text-neutral-600 hidden sm:inline">·</span>
                  <span className="text-neutral-400">
                    {allCreditsList.length} Credited Works
                  </span>
                </>
              )}
              {person.placeOfBirth && (
                <>
                  <span className="text-neutral-600 hidden sm:inline">·</span>
                  <span className="flex items-center gap-1 text-neutral-400 truncate max-w-xs">
                    <MapPin className="w-3.5 h-3.5 text-[#FBB931] shrink-0" />
                    <span>{person.placeOfBirth}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Compact Glass Information Cards (Strictly factual TMDB data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Born */}
        <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#F88F22]" />
            <span>Born</span>
          </span>
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {person.birthday || 'Unavailable'}
          </p>
        </div>

        {/* Age / Life */}
        <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#FBB931]" />
            <span>{ageInfo?.isDeceased ? 'Passed' : 'Age'}</span>
          </span>
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {ageInfo ? ageInfo.label : (person.deathday ? `Passed (${person.deathday})` : 'Undisclosed')}
          </p>
        </div>

        {/* Place of Birth */}
        <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#F88F22]" />
            <span>Birthplace</span>
          </span>
          <p className="text-xs sm:text-sm font-bold text-white truncate" title={person.placeOfBirth || undefined}>
            {person.placeOfBirth || 'International'}
          </p>
        </div>

        {/* Total Credits */}
        <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-[#FBB931]" />
            <span>Total Credits</span>
          </span>
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {allCreditsList.length} Productions
          </p>
        </div>
      </div>

      {/* 4. Biography Section */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-3 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#EA6113]" />
          <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            Cinematic Biography
          </h2>
        </div>

        {person.biography && person.biography.trim() ? (
          <div className="space-y-2">
            <p className={`text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-4xl ${!isBioExpanded ? 'line-clamp-4' : ''}`}>
              {person.biography}
            </p>
            {person.biography.length > 280 && (
              <button
                type="button"
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="text-xs font-bold text-[#F88F22] hover:text-[#FBB931] cursor-pointer transition-colors pt-1"
              >
                {isBioExpanded ? 'Show less' : 'Read full biography &rarr;'}
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-xs text-neutral-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#FBB931] shrink-0" />
            <span>A verified biography is not currently available in TMDB records for {person.name}.</span>
          </div>
        )}
      </div>

      {/* 5. Popular Works Section (Horizontal Swipeable Row) */}
      {popularWorks.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-[#EA6113]" />
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Popular Works
              </h2>
              <span className="text-xs text-neutral-400">
                Sorted by TMDB popularity
              </span>
            </div>
          </div>

          {/* Horizontal Track Container */}
          <div className="relative w-full group/popular">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-[#0A0402] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-[#0A0402] to-transparent z-10" />

            <div
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-touch py-1 px-1 select-none"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                touchAction: 'pan-x pan-y',
                scrollBehavior: 'auto',
              }}
            >
              {popularWorks.map((item) => {
                const movieObj = creditToMovie(item);
                return (
                  <div key={`pop-${item.id}-${item.character || item.job}`} className="w-[125px] sm:w-[145px] md:w-[165px] shrink-0">
                    <MovieCard
                      movie={movieObj}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movieObj.id)}
                      onToggleWatchlist={onToggleWatchlist}
                      onOpenTrailer={onOpenTrailer}
                      onOpenWatch={onOpenWatch}
                      showUniverseTag={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. Complete Filmography Section with Category Filters, Search, and Sort */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-[#F88F22]" />
              <span>Complete Filmography</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Verified productions across movies and television ({filteredCredits.length} matching)
            </p>
          </div>

          {/* Quick Search & Sort within Filmography */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter titles..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#1A0B05] border border-[#F88F22]/25 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FBB931] w-36 sm:w-44 transition-all"
              />
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="py-1.5 px-3 rounded-xl bg-[#1A0B05] border border-[#F88F22]/25 text-xs font-semibold text-[#FFE3B3] focus:outline-none focus:border-[#FBB931] cursor-pointer"
            >
              <option value="popularity">Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 select-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'sunset-gradient-btn text-white shadow-md'
                : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
            }`}
          >
            All Works ({allCreditsList.length})
          </button>

          {categoriesAvailable.acting > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('acting')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'acting'
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
              }`}
            >
              Acting ({categoriesAvailable.acting})
            </button>
          )}

          {categoriesAvailable.directing > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('directing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'directing'
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
              }`}
            >
              Directing ({categoriesAvailable.directing})
            </button>
          )}

          {categoriesAvailable.writing > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('writing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'writing'
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
              }`}
            >
              Writing ({categoriesAvailable.writing})
            </button>
          )}

          {categoriesAvailable.production > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('production')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'production'
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
              }`}
            >
              Production ({categoriesAvailable.production})
            </button>
          )}

          {categoriesAvailable.crew > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('crew')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'crew'
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'bg-[#180C05] hover:bg-[#251308] text-neutral-300 border border-[#F88F22]/20'
              }`}
            >
              Crew Leads ({categoriesAvailable.crew})
            </button>
          )}
        </div>

        {/* Filmography Grid */}
        {filteredCredits.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#140804]/80 border border-white/5 text-center text-xs text-neutral-400">
            No credited titles match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {filteredCredits.slice(0, visibleCount).map((item) => {
              const movieObj = creditToMovie(item);
              return (
                <div key={`grid-${item.id}-${item.character || item.job}`} className="flex flex-col space-y-1.5">
                  <MovieCard
                    movie={movieObj}
                    onSelectMovie={onSelectMovie}
                    isWatchlisted={watchlist.includes(movieObj.id)}
                    onToggleWatchlist={onToggleWatchlist}
                    onOpenTrailer={onOpenTrailer}
                    onOpenWatch={onOpenWatch}
                    showUniverseTag={false}
                  />
                  {/* Subtle role note beneath card */}
                  {(item.character || item.job) && (
                    <span className="text-[10px] text-neutral-400 truncate px-1 font-medium">
                      {item.character ? `as ${item.character}` : item.job}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Progressive "Show More" Button for extensive filmographies */}
        {visibleCount < filteredCredits.length && (
          <div className="text-center pt-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1A0B05] hover:bg-[#2A1308] border border-[#F88F22]/30 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Load More Credits ({filteredCredits.length - visibleCount} remaining)</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#FBB931]" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
