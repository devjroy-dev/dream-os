# TDW_08 · THE CONSOLE SITTING — EXECUTOR HANDOVER

**Base:** dream-os `5c1fced31591cf99db30251fa221a2c022071e1e` · dreamos-pwa `6e6e805d164aedd1ab1a88108c15da587bc4ae1a`
**Rulings built to:** the CE ruling on read-first part 2 (resent in Addendum 5) · Addenda 1–5 · founder words 「 authorise it 」 · 「 fold it in 」 · 「 demo plane only 」 · the V1–V4 veto record.
**Two ZIPs, never mixed.** This handover rides the dream-os ZIP and describes both.

---

## 1 · WHAT SHIPPED

**dream-os (3 files)**
- `src/lib/moneyRegisterGate.js` **NEW** — F-08.44's typed-money gate and F-08.47's positive artifact.
- `src/api/admin/demoAdmin.js` — the gate wired at both create doors; `invite_states` added to the list payload (FORK 3(c)).
- `scripts/b08_console_bench.js` **NEW** — 71 cells, nine both-ways mutations.

**dreamos-pwa (6 files)**
- `app/admin/layout.tsx` — FORK 1(e), the opacity-only keyframe.
- `app/admin/_components/AdminUI.tsx` — FORK 2(D) Toast; `FieldSelect` gains `hint` (V1).
- `app/admin/demo/page.tsx` — `canSend` (3-ii + F-08.45's linkage term), `invite_states` read, four `Required` marks, `detail`-first refusal rendering, unconditional Toast mount.
- `app/demo/vendor/[handle]/page.tsx` — F-08.46, arm 46-i.
- `scripts/tdw08_p4_factory.proof.mjs` — **FOUR LABELED AMENDMENTS**, count preserved at 45 (see §4).
- `scripts/tdw08_console.proof.mjs` **NEW** — 57 cells, eleven both-ways mutations.

---

## 2 · THE COVERAGE SENTENCE, IN MY OWN WORDS (Addendum 3 §3, binding)

**FORK 2(D) FIXES FIFTEEN OF THIRTY-ONE ADMIN TOAST SURFACES, AND ONLY THE TIMER.**

`function Toast` is declared **eleven** times under `app/admin`: the shared export in `AdminUI.tsx` and **ten local shadows** — `dashboard` · `messages` · `subscriptions` · `money` · `images` · `data` · `health` · `featured` · `preview` · `approvals`. Each shadow carries the identical `[onDone]` line and anchors `top: 20` against the shared component's `bottom:`. **Six further surfaces** render their own toast chrome and mount no `<Toast>` at all: `collab` · `couples` · `discover-heroes` · `exploring` · `photos` · `vendors`.

The cure lands in `AdminUI.tsx`. It reaches the fifteen files that import it. **It does not reach the ten shadows or the six B-only surfaces — sixteen of thirty-one.** **F-08.48** holds them; arms (E) and (F) were refused for this sitting because ten-to-sixteen surfaces changing visual chrome is a founder-eye act with its own walk.

**AND IT CLOSES THE TIMER, NOT THE BAIL.** The React equal-value bail lives in each page's own `useState`. When a second identical action writes the same string inside the window, `Object.is` bails and **no render occurs** — the shared component receives no signal and structurally cannot. What (D) delivers is that the timer is keyed on message identity and can no longer be restarted by an inline arrow's changing identity, so the toast is on screen for its full three seconds. Combined with FORK 1(e) it is on screen **at all**, which was the founder's symptom. **Closing the bail means touching call sites; that is F-08.48's arc, not this one.**

**F-08.49** additionally records that the public demo landing (`app/demo/vendor/[handle]/page.tsx`) is a family-B surface carrying the identical bail — outside `app/admin`, so outside F-08.48's population of 31. Untouched here by ruling.

---

## 3 · THE F-08.42 PROOF, LABELLED

`scripts/tdw08_console.proof.mjs` §1 **does not prove the containing-block defect.** There is no browser and no layout engine in the build container; arm (1) — a first headless-Chromium dependency — was refused as a tooling decision above a console sitting. §1 proves the **byte-level precondition**: that the animation applied to the ancestor of `{children}` declares and retains no transform, RED at the uncured tree (§M.1) and RED at arm (b)'s half-cure (§M.2). **The layout consequence has exactly one witness and it is the founder's walk.** The section says so in its own header. A green there is not a cured screen and must not be reported as one.

---

## 4 · FLOOR — MEASURED AT MY OWN HAND, MOVEMENTS DISCLOSED

**dream-os** — engine build rc=0 (`npm ci` first) · selftest **386/386** · `b08_p1_lifecycle` **106** · `b08_p4_factory` **83** · `b08_p3` **61** · `b07_p1` **75** · `b07_p5` **136** · `b07_p6` **29** · `b07_f0784_panel` **59** · `b07_f0774_stripper` **20/20** · sweep **101 → now 102 scripts, EIGHT non-zero**, exactly the named eight. **NEW: `b08_console_bench` 71/71.**

**dreamos-pwa** — `rm -rf .next` + `tsc --noEmit` **TRUE EXIT ZERO** · `scripts/*.mjs` **26 → 27**, all rc=0 · `tdw08_p3_landing` **88** · `tdw07_p4b_body` **133** · `tdw07_f0760_claim` **82** · `tdw07_p1_discover` **43** · `tdw07_p6_fold` **68**. **NEW: `tdw08_console` 57/57.**

**`b08_p3_seeing_surface` reads 61 and `shapeDemoRow.js` is byte-untouched**, as bound. FORK 4-C sites the gate at the door, so §1.2's byte-identity witness survives, §6.1/§M.7/§6.2 stand, and Addendum 1's header re-authoring is cancelled — nothing on that file moved.

### `tdw08_p4_factory` — 45, COUNT PRESERVED, FOUR LABELED AMENDMENTS

3-ii consolidates two hand-written predicates into `canSend`, and six cells read the pre-consolidation bytes. Every property they guard still holds; the cells were aimed at shapes that moved. **Re-aimed, never deleted:**

1. **§5.4 + §M.7** — asserted `rows.filter(v => …!v.linkage_held_by…)`. Now assert the linkage term inside `canSend` **by name**, plus that the batch applies it. §M.7's anchor follows the term. *This cell's own comment already recorded one re-aim, in this block, for anchoring on a shape that grew a clause. This is the same lesson a third time and the comment now says so.*
2. **§7.1 + §7.2** — asserted F-08.39's `active` term at two separate byte-shapes, one per hand-written predicate, which is the duplication F-08.45 convicted. Both now assert the one predicate; §7.2 additionally asserts the card mounts **through** it. **Strictly stronger:** the old §7.2 would have passed on a per-card expression that repeated `active` and still omitted the linkage term — which is precisely the defect this sitting cured.
3. **§M.8** — anchor follows `active` into `canSend`.
4. **§M.10** — the mutation now **bypasses** the predicate rather than editing a copy of it, which is the only way to break a consolidated rule.

**RATIFY-OR-REVERT: these four are the CE's to ratify. Nothing else in that file moved.**

### NAMED SKIPS AND OBSERVATIONS
- The seven `dreamos-pwa scripts/*.proof.ts` runners: **not run**, not on the chair's list. Named again.
- `scripts/tdw_f0774_vacuity_probe.mjs` **refuses on a dirty tree by design** and prints why. It returned non-zero mid-build and rc=0 after a local commit. **Not a red — a guard doing its job.** Disclosed so the count is not read as a regression.
- Three credential-gated live rigs in dream-os remain non-zero and are not benches.

---

## 5 · THE BEHAVIOUR DELTA (disclosed, not discovered)

**A row failing both the register gate and a later gate now reports the register reason.** The gate is sited immediately after the required-field check and **before** the intra-batch handset scan and the photo floor, per the CE-ruled principle **ROW-INTRINSIC CHECKS BEFORE CROSS-ROW CHECKS** — a bad rate is a fact about the row's own bytes and is fixable by editing that row; a collision is a fact about the batch. The row is refused either way; only the named reason moves. Celled at `b08_console_bench` §2.14, §3.7, §3.8, and mutation-proven at §M.9.

**`handleCreate` now renders `d.detail || d.error`.** Every older refusal carries its sentence in `error` and no `detail`, so this adds the new bytes without moving a single old one. `page.tsx:237`'s pre-flight line (V4) is byte-untouched.

---

## 6 · RESIDUALS, NAMED

- **The twelve stored demo rows are untouched and ungated on all five `rate_display` sites.** This gate binds new writes only. Remediation of stored values is founder-run SQL on a later ruling and ships conditional-withheld or not at all.
- **F-08.47** is a declared gap with a mechanism, not a promise: `b08_console_bench` §4 asserts the gate module has exactly one wired caller **and names it**, that every symbol its header cites **resolves in the cited file**, and that the consent reason is present (§M.8 reds if the reason is deleted). No cell asserts a negative about the real plane, per NOTE_19 §6(g); §4.10 records that refusal durably.
- **F-08.48** and **F-08.49** as in §2.
- `src/lib/discover/shapeVendor.js` — **zero bytes**, verified untouched.

---

## 7 · TWO CORRECTIONS I OWN

1. **My part-1 message said FORK 2(D) "fixes the bail and the timer-restart in one place." The bail half was wrong** and is corrected in §2 above and in `AdminUI.tsx`'s own comment. Reported before the packet rather than left in the handover.
2. **The gate's header cited `EDITABLE_FIELDS` and `WEIGHTS`. Neither symbol exists** — the real ones are `ALLOWED_FIELDS` (`src/api/vendor/me.js`) and `TERM_WEIGHTS` (`src/lib/vendor/profileScore.js`). Both were authored from memory. My own §4.7 cell caught them, and it now **resolves** every cited symbol in its cited file rather than matching a string, so a pointer that reads well but points at nothing fails loudly. The wrong symbols and their correction stand in the file.

**Arithmetic note carried forward:** F-08.46 has **eight** precedents (`toastIn` plus `slideDown` at seven auth surfaces); nine is the site count including the defect. Addendum 1 said nine, Addendum 5 said eight. The in-file comment says eight.

---

## 8 · THE FOUNDER'S WALK CARD

Authored from the founder's fourteen pasted rows. **He performs and pastes; the executor reads the evidence.** Reconciled step by step against §1's build list; steps with no thumb-path are named as such rather than invented.

### STEP 1 — the create form. Costs nothing: no row, no template, no state change.
1. Open **Demo** in the admin console. Press **Create Demo**.
2. **Before pressing anything else, look at the four field labels.** IG Handle, Display Name, Category and City should each read **`Required`** on the right of the label. *(V1 · evidence: four marks, all four fields.)*
3. Leave every field empty. Press **Create**.
4. **Does a toast appear at all, and can you read it where a toast belongs?** It should read *Handle, name, category and city required.* *(F-08.42 LIMB 1 · V4 unchanged.)*
5. **Press Create a second time immediately.** The toast should still be on screen and readable. *(F-08.42 LIMB 2, as cured — see §2: the timer, not the bail. If it is on screen, the cure did its job.)*
6. **Scroll the board down and press Create again with the fields still empty.** The toast must still be at the bottom of the *screen*, not somewhere down the page. *(This is the anchor test for the shared component.)*

### STEP 2 — the anchor split, one surface of each kind.
7. Open **Money** (a shadow-Toast surface, anchored `top: 20`), scroll down, and trigger any action that toasts. **Note where the toast lands.**
    **NAMED, NOT A PASS/FAIL:** the ten shadow surfaces are **not cured by this ZIP** (§2). This step measures F-08.48's residual so the next sitting has a datum, and a toast landing wrong here is the expected result, not a regression.
8. Open **Invite requests → Makers**, open a request drawer, and confirm the drawer covers the screen edge-to-edge. *(This is the double containing block: `_list.tsx` nests inside the layout wrapper and was cured only because the fix is sited on the class.)*

### STEP 3 — F-08.45, both directions on one real row. Zero cost, zero templates.
9. **BEFORE applying these ZIPs:** find **`swatitomar_p4b` · Swati Test Demo 2** in the **built** column. It carries a red border and a **`linked to @swatitomar_p4`** badge. Note that the column has **no `Send 1 invite` button above it** while the card **does** have an armed **Send invite**. *That one frame is F-08.45.*
10. Press that card's **Send invite**. It should refuse — the route answers 409 `shared_handset`, **no template is spent and the row stays `built`**. *(A reproduction, not a discovery: CE-178 witnessed this exact refusal on this exact row. **The refusal path is byte-unchanged by this delivery** — verified: nothing in this ZIP touches `_inviteOne`'s guard.)*
11. **AFTER applying and deploying:** the same card's **Send invite** is **gone**. The red border and the `linked to @swatitomar_p4` badge **remain** — the cure removes an armed control, never the explanation.

### STEP 4 — F-08.44, on the bulk paste. Zero photos, zero rows written.
12. Open the **bulk** tab. Paste exactly this one line and build:
    `zzz_register_probe,Register Probe,makeup,Delhi,,Rs 50K`
13. The result should read a refusal naming **`rate_register`** and carrying **`Rate must be written in full — Rs 50,000. No symbols, no K or L shorthand.`** *(V2 · nothing is written; `insertedCount` 0.)*
14. Paste and build:
    `zzz_about_probe,About Probe,makeup,Delhi,,,Packages from Rs 2L`
    It should refuse with **`about_register`** and **`About must write money in full — Rs 50,000. No symbols, no K or L shorthand.`** *(V3.)*
15. **NAMED WITNESS GAP:** the same two refusals on the **single-create** form are **not reachable by thumb**. That form pre-checks the photo floor client-side and never POSTs without six images staged. Opening it would mean putting the register predicate in the console, which would make the surface a second authority on a rule the route owns — refused, and the CE upheld the refusal. Those two paths are proven by cell (`b08_console_bench` §2.1–§2.8) and **not** by his eye.

### STEP 5 — F-08.46, on the public landing. Zero writes.
16. Open **`https://demo.thedreamwedding.in/vendor/swatitomar_p4`** on the phone. *(That row is `opened` and `active`, so the landing renders.)*
17. Tap the **WhatsApp contact** control, or the **Circle** control.
18. A toast rises. **It must be horizontally centred.** *(Before this ZIP it was pushed right: the generic keyframe's retained `translateY(0)` overrode the inline `translateX(-50%)` for the element's whole life.)* The words are the two CE-117 lines and are **byte-unchanged** — zero copy bytes in this cure.

### WHAT THE WALK CANNOT SHOW, STATED
- The single-create register refusals (step 15).
- The equal-value bail itself, which is not cured (§2).
- The ten shadow surfaces and six B-only surfaces (§2, F-08.48); step 7 measures, it does not test.
- Any layout fact on iOS Safari, Android Chrome or the Instagram in-app browser beyond what his own device is.

**Two rows named `zzz_register_probe` / `zzz_about_probe` are never created** — both are refused at the door. Nothing to clean up.
