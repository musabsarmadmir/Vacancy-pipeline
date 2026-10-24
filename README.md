# KO Realty n8n workflows

1. **ko-notice-turnover-kit.json**: POST a notice to a webhook. It creates a dated turnover checklist, moves the unit to the Notice stage, drafts a listing with Groq, and sends a Telegram message.
2. **ko-daily-stuck-digest.json**: weekdays at 8am (America/Edmonton). It moves units from Notice to Move-out once the move-out date arrives, then sends one Telegram digest of units past SLA, grouped by city.

## Setup
1. Run `supabase-schema.sql` in the Supabase SQL editor (adjust to your real columns).
2. Start n8n (free self-hosted):
   `docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n`
3. In n8n: Workflows > Import from file, import both JSON files.
4. Open the **Config** node in each workflow and fill in the values (Supabase URL and service-role key, Groq key, Telegram bot token and chat id, webhook secret).
5. Test workflow 1: click "Execute workflow" and send:
   ```
   curl -X POST http://localhost:5678/webhook-test/ko-notice \
     -H "Content-Type: application/json" -H "x-ko-secret: <your secret>" \
     -d '{"unit_id":"<an id from units>","building":"The Juniper","unit_label":"Apt 100","city":"Calgary","move_out_date":"2026-11-30","rent":1180,"owner":"A. Chen"}'
   ```
6. Activate the workflow. The production URL is `/webhook/ko-notice` (no `-test`).

## Letting the Amplify app reach n8n
n8n on localhost is not reachable from the internet. Either run n8n on a small EC2 instance, or use a tunnel
(`cloudflared tunnel --url http://localhost:5678`) and start n8n with `-e WEBHOOK_URL=https://<tunnel-host>/`.
Call the webhook from a server-side route (for example a Next.js API route) so the secret never reaches the browser.

## Before pushing to GitHub
Export the workflows with the Config values reset to the placeholders. Never commit the Supabase service-role key,
Groq key, Telegram token or webhook secret. The service-role key bypasses Row Level Security and must stay server-side.

## Tuning
- Checklist steps and offsets: `Build checklist` node (days relative to move-out).
- Per-stage SLA: `Find stuck units` node. Keep it in sync with the dashboard.
- Notice is excluded from the stuck digest on purpose: the unit is still occupied, so it is not vacancy.
