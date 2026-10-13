/**
 * Cloudflare Worker Entry Point — Movie Verse
 * Developer: Estiaq Mehedi
 * Supports Cloudflare Workers with Static Assets (env.ASSETS) & Real TMDB API Proxy.
 */

interface Env {
  TMDB_READ_TOKEN?: string;
  TMDB_API_KEY?: string;
  ASSETS?: { fetch: typeof fetch };
  [key: string]: any;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface ResolvedCredentials {
  token?: string;
  apiKey?: string;
  matchedKey?: string;
  source?: string;
  availableKeyNames: string[];
}

/**
 * Robustly inspects all Cloudflare environment binding sources (env, process.env, globalThis)
 * to locate TMDB_READ_TOKEN or TMDB_API_KEY regardless of casing or formatting.
 */
function resolveCredentials(env: any, request?: any, ctx?: any): ResolvedCredentials {
  const sources: Array<{ name: string; data: any }> = [
    { name: 'env', data: env },
    { name: 'process.env', data: typeof process !== 'undefined' ? process.env : undefined },
    { name: 'globalThis', data: typeof globalThis !== 'undefined' ? globalThis : undefined },
    { name: 'env.secrets', data: env?.secrets },
    { name: 'env.env', data: env?.env },
    { name: 'request.env', data: (request as any)?.env },
    { name: 'ctx.env', data: (ctx as any)?.env },
  ];

  const availableKeyNames: string[] = [];
  const candidateMap: Map<string, { value: string; source: string; key: string }> = new Map();

  for (const src of sources) {
    if (!src.data || typeof src.data !== 'object') continue;
    for (const rawKey of Object.keys(src.data)) {
      const cleanKey = rawKey.trim();
      const val = src.data[rawKey];

      if (typeof val === 'string' && val.trim().length > 0) {
        if (!availableKeyNames.includes(cleanKey)) {
          availableKeyNames.push(cleanKey);
        }
        candidateMap.set(cleanKey.toUpperCase(), {
          value: val.trim(),
          source: src.name,
          key: cleanKey,
        });
      } else if (val && typeof val === 'object' && cleanKey === 'ASSETS') {
        if (!availableKeyNames.includes('ASSETS')) {
          availableKeyNames.push('ASSETS');
        }
      }
    }
  }

  // 1. Check known TMDB Read Token names
  const tokenKeyNames = [
    'TMDB_READ_TOKEN',
    'TMDB_TOKEN',
    'TMDB_API_READ_ACCESS_TOKEN',
    'TMDB_READ_ACCESS_TOKEN',
    'TMDB_ACCESS_TOKEN',
    'TMDB_BEARER_TOKEN',
    'TMDB_BEARER',
    'VITE_TMDB_READ_TOKEN',
  ];

  for (const key of tokenKeyNames) {
    const item = candidateMap.get(key);
    if (item && item.value) {
      const cleanVal = item.value
        .replace(/^Bearer\s+/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();
      if (cleanVal) {
        return {
          token: cleanVal,
          matchedKey: item.key,
          source: item.source,
          availableKeyNames,
        };
      }
    }
  }

  // 2. Check known TMDB API Key names
  const apiKeyNames = [
    'TMDB_API_KEY',
    'TMDB_KEY',
    'VITE_TMDB_API_KEY',
  ];

  for (const key of apiKeyNames) {
    const item = candidateMap.get(key);
    if (item && item.value) {
      const cleanVal = item.value.replace(/^["']|["']$/g, '').trim();
      if (cleanVal) {
        return {
          apiKey: cleanVal,
          matchedKey: item.key,
          source: item.source,
          availableKeyNames,
        };
      }
    }
  }

  // 3. Fallback: Fuzzy scan for any key containing TMDB
  for (const [upperKey, item] of candidateMap.entries()) {
    if (upperKey.includes('TMDB')) {
      const cleanVal = item.value
        .replace(/^Bearer\s+/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();
      if (cleanVal.length > 40 || upperKey.includes('TOKEN') || upperKey.includes('READ')) {
        return {
          token: cleanVal,
          matchedKey: item.key,
          source: item.source,
          availableKeyNames,
        };
      } else {
        return {
          apiKey: cleanVal,
          matchedKey: item.key,
          source: item.source,
          availableKeyNames,
        };
      }
    }
  }

  return { availableKeyNames };
}

/**
 * Maps incoming Movie Verse proxy paths to canonical TMDB API endpoints.
 */
function mapToTmdbEndpoint(pathname: string, searchParams: URLSearchParams): string {
  // Strip /api/tmdb prefix
  const path = pathname.replace(/^\/api\/tmdb\/?/, '/');

  if (path === '/' || path === '') {
    return '/movie/popular';
  }
  if (path === '/trending') {
    const timeWindow = searchParams.get('time_window') === 'day' ? 'day' : 'week';
    return `/trending/movie/${timeWindow}`;
  }
  if (path === '/popular') {
    return '/movie/popular';
  }
  if (path === '/now_playing') {
    return '/movie/now_playing';
  }
  if (path === '/upcoming') {
    return '/movie/upcoming';
  }
  if (path === '/top_rated') {
    return '/movie/top_rated';
  }
  if (path === '/search') {
    return '/search/movie';
  }
  if (path === '/genres') {
    return '/genre/movie/list';
  }
  if (path === '/discover') {
    return '/discover/movie';
  }

  // Details, credits, similar, recommendations (e.g. /movie/123, /movie/123/credits)
  return path.startsWith('/') ? path : `/${path}`;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle /api/tmdb/* requests
    if (url.pathname === '/api/tmdb' || url.pathname.startsWith('/api/tmdb/')) {
      const pathUnderTmdb = url.pathname.replace(/^\/api\/tmdb\/?/, '/');

      // Status diagnostic check
      if (pathUnderTmdb === '/status') {
        const creds = resolveCredentials(env, request, ctx);
        return new Response(JSON.stringify({
          status: 'ok',
          configured: Boolean(creds.token || creds.apiKey),
          authType: creds.token ? 'bearer_token' : creds.apiKey ? 'api_key' : 'none',
          matchedKey: creds.matchedKey || null,
          availableBindingKeys: creds.availableKeyNames,
          developer: 'Estiaq Mehedi',
          platform: 'Cloudflare Workers',
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Resolve token or API key
      const creds = resolveCredentials(env, request, ctx);
      if (!creds.token && !creds.apiKey) {
        return new Response(JSON.stringify({
          error: `TMDB_READ_TOKEN is not configured in Cloudflare Workers secrets. Available keys detected: [${creds.availableKeyNames.join(', ')}]. Please bind TMDB_READ_TOKEN in Cloudflare Dashboard (Workers & Pages -> movieverse -> Settings -> Variables and Secrets) or via 'npx wrangler secret put TMDB_READ_TOKEN'.`,
          code: 'AUTH_REQUIRED',
          availableKeys: creds.availableKeyNames,
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Canonical endpoint mapping
      const canonicalEndpoint = mapToTmdbEndpoint(url.pathname, url.searchParams);
      const tmdbUrl = new URL(`${TMDB_BASE_URL}${canonicalEndpoint}`);

      // Forward query parameters
      for (const [key, val] of url.searchParams.entries()) {
        // Skip time_window since it's already encoded into canonical path for trending
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

        const data = await tmdbResponse.text();
        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', 'application/json');
        responseHeaders.set('Access-Control-Allow-Origin', '*');

        if (tmdbResponse.ok) {
          const maxAge = canonicalEndpoint.includes('/movie/') && !canonicalEndpoint.includes('popular')
            ? 1800
            : 300;
          responseHeaders.set('Cache-Control', `public, max-age=${maxAge}`);
        } else {
          responseHeaders.set('Cache-Control', 'no-store');
        }

        return new Response(data, {
          status: tmdbResponse.status,
          headers: responseHeaders,
        });
      } catch (err: any) {
        return new Response(JSON.stringify({
          error: err.message || 'Failed to fetch from TMDB API',
          status: 500,
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Serve static frontend assets from ./dist binding (Cloudflare Workers Static Assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
