-- db/migrations/0217_forward_requests.sql · CE-47 · PTN-A1 · "Forward a request" (admin, by hand), the part A1 needs.
-- A request is a vendor's need the admin forwards to people TDW knows. "She asked for this" is required (asked = true).
-- One link per recipient per request; only the token's sha256 is stored. RLS and grants in this transaction (e-273).
-- A2 adds partner_sends and partner_answers to its own migration file.
BEGIN;

CREATE TABLE IF NOT EXISTS public.forward_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid        NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  outside_handle  text        NULL CHECK (outside_handle IS NULL OR outside_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  outside_phone   text        NULL CHECK (outside_phone IS NULL OR outside_phone ~ '^\+[0-9]{8,15}$'),
  role            text        NOT NULL CHECK (char_length(btrim(role)) BETWEEN 1 AND 40),
  city            text        NOT NULL CHECK (char_length(btrim(city)) BETWEEN 1 AND 60),
  event_date      date        NOT NULL,
  budget_from     integer     NOT NULL CHECK (budget_from >= 0),
  budget_to       integer     NOT NULL CHECK (budget_to >= budget_from),
  pay_kind        text        NOT NULL CHECK (pay_kind IN ('paid','credit_only')),
  note            text        NULL CHECK (note IS NULL OR char_length(note) <= 300),
  asked           boolean     NOT NULL CHECK (asked = true),
  post_id         uuid        NULL,
  created_by      text        NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (vendor_id IS NOT NULL OR (outside_handle IS NOT NULL AND outside_phone IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS forward_requests_created_idx ON public.forward_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS forward_requests_outside_phone_idx ON public.forward_requests (outside_phone) WHERE outside_phone IS NOT NULL;
ALTER TABLE public.forward_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forward_requests TO service_role;

CREATE TABLE IF NOT EXISTS public.forward_recipients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid        NOT NULL REFERENCES public.forward_requests(id) ON DELETE CASCADE,
  contact_id  uuid        NOT NULL REFERENCES public.partner_contacts(id) ON DELETE CASCADE,
  token_hash  text        NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  channel     text        NOT NULL DEFAULT 'hand' CHECK (channel IN ('hand','whatsapp')),
  sent_at     timestamptz NULL,
  sent_by     text        NULL,
  replied_at  timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, contact_id)
);
ALTER TABLE public.forward_recipients ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forward_recipients TO service_role;

COMMIT;
-- ROLLBACK (by hand only): BEGIN; DROP TABLE public.forward_recipients, public.forward_requests; COMMIT;
