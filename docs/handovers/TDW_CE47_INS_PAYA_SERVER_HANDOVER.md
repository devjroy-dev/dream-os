# repo: dream-os · base 2d349dcdd714 · TDW · CE-47 · INS · PAY-A SERVER · HANDOVER

Payment links in her OWN Razorpay account (Technology Partner OAuth). Money goes from her client straight to her; TDW
takes no fee and no commission; none is read, stored or worded anywhere (the founder, 7 October 2026). BUILT TO THE DOOR,
NOT SWITCHED ON: until the four RAZORPAY_PARTNER_* values are set (after Razorpay approves ticket 21269027) every door
answers "Coming soon" and no partner call is made.

## THE LANDING ORDER — IN THIS ORDER, NO OTHER
1. APPLY db/migrations/0201_payment_links.sql IN SUPABASE.
2. RUN docs/handovers/PAYA_0201_SUPABASE_CHECK.sql. ONE ROW OF EIGHT t. ANY f, OR A "STOP" LINE: PUSH NOTHING, PASTE IT BACK.
3. APPLY db/migrations/0202_pay_oauth_states.sql.
4. RUN docs/handovers/PAYA_0202_SUPABASE_CHECK.sql. ONE ROW OF EIGHT t. ANY f, OR A "STOP" LINE: PUSH NOTHING, PASTE IT BACK.
5. ONLY THEN PUSH. With the code live and the functions missing, every hand "mark as paid" answers RPC_ERROR
   ("The payment could not be recorded. Try again.") and changes nothing.
BLOCK 3 REFUSES TO PUSH unless both rows are typed: PAYA_CHECK='t t t t t t t t' and PAYA_CHECK_2='t t t t t t t t'.
Each check opens with a guard that STOPS, before writing anything, if any trigger other than invoices_set_updated_at sits
on the tables it writes (a dashboard "Database Webhook" cannot be seen in the repo). Each runs in about 50 ms inside
BEGIN … ROLLBACK and leaves nothing behind; invoices is in supabase_realtime, which sends only committed changes.
OUT_OF_ORDER.json records 201 and 202 are WEB-4's.

## RAILWAY VALUES (the founder sets them only after Razorpay approves)
- RAZORPAY_PARTNER_CLIENT_ID      — the app's id at Razorpay. Unset: every door "Coming soon", no partner call.
- RAZORPAY_PARTNER_CLIENT_SECRET  — the code exchange, and the key that signs the connect `state`. Unset: the same.
- RAZORPAY_PARTNER_WEBHOOK_SECRET — PAY-A's OWN webhook secret (never TDW's billing RAZORPAY_WEBHOOK_SECRET). Unset:
                                    /webhook/razorpay-partner answers 404 and accepts nothing.
- RAZORPAY_PARTNER_REDIRECT_URI   — where Razorpay sends her back after "Connect". Unset: the same "Coming soon".
All four must be set for anything to switch on; any one unset keeps the whole room "Coming soon" (b226 §1).
INTEGRATION_TOKEN_KEY (already set for other rooms) seals her Razorpay token; nothing stores it in the clear.

## SUPABASE'S ADVISOR WILL SAY "search_path mutable" FOR PAY-A's FUNCTIONS. ACCEPTED HERE; DO NOT "FIX" IT.
They run with the CALLER's rights, every object inside is written public.<name>, and only service_role may EXECUTE them.
Setting a search_path would turn b91_rls_ladder red (2.1, 7.17).

## HOW TO STEP BACK
Revert the commit: markMilestonePaid's JS add returns exactly as it was, and the hand "mark as paid" works with no
database change. 0201's and 0202's tables and functions can stay: nothing outside PAY-A reads them once reverted, and
they hold no money of their own (the money is in her account).

## WHAT IS IN IT
- 0201 (frozen 18dbb3f0…): vendor_pay_accounts, vendor_pay_links, vendor_pay_events, vendor_pay_settings;
  pay_record_milestone, pay_settle_invoice, pay_record_invoice. ONCE ONLY by (provider, payment id, kind); ONE STEP in
  the database; ONE LOCK ORDER (the invoice row first, then lines); money that arrived is never dropped (kept, not
  applied, with its reason); a cancelled invoice never moves.
- 0202: TWO tables (vendor_pay_oauth_states, vendor_pay_event_answers); ALTERs on vendor_pay_links (binder_id; invoice_id
  DROP NOT NULL; vendor_pay_links_one_home CHECK num_nonnulls(invoice_id, binder_id) = 1), vendor_pay_events (binder_id,
  claimed_at, binder_base_received) and vendor_pay_settings (accept_partial, default false); the reason CHECK
  vendor_pay_events_not_applied_reason_check DROPPED AND RE-ADDED BY NAME with BINDER_PENDING and BINDER_UNCERTAIN;
  functions pay_sweep_oauth_states, pay_take_off_refund, pay_hold_binder_payment, pay_claim_binder_event,
  pay_keep_binder_base, pay_finish_binder_event, pay_resolve_binder_event; EXECUTE for service_role only.
- src/lib/vendor/schedules.js: F-44.320 cured; money only through pay_record_milestone; whole rupees checked before any
  call (BAD_AMOUNT); an rpc error answers RPC_ERROR and changes nothing, with NO fallback to a JS add.
- src/lib/vendor/paymentReminders.js: a part-paid line's reminder asks only for what is still owed.
- src/lib/vendor/payRazorpay.js, payLinks.js; src/api/vendor/solutions/paylinks.js; src/api/webhooks/razorpayPartner.js.
- ONE LINE EACH in: src/index.js (above /webhook/razorpay, not inside it), src/api/vendor/solutions/index.js,
  src/lib/invoiceMessage.js (a "Pay Rs X online" line only when a link is passed; today's messages unchanged), and
  src/cron.js (the binder sweep at '9,24,39,54', clear of every band and PTN's drain 2-59/5).
- scripts/b83 amended by label (its double models the function; M11 retired to b225 2b.2).

## (b) A PAYMENT ON A BINDER-ONLY INVOICE
Held first (once only), answered 200, then applied: claim (one apply per binder at a time, an advisory lock per binder);
base kept once under the claim; write base + amount through the payments door's own call (donna_money_edit with
amount_received, amount_pending = max(0, total − received), payment_status, exactly as invoices.js :373-383 — a hand
donna_money_edit in the same instant can change those same three fields); flip only on the engine's success. A retry
compares: base + amount → flip only; base → write then flip; anything else → BINDER_UNCERTAIN, shown to her, never
guessed, never answered by a sweep. Her answers are one row per round, never overwritten.
F-44.371, NOT CURED HERE: the hand payments door (invoices.js :354) reads and writes the sum with no guard. A link payment
and a HAND entry in the same instant on one binder can lose one of the two amounts, or, if the hand entry lands between
the read and the write, hold the payment as BINDER_UNCERTAIN with "Rs <amount> was received online. TDW could not tell
if it is already counted on this invoice." The claim covers webhook against webhook only.

## THE ROOM'S WORDS FOR THAT PAYMENT (the chair's working version, with the founder for his yes)
line "Rs <amount> was received online. TDW could not tell if it is already counted on this invoice." · one "It is already
on the invoice" · two "Add it to the invoice" · done "This payment has already been settled." · fail "Try again." · not
hers "Payment not found." The server sends the amount written (whole rupees, Indian comma); the app prints it.

## PROOF
- b224 (a MODEL of the function in its double) · b226 (a MODEL of 0202's functions) · b227 (a MODEL of the recorder):
  each states it is a model; THE REAL SQL is b225 (0201 then 0202 verbatim on a fresh Postgres per run, with a mutation
  per cure) and the founder's two checks, which are THE JUDGE. b225 is CONTAINER PROOF: with no Postgres it prints NOT
  RUN and counts as NOT RUN, never green.
- Relative figures only in every money cell: no cell holds a figure that can land on base + amount by chance.
- b224 on a clean base: whole, 4 PASS · 11 FAIL (the cure's cells red, its three mutations finding no anchor); with
  B224_ROOT set (mutations skipped), 4 PASS · 8 FAIL. Both red, as they must be.
