# TDW_19 G5.1 — THE OVERFLOW EXCHANGE · dream-os HALF · HANDOVER

**Base** dream-os `3c0f8d6` (re-derived at the cut; the tip moved **three times** under this seat — see §6).
**Delivery** 8 files, listed in `scripts/floor-manifest-g51-dreamos.txt`.
**Chair** CE-40, rulings R-G51.1–.10 (relay 2), B8 and the migration number ruled at relay 3 (R-40.44).
**Mock** `docs/mocks/referrals-mock.html` @ dreamos-pwa `30828d7`, copy ratified at R-40.42, rider 1 at R-40.40.

---

## 1 · WHAT SHIPS

| File | What it is |
|---|---|
| `db/migrations/0135_lead_referrals.sql` | the plane. **Founder-run in the editor BEFORE the ZIP applies.** |
| `src/lib/vendor/leads.js` | `PEER_REFERRAL_SOURCE` minted and exported. Nothing else moved. |
| `src/lib/vendor/referrals.js` | NEW. The plane's sole writer + the room's reads + the two lead stamps. |
| `src/api/vendor/leads.js` | NEW DOOR: `POST /:leadId/forward`. Nothing else moved. |
| `src/api/vendor/referrals.js` | NEW. `GET /referrals` (the room) and `GET /referrals/peers` (the picker). |
| `src/api/vendor/core.js` | one mount line. |
| `scripts/b51_referrals_bench.js` | NEW. 61 cells. |
| `scripts/floor-manifest-g51-dreamos.txt` | NEW. F-14.16 declared dirt. |

## 2 · THE RULINGS, AND WHERE EACH ONE LIVES IN CODE

- **R-G51.1 · linked peers only.** `forwardLead` step 3 and `GET /referrals/peers` both filter `member_vendor_id IS NOT NULL` — the same predicate `collab.js:528` uses. The picker *shapes* the choice; the door *authorises* it. Both, because a client-side list is not a permission.
- **R-G51.2 · refuse and say so.** Every refusal is decided before any write, and returned as a **code**, never a sentence: `REFUSE.SELF | NOT_A_PEER | ALREADY_HAS | NO_PHONE`. The vendor-facing words are the founder's (veto sheet §C1) and live in the pwa's copy home. A door that returned prose would own a byte nobody vetoed. **No `lead_referrals` row is filed for a refused forward**, so the balance cannot count a forward that did not happen.
- **R-G51.3 · the state does not move.** Nothing in this delivery writes `leads.state`. The `lead_referrals` row is the record. The vocabulary stays in its eight homes, three of them under `src/engine/` — W-1 is never approached, and a bench cell reads `donnaLead.ts` to prove it.
- **R-G51.4 · `peer_referral`.** One home, beside `createLead`, exported so no door can spell it. A bench cell greps the whole delivery for the literal outside its home.
- **R-G51.5 · the peer sees it.** `referralStampsForLeads` returns `sentBy` / `receivedBy`, batched by lead id — the `engagedLeadStamps` shape, one query per page never per row.
- **R-G51.6 · forwards, not weddings, not money.** `getReferralRoom` returns `sent_count`, `received_count`, `peers[]`. The two head figures are the **lengths of the two lists**, not a sum over `peers` — one derivation per number (F-04.13), and a cell asserts the two agree.
- **R-G51.8 · not tier-gated.** No tier check exists on the forward path. A basic-tier vendor who cannot contact a lead can still hand it to a peer who can. **Stated as a decision, not an omission** — and there is no cell for it, which is disclosed in §5.
- **R-G51.9 · the DDL.** `outcome` deferred: an outcome is the peer's lead's state, already on `leads`, and a copy would drift the first time she moved it to `booked`.
- **R-G51.10 / B8** are the pwa half's, except the picker door's refusal to grow an add-a-peer way in, which is enforced here by simply not having one.

## 3 · THE ONE THING TO READ IF YOU READ NOTHING ELSE

`createLead` dedupes on `(vendor_id, phone)` and returns the peer's existing row with `deduped: true`. `source` and `referrer_name` are both in `ENRICH_REFUSED_KEYS`. So a forward to a peer who already holds that couple would have **inserted nothing, carried neither the token nor the sender's name, and returned ok** — and this file would have written a referral row pointing at a lead the peer had before the forward existed. The vendor's glass would say she handed the work over. She would not have.

That is F-40.84, and it is why the check sits **before** the write rather than being inferred from `result.deduped` after it. The post-write guard is kept as well, for the race the first cannot close — the peer's Victor can file the same couple in the milliseconds between.

## 4 · ERRORS THIS SEAT OWNED, IN BAND

Four defects were mine, all found by mutating rather than by reading, and all in the instrument rather than the product:

1. **A money cell that was a substring scan.** It greped the file for `/budget|amount|inr|.../` and went RED on my own local variable `inRes`. A cell that cannot tell a money column from four letters inside an identifier proves the author can spell. Replaced with two assertions that bind: the plane's column list carries no money column, and a peer row carries exactly its declared keys.
2. **A sole-writer cell that counted the wrong thing.** It asserted `lead_referrals` is *named* in two files and went RED on three, because the forward door's header names the table in a comment explaining what a refusal does not write. The comment is correct; the cell was wrong. Naming a table is not touching it — replaced with `from('lead_referrals')` appearing in exactly one file.
3. **§6 claimed to police an ordering it could not see.** Deleting the step-4 dedupe refusal reddened **nothing**, because `createLead`'s own dedupe makes the two guards outcome-equivalent on that path. The behavioural cells cannot distinguish checking first from checking second. Since the ruling is about order, the cell that guards it is now structural — and the asymmetry is disclosed at the cell, not papered.
4. **A refusal guarded by nothing.** Growing the picker's `PEER_COLS` to include `phone` reddened no cell, while the door's own header claimed a peer's number never travels. A refusal stated in a comment and guarded by nothing lasts until the next person needs a phone number. Cell added; it reddens.

## 5 · WHAT THIS DELIVERY DOES NOT PROVE

- **That 0135 has run.** The plane is founder-run. The bench drives the code that will write to it, against an in-memory double that honours no constraint — so the UNIQUE on `new_lead_id` and both FK delete rules are asserted by **reading 0135**, not by exercising it, and the cells say so in their labels.
- **That the tier decision (R-G51.8) holds under change.** There is no cell that reddens if someone adds a tier check to the forward door. The ruling asked for one; I have not written it, because a cell asserting the *absence* of a check anywhere in a file is the vacuous shape this estate keeps filing findings about. **Named as owed rather than faked.**
- **Any live DB, RLS, or pwa behaviour.** The surfaces are the pwa arm's.

## 6 · THE TIP MOVED THREE TIMES UNDER THIS SEAT

`0a43d09 → 5e5c230` (G3.2-pre contract docs) · `5e5c230 → 4d7a341` (G2 sitting 1, nineteen files) · `4d7a341 → 3c0f8d6` (G1.2's approved templates — `templates.js`, `b53`, a manifest). The third arrived **between the cut and the founder's apply**, and `base_guard.sh` refused it: `REFUSED — HEAD is 3c0f8d6, base is 4d7a341`. Nothing was copied.

Every carry, same three steps: `git diff --name-only` against this manifest **first** to prove disjoint, then stash → ff-merge → pop, then sha256 over all nine paths on both sides — the SET and the CONTENTS both. **No carry moved a byte.**

The third carry touched a floor bench (`b53_g11_wedding_pages_bench.js`), so the floor was **re-derived at the new base rather than carried forward** — a floor number measured against a tree that has since changed is the F-38.27 disease, and quoting the `4d7a341` run here would have been exactly that.

**The second carry changed a fact, not just a base.** G2 banked `0134_reviews_and_seal.sql`, so the ladder is now contiguous `0133 · 0134 · 0135` and this file sits AT the tip. `0135`'s header was **re-derived** rather than left asserting the hole it was written above, and neither delivery owes an `OUT_OF_ORDER.json` record.

## 7 · THE FLOOR

Measured with declared dirt (`--delivery`, F-14.16 — the clean-tree refusal fired first and named its own cure). **One delta: `b16_p1_engagements_bench`.**

**It is not this delivery's.** Proven by running the bench with this seat's work stashed on the clean tip: identical RED, identical blamed file — `src/lib/vendor/weddings.js`, which G1.2 banked at `9235849`. This delivery's files never call `.from('engagements')`; the only occurrence is a comment citing `engagedLeadStamps` for its batching shape.

This is the F-40.64 class, inherited. **The chair's exoneration is owed; this seat does not exonerate itself.**

## 8 · OWED

- The chair's exoneration of `b16_p1_engagements_bench`.
- The tier cell (§5), or a ruling that the decision rides prose.
- The pwa half: the record's one control, the sheet with its refusal state, `Forwarded by` + the note, the room, the live hub row with its `Open` chip, C31 by label, `next build`.
- `PUBLIC_SCHEMA.md` regen: until the next pair regen, **0135 is `lead_referrals`' sole witness** — cite the file by line, never the snapshot.
