-- db/migrations/0191_website_enquiry.sql
-- TDW · CE-47 · WEB-4 cut 7 · THE WEBSITE'S ENQUIRY AND CHAT (WEB-7's contract, through the chair, 1 October 2026).
-- Number derived at origin at the cut (main 8f2cd0d; 0186 reserved by the chair for G6-6).
-- WHAT (additive; nothing dropped; no existing row changed):
--   leads.consent_at (timestamptz) and leads.consent_text_version (text, 32 at most): when a visitor agreed to the line
--     above Send, and which version of it (today "enq-2026-09-30"). Null on every lead not from the website.
--   CREATES public.website_chat_tokens: the chat token door 1 hands the panel. Only its sha256 is kept, bound to the vendor,
--     the visitor's phone and the thread, with the page they wrote from; it expires 24 hours after it is made. RLS on;
--     the four privileges to service_role (A-45.8); 0170's defaults keep anon and authenticated off.
--   SEEDS two switchboard rows, both 'off' (the 0177 shape): flag.website_chat (both doors open only when it is on, or
--     armed for the walk vendor) and flag.website_eliza (Eliza answers the chat only when it is on, or armed for the walk
--     vendor; otherwise the chat is held for her). The founder flips them on the switchboard.
-- Witnesses: public.leads (PUBLIC_SCHEMA.md, 29 columns; no consent column); public.capabilities (0171's CHECKs: kind
--   'flag'; status 'off'); public.conversations and public.vendors (PUBLIC_SCHEMA.md).
-- REVERT (by hand, with a witness; never run as part of this file):
--   DELETE FROM public.capabilities WHERE key IN ('flag.website_chat', 'flag.website_eliza');
--   DROP TABLE IF EXISTS public.website_chat_tokens;
--   ALTER TABLE public.leads DROP COLUMN IF EXISTS consent_at, DROP COLUMN IF EXISTS consent_text_version;

BEGIN;

ALTER TABLE public.leads
  ADD COLUMN consent_at           timestamptz,
  ADD COLUMN consent_text_version text CHECK (consent_text_version IS NULL OR char_length(consent_text_version) BETWEEN 1 AND 32);

CREATE TABLE public.website_chat_tokens (
  token_hash      text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  vendor_id       uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  phone           text NOT NULL CHECK (phone ~ '^\+[0-9]{8,16}$'),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  page_title      text CHECK (page_title IS NULL OR char_length(page_title) <= 80),
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX website_chat_tokens_expires_idx ON public.website_chat_tokens (expires_at);
ALTER TABLE public.website_chat_tokens ENABLE ROW LEVEL SECURITY;

INSERT INTO public.capabilities (key, kind, status) VALUES
  ('flag.website_chat', 'flag', 'off'),
  ('flag.website_eliza', 'flag', 'off');

-- ── A-45.8 ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_chat_tokens TO service_role;

COMMIT;
