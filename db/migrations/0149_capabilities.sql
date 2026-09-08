-- db/migrations/0149_capabilities.sql — THE SWITCHBOARD'S PLANE. CE-41 seat C.
-- (0149 derived at 2159cd3: `ls db/migrations | grep -E "^[0-9]{4}" | sort | tail -1` → 0148;
--  allocated by the chair, R-40.44.)
--
-- R-41.8: every gated feature in Business Solutions is a row the founder reads
-- and flips from the admin panel. R-41.35/.36: `templates.js`'s static status
-- stays a declaration; live Meta status lives here; a REJECTED/PAUSED template
-- disarms the flag that guards its arm. R-41.38: the reel joins. R-41.40/.46:
-- the eight seed values are the founder's Railway read of 2026-09-08.
--
-- SQL PROVENANCE (protocol §10): a NEW table — its witness is this statement.
-- No FK. Reads no 0139–0147 table. The regen owed by C1 is for the SWEEP's read
-- of `vendor_google_connections` (0147), not for anything here.
--
-- ── 1 · THE TABLE ─────────────────────────────────────────────────────────────
-- CONSTRAINTS (this statement): capabilities_pkey PRIMARY KEY (key);
-- capabilities_kind_check CHECK (kind IN ('template','permission','scope','flag'));
-- capabilities_status_check CHECK (status IN ('pending','approved','rejected','paused','armed','on','off'));
-- capabilities_key_grammar_check CHECK (key ~ '^(template|perm|scope|flag)\.[a-z0-9_.]+$');
-- capabilities_auto_on_needs_walk CHECK (auto_on = false OR walk_ref IS NOT NULL)  -- fork iii, R-41.8
create table if not exists public.capabilities (
  key         text primary key,
  kind        text not null check (kind in ('template','permission','scope','flag')),
  status      text not null check (status in ('pending','approved','rejected','paused','armed','on','off')),
  evidence    text,                                   -- the sweep's last reading, Meta's/Google's word VERBATIM (R-41.36)
  checked_at  timestamptz,                            -- when the sweep last looked
  flipped_at  timestamptz,                            -- when the status last moved by a hand (admin door or sweep:auto_on/sweep:rejected)
  flipped_by  text,                                   -- 'admin:<8 hex>' | 'sweep:auto_on' | 'sweep:rejected' | 'sweep:paused' | 'seed'
  auto_on     boolean not null default false,         -- the founder's pre-authorisation for a walked plane
  walk_ref    text,                                   -- the seal hash of the walk that licenses auto_on
  updated_at  timestamptz not null default now(),
  constraint capabilities_key_grammar_check check (key ~ '^(template|perm|scope|flag)\.[a-z0-9_.]+$'),
  constraint capabilities_auto_on_needs_walk check (auto_on = false or walk_ref is not null)
);

-- ── 2 · THE SEEDS · FLAGS — the eight env vars, as the founder read them ──────
-- Railway dream-os production, founder's read 2026-09-08 (R-41.40): all eight = 1.
-- `flag.review_ask_send` = 1 confirmed deliberate (F-41.7 closed, R-41.46).
-- After these rows exist — never before — the founder deletes the eight env vars
-- in Railway (packet note step 4). The code no longer reads them at any site.
insert into public.capabilities (key, kind, status, evidence, flipped_at, flipped_by) values
  ('flag.contract_sign_send',    'flag', 'on', 'founder read of Railway 2026-09-08: CONTRACT_SIGN_SEND_ENABLED=1 (G3.2 s3 walked 09-07)',    now(), 'seed'),
  ('flag.contract_copy_send',    'flag', 'on', 'founder read of Railway 2026-09-08: CONTRACT_COPY_SEND_ENABLED=1 (G3.2 s3 walked 09-07)',    now(), 'seed'),
  ('flag.payment_reminder_send', 'flag', 'on', 'founder read of Railway 2026-09-08: PAYMENT_REMINDER_SEND_ENABLED=1 (G3.4 s1 walked, R-40.96)', now(), 'seed'),
  ('flag.referral_alert_send',   'flag', 'on', 'founder read of Railway 2026-09-08: REFERRAL_ALERT_SEND_ENABLED=1 (G5.1 s2 walked)',        now(), 'seed'),
  ('flag.wedding_credit_send',   'flag', 'on', 'founder read of Railway 2026-09-08: WEDDING_CREDIT_SEND_ENABLED=1 (G1.3 walked, set 09-05)', now(), 'seed'),
  ('flag.wedding_consent_send',  'flag', 'on', 'founder read of Railway 2026-09-08: WEDDING_CONSENT_SEND_ENABLED=1',                          now(), 'seed'),
  ('flag.review_ask_send',       'flag', 'on', 'founder read of Railway 2026-09-08; set on purpose (R-41.46)',                                now(), 'seed'),
  ('flag.wedding_reel',          'flag', 'on', 'founder read of Railway 2026-09-08: WEDDING_REEL_ENABLED=1; the reel stays dark while the ffmpeg probe reads absent (F-40.149)', now(), 'seed')
on conflict (key) do nothing;

-- ── 3 · THE SEEDS · TEMPLATES — live Meta status; the sweep's first read replaces `evidence` ──
-- Block 19 names from `src/lib/templates.js` (the defining source, R-40.94), each
-- Active at Meta per its sitting's handover; `tdw_referral_alert` singular per the
-- founder's Manager read 2026-09-08 (ID 1526630866155035). The concierge four are
-- seat B's B1 record (docs/filings/B1_CONCIERGE_TEMPLATES.md at e62ba2a), each
-- Active 09-08 with its Meta ID; `tdw_assist_lead_outside` was filed UTILITY and
-- approved MARKETING (R-41.30 course (a) accepted — the 131049 exposure is named
-- in its evidence). `tdw_capability_armed` is unfiled and seeds `pending`.
--
-- ⚠ A `template.*` ROW CAN BE A GATE IN ITS OWN RIGHT. Seat A's outsider forward
-- reads `cap.on('template.tdw_assist_lead_outside')` directly (assistance.js:384,
-- R-41.20). `approved` here means "Meta yes, the founder not yet": the arm stays
-- dark until his tap moves the row `approved → on` on the admin card. The sweep's
-- disarm (R-41.35) applies to it exactly as to a flag.
insert into public.capabilities (key, kind, status, evidence) values
  ('template.tdw_contract_sign',      'template', 'approved', 'seed: Active per G3.2 s3 handover; the sweep verifies'),
  ('template.tdw_contract_sign_otp',  'template', 'approved', 'seed: Active per G3.2 s3 handover; the sweep verifies'),
  ('template.tdw_contract_copy',      'template', 'approved', 'seed: Active per G3.2 s2 handover; the sweep verifies'),
  ('template.tdw_payment_reminder',   'template', 'approved', 'seed: Active – Quality pending · Utility · ID 1781270206634381 (R-40.71 read 09-06)'),
  ('template.tdw_referral_alert',     'template', 'approved', 'seed: Active – Quality pending · Utility · ID 1526630866155035 (founder read 09-08)'),
  ('template.tdw_wedding_credit',     'template', 'approved', 'seed: Active per G1.3 handover; the sweep verifies'),
  ('template.tdw_wedding_consent',    'template', 'approved', 'seed: Active per G1.2 consent packet; the sweep verifies'),
  ('template.tdw_review_request',     'template', 'approved', 'seed: Active since 2026-08-28 (G2); Marketing category'),
  ('template.tdw_assist_lead_outside','template', 'approved', 'seed: Active – Quality pending · MARKETING (filed UTILITY; R-41.30 course a) · ID 1627376372249131 (B1, 09-08) · 131049 exposure named'),
  ('template.tdw_assist_found_vendor','template', 'approved', 'seed: Active – Quality pending · Utility · ID 3160852754105015 (B1, 09-08)'),
  ('template.tdw_assist_found_outside','template','approved', 'seed: Active – Quality pending · Utility · ID 3115277355330375 (B1, 09-08)'),
  ('template.tdw_introduction',       'template', 'approved', 'seed: Active – Quality pending · MARKETING · ID 1757650692328688 (B1, 09-08); R9 J1, not sent from TDW''s line before R9 (R-41.11 open)'),
  ('template.tdw_capability_armed',   'template', 'pending',  'seed: not yet filed (seat B); the founder notice stays withheld until Active')
on conflict (key) do nothing;

-- ── 4 · THE SEEDS · PERMISSIONS — Meta app review; probes withheld until the IG user id (R-41.39) ──
insert into public.capabilities (key, kind, status, evidence) values
  ('perm.whatsapp_business_pair',              'permission', 'pending', 'seed: submission 1461935125758843, in review since 2026-09-02'),
  ('perm.instagram_business_basic',            'permission', 'pending', 'seed: not filed; Video C owed (seat B B2)'),
  ('perm.instagram_business_manage_messages',  'permission', 'pending', 'seed: not filed; next after the WhatsApp pair'),
  ('perm.instagram_business_manage_insights',  'permission', 'pending', 'seed: not filed'),
  ('perm.instagram_business_content_publish',  'permission', 'pending', 'seed: not filed'),
  ('perm.instagram_business_manage_comments',  'permission', 'pending', 'seed: not filed'),
  ('perm.ads_read',                            'permission', 'pending', 'seed: second Meta app not created'),
  ('perm.business_management',                 'permission', 'pending', 'seed: second Meta app not created')
on conflict (key) do nothing;

-- ── 5 · THE SEEDS · GOOGLE SCOPES — the house grant (0147); token-info verifies ──
insert into public.capabilities (key, kind, status, evidence) values
  ('scope.google.siteverification',    'scope', 'approved', 'seed: granted on the house grant (G3.1 s2); Testing mode — token-info verifies'),
  ('scope.google.webmasters.readonly', 'scope', 'approved', 'seed: granted on the house grant (G3.1 s2); Testing mode — token-info verifies'),
  ('scope.google.business.manage',     'scope', 'pending',  'seed: not requested until the GBP gate (~2026-10-27, G2 s2)')
on conflict (key) do nothing;
