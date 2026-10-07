# repo: dream-os · base a1c44e9 · CE-47 · F-44.416 · the partnerPlan guard · handover

What it fixes: every subscription event on the Razorpay account reaches /webhook/razorpay, the partner plan's included.
The partner plan is Rs 2,999 a month, the same paise as Prestige (TIER_PAISE.prestige = 299900). Its plan id matches no
vendor variable, so tierFromPlan fell back by amount and read it as Prestige. Only missing data stood between a partner
payment and a vendor made Prestige.

The change (two production files, ruled by the chair 7 Oct 2026):
- src/lib/billing/razorpay.js: partnerPlanOf(sub), and in normalizeRazorpayEvent the check comes FIRST, before any tier
  is read. A partnerPlan event is one whose subscription plan_id equals RAZORPAY_PLAN_PARTNERPLAN, or whose notes carry
  a non-empty text partner_id, either one alone. For it: tier null, entitlement null, notes_vendor_id null, and
  partner_plan { partner_id } (a resolution field, not a ledger column). Every other event is returned exactly as before.
  verifyRazorpaySignature, tierFromPlan, entitlementFor, TIER_PAISE and BASE_TIER are byte for byte (b294 6.3).
- src/index.js, two lines inside the /webhook/razorpay block only:
    vendorId = normalized.partner_plan ? null : await tierFlip.resolveVendor(supabase, {
    if (!vendorId && !normalized.partner_plan) {        (no ORPHAN warning for a partner payment)
  Nothing else in index.js moves.

Environment (Railway dream-os): RAZORPAY_PLAN_PARTNERPLAN = the partner plan's id, when the founder makes the plan in
Razorpay (A2-2). Until it is set, notes.partner_id alone is recognised; the plan id alone is not (b294 2.6). A2-2 plants
both, so every partner event meets two guards.

WHAT THE LEDGER ROW HOLDS FOR A partnerPlan EVENT (b294 §5, through the fakes, with the real ledger.js):
one insert into billing_events, the same ten columns as every row: event_id, provider 'razorpay', event, vendor_id NULL,
provider_subscription_id, provider_payment_id, amount_paise and currency as Razorpay sent them, counts_as_revenue true on
a captured charge (partner plan money is TDW revenue, as ruled), and the whole payload with notes.partner_id in it.
NO VENDOR ROW IS READ OR WRITTEN: it is the only table operation of the event. No vendors read by subscription id or by
notes, no subscription link, no flip (b294 5.4). The door still answers 200, inside the five-second law.
The chair's case holds (b294 §4): a partnerPlan event whose notes carry a real vendor's id AND whose subscription id is
already linked to a vendor changes no vendor, and reads none, by either resolve route.

Rs 2,999 on an unrecognised plan: WITH a partner note, never Prestige (3.1). WITHOUT one, exactly as today: the amount
fallback reads prestige (3.2). That is safe because a flip needs a vendor, and a vendor resolves only from notes.vendor_id
or a subscription id already linked to her; a partner subscription carries neither, so the event is an orphan, ledgered,
and nothing flips (3.3, driven through the route).

b294 drives THE ROUTE'S REAL BYTES: the /webhook/razorpay handler is lifted from src/index.js (base and tree alike) and
run with the real tierFlip.js, ledger.js and laneFlags.js (flip lane ON, its cache cleared before every drive) against a
fake that records every table operation. Base is git HEAD (before block 3, HEAD is the base).
- §1 the table: 9 events x 9 plan routes x 4 vendor states = 324 cases. Base against tree: identical normalised event,
  status, every table operation (each ledger row byte for byte), vendor rows after, and log lines. 1.3 control: a
  vendor's Rs 2,999 charge still makes her Prestige.
- §2 recognised FIRST: for a partnerPlan event the vendor plan variables are read 0 times (tierFromPlan never runs).
- 6.2 reads ONLY the /webhook/razorpay block: exactly the two guard lines move inside it. Lines outside the block are
  never compared, so the app.post line INS will add above the block cannot redden it. 6.2a proves that with such a line
  added above the block, in the tree alone and in both base and tree.

Proofs in the seat's container (base a1c44e9):
- b294 23/0. RED at the clean base (STOP: its mutation anchors are absent).
- --mutate 10/0, each restored byte for byte: plan-id recognition dropped reddens 2.2; notes recognition dropped 2.3;
  the check moved after tierFromPlan 2.5; a vendor amount changed 1.2 (the table bites); the index.js guard line dropped
  4.2.
- The billing radius by grep (every bench that names billing/razorpay, tierFlip, ledger, razorpaySubscriptions,
  billing_events or /webhook/razorpay), the money benches, and the e-274 walkers alone; identical exits and counts at
  base and cut: tdw10_billing 52/0, tdw10_selfserve 30/0, tdw10_tier 81/0, tdw10_combined_cap 38/0, b0455_money_loop
  73/0, b46_money_books 29/0, b47_money_crossing 23/0, b63_f1_model_routes green, b07_f0789 19/0, b128 13/0, b91 53/0,
  b15 green, bOB green.
- No timing cell, so no 20-run series (e-275).
