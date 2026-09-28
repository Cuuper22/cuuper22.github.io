// Shared helpers for the CúperOS telemetry API.

export interface Env { DB?: D1Database }

const ALLOWED_ORIGINS = [/^https:\/\/([a-z0-9-]+\.)?cuuper22\.pages\.dev$/, /^https:\/\/cuuper22\.github\.io$/, /^http:\/\/localhost:\d+$/];

export function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return ALLOWED_ORIGINS.some(re => re.test(origin))
    ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    : {};
}

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json; charset=utf-8', ...(init.headers ?? {}) } });

export const today = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

export const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|curl|wget|python|axios|node-fetch/i;

export function deviceOf(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}
