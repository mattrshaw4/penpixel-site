// Central site configuration. No secrets here — this file ships to the client.
export const SITE = {
  name: 'Penpixel Creative', // always two words, capital P and C
  url: 'https://www.penpixelcreative.com',
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
  turnstileSiteKey: '1x00000000000000000000AA',
  // Google Appointment Scheduling (Workspace). Replace with the real booking URL.
  booking: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1SmU2qriNzKKunIEhV1CS2eRgeupqZTsN7ooWv5K9Y-LWAcBv2M0Hc1tKOdrNcgmHGbAm4YL2W?gv=true',
} as const;

export const NAV = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;
