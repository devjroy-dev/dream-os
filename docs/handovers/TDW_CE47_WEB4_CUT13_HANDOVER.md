# TDW · CE-47 · WEB-4 · CUT 13 HANDOVER · the stored phones, option 1 (dream-os)

Cut at dream-os `eb6b51c` (ADS-2's scopes cut), 4 October 2026. Migration **0194** (its SQL before the push). Rung
**b209** (+ b209r on Postgres 16).

## What changes
- 0194_demo_phones_with_code.sql: demo_vendors.whatsapp_phone and demo_claim_requests.phone gain their code, ONLY for
  the two shapes the founder's read-only counts found (demo_vendors 3 rows "91 then ten digits"; demo_claim_requests 1
  row "ten digits starting 6 to 9"): ten digits 6-9 -> '+91' || the ten; '91' + ten digits 6-9 -> '+' || the twelve.
  Every other shape untouched. Duplicates after it (the demo pair ending 4440) are named to the founder by the read-only
  check shown before the SQL, never merged. Re-running finds neither shape: a no-op.
- The writers store the code from now on, through a new helper, src/lib/phone.js withIndianCode (the clean-up's exact
  predicates; every other shape stored as typed): the admin's demo create and its import (demoAdmin.js), and the demo
  claim door (demo/vendor.js). Not toE164: it turns an 11-digit "0"-prefixed number into "+0...", a guess the clean-up
  never makes. toE164 is unchanged.

## What does NOT change, and why: prospects.phone
The prospects lane stores numbers in Meta's own form (no "+": src/lib/metaCloud.js normalizeTo), and finds a prospect by
it (src/lib/prospects.js findProspectByPhone). Inbound WhatsApp numbers arrive that way, and opt-outs (fullStop.js),
closerEngine, introductions and demoLifecycle all go through that lookup. Adding "+" would split a prospect in two and
could land an opt-out on the wrong row. The admin already dials these numbers (Kit.tsx `bare`). Its writer is unchanged.

## Proven
b209 15/0: withIndianCode on every shape; toE164 unchanged (and why it is not used); both admin writers through the
helper (empty stays null); the claim door driven (ten digits stored +91, a coded number as given); 0194 is four UPDATEs on
the two demo columns only, each guarded by its exact shape, no prospects, no deletes, one transaction; the prospects writer
and lookup unchanged; two mutations. Clean tip eb6b51c: red.
b209r 7/0 on Postgres 16, planted shapes: exactly the ruled rows gain their code, every other row byte-equal (nulls and
empties too); prospects untouched; the 4440 pair is two rows, one number (named, not merged); counts unchanged; a second run
changes nothing; a mutation that reaches prospects is caught.
Differential over every reader of the helper, the demo doors and the migrations folder, and the source walkers
(97 benches), engine built both sides: exits identical; only b10_p1's printed ladder top (0193 -> 0194), in its own
pre-existing red.
