# TDW · F-07.83 — THE DOCS REDACTION (docs-only)

Base: `dream-os f5dc163076cbb09457cce642fae9ee286d785dde`. Docs-only; zero code bytes.

## 1 · WHAT MOVED — EIGHT sites, not three

The read-first's original count was THREE. It was wrong, and the miss is named:
that scan searched for ONE retired value. The file at `HANDOVER_FINAL.md:103`
records a rotation and therefore names TWO passwords — the then-new and its
predecessor. Re-derived by command, both values pulled from history and never
authored: **eight sites across three files.**

| file:line | which value | new form |
|---|---|---|
| `docs/HANDOVER_FINAL.md:103` | both | rotation note kept, both literals redacted |
| `docs/HANDOVER_FINAL.md:126` | retired | pointer to Railway |
| `docs/HANDOVER_FINAL.md:332` | predecessor | pointer to Railway |
| `docs/DEVS_HOLY_GRAIL.md:46` | retired | pointer to Railway |
| `docs/FINDINGS_LOG.md:30` | predecessor | `(REDACTED 2026-08-01, F-07.83)` |
| `docs/FINDINGS_LOG.md:32` | predecessor | `'<REDACTED — F-07.83>'` |
| `docs/FINDINGS_LOG.md:33` | predecessor | `'<REDACTED — F-07.83>'` |
| `docs/FINDINGS_LOG.md:317` | predecessor | `(REDACTED 2026-08-01, F-07.83)` |

**Every edit was a mechanical substitution keyed on a value derived from git
history.** No replacement line was authored containing either password, and
neither value appears in this handover.

**FINDINGS_LOG entries are historical record and were NOT rewritten.** Each
finding's meaning, severity and decision stand byte-for-byte; only the credential
inside the prose is redacted, with the redaction dated and attributed in place.

**Whole-tree sweep after the cure: CLEAN** — neither retired value survives at any
path in the repository at this tip.

## 2 · WHAT THIS IS AND IS NOT

Rotation was the remediation and it already happened. `git log` retains both values
at `f5dc163` and earlier **permanently**; no edit to `HEAD` changes that. This
delivery is HYGIENE: what a casual reader finds browsing the repo today. Stated
plainly so no future reader mistakes it for a security fix.

## 3 · THE ANCESTOR — reported, not absorbed

`docs/FINDINGS_LOG.md` **Finding #1 (P2-2, decided 2026-05-18)** and **Finding #12**
already name this exact disease: the admin password hardcoded across 25 files of the
public `dreamos-pwa` repo. Finding #1's recorded decision reads *"Option A —
acknowledge, rotate Railway secret, defer"*.

**The cleanup was deferred and never ran. The password was then rotated again, and
the new value was committed back into the same files.** F-07.85 is therefore a
RE-MINT of Finding #1/#12, and its true age is fourteen months, not one evening.
The chair may wish to say so in CE-121: a deferral with no re-entry date became a
repetition of the finding it deferred.

## 4 · THE TRIPWIRE IS OWED, NOT SHIPPED

The ruling said docs ZIP; this ZIP is docs-only and carries **no bench**. A cure
nobody can re-run quietly stops being a cure (Q-SP-5), so the gap is DECLARED rather
than silently widened: a repo-wide credential-shaped tripwire belongs in the
F-07.84/.85 fold micro's bench, where it can cover both repos at once — which is the
scope this defect actually has. Named here so it cannot be forgotten.

## 5 · VERIFICATION

Docs-only: no `node --check`, no bench, no floor movement possible. The verify line
asserts the delta is confined to `docs/` and that the tree parses as before.
The founder walks nothing; there is nothing to witness on a screen.
