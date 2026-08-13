---
title: 'Cloudflare Taxonomy Gives You a Steering Wheel for AI Traffic. Use It.'
metaTitle: 'Cloudflare AI Taxonomy: How to Configure robots.txt'
description: "Control AI crawlers with Cloudflare's taxonomy. Learn to configure robots.txt for Search, Agent, and Training traffic."
pubDate: 2026-08-13
author: 'Matt Shaw'
about:
  - 'AI Search Visibility'
  - 'AI Crawler Access'
  - 'Robots.txt Configuration'
citation:
  - 'https://blog.cloudflare.com/content-independence-day-ai-options/'
  - 'https://blog.google/products-and-platforms/products/search/search-io-2026/'
faqs:
  - question: 'How does Cloudflare classify AI traffic under its updated taxonomy?'
    answer: 'Cloudflare splits AI traffic into three categories: Search (indexing content for reference answers), Agent (real-time, user-directed bots executing tasks or transactions), and Training (harvesting data to train underlying model weights).'
  - question: 'What happens to multi-purpose crawlers like Googlebot if AI Training is blocked?'
    answer: 'Cloudflare evaluates crawlers by all their activities and enforces the most restrictive policy. If a crawler serves both Search and Training purposes (like Googlebot), blocking Training will block the crawler entirely, stopping Search indexing as well.'
  - question: 'What changes will Cloudflare automatically enforce on September 15, 2026?'
    answer: 'Cloudflare will automatically block Training and Agent traffic on ad-supported pages for new domains and unconfigured accounts while leaving Search allowed. Site owners must opt out in Security settings before September 15 to retain custom configurations.'
  - question: 'What is the function of the use= directive in extended Content-Signals?'
    answer: 'The use= parameter in robots.txt specifies how bots can use captured content: use=immediate (interact with zero retention), use=reference (index, excerpt, and link back), or use=full (summarize and reproduce content).'
  - question: "How do Google's I/O 2026 Information Agents map to Cloudflare's taxonomy?"
    answer: "Google's Information Agents operate in real time to execute standing tasks, browser actions, and bookings on a user's behalf. Cloudflare classifies these as Agent traffic, distinct from standard Search crawlers."
---

Cloudflare replaced its one-click "block AI bots" switch with a real taxonomy: Search, Agent, and Training, and will start enforcing them as defaults on September 15, 2026. Meanwhile Google confirmed at I/O that Search is becoming agent-driven. So the crawl-or-block binary you've been running on is obsolete.

**Key Takeaways**

- **Binary Blocking Is Dead:** AI traffic is no longer a single category; it is split into Search, Agent, and Training behaviors that require distinct access policies.
- **Cloudflare's September 15 Enforcement:** Cloudflare will begin blocking Training and Agent bots by default on ad-supported pages, evaluating multi-purpose crawlers by their most restrictive action.
- **The Rise of Agentic Search:** Real-time AI agents now execute direct tasks on a user's behalf, making granular permission control essential for maintaining traffic and conversions.
- **Zero-Tooling Directives:** Publishers can declare intent immediately by adding Cloudflare's Content-Signal extension (including the new use= parameter) directly to their existing robots.txt file.

## Why The Binary AI Traffic Crawl/Block Is Broken

For the last year, most site owners had exactly one decision to make about AI traffic: block it or don't.

That decision made sense when the only question was "will this bot train a model on my content." It stopped making sense the moment "AI bot" started covering three completely different jobs:

- a crawler indexing you for search
- an agent visiting your site in real time to complete a task for a human
- and a crawler harvesting you to train a model

Treating those as one category meant you were either blocking traffic you wanted (referral-generating search crawlers) or allowing traffic you didn't (training crawlers with no path back to you).

## What Has Cloudflare's AI Agent Traffic Taxonomy Changed

Cloudflare's July 1 update [splits AI traffic into three enforceable categories](https://blog.cloudflare.com/content-independence-day-ai-options/), available to every customer including Free tier:

- **Search:** indexing your content to answer questions about it later. This is the behavior most likely to send you traffic back, so Cloudflare keeps it allowed by default.
- **Agent:** real-time, user-directed bots completing a task on someone's behalf right now. Think ChatGPT-User, or Claude and Gemini driving a browser session. There's a human waiting on the other end.
- **Training:** permanently absorbing your content into a model's weights.

Two enforcement details matter more than the taxonomy itself:

### Multi-purpose crawlers get evaluated on everything they do, not just the label you'd expect.

If Googlebot crawls for both Search and Training, and you block Training, you block Googlebot. Full stop.

That's true even though you probably still want its Search behavior. Cloudflare's stance is that this is a feature, not a bug: it forces bot operators toward honest, separated crawlers instead of one crawler quietly doing three jobs under one name.

### The new Cloudflare taxonomy defaults land September 15, 2026.

For new domains, *Training* and *Agent* traffic gets blocked by default specifically on pages that carry ads. *Search* stays allowed.

**The logic:** an ad is a signal that you want a human's attention on that page, so bots that don't drive human attention get filtered there. You can opt out of the new defaults in Security settings before the date if you want no change to how Training-plus-Search crawlers behave on your site.

Cloudflare is also extending Content Signals in robots.txt with a fourth, optional field describing what a bot is allowed to do with what it takes, not just whether it can take it:

<pre><code>User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /</code></pre>

- **use=immediate:** interact, store and reuse nothing
- **use=reference:** index, excerpt, link back (the default)
- **use=full:** summarize and reproduce

That's a real lever. [Our own robots.txt](/robots.txt) already carries hand-written Content-Signal directives; this extension slots directly into that same file with no new tooling required.

## Why Cloudflare's Taxonomy Matters Right Now, Not Eventually

[Deven's issue](/blog/your-legacy-seo-dashboard-is-old) made the point that search rankings don't carry the weight they used to. Google just handed us the receipts.

At I/O, [Google confirmed Gemini 3.5 Flash](https://blog.google/products-and-platforms/products/search/search-io-2026/) as the new default model across AI Mode globally and shipped its biggest Search box redesign in over 25 years, one built to take text, images, files, video, or Chrome tabs as input and hand back a synthesized answer instead of a ranked list.

The part that actually connects to Cloudflare's taxonomy: Google is launching "information agents" that run continuously in the background, reasoning across the web and Google's real-time data to answer a standing question on a user's behalf, and it's expanding agentic booking to the point where Google will call a business directly for the user.

That's not a search crawler. That's Cloudflare's Agent classification, at Google's scale, doing transactions on a human's behalf.

Which means the question "do I allow Google's crawler" is no longer one question. It's at least two: do you want Google's Search behavior indexing you, and separately, do you want Google's Agent behavior acting on a user's behalf on your site, potentially completing a booking or a task without a human ever loading your page in a browser.

Those used to be the same bot.

They're not staying that way, and the sites that figure out how to answer both questions correctly are the ones that stay visible as this shift plays out.

## How To Implement Cloudflare's Agent Taxonomy In Your robots.txt File

To access and edit your robots.txt file, connect to your website's root server directory (typically public_html or www) via FTP, your web host's File Manager, or your CMS's file editor plugin. Open or create the robots.txt file using a plain text editor, paste your new Content-Signal directives at the top, and save the changes so the file resolves directly at yourdomain.com/robots.txt.

1. **Audit your current robots.txt and Content-Signal setup.** Know what you're currently allowing before September 15 changes it for you.
2. **Decide your posture per category, not per bot.**
   - *Search:* almost always allow.
   - *Training:* decide based on whether you're getting anything back for it.
   - *Agent:* this is the one worth real thought now, since it's the category that's about to carry actual transactions, not just research.
3. **Add the use= signal.** It costs one line in a file you already maintain, and it's the clearest statement of intent you can make to a bot operator who wants to stay Verified.
4. **Mark your calendar for September 15.** If the new ad-page defaults would change something you're currently relying on, opt out before the date, not after.

This is the infrastructure half of the AI visibility conversation. [Deven's covering the "are you showing up correctly" half](/blog/your-legacy-seo-dashboard-is-old). Both questions matter, and increasingly, they're the same conversation happening from two different directions.

## Sources

- [Cloudflare: Your site, your rules: new AI traffic options for all customers](https://blog.cloudflare.com/content-independence-day-ai-options/)
- [Google: A new era for AI Search](https://blog.google/products-and-platforms/products/search/search-io-2026/)
