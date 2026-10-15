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

    // 3. Asynchronously attempt to fetch from server config endpoint if available
    if (typeof window !== 'undefined' && !this.inMemoryKey) {
      this.fetchServerKey().catch(() => {});
    }
  }

  /**
   * Fetches server-configured NexStream API key without exposing secret logs.
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
          this.inMemoryKey = data.apiKey.trim();
          return this.inMemoryKey;
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
}

export const nexstreamService = new NexStreamService();
