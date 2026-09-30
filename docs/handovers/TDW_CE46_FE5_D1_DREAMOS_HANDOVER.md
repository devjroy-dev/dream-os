# TDW · CE-46 · FE-5 · DESIGN-1 landing, the dream-os half · handover

Base 0d3bbc5 (main, ELZ-4 layer B). Ruled 30 September 2026: the dream-os half lands first, before the pwa half, with
the master OFF and nobody on the per-vendor list. Built from Claude Code's `design/landing` (e41f88e: the layout switch
539d082, the search door 76a3b81, the master and its 30 days d0fe005, the one-tap Book's server half 9d3308e), merged
onto 0d3bbc5 without conflict, plus the chair's F3 ruling (one home for the per-vendor switch) and one re-pin.

## What changes for a vendor today
Nothing. With flag.vendor_layout_v2 off and no vendor carrying layout_v2, GET /me answers `layout: 'classic'` for every
vendor, and today's pwa does not read the field. The new doors have no caller in today's pwa:
- GET /api/v2/vendor/search?q= (read only, scoped to her): the new layout's search row.
- POST /api/v2/vendor/leads/unbook (Undo and Cancel booking, dry run first): the new layout's client and enquiry pages.
- POST /leads/:id/promote accepts three more keys (functions, amount, advance_amount). Today's pwa sends none of them, and
  the promotion without them behaves as before (b83 and d1_booking; the differential below).

## The switch, one home (CE-46 F3)
- `db/migrations/0185_vendor_layout_flag.sql` (WRITTEN, NOT APPLIED; amended before it was ever applied or on main, so
  not renumbered): the two switchboard rows, both off (on conflict do nothing), and
  `vendors.layout_v2 boolean not null default false`. Verify SELECTs and a commented revert in the file. Rehearsed in
  PGlite: applied twice over a pre-flipped row, the row untouched, the column boolean/NO/false, nobody on.
- `src/lib/vendorLayout.js`: layoutFor(vendor) takes her whole row (resolveVendor selects '*'); the master wins; only a
  real `true` on her row counts; listVendors and setVendor are the list's one reader and writer. The Railway variable
  LAYOUT_V2_VENDOR_IDS of the first cut is retired and read nowhere; the home reads no environment.
- `src/api/admin/capabilities.js`: GET /layout (the master, its date, the listed vendors by name and phone);
  POST /layout/master; POST /layout/vendor {vendor_id, on}. All behind requireAdmin, before the /:key routes.
- `src/api/vendor/me.js`: `layout: layoutFor(vendor)`. Her own PATCH cannot set layout_v2 (the allowlist).

## Rungs (in the seat's container, both keys unset)
b0185 27/0 with --mutate (M1 default v2, M2 the row read truthy, M3 the id guard dropped, M4 the variable read again);
d1_layout_master 16/16 (four mutations); d1_search 22/22; d1_booking 19/19. Both ways against the landing's own code:
b0185 red on 1.3, 1.4, 2.3, 3.1, 3.2, 3.5 and d1_layout_master on 1.1, 1.3, 3.4.
b85 §3.1 and §3.4 RE-PINNED BY LABEL: the landing's promote route declares three more keys and the unbook route is a
third that filters unknown keys with the same refusal; each claim held, the literal moved. b85's reds are then
identical to the base's (M7, main's).

## The differential (44 benches reading any of the 14 paths, derived by grep; base 0d3bbc5 clean, cut, both keys unset)
Exit codes and outputs identical but for: the new benches (absent at base); b85 (above); b73 (the base worktree had no
sibling dreamos-pwa, an environment REFUSED, green in the cut). Reds present in BOTH, main's, none reading the switch:
b07_p4b, b43, b46, b48, b51, b59_g34, b59_mutations, b61_mutations, b63, b68, b83, b84, b88, b90, b92, b95.
Note: the landing handover said every bench reading a changed file matched main; b85's two cells did not. Found by the
cell-level diff, not by exit codes (b85 was red at base for M7).

## After the floor: 0185 in the Supabase SQL editor, then its three verify SELECTs. The master stays off; the list stays
empty until the pwa half lands and the founder adds DEV440 on the Switchboard's Vendor layout card.
