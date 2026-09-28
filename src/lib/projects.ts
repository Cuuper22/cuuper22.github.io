import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

const TIER_RANK = { headline: 0, supporting: 1, brief: 2 } as const;

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects');
  return all.sort((a, b) => TIER_RANK[a.data.tier] - TIER_RANK[b.data.tier] || a.data.order - b.data.order);
}

export function byTier(projects: Project[]) {
  return {
    headline: projects.filter(p => p.data.tier === 'headline'),
    supporting: projects.filter(p => p.data.tier === 'supporting'),
    brief: projects.filter(p => p.data.tier === 'brief'),
  };
}

/** Window id for a project on the desktop. */
export const winId = (slug: string) => `p-${slug}`;

/** Fake-but-stable file size for the DOS listing, derived from the write-up length. */
export function fakeSize(p: Project): number {
  if (p.data.slug === 'toaruos-arnold') return 212_576; // the real kernel image
  const body = p.body ?? '';
  return 4096 + body.length * 7 + p.data.tech.length * 1337;
}

/** First paragraph of the write-up as plain text (links and emphasis flattened). */
export function summary(p: Project): string {
  const first = (p.body ?? '').trim().split(/\n\s*\n/).find(b => !b.startsWith('(') && !b.startsWith('#') && !b.startsWith('!')) ?? '';
  return first
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Links shown in a project's toolbar, primary repo first. */
export function projectLinks(p: Project) {
  const links: { label: string; url: string; kind: 'repo' | 'site' }[] = [];
  if (p.data.repos?.length) p.data.repos.forEach(r => links.push({ ...r, kind: 'repo' }));
  else if (p.data.repo) links.push({ label: 'Source', url: p.data.repo, kind: 'repo' });
  if (p.data.site) links.push({ label: 'Live site', url: p.data.site, kind: 'site' });
  return links;
}
