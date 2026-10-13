/**
 * Cloudflare Worker Entry Point — Movie Verse
 * Developer: Estiaq Mehedi
 * Supports Cloudflare Workers with Static Assets (env.ASSETS) & API Proxy.
 */

interface Env {
  TMDB_READ_TOKEN?: string;
  TMDB_API_KEY?: string;
  ASSETS?: { fetch: typeof fetch };
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle /api/tmdb/* requests
    if (url.pathname.startsWith('/api/tmdb/')) {
      const endpoint = url.pathname.replace(/^\/api\/tmdb/, '');

      if (endpoint === '/status') {
        return new Response(JSON.stringify({
          status: 'ok',
          configured: Boolean(env.TMDB_READ_TOKEN || env.TMDB_API_KEY),
          developer: 'Estiaq Mehedi',
          platform: 'Cloudflare Workers',
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        });
      }

      const token = env.TMDB_READ_TOKEN;
      const apiKey = env.TMDB_API_KEY;

      if (!token && !apiKey) {
        return new Response(JSON.stringify({
          error: 'TMDB_READ_TOKEN is not configured in Cloudflare Workers secrets. Please add the secret binding.',
          code: 'AUTH_REQUIRED',
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Construct target TMDB URL
      const tmdbUrl = new URL(`${TMDB_BASE_URL}${endpoint}`);
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
        'User-Agent': 'MovieVerse/1.0 (+https://movieverse.estiaqmehedi.workers.dev)',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      } else if (apiKey) {
        tmdbUrl.searchParams.set('api_key', apiKey.trim());
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
          const maxAge = endpoint.includes('/movie/') ? 1800 : 300;
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
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Serve static assets if env.ASSETS binding is available (Cloudflare Workers Static Assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
