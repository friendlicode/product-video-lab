# Product Video Lab

An internal tool for turning a product brief into a finished short-form video:
brief extraction, story directions, hook options, script, storyboard, captions,
voiceover, and final render.

## Stack

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4, shadcn/ui (zinc dark theme)
- Supabase (Postgres + Auth + Storage + Edge Functions)
- OpenAI (`gpt-4o`) for generation steps
- ElevenLabs for voiceover (added in Stage 3 of the deployment plan)
- Remotion + FFmpeg for video rendering (separate worker repo, Stages 4 and 5)

## Quick start (local dev)

```
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
npm run dev
```

The app runs at http://localhost:5173.

## OpenAI API key

The app does NOT ship a shared OpenAI key. After logging in, each user opens
the Settings page and pastes their own `sk-...` key. The key lives in the
user's browser `localStorage` and never hits the server. This is the
"Option 3" security model described in `DEPLOYMENT_PLAN.md`.

If you prefer to seed a key for local dev only, set `VITE_OPENAI_API_KEY` in
`.env.local`. Do NOT set it in Vercel for production.

## Scripts

- `npm run dev` starts the Vite dev server on port 5173.
- `npm run build` typechecks and produces a production bundle in `dist/`.
- `npm run preview` serves the production bundle locally.

## Deployment

See `DEPLOYMENT_PLAN.md` in this repo for the full five-stage plan
(Supabase prod, Vercel frontend, ElevenLabs voiceover, Remotion renderer,
FFmpeg preprocessing).

## Repository layout

- `src/pages/` top-level routes (ProjectList, ProjectDetail, Settings, etc.)
- `src/components/` UI components, grouped by feature (generation, storyboard, render, layout, projects, ui)
- `src/hooks/` data-fetching hooks (`useProjects`, `useScripts`, `useRenderJobs`, etc.)
- `src/services/` thin wrappers over Supabase and OpenAI (projects, assets, briefs, stories, hooks, scripts, storyboards, captions, approvals, rendering, generation, activity)
- `src/lib/` shared utilities (`supabase.ts`, `openai.ts`, `projectConstants.ts`, `utils.ts`, `time.ts`)
- `src/types/` TypeScript definitions (`db.ts` mirrors the Postgres schema; `index.ts` has app-level types)
- `supabase/migrations/` SQL migrations, applied in numeric order
- `supabase/functions/` Supabase Edge Functions (added in Stage 3)
