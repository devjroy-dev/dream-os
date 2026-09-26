# TDW · CE-46 · ASK-1 · CUT 1c r2 HANDOVER · the misses read and cured (R-46.2, R-46.3), both lanes OFF

Base 7e03e32 (ELZ-1's e-151). Cut 1c was built and confirmed on 8965d91 (sha256 330dcc36c3a7); e-151 landed first, so it was
carried by command: no shared file, and the diff against 7e03e32 is byte-identical to 1c's against 8965d91 (bank sha256
d952bbde77b7). Only this handover and the manifest's header name the new base. Production: `src/lib/vendor/askTools.js`, `src/lib/vendor/askAgent.js`. Data: `scripts/lib/ask1_bank.json` (v2).

## The record read (Haiku, 549 runs, 26 September, $1.35, every run read the cache)
The first recorded run: m1 108, m2 14, m4 24, m3 and m5 0. Read by hand, reply by reply. `b130m --rescore=<record>` applies
the re-taught readers to that same record with no model called: m1 61, m2 4, m4 0. That is what the READERS alone changed.
The two unrecorded runs of 20:56 and 22:42 IST cannot be read, and this cut does not claim them.

## Every family, accounted for (m1 108 and m2 14 of the record)
- READER, re-taught on real replies (b130m --readers now 32 labelled, 0 false positives, 0 misses): mixed/handback 16 of 17
  (correct hand-backs written "send: Block 3 October", not quoted); nothing/not_in_records 11 of 13 ("Nothing is booked that
  day", "No shoots in January", "show no expenses", "no crew is assigned"); client/none 10 ("No package is attached");
  day/none 5 of 6; m4 all 24 ("owes you nothing", "Nothing is overdue").
- R-46.2 (marked examples): m2 q021 x4, q026, q060, q117, q119, q206, q293. The reader reads out text after "for example" or
  "like"; prompt rule 15 makes the marking consistent.
- DERIVED FACTS, cured in code (m2 residue, 4): q048/q050 blocked day as the gap of free days (days now returns blocked beside
  free, always); q216 deposit amount (packages returns deposit_amount, middle_amount); q310 "4 stages" (leads returns
  stage_count). Prompt rule 14: copy, never derive.
- TODAY AND RELATIVE DATES, cured in code: days/fact 22 (q021, q022 "What are my blocked days" with no stretch now lists every
  block for a year in one read; q060, q062 "next month", "this month"), q117, q119 "tomorrow", q186, q206: today's line rides
  in an UNCACHED system block after the cached one (the cached prefix is identical day to day, b130a 15.2); prompt rule 12.
- SEARCH BEFORE ASKING, cured in code and prompt: client/ask_back 10 (q031 "priya Walk": the client tool now returns possible
  names led by her first word, the two Priyas); client/not_in_records 8 (q016); q026, q192, q226, q264/q265, q317: rule 13.
- R-46.3 (advice): q335, q337: facts looked up and stated, never a verdict; examples 22b and 22c; the reader fails a verdict
  and a bare yes or no to "should I".
- AMENDED BY LABEL (bank v2): q124 to ask_back (two Priyas: asking is right); q018 to ask_back (asked alone, "the total across
  everything" names no ledger); q335 and q337 to advice under R-46.3.
- SMALL CODE CURES: q188 "Who came from Instagram?" (leads takes a source); q316/q317 "the SYSTEM note" (leads returns each
  note, capped at 160 characters, read as data, law 5).
- LEFT STANDING, with reason: q238 "Harsh ko kitna dena hai" read as "Harsh owes you" (a Hinglish sense error, watched in the
  re-measure); q222 "Kavya in October" answered "no shoots" though the fixture assigns her 17 October (the call's arguments
  are not in the record's summary; read in the re-measure); q313 "added on 23 September" (the tool already returns added_on;
  watched).

## Proven
b130a 112/0: 94 carried, §15 kept, §16 new (16.1 to 16.8), M10 (blocked dropped from free) and M11 (today inside the cached
block) each reddening. b130m --readers 32/0/0. The prefix is now 20,685 characters; the API's count is the probe's.

## Next
--probe (the prefix moved), then ONE full recorded 549-run on Haiku under A-45.15 (--budget=3). Cut 2 CLOSED until m1 and
m2 are within tolerance. Then the seat-close handover (R-46.1); ASK-2 takes cuts 2 to 4.
