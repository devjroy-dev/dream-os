# TDW_08 · P6 — DELETION, TRUTH, AND SWEEP · EXECUTOR HANDOVER

**REPO:** `dream-os` · built at `e34e55b` (derived by command; docs-only over the
charter's `48d0395` — verified `git diff --stat`, one file, `NOTE_21`).
**Sibling:** `dreamos-pwa` `e3210b5`, cloned for the paired floor and the truth
audit. **ZERO PWA BYTES CHANGED** — `git status` empty on that tree.

Built under CE ruling R-B1→R-B10, addenda AD-B1→AD-B7, twenty-second chair.

---

## 1 · WHAT SHIPPED

| Limb | Where | Ruling |
|---|---|---|
| The verifying destroy | `src/lib/admin/cloudinary.js` — new `destroyVerified` + `publicIdFromUrl` | R-B3 |
| The purge door (sole deleter) | `src/lib/demoLifecycle.js` — new `_purgeRow`, sited beside `_write` | R-B5 |
| The window's first code home | `DEMO_PURGE_RESURRECT_DAYS = 7` + `demo.purge_resurrect_days` dial | R-B8 |
| The nightly sweep | `runPurgeSweep`, both predicate legs | R-B2, R-B4, AD-B1 |
| The cron | `src/cron.js` — 04:15 IST, after the 03:45 sunset | R-B8 |
| The retention note | `docs/SCHEMA.md` — new section, plain words | spec P6 |
| The bench | `scripts/b08_p6_purge_bench.js` — 54 cells, 9 mutations | acceptance |

**The legacy `deleteFromCloudinary` ships BYTE-UNTOUCHED**, asserted by a cell
(§8) so a later hand cannot quietly verify it and move four admin surfaces
inside a sitting that never read them.

---

## 2 · THE PREDICATE, AS IT SHIPPED

```
window = readPurgeDays()            # 7 default · dial demo.purge_resurrect_days · 0 = OFF
if window == 0: return              # kill switch, checked BEFORE any cutoff exists

LEG 1 · TAKEDOWN   state = 'removed'  AND claimed_at IS NULL
                   AND removed_at IS NOT NULL AND removed_at <= cutoff

LEG 2 · SUNSET     state <> 'removed' AND claimed_at IS NULL
                   AND discover_eligible = false
                   AND sunset_at IS NOT NULL AND sunset_at <= cutoff
```

Then per row: resolve every photo's public id (stored `cloudinary_id` first,
URL-parse second) → destroy each → **only if all confirm GONE**: count leads →
NULL pointing `prospects.demo_vendor_ref` → delete the row.

---

## 3 · FINDINGS

**F-08.90 — CURED.** The history-stamp purge hazard. Both legs conjoin their
live condition; neither reads a stamp alone. Proven both ways by mutations M-1
and M-2, which delete a restored row and a feed-live row respectively at the
mutated tree.

**F-08.91 — CURED AT THE P6 SEAM, ARM RECORDED.** `destroyVerified` checks
`res.ok` and Cloudinary's `result`; `"ok"` and `"not found"` both count as gone
(a not-found treated as failure would wedge the retry loop forever on exactly
the most-finished rows). **Remaining arm, not widened:** the legacy
`deleteFromCloudinary`'s four admin callers, and `portfolio.js:63`'s sibling
destroyer, still swallow every failure. Also inside this arm: `publicIdFromUrl`
is a **DECLARED DUPLICATE** of `portfolio.js:78`'s regex — unifying them requires
editing the function R-B3 froze, so it ships named rather than re-typed as new.
Founder-sequenced.

**F-08.92 — RECORDED** per AD-B2. The muse-table name divergence
(`SCHEMA.md` documents `demo_muse_pool`; production holds `public.muse_pool`).
No purge scope change — the muse pool was outside scope by R-B6. Doc cure owed
eventually; joins Phase 3's doc-gap #1.

**F-08.93 — MINTED. THE CLAIMED-ROW EXCLUSION. Executor-added guard, §0.2
disclosed, ruling owed.** Neither ruled leg names `claimed`, and a claimed row
reaches **both**: `onClaimed` (:395) writes `state` and `claimed_at` and touches
**neither presence flag**, and sunset never changes state — so a row sunset and
*later* claimed carries `discover_eligible = false` with a stale `sunset_at` and
satisfies leg 2 exactly. `onRemoved` is reachable from `claimed`, so leg 1
reaches one too.

Why it must not purge today: **P2 owns the claim flow and is DEFERRED by founder
word — unbuilt.** The spec says a claim "carries photos" to the real account, and
whether that is a Cloudinary re-upload or a *reference to these same assets* is
undecided. If it is a reference, purging here destroys a paying vendor's live
portfolio. Under the UNRULED-ARM law an unruled arm is not a licence, so both
legs conjoin `claimed_at IS NULL`, mirroring `runSunsetSweep`'s own `:645`.
Narrowing a destructive predicate is the safe direction. **The arm re-opens the
day P2 states its copy semantics** — it should not be forgotten open.

**F-08.94 — MINTED. THE CLOSER SELLS ON A CLOCK THAT NOW HIDES A SECOND
DEADLINE.** `closerEngine.js:~270` hands the model *"Days left before it rotates
out of the marketplace: N. This is a real clock and you may say so."* That
sentence is still **true** — the sunset predicate did not change. But after
AD-B1 the rotation is no longer the end of the story: seven days later the row
purges and the photographs are destroyed at Cloudinary. A vendor told he has
twelve days before it "rotates out" may reasonably hear *and I can still claim it
after* — and at day nineteen there is nothing to claim. The Closer's context
block is silent about the harder deadline it now sits in front of.

Not cured here: the cure is copy in a model-voiced surface (founder veto) and
sits behind W-1, which this sitting held shut — **zero soul bytes**, confirmed.
Filed for its own sitting beside the Closer's veto ledger.

*Found by obeying that block's own instruction: its `MECHANISM NAMED` comment
says "If that predicate changes, this block is wrong and must be re-read with
it." F-06.85's standing law paying for itself.*

**Next free mint: F-08.95.**

---

## 4 · THE TRUTH AUDIT (spec limb 2) — CLEAN, GREP-AND-VERIFY, WITNESSES RECORDED

**The demo landing** (`dreamos-pwa app/demo/vendor/[handle]/page.tsx`) renders
**exactly one number**:

| Claim | Site | Witness |
|---|---|---|
| `"N couples are waiting"` | `:400` | `waiting = leads?.length ?? 0` at `:256`, from `res.leads` at `:203` — a real `demo_leads` row count |

Every other rendered value on the tease is a **row field, not a computed claim**:
`bride_name`, `wedding_when`, `wedding_city` (`:408-410`), `budget_max` through
`formatRs` (`:427`). `bride_phone` is excluded from the server's `MASKED_SELECT`
and is genuinely absent from the payload. **No impressions sibling survives** —
the file states it in its own words at `:393` ("no impressions line: nothing
tracks impressions on this…"), consistent with the founder's strike recorded in
masterplan row 08. Grepped for `impression` across `src/` and the spec: the only
hits are that comment, the struck spec line `:60`/`:79`, and four unrelated
prose uses in agent soul files.

**The Closer's demo context** (`src/agent/closerEngine.js`) carries **exactly two
numbers**, both conditioned and both traced:

| Claim | Site | Witness |
|---|---|---|
| `"Days left before it rotates out…: N"` | `:271` | computed from `invited_at \|\| created_at` + `readSunsetDays()`; emitted **only** when `inSweepPopulation` — the row genuinely matches the sweep's predicate |
| `"Enquiries waiting on that page for them: N"` | `:288` | `demo_leads` `count: 'exact'` on `demo_vendor_id`; **zero collapses**, never rendered |

No invented count and no invented figure found on either surface. **One honesty
finding raised against the first of these — F-08.94 above.**

---

## 5 · FLOOR — PAIRED, AT THE CURED TREE

| Bench | Count |
|---|---|
| `b08_p6_purge_bench` | **54 / 0 / 0** — NEW |
| `b08_p1_lifecycle_bench` | **106 / 0 / 0** — two labeled amendments, see below |
| `b08_console_bench` | 71 / 0 / 0 |
| `b08_p3_seeing_surface_bench` | 61 / 0 / 0 |
| `b08_p4_factory_bench` | 83 / 0 / 0 |
| `b08_p5_closer_bench` | 244 / 0 |
| `b08_p5_eliza_bench` | 29 / 0 |
| `b08_p5_invite_bench` | 35 / 0 / 0 |
| `b08_p5_prospect_intake_bench` | 13 / 0 |
| `dreamos-pwa` | `tsc --noEmit` exit 0 |
| `dream-os` engine | `npm run typecheck:engine` exit 0 |

**NOT RUN, NAMED (floor-method law):** `b08_p5_closer_scenarios` is a **live
scenario runner, not a bench** — it needs live model credentials and returns
`LANE ERROR: Could not resolve authentication method` in this container. Its
transcripts gate a deploy on the founder's reading, not on a bench count. Any
transcript files it wrote during the floor were deleted before packaging.

**THE 105/1-SKIP → 106/0-SKIP MOVE, EXPLAINED NOT ABSORBED.** `b08_p1`'s cell
*"the PWA calls the MOUNTED path"* skips when `dreamos-pwa` is not a sibling
directory (`:1186-1192`, its own floor-method skip). R-B10 had me clone the
sibling; the cell then **ran and passed**. The count did not move from my delta
— the floor simply became genuinely PAIRED. Verified by re-running at the
stashed pristine tree, which also reports 106/0/0 with the sibling present.

### The two labeled amendments to `b08_p1_lifecycle_bench` — RATIFY-OR-REVERT

**② `NO P1 PATH ISSUES A DELETE AGAINST demo_vendors` — RE-AIMED, NOT RELAXED.**
The cell banned a supabase delete in five files. P6 *is* that delete, ruled and
sited inside `demoLifecycle` by R-B5. The four other files stay under the
**unconditional** ban. Inside `demoLifecycle` the ban narrows to what CE-134 §3
actually protects: everything outside `_purgeRow` must still be delete-free, so a
delete appearing in `onRemoved`, `restore`, `deactivate` or any sweep still fails.
A cell was **added** asserting the purge door does delete, so the amendment
cannot hollow the feature either.

**③ `exactly FIVE cron jobs survive` → SIX.** The number is this cell's only
power and it correctly caught the new job. Moved **by label with R-B8 named**,
never loosened to `>= 5`, and a third assertion added for `runPurgeSweep`.

If the CE prefers `b08_p1` frozen, both revert; the substance lives on either way
at `b08_p6_purge_bench` §7.

---

## 6 · ACCEPTANCE — BOTH-WAYS, NINE MUTATIONS AT PRODUCTION SOURCE

Every mutation edits the **shipped file**, asserts the named cell goes RED,
restores, and asserts byte-identity. Test setup is never what breaks.

| # | Mutation | Cell it reddens |
|---|---|---|
| M-1 | drop the takedown leg's `state='removed'` | a **restored** row purges |
| M-2 | drop the sunset leg's `discover_eligible=false` | a **feed-live** row purges |
| M-3 | drop the `claimed_at IS NULL` guard | a **claimed** vendor's demo purges |
| M-4 | let an unconfirmed asset through | block-and-retry dies |
| M-5 | skip the Cloudinary destroy | assets never destroyed |
| M-6 | turn the kill switch into a horizon | `0` purges everything at a 0-day window |
| M-7 | drop the prospect unlink | dangling `demo_vendor_ref` |
| M-8 | accept any `result` as gone | `"error"` counts as destroyed |
| M-9 | drop the HTTP status check | a 401 counts as destroyed |

The kickoff's two named acceptance mutations are M-5 (skips the destroy) and
M-1/M-2 (purge inside the resurrect window). **The sunset/takedown distinction is
a named cell** — §2's exclusivity pair, plus `by_leg` counters asserted.

**The live witness is the founder's** and is NOT claimed here: a real Cloudinary
destroy is a network fact this container cannot witness (`igImport.js`'s U-5
posture). The walk card carries it, clock forcing disclosed.

---

## 7 · WHAT IS NOT DONE

- **The PWA performance re-measure** (landing LCP against the spec's <2.5s on
  mid-range Android 4G; iOS Safari, Chrome, IG in-app). Device-bound and
  founder-run. `tsc` is clean and **zero PWA bytes moved this sitting**, so no
  regression is introduced — but the measurement itself is not claimed.
- **The first live purge** — destructive-DB law, founder-witnessed, walk card.
- **F-08.93's arm** re-opens when P2 states its claim copy semantics.
- **F-08.94's cure** — copy + soul-adjacent, own sitting, founder veto.
- **F-08.91's remaining arm** — four admin callers + `portfolio.js` sibling.

---

## 8 · THE REPRIEVE MECHANISMS (AD-B1, named as instructed)

The never-invited Discover fixtures now sit on a destruction path. Nothing extra
was built for them; the founder rules them row-by-row through doors that exist:

1. **Per row** — an admin re-grant through `setDiscoverEligible(…, true)` sets
   `discover_eligible = true`, which **fails the sunset leg** and lifts that row
   out of the purge before its window closes.
2. **Per row, takedown side** — `restore()` / START moves `state` off `removed`,
   which fails the takedown leg.
3. **Whole feature** — `admin_config.demo.purge_resurrect_days = 0` is the kill
   switch, effective the next nightly run, no deploy.

Per AD-B6 the immediate sunset horizon is **empty** (`0/0` on the founder's
census): this build lands with **zero rows in jeopardy**. The masterplan's
"first natural fire 2026-08-26" stands un-re-derived.

---

## 10 · RESIDUAL CLOSED — THE LEG WITNESS, MADE LEGIBLE

*Added 2026-08-05 on the founder's sequencing word 「 residuals 」, after the rider
sealed at `4b81eb6`. No new finding minted: this is the executor's own disclosed
gap from §5 of this document, closed at the same seam that carried it.*

**THE GAP, RESTATED.** R-B6 required the walk to witness a destroy through each
leg — stored `cloudinary_id` and URL-parse. The live walk destroyed six assets
and **the ledger could not say which leg resolved any of them**, so the question
was unanswerable from the output rather than answered wrongly. `_photoAssets`
had computed `resolved_by` since the P6 build; nothing ever read it.

**THE CURE.** Both ledgers now carry the leg, and the sweep rolls it up:

- `detail.purged[].assets_by_leg` — per row, e.g. `{ stored_id: 5, url_parse: 1 }`
- `assets_by_leg` — per sweep, the same shape summed
- `detail.blocked[].failures[].resolved_by` — per failure; `null` when neither
  leg could name the asset, which is a stated absence rather than a guess
- `detail.blocked[].confirmed_by_leg` — what a blocked row DID destroy before it
  blocked, so the retry is legible rather than a mystery
- the `PURGED` log line names the legs inline

**RECONCILIATION IS ASSERTED, not assumed:** a cell requires the per-leg tally to
sum to the headline `assets_destroyed`. An unreconciled tally is decoration.

**FLOOR:** `b08_p6_purge_bench` **54 → 60**; every other bench byte-stable.
**M-10** added — a tally hard-coded to `stored_id` reddens the URL-parse cells,
so the leg is proven read from the resolver rather than printed as a constant.

**WHAT THIS DOES NOT DO.** It does not itself witness the parse leg on
production. It makes the next real purge *say* which legs fired. R-B6's live
both-legs witness stays **open** until a purge runs over a row carrying at least
one of the five id-less photos in the founder's census — the walk card's SELECT
finds them.
