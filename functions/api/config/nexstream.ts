/**
 * Cloudflare Pages Function — NexStream Config Endpoint
 * Developer: Estiaq Mehedi
 */

interface Env {
  NEXSTREAM_API_KEY?: string;
  VITE_NEXSTREAM_API_KEY?: string;
  [key: string]: any;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const apiKey = (env.NEXSTREAM_API_KEY || env.VITE_NEXSTREAM_API_KEY || '').trim();

  return new Response(JSON.stringify({
    status: 'ok',
    configured: Boolean(apiKey),
    apiKey: apiKey || '',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
