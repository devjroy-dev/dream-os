# TDW_06 · M-3 — MODEL & PERSONA GOVERNANCE · EXECUTOR HANDOVER

**Sitting:** one · **Role:** executor · **Repo:** `dream-os` · **Base:** `981e9ba`
**Rulings built to:** M-3 R1–R7 (standing chair, 2026-07-25)
**Delta:** 5 files — 4 modified, 1 new. Zero SQL. Zero soul bytes. Zero migrations.

> One line: **every model choice is now ruled rather than inherited, the persona firewall
> reaches the wire that was actually bleeding, and the bride's own sentence is the one
> thing on that wire nobody is allowed to rewrite.**

---

## 1. THE TIP, AND WHAT MOVED UNDER THE CHARTER

The kickoff stated `7ceb4ef`; origin was `981e9ba` (CE-73), **docs-only**, so every code
anchor stood. Both charter defects the read-first reported were ratified at R0 and are
built accordingly: the F-06.16 cell's shape (three sites, not one) and the unachievable
`b06_m1 45` floor (F-06.34).

## 2. WHAT SHIPPED, BY RULING

**R1 · `src/engine/src/core/distill.ts`** — the clerk's Sonnet is declared lawful at its
own site: a labeled comment citing E-1, stating the batch-job reason (~Rs 30-40 once per
document, then Haiku forever), naming the three-site allowlist, and stating explicitly
that this is *E-1's clarification, not an exception by stealth*. Zero behaviour change —
the model call, the cost math and the price row are byte-identical.

**R2 · `src/lib/vendorInbound.js:1093`** — `let replyText = scrubText(result.reply);`,
mirroring `chat.js:1580` byte-for-shape. Sited on `result.reply` alone: the invoice
confirmation lines carry founder-vetoed copy and a stored client name, and `cal.suffix`
arrives already floored by `calendarSignals`.

**R3 · the four notification sites** — a new `scrubModelFrame(text, verbatim)` (exported,
the `stripRoutingToken` precedent) scrubs the model's frame and passes the quoted bride
sentence **byte-exact**. Each site passes the verbatim *its own turn was handed* — and
they differ (`originalMessage` · `body` · `stripRoutingToken(body) || 'hi'`), which the
bench pins pairwise. The split anchors on `"<quote>"`, not the bare text: a two-letter
message like `on` occurs inside `Donna`, and a bare split would hand the firewall the
fragments `D` and `na`. No quoted token found ⇒ the whole string scrubs — **fail-safe is
the firewall CLOSED.**

**R4 · `scripts/b06_m1_bench.js` §6.8** — F-06.34 cured. The cell now measures
`d6a4a6e..ab011c1`, a historical fact no later push can move. **45/0 restored.**

**R5 · `scripts/b06_gauntlet.js`** — the two selftest cells asserting the retired
pre-F-06.26 contract are re-aimed as labeled amendments, both-ways preserved.
**Rig selftest 108/110 → 110/110.**

**R6 · `recencyFidelity`** — the additive `quality` field: `answered` · `gap` ·
`deferred` · `denied` · `n/a`. `ok` is byte-untouched on every path. The 2:27 shape now
scores distinct from a dated answer: no conviction, and no reward.

**R7** — the mirror census is recorded in §5 below.

## 3. PROOF

| bench | before | after |
|---|---|---|
| `b06_m3_bench` (new) | — | **37 / 0** |
| `b06_m1_bench` | 44 / 1 | **45 / 0** (R4) |
| `b06_gauntlet --rig-selftest` | 108 / 110 | **110 / 110** (R5) |
| `b06_m2_bench` | 39 / 0 | 39 / 0 |
| `b06_m0_bench` | 50 / 0 | 50 / 0 |
| every other bench in `scripts/` | — | **byte-stable, count for count** |

`npm run build` green. `node --check` clean on the touched `.js`.

**Non-vacuity — nine mutations, all of PRODUCTION code**, each re-running the bench in a
child and asserting the named cell goes red; every mutated file restored byte-identical
and asserted so (`§5.0`). The mutations plant a fourth Sonnet site in `loop.ts`, strike
the carve-out's declaration, un-scrub the reply, un-scrub the notification frame, rewrite
the bride's quote, drop the quote-anchor, open the fail-safe, and both directions of the
quality arm.

**§2 drives the SHIPPED door.** `processVendorInbound` runs to completion against a stub
estate and the bench reads the bytes handed to `sendWhatsApp`. The wire is the witness —
that is where the bleeds happened.

## 4. TWO SELF-CAUGHT DEFECTS, DISCLOSED

1. **The census under-counted in the reassuring direction.** The comment stripper handled
   block comments before line comments, so the `/*` inside `src/engine/src/**` — written
   in the carve-out's own declaration — opened a phantom block comment that swallowed the
   rest of the file and returned **one** Sonnet site where three exist. Caught by the
   bench's own red, order reversed, reason banked in-file.
2. **The first `§2.7` fixture did not exercise the trap it was named for.** It put the
   quote before the name in the wrong order, so the uncured tree passed it. Re-shaped so
   the shatter actually happens; it now REDs under mutation as it must.

## 5. THE MIRROR CENSUS, RATIFIED (R7) — banked so it is not re-derived

- **`brideInbound.js`** — four sends, **all `getNudgeCopy` fixed copy, zero model-voiced.**
  No wire needed.
- **`cron.js:76`** — exonerated: `buildBriefing` makes no model call.
- **`collab.js:622/:772/:776`** — exonerated: fixed copy + DB fields, CE-59 veto standing.
- **`agent/engine.js:1327`** — named-not-taken, inside F-05.56's dead band.
- **The PWA lane** — already wired (`chat.js:1580` + `translateBeat`), **0-line.**
- **The 21 fixed-copy sites in the door** — named individually and asserted byte-unchanged
  (`§4.3`); the firewall's reach in the file is inventoried call-for-call (`§4.4`) so no
  scrub can drift onto vetoed copy unnoticed.
- **`scrub.js` is 0-line.** The cure is a CALLER, composed the way `chat.js` and
  `calendarSignals.js` compose it. Touching the firewall's home would also red
  `b06_m0 §7.2` on the founder's own verify.

## 6. CARRIED LOUDLY — TWO PRE-EXISTING REDS, NEITHER MINE, NEITHER CURED

Both stood at the clean tree before this sitting and are **outside M-3's charter**:

- **`b06_meter_bench` 28/29** — `§3.2 no OTHER route moved — the whole DEFAULTS map,
  key-for-key`.
- **`b6_sitting2_bench` 20/22** — `the zero-match prose teaches the NAME-AS-SHOWN in its
  place` · `the recovery fallback itself is untouched`. Both read `donnaFind`'s zero-match
  wording, which M-1's P1 re-render moved; almost certainly R5's class in another bench.

**Neither was touched.** Reported for the chair's sequencing, not cured on my own word.

## 7. THE FOUNDER'S SMOKE CARD — walk ONCE, after proof

You only perform and paste; I read the evidence.

1. Open WhatsApp to the vendor line and send: **`fresh`** — wait for the confirmation.
2. Send a turn that historically bled a name, e.g.
   **`what did the operator file for me today?`**
3. Screenshot the reply. **Nothing in it should read "Donna" or "Harvey."**
4. From a *different* handset (the bride/test number), send the vendor's TDW code
   followed by a sentence that contains the word Donna, e.g.
   **`TDW-DROY550 is Donna the one who called me?`**
5. Screenshot the notification that arrives on the **vendor's** phone.
   **Her sentence inside the quotes must be exactly what she typed, Donna and all** —
   while any wording *outside* the quotes must be clean.
6. Run the SELECT below in the Supabase SQL editor and paste the rows back.

```sql
-- TDW_06 M-3 walk · READ-ONLY. Columns witnessed in docs/db/PUBLIC_SCHEMA.md:
--   public.conversations · 12 columns (id :1, vendor_id :2, kind :5, created_at :9)
--   public.messages      · 18 columns (conversation_id :2, direction :3, body :5,
--                                      sent_by :7, created_at :11)
-- F-06.28's law: warm/cold is a DATABASE fact — a fresh thread is a fresh conversation
-- ROW, verified by COLUMN, never by the button's label. conversation_id is the column.
select m.created_at,
       m.conversation_id,
       m.direction,
       m.sent_by,
       left(m.body, 300) as body
from public.messages m
where m.created_at > now() - interval '2 hours'
order by m.created_at asc;
```

**What I will read from it:** step 3's reply carries no internal persona name; step 5's
quoted sentence is byte-identical to what she sent; and the `conversation_id` column
settles whether each turn was genuinely cold rather than an echo.

## 8. WHAT THIS SITTING DID NOT DO

- **W-1 held shut.** Souls, lenses and prompts are 0-line, asserted by command (`§4.1`).
- **No SQL, no migration.** `0101` stays unreserved.
- The `:337` OCR preview is **named-left** per R2; it re-enters only on a witnessed bleed.
- The R-G rider stays **conditional-withheld** with CE-73's trigger intact.
- F-06.22's closure still pends the first green acceptance evening. **The clock is ZERO.**

## 9. OPEN, FOR THE CHAIR

1. The founder's walk (§7) — the live witness, declared-not-claimed.
2. The two carried reds (§6) — sequencing is the chair's.
3. Whether `quality` should ever CONVICT. It does not today, by ruling. The evenings will
   show whether an `answered`-rate floor belongs in M-6's exit; that is not mine to take.
