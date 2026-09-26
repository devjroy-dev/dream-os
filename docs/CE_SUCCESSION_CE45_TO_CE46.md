cd /workspaces/dream-os && git pull --ff-only && test -f CE_SUCCESSION_CE45_TO_CE46.md && mv CE_SUCCESSION_CE45_TO_CE46.md docs/ && sha256sum docs/CE_SUCCESSION_CE45_TO_CE46.md && git add docs/CE_SUCCESSION_CE45_TO_CE46.md && git status --porcelain && git commit -m "CE-45 to CE-46 succession note: the founder's order of 26 September (the conversation layer first), R-45.23 to R-45.33, six seats open, LSP_5 reverted and parked, ASK-1's measured run in flight" && git push origin main && git log --oneline -1TDW · CE-45 → CE-46 · SUCCESSION NOTE · 2026-09-26 IST

**Read this whole file before ruling anything. Derive both tips by command before the first relay. The founder relays; the chair rules; seats cut; the founder applies, walks, pushes.**

---

## 0 · THE FIRST ORDER OF BUSINESS IS A CONTINUATION, NOT A DISCUSSION

**The founder's order of 26 September is binding and is the whole road.** He set it after LSP_5's walk, when the WhatsApp door answered "who are my clients" with the new-leads list and he wrote "VICTOR SPOKE INCORRECTLY AT TIMES BUT ATLEAST SPOKE." The order:

1. **THE CONVERSATION LAYER, one priority because it is one machinery:** WhatsApp (the vendor's conversation with TDW, and the vendor's own number), the Instagram webhook, and the app's chat.
2. **A close second:** Meta ads and posts, and filing every Meta permission they need (a seat ADS-1 to be chartered on his word; not yet chartered).
3. **Third:** the website builder and domain purchase.

Nothing outside these moves ahead of them. A seat mid-package finishes it first, then takes its next from this order. Six seats are live (§3); bring nothing new to the founder until each has finished what is in its hands.

**The design that governs priority 1 is R-45.33, his:** the vendor lane splits. ACTIONS (money, bookings, blocks, messages, crew) stay code-only with her YES, as the LC-Victor series built them. QUESTIONS go to a read-only agent over her records (ASK-1): facts by code through read tools, words by the agent, proof by replaying a question bank and counting misses. The same shape as R-45.26 (Eliza, the couple lane): facts by code, words by the agent, no guard that makes a sentence unsayable. Both are the founder's after discussion; do not reopen them.

**Five things he will ask about first:**
- ASK-1's measured run: his last Haiku --live (before the cache cure) ran 271 questions at ~$0.018 each and over tolerance on m1 (the question asked) and m2 (a fact not in the tool results, zero-tolerance). Cut 1b r2 (b8a197e) cured the cache (F-44.182) and made every live run stop at the first error and refuse without a budget (A-45.15). His --probe was GREEN (a 5,790-token prefix above Haiku 4.5's 4,096 minimum; call 2 READ the cache). His --live --budget=4 was running as CE-45 closed; its --show-misses output is the next thing the chair reads. CUT 2 (the app lane ON by one admin_config row) stays CLOSED until m1 and m2 are within tolerance on the live model.
- The Instagram lane is dark end to end: 2a-i (receiving) and 2a-ii (the room's doors, the messages flavour, the Send API, 0174) are landed; nothing on Meta's dashboard, no Railway env, until the chair says. 2b (Eliza answering on Instagram) waits on ELZ-1's channel-aware turn.
- His own number: G6-1 holds for its 2b read-first (answering on a vendor's own number through the same channel-aware turn) and M4/S4; R-45.32 keeps flag.own_number OFF for every vendor but DEV440 until answering is real.
- The app's chat: FE-2's Ask TDW sheet cut (the note "TDW replies on WhatsApp." DROPPED by his word; the renderer hardened; the re-dress ruled into the same cut; b134) is mid-build.
- The copy census (COPY-1's TDW_CE45_COPY1_R4530_CENSUS.md, 104 rows, with him): he reads it himself and gives final words; the chair routes each line to the seat that owns its file. Do not delegate it again; he withdrew the delegation.

**The founder's standing rules, still binding, and the ones this sitting added.** Plain, short, direct; a walk is "does it work"; CODE comes to the chair BEFORE he runs it, EVERY cut; docs-only goes to him direct (C-44.1). Added in CE-45: R-45.23 (every "do X first" line names what, where and for whom; every pick question numbered, a bare number is the pick); R-45.24 (a message request's recipient is always a client); R-45.25 as amended (a couple's date: free if her check says free; "booked, but let me confirm with them and get back" only on a truly blocked or sold day; the house form for a part-held day, a failed check or a check that is off; NEVER a word about her own access); R-45.26 (Eliza is an agent: facts by code, words by the agent, proof by replay and rate); R-45.27 (Business Solutions has one room "WhatsApp and Instagram" holding Your own number and Instagram messages); R-45.28 (that room first in Get booked); R-45.29 WITHDRAWN (no pinning; vendors will pin any room later); R-45.30 (every vendor-facing description plain, literal, non-poetic, no em dash, throughout the estate); R-45.31 WITHDRAWN (his delegation of the copy census); R-45.32 (the own-number `active` line's truth held by the switch); R-45.33 (the question agent). "Keep live-model runs as few and as small as the proof allows"; "give only those commands which haven't run"; every card states cost in one line before a paid step. He does not want `git add -A` ever: block 3 names paths.

---

## 1 · TIPS AT HANDOVER (derive again before your first relay)

dream-os `b8a197e` (ASK-1 cut 1b r2, 26 September ~23:20 IST) · dreamos-pwa `4d5a5dc2` (FE-2's Calendar), with FE-2's runner cut r2 (4984f0b122b9…) in the founder's block 2 at handover and expected to land next · ladder tail `0174_ig_dm_switch.sql` (0172 grants, 0173 ig_dm, 0174 ig_dm_switch, all applied in production) · floor-base.txt 20 lines (unchanged since 085741a; refusals in the founder's floor: b06_gauntlet, bf1, test-shape, key refusals).

The LSP_5 revert (cda36fa) is on the tree; the dead engine modules are back and harmless.

---

## 2 · WHAT CE-45 SHIPPED, SO YOU DO NOT RE-CHARTER IT

**The last server packet, LSP_1 to LSP_4, landed** (LCV-15): the chain tail, the switch, pre-door reads; the cancel-word fix; screenshot save (B84, B85), the possessive fold, the lost-client fix; the relay seat's chain era (RELAY_VERB_RE); the relay recipient fix and did-you-mean; the island deleted (tools.js, systemPrompt.js, classifier.js, replyToCouple.js; engine.js 1847 to 737). **LSP_5 (the engine's business room retired) was landed at 5cba98e and REVERTED at cda36fa**: the Advisor room failed (F-44.179: chat.js's wire-guard call still read moneyFacts/expenseFacts after L5-d deleted them; b116 drove runTurn but never chat.js's advisor path). LCV-16 is PARKED with the re-cut owed: LSP_5 as confirmed plus the fix and a cell driving the REAL chat.js advisor path end to end. It shares chat.js with ASK-1; it re-lands after ASK-1's lane work. Its read-first is at docs/specs/TDW_CE45_LCV15_LSP_5_READFIRST.md (in the reverted set; LCV-16 holds it).

**The couple lane is Eliza on R-45.26** (ELZ-1 cuts 1, 1b r2, 1c: 1512f42, 9bdcddc, eb3fe0a): studioName.js (the studio's name, never the owner's, F-44.157); coupleThreadFacts.js (FACT 1 from the thread's whole record, greeting once, F-44.125 cured); coupleDateState.js (date_state: free | booked | unsure | check_off | unreadable, the /v page's own reader, R-45.25); the prompt on four facts, the occasion first, trade question lists in categoryProfiles.js's COUPLE_ASKS; the soul's "you cannot see their calendar" paragraph rewritten under R-45.25; no dashes; b117a (floor half) and b117m (measured half: readers proven on hand-labelled replies, replays on both couple-lane models, rates per rule; Haiku all zero at 1c). F-44.145 cured (the bride lane's whole-message opt-out) with its persistence twin (2a). F-44.171 (a repeated date question answered from memory without date_state; a blocked date told free) ACCEPTED by the founder as low-likelihood; one sentence only, no measurement.

**The door on the vendor lane** (ELZ-1 cuts 2a r2, 2b, 2c, F-44.176: 2f49ac0, 727ed5c, 7505ff2, 1b37c26): the app lane's relay (relayLane removed; relay_pwa deleted); quote_send on the relay's path with the package's facts verbatim (F2), quoted_at/quote_draft_id on the send (F3); his V1 to V16 "first" lines and numbered picks, every pick a note carrying record ids in ONE stable order (F-44.178) and the pinned record re-read by id (a vanished or renamed pick re-asks); the client pin through L (money functions byte-identical); planAssign's three sites under a lift that ENDED with 2c; the exact-name vendor pick on TDW's line (F-44.173); the vendor_self record matching the sent text (F-44.174); F-44.165 (the known-client read filters deleted_at; a fresh capture from a known number adds no lead; the house form ALWAYS reaches the vendor with his line "{client} asked if you're free on {date}. I told them you'd check and get back to them. To answer, send "Tell {client}" and your message."); B86/B87 honesty lines for a find the door does not own (a STOPGAP that ASK-1's cut 4 retires); the studio's name prefixed on every message sent from TDW's shared line only ("Dev Roy Photography: …", F-44.176). OPEN in ELZ-1's hands: the e-151 cut (the B8 pick note carrying her words, the placeholder refusal, eight em dashes to punctuation, A-45.14's echoing doubles, m181 measuring the ear on short relays) awaiting the chair's two rulings given on 26 September (re-pin by label; cure the source homes of B42/B45/B75).

**The question agent, ASK-1** (cuts 1 r2 and 1b r2: 951146c, b8a197e): askTools.js (13 read tools, each scoped by code, sums in code), askAgent.js (a bounded loop, no markdown, no dashes, a self-reference-only persona guard, the cached prefix with 36 worked examples), spokenRange.js; the hand-off at workingDoor.standIn for every question turn the door does not own (K6 ruled (b): the door's own lookups included, lookupDoor's question branches to be retired in cut 4); both lane flags OFF (vendor.ask_agent.pwa, vendor.ask_agent.whatsapp); b130a (floor half, 102 cells, seven mutations, the require graph pinned, zero writes over the bank) and b130m (the measured half: --readers, --dry, --probe, --live with A-45.15). The bank: 362 questions from his 31 witnessed wordings and variation. Cuts 2 (app ON), 3 (WhatsApp ON), 4 (retire the stopgaps) remain.

**Own number** (G6-1): F-44.154 (E.164) and F-44.155/F-44.167 (the revalidate door had NEVER revalidated since G3.1; cured, walked green) and F-44.166 (Settings scrolling) cured; FE_2/FE_2b "Where enquiries go" closed as walked; 0172 (the grants service_role lacked on 0171's tables, F-44.168, and the estate-wide default-ACL cause F-44.169 with A-45.8). The `active` line reads "Enquiries to this number are now answered here, by your personal TDW agent." (his); its truth half held by R-45.32.

**Instagram** (IGD-1): cut 1 (the "WhatsApp and Instagram" room, dark doors) and 1b (first in Get booked) on the pwa; 2a-i (/webhook/instagram receiving only, F-44.161 and F-44.162 cured, 0173) and 2a-ii (the room's three doors dark by the lane, the messages flavour, subscribed_apps, the Send API with the 24-hour window and the 1000-byte split, 0174) on dream-os. His rulings: Q1 comments later; Q2 booking as on WhatsApp, Eliza never confirms; Q3 "it is automated" only when asked; Q4 quiet for two hours after the vendor replies herself (vendors.reply_quiet_minutes, one home shared with own number); the brand marks (official files from Meta's brand kit, never redrawn) DEFERRED by his word; the Meta opener template is OFF his table.

**The app** (FE-1 closed; FE-2): Home with shelves and pins (HOME_1, HOME_2); TYPE_1, TYPE_2, TYPE_1b (the six legacy rooms' tops in his words, option B), the Calendar in his "2" with F-44.177 (the lead-row tags whole), the runner cut (A-45.13: the floor stops and names any next dev a member leaves; F-44.163 closed). b122's flakiness inside his floor (F-44.160) was b87's leftover server; the runner cure is the durable fix.

**Business solutions** (BS-1 closed): the paper and the mock, his §11 rulings (greeting once; silence for crew, supplier, vendor, family; two front desks); its road: IG DM answering first (this sitting), then ads and website, then the rest.

**Marketing** (MKT-1, his marketing head): chartered; a Delhi NCR launch on 30 September, makeup artists then photographers, a 150-paid target with a trial offer, per his memory file; the chair does not run that seat.

---

## 3 · SEATS: OPEN, RESTING, CLOSED

OPEN: **ASK-1** (cut 1b r2 landed; --live running; cuts 2 to 4 owed). **ELZ-1** (the e-151 cut in hand; then the channel-aware turn, ruled ELZ-1's alone, for Instagram and own number, with the couple turn's prompt cache added and proven by one live pair). **IGD-1** (2b's read-first: its lane's contract for ELZ-1's turn; the dark walk's Railway env and Meta steps only on the chair's word). **G6-1** (holding; next 2b's read-first to the same contract, M4, S4, 2a's walk on 8757788550, cut three, 0172's walk record as docs). **FE-2** (the runner r2 with the founder; the Ask TDW sheet cut mid-build with the re-dress ruled in; then the dead TipsCarousel and the census words when he gives them). **LCV-16** (PARKED: LSP_5's re-cut after ASK-1's lane work; its seat-close after that walk).
RESTING: **MKT-1** (with the founder directly).
CLOSED: LCV-15, COPY-1 (stood down by the founder; its census is his), FE-1, BS-1.

Rung numbers taken: b116 (LSP_5, reverted), b117a/m (ELZ-1), b118a/b (ELZ-1), b119/b119b (IGD-1), b120 to b129 (pwa and G6-1), b130a/m (ASK-1), b131, b132 (ELZ-1), b133 (FE-2 runner), b134 (FE-2 sheet). Next free: **F-44.183, e-155, c-45.58**, rung b135.

---

## 4 · THE WALK CARDS OPEN AT HANDOVER

- ASK-1's --live --model=haiku --budget=4 --show-misses (running at close): read its m1 and m2 misses by kind before anything else; then the cure, the re-measure on --resume, DeepSeek after Haiku is within tolerance.
- ELZ-1's 2c W1 re-walk (a relay to a same-named twin after "2", the body her words, not "<UNKNOWN>") after the e-151 cut lands; 2b's W3 (a numbered package pick), W4 (the honesty line), W5 (the exact vendor pick on TDW's line) still owed on his screenshots.
- FE-2's runner r2 block 2 (in flight) and Calendar walk (his "walk is green" recorded); the Ask TDW sheet's walk on both phones when its cut lands.
- G6-1's own-number walk (W0 first: 8757788550 moved to WhatsApp Business), M4, S4: unchanged since CE-45's start.

---

## 5 · OWED FROM THE FOUNDER, NOT A WALK

- The copy census's final words (104 rows in TDW_CE45_COPY1_R4530_CENSUS.md, and FE-2's 25, G6-1's and IGD-1's tables folded in). He reads it himself.
- The three Meta-approved WhatsApp templates carrying em dashes or loose phrasing (tdw_crew_assignment, tdw_demo_lead_alert, tdw_morning_nudge_vendor): a reword is his Meta submission, when he chooses.
- The Instagram permission filing (instagram_business_manage_messages, and the refile of instagram_business_basic) after the dark walk produces its screen recording; and the ads permissions with the new ads app (F-44.140) when ADS-1 is chartered.
- His word to charter ADS-1 (priority 2) and, later, the website/domain seat (priority 3).

---

## 6 · OPEN FINDINGS, BY THE SITTING THAT INHERITS THEM

ASK-1: F-44.175 (the door answers every unowned question with new leads: cured by the stopgap lines, retired by cut 4); F-44.182 (the uncached prefix: cured in 1b; the production cost per question is now the measure); F-44.180 (ENGINE_SCHEMA.md lacks messages.room, docs-only, anyone's).
ELZ-1: F-44.181 (the ear hears "tell {client} hello" as no task while "hi" is a relay: MEASURE first with m181, then rule the cure's home; listenerDoor.js is protected); the couple turn's missing prompt cache (into the channel-aware cut); F-44.145's persistence landed; F-44.170 (a provider refusal on the couple lane reaches no one: latent, no live case, its own small item later).
IGD-1: 2b; the brand marks cut when he downloads Meta's packs (the terms read 25 September are in cut 1's handover); the date-check switch also shown in the WhatsApp and Instagram room (his placement); K5's open-binder default unproven on the door's road (LSP_5's handover).
G6-1: F-44.172's truth half (R-45.32); the b126_dev_server.js group-only stop (the runner reaper backstops it).
LCV-16: F-44.179; relaySeam's stale comment and readerless exports; tools/donnaNote.ts; snapshot.js's callerless functions; the seat-close.
FE-2: the dead TipsCarousel (teaches the retired DreamAi app; delete if unmounted, unmount and delete if mounted, with his word); F-44.156 (layout.tsx hydration warning); F-44.151 (WhatsApp glyph colour); TYPE_3 to TYPE_5 (Storefront, Portfolio/Couture/Collab, Contracts/Website/Advisor/Packages/Posts; F-44.150 retired in TYPE_5); the bride-lane "Mehek"/moodboard sitting positioned after LC-4 by his word.
The road after priority 1: P8 (Victor read-only in the Advisor room), the app-side cut (F-44.134 crew visibility), LC-3, LC-4, G6's cut three (the missed-call bridge).

---

## 7 · WHAT CE-45 GOT WRONG

- **The coverage trade was never put to him.** The LC-Victor series moved every business answer into a door that owns one lookup, and the chair let each cut land as "safe" without saying that the WhatsApp assistant could now answer almost nothing. He found it on the walk. R-45.33 is the cure; the lesson is that a product regression a vendor would feel is the founder's decision, not a by-product of a safety ruling.
- **The cache.** ASK-1's read-first said "no cache credit assumed" and the chair approved it without asking why the estate's caching was absent; $5 of his credits went on 271 uncached questions. Every measured half now states cost first, stops at the first error, and refuses without a budget (A-45.15); every new agent proves its cache by a probe before any live run.
- **LSP_5 shipped a break.** The floor proves nothing old broke; only the cut's own rung can prove the new path is right (A-45.14), and b116 never drove the real chat.js advisor path. The revert was the right call and cost nothing; the re-cut carries the missing cell.
- **Two kickoffs cited lines that were wrong at the tree** (c-45.40 to c-45.57): the seats caught every one. Keep the rule that a kickoff's anchors are re-derived and its errors credited.
- **Too many relays at once.** He asked for consolidated relays per seat and for priority relays to be held until seats finished their packages; do the same.

---

## 8 · HOW THE WORK ACTUALLY GOT DONE

Six seats in parallel on two repos, each on its own tip under R-45.14 (build on the tip you start from; ask the chair for the base at the cut; carry by command, merge shared benches by hand, run them whole; whichever the chair confirms first lands first). The chair read every ZIP on a fresh clone at the named base before confirming: the hash, the apply, dirt against the manifest, the money functions' bodies byte for byte, the untouched set, the key rungs, the card's hash line. The founder ran every block from a card and pasted the output; the screenshots and SQL exports were the walk's evidence. The amendments this sitting added, all in the tree's handovers: A-45.5 (rm -rf .next/dev before tsc), A-45.6 (a pwa rung that starts a dev server keeps its own log), A-45.7 (list live sequences before any kill; restore every non-manifest path after an interrupted run; search declared paths for known mutation texts), A-45.8 (a migration creating a table grants service_role, rehearsed as service_role), A-45.9 (layout cells read element geometry, never glyph boxes), A-45.10 (ports read from tcp and tcp6), A-45.11 (the engine built in both trees before a differential; a bench erroring on both sides is read, not counted), A-45.12 (a differential compares reached-cell counts), A-45.13 (the floor reaps and names leaked dev servers), A-45.14 (a rung's double never hides the property under test; a composer double echoes its instruction), A-45.15 (measured halves record, stop at the first error, take a budget, resume only what did not run, state cost first). c-45.54: a bench anchors itself; production is never reordered to satisfy a bench.

Sequencing beyond this note is the founder's.
