# repo: dream-os @ a3bddb99a64e7491e38c662d9c3e04ce07544efe
# TDW · CE-44 · SEAT LC-2t · CARD 4a · CLOSE NOTE · 2026-09-18

dreamos-pwa stands at `1db8a88e7b30373e220ae5048bc1f7b4fa0cc68a`, untouched.

**Docs-only under C-44.1.** Two paths, both this file and its own manifest.

---

## §1 · C-44.1 · WHAT A DOCS-ONLY DELIVERY IS

The founder, verbatim, 2026-09-18: *"docs only skis the floor. not needed."*

Ruled on his word: a delivery is **docs-only** when every path it writes is under `docs/` or is its
own `scripts/floor-manifest-*.txt`. A docs-only delivery verifies on the guard (HEAD and
`origin/main` at the named base, tree clean), the verbatim unzip, and the dirt check: the dirty
paths equal the manifest's paths exactly and none lies outside `docs/` or the manifest. **No
bench and no floor.** One path outside that definition and it is not docs-only, and R-38.19
applies in full.

---

## §2 · CARD 4a IS CLOSED · THE SEVEN WITNESSES

**Step 1 · the booking with the advance, web thread.** D3 spoke with the deposit's label, `Rs
24,000` in Indian grouping, 18 September 2026, next due 22 January 2027. The witness was the
SELECT on the four tables, the founder's own rows:

```
lead       booked · binder 7c9e4d51 · wedding 2027-02-22
binder     confirmed booking · Swati Test · in 80000 recd 24000
event      Swati Test · wedding · 2027-02-22 · binder 7c9e4d51 lead 7934e4b8
invoice    TDW/DEV440/17 · advance_paid · total 80000 paid 24000 due 2027-01-22
milestone  Deposit, 30% of the fee, on booking · paid · Rs 24000 · paid 18 Sep
milestone  30% one month before the first function (optional) · pending · Rs 24000
milestone  The remainder, on delivery, before the work is handed over · pending · Rs 32000
```

No D1 line, as the split requires: that byte is 4b's.

**Step 2 · the middle payment, from the handset.** D3 again, byte-correct, the invoice at 48,000
of 80,000, next due 8 April 2027.

**Step 3, as first walked · RED, and never reached 4a's code.** Victor called no
`donna_milestone_paid`; he made seven `donna_money_edit` calls and declared the invoice closed
while Rs 32,000 stood pending. F-44.13 and F-44.14 are that turn.

**Step 3, re-walked on 4a-h1's tip with `PACKAGE_MONEY_MIRROR = 1`** — the remainder marked
through the app's own schedule control, not the client card's money edit:

```
invoice    TDW/DEV440/17 · paid · total 80000 paid 80000 due null
milestone  Deposit …                          · paid · Rs 24000 · paid 2026-09-17 18:30:00+00
milestone  30% one month before …             · paid · Rs 24000 · paid 2026-09-17 18:30:00+00
milestone  The remainder, on delivery …       · paid · Rs 32000 · paid 2026-09-18 09:17:40.397+00
binder     Swati Test · paid · amount 80000 received 80000 pending 0
binder     Verma      · none · amount  received  pending          [control]
```

**Binder `7c9e4d51` was repaired by the mirror with nobody editing it.** Received plus pending
now equals the fee. That is R-44.3's purpose witnessed on live rows, and it is the first time the
estate corrected a row Victor broke by its own writer.

Two things worth reading in those rows. The remainder's `paid_at` carries a real clock time
because the PWA's control posts no `received_on` and `schedules.js:164` falls to
`new Date().toISOString()`; the other two carry midnight IST because a date was given. `istDay`
reads both correctly, which is the case it was built for. And the Verma control came back, so an
empty answer could not have been mistaken for a broken join (C-44.4).

**Step 3, the PDF · F-43.82's live witness.** `INVOICE-DEV440-17.pdf`, served from the
`pdf_url` that turn wrote, carries the PAYMENT SCHEDULE block: the deposit 30% on 18 Sep 2026 at
Rs 24,000, the middle payment 30% on 22 Jan 2027 at Rs 24,000, the remainder 40% on 8 Apr 2027 at
Rs 32,000, each Paid. Total Rs 80,000, paid Rs 80,000, balance Rs 0, the PAID stamp, and "Paid in
full — nothing further is due." That block was absent from the chat-served copy before this
packet.

**Step 3, F4 witnessed live.** The founder's SELECT with a control, run after the turn that wrote
`pdf_url`:

```sql
select i.invoice_number, i.state, i.lead_package_id::text,
       case when i.pdf_url is null then 'none' else 'set' end as pdf
from invoices i join leads l on l.id = i.lead_id
where l.phone like '%8595356978' and i.deleted_at is null
union all
select 'control: verma binder', r.client, coalesce(r.stage, 'no stage'), 'n/a'
from engine.records r where r.id = 'f039b198-8c28-4508-9302-9c8ef07455b4';
```

```
TDW/DEV440/17          paid    ca9699da-fad3-49f2-bd3a-165d3b040068   set
control: verma binder  Verma   no stage                                n/a
```

**Two rows and no more.** The package branch served the existing invoice and minted nothing. F4
is proven on the bench and witnessed live by that row and no other way.

**Step 4 · INCONCLUSIVE.** Victor called neither `donna_client` nor `donna_stage`, so V12 never
fired and the cure was not tested. Not a failure: the write was never attempted. V12 stands on
b84's cells, both arms both ways, and its walk witness moves to LC-Victor.

**Step 5 · met.** Railway's deployed tip equalled the pushed tip at every stage (R-40.87).

**Step 6 · struck** by the chair after e-44.5 was found.

---

## §3 · THE FLOOR OF RECORD

**The founder's floor, on the applied tree, 2026-09-18**, run under
`--delivery scripts/floor-manifest-ce44-lc2-p4a-h1.txt --check` in his dream-os Codespace:

```
FLOOR = NAMED BASE, no delta  (refusals, not in base: 4)
```

`[F-14.16] --delivery mode: 8 dirty path(s), all declared` and `[F-14.16] declared files unmoved
— set and contents both verified.`

The set, named, identical to `scripts/floor-base.txt`:

```
ERROR: b5b_movementb_bench
RED: b05_arc_m4_bench · b05_arc_m6_bench · b05_f0550_ping_drain_bench
RED: b05_f0555_media_dedupe_bench · b05_p4_crons_bench · b06_meter_bench
RED: b07_f0772_circle_auth_bench · b07_f0774_stripper_bench · b07_f0791_guard_stack_bench
RED: b07_p4b_body_bench · b07_p5_bench · b08_p1_lifecycle_bench
RED: b08_p5_oow_relay_bench · b08_p5_unblock_bench · b10_p1_search_bench
RED: b10_p2_bridge_bench · b10_p3_mint_deck_bench · b39_telemetry_bench
RED: b51_referrals_bench · b59_g34_reminders_bench · b59_mutations · b61_mutations
```

Twenty-three lines, one ERROR and twenty-two RED. Four `REFUSED` besides — `b06_gauntlet`,
`b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape` — the credential benches,
excluded from the set diff by `--check`.

**R-38.19's topology, c-44.10.** The law says the floor runs "with the sibling repo present".
`tools/preflight.sh:76` to `:79` records that the two repos live in separate codespaces and the
founder's dream-os workspace carries no pwa. In that workspace the floor runs without the
sibling, `run-floor.sh:215`'s NOTE is expected and is not a failure, and `--check`'s set
comparison is the witness.

**§3 of `TDW_CE44_LC2_P4A_HANDOVER.md` is the SEAT'S CONTAINER, batched six ways, and is NOT the
floor of record.** It is retained there as the seat's own pre-cut derivation and must never be
read as the founder's.

---

## §4 · FINDINGS FROM THE CLOSE

**F-44.26 · the door relays Donna to Victor on the vendor's glass.** The line is built at
`src/api/vendor-engine/chat.js:359`:

```js
const OPEN_QUESTION_LINE = (q) => `Still open — Donna asked: ${q}${/[.?!…]$/.test(q) ? '' : '.'} Answer it and she'll finish the filing.`;
```

Assembled by `donnaOpenLine` at `:360`, reached on the SSE route at `:3630` and the JSON route at
`:3735`, streamed live through `scrubText` and persisted through `composedTail`'s `open` slot at
`:3648` and `:3738`. The file discloses at `:355` to `:358` that every rendering rides
`scrubText`, which rewrites `\bDonna\b` to `Operator`, so the vendor reads "Still open — Operator
asked: …". What the firewall does not touch is the rest: the question is relayed **addressed to
Victor by name**, in her voice, with "she'll finish the filing" attached. The vendor is shown two
members of staff talking about him. LC-Victor. Cured nowhere.

**F-44.27 · the chat-served PDF for a package client, confirmed by its own cure.** Asked for
Swati Test's invoice, Victor said there was no invoice document on file and offered to raise one.
Every word was true of the plane he read: binder `7c9e4d51` carries no invoice number and no due
dates, and `donna_invoice_pdf` fires on a binder. He stated that as the absence of the thing
rather than as the limit of his view. Told plainly to raise it, the hand fired, F4 served
`TDW/DEV440/17`, and nothing was minted. **He could always reach it; he could not see that it was
there.** Beside F-44.5. LC-Victor.

**F-44.29 · the schedule block overruns on the couple's document.** In
`src/lib/invoicePdf.js` the schedule block advances each row by a fixed height while a long
`milestone_label` wraps to two lines, so the label overruns the row beneath and the last overruns
the PAYMENT heading. Visible on `INVOICE-DEV440-17.pdf`. It has rendered that way since G2 and was
invisible until now because the chat-served copy never carried a schedule to wrap: **F-43.82's
cure is what exposed it.** Homed in packet 5, dream-os, rung b86; the cure measures the label's
height and advances by it, with cells beside `b55_g2_reviews_bench` §7's pagination cell and the
two longest stored labels as fixtures. **No label is re-worded**: R-43.3 and R-43.10 hold and the
seed ships verbatim.

**F-44.30 · a chip that names the contract, not the deed.** `src/lib/undoContract.js:96`:

```js
summary: `Invoice minted${num ? `: ${num}` : ''}`,
```

Its sibling at `:79` is `summary: 'Money corrected'`, the chip that appeared seven times during
F-44.13. On this turn F4 served an existing invoice and minted nothing, so "minted" was false
while the undo affordance beside it was real. The chip rendered as **"Invoice minted: Invoice"**,
so `num` fell back to a literal rather than the invoice number. A door byte, not Victor's prose.
LC-Victor, item 14. Cured nowhere.

---

## §5 · e-44.13, THE SEAT'S

`TDW_CE44_LC2_P4A_HANDOVER.md` §12 declared itself **final on the founder's floor paste** and
recorded the manifest, the topology and the witness, but **never recorded the result**: not
`FLOOR = NAMED BASE, no delta`, not the twenty-three names, not the four refusals. The only floor
line in that document was the seat's own container, batched six ways, which is not the floor of
record. So the document recorded a floor that was not the floor and omitted the one that was,
which is the wrong way round under R-38.19.

**The cause.** The status line was written before the paste it rests on existed, and the seat
never re-read it after. That is the same class as e-44.9: asserting a state from a file not read,
here a file the seat had written itself. §3 above is the cure, and the marking of the handover's
own §3 line closes the confusion.

---

## §6 · WHAT CARD 4a LEAVES OPEN

Step 4's walk witness for V12, to LC-Victor. F-43.82's remaining question none: it is witnessed.
F-44.26, F-44.27 and F-44.30 to LC-Victor. F-44.29 to packet 5 on b86. F-44.17 and F-44.18 to
LC-3 with the client card. F-44.5 to 4b's read-first, and 4b is held pending LCV-1's read-first
under R-44.4 to R-44.6.

Sequencing beyond this sitting is the founder's.
