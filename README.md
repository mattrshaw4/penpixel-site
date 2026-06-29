# Penpixel Creative — Website

Static site built with **Astro 6** + **Tailwind CSS 4**, deployed on **Cloudflare Pages**.
Zero JavaScript by default, server-rendered HTML, built to be read and cited by AI systems.

## Requirements
- Node.js **22.12.0+** (see `.nvmrc`)

## Local development
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to ./dist
npm run preview    # preview the production build
npm run check      # type + Astro diagnostics
```

## Project structure
```
public/            Static assets copied verbatim to the site root
  robots.txt       Welcomes AI crawlers (deliberate AEO posture)
  llms.txt         Curated map of the site for LLMs (llmstxt.org)
  _redirects       Cloudflare 301 map (legacy URLs -> new URLs)
  _headers         Cloudflare security headers (CSP, HSTS, etc.)
src/
  consts.ts        Site config + entity data (no secrets)
  styles/global.css  Brand tokens (color + type) via Tailwind @theme
  layouts/         BaseLayout (head, meta, OG, fonts, schema, noindex)
  components/      SchemaOrg (Organization/founder JSON-LD)
  content/         Markdown: blog/ and case-studies/
  content.config.ts  Collection schemas
  pages/           Routes (index.astro is the home stub)
```

## Deploy to Cloudflare Pages
1. Push this repo to GitHub.
2. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> connect the repo.
3. Build command: `npm run build` — Output directory: `dist`.
4. Add the custom domain `www.penpixelcreative.com` in the Pages project.

## DNS (Matt manages)
1. At the registrar (GoDaddy), point the domain's **nameservers** at Cloudflare (one-time).
2. In Cloudflare DNS, add the Pages custom-domain records (Cloudflare prompts these).
3. `penpixelcreative.co` -> `.com`: add a Cloudflare **Redirect Rule** (301, preserve path).
   It is a burner send-domain with no content, so a blanket redirect is correct.
4. `_redirects` and `_headers` deploy automatically with the site — no DNS action needed.

## Fonts
Self-hosted via Fontsource (`@fontsource/blinker`, `@fontsource-variable/geist`,
`@fontsource-variable/geist-mono`). No Google Fonts request — tighter CSP, no
visitor data leaked to a third party.

## Booking
The "Book a call" CTA links to **Google Appointment Scheduling** (Workspace).
Set the real URL in `src/consts.ts` (`SITE.booking`). It opens on Google's domain,
so the CSP stays tight (no embedded iframe). If you later embed it instead, add
`frame-src https://calendar.google.com https://calendar.app.google` to the CSP in
`public/_headers`.

## Security
Headers are set at the edge in `public/_headers` and reviewed against OWASP Top 10
(2021). Before production:
- Commit `package-lock.json` and enable Dependabot (pins exact dependency versions).
- Keep all secrets in Cloudflare env vars — never in the repo.
- The contact-form handler (Cloudflare Worker + Turnstile) is a later phase; its
  inputs must be validated server-side.

## What is NOT built yet
This is the scaffold: structure, brand tokens, machine layer, redirect map, and a
home stub. Page content (services, case studies, blog, contact form) migrates next,
per `penpixel-migration-map.md`.
