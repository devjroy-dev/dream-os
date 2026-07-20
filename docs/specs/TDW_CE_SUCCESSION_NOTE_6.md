# TDW — CE SUCCESSION NOTE VI (Chief Engineer chair handoff)

**Written:** 2026-07-20, by the sixth CE session at its close (seam-law bank — see §9), for its successor (the seventh chair).
**Authority:** the successor inherits ALL standing rulings herein and in the repo. The repo is truth; this note carries only what needs pointing to. Every state claim below is re-verified at HEAD before you rely on it.
**Verify-first law applies to this note itself.** HEAD at bank = `b59452d` (CE-36). FINDINGS_LOG tip = CE-36. Re-fetch origin and confirm before acting — a stale clone is a named defect class (CE-22: fetch or it guesses).

## 1. THE ROLE
The CE authors specs, issues kickoffs, rules on every executor question with evidence, audits deliveries by command at origin, and NEVER executes. Executor sessions build; the founder (Dev) runs migrations/SQL/smokes/**cutovers** and holds copy veto on all vendor/couple-facing words. The two-chair split is deliberate — the chairs audit each other; NEVER collapse them. The corrected executor law (from Note V §1, still standing): **executors CAN fetch/clone/build/bench and disclose their real output** — the surviving rule is *never claim a by-command result you did not run*. You re-derive every delta at origin yourself regardless. dream-os is the working clone; clone `dreamos-pwa` separately for any PWA delta.

## 2. STATE AT HANDOFF (verify at HEAD `b59452d`)
Block 05 (WEBHOOK) is deep into the transport migration. Sealed spine: F-04.65 · P1 (webhookCore) · P2 (six templates Meta-approved) · P3 Movement A (prospect lane + Meta transport swap) · P3 Movement B PARTIAL live-witness (sandbox smoke passed — inbound verify + free-form send + opt-out cycle witnessed; the **opener-template send `tdw_marketing_opener` stays OPEN** on the real number).

**The vendor/bride Twilio→Meta transport migration is BUILD-COMPLETE, both lanes DORMANT:**
- **M1a** (CE-31) — `whatsapp.js` outbound body-rewire; Twilio fallthrough byte-identical; F-05.2 gate inside the Meta branch.
- **M1b** (CE-32) — bride inbound `processBrideInbound` verbatim extraction + dormant `/webhook/meta`. Bride lane build-complete.
- **M2** (CE-33) — vendor inbound `processVendorInbound` verbatim extraction + dormant vendor `/webhook/meta`. Both lanes build-complete.
- Every send still leaves over Twilio, byte-for-byte, until the founder cuts each lane over. Nothing has cut over.

**F-05.6 (OTP/auth cutover-safety) is CURED** (CE-34 audit → CE-35 re-ruling → CE-36 seal):
- **(a) PRIMARY, sealed:** OTP rides Meta AUTHENTICATION templates via `src/lib/otpSend.js` — keys on `*_PHONE_NUMBER_ID` presence, calls `metaCloud.sendMetaTemplate` DIRECTLY (never `whatsapp.js` → un-gateable by F-05.2 by construction; auth is opt-out-exempt). `b05_f056_otp_meta_bench` 33/33 non-vacuous.
- **(b) FALLBACK, sealed:** the dedicated `OTP_WA_NUMBER` Twilio path (`b05_f056_otp_hotfix_bench` 21/21) — dormant emergency backstop, survives M2b.
- **The whole lane flips on ONE var:** provisioning `BRIDE_PHONE_NUMBER_ID` moves the bride conversation AND couple/circle OTP to Meta together; `VENDOR_PHONE_NUMBER_ID` does the same for vendor.

**The numbers (repo defaults, founder-confirmed correct):** bride lane = **+14787788550** (flipped by `BRIDE_PHONE_NUMBER_ID`; couple + circle OTP); vendor/shared lane = **+917982159047** (flipped by `VENDOR_PHONE_NUMBER_ID`; vendor OTP; the shared vendor-assistant line per P-06.T clause 17 — transport swaps beneath, shared-number model unchanged).

**Findings banked:** F-05.1 (owner-XOR → 1-of-3, 🟢) · F-05.2 (opt-out reach; cure-built, activates per-cutover, fully closes at M2b) · F-05.3 (Node-22/realtime-js fresh-install deploy trap; per-service `RAILPACK_NODE_VERSION=22`, durable `engines.node>=22` founder's call) · F-05.4 (crew → 04.5; its `0076` was overtaken by `0076_capacity`, needs a fresh migration number at 04.5) · F-05.5 (business-initiated straggler sends need approved templates for window-closed Meta delivery — content pass → P4) · F-05.6 (OTP, 🟢) · F-05.7 (`*_WA_NUMBER` vs `*_WHATSAPP_NUMBER` var divergence; OTP sidesteps via PNID-keying; low-pri estate-wide cleanup). Sealed CE records CE-29 → CE-36. Migration ladder tip `0085`; `0086` free (reserved for P4's `nudge_optout`).

## 3. FOUNDER-RULED SEQUENCE (binding)
**Bride cutover → vendor cutover → M2b (Twilio sunset) → P4 → 05 tail → certification.** Then Block 06's advisor arc (F-06.4 PARKED; Sitting IV after 05). Sequencing is the FOUNDER's — the CE does not make timeline/pressure calls (a lesson of this tenure: I over-weighted approval latency once and was corrected). The founder chose migration-before-P4, and the migration risk is low because there are **no real users — three test accounts only** (weigh hot-path/migration risk accordingly).

## 4. THE CUTOVER (what you guide; the charter is `docs/specs/TDW_05_CUTOVER_CHARTER.md`)
A cutover is the **founder's atomic provisioning act**: provision the lane's Meta phone-number-id, set env on the lane's service, point that WABA webhook at the service's `/webhook/meta`, GET-verify, redeploy. Atomicity: a number is one platform at a time — the instant the number is on Meta with its PNID set, inbound and outbound (and OTP) flip together; no half-state. **Rollback is clean** (unset the PNID + re-point the webhook to `/webhook/whatsapp` → the retained Twilio path resumes byte-identical) — which is WHY the Twilio delete is gated to M2b. You author the guide; LE walks it step-by-step; you SEAL on the founder's witnessed evidence (log tells + handset delivery + content-identity), the way CE-30 sealed the sandbox smoke. **Two ready-but-uncorrected cutover kickoffs (bride + vendor) exist in the sixth chair's chat — do NOT reuse their step 0 verbatim; apply the §5 correction first.**

## 5. TWO CORRECTIONS THE SIXTH CHAIR OWES (fix before guiding cutovers)
1. **THE AUTH TEMPLATES ARE THE EXECUTOR'S TO DRAFT — not the founder's.** `docs/TEMPLATES.md` is the plain precedent: the P2 six-template session **authored submission-ready templates** (exact Meta names like `tdw_marketing_opener`, category, `{{1}}` variables numbered from 1, single-line bodies, a whole Meta-compliance-rules section) and the founder vetoed + filed. I wrongly chartered the OTP session to hand only "proposed names + a veto list" and told the founder to *draft* them. **Correction: charter an OTP auth-template drafting session that DELIVERS submission-ready AUTHENTICATION templates** — couple login, couple reset, circle-join (The Dream Wedding brand) and vendor login, vendor reset (DreamAI brand): exact bodies, the code `{{1}}` param, the copy-code/one-tap button structure, Meta names, category AUTHENTICATION — in `TEMPLATES.md` form, ready for the founder to veto + file. (The auth-button send shape `sub_type:'url'` vs `copy_code`/`coupon_code` is a named live-Meta unknown — a one-function flip in `buildAuthTemplatePayload` is ready; confirmed at the first live OTP.)
2. **Cutover kickoffs' step 0** changes from "confirm the founder filed the templates" to "**LE delivers the submission-ready auth templates + the P3 opener-template; the founder vetoes + files**" — templates authored by the session, filed by the founder, minutes of approval off the critical path.

## 6. STANDING LAWS (05 / cutover specifics; the rest live in the protocol + prior notes)
- **W-1 absolute:** transport-only work carries ZERO prompt/soul/voice/wording diff (proven by content-byte-identity, not just grep). OTP/nudge/template BODIES are product copy under founder veto — allowed; agent voice is 06's. A wording drift is a failed sitting.
- **P-06.T:** Meta Cloud API direct, registry keyed by Meta name+language, never a SID. Twilio is fallback-only.
- **OTP structural bypass:** `otpSend.js` keys on `*_PHONE_NUMBER_ID`, calls `sendMetaTemplate` directly, never `whatsapp.js` — un-gateable by the F-05.2 marketing opt-out (correct: auth is opt-out-exempt). Do not route OTP through `whatsapp.js`.
- **M2b (Twilio sunset)** is gated on BOTH lanes confirmed live on Meta (deleting sooner breaks the un-cut lane — the executor-corrected number-atomicity ruling, CE-33). `b5_webhookcore` re-baselines at M2b with a real count, not a guess. `OTP_WA_NUMBER` survives M2b.
- **Clobber law:** executor ZIPs carry NO FINDINGS_LOG/masterplan (the CE's home); the CE's record is its own docs-only ZIP. (Recurring drift early-tenure; now clean — executors bank only their own handover.)
- **Delivery discipline (§7/§9/D-10):** `deploy/`-prefixed ZIPs, line-1 `# repo: dream-os`, the fixed apply command, ONE verify line ending `|| echo "STOP …"`, the git line beneath (a red verify stops the push at the paste); migrations founder-run + conditional-withheld, never in the ZIP; zero placeholders; every packet carries its commit hash on line 1.

## 7. WORKING METHOD (unchanged; you run it)
1. Executor/guide sessions get a KICKOFF (chat paste-block, not committed): read ladder → what's RULED → what's read-first → acceptance → delivery spelled out → charter slot pointing at the committed handoff + a CE addendum of post-handoff rulings.
2. Every executor question returns via the founder; the CE rules with evidence; rule on nothing unverified.
3. Deliveries are `deploy/`-prefixed ZIPs the founder pastes; the CE's own records (FINDINGS_LOG + masterplan + specs) ride the CE's own docs ZIP.
4. Sittings end with a HANDOVER banked as the session's own doc; the next session opens on it. Seam law: sessions self-audit freshness and bank early.
5. Founder hands: provisioning + cutovers (screen is the witness — F-04.41), migrations/SQL/smokes, copy vetoes.

## 8. IMMEDIATE QUEUE FOR THE SEVENTH CHAIR
1. **Verify §2's state at HEAD `b59452d` by command** (re-fetch origin; confirm CE-36, both lanes dormant, `otpSend.js`/`metaLaneFor`/the two PNID vars, the sealed benches byte-stable).
2. **Charter the OTP auth-template drafting session** (the §5.1 correction) — LE delivers submission-ready AUTHENTICATION templates in `TEMPLATES.md` form; the founder vetoes + files (couple login/reset + circle-join; vendor login/reset). File the P3 opener-template in the same sitting.
3. **Author the corrected bride-cutover and vendor-cutover kickoffs** (step 0 = LE-delivered, founder-filed templates), guide each lane step-by-step, and **SEAL each cutover on the founder's witness** (activating F-05.2 for the lane in the record).
4. **After BOTH cutovers seal: charter M2b** (Twilio sunset — delete the retained Twilio inbound/outbound + `/webhook/twilio-status`; re-baseline `b5_webhookcore`; F-05.2 fully closes).
5. **Then P4** (crons + reminders + the F-05.5 straggler-template content pass; migration `0086_nudge_optout`), then the **05 tail** (mechanical engine migration, credit alert), then certification.
6. Standing-open, not on the critical path: the P3 opener-template live test; F-05.3 durable cure (`engines.node>=22`); the Meta media-inbound shim (text-only today); F-05.7 var reconciliation.

## 9. WHY THIS BANK (the seam law, honestly)
The sixth chair banks here because verification-care frayed and the tell was unambiguous: when the founder flagged the template decision, I **defended it from memory instead of going to the repo** — the exact "your earlier self is a document with drift history / verify before you assert" failure the whole role exists to prevent, the same class the fifth chair banked Note V for. Smaller tells pointed the same way (two false-positive "RED" flags last verification — "log" inside "login", "otp" inside a log label — walked back on second look; first passes getting looser). **What HELD:** the by-command code verification was real — the non-vacuity mutations, byte-identity and content-preservation checks were genuine, so CE-29→CE-36 stand. What slipped was judgment/process and the instinct to defend rather than check. The repo is truth; a fresh chair re-derives everything from it. Seat, verify §2, fix §5, execute §8.
