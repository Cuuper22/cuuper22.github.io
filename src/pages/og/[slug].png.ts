import type { APIRoute, GetStaticPaths } from 'astro';
import { getProjects, type Project } from '../../lib/projects';
import { renderOg } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = async () =>
  (await getProjects()).map(project => ({ params: { slug: project.data.slug }, props: { project } }));

export const GET: APIRoute = async ({ props }) => {
  const { project } = props as { project: Project };
  const d = project.data;
  const png = await renderOg({ title: d.title, kicker: `${d.file} - CúperOS`, body: d.oneLiner, icon: d.icon, tags: d.tech });
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
