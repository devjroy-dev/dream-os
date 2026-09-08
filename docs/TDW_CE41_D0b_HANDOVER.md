# CE-41 · SEAT D · D0b (dream-os, HOT) — F-41.80, F-41.78, F-41.81 · HANDOVER

**Cut by** LE-D **at** dream-os `8a0e5e64ceedc210e9007934afb10ca0b9d1196a` (seat B's docs), **re-pinned from `18e46be`**, derived fetch-first by command.

**Collision derivation (R-40.82).** `git diff --name-only 18e46be..8a0e5e6` touches **no `src/` and no `scripts/` path** — seat B shipped docs only. But `docs/TEMPLATES.md` **is** `b64` §1's witness, so the re-pin was not free: I diffed every blockquote line and **not one body moved** (seat B's 50 insertions are prose). `b64` re-run against the amended document at the new base: **GREEN 108/108**. Ancestry confirmed: `18e46be` is an ancestor of `8a0e5e6`. **Hot: F-41.80 is live on real outsiders.** No migration; ladder tail `0153` (seat F's), untouched.

---

## 1 · F-41.80 — the double article. Live, and mine.

Meta's body reads `...to find them a {{4}}` — **the body supplies the article**, and Meta's own filed sample for `{{4}}` is the bare noun (`makeup artist`), as the Manager preview renders it. The map carried the article in the **value** (`a makeup artist`), so every outsider join alert rendered:

> ...asked The Dream Wedding to find them **a a makeup artist**, and their request...

**All eleven categories collide.** It reached the founder's brother's handset tonight.

**Fixed on the value side, one home, per the chair.** `CATEGORY_ARTICLE` → **`CATEGORY_NOUN`**, articles stripped; accessor `categoryWords` → `categoryNoun`; the registry's `variables[3]` follows to `category_noun`.

**The derivation the ruling turned on:** `CATEGORY_ARTICLE` had **exactly one reader** — `categoryWords` at `:299` — whose only production caller was `:568`, the `{{4}}` slot. So the chair's first branch applied: rename and strip. `CATEGORY_WORDS` / `categoriesWords` is a **separate home** feeding the founder's notify and is untouched.

**How it happened.** The pre-F-41.63 body read `is looking for {{3}}` with no article of its own, so article-bearing values were correct against it. I replaced the body with Meta's and did not re-read the values the new body expects. **F-41.63 was named as a slot-order finding and I treated the literals as inert. A literal and its value compose.** The finding was one layer wider than its name, and neither cell I shipped four hours earlier could see that layer.

## 2 · F-41.78 — the success line names its item again

`sendWa` gains an **optional `ctx`**, forwarded verbatim to `logWaSend` (R-41.90's one home) — one labelled cross-seat line. The writer now passes `site: 'assistance:outsider'` and `ctx: item=<id>`.

`site` was always accepted and never passed; **`ctx` had no parameter at all**, which is why F-41.61's cure left `site=sendWa:template ctx=-` and the estate had no success-path byte tying a send to its assistance item.

## 3 · F-41.81 — `queued` is no longer terminal

`queued` is written once at insert. From there the arm writes `sent`/`sent_no_wamid` or its catch writes `failed`. If the process dies between — a deploy, an OOM, a restart mid-send — the row sits forever with no wamid, no error, no `sent_at`, **and nothing in the estate reads it.** Two such rows exist from `17:14` and `17:16`. The queue renders the word verbatim, so the founder read *queued* as "still going out" when it was already dead.

**`reconcileStrandedForwards` runs at boot** — the moment after the process that dropped them came back. Ten minutes' grace: a live send resolves in seconds. Marked `failed` with **`error_title='interrupted'`**, deliberately *not* a Meta code, because Meta never answered — it must never be mistaken for a `131049`.

**Driven against a double, in the manifest:** 3 rows in, 1 swept (40m `queued`); a 1m `queued` row and a 40m `sent` row correctly left alone.

*The pwa half — the queue rendering `failed`/`interrupted` in words — rides the pwa D0 rider with F-41.62's map, not this packet.*

## 4 · `b64` §3 — the cell that would have caught it, and its own near-miss

§1 compares literals between two documents. §2 binds array order. **Neither composes a literal with the value that follows it**, and F-41.80 lived precisely there: the body was right, the order was right, the message was wrong, the bench was green.

§3 renders each comparable body with the arm's own value function across all eleven categories and asserts no doubled article survives (`3.a`), and that every value is a bare noun (`3.b`).

**§3's first cut was vacuous, and this is worth carrying.** It found the trade slot by `vars.indexOf('category_noun')` — the name *this rider introduces* — so at the uncured tree the slot was `-1` and **the whole section skipped**. It would have been green on the defect it exists for. Re-cut to find the slot **by shape** (`/categor/`, so it holds under either name and the next one), and to resolve the arm's value function under either export name, **failing rather than throwing** if neither is present. Both ways now: cured GREEN 108/108, uncured RED 106/108 naming `planning: "a a"` and all eleven categories.

## 5 · c-41.40 — a bench outside my radius, broken by my own byte

`b62_mutations` **M6** anchors on `sendWa`'s `logWaSend` call. Adding `ctx` made that anchor match **0 times** — a dead anchor, F-41.65's class, caused by me. Verified green at the uncured origin (18/18), so it is mine and not inherited. **Anchor re-derived; the cell it guards is unchanged, only the string it reaches for moved.** Disclosed in seat F's c-41.35/.36 form.

`b20_a2:392` — my own D0 cell — asserted the driven value `'a photographer'`. F-41.80 makes it `'photographer'`. Updated; **count unchanged at 126/126**.

## 6 · Floor — `scripts/floor-manifest-ce41-d0b.txt`

Movements disclosed: `b64` 105→108, `b64_mutations` 6→7. `b20_a2` and `b62_mutations` hold their counts. Inherited and untouched: **F-41.64**, **F-41.65** (both seat C's). Declared: `b63_f1_model_routes_bench` exits 1 in this container on a missing `engine/dist`, **identical at the uncured origin**.

## 7 · The founder's steps

1. **Before applying** — Switchboard → *Send an outside vendor the join alert* → **Off**. Every alert sent until this deploys reads *a a makeup artist*.
2. Apply, verify, push (chains with the packet).
3. **After the deploy is live** — flip the alert back **On**.
4. **The morning screenshot** from `9327715877`, then `/admin/prospects` → Discard that row. *Discarding earlier costs the row the read joins through.*
5. Boot log to expect once: `[assistance:reconcile] stranded queued forwards older than 10m marked failed: 2` — the two rows from `17:14`/`17:16`. **Zero is a reading, not an absence**; the line prints either way.

## 8 · Open, carried

**F-41.63** — document half **closed against Meta**. Wire half awaits the screenshot, and it will now read the cured body without the doubled article. **F-41.79** kept as the walked specimen; closes with the F-41.30/.58 build. **F-41.82** (the register keeps no flip history) filed and deferred to seat C. **F-41.83** conditional — if `updated_at` has not moved once the outsider's phone is on, the marketing app's subscribed webhook fields against the vendor app's.

## 9 · What seat B's amendment changes for D2/D3 — read before the bride arms

Row 12 (`assist_found_outside`) is now **witnessed at the Manager**, and its preview reads `{{3}}` as **`makeup artist`** — a bare noun. The body is:

> Hi {{1}}, the request you sent The Dream Wedding for your {{2}} wedding has been matched to **a {{3}}**, and their work is on Instagram at {{4}}…

**That is F-41.80's shape again.** The body supplies the article; the value must not. So the `assist_found_outside` registry entry I write in D2/D3 takes **`categoryNoun`**, never an article-bearing value — and `b64` §3 covers it automatically, because it finds the trade slot **by shape** (`/categor/`) rather than by a pinned name. Had §3 kept its first cut, it would have skipped that entry entirely.

Seat B's own standing consequence — *"a cell asserting `templates.js`'s `variables` array against this section, slot for slot, would have caught this the day the registry entry appeared rather than on a handset"* — **is shipped**: that is `b64` §1 and §2, cut in D0 and extended here.

Its harder sentence is worth carrying verbatim in spirit: **the registry entry was authored independently of the filing rather than derived from it.** Row 12 records that a future `assist_found_outside` entry must be *derived from the reading*, not authored beside it. That is the discipline D2/D3 inherits.

**Range: F-41.84–F-41.85 unspent.**
