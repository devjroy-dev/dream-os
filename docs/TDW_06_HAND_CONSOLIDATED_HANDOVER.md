# TDW_06 · THE HAND — CONSOLIDATED HANDOVER

**Written at the close of the sitting that built the vendor→bride relay.**
**Origin tip at writing: `fe18648` (ZIP 6). Bench `b06_relay_hand_bench` 126/126. Gate `npm run build` EXIT 0. Floor unmoved.**

**R-29.34 APPLIES TO THIS DOCUMENT.** Every claim below names where it can be
re-derived. Nothing here is a memory. If a path says "works", the line that
proves it is named; if it says "unbuilt", the grep that shows the absence is
named. **Re-derive before you trust it — the arc's own lesson is that a claim
about a function is not a claim about the wire.**

---

## §1 · WHAT THE HAND IS

A vendor tells his agent to write to a bride. The agent composes, the **door**
stages a row, the exact bytes are shown to the vendor as a quoted artefact, his
affirmative approves, and the estate delivers **window-first** — free-form
in-window, a doorbell template out-of-window, an honest refusal when neither is
possible.

**The disease it exists to end (FINDINGS_LOG CE-212 §②, 2026-08-08):** Harvey
composed, Donna claimed `Sent`, the founder approved bytes he never saw, and no
thread row ever carried the message. Everything in this arc is downstream of
that one evening.

---

## §2 · THE TRUE STATE OF EVERY PATH AT `fe18648`

| path | state | re-derive by |
|---|---|---|
| **door-staged draft** | ✅ **live, production-witnessed** | walk 8 log `[relay:wa] door_staged draft=19825d17…`; `relaySeat.js` symbol `doorStage` |
| **the SHOW frame + E3 confirm** | ✅ live | walk 8 vendor handset; `relaySeat.js` symbol `showBlock` |
| **E3-prime (plain yes, door-adjacent)** | ✅ live | `relaySeat.js` symbols `AFFIRM_PLAIN_RE`, `doorAsked`; bench §10.1–§10.3 |
| **wrong-name / non-adjacent refusal** | ✅ live | bench §10.5, §9.5, §9.6 |
| **window-first discipline** | ✅ **never once failed in eight walks** | `relayToCouple.js` — `coupleWindowOpen` precedes `sendWhatsApp`; bench §3.9, §4.1, §4.2 |
| **lane pin (free-form + doorbell)** | ✅ live | `relayToCouple.js` `VENDOR_WHATSAPP_NUMBER`; doorbell via `phoneNumberIdFor('vendor')`; bench §3.2/§3.3, §12.3/§12.8 |
| **doorbell (template OOW)** | ✅ **rung, delivered, read** | walk 8 `doorbell_rang wamid=…` + Meta `status=delivered` 11:21:27 |
| **F3 suppressed on a relay turn** | ✅ live | walk 8 `F3 suppressed — this turn's own outcome (window_closed_doorbell) stands` |
| **supersede-on-stage** | ✅ live | `coupleDrafts.js` symbol `supersedeOpenStaged`; bench §8.9–§8.12 |
| **0118 `refusal_reason`** | ✅ applied in production | founder's `information_schema` paste, 11 columns, 2026-08-11 |
| **auto-send on reopened window** | ⚠️ **CONSUMER ONLY — NO TRIGGER** | `grep -rn windowJustOpened src/` → hits in `relaySeat.js` **only**. F-06.178. |
| **receipt chain №14/№15** | ⚠️ **seated but unreachable** | `src/index.js` status loop calls `relayReceipt`; it needs a `vendor_relay` row with the wamid — the doorbell writes one (`ringDoorbell`), the auto-send never runs, so no receipt has ever fired |
| **bride's reply routing** | ❌ **DOORBELL-BLIND** | `vendorInbound.js:1028` `threadCount >= 2` branch. F-06.177. |
| **her inbound persistence on that branch** | ❌ **DROPPED** | that branch returns at `:1043` with no `messages` insert. F-06.179 (new, below). |
| **PWA door** | declared-refusing by design | `relaySeat.js` `PWA_RELAY_UNAVAILABLE_LINE`; parity micro chartered, unbuilt |

---

## §3 · THE WALK-CURE CHAIN, `.157` → `.179`

Each entry: the disease, its disposition, and where to re-derive.

**F-06.156 — the money-provenance floor does not cover bytes leaving for a bride.**
`provenanceHold.ts` `MONEY_WRITE_FIELDS` is an allowlist of five *record*-write
pairs; the relay's signals are absent by construction. A rupee figure the vendor
never said can reach a bride. **Mitigated by E3 (he sees and affirms the bytes), never cured. OPEN.**

**F-06.157 — hands from one turn, words from another.** Fork D re-runs the actor;
`replyText` came from `retry` while the seat read `result`. **CURED** —
`effectiveResult`, paired-count cell §7.8.

**F-06.158 — the door spoke bytes the model could not remember.** The SHOW frame
lived on the wire and never in `engine.messages`, so the vendor answered a
question Victor had no record of asking. **CURED** — `patchComposedReply`
extracted to one home, both doors. Bench §8.1–§8.4.
**Its cost, priced late: it taught Victor the frame to imitate (F-06.166).**

**F-06.159 — a claimed send with zero hands walked.** **CURED** — `RELAY_CLAIM_RE`
+ a fourth deed class witnessed by `donna_relay_send` alone. Fired live 2026-08-11 09:29.

**F-06.160 — no supersede; two open drafts for one vendor.** **CURED**, and first
fired at walk 8 once the door began staging.

**F-06.161 — `IMPERATIVE_STEMS` cannot take a tenth stem.** The nine ARE
`harveySoul.ts:98`'s nine verbs and `b06_forkc_wireguard_bench` §14.2 forbids a
tenth. W-1 shuts the soul. **§0.2-BLOCKED, NOT BUILT, asserted by bench §8.8. OPEN.**

**F-06.162 — reading a question is not having a hand to answer it.** **CURED** —
the `pendingRelay` block on the CE-4 seam.

**F-06.163 — the draft crosses twice.** **PARTIALLY CURED — see F-06.175.**

**F-06.164 — F3 spoke for a lane that knows nothing of a wire.** **CURED** — the
relay lane selects its own vetoed bytes.

**F-06.165 — the intercepted costume survived in the record.** **CURED** as arm
(α), mechanical.

**F-06.166 — the cures taught the costume.** Door frames patched into the thread
as Victor's own speech became a template he reproduces without hands.
**Specimen 09:49:37: a fabricated 50k draft frame, zero rows.** **CURED** by the
confirm-shape family, acquitting on the store.

**F-06.167 — `went through` walked.** **CURED** — relay completion limbs.

**F-06.169 — a `let` read above its own declaration took the whole door down.**
A TDZ throw on **every vendor turn**, invisible to `node --check` and to every
grep-shaped cell. **CURED** — §11.1 names the exact address at a broken tree.

**F-06.170 — a byte promised a state the machine did not hold.** ④/④b said "the
draft is saved" over a row already `refused`. **PRINCIPLE RULED, applied at
R-29.35:** a rung doorbell now leaves the draft `approved`, `resolved_at` NULL.

**F-06.171 — a silent decline is indistinguishable from a seat that never ran.**
**CURED** — entry log + six named declines. **This is the single most useful
thing built in the arc**; it ended walk six's mystery in one line.

**F-06.172 — two sender contracts, one reader.** `ringDoorbell` judged
`out.sent !== true` against a template return of `{ ok, wamid }`. **A delivered
message was reported to the vendor as a failure, one second before Meta said
otherwise.** **CURED** — `SENDER_CONTRACTS` + `readSend(kind, out)`, one written
home. **The bench was the specimen: its double spoke the free-form shape.**

**F-06.173 — F3 on a relay moment.** **CURED — and the cure was incomplete: see F-06.176.**

**F-06.174 — the doorbell had no thread to write onto.** **CURED** —
`findOrCreateCoupleThread` extracted to one home.

### THE FOUR (FIVE) THE SUCCESSOR INHERITS

**F-06.177 — THE BRIDE'S FAILURE. LEAD WITH IT.**
The doorbell names her vendor in its own bytes. She replied, and
`vendorInbound.js:1028` asked her to choose between three vendors.
**Re-derive:** walk 8 log `[routing:disambiguation_asked] +919625759924 candidates=3`.
**Chair-endorsed proposal:** the branch must ask the store *"is a doorbell
standing for this phone?"* before asking her anything — the draft row carries
`vendor_id`, the template carries `{{2}}`.
**This is the only failure in the arc with a person on the other end who did not sign up for it.**

**F-06.178 — the auto-send has a consumer and no producer.**
**Re-derive:** `grep -rn windowJustOpened src/` → `relaySeat.js` only.
**Proposal:** the trigger lives at her arrival — the same act as .177.
**Note for your read-first: R-29.34 did not catch this because §13.6 supplies
`windowJustOpened` from the cell itself. Member (a) demands the DOOR'S real
entry point; I applied it to the seat and not to the trigger.**

**F-06.176 — the costume now ships *beside* the truth.**
Suppressing F3 was right; leaving Victor's prose standing was not. The vendor
read *"Message sent to Priya."* followed by ④b-v2 saying she'd been *notified*.
**Re-derive:** walk 8, 11:21:25.
**Proposal:** when the seat has an outcome AND the turn is a costume, the relay
line **replaces** the model's prose.

**F-06.175 — the anti-duplicate block is one turn late by construction.**
`pendingRelayBlock` is built from the open staged row **at turn start**; on the
staging turn none exists. **The instruction that prevents the duplicate can
never be present on the turn that produces it.**
**Re-derive:** walk 8, 11:20:53 — Victor's `Draft ready for approval:` above the door's frame.

**F-06.179 — NEW, FILED IN THIS HANDOVER. Her reply opens Meta's window and leaves the estate's predicate reading closed.**
The `threadCount >= 2` branch returns at `vendorInbound.js:1043` **with no
`messages` insert**. `coupleWindowOpen` scans `messages` on `couple_thread` rows.
**So her 11:22:27 reply opened the 24-hour window at Meta and the estate cannot
see it.** Even with .177 and .178 cured, an auto-send would consult a predicate
that still says closed.
**Confirm before building:** the founder's window SELECT (§5) — if `window_now`
reads `CLOSED_OR_NEVER` after her 11:22 reply, this is confirmed live.

---

## §4 · THE VETOED BYTE REGISTRY

All in `src/lib/vendor/relaySeat.js` unless noted. **APPROVED-COPY-CARRIES-ITS-HASH:
the veto words ride in-comment beside each constant.**

| # | symbol | founder's word |
|---|---|---|
| ① | `showBlock` | 「 approve all 」 2026-08-11 |
| ② | `showBlock` (confirm) | 「 approve all 」 + 「 1-yes. infact, even when name is known, phone number should be mentioned. 」 |
| ③ | `sentLine` | 「 approve all 」 |
| ④ | `windowClosedLine` | 「 approve all 」 |
| ④b | *(retired)* `doorbellLine_RETIRED_v1` | superseded |
| **④b-v2** | `doorbellLineV2` | **founder-authored**, 2026-08-11 |
| ⑤ | `windowUndeterminedLine` | 「 approve all 」 |
| ⑥ | `expiredLine` | 「 approve all 」 |
| ⑦ | `sendFailedLine` | 「 approve all 」 (opt-out split shelved) |
| ⑧a | `noNumberLine` | 「 approve all 」 |
| ⑧b | `noLaneLine` | 「 approve all 」 |
| ⑨ | `mismatchBlock` | 「 approve all 」 |
| ⑩ | `PWA_RELAY_UNAVAILABLE_LINE` | 「 approve all 」 |
| №12 | `askWhoLine` | 「 yes approved 」 — **§0.2 R-10: vetoed before drafted; founder first read them at delivery** |
| №13 | `declinedLine` | 「 approve 」 — same caveat |
| №14 | `deliveredLine` | 「 approve 」 |
| №15 | `readLine` | 「 approve 」 |

**Standing copy law:** 「 word for word 」 is **struck from every vendor-facing byte**
(founder, 2026-08-11). Equality is A1's **cell**, never a sentence.
Template `tdw_enquiry_update_couple` is in `src/lib/templates.js`, authored from
the wire witness and no other source (F-08.75).

---

## §5 · FIXTURE STATE — RUN THESE BEFORE THE FIRST WALK

**The successor must not author a card from this section. Re-derive it.**

```
SELECT id, state, couple_phone, left(body, 60) AS body, created_at, resolved_at, refusal_reason
FROM public.pending_couple_drafts
WHERE vendor_id = '23165e38-6510-4639-ab6a-9f35bab93742'
ORDER BY created_at DESC LIMIT 5;
```
**Expect `19825d17-9c54-409f-9893-723f9f84b973` in state `approved`**, `resolved_at`
NULL, `refusal_reason` beginning `doorbell:` — walk eight's draft, alive by
R-29.35 and expiring 24h from 2026-08-11 11:20 UTC.

```
SELECT c.id, c.vendor_id, c.counterparty_phone, c.last_message_at,
       (SELECT max(m.created_at) FROM public.messages m
         WHERE m.conversation_id = c.id AND m.direction = 'inbound') AS last_inbound_at
FROM public.conversations c
WHERE c.counterparty_phone = '+919625759924' AND c.kind = 'couple_thread'
ORDER BY c.last_message_at DESC NULLS LAST;
```
**Three rows, three different vendors — ours is `23165e38…`.** This is why the
disambiguation branch fires, and it is F-06.177's precondition.
**If `last_inbound_at` predates 2026-08-11 11:22, F-06.179 is confirmed live.**

**Fixtures:** vendor `+919888294440` / `23165e38-6510-4639-ab6a-9f35bab93742` /
agent `d02c7a9a-8622-4543-aa40-13d0911faf9b` · bride `+919625759924` (`Priya`,
lead `8df93b99-a519-429e-abec-cd004bf408ce`).
**`masterplan:86`'s test map is stale** — founder-corrected 2026-08-11.

---

## §6 · THE LAWS THIS ARC PAID FOR

**R-29.34 — THE REACHABILITY LAW.** No live-surface delivery ships on correctness
evidence alone. Both members: **(a)** a cell driving the **door's real entry
point** (see bench §13.11 — building it meant running `processVendorInbound` and
reading where it stopped, five times); **(b)** a named production witness the
founder can read on the next walk. **A bench that proves a function correct
without proving it reached is a claim about the function, not about the wire.**

**THE DOOR IS THE ORGAN; THE MODEL IS A SIGNAL.** The engine holds no store
writer and no transport (bench §5.1). Four walks proved the model an unreliable
trigger; every cure that added *context* handed the costume better material.

**A BYTE NEVER PROMISES A STATE THE MACHINE DOES NOT HOLD** (F-06.170).

**A CELL THAT FAILS WHEN A FILE WRITES DOWN ITS OWN REASONING IS A CELL THAT
FORBIDS THE ESTATE FROM EXPLAINING ITSELF.** Five cells in this sitting read a
comment as code. Strip comment lines before asserting about code.

**A DOUBLE THAT SPEAKS A CONTRACT ITS SUBJECT DOES NOT SPEAK IS NOT A GUARD**
(F-06.172). Derive doubles from the real sender's return, by command.

**A DOOR THAT DECLINES WITHOUT SAYING WHY IS NOT OBSERVABLE** (F-06.171).

---

## §7 · THE ARC'S OWN SELF-KNOWLEDGE — verbatim, as the chair ordered

> **That is how the estate finds truth — but it is also how a system ends up with
> a doorbell whose reply the router cannot read.**

Eight walks, six ZIPs, and every delivery was a correct cure to the previous
walk's specific failure. The method works and it is why every finding above
exists. It is also why the bride-side path has been patched from six directions
and never once designed from her end. **The successor's charter is that coherent
pass, and .177 leads it because she is the only person in this arc who did not
sign up for it.**

**The ledger, plainly: eight walks, ZERO unearned bytes to the bride, one earned
one — delivered and read. Every refusal correct. Every failure on the safe side.
Every defect self-caught and disclosed in-band.** The two mechanisms that gate
the wire — window-first and the wrong-recipient guard — **never failed once.**
Everything that broke was upstream of them, and that is not luck; that is where
the effort went.

**Trust evidence over narrative. Including this document.**
