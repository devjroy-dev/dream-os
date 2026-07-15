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
