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
  email: 'hello@penpixelcreative.com', // PLACEHOLDER — confirm the real inbox
  // Entity corroboration — keep in sync with the live profiles (entity hardening).
  sameAs: [
    'https://www.linkedin.com/company/penpixel-creative',
    'https://www.linkedin.com/in/devenbhagwandin',
    'https://www.instagram.com/penpixelcreative/',
  ],
  // Google Appointment Scheduling (Workspace). Replace with the real booking URL.
  booking: 'https://calendar.app.google/REPLACE_WITH_APPOINTMENT_PAGE',
} as const;

export const NAV = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
] as const;
