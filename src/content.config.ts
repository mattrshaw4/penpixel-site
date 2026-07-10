import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts migrate as Markdown into src/content/blog (slugs unchanged).
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),            // on-page H1 (full)
    metaTitle: z.string().optional(), // trimmed <title> tag (<=60 chars); falls back to title
    description: z.string(),      // meta description (<=160 chars)
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

// Case studies live in src/data/case-studies.ts (structured data + [slug].astro renderer).

export const collections = { blog };
