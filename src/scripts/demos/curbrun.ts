// A pocket version of CurbRun's legality engine over a handful of illustrative curbs.
// Same shape as the app: evaluate the whole [now, now+N] window, block on any overlap,
// report the next restriction, label confidence, rank closest-first with an availability penalty.

type Kind = 'StreetCleaning' | 'NoParking' | 'PaidMeter' | 'TimeLimit' | 'ResidentialPermit';
interface Rule { kind: Kind; days: number[]; start: number; end: number; limitHr?: number; area?: string }
interface Curb { street: string; miles: number; curbFt: number; avail: number; tier: 'Strong' | 'Caution' | 'Competitive'; rules: Rule[] }

const H = 60, DAY = 1440, WEEK = 7 * DAY;
const NOW = 0 * DAY + 18 * H + 10; // Monday 6:10 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = [0, 1, 2, 3, 4];

const CURBS: Curb[] = [
  { street: 'Valencia St · 19th–20th', miles: 0.08, curbFt: 60, avail: 0.41, tier: 'Competitive', rules: [
    { kind: 'PaidMeter', days: [0, 1, 2, 3, 4, 5], start: 9 * H, end: 18 * H },
    { kind: 'StreetCleaning', days: [3], start: 6 * H, end: 8 * H },
  ] },
  { street: 'Guerrero St · 18th–19th', miles: 0.12, curbFt: 44, avail: 0.66, tier: 'Strong', rules: [
    { kind: 'StreetCleaning', days: [1], start: 8 * H, end: 10 * H },
  ] },
  { street: 'Hill St · Valencia–Guerrero', miles: 0.21, curbFt: 38, avail: 0.83, tier: 'Strong', rules: [
    { kind: 'ResidentialPermit', days: WEEKDAYS, start: 8 * H, end: 21 * H, limitHr: 2, area: 'J' },
  ] },
  { street: '20th St · Guerrero–Dolores', miles: 0.26, curbFt: 30, avail: 0.58, tier: 'Caution', rules: [
    { kind: 'StreetCleaning', days: [2], start: 8 * H, end: 10 * H },
  ] },
  { street: 'Dolores St · 19th–20th', miles: 0.3, curbFt: 80, avail: 0.74, tier: 'Strong', rules: [
    { kind: 'StreetCleaning', days: [0], start: 22 * H, end: 24 * H },
  ] },
  { street: 'Liberty St · Valencia–Guerrero', miles: 0.34, curbFt: 26, avail: 0.9, tier: 'Caution', rules: [
    { kind: 'NoParking', days: [1], start: 7 * H, end: 9 * H },
  ] },
];

const TIER_LABEL = { Strong: ['Strong match', ''], Caution: ['Check signs', 'caution'], Competitive: ['High competition', 'competitive'] } as const;

/** Every occurrence of a weekly rule that could touch [from, to] */
function occurrences(r: Rule, from: number, to: number): [number, number][] {
  const out: [number, number][] = [];
  for (let w = Math.floor(from / WEEK) - 1; w <= Math.floor(to / WEEK) + 1; w++) {
    for (const d of r.days) {
      const s = w * WEEK + d * DAY + r.start, e = w * WEEK + d * DAY + r.end;
      if (e > from && s < to + 8 * DAY) out.push([s, e]);
    }
  }
  return out.sort((a, b) => a[0] - b[0]);
}

function fmt(t: number) {
  const day = DAYS[Math.floor(((t % WEEK) + WEEK) % WEEK / DAY)];
  const m = ((t % DAY) + DAY) % DAY;
  const h = Math.floor(m / 60), mi = m % 60;
  return `${day} ${((h + 11) % 12) + 1}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
function span(min: number) {
  if (min >= 7 * DAY) return '7d+ clear';
  const h = Math.floor(min / 60), m = min % 60;
  return h && !m ? `${h}h clear` : `${h ? `${h}h ` : ''}${m}m clear`;
}

function evaluate(c: Curb, hours: number, vehFt: number) {
  const end = NOW + hours * H;
  const spaces = Math.floor(c.curbFt / (vehFt + 4));
  if (spaces < 1) return { ok: false as const, reason: `${c.curbFt} ft of curb is too short for this vehicle.` };

  let freeUntil = Infinity;
  for (const r of c.rules) {
    for (const [s, e] of occurrences(r, NOW, end)) {
      const overlaps = s < end && e > NOW;
      if (r.kind === 'ResidentialPermit' || r.kind === 'TimeLimit') {
        if (overlaps) {
          const enforced = Math.min(e, end) - Math.max(s, NOW);
          if (enforced > (r.limitHr ?? 0) * H) {
            return { ok: false as const, reason: `${r.limitHr} hr limit${r.area ? ` (Area ${r.area})` : ''} is enforced until ${fmt(e)}.` };
          }
          freeUntil = Math.min(freeUntil, Math.max(s, NOW) + (r.limitHr ?? 0) * H);
        } else if (s >= end) freeUntil = Math.min(freeUntil, s + (r.limitHr ?? 0) * H);
        continue;
      }
      if (overlaps) {
        const what = r.kind === 'StreetCleaning' ? 'Street cleaning' : r.kind === 'NoParking' ? 'No parking' : 'Paid meter';
        return { ok: false as const, reason: `${what} overlaps your requested ${hours} hr window.` };
      }
      if (s >= end) freeUntil = Math.min(freeUntil, s);
    }
  }
  const clear = freeUntil === Infinity ? 7 * DAY : freeUntil - NOW;
  const urgency = clear <= H ? 'tight' : clear <= 3 * H ? 'watch' : '';
  return { ok: true as const, freeUntil, clear, urgency, spaces, score: c.miles + (1 - c.avail) * 0.18 };
}

const esc = (s: string) => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]!));

export function mount(root: HTMLElement) {
  const list = root.querySelector<HTMLElement>('[data-list]')!;
  const blocked = root.querySelector<HTMLElement>('[data-blocked]')!;
  const blockedSum = root.querySelector<HTMLElement>('[data-blocked-sum]')!;
  const blockedWrap = root.querySelector<HTMLDetailsElement>('[data-blocked-wrap]')!;
  let hours = 2, vehFt = 18;

  function render() {
    const results = CURBS.map(c => ({ c, r: evaluate(c, hours, vehFt) }));
    const ok = results.filter(x => x.r.ok).sort((a, b) => (a.r as any).score - (b.r as any).score);
    const no = results.filter(x => !x.r.ok);

    list.innerHTML = ok.length ? ok.map(({ c, r }) => {
      const rr = r as Extract<typeof r, { ok: true }>;
      const [label, cls] = TIER_LABEL[c.tier];
      const until = rr.freeUntil === Infinity ? 'No restriction this week' : `Free until ${fmt(rr.freeUntil)}`;
      return `<li>
        <div class="st"><span>${esc(c.street)}</span><small>${c.miles.toFixed(2)} mi</small></div>
        <div class="clock"><span class="dot ${rr.urgency}"></span><span>${until} · ${span(rr.clear)}</span></div>
        <div class="meta"><span class="tier ${cls}">${label}</span><span class="sp">${c.curbFt} ft usable curb, about ${rr.spaces} space(s)</span></div>
      </li>`;
    }).join('') : `<li class="empty"><b>No free curb found</b><br>This window is too constrained nearby.</li>`;

    blocked.innerHTML = no.map(({ c, r }) => `<li><b>${esc(c.street)}</b><br>${esc((r as { reason: string }).reason)}</li>`).join('');
    blockedSum.textContent = `Not legal for this window (${no.length})`;
    blockedWrap.hidden = no.length === 0;
  }

  const bind = (sel: string, apply: (b: HTMLButtonElement) => void) => {
    const btns = [...root.querySelectorAll<HTMLButtonElement>(sel)];
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-checked', String(x === b)));
      apply(b);
      render();
    }));
  };
  bind('[data-hours]', b => { hours = +b.dataset.hours!; });
  bind('[data-ft]', b => { vehFt = +b.dataset.ft!; });
  render();
}
