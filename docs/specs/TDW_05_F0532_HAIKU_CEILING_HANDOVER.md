# TDW_05 — F-05.32: SONNET OFF THE AGENT LANE (executor handover)

**Base:** `4595c06` (dream-os) · re-derived at origin fetch-first, `git status` clean at first motion
**Sitting:** micro, one arc · role EXECUTOR (Opus) · step ③ of the founder-ruled sequence
**Repo:** dream-os ONLY — `dreamos-pwa` 0-line · **SQL: ZERO** · ONE `deploy/` ZIP
**Rulings executed:** CE-66 (fork 1 → (c) · fork 2 → (b), fence amended by the chair · card grown to three steps)

---

## 1. WHAT SHIPPED — 4 substantive lines, 3 files

| File | Line | Change |
|---|---|---|
| `src/agent/brideEngine.js` | 172 | `const modelToUse = MODEL_HAIKU;` + the scoped comment |
| `src/agent/engine.js` | 159 | `const modelToUse  = MODEL_HAIKU;` + the scoped comment |
| `src/agent/engine.js` | 488 | `const modelToUse  = MODEL_HAIKU;` + the scoped comment |
| `src/agent/classifier.js` | 85 | log arrow retired: `complex → Sonnet` → `complex` |

The comment, identical at all three sites, per fork 1's ruled wording:

```
// F-05.32 + E-3: the agent lane's ceiling is Haiku; the classifier's verdict no longer escalates.
```

`git diff --stat` vs base: **3 files, 7 insertions, 4 deletions.** New file: `scripts/b05_f0532_haiku_ceiling_bench.js`.

## 2. DIFF-HEADER DISCLOSURES (stated, not swept)

1. **`MODEL_SONNET` is now an unused import in BOTH `brideEngine.js:37` and `engine.js:14`.** Left in place per the kickoff's explicit fence — no import sweep. `models.js` keeps exporting it; its `PRICING` row serves historic cost rows.
2. **`COMPLEXITY` is ALSO now unused in both files** — the kickoff anticipated only the `MODEL_SONNET` case. Same treatment, same reason, named here because an unstated second one is how sweeps get justified later. `COMPLEXITY` remains live inside `classifier.js`, which is untouched in substance.
3. **`complexity` (the local) stays used at all three sites** — it still prints in the `model selected:` log line, which is the founder's own smoke evidence. Nothing went dead.
4. **`loop.ts:536`'s stale `// clean re-run on Sonnet` comment is NOT fixed here** — CE-66 banked it by name to the next lawful engine-touching ZIP rather than widen a three-line agent micro into an engine delivery with D-10's build step.
5. **The clerk is untouched.** `distill.ts:112`'s live Sonnet pass is **F-06.16**, homed to Block 06's ledger where E-3 lives.

## 3. PROOF

**New bench — `scripts/b05_f0532_haiku_ceiling_bench.js`, 11/11 GREEN.** Behavioural, not a grep: it drives the three **real production functions** with the **real classifier returning a real COMPLEX verdict** (only the network boundary is stubbed) and asserts the model that actually reached the API call.

- **§1.1–1.3** — bride / vendor / couple wires: complex verdict in, Haiku on the wire, asserted off the same production log line the founder greps (`model selected: claude-haiku-… (complex)`).
- **§1.4 — the vacuity guard bites.** A green earned on a *simple* verdict is **refused**, because pre-cure code selected Haiku there too. The cell proves the guard rejects it.
- **§2.1 ×3 / §2.2 / §2.3 — NON-VACUOUS BY PRODUCTION MUTATION.** The bench writes the ternary back into the real source on disk: one site restored REDs **exactly its own cell** and leaves its two siblings green; all three restored RED all three. Fixtures are never touched to manufacture a red.
- **§2.4** — the classifier survives whole (both entry points still return complex, still log); the retired arrow asserted absent.
- **§2.5** — the tree is byte-identical to where the bench found it; `restoreAll()` runs in a `finally` so a crash mid-mutation cannot leave the founder's tree dirty.

**Both-ways floor, run on a scratch clone at uncured `4595c06`: 2 passed / 9 failed** — the three §1 cells failing on exactly the disease (`the API call carried claude-sonnet-4-6, not Haiku`), §2.4 on the arrow, §2's mutation cells refusing to set up against an absent cured anchor.

**`node --check` clean** on all four touched/added files.

**THE FOURTEEN-BENCH FLOOR — ALL BYTE-STABLE at the charter's counts** (`npm run build` run first for the b0498 pair):

```
crons 48 · sendwa 55 · webhookcore 11 · otp_meta 24 · b0498 58 · punct 17
movementb 47 · transport 10 · m1b 4 · m2 2 · prospect 47 · checker 101
onboarding 27 · couple_soul 21
```

**W-1 clean:** `miraSoul.js`, `brideSystemPrompt.js`, `systemPrompt.js`, `llm.js`, every prompt byte — 0-line. `classifier.js:48`'s "Only route to Sonnet…" is a **prompt byte and STAYS** (W-1); only the `console.log` at `:85` moved.

## 4. THE FOUNDER SMOKE CARD — three steps, one message each

Grown per CE-66: bench-only coverage for two of three sites was refused.

**THE VACUITY RULE GOVERNS ALL THREE STEPS:** if `[classifier] complex` does **not** appear in the Railway log for a step, that step **witnesses nothing** — Haiku was selected pre-cure too. Re-send a sharper money form; do not read it as green.

**S1 — the bride wire (`brideEngine.js:172`, the convicted lane).**
From **+919625759924** to the **bride line**, send:
> `Priya Decor quoted 2.5 lakhs for the reception backdrop — note it down.`

Look for, prefix included: **`[bride-agent] model selected: claude-haiku-4-5-20251001`**
(the bare `model selected:` also matches the other two lanes — grep the prefix.)

**S2 — the vendor wire (`engine.js:159`).**
From the vendor test handset **+918757788550** to the **vendor line +917982159047**, send:
> `Meera's bridal party wants 3 lakhs of mehendi work for December — hold the dates.`

Look for: **`[agent] model selected: claude-haiku-4-5-20251001`**

**S3 — the couple wire (`engine.js:488`).**
From **+919625759924** to the **vendor line** (the couple-role sender rides `runCoupleAgenticTurn` per the CE-54 boundary), send:
> `What would a December wedding package cost, roughly?`

Look for: **`[couple-agent] model selected: claude-haiku-4-5-20251001`**

Then: the replies land normally, figures exact. Three messages, done.

## 5. OPEN / HANDED FORWARD

- **F-06.16** — the clerk's Sonnet exemption is inherited, not ruled. `distill.ts:112` (streamed), `:124` (priced), live via `server.ts:157` `/de-doc` and `:180` `/de-redistill`. Homed to **Block 06's ledger**; the chair's provisional lean, stated not ruled, is that it ratifies explicitly with E-3's sentence gaining a named carve-out.
- **`loop.ts:536`** — stale `// clean re-run on Sonnet` against `:532`'s `model = MODELS.haiku`. Banked by name to the next lawful engine-touching ZIP.
- **The live witness is the founder's, declared-not-claimed.** Nothing in this packet ran against production.
- **CE-66 accrues to this micro's seal.** Sequencing beyond this sitting is the founder's.

## 6. THE LESSON THIS MICRO PAID FOR AGAIN

E-3's committed sentence read *"ZERO Sonnet reachable"*. It was true of the tier ladder its bench measured and false three files away, for two chairs. This bench therefore **states its own scope in its header and in its green banner** — *the agent lane only* — so the next chair inherits a measured claim instead of a slogan. A bench that overstates its reach is the disease wearing the cure's uniform.
