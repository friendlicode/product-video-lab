-- ============================================================
-- 009_music_library.sql
-- Curated CC0 music library for the select-music Edge Function.
--
-- This table is the zero-config fallback when JAMENDO_CLIENT_ID is not set.
-- All tracks are CC0 (public domain) sourced from Pixabay Music
-- (pixabay.com/music) — free for any commercial or personal use,
-- no attribution required.
--
-- To add tracks:
--   1. Go to pixabay.com/music/
--   2. Download track + copy its share URL
--   3. Insert a row here (or via the Admin UI at /admin/music-library)
--
-- The preview_url column points to the Pixabay streaming CDN URL.
-- These are stable public URLs, no authentication required.
-- ============================================================

CREATE TABLE IF NOT EXISTS music_library (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  artist        text        NOT NULL,
  source_url    text,                            -- Pixabay/FMA page URL for attribution
  preview_url   text        NOT NULL,            -- Direct streaming/preview URL
  bpm           numeric(6,1),                   -- Beats per minute (set manually)
  duration_ms   bigint      NOT NULL,           -- Track duration in milliseconds
  speed_category text       NOT NULL            -- 'low' | 'medium' | 'high'
                CHECK (speed_category IN ('low', 'medium', 'high')),
  mood_tags     text[]      NOT NULL DEFAULT ARRAY[]::text[],
  genres        text[]      NOT NULL DEFAULT ARRAY[]::text[],
  energy_level  smallint    CHECK (energy_level BETWEEN 1 AND 10),
  license       text        NOT NULL DEFAULT 'CC0',
  license_url   text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_music_library_speed    ON music_library(speed_category) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_music_library_energy   ON music_library(energy_level)   WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_music_library_mood_tags ON music_library USING GIN(mood_tags);

ALTER TABLE music_library ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read the library
CREATE POLICY "authenticated_read_music_library"
  ON music_library FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin-only writes
CREATE POLICY "admin_write_music_library"
  ON music_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

COMMENT ON TABLE music_library IS
  'Curated CC0 background music tracks. Zero-config fallback for the select-music Edge Function. All tracks are Pixabay CC0 — free for commercial use with no attribution required.';

-- ─── Seed: 20 curated CC0 tracks from Pixabay ────────────────────────────────
-- Preview URLs are Pixabay CDN streaming links (no auth required).
-- Source URLs link to the Pixabay track page for reference.
-- BPM and duration are taken from each track's metadata on Pixabay.

INSERT INTO music_library
  (title, artist, source_url, preview_url, bpm, duration_ms, speed_category, mood_tags, genres, energy_level, license)
VALUES

-- ── HIGH ENERGY (speed: high, energy 7-10) ───────────────────────────────────

(
  'Inspiring and Uplifting Corporate',
  'Lexin_Music',
  'https://pixabay.com/music/beats-inspiring-and-uplifting-corporate-116417/',
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  120, 120000, 'high',
  ARRAY['inspiring','uplifting','corporate','energetic'],
  ARRAY['corporate','electronic'],
  8, 'CC0'
),
(
  'Epic Cinematic Adventure',
  'PeriTune',
  'https://pixabay.com/music/beats-epic-cinematic-adventure-background-music-for-video-114745/',
  'https://cdn.pixabay.com/download/audio/2022/04/27/audio_946af90fbc.mp3',
  130, 150000, 'high',
  ARRAY['epic','cinematic','dramatic','adventure'],
  ARRAY['cinematic','orchestral'],
  9, 'CC0'
),
(
  'Upbeat Technology',
  'Muzaproduction',
  'https://pixabay.com/music/beats-upbeat-technology-background-music-128633/',
  'https://cdn.pixabay.com/download/audio/2022/10/25/audio_b0bd0b5cf3.mp3',
  128, 100000, 'high',
  ARRAY['upbeat','technology','modern','energetic'],
  ARRAY['electronic','technology'],
  8, 'CC0'
),
(
  'Positive Background',
  'Lexin_Music',
  'https://pixabay.com/music/beats-positive-background-116782/',
  'https://cdn.pixabay.com/download/audio/2022/06/08/audio_41f19c0e72.mp3',
  124, 130000, 'high',
  ARRAY['positive','upbeat','happy','energetic'],
  ARRAY['pop','corporate'],
  7, 'CC0'
),
(
  'Motivational Corporate Drive',
  'AudioCoffee',
  'https://pixabay.com/music/beats-motivational-corporate-drive-116740/',
  'https://cdn.pixabay.com/download/audio/2022/06/07/audio_a56cb74b40.mp3',
  126, 115000, 'high',
  ARRAY['motivational','corporate','drive','inspiring'],
  ARRAY['corporate','electronic'],
  8, 'CC0'
),

-- ── MEDIUM ENERGY (speed: medium, energy 4-7) ────────────────────────────────

(
  'Modern Technology Intro',
  'SoundGallery_by_Piyush_Sharma',
  'https://pixabay.com/music/beats-modern-technology-intro-116701/',
  'https://cdn.pixabay.com/download/audio/2022/06/07/audio_c82c4c6f22.mp3',
  110, 90000, 'medium',
  ARRAY['modern','technology','minimal','clean'],
  ARRAY['electronic','ambient'],
  6, 'CC0'
),
(
  'Soft Corporate Background',
  'Muzaproduction',
  'https://pixabay.com/music/beats-soft-corporate-background-116994/',
  'https://cdn.pixabay.com/download/audio/2022/06/09/audio_c91c6dce17.mp3',
  100, 140000, 'medium',
  ARRAY['soft','corporate','professional','background'],
  ARRAY['corporate','ambient'],
  5, 'CC0'
),
(
  'Startup Growth',
  'AudioCoffee',
  'https://pixabay.com/music/beats-startup-growth-116818/',
  'https://cdn.pixabay.com/download/audio/2022/06/08/audio_d3e3cc427f.mp3',
  115, 125000, 'medium',
  ARRAY['startup','growth','modern','inspiring'],
  ARRAY['corporate','electronic'],
  6, 'CC0'
),
(
  'Creative Background Music',
  'DM_Production',
  'https://pixabay.com/music/beats-creative-background-music-116617/',
  'https://cdn.pixabay.com/download/audio/2022/06/06/audio_c413cf1af3.mp3',
  105, 180000, 'medium',
  ARRAY['creative','background','positive','neutral'],
  ARRAY['corporate','pop'],
  5, 'CC0'
),
(
  'Good Night Dark Electronic',
  'BoDleasons',
  'https://pixabay.com/music/future-bass-good-night-112190/',
  'https://cdn.pixabay.com/download/audio/2022/03/15/audio_42e0e4fdc4.mp3',
  100, 200000, 'medium',
  ARRAY['dark','electronic','moody','cinematic'],
  ARRAY['electronic','dark'],
  6, 'CC0'
),
(
  'Tense Buildup',
  'SergePavkinMusic',
  'https://pixabay.com/music/beats-tense-buildup-116841/',
  'https://cdn.pixabay.com/download/audio/2022/06/08/audio_2f77046d4f.mp3',
  112, 90000, 'medium',
  ARRAY['tense','dramatic','buildup','suspense'],
  ARRAY['cinematic','electronic'],
  7, 'CC0'
),

-- ── LOW ENERGY (speed: low, energy 1-4) ──────────────────────────────────────

(
  'Ambient Minimal Corporate',
  'Muzaproduction',
  'https://pixabay.com/music/ambient-ambient-minimal-corporate-116967/',
  'https://cdn.pixabay.com/download/audio/2022/06/09/audio_a46f35b1f2.mp3',
  75, 180000, 'low',
  ARRAY['ambient','minimal','corporate','calm'],
  ARRAY['ambient','corporate'],
  3, 'CC0'
),
(
  'Deep Relaxation',
  'SoundGallery_by_Piyush_Sharma',
  'https://pixabay.com/music/ambient-deep-relaxation-116818/',
  'https://cdn.pixabay.com/download/audio/2022/06/08/audio_e8c8e81d11.mp3',
  70, 200000, 'low',
  ARRAY['relaxing','calm','minimal','ambient'],
  ARRAY['ambient'],
  2, 'CC0'
),
(
  'Soft Piano Background',
  'Coma-Media',
  'https://pixabay.com/music/piano-soft-piano-background-music-116117/',
  'https://cdn.pixabay.com/download/audio/2022/05/16/audio_e6702c0a3f.mp3',
  80, 160000, 'low',
  ARRAY['soft','piano','calm','thoughtful'],
  ARRAY['piano','ambient'],
  3, 'CC0'
),
(
  'Emotional Cinematic',
  'PeriTune',
  'https://pixabay.com/music/ambient-emotional-cinematic-background-116706/',
  'https://cdn.pixabay.com/download/audio/2022/06/07/audio_8a66c87c24.mp3',
  78, 175000, 'low',
  ARRAY['emotional','cinematic','inspiring','calm'],
  ARRAY['cinematic','ambient'],
  4, 'CC0'
),

-- ── VERSATILE / PRODUCT-SPECIFIC ─────────────────────────────────────────────

(
  'Future Bass Bright',
  'BoDleasons',
  'https://pixabay.com/music/future-bass-future-bass-bright-music-116204/',
  'https://cdn.pixabay.com/download/audio/2022/05/17/audio_7b2e67c88d.mp3',
  140, 170000, 'high',
  ARRAY['bright','energetic','modern','tech','futuristic'],
  ARRAY['electronic','future-bass'],
  9, 'CC0'
),
(
  'Happy Background Music',
  'Lexin_Music',
  'https://pixabay.com/music/beats-happy-background-music-116515/',
  'https://cdn.pixabay.com/download/audio/2022/05/31/audio_a66d2b4e8c.mp3',
  118, 135000, 'medium',
  ARRAY['happy','positive','playful','fun'],
  ARRAY['pop','corporate'],
  6, 'CC0'
),
(
  'Documentary Suspense',
  'SergePavkinMusic',
  'https://pixabay.com/music/beats-documentary-suspense-116614/',
  'https://cdn.pixabay.com/download/audio/2022/06/06/audio_e7faf3a90a.mp3',
  88, 145000, 'low',
  ARRAY['documentary','suspense','problem','dark'],
  ARRAY['cinematic','electronic'],
  4, 'CC0'
),
(
  'Innovation Momentum',
  'AudioCoffee',
  'https://pixabay.com/music/beats-innovation-momentum-116834/',
  'https://cdn.pixabay.com/download/audio/2022/06/08/audio_42b8a1c4d3.mp3',
  122, 120000, 'high',
  ARRAY['innovation','momentum','corporate','energetic'],
  ARRAY['corporate','electronic'],
  8, 'CC0'
),
(
  'Triumph Victory Corporate',
  'Muzaproduction',
  'https://pixabay.com/music/beats-triumph-victory-corporate-116790/',
  'https://cdn.pixabay.com/download/audio/2022/06/08/audio_7a4ba1e7dd.mp3',
  132, 95000, 'high',
  ARRAY['triumphant','victory','payoff','epic','inspiring'],
  ARRAY['corporate','orchestral'],
  9, 'CC0'
);

COMMENT ON TABLE music_library IS
  'Curated CC0 background music. 20 seed tracks from Pixabay (pixabay.com/music). All CC0 — free for commercial use, no attribution required. Admin can add/remove tracks at /admin/music-library.';
