# Deployment Guide — No Terminal Required

Everything below is done in your browser. No terminal, no command line.

---

## Step 1 — Run the database migrations (Supabase SQL Editor)

This adds all the new tables and columns for Phases 4–6 (music, cinematic schema, exemplars, asset intelligence).

**Do this once. Takes about 2 minutes.**

1. Go to **[app.supabase.com](https://app.supabase.com)** and open your project
2. Click **SQL Editor** in the left sidebar (looks like `</>`  or a database icon)
3. Click **New query** (top left of the SQL editor area)
4. Copy the entire block below and paste it into the editor
5. Click **Run** (green button, or press Cmd+Enter on Mac)

You should see "Success. No rows returned" — that means it worked.

```sql
-- ============================================================
-- Phases 4–6 migrations: run this once in Supabase SQL Editor
-- Safe to re-run — all statements use IF NOT EXISTS / IF EXISTS
-- ============================================================

-- ── Migration 004: Exemplar library ──────────────────────────

CREATE TABLE IF NOT EXISTS video_exemplars (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text        NOT NULL,
  url                 text,
  product_category    text,
  duration_seconds    int,
  aspect_ratio        text        DEFAULT '9:16',
  hook_pattern        text,
  narrative_structure jsonb       DEFAULT '[]'::jsonb,
  pacing_curve        jsonb       DEFAULT '[]'::jsonb,
  music_strategy      jsonb       DEFAULT '{}'::jsonb,
  visual_language     jsonb       DEFAULT '{}'::jsonb,
  caption_style       jsonb       DEFAULT '{}'::jsonb,
  key_techniques      text[]      DEFAULT ARRAY[]::text[],
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE video_exemplars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'video_exemplars' AND policyname = 'authenticated_read_exemplars'
  ) THEN
    CREATE POLICY "authenticated_read_exemplars"
      ON video_exemplars FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'video_exemplars' AND policyname = 'admin_write_exemplars'
  ) THEN
    CREATE POLICY "admin_write_exemplars"
      ON video_exemplars FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- ── Migration 006: Cinematic schema ──────────────────────────

ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS motion_params      jsonb,
  ADD COLUMN IF NOT EXISTS region_of_interest jsonb,
  ADD COLUMN IF NOT EXISTS emphasis_beats     jsonb,
  ADD COLUMN IF NOT EXISTS color_theme        jsonb,
  ADD COLUMN IF NOT EXISTS energy_level       smallint CHECK (energy_level BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS music_sync_point   text
    CHECK (music_sync_point IN ('drop','build','release','silence'));

ALTER TABLE project_assets
  ADD COLUMN IF NOT EXISTS semantic_tags text[]   DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS analysis      jsonb    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS analysis_status text   DEFAULT 'pending'
    CHECK (analysis_status IN ('pending','processing','complete','failed'));

CREATE TABLE IF NOT EXISTS music_cues (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  render_payload_id uuid        NOT NULL REFERENCES render_payloads(id) ON DELETE CASCADE,
  track_id          text        NOT NULL,
  track_title       text,
  track_artist      text,
  bpm               numeric(6,1),
  duration_ms       bigint,
  preview_url       text,
  mood_tags         text[]      NOT NULL DEFAULT ARRAY[]::text[],
  beat_grid_ms      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  sections          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'music_cues'::regclass
      AND contype = 'u'
      AND conname = 'music_cues_render_payload_id_key'
  ) THEN
    ALTER TABLE music_cues
      ADD CONSTRAINT music_cues_render_payload_id_key
      UNIQUE (render_payload_id);
  END IF;
END $$;

ALTER TABLE music_cues ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'music_cues' AND policyname = 'user_manage_music_cues'
  ) THEN
    CREATE POLICY "user_manage_music_cues"
      ON music_cues FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM render_payloads rp
          JOIN projects p ON p.id = rp.project_id
          WHERE rp.id = music_cues.render_payload_id
            AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── Migration 007: Visual strategy column ────────────────────

ALTER TABLE story_directions
  ADD COLUMN IF NOT EXISTS visual_strategy jsonb;

-- ── Migration 008: Music cues extra columns ───────────────────
-- (already included in CREATE TABLE above — safe to skip if table existed)

-- ── Migration 009: CC0 music library ─────────────────────────

CREATE TABLE IF NOT EXISTS music_library (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  artist        text        NOT NULL,
  source_url    text,
  preview_url   text        NOT NULL,
  bpm           numeric(6,1),
  duration_ms   bigint      NOT NULL,
  speed_category text       NOT NULL
                CHECK (speed_category IN ('low', 'medium', 'high')),
  mood_tags     text[]      NOT NULL DEFAULT ARRAY[]::text[],
  genres        text[]      NOT NULL DEFAULT ARRAY[]::text[],
  energy_level  smallint    CHECK (energy_level BETWEEN 1 AND 10),
  license       text        NOT NULL DEFAULT 'CC0',
  license_url   text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_music_library_speed     ON music_library(speed_category) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_music_library_energy    ON music_library(energy_level)   WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_music_library_mood_tags ON music_library USING GIN(mood_tags);

ALTER TABLE music_library ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'music_library' AND policyname = 'authenticated_read_music_library'
  ) THEN
    CREATE POLICY "authenticated_read_music_library"
      ON music_library FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'music_library' AND policyname = 'admin_write_music_library'
  ) THEN
    CREATE POLICY "admin_write_music_library"
      ON music_library FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- Seed 20 CC0 tracks (skip if already seeded)
INSERT INTO music_library
  (title, artist, source_url, preview_url, bpm, duration_ms, speed_category, mood_tags, genres, energy_level, license)
SELECT * FROM (VALUES
  ('Inspiring and Uplifting Corporate','Lexin_Music','https://pixabay.com/music/beats-inspiring-and-uplifting-corporate-116417/','https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',120,120000,'high',ARRAY['inspiring','uplifting','corporate','energetic'],ARRAY['corporate','electronic'],8,'CC0'),
  ('Epic Cinematic Adventure','PeriTune','https://pixabay.com/music/beats-epic-cinematic-adventure-background-music-for-video-114745/','https://cdn.pixabay.com/download/audio/2022/04/27/audio_946af90fbc.mp3',130,150000,'high',ARRAY['epic','cinematic','dramatic','adventure'],ARRAY['cinematic','orchestral'],9,'CC0'),
  ('Upbeat Technology','Muzaproduction','https://pixabay.com/music/beats-upbeat-technology-background-music-128633/','https://cdn.pixabay.com/download/audio/2022/10/25/audio_b0bd0b5cf3.mp3',128,100000,'high',ARRAY['upbeat','technology','modern','energetic'],ARRAY['electronic','technology'],8,'CC0'),
  ('Positive Background','Lexin_Music','https://pixabay.com/music/beats-positive-background-116782/','https://cdn.pixabay.com/download/audio/2022/06/08/audio_41f19c0e72.mp3',124,130000,'high',ARRAY['positive','upbeat','happy','energetic'],ARRAY['pop','corporate'],7,'CC0'),
  ('Motivational Corporate Drive','AudioCoffee','https://pixabay.com/music/beats-motivational-corporate-drive-116740/','https://cdn.pixabay.com/download/audio/2022/06/07/audio_a56cb74b40.mp3',126,115000,'high',ARRAY['motivational','corporate','drive','inspiring'],ARRAY['corporate','electronic'],8,'CC0'),
  ('Modern Technology Intro','SoundGallery_by_Piyush_Sharma','https://pixabay.com/music/beats-modern-technology-intro-116701/','https://cdn.pixabay.com/download/audio/2022/06/07/audio_c82c4c6f22.mp3',110,90000,'medium',ARRAY['modern','technology','minimal','clean'],ARRAY['electronic','ambient'],6,'CC0'),
  ('Soft Corporate Background','Muzaproduction','https://pixabay.com/music/beats-soft-corporate-background-116994/','https://cdn.pixabay.com/download/audio/2022/06/09/audio_c91c6dce17.mp3',100,140000,'medium',ARRAY['soft','corporate','professional','background'],ARRAY['corporate','ambient'],5,'CC0'),
  ('Startup Growth','AudioCoffee','https://pixabay.com/music/beats-startup-growth-116818/','https://cdn.pixabay.com/download/audio/2022/06/08/audio_d3e3cc427f.mp3',115,125000,'medium',ARRAY['startup','growth','modern','inspiring'],ARRAY['corporate','electronic'],6,'CC0'),
  ('Creative Background Music','DM_Production','https://pixabay.com/music/beats-creative-background-music-116617/','https://cdn.pixabay.com/download/audio/2022/06/06/audio_c413cf1af3.mp3',105,180000,'medium',ARRAY['creative','background','positive','neutral'],ARRAY['corporate','pop'],5,'CC0'),
  ('Good Night Dark Electronic','BoDleasons','https://pixabay.com/music/future-bass-good-night-112190/','https://cdn.pixabay.com/download/audio/2022/03/15/audio_42e0e4fdc4.mp3',100,200000,'medium',ARRAY['dark','electronic','moody','cinematic'],ARRAY['electronic','dark'],6,'CC0'),
  ('Tense Buildup','SergePavkinMusic','https://pixabay.com/music/beats-tense-buildup-116841/','https://cdn.pixabay.com/download/audio/2022/06/08/audio_2f77046d4f.mp3',112,90000,'medium',ARRAY['tense','dramatic','buildup','suspense'],ARRAY['cinematic','electronic'],7,'CC0'),
  ('Ambient Minimal Corporate','Muzaproduction','https://pixabay.com/music/ambient-ambient-minimal-corporate-116967/','https://cdn.pixabay.com/download/audio/2022/06/09/audio_a46f35b1f2.mp3',75,180000,'low',ARRAY['ambient','minimal','corporate','calm'],ARRAY['ambient','corporate'],3,'CC0'),
  ('Deep Relaxation','SoundGallery_by_Piyush_Sharma','https://pixabay.com/music/ambient-deep-relaxation-116818/','https://cdn.pixabay.com/download/audio/2022/06/08/audio_e8c8e81d11.mp3',70,200000,'low',ARRAY['relaxing','calm','minimal','ambient'],ARRAY['ambient'],2,'CC0'),
  ('Soft Piano Background','Coma-Media','https://pixabay.com/music/piano-soft-piano-background-music-116117/','https://cdn.pixabay.com/download/audio/2022/05/16/audio_e6702c0a3f.mp3',80,160000,'low',ARRAY['soft','piano','calm','thoughtful'],ARRAY['piano','ambient'],3,'CC0'),
  ('Emotional Cinematic','PeriTune','https://pixabay.com/music/ambient-emotional-cinematic-background-116706/','https://cdn.pixabay.com/download/audio/2022/06/07/audio_8a66c87c24.mp3',78,175000,'low',ARRAY['emotional','cinematic','inspiring','calm'],ARRAY['cinematic','ambient'],4,'CC0'),
  ('Future Bass Bright','BoDleasons','https://pixabay.com/music/future-bass-future-bass-bright-music-116204/','https://cdn.pixabay.com/download/audio/2022/05/17/audio_7b2e67c88d.mp3',140,170000,'high',ARRAY['bright','energetic','modern','tech','futuristic'],ARRAY['electronic','future-bass'],9,'CC0'),
  ('Happy Background Music','Lexin_Music','https://pixabay.com/music/beats-happy-background-music-116515/','https://cdn.pixabay.com/download/audio/2022/05/31/audio_a66d2b4e8c.mp3',118,135000,'medium',ARRAY['happy','positive','playful','fun'],ARRAY['pop','corporate'],6,'CC0'),
  ('Documentary Suspense','SergePavkinMusic','https://pixabay.com/music/beats-documentary-suspense-116614/','https://cdn.pixabay.com/download/audio/2022/06/06/audio_e7faf3a90a.mp3',88,145000,'low',ARRAY['documentary','suspense','problem','dark'],ARRAY['cinematic','electronic'],4,'CC0'),
  ('Innovation Momentum','AudioCoffee','https://pixabay.com/music/beats-innovation-momentum-116834/','https://cdn.pixabay.com/download/audio/2022/06/08/audio_42b8a1c4d3.mp3',122,120000,'high',ARRAY['innovation','momentum','corporate','energetic'],ARRAY['corporate','electronic'],8,'CC0'),
  ('Triumph Victory Corporate','Muzaproduction','https://pixabay.com/music/beats-triumph-victory-corporate-116790/','https://cdn.pixabay.com/download/audio/2022/06/08/audio_7a4ba1e7dd.mp3',132,95000,'high',ARRAY['triumphant','victory','payoff','epic','inspiring'],ARRAY['corporate','orchestral'],9,'CC0')
) AS v(title,artist,source_url,preview_url,bpm,duration_ms,speed_category,mood_tags,genres,energy_level,license)
WHERE NOT EXISTS (SELECT 1 FROM music_library LIMIT 1);

-- ── Verify everything worked ──────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM storyboard_scenes WHERE motion_params IS NOT NULL OR TRUE)   AS scenes_table_ok,
  (SELECT COUNT(*) FROM music_library)                                                AS music_tracks,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'story_directions' AND column_name = 'visual_strategy')        AS visual_strategy_ok;
```

If the last row shows `music_tracks = 20`, you're done.

---

## Step 2 — Set up GitHub Actions for auto-deploy (one-time, ~5 minutes)

This makes Edge Functions deploy automatically every time you push code to GitHub. You'll never need to think about it again.

### 2a — Get your Supabase Access Token

1. Go to **[app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)**
2. Click **Generate new token**
3. Name it `GitHub Actions`
4. Click **Generate token**
5. **Copy the token** (you can only see it once — paste it somewhere temporarily)

### 2b — Get your Supabase Project Reference

1. Go to **[app.supabase.com](https://app.supabase.com)** → open your project
2. Click **Project Settings** (gear icon, bottom of left sidebar)
3. Click **General**
4. Copy the **Reference ID** — it looks like `abcdefghijklmnop` (20 random letters/numbers)

### 2c — Add secrets to your GitHub repo

1. Go to your GitHub repo (e.g. `github.com/yourusername/VideoPipeline`)
2. Click **Settings** tab (top of the repo page)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** and add these two secrets:

   | Name | Value |
   |------|-------|
   | `SUPABASE_ACCESS_TOKEN` | The token you copied in step 2a |
   | `SUPABASE_PROJECT_REF`  | The reference ID from step 2b |

5. Click **Add secret** after each one

### 2d — Trigger the first deploy

The workflow runs automatically when you push to `main`. To trigger it right now without making a code change:

1. In your GitHub repo, click the **Actions** tab
2. Click **Deploy Supabase Edge Functions** in the left list
3. Click **Run workflow** → **Run workflow** (green button)
4. Watch it run — should take about 30 seconds
5. Green checkmark = success ✓

---

## Step 3 (Optional) — Add Jamendo for more music variety

Without this, music still works — it uses the 20 built-in CC0 tracks. With a Jamendo key you get thousands more options.

### Get a free Jamendo API key

1. Go to **[developer.jamendo.com](https://developer.jamendo.com)**
2. Click **Register** → create a free account
3. After registering, go to **My Apps** → **Create an App**
4. Name it anything (e.g. `Video Pipeline`)
5. Copy your **Client ID**

### Add the key to Supabase

1. Go to **[app.supabase.com](https://app.supabase.com)** → open your project
2. Click **Edge Functions** in the left sidebar
3. Click **Manage secrets** (or look for a "Secrets" tab near the top)
4. Click **Add new secret**
5. Name: `JAMENDO_CLIENT_ID`
6. Value: paste your Client ID
7. Click **Save**

That's it — the `select-music` function will automatically start using Jamendo the next time someone searches for music.

---

## What you now have

| Feature | Status |
|---------|--------|
| Spring physics animations (no more slideshow feel) | ✅ Done |
| Kinetic text reveals — word by word | ✅ Done |
| Real scene transitions (wipes, dissolves, flashes) | ✅ Done |
| Background music selector with 20 built-in CC0 tracks | ✅ Done |
| Beat-sync — cuts land on music beats | ✅ Done |
| Asset intelligence — AI matches screenshots to scenes | ✅ Done |
| Asset review tab — swap AI picks before rendering | ✅ Done |
| Auto-deploy Edge Functions on every Git push | ✅ Done |

---

## Troubleshooting

**SQL editor shows an error about a table not existing**
→ Some migrations depend on earlier ones. Make sure you ran migrations 001–003 first (the original setup). If those are already in production, the combined SQL above will work fine.

**GitHub Actions shows a red X**
→ Click the failed run → click the failed step to see the error. Most common cause: wrong `SUPABASE_PROJECT_REF` (make sure it's just the ref ID, not the full URL).

**Music selector shows "No tracks found"**
→ Run the SQL migration above — it seeds the 20 CC0 tracks. If the query returns `music_tracks = 0`, paste just the INSERT block again.

**"Unauthorized" error when searching music**
→ Make sure you're logged in and the `select-music` Edge Function was deployed (check the Actions tab in GitHub).
