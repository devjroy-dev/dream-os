# repo: dream-os @ 50300c4 · dreamos-pwa @ 320ad7e (untouched) · docs-only · TDW_CE45_LCV13_SEAT_CLOSE.zip
# TDW · CE-45 · SEAT LCV-13 · SEAT-CLOSE HANDOVER · LC-VICTOR P7 · 2026-09-23 IST

LCV-13 closes on the chair's word. It landed P7 cut 2b (e4a5c06), walked it green (record 50300c4), placed F-44.131, and read-first cut 3 (ruled, sha256 b968ee9c814b…).
Cut 3 and cut 4 go to LCV-14. The chair writes LCV-14's kickoff from this file.

## 1 · THE DOOR AT 50300c4
Covered by message on both lanes (workingDoor.js COVERED :120):
· the money acts: booking_confirmed, advance_paid, milestone_paid;
· invoice, lead, attach_package, relay;
· block_date, unblock_date, book_event (2a);
· edit_event and cancel_event (2b): asked YES or NO (B48, B50), a SHOOT note for two or more shoots (B53, K4), the 'cal_mixed' exit (a move or cancel beside another act reads B34).
The day sheet's spine lives in src/lib/vendor/daySheet.js readDaySpine (2b's relocation); day.js calls it.
LINES 58 in doorLines.js. B53's three-or-more form is R-45.9's derivation (shootsLine :394).
Not yet covered: assign_crew and payment_reminder (cut 3); the lookups (find, whatsdue, date, and lead on route search), which read B34 until cut 4.
Sealed rungs at 50300c4, all green: b105 67 · b104 70 · b103 42 · b102 24 · b101 78 · b100 16 · b99 56 · b98 47 · b97 59 · b96 96 · b95 74 · b94 62 · b93 130 · b92 173 · b90 202.
The day.js readers b0457 (19) and b6_s2 (48) are re-aimed at daySheet.js.
Floor of record for 2b: "FLOOR = NAMED BASE, no delta (refusals, not in base: 4)", seat run 3 and the founder's block 2.

## 2 · CUT 3'S WRITTEN STATE: THE RULED READ-FIRST §0 TO §4, CARRIED WHOLE
### 0 · BOTH TIPS
dream-os main 50300c4 (the 2b walk record, docs-only over e4a5c06; workingDoor.js and every called file identical to e4a5c06) · dreamos-pwa main 320ad7e (unmoved).
Called files at their charter blobs, unchanged since 3af9a01: studio/team.js db8068f16788 · eventWrite.js c425bd543756 · paymentReminders.js 60ff12d09aa1 · reminders.js 909398ac3f6f.

### 1 · THE KICKOFF'S CUT-3 PARAGRAPH, RE-DERIVED AT 50300c4
workingDoor.js:
  CALENDAR_ACTS :117 · COVERED :120 (assign_crew and payment_reminder join here) · NEEDS_CLIENT :123 (payment_reminder already in it; assign_crew not, correctly) · HANDS :126
  NAME_ASKS :333 (MEMBER_ASKS ['B62'] sits beside it, its own list) · OFFER_ASKS :340 · ASKS :356 · validNote :379 · leadsOf :281
  the offer: offerFor :1350 fills the slot at :1356 by a two-way switch (package, else client); the B36 re-ask reads note.slot at :1230 the same way.
    'member' makes both THREE-way (member_as_spoken). This is the only in-place edit the offer needs.
  the lead's invoice reads :527 (id, invoice_number, state, deleted_at) and :1061 do not carry client_name, client_phone, client_id, which sendOneReminder needs;
    planReminder does its own read (invoices where vendor_id, lead_id, deleted_at null, state not cancelled: id, client_name, client_phone, client_id).
studio/team.js: the GET predicate :42–:50 (vendor_id, active true, deleted_at null) and the POST insert :118–:131, as stated.
eventWrite.js writeEvent :440: assigned_member_ids :447, validated :498–:512 ('One or more of those members are not on your active team.' :512); the current crew read :642–:645; patched :690; crew_confirmations upserted by the writer itself.
paymentReminders.js:
  CAP_KEY 'flag.payment_reminder_send' :57 · WINDOW_DAYS 3 :80 · plainWords :92 · sendGate :101 · sendOneReminder :315 · istDayISO :457
  the gate refusal :360, before the claim at :367; the claim-error return :391; "The reminder didn't go — try again." :425
reminders.js: the window :112–:113 (due_date from istDayISO(0) through istDayISO(WINDOW_DAYS)); 'A reminder has already been sent for this milestone.' :202.
The switchboard: public.capabilities (capabilities.js :49), row key 'flag.payment_reminder_send'. cap.on is status === 'on' (:139–:141).
  The template approval (isApproved) is recorded as already true (paymentReminders.js :14–:32), so THE FLAG ALONE decides the gate.

K2's two sentences, the card's expectation, chosen by the switchboard row:
  status not 'on'  → "Reminders are switched off for now."            (plainWords :94)
  status 'on', template unapproved → "This message is waiting on WhatsApp approval."  (:114)
  status 'on' and approved → the gate is OPEN and a real template goes to the client's phone (see §3, a stop).
  Either dark case writes NO payment_reminders row (refused at :360 before the claim at :367).

Copy inventory, zero new: B56, B57, B58, B59, B61, B62, B67, B68 enter doorLines.js (his); B60 carried, unspoken. B36, B3, B7, B76, B77 are already carried.
  REUSED from the room: reminders.js :202 and paymentReminders.js :425. Spoken verbatim, not bytes: the gate's reason_text and the four lowercase refusals.
  B61 for three or more takes R-45.9's derived form ("3 on your team are called {name}: … Say which one.").

### 2 · CARD 3, RECONCILED IN HIS WORDS
Against LCV-12's designs §3.6 and the estate 2b left. Walk Seventeen Alpha has ONE upcoming shoot, 22 November 2027 (the 8 January shoot moved, the 9 January cancelled).
Where the design and the tree disagree, the tree wins and the step says so.
 1  "Add Walk Seventeen Theta to the team"                         → "Added to the team: Walk Seventeen Theta."
 2  "Add Walk Seventeen Theta to the team"                         → "Walk Seventeen Theta is already on your team."
 3  "Add Walk Seventeen Thta to the team"                          → "Did you mean Walk Seventeen Theta? Reply YES or NO."
 4  "No"                                                           → "Okay. Nothing was changed."
 5  "Assign Walk Seventeen Theta to the Walk Seventeen Alpha shoot" → "Assigned: Walk Seventeen Theta · Walk Seventeen Alpha · shoot · 22 November 2027."   (design: its 8 January shoot; the tree: 22 November)
 6  the same                                                       → "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot."
 7  "Assign Walk Seventeen Kappa to the Walk Seventeen Alpha shoot" → "Added to the team: Walk Seventeen Kappa." then, on its own line, "Assigned: Walk Seventeen Kappa · Walk Seventeen Alpha · shoot · 22 November 2027."
 8a "Assign to the Walk Seventeen Alpha shoot"                     → "Who? Say the name."
 8b "Walk Seventeen Theta"                                         → "Walk Seventeen Theta's already on the Walk Seventeen Alpha shoot."
 9a "Add Walk Seventeen Kappa to the team for the 22 November 2027 wedding" → "Walk Seventeen Kappa's already on the Walk Seventeen Alpha shoot."   (design: 8 January; RE-DATED to the tree)
 9b "Add Walk Seventeen Kappa to the team for the 8 January 2027 wedding"   → "No shoot on 8 January 2027."   (ADDED: the design's own date, now truthfully B77 on this estate)
10  "Send Sarah a reminder for the payment" → the switchboard row decides: "Reminders are switched off for now." (expected), or "This message is waiting on WhatsApp approval.";
    the export proves NO payment_reminders row for Sarah's milestone. If the fixture shows the flag 'on', the card STOPS here (§3).
11  "Remind Walk Seventeen Alpha about the advance"                → "Nothing is due from Walk Seventeen Alpha."
12  In the app: Studio → Team shows Walk Seventeen Theta and Walk Seventeen Kappa; the day sheet for 22 November 2027 shows both on the Walk Seventeen Alpha shoot.   (design: 8 January; the tree: 22 November)
All steps in the app lane. No WhatsApp step: F-44.131's lane is back, but cut 3 adds nothing lane-specific.

### 3 · THE STOP, RULED BY THE CHAIR (23 September 2026) AND MADE A RULE
R-43.17 binds the walk. Step 10 runs only if the fixture shows the flag not 'on', or Sarah's invoice phone is 9888294440 or 8595356978; otherwise step 10 is SKIPPED on the walk,
the card says so, and the sent path stands on b106 over a fake transport. No walk ever sends a template to a phone outside R-43.17's two.

### 4 · THE FIXTURE READ, FROM PUBLIC_SCHEMA.md (capabilities :199, team_members :1324, events :716, leads :974, invoices :888, payment_schedules :1141, payment_reminders)
select 'control: DEV440 (expect 1)' as what, count(*)::text as value from public.vendors where routing_handle = 'DEV440'
union all select 'switchboard flag.payment_reminder_send (expect not on)', coalesce((select status from public.capabilities where key = 'flag.payment_reminder_send'), 'no row')
union all select 'team members named Walk Seventeen% (expect 0)', count(*)::text from public.team_members t join public.vendors v on v.id = t.vendor_id where v.routing_handle = 'DEV440' and t.deleted_at is null and t.name ilike 'Walk Seventeen%'
union all select 'Alpha live shoot ' || e.event_date::text || ' crew ' || coalesce(array_length(e.assigned_member_ids, 1), 0)::text, e.state from public.events e join public.vendors v on v.id = e.vendor_id where v.routing_handle = 'DEV440' and e.deleted_at is null and e.kind = 'shoot' and e.state = 'upcoming' and e.title = 'Walk Seventeen Alpha'
union all select 'Sarah live invoice ' || i.invoice_number || ' phone ' || coalesce(i.client_phone, 'none'), i.state from public.invoices i join public.leads l on l.id = i.lead_id join public.vendors v on v.id = i.vendor_id where v.routing_handle = 'DEV440' and l.name = 'Sarah' and l.deleted_at is null and i.deleted_at is null and i.state <> 'cancelled'
union all select 'Sarah pending: ' || s.milestone_label || ' Rs ' || s.amount_due::text || ' due ' || coalesce(s.due_date::text, 'none'), s.id::text from public.payment_schedules s join public.invoices i on i.id = s.invoice_id join public.leads l on l.id = i.lead_id join public.vendors v on v.id = s.vendor_id where v.routing_handle = 'DEV440' and l.name = 'Sarah' and i.deleted_at is null and i.state <> 'cancelled' and s.state = 'pending'
union all select 'Alpha live invoices (expect 0)', count(*)::text from public.invoices i join public.leads l on l.id = i.lead_id join public.vendors v on v.id = i.vendor_id where v.routing_handle = 'DEV440' and l.name = 'Walk Seventeen Alpha' and i.deleted_at is null and i.state <> 'cancelled'
union all select 'payment_reminders rows on Sarah''s milestones (before)', count(*)::text from public.payment_reminders r join public.payment_schedules s on s.id = r.milestone_id join public.invoices i on i.id = s.invoice_id join public.leads l on l.id = i.lead_id join public.vendors v on v.id = s.vendor_id where v.routing_handle = 'DEV440' and l.name = 'Sarah';
(payment_reminders.milestone_id: the claim's own column, paymentReminders.js :371; its UNIQUE (milestone_id, kind) is named at :283.)


## 3 · CUT 4'S POINTERS
· The design: the kickoff's §2, paragraph "CUT 4 · THE LOOKUPS" (TDW_CE45_LCV13_P7_KICKOFF.md), and LCV-12's designs file §4.1 to §4.5 (sha256 05b449610210…, the founder holds it).
· K3's ruling (23 September): src/lib/vendor/leadFeed.js takes the lead-feed query byte-preserved (worklistToday.js :254 to :259 at 3af9a01; NOT :242 to :247, which is comment) AND LEAD_FEED_SELECT (:195) and KIND_CAP (:173), names unchanged. worklistToday requires them back and re-exports LEAD_FEED_SELECT at :512 unchanged. The Promise.all element becomes newLeads(supabase, vendorId), returning the UNAWAITED query so rows() sees the same shape. b39 and b41 read whole. A lib never imports from a router.
· Availability reads 2b's readDaySpine(supabase, vendorId, date) → { ok, events, blocks }; each block carries reason from notes (daySheet.js). B72's "{date}: blocked — {reason}." reads block.reason.
· The route-search gate of 2a (standKeyOf: 'lookup' → B34) becomes the lookups' door. The 'cal_mixed' exit stays B34.
· Lesson from 2b's differential: benches that assert a relocated file's SOURCE go red; 97 by path shape found b0457 and b6_s2. Run the differential BEFORE the floor.

## 4 · F-44.131, CLOSED BY THE CHAIR
A Meta-side delivery outage for the vendor PNID 1197664646766743. At the shared receiver, the last vendor-PNID event was 03:23:34.357Z (08:53 IST); the next was 08:01:42.063Z (13:31:42 IST).
The bride PNID kept delivering through the gap. No callback, token, subscription, variable or code changed. The full reading sequence is in TDW_CE45_LCV13_P7_2B_HANDOVER.md §8.13.
Estate facts learned:
· Meta's callback is dream-os-marketing (the shared receiver, src/marketingIndex.js), which forwards the vendor and bride lanes with x-internal-replay. It must NOT be repointed.
· It deploys from the same repo and branch as dream-os, so every push to main redeploys it.
· A vendor WhatsApp text turn prints NO "[model] surface=" line (that line is the app lane's, chat.js :3247). Search the receiver's "forwarded vendor change" and dream-os's "[whatsapp:out->meta]" lines instead.
Context, not cause: Meta's WhatsApp Business terms took effect 23 September. Service messages are billable from 1 October; a payment method on the WABA is the founder's to confirm in Business Suite.

## 5 · RECORDS
· P7 listening table: scripts/out/p7_ear_check.csv, sha256 f563b33daa3705403153a8769c0baafafd29d2d380f6730483c2dfc1f82b168e (72 rows).
  Git-ignored, so NOT in the tree; the founder keeps it in his Codespaces checkout under scripts/out/ and attaches it to each seat that replays it (C-44.12). Verify the hash before any cell replays a row.
· LCV-12's designs file: TDW_CE45_LCV12_P7_DESIGNS_FOR-THE-CHAIR.txt, sha256 05b449610210333f45b57acc88845a6377368426e18077517bbd9cffe56d2252 (the founder holds it).

## 6 · THIS SEAT'S ERRORS, FOR THE CHAIR TO MINT
· The 2b manifest count reported as "21 paths"; it is 20. Corrected at attach and in the 2b handover line 1.
· A comment misplaced in standKeyOf after floor run 1 (the F-44.128 comment moved onto the new cal_mixed line). Corrected; the floor was re-run rather than claimed; run 2 died with the turn; run 3 is the floor of record.
· "surface=whatsapp" handed to the founder as an F-44.131 search; that line is never printed for the WhatsApp lane. Its empty result was recorded as void and corrected with him.
· Two F-44.131 suspicions raised and withdrawn on the evidence: the 23 September terms, and business-scoped user IDs.
· K5's first derived form kept the word "Two" for three or more shoots. Caught by the seat before any walk; ruled as R-45.9.

## 7 · NEXT FREE
F-44.132 · migration 0171 · bench b106 · errors e-83 · corrections c-45.11.
