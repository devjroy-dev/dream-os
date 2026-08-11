# TDW_06 · THE BRIDE'S ARRIVAL — RIDER ZIP 2 HANDOVER

**Base tip: `e8a89ba` (the founder's push of ZIP 1), re-derived fetch-first on a
fresh clone. Six files. Zero pwa bytes. Zero migrations. Zero new copy.**

Cures **F-06.180**, **F-06.181** and **F-06.182** — all three found by walk nine,
two of them by the founder reading his own handsets.

---

## §1 · WHAT SHIPPED

**① `src/lib/vendor/vendorHandset.js` (NEW) — the one home.**
`vendorHandset(supabase, vendorId)` resolves `public.users.phone` (col 2, NOT
NULL) through `public.vendors.user_id` (col 2), both witnessed at
`docs/db/PUBLIC_SCHEMA.md`. Typed-reason refusals, never throws. `phone` is
**deliberately not in its vendors select**, and the comment says why: asking for
it is how both mute sites came to believe it existed. Warrant for the lib is the
inline precedent at `vendorInbound.js` — the estate already knew this, once,
unreusably, which is exactly why two sites re-derived it wrongly.

**② BOTH MUTE SITES RE-SEATED.** `relaySeat.js` `relayReceipt` (№14/№15,
**inherited — mute since seating**) and `coupleArrival.js` `tellVendor` (③/⑥,
**mine, one sitting old**). Both previously `return`ed silently on the missing
phone; both now refuse **by name** in the log, because a receipt that declines
without saying why is indistinguishable from "not ours" (F-06.171).

**⑥ F-06.182 — THE MODEL DOES NOT SPEAK ON A RELAY-FIRED ARRIVAL.** At all four
terminals the auto-send's outcome is captured, and when it put bytes on her
handset the couple turn is **skipped and returned from** — no tokens, no
assistant row, so there is no costume to patch afterwards. `.165`'s lesson
honoured by never creating the row. `last_message_at` still updates, so her
thread ordering is untouched. The predicate has one home
(`RELAY_DELIVERED_KINDS = ['sent', 'window_closed_doorbell']`) read by both the
door and the cells.

**The asymmetry is the finding, and it is asserted:** a refusal, an expiry, a
failed send — none of these silence the model, because none of them put anything
in front of her, and a woman who asked a question would be left with silence
from everyone. Only a *delivered* relay earns the skip.

**Each terminal's thread variable was DERIVED from its own `inboundRow` insert**
(`thread` · `stickyThread` · `coupleThread` · `existingThread`), never assumed —
an ordinal is not an identity, and neither is a variable name I remember.

---

## §2 · PROOF

| bench | result |
|---|---|
| **`b06_bride_arrival_bench`** | **71/71** (57 + A8's 8 + A9's 6) · **59/71** at the uncured rider tip |
| `b06_relay_hand_bench` | 126/126 (2 further labelled amendments) |
| foundations · f0613 · forkc | 42/42 · 40/40 · 113/113 |
| tier · billing · micro · selfserve · combined_cap | 81 · 52 · 23 · 30 · 37 |
| meter · f0555 · f0772 | 28/29 · 22/23 · 158/159 — chartered elder reds |
| `npm run build` (tsc 5.9.3 via `npm ci`) | **EXIT 0** |

**BOTH-WAYS, 12 reds at the uncured tip:** A8.2 · A8.6 · A8.7 · A8.8 · A9.1–A9.6
· plus A3.5/A3.6, which were passing on a fixture that asserted a column that
does not exist and are now honest.

**ISOLATION DECLARED:** the uncured tree was given `vendorHandset.js` but **not**
the re-seating, so the reds isolate the *cure* rather than the file's absence.
A8.1/A8.3/A8.4/A8.5 stay green there by construction — they test the resolver
itself, which is new in this ZIP either way.

**A8.2 IS THE GREP-CLASS CELL AND IT HAD TO BE WRITTEN CAREFULLY.** Two shipped
sites legitimately select `phone` **from a joined `users` relation**
(`admin/router.js`, `api/vendor/collab.js`). Those must not red. The cell strips
nested parentheses and asserts only on a bare `phone` in the **top-level**
select list of a `.from('vendors')` chain.

---

## §3 · LABELLED AMENDMENTS — RATIFY-OR-REVERT, COUNTS PRESERVED

6. **`relay_hand` §13.8** — its fixture asserted `vendors.phone`, so the cell
   proved the receipt's *composition* while the shipped path could never reach a
   handset. Re-derived from the schema: `vendors: [{id, user_id}]` +
   `users: [{id, phone}]`. Same property, reachable subject.
7. **`relay_hand` §13.9** — same fixture, same amendment.

Running total for this sitting: **seven**.

---

## §4 · DISCLOSED CONSEQUENCES

- **The model-composed vendor notification is skipped with the turn.** On walk
  nine the vendor received 「 Priya is initiating contact with the vendor. 」 from
  `result.vendorNotification`. He now receives ③ instead, which is truer — it
  names the delivery that actually happened. Flagged because it is a behaviour
  change nobody asked for, arriving as a consequence of the skip.
- **F-06.143 limb 1 is untouched and now loud.** The triple `matched=0 — NO ROW
  CARRIES THIS SID` in walk nine's log is `engine.js`'s sid-less notification
  insert, **outside this sitting's radius**, banked to the shelf with dated
  production evidence.
- **A5 and A6 remain unwitnessed on production.** They are vendor-turn cures and
  walk nine was a bride-turn walk. Bench-grade only; walk ten is their first
  live exposure. **Not claimed.**

---

## §5 · THE SPECIMEN ROW — FOUNDER'S HAND, NOT THE SEAT'S

The false assistant row (「 Perfect, sending that over to you now… 」) sits in her
thread and her next turn would read it as fact — `.165`'s fuel. The correcting
`UPDATE` ships **as SQL for the founder's editor**, self-contained, with
`RETURNING`, expecting exactly one row. No seat hand in production, ever.

**Its replacement text is a byte entering her agent's context and is therefore in
the VETO SLOT, current-vs-proposed, answered before it runs.** It is not
bride-facing — she already received the original on her handset and nothing can
unsend it — but it is model-facing, and this arc has paid for the difference
between those twice.
