# base: dream-os @ f4fa914 (HEAD at build; f654f9e-or-later per charter; re-derive via `git fetch -q origin && git rev-parse --short origin/main` before sealing) — F-05.6 fix (a) applies onto this.

# TDW_05 — F-05.6 fix (a) — OTP over Meta via AUTHENTICATION templates (build sitting)

**What this is.** The ruled PRIMARY cure for **F-05.6 / CE-35**: the five business-initiated OTP sends (`couple/auth.js` ×2, `circle/join.js`, `vendor/auth.js` ×2) now ride the **Meta Cloud API** as an **AUTHENTICATION-category template** on the lane's Meta phone-number-id **when that lane is Meta-live**, and fall through to the **fix (b)** dedicated-`OTP_WA_NUMBER` Twilio send **unchanged** when it is not. Fix (b) is retained as the sealed emergency fallback (CE-35); this sitting does **not** touch it beyond wrapping each site so the Meta path is tried first.

The change is **dormant and byte-identical** until each lane's `*_PHONE_NUMBER_ID` is provisioned — the same dormancy pattern as the whatsapp.js transport migration (M1a/M1b/M2). Provision the PNID, and OTP rides Meta automatically; leave it unset, and every OTP is the exact Twilio send that ships today.

## The design
- **New module `src/lib/otpSend.js`** — `sendOtpCode({ to, code, lane, templateKey, twilioSend })`:
  - resolves the lane's Meta phone-number-id (`bride` → `BRIDE_PHONE_NUMBER_ID`, `vendor` → `VENDOR_PHONE_NUMBER_ID`);
  - **PNID present** → builds the auth payload from the registry and calls `metaCloud.sendMetaTemplate({to, payload}, { phoneNumberId })` — the OTP travels as the template's code param;
  - **PNID absent** → runs the caller's `twilioSend` closure **unchanged** (the fix-(b) send, byte-for-byte).
- **Five sites wired** — each `getTwilio().messages.create({...})` is now the `twilioSend` closure passed to `sendOtpCode`; the surrounding `try/catch` (otp_session delete + 500 on failure) is **untouched**, so a Meta-send throw lands in the exact same failure shape.
- **Registry (`src/lib/templates.js`)** — five `AUTHENTICATION`-category entries added (`couple_login_otp`, `couple_reset_otp`, `circle_join_otp`, `vendor_login_otp`, `vendor_reset_otp`); new `buildAuthTemplatePayload(key, code)` emits the body **and** OTP-button components, both carrying the code. `buildTemplatePayload` is **unchanged** (p2_sendwa stays byte-stable).

## F-05.2 opt-out bypass — structural, no carve-out
The marketing opt-out gate lives **only** inside `whatsapp.js`'s Meta branch. `otpSend.js` calls `metaCloud.sendMetaTemplate` **directly** and never requires `whatsapp.js`, so OTP is un-gateable by construction — correct and Meta-compliant (AUTHENTICATION templates are opt-out-exempt). There is **no carve-out code**. The bench proves `whatsapp.js#sendWhatsApp` is never invoked on any OTP path (spy) and that `otpSend.js` never requires whatsapp / references the opt-out gate (source scan).

## Security invariants — preserved (verified)
- OTP is **bcrypt-hashed into `otp_sessions` BEFORE the send** (untouched) — the bench verifies the sent code against the stored hash (`bcrypt.compareSync`), on **both** transports.
- OTP is **never logged** — no `console` line prints the code on either path (log-scan assertion, self-tested against a planted leak); the phone-only send log still fires.
- `otp_session` **delete-on-failure + 500 shape** preserved (the site `try/catch` is unchanged).

## Read-first items — PROPOSED, chair rules
1. **Auth-button send shape (verify vs Meta's live spec at file-time).** The builder emits Meta's widely-documented form: `{ type:'button', sub_type:'url', index:'0', parameters:[{ type:'text', text:<code> }] }`. A newer copy-code variant exists — `sub_type:'copy_code'`, `parameters:[{ type:'coupon_code', coupon_code:<code> }]` — required by some stacks depending on the button **type** filed (COPY_CODE vs ONE_TAP). If the live send is rejected on the button component, flip the **single** `buildAuthTemplatePayload` function. Chair to confirm against the founder's filed button type.
2. **F-05.7 (FILED) — from-var divergence.** `otpSend` keys the Meta path on `*_PHONE_NUMBER_ID` **presence by lane**, deliberately **not** on `metaLaneFor(from, …)`: the OTP files derive `from` from `BRIDE_WA_NUMBER`/`TDW_WA_NUMBER`, whereas `metaLaneFor` matches `BRIDE_WHATSAPP_NUMBER`/`VENDOR_WHATSAPP_NUMBER` — divergent env-var names, so a number-match could spuriously fail. Keying on PNID presence is the robust half of the same signal. Chair to ratify (and consider unifying the number env vars in a later hygiene pass).
3. **Template count.** AUTHENTICATION bodies are **Meta-preset** (no author copy), so brand words ("Dream Wedding"/"DreamAI") cannot live in the body — brand is carried by the sending number's display name. Functionally **one** auth template could serve all five sites. Five keys are registered for per-site tracking + founder veto; the founder MAY collapse them to fewer WABA templates (point several keys at one `name`).
4. **Status-gate (proposal, NOT built).** The Meta path is gated purely on PNID presence, exactly matching the charter's ruled signal and the transport dormancy model. A belt-and-suspenders `&& isApproved(templateKey)` could make the fix doubly-dormant (fall back to Twilio if a PNID is set but the registry status is still 'draft'). Flagged for the chair — **not** added, to stay byte-aligned with the ruling as written.

## FOUNDER VETO LIST — auth-template config (file + approve on the WABA)
AUTHENTICATION templates have no free-form body copy. The vetoable choices are the preset add-ons filed on the WABA (proposed):
- `add_security_recommendation: true` → renders "For your security, do not share this code."
- `code_expiration_minutes: 5` → renders "This code expires in 5 minutes." (matches `OTP_TTL_MS`)
- OTP button: `COPY_CODE`, text "Copy Code"

Registry `name`s are **PROPOSED** (`tdw_couple_login_otp`, `tdw_couple_reset_otp`, `tdw_circle_join_otp`, `tdw_vendor_login_otp`, `tdw_vendor_reset_otp`) and founder-final — file under these and no edit is needed; rename and it's a one-line registry change per key. All ship `status: 'draft'`.

## Acceptance evidence (this sitting)
- `node --check` clean: `couple/auth.js`, `circle/join.js`, `vendor/auth.js`, `templates.js`, `otpSend.js`.
- **`b05_f056_otp_meta_bench` 33/33 NON-VACUOUS.** Proves (i) Meta-live → `sendMetaTemplate(<registry name>)` with the OTP as body **and** button param on the right lane PNID (Twilio silent); (ii) not Meta-live → Twilio (b) fallback **byte-identical** (from + body oracle; Meta silent); (iii) OTP bcrypt-hashed before send + never logged, on both transports; (iv) `whatsapp.js` F-05.2 gate never invoked (spy + source scan). Non-vacuity shown by **three production-code mutations** (drop the PNID override → (i) RED ×5; drop the OTP button → (i) RED ×5; corrupt the body code param → (i)+(iii) RED ×10), each restored.
- **Byte-stable:** `b05_f056_otp_hotfix_bench` (b) **21/21**; migration benches m1/m1b/m2 GREEN; seven sealed benches **101 · 32 · 18 · 43 · 56 · 49 · 47**.
- **W-1 clean:** the five OTP body strings are byte-identical (indentation-only move inside the closure — verified: each string appears with identical trimmed content on both `-`/`+` sides); no soul/prompt/voice/engine file in the diff.

## Founder steps (per lane, at cutover — off the critical path)
1. File the AUTHENTICATION template(s) on the WABA (bride-lane before the bride cutover; vendor-lane before the vendor cutover); Meta approves in minutes.
2. If a filed `name` differs from the proposed registry name, update the registry `name` and flip `status` to `'approved'` (same convention as the six existing templates).
3. Provision the lane's `*_PHONE_NUMBER_ID` in Railway. From that moment OTP on that lane rides Meta automatically; leave it unset and OTP stays on Twilio (fix (b)).
4. (Optional, emergency) set `OTP_WA_NUMBER` to instantly reroute OTP over Twilio if a Meta OTP send ever fails.

## Cutover gate (charter §6, now satisfiable by (a))
Before ANY cutover: the lane's AUTHENTICATION template(s) approved + OTP wired to `sendMetaTemplate` (this sitting) + PNID provisioned. Sites 1–3 (couple/circle) before the **bride** cutover; sites 4–5 (vendor) before the **vendor** cutover. Fix (b)'s `OTP_WA_NUMBER` remains the sealed backstop and survives M2b.

## Delta vs origin
`src/lib/otpSend.js` (new), `scripts/b05_f056_otp_meta_bench.js` (new), `src/lib/templates.js` (+registry entries +`buildAuthTemplatePayload`), `src/api/couple/auth.js` / `src/api/circle/join.js` / `src/api/vendor/auth.js` (each: import + wrap the send in `sendOtpCode`). No SQL. No migration. `whatsapp.js` / `metaCloud.js` / soul / prompt / engine **0-line diff**.
