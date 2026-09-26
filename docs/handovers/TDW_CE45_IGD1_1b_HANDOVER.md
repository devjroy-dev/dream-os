# repo: devjroy-dev/dream-os · TDW CE-45 · IGD-1 · CUT 1b HANDOVER (the code landed in dreamos-pwa at 6bb8e7e6)

IGD-1's records live in dream-os, as one home for the seat (the chair, 26 September 2026, after the founder moved cut 1's walk record
here). Cut 1b's code landed in **dreamos-pwa** at `6bb8e7e6`, on `afe6b076` (FE-2's TYPE_1b r3).

## What landed

**R-45.28**, the founder after cut 1's walk: "whatsapp and instagram should be the First one in GET BOOKED-above open dates and
rates". Business Solutions' Get booked group is now `['number','dates','introductions','referrals']` (`lib/solutions/copy.ts`
HUB_GROUPS). A2's "last" is amended by his word, and ROOM_ROWS' own order is untouched.

Four files:

- `lib/solutions/copy.ts`
- `scripts/b122_ce45_home_shelves_bench.js`: :95, re-aimed by label
- `scripts/b126_igd1_meta_room_bench.js`: 1.6 reads FIRST, labelled
- `scripts/floor-manifest-ce45-igd1-cut1b.txt`

## What did not land

**R-45.29**, "WhatsApp and Instagram" pinned in every trade's six (his P1 to P11), was WITHDRAWN by him before the cut: "any which way
we will later on allow for pinning any room, so why waste time with just pinning whatsapp and IG." TRADE_PINS, DEFAULT_PINS and b122's
RULED sets and no-Coming-pin cell stay exactly as they were. Letting vendors pin any room is on the road as its own feature.

## Proof

- **The rebase.** Cut 1b was rebased onto `afe6b076` by three-way merge. b122's diff is exactly R-45.28's line; r3's hardening is
  untouched.
- **The differential.** Eighteen readers in series on one base, with exits identical. The one output change is b126 1.6's labelled
  name, and every cell count is equal (A-45.12).
- **The floor.** FLOOR = NAMED BASE, no delta, 40 set-equal, 0 refusals.
- **The founder's run.** BLOCK 2 GREEN, pushed `afe6b076..6bb8e7e6`.
- **The walk, 26 September 2026, both themes.** "WhatsApp and Instagram" is first in Get booked, above Open dates and rates. The room
  is unchanged. Only the designed 404s remain (`/solutions/quiet`, `/solutions/instagram`); `/solutions/number` no longer answers 500
  (G6-1's F-44.168 cure). CLOSED.

## Disclosed

e-141: the first comparison pass of the 97031c40 differential read the old cut 1 folder. It was recognised and set aside before any
claim.
