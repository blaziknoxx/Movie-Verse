/**
 * Movie Verse — Full-Stack Server Entry Point
 * Developer — Estiaq Mehedi
 * Provides secure server-side TMDB API proxy with memory caching and Vite middleware in dev.
 */

import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// TMDB API Base Configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// In-memory cache with TTL (Time To Live in ms)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}
const apiCache = new Map<string, CacheEntry>();

function getCached(key: string): any | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    apiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
  // Cap cache size to avoid unbounded memory usage
  if (apiCache.size > 500) {
    const oldestKey = apiCache.keys().next().value;
    if (oldestKey) apiCache.delete(oldestKey);
  }
  apiCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// Helper to make authenticated requests to TMDB
async function fetchFromTMDB(endpoint: string, queryParams: Record<string, any> = {}) {
  const token = process.env.TMDB_READ_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!token && !apiKey) {
    throw new Error('MISSING_TMDB_TOKEN');
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  // Set default language and adult filters
  url.searchParams.set('language', queryParams.language || 'en-US');
  if (queryParams.include_adult === undefined) {
    url.searchParams.set('include_adult', 'false');
  }

  // Append safe allowed query parameters
  for (const [key, val] of Object.entries(queryParams)) {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'MovieVerse/1.0 (+https://movieverse.estiaqmehedi.workers.dev)',
  };

  if (token) {
    const cleanToken = token.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
    headers['Authorization'] = `Bearer ${cleanToken}`;
  } else if (apiKey) {
    url.searchParams.set('api_key', apiKey.trim().replace(/^["']|["']$/g, ''));
  }

  const cacheKey = url.toString();
  const cached = getCached(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorBody);
    } catch {
      parsedError = { status_message: errorBody };
    }
    const err = new Error(parsedError.status_message || `TMDB API error ${response.status}`);
    (err as any).status = response.status;
    throw err;
  }

  const data = await response.json();
  // Cache for 5 mins for lists, 30 mins for details, persons & genres
  const ttl = endpoint.includes('/genre/') || (endpoint.includes('/movie/') && !endpoint.includes('popular')) || endpoint.includes('/person/')
    ? 30 * 60 * 1000
    : 5 * 60 * 1000;
  setCache(cacheKey, data, ttl);

  return { data, fromCache: false };
}

// -------------------------------------------------------------
// TMDB Server-Side Proxy Endpoints
// -------------------------------------------------------------

app.use(express.json());

// Status & configuration check (never exposes secret tokens)
app.get('/api/tmdb/status', (req: Request, res: Response) => {
  const hasToken = Boolean(process.env.TMDB_READ_TOKEN || process.env.TMDB_API_KEY);
  res.json({
    status: 'ok',
    configured: hasToken,
    developer: 'Estiaq Mehedi',
    platform: 'Movie Verse TMDB Proxy',
  });
});

// NexStream configuration check (never exposes secret tokens)
app.get('/api/config/nexstream', (req: Request, res: Response) => {
  const apiKey = (process.env.NEXSTREAM_API_KEY || process.env.VITE_NEXSTREAM_API_KEY || '').trim();
  res.json({
    status: 'ok',
    configured: Boolean(apiKey),
    apiKey: apiKey || '',
  });
});

// Trending movies (week or day)
app.get('/api/tmdb/trending', async (req: Request, res: Response) => {
  try {
    const timeWindow = req.query.time_window === 'day' ? 'day' : 'week';
    const page = req.query.page || '1';
    const result = await fetchFromTMDB(`/trending/movie/${timeWindow}`, { page });
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Popular movies
app.get('/api/tmdb/popular', async (req: Request, res: Response) => {
  try {
    const page = req.query.page || '1';
    const result = await fetchFromTMDB('/movie/popular', { page });
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Now Playing movies
app.get('/api/tmdb/now_playing', async (req: Request, res: Response) => {
  try {
    const result = await fetchFromTMDB('/movie/now_playing', req.query as Record<string, any>);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Upcoming movies
app.get('/api/tmdb/upcoming', async (req: Request, res: Response) => {
  try {
    const result = await fetchFromTMDB('/movie/upcoming', req.query as Record<string, any>);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Top Rated movies
app.get('/api/tmdb/top_rated', async (req: Request, res: Response) => {
  try {
    const result = await fetchFromTMDB('/movie/top_rated', req.query as Record<string, any>);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Movie Search
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || '').trim();
    if (!query) {
      return res.json({ results: [], page: 1, total_pages: 0, total_results: 0 });
    }
    const page = req.query.page || '1';
    const result = await fetchFromTMDB('/search/movie', { query, page });
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Movie Details
app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric movie ID required' });
    }
    const result = await fetchFromTMDB(`/movie/${id}`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Movie Credits (Cast and Crew)
app.get('/api/tmdb/movie/:id/credits', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric movie ID required' });
    }
    const result = await fetchFromTMDB(`/movie/${id}/credits`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Similar Movies
app.get('/api/tmdb/movie/:id/similar', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric movie ID required' });
    }
    const page = req.query.page || '1';
    const result = await fetchFromTMDB(`/movie/${id}/similar`, { page });
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Recommended Movies
app.get('/api/tmdb/movie/:id/recommendations', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric movie ID required' });
    }
    const page = req.query.page || '1';
    const result = await fetchFromTMDB(`/movie/${id}/recommendations`, { page });
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Movie Videos (Official Trailers)
app.get('/api/tmdb/movie/:id/videos', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric movie ID required' });
    }
    const result = await fetchFromTMDB(`/movie/${id}/videos`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Official Watch Providers
app.get('/api/tmdb/movie/:id/watch/providers', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric movie ID required' });
    }
    const result = await fetchFromTMDB(`/movie/${id}/watch/providers`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Franchise Collection (Sequels, Prequels & Connected franchise entries)
app.get('/api/tmdb/collection/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric collection ID required' });
    }
    const result = await fetchFromTMDB(`/collection/${id}`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Person Details (Real TMDB Biographical & Professional Data)
app.get('/api/tmdb/person/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric person ID required' });
    }
    const result = await fetchFromTMDB(`/person/${id}`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Person Movie Credits
app.get('/api/tmdb/person/:id/movie_credits', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric person ID required' });
    }
    const result = await fetchFromTMDB(`/person/${id}/movie_credits`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Person Combined Credits (Movies & TV Shows)
app.get('/api/tmdb/person/:id/combined_credits', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Valid numeric person ID required' });
    }
    const result = await fetchFromTMDB(`/person/${id}/combined_credits`);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Genre list
app.get('/api/tmdb/genres', async (req: Request, res: Response) => {
  try {
    const result = await fetchFromTMDB('/genre/movie/list');
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

// Discover movies by genre, sort, language, origin country, release dates, etc.
app.get('/api/tmdb/discover', async (req: Request, res: Response) => {
  try {
    const result = await fetchFromTMDB('/discover/movie', req.query as Record<string, any>);
    res.json(result.data);
  } catch (err: any) {
    handleProxyError(res, err);
  }
});

function handleProxyError(res: Response, err: any) {
  if (err.message === 'MISSING_TMDB_TOKEN') {
    return res.status(503).json({
      error: 'TMDB_READ_TOKEN is not configured on the server. Please bind the TMDB_READ_TOKEN secret in your environment or Cloudflare dashboard.',
      code: 'AUTH_REQUIRED',
    });
  }
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Error communicating with TMDB API',
    status: statusCode,
  });
}

// -------------------------------------------------------------
// Vite Middleware (Dev) or Static Assets (Prod)
// -------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Movie Verse] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Movie Verse] Developer — Estiaq Mehedi`);
    console.log(`[Movie Verse] TMDB token configured: ${Boolean(process.env.TMDB_READ_TOKEN || process.env.TMDB_API_KEY)}`);
  });
}

startServer().catch((err) => {
  console.error('[Movie Verse] Fatal server startup error:', err);
  process.exit(1);
});
