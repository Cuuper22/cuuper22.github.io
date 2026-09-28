// POST /api/beacon: cookieless, IP-free usage events.
// The client sends { sid, ref?, ret?, entry?, e: [[type, target?], ...] } as text/plain
// (so sendBeacon needs no CORS preflight). We keep only: a per-tab random id,
// Cloudflare's country code, a coarse device class, and the event names.
import { BOT_UA, cors, deviceOf, today, type Env } from '../../edge/shared';

const TYPES = new Set(['view', 'hb', 'open', 'boot', 'cmd', 'os', 'sound', 'read']);
const SID = /^[a-z0-9]{10,24}$/;
const TARGET = /^[a-z0-9_.-]{1,48}$/i;
const HOST = /^[a-z0-9.-]{1,80}$/i;

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => new Response(null, { status: 204, headers: cors(request) });

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const headers = cors(request);
  const done = (status = 204) => new Response(null, { status, headers });
  if (!env.DB) return done();

  const ua = request.headers.get('User-Agent') ?? '';
  if (BOT_UA.test(ua) || request.headers.get('Sec-GPC') === '1') return done();
  if (Number(request.headers.get('Content-Length') ?? 0) > 4096) return done(413);

  let body: { sid?: unknown; ref?: unknown; ret?: unknown; entry?: unknown; e?: unknown };
  try { body = JSON.parse(await request.text()); } catch { return done(400); }

  const sid = typeof body.sid === 'string' && SID.test(body.sid) ? body.sid : null;
  if (!sid) return done(400);
  const events = (Array.isArray(body.e) ? body.e : []).slice(0, 40)
    .filter((ev): ev is [string, string?] => Array.isArray(ev) && typeof ev[0] === 'string' && TYPES.has(ev[0]))
    .map(([type, target]) => [type, typeof target === 'string' && TARGET.test(target) ? target.toLowerCase() : null] as const);
  if (!events.length) return done();

  const now = Date.now();
  const day = today(now);
  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;
  const country = typeof cf?.country === 'string' && /^[A-Z]{2}$/.test(cf.country) ? cf.country : null;
  const ref = typeof body.ref === 'string' && HOST.test(body.ref) ? body.ref.toLowerCase() : null;
  const entry = typeof body.entry === 'string' && TARGET.test(body.entry) ? body.entry.toLowerCase() : null;

  const db = env.DB;
  const stmts: D1PreparedStatement[] = [
    db.prepare(
      `INSERT INTO sessions (sid, first_ts, last_ts, day, country, device, ref, is_return, entry)
       VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(sid) DO UPDATE SET last_ts = excluded.last_ts`,
    ).bind(sid, now, day, country, deviceOf(ua), ref, body.ret ? 1 : 0, entry),
  ];
  for (const [type, target] of events) {
    if (type === 'hb') continue; // heartbeats only refresh last_ts
    stmts.push(db.prepare('INSERT INTO events (ts, day, sid, type, target) VALUES (?1, ?2, ?3, ?4, ?5)').bind(now, day, sid, type, target));
  }
  // Retention: raw events live for 180 days; aggregates come from sessions
  if (Math.random() < 0.01) stmts.push(db.prepare('DELETE FROM events WHERE ts < ?1').bind(now - 180 * 86_400_000));

  waitUntil(db.batch(stmts).then(() => undefined, err => console.error('beacon write failed', err)));
  return done();
};
