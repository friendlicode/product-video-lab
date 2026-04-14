-- ============================================================
-- 002_seed_data.sql
-- Realistic seed data for ProspectZero product launch video
--
-- NOTE: This migration inserts a demo user into auth.users so
-- the FK constraint on public.users is satisfied. After your
-- first real sign-up, you can delete these rows or keep them
-- as reference data. Runs as postgres superuser -- bypasses RLS.
-- ============================================================

-- ─── Fixed UUIDs (replace with real auth UIDs in production) ─────────────────

-- auth / user
-- a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  demo user

-- project
-- b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  ProspectZero project

-- assets
-- c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  screenshot
-- c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  demo_video
-- c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  logo

-- brief
-- d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  product brief v1

-- story directions
-- e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  pain_to_solution (selected)
-- e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  workflow_transformation
-- e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  contrarian_insight

-- hooks
-- f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  question
-- f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  bold_claim (selected)
-- f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  pain_point
-- f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  statistic

-- script
-- 11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  script v1 (selected)

-- storyboard
-- 21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  storyboard v1 (selected)

-- scenes: 31 - 38eebc99-...

-- caption version
-- 41eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- render payload
-- 51eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- render job
-- 61eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- approval
-- 71eebc99-9c0b-4ef8-bb6d-6bb9bd380a11


-- ─── Demo auth user ───────────────────────────────────────────────────────────

INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  is_sso_user,
  encrypted_password
)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'demo@productvideolabs.internal',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo User"}',
  'authenticated',
  'authenticated',
  false,
  -- bcrypt hash of 'changeme' -- never used in production
  '$2a$10$PgjDEMfCorrpBtT7sPOvhOGCCOGUFxGQ8VhQfyETrS6O1r.m3SLSK'
)
ON CONFLICT (id) DO NOTHING;


-- ─── public.users ─────────────────────────────────────────────────────────────

INSERT INTO public.users (id, email, name, role, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'demo@productvideolabs.internal',
  'Demo User',
  'admin',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;


-- ─── Project ──────────────────────────────────────────────────────────────────

INSERT INTO projects (
  id, internal_name, product_name, product_description,
  target_audience, target_platform, desired_outcome,
  tone_preset, cta, status, created_by, created_at, updated_at
)
VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'ProspectZero Product Launch Video',
  'ProspectZero',
  'AI-powered prospecting platform that helps B2B sales teams identify high-intent accounts, build verified contact lists, and generate personalized outreach -- all in under 60 seconds per prospect.',
  'Sales leaders and SDR managers at B2B SaaS companies doing $1M-$50M ARR with 5-50 sales reps. Teams currently using manual prospecting workflows or legacy data tools like Apollo or ZoomInfo.',
  'linkedin',
  'Drive trial signups from sales leaders who watch LinkedIn video ads -- specifically VPs of Sales and Revenue leaders frustrated with SDR efficiency and pipeline coverage.',
  'conversational',
  'Start your free trial',
  'approved',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  now() - interval '14 days',
  now() - interval '2 hours'
);


-- ─── Project Assets ───────────────────────────────────────────────────────────

INSERT INTO project_assets (
  id, project_id, asset_type, file_path, file_url, file_name,
  mime_type, file_size, width, height, duration_ms,
  thumbnail_url, metadata, sort_order, created_by, created_at
)
VALUES
  -- Screenshot: ProspectZero dashboard
  (
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'screenshot',
    'project-assets/b1eebc99/dashboard-overview.png',
    'https://placehold.co/1920x1080/1a1a2e/ffffff?text=ProspectZero+Dashboard',
    'dashboard-overview.png',
    'image/png',
    1843200,
    1920,
    1080,
    NULL,
    NULL,
    '{"label":"Main dashboard -- pipeline overview","ai_description":"Full-screen view of the ProspectZero dashboard showing 3 pipeline columns, 47 active prospects, and a $2.1M ARR coverage metric in the top right."}',
    0,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    now() - interval '13 days'
  ),
  -- Demo video: product walkthrough
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'demo_video',
    'project-assets/b1eebc99/product-walkthrough.mp4',
    'https://placehold.co/video/prospeczero-walkthrough.mp4',
    'product-walkthrough.mp4',
    'video/mp4',
    52428800,
    1920,
    1080,
    127000,
    'https://placehold.co/1920x1080/1a1a2e/ffffff?text=ProspectZero+Walkthrough+Thumbnail',
    '{"label":"60-second product walkthrough","ai_description":"Screen recording showing: (1) entering a job title filter, (2) AI generating a prospect list in ~5 seconds, (3) one-click personalized email generation, (4) CRM sync confirmation."}',
    1,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    now() - interval '13 days'
  ),
  -- Logo
  (
    'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'logo',
    'project-assets/b1eebc99/prospeczero-logo.svg',
    'https://placehold.co/400x120/0f0f23/4f46e5?text=ProspectZero',
    'prospeczero-logo.svg',
    'image/svg+xml',
    18432,
    400,
    120,
    NULL,
    NULL,
    '{"label":"ProspectZero wordmark -- white on dark","variant":"dark_background"}',
    2,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    now() - interval '13 days'
  );


-- ─── Product Brief ────────────────────────────────────────────────────────────

INSERT INTO product_briefs (
  id, project_id, version_number,
  audience_summary, problem_summary, promise_summary,
  benefits, objections, proof_points, visual_highlights,
  positioning_notes, raw_json, generated_by, created_at
)
VALUES (
  'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  1,

  -- audience_summary
  'VPs of Sales, Revenue leaders, and SDR Managers at B2B SaaS companies with $1M-$50M ARR. They manage teams of 5-50 sales reps who spend the majority of their day on low-value research tasks instead of selling. They are measured on pipeline coverage, quota attainment, and SDR efficiency. They are familiar with tools like Salesforce, HubSpot, Apollo, and ZoomInfo -- and frustrated that these tools require so much manual effort.',

  -- problem_summary
  'B2B sales teams waste over 60% of their working day on non-selling activities -- manually researching prospects across LinkedIn, company websites, and data tools, cross-referencing contact info, and writing one-off outreach emails that get ignored. The result is bloated SDR headcount, thin pipeline coverage, and a quota attainment rate that has declined industry-wide for three consecutive years. Existing tools like Apollo and ZoomInfo provide data but not intelligence -- they tell you who exists, not who is ready to buy.',

  -- promise_summary
  'ProspectZero uses intent signals and AI to identify your highest-probability accounts, build verified contact lists, and generate hyper-personalized outreach -- all in under 60 seconds per prospect. Instead of your SDRs starting each day with a blank spreadsheet, they start with a prioritized list of warm accounts and ready-to-send messages. The platform connects to your existing CRM and outreach tools, so there is zero disruption to your current workflow.',

  -- benefits
  '[
    {"title": "Research time cut by 73%", "detail": "ProspectZero replaces 3+ hours of daily manual research with a single AI-generated prospect list, delivered in under 60 seconds."},
    {"title": "Pipeline coverage triples in 90 days", "detail": "By targeting only high-intent accounts, teams see a 3x improvement in pipeline coverage within their first quarter."},
    {"title": "Personalization at scale", "detail": "Every outreach email is uniquely tailored to the prospect''s role, company signals, and recent activity -- without your reps writing a single word."},
    {"title": "CRM-native workflow", "detail": "One-click sync to Salesforce and HubSpot. No new tabs, no CSV imports, no ops tickets."},
    {"title": "93% email deliverability", "detail": "ProspectZero verifies every contact before outreach, protecting your domain reputation and keeping you out of spam folders."}
  ]',

  -- objections
  '[
    {"objection": "We already use Apollo or ZoomInfo.", "response": "ProspectZero layers AI intent signals on top of contact data -- it works alongside your existing data providers, not instead of them. Most teams see ROI within 2 weeks of layering ProspectZero into their current stack."},
    {"objection": "Our team won''t adopt another tool.", "response": "Onboarding takes 15 minutes. ProspectZero lives inside your existing browser and CRM workflow. Reps don''t change how they work -- they just get 3 hours of their day back."},
    {"objection": "We''re worried about email deliverability and spam.", "response": "ProspectZero verifies every contact before it reaches your outreach tool. Our customers average 93% deliverability -- higher than any cold email platform on the market."},
    {"objection": "We have a small team and can''t afford another subscription.", "response": "One ProspectZero seat costs less than one hour of SDR time per month. If your rep books one extra meeting per week using ProspectZero, it pays for itself 10x over."}
  ]',

  -- proof_points
  '[
    {"claim": "Acme Corp booked $420K in new ARR in 90 days", "detail": "A 12-person SDR team at a Series B SaaS company reduced research time by 73% and tripled qualified meetings in their first quarter using ProspectZero."},
    {"claim": "Average SDR reclaims 2.5 hours per day", "detail": "Based on anonymized usage data across 200+ ProspectZero accounts. Time previously spent on manual research is now spent on live conversations."},
    {"claim": "93% email deliverability rate", "detail": "Measured across all outreach campaigns initiated through ProspectZero''s verified contact database. Industry average is 71%."},
    {"claim": "3x pipeline coverage improvement", "detail": "Median outcome for teams that replaced manual list-building with ProspectZero''s AI-prioritized account queue within their first quarter."}
  ]',

  -- visual_highlights
  '[
    {"asset": "dashboard-overview.png", "highlight": "Pipeline overview with 3-column kanban showing $2.1M ARR coverage. Clean, modern UI that instantly communicates the value of organized pipeline."},
    {"asset": "product-walkthrough.mp4", "highlight": "Show the moment the AI generates a prospect list -- under 5 seconds. This is the hero moment of the product."},
    {"asset": "prospect-card", "highlight": "Individual prospect card showing company intent signals, verified email, LinkedIn activity summary, and one-click email generation."},
    {"asset": "crm-sync", "highlight": "One-click Salesforce sync confirmation -- zero friction, no CSV, instant."}
  ]',

  -- positioning_notes
  '{
    "category": "AI Sales Intelligence",
    "primary_differentiator": "Intent-first prospecting -- we start with who is ready to buy, not who exists in a database.",
    "competitive_frame": "Apollo and ZoomInfo are data warehouses. ProspectZero is a revenue engine.",
    "tone_guidance": "Conversational and direct. Speak to the SDR manager who has lived through the pain personally. Avoid jargon. Make the benefit visceral and specific.",
    "brand_voice": "Confident, efficient, empathetic to the grind. We understand B2B sales. We built this because we hated the alternative."
  }',

  -- raw_json (compressed brief as returned by AI)
  '{"model":"gpt-4o","prompt_version":"brief-v2","tokens_used":2847,"generated_at":"2024-01-15T09:00:00Z"}',

  'ai',
  now() - interval '12 days'
);


-- ─── Story Directions ─────────────────────────────────────────────────────────

INSERT INTO story_directions (
  id, project_id, version_number,
  title, angle, target_emotion, narrative_type,
  story_summary, hook_setup, tension, resolution, payoff, cta_angle,
  selected, raw_json, generated_by, created_at
)
VALUES
  -- Direction 1: pain_to_solution (SELECTED)
  (
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'The Cold Outreach Graveyard',
    'Every ignored email is a symptom of the same disease -- your reps are targeting the wrong people with the wrong message at the wrong time. ProspectZero fixes all three simultaneously.',
    'Frustrated recognition followed by relief and confidence',
    'pain_to_solution',
    'Sales reps work harder than ever, but pipeline is getting thinner. This video walks the viewer through the painful reality of modern outbound -- and then shows exactly how ProspectZero eliminates the root cause, not just the symptoms.',
    'Open with the universal frustration: your team sends 200 emails to get 3 replies. Not because they aren''t talented. Because they''re flying blind.',
    'Your SDRs are spending 3+ hours a day on research that ends up ignored. Leadership wants more activity. Reps are burning out. Pipeline coverage is shrinking despite a growing team.',
    'ProspectZero identifies your best-fit accounts using AI intent signals, builds verified contact lists, and writes personalized outreach -- all in under 60 seconds per prospect. No more guessing who to target.',
    'Teams using ProspectZero fill their pipeline 3x faster without adding headcount. Your SDRs spend their day on conversations, not research. That is what a modern sales team looks like.',
    'Start your free trial and book your first ProspectZero meeting in 24 hours or less.',
    true,
    '{"generation_id":"dir-001","rank":1,"confidence":0.92}',
    'ai',
    now() - interval '11 days'
  ),

  -- Direction 2: workflow_transformation
  (
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'From Spreadsheet Chaos to Pipeline Clarity',
    'Before ProspectZero: 47 browser tabs, 3 data tools, 4 hours of research. After: one screen, 60 seconds, done. This is a before-and-after transformation story told through the lens of a single workday.',
    'Recognition and aspiration -- viewers see themselves in the before state and want the after',
    'workflow_transformation',
    'The modern SDR stack is a patchwork of disconnected tools. Reps switch between LinkedIn, Apollo, company websites, and their CRM just to research one prospect. ProspectZero collapses this entire workflow into a single AI-powered interface.',
    'Show the chaos of a typical SDR morning: six browser tabs open, three tools to cross-reference, a spreadsheet with 200 names and no signals about who to call first.',
    'By the time a rep finishes researching a prospect manually, the window of intent has often already closed. Competitors who move faster win the meeting.',
    'ProspectZero delivers a prioritized, verified prospect queue every morning -- with personalized outreach drafted and ready to send. The entire workflow takes 60 seconds instead of 4 hours.',
    'Your team goes from reactive outreach to proactive pipeline. No more chaos. No more guessing. Just qualified meetings on the calendar.',
    'Try ProspectZero free for 14 days. Your first prospect list is ready in 60 seconds.',
    false,
    '{"generation_id":"dir-002","rank":2,"confidence":0.87}',
    'ai',
    now() - interval '11 days'
  ),

  -- Direction 3: contrarian_insight
  (
    'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'More Outreach is Killing Your Pipeline',
    'The industry told you to send more emails. They were wrong. Volume is not the problem -- relevance is. This contrarian angle challenges the "activity = results" orthodoxy that has dominated B2B sales for a decade.',
    'Curiosity and vindication -- viewers who have questioned the spray-and-pray model feel validated',
    'contrarian_insight',
    'High-volume outreach has trained buyers to ignore SDRs. Spam filters are smarter. Buyers are busier. The 300-email-per-day playbook is actively damaging your domain reputation and burning your reps out. The solution is not more outreach -- it is better targeting.',
    'Open with a provocative claim that stops the scroll: "Sending more emails is why your pipeline is shrinking."',
    'The more emails you send to the wrong people, the worse your deliverability gets, the more your domain gets flagged, and the harder it becomes to reach the right people at all. Volume is a trap.',
    'ProspectZero makes every outreach count by targeting only verified high-intent accounts with messages that actually resonate. Fewer emails. Better signals. Faster responses.',
    'Less outreach. More pipeline. Better close rates. That is the ProspectZero paradox -- and it changes how you think about building a sales team.',
    'Stop sending more emails. Start sending the right ones. Try ProspectZero free.',
    false,
    '{"generation_id":"dir-003","rank":3,"confidence":0.81}',
    'ai',
    now() - interval '11 days'
  );


-- ─── Hooks (for selected direction: pain_to_solution) ────────────────────────

INSERT INTO hooks (
  id, project_id, story_direction_id, version_number,
  hook_text, hook_type, score, rationale,
  selected, raw_json, generated_by, created_at
)
VALUES
  -- Hook 1: question
  (
    'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'What if your SDR team could book 3x more meetings without sending a single extra email?',
    'question',
    7.8,
    'Opens a curiosity gap by inverting the expected advice (send more). Targets the viewer''s desire for efficiency. Works well on LinkedIn where decision-makers are skeptical of outreach volume plays.',
    false,
    '{"generation_id":"hook-001"}',
    'ai',
    now() - interval '10 days'
  ),

  -- Hook 2: bold_claim (SELECTED)
  (
    'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'ProspectZero users fill their pipeline 3x faster -- without adding a single SDR to their team.',
    'bold_claim',
    9.1,
    'Leads with a specific, falsifiable outcome (3x faster) tied to a tangible business constraint (no headcount). High-confidence stop-scroll on LinkedIn. Immediately relevant to the VP of Sales watching this mid-scroll. The "without adding a single SDR" frames the value in terms of efficiency, not effort.',
    true,
    '{"generation_id":"hook-002"}',
    'ai',
    now() - interval '10 days'
  ),

  -- Hook 3: pain_point
  (
    'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'Your SDRs are spending 3 hours a day on research that ends up in the spam folder.',
    'pain_point',
    8.4,
    'Visceral and specific. The "spam folder" detail adds a layer of futility that resonates with anyone who has managed an outbound team. Slightly confrontational -- may stop a scroll but risks feeling accusatory on LinkedIn. Pair with a reassuring visual.',
    false,
    '{"generation_id":"hook-003"}',
    'ai',
    now() - interval '10 days'
  ),

  -- Hook 4: statistic
  (
    'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    '72% of B2B reps miss quota because they''re targeting the wrong accounts. ProspectZero fixes that.',
    'statistic',
    8.0,
    'Anchors with a credible industry stat before pivoting to the solution. The "ProspectZero fixes that" close is confident but abrupt -- may need softening for a broader audience. Strong for remarketing to people already aware of the problem.',
    false,
    '{"generation_id":"hook-004"}',
    'ai',
    now() - interval '10 days'
  );


-- ─── Script ───────────────────────────────────────────────────────────────────

INSERT INTO scripts (
  id, project_id, story_direction_id, selected_hook_id,
  version_number, title, duration_target_seconds,
  full_script, voiceover_script, cta_script,
  narrative_structure, raw_json, selected, generated_by, created_at
)
VALUES (
  '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  1,
  'ProspectZero -- Cold Outreach Graveyard (v1)',
  47,

  -- full_script
  'ProspectZero users fill their pipeline 3x faster -- without adding a single SDR to their team.

Here''s what your SDR team''s day actually looks like right now.

They open LinkedIn. They search job titles. They manually check company sizes. They cross-reference Apollo for contact info. They write an email from scratch. They hit send. And 97% of the time, nothing happens.

Not because your reps aren''t talented. Because they''re targeting the wrong people with a generic message and no signal about whether that person is actually ready to buy.

ProspectZero changes the equation.

Instead of starting with a name and hoping for intent, we start with intent signals and build your outreach around them. Our AI identifies which of your target accounts are actively researching solutions like yours right now -- then generates a verified contact list and a personalized email, ready to send, in under 60 seconds.

Teams using ProspectZero reduce research time by 73% and see pipeline coverage triple within 90 days.

Acme Corp booked $420K in new ARR in their first quarter. The average ProspectZero SDR reclaims 2.5 hours every single day.

Imagine your team spending the majority of their day on conversations, not research. Qualified meetings, not cold lists. A pipeline that grows faster than your headcount.

That is what ProspectZero makes possible.

Start your free trial. See your first prospect list in under 60 seconds.',

  -- voiceover_script
  'ProspectZero users fill their pipeline three times faster -- without adding a single SDR to their team. [pause]

Here is what your team''s day actually looks like. They open LinkedIn. They search manually. They cross-reference data tools. They write an email from scratch. And 97 percent of the time -- silence.

Not because they aren''t talented. Because they have no signal about who is actually ready to buy.

ProspectZero changes that. We start with intent signals -- which accounts are actively researching solutions like yours right now -- then generate a verified prospect list and a personalized email in under 60 seconds.

Teams cut research time by 73 percent. Pipeline coverage triples in 90 days. Acme Corp booked 420 thousand in new ARR in their first quarter.

Your team should be spending their day on conversations, not research. Start your free trial. Your first prospect list is ready in 60 seconds.',

  -- cta_script
  'Start your free trial. See your first ProspectZero prospect list in under 60 seconds. No credit card required.',

  -- narrative_structure
  '{
    "hook": "ProspectZero users fill their pipeline 3x faster -- without adding a single SDR to their team.",
    "problem": "Your SDR team spends 3+ hours a day manually researching prospects across LinkedIn, Apollo, and company websites -- then sending emails that get ignored 97% of the time. Not because they aren''t talented. Because they have no signal about who is actually ready to buy.",
    "shift": "ProspectZero changes the equation. Instead of starting with a name and hoping for intent, we start with intent signals and build your outreach around them. Our AI identifies which accounts are actively researching solutions like yours -- right now.",
    "proof": "Teams using ProspectZero reduce research time by 73% and see pipeline coverage triple within 90 days. Acme Corp booked $420K in new ARR in their first quarter. The average ProspectZero SDR reclaims 2.5 hours every single day.",
    "payoff": "Your team spending the majority of their day on live conversations. Qualified meetings, not cold lists. A pipeline that grows faster than your headcount. That is what ProspectZero makes possible.",
    "cta": "Start your free trial. See your first prospect list in under 60 seconds. No credit card required."
  }',

  -- raw_json
  '{"model":"gpt-4o","prompt_version":"script-v3","tokens_used":3412,"generated_at":"2024-01-17T14:30:00Z"}',

  true,
  'ai',
  now() - interval '9 days'
);


-- ─── Storyboard Version ───────────────────────────────────────────────────────

INSERT INTO storyboard_versions (
  id, project_id, script_id,
  version_number, title, selected,
  raw_json, generated_by, created_at
)
VALUES (
  '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  1,
  'Cold Outreach Graveyard -- 8-Scene LinkedIn Cut',
  true,
  '{"model":"gpt-4o","prompt_version":"storyboard-v2","tokens_used":2918,"generated_at":"2024-01-18T10:00:00Z"}',
  'ai',
  now() - interval '8 days'
);


-- ─── Storyboard Scenes (8 scenes) ─────────────────────────────────────────────

INSERT INTO storyboard_scenes (
  id, storyboard_version_id,
  scene_index, scene_type, narrative_role,
  duration_seconds, asset_id,
  visual_instruction, motion_type, on_screen_text,
  voiceover_line, caption_text, callout_text,
  transition_type, metadata, created_at, updated_at
)
VALUES
  -- Scene 0: hook -- text_overlay (bold stat)
  (
    '31eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    0, 'text_overlay', 'hook',
    4.0, NULL,
    'Dark background (#0f0f23). Bold white headline centered vertically. Product logo appears bottom-right at 2s via fade-in. No other elements.',
    'fade_in',
    'Fill your pipeline 3x faster. Without hiring a single SDR.',
    'ProspectZero users fill their pipeline 3x faster -- without adding a single SDR to their team.',
    'Fill your pipeline 3x faster. Without hiring a single SDR.',
    NULL,
    'cut',
    '{"font_size":"xl","font_weight":"bold","text_align":"center","bg_color":"#0f0f23","text_color":"#ffffff"}',
    now() - interval '8 days', now() - interval '8 days'
  ),

  -- Scene 1: problem -- screenshot_pan (SDR chaos)
  (
    '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1, 'screenshot_pan', 'problem',
    5.5,
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Slowly pan across the dashboard screenshot from left to right, revealing the overwhelming number of prospects and manual data. Add a subtle red overlay on the left 40% of the image to signal "problem state". Overlay a small animated counter showing "3.2 hrs/day wasted".',
    'pan_left_to_right',
    '3.2 hours a day. On research that goes nowhere.',
    'Here is what your team''s day actually looks like. They open LinkedIn. They search manually. They cross-reference data tools. They write an email from scratch.',
    '3.2 hours a day wasted on manual research.',
    '3.2 hrs/day',
    'dissolve',
    '{"pan_speed":"slow","overlay_color":"rgba(239,68,68,0.15)","counter_position":"top_right"}',
    now() - interval '8 days', now() - interval '8 days'
  ),

  -- Scene 2: problem -- screenshot_zoom (97% ignored stat)
  (
    '33eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    2, 'text_overlay', 'problem',
    4.0, NULL,
    'White text on dark background. Two-line layout: large "97%" in bold indigo, followed by "of cold emails get no reply." below in regular weight. Animate the number counting up from 0 to 97 over 1.5s.',
    'count_up',
    '97% of cold emails get no reply.',
    'And 97 percent of the time -- silence. Not because they aren''t talented. Because they have no signal about who is ready to buy.',
    '97% of cold emails are ignored.',
    NULL,
    'cut',
    '{"primary_stat":"97%","stat_color":"#4f46e5","animate":"count_up","duration_ms":1500}',
    now() - interval '8 days', now() - interval '8 days'
  ),

  -- Scene 3: shift -- logo_reveal (ProspectZero intro)
  (
    '34eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    3, 'logo_reveal', 'shift',
    4.5,
    'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ProspectZero logo slides in from bottom center. Below it, subtitle text types in: "Intent-first prospecting." Background transitions from dark red (problem) to deep indigo (solution). Hold for 1.5s before next scene.',
    'slide_up_with_type',
    'ProspectZero. Intent-first prospecting.',
    'ProspectZero changes the equation. We start with intent signals -- which accounts are actively researching solutions like yours -- right now.',
    'ProspectZero. Intent-first prospecting.',
    NULL,
    'cross_dissolve',
    '{"logo_animation":"slide_up","subtitle_animation":"typewriter","bg_transition":{"from":"#3b0000","to":"#1e1b4b"},"hold_ms":1500}',
    now() - interval '8 days', now() - interval '8 days'
  ),

  -- Scene 4: proof -- screenshot_pan (pipeline dashboard)
  (
    '35eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    4, 'screenshot_pan', 'proof',
    5.0,
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Pan slowly from left to right across the dashboard. Highlight the "$2.1M ARR pipeline coverage" metric with a subtle indigo callout box that pulses twice. Add floating text overlay bottom-left: "Acme Corp -- $420K ARR in 90 days".',
    'pan_left_to_right',
    'Acme Corp: $420K in new ARR in 90 days.',
    'Teams cut research time by 73 percent. Pipeline coverage triples in 90 days. Acme Corp booked 420 thousand in new ARR in their first quarter.',
    '73% less research time. 3x pipeline coverage.',
    '$420K ARR in 90 days',
    'cut',
    '{"callout_metric":"$2.1M ARR","callout_style":"indigo_pulse","overlay_text":"Acme Corp -- $420K ARR in 90 days"}',
    now() - interval '8 days', now() - interval '8 days'
  ),

  -- Scene 5: proof -- screenshot_zoom (prospect card detail)
  (
    '36eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    5, 'screenshot_zoom', 'proof',
    4.5,
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Zoom into the top-right section of the dashboard where a prospect card is visible. The card shows: name, company, verified email badge, "High Intent" signal, and a pre-written email subject line. Hold the zoomed state for 2s. Overlay a badge: "Ready to send in 60 seconds."',
    'zoom_in_hold',
    'Verified. Personalized. Ready to send in 60 seconds.',
    'The average ProspectZero SDR reclaims 2.5 hours every single day.',
    'Verified contact. Personalized email. 60 seconds.',
    'Ready to send in 60s',
    'dissolve',
    '{"zoom_target":"top_right","zoom_factor":2.2,"hold_ms":2000,"badge_text":"Ready to send in 60 seconds","badge_style":"green_pill"}',
    now() - interval '8 days', now() - interval '8 days'
  ),

  -- Scene 6: payoff -- text_overlay (before/after)
  (
    '37eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    6, 'split_screen', 'payoff',
    5.5, NULL,
    'Split screen: LEFT side dark red background labeled "Before" with 3 bullet points in muted text (3 hrs research, 200 emails, 3 replies). RIGHT side deep indigo labeled "After" with 3 bullet points in bright text (60 sec per prospect, 47 qualified leads, 12 meetings booked). A thin white divider line down the center. Both sides animate in sequentially.',
    'split_reveal',
    'Before vs After. The ProspectZero difference.',
    'Your team spending the majority of their day on live conversations. Qualified meetings, not cold lists. A pipeline that grows faster than your headcount.',
    'Before: 3 hrs research. After: 60 seconds.',
    NULL,
    'cut',
    '{
      "layout": "split_horizontal",
      "left": {"label":"Before","bg":"#3b0000","bullets":["3 hrs manual research","200 emails sent","3 replies"],"text_color":"#fca5a5"},
      "right": {"label":"After","bg":"#1e1b4b","bullets":["60 sec per prospect","47 qualified leads","12 meetings booked"],"text_color":"#a5b4fc"},
      "divider": true,
      "animation": "sequential_reveal"
    }',
    now() - interval '8 days', now() - interval '8 days'
  ),

  -- Scene 7: cta -- cta_card
  (
    '38eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    7, 'cta_card', 'cta',
    4.0, NULL,
    'Full-screen indigo gradient background (#1e1b4b to #312e81). ProspectZero logo top-center. Large white headline. Subline in muted indigo-200. Prominent CTA button in white with indigo text. Below button: "No credit card required. Setup in 15 minutes." Hold for 1.5s after all elements appear.',
    'fade_in_stagger',
    'Start your free trial. First prospect list in 60 seconds.',
    'Start your free trial. Your first prospect list is ready in 60 seconds. No credit card required.',
    'Start free trial -- first list in 60 seconds.',
    'No credit card required',
    'fade_out',
    '{
      "bg_gradient":{"from":"#1e1b4b","to":"#312e81"},
      "headline":"Start your free trial.",
      "subline":"First prospect list ready in 60 seconds.",
      "cta_button":{"text":"Start Free Trial","bg":"#ffffff","text_color":"#1e1b4b"},
      "disclaimer":"No credit card required. Setup in 15 minutes.",
      "animation":"stagger_fade_in"
    }',
    now() - interval '8 days', now() - interval '8 days'
  );


-- ─── Caption Version ──────────────────────────────────────────────────────────

INSERT INTO caption_versions (
  id, project_id, script_id, storyboard_version_id,
  version_number, segments, raw_json, created_at
)
VALUES (
  '41eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  1,
  '[
    {"start_ms": 0,     "end_ms": 2000,  "text": "Fill your pipeline 3x faster."},
    {"start_ms": 2000,  "end_ms": 4000,  "text": "Without adding a single SDR."},
    {"start_ms": 4000,  "end_ms": 6500,  "text": "Here is what your team''s day looks like."},
    {"start_ms": 6500,  "end_ms": 9500,  "text": "LinkedIn. Apollo. Manual research. Repeat."},
    {"start_ms": 9500,  "end_ms": 13500, "text": "97% of cold emails get no reply."},
    {"start_ms": 13500, "end_ms": 16500, "text": "Not because your team isn''t talented."},
    {"start_ms": 16500, "end_ms": 18000, "text": "ProspectZero changes that."},
    {"start_ms": 18000, "end_ms": 22000, "text": "We start with intent signals -- who is ready to buy right now."},
    {"start_ms": 22000, "end_ms": 25500, "text": "Acme Corp: $420K in new ARR in 90 days."},
    {"start_ms": 25500, "end_ms": 28000, "text": "Research time cut by 73%."},
    {"start_ms": 28000, "end_ms": 31000, "text": "Verified. Personalized. Ready to send in 60 seconds."},
    {"start_ms": 31000, "end_ms": 36500, "text": "Before: 3 hours of research. After: 60 seconds."},
    {"start_ms": 36500, "end_ms": 40000, "text": "Start your free trial."},
    {"start_ms": 40000, "end_ms": 43000, "text": "First prospect list ready in 60 seconds."},
    {"start_ms": 43000, "end_ms": 47000, "text": "No credit card required."}
  ]',
  '{"model":"whisper-1","language":"en","generated_at":"2024-01-18T12:00:00Z"}',
  now() - interval '7 days'
);


-- ─── Render Payload ───────────────────────────────────────────────────────────

INSERT INTO render_payloads (
  id, project_id, storyboard_version_id, script_id,
  payload, aspect_ratio, style_preset,
  created_by, created_at
)
VALUES (
  '51eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '21eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{
    "project_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "project_name": "ProspectZero Product Launch Video",
    "target_platform": "linkedin",
    "tone_preset": "conversational",
    "aspect_ratio": "9:16",
    "style_preset": "dark_modern",
    "total_duration_seconds": 37,
    "language_code": "en-US",
    "script_body": "ProspectZero users fill their pipeline 3x faster -- without adding a single SDR to their team. Here is what your team''s day actually looks like. LinkedIn. Apollo. Manual research. 97% of emails ignored. Not because they aren''t talented. Because they have no signal. ProspectZero changes that. Intent-first prospecting. Acme Corp: $420K in new ARR in 90 days. Research time down 73%. Pipeline coverage up 3x. Before: 3 hours of research. After: 60 seconds. Start your free trial.",
    "captions": [
      {"start_ms": 0,     "end_ms": 2000,  "text": "Fill your pipeline 3x faster."},
      {"start_ms": 2000,  "end_ms": 4000,  "text": "Without adding a single SDR."},
      {"start_ms": 4000,  "end_ms": 6500,  "text": "Here is what your team''s day looks like."},
      {"start_ms": 6500,  "end_ms": 9500,  "text": "LinkedIn. Apollo. Manual research. Repeat."},
      {"start_ms": 9500,  "end_ms": 13500, "text": "97% of cold emails get no reply."},
      {"start_ms": 13500, "end_ms": 16500, "text": "Not because your team isn''t talented."},
      {"start_ms": 16500, "end_ms": 18000, "text": "ProspectZero changes that."},
      {"start_ms": 18000, "end_ms": 22000, "text": "Intent signals. Verified contacts. 60 seconds."},
      {"start_ms": 22000, "end_ms": 25500, "text": "Acme Corp: $420K new ARR in 90 days."},
      {"start_ms": 25500, "end_ms": 28000, "text": "Research time cut by 73%."},
      {"start_ms": 28000, "end_ms": 31000, "text": "Ready to send in 60 seconds."},
      {"start_ms": 31000, "end_ms": 36500, "text": "Before: 3 hrs. After: 60 seconds."},
      {"start_ms": 36500, "end_ms": 40000, "text": "Start your free trial."}
    ],
    "scenes": [
      {
        "scene_index": 0,
        "scene_type": "text_overlay",
        "narrative_role": "hook",
        "duration_seconds": 4.0,
        "on_screen_text": "Fill your pipeline 3x faster. Without hiring a single SDR.",
        "voiceover_line": "ProspectZero users fill their pipeline 3x faster -- without adding a single SDR to their team.",
        "asset_url": null,
        "motion_type": "fade_in",
        "transition_type": "cut",
        "metadata": {"bg_color": "#0f0f23", "text_color": "#ffffff", "font_weight": "bold"}
      },
      {
        "scene_index": 1,
        "scene_type": "screenshot_pan",
        "narrative_role": "problem",
        "duration_seconds": 5.5,
        "on_screen_text": "3.2 hours a day. On research that goes nowhere.",
        "voiceover_line": "Here is what your team''s day actually looks like. They open LinkedIn. They search manually. They cross-reference data tools. They write an email from scratch.",
        "asset_url": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=ProspectZero+Dashboard",
        "motion_type": "pan_left_to_right",
        "transition_type": "dissolve",
        "metadata": {"overlay_color": "rgba(239,68,68,0.15)", "counter": "3.2 hrs/day"}
      },
      {
        "scene_index": 2,
        "scene_type": "text_overlay",
        "narrative_role": "problem",
        "duration_seconds": 4.0,
        "on_screen_text": "97% of cold emails get no reply.",
        "voiceover_line": "And 97 percent of the time -- silence. Not because they aren''t talented. Because they have no signal about who is ready to buy.",
        "asset_url": null,
        "motion_type": "count_up",
        "transition_type": "cut",
        "metadata": {"primary_stat": "97%", "stat_color": "#4f46e5"}
      },
      {
        "scene_index": 3,
        "scene_type": "logo_reveal",
        "narrative_role": "shift",
        "duration_seconds": 4.5,
        "on_screen_text": "ProspectZero. Intent-first prospecting.",
        "voiceover_line": "ProspectZero changes the equation. We start with intent signals -- which accounts are actively researching solutions like yours -- right now.",
        "asset_url": "https://placehold.co/400x120/0f0f23/4f46e5?text=ProspectZero",
        "motion_type": "slide_up_with_type",
        "transition_type": "cross_dissolve",
        "metadata": {"bg_transition": {"from": "#3b0000", "to": "#1e1b4b"}}
      },
      {
        "scene_index": 4,
        "scene_type": "screenshot_pan",
        "narrative_role": "proof",
        "duration_seconds": 5.0,
        "on_screen_text": "Acme Corp: $420K in new ARR in 90 days.",
        "voiceover_line": "Teams cut research time by 73 percent. Pipeline coverage triples in 90 days. Acme Corp booked 420 thousand in new ARR in their first quarter.",
        "asset_url": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=ProspectZero+Dashboard",
        "motion_type": "pan_left_to_right",
        "transition_type": "cut",
        "metadata": {"callout_metric": "$2.1M ARR", "overlay_text": "Acme Corp -- $420K ARR in 90 days"}
      },
      {
        "scene_index": 5,
        "scene_type": "screenshot_zoom",
        "narrative_role": "proof",
        "duration_seconds": 4.5,
        "on_screen_text": "Verified. Personalized. Ready to send in 60 seconds.",
        "voiceover_line": "The average ProspectZero SDR reclaims 2.5 hours every single day.",
        "asset_url": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=ProspectZero+Dashboard",
        "motion_type": "zoom_in_hold",
        "transition_type": "dissolve",
        "metadata": {"zoom_factor": 2.2, "badge_text": "Ready to send in 60 seconds"}
      },
      {
        "scene_index": 6,
        "scene_type": "split_screen",
        "narrative_role": "payoff",
        "duration_seconds": 5.5,
        "on_screen_text": "Before vs After. The ProspectZero difference.",
        "voiceover_line": "Your team spending the majority of their day on live conversations. Qualified meetings, not cold lists. A pipeline that grows faster than your headcount.",
        "asset_url": null,
        "motion_type": "split_reveal",
        "transition_type": "cut",
        "metadata": {
          "left": {"label": "Before", "bg": "#3b0000", "bullets": ["3 hrs manual research", "200 emails sent", "3 replies"]},
          "right": {"label": "After", "bg": "#1e1b4b", "bullets": ["60 sec per prospect", "47 qualified leads", "12 meetings booked"]}
        }
      },
      {
        "scene_index": 7,
        "scene_type": "cta_card",
        "narrative_role": "cta",
        "duration_seconds": 4.0,
        "on_screen_text": "Start your free trial. First prospect list in 60 seconds.",
        "voiceover_line": "Start your free trial. Your first prospect list is ready in 60 seconds. No credit card required.",
        "asset_url": null,
        "motion_type": "fade_in_stagger",
        "transition_type": "fade_out",
        "metadata": {
          "cta_button": {"text": "Start Free Trial", "bg": "#ffffff", "text_color": "#1e1b4b"},
          "disclaimer": "No credit card required. Setup in 15 minutes.",
          "bg_gradient": {"from": "#1e1b4b", "to": "#312e81"}
        }
      }
    ],
    "created_at": "2024-01-19T09:00:00Z"
  }',
  '9:16',
  'dark_modern',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  now() - interval '6 days'
);


-- ─── Render Job ───────────────────────────────────────────────────────────────

INSERT INTO render_jobs (
  id, project_id, render_payload_id,
  provider, status, progress,
  output_url, thumbnail_url, error_message,
  started_at, completed_at,
  created_by, created_at, updated_at
)
VALUES (
  '61eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '51eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'remotion',
  'completed',
  100.00,
  'https://placehold.co/video/prospeczero-linkedin-v1-final.mp4',
  'https://placehold.co/1080x1920/1e1b4b/ffffff?text=ProspectZero+LinkedIn+Video',
  NULL,
  now() - interval '5 days 23 hours',
  now() - interval '5 days 22 hours 43 minutes',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  now() - interval '5 days 23 hours',
  now() - interval '5 days 22 hours 43 minutes'
);


-- ─── Approval ─────────────────────────────────────────────────────────────────

INSERT INTO approvals (
  id, project_id, version_type, version_id,
  status, reviewer_id, notes, created_at
)
VALUES (
  '71eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'render_job',
  '61eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'approved',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Strong hook. The 3x stat lands well on LinkedIn. The before/after split screen in scene 6 is the standout moment -- consider leading with it in a shorter cut for remarketing. Approved for posting.',
  now() - interval '4 days'
);


-- ─── Activity Logs ────────────────────────────────────────────────────────────

INSERT INTO activity_logs (
  id, project_id, user_id,
  action_type, entity_type, entity_id,
  metadata, created_at
)
VALUES
  (
    gen_random_uuid(),
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'project.created',
    'project',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"initial_status": "draft"}',
    now() - interval '14 days'
  ),
  (
    gen_random_uuid(),
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'brief.generated',
    'product_brief',
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"model": "gpt-4o", "tokens_used": 2847, "version": 1}',
    now() - interval '12 days'
  ),
  (
    gen_random_uuid(),
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'story_direction.selected',
    'story_direction',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"title": "The Cold Outreach Graveyard", "narrative_type": "pain_to_solution"}',
    now() - interval '11 days'
  ),
  (
    gen_random_uuid(),
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'render_job.completed',
    'render_job',
    '61eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"provider": "remotion", "duration_seconds": 47, "output_url": "https://placehold.co/video/prospeczero-linkedin-v1-final.mp4"}',
    now() - interval '5 days 22 hours 43 minutes'
  ),
  (
    gen_random_uuid(),
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'approval.approved',
    'render_job',
    '61eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"reviewer": "Demo User", "notes_length": 198}',
    now() - interval '4 days'
  );
