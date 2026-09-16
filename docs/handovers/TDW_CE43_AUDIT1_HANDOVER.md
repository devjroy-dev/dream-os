# repo: dream-os @ 17ea09b10b6e7c43dec37774248c2ea07ef1a848
# TDW · CE-43 · SEAT AUDIT-1 · HANDOVER (the read-first) · 2026-09-16

Also read at: dreamos-pwa @ 89f18af742b59662fa32085f203e471a05058082. Read-only seat. No source byte, no floor, no bench, no patch, no schema proposed.
Every file:line below is at those two tips. Every row cited below came from the FOUNDER's pastes on 2026-09-16 (Q00 to Q14, `TDW_CE43_AUDIT1_QUERIES.sql`). The live witness is his, declared, not claimed.

---

## §0 · FIRST MOTIONS

- Fresh clone of both repos. `git ls-remote` at origin: dream-os `17ea09b10b6e7c43dec37774248c2ea07ef1a848`, dreamos-pwa `89f18af742b59662fa32085f203e471a05058082`. Both equal the charter. `git status` clean on both.
- `bash tools/preflight.sh main`: both trees on tip, behind 0, dirty 0. Verdict NOT CLEAR only for `node_modules` ABSENT (both) and `src/engine/dist` ABSENT. Those affect floor numbers; this seat writes none, so nothing was installed.
- `ls db/migrations/ | tail`: numbered tail `0166`. `scripts/floor-base.txt`: 23 lines.
- Read ladder: rungs 1 to 7 read; rung 8 read for every file cited below. Rung 7's CE-42 band does not exist (see §1 P-5).

## §1 · PREMISE CORRECTIONS (to the kickoff; reported, not reasoned past)

- **P-1.** `public.leads` has a stage column: `state` (`PUBLIC_SCHEMA.md:836`, col 13; confirmed live by Q00). The kickoff looked for `stage`/`status`.
- **P-2.** `PUBLIC_SCHEMA.md` is twelve migrations stale (0155 to 0166), not three. None touch the eight public tables except `vendors` (0166 `exchange_discoverable`). `0159:35` adds `engine.messages.room`, contradicting `ENGINE_SCHEMA.md:13` ("the ladder never alters engine"). Q00 returned 249 rows, exactly the docs plus those two columns.
- **P-3.** The planes join through `engine.users`, not directly through public.users: `engine.agents.user_id` → `engine.users.id`, then `engine.users.auth_user_id` = `public.users.auth_user_id` → `public.vendors.user_id` (`src/engine/src/core/vendorIdentity.ts:24-39`). On this account `engine.users.phone` is NULL (Q01), so a phone match on the engine plane finds nothing.
- **P-4.** The kickoff's plane list omitted `engine.records`, the binders plane of LD-1 (`TDW_00_MASTERPLAN.md:16`). Ruled at CE-43 (c-43.2); Q14 added. It is where Victor's confirmations land (§3).
- **P-5.** `docs/FINDINGS_LOG.md` has no CE-41 or CE-42 band (ends at the CE-40 band, `:5059`; zero `F-42.` hits). CE-42 findings live in `docs/handovers/` and `docs/HANDOVER_CE42_*`. None found filed on these four surfaces. The masterplan carries no status rows for leads/clients/events/invoices (its rows are blocks).
- **P-6.** The four `page.tsx` files are 42 to 44 line shells. The surfaces are `body.tsx` beside each, plus the shared `components/vendor/slices/SliceShell.tsx` and `BinderCard.tsx`.
- **P-7.** `_bare()` (`src/lib/whatsapp.js:39-44`) is confirmed as described, but it is a comparison normaliser and writes nothing. Stored forms seen: `+919888294440` (Q01), `+91…`, bare ten digits (Q09, Q11, Q13) coexist.
- **P-8.** The WhatsApp lane and the PWA do not run different engines. Both run the same TS engine (`runTurn`, `src/lib/vendorInbound.js:187`) and the same post-turn signal hands (invoice `:1768-1789`, calendar `:1815` → `src/lib/vendor/calendarSignals.js:59-109`). Disease (a) and (g) are a plane disagreement, not a lane disagreement (F-43.7).

## §2 · THE ACCOUNT (founder's rows)

- Q01: public user `ec4232ae…` phone `+919888294440`; vendor `23165e38…` DEV440, tier `signature`; engine user `bec0fd48…` (phone NULL); one agent `d02c7a9a…`, mode `advisory`, victor_mode `business`, agent tier `entry`.
- Q02 counts (total / live): engine.conversations 51 · engine.messages 488 · engine.facts 0/0 · engine.events 106 · engine.money_entries 0 · engine.leads 0 · public.conversations 5 · public.messages 404 · public.leads 45/26 · public.clients 4/4 · public.events 12/11 · public.invoices 9/9.
- Q05 and Q07 returned zero rows (founder's screenshots), matching Q02.
- Q14 engine.records, newest first: `e6aacb34` Dholakia, 2026-09-21, stage `confirmed booking`, 50000 in, followup 2026-09-19 · `5c76f61b` Priya Mehta, 8757788550, 2026-09-10, `quoted` · `f9818d27` Anjali Rao, 2026-12-16, stage NULL, 30000 in · `8541d793` Priya Sachdeva, 2026-10-05, `quoted`, 80000 in, followup 2026-09-20 · `d4f9afcf` Assistant expense, 5000 out. All `hidden = false`.
- Q06: the five newest engine.events are `update` on `entity_type = records`, entity `e6aacb34`, 2026-09-15 20:44:34 to :37 UTC (stage, money, note, follow-up, reason).
- Q12: newest public.events row was created 2026-09-15 20:43:23 UTC (`Personal time`, kind `blocked`). No public.events row was created at or after the Dholakia record (20:44:32).
- Q13: `TDW/DEV440/09` Dholakia, 50000, `binder_id = e6aacb34`, `lead_id` NULL, `client_id` NULL, `due_date` NULL, state `unpaid`.
- Q04 (thread `aea645fb`): Victor's reply `3054c55c` says the invoice is "up and sent to devjroy@gmail.com"; the door line beneath says "find it in the invoices list".
- Q10: public.leads carries `Priya Mehta` (`bbbfdbf6`, phone NULL, wedding 2026-12-28, `quoted`) and `Anjali Rao` (`6491e70c`, +919999999999, 2026-09-19, `new`).
- Q11: all four public.clients rows are `source = contract_compose`.
- Observation, out of scope: three `public.invoices.pdf_url` values hold signed storage URLs with tokens valid for about a year. Not reproduced here.

## §3 · WRITE PATHS (read from the handlers)

| Entity | Victor / Donna (web chat) | Donna tool → table.column | WhatsApp lane |
|---|---|---|---|
| lead | `donna_lead` | `public.leads` insert/update (`src/engine/src/core/tools/donnaLead.ts:155-158`) | same engine (`vendorInbound.js:187`); enquiries → `engine.records` via `enquiryToBinder` (`src/lib/vendor/enquiryBinder.js:49`, called `vendorInbound.js:984`) |
| client / binder | `donna_client`, `donna_date`, `donna_stage`, `donna_note`, `donna_phone` | `engine.records` (`recordPrimitives.ts:171-231` writeFields; tools `:251-280`); audit line to `engine.events` (`:71-78`) | same |
| money | `donna_money`, `donna_money_edit` | `engine.records.amount/direction/amount_received/amount_pending` (`recordPrimitives.ts:237`, `:376`, case `:524`) | same |
| event (calendar) | `donna_book_event` (signal only, `recordPrimitives.ts:438`, `:760`) | door writes `public.events` via `writeEvent` (`src/api/vendor-engine/chat.js:463-533`; `src/lib/vendor/eventWrite.js:440`) | `applyCalendarSignals` (`vendorInbound.js:1815` → `calendarSignals.js:59-109`) |
| invoice | `donna_invoice_pdf` (signal only, `recordPrimitives.ts:394`, `:754`) | door `buildInvoices` (`chat.js:417-438`) → `generateInvoiceForBinder` (`src/api/vendor/invoices.js:354-409`) → `public.invoices` with `binder_id`, `due_date: null` (`:384`) | `vendorInbound.js:1768-1789`, same minter |
| facts / money_entries | no live writer found for this account (Q02: 0 and 0); `engine.facts` written by `memory.ts:269-313` | | |

`engine.leads` is stop-written (`ENGINE_SCHEMA.md:37`; Q02: 0). The only `source = 'lead_promotion'` writer is `src/agent/engine.js:1545-1577`, inside the declared unreachable island (`engine.js:752-759`, F-05.56). Live `public.clients` writers: `resolveOrCreateClient` (`src/lib/clients.js:8`) called from contract compose (`src/lib/vendor/contracts.js:239-241`) and `POST /api/v2/vendor/clients` (`src/api/vendor/clients.js:153`).

## §4 · READ PATHS

- **Leads.** `app/vendor/(shell)/leads/page.tsx` → `leads/body.tsx:218` `useLeadsData` → `fetchLeads(vendorId, 'all')` (`lib/vendor/api/vendor.ts:256-258`) → `GET /api/v2/vendor/leads/:vendorId` (mount `src/api/vendor/core.js:37`; handler `src/api/vendor/leads.js:125`). Table `public.leads`. WHERE `vendor_id = vendor.id` AND `deleted_at IS NULL` (`:164`); `state=all` → no state filter (`:137`); `ORDER BY created_at DESC`; **LIMIT default 20** (`:130`); no limit is sent and the pwa has no paging. Cross-chip from `engine.records` by phone key (`body.tsx:191-216`).
- **Clients.** `clients/page.tsx` → `clients/body.tsx:38` `useCabinetData` → `fetchCabinet` (`vendor.ts:96-97`) → `GET /api/v2/vendor/cabinet/:vendorId` (mount `core.js:59` → `src/api/vendor-engine/cabinet.js:30`). Table **`engine.records`** WHERE `agent_id = req.agentId` AND `hidden = false` (`:45-49`), then `clients` = stage contains one of `client, booked, confirmed, signed, advance, paid` (`:75-80`). **`public.clients` is not read by this page**; its only pwa reader is Contracts (`app/vendor/(shell)/contracts/screen.tsx:464`, `:475`).
- **Events.** `events/page.tsx` → `events/body.tsx:59` `useEventsData` → `fetchEvents(vendorId, 'upcoming')` (`vendor.ts:328-330`) → `GET /api/v2/vendor/events/:vendorId` (`core.js:56` → `src/api/vendor/events.js:195`). Table `public.events` WHERE `vendor_id`, `kind <> 'blocked'`, `deleted_at IS NULL`, `event_date BETWEEN today(IST) AND today+400` (`:259-264`, `:81`), `state IN ('upcoming')` (`:222`, `:274-277`); LIMIT 200 (`:82`). Cross-chip from cabinet by `linked_binder_id` (`body.tsx:33-56`).
- **Invoices.** `invoices/page.tsx` → `invoices/body.tsx:64` `useInvoicesData` → `fetchInvoices(vendorId,'all')` (`vendor.ts:283-297`) → `GET /api/v2/vendor/money/invoices/:vendorId` (`core.js:111` → `src/api/vendor/money.js:415`) → `readOutstanding` (`src/lib/vendor/invoices.js:528-534`). Table `public.invoices` WHERE `vendor_id`, `deleted_at IS NULL`, ORDER `created_at DESC`, no limit. Cross-chip from `public.leads` by phone (`body.tsx:43-63`).

## §5 · DISEASE RE-VERIFIED (a to g, what the code at tip does)

- **(a)** Confirmed, but the axis is plane, not lane (P-8). Victor on both lanes reads `engine.records` via Donna; the Leads page reads `public.leads`. F-43.3, F-43.7.
- **(b)** Confirmed for the calendar date, partly for the rest. Dholakia's record (`confirmed booking`) IS on the Clients page as a binder (`cabinet.js:75-80`, Q14 `hidden=false`) and the invoice IS on Invoices, but no event exists (F-43.1) and the invoice shows no due date (F-43.5).
- **(c)** Confirmed. The only lead-to-client act is the Leads swipe-right `Booked` (`SliceShell.tsx:779-783`), which writes `state` alone (`leads.js:443`); nothing creates a client or moves the row. No "generate package" control exists (grep: zero in the four bodies, `SliceShell.tsx`, `BinderCard.tsx`). F-43.8, F-43.9.
- **(d)** Confirmed. Binder card controls are Ask in chat, Edit, Hide (`BinderCard.tsx:325-345`); the PDF control lives only on the invoices slice (`SliceShell.tsx:1049-1051`), although a binder-keyed generate door exists (`src/api/vendor/invoices.js:413-420`). F-43.10.
- **(e)** Confirmed. A date on a lead (`public.leads.wedding_date`) or a binder (`engine.records.date`) never reaches `public.events`; Events reads only `public.events`. F-43.1.
- **(f)** Confirmed on the rows. Victor's "sent to devjroy@gmail.com" (Q04 `3054c55c`) names a send no code can perform (F-43.6); Victor's view of "Priya Mehta" (Q09) comes from `engine.records` while the Leads page shows a different Priya Mehta row (F-43.3).
- **(g)** Confirmed: the PWA itself disagrees with itself (Clients from `engine.records`, Leads from `public.leads`, 20-row cap on Leads). F-43.2, F-43.3, F-43.4.

## §6 · FINDINGS F-43.1 to F-43.12

**F-43.1 · A booking's date lives in engine.records; Events reads only public.events.** · Bin: **WIRING**
- Write: `donna_date` writes `engine.records.date` (`recordPrimitives.ts:251-254`); a calendar row needs the separate `donna_book_event` signal (`chat.js:463-533`, `calendarSignals.js:59-109`).
- Read: `src/api/vendor/events.js:257-264`, table `public.events` only.
- Row: `e6aacb34` Dholakia, date 2026-09-21, `confirmed booking` (Q14); newest public.events row predates it (Q12, 20:43:23 < 20:44:32).
- Disease b, e.

**F-43.2 · The Clients page reads engine.records; public.clients is read only by Contracts.** · Bin: **WIRING**
- Write: `public.clients` via `resolveOrCreateClient` (`src/lib/clients.js:8`) from contracts (`contracts.js:239-241`) and `POST /vendor/clients` (`clients.js:153`).
- Read: `clients/body.tsx:38` → `cabinet.js:45-49`, `:75-80`; `public.clients` reader `contracts/screen.tsx:464`.
- Row: four live public.clients rows, all `contract_compose` (Q02, Q11), none renderable on Clients.
- Disease c, g.

**F-43.3 · Victor-filed lead binders never appear as Leads rows; the same name diverges across planes.** · Bin: **WIRING**
- Write: `donna_client`/`donna_stage` → `engine.records` (`recordPrimitives.ts:256`, `:276`); `donna_lead` → `public.leads` (`donnaLead.ts:155-158`). Two writers, two planes.
- Read: Leads reads `public.leads` (`leads.js:164`); cabinet `leads` slice (`cabinet.js:81`) is used only as a phone-keyed chip (`leads/body.tsx:195-216`).
- Row: records `5c76f61b` Priya Mehta, 8757788550, 2026-09-10, `quoted` (Q14) vs leads `bbbfdbf6` Priya Mehta, phone NULL, 2026-12-28 (Q10). Victor spoke from the first (Q09 `c01d748a`).
- Disease a, f, g.

**F-43.4 · The Leads wire is capped at 20 and the page does not page.** · Bin: **WIRING**
- Read: `fetchLeads` sends no `limit` (`vendor.ts:256-258`); server default 20 (`leads.js:130`); no offset/paging in `useVendorData.ts` or `SliceShell.tsx`.
- Row: 26 live leads for this vendor (Q02), so at least 6 are invisible.
- Disease g.

**F-43.5 · A chat-minted invoice is born with no due date and no lead/client link.** · Bin: **WIRING**
- Write: `generateInvoiceForBinder` passes `due_date: null` (`src/api/vendor/invoices.js:384`); `buildInvoices` selects no date or follow-up (`chat.js:429-430`).
- Read: Invoices shows `due …` only when `due_date` is set (`invoices/body.tsx:18-20`).
- Row: `TDW/DEV440/09` `due_date` NULL, `lead_id` NULL, `client_id` NULL (Q13) while the binder carries `followup_on` 2026-09-19 and a note stating "Full payment due 19 September 2026" (Q14).
- Disease b. (Whether `followup_on` is the due date is a ruling, not a derivation.)

**F-43.6 · Victor claims an email send that no code can perform.** · Bin: **PRODUCT**
- Write: no email transport exists in `src/` (grep `sendMail|nodemailer|resend.emails`: zero hits); the door line is truthful (`chat.js:442-446`).
- Row: Q04 `3054c55c` "Invoice is up and sent to devjroy@gmail.com", tool trace shows only find, invoice signal, relay.
- Disease f. Adjacent to the Victor guard sitting's claim class (succession note §6). No column holds a client email on a binder.

**F-43.7 · The two lanes share one engine; the disagreement is between planes.** · Bin: **WIRING**
- Code: `vendorInbound.js:187` (`runTurn`), `:1768-1789` (invoice), `:1815` (calendar) mirror `chat.js`.
- Row: the WhatsApp thread (Q09) and the web thread (Q04) both speak `engine.records` binders.
- Disease a, g. Kills the chair's "lane" framing; the plane hypothesis stands (see §7).

**F-43.8 · Two stage models, neither connected to the other.** · Bin: **MODELLING**
- `public.leads.state` ∈ new, contacted, quoted, booked, lost (`leads.js:91`); `engine.records.stage` is free text, client-ness inferred by substring (`cabinet.js:75-80`).
- No column links a `public.leads` row to an `engine.records` binder (Q00: `public.leads` has `client_id`, `wedding_id`, no binder id).
- Row: Dholakia `confirmed booking` (binder) has no lead; Priya Mehta `quoted` exists on both with different facts (Q10, Q14).
- Disease c.

**F-43.9 · No lead-to-client act exists on the surface; the only promotion code is unreachable.** · Bin: **PRODUCT**
- Act: swipe `Booked` → `PATCH /leads/:leadId/state` writes `state` only (`SliceShell.tsx:779-783`, `leads.js:405`, `:443`).
- Column and writer exist (`public.clients.source` default `lead_promotion`; `resolveOrCreateClient`), the promoter is in the island (`engine.js:752-759`, `:1545-1577`).
- Row: 45 leads, 0 clients from promotion (Q02, Q11).
- Disease c.

**F-43.10 · Clients has no create-invoice control though a binder-keyed door exists.** · Bin: **PRODUCT**
- Door: `GET /api/v2/vendor/invoices/:binderId/pdf` generates from a binder (`src/api/vendor/invoices.js:413-420`).
- Surface: `BinderCard.tsx:325-345` (Ask in chat, Edit, Hide); PDF only on invoices (`SliceShell.tsx:1049-1051`).
- Row: Dholakia binder `e6aacb34` got its invoice only through chat (Q13 `binder_id`).
- Disease d.

**F-43.11 · public.events has no client link; its binder link is optional and set only by the chat signal.** · Bin: **MODELLING**
- Columns: `linked_lead_id`, `linked_binder_id`, `couple_id`; no `client_id` (Q00).
- Row: Q12's five events all carry `linked_lead_id` and `linked_binder_id` NULL, including the lead call `278805eb` titled with a phone number.
- Disease e.

**F-43.12 · The Events list hides past and blocked dates by design.** · Bin: **WIRING** (ruled design, named so it is not mistaken for loss)
- Read: from = today IST, state `upcoming`, `kind <> 'blocked'` (`events.js:211`, `:222`, `:259-264`; R-B6-25).
- Row: `Personal time` 2026-09-20 `blocked` (Q12) is absent from the list by rule; `Priya — venue recce` 2026-09-03 still `upcoming` and past, so it is absent too.
- Disease e (partly).

## §7 · THE DIFF (writes that land where a read never looks)

The chair's hypothesis, restated at tip: **Victor writes `engine.records` (not `engine.events`, which is the audit trail) and three of the four vendor pages read `public.*`; the fourth, Clients, reads `engine.records`.** Proven with rows:
1. `engine.records.date` (write `recordPrimitives.ts:251`) → Events reads `public.events` (`events.js:257`). Proof: Dholakia `e6aacb34` 2026-09-21 (Q14), no event (Q12). F-43.1.
2. `engine.records` lead-stage binders (write `recordPrimitives.ts:256`) → Leads reads `public.leads` (`leads.js:164`). Proof: `5c76f61b` Priya Mehta (Q14) vs `bbbfdbf6` (Q10). F-43.3.
3. `public.clients` (write `contracts.js:239-241`) → Clients reads `engine.records` (`cabinet.js:45`). Proof: four rows (Q11). F-43.2.
4. `engine.records.followup_on` (written by Donna's binder hands through `writeFields`, `recordPrimitives.ts:171-231`) → the invoice mint never reads it (`chat.js:429-430`, `invoices.js:384`). Proof: `TDW/DEV440/09` due NULL (Q13). F-43.5.
5. `public.leads` rows beyond 20 → the Leads read never fetches them (`leads.js:130`). Proof: 26 live (Q02). F-43.4.

## §8 · LIFECYCLE (the lead state model today)

`public.leads.state` holds the stage: `new`, `contacted`, `quoted`, `booked`, `lost` (`leads.js:91`; default `new`, Q00). It moves only by `PATCH /api/v2/vendor/leads/:leadId/state` (`leads.js:405-443`) and Donna's `donna_lead` update (`donnaLead.ts:158`). The surface exposes it as the Leads swipe-right `Booked`, the bulk `Mark contacted` / `Lose`, and the detail `Mark lost` (`SliceShell.tsx:779-783`, `:994`, `:1254-1262`). Moving to `booked` changes that column and nothing else. The binder plane runs a second, free-text stage (`engine.records.stage`) that the Clients page reads by substring. No schema proposed.

## §9 · MIRRORS (named, not audited)

- Admin vendor detail reads `public.leads` with no `deleted_at` filter (`src/admin/router.js:115`) and `public.clients`/`public.invoices` (`:117-119`): it would show 45 leads where the vendor has 26, and none of the binder plane.
- Frost reads `public.events` by `couple_id` (`src/api/couple/events.js:27`, `src/admin/router.js:297`): a vendor booking made through Victor never reaches the couple unless an event row with her `couple_id` exists, which F-43.11 shows the chat path does not set.
- `src/api/admin/search.js:205` searches `public.leads` only: Victor-filed binders are unsearchable from admin.

## §10 · FORKS (enumerated for the chair; none picked)

- **F-43.1** (a) the door writes a `public.events` row whenever a binder gains a date with a booking stage · (b) Events also reads dated binders from `engine.records` · (c) Victor is taught that a confirmed booking requires the calendar signal (W-1, soul sitting).
- **F-43.2** (a) Clients reads `public.clients` beside the binders · (b) contract-compose writes a binder instead of a typed client · (c) Clients shows both planes, labelled.
- **F-43.3** (a) one lead writer (Donna's binder hands write `public.leads` too, or `donna_lead` only) · (b) Leads also lists lead-stage binders · (c) a link column joins the two rows (MODELLING, needs F-43.8's ruling first).
- **F-43.4** (a) the pwa sends a limit and pages · (b) the server default is raised for this caller · (c) the page shows a truncation tell as Events does.
- **F-43.5** (a) the mint copies the binder's follow-up date into `due_date` · (b) the mint asks for a due date and holds · (c) the invoice leaves due date blank and Invoices says so.
- **F-43.7** (a) cure at the plane seam once, both lanes inherit · (b) cure per lane (not recommended by the evidence, named for completeness).
- **F-43.12** (a) keep as ruled · (b) a "past" chip on Events · (c) a blocked-day tell on Events.

## §11 · COPY INVENTORY

Zero. This seat adds or changes no user-facing string.

## §12 · CONTROL INVENTORY (as present at 89f18af7)

**Leads** (`leads/body.tsx` → `SliceScreen`/`SliceShell`): search · filter chips new/contacted/quoted/booked/lost (`SliceShell.tsx:565`, `:588`) · sort toggle recent/amount/date (`:1428-1435`) · FAB Add (`:367`) · row tap → detail · cross-chip "In your books" (`leads/body.tsx:205-215`) · swipe right `Booked` with undo (`:779-783`) · swipe left `Call` or `Mark lost`, suppressed on redacted rows (`:808-812`) · select mode, bulk `Mark contacted` / `Lose` with Retry toast (`:994`, `:1009-1021`) · detail: wishbone fill chips (`:1031-1038`), `Mark lost` + confirm + `Keep` (`:1254-1295`), Forward (`:1317-1320`), `See plans` on redacted (`:1354-1383`), WhatsApp and Call links (`:1387-1409`), Delete via `DELETE /leads/:id` (`leads/body.tsx:186-188`), Undo toast (`:552`).
**Clients** (`clients/body.tsx` → `SliceShell` direct): search · FAB Add → `AddSheet` slice clients (`:71`, `:104-111`) · masthead (display) · per `BinderCard`: expand (`BinderCard.tsx:210`), wishbone open (`:287`), lead cross-link (`:258`), `Ask in chat` (`:325`), `Edit` sheet with Save (`:331`, `:112`), `Hide` + `Sure?` (`:338-345`), swipe right `Ask in chat`, swipe left `Call` when phone (`:189-190`), Undo on hide (`:202`). No sort control is passed (`clients/body.tsx:65-111`).
**Events** (`events/body.tsx` → `SliceScreen`): search · date chips incl. this week / later / done (`SliceShell.tsx:574-581`) · sort toggle · FAB Add · row tap → detail · cross-chip → Clients (`events/body.tsx:43-54`) · swipe right `Done` with undo (`:859-866`) · swipe left `Cancel` + confirm (`:867`) · bulk `Mark done` (`:997`, `:1013`) · delete/cancel via `PATCH /events/:id/cancel` (`events/body.tsx:25-27`).
**Invoices** (`invoices/body.tsx` → `SliceScreen`): search · chips overdue/unpaid/advance_paid/paid (`:567`, `:589`) · sort toggle · FAB Add · row mark-paid button when owed (`:964-974`) · cross-chip "Also an enquiry" → Leads (`invoices/body.tsx:52-62`) · swipe right mark paid with undo (`:814-822`) · swipe left `Cancel` + confirm (`:823`) · bulk mark paid (`:995`, `:1011`) · detail: `Download PDF` (`:1051`), Send on WhatsApp when phone (`:1066-1070`), Payment Schedule `Add` / `Remind` / `Paid` / edit / remove, and the Add Milestones sheet (`:1102-1232`, `:1473-1811`) · cancel via `PATCH /money/invoices/:vendorId/:id/cancel` (`invoices/body.tsx:32-37`).
Shared chrome on all four: the slice door buttons (`SliceShell.tsx:166-171`) and the shell masthead.

## §13 · PROTOCOL ATTESTATION

- Opened `docs/TDW_BUILD_PROTOCOL.md` §7 and §11 at `17ea09b10b6e7c43dec37774248c2ea07ef1a848`.
- §7's apply chain, verbatim: `unzip -o FILE.zip && cp -r deploy/. . && rm -rf deploy FILE.zip`
- Opened `docs/db/ENGINE_SCHEMA.md` (whole) and `docs/db/PUBLIC_SCHEMA.md` (the eight sections plus the `public.conversations` constraints at `:1754-1755`).
- Planes this sitting's SQL reads: **public** and **engine** (including `engine.records` and `engine.users`).
- SQL provenance: every column is witnessed by the founder's Q00 paste, `ENGINE_SCHEMA.md:349-353` (`engine.users`), `ENGINE_SCHEMA.md:310-333` (`engine.records`, ruled c-43.2), or `PUBLIC_SCHEMA.md:1754-1755` (the `vendor_self` literal). Each statement's comment names its witness. All statements are read-only.
- Numbers used: F-43.1 to F-43.12. No e-numbers. No migration number, no bench rung allocated.
- W-1: no soul byte read for change, none written.

Sequencing beyond this sitting is the founder's.
