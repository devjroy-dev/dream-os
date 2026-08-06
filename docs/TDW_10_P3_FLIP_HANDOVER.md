# TDW_10 · ADMIN P3 · RIDER — THE FLIP

**Base:** dream-os `03dd194` (hotfix 2 verified at origin, byte-identical) · pwa `54a090e`
**Condition:** Meta returned **Active** on `tdw_vendor_welcome`, 2026-08-06, founder screenshot on the record.
**Role:** LE. Nothing pushed. **dream-os only** — the pwa needs no change.

---

## 1 · WHAT SHIPPED — one word, and its evidence

| File | What |
|---|---|
| `src/lib/templates.js` | `vendor_welcome.status: 'draft' → 'approved'` |
| `docs/TEMPLATES.md` | row 8, with the filing history including the rejected first draft |
| `scripts/b10_p3_mint_deck_bench.js` | the two dark-lane cells INVERTED, retired assertions recorded verbatim |

**Zero code paths changed.** `sendWa`'s gate reads `isApproved` and nothing else, so this one word is the entire difference between the mint's `Send welcome` refusing and sending. That is exactly the shape the wired-and-dark design was for: the founder files, Meta rules, one field moves, no logic redeployed.

**Why `Active – Quality pending` is approved, and why that is not my reading.** It is the estate's own precedent, twice: `tdw_demo_lead_alert` shipped `approved` from that identical dashboard state at TDW_07 P2, and `tdw_enquiry_alert_vendor`'s in-file paragraph states the rule verbatim — *"Quality pending is the QUALITY RATING, not the review state; Active is the approval."* Cited rather than re-derived from scratch.

---

## 2 · THE TWO CELLS THAT INVERTED, AND WHY THEY ARE RECORDED NOT REPLACED

They read, until today:

```js
ok('vendor_welcome ships at status draft — wired and dark', w.status === 'draft');
ok('isApproved refuses it, so sendWa cannot dispatch it', isApproved('vendor_welcome') === false);
```

Both were correct while the template was in review, and both are wrong now. They are quoted verbatim in the bench rather than silently overwritten, because **the wired-and-dark state was real and was proven on production**: three refusals in `admin_activity_log`, reason `template_not_approved`, founder-walked at 17:11–17:12 UTC. A bench that erases the state it used to guard leaves no evidence the gate ever worked, and the gate working is the whole argument for shipping dark lanes at all.

Four cells replace them: the status, the gate, **the gate agreeing with the field** (one authority, not two), and a built payload carrying the filed name, the filed language and exactly one body parameter.

---

## 3 · PROOF

- `b10_p3_mint_deck_bench` **120/120** (was 116; +4 net on the flip)
- Floor: `b10_p2_bridge 82/82` · `b10_p1_search 45/45` · `tdw09_micro 23/23` · engine build exit 0
- The four known-reds reproduce exactly as attributed, no fifth: meter `28/29` · f0555 `22/23` · f0772 `158/159` · p4b_body `75/76`

**Method note, disclosed because it nearly became a number.** The first bench run after the edit read `68/120` — every router cell red. That was `node_modules` absent in a fresh clone, not a regression: the routers could not load. Same missing-dependency artefact caught at the P3 read-first, caught again here. **A floor number taken against an unmet precondition is not a floor number**, and it is worth writing down twice because it looks exactly like a catastrophe on first read.

---

## 4 · WHAT HAPPENS THE MOMENT THIS IS PUSHED

`Send welcome` stops refusing. **The next tap sends a real WhatsApp message to a real vendor's number** — no confirm, no undo, one tap from the mint's success card.

Hotfix 2 is what makes that safe to watch: the result is now a typed outcome with its own eyebrow and colour, and a send reads **Sent** / *Sent to {name} on WhatsApp.* rather than a line indistinguishable from the refusal it replaced. Without that, the first live send would have looked exactly like the three refusals before it.

**Suggested first send: Archie Photography (`+919327715877`)** — minted during the walk, no other traffic, and the message is true of her: her account exists and does need completing. Not Swati; she is mid-walk and her lane is already carrying test state.

---

## 5 · WHAT REMAINS OPEN

- **Acceptance number 2's live witness** — parked by founder word; bench-proven, twelve cells + M1.
- **The reject-undo** — one tap writes a decision the vendor sees, no confirm, no undo. Still unruled.
- **F-10.52** the frozen ten aesthetic tags · **F-10.53** the samples step (founder-ruled 「 legacy era, no bearing whatsoever 」 → delete the step, own sitting with a copy pass).
- **F-10.49** the two pre-existing stripper-rot cells in P1's and P2's own benches.
- **F-10.48** the fourth couple-birth writer · **F-10.44's** full cure (DDL, 0113's sitting).
- **Underived observation:** a DELETE 404 alongside a *Photo removed* toast on the vendor portfolio, count moving correctly.

No new finding numbers spent. Next free: **F-10.57**.

*Sequencing beyond this sitting is the founder's.*
