-- docs/sql/F40_98_stop_messages_census.sql
-- F-40.98 · WHO WAS RECORDED AS A TERMINAL OPT-OUT BY THE `Stop messages` BUTTON
--
-- ONE STATEMENT. R-40.31: the Supabase editor renders only the LAST statement's
-- result set, so a file with two SELECTs silently discards the first. This has
-- one, and it answers the whole question.
--
-- ═══ WHAT HAPPENED, SO THE ROWS CAN BE READ ════════════════════════════════
-- `tdw_referral_invite` (ledger B2, approved 2026-08-28) carries a CUSTOM QUICK
-- REPLY titled `Stop messages`. Meta forwards a tap on it to our webhook AS AN
-- INBOUND TEXT MESSAGE whose body is the button's own title, and does nothing
-- else — no suppression, no state (F-19.08).
--
-- On the bride lane that message met `matchFullStopWord`, which reads the FIRST
-- TOKEN ONLY. `Stop messages` is `STOP` to it. So a couple who asked to stop
-- receiving THAT KIND OF MESSAGE was recorded as a FULL STOP: terminal, and
-- CROSS-LINE by design — `prospects.state='opted_out'` is keyed on the phone
-- alone and `sendWa` refuses every subsequent send to that number on EVERY line.
-- Her own vendor's enquiry replies to her stopped too.
--
-- G2 cures the ordering forward. This SELECT is the backward half: it names who,
-- if anyone, is already carrying the wrong state.
--
-- ═══ SQL-PROVENANCE, per R-40.27 ═══════════════════════════════════════════
-- Read at docs/db/PUBLIC_SCHEMA.md, snapshot 2026-09-05. ⚠ THE SNAPSHOT'S TIP IS
-- `0132` AND THE LADDER NOW HOLDS `0133`, so this document is STALE for any table
-- 0133 touched. 0133 touches `leads` and `weddings`; NEITHER is read below.
--
--   public.prospects   columns :871 — phone (2), state (8), updated_at (14)
--                      constraints, read past the cite and quoted verbatim:
--                        [CHECK] prospects_state_check CHECK ((state = ANY (ARRAY[
--                          'cold','templated','replied','in_session','converted',
--                          'opted_out','expired','discarded'])))
--                      'opted_out' is a legal value and is the terminal one
--                      `recordFullStop` writes. The filter below can therefore
--                      never match a state the table cannot hold.
--   public.messages    columns :707 — conversation_id (2), direction (3), body (5)
--                      ⚠ THERE IS NO CHECK ON `direction`. The addendum carries
--                      only `messages_cost_inr_check` for this table, so the
--                      vocabulary is the WRITER's, not the schema's — derived by
--                      command over the estate's insert sites, which write
--                      exactly 'inbound' and 'outbound'. Named because a filter
--                      on an unconstrained column is only as true as its writer.
--   public.conversations columns :252 — id (1), counterparty_phone (4)
--   public.couples     columns :364 — id (1), user_id (2)
--   public.users       columns :1007 — id (1), phone (2), name (3)
--
-- ═══ IT IS READ-ONLY, AND THAT IS DELIBERATE ═══════════════════════════════
-- No UPDATE is proposed. Reversing a `prospects.state` is a decision about a real
-- person's consent, and it is the founder's and the chair's — not a seat's, and
-- not a side effect of a census. If the rows come back non-empty, the cure is
-- ruled first and shipped as its own statement.

SELECT
  p.phone,
  p.state                                   AS prospect_state,
  p.updated_at                              AS opted_out_at,
  u.name                                    AS couple_name,
  (c.id IS NOT NULL)                        AS is_registered_couple,
  -- The evidence, and it is what distinguishes a BUTTON TAP from a typed STOP.
  -- A couple who typed `STOP` meant the terminal thing and her row is correct.
  -- Only a row whose inbound body is the button's own title is a misfiling.
  (
    SELECT count(*)
      FROM public.messages m
     WHERE m.direction = 'inbound'
       AND upper(regexp_replace(coalesce(m.body, ''), '[^a-zA-Z ]', '', 'g')) ~ '^ *STOP +MESSAGES *$'
       AND m.conversation_id IN (
             SELECT cv.id FROM public.conversations cv
              WHERE cv.counterparty_phone = p.phone
           )
  )                                         AS stop_messages_taps,
  -- The contrast row. A phone with BOTH a tap and a bare STOP is ambiguous and
  -- must be read by a human, not resolved by arithmetic.
  (
    SELECT count(*)
      FROM public.messages m
     WHERE m.direction = 'inbound'
       AND upper(regexp_replace(coalesce(m.body, ''), '[^a-zA-Z ]', '', 'g')) ~ '^ *STOP *$'
       AND m.conversation_id IN (
             SELECT cv.id FROM public.conversations cv
              WHERE cv.counterparty_phone = p.phone
           )
  )                                         AS bare_stop_messages
FROM public.prospects p
LEFT JOIN public.users   u ON u.phone = p.phone
LEFT JOIN public.couples c ON c.user_id = u.id
WHERE p.state = 'opted_out'
ORDER BY p.updated_at DESC NULLS LAST;

-- HOW TO READ THE RESULT
--   stop_messages_taps > 0 AND bare_stop_messages = 0
--       → MISFILED. She asked to stop one kind of message and was silenced on
--         every line. These are the rows a cure would address.
--   bare_stop_messages > 0
--       → CORRECT. She typed the estate's terminal word. Leave it alone.
--   both zero
--       → an opt-out from some other path (admin, the marketing lane's own STOP).
--         Not this finding's.
--
-- ZERO ROWS IS THE EXPECTED AND WELCOME OUTCOME: `tdw_referral_invite` has no
-- caller in the tree, so the button may never have been rendered to anybody. The
-- census is how that becomes a fact instead of a hope.
