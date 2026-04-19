#!/usr/bin/env node
/**
 * Claude fallback runner. Invoke locally when GitHub Actions is down or
 * something got stuck. Same code path as the scheduled runner, wrapped with
 * git pull/push and a confirmation prompt.
 *
 *   node scripts/post-catchup.js          (interactive)
 *   node scripts/post-catchup.js --yes    (skip confirmation)
 *   node scripts/post-catchup.js --dry-run
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const { run } = require('./schedule-runner');

const REPO_ROOT = path.join(__dirname, '..');
const PENDING = path.join(REPO_ROOT, 'queue', 'pending.json');

const args = process.argv.slice(2);
const yes = args.includes('--yes') || args.includes('-y');
const dryRun = args.includes('--dry-run');

function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit', ...opts });
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a); }));
}

function summarize() {
  const pending = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
  const now = Date.now();
  const overdue = pending.filter(
    (e) => e.status === 'pending' && Date.parse(e.scheduled_at) <= now
  );
  const future = pending.filter(
    (e) => e.status === 'pending' && Date.parse(e.scheduled_at) > now
  );
  const other = pending.filter((e) => e.status !== 'pending');
  return { pending, overdue, future, other };
}

async function main() {
  console.log('catchup: pulling latest queue state from origin...');
  try {
    sh('git pull --ff-only origin main');
  } catch (e) {
    console.error('git pull failed. fix repo state and rerun.');
    process.exit(1);
  }

  const { pending, overdue, future, other } = summarize();
  console.log(`\nqueue summary:`);
  console.log(`  total pending entries: ${pending.length}`);
  console.log(`  overdue (due now):     ${overdue.length}`);
  console.log(`  scheduled later:       ${future.length}`);
  console.log(`  stuck (posting/other): ${other.length}`);

  overdue.forEach((e) => {
    const preview = e.type === 'single' ? e.text.slice(0, 70) : e.tweets[0].slice(0, 60);
    console.log(`    - ${e.id} [${e.type}] "${preview}${preview.length >= 60 ? '...' : ''}"`);
  });

  if (overdue.length === 0) {
    console.log('\nnothing overdue. exiting.');
    return;
  }

  if (dryRun) {
    console.log('\n--dry-run set. not posting.');
    return;
  }

  if (!yes) {
    const ans = await prompt(`\npost ${overdue.length} overdue tweet(s)? [y/N] `);
    if (!/^y(es)?$/i.test(ans.trim())) {
      console.log('aborted.');
      return;
    }
  }

  console.log('\nrunning scheduler...');
  await run({ dryRun: false });

  console.log('\ncommitting queue updates back to origin...');
  try {
    const status = execSync('git status --porcelain queue/', { cwd: REPO_ROOT }).toString().trim();
    if (!status) {
      console.log('no queue changes to commit.');
      return;
    }
    sh('git add queue/');
    sh('git commit -m "chore(queue): catchup run from laptop"');
    sh('git push origin main');
    console.log('done.');
  } catch (e) {
    console.error('git commit/push failed. queue state is updated locally but not on origin.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
