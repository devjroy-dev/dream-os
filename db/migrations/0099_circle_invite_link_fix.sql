-- 0099_circle_invite_link_fix.sql — TDW_05 Block 05, P4 (F-05.23's cure).
-- FOUNDER-RUN in the Supabase SQL editor. NOT shipped in the deploy ZIP.
-- Project: nvzkbagqxbysoeszxent (public plane).
--
-- APPLIED 2026-07-23, founder-run, COMMITTED BYTE-AS-RUN. Verified by readback
-- from pg_get_functiondef (the LIVE body, not this file): the wa.me link carries
-- 917011788380. F-05.23 closed in production.
--
-- SLOT: 0099 is the next free number ABOVE the standing reservations
-- (0097 = TDW_13, 0098 = TDW_14, both re-homed at CE-59). Chair-ruled at CE-63.
--
-- NOT FOLDED INTO 0086, by ruling: a nudge migration that also rewrites a circle
-- RPC is two migrations wearing one number. Subject purity. Run them in the same
-- editor session; they are independent and order does not matter.
--
-- WHAT THIS IS: a CREATE OR REPLACE of invite_circle_member(), carried
-- BYTE-VERBATIM from its last definition (0023_circle_cleanup.sql:104-170) with
-- EXACTLY ONE executable line changed — the wa.me number — plus the comment
-- block that cites the ruling. The body was EXTRACTED programmatically from the
-- committed migration, not retyped: the diff against 0023 is one line, and that
-- is the point. A replace reconstructed from memory would silently rewrite token
-- generation, collision retry, the member cap and expiry semantics while looking
-- like a link fix.
--
-- NOT TOUCHED: the token alphabet, the 6-char length, the collision loop, the
-- 3-member cap, the 7-day expiry, the return shape, every raise/errcode/hint.
-- claim_circle_invite() is NOT redefined here.
--
-- IMMUTABILITY: 0016 and 0023 are APPLIED and are NOT edited. This is the
-- estate's own correction mechanism used as designed.
--
-- AFTER APPLYING: no schema shape changes, so PUBLIC_SCHEMA.md does not move.
-- The witness covers columns; this is a function body.

create or replace function invite_circle_member(
  p_couple_id    uuid,
  p_invitee_name text,
  p_role         text
) returns table(id uuid, invite_token text, wa_me_link text) as $$
declare
  v_alphabet    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_token       text;
  v_collision   boolean;
  v_existing    int;
  v_member_cap  int := 3;
  v_member_id   uuid;
  v_expires_at  timestamptz;
begin
  -- Validate role
  if p_role not in ('partner', 'family', 'inner_circle') then
    raise exception 'role must be partner / family / inner_circle'
      using errcode = 'P0001', hint = 'invalid_circle_role';
  end if;

  -- Validate couple
  if not exists (select 1 from couples where couples.id = p_couple_id) then
    raise exception 'couple % not found', p_couple_id
      using errcode = 'P0001', hint = 'couple_not_found';
  end if;

  -- Enforce member cap (pending + active count)
  select count(*) into v_existing
    from circle_members
   where couple_id = p_couple_id
     and status in ('pending', 'active');

  if v_existing >= v_member_cap then
    raise exception 'circle member cap reached for couple %', p_couple_id
      using errcode = 'P0001', hint = 'circle_member_limit_reached';
  end if;

  -- Generate unique token (loop on collision)
  loop
    v_token := 'CIRCLE-' ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * 32)::int, 1);

    select exists(select 1 from circle_members cm where cm.invite_token = v_token)
      into v_collision;
    exit when not v_collision;
  end loop;

  -- 7-day expiry
  v_expires_at := now() + interval '7 days';

  -- Insert pending row
  insert into circle_members (couple_id, invitee_name, role, invite_token, status, expires_at)
  values (p_couple_id, p_invitee_name, p_role, v_token, 'pending', v_expires_at)
  returning circle_members.id into v_member_id;

  -- Return shape
  id := v_member_id;
  invite_token := v_token;
  -- ── THE CURE (F-05.23, TDW_05 P4, CE-63) ────────────────────────────────
  -- This line read `wa.me/14787788550` from 0016 through 0023 and was never
  -- redefined again: every circle invite this function has ever minted carried
  -- the DEAD Twilio sandbox number. It is not cosmetic — brideEngine.js:1761
  -- returns this value verbatim and the sanctuary page renders it, so a bride
  -- asking Mira to add her mother received a link to a number that does not
  -- answer. THE NUMBER IS HARDCODED BY NECESSITY: SQL cannot read
  -- src/lib/waNumbers.js. It is the same constant under the same authority —
  -- the founder's canonical bride number, ruled at CE-62 and re-confirmed at
  -- CE-63. One constant, two homes, and both homes say so.
  wa_me_link := 'https://wa.me/917011788380?text=' || v_token;
  return next;
end;
$$ language plpgsql;

-- ── REVERT ──────────────────────────────────────────────────────────────────
-- There is no revert for this migration, and that is deliberate: reverting means
-- restoring a live dead link. If it must be undone, re-run 0023's definition of
-- invite_circle_member() from the committed file.
