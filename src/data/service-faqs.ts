// FAQ content for the 4 service pages. Every answer is paraphrased directly
// from that page's own copy — nothing invented (no timelines, prices, or
// guarantees the page doesn't already make).
import type { FAQItem } from '../components/FAQSection.astro';

export const auditFaqs: FAQItem[] = [
  {
    question: 'How is this different from a normal SEO audit?',
    answer: 'A standard SEO audit checks crawl errors and keyword rankings. This one stress-tests your brand directly against ChatGPT, Claude, Perplexity, and Gemini to find the structural friction stopping AI agents from citing or recommending you.',
  },
  {
    question: 'What does the audit actually inspect?',
    answer: 'Three layers: Technical Infrastructure (can machines parse your schema and site architecture?), Information Gain (does your content add anything AI doesn\u2019t already know?), and Entity Integrity (is your visual and verbal identity consistent enough for AI to trust it?).',
  },
  {
    question: 'Do I need the Full Ecosystem Audit, or can I get something narrower?',
    answer: 'If you already have a dev team executing fixes, you can order a standalone audit on just one pillar: Technical Infrastructure only, Content Authority only, or Entity Integrity only. Most brands start with the Full Ecosystem Audit because the three failures compound each other.',
  },
  {
    question: 'What do I walk away with?',
    answer: 'A clear read on exactly where your architecture fails machine-first consumption tests, so you know what to fix first instead of guessing.',
  },
];

export const brandFaqs: FAQItem[] = [
  {
    question: 'Why does visual design affect AI search visibility?',
    answer: 'Multimodal AI reads images and layout, not just text, to judge whether a brand is legitimate. If your logo, colors, and fonts vary between your website, your LinkedIn, and industry directories, the AI gets confused about who you are, and confusion kills your citation odds.',
  },
  {
    question: 'What\u2019s actually included?',
    answer: 'Visual Identity Engineering (systems, not just a logo), Multimedia Branding (assets built for video and audio discovery), Cross-Platform Alignment (a forensic audit matching your visual fingerprint everywhere), and Public Sentiment & PR.',
  },
  {
    question: 'Who leads this work?',
    answer: 'Tony Moles, a veteran Creative Director with deep B2B agency experience, leads the design division. Not an SEO generalist moonlighting as a designer.',
  },
  {
    question: 'What do I actually receive?',
    answer: 'A Brand Kit (a machine-ready asset library), the Guidelines (rules that keep internal teams from breaking consistency), and a Multimedia Suite (templates for high-signal video, audio, and social content).',
  },
];

export const entityFaqs: FAQItem[] = [
  {
    question: 'Why do I need ongoing entity management if I already ran an audit?',
    answer: 'AI models retrain constantly. A one-time fix decays: your data drifts, silence lets competitors take your position as the source of truth, and your confidence score collapses. This is continuous reinforcement, not a one-time project.',
  },
  {
    question: 'What do you actually monitor and maintain?',
    answer: 'Technical Defense (infrastructure monitoring, schema updates, API maintenance), Content Freshness (feeding new information into the knowledge graph, restructuring stale assets), and Sentiment Monitoring (catching and correcting AI hallucinations about your brand).',
  },
  {
    question: 'How do you report on results?',
    answer: 'A Monthly Visibility Report, not a timesheet. It quantifies your Share of Voice and sentiment score so you can justify the budget with numbers, not a list of completed tasks.',
  },
  {
    question: 'What\u2019s the difference between the Defense, Growth, and Dominance tiers?',
    answer: 'Defense maintains technical health and keeps your data accurate. Growth adds aggressive publishing to displace competitors in AI results. Dominance adds maximum content volume and PR to own the narrative outright.',
  },
];

export const implementationFaqs: FAQItem[] = [
  {
    question: 'How is this different from the audit?',
    answer: 'The audit diagnoses what\u2019s broken. Strategic Implementation is the team that fixes it, executing the technical, content, and brand remediation the audit identifies instead of handing you a report and walking away.',
  },
  {
    question: 'What gets fixed first?',
    answer: 'We work across three layers: Technical Infrastructure (crawl errors, Core Web Vitals, schema), Content Operations (restructuring your library for AEO and distributing it to high-signal platforms), and Brand & Visual Alignment (eliminating the conflicting signals that cause AI hallucinations).',
  },
  {
    question: 'What are the two ways I can engage you?',
    answer: 'The 30-Day Sprint is project-based: we solve one high-impact bottleneck, like schema architecture or entity synchronization, fast. The Fractional Partner model is ongoing: continuous implementation, monitoring, and internal team alignment, acting as your specialized AI-search department.',
  },
  {
    question: 'My internal marketing team is already good. Why do I need this?',
    answer: 'Your team is built for human persuasion. This is a machine-readability skillset most internal teams don\u2019t have. We\u2019re not replacing them, we\u2019re force-multiplying their output by handling the specialized infrastructure work.',
  },
];
