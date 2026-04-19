# locatrack-tweet-queue

Self-hosted tweet scheduling for ~$3.60/month. No paid SaaS.

**Stack:** X API v2 (pay per post at $0.010) + GitHub Actions (cron every 5 min on public repo = free) + a JSON queue committed back to the repo.

## Layout

```
scripts/
  post-tweet-api.js     # core API posting (single + thread)
  schedule-runner.js    # reads queue, posts due entries
  queue-lint.js         # validates queue JSON
queue/
  pending.json          # upcoming tweets (source of truth)
  posted.json           # archive of posted tweets
  failed.json           # archive of failed attempts
.github/workflows/
  post-scheduled-tweets.yml   # the cron workflow
```

## Local usage

```bash
npm install
cp .env.example .env   # fill in 4 X API keys
node scripts/queue-lint.js
node scripts/schedule-runner.js --dry-run
node scripts/schedule-runner.js
```

## Secrets

Required env vars (set locally in `.env`, set in GitHub Actions as repo secrets):

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

OAuth 1.0a User Context on @LocaTrack. App permissions must be Read and Write.

## Cost

At ~12 posts/day, monthly cost is roughly $3.60. A $10 credit top up lasts ~2.5 months.
