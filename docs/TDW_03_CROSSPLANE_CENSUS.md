# TDW_03_CROSSPLANE_CENSUS — the standing cross-plane regression harness
**Adopted as law by CE ruling R3, 2026-07-14 (TDW_03 sitting two).**
**Re-run at:** the block-closes of TDW_04, TDW_06, and TDW_16 — and after ANY dispatch-code change.
**The 16 run is the graduation test:** post-spine, the census must show engagements, not twins.

## Why this exists
On 2026-07-14 an evening was lost to "AI writes not working." The writes were working —
they landed on a plane the UI never read (Piece 4-A leads adapter, retired same night,
CE ruling A). The class of bug is: *both planes honest, no spine, surfaces reading the
wrong room.* This harness makes that class visible in ten minutes instead of one evening.

## The protocol (run COLD — proof-evidence law: any run that counts state uses a cold
conversation, header records repo HEAD + deploy-green)

Ten phrases, spoken to Victor in the PWA chat, one turn each. After all ten, run the
census query below and check every expectation.

| # | Phrase | Expected plane outcome |
|---|---|---|
| 1 | "new enquiry — Priya T1, 9811100001, Goa december wedding, about 3L" | `public.leads` row, state new, phone/city/budget populated, `draft_meta` NULL or minimal |
| 2 | "Create a lead for Rohan T2 for Rs 80000" | `public.leads` row, `draft_meta.missing` ⊇ [phone, wedding_city] — AND filed on turn 1 (no interrogation) |
| 3 | "log 25000 received from Priya T1 as advance" | money-IN binder in `engine.records` (amount_received 25000) — NOTE whether a twin forms beside #1's typed lead; per R2, dispatch may ANNOUNCE the standing lead but must NOT link |
| 4 | "jot on Priya T1 — partner is Dev" | line appended beneath the standing note on Priya's BINDER (single-'\n' accumulation) |
| 5 | "spent 4000 on travel for the T-run" | money-OUT binder (direction out), surfaces in the Expenses slice |
| 6 | "block the 19th evening for T-run recce" | `public.events` row (kind recce/meeting), NOT a binder |
| 7 | "actually the Priya T1 advance was 30000, correct it" | binder money REPLACED via the witnessed door + a confession sentence ("…old → new…") in the binder note — visible verbatim in the P2 card timeline (§4.2) |
| 8 | "Priya T1 is booked" | stage word on the BINDER; the TYPED lead's state — record what happens (pre-16: expect NOTHING; the lost/booked divergence is the disease, see Exhibit A) |
| 9 | "delete the Rohan T2 lead" | typed lead soft-deleted (`deleted_at`) or state lost via the typed door; binder plane untouched |
| 10 | "invoice Priya T1 for the balance" | per current doctrine: money-IN binder is the invoice source; `public.invoices` = minted numbered documents only (a row appears there only if a document is minted) |

**Pass** = all ten land on their expected plane, zero silent failures, zero
interrogation-before-filing, and any cross-plane announcements are R2-shaped
(spoken awareness, no writes).

## The census query (run in the Supabase SQL editor, read-only)
```sql
with typed as (
  select id, name, phone, wedding_city, budget_max, state, created_at,
         coalesce(nullif(trim(phone), ''), lower(trim(name))) as match_key
  from public.leads
  where deleted_at is null
),
binders as (
  select id, client, phone, amount, amount_received, amount_pending, stage, created_at,
         coalesce(nullif(trim(phone), ''), lower(trim(client))) as match_key
  from engine.records
  where hidden = false
)
select
  coalesce(t.name, b.client) as person,
  t.id  as lead_id,  t.state as lead_state, t.wedding_city as lead_city, t.budget_max as lead_budget,
  b.id  as binder_id, b.stage as binder_stage, b.amount as binder_amount, b.amount_received as received,
  case when t.id is null then 'binder only'
       when b.id is null then 'lead only'
       else 'BOTH PLANES' end as presence
from typed t
full outer join binders b on t.match_key = b.match_key
order by presence desc, person;
```

Second pass — name-only, catches phone-asymmetric twins the key above cannot pair:
```sql
select t.name as person, t.id as lead_id, t.state, t.wedding_city, t.phone as lead_phone,
       b.id as binder_id, b.stage, b.amount_received, b.phone as binder_phone
from public.leads t
join engine.records b on lower(trim(t.name)) = lower(trim(b.client))
where t.deleted_at is null and b.hidden = false
order by t.name;
```

## THE ORACLE — L-8's STANDING LINE (runnable; added TDW_04 B0, 2026-07-15)

**WITNESSED GREEN 2026-07-15 (founder-run, Supabase prod `nvzkbagqxbysoeszxent`/`main`, role `postgres`):**
`oracle_outstanding = 125000` · `oracle_owed_count = 3` · `oracle_on_calendar = 1` — matching the Part A seal
(`1b87981`/`525b2c8`) to the rupee and the row. Independently corroborated a fourth time by the stored
snapshot's own record lines summed under `pendingOf` (Dev Roy 2 ₹35,000 + Meera ₹40,000 + Keka ₹50,000 = ₹1,25,000
across 3 binders).

**Why it is here.** Until B0 the oracle existed ONLY as prose in `FINDINGS_LOG` — L-8 required a re-run at block
close against a line nobody could execute. It is now SQL.

**Authoring law:** this line mirrors the CANON — `dreamos-pwa/lib/vendor/derive.ts::pendingOf()` (F-04.13,
CE-ratified) and its mirror `dream-os/src/api/vendor-engine/cabinet.js:96-104` — read from code, never from a
seal note's paraphrase. Population is `engine.records` scoped `agent_id` + `hidden=false` (`cabinet.js:46-50`).
The drawer (`clients ∪ leads`, `Cabinet.tsx:310`), the hub/slice (`paid ∪ owed`, `deriveMoney`) and this line
**sum identically by construction**: every row they exclude is `direction='out'`, which the rule zeroes anyway.

**NOTE THE GUARD (F-04.24).** The money guard is **expression-internal**. It is NOT a `where direction <> 'out'`
clause — that form is NULL-unsafe (`NULL <> 'out'` → `NULL` → row silently dropped) while the canon treats a NULL
direction as `'in'` and COUNTS it (`derive.ts:42`; `cabinet.js:75`'s leads column agrees). `donna_client` opens a
binder with no direction and only `donna_money` sets one, so the trap is reachable; it was **not firing** at the
2026-07-15 run. The clause is also redundant — `pendingOf`'s own guard already zeroes `'out'`.

```sql
-- L-8 ORACLE — run at block close. READ-ONLY.
-- Agent id below is the founder's, witnessed 2026-07-15 (diagnostic Q1). The vendor is
-- WALKED, not hardcoded — vendorIdentity.ts's own reverse bridge, in SQL.
with agent_vendor as (
  select a.id as agent_id, v.id as vendor_id
  from engine.agents a
  join engine.users  eu on eu.id = a.user_id
  join public.users  pu on pu.auth_user_id = eu.auth_user_id
  join public.vendors v on v.user_id = pu.id
  where a.id = '50b2e89c-30a1-44ef-b69c-e9b6457e7a52'
),
binders as (
  select
    case
      when lower(coalesce(r.direction, 'in')) = 'out' then 0                    -- pendingOf :42
      when r.amount_pending is not null                                          -- pendingOf :43-46
        then greatest(coalesce(r.amount_pending, 0), 0)
      else greatest(coalesce(r.amount, 0) - coalesce(r.amount_received, 0), 0)   -- pendingOf :47
    end as pending
  from engine.records r
  join agent_vendor av on av.agent_id = r.agent_id
  where r.hidden = false                                                          -- cabinet.js:49
)
select
  (select sum(pending)                        from binders)  as oracle_outstanding,
  (select count(*) filter (where pending > 0) from binders)  as oracle_owed_count,
  (select count(*)
     from public.events e join agent_vendor av on av.vendor_id = e.vendor_id
    where e.event_date >= (now() at time zone 'Asia/Kolkata')::date              -- istTodayISO()
      and e.kind in ('shoot','meeting','recce','fitting','trial',
                     'family','ceremony','social','other')                        -- BOOKED_KINDS :118
      and coalesce(e.state, 'upcoming') = 'upcoming'                              -- F-04.17 :121
      and e.deleted_at is null                                                    -- F-04.25 :54, cured in B0
  )                                                           as oracle_on_calendar;
```

**Run discipline.** The 2026-07-15 run landed while the Supabase status banner read *"investigating a technical
issue"*; the result matched the seal exactly so it was not voided, **but the block-close re-run must land against
a green status page** — the proof-evidence law ("proofs against ambiguous states are void, not weak").

### T19 — THE STANDING BASELINE (founder gate, recorded at the spine sitting, 2026-07-16)

```
oracle_outstanding  125000
oracle_owed_count        3
oracle_on_calendar       4
```

**Rows behind the 4:** Family wedding 25 Jul · Ananya recce 25 Jul · Meera trial **2 Aug** · Meera wedding shoot
22 Nov. **Money untouched across the entire B3 smoke** — the oracle's quietest and best sentence.

**GATE STATUS: PASSED on a green banner (founder, 2026-07-16).** This cleared the spine sitting's first-code-ZIP
gate. **This is the number that must be green again at block close.**

**✅ RE-RUN AND WITNESSED — 2026-07-16, at the CHECKER sitting's close. `125000 / 3 / 4`, UNMOVED.**
Founder-run, screenshot handed back: project `nvzkbagqxbysoeszxent` · `main` **PRODUCTION** · role **`postgres`** ·
**Limit `No limit`** · **`1 row`** · result `125000 · 3 · 4`. The visible query text (lines 24–34) was compared
against this file's own SQL and is **byte-identical, including the `-- BOOKED_KINDS :118` and `-- F-04.25 :54`
comment tails.** No incident banner in the dashboard chrome — *the same channel the 2026-07-15 amber appeared in.*
**ZIP D shipped no migration and wrote no row; the checker only REFUSES writes and cannot create or move one — so
unmoved is the predicted result, and it is the oracle's quietest and best sentence again: money untouched.**

**⚠ WHAT THIS RUN WITNESSES, AND WHAT IT DOES NOT — stated because the proof-evidence law is above it.**
The screenshot witnesses **the tail and the result**: the `oracle_on_calendar` subquery, the header, the role, the
no-limit, the row count. **Lines 1–23 are scrolled off — the `agent_vendor` walk and `pendingOf`'s `case` are NOT
visible in it.** Those CTEs are where the money rule lives, and they are **trusted from this file's sealed text,
not from this screenshot.** That is a real limit and it is named rather than papered over. It is **not** the
status page itself, either — the absence of an incident banner is evidence, not the check.

**⚠ THE BLOCK-CLOSE RUN REMAINS OWED AND UNDISCHARGED.** 04 is not closed — B4, B5 and 06 remain. **This is not
that run.** It strengthens the standing baseline from *word* to *witness*; it does not retire the gate.
**→ DISCHARGED BELOW, 2026-07-17 (B6 sitting 2) — see "T19 — THE BLOCK-CLOSE RUN, SEALED."**

### T19 — THE BLOCK-CLOSE RUN, SEALED (B6 sitting 2, 2026-07-17; R-B6-6 executed — re-derived, the triple never carried)

```
oracle_outstanding  125000
oracle_owed_count        3
oracle_on_calendar       6
```

**Founder-run against prod, FOUR result sets across the sitting, mutually consistent:** `…/6` pre-cleanup → `…/7`
mid-smoke (Zoya's shoot booked between runs — fixture motion, named below, not drift) → `…/6` post-cancel → `…/6`
final, after the last fixture (the 18 Dec block) was mechanically soft-deleted — which cannot move the count:
`kind='blocked'` was never in the oracle's BOOKED_KINDS leg. **`oracle_outstanding`/`oracle_owed_count` read
`125000 / 3` in ALL FOUR runs — money untouched through an entire smoke sitting, a fabricated cancel, a fabricated
₹50k lead figure, and a full fixture cleanup. The oracle's quietest and best sentence, four times.**

**THE DELTA FROM THE SPINE BASELINE (`/4`), EXPLAINED ROW BY ROW — a companion read of the six rows behind the
count was run and pasted (2026-07-17), so the number explains itself:** the four baseline rows stand (Ananya recce
25 Jul · Meera trial 2 Aug · **Family wedding 3 Aug — MOVED from the baseline's 25 Jul by the FOUNDER'S OWN HAND
through the calendar door, ledger-witnessed:** `event_update … 2026-08-03 · via calendar` at 2026-07-16 12:41,
entity `c7035d2a` — explained, not filed · Meera wedding shoot 22 Nov) **plus two standing fixtures, kept by
founder ruling recorded 2026-07-17: Rhea Referent Test - shoot (2 Dec) and Nisha Retro Test - recce (8 Dec — T12's
living witness, in the row itself).** Zoya Persist Test - shoot: cancelled through the mechanical door
(`event_update … via calendar`, 10:51:31, row `state='cancelled'` witnessed) and correctly absent from the count.
**Every row in the six is named; nothing is residue.**

**WHAT THIS SEAL WITNESSES, AND WHAT IT DOES NOT — stated because the proof-evidence law is above it.** The
executor read four pasted result sets and one companion row-set, all from the same founder editor session that ran
a dozen other prod reads this sitting (each returning live rows only prod holds). **The editor chrome — project /
role / status banner — was NOT screenshotted for these runs; the executor asked twice and seals on the evidence in
hand rather than a fifth request, with the limit NAMED: this entry carries pasted rows and cross-run consistency,
not a photographed header.** The precedent is this file's own superseded-attestation entry: record what exists,
name what it is, never paper the gap. **→ CE, accept-or-demand:** one screenshot of a re-run (read-only, free)
upgrades this to the checker-sitting's full form at any time; the CE says whether the seal stands as-is or the
photo is owed before the block-close handover.

**Census + masterplan updated to this run in the same delivery, per R-B6-6.** **A green oracle is not a clean
estate. It counts money and rows; it never asks whether a binder's date is a wedding.** This run was green while
the same sitting's thread held two fabricated "unblocked" dones and one fabricated "Cancelled:" in the door-line's
own costume (F-04.71). **Green again at block close, and green still does not mean clean.**

**~~⚠ HOW THIS RECORD IS WITNESSED, STATED PLAINLY BECAUSE THE PROOF-EVIDENCE LAW IS ABOVE IT.~~ ❌ SUPERSEDED
2026-07-16 AT THE CHECKER SITTING (CE-ratified; corrections convention — update in place, nothing deleted). The
caveat below was TRUE WHEN WRITTEN and is now OBSOLETE: the run above carries its header and its output.**
~~The run happened
in the B3 close window and **its recorded output was lost to context truncation** — the same mechanism that ate
three chartered writes at B3 (handoff §7). **The founder's word is the witness, by his ruling of 2026-07-16, and
that is what this record carries — not a pasted result set.** It is recorded here at his instruction and named
for what it is: **a founder attestation, not a cold-run transcript with a header.** Under the standing law a
proof needs its header and its output; this has neither, and it is load-bearing anyway because the founder
witnessed it and says so.~~ **The block-close re-run is the one that owes the full header + pasted rows** — and it
is owed regardless of this record, not excused by it.

**A green oracle is not a clean estate. It counts money and rows; it never asks whether a binder's date is a
wedding.** `125000 / 3 / 4` was green through the entire F-04.43/46 background rate — green while Ananya's binder
said her wedding was her recce. **This must be green again at block close, and green will still not mean clean.**

### WATCH LIST (not findings — armed traps, verified not firing at the 2026-07-15 run)

- **F-04.24 · NULL-direction (🟢-watch):** see the guard note above. A NULL-direction binder with pending > 0
  would be counted by drawer/slice/hub and dropped by any `direction <> 'out'` form of this line.
- **Degenerate phone-key residue (🟢-watch, TDW_04 B0 / F-04.3(a)):** `phoneKey.ts:19` now rejects a single-repeated-digit
  key (`/^(\d)\1{9}$/` → null), but **stored snapshot residue is never re-normalized.** U4 (2026-07-15) shows Keka's
  lead item still carrying `phone_key:"0000000000"` from before the guard. Benign at one item; **a second pre-guard
  degenerate item would FALSE-FUSE two strangers by "phone"** at render-time twin annotation (`donna.ts:239-241`).

---

## STANDING EXHIBITS — DO NOT RECONCILE (CE ruling R4)
- **EXHIBIT A — Meera** (lead `72a2f3a9…` state **lost** · binder `99dde40e…` **booked,
  ₹20,000 received**). One person, two confident contradictory truths, no spine.
  Preserved in production deliberately. **TDW_16's acceptance includes this pair
  resolving into one engagement.** A hand-edit erases the best specimen we own.
- **EXHIBIT B — Kavya** (lead `d3d50f62…` city **Jaipur**, phone present · binder
  `c66ad01c…` ₹15,000 received, **no phone**, where the "change city to Udaipur" chat
  edit landed). The chat-edit-landed-on-the-other-plane case — F7's cousin. Also the
  canonical phone-asymmetric twin: the R1(b) cross-chip will NOT mark this pair, by
  disclosed design. 16's other acceptance shape.

## Census of record (2026-07-14, first run, pre-protocol)
Twins: Meera (Exhibit A), Kavya (Exhibit B), Divya (both planes independently
"contacted"). Clean phone-match: Ananya (proof the merge key works when present).
Correct non-twins: Kratika ×2 binders (client ₹30k + expense ₹6k — one-binder-one-
money-story, NOT a dedupe target). Duplicate-dispatch sightings for the 02-HOTFIX
file: Simran ×2 (typed), Ritika & Arjun ×2 (typed).

## FOOTNOTES (block close, 2026-07-14)
- **Exhibit A is itself phone-asymmetric** (binder phone NULL, SQL-confirmed): the
  R1(b) chip cannot mark the flagship specimen — by disclosed design. This is the
  strongest single argument for 16's engagements spine over any key-matching interim.
- **Finding 7 — plane-partial consult (engine-side Exhibit A):** 20:30 UTC transcript —
  Victor, asked about Meera, read only the typed-lead snapshot ("lost, Rs 300,000"),
  declared "no current booking or payment in flight" over a booked binder holding
  ₹20k received / ₹60k total, and attributed the read to Donna. Filed to the
  02-HOTFIX lane; verify coverage at hotfix close.

## R1(b)/R2 boundary (for future executors)
The UI cross-chip READS phone matches and never writes. Dispatch may ANNOUNCE the
other plane's standing record in its result string (CE-14 pattern) and must not
stamp refs, columns, or links — the engagements table (TDW_16) is the only place
couple×vendor linkage will ever live. Do not build a rival spine in the meantime.

## Ritika & Arjun ×2 — CLOSED (CE verdict, 2026-07-15, TDW_04 engine-lane sitting)
The same-signature check (read-only SQL, founder-run at the TDW_04 audit close)
ruled it **CE-19-class name-drift predating its own fix, founder-cleaned** — the
same family as the Simran item-4 trace, NOT a distinct engine mechanism. No action;
recorded here so no future census re-run re-opens it as a fresh duplication exhibit.
