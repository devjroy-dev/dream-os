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
-- ── AMENDED 2026-09-07 UNDER R-40.49 · TWO DEFECTS, BOTH THE SEAT'S ────────
-- ① THE `WHERE` ASKED ABOUT ONE OF §3's TWO `ALTER`s. It named the lane CHECK
--   and not the source CHECK, because this card was authored from §3's HEADING
--   rather than from its statements. The `Stop messages` handler writes
--   `source = 'inbound_stop_messages'`; had that second ALTER not applied, EVERY
--   couple-stop write would have thrown while this card showed a clean green —
--   and the founder would have had no reason to ask for the missing half. It was
--   closed on 2026-09-05 by a follow-up statement, which is exactly the rescue
--   a card exists to make unnecessary.
-- ② THE EXPECT SAID "three rows" AND THE QUERY RETURNS TEN. Three was a count of
--   things-worth-checking dressed as a row count, so a CORRECT GREEN read as a
--   failure. An EXPECT names what must be PRESENT, never how many rows arrive —
--   a count is a fact about the query's shape, and the reader is checking a fact
--   about the database.
--
-- R-40.49 was promoted out of this defect and lives in protocol §13's amendment
-- register. It is cited here, not restated: one home for one law.
--
-- EXPECT: these NAMED constraints, all present. ROW COUNT IS NOT THE TEST.
--   reviews_asked  reviews_asked_couple_key      UNIQUE (couple_id)
--                  ↑ THE ONCE-EVER GUARANTEE ITSELF. Not a convention the code
--                    follows — the database refusing a second ask.
--   reviews_asked  reviews_asked_pkey            PRIMARY KEY (id)
--   reviews_asked  reviews_asked_couple_id_fkey  FK couples(id)   ON DELETE CASCADE
--   reviews_asked  reviews_asked_wedding_id_fkey FK weddings(id)  ON DELETE SET NULL
--   reviews_asked  reviews_asked_vendor_id_fkey  FK vendors(id)   ON DELETE SET NULL
--                  ↑ SET NULL AND NOT CASCADE, DELIBERATELY: a deleted page must
--                    never delete the evidence that we already wrote to that
--                    couple, because that evidence IS the once-ever guarantee.
--                    The row outlives the page on purpose.
--   vendor_seal    vendor_seal_pkey              PRIMARY KEY (vendor_id)
--   vendor_seal    vendor_seal_days_nonneg       CHECK (delivery_days IS NULL OR >= 0)
--                  ↑ NULL is admitted as "not measurable"; negatives cannot land.
--   vendor_seal    vendor_seal_weddings_nonneg   CHECK (weddings >= 0)
--   vendor_seal    vendor_seal_vendor_id_fkey    FK vendors(id)   ON DELETE CASCADE
--   nudge_optout   nudge_optout_lane_check       CHECK (… 'couple' …)
--   nudge_optout   nudge_optout_source_check     CHECK (… 'inbound_stop_messages' …)
--
-- ⚠ THE LAST TWO MUST BOTH BE PRESENT. The lane CHECK alone proves §3 STARTED.
-- Only the source CHECK proves it FINISHED — and a half-applied §3 throws on
-- every couple-stop write while looking, from the lane CHECK alone, entirely fine.

SELECT c.conrelid::regclass AS table_name,
       c.conname            AS constraint_name,
       c.contype            AS kind,
       pg_get_constraintdef(c.oid) AS definition
  FROM pg_constraint c
 WHERE c.conrelid IN ('public.reviews_asked'::regclass, 'public.vendor_seal'::regclass)
    OR c.conname IN ('nudge_optout_lane_check', 'nudge_optout_source_check')
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
-- · THE PAIR REGEN IS DISCHARGED, and this card's provenance now cites the
--   SNAPSHOT rather than the migration. Read at `docs/db/PUBLIC_SCHEMA.md`,
--   regen `5b3f61f`, 79 tables, **applied ladder tip `0138`**:
--     public.reviews_asked  :938  ·  7 columns  (couple_id 2, wedding_id 3,
--                                  vendor_id 4, asked_at 5, template 6, wamid 7)
--     public.vendor_seal    :1177 ·  4 columns  (vendor_id 1, weddings 2,
--                                  delivery_days 3, computed_at 4)
--     nudge_optout's lane CHECK carries `'couple'::text` in the addendum.
--   ⚠ STALENESS ARITHMETIC RUN, AND IT MATTERS HERE: `db/migrations/` now holds
--   files through `0145`, SEVEN past the snapshot's tip. This document is
--   therefore STALE for anything `0139`–`0145` touched — and NOT for the two
--   tables above, which `0134` created well below the tip. A second regen is
--   owed at the next seam and is the chair's, not this card's.
-- · A FIXTURE WITH THREE DELIVERED WEDDINGS, or the seal-present case is
--   DECLARED UNWITNESSABLE. Card 4 proves the ABSENCE is by rule; nothing on
--   this estate can currently prove the PRESENT seal renders, because no vendor
--   has three delivered pages. Seeding one is a founder act with
--   provenance-shown SQL and it has not been ruled.
