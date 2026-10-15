/**
 * Movie Verse — NexStream Integration Service
 * API Provider: https://api.codespecters.com/
 * Developer: Estiaq Mehedi
 * 
 * Embed URL standards:
 * - Movies: https://api.codespecters.com/embed/movie/{tmdbId}?apikey={NEXSTREAM_API_KEY}
 * - TV:     https://api.codespecters.com/embed/tv/{tmdbId}/{season}/{episode}?apikey={NEXSTREAM_API_KEY}
 * 
 * Strictly utilizes authentic numeric TMDB IDs (never internal slugs or titles).
 * API key is handled securely without console logging or hardcoding.
 */

const STORAGE_KEY = 'movieverse_nexstream_api_key';
export const NEXSTREAM_PROVIDER_BASE = 'https://api.codespecters.com';

class NexStreamService {
  private inMemoryKey: string | null = null;
  private serverFetched = false;
  private listeners: Set<(key: string) => void> = new Set();

  constructor() {
    // 1. Initial attempt from Vite client environment variable
    try {
      const envKey = (import.meta as any).env?.VITE_NEXSTREAM_API_KEY || (import.meta as any).env?.NEXSTREAM_API_KEY;
      if (typeof envKey === 'string' && envKey.trim()) {
        this.inMemoryKey = envKey.trim();
      }
    } catch {
      // ignore
    }

    // 2. Local storage override (user configured)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const local = window.localStorage.getItem(STORAGE_KEY);
        if (local && local.trim()) {
          this.inMemoryKey = local.trim();
        }
      }
    } catch {
      // ignore
    }

    // 3. Asynchronously fetch from server config endpoint if available
    if (typeof window !== 'undefined') {
      this.fetchServerKey().catch(() => {});
    }
  }

  /**
   * Subscribe to API key updates
   */
  subscribe(listener: (key: string) => void): () => void {
    this.listeners.add(listener);
    // Fire immediately with current key
    const current = this.getApiKey();
    if (current) listener(current);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(key: string): void {
    for (const listener of this.listeners) {
      try {
        listener(key);
      } catch (e) {
        console.warn('[NexStream] Listener notification error:', e);
      }
    }
  }

  /**
   * Fetches server-configured NexStream API key.
   */
  async fetchServerKey(): Promise<string | null> {
    if (this.serverFetched && this.inMemoryKey) {
      return this.inMemoryKey;
    }
    this.serverFetched = true;
    try {
      const res = await fetch('/api/config/nexstream');
      if (res.ok) {
        const data: any = await res.json();
        if (data && typeof data.apiKey === 'string' && data.apiKey.trim()) {
          const key = data.apiKey.trim();
          this.inMemoryKey = key;
          // Store in localStorage if none currently saved
          try {
            if (typeof window !== 'undefined' && window.localStorage && !window.localStorage.getItem(STORAGE_KEY)) {
              window.localStorage.setItem(STORAGE_KEY, key);
            }
          } catch {
            // ignore
          }
          this.notify(key);
          return key;
        }
      }
    } catch {
      // Server endpoint not reachable or not configured
    }
    return this.inMemoryKey;
  }

  /**
   * Retrieves current active NexStream API key.
   */
  getApiKey(): string {
    if (this.inMemoryKey && this.inMemoryKey.trim()) {
      return this.inMemoryKey.trim();
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const local = window.localStorage.getItem(STORAGE_KEY);
        if (local && local.trim()) {
          this.inMemoryKey = local.trim();
          return this.inMemoryKey;
        }
      }
    } catch {
      // ignore
    }
    try {
      const envKey = (import.meta as any).env?.VITE_NEXSTREAM_API_KEY || (import.meta as any).env?.NEXSTREAM_API_KEY;
      if (typeof envKey === 'string' && envKey.trim()) {
        this.inMemoryKey = envKey.trim();
        return this.inMemoryKey;
      }
    } catch {
      // ignore
    }
    return '';
  }

  /**
   * Updates or saves user-provided NexStream API key.
   */
  setApiKey(key: string): void {
    const cleaned = key.trim();
    this.inMemoryKey = cleaned || null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (cleaned) {
          window.localStorage.setItem(STORAGE_KEY, cleaned);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
    this.notify(cleaned);
  }

  /**
   * Check if a NexStream API key is available.
   */
  hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Extracts clean numeric TMDB ID from given input.
   * Strictly rejects title strings or non-numeric IDs.
   */
  parseTmdbId(raw: unknown): number | null {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return Math.floor(raw);
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      // Ensure it contains only numeric digits
      if (/^\d+$/.test(trimmed)) {
        const parsed = parseInt(trimmed, 10);
        return parsed > 0 ? parsed : null;
      }
    }
    return null;
  }

  /**
   * Builds the official NexStream embed URL for movies:
   * https://api.codespecters.com/embed/movie/{tmdbId}?apikey={NEXSTREAM_API_KEY}
   */
  buildMovieEmbedUrl(tmdbId: number | string, customKey?: string): string | null {
    const cleanId = this.parseTmdbId(tmdbId);
    if (!cleanId) return null;

    const key = (customKey || this.getApiKey()).trim();
    const keyParam = key ? `?apikey=${encodeURIComponent(key)}` : '';
    return `${NEXSTREAM_PROVIDER_BASE}/embed/movie/${cleanId}${keyParam}`;
  }

  /**
   * Builds the official NexStream embed URL for TV episodes:
   * https://api.codespecters.com/embed/tv/{tmdbId}/{season}/{episode}?apikey={NEXSTREAM_API_KEY}
   */
  buildTvEmbedUrl(
    tmdbId: number | string,
    season: number | string,
    episode: number | string,
    customKey?: string
  ): string | null {
    const cleanId = this.parseTmdbId(tmdbId);
    if (!cleanId) return null;

    const s = Math.max(1, parseInt(String(season), 10) || 1);
    const ep = Math.max(1, parseInt(String(episode), 10) || 1);

    const key = (customKey || this.getApiKey()).trim();
    const keyParam = key ? `?apikey=${encodeURIComponent(key)}` : '';
    return `${NEXSTREAM_PROVIDER_BASE}/embed/tv/${cleanId}/${s}/${ep}${keyParam}`;
  }

  /**
   * Fetches metadata directly from NexStream API for a given TMDB ID.
   * Useful when TMDB proxy is not configured or fails.
   */
  async fetchMetadata(
    tmdbId: number | string,
    isTv = false,
    season = 1,
    episode = 1
  ): Promise<{ title?: string; poster?: string; backdrop?: string; year?: number; overview?: string } | null> {
    const cleanId = this.parseTmdbId(tmdbId);
    if (!cleanId) return null;
    const key = this.getApiKey();
    const endpoint = isTv
      ? `${NEXSTREAM_PROVIDER_BASE}/api/tv/${cleanId}/${season}/${episode}${key ? `?apikey=${encodeURIComponent(key)}` : ''}`
      : `${NEXSTREAM_PROVIDER_BASE}/api/movie/${cleanId}${key ? `?apikey=${encodeURIComponent(key)}` : ''}`;

    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data: any = await res.json();
        if (data && data.meta) {
          return {
            title: data.meta.title,
            poster: data.meta.poster,
            backdrop: data.meta.backdrop || data.meta.poster,
            overview: data.meta.overview,
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export const nexstreamService = new NexStreamService();
