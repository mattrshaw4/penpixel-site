// Central site configuration. No secrets here — this file ships to the client.
export const SITE = {
  name: 'Penpixel Creative', // always two words, capital P and C
  url: 'https://penpixelcreative.com',
  description:
    'AEO & AI search optimization for B2B SaaS. We rearchitect your digital estate to be cited, trusted, and recommended by AI agents.',
  founder: 'Deven Bhagwandin',
  locality: 'Houston',
  region: 'TX',
  country: 'US',
  email: 'deven@penpixelcreative.com',
  // Entity corroboration — keep in sync with the live profiles (entity hardening).
  sameAs: [
    'https://www.linkedin.com/company/penpixel-creative',
    'https://www.linkedin.com/in/devenbhagwandin',
    'https://www.instagram.com/penpixelcreative/',
  ],
  // Turnstile SITE key (public — ships to the browser; the SECRET stays in env vars).
  // This is Cloudflare's official always-pass TEST key. Replace with the real
  // sitekey from dashboard > Turnstile before launch.
  turnstileSiteKey: '0x4AAAAAAD1Knj2iUYRLjGCU',
  // GA4 Measurement ID (public — ships to the browser, this is normal for gtag.js).
  // From Google Analytics > Admin > Data Streams > penpixelcreative.com.
  gaMeasurementId: 'G-3DGRS8T9XN',
  // Google Appointment Scheduling (Workspace). Replace with the real booking URL.
  booking: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1SmU2qriNzKKunIEhV1CS2eRgeupqZTsN7ooWv5K9Y-LWAcBv2M0Hc1tKOdrNcgmHGbAm4YL2W?gv=true',
} as const;

// Per-author metadata for blog bylines and Person schema. Keyed by the exact
// string used in a post's frontmatter `author` field. Posts with no `author`
// set fall back to SITE.founder (Deven) with no entry needed here.
export const AUTHORS = {
  'Deven Bhagwandin': {
    jobTitle: 'Founder',
    url: `${SITE.url}/about/#deven-bhagwandin`,
    sameAs: ['https://www.linkedin.com/in/devenbhagwandin'],
  },
  'Matt Shaw': {
    jobTitle: 'Infrastructure Architect',
    url: `${SITE.url}/about/#matt-shaw`,
    sameAs: ['https://www.linkedin.com/in/matt-r-shaw-/'],
  },
} as const;

export const NAV = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;
