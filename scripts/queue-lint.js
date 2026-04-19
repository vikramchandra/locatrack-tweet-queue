#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const QUEUE_DIR = path.join(__dirname, '..', 'queue');
const FILES = ['pending.json', 'posted.json', 'failed.json'];

const VALID_STATUSES = new Set(['pending', 'posting', 'posted', 'failed']);
const VALID_TYPES = new Set(['single', 'thread']);

// Unicode dashes that should never appear (em, en, figure, minus, hyphen-bullet)
const BANNED_DASHES = /[\u2013\u2014\u2015\u2212\u2043\u2012]/;
const CURLY_QUOTES = /[\u2018\u2019\u201C\u201D]/;
const SECRET_LIKE = /(X_API_KEY|X_API_SECRET|X_ACCESS_TOKEN|[A-Fa-f0-9]{40,})/;

const errors = [];
const warnings = [];
const seenIds = new Set();

function checkText(text, where) {
  if (typeof text !== 'string') {
    errors.push(`${where}: text must be a string`);
    return;
  }
  if (!text.trim()) errors.push(`${where}: text is empty`);
  if (text.length > 280) errors.push(`${where}: ${text.length} chars, max 280`);
  if (BANNED_DASHES.test(text)) errors.push(`${where}: contains unicode dash (em/en/etc). Use plain comma, period, or hyphen-minus`);
  if (CURLY_QUOTES.test(text)) errors.push(`${where}: contains curly quote. Use straight quote`);
  if (SECRET_LIKE.test(text)) errors.push(`${where}: text looks like it may contain a secret`);
}

function checkEntry(entry, file, idx) {
  const where = `${file}[${idx}]${entry.id ? ` id=${entry.id}` : ''}`;

  if (!entry.id || typeof entry.id !== 'string') errors.push(`${where}: missing or invalid id`);
  else if (seenIds.has(entry.id)) errors.push(`${where}: duplicate id "${entry.id}" across queue files`);
  else seenIds.add(entry.id);

  if (!VALID_TYPES.has(entry.type)) errors.push(`${where}: invalid type "${entry.type}", must be single|thread`);
  if (!VALID_STATUSES.has(entry.status)) errors.push(`${where}: invalid status "${entry.status}"`);

  const dt = Date.parse(entry.scheduled_at);
  if (Number.isNaN(dt)) errors.push(`${where}: scheduled_at "${entry.scheduled_at}" is not parseable`);
  else if (file === 'pending.json' && dt < Date.now() - 60_000) {
    warnings.push(`${where}: scheduled_at is in the past`);
  }

  if (entry.type === 'single') {
    checkText(entry.text, `${where}.text`);
  } else if (entry.type === 'thread') {
    if (!Array.isArray(entry.tweets) || entry.tweets.length === 0) {
      errors.push(`${where}: tweets must be a non-empty array`);
    } else {
      entry.tweets.forEach((t, i) => checkText(t, `${where}.tweets[${i}]`));
    }
  }
}

function main() {
  for (const f of FILES) {
    const p = path.join(QUEUE_DIR, f);
    if (!fs.existsSync(p)) {
      errors.push(`${f}: missing at ${p}`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      errors.push(`${f}: invalid JSON: ${e.message}`);
      continue;
    }
    if (!Array.isArray(data)) {
      errors.push(`${f}: root must be an array`);
      continue;
    }
    data.forEach((entry, idx) => checkEntry(entry, f, idx));
  }

  if (warnings.length) {
    console.log(`WARNINGS (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
  if (errors.length) {
    console.error(`\nERRORS (${errors.length}):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`OK. Checked ${seenIds.size} entries across ${FILES.length} files.`);
}

main();
