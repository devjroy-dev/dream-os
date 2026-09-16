# repo: dream-os @ d4d3f92f93c5d2e7429318e017fdbd80fb4954bb
# TDW · CE-43 · SEAT LC-1 · HANDOVER (the dream-os packet) · 2026-09-16

(Line 1 names the tip this docs amendment was cut on. The LC-1 code packet itself was:) Cut on dream-os `8806acc1fa3b308f666388478f276fde9bc847fe`, re-derived at origin at the moment of cutting. The dreamos-pwa packet cuts after this one is at origin and its tip is re-derived (R-38.16). Rulings: CE-43 on the read-first and on the build relay. Findings used F-43.17 to F-43.26.

## §1 · What shipped

**F-43.1(a), the booking event seam (ruled F1(c)).** One home, `src/lib/vendor/bookingEvent.js::ensureBookingEvents(supabase, vendor, agentId, result)`. After a turn it reads the binders that the turn's successful Donna hands touched. For each live binder with a date, a client name and a booking stage, and with no live linked event, it writes one calendar row through `writeEvent`.

- Booking stage matches `(book|confirm)` case-insensitive and does not match `(unbook|cancel|lost)`. The six-word cabinet set in cabinet.js and today.js is untouched.
- Kind is `ceremony` (F6(a)), so the existing binder-to-event lockstep on both lanes moves the row when the date moves (F5(a)).
- Title is `<client> · wedding`. **Founder veto YES, 2026-09-16.**
- The row carries `vendor_id` and `linked_binder_id` only (F-43.19).
- F9(a): any live linked event means no row is written.
- F8(a): a conflict refusal is handed back and spoken through the existing `conflictLines`. No new string was added.
- **The standing dedupe rule, named (disclosure 3, ratified).** `writeEvent` adopts an unlinked live event on the same date whose title starts with the client's name as this booking. It patches that event's title and kind and sets the link.

The seam has three call sites, proven by grep at the cut:

```
$ grep -n ensureBookingEvents src/api/vendor-engine/chat.js src/lib/vendor/calendarSignals.js
src/api/vendor-engine/chat.js:50:const { ensureBookingEvents } = require('../../lib/vendor/bookingEvent'); // CE-43 LC-1 F-43.1(a): the booking event seam, one home
src/api/vendor-engine/chat.js:3597:      const seamSse = await ensureBookingEvents(req.app.locals.supabase, req.vendor, req.agentId, result, { surface: 'pwa' });
src/api/vendor-engine/chat.js:3677:    const seamJson = await ensureBookingEvents(req.app.locals.supabase, req.vendor, req.agentId, result, { surface: 'pwa' });
src/lib/vendor/calendarSignals.js:53:const { ensureBookingEvents } = require('./bookingEvent'); // CE-43 LC-1 F-43.1(a): the booking event seam, one home
src/lib/vendor/calendarSignals.js:573:  const seam = await ensureBookingEvents(supabase, vendor, agentId, result, { surface: S });
```

The WhatsApp lane reaches the last site through `src/index.js:33` → `src/lib/vendorInbound.js:1815` (`applyCalendarSignals`). `vendorInbound.js` is untouched.

**F-43.5(a), the due date at the mint (ruled F2(a), F3(b)).**
- `generateInvoiceForBinder` now passes `due_date` equal to the binder's `followup_on` into `createInvoice`, through `binderDueDate`, which reads the single binder being minted (disclosure 1, ratified).
- A failed read mints with NULL, as before.
- No lead or client link is set. `binder_id` behaves as before.

**F7(b), the existing rows.** `tools/lc1_backfill.js --handle <HANDLE>` is a dry run unless `--live` is given.
- It resolves the vendor's agent read-only.
- Events are written only through `writeEvent`, and invoices only through `updateInvoice`, whose paid-invoice lock stands.
- It prints every row it touched or refused, and a second run touches nothing.
- It uses source `crud`, so the ledger reads "via calendar" (disclosure 4, ratified).
- It refuses unless all of these hold (disclosure 5, ratified as the guard, c-43.10):
  - the tree is clean;
  - HEAD equals `origin/main` after a fetch;
  - `8806acc1` is an ancestor of HEAD;
  - `bookingEvent.js` is committed at HEAD.
- Credentials come from the shell, or from a gitignored repo-root `.env`, under `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Nothing is printed from them.

## §2 · What is proven

**`b79_lc1_seam_bench`: 31/31 on the cured tree.**
- It drives the real `writeEvent`, the real `applyCalendarSignals` and the real mint.
- Eight mutations of production code are compiled in memory under their real paths (nothing is written to disk), and each turns its named cell RED.
- §6 is the column-existence cells against `PUBLIC_SCHEMA.md` and `ENGINE_SCHEMA.md` (R-40.80).
- On a clean base worktree at `8806acc1`: **8 pass, 18 fail**. The 8 greens are the absence, schema and no-follow-up cells, so the red run is not vacuous.

**Sealed benches, opened and re-run on the cured tree:**

| Bench | Result |
|---|---|
| b0498_fresh_crew_rider | 58/58 |
| b0498_wa_assign_punct | 17/17 |
| b05_m2_vendor_inbound | 2/2 |
| b06_m3 | 37/37 |
| b47_money_crossing | 23/23 |
| b5_wa_door | 32/32 |
| b3_rider | 20/20 |
| b06_relay_hand | 126/126 |

**Floor at base.** Founder-run, 2026-09-16: `FLOOR = NAMED BASE, no delta (refusals, not in base: 4)`. The set equals `scripts/floor-base.txt` by name.

**Floor at the cut.** It rides this packet's verify line, founder-run, and is not claimed here (F-43.25: this seat's container kills any command at 300 s).

**Syntax.** `node --check` is clean on every touched `.js` file.

**Founder rows, fixture state (2026-09-16, Q-LC1-A/B/C):**
- `e6aacb34` Dholakia, 2026-09-21, `confirmed booking`, follow-up 2026-09-19, no linked event. It is the only qualifying binder.
- Leads: 26 live out of 45.
- `TDW/DEV440/09`: `due_date` NULL, `binder_id` `e6aacb34`, `amount_paid` 0, `unpaid`.

## §3 · Drift from the kickoff (all ruled)

- The "one cure at the door serves both lanes" claim was false as worded: chat.js carries its own twins and never loads calendarSignals (F-43.17, c-43.7). The cure has one home and three call sites.
- The cabinet set has two homes, cabinet.js and today.js (F-43.18). The hook uses a narrower ruled predicate.
- A vendor event row cannot carry `couple_id` because of `events_owner_xor` (F-43.19). Frost does not see these rows.
- `writeFields` cannot reach `public.events` because the engine client is schema-bound (F-43.22).
- F5(a) already existed as the lockstep; it drives only occupying kinds, hence F6.
- A forward-only cure never touches existing rows (F-43.21). Hence the backfill.
- The event title is vendor-visible copy (F-43.24), and was vetoed YES.
- The floor could not run in the seat container (F-43.25). It is founder-run.
- F-43.23: F4 was re-shaped to (d) in the pwa packet.

## §4 · Filed, not built

- **F-43.26.** `donna_merge` and `donna_split` date changes are not dragged by the lockstep (chat.js `lockstepBinderToEvent`, calendarSignals.js `lockstepBinderToEvent` both collect only `donna_date` and `donna_edit`). Inherits to LC-2.

## §5 · Roadmap amendment lines (for `docs/specs/TDW_CE43_SPINE_ROADMAP.md`, the chair's to land)

- **c-43.8 / F-43.19**, against §6's Mirrors line: "Frost never sees a Victor booking … cured downstream by LC-1's event row" is false. `events_owner_xor` (PUBLIC_SCHEMA.md, events CHECK) forbids `couple_id` on a vendor row, so LC-1's row is invisible to `src/api/couple/events.js`. The Frost mirror has no cure in LC-1 and needs its own ruling.
- **c-43.10**, against the LC-1 charter's F7 ruling: the backfill's guard is clean tree, HEAD equals `origin/main` after a fetch, the cut is an ancestor of HEAD, and `bookingEvent.js` is committed at HEAD. It is not "the packet's tip", which does not exist before the founder commits.
- **§5 LC-1 text:** the event write is a post-turn door action in one lib home called by both doors (F1(c)), not a write inside the engine.

## §6 · The walk (founder performs and pastes; the seat reads)

A push is not a deploy (R-40.87). The walk starts only when the Railway deployment for the vendor service shows the commit you pushed (Railway dashboard → the service → Deployments → the top deployment's commit).

1. **Backfill, dry run.** In the dream-os Codespace, run the dry-run command given in the chat relay and paste the whole output.
   - Expected: `WOULD CREATE binder e6aacb34-… "Dholakia · wedding" 2026-09-21` and `WOULD SET TDW/DEV440/09 due_date 2026-09-19`.
   - The `--live` command is **withheld** until the seat has read this paste (the conditional-withheld rule).
2. **Backfill, live.** Run it once the seat hands it over, and paste the output.
3. **Events (card a).** On the deployed pwa, signed in as DEV440, open Events.
   - Expected: Dholakia · wedding, 21 September.
   - Evidence: a screenshot, and the Q-LC1-D SELECT from the chat relay. It should return one row: kind `ceremony`, state `upcoming`, event_date 2026-09-21.
   - Only your handset can witness that the row renders in Graphite and Chalk with no colour the estate does not hold (R-42.6).
4. **Date move (card b).** On the web thread, tell Victor: "Move Dholakia to 22 September 2026."
   - Evidence: the Events screen, and Q-LC1-D again. It should return one row, now with event_date 2026-09-22.
5. **Invoice (card c).** Open Invoices. `TDW/DEV440/09` should read due 19 September 2026.
   - Evidence: a screenshot, and Q-LC1-E.
6. **Fresh binder on the vendor lane (card d).** From 9888294440, message the vendor line (+917982159047) with:
   > Tandon wedding is confirmed for 14 November 2026, fee 40000, follow up on 1 November 2026. Raise the invoice.
   - Evidence:
     - the Railway line `[agent:engine] reply:` for that turn;
     - Q-LC1-F, where the newest Tandon invoice should carry `due_date` 2026-11-01 and a `binder_id`;
     - Q-LC1-G, which should return one `Tandon · wedding` row on 2026-11-14, kind `ceremony`.
   - If 14 November is blocked or full, the reply carries the calendar's own refusal sentence instead, and that is the seam working.
7. **Leads (card e).** This is carried by the dreamos-pwa packet's card.

## §7 · What LC-2 picks up

- F2 and F3 become moot when `0167`/`0168` land: the package schedule owns `due_date`, and the promotion act owns `lead_id`/`client_id`.
- The booking-stage predicate here and the cabinet set are both replaced by a real stage.
- F-43.26.
- The Frost mirror (c-43.8).

## §8 · The walk record (2026-09-17, founder-run; CE-43 ruled LC-1 CLOSED)

**Tips walked.** dream-os `d4d3f92f93c5d2e7429318e017fdbd80fb4954bb`, dreamos-pwa `409a130e`. Vercel production was founder-confirmed on `409a130e`. Railway's card shows a deployment id, not a commit, so its deploy is witnessed by the row only `d4d3f92` can write (card d's `Tandon · wedding`).

**Apply evidence (founder terminal).**

| | dream-os | dreamos-pwa |
|---|---|---|
| Guard | `SAFE TO APPLY` | `SAFE TO APPLY` |
| Bench | b79 31/31 | b78 14/14 |
| Other gates | build clean | tsc clean, `next build` green |
| Delivery mode | 8 declared files unmoved | 5 declared files unmoved |
| Floor | `FLOOR = NAMED BASE, no delta` | `FLOOR = NAMED BASE, no delta (refusals, not in base: 0)` |

The dream-os base floor before apply also read `FLOOR = NAMED BASE, no delta`.

**Backfill (F7(b)).** The dry run planned exactly one event (Dholakia) and one due date (`TDW/DEV440/09`). The live run wrote exactly those two, with no refusal or error:

- `CREATED binder e6aacb34-2e05-4729-9be9-7921e09e6f62 "Dholakia · wedding" 2026-09-21 event 4c1be27f-7f7f-40c2-b450-bcfcb5101fa7`
- `SET TDW/DEV440/09 due_date 2026-09-19 (binder e6aacb34-2e05-4729-9be9-7921e09e6f62)`

**Card a · pass.** Events shows `Dholakia · wedding`, Ceremony, 21 Sep 2026, Upcoming, with the cross-chip "In your books · Dholakia". The founder confirmed nothing is off-palette. Q-LC1-D:

```
id,title,event_date,kind,state,linked_binder_id,deleted_at,created_at,updated_at
4c1be27f-7f7f-40c2-b450-bcfcb5101fa7,Dholakia · wedding,2026-09-21,ceremony,upcoming,e6aacb34-2e05-4729-9be9-7921e09e6f62,null,2026-09-16 18:51:54.87818+00,2026-09-16 18:51:54.87818+00
```

**Card b · pass.** On the web thread the founder sent "Move Dholakia to 22 September 2026". Events and the detail sheet now read 22 Sep 2026. Q-LC1-D still returns the same id and one row:

```
id,title,event_date,kind,state,linked_binder_id,deleted_at,created_at,updated_at
4c1be27f-7f7f-40c2-b450-bcfcb5101fa7,Dholakia · wedding,2026-09-22,ceremony,upcoming,e6aacb34-2e05-4729-9be9-7921e09e6f62,null,2026-09-16 18:51:54.87818+00,2026-09-16 18:55:26.499472+00
```

**Card c · pass.** The Invoices sheet for `TDW/DEV440/09` reads Due 19 Sep 2026. Q-LC1-E (founder screenshot):

```
invoice_number,due_date,binder_id,amount_total,amount_paid,state,updated_at
TDW/DEV440/09,2026-09-19,e6aacb34-2e05-4729-9be9-7921e09e6f62,50000,0,unpaid,2026-09-16 18:51:55.105609+00
```

**Card d · pass.** The founder sent this on the vendor WhatsApp lane from 9888294440:

> Tandon wedding is confirmed for 14 November 2026. Fee 40000, follow up on 1 November. Raise the invoice

Victor asked "new or already on file"; the founder answered "New." The reply was "Tandon's logged and the invoice is raised … Invoice TDW/DEV440/10 for Tandon — sending the PDF now."

Railway, 2026-09-17 00:28:58 IST:

```
[agent:engine] reply: "Tandon's logged and the invoice is raised. You're set for the 1 November follow-..."  (2 tool calls)
```

Q-LC1-H (founder screenshot):

```
id,client,date,stage,amount,followup_on,created_at
774d6dbd-2151-42b0-97ce-9e6c6160b4fc,Tandon,2026-11-14,confirmed booking,40000,2026-11-01,2026-09-16 18:58:50.17956+00
```

Q-LC1-F (founder screenshot):

```
invoice_number,client_name,due_date,binder_id,amount_total,state,created_at
TDW/DEV440/10,Tandon,2026-11-01,774d6dbd-2151-42b0-97ce-9e6c6160b4fc,40000,unpaid,2026-09-16 18:58:59.12548+00
```

Q-LC1-G:

```
id,title,event_date,kind,state,linked_binder_id,created_at
f1a2c5ec-ba7c-4671-bf6b-48ad875f8bee,Tandon · wedding,2026-11-14,ceremony,upcoming,774d6dbd-2151-42b0-97ce-9e6c6160b4fc,2026-09-16 18:59:00.826059+00
```

Invoices shows Tandon due 1 Nov 2026, and Clients shows Tandon at "confirmed booking".

**Card e · pass.** Leads' masthead reads "enquiries · across 26 open", and the chips add up to 26 (New 25, Quoted 1). The last row is Kunal Dhillon (29 Jul), which sat beyond the old 20-row cut. The founder found the last row comfortable to reach by thumb. Founder Q-LC1-B: live 26, total 45.

**Findings filed at the walk (CE-43 dispositions).**

- **F-43.27 → Victor guard sitting (F-43.6's class).** Victor named `TDW/DEV440/09` for Tandon before any mint. That number was Dholakia's, and the real mint was `/10`.
- **F-43.28.** `vendorInbound.js:1808` says "sending the PDF now", but Railway 00:29:01 logged `media send unsupported on Meta lane 'vendor' (M1 text-only); refusing`.
  - The PDF went out through Twilio `mediaUrls` until the Twilio sunset (M2b, `6724395`, 2026-07-23), which is founder-witnessed history. The Meta document capability exists only for templates (`templates.js` `buildTemplatePayload`, where `tdw_contract_copy` is approved).
  - Arms: (a) a free-form Meta document send, held for LC-4; (c) the line tells the truth, proposed as micro LC-1b pending the founder's word.
- **F-43.29 → LC-1b if opened.** The web calendar line reads "Updated: Dholakia · wedding — 2026-09-22. The calendar's set.", a raw ISO date against R-42.13. It is existing `mutationLines` copy, so any change goes to the veto slot.
- **F-43.26 → LC-2**, as in §4.

Sequencing beyond this sitting is the founder's.
