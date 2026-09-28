// GET /api/stats: public, aggregate-only numbers for the System Monitor window.
// Edge-cached for 15s so a busy desktop never hammers D1.
import { cors, json, today, type Env } from '../../edge/shared';

const TTL = 15;

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => new Response(null, { status: 204, headers: cors(request) });

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const headers = { ...cors(request), 'Cache-Control': `public, max-age=${TTL}` };
  if (!env.DB) return json({ ok: false, reason: 'no-db' }, { status: 503, headers });

  const cache = caches.default;
  const key = new Request(new URL('/api/stats', request.url).toString());
  const hit = await cache.match(key);
  if (hit) {
    const res = new Response(hit.body, hit);
    Object.entries(cors(request)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const now = Date.now();
  const d30 = now - 30 * 86_400_000;
  const d1 = now - 86_400_000;
  const db = env.DB;
  const [online, day, total, countries, nCountries, windows, hourly, osBoots, dosCmds, devices, refs] = await db.batch([
    db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE last_ts > ?1').bind(now - 90_000),
    db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE day = ?1').bind(today(now)),
    db.prepare('SELECT COUNT(*) AS n FROM sessions'),
    db.prepare('SELECT country AS k, COUNT(*) AS n FROM sessions WHERE last_ts > ?1 AND country IS NOT NULL GROUP BY country ORDER BY n DESC LIMIT 8').bind(d30),
    db.prepare('SELECT COUNT(DISTINCT country) AS n FROM sessions WHERE country IS NOT NULL'),
    db.prepare("SELECT target AS k, COUNT(DISTINCT sid) AS n FROM events WHERE type = 'open' AND ts > ?1 AND target IS NOT NULL GROUP BY target ORDER BY n DESC LIMIT 8").bind(d30),
    db.prepare('SELECT CAST((first_ts - ?1) / 3600000 AS INTEGER) AS k, COUNT(*) AS n FROM sessions WHERE first_ts > ?1 GROUP BY k').bind(d1),
    db.prepare("SELECT COUNT(*) AS n FROM events WHERE type = 'os'"),
    db.prepare("SELECT COUNT(*) AS n FROM events WHERE type = 'cmd'"),
    db.prepare('SELECT device AS k, COUNT(*) AS n FROM sessions WHERE last_ts > ?1 GROUP BY device ORDER BY n DESC').bind(d30),
    db.prepare('SELECT ref AS k, COUNT(*) AS n FROM sessions WHERE last_ts > ?1 AND ref IS NOT NULL GROUP BY ref ORDER BY n DESC LIMIT 5').bind(d30),
  ]);

  type Row = { k?: string | number; n: number };
  const n = (r: D1Result) => ((r.results?.[0] as Row | undefined)?.n ?? 0);
  const rows = (r: D1Result) => (r.results as Row[]).map(x => [x.k, x.n] as [string, number]);

  const hours = Array.from({ length: 24 }, () => 0);
  (hourly.results as Row[]).forEach(r => { const i = Number(r.k); if (i >= 0 && i < 24) hours[i] = r.n; });

  const body = {
    ok: true,
    at: now,
    online: Math.max(1, n(online)),
    today: n(day),
    total: n(total),
    countries: rows(countries),
    countryCount: n(nCountries),
    windows: rows(windows),
    hours,
    osBoots: n(osBoots),
    dosCommands: n(dosCmds),
    devices: rows(devices),
    referrers: rows(refs),
  };
  const res = json(body, { headers });
  waitUntil(cache.put(key, json(body, { headers: { 'Cache-Control': `public, max-age=${TTL}` } })));
  return res;
};
