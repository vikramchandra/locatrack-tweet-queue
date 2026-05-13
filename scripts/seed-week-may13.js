#!/usr/bin/env node
/**
 * One-time seed: queue 28 tweets (Wed May 13 → Tue May 19, 2026).
 * Writes directly to queue/pending.json. Run once.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const PENDING = path.join(REPO_ROOT, 'queue', 'pending.json');

function slugify(text, max = 40) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#\w+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');
}

function idFromSchedule(scheduleIso, firstText) {
  const d = new Date(scheduleIso);
  const pad = (n) => String(n).padStart(2, '0');
  const prefix = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
  return `${prefix}-${slugify(firstText) || 'untitled'}`;
}

function single(scheduled_at, text) {
  return {
    id: idFromSchedule(scheduled_at, text),
    type: 'single',
    scheduled_at,
    text,
    status: 'pending',
    attempts: 0,
    posted_tweet_id: null,
    posted_at: null,
    last_error: null,
  };
}

function thread(scheduled_at, tweets) {
  return {
    id: idFromSchedule(scheduled_at, tweets[0]),
    type: 'thread',
    scheduled_at,
    tweets,
    status: 'pending',
    attempts: 0,
    posted_tweet_ids: [],
    posted_at: null,
    last_error: null,
  };
}

const IST = '+05:30';

const entries = [
  // ===== Wed May 13 (T1-T3 originally afternoon, shifted late since we seeded after 23:30 IST) =====
  single(`2026-05-13T23:35:00${IST}`,
    'Everyone says AI Overviews killed the map pack. Look at click data. AIO citations get about 0.4 percent CTR for local intent. Map pack still pulls 18 to 24 percent on the same queries. Visibility moved, conversion did not. #LocalSEO #AIO #GEO'),

  single(`2026-05-13T23:50:00${IST}`,
    'March 2026 core update wrap up, what we are seeing for local. Home services held. Med spas got hammered. Auto repair flat. Affiliate listicle pages targeting service keywords lost 60 to 80 percent visibility. Brands won, aggregators lost. Again. #SEO #LocalSEO'),

  single(`2026-05-14T00:10:00${IST}`,
    'Build in public update. The geo grid scan engine is now backfilling missing service area variance for clients we onboarded last month. 12 scans per second on a 4GB dev box. Cost per audit dropped under one cent. #buildinpublic #SaaS #LocalSEO'),

  single(`2026-05-14T01:30:00${IST}`,
    'Local SEO folks, what is the smallest grid radius you have found actionable for service area businesses? 1 mile, 2 miles, 5 miles, more? Trying to set a sensible default for plumbers and HVAC. #LocalSEO #LocalSearch'),

  // ===== Thu May 14 =====
  thread(`2026-05-14T17:30:00${IST}`, [
    'Review velocity beats volume in 2026. Several agencies are reporting the same pattern. Businesses with 50 reviews and 8 new in the last 90 days are outranking competitors with 300 reviews and nothing in the last year. Here is what we are seeing. #LocalSEO #Reviews',
    'Why this works mechanically. Google needs a freshness signal for entity quality. Volume is a one time bet. Recency is ongoing evidence the business still operates and customers still show up. The ranking weight shifted accordingly.',
    'Threshold pattern from the data. 5 to 10 new reviews per month seems to be the floor. Below that, recency signal degrades within 60 days. Above 10 per month, you hit diminishing returns unless your competitors are doing it too.',
    'Practical play if you have a sleepy GBP. Stop chasing the lifetime number. Build a 30 day review request system that gets you to 5 to 8 fresh reviews per month consistently. Velocity is a habit, not a campaign.',
    'Watch competitors on a 30 day rolling window. If they shipped 12 new reviews last month and you shipped 2, you are losing the ranking race even if your total is double theirs. Track the slope, not the volume. #LocalSEO #buildinpublic',
  ]),

  single(`2026-05-14T20:00:00${IST}`,
    '3 GBP business name patterns getting auto suspended in 2026. 1) City name appended, like Joe Plumbing Phoenix. 2) Service descriptor, like Best Roofing Contractor. 3) Multiple keywords stacked, like Affordable 24/7 Emergency Plumber. Trim to legal name now. #LocalSEO #GBP'),

  single(`2026-05-14T22:30:00${IST}`,
    'Build in public, payments wall. Stripe India invite still pending. Razorpay works but Western buyers do not trust it on checkout. Considering Paddle as merchant of record for US and EU, Razorpay only for India. Two pipelines, one ledger. Unavoidable. #buildinpublic #SaaS'),

  single(`2026-05-15T01:30:00${IST}`,
    'If your local SEO audit template does not flag Google removing the Q&A feature in Maps, your template is already stale. All those carefully seeded questions and answers, gone in 30 days. Move that copy into Posts and the GBP description while you still can. #LocalSEO #GBP'),

  // ===== Fri May 15 =====
  single(`2026-05-15T17:30:00${IST}`,
    'Google now generates business summaries from reviews, posts, Q&A. Whatever AI picks becomes your homepage in search. Three plays. Post weekly with the words customers use. Reply to reviews in your service language. Pin one post that frames the business. #LocalSEO #GEO #GBP'),

  single(`2026-05-15T20:00:00${IST}`,
    'Running a real SaaS now costs 85 to 200 dollars per month all in. Hosting, Postgres, email, monitoring. The cost moat funded startups waved around is gone. What is left is judgement and distribution. Neither one money buys faster. #buildinpublic #SaaS #indiehackers'),

  single(`2026-05-15T22:30:00${IST}`,
    'Build in public design call. User has 100 free credits expiring in 12 days plus 100 paid credits that do not expire. Audit fails halfway. How do you refund? My take, refund free first to preserve their paid balance. Customer wins, no expiry surprise. #buildinpublic #SaaS'),

  single(`2026-05-16T01:30:00${IST}`,
    'Hottest local SEO myth still alive in 2026. NAP citations move rankings. They do not. They are table stakes for trust and disambiguation. Your time is better spent on reviews, photos, and Posts. Change my mind. #LocalSEO #SEO'),

  // ===== Sat May 16 =====
  thread(`2026-05-16T19:00:00${IST}`, [
    'Three things I noticed in local SERPs this week. 1) AIO citations favor sources with structured FAQ blocks over highest authority. 2) GBP suspensions hit 3 client accounts for name keyword stuffing. 3) Review velocity gap widened. #LocalSEO #buildinpublic',
    'On the FAQ pattern. Pages with a clean H2 question followed by a 40 to 60 word answer are getting cited 2 to 3x more often in AIO than long flowing articles. Structure is the new authority signal for AI snippets.',
    'On suspensions, the trigger is automated. No human reviewer. The pattern that flagged my clients was descriptor keywords stacked after the legal name. Rename, reverify, restore takes about 9 days right now. Plan for it. #LocalSEO #GBP',
  ]),

  single(`2026-05-16T21:00:00${IST}`,
    'A local rank check from one location is not a report. It is a screenshot from one chair in one coffee shop. Your customers search from highways, parking lots, suburbs. Until you grid the area, you are guessing. #LocalSEO #SEO'),

  single(`2026-05-16T23:00:00${IST}`,
    'Build in public, small thing. The audit history table uses a composite primary key on business id plus scan timestamp instead of an autoincrement. Queries for latest scan per business became 4x faster. Sometimes the schema is the optimization. #buildinpublic #SaaS #postgres'),

  single(`2026-05-17T01:30:00${IST}`,
    'Local SEO consultants and agencies. If you build monthly reports for clients, which page do they actually read? The exec summary, the keyword grid, the review trend, or none of it and they just look at calls? Honest answers welcome. #LocalSEO #agencylife'),

  // ===== Sun May 17 =====
  single(`2026-05-17T19:00:00${IST}`,
    'Week recap, building a SaaS with no engineering background. Claude Code shipped 4 things solo me could not. Zero downtime schema migration, credit ledger with audit, geo grid scheduler, Pundit refactor. Bottleneck moved from code to product. #buildinpublic #vibecoding'),

  single(`2026-05-17T21:00:00${IST}`,
    'Quick GEO test. Open ChatGPT. Paste your homepage H1 and meta description. Ask it to describe what the business does and who it serves. If the answer is vague or wrong, AI search will not surface you. Fix the page, not the prompt. #SEO #GEO #LocalSEO'),

  single(`2026-05-17T23:00:00${IST}`,
    'Build in public, pricing call. Free credits expire 30 days after grant. Paid credits, leaning toward never expire. The case for expiry is forecasting. The case against is punishing the customer for a busy month. What is your model? #buildinpublic #SaaS #pricing'),

  single(`2026-05-18T01:30:00${IST}`,
    'Local SEO this week, 3 things that moved. 1) AIO citation patterns favoring FAQ blocks. 2) GBP name suspension automation flagging 3 client accounts. 3) Review velocity 30 day window widening. Quiet week by 2026 standards. #LocalSEO #SEO'),

  // ===== Mon May 18 =====
  single(`2026-05-18T17:30:00${IST}`,
    'Information gain is the one signal AI cannot fake. Original photos. Pricing you actually quote. Stories from real calls. Every other signal can be regenerated for 10 dollars by a model. After March 2026, this is the only durable edge. #SEO #LocalSEO #GEO'),

  single(`2026-05-18T20:00:00${IST}`,
    'Gemini is answering local queries in a rich visual format now. Translation. If your GBP has 4 stock photos and your competitor has 80 real ones, you are not in the result, you are a footnote. Photo coverage just became a ranking input again. #LocalSEO #GBP #GEO'),

  single(`2026-05-18T22:30:00${IST}`,
    'Build in public, infra detail. Admin panel for API key rotation, factory pattern on the provider layer. Add a key, traffic redistributes. If one gets rate limited or banned, the rest absorb. Boring infra that pays off the day you need it. #buildinpublic #SaaS'),

  single(`2026-05-19T01:30:00${IST}`,
    'Local rank tracker pricing models in the wild. Per location per month. Per keyword per month. Per scan with expiring credits. Flat tier with caps. Which one have you actually been happy paying for as a customer? Genuinely asking. #LocalSEO #SaaS #pricing'),

  // ===== Tue May 19 =====
  single(`2026-05-19T17:30:00${IST}`,
    'Review play if your GBP has 50 lifetime reviews and zero in the last 90 days. Week 1, text 30 recent happy customers a review link. Week 2, add the link to invoice emails. Week 3, train front desk to ask in person. Target, 8 new reviews. Velocity restored. #LocalSEO #GBP'),

  single(`2026-05-19T20:00:00${IST}`,
    'AI Overviews did not kill SEO. It killed thin top of funnel content. Local commercial intent, transactional queries, brand searches still drive clicks. The work got harder for SEO theaters. Easier for operators with real businesses. #SEO #LocalSEO #GEO'),

  single(`2026-05-19T22:30:00${IST}`,
    'Build in public sneak peek. 169 point grid (13 by 13) on a 5 mile radius. For one plumber client it surfaced 4 ranking dead zones their single point report had hidden for 2 years. The map pack is not one rank. It is a topology. #buildinpublic #LocalSEO #SaaS'),

  single(`2026-05-20T01:30:00${IST}`,
    'Building Loca Track in the open. If you do local SEO professionally, what is one feature you wish existed in a rank tracker that nobody is shipping? Not asking for a wishlist, asking what is genuinely missing. #LocalSEO #SaaS'),
];

// sanity check counts before writing
const singles = entries.filter((e) => e.type === 'single').length;
const threads = entries.filter((e) => e.type === 'thread').length;
console.log(`Entries: ${entries.length} total (${singles} singles, ${threads} threads).`);

// check duplicate ids
const ids = new Set();
for (const e of entries) {
  if (ids.has(e.id)) {
    console.error(`DUPLICATE id: ${e.id}`);
    process.exit(1);
  }
  ids.add(e.id);
}

// check char limits
let overLimit = 0;
for (const e of entries) {
  const texts = e.type === 'single' ? [e.text] : e.tweets;
  texts.forEach((t, i) => {
    if (t.length > 280) {
      console.error(`OVER 280 (${t.length}): ${e.id}[${i}]: ${t.slice(0, 60)}...`);
      overLimit++;
    }
  });
}
if (overLimit > 0) {
  console.error(`${overLimit} tweets over 280 chars. Aborting.`);
  process.exit(1);
}

fs.writeFileSync(PENDING, JSON.stringify(entries, null, 2) + '\n');
console.log(`Wrote ${entries.length} entries to ${PENDING}`);
