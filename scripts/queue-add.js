#!/usr/bin/env node
/**
 * Append a tweet or thread to queue/pending.json.
 *
 *   node scripts/queue-add.js single "2026-04-20T09:00" "Tweet text"
 *   node scripts/queue-add.js thread "2026-04-20T13:00" path/to/thread.json
 *   node scripts/queue-add.js thread "2026-04-20T13:00" "T1|||T2|||T3"
 *
 * Scheduled time can include a timezone offset (e.g. 2026-04-20T09:00:00+05:30).
 * If omitted, IST (+05:30) is assumed.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const PENDING = path.join(REPO_ROOT, 'queue', 'pending.json');

function normalizeSchedule(s) {
  // already has offset or Z
  if (/[+-]\d{2}:?\d{2}$/.test(s) || /Z$/.test(s)) return s;
  // add IST
  const withSeconds = /T\d{2}:\d{2}$/.test(s) ? s + ':00' : s;
  return withSeconds + '+05:30';
}

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

function parseThreadArg(arg) {
  if (arg.endsWith('.json') && fs.existsSync(arg)) {
    const parsed = JSON.parse(fs.readFileSync(arg, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error(`${arg} must be a JSON array of strings`);
    return parsed;
  }
  return arg.split('|||').map((s) => s.trim()).filter(Boolean);
}

function main() {
  const [type, whenRaw, ...rest] = process.argv.slice(2);
  if (!type || !whenRaw || rest.length === 0) {
    console.error('usage:');
    console.error('  node scripts/queue-add.js single "2026-04-20T09:00" "Tweet text"');
    console.error('  node scripts/queue-add.js thread "2026-04-20T13:00" path/to/thread.json');
    console.error('  node scripts/queue-add.js thread "2026-04-20T13:00" "T1|||T2|||T3"');
    process.exit(1);
  }

  const when = normalizeSchedule(whenRaw);
  if (Number.isNaN(Date.parse(when))) {
    console.error(`invalid schedule: ${whenRaw}`);
    process.exit(1);
  }

  const pending = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
  let entry;

  if (type === 'single') {
    const text = rest.join(' ');
    entry = {
      id: idFromSchedule(when, text),
      type: 'single',
      scheduled_at: when,
      text,
      status: 'pending',
      attempts: 0,
      posted_tweet_id: null,
      posted_at: null,
      last_error: null,
    };
  } else if (type === 'thread') {
    const tweets = parseThreadArg(rest[0]);
    if (tweets.length === 0) {
      console.error('thread has no tweets');
      process.exit(1);
    }
    entry = {
      id: idFromSchedule(when, tweets[0]),
      type: 'thread',
      scheduled_at: when,
      tweets,
      status: 'pending',
      attempts: 0,
      posted_tweet_ids: [],
      posted_at: null,
      last_error: null,
    };
  } else {
    console.error(`unknown type: ${type}. use single|thread.`);
    process.exit(1);
  }

  if (pending.some((e) => e.id === entry.id)) {
    console.error(`duplicate id: ${entry.id}. change the schedule or the first words to disambiguate.`);
    process.exit(1);
  }

  pending.push(entry);
  fs.writeFileSync(PENDING, JSON.stringify(pending, null, 2) + '\n');

  console.log(`added: ${entry.id}`);
  console.log(`  scheduled_at: ${entry.scheduled_at}`);
  console.log(`  type: ${entry.type}`);

  // run the linter to catch any issues before commit
  try {
    execSync('node scripts/queue-lint.js', { cwd: REPO_ROOT, stdio: 'inherit' });
  } catch (e) {
    console.error('\nqueue-lint failed. entry was written but has issues. fix pending.json before committing.');
    process.exit(1);
  }
}

main();
