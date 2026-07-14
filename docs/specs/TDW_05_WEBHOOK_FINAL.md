# TDW_05_WEBHOOK_FINAL — The Pipes: Reliability, Templates, Crons, and the Prospect Lane
**Block:** 05 · **Repos:** dream-os (primary), dreamos-pwa (admin surfaces) · **Depends on:** TDW_02 (llm facade), TDW_04 (eventWrite), TDW_04.5 (crew wire point)
**Hard boundary (founder-confirmed):** this block touches engine code ONLY mechanically — client/facade swaps, tool plumbing, contract arrays. ZERO prompt, soul, or voice changes. TDW_06 owns every word, including the Closer's soul.
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| File | Verifying |
|---|---|
| `src/index.js` (~999 ln) + `src/brideIndex.js` (1181 ln) | Both `/webhook/whatsapp` + `/webhook/twilio-status` handlers; signature validation present? dedupe present? media handling; the status-race window (message insert vs callback arrival) |
| `src/lib/whatsapp.js` | Send functions, FROM-number resolution, template support today |
| `src/agent/engine.js` | `runAgenticTurn` + `runCoupleAgenticTurn` — Anthropic client construction (P5 swap points), event tool executors (eventWrite adoption points) |
| `src/agent/tools.js`, `src/agent/brideTools.js` | `required` arrays for write-first mirroring (P5) |
| `src/lib/draftContracts.js` (02 output) | The expected-sets source both WA engines adopt |
| `src/lib/llm.js` + `modelRouter.js` (02) | Facade + `wa_vendor`/`wa_bride` surface rows (02 seeded none — P5 seeds anthropic rows) |
| `src/lib/vendor/eventWrite.js` (04) | The one calendar writer — WA event tools become callers |
| `src/api/vendor/schedules.js` | Milestone shapes for payment reminders (P4) |
| `crew_confirmations` (0076) | The 04.5 auto-send wire point |
| `conversations` table in SCHEMA.md | `kind` values/CHECK — P3 adds `prospect_marketing` (verify mechanism: enum vs check vs free text) |
| dreamos-pwa `app/admin/conversations/*` | Where delivery chips + prospect views land |
| docs: `ROADMAP_FINAL.md` "Never phone-tested" table | The receipt/Vision certification list (P6) |

## 1. LOCKED FOUNDER DECISIONS (this block — also append to MASTERPLAN)
| # | Ruling |
|---|---|
| W-1 | 05 (pipes) and 06 (souls) stay separate; boundary as stated above |
| W-2 | Number map is intentional architecture: `+1 4787788550` bride line (NRI-market hook — a US number reads "built for me" to NRI brides), `917982159047` vendor/enquiry line, **marketing = a NEW dedicated number** (env `MARKETING_WHATSAPP_NUMBER`, founder provisions; never a production line; `9888294440` NOT used for marketing). WABA consolidation permanently parked |
| W-3 | Morning nudge 8am IST, per-user opt-out by reply word |
| W-4 | Payment reminders vendor-facing only (T-3, T-0) |
| W-5 | Credit-low alert → WhatsApp to founder + persistent admin banner + graceful user line |
| W-6 | Prospect intake: n8n/sheet-fed via admin API AND manual admin add |
| W-7 | Closer reveal: agent judgment under soul guidance (06); the north star recorded here for 06's contract — a self-deciding, human-sounding PA: conversational, never interrogating, never a form |
| W-8 | Close path: demo-claim link primary; **invite links/codes are RETIRED** — otherwise a direct PWA link (app-store/play-store links once approved). Executor note: any invite-gated flow encountered is legacy — do not extend it; log sightings for blocks 07/10 |
| W-9 | New-prospect template cap: **25/day**, admin-adjustable |

## 2. MIGRATION RESERVATIONS (ladder after 04.5 = next 0078; LD-8)
| # | File | Adds |
|---|---|---|
| 0078 | `0078_prospect_lane.sql` | `prospects (id uuid pk, phone text not null unique, name text, ig_handle text, category text, city text, source text check (source in ('sheet','manual','other')), state text not null default 'cold' check (state in ('cold','templated','replied','in_session','converted','opted_out','expired')), demo_vendor_ref uuid null, notes text, last_template_at timestamptz, session_opened_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now())` · `failed_turns (id uuid pk, service text, phone text, payload jsonb not null, error text, state text default 'dead' check (state in ('dead','replayed','discarded')), created_at timestamptz default now())` · conversations gains kind `prospect_marketing` (mechanism per verification) |
| 0079 | `0079_nudge_optout.sql` | `users.nudge_optout boolean not null default false` |

---

## PHASE TABLE (one phase per sitting)

### P1 — webhookCore + the race fix + dead letters
**New:** `src/lib/webhookCore.js` — extracted VERBATIM-then-refactor from the two services (two commits, like 03 P1):
- Twilio signature validation (if absent today: add, `TWILIO_AUTH_TOKEN` HMAC per Twilio docs; env kill-switch `TWILIO_VALIDATE=0` for local)
- Inbound idempotency: `MessageSid` dedupe (in-process LRU + a `messages` sid-unique check — verify messages stores sid; it must for status callbacks — reuse)
- Media normalization (count, content types, URLs) into one shape both engines already expect
- Structured logging (`[wa:vendor]` / `[wa:bride]` / `[wa:marketing]` prefixes)
Both services import it; behavior byte-identical (diff transcripts pre/post on the test numbers).
**Status-callback race:** callback for a sid with no message row → buffer row (in-DB upsert into a 2-column `status_buffer`? NO new table — retry in-process: 3 attempts × 2s, then log `callback_unmatched` and drop; verify current "callback ignored" path and replace). Handles the Session-5.5 race with zero schema.
**Dead letters:** any inbound turn that throws → full payload into `failed_turns` + graceful outbound line ("Something hiccuped — say that again in a minute."). Admin: `GET/POST /api/v2/admin/failed-turns` list + `replay` (re-invokes the turn handler with the stored payload) + `discard`.

### P2 — Template registry + the submission batch (founder order: file day one)
**New:** `src/lib/templates.js` — single registry:
```js
{ key, twilioTemplateSid /*env-mapped*/, body, variables:[...], line:'bride'|'vendor'|'marketing', status:'draft'|'submitted'|'approved' }
```
Keys this block: `marketing_opener`, `morning_nudge_vendor`, `morning_nudge_bride`, `crew_assignment`, `payment_reminder`, `demo_invite`.
**Send helper:** `sendWa({line, to, text?, templateKey?, vars?})` — resolves FROM by line; if a 24h session is open (last inbound within 24h per conversation) send free-form; else REQUIRE an approved template or refuse with a typed error (never a silent drop). All sends ledgered as today.
**Sitting-one deliverable (before any code beyond the registry):** `docs/TEMPLATES.md` — the six template bodies authored for Twilio submission (compliant variable syntax, opt-out line on marketing), founder submits same day; tracker table with submission dates. Bodies drafted to the design voice; the marketing opener stays factual + warm (the Closer's soul does the selling in-session, not the template).

### P3 — The prospect lane (transport + state, souls in 06)
**Service:** `src/marketingIndex.js` — third small Railway service on `MARKETING_WHATSAPP_NUMBER`, built on webhookCore. Inbound from unknown/known prospect numbers → `prospects` state machine: reply to a templated prospect → `replied` → conversation `kind='prospect_marketing'` opened → `in_session`, `session_opened_at` stamped.
**Until 06 lands:** turns answer with a single holding line (registry key `holding_line`, free-form in-session): "Good to hear from you — give me a moment and I'll come back to you properly." State machine fully live; the soul slots in later with zero transport change. (No AI calls in this block — W-1 boundary.)
**Opt-out armor:** STOP/UNSUBSCRIBE/any Twilio stop-word → `opted_out`, confirmation line, hard block on all future sends to that phone across ALL lines (check in sendWa), logged.
**Send governance:** daily new-template job (cron, 10am IST): pick `cold` prospects oldest-first up to `admin_config: marketing.daily_template_cap` (seed **25**), send `marketing_opener`, state → `templated`, `last_template_at` stamped. Window expiry job: `in_session` + 24h past last inbound → `expired` (re-engagement only via a future template, human-triggered from admin).
**Admin surface (dreamos-pwa `app/admin/prospects/page.tsx`):** intake (manual add form + `POST /api/v2/admin/prospects/bulk` for the n8n sheet flow — matches the existing Vendor Pipeline's fields: phone, IG, name, category, city), state board with counts, per-prospect conversation view (read), cap editor, manual `send opener now` and `mark converted` actions. Cockpit dark, existing admin grammar.
**Conversion hook (Block 08 handshake):** `prospects.demo_vendor_ref` links a pre-built demo; `converted` state set when their phone appears as a claimed vendor (job: nightly match) — the wire 08 will ride.

### P4 — Crons + reminders + crew sends
- **`list_dues`** built at last: bookings/schedules with balance due within N days (shape per schedules.js verification) — exposed as an engine tool (mechanical registration, description factual) AND used by the nudge.
- **Morning nudge, 8am IST** (node-cron in each service, IST-anchored): vendor line — today's functions (via the 04 `day` reads) + dues ≤14d; bride line — days-to-wedding + today's items. Sends via `sendWa` (template if window closed). Opt-out: reply "STOP MORNINGS" (and natural variants list) → `users.nudge_optout=true`, confirmed; the word list lives in webhookCore pre-engine so it never costs a model call.
- **Payment reminders (W-4):** daily job — milestones due T-3 and T-0 → vendor nudge `payment_reminder` template/session ("₹80K milestone from Priya due Thursday — reply PAID when it lands"); "PAID" reply pre-engine intercept → marks milestone via the existing door, confirms.
- **Crew auto-send (04.5 wire point):** on crew_confirmations insert → `crew_assignment` template to the member's phone with crew-page link. Idempotent per (event, member).

### P5 — Mechanical engine migration + the credit alert
- Facade adoption: `engine.js` + `brideEngine.js` construct calls via `callLLM` + `resolveModel('wa_vendor'|'wa_bride', tier)`; 0073-style admin_config rows seeded anthropic/haiku (flip capability exists, defaults unchanged). Anthropic-path regression proof as in 02.
- eventWrite adoption: vendor WA event tools (`create_event`, `update_event`, `block_date`, `unblock_date`) become eventWrite callers — conflict payloads returned to the engine as tool results (the SOUL says nothing new about them in this block; Victor's WA voice work is 06).
- Write-first mirroring: `tools.js` + `brideTools.js` required arrays relaxed to draftContracts minimums; executors set `draft_meta` per 02 P3. Descriptions updated factually; prompts untouched.
- **Credit-low alert (W-5):** facade throws typed `LLMCreditError` (Anthropic billing/credit error classes — enumerate from SDK) → (a) WhatsApp to `FOUNDER_ALERT_PHONE` via vendor line, throttled 1/hour; (b) `admin_config: system.credit_alert` flag → persistent admin banner (layout-level, all admin pages) until cleared; (c) user gets the graceful line. Same handler for provider-down errors, labeled distinctly.

### P6 — Certification + observability + sweep
- **Receipt/Vision certification:** the ROADMAP "never phone-tested" trio run live with the founder (real receipt photo → classify → file → "show my receipts" playback). Each pass/fail recorded; failures get a scoped fix or a declared gap — never silent.
- **Delivery chips:** admin conversation views render status-callback state per outbound (sent/delivered/read/failed with errCode tooltip).
- Full acceptance sweep; `docs/TEMPLATES.md` statuses updated with Twilio verdicts.

---

## 3. GUARDRAILS
W-1 boundary is absolute — a prompt/soul diff anywhere is a failed session · sendWa is the ONLY outbound path after P2 (grep stray `client.messages.create` — migrate or justify in handover) · opt-out block is cross-line and pre-engine · no send without approved template outside a live session window · marketing service never touches production-line FROM numbers · dead-letter replay is admin-only · design system on admin surfaces · engines' behavior on anthropic path byte-identical post-facade.

## 4. ACCEPTANCE CRITERIA
1. Signature-invalid POST rejected on all three services; duplicate MessageSid processed once.
2. Status callback racing the insert: forced test (delay insert) → status lands within retries; none lost in a 50-message soak.
3. A thrown turn lands in failed_turns; admin replay completes it; user got the graceful line.
4. Six templates authored in TEMPLATES.md and submitted (founder confirms Twilio console) sitting one.
5. Prospect lifecycle end-to-end on the test number: sheet bulk-load → capped opener send (cap honored at 25, adjustable) → reply flips to in_session + holding line → STOP hard-blocks across all lines → 24h expiry job flips state.
6. Nudges fire 8:00 IST both lines; opt-out word silences and confirms; dues list matches hand query.
7. T-3/T-0 reminders fire once each; "PAID" reply marks the milestone.
8. Crew assignment send fires once per (event,member) with a working page link.
9. WA vendor event tool hits eventWrite (conflict payload visible in tool result log); write-first: partial lead via WA creates a draft row.
10. Credit error simulation → founder WhatsApp + admin banner + graceful line; throttle holds.
11. Receipt pipeline certified or gaps declared with findings.
12. `node --check` clean; migrations proven; MASTERPLAN gains W-1…W-9.

## 5. FOUNDER SMOKE (phone)
Text the marketing number from a fresh SIM after admin-adding yourself → opener arrives → reply, get the holding line → STOP, confirm silence → morning: receive both nudges → forward a receipt photo on the vendor line → watch a payment reminder and reply PAID → pull the Anthropic key on staging and watch your phone light up.

## 6. NATIVE-IMPLICATIONS CLAUSE
Pure backend + admin web. Crew/demo/prospect links all resolve to web surfaces by design. Nothing here constrains the Expo port.

## 7. SESSION BOUNDARIES
Six sittings P1→P6. P2's template authoring + submission happens in sitting one regardless of code progress (approval latency). P3 may not precede P2 (needs the registry). Handover per protocol; 06 receives: the prospect transport contract, the holding-line swap point, and W-7's north star verbatim.
