# TDW_09 · THE DREAM-OS MICRO — EXECUTOR HANDOVER

**Session:** fresh Opus 5, EXECUTOR, under the twenty-third chair's kickoff and its
six rulings (CE-195 read-first ruling relay, 2026-08-06).
**Repo:** `dream-os` ONLY. `dreamos-pwa` **ZERO-BYTE**.
**Base:** `9e751dc` (fetch-first at read-first AND again at delivery; pwa context `e935a2b`).
**Range issued:** F-09.61–.70, CLOSED (after the chair's range correction voiding
F-09.55–.60). **Allocated: .61, .62, .63. Free: .64–.70.**

---

## 1. WHAT SHIPPED — FOUR LIMBS

### L1 · T3-3 — `waitlist.js` retires whole  *(FORK C = (b), atomic)*

`src/api/waitlist.js` DELETED (81 lines). `src/api/router.js` loses its `require`
(was `:10`) and its mount (was `:18`) **in the same edit as the file deletion** —
an orphaned require of a deleted module is a boot crash, and splitting the two
across any boundary makes that reachable.

`waitlist_signups` **THE TABLE STANDS UNTOUCHED.** No DDL, no DML, no drop. Any
drop is founder SQL under the destructive-DB law and is not this sitting's.

Caller-zero re-proven at my own tip, both repos: dream-os had only the two router
lines; the pwa carries the tombstone comment at `app/(landing)/page.tsx:405–407`
and two admin **copy-deck labels** (`app/admin/control-room/page.tsx:138/:518`)
which are prose, not callers. Zero fetches survive.

### L2 · F-09.48 — pin-status answers for both roles  *(FORK A = (a))*

`role` **PRESENT** → the single-role contract, unchanged. `role` **ABSENT** →

```
200 { ok: true, user_id: uuid|null,
      vendor: { exists, pin_set, role_id },
      couple: { exists, pin_set, role_id } }
```

**Non-exclusivity honoured as ruled.** `0028_pin_auth.sql:43` states in its own
words that the role-XOR triggers fire on INSERT only and an UPDATE violating XOR
would NOT be caught. Both-populated is therefore representable, so the endpoint
**reports both rows truthfully** — never throws, never silently picks. A
`console.warn` names the user_id when it happens. **Which door a both-populated
member is offered is the consumer's presentation question and is not answered
here** — named-handed forward with the rewire.

**Backward compatibility, proven by diff, not by argument.** The single-role
branch is byte-identical in executable code to `HEAD:src/api/pin-status.js`.
The ONE delta in that branch is a **comment**, disclosed below (D-1).

### L3 · F-09.50 + F-09.63 — the dead reader and its lying header  *(FORK B = (b))*

`src/api/vendor/today.js` DELETED whole (188 lines), caller-zero re-proven by a
walk of every `.js`/`.ts` under `src/` — nothing requires it; the Phase-4 flip at
`src/api/vendor/core.js` (symbol: the `'/today'` mount) has pointed that path at
the engine file since it landed.

**And `vendor-engine/today.js:5` cured in the SAME COMMIT, per the chair's
"regardless".** That line called the file this commit deletes "**The live**". The
re-authored header states that THIS file is the live route, names the flip
**mechanism by path and symbol** per F-06.85 and the path-over-range law, and
records why the cure had to travel with the deletion.

### L4 · F-09.53 — the covenant clause

`.is('deleted_at', null)` added to the events query in
`src/api/vendor-engine/today.js`. **CONJUNCTION, per the conjunction law:** it
stands BESIDE `.eq('state','upcoming')`, which is untouched. Neither predicate
substitutes for the other, and the in-code comment says so in those terms.

Column witnessed before authoring per the SQL-provenance law:
`public.events.deleted_at timestamp with time zone` at
`docs/db/PUBLIC_SCHEMA.md:434` (§1 `public.events · 17 columns`), corroborated by
a second, differently-failing witness — `events_active_idx … WHERE (deleted_at IS
NULL)` at `:2413`.

---

## 2. PROOF

### `scripts/tdw09_micro_bench.js` — **23/23 GREEN cured · 9/23 UNCURED**

Fourteen reds at the uncured tree, **on exactly the cures**, every red a mutation
of PRODUCTION code and none of test setup. Tree-root parameterised
(`node scripts/tdw09_micro_bench.js [TREE_ROOT]`), runnable from any working
directory (Q-SP-5); the both-ways run is the SAME bench against the two trees, not
two benches.

**THE NAMED TEST — §3.3.** A soft-deleted `state='upcoming'` event inside the
+7-day window. At the uncured tree it comes back RED with its own sentence: *"the
soft-deleted wedding was served to the vendor."* At the cured tree it is absent.
§3.4 proves the cure does not over-filter (the live event still arrives) and §3.5
proves the state predicate still bites (a cancelled row stays out) — the
conjunction asserted behaviourally, not just by grep.

**The backward-compat cells (§4.1/.2/.3) pass at BOTH trees deliberately.** A
cell that goes green only after the change cannot prove nothing moved; these are
the byte-identity proof and their double-green is the point.

L2 and L4 drive the **real route handlers off the real express routers**, module
required from the tree root, terminal handler taken off the router's own stack.
Auth middleware is skipped deliberately and disclosed in-file: these cells assert
the query and the response shape, which is what a caller reaches AFTER auth.

### `node --check` — clean on every touched file

`src/api/router.js` · `src/api/pin-status.js` · `src/api/vendor-engine/today.js`.
Plus the boot-path grep: every relative `require` in `router.js` resolves to a
file that exists (bench cell §1.5).

### The floor — **RESTATED, NOT MOVED**

The four known reds reproduce **EXACTLY as attributed**, run at the cured tree:

| bench | this run | attributed |
|---|---|---|
| `b06_meter_bench` | 28/29 | 28/29 |
| `b05_f0555_media_dedupe_bench` | 22 passed, 1 failed | 22/23 |
| `b07_f0772_circle_auth_bench` | 158 passed, 1 failed (§12.14) | 158/159 |
| `b07_p4b_body_bench` | 75/76 (§5.26) | 75/76 |

My radius touches neither of the two stale schedule-guards; they stay as-is.

Every bench that so much as MENTIONS my radius, run at the cured tree, all green:
`b07_f0791_guard_stack` 38/38 · `b08_p1_lifecycle` 106/106 · `b07_auth_crossover`
33/33 · `b07_f0784_panel` 59/59 · `b07_f0772_circle_auth` at its attributed red.

**And the delta claim, which is the one I can actually make from a keyless
container:** all 107 bench scripts were swept at BOTH trees under an identical
environment, and the two result sets are **identical** — my ZIP moves zero
benches. I do **not** claim the absolute floor is otherwise healthy from here: the
gauntlet's `selftest` requires `ANTHROPIC_API_KEY`, which an LE container holds
none of by design, so **the 386 is not re-derived by me** and is carried as the
chair's number, not mine.

---

## 3. DISCLOSURES — every one by name

**D-1 · One comment corrected inside the otherwise byte-identical single-role
branch.** The original `:100–103` comment said the 0028 XOR trigger "prevents
both". `0028_pin_auth.sql:43` says the triggers are INSERT-only. Shipping that
sentence unchanged, one screen below a new contract built *because* the XOR is not
a guarantee, would have re-shipped the inaccuracy beside its own cure. Changed to
"prevents both on INSERT". **Zero executable bytes moved on that path** — the diff
of `const roleTable` → `module.exports` is otherwise empty.

**D-2 · The apply chain cannot delete, and two limbs are deletions.** §7's chain
copies; it has no `rm`. The kickoff's ACCEPTANCE quoted the chain with no deletion
extension named. **The chain ships VERBATIM and untouched**; the two chartered
deletions ride as their own explicitly-labelled `rm` line ABOVE it, inside the
same paste block, after the head guard. Flagged as a deviation from the kickoff's
literal ACCEPTANCE text for the chair to ratify or bounce — I did not modify the
law's bytes to make my delivery fit.

**D-3 · `vendor-engine/today.js:77` LEFT BYTE-UNTOUCHED and named.** It says the
route is "DORMANT (fetchToday has no callers)". That is TRUE at `e935a2b` and
becomes FALSE the moment O-2's ZIP lands — F-09.50's exact class, arriving on a
timer. It is **not** in this sitting's charter and the ruling that cured `:5`
turned on the comment praising a file the commit deletes, which this one does not.
**Handed to the O-2 session by name**: cure it in the ZIP that creates its caller.

**D-4 · My parallel floor sweep flaked twice and I caught it by re-running
serially.** At `-P6`, `b06_m2_bench` and `b06_m3_bench` reported different counts
on the two trees. Serial re-runs gave **identical** figures on both trees (m2 36/7,
m3 31/6). The moving numbers were my own harness's concurrency, not the repo's —
same family as the `b06_m4_bench` flake already filed watch-only at F-08.88. Not
minted; disclosed, and the serial figure is the one I report.

**D-5 · `b06_m1_bench` times out at 60s** under the sweep, identically at both
trees. Not investigated — outside radius, stated so the number is not read as a
result.

**D-6 · The engine `dist` had to be built** (`npm run build`) for the sweep to
run at all; both trees were given the same dist. No dist artefact is in the ZIP.

---

## 4. FINDINGS MINTED — F-09.61, .62, .63

**F-09.61 — THE DEAD PIN-STATUS CLIENT, WRONG THREE WAYS.**
`dreamos-pwa lib/vendor/api/vendor.ts` (symbol: `pinStatus`) issues a **GET with a
query string** against a **POST-only** handler; types its response
`{ ok, has_pin }` (`lib/vendor/types/vendor.ts`, symbol: `PinStatusResponse`) when
the server has never returned `has_pin`; and has **zero callers** repo-wide.
`app/coplanner/layout.tsx` documents the same discovery in its own comment and
removed its fetch by ruling. **OPEN — pwa-side, zero-byte here.** It is what a
future consumer reaches for first, which is precisely the risk as O-2 wires the
both-roles call. Cure travels with the rewire.

**F-09.62 — THE COVENANT IS HONOURED AT 38 OF 64 EVENTS READS. FILED ONLY, as
ruled.** `src/api/vendor/day.js` (symbol: the day-sheet events query) states the
covenant as "every events read". Mechanical sweep of all 77 `from('events')` sites
(64 reads / 13 writes), each read's chain window tested for `deleted_at`:

*Vendor lane, live, covenant-skipping (limb 4's own site now cured):*
`src/lib/vendor/snapshot.js` · `src/lib/vendor/calendarSignals.js` ×3 ·
`src/api/vendor-engine/chat.js` ×3 (the WA/PWA twins of the three above) ·
`src/api/vendor/studio/briefing.js`.

*Outside the vendor lane:* `src/agent/engine.js` ×3 and `src/agent/briefing.js` ×3
(**W-1 — filed, untouched, and their cure sitting must open under the wall**),
`brideEngine.js`, `brideSystemPrompt.js`, `brideNudge.js`, `couple/events.js`,
`couple/today.js` ×2, `admin/router.js`.

**Chair's grading, recorded:** `src/lib/vendor/snapshot.js` is the **priority
specimen** — the one site where the miss reaches a vendor's ears through Victor's
mouth, and it is W-1-adjacent, so its cure sitting takes the wall's discipline from
birth. Founder-sequenced.

**F-09.63 — THE HEADER THAT CROWNED THE CORPSE.**
`src/api/vendor-engine/today.js` opened by calling the unmounted legacy reader
"The live". F-09.50's class, one file away from it, inside limb 4's own file.
**CURED THIS SITTING** in the commit that deletes its subject.

---

## 5. THE FOUNDER'S WITNESS — card-reconciled per CE-59

Every step is a self-contained zero-placeholder block. **Step 1 ships first and the
reading of steps 2–3 is authored against its pasted rows** (fixture-state law:
production state is unreachable from an LE container, so the SELECT comes before
the card's verdict, never after).

**What only the founder's hand can witness:** deploy-green on Railway, and the
live rows behind the two curl pairs. The bench proves the wiring; it cannot prove
the deploy.

**Step reconciliation against the build list:** L2 → steps 2 and 3 (both contracts
exercised). L1 → step 4 (the retired route is gone). L3+L4 → **no thumb-path
exists** and I name it rather than invent one: L3 is a deletion of an unmounted
file with no reachable URL, and L4's cure is invisible until a vendor has a
soft-deleted upcoming event on the books. Both are bench-witnessed only, and the
card says so.

Steps live in the delivery message, not this document, per the transport law.

---

## 6. HANDED FORWARD, BY NAME

1. **The pwa consumer rewire for F-09.48** — NAMED-HANDED, never built here.
   Carries F-09.61's cure (the dead `pinStatus` client) and the both-populated
   presentation question.
2. **`vendor-engine/today.js:77`** → the O-2 session (D-3).
3. **F-09.62's cure sitting**, `snapshot.js` first, founder-sequenced.
4. **F-09.50/.53 are not in `FINDINGS_LOG` at `9e751dc`** — chair correction №14
   owned; the entries ride the O-2 session's unpushed handover.
5. **Free range: F-09.64–.70.**

**Push order:** this ZIP at-or-before O-2's deploy, per R-O16-AMENDED. Sequencing
beyond this sitting is the founder's.
