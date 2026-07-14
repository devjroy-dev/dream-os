# TDW_14_CIRCLE_FINAL — The Circle Lives: Surgery, the Member Key, Polls, and Delegated Love
**Block:** 14 · **Repos:** dream-os + dreamos-pwa · **Depends on:** TDW_13 (blooms extracted, tokens, FROST_BLOOMS.md), BRIDE_AUDIT.md (the ground truth — read it whole), TDW_05 (sendWa, template registry), TDW_06 (soul doctrine)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| Source | Verifying |
|---|---|
| `docs/BRIDE_AUDIT.md` §2, §6 | The full circle-router map, the six-link invite chain, the break-candidate list, the messages-auth gap |
| `src/api/couple/circle.js` (309 ln) | invite RPC (`invite_circle_member`, cap-3, roles), phone save, the wa.me + join-URL builder (break candidate #1) |
| `src/api/circle/{join,session,feed,threads,messages,muse,dreamai,verifyPin}.js` | The eight routers; messages.js's missing member scoping; muse.js's existing member `/save` |
| The `invite_circle_member` RPC in Supabase (source via SCHEMA/migration or founder dump) | The cap-3 constant + token semantics (break candidate #2) |
| `app/circle/join/[token]/page.tsx` + `app/coplanner/*` (TabBar, CircleSessionContext, 4 tabs) | The join flow + member surface being polished |
| `circle_members`, `circle_activity`, `circle_sessions`, `couple_tasks`, `muse_saves` in SCHEMA | Columns the migrations extend |
| `src/agent/{circleEngine,circleSystemPrompt}.js` | The member AI receiving the doctrine pass |
| `middleware.ts` | Coplanner host/scope rewrites (break candidate #4: session scope) |
| `lib/templates.js` + TEMPLATES.md | Registry the `circle_activity` template joins |

## 1. LOCKED FOUNDER DECISIONS
| # | Ruling |
|---|---|
| C-1 | Invite surgery first: instrument all six links, fix the liar, prove with a real second phone |
| C-2 | Circle capacity TIER-GATED: Basic 3 · Gold 5 · Platinum unlimited |
| C-3 | Budget HIDDEN from members by default; per-member reveal is an explicit bride action; visibility matrix per member (budget / vendors / moments) |
| C-4 | Decision polls in threads — in this block |
| C-5 | Task delegation (bride assigns journey items to members) — in this block |
| C-6 | `circle_activity` WhatsApp template authored + submitted sitting one |
| C-7 | circleSystemPrompt receives the 06-style affirmative doctrine pass here |
| C-8 | Coplanner = first-class installable surface: own manifest scope + icon ("{Bride}'s Wedding Circle"), bride splash collection, both bride themes |
| C-9 | (Audit-mandated, non-negotiable) messages route gains per-member auth |

## 2. PROPOSED — AWAITING FOUNDER RULING
(none — the bride-signal/lead-broadcast pipeline is designed in the TDW_16 discussion, not here)

## 3. MIGRATION RESERVATIONS (ladder after 0086 = next 0087; LD-8)
| # | File | Adds |
|---|---|---|
| 0087 | `0087_circle_expansion.sql` | RPC `invite_circle_member` REPLACED (CREATE OR REPLACE) — cap resolved from the couple's tier (basic 3 / gold 5 / platinum NULL=unlimited) instead of the constant; token semantics unchanged · `circle_members.visibility jsonb not null default '{"budget":false,"vendors":true,"moments":true}'` · `couple_tasks.assigned_member_id uuid null` (soft ref circle_members) + partial index · `circle_polls (id uuid pk, couple_id uuid fk, thread_id uuid null, question text not null, options jsonb not null /*2–4 of {id,label,image_url?}*/, linked_event_id uuid null, closes_at timestamptz null, created_by text not null /*'bride'|member_id*/, created_at timestamptz default now())` · `circle_poll_votes (poll_id uuid fk on delete cascade, member_ref text not null /*'bride'|member_id*/, option_id text not null, created_at timestamptz default now(), primary key (poll_id, member_ref))` · `muse_saves.contributed_by_member_id uuid null` + `muse_saves.circle_status text check (circle_status in ('pending','approved','declined'))` null (null = bride's own, untouched semantics for all existing rows) |

---

## PHASE TABLE (one phase per sitting)

### P1 — The surgery (C-1) + the hardening (C-9) + the template (C-6)
1. **Instrument the six links** with temporary structured logs: (i) invite RPC row+token → (ii) wa.me/join-URL construction (assert absolute URL, correct host, token present) → (iii) join/validate (token lookup result) → (iv) send-otp (purpose `circle_join` fires) → (v) set-pin/accept (member activated) → (vi) session establishment (cookie/scope reaching /coplanner through middleware). Run the chain from a real second phone; the first link whose output contradicts its input is the defect. Fix THAT link (smallest honest change), re-run clean, remove instruments, record the culprit verbatim in the handover + FINDINGS_LOG.
2. **Messages auth (C-9):** every /frost/circle/messages + /threads route validates the caller's memberUserId (or bride session) against an ACTIVE circle_members row for that couple — same pattern muse.js already uses (read it, mirror it). A cross-circle read attempt returns 403 and is the acceptance test.
3. **Template:** `circle_activity` authored (invite reminder · "you were assigned {task}" · "poll closing: {question}" — one template, variable slot for the line) + submitted to Twilio; TEMPLATES.md updated. Sends ride sendWa; STOP armor applies to members too (verify prospects-side block covers member phones or extend the block table check).

### P2 — The member key (C-8)
Coplanner as an installable surface: `manifest.circle.json` scoped to /coplanner (name "{Bride first name}'s Wedding Circle" — templated at serve time; icon from the brand set), the 03 AppSplash mounted with the bride collection, both `frost`/`dark` sets live (member inherits the bride's chosen theme via the feed payload — the circle wears her wedding's colors), TabBar polish to canon (tokens, safe-areas, skeletons, 48px), and the join flow restyled as a welcome ("{Bride} invited you to her wedding circle") rather than a form. Join-success ends on "Add to your home screen" taught inline, never modal-begged.

### P3 — Capacity + sovereignty (C-2, C-3)
1. Apply 0087's RPC replacement; circle.js error mapping gains the tier-aware message ("Your circle is full on Basic — Gold opens two more chairs") — the upgrade whisper, one line, never a wall.
2. **Visibility matrix:** bride's circle bloom gains per-member switches (budget OFF by default, vendors, moments); every member-facing read path (feed, dreamai context, muse, threads content assembly) filters through one shared `memberVisibility(memberId)` resolver — a SINGLE choke point; a second filter implementation anywhere is a failed session. Budget-bearing fields never serialize to a member without the flag (payload-level, view-source-proof — the 08 blur standard).
3. Mute/remove polish (routes exist — PATCH/DELETE member): confirm flows + activity entries; removed member's session dies (session check reads active row — verify, fix if stale sessions survive).
4. **Activity feed surfaced:** circle_activity rendered in the bride's circle bloom ("Maa pinned 3 lehengas · Riya voted") and the member feed — the heartbeat both sides see.

### P4 — Muse contribution (the emotional core)
Member pin (photo via existing circle/muse upload path, URL, note) → `contributed_by_member_id` + `circle_status='pending'` → the bride's Muse gains a **"From your circle"** tray (pending items, contributor chip) → approve (joins the board wearing "Maa found this") or decline (quiet, no notification — declining family finds is a private act). Member sees own pins' status honestly (pending/on the board). Activity entries on pin + approve. Bride's own saves keep `circle_status` NULL — zero change to existing behavior (acceptance-tested).

### P5 — Polls + delegation (C-4, C-5)
1. **Polls:** create from a thread or standalone (bride or member), 2–4 options with optional images (muse saves pickable as options — the lehenga case), one vote per participant (bride included), live tallies, optional `closes_at` (template nudge at T-2h via C-6), optional `linked_event_id` so the decision lands on the journey item. UI: option cards full-bleed when imaged, tally hairlines, the winner crowned quietly at close. Backend: two tables per 0087, routes on the threads router with member auth (C-9 pattern).
2. **Delegation:** bride assigns a couple_task to a member (people/reminders bloom affordance + `assigned_member_id`); member's coplanner gains a **"Yours"** tray (assigned tasks, check-off via existing complete path extended with member attribution); completion → activity entry + bride notification; the template's task line covers the assignment nudge. brideTools: `create_task`/`update_task` gain the optional assignee param (tool schema + executor — mechanical; the soul learns nothing new this block).

### P6 — The member's own mind (C-7) + sweep
1. **circleSystemPrompt doctrine pass:** the member's AI re-authored affirmative per the 06 law — she is the circle's gracious insider: knows the wedding as the member is permitted to see it (the P3 resolver feeds her context — the visibility matrix binds the AI too, acceptance-tested with a budget probe), helps the member help ("your task list, the polls open, what Maa pinned"), never gossips across members, never reveals what the bride hasn't opened. Bench scenarios: budget probe · task check-off through chat · "what should I get them" (registry-adjacent warmth) · a member fishing about another member.
2. circleEngine mechanicals: facade adoption if 05 P5 hasn't reached it (verify; extend, don't fork) + cost logging.
3. Full sweep: the chain from invite to a member voting in a poll on her installed home-screen app, both themes, recordings archived.

---

## 4. GUARDRAILS
The P1 fix is the smallest honest change — no chain rewrite · one visibility resolver (P3) binding UI, feed, AND the member AI alike · budget absence is payload-level truth, never CSS · existing bride muse semantics untouched (NULL circle_status rows behave identically) · member surfaces get NO write into bride-private blooms · sendWa only; STOP sacred for members · souls per the 06 law (no rules lists) · tokens only; both themes on every member screen · no localStorage · WhatsApp bride/vendor engines untouched (circleEngine only, as scoped).

## 5. ACCEPTANCE CRITERIA
1. A real second phone: invite → WA link → join → OTP → PIN → coplanner, clean; the culprit link documented in FINDINGS_LOG.
2. Cross-circle message read → 403; muse-pattern auth verified on threads + messages + polls.
3. Tier caps: Basic 4th invite refused with the whisper; Gold seats 5; Platinum seats 8 without complaint; RPC replacement proven via information_schema/`pg_get_functiondef`.
4. Budget probe: member feed payload contains zero budget fields with the flag off (raw JSON audit); flag on → visible; the member AI refuses the budget probe in-character with the flag off.
5. Muse: member pin → bride tray → approve → board with credit chip; decline is silent; bride's own saves regression-clean.
6. Poll with two muse-image options: both phones vote, tally live, close-nudge template fires at T-2h, winner lands on the linked event's record.
7. Delegated task appears in the member's "Yours," check-off notifies the bride, activity feed shows the whole heartbeat.
8. Coplanner installs to a home screen with the bride's name + icon; cold-open shows the bride splash collection; member sees the bride's theme.
9. Founder-read bench transcripts for the member AI pass all four scenarios.
10. `node --check` + tsc clean; 0087 proven; template submitted sitting one; MASTERPLAN gains C-1…C-9.

## 6. FOUNDER SMOKE (two phones)
Invite your second phone from the bride account → join, install to home screen, watch the splash → as bride: hide budget from that member, assign "book mehendi trial," pin approval on their lehenga find → as member: check the task off, vote in the lehenga poll, ask the AI what the budget is and hear her decline with grace → watch the activity feed narrate all of it → remove the member and confirm their session dies.

## 7. NATIVE-IMPLICATIONS CLAUSE
Coplanner remains constitutionally web-installable (the member never downloads an app — the frictionless key, same doctrine as demo/crew). The bride-side circle bloom ports with TDW_12 as extracted. The visibility resolver and poll/delegation routes are pure API — native bride consumes them unchanged.

## 8. SESSION BOUNDARIES
Six sittings P1→P6 strictly (P1 gates everything; nothing member-facing ships on a broken chain). Handover per protocol; FINDINGS_LOG gains the culprit; MASTERPLAN updated. TDW_15 consumes the parity matrix + this block's task-assignee tool change; TDW_16 opens with the bride-signal pipeline design (founder's directive, questions already posed).
