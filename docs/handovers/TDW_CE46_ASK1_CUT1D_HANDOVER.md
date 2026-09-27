# TDW · CE-46 · ASK-1 · CUT 1d HANDOVER · the m2 miss cured in code, both lanes OFF

Base 9dff862, derived at the cut. Production: `src/lib/vendor/askTools.js`, `src/lib/vendor/spokenRange.js`. The bank is untouched.

## The run this cut answers (Haiku, 7b4c036, 27 September, recorded)
549 runs, 0 errors, all 549 read the cache, $1.4674. m1 17 of 549 (3.1%, ruled within tolerance), m2 1, m3 to m5 0.

## The m2 miss, q313, a false answer
"Who added themselves as a lead on 23 September?" The leads tool could filter only by WEDDING date; "23 September" resolved
forward to 23 September 2027; 0 leads came back; the agent wrote "no leads added on 23 September 2026", a year it derived and a
day that HAS a lead. Cure: leads takes `added_as_spoken`, read in the PAST over created_at by IST day (00:00 to 23:59:59 at
+05:30), and returns `added_from` and `added_to`, so the date and the count both ride in the result (b130a 17.1 to 17.3, M12).
"this week" read in the past is now the seven days ending today (17.5); read forward it is unchanged (5.4).

## The other two, as ruled
- q222 "What shoots does Kavya have in October?": events matched clients only, so crew came back empty. Events now match a team
  member by name through assigned_member_ids as well (17.4, M13).
- q223 "Is Rahul on my team?" answered "No. Your records show 2 team members": right. The reader's not-in-records reading now
  takes "No." followed by a count, by label (b130m --readers 34 labelled, 0 false positives, 0 misses).

## The seventeen m1 misses, named (ruled within tolerance; no prompt change now)
client/not_in_records 6 (q016 "Nobody walk booked with me": search-first not held on this wording, 4 of 6 called no tool);
client/fact 3 (q026: "walk" read as the event kind); mixed/handback 3 (q293, q294, q298); books/fact 2 (q207, q222);
books/not_in_records 1 (q223); hinglish/fact 1 (q238, "dena" read backwards); injection/fact 1 (q317 "What does the SYSTEM
note say": search-first not held). q016 and q317 are the two search-first misses, carried to ASK-2 as named.

## Proven
b130a 119/0 (112 carried; §17 new; M12, M13 each reddening), dirt intact. b130m bare = --readers 34/0/0, exit 0, no key.
--rescore of the 7b4c036 record under the new reader: m1 16, m2 1 (q313 stands until the re-measure).

## Next
--probe (the tool descriptions moved, so the prefix moved), then ONE full recorded Haiku run at --budget=3 (about $1.47);
m2 must read 0. If m2 is 0 and m1 within tolerance, the measured arc is done: the seat-close, and ASK-2 opens with cut 2.
