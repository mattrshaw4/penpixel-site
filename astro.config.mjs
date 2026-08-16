// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
// https://astro.build/config
export default defineConfig({
  site: 'https://penpixelcreative.com',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  // Keep CSS in external files so the Content-Security-Policy can stay tight
  // (no inlined <style> bundles to account for). Scoped component styles are
  // avoided in favor of Tailwind utilities for the same reason.
  build: { inlineStylesheets: 'never' },
  // Open external links in Markdown blog posts in a new tab.
  // Internal links (relative paths OR absolute penpixelcreative.com URLs)
  // stay in the same tab. mailto: and tel: are ignored by the protocol check.
  markdown: {
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
          test: (element) => {
            const href = element.properties?.href;
            if (typeof href !== 'string') return false;
            if (!/^https?:\/\//i.test(href)) return false;
            return !href.includes('penpixelcreative.com');
          },
        },
      ],
    ],
  },
});
