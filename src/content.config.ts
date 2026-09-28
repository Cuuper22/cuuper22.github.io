import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { ICONS } from './lib/icons';

const iconNames = Object.keys(ICONS) as [keyof typeof ICONS, ...(keyof typeof ICONS)[]];

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    icon: z.enum(iconNames),
    /** DOS 8.3 name shown in the Explorer and `dir` listing, e.g. TOARUOS.EXE */
    file: z.string().regex(/^[A-Z0-9_-]{1,8}\.[A-Z]{1,3}$/),
    tier: z.enum(['headline', 'supporting', 'brief']),
    order: z.number(),
    tech: z.array(z.string()),
    repo: z.url().optional(),
    repos: z.array(z.object({ label: z.string(), url: z.url() })).optional(),
    site: z.url().optional(),
    oneLiner: z.string().max(120),
    /** Last meaningful update, YYYY-MM-DD (drives the `dir` timestamps) */
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Interactive panel rendered above the write-up in the project window */
    demo: z.enum(['toaru', 'arnoldc', 'erdos', 'gpu', 'ivc', 'curbrun']).optional(),
  }),
});

export const collections = { projects };
