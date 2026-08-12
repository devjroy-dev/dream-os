# TDW_10.C · DELIVERY 3a — §0.2-K. THE IN-APP MUSE DOOR WAS UNGATED.

**Repo:** `dream-os` · **base:** re-derived at delivery (apply block line 1)
**Role:** LE. This is an executor error being cured, not a ruling gap.

## WHAT HAPPENED

The founder set `couple_ai_daily_basic = 0` for the R-29.34 walk. The bride's
WhatsApp turn refused correctly with the vetoed zero byte. **Three minutes
later a PWA Muse upload spent money behind that closed gate:**

```
07:14:29Z  tagging  google-vision  unpriced  ₹0     turn_id NULL
07:14:36Z  tagging  anthropic      metered   ₹0.07  turn_id NULL
```

Fork A rules that a capped couple's SAVE survives and the TAGGING is skipped.
The save was right. The spend should not have happened.

## THE CAUSE, NAMED

D3 threaded fork A's `capSkipTagging` through `museSave.js`, which covers both
WhatsApp image doors. **`src/api/couple/muse.js` calls `processImageForMuse`
directly**, bypassing `museSave` entirely — two call sites, `:282` and `:372`,
neither gated. D3's own handover table claimed 「 image (both) 」 were covered.
It was wrong.

## THE CURE

`museCapSkip()` reads the couple's row for `tier`, calls `coupleCapGate`, and
returns only `refuse`. **No byte is sent from this door** — an upload is not a
conversation, and fork D allows one byte per refusal EVENT, which this is not.
The save lands; the two paid calls do not run.

`turn_id` stays NULL (R-30.37 consequence 3): an in-app upload is not an inbound
message. It counts nothing toward the cap and costs truly — which is precisely
why it must be skipped when the cap is closed rather than merely counted.

## THE BENCH LESSON — THE SAME ONE, THIRD TIME

D3's cell 8.9 lists doors **by hand**, and the hand-list is what missed this.
The opening census found a charter naming three spend sites against a tree
holding ten; the client wrapper was chosen over ten call-site edits for exactly
this reason; and the bench then repeated the mistake the code had avoided.

**Cell 8.10 asserts the PROPERTY, not the list:** every invocation of the paid
image pipeline must pass `capSkipTagging`. A call site added by any future
sitting cannot be silently ungated.

Its first draft flagged two COMMENT lines documenting the signature. Narrowed to
invocations — a cell that cries wolf on documentation gets muted by the next
reader.

## PROOF

- **30/30** on the applied tree.
- Cell 8.10 RED at the uncured tree, naming `muse.js:282` and `muse.js:372`
  exactly; GREEN at the cured.
- `node --check` clean.

## STILL OPEN

- **R-29.34's circle half** — the circle member's byte has never been seen by a
  human. Worth taking while the dial is at 0.
- **RESTORE THE DIAL** to `20` after the walk.
- **Walk leg 3 CLOSED GREEN** — the image pair above is the witness the card
  was owed, obtained in a state that should not have occurred. Both true.
- **The lying console** (`couple_wa_*` / `couple_pwa_*`, Gold/Platinum) is a
  `dreamos-pwa` edit outside this charter's radius. Chair ruling sought.
