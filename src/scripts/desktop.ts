import { wm, isCompact } from './wm';
import { runBoot } from './boot';
import { initDos, type ProjectRec } from './dos';
import { sfx, setSound, soundEnabled } from './sound';
import { chooseStartupWindows, readContext, setWelcomeOptOut } from './startup';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

const data = JSON.parse($('#os-data')?.textContent ?? '{"projects":[],"today":"2026-01-01"}') as { projects: ProjectRec[]; today: string };
const bySlugWin = new Map(data.projects.map(p => [p.win, p]));

wm.init();
const dos = initDos(data.projects, data.today);

// ─── Opening things ───────────────────────────────────────────────

function openFrom(id: string, origin?: Element | null) {
  if (id === 'shutdown') { openShutdown(); return; }
  const from = origin && !wm.isOpen(id) ? origin.getBoundingClientRect() : null;
  wm.open(id, { from });
  closeStart();
}

document.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
  if (!el || el.classList.contains('ex-item')) return;
  e.preventDefault();
  openFrom(el.dataset.open!, el.querySelector('svg') ?? el);
});

wm.addEventListener('open', e => { if ((e as CustomEvent).detail.first) sfx.open(); });
wm.addEventListener('close', () => sfx.close());
wm.addEventListener('minimize', () => sfx.minimize());

// Desktop icons: select on focus, open on click (they are launchers)
$$('.desk-icon').forEach(icon => {
  icon.addEventListener('focus', () => { $$('.desk-icon').forEach(i => i.setAttribute('aria-selected', String(i === icon))); });
});
$('.desktop')?.addEventListener('pointerdown', e => {
  if (e.target === e.currentTarget) $$('.desk-icon').forEach(i => i.setAttribute('aria-selected', 'false'));
});

// ─── Clock ────────────────────────────────────────────────────────

const clock = $('#clock');
function tick() {
  if (!clock) return;
  const d = new Date();
  clock.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  clock.setAttribute('datetime', d.toISOString());
  clock.title = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
tick();
setInterval(tick, 10_000);

// ─── Start menu ───────────────────────────────────────────────────

const startBtn = $<HTMLButtonElement>('#start-btn');
const startMenu = $('#start-menu');

function openStart() {
  if (!startMenu || !startBtn) return;
  startMenu.hidden = false;
  startBtn.setAttribute('aria-expanded', 'true');
  startMenu.style.zIndex = '';
  $<HTMLElement>('.menu-item', startMenu)?.focus({ preventScroll: true });
  sfx.click();
}
function closeStart() {
  if (!startMenu || !startBtn || startMenu.hidden) return;
  startMenu.hidden = true;
  startBtn.setAttribute('aria-expanded', 'false');
  $$('.submenu', startMenu).forEach(s => (s.hidden = true));
  $$('[data-sub]', startMenu).forEach(b => b.setAttribute('aria-expanded', 'false'));
}
startBtn?.addEventListener('click', e => { e.stopPropagation(); startMenu?.hidden ? openStart() : closeStart(); });
document.addEventListener('pointerdown', e => {
  const t = e.target as HTMLElement;
  if (!t.closest('#start-menu') && !t.closest('#start-btn')) closeStart();
});

function toggleSub(btn: HTMLElement, open?: boolean) {
  const sub = document.getElementById(btn.dataset.sub!);
  if (!sub) return;
  const willOpen = open ?? sub.hidden;
  $$('[data-sub]', startMenu!).forEach(b => {
    if (b !== btn) { b.setAttribute('aria-expanded', 'false'); const s = document.getElementById(b.dataset.sub!); if (s) s.hidden = true; }
  });
  sub.hidden = !willOpen;
  btn.setAttribute('aria-expanded', String(willOpen));
  return sub;
}
$$('[data-sub]', startMenu ?? document).forEach(btn => {
  let hoverTimer = 0;
  btn.addEventListener('click', e => { e.stopPropagation(); toggleSub(btn); });
  btn.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => toggleSub(btn, true), 120);
  });
  btn.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
});
// Hovering a plain top-level item closes any open submenu (Win95 behaviour)
$$(':scope > li > .menu-item:not([data-sub])', $('#start-menu > .menu') ?? document).forEach(item => {
  item.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') $$('[data-sub]', startMenu!).forEach(b => toggleSub(b, false)); });
});

startMenu?.addEventListener('keydown', e => {
  const items = $$<HTMLElement>('.menu-item', startMenu).filter(i => i.offsetParent !== null);
  const idx = items.indexOf(document.activeElement as HTMLElement);
  const cur = items[idx];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const next = items[(idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
    next?.focus();
  } else if (e.key === 'ArrowRight' && cur?.dataset.sub) {
    e.preventDefault();
    const sub = toggleSub(cur, true);
    sub && $<HTMLElement>('.menu-item', sub)?.focus();
  } else if (e.key === 'ArrowLeft') {
    const parentSub = cur?.closest<HTMLElement>('.submenu');
    if (parentSub) {
      e.preventDefault();
      const owner = $<HTMLElement>(`[data-sub="${parentSub.id}"]`, startMenu);
      if (owner) { toggleSub(owner, false); owner.focus(); }
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeStart();
    startBtn?.focus();
  }
});

// Ctrl+Esc, the Win95 way to open Start (the Windows key belongs to the real OS)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && e.ctrlKey) { e.preventDefault(); startMenu?.hidden ? openStart() : closeStart(); }
});

// ─── Sound tray ───────────────────────────────────────────────────

const soundBtn = $<HTMLButtonElement>('#sound-btn');
function paintSound(on: boolean) {
  if (!soundBtn) return;
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.title = on ? 'Sound is on. Click to mute.' : 'Sound is off. Click to turn on.';
  $('.i-on', soundBtn)!.hidden = !on;
  $('.i-off', soundBtn)!.hidden = on;
}
paintSound(soundEnabled());
soundBtn?.addEventListener('click', () => { const on = !soundEnabled(); setSound(on); paintSound(on); });
document.addEventListener('os:sound', e => paintSound((e as CustomEvent).detail));

// ─── Welcome tips ─────────────────────────────────────────────────

const tips = JSON.parse($('#tips-data')?.textContent ?? '[]') as string[];
let tipIdx = 0;
const showTip = (i: number) => { tipIdx = i % tips.length; const el = $('#tip-text'); if (el) el.innerHTML = tips[tipIdx]; };
$('#tip-next')?.addEventListener('click', () => showTip(tipIdx + 1));
// "Just start typing" means nothing without a keyboard: lead with the OS instead
if (matchMedia('(pointer: coarse)').matches && tips.length > 1) showTip(1);
const welcomeAgain = $<HTMLInputElement>('#welcome-again');
try { if (welcomeAgain) welcomeAgain.checked = localStorage.getItem('cuperos.welcome') !== 'off'; } catch { /* ignore */ }
welcomeAgain?.addEventListener('change', () => setWelcomeOptOut(!welcomeAgain.checked));

// ─── Explorer ─────────────────────────────────────────────────────

const detail = $('#ex-detail');
const exStatus = $('#ex-status');
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function selectItem(item: HTMLElement) {
  $$('.ex-item').forEach(i => i.setAttribute('aria-selected', String(i === item)));
  const d = item.dataset;
  if (detail) {
    detail.innerHTML = `
      <h3>${esc(d.title!)}</h3>
      <p class="one">${esc(d.one!)}</p>
      <p class="row"><b>File</b> ${esc(d.file!)}</p>
      <p class="row"><b>Built with</b> ${esc(d.tech!)}</p>
      <p class="row"><b>Updated</b> ${esc(d.updated!)}</p>
      <button class="btn is-default" type="button" data-open="${esc(d.item!)}">Open</button>`;
  }
  if (exStatus) exStatus.textContent = d.one ?? '';
}
$$('.ex-item').forEach(item => {
  item.addEventListener('click', e => {
    if ((e as PointerEvent).pointerType === 'touch' || isCompact()) { openFrom(item.dataset.item!, item); return; }
    selectItem(item);
  });
  item.addEventListener('dblclick', () => openFrom(item.dataset.item!, item));
  item.addEventListener('focus', () => selectItem(item));
  item.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); openFrom(item.dataset.item!, item); } });
});
// Arrow keys move through the icon grid
$('.ex-files')?.addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
  const items = $$<HTMLElement>('.ex-item');
  const i = items.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const cols = Math.max(1, Math.round(items[0].parentElement!.clientWidth / items[0].offsetWidth));
  const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -i, End: items.length } as Record<string, number>;
  items[Math.min(items.length - 1, Math.max(0, i + step[e.key]))]?.focus();
});

// ─── Copy link (project windows) ─────────────────────────────────

document.addEventListener('click', async e => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy-link]');
  if (!btn) return;
  const url = `${location.origin}/?open=${btn.dataset.copyLink}`;
  const status = btn.closest('.win')?.querySelector('.win-status span:last-child');
  try {
    await navigator.clipboard.writeText(url);
    if (status) status.textContent = `Copied ${url}`;
    sfx.ding();
  } catch {
    if (status) status.textContent = url;
  }
});

document.addEventListener('click', async e => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-copy-text]');
  if (!btn) return;
  try { await navigator.clipboard.writeText(btn.dataset.copyText!); btn.textContent = 'Copied'; sfx.ding(); }
  catch { btn.textContent = 'Select it'; }
  setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
});

// Links inside write-ups like /?open=erdos open the window instead of reloading
document.addEventListener('click', e => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/?open="]');
  if (!a || a.hasAttribute('data-open') || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const id = `p-${new URL(a.href).searchParams.get('open')}`;
  if (!wm.has(id)) return;
  e.preventDefault();
  openFrom(id, a);
});

// ─── Shareable URLs follow the focused project ────────────────────

function syncUrl() {
  const top = wm.focused();
  const p = top ? bySlugWin.get(top) : undefined;
  const url = new URL(location.href);
  url.hash = '';
  url.searchParams.delete('boot');
  if (p) url.searchParams.set('open', p.slug); else url.searchParams.delete('open');
  if (url.href !== location.href) history.replaceState(null, '', url);
  document.title = p ? `${p.title} · CúperOS` : 'CúperOS · Cúper Anas';
}
['focus', 'close', 'minimize'].forEach(ev => wm.addEventListener(ev, syncUrl));

// ─── Shut Down ────────────────────────────────────────────────────

function openShutdown() {
  closeStart();
  wm.open('shutdown');
}
$('#shutdown-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const choice = (new FormData(e.target as HTMLFormElement).get('sd') as string) || 'off';
  wm.close('shutdown');
  if (choice === 'off') {
    wm.openIds().forEach(id => wm.close(id));
    const scr = $('#safe-off');
    if (scr) { scr.hidden = false; scr.focus(); }
  } else if (choice === 'restart') {
    try { sessionStorage.removeItem('cuperos.booted'); } catch { /* ignore */ }
    location.href = '/?boot=1';
  } else if (choice === 'dos') {
    wm.open('dos', { max: true });
    if (!document.getElementById('dos')?.classList.contains('is-max')) wm.toggleMax('dos');
  }
});
$('#safe-off')?.addEventListener('click', () => { location.href = '/?boot=1'; });
$('#safe-off')?.addEventListener('keydown', () => { location.href = '/?boot=1'; });

// ─── Type anywhere → MS-DOS Prompt ───────────────────────────────

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.defaultPrevented) return;
  const t = e.target as HTMLElement;
  if (t.closest('input, textarea, select, [contenteditable], [data-capture-keys], .v86-screen')) return;
  if (!/[a-z0-9?]/i.test(e.key)) return;
  if (document.documentElement.dataset.boot) return;
  e.preventDefault();
  dos.typeInto(e.key);
});

// Konami code: the old easter egg keeps working
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let k = 0;
document.addEventListener('keydown', e => {
  k = e.key === KONAMI[k] ? k + 1 : e.key === KONAMI[0] ? 1 : 0;
  if (k === KONAMI.length) { k = 0; wm.open('dos'); dos.run?.('neofetch'); }
});

// ─── Lazy demos: load a project's interactive panel when its window opens ──

const DEMOS: Record<string, () => Promise<{ mount: (root: HTMLElement) => void | (() => void) }>> = {
  toaru: () => import('./demos/toaru'),
  arnoldc: () => import('./demos/arnoldc'),
  erdos: () => import('./demos/erdos'),
  gpu: () => import('./demos/gpu'),
  ivc: () => import('./demos/ivc'),
  curbrun: () => import('./demos/curbrun'),
};
const mounted = new Set<string>();
wm.addEventListener('open', async e => {
  const { id } = (e as CustomEvent).detail;
  const root = document.getElementById(id)?.querySelector<HTMLElement>('[data-demo]');
  if (!root || mounted.has(id)) return;
  const load = DEMOS[root.dataset.demo!];
  if (!load) return;
  mounted.add(id);
  try { (await load()).mount(root); }
  catch (err) { console.error(`demo ${root.dataset.demo} failed`, err); root.dataset.state = 'error'; }
});

// ─── Startup ──────────────────────────────────────────────────────

runBoot(() => {
  const saved = wm.readSession();
  const ctx = readContext({ hasWindow: id => wm.has(id), sessionAgeMs: saved ? Date.now() - saved.at : null, compact: isCompact() });
  const plan = chooseStartupWindows(ctx);
  if (plan.restoreSession && saved) wm.restoreSession(saved);
  plan.open.filter(id => wm.has(id)).forEach(id => wm.open(id));
  syncUrl();
});
