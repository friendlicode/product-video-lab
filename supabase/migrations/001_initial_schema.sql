-- ============================================================
-- 001_initial_schema.sql
-- Product Video Lab -- complete database schema
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE project_status AS ENUM (
  'draft',
  'briefing',
  'story_selection',
  'scripting',
  'storyboarding',
  'render_ready',
  'rendering',
  'review',
  'approved',
  'archived'
);

CREATE TYPE asset_type AS ENUM (
  'screenshot',
  'demo_video',
  'logo',
  'brand_asset',
  'other'
);

CREATE TYPE tone_preset AS ENUM (
  'bold',
  'conversational',
  'professional',
  'founder_raw',
  'hype',
  'minimal',
  'storyteller'
);

CREATE TYPE target_platform AS ENUM (
  'linkedin',
  'twitter_x',
  'youtube_short',
  'youtube_long',
  'instagram_reel',
  'tiktok',
  'website',
  'pitch_deck',
  'other'
);

CREATE TYPE render_status AS ENUM (
  'draft',
  'queued',
  'processing',
  'completed',
  'failed',
  'canceled'
);

CREATE TYPE scene_type AS ENUM (
  'text_overlay',
  'screenshot_pan',
  'screenshot_zoom',
  'video_clip',
  'split_screen',
  'logo_reveal',
  'cta_card',
  'transition_card',
  'custom'
);

CREATE TYPE narrative_role AS ENUM (
  'hook',
  'problem',
  'shift',
  'proof',
  'payoff',
  'cta'
);

CREATE TYPE narrative_type AS ENUM (
  'pain_to_solution',
  'before_after',
  'contrarian_insight',
  'founder_reveal',
  'hidden_cost',
  'workflow_transformation',
  'speed_and_efficiency',
  'social_proof',
  'category_reframe'
);

CREATE TYPE hook_type AS ENUM (
  'question',
  'statistic',
  'bold_claim',
  'pain_point',
  'contrarian',
  'story_opener',
  'visual_hook'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'revision_requested'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'editor',
  'viewer'
);


-- ─── Tables ───────────────────────────────────────────────────────────────────

-- users
-- Mirrors auth.users; populated via a trigger on sign-up or manually.
CREATE TABLE users (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text        NOT NULL UNIQUE,
  name         text,
  role         user_role   NOT NULL DEFAULT 'editor',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- projects
CREATE TABLE projects (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name       text            NOT NULL,
  product_name        text            NOT NULL,
  product_description text,
  target_audience     text,
  target_platform     target_platform,
  desired_outcome     text,
  tone_preset         tone_preset,
  cta                 text,
  status              project_status  NOT NULL DEFAULT 'draft',
  created_by          uuid            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at          timestamptz     NOT NULL DEFAULT now(),
  updated_at          timestamptz     NOT NULL DEFAULT now(),
  archived_at         timestamptz
);

-- project_assets
CREATE TABLE project_assets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type     asset_type  NOT NULL,
  file_path      text        NOT NULL,
  file_url       text        NOT NULL,
  file_name      text        NOT NULL,
  mime_type      text,
  file_size      bigint,
  width          integer,
  height         integer,
  duration_ms    integer,
  thumbnail_url  text,
  metadata       jsonb       NOT NULL DEFAULT '{}',
  sort_order     integer     NOT NULL DEFAULT 0,
  created_by     uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- product_briefs
CREATE TABLE product_briefs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number      integer     NOT NULL DEFAULT 1,
  audience_summary    text,
  problem_summary     text,
  promise_summary     text,
  benefits            jsonb       NOT NULL DEFAULT '[]',
  objections          jsonb       NOT NULL DEFAULT '[]',
  proof_points        jsonb       NOT NULL DEFAULT '[]',
  visual_highlights   jsonb       NOT NULL DEFAULT '[]',
  positioning_notes   jsonb       NOT NULL DEFAULT '{}',
  raw_json            jsonb       NOT NULL DEFAULT '{}',
  generated_by        text        NOT NULL DEFAULT 'ai',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- story_directions
CREATE TABLE story_directions (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid           NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number   integer        NOT NULL DEFAULT 1,
  title            text           NOT NULL,
  angle            text,
  target_emotion   text,
  narrative_type   narrative_type NOT NULL,
  story_summary    text,
  hook_setup       text,
  tension          text,
  resolution       text,
  payoff           text,
  cta_angle        text,
  selected         boolean        NOT NULL DEFAULT false,
  raw_json         jsonb          NOT NULL DEFAULT '{}',
  generated_by     text          NOT NULL DEFAULT 'ai',
  created_at       timestamptz    NOT NULL DEFAULT now()
);

-- hooks
CREATE TABLE hooks (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  story_direction_id  uuid        NOT NULL REFERENCES story_directions(id) ON DELETE CASCADE,
  version_number      integer     NOT NULL DEFAULT 1,
  hook_text           text        NOT NULL,
  hook_type           hook_type   NOT NULL,
  score               numeric(4,2),
  rationale           text,
  selected            boolean     NOT NULL DEFAULT false,
  raw_json            jsonb       NOT NULL DEFAULT '{}',
  generated_by        text        NOT NULL DEFAULT 'ai',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- scripts
CREATE TABLE scripts (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  story_direction_id       uuid        NOT NULL REFERENCES story_directions(id) ON DELETE CASCADE,
  selected_hook_id         uuid        REFERENCES hooks(id) ON DELETE SET NULL,
  version_number           integer     NOT NULL DEFAULT 1,
  title                    text        NOT NULL,
  duration_target_seconds  integer,
  full_script              text,
  voiceover_script         text,
  cta_script               text,
  narrative_structure      jsonb       NOT NULL DEFAULT '{}',
  raw_json                 jsonb       NOT NULL DEFAULT '{}',
  selected                 boolean     NOT NULL DEFAULT false,
  generated_by             text        NOT NULL DEFAULT 'ai',
  created_at               timestamptz NOT NULL DEFAULT now()
);

-- storyboard_versions
CREATE TABLE storyboard_versions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  script_id      uuid        NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version_number integer     NOT NULL DEFAULT 1,
  title          text        NOT NULL,
  selected       boolean     NOT NULL DEFAULT false,
  raw_json       jsonb       NOT NULL DEFAULT '{}',
  generated_by   text        NOT NULL DEFAULT 'ai',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- storyboard_scenes
CREATE TABLE storyboard_scenes (
  id                    uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_version_id uuid           NOT NULL REFERENCES storyboard_versions(id) ON DELETE CASCADE,
  scene_index           integer        NOT NULL,
  scene_type            scene_type     NOT NULL,
  narrative_role        narrative_role NOT NULL,
  duration_seconds      numeric(6,2)   NOT NULL DEFAULT 3,
  asset_id              uuid           REFERENCES project_assets(id) ON DELETE SET NULL,
  visual_instruction    text,
  motion_type           text,
  on_screen_text        text,
  voiceover_line        text,
  caption_text          text,
  callout_text          text,
  transition_type       text           NOT NULL DEFAULT 'cut',
  metadata              jsonb          NOT NULL DEFAULT '{}',
  created_at            timestamptz    NOT NULL DEFAULT now(),
  updated_at            timestamptz    NOT NULL DEFAULT now()
);

-- caption_versions
CREATE TABLE caption_versions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  script_id             uuid        NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  storyboard_version_id uuid        NOT NULL REFERENCES storyboard_versions(id) ON DELETE CASCADE,
  version_number        integer     NOT NULL DEFAULT 1,
  segments              jsonb       NOT NULL DEFAULT '[]',
  raw_json              jsonb       NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- render_payloads
CREATE TABLE render_payloads (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storyboard_version_id uuid        NOT NULL REFERENCES storyboard_versions(id) ON DELETE CASCADE,
  script_id             uuid        NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  payload               jsonb       NOT NULL DEFAULT '{}',
  aspect_ratio          text        NOT NULL DEFAULT '9:16',
  style_preset          text,
  created_by            uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- render_jobs
CREATE TABLE render_jobs (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  render_payload_id uuid          NOT NULL REFERENCES render_payloads(id) ON DELETE CASCADE,
  provider          text          NOT NULL DEFAULT 'remotion',
  status            render_status NOT NULL DEFAULT 'draft',
  progress          numeric(5,2),
  output_url        text,
  thumbnail_url     text,
  error_message     text,
  started_at        timestamptz,
  completed_at      timestamptz,
  created_by        uuid          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

-- approvals
CREATE TABLE approvals (
  id           uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid            NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_type text            NOT NULL,
  version_id   uuid            NOT NULL,
  status       approval_status NOT NULL DEFAULT 'pending',
  reviewer_id  uuid            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes        text,
  created_at   timestamptz     NOT NULL DEFAULT now()
);

-- activity_logs
CREATE TABLE activity_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  action_type  text        NOT NULL,
  entity_type  text,
  entity_id    uuid,
  metadata     jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- projects
CREATE INDEX idx_projects_created_by     ON projects(created_by);
CREATE INDEX idx_projects_status         ON projects(status);
CREATE INDEX idx_projects_created_at     ON projects(created_at DESC);
CREATE INDEX idx_projects_target_platform ON projects(target_platform);

-- project_assets
CREATE INDEX idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX idx_project_assets_asset_type ON project_assets(asset_type);
CREATE INDEX idx_project_assets_created_by ON project_assets(created_by);
CREATE INDEX idx_project_assets_sort_order ON project_assets(project_id, sort_order);

-- product_briefs
CREATE INDEX idx_product_briefs_project_id     ON product_briefs(project_id);
CREATE INDEX idx_product_briefs_version_number ON product_briefs(project_id, version_number DESC);

-- story_directions
CREATE INDEX idx_story_directions_project_id  ON story_directions(project_id);
CREATE INDEX idx_story_directions_selected    ON story_directions(project_id, selected);
CREATE INDEX idx_story_directions_created_at  ON story_directions(created_at DESC);

-- hooks
CREATE INDEX idx_hooks_project_id           ON hooks(project_id);
CREATE INDEX idx_hooks_story_direction_id   ON hooks(story_direction_id);
CREATE INDEX idx_hooks_selected             ON hooks(story_direction_id, selected);

-- scripts
CREATE INDEX idx_scripts_project_id          ON scripts(project_id);
CREATE INDEX idx_scripts_story_direction_id  ON scripts(story_direction_id);
CREATE INDEX idx_scripts_selected_hook_id    ON scripts(selected_hook_id);
CREATE INDEX idx_scripts_selected            ON scripts(project_id, selected);

-- storyboard_versions
CREATE INDEX idx_storyboard_versions_project_id ON storyboard_versions(project_id);
CREATE INDEX idx_storyboard_versions_script_id  ON storyboard_versions(script_id);
CREATE INDEX idx_storyboard_versions_selected   ON storyboard_versions(project_id, selected);

-- storyboard_scenes
CREATE INDEX idx_storyboard_scenes_version_id  ON storyboard_scenes(storyboard_version_id);
CREATE INDEX idx_storyboard_scenes_scene_index ON storyboard_scenes(storyboard_version_id, scene_index);
CREATE INDEX idx_storyboard_scenes_asset_id    ON storyboard_scenes(asset_id);
CREATE INDEX idx_storyboard_scenes_narrative   ON storyboard_scenes(narrative_role);

-- caption_versions
CREATE INDEX idx_caption_versions_project_id            ON caption_versions(project_id);
CREATE INDEX idx_caption_versions_script_id             ON caption_versions(script_id);
CREATE INDEX idx_caption_versions_storyboard_version_id ON caption_versions(storyboard_version_id);

-- render_payloads
CREATE INDEX idx_render_payloads_project_id            ON render_payloads(project_id);
CREATE INDEX idx_render_payloads_storyboard_version_id ON render_payloads(storyboard_version_id);
CREATE INDEX idx_render_payloads_script_id             ON render_payloads(script_id);
CREATE INDEX idx_render_payloads_created_by            ON render_payloads(created_by);

-- render_jobs
CREATE INDEX idx_render_jobs_project_id        ON render_jobs(project_id);
CREATE INDEX idx_render_jobs_render_payload_id ON render_jobs(render_payload_id);
CREATE INDEX idx_render_jobs_status            ON render_jobs(status);
CREATE INDEX idx_render_jobs_created_by        ON render_jobs(created_by);
CREATE INDEX idx_render_jobs_created_at        ON render_jobs(created_at DESC);

-- approvals
CREATE INDEX idx_approvals_project_id  ON approvals(project_id);
CREATE INDEX idx_approvals_version_id  ON approvals(version_id);
CREATE INDEX idx_approvals_reviewer_id ON approvals(reviewer_id);
CREATE INDEX idx_approvals_status      ON approvals(status);

-- activity_logs
CREATE INDEX idx_activity_logs_project_id  ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_user_id     ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at  ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity      ON activity_logs(entity_type, entity_id);


-- ─── updated_at Trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_storyboard_scenes
  BEFORE UPDATE ON storyboard_scenes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_render_jobs
  BEFORE UPDATE ON render_jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ─── Auto-create public.users on auth signup ─────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    'editor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();


-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_briefs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_directions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hooks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboard_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboard_scenes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE caption_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_payloads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs       ENABLE ROW LEVEL SECURITY;

-- All authenticated users have full access (internal tool -- tighten per-role in a later migration)
CREATE POLICY "authenticated_all" ON users               FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON projects            FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON project_assets      FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON product_briefs      FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON story_directions    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON hooks               FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON scripts             FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON storyboard_versions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON storyboard_scenes   FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON caption_versions    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON render_payloads     FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON render_jobs         FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON approvals           FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_all" ON activity_logs       FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);


-- ─── Storage Buckets ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'project-assets',
    'project-assets',
    false,
    52428800, -- 50 MB
    ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','image/svg+xml']
  ),
  (
    'render-outputs',
    'render-outputs',
    false,
    524288000, -- 500 MB
    ARRAY['video/mp4','video/webm','image/png','image/jpeg']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can read/write their own project buckets
CREATE POLICY "authenticated_read_project_assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_write_project_assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_project_assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_read_render_outputs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'render-outputs' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_write_render_outputs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'render-outputs' AND auth.uid() IS NOT NULL);
