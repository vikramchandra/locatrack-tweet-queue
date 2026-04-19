#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const { TwitterApi } = require('twitter-api-v2');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeClient() {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    throw new Error('Missing one or more X_* env vars. Check .env.');
  }
  return new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_TOKEN_SECRET,
  });
}

async function postSingle(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Tweet text empty.');
  if (text.length > 280) throw new Error(`Tweet is ${text.length} chars, max 280.`);
  const client = makeClient();
  const res = await client.v2.tweet(text);
  return { id: res.data.id, text: res.data.text };
}

async function postThread(tweets) {
  if (!Array.isArray(tweets) || tweets.length === 0) {
    throw new Error('Thread must be a non-empty array of strings.');
  }
  tweets.forEach((t, i) => {
    if (typeof t !== 'string' || !t.trim()) throw new Error(`Tweet ${i + 1} is empty.`);
    if (t.length > 280) throw new Error(`Tweet ${i + 1} is ${t.length} chars, max 280.`);
  });
  const client = makeClient();
  const ids = [];
  let prevId = null;
  for (let i = 0; i < tweets.length; i++) {
    const payload = prevId
      ? { text: tweets[i], reply: { in_reply_to_tweet_id: prevId } }
      : { text: tweets[i] };
    const res = await client.v2.tweet(payload);
    ids.push(res.data.id);
    prevId = res.data.id;
    if (i < tweets.length - 1) await sleep(1500);
  }
  return { ids };
}

function parseThreadInput(arg) {
  if (!arg) throw new Error('Thread input missing.');
  if (arg.endsWith('.json') && fs.existsSync(arg)) {
    const parsed = JSON.parse(fs.readFileSync(arg, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error(`${arg} must contain a JSON array of strings.`);
    return parsed;
  }
  return arg.split('|||').map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'single') {
    const text = rest.join(' ');
    const out = await postSingle(text);
    console.log(`Posted tweet id=${out.id}`);
    console.log(`https://x.com/LocaTrack/status/${out.id}`);
    return;
  }
  if (cmd === 'thread') {
    const tweets = parseThreadInput(rest[0]);
    console.log(`Posting thread of ${tweets.length} tweets...`);
    const out = await postThread(tweets);
    out.ids.forEach((id, i) => console.log(`  ${i + 1}/${out.ids.length}  id=${id}`));
    console.log(`https://x.com/LocaTrack/status/${out.ids[0]}`);
    return;
  }
  console.error('Usage:');
  console.error('  node scripts/post-tweet-api.js single "Tweet text"');
  console.error('  node scripts/post-tweet-api.js thread "T1|||T2|||T3"');
  console.error('  node scripts/post-tweet-api.js thread path/to/tweets.json');
  process.exit(1);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('ERROR:', e.message);
    if (e.data) console.error('API response:', JSON.stringify(e.data, null, 2));
    process.exit(1);
  });
}

module.exports = { postSingle, postThread };
