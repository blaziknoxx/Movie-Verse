/**
 * Movie Verse — Storage Service
 * Developer — Estiaq Mehedi
 * Manages local persistence for watchlist, watched history, recent movies, and genuine movie cache.
 * Cleans up legacy demo storage entries so fake data never reappears on reload.
 */

import { Movie, WhereToWatchSite } from '../types/movie';
import { WHERE_TO_WATCH_DIRECTORY } from '../data/moviesData';

const WATCHLIST_KEY = 'movieverse_watchlist_v2';
const WATCHED_KEY = 'movieverse_watched_v2';
const RECENT_KEY = 'movieverse_recent_v2';
const CUSTOM_SITES_KEY = 'movieverse_custom_sites_v2';
const WATCH_ORDER_PROGRESS_KEY = 'movieverse_watch_order_progress_v2';
const MOVIE_CACHE_KEY = 'movieverse_cached_movies_v2';

// Known legacy demo IDs that were erroneously pre-seeded
const LEGACY_DEMO_IDS = new Set([
  'dune-part-2',
  'dune-part-1',
  'dune-prophecy',
  'the-batman',
  'the-dark-knight',
  'the-penguin',
  'interstellar',
  'oppenheimer',
  'inception',
  'john-wick-4',
  'blade-runner-1982',
  'blade-runner-2049',
  'batman-begins'
]);

function purgeLegacyDemoEntries() {
  try {
    // Clean up v1 keys if they were left over
    localStorage.removeItem('movieverse_watchlist_v1');
    localStorage.removeItem('movieverse_watched_v1');
    localStorage.removeItem('movieverse_recent_v1');
  } catch {
    // ignore
  }
}

// Run purge once on initialization
purgeLegacyDemoEntries();

export const storageService = {
  // -------------------------------------------------------------
  // Movie Object Cache (preserves genuine movie metadata across reloads)
  // -------------------------------------------------------------
  getCachedMovie(id: string | number): Movie | undefined {
    try {
      const data = localStorage.getItem(MOVIE_CACHE_KEY);
      if (!data) return undefined;
      const cache: Record<string, Movie> = JSON.parse(data);
      return cache[String(id)];
    } catch {
      return undefined;
    }
  },

  saveCachedMovie(movie: Movie): void {
    if (!movie || !movie.id) return;
    try {
      const data = localStorage.getItem(MOVIE_CACHE_KEY);
      const cache: Record<string, Movie> = data ? JSON.parse(data) : {};
      cache[String(movie.id)] = movie;
      if (movie.tmdbId) {
        cache[String(movie.tmdbId)] = movie;
      }
      // Keep cache size bounded to last 100 movies
      const keys = Object.keys(cache);
      if (keys.length > 100) {
        delete cache[keys[0]];
      }
      localStorage.setItem(MOVIE_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Failed to cache movie:', e);
    }
  },

  saveMultipleCachedMovies(movies: Movie[]): void {
    if (!Array.isArray(movies) || movies.length === 0) return;
    try {
      const data = localStorage.getItem(MOVIE_CACHE_KEY);
      const cache: Record<string, Movie> = data ? JSON.parse(data) : {};
      for (const m of movies) {
        if (m && m.id) {
          cache[String(m.id)] = m;
          if (m.tmdbId) cache[String(m.tmdbId)] = m;
        }
      }
      localStorage.setItem(MOVIE_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Failed to cache movies:', e);
    }
  },

  // -------------------------------------------------------------
  // Watchlist (Defaults to genuine empty list, NO demo movies)
  // -------------------------------------------------------------
  getWatchlist(): string[] {
    try {
      const data = localStorage.getItem(WATCHLIST_KEY);
      if (!data) return [];
      const parsed: string[] = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  toggleWatchlist(movieId: string, movieObj?: Movie): string[] {
    const list = this.getWatchlist();
    const updated = list.includes(movieId)
      ? list.filter(id => id !== movieId)
      : [movieId, ...list];
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    if (movieObj) {
      this.saveCachedMovie(movieObj);
    }
    return updated;
  },

  // -------------------------------------------------------------
  // Watched History (Defaults to genuine empty list, NO demo movies)
  // -------------------------------------------------------------
  getWatched(): string[] {
    try {
      const data = localStorage.getItem(WATCHED_KEY);
      if (!data) return [];
      const parsed: string[] = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  toggleWatched(movieId: string, movieObj?: Movie): string[] {
    const list = this.getWatched();
    const updated = list.includes(movieId)
      ? list.filter(id => id !== movieId)
      : [movieId, ...list];
    try {
      localStorage.setItem(WATCHED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    if (movieObj) {
      this.saveCachedMovie(movieObj);
    }
    return updated;
  },

  // -------------------------------------------------------------
  // Recent Movies History (Defaults to genuine empty list)
  // -------------------------------------------------------------
  getRecentMovies(): string[] {
    try {
      const data = localStorage.getItem(RECENT_KEY);
      if (!data) return [];
      const parsed: string[] = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addRecentMovie(movieId: string, movieObj?: Movie): string[] {
    const list = this.getRecentMovies();
    const updated = [movieId, ...list.filter(id => id !== movieId)].slice(0, 15);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    if (movieObj) {
      this.saveCachedMovie(movieObj);
    }
    return updated;
  },

  // -------------------------------------------------------------
  // Where to Watch Directory Sites
  // -------------------------------------------------------------
  getCustomSites(): WhereToWatchSite[] {
    try {
      const data = localStorage.getItem(CUSTOM_SITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomSite(site: WhereToWatchSite): WhereToWatchSite[] {
    const existing = this.getCustomSites();
    const updated = [site, ...existing.filter(s => s.id !== site.id)];
    try {
      localStorage.setItem(CUSTOM_SITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    return updated;
  },

  deleteCustomSite(siteId: string): WhereToWatchSite[] {
    const existing = this.getCustomSites();
    const updated = existing.filter(s => s.id !== siteId);
    try {
      localStorage.setItem(CUSTOM_SITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    return updated;
  },

  getAllSites(): WhereToWatchSite[] {
    const custom = this.getCustomSites().filter(s => s.isCustom && s.id !== 'site-hdhub4u' && s.id !== 'site-movielinkbd');
    return [...custom, ...WHERE_TO_WATCH_DIRECTORY];
  },

  // -------------------------------------------------------------
  // Watch Order Progress
  // -------------------------------------------------------------
  getWatchOrderProgress(orderId: string): string[] {
    try {
      const data = localStorage.getItem(WATCH_ORDER_PROGRESS_KEY);
      const map = data ? JSON.parse(data) : {};
      return map[orderId] || [];
    } catch {
      return [];
    }
  },

  toggleWatchOrderProgress(orderId: string, movieId: string): string[] {
    try {
      const data = localStorage.getItem(WATCH_ORDER_PROGRESS_KEY);
      const map = data ? JSON.parse(data) : {};
      const currentList: string[] = map[orderId] || [];
      const updatedList = currentList.includes(movieId)
        ? currentList.filter(id => id !== movieId)
        : [...currentList, movieId];
      map[orderId] = updatedList;
      localStorage.setItem(WATCH_ORDER_PROGRESS_KEY, JSON.stringify(map));
      return updatedList;
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------
  // CineProfile & Personal Customization
  // -------------------------------------------------------------
  getProfile(): {
    displayName: string;
    avatarId: string;
    bio?: string;
    preferredStreamingProvider: 'all' | 'hdhub4u' | 'movielinkbd';
    showTransparencyNotice: boolean;
    joinedTimestamp: number;
  } {
    const DEFAULT_PROFILE = {
      displayName: 'Cinephile',
      avatarId: 'arachnid-hero',
      bio: 'Exploring cinematic lore, narrative genealogy, and atmospheric cinema across universes.',
      preferredStreamingProvider: 'all' as const,
      showTransparencyNotice: true,
      joinedTimestamp: 1718000000000 // Stable client baseline
    };

    try {
      const data = localStorage.getItem('movieverse_profile_v2');
      if (!data) return DEFAULT_PROFILE;
      const parsed = JSON.parse(data);
      return { ...DEFAULT_PROFILE, ...parsed };
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: any): void {
    try {
      localStorage.setItem('movieverse_profile_v2', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  },

  // -------------------------------------------------------------
  // Custom Collections
  // -------------------------------------------------------------
  getCollections(): {
    id: string;
    name: string;
    description: string;
    movieIds: string[];
    createdAt: number;
    colorAccent?: string;
  }[] {
    try {
      const data = localStorage.getItem('movieverse_collections_v2');
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveCollection(col: {
    id: string;
    name: string;
    description: string;
    movieIds: string[];
    createdAt: number;
    colorAccent?: string;
  }): void {
    const list = this.getCollections();
    const existingIndex = list.findIndex(c => c.id === col.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = col;
    } else {
      updated = [col, ...list];
    }
    try {
      localStorage.setItem('movieverse_collections_v2', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save collection:', e);
    }
  },

  deleteCollection(id: string): void {
    const list = this.getCollections().filter(c => c.id !== id);
    try {
      localStorage.setItem('movieverse_collections_v2', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to delete collection:', e);
    }
  },

  addMovieToCollection(collectionId: string, movieId: string): void {
    const list = this.getCollections();
    const col = list.find(c => c.id === collectionId);
    if (!col) return;
    if (!col.movieIds.includes(movieId)) {
      col.movieIds = [movieId, ...col.movieIds];
      this.saveCollection(col);
    }
  },

  removeMovieFromCollection(collectionId: string, movieId: string): void {
    const list = this.getCollections();
    const col = list.find(c => c.id === collectionId);
    if (!col) return;
    col.movieIds = col.movieIds.filter(id => id !== movieId);
    this.saveCollection(col);
  },

  // -------------------------------------------------------------
  // Cache Management & Backup Export / Import
  // -------------------------------------------------------------
  getCachedMoviesCount(): number {
    try {
      const data = localStorage.getItem(MOVIE_CACHE_KEY);
      if (!data) return 0;
      const cache = JSON.parse(data);
      return Object.keys(cache).length;
    } catch {
      return 0;
    }
  },

  clearMovieCache(): void {
    try {
      localStorage.removeItem(MOVIE_CACHE_KEY);
    } catch (e) {
      console.warn('Failed to clear movie cache:', e);
    }
  },

  exportBackupJSON(): string {
    const exportObject = {
      version: 2,
      exportDate: new Date().toISOString(),
      profile: this.getProfile(),
      watchlist: this.getWatchlist(),
      watched: this.getWatched(),
      recentMovieIds: this.getRecentMovies(),
      collections: this.getCollections(),
      customSites: this.getCustomSites()
    };
    return JSON.stringify(exportObject, null, 2);
  },

  importBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) this.saveProfile(parsed.profile);
      if (Array.isArray(parsed.watchlist)) {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(parsed.watchlist));
      }
      if (Array.isArray(parsed.watched)) {
        localStorage.setItem(WATCHED_KEY, JSON.stringify(parsed.watched));
      }
      if (Array.isArray(parsed.recentMovieIds)) {
        localStorage.setItem(RECENT_KEY, JSON.stringify(parsed.recentMovieIds));
      }
      if (Array.isArray(parsed.collections)) {
        localStorage.setItem('movieverse_collections_v2', JSON.stringify(parsed.collections));
      }
      if (Array.isArray(parsed.customSites)) {
        localStorage.setItem(CUSTOM_SITES_KEY, JSON.stringify(parsed.customSites));
      }
      return true;
    } catch (e) {
      console.error('Failed to parse backup JSON:', e);
      return false;
    }
  }
};
