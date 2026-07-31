# TDW_07 P5 — F-07.45 BOTH ARMS + F-07.40 FILED · EXECUTOR HANDOVER
**Base:** `dream-os @ 9b84c6d` · **Executor:** Opus-LE (fresh seat, continuation) · **Date:** 2026-07-31
**Rides:** the CE ruling of 2026-07-31 (audit accepted whole; F-07.45 re-described, two arms).
**Rides:** ZIP 1 of 2. The `dreamos-pwa` movement is ZIP 2 and applies AFTER this one.

---

## 1 · WHAT SHIPPED

| # | File | What |
|---|---|---|
| 1 | `src/lib/vendor/waWindow.js` | **NEW.** The vendor 24h window at one home. |
| 2 | `src/api/couple/enquire.js` | F-07.45 **both arms** + F-07.40's fallback wiring. |
| 3 | `src/lib/templates.js` | `enquiry_alert_vendor` registered, `status: 'pending'`. |
| 4 | `scripts/b07_p5_bench.js` | §7 (8 cells) · §8 (4 mutations) · §9 (3 cross-repo cells). |

**Zero DDL.** `0105` unspent. **W-1 clean** — no file under `src/engine/`.

## 2 · PROOF

```
CURED    b07_p5_bench  70 passed,  0 failed  (70)
UNCURED  b07_p5_bench  57 passed, 13 failed  (70)   ← red on exactly the new cures
§6 gate  node --check  3/3 OK
tsc      paired, deps present: origin 0 errors · cured 0 errors
```

Both-ways method: a scratch clone of `9b84c6d` (uncured) and the same clone with this
ZIP applied (cured), the identical bench file in both. §8 breaks **production code** —
four mutations, each asserting its cell goes RED — and restores it.

## 3 · THE FLOOR — AND AN ANOMALY I CANNOT FULLY EXPLAIN

**The paired statement, cured tree, exit-code method:** 87 bench files, **2 red**, and
they are the two named known-reds — `b05_f0555_media_dedupe` 22/23 (F-07.11) and
`b06_meter_bench` (F-06.41). Reproduced across two consecutive runs. Origin reproduces
the same two.

**THE ANOMALY, DISCLOSED NOT PAPERED.** An earlier run of the same loop on the same
trees reported **16 red** — the two above plus fourteen from the b0457/b0498/b05/b06
families. Later runs report two. I chased it and got this far:

- `b06_m1_bench` returned **rc=1 and rc=0 on identical trees in consecutive runs**,
  taking ~55s each time. Run directly and read, it is **45 passed, 0 failed, GREEN**.
- It is a mutation bench: it breaks production files and restores them (`§7.0 every
  mutated file is restored BYTE-IDENTICAL`).

**F-07.46 PROPOSED — the floor is not deterministic.** At least one sealed bench
returns different exit codes on an unchanged tree. Every floor line this estate has
ever inked was produced by this loop, so this is not a P5 defect — it is a claim about
the instrument that graded every prior seal. I am NOT asserting the mechanism (shared
mutation targets under load is a hypothesis, not a derivation). **A floor line is
evidence only if the same tree returns the same answer twice; until this is understood,
every count in this document — mine included — should be read as one sample, not a
measurement.** The chair's ruling is needed on whether P5 can seal over it.

## 4 · THE TWO ARMS

**Transport.** `sendWhatsApp` → `sendWa`. The re-route rides for the corrected reasons
only: typed refusals for all three shapes (two of three previously RETURNED and were
discarded at the old `:190`), window determination before the wire, and the template
path. STOP transfers equivalently (`sendWa.js:201-203`). The window is determined
caller-side and passed as a boolean — the `cron.js:76` precedent, because sendWa's own
checker takes a single `conversationId` and a vendor's inbound may land on any of his
`vendor_self` threads.

**Surface.** `ok` is now bound to the write. Real leg: `ok: leadCreated`. Demo leg:
`ok` false only when a store was ATTEMPTED and FAILED (the alert-only path is by
design, not a failure). `vendor_notified` rides both legs carrying the ping fact.
**The vetoed copy is unchanged**, per the ruling: the toast claims the ROW, not the PING.

## 5 · F-07.40 — RE-DERIVED, AND THE BODY FOR YOUR VETO

Re-derived by command at `9b84c6d` against the live registry. The approved vendor-line
set is exactly three and the answer is still **NO**:

- `morning_nudge_vendor` — claims a morning, **and carries `Reply STOP MORNINGS`**. A
  vendor who paused mornings would silently lose his enquiry alerts. Worse than the gap.
- `crew_assignment` — claims a crew. `payment_reminder` — claims a payment.

`enquiry_alert_vendor` is registered at `status: 'pending'`, wiring **live**, send gated
by `isApproved`. Body, drafted by the retired seat and carried forward verbatim:

> Hi {{1}}, a new enquiry just came in from {{2}} on The Dream Wedding. Open your Leads to see the details: {{3}} — reply here if you need any help.

**File with Meta immediately** (name `tdw_enquiry_alert_vendor`, line vendor, UTILITY).
On approval, flip ONE byte: `status: 'pending'` → `'approved'`. Nothing else to build.

## 6 · §0.2 — A DEFECT FOUND WHILE DERIVING THE FIXTURE, NOT BUILT

**F-07.47 PROPOSED — the demo alert keys `prospects.phone` on an un-normalized value.**
`demoLeadAlert.js:172` matches `.eq('phone', demoVendor.whatsapp_phone)` and `:239`
writes the same raw value. Every other writer in the estate stores the **normalized**
form (digits, country code, no `+` — `sendWa.js:143-145`), and `defaultIsOptedOut`
normalizes before checking. So a `whatsapp_phone` stored as `+919888294440` would:

1. mint a **second** `prospects` row for a number that may already exist normalized, and
2. split its 48h batch state from the marketing lane's, so the batch reads the wrong row.

Consistent within the demo lane alone, which is why no bench caught it. **Not built** —
outside the two arms ruled. The fixture SQL below sidesteps it by storing the
normalized form; that is a workaround at the fixture, not a cure.

## 7 · DISCLOSURES

1. **A second window implementation exists and is NAMED.** `briefing.js:10-41` keeps its
   own inline window block. It is a live cron surface whose function returns REASONS its
   caller branches on (`cron.js:86`); folding it is a real cure with a real regression
   surface and outside this ruling. Declared, not silently widened (§8). The fold is
   offered as a fork.
2. **Three of my own bench cells were caught defective by my own mutations**, all filed
   in-file: async cells registered on the synchronous `t()` (vacuous — they never ran);
   §9.2 aimed at the wrong side of its anchor; §9.3 defeated by a JSX block comment's
   continuation lines, which `code()` cannot strip. All three corrected with the reason
   in-comment.
3. **§9.1–§9.3 pass on BOTH trees.** The arrival-state layer was already at origin. These
   are **regression guards, not cure proofs** — do not read three greens as work done.
4. **§7.7 and §7.8 also pass on both trees.** §7.7 passes uncured for a different reason
   (the key is absent from the registry entirely). Guard cells, named as such.
5. **Test setup, named:** the bench sets `VENDOR_WHATSAPP_NUMBER` because sendWa resolves
   the lane's FROM *before* the template gate (`sendWa.js:195`). Process-level only; no
   shipped file carries it. The first take omitted it and the cell failed honestly.
6. **`vendor_notified` drives NO copy.** A visible line about a refused ping would be a
   new user-facing string and belongs in a veto slot. It is read at one home (the sheet)
   and logged. If you want it visible, that is a veto slot and the strings come to you first.

## 8 · THE FIXTURE — RUN THE SELECT FIRST

**FIXTURE-STATE LAW: production state is unreachable from my container.** Run BLOCK A,
paste the rows back, and the card's step 1 is authored from what you paste — not before.

**BLOCK A — the witness (safe, read-only):**

```sql
-- WITNESS: public.demo_vendors, 14 columns, PUBLIC_SCHEMA.md:378-393.
-- Columns used below all appear in that list: id, ig_handle, display_name,
-- category, city, whatsapp_phone, active, discover_eligible.
select id, ig_handle, display_name, category, city, whatsapp_phone
from public.demo_vendors
where discover_eligible = true and active = true
order by display_name;

-- WITNESS: public.prospects — phone stored NORMALIZED (digits, country code,
-- no '+'), per src/lib/sendWa.js:143-145. Checking whether the walk number
-- already exists, because F-07.47 above means a '+' form would mint a duplicate.
select id, phone, state, notes, last_template_at
from public.prospects
where phone = '919888294440';
```

**BLOCK B — the fixture. COMMENTED OUT ON PURPOSE.** Pick ONE `id` from Block A's first
result, paste it over `PICK_ONE_ID_FROM_BLOCK_A`, then remove the leading `-- ` from the
three statement lines. Do not run it before Block A.

```sql
-- -- Give one demo card the walk number. NORMALIZED FORM, deliberately: see F-07.47.
-- -- WITNESS: demo_vendors.whatsapp_phone is `text` and NULLABLE (PUBLIC_SCHEMA.md:383).
-- update public.demo_vendors set whatsapp_phone = '919888294440' where id = 'PICK_ONE_ID_FROM_BLOCK_A';
--
-- -- A future-dated clash, so the availability hint has something honest to say.
-- -- WITNESS: public.events, 17 columns, PUBLIC_SCHEMA.md:419-437. `kind` must be in
-- -- events_kind_check; 'ceremony' is in that list. `state` must be in
-- -- events_state_check; 'upcoming' is in that list. events_owner_xor requires exactly
-- -- one of vendor_id / couple_id — vendor_id is supplied, couple_id left null.
-- insert into public.events (vendor_id, title, event_date, kind, state)
-- select id, 'Walk fixture — held date', date '2026-12-04', 'ceremony', 'upcoming'
-- from public.vendors where discover_eligible = true and discover_paused = false limit 1;
```

> **This block is withheld-by-comment per the conditional-withheld rule.** It carries a
> placeholder ONLY because the id cannot exist before Block A runs; that is the
> fixture-state law's own ordering, not a §7 violation. If you prefer zero placeholders,
> paste Block A's rows to me and I will hand back Block B fully resolved.

## 9 · THE WALK CARD

You perform and paste; I read the evidence. Steps 3 and 5 are the new ones.

1. **Run BLOCK A. Paste the rows.** (Then BLOCK B, resolved.)
2. Open Discover on your phone. **At the moment a card arrives, before you touch it**, you
   should see the name, the category and city, and the starting price on the closed frame.
   *Evidence: your eye. §9.1 proves the tokens are in the render source; only you can prove
   they are legible.*
3. **Tap Enquire on a REAL vendor you have NOT messaged in 24h.** Send it.
   *Expected: the toast says `Enquiry sent` (or `Enquiry sent ✦ saved in Vendors` if logged
   in). The enquiry IS in his Leads tab. The WhatsApp ping does NOT arrive — the window is
   closed and `enquiry_alert_vendor` is not approved yet.*
   *Evidence: Railway log line beginning `[enquire] VENDOR NOT NOTIFIED` naming the refusal
   as `window_closed`. **That line is the whole point of this sitting** — before today this
   path reported success.*
4. **Tap Enquire on a real vendor who HAS messaged you in the last 24h.** Ping arrives.
   *Evidence: the message on his phone, and no `VENDOR NOT NOTIFIED` line.*
5. **Tap Enquire on the demo card you fixtured.** You receive `tdw_demo_lead_alert` on
   `9888294440`. **Enquire on the same card again within the hour** — no second message.
   *Evidence: one message, then none; `prospects` row for `919888294440` shows
   `state='templated'`, `notes='demo_lead'`.*
6. Open the browser console on the Frost tab during step 3. A `[enquiry] stored, but the
   vendor's WhatsApp ping did not leave` warning should be present.

**NAMED SKIP:** the opted-out and no-lane refusal paths are not walked. Producing them
means opting a real vendor out or breaking an env var on a live service. They are benched
(§7.2–§7.5 drive the predicate; the typed refusals are sendWa's own, benched since Block
05). Named per the floor-method law rather than quietly dropped.

## 10 · NEXT

The chair's ruling on F-07.46 (the non-deterministic floor) before P5 seals · F-07.47's
cure · the `briefing.js` fold fork · the Meta filing's approval clock.
