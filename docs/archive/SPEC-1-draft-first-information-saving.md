# SPEC-1 — Draft-First Information Saving + Out-of-Band Harvest
**Product:** TDW Vendor PWA (thedreamwedding.in `/vendor`)
**Repos touched:** `devjroy-dev/dream-os` (engine + tools + migration), `devjroy-dev/dreamos-pwa` (API types only — UI lands in SPEC-2)
**Depends on:** SPEC-1.5 (llm facade) for the harvest extractor model
**Feeds:** SPEC-2 (completion cards), SPEC-3 (CRUD parity)
**Author:** Chief Engineer session, 2026-07-14

---

## 1. Problem

Harvey (pwaEngine) is write-last. Create tools fire only when the model believes it holds enough fields, and the Quick Action primers open with interrogation. A vendor who abandons mid-capture has given Harvey facts and the database has received nothing. Symptom reported by founder: "asking for too many details and not logging until he does it."

## 2. Doctrine

**Write-first, enrich-later.** First mention of an entity creates the row immediately as a draft. Conversation and a background harvest pass fill the rest. Filing becomes orthogonal to conversation (callmeZ out-of-band harvest law, applied to TDW).

## 3. Locked founder decisions

| # | Decision |
|---|---|
| D1 | Drafts appear in list slices **immediately**, marked with a Draft chip. |
| D2 | Harvest is **forward-only** from ship date. No retroactive thread mining. All present users are test users. |
| D3 | **PWA surface only.** WhatsApp vendor engine (`engine.js`/`tools.js`) untouched. Couple-facing WhatsApp agent = separate spec (item 6, front-soul + Donna relay). |

## 4. Non-goals

- No completion-card UI (SPEC-2 renders; this spec defines the contract it consumes).
- No changes to `engine.js`, `tools.js`, `brideEngine.js`, `circleEngine.js`.
- No retroactive data migration of existing records into draft states.
- No change to the clarify-card system — it remains for genuine ambiguity (which record?), never for field collection.

## 5. Schema — migration `0072_draft_meta.sql`

Add one nullable column to five tables. `NULL` = complete record (all existing rows are therefore complete — zero backfill).

```sql
-- 0072_draft_meta.sql — SPEC-1 draft-first writes
alter table leads    add column draft_meta jsonb;
alter table clients  add column draft_meta jsonb;
alter table events   add column draft_meta jsonb;
alter table invoices add column draft_meta jsonb;
alter table expenses add column draft_meta jsonb;

comment on column leads.draft_meta is
'NULL = complete. Non-null = {"missing": ["field",...], "source": "pwa_chat", "created_turn_message_id": "<uuid|null>", "harvested": ["field",...]}';

create index leads_draft_idx    on leads    (vendor_id) where draft_meta is not null;
create index clients_draft_idx  on clients  (vendor_id) where draft_meta is not null;
create index events_draft_idx   on events   (vendor_id) where draft_meta is not null;
create index invoices_draft_idx on invoices (vendor_id) where draft_meta is not null;
create index expenses_draft_idx on expenses (vendor_id) where draft_meta is not null;
```

`draft_meta` shape (code-enforced, not DB-enforced):
```json
{
  "missing":  ["amount", "event_date"],
  "source":   "pwa_chat",
  "created_turn_message_id": "uuid-or-null",
  "harvested": ["city"]
}
```

Numbering note: 0072 is the next free reservation after 0071. Per governance law, if another spec claims 0072 first, this spec takes the next hole — never renumber.

## 6. Field contracts — true minimums

Per entity: **create minimum** (tool `required`), **expected set** (absence ⇒ listed in `missing`), and everything else optional-silent (never chased).

| Entity | Create minimum | Expected set (drives `missing`) |
|---|---|---|
| lead | `raw_message` (unchanged) | name, phone, event_date, city, budget |
| client | `client_name` (unchanged) | phone |
| event | `title` (drop `event_date`, `kind` from required) | event_date, kind |
| invoice | `client_name` OR `client_id`, `total_amount` | due_date |
| expense | `amount` | category, note |

Rationale for keeping `total_amount` required on invoice: an invoice is legally an amount owed; a draft invoice without an amount is a note, and Harvey should file it as one. Everything else drops to enrichment.

## 7. Engine changes — `src/agent/pwaTools.js` + `src/agent/pwaEngine.js`

### 7.1 Tool schema changes (`pwaTools.js`)
- Relax `required` arrays to the create minimums in §6.
- Add to each create tool description: "Call this on FIRST mention with whatever fields you have. Missing fields are filled later — never delay the call to collect more."

### 7.2 Write path (`pwaEngine.js` tool executors)
On each `create_*` execution:
1. Insert row with provided fields.
2. Compute `missing = expectedSet − providedFields` (empty values count as missing).
3. If `missing` non-empty → set `draft_meta` per §5 shape; else `draft_meta = NULL`.
4. Tool result returned to the model includes `{ id, is_draft, missing }` so Harvey's confirmation sentence is honest ("Logged as draft — I still need the amount").

On each `update_*` execution touching a draft:
1. Apply update.
2. Recompute `missing` against expected set.
3. `missing` empty → `draft_meta = NULL` (promotion). Else update `draft_meta.missing`.

### 7.3 Prompt changes (`pwaSystemPrompt.js`)
- **Delete** interrogation posture. New rule block (static prompt, cache-stable):
  - "WRITE FIRST. On first mention of a lead, client, event, invoice, or expense, call the create tool immediately with whatever you have. Never ask for a field before the record exists."
  - "After a draft write, you may ask for AT MOST ONE missing field, chosen by business urgency (invoice → amount context; event → date). If the vendor ignores it, drop it — the card handles the rest."
  - "Never re-ask a field listed in RECENT ACTIVITY as harvested."
- **Quick Action primers (`app/vendor/page.tsx` `QUICK_ACTIONS`)** rewritten from interrogative to invitational, e.g. `+ Invoice` → "Tell me about the invoice — even just the client's name is enough to start."

### 7.4 Response contract extension (chat API → PWA)
`/api/v2/vendor-engine/chat` response gains:
```ts
cards?: Array<{
  record_type: 'lead'|'client'|'event'|'invoice'|'expense',
  record_id: string,
  is_draft: boolean,
  captured: Record<string, string|number|null>,
  missing: string[]
}>
```
Emitted for every record created or promoted this turn. SPEC-2 renders these; until then the PWA ignores the field (additive, non-breaking).

## 8. Out-of-band harvest pass

**File:** `src/agent/harvest.js` (new).

**Trigger:** fire-and-forget after the engine turn's reply is sent (never blocks latency). PWA chat only (D3).

**Scope per run:** the vendor's latest message + this turn's tool results + the vendor's open drafts (cap 10, most recent first).

**Model:** via SPEC-1.5 facade, `surface='harvest'` — cheapest configured provider (default `glm-4.7-flash`, flip in admin_config).

**Prompt contract:** strict JSON out. Input lists each draft as `{table, id, missing[]}` plus the raw message. Output:
```json
{ "patches": [ { "table": "invoices", "id": "…", "field": "due_date", "value": "2026-11-20" } ] }
```

**Application rules (hard, code-enforced — never trust the model):**
1. `field` MUST be in that record's current `missing` array — else drop patch.
2. Target column MUST currently be NULL — never overwrite.
3. `table`+`id` MUST belong to this vendor — else drop and log.
4. Value passes the same validators as the equivalent update tool (dates via IST-anchored resolver, amounts numeric).
5. Applied patches: remove field from `missing`, append to `harvested`; promotion check per §7.2.
6. Every applied patch logged to `vendor_activity_log` as `kind='harvest_patch'` — this is what feeds "RECENT ACTIVITY" so Harvey never re-asks.
7. Malformed JSON from cheap provider → one silent retry on Haiku (SPEC-1.5 fallback), then give up silently. Harvest is best-effort by design.

**Forward-only (D2):** harvest reads only the current turn. No backfill job exists.

## 9. Read path

- `list_*` tools and all `/api/v2/vendor/*` list endpoints include `draft_meta` in rows (additive).
- List slice endpoints must NOT filter drafts out (D1). Sorting unchanged.
- Snapshot/ledger counts on the Hub include drafts (a draft invoice is still pipeline).

## 10. File map

| File | Change |
|---|---|
| `db/migrations/0072_draft_meta.sql` | new |
| `src/agent/pwaTools.js` | required arrays + descriptions |
| `src/agent/pwaEngine.js` | draft write/promote logic, cards in response, harvest trigger |
| `src/agent/pwaSystemPrompt.js` | write-first rules, one-question cap |
| `src/agent/harvest.js` | new — extractor + patch applier |
| `src/lib/draftContracts.js` | new — expected sets per entity (single source, shared by engine + harvest) |
| `dreamos-pwa: lib/vendor/types/vendor.ts` | `draft_meta` on entity types, `cards` on chat response |
| `dreamos-pwa: app/vendor/page.tsx` | QUICK_ACTIONS copy only |
| `docs/SCHEMA.md` | 0072 entry |

## 11. Acceptance criteria

1. "invoice for Priya" (nothing else) → invoice row exists after ONE turn, `draft_meta.missing = ["due_date"]` if amount given, or Harvey asks amount once max.
2. "got an enquiry from someone for a Jaipur wedding in December, budget 2L" → lead created same turn; harvest fills city/budget/date if Harvey's tool call missed any; zero re-asking next turn.
3. Abandonment test: vendor sends one message, closes app → record exists as draft, visible in slice with Draft chip data present in API.
4. Harvest can never overwrite a non-null field (unit test with adversarial patch list).
5. Cross-vendor patch attempt dropped + logged (unit test).
6. Turn latency unchanged (harvest is post-reply async — measure P50 before/after).
7. Existing complete-record flows unaffected: full-detail message still produces `draft_meta = NULL` in one turn.

## 12. Verification protocol (mandatory, per governance)

- Backend: apply patch to a copy of the engine files → `node --check` each changed file, must pass.
- Frontend: apply to cloned `dreamos-pwa` → `npx --no-install tsc --noEmit` filtered to changed files, zero errors.
- Migration: run 0072 against a shadow schema, then the §11 tests against a test vendor (Swati Roy UUID `2eb5d3fb-…`) before prod SQL editor apply.
- SCHEMA.md updated in the same commit as the migration file.

## 13. Executor session boundaries

One session. Order: 0072 → `draftContracts.js` → `pwaTools.js` → `pwaEngine.js` write path → `harvest.js` → prompt → PWA types. No UI work beyond QUICK_ACTIONS copy. If SPEC-1.5 facade is not yet merged, harvest.js calls Anthropic Haiku directly behind a `// FACADE-SWAP` marker and SPEC-1.5 replaces it.
