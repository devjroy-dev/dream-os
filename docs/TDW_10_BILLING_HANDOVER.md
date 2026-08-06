# TDW_10 — THE BILLING SITTING · RAZORPAY RAILS
**F-10.22's cure, first half.** Opus LE under the Twenty-Fourth Chair · 2026-08-07
**Built at:** dream-os `798fc1983ca0ac0b3f63f6af3c4e27361587c6dd` · **Radius:** dream-os only, zero pwa bytes.

## WHAT SHIPPED

| File | State | What it is |
|---|---|---|
| `db/migrations/0114_billing_rails.sql` | NEW | `billing_events` + `vendors.billing_status` (CHECKed, default `'none'`) + `vendors.razorpay_subscription_id` |
| `src/lib/billing/razorpay.js` | NEW | Signature verifier + event normaliser. Canon prices as integers. The entitlement table in one readable block. |
| `src/lib/billing/ledger.js` | NEW | **THE SOLE WRITER** of `billing_events`. Idempotent on `event_id`. |
| `src/lib/billing/tierFlip.js` | NEW | **THE ONE FLIP PATH.** Provider-agnostic (TDW_11:59's second feeder joins by adding a caller, not a branch). Lane-gated. |
| `src/index.js` | MOD | `POST /webhook/razorpay` mounted beside the Meta family. Requires the three billing modules. |
| `src/lib/laneFlags.js` | MOD | `billing.tier_flip_enabled: false` |
| `src/api/admin/bridge.js` | MOD | Revenue and halted-subs honest states RETIRED and wired. `trials_expiring` / `credit_state` stay honest. |
| `docs/specs/TDW_09_UIUX_FINAL.md` | MOD | F-10.63 price row cured to canon; F-10.64 trial-law expiry stated; checkout paragraph amended to v2. |
| `docs/FINDINGS_LOG.md` | MOD | F-10.63–.67 entered. |
| `scripts/tdw10_billing_bench.js` | NEW | The four acceptance numbers. 50/50 GREEN cured, 8/8 RED per-cell at pristine `798fc19`. |

## THE ORDER INSIDE THE ROUTE, AND WHY EACH STEP IS WHERE IT IS
`verify → resolve vendor → LEDGER → 200 → link + flip`

- **Verify first, fail closed.** No secret set ⇒ 503, not an open door. Bad signature ⇒ 403. No `x-razorpay-event-id` ⇒ 400, because without the idempotency key a retry cannot be told from a second payment.
- **Ledger before acknowledging.** A failed write returns **500 on purpose** so Razorpay retries. A 200 on an unstored event is money that silently never happened.
- **200 before flipping.** Razorpay requires a 2xx inside five seconds and disables a webhook that fails for 24 hours straight. The flip can never hold the response open.
- **Order-independent.** The flip derives from the event's own subscription state, never from an assumed delivery sequence — Razorpay states plainly that events may arrive out of order.
- **Orphans are ledgered, never dropped.** An event whose Notes carry no resolvable vendor gets its row with `vendor_id` null and flips nothing. A lost event is strictly worse than an orphan row.

## WHAT DRIFTED FROM THE SPEC (all ruled, all recorded)
- The vendor-lane checkout at `TDW_09_UIUX_FINAL:53` did **not** ship. v1 is dashboard Subscription Links (R-BILL.1/.2). The spec paragraph now reads as the chartered v2.
- The spec's `'trial'` default for `billing_status` became `'none'` (R-BILL.6) — F-10.23's semantic stays the founder's.
- Three specified columns declined at birth under wire-or-delete: `razorpay_customer_id` (F-10.66), `loop_discount_pct` (F-10.67), `entitlement_source`.
- `subscription.activated` deliberately does **not** flip a tier. Entitlement follows the CHARGE, never the authorisation — which is also what stops the auto-refunded auth payment from buying a tier.

## NEXT SITTING PICKS UP
F-10.65 (the featured stub, filed RED, untouched) · F-10.23's trial-vs-Free founder ruling · F-10.41's W-1-gated tier caps (this flip writes a tier NAME and enforces no capability — nothing here forecloses it, and nothing here cuts a live trial vendor's AI) · the v2 vendor-lane/native checkout · orphan-row visibility as a Bridge queue line · `docs/db/PUBLIC_SCHEMA.md` regeneration after 0114 runs (NEVER hand-edited — both halves of the dump pipe must run).
