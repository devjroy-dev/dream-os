# repo: dream-os @ 792bd37 · TDW_14 · D-1 — THE VISIBILITY RESOLVER

**Seat:** LE · **Ruling:** CE-32 Row-14 charter rulings, 2026-08-13 (Q-2 arm (b) · the split ratified, D-1 first · Q-d answered).
**Tips at build, fetch-first, SIBLING-FULL:** dream-os `792bd37` · dreamos-pwa `403faf9`.
**Repos touched: dream-os ONLY.** Zero pwa bytes.

---

## 1 · WHAT SHIPPED — six paths, one mechanism

| Path | State | What it does |
|---|---|---|
| `db/migrations/0098_circle_visibility.sql` | **NEW** | `circle_members.visibility jsonb NOT NULL DEFAULT '{}'::jsonb`. One column. No CHECK, no default block — both refused with reasons in the header. |
| `src/lib/circlePermissions.js` | re-authored | The one home gains `circlePermissions(visibility)` and `normaliseVisibility(patch)`. The frozen `CIRCLE_PERMISSIONS` block is **byte-untouched**. |
| `src/api/middleware/requireCircleMemberAuth.js` | edited | Selects the column, hands it to the one home, holds no opinion. **Q-d's one-line flip.** |
| `src/api/couple/circle.js` | edited | `PATCH /member/:memberId/visibility` — the bride's writer. |
| `docs/db/PUBLIC_SCHEMA.md` | edited | **F-SW.3's standing cure, first obeyer.** One table in the staleness header. |
| `scripts/b14_d1_visibility_bench.js` | **NEW** | 61 cells, 13 mutations, both-ways. |

**THE REGRESSION GUARANTEE, and it is the point of the shape.** Every existing row carries `{}`. `{}` resolves to zero overrides. Zero overrides resolves to the block that shipped at F-07.72, character for character. **Nobody's permissions change when this lands.** D-1 changes what is *possible*, not what is *true* for anybody today — which is what let it ship first, with no copy and no product decision inside it.

**Why the defaults stayed in code.** The 14 spec's reservation wanted `default '{"budget":false,"vendors":true,"moments":true}'` in the DDL. Refused: `circlePermissions.js` is the one home for what a permission defaults to, and a default in Postgres as well would be a second answer to that question in a second language, drifting the moment either moved. That is precisely the disease Fork E extracted this file to end, and it does not become healthy by changing planes. **The column carries overrides; the code carries defaults.**

**Why an allowlist and not a spread.** The resolver walks the *default block's* keys and reads an override for each; it never walks the stored object's keys. A `{...defaults, ...stored}` would let anything ever written into that jsonb — a typo, a hostile write, `dreamai_access_granted` — reach `req.circleMember.permissions` and the session response body. §1.8 and §1.9 are the cells; §7.M1 is the mutation that proves them.

**Why strict booleans.** jsonb holds the string `"false"` happily, and `"false"` is truthy. A permission that opens because somebody wrote a quoted word is a hole with no error message. §1.6/§1.7, mutation §7.M2.

---

## 2 · Q-d — DISCHARGED, one line, with the founder's ground attached

`requireCircleMemberAuth.js` — `userRow.name || member.invitee_name` **→** `member.invitee_name || userRow.name`.

The F-06.85 declaration at the site carries the word verbatim (「 bride's name wins. it's her circle 」), names the ground as the ground, and names R-OB.7 and F-07.107 as the two older siblings so a future reader can see this is the third of three rather than an arbitrary fallback order. **§7.M8 reddens if that paragraph is ever deleted** — the ruling is pinned at the byte, not just recorded in a log.

Estate state after this delivery: **one answer at all three sites.** §3.9 asserts it across files.

The flip is a *precedence*, not a deletion: `users.name` still answers when `invitee_name` is absent (§3.6), and both absent still yields `null`, never `undefined` (§3.7).

---

## 3 · PROOF

**Both-ways, by production-code mutation, comments stripped.**

| Tree | Result |
|---|---|
| Cured (this delivery) | `b14_d1_visibility_bench` **61/61, exit 0** |
| Uncured (`git checkout 792bd37 --` the three production files) | **30 cells RED** — every D-1 cell, and only D-1 cells |

The §1.1–§1.3 regression cells pass on **both** trees, deliberately: they assert that a member with no overrides is answered identically before and after, so a green there on the old tree is the guarantee working, not a vacuous pass.

**13 mutations, each biting a named cell, every one on production code** — never test setup. All 13 restores verified **byte-identical by sha256**; the ledger is a cell (§9.1), not a footnote.

**§7.M14 is the mutation leg's own absence cell** and it earned its place in this sitting: `mutate()` refuses to run when its target string is absent, and that refusal caught two of my own errors before they became vacuous greens (§6 below).

**FLOORS, complete, at the cured tree, sibling-full:**

- **dream-os — 21 non-zero exits, DELTA ZERO** against the seventeen the chair adopted plus the four credential-blocked (`test-shape` · `b06_gauntlet` · `bf1_bride_tool_fidelity_bench` · `b5_wa_door_smoke`, each declaring its own absent key and refusing to run). The new bench is **not** in the red set — green standalone and green in floor order.
- **`b07_f0772_circle_auth_bench` — 158/159, UNMOVED**, same pinned red (§12.14, the no-data-half elder). This is the bench that watches both my cure sites; its §13.13 (one definition, two readers) and §13.14 (the retired flag is absent) are green over the re-authored file. The three strings it pins — `can_contribute_muse:    true`, `PUBLIC_SCHEMA.md:74-89`, `THIS IS THAT SITTING, AND THIS IS THAT RE-READ` — are preserved deliberately; see §7.
- **dreamos-pwa — `FLOOR = NAMED BASE, no delta`**, the five named reds, re-run at `403faf9`. Zero pwa bytes this delivery.

**Gates:** `npm ci` clean · `npm run build` (tsc engine) exit 0 · `node --check` clean on all four JS paths.

---

## 4 · WHAT THE FOUNDER DOES — IN ORDER

**THE SQL RUNS FIRST, BEFORE THE ZIP.** The schema-doc edit inside this ZIP says `0098` is applied. Applying the ZIP first would commit a document making a claim about the database that is not yet true — this arc's own defect class.

**STEP 1 — Supabase SQL editor.** `db/migrations/0098_circle_visibility.sql`, **four blocks, each pasted ALONE** (the editor renders only the last statement of a batch): statement 1, then verify blocks 1, 2 and 3. Expected: block 1 = one row, `jsonb` / `NO` / `'{}'::jsonb` · block 2 = **14** · block 3 = `non_empty_visibility` **0**. **Paste all four results back.**

**A non-zero `non_empty_visibility` is a finding, not a surprise** — it would mean something wrote that column before this migration existed, which is impossible at this tip, so it would mean the migration is being applied twice against a tree that already moved. Stop and paste rather than proceeding.

**STEP 2 — the ZIP** (below), once block 3 is green.

**STEP 3 — edit one line.** In `db/migrations/0098_circle_visibility.sql`, replace the `[NOT YET APPLIED — ...]` bracket in the header with the apply date. 0123's law: a header still saying "not yet applied" after it is applied is a comment asserting an untrue DB fact. **This is the one edit in this delivery and it is deliberate, not a placeholder** — the date cannot be known before you run it.

**STEP 4 — the verify, then the git line as its own paste-block.**

**DASHBOARD ACTS: NONE.** No env var, no Railway setting, no Meta change, no flag flip.

**THE WALK IS NOT IN THIS NOTE, and that is the fixture-state law, not an omission.** The only member-visible consequence of D-1 is the muse switch (`can_contribute_muse` has one live reader at `dreamos-pwa app/coplanner/muse/page.tsx:22`; the other three keys are declared in the pwa type and read by nothing). Walking it needs a real active member row and her token. **Paste STEP 1's block-3 rows and I will author the walk card from them** — a card written before the rows is discovery wearing a card's clothes.

---

## 5 · THE VETO LINE — two strings, both structural, neither invented voice

D-1 was chartered zero-copy and is very nearly that. The new `PATCH` door must answer *something*, and two sentences exist. **Both are shaped from bytes already on file in the same file**, and neither is drafted product voice:

| # | String | Provenance |
|---|---|---|
| ① | `visibility must be one of: budget, guests, vendors, contribute_muse, each true or false.` | Structurally identical to `circle.js:30`'s existing `role must be one of: ${VALID_ROLES.join(', ')}.` The key list is interpolated from the one home, never typed. |
| ② | `Could not update visibility.` | Structurally identical to `circle.js`'s existing `Could not remove member.` |

`Member not found.` is **verbatim existing** in this file (two sites) and is not a new byte.

**These are API refusals on a bride-authenticated admin door, not a surface the bride reads in her own voice** — her UI would almost certainly render its own message. I have shipped them rather than stall D-1 on them, and I am naming them here rather than letting them normalise. **If either wants your pen, it is a one-line change in the delivery after your word.**

---

## 6 · MY OWN CORRECTIONS, ALL FOUR, OWNED IN-BAND

1. **The bench asserted a response envelope from memory.** §4.2 reached for `payload.data.permissions`; `src/lib/response.js` returns `{ ok: true, ...payload }` with no `data` wrapper. It reddened against correct code until I derived the shape. The cell now carries the derivation in a comment so the next reader does not re-guess it.
2. **The bench called `signCircleSession({ user_id, couple_id })`.** The real mint is `mintCircleSession({ userId, coupleId })` at `circleSession.js:90` — wrong name, wrong case, wrong keys: three errors in one call written from memory. Derived and corrected; the comment now cites the line.
3. **I let the deploy tree and the working clone diverge** — patched the clone, then patched deploy, then copied deploy over the clone and silently reverted fix 2. The second-implementation disease at the delivery layer. **Deploy is now the sole source and the clone is only ever a copy target**; the ZIP is built from deploy, not from the clone.
4. **I ran `rm -f scripts/out/closer_scenarios_*.txt` and deleted 44 TRACKED files.** I had assumed from one untracked artifact that the whole directory was untracked. Restored by `git checkout -- scripts/out/` and verified at 45 files before any further step. Nothing left the tree; **it is named here because le3's tuition is that a harness eating a live file is exactly the class that hides.**

Corrections 1 and 2 were caught by the bench's own `MUTATION TARGET ABSENT` guard and by a red cell — which is the mutation leg doing the job it exists for, on its author.

---

## 7 · FOR THE CHAIR — findings-shaped, unnumbered (REGISTER-IS-THE-CHAIR'S)

1. **F-05.80 reproduces on this tree.** The floor run at the cured tree again left `scripts/out/closer_scenarios_<ts>.txt` untracked. Confirmed live, twice, at `792bd37`.
2. **A stale line-range cite is pinned by an elder bench and cannot be cured from here.** `circlePermissions.js`'s F-06.85 paragraph cites `docs/db/PUBLIC_SCHEMA.md:74-89` for `circle_members`' thirteen columns. After the 0123 regen those lines hold `circle_activity`; the table now sits at `:1205`/`:1862`/`:2333`. **`b07_f0772_circle_auth_bench` §13.14 asserts the literal string `PUBLIC_SCHEMA.md:74-89` is present**, so correcting the cite reds an elder under a different arc. I preserved the byte. This is F-08.38's species (PATH-OVER-RANGE) with a bench holding the drift in place; RETIRE-WITH-THE-READER says the cure belongs to whoever moves the bench.
3. **The guard's own header is stale in one sentence.** `requireCircleMemberAuth.js:3-4` says it fronts "session · muse · dreamai — six doors". `dreamai` was deleted at `4ce4d3a`; it is three doors on two route files. Prose only, no behaviour, and I did not touch it — naming it rather than widening D-1's radius.
4. **The 14 spec's P3.3 says "routes exist — PATCH/DELETE member".** Only `DELETE` exists at `792bd37`; there was no PATCH on this router before this delivery. A sixth misdirection for the amend-once record if the chair wants it there.
5. **The key set remains unruled and is declared as such in the one home.** Spec C-3 says `budget / vendors / moments`; the block is `budget / guests / vendors / contribute_muse`. I did not reconcile them — UNRULED-ARM. The declaration in the header instructs its own re-read when the word comes, and §6.3 reddens if that declaration is deleted. **Three of the four keys have no reader anywhere**; a fourth key added now would be a promise the estate has not made.

---

## 8 · WHAT D-2 INHERITS

- **The choke point is real and mechanical.** §5.1 walks `src/` and asserts exactly three consumers; §5.2/§5.3 assert no second literal and no second resolver anywhere in the tree. A poll, a muse tray or a soul that wants to know what a member may see now has one place to ask and a cell that reddens if it asks anywhere else.
- **§6 is the trap set for the first money-bearing member payload.** Today zero of the seven member routes touch `expenses` / `invoices` / `payment_schedules` / `team_payments` or any amount column — derived, not assumed. The first one that does reddens §6.2 and must route through the resolver on its way in.
- **D-2 (C-6, the template) is unblocked and needs nothing from D-1.** Its two pre-conditions are unchanged: you file at Meta, and the mapper is authored **only** from the wire witness you paste post-approval (F-08.75, absolute). Its STOP-armor derivation (audit §5's UNDERIVED item — whether the bride-lane inbound path carries its own opt-out gate) is still owed and is a read-first item, not a build item.
- **D-4's home stays held** on the `events.assigned_member_ids` ownership derivation the chair ordered — writer census and FK reality before the fork is priced.

**Sequencing beyond this delivery is the founder's.**
