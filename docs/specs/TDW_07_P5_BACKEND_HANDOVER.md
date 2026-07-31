# TDW_07 P5 — BACKEND MOVEMENT · EXECUTOR HANDOVER
**Base:** `dream-os @ 133d709` · **Executor:** Opus-LE · **Date:** 2026-07-31
**Rides:** ZIP 1 of 2. The `dreamos-pwa` movement is ZIP 2 and applies AFTER this one.

---

## 1 · WHAT SHIPPED

| # | File | What |
|---|---|---|
| 1 | `src/api/couple/enquire.js` | **REWRITTEN.** Species resolution from the DB; the real chain's lead built true (`source:'discover'`); F-07.35's pause predicate; F-07.40's loud swallow + field-by-field response truth; the demo leg. |
| 2 | `src/lib/discover/demoLeadAlert.js` | **NEW.** The free-lead hook's one home — the alert, the 48h batch on `last_template_at`, the prospect upsert (`templated` + `notes: demo_lead`), the claim link. |
| 3 | `src/lib/vendor/enquiryEnrichment.js` | F5's `deleted_at` cure — one predicate. |
| 4 | `src/api/admin/demoAdmin.js` | F-07.36 — `requireAdminPassword` on both claim routes. |
| 5 | `src/api/demo/vendor.js` | F-07.37 — the claim route stops reporting success on failure. |
| 6 | `src/lib/prospects.js` | F-07.38 — the conversion job's silent catch goes loud. |
| 7 | `scripts/b07_p5_bench.js` | **NEW.** 31 cells, three sections + async re-drive. |

**Zero DDL.** `0105` stays unspent, per the F2 and ping rulings.
**W-1 clean** — zero soul/prompt/lens/engine bytes. No file under `src/engine/` is touched.

## 2 · PROOF

```
CURED   tree:  b07_p5_bench  31 passed,  0 failed  (31)
UNCURED tree:  b07_p5_bench   8 passed, 23 failed  (31)   ← 23 RED on exactly the cures
§6 gate:       node --check   7/7 OK
```

Both-ways method: a scratch clone of `133d709` (uncured) and the same clone with this ZIP applied (cured), the identical bench file in both. §3 is a mutation section that breaks **production code** — six mutations, each asserting its cell goes RED — and restores it.

**The mutation section earned its keep in this sitting.** `§3 §2.1` failed at first run: the cell grepped the whole file for `source: 'discover'`, and this sitting's own explanatory comment contains that string, so breaking the code left the cell green. A cell a comment can satisfy is not testing code. Cured by a comment-stripping `code()` view; the same defect was latent in `§2.8` and is cured the same way.

## 3 · DISCLOSURES (each one-word vetoable)

1. **Test setup, named:** the bench sets `process.env.MARKETING_WHATSAPP_NUMBER` because `sendWa` resolves the lane's FROM before reaching any injected transport (`sendWa.js:108`). Process-level only; no shipped file carries it. §1.8 proves the refusal path still refuses.
2. **`enquiryToBinder` is retained unchanged** beside the new `createLead` call. These are the Plane Doctrine's two planes (protocol §3.4), both with live readers — the lead is what `pending_lead_pings.lead_id` FKs to and what the Leads tab reads; the binder is Donna's cabinet. Neither is a duplicate of the other. Existing behaviour is sacred (§8).
3. **`prospects.source` is written `'other'`, not `'discover'`.** The CHECK admits only `sheet|manual|other` (PUBLIC_SCHEMA.md:1514). Provenance rides `notes`. Widening the enum would be DDL this sitting was ruled not to spend.
4. **The demo leg writes no `couple_enquiries` row** — that table's `vendor_id` references the real vendors plane. Her Journey will not list a demo enquiry. A true absence, stated in-file so no surface invents it.
5. **The claims routes remain declared below `module.exports`** (`demoAdmin.js`). Verified functional — the export holds the router by reference. Moving them is a diff that looks like a fix and changes nothing; the missing middleware was the defect.

## 4 · APPLY-ORDER DEPENDENCY (matters)

`src/api/demo/vendor.js` now returns **502** on a failed claim instead of `ok:true`. The PWA landing at `app/demo/vendor/[handle]/page.tsx:89` does not yet read `res.ok` — **that is ZIP 2's half of F-07.37.** Between the two applies, a failed claim is honest on the wire and still silent on the screen. This is strictly better than today (where it is dishonest on both) but it is not the finished cure.

**Verified safe:** F-07.36 does **not** lock the founder out. Both admin call sites already send `x-admin-password` (`app/admin/demo/page.tsx:124` and `:390`).

## 5 · F-07.40 — THE FALLBACK TEMPLATE, DRAFTED FOR VETO + FILING

Derived at `133d709`: no approved vendor-lane template can honestly carry an enquiry alert. `morning_nudge_vendor` claims a morning and carries a STOP that would disable enquiry alerts; `crew_assignment` claims a crew; `payment_reminder` is unrelated. All three rejected as costume.

**Proposed for the founder's veto and Meta filing at P5's seal** (registry key `enquiry_alert_vendor`, line `vendor`, category `UTILITY`, vars `name` · `bride` · `link`):

> `Hi {{1}}, a new enquiry just came in from {{2}} on The Dream Wedding. Open your Leads to see the details: {{3}} — reply here if you need any help.`

Shaped to the estate's filing rules (single line, no adjacent variables, none at body start or end — `docs/TEMPLATES.md` §1) and deliberately parallel to the approved `demo_lead_alert` so the two read as one product. **Nothing is wired to it.** The approval clock runs during P6; the wiring lands where the founder sequences it.

## 6 · WHAT THE WALK NEEDS FROM THE FOUNDER

Two acts, both derived from his own pasted rows, both stated in the walk card:

1. **One demo row needs his number.** All six discover-eligible `demo_vendors` carry `whatsapp_phone = NULL`, and `demoAdmin.js` has no UPDATE path for that column — it is write-once at `POST /vendors`. Fixture path (i), ruled: a founder `UPDATE`, witness-checked, shipping in the walk-card message.
2. **A future-dated clash event.** Both events on `23165e38-…` sit on `2026-07-31`. The clash line will fire, but a same-day wedding is not a walk anyone can say out loud. One future-dated `events` row plus a couple whose `couples.wedding_date` matches it.

## 7 · NEXT

**ZIP 2 (`dreamos-pwa`):** the enquiry sheet · F-07.34's five vetoed bands to one home, three call sites re-pointed · F1(a)'s wiring at `VendorProfileView:220` (the deck's Enquire finally feeding the pipeline, the six misrouted demo links dying with it) · F-07.39's cure at `sanctuary/page.tsx:1574` with V6's three toasts · F-07.37's screen half · the Journey's `Sent`.

Then: the walk card, fixture-derived, with spec acceptance §5 as its spine.
