# CE-46 · ELZ-3 · CUT 2 · F-44.181's CURE: THE DOOR-SIDE RELAY RULE · HANDOVER

Built on 1b8789f (cut 1 landed); carried once by command to f3aebab (ADS-1 cut 1e, six paths, none of this cut's) on the chair's word
of 29 September 2026. Landing under R-46.6 on the base the chair names, re-derived at the cut. Rung b142b (the b142 package).

## 0 · The ruling, and the shape that shipped

ELZ-2's m181 measured the ear hearing a short "tell {client} X" as a relay 40 of 160 times without the thread and 125 of 160 with it.
The chair ruled a door-side rule in code on 27 September 2026 (ELZ-3's read-first (iii)): a message OPENING with a relay verb followed by
a name matching her known clients is a relay by construction; "send" was dropped from the verbs (c5), so the verbs are tell, bata,
batao, message. The listener is untouched (W-1).

Shape (a), the hear skipped on a match, was built first and WITHDRAWN by the chair on 29 September after this seat's differential
showed its cost (K1): a relay beside another act ("Tell Asha Walk Fifteen the booking is confirmed", the chair's ruling 1, b101 5.8)
lost the other act silently, and a misspelled client skipped the one home's B36 offer (K2, b101 4.9). SHAPE (b''), as ruled and
shipped: the ear hears as today; when the message opens with a relay verb and names a live lead, and the heard request holds NO relay
act (nothing, another act, an error or a timeout), relay(that lead) is ADDED in front of every act heard; a heard relay of ANY name stays
exactly as heard. A request heard as nothing then carries a relay, so the cold second hearing (R-45.3) does not run: one call.

## 1 · What shipped (src/lib/vendor/workingDoor.js)

- relayRuleMatch(supabase, vendorId, message): the verb /^(tell|bata|batao|message)\s+/i; the words after it, the longest run first
  (three words down to one), key()-folded and stripped of edge punctuation, EXACTLY equal to a live lead's name (two rows of that same
  name reach planRelay's own B8); none, then her FIRST word against each live lead's first word, never under REHEAR_MIN_NAME (three)
  letters: one lead, that lead's full name; two or more, a pick in the date order (F-44.178); none, no rule. A failed read of her leads
  is no rule. TOTAL.
- preTurn: the match is taken on a turn answering no note and meeting no live money row; applied after the first hearing as above.
  A first-word tie speaks B8 (DL.twoClients through sameName) with a pick note { pick_kind: 'lead_first', lead_ids in the order shown,
  pick_name her first word, every act of the message, her original words (e-151) }.
- The pick answer: a lead_first pick is re-read by id still carrying the first word (pinnedLeadFirst; its read orders its filters
  differently from pinnedLead's so b132's M2 anchor stays unique) and re-asked from leadsFirstNamed.
- validNote keeps pick_kind 'lead_first' (before this fix the note was saved as 'lead' and her "2" read B3; b142b M9 pins it).
- The door's record (persistDoorTurn, meta.listener): a rule turn keeps what the ear heard (heard) and rule: 'relay' beside the request
  the door decided on. A chain turn's record is listenerDoor's (untouched) and carries the request only.

scripts/m181_ear_short_relay_measure.js · --rule: the same sixteen sentences x N read by relayRuleMatch over a leads double holding the
walk's clients; no model, no key; 160/160 read as a relay by construction, exit 0. Bare and --history still call no model and exit 0.

## 2 · Proof (this container, at f3aebab; npm ci, engine built)

b142b 43/43, on b103's harness carried byte for byte (C-44.3's PGRST116 double, the REAL preTurn, standIn, persistDoorTurn and relay
seat; only the two models are doubles; the ear double COUNTS its calls). §1 the match (fourteen cells: the three verbs, the longest run,
edge punctuation, the first word, the tie, the same full name twice, his control "tell me who owes me money", a pronoun, "send", a verb
not first, a bare "tell sarah", a deleted lead, two-letter names, a failed read). §2 the door: LCV-11's seat-close records VERBATIM
(16:12:58 "Tell Sarah thank you" and 16:01:48 "Tell Sarah we are free on 22nd", both heard {"acts":[],"route":"none"} in a long thread)
now read B37 on ONE call with the record keeping heard none and rule relay; m181's two classes BY SHAPE (its per-call jsonl lived in
the founder's /tmp and is not in the tree): "tell Sarah hi" as none, and "tell walk twin we're confirmed" as booking_confirmed, now
relay + booking_confirmed with the Walk twins numbered; the first-word tie and her "2"; ruling 1 both ways (2.9 heard relay + money act,
untouched; 2.9b heard only the money act, the relay added and the money act kept: the same frame and note); a heard misspelled relay
keeps B36 (2.10); the ear erroring still relays (2.11). §3 m181's sixteen sentences x ten: 160/160. --mutate inside the rung: eleven
mutations of production code, each reddening its named cell (the rule never applied; a heard relay overwritten; "send" back; the first
word removed; the tie not asked; edge punctuation not folded; the pick read by full name; the length guard dropped; validNote dropping
lead_first; the other acts dropped, which is shape (a)'s loss; the record forgetting what was heard).
BOTH WAYS: in a clean worktree of f3aebab b142b reads 11/43, the eleven green being the unchanged behaviours (1.7 to 1.10, 1.12, 1.14,
2.7, 2.8, 2.9 ruling 1 as heard, 2.10 B36, 4.1 W-1). Shifted clocks (C-44.13, a frozen Date at next-day IST, 31 December 2027 and
29 February 2028): 43/43 each.

THE DIFFERENTIAL: the 37 benches reading workingDoor.js against a clean worktree of f3aebab, engine built both sides, keys unset: exits
identical on all 37, reached cells 2420 = 2420, every log identical but for the worktree's path. Under shape (a) the same 37 read
2390 (b101, b103, b113, b114, b132, b95 red); under (b'') before the re-aims 2401 (b103, b132, b95).

Re-aimed by label (K3: the cells' mechanisms are unchanged; the rule now answers their sentences first):
- b103 (the cold second hearing): every sentence it sends is re-aimed in ONE place (turnSeq's REAIM) onto an opening the rule does not
  take ("Can you tell Sarah thank you"); the recorded HEARINGS replay verbatim as before; 1.5 reads the re-aimed user row. 42/42.
- b95 9.12 (M12): its anchor on validNote's return line gains the lead_first read. 75/75.
- b132 6.2 needed no edit: its M2 anchor collided with the first draft of pinnedLeadFirst's read, which now orders its filters apart.

## 3 · Findings

- F-44.231 (proposed; the chair mints): two acts naming ONE ambiguous name each ask B8, so the vendor reads the same numbered question
  twice, and no pick note is kept (the note is written only for a turn whose one line is B8), so her number is not read. Pre-existing
  for any such heard pair; (b'') makes it reachable ("tell walk twin we're confirmed" heard as booking_confirmed: relay + booking, both
  on the Walk twins). b142b 2.4f records it as observed; not cured here.
- F-44.183 stands (a relay to an Instagram-only client cannot find its thread by counterparty_phone): the rule reaches Instagram leads
  by name, so the frame is asked; the send leg is that finding's.

## 4 · Disclosed

- The first build (shape (a)) is recorded above with its differential; nothing of it shipped but the match helper, the pick and the
  validNote fix, as the chair ruled.
- No paid run. W-1: listenerDoor.js unmoved (sha 293c4e577b43d9bb at 1b8789f and f3aebab); no soul, lens, engine or migration path.

## 5 · Open

F-44.230 (the prompt cache written every turn and never read across turns) and the price switch (0183, price_share_enabled) follow, in
that order, as the chair sequenced. F-44.170 (the callers' catches), e-159 (the probe) and the b117m channel replays on the chair's word.
The founder's walk after this lands: "tell Sarah hi" relayed; "Tell Asha Walk Fifteen the booking is confirmed" still asks the frame
with the booking act kept.
