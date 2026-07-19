# TDW_05 TRANSPORT MIGRATION — M2 HANDOVER (vendor lane, INBOUND)
**Base:** dream-os `3afc4ba` (M1b CE-32 seal; fetched, == origin/main) · **Sealed at:** _<filled on founder push>_
**Block:** TDW_05 transport migration · **Doctrine:** TDW_BUILD_PROTOCOL.md
**This commit:** M2 — the vendor-lane inbound extraction. Ships DORMANT. Vendor OUTBOUND was already handled
by M1a's `whatsapp.js` (the vendor lane resolves to Meta only when `VENDOR_PHONE_NUMBER_ID` is set).

---

## 1. WHAT M2 SHIPS
- **`src/lib/vendorInbound.js` — new, requirable, side-effect-free.** Exports `processVendorInbound(inputs, deps)`
  — the vendor turn-core, VERBATIM-extracted from `index.js`'s Twilio handler (lines 181-970 at base `3afc4ba`)
  — plus `twilioInputsFrom` / `metaInputsFrom`. Same pattern as the sealed `brideInbound.js` (M1b).
- **`src/index.js` — rewired (1001 → 244 lines).** The ~790-line inline handler is gone; in its place a thin
  Twilio handler (parse → sig → dedupe → `twilioInputsFrom` → `processVendorInbound`) and a DORMANT vendor
  `GET/POST /webhook/meta` that calls the SAME core. `express.json` now captures `req.rawBody` for the Meta
  signature. The two former inline `require`s (imageThrottle, vendorCalendarImage) are hoisted to top-level.
- **`scripts/b05_m2_vendor_inbound_bench.js` — new, 4/4, non-vacuous** (it drove the fixture to the REAL
  vendor-self `runTurn` path — the `[agent:engine] reply` log fires once per transport).
- **This handover.** No SQL (inbound wamid rides `messages.message_sid`; delivery status matches on `twilio_sid`).

## 2. WHY THIS IS W-1-SAFE (byte-identical reply content across transports)
Both transports normalize to the SAME content-bearing inputs, then call ONE shared core. Two proofs, by command:
- **Verbatim-then-diff.** The extracted core is byte-identical to the original region minus ONLY the mechanical
  transport-decoupling (16 `res`-returns across BOTH TwiML variants `<Response></Response>` / `<Response/>` →
  `return;`; `req.body.MediaUrl0` → `mediaUrl`; outer-catch `req.body.*` → `messageSid`/`phone`/`rawPayload`;
  the two inline `require`s → injected via `deps`). The bench re-derives the diff against `git show 3afc4ba`
  and REDs on any drift. The 24-dep injection list was proven COMPLETE by a bare-call scan (every call site
  resolves to a dep or the in-core `levenshtein`).
- **Two-path byte-identity.** One onboarded-vendor TEXT fixture driven through the REAL core over a
  deterministic in-memory supabase fake (only the LLM turn + the sender stubbed; ALL routing runs for real)
  via BOTH transports' inputs yields an identical outbound send SEQUENCE — reaching the real vendor-self
  `runTurn` path. A mutation guard proves the assertion isn't vacuous.

## 3. WITNESSED (by command, at base `3afc4ba`, re-runnable)
- `node --check` clean on `index.js`, `vendorInbound.js`, the bench.
- `b05_m2_vendor_inbound_bench` **4/4** (verbatim · input-equivalence · byte-identity vendor-text · mutation).
- Seven sealed benches byte-stable: **checker 101 · wa_door 32 · describe 18 · webhookcore 43 · movementb 56 ·
  p2_sendwa 49 · b5c 47** — and **M1a 16/16 · M1b 6/6** unchanged. `webhookCore` untouched.
- W-1 grep on the diff: clean (the only hit is the `vendorInboundDeps` name list, not a wording change).

## 4. DECLARED — NOT CLAIMED (founder-gated)
- **No live Meta inbound has been received.** The vendor `/webhook/meta` is dormant until the vendor WABA
  webhook is pointed at it at cutover. The Twilio path is behaviorally unchanged (same core, same inputs; the
  thin handler's catch replicates the original outer catch verbatim).
- **Meta media / calendar-OCR inbound is a NAMED M1 gap (text-only)**, symmetric with M1a/M1b. `metaInputsFrom`
  passes `mediaUrl = null`; the media + calendar-image branches are a declared Meta gap (Meta media shim = follow-up).

## 5. VENDOR CUTOVER (the founder's provisioning act — atomic, gated on `VENDOR_PHONE_NUMBER_ID` + a distinct number)
On the **vendor service only**: set `VENDOR_PHONE_NUMBER_ID` (+ a DISTINCT `VENDOR_WHATSAPP_NUMBER` — the vendor
lane must be its own Meta number, not the bride's); point the vendor WABA webhook at `POST /webhook/meta` and
complete the `GET` handshake. At that instant vendor outbound (M1a) resolves to Meta AND inbound arrives on
`/webhook/meta` — one number, one platform, atomically. Witness on the 3 test accounts: reply parity,
vendor-notification sends, delivery-status stamping.

## 6. ⚠ THE TWILIO-CODE DELETE IS *NOT* IN THIS COMMIT — IT IS A SEPARATE GATED RETIREMENT (M2b)
The M2 brief said to delete the retired Twilio code at M2 close. **That delete cannot ride a dormant deploy** —
it is a deploy trap (cf. F-05.3), for a concrete reason re-derivable by command:
- `webhookCore.verifyTwilioSignature` / `normalizeMedia` / `makeTwilioStatusHandler` are STILL called by BOTH
  live Twilio inbound handlers — `index.js` (143/172/174) and `brideIndex.js` (143/168/170) — and the two
  `/webhook/twilio-status` routes.
- `whatsapp.js`'s Twilio path STILL serves every vendor + bride send until each lane cuts over.
Deleting any of these at M2-deploy breaks LIVE Twilio traffic on whichever lane hasn't cut over yet. By the
same number-atomicity doctrine that split M1a/M1b, the Twilio transport cannot be removed while any lane still
routes through it.

**Therefore the delete is M2b ("Twilio sunset"), gated on BOTH lanes CONFIRMED LIVE on Meta** (both
`/webhook/meta` handlers receiving, both outbound lanes resolving to Meta). M2b: delete the whatsapp.js Twilio
path + the three webhookCore Twilio funcs + both handlers' Twilio front-halves + the `/webhook/twilio-status`
routes, then re-baseline `b5_webhookcore`. **What retires from that bench:** the signature sections
(valid/invalid/missing-header/disabled), the media-normalization section, and the status-callback sections —
i.e. the reference-oracle tests for `origSignature`/`origMedia`/`origStatusHandler`. **What stays:** inbound-log,
empty-guard, and the service-agnostic dedupe/dead-letter surface (`sidSeen`/`recordSid`/`captureDeadLetter`/
`inboundRow`/`isDuplicateSidError`/`GRACEFUL_TURN_LINE`). The exact new count is fixed at M2b when the delete is
real and the pruning is deliberate — quoting a number now from a rushed scratch-prune would be speculative.

## 7. STATE AFTER M2
Bride + vendor lanes are both build-complete and dormant; cutover is the founder's per-lane provisioning act.
Then: **M2b** (Twilio sunset, gated on both-lanes-live) → **P4** (crons; F-05.5 straggler-templates as the
content pass — vendor-notify sends `index.js:462/570/673/790` etc. ride approved templates for window-closed
Meta delivery) → F-05.2 fully closes once both lanes are on Meta. The P3 opener-template test stays OPEN.
