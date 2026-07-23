BASE COMMIT: 3014cfecb5858607d50f4ee3f74c403822a1e9b2 (re-derived fetch-first at build)

# TDW_05 M2b + F-05.7 — THE TWILIO SUNSET · EXECUTOR HANDOVER

Role: executor. Nothing pushed. CE-62 accrues on the founder's seal, not here.

---

## 1. WHAT WENT OUT

Twilio is gone from `dream-os` as a message transport. Deleted, per CE-33's enumeration:

- `whatsapp.js` — the Twilio fallthrough, the `twilio` require, the client, the creds
- `webhookCore.js` — `verifyTwilioSignature`, `normalizeMedia`, `makeTwilioStatusHandler`, and
  `warnIfSignatureCheckDisabled` (the boot-warning fork, ruled by principle — see §4)
- `index.js` + `brideIndex.js` — `POST /webhook/twilio-status` and `POST /webhook/whatsapp`,
  both services; plus two dead `require('twilio')` lines (the F-04.106-class rider)
- `vendorInbound.js` + `brideInbound.js` — `twilioInputsFrom`
- `otpSend.js` — the `twilioSend` else-branch (founder gate (ii))
- `couple/auth.js`, `circle/join.js`, `vendor/auth.js` — `require('twilio')`, `getTwilio()`,
  the `OTP_WA`/`BRIDE_WA`/`VENDOR_WA` consts, all five `twilioSend` closures
- `package.json` — the `twilio` dependency

Only `/webhook/meta` survives on all three services. `/webhook/whatsapp` and
`/webhook/twilio-status` now answer **404**, which is the smoke's witnessed proof.

## 2. THE DELETION TRIO

**(a) Pre-delete grep-positive** — captured before a byte moved. Every named symbol present:
`verifyTwilioSignature` 10 · `normalizeMedia` 6 · `makeTwilioStatusHandler` 13 ·
`warnIfSignatureCheckDisabled` 8 · `twilioInputsFrom` 24 · `/webhook/twilio-status` 3 ·
`require('twilio')` 8 · `twilioClient` 3 · `getTwilio` 9 · `twilioSend` 10 ·
`OTP_WA_NUMBER` 19 · `DISABLE_TWILIO_SIGNATURE_CHECK` 15.

**(b) Post-delete grep-zero** — all of the above at **ZERO live references**. What remains are
comment lines that are explicit retirement records (stating what died and why). Five residual
comments that still *asserted deleted behaviour as live* were corrected rather than left —
`templates.js` claimed the OTP Twilio fallback was "the sealed fallback"; `metaInbound.js`
described the three deleted helpers in the present tense; three bench headers described a
two-path world. A comment that describes a deleted mechanism as live is the same defect class
as the boot warning this sitting retired.

**(c) Floor green at the smaller world** — 51 bench files green, 2 red. Both reds are
**pre-existing**, confirmed by stashing this work and re-running at charter tip:
`b06_meter_bench` 28/29 and `b6_sitting2_bench` 20/22 (which §6 names as the floor).

## 3. THE RETIREMENT LEDGER (F4 — every delta listed, none dropped)

| Bench | Before | After | What retired |
|---|---|---|---|
| `b5_webhookcore` | 43 | **11** | 32 cells: the `origSignature`/`origStatusHandler`/`origMedia`/`origBootWarn` oracles and everything they drove |
| `b05_m2` | 4 | **2** | the verbatim guard · input equivalence · two-path byte-identity |
| `b05_m1b` | 6 | **4** | the verbatim guard · input equivalence |
| `b05_m1_transport` | 16 | **10** | the six-case Twilio oracle matrix + its mutation + the "Twilio never consults the gate" cell |
| `b5b_movementb` | 56 | **47** | nine status-race cells |
| `b0498_fresh_crew` | 66 | **58** | the seven-cell twilio leg + cross-transport identity |
| `b05_f056_otp_meta` | 33 | **24** | fifteen TWILIO-lane cells; **added** the founder's six no-fallback floor cells |
| `b05_f056_otp_hotfix` | 21 | **DELETED** | wholly superseded — see below |
| `b05_p2_sendwa` | 49 | **55** | *(+6)* the F3 inversion, its transition fallback, and precedence |
| `b5c_prospect_lane` | 47 | **47** | none; fixture now configures its lanes explicitly |

`b05_f056_otp_hotfix_bench.js` is **deleted, not stubbed**. Its entire subject was
`OTP_WA_NUMBER` from-resolution through `getTwilio()`, which gate (ii) removed. Its one
surviving proof — OTP bcrypt-hashed before send, never logged — is asserted on all five sites
by `b05_f056_otp_meta`'s `(iii) META` cells, green. A bench kept alive over a deleted mechanism
would have been a tombstone that reads like protection.

## 4. THE BOOT-WARNING FORK — RULED BY PRINCIPLE, ANSWER **11**

`warnIfSignatureCheckDisabled`'s entire content was a warning about Twilio signature
verification, gated on `DISABLE_TWILIO_SIGNATURE_CHECK`, printed by three services — including
marketing, which was never on Twilio. After the sunset it warns about a check that does not
exist. Applying the ruled principle (*cases asserting surviving behaviour stay; cases asserting
deleted behaviour retire*), it retires and its four cells with it. The count fell out at **11**.

**FILED, NOT FIXED HERE:** `DISABLE_META_SIGNATURE_CHECK` — the flag that *is* live after the
sunset — has no boot warning on any service. That is a new finding, not a deletion sitting's
business to write.

## 5. THE GUARD (F1) — RETIRED GREEN, NOT BROKEN

Before retiring it, the M2 verbatim guard was run against the **post-delete** tree:
**788 lines compared, zero drift.** `twilioInputsFrom` lived outside the guarded `try/catch`
region, so the deletion never touched a baseline byte. The guard's whole life — birth at M2,
purpose, its two fence amendments (F-04.98 C3, P6 Fork B), the Fork-A transform, and its death
— is written into the bench's own header. **The C3 and Fork-B fence markers STAY** in
`vendorInbound.js` as attribution; only the splice logic died with the guard it served.

## 6. TWO FINDINGS THE CENSUS COULD NOT SEE — ONE CURED, ONE FILED

**F-05.21 — CURED IN THIS ZIP.** `src/api/admin/failedTurns.js` POSTed dead-letter replays to
`${SELF_URL}/webhook/whatsapp`. That route is deleted, so every replay would have hit a 404.
The file contains no `twilio` string anywhere, which is exactly why a string census could not
find it; it surfaced from the post-delete route sweep. Retargeted to `/webhook/meta`, with two
limits disclosed in the file: pre-M2b dead letters hold Twilio-shaped payloads and will no-op
on replay (declared gap), and `/webhook/meta` acks 200 before processing, so `upstream.ok`
confirms delivery rather than that the turn ran.

**FILED, NOT CURED.** `imagePipeline.js` and `vendorCalendarImage.js` still read
`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` to Basic-auth downloads from Twilio-hosted media URLs.
`vendorCalendarImage` is host-gated (`isTwilioHost`); `imagePipeline` is mode-gated
(`sourceType === 'twilio'`). Neither can fire on new traffic — Meta media resolves through
`resolveMetaMedia`. They can only fire on a stored legacy URL, and Twilio media URLs expire.
Retiring the vars therefore makes any legacy Twilio media URL throw a **named** error rather
than download. With three test accounts and no live vendors that is acceptable — but it is
stated, not assumed. Deleting this code was not in CE-33's enumeration and would have been
scope creep.

## 7. W-1 — A DISCLOSURE THE FOUNDER MUST SEE

`git grep "login code is" -- src` is now **ZERO**. The five OTP body strings lived *only*
inside the deleted `twilioSend` closures. No new copy was authored and nothing was relocated —
the branch that held them died, per the ruling. But the words a user now receives come from the
Meta AUTHENTICATION templates on the WABA (`tdw_couple_login_otp`, `tdw_couple_reset_otp`,
`tdw_circle_join_otp`, `tdw_vendor_login_otp`, `tdw_vendor_reset_otp`), **not from this repo**.

**Your copy veto over OTP wording is exercised in Meta's template manager from here on.** No
bench in this estate can assert those bytes.

## 8. F5 — THE DEPENDENCY PURGE, DERIVED AND CONFIRMED

`package-lock.json` packages **226 → 197**. **29 entries removed**: `twilio` plus `axios`,
`jsonwebtoken`, `dayjs`, `semver`, `form-data`, `https-proxy-agent`, `agent-base`,
`follow-redirects`, `combined-stream`, `asynckit`, `delayed-stream`, `es-set-tostringtag`,
`has-tostringtag`, `proxy-from-env`, `scmp`, `xmlbuilder`, seven `lodash.*` singles, three
nested `debug`/`ms` pairs. **Zero first-party importers** of any purged transitive — checked
`axios`, `jsonwebtoken`, `dayjs`, `semver`, `form-data` across `src` and `scripts`, all empty.
`npm install` confirmed: *removed 29 packages*.

## 9. ROLLBACK

`git revert` the commit. Nothing dormant is needed — both lanes have been on Meta for weeks, so
reverting restores a Twilio path that carries no traffic.

---

# FOUNDER-HAND STEPS

## STEP 0 — BEFORE DEPLOY: add the new env names (both services)

The F3 inversion reads `*_WHATSAPP_NUMBER` first and falls back to `TWILIO_WHATSAPP_NUMBER`, so
**the deploy does not depend on this landing first** — but doing it first means Step 4 is a
no-op rather than a cutover.

- `dream-os` (vendor): ensure **`VENDOR_WHATSAPP_NUMBER`** is set to the vendor Meta number
- `dream-os-bride`: ensure **`BRIDE_WHATSAPP_NUMBER`** is set to the bride Meta number

Names only. Do not paste values into chat.

## STEP 1 — APPLY

```
unzip -o TDW_05_M2b_TWILIO_SUNSET.zip && cp -r deploy/* . && rm -rf deploy TDW_05_M2b_TWILIO_SUNSET.zip && rm -f scripts/b05_f056_otp_hotfix_bench.js && npm install
```

The `rm -f` is required: a ZIP overlay cannot delete a retired file. `npm install` purges the
29 packages.

## STEP 2 — VERIFY (D-10 fused; this line ends in a STOP)

```
node scripts/b5_webhookcore_bench.js && node scripts/b05_m2_vendor_inbound_bench.js && node scripts/b05_m1b_inbound_bench.js && node scripts/b05_m1_transport_bench.js && node scripts/b5b_movementb_bench.js && node scripts/b05_p2_sendwa_bench.js && node scripts/b05_f056_otp_meta_bench.js && node scripts/b05_f059_signup_bench.js && node scripts/b0496_pinlogin_tier_bench.js && node scripts/b0498_fresh_crew_rider_bench.js && node scripts/b5c_prospect_lane_bench.js && node scripts/b05_media_shim_bench.js && echo "M2b VERIFY GREEN — 11/2/4/10/47/55/24/10/11/58/47/14 — STOP: do not push until every count above matches"
```

## STEP 3 — COMMIT AND PUSH

```
git add -A && git commit -m "TDW_05 M2b — THE TWILIO SUNSET: transport deleted, OTP Meta-only (gate ii), twilio dependency purged; F-05.2 closed by deletion, F-05.7 closed, F-05.20 filed, F-05.21 cured; benches re-baselined with deltas listed" && git push
```

## STEP 4 — THE SMOKE (minutes, not hours)

1. One WhatsApp word to the **vendor** number → normal reply. *(negative proof: nothing changed)*
2. One WhatsApp word to the **bride** number → normal reply.
3. One **OTP** — request a login code on either lane → arrives as a Meta auth template with the
   copy-code button.
4. `curl -i -X POST https://<vendor-service>/webhook/twilio-status` → **404**. Repeat on bride.
5. Optional, founder-eye: Twilio console at zero traffic.

## STEP 5 — ONLY AFTER THE SMOKE IS GREEN: retire env vars

**DELETE (true corpses):**
- `OTP_WA_NUMBER` — both services
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` — both services
- `DISABLE_TWILIO_SIGNATURE_CHECK` — all three services, if set

*(Deleting the account creds makes any legacy Twilio media URL throw a named error — §6.)*

**DO NOT DELETE — ratified at CE-62 as product infrastructure, not transport:**
- **`TDW_WA_NUMBER`** — 13 non-OTP consumers across 10 files
- **`BRIDE_WA_NUMBER`** — 2 non-OTP consumers

These build every `wa.me/` invite link in the product. Their hardcoded fallbacks disagree
(`917982159047` at 7 sites, the dead sandbox literal `14787788550` at 5), so unsetting them
hands vendors two different numbers, one of which no longer answers. That is **F-05.20**, filed
open; the founder's canonical pair (`917982159047` vendor / `917011788380` bride) rides a future
labeled rider as one exported constant with fifteen importers.

---

## OPEN AFTER THIS SITTING

- **F-05.20** — the wa.me fallback split. Cure shape pre-ruled; ten-minute rider, founder-sequenced.
- **F-05.21** — cured here; replay of pre-M2b Twilio-shaped dead letters remains a declared gap.
- **NEW** — `DISABLE_META_SIGNATURE_CHECK` has no boot warning on any service.
- **NEW** — legacy Twilio media download paths in `imagePipeline.js` / `vendorCalendarImage.js`.
- **Pre-existing red, untouched by this sitting:** `b06_meter_bench` 28/29, `b6_sitting2_bench` 20/22.

Sequencing beyond this is the founder's.
