-- db/migrations/0219_partner_send_log.sql · CE-47 · PTN-A2-1c · THE HISTORY OF A SEND, AND THE FOLD FOR A2-3.
-- Ordered by the chair, 8 Oct 2026. PTN's number (0216 to 0219 are PTN's). Additive, one transaction:
--   1. partner_send_log: append-only. One line each time the drain moves a send's state or reason, and one line for
--      each "Try again" (written in the SAME statement as the guarded UPDATE, by partner_send_revive below). A line is
--      never changed (a trigger refuses UPDATE). DELETE is left to the cascade from partner_sends (a call that is
--      deleted takes its sends and their lines with it); nothing in the estate deletes a line by itself.
--   2. partner_send_revive(id, by, note): the revive as ONE statement: UPDATE partner_sends ... WHERE id = $1 AND
--      state = 'failed', and its log line from the same RETURNING. Two presses at once still make one queued row and
--      one line. Schema-qualified, no search_path set, SECURITY INVOKER, callable by service_role only (0211's form).
--   3. THE FOLD (the chair, 8 Oct 2026), unused until PTN-A2-3: partner_orgs.whatsapp_opt_at and whatsapp_opt_words
--      (when, and in which words, a partner said yes to calls on WhatsApp), and the three template rows on the
--      switchboard, born 'pending' with auto_on false, as 0192 seeds rows.
-- RLS on the new table and the four grants to service_role in this transaction (e-273). No other table is altered
-- except the two nullable columns on partner_orgs.
BEGIN;

CREATE TABLE IF NOT EXISTS public.partner_send_log (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id   uuid        NOT NULL REFERENCES public.partner_sends(id) ON DELETE CASCADE,
  at        timestamptz NOT NULL DEFAULT now(),
  kind      text        NOT NULL CHECK (kind IN ('drain', 'retried', 'lane_changed')),
  state     text        NOT NULL CHECK (state IN ('queued', 'sent', 'held_cap', 'held_window', 'held_paused',
                          'held_no_key', 'failed', 'closed')),
  channel   text        NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  attempts  integer     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  why       text        NULL CHECK (why IS NULL OR char_length(why) <= 300),
  by_whom   text        NULL CHECK (by_whom IS NULL OR char_length(by_whom) <= 120)
);
CREATE INDEX IF NOT EXISTS partner_send_log_send_idx ON public.partner_send_log (send_id, at DESC);
ALTER TABLE public.partner_send_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_send_log TO service_role;

CREATE OR REPLACE FUNCTION public.partner_send_log_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'partner_send_log is append-only: a line is never changed';
END;
$$;
DROP TRIGGER IF EXISTS partner_send_log_no_update ON public.partner_send_log;
CREATE TRIGGER partner_send_log_no_update BEFORE UPDATE ON public.partner_send_log
  FOR EACH ROW EXECUTE FUNCTION public.partner_send_log_append_only();
REVOKE ALL ON FUNCTION public.partner_send_log_append_only() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.partner_send_revive(p_send uuid, p_by text, p_note text)
RETURNS uuid
LANGUAGE sql
AS $$
  WITH moved AS (
    UPDATE public.partner_sends
       SET state = 'queued', attempts = 0, not_before = now(), why = left(p_note, 300), updated_at = now()
     WHERE id = p_send AND state = 'failed'
    RETURNING id, state, channel, attempts, why
  )
  INSERT INTO public.partner_send_log (send_id, kind, state, channel, attempts, why, by_whom)
  SELECT moved.id, 'retried', moved.state, moved.channel, moved.attempts, moved.why, left(p_by, 120) FROM moved
  RETURNING send_id;
$$;
REVOKE ALL ON FUNCTION public.partner_send_revive(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_send_revive(uuid, text, text) TO service_role;

ALTER TABLE public.partner_orgs ADD COLUMN IF NOT EXISTS whatsapp_opt_at timestamptz NULL;
ALTER TABLE public.partner_orgs ADD COLUMN IF NOT EXISTS whatsapp_opt_words text NULL
  CHECK (whatsapp_opt_words IS NULL OR char_length(whatsapp_opt_words) <= 300);

INSERT INTO public.capabilities (key, kind, status, evidence) VALUES
  ('template.tdw_partner_call',   'template', 'pending', 'seed: PTN-A2-1c; filed by the founder in WhatsApp Manager; the sweep and Meta''s status events read it'),
  ('template.tdw_partner_picked', 'template', 'pending', 'seed: PTN-A2-1c; filed by the founder in WhatsApp Manager; the sweep and Meta''s status events read it'),
  ('template.tdw_collab_request_sent', 'template', 'pending', 'seed: PTN-A2-1c; filed by the founder in WhatsApp Manager; the sweep and Meta''s status events read it')
ON CONFLICT (key) DO NOTHING;

COMMIT;
-- ROLLBACK (by hand only): BEGIN; DELETE FROM public.capabilities WHERE key IN ('template.tdw_partner_call',
--   'template.tdw_partner_picked','template.tdw_collab_request_sent'); ALTER TABLE public.partner_orgs DROP COLUMN IF EXISTS
--   whatsapp_opt_words, DROP COLUMN IF EXISTS whatsapp_opt_at; DROP FUNCTION IF EXISTS public.partner_send_revive(uuid,
--   text, text); DROP TABLE IF EXISTS public.partner_send_log; DROP FUNCTION IF EXISTS
--   public.partner_send_log_append_only(); COMMIT;
