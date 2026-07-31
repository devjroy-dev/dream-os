# TDW_07 P5 — BACKEND MOVEMENT B · EXECUTOR HANDOVER
**Base:** `dream-os @ e27c8d3` · **Executor:** Opus-LE · **Date:** 2026-07-31
**Rides:** the F-07.41 masking ruling + F-07.42. Applies on top of the P5 backend movement.

---

## 1 · WHAT SHIPPED

| # | File | What |
|---|---|---|
| 1 | `src/lib/demo/maskDemoLead.js` | **NEW.** The one masking home, with the coverage map in-file. V8's vetoed form, V9's month register (reusing `monthPhrase`, one register across the alert and the studio), `MASKED_SELECT`, and F-07.42's cured line/summary builders. |
| 2 | `src/api/demo/vendor.js` | All **three** public `demo_leads` readers masked — `/leads`, `/context`, and **`/chat`'s model context**. Phantom `l.state` / `l.raw_message` reads removed. |
| 3 | `src/api/couple/enquire.js` | The `demo_leads` write with server-side hydration; `notified_vendor` from the alert's own result; the alert-only branch stated at the branch; the file header reconciled. |
| 4 | `scripts/b07_p5_bench.js` | §5 added (10 cells) + 2 mutations. |

**Zero DDL.** `demo_leads` existed and was purpose-built. W-1 clean.

## 2 · PROOF

```
CURED    b07_p5_bench  43 passed,  0 failed  (43)
UNCURED  b07_p5_bench  31 passed, 12 failed  (43)   ← the 10 new cells + 2 new mutations
§6 gate  node --check  4/4 OK
```

## 3 · THE COVERAGE MAP, AS APPLIED

| site | before | after |
|---|---|---|
| `vendor.js:73` `GET /:handle/leads` | `select('*')`, raw rows | `MASKED_SELECT` + `maskDemoLeads` |
| `vendor.js:92` `GET /:handle/context` | `select('*')`, raw rows + leadList | `MASKED_SELECT` + `maskedLeadLines` + `maskedLeadSummary` |
| `vendor.js:123` `POST /:handle/chat` | `select('*')` **into the model's window** | `MASKED_SELECT` + `maskedLeadLines` |
| `demoAdmin.js:75/:90` | raw | **unchanged, correctly** — both carry `requireAdminPassword` |

`§5.7` asserts the count is exactly three and that none of them selects `*`; a fourth reader added later fails that cell until it joins the map.

**Two structural choices worth naming.** The SELECT is narrowed *as well as* the payload masked, so `bride_phone` never leaves the database on those paths at all — a mask over `select('*')` is one forgotten spread from a leak. And `maskDemoLead` **builds** its output field by field rather than spreading-and-deleting, so a PII column added to the table next month cannot reach a public surface by default. `§5.4` drives that with a synthetic `bride_passport`.

## 4 · DISCLOSURES

1. **`FALLBACK_NAME = 'A bride'` is NOT a vetoed byte.** `bride_name` is `text NOT NULL`, so a blank is a data defect, not a designed state, and this should never render. Named rather than slipped in. If it is ever seen in production, that sighting is itself the finding and the string goes to the veto slot before it stays.
2. **`lead_created` now reports `leadStored` on the demo leg** (it was hardcoded `false`). `enquiry_saved` stays permanently `false` there — `couple_enquiries.vendor_id` references the real vendors plane.
3. **The file header in `enquire.js` was rewritten**, not appended to. It described a demo leg that stored nothing, which the code no longer does; a stale header contradicting its own file is the F-06.85 class.
4. **`monthPhrase` is imported from `demoLeadAlert.js`** rather than reimplemented — one register across the alert's `{{2}}` and the studio, per V9. It carries its `'upcoming'` fallback for a null date, which reads correctly in both places.

## 5 · FOUNDER RESIDUALS

1. **Probe cleanup**, whenever next in the editor:
   ```sql
   delete from public.demo_claim_requests
   where id = 'b1b35466-1166-48e3-ab58-8115782a8c7c';
   ```
2. **The micro** (V7's vetoed byte) is built and still unpushed — the un-vetoed string is live at `dreamos-pwa @ 9b4c751`.

## 6 · NEXT

ZIP 3's sheet, under the vetoed strings and the hydration ruling: the sheet collects neither name nor phone, prefills functions / date / city / budget band from her profile, carries the expectation line, and hands off to wa.me after posting (F1(a)). Then F1(a)'s wiring at `VendorProfileView:220`, the Journey's `Sent`, and the walk card.
