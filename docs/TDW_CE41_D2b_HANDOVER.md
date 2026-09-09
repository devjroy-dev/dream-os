# CE-41 · SEAT D · D2b (dream-os, HOT) — F-41.123, the url button component · HANDOVER

**Cut by** LE-D **at** dream-os `5d7d4835fc41e5ef19db23ac470578d2f6184ea0`, derived fetch-first. **No migration.**

---

## 1 · The ruling's diagnosis was wrong, and following it would have built a second home

R-41.123 says *"`buildTemplatePayload` emits body parameters only; a template with a dynamic URL button needs a `{type:'button', sub_type:'url', …}` component."* **The first half is false at this base.**

`buildTemplatePayload` has carried a **url-button arm since G3.2 s2** (`src/lib/templates.js`, at the foot: `if (t.button && t.button.type === 'url')`), and **`review_request` has used it in production** — declaring `button: { type:'url', index:0, text:'Write a Review', base:'https://thedreamwedding.in/r/', variable:'code' }` and passing `vars: { couple, vendor, code: suffix }` from `reviewAsk.js:124`.

**Building a second arm would have been two homes for one fact.** The real defect was two things, both narrower:

**(a) The v2 registry entry declared no `button`.** Row 10a records a dynamic URL button; the entry omitted it, so the builder emitted body parameters only and Meta refused with `131008`.

**(b) `forwardToProspect` passed an ARRAY.** The button arm reads the suffix **by the button's own variable name** — `vars[t.button.variable]` — and explicitly refuses to read it from a positional list, because the button's `{{1}}` and the body's `{{1}}` are different variables that share a number. **An array cannot carry a suffix at all**; the arm would have thrown before Meta was called. Meta's refusal came first only because there was no `button` to begin with.

So: **two declarations and one call-site shape. The builder is untouched.**

**Driven, not asserted** — the payload now carries exactly what `131008` asked for:

```
components[0]  {type:'body',   parameters:[5 × text]}
components[1]  {type:'button', sub_type:'url', index:'0',
                parameters:[{type:'text', text:'enq-<item_id>'}]}
```

## 2 · `found_vendor` cured before its arm wakes

Row 11 records a dynamic URL button on the `/v/` family, suffix `routing_handle`. **Declared now**, so the day that arm is built it cannot repeat `131008`, and `b64` asserts the declaration against the document today with no send required. The chair asked for this and it costs nothing to do early.

## 3 · R-41.119's prefix is in the byte

The suffix is `enq-${item.id}`. One path, two families: the review family owns bare codes on `/r/`, this one owns `enq-`, and the pwa's `/r/[code]` branches on the **prefix explicitly, never on shape**. The bend to R-40.15 and its retirement (base moves to `/e/` at the next edit window, prefix retires with it) are recorded at the declaration.

**Note the collision is real and pre-existing:** `review_request`'s button base is the *same* `https://thedreamwedding.in/r/`. The prefix is what keeps them apart.

## 4 · `b64` §2 became stronger, and the site regex was wrong

The keyed object made §2 **read the key the call site writes** instead of inferring the binding from order. A mis-keyed value is now wrong on its face rather than wrong by position — and unlike the old order form, there are no annotations to be fooled by (its own M3 tuition).

**But the site regex matched the wrong function.** `const vars = {` found **`notifyFounder`'s** object — an earlier one in the same file — so §2 asserted the wrong send site while showing green on two of five cells. **Each site now names its function**, and `2.0` fails if that function isn't found. That mistake surfaced a second, never-covered live send, so `notifyFounder` is now a wire site too.

**New cells:** `2.d` the url button's suffix is supplied at the send site · `2.e` the suffix is **not** one of the body's declared variables · `2.f` the by-hand list cannot rot.

**`2.c` partitions rather than narrows.** The containment fold misses two real pairs at `notifyFounder` (`date_words ← monthDayYear(…)`, `couple_name ← request.name`) — correct code the heuristic cannot see. Narrowing the cell to where the rule happens to hold would be the vacuity this file has been caught at twice. Both are named with the reading that justifies them, and `2.f` reds if a named pair becomes self-evident.

## 5 · Two mutations retired, one added, none silently

**M2** (permute `variables`, expect §2 to catch) and **M6** (permute both, expect them to cancel) both described the **array form's positional binding**, which no longer exists. M2 and M8 were **the same edit expecting opposite verdicts** — a harness holding both contradicts itself. Both retired **in comment, with their reasons**, rather than deleted.

**M8 is a declared blind spot, measured.** Permuting `variables` alone changes the order Meta receives (`declared.map(nm => vars[nm])`). §1 can't see it — no literal moves. §2 can't see it — keys bind by name. **So `b64` is blind to it, and M8 says so out loud.** The conviction lives in **`b20_a2`'s driven cell**, and I verified it by command: applying M8's edit reds `b20_a2` at 125/126 on *"the PAYLOAD META RECEIVES is in Meta's order"*. Behaviour, not text — the better instrument for it.

## 6 · c-41.63 — one cell in `b20_a2`

It read `oc.vars` as a positional array. Re-cut to **build the payload and assert the order Meta actually receives**, which is the guarantee its label always claimed and the array form only stood in for. **Count unchanged, 126/126.** Its label said *"five vars"* while doing something else; that is fixed too.

## 7 · What is NOT here

**F-41.124 is the pwa's.** The code-to-words map keying `131008` onto the `131049` sentence lives in `app/admin/assistance/page.tsx`, and the fix (exact-code keys, unknown codes get *"Meta refused this send. Try again."*) rides the pwa packet with `/e/[id]`, the `enq-` branch, and F-41.98's `room` field. **Until that ships the queue will mislabel a `131008`** — named, not fixed here.

**Five anchors died on my own edits** (§2's site regex, M3, M6, `b20_a2`, and D2's four before them). Fourth time this sitting. The harness reporting `matched 0 times` rather than passing is the only reason it stays survivable.

## 8 · The founder's steps

1. Apply, verify, push. **No migration.**
2. `template.tdw_assist_lead_outside_v2` is already `approved`/`seed`; flip it **on** and forward one outsider.
3. **The handset should show the enquiry notice with a tappable *Visit website*.** `131008` cannot recur — the component is now emitted.
4. **The button still lands on the review fallback** until the pwa packet ships `/e/[id]` and the `enq-` branch. Expected and named.
5. `found_vendor` stays shut — no arm behind it.

**Range: F-41.99–F-41.107 unspent.**
