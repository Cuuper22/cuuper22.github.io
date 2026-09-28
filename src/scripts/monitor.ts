// System Monitor window + the tray's "N online" indicator, both fed by /api/stats.
import { wm } from './wm';
import { fetchStats, telemetryOn, type Stats } from './telemetry';

const WIN = 'monitor';

export function initMonitor(titles: Map<string, string>) {
  const root = document.querySelector<HTMLElement>('#monitor .mon');
  const tray = document.getElementById('tray-online');
  if (!root) return;
  const $ = (s: string) => root.querySelector<HTMLElement>(s)!;
  const statusL = document.querySelector<HTMLElement>('#monitor [data-status-left]');
  const region = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; } })();
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  let last: Stats | null = null;
  let timer = 0;

  function bars(el: HTMLElement, rows: [string, number][], label: (k: string) => string) {
    if (!rows.length) { el.innerHTML = '<li><span class="none">Nothing yet. You could be first.</span></li>'; return; }
    const max = Math.max(...rows.map(r => r[1]));
    el.innerHTML = rows.map(([k, n]) => `<li><span title="${esc(label(k))}">${esc(label(k))}</span><span class="bt"><i style="width:${Math.max(4, (n / max) * 100)}%"></i></span><span class="n">${n.toLocaleString('en-US')}</span></li>`).join('');
  }

  function odometer(el: HTMLElement, n: number, prev: number | null) {
    const digits = String(n).padStart(6, '0').split('');
    el.innerHTML = digits.map(d => `<span>${d}</span>`).join('');
    el.setAttribute('aria-label', `${n.toLocaleString('en-US')} visits`);
    if (prev !== null && prev !== n && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.animate([{ filter: 'brightness(2.2)' }, { filter: 'none' }], { duration: 600, easing: 'ease-out' });
    }
  }

  function chart(hours: number[]) {
    const c = $('[data-chart]') as HTMLCanvasElement;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d')!;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    // grid
    g.strokeStyle = 'rgba(94,242,255,0.08)';
    g.lineWidth = 1;
    for (let y = 0.5; y < h; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const max = Math.max(1, ...hours);
    const bw = w / hours.length;
    hours.forEach((n, i) => {
      const bh = Math.round((n / max) * (h - 18));
      const x = Math.round(i * bw) + 2, y = h - bh - 1;
      const grad = g.createLinearGradient(0, y, 0, h);
      grad.addColorStop(0, i === hours.length - 1 ? '#ffb547' : '#5ef2ff');
      grad.addColorStop(1, 'rgba(12,106,134,0.35)');
      g.fillStyle = grad;
      g.shadowColor = 'rgba(94,242,255,0.55)';
      g.shadowBlur = n ? 8 : 0;
      g.fillRect(x, y, Math.max(2, Math.floor(bw) - 4), Math.max(bh, n ? 2 : 1));
    });
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(177,187,216,0.55)';
    g.font = '11px "Departure Mono", monospace';
    g.fillText('-24h', 4, 12);
    g.fillText('now', w - 26, 12);
  }

  function render(s: Stats) {
    root!.dataset.state = 'live';
    $('[data-online]').textContent = String(s.online);
    $('[data-today]').textContent = s.today.toLocaleString('en-US');
    odometer($('[data-total]'), s.total, last?.total ?? null);
    $('[data-countries]').textContent = String(s.countryCount);
    chart(s.hours);
    bars($('[data-where]'), s.countries, k => region?.of(k) ?? k);
    bars($('[data-what]'), s.windows, k => titles.get(k) ?? k);
    const dev = s.devices.reduce((a, [, n]) => a + n, 0) || 1;
    $('[data-devices]').textContent = 'Devices · ' + (s.devices.map(([k, n]) => `${k} ${Math.round((n / dev) * 100)}%`).join(' · ') || 'no data yet');
    $('[data-fun]').textContent = `ToaruOS booted ${s.osBoots.toLocaleString('en-US')} times · ${s.dosCommands.toLocaleString('en-US')} DOS commands typed` + (s.referrers.length ? ` · top referrer: ${s.referrers[0][0]}` : '');
    $('[data-at]').textContent = `updated ${new Date(s.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
    if (statusL) statusL.textContent = `${s.online} online`;
    last = s;
  }

  function paintTray(s: Stats | null) {
    if (!tray) return;
    tray.hidden = !s;
    if (s) {
      const label = tray.querySelector('span');
      if (label) label.textContent = String(s.online);
      tray.title = `${s.online} ${s.online === 1 ? 'person' : 'people'} online now · ${s.today} today. Open System Monitor.`;
    }
  }

  async function poll() {
    clearTimeout(timer);
    const s = await fetchStats();
    if (s) { paintTray(s); if (wm.isOpen(WIN)) render(s); }
    else if (wm.isOpen(WIN)) { root!.dataset.state = 'offline'; if (statusL) statusL.textContent = 'Offline'; }
    timer = window.setTimeout(poll, wm.isOpen(WIN) && !document.hidden ? 15_000 : 60_000);
  }

  wm.addEventListener('open', e => { if ((e as CustomEvent).detail.id === WIN) { if (last) render(last); void poll(); } });
  wm.addEventListener('resize', e => { if ((e as CustomEvent).detail.id === WIN && last) chart(last.hours); });
  tray?.addEventListener('click', () => wm.open(WIN));
  if (!telemetryOn) root.dataset.state = 'offline';
  // The first poll waits a moment so the visitor's own beacon is counted
  setTimeout(poll, telemetryOn ? 3000 : 0);
}
