# repo: dream-os @ 22ea0b01117ee6c0b51e814e1fce0e838afa5d73
# TDW · CE-43 · SEAT LC-2r · PACKET 3e · HANDOVER (the dream-os half) · 2026-09-17

Cut on dream-os `22ea0b01117ee6c0b51e814e1fce0e838afa5d73` (the chair's docs commit: roadmap Amendment 3 and `docs/specs/TDW_CE43_VENDOR_PROVISIONS.md`), re-derived at origin at the moment of cutting.

- **What 22ea0b0 changed.** Checked by `git diff --stat 83f0bb9 22ea0b0`: those two docs only, and no file this packet touches.
- **Scope.** No migration. The rung is unchanged (3e rides b83), and no new finding is filed.
- **Status.** Provisional under C-43.17 until the founder's floor on the applied tree is pasted.
- **Next.** The pwa half (F-43.100, F-43.101, F-43.102, and point 5's pwa cell) cuts after this is at origin.

## §1 · The ruling built (CE-43, card P3 closed; packet 3e)

**Point 5 (a).** Each client binder that `GET /api/v2/vendor/cabinet/:vendorId` returns now carries `booked_lead: boolean`.

- **True** when a booked lead stands behind the binder. The set is the one the read already holds for F13(a) (`src/lib/vendor/bookedLeads.js`); no query is added.
- **False** on a client that is one only by the legacy six-word set.
- **Only client binders** carry it. `binder_id` itself stays off every wire (F-43.73); only this boolean leaves.
- **The PWA's use:** it hides the binder card's "No story yet" line on this flag (pwa half, b82 cell).

| File | What |
|---|---|
| `src/api/vendor-engine/cabinet.js` | The `clients` slice maps `booked_lead` from `bookedLeads.ids`. |
| `scripts/b83_lc2_p3_promotion_bench.js` | AMENDED BY LABEL: §2.6 (the flag, true and false), §2.7 (only on clients; no `binder_id` on the wire), M31. |
| `scripts/verify-lc2-p3e.sh` | The founder's one verify command. |
| `scripts/floor-manifest-lc2-p3e.txt` | The declared dirt. |

## §2 · What is proven

- **b83 on the cured tree:** 130/130.
- **Both ways.** On a clean worktree at `22ea0b0` (its engine built, the amended bench copied in): 128 passed and 2 failed, exactly §2.6 and M31. §2.7 is a true fact at base.
- **Readers of the cabinet read.** Base and cured are identical by exit code and failing-line count, across 9 benches: b06_m0, b06_m4d, b36, b40, b41, b48, bOB_taxonomy, tdw09_micro and tdw10_tier.
- **Syntax.** `node --check` is clean.
- **Not run in the seat's container, declared before the cut:**
  - the full floor;
  - the real database;
  - the environment-refused benches (`b06_gauntlet`, `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape`).

  The founder's provisional floor is their witness.

## §3 · Notes for packet 5

As the chair ruled: packet 5's handover carries roadmap **Amendment 4** (the master amendment for R-43.11 and the backfill), not Amendment 3. Amendment 3 is the founder's order after LC-4 and is landed at `22ea0b0`.

Sequencing beyond this sitting is the founder's.
