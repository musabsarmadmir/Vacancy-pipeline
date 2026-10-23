# KO Realty vacancy pipeline

Turnover operations dashboard for 800 synthetic Calgary and Edmonton units. The app is a Next.js application with a Supabase data source and a deterministic demo-data fallback.

## Features

- Vacancy pipeline from notice through lease signed
- Unit search, city filtering, and vacancy/stuck filters
- Turnover task view
- Performance view
- Workspace settings view
- Supabase-backed unit data with demo mode when Supabase variables are absent

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project for live data (optional for demo mode)

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

The dashboard starts in demo mode with deterministic seed data. To use Supabase, copy `.env.example` to `.env.local`, replace the placeholder values, and restart the development server:

```powershell
Copy-Item .env.example .env.local
```

Do not commit `.env.local`. The repository ignores local environment files.

## Validate before publishing

```bash
npx tsc --noEmit
npm run build
```

`npm run build` is the most useful deployment check because it validates the production Next.js build.
