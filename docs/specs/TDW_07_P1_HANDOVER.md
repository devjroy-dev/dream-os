# TDW_07 P1 — EXECUTOR HANDOVER
**Block 07 (DISCOVER) · P1: real supply live + ranking + IG chips + the paused predicate, with the sitting-one template rider.**
**Session role:** EXECUTOR (Opus-5 LE) · **Base:** `dream-os fea5e4d` · `dreamos-pwa 19b2580` (both re-derived fetch-first from fresh clones at sitting open; trees clean, no predecessor residue).
**Authority:** the fifteenth chair's opening kickoff → READ-FIRST PART ONE → the CE ruling (§A–§E) → the founder's three words 「 1. the first one 2. yes 3. ok 」.

> This document rides the ZIP. It is not a CE-numbered entry and it touches neither `FINDINGS_LOG.md` nor the masterplan (the clobber law).

---

## 1 · WHAT SHIPPED

### dream-os (9 files)

| File | State | What |
|---|---|---|
| `db/migrations/0101_profile_controls.sql` | NEW | Two columns + the partial index + the three weight seeds. Also travels as the founder's paste block (§7's sole exception). |
| `src/lib/discover/ranking.js` | NEW | D-5's formula. Pure math + the 60s-cached `admin_config` read. |
| `src/lib/vendor/profileScore.js` | NEW | The completeness score — **the one home**, born at P1 because ranking is its first consumer; P2 extends this file. |
| `src/lib/vendor/discover.js` | MODIFIED (1 line) | `MIN_PORTFOLIO_IMAGES` added to the export object. Zero behaviour change. |
| `src/api/couple/discover.js` | MODIFIED | Ranking, the paused predicate, IG handles, FEATURED marking, D-1's rate toggle. |
| `src/lib/templates.js` | MODIFIED | `demo_lead_alert` registered. |
| `docs/TEMPLATES.md` | MODIFIED | §2's new body + provenance; §3's tracker row. |
| `scripts/b07_p1_bench.js` | NEW | The P1 floor, 72 cells. |
| `docs/specs/TDW_07_P1_HANDOVER.md` | NEW | This file. |

### dreamos-pwa (5 files)

| File | State | What |
|---|---|---|
| `lib/frost/igLink.ts` | NEW | D-3's deep-link mechanics, one home, RN-portable. |
| `lib/types/discover.ts` | MODIFIED | `is_demo` · `instagram_handle` · `featured`, all optional. **F-07.3 cured.** |
| `app/admin/config/page.tsx` | MODIFIED | The `Discover ranking` group — smoke ④'s thumb-path. |
| `app/(frost)/frost/canvas/discover/page.tsx` | MODIFIED | The IG chip + FEATURED eyebrow. **Render only.** |
| `scripts/tdw07_p1_discover.proof.mjs` | NEW | The pwa half's floor, 35 cells. |

**Not touched, by ruling:** `src/api/demo/vendor.js` and the `/api/v2/demo/discover` endpoint (one live consumer, spec-protected) · the canvas page's unreachable demo branch (F-07.1, minimum-diff on a gesture file) · every soul/lens/loop/engine file (W-1) · the interceptor, the tripwire and the vendor-engine wire.

---

## 2 · THE FOUR PART-TWO DERIVATIONS

**(a) The freshness census — A CARRIER EXISTS; the term is WIRED, not zeroed.**
- `public.vendors` carries no `last_active` / `last_seen` / `last_login`. The spec's field name has no home.
- `vendors.updated_at` exists and is **not** a recency signal: 29 `from('vendors').update(...)` sites, **none** sets it, no trigger in the ladder. Ranking on it would sort by signup date wearing the word "active".
- **`public.vendor_activity_log` is the honest carrier and it is live.** Columns 2 `vendor_id` / 8 `created_at`; written by `src/lib/vendor/snapshot.js`'s fail-safe `logActivity` from **24 call sites** across both surfaces (`surface` is `'whatsapp' | 'pwa'` by its own contract). `MAX(created_at)` per vendor is a true last-active.

The ruling's other limb — the in-file comment naming a missing carrier — **did not fire**, and `ranking.js`'s term-2 note says so in those words, with the paragraph to re-open if the log is ever retired.

**(b) profileScore field verification — all six terms have columns at this tip.** `instagram_handle` (16) · `aesthetic_tags` (26) · `rate_min`/`rate_max` (27/28) · `about` (34) · `vendor_portfolio.is_hero` (5) · `approval_state` (8). Nothing skipped, nothing guessed. P2's travel term is **deliberately not scored**: `open_to_travel` (17) and `travel_notes` (18) exist, but no surface makes them fillable until the Studio, and a term nobody can raise is a penalty without a remedy.

**(c) ENGINE_SCHEMA attestation — DISCHARGED.** Opened at this tip: 25 tables / 244 columns, snapshot 2026-07-24. **Engine plane: none touched.** Public planes read: `vendors` · `demo_vendors` · `admin_config` · `vendor_portfolio` · `spotlight` · `vendor_featured_submissions` · `vendor_activity_log`.

**(d) The spotlight second-reader census — COMPLETE.** `public.spotlight` has exactly **one** reader/writer file at this tip (`src/api/admin/spotlight.js`, six sites, surfaced by the pwa's `app/admin/content/spotlight/page.tsx`). **The feed's read, born this sitting, is the second.** Recorded in `ranking.js` so the next change to that table knows it now has two consumers.

---

## 3 · THE FLOOR, AT THE EXECUTOR'S OWN HAND

Method as the chair supplied it: **exit code is the verdict, PASS-line count is the number.** `npm ci` + `npm run build` green before any bench ran.

**Byte-stable, matching the sealed list exactly (21):**
`selftest 386` · `guard 113` · `relay 40` · `m1 45` · `m3 37` · `m4 33` · `m4b 24` · `m4c 20` · `m4d 16` · `f0658 20` · `f0667 16` · `f0681 17` · `f0692 23` · `advisor 16` · `advisor_route 16` · `0081 12` · `sonnet 13` · `donna_cache 16` · `b0461_p6 25` · `b6_floors 47` · `b6_s1 24` · `b6_sitting2 22` · `door_rider 15` · `arc_m2 27` · `arc_m4 18` · `arc_m5 11`.

**Known red, carried loudly as always:** `meter 28/29` (F-06.41).

**NEW:** `b07_p1_bench 72/72` GREEN · `tdw07_p1_discover 35/35` GREEN. Both runnable from any working directory (Q-SP-5) — both were run from `/tmp`.

**THREE FLOOR BENCHES RED, NOT PAPERED — see F-07.5 below:** `m0 49/50` · `m2 42/43` · `f0550 30/31`. All three fire on **one cell each, of one shape**, and **no production byte of theirs is implicated**.

**pwa:** whole-tree `tsc --noEmit` **ZERO** on an installed, `.next`-cleared tree.

---

## 4 · NON-VACUITY — FOURTEEN MUTATIONS, ALL AGAINST PRODUCTION CODE

Every mutation below was applied to a **production source file** (never a fixture or test setup), the bench re-run, and the file `cp`-restored. The engine tree re-greens at 72/72 and `node --check` is clean.

| # | Production byte mutated | Observed |
|---|---|---|
| M-1 | `ranking.js` — `clamp01(1 - (age/horizonMs))` → `clamp01(1)` | RED 70/72 |
| M-2 | `ranking.js` — `rankVendors` comparator inverted | RED 69/72 |
| M-3 | `profileScore.js` — `TERM_WEIGHTS.photos` 0.30 → 0.40 | RED 71/72 |
| M-4 | `couple/discover.js` — `.eq('discover_paused', false)` **deleted** | RED 70/72 |
| M-5 | `couple/discover.js` — featured source → `v.featured_eligible` | RED 70/72 |
| M-6 | `couple/discover.js` — `normalizeIgHandle`'s `@`-strip removed | RED 71/72 |
| M-7 | `couple/discover.js` — `rankVendors(...)` → the plain filter | RED 70/72 |
| M-8 | `templates.js` — `demo_lead_alert.status` `'pending'` → `'approved'` | RED 71/72 |

Six further mutations are named in the pwa harness's own ledger (P-1…P-6: the app scheme, the 300 ms probe, the eyebrow's truth guard, the card band's `pointerEvents`, the admin group, the `is_demo` declaration).

---

## 5 · THE GESTURE LAW — SPEC §3, AND ITS ONE DISCLOSED CARVE-OUT

Every gesture handler, constant and timer in the discover canvas is **byte-unchanged**: `SWIPE_THRESHOLD` · `SWIPE_VELOCITY` · `TAP_MAX_MOVE` · `TAP_MAX_TIME` · `DOUBLE_TAP_MS` · `OVERLAY_DISMISS`, the deck's `onTouchStart`/`onTouchEnd` binding, the overlay's drag-dismiss. `git diff --unified=0` filtered to those identifiers returns **comment lines only**. Asserted mechanically at proof §4.1–§4.3.

**THE CARVE-OUT, disclosed rather than hidden.** On the card the IG chip is tappable and sits on the deck's own touch surface, so its handlers call `stopPropagation` — a tap on the chip opens Instagram rather than the overlay. The deck's **code** is untouched; the chip consumes its own touches exactly the way the overlay's Enquire/Circle buttons already do. The chip's **container** is `pointerEvents: 'none'`, so the only region that consumes anything is the chip's own ~130×30 px; the rest of that band swipes as before. Asserted at proof §4.4–§4.5.

---

## 6 · FINDINGS FILED THIS SITTING

**F-07.4 — the two photo counts disagree.** `requestDiscover`'s approval gate counts **every** portfolio row, pending included (`portfolio.js:134-144` → `summary.total`). The completeness score counts **approved only**, because the feed renders approved only (`couple/discover.js` `.eq('approval_state','approved')`) and a score crediting invisible photos would rank a card above what a couple can see. Both readings defensible; they disagree. Named in `profileScore.js`. **P2 reconciles at the 5→6 raise.**

**F-07.5 — THE SITTING-SCOPED MIGRATION-POSTURE CELL, a class of three. REPORTED, NOT ADAPTED (§0.2).**

Three sealed floor benches each carry one cell asserting *"0101 stays unreserved; no DDL rides this sitting"* — and each reads the **LIVE** `db/migrations` directory rather than its own sitting's commit range:

- `scripts/b06_m0_bench.js:488-489` (§7.3)
- `scripts/b06_m2_bench.js:323-324` (§6.6)
- `scripts/b05_f0550_ping_drain_bench.js:450-451` (§6.4)

That is the complete census — grepped across `scripts/*.js`; there is no fourth.

**Proven both worlds at the executor's hand:** at clean origin `fea5e4d` (delta stashed) `b06_m0_bench` exits **0 at 50/50** and §7.3 reads `ok`. With the delta restored it exits **1 at 49/50** on that cell alone. The other two behave identically.

**The diagnosis:** these cells assert a true fact about *their own* sitting's scope ("no DDL rode M-0") using a predicate that is only true until *anyone* takes 0101. `0101_profile_controls.sql` is the CE-ruled, lawful next number (0081 occupied, tail 0100, renumbering forbidden). **Any Block 07 migration would have fired all three, whatever it contained.** No production byte of `m0`, `m2` or `f0550` is implicated; each bench's other 49/42/30 cells are green.

**The cure, proposed with evidence and NOT taken:** `b06_m0_bench.js`'s own neighbour §7.2 already does it right — it scopes to `M0_RANGE`, the sitting's commit range, rather than the live tree. The three cells should assert against their own range by the same pattern. **These are sealed Block-05/06 benches; amending them is a labeled amendment and the chair's ruling, not the executor's hand.** They ship red and disclosed.

---

## 7 · DECLARED DEVIATIONS

**(i) D-1's rate toggle is wired — a fifth item, declared not smuggled.** The kickoff's P1 list has four items; D-1 says the toggle and the pause are *"both live"*, and a column that ships unread is the dormant-field class. It is one expression — `v.rate_display === false ? null : (v.rate_min || null)` — benched at §7.5/§7.6, with a one-line revert. **Reverse if the chair rules it scope creep.**

**(ii) The registry's status enum did not contain `pending`.** The ruled word was `pending`; `templates.js`'s header documented `'draft' | 'submitted' | 'approved'`. The ruled value shipped and the **comment** was widened, with an in-comment note that the enum is documentation while `isApproved`'s `=== 'approved'` is the mechanism — every non-approved value refuses identically. `isApproved('demo_lead_alert') === false`, asserted at §8.4.

**(iii) `caption` struck from 0101**, per the CE ruling, with `PUBLIC_SCHEMA.md`'s `vendor_portfolio` col-4 line quoted in-file as the reason.

**(iv) Two bench cells I authored wrong and corrected before delivery.** pwa §2.7 counted three `catch` blocks where the helper has two; §2.9 grepped the bare word `localStorage` and convicted its **own comment**. The second is the F-06.111 shape in a different costume — a cell that greens on a promise rather than a mechanism. Both re-aimed at the mechanism; the comment reworded so nothing can green on a claim.

---

## 8 · THE FOUNDER'S ACTS

### 8.1 · ⚠ ORDER IS LOAD-BEARING — SQL **BEFORE** THE PUSH

`src/api/couple/discover.js` names `discover_paused` and `rate_display`. Deployed **ahead** of 0101, PostgREST returns 400 and **the feed goes dark**. There is deliberately **no** silent retry-without-the-predicate: that would be a feed quietly serving paused vendors, which is the failure the predicate exists to prevent.

**Sequence: apply both ZIPs → run the 0101 block in Supabase → paste the readback → verify → THEN the git line.**

### 8.2 · Meta submission for `demo_lead_alert` — numbered clicks

1. WhatsApp Manager → the **WABA-DIRECT** portfolio (`1739793260373677`) → **Account tools → Message templates**.
2. **Create template**. Category **Utility**. Name: `tdw_demo_lead_alert` (exact — the registry references name + language). Language: **English (`en`)**.
3. Body — paste **exactly**, no line breaks:
   `Hi {{1}}, a couple just asked about your work for their {{2}} wedding on The Dream Wedding. Their enquiry is waiting in your ready account: {{3}} — reply here if you need any help.`
4. Sample values when prompted: `{{1}}` = `Rahul` · `{{2}}` = `December` · `{{3}}` = `https://thedreamwedding.in/claim/abc123`.
5. No header, no footer, no buttons. **Submit.**
6. When Meta approves, flip **one field**: `src/lib/templates.js` → `demo_lead_alert.status: 'pending'` → `'approved'`, and the `docs/TEMPLATES.md` §3 row to match. **Until that flip nothing can send** — `sendWa`'s gate is `isApproved`.
7. If Meta returns **Marketing** instead of Utility, flip `category` to `'MARKETING'` to keep the registry truthful (the `demo_invite` comment records the same escape hatch). Nothing else changes.

### 8.3 · The pause flip for smoke ⑤ — one founder-run UPDATE

The vendor-facing switch is **P2's Studio** (D-1); building an admin pause control in P1 would be a surface P2 immediately obsoletes. So step ⑤ is SQL, stated plainly. It ships in the delivery message as its own block, **after** 0101's readback lands — the conditional-withheld rule.

---

## 9 · THE SMOKE CARD, RECONCILED STEP BY STEP AGAINST THE AS-BUILT LIST

**Step 0 — the meter check (CE-109), FIRST or the walk halts by design.** Account `9888294440` carries `vendor_tier=prestige` against `agent_tier=entry`. Eyeball the meter before anything else.

| # | Step | Thumb-path at this delivery | Executor reads |
|---|---|---|---|
| ① | Run 0101 + seeds in Supabase | Supabase SQL editor; block provided complete | the two readback results (2 rows + 3 rows) |
| ② | Railway + Vercel deploys green | dashboards | the founder's word |
| ③ | Open Frost discover | `/frost/canvas/discover` | the mixed feed renders; gestures unchanged |
| ④ | Flip `discover.rank.w_freshness` | **`/admin/config` → the `Discover ranking` group** — BUILT THIS SITTING | the two pasted vendor-name orderings |
| ⑤ | Pause the test vendor | **founder-run `UPDATE`** (§8.3); no admin surface until P2 | the card vanishes; the pasted `SELECT` shows `discover_eligible` still `true` |
| ⑥ | Tap the IG chip | the chip on card + detail — BUILT THIS SITTING | app opens; second phone or app-deleted for the https fallback |
| ⑦ | Live witness | — | **DECLARED, never claimed** |

**Every step now has a thumb-path.** ④ and ⑤ were the two the read-first named as absent; ④ was built, ⑤ is SQL by ruling. **The build's proof stands independent of the walk.**

---

## 10 · WHAT P2 PICKS UP

The 5→6 photo-floor raise at **one constant** (`discover.js:6` — both the gate and the score move together) · F-07.4's reconciliation · `profileScore.js` extended in place with travel policy and the meter's hints (**never a second implementation**) · the vendor-facing pause switch, which retires §8.3's SQL · the spotlight meter reading `completenessBreakdown()`.

**Open for the chair:** F-07.5's ruling (three sealed benches, the cure proposed, not taken) · deviation (i)'s confirm-or-revert · F-07.1's dead-code cure, founder-sequenced.
