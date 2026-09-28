// CúperOS window manager.
// Windows are server-rendered <section data-win hidden> elements; this module
// only positions, stacks, and animates them. Everything degrades to plain
// documents if JS never runs (the /read page and /projects/* exist for that).

export interface Geo { x: number; y: number; w: number; h: number }
// `want` is where the user put the window; `geo` is `want` clamped to the current viewport.
interface WinState { geo: Geo; want: Geo; max: boolean; min: boolean }
export interface OpenOpts { focus?: boolean; from?: DOMRect | null; geo?: Partial<Geo>; max?: boolean }

const SESSION_KEY = 'cuperos.session.v2';
const TASKBAR_H = 36;
const CASCADE = 26;

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isCompact = () => matchMedia('(max-width: 720px), (max-height: 520px)').matches;

class WindowManager extends EventTarget {
  private wins = new Map<string, HTMLElement>();
  private state = new Map<string, WinState>();
  private stack: string[] = [];         // bottom → top
  private taskOrder: string[] = [];     // order windows were opened, for the taskbar
  private z = 100;
  private taskbar: HTMLElement | null = null;
  private saveTimer = 0;

  init() {
    document.querySelectorAll<HTMLElement>('[data-win]').forEach(el => this.register(el));
    this.taskbar = document.getElementById('task-buttons');
    addEventListener('resize', () => this.reflowAll());
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [data-capture-keys]')) return;
      const top = this.focused();
      if (top) { e.preventDefault(); this.close(top); }
    });
  }

  private register(el: HTMLElement) {
    const id = el.id;
    this.wins.set(id, el);

    el.addEventListener('pointerdown', () => this.focus(id), { capture: true });

    el.querySelectorAll<HTMLButtonElement>('[data-act]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === 'close') this.close(id);
        else if (act === 'min') this.minimize(id);
        else if (act === 'max') this.toggleMax(id);
      });
    });

    const bar = el.querySelector<HTMLElement>('[data-drag]');
    if (bar) {
      this.makeDraggable(id, bar);
      bar.addEventListener('dblclick', e => {
        if ((e.target as HTMLElement).closest('.win-controls')) return;
        if (el.dataset.kind !== 'dialog') this.toggleMax(id);
      });
    }
    const grip = el.querySelector<HTMLElement>('[data-resize]');
    if (grip) this.makeResizable(id, grip);
  }

  has(id: string) { return this.wins.has(id); }
  isOpen(id: string) { return this.state.has(id); }
  isMinimized(id: string) { return !!this.state.get(id)?.min; }
  openIds() { return [...this.taskOrder]; }
  el(id: string) { return this.wins.get(id); }

  focused(): string | null {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const s = this.state.get(this.stack[i]);
      if (s && !s.min) return this.stack[i];
    }
    return null;
  }

  // ─── Geometry ──────────────────────────────────────────────

  private desk() {
    const tb = document.getElementById('taskbar')?.offsetHeight ?? TASKBAR_H;
    // A hidden or prerendered page can report a 0x0 viewport; plan for a typical screen
    // and let the resize handler re-fit once real dimensions exist.
    const w = innerWidth || 1280, h = (innerHeight || 800) - tb;
    return { w, h };
  }

  private initialGeo(el: HTMLElement): Geo {
    const d = this.desk();
    const w = Math.min(+el.dataset.w!, d.w - 16);
    const h = Math.min(+el.dataset.h!, d.h - 16);
    let x = el.dataset.x === 'center' ? Math.round((d.w - w) / 2) : +el.dataset.x!;
    let y = el.dataset.y === 'center' ? Math.round((d.h - h) / 2.4) : +el.dataset.y!;
    // Cascade off any open window sitting on the same spot
    for (let guard = 0; guard < 12; guard++) {
      const clash = [...this.state.values()].some(s => !s.min && Math.abs(s.geo.x - x) < 8 && Math.abs(s.geo.y - y) < 8);
      if (!clash) break;
      x += CASCADE; y += CASCADE;
    }
    return this.clamp({ x, y, w, h });
  }

  private clamp(g: Geo): Geo {
    const d = this.desk();
    const w = Math.max(240, Math.min(g.w, d.w));
    const h = Math.max(120, Math.min(g.h, d.h));
    // Keep at least the title bar reachable
    const x = Math.min(Math.max(g.x, -w + 80), d.w - 80);
    const y = Math.min(Math.max(g.y, 0), d.h - 30);
    return { x, y, w, h };
  }

  private apply(id: string) {
    const el = this.wins.get(id)!, s = this.state.get(id)!;
    const compact = isCompact();
    const dialog = el.dataset.kind === 'dialog';
    // On phones, app windows fill the screen and dialogs become content-height sheets
    el.classList.toggle('is-max', s.max || (compact && !dialog));
    el.classList.toggle('is-sheet', compact && dialog);
    el.style.left = `${s.geo.x}px`;
    el.style.top = `${s.geo.y}px`;
    el.style.width = `${s.geo.w}px`;
    el.style.height = `${s.geo.h}px`;
    const maxBtn = el.querySelector<HTMLButtonElement>('[data-act="max"]');
    if (maxBtn) maxBtn.setAttribute('aria-label', `${s.max ? 'Restore' : 'Maximize'} ${el.dataset.title}`);
  }

  private reflowAll() {
    this.state.forEach((s, id) => { s.geo = this.clamp(s.want); this.apply(id); });
  }

  // ─── Lifecycle ─────────────────────────────────────────────

  open(id: string, opts: OpenOpts = {}) {
    const el = this.wins.get(id);
    if (!el) return;
    const { focus = true, from = null } = opts;
    const first = !this.state.has(id);

    if (first) {
      const geo = { ...this.initialGeo(el), ...opts.geo };
      this.state.set(id, { geo: this.clamp(geo), want: geo, max: !!opts.max, min: false });
      this.taskOrder.push(id);
      el.hidden = false;
      this.apply(id);
      if (from) this.zoom(from, el.getBoundingClientRect());
      else if (!reduceMotion()) el.animate([{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 120, easing: 'cubic-bezier(.2,.9,.25,1)' });
    } else {
      const s = this.state.get(id)!;
      if (s.min) this.restore(id);
    }

    if (focus) this.focus(id);
    else this.raise(id);
    this.renderTaskbar();
    this.dispatchEvent(new CustomEvent('open', { detail: { id, first } }));
    this.persist();
  }

  close(id: string) {
    const el = this.wins.get(id);
    if (!el || !this.state.has(id)) return;
    el.hidden = true;
    el.classList.remove('is-focused', 'is-max');
    this.state.delete(id);
    this.stack = this.stack.filter(x => x !== id);
    this.taskOrder = this.taskOrder.filter(x => x !== id);
    const next = this.focused();
    if (next) this.focus(next);
    this.renderTaskbar();
    this.dispatchEvent(new CustomEvent('close', { detail: { id } }));
    this.persist();
  }

  minimize(id: string) {
    const el = this.wins.get(id), s = this.state.get(id);
    if (!el || !s || s.min) return;
    const target = this.taskbar?.querySelector<HTMLElement>(`[data-task="${id}"]`)?.getBoundingClientRect();
    if (target) this.zoom(el.getBoundingClientRect(), target);
    s.min = true;
    el.hidden = true;
    el.classList.remove('is-focused');
    const next = this.focused();
    if (next) this.focus(next);
    this.renderTaskbar();
    this.dispatchEvent(new CustomEvent('minimize', { detail: { id } }));
    this.persist();
  }

  restore(id: string) {
    const el = this.wins.get(id), s = this.state.get(id);
    if (!el || !s) return;
    if (s.min) {
      s.min = false;
      el.hidden = false;
      const from = this.taskbar?.querySelector<HTMLElement>(`[data-task="${id}"]`)?.getBoundingClientRect();
      if (from) this.zoom(from, el.getBoundingClientRect());
    }
    this.focus(id);
    this.persist();
  }

  toggleMax(id: string) {
    const s = this.state.get(id);
    if (!s || isCompact()) return;
    const el = this.wins.get(id)!;
    const before = el.getBoundingClientRect();
    s.max = !s.max;
    this.apply(id);
    this.zoom(before, el.getBoundingClientRect());
    this.focus(id);
    this.persist();
  }

  focus(id: string) {
    const el = this.wins.get(id), s = this.state.get(id);
    if (!el || !s) return;
    if (s.min) { this.restore(id); return; }
    this.raise(id);
    this.wins.forEach((w, wid) => w.classList.toggle('is-focused', wid === id));
    if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
    this.renderTaskbar();
    this.dispatchEvent(new CustomEvent('focus', { detail: { id } }));
  }

  private raise(id: string) {
    this.stack = this.stack.filter(x => x !== id).concat(id);
    const el = this.wins.get(id)!;
    if (+el.style.zIndex !== this.z) el.style.zIndex = String(++this.z);
  }

  // ─── Pointer interactions ──────────────────────────────────

  private makeDraggable(id: string, handle: HTMLElement) {
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
      const s = this.state.get(id);
      if (!s || s.max || isCompact()) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const ox = e.clientX - s.geo.x, oy = e.clientY - s.geo.y;
      let raf = 0;
      const move = (ev: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          s.geo = this.clamp({ ...s.geo, x: ev.clientX - ox, y: ev.clientY - oy });
          s.want = { ...s.geo };
          this.apply(id);
        });
      };
      const up = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        this.persist();
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }

  private makeResizable(id: string, grip: HTMLElement) {
    grip.addEventListener('pointerdown', e => {
      const s = this.state.get(id);
      if (e.button !== 0 || !s || s.max || isCompact()) return;
      e.preventDefault();
      e.stopPropagation();
      grip.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, sw = s.geo.w, sh = s.geo.h;
      let raf = 0;
      const move = (ev: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          s.geo = this.clamp({ ...s.geo, w: sw + ev.clientX - sx, h: sh + ev.clientY - sy });
          s.want = { ...s.geo };
          this.apply(id);
        });
      };
      const up = () => {
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', up);
        this.persist();
        this.dispatchEvent(new CustomEvent('resize', { detail: { id } }));
      };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', up);
    });
  }

  /** The Win95 "exploding rectangle": an outline that flies between two rects. */
  zoom(from: DOMRect, to: DOMRect) {
    if (reduceMotion()) return;
    const ghost = document.createElement('div');
    ghost.className = 'zoom-ghost';
    document.body.append(ghost);
    const frame = (r: DOMRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    ghost.animate([frame(from), frame(to)], { duration: 170, easing: 'steps(7, end)' }).finished.finally(() => ghost.remove());
  }

  // ─── Taskbar ───────────────────────────────────────────────

  private renderTaskbar() {
    const bar = this.taskbar;
    if (!bar) return;
    const top = this.focused();
    const existing = new Map([...bar.querySelectorAll<HTMLElement>('[data-task]')].map(b => [b.dataset.task!, b]));
    this.taskOrder.forEach(id => {
      let btn = existing.get(id);
      const el = this.wins.get(id)!;
      if (!btn) {
        const b = document.createElement('button');
        b.type = 'button';
        btn = b;
        btn.className = 'task-btn';
        btn.dataset.task = id;
        const icon = el.querySelector('.win-title svg')?.cloneNode(true);
        const label = document.createElement('span');
        label.textContent = el.dataset.title ?? id;
        if (icon) btn.append(icon);
        btn.append(label);
        btn.title = el.dataset.title ?? id;
        btn.addEventListener('click', () => {
          const s = this.state.get(id);
          if (!s) return;
          if (s.min) this.restore(id);
          else if (this.focused() === id) this.minimize(id);
          else this.focus(id);
        });
      }
      bar.append(btn); // re-append keeps DOM order == open order
      btn.setAttribute('aria-pressed', String(id === top));
      existing.delete(id);
    });
    existing.forEach(b => b.remove());
  }

  // ─── Session memory (per-viewer convenience only) ──────────

  private persist() {
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      try {
        const data = this.taskOrder.map(id => ({ id, ...this.state.get(id)!, z: this.stack.indexOf(id) }));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ at: Date.now(), wins: data }));
      } catch { /* storage unavailable: nothing to remember */ }
    }, 250);
  }

  readSession(): { at: number; wins: ({ id: string; z: number } & WinState)[] } | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return Array.isArray(s?.wins) ? s : null;
    } catch { return null; }
  }

  /** Re-open windows from a saved session, bottom of the stack first. */
  restoreSession(saved: NonNullable<ReturnType<WindowManager['readSession']>>) {
    [...saved.wins].sort((a, b) => a.z - b.z).forEach(w => {
      if (!this.has(w.id)) return;
      this.open(w.id, { focus: false, geo: w.geo, max: w.max });
      if (w.min) this.minimize(w.id);
    });
    const top = this.focused();
    if (top) this.focus(top);
  }
}

export const wm = new WindowManager();
