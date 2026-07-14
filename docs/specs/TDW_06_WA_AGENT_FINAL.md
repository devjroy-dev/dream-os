# TDW_06_WA_AGENT_FINAL — The Souls: Closer, Concierge, One Victor, Donna's Lens, Advisor Mode
**Block:** 06 · **Repos:** dream-os (primary), dreamos-pwa (mode toggle, settings), docs (Manual)
**Depends on:** TDW_05 complete (prospect transport, sendWa, facade in WA engines) · TDW_02 (soul doctrine, facade, cost meter)
**Boundary inversion:** 05 owned pipes and could not touch a word; 06 owns words and may not touch transport.
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md + the soul law: author the self, the behaviour falls out. No forbidden-phrase lists, no if-then rules anywhere in any soul.

---

## 0. READ FIRST (verify before any edit)
| File | Verifying |
|---|---|
| `src/agent/systemPrompt.js` | The generic "PA" vendor WA persona being RETIRED (P4); the existing forwarded-message + send_to_couple + draft-and-forward machinery that survives |
| `src/agent/coupleSystemPrompt.js` | The intake script being replaced (P3); QUICK-enquiry profile variants; "never mention you are an AI" line being superseded by the honesty ruling |
| `src/agent/brideSystemPrompt.js` | The strong core + the forbidden-phrase blocks converted in P6 |
| `src/engine/src/core/{harveySoul,consultantHarveySoul,donnaSoul}.ts` | Voice references; Donna soul ≈7,843 chars ≈1,961 tokens (measured) |
| `src/engine/src/core/donna.ts` ~ln 265–290 | NO cache_control on her calls (confirmed 2026-07-14); DONNA_WORK_ITERS loop; resumable pendingToolUseId mechanics P5 must not disturb |
| `src/engine/src/core/{signup.ts,consultAccess.ts}` | agent_owner triple, consult_done routing — the onboarding P4 wires for TDW vendors |
| `src/api/vendor-engine/chat.js` + the 05 marketing service holding-line slot | Swap points |
| `src/lib/{llm.js,modelRouter.js,templates.js}` (02/05) | Facade, router (P5 extends with role), registry |
| `prospects` table + admin board (05) | Closer's ground-truth context fields |
| dreamai `hooks/useJustDoIt.ts` | Mode-toggle precedent (its localStorage pattern is NOT copied — native clause) |
| `docs/UNIT_ECONOMICS.md` | Where P5 cost proofs land |

## 1. LOCKED FOUNDER DECISIONS (this block — append to MASTERPLAN)
| # | Ruling |
|---|---|
| S-1 | One self across surfaces: Victor's WA voice = the same man, WhatsApp register; generic PA persona retired |
| S-2 | Concierge honesty: never volunteers being AI, never lies when asked — the admission authored graceful and brand-positive |
| S-3 | Concierge name configurable per vendor; fallback **Mira** |
| S-4 | Closer: reveal by the agent's own judgment under soul guidance — a self-deciding, human-sounding PA, conversational never interrogating, never a form; always reveals before the close, never as a gotcha; two-unanswered-nudges then gracious exit |
| S-5 | NO engineered escalation triggers for the Closer — existing model self-escalation mechanics only, the model decides |
| S-6 | Close path: demo-claim link primary; else direct PWA link (+ store links once approved); invite codes retired (W-8) |
| S-7 | **The TDW Manual**: a canonical what-it-is / what-it-can-do document the Closer reads — the single source of product truth |
| S-8 | Tier × role model matrix: **entry = Victor deepseek + Donna deepseek · mid = Victor haiku + Donna deepseek · top = Victor haiku + Donna haiku**; harvest stays glm. All flips bench-gated and config-reversible |
| S-9 | Donna gains an **accountant-cum-PA lens**; cache breakpoints wired regardless of provider (annotations stripped on non-anthropic by the facade; they pay on every Haiku path incl. fallbacks) |
| S-10 | **Advisor Victor mode**: a switchable mode where Victor acts solely as SMM + domain expert for the vendor's category; filing paused |
| S-11 | Forwarded-message discernment: material arriving without instruction is the master handing him a document — he files and reads it, never asks "what would you like me to do with this?" |
| S-12 | Bride soul: affirmative rewrite of the negative armor; core character preserved |

## 2. MIGRATION RESERVATIONS (ladder after 05 = next 0080; LD-8)
| # | File | Adds |
|---|---|---|
| 0080 | `0080_souls.sql` | `vendors.assistant_name text` (concierge name, null → 'Mira') · `agents.mode text not null default 'business' check (mode in ('business','advisor'))` (server-persisted Advisor toggle — no localStorage) |

---

## PHASE TABLE (one phase per sitting)

### P1 — The TDW Manual (S-7) — authored FIRST; everything sells from it
**File:** `docs/TDW_MANUAL.md` (~3,500–4,500 words), founder-reviewed before P2 begins. Sections, in order:
1. What The Dream Wedding is (the Wedding OS, the founding story in one paragraph, "Not just happily married. Getting married happily.")
2. What Victor does for a vendor — narrated as a day in the life, not a feature list (enquiry lands → filed before the vendor finishes reading it → quote with the calendar in hand → milestone reminders → the ledger always current)
3. The surfaces: WhatsApp PA, the app (Hub, CRUDs, calendar, bands), Discover (what approval gets you), Collab Hub, crew pages
4. Tiers + honest pricing (Essential ₹499 / Signature ₹1,999 / Prestige ₹3,999, current trial terms verified at authoring time) — stated plainly, no asterisks
5. The demo mechanic (their account may already exist with their own IG work in it — the claim flow)
6. The couple side in brief (why leads arrive warmer here)
7. Objections, answered honestly: "I have a manager" (Victor doesn't replace her — he makes her superhuman) · "another app" (WhatsApp-first; the app is optional depth) · price · data safety · "what if I leave"
8. What TDW does NOT do (no fake reviews, no pay-for-ranking beyond clearly-marked Featured, no lock-in) — the honesty section is a selling section
**Load path:** Closer's static context (cache-stable position, after soul, before dynamic prospect context). The Manual is versioned; edits re-reviewed by founder.

### P2 — The Closer (marketing line soul; swaps 05's holding line)
**File:** `src/agent/souls/closerSoul.js` (new `souls/` directory begins here; each soul exports one template + a version const stamped into the message ledger meta).
**Authoring instructions (the self, ≤7,000 chars):** a marketing mind in a PA's voice — someone who has sat inside a wedding vendor's day and can name its pains from the inside (the enquiry answered at midnight, the advance never chased, the date double-held). Conversational rhythm: 2–4 short beats, questions only when he genuinely wants the answer, never two in a row. He sells by *doing* — answers the prospect's real questions from the Manual, references their own work (`ig_handle`, `category`, `city` from the prospect row) with specific respect, never flattery. The reveal is his to time (S-4): woven as confidence, not confession — and always before he closes. The close: their demo when `demo_vendor_ref` exists ("your portfolio's already live — look"), else the direct PWA link. Rejection met with grace; two unanswered nudges and he leaves the door open like a gentleman. STOP is sacred (transport enforces; the soul never tests it).
**Wiring:** replaces the holding line in `marketingIndex.js` turn handler; model via `resolveModel('wa_marketing', —, 'victor')` seeded haiku (S-5: no special escalation wiring); prospect context block (row fields + state + demo link) appended dynamic.
**Bench (R6, begins here):** `src/agent/bench/` — golden scenarios as replayable scripts: cold-reply curiosity · price objection · "I have a manager" · hostile · the reveal probe ("are you a bot?") · buying signals → close · two-nudge silence. Founder reads transcripts; approval gates deploy.

### P3 — The Concierge (couple-facing soul on the vendor line)
**File:** `src/agent/souls/conciergeSoul.js`, replacing `coupleSystemPrompt.js` content (file may stay as the assembly shell).
**Authoring instructions (≤6,000 chars + per-category enquiry hints preserved from the current profile variants):** front-of-house at a great atelier, speaking FOR this vendor — she makes {vendor} sound like the obvious choice by being specific (portfolio truths, travel policy, real availability posture), never superlative. She attends rather than processes: the couple's excitement is the subject, the intake is invisible — Donna-side harvest (05's write-first plumbing) files what the conversation surfaces; she asks for at most the one thing that matters (the date) and only when it's natural. Honesty per S-2: asked directly, she answers with easy pride — "I'm {vendor}'s AI assistant — she sees every word the moment she's free" — and moves on. Identity: `vendors.assistant_name ?? 'Mira'` (S-3); settings surface gains the name field (PWA settings PATCH allowlist + one input, Jost label "Your assistant's name").
**Vendor-side output:** the hot-lead brief replaces raw relay — one message to the vendor: who, functions, date, budget signal, temperature read, and a suggested reply he can forward or hand to Victor. (Brief format authored in the soul's craft section; the send rides existing send infra.) Wire point noted for 09's notification inbox.
**Bench scenarios:** gushing couple with no details · budget-first couple · "are you a real person?" · date he's already holding (the brief must carry the clash — reads from the 04 lookup) · comparison shopper.

### P4 — One Victor on WhatsApp + discernment + the owner consult (S-1, S-11)
1. **The port:** vendor WA system prompt rebuilt from the Victor souls in WhatsApp register — same man, shorter breath. The surviving machinery (send_to_couple voice rules, draft-and-forward, lead-name heuristics) is re-woven into his prose, not appended as rules. The generic-PA text retires to `docs/archive/`.
2. **Forwarded-message discernment (S-11):** soul craft, not detection code — material that reads as written TO the vendor (a couple's enquiry, a screenshot, a price list) arriving bare is the master dropping a document on his desk: he files it (write-first law), replies with what he did and one sharp read ("Filed — Jaipur, December, budget unclear. She sounds ready; want me to draft the reply?"). Instructions addressed to HIM read as instructions. Ambiguity resolved toward filing, never toward asking what to do.
3. **The owner consult:** verify `signup.ts` + `consultAccess.ts` fire for TDW vendor provisioning (the auth_user_id bridge from repo HEAD). Fresh owner (`consult_done=false`) → Victor's first WA/PWA conversation runs the consult in character — who he works for, the trade, pricing posture, working style — landing in agent_owner + durable facts; `consult_done=true` thereafter. If the bridge leaves gaps for TDW-provisioned vendors, wire the smallest honest fix and record it.
**Bench:** bare forwarded enquiry · forwarded price list · instruction vs material ambiguity · first-run consult transcript (founder reads).

### P5 — Donna's lens, the cache, and the tier×role matrix (S-8, S-9)
1. **The lens:** `donnaLens.ts` (~1,200–1,500 tokens) appended to her soul — accountant-cum-PA craft: advance/milestone customs of the Indian wedding trade, GST-aware note-keeping, TDS awareness on payouts, expense categorization instincts, reconciliation discipline (numbers that don't add up get flagged in the memo, never silently absorbed), PA craft (what a good PA writes down unprompted, follow-up cadence). Authored affirmative, in her voice (the quiet pride of a perfect ledger).
2. **Cache breakpoints:** `cache_control` on Donna's static prefix (tools + soul + lens + handbook — verify block ordering puts all static content before the breakpoint). Soul+lens now clears Haiku's 2,048-token floor on its own; tools push the prefix to ~6K. Annotations survive provider stripping (facade handles) so every Haiku call — top tier and all fallbacks — pays 0.1× reads.
3. **Role routing:** `resolveModel(surface, tier, role)` — config keys `model.<surface>.<tier>.<role>`; seed the S-8 matrix (`pwa_vendor` + `wa_vendor` surfaces): entry `{victor:deepseek-v4-flash, donna:deepseek-v4-flash}` · mid `{victor:haiku, donna:deepseek-v4-flash}` · top `{victor:haiku, donna:haiku}`. Victor's existing haiku↔sonnet self-escalation mechanics untouched wherever he runs anthropic.
4. **Bench-gated flip:** Donna's golden scenarios (multi-atom filing on one binder · open-binder attachment · money edit with confession · resumable listen-back with pendingToolUseId · adversarial partial) run green on deepseek BEFORE any prod tier flips; fallback net live (02); downgrade rate on the admin board; flip = config row, reversal = 60 seconds.
5. **Cost proof + the Opus audit brief:** before/after per-turn INR from the cost meter for one scripted 3-dispatch turn on each matrix cell, hand-reconciled, recorded in UNIT_ECONOMICS.md. `docs/AUDIT_BRIEF_DONNA_COST.md`: findings (no cache_control pre-06; soul 1,961 tok vs 2,048 floor; call-multiplication math), methodology, and repo pointers — written for an independent Opus session to verify cold, per founder order.

### P6 — Advisor mode + bride rewrite + full bench sweep (S-10, S-12)
1. **Advisor Victor:** `advisorLens.ts` — Victor as SMM + domain expert, category-calibrated: content cadence for the vendor's trade (what a photographer posts vs a decorator), reel/portfolio judgment, enquiry-to-DM craft, seasonal calendars (muhurat clusters as content moments), honest platform mechanics — authored as HIS expertise (the consultant who also ran brand for houses like this), per-profession hooks off `professions.ts`.
   **Mechanics:** `agents.mode` (0080). Chat door reads mode: `advisor` → advisor lens replaces the operational handbook in his prefix, **Donna dispatches disabled** (filing paused — the door does not offer dear_donna_talk), except a single lightweight `jot_advice` capture into his notes so good counsel isn't lost. PWA: a two-word mode chip in the chat header (`Business · Advisor`, Jost, ink) → PATCHes mode server-side; mode word works on WA ("advisor mode" / "business mode", intercepted pre-engine like the nudge words). Mode state stamps message meta for the ledger.
2. **Bride rewrite (S-12):** the forbidden-phrase armor and numbered prohibitions re-authored as the self — she already IS "the best friend with perfect memory and a hint of wit"; write the woman for whom therapy-voice is simply beneath her wit, who teases instead of soothes, whose care shows as memory. Core scenarios re-benched to prove zero voice regression.
3. Full bench sweep across all five souls; version stamps verified in ledger meta; founder transcript review closes the block.

---

## 3. GUARDRAILS
The soul law is absolute — any rules-list or forbidden-phrase block added anywhere is a failed session · transport untouched (05's boundary inverted) · Donna's resumable-session mechanics (pendingToolUseId pairing) byte-identical through P5 — the cache breakpoint may not reorder her message array · Advisor mode may not silently drop business facts: anything operational the vendor says in advisor mode gets one in-character redirect ("that one's for the ledger — flip me to business mode and it's filed") · Concierge never quotes prices the vendor hasn't published · Closer sends nothing outside an open session (transport enforces; soul respects) · benches gate every soul deploy · no localStorage (mode is server-persisted) · design system on the two PWA touches.

## 4. ACCEPTANCE CRITERIA
1. Manual founder-approved; Closer answers three product questions with Manual-true facts (spot-checked against the doc).
2. Closer bench green + founder-read: reveal lands before close in 5/5 buying-signal runs; two-nudge exit observed; hostile run stays graceful.
3. Concierge: honesty probe answered per S-2 without breaking warmth; hot-lead brief arrives with temperature read + suggested reply; date-clash brief carries the clash.
4. Custom assistant name renders in conversation; null falls back to Mira.
5. Forwarded bare enquiry → filed same turn + one-line read; instruction ambiguity resolves to filing (bench).
6. Fresh TDW vendor's first conversation runs the consult; agent_owner populated; `consult_done` flips; second conversation shows he knows who he works for.
7. Donna on deepseek passes all golden scenarios; matrix flips per tier verified in activity log; fallback + downgrade logging observed under a forced fidelity error.
8. Cache proof: `cache_read_input_tokens` present on Haiku Donna calls; per-turn INR before/after recorded; audit brief committed.
9. Advisor mode: filing verifiably paused (no Donna dispatches in ledger), advice register evident, operational fact gets the redirect, mode word works on WA, chip persists server-side.
10. Bride bench: pre/post transcripts show the wit intact and the armor gone.
11. `node --check` + engine tsc + PWA tsc clean; 0080 proven; MASTERPLAN gains S-1…S-12.

## 5. FOUNDER SMOKE (phone)
Text the marketing line as a fresh prospect → push him on price, ask if he's a bot, buy → receive your demo link. As a couple: gush at the concierge, ask if she's real, give a date the vendor holds → read the brief that lands vendor-side. As the vendor: forward a bare enquiry → watch it file with a read; flip to Advisor, ask what to post this muhurat season, try to log an expense, get the redirect; flip back and log it.

## 6. NATIVE-IMPLICATIONS CLAUSE
All souls are backend. The two PWA touches (mode chip, assistant-name setting) are presentational over server state — RN 1:1. Nothing here constrains the port.

## 7. SESSION BOUNDARIES
Six sittings P1→P6; P1 blocks P2 (the Manual precedes the man who sells from it); P5.4's prod flips may trail the block awaiting bench green — flips are config, not code. Handover per protocol; UNIT_ECONOMICS + TEMPLATES statuses updated; the Opus audit brief handed to the founder for the independent pass.
