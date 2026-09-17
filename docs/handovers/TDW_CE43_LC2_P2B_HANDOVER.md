# repo: dream-os @ 5156958ed891f403747287c285ec5269c3335db5
# TDW · CE-43 · SEAT LC-2 · P2b · HANDOVER (the dream-os half) · 2026-09-17

Cut on dream-os `5156958ed891f403747287c285ec5269c3335db5` (packet 2), re-derived at origin at the moment of cutting. No migration. Ordered by the chair's P2b ruling: cut before packet 3, so the promotion act does not carry a validator bug or a restyle with it. The pwa half follows on its own tip.

## §1 · What shipped

| File | What |
|---|---|
| `src/api/vendor/packages.js` | **F-43.78, the seat's defect, cured on the door.** `validatePackage(merged, fallbackMiddle = 30)`: with the middle payment OFF, an absent or invalid middle share is never a refusal and is replaced by the fallback (the stored share on an edit, 30 on a new package), because 0168's CHECK still needs a stored share between 1 and 98. With the middle payment ON, it is checked as before. PATCH passes `cur.middle_pct`. The attach door's call is unchanged (a package row's share is always valid). |
| `scripts/b82_lc2_p2_packages_bench.js` | §2.9 and §3.6b (the pure validator and the real PATCH handler), M15 (the fallback removed), M9 re-aimed at the new call line. |
| `scripts/floor-manifest-lc2-p2b.txt` | The declared dirt. |

## §2 · The defect, as found on the P2 walk

The founder switched "Take a middle payment" off on a package and cleared or zeroed the share. The door answered 422 `invalid` `middle_pct` three times (Railway: `PATCH /api/v2/vendor/packages/dc203ea0-…` 422), and the sheet said "Check the highlighted field." for a field that did not apply. He saved once the share held a number again; the rows witness `middle_enabled` false with `middle_pct` 30 on two packages. The seat's packet 2 bench tested the remainder with the switch off but never an invalid share with the switch off.

## §3 · What is proven

- **b82: 67/67 on the cured tree.**
- **Both ways:** the new bench against the packet 2 door (`5156958`, a clean worktree): 63 passed, 4 failed — exactly §2.9 and §3.6b (the defect), and M9 and M15, whose target lines exist only in the cured file.
- **Readers of `packages.js`, base and cured identical by exit code:** b81_lc2_p1_seed, b43_solutions_doors, b48_engine_mounts, b07_p1.
- **Not run in the seat's container, declared:** the full floor, the real database, the four environment-refused benches. The founder's provisional floor is their witness.

## §4 · The packet 2 veto record (carried as the chair ordered)

- **The eight failure bytes, vetoed YES on 2026-09-17** by the chair under C-43.16 and the founder's "go with your lean": "Could not save the package." · "Could not delete the package." · "Could not set the default." · "Another change landed first. Try again." · "Could not attach the package." · "Give the package a name to save it." · "Leave part of the fee for the remainder." · "Check the highlighted field." The packet 2 pwa handover, cut before the ruling, lists them as PENDING; this record supersedes that label.
- **F-43.77, filed to LC-3's copy pass:** "Leave part of the fee for the remainder." (the vetoed byte, in production) reads better as "Deposit and middle payment together must be under 100%."
- **Refusals stay 422** (ruled): the console is not a surface.
- **The P2 walk:** GREEN on steps 0c to 8 (chair). Step 6's two-line schedule is reconciled by the founder's SELECT: `Photographs and film` had `middle_enabled` false when attached. Step 9: the founder's Graphite screenshots cover the room folded and unfolded; one Graphite screenshot of Sarah's card remains, carried on the P2b card.

Sequencing beyond this sitting is the founder's.
