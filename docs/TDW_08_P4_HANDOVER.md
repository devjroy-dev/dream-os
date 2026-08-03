# TDW_08 · P4 — THE DEMO FACTORY (ADMIN) · EXECUTOR HANDOVER

**Base:** `dream-os 4402bf4` · `dreamos-pwa a211175`, both re-derived at origin fetch-first.
**Two ZIPs, one sitting.** This document rides the dream-os ZIP.

---

## 1 · F-08.36 HEADS THIS HANDOVER, BY CE RULING

**The per-card send-invite is not a feature. It is the closing of an orphan limb against a founder ruling.**

`POST /admin/demo/vendors/:id/invite` has existed and been callable since Sitting A, shipped under 「 I fire invites through admin console 」 (`demoAdmin.js`, the invite caller's header). Until this delivery **no control on the console called it**. The ruled path was curl-only for its entire life, and a syntax grep could not see the gap because the console's sibling calls are computed (`/vendors/${id}/${endpoint}`) — the ORPHAN-LIMB LAW's exact warning, which nearly convicted a correct executor at the ruling desk.

`POST /vendors/:id/activate` remains orphaned and is **not** P4's; it sits inside F-08.9's parenthetical.

---

## 2 · WHAT SHIPPED

### dream-os

**`src/api/admin/demoAdmin.js`**
- **FORK B(a).** `MIN_PORTFOLIO_IMAGES` and `MAX_PORTFOLIO_IMAGES` are **imported** from their enforcing homes. One `_photoGate` serves the console create and the bulk build — the bulk route is this file's second author over that rule and it got a function, not a copy. **The ceiling is the demo plane's first server-side cap**: before this delivery `POST /vendors` accepted five hundred photos.
- **GET `/vendors`** now carries `states` (the frozen `demoLifecycle.STATES`), `min_portfolio_images`, and two shared-handset facts per row. **`max_portfolio_images` is deliberately NOT sent** — a number the client never receives is a number it cannot contradict.
- **FORK A(c) — `POST /bulk`**, sheet-shaped, mirroring the prospect lane's own bulk. Duplicate handles are **skipped, not errored**, so a corrected sheet re-uploads whole. Mounted under the **singular** path that exists; the spec's `/admin/demos/bulk` was written against a namespace that never landed.
- **FORK D(c) — the intra-batch phone pre-scan.** Every member of a colliding group is refused, never all-but-the-first: picking a winner would be a route deciding which of the founder's two rows is real.
- **FORK D(c) — the shared-handset refusal**, fired **before** the send, for the same reason every other pre-check is.
- **`_inviteOne` extracted.** The single route and the batch route share one pre-check/send/state ordering. The order is the correctness (CE-146 §5); a second implementation would be a second opinion about when a template may be spent.
- **FORK C(a) — `POST /invite-batch`.** Over-length is **refused, never truncated**. Sequential by construction, never `Promise.all`: two sends racing on one phone would both read "unlinked" and both write.

**`src/lib/demoInviteBatch.js` (NEW)** — FORK C(a)'s own home. Key `demo.invite_batch_max`, default 25, namespaced beside `demo.sunset_days`. **The naming rider is mechanical, not a promise**: `§5.10/§5.11` assert no identifier or label in either the home or the batch route says "daily".

### dreamos-pwa

**`app/admin/demo/page.tsx`** — rebuilt. Eight-column board off the wire's `states` · funnel counted from **stamps, not current state** (a claimed row is counted at every stage it passed through) · category × city breakdown · bulk paste · per-card and per-column send-invite · shared-handset and linkage badges · **C1–C5 landed** · the `< 10` upload hide **deleted, not raised**.

**`lib/vendor/discoverFloor.ts`** — F-08.38 corrected on contact, path plus symbol.

---

## 3 · THREE SPEC CLAUSES REPORTED, NOT BUILT (§0.2)

**3.1 · THE IG PIPELINE FETCH.** CE ruling FORK A(c): neither built nor struck. Enumerated in-file — **provider · credential · rate limit · IG ToS posture**. **UNNUMBERED at this delivery**: the ruling minted it without assigning a finding number and an executor does not mint numbers. **The chair to number.**

**3.2 · "ALSO CREATE PROSPECTS" HAS NO TRUTHFUL STATE.** `cold` re-opens the **cured** F-08.10 through a different door — `onInvited` seeded `cold` and put demo vendors straight into `runOpenerJob`'s harvest. `templated` is what `onInvited` uses and is literally true *there* because a template was just sent; at **build** time nothing has been sent, so the state would assert a send that did not happen and `last_template_at`'s module-scoped meaning (F-08.11) would begin lying to `demoLeadAlert`'s 48h suppression. A state meaning "known to us, never contacted, not harvestable" does not exist, and minting one is a lane decision, not a route's.

**3.3 · RE-SEND CANNOT BE BUILT.** Spec §P4 asks for re-send "only to `expired`, new 72h window". `demoLifecycle.INVITE_STATES` is frozen to `['legacy','built']`, so `expired → invited` is an illegal transition by the module's own authority. Widening it is demoLifecycle's act and nobody ruled it. **"View conversation" is likewise unbuilt** — no conversation or prospect id rides the vendors response, and adding one is another route change outside the ruling.

---

## 4 · TWO EXECUTOR MISSES AND ONE HOLLOW CELL, ON THE RECORD

**MISS 1 — MY BENCH BROKE THE COMMENT-BLINDNESS LAW IN ITS OWN FIRST RUN.** §6.1/§6.2 asserted the stale strings were **absent** from `demoAdmin.js` and fired on my own F-08.38 attribution, which quotes them in order to record what was corrected. **Second sitting running that this law has been broken inside a bench written under it.** The cells now assert **confinement, not absence**: the stale form survives at most once, on a line that names the finding.

**MISS 2 — MY FIRST MUTATION HELPER WAS ASYNC-UNAWARE.** `predicate()` returned a promise the helper never awaited, so **every `okMutate` passed vacuously** — eleven both-ways cells proving nothing — and one leaked a live send into the next section's spy count, producing a false red two sections later. Caught by that false red, not by re-reading. The helper is now `async` and every call site awaits.

**ONE CELL CUT ON READ-BACK.** The pwa proof's `§6.5` asserted a dream-os file is absent from the pwa tree. It passes at **every possible tree, cured or uncured** — a tautology dressed as a check on the no-sweep discipline. Cut rather than kept for the count; the count is 36, not 37, and it is named in that file's not-asserted list.

**ONE FIXTURE CORRECTED, NOT THE CODE.** My first shared-handset fixtures collided `9888294440` with `+919888294440`. `normalizeTo` strips `whatsapp:` and a leading `+` **and nothing else** — it does not infer a country code — so those are different handsets to this estate everywhere, in the prospect lane and here alike. The fixtures were wrong, not the guard. **The limit is now declared in-file and benched as a named limit (§2.8), not left to be met in the field.** Widening it would mean a second opinion about phone identity, which F-07.47 exists to prevent.

---

## 5 · TWO SEALED BENCHES RE-AIMED — DISCLOSED, NOT SILENT

**`b08_p1_lifecycle_bench` went 104/2 at my tree.** Both failures were **anchor** failures, not behaviour: extracting `_inviteOne` out of the route removed two levels of indentation and the anchors encoded whitespace. Every behavioural cell (§11.1–§11.7, the route driven end to end) stayed green throughout. **Re-aimed to the distinctive text, carrying no indentation** — an anchor that encodes whitespace breaks on every extraction. **Back to 106/106.**

**`b07_f0784_panel_bench` §4.3 went 58/1.** The cell read `mounts === 13` — **a hardcoded tally over a file that legitimately grows.** P4 added two routes and a correct tree went red. This is F-08.38's species one layer out: a number a human must maintain by hand. **Re-aimed to the property it was always reaching for** — the guard is the first argument after the path on *every* route declaration — which cannot rot and which catches a guardless mount, the thing that actually matters. **Back to 59/59.** Its sibling §4.4 already held the count property, so nothing was lost.

---

## 6 · THE FLOOR — MEASURED, NOT ASSERTED

`npm ci` rc=0 → `npm run build` rc=0 (BUILD-ENGINE-FIRST) before every line.

**dream-os** — rig selftest **386/386** via `--rig-selftest`. (**NOT `--selftest`**, which aborts on an absent `ANTHROPIC_API_KEY`; the seventeenth chair's succession note records that flag confusion costing a sitting a declared-un-run floor.)

**Sweep: 101 scripts (100 at base + this bench), EIGHT non-zero — THE SAME EIGHT as the charter tip. This sitting added none.**
`meter` (F-06.41) · `f0555` (F-07.11) · `b5b_movementb` rc=2 (F-07.114) · `f0772_circle_auth` (F-08.13) · `p4b_body` (F-08.14) · three credential-gated live rigs that refuse loudly by design and are not benches (`b06_gauntlet` bare, `b5_wa_door_smoke`, `test-shape`).

**`b08_p4_factory_bench` 68/68 NEW** · `b08_p1_lifecycle` **106 PAIRED** (re-aimed, §5) · `b08_p3` **61** · `p5` **136** · `p6` **29** · `f0784` **59** (re-aimed, §5) · `f0791` **38** · `crons` green · `auth_crossover` green · `b5c_prospect_lane` 47 green.

**dreamos-pwa** — `tsc` **TRUE-EXIT ZERO** on a cleared `.next`. **All 21 `.proof.mjs` rc=0, zero non-zero.** `tdw08_p4_factory` **36/36 NEW** · `tdw08_p3_landing` **88** · `f0760_claim` **82** · `p4b_body` **133** · `p1_discover` **43** · `p6_fold` green.

**NAMED SKIPS.** The seven `scripts/*.proof.ts` runners — not on the chair's list, not run. `tdw_stripper_census.mjs` — a census, not a bench.

**Both trees `git status` clean after the sweep**: no mutation left behind, nothing wiped. P3's MISS 1 cure applied — a **local LE commit before the sweep**, so `git checkout -- .` restored to my tree and not to origin's. **An LE commit is not a push.**

---

## 7 · FOUNDER SMOKE CARD — RECONCILED STEP BY STEP

Fixture state **must** come from your pasted rows first (FIXTURE-STATE law). Block 1 of the read-first returned twelve rows, max five photos, all below six; Block 2 returned exactly one prospect linkage (`918700521064 → legacy_jewellers`).

| # | You do | Executor reads | Reconciled? |
|---|---|---|---|
| 1 | Open Demo Profiles. Board shows eight columns | eleven rows under `legacy`, one under `expired` | ✅ |
| 2 | Open Create Demo, add five photos, press Create | refusal reads **Need at least 6 portfolio images. You have 5.** | ✅ |
| 3 | Add a sixth, press Create | 200, row lands `built` | ✅ |
| 4 | Check the rate hint | reads **Rs 50,000 – Rs 2,00,000** | ✅ |
| 5 | Bulk-paste two rows sharing one phone | both refused, `shared_handset_in_batch` | ✅ |
| 6 | Press **Send invite** on `legacy_jewellers` | template lands; row → `invited`; `invited_at` stamped | ✅ |
| 7 | Press **Send invite** on a second row on that same handset | refused **`shared_handset`**, naming `legacy_jewellers`; **no template spent** | ✅ |
| 8 | Open the Funnel tab | built/invited/opened/engaged/claimed reconcile by hand | ✅ |
| 9 | **Build a demo from a real IG handle** (spec §5) | **NO THUMB-PATH** — the fetch does not exist under FORK A(c). This step is manual paste or it is nothing. | ❌ **NAMED** |

**Only your device can witness:** that the template actually arrives, and that the board is usable on a phone. Step 6 spends a real template on a real handset — **do not fire it on both rows of a shared-phone pair**; step 7 exists to prove the route now stops you.

---

## 8 · WHAT THE CHAIR OWES

1. **A number for the IG-ingestion finding** (§3.1).
2. **A ruling on §3.2 and §3.3** — whether "also create prospects" and re-send are deferred, struck, or chartered elsewhere.
3. **A ruling on the two sealed-bench re-aims** (§5), both disclosed rather than papered.

Sequencing beyond this sitting is the founder's.

---

# ADDENDUM · ZIP 2 OF THIS SITTING — F-08.39 / F-08.40

**Base:** `dream-os ca8f0fd` · `dreamos-pwa c5a66bb`. Both findings surfaced by the founder's walk on the delivered tree, not by a bench.

## A1 · F-08.39 — RULED (c), BOTH LIMBS SHIPPED

**MECHANISM** (`_inviteOne`): `active` joins the pre-check select and an `active=false` row is refused **`inactive_demo`** before any template is spent. It sits at the single point both the card route and the batch route pass through — a guard that lived at the route would inherit nowhere.

**PRESENTATION** (`page.tsx`): `invitable` and the per-card button both filter `active`, so the founder never meets that refusal at a control that looked armed.

**THE TWO-LAYER SYMMETRY IS NAMED IN-COMMENT ON BOTH SIDES** per the ruling, tied to the photo floor's own shape and conditioned on the mechanical fact that `getDemoVendor` filters `.eq('active', true)` — F-06.85 form, so the next hand to relax that filter is forced to re-read both limbs together rather than patch one.

**The bound is asserted, not asserted-about**: `§8.7` proves a `removed` row was already refused as an illegal transition and still is. The finding only ever reached rows whose inactivity predates the P1 fold.

## A2 · F-08.40 — RULED (a), (b) RETAINED, (c) REFUSED

The label counts **distinct handsets**; the batch still sends **all ids**, because the per-row guard produces one sent and one refused where group-refusal would send zero. The confirm dialog counts handsets too, so the number approved is the number that sends. The toast's `Sent 1 · refused 1` reconciliation stands.

**THE CE RIDER IS SATISFIED WITHOUT A FOUNDER STOP.** `Send {n} invite{s}` is byte-identical; only `{n}`'s source moved from rows to handsets. Arithmetic, not copy.

**The key is the SERVER's.** `handset_key` (the normalized phone) rides the vendors response so the surface groups by handset without owning a normalizer — a second one in a React component would drift from `normalizeTo` invisibly, and the label would quietly count a different set from the one the route refuses. Same shape as `min_portfolio_images` and `states`.

## A3 · TWO HARNESS DEFECTS OWNED, BOTH CAUGHT BY MY OWN CELLS

**THE FAKE SUPABASE DID NOT PROJECT.** `§M.13` mutates `active` back out of the pre-check select and expected a red. It stayed green — because `select()` was a no-op returning every column regardless of what was asked for. **A harness that cannot witness a missing column cannot convict F-08.39, which WAS a missing column.** The fake now projects on the select list. That cell's tuition, recorded in-file.

**TWO OF MY OWN PWA CELLS ANCHORED ON A LITERAL EXPRESSION.** `§5.4` and `§M.7` encoded the exact text `!v.linkage_held_by).map(v => v.id)` and broke the moment the filter legitimately grew its third clause. Re-aimed onto the property. **Same lesson as `f0784` §4.3, one delivery later, in a bench I wrote after learning it.**

## A4 · THE FLOOR AT THE CURED TREE

**dream-os** — selftest **386/386** · sweep **101 scripts, EIGHT non-zero, the same eight**, none added · `b08_p4_factory` **83/83** (was 68; +15 over F-08.39/40) · `b08_p1` **106** · `b08_p3` **61** · `p5` **136** · `p6` **29** · `f0784` **59** · `f0791` **38**. Tree clean after the sweep; local LE commit first.

**dreamos-pwa** — `tsc` **TRUE-EXIT ZERO** on cleared `.next` · **all 21 proofs rc=0** · `tdw08_p4_factory` **45/45** (was 36) · `p3_landing` **88**.

## A5 · THE WALK RESUMES

Steps 1–5 unchanged. **Step 6 is now one press:** `SEND 1 INVITE` on the legacy column — the label reads 1 because `@swati` is inactive and no longer in the batch, leaving `@makeupbyswatiroy` alone on that handset. One template, to the row whose landing actually renders.

`@swati`'s card no longer carries a Send invite button at all. If it still does after deploy, the PWA has not rebuilt.
