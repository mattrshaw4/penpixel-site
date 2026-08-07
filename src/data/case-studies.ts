// Case-study content, migrated faithfully from the live Squarespace pages.
// Slugs MUST match public/_redirects destinations exactly.
export interface CaseStudy {
  slug: string;
  logo?: { src: string; alt: string; w: number; h: number };
  eyebrow: string;
  client: string;
  headline: string;
  sub: string;
  metaTitle: string;
  metaDescription: string;
  homeMetric: { value: string; label: string };
  challengeIntro: string;
  challenges: { k: string; v: string }[];
  strategyTitle: string;
  strategyIntro: string;
  strategy: { k: string; v: string }[];
  impactTitle: string;
  impacts: { value: string; k: string; v: string }[];
  quote: string;
  sidebarTitle: string;
  sidebar: { value: string; label: string }[];
  regions?: { flag: string; title: string; stats: { value: string; label: string }[]; note: string }[];
  outro?: { title: string; body: string };
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
  ctaLabel: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'dt-heritage',
    logo: { src: '/images/logo-dt-heritage.webp', alt: 'DT Heritage logo', w: 200, h: 61 },
    eyebrow: 'Ongoing Entity Management',
    client: 'DT Heritage',
    headline: 'Entity Management Secures 69% AI Share of Voice',
    sub: 'Ongoing entity management for the global vendor of high-end digitization hardware and software serving the Library of Congress and the Metropolitan Museum of Art.',
    metaTitle: 'Case Study: 69% AI Share of Voice for DT Heritage | Penpixel Creative',
    metaDescription: 'How ongoing entity management and forensic content audits secured 69% AI Share of Voice for DT Heritage across ChatGPT, Perplexity, and Gemini for high-end institutional digitization.',
    homeMetric: { value: '69%', label: 'AI Share of Voice' },
    challengeIntro: 'DT Heritage is the global vendor of high-end digitization hardware and software for institutions like the Library of Congress and the Metropolitan Museum of Art. High-value technical manufacturers now face severe visibility erosion as enterprise buyers shift research from keyword search to conversational AI systems, and DT Heritage faced three operational risks:',
    challenges: [
      { k: 'Semantic Drift', v: 'Inconsistent technical specifications across legacy pages and digital assets caused AI systems to return outdated or incomplete brand descriptions.' },
      { k: 'Sales Collateral Friction', v: 'Offline sales materials, service sheets, and equipment guides lacked alignment with web entities, creating friction in enterprise sales conversations.' },
      { k: 'AI Discovery Blindspots', v: 'As curators and archivists began relying on ChatGPT, Perplexity, and Gemini for vendor discovery, DT Heritage needed to establish explicit, machine-readable authority.' },
    ],
    strategyTitle: 'Ongoing Entity Management',
    strategyIntro: 'AI discovery models do not rank web pages by keyword volume. They crawl, extract, and reconcile entity relationships into structured knowledge representations. When a technical brand presents contradictory messaging or unparsed data across touchpoints, AI models default to third-party aggregators or omit the brand entirely. Penpixel Creative maintains machine authority across four execution pillars:',
    strategy: [
      { k: 'Forensic Content Audits', v: 'Systematically reviewing digital properties to identify and correct conflicting technical entity claims.' },
      { k: 'Real-Time Entity Reinforcement', v: 'Updating schema markup and semantic content structures so AI search tools parse DT Heritage as the primary source of truth.' },
      { k: 'Omnichannel Technical Alignment', v: 'Standardizing brand data and service definitions across all digital channels and regional touchpoints.' },
      { k: 'Sales Enablement Restructuring', v: 'Redesigning product one-pagers, equipment guides, and fliers to mirror the exact entity structure present in the digital architecture.' },
    ],
    impactTitle: 'Measured Outcomes',
    impacts: [
      { value: '69%', k: 'AI Share of Voice', v: 'Consistently cited as the leading authority in ChatGPT, Perplexity, and Gemini for specialized digitization queries.' },
      { value: 'Top 3', k: 'Global Citation Ranking', v: 'Ranked among the top three most-cited brands globally for high-resolution digitization equipment within AI search outputs.' },
    ],
    quote: 'Entity management is not a one-time cleanup. When high-value manufacturers present contradictory data across touchpoints, AI systems default to third-party aggregators. Our ongoing forensic audits keep DT Heritage cited as the source of truth.',
    sidebarTitle: 'Authority Metrics',
    sidebar: [
      { value: '69%', label: 'AI Share of Voice across ChatGPT, Perplexity, and Gemini for specialized digitization queries.' },
      { value: 'Top 3', label: 'Most-cited brands globally for high-resolution digitization equipment in AI search outputs.' },
      { value: 'Structured', label: 'Sales collateral now mirrors the digital entity architecture, accelerating enterprise deal cycles.' },
      { value: 'Ongoing', label: 'Forensic audits, schema updates, and omnichannel alignment maintained continuously.' },
    ],
    ctaEyebrow: 'Secure Your Entity Structure',
    ctaTitle: 'Are AI Systems Citing Your Brand or Your Competitors?',
    ctaBody: 'When specialized technical brands fail to manage entity clarity, AI systems extract unverified data from third parties and erode brand authority before a buyer ever contacts sales. Book an AI-Search Readiness Audit to evaluate your entity structure, surface information conflicts, and secure your brand across AI discovery platforms.',
    ctaLabel: 'Book Your Audit',
  },
  {
    slug: 'the-alexander-group',
    eyebrow: 'Technical Authority & Identity Recovery',
    client: 'The Alexander Group',
    headline: 'Eliminating "Identity Dilution" to Drive 44% Organic Growth',
    sub: 'How we modernized the digital foundation of a premier executive search firm to reclaim their brand from the noise.',
    metaTitle: 'Case Study: 44% Organic Surge via Identity Recovery for TAG | Penpixel Creative',
    metaDescription: 'See how we eliminated "Identity Dilution" for The Alexander Group, driving a 44% organic growth surge and securing AI-search readiness through technical authority.',
    homeMetric: { value: '44%', label: 'organic surge via identity recovery' },
    challengeIntro: 'The Alexander Group (TAG) is a premier executive search firm. In a niche where reputation is everything, their digital presence must reflect their actual market standing. However, they faced a critical "Identity Dilution" problem:',
    challenges: [
      { k: 'Noise Traffic', v: 'The site was attracting users looking for unrelated services sharing the same name, skewing data and wasting server resources.' },
      { k: 'Content Decay', v: 'Technical debt meant the site was failing to signal its specific expertise to search engines, leading to a loss in organic visibility.' },
      { k: 'The AI Readiness Gap', v: 'Legacy technical health issues were impacting how "entity-based" models (ChatGPT, Perplexity) viewed the brand\u2019s authority.' },
    ],
    strategyTitle: 'The "Search Fortress" Strategy',
    strategyIntro: 'We acted as a Consultative Center of Excellence to modernize TAG\u2019s digital foundation through a rigorous technical lens.',
    strategy: [
      { k: 'Technical Infrastructure Overhaul', v: 'We resolved site functionality issues and implemented a robust technical SEO framework to eliminate crawl friction and improve indexing.' },
      { k: 'Foundational Keyword Architecture', v: 'We moved TAG away from generic terms and toward a high-intent keyword strategy that prioritized their specific executive search niche.' },
      { k: 'Semantic Signaling', v: 'By implementing advanced Schema Markup, we provided the clarity necessary for search engines to distinguish TAG from similarly named entities.' },
    ],
    impactTitle: 'The Results',
    impacts: [
      { value: '44%', k: 'Organic Surge', v: 'A significant increase in organic traffic within the first six months of implementation.' },
      { value: 'Qualified', k: 'Audience Growth', v: 'Successfully filtered out "noise" traffic, ensuring growth was driven by high-intent executive queries.' },
    ],
    quote: 'Penpixel Creative handles the complexities of our online presence so we can focus on growth. They don\u2019t just solve today\u2019s issues; they advise us on what\u2019s coming next.',
    sidebarTitle: 'Performance ROI',
    sidebar: [
      { value: '+44%', label: 'Six-month organic growth surge following technical overhaul.' },
      { value: 'Clean', label: 'Resolution of Identity Dilution and high-intent audience filtering.' },
      { value: 'Future', label: 'Structural integrity and AI-Search Readiness fully secured.' },
    ],
    ctaEyebrow: 'Claim Your Digital Identity',
    ctaTitle: 'Is Your Brand Lost in the Noise?',
    ctaBody: 'Identity dilution is a technical problem with a technical solution. Book your AI-Search Readiness Audit to resolve search friction and ensure your niche authority is undisputed.',
    ctaLabel: 'Secure Your Audit',
  },
  {
    slug: 'joveo',
    logo: { src: '/images/logo-joveo.webp', alt: 'Joveo logo', w: 160, h: 62 },
    eyebrow: 'Strategic Partnership',
    client: 'Joveo',
    headline: 'The Joveo Strategic Partnership',
    sub: 'Empowering agency growth: setting the standard for AI-Search Readiness and Technical SEO.',
    metaTitle: 'Case Study: Scaling Enterprise AI-Search Readiness for Joveo | Penpixel Creative',
    metaDescription: 'See how we serve as the specialized Technical SEO arm for Joveo. Liquidating development bottlenecks and standardizing AI authority for global enterprise brands.',
    homeMetric: { value: 'Enterprise', label: 'AI-search readiness at scale' },
    challengeIntro: 'Penpixel Creative serves as the specialized Technical SEO and AI-Search Readiness arm for Joveo, the global leader in programmatic recruitment advertising. Rather than acting as a traditional vendor, we are integrated into the Joveo workflow as a Consultative Center of Excellence. Joveo manages a vast portfolio of enterprise clients with complex, high-volume job sites, and required a partner to solve two recurring challenges:',
    challenges: [
      { k: 'The Development Bottleneck', v: 'High-performance sites for clients such as Amazon (Entregapro) and Banfield require deep technical SEO and schema expertise, which can often slow development timelines.' },
      { k: 'The AI-Search Knowledge Gap', v: 'As traditional SEO evolved into the "AI-Search" era, Joveo needed a dedicated team to audit, validate, and strategize for the "New Gatekeepers" (ChatGPT, Perplexity, Gemini).' },
    ],
    strategyTitle: 'The Penpixel Strategy: A "Strategic Strike Team"',
    strategyIntro: 'We bridge the gap between code and authority by providing Joveo\u2019s development and content teams with precise, implementation-ready roadmaps.',
    strategy: [
      { k: 'Accelerated Implementation Roadmaps', v: 'By identifying technical blockers early in the cycle, we allow Joveo to launch healthy, high-performing sites in record time.' },
      { k: 'High-Level Client Representation', v: 'Penpixel represents Joveo in high-level client meetings as the subject-matter authority on SEO and AI Search.' },
      { k: 'Standardizing Authority', v: 'We developed proprietary "Schema and Entity Templates" now used across Joveo\u2019s enterprise accounts, ensuring sites are automatically optimized for AI discovery.' },
      { k: 'Strategic Auditing', v: 'We conduct ongoing AI-Search Readiness Audits for Joveo\u2019s top-tier clients, identifying "Share of Voice" opportunities.' },
    ],
    impactTitle: 'The Impact',
    impacts: [
      { value: '~30 Days', k: 'Speed', v: 'Reduced development turnaround time from orientation to launch.' },
      { value: 'Verified', k: 'Enterprise Validation', v: 'AI-Search Readiness validated for the world\u2019s largest brands.' },
    ],
    quote: 'When the world\u2019s leading programmatic agencies need to ensure their clients are visible to both humans and AI, they call us.',
    sidebarTitle: 'The Impact',
    sidebar: [
      { value: 'Scale', label: 'Increased client "Share of Voice" in AI-generated answers.' },
      { value: 'Efficiency', label: 'Roadmaps allow internal teams to focus on core programmatic strengths.' },
      { value: '~30 Days', label: 'Development turnaround from orientation to launch.' },
    ],
    outro: { title: 'Enterprise Impact Snapshots', body: 'The Logistics, Veterinary, and RPO case studies below are implementation snapshots delivered through this partnership for Joveo\u2019s premier accounts.' },
    ctaEyebrow: 'Enterprise Readiness',
    ctaTitle: 'Need a Strategic Strike Team?',
    ctaBody: 'From development bottlenecks to AI-search validation, we provide the technical backbone that lets enterprise teams move faster and close bigger.',
    ctaLabel: 'Book Your Audit',
  },
  {
    slug: 'veterinary-migration',
    eyebrow: 'Enterprise Migration & Recovery',
    client: 'National Veterinary Care Network',
    headline: 'Preserving Legacy Authority Across 1,000+ Locations',
    sub: 'How we secured the search equity of a national healthcare leader and drove a 10% lift in applications in just 30 days.',
    metaTitle: 'Case Study: 1,000+ Location Migration for National Veterinary | Penpixel Creative',
    metaDescription: 'See how we secured search equity for a 1,000+ location leader. A forensic look at recovering de-indexed job pages and driving a 10% lift in applications in 30 days.',
    homeMetric: { value: '+10%', label: 'application lift in 30 days' },
    challengeIntro: 'A premier national veterinary care network faced a massive technical transition. To streamline recruitment for over 1,000 hospital locations, Joveo built a unified, high-performance job site. However, the project faced three critical "Authority Risks":',
    challenges: [
      { k: 'Legacy Erosion', v: 'The network needed to migrate decades of SEO authority from old, fragmented sites to a single new domain without losing search rankings.' },
      { k: 'The Indexation "Blackout"', v: 'The site initially struggled with client-side JavaScript rendering and missing schema, leading to thousands of job pages being de-indexed by Google.' },
      { k: 'Fragmented Ecosystems', v: 'Jobs needed to sync perfectly across Google Jobs, MyWorkDay, Indeed, and LinkedIn to ensure the talent pipeline remained full.' },
    ],
    strategyTitle: 'The Recovery & Migration Roadmap',
    strategyIntro: 'Penpixel Creative was engaged to provide a technical SEO and AI-Search Readiness roadmap to secure the network\u2019s digital footprint.',
    strategy: [
      { k: 'Authority Transfer Mapping', v: 'We assisted the Joveo dev team in mapping complex redirect paths, ensuring "SEO equity" from legacy pages was successfully funneled into the new unified site.' },
      { k: 'Entity Cleanup', v: 'A large-scale "Digital Hygiene" operation, identifying and retiring thousands of outdated job postings that cluttered the search landscape.' },
      { k: 'Schema Standardization', v: 'We developed a proprietary JobPosting Schema Template, allowing for immediate visibility in the "Google Jobs blue box" via search-engine-readable data.' },
      { k: 'Technical Remediation', v: 'We pinpointed the exact CSS and JavaScript bottlenecks causing Core Web Vitals failures, turning a "failing" mobile experience into a search-approved asset.' },
    ],
    impactTitle: 'The Impact',
    impacts: [
      { value: '#1', k: 'Search Dominance', v: 'Reclaimed top spots for high-intent terms like "veterinary and animal hospital jobs," cutting out third-party middleman boards.' },
      { value: '100%', k: 'Indexation Recovery', v: 'Restored visibility for the entire career ecosystem to both Googlebots and human applicants.' },
    ],
    quote: 'When managing 1,000+ locations, there is no room for technical error. We ensured that the network didn\u2019t just move to a new site — they moved to a higher level of search authority.',
    sidebarTitle: 'Migration ROI',
    sidebar: [
      { value: '+10%', label: 'Increase in completed job applications within 30 days.' },
      { value: '1,000+', label: 'Hospital locations successfully migrated with preserved equity.' },
      { value: 'Elite', label: 'Successful Mobile and Desktop Core Web Vitals pass.' },
    ],
    ctaEyebrow: 'Secure Your Digital Legacy',
    ctaTitle: 'Don\u2019t Leave Your Authority to Chance.',
    ctaBody: 'Whether you are migrating 1,000 locations or auditing a single enterprise domain, technical errors can cost you years of search equity. Book an AI-Search Readiness Audit to secure your footprint.',
    ctaLabel: 'Secure Your Audit',
  },
  {
    slug: 'rpo-indexation',
    eyebrow: 'Programmatic ROI Recovery',
    client: 'Global RPO Enterprise',
    headline: 'Technical Optimization in 30 Days',
    sub: 'Solving the "Indexation Blackout" and unlocking programmatic advertising potential for a premier Global RPO firm.',
    metaTitle: 'Case Study: Unlocking Programmatic ROI for Enterprise RPO | Penpixel Creative',
    metaDescription: 'See how we resolved a "JavaScript Blackout" for a Global RPO Enterprise. A 30-day technical sprint restored indexation and unlocked 100% ad-spend efficiency.',
    homeMetric: { value: '100%', label: 'ad-spend delivery unlocked' },
    challengeIntro: 'A premier Global Recruitment Process Outsourcing (RPO) enterprise was launching a new, centralized job search ecosystem alongside a significant programmatic advertising push. Despite the investment, the site was struggling to gain traction:',
    challenges: [
      { k: 'The "Invisible" Shell', v: 'The site relied on heavy client-side JavaScript rendering, which meant that when Googlebots arrived, they were greeted by an empty "shell" rather than dynamic job listings.' },
      { k: 'The Indexation Gap', v: 'Due to improper URL structures and a lack of server-rendered headings, web crawlers were largely ignoring the site, resulting in weak organic signals.' },
      { k: 'The Ad-Spend Bottleneck', v: 'Because the site wasn\u2019t technically healthy, Joveo couldn\u2019t meet the target programmatic advertising budgets. The technical friction was preventing ROI.' },
    ],
    strategyTitle: 'The "Strike Team" Implementation',
    strategyIntro: 'Penpixel Creative was brought in to provide an immediate technical roadmap to alleviate pressure on the Joveo development team and get the programmatic engine running.',
    strategy: [
      { k: '30-Day Technical Sprint', v: 'We identified and prioritized critical "blockers" — canonicalization errors and URL structure — allowing the dev team to implement fixes within a 30-day window.' },
      { k: 'Structural Integrity', v: 'We moved the site away from a "JavaScript-only" dependency, ensuring that H1/H2 headings and job metadata were visible in the raw HTML for immediate indexing.' },
      { k: 'Schema and Semantic Structure', v: 'We introduced structured data to help AI search engines and job aggregators understand the relationship between the enterprise\u2019s global corporate locations and their recruitment categories.' },
    ],
    impactTitle: 'The Impact',
    impacts: [
      { value: 'Active', k: 'Ad-Spend Efficiency', v: 'Joveo successfully scaled programmatic spend to target levels, ensuring the budget was finally driving real applicants.' },
      { value: 'Indexed', k: 'Rapid Visibility', v: 'The enterprise went from being "virtually ignored" by Googlebots to being a fully crawled, understood, and indexed entity.' },
    ],
    quote: 'Technical SEO isn\u2019t just about rankings; it\u2019s the structural foundation of every dollar spent on performance marketing. We ensured that when the platform turned on the lights, the search engines could actually see what they were offering.',
    sidebarTitle: 'Efficiency ROI',
    sidebar: [
      { value: '30 Days', label: 'Time to resolve critical crawlability blockers and launch.' },
      { value: '100%', label: 'Ad-spend delivery target met after technical remediation.' },
      { value: 'Direct', label: 'Bypassing trial-and-error with a strategic dev roadmap.' },
    ],
    ctaEyebrow: 'Unlock Your Ad Performance',
    ctaTitle: 'Stop Letting Technical Friction Burn Your Budget.',
    ctaBody: 'If your programmatic engine is stalling due to an "invisible" site, you\u2019re losing ROI every second. Book an AI-Search Readiness Audit to turn the lights back on and scale with confidence.',
    ctaLabel: 'Unlock Your Audit',
  },
  {
    slug: 'logistics',
    eyebrow: 'Enterprise Entity Building',
    client: 'Global E-Commerce Logistics Network',
    headline: 'Scaling International Logistics through Technical Precision',
    sub: 'How we leveraged Entity Management to build a 1,500% surge in organic traffic for a premier global e-commerce logistics network.',
    metaTitle: 'Case Study: 1,500% Organic Surge for Logistics Entity | Penpixel Creative',
    metaDescription: 'See how we bypassed "crawling blackouts" and solved identity dilution for a major logistics entity and its partners, driving a 1,500% surge in organic recruitment traffic.',
    homeMetric: { value: '1,500%', label: 'organic traffic surge' },
    challengeIntro: 'As an enterprise last-mile fulfillment network partner in Brazil and Mexico, the regional delivery operation faced a high-stakes recruitment hurdle. Tasked with meeting the e-commerce parent company\u2019s rigorous fulfillment timelines, the logistics provider was invisible to the very drivers it needed to hire.',
    challenges: [
      { k: 'The Identity Constraint', v: 'Contractual mandates prohibited the use of the parent entity\u2019s legacy global branding or SEO legacy signals. The logistics provider had to win on its own merit.' },
      { k: 'The Technical Barrier', v: 'Legacy sites relied on client-side JavaScript rendering, creating a "crawling blackout" in which search engines saw only a shell of a page.' },
      { k: 'The Discovery Gap', v: 'Inconsistent canonicalization and a total lack of JobPosting Schema meant the operation was failing the "gatekeepers" of modern search.' },
    ],
    strategyTitle: 'The Penpixel Strategy: Audit-to-Implementation',
    strategyIntro: 'Penpixel Creative, in partnership with Joveo, executed an enterprise-level recovery focused on Technical Brand Authority.',
    strategy: [
      { k: 'Infrastructure Remediation', v: 'We eliminated the JavaScript dependencies hiding job data. By optimizing rendering, we ensured every job listing became a "findable" entity.' },
      { k: 'Entity Association (Non-Branded)', v: 'We utilized advanced Schema and metadata strategies to build independent authority in Spanish and Portuguese markets without using restricted keywords.' },
      { k: 'Efficiency Optimization', v: 'We streamlined site architecture to improve Core Web Vitals, moving the site from "failing" to "high-performance."' },
    ],
    impactTitle: 'The Results (Jan 2025 vs. Jan 2026)',
    impacts: [
      { value: '1,500%+', k: 'Brazil Organic Surge', v: '48 to 776 monthly organic visitors, with 29.4% market Share of Voice.' },
      { value: '2,500%+', k: 'Mexico Volume Growth', v: '128 to 3,403 visitors with improved retention (26.1% bounce rate).' },
    ],
    quote: 'Following the success of the initial phase, we continue to refine AI-Search Readiness and Entity Management for both regional sites — with continued exponential growth in recruitment efficiency predicted throughout 2026.',
    sidebarTitle: 'Technical ROI',
    sidebar: [
      { value: '1,500%', label: 'Organic traffic surge in Brazil.' },
      { value: '2,600%', label: 'Total volume increase in Mexico.' },
      { value: 'Pass', label: 'Core Web Vitals optimization.' },
    ],
    regions: [
      { flag: 'BR', title: 'Brazil: The Organic Powerhouse', stats: [ { value: '1,500%+', label: 'Organic surge (48 \u2192 776 monthly visitors)' }, { value: '29.4%', label: 'Market Share / Share of Voice' } ], note: 'Bounce rate dropped (41% \u2192 34%) and session duration optimized, indicating higher user intent.' },
      { flag: 'MX', title: 'Mexico: The Traffic Accelerator', stats: [ { value: '2,500%+', label: 'Total volume growth (128 \u2192 3,403 visitors)' }, { value: '26.1%', label: 'Improved retention (bounce rate)' } ], note: 'A massive scale-up of the digital footprint, ensuring drivers stayed on-site once landed.' },
    ],
    ctaEyebrow: 'Ready for the New Gatekeepers?',
    ctaTitle: 'Is Your Brand Ready for AI-Search?',
    ctaBody: 'Don\u2019t let technical debt hide your authority from ChatGPT, Perplexity, and Gemini. Book your AI-Search Readiness Audit today and ensure your brand is visible, cited, and trusted.',
    ctaLabel: 'Book Your Audit',
  },
];
