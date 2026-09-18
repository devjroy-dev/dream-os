# repo: dream-os @ 7b4f88835b6d57c3d3aab41061d1c3461e2dfcf0
# TDW · CE-44 · SEAT LC-2t · PACKET 5 · HANDOVER · 2026-09-18

dreamos-pwa stands at `1db8a88e7b30373e220ae5048bc1f7b4fa0cc68a`, untouched by this packet.
Rung **b85**. **No engine file is in this packet.**

The read-first rides inside this document, as the chair ruled, rather than costing a second
docs cut and a second floor.

---

## §1 · THE FIVE SEAMS

### Seam 1 · F-44.6's route byte

The founder, verbatim: *"the change package button does not give an option of altering the
payment schedule. it doesnt mirror the package page. i had to change package from package room,
then change package on the lead."*

`EDITABLE` at `leadPackages.js:47` and the new `OVERLAY_KEYS` beside it both gain `deposit_pct`,
`middle_pct`, `middle_enabled`, `delivery_basis` and `delivery_days`. The overlay at `:97` reads
`OVERLAY_KEYS`.

**One door.** There is no PATCH route on this router: `GET /:leadId/package`,
`POST /:leadId/package` and `POST /:leadId/promote`, and nothing else. `Change package` is a
re-attach, which retires the live `lead_packages` row and inserts a fresh one. So widening the
accept-list and the overlay together is the whole cure. **c-44.13's ruling stands in substance
and falls in its reason**: the chair ruled from `SNAPSHOT_KEYS` alone and never read the overlay.

**`delivery_on` is in `EDITABLE` and not in `OVERLAY_KEYS`**, deliberately: it is not a package
column and reaches `computeSchedule` on its own at `:110`.

Nothing downstream moves. `validatePackage` in `packages.js` is the one home and already
validates all five, including the remainder gate where the shares reach 100, and
`computeSchedule` already rebuilds `lp.schedule` from `v.row`'s shares. **No new validation, no
new formatter, no new byte.** The vendor's own `vendor_packages` row is untouched by an edited
attach, which R-43.3 requires and b85 §1.7 pins.

### Seam 2 · F-44.31's server half

**What it stops, derived on the tree.** A re-attach retires the live `lead_packages` row at
`:118` and inserts a fresh one at `:127` with a new id, a fresh `schedule` and a fresh
`delivery_on`. Nothing else moves: the invoice keeps its `lead_package_id` on the **retired**
row, its `amount_total`, its `payment_schedules` rows and its `due_date`, and F4 in
`generateInvoiceForBinder` keeps serving it. The package card and the couple's invoice would
disagree in silence, and the money she is owed would not follow the fee just changed. **That was
already reachable through `total` alone**; widening the accept-list opens five more ways in.

The attach route now reads `state` and `binder_id` with the lead it already reads at `:76`, and
refuses a booked lead's re-attach with `422 refused`, code `already_booked`, **no sentence**
(F-43.86 (b1): the door owns the code, the PWA owns the line).

**The token.** `already_booked`, `snake_case`, naming the obstacle, as `no_package`, `no_fee`,
`no_wedding_date` and `no_handover_date` do. A bare `booked` would have been the only one-word
code on the lane and would have read as a state rather than an obstacle.

**The test is promotion, not payment.** A lead booked with no advance is locked exactly as one
with an advance. `invoices.js:341` tests `amount_received > 0` and so lets a booked-but-unpaid
couple through; this route does not repeat that gap (b85 §2.5).

**Raised before the package is read**, so a refused re-attach does no soft-delete, no insert and
no wasted query (b85 §2.3, §2.4).

**IT IS A HOLDING POSITION, NOT THE ANSWER.** The proper post-booking change, where the invoice
and its instalments move with the package, is **F-44.17's and LC-3's**, and **F-44.17's scope now
includes "change package after booking" as well as "a sale outside the package"**. Until that is
built the honest act is to refuse rather than to let two records drift apart.

**R-44.12** (founder), 2026-09-18, his byte for the code, recorded here so it does not live only
in chat until the pwa half is cut. The chair's suggestion, which he approved with *"OK TO YUR
SUGGESTION."*:

```
This couple is booked. The package is fixed on their invoice.
```

It maps to `already_booked` in `lib/worklist/packages.ts` beside `no_package` and `no_fee`
(`:115`), **in the pwa half on b83, not here**. Under R-43.16 it is a refusal and a control in
one: it names why. It offers no way forward because none exists until F-44.17. **Until that byte
lands the pwa falls to `fieldGate`, "Check the highlighted field.", which is honest and
unhelpful.**

### Seam 3 · the promote route's unknown-key filter

`POST /:leadId/promote` reads `kind` and `advance_received_on` and had no filter, so an unknown
key was **ignored in silence**. That is the shape that made F-44.6 dangerous on the door above.
It now carries the same filter the attach route has had since packet 2 at `:72`, answering
`422 invalid` with the field named, which is the refusal its own contract at `:153` already
documents. **No new byte.**

**c-44.16 and e-44.15, recorded together.** The chair told the founder a sheet sending the five
would fail with no error, having read `:95` to `:101` and not `:72`; the seat told the chair the
same thing from the same half-reading. **The attach route has always refused an unknown key
loudly**, `422 invalid` with the field named, which the pwa maps to `fieldGate`. The silence was
only ever on the promote route, and this seam closes it.

### Seam 4 · F-44.29, the schedule row

In `src/lib/invoicePdf.js` the schedule row advanced by a flat `y += 14` while a long
`milestone_label` wrapped to two lines, so the label overran the row beneath and the last overran
the PAYMENT heading. **Measured on this renderer's own font at this column's own width, 146pt:**
the deposit label needs 142pt and stands 10.4pt tall on one line; `30% one month before the first
function (optional)` needs 197pt and `The remainder, on delivery, before the work is handed over`
needs 234pt, so both wrap to two lines at 20.8pt. Against a 14pt row that is a ~7pt overrun each.

The row now takes `Math.max(14, Math.ceil(heightOfString(label, { width: cellWidth(0) })))`, so a
one-line label renders byte-identically to before and a wrapped one gets the height it needs.

**It rendered that way since G2 and was invisible until CE-44**, because the chat-served copy
never carried a schedule to wrap until F-43.82's cure gave it one. The cure that exposed it is
what made it findable.

**Three fixtures, as ruled**: the longest stored label; the middle label at a two-digit share;
and one synthetic label long enough to wrap to three lines, **so the cure is proven a measurement
and not a fit to two strings**. **No label is re-worded**: R-43.3 and R-43.10 hold and the seed
ships verbatim. The page grows to fit the founder's bytes rather than the bytes being cut to fit
the page.

### Seam 5 · F-43.26, the merge hand, and the split half struck

F-43.26 (`TDW_CE43_LC1_HANDOVER.md:94`) says `donna_merge` and `donna_split` date changes are not
dragged by the lockstep.

**The merge half is a real gap.** `donna_merge` folds the cells she names onto the survivor,
`date` among them (`recordPrimitives.ts`'s `k in input` loop), keyed by `survivor_id`. Both
collectors, `calendarSignals.js:450` and `chat.js:2748`, admitted only `donna_date` and
`donna_edit` and read `input.binder_id`, so a merge naming a new date left the survivor's linked
event standing on the old one. **Two additions, one per collector file**, each admitting
`donna_merge` and reading `survivor_id`.

**THE SPLIT HALF IS STRUCK** (chair, CE-44), with the evidence, so no later seat goes looking for
it. `donna_split` puts the named date on a **new** record; the source keeps its own date and gets
only a breadcrumb; a new binder has no linked event for the lockstep to move; and its id exists
only in the display, which no gate may parse (CE-215). `bookingEvent.js:82` to `:86` already
takes `binder_id`, `survivor_id` and `source_id` and parses the created id, so the new binder
gets its event through `ensureBookingEvents`. **A line for it in either collector could never
fire, so none is written**, and b85 §5.3 and §5.9 pin that.

**THE TWO COLLECTORS ARE NOT IDENTICAL AND ARE NOT MADE SO.** `chat.js` carries `isErr` and
`isDateUnchanged`, so a refused or no-op merge mirrors nothing; `calendarSignals.js` has never
carried those guards for any hand and does not gain them for this one. Widening a sibling's
behaviour while curing a finding is how a second defect rides in unnamed. b85 §5.4 and §5.5 pin
both halves of that.

---

## §2 · ONE REPORT, NO CURE · THE RETIRED BINDER'S EVENT

The chair asked what becomes of the retired binder's linked event after a merge.

`donna_merge` does not delete the retired record. It sets `hidden: true` with `hidden_at` and a
`reason_for_action` breadcrumb, and logs `merge_retire`, "set aside (recoverable)". So **any
calendar row whose `linked_binder_id` is the retired id keeps pointing at a hidden record.**
`ensureBookingEvents` filters `hidden = false` when it *creates*, but nothing revisits an event
that already exists.

So after a merge the vendor's calendar can hold a row for a binder that has been set aside, and
the lockstep will never move it again because no hand names that id any more. **Candidate for the
chair to number. Not packet 5's to fix, and nothing here touches it.**

---

## §3 · THE FILES

| file | what |
|---|---|
| `src/api/vendor/leadPackages.js` | seams 1, 2 and 3: the widened accept-list and overlay, `already_booked`, the promote filter |
| `src/lib/invoicePdf.js` | seam 4: the schedule row advances by the label's measured height |
| `src/lib/vendor/calendarSignals.js` | seam 5: the merge hand, keyed on `survivor_id` |
| `src/api/vendor-engine/chat.js` | seam 5: the same, with this file's own `isErr` guard |
| `scripts/b85_lc2_p5_bench.js` | NEW, rung b85 |
| `scripts/b82_lc2_p2_packages_bench.js` | §4.9 amended by label (below) |
| `docs/handovers/TDW_CE44_LC2_P5_HANDOVER.md` | this document |
| `scripts/floor-manifest-ce44-lc2-p5.txt` | the declared dirt |

---

## §4 · WHAT IS PROVEN

**b85: 50 ok, 0 failed, 7 mutations all biting.** Both ways: on a fresh clone of `7b4f888` with
the bench copied in and the engine built, **17 ok, 33 failed, 0 mutations biting**.

**The labelled amendment, by full file name and count.**
`scripts/b82_lc2_p2_packages_bench.js`, cell §4.9, **67 before, 67 after**. It read "F23: only
the five edits are accepted (a share cannot change per couple)" and drove `deposit_pct`, which
F-44.6 now accepts. **Re-aimed, teeth kept, count preserved, subject untouched**: the cell has
always asserted that the accept-list is closed and that a key outside it is refused by name, and
it still does, now on `not_a_field`, which is outside the list in both worlds. **It holds at base
as well as on the cured tree**, which is what a labelled amendment must do.

**The floor**, batched six ways: the RED and ERROR set equals `scripts/floor-base.txt` exactly,
23 lines, no delta either way. The only extra lines are the four `REFUSED` the seat's container
earns for absent credentials, re-derived and not quoted. **The founder's floor on the applied
tree is the floor of record**; this line is the seat's container and is not it.

**Not run in the seat's container, declared:** the real database; the rendered page on glass (the
PDF is judged by opening it); the four environment-refused benches.

---

## §5 · WHAT THIS PACKET DOES NOT CARRY

The mirror step has landed (R-44.3). LC-2's close handover, roadmap Amendment 4 and R-43.11's
master amendment become a **docs-only cut after the pwa half walks**, not part of this packet.

The pwa half on b83 carries F-44.6's sheet, R-44.12's byte for `already_booked`, F-44.3,
R-44.10 and R-44.11, F-43.121, F-43.122, F-44.4 and the iOS SELECT. Its read-first is at origin
as `TDW_CE44_LC2_P4PWA_READFIRST.md`.

**R-44.11** (founder), 2026-09-18, *"ok. first one"*: after a save the wishbone sheet advances to
the next missing cell and renders it **without focus**; the keyboard rises only on her tap in the
field. Recorded here so the byte does not live only in chat; **it belongs to the pwa half's
handover** and nothing in this packet changes for it.

---

## §6 · CARD P5 · THE WALK

**For a reader who has not followed this sitting.** Three steps. Each says what to do, what
should happen, and the query that proves it. Every query carries a control row, so an empty
answer cannot be mistaken for a broken query.

**Before step 1.** Open the dream-os service on Railway:
**https://railway.com/project/5e4baabf-90d5-4bbc-989b-9f7fac6123e4/service/abec302c-d08a-41c0-8334-18cf81e9a5b9**
and confirm the active deployment carries the tip you pushed for this packet. Nothing below is
meaningful until it does.

### Step 1 · a re-attach with a changed share, on an UNBOOKED lead

In the vendor PWA, open **Leads** and pick a lead that is **not** booked and has a wedding date.
On its package card tap **Change package** (or **Attach package** if it has none), pick a
package, set a fee, and attach.

*This is the step the new fields are for, and the sheet does not show them yet:* the sheet is the
pwa half's work on b83. So for now the proof is that the door accepts them. Until the sheet
ships, this step proves the ordinary attach still works and writes a schedule.

**What you should see.** The card shows the package, the fee and the schedule lines, and a toast
reading `Package attached.`

**The query.** Replace `<LEAD PHONE>` with that lead's phone.

```sql
select 'lead package' as t, lp.total::text as a,
       jsonb_pretty(to_jsonb(lp.schedule)) as b
from lead_packages lp
join leads l on l.id = lp.lead_id
where l.phone like '%<LEAD PHONE>' and lp.deleted_at is null
union all
select 'control: swati test', l2.state, coalesce(l2.binder_id::text, 'no binder')
from leads l2 where l2.phone like '%8595356978' and l2.deleted_at is null;
```

**Green:** one live lead-package row with its schedule, and the control row showing Swati Test
`booked`. If the control row is missing, the query is broken rather than the data.

### Step 2 · a re-attach on a BOOKED lead is refused, and nothing moves

Open **Leads**, open **Swati Test**, and on her package card tap **Change package**. Pick any
package and attach.

**What you should see.** It is refused. Until the founder's byte lands in the pwa half, the line
you get will be `Check the highlighted field.`, which is unhelpful but honest; the sentence
approved for it is *This couple is booked. The package is fixed on their invoice.*

**What must NOT happen:** her package must not change, no new lead-package row may appear, and
her invoice must be untouched.

```sql
select 'her live package' as t, lp.id::text as a, lp.total::text as b
from lead_packages lp join leads l on l.id = lp.lead_id
where l.phone like '%8595356978' and lp.deleted_at is null
union all
select 'her retired packages', count(*)::text, ''
from lead_packages lp2 join leads l2 on l2.id = lp2.lead_id
where l2.phone like '%8595356978' and lp2.deleted_at is not null
union all
select 'her invoice', i.invoice_number, concat(i.state, ' total ', i.amount_total)
from invoices i join leads l3 on l3.id = i.lead_id
where l3.phone like '%8595356978' and i.deleted_at is null
union all
select 'control: verma binder', r.client, coalesce(r.stage, 'no stage')
from engine.records r where r.id = 'f039b198-8c28-4508-9302-9c8ef07455b4';
```

**Green:** exactly one live package for her with `total` **80000** and the same id as before;
`her retired packages` unchanged from before the tap; one invoice, `paid`, total 80000; and the
Verma control present.

### Step 3 · the invoice PDF's schedule does not overlap

Open **Invoices**, open Swati Test's invoice `TDW/DEV440/17`, and tap **Download PDF**.

**What you should see.** The PAYMENT SCHEDULE block with three lines. The two long labels, `30%
one month before the first function (optional)` and `The remainder, on delivery, before the work
is handed over`, each wrap onto a second line, and **neither runs into the row beneath it, and
the last does not run into the PAYMENT heading**. That overlap is what this packet fixes, and it
is judged by looking at the page.

If you have three or more delivered weddings on file, the seal appears too, unchanged.

---

Sequencing beyond this sitting is the founder's.
