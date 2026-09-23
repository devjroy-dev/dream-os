# repo: dream-os @ 23780ed (base) · dreamos-pwa @ 320ad7e (untouched) · delivery TDW_CE45_LCV14_P7_4.zip · manifest scripts/floor-manifest-lcv14-p7-4.txt (20 paths)
# TDW · CE-45 · SEAT LCV-14 · LC-VICTOR P7 CUT 4 · THE LOOKUPS · rung b108 · 2026-09-23 IST

Line numbers derived by command at the cured tree on the day of writing; re-derive before citing. The design is the LCV-13 kickoff's cut-4 paragraph as the
LCV-13 seat close §3 restates it, LCV-12's designs file §4.1 to §4.5 (sha256 05b449610210…), K3, Q1, F-44.129, R-45.11 and the chair's ASK 7 of 23 September.

## 1 · WHAT A VENDOR CAN NOW ASK BY MESSAGE, ON BOTH LANES (read only; nothing is written, nothing is asked back)
"Who are my new leads?" · "Am I free on 14 February?" (any day) · "What's due this week?" · and "How much is owed to me?", which the ear hears as what's due
(R-45.11's table below) and so answers with the week's lines. "What happened with Sharma" (history), a total (tally), and any lookup naming a client still read B34.

## 2 · R-45.11'S LISTENING CHECK (the founder's one run, 23 September 2026, supervised; NOT committed)
scripts/lib/p7t_ear_check.js (sha256 b30495c1751a…, confirmed by the chair; placed by the hash gate, run, removed, the tree clean) on the SHIPPED ear at 23780ed
(EAR_TOOL 4a8cfbeb20de…, SYSTEM 90163dbe1889…), cold, two seats, as-is, four phrasings. Table scripts/out/p7t_ear_check.csv, sha256
19167fb8789d0a74951a943c4a6ca7c6405bfd3d7ba461edcc03db06af540c36: 8 of 8 whatsdue on route search, 0 tally. So tally stays B34 and "How much is owed to me?"
reads the week (F-44.129). No books reader is called; no tally line is owed from the founder. Keys: "yes · yes" before; deleted and restarted after (his
word); the "no · no" line owed from him and recorded when it lands.

## 3 · THE DESIGN AS BUILT
3.1 K3 · src/lib/vendor/leadFeed.js (new, 43 lines): KIND_CAP (its ceiling comment with it), LEAD_FEED_SELECT and the lead_unanswered query move from
    worklistToday.js :173, :195 and :254 to :259 at 23780ed; the query's four middle lines BYTE-PRESERVED (b108 1.4 pins their 23780ed text by sha256); one
    comment pointer adapted to name worklistToday.js as the connect-gate's home. newLeads(supabase, vendorId) RETURNS THE UNAWAITED builder.
    worklistToday.js requires { KIND_CAP, LEAD_FEED_SELECT, newLeads } (:166); the Promise.all element is newLeads(supabase, vendorId) (:239); the re-export
    of LEAD_FEED_SELECT is unchanged (:492). A lib never imports from a router. b39 and b41 unmoved by the relocation.
3.2 src/lib/vendor/dueWeek.js (new, 43 lines): dueThisWeek(supabase, vendorId, nowMs). The week is today through today plus six, IST (istClock.js :59, :64),
    from the door's nowMs. Pending milestones in the room's own select (reminders.js :104 to :110); client_name in ONE batched invoices read (:84 to :88);
    upcoming shoots in the window; both by day. The window is applied to the returned rows too. A failed read is { ok:false }.
3.3 workingDoor.js: LOOKUP_ACTS ['find','whatsdue','date'] (:126), deliberately NOT in COVERED (a lookup is never a job). lookupDoor (:1014) behind the
    route-search gate (:1679, `return (await lookupDoor(...)) || CHAIN(st.ear, 'lookup')`), ONE act only:
      whatsdue with no day or "(this) week" → the week (B73 per milestone, B79 per shoot; none B74);
      find, whatsdue or date WITH a day → availability via readDaySpine (B72 per block, B78 per booking; none B71; an unreadable day B7, NO note);
      find with no day, or lead with no client (P7 row 13 C1, F-44.128) → the new leads (B69, at most KIND_CAP, oldest first; none B70);
      a client named, tally, history, two acts, date with no day → null, so B34 through 'lookup' (standKeyOf :2003);
      a failed read → 'lookup_unsayable' (the glitch line), never an empty answer (C-44.4).
    Seams: readDaySpine, newLeads, dueThisWeek, kindCap. standIn's leftover pool is COVERED plus LOOKUP_ACTS (:2023), so LEFTOVER examples 3, 7 and 8 switch on.
3.4 doorLines.js: the eight bytes and newLeadsLine (:482), dayLines (:493), weekLines (:512).

## 4 · THE BYTES (his, 22 September 2026, "All proposed lines accepted"; extracted by script from the designs file; LINES 67 → 75, c-45.13 the chair's count)
B69 "New leads: {name} ({date}) · {name} ({date})." · B70 "No new leads." · B71 "{date} is free." · B72 "{date}: blocked — {reason}." · B73 "Due this week:
{client} · {milestone} · Rs {amount} · {date}." · B74 "Nothing due this week." · B78 "{date}: {client} · shoot" (NO full stop, as he accepted it) · B79 "This
week: {client} · shoot · {date}.". ASK 7's SPLIT: the designs file carried B72 and B73 as two-form lines; each form is now its own hash-carried key (B72/B78,
B73/B79), so no byte holds two shapes. B77 carried since 2a.
DERIVED AND DISCLOSED: B69 for one lead, or three and more, extends by " · "; a lead with no date reads "{name}" alone; at most twenty are named (the 21st row
only detects the cap). B72 with no reason reads "{date}: blocked." (as B40's no-reason form); B72 speaks NO slot (a morning block reads "{date}: blocked."), as his
byte stands. B78 for a non-shoot kind places the row's own kind word (as B46's). The week's payments mirror the room's read and do not filter by invoice state.
"date" with no day reads B34 (a lookup keeps no note, so not B7).

## 5 · PROOF · rung b108 (scripts/b108_lcv14_lookups_bench.js), b107's harness carried (b106's and b105's under it; the PGRST116 double, C-44.3)
Cured 51/51, and 51/51 at 00:15 IST 24 Sep 2026, 29 Feb 2028 and 00:10 IST 1 Jan 2028; §4.4 drives the week across a year's end (29 Dec 2027) and a leap day
(26 Feb 2028) by the door's own clock. Base 23780ed: 13 passed, 38 failed, no crash (green by nature: the B34 cells 2.4, 3.5, 6.1 ×4, 9.5; 9.4 equal at the base
because both read B34; 7.4 the base never answers the day; 8.1 to 8.4 laws).
Records replayed verbatim through the REAL normaliseRequest: the P7 table (f563b33daa37…) rows 1, 13, 14, 15, 16; R-45.11's table (19167fb8789d…) rows 2 to 4.
Six mutations of production code, all reddening: the lookups' door removed; the client guard removed; the week's window off by one (dueWeek.js); the spine's
cancelled filter removed (daySheet.js); the failed-read guard removed (dueWeek.js); the cap removed. Laws: the money functions and the live-row block at their
f24ffd9 text; eventWrite, availability, lifecycleHands, paymentReminders, pendingMoneyActs, listenerDoor, daySheet, reminders.js and istClock.js byte for
byte their 23780ed blobs; the manifest. §9 is card 4 in his words.

## 6 · THE SEALED RUNGS RE-PINNED, each labelled at site
b90 211 → 219 (RULED gains the eight) · b93 132 → 133 (the 'lookup' row's specimen whatsdue → tally; a lookup_unsayable row ADDED; 3.2 22 reasons, 32 returns; 11.1
the stand-in's pool; 11.3 turn 4's hearing answered, not B34; the lane cells' 22 specimens) · b95 74 held (9.6 RE-AIMED, not a control: M6 unchanged and still
reddening 3.5; its lapsed turn, a `date` lookup on search, is now ANSWERED, "5 June 2027 is free.", where it read B34; accepted by the chair) · b104 70 held (3.1
and 3.2: row 13 reads the new leads, B69 or B70, never a job, never B18, no note, nothing written; 9.4's anchor, the new gate line) · b97 59, b98 47, b99 56,
b102 24, b103 42, b105 67, b106 80, b107 27 held (LINES 75; b106 6.3 worklistToday's blob moved by K3 alone; b107 4.3 doorLines' blob). b39, b41, b92, b94,
b96, b100, b101, b0457, b6_s2 unmoved.

## 7 · THE DIFFERENTIAL AND THE FLOOR
THE DIFFERENTIAL, IN SERIES, BEFORE THE FLOOR, one detached setsid chain: 144 benches (the path-shape set, now reaching worklistToday, leadFeed, dueWeek and
daySheet by name, and the symbol readers) at ONE base (a worktree at 23780ed, clean; a REAL node_modules copy; engine built; sibling pwa at 320ad7e), THEN at the
cured tree; git status before and after base 0, cured 20. 140 of 144 byte-identical after scrubbing; b108 only at the cured tree; b90, b93 and b104 differ only by
the re-pinned cells and counts (zero FAIL lines in any cured output); no exit code differs. Red at both trees with identical outputs, every one in
scripts/floor-base.txt or a refusal: b05_arc_m6, b05_f0550_ping_drain, b05_f0555_media_dedupe, b05_p4_crons, b06_meter, b07_f0772_circle_auth, b07_p4b_body,
b07_p5, b08_p5_oow_relay, b10_p3_mint_deck, b39_telemetry, b51_referrals, b59_g34_reminders, b59_mutations, b61_mutations; refused b06_gauntlet, b5_wa_door_smoke.
THE FLOOR OF RECORD: scripts/run-floor.sh --delivery scripts/floor-manifest-lcv14-p7-4.txt --check, whole, after the differential in the same chain. EXIT 0:
"FLOOR = NAMED BASE, no delta (refusals, not in base: 4)"; 22 RED and 1 ERROR (b5b_movementb), exactly floor-base.txt; refusals b06_gauntlet, b5_wa_door_smoke,
bf1_bride_tool_fidelity_bench, test-shape; "[F-14.16] --delivery mode: 20 dirty path(s), all declared" and "declared files unmoved — set and contents both
verified." Git status after: base 0, cured 20. This handover's path was declared before the runs and written after them (docs-only, read by no bench).

## 8 · CARD 4 AND THE WALK RECORD
Card 4 in his words: 1 "Who are my new leads?" · 2 "Am I free on 14 February 2027?" · 3 "What's due this week?" · 4 "How much is owed to me?" (the same answer as
step 3; R-45.11) · 5 "What happened with the Walk Seventeen Alpha booking?" → B34. The expected lines rest on his fixture rows, pasted before the walk.
The walk record: (written in by script after the walk)

## 9 · OPEN
F-44.134 and his surface points of 23 September for the app-side cut (R-45.10). F-44.135 (fileBook's coarse refusal label) rides the next cut that opens
fileBook. The "no · no" line after R-45.11's run, owed from him.

## 10 · NEXT FREE
F-44.136 · migration 0171 · bench b109 · errors e-91 · corrections c-45.14.
