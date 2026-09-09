# CE-41 · SEAT D · D3c2c (dream-os, HOT) — F-41.153, the door that could not find

**Cut at** dream-os `42dbb30483d605bfb081f70d64a53bf8fc1eedc9`. **No migration.**

## 1 · What it was

`assistance_request_items.id` is a **uuid**. Postgres refuses `id LIKE '5b253fb2%'` outright — `operator does not exist: uuid ~~ unknown`, confirmed at source. PostgREST returned that error, supabase-js handed back `data: null`, and `publicEnquiry` read null as *no such enquiry*.

**Every token answered `found:false`.** The door was mounted, reachable, and structurally incapable of finding anything.

**Two faults, and the second hid the first.** Destructuring only `{ data }` threw the complaint away. **An unrunnable query and a query that matches nothing are different facts** — and a public door that confuses them gives a prober and a real vendor the same answer by accident rather than by design. Both lookups now read their error, log it, and refuse.

## 2 · Why the bench passed a broken door

**§10's double ignored the predicate.** It returned rows whatever the filter said, so all four paths went green while the filter was unrunnable.

**§11's double honours the filter** and errors on the uuid form exactly as the database does — and it **reds at an uncured tree**, which §10's never would have. **A double that waves the predicate through cannot test the predicate.**

## 3 · §11.4 took three shapes before it was honest

It first built the double and asserted an object was **not null** — always true, vacuous, precisely the failure this bench exists to catch. It then reached for `deasync` and a global promise, because `b66` is synchronous and `publicEnquiry` is async. **The honest answer was neither:** the bench grew an async tail, so driven cells run after the synchronous body and before the verdict, with no machinery.

## 4 · One thing the walk taught

**There were no `open` requests at all** — Sarah's are `forwarded`. Only `closed` hides an enquiry, which is right: **a forwarded request is exactly the one a vendor holds a link to.** An `open`-only door would have been blank for every real reader.

## 5 · The founder's steps

1. Apply, verify, push. **No SQL.**
2. **Re-run step 3 of the walk** — `…/api/v2/public/enquiry/enq-5b253fb2` should now return four fields, not `found:false`.
3. **Step 4 unchanged:** `enq-00000000`, `nonsense`, and a **closed** request's token must all still answer `{"ok":true,"found":false}`.

**Range F-41.154–F-41.156 unspent.**
