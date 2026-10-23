# KO Realty vacancy pipeline

Turnover operations dashboard for 800 synthetic Calgary and Edmonton units.

## Run locally

```bash
npm install
npm run dev
```

The dashboard starts in demo mode with deterministic seed data. Copy `.env.example` to `.env.local` and add Supabase values to use live data.

## Supabase

1. Run `supabase/migrations/001_vacancy_pipeline.sql` in the Supabase SQL editor.
2. Run `npm run seed` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set.

The six stage timestamps are `notice_at`, `move_out_at`, `listed_at`, `first_showing_at`, `application_at`, and `lease_signed_at`. The seed uses a deterministic pattern so previews and local data are stable.

## n8n

Import `n8n/vacancy-turnover.json`. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LISTING_DRAFT_WEBHOOK_URL`, and `SLACK_WEBHOOK_URL` as n8n environment variables. The notice webhook creates a turnover checklist and sends listing details to the drafting endpoint. A daily schedule finds units with no lease after 30 days (or not listed three days after move-out) and alerts operations.
