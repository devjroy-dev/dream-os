# TDW · CE-46 · ASK-2 · CUTS 2 AND 3 HANDOVER · the question agent ON for every vendor, both lanes · 27 September 2026 IST

R-45.33: a vendor asks anything about her own business and gets a true answer read from her records. Read-only by construction.
Tree at the arms: 6efcf91 (cut 2a r2 landed at da9c7ef and after; nothing of this seat's moved since). No code moved in cuts 2 or 3:
each is one admin_config row by the founder's hand on the chair's confirm, as laneFlags.js :133 says it must be. This document is the
record of the two arms and the two walks; TDW_CE46_ASK2_CUT2A_HANDOVER.md holds cut 2a's code.

## 1 · The arms

- `vendor.ask_agent.pwa` = true, updated_at 2026-09-27 14:03:17.360369+00 (19:33:17 IST), C2-1 upsert with RETURNING; C2-2 read-back one row,
  no WhatsApp row (the control). The disarm C2-3 shipped beside it, held in the founder's hand for the chair's word.
- `vendor.ask_agent.whatsapp` = true, updated_at 2026-09-27 14:25:23.521624+00 (19:55:23 IST), C3-1; C3-2 read-back two rows both true, the
  app key's timestamp unchanged. The disarm C3-3 beside it, same hand, same word. Before the row: the founder's grep of the 548 kept replies of
  the run of record (haiku_record4.jsonl) for a UUID, a short-id shape, Donna/Harvey or a register word: 549 lines, 0 matches.
- The founder's order of 27 September: the agent ON for every vendor on both lanes. Both stay ON unless the chair says otherwise.

## 2 · The no-change walk (both lanes OFF, before cut 2), twelve of twelve

Six messages on the app as DEV440 and six on WhatsApp from 9888294440 to +91 79821 59047; export of engine.messages with meta.listener
(lane, request, door, ask). Every assistant row: lane set, door true, ask NULL. The agent was never reached. Lines: B69 with B81 (35 named,
7 nameless: "and 30 more" then the nameless line), B73 (Priya Nair · Delivery · Rs 18,000 · 30 September 2026), B71 (14 February 2027 free;
on WhatsApp "14 Feb 2027m" still resolved), B86, LEFTOVER with two examples. M4 "How much is owed to me in total": on the app the ear
routed whatsdue and B73 spoke; on WhatsApp the ear routed tally and B80 spoke ("Owed to you: Rs 10,66,000 across 18 open invoices.").
That is F-44.211 (minted; ELZ-3's): the listener hears "owed to me in total" as the week's dues, and lane by lane it differs.
e-198 (this seat): the card's M1 expected line said "and 37 more" from the raw count of 42; the door splits named from nameless. Cure bound
on every card since: a fixture SELECT feeding a B69 line counts named and nameless separately.

## 3 · The app walk (cut 2 live), thirteen questions, Rs 7.82

Window from 14:03:17.360369+00. Exports: engine.messages (meta.listener.ask, the tool trace with arguments and ok) and engine.usage (the
agent's uncounted row on its own model beside the ear's counted row), both column-witnessed in the arm card. Every assistant row lane pwa,
ask present, no write anywhere (there is no write tool to carry).

| IST | asked | tools | reply (start) | rule |
|---|---|---|---|---|
| 19:35:31 | how much is owed to me in total | owed | You are owed Rs 10,66,000 across 18 open invoices. | clean |
| 19:37:03 | what dates are booked in december 2026 | days(booked, December 2026) | Booked in December 2026: 4, 5, 22, 28 December 2026. | clean |
| 19:38:39 | whats the situation with walk? | client(walk) | I found 27 matches... Which one did you mean? The booked ones are... | clean, R-46.2 form |
| 19:39:06 | walk seventeen alpha | client(Walk Seventeen Alpha) | Walk Seventeen Alpha is booked. Wedding on 8 January 2027. You are owed Rs 80,000 across 1 invoice. [package, three milestones summing to Rs 80,000; "Rs 24,000, was due 23 September 2026": cut 2a's comma live] | clean |
| 19:40:23 | any idea whaat stage nalini booking is? | client(nalini) | Your records do not show anyone called nalini. You can add them in Clients. | clean (lowercase kept) |
| 19:41:41 | Kya 24th december booking hai koi? | day(24 December) | 24 December 2026 free hai. Koi booking nahi. | clean |
| 19:42:08 | walk seventeen alpha any crew member assigned? | day(8 January) | ...no crew members are assigned yet. You can add crew in the event details in Calendar. | clean |
| 19:42:19 | mere crew mein kaun kaun hai? | team | Aapke paas 9 crew members hain: [nine, one per line] | clean |
| 19:43:05 | what are my events | events | You have 18 events coming up: [one per line] | clean |
| 19:43:13 | sarah ka event kab tha | NONE | I could not find a client or lead named Sarah in your records. Could you check the spelling or give me the full name? For example, is it Sarah with a last name? | MISS m1, m4 |
| 19:44:21 | sarah ka event kab hai | events(sarah) | Sarah ka wedding 22 December 2026 ko hai, Delhi mein. | clean |
| 19:45:02 | am i free tomorrow? | day(tomorrow) | Yes, 28 September 2026 is free. | clean |
| 19:45:09 | what does day after look like? | day(29 September) | 29 September 2026 is free. | clean |

Verdict: m1 12/13, m2 13/13, m3 13/13, m4 12/13, m5 13/13 (no markdown, no dash, no persona; Hinglish answered in Hinglish). The miss: an
absence asserted with zero reads, on a name whose event stood in the list two turns earlier; the past tense ("kab tha") is the ruled
past read, but the reply claimed a search it never made. The agent's prefix in production is 6,191 tokens (cache_creation on the first
call, 12,382 read on two-round answers); the 1d probe read 6,530. Noted, not explained; the probe re-run is ASK-3's. F2 (b)'s text-only
last round was never reached (two rounds at most). Meter: agent Rs 4.95, ear Rs 2.87.

## 4 · The WhatsApp walk (cut 3 live), twelve questions, Rs 7.47

Window from 14:25:23.521624+00. Exports: E3-1 engine rows (lane whatsapp, ask on every assistant row); E3-2 public.messages outbound
bodies with twilio_sid, twelve of twelve BYTE-IDENTICAL to the engine content (the unscrubbed path carried nothing the app's firewall would
have touched); E3-3 the meter, cache written at the first call and again at 20:35 after the five-minute expiry.

| IST | asked | tools | reply (start) | rule |
|---|---|---|---|---|
| 20:14:10 | How much is it wed to me in total | owed | You are owed Rs 10,66,000 across 18 open invoices. | clean (ear heard whatsdue with client "wed to me"; the agent read owed) |
| 20:15:07 | 23rd December is booked? | day(23 December) | No, 23 December 2026 is free. | clean |
| 20:15:18 | Kal free hoon? | day(tomorrow) | Haan, kal 28 September 2026 free ho. | clean |
| 20:15:30 | Parso ka plan kya hai? | day(29 September) | 29 September 2026 free hai. Koi plan nahi hai. | clean |
| 20:15:41 | What was the last invoice raised | events(past, kind invoice) | Your records do not show invoices in the Calendar. You can view and raise invoices on the Invoices page in the app. | MISS m1, m4; tool gap |
| 20:16:02 | What are the next 5 upcoming events? | events | The next 5 upcoming events are: [five, blank lines between] | clean |
| 20:16:24 | Who all are in my crew | team | You have 9 crew members: [nine] | clean |
| 20:16:34 | Walk p5 ke event date kab hai | NONE | I could not read that. Could you write the name another way, or tell me which crew member you mean? | MISS m1, m4 |
| 20:17:01 | When is walk p5 event? | NONE | I could not read that... Your crew list shows names like Swati, Rahul, and others. Who are you asking about? | MISS m1, m4 |
| 20:17:22 | Is there a walk p5 client | client(Walk P5) | I found three matches: Walk P5 Book, Walk P7, and Walk P5 Advance. Which one? | clean |
| 20:17:41 | Walkp5 book | client(Walk P5 Book) | Walk P5 Book wedding is on 15 March 2027. | clean |
| 20:35:00 | When is nishta's booking date? | client(nishta) | Your records do not show anyone called Nishta. You can add her in Clients. | clean |

Verdict: m1 9/12, m2 12/12, m3 12/12, m4 10/12, m5 12/12. Meter: agent Rs 4.86, ear Rs 2.61.

## 5 · The misses, by label, for ASK-3 (nothing cured here; R-46.1)

1. THE SEARCH-FIRST CLASS, sharpened. Four live turns (Sarah past-tense on the app; Walk p5 twice on WhatsApp) produced a "could not
   find" or "could not read" sentence with ZERO tool calls, one round each (633 to 647 input tokens). The bank's q016/q026/q317 showed the
   agent asking before searching; live it declares absence without searching. "When is walk p5 event?" is q026's wording. The rule for
   ASK-3, as the chair named it: search-first as a code rule, never an absence without a search. A code mechanism that runs the client tool
   before any reply that says "not found" or "could not read" is a rule on WHEN she is searched, not a guard on a sentence (R-45.33 permits
   it); its shape (a forced first round, or a rejected reply that names an absence with no read behind it) is ASK-3's read-first.
   The four live replies join the bank as hand labels.
2. "What was the last invoice raised": no tool reads invoices by the date raised; owed, paid and due read by state and window. The agent
   reached for events with kind "invoice" and wrote "do not show invoices in the Calendar", a sentence about the wrong table. A tool
   (invoices, newest first, with number, client, total, state) or a rule that an invoice question never reads events.
3. F-44.211 (ELZ-3): the ear's routing of "owed to me in total" (whatsdue on the app, tally on WhatsApp); the agent answers rightly either
   way, so the miss is the door's line when the lane is off, and a cost when it is on (the ear's turn is spent before the agent's).

## 6 · Config, findings and numbers of this seat

- K11, live: Railway's deploy log at 18:57:49 IST announces `role=donna provider=deepseek model=deepseek-v4-flash transport=facade`. The
  retired name is what production runs for the donna role; ASK-3's config item with DeepSeek's probe and live under the current name.
- F-44.209 (docs gap: the Victor guard's rulings have no single home; R-44.29 nowhere) and F-44.210 (cured in 2a) minted this seat;
  F-44.211 minted by the chair.
- e-198 (the B69 card line), e-199 (:141 for :174, a filtered sed window), e-200 (block F's comment claimed A-46.4 and its command did
  not; r2 carried the fix) are this seat's.
- The prefix note: 6,191 live against 6,530 probed at 1d.
- Cost of the sitting's live turns: Rs 15.29 (app Rs 7.82, WhatsApp Rs 7.47), all on claude-haiku-4-5-20251001, cache read on every
  agent call after the first.

## 7 · State at handover

Both keys true. The disarms (C2-3, C3-3) in the founder's hand, run only on the chair's word. The tree needs nothing from this seat for
either lane to stay on. Cut 4 (lookupDoor's question branches and B86/B87 retired, their rungs re-pinned by label) is ASK-3's, after the
search-first rule; the WhatsApp lane's unscrubbed path is read and proven harmless on twelve, the residual (a vendor's own note text)
named.
