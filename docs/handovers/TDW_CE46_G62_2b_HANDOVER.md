# TDW · CE-46 · G6-2 · 2b · A COUPLE WRITES TO HER OWN NUMBER, AND TDW ANSWERS ON IT · HANDOVER · dream-os

**Base `6efcf91`** (the chair's word, 27 September: ASK-2 cut 2a r2 landed there, none of these 17 paths). Built on 7e03e32, carried
by command onto da9c7ef (r2, confirmed, never applied) and again onto 6efcf91 (`git rebase`, no conflict; the diff against 6efcf91
is exactly these 17 paths, and every code and bench file is byte-identical to r2). Cut as `TDW_CE46_G62_2b_r3.zip` (C-44.9).
**The turn's signature** is ELZ-2's, pinned in TDW_CE46_ELZ2_CUT1_HANDOVER.md §1: this caller passes the shared line's arguments plus
`counterparty { channel: 'whatsapp_own', phone, igsid: null, chatted_before }`, the one bit inside counterparty. The persona gate on
this channel is the turn's own (engine.js reads couple.eliza_enabled on every channel but Instagram); this caller does not touch it.
Rulings built: the joint ruling of 27 September (the turn composes, the caller does the rest; no studio prefix on any channel);
F1 (a), F2 T-c, F3 (b) (his Q4 = 2), F4 crew from team records, F5 (a), F6 (a), F7 (a), F8 (a), F9 (a), F-44.207 (a) and (b).
Rung b137. Findings named here: F-44.195 avoided, F-44.196 (crew cured; supplier, vendor, family open), F-44.197 open, F-44.199 open.

## What shipped

Everything stays dark by data: flag.own_number is off for every vendor but DEV440 (R-45.32), and nothing on Railway or Meta
moves until the chair's written word.

- `src/lib/ownNumber/door.js` · **openFor, the one gate** (F7 (a)): open on walk mode as before, or on flag.own_number 'on'
  AND her tier's row 'on'; at the answering seam also only while her number is 'active'. The door and the connect pass no
  status and read her tier's row (connect.js now reads it too).
- `src/lib/ownNumber/token.js` · **T-c**: her business token by `POST /v25.0/<her business id>/system_user_access_tokens`,
  Bearer TDW's system token (META_WABA_TOKEN), `appsecret_proof`, `fetch_only=true`; 60 seconds in memory per vendor; never
  written to a table or a log.
- `src/lib/ownNumber/send.js` · the send from her PNID with her token through `metaCloud.sendMetaText` (R-40.91's E.164 guard
  at the one POST), opt-out first (`sendWa.defaultIsOptedOut`), active numbers only, split at 4096 characters, every send
  logging recipient and wamid. No prefix: the reply is sent byte for byte.
- `src/lib/ownNumber/turn.js` · **the caller**: gate, then silence for her own login phone (F5), TDW's own lines (F-44.207 (a))
  and her team by phone (F4); the ONE couple_thread (the shared line's key and '+' form; channel stays 'whatsapp'); her words as
  an inbound row stamped 'whatsapp_own' with the wamid as message_sid (the UNIQUE index is the dedupe); quiet time from the one
  home before the turn (her WhatsApp Business echo to this couple, or her relay on this thread); `chatted_before`, one boolean
  from her private history; ELZ-2's turn with `counterparty { channel: 'whatsapp_own', phone, igsid: null, chatted_before }`;
  the send; one outbound row per part; the vendor's notice to her TDW WhatsApp through
  `sendVendorEnquiryAlert`, scrubbed by `scrubModelFrame`. Never throws; failures are dead letters, never a false "sent".
- `src/lib/ownNumber/route.js` + one mount line in `src/index.js` · `POST /internal/own-number/inbound`, trusted only by
  `webhookCore.isInternalReplay` (the ingress's forward), never `/webhook/meta`.
- `src/lib/ownNumber/forward.js` + the receiver hunk in `src/marketingIndex.js` · recorded first by events.js, then only a
  'messages' change carrying messages is forwarded to the new route (VENDOR_SELF_URL, INTERNAL_REPLAY_SECRET, both already set
  for forwardChange). Echoes, history, contacts, account events and statuses stay in the receiver.
- `src/lib/ownNumber/wabaMap.js` `isConnectedOwnNumber` + **one hunk in `src/lib/vendorInbound.js`** (F-44.207 (b)): the first
  statement of the couple branch gives a sender whose phone is an ACTIVE own number no couple turn. **ELZ-2: your callers'
  byte-identical cells must allow exactly this hunk** (7 lines, the head of `if (!vendor) {`).
- `docs/handovers/TDW_CE45_G61_0172_HANDOVER.md` · G6-1's 0172 walk record, verbatim from its seat-close.
- `scripts/b137_g62_own_number_turn_bench.js`, `scripts/lib/b137_pgdouble.js` · rung b137.
- `scripts/b121_g61_own_number_srv_bench.js` · 1.4, 2.2, 4.3 and M1 re-aimed by label (F6 (a), F7 (a)); each reason at site.

**Untouched, pinned by b137 1.1:** sendWa.js, metaCloud.js, engine.js, relayToCouple.js, events.js, meta.js, metaInbound.js,
workingDoor.js. No money code. No migration: messages.channel carries no CHECK, and conversations.channel is not written.

## The Meta read (27 September 2026 IST), as ruled for F2

Access Tokens Guide: a Tech Provider uses the customer's Business Integration System User token, not its own system token, so
T-a was not built. Hosted Embedded Signup, Step 5: the customer's business token is fetched with the partner's system token,
appsecret_proof and fetch_only=true against the customer's portfolio id. Tech Provider onboarding, Step 4: the send is
`POST /<her PNID>/messages` with her business token; Step 5: she must add a payment method (F-44.199). Webhook references
(history, smb_message_echoes) read the same day for the shapes this cut matches: a history thread's `id` and an echo's `to`
are the WhatsApp user's number, the echo's `to` sometimes with a plus, so both forms are matched.
**The founder's debugger read of META_WABA_TOKEN (27 September):** System User, app 1425513376067685, never expires, scopes
whatsapp_business_management and whatsapp_business_messaging, **no business_management**. Whether the fetch needs it is proven
on the dark walk; if Meta refuses for scope, b137 5e.3 shows the refusal carries Meta's own message into the dead letter and the
log, and this handover's next revision names the one scope to add on the system user from that message, never a guess.

## Proof

- **b137 at da9c7ef + this cut: 67 pass, 0 fail.** The shipped modules driven end to end on the founder's fixture map (DEV440 on
  8757788550; the bride 9625759924 with her existing TDW's-line thread; 9888294440 her login; Anjali's lead ce4ca3ac and thread
  9552a49c untouched, 5.7); the real `processVendorInbound` for F-44.207 (b) with an unconnected sender as control (8.1); THE
  BOTH-SIDES CLAUSE, 5.3b: ELZ-2's shipped `resolveCounterparty` (engine.js's own bytes, read out by name) handed this caller's
  recorded payload reads whatsapp_own, her phone and the one bit as sent. Ten production mutations, each red and restored by sha
  (M10: the bit sent beside counterparty, the pre-landing shape). **At da9c7ef alone b137 exits 2 before any cell** (its manifest
  and subjects do not exist there), so its both-ways proof rests on the ten mutations.
- **b121 41/0** (1.4, 2.2, 4.3, M1 re-aimed by label), **b124 35/0**, **b128 13/0**, **b131 12/0**, **ELZ-2's b135 38/0** and
  **IGD-2's b136 38/0**, both reading the vendorInbound hunk; **ASK-2's b138 11/0**.
- **The differential, in series, at 6efcf91 (as at da9c7ef):** the radius re-derived by command at 6efcf91, 83 benches that read an edited file
  (door, connect, wabaMap, vendorInbound, marketingIndex, index; b135 and b136 joined since 7e03e32), each run at 6efcf91 (a clean
  worktree) and on this cut, engine built both sides. **Exit codes identical on all 83; PASS lines 4408 = 4408.** Output deltas,
  each attributed: b121 (its re-labelled cells); b07_p5 (the sibling clone's path inside an ENOENT line, nothing else). Red on
  both sides, untouched by this cut: b05_arc_m6, b05_p4_crons, b07_p5, b08_p5_oow_relay, b10_p2_bridge, b90_lcv_p5 (the seat's
  100-second cap on both sides).
  e-178 (this seat): one differential call overran the 300-second limit and was killed mid-bench; §11 at once, both trees clean;
  the killed bench re-ran whole, and its line is the re-run's.
- **The floor:** the founder's block F under A-46.4 (`env -u ANTHROPIC_API_KEY -u DEEPSEEK_API_KEY`), `run-floor.sh --delivery
  scripts/floor-manifest-ce46-g62-2b.txt --check`, the pwa sibling at its tip with node_modules; its tail goes to the chair before
  block 3. e-177 (this seat): the seat started that floor in the background; the sandbox ended it with the call during the warm-up
  pass (R-40.63, the specimen F-40.128). §11 run at once: 17 dirty paths, all declared; every code file byte-identical to the cut;
  nothing outside the manifest. No result is claimed from it.

## Named, not built (each its own later item or another seat's)

- **Relays from her number.** The vendor's own "Tell Sarah ..." still leaves from TDW's line (relayToCouple.js :168), prefixed,
  even when the couple last wrote to her number. F-44.176's "no second change" holds for the prefix, not for the route.
- **Delivery statuses for her sends** stay in the receiver (events.js keeps none); no receipt router reads them yet (R-40.110).
- **Non-text messages** on her number get no turn; they stay recorded in vendor_wa_events.
- **Supplier, vendor and family silence** (F-44.196): no source exists; crew by team_members is built.
- **F-44.197**, the moved way while the switch is off: recorded and silent, no screen shows it to her.
- **F-44.199**: the payment method Meta requires is never asked for in the room.
- **The turn's own words.** This caller sends whatever ELZ-2's turn returns, byte for byte; that the turn adds no studio line and
  greets once across both numbers is ELZ-2's cut 1 and its bench.
- **While 8757788550 is connected,** F-44.207 (b) also means a message from that number to TDW's line gets no couple turn. That is
  the guard that keeps Anjali's rows byte-identical; the card says so.
- The Q5 copy lines (ownNumberFlow.ts `connecting`, `personalNumber`) are a separate small pwa cut after FE-3's r3.

## The walk

Its own card, authored from the founder's F-S1 to F-S8 rows and his debugger read, to the chair before him. W0 is his any time;
2a's connect walk and S4 merge into one walk after this cut lands, with 9625759924 the writer, and a read-back proving Anjali's
lead ce4ca3ac and thread 9552a49c byte-identical. Nothing on Railway or Meta before the chair's written word.
