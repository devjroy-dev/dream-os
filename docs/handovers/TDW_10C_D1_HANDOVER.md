# TDW_10.C · DELIVERY 1 — THE LEDGER AND THE METER, DARK

**Repo:** `dream-os` · **base:** re-derived at delivery (see the apply block's line 1)
**Role:** LE. The executor never pushes; this ZIP is the founder's to apply.
**Refuses nothing.** Delivery 2 is the dials' reader; delivery 3 is the gate.

---

## ⚠ READ FIRST — THE LABELLED AMENDMENT

`0120` adds a column the chair did not rule: **`cost_basis text NOT NULL`**
(`metered | estimated | unpriced`). It ships **labelled-amended, ratify-or-revert**,
on the founder's explicit grant (2026-08-12).

**Why it exists.** R-30.27 ruled `cost_inr NOT NULL` as the one universal cell.
Authoring the writer proved that cannot be honestly satisfied everywhere:

| provider | tokens | price | honest basis |
|---|---|---|---|
| Anthropic (8 sites) | real | real | `metered` |
| Gemini (`groundedSearch`) | real | **borrowed** — `calcCostInr` has no Gemini entry and falls back to Haiku rates by its own documented law | `estimated` |
| Google Vision (`images:annotate`) | **none** — per-image billing | **none exists in this estate** | `unpriced`, `cost_inr = 0` |

Writing `0` for Vision without a marker is F-10.85's disease one abstraction up:
the reader cannot tell *free* from *we do not know*. The column is F4's own
ratified reasoning applied one column over — a semantic NULL needs a comment at
every reader; a named column needs none.

**The asymmetry, stated so the chair rules with the price in view:** a code
revert is free; dropping this column after the table exists is a destructive DB
action under protocol §4 (founder sign-off + export first). Both revert
directions ship **commented and withheld** at the foot of `0120`.

---

## WHAT SHIPPED

| file | delta | what |
|---|---|---|
| `db/migrations/0120_couple_ai_ledger.sql` | new | `public.couple_ai_usage` + 3 indexes + the two `basic` dial rows |
| `src/lib/coupleAiCap.js` | new | **the sole writer.** Turn-id mint, the client wrapper, the two explicit recorders |
| `src/agent/brideEngine.js` | 63 | onboarding/fan-out re-scopes · **F-10.114's `.limit()`** · the Gemini row |
| `src/brideIndex.js` | 53 | the circle door's mint + wrap · the circle image door · `handleSurpriseMe` threaded |
| `src/lib/brideInbound.js` | 43 | the WhatsApp bride door's mint + wrap; four downstream re-scopes |
| `src/api/couple/chat.js` | 22 | the two in-app doors (SSE + JSON fallback) |
| `src/api/couple/muse.js` | 19 | the doorless image path (`turn_id` NULL by meaning) |
| `src/lib/imagePipeline.js` | 19 | the Vision row |
| `tools/bench/tdw10c_couple_meter_bench.js` | new | 18 cells, mutation-proven |

`src/agent/circleEngine.js` and `src/lib/museSave.js` are **byte-untouched** and
deliberately absent from the ZIP — both are metered by the wrapper the door hands
them, which is the whole point of wrapping the client rather than editing sites.

---

## THE DESIGN DECISION WORTH ARGUING WITH

**The meter wraps the client at the door; it does not edit ten call sites.**

The estate has paid for this lesson twice. `brideEngine.js:312-318`, on the money
guard: *"Seating the guard INSIDE the function covers both by construction;
seating it at the bride call site would have left the circle door open."* And this
sitting's own opening census found a charter naming **three** spend sites against
a tree holding **ten**.

So each door wraps the Anthropic client once with
`{couple_id, circle_member_id, turn_id, kind}`, and every `messages.create`
beneath it is metered — **including calls a future sitting adds without ever
reading `coupleAiCap.js`**. `withKind` re-scopes sub-trees (onboarding, fan-out,
tagging) without stacking proxies.

The two non-Anthropic sites cannot be covered that way and are recorded
explicitly: Gemini (a REST SDK) and Vision (a raw `fetch`).

---

## THE UNIT — why `turn_id` exists (G1, R-30.37)

The vendor dial counts `engine.usage` rows and that equals counting **turns**
only because `loop.ts:922-931` writes one pre-aggregated row per turn. This lane
has no aggregation: one bride message is up to **five** calls
(`brideEngine.js:43`), one circle message up to **three** (`circleEngine.js:35`),
one image **two**, plus N fan-out calls. Counting rows would price the founder's
20 messages/day at as few as **4 real messages**.

- **SPEND** = `SUM(cost_inr)` over all rows, always.
- **TURNS** = `COUNT(DISTINCT turn_id) WHERE kind = 'turn'`.

`kind` is CHECK-constrained to five values. R-30.37's chosen consequences, in
force: onboarding does **not** consume the cap; tagging and search do **not**
consume the cap but are fully priced; `turn_id` is NULL **by meaning** for
system-born rows (in-app Muse uploads are not messages).

---

## PROOF

`node tools/bench/tdw10c_couple_meter_bench.js` → **18/18 green.**

Both-ways proven by mutating **production code**, not test setup:

| mutation | effect |
|---|---|
| stack the proxy (delete `__unwrap` in `meteredAnthropic`) | 18 → **16** |
| delete the `couple_id` guard in `writeRow` | 18 → **17** |
| label the Vision row `metered` | 18 → **17** |
| delete `.limit(FANOUT_MAX_SESSIONS)` | 18 → **17** |
| collapse every `kind` to `turn` | 18 → **16** |

### TWO SELF-CAUGHT BENCH DEFECTS, disclosed at discovery

The first mutation sweep showed **two cells that could not be reddened.** Both
were bench defects; both are fixed and re-proven above.

1. **The stacking guard was double-homed.** `meteredAnthropic` normalised via
   `__unwrap` *and* `withKind` pre-unwrapped, so neither site alone was
   load-bearing and cell 3.1 was green with either deleted. **A guard nothing can
   redden is not a guard.** `withKind` now passes the wrapped client; one home.
2. **Cell 5.2 was witnessing the fake, not the cure.** The fake supabase rejects
   a null `couple_id` exactly as Postgres would, so `rows.length === 0` stayed
   green with the module's guard deleted. The cell now asserts the ledger was
   **never reached** (`sb.tables`), which is a claim about the module.

`node --check` clean on every shipped `.js`.

---

## FOUNDER STEPS

### ① THE SQL — Supabase editor, before the ZIP

Run `db/migrations/0120_couple_ai_ledger.sql` whole. Its verify block runs
read-only after `COMMIT` and asserts **shapes, not existence**: 14 columns, 3
indexes, the constraint definitions, 2 dial rows, and **0 ledger rows** (nothing
has run yet — the writers ship in the ZIP, after this).

**Paste the verify rows back.** The walk card is authored from them, per the
fixture-state law — never the other order.

### ② THE ZIP — after ① is green

Apply block ships in the delivery message. Head-guard first, one verify line
ending the D-10 STOP sentence, git line as its own paste-block.

### ③ THE WALK — after the push deploys

**The fan-out has no live fixture:** your own SELECT returned **zero** pending
circle sessions, so `kind='fanout'` rows cannot appear on their own. R-30.28
rules it manufactured, and the card carries a declared ten-minute clock step
(circle test member acts → `SESSION_IDLE_MS` passes → bride messages).

The card itself ships **after** your ① rows land, not before.

---

## OPEN, CARRIED FORWARD

- **`cost_basis`** — chair's ratify-or-revert.
- **A Vision rate** — the day one exists, `cost_basis='unpriced'` rows backfill
  to real money with one `UPDATE`. Nothing else changes.
- **A Gemini rate** — supply it to the one cost home
  (`src/engine/src/core/models.ts`) and `estimated` rows become `metered`
  without touching this delivery's files.
- **F-10.116** — the admin tier door still confirms a change it never makes.
  OPEN, cure parked beside Platinum (R-30.35). **Recommended park-whole rather
  than riding delivery 1 free:** its only consumer lives in `dreamos-pwa`, a repo
  outside this sitting's radius, so the blast radius of a 200 → refusal flip
  cannot be derived from here.
- **The couple count** — the ruling says 21 real couples; the founder's own
  SELECT returned **23 rows, all `basic`**. If two are test accounts that
  explains it, but the six-month evidence base should not inherit an unwitnessed
  number.
- **The dead dials** — `couple_pwa_*` / `couple_wa_*` retire **by name** in
  delivery 2, never by prefix sweep: `key LIKE 'couple%'` also catches
  `couple.eliza_enabled`, a live lane-enable flag that is not a cap.
