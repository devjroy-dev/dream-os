# CE-41 · SEAT D · D3a4 (dream-os, HOT) — R-41.132, F-41.103, R-41.133

**Cut at** dream-os `187c410cffdf331fd4219544f3f14019bb782ef6`. Migration **`0157`**.

## ⚠ 0 · THIS PACKET SUPERSEDES D3a3 — APPLY ONE, NOT BOTH

D3a3 had **not landed** when this was cut: the tip was still `187c410`, the D3a2 commit. Both packets rewrite `src/lib/couple/assistance.js` from that same base, and a whole-file `cp` means **whichever applied second would revert the first**. So D3a4 carries D3a3's bytes as well as its own.

- **If D3a3 is not yet pushed** — apply this one and discard D3a3.
- **If D3a3 has landed since** — the base has moved and this needs re-pinning; say so and I re-cut.

## 1 · R-41.133 — the CHECK caught the ruling the day it was made

`0156` constrained `consent_source` to three values with this reasoning, verbatim: *"an unbounded source string is how a later seat writes 'phone call' and nobody notices the evidence is unverifiable."* R-41.133 then ruled a fourth. **The constraint did exactly what it was for** — without `0157`, every tick of the checkbox would be rejected by Postgres and the founder would get a 500 on a control that looked like it worked.

**`founder_attested` is not a fourth kind of *her*.** The other three answer *where she said it*; this one answers *who is speaking*, and the answer is TDW. It is the founder's habit made a tap and labelled honestly — **never her voice from a tick**, which is the boolean `0156` refused wearing her name.

## 2 · Three states, and the queue must never re-derive them

`consentState(c, prospect)` returns `{ state: 'her_words' | 'founder_attested' | 'none', limb }`. The pwa renders **this** and never reads `consent_source` itself: two opinions on one fact is how a row says *No consent on file* beside a record that exists.

`limb` survives on `none` because it says **which** limb is unevidenced, and the founder's next move differs — limb (b) means ask her, limb (a) means ask her to send the number herself.

**The trap §7f exists for:** TDW's sentence does not contain her number, so `consentEvidences` alone calls it limb (a). Without the source word winning, the queue would show *No consent on file* over a real attestation. A cell asserts exactly that: `consentEvidences(att).ok === false` **and** `consentState(...).state === 'founder_attested'`.

## 3 · R-41.132 and F-41.103 (carried from D3a3)

The gate is gone — the send proceeds, the gap is logged, the reading is carried out. **Enforcement is now the founder's habit and the DM thread (R-41.125), not this function**; the queue's three states are what make the gap visible rather than silent.

**F-41.103:** the find path never selected the consent columns, so an existing prospect always read as *no record*. Confirmed on prospect `3291bbfd-1e9d-4bb1-93e6-4cb38d03d7b6` — the record written 05:17, the refusal at 10:49, same row, `len 12` phone intact. `§7e` now asserts **every** prospect select in the send path reads them.

## 4 · c-41.72 honoured, and it caught my own grep

Every `replace` is followed by a grep proving it landed. **One of those greps returned `0` and the edit was fine** — I searched for `consentState(consent, prospect)` while the file holds the regex-escaped `consentState\(consent, prospect\)`. The habit works only if the grep matches the bytes actually written, so the manifest records the four proofs in the form that does:

```
bench regex   1   writer sites  2   0157 present  1   three states  3
```

## 5 · Floor

`b20_a2` **GREEN 148/148** cured, **RED 139/148** uncured. No other bench touched.

## 6 · The founder's steps

1. Apply, verify, push. **Discard D3a3 if it is still unpushed.**
2. **Run `0157`.** It drops the old constraint before adding, so a re-run is safe.
3. Nothing changes on the glass until the pwa packet ships the control.

**Range F-41.104–F-41.107 unspent.**
