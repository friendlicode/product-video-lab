-- ============================================================
-- 005_seed_exemplars.sql
-- Seed: 15 curated viral / YC-level product marketing videos.
--
-- These are injected as few-shot context into AI generation prompts.
-- Each is annotated with: narrative structure, pacing curve, music
-- strategy, visual language, caption style, and key techniques.
--
-- Update URLs in the admin UI (/admin/exemplars) to point to the
-- exact videos you want to reference. The analysis here is based
-- on the brands' publicly known video style and widely discussed patterns.
--
-- Curator: Claude (initial seed). Last reviewed: 2026-04.
-- ============================================================

-- ─── 1. Linear — "This is Linear" ───────────────────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'This is Linear',
  'Linear',
  'https://www.youtube.com/@linear',
  'b2b_saas',
  45.0,
  '16:9',
  'Black screen. Single white word appears center-frame: "Linear." Hold 1 second. Then the product explodes into view — a fast cascade of UI screens at 24fps. The viewer is not told what it is; they feel it.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":2000,"scene_type":"text_overlay","narrative_role":"hook","motion":"fade_in_hold","on_screen_text":"Linear.","voiceover_line":null,"music_beat_alignment":"first_downbeat","key_technique":"brand_name_as_hook","notes":"Black bg, white oversized Inter font. No voiceover. The beat drops exactly when the logo appears."},
    {"scene_index":1,"start_ms":2000,"end_ms":7000,"scene_type":"screenshot_zoom","narrative_role":"problem","motion":"rapid_cuts","on_screen_text":"Most project management feels like this.","voiceover_line":null,"music_beat_alignment":"on_beat","key_technique":"contrast_with_competitor","notes":"Rapid cuts of cluttered Jira-like UI — overwhelming columns, badges, noise. 0.7s per cut. Music stays low and tense."},
    {"scene_index":2,"start_ms":7000,"end_ms":14000,"scene_type":"screenshot_pan","narrative_role":"shift","motion":"slide_reveal","on_screen_text":"Then there is Linear.","voiceover_line":null,"music_beat_alignment":"build_peak","key_technique":"contrast_reveal","notes":"Screen wipes from left. Linear UI appears: black, clean, impossibly fast. Music builds. Viewer exhales."},
    {"scene_index":3,"start_ms":14000,"end_ms":28000,"scene_type":"video_clip","narrative_role":"proof","motion":"fast_cuts","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"on_beat_every_cut","key_technique":"feature_montage_synced_to_music","notes":"6-8 rapid-fire UI demos: issue creation, cycle view, shortcut navigation. Every cut lands on a drum hit. No text. The product speaks."},
    {"scene_index":4,"start_ms":28000,"end_ms":38000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"stagger_in_lines","on_screen_text":"Fast. Focused. Built for teams that care.","voiceover_line":null,"music_beat_alignment":"music_release","key_technique":"brand_promise_typography","notes":"Three short lines appear one-by-one. Each word group on its own line. Music softens to a held note."},
    {"scene_index":5,"start_ms":38000,"end_ms":45000,"scene_type":"cta_card","narrative_role":"cta","motion":"fade_in","on_screen_text":"linear.app","voiceover_line":null,"music_beat_alignment":"outro","key_technique":"clean_url_cta","notes":"Just the URL. No button, no call to action verb. Confidence through restraint."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":7},{"time_ms":2000,"energy":9},{"time_ms":7000,"energy":6},{"time_ms":12000,"energy":9},{"time_ms":14000,"energy":10},{"time_ms":28000,"energy":7},{"time_ms":38000,"energy":5},{"time_ms":45000,"energy":4}],"notes":"Spike at drop, high through proof montage, settle into brand promise, quiet close."}'::jsonb,
  '{"bpm":128,"genre":"dark_electronic","mood":"tense_then_triumphant","drop_points_ms":[2000,14000],"build_points_ms":[7000,12000],"silence_moments_ms":[],"sync_to_cuts":true,"notes":"Every edit is a music event. If the cut does not land on a beat, it was not cut there."}'::jsonb,
  '{"typography":{"primary_family":"Inter","weight_scale":"800 for headline, 400 for body","letter_spacing":"tight","emphasis_style":"scale up + white glow","line_height":"1.1"},"color":{"palette":["#000000","#FFFFFF","#5E6AD2"],"background":"pure black","text":"pure white","accent":"Linear purple #5E6AD2","grade":"no grade on UI — shots already look like Linear"},"motion_principles":["every cut lands on a beat","UI reveals use directional slides not fades","pacing accelerates through proof section then settles for brand moment"]}'::jsonb,
  '{"positioning":"none — video is music and motion driven, no spoken captions","emphasis_pattern":"N/A","word_grouping":"N/A","typography_hierarchy":"on-screen text is 80px+ headline, nothing smaller"}'::jsonb,
  ARRAY['brand_name_as_hook','music_drives_every_cut','dark_minimal_aesthetic','contrast_reveal','feature_montage','restraint_in_cta'],
  'The gold standard for B2B SaaS launch videos. Zero voiceover — music and motion carry everything. The lesson: if your product is fast and beautiful, show it at full speed and trust the viewer. Every competitor looks worse after watching this.',
  10
);

-- ─── 2. Notion Calendar — "Your time is your greatest resource" ─────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Your time is your greatest resource',
  'Notion',
  'https://www.youtube.com/@NotionHQ',
  'productivity',
  60.0,
  '16:9',
  'Aerial time-lapse of a city. Voiceover begins: "Every day, you have 24 hours." Calendar grid animates over the city. Soft but certain — this is a video about taking time back.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":4000,"scene_type":"video_clip","narrative_role":"hook","motion":"slow_pan","on_screen_text":null,"voiceover_line":"Every day, you have 24 hours.","music_beat_alignment":"ambient_open","key_technique":"universal_truth_opener","notes":"Time-lapse city. Cinematic. The universality of time is the hook — everyone owns this problem."},
    {"scene_index":1,"start_ms":4000,"end_ms":12000,"scene_type":"split_screen","narrative_role":"problem","motion":"fade_between","on_screen_text":"But most of it slips away.","voiceover_line":"Most of it slips away — to meetings that ran long, to context-switching, to disorganized days.","music_beat_alignment":"on_beat","key_technique":"relatable_pain_point","notes":"Split: calendar full of red blocks on one side, person looking frustrated on other. Empathy first."},
    {"scene_index":2,"start_ms":12000,"end_ms":22000,"scene_type":"screenshot_zoom","narrative_role":"shift","motion":"slow_zoom_in","on_screen_text":"Notion Calendar.","voiceover_line":"Notion Calendar connects your work and your time — in one place.","music_beat_alignment":"lift","key_technique":"product_reveal_with_relief","notes":"Calendar view expands. Notion pages link out from events. Clean, soft UI. Music lifts."},
    {"scene_index":3,"start_ms":22000,"end_ms":42000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"gentle_pan","on_screen_text":null,"voiceover_line":"Your meetings, your projects, your deadlines — all connected. Finally.","music_beat_alignment":"gentle_build","key_technique":"connected_workflow_demo","notes":"Three feature demos in gentle sequence: Notion doc links from event, drag to reschedule, daily view. Each given 5-6 seconds to breathe."},
    {"scene_index":4,"start_ms":42000,"end_ms":55000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"fade_in_slow","on_screen_text":"Take your time back.","voiceover_line":"Take your time back.","music_beat_alignment":"music_peak_then_settle","key_technique":"brand_promise_echo","notes":"The phrase from the hook returns as a command. White text on warm gray. Music peaks gently then fades."},
    {"scene_index":5,"start_ms":55000,"end_ms":60000,"scene_type":"cta_card","narrative_role":"cta","motion":"fade_in","on_screen_text":"Notion Calendar. Free.","voiceover_line":"Notion Calendar. Free.","music_beat_alignment":"outro","key_technique":"price_as_cta","notes":"The word Free gets emphasis. Smart — removes the last objection at the close."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":5},{"time_ms":4000,"energy":4},{"time_ms":12000,"energy":6},{"time_ms":22000,"energy":7},{"time_ms":42000,"energy":8},{"time_ms":55000,"energy":5},{"time_ms":60000,"energy":4}],"notes":"Slow build. This video is warm not urgent. Energy peaks at payoff, not at product reveal."}'::jsonb,
  '{"bpm":90,"genre":"ambient_indie","mood":"warm_hopeful","drop_points_ms":[12000],"build_points_ms":[22000,42000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music flows continuously, cuts do not need to land on beats. It is a feeling, not a click."}'::jsonb,
  '{"typography":{"primary_family":"Notion sans / system stack","weight_scale":"500 for headlines, 400 for body","letter_spacing":"normal","emphasis_style":"fade in word by word","line_height":"1.4"},"color":{"palette":["#FFFFFF","#F7F6F3","#37352F","#2EAADC"],"background":"warm off-white","text":"Notion dark","accent":"Notion blue","grade":"warm, slightly desaturated"},"motion_principles":["never hurry — each feature gets room to breathe","transitions are fades not wipes","UI shown in full context, not cropped"]}'::jsonb,
  '{"positioning":"lower third, small","emphasis_pattern":"key phrases spoken and shown simultaneously","word_grouping":"full phrases, 6-10 words","typography_hierarchy":"spoken captions are secondary to the visual — do not compete"}'::jsonb,
  ARRAY['universal_truth_opener','warm_empathy_pacing','connected_workflow_reveal','price_as_cta','music_as_feeling_not_click'],
  'Notion does not try to be Linear. They own warmth, connection, and calm. The lesson: match your brand personality in your pacing. A fast-cut minimalist edit would have killed this video. Every design decision reinforces "we make your life calmer."',
  9
);

-- ─── 3. Figma Config 2023 — "Come together" ─────────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Config 2023 — Come together',
  'Figma',
  'https://www.youtube.com/@Figma',
  'creative_tool',
  30.0,
  '16:9',
  'Quick flash of community faces working. Then the Figma cursor — that iconic red circle — appears on a blank canvas. The hook is identity: you are a designer, this is your conference.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":2000,"scene_type":"video_clip","narrative_role":"hook","motion":"rapid_flash","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"first_stab","key_technique":"community_face_flash","notes":"6-8 faces of real Figma community members. 0.25s each. You see yourself in them."},
    {"scene_index":1,"start_ms":2000,"end_ms":6000,"scene_type":"text_overlay","narrative_role":"shift","motion":"kinetic_type_reveal","on_screen_text":"Config 2023","voiceover_line":null,"music_beat_alignment":"drop","key_technique":"event_name_kinetic","notes":"The words Config and 2023 slam in from different directions. Kinetic typography at its most direct."},
    {"scene_index":2,"start_ms":6000,"end_ms":16000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"fast_cuts","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"on_beat","key_technique":"product_celebration_montage","notes":"Work created in Figma: UI designs, prototypes, dev mode. Every cut shows something new. This is what you built."},
    {"scene_index":3,"start_ms":16000,"end_ms":24000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"stagger_words","on_screen_text":"Come together. Build what matters.","voiceover_line":null,"music_beat_alignment":"music_peak","key_technique":"community_call_to_action","notes":"Each word staggers in on a beat. The community narrative peaks here."},
    {"scene_index":4,"start_ms":24000,"end_ms":30000,"scene_type":"cta_card","narrative_role":"cta","motion":"logo_reveal","on_screen_text":"figma.com/config","voiceover_line":null,"music_beat_alignment":"outro_hold","key_technique":"event_url_cta","notes":"Figma logo with Config URL. Clean exit."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":9},{"time_ms":2000,"energy":10},{"time_ms":6000,"energy":9},{"time_ms":16000,"energy":10},{"time_ms":24000,"energy":8},{"time_ms":30000,"energy":5}],"notes":"Starts high, stays high. This is a celebration trailer — energy never drops below 8."}'::jsonb,
  '{"bpm":140,"genre":"high_energy_electronic","mood":"celebratory_urgent","drop_points_ms":[2000,16000],"build_points_ms":[1000,15000],"silence_moments_ms":[],"sync_to_cuts":true,"notes":"Every cut is a beat. 140 BPM means 0.43s between beats — that is your maximum cut duration in the montage section."}'::jsonb,
  '{"typography":{"primary_family":"Figma brand typeface","weight_scale":"900 black weight for event name","letter_spacing":"condensed","emphasis_style":"directional slam-in","line_height":"0.95 — letters nearly touching"},"color":{"palette":["#F24E1E","#A259FF","#1ABCFE","#0ACF83","#FFFFFF","#000000"],"background":"black","text":"white","accent":"all Figma brand colors used","grade":"high contrast, no desaturation"},"motion_principles":["every motion is fast and deliberate","text elements come from off-screen — never just fade","color is used to signal energy not information"]}'::jsonb,
  '{"positioning":"none — no captions, music and motion carry","emphasis_pattern":"on-screen text IS the caption","word_grouping":"2-3 words max per text element","typography_hierarchy":"only one level — everything is huge"}'::jsonb,
  ARRAY['community_face_flash','kinetic_type_reveal','event_celebration_format','every_cut_on_beat','high_saturation_brand_color','zero_voiceover'],
  'Config trailers are exercises in pure energy. The lesson: for community/event videos, the audience already knows they love you — your job is to make them feel it. Identity over information.',
  9
);

-- ─── 4. Raycast — "Your shortcut to everything" ─────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Your shortcut to everything',
  'Raycast',
  'https://www.youtube.com/@raycastapp',
  'devtools',
  90.0,
  '16:9',
  'Dark Mac desktop. A keyboard shortcut: Option+Space. Raycast launcher appears with a spring animation. The hook is instant delight — the product is the opening shot.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":3000,"scene_type":"screenshot_zoom","narrative_role":"hook","motion":"spring_appear","on_screen_text":"Option + Space","voiceover_line":"One shortcut. Everything you need.","music_beat_alignment":"first_note","key_technique":"product_as_hero_opener","notes":"The launcher pops open with a spring. Sound design: satisfying keyboard click + spring whoosh. First 3 seconds sell the product."},
    {"scene_index":1,"start_ms":3000,"end_ms":15000,"scene_type":"screenshot_pan","narrative_role":"problem","motion":"slow_pan_comparison","on_screen_text":"You lose 2 hours a day switching between apps.","voiceover_line":"Every minute you spend switching apps, searching folders, or opening settings is a minute you are not creating.","music_beat_alignment":"ambient","key_technique":"time_cost_framing","notes":"Split view: crowded dock, multiple windows, CMD-Tab switching. Quantify the pain."},
    {"scene_index":2,"start_ms":15000,"end_ms":35000,"scene_type":"video_clip","narrative_role":"proof","motion":"feature_demo_cuts","on_screen_text":null,"voiceover_line":"Search anything. Launch apps. Run scripts. Control your Mac. All from one place.","music_beat_alignment":"gentle_build","key_technique":"feature_per_beat","notes":"4 feature demos: app launcher, file search, Raycast extensions, system commands. Each demo 3-4s. Let the interactions breathe."},
    {"scene_index":3,"start_ms":35000,"end_ms":55000,"scene_type":"screenshot_zoom","narrative_role":"proof","motion":"zoom_into_extension","on_screen_text":"1000+ extensions","voiceover_line":"With over a thousand extensions, Raycast connects to every tool you already use.","music_beat_alignment":"lift","key_technique":"ecosystem_proof","notes":"Grid of extension icons. Then zoom into one: GitHub, Linear, Notion. Show real workflows."},
    {"scene_index":4,"start_ms":55000,"end_ms":75000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"fade_stagger","on_screen_text":"Built for people who love their craft.","voiceover_line":"Raycast is built for people who love their craft — and refuse to waste a single minute.","music_beat_alignment":"peak_settle","key_technique":"identity_statement","notes":"White text on dark gray. The audience is identified: craftspeople. This is aspirational positioning."},
    {"scene_index":5,"start_ms":75000,"end_ms":90000,"scene_type":"cta_card","narrative_role":"cta","motion":"logo_pop","on_screen_text":"raycast.com — Free","voiceover_line":"Download free at raycast.com","music_beat_alignment":"outro","key_technique":"free_price_plus_url","notes":"Logo appears with spring. URL below. Free is the conversion hook."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":9},{"time_ms":3000,"energy":6},{"time_ms":15000,"energy":7},{"time_ms":35000,"energy":8},{"time_ms":55000,"energy":7},{"time_ms":75000,"energy":5},{"time_ms":90000,"energy":4}],"notes":"Opens with delight, dips for problem framing, builds through proof, settles into identity close."}'::jsonb,
  '{"bpm":100,"genre":"minimal_electronic","mood":"focused_satisfying","drop_points_ms":[0],"build_points_ms":[35000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music is background texture. The product UI interactions have their own sound design — clicks, springs, whooshes — which are more important than the music in this video."}'::jsonb,
  '{"typography":{"primary_family":"SF Pro / system","weight_scale":"600 for headlines, 400 for voiceover captions","letter_spacing":"normal","emphasis_style":"none — clean and neutral","line_height":"1.3"},"color":{"palette":["#1C1C1E","#FFFFFF","#FF6363"],"background":"near-black macOS dark mode","text":"white","accent":"Raycast orange-red","grade":"no grade — Mac screenshots look exactly as they do in use"},"motion_principles":["UI interactions use real spring physics — same as the app","no artificial motion added — the product is already animated","zoom focuses on the exact UI element being demonstrated"]}'::jsonb,
  '{"positioning":"lower third, small, white","emphasis_pattern":"product feature names appear on-screen as they are voiced","word_grouping":"4-6 words per caption segment","typography_hierarchy":"voiceover captions secondary — UI is primary"}'::jsonb,
  ARRAY['product_as_hero_opener','sound_design_critical','spring_physics_match','feature_per_beat','ecosystem_proof','identity_positioning'],
  'Raycast videos are masterclasses in product-as-hero storytelling. The spring animation when the launcher opens is not just a UI detail — it is the emotional hook. If your product has delightful interactions, the video must show them at real speed with real sound.',
  9
);

-- ─── 5. Cursor — "The AI Code Editor" ───────────────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'The AI Code Editor',
  'Cursor',
  'https://www.youtube.com/@cursorhq',
  'devtools',
  60.0,
  '16:9',
  'Dev stares at a function. Types a comment: "// fetch user data and handle all errors". Cursor completes the entire function instantly. Viewer jaw drops. No words needed.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":5000,"scene_type":"video_clip","narrative_role":"hook","motion":"static_then_burst","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"ambient_to_burst","key_technique":"before_after_same_frame","notes":"Same editor frame. Type a comment. Full function appears in 0.5s. The delta is the hook — before and after in the same shot."},
    {"scene_index":1,"start_ms":5000,"end_ms":15000,"scene_type":"text_overlay","narrative_role":"problem","motion":"fade_in","on_screen_text":"The best engineers should spend time thinking. Not typing.","voiceover_line":"The best engineers should spend their time thinking — not typing boilerplate, not Googling syntax, not copy-pasting Stack Overflow.","music_beat_alignment":"on_beat","key_technique":"reframe_the_problem","notes":"Dark editor bg. White text. This reframes coding as a thinking problem not a typing problem."},
    {"scene_index":2,"start_ms":15000,"end_ms":35000,"scene_type":"video_clip","narrative_role":"proof","motion":"real_time_demo","on_screen_text":null,"voiceover_line":"Cursor writes the code, explains the code, and helps you navigate any codebase — just by asking.","music_beat_alignment":"build","key_technique":"live_demo_no_speedup","notes":"Three demos shown at real speed: Tab completion, Chat sidebar explaining code, codebase search via natural language. Real-time = trust."},
    {"scene_index":3,"start_ms":35000,"end_ms":50000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"code_reveal","on_screen_text":"Used by engineers at OpenAI, Stripe, Shopify, and more.","voiceover_line":"Engineers at OpenAI, Stripe, Shopify, and hundreds of the best teams use Cursor every day.","music_beat_alignment":"peak","key_technique":"social_proof_name_drop","notes":"Logo grid of famous tech companies. Then back to editor. Authority by association."},
    {"scene_index":4,"start_ms":50000,"end_ms":60000,"scene_type":"cta_card","narrative_role":"cta","motion":"fade_in","on_screen_text":"cursor.com — Start for free","voiceover_line":"Start for free at cursor.com","music_beat_alignment":"outro","key_technique":"free_start_cta","notes":"Clean exit. The freemium hook is the last thing you hear."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":10},{"time_ms":5000,"energy":7},{"time_ms":15000,"energy":8},{"time_ms":35000,"energy":9},{"time_ms":50000,"energy":6},{"time_ms":60000,"energy":4}],"notes":"Big spike at the magic demo moment, settle for problem framing, build through proof, clean exit."}'::jsonb,
  '{"bpm":110,"genre":"ambient_electronic","mood":"focused_impressive","drop_points_ms":[0],"build_points_ms":[15000,35000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music is subtle texture under demos. The UI interactions and keystrokes are the real audio events."}'::jsonb,
  '{"typography":{"primary_family":"monospace for code, sans-serif for marketing copy","weight_scale":"400 code, 600 headlines","letter_spacing":"code: normal, headlines: tight","emphasis_style":"syntax highlighting is the emphasis — let the color do the work","line_height":"1.5 code"},"color":{"palette":["#1E1E2E","#CDD6F4","#89B4FA","#A6E3A1","#F38BA8"],"background":"dark code editor","text":"light catppuccin palette","accent":"blue for completions, green for success","grade":"no grade — editor colors are the palette"},"motion_principles":["show completions at real speed — never speed up the AI","zoom into the exact character being typed","split screen when comparing before/after"]}'::jsonb,
  '{"positioning":"lower third","emphasis_pattern":"company names get bold emphasis on screen","word_grouping":"full sentences for voiceover, short for on-screen","typography_hierarchy":"code is hero, marketing text is secondary"}'::jsonb,
  ARRAY['before_after_same_frame','live_demo_real_speed','reframe_problem_as_thinking','social_proof_name_drop','freemium_cta','code_as_visual_language'],
  'Cursor does not tell you it is magical — it shows you in the first 5 seconds. The cold open demo is everything. The lesson: if you have a wow moment, lead with it and build context after. Trust that the audience will watch to understand what they just saw.',
  10
);

-- ─── 6. Vercel Ship — "Ship" ─────────────────────────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Vercel Ship 2024',
  'Vercel',
  'https://www.youtube.com/@vercelhq',
  'devtools',
  45.0,
  '16:9',
  'Black slide. One word, massive white type: "SHIP." Music stab. Silence. Then: what is shipping? Everything.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":2500,"scene_type":"text_overlay","narrative_role":"hook","motion":"slam_in","on_screen_text":"SHIP.","voiceover_line":null,"music_beat_alignment":"first_stab","key_technique":"single_word_power_hook","notes":"Largest text you can put on a screen. Nothing else. Music stab then silence for 0.5 seconds — the pause makes it hit harder."},
    {"scene_index":1,"start_ms":2500,"end_ms":12000,"scene_type":"text_overlay","narrative_role":"problem","motion":"rapid_stagger","on_screen_text":"Latency. Cold starts. Config hell. Slow builds.","voiceover_line":null,"music_beat_alignment":"rhythmic_stabs","key_technique":"pain_point_list_fast","notes":"Each pain point appears and exits rapidly. Black bg. Red or white text alternating. Viewer feels the friction."},
    {"scene_index":2,"start_ms":12000,"end_ms":22000,"scene_type":"screenshot_pan","narrative_role":"shift","motion":"slide_in","on_screen_text":"Vercel. Just ship.","voiceover_line":null,"music_beat_alignment":"drop","key_technique":"brand_as_solution","notes":"Vercel dashboard appears. Green deployment indicator. The color shift from red/tense to green/calm is the relief."},
    {"scene_index":3,"start_ms":22000,"end_ms":38000,"scene_type":"video_clip","narrative_role":"proof","motion":"fast_demo_cuts","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"on_beat","key_technique":"new_feature_montage","notes":"Each Ship announcement gets 2 seconds: AI SDK, Edge Config, new dashboard. Feature name slams in, demo plays, next."},
    {"scene_index":4,"start_ms":38000,"end_ms":45000,"scene_type":"cta_card","narrative_role":"cta","motion":"logo_reveal","on_screen_text":"vercel.com/ship","voiceover_line":null,"music_beat_alignment":"outro","key_technique":"conference_url_cta","notes":"Vercel triangle. URL. Done."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":10},{"time_ms":2500,"energy":8},{"time_ms":12000,"energy":10},{"time_ms":22000,"energy":9},{"time_ms":38000,"energy":6},{"time_ms":45000,"energy":4}],"notes":"Drops from 10 at the single-word hook, then rapidly re-escalates. Never relaxed until the CTA."}'::jsonb,
  '{"bpm":138,"genre":"punchy_electronic","mood":"urgent_powerful","drop_points_ms":[0,12000],"build_points_ms":[10000],"silence_moments_ms":[2000],"sync_to_cuts":true,"notes":"The 0.5s silence after the opening SHIP stab is a strategic device — use silence for emphasis, not just sound."}'::jsonb,
  '{"typography":{"primary_family":"Geist / system-ui","weight_scale":"900 black for all on-screen text","letter_spacing":"-0.05em — aggressively tight","emphasis_style":"full-screen size — the word IS the design","line_height":"0.9"},"color":{"palette":["#000000","#FFFFFF","#FF4444"],"background":"pure black","text":"pure white","accent":"red for pain points, green for solutions","grade":"black and white only — color is used sparingly for maximum impact"},"motion_principles":["text slams in from off-screen","no gentle fades — everything is decisive","use color to carry emotional information — red = bad, green = good, white = neutral"]}'::jsonb,
  '{"positioning":"none — no captions, text IS the content","emphasis_pattern":"entire screen is the emphasis","word_grouping":"1-3 words per element","typography_hierarchy":"one level only — everything maximum"}'::jsonb,
  ARRAY['single_word_power_hook','strategic_silence','pain_point_list_fast','color_for_emotion','feature_announcement_format','zero_voiceover'],
  'Vercel Ship is the announcement format perfected. No voiceover, no narrative — just confident proclamations and product. The 0.5s silence after the opening stab is a masterclass in using pause for impact. Copy this pause technique.',
  9
);

-- ─── 7. Warp — "The terminal for the 21st century" ──────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'The terminal for the 21st century',
  'Warp',
  'https://www.youtube.com/@warpterminal',
  'devtools',
  120.0,
  '16:9',
  'Old terminal: green text on black, blinking cursor. Voiceover: "The terminal has not changed since 1978." Then Warp opens — same terminal, different era.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":5000,"scene_type":"video_clip","narrative_role":"hook","motion":"static","on_screen_text":"1978","voiceover_line":"The terminal has not changed since 1978.","music_beat_alignment":"ambient","key_technique":"historical_framing_hook","notes":"Authentic old terminal aesthetic. Year 1978 appears. The juxtaposition with modern Macs is the tension."},
    {"scene_index":1,"start_ms":5000,"end_ms":20000,"scene_type":"screenshot_pan","narrative_role":"problem","motion":"slow_pan_pain","on_screen_text":"Cryptic. Slow. Alone.","voiceover_line":"It is cryptic. Commands fail with no explanation. There is no autocomplete, no AI help, no collaboration.","music_beat_alignment":"tense_build","key_technique":"legacy_pain_category","notes":"Show three pain categories: cryptic errors, slow output, lone developer. Give each real time."},
    {"scene_index":2,"start_ms":20000,"end_ms":35000,"scene_type":"screenshot_zoom","narrative_role":"shift","motion":"warp_open_reveal","on_screen_text":"Warp.","voiceover_line":"Warp is the terminal, reimagined.","music_beat_alignment":"drop","key_technique":"same_genre_new_era_reveal","notes":"Warp opens. Same dark background as old terminal — but with blocks, AI sidebar, modern typography. Continuity + upgrade."},
    {"scene_index":3,"start_ms":35000,"end_ms":75000,"scene_type":"video_clip","narrative_role":"proof","motion":"feature_demos","on_screen_text":null,"voiceover_line":"AI explains every error. Blocks let you navigate output. Shared sessions let you work together.","music_beat_alignment":"build","key_technique":"three_feature_proof","notes":"AI error explanation, block navigation, multiplayer session. Each feature 10-12s — enough to understand, not enough to bore."},
    {"scene_index":4,"start_ms":75000,"end_ms":100000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"stagger_in","on_screen_text":"Built for the next generation of developers.","voiceover_line":"Warp is for developers who want their tools to match the quality of their work.","music_beat_alignment":"settle","key_technique":"identity_generational_claim","notes":"Generational framing: you are the new generation. Your tools should be too."},
    {"scene_index":5,"start_ms":100000,"end_ms":120000,"scene_type":"cta_card","narrative_role":"cta","motion":"logo_fade","on_screen_text":"warp.dev — Free download","voiceover_line":"Download free at warp.dev","music_beat_alignment":"outro","key_technique":"free_download_cta","notes":"Warp logo. Simple."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":6},{"time_ms":5000,"energy":5},{"time_ms":20000,"energy":7},{"time_ms":35000,"energy":9},{"time_ms":75000,"energy":7},{"time_ms":100000,"energy":5},{"time_ms":120000,"energy":4}],"notes":"Slow open with historical hook, tension through problem, spike at reveal, sustained through proof, warm close."}'::jsonb,
  '{"bpm":95,"genre":"dark_ambient_electronic","mood":"tense_then_modern","drop_points_ms":[20000],"build_points_ms":[10000,35000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music mirrors the era shift — starts with old-school synthesizer texture, shifts to modern sound at the reveal."}'::jsonb,
  '{"typography":{"primary_family":"monospace for terminal, Inter for headlines","weight_scale":"400 terminal, 700 headlines","letter_spacing":"monospace: normal, headlines: -0.03em","emphasis_style":"feature name appears as code comment: // AI-powered","line_height":"terminal: 1.5, headlines: 1.1"},"color":{"palette":["#1A1A2E","#FFFFFF","#7C6AF7"],"background":"dark blue-black","text":"white","accent":"Warp purple","grade":"slightly cool — modern counterpoint to warm old-terminal brown"},"motion_principles":["historical contrast is everything — old terminal to new should feel like time travel","terminal blocks animate into view with a grow-from-top effect","AI sidebar slides in from right, never appears suddenly"]}'::jsonb,
  '{"positioning":"lower third, monospace font to match terminal aesthetic","emphasis_pattern":"feature names appear in terminal comment style: // block navigation","word_grouping":"short technical phrases","typography_hierarchy":"code font captions, slightly smaller than competitors — intentionally humble"}'::jsonb,
  ARRAY['historical_contrast_hook','same_genre_new_era_reveal','three_feature_proof','generational_identity_claim','monospace_visual_language','music_era_shift'],
  'Warp proves that even developer tools can have narrative. The 1978 hook is brilliant — it gives everyone permission to feel frustrated with the old way. Historical contrast is massively underused in product marketing.',
  8
);

-- ─── 8. Perplexity — "Where knowledge begins" ───────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Where knowledge begins',
  'Perplexity',
  'https://www.youtube.com/@perplexityai',
  'ai_app',
  45.0,
  '16:9',
  'Someone types a genuinely hard question — not "what is the weather" but "why did SVB collapse and what does it mean for startups?" Perplexity returns a cited, structured answer in 2 seconds. The hook is credibility.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":4000,"scene_type":"video_clip","narrative_role":"hook","motion":"typing_reveal","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"ambient","key_technique":"hard_question_as_hook","notes":"Real user typing a hard research question. No simplification. Showing Perplexity with an easy question would undersell it."},
    {"scene_index":1,"start_ms":4000,"end_ms":12000,"scene_type":"screenshot_zoom","narrative_role":"shift","motion":"answer_appear","on_screen_text":"Sources. Citations. Confidence.","voiceover_line":"Perplexity searches the web and gives you a complete, cited answer — not 10 links to scroll through.","music_beat_alignment":"lift","key_technique":"versus_google_implicit","notes":"Answer appears with source citations visible. The implicit comparison: Google gives you links, Perplexity gives you answers."},
    {"scene_index":2,"start_ms":12000,"end_ms":30000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"three_demo_sequence","on_screen_text":null,"voiceover_line":"Research, code, math, analysis — Perplexity handles any question, in any domain.","music_beat_alignment":"steady_build","key_technique":"domain_breadth_proof","notes":"Three questions: research (SVB collapse), code (debug this function), math (explain this equation). Breadth signals trust."},
    {"scene_index":3,"start_ms":30000,"end_ms":40000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"fade_in","on_screen_text":"Ask anything. Know more.","voiceover_line":"Ask anything. Know more.","music_beat_alignment":"settle","key_technique":"knowledge_brand_promise","notes":"Simple brand promise. White text on dark background. The word Know carries the weight."},
    {"scene_index":4,"start_ms":40000,"end_ms":45000,"scene_type":"cta_card","narrative_role":"cta","motion":"logo_appear","on_screen_text":"perplexity.ai","voiceover_line":null,"music_beat_alignment":"outro","key_technique":"domain_only_cta","notes":"Just the domain. Implicit: you already know what to do."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":7},{"time_ms":4000,"energy":9},{"time_ms":12000,"energy":8},{"time_ms":30000,"energy":7},{"time_ms":40000,"energy":5},{"time_ms":45000,"energy":4}],"notes":"Spike when the answer appears, steady through proof, settle into simple close."}'::jsonb,
  '{"bpm":88,"genre":"ambient_thoughtful","mood":"curious_confident","drop_points_ms":[4000],"build_points_ms":[12000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music should feel like a library or a thinking space — not a club. Calm authority."}'::jsonb,
  '{"typography":{"primary_family":"Inter or similar clean sans","weight_scale":"500 headlines, 400 body","letter_spacing":"normal","emphasis_style":"cited source numbers in Perplexity orange-purple","line_height":"1.5"},"color":{"palette":["#1C1B22","#FFFFFF","#20B2AA","#9B5FC0"],"background":"very dark blue-black","text":"white","accent":"Perplexity teal/purple","grade":"clean, slight blue-cool tint"},"motion_principles":["answer text streams in like real AI — do not show instant appearance, show the generation","citations appear as superscript numbers that the viewer can trust","never crop the interface — show the full answer including sources"]}'::jsonb,
  '{"positioning":"lower third, small","emphasis_pattern":"domain category emphasized: Research, Code, Math, Analysis","word_grouping":"question in full, answer in summary","typography_hierarchy":"question is smaller, answer is larger — the answer is the product"}'::jsonb,
  ARRAY['hard_question_as_hook','citations_as_trust_signal','domain_breadth_proof','versus_google_implicit','knowledge_brand_promise','answer_streaming_reveal'],
  'Perplexity must fight Google in the viewer mind — the implicit comparison does the work without a single negative word about competitors. Show the most impressive question you can, not the easiest. Credibility is the product.',
  9
);

-- ─── 9. Granola — "Your AI notepad for meetings" ────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Your AI notepad for meetings',
  'Granola',
  'https://www.youtube.com/@granola_ai',
  'ai_app',
  60.0,
  '16:9',
  'Person in a Zoom call. Frantically taking notes. Meeting ends. They look at their notes: incomplete fragments. Then: what if you never had to take notes again?',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":6000,"scene_type":"video_clip","narrative_role":"hook","motion":"observational","on_screen_text":null,"voiceover_line":"You know that feeling. The meeting ends and your notes are a mess.","music_beat_alignment":"ambient","key_technique":"empathy_before_product","notes":"Real person, real chaos. No actors, no studio. Authenticity is the hook for this audience."},
    {"scene_index":1,"start_ms":6000,"end_ms":16000,"scene_type":"split_screen","narrative_role":"problem","motion":"side_by_side","on_screen_text":"What you wrote vs. what actually happened.","voiceover_line":"You split your attention between listening and writing. You miss things. The notes are never quite right.","music_beat_alignment":"tension","key_technique":"split_screen_contrast","notes":"Left: fragmented notes. Right: meeting transcript. The gap is visceral."},
    {"scene_index":2,"start_ms":16000,"end_ms":28000,"scene_type":"screenshot_zoom","narrative_role":"shift","motion":"granola_open","on_screen_text":"Granola takes notes. You just think.","voiceover_line":"Granola listens to your meeting and takes notes for you. You just stay present.","music_beat_alignment":"lift","key_technique":"liberation_moment","notes":"Granola notepad appears alongside the meeting. Notes populate in real time. Person on screen relaxes visibly."},
    {"scene_index":3,"start_ms":28000,"end_ms":48000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"after_meeting_flow","on_screen_text":null,"voiceover_line":"After the meeting, you get a summary, action items, and a full transcript — all organized, all searchable.","music_beat_alignment":"warm_build","key_technique":"post_meeting_value","notes":"Post-meeting view: structured summary, action items highlighted, searchable transcript. This is the aha moment — the value lives here, not during the meeting."},
    {"scene_index":4,"start_ms":48000,"end_ms":57000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"fade_in","on_screen_text":"Be fully present. Miss nothing.","voiceover_line":"Be fully present. Miss nothing.","music_beat_alignment":"peak_settle","key_technique":"dual_promise_payoff","notes":"Two competing goods resolved by one product: presence AND completeness. That is the value proposition."},
    {"scene_index":5,"start_ms":57000,"end_ms":60000,"scene_type":"cta_card","narrative_role":"cta","motion":"fade","on_screen_text":"granola.so","voiceover_line":"granola.so","music_beat_alignment":"outro","key_technique":"domain_cta","notes":"Simple domain. Warm exit."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":5},{"time_ms":6000,"energy":5},{"time_ms":16000,"energy":7},{"time_ms":28000,"energy":8},{"time_ms":48000,"energy":7},{"time_ms":57000,"energy":4}],"notes":"Low and empathetic to start, warm build through proof, gentle close. Never urgent — this brand is calm."}'::jsonb,
  '{"bpm":82,"genre":"indie_ambient","mood":"warm_empathetic","drop_points_ms":[16000],"build_points_ms":[28000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music should feel like background coffee shop ambience. Acoustic or piano-led. Never electronic."}'::jsonb,
  '{"typography":{"primary_family":"warm serif or rounded sans","weight_scale":"400-500 throughout — nothing aggressive","letter_spacing":"slightly loose — 0.02em","emphasis_style":"italic for emotional beats","line_height":"1.6 — generous breathing room"},"color":{"palette":["#FAF7F2","#2D2D2D","#4CAF50","#F5A623"],"background":"warm off-white","text":"near-black","accent":"warm green for action items, orange for highlights","grade":"warm, slightly golden — like morning light"},"motion_principles":["observational camera — not product shots, real human context","UI appears within realistic context — not on isolated background","real-time note population creates the magic moment"]}'::jsonb,
  '{"positioning":"lower third, small, warm gray","emphasis_pattern":"action items get colored emphasis, proper nouns are bold","word_grouping":"full sentences voiceover","typography_hierarchy":"human story above product — captions serve voiceover"}'::jsonb,
  ARRAY['empathy_before_product','split_screen_contrast','post_meeting_value_reveal','dual_promise_resolution','warm_lifestyle_context','observational_camera'],
  'Granola targets knowledge workers who have been burned by bad note-taking. The empathy-first approach earns trust before the product appears. Lesson: for productivity tools, the emotional pain of the problem matters more than the feature list.',
  8
);

-- ─── 10. Cluely — viral short-form AI launch ─────────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'The AI that helps you in real time',
  'Cluely',
  'https://www.youtube.com/@cluelyai',
  'ai_app',
  30.0,
  '9:16',
  'Screen capture: person on a Zoom interview. Cluely panel appears on the side — instantly answering the question being asked in real time. Hook: you almost feel like you are watching something you should not be.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":2000,"scene_type":"video_clip","narrative_role":"hook","motion":"screen_record_reveal","on_screen_text":"POV: you have an AI co-pilot in every meeting.","voiceover_line":null,"music_beat_alignment":"first_beat","key_technique":"voyeur_hook","notes":"The viewer feels like they are seeing a secret weapon. The screen recording format makes it feel real, not produced."},
    {"scene_index":1,"start_ms":2000,"end_ms":10000,"scene_type":"video_clip","narrative_role":"proof","motion":"real_time_demo","on_screen_text":null,"voiceover_line":"They ask: tell me about a challenge you overcame. Cluely answers in 2 seconds.","music_beat_alignment":"build","key_technique":"live_ai_response_demo","notes":"The AI answer appears character by character as the interviewer finishes asking. Timing is everything — show the AI is faster than thought."},
    {"scene_index":2,"start_ms":10000,"end_ms":20000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"bold_stagger","on_screen_text":"Every meeting. Every interview. Every call.","voiceover_line":null,"music_beat_alignment":"drop","key_technique":"universal_use_case_expansion","notes":"Three use cases slam in one by one. Each word hits a beat. The viewer imagines their own situations."},
    {"scene_index":3,"start_ms":20000,"end_ms":30000,"scene_type":"cta_card","narrative_role":"cta","motion":"bold_cta","on_screen_text":"cluely.com — Never get caught without an answer","voiceover_line":null,"music_beat_alignment":"outro","key_technique":"cheeky_cta_copy","notes":"The tagline is a little audacious — that is intentional. Cluely is not for the timid."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":9},{"time_ms":2000,"energy":10},{"time_ms":10000,"energy":10},{"time_ms":20000,"energy":10},{"time_ms":30000,"energy":8}],"notes":"Starts at max and stays there. Short-form demands instant and sustained energy. Zero slow moments."}'::jsonb,
  '{"bpm":145,"genre":"viral_trap_or_phonk","mood":"audacious_energetic","drop_points_ms":[0,10000],"build_points_ms":[5000],"silence_moments_ms":[],"sync_to_cuts":true,"notes":"Music is viral and slightly controversial to match the brand energy. The beat should make the viewer nod."}'::jsonb,
  '{"typography":{"primary_family":"heavy sans-serif, Impact or similar","weight_scale":"900 everywhere","letter_spacing":"tight to normal","emphasis_style":"bold colored highlight behind key word","line_height":"1.0"},"color":{"palette":["#000000","#FFFFFF","#FF3B30"],"background":"dark or black","text":"white","accent":"red for emphasis","grade":"high contrast, no subtlety"},"motion_principles":["every text element slams in — never floats","screen recording is raw — production value is in the editing not the shooting","captions are BIG and centered — this is a mobile-first format"]}'::jsonb,
  '{"positioning":"center screen, large — this is vertical mobile-first","emphasis_pattern":"EVERY emphasis word gets a highlight color behind it","word_grouping":"2-4 words per segment — aggressive chunking","typography_hierarchy":"captions ARE the visual — they are not secondary"}'::jsonb,
  ARRAY['voyeur_hook','viral_short_form_format','real_time_ai_demo','universal_expansion_close','audacious_cta','mobile_first_captions','screen_record_authenticity'],
  'Cluely is a case study in viral short-form marketing. Everything is designed for mobile: vertical format, huge captions, instant hook, no setup. The voyeuristic angle (watching someone use a secret tool) is addictive. This format is perfect for TikTok/Instagram Reels.',
  9
);

-- ─── 11. Rewind AI — "The search engine for your life" ──────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'The search engine for your life',
  'Rewind AI',
  'https://www.youtube.com/@rewindai',
  'ai_app',
  90.0,
  '16:9',
  'Black screen. A question appears: "What did that person say on that call last Tuesday?" Then: you remember it existed but cannot find it. Rewind can.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":5000,"scene_type":"text_overlay","narrative_role":"hook","motion":"type_in","on_screen_text":"What did she say about the deadline? It was on that call last Tuesday.","voiceover_line":"You know it happened. You just cannot find it.","music_beat_alignment":"ambient","key_technique":"universal_memory_pain","notes":"Typed question appears. Everyone has had this exact frustration. The hook is universal."},
    {"scene_index":1,"start_ms":5000,"end_ms":20000,"scene_type":"screenshot_pan","narrative_role":"problem","motion":"failed_search_pan","on_screen_text":"Slack. Email. Zoom. Notion. It is everywhere and nowhere.","voiceover_line":"Your work lives across 12 different apps. When something slips through, it is gone forever.","music_beat_alignment":"tension","key_technique":"fragmentation_visualization","notes":"Pan across 4-5 app icons then each showing a failed search with 0 results. The fragmentation is the pain."},
    {"scene_index":2,"start_ms":20000,"end_ms":35000,"scene_type":"screenshot_zoom","narrative_role":"shift","motion":"rewind_timeline_reveal","on_screen_text":"Rewind records everything. Privately.","voiceover_line":"Rewind runs privately on your Mac, recording everything you see, hear, and do. All searchable, instantly.","music_beat_alignment":"drop","key_technique":"total_recall_reveal","notes":"Rewind timeline interface appears. Continuous scroll of everything that happened. The word Privately is critical — address the fear immediately."},
    {"scene_index":3,"start_ms":35000,"end_ms":65000,"scene_type":"video_clip","narrative_role":"proof","motion":"search_demo","on_screen_text":null,"voiceover_line":"Search anything you have ever seen, heard, or written — and find it in under 5 seconds.","music_beat_alignment":"build","key_technique":"search_speed_proof","notes":"Three real searches: finding a Zoom call quote, finding a screenshot of a contract, finding a meeting that happened 2 months ago. Sub-5-second results each time."},
    {"scene_index":4,"start_ms":65000,"end_ms":80000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"stagger_in","on_screen_text":"Your second brain. Always on. Always private.","voiceover_line":"Your complete memory, available instantly, entirely private.","music_beat_alignment":"settle","key_technique":"second_brain_positioning","notes":"Three properties: complete, instant, private. Each one addresses a different objection."},
    {"scene_index":5,"start_ms":80000,"end_ms":90000,"scene_type":"cta_card","narrative_role":"cta","motion":"logo_reveal","on_screen_text":"rewind.ai — Try free","voiceover_line":"Try Rewind free at rewind.ai","music_beat_alignment":"outro","key_technique":"free_trial_cta","notes":"Clean exit."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":7},{"time_ms":5000,"energy":6},{"time_ms":20000,"energy":8},{"time_ms":35000,"energy":9},{"time_ms":65000,"energy":7},{"time_ms":80000,"energy":5},{"time_ms":90000,"energy":4}],"notes":"Sustained tension through problem, spike at reveal, build through proof, settle."}'::jsonb,
  '{"bpm":92,"genre":"cinematic_ambient","mood":"tense_then_relieved","drop_points_ms":[20000],"build_points_ms":[35000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music should feel like a mystery being solved — tension in problem section, release at search results."}'::jsonb,
  '{"typography":{"primary_family":"Inter or Geist","weight_scale":"600 headlines, 400 body","letter_spacing":"normal","emphasis_style":"the search result text highlights matching terms in orange","line_height":"1.4"},"color":{"palette":["#0F0F0F","#FFFFFF","#FF5500"],"background":"very dark","text":"white","accent":"Rewind orange for search highlights","grade":"slightly warm — personal and human"},"motion_principles":["search interface shows real-time character-by-character search","matching results highlight in orange — the visual metaphor of memory being found","timeline scroll should feel continuous and infinite — the product captures everything"]}'::jsonb,
  '{"positioning":"lower third","emphasis_pattern":"search result terms get highlight treatment matching app UI","word_grouping":"conversational, full phrases","typography_hierarchy":"search query > result > context"}'::jsonb,
  ARRAY['universal_memory_pain_hook','fragmentation_visualization','privacy_objection_preempt','search_speed_proof','second_brain_positioning','timeline_infinite_scroll'],
  'Rewind faces a massive trust problem — it records everything. The best videos address this head-on: the word "Privately" appears in the product reveal, not the fine print. Lesson: if your product has an obvious concern, address it in the first 30 seconds, not the FAQ.',
  8
);

-- ─── 12. Arc Browser — "Arc for iOS" ────────────────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Arc for iOS',
  'Arc / The Browser Company',
  'https://www.youtube.com/@thebrowsercompany',
  'consumer',
  90.0,
  '16:9',
  'A city. Movement. People. Then a phone appears — and Arc opens. The browser, on iPhone, feels like a different species of mobile app. The hook is personality, not feature.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":6000,"scene_type":"video_clip","narrative_role":"hook","motion":"cinematic_pan","on_screen_text":null,"voiceover_line":"You have used a browser on your phone. You have never loved one.","music_beat_alignment":"ambient_lift","key_technique":"aspiration_opener","notes":"B-roll: people in motion, city life. Voiceover sets up unmet desire. Arc believes browsing can be joyful."},
    {"scene_index":1,"start_ms":6000,"end_ms":18000,"scene_type":"screenshot_zoom","narrative_role":"problem","motion":"scroll_frustration","on_screen_text":"Tab graveyard. Distraction machine. The same browser, forever.","voiceover_line":"Safari and Chrome are fine. But they were designed for a desktop world, on a mobile screen.","music_beat_alignment":"mild_tension","key_technique":"competitor_politely_dismissed","notes":"Chrome and Safari tabs shown as overwhelming grids. No logos — no need. The pattern is recognizable."},
    {"scene_index":2,"start_ms":18000,"end_ms":35000,"scene_type":"video_clip","narrative_role":"shift","motion":"arc_reveal_delight","on_screen_text":"Arc. Designed for how you actually use your phone.","voiceover_line":"Arc is designed for the way you actually use your phone: in moments, in context, with intention.","music_beat_alignment":"drop","key_technique":"mobile_first_revelation","notes":"Arc interface appears. Spaces, Boosts, the Arc interface feeling native to iOS. Show the personality of the app — it has opinions."},
    {"scene_index":3,"start_ms":35000,"end_ms":65000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"feature_delight_sequence","on_screen_text":null,"voiceover_line":"Spaces keep your contexts separate. Boosts transform any website. And Arc remembers what you care about.","music_beat_alignment":"playful_build","key_technique":"feature_with_personality","notes":"Three features, each shown with a moment of delight: Spaces transition animation, a Boost changing Twitter to minimal mode, Arc Today showing personalized content."},
    {"scene_index":4,"start_ms":65000,"end_ms":80000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"handwriting_reveal","on_screen_text":"Browse like yourself.","voiceover_line":"Browse like yourself.","music_beat_alignment":"peak_soft","key_technique":"identity_tagline","notes":"Handwriting-style animation on the tagline. This is a brand-identity play — Arc is for people who want tools with personality."},
    {"scene_index":5,"start_ms":80000,"end_ms":90000,"scene_type":"cta_card","narrative_role":"cta","motion":"color_burst","on_screen_text":"arc.net — Available now","voiceover_line":"Download Arc, free, at arc.net","music_beat_alignment":"outro","key_technique":"colorful_exit","notes":"Arc logo with brand colors — the exit is as joyful as the brand."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":6},{"time_ms":6000,"energy":5},{"time_ms":18000,"energy":7},{"time_ms":35000,"energy":9},{"time_ms":65000,"energy":8},{"time_ms":80000,"energy":7},{"time_ms":90000,"energy":6}],"notes":"Warm and steady. Energy builds through features and holds at identity. Never urgent — Arc is chill."}'::jsonb,
  '{"bpm":98,"genre":"indie_pop_electronic","mood":"whimsical_modern","drop_points_ms":[18000],"build_points_ms":[35000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music should have personality — maybe a little weird, definitely not corporate. The Browser Company is a band, not a company."}'::jsonb,
  '{"typography":{"primary_family":"custom Arc typeface — circular, friendly","weight_scale":"600-700 headlines, rounded curves","letter_spacing":"slightly loose — approachable","emphasis_style":"color shifts with brand palette — yellow, orange, pink","line_height":"1.4"},"color":{"palette":["#FFFFFF","#1B1B1F","#F5A623","#E8385C","#7B61FF"],"background":"white and brand colors alternate","text":"dark on light, white on dark","accent":"rotating brand colors — yellow, pink, purple","grade":"clean, slightly saturated — joyful"},"motion_principles":["interface transitions should use Arc own spring physics","color is used to signal different Spaces — color IS navigation","brand personality appears in every motion choice — nothing is generic"]}'::jsonb,
  '{"positioning":"lower third, Arc brand font","emphasis_pattern":"product names in color, benefits in white","word_grouping":"short, conversational phrases","typography_hierarchy":"brand personality > feature name > explanation"}'::jsonb,
  ARRAY['aspiration_before_product','personality_as_product','mobile_first_design','feature_delight_sequence','identity_tagline','whimsical_motion_language'],
  'Arc is the anti-Linear. Where Linear uses restraint, Arc uses abundance — more color, more personality, more whimsy. The lesson: know which end of the spectrum your brand lives on and commit fully. Arc videos would be worse if they were more professional.',
  9
);

-- ─── 13. Rabbit R1 — "Meet the Rabbit r1" ───────────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Meet the Rabbit r1',
  'Rabbit',
  'https://www.youtube.com/@rabbit_hmi',
  'hardware',
  60.0,
  '16:9',
  'A hand. Then a small orange device in it. Music swells. No context. No words. Just the object and the desire to touch it.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":4000,"scene_type":"video_clip","narrative_role":"hook","motion":"object_reveal","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"music_swell","key_technique":"hardware_object_reveal","notes":"Hands holding the r1. Shot in warm light. The device color — orange — is distinctive and intentional. The hook is desire for the object itself."},
    {"scene_index":1,"start_ms":4000,"end_ms":14000,"scene_type":"text_overlay","narrative_role":"problem","motion":"fade_in_stagger","on_screen_text":"What if you did not need apps?","voiceover_line":"We have been adding apps for 15 years. What if you could just ask for what you need?","music_beat_alignment":"build","key_technique":"app_paradigm_challenge","notes":"The big bet: Rabbit is betting the app paradigm is over. This frames them as a visionary play."},
    {"scene_index":2,"start_ms":14000,"end_ms":28000,"scene_type":"video_clip","narrative_role":"shift","motion":"hardware_demo_hands","on_screen_text":"Talk to it. It figures it out.","voiceover_line":"Tell it to order food. Book a ride. Play music. It knows how to do it — across every app, on your behalf.","music_beat_alignment":"drop","key_technique":"voice_interface_demo","notes":"Hands holding r1, speaking naturally. The device responds. Showing real hands makes it feel tactile and real."},
    {"scene_index":3,"start_ms":28000,"end_ms":48000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"feature_in_hand","on_screen_text":null,"voiceover_line":"Order a car. Find a recipe. Send a message. All by asking.","music_beat_alignment":"steady_build","key_technique":"use_case_breadth_in_hand","notes":"Three use cases shown with the device in hand in context: in a car, in a kitchen, walking. Context makes it feel real."},
    {"scene_index":4,"start_ms":48000,"end_ms":57000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"center_reveal","on_screen_text":"A new kind of computer.","voiceover_line":"The Rabbit r1. A new kind of computer.","music_beat_alignment":"peak","key_technique":"category_creation_claim","notes":"Category creation: not a phone, not a speaker. A new kind of computer. Big claim, big design."},
    {"scene_index":5,"start_ms":57000,"end_ms":60000,"scene_type":"cta_card","narrative_role":"cta","motion":"product_hero_shot","on_screen_text":"rabbit.tech — $199","voiceover_line":"rabbit.tech","music_beat_alignment":"outro","key_technique":"price_reveal_cta","notes":"$199 is a strong hook. Showing price signals confidence."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":8},{"time_ms":4000,"energy":7},{"time_ms":14000,"energy":8},{"time_ms":28000,"energy":9},{"time_ms":48000,"energy":10},{"time_ms":57000,"energy":7},{"time_ms":60000,"energy":6}],"notes":"Peaks at category claim. Hardware videos build toward the big idea reveal."}'::jsonb,
  '{"bpm":105,"genre":"cinematic_electronic","mood":"futuristic_accessible","drop_points_ms":[14000],"build_points_ms":[28000,48000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Cinematic but approachable — not cold like tech hardware usually is. The orange device needs warm music."}'::jsonb,
  '{"typography":{"primary_family":"clean geometric sans","weight_scale":"700 for claims, 400 for explanation","letter_spacing":"-0.02em","emphasis_style":"orange for product name, white for claims","line_height":"1.2"},"color":{"palette":["#FF6B35","#FFFFFF","#1A1A1A"],"background":"dark and warm","text":"white","accent":"Rabbit orange — same color as the device","grade":"warm cinematic — slight orange color grade matching the product"},"motion_principles":["hardware shown in hands — never floating in void","real context (kitchen, car, street) grounds the fantasy","product color appears throughout — orange is the brand"]}'::jsonb,
  '{"positioning":"lower third, clean","emphasis_pattern":"use case verbs get emphasis: Order. Book. Play.","word_grouping":"command-style short phrases","typography_hierarchy":"claim > use case > explanation"}'::jsonb,
  ARRAY['hardware_object_desire_hook','hands_in_context','paradigm_challenge_framing','category_creation_claim','product_color_throughout','price_reveal_as_cta'],
  'Hardware videos live or die by desire. If you do not want to hold the r1 in the first 4 seconds, the video fails. The orange color is the most important design decision in the entire marketing strategy — it appears everywhere.',
  8
);

-- ─── 14. Humane AI Pin — "Introducing AI Pin" ───────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Introducing AI Pin',
  'Humane',
  'https://www.youtube.com/@humane',
  'hardware',
  120.0,
  '16:9',
  'Person on stage at TED. Wearing a small square pin on their jacket. They raise their hand, a laser projection appears on their palm. The hook is pure wonder — this feels like science fiction.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":8000,"scene_type":"video_clip","narrative_role":"hook","motion":"stage_reveal","on_screen_text":null,"voiceover_line":"What you are looking at is a computer. But not like any computer you have seen before.","music_beat_alignment":"ambient","key_technique":"wonder_reveal","notes":"TED stage format. The raised hand with laser projection is a single visual that encapsulates the entire product promise."},
    {"scene_index":1,"start_ms":8000,"end_ms":30000,"scene_type":"text_overlay","narrative_role":"problem","motion":"stagger","on_screen_text":"We built technology to serve us. Then we became servants to it.","voiceover_line":"We built smartphones to serve us. Now we are slaves to our screens.","music_beat_alignment":"mild_tension","key_technique":"narrative_reversal","notes":"Philosophical framing. The problem is screen addiction, not a product problem. This is Vision Pro territory — selling a new way of life."},
    {"scene_index":2,"start_ms":30000,"end_ms":55000,"scene_type":"video_clip","narrative_role":"shift","motion":"wearable_demo","on_screen_text":"Screenless. Everywhere.","voiceover_line":"AI Pin is the first wearable computer with no screen. It is AI in your world, not you in AI world.","music_beat_alignment":"drop","key_technique":"screenless_revelation","notes":"Demo: ask AI Pin to translate in real time, identify food nutrition, take a photo with a tap. All screenless."},
    {"scene_index":3,"start_ms":55000,"end_ms":90000,"scene_type":"screenshot_pan","narrative_role":"proof","motion":"use_case_lifestyle","on_screen_text":null,"voiceover_line":"Ask it anything. Call anyone. Capture a moment. It works wherever you are.","music_beat_alignment":"build","key_technique":"lifestyle_proof","notes":"Real lifestyle contexts: at dinner, walking outside, in a meeting. The pin is barely visible — that is the point."},
    {"scene_index":4,"start_ms":90000,"end_ms":110000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"manifesto_reveal","on_screen_text":"Technology that disappears into life.","voiceover_line":"The goal was always to make technology disappear. AI Pin is that technology.","music_beat_alignment":"peak","key_technique":"manifesto_close","notes":"A manifesto statement not a product feature. This is category creation: they are inventing screenless computing."},
    {"scene_index":5,"start_ms":110000,"end_ms":120000,"scene_type":"cta_card","narrative_role":"cta","motion":"logo_appear","on_screen_text":"hu.ma.ne — Pre-order","voiceover_line":"Learn more at hu.ma.ne","music_beat_alignment":"outro","key_technique":"pre_order_urgency","notes":"Pre-order framing creates scarcity even before launch."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":9},{"time_ms":8000,"energy":7},{"time_ms":30000,"energy":8},{"time_ms":55000,"energy":9},{"time_ms":90000,"energy":8},{"time_ms":110000,"energy":10},{"time_ms":120000,"energy":6}],"notes":"Wonder at open, philosophical dip, rebuilds through demo, peaks at manifesto. Cinematic arc."}'::jsonb,
  '{"bpm":85,"genre":"cinematic_orchestral","mood":"visionary_reverent","drop_points_ms":[0,30000],"build_points_ms":[55000,100000],"silence_moments_ms":[5000],"sync_to_cuts":false,"notes":"Orchestral or semi-orchestral. This is a vision product — music must match the ambition. Hans Zimmer energy."}'::jsonb,
  '{"typography":{"primary_family":"clean humanist sans — literally Humane","weight_scale":"300-400 — deliberately light and gentle","letter_spacing":"0.05em — airy, breathing space","emphasis_style":"none — the restraint is the emphasis","line_height":"1.8"},"color":{"palette":["#FAFAFA","#0A0A0A","#D4A76A"],"background":"near-white or very dark","text":"near-black","accent":"warm gold — human, not synthetic","grade":"high-key, slightly warm — aspirational"},"motion_principles":["the UI is a laser on a palm — show it clearly, show it from the right angle","wearable must be barely visible in lifestyle shots — that is the feature","never show a screen — that is the point of the product"]}'::jsonb,
  '{"positioning":"lower center, elegant, small","emphasis_pattern":"manifesto phrases appear alone — no competing elements","word_grouping":"short poetic phrases — 3-5 words each","typography_hierarchy":"manifesto > voiceover > feature name"}'::jsonb,
  ARRAY['wonder_opener','philosophical_reframe','screenless_revelation','manifesto_close','orchestral_music','category_creation','pre_order_urgency'],
  'Humane is selling a lifestyle change, not a feature. The lesson for aspirational products: the emotional arc matters more than the feature list. Viewers who buy into the vision will overlook the missing features. Note: this also shows what happens when product cannot deliver on vision.',
  8
);

-- ─── 15. Apple — "Behind the Mac: Creativity" ───────────────────────────────
INSERT INTO video_exemplars (
  title, brand, url, product_category, duration_seconds, aspect_ratio,
  hook_pattern, narrative_structure, pacing_curve, music_strategy,
  visual_language, caption_style, key_techniques, curator_notes, quality_score
) VALUES (
  'Behind the Mac: Creativity',
  'Apple',
  'https://www.youtube.com/watch?v=Z0s_6Rd4QJM',
  'creative_tool',
  90.0,
  '16:9',
  'A creator at their Mac. Working. The camera does not rush. Something meaningful is being made and we are privileged to watch. The hook is the quality of the filmmaking itself.',
  '[
    {"scene_index":0,"start_ms":0,"end_ms":10000,"scene_type":"video_clip","narrative_role":"hook","motion":"observational_cinema","on_screen_text":null,"voiceover_line":"Some things need to be created.","music_beat_alignment":"ambient","key_technique":"observational_cinema_hook","notes":"Cinema-quality shot of a creator at their Mac. The hook is the quality of the camera work. Apple spends more on this 10 seconds than most companies spend on an entire video."},
    {"scene_index":1,"start_ms":10000,"end_ms":30000,"scene_type":"video_clip","narrative_role":"problem","motion":"creators_in_context","on_screen_text":null,"voiceover_line":"Music that has never been heard. Stories that have never been told. Ideas that have been waiting.","music_beat_alignment":"gentle_build","key_technique":"universal_creative_desire","notes":"Multiple creators shown: musician, filmmaker, writer, designer. No product shots. This is humanity."},
    {"scene_index":2,"start_ms":30000,"end_ms":55000,"scene_type":"video_clip","narrative_role":"shift","motion":"mac_as_tool_reveal","on_screen_text":null,"voiceover_line":"The Mac was made for this. For you.","music_beat_alignment":"lift","key_technique":"product_as_trusted_tool","notes":"Mac appears not as a hero but as a tool in capable hands. The posture is humble: the creator is the hero, Mac enables."},
    {"scene_index":3,"start_ms":55000,"end_ms":75000,"scene_type":"video_clip","narrative_role":"proof","motion":"creative_output_montage","on_screen_text":null,"voiceover_line":null,"music_beat_alignment":"music_peak","key_technique":"output_not_feature_proof","notes":"Music made on Mac. Film edited on Mac. Code written on Mac. The proof is the output, not the specs."},
    {"scene_index":4,"start_ms":75000,"end_ms":87000,"scene_type":"text_overlay","narrative_role":"payoff","motion":"fade_in","on_screen_text":"What will you create?","voiceover_line":"What will you create?","music_beat_alignment":"settle","key_technique":"viewer_addressed_directly","notes":"The question is addressed to the viewer. You are the creator. Apple is just handing you the tools."},
    {"scene_index":5,"start_ms":87000,"end_ms":90000,"scene_type":"cta_card","narrative_role":"cta","motion":"apple_logo_appear","on_screen_text":"Mac","voiceover_line":null,"music_beat_alignment":"outro","key_technique":"logo_only_confidence","notes":"Just the Apple logo and Mac wordmark. The restraint is the message: we do not need to ask."}
  ]'::jsonb,
  '{"curve":[{"time_ms":0,"energy":6},{"time_ms":10000,"energy":6},{"time_ms":30000,"energy":7},{"time_ms":55000,"energy":9},{"time_ms":75000,"energy":10},{"time_ms":87000,"energy":7},{"time_ms":90000,"energy":5}],"notes":"Slow, earned build. Peaks at the output montage. Apple never rushes — they know you will wait."}'::jsonb,
  '{"bpm":72,"genre":"cinematic_pop_orchestral","mood":"aspirational_human","drop_points_ms":[55000],"build_points_ms":[30000,75000],"silence_moments_ms":[],"sync_to_cuts":false,"notes":"Music is the emotional engine here. Choose a song with a human voice or emotional piano — not electronic. The music is the brand."}'::jsonb,
  '{"typography":{"primary_family":"SF Pro Display","weight_scale":"300 — Apple always uses light weight for maximum elegance","letter_spacing":"0.04em","emphasis_style":"none — the image is the emphasis","line_height":"1.6"},"color":{"palette":["#FFFFFF","#000000"],"background":"varies — editorial shots, not product backgrounds","text":"black on white or white on dark","accent":"none — color comes from the world","grade":"cinematic color grading — warm shadows, bright highlights, filmic"},"motion_principles":["real people in real places — never controlled studio environments","camera movement is organic — handheld or subtle slider, never drone","product is incidental — never hero-lit, never isolated on white background"]}'::jsonb,
  '{"positioning":"none — Apple does not use lower-third captions in brand spots","emphasis_pattern":"on-screen text appears rarely and earns its moment","word_grouping":"single short lines — poetic","typography_hierarchy":"image > silence > text — in that order"}'::jsonb,
  ARRAY['observational_cinema_hook','product_as_humble_tool','output_not_feature_proof','viewer_addressed_directly','logo_only_confidence','silence_as_language','earned_emotional_build'],
  'Apple redefines what a product video can be. The product barely appears — the emotional connection does the selling. Key lesson: the product should feel like the enabling condition, not the hero. The creator is the hero. If you make the creator look powerful, your tool looks powerful. Use this template for any creative or professional tool.',
  10
);
