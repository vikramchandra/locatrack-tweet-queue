#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { postSingle, postThread } = require('./post-tweet-api');

const QUEUE_DIR = path.join(__dirname, '..', 'queue');
const PENDING = path.join(QUEUE_DIR, 'pending.json');
const POSTED = path.join(QUEUE_DIR, 'posted.json');
const FAILED = path.join(QUEUE_DIR, 'failed.json');
const MAX_ATTEMPTS = 5;

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');

function summarize(entry) {
  if (entry.type === 'single') {
    const t = entry.text.slice(0, 60);
    return `single "${t}${entry.text.length > 60 ? '...' : ''}"`;
  }
  return `thread (${entry.tweets.length} tweets) "${entry.tweets[0].slice(0, 50)}..."`;
}

function isDue(entry, now) {
  if (entry.status !== 'pending') return false;
  const dt = Date.parse(entry.scheduled_at);
  if (Number.isNaN(dt)) return false;
  return dt <= now;
}

async function postEntry(entry) {
  if (entry.type === 'single') {
    const res = await postSingle(entry.text);
    entry.posted_tweet_id = res.id;
  } else {
    const res = await postThread(entry.tweets);
    entry.posted_tweet_ids = res.ids;
  }
  entry.status = 'posted';
  entry.posted_at = new Date().toISOString();
  entry.last_error = null;
}

async function run({ dryRun }) {
  const pending = readJson(PENDING);
  const now = Date.now();
  const due = pending.filter((e) => isDue(e, now));
  const skipped = pending.length - due.length;

  console.log(`[${new Date().toISOString()}] schedule-runner ${dryRun ? '(DRY RUN)' : ''}`);
  console.log(`  queue size: ${pending.length}`);
  console.log(`  due: ${due.length}`);
  console.log(`  skipped (not due or not pending): ${skipped}`);

  if (due.length === 0) {
    console.log('  nothing to do.');
    return;
  }

  for (const entry of due) {
    console.log(`  -> ${entry.id}: ${summarize(entry)}`);
  }

  if (dryRun) {
    console.log('\nDRY RUN: no tweets posted, no files written.');
    return;
  }

  const posted = readJson(POSTED);
  const failed = readJson(FAILED);
  let remaining = pending.filter((e) => !isDue(e, now));

  for (const entry of due) {
    entry.attempts = (entry.attempts || 0) + 1;
    entry.status = 'posting';
    // persist "posting" state first to prevent double-post on overlap
    writeJson(PENDING, [...remaining, entry]);

    try {
      await postEntry(entry);
      posted.push(entry);
      writeJson(POSTED, posted);
      writeJson(PENDING, remaining);
      console.log(`  posted: ${entry.id}`);
    } catch (e) {
      entry.status = 'pending';
      entry.last_error = e.message;
      console.error(`  FAILED: ${entry.id}: ${e.message}`);
      if (entry.attempts >= MAX_ATTEMPTS) {
        entry.status = 'failed';
        failed.push(entry);
        writeJson(FAILED, failed);
        writeJson(PENDING, remaining);
        console.error(`  -> moved to failed.json (attempts=${entry.attempts})`);
      } else {
        writeJson(PENDING, [...remaining, entry]);
      }
    }

    // small rate limit buffer between posts
    if (due.indexOf(entry) < due.length - 1) {
      await new Promise((r) => setTimeout(r, 30_000));
    }
  }
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  run({ dryRun }).catch((e) => {
    console.error('FATAL:', e.message);
    process.exit(1);
  });
}

module.exports = { run };
