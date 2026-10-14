import React, { useState, useEffect, useRef } from 'react';
import { WhereToWatchSite, SiteCategory, Movie } from '../../types/movie';
import { storageService } from '../../services/storageService';
import { tmdbService } from '../../services/tmdbService';
import { MOVIES } from '../../data/moviesData';
import { WhereToWatchCard } from './WhereToWatchCard';
import { 
  Tv, ExternalLink, Search, Plus, CheckCircle, ShieldAlert, 
  Trash2, Filter, Globe, Sparkles, X, Info, Shield, Compass, 
  ArrowUpRight, Film, Star, RotateCcw, Loader2, Check
} from 'lucide-react';

interface WhereToWatchViewProps {
  initialMovieId?: string | null;
  onSelectMovie?: (movie: Movie) => void;
}

const QUICK_TEST_MOVIES = [
  { id: '157336', title: 'Interstellar', year: 2014 },
  { id: '693134', title: 'Dune: Part Two', year: 2024 },
  { id: '155', title: 'The Dark Knight', year: 2008 },
  { id: '569094', title: 'Spider-Man: Across the Spider-Verse', year: 2023 },
  { id: '335984', title: 'Blade Runner 2049', year: 2017 }
];

export const WhereToWatchView: React.FC<WhereToWatchViewProps> = ({
  initialMovieId,
  onSelectMovie
}) => {
  const [sites, setSites] = useState<WhereToWatchSite[]>(() => storageService.getAllSites());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Active movie for movie-specific recommendations
  const [activeMovie, setActiveMovie] = useState<Movie | null>(() => {
    if (initialMovieId) {
      const cached = storageService.getCachedMovie(initialMovieId);
      if (cached) return cached;
    }
    // Default to first catalog movie (e.g. Dune: Part Two or Interstellar)
    return MOVIES[0] || null;
  });

  const [isLoadingMovie, setIsLoadingMovie] = useState(false);
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState<Movie[]>([]);
  const [isSearchingMovie, setIsSearchingMovie] = useState(false);
  const [showMovieSearch, setShowMovieSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form states for adding custom site
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<SiteCategory>('Movie Discovery and Availability Guides');
  const [formDescription, setFormDescription] = useState('');
  const [formAvailability, setFormAvailability] = useState('');
  const [formRegion, setFormRegion] = useState('Global');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  // Handle initialMovieId updates
  useEffect(() => {
    if (!initialMovieId) return;

    const cached = storageService.getCachedMovie(initialMovieId);
    if (cached) {
      setActiveMovie(cached);
      return;
    }

    const cleanId = String(initialMovieId).replace(/\D/g, '');
    if (cleanId) {
      setIsLoadingMovie(true);
      tmdbService.getMovieDetails(cleanId)
        .then(details => {
          if (details) {
            setActiveMovie(details);
            storageService.saveCachedMovie(details);
          }
        })
        .catch(err => {
          console.warn('[WhereToWatchView] Failed to load details for initial movie:', err);
        })
        .finally(() => {
          setIsLoadingMovie(false);
        });
    }
  }, [initialMovieId]);

  // Live movie catalog search for testing any title
  useEffect(() => {
    if (!movieSearchQuery.trim()) {
      setMovieSearchResults([]);
      setIsSearchingMovie(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearchingMovie(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await tmdbService.searchMovies(movieSearchQuery.trim());
        setMovieSearchResults(results.movies.slice(0, 6));
      } catch (err) {
        console.error('[WhereToWatchView] Movie search error:', err);
        // Fallback to local catalog filter
        const queryLower = movieSearchQuery.toLowerCase();
        const localMatches = MOVIES.filter(m => m.title.toLowerCase().includes(queryLower));
        setMovieSearchResults(localMatches);
      } finally {
        setIsSearchingMovie(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [movieSearchQuery]);

  const handleSelectQuickMovie = async (item: { id: string; title: string; year: number }) => {
    setIsLoadingMovie(true);
    setShowMovieSearch(false);
    try {
      // Check cache first
      const cached = storageService.getCachedMovie(item.id);
      if (cached) {
        setActiveMovie(cached);
        return;
      }
      // Check static catalog
      const local = MOVIES.find(m => String(m.tmdbId) === item.id || m.id === item.id);
      if (local) {
        setActiveMovie(local);
        return;
      }
      // Fetch live details
      const details = await tmdbService.getMovieDetails(item.id);
      if (details) {
        setActiveMovie(details);
        storageService.saveCachedMovie(details);
      }
    } catch (err) {
      console.warn('[WhereToWatchView] Could not fetch quick movie:', err);
      // Check static curated catalog before minimal fallback
      const catalogMatch = MOVIES.find(m => String(m.tmdbId) === item.id);
      if (catalogMatch) {
        setActiveMovie(catalogMatch);
      } else {
        setActiveMovie({
          id: item.id,
          tmdbId: Number(item.id),
          title: item.title,
          slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          year: item.year,
          duration: '',
          rating: 0,
          genres: [],
          tagline: '',
          overview: `External streaming directory index for ${item.title} (${item.year}).`,
          director: '',
          cast: [],
          posterUrl: '',
          backdropUrl: '',
          vibeTags: [],
          vibeProfile: {
            darkAtmosphere: 5,
            actionIntensity: 5,
            psychologicalComplexity: 5,
            mysterySuspense: 5,
            emotionalWeight: 5,
            pacing: 'Balanced',
            visualStyle: 'Cinematic'
          },
          streamingPlatforms: [],
          moodIds: []
        });
      }
    } finally {
      setIsLoadingMovie(false);
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesQuery = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery;
  });

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim() || !formDescription.trim()) {
      setFormError('Please fill in the website name, valid URL, and description.');
      return;
    }

    try {
      new URL(formUrl);
    } catch {
      setFormError('Please enter a valid URL (e.g., https://example.com).');
      return;
    }

    const newSite: WhereToWatchSite = {
      id: `custom-${Date.now()}`,
      name: formName.trim(),
      url: formUrl.trim(),
      category: formCategory,
      description: formDescription.trim(),
      availabilityType: formAvailability.trim() || 'Custom Added Platform',
      region: formRegion.trim() || 'Global',
      verified: false,
      userExpectationNote: formNote.trim() || 'Manually added by user to local device directory.',
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updated = storageService.saveCustomSite(newSite);
    setSites([...updated, ...storageService.getAllSites().filter(s => !s.isCustom)]);
    
    // Reset form
    setFormName('');
    setFormUrl('');
    setFormDescription('');
    setFormAvailability('');
    setFormRegion('Global');
    setFormNote('');
    setFormError('');
    setShowAddModal(false);
  };

  const handleDeleteSite = (siteId: string) => {
    storageService.deleteCustomSite(siteId);
    setSites(prev => prev.filter(s => s.id !== siteId));
  };

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Tv className="w-5 h-5 text-[#F88F22]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FBB931]">
              Curated Viewing Directory & Recommendations
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Where to Watch
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
            Curated movie discovery portals, regional guides, and external destination directories. Verified dynamic queries and movie-specific recommendations.
          </p>
        </div>

        {/* Add Custom Website Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl sunset-gradient-btn text-white font-bold text-xs transition-all shrink-0 self-start md:self-end shadow-md hover:shadow-[0_0_16px_rgba(234,97,19,0.5)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Directory Entry</span>
        </button>
      </div>

      {/* ACTIVE MOVIE CONTEXT & DYNAMIC SELECTOR */}
      <section className="relative rounded-3xl p-5 sm:p-6 border border-[#F88F22]/25 bg-gradient-to-br from-[#1C0D06]/95 via-[#140804]/95 to-[#0A0402] shadow-[0_12px_36px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-[#EA6113]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FBB931]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#FBB931]">
                  Active Movie Evaluation Anchor
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Destination cards and recommendations below dynamically evaluate search precision for this movie.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowMovieSearch(!showMovieSearch)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#F88F22]/30 text-white text-xs font-semibold transition-all"
              >
                <Search className="w-3.5 h-3.5 text-[#F88F22]" />
                <span>{showMovieSearch ? 'Close Search' : 'Search Any Movie'}</span>
              </button>

              {activeMovie && (
                <button
                  onClick={() => setActiveMovie(null)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs transition-colors"
                  title="Clear selected movie to view general directory mode"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear (Base Mode)</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Search Bar for any Movie */}
          {showMovieSearch && (
            <div className="p-4 rounded-2xl bg-black/60 border border-[#F88F22]/30 space-y-3 animate-fade-in">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={movieSearchQuery}
                  onChange={(e) => setMovieSearchQuery(e.target.value)}
                  placeholder="Type any movie title (e.g. Oppenheimer, The Matrix, Gladiator)..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#160B05] text-base sm:text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#F88F22] border border-[#F88F22]/30"
                  autoFocus
                />
                {isSearchingMovie && (
                  <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FBB931] animate-spin" />
                )}
              </div>

              {movieSearchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {movieSearchResults.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveMovie(m);
                        storageService.saveCachedMovie(m);
                        setShowMovieSearch(false);
                        setMovieSearchQuery('');
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-[#EA6113]/20 border border-white/5 hover:border-[#F88F22]/40 text-left transition-all group"
                    >
                      {m.posterUrl ? (
                        <img src={m.posterUrl} alt={m.title} className="w-9 h-12 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-9 h-12 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                          <Film className="w-4 h-4 text-neutral-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-[#FFE3B3] truncate">
                          {m.title}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {m.year} · {m.genres?.[0] || 'Film'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Movie Summary Banner or Empty Selector */}
          {activeMovie ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E0603]/80 border border-[#F88F22]/20">
              <div className="flex items-center gap-3.5 min-w-0">
                {activeMovie.posterUrl ? (
                  <img
                    src={activeMovie.posterUrl}
                    alt={activeMovie.title}
                    className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-xl shadow-md border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-gradient-to-b from-[#2A1207] to-[#0A0402] border border-white/10 flex items-center justify-center shrink-0">
                    <Film className="w-6 h-6 text-[#F88F22]" />
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white truncate">
                      {activeMovie.title}
                    </h2>
                    <span className="text-xs text-neutral-400 font-semibold shrink-0">
                      ({activeMovie.year})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
                    {activeMovie.rating && (
                      <span className="flex items-center gap-1 text-[#FBB931] font-bold">
                        <Star className="w-3 h-3 fill-[#FBB931]" />
                        <span>{activeMovie.rating.toFixed(1)}</span>
                      </span>
                    )}
                    {activeMovie.genres && activeMovie.genres.length > 0 && (
                      <>
                        <span className="text-neutral-600">·</span>
                        <span className="text-neutral-300 truncate">
                          {activeMovie.genres.slice(0, 3).join(', ')}
                        </span>
                      </>
                    )}
                    {activeMovie.language && (
                      <>
                        <span className="text-neutral-600">·</span>
                        <span className="text-neutral-400 uppercase text-[10px]">
                          Lang: {activeMovie.language}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-1">
                    {activeMovie.tagline || activeMovie.overview}
                  </p>
                </div>
              </div>

              {onSelectMovie && (
                <button
                  onClick={() => onSelectMovie(activeMovie)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold shrink-0 self-start sm:self-center transition-all flex items-center gap-1.5"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#F88F22]" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#0E0603]/80 border border-white/5 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#FBB931] shrink-0" />
                <span>Base directory mode active. Select a movie below to test dynamic recommendation indicators.</span>
              </div>
            </div>
          )}

          {/* Quick Switcher Buttons for Testing at least 3 movies */}
          <div className="pt-1">
            <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-2">
              Quick Test Titles:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_TEST_MOVIES.map(item => {
                const isSelected = activeMovie?.title === item.title;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectQuickMovie(item)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'sunset-gradient-btn text-white font-bold shadow-md shadow-[#EA6113]/30 scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{item.title}</span>
                    <span className="text-[10px] opacity-75">({item.year})</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BRAVE BROWSER INFORMATION CARD */}
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
                A Cleaner Streaming Experience
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#FFE3B3]/90 leading-relaxed pl-0 sm:pl-11">
              "Want fewer intrusive ads while browsing? Try Brave Browser with its built-in Shields protection. Some websites may still show ads or require additional permissions."
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

      {/* Transparency & Legal Notice */}
      <div className="p-4 rounded-2xl bg-[#140A05]/80 border border-[#F88F22]/15 flex items-start gap-3 text-xs text-neutral-300">
        <Info className="w-4 h-4 text-[#FBB931] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>External Directory Notice:</strong> Movie Verse acts as an informational guide. We do not host, broadcast, or store media on our servers. Movie-specific availability is dependent on third-party domains.
        </span>
      </div>

      {/* Search Filter Toolbar for Directory Entries */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter directory entries by name or region..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#180C06] text-base sm:text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#F88F22] border border-[#F88F22]/20 shadow-inner"
        />
      </div>

      {/* PREMIUM GLOWING EXTERNAL-SITE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSites.map((site) => (
          <WhereToWatchCard
            key={site.id}
            site={site}
            movie={activeMovie}
            onDeleteCustomSite={handleDeleteSite}
          />
        ))}
      </div>

      {/* Add Custom Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-[#180C06] text-neutral-200 border border-[#F88F22]/30 shadow-2xl">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Add Directory Platform</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Saved locally to your browser storage.
            </p>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-200 mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSite} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Platform / Website Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Cinema Vault"
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-base sm:text-xs text-white focus:outline-none focus:border-[#F88F22]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Official Website URL *</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-base sm:text-xs text-white focus:outline-none focus:border-[#F88F22]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Description *</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Overview of this catalog..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-base sm:text-xs text-white focus:outline-none focus:border-[#F88F22]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl sunset-gradient-btn text-white font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
