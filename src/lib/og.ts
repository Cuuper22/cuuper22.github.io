// Open Graph cards, rendered at build time from local fonts (no network needed).
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pixelSvg, type IconName } from './pixel';

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));

const FONTS = [
  { name: 'Pixelify', data: font('pixelify-sans', 'pixelify-sans-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Pixelify', data: font('pixelify-sans', 'pixelify-sans-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Plex', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Plex', data: font('ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
];

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node =>
  ({ type, props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children } });
const img = (name: IconName, size: number): Node =>
  ({ type: 'img', props: { src: `data:image/svg+xml,${encodeURIComponent(pixelSvg(name, size))}`, width: size, height: size } });

const BEVEL = { borderTop: '2px solid #ffffff', borderLeft: '2px solid #ffffff', borderRight: '2px solid #0a0a0a', borderBottom: '2px solid #0a0a0a' };

export interface OgInput { title: string; kicker: string; body: string; icon: IconName; tags?: string[]; icons?: IconName[] }

export async function renderOg({ title, kicker, body, icon, tags = [], icons = [] }: OgInput): Promise<Uint8Array> {
  const tree = h('div', { width: '100%', height: '100%', background: '#008080', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    h('div', { position: 'absolute', right: 44, bottom: 30, color: 'rgba(255,255,255,0.55)', fontFamily: 'Pixelify', fontSize: 22, fontWeight: 400 }, 'cuuper22.pages.dev'),
    h('div', { width: 1000, flexDirection: 'column', background: '#c0c0c0', padding: 4, ...BEVEL, boxShadow: '6px 6px 0 rgba(0,0,0,0.35)' },
      h('div', { alignItems: 'center', gap: 12, padding: '8px 12px', background: 'linear-gradient(90deg, #000080, #1084d0)', color: '#fff', fontFamily: 'Pixelify', fontWeight: 700, fontSize: 26 },
        img(icon, 32), kicker),
      h('div', { flexDirection: 'column', gap: 22, margin: 6, padding: '40px 44px 44px', background: '#ffffff', borderTop: '2px solid #808080', borderLeft: '2px solid #808080', borderRight: '2px solid #dfdfdf', borderBottom: '2px solid #dfdfdf' },
        h('div', { alignItems: 'center', gap: 28 },
          img(icon, 96),
          h('div', { fontFamily: 'Pixelify', fontWeight: 700, fontSize: title.length > 22 ? 58 : 72, color: '#0a0a0a', lineHeight: 1 }, title)),
        h('div', { fontFamily: 'Plex', fontWeight: 400, fontSize: 30, lineHeight: 1.4, color: '#1a1a1a' }, body),
        tags.length ? h('div', { gap: 10, flexWrap: 'wrap' }, ...tags.slice(0, 5).map(t =>
          h('div', { fontFamily: 'Pixelify', fontWeight: 400, fontSize: 20, padding: '4px 12px', background: '#c0c0c0', color: '#0a0a0a', ...BEVEL }, t))) : h('div', {}, ''),
        icons.length ? h('div', { gap: 22 }, ...icons.map(i => img(i, 64))) : h('div', {}, ''),
      ),
    ),
  );

  const svg = await satori(tree as any, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
