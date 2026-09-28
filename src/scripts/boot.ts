// POST screen → splash → desktop, in under two seconds, skippable at any point.

type Line = [delayMs: number, html: string];

const LINES: Line[] = [
  [0, '<span class="hi">CúperBIOS 4.51PG</span>, An Arnold Energy Ally'],
  [40, 'Copyright (C) 2004-2026, Cúper Anas'],
  [100, ''],
  [50, 'Main Processor : Curiosity-586 @ 233MHz'],
  [40, 'Memory Testing : <span id="post-mem">0</span>K'],
  [380, ''],
  [50, 'Detecting Primary Master   ... <span class="hi">TOARUOS.ELF</span>   212,576 bytes'],
  [80, 'Detecting Primary Slave    ... <span class="hi">ARNOLDC.JAR</span>   native x86 backend'],
  [80, 'Detecting Secondary Master ... <span class="hi">ERDOS.LEAN</span>    theorem statement locked'],
  [80, 'Detecting Secondary Slave  ... <span class="hi">GPU_STACK.PY</span>  equation graph, 0 hidden assumptions'],
  [100, ''],
  [50, '<span class="ok">Verifying DMI Pool Data ........ Update Success</span>'],
  [70, 'Starting CúperOS...'],
];
const SPLASH_MS = 650;

export function runBoot(onDone: () => void) {
  const root = document.documentElement;
  const boot = document.getElementById('boot');
  if (!root.dataset.boot || !boot) { onDone(); return; }

  const out = document.getElementById('post-text')!;
  const timers: number[] = [];
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    try { sessionStorage.setItem('cuperos.booted', '1'); } catch { /* ignore */ }
    boot.classList.add('is-leaving');
    delete root.dataset.boot;           // desktop becomes visible under the fade
    onDone();
    setTimeout(() => boot.remove(), 260);
    removeEventListener('keydown', skip, true);
    removeEventListener('pointerdown', skip, true);
  };
  const skip = (e: Event) => {
    if (e instanceof KeyboardEvent && e.key === 'Delete') {
      out.insertAdjacentHTML('beforeend', '\n<span class="hi">SETUP is locked. It was never going to let you in.</span>');
    }
    e.preventDefault();
    finish();
  };
  addEventListener('keydown', skip, true);
  addEventListener('pointerdown', skip, true);

  let t = 0;
  LINES.forEach(([delay, html]) => {
    t += delay;
    timers.push(window.setTimeout(() => {
      out.insertAdjacentHTML('beforeend', (out.childNodes.length ? '\n' : '') + html);
      if (html.includes('post-mem')) countMemory();
    }, t));
  });
  t += 200;
  timers.push(window.setTimeout(() => {
    document.getElementById('post')!.hidden = true;
    document.getElementById('splash')!.hidden = false;
  }, t));
  timers.push(window.setTimeout(finish, t + SPLASH_MS));

  function countMemory() {
    const el = document.getElementById('post-mem');
    if (!el) return;
    const start = performance.now(), total = 65536, dur = 360;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      el.textContent = String(Math.floor(total * k / 1024) * 1024);
      if (k < 1 && !finished) requestAnimationFrame(tick);
      else el.insertAdjacentHTML('afterend', ' <span class="ok">OK</span>');
    };
    requestAnimationFrame(tick);
  }
}
