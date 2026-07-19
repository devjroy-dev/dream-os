# TDW_05 TRANSPORT MIGRATION — M1b HANDOVER (bride lane, INBOUND)
**Base:** dream-os `693ce8e` (M1a CE-31 seal; fetched, == origin/main) · **Sealed at:** _<filled on founder push>_
**Block:** TDW_05 transport migration · **Doctrine:** TDW_BUILD_PROTOCOL.md
**This commit:** M1b — the inbound half of the bride-lane cutover. Ships DORMANT. Pairs with M1a; cutover is atomic.

---

## 1. WHAT M1b SHIPS
- **`src/lib/brideInbound.js` — new, requirable, side-effect-free.** Exports `processBrideInbound(inputs, deps)`
  — the bride turn-core, VERBATIM-extracted from the old `brideIndex.js` Twilio handler (lines 174-636 at
  base `693ce8e`) — plus the two per-transport input normalizers `twilioInputsFrom` / `metaInputsFrom`.
- **`src/brideIndex.js` — rewired (1169 → 744 lines).** The ~500-line inline handler is gone; in its place a
  thin Twilio handler (parse → sig → dedupe → `twilioInputsFrom` → `processBrideInbound`) and a DORMANT
  `GET/POST /webhook/meta` handler that calls the SAME core. `express.json` now captures `req.rawBody` for
  the Meta signature. No content moved out of the core.
- **`scripts/b05_m1b_inbound_bench.js` — new, 6/6, non-vacuous** (it caught two real bugs before passing — §4).
- **This handover.** No SQL (inbound wamid rides `messages.message_sid`; delivery status matches on `twilio_sid`).

## 2. WHY THIS IS W-1-SAFE (byte-identical reply content across transports)
Both transports normalize their raw payload to the SAME content-bearing inputs, then call ONE shared core.
They cannot diverge — that is structural, not hoped-for. Two independent proofs, both by command:
- **Verbatim-then-diff.** The extracted core is byte-identical to the original region minus ONLY the
  mechanical transport-decoupling (11 `res`-returns → `return;`; `req.body.MediaContentType0/MediaUrl0` →
  normalized `mediaContentType/mediaUrl`; `req.body` dead-letter payload → `rawPayload`;
  `handleCircleMemberMessage(req)` → a synthetic `{body:{…}}` rebuilt from those same inputs; outer-catch
  `req.body.*` → `messageId`/`phone`). The bench re-derives this diff against `git show 693ce8e` and REDs on
  any drift.
- **Two-path byte-identity.** One fixture driven through the REAL core over a faithful in-memory supabase
  fake (only the LLM turn and the sender are stubbed — ALL branching runs for real) via BOTH transports'
  inputs yields identical outbound reply bytes. Proven on the text path, the circle-member path, and the
  dead-end path; a mutation guard proves the assertion isn't vacuous.

## 3. WITNESSED (by command, at base `693ce8e`, re-runnable)
- `node --check` clean on `brideIndex.js`, `brideInbound.js`, the bench.
- `b05_m1b_inbound_bench` **6/6** (verbatim · input-equivalence · byte-identity text/circle/dead-end · mutation).
- Seven sealed benches byte-stable: **checker 101 · wa_door 32 · describe 18 · webhookcore 43 · movementb 56 ·
  p2_sendwa 49 · b5c 47** — and **M1a `b05_m1_transport` 16/16** unchanged. `webhookCore` untouched.
- W-1 grep on the diff: clean. The only match (`'voice note'`) is a pre-existing media-kind label moved
  VERBATIM (the verbatim proof covers it), not a wording change.

## 4. TWO REAL BUGS THE BENCH CAUGHT (disclosed — this is why the bench is not a hollow green)
- **Bare `req` in the core.** The `handleCircleMemberMessage` call passed `req` (which reads
  `req.body.Media*` internally). In the transport-agnostic core that is a ReferenceError → every circle-member
  turn would have dead-lettered on BOTH transports. Fix: pass a synthetic `{body:{MediaContentType0,
  MediaUrl0}}` rebuilt from the normalized inputs, leaving that 350-line helper untouched.
- **`+E164` divergence.** Twilio `From` is `whatsapp:+E164` (→ `+E164`); Meta `from` is bare digits. The
  bride's phone lookups (users/circle_members) and the reply target would have missed on the Meta path.
  Fix: `metaInputsFrom` normalizes `from` → `+E164` (the Twilio/DB canonical).

## 5. DECLARED — NOT CLAIMED (founder-gated)
- **No live Meta inbound has been received.** `/webhook/meta` is dormant until the bride WABA webhook is
  pointed at it at cutover. The Twilio path is behaviorally unchanged (same core, same inputs).
- **Meta media inbound is a NAMED M1 gap (text-only).** A Meta media message arrives as a media-ID needing a
  Meta media fetch; `metaInputsFrom` passes `mediaContentType/mediaUrl = null`, so the media branches are a
  declared Meta gap (symmetric with M1a's outbound-media gap). The follow-up is a Meta media shim.

## 6. CUTOVER (the founder's provisioning act — atomic, gated on BOTH M1a + M1b + `BRIDE_PHONE_NUMBER_ID`)
Do NOT run until both halves are in. On the **bride service only**: set `BRIDE_PHONE_NUMBER_ID` (+ optionally
`BRIDE_WHATSAPP_NUMBER`); point the bride WABA webhook at `POST /webhook/meta` and complete the `GET` verify
handshake (uses the existing `META_VERIFY_TOKEN`/`META_APP_SECRET`). At that instant outbound (M1a) resolves
the bride lane to Meta AND inbound arrives on `/webhook/meta` — one number, one platform, atomically. Witness
on the 3 test accounts: inbound reply parity, opt-out cycle, delivery-status stamping. Reds file with row ids.

## 7. RETIRED-BUT-PRESENT until M2
`webhookCore`'s Twilio functions (`verifyTwilioSignature`, `normalizeMedia`, `makeTwilioStatusHandler`, the
sid LRU) and `whatsapp.js`'s Twilio fallthrough stay in place and byte-stable — the vendor lane still uses
them, and the bride Twilio handler remains the live path until cutover. They are deleted in M2, once BOTH
lanes are on Meta. `b5_webhookcore_bench` (43) stays byte-stable throughout.

## 8. WHAT M2 INHERITS
Same pattern for the vendor lane: rewire `src/index.js`'s inbound handler to a shared vendor core + a dormant
Meta handler; provision `VENDOR_PHONE_NUMBER_ID` + a distinct `VENDOR_WHATSAPP_NUMBER`. When both lanes are
off Twilio, delete the retired webhookCore Twilio funcs + the whatsapp.js Twilio path, and handle the F-05.5
straggler-templates (window-closed business-initiated sends) as the P4 content pass. F-05.2 fully closes then.
