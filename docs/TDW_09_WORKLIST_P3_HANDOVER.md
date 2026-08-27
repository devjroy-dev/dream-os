# M-WORKLIST · PHASE 3 — THE TODAY BACKEND

**dream-os base `0ca7f08`** (fetch-first at origin; `git fetch -q origin && git rev-parse --short origin/main`).
Executor sitting, LE. Zero DDL, zero migrations, zero pushes, zero copy.

---

## 1 · WHAT SHIPPED

| Path | State |
|---|---|
| `src/api/vendor/worklistToday.js` | NEW — `GET /api/v2/vendor/worklist/today` |
| `src/lib/vendor/istClock.js` | NEW — the IST day boundary's one home |
| `src/api/vendor/core.js` | MODIFIED — one mount added; the live `/today` mount byte-untouched |
| `src/lib/vendor/leadSerializer.js` | MODIFIED — `FEED_SELECT_CENSUS` added and exported; nothing else moved |
| `scripts/b39_worklist_today_bench.js` | NEW — 64 cells, 30 mutations, zero holes |
| `scripts/floor-manifest-m-worklist-p3.txt` | NEW — this delivery's declared dirt |

`scripts/b36_leadgate_a_bench.js` is **byte-untouched** and re-run green. See §6.

---

## 2 · THE TWO STOPS THE READ-FIRST RAISED

**STOP-1 · the address was occupied.** The kickoff named `GET /api/v2/vendor/today`. That is a **live route**: `core.js` (symbol: the `/today` mount) points it at `src/api/vendor-engine/today.js`, and production's Storefront profile score reads it (`dreamos-pwa`, symbol `fetchToday`). Under A-1 that is paying vendors. Chair conviction **c-37.16**; ruled to **F-1 arm (b)** — the feed takes its own segment, `/worklist/today`, and the live reader is not touched. No fall-through experiment was run against a production mount.

**STOP-2 · §8.9's second clause was dropped, not repealed.** §11 rules the typed plane *and* the engine reader's retirement at the same seam; the kickoff carried only the first. Chair conviction **c-37.17**; retirement **DEFERRED** to a chartered cross-repo seam where the Storefront consumer repoints in the same motion. Recorded in `core.js` and in `worklistToday.js`'s header so the debt has an address in the tree, not only on a board.

---

## 3 · THE FROZEN PHASE 4 CONTRACT

**Phase 4 builds against THIS SECTION, never against the source.** Any change is a labelled contract amendment.

```
GET /api/v2/vendor/worklist/today
  Auth: Bearer (vendor JWT). The vendor is the token's; there is no :vendorId.
  200 →
  {
    "ok": true,
    "today": "YYYY-MM-DD",           // the IST calendar date the feed was cut for
    "has_any": true|false,           // FALSE only for no-data-ever
    "needs_attention": {             // KEY ORDER IS D-4's RANK ORDER
      "lead_unanswered":   [ { id, name, wedding_date, wedding_city,
                               budget_min, budget_max, state, created_at,
                               redacted } ],
      "invoice_due":       [ { id, invoice_number, client_name, amount_total,
                               amount_paid, amount_owed, due_date, state } ],
      "events_today":      [ { id, title, event_date, event_time, kind,
                               slot, state } ],
      "contract_unsigned": [ { id, title, state, sent_at, created_at } ],
      "team_tasks":        [ { id, title, due_date, priority, state,
                               created_at } ]
    },
    "done_today": {                  // EXACTLY THREE KEYS — see §8.7 below
      "invoice_paid":    [ { id, invoice_number, client_name, amount_total,
                             last_payment_at } ],
      "contract_signed": [ { id, title, signed_at } ],
      "team_task_done":  [ { id, title, completed_at } ]
    },
    "counts":    { <the five attention kinds> : integer },
    "truncated": { <the five attention kinds> : boolean }
  }
  500 → { ok:false, error:"Could not read today." }
```

**The eight properties Phase 4 may rely on:**

1. **`counts[k] === needs_attention[k].length`, always.** Derived, never authored independently. The badge and the feed read the same response (R-37.63 ①).
2. **`counts` covers the five attention kinds and nothing else.** Phase 4 sums them client-side for the masthead numeral (`app/w/today/page.tsx`, symbol `wl-mnum`). **No total ships** — the endpoint stays ignorant of presentation arithmetic.
3. **`truncated[k]` is the tell that the cap fired.** Cap is 20 per kind. A badge that is secretly a floor is the false-done class in miniature; when `truncated[k]` is true, `counts[k]` is a floor and the surface must say so or not imply otherwise.
4. **Key order in `needs_attention` IS D-4's ranking.** JSON preserves insertion order. Do not re-sort.
5. **Within a kind, ties break oldest-first** (D-4). Events order by time with **nulls first** — an all-day job leads the morning.
6. **`has_any` answers "has this vendor ever had anything", not "is today busy".** `false` → the FirstRun manual. `true` with empty lists → the resting state. Never show the manual on a quiet day. A failed probe returns `true`, deliberately.
7. **`redacted`** is present on lead rows only. `true` means the vendor cannot reach this bride; place the upsell where contact affordances would sit. **No contact field is ever on this wire, at any tier** — there is nothing to hide client-side because there is nothing there.
8. **`done_today` has three keys because only three kinds can prove "today."** Leads and events carry no completion timestamp. The response says so **by shape**; do not render a fourth bucket or a sentence explaining the absence.

**No `why` field.** The roadmap's Phase 3 line (`why` is a fixed template per kind, founder-vetoed once) is **superseded for this sitting** and joins the errata seam as a recorded delta. If `why` is wanted it is a Phase 4 contract amendment behind its own veto sheet. Zero authored bytes ship here: every human-readable string in the response is a column value.

**Money is integers.** `Rs X,XX,XXX` is Phase 4's, at the formatter's one canonical home (D-7).

---

## 4 · THE SOURCE MAP AS BUILT

Every column witnessed at `docs/db/PUBLIC_SCHEMA.md`; every state vocabulary from that table's own CHECK constraint.

| kind | table | filter |
|---|---|---|
| `lead_unanswered` | `public.leads` | `deleted_at IS NULL`, `state='new'`, oldest first |
| `invoice_due` | `public.invoices` | `deleted_at IS NULL`, `state IN ('unpaid','advance_paid')`, `due_date <= today`, oldest first |
| `events_today` | `public.events` | `deleted_at IS NULL`, `state='upcoming'`, `event_date = today(IST)` |
| `contract_unsigned` | `public.contracts` | `signed_at IS NULL`, `state='sent'`, oldest by `sent_at` — **no `deleted_at` filter, the column does not exist** |
| `team_tasks` | `public.team_tasks` | `deleted_at IS NULL`, `state IN ('open','in_progress')` |
| `invoice_paid` | `public.invoices` | `state='paid'` **AND** `last_payment_at` in today's IST window |
| `contract_signed` | `public.contracts` | `state='signed'`, `signed_at` in window |
| `team_task_done` | `public.team_tasks` | `deleted_at IS NULL`, `state='done'`, `completed_at` in window |

**Three ledger corrections, chair-granted, each proved by the row it must refuse:**

- **F-P3.1** — §6.2's `state <> 'paid'` returned **cancelled** invoices as money owed. Positive `IN` list instead. Cell 2.6.
- **F-P3.2** — §6.3's `NOT IN ('cancelled')` surfaced **drafts** as awaiting signature. `state='sent'` instead. Cell 2.7.
- **F-P3.3** — §6.4 returned a week; the kickoff's kind is a **day**. Cell 2.8.
- **F-P3.5** — `last_payment_at` is the last payment's clock, not a completion stamp. A deposit taken today is not done today; both halves required. Cell 3.3.

**The IST day is a half-open UTC window, not a cast.** `last_payment_at::date = CURRENT_DATE` is wrong twice: it casts in the server's zone, and a cast on the left cannot use an index. `[D-1T18:30Z, DT18:30Z)` is exact and sargable. Cells 3.4/3.5 prove both edges — a 02:00 IST completion whose UTC string reads *yesterday* is today, and a 23:00 IST completion yesterday is not.

---

## 5 · FINDINGS MINTED

| # | Finding | State |
|---|---|---|
| **FC-4** | The executor asserted "no repo access this seat" and authored two founder paste batches on it — a bare absence with no command behind it (the F6 class, applied to its own hands). Derived away: the clone succeeded, and `0ca7f08` + the head-guard are now witnessed at two independent seats. | OWNED, closed |
| **F-P3.1** | `WORKLIST_PARITY` §6.2's proposed SQL admits cancelled invoices as money owed. | CURED here |
| **F-P3.2** | §6.3's proposed SQL admits draft contracts as awaiting signature. | CURED here |
| **F-P3.3** | §6.4 is a week; the ruled kind is a day. | CURED here |
| **F-P3.4** | R-37.4's census guard was scoped by door COUNT. A third door on `public.leads` escaped the alarm entirely. `FEED_SELECT_CENSUS` added; b39 §5 diffs both the wire and the SELECT. | CURED here |
| **F-P3.5** | `done_today` for invoices needs `state='paid'` AND the window; `last_payment_at` alone files deposits as completions. | CURED here |
| **F-P3.6** | **R-37.63 ①'s text is unreadable in both trees.** `R-37.60`–`.73` appear nowhere in dream-os and only as code comments in `dreamos-pwa@worklist`, where R-37.63 is cited once for arm ④. The arm the kickoff makes load-bearing for `counts` has no text a clone can read — the disease §11 was filed to cure, one band later. | OPEN, chair's |
| **F-P3.7** | **`public.leads` has no state CHECK constraint.** The `{new, contacted, quoted, booked, lost}` vocabulary is a code convention at `leads.js` only. §8.4's Candidate A therefore rests on a database-unenforced string. Recorded, not cured — a constraint is DDL. | OPEN, priced |
| **F-P3.8** | **`istTodayISO` had five independent homes** plus three bare offset literals in a third unit. `istClock.js` founded as the destination; the five sites deliberately untouched (four are live paths). | CURED-PARTIAL; cleanup chartered |
| **F-P3.9** | **`resolveVendor.js` documents a route that has not existed since `f47c732`** — its usage note cites `GET /api/v2/vendor/today/:vendorId`. A header outliving its subject is F-09.50's class, in the middleware that four doors read. Untouched: a cure here is a chair ruling, not an executor's initiative. | OPEN, filed |
| **F-P3.10** | **§8.9's retirement clause dropped from the kickoff.** Owned by the chair as c-37.17; deferred to a cross-repo seam. | DEFERRED, named |

---

## 6 · THE BENCH, AND WHAT IT COST TO MAKE IT HONEST

`scripts/b39_worklist_today_bench.js` — **64 cells, 64 PASS, exit 0.** Runs bare, no database, no credential.

**Door cells EXECUTE.** The real express router on an ephemeral loopback port, driven over real HTTP, through the **real** `requireAuth` and `resolveVendor` — the fake carries `auth.getUser` so the auth chain is part of what is proved, not stubbed away.

**The fake is not allowed to flatter the code.** b38's fake no-ops `order`, `limit`, `in`, `gte`, `lte` — correct there, fatal here, because this door's correctness *is* its filters and its ordering. This fake implements them, models NULLS ordering, and **refuses unknown columns the way postgres would** (`TABLE_COLUMNS`, witnessed per section from `PUBLIC_SCHEMA`).

**Non-vacuity: 30 mutations of PRODUCTION source, zero holes, zero throws.** Every mutation reds its named cells and the tree restores clean. Six holes were found and cured rather than argued away:

| hole | what it exposed |
|---|---|
| **the 404** | The first cut declared `router.get('/')` under a `/worklist` mount, so nothing existed at `/worklist/today`. `node --check` passed it, and **five negative cells passed it too** — an absence proves nothing unless the door was open. Every absence cell now asserts HTTP 200 alongside the empty list. |
| **M13** | Adding `phone` to the SELECT reddened nothing: the mapper enumerates keys by hand, so the column was **fetched, held, and dropped one line before the response**. Clean wire, quiet guard, contact data in memory. Cell 5.10 now diffs the SELECT itself. |
| **M21** | The `has_any` probe's fail-posture was unreachable — no fixture could make a probe fail. Flipping it to `false` would have shown a **working vendor the first-run manual** off a hiccup. `failCountOn` added; cell 4.14. |
| **M25** | `nullsFirst` on events was asserted only where it could not fail — no fixture had a null `event_time`. Cell 4.5b. |
| **M26** | The probe's soft-delete filter was unguarded: deleted rows would have counted as evidence the vendor has data. Cell 4.13b. |
| **M28** | The §9.7 trap. A `deleted_at` filter on `public.contracts` passed silently because the fixture had no such key — **a fake kinder than the database turns every column into an assumption the bench agrees with.** Now it throws, as postgres would. Cell 7.10. |
| **M29** | `'owed'` folded into the task states — §8.5's REFUSED arm arriving by the back door — reddened nothing, because no fixture carried a state the table cannot hold. Cells 7.8/7.9 pin both vocabularies to their CHECK constraints. |

**Two cells were wrong and are recorded rather than quietly corrected.** 4.5 asserted the *newest* lead first and reddened against a correct door — D-4's tie rule is oldest-first and the bench had it backwards; its fixture is now seeded newest-first so the sort must actually run. 5.7 used `'Essential '` as a "drifted spelling", which `resolveTier` trims and lowercases straight back to canon — derived by *running* the exported function, not by reasoning about it. An instrument that was wrong once is why this estate reads evidence and not sentences.

**A broken door must fail cells, not kill the run.** M28 produced a correct 500 and the bench then threw on the first missing key, so the verdict was right and **the red set was never printed**. The response is normalised to the kind level and every index guarded; M28 now names 43 cells.

**Sealed benches:** `b36_leadgate_a_bench.js` is **byte-untouched** and re-run **green**. The ruling granted the sixth census constant in this ZIP; the constant lives in the serializer's census block (its one home, beside the other five) and the **guard cell lives in b39**, so no sealed bench's count moves. Disclosed as a deviation from the most literal reading of "reds the guard at all three doors" — the alarm exists and executes; it rings in the new bench rather than the sealed one. Chair's to correct.

**Gates:** `node --check` clean on all five touched files · engine typecheck exit 0 · **floor sibling-full in declared-dirt mode = NAMED BASE, no delta** (20 reds, byte-identical; declared files unmoved, set and contents both verified).

---

## 7 · WHAT PHASE 4 INHERITS

- The frozen contract at §3. Build against that document.
- `kind → room` is Phase 4's one-liner in the repo that owns `lib/worklist/rooms.ts`: `lead_unanswered→leads · invoice_due→invoices · events_today→events · contract_unsigned→contracts · team_tasks→team`. The endpoint does not know the room registry and must not learn it.
- The masthead numeral is the client-side sum of `counts`' five values.
- Verbs are **not** in this contract. Every verb calls the room's own existing write endpoint (D-3, sole-writer law). Phase 4's trace bench is §5 of the parity ledger.
- `snooze` is **not** built. The roadmap's Phase 3 names a `vendor_snoozes` migration; this sitting shipped zero DDL by charter. Unbuilt and named, never silently dropped.

## 8 · THE FOUNDER'S SHELF AFTER THIS SITTING

The six §9.4 fixture SELECTs and the curl walk card (his pasted rows first, expected values authored from them) · F-P3.6's ruling text into the register · F-P3.7 (a CHECK on `leads.state`, priced) · F-P3.9's cure word · the §8.9 cross-repo retirement seam · the `istTodayISO` five-site cleanup · the `why`-per-kind question, if ever.

**Sequencing beyond this sitting is the founder's.**
