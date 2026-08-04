# `scripts/out/` — Maya's transcripts, and which tree each set came from

These files are **evidence**, read by the founder and by the CE chair. A
transcript is only evidence about the tree it was run against, and this
directory holds sets from several. **Read the label format before reading the
words.**

## THE DISCRIMINATOR IS MECHANICAL

Every nudge send prints a label. The label's shape tells you which side of the
F-08.68 cure the run belongs to — you never have to trust a filename or a
timestamp:

| Label shape | Tree | What it means |
|---|---|---|
| `MAYA [nudge, N standing]` | **PRE-CURE** | The harness printed its **own loop counter**. The engine derived something else. **The exit wake was never reached in any of these runs, and every one of them claims it was.** |
| `MAYA [nudge, N standing, M quoted]` | **POST-CURE** | The number is the one `runCloserTurn` **returned**. `M quoted` is the count of her unanswered sends actually placed in the context. |

`grep -c 'quoted\]' <file>` answers it in one command. Zero means pre-cure.

## THE THREE FILES THAT NEED SAYING OUT LOUD

```
closer_scenarios_2026-08-04T08-47-38-105Z.txt
closer_scenarios_2026-08-04T08-48-00-821Z.txt
closer_scenarios_2026-08-04T08-48-29-262Z.txt
```

**These are PRE-CURE runs** — `--scenario=two_nudge_silence` against the uncured
tree at `1298a8d` — but they were swept into the **cure's own commit**
(`710b4e5`) by a `git add -A`, so they sit as the *newest* files in a commit
whose subject announces the cure. They are its **baseline**, not its result.
Zero `quoted]` labels; header reads `scenarios: 1`.

They are worth keeping and worth reading: they carry F-08.69's specimens — the
model breaking character mid-nudge, naming Anthropic and describing its own
prompt, `flags=none`, `source=maya`. That is the disease F-08.66 cured, at its
sharpest.

## THE SETS, IN ORDER

| Set | Tree | Note |
|---|---|---|
| `…T07-*` | pre-F-08.65 | The harness was a **second implementation** of the turn. Not what a prospect receives. Historical only. |
| `…T08-22 / 08-23 / 08-23` | `886d0f7` | The nudge scenario **400s on both lanes** and the whole DeepSeek lane **404s**. No count in this set is derivable. |
| `…T08-28 / 08-29 / 08-30` | `1298a8d` | The three-rep set the counts of the F-08.66 diagnosis were read from. |
| `…T08-47 / 08-48 / 08-48` | `1298a8d` | **Pre-cure, swept into `710b4e5`.** See above. |
| `…T09-28` | `710b4e5` | First **post-cure** run. ×1, both lanes. Exit wake reached for the first time in the arc — and failed on both lanes. |

## ONE STANDING RULE

A run's own header states `soul=`, `manual=` and `soul_chars=`, and every turn
states `called=`, `signed=`, `normalized=`, `exit_gated=` and `flags=`. **If a
number in a transcript is not one the engine produced, that is a finding**
(F-08.65, then F-08.68, then F-08.72 — three times in one arc). Add a row above
when a new set lands.
