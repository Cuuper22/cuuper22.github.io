import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    emoji: z.string(),
    tier: z.enum(['highlight', 'supporting', 'brief']),
    tech: z.array(z.string()),
    repo: z.string().optional(),
    site: z.string().optional(),
    oneLiner: z.string(),
  }),
});

export const collections = { projects };
