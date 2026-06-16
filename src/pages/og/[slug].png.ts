import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1200;
const HEIGHT = 630;

// Fetch fonts once at module level
const pixelifyPromise = fetch(
  'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap'
).then(r => r.text())
 .then(css => {
   const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
   if (!url) throw new Error('Could not extract Pixelify Sans font URL');
   return fetch(url).then(r => r.arrayBuffer());
 });

const plexPromise = fetch(
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap',
  { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
).then(r => r.text())
 .then(css => {
   const urls = [...css.matchAll(/src:\s*url\(([^)]+)\)/g)].map(m => m[1]);
   // Get the 400 weight (first match)
   return fetch(urls[0]).then(r => r.arrayBuffer());
 });

const plexBoldPromise = fetch(
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600&display=swap',
  { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
).then(r => r.text())
 .then(css => {
   const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
   if (!url) throw new Error('Could not extract IBM Plex Sans 600 font URL');
   return fetch(url).then(r => r.arrayBuffer());
 });

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCollection('projects');
  return projects.map(project => ({
    params: { slug: project.data.slug },
    props: { project },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { project } = props as any;
  const { title, emoji, oneLiner, tech } = project.data;

  const [pixelifyFont, plexFont, plexBoldFont] = await Promise.all([
    pixelifyPromise,
    plexPromise,
    plexBoldPromise,
  ]);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: '#2d8a7e',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          fontFamily: '"IBM Plex Sans"',
        },
        children: [
          // Window chrome
          {
            type: 'div',
            props: {
              style: {
                width: '900px',
                background: '#c0c0c0',
                borderTop: '3px solid #dfdfdf',
                borderLeft: '3px solid #dfdfdf',
                borderRight: '3px solid #808080',
                borderBottom: '3px solid #808080',
                boxShadow: '4px 4px 0 #000000',
                display: 'flex',
                flexDirection: 'column',
              },
              children: [
                // Title bar
                {
                  type: 'div',
                  props: {
                    style: {
                      background: 'linear-gradient(90deg, #5a2d82, #9b59b6)',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: '2px solid #808080',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: { fontSize: '28px' },
                          children: emoji,
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: {
                            color: 'white',
                            fontSize: '22px',
                            fontFamily: '"Pixelify Sans"',
                            fontWeight: 700,
                          },
                          children: title,
                        },
                      },
                    ],
                  },
                },
                // Content area
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '32px 36px',
                      background: '#fafaf8',
                      borderTop: '2px solid #808080',
                      borderLeft: '2px solid #808080',
                      borderRight: '2px solid #dfdfdf',
                      borderBottom: '2px solid #dfdfdf',
                      margin: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                    },
                    children: [
                      // One-liner
                      {
                        type: 'p',
                        props: {
                          style: {
                            fontSize: '24px',
                            lineHeight: 1.5,
                            color: '#1a1a1a',
                            fontWeight: 400,
                          },
                          children: oneLiner,
                        },
                      },
                      // Tech pills
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                          },
                          children: tech.slice(0, 6).map((t: string) => ({
                            type: 'span',
                            props: {
                              style: {
                                background: '#e8e8e8',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#c0c0c0',
                                padding: '4px 12px',
                                fontSize: '14px',
                                color: '#444',
                                fontWeight: 600,
                              },
                              children: t,
                            },
                          })),
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          // Site URL
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '20px',
                right: '32px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '16px',
                fontFamily: '"Pixelify Sans"',
              },
              children: 'cuuper22.pages.dev',
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Pixelify Sans', data: pixelifyFont, weight: 700, style: 'normal' as const },
        { name: 'IBM Plex Sans', data: plexFont, weight: 400, style: 'normal' as const },
        { name: 'IBM Plex Sans', data: plexBoldFont, weight: 600, style: 'normal' as const },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: { 'Content-Type': 'image/png' },
  });
};
