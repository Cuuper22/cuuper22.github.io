// MS-DOS Prompt. A tiny shell over the desktop: the "filesystem" is the site.
import { wm } from './wm';
import { sfx, setSound, soundEnabled } from './sound';

export interface ProjectRec { slug: string; title: string; file: string; oneLiner: string; updated: string; size: number; tier: string; win: string }

interface FileRec { name: string; ext: string; size: number; date: string; win?: string; text?: () => string; dir?: boolean }

const ROOT = 'C:\\CUPER';
const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const pad = (s: string, n: number) => s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
const lpad = (s: string, n: number) => s.length >= n ? s : ' '.repeat(n - s.length) + s;
const commas = (n: number) => n.toLocaleString('en-US');

function dosDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${m}-${d}-${y.slice(2)}`;
}
function dosTime(seed: string) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const hr = (h % 12) + 1, mi = (h >>> 4) % 60;
  return `${lpad(String(hr), 2)}:${String(mi).padStart(2, '0')}${h & 1 ? 'p' : 'a'}`;
}

export function initDos(projects: ProjectRec[], today: string) {
  const win = document.getElementById('dos');
  const outEl = document.getElementById('dos-out');
  const inputEl = document.getElementById('dos-in') as HTMLInputElement | null;
  const promptNode = document.getElementById('dos-prompt');
  if (!win || !outEl || !inputEl || !promptNode) return { typeInto: () => {}, run: () => {} };
  const out: HTMLElement = outEl, input: HTMLInputElement = inputEl, promptEl: HTMLElement = promptNode;

  let cwd: 'root' | 'projects' | 'recycled' = 'root';
  const history: string[] = [];
  let hIdx = 0;

  const docText = (id: string) => () => (document.querySelector(`#${id} .prose`) as HTMLElement | null)?.innerText.trim() ?? '';

  const rootFiles: FileRec[] = [
    { name: 'ABOUT', ext: 'TXT', size: 2873, date: today, win: 'about', text: docText('about') },
    { name: 'ARC', ext: 'TXT', size: 1422, date: today, win: 'arc', text: docText('arc') },
    { name: 'CONTACT', ext: 'TXT', size: 311, date: today, win: 'contact', text: () => (document.querySelector('#contact .contact-list') as HTMLElement | null)?.innerText.trim() ?? '' },
    { name: 'WELCOME', ext: 'EXE', size: 4410, date: today, win: 'welcome' },
    { name: 'PROJECTS', ext: '', size: 0, date: today, dir: true },
    { name: 'RECYCLED', ext: '', size: 0, date: today, dir: true },
  ];
  const projectFiles: FileRec[] = projects.map(p => {
    const [name, ext] = p.file.split('.');
    return { name, ext, size: p.size, date: p.updated, win: p.win, text: () => `${p.title}\n${p.oneLiner}` };
  });
  const filesIn = () => cwd === 'root' ? rootFiles : cwd === 'projects' ? projectFiles : [];
  const cwdPath = () => cwd === 'root' ? ROOT : `${ROOT}\\${cwd.toUpperCase()}`;

  const setPrompt = () => { promptEl.textContent = `${cwdPath()}>`; };
  setPrompt();

  function print(html = '') {
    out.insertAdjacentHTML('beforeend', html + '\n');
    const body = out.parentElement!;
    body.scrollTop = body.scrollHeight;
  }

  function findFile(arg: string): FileRec | undefined {
    const a = arg.toUpperCase().replace(/^PROJECTS\\/, '');
    const all = [...filesIn(), ...projectFiles, ...rootFiles];
    return all.find(f => `${f.name}.${f.ext}` === a || f.name === a)
      ?? all.find(f => f.name.startsWith(a) && a.length >= 3);
  }
  function findProject(arg: string): ProjectRec | undefined {
    const a = arg.toLowerCase();
    return projects.find(p => p.slug === a || p.file.toLowerCase() === a || p.file.split('.')[0].toLowerCase() === a)
      ?? projects.find(p => p.title.toLowerCase().includes(a) && a.length >= 3);
  }

  const WINDOW_ALIASES: Record<string, string> = {
    about: 'about', arc: 'arc', contact: 'contact', mail: 'contact', projects: 'projects', explorer: 'projects',
    welcome: 'welcome', help: 'welcome', recycle: 'recycle', toaru: 'p-toaruos-arnold', toaruos: 'p-toaruos-arnold',
  };

  function start(arg: string) {
    if (!arg) { print('Required parameter missing'); return; }
    const key = arg.toLowerCase().replace(/\.(exe|txt|com)$/, '');
    const target = WINDOW_ALIASES[key] ?? findProject(arg)?.win ?? findFile(arg)?.win;
    if (target && wm.has(target)) { wm.open(target); print(`Starting ${esc(arg.toUpperCase())}...`); }
    else { print('Bad command or file name'); sfx.error(); }
  }

  const HELP = [
    ['DIR', 'List files (try it in PROJECTS)'],
    ['CD name', 'Change directory. CD .. goes up'],
    ['TYPE file', 'Print a text file, e.g. TYPE ABOUT.TXT'],
    ['START name', 'Open a window or project, e.g. START ERDOS'],
    ['CLS', 'Clear the screen'],
    ['VER, DATE, TIME, MEM', 'System information'],
    ['SOUND ON|OFF', 'Toggle UI sounds'],
    ['EXIT', 'Close this window'],
  ];

  const cmds: Record<string, (arg: string, raw: string) => void> = {
    help() {
      print('For more information on a command, try it.\n');
      HELP.forEach(([c, d]) => print(`${pad(c, 22)}${d}`));
      print('\n<span class="dim">Some commands are not listed. Arnold would know them.</span>');
    },
    dir() {
      const files = filesIn();
      print(` Volume in drive C is CUPEROS\n Volume Serial Number is 2205-1995\n Directory of ${cwdPath()}\n`);
      if (cwd !== 'root') print(`.            &lt;DIR&gt;        ${dosDate(today)}  ${dosTime('.')}\n..           &lt;DIR&gt;        ${dosDate(today)}  ${dosTime('..')}`);
      let bytes = 0;
      files.forEach(f => {
        bytes += f.size;
        const size = f.dir ? '&lt;DIR&gt;     ' : lpad(commas(f.size), 11);
        const line = `${pad(f.name, 8)} ${pad(f.ext, 3)} ${size} ${dosDate(f.date)}  ${dosTime(f.name)}`;
        print(f.win ? `<button class="dos-link" type="button" data-dos-open="${f.win}">${line}</button>` : f.dir ? `<button class="dos-link" type="button" data-dos-cd="${f.name}">${line}</button>` : line);
      });
      if (cwd === 'recycled') print('File not found. Everything in here shipped.');
      const n = files.filter(f => !f.dir).length, d = files.filter(f => f.dir).length;
      print(`${lpad(String(n), 9)} file(s) ${lpad(commas(bytes), 14)} bytes\n${lpad(String(d), 9)} dir(s)  ${lpad(commas(1_048_576), 14)} bytes free`);
    },
    ls(a, r) { cmds.dir(a, r); },
    cd(arg) {
      const a = arg.toUpperCase().replace(/\\$/, '');
      if (!a) { print(cwdPath()); return; }
      if (a === '..' || a === '\\' || a === ROOT) cwd = 'root';
      else if (cwd === 'root' && (a === 'PROJECTS' || a === 'RECYCLED')) cwd = a.toLowerCase() as typeof cwd;
      else { print('Invalid directory'); sfx.error(); return; }
      setPrompt();
    },
    type(arg) {
      if (!arg) { print('Required parameter missing'); return; }
      const f = findFile(arg);
      if (!f?.text) { print('File not found'); sfx.error(); return; }
      print(esc(f.text()));
    },
    cat(a, r) { cmds.type(a, r); },
    start(arg) { start(arg); },
    open(arg) { start(arg); },
    cls() { out.textContent = ''; },
    clear() { out.textContent = ''; },
    ver() { print('\nCúperOS [Version 22.5.2026]\n'); },
    date() { print(`Current date is ${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })}`); },
    time() { print(`Current time is ${new Date().toLocaleTimeString('en-US')}`); },
    mem() {
      print(`\nMemory Type        Total  =   Used  +   Free\n----------------  -------   -------   -------\nConventional          640K      ${projects.length}K      ${640 - projects.length}K\nCuriosity         unbounded       all       ???\n\n${lpad(String(projects.length), 3)} projects loaded high. Largest executable: TOARUOS.EXE (212,576 bytes)`);
    },
    whoami() { print('cuper\\yousef  (Cúper Anas: systems, agents, verification, product-shaped tools)'); },
    echo(_a, raw) { print(esc(raw.replace(/^echo\s?/i, '')) || 'ECHO is on.'); },
    neofetch() {
      print(`<span class="hi">   .--.     </span>cuper@CUPEROS\n<span class="hi">  |o_o |    </span>-------------\n<span class="hi">  |:_/ |    </span>OS: CúperOS 22.5 (x86, sort of)\n<span class="hi"> //   \\ \\   </span>Kernel: ArnoldC-Native\n<span class="hi">(|     | )  </span>Projects: ${projects.length}\n<span class="hi">/'\\_   _/\`\\ </span>Pinned: ${projects.filter(p => p.tier === 'headline').length}\n<span class="hi">\\___)=(___/ </span>Motto: build it until the hard boundary shows up`);
    },
    sound(arg) {
      const on = arg.toLowerCase() === 'on' ? true : arg.toLowerCase() === 'off' ? false : !soundEnabled();
      setSound(on);
      document.dispatchEvent(new CustomEvent('os:sound', { detail: on }));
      print(`Sound is ${on ? 'ON' : 'OFF'}.`);
    },
    exit() { wm.close('dos'); },
    reboot() { location.href = '/?boot=1'; },
    win() { print("You're already in it."); },
    format(arg) {
      if (!/^c:?$/i.test(arg)) { print('Required parameter missing'); return; }
      print('WARNING, ALL DATA ON NON-REMOVABLE DISK\nDRIVE C: WILL BE LOST!\nProceed with Format (Y/N)? <span class="hi">N</span>\n\nWise.');
    },
    sudo() { print("This is DOS. There is no sudo. There is only Arnold."); sfx.error(); },
    rm() { print("I'LL BE BACK. (Nice try.)"); },
  };

  // Arnold mode: ArnoldC keywords that do things
  const ARNOLD: [RegExp, (m: RegExpMatchArray) => void][] = [
    [/^i'?ll be back$/i, () => {
      const open = wm.openIds().filter(id => id !== 'dos' && !wm.isMinimized(id));
      open.forEach(id => wm.minimize(id));
      print('<span class="hi">I\'LL BE BACK</span>');
      setTimeout(() => { open.forEach(id => wm.restore(id)); wm.focus('dos'); print("I'm back."); }, 1600);
    }],
    [/^hasta la vista,? baby$/i, () => {
      wm.openIds().filter(id => id !== 'dos').forEach(id => wm.close(id));
      print('<span class="hi">HASTA LA VISTA, BABY</span>  (all other processes terminated)');
    }],
    [/^get to the chopper$/i, () => { print('<span class="hi">GET TO THE CHOPPER</span>  → booting ToaruOS-Arnold'); wm.open('p-toaruos-arnold'); }],
    [/^it'?s showtime$/i, () => {
      print(`<span class="dim">; hello.arnoldc</span>\nIT'S SHOWTIME\nTALK TO THE HAND "hello from CúperOS"\nYOU HAVE BEEN TERMINATED\n\n<span class="dim">$ arnoldc hello.arnoldc &amp;&amp; ./hello</span>\nhello from CúperOS`);
    }],
    [/^talk to the hand\s+"?(.+?)"?$/i, m => print(esc(m[1].toUpperCase()))],
    [/^you have been terminated$/i, () => wm.close('dos')],
    [/^everybody chill$/i, () => print('Interrupts disabled. (CLI)\nNothing can bother you now.')],
    [/^(do it now|consider that a divorce|stick around)$/i, () => print('Right keyword, wrong context. Try TYPE ARC.TXT for the full story.')],
  ];

  function run(raw: string) {
    const line = raw.trim();
    print(`${esc(cwdPath())}&gt;${esc(line)}`);
    if (!line) return;
    history.push(line);
    hIdx = history.length;

    for (const [re, fn] of ARNOLD) {
      const m = line.match(re);
      if (m) { sfx.ding(); fn(m); print(''); return; }
    }
    const [cmdRaw, ...rest] = line.split(/\s+/);
    let cmd = cmdRaw.toLowerCase();
    const arg = rest.join(' ');
    if (cmd === 'cd..') { cmds.cd('..', line); print(''); return; }
    if (cmd === '?') cmd = 'help';
    const fn = Object.hasOwn(cmds, cmd) ? cmds[cmd] : undefined;
    if (fn) fn(arg, line);
    else {
      // Typing a file name runs it, like DOS
      const f = findFile(cmdRaw) ?? (findProject(cmdRaw) ? { win: findProject(cmdRaw)!.win } as FileRec : undefined);
      if (f?.win) { wm.open(f.win); print(`Starting ${esc(cmdRaw.toUpperCase())}...`); }
      else { print('Bad command or file name'); sfx.error(); }
    }
    print('');
  }

  function complete() {
    const v = input.value;
    const parts = v.split(' ');
    const last = parts.pop() ?? '';
    if (!last) return;
    const pool = parts.length
      ? [...filesIn(), ...(cwd === 'root' ? projectFiles : [])].map(f => f.ext ? `${f.name}.${f.ext}` : f.name)
      : [...Object.keys(cmds), ...filesIn().map(f => f.ext ? `${f.name}.${f.ext}` : f.name)].map(s => s.toUpperCase());
    const hits = pool.filter(s => s.toUpperCase().startsWith(last.toUpperCase()));
    if (hits.length === 1) input.value = [...parts, hits[0]].join(' ') + (parts.length ? '' : ' ');
    else if (hits.length > 1) { print(`${esc(cwdPath())}&gt;${esc(v)}`); print(hits.join('  ')); }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); const v = input.value; input.value = ''; run(v); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) input.value = history[--hIdx] ?? ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] ?? ''; }
    else if (e.key === 'Tab') { e.preventDefault(); complete(); }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.textContent = ''; }
    else if (e.key.length === 1) sfx.key();
  });

  // Clicking a line in `dir` output opens it; clicking anywhere else focuses the prompt
  win.querySelector('.win-body')?.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    const openBtn = t.closest<HTMLElement>('[data-dos-open]');
    const cdBtn = t.closest<HTMLElement>('[data-dos-cd]');
    if (openBtn) { wm.open(openBtn.dataset.dosOpen!); return; }
    if (cdBtn) { run(`cd ${cdBtn.dataset.dosCd}`); run('dir'); return; }
    if (!getSelection()?.toString()) input.focus({ preventScroll: true });
  });

  wm.addEventListener('open', e => {
    const { id } = (e as CustomEvent).detail;
    if (id === 'dos') requestAnimationFrame(() => input.focus({ preventScroll: true }));
  });
  wm.addEventListener('focus', e => {
    if ((e as CustomEvent).detail.id === 'dos') input.focus({ preventScroll: true });
  });

  return {
    /** Open the prompt with a first character already typed (type-to-start). */
    typeInto(ch: string) {
      wm.open('dos');
      input.value += ch;
      input.focus({ preventScroll: true });
    },
    run,
  };
}
