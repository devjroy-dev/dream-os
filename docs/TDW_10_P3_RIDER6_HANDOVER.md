# TDW_10 · ADMIN P3 · RIDER 6 — F-10.61, THE WORD THE DATABASE NEVER KNEW

**Base:** dream-os `0c08dfe` + riders 4/5 · dreamos-pwa `8a1fee1` + riders 4/5
**Founder ruling:** option (b) — zero DDL, the stored value returns to the schema's word
**Role:** LE. Nothing pushed. Two ZIPs.

---

## 1 · THE DEFECT, AND IT IS MINE

Rider 5's Makers toggle wrote `discover_request_state: 'hidden'`. It **500'd on the founder's thumb**, twice, on production.

```sql
-- db/migrations/0039_vendor_discover.sql:39-41
add column if not exists discover_request_state text
  check (discover_request_state in
    ('not_requested','requested','under_review','approved','denied','revoked')),
```

**A CHECK constraint, six values, since 0039. `'hidden'` is not one of them.** Postgres rejected the update, `setDiscoverState` returned `{ok:false}`, the route answered 500.

I minted an enum value without checking whether the column had a domain. The SQL-provenance law says every column is named with its witness before it is authored — I applied that to column **names** all evening and never once to a column's **allowed values**.

It also explains the shape of the walk exactly: `Add to Discover` worked (`'approved'` is permitted), `Hide from Discover` did not.

## 2 · THE FOUNDER'S QUESTION WAS THE FIX

> 「 why are we not using the same endpoint or whatever we were using during remove from discover? 」

**We were.** `PATCH /api/v2/admin/vendors/:id/discover-eligible` never moved — same door, same button. What moved was the **word stored in the column**, and the rename needed exactly zero backend behaviour change. He asked for a label; I changed data to match a label and broke it.

That question reached option (b) faster and more cleanly than my own two-arm fork did, and it is recorded as his catch.

## 3 · WHAT SHIPPED

**dream-os**

| File | What |
|---|---|
| `src/lib/vendor/discover.js` | `'hidden'` removed from `DISCOVER_STATES`; the set is 0039's six again, with the reasoning at the site |
| `src/api/admin/vendors.js` | the toggle stores `'revoked'` |
| `src/api/admin/discover.js` | the hide door stores `'revoked'` |
| `scripts/b10_p3_mint_deck_bench.js` | 147 cells (+2), **M15** |

**dreamos-pwa**

| File | What |
|---|---|
| `app/admin/makers/page.tsx` | the optimistic row mirrors the stored word |
| `app/vendor/discover/page.tsx` | the branch reads `'revoked'` first, `'hidden'` still accepted |
| `scripts/tdw10_p3_deck.proof.mjs` | 193 cells (+1) |

**Every rendered byte you ruled is unchanged.** Button **Hide from Discover** · vendor screen **Hidden** — *Your profile is hidden from couples right now. You can apply again whenever you're ready.* · admin chip **● HIDDEN** · **Re-apply** in place. Only the column changed, back to what it always said.

## 4 · THE CELL THAT WOULD HAVE CAUGHT IT NOW EXISTS

It reads the **constraint itself**, not a copy of its values:

```js
const chk = mig.match(/check \(discover_request_state in\s*\n?\s*\(([^)]*)\)\)/);
const allowed = chk[1].split(',').map(x => x.trim().replace(/'/g, ''));
ok('EVERY state the code can write is permitted by the database', …);
ok('…and the two sets are the SAME SIZE', …);
```

Three cells: the constraint is readable at all (so the check cannot pass on an empty parse), every code state is permitted, and **the sets are the same size** — because a value the database allows and the code never writes is a gap, not a safety margin. **M15** puts `'hidden'` back and watches it redden.

This is the cell class the estate keeps having to re-learn: an instrument that reads the authority, never a transcription of it. Same lesson as CITATION-NEEDS-A-CELL, one plane down.

## 5 · THE COST OF (b), NAMED RATHER THAN BURIED

**The stored word and the rendered word now disagree** — `'revoked'` in the column, *Hidden* on every screen. That is a small version of the disease F-10.59 cured, accepted deliberately and temporarily, and it is written into `DISCOVER_STATES`' own paragraph so the next reader meets the reason before the discrepancy.

**Carried to 0113's sitting:** widen the constraint to `'hidden'` so the column can say what the product says. It rides beside `admin_audit` and F-10.44's decision column rather than running alone to repair a word chosen badly at 1am. **The screens need no edit when it lands** — both branches already accept either word, deliberately.

## 6 · PROOF

- `b10_p3_mint_deck_bench` **147/147** cured · **123/147** uncured — 24 cure cells RED
- `tdw10_p3_deck` **193/193** cured
- dream-os floor: `b10_p2_bridge 82/82` · `b10_p1_search 45/45` · `tdw09_micro 23/23` · engine build 0
- pwa floor: `p1_shell 53/53` · `p2_retint 76/76` · `roles 130/130` · tsc 0

## 7 · THE SMOKE — the one button that 500'd

1. Admin → **Makers** → Swati (currently `● DISCOVER`) → **Hide from Discover**.
2. Toast *Hidden from Discover.* — **no 500 in the console**, chip flips to `● HIDDEN`.
3. Vendor app as `+918595356978` → **Hidden**, with **Re-apply**.
4. **Add to Discover** puts her back: chip `● DISCOVER`, her screen **Approved**.

§2 of rider 5's handover still owes its one-line `status='active'` repair for her morning briefing, if it has not been run.

## 8 · CARRY-FORWARD

F-10.49 · F-10.48 · F-10.44 → 0113 · **the `'hidden'` constraint widening → 0113** · the underived DELETE-404 · the in-card `VendorProfileView` rider · acceptance ② parked · F-10.52's vocabulary build on the list-by-list veto.

**F-10.61 proposed** — a state value written without checking the column's domain; caught by the founder's thumb on production, and by his question rather than my fork. Next free **F-10.62**.

*Sequencing beyond this sitting is the founder's.*
