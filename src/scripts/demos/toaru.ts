// Boots the real ToaruOS-Arnold kernel in v86 (x86 → WebAssembly).
import { wm } from '../wm';
import { track } from '../telemetry';

declare global { interface Window { V86?: any } }

const WIN = 'p-toaruos-arnold';
const BASE = '/toaru/';

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.V86) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.append(s);
  });
}

export function mount(root: HTMLElement) {
  const screen = root.querySelector<HTMLElement>('.v86-screen')!;
  const overlay = root.querySelector<HTMLElement>('[data-overlay]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const bar = root.querySelector<HTMLElement>('[data-bar]')!;
  const led = root.querySelector<HTMLElement>('[data-led]')!;
  const hint = root.querySelector<HTMLElement>('[data-hint]')!;
  const powerOn = root.querySelector<HTMLButtonElement>('[data-power-on]')!;
  const powerOff = root.querySelector<HTMLButtonElement>('[data-power]')!;
  const cad = root.querySelector<HTMLButtonElement>('[data-cad]')!;

  let emu: any = null;
  let booting = false;

  const setStatus = (text: string, pct?: number) => {
    status.textContent = text;
    if (pct !== undefined) bar.style.width = `${Math.round(pct * 100)}%`;
  };

  async function boot() {
    if (emu || booting) return;
    booting = true;
    overlay.hidden = false;
    powerOn.hidden = true;
    led.className = 'led busy';
    setStatus('Loading emulator...', 0.02);
    try {
      await loadScript(`${BASE}libv86.js`);
      emu = new window.V86!({
        wasm_path: `${BASE}v86.wasm`,
        bios: { url: `${BASE}seabios.bin` },
        vga_bios: { url: `${BASE}vgabios.bin` },
        multiboot: { url: `${BASE}toaruos-arnold-v86.elf` },
        memory_size: 64 * 1024 * 1024,
        vga_memory_size: 4 * 1024 * 1024,
        acpi: false,
        disable_speaker: true,
        screen_container: screen,
        autostart: true,
      });
    } catch (err) {
      booting = false;
      led.className = 'led';
      setStatus('Could not load the emulator. Your browser may block WebAssembly here.');
      powerOn.hidden = false;
      console.error(err);
      return;
    }

    emu.add_listener('download-progress', (e: any) => {
      const per = e.total ? e.loaded / e.total : 0;
      setStatus(`Loading ${String(e.file_name).split('/').pop()}...`, (e.file_index + per) / e.file_count);
    });
    emu.add_listener('download-error', () => setStatus('Download failed. Check your connection and press Power again.'));
    emu.add_listener('emulator-started', () => {
      setStatus('POST... booting kernel', 1);
      emu.keyboard_set_enabled(document.activeElement === screen);
      powerOff.disabled = false;
      cad.disabled = false;
    });
    // Hide our overlay once the kernel switches the card into its 1024x768 graphics mode
    emu.add_listener('screen-set-size', (dims: number[]) => {
      if (dims?.[0] >= 1024 && dims?.[1] >= 768) reveal();
    });
    setTimeout(() => { if (emu) reveal(); }, 9000);
  }

  function reveal() {
    if (booting) track('os');
    if (!booting) return;
    booting = false;
    overlay.hidden = true;
    led.className = 'led on';
    hint.textContent = 'Click the screen to use the mouse (Esc releases it). Try the Terminal icon, then neofetch.';
  }

  async function shutdown() {
    const e = emu;
    emu = null;
    booting = false;
    led.className = 'led';
    powerOff.disabled = true;
    cad.disabled = true;
    overlay.hidden = false;
    powerOn.hidden = false;
    setStatus("HASTA LA VISTA, BABY. It's now safe to power on again.", 0);
    if (!e) return;
    try { e.stop(); await e.destroy?.(); } catch { /* already gone */ }
    screen.querySelector('canvas')?.getContext('2d')?.clearRect(0, 0, 9999, 9999);
  }

  // Keyboard only goes to the guest while its screen has focus
  screen.addEventListener('focus', () => emu?.keyboard_set_enabled(true));
  screen.addEventListener('blur', () => emu?.keyboard_set_enabled(false));
  screen.addEventListener('click', () => {
    screen.focus({ preventScroll: true });
    if (emu && !booting) emu.lock_mouse();
  });

  powerOn.addEventListener('click', boot);
  powerOff.addEventListener('click', shutdown);
  cad.addEventListener('click', () => emu?.keyboard_send_scancodes([0x1d, 0x38, 0x53, 0x9d, 0xb8, 0xd3]));

  // Pause while hidden, stop on close, boot again on re-open
  wm.addEventListener('minimize', e => { if ((e as CustomEvent).detail.id === WIN) emu?.stop(); });
  wm.addEventListener('focus', e => { if ((e as CustomEvent).detail.id === WIN && emu && !emu.is_running()) emu.run(); });
  wm.addEventListener('close', e => { if ((e as CustomEvent).detail.id === WIN) void shutdown(); });
  wm.addEventListener('open', e => { const d = (e as CustomEvent).detail; if (d.id === WIN && d.first) void boot(); });
  document.addEventListener('visibilitychange', () => {
    if (!emu) return;
    if (document.hidden) emu.stop(); else if (wm.isOpen(WIN) && !wm.isMinimized(WIN)) emu.run();
  });

  void boot();
}
