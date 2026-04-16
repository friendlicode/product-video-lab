# Product Video Lab: Production Deployment Plan

## Context

Product Video Lab is a React 19 + Vite + Supabase app (Phases 1 to 10 complete) that has
only ever run on `localhost`. The goal is to take it to production end to end with the
user acting as a non-developer operator. You need exact clicks, exact commands,
exact SQL, and a verification checklist for every stage. The plan covers five stages:
Supabase production, Vercel frontend, ElevenLabs voiceover, Remotion render worker
(separate repo), and FFmpeg preprocessing inside the renderer.

Because you are non-technical, the plan favors explicit steps over shortcuts,
prefers managed hosting over DIY servers (Vercel, Railway, Supabase), and includes
rollback paths for every stage.

---

## Audit findings (summary)

| Area | Finding |
|------|---------|
| Stack | React 19, Vite 8, Tailwind v4, Supabase JS 2.103, TypeScript 6.0.2, react-router 7. |
| Migrations | `supabase/migrations/001_initial_schema.sql` (full schema, RLS, triggers, 2 buckets) and `supabase/migrations/002_seed_data.sql` (seed data) both present. |
| Storage buckets in 001 | `project-assets` (50 MB, images/video) and `render-outputs` (500 MB). The `voiceover` bucket is NOT created yet. Stage 3 adds it. |
| Scripts table | Has `voiceover_script` text but NO `voice_id` or `audio_url`. Stage 3 adds these in a new migration 003. |
| Env reference | `src/lib/supabase.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `src/lib/openai.ts` reads `VITE_OPENAI_API_KEY` (client-side, see risk below). |
| `.env.local` | Present (good, and `*.local` is gitignored). |
| `.env.example` | MISSING. Stage 2 creates it. |
| `README.md` | MISSING. Stage 2 creates a minimal one. |
| `CLAUDE.md` | MISSING (you mentioned it, but the file does not exist; not blocking). |
| Git | Local repo with 10 commits, last is `6fe3eef Phase 9 & 10: render queue, settings, version compare, and polish pass`. NO remote configured. Stage 2 adds GitHub. |
| `supabase/functions/` | Does not exist. Stage 3 creates it. |

### Security risk to flag up front

`VITE_OPENAI_API_KEY` is a Vite env var, which means **it gets bundled into the
browser JavaScript**. Anyone who can open the deployed site can view the key in
DevTools. For a truly public site this is unsafe.

Three options, ranked:

1. **Best**: move every OpenAI call into a Supabase Edge Function. The frontend calls
   the function with the user's auth token, the function uses a server-side
   `OPENAI_API_KEY` secret. No key ever leaves the server.
2. **Acceptable for internal-only use**: keep the Vercel deploy behind Vercel
   Password Protection (Pro plan) or behind Supabase auth gating, so only trusted
   team members can load the JS bundle. The key is still visible to them.
3. **Keep current behavior**: rely on the existing Settings UI where each user
   pastes their own OpenAI key into localStorage. The `VITE_OPENAI_API_KEY` env var
   acts as a fallback only. Works fine if every user has their own key.

Option 3 already works today and matches the existing code. Option 1 is the only
truly secure option for a public site. Default recommendation is Option 3 for now
(internal pilot), with Option 1 scheduled as a follow-up.

---

## Collect your keys (do this before Stage 1)

Open a password manager or a text file and gather:

- GitHub account (free). Needed in Stage 2.
- Vercel account (free, Hobby tier). Needed in Stage 2. Sign up with GitHub.
- Supabase account (free). Needed in Stage 1. Sign up at supabase.com.
- Railway account (pay-as-you-go, ~$5/mo credit free trial). Needed in Stage 4.
- OpenAI API key (`sk-...`). You already have one in `.env.local`.
- ElevenLabs account + API key. Needed in Stage 3. Sign up at elevenlabs.io.

After Stage 1 you will also have:

- `SUPABASE_URL` (looks like `https://abcdefgh.supabase.co`)
- `SUPABASE_ANON_KEY` (long JWT starting with `eyJhbGci...`, safe for browser)
- `SUPABASE_SERVICE_ROLE_KEY` (long JWT, **server-only, never paste into frontend**)

---

## Cost estimates (as of 2026-04)

Rough monthly cost for a small internal team at low volume:

| Service | Free tier | Paid tier notes | Likely monthly cost |
|---------|-----------|-----------------|---------------------|
| Supabase | 500 MB DB, 1 GB storage, 50k MAU, 2 GB egress | Pro $25/mo for 8 GB DB, 100 GB storage, daily backups. | $0 to $25 |
| Vercel | 100 GB bandwidth, unlimited static. No commercial use on Hobby. | Pro $20/mo/seat for commercial use and password protect. | $0 to $20 |
| Railway | $5 free credit, then pay per resource. Worker ~0.5 vCPU idle, spikes during renders. | $5 to $20 typical for a low-volume render worker. | $5 to $30 |
| OpenAI | None. Pay per token. | `gpt-4o` ~$2.50/M input + $10/M output. Each brief/script/storyboard run ~1 to 5k tokens. | $5 to $50 depending on usage |
| ElevenLabs | 10k chars/mo free | Starter $5/mo for 30k chars, Creator $22/mo for 100k chars, higher tiers for commercial rights. | $0 to $22 |
| GitHub | Private repos free | N/A | $0 |

**Typical total for an internal pilot**: $15 to $100/month, dominated by OpenAI
usage and render frequency.

---

## Stage 1: Supabase production setup

### Prerequisites
- Supabase account.
- Access to `supabase/migrations/001_initial_schema.sql` and `002_seed_data.sql` in this repo.

### Estimated time
30 to 45 minutes.

### Step-by-step

1. **Create a new Supabase project.**
   - Go to https://supabase.com/dashboard.
   - Click **New project**. Pick your org (or create one).
   - Name: `product-video-lab-prod`.
   - Database password: generate a strong one, save it in your password manager.
     You will rarely need it (Supabase uses it for superuser access only).
   - Region: pick the region closest to your users (e.g. `us-east-1` for the US east coast).
   - Pricing plan: **Free**.
   - Click **Create new project**. Wait 2 to 3 minutes for provisioning.

2. **Grab your API credentials.**
   - In the left sidebar: **Project Settings** > **API**.
   - Copy **Project URL** (this is `SUPABASE_URL`). Save it.
   - Copy **`anon` `public`** key (this is `SUPABASE_ANON_KEY`). Save it.
   - Reveal and copy **`service_role` `secret`** key (this is `SUPABASE_SERVICE_ROLE_KEY`).
     Save it somewhere private. This key bypasses RLS; never put it in frontend code or commit it.

3. **Run the initial schema migration.**
   - Left sidebar: **SQL Editor** > **New query**.
   - Open `supabase/migrations/001_initial_schema.sql` locally. Copy the entire file.
   - Paste into the SQL Editor. Click **Run** (bottom right, or Cmd+Enter).
   - You should see `Success. No rows returned.` at the bottom.
   - If it errors, scroll up to read the message; most common issue is running it
     twice (enums already exist). In that case see "Rollback" below.

4. **Run the seed data migration.**
   - New query. Open `supabase/migrations/002_seed_data.sql`, paste, Run.
   - You should see `Success. No rows returned.` again.

5. **Verify schema.**
   - Left sidebar: **Table Editor**. You should see these tables:
     `users`, `projects`, `project_assets`, `product_briefs`, `story_directions`,
     `hooks`, `scripts`, `storyboard_versions`, `storyboard_scenes`,
     `caption_versions`, `render_payloads`, `render_jobs`, `approvals`,
     `activity_logs`.
   - Click `projects`. You should see seed rows.

6. **Verify storage buckets.**
   - Left sidebar: **Storage**.
   - You should see `project-assets` and `render-outputs`. Both marked Private.
   - `voiceover` is NOT here yet; it gets created in Stage 3.

7. **Auth configuration.**
   - Left sidebar: **Authentication** > **Providers**.
   - **Email** provider: make sure it is enabled. Leave all defaults.
   - **Authentication** > **Settings** (or **Sign In / Providers** > **Email**):
     - Find **Confirm email**. Toggle it **OFF** (internal tool, no need to verify email).
   - **Authentication** > **URL Configuration**:
     - Site URL: for now put `http://localhost:5173`. You will update this to your
       Vercel URL at the end of Stage 2.
     - Redirect URLs: add `http://localhost:5173/**` for local dev.

8. **Create your admin user.**
   - Left sidebar: **Authentication** > **Users** > **Add user** > **Create new user**.
   - Email: your work email. Password: strong, save in password manager.
   - Auto-confirm user: check this box.
   - Click **Create user**.
   - Now go to **Table Editor** > `users`. You should see one row with your email.
     (The `handle_new_auth_user` trigger from migration 001 auto-created it.)
   - Edit the row: change `role` from `editor` to `admin`.

9. **Update your local `.env.local`** so you can smoke-test against the prod DB
   before deploying the frontend:
   - Open `.env.local`. Replace `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
     with the values from step 2.
   - Run `npm run dev`. Log in with the admin email/password from step 8.
   - You should see the app with seed projects.
   - **Important**: once you confirm it works, revert `.env.local` to your local
     Supabase values if you were using a local instance. Otherwise you will keep
     writing to prod during development.

### Verification checklist (all must pass before Stage 2)

- [ ] Project appears in Supabase dashboard as `product-video-lab-prod`.
- [ ] Table Editor shows all 14 tables.
- [ ] `projects` has seed rows.
- [ ] Storage shows `project-assets` and `render-outputs`.
- [ ] Auth > Users has your admin user.
- [ ] `users` table row for your admin has `role = 'admin'`.
- [ ] Local dev (`npm run dev`) pointed at prod Supabase loads projects and lets you log in.

### Common errors
- **"type X already exists"**: you ran 001 twice. See Rollback below.
- **"permission denied for schema auth"**: you forgot to run 001 first. Run 001, then 002.
- **Login fails with "Email not confirmed"**: you missed step 7. Turn off email confirmation, or go to Users and manually confirm.

### Rollback (if Stage 1 goes wrong)
- Safest: delete the Supabase project (Settings > General > Delete project). Recreate.
- Alternative (only if you are sure): SQL Editor, run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` then re-run 001 and 002. This loses all data.

---

## Stage 2: Frontend deployment to Vercel

### Prerequisites
- Stage 1 complete.
- GitHub account.
- Vercel account linked to GitHub.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY` from earlier.

### Estimated time
30 minutes.

### Step-by-step

1. **Decide on the OpenAI key strategy.** See "Security risk to flag up front"
   above. The plan default is Option 3 (per-user keys via Settings). If Option 3:
   leave `VITE_OPENAI_API_KEY` unset in Vercel and require each user to paste
   their own key after logging in. If Option 2: set `VITE_OPENAI_API_KEY` and plan
   to enable Vercel Password Protection. If Option 1: stop here and schedule the
   Edge Function work before deploying.

2. **Create `.env.example`** in the repo root with the following (no secrets):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   # Optional. If unset, each user pastes their own key in the Settings page.
   VITE_OPENAI_API_KEY=
   ```

3. **Create `README.md`** in the repo root with a short blurb:
   product name, quick start (`npm install`, `cp .env.example .env.local`,
   `npm run dev`), and a link to `DEPLOYMENT_PLAN.md`.

4. **Verify `.gitignore` ignores `.env.local`.** Already does via `*.local`.

5. **Create a new private GitHub repo** named `product-video-lab`:
   - Go to https://github.com/new.
   - Owner: your username. Name: `product-video-lab`. Visibility: **Private**.
   - Do NOT initialize with README, .gitignore, or license (we have our own).
   - Click **Create repository**.

6. **Push the existing local repo.**
   ```
   cd /Users/matthewanderson/VideoPipeline
   git remote add origin https://github.com/YOUR_USERNAME/product-video-lab.git
   git branch -M main
   git add .env.example README.md
   git commit -m "docs: add env example and readme for deployment"
   git push -u origin main
   ```
   Refresh the GitHub page. You should see all files.

7. **Connect to Vercel.**
   - Go to https://vercel.com/dashboard.
   - Click **Add New** > **Project**.
   - Under **Import Git Repository**, find `product-video-lab` and click **Import**.
   - If you do not see it: click **Adjust GitHub App Permissions**, grant Vercel
     access to that repo, come back.

8. **Configure the project.**
   - Framework Preset: should auto-detect **Vite**. If not, pick it manually.
   - Root Directory: `./` (the repo root).
   - Build Command: leave as default (`npm run build`).
   - Output Directory: leave as default (`dist`).
   - Install Command: leave as default.

9. **Add environment variables.** Click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase URL. Apply to Production, Preview, Development.
   - `VITE_SUPABASE_ANON_KEY` = your anon key. Apply to all environments.
   - `VITE_OPENAI_API_KEY` = leave blank if using Option 3, else set it. Apply as needed.

10. **Click Deploy.** Watch the build logs. Build should finish in 1 to 3 minutes.
    A green "Congratulations" screen means success.

11. **Note your production URL.** It will look like
    `https://product-video-lab.vercel.app` or similar. Save it.

12. **Update Supabase Auth URLs.**
    - Back in Supabase: **Authentication** > **URL Configuration**.
    - Site URL: change to your Vercel URL (e.g. `https://product-video-lab.vercel.app`).
    - Redirect URLs: add both `https://product-video-lab.vercel.app/**` and
      `http://localhost:5173/**`.
    - Click **Save**.

13. **Smoke test.** Open your Vercel URL. Log in with your admin user. You should
    see projects and be able to open them.

14. **Automatic deploys.** Already enabled by default. Every push to `main`
    triggers a new prod deploy. Every push to a branch creates a preview deploy.

### Verification checklist

- [ ] GitHub repo exists and contains all code.
- [ ] Vercel shows `Ready` status with a green checkmark.
- [ ] You can open the Vercel URL and see the login page.
- [ ] You can log in and see your projects.
- [ ] Creating a new project in the UI succeeds (writes to prod Supabase).
- [ ] Supabase `projects` table shows the new row.

### Common errors
- **Build fails with "Cannot find module"**: usually a case-sensitive import on
  Vercel's Linux runtime that worked on macOS. Read the build log, find the import,
  fix the casing to match the actual filename, commit, push.
- **Login works but no projects load**: check Vercel env vars are set for the
  Production environment, not just Preview. Redeploy after changing env vars.
- **CORS error in console**: the Supabase Site URL is wrong. Go fix step 12.

### Rollback
- Vercel: **Deployments** tab > find the last good deploy > **...** > **Promote to Production**.
- Or delete the project from Vercel (Settings > General > Delete). The Supabase DB is unaffected.

---

## Stage 3: ElevenLabs voiceover integration

### Prerequisites
- Stage 2 complete and live.
- ElevenLabs account and API key.
- Node.js and npm installed locally (you already have them).

### Estimated time
1.5 to 2 hours (includes new code + migration + Edge Function).

### Overview

Three things happen in this stage:
1. Schema migration adds `voice_id` and `audio_url` to `scripts`, plus the `voiceover` storage bucket.
2. Frontend: voice selector in Settings, "Generate Voiceover" button in `ScriptEditor`, audio player.
3. Backend: a Supabase Edge Function that calls ElevenLabs, uploads the audio, updates the script row.

### Step 3A: Database migration

1. Create `supabase/migrations/003_voiceover.sql` with:
   ```sql
   -- 003_voiceover.sql
   ALTER TABLE scripts
     ADD COLUMN voice_id text,
     ADD COLUMN audio_url text;

   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'voiceover',
     'voiceover',
     false,
     52428800, -- 50 MB
     ARRAY['audio/mpeg','audio/mp3','audio/wav']
   ) ON CONFLICT (id) DO NOTHING;

   CREATE POLICY "authenticated_read_voiceover"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'voiceover' AND auth.uid() IS NOT NULL);

   CREATE POLICY "authenticated_write_voiceover"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'voiceover' AND auth.uid() IS NOT NULL);

   CREATE POLICY "authenticated_delete_voiceover"
     ON storage.objects FOR DELETE
     USING (bucket_id = 'voiceover' AND auth.uid() IS NOT NULL);
   ```

2. Run it in Supabase SQL Editor (same way as Stage 1). Verify:
   - `scripts` table now has `voice_id` and `audio_url` columns.
   - Storage shows a new `voiceover` bucket.

### Step 3B: Frontend changes

Files to change (paths relative to repo root):

- `src/types/db.ts`: extend `DbScript` to add `voice_id: string | null` and `audio_url: string | null`.
- `src/services/scripts.ts`: ensure update helpers pass through the new fields.
- `src/pages/Settings.tsx` (or wherever Settings UI lives, via `useSettings`):
  add a **Voice** dropdown with the 7 default voices. Store selection under the
  existing settings key (`vpl_settings`), field name `elevenLabsVoiceId`.
  Default voices:
  - Rachel `21m00Tcm4TlvDq8ikWAM`
  - Adam `pNInz6obpgDQGcFmaJgB`
  - Antoni `ErXwobaYiN019PkySvjV`
  - Bella `EXAVITQu4vr4xnSDxMaL`
  - Josh `TxGEqnHWrfWFTfGW9XjX`
  - Arnold `VR6AewLTigWG4xSOukaG`
  - Sam `yoZ06aMxZJJ28mfd3POQ`
- `src/services/voiceover.ts` (new):
  ```ts
  import { supabase } from '@/lib/supabase'
  export async function generateVoiceover(scriptId: string, text: string, voiceId: string) {
    const { data, error } = await supabase.functions.invoke('generate-voiceover', {
      body: { script_id: scriptId, text, voice_id: voiceId },
    })
    if (error) throw error
    return data as { audio_url: string }
  }
  ```
- `src/components/generation/ScriptEditor.tsx`: add a **Generate Voiceover**
  button next to the existing **Generate Script** button, disabled when
  `voiceover_script` is empty. On click, call `generateVoiceover(script.id,
  script.voiceover_script, settings.elevenLabsVoiceId)`. After success: refetch
  the script, show a `<audio src={audio_url} controls />` player under the
  voiceover text area.

### Step 3C: Supabase Edge Function

1. **Install the Supabase CLI.**
   - Mac: `brew install supabase/tap/supabase`
   - Windows: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git; scoop install supabase`
   - Verify: `supabase --version`

2. **Log in and link the project.**
   - `supabase login` (opens browser, click accept).
   - `cd /Users/matthewanderson/VideoPipeline`
   - `supabase link --project-ref YOUR_PROJECT_REF` (find ref in Supabase > Project Settings > General > Reference ID).

3. **Create the function.**
   - `supabase functions new generate-voiceover`
   - This creates `supabase/functions/generate-voiceover/index.ts`.

4. **Function source** (replace the generated file with this):
   ```ts
   import "jsr:@supabase/functions-js/edge-runtime.d.ts"
   import { createClient } from "jsr:@supabase/supabase-js@2"

   const ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech"

   Deno.serve(async (req) => {
     if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })

     const authHeader = req.headers.get("Authorization") ?? ""
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!
     const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     const elevenKey  = Deno.env.get("ELEVENLABS_API_KEY")!

     const admin = createClient(supabaseUrl, serviceKey)
     const caller = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
       global: { headers: { Authorization: authHeader } },
     })

     const { data: user } = await caller.auth.getUser()
     if (!user?.user) return new Response("Unauthorized", { status: 401 })

     const { script_id, text, voice_id } = await req.json()
     if (!script_id || !text || !voice_id) return new Response("Missing fields", { status: 400 })

     const r = await fetch(`${ELEVEN_URL}/${voice_id}`, {
       method: "POST",
       headers: {
         "xi-api-key": elevenKey,
         "Content-Type": "application/json",
         "Accept": "audio/mpeg",
       },
       body: JSON.stringify({
         text,
         model_id: "eleven_multilingual_v2",
         voice_settings: { stability: 0.5, similarity_boost: 0.75 },
       }),
     })
     if (!r.ok) {
       const err = await r.text()
       return new Response(`ElevenLabs error: ${err}`, { status: 502 })
     }
     const audio = new Uint8Array(await r.arrayBuffer())

     const path = `${script_id}/${Date.now()}.mp3`
     const { error: upErr } = await admin.storage
       .from("voiceover")
       .upload(path, audio, { contentType: "audio/mpeg", upsert: true })
     if (upErr) return new Response(`Upload failed: ${upErr.message}`, { status: 500 })

     const { data: signed } = await admin.storage.from("voiceover").createSignedUrl(path, 60 * 60 * 24 * 365)
     const audio_url = signed?.signedUrl ?? ""

     const { error: updErr } = await admin
       .from("scripts")
       .update({ voice_id, audio_url })
       .eq("id", script_id)
     if (updErr) return new Response(`DB update failed: ${updErr.message}`, { status: 500 })

     return Response.json({ audio_url })
   })
   ```

5. **Set secrets.**
   - `supabase secrets set ELEVENLABS_API_KEY=your_eleven_key`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` are
     auto-provided by the runtime; no need to set them manually.

6. **Deploy.**
   - `supabase functions deploy generate-voiceover --no-verify-jwt` (we verify auth manually inside the function).
   - You should see `Deployed Function generate-voiceover on project YOUR_REF`.

### Verification checklist

- [ ] Migration 003 applied. `scripts` has `voice_id` and `audio_url`. `voiceover` bucket exists.
- [ ] Settings page shows the voice dropdown, selection persists.
- [ ] `supabase functions list` shows `generate-voiceover` as ACTIVE.
- [ ] In the app: open a project with a script that has voiceover text. Click **Generate Voiceover**. Wait 5 to 20 seconds.
- [ ] Toast shows success. Audio player appears with a play button. Audio plays.
- [ ] Refresh the page; audio still there (persisted).
- [ ] `scripts` row in Supabase shows `voice_id` and a non-null `audio_url`.

### Common errors
- **401 Unauthorized**: the function could not verify the user. Check the client
  is sending `Authorization: Bearer <access_token>` (Supabase JS does this by
  default via `supabase.functions.invoke`).
- **502 ElevenLabs error**: the API key is wrong or the voice ID is invalid. Check `supabase secrets list` and the voice IDs.
- **Audio 404 on play**: the signed URL expired (we set 1 year, so this should not happen quickly) or the bucket policy is wrong. Re-run the storage policies from 003.

### Rollback
- Migration: `ALTER TABLE scripts DROP COLUMN voice_id, DROP COLUMN audio_url; DELETE FROM storage.buckets WHERE id='voiceover';` (only if you are sure).
- Function: `supabase functions delete generate-voiceover`.
- Frontend: `git revert` the commits that added the Generate Voiceover button, push.

---

## Stage 4: Remotion render worker (separate repo)

### Prerequisites
- Stage 1 complete.
- Node.js 20+ locally.
- Railway account.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Estimated time
4 to 6 hours (this is the biggest stage).

### Architecture

The render worker is a standalone Node.js process that:
1. Polls `render_jobs` every N seconds for rows with `status = 'queued'`.
2. Claims a job by atomically setting status to `processing`.
3. Fetches the `render_payloads.payload` JSON.
4. For each scene, picks a Remotion composition based on `scene_type`.
5. Runs Remotion renderMedia, producing an MP4.
6. Generates a thumbnail (first frame).
7. Uploads both to `render-outputs` bucket.
8. Updates `render_jobs` to `completed` with `output_url` and `thumbnail_url`.
9. On failure: sets `status='failed'` with `error_message`.
10. Handles SIGTERM for graceful shutdown.

FFmpeg work (Stage 5) plugs into step 4 as a preprocessing pass on video assets.

### Step 4A: Create the repo

1. **Create the local directory** (sibling of the main repo):
   ```
   cd /Users/matthewanderson
   mkdir product-video-lab-renderer
   cd product-video-lab-renderer
   npm init -y
   git init
   ```

2. **Install dependencies.**
   ```
   npm install @remotion/renderer @remotion/bundler @remotion/cli remotion @supabase/supabase-js dotenv
   npm install -D typescript @types/node tsx
   npx tsc --init
   ```
   In `tsconfig.json`: set `"module": "ES2022"`, `"moduleResolution": "Bundler"`, `"target": "ES2022"`, `"outDir": "./dist"`, `"rootDir": "./src"`, `"esModuleInterop": true`.

3. **File structure:**
   ```
   product-video-lab-renderer/
     src/
       index.ts                 <- worker entry + polling loop
       supabase.ts              <- supabase-js client (service role)
       render.ts                <- bundle + renderMedia
       thumbnail.ts             <- extract first frame
       compositions/
         Root.tsx               <- registerRoot, registerComposition
         ScreenshotPan.tsx
         ScreenshotZoom.tsx
         TextOverlay.tsx
         VideoClip.tsx
         SplitScreen.tsx
         LogoReveal.tsx
         CTACard.tsx
         TransitionCard.tsx
         VideoProject.tsx       <- top-level comp: renders all scenes in sequence
         CaptionOverlay.tsx     <- burns captions over any composition
     .env.example
     .gitignore
     package.json
     tsconfig.json
     remotion.config.ts
     README.md
   ```

### Step 4B: Worker loop (src/index.ts)

```ts
import 'dotenv/config'
import { supabase } from './supabase.js'
import { renderProject } from './render.js'

const POLL_MS = Number(process.env.RENDER_POLL_INTERVAL_MS ?? 5000)
let shuttingDown = false

process.on('SIGTERM', () => { shuttingDown = true })
process.on('SIGINT',  () => { shuttingDown = true })

async function claimJob() {
  const { data: jobs } = await supabase
    .from('render_jobs')
    .select('id')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
  if (!jobs?.length) return null
  const { data, error } = await supabase
    .from('render_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobs[0].id)
    .eq('status', 'queued')
    .select()
    .single()
  if (error || !data) return null
  return data
}

async function processJob(jobId: string) {
  try {
    const { data: job }     = await supabase.from('render_jobs').select('*').eq('id', jobId).single()
    const { data: payload } = await supabase.from('render_payloads').select('*').eq('id', job.render_payload_id).single()
    const { output_url, thumbnail_url } = await renderProject(jobId, payload.payload, payload.aspect_ratio)
    await supabase.from('render_jobs').update({
      status: 'completed', output_url, thumbnail_url, progress: 100,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId)
  } catch (e: any) {
    await supabase.from('render_jobs').update({
      status: 'failed', error_message: String(e?.message ?? e),
      completed_at: new Date().toISOString(),
    }).eq('id', jobId)
  }
}

async function main() {
  console.log(`[renderer] polling every ${POLL_MS}ms`)
  while (!shuttingDown) {
    const job = await claimJob()
    if (job) { await processJob(job.id) }
    else     { await new Promise(r => setTimeout(r, POLL_MS)) }
  }
  console.log('[renderer] shutting down')
}
main().catch(e => { console.error(e); process.exit(1) })
```

### Step 4C: Compositions

Each composition is a React component that takes scene data as props. `Root.tsx`
imports and registers all of them. `VideoProject.tsx` is the top-level
composition: it reads `scenes: Scene[]`, then uses Remotion `<Sequence>` to stack
each scene, picking the sub-composition by `scene_type`. `CaptionOverlay.tsx` sits
on top of `VideoProject.tsx` and uses the `caption_versions.segments` data to
render burned-in captions with `<AbsoluteFill>` + timed text.

Sketch of `Root.tsx`:
```tsx
import { Composition, registerRoot } from 'remotion'
import { VideoProject } from './VideoProject'

export const RemotionRoot = () => (
  <>
    <Composition
      id="VideoProject"
      component={VideoProject}
      durationInFrames={1}   // overridden at render time
      fps={30}
      width={1080}
      height={1920}          // 9:16 default; overridden per payload
      defaultProps={{ scenes: [], captions: [], voiceoverUrl: null }}
    />
  </>
)
registerRoot(RemotionRoot)
```

Aspect ratios: compute width/height from the payload's `aspect_ratio` before
calling `renderMedia`:
- `9:16` -> 1080 x 1920
- `1:1`  -> 1080 x 1080
- `16:9` -> 1920 x 1080
- `4:5`  -> 1080 x 1350

### Step 4D: Render function (src/render.ts)

```ts
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import path from 'path'
import { tmpdir } from 'os'
import { readFile } from 'fs/promises'
import { supabase } from './supabase.js'
import { makeThumbnail } from './thumbnail.js'

function dimsFor(ar: string) {
  switch (ar) {
    case '1:1':  return { width: 1080, height: 1080 }
    case '16:9': return { width: 1920, height: 1080 }
    case '4:5':  return { width: 1080, height: 1350 }
    default:     return { width: 1080, height: 1920 }
  }
}

export async function renderProject(jobId: string, payload: any, aspectRatio: string) {
  const bundled = await bundle({ entryPoint: path.resolve('src/compositions/Root.tsx') })
  const totalDuration = (payload.scenes as any[]).reduce((s, sc) => s + Number(sc.duration_seconds ?? 3), 0)
  const fps = 30
  const { width, height } = dimsFor(aspectRatio)
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'VideoProject',
    inputProps: payload,
  })

  const outPath = path.join(tmpdir(), `${jobId}.mp4`)
  await renderMedia({
    composition: { ...composition, durationInFrames: Math.ceil(totalDuration * fps), width, height, fps },
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outPath,
    inputProps: payload,
    onProgress: async ({ progress }) => {
      await supabase.from('render_jobs').update({ progress: Math.round(progress * 100) }).eq('id', jobId)
    },
  })

  const thumb = await makeThumbnail(outPath)
  const videoKey = `${jobId}/output.mp4`
  const thumbKey = `${jobId}/thumbnail.png`
  await supabase.storage.from('render-outputs').upload(videoKey, await readFile(outPath), { contentType: 'video/mp4', upsert: true })
  await supabase.storage.from('render-outputs').upload(thumbKey, thumb, { contentType: 'image/png', upsert: true })
  const output_url    = (await supabase.storage.from('render-outputs').createSignedUrl(videoKey, 60 * 60 * 24 * 365)).data!.signedUrl
  const thumbnail_url = (await supabase.storage.from('render-outputs').createSignedUrl(thumbKey, 60 * 60 * 24 * 365)).data!.signedUrl
  return { output_url, thumbnail_url }
}
```

### Step 4E: Thumbnail (src/thumbnail.ts)

Use `@remotion/renderer`'s `extractFrame` or spawn `ffmpeg` (will be installed in
Stage 5). For Stage 4, we can use Remotion's built-in `renderStill` on the first
frame and return a PNG buffer.

### Step 4F: Railway deployment

1. **Create a second GitHub repo** named `product-video-lab-renderer`, private.
2. **Push the renderer repo:**
   ```
   cd /Users/matthewanderson/product-video-lab-renderer
   git add .
   git commit -m "feat: initial render worker"
   git remote add origin https://github.com/YOUR_USERNAME/product-video-lab-renderer.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Railway.**
   - Go to https://railway.app/dashboard.
   - **New Project** > **Deploy from GitHub repo**.
   - Pick `product-video-lab-renderer`. Grant Railway permission if needed.
   - Railway auto-detects Node.js and starts building.

4. **Set the start command.**
   - Project > **Settings** > **Deploy** > **Start Command**: `npx tsx src/index.ts`.
   - Or add a `start` script in `package.json`: `"start": "tsx src/index.ts"` and use `npm start`.

5. **Environment variables.**
   - Project > **Variables** > **New Variable**:
     - `SUPABASE_URL` = your Supabase URL.
     - `SUPABASE_SERVICE_KEY` = your service role key (NOT the anon key).
     - `RENDER_POLL_INTERVAL_MS` = `5000`.

6. **Ensure FFmpeg is available on Railway.** Remotion bundles its own Chromium
   but relies on system FFmpeg for some operations. Create a `nixpacks.toml` at
   repo root:
   ```toml
   [phases.setup]
   aptPkgs = ["ffmpeg"]
   ```

7. **Redeploy.** Railway picks up the change.

8. **Check logs.** Railway > **Deployments** > latest > **View Logs**. You should see `[renderer] polling every 5000ms`.

### Verification checklist

- [ ] Railway deploy is green.
- [ ] Logs show `[renderer] polling every ...`.
- [ ] In the main app: create a render payload, create a render job (status goes queued).
- [ ] Within ~10 seconds, the job row flips to `processing`.
- [ ] Progress percentage increases in the UI over 30 to 120 seconds.
- [ ] Job flips to `completed` with a playable `output_url`.
- [ ] Opening `output_url` plays a valid MP4.
- [ ] Thumbnail appears.

### Common errors
- **`Error: Chromium cannot be launched`**: Railway's base image is missing libs. Add `chromium` via `nixpacks.toml` or use a Docker image with puppeteer deps.
- **`permission denied` on storage upload**: you used the anon key instead of service role.
- **Job stuck at `processing`**: worker crashed mid-render. Check Railway logs. Add a "stuck job" recovery that resets `processing` jobs older than 30 minutes back to `queued`.

### Rollback
- Railway: **Deployments** > pick last good deploy > **Redeploy**. Or pause the service (Settings > Danger > Pause).
- Clear stuck jobs: SQL Editor > `UPDATE render_jobs SET status='queued' WHERE status='processing';`.

---

## Stage 5: FFmpeg preprocessing in the renderer

### Prerequisites
- Stage 4 complete and rendering plain compositions.
- `ffmpeg` available on Railway (step 4F.6 above).

### Estimated time
2 to 3 hours.

### Step-by-step

1. **In the renderer repo:**
   ```
   npm install fluent-ffmpeg ffmpeg-static
   npm install -D @types/fluent-ffmpeg
   ```

2. **Add `src/preprocess.ts`:** a function that takes a scene with a video asset,
   downloads the file, trims and normalizes it, returns the local path of the
   preprocessed file.
   ```ts
   import ffmpegStatic from 'ffmpeg-static'
   import Ffmpeg from 'fluent-ffmpeg'
   import { tmpdir } from 'os'
   import { join } from 'path'
   import { writeFile, mkdtemp, rm } from 'fs/promises'
   import { supabase } from './supabase.js'

   Ffmpeg.setFfmpegPath(ffmpegStatic as string)

   export async function preprocessClip(asset: { file_path: string }, durationSeconds: number) {
     const dir = await mkdtemp(join(tmpdir(), 'vpl-'))
     const { data } = await supabase.storage.from('project-assets').download(asset.file_path)
     const raw = join(dir, 'in.mp4')
     const out = join(dir, 'out.mp4')
     await writeFile(raw, Buffer.from(await data!.arrayBuffer()))

     await new Promise<void>((res, rej) => {
       Ffmpeg(raw)
         .setDuration(durationSeconds)
         .size('1920x1080')
         .videoCodec('libx264')
         .outputOptions(['-preset veryfast', '-crf 23', '-pix_fmt yuv420p'])
         .on('end', () => res())
         .on('error', rej)
         .save(out)
     })
     return { path: out, cleanup: () => rm(dir, { recursive: true, force: true }) }
   }
   ```

3. **Hook into `render.ts`:** before `renderMedia`, walk `payload.scenes`, and
   for each scene with `scene_type = 'video_clip'` and an `asset_id` that resolves
   to a video, call `preprocessClip`. Replace the scene's asset reference with a
   local file URL (Remotion can consume `file://` URLs).

4. **Thumbnail generation via ffmpeg:** replace `src/thumbnail.ts` with:
   ```ts
   export function makeThumbnail(videoPath: string): Promise<Buffer> {
     return new Promise((resolve, reject) => {
       const chunks: Buffer[] = []
       Ffmpeg(videoPath)
         .seekInput('0.5')
         .frames(1)
         .format('image2pipe')
         .videoCodec('png')
         .on('error', reject)
         .on('end', () => resolve(Buffer.concat(chunks)))
         .pipe()
         .on('data', (c: Buffer) => chunks.push(c))
     })
   }
   ```

5. **Caption burn-in (optional):** if you prefer server-side captions over
   Remotion `<CaptionOverlay>`, after rendering run ffmpeg with the `subtitles`
   filter pointing at a generated .srt file produced from `caption_versions.segments`.

6. **Cleanup:** after rendering, `await cleanup()` on each preprocessed clip, and
   delete the output MP4 after upload.

### Verification checklist

- [ ] Upload a 10-second demo video to a project.
- [ ] Create a render payload with one `video_clip` scene, duration 4 seconds.
- [ ] Create and wait for the render job.
- [ ] The completed output is 4 seconds long and 1920x1080 (or the target aspect).
- [ ] Thumbnail is a frame from the video, not black.
- [ ] Railway disk usage returns to near zero after each job (tmp files cleaned up).

### Common errors
- **ffmpeg-static path not found on Railway**: `ffmpeg-static` ships a Linux
  binary, should work, but verify with a debug log of `ffmpegStatic`.
- **Out of disk space**: raise Railway plan or ensure cleanup runs in `finally`.
- **Audio out of sync after trim**: add `-async 1` to ffmpeg output options.

### Rollback
- Remove the preprocess import from `render.ts`, commit, push. Renderer falls back to Remotion-only rendering.

---

## Final notes

- **Order matters.** Stage 1 must finish before 2. Stage 2 can be live before
  stages 3, 4, 5 (those are additive features). Stage 5 depends on Stage 4.
- **After each stage**, verify the checklist before moving on.
- **Secrets hygiene**: never paste the service role key or ElevenLabs key into
  the frontend repo, a browser, or a chat window. Only Supabase (as a secret),
  Railway (as an env var), and a password manager.
- **Monitoring**: after Stage 4 is live, add a simple daily check: query
  `SELECT status, count(*) FROM render_jobs GROUP BY status;` in Supabase SQL
  editor. Anything stuck in `processing` for over 30 minutes is a bug.

## Critical files referenced

- `supabase/migrations/001_initial_schema.sql` (run in Stage 1)
- `supabase/migrations/002_seed_data.sql` (run in Stage 1)
- `supabase/migrations/003_voiceover.sql` (NEW, Stage 3)
- `src/lib/supabase.ts` (no changes; already reads env vars correctly)
- `src/lib/openai.ts` (possibly refactor to proxy through Edge Function, see security note)
- `src/types/db.ts` (Stage 3 adds `voice_id`, `audio_url` to `DbScript`)
- `src/components/generation/ScriptEditor.tsx` (Stage 3 adds Generate Voiceover button + audio player)
- `src/services/voiceover.ts` (NEW, Stage 3)
- `src/pages/Settings.tsx` (Stage 3 adds voice dropdown)
- `supabase/functions/generate-voiceover/index.ts` (NEW, Stage 3)
- `.env.example` (NEW, Stage 2)
- `README.md` (NEW, Stage 2)
- `/Users/matthewanderson/product-video-lab-renderer/` (NEW, Stage 4 and 5)
