/**
 * Cloudflare Workers / Pages Functions — TMDB API Proxy Handler
 * Developer: Estiaq Mehedi
 * Securely proxies calls to TMDB using the TMDB_READ_TOKEN secret binding.
 */

interface Env {
  TMDB_READ_TOKEN?: string;
  TMDB_API_KEY?: string;
}

interface EventContext<Env, P extends string> {
  request: Request;
  env: Env;
  params: Record<P, string | string[]>;
}

type PagesFunction<Env = any> = (context: EventContext<Env, any>) => Promise<Response>;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Extract path under /api/tmdb/
  const pathSegments = params.path as string[] || [];
  const endpoint = '/' + pathSegments.join('/');

  const token = env.TMDB_READ_TOKEN;
  const apiKey = env.TMDB_API_KEY;

  if (endpoint === '/status') {
    return new Response(JSON.stringify({
      status: 'ok',
      configured: Boolean(token || apiKey),
      developer: 'Estiaq Mehedi',
      platform: 'Cloudflare Worker'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }

  if (!token && !apiKey) {
    return new Response(JSON.stringify({
      error: 'TMDB_READ_TOKEN is not configured on Cloudflare Workers. Please add TMDB_READ_TOKEN secret binding.',
      code: 'AUTH_REQUIRED'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Construct target TMDB URL
  const tmdbUrl = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  // Forward query parameters
  for (const [key, val] of url.searchParams.entries()) {
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
    'User-Agent': 'MovieVerse/1.0 (+https://movieverse.estiaqmehedi.workers.dev)'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  } else if (apiKey) {
    tmdbUrl.searchParams.set('api_key', apiKey.trim());
  }

  try {
    const tmdbResponse = await fetch(tmdbUrl.toString(), {
      method: request.method,
      headers
    });

    const responseData = await tmdbResponse.text();

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    // Cache popular/trending for 5 mins, movie details for 30 mins
    if (tmdbResponse.ok) {
      const maxAge = endpoint.includes('/movie/') ? 1800 : 300;
      responseHeaders.set('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      responseHeaders.set('Cache-Control', 'no-store');
    }

    return new Response(responseData, {
      status: tmdbResponse.status,
      headers: responseHeaders
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      error: err.message || 'Failed to fetch from TMDB',
      status: 500
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
