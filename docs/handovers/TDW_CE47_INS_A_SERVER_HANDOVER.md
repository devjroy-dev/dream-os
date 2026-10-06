# repo: dream-os · base a29a45b52022 · TDW · CE-47 · INS · INS-A SERVER HALF HANDOVER r3 · the Insurance room's server

Cut at dream-os `a29a45b52022` (main after ELZ-4), 6 October 2026. **r2** folds in the founder's principle (CE-47, 6 October;
rulings a and b): "Where to buy" became "Get a quote" with her cover brief, every entry names its own fees, every policy row
says it is not checked by TDW. src/api/vendor/solutions/index.js is byte-identical to r1 (8f40d441), as OFF-A1 r2 is cut on it. Server train 2, first (OFF-A1 re-cuts its
index.js line onto this one). Rungs **b220** and **b221**; b44 amended by name. Migration **0200** (INS range 0200-0203).
No new directory. No file deleted. The pwa room and the storefront/site mark are later INS-A cuts.

## What it does
The room "Insurance" (Business Solutions › Run the business), ruled by the founder through CE-47 on 4 and 6 October:
TDW educates, links, stores and shows; it never compares, recommends, or takes money from an insurer, and registers
as no broker. Kinds of cover, never products; "Where to buy" A to Z (14, Acko included; Policybazaar and
InsuranceDekho labelled "Comparison site"); her policies kept privately, every field confirmed by her; reminders 30
and 7 days before the end; the public "Insured" mark only while her switch is on and a confirmed policy is in date.

## Paths (13 code paths + this handover + the floor manifest = 15)
| Path | | What |
|---|---|---|
| db/migrations/0200_insurance_room.sql | A | vendor_policies, vendor_insurance_settings; RLS on, service_role only; no existing table altered, no row written |
| src/lib/vendor/insurance.js | A | the rules, pure: KINDS/kindsFor, destinations (A to Z, `mode: 'link'` so "Buy here" can arrive as `'journey'`), policyState, insuredMark (ruled tap text), reminderDue, reminderText |
| src/lib/vendor/insuranceRoom.js | A | the doors as { status, body }; private bucket `policies` under `<vendor id>/`; save is her confirmation; runRenewalSweep |
| src/lib/vendor/policyRead.js | A | pre-fill only, one Haiku call per upload, `[policyRead] cost Rs x.xx` printed; returns only what the save door would accept |
| src/api/vendor/solutions/insurance.js | A | ten doors (r2 adds /quote-brief), each requireAuth + resolveVendor(), each keyed on req.vendor.id |
| src/api/vendor/solutions/index.js | M | one line after ELZ-4's: `router.use('/insurance', require('./insurance'));` |
| src/api/public/vendorCard.js | M | `insured` in CARD_KEYS and card(): the mark object or null, computed by the server; a failed read is null |
| src/cron.js | M | the sweep, 10:00 am IST (a day minute: it messages her) |
| src/lib/format.js | M | formatDateLong (full months) beside formatDate, which is untouched |
| scripts/b220_ins_a_rules_bench.js | A | 61 cells incl. 12 production mutations (r2 +9, r3 +5; amended by label) |
| scripts/b221_ins_a_doors_bench.js | A | 57 cells incl. 7 production mutations (r2: +7 cells, +2 mutations, amended by label), against an in-memory database that throws on any unmodelled call |
| scripts/b44_public_vendor_card_bench.js | M | AMENDED BY LABEL: `insured` joins CARD_WANT |
| scripts/b55_g2_reviews_bench.js | M | r3, AMENDED BY LABEL: `insured` appended after `eliza` in the ordered CARD_KEYS pin |

## r3 · two floor reds cured (server train 2's floor, CE-47, 6 October)
1. bOB_taxonomy 6.1: insurance.js held a private taxonomy copy, with the retired `mehendi` and `catering`. Cured: the kinds
   table names only the canonical eleven, imported from src/agent/categories.js and checked at load (a non-canonical
   trade throws), and a trade she sends is read through the one alias table (categoryFraming.normaliseCategory:
   catering → venue_catering, mehendi → other, photo → photography). b220 0.1 and 2.8 to 2.10, and one mutation.
2. b55_g2_reviews "CARD_KEYS carries seal and nothing else moved" pinned the list without `insured`. Amended by label:
   `insured` appended after `eliza`, `seal` unmoved. b55 joins this package's paths (15).
Changed from r2: src/lib/vendor/insurance.js, scripts/b220_ins_a_rules_bench.js, scripts/b221_ins_a_doors_bench.js
(its mutation copies carry the two canonical homes), scripts/b55_g2_reviews_bench.js (new to the package), this handover
and the floor manifest. Every other path is byte-equal to r2; src/api/vendor/solutions/index.js stays 8f40d441.
e-274's whole-server walkers run by the seat before this ZIP left, each on a truly clean base (stash -u) and on the tree,
same cells reached on both: b07_f0789 19/0, b128 13/0, bOB_taxonomy 78/0, b15_schema_register green, b91_rls_ladder 53/0,
b55 50/0, b44 61/0. b220 61/0 and b221 57/0 on the tree, red on base.

## r2 · Get a quote (ruling a; step 2 "Buy here" NOT built until a partner agreement settles the IRDAI question)
POST /quote-brief { insurer, answers, kinds } returns that insurer's own page, its fee line ("This opens <name>'s own website.
<name> sets its own price and may charge its own fees. TDW takes nothing.") and her cover brief as text she sends herself.
The brief says where each figure came from: weddings from vendor_seal ("counted by The Dream Wedding"), booked days from
her calendar (events, kind 'ceremony', upcoming, not deleted, next 365 days, one per date: "from the studio's own calendar"),
and her answers ("as stated by the studio"). It reads only; nothing goes from TDW to an insurer. A PDF of the brief is
not in r2: the brief is text she copies or forwards on WhatsApp (R-46.17's copyable-text rule); a PDF is a later ask.
Each policy in the room carries `checked: "Details confirmed by you. Not checked by TDW."` (ruling b).

## Doors (all under /api/v2/vendor/solutions/insurance)
GET / · POST /kinds · POST /quote-brief · POST /policies/upload-url · POST /policies/read · POST /policies · PATCH /policies/:id ·
DELETE /policies/:id · GET /policies/:id/document (ten-minute signed address) · PATCH /settings ({ show_mark }).

## The sweep
Window open: the reminder goes as plain text and is stamped. Window shut: nothing sent, nothing stamped (no approved
template yet; the room's "Renew soon" carries it), and the next morning tries again. Never twice. An edit clears the
stamps so a renewed date reminds afresh.

## Proofs (seat container, fresh clone at a29a45b52022)
b220 56/0 and b221 57/0 on the tree (r2); both red on base (their modules are absent). b44 61/0 on tree and base.
Every server bench reading a touched file run on base and tree: identical counts. Standing base reds, not this cut's:
b05_p4_crons 3, b51_referrals 3, b59_g34_reminders 1, b08_p1_lifecycle 6. Neither rung reads the wall clock: every
"today" is a passed fixture, so a shifted clock cannot move a cell.

## Go-live steps (none needed to land)
1. Run 0200. 2. Create the PRIVATE storage bucket `policies`. Until both, the upload door answers "could not start"
and every public card carries `insured: null`.
