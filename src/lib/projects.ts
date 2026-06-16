// Single source of truth for per-project icons and display order.
// Imported by index.astro and ProjectPage.astro; the command palette and
// start menu are generated from the content collection so this never drifts
// out of sync with src/content/projects again.

export const iconMap: Record<string, string> = {
  'toaruos-arnold': 'px-proj-shades',
  'erdos': 'px-proj-graph',
  'gpu-stack': 'px-proj-stack',
  'anti-slop-design': 'px-proj-palette',
  'physicslab': 'px-proj-atom',
  'jobhunter': 'px-proj-target',
  'ai-tax-cpa-agent': 'px-proj-coin',
  'curbrun': 'px-proj-pin',
  'codex-canmore': 'px-proj-board',
  'waypoint-differentiation-lab': 'px-proj-compass',
  'bennycutools': 'px-proj-wrench',
  'healthos': 'px-proj-medic',
  'bee': 'px-proj-bee',
  'claude-sfx': 'px-proj-speaker',
  'agent-rate-forecast': 'px-proj-gauge',
  'pact': 'px-proj-lock',
  'ivc': 'px-proj-tablet',
};

// Explicit display order within each tier. Slugs not listed sort last.
export const projectOrder: string[] = [
  // highlights
  'toaruos-arnold', 'erdos', 'gpu-stack', 'anti-slop-design',
  // supporting
  'physicslab', 'jobhunter', 'ai-tax-cpa-agent', 'curbrun',
  'codex-canmore', 'waypoint-differentiation-lab', 'bennycutools',
  // brief
  'healthos', 'bee', 'claude-sfx', 'agent-rate-forecast', 'pact', 'ivc',
];

export function iconFor(slug: string): string {
  return iconMap[slug] || 'px-folder';
}

export function byOrder(a: { data: { slug: string } }, b: { data: { slug: string } }): number {
  const ia = projectOrder.indexOf(a.data.slug);
  const ib = projectOrder.indexOf(b.data.slug);
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
}
