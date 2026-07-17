# Penpixel Creative — Website

Static site built with **Astro 5** + **Tailwind CSS 4**, deployed on **Cloudflare
Pages**. Server-rendered HTML, minimal JavaScript, built to be read and cited by
AI systems — the site is a working example of the thing Penpixel sells.

## Status: live in production

**https://penpixelcreative.com** — migrated off Squarespace, DNS fully cut over
to Cloudflare, contact form sending real email, 26-post blog (25 migrated, 1
outstanding — see below).

Squarespace is intentionally still active during a stability-watching window
before cancellation. See "Open items" at the bottom of this file for what's
still outstanding.

## Requirements
- Node.js **22.12.0+** (see `.nvmrc`)
- Do **not** upgrade to Astro 6/7 — their rolldown-based Vite breaks
  `@tailwindcss/vite`. Pinned to `^5.13.0`.

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
functions/
  api/contact.js       Cloudflare Pages Function: contact form handler
public/
  robots.txt           Content-Signal directives — explicitly welcomes AI crawlers
  llms.txt              Curated site map for LLMs (llmstxt.org)
  _redirects            Cloudflare 301 map (legacy Squarespace URLs -> new URLs)
  _headers              Security headers (CSP, HSTS, etc.) — OWASP-reviewed
  images/                Self-hosted photos, logos, blog diagrams (no external CDN)
  js/
    contact-form.js      External script (CSP: no inline JS)
    mobile-nav.js         External script for the mobile menu toggle
src/
  consts.ts             Site config + entity data (SITE.url, email, booking — no secrets)
  astro.config.mjs      `site:` must match SITE.url exactly (canonical URL, used in sitemap)
  styles/global.css     Brand tokens (color + type) via Tailwind @theme, + blog article typography
  layouts/BaseLayout.astro   head, meta, OG, fonts, Organization schema
  components/
    Header.astro          Desktop nav + mobile hamburger menu
    Footer.astro
    SchemaOrg.astro        Organization JSON-LD
    ServiceSchema.astro    Service JSON-LD (reused across the 4 service pages)
  data/case-studies.ts  Case study content — NOT a content collection, a typed data file
  content/blog/          Markdown blog posts (25 files)
  content.config.ts     Blog collection schema (title/metaTitle/description/pubDate)
  pages/
    index.astro                          Home
    about.astro                          Team bios (Deven, Tony, Patrick)
    contact.astro                        Diagnosis form + booking link
    services/index.astro + 4 detail pages
    case-studies/index.astro + [slug].astro   Dynamic renderer reading data/case-studies.ts
    blog/[...page].astro + [slug].astro       Paginated index + post renderer
    404.astro                            Custom 404 — required so Cloudflare Pages
                                          returns a real 404 instead of silently
                                          serving the homepage with a 200
```

## Deploy
Auto-deploys via Cloudflare Pages on every push to `main` (GitHub:
`mattrshaw4/penpixel-site`). Build command `npm run build`, output `dist`.
No manual deploy step — `git push` is the whole release process.

## Canonical domain: penpixelcreative.com (bare, not www)

This is the single source of truth every other piece of config must agree with:
- `src/consts.ts` → `SITE.url`
- `astro.config.mjs` → `site:` (drives the actual sitemap.xml URLs)
- `public/robots.txt` → the `Sitemap:` line
- `public/llms.txt` → every link in the file

If you ever add a new hardcoded absolute URL anywhere, it must use the bare
domain. `www.penpixelcreative.com` 301-redirects to the bare domain via a
Cloudflare Redirect Rule (zone-level, not in this repo) — Type: Dynamic,
expression `concat("https://penpixelcreative.com", http.request.uri.path)`,
301, preserve query string.

## DNS — migration complete

Nameservers moved from GoDaddy to Cloudflare
(`memphis.ns.cloudflare.com` / `surina.ns.cloudflare.com`). The zone is Active.
Matt manages DNS via a Cloudflare account with the domain added directly
(not via GoDaddy Delegate Access, which only covers record-level changes, not
the nameserver switch itself — that had to be done by Deven at the registrar).

**Records that matter and must not be deleted:**
- Google Workspace MX + DKIM + SPF (Deven's regular email — `deven@penpixelcreative.com`)
- Resend MX/TXT records on the `info.` subdomain (DKIM `resend._domainkey.info`,
  SPF + bounce MX on `send.info`) — these did **not** survive Cloudflare's
  automatic DNS import scan when the zone was added and had to be re-added
  manually, sourced from Resend's own dashboard. If DNS is ever re-migrated,
  check this specifically — the scan will likely miss them again.
- Legacy Mailgun and Mailchimp records exist in the zone, unused as far as we
  know. Left alone rather than deleted; ask Deven before removing.

**AI crawler settings**, configured at zone onboarding: Search, Agent, and
Training all set to Allow (Training's default is "block on pages with ads" —
changed explicitly even though the site runs no ads). Cloudflare's managed
robots.txt was declined so it doesn't override the hand-written one in this
repo. AI Labyrinth / Bot Fight Mode / AI Crawl Control are off.

**`.co` domain redirect:** the original site spec called for a redirect from
`penpixelcreative.co` (a burner send-domain) to `.com`. **Status unconfirmed**
as of this writing — verify it exists as a Cloudflare Redirect Rule before
assuming it's live.

## Fonts
Self-hosted via Fontsource (`@fontsource/blinker`, `@fontsource-variable/geist`,
`@fontsource-variable/geist-mono`). No Google Fonts request — tighter CSP, no
visitor data leaked to a third party.

## Booking
`SITE.booking` in `consts.ts` holds Deven's real Google Appointment Scheduling
URL. It's a plain link, not an embed — opens on Google's own domain, keeping
the CSP tight (no iframe exception needed). If it's ever embedded inline
instead, add `frame-src https://calendar.google.com https://calendar.app.google`
to the CSP in `public/_headers`.

## Contact form (Pages Function + Turnstile + Resend) — live and confirmed working

`/contact` posts to `/api/contact`, handled by `functions/api/contact.js` — a
Cloudflare Pages Function, deploys with every push, no separate Worker step.

Flow: honeypot check → server-side validation → Turnstile Siteverify (server-
side, the actual gate — client-side checks are UX only) → plain-text email via
Resend to `CONTACT_TO_EMAIL`, with `reply_to` set to the prospect's address so
Deven can reply in one click.

**Turnstile:** real widget live (not the test key anymore). Sitekey in
`consts.ts` (`turnstileSiteKey`), secret in the Cloudflare Pages env var
`TURNSTILE_SECRET_KEY`. Configured for `penpixelcreative.com`,
`www.penpixelcreative.com`, and `penpixel-site.pages.dev`. Managed mode (not
Invisible — avoids the extra privacy-policy addendum requirement).

**Resend:** sending domain `info.penpixelcreative.com` verified. Env vars set
in the Cloudflare Pages dashboard (never in this repo): `RESEND_API_KEY`
(Secret), `CONTACT_TO_EMAIL` (Text, `deven@penpixelcreative.com`),
`CONTACT_FROM_EMAIL` (Text, an address on the `info.` subdomain — confirm the
exact value in the dashboard).

Real end-to-end test confirmed: submissions from two separate sender accounts
both landed in Deven's inbox.

Local dev with the function: `npm run build && npx wrangler pages dev dist`
(uses `.env` — see `.env.example`; Cloudflare's public test keys always pass
and are safe for local dev).

## Blog migration status: 25 of 26 posts

Bucket A (12) and Bucket B (12) are migrated — converted from source, internal
links rewritten to new-site URLs, titles trimmed to ≤60 chars, descriptions to
≤160, `BlogPosting` JSON-LD on every post. The 7 Bucket C posts (old-ICP
content-marketing pieces) were deliberately cut, each with a 301 in
`_redirects` to `/blog`.

**`20-year-seo-loop` is missing.** It was live on the site when the original
triage was built but is absent from the WordPress export used for the rest of
the migration. Either source the original text and migrate it properly, or
drop it from the triage permanently and add a 301 redirect for its old URL.

## Case studies: data file, not a content collection

`src/data/case-studies.ts` holds all six studies as typed data; a single
dynamic route (`src/pages/case-studies/[slug].astro`) renders them all. To add
a seventh, add an entry to the data file — no new page needed. Two case
studies (DT Heritage, Joveo) have self-hosted client logos; The Alexander
Group's does not yet — pending Deven's file and usage permission.

## Mobile
Desktop nav (`hidden sm:inline`) had no mobile equivalent for a while —
navigation links simply vanished below 640px with no way to reach them. Fixed:
`Header.astro` now includes a hamburger toggle + slide-down panel, wired via
the external `public/js/mobile-nav.js` (same CSP-safe external-script pattern
as the contact form — this project's CSP has no `unsafe-inline`, so no JS can
live inline in the HTML). A full manual mobile QA pass across blog posts, case
studies, and the service page grids is still pending.

## Security
Headers set at the edge in `public/_headers`, reviewed against OWASP Top 10
(2021). CSP is `script-src 'self' https://challenges.cloudflare.com` (the
Cloudflare exception is scoped narrowly, for Turnstile only) and
`style-src 'self'` with no `unsafe-inline` — the build uses
`inlineStylesheets: 'never'` specifically so this holds; any inline
`<style>` or `style=""` attribute will silently break under this CSP, not
throw a build error, so check visually after any styling change that feels
unusual. Secrets live only in Cloudflare env vars, never in this repo.

## Dependency advisories (npm audit)

`npm install` reports ~7 advisories, reviewed and intentionally left as-is:

- **6 of 7 are dev-only**, in the `yaml` parser under `@astrojs/check` (the
  `npm run check` type-checker). Never ships to a visitor's browser.
- **1 of 7 is a "high" in Astro/esbuild** whose trigger conditions
  (`define:vars`, Server Islands, dynamic slot names, untrusted spread-prop
  names, SSR error pages, a Windows-only dev-server file read) don't apply to
  this static, prerendered, Linux-built site.

Do **not** run `npm audit fix --force` — it forces Astro 7, breaking the
Tailwind build. Plain `npm audit fix` is a no-op here.

## Open items (as of this writing)

- [ ] `20-year-seo-loop` blog post — source text needed, or drop + redirect
- [ ] Analytics — nothing wired anywhere (no GA4, GTM, or Cloudflare Web
      Analytics). A scan caught this; worth a two-minute fix.
- [ ] Schema.org founder field lists only Deven — deliberate for now, revisit
      if team/co-founder representation should change
- [ ] Google Search Console + Bing Webmaster submission — on hold, not started
- [ ] Full manual mobile QA pass beyond the nav fix
- [ ] The Alexander Group case study — logo asset + usage permission pending
- [ ] `.co` → `.com` redirect — confirm it actually exists
- [ ] Squarespace cancellation — deliberately on hold during the stability-
      watching window; do not cancel until email + traffic have been stable
      for a few days to two weeks post-cutover
