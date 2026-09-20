# repo: dream-os @ 72db66931b7338b83a2f2a6a47d29a3fc833a25a · dreamos-pwa @ c82753a1eb32527ec5622d9aef28275679d83764
# TDW · CE-44 · SEAT LCV-1 · LC-VICTOR · THE READ-FIRST · 2026-09-18

Docs only. Both tips re-derived at origin at the moment of cutting; ladder tail 0168. Accepted by
the chair as the read-first of LC-Victor ("RECEIVED WHOLE AND ACCEPTED", CE-44, re-issued). The
founder's rulings that decide its open forks are recorded as pending where they are pending.

**This cut is DOCS-ONLY under C-44.1**, ruled on the founder's word, verbatim, 2026-09-18:
*"docs only skis the floor. not needed. LC victor before LC 4, whats the redirect line option?"*
A delivery is docs-only when every path it writes is under `docs/` or is its own
`scripts/floor-manifest-*.txt`. It verifies on the guard, the verbatim unzip and the dirt check
against its manifest. No bench, no floor.

**Revised at `72db669` after P1 (CE-44, 2026-09-19)**, docs-only, on the slot the chair granted.
Items 2 and 15 carry R-44.14 and R-44.15, which supersede option (b). Item 9 records attach as
built. Item 12 gains what P1 left open. §16 records P1: its table, committed byte for byte at
`docs/handovers/TDW_CE44_LCV_P1_EAR_TABLE.md`, is the evidence of record.

Every file:line below was read by command in this seat's session. Lines cited into files that
4a-h1 moved are re-derived at `a3bddb9`; chat.js, vendorInbound.js, loop.ts and donna.ts are
unchanged since `c424e39` and their citations hold at both tips.

The tip then moved to `ddb5a74`, LC-2t's card 4a close note. `git diff --name-status a3bddb9
ddb5a74` shows two added paths and nothing else: `docs/handovers/TDW_CE44_LC2_CARD4A_CLOSE.md`
and `scripts/floor-manifest-ce44-lc2-card4a-close.txt`. Neither is a file this document pins or
cites, so every pin and citation below holds at `ddb5a74`.

## §0 · Pins, reading, errors

Moved by 4a-h1 and pinned by blob at `a3bddb9`: recordPrimitives.ts `d405a4a3700c` ·
lifecycleHands.js `d5c4dab1c018` · moneyFacts.js `4eaedf6d3d27` · witnessLine.js `7e3de049bef0` ·
P3 handover `064448a099e8` · CE-44 4a handover `d9ff58704ff3`.

Read whole: the CE-43 to CE-44 succession note; the Victor sitting handover; the P4A read-first;
roadmap §5 (LC-4) and §9; the veto record with its CE-44 appendix; the CE-44 4a handover.
Read for contradiction only: protocol §7, §11, §13; AUDIT-1; the P3 body.

Errors owned in this seat:
- **e-1.** Three rooms, not four: consult, advisor, business (loop.ts:389, :424 to :425, :454).
  "Working room" is the business room's prompt line (loop.ts:74); "jot room" is the guard's name
  for the advisor room (chat.js:2077 to :2078).
- **e-2.** A function-name grep (`executeAndPatch(`, `executeRecordTool(`) missed the door
  callers that call through aliases (`exec` at promotion.js:162 and schedules.js:124, `runTool`
  at binderWrite.js:124). C-44.4's class. The census in item 1 is by tool-name literal.
- **e-3.** Item 1's money row first said the model should hold neither money hand for package
  clients, with V13 refusing. V13 refuses `donna_money_edit` only; `donna_money` is deliberately
  kept as the vendor's one door for a sale outside the package (CE-44 4a handover §1 and §9,
  F-44.17). Corrected in the row.

Findings allocated from this seat: F-44.19, F-44.20, F-44.21, F-44.22 (resolved, item 7),
F-44.24, F-44.25, F-44.28. F-44.30 (LC-2t's allocation) is carried into items 1 and 14.
No new candidates in this document.

## Item 1 · The inventory

39 hands by definition (`name: 'donna_…'` fields in `src/engine/src/core`) at 40 sites:
`donna_note` is defined twice, and `donnaNote.ts:14` has zero importers (F-44.20). Donna holds
all 39 (`donna.ts:353`). Victor holds none: in the business room he holds `dear_donna_talk`, the
handbook read and escalate (`loop.ts:775` to `:779`).

Engine-executed acts write `engine.records`, except `donna_lead`, which writes `public.leads`
from the engine client (`donnaLead.ts:155` to `:159`). Signals return a display, write nothing,
and the door acts on the public plane. "Door callers" are sites outside the engine that execute
the hand, by literal census; reader-only sites (the name table at chat.js:709 to :726,
snapshot.js:51 to :53, undoContract.js) are excluded.

| Hands | Kind · plane | Door lines today (success / refusal / say which) | Door callers besides Donna | New founder success lines |
|---|---|---|---|---|
| `donna_client` `donna_date` `donna_note` `donna_note_append` `donna_phone` `donna_doc` `donna_stage` `donna_edit` `donna_hide` `donna_unarchive` (alias `donna_retrieve`) `donna_write_reasonforaction_append` | act · `engine.records` | Success: chip summaries only (`deriveFiling`, undoContract.js:24 onward; VERB table at its foot). Refusal: generic chip ("That didn't land", :29); V12 on client and stage. Say which: none. | binderWrite.js:92 to :155; invoices.js:165, :287 to :297, :335, :339; enquiryBinder.js:94 to :139; events.js:492; chat.js:883; calendarSignals.js:270; harvest.js:167 to :170 | 11 (P7) |
| `donna_money` `donna_money_edit` | act · `engine.records` money cells | Chip "Money filed" (undoContract.js:85 to :88), "Money corrected" (:79, F-44.30's sibling). V13 refuses `donna_money_edit` on a binder with a booked lead behind it; `donna_money` is not refused (F-44.17). | money_edit: binderWrite.js:124, invoices.js:299, :341, :376, promotion.js:162, schedules.js:124. money: binderWrite.js:103, invoices.js:297, promotion.js:151 | 2 (P5) |
| `donna_merge` `donna_split` `donna_repeatfollowup` | act · `engine.records` | Chip fallback only | none executing | 3 (P7) |
| `donna_booking` | signal · door runs `promoteLead` | `booking_confirmed`: no line (D1 vetoed, unbuilt, 4b). `advance_paid`: D3. Refusal: F29, V12. | lifecycleHands.js, both lanes | 0 (D1 exists) |
| `donna_milestone_paid` | signal · door runs `markMilestonePaid` | D3, D4; D5, D6 (say which), D7, D8; all vetoed | lifecycleHands.js | 0 |
| `donna_invoice_pdf` | signal · door mints | Two sentences: web chat.js:445, WhatsApp vendorInbound.js:1823 (F-43.34). Chip "Invoice minted: Invoice" on every call (F-44.30, undoContract.js:93 and :96) | chat.js:423, vendorInbound.js:1790 | 1, both lanes (P5) |
| `donna_book_event` `donna_block_date` `donna_unblock_date` `donna_edit_event` `donna_cancel_event` `donna_assign_crew` | signal · `public.events` via eventWrite | `bookingLines` chat.js:565 (raw ISO, F-43.33), `conflictLines` :611, `advisoryLines` :621, `mutationLines` :1001, `blockLines` and `unblockLines` blockHands.js:145, :154 | calendarSignals.js:70, :240 to :242; blockHands.js:101, :116; chat.js:468, :835 to :837 | 0 new; 1 amended to full month (P7) |
| `donna_lead` | act · `public.leads` insert and update | Chip "Lead filed: X" (undoContract.js:36 to :51) | none executing | 1 (P6) |
| `donna_relay_stage` `donna_relay_send` | signal · relay seat | CE-212's vetoed set (R1 ruled standing, R-44.9) | relaySeat.js:60 to :61 | 0 |
| `donna_introduction_stage` `donna_introduction_send` | signal · introductionSeat.js | `INTRO_*` in victorLines.js (hash-carried :187 to :191) | introductionSeat.js:33 to :34 | 0 |
| `donna_find` `donna_whatsdue` `donna_history` `donna_tally` `donna_shelf` `donna_brief_read` `donna_review_read` | lookup · read (`donna_find` reads `public.leads`, donnaFind.ts:400) | **None. Every lookup's answer today is Victor's prose.** | none | a renderer each (P7); byte count not derivable before design |
| `donna_verdict` `donna_review` | not derived | not derived | none | item 12 |

Referenced and undefined: `donna_retrieve` is an accepted alias (recordPrimitives.ts case table).
`donna_action`, `donna_calls`, `donna_report`, `donna_history_refused`, `donna_audit_verdict` and
`donna_review_binder` are field, event or scenario names, not tools.

**Sizing.** The acts mostly have a door already running them. The lookups have no door voice
at all; door-speaking a search is new work plus new founder bytes, the largest single cost.

**witnessLine.js, reported.** It is already the estate's shared money and date home: `rupees`
from nine vendor-side files (harvest.js:28, leads.js:32 and moneyGuard.js:55 cite it as "the CJS
wire's one grouped money home"); `longDateYear` and 4a-h1's `istDay` from chat.js:51,
calendarSignals.js:54, moneyFacts.js:53, lifecycleHands.js:39. The bride witness lives in the same
file (FILING_HANDS). Sound as the shared home; no vendor-side copy (chair-accepted).

## Item 2 · The ear

**Today.** Victor's model hears the vendor and instructs Donna in prose through
`dear_donna_talk` under `TALK_FUSE` (loop.ts:897 to :931). Her model sees only that prose: the
vendor's raw line reaches her runtime only as `donna_lead`'s field (donna.ts:442, :722) and her
words only as the provenance check (:445, :651). She picks the hands (donna.ts:530). Her voiced
report and plain receipts return to him (loop.ts:1080 to :1086). **His model text is the reply**
(loop.ts:871), and the door appends its lines after it.

**THE EAR, RULED: R-44.14 and R-44.15** (founder, 2026-09-19, after P1's table). His words,
verbatim, line breaks his:

> "listener haiku-
> operator-deepseek
> code-code
>
> vendor ai assistant to bride (Eliza)-haiku
>
> Codespaces-deleted"

Asked whether a listener parsing her words to an operator on DeepSeek is better than one listener
only whose model can be chosen, the chair recommended one listener, and the founder answered
*"ill go with your lean on this CE"* (R-44.15).

**The chair's reading of the two together, stated to him and open to his correction** (a reading,
not his words):
- **One listener per vendor message, and it has no hands.** Her sentence, with the recent thread,
  goes to the listener; it returns the structured request and nothing else. The DOOR validates the
  request, maps each act to a hand by a table, runs the hand through the door's existing path
  (`executeAndPatch`, as binderWrite.js:124 and invoices.js:299 already do), and writes the reply
  from the rows. No second model sits between the request and the hand: a listener handing to an
  operator is today's chain again, and P1 measured that hop (C3 matched C2's act on 8 of 21).
- **The listener's model is a panel choice** between the two SWITCHABLE models
  (modelRouter.js:116 to :119), set to `claude-haiku-4-5-20251001`. `VENDOR_ROLES` holds
  `['provider', 'donna']` (modelRouter.js:234), so the listener is a third role: a code change to
  the router and its panel, sized in P2.
- **The operator leaves the vendor's turn** and stays on DeepSeek for whatever of hers is not that
  turn; E-1, E-4 and CE-98 stand for her. **Derived at P2 and ruled by R-44.16: exactly one job is
  left for her seat on the working surfaces, composing the relay draft** (`composeBody`,
  `src/lib/vendor/relaySeat.js:441`, the only caller of `runDonnaTurn` besides loop.ts:931, which
  leaves when the door takes the hands at P4 and P5).
- **One sentence may carry several acts** (P1 row 11: a confirmed booking, a fee, a follow-up and
  an invoice), so the request is a LIST of acts the door runs in order, each confirmed or refused
  on its own line. Designed in P2's read-first.
- **Eliza** (`src/agent/souls/elizaSoul.js`) speaks to brides on Haiku, on the couple's own line
  (`resolveModel` on `wa_couple`, `src/agent/engine.js:351`). `model.wa_couple.default` already
  ships as Haiku (`src/lib/modelRouter.js:66`), so R-44.14's "Eliza, Haiku" confirms the shipped
  route and changes nothing.
  *Withdrawn:* the chair's earlier reading that Eliza on Haiku also covered the relay draft a bride
  reads. **R-44.16** (founder, 2026-09-19), asked whether he meant those drafts to move to Haiku:
  *"no"*. The relay draft stays with the operator on DeepSeek; `composeBody` at
  `src/lib/vendor/relaySeat.js:441` is untouched in seat and in code, as R-44.9 already had it.
- Replies on the working surfaces are code's (R-44.4).

**THIS SUPERSEDES OPTION (b).** The weighing of three ears below is kept as the record of how the
ruling was reached.

**The structured request, as ruled after P1.** Returned through a tool schema and never parsed
from text: `route` (task, search, neither) and a list `acts[]`, each carrying `act` (an act hand or
a lookup kind), `client_as_spoken` (never resolved by the model; F-44.9, F-44.16), `amount_rupees`
(whole rupees, **minimum 1**; absent means absent, F-44.40), `date_as_spoken` (the words she used;
**the door resolves them against today in IST through witnessLine.js's date home and no model does
date arithmetic**, F-44.38), `milestone` (as spoken) and `missing[]`; with `advice_part` (a flag for
the mixed turn) on the request. None of today's prose is written on the working surfaces.

**Three ears, as weighed before P1 (superseded by R-44.14 and R-44.15).** (a) The chain as it is,
Victor's text discarded: two hops and the relay class whole. (b) Donna hears directly: one hop, the
ear moves to her seat; already live for relay (`composeBody`, relaySeat.js:432 to :446, :484).
(c) A regex parser alone cannot hear mumbled speech; R-29.32's door-owned trigger (relaySeat.js:392
to :398, :459) is the pattern for the router's first pass.

**The listener's memory (F-44.39).** A cold ear cannot hear a fragment: P1's cold ears rightly
returned "neither" on about twenty of sixty fixture sentences ("full", "New.", "Give pdf", "Send
it", an email address). The door hands the listener the recent thread: the door's own lines as the
assistant's side and the listener's last requests from `meta`, through one additive map in
`loadThread` (which today reads `meta` only to drop tombstones, memory.ts:98 to :107). P2 proves it
on those twenty rows, thread in hand, with live keys on the founder's machine, supervised by this
seat.

**What is stored (W3, A3): both.** The door's lines in `content`, which history re-renders
(chat.js:3835) and the replay teaches; the structured request in `meta` (0081's jsonb), no DDL.

**The turn-share SELECT.** Read-only, the two fixture agents only (R-43.17), one statement per
paste block (protocol §13 amending §7). Run by the founder when this docs cut lands, not before.
The share comes back as bounds: act plus lookup is the floor of what the door can speak;
`no_hand` is the ceiling of advice and also holds snapshot-answered estate questions (F-44.7's
shape), so it overstates advice. Engine rows carry no lane (F-44.19); the lane is attributed by
time against the WhatsApp inbound row, and BLOCK 2 tests that attribution. The chair checked every
column against PUBLIC_SCHEMA.md and ENGINE_SCHEMA.md; `engine.messages.room` is absent from the
stale engine doc (F-43.13) and BLOCK 0 tests for it.

```sql
-- BLOCK 0 · schema witness. EXPECT engine.messages to carry meta (0081) and room (0159).
-- If room is ABSENT, run BLOCK 3b instead of 3a.
select table_schema, table_name, column_name
from information_schema.columns
where (table_schema, table_name) in (('engine','messages'),('engine','conversations'),('engine','agents'),
       ('engine','users'),('public','users'),('public','vendors'),('public','conversations'),('public','messages'))
  and column_name in ('conversation_id','role','content','tool_calls','meta','room','created_at','agent_id',
       'user_id','auth_user_id','phone','vendor_id','kind','direction','channel')
order by 1, 2, 3;
```

```sql
-- BLOCK 1 · the two fixtures, resolved the way vendorIdentity.ts:25-40 resolves, in reverse.
-- EXPECT one vendor and one agent per phone; anything else is a report, not a result.
select pu.phone, v.id as vendor_id, a.id as agent_id, a.mode, a.victor_mode
from public.users pu
join public.vendors v on v.user_id = pu.id
join engine.users eu on eu.auth_user_id = pu.auth_user_id
join engine.agents a on a.user_id = eu.id
where right(regexp_replace(pu.phone, '\D', '', 'g'), 10) in ('9888294440', '8595356978')
order by 1;
```

```sql
-- BLOCK 2 · the control. wa_inbound_rows is an UPPER bound on WhatsApp engine turns
-- (mode words and relay replies are answered before runTurn). If BLOCK 3's whatsapp total
-- exceeds it, the time window is wrong and the lane split is NOT evidence (C-44.4).
with fx as (
  select v.id as vendor_id, a.id as agent_id
  from public.users pu
  join public.vendors v on v.user_id = pu.id
  join engine.users eu on eu.auth_user_id = pu.auth_user_id
  join engine.agents a on a.user_id = eu.id
  where right(regexp_replace(pu.phone, '\D', '', 'g'), 10) in ('9888294440', '8595356978'))
select
  (select count(*) from engine.messages m join engine.conversations c on c.id = m.conversation_id
     join fx on fx.agent_id = c.agent_id where m.role = 'user')      as engine_user_rows,
  (select count(*) from engine.messages m join engine.conversations c on c.id = m.conversation_id
     join fx on fx.agent_id = c.agent_id where m.role = 'assistant') as engine_assistant_rows,
  (select count(*) from public.messages pm join public.conversations pc on pc.id = pm.conversation_id
     join fx on fx.vendor_id = pc.vendor_id
     where pc.kind = 'vendor_self' and pm.direction = 'inbound' and pm.channel = 'whatsapp') as wa_inbound_rows;
```

```sql
-- BLOCK 3a · each assistant turn classed by the hands it carried, laned by time.
-- The window (60 s before to 5 s after the engine user row) is a design guess that BLOCK 2 tests.
with fx as (
  select v.id as vendor_id, a.id as agent_id
  from public.users pu
  join public.vendors v on v.user_id = pu.id
  join engine.users eu on eu.auth_user_id = pu.auth_user_id
  join engine.agents a on a.user_id = eu.id
  where right(regexp_replace(pu.phone, '\D', '', 'g'), 10) in ('9888294440', '8595356978')),
t as (
  select m.role, m.tool_calls, m.meta, m.room, m.created_at, fx.vendor_id,
         lag(m.role)       over (partition by m.conversation_id order by m.created_at) as prev_role,
         lag(m.created_at) over (partition by m.conversation_id order by m.created_at) as prev_at
  from engine.messages m
  join engine.conversations c on c.id = m.conversation_id
  join fx on fx.agent_id = c.agent_id
  where m.role in ('user', 'assistant')),
dc as (
  select t.*, coalesce((
    select array_agg(d->>'name')
    from jsonb_array_elements(case when jsonb_typeof(t.tool_calls) = 'array' then t.tool_calls else '[]'::jsonb end) tc,
         jsonb_array_elements(case when jsonb_typeof(tc->'donna_calls') = 'array' then tc->'donna_calls' else '[]'::jsonb end) d
  ), '{}') as hands
  from t where t.role = 'assistant' and t.prev_role = 'user')
select
  case when exists (select 1 from public.messages pm join public.conversations pc on pc.id = pm.conversation_id
                    where pc.vendor_id = dc.vendor_id and pc.kind = 'vendor_self'
                      and pm.direction = 'inbound' and pm.channel = 'whatsapp'
                      and pm.created_at between dc.prev_at - interval '60 seconds' and dc.prev_at + interval '5 seconds')
       then 'whatsapp' else 'web' end as lane,
  case
    when dc.meta->>'tombstone' = 'true' then 'tombstone'
    when dc.meta->>'mode' = 'advisor' or dc.room = 'advisor' then 'advisor_room'
    when dc.hands && array['donna_client','donna_date','donna_money','donna_money_edit','donna_note','donna_note_append',
      'donna_phone','donna_doc','donna_stage','donna_write_reasonforaction_append','donna_edit','donna_hide',
      'donna_unarchive','donna_retrieve','donna_merge','donna_split','donna_repeatfollowup','donna_invoice_pdf',
      'donna_booking','donna_milestone_paid','donna_book_event','donna_block_date','donna_unblock_date',
      'donna_edit_event','donna_cancel_event','donna_assign_crew','donna_lead','donna_relay_stage',
      'donna_relay_send','donna_introduction_stage','donna_introduction_send'] then 'act'
    when dc.hands && array['donna_find','donna_whatsdue','donna_history','donna_history_refused','donna_tally',
      'donna_shelf','donna_brief_read','donna_review_read'] then 'lookup'
    when dc.hands && array['donna_verdict','donna_review'] then 'review_unclassified'
    else 'no_hand'
  end as cls,
  count(*) as turns
from dc
group by 1, 2
order by 1, 2;
```

```sql
-- BLOCK 3b · ONLY if BLOCK 0 shows engine.messages has NO room column. Withheld by comment
-- under the conditional-withheld rule; uncomment every line and run it in place of 3a.
-- with fx as (
--   select v.id as vendor_id, a.id as agent_id
--   from public.users pu
--   join public.vendors v on v.user_id = pu.id
--   join engine.users eu on eu.auth_user_id = pu.auth_user_id
--   join engine.agents a on a.user_id = eu.id
--   where right(regexp_replace(pu.phone, '\D', '', 'g'), 10) in ('9888294440', '8595356978')),
-- t as (
--   select m.role, m.tool_calls, m.meta, m.created_at, fx.vendor_id,
--          lag(m.role)       over (partition by m.conversation_id order by m.created_at) as prev_role,
--          lag(m.created_at) over (partition by m.conversation_id order by m.created_at) as prev_at
--   from engine.messages m
--   join engine.conversations c on c.id = m.conversation_id
--   join fx on fx.agent_id = c.agent_id
--   where m.role in ('user', 'assistant')),
-- dc as (
--   select t.*, coalesce((
--     select array_agg(d->>'name')
--     from jsonb_array_elements(case when jsonb_typeof(t.tool_calls) = 'array' then t.tool_calls else '[]'::jsonb end) tc,
--          jsonb_array_elements(case when jsonb_typeof(tc->'donna_calls') = 'array' then tc->'donna_calls' else '[]'::jsonb end) d
--   ), '{}') as hands
--   from t where t.role = 'assistant' and t.prev_role = 'user')
-- select
--   case when exists (select 1 from public.messages pm join public.conversations pc on pc.id = pm.conversation_id
--                     where pc.vendor_id = dc.vendor_id and pc.kind = 'vendor_self'
--                       and pm.direction = 'inbound' and pm.channel = 'whatsapp'
--                       and pm.created_at between dc.prev_at - interval '60 seconds' and dc.prev_at + interval '5 seconds')
--        then 'whatsapp' else 'web' end as lane,
--   case
--     when dc.meta->>'tombstone' = 'true' then 'tombstone'
--     when dc.meta->>'mode' = 'advisor' then 'advisor_room'
--     when dc.hands && array['donna_client','donna_date','donna_money','donna_money_edit','donna_note','donna_note_append',
--       'donna_phone','donna_doc','donna_stage','donna_write_reasonforaction_append','donna_edit','donna_hide',
--       'donna_unarchive','donna_retrieve','donna_merge','donna_split','donna_repeatfollowup','donna_invoice_pdf',
--       'donna_booking','donna_milestone_paid','donna_book_event','donna_block_date','donna_unblock_date',
--       'donna_edit_event','donna_cancel_event','donna_assign_crew','donna_lead','donna_relay_stage',
--       'donna_relay_send','donna_introduction_stage','donna_introduction_send'] then 'act'
--     when dc.hands && array['donna_find','donna_whatsdue','donna_history','donna_history_refused','donna_tally',
--       'donna_shelf','donna_brief_read','donna_review_read'] then 'lookup'
--     when dc.hands && array['donna_verdict','donna_review'] then 'review_unclassified'
--     else 'no_hand'
--   end as cls,
--   count(*) as turns
-- from dc
-- group by 1, 2
-- order by 1, 2;
```

## Item 3 · The router

*Superseded in part by R-44.17 and R-44.18 (§17): no advice classification exists, no redirect
line is spoken, and at P5 only the door speaks in the working rooms. Kept below as the record.*

**Today:** nowhere in code. No classifier exists on either vendor lane; the only `…Estate…`
symbol is an Instagram URL check (igImport.js:216). Victor's model decides implicitly. The only
room switch is the advisor page's own assertion (chat.js:3525), the sole way in (loop.ts:405 to
:412).

**The rule.** The door is the only author on both working surfaces. The ear's `route` has three
values, and they map to three door outputs and no fourth: **estate only**, act, ask, or stage and
confirm; **advice only**, the redirect line with its link; **both**, the estate lines first and
the link last, and if a money confirmation is pending, the link rides the reply after her yes or
no. **Unsure** resolves by one ordering: estate first, then the link, never prose. Any estate act
or entity goes to the estate branch, which asks for what is missing. None, "neither", or an ear
that returned no request goes to the redirect line. Doubt between task and advice goes to "both".
No branch reads model text, so none can emit it. R-43.16 holds on both lanes because the line
carries the control, a working link to `/vendor/advisor`.

**The silencing packet's acceptance: one cell per site, removed or shown unreachable.**

| Site | Where |
|---|---|
| W1 | loop.ts:831 `victor_token` → chat.js:380 → live `text_delta` (the route's `onEvent`, chat.js:3584) |
| W2 | chat.js:3763 → :3778, the JSON reply |
| W3 | loop.ts:1131 saving the model's text; chat.js:3647, :3737 patching; :3835 re-rendering |
| W4 | loop.ts:871 `'Got it.'` and :1117 (F-44.28) |
| W5 | chat.js:381 `handoff`, :398 `operator_report`, :382 to :397 summary-less `operator_action`. **Stopped at the sender.** |
| W6 | chat.js:359 to :371, built at :3630 and :3735 (F-44.26) |
| A1 | vendorInbound.js:1821 → :2376 send → the `public.messages.body` stored just after |
| A2 | vendorInbound.js:2002, :2019, from the second `runTurn` at :1968. Deleted, not edited |
| A3 | the engine row from loop.ts:1131, never patched on this lane (F-43.43) |

**R1 is RULED: R-44.9** (founder, 2026-09-18, verbatim): *"relay feature as is. a code cant do
the job intended for an agent writing and improving the reply"*. `composeBody` (relaySeat.js:438
to :452), the door-framed show at :116, the stored bytes and the send on her yes are untouched by
LC-Victor, under CE-212 as before. No LC-Victor packet edits the relay seat's composing path or
its vetoed bytes.

**The line his reason draws, for this item and every later case.** Words that STATE something
about the estate are the door's and are never model text. Words that are a MESSAGE she sends to a
person are drafted by the agent, shown to her verbatim, and sent only on her yes. The quote send
folded in from 4b (V7, A10, A11, Q1) sits on the second side and rides the relay seat's door.
So **a relay instruction is a task**: "tell Priya we're free on the 22nd" routes to the relay
seat and never to the redirect line. It is a P1 corpus row and a P2 router cell.

**The redirect bytes, ruled R-44.8** (item 14): advice only, `I handle your bookings, payments
and calendar here. For advice, ask Victor: {link}`; in a mixed turn, after the door's line or
lines, `For advice, ask Victor: {link}`.

server.ts:127 is outside the radius.

## Item 4 · Mouth and hands never meet

Three rooms (loop.ts:389, :424 to :425, :454).

**Advisor.** Reached only from the pwa advisor page (`body.room === 'advisor'`, chat.js:3525).
The WhatsApp lane forces business (vendorInbound.js:1758, :1973) and refuses the word (:1445 to
:1456). Mouth: Victor, HARVEY_SOUL plus ADVISOR_LENS (loop.ts:660 to :665). Hands: the handbook
read and `jot_advice` (loop.ts:766 to :774), which writes one row to `public.owner_notes` and
replies with a code line (jotAdvice.ts:56 to :67). Under the ruled definition (estate = lead,
binder, event, invoice, money, relay), **no writing hand leaves**; the room already holds none.
The guard's LIMB 4 convicts an act claim there (chat.js:2080).

**Business.** Mouth: Victor today. Hands: Donna's 39. Under R-44.4 the mouth becomes the door's;
the ear per item 2.

**Consult.** Minted only by `mintConsultAgent` (signup.ts:228) behind the engine server's
`/consult-mint` (server.ts:210), a separate process; dream-os `npm start` imports only `runTurn`
(index.js:32). No tools and no Donna (loop.ts:386 to :388, :776). R-44.4 to R-44.6 do not touch
it. Its caller is not derived (item 12).

## Item 5 · Figures in advice (the advisor room only)

Today the advisor room drops every estate block (loop.ts:454, :710, :731). The adviser holds none
of her figures.

**The choice, held for P8's charter (chair).** (i) Estate-blind: general advice, nothing about her
can be invented, and her own example ("how should i price my package. i want to increase", R-44.4)
is answered without her packages. (ii) A door-built note of her own packages and bookings
(package names, fees, items, bookings per package; no clients and no phones), behind a gate: a
reply in which any figure is not in the note by equality does not ship. **Recommended: (ii)**,
on record.

**RULED: R-44.19** (founder, 2026-09-19), verbatim: *"Advisor doesn't stay blind to numbers. He won't
be able to advise then. Advisor has no power tp write today. Only read. What's an advisor who can't
see the clients estate"*. Option (ii) is ruled; the estate-blind adviser with no gate is withdrawn.
P8 stands, now required, as LC-Victor's last packet: a door-built note of her own business (packages,
fees, items, bookings per package and what is owed; no client names the advice does not need and NO
phone numbers) feeds the adviser, and a gate withholds any reply carrying a figure the note does not
hold. The adviser gains no estate hand. What she reads when the gate withholds is the founder's byte,
asked at P8's charter.

*The correction of fact beside it (the chair's, given to the founder):* the adviser does **not** read
the estate today. loop.ts at `0675964`: `estateInRoom = !isConsult && !isAdvisor` (:454), its own
comment "advisor keeps the OWNER but drops all estate" (:453), and every estate read gated on it:
`loadFacts` (:463), `snapshotText` (:464), `donnaMessages` (:465), the calendar and activity blocks
(:672, :673), lead pings (:688), the pending relay (:696), `moneyBlock` (:710), `expenseBlock` (:724),
`bookedBlock` (:731). His tools are the handbook and `jot_advice`, `dear_donna_talk` disabled (:766 to
:774). The founder is right on the other half: no estate write, and none is added. **So P8 builds
sight; it does not preserve it.** W-1 is touched there (loop.ts's advisor branch, and advisorLens.ts
if his register changes), under a lift issued at P8 against a named list and not before.

**A constraint from the CE-44 4a handover §1, recorded for LCV-1:** the money fence as built can
convict a true sentence about what has already been paid, because the block does not hold that
figure. The same holds for the gate: a true figure the note does not carry is withheld. So the
note must carry every figure the adviser may lawfully speak, or the gate withholds truth. This
bounds the note's design at P8; it does not change the recommendation.

**Machinery.** Survives: the equality idea of `moneyGrounded`, at the gate's heart. Deleted with
the working-surface ladder: the class ladder (chat.js:1916), `moneyOnly` and F-44.11's hole (:1913,
:1980), the act and relay limbs. Rebuilt: the gate, with no class ladder in front of it, which
withholds rather than marks (today chat.js:2150 only marks). The chair's question, "does a
convicted reply reach the vendor, and should it", has no subject on the working surfaces; in the
advisor room the answer is no. What the vendor sees when it withholds is a founder byte (item 14).

**The fifth specimen list** (TDW_CE42_SESSION_SEAL.md:140 to :144; CE_SUCCESSION_CE42_TO_CE43.md:97).
Impossible by construction on the working surfaces: F-42.120 (clock times), F-42.133 (k/L/Cr),
F-42.147's sibling (D7 is built from the stored date), F-42.152 (unheld material), the 05:21:15
send claim. Surviving into the advisor room: F-42.133 and F-42.152 as figures in advice (the gate);
act claims (LIMB 4). The gate's own instruments: F-42.154, F-40.8. Outside the claim class:
F-40.7's catch-all goes with the ladder; F-40.2 is moot if door money reads use the invoice plane;
F-42.89 is a bench red on the out-of-window relay path (TDW_MICRO_F4287_HANDOVER.md:19); F-42.88
has no body in the tree (F-44.23).

## Item 6 · Confirm before money

Its own table, as accepted: `vendor_id`, the act, the structured request as jsonb, the lane of
origin, a CHECK-constrained state (staged, confirmed, declined, expired, applied), `expires_at`,
discipline copied from `pending_couple_drafts` (0117), nothing sealed touched. 0117 cannot be
shared: `couple_phone` NOT NULL (:68), `body` NOT NULL (:74). The migration number is allocated
at charter (C-43.8).

The flow, both lanes: the door stages, speaks one confirmation line naming the client, the
milestone, Rs with grouping and the full-month date, and reads the next message. Yes applies
through lifecycleHands.js and speaks D3 or D4; no declines and speaks one line, nothing written;
silence expires the row. The yes is read by the door (an `AFFIRM_RE`-class test, as
relaySeat.js:383), never inferred from prose. Keyed by `vendor_id`, as coupleDrafts.js:169 to :175
already is, so a yes on either lane finds it; the result speaks on the lane of the yes (F-44.19).
No open-question state survives a turn today: `pendingDonnaQuestion` is turn-local (loop.ts:816,
:957, :1191); only persisted text crosses, through the shared thread. Mixed turn (R-44.6): the
confirmation first, the link on the reply after her yes or no. The redirect never lands between
the stage and the yes.

## Item 7 · The two worlds

**F-44.22, resolved.** R-VS.2 is FINDINGS_LOG.md:5018's "F-A = A1": the writer home is the reader
home, moneyFacts.js builds the door block (TDW_VICTOR_SITTING_HANDOVER.md:16). "Refuses a second
client" is a gloss (P4A read-first :25; bookedFacts.js:12; bookingEvent.js:14 to :15). The refused
arms survive only at loop.ts:172 to :177: "a tool on a seat that holds none, a network hop for an
in-process read, or a second client and a second home"; their numbered texts are not in the tree.

**The binding.** db.ts:15 is a default schema, not a wall. The engine client reaches `public` at
six sites (F-44.25): donna.ts:90, donnaLead.ts:155 and :179 (insert and update `public.leads`),
donnaFind.ts:400, jotAdvice.ts:57, vendorIdentity.ts:33. AUDIT-1:45 recorded the `donna_lead`
write two days before c-43.20.

**Answer.** With the door doing the reads, the binding costs nothing; R-VS.2 stands as recorded
and is satisfied more fully. No second client is proposed. Narrowing the engine's existing
`public` reach is housekeeping, outside the gate.

## Item 8 · Both lanes, one cure (C-43.1)

The lanes share `runTurn` (chat.js:3564, :3703; vendorInbound.js:1757) and the lifecycle helper,
not the post-turn door. The cure lands once, in one door module both lanes call: the ear call,
the router, the line composer, the confirmation table, storing both. R-42.8 stands.

Left on WhatsApp beyond the redirect: the router; A1 (vendorInbound.js:1821); A2 (:2002, :2019,
:1968); A3 (F-43.43 becomes "store both"); the redirect line (R-44.8). `ADVISOR_ON_WHATSAPP`
does not retire by construction: which line the WhatsApp mode word gets is an open founder
question for P2's card (item 14).
R-VS.4's refusal (:1445 to :1456) and the forced business room (:1758, :1973) already are R-44.5's
WhatsApp half.

## Item 9 · What it swallows

**Packet 4b folds in**, its vetoed bytes verbatim as door lines: V1 to V3 the package read; V4 to
V6 attach, a door act with its refusals; V7, A10, A11, Q1 the quote send on the relay seat's door
(R1 standing, R-44.9); D1, D2 door lines by construction. **F-44.5's sequence, door-owned:** after V12,
the door files the lead through `donna_lead`'s path (donnaLead.ts:155 to :159), asks for the
package and the advance with its own lines, then runs `donna_booking`.

**Attach, as the route will stand.** Today `src/api/vendor/leadPackages.js:97` to `:100` overlays
only `name`, `description`, `line_items` and `total` from the request; a per-couple `delivery_on`
date is accepted separately at `:103`. No deposit, middle or delivery-basis terms travel. LC-2's
packet 5 cures that (F-44.6 amended), ahead of LC-Victor. The door act is designed on the route as
it will stand after that cut, and this seat re-pins when it lands.

**Attach, as built (packet 5, `509f55a`).** The route overlays the five per-couple keys plus
`total` (`leadPackages.js:62`, `OVERLAY_KEYS`), with `delivery_on` through `EDITABLE` (`:59`), and
refuses a booked lead at 422 with `code: 'already_booked'` (`:128`, F-44.31). The pwa speaks
R-44.12's byte for that code (`LeadPackageCard.tsx:296` to `:299`, `:392`). Attach as a door act
therefore stands on the route as built and speaks that refusal. **"Change package after booking"
is not attach's: it sits with F-44.17 in LC-3.**

**Against LC-4: RULED, R-44.7 (founder, 2026-09-18, "LC victor before LC 4").** LC-4's walk says
"Victor quotes the package" (roadmap :75), a narrating Victor; cut first, its reply path would be
built on the prose LC-Victor removes. LC-Victor's P1 to P6 come before LC-4; LC-3 may run alongside
as the second seat; LC-4 is then built on the door. LC-Victor remains the hard gate on G6 (R-44.2).

## Item 10 · W-1: what a lift would have to name (nothing moves)

W-1 is the soul boundary (masterplan :41). `WORKLIST_PARITY.md:93` to `:98` uses "W-1" for a tap
budget: a name collision, no rename proposed.

Soul and lens files: `harveySoul.ts` (HARVEY_SOUL, PRODUCTION_WEAVE, NO_MACHINERY_LAW; loop.ts:18),
leaves the business room, stays in the advisor room · `advisorLens.ts`, touched only if item 5's
gate changes his register · `donnaSoul.ts`, names Harvey **20** times, all rewritten under (b) ·
`consultantHarveySoul.ts`, untouched · couple-side souls out of radius.

Model-facing strings addressed to Harvey: **22** across nine tool files (dearDonna.ts 1,
dearDonnaHandbook.ts 2, donnaBench.ts 2, donnaFind.ts 3, donnaLead.ts 1, donnaVerdict.ts 2,
listenHarvey.ts 4, recordPrimitives.ts 6, relayCouple.ts 1), including F-44.24's two refusal
strings at recordPrimitives.ts:929 and :939 (chair's mechanics).

Founder bytes in the radius: V8 at recordPrimitives.ts:531 · `ROOM_LINE.business` at loop.ts:74 ·
`OPEN_QUESTION_LINE` at chat.js:359 · victorLines.js (hash-carried :180 to :191), including
`ADVISOR_ON_WHATSAPP` at :75 to :76. Relay and introduction bytes untouched.

## Item 11 · The packets

Each walked before the next cuts; every witness a row, a cell or a table, never model prose.

- **P1 · The ear table** (measurement; ships nothing). Its rig is drafted for the chair's kickoff
  in the seat's report, not in this document. **Ruled: the rig is applied for the run and not
  committed.** It lands by the guard and unzip into `scripts/`, writes only under `scripts/out/`
  (ignored), and the run block removes the rig file and proves `git status --porcelain` empty
  inside the same chain. Its source is committed later inside P2's code cut, under `scripts/`,
  floored once with real code. The table he pastes back is the evidence of record, quoted whole
  in P2's handover. Card rows beyond the fixtures' sixty: the 4a handover's card sentences; the
  relay instruction "tell Priya we're free on the 22nd" (R-44.9); and a pure advice question in
  the founder's own words, "how should i price my package. i want to increase". **Card:** the
  founder reads the table and fills his own column.
- **P2 · The router and the redirect line.** Contract from P1; the `advisor` key in pwaPaths.js;
  R-44.8's bytes on both lanes; the router's cells include the relay instruction routing to the
  relay seat. **Card, exact:** ask for advice on WhatsApp and read the advice-only line with a
  link that opens the advisor room; send a mixed message and read the door's task line followed
  by the short form; the same on the TDW chat's working room. Shown to him in place at this card,
  minting nothing: the mode word on WhatsApp answered by `ADVISOR_ON_WHATSAPP` (no link) or by
  the advice-only line (with the link). **Witness:** the stored row's content is those door lines
  and `meta` holds the request.
- **P3 · The pwa return path (F-44.21) and the pre-filled question.** WorklistBoot.tsx:62 stores
  the intended `/vendor/…` path; pin-login/page.tsx:112 reads it, allowlisted; the advisor page
  reads `?q=` into the draft and never sends. These three files are LC-Victor's alone (chair).
  **Card, handset witness:** on an iPhone, signed out, tap the link in WhatsApp and land in the
  advisor room with the question waiting.
- **P4 · The structured result per hand:** hand, ok or refused with a reason code, entity ids,
  figures, replacing undoContract.js:36 to :106. Carries the invoice number the door actually
  minted (F-44.30). **Witness:** cells.
- **P5 · Silencing, money and lifecycle first.** The door speaks alone for booking and milestones;
  the confirmation table; W1 to W6 and A1 to A3, one cell each; F-44.26 and F-44.28 close here.
  **Card:** card 4a re-walked on both fixtures, zero model text on the glass.
- **P6 · 4b folded.** Packages, attach and quote as door acts; F-44.5's sequence. **Card:** card 4b.
- **P7 · The calendar and records hands** with full-month door lines (F-43.33); then the lookups,
  each with its founder bytes.
- **P8 · The advisor gate** (item 5), with its withheld line.
- Housekeeping inside the first packet that touches each file: F-44.20, F-44.25's four comments,
  F-44.24 under (b).

## Item 12 · What this seat could not determine

- The turn share: pending the SELECT.
- Either model's listening on mumbled speech: pending P1.
- Who calls server.ts, and so consult's surface.
- How Victor knew Swati was crew (F-44.9; the 4a handover §6 forwards it).
- The veto status of loop.ts:871 and :1117 (F-44.28), and whether `deriveFiling`'s summaries were
  ever vetoed as wire lines.
- The planes of `donna_verdict` and `donna_review`.
- Whether an iOS WhatsApp link opens Safari: a handset witness.
- The cost of handing the ear the thread under (b): unmeasured.
- F-43.43's own derivation, never done (succession note :89).
- The `already_booked` predicate (`leadPackages.js:128`) refuses when the lead's state is `booked`
  **or** it already carries a `binder_id`. Whether a lead that is not booked can hold a binder is
  not derived.
- The door's behaviour when the second of three acts is refused. P2's read-first.

**Struck, derived:** what is left for Donna's seat. Exactly two callers of `runDonnaTurn` exist
(loop.ts:931, `src/lib/vendor/relaySeat.js:441`); once the door takes the hands, one job is left on
the working surfaces, the relay draft.

**Struck, ruled:** the Eliza reading. **R-44.16** (founder, 2026-09-19): *"no"*. The relay draft
stays on DeepSeek (item 2).

**Struck, ruled:** R1. **R-44.9** (founder, 2026-09-18): *"relay feature as is. a code cant do the
job intended for an agent writing and improving the reply"*. The relay draft stands (item 3).

**Struck:** "the 4a handover's §1 and §8 to §11 not read for contradiction". Read at `a3bddb9`.
They contradict nothing here except item 1's money row, corrected (e-3). Reported: the handover's
§1 cites the one `executeRecordTool` call at `donna.ts:726`, the P4A read-first's older line; at
this tip it stands at `donna.ts:736`. §1's note "recorded for LCV-1" is carried into item 5.

## Item 13 · The link

`https://thedreamwedding.in/vendor/advisor`: the origin from `PWA_ORIGIN` (pwaPaths.js:43), the
path from rooms.ts:202, added as an `advisor` key in `VENDOR_PATHS` under that file's law (:29 to
:30). With her question: `…/vendor/advisor?q=<her words, URL-encoded, capped>`.

Signed out, she lands on `/` (WorklistBoot.tsx:62), and after the PIN on `/vendor` → `/vendor/rooms`
(pin-login/page.tsx:112; shell page.tsx:18): destination and question lost. P3's two files carry
both across; the question survives as part of the stored path.

Pre-filled, never auto-sent: WhatsApp and browsers fetch a link for its preview, and browsers
prefetch. A GET that sends would fire a model turn nobody asked for, possibly more than once. A
draft waits for her thumb. R-43.16: the line is lawful because it carries the control, on both
lanes.

## Item 14 · The bytes, for the founder

*R-44.8's two bytes are approved and UNUSED (R-44.17); they enter no file. The working rooms'
leftover line and its batch are R-44.18's, in §17.*

**The redirect line, RULED: R-44.8.** The founder, verbatim, 2026-09-18, shown option A, option B
and B with Victor's name, each in the plain and the mixed case: *"A with A"*. The chair's reading,
stated to him and open to his correction: option A for the advice-only turn, and A's own short form
for the mixed turn. The bytes, verbatim, his:

```
advice only:                                  I handle your bookings, payments and calendar here. For advice, ask Victor: {link}
mixed turn, after the door's line or lines:   For advice, ask Victor: {link}
```

`{link}` is item 13's advisor URL, carrying `?q=` once P3 has landed and bare before it.

*Note, not a proposal:* the first sentence names three planes of a lane that also files leads,
invoices, crew and notes. It is reviewed with him whenever the lane's reach changes.

*Considered and not chosen:* the seat's candidate B, `Advice lives in the Advisor room in the app:
{link}`, not adopted on his words "A with A".

*Open for P2's card, minting nothing:* `ADVISOR_ON_WHATSAPP` (victorLines.js:75 to :76, R-VS.4)
does not retire by construction, as it would have under B. When she types the mode word on
WhatsApp, does she get that older line, which has no link, or the new advice-only line, which
does? The chair's lean is one sentence with the link. Both are shown to him in place at P2.

**Retired, each with its origin, so he retires them knowingly:**
- `OPEN_QUESTION_LINE`, chat.js:359, minted at TDW_06 D-6 (masterplan :42, "the minted line… veto
  set rides"). F-44.26.
- The fallbacks at loop.ts:871 and :1117, if vetoed at all. F-44.28.
- **F-44.30:** undoContract.js:96 renders "Invoice minted: Invoice" on every call. The regex at
  :93, `/INV[-\w]+/i`, matches the first word of recordPrimitives.ts:910's display "Invoice
  document requested…", and the estate's numbers (`TDW/DEV440/17`) never match it; it also says
  "minted" when the signal is recorded, before the door mints. :79 "Money corrected" is its
  sibling. Replaced by P4's structured result carrying the number the door minted.

**Re-veto under (b):** V8 at recordPrimitives.ts:531 ("…ask Harvey for it rather than filing.").

**New bytes the design needs, none minted, by packet:**

| Packet | New founder bytes |
|---|---|
| P2 | none new: the redirect line's two renderings are ruled (R-44.8); the mode-word question is his, shown in place |
| P5 | success lines for act hands: **3** (`donna_money`, `donna_money_edit` for non-package binders, one `donna_invoice_pdf` sentence for both lanes); the confirmation line: 1; its no line: 1; missing-field questions for fields A9 and D6 do not cover (client, advance date): at least 2; the listing line for two clients sharing a name (F-44.9, F-44.16; D8 is today's refusal): 1; F-44.28's two fallbacks: 2 replaced, or 0 if retired |
| P6 | success lines for act hands: **1** (`donna_lead`); V1 to V7, A10, A11, Q1, D1, D2 already vetoed |
| P7 | success lines for act hands: **14** (the eleven records hands and `donna_merge`, `donna_split`, `donna_repeatfollowup`); 1 amended to full month (`bookingLines`); a renderer per lookup hand, 7 hands, byte count not derivable before design |
| P8 | the gate's withheld line: 1 |

**Act-hand success lines in all: 18 new, 1 amended.**

## Item 15 · The split that already exists

A business-room turn today: the door builds the facts (chat.js:3561 to :3563; vendorInbound.js:1720
to :1747) and calls `runTurn` → Victor's model hears the message, the thread (`loadThread`), the
snapshot and the facts (loop.ts:463 to :465, :710, :731) → picks `dear_donna_talk` (:776, :897) →
Donna's model hears his prose (:931) and picks hands (donna.ts:353, :530) → `executeRecordTool`
runs each (donna.ts:736) → she speaks back (`listen_harvey_talk`, :573) → his composer receives her
voice and receipts (loop.ts:1080 to :1086) → **his text is the reply** (:871), saved (:1131) → the
door runs signals and appends its lines (composedTail, chat.js:1134; vendorInbound.js:1821 to
:1849) → the guard classifies (chat.js:3649, :3739; vendorInbound.js:1946) → the wire.

**The same turn under R-44.4, R-44.14 and R-44.15** (the chair's reading of R-44.14 and R-44.15,
open to the founder's correction): the door builds the thread and calls **the listener** (a third
router role, Haiku) → the listener returns the request, a list of acts, and nothing else → the door
validates it, resolves each client and each spoken date itself, and maps each act to a hand by a
table → **the door runs each hand** through its existing path (`executeAndPatch`) in order,
confirming before money (item 6) → **the door writes the reply** from the rows, one line per act,
with R-44.8's link where the request carries advice → the door stores its lines as `content` and
the request in `meta`. **Victor is not in this turn at all**; his voice stays in the advisor room.
**Donna's model is not in this turn either**: her hands are run by the door, and her seat (DeepSeek,
E-1, E-4, CE-98) keeps only what is not the vendor's turn: on the working surfaces, exactly one job,
composing the relay draft (`composeBody`, `src/lib/vendor/relaySeat.js:441`), which R-44.16 keeps on
DeepSeek. The founder's line 1, "victor can hear everything", is answered by his own R-44.14: the
listener is the ear.

## §16 · After P1: the ear table (CE-44, 2026-09-19)

**The run.** Supervised by this seat on the founder's Codespace at `72db669`, fed from the
Supabase editor's CSV export of the corpus SELECT; `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
never entered the Codespace, and the two provider keys were added as Codespaces secrets and then
deleted. The rig's `FINGERPRINT` line equalled the founder's S1 row exactly: `user_rows=308
with_relay=100 earliest_utc=2026-06-23T19:16:29.981839 latest_utc=2026-09-18T09:35:00.505712`.
201 rows (67 sentences × 3 candidates), `NO_REQUEST` 0, `NO_RELAY` 46. Usage: C1 67 calls, 13703 in
/ 7749 out tokens; C2 67 calls, 65895 in / 8785 out; C3 21 calls, 4620 in / 3225 out. The rig
removed itself and the tree was clean.

**The evidence of record** is the founder's table file, committed byte for byte at
`docs/handovers/TDW_CE44_LCV_P1_EAR_TABLE.md`, sha256
`aa29bbbdc31ec6ea96a87c63e2175598a01110e2828a138396885240d398820d`, 215 lines.

**What it showed (the chair's reading of the table, recorded):**
- The two direct ears agree on route on **54 of 67**. Where they differ it is mostly questions:
  C1 (DeepSeek) routed as `neither` what C2 (Haiku) routed as `search` on rows 15, 24 ("Am I free
  in 16th December"), 32, 36, 37, 40, 46, 51, 55 and 56; rows 44 and 57 ("Show the invoice here")
  C1 heard as a task where Haiku heard a search. Under R-44.5 a `neither` sends her to the advisor
  link, so a missed search is the costliest error an ear can make.
- Haiku heard R-44.9's class where DeepSeek did not: row 60 `quote_send` against `neither`, row 66
  `relay` against `date`; and caught row 13's fee.
- About twenty of the sixty fixture sentences are fragments that mean nothing cold; both ears
  rightly returned `neither`. P1 says nothing about them (F-44.39).
- **Today's relays carry inventions into the operator's instructions.** The four, verbatim from
  the table's `heard` column for C3:
  - Row 6, the vendor: "Swati Test paid the middle payment on 18 September". The relay: "Swati Test
    — log middle payment: Rs 26,667, received 18 September 2026. This is the 33.33% milestone
    payment on the Rs 80,000 fee for the wedding 22 February 2027."
  - Row 8, the vendor: "Swati Test, phone +918595356978. Wedding date 22 February 2027. Fee quoted
    Rs 80,000, package Photographs and film. The advance arrived today." The relay: "Update Swati
    Test to confirmed booking: phone +918595356978, wedding 22 February 2027, fee Rs 80,000
    (Photographs and film package). Raise invoice against this booking. Advance Rs 80,000 confirmed
    received today — log as paid against the invoice." *Recorded beside it: she named no advance
    figure, and all three ears returned 80000 against the advance.*
  - Row 30, the vendor: "Send a message to priya mehta asking her to pay the advance". The relay:
    "Send a message to Priya Mehta at 8757788550 asking her to pay the advance for her quoted
    booking (Rs 42,000)." C3 heard it as `advance_paid` with 42000.
  - Row 31, the vendor: "Add 8757788550 as phone number of priya mehta". The relay: "Log Priya
    Mehta's phone number as 8757788550. She's the quoted lead from 10 September, Rs 42,000."

**Findings from the table (allocated by the chair):**
- **F-44.38.** The rig gave the ear no "today", so every yearless date came back in a wrong year
  (C1 2025, C2 2024). Ruled for the contract: the listener returns the date as spoken; the door
  resolves it against today in IST through witnessLine.js's home. No model does date arithmetic.
- **F-44.39.** The listener must be handed the recent thread. P2 proves it on the twenty fragments.
- **F-44.40.** An amount of 0 was emitted where no figure was spoken (C1 row 5, C2 row 61). The
  schema takes a minimum of 1; the door treats absent as absent.
- For the door's resolver, not a finding: C2 returns "Khanna wedding" and "Tandon wedding" for
  Khanna and Tandon, and row 23 put "Personal" in `client_as_spoken` for a blocked day.

**Line shifts recorded at `72db669`.** Packet 5 inserted 13 lines at `chat.js:2753`. Every chat.js
citation in this document below `:2752` holds; every one above it is +13 at this tip (for example
the two `runTurn` calls at `:3577` and `:3716`, the room assertion at `:3538`).

## §17 · R-44.17 and R-44.18: no advice router; only code speaks in the working rooms (CE-44, 2026-09-19)

**R-44.17** (founder), verbatim: *"yes. let the business mode run as it is running today. any advice
that is asked, the estate handles it today. it continues getting handled the samee way."* Before it,
his reasons, verbatim: *"i dont think people or vendors will ask for advice on whatsapp lane in any
case. See, a vendor would see the pwa-advisory room and would know. whatsapp as a channel exists for
business. so in hindsight, id rather not have that router coding complication. I feel itll be
unnecessarily burdensome because now we will have to keep a tab with the model is categorising as
advice and what is a task."* **R-44.5, R-44.6 and R-44.8 are WITHDRAWN**; R-44.8's two bytes are
approved and unused. There is no advice classification anywhere: the listener returns tasks and
lookups only, and `advice_part` leaves the schema. `ADVISOR_ON_WHATSAPP` and R-VS.4's refusal stand as
they are. What falls out of LC-Victor: the router's advice and mixed branches, the short form, `?q=`,
and P3 as a packet. **F-44.21** (the signed-out deep link loses its destination) stays a true finding
for any link into the app and is **re-filed to LC-3**. P8 stands (item 5, R-44.19).

**R-44.18** (founder), verbatim: *"I think option 1 is better than option 2 because my 60 something
examples are merely what we could come up with. There can be a million more."* and, quoting the
chair's first cut back: *"Option 1 is One. Victor leaves the working rooms completely. This is option
two, and it's what you've just described. Only code speaks there. With Victor gone, a whole layer of
machinery can be deleted: the relay between the two AIs, the fuse for when they argue, and the checker
that watches his prose for invented figures. There is nothing left to watch. Each message costs one AI
call, and every reply comes from the records."* The chair's reading, stated to him: **Victor leaves
the working rooms entirely**, WhatsApp and the TDW chat's working room; only the door speaks there.
This supersedes R-44.17's clause that leftover turns are answered as today, and R-44.4's fourth
sentence with it. When the door takes the replies, `dear_donna_talk`, `TALK_FUSE`, Fork C, the class
ladder and wireGuardVictor's working-surface limbs are **deleted, not repaired**. The operator keeps
her one job, the relay draft (R-44.16). Victor speaks in the Advisor room and nowhere else. The
chair's second cut (narrowing the build to the acts his sixty messages used) is **refused**: the full
inventory of item 1 stands as the target, sequenced by frequency, money and lifecycle first.

**The leftover line, his byte** (for a message the door can make no task or lookup of):

```
I didn't catch a task in that. You can say things like:
```

followed by **two examples drawn at random** from a batch. His words: *"We will have a batch of 10
messages- 2 messages at random show up everytime the code days I didn't catch a task in that."* and
*"for the examples, we will not use swati name."* No real or fixture name appears in any example.

**The batch, approved by him verbatim ("Your examples are perfect."), each line a byte:**

```
The Sharma wedding is confirmed for 5 December, fee 60,000
The advance came in today for the Kapoor booking
Am I free on 14 February?
Block 20 March, personal
Move the Verma shoot to 22 November
Raise the invoice for the Bose wedding
Who are my new leads?
What's due this week?
Add a new lead, haldi shoot on 3 January
Send a message to my client asking for the advance
```

He added: *"Add two for teams as well- assignment of a task."* His two lines, 20 September, verbatim:
*"two teams assignment one can be about adding priya to a team and one will be something else you
decide"*, then *"second can be assinging mira a team event"*, then, told that Mira is already the marketing
lane's persona (`modelRoutesCopy.ts:52`, R-41.89), *"add Harsh in place of mira"*. The chair read
`donna_assign_crew` (`recordPrimitives.ts:493` to `:494`): it puts a team member on a booking or takes them
off, for a date already on the calendar, and nothing creates a team member, so "adding priya to a team" is
drafted as adding her to an event's team. An example may only promise what the lane can do.

**THE BATCH IS COMPLETE AT TWELVE**, every byte approved by him, none pending, verbatim and in this order,
after the line itself:

```
I didn't catch a task in that. You can say things like:
The Sharma wedding is confirmed for 5 December, fee 60,000
The advance came in today for the Kapoor booking
Am I free on 14 February?
Block 20 March, personal
Move the Verma shoot to 22 November
Raise the invoice for the Bose wedding
Who are my new leads?
What's due this week?
Add a new lead, haldi shoot on 3 January
Send a message to my client asking for the advance
Add Priya to the team for the 5 December wedding
Assign Harsh to the 14 February shoot
```

**Withdrawn, not to reappear:** "Assign my assistant to the 5 December wedding", "Who is on the team for the
14 February shoot?", "Assign Mira to the 14 February shoot". His rule stands: no fixture name (*"we will not
use swati name."*); Priya and Harsh are his own choices.

Two examples are drawn at random each time the line is spoken (R-44.18). The bytes go live at P5 and not
before; when they do, they live in ONE home, hash-carried as `victorLines.js` carries its founder bytes, and a
cell proves each example is a sentence the listener routes to an act or a lookup the door can run, so the line
never offers her something the lane cannot do.

**R-44.20** (founder, 20 September, verbatim): *"Basic on deep seek. two teams assignment one can be about
adding priya to a team and one will be something else you decide"*. The Listener on the Basic tier STAYS on
DeepSeek on both vendor surfaces; every other working-room tier is on Haiku. His tap and his cost decision,
made knowing what P1 showed DeepSeek does to questions. **P5's first precondition:** he has decided; the card
says so, and its walk includes one QUESTION sent from a Basic-tier vendor so what that tier hears is seen, not
assumed. No fixture is on Basic (9888294440 signature, 8595356978 prestige); how that turn is driven is the
chair's to rule with him at P5's charter.

**For P5's design (the chair's, from P4a's walk; not a finding):** on a just-booked client whose invoice is
made at booking, Victor asked WHICH invoice and did not reach the tool; the named re-issue did. When the door
speaks for invoices, "send me X's invoice" on a client with exactly one invoice serves it without a question,
and with more than one asks by number.

None of R-44.18 is P2's to build; the line and the batch are P5's.

---

Trust evidence over narrative, including this document. Sequencing beyond this sitting is the
founder's.
