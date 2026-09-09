# CE-41 · SEAT D · D3c2d (dream-os, HOT) — F-41.153, third shape

**Cut at** dream-os `c7cdc758513f0fbe0594a031cbfe0c7598e87b36`. **No migration.**

## 1 · Two wrong fixes before this one

**`.like('id', …)`** — Postgres refuses a pattern on a uuid outright.

**`.filter('id::text', 'like', …)`** — **the same error came back.** PostgREST sent the cast as part of the *column name* rather than a cast expression, so the operator still met a uuid. **I asserted that shape in a comment and could not run it here** — the original defect one layer along, shipped as a fix.

**A prefix on a uuid is a range on its high-order bits.** `enq-5b253fb2` names `5b253fb2-0000-…` through `5b253fb2-ffff-…`, answered by native uuid comparison. No cast, no PostgREST feature — and it uses the **primary key index**, where a text pattern would have scanned even if the cast had worked.

**Derived before cutting this time:** the real id sits inside the range; `5b253fb3…` and `5b253fbf…` sit outside.

## 2 · The half of D3c2c that worked is why this was catchable

The old door failed identically and **said nothing**. D3c2c's error-reading half printed `[public:enquiry] item lookup failed: operator does not exist: uuid ~~ unknown` and named the cause. **A fix that only made the failure legible still earned its place** — and it is what turned a silent `found:false` into a one-line diagnosis.

## 3 · The double now refuses both shapes

Its first version **accepted** the cast form, so it would have blessed fix #2 exactly as §10's double blessed fix #1. It now errors on `like` and on `filter` alike, and only the range resolves. **A double is only worth what it refuses.**

**`11.4d` is new:** a prefix one hex away must **not** resolve. A loose range would hand a stranger the wrong enquiry — worse than the door not working at all.

## 4 · The founder's steps

1. Apply, verify, push. **No SQL.**
2. `…/api/v2/public/enquiry/enq-5b253fb2` → **four fields**.
3. **If it still says `found:false`, read Railway** — the log line now names the cause rather than staying silent.
4. Step 4 unchanged: `enq-00000000`, `nonsense`, a **closed** token — all `{"ok":true,"found":false}`.

**Range F-41.154–F-41.156 unspent.**
