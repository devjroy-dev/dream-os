# SURFACE_TRUTH_AUDIT.md

**Engagement:** independent read-only audit of vendor-record surfaces, `devjroy-dev/dream-os` (backend) + `devjroy-dev/dreamos-pwa` (PWA), cloned fresh 2026-07-15. No code changed, no fixes proposed inside findings; recommendations are surface-level only per brief.

**Orientation — the two planes (by design):**

- **Typed plane** — `public.leads`, `public.clients`, `public.invoices`, `public.events`, `public.notes`. Enum states, CHECK constraints, vendor-keyed (`vendor_id`).
- **Records/binders plane** — `engine.records`, a wide free-form table (one row = one "binder": client, money in/out, stage as *free text*, an ever-growing `note`, follow-ups). Agent-keyed (`agent_id`), reached from a vendor via the identity bridge (`resolveAgent` forward; `src/engine/src/core/vendorIdentity.ts` reverse). Schema: `db/migrations/archive/0068_binders.sql` (ported; live table is `engine.records`, `src/engine/src/core/db.ts:15` pins the client to `schema: 'engine'`).

The only cross-plane key anywhere is **phone, last-10-digits, optional on both sides** (`dreamos-pwa/lib/vendor/cabinet.ts` `phoneKey`, self-described "DISCLOSED LIMITATION: a phone-asymmetric twin … will NOT match"). Migration `0070_linked_binder_id.sql` links *calendar events* to binders (soft ref, no FK); nothing links a lead to a binder.

---

## 1. The Surface-Truth Map

All PWA routes call the dream-os API; `src/api/vendor/core.js:26–37` shows the Phase-4 flip: `/today`, `/cabinet`, `/binders`, `/chat` are mounted onto the **engine-backed** handlers under the old `/api/v2/vendor/*` paths, so the URL no longer tells you the plane.

| # | Surface (what the vendor sees) | Label claims | API route | Handler | Plane(s) read | Fields rendered / derived |
|---|---|---|---|---|---|---|
| S1 | **Cabinet sheet** ("Your books / Everything kept"), tabs Workbench / Cards / Accounts, columns Clients · Leads · Booked · Reminders + Received/Outstanding masthead | "Everything kept" | `GET /api/v2/vendor/cabinet/:vendorId` | `src/api/vendor-engine/cabinet.js` | **engine.records** (binders, `cabinet.js:46–50`) + **public.events** (calendar, `:52–55`) | Binder cells (client, amount, received, pending, stage, note, direction). Columns derived in JS: "Clients" = stage contains any of `['client','booked','confirmed','signed','advance','paid']` (`cabinet.js:69–74`); "Leads" = everything else non-`out` (`:75`); "Booked" = **calendar events**, future, kind-whitelisted (`:80–82`); Reminders = binder follow-ups + reminder events. UI: `dreamos-pwa/components/vendor/Cabinet.tsx:91–94` (columns), `:343` ("Everything kept"). Money masthead sums binders only. |
| S2 | **Studio → Leads** list page | "Leads — who to follow up with" (`app/vendor/studio/page.tsx:42–43`) | `GET /api/v2/vendor/leads/:vendorId` | `src/api/vendor/leads.js:115–116` | **public.leads** (typed; state enum `new/contacted/quoted/booked/lost`, `leads.js:59`) | name, city, wedding_date, budget_max→budget_total, `state` as badge (`badgeAlert` when `lost`). Plus the **R1(b) cross-chip**: a display-only whisper "In your books · booked · ₹20k in" when a **binder** shares the phone (`app/vendor/list/[slice]/leads.tsx:30–52`) — the *only* place the twin is disclosed, and only when both rows carry phones. |
| S3 | **Studio → Clients** list page | "Clients — your people" | `GET /api/v2/vendor/cabinet/:vendorId` (yes — the cabinet endpoint) | same as S1 | **engine.records** — `cabinet.clients`, the stage-word slice (`app/vendor/list/[slice]/clients.tsx:2–4, 24`) | BinderCards: money story, stage, note timeline, missing-cell chips; reverse cross-chip from **public.leads** by phone (`clients.tsx:25–33`). Note: `public.clients` and its route `src/api/vendor/clients.js:47–58` still exist, but **no slice page reads them** — the word "Clients" in the UI now means binders. |
| S4 | **Studio → Invoices** list page | "Invoices — who owes me money" | `GET /api/v2/vendor/invoices/:vendorId` | `src/api/vendor/invoices.js:76–98` | **engine.records** `direction='in'`; invoice "state" **derived from the numbers** (`deriveInvoiceState`, `:64–73`; comment `:65`: "engine payment_status is free-text, so we trust the numbers"). `public.invoices` is written only when a formal numbered PDF is minted (`generateInvoiceForBinder`, `:334–396`) and **never read by this page**. | client_name, amount_total, amount_paid, amount_owed, derived state (unpaid / advance_paid / paid / cancelled), `invoice_number: null` for binder rows. |
| S5 | **Studio → Expenses** list page | "Expenses — what went out" | `GET /api/v2/vendor/expenses/:vendorId` | `src/api/vendor/expenses.js:29–56` | **engine.records** `direction='out'` ("expenses now read Harvey/Donna's ledger", `:29–32`) | payee (client cell), amount, date, note, lifetime `total_spent`. |
| S6 | **Studio → Events** list page | "Events — schedule and shoots" | `GET /api/v2/vendor/events/:vendorId` | `src/api/vendor/events.js:114–121` | **public.events** (calendar) | title, kind, date/time, state. May carry `linked_binder_id` (0070) but the page doesn't join it. |
| S7 | **Chat masthead** — GreetingLine ("Two letters await… 3 invoices remain to be collected"), the Ledger strip, the "N New Enquiries" pill, CommandBar ("N unread / N incomplete") | implicit: *this is your business right now* | `GET /api/v2/vendor/context/:vendorId` | `src/api/vendor/context.js` | **public.leads** state='new' (`:89`), **public.invoices** unpaid/advance_paid (`:71`), **public.events** (`:79`), **public.notes** (`:97`) | counts + rows. Rendered in `app/vendor/page.tsx:85–160` (greeting/ledger), `:240–320` (EnquiryCard), `components/vendor/CommandBar.tsx:281–320`. **Same screen as S1 and S9, different plane than both.** |
| S8 | **Chat turn view cards** — FilingChips ("Filed / Undo") after a write | "done means witnessed" | streamed beats from `POST /api/v2/vendor/chat` | `src/api/vendor-engine/chat.js` (`translateBeat`, `:54–90`) | **engine.records** / **public.events** — whatever the Donna door actually wrote; chip derived only from the witnessed result (`deriveFiling`) | one-line summary + record_ref + 30-s undo (`components/vendor/FilingChip.tsx:1–10`). Honest per-write; carries no plane label. |
| S9 | **THE ASSISTANT'S OWN CONTEXT** (Exhibit C) — what Victor "knows" when he speaks | soul + snapshot header claim *the real picture*: "[Donna's snapshot — what's open and near, **kept true for you**]" (`donna.ts:174`); soul: "she… lays the real picture in your hands before you ever speak" (`harveySoul.ts:110`) | n/a (context assembly inside `runTurn`) | `src/engine/src/core/loop.ts:210` — dynamic block = ownerBlock + date + factsBlock + **snapshot** + donnaMsgs + shelfBlock + calendarSnapshot + recentActivity | **Snapshot** = durable note in `engine.agent_snapshot`, surgically patched per confirmed write (`donna.ts:152–166`); items are `lead:` lines from **public.leads** and `record:` lines from **engine.records**. **Rebuild** (`donna.ts:63–145`) reads public.leads + engine.facts + **engine.money_entries** — and **never engine.records**. Money section reads a table nothing writes ("honest-empty until Step 7", `donna.ts:113–114`). Activity block: 15-min window, 5 rows (`src/lib/vendor/snapshot.js:36–37`), and only `harvest_patch`/`provider_downgrade` are ever logged (`chat.js:560,606`; `harvest.js`) — list-page and binder-door writes don't log. Victor holds **no DB tools** (`loop.ts:5, 220–227`); his only path to binder ground truth is dispatching Donna (`donna_find`, which reads **engine.records only** — `tools/donnaFind.ts:1–12`). | free-text lines, e.g. `Meera — lead, lost (Rs 300000)` beside `Meera — Rs 60000 in — received Rs 20000 — stage booked`, **with no marker that they are the same human** (items carry `ref_type` internally but the rendered text Harvey reads does not; `recordPrimitives.ts:21–45`, `donnaLead.ts leadItem`). |

Sibling context surface: the WhatsApp agent (Myra) builds its snapshot from `src/lib/vendor/snapshot.js` — **all typed plane** (leads/invoices/events/notes, `:52–82`). So the two AI surfaces themselves read different planes.

---

## 2. The Conflict Census — mechanisms by which one human appears twice with different states

**M1 — Dual creation, no identity spine.** The same person can be filed as a typed lead (WA agent, list-page Add, `donna_lead`) *and* as a binder (Victor→Donna chat, BinderCard/AddSheet via `binderWrite.js`, invoice create via `invoices.js:214+`). Nothing dedupes across planes; the only join is optional phone (`phoneKey`). One human, two rows, two lifecycles — the precondition for every conflict below.

**M2 — Two independent state machines with no propagation.** `public.leads.state` (enum, moved by `PATCH /leads/:id/state`, `leads.js:205–255`) and `engine.records.stage` (free text, moved by `donna_stage`/BinderCard) never touch each other. Marking a lead **lost** on S2 does not touch the binder; staging a binder **booked** in chat does not touch the lead. This is the founder's screenshot verbatim: "booked, ₹20k received" (S1/S3, binder) coexisting with "LOST" (S2, typed).

**M3 — The list page's own delete manufactures the LOST twin.** Swipe-delete on the Leads slice is implemented as `PATCH state:'lost', reason:'Removed from list'` (`app/vendor/list/[slice]/leads.tsx:22–24`). A vendor "tidying" a lead they already converted in chat *creates* the booked/LOST contradiction — and `patchLeadSnapshot` (`leads.js:189–202, 254`) then writes "…lead, lost…" into the assistant's durable context, where it **persists indefinitely** (nothing removes lead items on close; only DELETE removes, `:325,338`).

**M4 — Split money truth: masthead vs Invoices page.** S7's "N invoices remain to be collected" counts `public.invoices` in unpaid/advance_paid (`context.js:71–75`); S4 shows derived states over `engine.records`. Formal invoice rows are minted at PDF time and, when the binder's figures later move, a *fresh* numbered invoice is minted while the stale row is left standing in unpaid/advance_paid (`invoices.js:341–383` — "Numbers may inflate per booking; that's accepted"). Nothing ever settles old `public.invoices` rows → the chat masthead can permanently claim invoices outstanding that the Invoices page (numbers-derived) shows as paid.

**M5 — Two "new leads" counts on adjacent surfaces.** S7 counts `public.leads` state='new'; `GET /today` (`vendor-engine/today.js:49–99`) computes `new_leads`/`open_leads_count` from **lead-stage binders**. Any consumer of both shows two different "leads" numbers for the same vendor at the same instant.

**M6 — Archive/delete asymmetry.** `donna_hide` archives a binder (invisible to S1/S3/S4/S5) but the typed twin stays live on S2; conversely a soft-deleted lead (`deleted_at`) vanishes from S2 while its binder keeps trading on S1/S3.

**M7 — Phone-asymmetric twins are silent.** The R1(b) cross-chips (S2↔S3) fire only on a 10-digit phone match on *both* rows. Binder without phone, lead without phone, or mismatched formats under 10 digits → no whisper, and each surface presents its twin as the whole truth.

**M8 — THE ASSISTANT (census question 2): yes, it can hold two truths, and it voices the wrong one.** Mechanism, per Exhibit C:

1. Victor's per-turn context contains the snapshot only (`loop.ts:117, 210`). Records are never injected wholesale; Victor has no read tools of his own (`loop.ts:220–227`).
2. The snapshot can simultaneously hold `lead:<id> "Meera — lead, lost (Rs 300,000)"` (written by M3's patch) and `record:<id> "Meera — Rs 60,000 in — received Rs 20,000 — stage booked"` — **unannotated, unjoined** twins.
3. Three droppers make the binder line the fragile one: (a) any snapshot **rebuild** reads `public.leads` + `facts` + `money_entries` and *omits engine.records entirely* (`donna.ts:63–145`) — binder lines can only be lost, never regained; (b) the structured money view reads `money_entries`, a table nothing writes ("honest-empty until Step 7") — hence, verbatim, "**no current booking or payment in flight**"; (c) the cross-surface activity block covers 15 minutes/5 rows and the binder doors don't log to it — a binder updated **38 minutes prior** is invisible.
4. The framing then launders the surviving twin into confident speech: the snapshot header says "**kept true for you**"; the soul says Donna "lays the real picture in your hands **before you ever speak**" and mandates Donna-first only for *documents* ("the file outranks your memory", `harveySoul.ts:99`). For *records*, the in-context snapshot pre-empts the `donna_find` dispatch — the exact **confidence-triggered-retrieval gap** the codebase itself names and fixed for the document shelf ("he must never have to elect to look… or the confidence-triggered-retrieval gap (the RBI mislabel, 2026-06-11) returns", `loop.ts:121–127`) but did **not** fix for records.

So: could the model have known? **Yes** — one `dear_donna_talk` → `donna_find("Meera")` away, and possibly already in-context if no rebuild had dropped the record line. It spoke from the lead line anyway, with system-supplied confidence. The assistant is not a neutral reporter of the twin problem; it is a third surface with its own (lossier) plane selection and a *totalizing label of its own* ("kept true for you").

---

## 3. The Vocabulary Audit — same word, different-plane objects

| Word | Where | What it actually denotes |
|---|---|---|
| **LEADS** | S2 page title/badge | `public.leads` rows, enum state |
| | S1 cabinet column "Leads" | binders whose free-text stage *lacks* a client-word and direction ≠ out (`cabinet.js:75`) |
| | S7 "New Enquiries" / "letters await" / CommandBar "unread" | `public.leads` state='new' only |
| | `/today` `open_leads_count` | lead-stage **binders** (`today.js:75–82`) |
| **CLIENTS** | S3 page "Clients — your people" | **binders** (cabinet stage-word slice) |
| | S1 cabinet column "Clients" | same binder slice |
| | `public.clients` + `clients.js` | a typed table no vendor surface reads anymore (vestigial; still writable via its route) |
| **booked** | `leads.state='booked'` | typed pipeline closed-won (S2 badge) |
| | binder `stage` containing "booked" | lands in the cabinet's **Clients** column — *not* its Booked column (`cabinet.js:69–74`) |
| | S1 cabinet column "**Booked**" | **calendar events** (`public.events`, future, kind-whitelisted, `cabinet.js:80–82`) — a third object entirely |
| **INVOICES** | S4 page | money-IN binders with numbers-derived state |
| | S7 "invoices remain to be collected" | `public.invoices` enum rows (M4) |
| | "invoice_number" | exists only on the formal `public.invoices` row minted at PDF time; S4 rows show `invoice_number: null` |
| **paid / advance_paid / unpaid** | S4 | derived from `amount`/`amount_received` arithmetic |
| | binder `payment_status` | free text ("claimed, outstanding, partial…", `DONNA_MONEY_EDIT_TOOL`), can contradict the arithmetic on the same row; S1's MoneyBadge derives from numbers while the stage word says otherwise |
| **EVENTS** | `public.events` | **THE CALENDAR** — 14 cols: `event_date`, `event_time`, `kind` (13 values incl. `blocked`), `state`, `slot` (0077), `linked_binder_id`, `linked_lead_id`, `deleted_at`. Owner-XOR vendor/couple (0013) |
| | `engine.events` | **AN AGENT AUDIT TRAIL — NOT A CALENDAR.** 8 cols: `agent_id`, `actor`, `action`, `entity_type`, `entity_id`, `summary`, `created_at`. Live; written by `distill.ts:164/:198`, `recordPrimitives.ts:62`, read by `donnaBench.ts:155`. Near-identical in shape to `public.vendor_activity_log` — **two activity logs, two planes, one concept** |
| | | **The damage (F-04.30/F-04.31, TDW_04 B1):** this is **the calendar block's own word.** B1-B8 are entirely about `public.events`. The spec's one-writer guardrail was grep-shaped on the bare name — *"any other `.from('events')` insert/update in vendor paths is a failed session"* — which flags three innocent `engine.events` writes. Worst case: a session "resolves" the flag by routing an **audit-trail write through `eventWrite`**, silently inserting audit rows into vendors' calendars. Caught by B1's plane proof **before a line of SQL was written**. Guardrail re-worded; `engine.events` writers are **exempt by plane, not by pardon** |
| **LEADS (the tables)** | `public.leads` | **THE LIVE TYPED PLANE** — 27 cols. `donna_lead` files here (LD-1). `source`, `budget_max`, `wedding_date`, `state`, `draft_meta`, `vendor_summary`, `deleted_at` |
| | `engine.leads` | **STOP-WRITTEN AND EMPTY** — 11 cols (`agent_id`, `name`, `contact`, `source`, `referrer`, `stage`, `value_estimate`, …). `donnaLead.ts:4` says so verbatim: *"a table verified EMPTY in prod (never wired into DONNA_TOOLS; Amendment One…)"* |
| | | **Note:** §3's other **LEADS** row (above) maps the *surfaces*. This row is about the two **tables**. Both are needed; neither replaces the other |
| **MESSAGES** | `docs/SCHEMA.md:154-172` | `public.messages` — **17 columns**, the WhatsApp shape: `direction`, `channel`, `body`, `media_url`, `sent_by`, `twilio_sid`, `delivery_status`, cost cells |
| | `engine.messages` (undocumented) | **6 columns**: `id`, `conversation_id`, `role`, `content`, `tool_calls`, `created_at` (writer `memory.ts:133`; count per `db/BASELINE.md`). The engine's DDL is absent from the ladder — `db/migrations/` 0001-0074 is public-only |
| | | **The damage (F-04.22, TDW_04 B0):** a session writing engine SQL from SCHEMA.md queries `body`/`sent_by`, gets zero rows, and reports *"the turn does not exist"* — a FABRICATED verdict from a correct-looking query. `docs/db/ENGINE_SCHEMA.md` (B0) is the cure |
| **"Everything kept"** | S1 header | precisely *not* everything: binders + calendar only. A typed lead with no binder twin — including every WhatsApp-enquiry lead — never appears in "Everything kept". |

The single word doing the most damage is **booked**: on one screen it is a calendar row, a binder in the *Clients* column, and a lead badge — three planes, one vocabulary.

---

## 3.5 — THE COPY LAW, AMENDED: ITS STORAGE CLAUSE (CE-promoted 2026-07-15, TDW_04 B1)

> **Internal persona names are never stored or rendered on vendor planes at any layer. The vendor-facing persona name is lawful in content, banned in chrome. Sweeps verify storage and render separately, against this distinction.**

**Three layers, not two:**

| | Harvey · Donna (**internal**) | Victor (**vendor-facing**) |
|---|---|---|
| **Chrome** (labels, confirms, toasts, empty states) | **BANNED** | **BANNED** — the founder's chrome law, untouched |
| **Content** (chat speech, titles, notes, provenance) | **BANNED** | **LAWFUL** |
| **Storage** (vendor-plane rows) | **BANNED** | **LAWFUL** |

**Why the distinction is load-bearing, not a loophole.** `scrubText` maps `Harvey → Victor` **precisely because Victor is what the vendor may see.** A clause forbidding stored "Victor" would forbid the output of the function the same law mandates. And `donnaLead.ts:197/:234` stamps `"estimate via Victor"` onto every lead carrying a value estimate — **deliberate provenance, in our own source, telling a vendor where a number came from.** Nine rows. Collapsing the two classes would have deleted true, useful information to satisfy a clause aimed at a leak it isn't.

**Why the clause exists at all (F-04.34, TDW_04 B1).** A4's copy sweep proved **zero rendered persona strings** and passed. **It checked RENDER. It never checked STORAGE.** `scrubText` is a render-time firewall on **one lane**; the calendar grid, the day sheet, `/api/v2/vendor/events` and all of B5 read `events.title` **raw**. Specimen: `c679204b`'s notes carried *"as requested by Harvey"* from **2026-07-14** — through the entire A-block audit, through A4's sweep, and through B0. Nobody saw it because nobody read `notes`. **The law was verified against the wrong layer for two blocks running.**

**Enforcement:**
- **Write doors scrub-with-witness** — `chat.js::scrubForStorage` maps internal → vendor-facing at write, and logs `persona_scrub_on_write` to `vendor_activity_log` **only when the scrub fires**. Data stays clean; the model defect stays **visible**. That trail is Block 06's evidence feed — a silent fix would have cleaned the pipe and hidden the disease.
- **Sweeps:** `db/queries/persona_storage_census.sql` — scoped `\y(harvey|donna)\y`, **never `victor`** (a sweep that re-flags lawful provenance becomes noise nobody reads).
- **THE EVIDENCE PLANE IS NEVER SWEPT** (standing rule): `engine.messages` is the turn log and the trail 06 exists to read. Rewriting it would destroy the record of the defect.

**WITNESSED CLEAN 2026-07-15** (founder-run, prod, post-cure): all seven legs — `public.events.title/notes`, `public.leads.notes/vendor_summary`, `engine.records.note/.reason_for_action/.client` — **ZERO ROWS.** `engine.records` was clean from the first run: the cabinet's prose was never contaminated.

**GATE:** B5 does not open until the storage census has run and its ruled fixes are applied. **No calendar surface gets built on unswept titles.**

## 4. Note Accretion — verified mechanics

Append machinery (`recordPrimitives.ts`):

- `writeFields` (`:133–164`): for fields in the append set, it **reads the prior value, then writes `existing + '\n' + new`** (`:146–155`). `reason_for_action` always appends (`:125–131`); `note` appends for `donna_note_append`, `donna_edit`, and both money doors; only `donna_note` replaces.
- `donna_money` on a binder that already carries a figure **always** appends a stamp `[money replaced YYYY-MM-DD] old → new.` (`:406–421`) — **with no old ≠ new guard**: re-stating the same total re-stamps `Rs 40,000 in → Rs 40,000 in`.
- `donna_money_edit` (`:452–483`) appends `[money corrected YYYY-MM-DD] …`. For `amount` / `amount_received` / `amount_pending` the confession is pushed **unconditionally when the field is present in input** (`:465` checks `old != null` only for formatting, not `old !== new`); only `direction` and `payment_status` have change guards (`:470, :474`). Any caller that submits the full money set on save (a form resubmit, a retry, Donna routing one instruction through `donna_money` *then* `donna_money_edit` in a resumable session) stamps duplicate `X → X` blocks.
- No dedup, no pruning, no idempotency key on the doors; the read-then-append is non-atomic (concurrent harvest + door writes can interleave). Growth is monotonic by design.

**Do duplicated blocks propagate? Yes, four ways:** the cabinet card note (`Cabinet.tsx` `dd-card-note`), the BinderCard "story timeline" which splits the note on `\n` and renders every line ("money-edit confessions verbatim among its lines", `BinderCard.tsx:2–8`; `noteTimeline`, `lib/vendor/cabinet.ts:87–90`), Glance/"The Brief" (`glance.ts` — last three notes, whole), and **the assistant's snapshot**, because `recordItem` embeds the entire `note` into the snapshot line (`recordPrimitives.ts:34`) — so every duplicate stamp inflates the model's per-turn context and its confidence-bearing text.

**Verdict on Q4:** the append mechanics are as designed (grow, never erase), but duplicate stamps are a real, code-verifiable failure mode caused by (a) missing same-value guards on the two money doors and (b) multi-door routing/retries without idempotency — not by the append primitive itself.

---

## 5. The Verdict

The confusion is a **weighted braid, and the weights are measurable: (b) > (d) > (a) > (c).**

**(b) Two-surface presentation with totalizing labels — the primary cause (~45%).** The architecture is two planes *by design*, and the roadmap already owns the identity spine. What the surfaces do with that design is the sin: the cabinet says "**Everything kept**" while reading exactly one plane plus the calendar (S1); Studio says "**Business**"/"Your Studio" while its five pages straddle both planes *invisibly* (Leads typed; Clients/Invoices/Expenses binders; Events calendar — §1); the chat masthead on the *same screen as the cabinet* counts a third selection (S7, typed + a moribund invoices table). No surface anywhere declares its plane; the URL flip (`core.js:26–37`) erased even the developer-visible distinction. Evidence that presentation, not data, is the lever: the one place a lane is disclosed — the R1(b) cross-chip "In your books · booked · ₹20k in" — turns the founder's exact screenshot from a contradiction into an explanation.

**(d) The AI's context assembly as confusion amplifier — the second strand (~30%), and the most corrosive.** The other surfaces show conflicting *rows*; the assistant converts a conflicting row into a confident *sentence*. §2-M8 shows the full chain: plane-asymmetric rebuild (records dropped, `donna.ts:63–145`), a money view wired to an empty table (`:113`), a 15-minute activity bridge the binder doors don't feed, permanent "lost" lead lines, unannotated twins, and a header ("kept true for you") plus soul framing that suppress the very `donna_find` dispatch that would have resolved Meera. It doesn't fail to resolve the twins — it launders one twin into speech, which is worse than either list page because vendors treat Victor as the arbiter between them.

**(a) The two-plane architecture (~15%).** It supplies the raw material (M1/M2: dual creation, unlinked state machines) and nothing surface-side can *merge* twins. But the brief's premise is right that it isn't the proximate cause: with lane declarations and one honest arbiter, two planes are survivable; without them, even one plane with two selections (M5: two "new leads" counts) would still confuse.

**(c) Specific state contradictions (~10%).** LOST-vs-booked, masthead-vs-invoices, duplicate stamps — these are the *symptoms* vendors screenshot, each traceable to M2/M3/M4 and the missing guards in §4. Fixing instances without fixing (b)/(d) regrows them.

---

## 6. Recommendations — surfaces only, ranked, costed (S/M/L)

Ordered by confusion-reduced per unit cost. The cross-plane identity spine is roadmapped and out of scope; everything below is presentation, read-path selection, and context assembly.

**R1 (S) — Lane declarations on every record surface.** A one-line provenance strip under each surface title, in the house voice: cabinet → "*What you've told Victor* — your working binders + calendar"; Leads page → "*Enquiries pipeline* — from WhatsApp and your enquiry link"; Clients/Invoices/Expenses → "*From your binders*"; Events → "*Your calendar*". Rename the cabinet header: "**Everything kept**" → "**Everything you've filed**" (or "Kept from your chats"). One string per surface; kills the totalizing claims that make each surface read as *the* truth. (`Cabinet.tsx:343`, `studio/page.tsx:41–48`, slice shells.)

**R2 (S) — Universalize and upgrade the cross-chip; declare its blindness.** The R1(b) whisper already exists on Leads and Clients; extend it to the cabinet's binder cards, the Booked/Events rows (via `linked_binder_id`, already migrated), and Invoices rows. Make it tappable → jump to the twin. Where a surface *knows* it can't see twins (no phone), say so once per list ("Some entries may also exist as enquiries — link phones to connect them"). Absence must stop meaning "no twin".

**R3 (M) — Fix the assistant's context assembly (the (d) strand); highest confusion-per-fix after labels.**
&nbsp;&nbsp;a. Add `engine.records` to `rebuildSnapshot` so binder lines survive rebuilds (symmetric planes in the one context the model trusts).
&nbsp;&nbsp;b. Annotate twins at snapshot-render time: when a `lead:` and a `record:` item share a phoneKey/name, emit one joined line — "Meera — enquiry marked lost *on the list page*, **but** binder says booked, Rs 20,000 received (updated 38 min ago) — reconcile before advising."
&nbsp;&nbsp;c. Soften the totalizing header: "kept true for you" → "what's open and near — *confirm money and stage with a lookup before you speak to figures*", and add one soul line extending the document rule to records ("the cabinet outranks the snapshot as the file outranks your memory").
&nbsp;&nbsp;d. Log binder-door and lead-door writes to `vendor_activity_log` and widen/deepen the recent-activity read past 15 min for record mutations — the 38-minute blind spot closes.
&nbsp;&nbsp;e. Remove or gate the empty-`money_entries` read until Step 7 lands, so "no payment in flight" can never be asserted from a table nothing writes.

**R4 (M) — Read-your-writes coherence on the chat screen.** The masthead (S7) sits beside the cabinet (S1) and Victor (S9) yet reads a third selection. Repoint the GreetingLine/Ledger/CommandBar money-and-invoice counts at the same derived-from-binders numbers the Invoices page uses (or the `/today` handler, which already computes them engine-side), and either settle or stop counting stale `public.invoices` rows in "remain to be collected". Keep "New Enquiries" typed — it genuinely is the enquiry pipeline — but label it as such (R1).

**R5 (S) — Defang the Leads-page delete.** "Removed from list" ≠ LOST. Swipe-delete should either use the real soft-delete door (which already exists and correctly *removes* the snapshot item, `leads.js:306–338`) or ask "Lost the enquiry, or already booked them?" — the second answer is exactly the moment to offer the twin-link. This single change stops manufacturing the flagship booked/LOST contradiction *and* stops writing permanent "lost" lines into Victor's context.

**R6 (S) — Same-value guards + idempotency on the money doors.** Skip the stamp when old === new in `donna_money` and the amount fields of `donna_money_edit` (`recordPrimitives.ts:406–421, :465`); dedupe consecutive identical note lines at append time. (Technically a write-path tweak, but it is purely a *presentation-of-history* fix: the ledger's story stops shouting duplicates across four surfaces.)

**R7 (L) — Decide the cabinet's role now that list pages exist, then consolidate to one canonical per-person view.** Today S1 and S3 render the same binder population in different chrome, while S2 renders the twin population — three part-truths. Recommended end-state: the *list pages* become the canonical, lane-labelled working surfaces; the cabinet becomes explicitly what its poetry already implies — a chat-adjacent *glance* ("what you've filed with Victor"), demoted from "Everything kept" to a quick-look sheet, each card deep-linking to its canonical slice page. Alternative (larger): a single "person page" that renders both planes side-by-side with the enquiry state and the binder story on one card — the presentation-layer precursor the roadmapped identity spine can later make real. Either way, one surface must be nominated as *where truth wins*, and every other surface must visibly defer to it.

---

*Method note: findings are from static read of both repos at HEAD (shallow clone, 2026-07-15); no database was queried, so row-level claims (e.g., the Meera rows) rest on the founder-provided transcript plus the code paths that produce exactly those states. Every mechanism cited is reproducible from the file:line references above.*
