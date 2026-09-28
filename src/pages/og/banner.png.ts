import type { APIRoute } from 'astro';
import { renderBanner } from '../../lib/og';
import { getProjects, byTier } from '../../lib/projects';

export const GET: APIRoute = async () => {
  const { headline } = byTier(await getProjects());
  const png = await renderBanner(headline.map(p => p.data.icon));
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
