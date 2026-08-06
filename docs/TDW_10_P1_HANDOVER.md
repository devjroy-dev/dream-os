# TDW_10 · ADMIN P1 — THE PALETTE'S BACK END · EXECUTOR HANDOVER (dream-os)

**Base:** dream-os `218ed59` · paired with dreamos-pwa `f9b0600`
**Rulings:** CE relay #1 — R-A5 (N parallel queries, not a UNION) · R-A6 (0113 re-home) · R-A7 (global recents row)
**Role:** LE. Nothing pushed. The full phase narrative, mapping table, disclosures and founder smoke card live in the pwa ZIP's `docs/TDW_10_P1_HANDOVER.md`.

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `src/api/admin/search.js` | NEW | `GET /admin/search` · `GET|POST /admin/search/recents` |
| `src/api/router.js` | +4 lines | The mount, placed above the broad `/admin` content mount |
| `docs/specs/TDW_10_ADMIN_FINAL.md` | 1 row edited | R-A6's re-home, chair-authored bytes applied verbatim |
| `scripts/b10_p1_search_bench.js` | NEW | 45 cells incl. a 7-mutation section |

**Zero migrations. Zero SQL. `requireAdmin.js` byte-untouched** — pinned by content hash `dd9705685bba3875` and proven able to redden.

---

## 2 · THE PROOF

- `b10_p1_search_bench.js` **45/45** cured · **17/45** at pristine `218ed59` — 28 cure cells RED.
- The bench loads the search module **defensively**: at an uncured tree a missing module is a red, not a stack trace. A both-ways floor nobody can read is not a floor.
- `npm run build` (engine tsc) **exit 0**. `node --check` clean on `src/api/admin/search.js` and `src/api/router.js`.
- Floor: `tdw09_micro 23/23`. The four known-reds reproduce **exactly** as attributed and no fifth appeared — meter `28/29` (F-06.41) · f0555 `22/23` (F-07.11) · f0772 `158/159` (§12.14) · p4b_body `75/76` (§5.26).
- Delta vs origin: the four files above and nothing else.

**The guard is driven, not grepped.** §2 calls the real `requireAdmin` and reads real status codes — 401 bare, 403 forged bearer, 403 fail-closed with no secret — and then walks the router's own stack to prove **every** declared route carries the middleware in its handler chain. A grep for the word proves an import; it never proves a guard.

---

## 3 · WHY NOT ONE UNION QUERY (R-A5, and the evidence behind it)

`package.json` carries `@supabase/supabase-js` and no other SQL-speaking dependency — **no `pg`, no `knex`**. PostgREST cannot express a cross-table UNION. The only route to a literal UNION is a Postgres function, which is DDL, which P1 does not have. The chair ruled the UNION sentence a **shape, not a promise**: one client round trip, five grouped sources, twenty results. That is what shipped, and §3 of the bench asserts the no-DDL claim mechanically rather than trusting the paragraph.

Eight PostgREST queries in two waves. Wave 2 exists for a reason worth stating: **`vendors` and `couples` carry no name and no phone of their own** — both live on `users` via `user_id` — so a name-or-phone search costs a users lookup first. There is no shortcut here that would have been simpler.

**The term is STRIPPED, not escaped.** PostgREST's `or=` filter is a comma-and-dot mini-language and ILIKE has its own wildcards, so `,` `(` `)` `.` `%` `_` can either break the parse or silently widen the match — both invisible to the caller. Stripping over-narrows in the worst case; escaping, done wrong, over-*matches*, and a palette that quietly returns the wrong rows is worse than one that returns none. Driven in §4 against six hostile inputs including `nam.ilike.*x*` and `or(id.eq.1)`.

**A dead source degrades by NAME.** `degraded: ['leads']` travels to the client and the palette says so. An empty group and a broken group must never look the same.

---

## 4 · SQL PROVENANCE

Every column witnessed at `docs/db/PUBLIC_SCHEMA.md`, dream-os `218ed59`, read before authoring — the full list is in the module's own header block: `users`(9) · `vendors`(38) · `couples`(21) · `prospects`(14) · `demo_vendors`(14) · `leads`(27) · `admin_config`(4, PK `key`). Nothing was recalled from memory.

`admin_config.value` is **TEXT**, so the recents list travels as a JSON string — which is precisely why R-A7's arm needs no DDL.

---

## 5 · THE n=1 ASSUMPTION, WRITTEN DOWN WITH ITS BREAKING POINT (R-A7)

The spec says recents are "per admin user." **There is no admin user.** `src/lib/adminSession.js` mints `nonce.expiry.hmac` with `subject: []` — empty *by construction*, because F-07.82's cure was that a token which cannot carry the secret cannot leak it, and the same shape carries no identity either. `verifyAdminSession` returns a bare boolean. `requireAdmin` is byte-untouched by charter, so widening it was never on the table.

One global row, capped at 12, last-write-wins. **At n=2**: nothing errors and nothing is lost; two operators share one history and see each other's jumps interleaved. No data crosses that both could not already read. **The fix, when needed**, is an identity on the session token — a security decision, not a palette one. The module's comment names the wrong fix explicitly (hashing the bearer: it rotates every seven days, so the history would silently reset and look like a bug).

The recents POST **refuses any path that does not start with `/admin`**. A recents list that can be taught an arbitrary URL is an open redirect wearing a convenience's clothes; the mutation section removes that guard and watches the cell redden.

---

## 6 · R-A6 APPLIED, AND ONE THING I DID NOT DO

The spec's §2 row now reads `0113 / 0113_admin_control.sql` with the ruled parenthetical. The chair's bytes were applied **verbatim**.

**The §2 HEADING one line above still reads "ladder after 09 = next 0085."** It now contradicts the corrected row. I did not touch it: the chair quoted the row edit "so zero drift," and widening a quoted edit is the unruled-arm shape. It is a one-line chair edit whenever you want it. Flagged, not fixed.

Ladder state re-derived at my own tip: 96 entries, numeric top `0112_couple_route_and_flag.sql`, `0085` still `0085_prospect_lane.sql`, `0113` unoccupied, the `0088–0095` and `0097–0098` gaps untouched as ruled.

---

## 7 · DISCLOSURE

**One bench cell of mine was a tautology.** The `requireAdmin` hash check compared `sha(file)` against an expression that recomputed `sha(file)` — it would have passed over a rewritten guard. A green that cannot go red is worse than a declared gap. Pinned to the literal, given a mutation cell that adds one character and watches it fail. Self-caught before delivery; recorded here rather than quietly repaired.

---

## 8 · DEPLOY NOTE (no dashboard steps)

No new environment variable. No migration. The route rides the existing vendor/admin Railway service and the existing `ADMIN_SESSION_SECRET`. Push order between the two repos is the founder's — the pwa palette degrades to static section navigation if the endpoint is not yet live, by design, so **either order is safe**.

*Sequencing beyond this sitting is the founder's.*
