# TDW_08 · P1 — THE LIFECYCLE ENGINE · HANDOVER

**Repos:** `devjroy-dev/dream-os` (base `3d47041`) · `devjroy-dev/dreamos-pwa` (base `b87b4a2`)
**Sitting:** 2026-08-02 · LE, code-capable · chair CE-131 → CE-143
**This file rides the ZIP.** It is not a CE-numbered entry, it is not `FINDINGS_LOG.md`, and it is not the masterplan (clobber law).

---

## 1 · WHAT SHIPPED

| File | Repo | State |
|---|---|---|
| `db/migrations/0106_demo_lifecycle.sql` | dream-os | **NEW — already applied to production 2026-08-02** |
| `src/lib/demoLifecycle.js` | dream-os | NEW — the engine |
| `src/api/admin/demoAdmin.js` | dream-os | four presence writers moved behind the module |
| `src/api/couple/enquire.js` | dream-os | `onEnquiry` seam, fail-open |
| `src/api/demo/vendor.js` | dream-os | the open beacon |
| `src/lib/prospects.js` | dream-os | the STOP arm, fail-open |
| `src/cron.js` | dream-os | two lifecycle jobs |
| `scripts/b08_p1_lifecycle_bench.js` | dream-os | NEW — 63/63 |
| `scripts/b05_p4_crons_bench.js` | dream-os | **labelled re-aim** — see §5 |
| `lib/demo/api.ts` | dreamos-pwa | `pingDemoOpened()` |
| `app/demo/vendor/[handle]/page.tsx` | dreamos-pwa | fires the beacon once per mount |

**ZIP ORDER: dream-os FIRST.** Not convention — a reason. The PWA beacon calls a route that must exist before it fires; the reverse order ships a client against a 404.

---

## 2 · THE STATE LADDER, as the founder ruled it

```
legacy | built ──(admin console, P4 — NO CALLER IN P1)──> invited
        invited ──(beacon, stamp only, no clock)────────> opened
invited|opened|engaged ──(enquiry lands)───────────────> engaged   [expires_at = now + 72h]
        engaged|invited|opened ──(hourly sweep)────────> expired
        ANY STATE ──(STOP or admin)────────────────────> removed
        invited|opened|engaged|expired ──(P2)──────────> claimed
```

- **`expires_at` is set at `engaged` and NOWHERE ELSE** (CE-137). `invited` and `opened` rows carry NULL `expires_at` and can never expire — a demo nobody has enquired on does not die on a timer. The hourly sweep needs no branch: a NULL never satisfies `expires_at < now()`.
- **The first-open extension is RETIRED.** `extension_used` is a **dead** column on production — dead, not phantom (a thing exists that nothing references). `_write` refuses it structurally so it cannot be resurrected by accident. Dropping it is a one-line micro at the founder's word, not a reason to mint 0107.
- **`onInvited()` ships present, correct, and CALLERLESS — by ruling, not by omission.** The caller is P4's admin console board button.
- **`legacy`** is a lifecycle-*absence* marker. Two legal exits (`→ invited`, `→ removed`); one entrance (`restore()` on a stampless row).

**Two exits, two flags, no overlap:**

| | flips | writes state | inverse |
|---|---|---|---|
| **removal** | `active` | `removed` | `restore()` — derives from ladder stamps |
| **sunset** | `discover_eligible` (+ clears stamp) | none | `setDiscoverEligible(true)` — admin grant |

---

## 3 · THE MIGRATION — 0106, AND ITS READBACK

Applied to production 2026-08-02 under the CE-126 four-message sequence: witness SELECT → founder's pasted rows → DDL authored from those rows and nothing else → run + readback. **The file in this ZIP is byte-identical to what he ran**, with an `APPLIED — DO NOT RE-RUN` header prepended so the ladder does not become a trap for a fresh environment.

**The readback, whole, as the evidence:**

```
A - DID ALL ELEVEN COLUMNS LAND?      11 rows, all OK
B - demo_vendors_state_check          8 values: legacy, built, invited, opened, engaged, claimed, expired, removed
B - otp_sessions_purpose_check        5 values: login, reset, demo_enquiry, circle_join, demo_claim
C - demo_vendors_claim_token_key      CREATE UNIQUE INDEX … USING btree (claim_token)
D - THE BACKFILL: EVERY ROW BY STATE  legacy  12 row(s)          ← ONE group; `built` has none
E - BACKFILL ASSERTIONS               rows=12 | legacy=12 | built=0 | distinct claim_tokens=12
                                      | null claim_tokens=0 | extension_used true=0 | any stamp set=0
F - PRESENCE UNCHANGED                8 active | 5 in the couple feed | 0 eligible-but-inactive
```

**D is the ruling witnessed.** One group, not two — `built` has no group at all, which is the positive proof that the explicit UPDATE governed every existing row and the column default governed none. **F is A(b) proven at the data:** 8/5/0 before, 8/5/0 after; `state` landed on twelve rows and the couple feed did not move by one card. Both feed indexes untouched.

---

## 4 · ROLLBACK

**The migration.** Additive and exactly reversible; no data existed before it to lose. Drop the ten `demo_vendors` columns (the CHECK and `demo_vendors_claim_token_key` fall with `state` and `claim_token`), drop `demo_leads.converted_lead_id`, then drop and re-add the four-value `otp_sessions_purpose_check`. **That last step is safe ONLY while no row carries `purpose='demo_claim'`** — true until P2. It ships as a guarded block with its own precondition SELECT, never as a runnable statement beside its condition (conditional-withheld). The `legacy` backfill has no reverse and needs none: the column it wrote to would be gone.

**Each code seam.** Every one is additive and reverts by `git revert` of the ZIP's commit. `demoAdmin.js` is the only file whose *existing behaviour* moved, and its effect is unchanged (removal still flips `active`; grant still stamps). The one deliberate behavioural change is revoke now **clearing** `discover_eligible_at` — the C-2 cure — and reverting it restores the drift.

**NO ROLLBACK PATH DELETES A `demo_vendors` ROW, IN ANY FORM.** `demo_leads_demo_vendor_id_fkey` is `ON DELETE CASCADE` and Legacy carries eight leads. Removal is a state and one flag; deletion is P6's, under a resurrect window, and no P1 path issues one — asserted by cell.

---

## 5 · THE FLOOR — counts read directly, movements disclosed by name

**BUILD-ENGINE-FIRST satisfied** before any line: `npm ci` (196 pkgs) → `npm run build` → `src/engine/dist/core` present. F-07.46 interim protocol: clean tree before, strictly sequential, counts read directly.

**dream-os — sweep of 99 scripts** (98 at base + `b08_p1_lifecycle_bench`), **seven non-zero**, all six inherited plus my own bench at rc=0:

| line | expected | got |
|---|---|---|
| `b06_gauntlet --rig-selftest` | 386 | **386/386** |
| `b07_f0772_circle_auth` | 159 | 159 |
| `b07_auth_crossover` | 33 | 33 |
| `b07_f0784_panel` | 59 | 59 |
| `b07_p1_bench` | 75 PAIRED | **75/75 — my terminal prints the PAIRED side** |
| `b07_p2` / `p3` / `p4a_ig` / `p4b_body` | 48 / 55 / 110 / 76 | 48 / 55 / 110 / 76 |
| `b07_p4b_probe` / `p4b_slice1` | 22 / 19 | 22 / 19 |
| `b07_p5_bench` / `p6` | 136 / 29 | 136 / 29 |
| `b07_f0776` / `f0791` / `f0789` / `f0774` | 64 / 38 / 19 / 20 | 64 / 38 / 19 / 20/20 |

**The six known non-zero, unchanged:** `b06_meter_bench` 28/29 (F-06.41) · `b05_f0555_media_dedupe_bench` 22/23 (F-07.11) · `b5b_movementb_bench` rc=2, TypeError at `:225` (F-07.114, pre-existing, uncured, reports nothing) · and three credential-gated live rigs that refuse loudly by design and are not benches: `b06_gauntlet` bare (`ANTHROPIC_API_KEY absent — the incumbent lane cannot run`), `b5_wa_door_smoke` rc=3, `test-shape` rc=1.

**ONE COUNT MOVEMENT, DISCLOSED — `b05_p4_crons_bench` §6.6, 4 jobs → 6.** That cell is a **closed-world** assertion over every `cron.schedule` in `src/cron.js`, so it reds whenever a job is *added* — which is the behaviour we want, and it is exactly what happened. Cell meaning unchanged (an expression is only correct beside the timezone that makes it correct; exactly one job stays on UTC); only the expected table grew, derived from the file rather than from a charter number. **48 passed, 0 failed** after the re-aim; total cell count unchanged. The two new rows carry no "was" note because they preserve no prior instant — they are new jobs, not TZ rewrites.

**dreamos-pwa — 19 named lines, all reproduced:** tsc **TRUE-EXIT ZERO** on a cleared `.next` after `npm ci` (399 pkgs) · `f0772_circle` 128 · `auth_crossover` 46 · `f0766` 28 · `f0770` 104 · `f0774` 35/35 · `p1` 43 · `p2` 48 · `p3` 117 · `p4a` 69 · `slice1` 30 · `probe` 33 · `body` 133 · `f0760` 82 · `f06133` 41 · `p6_fold` 68 · `m3_chip` GREEN · `f0790` 37 · `f0784` 34 · `f0789` 30. Plus `f04_94`, `f04_96`, `f0539_demo_authority` GREEN.

**NAMED SKIPS (floor-method law — never counted as passes):**
1. **The seven `scripts/*.proof.ts` runners** — not on the chair's floor list, not run by the chair, not run by me.
2. **`tdw_f0774_vacuity_probe`** — rc=1, and it is a **refusal by design, not a red**. It writes to production source and restores it, so it STOPs on a dirty tree with *"Nothing was touched."* An LE tree is necessarily dirty (the LE never pushes), so it cannot run in this sitting at all. **It should run green on the founder's tree after this push.**

---

## 6 · THE BENCH — `b08_p1_lifecycle_bench.js`, 63/63, 0 skipped

Runnable from any working directory (root resolved from `__dirname`). **Ten §M cells mutate PRODUCTION SOURCE** — never test setup — assert RED at the uncured tree, restore the file, and assert byte-identity. Every anchor is asserted to appear **exactly once** before the replace, so CE-127's `String.replace`-takes-the-first fault is structurally impossible rather than avoided by care.

Cells the rulings bought: a second beacon hit leaves the whole row byte-identical · `expires_at` at `engaged` only · `onEnquiry` refuses a `legacy` row · removal flips `active` only and `restore()` is its exact inverse · `restore()` falls to `legacy` when stampless, derives `engaged` over `opened` when stamped, and **refuses a sunset row** · a takedown is never refused · **`opted_out` lands when `demoLifecycle` is injected throwing** · the `:136-139` opt-out bypass byte-stable · no supabase `.delete(` in any P1 path · the beacon answers at both mounted paths · the dial governs the predicate (key=1 sweeps a 2-day-old `legacy` row; the same row survives at the default) · the poison-zero arm · **COALESCE precedence** (ancient `created_at`, recent `invited_at` → survives) · **the admin grant proven the exact inverse of a sunset**, flag and stamp both.

---

## 7 · WHAT DRIFTED FROM THE SPEC, stated

1. **Migration number** — spec §2 reserved `0082`; the true ladder tail was `0105`. **This is `0106`.**
2. **The state CHECK carries EIGHT values, not seven** — `legacy` added (CE-133), so the twelve pre-lifecycle rows are not stamped with a false `built`.
3. **The beacon's path** — spec writes `/api/v2/demo/:handle/opened`; the mounted reality is `/api/v2/demo/vendor/:handle/opened`, which the PWA's existing claim POST already uses. Built against the mount. A route authored against a spec path that does not exist is F-07.95's class in embryo.
4. **The extension is retired** and `expires_at` starts at `engaged`, not at template send (founder, CE-137).
5. **The remove page and `/demo/remove/:claim_token` are NOT built** — arm (B): the exit rides the existing free-form holding line as `reply STOP`. No token in any outbound message, no copy, no route.
6. **Template bodies untouched** — FORK C closed 「 tempelate approved stay as is 」.
7. **Sunset is 90 days, not 30**, and it is a **dial**: `admin_config.demo.sunset_days`, JSON-in-text, read per run, never cached. **Code default 90** so the ruled behaviour holds against an empty `admin_config`. **One deliberate deviation from the house idiom:** `prospects.js` accepts `n >= 0`, right for a send cap; here `0` would drain the lane, so this guard demands `n >= 1`. Junk, absent, zero, negative and non-finite all fall to 90; nothing throws.
8. **COALESCE built as two exact passes**, not `.or()`. The ruling settled the semantics, not the query string; an `.or()` grammar no bench here can execute would make the cell prove a test double's parser rather than the predicate. The partition on `invited_at` nullness is exclusive and exhaustive, and `created_at` is NOT NULL. One benign, self-correcting race is named in-comment.

---

## 8 · FILED THIS SITTING, NOT CURED

- **F-08.6 — the phantom cron.** `cron.js:193-207` updates `vendors.demo_active` filtered on `vendors.demo_handle`; **neither column exists** in the witnessed 38-column `public.vendors`, and `src/cron.js` is the only file naming them. Empty success branch, empty catch, and the driver returns column errors in the response object rather than throwing — so it does not crash into silence, it **succeeds into silence**. It is titled *"Demo expiry — hourly"*, one character of intent from the real job now beside it. **Labelled, not deleted** — a trap that is labelled is survivable. Four-line, zero-reader deletion at the founder's word.
- **F-08.7 — no sunset marker.** A sunset row and a hand-revoked row are byte-identical afterwards, and so is a row revoked eight weeks ago: no marker, no timestamp, **no *when***. Spec P6 is *"demo rows purged after the 7-day resurrect window"* — P6 cannot compute that window. A one-column `sunset_at timestamptz` in a 0107, at the founder's sequencing.
- **Post-sunset lane reachability.** Sunset removes from Discover only; `/demo/vendor/<handle>` stays served because the demo lane reads `active` alone. Literal G-2 compliance, longer public exposure than the consent argument assumes.
- **The double mount.** `router.js:147-148` mounts the same router at `/demo/vendor` and `/demo/discover`, so every route — including the new beacon — answers at two public paths. Predates this sitting; the demo feed depends on it. Asserted by cell so a future census that greps for `/opened` finds one string and knows there are two doors.
- **`middleware.ts:47`** — the rewrite to a nonexistent `/demo/not-found`. With arm (B) ruled, it now has **no prospective destination anywhere in Block 08**. CE-118's inheritance; must survive to whichever sitting builds a demo "gone" surface, and nothing plans to.
- **`0057_demo_system.sql:26`** — `-- e.g. "₹50K – ₹2L"` in a historical migration comment. Zero reach, docs-class, do-not-cure.

---

## 9 · WHAT THE NEXT SITTING PICKS UP

**Held, not shipped:** the smoke card (pending the bride-side fixture derived by command) · the `demo.sunset_days` seed SQL, which ships in its own later message and never beside anything runnable — **unseeded means no dial**, because `src/api/admin/config.js:31-32` 404s on a key with no row and there is no insert route.

**P2 inherits:** `otp_sessions.purpose` already admits `'demo_claim'` — but `otp_sessions` is `PRIMARY KEY (phone)`, one row per phone, so a demo-claim OTP and a login OTP contend for the same row. Named at read-first, unresolved, and it is P2's design problem. `claimed_vendor_id` and `converted_lead_id` exist, are written by nothing in P1, and are asserted so by cell.

**Also inherited:** the four stale-stamp rows (`rambit_batra`, `skr.decors`, `viveranas`, `swati`) carry `discover_eligible_at` with eligibility false. The cure is live from this sitting forward; the standing four are a founder-run repair, sized but not authored, sequenced after this lands. **CE-127's 「 leave them 」 precedent exists** — repair or hold knowingly is his.
