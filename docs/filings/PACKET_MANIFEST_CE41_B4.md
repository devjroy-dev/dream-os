# CE-41 · SEAT B · PACKET MANIFEST — B4 AND THE CENSUS

**Base:** dream-os `534059f87527f6b0a3fd8c05167eed3042a2da16` (seat A's A6), fetch-first,
full hash derived by command from the chair's abbreviation.
**Cut:** 2026-09-08 · CE-41 LE-B · docs-only · nothing under `src/`, nothing in the pwa.

This packet accumulated across the freeze. One commit, eight files.

| # | File | What it is | New or amended |
|---|---|---|---|
| 1 | `docs/TEMPLATES.md` | **§8 replaced** by the 39-name census — the WABA (38, seat C's door, `read_at` 10:25Z) joined to the registry (29, this commit). Carries R-41.56's three clean results, the one-row disagreement and why it is correct, and **c-41.15's circular-measurement note**. | amended |
| 2 | `docs/filings/B4_DATED_FOUNDER_ITEMS.md` | B4·1. **RBI e-mandate re-ranked to the head of the table** — the only item that stops something already running. Gains the **verify-and-publish-in-one-sitting** row (Google's 7-day validity) and F-41.32's credit-line line. | amended |
| 3 | `docs/filings/META_TECH_PROVIDER_TERMS_READ.md` | B4·2 Part 1 — Meta Terms for WhatsApp Business and the Service Provider terms, read whole. The `Start onboarding` boundary (R-41.57). | new |
| 4 | `docs/filings/META_TECH_PROVIDER_TERMS_READ_PART2.md` | B4·2 Part 2 — Tech Provider Terms (2026-07-31), Cloud API Terms + Exhibits, and the **2026-09-23 replacement, diffed today**. §4.7 AI Providers. **Hosting Terms recorded as merged at Meta's own 301.** Carries this seat's correction of Part 1 §3.5. | new |
| 5 | `docs/filings/MODEL_PROVIDERS_VS_META_4_7.md` | B4·4 — Anthropic and DeepSeek derived at their own pages; **the chair's Z.ai/GLM read folded in as §2b (F-41.34)**. Conflict of interest declared at the head. | new |
| 6 | `docs/filings/B4_5_PER_LANE_MODEL_TABLE.md` | B4·5 — the per-lane table, file:line, provider, carries-Platform-Data. The gating artefact for R-41.66's bell. | new |
| 7 | `docs/filings/GOOGLE_PUBLISH_AND_SCOPE_REVIEW.md` | B3·2 on Branch A (already pushed at `2a0d838`; unchanged here, listed for completeness) | — |
| 8 | `docs/filings/PACKET_MANIFEST_CE41_B4.md` | this file | new |

---

## What is asserted, and how it was derived

Every factual claim in this packet is derived by command at `534059f` with `git show origin/main:`
or `git grep`, or quoted from a document read at source with its date. **No claim rests on the
checked-out tree** — this seat's working copy sat at `68d92c0` while origin had moved, caught by
command before any derivation, and recorded in B4·5 §0.

**Wallet law (R-41.48):** zero rupee glyphs across all files in this packet, verified by command.
Money is written `Rs 0.12`, `Rs 0.86`, `Rs 1,50,000`.

**§1 of `TEMPLATES.md` is untouched.** c-41.4 remains the chair's.

---

## Corrections this seat carries in its own files

| Correction | Where |
|---|---|
| **c-41.14** — a convenience glob widened a packet past its charter; three files reverted mid-cut | recorded in Record Note 05 |
| **c-41.15** — a census tested against itself; six became nineteen once the test excluded the seat's own table | `TEMPLATES.md` §8 |
| **Part 1 §3.5 read price transparency backwards** — Tech Provider §5 prohibits resale; the disclosure is a condition of an authorisation TDW does not hold | Part 2 §2 |
| **The CASA alarm was over-stated** — CASA binds restricted scopes; the restricted list was never read; superseded text left standing beneath the correction | `GOOGLE_API_DOMAIN_AND_SEARCH_CONSOLE.md` §0a |

---

## What is owed after this push

**Before 2026-09-09 ~18:50 IST (R-41.66's bell):**
1. `runNudgeJob`'s prompt construction — **the `donna_provider` engine-tool row**, the one cell
   in B4·5 that could put a WhatsApp lane on DeepSeek.
2. Railway: `LLM_PROVIDER` and `BRIDE_LLM_PROVIDER` — `wa_vendor` has **no route entry** and is
   deliberately unconstrained (`modelRouter.js:92`).
3. The `model.*` seed rows — `modelRouter.js:39` warns the seed wins over the code default.

**Then:** F-41.33, the seven incorporated documents, **Business Agents Terms first** — accepting
the Tech Provider Terms binds TDW to them, and nobody has opened one.

**Standing:** a bench assertion that `runHarvest` keeps **exactly one call site**. B4·5's finding
that no Platform Data reaches GLM holds only while that is true, and a second call site from a
WhatsApp path would move the lane inside §4.7(b) silently.

**Still open from earlier packets:** F-41.9 (pricing re-check, 09-25) · F-41.20 (the six orphan
templates, founder's to keep or delete) · A4's three bytes, which remain the last thing between
the estate and a durable Google refresh token.
