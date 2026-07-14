# TDW_15_ROOMS_FINAL — Parity, Envelopes, the Morning Masthead, and Her Own Concierge
**Block:** 15 · **Repos:** dream-os + dreamos-pwa · **Depends on:** TDW_13 (extracted blooms + PARITY MATRIX — this block's contract), TDW_14 (assignee param, visibility resolver), TDW_09 (notify(), tokens), BRIDE_AUDIT.md (ground truth)
**Founder's charge:** "Parity needs to be done. It was a big drawback of the app not to have it."
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| Source | Verifying |
|---|---|
| `docs/BRIDE_PARITY_MATRIX.md` (13 P6) | THE CONTRACT — every gap row this block closes or the founder explicitly waives |
| `docs/FROST_BLOOMS.md` (13 P3) | Bloom file map + data doors |
| BRIDE_AUDIT §1 | Couple routers incl. bookings /payment, receipts, pages, taste /surprise, today; the ⚠ items (expenses table identity, enquire→lead) resolved BEFORE their phases |
| `src/api/couple/meridian.js` (204 ln) | The concierge's stated identity (header comment), haiku-always law, SSE shape, kind='meridian_self' |
| `src/api/couple/taste.js` /surprise + `src/api/admin/surprisePool.js` | Current pool-by-tags mechanics the web layer joins |
| `src/agent/brideTools.js` + brideEngine executors | Tool schemas gaining envelope params; the 14 assignee param precedent |
| `src/lib/notify.js` + `notifications`/`push_subscriptions` (0083, execution state CHECKED) | The couple extension path: amend-if-unexecuted, else migrate |
| `src/lib/llm.js` + models cost meter (02) | Bride-surface facade + INR logging (audit item 10) |
| Frost image helper (07) + AppSplash | Reveal ceremony ingredients |

## 1. LOCKED FOUNDER DECISIONS
| # | Ruling |
|---|---|
| R-1 | **The Parity Law:** every WhatsApp DreamAi capability has a matching in-room affordance; the matrix is the contract; unclosed rows require founder waiver by name |
| R-2 | Meridian's identity confirmed from code (personal concierge — skin, mind, body, decisions; separate from DreamAi) — polish pass only, in-doctrine, advisor-never-therapist boundary preserved; haiku-always law preserved |
| R-3 | Surprise Me = curated pool FIRST + **Haiku web-image-search layer** (real images as attributed discovery cards with source links; fires when pool is thin or for freshness). Gemini generative PARKED |
| R-4 | Budget = **category envelopes** (named amounts, per-envelope fill lines); hidden from circle members by default via the 14 resolver |
| R-5 | Bride inbox lands here (notify() extended to couples) so 16's signal has a bell to ring |
| R-6 | Room enrichments: Dream = morning masthead · bookings = live milestone mirror of the vendor's schedule · receipts feed the envelopes |

## 2. PROPOSED — AWAITING FOUNDER RULING
(none)

## 3. MIGRATION RESERVATIONS (ladder after 0087 = next 0088; LD-8)
| # | File | Adds |
|---|---|---|
| 0088 | `0088_envelopes.sql` | `budget_envelopes (id uuid pk, couple_id uuid fk on delete cascade, name text not null, amount_inr numeric not null default 0, sort int not null default 0, created_at timestamptz default now())` · envelope refs: `couple_receipts.envelope_id uuid null` + the bride-expense table's `envelope_id uuid null` (exact table per the audit's ⚠ check, resolved in P2 sitting one) |
| 0089 | `0089_bride_inbox.sql` | IF 0083 already executed: `notifications.couple_id uuid null` + CHECK exactly-one-of(vendor_id, couple_id) + index; same on `push_subscriptions`. IF 0083 unexecuted: dated amendment inside 0083 instead (LD-8-clean; recorded either way) |

---

## PHASE TABLE (one phase per sitting)

### P1 — Parity closure, the money rooms (R-1, R-6)
1. Resolve the audit ⚠: bride-expense table identity (one grep, recorded).
2. **Bookings bloom:** record-payment affordance (the `/payment` door exists — sheet with amount + note, optimistic, honest failure); **the milestone mirror** — the vendor's payment_schedules for her linked bookings rendered as her timeline (read path: booking → vendor invoice/schedule linkage; verify the join exists, wire the smallest read endpoint if not, recorded) — when he marks paid, her row settles same-minute (poll-on-focus; push arrives via P5). WA+Call buttons (0060) polished.
3. **Events/tasks:** full write affordances per matrix rows (create/edit/state/delete; task create carries the 14 assignee picker); reminders surfaced.
4. **Receipts:** add (camera/upload through the existing Vision classify path), delete, and envelope-tag (P2 dependency — ships behind the envelope flag if P2 trails).
Each closed matrix row ticked in the document itself (living contract).

### P2 — Envelopes (R-4)
1. Apply 0088. Envelope CRUD in the budget/expenses bloom: named envelopes with amounts, per-envelope **fill hairlines** (spent/amount, ink until 90%, terracotta past), unfiled tray for receipts/expenses awaiting a home, drag-to-file.
2. **Tools (parity both directions):** brideTools gains `set_envelope` (create/update amount) and envelope param on expense/receipt filing tools; executors + schemas mechanical; the soul learns the vocabulary in ONE woven line (06 law — she speaks envelopes as naturally as she speaks dates; no rules blocks).
3. The 14 visibility resolver verified to cover envelope payloads (budget=false strips them; payload-level proof).
4. The Dream masthead's budget pulse (P3) reads the envelope aggregate.

### P3 — The morning masthead + the quiet rooms (R-6)
1. **Dream bloom rebuilt as the masthead:** days-to-go in Cormorant 44 (the number she wakes to), today's items (today.js), the budget pulse (envelope aggregate, her eyes only), and `briefing.js` finally consumed visibly — its output as the morning line under the masthead (verify its current consumer per audit; extend, never duplicate).
2. **Pages:** mood + photo attach polish (verify pages' media support; smallest addition if absent) — intimate, ungamified.
3. **Moments:** grid polish on the 07 image discipline; nothing clever.

### P4 — Surprise Me v2 (R-3) + Meridian polish (R-2)
1. **Surprise:** `/surprise` keeps pool-by-tags as the floor; when the pool yields <N fresh unseen items, a Haiku turn (facade, surface `bride_surprise`) composes web-image-search queries from her aesthetic_tags + functions + season → results rendered as **attributed discovery cards** (image, "found on {domain}", tap-through link) — attribution is LAW, never a bare hotlink presented as ours. Seen-tracking so reveals never repeat. **The reveal ceremony:** one card at a time, Ken-Burns entrance, "another" affordance — a stylist's unveiling, not a grid dump.
2. **Meridian:** prompt polished in-doctrine (affirmative craft; the concierge who tends to HER — skin, mind, body, decisions — advisor-never-therapist boundary explicit in the self, not as rules); haiku-always preserved verbatim; facade adoption + cost logging; room UI: the stream rendered with the chat canon, day dividers, her theme's warmth. Bench: a stressed-bride scenario (stays advisor, warm, practical), a planning question (gracefully points to DreamAi — the two souls know their lanes), a skincare-timeline ask.

### P5 — The bride inbox (R-5)
0089 per its conditional. `notify()` gains the couple audience; wired events: **enquiry replied** (vendor/concierge reply lands) · **payment marked** by the vendor (the P1 mirror's push) · **booking confirmed** · **circle heartbeat** (pin approved, task done, poll closed — dedup-batched, never noisy) · the **proposals tray slot reserved for 16's signal**. Bell in the frost chrome (canon, both themes), inbox sheet day-grouped, per-kind prefs in settings bloom, web push capability-detected exactly as 09 (one quiet inline offer). Deep links per kind into the owning bloom.

### P6 — Mechanicals + the matrix sign-off
Bride-surface facade verification (brideEngine per 05 P5's scope — confirm done or close it; meridian + surprise per P4) + per-turn INR logging on all bride surfaces (audit item 10; UNIT_ECONOMICS gains the bride line). **The matrix sign-off:** every row closed or founder-waived by name in the document — the block does not close otherwise. Full sweep, both themes, recordings archived.

---

## 4. GUARDRAILS
The matrix is the contract — silent row-skipping is a failed session · Meridian's identity and haiku-always law are sacred; DreamAi and Meridian never merge · attribution on every web-sourced image, payload-verifiable · envelopes never serialize to members without the flag (payload-level, the 08 standard) · notify() remains the single notification writer · souls per the 06 law (one woven line for envelopes; Meridian affirmative) · tokens only, both themes on every proof · no localStorage · vendor surfaces + WA engines untouched except the named brideTools schema additions · pool-first: the web layer never fires when the pool satisfies (cost discipline, logged).

## 5. ACCEPTANCE CRITERIA
1. Matrix: 100% rows closed or named-waived; the document shows the ticks.
2. She records a payment in the bookings bloom AND the vendor marks a milestone paid — both directions reflect within a minute; her push arrives.
3. Envelopes: create three, file a receipt by drag, watch the hairline; member with budget=false receives zero envelope bytes (raw payload audit); DreamAi files "50k caterer advance, venue envelope" correctly on WhatsApp (parity both directions).
4. Dream masthead: days-to-go correct across IST midnight; briefing line renders from briefing.js output.
5. Surprise: pool-first proven (web layer silent while pool fresh); thin-pool run yields attributed cards with working source links; no repeat reveals; ceremony recorded.
6. Meridian bench: three founder-read transcripts pass; the planning question hands off to DreamAi in-voice; model string remains haiku (grep + ledger proof).
7. Inbox: each wired event rings once, deep-links true, circle heartbeat batches; prefs silence a kind; the proposals slot exists dormant for 16.
8. Bride INR logging visible in the ledger for chat, meridian, surprise; UNIT_ECONOMICS updated.
9. `node --check` + tsc clean; 0088/0089 (or amendment) proven; MASTERPLAN gains R-1…R-6.

## 6. FOUNDER SMOKE (phone, bride account)
Wake to the masthead — the number, today, the pulse → file yesterday's receipt into Attire by drag → tell DreamAi on WhatsApp "paid the decorator 30k, decor envelope" and watch the hairline move → open Surprise, meet three reveals, tap a source through → ask Meridian about pre-wedding skin in month three, then ask her a venue question and watch her hand you to DreamAi → have your test vendor mark a milestone paid; feel the push land → check what your circle member can't see.

## 7. NATIVE-IMPLICATIONS CLAUSE
Every affordance is a door on existing/named routes — TDW_12 renders the same contracts. The reveal ceremony and masthead are presentational (Reanimated twins). The inbox rides the platform-aware notify() from 09/11. Nothing here blocks the bride app; most of it IS the bride app's feature set.

## 8. SESSION BOUNDARIES
Six sittings P1→P6 (P2 before P1's envelope-tag ships un-flagged; P5 independent after P1). Handover per protocol; the ticked matrix + inbox contracts hand to TDW_16, which opens on the signal pipeline with all five founder rulings already locked.
