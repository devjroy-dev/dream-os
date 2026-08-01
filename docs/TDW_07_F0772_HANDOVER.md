# TDW_07 · F-07.72 — THE CIRCLE-LANE AUTH SITTING · ZIP 1 (dream-os)

**Base:** `dream-os @ 7856ea7` · **Paired pwa ZIP:** `tdw07_f0772_pwa` on `dreamos-pwa @ 2d277f4`
**Ruled at:** the F-07.72 read-first ruling and its pre-build packet — F1-e the frame · F1-b the token via ONE home · F1-d the phase · the resolver for Class B · founder veto 「 all, 90 」.
This document rides the ZIP. It is **not** a CE entry and touches neither `FINDINGS_LOG.md` nor the masterplan.

**THIS ZIP MINTS AND TEACHES. IT ENFORCES NOTHING.** No door refuses anything it did not refuse at `7856ea7`. Enforcement is ZIP 2, conditional-withheld, and it arrives in a later message after the founder's walk.

---

## 1 · WHAT SHIPPED

| File | Change |
|---|---|
| `src/lib/signedSession.js` | **NEW** — the one home. Subject-bearing `payload.expiry.hmac`. |
| `src/lib/adminSession.js` | **CALLER #1.** Body delegates; six exports, five call sites, 0-line. |
| `src/lib/circleSession.js` | **NEW** — caller #2. Binds `user_id.couple_id`, 90-day TTL. |
| `src/lib/resolveCircleIdentityIfPresent.js` | **NEW** — the Class B resolver, three answers. |
| `src/api/circle/verifyPin.js` | Mint point 1. Set A's founder bytes. Its first reachable caller (F-07.104). |
| `src/api/circle/join.js` | Mint point 2 at `/accept`. One-number-one-circle at both gates. |
| `src/api/circle/session.js` | Minimised to the derived consumed set. **DECLARED PARTIAL** — F-07.106. |
| `src/api/circle/feed.js` · `threads.js` · `messages.js` | The resolver mounted at all five handlers, zero behavioural change. |
| `scripts/b07_f0772_circle_auth_bench.js` | **NEW. 68/68**, ten production-source mutations. |
| `scripts/b07_auth_crossover_bench.js` | Extended to the three-lane triangle. **24 → 30**, labeled. |
| `scripts/b07_f0784_panel_bench.js` | Two cells re-aimed. **59 → 59**, count preserved, labeled. |

`src/api/router.js` is **0-line**. The guard stays unmounted and its confession comment stands; both are asserted by `§5.4`.

## 2 · WHY THE GUARD WAS NEVER MOUNTABLE — the second reason, which the census did not carry

The committed spine named one obstacle: the lane mints no JWT, so mounting `requireCircleMemberAuth` as written would 401 the whole lane. There is a second, and it is armed on the only live row.

`requireCircleMemberAuth.js:25–29` resolves the user with `.eq('id', user.id)` — the **auth-plane** id used directly as a `public.users.id`. Migration 0063 split those planes; `resolveUsersId.js:23–40` carries the founder-run probe stating they *never coincide*, which is why `requireCoupleAuth.js:52` goes through `resolveUsersId` and this guard does not. **Mehek's row is plane-split** (`auth_user_id` present, `auth_user_id != id`, founder SELECT 2026-08-02). Even in a world where this lane issued Supabase JWTs, that guard would have refused the one real member.

The re-authoring is ZIP 2's. It is written here because ZIP 2 must not rediscover it.

## 3 · THE SHAPE OF THE TOKEN, AND THE TWO EXPRESSIONS THAT LOOK REDUNDANT

`mintSigned` builds `body` and `payload` separately and they are always equal. That is deliberate and `§1.10` asserts the equality. The reason is that **the difference between them is the vulnerability class**: a field carried in the token but not covered by the mac is a field anyone can edit. Collapsed into one expression, that class is unreachable by mutation and therefore unproven. `§9 INVERSE 1` opens the gap and watches `§1.2` catch it.

`payloadOf` is the single home both mint and verify call, so they cannot drift about what was signed.

## 4 · WHAT THE BENCH CAUGHT IN ITS OWN AUTHOR, kept in ink

Five of the ten mutations were **vacuous on first run** and the bench said so:

- One commented its target line out — and `includes()` cannot tell code from a comment, so the cell passed over its own disabled call. The same class the stripper audit spent a sitting on.
- One mutated `signedSession` in a way that made mint and verify *agree* on a broken world, so every token failed and the cell's `null` assertion passed for the wrong reason.
- One replaced only the first of several occurrences of an anchor.
- One targeted a branch in `resolveCircleIdentityIfPresent` that turned out to be **unreachable**: `resolveCoupleIfPresent` already answers `present:true` for any bearer, so the trailing belt-and-braces block could never execute. **It was deleted, not left in as reassurance** — a guard that cannot run is a reader's false comfort and the next sitting's unexplained line. The contract is now stated exactly: `ABSENT` if and only if there was no credential at all.
- One asserted an ordering with two `indexOf` results, and a deleted call returns `-1`, which is less than every real index. **An ordering assertion that does not first assert presence is an assertion about nothing.**

`§2.7`'s one-home census also convicted `src/lib/vendor/igOAuth.js`. It is **not** a second session signer — single-use OAuth state, replay defence in the database, a base64 JSON payload. It is carried as a **named exception with a re-read trigger**, not regexed away.

## 5 · THE CENSUS IS NINE DOORS · F-07.106

`GET /api/v2/couple/profile/:brideId` (`src/api/couple/profile.js:41–50`, mounted bare at `router.js:66`) returns `bride_name`, `groom_name` and `wedding_date` for any supplied couple id with no credential — character for character the bride payload `session.js` just stopped sending. **Minimising this door moved that leak; it did not close it.** Filed as F-07.106 by CE ruling, homed to the auth backlog beside F-07.105; pulling it into this sitting would re-open the logged-out-enquiry ground F-07.62 settled.

The declaration is in `session.js`'s header under its own F-06.85 paragraph, and `§8.5` is the cell that **reddens the day that door is guarded**, forcing the paragraph to be re-read rather than left standing as stale ink.

## 6 · FLOOR AT DELIVERY — whole, sequential, `npm ci` then `build:engine` first

**Byte-stable at CE-124's counts:** `selftest 386` · `p1 75 PAIRED` · `p2 48` · `p3 55` · `p4a_ig 110` · `p4b_body 76` · `probe 22` · `slice1 19` · `p5 136` · `p6 29` · `f0776 64` · `f0791 38` · `f0789 19` · `f0774 20/20` · **the CE-114 28-sealed sweep exit-0 whole**.

**Known-reds EXACTLY TWO**, unchanged: `meter 28/29` (F-06.41) · `f0555 22/23` (F-07.11).

**Movements, disclosed:**

| Bench | Was | Now | Why |
|---|---|---|---|
| `b07_f0772_circle_auth` | — | **68** | NEW. 10 mutations RED at broken production code, all restored byte-identical. |
| `b07_auth_crossover` | 24 | **30** | +6 labeled: §6.1–§6.6, the three-lane triangle (CE ruling §3(4)). The guard census in §6.6 is derived by predicate, never a hand-kept list. |
| `b07_f0784_panel` | 59 | **59** | Two cells RE-AIMED, count preserved. §1.2/§1.5 asserted `createHmac`/`timingSafeEqual` lived *in `adminSession.js`* — an address, not a behaviour. The extraction moved the mechanism and the floor caught it: CE-119's "a true cell aimed one surface over". Baseline 59/59 verified at a clean clone of `7856ea7` **before** the re-aim. |

`b07_f0774_stripper` **20/20** and the cross-repo identity pin are **not regressed**.

## 7 · WHAT THIS SITTING DID NOT DO

- **Enforce.** No guard mounted, no door refuses. ZIP 2.
- **Re-author `requireCircleMemberAuth`.** Its two defects are diagnosed in §2 and cured in ZIP 2.
- **Touch `couple/profile`.** F-07.106, filed.
- **Touch `pin-status`.** F-07.105, filed. It still returns `user_id` and `role_id` for any phone, unauthenticated. The co-planner no longer calls it; the vendor lane's GET against that POST-only route is a separate lane's business and is named here only so it is not re-discovered.
- **Ship the partial unique index** on `(invitee_phone) WHERE status='active'`. Founder-run SQL, conditional-withheld, its own later message after the walk. The code leg ships now so the refusal is a sentence the invitee can read rather than a 23505 the door turns into "Something went wrong."

## 8 · ENV — one variable, before the walk

`CIRCLE_SESSION_SECRET` must exist on the Railway service running `src/index.js`. Both mint points **fail closed** without it: `mintCircleSession` returns null, the doors return exactly the responses they returned at `7856ea7`, and the walk's token steps simply produce no token. Nothing breaks; the sitting just cannot be witnessed. Numbered clicks are in the smoke card.

The value is never printed and never enters a transcript. `§3.8` asserts no code path logs it.
