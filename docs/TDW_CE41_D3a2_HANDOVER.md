# CE-41 · SEAT D · D3a2 (dream-os, HOT) — F-41.102, a refusal is not a server fault

**Cut at** dream-os `bb90ffd5cfaec484533e4788d9a959967174fd01`. No migration.

## 1 · F-41.102 — mine, and found on the founder's console

D3a's walk refused correctly. Railway said so three times, exactly as designed:

```
[assistance:forward] item=… → prospect=… REFUSED no_consent_record (limb b) — nothing written, nothing sent
```

**But the door answered `500 Internal Server Error`.** The body was already right — `ok:false`, the code, the sentence — and only the status lied. On the founder's console it read as the app breaking rather than as the estate declining to send, which is the opposite of what a compliance refusal should communicate.

**Cause:** the forward door keeps a hand-written allow-list of caller-at-fault codes and falls everything else to `500`. D3a added `NO_CONSENT_RECORD` to the **writer** and nothing made that line notice. It is the most expected refusal this door has — the plane is shut until the paste box ships — so it was the worst code to leave unmapped.

## 2 · The cell over-reached and found something better

Its first cut asserted every `REFUSE` code appears in the forward door, and named four that do not: `no_items`, `bad_category`, `bad_budget`, `too_many_items`. Those belong to the **create** door, which handles them correctly **without naming them**, because its default is `400`:

```js
out.code === 'insert_failed' || out.code === 'items_failed' ? 500 : 400
```

**So the two doors in one file default opposite ways.** The create door assumes the caller is at fault unless it knows better; the forward door assumes **itself** at fault unless it recognises the code. **Only the second can turn a policy refusal into a 500, and it did.**

The cell now asserts that asymmetry and the forward path's own named codes — not a list of every refusal, which would rot exactly as the allow-list did.

## 3 · Floor

`b20_a2` **GREEN 140/140** cured, **RED 138/140** uncured. No other bench touched. No migration.

## 4 · The founder's steps

1. Apply, verify, push.
2. **Re-run the walk's step 3** — the same forward now answers **409** with the same sentence, and the console reads as a refusal instead of a crash.
3. **Then step 4**, which has not been run yet: record consent on the `919625759924` row and forward again. That is the half of the walk that proves the plane opens when the evidence exists.

**Range F-41.103–F-41.107 unspent.**
