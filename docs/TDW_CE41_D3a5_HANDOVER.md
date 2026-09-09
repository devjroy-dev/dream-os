# CE-41 · SEAT D · D3a5 (dream-os, HOT) — F-41.104, the read path's consent

**Cut at** dream-os `e660d0e7401578230555716e4ddf05cafe3c7bd7`, **re-pinned to `ab7c2835267368c1ab373cd00c6fb2eedbed5c36`** — seat B's B4-10 (the Anthropic DPA read) landed between the cut and the apply, in the founder's own terminal.

**The base guard caught it and refused to continue**, which is what it is for: `BASE OK` never printed and the chain stopped before the benches ran.

**Collision derivation (R-40.82).** `git diff --name-only e660d0e..ab7c283` is **one file** — `docs/filings/ANTHROPIC_DPA_READ.md`. Neither of this packet's two files was touched. Clean fast-forward, no carry. No migration.

## 1 · F-41.104 — F-41.103's exact class, one door over

Building the pwa's *Consent noted* row surfaced it. The queue's rows come from the **read** door, and that door hydrated prospects with `id, name, ig_handle, phone, state` — **no consent columns**. So `consent` would have been `undefined` on every row and the words could never have rendered, whatever the database held.

**F-41.103 was the SEND path failing to select those columns; this is the READ path failing the same way.** The individual miss matters less than the shape: **a cure applied to one path and not its sibling.** The pwa packet would have shipped a row that silently never appears, and only a walk would have caught it — again.

## 2 · The read hands over the STATE, not the columns

`consentState(consentEvidences(p), p)` is computed **once, here**, and the queue renders it. The pwa must never re-derive it from `consent_source`: two opinions on one fact is how a row says one thing beside a record that says another. Vendor forwards carry `null` — consent is a prospect's fact, and a vendor on TDW reached us herself.

## 3 · §7g, and why it anchors on `ig_handle`

Its first cut looked within 120 characters of `.from('prospects')` and found **two of three** — the insert path's `.select` sits after a whole object literal. Anchored instead on the shape: every prospect-shaped select in this file names `ig_handle`. That cannot drift with formatting, and **a fourth select is caught the day it is written** rather than the day a walk finds it missing.

## 4 · Floor

`b20_a2` **GREEN 151/151** cured, **RED 148/151** uncured. No migration, no other bench.

**Range F-41.105–F-41.107 unspent.**
