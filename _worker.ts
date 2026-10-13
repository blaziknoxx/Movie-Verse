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
  authType: 'bearer_token' | 'api_key' | 'none';
}

/**
 * Clean and sanitize a token or API key string (strips Bearer prefix, quotes, whitespace).
 */
function sanitizeSecret(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Resolves TMDB authentication credentials with direct property priority on Cloudflare's `env`.
 * Bypasses Object.keys() limitations on workerd host binding objects and prototype descriptors.
 */
function resolveCredentials(env: Env | undefined, request?: Request, ctx?: any): ResolvedCredentials {
  // 1. Direct priority check on Cloudflare Worker env parameter (standard binding location)
  if (env && typeof env === 'object') {
    // Check TMDB Read Access Token (Bearer Token)
    const directToken = sanitizeSecret(
      env.TMDB_READ_TOKEN ||
      env.TMDB_TOKEN ||
      env.TMDB_API_READ_ACCESS_TOKEN ||
      env.TMDB_READ_ACCESS_TOKEN ||
      env.TMDB_ACCESS_TOKEN ||
      env.TMDB_BEARER_TOKEN ||
      env.TMDB_BEARER ||
      env['tmdb_read_token'] ||
      env['tmdb_token']
    );

    if (directToken) {
      return { token: directToken, authType: 'bearer_token' };
    }

    // Check TMDB API Key (v3 auth)
    const directApiKey = sanitizeSecret(
      env.TMDB_API_KEY ||
      env.TMDB_KEY ||
      env['tmdb_api_key'] ||
      env['tmdb_key']
    );

    if (directApiKey) {
      return { apiKey: directApiKey, authType: 'api_key' };
    }
  }

  // 2. Secondary check across fallback scopes (process.env, globalThis, nested env objects)
  const candidateScopes: any[] = [
    typeof process !== 'undefined' ? process.env : undefined,
    typeof globalThis !== 'undefined' ? globalThis : undefined,
    (env as any)?.secrets,
    (env as any)?.env,
    (request as any)?.env,
    (ctx as any)?.env,
  ];

  for (const scope of candidateScopes) {
    if (!scope || typeof scope !== 'object') continue;

    const scopedToken = sanitizeSecret(
      scope.TMDB_READ_TOKEN ||
      scope.TMDB_TOKEN ||
      scope.TMDB_API_READ_ACCESS_TOKEN ||
      scope.TMDB_ACCESS_TOKEN ||
      scope['tmdb_read_token']
    );
    if (scopedToken) {
      return { token: scopedToken, authType: 'bearer_token' };
    }

    const scopedApiKey = sanitizeSecret(
      scope.TMDB_API_KEY ||
      scope.TMDB_KEY ||
      scope['tmdb_api_key']
    );
    if (scopedApiKey) {
      return { apiKey: scopedApiKey, authType: 'api_key' };
    }
  }

  // 3. Deep inspection of env object properties (including prototype chain and for...in)
  if (env && typeof env === 'object') {
    const inspectedKeys = new Set<string>();

    let currentObj: any = env;
    while (currentObj && currentObj !== Object.prototype) {
      try {
        for (const k of Object.getOwnPropertyNames(currentObj)) {
          inspectedKeys.add(k);
        }
      } catch {
        // Skip if restricted
      }
      currentObj = Object.getPrototypeOf(currentObj);
    }

    try {
      for (const k in env) {
        inspectedKeys.add(k);
      }
    } catch {
      // Skip if restricted
    }

    for (const key of inspectedKeys) {
      const upperKey = key.toUpperCase();
      if (upperKey.includes('TMDB')) {
        const val = sanitizeSecret((env as any)[key]);
        if (val) {
          if (val.length > 35 || upperKey.includes('TOKEN') || upperKey.includes('READ')) {
            return { token: val, authType: 'bearer_token' };
          } else {
            return { apiKey: val, authType: 'api_key' };
          }
        }
      }
    }
  }

  return { authType: 'none' };
}

/**
 * Maps incoming Movie Verse proxy paths to canonical TMDB API endpoints.
 */
function mapToTmdbEndpoint(pathname: string, searchParams: URLSearchParams): string {
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

  return path.startsWith('/') ? path : `/${path}`;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight for API requests
    if (request.method === 'OPTIONS' && (url.pathname === '/api/tmdb' || url.pathname.startsWith('/api/tmdb/'))) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Handle /api/tmdb and /api/tmdb/* requests
    if (url.pathname === '/api/tmdb' || url.pathname.startsWith('/api/tmdb/')) {
      const pathUnderTmdb = url.pathname.replace(/^\/api\/tmdb\/?/, '/');

      // Status diagnostic endpoint (reports configured: true when secret exists, never reveals secret)
      if (pathUnderTmdb === '/status') {
        const creds = resolveCredentials(env, request, ctx);
        const isConfigured = Boolean(creds.token || creds.apiKey);

        return new Response(JSON.stringify({
          status: 'ok',
          configured: isConfigured,
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

      // Resolve TMDB credentials from Cloudflare environment
      const creds = resolveCredentials(env, request, ctx);
      if (!creds.token && !creds.apiKey) {
        return new Response(JSON.stringify({
          error: 'TMDB_READ_TOKEN is not configured in Cloudflare Workers secrets. Please add the secret binding via Cloudflare Dashboard or wrangler secret put TMDB_READ_TOKEN.',
          code: 'AUTH_REQUIRED',
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

      // Forward allowed query parameters
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
