# CE-46 · ELZ-3 · CUT 1 · THE VENDOR'S ALERT ON EVERY NEW ENQUIRY (R-46.5), F-44.228, THE Q7 BYTE, THE BRIEF'S CHANNEL WORD · HANDOVER

Built on 0ac1a01 (IGD-2 cut 2c); carried once by command to 7504315 (ASK-3 cut 5, ADS-1 cut 1, G6-3 cut three, WEB-1 cut 2 r5) on
the chair's word of 28 September 2026: no path overlaps by name; ownNumber/turn.js (G6-3) still sends result.vendorNotification
through the one door with an 'ownNumber:' ctx, and its new registered-vendor silence runs before any turn (no notice, as case 2).
Carried once more to 9d3d772 (WEB-1 cut 4) on 29 September: no path overlaps by name; b55 reads engine.js only for the renderer
guard, which this cut does not touch. Landing under R-46.6 after IGD-2's reviewer login and G6-4's backend half; re-derived at the cut. Ruled by the chair on ELZ-3's read-first (27 September 2026): R-46.5 shape A; the five cases
(1 first message per thread; 2 quiet time no alert; 3 STOP no alert; 4 the brief carries the channel word; 5 Q8 as one boolean);
F-44.228 cured here; the Q7 byte in its one home here; F-44.211 struck. W-1 lift: engine.js at the composition hunk and its helper only.
Rung b142. Findings: F-44.228 cured; F-44.229 named for G6-3; F-44.211 recorded moot. Errors: e-231, e-232 (§4).

THE COPY: the founder's words, verbatim through the chair on 29 September 2026: "we dont need to use the word couple", then "ok to
all" on rows 1 to 7; the phone always +91 and the ten digits grouped 5-5 (+91 96257 59924); row 8 ruled by the chair (the date line
alone, unchanged). No shipped line uses the word "couple" (b142 1.12 and 4.6c).

## 1 · What shipped

src/agent/engine.js and src/agent/coupleThreadFacts.js · R-46.5 under F-44.227 (the chair's rule of 28 September 2026, from G6-3's
production walk). Before this cut the turn composed a notice only on a capture and on EVERY message from a returning (named) client, so
a first DM that captured nothing alerted nobody and a named client's every message alerted again. Now, on every lane:
  1 per ENQUIRY at most two notices: the first-message notice and the capture notice (one message composes one notice: a capture on
    the first message sends the capture notice alone); a named client's later messages in the enquiry compose none, and the intent
    read (a model call) is skipped with them, so leads.intent_summary refreshes once per enquiry;
  2 an enquiry is a thread whose messages are no more than 7 days apart (opensEnquiry: no earlier row, or the newest earlier row more
    than 7 days old; FACT 1 now carries that row's time as lastPriorAt; a failed thread read opens nothing);
  3 every notice names its line. The founder's bytes (engine.js enquiryHead and formatPhone):
      row 1  New enquiry on TDW's WhatsApp from {phone}: "{message}"
      row 2  New enquiry on Instagram: "{message}"
      row 3  New enquiry on your own number from {phone}: "{message}"
      row 4  New enquiry from {name} on {line}. {summary}  (blank line)  Message: "{message}"
             fallback: New enquiry from {name} on {line}: "{message}"
      row 5  heads: New enquiry on TDW's WhatsApp from {phone}. / New enquiry on Instagram. / New enquiry on your own number from
             {phone}. then, unchanged, " {details}. Lead saved." and the enrichment block
    {phone} is +91 and 5-5 for an Indian mobile (12 digits from 91, or 10 digits); any other number keeps its digits behind a plus.
A date question inside an enquiry still reaches him as the date line alone (his answer is owed to the couple; the founder's row 8).
The date line's own bytes are unchanged. OWN_NUMBER_FIRST_ALERT = true (Q8). The six callers are untouched.

src/lib/vendorInbound.js · F-44.228 CURED. The TDW-link site (the fourth couple caller) sent the vendor's notice through sendWhatsApp
directly, outside the one door F-08.85's rider made for the other three (a shut 24-hour window threw there), with its own fallback
line for a turn that composed nothing. The fallback ("New enquiry via your TDW link from {phone}. I'm collecting their details now.")
is DELETED; the site calls sendVendorEnquiryAlert with the same quote its scrub uses (stripRoutingToken(body) || 'hi') as brideMessage,
ctx 'vendorInbound:notification(tdw-link)'. Four sites now call the door; nothing else does.

src/lib/webhookCore.js · the founder's Q7 byte (his yes of 27 September): GRACEFUL_TURN_LINE reads "Something went wrong on our side.
Please send that again in a minute." in its ONE home (:66); vendorInbound's catch, index.js's Instagram lane deps and every other
reader take the export. No em dash remains in it (R-45.30).

src/lib/vendor/enquiryAlert.js · case 4, the founder's row 6. When the window is shut and no name is on file, the approved brief's
{{bride}} ("It's from {{2}}") reads "{phone} on TDW's WhatsApp", "someone on Instagram" or "{phone} on your own number". The channel
comes from the ctx every site already passes ('igReply:…', 'ownNumber:…', else the shared line); the phone is read from the notice's
own head, which the turn composed in his form ("… from +91 96257 59924"). No caller byte moves. The template's vars and Meta's approval
are unchanged. ONE CASE OUTSIDE HIS TABLE: a notice with no head (the date line alone inside an enquiry, row 8) carries no phone, so
{{2}} reads "someone on TDW's WhatsApp" / "someone on your own number" there, his Instagram word carried across (b142 4.6b); put to the
chair.

## 2 · Proof (this container, built at 0ac1a01, re-run at 7504315; npm ci, engine built)

b142 40/40 at the cut; --mutate 17/17 (the composer dropped; F-44.227 (1) removed at the returning gate and at the composition; (2)
removed; the 7-day boundary taken early; (3) the line word dropped; the phone ungrouped; the capture head reverted; Q8 false; the first
line winning over a capture; lastPriorAt dropped from FACT 1; the TDW-link site back on sendWhatsApp; the dashed line; the bare
"a couple"; the brief's phone not read from the head; "couple" back in the Instagram brief word; the ctx read dropped), every file
restored by sha256. BOTH WAYS: in a clean worktree of 9d3d772 b142 reads 10/40, the ten green being the unchanged behaviours (the IG
capture head, whose old bytes equal his row 5; no "couple" at the base; the date line alone; the empty message; the shape; the
TDW-link ctx; index.js's export; the name winning the brief). C-44.13: under a frozen Date at next-day IST, 31 December 2027 and
29 February 2028: 40/40 each. The store double hands each read a fresh array (the turn's history read reverses its copy in place).

Re-pinned by label, the old bytes grepped across scripts/ first: b06_m3 §4.3 (the vetoed fallback retired from the fixed-string
list, F-44.228); b0607 A1.10, A1.11, A1.16 (four sites; scrubText(briefBrideWord(brideName …))); b135 3.10, 3.11 (the date line as the
notice's last paragraph on a first Instagram message), 2.4, 2.6, 3.5, 3.12 (the capture head and the named line naming the line,
F-44.227) and M3 re-aimed at the new head; b115 1.4 and 2.1 (runCoupleAgenticTurn re-pinned twice, 8abaa8fb82c9e574 to 301f2f5ea7dffd85
to 6979dc791efcc00c; the cap 880 to 920, the helpers outside the body). All four green at the cut.

THE DIFFERENTIAL: 106 benches reading engine.js, vendorInbound.js, webhookCore.js or enquiryAlert.js (radius by grep at the base), a
clean worktree at 0ac1a01 against the cut, engine built both sides, keys unset. Exits identical on all 106 after b115's re-pin; the
same 7 pre-existing reds both sides (b05_arc_m6, b05_p4_crons, b06_meter, b07_p5, b08_p5_oow_relay, b39_telemetry, b5b_movementb).
Reached-cell lines (A-45.12) 5284 at the base, 5312 at the cut: b142's 28. Output deltas attributed: b05_arc_m1, b5b_movementb and
b85_lc2_p5 print only the worktree's path; b0607, b115, b135 and b142 their labelled cells. AT 7504315, the carried tree against a
clean worktree of it: the two landed benches inside the radius (b137 67/67, b141 31/31) exit 0 with output identical both sides;
b142, b115 25/25, b135 38/38 (--mutate 52), b06_m3 32, b0607 74, all exit 0. AFTER F-44.227, the 29 benches reading engine.js,
coupleThreadFacts.js or enquiryAlert.js against the clean worktree: exits identical, reached cells 1277 = 1277, b08_p5_oow_relay and
b39_telemetry red both sides as before, output differing only in b0607, b115 and b135 (their labelled cells). ON HIS WORDS, at
9d3d772: the same 29 against the clean worktree, the same verdict (exits identical, 1277 = 1277, the same two reds both sides, the
same three labelled benches differing); b55, b44, b148 (WEB-1 cut 4) identical both sides.

The floor: the founder's block F under env -u ANTHROPIC_API_KEY -u DEEPSEEK_API_KEY (A-46.4), --delivery
scripts/floor-manifest-ce46-elz3-cut1.txt --check, the pwa sibling present with node_modules; its tail to the chair before block 3.

## 3 · Recorded, not built

- F-44.211 ("owed to me in total" heard whatsdue on the app lane, tally on WhatsApp): MOOT in production by the chair's word of
  27 September: both question-agent rows are ON (admin_config, 14:03 and 14:25 UTC), so money questions on both lanes reach ASK-1's
  agent and the door's lookup branch retires in ASK's cut 4. No cure; its two heard requests not needed. The door's own header
  (workingDoor.js lookupDoor) still records F-44.129's design ("How much is owed to me?" as the week's dues) for the branch's last days.
- F-44.229 (G6-3's, named by the chair; still open at 7504315 by grep): ownNumber/turn.js has no STOP or START branch; a couple's STOP to a vendor's own number gets
  a turn like any other text. The shared line matches the whole message (vendorInbound matchOptOutExact) and Instagram has IG-S1/S2.
- Case 2 stands as IGD-2's D4: during her quiet time no turn runs and no notice is sent on Instagram or her own number; the shared
  line has no quiet time (she does not reply there herself).
- The window-shut brief still carries a 200-character summary of her words with no channel word inside the summary; the channel word
  rides {{bride}} only.

## 4 · Disclosed

- e-233 (this seat, 28 September): a both-ways run stashed with -u, which took node_modules and left a stray scripts/b142.js from a
  mistyped copy; caught at §11 at once, the stray removed, the stash popped whole, b142 compared by cmp; the both-ways run redone in
  the clean worktree.

- e-231 (this seat, 27 September): a differential runner started detached died when the tool call ended (R-40.63's class, F-40.128);
  nothing lost, re-run in foreground slices.
- e-232 (this seat): one slice overran the 300-second cap during b90's 100-second cells; §11 at once, both trees clean apart from the
  declared set; b90 re-run whole on both sides (0/0).

## 5 · Open

Cut 2: the relay rule (before the hear, the synthetic hearing, tell/bata/batao/message, the name match, B8 on two), m181 --rule and
the C-44.12 replay cells. Then on the chair's word: F-44.170 (the callers' catches; the vendor's line his copy), e-159 (the probe's
count: tools plus system with a one-token message, on Sarah's live thread shape), the b117m replays on instagram and whatsapp_own
(Haiku first, cost first, records under scripts/records/). The Instagram walk after this cut lands: a first DM with no lead alerting him.
