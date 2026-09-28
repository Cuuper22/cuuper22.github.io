import type { APIRoute } from 'astro';
import { renderOg } from '../../lib/og';
import { getProjects, byTier } from '../../lib/projects';

export const GET: APIRoute = async () => {
  const { headline } = byTier(await getProjects());
  const png = await renderOg({
    title: 'Cúper Anas',
    kicker: 'Welcome to CúperOS',
    body: 'I build systems that have to answer to reality: an OS in a joke language, a theorem prover that caught its AI cheating, a GPU stack modeled down to quarks.',
    icon: 'computer',
    icons: headline.map(p => p.data.icon),
  });
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
