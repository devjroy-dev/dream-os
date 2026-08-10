# TDW · THE VENDOR↔BRIDE RELAY SEAM — READ-FIRST AUDIT
### LE session under CE-27 kickoff, 2026-08-10 · dream-os `904aaf1` · dreamos-pwa `7bb6429`
### ZERO PRODUCTION BYTES SHIPPED. D-10 STOP observed at the report.

---

## 0 · RE-DERIVATION OF THE TIP

```
git fetch -q origin && git checkout -q origin/main && git rev-parse HEAD
904aaf1b964bfd3dc8f033a4cd363cc159461e6f
```
```
(dreamos-pwa) git rev-parse HEAD
7bb64292b4b361839614d50ac22205bdebc0776e
```

**DELTA: NONE.** Both tips match the charter header exactly. Tip commit subject confirms CE-211 as the last act.

**MY DECLARED WALLS.** I hold the repository and nothing else. I have **no database, no Railway log, and no Meta console**. Every claim below is either (a) derived by command against `904aaf1`, or (b) explicitly marked **FOUNDER-WITNESSED** (inherited from the kickoff, not re-run by me), or (c) marked **UNDERIVED**. I have not run one line of SQL and I do not report any live flag value as my own.

---

## 1 · RE-DERIVATION — L1 THROUGH L7

**7/7 dispositioned. 5 CONFIRMED, 1 CONFIRMED-AND-STRENGTHENED, 1 FALSIFIED AS WRITTEN.**

---

### L1 · THE OUT-OF-WINDOW CATCH IS ON A PATH META DOES NOT USE — **CONFIRMED, AND NOW WITH A MECHANISM**

The kickoff cited the catch at `:113`. **That citation is wrong and I correct it:** `enquiryAlert.js:113` is `const _sendWhatsApp = deps.sendWhatsApp || sendWhatsApp;`. The catch block is `:133–184`; the window discriminator is `isWindowClosed(err)` at `:134`, defined `:87–89`; the disclosed-gap comment is `:91–100`.

The kickoff proved L1 by **absence of log lines**. I can prove it by **construction**, which is the stronger grade:

`metaCloud.js:87–95` — `postMessage` throws `MetaSendError` **only on `!res.ok`**. On any 2xx it returns `{ ok: true, wamid }` (`:98–99`). `whatsapp.js:141–145` passes that straight back as `{ sid: wamid, sent: true }`.

**Therefore: a Meta send that is accepted (HTTP 200 + wamid) and then fails asynchronously cannot raise a throw anywhere in this stack.** `isWindowClosed` reads `err?.body?.error?.code` — a field that only exists on the `MetaSendError` constructed at `metaCloud.js:90–94` from a non-2xx body. The founder's Railway capture shows exactly the 200-then-`status=failed` shape.

**The catch is not merely unwitnessed on this path. It is unreachable on this path.** The template fallback has never been reachable, and no logging change or flag flip can make it so. **F-06.140.**

---

### L2 · THE GATE IS SHUT — **CONFIRMED ON THE TREE; LIVE HALF FOUNDER-WITNESSED, NOT MINE**

`laneFlags.js:54` — `'vendor.enquiry_alert_oow_enabled': false`. Confirmed verbatim.

Reader traced whole (`:90–118`): absent row → `maybeSingle()` → `data` null → the `if (data && data.value != null)` at `:104` never enters → `val` stays `fallback` → `false`. **The mechanism is exactly as the kickoff states.**

The `SELECT` returning zero rows is **FOUNDER-WITNESSED (2026-08-10)**. I did not run it and I do not restate it as derived.

**No finding filed.** Fork 4 ruled it OFF at birth; this is a ruling honoured, not a defect. **I do not propose flipping it.** Independently of the ruling, flipping it would now be provably inert: per L1 the branch it guards (`:147–153`) sits *inside* a catch that cannot fire on this lane.

**The dial is innocent — confirmed.** `readDial` (`:189–200`) returns `DEFAULT_OOW_KEY` = `'enquiry_alert_vendor'` (`:67`) on an absent row.

**ONE UNDERIVED LINE I WILL NOT REPEAT.** The kickoff's §5 asserts *「 `laneFlags.js` says `false` for four flags; three of them are `true` in production 」*. There are indeed four flags (`:46`, `:54`, `:63`, `:81`). **I cannot witness any live value.** Only the founder can. **I flag this as an unwitnessed premise sitting inside a law, and it needs his `SELECT` before the next sitting quotes it.**

---

### L3 · THE MAPPED TEMPLATE HAS NO ROOM FOR HER MESSAGE — **CONFIRMED**

`enquiryAlert.js:50–63`. The sole registry entry `enquiry_alert_vendor` (`:51–62`) builds `{ name, bride, link }` at `:57–61`. **There is no body slot and no fourth variable.** Even a working fallback would carry that a bride enquired and a link — never what she asked.

`tdw_enquiry_brief_vendor` deliberately unmapped, comment `:42–49`, reason stated as the name-vs-wire class (F-08.75). **Confirmed, and I do not author it.** The founder's wire paste — name, LANGUAGE CODE, `{{n}}` slots as Meta prints them — is the only admissible source.

Note the compounding: **L3 is downstream of L1.** Curing the template does nothing while the catch cannot fire. Any fork that touches L3 alone ships a byte with no behaviour behind it.

---

### L4 · A FOURTH RELAY SITE OUTSIDE THE ONE DOOR — **CONFIRMED, AND IT IS WORSE THAN THE KICKOFF SAYS**

Sole-caller property re-derived at `904aaf1`:
```
grep -rn "sendVendorEnquiryAlert" src/
  vendorInbound.js:605  :719  :1013   ← the three callers
  vendor/enquiryAlert.js:109  :203    ← definition + export
```
Three callers, exactly as the header at `vendorInbound.js:117–122` claims. **The sole-caller property holds for the symbol.**

`vendorInbound.js:865–867`:
```js
if (vendorPhone) {
  await sendWhatsApp(vendorPhone, notif);
}
```
Confirmed bare. **But the kickoff understates the injury.** This call is *not wrapped in any try/catch of its own*. Per `metaCloud.js:90` a non-2xx throws `MetaSendError`, and per the door's own header (`vendorInbound.js:120–122`) an unguarded vendor-notification throw *「 reached the function-level dead-letter and cost the BRIDE the rest of her turn 」*.

Downstream of `:866` and inside the same try-scope: the post-turn binder enrich (`:869–888`) and the `conversations` update at `:890`. **So a shut vendor window at this site does not merely fail to notify — it re-instances F-08.85's original disease, on the one path the founder's 16:44 message actually took.** The rider cured three sites and left the fourth carrying the disease it was chartered against.

**F-06.141.**

---

### L5 · THE PING BURNS ON FETCH — **CONFIRMED, AND IT IS THE ESTATE'S ONE DEVIATION FROM ITS OWN WRITTEN DOCTRINE**

`leadPings.js` re-cited precisely: SELECT `:144–150`, format `:153`, **stamp `:159–162`**. (Kickoff said `:145-160`; the true span is `:144–162`.) The stamp `.in('id', data.map(r => r.id))` fires on every surfaced id with nothing having consumed them. `:39–48` discloses the cost in the file's own words. **Confirmed exactly.**

**THE NEW FACT, AND IT CHANGES FORK A.** I ran the consume-once census (§3(b) below) and `leadPings` is not one pattern among several. **It is the only stamp-before-use in the estate.** Both siblings stamp after a *confirmed* send and both say so in-comment:

- `collab.js:658–664` — `if (notifyOut && notifyOut.sent === true)` **then** stamp `poster_notified_at`; the else-branch logs that the column was *「 LEFT NULL 」*. Its comment at `:640–645` names the doctrine by address: *「 `demoLeadAlert.js:311-318` — 'send first, stamp second,' the stamp written ONLY after a send that actually happened 」*.
- `brideCron.js:57–60` — *「 Stamp the guard AFTER a confirmed send, never before. Stamping first would mean a send that failed still suppressed… TODAY's retry, which is the whole value of the retry. 」*

**The estate has a written law for this exact hazard, cites it by file:line at two sites, and `leadPings` is outside it.** That is a much stronger warrant than "R2 accepted a cost": the acceptance at R2 was made without the doctrine in view.

**F-06.142.** Production witness (ping `3b75a356`, `acknowledged_at 16:46:21`) is **FOUNDER-WITNESSED**, not re-run by me.

---

### L6 · NO INSTRUMENT EXISTS BY WHICH A VENDOR REACHES A BRIDE — **FALSIFIED AS WRITTEN. TRUE OF THE LIVE ESTATE, FALSE OF THE REPOSITORY, AND THE DIFFERENCE IS THE MOST IMPORTANT THING IN THIS REPORT.**

The kickoff's derivation is sound as far as it goes — I reproduce it:
```
grep -rn "sendWa\|sendWhatsApp\|sendMetaText\|sendMetaTemplate" src/engine/
  (no output — zero)
ls src/engine/src/core/tools/   → 13 files, 38 tool names
```
**Zero send symbols in the TS engine. Confirmed.**

**But the chair searched only the engine.** Widening the same grep to `src/` surfaced a file the chair's census never names:

**`src/lib/vendor/replyToCouple.js` — 164 lines, header line 3: *「 PHASE 3 — the vendor→couple reply mechanism 」*.**

It resolves the couple's phone from the lead (with two named recovery paths), finds-or-creates the `couple_thread`, sends, and logs the outbound row **with a `twilio_sid`**. It is reached by tool `send_to_couple`, defined at `tools.js:512`, executed at `engine.js:1659–1690`, and instructed by ~55 lines of prompt at `systemPrompt.js:184–237`.

**And `replyToCouple.js:110–131` contains the exact discipline the live estate lacks, written by someone who had already reasoned out L1:**

> the transport *「 ACCEPTS the message (returns a SID) but Meta later marks it undelivered — so a naive send would let us falsely tell the vendor "Sent!" when the bride got nothing. To never lie about a send, we check the window BEFORE sending 」*

It queries for an inbound inside 24h and returns `window_closed` rather than attempting the send. **The estate diagnosed and cured the async-failure honesty problem, in a file, with a comment, in Phase 3.**

**IT IS DEAD. ALL FOUR PIECES ARE DEAD, AND I RE-DERIVED IT AT `904aaf1` RATHER THAN INHERITING THE BANNER:**

```
grep -n "module.exports" src/agent/engine.js
  1724:module.exports = { runCoupleAgenticTurn };

grep -rn "executeTool\|handleOnboarding" src/ scripts/ | grep -v engine.js
  → only comments and bench assertions. ZERO call sites.
```

`send_to_couple` lives inside `executeTool`, which is inside the F-05.56 defused island (`engine.js:629–632`). `systemPrompt.js` is itself a labelled island (F-06.37, `:1–3`). Both died in the same act: M5 deleted `runAgenticTurn`, the JS vendor loop.

**THE FINDING — F-06.144.** F-05.56 walked one ring out from the deleted orphan and labelled `handleOnboarding`/`executeTool`. F-06.37 walked to `systemPrompt.js`. **Nobody walked the ring that contains `replyToCouple.js`.** It is the fourth ring of the same orphaning and it carries **no label at all** — unlike engine.js's island, systemPrompt.js, and classifier.js, which each carry a header warning a reader they are corpses.

**So the correct statement of the disease is not *「 the estate never built a way for a vendor to reach a bride 」*. It is: *「 the estate built one, hardened it across three commits, gave it the window-honesty every live send site lacks, and then silently orphaned it as collateral damage — and the orphaning has been on the register since M5 without anyone connecting it to the lost capability. 」***

**This dissolves the build/don't-build framing of Fork D.** The question before the chair is not whether to author a vendor→bride route. It is **revive-or-re-site an existing, once-ruled, window-honest one** — and to decide whether its Phase-3 voice ruling (delivery by the assistant, `sent_by: 'agent'`) survives the founder's later ruling that **Eliza** owns `couple_thread`.

**L6's operative claim — that nothing reachable from a live agent tool call can send to a bride — is CONFIRMED. Its stated claim, that no instrument exists, is FALSE.**

---

### L7 · THE FAILURE LEAVES NO RECORD THE ESTATE CAN READ — **CONFIRMED, AND THE SILENCE IS DOUBLE**

`engine.js:594–600` — the `vendor_self` mirror insert. Columns written: `conversation_id`, `direction`, `channel`, `body`, `sent_by`. **`twilio_sid` is absent from the insert**, so it defaults null. Confirmed.

`index.js:222–226` — the status writer:
```js
try { await supabase.from('messages').update({ delivery_status: s.status }).eq('twilio_sid', s.id); }
catch (_e) { /* status best-effort */ }
```
**Confirmed: the `failed` status has nothing to land on.**

**AND THE SECOND SILENCE, WHICH THE KICKOFF DOES NOT NAME.** That UPDATE is blind — no `.select()`, no count check, no branch on zero rows matched. **A status callback that matches nothing is indistinguishable from one that matched.** The only line printed is `:225`, which logs the wamid and status regardless. So not only can the estate not record the failure; **it cannot detect that it failed to record it.**

**F-06.143.**

---

### THE TWO WITHDRAWALS — BOTH UPHELD, AND I CAN NAME THE MECHANISM FOR ONE

**`Her message: ""` is not a defect — UPHELD, mechanism found.** `engine.js:573–574`:
```js
returningBrideNotif = summary ? `${summary}\n\nHer message: "${inboundMessage}"` : verbatimFallback;
```
The string embeds `\n\n` immediately before `Her message:`, and `inboundMessage` is the bride's raw body which may itself carry newlines. **Railway splits on newline. A log line is not a row, and here is the newline it split on.** Confirmed the chair's withdrawal and supplied its cause.

**The `「 inside Victor's own prompt 」` withdrawal — UPHELD.** `leadPings.js:144–150` filters `.is('acknowledged_at', null)`; a ping stamped at 16:46:21 cannot appear in a 16:47:25 fetch. **The chair's withdrawal is mechanically correct.** Victor answered from the only record he had.

---

## 2 · THE FOUR CENSUSES

**STATE DECLARATION, per §5's law.** Every census below is taken **against the source tree at `904aaf1` only**. None is taken against production. Where a control's behaviour depends on a live `admin_config` row I say so and count the control, not the state.

---

### (a) EVERY OUTBOUND SEND SITE — **56 SITES. METHOD AND BLIND SPOT DECLARED.**

**METHOD:** `grep -rnE "await (sendWhatsApp|sendWa|sendMetaText|sendMetaTemplate|_sendWhatsApp|_sendWa)\("` across `src/**/*.{js,ts}`, minus the three transport modules that define them.

**DECLARED BLIND SPOT — this census will miss:** (1) any send dispatched through a variable or destructured alias not matching those six names; (2) any send not preceded by `await` (fire-and-forget, `.then()`, or returned); (3) anything in `scripts/` or `tools/`, which I did not sweep; (4) any send made by the PWA repo, which was read-only this sitting and which I did not census. **A census that misses a site is worse than no census: treat 56 as a floor, not a total.**

**AXIS 3 — DOES IT PERSIST A SID SO A STATUS CAN LAND?**

| | count |
|---|---|
| Total sites | **56** |
| Return value **bound** (a sid is *recoverable*) | **16** |
| Return value **discarded** (`await send…(` as a bare statement) | **38** |
| Residual not classified by either pattern | **2** |

Of the 14 non-`vendorInbound` files carrying sends, **`twilio_sid` appears in only two**: `brideInbound.js` (7 mentions) and `sendOutcome.js` (1). **Twelve files send and never persist a sid at all:** `cron.js`, `brideCron.js`, `prospects.js`, `demoLeadAlert.js`, `enquire.js`, `concierge.js`, `marketingIndex.js`, `closerEngine.js`, `otpSend.js`, `admin/mint.js`, `admin/prospects.js`, `admin/demoAdmin.js`.

**L7's class is emphatically not alone. It is the estate's majority condition.** For every one of those sites, an asynchronous Meta failure updates zero rows and prints one indistinguishable log line.

**A SECOND CLASS FALLS OUT OF THE SAME COUNT — F-06.146.** `whatsapp.js` reports refusal **by return, not by throw**: `{ blocked: 'opted_out' }` (`:133`), `{ blocked: 'meta_media_unsupported' }` (`:139`), `{ blocked: 'no_meta_lane' }` (`:153`). **At all 38 bare sites that sentinel is discarded unread.** An opted-out recipient, an unresolvable lane, a refused media send — all are silent successes to the caller. `collab.js:658` is the estate's model here: it tests `notifyOut.sent === true` strictly and explicitly notes that `.sid` is not a success oracle.

**AXIS 1 & 2 — CLOSED-WINDOW EXPOSURE AND TEMPLATE FALLBACK.**
- **Template-first by construction (window-immune):** `otpSend.js`, and the `sendWa` template paths in `cron.js`/`brideCron.js`/`prospects.js`.
- **Free-form, window-exposed, WITH a door:** the three `sendVendorEnquiryAlert` sites — and per L1 that door's fallback cannot fire.
- **Free-form, window-exposed, NO door:** everything else, including `vendorInbound.js:866` (L4).
- **Free-form, window-exposed, with a CORRECT pre-check:** `replyToCouple.js:118–131` — **and it is dead** (L6).

---

### (b) EVERY CONSUME-ONCE MECHANISM — **3 LIVE + 1 DEAD WRITER. DECLARED COUNT: 3.**

**METHOD:** grep for `.update({ … <spent-marker column> })` and for spent-marker column literals across `src/`. Columns swept: `acknowledged_at`, `consumed_at`, `drained_at`, `seen_at`, `processed_at`, `delivered_at`, `handled_at`, `notified_at`, `sent_at`, `read_at`, `dismissed_at`, `resolved_at`. **Blind spot:** a consume-once implemented by row DELETE, by a boolean, or by a status enum transition would not appear.

| # | mechanism | stamp point | verdict vs L5 |
|---|---|---|---|
| 1 | `leadPings.js:159–162` `acknowledged_at` | **AT FETCH, before any use** | **CARRIES L5'S DISEASE. The only one.** |
| 2 | `collab.js:658–664` `poster_notified_at` | after `notifyOut.sent === true` | **CLEAN.** Names the doctrine at `:640–645`. |
| 3 | `brideCron.js:57–70` `nudge_sent_at` | after confirmed send | **CLEAN.** States the reasoning at `:57–59`. |
| — | `engine.js:887` `resolved_at` | a cancel outcome, not a drain | out of class |
| — | `contracts.js:88` `sent_at` | state transition, not a drain | out of class |
| dead | `executeTool`'s `create_lead` ping writer | — | in the F-05.56 island; cannot fire |

**FINDING FOR THE CHAIR: the census does not merely locate a sibling of L5. It establishes that L5 is a solitary exception to a doctrine the estate wrote down, cited by address, and honoured everywhere else.** That is the strongest possible warrant for Fork A and it did not exist before this census.

---

### (c) THE BRIDE LANE'S MIRROR — **ASYMMETRIC. THE BRIDE LANE IS THE BETTER-BUILT ONE.**

- **Does the bride lane persist sids?** Yes — `brideInbound.js` is one of only two non-vendorInbound files that write `twilio_sid` (7 mentions). **Her outbound rows can receive a status callback. The vendor's notification rows cannot.**
- **Does she have a ping shelf?** **No.** `pending_lead_pings` is vendor-keyed (`vendor_id`, `lead_id`) and the census found no couple-side equivalent. There is nothing to burn — and correspondingly nothing to hold an unanswered vendor question for her.
- **Can anything reach her when her window is shut?** `brideCron.js` rides `sendWa` templates and stamps after confirmed send. **This is the one lane in the estate whose out-of-window path is both real and honest.**

**So the seam does not fail symmetrically.** The disease is concentrated on the **vendor notification** path specifically: it is the path with no sid, no door at `:866`, an unreachable fallback, and a body-less template. **The chair should not expect a mirror finding here; the finding is the asymmetry itself.**

---

### (d) AGENT CLAIMS WITHOUT INSTRUMENTS — **THE LIVE SOULS ARE CLEAN. THE DEAD PROMPT IS NOT. AND THE ORGAN THAT WOULD CATCH THE GAP HAS A DECLARED BOUNDARY THAT EXCLUDES IT.**

**LIVE (`harveySoul.ts`, `donnaSoul.ts`, `consultantHarveySoul.ts`):** I swept for send/tell-her/relay/convey/reach-out promise verbs. **No soul promises to reach a third party.** The opposite is stated: `harveySoul.ts:159` — Harvey's channel is the owner's alone, *「 Talk only to him 」*; `:103` — *「 you never chase a third party through your owner 」*. `donnaSoul.ts:153` is an explicit anti-fabrication passage. **No finding against the live souls on this axis.** (F-06.139's `:93` relay-priming is a separate, already-filed subject and I did not re-open it.)

**DEAD (`systemPrompt.js:184–237`):** ~55 lines instructing the agent that it can send, culminating at **`:237`**: *「 NEVER refuse with "I can't send messages on your behalf" — that is FALSE; you CAN send via `send_to_couple` 」*. **This is the most emphatic capability claim in the estate and it is attached to a dead organ.** It cannot execute today. **It is a revival hazard, not a live defect** — and it is exactly why the missing label on `replyToCouple.js` matters.

**THE ORGAN THAT SHOULD CATCH F-06.137 — F-06.145.** `src/engine/src/core/relaySeam.ts` already exists for precisely the class *「 the voiced relay echoes the DISPATCH back as the outcome while the honest receipt sits in her own hand 」* (`:6–8`). It appends the door's own vetoed sentence on a detected contradiction. **But its coverage boundary is stated as law at `:40–47`: it reads structured `refused` arrays, `refused` is authored at exactly two sites (both in `donnaLead.ts`), and everywhere else it FAILS OPEN by construction — the voiced text ships byte-identical.**

**A vendor saying *「 tell her 60000 」* produces no `refused` array anywhere.** So the estate owns the correct organ for the fabricated-send class, and that organ's own declared boundary excludes the case that produced F-06.137. **This is not a bug in `relaySeam.ts` — the file says so out loud and instructs the reader to extend it. It is an un-taken extension.**

---

## 3 · FORKS, ENUMERATED FOR THE CHAIR

### FORK A · THE PING BURN
- **(a) leave stamp-at-fetch.** Cost: L5 recurs on every unrelated turn inside the window. **Now also: keeps the estate's sole deviation from its own written doctrine.**
- **(b) stamp only on demonstrated use.** Faithful; needs a hook into the TS tool layer; R2 rejected it as W-1-adjacent.
- **(c) don't stamp; re-surface until something reaches her.** Cheapest diff. Cost: the block re-announces for ten minutes; `HEAD_3`'s *「 do not re-announce it 」* copy starts fighting the mechanism.
- **(d) stamp, but hold her unanswered question on a shelf that re-surfaces until the vendor's reply addresses it.** Richest; needs a new "addressed" predicate, which is a model judgment inside a mechanism — the class the estate distrusts.
- **★ (e) — I ADD THIS ARM, AND IT IS THE ONE I WOULD TAKE.** **Align with the estate's own doctrine: send first, stamp second.** Here "send" is "the block reached a turn that could consume it" — the minimal honest version is to **stamp at fetch only when the turn's referent demand is real, and otherwise leave open**, which is (b) narrowed to a boundary the door can already see. **This is (b) re-warranted by census (b) rather than by taste.** The doctrine is written down at two sites; the fork is now "conform" rather than "improve".
- **THE ARM I WOULD NOT TAKE: (a).** Not because the cost is large but because it is now the *only* site outside a law the estate cites by file:line. Leaving it makes the doctrine advisory.

### FORK B · THE ASYNC FAILURE
- **(a) read the status webhook and fall back from there.** The only arm that addresses L1's real mechanism. Requires L7 cured first — **a status callback cannot trigger a fallback for a message whose sid was never persisted.** *These are not independent forks; B(a) is strictly downstream of a sid.*
- **(b) route `:866` through the one door.** Small, correct, and cures the *bride-turn corruption* half of L4 immediately. **It does not cure L1**, because the door's fallback is unreachable — so on its own it converts a corrupted bride turn into a clean silent failure. **That is still a real gain and it is separable.**
- **(c) both.**
- **★ (d) — I ADD THIS ARM AS THE PREREQUISITE:** **persist a sid at every notification send.** Without it, (a) is unimplementable and L7 stands. **This is the load-bearing arm and it is currently invisible in the fork list.**
- **I WOULD TAKE (b) NOW AND (d) NEXT, AND HOLD (a) UNTIL (d) IS GREEN.** I would not take (a) first: it would be built against rows that do not exist.

### FORK D · WHO SPEAKS TO THE BRIDE — **RE-FRAMED BY L6**
The arms as written assume authorship. **They should be re-put as: revive `replyToCouple.js`, or re-site its logic in the TS engine, or leave the capability absent.**
- **(a) Donna writes raw into `couple_thread`.** Conflicts with the founder's Eliza ruling.
- **(b) Eliza speaks it in her own voice.** *Chair leans here; `couple.eliza_enabled` is **FOUNDER-WITNESSED true**, F-09.168's precedent governs.* **I concur, with one correction:** `replyToCouple.js:145–152` writes `sent_by: 'agent'` and its header rules *「 this lib does NOT compose or reframe — it only delivers and logs 」*. **That delivery/composition split is exactly what arm (b) needs** — Eliza composes, the revived lib delivers. The two rulings are compatible and the seam already exists.
- **(c) verbatim, marked as the vendor's words.**
- **★ (e) — I ADD:** whatever arm is taken, **`replyToCouple.js` gets a defused-island label THIS sitting or the next**, independent of the capability ruling. The label is not the capability. F-05.56's own text says the deletion-or-revival is one ruled act; **the missing label is a separate, cheaper, docs-only defect and it is why this capability was lost from view for a whole tenure.**
- **THE ARM I WOULD NOT TAKE: reviving the JS wire to get the tool back.** That resurrects `systemPrompt.js`'s dead money copy (`:159–161`, `:378`), which is off-register under the founder's own house money law. **Re-site the lib; do not revive the corpse around it.**

### FORK E · THE CONFIRMATION MODEL
**As the chair instructed, I lay out the arms and stop. No recommendation.**
- **(E1) No confirmation.** The vendor's instruction is the authorisation; the message goes. Fastest; the vendor's words reach a customer without a second gate.
- **(E2) One word.** The agent composes, shows the bytes, and sends on any affirmative. One round-trip.
- **(E3) Two words.** Compose → show → confirm → send, with the confirmation naming the recipient explicitly ("Send this to Priya?"). Guards the wrong-recipient case, which `replyToCouple.js:63–75` already flags as real (it refuses to guess among multiple threads).
- **(E4) Confirmation only above a threshold** — e.g. any message containing a money figure. Mixed regime; needs a rule about what counts.
- **The axis is the founder's own liability for bytes sent in his name to a paying customer, and the chair correctly declines to weigh it. This is his call.**

### NEW FORK F · THE FABRICATED-DEED GUARD *(arising from census (d))*
- **(a) leave `relaySeam.ts`'s boundary where it is.** F-06.137's class stays uncovered.
- **(b) extend `refused` authorship to the relay-instruction path**, so a vendor's *「 tell her X 」* that produces no dispatch carries a structured refused-fact and the existing seam fires. **The file itself instructs this at `:44–47` and requires its site-count comment be updated in the same act.**
- **(c) treat it as dissolved by L6's cure** — per the CE addendum, F-06.137 dissolves when the send actually works. **Cost: it dissolves only for the send case. Any other fabricated deed stays uncovered.**

---

## 4 · COPY INVENTORY — CURRENT vs PROPOSED

**ZERO BYTES SHIP FROM THIS SITTING.** Every proposal is listed for the founder's word and nothing else.

| # | site | CURRENT (verbatim at `904aaf1`) | PROPOSED | why |
|---|---|---|---|---|
| C1 | `vendorInbound.js:863` fallback notif | `New enquiry via your TDW link from {phone}. I'm collecting their details now.` | **no change proposed** | founder-vetoed; L4's cure is structural, not copy |
| C2 | `leadPings.js:81–82` `HEAD_3`/`HEAD_4_ONE` | `He has already seen the alert on his handset — do not re-announce it, just answer what he asks.` | **flagged, not proposed** | **This copy is now false on the L4 path and on any async failure: he has NOT necessarily seen it. If Fork A(c) or (e) is taken, this line must be re-put. I do not propose bytes for a fork not yet ruled.** |
| C3 | new — vendor-facing, if Fork B(d)+(a) taken | *(none exists)* | *(none proposed)* | a re-delivery notice needs the founder's word on whether he wants one at all; asking before drafting |
| C4 | `replyToCouple.js` header | *(no defused-island label)* | **a label in the house form**, docs-class, no user-facing bytes | Fork D(e) |

**THE ONE COPY FACT THE CHAIR SHOULD CARRY FORWARD:** the only *false* vendor-facing bytes I found are **C2**, and they are false only because the mechanism beneath them degraded. **No copy was minted this sitting. No copy is proposed for shipping.**

---

## 5 · FINDINGS PROPOSED — F-06.140 → F-06.146

Filed to my allotted band. **The register is the chair's; these are proposals.**

| # | finding |
|---|---|
| **F-06.140** | `enquiryAlert.js`'s 131047 catch is **unreachable by construction** on the Meta lane: `metaCloud.js:87–95` throws only on non-2xx, and out-of-window failure arrives 200-then-webhook. The template fallback has never been reachable. |
| **F-06.141** | `vendorInbound.js:866` sends a vendor notification bare and **uncaught**, re-instancing F-08.85's bride-turn corruption on the TDW-link path — the one path the 2026-08-08 message took. |
| **F-06.142** | `leadPings.js:159–162` stamps at fetch, the estate's **sole deviation** from its own written send-first-stamp-second doctrine (`collab.js:640–645`, `brideCron.js:57–59`, `demoLeadAlert.js:311–318`). |
| **F-06.143** | Notification sends persist no `twilio_sid` (`engine.js:594–600`), so `index.js:223`'s status update matches zero rows — **and the update is blind**, with no row-count check, so the failure to record is itself unrecorded. |
| **F-06.144** | `src/lib/vendor/replyToCouple.js` is the **unlabelled fourth ring** of the M5 orphaning. A complete, window-honest vendor→bride instrument is dead and carries no defused-island header, unlike its three labelled siblings. The capability loss was never connected to the orphaning. |
| **F-06.145** | `relaySeam.ts`'s declared coverage boundary (`refused`-bearing hands, two sites) **excludes the relay-instruction class**, so the estate's own fabricated-deed guard cannot reach F-06.137. |
| **F-06.146** | **38 of 56** send sites discard the return value, so `whatsapp.js`'s `blocked` sentinels (`:133`, `:139`, `:153`) are unread. Opt-out refusals, unresolved-lane refusals and media refusals are silent successes at those sites. |

**REQUESTS TO THE CHAIR FOR ADDRESSES OUTSIDE MY BAND.** F-06.146 and the twelve-file no-sid class may belong in F-08 or F-10. **I request those addresses at the moment of need rather than quoting a floor forward.** None quoted here.

---

## 6 · WHAT I COULD NOT DO — DECLARED, NOT PAPERED OVER

1. **No SQL, no live flag, no Railway log.** Every production statement in §1 is marked FOUNDER-WITNESSED and re-attributed to him.
2. **The four-flags/three-true premise in the kickoff's §5 is UNWITNESSED by me** and I decline to restate it. It needs the founder's `SELECT` before any sitting quotes it as a law.
3. **`scripts/` and `tools/` were not censused.** My send-site count is a `src/`-only floor.
4. **dreamos-pwa was read-only and I did not census it.** The PWA door passes `recentActivity` (`leadPings.js:69–71` names `api/vendor-engine/chat.js:1457/:1550`) — **if the PWA drains the same shelf, L5 has a second mouth I have not counted.** Named, not derived.
5. **No bench was written**, per §4's zero-bytes rule. Every claim is a grep or a read, and both-ways proof is owed by whichever sitting ships the cure.

---

## 7 · PROTOCOL ATTESTATION

- **Fetch-first before any claim** — observed; both tips re-derived at §0, delta none.
- **Run the command before the ruling** — observed; four chair claims corrected (`enquiryAlert.js:113`, `leadPings.js:145-160`, L4's severity, L6's central assertion).
- **A default in the tree is not the live value** — observed; every live-state claim re-attributed to the founder or declared underived.
- **An inventory that counts controls in a single state is a claim about that state** — observed; §2 opens with its state declaration.
- **SQL provenance** — no SQL authored. Nothing to witness.
- **The copy gate** — no byte minted; one line flagged as newly false and deliberately not re-drafted.
- **The register is the chair's** — proposals only, inside F-06.140–.146; no floor quoted forward.
- **Report, never adapt** — the kickoff named `relaySeam.ts` nowhere and named `replyToCouple.js` nowhere; both are reported, neither invented.
- **Absent-subject guard** — no instrument written this sitting, so no import to guard.
- **D-10 STOP** — halted at the report. **No cure built, including the ones I would take.**

**§7 APPLY CHAIN, QUOTED BACK VERBATIM:**

```
unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip
```

---

## 8 · THE VETO SLOT

**Bytes awaiting the founder's word: NONE.**

Nothing in §4 is proposed for shipping. **C2 (`leadPings.js:81–82`) is flagged as newly false and awaits a fork ruling before any byte is drafted.** **C3 is a question, not a draft: does the founder want a vendor-facing re-delivery notice at all?**

**The one thing I ask him for that is not copy:** the `SELECT` on all four `admin_config` lane-flag rows, so §5's law can stop resting on an unwitnessed premise.

---

**CLOSING.** The estate did not fail to imagine this. It built the honest send, wrote the window check, wrote the comment explaining exactly why a naive send would let it lie to the vendor about a delivery — and then deleted the caller and never labelled the corpse. **The disease named in the kickoff's closing sentence has a cure sitting in the repository, dead, since arc M5.**
