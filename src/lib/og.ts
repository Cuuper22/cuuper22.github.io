// Open Graph cards, rendered at build time from local fonts (no network needed).
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pixelSvg, type IconName } from './pixel';

const require = createRequire(import.meta.url);
const geist = (w: number) => readFileSync(require.resolve(`@fontsource/geist-sans/files/geist-sans-latin-${w}-normal.woff`));
// Resolved from the project root: this module runs from a bundled chunk at build time
const departure = readFileSync(join(process.cwd(), 'public/fonts/DepartureMono-Regular.woff'));

const FONTS = [
  { name: 'Departure', data: departure, weight: 400 as const, style: 'normal' as const },
  { name: 'Geist', data: geist(400), weight: 400 as const, style: 'normal' as const },
  { name: 'Geist', data: geist(500), weight: 500 as const, style: 'normal' as const },
];

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node =>
  ({ type, props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children } });
const img = (name: IconName, size: number): Node =>
  ({ type: 'img', props: { src: `data:image/svg+xml,${encodeURIComponent(pixelSvg(name, size))}`, width: size, height: size } });

const ACC = '#5ef2ff';
const BEVEL = { borderTop: '2px solid #3a4668', borderLeft: '2px solid #3a4668', borderRight: '2px solid #010207', borderBottom: '2px solid #010207' };

/** The phosphor floor, as an SVG so satori can place it */
function gridFloor(): Node {
  let lines = '';
  for (let i = -24; i <= 24; i++) lines += `<line x1="${600 + i * 14}" y1="0" x2="${600 + i * 170}" y2="260" />`;
  for (let k = 1; k < 9; k++) { const y = Math.pow(k / 8, 2.1) * 260; lines += `<line x1="0" y1="${y}" x2="1200" y2="${y}" />`; }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="260"><g stroke="${ACC}" stroke-opacity="0.28" stroke-width="1.4">${lines}</g></svg>`;
  return { type: 'img', props: { src: `data:image/svg+xml,${encodeURIComponent(svg)}`, width: 1200, height: 260, style: { position: 'absolute', left: 0, bottom: 0 } } };
}

export interface OgInput { title: string; kicker: string; body: string; icon: IconName; tags?: string[]; icons?: IconName[] }

export async function renderOg({ title, kicker, body, icon, tags = [], icons = [] }: OgInput): Promise<Uint8Array> {
  const tree = h('div', { width: '100%', height: '100%', position: 'relative', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #02040a 0%, #060b18 58%, #07182a 100%)' },
    gridFloor(),
    h('div', { position: 'absolute', left: 0, right: 0, top: 368, height: 2, background: `linear-gradient(90deg, transparent, ${ACC}, transparent)`, opacity: 0.6 }),
    h('div', { position: 'absolute', right: 44, bottom: 26, color: 'rgba(231,236,251,0.6)', fontFamily: 'Departure', fontSize: 22 }, 'cuuper22.pages.dev'),
    h('div', { width: 1020, flexDirection: 'column', background: '#141a29', padding: 4, ...BEVEL, boxShadow: `0 0 0 1px rgba(94,242,255,0.35), 0 30px 60px rgba(0,0,0,0.6)` },
      h('div', { alignItems: 'center', gap: 12, padding: '8px 14px', background: 'linear-gradient(90deg, #0a2657, #0c6a86)', color: '#fff', fontFamily: 'Departure', fontSize: 22, borderTop: `1px solid ${ACC}` },
        img(icon, 32), kicker),
      h('div', { flexDirection: 'column', gap: 22, margin: 6, padding: '40px 46px 44px', background: '#0a0e1a', borderTop: '2px solid #010207', borderLeft: '2px solid #010207', borderRight: '2px solid #262f48', borderBottom: '2px solid #262f48' },
        h('div', { alignItems: 'center', gap: 28 },
          img(icon, 96),
          h('div', { fontFamily: 'Departure', fontSize: title.length > 20 ? 55 : 66, color: '#e7ecfb', lineHeight: 1 }, title)),
        h('div', { fontFamily: 'Geist', fontWeight: 400, fontSize: 30, lineHeight: 1.4, color: '#b1bbd8' }, body),
        tags.length ? h('div', { gap: 10, flexWrap: 'wrap' }, ...tags.slice(0, 5).map(t =>
          h('div', { fontFamily: 'Departure', fontSize: 20, padding: '4px 12px', background: '#141a29', color: '#b1bbd8', ...BEVEL }, t))) : h('div', {}, ''),
        icons.length ? h('div', { gap: 22 }, ...icons.map(i => img(i, 64))) : h('div', {}, ''),
      ),
    ),
  );

  const svg = await satori(tree as any, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
