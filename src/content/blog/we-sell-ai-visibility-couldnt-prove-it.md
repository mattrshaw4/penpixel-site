---
title: "We Sell AI Visibility. Our Own Site Couldn't Prove It."
metaTitle: "Why an AEO Firm Rebuilt Its Site Off Squarespace"
description: "Why Penpixel Creative migrated off Squarespace before writing a single line of client strategy, and what that decision actually cost us."
pubDate: 2026-08-14
draft: false
author: 'Matt Shaw'
about:
  - 'AI Search Visibility'
  - 'Static Site Architecture'
  - 'Answer Engine Optimization'
  - 'Robots.txt Configuration'
citation:
  - 'https://support.squarespace.com/hc/en-us/articles/206543207-Understanding-Google-SEO-emails-and-console-errors'
  - 'https://support.squarespace.com/hc/en-us/articles/360022347072-Request-that-AI-models-exclude-your-site'
  - 'https://support.wix.com/en/article/editing-your-sites-robotstxt-file'
  - 'https://www.wix.com/plans'
  - 'https://wordpress.com/pricing/'
faqs:
  - question: "Can you edit robots.txt directly on Squarespace?"
    answer: "No. Squarespace generates a robots.txt file automatically but does not expose it for direct editing. AI crawler access is controlled through a single sitewide checkbox that blocks or allows all listed bots at once, not on a per-bot basis."
  - question: "Why does an AEO firm care about controlling its own robots.txt?"
    answer: "In 2026, robots.txt is a strategic document. AI crawlers arrive with different jobs (Search indexing, real-time Agent tasks, model Training) and each one reads robots.txt first. If a platform writes the file for you, the platform is making per-crawler access decisions on your behalf."
  - question: "What made Astro plus Cloudflare Pages the right stack over WordPress.com or Wix?"
    answer: "A static Astro site compiles to plain HTML with no database or plugin ecosystem to maintain. Wix Business Elite ($159.77 a month) bundles ecommerce features a content site does not need. WordPress.com Business grants SSH and GitHub deploys but keeps a database and plugin maintenance surface. Astro plus Cloudflare Pages drops that surface to zero."
  - question: "Why does Penpixel Creative set Cloudflare AI crawler categories to Allow?"
    answer: "Penpixel Creative is an AEO firm. Blocking Search or Agent crawlers would prevent the systems it sells visibility in from reading its own site. Training is the category where deliberation is warranted; Search and Agent are set to Allow as a deliberate choice, not a forgotten default."
  - question: "Is migrating off Squarespace the right call for every business?"
    answer: "No. Most companies do not need to own their deploy pipeline, hand-fix redirects after platform migration, or write their own robots.txt. That is real engineering time. For an AEO firm, that control is the business itself. For most SaaS teams, it is not the best use of engineering hours."
---

![Hero image placeholder: generate with Nano Banana 2 and save as we-sell-ai-visibility-hero.webp](/images/blog/we-sell-ai-visibility-hero.webp)

**Bottom line:** Before Penpixel Creative wrote a single line of client strategy, we rebuilt our own site from the ground up, off Squarespace, because a proprietary platform that hides robots.txt and can't automate schema isn't something an AEO firm can stand behind.

Deven and I sat down to build out Penpixel Creative's strategy. Ten minutes in, we weren't talking about clients anymore. We were talking about our own website, and whether an AI system could actually read it.

That wasn't a branding question. It was a credibility problem.

## The Squarespace Problem

Squarespace isn't built on an open platform like WordPress. It's a closed system: hosting, templates, and code, all locked inside one interface. That's a fine tradeoff for a lot of businesses. Squarespace generates a robots.txt file and an XML sitemap automatically, and for most sites, that's plenty.

It's not fine for us. Squarespace builds that robots.txt file for you, but it won't let you edit it directly, a limitation [confirmed in Squarespace's own help documentation](https://support.squarespace.com/hc/en-us/articles/206543207-Understanding-Google-SEO-emails-and-console-errors). Schema markup exists on the platform, but it's manual and page by page, with no way to deploy it consistently as a site grows. There's no access to server configuration, no edge logic, no way to decide, bot by bot, what GPTBot, ClaudeBot, or PerplexityBot is actually allowed to see. Squarespace's own AI crawler control is a single sitewide checkbox that blocks or allows every listed bot at once, [not a per-bot dial](https://support.squarespace.com/hc/en-us/articles/360022347072-Request-that-AI-models-exclude-your-site).

In 2026, that file is a strategic document, not a formality. AI crawlers show up with different jobs. Some are training models. Some are building a live search index. Some are fetching a single page in real time because a user just asked a question. Each one checks robots.txt first and makes its own call. If you can't write that file, you're not making that call. The platform already made it for you.

We sell structured-data visibility for a living. Running our own site on a platform we couldn't fully open up wasn't a small inconsistency. It was the whole pitch, undermined by our own homepage.

## What We Actually Did

So before we went deep on strategy, we made the call: migrate off Squarespace first, in phases. Keep what mattered (brand colors, down to the hex code), drop what didn't, and rebuild the infrastructure so we owned every layer of it.

A few decisions, in order:

With a background in cloud and DevOps engineering, I'm cost-conscious by default. Squarespace's plans run anywhere from about $16 to close to $100 a month depending on the plan and billing cycle, most small-business builds land in the $25 to $40 range. I priced out cheaper, better-fitting options before committing to anything:

I looked at [Wix](https://www.wix.com/plans) first. Credit where it's due: Wix has closed the robots.txt gap since the last time I evaluated a builder, [you can edit the file directly now](https://support.wix.com/en/article/editing-your-sites-robotstxt-file), per-bot rules included. But real programmability, custom code and API-level control, lives behind the Business Elite plan at $159.77 a month. That's roughly four times Wix's standard Business tier, and it comes bundled with a pile of ecommerce and booking features a content site never touches. I wasn't looking to pay Elite prices for infrastructure I could get for free elsewhere, wrapped in tools I didn't need.

[WordPress.com](https://wordpress.com/pricing/) was the harder no. Their Business plan, $40 a month billed monthly, or $20 to $25 on a longer term, actually gets you SSH, WP-CLI, and GitHub-triggered deploys. That's genuinely close to the workflow I wanted. But it's still a managed CMS sitting on top of a database I'd be responsible for keeping patched and a plugin ecosystem I'd be responsible for keeping current. I wasn't trying to trade one maintenance surface for a smaller one. I was trying to get to zero. A static, Astro-built site compiles down to files. There's no database to secure and no plugin to update, because there's nothing left running once the build finishes.

I already pay for Claude, and I'd spent months building a personal library of custom skills for brand voice, secure code, and infrastructure fundamentals. Using it to actually build the site wasn't a stretch. It was the obvious next step.

For DNS and hosting, Cloudflare was an easy call. I already run it for my portfolio site. It also comes with something that mattered more than I expected: a public preview link for every deployment. Deven could see exactly what I'd built and sign off on it without me walking him through a terminal.

From there, Cloudflare Pages picked up the deployment pipeline natively: push to main, Cloudflare builds it, Cloudflare deploys it. No more manually uploading files and hoping nothing broke.

The result is a static, Astro-built site. Pages render as real HTML by default, no JavaScript a crawler has to wait on, and every piece of technical SEO, our robots.txt, our schema, our sitemap, our headers, is something we write and control directly instead of hoping a vendor set it up right.

**A quick translation, if "static site" and crawler permissions aren't your language:** Astro is a framework that builds pages as plain HTML by default. No JavaScript has to run before a browser, or a bot, can read what's actually on the page. That distinction is the entire reason we can make specific claims about our robots.txt and schema instead of hedging on them.

It's also why every AI crawler category on our Cloudflare zone, Search, Agent, and Training, is set to Allow. We're an AEO firm. Blocking the exact systems we're paid to get our clients in front of would undercut our own pitch before a client ever read it. Allow is a decision we made on purpose, not a default we forgot to check.

If that setting makes you nervous on your own site, you're asking the right question, just maybe not about the right category yet. Search and Agent traffic is what puts you in front of someone typing a question into ChatGPT or Gemini right now. Training is the category worth real deliberation, since that's the one actually feeding a model rather than fetching a live answer for a person. That's a big enough topic to earn its own post. We'll cover it properly soon.

## What It Actually Cost Us

Here's the part most companies leave out of a story like this: it wasn't free, and it wasn't a weekend project.

Migrating off a hosted platform means you inherit everything that platform used to handle quietly. We spent real hours in Google Search Console chasing down legacy Squarespace slugs that no longer existed, remapping redirects, and re-indexing pages by hand so we didn't lose what little search equity we'd already built. That work is unglamorous, and it's exactly the kind of thing a hosted platform is designed to make you never think about.

This also isn't a "leave Squarespace" argument for every business. Most companies don't need to own their deploy pipeline or hand-fix 404s from a platform migration. That's real engineering time, and for most SaaS teams, it isn't the best use of it.

## The Bottom Line

For an AEO firm, controlling that layer isn't optional. It's the business. For most companies, it's one piece of a larger technical SEO picture, and the right call depends on what you're actually trying to be visible for.

But controlling it once isn't the same as owning it. Migrating off Squarespace didn't finish this work, it started it. Robots.txt directives get reconsidered as new bots show up. Cloudflare's own bot categories are shifting their defaults on September 15. Schema needs updating every time we ship something new. That ongoing work is what we mean when we talk about a digital estate: not a site you build once and leave alone, but a property you actively maintain because the bots reading it, and the rules they follow, keep changing under you.

Either way, it's the same question we had to answer for ourselves before we could put it to a client with a straight face: do you actually know what GPTBot, ClaudeBot, and PerplexityBot see when they hit your homepage today, or are you trusting your platform's defaults to still have it handled next quarter?

![GitHub repository language breakdown for the penpixel-site build: Astro 59.2 percent, TypeScript 27.7 percent, JavaScript 10.6 percent, CSS 2.5 percent](/images/blog/penpixel-site-github-languages.webp)

Next up: a technical breakdown of Astro as a static site framework, what it actually does under the hood, and which businesses get real value from pairing it with Cloudflare hosting.
