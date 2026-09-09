# CE-41 · SEAT D · D3c1 (dream-os) — her reply is the record · HANDOVER

**Cut at** dream-os `1267e43de63d7d888e478890360d9ef8e001750d`. **No migration.**

## 1 · What this closes

R-41.122 gave consent a column. R-41.132 made it evidence rather than a gate. **Both still required the founder to ask in a DM and paste the answer by hand.** This arm closes the loop: when she replies to us on WhatsApp, **her own message is the record** — TDW never typed it, never summarised it, and did not have to.

**`consent_source: 'whatsapp'`, not `instagram_dm`**, and the distinction is Meta's to care about: the DM is a claim TDW makes; this is a message **Meta itself delivered**. Collapsing them would throw away the stronger evidence.

**No migration is owed** — `0156`'s CHECK already admits `whatsapp`. Worth noticing beside `0157`, which *did* have to widen for `founder_attested`: **the value was foreseen, the attestation was not.**

## 2 · Limb (a) is deliberately not asserted here

`consentEvidences` requires her words to contain the number, because **in the DM she is asked to supply it**. On this thread she does not need to — **she is messaging from that number and Meta is the witness.** The reply is stored as her words and `consentEvidences` reads it exactly as it reads any other; if her text happens not to contain the digits, the queue shows no record and the DM path still stands. **This arm makes evidence cheaper to get, never weaker to hold.**

## 3 · Three properties, each asserted

**It never overwrites** — guarded on the absence of an existing record. Evidence is not editable after the fact, the same position `forwardToProspect` takes.

**It never fails the turn.** She has written to us and must get an answer; losing the record costs a line in the queue, throwing would cost the conversation.

**Its place in the arm order is load-bearing:** after `opted_out` and after `discarded`, before the answer is composed. **Someone who said STOP is never recorded as consenting**, a discarded row is not re-consented, and the record lands whatever the reply does.

## 4 · ⚠ The second half is NOT here, and it is a surface

R-41.131 named **two** things: this receiver, and **the per-item `wa.me` link**. Only the receiver is cut.

The link is real work, not a string. The precedent exists — `src/admin/views/detail.js:14` builds `https://wa.me/${TDW_WA_NUMBER}?text=TDW-${handle}` — so the shape would be a prefilled token naming the item, letting her first message tell the receiver **which enquiry** to answer with. That needs three things this packet does not have: **the token's format ruled**, **the marketing number's env name confirmed** (`TDW_WA_NUMBER` is the vendor line's; the marketing line resolves through `MARKETING_PHONE_NUMBER_ID`, which is a Meta id and not a dialable number), and **a rendered surface in the queue for the founder to copy** — which is mock-first and the chair's veto.

**Without the token this arm records consent but cannot reply with the enquiry**, because it does not know which one. That half is honestly outstanding.

## 5 · The founder's steps

1. Apply, verify, push. **No SQL.**
2. **The walk:** send an outsider the join alert, have them reply anything on WhatsApp. Railway shows `[prospects:consent] <phone> recorded from her own reply (R-41.131)`, and the queue row reads **Consent noted** with no tick and no paste.

**Range F-41.107 unspent.**
