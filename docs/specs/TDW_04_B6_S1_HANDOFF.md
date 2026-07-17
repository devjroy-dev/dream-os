# TDW_04 — SURFACES S1 → S2 HANDOFF

**CE-22:** dream-os `747d1b1` = `origin/main`, fetched and re-derived at the moment of writing → **ZIP C delivered NOT yet applied** · dreamos-pwa `552646d` = `origin/main`, same derivation → **ZIP D delivered NOT yet applied** — no deploy-green claimed on either; proofs run after the founder applies both. **Apply order: ZIP C (dream-os) first, ZIP D (dreamos-pwa) second** — ZIP D's calendar sends `from/to` and reads `truncated`, both of which ZIP C's door must be serving before the PWA deploys (a windowed call against the old door still works — the params were always parsed — but the tell would read undefined; order is cheap, take it).

**Read beside:** `TDW_04_B6_KICKOFF.md` · both B6 sitting handoffs · `TDW_04_B6_SURFACES_PAPER.md` (RULED, R-B6-16) · **`TDW_04_B6_S1_READER_CENSUS.md` (this sitting's opening act — its batch-ruling ask is S2's opening agenda item).**

---

## 0. WHAT THIS SITTING DID
1. **Sitting open recorded** (FINDINGS_LOG "SURFACES S1: SITTING OPEN"): R-B6-16..24 verbatim · the founder's donna_find confirmation (stands as shipped) · R-B6-23 executed (the T19 discharge line is in the census doc).
2. **The reader census** — one packet per R-B6-20, predicate stated, the "57" retired, **the cancel-a-block three-way divergence found and evidenced** (census #8; grid-held / checker-free / re-block-refused, reachable from the list page today). Batch ruling requested; cure shape proposed. R-B6-7's index question: looked, redundant, drop with the CE.
3. **Item 2 shipped both halves** (allowlist + guard + one-home wire facts + the function-artist stepper) with **the CATEGORY_CAPACITY drift reported, not adapted** (paper's table: makeup 1 · florist 3 · other 1; code at HEAD: makeup 2, florist/other absent — the wire carries the code, the CE reconciles).
4. **Item 3 shipped both legs** — the windowed grid (month ± 1, month-nav re-fetches), the honest `truncated` tell, the rail deliberately left on the default horizon (head-of-sort truncation immunity; windowing it would be the regression).
5. **Item 6(a)'s hedge shipped** per R-B6-18 (popup + → AddSheet create, date prefilled; the additive `initialValues` prop, drift from the paper's ~5-line estimate disclosed).
6. **Item 5's strike recorded** (census §3). **F-04.68 cured** (R-B6-24; bench §1 is the ruled verification line). **F-04.69 untouched by rule** — no S1 file opens `leads.js`; first-in-line for the next ZIP that does.
7. One ratify-or-revert one-liner (byDate excludes blocks — cures census #2 + #4). `b6_s1_bench` 24/24, fails 12/24 at uncured HEAD on exactly the cures. Sealed benches byte-stable; guarded files 0-line diff; PWA tsc whole-tree zero.

## 1. FOUNDER SMOKE FOR THIS DELIVERY (plain steps; the executor reads the evidence; **item 3 smoked hardest, per the paper's own words**)
1. Apply ZIP C, push, Railway green. Apply ZIP D, push, Vercel green.
2. **The horizon (the F-04.47 specimen, reversed):** open the calendar, tap › to **November**. The month's shoots must appear **without touching anything else** — before this, ‹/› moved the header and nothing fetched. Then tap ‹ back to July; then › forward twice quickly — the grid must settle on the right month's rows both times. Paste a screenshot of November.
3. **The tell (only if you have a dense span):** if any 3-month span holds over 200 entries, the italic line under the grid should say so; otherwise its absence is the pass.
4. **The hedge:** tap any date with a booking, tap the popup's **+** — the form should open with **that date already filled**; add a title, Create. The entry must appear on the grid without a refresh. The big + button (bottom right) should still open chat, unchanged.
5. **The capacity row:** Settings → the "Working Capacity" card (photographers/MUAs/decor/venues see it; planners and delivery vendors must NOT). Tap + to set a number, Save, refresh — it must hold. Tap "Use category default", Save, refresh — it must show the default again. If any wording on this card or the grid's tell reads wrong to you, say so — **every string is on the veto-on-sight list in the log.**
6. **The 5:3 re-derivation (one paste):** run the SQL block below in the Supabase editor (read-only, self-contained, nothing to fill in) and paste the result rows — the census records whatever they say.
7. **F-04.68's live half (optional, one read):** after any chat turn that harvests a lead detail, the lead's snapshot item should carry `name` and `phone_key` — the executor reads the paste.

### PASTE BLOCK — the blocked-vs-not count (mirrors the windowless GET's own filters; every vendor's row returned, read yours by business_name; written against the witnessed column lists in `docs/db/PUBLIC_SCHEMA.md`):
```sql
-- TDW_04 B6-S1 · the 5:3 re-derivation (census §0). Read-only.
-- Mirrors GET /vendor/events' DEFAULT window: state='upcoming', live rows,
-- IST today .. today + 400 days — the exact payload the ratio was first seen in.
select
  v.business_name,
  count(*) filter (where e.kind =  'blocked') as blocked_rows,
  count(*) filter (where e.kind <> 'blocked') as other_rows
from public.events e
join public.vendors v on v.id = e.vendor_id
where e.deleted_at is null
  and e.state = 'upcoming'
  and e.event_date >= (now() at time zone 'Asia/Kolkata')::date
  and e.event_date <= (now() at time zone 'Asia/Kolkata')::date + 400
group by v.business_name
order by v.business_name;
```

## 2. OPEN AT BANKING
1. **🔴 THE BATCH RULING** — census #7–#10 (the block-in-the-events-list family; executor recommends the cancel-door kind guard as the root cure) + the ratify-or-revert pair (the byDate one-liner; the bench's existence needs no ratification, its §2 disclosure method is stated) + §2's redundant index disposition. **S2 opens on this ruling** the way S1 opened on the paper's.
2. **🔴 THE VETO SET** — the copy strings, verbatim in the log's delivery section. Any NO reverts in a rider.
3. **🔴 S2's charter, already ruled:** `0078` per R-B6-17 (one live block per `(vendor_id, event_date, slot)`; `full_day` EXCLUSIVE both directions, refused at the write path naming the existing block; **the executor proposes the enforcement site from the code with evidence, ruled in the migration ZIP's disclosure**) · item 4 whole (the `GET /day/:vendorId/:date` endpoint + the day sheet + the Move verdict riding the 409 body + slot toggles) · item 6 completed on the sheet's `+ Booking` + the AddSheet Block offer. One founder-run migration, S2's own.
4. **🟡 F-04.69 + R-B6-12's single-home move** — first-in-line for the first ZIP that opens `leads.js` (S2's day endpoint likely doesn't; say so either way).
5. **🟡 The CATEGORY_CAPACITY drift** — the CE reconciles map vs paper table; if the map is amended by ruling, it is one edit in one home and the wire carries it everywhere with zero further diffs (that was the point of the one home).
6. **🟢 R-B6-22 standing:** the block handover writes at **S2's seal**. Not this sitting's.

## 3. EXECUTOR DISCLOSURE (S1)
Tool-verified work held throughout: every census cell, both drift reports, and every "at HEAD" claim were read by command at `747d1b1`/`552646d`; the bench ran both directions; tsc ran against a cleared cache with dependencies installed. Authored items, disclosed at delivery rather than discovered later: the census predicate and the 57's retirement · the two-fetch rail design (the regression the naive windowing would have shipped, argued in the hook header) · the `initialValues` prop · the byDate one-liner · the copy set · both drift reports. Nothing in this sitting ran against production; nothing claimed a banner it did not see.

---

**S2 opens on: the batch ruling + the veto answers → `0078` (R-B6-17, enforcement-site proposal from the code) → item 4 → item 6 completed → the amended founder smoke + T19 unmoved-unless-a-fixture-moved-it → the block handover (R-B6-22).**
