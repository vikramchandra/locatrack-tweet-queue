#!/usr/bin/env node
// One-off helper to bulk add the 14-tweet plan starting 2026-05-27.
// Mirrors the entry format from queue-add.js.
const fs = require('fs');
const path = require('path');

const PENDING = path.join(__dirname, '..', 'queue', 'pending.json');

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

const TWEETS = [
  ['2026-05-27T19:00:00+05:30', "OpenAI is courting small local businesses for ChatGPT ads. Car washes, dry cleaners, plumbers. If this ships, the local visibility playbook shifts from GBP first, ChatGPT ads later to GBP and ChatGPT ads in parallel from day one. #LocalSEO #AISearch"],
  ['2026-05-27T23:00:00+05:30', "Real map pack movement from the May 2026 core update this weekend. Home services and medspas felt it the most in the grids I track. Reviews and GBP completeness held up. Sites with thin local landing pages took the hit. #LocalSEO #CoreUpdate #MapPack"],
  ['2026-05-28T19:00:00+05:30', "Google Business Profile now shows view counts on individual photos and videos. Finally a metric that ties media uploads to outcomes. Going to start logging which photo types pull the most views per niche. Service shots vs storefront vs team. #LocalSEO #GBP"],
  ['2026-05-28T23:00:00+05:30', "Sundar said AI search rewards content that goes deeper. True for informational queries. For local intent the algorithm still rewards proximity, reviews, and a complete GBP more than depth. Two very different optimization tracks now. #LocalSEO #AISearch"],
  ['2026-05-29T19:00:00+05:30', "June 15 is the deadline for Google's new back button hijack policy. 19 of 25 publishers Glenn Gabe tracked have already stopped. 6 still doing it. The threat of a manual action moved more sites in 3 weeks than any algo update would in a year. #SEO #GoogleSpam"],
  ['2026-05-29T23:00:00+05:30', "Spent the weekend on Loca Track's credit system. Free credits expire in 30 days. Paid credits never expire. Easy until an audit fails halfway through and you need to refund 200 mixed credits with the right expiry on each. Edge cases everywhere. #buildinpublic #SaaS"],
  ['2026-05-30T19:00:00+05:30', "Volume of reviews on a GBP matters less than the gap between you and the rank 1 listing in your niche. If they have 4,000 and you have 200, you can rank in the map pack but you will not get the click. Reviews are a conversion lever, not just a ranking lever. #LocalSEO #GBP"],
  ['2026-05-30T23:00:00+05:30', "Pricing for Loca Track is the hardest decision so far. Per location per month feels safe but punishes the small operator. Credit based is fairer but harder to forecast revenue. Leaning credit with paid credits that never expire. Open to pushback. #SaaS #buildinpublic"],
  ['2026-05-31T19:00:00+05:30', "Building a global SaaS from India in 2026. Stripe wants me to wait for an invite. Paddle does not work under RBI rules. Razorpay works but Western buyers do not trust the brand yet. Payment is its own product before you build the actual product. #SaaS #buildinpublic"],
  ['2026-05-31T23:00:00+05:30', "Vibe coding myth. You sip coffee while the AI builds. Reality. You spend 4 hours arguing with Claude about whether single table inheritance fits your audit results table. The AI is your co pilot. Not your pilot. You still fly the plane. #buildinpublic #SaaS"],
  ['2026-06-01T19:00:00+05:30', "AI Overviews are rendering wonky HTML this week. Tables half plain text half markdown. Raw schema bleeding through. If you publish with structured data, audit how Google parses it now before the next core update locks those signals in. #SEO #AIOverviews"],
  ['2026-06-01T23:00:00+05:30', "Ranking and conversion are two different fights in local SEO. Map pack #1 wins you the impression. Photos, reviews, Q&A, and GBP posts win you the click. The cheapest gains in local right now are on the conversion side, not the ranking side. #LocalSEO #GBP"],
  ['2026-06-02T19:00:00+05:30', "How many GBPs should a home service business have. Some say one per office. Some say five across a city. Honest answer. If those addresses are real staffed locations it works. If they are virtual offices it is a suspension waiting to happen. #LocalSEO #GBP"],
  ['2026-06-02T23:00:00+05:30', "For local SEOs running agencies. What is the one report your clients ask for every month that no tool gives you out of the box. Trying to figure out what to build next in Loca Track. The answers might literally become product. #LocalSEO #buildinpublic"],
];

const pending = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
let added = 0;
for (const [when, text] of TWEETS) {
  if (text.length > 280) {
    console.error(`SKIP (${text.length} chars > 280): ${text.slice(0, 60)}...`);
    continue;
  }
  const id = idFromSchedule(when, text);
  if (pending.some((e) => e.id === id)) {
    console.error(`SKIP duplicate id: ${id}`);
    continue;
  }
  pending.push({
    id,
    type: 'single',
    scheduled_at: when,
    text,
    status: 'pending',
    attempts: 0,
    posted_tweet_id: null,
    posted_at: null,
    last_error: null,
  });
  added++;
  console.log(`added: ${id} (${text.length} chars)`);
}
fs.writeFileSync(PENDING, JSON.stringify(pending, null, 2) + '\n');
console.log(`\n${added} entries added to ${PENDING}`);
