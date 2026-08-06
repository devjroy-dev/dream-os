# TDW_10 · ADMIN P2 — THE BRIDGE · EXECUTOR HANDOVER

**Base:** dream-os `db0b780` (CE-199 band verified at origin tip) · paired with dreamos-pwa `0fb81af`
**Rulings:** CE-200 relay #1 — Fork 1 ruled whole (zero DDL in P2; the honest headline + the one real ledger); four acceptance numbers ratified; five mints entered (F-10.21–.25)
**Role:** LE. Nothing pushed. Two ZIPs, own guards, founder-sequenced.

---

## 1 · WHAT SHIPPED

**dream-os**

| File | State | What |
|---|---|---|
| `src/api/admin/bridge.js` | NEW | `GET /api/v2/admin/bridge` — one server-assembled aggregation |
| `src/api/router.js` | +4 lines | The mount, above the broad `/admin` content mount |
| `scripts/b10_p2_bridge_bench.js` | NEW | 82 cells incl. an 11-mutation section |

**dreamos-pwa**

| File | State | What |
|---|---|---|
| `lib/admin-api/bridge.ts` | NEW | The typed client + the drill map |
| `app/admin/_components/Bridge.tsx` | NEW | The masthead, funnels, queue |
| `app/admin/page.tsx` | REPLACED | The four-tile fan-out retired; the Bridge mounted |
| `scripts/tdw10_p2_bridge.proof.mjs` | NEW | 44 cells incl. a 7-mutation section |

**Zero migrations. Zero SQL. Zero DDL.** The ladder is asserted UNMOVED at `0112` by a cell that reads the directory, not by a sentence. `requireAdmin.js` byte-untouched.

---

## 2 · THE PROOF

- `b10_p2_bridge_bench` **82/82** cured · **14/82** at the uncured tree — **68 cure cells RED**.
- `tdw10_p2_bridge.proof` **44/44** cured · **11/44** uncured — **33 cure cells RED**.
- Both benches load their subject **defensively**: at an uncured tree a missing module yields reds, one per cell, not a stack trace. The cure's size must be a number.
- `npm run build` (engine tsc) exit 0 · `node --check` clean on both changed backend files · pwa `tsc --noEmit` exit 0 on a cleared cache.
- **dream-os floor:** `tdw09_micro` 23/23 · `b10_p1_search` 45/45. The four known-reds reproduce **exactly** as attributed and no fifth appeared — meter `28/29` (F-06.41) · f0555 `22/23` (F-07.11) · f0772 `158/159` (§12.14) · p4b_body `75/76` (§5.26).
- **pwa floor:** twelve of thirteen green, `tdw10_p1_shell` **53/53 unmoved**. The thirteenth is §7 below.

**The guard is driven, not grepped.** §1 walks the router's own stack, asserts the handler in the chain **is the estate's real `requireAdmin` by object identity**, and drives a bare request to a 401 with no payload behind it. The bench's own bearer is minted by `src/lib/adminSession.js`'s real mint — a bench that forges its own credential proves the guard accepts the bench, not that it accepts a session.

---

## 3 · THE MONEY LINE, AS RULED

`today.revenue` carries the labelled honest state — its `label`, its `why` (naming the Razorpay stub, not a vague absence), its **owner** (`Block 09 P4`), and `finding: 'F-10.1'`. Beneath it, `featured_fees` sums `fee_inr where paid_at is not null` over `vendor_featured_submissions`, rendered through `formatRs` — Rs X,XX,XXX, no glyph, no shorthand.

Against the fixtures: **Rs 2,50,000** today, **Rs 3,25,000** lifetime, with an unpaid Rs 9,99,999 submission excluded — a fee with no payment stamp is an invoice nobody paid.

**The invoices-family exclusion is mechanical.** §5 records every table the endpoint touches and reddens if `invoices`, `payment_schedules`, `couple_receipts`, `team_payments`, `expenses` or `tds_ledger` appears. M10 adds an invoices read and watches the cell fire. The reason is written into the module's own header where the next hand looking for a money column will read it before reaching for one.

---

## 4 · SQL PROVENANCE, AND WHERE THE SNAPSHOT COULD NOT BE TRUSTED

Every column witnessed at `docs/db/PUBLIC_SCHEMA.md` + `ENGINE_SCHEMA.md`, dream-os `db0b780`; the full list is in the module's header.

**`demo_vendors.state`, `.invited_at`, `.claimed_at` and `.removed_at` are NOT in the snapshot.** Its header pins it at applied tip `0099`, dated 2026-07-23; the ladder here is `0112`. Those four arrived in `0106_demo_lifecycle.sql:47-58`, and that migration is their witness. Named in the module rather than reached for silently — the provenance law is satisfied by *a* witness, and taking the stale one quietly is F-04.29's disease.

I closed the whole stale window by command rather than by hope: `0100`–`0112` create exactly one table (`vendor_ig_connections`), which is not money-shaped and not read here.

---

## 5 · §0.2 — FIVE MORE DEPENDENCY FICTIONS, SAME CLASS AS F-10.1

Each applies the CE-200 doctrine rather than inventing an arm. Each ships a labelled honest state naming its owner; none renders a number or a dash, because both of those say "this is coming in a moment".

- **F-10.26 — `credit/system state (05's flag)` does not exist.** No `admin_config` key, no writer, no banner component in either repo. The phrase appears only inside `TDW_10_ADMIN_FINAL`. Unhomed: it needs a charter before it can have a number.
- **F-10.27 — there is no trial clock.** `vendors` carries `tier` but no trial start or end column, and no `TRIAL_DAYS` constant exists in `src/`. "Expiring in 3d" cannot be derived without inventing a trial length. The *count* of `tier='trial'` is real and ships beside it.
- **F-10.28 — "templates awaiting Twilio verdict" is stale transport.** P-06.T settled Meta Cloud API direct, and `templates.js`'s own first paragraph drops `twilioTemplateSid` as stale. The queue line reads Meta; five drafts at this tip, read from the in-code registry.
- **F-10.29 — "subscriptions halted" has no table.** `subscription` appears zero times in `src/`.
- **F-10.30 — `engine.usage` is a second cost meter with no surface dimension.** It keys on `agent_id`, not a conversation kind, so harvest and Donna spend is real INR the by-surface split cannot see. Named in the payload and on the screen rather than distributed across surfaces by a guess.

---

## 6 · THREE DEFECTS OF MY OWN, CAUGHT BY THE BENCH

**(a) The endpoint read the wall clock.** Every day-scoped figure was a function of `new Date()`, so `oldest_hours` returned 77 against a fixture built for 72 — and §2/§3 were green only because today's real date happened to agree. A cell that silently changes meaning with the calendar is the vacuous-green class. Cured with `app.locals.clock`, defaulting to the wall clock, with cells asserting **both** halves including that nothing in `src/index.js` assigns it.

**(b) M3 was aimed at a redundant clause and would not redden.** On the *today* query `.gte('paid_at', day.start)` already excludes a null stamp; `.not('paid_at','is',null)` is load-bearing only on the **lifetime** query, which has no date filter. Re-aimed there with the reason written into the cell. A mutation pointed at a redundant clause proves nothing, and finding that out was worth more than the green.

**(c) A `.sql` grep cell fired on prose** — it reddened on a *string* naming `0084_billing.sql` in the honest-state payload. It was measuring documentation. Replaced with two independent cells: no `.rpc`/`create`/`alter` in code, and the ladder read off disk and asserted at 0112.

---

## 7 · §0.2 — A FIFTH FLOOR RED, AND IT IS NOT MINE ALONE. RATIFY-OR-REVERT.

`scripts/tdw07_f0790_dashboard.proof.mjs` pins the four-tile dashboard this phase retires.

**Derived at the pristine tree, before a byte of mine: 28 passed, 9 failed.** It was **already red** and was not in the kickoff's attributed list. The nine are `§2.unused_invites.*` (3), `§2.new_requests.*` (3), `§1.3`, `§1.5`, and `§4.5 the six frozen tile labels are unchanged` — i.e. **P1's invite-room deletion (W-8) reddened this bench and it was not declared.** This is F-08.50's shape recurring: a floor reported clean that was not.

**At my tree it reads 9 passed, 28 failed** — the additional nineteen are mine, and they are the cells pinning the four-arm client fan-out that P2 exists to end.

**I did not touch the sealed bench.** Re-aiming twenty-eight cells at a screen that deliberately no longer has their subject would be inventing, and rewriting a sealed instrument unilaterally is the unruled-arm shape.

**Proposed disposition, one recommendation, chair to rule:** the bench's §1/§2 retire **with their subject**, and the LAW they protect — F-07.90's never-a-false-zero — is re-asserted in its new home at `tdw10_p2_bridge.proof §3`, where three cells already assert the dash-not-zero distinction, the "Could not load" label, and the third rendering the old page had no need for, all mutation-proven (M2). The retired anchors should be recorded verbatim in whatever ZIP performs the retirement. **F-10.31 proposed** for the undeclared nine.

---

## 8 · WHAT I DID NOT BUILD, NAMED SO THE ABSENCE READS AS A DECISION

- **Three figures have no owning screen** — featured fees, failed turns, the template registry. `/admin/featured` is a phantom; the other two have no surface at all until P4. Each renders its reason instead of a tap. A link that 404s is a dead number wearing a link's clothes, which is worse than an honest one. Every non-null drill target is asserted to be a **LIVE** disposition in `ROUTE_MAP`, mutation-proven at M6.
- **No `?focus=` deep-link into a row.** D-6 is P3's wiring and stays there; queue rows land on the list, as P1's palette does.
- **No audit row on this endpoint.** A-5's audit middleware is P6's, and `admin_audit` needs `0113`, which is reserved and unwritten. A GET mutates nothing.

---

## 9 · DEPLOY NOTE

No new environment variable. No migration. No dashboard step. The route rides the existing vendor/admin Railway service and the existing `ADMIN_SESSION_SECRET`.

**Push order is the founder's, and either order is safe:** the pwa Bridge degrades to a named error card with a retry if the endpoint is not yet live — it never renders a grid of zeros.

*Sequencing beyond this sitting is the founder's.*
