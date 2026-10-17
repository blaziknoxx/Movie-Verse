/**
 * Movie Verse — Premium Cinematic Person Profile Page
 * Developer — Estiaq Mehedi
 * 
 * Features:
 * - Dedicated TMDB person profile page (/person/:personId)
 * - Atmospheric cinematic hero cover with TMDB movie backdrop and amber/golden ambient lighting
 * - Large overlapping circular portrait with glowing sunset halo and fallback initials
 * - Verified factual personal details (Birthday, Age, Place of Birth, Known For, Total Credits, IMDb)
 * - Clean biography section with line-clamp toggle and genuine empty state
 * - Top Popular Works horizontal swipeable row (drag/swipe, zero autoplay, zero jumping)
 * - Career Timeline & Milestones (Debut, Peak Acclaim, Latest Production)
 * - Frequent Collaborators (grounded in real TMDB joint film credits, clickable profiles)
 * - Franchise & Universe Connections (matching Movie Verse curated universes)
 * - Upcoming Projects (only displayed when verified upcoming credits exist)
 * - Complete Filmography with multi-department tabs (Acting, Directing, Writing, Production, Crew)
 * - Real-time title search and multi-option sorting (Popularity, Newest, Oldest, Rating)
 * - Progressive loading and seamless navigation back to movie details
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PersonDetails, PersonCreditItem, PersonCreditsResponse, Movie } from '../../types/movie';
import { tmdbService, TMDB_TO_UNIVERSE_MAP } from '../../services/tmdbService';
import { MovieCard } from '../discover/MovieCard';
import { 
  ArrowLeft, Calendar, MapPin, Award, Film, Star, 
  Sparkles, ChevronRight, Share2, Search, SlidersHorizontal,
  Clock, CheckCircle2, User, Clapperboard, ExternalLink, Info,
  Flame, Users, Layers, TrendingUp, History
} from 'lucide-react';

interface PersonDetailViewProps {
  personId: string | number;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  onOpenTrailer?: (movie: Movie) => void;
  onOpenWatch?: (movie: Movie) => void;
  onSelectPerson?: (personId: string | number) => void;
}

type FilmographyFilter = 'all' | 'acting' | 'directing' | 'writing' | 'production' | 'crew';
type SortOption = 'popularity' | 'newest' | 'oldest' | 'rating';

interface FrequentCollaborator {
  id: number;
  name: string;
  profileUrl?: string;
  role: string;
  count: number;
  sharedTitles: string[];
}

function formatBirthDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(Date.UTC(year, month, day));
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  personId,
  onBack,
  onSelectMovie,
  watchlist,
  onToggleWatchlist,
  onOpenTrailer,
  onOpenWatch,
  onSelectPerson,
}) => {
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<PersonCreditsResponse | null>(null);
  const [collaborators, setCollaborators] = useState<FrequentCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);

  // Filmography filter & sort states
  const [activeFilter, setActiveFilter] = useState<FilmographyFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [filterSearch, setFilterSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(18);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch verified person details & credits
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setVisibleCount(18);
    setFilterSearch('');
    setPortraitFailed(false);
    setCollaborators([]);

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

        // Update document title for enhanced UX and restore on unmount
        if (personData?.name) {
          document.title = `${personData.name} — Cast & Crew | Movie Verse`;
        }
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
      document.title = 'Movie Verse — Cinematic Universe & Discovery';
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
          age,
          birthYear: birthDate.getFullYear(),
          deathYear: new Date(person.deathday).getFullYear(),
          isDeceased: true,
        };
      }
      return {
        label: `${age} years old`,
        age,
        birthYear: birthDate.getFullYear(),
        isDeceased: false,
      };
    } catch {
      return null;
    }
  }, [person?.birthday, person?.deathday]);

  // Deduplicate all credits into an indexed map and calculate popular works & timeline
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
        if (item.posterUrl && !existing.posterUrl) {
          existing.posterUrl = item.posterUrl;
        }
      }
    }

    const combinedUnique = Array.from(uniqueMap.values());

    // Popular works: top credits sorted by popularity descending
    const sortedPopular = [...combinedUnique]
      .filter((m) => m.posterPath || m.posterUrl)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 12);

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

  // Compute Frequent Collaborators grounded in real TMDB movie credits
  useEffect(() => {
    if (!popularWorks || popularWorks.length === 0 || !person) return;
    let isMounted = true;

    // Take top 4 most popular movies to discover recurring co-stars & creators
    const topMovies = popularWorks.slice(0, 4);
    const currentPersonId = Number(person.id);

    Promise.all(topMovies.map((m) => tmdbService.getMovieCredits(m.id).catch(() => null)))
      .then((results) => {
        if (!isMounted) return;
        const map = new Map<number, FrequentCollaborator>();

        results.forEach((creditObj, idx) => {
          if (!creditObj) return;
          const movieTitle = topMovies[idx]?.title || 'Featured Film';

          // Cast collaborators
          (creditObj.cast || []).slice(0, 10).forEach((actor) => {
            if (actor.id === currentPersonId) return;
            if (!map.has(actor.id)) {
              map.set(actor.id, {
                id: actor.id,
                name: actor.name,
                profileUrl: actor.profileUrl,
                role: actor.character ? `Co-star (${actor.character})` : 'Actor',
                count: 1,
                sharedTitles: [movieTitle],
              });
            } else {
              const existing = map.get(actor.id)!;
              existing.count += 1;
              if (!existing.sharedTitles.includes(movieTitle)) {
                existing.sharedTitles.push(movieTitle);
              }
            }
          });

          // Key creative leads
          (creditObj.crew || []).forEach((crewLead) => {
            if (crewLead.id === currentPersonId) return;
            if (['Director', 'Original Music Composer', 'Director of Photography', 'Producer'].includes(crewLead.job)) {
              if (!map.has(crewLead.id)) {
                map.set(crewLead.id, {
                  id: crewLead.id,
                  name: crewLead.name,
                  profileUrl: crewLead.profileUrl,
                  role: crewLead.job,
                  count: 1,
                  sharedTitles: [movieTitle],
                });
              } else {
                const existing = map.get(crewLead.id)!;
                existing.count += 1;
                if (!existing.sharedTitles.includes(movieTitle)) {
                  existing.sharedTitles.push(movieTitle);
                }
              }
            }
          });
        });

        // Retain verified collaborators who appeared in 2 or more top projects
        const verified = Array.from(map.values())
          .filter((c) => c.count >= 2)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        setCollaborators(verified);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [popularWorks, person]);

  // Franchise connections derived from verified TMDB universes
  const franchiseConnections = useMemo(() => {
    if (!allCreditsList || allCreditsList.length === 0) return [];
    const universes = new Map<string, { universeId: string; name: string; count: number; titles: string[] }>();

    for (const item of allCreditsList) {
      const match = TMDB_TO_UNIVERSE_MAP[item.id];
      if (match) {
        if (!universes.has(match.universeId)) {
          universes.set(match.universeId, {
            universeId: match.universeId,
            name: match.universeName,
            count: 1,
            titles: [item.title],
          });
        } else {
          const entry = universes.get(match.universeId)!;
          entry.count += 1;
          if (!entry.titles.includes(item.title)) {
            entry.titles.push(item.title);
          }
        }
      }
    }

    return Array.from(universes.values());
  }, [allCreditsList]);

  // Upcoming Projects (verified future release dates)
  const upcomingProjects = useMemo(() => {
    if (!allCreditsList || allCreditsList.length === 0) return [];
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    return allCreditsList
      .filter((m) => (m.releaseDate && m.releaseDate > today) || (m.year && m.year > currentYear))
      .sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || ''));
  }, [allCreditsList]);

  // Career milestones
  const careerMilestones = useMemo(() => {
    if (!allCreditsList || allCreditsList.length === 0) return null;
    const currentYear = new Date().getFullYear();
    const releasedCredits = allCreditsList.filter(
      (m) => m.year && m.year > 1920 && m.year <= currentYear
    );
    if (releasedCredits.length === 0) return null;

    const chronological = [...releasedCredits].sort((a, b) => (a.year || 0) - (b.year || 0));
    const debut = chronological[0];
    const latest = chronological[chronological.length - 1];

    const highestRated = [...releasedCredits]
      .filter((m) => (m.voteCount || 0) >= 100)
      .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))[0] || chronological[chronological.length - 1];

    const spanYears = debut.year && latest.year ? latest.year - debut.year + 1 : null;

    return {
      debut,
      latest,
      highestRated,
      spanYears,
    };
  }, [allCreditsList]);

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
      list = list.filter((item) => 
        item.title.toLowerCase().includes(q) || 
        (item.character && item.character.toLowerCase().includes(q)) ||
        (item.job && item.job.toLowerCase().includes(q))
      );
    }

    // Apply sorting
    const sorted = [...list];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const dateA = a.releaseDate || (a.year ? `${a.year}-01-01` : '');
        const dateB = b.releaseDate || (b.year ? `${b.year}-01-01` : '');
        return dateB.localeCompare(dateA);
      });
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => {
        const dateA = a.releaseDate || (a.year ? `${a.year}-01-01` : '');
        const dateB = b.releaseDate || (b.year ? `${b.year}-01-01` : '');
        return dateA.localeCompare(dateB);
      });
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    } else {
      // Default: popularity
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return sorted;
  }, [credits, allCreditsList, activeFilter, sortBy, filterSearch]);

  // Convert PersonCreditItem to Movie model for MovieCard
  const creditToMovie = (item: PersonCreditItem): Movie => {
    return {
      id: String(item.id),
      tmdbId: item.id,
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      year: item.year || 2024,
      duration: item.mediaType === 'tv' ? 'TV Series' : 'Feature',
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
        text: `Explore ${person.name}'s verified filmography, career highlights, and biography on Movie Verse.`,
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
          <p className="text-xs text-neutral-400">Resolving verified TMDB credits, biography, and filmography</p>
        </div>
      </div>
    );
  }

  if (hasError || !person) {
    return (
      <div className="w-full max-w-2xl mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#2A0F05] border border-red-500/30 flex items-center justify-center text-[#F88F22]">
          <User className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Profile Archive Unavailable</h2>
          <p className="text-xs text-neutral-400 max-w-sm">
            Could not retrieve person credits for ID #{personId}. Please verify your connection or return to movies.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl sunset-gradient-btn text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          Return to Previous Screen
        </button>
      </div>
    );
  }

  // Choose the best backdrop: prefer widescreen movie backdrop from top popular work, or profile image
  const heroBackdrop = popularWorks.find((m) => m.backdropUrl)?.backdropUrl || 
                       allCreditsList.find((m) => m.backdropUrl)?.backdropUrl || 
                       person.profileUrl;

  const formattedBirthday = formatBirthDate(person.birthday);
  const formattedDeathday = formatBirthDate(person.deathday);

  // Short 1-2 sentence biographical excerpt for the identity header
  const bioSummary = person.biography
    ? person.biography.split(/(?<=[.?!])\s+/)[0]?.slice(0, 160)
    : null;

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-16">
      
      {/* 1. Top Navigation Bar with Back Button, Title Anchor, and Share */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-2 border-b border-[#F88F22]/15">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
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
          className="w-9 h-9 rounded-xl bg-[#1A0B05] hover:bg-[#281308] border border-[#F88F22]/25 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title={copiedShare ? 'Link copied!' : 'Share profile'}
          aria-label="Share person profile"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. CINEMATIC HERO SECTION — THE MOST IMPORTANT DESIGN */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-[#140804] border border-[#F88F22]/25 shadow-2xl">
        
        {/* Atmospheric Backdrop Cover Artwork */}
        <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 overflow-hidden bg-[#0A0402]">
          {heroBackdrop && (
            <img
              src={heroBackdrop}
              alt={person.name}
              className="w-full h-full object-cover object-center filter blur-[1.5px] scale-105 opacity-35 sm:opacity-40"
              loading="eager"
              decoding="async"
            />
          )}

          {/* Deep Translucent Gradient Scrims blending smoothly into #0A0402 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#140804] via-[#140804]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#140804] via-transparent to-[#140804]/80" />

          {/* Subtle Sunset Orange & Golden-Yellow Ambient Lighting */}
          <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#EA6113]/25 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-[#FBB931]/15 blur-3xl pointer-events-none" />
        </div>

        {/* Overlapping Main Circular Portrait & Identity Area */}
        <div className="relative px-5 sm:px-8 pb-6 sm:pb-8 -mt-16 sm:-mt-20 md:-mt-24 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 text-center sm:text-left z-10">
          
          {/* Main Circular Profile Portrait with Glowing Border */}
          <div className="relative shrink-0">
            {/* Soft, noticeable orange/yellow glow behind the circle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#EA6113] via-[#F88F22] to-[#FBB931] blur-md opacity-80" />
            
            {/* Glowing circular container */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-tr from-[#EA6113] via-[#F88F22] to-[#FBB931] shadow-[0_0_32px_rgba(234,97,19,0.55)]">
              <img
                src={portraitFailed ? tmdbService.getOptimizedProfileUrl(null, 'w500', person.name) : (person.profileUrl || tmdbService.getOptimizedProfileUrl(person.profilePath, 'w500', person.name))}
                alt={person.name}
                onError={() => setPortraitFailed(true)}
                className="w-full h-full rounded-full object-cover bg-[#1A0B05]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          {/* Identity Information */}
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
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

            {/* Short Bio Teaser Excerpt (when available) */}
            {bioSummary && (
              <p className="text-xs text-neutral-300 italic max-w-2xl line-clamp-2 pt-0.5 opacity-90">
                "{bioSummary}..."
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. PERSONAL DETAILS — COMPACT GLASS INFORMATION CARDS (Strictly Factual) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        
        {/* Date of Birth */}
        {formattedBirthday && (
          <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#F88F22]" />
              <span>Born</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-white truncate" title={formattedBirthday}>
              {formattedBirthday}
            </p>
          </div>
        )}

        {/* Current Age or Passed Age */}
        {ageInfo && (
          <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FBB931]" />
              <span>{ageInfo.isDeceased ? 'Passed At' : 'Age'}</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-white truncate" title={ageInfo.label}>
              {ageInfo.label}
            </p>
          </div>
        )}

        {/* Place of Birth */}
        {person.placeOfBirth && (
          <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#F88F22]" />
              <span>Birthplace</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-white truncate" title={person.placeOfBirth}>
              {person.placeOfBirth}
            </p>
          </div>
        )}

        {/* Known For Department */}
        {person.knownForDepartment && (
          <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Clapperboard className="w-3 h-3 text-[#FBB931]" />
              <span>Discipline</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-white truncate">
              {person.knownForDepartment}
            </p>
          </div>
        )}

        {/* Total Productions */}
        {allCreditsList.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-[#F88F22]/20 space-y-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-[#F88F22]" />
              <span>Total Credits</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-white truncate">
              {allCreditsList.length} Productions
            </p>
          </div>
        )}

        {/* Date of Death (if deceased) */}
        {formattedDeathday && (
          <div className="p-3.5 rounded-2xl bg-[#160B05]/80 border border-red-500/25 space-y-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-[#EA6113]" />
              <span>Date of Passing</span>
            </span>
            <p className="text-xs sm:text-sm font-bold text-neutral-200 truncate" title={formattedDeathday}>
              {formattedDeathday}
            </p>
          </div>
        )}

        {/* External IMDb Directory Link */}
        {person.imdbId && (
          <a
            href={`https://www.imdb.com/name/${person.imdbId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-[#160B05]/80 hover:bg-[#220F06] border border-[#F88F22]/20 hover:border-[#FBB931]/40 space-y-1 shadow-sm transition-all group/imdb cursor-pointer block"
            title="View verified IMDb record"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1">
              <span>IMDb Reference</span>
              <ExternalLink className="w-3 h-3 text-[#F88F22] group-hover/imdb:translate-x-0.5 transition-transform" />
            </span>
            <p className="text-xs sm:text-sm font-bold text-white truncate">
              External Directory &rarr;
            </p>
          </a>
        )}
      </div>

      {/* 4. BIOGRAPHY SECTION */}
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
                className="text-xs font-bold text-[#F88F22] hover:text-[#FBB931] cursor-pointer transition-colors pt-1 inline-flex items-center gap-1"
              >
                <span>{isBioExpanded ? 'Show less' : 'Read full biography'}</span>
                <span>&rarr;</span>
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

      {/* 5. POPULAR WORKS — BEAUTIFUL HORIZONTAL MOVIE CARDS */}
      {popularWorks.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#EA6113]" />
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
                  <div key={`pop-${item.id}-${item.character || item.job}`} className="w-[125px] sm:w-[145px] md:w-[165px] shrink-0 flex flex-col space-y-1">
                    <MovieCard
                      movie={movieObj}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movieObj.id)}
                      onToggleWatchlist={onToggleWatchlist}
                      onOpenTrailer={onOpenTrailer}
                      onOpenWatch={onOpenWatch}
                      showUniverseTag={false}
                    />
                    {(item.character || item.job) && (
                      <span className="text-[10px] text-neutral-400 truncate px-0.5 font-medium">
                        {item.character ? `as ${item.character}` : item.job}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. CAREER TIMELINE & MILESTONES (Real Chronological Records) */}
      {careerMilestones && (
        <section className="p-5 sm:p-6 rounded-3xl bg-[#140804]/80 border border-[#F88F22]/20 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#FBB931]" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Career Milestones
              </h3>
            </div>
            {careerMilestones.spanYears && (
              <span className="text-xs font-semibold text-[#FFE3B3] px-2.5 py-0.5 rounded-full bg-[#EA6113]/20 border border-[#EA6113]/30">
                {careerMilestones.spanYears} Years in Cinema
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Earliest Debut */}
            {careerMilestones.debut && (
              <button
                type="button"
                onClick={() => onSelectMovie(creditToMovie(careerMilestones.debut))}
                className="p-3.5 rounded-2xl bg-[#1A0B05] hover:bg-[#251208] border border-white/10 hover:border-[#F88F22]/40 text-left transition-all group/milestone cursor-pointer space-y-1"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#F88F22] flex items-center gap-1">
                  <span>Earliest Credit</span>
                  <span className="text-neutral-500">· {careerMilestones.debut.year}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover/milestone:text-[#FFE3B3] truncate">
                  {careerMilestones.debut.title}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {careerMilestones.debut.character ? `as ${careerMilestones.debut.character}` : careerMilestones.debut.job || 'Credited'}
                </div>
              </button>
            )}

            {/* Peak Acclaim */}
            {careerMilestones.highestRated && (
              <button
                type="button"
                onClick={() => onSelectMovie(creditToMovie(careerMilestones.highestRated))}
                className="p-3.5 rounded-2xl bg-[#1A0B05] hover:bg-[#251208] border border-white/10 hover:border-[#FBB931]/40 text-left transition-all group/milestone cursor-pointer space-y-1"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#FBB931] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>Top Rated Production</span>
                  <span className="text-neutral-500">· {careerMilestones.highestRated.year}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover/milestone:text-[#FFE3B3] truncate">
                  {careerMilestones.highestRated.title}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {careerMilestones.highestRated.voteAverage ? `${careerMilestones.highestRated.voteAverage.toFixed(1)} Rating` : 'Acclaimed'}
                </div>
              </button>
            )}

            {/* Most Recent Work */}
            {careerMilestones.latest && (
              <button
                type="button"
                onClick={() => onSelectMovie(creditToMovie(careerMilestones.latest))}
                className="p-3.5 rounded-2xl bg-[#1A0B05] hover:bg-[#251208] border border-white/10 hover:border-[#EA6113]/40 text-left transition-all group/milestone cursor-pointer space-y-1"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#EA6113] flex items-center gap-1">
                  <span>Recent Work</span>
                  <span className="text-neutral-500">· {careerMilestones.latest.year}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover/milestone:text-[#FFE3B3] truncate">
                  {careerMilestones.latest.title}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {careerMilestones.latest.character ? `as ${careerMilestones.latest.character}` : careerMilestones.latest.job || 'Credited'}
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      {/* 7. FREQUENT COLLABORATORS (Ground in Real TMDB Data Only) */}
      {collaborators.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F88F22]" />
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Frequent Collaborators
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              Recurring creative partners
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            {collaborators.map((collab) => (
              <button
                key={collab.id}
                type="button"
                onClick={() => onSelectPerson && onSelectPerson(collab.id)}
                className="p-3 rounded-2xl bg-[#170C06] hover:bg-[#251309] border border-[#F88F22]/20 hover:border-[#FBB931]/40 flex items-center gap-3 text-left transition-all active:scale-95 group/collab cursor-pointer shadow-sm"
                title={`View ${collab.name}'s profile`}
              >
                {/* Glowing Circular Avatar */}
                <div className="relative shrink-0 w-11 h-11">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#EA6113] to-[#FBB931] blur-[3px] opacity-40 group-hover/collab:opacity-85 transition-opacity" />
                  <img
                    src={collab.profileUrl || tmdbService.getOptimizedProfileUrl(null, 'w185', collab.name)}
                    alt={collab.name}
                    className="relative w-full h-full rounded-full object-cover border border-[#F88F22]/40 bg-[#140804]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white group-hover/collab:text-[#FFE3B3] truncate block">
                    {collab.name}
                  </span>
                  <span className="text-[10px] text-[#FBB931] font-semibold truncate block">
                    {collab.count} Shared Titles
                  </span>
                  <span className="text-[9px] text-neutral-400 truncate block">
                    {collab.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 8. FRANCHISE CONNECTIONS (Verified TMDB Universes) */}
      {franchiseConnections.length > 0 && (
        <section className="p-5 sm:p-6 rounded-3xl bg-[#140804]/80 border border-[#F88F22]/20 space-y-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FBB931]" />
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Franchise & Universe Contributions
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {franchiseConnections.map((univ) => (
              <div
                key={univ.universeId}
                className="p-3.5 rounded-2xl bg-[#190C05] border border-[#F88F22]/25 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#FFE3B3] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#EA6113]" />
                    <span>{univ.name}</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#FBB931] px-2 py-0.5 rounded-full bg-[#EA6113]/20 border border-[#EA6113]/30">
                    {univ.count} Titles
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate">
                  Contributions: {univ.titles.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. UPCOMING PROJECTS (Only when reliable upcoming credits exist) */}
      {upcomingProjects.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F88F22]" />
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Upcoming Projects
              </h3>
            </div>
            <span className="text-xs text-[#FFE3B3]">
              In development & future releases
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {upcomingProjects.map((item) => {
              const movieObj = creditToMovie(item);
              return (
                <div key={`upcoming-${item.id}`} className="space-y-1.5">
                  <MovieCard
                    movie={movieObj}
                    onSelectMovie={onSelectMovie}
                    isWatchlisted={watchlist.includes(movieObj.id)}
                    onToggleWatchlist={onToggleWatchlist}
                    onOpenTrailer={onOpenTrailer}
                    onOpenWatch={onOpenWatch}
                    showUniverseTag={false}
                  />
                  <div className="px-1 text-[10px] text-[#FBB931] font-semibold flex items-center justify-between">
                    <span>{item.releaseDate ? `Target: ${item.releaseDate}` : 'Upcoming'}</span>
                    <span>{item.character || item.job}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 10. COMPLETE FILMOGRAPHY */}
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
              <option value="oldest">Oldest</option>
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
              onClick={() => setVisibleCount((prev) => prev + 18)}
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
