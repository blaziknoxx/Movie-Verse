import { WhereToWatchSite } from '../types/movie';
import { WHERE_TO_WATCH_DIRECTORY } from '../data/moviesData';

const WATCHLIST_KEY = 'movieverse_watchlist_v1';
const WATCHED_KEY = 'movieverse_watched_v1';
const RECENT_KEY = 'movieverse_recent_v1';
const CUSTOM_SITES_KEY = 'movieverse_custom_sites_v1';
const WATCH_ORDER_PROGRESS_KEY = 'movieverse_watch_order_progress_v1';

export const storageService = {
  getWatchlist(): string[] {
    try {
      const data = localStorage.getItem(WATCHLIST_KEY);
      return data ? JSON.parse(data) : ['dune-part-2', 'the-batman'];
    } catch {
      return ['dune-part-2', 'the-batman'];
    }
  },

  toggleWatchlist(movieId: string): string[] {
    const list = this.getWatchlist();
    const updated = list.includes(movieId)
      ? list.filter(id => id !== movieId)
      : [movieId, ...list];
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    return updated;
  },

  getWatched(): string[] {
    try {
      const data = localStorage.getItem(WATCHED_KEY);
      return data ? JSON.parse(data) : ['dune-part-1', 'inception', 'the-dark-knight'];
    } catch {
      return ['dune-part-1', 'inception', 'the-dark-knight'];
    }
  },

  toggleWatched(movieId: string): string[] {
    const list = this.getWatched();
    const updated = list.includes(movieId)
      ? list.filter(id => id !== movieId)
      : [movieId, ...list];
    try {
      localStorage.setItem(WATCHED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    return updated;
  },

  getRecentMovies(): string[] {
    try {
      const data = localStorage.getItem(RECENT_KEY);
      return data ? JSON.parse(data) : ['dune-part-2', 'the-batman', 'interstellar'];
    } catch {
      return ['dune-part-2', 'the-batman', 'interstellar'];
    }
  },

  addRecentMovie(movieId: string): string[] {
    const list = this.getRecentMovies();
    const updated = [movieId, ...list.filter(id => id !== movieId)].slice(0, 10);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
    return updated;
  },

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
    const custom = this.getCustomSites();
    return [...custom, ...WHERE_TO_WATCH_DIRECTORY];
  },

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
  }
};
