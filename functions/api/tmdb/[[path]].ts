/**
 * Cloudflare Workers / Pages Functions — TMDB API Proxy Handler
 * Developer: Estiaq Mehedi
 * Securely proxies calls to TMDB using the TMDB_READ_TOKEN secret binding.
 */

interface Env {
  TMDB_READ_TOKEN?: string;
  TMDB_API_KEY?: string;
  [key: string]: any;
}

interface EventContext<Env, P extends string> {
  request: Request;
  env: Env;
  params: Record<P, string | string[]>;
}

type PagesFunction<Env = any> = (context: EventContext<Env, any>) => Promise<Response>;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function resolveCredentials(env: any, request?: any): { token?: string; apiKey?: string; matchedKey?: string; availableKeyNames: string[] } {
  const sources: Array<{ name: string; data: any }> = [
    { name: 'env', data: env },
    { name: 'process.env', data: typeof process !== 'undefined' ? process.env : undefined },
    { name: 'globalThis', data: typeof globalThis !== 'undefined' ? globalThis : undefined },
  ];

  const availableKeyNames: string[] = [];
  const candidateMap: Map<string, { value: string; source: string; key: string }> = new Map();

  for (const src of sources) {
    if (!src.data || typeof src.data !== 'object') continue;
    for (const rawKey of Object.keys(src.data)) {
      const cleanKey = rawKey.trim();
      const val = src.data[rawKey];
      if (typeof val === 'string' && val.trim().length > 0) {
        if (!availableKeyNames.includes(cleanKey)) availableKeyNames.push(cleanKey);
        candidateMap.set(cleanKey.toUpperCase(), { value: val.trim(), source: src.name, key: cleanKey });
      }
    }
  }

  const tokenKeys = ['TMDB_READ_TOKEN', 'TMDB_TOKEN', 'TMDB_API_READ_ACCESS_TOKEN', 'TMDB_ACCESS_TOKEN', 'TMDB_BEARER'];
  for (const k of tokenKeys) {
    const item = candidateMap.get(k);
    if (item && item.value) {
      return {
        token: item.value.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim(),
        matchedKey: item.key,
        availableKeyNames,
      };
    }
  }

  const apiKeyNames = ['TMDB_API_KEY', 'TMDB_KEY'];
  for (const k of apiKeyNames) {
    const item = candidateMap.get(k);
    if (item && item.value) {
      return {
        apiKey: item.value.replace(/^["']|["']$/g, '').trim(),
        matchedKey: item.key,
        availableKeyNames,
      };
    }
  }

  return { availableKeyNames };
}

function mapToTmdbEndpoint(path: string, searchParams: URLSearchParams): string {
  if (path === '/' || path === '') return '/movie/popular';
  if (path === '/trending') {
    const timeWindow = searchParams.get('time_window') === 'day' ? 'day' : 'week';
    return `/trending/movie/${timeWindow}`;
  }
  if (path === '/popular') return '/movie/popular';
  if (path === '/now_playing') return '/movie/now_playing';
  if (path === '/upcoming') return '/movie/upcoming';
  if (path === '/top_rated') return '/movie/top_rated';
  if (path === '/search') return '/search/movie';
  if (path === '/genres') return '/genre/movie/list';
  if (path === '/discover') return '/discover/movie';
  return path.startsWith('/') ? path : `/${path}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Extract path under /api/tmdb/
  const pathSegments = params.path as string[] || [];
  const endpoint = '/' + pathSegments.join('/');

  if (endpoint === '/status') {
    const creds = resolveCredentials(env, request);
    return new Response(JSON.stringify({
      status: 'ok',
      configured: Boolean(creds.token || creds.apiKey),
      authType: creds.token ? 'bearer_token' : creds.apiKey ? 'api_key' : 'none',
      matchedKey: creds.matchedKey || null,
      availableBindingKeys: creds.availableKeyNames,
      developer: 'Estiaq Mehedi',
      platform: 'Cloudflare Pages Functions',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const creds = resolveCredentials(env, request);
  if (!creds.token && !creds.apiKey) {
    return new Response(JSON.stringify({
      error: `TMDB_READ_TOKEN is not configured on Cloudflare. Available keys: [${creds.availableKeyNames.join(', ')}].`,
      code: 'AUTH_REQUIRED',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const canonicalEndpoint = mapToTmdbEndpoint(endpoint, url.searchParams);
  const tmdbUrl = new URL(`${TMDB_BASE_URL}${canonicalEndpoint}`);

  for (const [key, val] of url.searchParams.entries()) {
    if (key === 'time_window' && canonicalEndpoint.startsWith('/trending/')) continue;
    tmdbUrl.searchParams.set(key, val);
  }

  if (!tmdbUrl.searchParams.has('language')) {
    tmdbUrl.searchParams.set('language', 'en-US');
  }
  if (!tmdbUrl.searchParams.has('include_adult')) {
    tmdbUrl.searchParams.set('include_adult', 'false');
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'MovieVerse/1.0 (+https://movieverse.estiaqmehedi.workers.dev)',
  };

  if (creds.token) {
    headers['Authorization'] = `Bearer ${creds.token}`;
  } else if (creds.apiKey) {
    tmdbUrl.searchParams.set('api_key', creds.apiKey);
  }

  try {
    const tmdbResponse = await fetch(tmdbUrl.toString(), {
      method: request.method,
      headers,
    });

    const responseData = await tmdbResponse.text();
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    if (tmdbResponse.ok) {
      const maxAge = canonicalEndpoint.includes('/movie/') ? 1800 : 300;
      responseHeaders.set('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      responseHeaders.set('Cache-Control', 'no-store');
    }

    return new Response(responseData, {
      status: tmdbResponse.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: err.message || 'Failed to fetch from TMDB',
      status: 500,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
