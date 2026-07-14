# TDW_04.5_PLANNER_FINAL — The Production House: Crew, Wedding Bands, and a Planner-Grade Collab Hub
**Block:** 04.5 · **Repos:** dream-os + dreamos-pwa · **Depends on:** TDW_04 (eventWrite, occupancy.js pluggable context, ConflictPayload, day sheet), TDW_03 (binder cards/story), TDW_02 (soul doctrine, doors)
**Serves:** all vendors — planner-optimized ("serve the planner, serve their vendors too")
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| File | Verifying |
|---|---|
| `src/lib/vendor/eventWrite.js` + `occupancy.js` (04 outputs) | The pluggable capacity-resolver context (04 §8 guardrail) — P1 extends it, never forks it |
| `src/api/vendor/studio/{team,tasks,payments}.js` | team_members fields (`name role phone daily_rate_inr notes active`), PATCH allowlists, payment shapes |
| `src/api/vendor/collab.js` (464 ln) | Feed query, respond (`interested/passed`), connect flow, anonymity mechanics, `open/accepted` states |
| `docs/SCHEMA.md` §team_members/§team_tasks/§team_payments/§collab_posts + migration 0048 | Exact columns; collab requirement_type CHECK list (16 categories) |
| `app/vendor/studio/team/page.tsx`, `team-payments/page.tsx`, `app/vendor/collab/*` | Current surfaces being extended |
| `app/vendor/calendar/page.tsx` post-04 | Grid/toggle mount point for the band view |
| `src/engine/src/core/donna.ts` snapshot builder post-04 | Where the staffing-gap line joins the date-pressure line |
| `middleware.ts` (dreamos-pwa) | Route matcher — P3's public crew route must not be swallowed by subdomain rewrites |

## 1. LOCKED FOUNDER DECISIONS (this block)
| # | Ruling |
|---|---|
| P-1 | Crew: NO logins. v1 = interactive token web page (assignments + confirm/decline + tasks). WhatsApp template send of the link lands in Block 05; until then the link shares via FE-built wa.me from the Team page |
| P-2 | Calendar toggle `Month · Weddings`; planner categories default to Weddings; available to all vendors |
| P-3 | Multi-item collab posts; roster for ALL vendors; roster first-look window (default 12h, admin-configurable) |
| P-4 | Roster entries (incl. phone-only externals) are assignable to functions exactly like crew |
| P-5 | Collab→binder money stub IN scope |

## 2. MIGRATION RESERVATIONS (ladder after 04 = next 0076; LD-8)
| # | File | Adds |
|---|---|---|
| 0076 | `0076_crew_assignment.sql` | `events.assigned_member_ids uuid[] default '{}'` + GIN index · `team_members.page_token uuid not null default gen_random_uuid()` + unique index · `team_members.roster_vendor_id uuid` nullable (soft ref → vendor_roster.id, FK added in 0077 or soft — executor: FK only if 0077 applied same sitting, else soft + comment) · `crew_confirmations (id uuid pk, event_id uuid fk events on delete cascade, member_id uuid fk team_members on delete cascade, status text check (status in ('pending','confirmed','declined')) default 'pending', note text, updated_at timestamptz default now(), unique(event_id, member_id))` |
| 0077 | `0077_collab_planner.sql` | `collab_post_items (id uuid pk, post_id uuid fk collab_posts on delete cascade, requirement_type text /*same CHECK list as posts*/, note text, filled_by_response_id uuid null)` · `vendor_roster (id uuid pk, owner_vendor_id uuid fk vendors on delete cascade, member_vendor_id uuid null fk vendors on delete set null, name text not null, phone text, category text, source text check (source in ('collab_accepted','manual')), created_at timestamptz default now(), unique(owner_vendor_id, member_vendor_id) /*where member_vendor_id not null — partial unique*/)` · `collab_posts.first_look_until timestamptz` nullable |

---

## PHASE TABLE (one phase per sitting)

### P1 — Crew assignment engine (completes 04 §8)
1. Apply 0076. `eventWrite` accepts `assigned_member_ids?: string[]` (validated: every id ∈ this vendor's active team_members).
2. `occupancy.js`: capacity-resolver context gains `members`. New check (runs for ALL vendors, any occupying booking): for each assigned member, scan their other occupying assignments in the same date+slot → `ConflictPayload` variant `{kind:'member_clash', member:{id,name}, holding:[…], message:"Rahul is already on the Sharma sangeet that evening."}`. Planner's OWN capacity stays off (04 C4).
3. **Staffing gap** (planner categories only): occupying bookings within 21 days with empty `assigned_member_ids` → one snapshot line (joins 04's date-pressure line): "2 functions in the next 3 weeks have no one on them (Kapoor mehendi — 9 days)."
4. Victor assigns conversationally: the door resolves "put Rahul on the Kapoor mehendi" — member matched by case-insensitive name within the vendor's team; ambiguity → Victor asks once with the candidates (clarify grammar); write via eventWrite. Assignment/unassignment lands in the event note trail ("Rahul assigned — 14 Jul").
5. On every assignment write: upsert `crew_confirmations (event_id, member_id, 'pending')`.
6. CRUD: 04 day sheet booking rows + P2 band pips gain an assign affordance → member picker sheet (active members, roles, daily rate whisper; multi-select). Same eventWrite call.
**Proof curls:** assign via Victor and via sheet → identical rows; member double-book via both doors → identical member_clash payload.

### P2 — The wedding-band view
**Backend:** `GET /api/v2/vendor/bands/:vendorId?from=YYYY-MM-DD&to=YYYY-MM-DD` — one round trip:
```ts
{ ok, bands: [{ binder_id, title,            // binder client, else "Untitled wedding"
    span: {start, end},                       // min/max linked event dates in range
    money?: {amount, received, pending},      // binder money story (cabinet fields)
    functions: [{ event_id, date, slot, kind, title,
      crew: [{member_id, name, initials, confirmation:'pending'|'confirmed'|'declined', external:boolean}],
      gap: boolean }] }],                     // gap = occupying && crew empty
  loose: [ …events with no linked_binder_id, same shape ] }
```
Grouping = `linked_binder_id`; binder title/money from the cabinet loader (read-only, per its cardinal law).
**Frontend:** calendar toggle `Month · Weddings` (Jost, top-right). Band lane per wedding: Cormorant title + money whisper left; horizontal span with function pips per slot position; crew = brass initial circles on the pip (hollow ring = pending confirmation, terracotta ring = declined); **gap pip = hollow with a hairline pulse**. Tap band → binder story (03); tap pip → day sheet (04); tap gap pip → assign picker + `Post to Collab` (P4 pre-fill). Default view = Weddings for planner categories (categoryProfiles), Month otherwise; choice remembered per session (in-memory, no storage APIs).

### P3 — The crew page (interactive, no login — P-1)
**Route:** `app/crew/[token]/page.tsx` — public; token = `team_members.page_token`. Verify `middleware.ts` matcher lets `/crew/*` pass on the main host.
**Backend:** `GET /api/v2/crew/:token` → member name, vendor display name, upcoming assignments (date, slot word, function title, wedding title (binder), event_time as call time, note, confirmation status) + open team_tasks assigned to them. `POST /api/v2/crew/:token/confirm {event_id, status:'confirmed'|'declined', note?}` → updates crew_confirmations. `POST /api/v2/crew/:token/task {task_id, done:true}` → completes task. Rate-limited; token is capability — NO vendor financials, NO other members' data, NO lead/client data beyond the function title.
**Page (design system, mobile-first):** cream field; vendor name as eyebrow; "Your dates" — day cards with slot word, wedding, call time; Confirm / Can't make it (note field on decline); tasks as check-rows. Declines flow back: crew_confirmations feeds P2 rings AND a snapshot whisper ("Rahul declined the Kapoor mehendi").
**Distribution now:** Team page row overflow → `Send page` → FE wa.me link with prefilled text ("Your assignments with <vendor>: <url>"). `Rotate link` action regenerates page_token (PATCH allowlist addition on team.js).
**Block 05 note:** templated WhatsApp auto-send on new assignment reserved for the webhook block — wire point named here: fire on crew_confirmations insert.

### P4 — Collab Hub, planner-grade (P-3, P-4)
1. Apply 0077. **Multi-item posts:** create accepts `items:[{requirement_type, note}]` (1–8); legacy single-type posts auto-wrap as one item (read path back-compat — feed serializes items always). Respond gains `item_id`; connect marks `filled_by_response_id`; post auto-closes when all items filled (state machinery verified against current `open/accepted` semantics — extend, don't replace).
2. **Roster:** auto-edge on every accepted connection (both directions — poster↔responder), `source:'collab_accepted'`; manual add (name, phone, category) from a new `Roster` tab on the collab page. Dedup by member_vendor_id or (owner, phone).
3. **First look:** post create sets `first_look_until = now() + interval` (admin_config key `collab.first_look_hours`, seed 12, additive row — no migration needed if config is KV). Feed query: before `first_look_until`, post visible only to vendors present in the poster's roster (by member_vendor_id); after, open feed. Anonymity unchanged — roster members still see the post anonymized until connection accepted (verify and preserve the existing mechanic).
4. **Assign-external (the elegant reuse):** assigning a roster vendor to a function creates-or-links a `team_members` row (`role:'external_vendor'`, `roster_vendor_id` set, phone copied) — externals thereby inherit EVERYTHING: assigned_member_ids, member_clash math (scoped to this vendor's calendar), crew_confirmations, the crew page, and team_payments. One assignment model, zero parallel machinery.
5. **Post-from-gap:** band gap pip → `Post to Collab` pre-filled (date, city from vendor profile, requirement_type from the function's kind/category mapping table written in this spec's appendix).

### P5 — The money loop (P-5)
On connect-accept (either side) OR from a filled item's sheet: optional **settlement stub** — choose `Expense` (money out now) or `Schedule` (milestones) against the wedding's binder-linked artifacts: creates `expenses` row or `payment_schedules` on a stub invoice? NO — verify: schedules hang off invoices; for procurement use `team_payments` when the counterparty is a team_members row (P4.4 makes externals exactly that) — amount prefilled from the response if quoted, `linked_event_id` set, note carries `collab:<post_id>`. Expense path for one-shot costs. **Per-wedding settlement view:** team-payments page gains a `By wedding` grouping — all crew + external payouts grouped by linked event's binder, subtotals, `daily_rate_inr × days` auto-suggest on new payment for assigned members.

### P6 — Victor the production manager + sweep
Soul weave (≤600 chars, planner categories via the category-conditioned soul path from 04 P4; affirmative, in-voice): he runs weddings the way a line producer runs a shoot — he sees the unstaffed function before the planner does, knows the roster like a rolodex, and says the one thing that moves it: *"Kapoor mehendi is nine days out with no florist — your roster has two in Jaipur; shall I post it?"* One nudge, never a checklist. Wire: the snapshot lines from P1.3 + declines from P3 are his ground truth — no new model calls.
Proof transcripts (founder reads): staffing gap 9 days out · crew decline arriving · member double-book on assignment.
Polish: skeletons on bands, empty states ("No weddings on the board. Link a booking to a client's binder and it becomes a band."), acceptance sweep.

---

## 3. GUARDRAILS
eventWrite remains the ONLY calendar writer (assignments included) · occupancy extension goes through the 04 pluggable context — forking it is a failed session · cabinet stays read-only · collab anonymity-until-accept preserved through first-look · crew token page: capability-scoped, no financials/leads/other-members, rate-limited, rotatable · one gold per screen (band view: the muhurat diamond stays the only gold; crew circles are brass-line, not gold fill) · no localStorage/sessionStorage (band-view default = in-memory) · WhatsApp engines untouched (P3 send = Block 05) · souls per TDW_02 constraints.

## 4. ACCEPTANCE CRITERIA
1. Member double-booked via Victor and via picker → identical `member_clash` payload; assignment trail lands in the event note.
2. Band view groups by binder with money whisper; gap pips pulse; loose events render; planner defaults to Weddings, photographer to Month.
3. Crew page: token loads assignments; confirm/decline round-trips to rings on the band and a snapshot whisper; rotated token kills the old link; page leaks nothing beyond spec.
4. Multi-item post: 3 items, 2 filled → post open; 3rd filled → auto-closed; legacy posts render as single-item.
5. First look: roster vendor sees the post at T+0; non-roster sees nothing until T+12h; anonymity holds throughout.
6. Assigning a roster external creates the team_members bridge row once (idempotent) and the crew page works for them.
7. Money: accepted collab → settlement stub lands in team_payments with `collab:<post_id>` note; `By wedding` grouping subtotals reconcile by hand.
8. Founder-approved P6 transcripts.
9. `node --check`, engine `tsc`, PWA `tsc --noEmit` clean; migrations proven via information_schema.

## 5. FOUNDER SMOKE (phone)
Toggle to Weddings → tap a gap pip → post to Collab pre-filled → accept a response from the test vendor → watch roster edge + settlement stub appear → assign the external to the pip → open their crew page from the wa.me link, decline with a note → watch the terracotta ring and Victor's whisper → rotate the token.

## 6. NATIVE-IMPLICATIONS CLAUSE
Bands/pickers are presentational over the `bands` endpoint — RN layout work only. **The crew page intentionally stays web forever** — its whole design is "no install, no login"; the native app links out to it. No gestures beyond tap.

## Appendix A — function kind → collab requirement_type map (P4.5)
shoot→photography · ceremony→planning · fitting/trial→makeup or attire (ask, two-chip choice) · recce→venue · social→music_dj · other/blocked→(no pre-fill). Extend inline as categories demand; map lives in one exported const.

## 7. SESSION BOUNDARIES
Six sittings P1→P6 strictly. P4 may not start before P1 (assign-external rides the bridge row). Handover per protocol each sitting; MASTERPLAN + SCHEMA updated; the Block-05 wire point (auto-send on assignment) recorded in the 05 discussion notes.
