-- docs/sql/G2_FOUNDER_CARD.sql
-- BLOCK 19 · G2 SITTING 1 — THE FOUNDER CARD.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- FIVE STATEMENTS, FIVE SEPARATE PASTES. R-40.31.
-- ═══════════════════════════════════════════════════════════════════════════
-- The Supabase editor renders ONLY THE LAST statement's result set. A file with
-- five SELECTs pasted at once discards four of them and shows one — which would
-- look like a card and be a single answer wearing five labels. Each block below
-- is pasted and run ALONE.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS CARD CAN AND CANNOT WITNESS
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠ THE ASK IS DARK. `REVIEW_ASK_SEND_ENABLED` is unset in every environment, so
-- the nightly job runs, finds its rows, and sends NOTHING. Card 2 will therefore
-- return ZERO ROWS, and that is the feature working, not the walk failing.
--
-- ⚠ THE SEAL IS NOT DARK. It writes from the first night, deliberately — a
-- storefront that only started counting on the day a flag flipped would show
-- every vendor a zero on her first day. Card 3 should have rows.
--
-- ⚠ DEV440 HAS ONE DELIVERED WEDDING AND ITS SEAL IS THEREFORE ABSENT BY RULE.
-- Card 4 is what proves the rule fired rather than the computation failing: a
-- `vendor_seal` ROW EXISTS with `weddings = 1`, and the storefront shows nothing.
-- A missing row and a below-floor row look identical on the page and are
-- completely different facts underneath. This card separates them.
--
-- ⚠ NOTHING HERE IS A HANDSET WITNESS. Card 2 witnesses `reviews_asked` by
-- SELECT, which is what the charter asked for. Whether a message ever reached a
-- phone is not answerable until the flag flips, and this seat claims no part of
-- it. Live witness is DECLARED, never claimed.
--
-- Run AFTER the nightly job has had one night (03:20 IST). Before that, cards 2
-- and 3 answer for a job that has not run, and the honest reading of an empty
-- card 3 is *the sweep has not happened yet*, not *the sweep is broken*.

-- ═══ CARD 1 · THE PLANES EXIST, AND THE ONCE-EVER KEY IS REAL ══════════════
-- The structural witness. `0134` reported "Success. No rows returned", which is
-- the correct verdict for DDL and says nothing about WHAT was created. This says
-- it. The UNIQUE key on `couple_id` is the once-per-couple guarantee itself —
-- not a convention the code follows — so its presence is the single most
-- load-bearing row in this whole card.
--
-- EXPECT: three rows.
--   reviews_asked  reviews_asked_couple_key   UNIQUE  (couple_id)
--   vendor_seal    vendor_seal_pkey           PRIMARY KEY (vendor_id)
--   nudge_optout   nudge_optout_lane_check    CHECK   (… 'couple' …)
-- A missing third row means §3 of the migration did not run and the couple lane
-- is a value the database will refuse.

SELECT c.conrelid::regclass AS table_name,
       c.conname            AS constraint_name,
       c.contype            AS kind,
       pg_get_constraintdef(c.oid) AS definition
  FROM pg_constraint c
 WHERE c.conrelid IN ('public.reviews_asked'::regclass, 'public.vendor_seal'::regclass)
    OR c.conname = 'nudge_optout_lane_check'
 ORDER BY table_name, constraint_name;


-- ═══ CARD 2 · WHAT WAS ASKED — THE DARK WITNESS ════════════════════════════
-- ZERO ROWS IS THE EXPECTED AND CORRECT ANSWER TODAY. The job claims a couple
-- only when it is about to send, and it cannot send: the flag is unset. If this
-- returns rows, either the flag was set or something wrote this table that is
-- not `reviewsNightly.js` — and there is supposed to be exactly one writer.
--
-- `wamid` IS THE HONEST COLUMN HERE. A row with `wamid IS NULL` is an ask that
-- was CLAIMED and never delivered — which is the deliberate shape: the row is
-- written BEFORE the send, so a failed send still burns the once-ever key and
-- that couple is never asked twice. A row with a `wamid` is one Meta accepted.

SELECT r.asked_at,
       r.template,
       (r.wamid IS NOT NULL) AS reached_meta,
       v.business_name       AS vendor,
       w.title               AS wedding,
       u.name                AS couple
  FROM public.reviews_asked r
  LEFT JOIN public.vendors  v ON v.id = r.vendor_id
  LEFT JOIN public.weddings w ON w.id = r.wedding_id
  LEFT JOIN public.couples  c ON c.id = r.couple_id
  LEFT JOIN public.users    u ON u.id = c.user_id
 ORDER BY r.asked_at DESC;


-- ═══ CARD 3 · THE NIGHTLY SWEEP RAN ════════════════════════════════════════
-- `computed_at` IS THE PROOF THE JOB RAN, and it is why the seal is a table
-- rather than a view: a view has no timestamp, so a night the sweep failed and a
-- night it ran and found nothing would look identical.
--
-- EXPECT: one row per ACTIVE vendor, every `computed_at` within the last 24
-- hours. A vendor missing from this list is a vendor the sweep did not reach.
-- `delivery_days IS NULL` is CORRECT for an all-back-catalogue studio and means
-- NOT MEASURABLE, never zero.

SELECT v.business_name,
       v.routing_handle,
       s.weddings,
       s.delivery_days,
       s.computed_at,
       (s.weddings >= 3) AS seal_is_visible
  FROM public.vendor_seal s
  JOIN public.vendors v ON v.id = s.vendor_id
 ORDER BY s.computed_at DESC NULLS LAST;


-- ═══ CARD 4 · DEV440 — THE SEAL IS ABSENT *BY RULE*, NOT BY FAILURE ════════
-- THE ONE CARD THAT SEPARATES TWO IDENTICAL-LOOKING FACTS. On the storefront,
-- "no seal because she has one wedding" and "no seal because nothing ever
-- computed" render exactly the same — nothing. Only this tells them apart.
--
-- EXPECT: one row. `delivered_pages = 1`, `seal_row_exists = true`,
-- `seal_weddings = 1`, `seal_is_visible = false`.
--   · `seal_row_exists = false`  → the sweep never reached her. A real failure.
--   · `seal_is_visible = true`   → the floor is not being applied. Worse.
--
-- `delivered_pages` counts with the SAME THREE CONDITIONS `seal.js` uses —
-- published, consented, delivered — so if it disagrees with `seal_weddings`, the
-- computation and this card are reading different populations and one of them is
-- wrong.

SELECT v.business_name,
       v.routing_handle,
       (SELECT count(*) FROM public.weddings w
         WHERE w.owner_vendor_id = v.id
           AND w.visibility = 'published'
           AND w.couple_consent = true
           AND w.delivered_at IS NOT NULL)      AS delivered_pages,
       (s.vendor_id IS NOT NULL)                AS seal_row_exists,
       s.weddings                               AS seal_weddings,
       s.delivery_days,
       COALESCE(s.weddings, 0) >= 3             AS seal_is_visible
  FROM public.vendors v
  LEFT JOIN public.vendor_seal s ON s.vendor_id = v.id
 WHERE v.routing_handle = 'DEV440';


-- ═══ CARD 5 · THE COUPLE LANE'S OPT-OUT HAS A HOME ═════════════════════════
-- R-G2.7's one home, and today it should be EMPTY — nobody has tapped
-- `Stop messages`, because `tdw_referral_invite` has no caller in the tree
-- (derived by grep, F-40.98's bound). This card is the standing witness for when
-- that changes.
--
-- It also answers the question F-40.98's census could not: from the day the
-- G2 branch shipped, a couple's stop is RECORDED — lane-scoped and reversible,
-- rather than swallowed by the full stop as a terminal cross-line opt-out. Rows
-- with `source = 'inbound_stop_messages'` are the ones this cure produced.

SELECT n.phone,
       n.lane,
       n.state,
       n.source,
       n.updated_at
  FROM public.nudge_optout n
 WHERE n.lane = 'couple'
 ORDER BY n.updated_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT IS STILL OWED AFTER THIS CARD IS READ
-- ═══════════════════════════════════════════════════════════════════════════
-- · THE PAIR REGEN. `docs/db/PUBLIC_SCHEMA.md` describes neither new table and
--   still carries the pre-0134 two-value lane CHECK. Until it runs, `0134` is
--   the sole witness for all three under the SQL-provenance law, and the ladder
--   has since moved to 0136.
-- · A FIXTURE WITH THREE DELIVERED WEDDINGS, or the seal-present case is
--   DECLARED UNWITNESSABLE. Card 4 proves the ABSENCE is by rule; nothing on
--   this estate can currently prove the PRESENT seal renders, because no vendor
--   has three delivered pages. Seeding one is a founder act with
--   provenance-shown SQL and it has not been ruled.
