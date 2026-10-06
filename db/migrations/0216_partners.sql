-- db/migrations/0216_partners.sql · CE-47 · PTN-A1 · partners as their own kind (the design note, accepted 6 Oct 2026).
-- 0216 is PTN's (the chair's range 0216-0219). Five tables: partner_orgs, partner_members, partner_reports,
-- partner_contacts, partner_connections. Every table: RLS on and service_role's four grants in this same transaction
-- (A-45.8, e-273). No column records or shows a partner's own prices (rule L). A partner is never a vendors or couples row.
BEGIN;

CREATE TABLE IF NOT EXISTS public.partner_orgs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  kind                  text        NOT NULL CHECK (kind IN ('talent_agency','model_agency','fashion_house','studio','brand','wedding_planner','other')),
  instagram_handle      text        NOT NULL CHECK (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  website               text        NULL CHECK (website IS NULL OR website ~* '^https?://[^\s/$.?#][^\s]*$'),
  cities                text[]      NOT NULL DEFAULT '{}',
  roles                 text[]      NOT NULL DEFAULT '{}',
  pay_rule              text        NOT NULL DEFAULT 'paid_and_credit' CHECK (pay_rule IN ('paid_only','paid_and_credit')),
  wants                 text[]      NOT NULL DEFAULT '{}' CHECK (wants <@ ARRAY['calls','briefs','requirements']::text[]),
  calls_email           text        NULL CHECK (calls_email IS NULL OR calls_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  whatsapp_opt          boolean     NOT NULL DEFAULT false,
  whatsapp_phone        text        NULL,
  daily_cap             integer     NOT NULL DEFAULT 10 CHECK (daily_cap BETWEEN 1 AND 50),
  send_state            text        NOT NULL DEFAULT 'active' CHECK (send_state IN ('active','paused','stopped')),
  paused_until          timestamptz NULL,
  check_state           text        NOT NULL DEFAULT 'unchecked' CHECK (check_state IN ('unchecked','checked','blocked')),
  checked_how           text        NULL CHECK (checked_how IS NULL OR checked_how IN ('admin','instagram_tick')),
  checked_at            timestamptz NULL,
  checked_by            text        NULL,
  blocked_at            timestamptz NULL,
  blocked_reason        text        NULL,
  ig_user_id            text        NULL,
  ig_username_proved    text        NULL,
  ig_proved_at          timestamptz NULL,
  ig_verified_seen      boolean     NULL,
  ig_verified_read_at   timestamptz NULL,
  plan_state            text        NOT NULL DEFAULT 'free' CHECK (plan_state IN ('free','active','lapsed','exempt')),
  exempt_by             text        NULL,
  razorpay_subscription_id text     NULL,
  legal_name            text        NULL,
  gstin                 text        NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_orgs_handle_uq ON public.partner_orgs (lower(instagram_handle));
CREATE INDEX IF NOT EXISTS partner_orgs_check_idx ON public.partner_orgs (check_state, created_at DESC);
ALTER TABLE public.partner_orgs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_orgs TO service_role;

CREATE TABLE IF NOT EXISTS public.partner_members (
  partner_id  uuid        NOT NULL REFERENCES public.partner_orgs(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  added_by    uuid        NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (partner_id, user_id)
);
CREATE INDEX IF NOT EXISTS partner_members_user_idx ON public.partner_members (user_id);
ALTER TABLE public.partner_members ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_members TO service_role;

CREATE TABLE IF NOT EXISTS public.partner_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  uuid        NOT NULL REFERENCES public.partner_orgs(id) ON DELETE CASCADE,
  item_kind   text        NOT NULL CHECK (item_kind IN ('partner','call_answer','brief','requirement')),
  item_id     uuid        NULL,
  vendor_id   uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  reason      text        NOT NULL CHECK (reason IN ('fake','asked_for_money','unsafe_or_rude','other')),
  note        text        NULL CHECK (note IS NULL OR char_length(note) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now(),
  handled_at  timestamptz NULL,
  handled_by  text        NULL
);
CREATE INDEX IF NOT EXISTS partner_reports_partner_idx ON public.partner_reports (partner_id, created_at DESC);
ALTER TABLE public.partner_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_reports TO service_role;

CREATE TABLE IF NOT EXISTS public.partner_contacts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  kind             text        NOT NULL CHECK (kind IN ('agency','fashion_house','brand','studio','planner','stylist','model','influencer','other')),
  instagram_handle text        NULL CHECK (instagram_handle IS NULL OR instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  website          text        NULL CHECK (website IS NULL OR website ~* '^https?://[^\s/$.?#][^\s]*$'),
  phone            text        NULL CHECK (phone IS NULL OR phone ~ '^\+[0-9]{8,15}$'),
  how_we_know      text        NOT NULL CHECK (char_length(btrim(how_we_know)) BETWEEN 1 AND 300),
  knows_tdw        boolean     NOT NULL DEFAULT false,
  added_by         text        NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_contacts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_contacts TO service_role;

-- A connection is contact details exchanged (a Pick, or a vendor's first Contact on a call the partner answered).
-- A1 COUNTS them and never charges (the chair, 6 Oct 2026).
CREATE TABLE IF NOT EXISTS public.partner_connections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  uuid        NOT NULL REFERENCES public.partner_orgs(id) ON DELETE CASCADE,
  kind        text        NOT NULL CHECK (kind IN ('pick','contact')),
  ref_id      uuid        NOT NULL,
  vendor_id   uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  n           integer     NOT NULL CHECK (n >= 1),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, ref_id)
);
ALTER TABLE public.partner_connections ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_connections TO service_role;

COMMIT;
-- ROLLBACK (by hand only): BEGIN; DROP TABLE public.partner_connections, public.partner_contacts, public.partner_reports,
--   public.partner_members, public.partner_orgs; COMMIT;
