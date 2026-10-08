# repo: dream-os · base dae04b0 · TDW · CE-47 · INS · PAY-A's two gaps + F-44.427 · HANDOVER

No migration. Built to the door: with any RAZORPAY_PARTNER_* value unset, every door below says "Coming soon".

- (b) THE HAZARD (turn 71): the room lists her invoices as binders (GET /api/v2/vendor/invoices/:vendorId). makeLink now
  resolves a binder that a package invoice names (public.invoices.binder_id) to THAT package invoice before anything else,
  so a package invoice's money always goes to its instalments, never to the binder alone. (b226 4.11, with its mutation.)
- (c) GET /api/v2/vendor/solutions/payment-links/invoices/:binderId: one invoice as the room shows it when she taps it:
  { kind: 'package', invoice_id, owed, owed_text, lines: [pending instalments, each with what is still owed] } or
  { kind: 'binder', owed, owed_text }. Another vendor's, or none: 404 "TDW could not find that invoice." (4.12.) The
  server writes every amount ("Rs 8,000"); the app prints it.
- PATCH /api/v2/vendor/solutions/payment-links/settings { accept_partial: boolean }: her one switch (ruling 7). Only
  accept_partial is written; anything else is refused. thank_you and auto_link do nothing yet and are neither written
  nor drawn until there is a ruling. (4.13, 4.14.)
- F-44.427: b225 stops every Postgres it started, and removes its folder, on SIGTERM and SIGINT, as at its ceiling.
  Proven: killed by `timeout 25` it printed its STOPPED line, and no postgres and no folder were left. A mutation child
  running at that moment is a separate process; it finishes on its own and removes its own Postgres as it ends.

## R-47.1: EVERY LINE A PERSON READS THAT THIS PACKAGE CHANGES OR ADDS, OLD BESIDE NEW
| where | old | new |
|---|---|---|
| connect could not start | Could not start. Try again. | TDW could not start the connection. Please try again. |
| connect link too old or used | This link to Razorpay has expired or was already used. Start again. | This Razorpay link has expired or has already been used. Please start again from this room. |
| Razorpay did not confirm | Razorpay did not confirm the connection. Try again. | Razorpay did not confirm the connection. Please try again. |
| connection not saved | The connection could not be saved. Try again. | TDW could not save the connection. Please try again. |
| not connected | Connect your Razorpay account first. | Your Razorpay account is not connected yet. Please connect it in this room first. |
| nothing owed (instalment) | Nothing is owed on this payment. | Nothing is owed on this instalment. |
| nothing owed (whole) | Nothing is owed. | Nothing is owed on this invoice. |
| reconnect needed | Connect your Razorpay account again. | Razorpay needs your account to be connected again. Please connect it again in this room. |
| link not saved | The link could not be made. Try again. | TDW could not make the link. Please try again. |
| Razorpay made no link | Razorpay did not make the link. Try again. | Razorpay did not make the link. Please try again. |
| invoice not found | Invoice not found. | TDW could not find that invoice. |
| refund failed | The refund could not be taken off. Try again. | TDW could not take the refund off the invoice. Please try again. |
| refund already off | This refund is already off the invoice. | This refund has already been taken off the invoice. |
| cancelled | The invoice is cancelled. | This invoice is cancelled. |
| refund failed (no retry) | The refund could not be taken off. | TDW could not take the refund off the invoice. |
| an unsure payment that is not hers | Payment not found. | TDW could not find that payment. |
| her answer missing | Choose one of the two. | Please choose one of the two answers. |
| hand "Mark as paid" failed (schedules.js) | The payment could not be recorded. Try again. | TDW could not record the payment. Please try again. |
| the client's message (invoiceMessage.js) — THE FOUNDER'S LINE, APPROVED 8 OCTOBER | Pay Rs <amount> online: <link> | You can pay Rs <amount> online at this link: <link> |
| NEW: the switch refused | (new) | TDW did not receive a setting it can save. |
| NEW: the switch not saved | (new) | TDW could not save the setting. Please try again. |
Unchanged, the founder's approved words: "Rs <amount> was received online. TDW could not tell if it is already counted on
this invoice." / "It is already on the invoice" / "Add it to the invoice" / "This payment has already been settled." /
"Try again." "Coming soon" is a tag, not a sentence. Pinning bench amended by label: b224's mutation anchor follows the
new failure line.

## THE FOUNDER'S LINES
| line | status |
|---|---|
| "You can pay Rs <amount> online at this link: <link>" (the client's message, in her name; invoiceMessage.js) | APPROVED by the founder, 8 October, word for word. The old line "Pay Rs <amount> online: <link>" was written by INS (turn 54) and never approved by him; it was never read by a client (its one caller, invoices.js, passes no link). |
| "Rs <amount> was received online. TDW could not tell if it is already counted on this invoice." · "It is already on the invoice" · "Add it to the invoice" · "This payment has already been settled." · "Try again." | APPROVED by the founder, 8 October, word for word. |
The "Mark as paid" failure line is a vendor line in a room INS owns, never the founder's; its new words ride (the chair, 8 October).
