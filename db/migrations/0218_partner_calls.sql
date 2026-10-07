-- db/migrations/0218_partner_calls.sql · CE-47 · PTN-A2-1 · calls sent to partners, and what they suggest.
-- 0218 is PTN's (the chair, 7 Oct 2026); it lands below 0220, recorded in OUT_OF_ORDER.json by WEB-4.
--   partner_sends   one row per partner per call per channel; only the link token's sha256 is stored.
--   partner_answers each person a partner suggests: name, role and an optional profile link. NO phone or email column,
--                   by construction (rule J); the name refuses an @ or a run of ten digits.
--   collab_interest.partner_id gains its foreign key to partner_orgs (CLB-2a's 0197 left it for PTN), ON DELETE NO ACTION:
--   0197's collab_interest_partner_shape CHECK needs partner_id on every partner row, so SET NULL could never succeed. A
--   partner whose people sit on a call is BLOCKED (A1), never deleted; a connection already made stays (the founder, 7 Oct).
-- RLS on and service_role's four grants in this same transaction (A-45.8, e-273).
BEGIN;

CREATE TABLE IF NOT EXISTS public.partner_sends (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    uuid        NOT NULL REFERENCES public.partner_orgs(id) ON DELETE CASCADE,
  post_id       uuid        NOT NULL REFERENCES public.collab_posts(id) ON DELETE CASCADE,
  channel       text        NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp')),
  state         text        NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'sent', 'held_cap', 'held_window', 'held_paused',
                              'held_no_key', 'failed', 'closed')),
  not_before    timestamptz NOT NULL DEFAULT now(),
  token_hash    text        NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  why           text        NULL CHECK (why IS NULL OR char_length(why) <= 300),
  provider_ref  text        NULL,
  attempts      integer     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  sent_at       timestamptz NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, post_id, channel)
);
CREATE INDEX IF NOT EXISTS partner_sends_due_idx ON public.partner_sends (state, not_before);
CREATE INDEX IF NOT EXISTS partner_sends_partner_idx ON public.partner_sends (partner_id, created_at DESC);
ALTER TABLE public.partner_sends ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_sends TO service_role;

CREATE TABLE IF NOT EXISTS public.partner_answers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id      uuid        NOT NULL REFERENCES public.partner_sends(id) ON DELETE CASCADE,
  interest_id  uuid        NULL REFERENCES public.collab_interest(id) ON DELETE SET NULL,
  talent_name  text        NOT NULL CHECK (char_length(btrim(talent_name)) BETWEEN 1 AND 120 AND talent_name !~ '@' AND talent_name !~ '[0-9]{10,}'),
  talent_role  text        NULL CHECK (talent_role IS NULL OR char_length(talent_role) <= 40),
  talent_link  text        NULL CHECK (talent_link IS NULL OR talent_link ~* '^https?://[^\s/$.?#][^\s]*$'),
  agreed       boolean     NOT NULL CHECK (agreed = true),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_answers_send_idx ON public.partner_answers (send_id);
ALTER TABLE public.partner_answers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_answers TO service_role;

ALTER TABLE public.collab_interest DROP CONSTRAINT IF EXISTS collab_interest_partner_fk;
ALTER TABLE public.collab_interest ADD CONSTRAINT collab_interest_partner_fk
  FOREIGN KEY (partner_id) REFERENCES public.partner_orgs(id) ON DELETE NO ACTION NOT VALID;
ALTER TABLE public.collab_interest VALIDATE CONSTRAINT collab_interest_partner_fk;

COMMIT;
-- ROLLBACK (by hand only): BEGIN; ALTER TABLE public.collab_interest DROP CONSTRAINT IF EXISTS collab_interest_partner_fk;
--   DROP TABLE public.partner_answers, public.partner_sends; COMMIT;
