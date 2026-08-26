# M-TELEMETRY — EXECUTOR HANDOVER

**Seat:** LE · **Repo:** `dream-os` ONLY · **Base:** `c1d35cb`, fetch-first at read-first and re-derived fetch-first at delivery · **Rulings executed:** R-37.46 · R-37.47 · R-37.48 · R-37.49 · R-37.50 · R-37.51 · R-37.52 · **Minted at the chair this sitting:** F-05.91 · F-05.92

**Relay guard:** clean. `c1d35cb` was the tip exactly; no build for this scope existed beyond it.

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `src/lib/waSendLog.js` | **NEW** | `logWaSend(lane, …)` — the one home. Lane-parameterised from birth per R-37.49. |
| `src/lib/vendor/relayToCouple.js` | modified | `sendwa_freeform` joins `SENDER_CONTRACTS`; the fossil's note **corrected** per R-37.52 rider (i). |
| `src/api/couple/enquire.js` | modified | Sites 4 and 5 wired, both branches. |
| `src/cron.js` | modified | Sites 1 and 2 wired, both branches. |
| `src/api/admin/mint.js` | modified | Site 3 wired, both branches. |
| `src/lib/vendor/enquiryAlert.js` | modified | Site 6 absorbed per R-37.50; refusal branch wired; R-37.52 rider (ii)'s named cost recorded in place. |
| `scripts/b39_telemetry_bench.js` | **NEW** | **22 cells.** Executes the logger and two real doors. |
| `scripts/b06_relay_hand_bench.js` | modified | Sealed cell §13.1 amended — see §5. |
| `scripts/floor-manifest-m-telemetry.txt` | **NEW** | Declared dirt — ten paths. |
| `docs/TDW_M_TELEMETRY_HANDOVER.md` | **NEW** | This file. |

**No migration, no DDL, no table touched.** `0130` remains next-free. **COPY INVENTORY: ZERO** — log lines are operator-facing. **VETO SLOT: EMPTY.**

**W-1 clean, proven by command:** `harveySoul.js`, `donnaSoul.ts`, `loop.ts`, `eventWrite.js`, `templates.js`, `leadSerializer.js`, `sendWa.js` — zero diff. **`sendWa.js` is untouched by ruling** (R-37.51).

**SIX SITES, TWELVE CALLS — both branches at every one.** `cron:morning`, `cron:morning:oow`, `mint:welcome`, `enquire:inwindow`, `enquire:oow`, `enquiry:oow`.

---

## 2 · WHAT THIS COSTS TODAY, AND WHAT IT BUYS

On 26 Aug the founder noticed enquiry alerts had stopped. Three sends fired; Meta accepted all three and rejected all three in the same second; and the estate could not name the template, the recipient, or the wamid. **Five of six vendor-lane send sites logged nothing.** Diagnosing it took an evening and **never produced the error code** — F-16.35 remains a hypothesis under observation precisely because the reason was discarded.

After this ZIP the same failure is one line:

```
[wa:vendor] REFUSED site=enquire:oow mode=template key=lead_alert_basic to=…4440 err=template_not_approved ctx=<vendor>
```

`grep '[wa:vendor]'` for the lane; `grep 'err='` for every refusal; `grep 'key=lead_alert_basic'` for F-16.35's specific watch.

---

## 3 · THE THREE DECISIONS WORTH READING

**① R-37.46 — the spec was corrected before it was built to.** The charter named F-07.45's **three** refusal shapes as the spec. That enumeration describes `sendWhatsApp`, the raw transport F-07.45 moved *away from*. `sendWa`'s real surface is **nine typed codes**. A line keyed on three would have gone silent on six — including `template_not_approved`, the shape F-16.35 is circling. The line reads `err.code` generically; the nine ride in-comment as census-of-record and **nothing branches on them**, so a tenth class logs itself the day it is minted. Cell 2.3 asserts that with an invented future code.

**② R-37.47 — a fourth contract shape was missing, and it blocked the build.** `sendWa`'s free-form return nests its id at `result.wamid`, exactly like the template path, and **nothing described it**. The declared `freeform` contract reads `sid`, which sendWa's text return does not have — so a reader would have published blanks on genuine successes. Found at read-first, before a byte; it blocked both free-form sites outright. Cell 1.2 pins the trap by asserting the wrong contract still finds nothing.

**③ R-37.51's refusal is honoured and its reason is in the file.** `sendWa` would have been one site instead of six, and would have covered all three lanes free. It is a shared library, so that is a three-lane blast radius on a one-lane charter. The call-site helper is the home; the argument returns to the chair with a census if F-05.91's sitting wants it.

---

## 4 · THE SITE MY OWN CENSUS MISSED — F-05.92

`enquiryAlert.js`'s **in-window** alert is a seventh vendor-lane send, and the read-first census could not see it: it calls `sendWhatsApp` — the raw transport — and carries neither the `sendWa(` token nor `line: 'vendor'`. **The census grepped the wrapper, so it was structurally blind to the transport.** That method lesson banks with F-05.92.

It is **not** instrumented, by R-37.52 arm (2), and the reason is stronger than scope: its success return reads `res.sid`, while on the Meta vendor lane the id arrives wamid-shaped. **A `wamid=` field reading blank on genuine successes is worse than silence** — telemetry that lies is the false-done class in an operator's uniform. Cell 4.2 pins that premise so a later reader who "completes the set" finds the reason first.

**The named cost, recorded not hidden (rider ii):** site 7's success path stays silent until F-05.92's migration sitting. F-16.35's watch meanwhile leans on the six instrumented sites, Meta's delivery receipts, and DB-side evidence.

---

## 5 · PROOF

**`b39_telemetry_bench` 22/22** cured · **3/22 at `c1d35cb`** — **19 cells red**.

The three green at both trees, named rather than counted as cure evidence: **1.3** (the untouched contracts — that is its subject), **2.7** (never throws — a stub does not either), **4.2** (a property of the raw transport, true everywhere).

**Non-vacuity: TWELVE production mutations, ZERO inert**, each restored byte-exact with the bench re-verified at 0 reds after every one.

| # | Mutation | Bitten |
|---|---|---|
| N1 | R-37.46 undone — the code keyed on an enumeration | **5** |
| N2 | the id guessed instead of read through `readSend` | 2 |
| N3 | the free-form contract read as a template | 2 |
| N4 | the recipient logged unmasked | 1 |
| N5 | values keep spaces — the line stops being grep-shaped | 1 |
| N6 | the logger throws — telemetry can break a send | 1 |
| N7 | the lane hardcoded — F-05.91 becomes a rewrite | 1 |
| N8 | the OOW template send goes silent — 26 Aug restored | 1 |
| N9 | the OOW refusal goes silent — the case that cost the evening | 1 |
| N10 | the in-window refusal stops logging | 1 |
| N11 | the fourth contract removed | **4** |
| N12 | the cron template refusal goes silent | 1 |

### TWO DEFECTS THE MUTATION HARNESS FOUND IN MY OWN BENCH

**(a) A CELL THAT COULD NOT REPORT ITS OWN FAILURE.** `capture()` restored the console only on the success path. When a cell's function threw, the console stayed hijacked — so the bench's own `RED 2.7` line **was swallowed by its own capture**, along with every line after it. N6 came back INERT for that reason: cell 2.7 was failing and could not say so. **A harness that cannot report its own failures is worse than one cell short, because it makes the count lie.** Cured with a `finally`; the async path owns its own restore, because a `finally` there fires when the promise is *returned*, not when it settles — a first fix that silently blanked all of §3.

**(b) FOUR OF SIX SITES WERE WIRED AND UNWITNESSED.** N12 came back inert not because the wiring was sound but because **nothing executed cron or mint**. The sitting had wired six sites and proved one — the F-16.29 class, committed inside the sitting that cures it. §5 now executes both cron sites through `routeBriefing`'s injectable deps, which were there the whole time. *(Site 3, `mint:welcome`, remains proven by mutation but not by an executing cell — it sits behind admin auth and its own router; declared in §6.)*

Also worth recording: §5's first draft stubbed `buildBriefing` as `{ ok }` when `routeBriefing` gates on `result.send`. Three cells reddened against a path that never ran. **Derived from the code, not guessed** — the third fixture this seat has had to correct by reading rather than assuming.

### THE FLOOR CAUGHT A SEALED CELL, WHICH IS WHY IT IS MEASURED LAST

The first delivery floor came back **DELTA**: `b06_relay_hand_bench` §13.1 — *"THE THREE SENDER CONTRACTS HAVE ONE WRITTEN HOME"* — deep-equals the `SENDER_CONTRACTS` key set, and R-37.47 made it four. **The build did not predict it; the floor found it, on the exact tree that would otherwise have shipped.**

**RETIRE-WITH-THE-READER applied.** That cell already carried a labelled amendment from when the THIRD shape arrived, so the fourth follows the pattern the cell itself established. Title amended THREE to FOUR — a cell whose name says three while asserting four is precisely the drift it exists to catch. Two assertions added pinning the new entry's nesting. **Count preserved: 126 to 126** — an amendment, not an addition. `b06_relay_hand_bench.js` was then declared on the manifest rather than left for F-14.16 to refuse.

**FLOOR (re-measured after the amendment): NAMED BASE, no delta** — `--delivery --check`, measured **LAST**, on the exact tree in the ZIP, with the handover and manifest both written and both declared. **Engine gate RC=0.** `node --check` clean on all five touched `.js` files.

---

## 6 · DECLARED GAPS — ratify or revert

**① `mint:welcome` has no executing cell.** It is behind `requireAuth` + admin gating on its own router, and booting it was out of proportion to a two-line wiring. It is covered by mutation only. **Named so it is not read as proven.**

**② Site 7 stays silent on success** — R-37.52 rider (ii), above.

**③ The `freeform` fossil is untouched and has live vendor-lane callers.** R-37.47 ruled it untouched; my in-file note claiming a reader "sees four entries and knows which is live" was **wrong** and is corrected in this ZIP. On the vendor lane **two of the four contracts are live at once.**

**④ Bride and marketing lanes remain blind** — F-05.91. The helper is lane-parameterised and cell 2.8 asserts it, so that sitting is one-line calls.

**⑤ `relayStatus.js` still discards Meta's `errors[]` (F-16.34).** This ZIP instruments the **send** side. The **receipt** side — Meta's async `failed` webhook, which is where 26 Aug's actual reason lived — is untouched and unruled. **This is the larger half of F-16.34 and it is still open.** A send line plus a receipt line correlated on `wamid` is the whole picture; today we have one of the two.

---

## 7 · THE WALK

One founder glance at Railway after any vendor-lane send. Tonight's OOW walk seeded three.

1. Deploy green.
2. Filter deploy logs for **`[wa:vendor]`**. Expect one line per send, `SENT` with a `wamid=` or `REFUSED` with an `err=`.
3. Filter for **`[enquiry:oow]`** — R-37.50's absorption means the old search still hits, on the *same* line, with no double-emission.
4. Trigger one enquiry from the couple number and confirm exactly one new `[wa:vendor]` line appears carrying `site=enquire:inwindow` or `site=enquire:oow`.

**Evidence:** the filtered log. **Veto slot: empty.**

---

## 8 · WHAT THE NEXT SITTING PICKS UP

1. **F-16.34's receipt half** — `relayStatus.js` logging `errors[0].code`/`.title`. **The highest-value hour available**: without it F-16.35 stays a hypothesis forever.
2. **F-05.92** — the vendor plane's raw-transport callers migrate to `sendWa`, each with its own both-ways proof, inheriting `logWaSend` at the seam. Census via `sendWhatsApp(` estate-wide, **never the wrapper token**.
3. **F-05.91** — bride and marketing lanes; six one-line calls.
4. **F-16.35** — under observation; the watch is now instrumented on six of seven sites.
5. Unmoved and located: F-16.32 (queued, frost-side) · F-05.84 · F-08.103 · F-08.105 · F-10.122 · F-16.19 · F-SW.10.
