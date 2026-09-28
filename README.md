# cuuper22.github.io

Cúper's portfolio site, built as a small retro desktop instead of another flat list of project cards.

The point of the site is not just to show finished projects. Each project window explains what pulled me into the problem, what I built, what the work revealed, and what a reviewer should inspect in the repo. The six pinned projects each ship with something you can touch: ToaruOS-Arnold actually boots, Erdos replays a solve, gpu_stack traces a real dependency path.

The design is intentionally personal: window chrome, project folders, a DOS prompt, Arabic hover notes, and enough friction removed that a hiring reviewer can still scan quickly. It is meant to feel like a builder's workbench, not a polished brochure pretending the messy parts never existed. For anyone in a hurry, [Quick read](https://cuuper22.pages.dev/read/) is the same content on one plain page.

Live: [cuuper22.pages.dev](https://cuuper22.pages.dev)

## Stack

- Astro 7, fully static, no UI framework. Client code is plain TypeScript, and each project demo is code-split and only loads when its window opens.
- Markdown content collection in `src/content/projects` (schema in `src/content.config.ts`).
- Pixel icons are 16×16 ASCII grids in the VGA palette (`src/lib/icons.ts`), rendered to SVG at build time (`src/lib/pixel.ts`).
- Two type families, both self-hosted: Departure Mono (the machine: chrome, headings, terminal, data) and Geist (long-form reading).
- The wallpaper is a single WebGL2 fragment shader (`src/scripts/wallpaper.ts`) with a CSS fallback.
- UI sounds are synthesized with WebAudio; the startup chime, system voice, and CRT power-off in `public/sfx/` were generated with ElevenLabs.
- Open Graph cards are generated at build time with Satori and resvg from local fonts (`src/lib/og.ts`).
- ToaruOS-Arnold runs in [v86](https://github.com/copy/v86) from `public/toaru/`.

## Run

```bash
npm install
npm run dev
```

Check, build, deploy:

```bash
npm run check
npm run build
npm run deploy          # production: cuuper22.pages.dev (needs `wrangler login`)
npm run deploy:preview  # preview.cuuper22.pages.dev
```

CI (`.github/workflows/ci.yml`) type-checks and builds every push, publishes `main` to the [cuuper22.github.io](https://cuuper22.github.io) mirror, and deploys to Cloudflare Pages once the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets exist.

## Telemetry

Visits are counted by two Cloudflare Pages Functions backed by D1 (`functions/api/`, schema in `migrations/`). The design is deliberately minimal: no cookies, no IP addresses, no user agents stored. A random id lives only as long as the browser tab; location is Cloudflare's country code; bots, Global Privacy Control, and Do Not Track are skipped. Public aggregates are served (edge-cached) at `/api/stats` and shown in the System Monitor window. Raw events are pruned after 180 days.

Query it yourself: `npx wrangler d1 execute cuperos --remote --command "SELECT day, COUNT(*) FROM sessions GROUP BY day"`.

## How to inspect

- `src/content/projects/`: the project write-ups. `tier: headline` projects are the GitHub pins.
- `src/scripts/wm.ts`: the window manager (drag, resize, minimize with the zoom-rect animation, taskbar, session memory).
- `src/scripts/dos.ts`: the MS-DOS Prompt, where the "filesystem" is the site itself.
- `src/scripts/startup.ts`: what opens when someone arrives (deep links, referrers, returning visitors).
- `src/components/demos/` and `src/scripts/demos/`: the interactive panel for each pinned project.

## ToaruOS in the browser

`public/toaru/toaruos-arnold-v86.elf` is the prebuilt kernel from [ToaruOS-Arnold](https://github.com/Cuuper22/ToaruOS-Arnold) with three loader-level patches so it boots under v86:

1. a flat GDT, since v86's multiboot loader never loads one;
2. the framebuffer address, which is `0xE0000000` in v86 and `0xFD000000` in QEMU;
3. a PS/2 mouse resync.

The proper source fixes belong in `boot/multiboot.asm` upstream. Networking is unavailable because v86 does not emulate an E1000.

Licenses for the redistributed binaries:

- ToaruOS-Arnold: MIT.
- v86 (`libv86.js`, `v86.wasm`): BSD-2-Clause.
- SeaBIOS and SeaVGABIOS: LGPLv3.

The license texts are next to the files in `public/toaru/`.
