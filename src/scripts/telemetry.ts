// Cookieless, IP-free usage beacons to Cloudflare D1 (see functions/api/beacon.ts).
// What is sent: a random id that lives only as long as this tab, event names
// (which window opened, which DOS command ran), and the referring site's host.
// Nothing is sent from localhost, or when Global Privacy Control / Do Not Track is on.

export type EventType = 'view' | 'hb' | 'open' | 'boot' | 'cmd' | 'os' | 'sound' | 'read';

export interface Stats {
  ok: boolean; at: number; online: number; today: number; total: number;
  countries: [string, number][]; countryCount: number; windows: [string, number][];
  hours: number[]; osBoots: number; dosCommands: number; devices: [string, number][]; referrers: [string, number][];
}

const host = location.hostname;
const API = /(^|\.)cuuper22\.pages\.dev$/.test(host) ? '' : host === 'cuuper22.github.io' ? 'https://cuuper22.pages.dev' : null;
const optedOut = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true || navigator.doNotTrack === '1';
export const telemetryOn = API !== null && !optedOut;

function sessionId(): string {
  try {
    let id = sessionStorage.getItem('cuperos.sid');
    if (!id) { id = Array.from(crypto.getRandomValues(new Uint8Array(10)), b => (b % 36).toString(36)).join('') + Date.now().toString(36).slice(-4); sessionStorage.setItem('cuperos.sid', id); }
    return id;
  } catch { return 'anon' + Math.random().toString(36).slice(2, 12); }
}

const sid = sessionId();
let queue: [EventType, string?][] = [];
let meta: { ref?: string | null; ret?: boolean; entry?: string } | null = null;
let timer = 0;

function flush() {
  clearTimeout(timer);
  if (!telemetryOn || !queue.length) return;
  const payload = JSON.stringify({ sid, ...(meta ?? {}), e: queue });
  queue = [];
  meta = null;
  const url = `${API}/api/beacon`;
  const blob = new Blob([payload], { type: 'text/plain' });
  if (!navigator.sendBeacon?.(url, blob)) void fetch(url, { method: 'POST', body: payload, keepalive: true, mode: 'no-cors' }).catch(() => {});
}

export function track(type: EventType, target?: string) {
  if (!telemetryOn) return;
  queue.push(target ? [type, target] : [type]);
  clearTimeout(timer);
  timer = window.setTimeout(flush, type === 'view' ? 50 : 2500);
}

/** First event of a visit: carries where they came from and where they landed. */
export function trackView(entry: string, returning: boolean) {
  let ref: string | null = null;
  try { const h = document.referrer ? new URL(document.referrer).hostname : ''; if (h && h !== host) ref = h.replace(/^www\./, ''); } catch { /* ignore */ }
  meta = { ref, ret: returning, entry };
  track('view', entry);
}

if (telemetryOn) {
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  // Heartbeat keeps "online now" honest; paused while the tab is hidden
  setInterval(() => { if (!document.hidden) { queue.push(['hb']); flush(); } }, 30_000);
}

export async function fetchStats(): Promise<Stats | null> {
  if (API === null) return null;
  try {
    const r = await fetch(`${API}/api/stats`, { cache: 'no-store' });
    if (!r.ok) return null;
    const s = (await r.json()) as Stats;
    return s.ok ? s : null;
  } catch { return null; }
}
