# TDW_09 · B-09H · DELIVERY 2 — F-09.173. THE PHOTOGRAPH CAN REACH THE ESTATE.

**Repo:** `dream-os` · **base:** re-derived at delivery (apply block line 1)
**Role:** LE under CE-31. The executor never pushes; this ZIP is the founder's to apply.
**Charter:** B-09H, relays №1–№3. **HOT** — this is the finding that ate real photographs.

---

## WHAT WAS WRONG

`metaInputsFrom` hardcoded `mediaContentType: null, mediaUrl: null` for every Meta inbound
and called it a *declared gap*. The gap outlived Twilio. Mehek's photograph became
`[circle-handler] note captured`, zero pipeline lines, `muse_saves` untouched — and the
circle agent, seeing no deed either way, told her it had been added to the board.

## THE CURE IS **ONE SEAM**, NOT TWO DOORS

The charter said *both doors*. The derivation said otherwise, and the chair ruled on it.

`req` at the circle door is **not a Meta payload**. It is a synthetic Twilio-shaped envelope
built by the bride door itself, out of the same two fields:

```
req: { body: { MediaContentType0: mediaContentType, MediaUrl0: mediaUrl } }
```

Both doors read those two normalized fields — the bride's at three sites, the circle's at
three. **Fill them once and both doors open. Neither door needed an edit.** Both still get
their own both-ways cells, as ruled.

The resolve happens at the **webhook**, before inputs are built, and the normalizer stays
**synchronous and pure** — `src/index.js:215-217` → `vendorInbound.js metaInputsFrom`'s third
argument, mirrored line for line. `metaMedia.js:15-16` wrote this sitting's brief itself:
*the future bride adapter reuses this file untouched, supplying its own policy.* It does.

## WHAT SHIPPED

| file | delta | what |
|---|---|---|
| `src/lib/metaMedia.js` | 17 | **one param**: `objectPrefix`, default `''` (F1) |
| `src/lib/brideInbound.js` | 88 | the third arg fills **both** fields · `resolveBrideMedia` + lane policy · exports |
| `src/brideIndex.js` | 37 | resolve before inputs · F5's law named at the branch that enforces it |
| `scripts/b09_f09173_bride_media_bench.js` | new | 27 cells, ten mutations |

**`museSave.js` and `imagePipeline.js` are byte-untouched and deliberately absent from this
ZIP.** The resolved photo enters the pipeline the existing doors already call, through the
existing gates — the image throttle, the circle daily cap, and fork A's `capSkipTagging`.
This delivery adds **no** `processImageForMuse` invocation, which is why meter cell 8.10 is
green without being edited.

## THE RULINGS, CARRIED AS CODE

- **F1 — one bucket, lane folders.** `wa-media` shared; bride objects file under `bride/`.
  `objectPrefix` defaults to `''`, so the **vendor lane's object paths are byte-shape-identical**
  to before this change. That equality is cell §1.2, and §1.4 asserts the vendor adapter still
  passes no prefix. A later per-lane split becomes a move of prefixed objects, not a dig.
- **F2 — one token, and its absence is a typed state.** `META_WABA_TOKEN` (no per-lane token
  exists estate-wide). Absent → `resolveMetaMedia` throws → caught → typed `[meta-media]` line →
  `null` → both doors behave exactly as they did before this cure. Per relay №3 ①, read-and-degrade
  is not assuming. Cell §2.4 drives the real resolver with the variable deleted.
- **F3 — the vendor policy, verbatim.** 4 mimes, 5 MB. Cell §2.5 asserts equality **and**
  asserts the two lanes do **not** share one array object — a vendor-lane edit must not silently
  move the bride lane's ceiling.
- **F4 — the vestige is KEPT and NAMED.** An F-06.85 comment sits where the envelope is built:
  rename those two Twilio-shaped fields and the circle door goes silent again in exactly the
  F-09.173 shape. Retirement parked as hygiene beside F-05.77.
- **F5 — one act, one row.** The caption rides the save; no `comment` row when text arrived
  attached to media; text-only stays a note. **This needed no edit** — the circle door's
  `else if` already enforces it, and only ever fell through because the door was blind. The
  `else if` is now documented as the enforcement, and cell §5.4 reddens if anyone makes it a
  second `if`.

## PROOF

**27/27 green** on the applied tree. Both-ways by mutating **production code**, not test setup:

| mutation | effect | cells reddened |
|---|---|---|
| `metaInputsFrom` returns hardcoded nulls (**the uncured tree**) | 27 → **24** | §3.1 §4.1 §4.3 |
| url filled but **type** still null (the half-cure) | 27 → **24** | §3.1 §4.1 §4.3 |
| the webhook stops passing the third arg | 27 → **26** | §6.1 |
| `resolveBrideMedia` rethrows instead of degrading | 27 → **25** | §2.3 §2.4 |
| the bride policy drifts off the vendor's | 27 → **25** | §2.1 §2.5 |
| the circle note branch becomes a second `if` (F5) | 27 → **26** | §5.4 |
| `metaMedia` drops `objectPrefix` from the object path | 27 → **25** | §1.1 §1.3 |
| the **vendor** adapter starts passing a prefix | 27 → **26** | §1.4 |
| the circle door reads a renamed field (the vestige moved) | 27 → **26** | §5.1 |
| the circle door's save source stops reading the envelope | 27 → **26** | §5.3 |

Door 1 is driven end-to-end through the **real** `processBrideInbound`; §4.3 captures the
circle door's envelope from a **real** `handleCircleMemberMessage` call, not a source scan.

**DECLARED LIMIT, NOT PAPERED.** `src/brideIndex.js` calls `app.listen()` at module scope and
cannot be required from a bench without booting a server. Its two media expressions are
therefore **cut from the production file on stable code markers and evaluated** (§5). The
extractor throws loudly if a marker moves — a failure mode that differs from a grep's silent
zero (independent-method law, clause 1). Mutations 9 and 10 above prove those cells reddenable.

**ONE SELF-CAUGHT BENCH DEFECT, disclosed at discovery.** §5.3's first draft asserted
`X || true` — a cell that could not fail. Caught on this bench's own first run, rewritten to
drive the production expression both ways, and mutation 10 proves it has teeth. *A cell that
cannot fail is not a cell.*

`node --check` clean on all four files. `npm ci` EXIT 0, `npm run build` EXIT 0.

## THE FLOOR — DERIVED, NOT NAMED; PAIRED BEFORE AND AFTER

Eighteen benches, derived by grep for the touched files across `scripts/` and `tools/`.
**Every figure identical before and after this diff.**

`b05_arc_m1` 53 · `m2` 27 · `m4` 19 · `m5` 11 · `m6` 20 · `couple_soul` 21 · `f0532` 9 ·
`m1b_inbound` 4 · `media_shim` 14 · `b07_f0774` 19/19 · `b08_p5_eliza` 29 ·
`b5_webhookcore` 11/11 · `tdw10_tier` 81 · **`tdw10c_couple_meter` 30/30 (cell 8.10 green)** ·
`tdw09_rider2_budget` EXIT 0 · **`b09_f09173` 27/27 (new)** — all EXIT 0.

**TWO PRE-EXISTING REDS, RECORDED BEFORE THIS DIFF EXISTED AND UNCHANGED BY IT:**
`b05_p4_crons_bench` **46/2** (§6.5 stale-by-law-evolution, §6.6 stale-by-growth) and
`b07_f0772_circle_auth_bench` **158/1** (§12.14's closed world reddened lawfully by `0106`).
Both are **F-05.77**, another seat's hygiene micro. Recorded so no green of mine is read as a
cure and no red of mine is confused with them.

## WHAT THIS DELIVERY DOES **NOT** DO

- **No copy.** No vendor-facing or model-voiced byte moved. Nothing needed a veto.
- **No W-1.** Zero lines in any soul, lens, or prompt file. The two granted lifts stay behind
  their vetoes for D-4.
- **No architecture.** The ratified `.171`/duty(a)/`.175`/`.176` merge is D-3.
- **No DDL.** No migration.

## RESIDUAL, DECLARED AND OWED TO F-09.174's SITTING

When media is present but the resolve **fails**, control still lands in the note branch and a
caption is still recorded as a note; and `bodyForLog` shows the caption rather than the media.
`.174`'s ruled per-turn states — *no-media / media-saved(save #N) / media-present-unsaved(reason)* —
are what will carry that case honestly. **This sitting does not paper it**, and the comment at
the circle door's note branch names it by number so the next sitting is forced to read it.

## WHAT GATES ACCEPTANCE — the founder's acts, not this seat's

The live witness is the **founder's**, declared-not-claimed. Walk card ships after the push
deploys, one step at a time, and after his `SELECT` rows land per the fixture-state law.

1. **Circle member photo** — Mehek (`8757788550`) forwards an image to the bride lane.
   Expect: `[bride-webhook]`/`[circle-handler]` save lines, a `muse_saves` row, and a reply
   that speaks only what the rows hold.
2. **Bride's own photo** — from `+919625759924`. Expect a save and her acknowledgement.
3. **Captioned photo (F5)** — expect **one** `muse_saves` row with the caption on it and
   **no** `circle_activity` comment row for that act.
4. **The vendor lane, unmoved** — one vendor image, its object path still unprefixed.
5. **`META_WABA_TOKEN` on `dream-os-bride`** — the Variables-tab YES stays owed for the
   record per relay №3 ①; it rides this walk and blocks nothing.
