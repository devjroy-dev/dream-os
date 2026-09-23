# repo: dream-os @ 7687acd (base) · dreamos-pwa @ 320ad7e (untouched) · delivery TDW_CE45_LCV14_P7_4_FIX1.zip · manifest scripts/floor-manifest-lcv14-p7-4-fix1.txt (19 paths)
# TDW · CE-45 · SEAT LCV-14 · LC-VICTOR P7 CUT 4 · FIX 1 · F-44.136, Q4, R-45.12, THE TALLY · rung b109 · 2026-09-23 IST

Line numbers derived by command at the cured tree on the day of writing; re-derive before citing. The rulings: the chair's F-44.136 (minted on cut 4's walk),
Q4, R-45.12 ("leads should be newest first"), the tally plan and ASKS 8 to 10 of 23 September; his bytes B80, B81, B82, B83 ("ill go with your recomendations", "ok").

## 1 · WHAT CHANGES FOR A VENDOR
"Who are my new leads?" names her five NEWEST named leads, newest first, and says how many more there are; leads saved with no name are counted on their own line
and never break the answer. "How much is owed to me?", when the listener hears a total, answers with what is owed across her open invoices.

## 2 · THE DESIGN AS BUILT
2.1 leadFeed.js: newestLeads (:47), the SAME select and predicate as newLeads, created_at DESCENDING, a ceiling NEWEST_CAP 500 (:46); newLeadsCount (:56), the
    head-count read only when the ceiling is met. newLeads (the app's feed, oldest first) is byte-preserved and unchanged; worklistToday.js is 7687acd's blob.
2.2 workingDoor.js lookupDoor, THE NEW LEADS (:1048): the door's own newest-first read; named = a non-blank name; the FIVE newest named, newest first, then " and {n}
    more." when more named remain (derived, disclosed); the nameless on their own line (B83 for one, B81 for two or more); only nameless → B81 alone; none → B70.
    The ceiling met → the head-count, the rows beyond counted as named (disclosed); the head-count failing → lookup_unsayable.
2.3 workingDoor.js lookupDoor, THE TALLY (:1067): act tally, route search, NO client → src/lib/vendor/invoices.js readOutstanding (:540, "the ONE derivation of what a
    vendor is owed") AS IT STANDS. B80 with {total} = summary.total_outstanding (Indian grouping) and {n} = its rows in OUTSTANDING_STATES ['unpaid','advance_paid'];
    a zero total → B82; a failed read → his LEDGER_UNREADABLE REUSED from its home (src/lib/victorLines.js :57, ASK 9). tally WITH a client stays B34.
    Seams (:175): newestLeads, newLeadsCount, newestCap, readOutstanding, outstandingStates. invoices.js and victorLines.js untouched.
2.4 doorLines.js: B80 to B83 (:201 to :207; hashes :313 to :316); newLeadsLine(leads, more) (:497); namelessLine(n) (:508). LINES 75 → 79.

## 3 · THE BYTES (his, 23 September 2026)
B80 "Owed to you: Rs {total} across {n} open invoices." · B81 "{n} new enquiries have no name yet. Add their names in the app." · B82 "Nothing is owed to you right
now." · B83 "1 new enquiry has no name yet. Add its name in the app." (B81's singular, its own key). REUSED: LEDGER_UNREADABLE, "I can't read your ledger this
minute, so I won't guess at what's outstanding. Ask again in a moment." DERIVED AND DISCLOSED: B69's tail " and {n} more."; the rows beyond the 500 ceiling counted
as named.

## 4 · PROOF · rung b109 (scripts/b109_lcv14_lookups_fix_bench.js), b108's harness carried (b107's, b106's and b105's under it; the PGRST116 double, C-44.3)
Cured 30/30; 30/30 at 00:15 IST 24 Sep 2026, 29 Feb 2028 and 00:10 IST 1 Jan 2028. Base 7687acd: 9 passed, 21 failed, no crash (green by nature: 1.3 and 6.1 to 6.4
laws; 2.5 and 2.6 unchanged by the fix; 4.4 B34 at both; 7.3 the week). His estate IN SHAPE (NULL and blank names; a shape, not his rows: e-91) reads five, the tail
and B81 where his walk read the glitch line; B83; nameless only; one; none; newest first; the 500 ceiling with a head-count of 540 ("and 535 more."); a failed
head-count; the tally over unpaid, advance_paid, paid, cancelled, deleted and another vendor's invoices ("Owed to you: Rs 1,20,000 across 2 open invoices."); zero →
B82; a failed read → LEDGER_UNREADABLE; a client named → B34; his live tally hearing → B80. Six mutations, all reddening: the order flipped (leadFeed.js); the
nameless split removed (F-44.136 undone); the singular dropped (doorLines.js); the zero branch removed; a failed read read as zero; the tail dropped. Laws: the money
functions and the live-row block at f24ffd9's text; invoices.js and victorLines.js at 7687acd's blobs; worklistToday.js unmoved; the manifest. §7 is card 5.

## 5 · THE SEALED RUNGS RE-PINNED, each labelled at site
b108 51 held (LINES 79; newest first in LEADS2, 2.2 and 9.1; 5.3 the five and the tail; 5.4's reader newestLeads; 6.1's tally specimen now names a client; 7.6 re-aimed
to the five) · b90 219 → 223 (RULED gains four) · b93 133 held (the 'lookup' row's specimen tally → history; 3.2 34 returns, no new reason) · LINES 75 → 79: b97 59,
b98 47, b99 56, b102 24, b103 42, b104 70, b105 67, b106 80, b107 27 (with doorLines.js's blob). b39, b41, b92, b94, b95, b96, b100, b101 unmoved.

## 6 · HIS ESTATE CLEARED (F-44.136's founder statement: "delete the old leads that are creating the issues")
The chair confirmed F44136_preview.sql (sha256 db5d9ce8b7bd…, read only) and F44136_soft_delete.sql (41262d25e34e…, guarded, C-44.11), rehearsed on a Postgres 16 plant
with a non-superuser BYPASSRLS editor. His preview (sha256 prefix b7b36233bd87): 12 nameless new leads, 5 CLEAN (1699c367, d79bf31f, d33fbda2, cb335e83, ab9cc2b6), 7
ATTACHED (c478dc0a, 490a2df3, 604f299b: lead_referrals; 985a7173, b1bfefa6, 73169025: lead_alerts and lead_referrals; 6cf78a54: lead_packages). He ran the confirmed
file WITH its guard first: "ERROR: P0001: GUARD: this file soft-deletes DEV440's nameless new leads. Delete this line to run it." (nothing changed, the guard
witnessed live). On his "give the block" the seat handed the confirmed statement with ONLY the guard line removed (the deliberate edit, on his word). His report:
nameless still live 7 · soft-deleted in the last 10 minutes 5 · named still live 33 (the file's label says "expect 34": e-91, the seat's miscount of 11 nameless
where the fixture held 12; 33 is right). The 7 ATTACHED stand; removing them is his to raise.

## 7 · THE DIFFERENTIAL AND THE FLOOR
THE DIFFERENTIAL, IN SERIES, BEFORE THE FLOOR, one detached setsid chain: 149 benches (the path-shape set, now reaching invoices and victorLines by name too) at ONE
base (a worktree at 7687acd, clean; a REAL node_modules copy; engine built; sibling pwa at 320ad7e), THEN at the cured tree; git status before and after base 0,
cured 19. 145 of 149 byte-identical after scrubbing; b109 only at the cured tree; b108, b90 and b93 differ only by the re-pinned cells and counts (zero FAIL lines in
any cured output); no exit code differs. Red at both trees with identical outputs, every one in floor-base.txt or a refusal (b10_p2_bridge newly in the set by name,
in floor-base).
THE FLOOR OF RECORD: scripts/run-floor.sh --delivery scripts/floor-manifest-lcv14-p7-4-fix1.txt --check, whole, after the differential. EXIT 0: "FLOOR = NAMED BASE,
no delta (refusals, not in base: 4)"; 22 RED and 1 ERROR (b5b_movementb), exactly floor-base.txt; refusals b06_gauntlet, b5_wa_door_smoke,
bf1_bride_tool_fidelity_bench, test-shape; "[F-14.16] --delivery mode: 19 dirty path(s), all declared" and "declared files unmoved — set and contents both verified."
Git status after: base 0, cured 19. Both handovers' paths were declared before the runs and written after them (docs-only, read by no bench).

## 8 · CARD 5 AND ITS WALK RECORD
On the CLEARED estate (33 named, 7 nameless), steps 1 and 4 of card 4 re-walked: 1 "Who are my new leads?" → the five newest named, newest first, and "and 28 more."
(33 named), then "7 new enquiries have no name yet. Add their names in the app." · 4 "How much is owed to me?" → B80 (or B82) when heard as tally; the week's lines when
heard as whatsdue. The exact lines are written from his card-5 fixture rows before he walks.
The walk record: (written in by script after the walk)

## 9 · ERRORS AND OPEN
e-91: the seat's count of 11 nameless leads (12). F-44.134 and his surface points for the app-side cut (R-45.10). F-44.135 for the next fileBook cut. The "no · no"
line after R-45.11's run, owed from him.

## 10 · NEXT FREE
F-44.137 · migration 0171 · bench b110 · errors e-92 · corrections c-45.14.
