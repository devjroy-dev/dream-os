# TDW_05 TRANSPORT MIGRATION — M1a HANDOVER (bride lane, OUTBOUND)
**Base:** dream-os `9462459` (HEAD at build, == origin/main, fetched) · **Sealed at:** _<filled on founder push>_
**Block:** TDW_05 transport migration (vendor/bride Twilio→Meta), sequenced before P4 · **Doctrine:** TDW_BUILD_PROTOCOL.md
**This commit:** M1a — the outbound half of the bride-lane cutover. Ships DORMANT. Its own commit; M1b (inbound) follows.

---

## 1. WHAT M1a SHIPS (one file changed, one bench added, this doc)
- **`src/lib/whatsapp.js` — body-rewired (CE §4).** When `from` resolves to a Meta-live lane in this
  process, the send routes to the Meta Cloud API via `metaCloud.sendMetaText`; otherwise it falls
  through to Twilio, **byte-identical** to the pre-migration sender. The ~80 call sites are unchanged.
- **`scripts/b05_m1_transport_bench.js` — new, 16/16, non-vacuous.**
- **This handover.**
- **No SQL.** No migration ruled (CE §5): inbound wamid rides `messages.message_sid` (0084), outbound
  wamid rides `twilio_sid` (both `text`; documented misnomer, house law forbids renaming from code).
  `0086` stays free for P4's `nudge_optout`.

## 2. WITNESSED (by command, at base `9462459`, re-runnable)
- `node --check src/lib/whatsapp.js` clean.
- `b05_m1_transport_bench` **16/16**, including the chair's #1 concern — **Twilio byte-identity**
  proven by a *reference oracle* that reconstructs the pre-migration param logic verbatim and asserts
  the new Twilio branch produces identical `{from,to,body,mediaUrl}` across a 6-case matrix
  (prefixed/unprefixed from+to, media, >10 truncation, default-from), plus a mutation guard.
- Meta routing **collision-proof** (CE §2 refinement): a lane is Meta-live only where its
  phone-number-id env is present in that process; a vendor process — lacking `BRIDE_PHONE_NUMBER_ID` —
  can never resolve a `+14787788550`-literal send to the bride Meta number.
- F-05.2 opt-out gate fires **only on the Meta branch** (Twilio path never consults it → byte-identical),
  and **degrades to a no-op without supabase** (benches stay byte-stable).
- wamid returns in `.sid`; media-on-Meta is a **named refused gap** (M1 text-only), never a silent drop.
- The seven sealed benches byte-stable: **checker 101 · wa_door 32 · describe 18 · webhookcore 43 ·
  movementb 56 · p2_sendwa 49 · b5c 47**. W-1 grep on the diff: clean (no soul/prompt/voice/wording).

## 3. DECLARED — NOT CLAIMED (founder-gated)
- **No live Meta send has occurred.** With `BRIDE_PHONE_NUMBER_ID` unset (prod today), `metaLaneFor`
  returns null for every send → pure Twilio → byte-identical. **M1a is fully dormant for Meta on deploy.**
- The bride Meta lane (and its F-05.2 gate) activate only at the founder's provisioning act — see §5.

## 4. F-05.2 STATUS (its home is now this block)
Cure **mechanism built**, not blanket-closed. The gate lives in the one shared sender and activates
per-lane at each cutover: **bride at M1 cutover, vendor at M2.** Full closure lands when both lanes are
on Meta. Filed accordingly, not as "closed."

## 5. CUTOVER — the founder's provisioning act (do NOT run until BOTH M1a + M1b are in)
Atomic per number. Dashboard steps (values entered in Railway env / Meta dashboard, never in files):
1. Provision the bride Meta phone-number-id; set **`BRIDE_PHONE_NUMBER_ID`** on the **bride service only**.
   (`META_WABA_TOKEN` / `META_APP_SECRET` / `META_VERIFY_TOKEN` already exist from the marketing lane.)
2. Set **`BRIDE_WHATSAPP_NUMBER`** to the bride's own number (defaults to the current `+14787788550`).
3. Set **`VENDOR_WHATSAPP_NUMBER`** to the vendor lane's distinct number so no vendor send ever carries
   the bride literal (belt-and-suspenders on top of the service-scoped collision-proofing).
4. Point the bride WABA webhook at the bride service's **`POST /webhook/meta`** (M1b) and complete the
   **GET verify** handshake.
5. Witness on the 3 test accounts: inbound reply, opt-out cycle, delivery status. Reds file with row ids.

## 6. DRIFTS RECORDED (repo is truth)
- Kickoff's "clauses 17/18" of the transport ruling do not exist (doc has 1–7 + number-architecture;
  clauses 5/6 bind).
- `sendWa.js` header comment is stale (says `defaultSendTemplate` throws `WaTemplateTransportNotWiredError`;
  the P3 code routes through `sendMetaText`). Not touched here; flag for a comment fix.
- The straggler-template follow-up (below) is content-touching and therefore NOT this block.

## 7. WHAT M1b INHERITS (next commit, also dormant)
- Verbatim-extract the bride turn-core into `processBrideInbound({phone,body,profileName,messageId,
  media,internalReplay},{reply,done})`, decoupled from `req`/`res`. The Twilio handler parses → calls it
  UNCHANGED; a new dormant `GET/POST /webhook/meta` (handshake → fast-200 → `normalizeMetaInbound` →
  wamid dedupe via the same webhookCore LRU + durable `message_sid` → `extractStatuses` →
  `delivery_status` matched on `twilio_sid`) calls the SAME core.
- **The load-bearing W-1 risk.** Verbatim-then-diff, no logic change. The byte-stability bench must TRULY
  drive one fixture through BOTH paths over a supabase fake faithful enough to reach the real branches,
  asserting outbound bytes identical. A hollow green is worse than a declared gap.
- `webhookCore`'s Twilio functions + `whatsapp.js`'s Twilio path stay retired-but-present until M2
  (both lanes off Twilio) — `webhookcore 43` byte-stable throughout.

## 8. FOLLOW-UP FILED (chair, at M1a seal) — NOT this block
The business-initiated **stragglers** (`index.js` vendor-notifies 462/570/673/790, `replyToCouple.js:137`,
`enquire.js:79`, `concierge.js:84`, `collab.js:334/414/418`, the vendor briefing): once their lane is on
Meta, a window-closed send needs an approved template. Converting them changes wording (W-1-forbidden here),
so it rides P4's template work as a separate content pass. Until then, ruled option (a): route free-form,
window-closed → typed logged refusal, never a silent drop.
