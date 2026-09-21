# repo: dream-os @ 57a94c89b97e8deae5974220fb5361f2dcb385b9 · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307 (untouched)
# TDW · CE-44 · SEAT LCV-9 · PART ONE · THE WALK RECORD AND SEAT CLOSE · 2026-09-21 IST · DOCS-ONLY (C-44.1)
# Every turn in §3, and every HEARD request quoted in §4 to §6, was written into this file BY SCRIPT from the founder's own
# export (Supabase CSV, 26 rows, sha256 f2dea542bc1c839fe31cc5796ff0ab873e3a425cfa2b3ec381ea8d6254c922b8), never retyped. The script asserted, and would have stopped otherwise:
# rows pair as user then assistant; turns 1 to 12 carry answered_by_code true; tool_calls is null on all 13; the lanes read
# pwa on turns 1 to 10, whatsapp on 11 and 12, none on 13. Times are UTC as the rows carry them; IST is UTC plus 5:30
# (15:15 UTC is 8:45 PM IST). "⏎" marks a line break inside one message. Nothing here is runnable.

## 1 · WHAT LANDED

LCV-9 Part One, THE CHAIN LEAVES THE WORKING ROOMS (R-44.37), landed at 57a94c89b97e8deae5974220fb5361f2dcb385b9 on 21 September
2026. The chair derived it: sixteen paths changed, all sixteen byte-identical to the ZIP it confirmed (TDW_CE44_LCV9_PART1_r2.zip,
sha256 5090daf605ec…; cmp, 16 of 16). The founder ran the four blocks: his floor ended "FLOOR = NAMED BASE, no delta (refusals,
not in base: 4)", his push read 10d5d99..57a94c8, and Railway read ACTIVE on that commit before he walked. He walked it the same
evening in the app's business chat, on WhatsApp from 9888294440, and on the Advisor page. The design, the bytes, the benches and
the differential are in TDW_CE44_LCV9_PART1_HANDOVER.md; this file is what happened live.

## 2 · THE FIXTURE SELECT AND THE EXPORT, AS RUN

Both statements passed the chair before he ran them (the card, sha256 8ceb535037e6…). The fixture SELECT:

    select 'control: DEV440 exists (expect 1)' as what, count(*)::text as value from public.vendors where routing_handle = 'DEV440' union all select 'the switch row (expect 0: absent means only code speaks)', count(*)::text from public.admin_config where key = 'vendor.working_chain_enabled' union all select 'live leads named Walk P8... (expect 0: the names below are fresh)', count(*)::text from public.leads l join public.vendors v on v.id = l.vendor_id where v.routing_handle = 'DEV440' and l.deleted_at is null and l.name ilike 'Walk P8%' union all select 'package: ' || p.name, coalesce(p.total::text, 'no fee') || ' · ' || p.delivery_basis from public.vendor_packages p join public.vendors v on v.id = p.vendor_id where v.routing_handle = 'DEV440' and p.deleted_at is null;

ITS ROWS, read by this seat from his screen of the SQL editor (a screenshot, not a CSV): control: DEV440 exists | 1 · the switch
row | 0 · live leads named Walk P8... | 0 · package: Pre wedding shoot | 50000 · on_the_day · package: Walk P7 Album | 25000 ·
handover · package: Photographs and film | 80000 · days. The switch row ABSENT is the default: chain out. Steps 9 and 10 of the
card needed no rewording.
The closing export, the chair's confirmed statement with its time literal set to 20:40 IST (e-59, §8):

    select m.created_at, m.meta->'listener'->>'lane' as lane, m.role, m.content, m.meta->'listener'->'request' as heard, m.meta->'listener'->>'door' as answered_by_code, m.tool_calls from public.vendors v join public.users pu on pu.id = v.user_id join engine.users eu on eu.auth_user_id = pu.auth_user_id join engine.agents a on a.user_id = eu.id join engine.conversations c on c.agent_id = a.id join engine.messages m on m.conversation_id = c.id where v.routing_handle = 'DEV440' and m.created_at >= '2026-09-21 20:40:00+05:30' order by m.created_at;

## 3 · EVERY TURN, IN ORDER (13 turns; "door" = answered by code)

 1. 15:15:30 HE: Hello
    15:15:30 door · lane pwa: I didn't catch a task in that. You can say things like: ⏎ Raise the invoice for the Bose wedding ⏎ The advance came in today for the Kapoor booking
    HEARD: {"acts":[],"route":"none"}
    TOOL CALLS: NONE (tool_calls is null)

 2. 15:15:39 HE: Yes?
    15:15:39 door · lane pwa: I didn't catch a task in that. You can say things like: ⏎ The advance came in today for the Kapoor booking ⏎ The Sharma booking is confirmed
    HEARD: {"acts":[],"route":"none"}
    TOOL CALLS: NONE (tool_calls is null)

 3. 15:15:52 HE: Block 20 March, personal
    15:15:53 door · lane pwa: I cannot do that by message yet. Use the app for it.
    HEARD: {"acts":[{"act":"block_date","missing":["year"],"date_as_spoken":"20 March","client_as_spoken":"personal"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

 4. 15:16:39 HE: What's due this week?
    15:16:39 door · lane pwa: I cannot do that by message yet. Use the app for it.
    HEARD: {"acts":[{"act":"whatsdue","date_as_spoken":"this week"}],"route":"search"}
    TOOL CALLS: NONE (tool_calls is null)

 5. 15:16:48 HE: Add a new lead Walk P8 Phone, 9876543210
    15:16:48 door · lane pwa: I cannot do that by message yet. Use the app for it.
    HEARD: {"acts":[{"act":"lead","amount_rupees":9876543210,"client_as_spoken":"Walk P8"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

 6. 15:17:33 HE: The booking is confirmed
    15:17:33 door · lane pwa: I didn't catch a task in that. You can say things like: ⏎ The advance came in today for the Kapoor booking ⏎ The Sharma booking is confirmed
    HEARD: {"acts":[],"route":"none"}
    TOOL CALLS: NONE (tool_calls is null)

 7. 15:18:16 HE: Raise the invoice for Walk P8 Nobody
    15:18:16 door · lane pwa: Could not make the invoice. No client called Walk P8 Nobody.
    HEARD: {"acts":[{"act":"invoice","client_as_spoken":"Walk P8 Nobody"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

 8. 15:18:31 HE: Add a new lead Walk P8 Fresh, wedding on 20 February 2027
    15:18:31 door · lane pwa: I cannot do that by message yet. Use the app for it.
    HEARD: {"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"},{"act":"book_event","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

 9. 15:18:42 HE: Attach Photographs and film to Walk P8 Frsh
    15:18:42 door · lane pwa: Could not attach the package. No lead called Walk P8 Frsh. Add the lead first.
    HEARD: {"acts":[{"act":"attach_package","client_as_spoken":"Walk P8 Frsh","package_as_spoken":"Photographs and film"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

10. 15:18:56 HE: Attach Photographs and film to Walk P8 Fresh
    15:18:56 door · lane pwa: Could not attach the package. No lead called Walk P8 Fresh. Add the lead first.
    HEARD: {"acts":[{"act":"attach_package","client_as_spoken":"Walk P8 Fresh","package_as_spoken":"Photographs and film"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

11. 15:19:44 HE: Send a message to walk test asking for the advance
    15:19:44 door · lane whatsapp: I cannot do that by message yet. Use the app for it.
    HEARD: {"acts":[{"act":"relay","client_as_spoken":"walk test"}],"route":"task"}
    TOOL CALLS: NONE (tool_calls is null)

12. 15:20:01 HE: How should I price my package
    15:20:01 door · lane whatsapp: I didn't catch a task in that. You can say things like: ⏎ Raise the invoice for the Bose wedding ⏎ The Sharma booking is confirmed
    HEARD: {"acts":[],"route":"none"}
    TOOL CALLS: NONE (tool_calls is null)

13. 15:20:50 HE: how shoud i price my package
    15:20:55 VICTOR (the Advisor room) · lane none recorded (not a door row): I need two things from you before I put a number on anything: what you're actually selling, and to whom. ⏎  ⏎ "If you're pricing your packages" — what packages? Full planning, partial, day-of coordination, design-only? And what does the Indian market look like around you — are you in a metro, a tier-2 city, or selling destination? Fee models split hard along all of that. ⏎  ⏎ Here's the honest spine of it while you get me those, because it's the part most planners get wrong: ⏎  ⏎ **Price the engagement, not the days.** A full-planning client who books you eighteen months out is buying hundreds of hours across design, vendor negotiation, budget control and two days of command. A day-of client is buying maybe twenty hours and one weekend of stress. If those two land in the same "package" range, you've priced your own time at zero. The number should track the *scope and risk you carry*, not a flat "our packages start at X." ⏎  ⏎ **The tier is the package.** Two families, one wedding — a fifty-lakh wedding and a five-crore wedding are not the same job, not the same vendor web, not the same reputational exposure. Your fee has to climb with the budget *because your liability climbs with it*. A percentage or a tiered flat that steps up with the event cost is the industry-standard way to do that; a single flat fee for every budget means the big weddings fund the small ones, and that's a losing position. ⏎  ⏎ **Own the line on commission.** This one bites harder than the headline number. Planners who quietly take a cut from vendors on top of the client fee are building a business that dies the day the family finds out — and they always find out. Either you're paid by the client, clean, and the number is honest and high; or you're paid by vendors and you disclose it in writing. Never both in the dark. Which model you pick changes what your package can cost, so pick it deliberately before you price. ⏎  ⏎ **Anchor on their budget's % of the whole, not a round figure you feel brave enough to say.** A planning fee that's a sane fraction of what the wedding costs *feels* right to the family; a number you pulled from vanity doesn't. And your pricing is also a positioning statement — price like a coordinator and you'll be treated as one no matter how good you are. ⏎  ⏎ So — tell me: ⏎  ⏎ - What scope are these packages (full / partial / day-of / design)? ⏎ - What's your market — which city, which budget tiers do you actually work at? ⏎ - Are you paid by the client, by commission, or both? ⏎  ⏎ Give me those three and I'll help you build the actual rate card — the tiers, the line items, and where the premium sits. And if anything here is worth keeping before we sharpen it, say so and I'll put it in your notes.
    HEARD: (none recorded: not the door's turn)
    TOOL CALLS: NONE (tool_calls is null)

WHAT HOLDS ACROSS IT: turns 1 to 12 are answered by code, tool_calls null on every one; NO ROW IN EITHER WORKING ROOM IS VICTOR'S,
and no reply claims work that did not happen. The lane of each message is in the door's own note (meta.listener.lane; e-55's
lesson applied): pwa on 1 to 10, whatsapp on 11 and 12. Turn 13, the Advisor page, reached Victor: lane none, door none. R-44.37
IS LIVE AND WITNESSED. B34 (turns 3, 4, 5, 8, 11), B15 (turn 7) and B32 (turns 9, 10) were spoken live; LEFTOVER with two of the
four covered examples on turns 1, 2, 6 and 12: each reply his line and two lines, every example one of the four, 3 distinct pairs over
the four draws (checked by the script).
HIS DEVIATIONS FROM THE CARD, recorded as his: turn 2 he typed "Yes?" where the card said "Yes", so the closed yes/no list did
not take it and the listener heard it (no act; the same reply by the other path). THE BARE-YES EXIT WAS NOT EXERCISED LIVE; b93
11.13 holds it. Turn 11 he used his own words, "Send a message to walk test asking for the advance". Turn 12 is not on the card: advice asked ON WHATSAPP met LEFTOVER,
which is correct under R-44.17 (no advice room on that lane, no advice classification); the founder has been told.

## 4 · F-44.110 (allocated by the chair): AN ACT THE LISTENER OVER-HEARS NOW REFUSES A COVERED JOB

TURN 8, his words: "Add a new lead Walk P8 Fresh, wedding on 20 February 2027". HEARD, verbatim from the row:
    {"acts":[{"act":"lead","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"},{"act":"book_event","date_as_spoken":"20 February 2027","client_as_spoken":"Walk P8 Fresh"}],"route":"task"}
A wedding date said with a new lead was heard as a SECOND act, book_event, for the same client on the same date. The whole-message
rule made the message MIXED; the door spoke B34 and filed no lead. The same sentence shape was heard as `lead` alone that morning
(TDW_CE44_LCV8_P6A2_WALK_RECORD.md §3, turn 5). Code did what was ruled with what it heard; the rule is the defect now that the
chain is gone. CONSEQUENCE: turn 10's attach had no lead to land on and truthfully spoke B32. NO COVERED JOB WAS WITNESSED END TO
END ON THIS WALK; the card's steps 8 and 10 are owed a re-walk on the next cut's card.
THE CURE, ACCEPTED BY THE CHAIR, both halves, PART A of the next cut and LCV-10's: the listener's prompt byte (a wedding date said
with a new lead belongs to the lead); and THE MECHANISM, because a prose instruction is not one: a book_event whose client AND date
both repeat a lead act in the same request is not a second job and is dropped before the covered check, nothing else dropped, its
first cell the heard request above, byte for byte.

## 5 · B35's REACHABILITY (R-44.39), FROM TURN 6

R-44.39, as the chair recorded it. THE CHAIR'S PROPOSAL CAME FIRST, a question byte in B18's shape for a covered act that names no
client: "Which client? Say the name." THE FOUNDER, verbatim, 2026-09-21: "Yes to your recomendation". It is B35, his; `lead` keeps
B18. The floor had already run on Part One's bytes, so B35 did not touch Part One; it rides Part Two with B31, B33 and the door's
own note.
TURN 6, his words: "The booking is confirmed". HEARD, verbatim: {"acts":[],"route":"none"}
The sentence B35 was written for was heard as NO ACT, not as booking_confirmed with no client. LEFTOVER was the right byte, reached
through case (i) and not through the covered-act-with-no-client branch. Unless the listener's description says a job said without
a name is still a job, B35 IS UNREACHABLE LIVE FOR ITS OWN SENTENCE. That line rides Part Two with this sentence as the card's
specimen: c-44.44's check applied to what the ear RETURNS, not only to its slots (the chair's words, in LCV-10's kickoff).

## 6 · THE LISTENER'S OTHER SPECIMENS, CARRIED TO THE PACKET THAT TEACHES phone_as_spoken (they join F-44.105)

  · TURN 5, "Add a new lead Walk P8 Phone, 9876543210". HEARD: {"acts":[{"act":"lead","amount_rupees":9876543210,"client_as_spoken":"Walk P8"}],"route":"task"}
    "Phone" was dropped from the name "Walk P8 Phone", and the number was put in amount_rupees. The door's own phone guard decided
    the turn (B34, nothing filed), as built.
  · TURN 3, "Block 20 March, personal". HEARD: {"acts":[{"act":"block_date","missing":["year"],"date_as_spoken":"20 March","client_as_spoken":"personal"}],"route":"task"}
    "personal" was put in the client slot. Harmless here: block_date is uncovered and the turn read B34.

## 7 · A CANDIDATE RAISED AND WITHDRAWN, AND WHAT HE DID NOT REPORT

From his screen of the Advisor page, before the export existed, this seat raised a conditional candidate: a LEFTOVER reply sat
above Victor's answer on /vendor/advisor, and if that first message had been typed in the Advisor's own bar it would have meant
the page sent a message without room 'advisor'. THE ROWS EXPLAINED IT AND THE CANDIDATE IS WITHDRAWN: that reply is turn 12, a
WHATSAPP turn (lane whatsapp), shown on the Advisor page because both lanes and both rooms share one engine thread. The Advisor
page's own message, turn 13, carried its room and reached Victor. No finding.
NOT REPORTED BY HIM: the leads-list look after turn 5 (the export shows no tool call on that turn and no lead filed by the door);
the lead's page after turn 10 (moot: nothing attached).
OBSERVED AND FILED BY THE CHAIR TO P8, not this cut's: at turn 13 Victor asked "what packages?" on an estate that holds three and
named planner services to a photographer; R-44.19's read of her estate is not built.

## 8 · THIS SEAT'S ERRORS SINCE THE HANDOVER, WITH THEIR CAUSES (e-56 to e-58 are in the handover)

  e-59 · the closing export reached him with its time literal at 21:00 IST and an instruction to edit it; he ran it as given after
    walking at 8:45 PM and got no rows. Cause: a value left for him to fill in by hand, where C-44.8 asks for the exact thing. The
    re-issue set it for him, the time literal alone changed.
  e-60 · the card's fresh name "Walk P8 Phone" carried a word with a meaning inside its own sentence, and the listener dropped it.
    LCV-8's record warned of exactly this. Cause: the lesson was read for event words and not applied to the general case. The
    chair's rule, in LCV-10's kickoff: A FRESH NAME CARRIES NO WORD WITH A MEANING OF ITS OWN.

## 9 · FOR LCV-10, AS THE CHAIR RULED IT

PART A, first: F-44.110's cure (§4). Then PART TWO as LCV-9's kickoff had it: the door's own note for B18, B24, B26 and B31
(F-44.104); B31, B33 (reuse of dreamos-pwa lib/worklist/packages.ts:116) and B35 (R-44.39), with the listener's line that a job
said without a name is still a job (§5); the lead resolved before the package (F-44.107); F-44.105's description, with §6's three
specimens; F-44.108's sorted list; the P6a-2 handover's addendum. THE RE-WALK OWED: a lead with a wedding date filed by message,
then a package attached to it, end to end. F-44.109 is P7's. handResult.js's DOOR_LINE_KEYS is the last packet's tidy-up.
THE SWITCH: admin_config `vendor.working_chain_enabled` is ABSENT on production, which is chain out; only JSON true brings the
chain back, within 60 seconds, with no deploy. The statement that sets it has not been written down anywhere and comes to the
chair if it is ever needed (C-44.10).
Next free: finding F-44.111, migration 0171, bench b94. Errors continue from e-61.

LCV-9 CLOSES HERE. It wrote code, delivered it, it landed, and it was walked.
---
A PROSE INSTRUCTION IS NOT A MECHANISM. Trust evidence over narrative, including this file.
