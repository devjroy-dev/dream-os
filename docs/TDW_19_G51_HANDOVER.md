# TDW_19 G5.1 — THE OVERFLOW EXCHANGE · dream-os HALF · HANDOVER

**Base** dream-os `85fb480` (rider 1; the half sealed at `556f0c1`, this adds §6b and §9)
**Sealed base** `3c0f8d6` (re-derived at the cut; the tip moved **three times** under this seat — see §6).
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
- ~~That the tier decision (R-G51.8) holds under change.~~ **DISCHARGED at rider 1, §6b** — see §9. The gap was real and the first refusal to fake it was right; the cell that closes it asserts a behaviour, not an absence.
- **Any live DB, RLS, or pwa behaviour.** The surfaces are the pwa arm's.

## 6 · THE TIP MOVED THREE TIMES UNDER THIS SEAT

`0a43d09 → 5e5c230` (G3.2-pre contract docs) · `5e5c230 → 4d7a341` (G2 sitting 1, nineteen files) · `4d7a341 → 3c0f8d6` (G1.2's approved templates — `templates.js`, `b53`, a manifest). The third arrived **between the cut and the founder's apply**, and `base_guard.sh` refused it: `REFUSED — HEAD is 3c0f8d6, base is 4d7a341`. Nothing was copied.

Every carry, same three steps: `git diff --name-only` against this manifest **first** to prove disjoint, then stash → ff-merge → pop, then sha256 over all nine paths on both sides — the SET and the CONTENTS both. **No carry moved a byte.**

The third carry touched a floor bench (`b53_g11_wedding_pages_bench.js`), so the floor was **re-derived at the new base rather than carried forward** — a floor number measured against a tree that has since changed is the F-38.27 disease, and quoting the `4d7a341` run here would have been exactly that.

**The second carry changed a fact, not just a base.** G2 banked `0134_reviews_and_seal.sql`, so the ladder is now contiguous `0133 · 0134 · 0135` and this file sits AT the tip. `0135`'s header was **re-derived** rather than left asserting the hole it was written above, and neither delivery owes an `OUT_OF_ORDER.json` record.

## 7 · THE FLOOR — **ZERO DELTA AT `85fb480`**

`FLOOR = NAMED BASE, no delta` · exit **0** · 15 RED · `[F-14.16] declared files unmoved — set and contents both verified` · 4 refusals not in base.

**This section previously reported one delta and an owed exoneration. Both are retired, and by someone else's work rather than by anything this seat did.**

The sealed half measured `b16_p1_engagements_bench` RED and proved it inherited by re-running it at the clean tip with this delivery stashed — identical RED, identical blamed file, `src/lib/vendor/weddings.js`. The chair exonerated it by attribution at relay 4 (F-40.64 → `weddings.js:resolveCoupleForEvent`, G1.1c's byte, cure charged to G1.2). **G1.2 then landed that cure at `a2a5180`** — "the spine read moves to its one home (b16 2.2/2.3)" — and the bench is now GREEN in the named base.

So this delivery's floor line is no longer "one delta, exonerated". It is **no delta at all**, and the RED count fell 16 → 15 for a reason that belongs to G1.2.

**The lesson is the one §9.2 already banks in a different costume: a floor number is a measurement of a moment, not a property of a delivery.** Carrying `16 RED, one delta` forward into this rider — true when it was written, six commits stale by the time it shipped — would have reported an owed exoneration that no longer exists and understated the tree by one green bench. The floor was re-derived at the moved base *before* a word of this section was rewritten, which is the only order in which the sentence above can be honest.

## 8 · OWED

- ~~The chair's exoneration of `b16_p1_engagements_bench`.~~ **Granted at relay 4, then made moot at `a2a5180` — the bench is green in the named base. See §7.**
- ~~The tier cell (§5), or a ruling that the decision rides prose.~~ **Written at rider 1 §6b. See §9.1.**
- The pwa half: the record's one control, the sheet with its refusal state, `Forwarded by` + the note, the room, the live hub row with its `Open` chip, C31 by label, `next build`.
- `PUBLIC_SCHEMA.md` regen: until the next pair regen, **0135 is `lead_referrals`' sole witness** — cite the file by line, never the snapshot.

---

## 9 · RIDER 1 — THE TIER CELL, AND TWO LAWS-IN-WAITING

### 9.1 · §6b, and why the first refusal was correct

The sealed half named the tier cell as **owed rather than written**, because the obvious cell — grep `referrals.js` for the absence of a tier check — is vacuous by construction. It passes on an empty file. It passes if the check moves one module away. It can never tell "no gate" from "gate spelled differently".

The chair's correction (relay 4) is the shape that binds: **assert the behaviour, not the absence.** §6b drives a basic-tier vendor through the real `forwardLead` and asserts the forward LANDS — the referral row returned, the peer's lead actually present, stamped `peer_referral` like any other. Three further cells stop it passing by accident: a paid tier must behave identically, and a vendor row carrying no tier at all must not fall into a refusal.

**Both-ways, proven:** adding `if (fromVendor.tier === 'basic') return {ok:false,...}` to the door reddens three cells; reverting returns 67/67.

**And the ruling is not a technicality.** A basic vendor is exactly the one whose lead record withholds the couple's phone (`WITHHELD_FIELDS`; `FULL_ACCESS_TIERS` excludes `basic`). She is the vendor who *cannot ring this couple herself*. Gating the forward would take the one remaining thing she can do with an enquiry she cannot serve and hand it to nobody — couple unanswered, peer never told, the exchange dead at precisely the tier where overflow is most likely.

### 9.2 · Two laws-in-waiting, from this sitting's own mistakes

**A running floor's manifest is a SNAPSHOT, not a subscription.** `run-floor.sh --delivery` reads the declared set at start and verifies "set and contents both" at the end. Any declared file that moves mid-run trips the STOP — correctly. This seat broke it twice: once by creating the handover after the run began, once by editing the manifest and handover to record a carry. The second time it was caught before the run finished and killed rather than allowed to burn fifteen minutes producing a STOP already known. **Proposed law: from the moment a floor starts, no file in its manifest moves until it exits. If a declared file must change, kill the run and restart — a floor measured over shifting source is not a floor.**

**A DDL cell reads DISK; only `information_schema` reads the DATABASE.** §8's four cells assert `0135`'s guarantees by reading the `.sql` file, and they are labelled as such — but they pass identically whether or not the migration has ever run. On this delivery the founder's editor returned **zero rows** for `lead_referrals` on the first ask, with the bench fully green and the code applied. The green number was true and said nothing about production. **Proposed law: any delivery carrying DDL states its `information_schema` witness query in the apply chain, and the plane is not considered live until that query returns its expected shape. A bench cannot witness a migration it cannot reach.**
