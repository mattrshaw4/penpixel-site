import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts migrate as Markdown into src/content/blog (slugs unchanged).
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

// Case studies, standardized under /case-studies/<slug>.
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    client: z.string(),
    result: z.string(), // headline outcome, e.g. "92.1% AI citation growth"
    pubDate: z.coerce.date(),
  }),
});

export const collections = { blog, caseStudies };
