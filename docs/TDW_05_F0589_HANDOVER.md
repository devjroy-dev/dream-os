# TDW_05 · F-05.89 — THE NAME THAT MUST TRAVEL · EXECUTOR HANDOVER

**Sitting:** F-05.89-CURE under R-37.1, built on rulings **R-37.14 – R-37.20** (chair) with **R-37.14 and R-37.16 founder-ratified 2026-08-25**.
**Base:** `dream-os` @ `5be80d6` · `dreamos-pwa` @ `3252a04` — both re-derived fetch-first at origin at delivery.
**Role:** LE. Built and disclosed; nothing pushed. Two ZIPs, dream-os first.
**Migrations: ZERO. Founder SQL: ZERO beyond the three read-only census SELECTs already run.**

---

## 1 · WHAT SHIPPED

### dream-os (ZIP 1) — four production files, one new bench, one re-founded bench

| File | Change |
|---|---|
| `src/lib/onboardingPredicate.js` | `textPresent` joins `module.exports`. One line, zero behaviour. **R-37.19.** |
| `src/lib/provisionRole.js` | Local `namePresent` **deleted**; imports `textPresent` from its one home. Phone-fallback projection widened to `select('id, name, auth_user_id')`. `promoteUnverified` marker + the `nameWins` promotion arm. **R-37.14 / R-37.19.** |
| `src/api/couple/auth.js` | `send-otp` destructures `{ phone, name }`; coerces via `textPresent` + `slice(0, 80)`; the name lands on the **fresh insert only**. **R-37.1.** |
| `src/api/vendor/auth.js` | Byte-parallel twin. **R-37.16.** |
| `scripts/b05_f0589_name_at_mint_bench.js` | NEW. 31 cells, 17 production mutations. |
| `scripts/bOB_m_bridename_fill_bench.js` | Re-founded — §3.1/§3.2 anchors, §1.6 re-aimed, §1.6b minted. 18 → **19 cells, zero deleted.** |

### dreamos-pwa (ZIP 2)

| File | Change |
|---|---|
| `app/(landing)/page.tsx` | `sendOtp(phoneNum, nameArg?)`; body posts `{ phone, name }`; four callers re-pointed per **R-37.15**. |
| `scripts/b05_f0589_pwa_name_wire_bench.js` | NEW. 14 cells, 10 production mutations. |

---

## 2 · THE CURE IN ONE PARAGRAPH

The landing sheet has made the first name compulsory since `89e03eb`, then posted the phone alone and held the name in browser state until `/provision` — which runs only after a successful OTP. Every abandon in between minted a durable nameless `users` + role pair. The census of 2026-08-25 measured **31** of them (28 couple, 3 vendor), **18 never verified**. The two `send-otp` doors were the **only two nameless `users`-minting sites in the entire estate** — all nine others already carried a name. The name now rides the send-code request and lands at mint, on the fresh insert only. An unverified caller may **found** a row; it may never **overwrite** one.

---

## 3 · R-37.15 — THE FIND THAT CHANGED THE CURE'S SHAPE

`sendOtp` has **four** callers, not one: the join door (name-gated), two `handleSignIn` paths, and Resend. `joinName` is one `useState` on a component that renders every screen, so it survives every transition. Had the name been read off state *inside* `sendOtp`, a visitor who typed "Priya" at the join door, backed out to Sign in, and entered **a different number** would have shipped "Priya" to the fresh mint of a stranger's phone — and server-side never-clobber would then have protected that error permanently.

The name travels as an **argument**. The join door passes it; Resend passes it only on the `join_otp` leg; both sign-in paths pass nothing, and that non-act is recorded in-file beside the call rather than left to look like an omission. Cells 2.4 and 2.6 assert it.

---

## 4 · R-37.14 — THE PROMOTION ARM, AND THE RADIUS MEASURED BEFORE IT SHIPPED

The marker is `auth_user_id IS NULL` on the phone-fallback path: the estate's durable mark of *never verified*, durable because `users_auth_user_id_key` is `UNIQUE … WHERE (auth_user_id IS NOT NULL)` — a partial unique, so NULL is a legal shared value. The rebind **sets** it in the same breath, which is what makes the promotion fire **at most once per row**.

**A protection was reversed, and it was measured first.** `bOB_m_bridename_fill_bench` §1.6 asserted the opposite of R-37.14 — *"a legacy account lost its name to a signup form"* — on a fixture with `auth_user_id: null` and a name already on it. Rather than re-found it on reasoning, census C was run:

```
lane,named_but_never_verified,oldest,newest
couple,1,2026-06-30 17:56:06.330037+00,2026-06-30 17:56:06.330037+00
```

**One row estate-wide.** That is the entire population R-37.14's promotion can reach; it can reach it once; and the winning byte is one the row's own owner typed at a verified door. §1.6 is re-aimed with that census quoted in-file, and **§1.6b was minted** to keep the half that still applies: once *any* verified login has claimed a row, a re-bind to a different identity cannot touch the name at all.

---

## 5 · PROOFS

**dream-os `b05_f0589_name_at_mint_bench`: 31/31, exit 0.** Drives both real doors through a real express app on an ephemeral loopback port with a recording in-memory supabase fake; `sendOtpCode` stubbed at the module registry, so no Meta send is attempted. No DB, no network, no live credential.

**Seventeen production mutations, every one run and every one restored byte-identical.** M17 (un-export `textPresent`) reddens by **process death** — `TypeError`, exit 1, no FAIL line. A reader grepping only for FAIL would score it inert; the exit code is the reading.

**Three vacuity holes found, diagnosed, cured, and recorded in the bench:**
1. **The recorder was destroying its own evidence.** `JSON.stringify` drops `undefined`-valued keys, so a seam writing `{name: undefined}` recorded as *no name write*. Cell 5.7 was green over the exact defect it exists to catch.
2. Cell 5.6 drove an unverified nameless row, where the fill term and the promotion term are **both** satisfied — delete either, the other holds it green. Retargeted to a verified nameless row.
3. Cell 5.3's "exactly once" is guaranteed twice over: on a second login path (a) matches and path (b) never runs, so the marker is unreachable there. **Cell 5.10 minted** for the one shape where the marker alone stands between a named row and a clobber.

**pwa `b05_f0589_pwa_name_wire_bench`: 14/14, exit 0.** Ten mutations, all biting. **One vacuity hole, found by P1 and recorded:** cells 1.1/1.3/1.4 first searched the whole file and stayed green over a fully uncured door, because `verifyOtp`'s `/provision` call fifty lines below carries a body of exactly the shape they matched. Cured by windowing §1 to the `sendOtp` function.

**Engine gate:** `npm run build:engine` — green.

---

## 6 · FLOORS — DECLARED, NOT CLAIMED

**dream-os: UNDERIVED, and the reason is on the record.** `scripts/run-floor.sh` exceeded this container's execution limit, and the kill left `src/engine/src/core/donna.ts` carrying a bench mutation — **LESSON 3 of the runner's own header, reproduced live**. Restored by `git checkout`, the four cured files re-verified intact. In its place, the twelve benches whose bytes reach the touched files were run: **nine green**; `b07_f0772_circle_auth_bench` and `b10_p3_mint_deck_bench` **red at the untouched tip too** (base members); `bOB_m_bridename_fill_bench` was my delta and is **cured and green at 19/19**. The floor is the chair's or the founder's to witness on a machine that can finish it.

**pwa: measured both ways.** At the untouched `3252a04`, `--check` reports the NAMED BASE seven **plus eight further reds** — `run-bands-proof`, `run-city-proof`, `run-crew-proof`, `run-post-access-proof`, `run-roster-mint-proof`, `run-settle-proof`, `run-tdw15-p3-daystogo-proof`, `waDial`. **Inherited, present before this delivery, identical in both worlds.** *This is an F-16.24-class recurrence at origin and is reported, not touched — it is outside this sitting's radius.*

Against that base my tree adds **exactly one** further red: `tdw_f0774_vacuity_probe`, which NOTE 36 §5 names as a **refusal on any dirty tree, not a defect**. It should clear once the work is committed; the founder's post-push `--check` is the witness.

---

## 7 · COPY INVENTORY — ZERO. VETO SLOT — EMPTY.

No vendor- or bride-facing string was added, changed, or removed. Asserted rather than claimed: dream-os cell 6.4 and pwa cell 3.3 pin the pre-arc bytes and fail on any new refusal string. Both doors still succeed (200) on a nameless request — neither has ever turned a caller away for a missing name, and neither starts now. The landing sheet's own gate is what makes the name compulsory for a human.

---

## 8 · WHAT THIS SITTING DID NOT TOUCH

- **The race branch stays out [R-37.20].** Neither door has `23505` handling; the name rides the existing insert and opens no new window. The loser's 500 is pre-existing, DB-safe under `users_phone_key`, and UX-only. **The next race sitting should find these two doors on its census — they belong to the F-05.85/.86 mirror family.** Cell 6.1 fences it.
- **F-05.90** (send-otp unmetered per phone/IP) filed, not built [R-37.17]. `crew.js:161`'s in-process bucket is the donor for its seat.
- **The aged-nameless sweep stays parked** [R-37.18]. The 31 rows are unreachable by this cure; it writes only where a name is presented at a fresh mint.
- `brideInbound.js` read-only throughout (W-1). Its 120-cap circle path is a different path with its own argued comment — untouched, cell 6.2.
- The circle join door rides a **different endpoint** whose mint already carries `invitee_name`. Unreachable by this cure; cells 6.3 and 3.4.

---

## 9 · THE FOUNDER'S SMOKE CARD

Authored from the pasted census rows, not before them. Two fresh numbers are needed; **neither may be a real vendor's or bride's.**

**WALK A — the disease's exact reproduction, now green.**
1. Open the landing sheet, choose **Dreamer**, type a first name (use `Priya Walk A`), enter a fresh number you control.
2. Tap **SEND CODE**. The OTP will arrive.
3. **Do not enter it. Close the sheet.** This is the abandon.
4. Run census B again (the same SELECT already used). **Evidence:** the new row appears with **your typed name on it**, `auth_user_id` null. Before this cure the same walk produced a nameless row.

**WALK B — the promotion, witnessed once.**
5. On a **second** fresh number, type a deliberately mistyped name (`Pryia Walk B`), tap **SEND CODE**, and again **abandon**.
6. Return to the sheet on that same number, type the **corrected** name (`Priya Walk B`), tap SEND CODE, and this time **enter the OTP** and complete sign-in.
7. **Evidence:** the row now carries `Priya Walk B` and a non-null `auth_user_id`. The pre-name yielded once at the verified rebind.
8. Sign out and sign in again on that number. **Evidence:** the name does not move again. Never-clobber has resumed.

**WALK C — the sign-in leak that R-37.15 exists to prevent.**
9. Open the sheet, choose Dreamer, type `Leak Test` and a phone number — **but do not tap SEND CODE.** Back out to **Sign in**.
10. Enter a **third** fresh number and continue.
11. **Evidence:** the row minted for that third number is **nameless**. If `Leak Test` appears on it, R-37.15 has regressed and the push should be reverted.

**Truths only the founder's handset can witness:** that Meta actually delivers on both lanes after the body change; that the deployed bundle posts the field (a cached older bundle would post phone alone and every walk above would show the pre-cure result — a hard refresh is worth doing before Walk A); and that the visible sheet copy is unchanged.

---

## 10 · WHAT THE NEXT SEAT PICKS UP

- **F-05.90** (send-otp rate limit) — filed at this desk, unbuilt, donor named.
- **The dream-os floor** — never measured at this tree; owed on a machine that can finish it.
- **The pwa's inherited eight-bench floor delta at origin** — F-16.24 class, reported above, unclaimed by anyone.
- **The two doors belong on the F-05.85/.86 race census.**
- The 31 aged nameless rows remain unreachable by any cure that writes only at mint.
