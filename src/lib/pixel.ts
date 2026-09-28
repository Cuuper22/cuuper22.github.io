// Pixel-art icon renderer.
//
// Every icon on the site is a 16x16 grid drawn in the 16-colour VGA palette,
// rendered to an SVG of merged horizontal runs at build time. One grid size and
// one palette is what keeps the whole set looking like it shipped together.

import { ICONS } from './icons';

export const VGA: Record<string, string> = {
  k: '#000000', // black
  w: '#ffffff', // white
  l: '#c0c0c0', // light gray (window chrome)
  d: '#808080', // dark gray
  n: '#000080', // navy (title bars)
  b: '#0000ff', // blue
  t: '#008080', // teal (desktop)
  c: '#00ffff', // cyan
  m: '#800000', // maroon
  r: '#ff0000', // red
  o: '#808000', // olive
  y: '#ffff00', // yellow
  g: '#008000', // green
  e: '#00ff00', // lime
  p: '#800080', // purple
  P: '#ff00ff', // magenta
};

export type IconName = keyof typeof ICONS;

/** Validate a grid: 16 rows of 16 known palette keys. Throws at build time. */
function check(name: string, rows: readonly string[]): void {
  if (rows.length !== 16) throw new Error(`icon "${name}": ${rows.length} rows, expected 16`);
  rows.forEach((row, y) => {
    if (row.length !== 16) throw new Error(`icon "${name}" row ${y}: length ${row.length}, expected 16 → "${row}"`);
    for (const ch of row) if (ch !== '.' && !VGA[ch]) throw new Error(`icon "${name}" row ${y}: unknown colour "${ch}"`);
  });
}

/** Merge runs of the same colour per row into single <rect>s to keep markup small. */
function rects(rows: readonly string[]): string {
  let out = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let len = 1;
      while (x + len < row.length && row[x + len] === ch) len++;
      if (ch !== '.') out += `<rect x="${x}" y="${y}" width="${len}" height="1" fill="${VGA[ch]}"/>`;
      x += len;
    }
  });
  return out;
}

const cache = new Map<string, string>();

/** Inline SVG markup for an icon at `size` CSS pixels (a multiple of 16 stays crisp). */
export function pixelSvg(name: IconName, size = 32, extraAttrs = ''): string {
  const key = `${name}:${size}:${extraAttrs}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = ICONS[name];
  check(name, rows);
  const svg = `<svg class="px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true" focusable="false" ${extraAttrs}>${rects(rows)}</svg>`;
  cache.set(key, svg);
  return svg;
}

/** One-colour glyphs (title-bar buttons, menu arrows) drawn in currentColor. */
export const GLYPHS = {
  min: ['........', '........', '........', '........', '........', '..######', '..######'],
  max: ['#########', '#########', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#########'],
  restore: ['..######', '..######', '..#....#', '######.#', '######.#', '#....###', '#....#..', '######..'],
  close: ['##....##', '.##..##.', '..####..', '...##...', '..####..', '.##..##.', '##....##'],
  arrowR: ['#...', '##..', '###.', '####', '###.', '##..', '#...'],
  check: ['......#', '.....##', '#...###', '##.###.', '#####..', '.###...', '..#....'],
} as const;

export function glyphSvg(name: keyof typeof GLYPHS): string {
  const rows = GLYPHS[name];
  const w = rows[0].length, h = rows.length;
  let r = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      if (row[x] !== '#') { x++; continue; }
      let len = 1;
      while (x + len < w && row[x + len] === '#') len++;
      r += `<rect x="${x}" y="${y}" width="${len}" height="1"/>`;
      x += len;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${r}</svg>`;
}

/** The classic 12x19 Win95 arrow. X = black, W = white. */
const ARROW = [
  'X...........', 'XX..........', 'XWX.........', 'XWWX........', 'XWWWX.......',
  'XWWWWX......', 'XWWWWWX.....', 'XWWWWWWX....', 'XWWWWWWWX...', 'XWWWWWWWWX..',
  'XWWWWWWWWWX.', 'XWWWWWWXXXXX', 'XWWWXWWX....', 'XWWXXWWX....', 'XWX..XWWX...',
  'XX...XWWX...', 'X.....XWWX..', '......XWWX..', '.......XX...',
];

export function cursorCss(): string {
  let r = '';
  ARROW.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '.') r += `<rect x='${x}' y='${y}' width='1' height='1' fill='${ch === 'X' ? '#000' : '#fff'}'/>`;
  }));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='19' shape-rendering='crispEdges'>${r}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0, default`;
}

/** data: URI form, for CSS backgrounds and cursors. */
export function pixelDataUri(name: IconName): string {
  const svg = pixelSvg(name, 16).replace(' class="px"', '').replace(/ aria-hidden="true" focusable="false" /, ' ');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
