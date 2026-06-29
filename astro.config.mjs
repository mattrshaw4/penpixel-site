// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.penpixelcreative.com',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  // Keep CSS in external files so the Content-Security-Policy can stay tight
  // (no inlined <style> bundles to account for). Scoped component styles are
  // avoided in favor of Tailwind utilities for the same reason.
  build: { inlineStylesheets: 'never' },
});
