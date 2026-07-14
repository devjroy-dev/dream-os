# TDW_02_ENGINE_FINAL — Write-First Filing, One Data Plane, Tiered Models
**Block:** 02 · **Repos:** dream-os (primary), dreamos-pwa (wire + cards + config UI)
**Depends on:** TDW_01 hygiene complete · **Feeds:** TDW_03 CRUDS, TDW_10 admin
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs execution

---

## 0. READ FIRST (verify each against live code before any edit — protocol §3.2)
| File | What you are verifying |
|---|---|
| `src/engine/src/core/loop.ts` | Harvey holds no DB tools; `dear_donna_talk` is the only operational path; `TurnResult` shape incl. `view`, `cost_inr`; `TurnEvent` beats; `MAX_ITERATIONS=12`, `TALK_FUSE=5` |
| `src/engine/src/core/harveySoul.ts` + `consultantHarveySoul.ts` | Soul prose style, current dispatch posture, where filing instinct must weave in |
| `src/engine/src/core/donna.ts` | `runDonnaTurn` resumable session; snapshot patch-from-confirmed-write |
| `src/engine/src/core/tools/donnaLead.ts` | Writes engine-schema `leads` (`agent_id, contact, value_estimate, stage`); read-before-write pattern |
| `src/engine/src/core/tools/recordPrimitives.ts` | `donna_money / donna_stage / donna_edit / donna_note / donna_money_edit`; one binder = one money story; growing note |
| `src/engine/src/core/cabinet.ts` + `docs/MANIFEST_SPEC.md` | Read-side manifest bucketing; FIRST MATCH WINS; NO HUSK; tone system |
| `src/engine/src/core/models.ts` | `startModelForTier`, `canEscalate`, `calcCostInr`, `MODELS` |
| `src/api/vendor-engine/chat.js` | The door; publication firewall translating engine beats → Myra wire (`text_delta/handoff/operator_action/operator_report`); streaming + non-streaming paths |
| `src/api/middleware/resolveAgent.js` | vendor → agent_id mapping (needed for P1 both directions) |
| `src/api/admin/config.js` + migration `0045` | admin_config exact shape (KV routes `/` and `/:key`) |
| `docs/SCHEMA.md` §leads | `public.leads` exact columns: `vendor_id, name, phone, email, wedding_date, wedding_date_precision, wedding_city, event_types[], budget_min, budget_max, source, referrer_name, state(new/contacted/quoted/booked/lost), raw_message, notes` |
| `dreamos-pwa: hooks/vendor/useChat.ts` (or equivalent) + `components/vendor/ChatThread.tsx`, `MessageBubble.tsx` | What beats the PWA currently renders |
| `devroy-dev/z: src/llm.ts`, `src/models.ts` | The facade pattern being ported (P5) |

## 1. PROBLEM (from live code, 2026-07-14 audit)
1. Victor's dispatch threshold: facts accumulate in conversation until he judges the picture complete → nothing filed on abandonment ("asks too much, logs late").
2. `donnaLead` writes an engine-schema leads table the CRUD never reads → Leads slice blind to the AI. Clients/money live in `records`; only Cabinet reads them.
3. Model + caps: engine hardcodes Anthropic; `admin_config` caps never enforced; no tier→model routing.

## 2. LOCKED DECISIONS GOVERNING THIS SPEC (from MASTERPLAN)
LD-1 Plane Doctrine (typed = money/legal + leads; records = binders/loops/notes) · LD-2 drafts visible immediately · LD-3 harvest forward-only · LD-4 inline fill · LD-7 tier flip · plus this block's founder rulings: **filing law woven affirmatively into the soul as character, never a rules list**; **wishbone**: a partial field in the CRUD taps into BOTH options — complete inline OR inject context to Victor; **undo windows: yes**; **harvest patches both planes**; **downgrade-with-upgrade cards constantly visible, sleek but persistent**; **voice input deferred to Block 09**.

## 3. MIGRATION RESERVATIONS (ladder at 0071; LD-8 applies)
| # | File | Adds |
|---|---|---|
| 0072 | `0072_draft_meta.sql` | `draft_meta jsonb` on `public.leads`, `public.invoices` + partial indexes (SQL in P3) |
| 0073 | `0073_llm_config_seed.sql` | admin_config seed rows for model routing + caps namespaces (P5) |

(Events/clients/expenses `draft_meta` deferred: under LD-1 Donna files clients into `records` (read-time completeness), and events/expenses arrive effectively complete (title+date / amount are the create minimums). Extend later only if 03 proves the need — note in handover.)

---

## PHASE TABLE (one phase per sitting, in order)

### P1 — donnaLead → public.leads (un-blinds the Leads CRUD)
**Files:** `src/engine/src/core/tools/donnaLead.ts`, `src/api/middleware/resolveAgent.js` (read only), new `src/engine/src/core/vendorIdentity.ts`
1. Build `vendorIdFromAgent(agentId)`: resolve via the same join `resolveAgent.js` uses, reversed. Cache per-process (Map, 10min TTL). If unresolvable → tool returns honest ERROR display (never a silent drop).
2. Rewrite `executeDonnaLead` writes to `public.leads`:
   - `agent_id` → resolved `vendor_id`
   - `contact` → `phone` (verbatim string; no formatting)
   - `value_estimate` → `budget_max` (leave `budget_min` null; note in `notes`: "estimate via Victor")
   - `stage` → `state`, word-mapped: `won→booked`, else pass-through if ∈ {new, contacted, quoted, lost}; any other word → `new` + original word appended to `notes`
   - `source` default `'victor'` when absent; `raw_message` = the vendor's message text passed down from the loop when available (verify what donnaLead receives; if the raw line isn't in scope, thread it through `runDonnaTurn`'s call — smallest honest change)
3. Read-before-write preserved: match on `vendor_id` + (`phone` OR case-insensitive `name`), update-not-duplicate exactly as the current engine-table logic does.
4. Set `draft_meta` per P3 rules on insert (P3 lands first? No — build P1 writing `draft_meta` code behind a column-exists check, OR sequence P3's migration application before P1 deploy; executor picks and records which).
5. Engine-schema `leads` table: STOP writing. Do not drop here — add it to the TDW_01 Phase C candidate list via handover (hygiene owns drops).
**Curl proof:** POST a chat turn "got an enquiry from Priya, 98xxx, Jaipur Dec wedding, around 2L" → `select * from public.leads order by created_at desc limit 1` shows vendor-scoped row; GET `/api/v2/vendor/leads/:vendorId` returns it.

### P2 — The Filing Law (soul weave — authoring instructions, not rules)
**Files:** `harveySoul.ts`, `consultantHarveySoul.ts` (same weave, consultant register), `donnaSoul.ts` (one alignment line)
**Doctrine (z codex-depth standard):** author the self; the behaviour falls out. No forbidden-phrase lists, no if-then rules, no numbered laws inside the soul. Append-and-weave: existing prose stays; new prose reads as the same man.
**What to author into Harvey (≤180 words total, in his voice, placed where the soul describes how he works with Donna):**
- Filing as *character*: he is a man whose respect for a client shows in the fact that nothing said to him is ever lost. The moment something real crosses the table — a name, a figure, a date, an enquiry — his hand is already moving; Donna hears it in the same breath he answers. Half a fact is still a fact; he'd rather open a thin binder now than trust his memory for an hour.
- His impatience works FOR capture: waiting for the full picture before filing is, to him, amateur hour — the picture completes itself around a binder that exists.
- He never announces filing as a process ("I have logged...") — it shows the way a good consultant's shows: in the certainty with which he refers back to things later.
**One line into Donna's soul:** thin openings are welcome; she opens with what exists and lets the note grow — never sends Harvey back for more before writing what she already has.
**Hard constraints:** total soul growth ≤ 1,200 chars across both Harvey souls; no existing sentence deleted or reworded except where the old dispatch posture directly contradicts the weave (quote any such removal in the handover); cache-stable — souls are static prefix, so this is a one-time cache re-write, acceptable.
**Proof:** three cold transcripts against the test vendor — (a) partial enquiry, (b) an amount with no name, (c) a rambling voice-note-style paragraph — each shows a Donna dispatch in turn 1 and NO field interrogation beyond at most one natural follow-up.

### P3 — Drafts on both planes
**Typed plane — migration 0072 (exact SQL):**
```sql
-- 0072_draft_meta.sql — TDW_02 P3 write-first drafts (typed plane)
alter table public.leads    add column draft_meta jsonb;
alter table public.invoices add column draft_meta jsonb;
comment on column public.leads.draft_meta is
'NULL = complete. Else {"missing":["field",...],"source":"victor|harvest","harvested":["field",...]}';
create index leads_draft_idx    on public.leads    (vendor_id) where draft_meta is not null;
create index invoices_draft_idx on public.invoices (vendor_id) where draft_meta is not null;
```
Expected sets (single source: new `src/lib/draftContracts.js`, CommonJS, imported by door + harvest; engine TS side gets a mirrored `draftContracts.ts` with a header comment naming its twin — keep both ≤40 lines so drift is visible):
- lead: `name, phone, wedding_date, wedding_city, budget_max`
- invoice: `due_date` (amount+client are create-minimums; an amountless invoice is a note, not an invoice)
Write path: wherever the engine or door inserts these rows (P1's donnaLead; `generateInvoiceForBinder` in `src/api/vendor/invoices.js`), compute `missing = expected − provided`, set/clear `draft_meta`; every update recomputes; empty → NULL (promotion).
**Records plane — zero schema change:** completeness is read-time. In `recordsView.ts`/`cabinet.ts`, compute per-record `missing_cells` against the manifest column it lands in (each column's match rule names the cells it cares about; absent expected cells = missing). Emit `missing_cells: string[]` on the wire wherever records/ViewRows are serialized (cabinet response + turn `view`). Tone: any record with missing_cells renders `cool` unless its own rule says otherwise.
**Wishbone wire (consumed by Block 03, defined here):** every serialized record/row gains:
```ts
draft?: { missing: string[];
  complete_inline: { method:'PATCH'; path:string };            // the typed CRUD patch route or binder edit door
  tell_victor:     { path:'/vendor'; primer:string } }         // primer: `About ${label}: the ${field} is ` — cursor lands after
```
Exact `complete_inline` targets: leads → `PATCH /api/v2/vendor/leads/:leadId` · invoices → `PATCH /api/v2/vendor/invoices/:invoiceId` · binder cells → `POST /api/v2/vendor/binders/:vendorId/:id/edit` (verify field names in each handler before wiring — protocol §6).

### P4 — Out-of-band harvest (both planes, forward-only)
**File:** `src/agent/harvest.js` (new; plain JS beside the door, NOT inside engine TS — it is infrastructure, not soul)
Trigger: fire-and-forget from `chat.js` after the turn's reply is sent (both streaming and non-streaming paths). Never blocks; never throws to the request.
Input: the vendor's raw message · this turn's `tool_calls` (incl. donna_calls) · the vendor's open drafts — typed rows where `draft_meta is not null` (cap 6, newest) + records rows with non-empty `missing_cells` (cap 6, via `loadRecords`).
Model: via P5 facade, surface `harvest` (default `glm-4.7-flash`).
Output contract (strict JSON, nothing else):
```json
{"patches":[{"plane":"typed","table":"leads","id":"…","field":"wedding_city","value":"Jaipur"},
            {"plane":"records","id":"…","cell":"date","value":"2026-12-04"}]}
```
Application rules (code-enforced; the model is never trusted):
1. Field/cell MUST be in that row's current missing set — else drop.
2. Target MUST currently be null/absent — never overwrite.
3. Row MUST belong to this vendor/agent — else drop AND log `harvest_cross_scope`.
4. Values pass the same validators as the equivalent write door (dates via the IST-anchored resolver; amounts through the moneyWords-side parser; records-plane patches go THROUGH `executeRecordTool`/edit door so supersession + witnessed-edit discipline hold — never raw SQL onto `records`).
5. Applied → recompute draft state; log `kind:'harvest_patch'` to `vendor_activity_log` with `{plane, id, field}`; Donna's snapshot patched via the same confirmed-write path the edit door uses.
6. Malformed JSON → one silent retry on Haiku (facade fallback) → give up silently. Harvest is best-effort.
7. Forward-only: reads nothing but the current turn (LD-3).
**Snapshot/context alignment:** `harvest_patch` entries surface in the RECENT ACTIVITY block the door already builds (verify its query; extend to include this kind) so Victor never re-asks a harvested fact.

### P5 — llm facade, tier routing, caps, downgrade/upgrade cards
**New files:** `src/lib/llm.js` (port z `llm.ts`: provider CONF {anthropic, glm→`https://api.z.ai/api/anthropic`/`ZAI_API_KEY`, deepseek→`https://api.deepseek.com/anthropic`/`DEEPSEEK_API_KEY`}; strip `cache_control` + web tools on non-anthropic; thinking-block suppression; typed errors incl. `LLMToolFidelityError`) · `src/lib/modelRouter.js` (`resolveModel(surface, tier)` → `{provider, model, escalation}`; precedence `LLM_PROVIDER` env → admin_config → default map; 60s in-process cache).
**admin_config seed — migration 0073:** KV keys (verify exact KV shape from `admin/config.js` first):
`model.pwa_vendor.trial={"provider":"glm","model":"glm-4.7-flash"}` · `.essential={"provider":"deepseek","model":"deepseek-v4-flash"}` · `.signature={"provider":"anthropic","model":"claude-haiku-4-5-20251001"}` · `.prestige={…haiku…,"escalation_model":"claude-sonnet-4-6"}` · `model.harvest.*=glm` · `caps.pwa_vendor.<tier>` rows exist from 0045 — enforcement below. WhatsApp surfaces get NO rows (stay direct-Anthropic until blocks 05/06).
**Engine integration:** `loop.ts` + `donna.ts` construct their Anthropic client via the facade using `resolveModel('pwa_vendor', tier)` / harvest per its surface. `startModelForTier`/`canEscalate` keep governing the haiku↔sonnet dimension; the facade adds the provider dimension beneath them. Behavior on anthropic path must be byte-identical (regression proof in acceptance).
**Fallback:** `LLMToolFidelityError` or unparseable tool_use on non-anthropic → one silent same-turn retry on Haiku; log `kind:'provider_downgrade'`.
**Caps enforcement at the door (`chat.js`):** count today's vendor turns (IST day) from the conversation store; compare to `caps.pwa_vendor.<tier>`; over cap → no model call, respond with the caps payload. Graceful, never a dead input box.
**Caps/upgrade wire (sleek but persistent — founder ruling):**
```ts
meta: { tier:string; turns_used:number; turns_cap:number|null;
        state:'ok'|'nearing'|'capped';           // nearing = ≥80%
        upgrade:{label:string; href:'/vendor/settings#tier'} }
```
Attached to EVERY chat response. PWA (`app/vendor/page.tsx` + a new `components/vendor/TierMeter.tsx`): a one-hairline brass meter pinned above the InputBar — count `7/25` in Jost 11px, gold fill proportional, upgrade word appears at `nearing`, whole bar warms at `capped` with the upgrade CTA. Max one gold element; no modal, no toast, never blocks typing until capped.
**Probe:** two identical-prefix GLM calls; compare usage for implicit-cache evidence; record finding in handover + UNIT_ECONOMICS.md.

### P6 — Undo windows + dispatch theatre (the trust surface)
**Beats (door already translates engine beats → Myra wire; extend, don't replace):** `operator_action` beats gain `{summary, undo?: {method,path,body?}, record_ref?:{plane,id}}`. Undo targets — the existing witnessed doors ONLY: binder money → `.../money-edit` (write the prior figure back; the confession trail makes this native) · binder open/jot → `.../hide` · typed lead → `PATCH state:'lost'`? NO — undo of a lead create = `DELETE /api/v2/vendor/leads/:leadId` (verify route exists; it does — leads.js `/:leadId` delete) · invoice → `/cancel`. Where no honest reverse door exists, emit NO undo (never invent).
**PWA rendering (`ChatThread`/`MessageBubble` + new `components/vendor/FilingChip.tsx`):** during a turn, each `operator_action` renders a quiet italic hairline chip — `Donna is filing… ✓ 2.5L in — Priya's binder` — Cormorant italic, brass hairline, no card chrome. On completion the chip settles with a 30s `Undo` word (Jost, letterspaced) that fades; tap → fires the undo call → chip restates honestly (`Undone — figure restored to 2L`). Failed writes render terracotta-hairline with one-tap `Retry` (re-sends the same instruction as a hidden turn primer). Turn `view` rows render as the existing carousel; each card deep-links via `record_ref`.
**Guardrail:** undo is client-timed theatre over real doors — no server-side pending state, no soft-delete additions, no new schema.

---

## 4. GUARDRAILS (sacred — violating any is a failed session)
Souls' voice and structure (P2 constraints) · TALK_FUSE and MAX_ITERATIONS semantics · snapshot patch-from-confirmed-write discipline · Cabinet stays READ-ONLY · records mutations only through Donna's doors (harvest included) · WhatsApp engines untouched · anthropic-path behavior byte-identical post-facade · design system (one gold max on the tier meter; no dark mode) · no localStorage in any new code path (native clause) · never a false "done" anywhere on the wire.

## 5. ACCEPTANCE CRITERIA
1. P1 curl proof passes; Leads CRUD shows a Victor-captured lead within one turn.
2. P2 three cold transcripts pass (dispatch turn 1; ≤1 natural follow-up; voice intact — founder reads and approves the transcripts).
3. Abandonment test: single partial message, close app → typed row exists with `draft_meta.missing` populated; Cabinet shows the thin binder with `missing_cells`.
4. Harvest: adversarial patch list (overwrite attempt, cross-vendor, unknown field) → all dropped, logged; legitimate patch applies on BOTH planes and RECENT ACTIVITY suppresses re-asking.
5. Tier flip in admin → next turn changes provider (activity log proof), zero deploy; `LLM_PROVIDER` env overrides all; missing provider key → anthropic fallback + `provider_misconfigured` log.
6. Full Donna tool suite exercised on glm-4.7-flash: zero false "done"; downgrade rate logged.
7. Caps: cap a test tier at 3 → 4th turn returns caps payload, meter renders `capped`, input recovers next IST day.
8. Undo: money undo restores prior figure with confession trail; lead-create undo deletes; no undo shown where no reverse door exists.
9. Regression: pre/post facade Anthropic turn — same prompt, same tools, cache read registering.
10. `node --check` all touched JS; engine `tsc` build clean; PWA `tsc --noEmit` clean.

## 6. FOUNDER SMOKE (phone, after P6)
Partial enquiry → watch filing chip appear mid-reply → open Leads, see Draft → tap missing field → try BOTH wishbone paths → undo a money write → burn the trial cap and watch the meter → flip a tier's provider in admin and send one more turn.

## 7. NATIVE-IMPLICATIONS CLAUSE
Everything ships as wire contracts (`meta`, `draft`, beats with `undo`) — Expo renders the same JSON. FilingChip/TierMeter are presentational and port 1:1. No browser-only APIs introduced. Voice input intentionally absent (Block 09, native-first design there).

## 8. SESSION BOUNDARIES
Six sittings, P1→P6 strictly. Each ends with: curl proofs in notes, MASTERPLAN status line, SCHEMA.md (P3/P5 only), drift log. P5 may run before P4 if provider keys arrive late — the only permitted reorder. Engine-schema `leads` drop request goes to the TDW_01 Phase C list, never executed here.


---

## ADDENDUM (2026-07-14, from TDW_01 Phase C ruling): the engine plane inherits the `scope_org_id` column verdicts. TDW_01 dropped `engine.orgs`/`org_members` + their SEVEN named FK constraints (on facts, leads, documents, money_entries, open_loops, compliance_deadlines, and org_members itself — corrected per the Step-25 output, 2026-07-14); the `scope_org_id` columns remain — all-NULL, unconstrained, harmless. This block rules keep-or-drop with full engine context (a P1-adjacent decision, recorded in SCHEMA either way; if dropped, a reserved migration number per LD-8).


---

## AMENDMENT ONE (2026-07-14, post-audit — the single §3.5 amendment cycle; supersedes conflicting spec text)
**Rulings (CE-1…7 + reopener + scope_org_id), binding:**
1. **CE-1:** Register `DONNA_LEAD_TOOL` in `DONNA_TOOLS` (D1). Plane intent CONFIRMED per LD-1: leads = typed `public.leads`; clients/binders stay on the records plane.
2. **CE-2:** Lead-create undo gets its witnessed door: NEW `DELETE /:leadId` as SOFT-delete via the existing column (D2) — added in P1 as the undo path's smallest honest addition.
3. **CE-3:** 0072 SLIMS to `leads.draft_meta` only. The invoice half moves to the records plane as `missing_cells` (D3) — invoices live there post-flip; no new typed column.
4. **CE-4:** APPROVED — door-side RECENT-ACTIVITY block injected into `runTurn` input assembly (mechanical context, zero soul change), reading `vendor_activity_log.action` (D4's true column name).
5. **CE-5:** APPROVED — P2 runs proof transcripts FIRST; weave only what fails (D5: the filing law is already substantially in Harvey's soul; no soul churn without evidence).
6. **CE-6:** ADOPT the existing flat cap keys `vendor_pwa_daily_<tier>` / `vendor_pwa_monthly_<tier>`, enforce BOTH windows. 0073 seeds any missing keys via migration INSERT (D7: PATCH cannot create keys; values are text — parse defensively).
7. **CE-7:** Product tier reaches the engine as a READ-THROUGH mapping resolved at turn start (door/facade), never a backfill of the hardcoded `agents.tier` (D15): essential→entry · signature→mid (trial-Signature included) · prestige→top. The 09 webhook tier flips thereby reflect on the next turn with no engine writes.
8. **REOPENER (five ghost engine tables — empty, zero constraints, drops recorded-as-done but never executed, D12/D13):** DROP NOW. Executor authors one guarded SQL block in the TDW01_DROPS pattern (existence + zero-row guards, one commented statement per table, named from the audit log); founder runs; DROPPED_2026-07.md + BASELINE.md corrected from recorded-intent to executed-fact with date — the honesty restoration is part of the deliverable.
9. **scope_org_id: DROP APPROVED** — reserved migration `0074_drop_scope_org_id.sql`, authored ONLY AFTER ruling-8's drops execute (so it names only real tables), guarded `alter table … drop column if exists` per column, SCHEMA.md records the verdict.

**Drift resolutions folded into the build (binding over original text):** D6 cabinet.ts inline shape canonical; comment fix rides P3 · D8 dual chat-door mounts: keep both, document in SCHEMA/API notes, touch neither · D9 `raw_message` absent from Donna's scope: the spec's fallback branch is the path · D10 the scope_org_id addendum's seven-column list is CORRECTED to the audit's true six live columns · D11 SCHEMA.md's leads (6) + invoices (4) column gaps fixed in P3's doc pass · D14 cap-key naming per CE-6.
**P1 execution notes confirmed:** `vendorIdFromAgent` via the verified reverse join · `executeDonnaLead` → `public.leads` with the word-map · read-before-write on vendor_id + phone/name · `draft_meta` behind a column-exists check or 0072-first (executor records which) · engine-`leads` stop-write · curl proofs as specified.
