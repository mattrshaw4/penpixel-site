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

## Dependency advisories (npm audit)

`npm install` reports ~7 advisories. They are reviewed and intentionally left as-is:

- **6 of 7 are dev-only.** They live in the `yaml` parser under `@astrojs/check`
  (the `npm run check` type-checker). It never ships and never runs in a visitor's
  browser; the issue is a DoS when parsing maliciously nested YAML on your own
  machine. To zero them out you can remove `@astrojs/check` from devDependencies
  (you lose `npm run check` type-checking) — optional.
- **1 of 7 is a "high" in Astro/esbuild** whose triggers are `define:vars` in
  scripts, Server Islands, dynamic slot names, untrusted spread-prop names, SSR
  error pages, and a Windows-only dev-server file read. This is a static,
  prerendered, Linux-built site that uses none of them — not exploitable here.

Do **not** run `npm audit fix --force`: it forces Astro 7 (a breaking major) to
patch issues that don't apply, and risks the Tailwind-build incompatibility we
pinned away from. Plain `npm audit fix` is a no-op here. Treat the Astro major
upgrade as a separate, tested change later.

## What is NOT built yet
This is the scaffold plus the four core pages (home, about, services index,
contact). Still to migrate: the four service detail pages, the six case studies,
the 32 blog posts, and the contact intake form (Cloudflare Worker + Turnstile).
See `penpixel-migration-map.md`.
