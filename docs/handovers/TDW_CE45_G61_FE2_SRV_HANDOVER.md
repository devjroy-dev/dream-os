# TDW · CE-45 · G6-1 · FE_2's DREAM-OS HALF · HANDOVER

Base: `90f607d` (given under R-45.14; built at a7e90bf; the touched files are byte-identical between the two).
Rulings: FE_2 read-first FK1 to FK6 (2026-09-24), e-109's ruling (a), E1 to E12 (the pwa half's bytes).

## What shipped

Spec §7c's switch becomes real on the server. The vendor's one writer, `/me`, accepts `enquiry_routing` and
`enquiry_phone` under the ruled rules, and every real-vendor surface that builds an "Enquire on WhatsApp" link reads
her switch through one resolver.

- `src/api/vendor/me.js` · both fields on the allowed list; `validateEnquiryRouting` before the write: 'tdw' and
  'own_number' only, 'own_waba' refused until 2b, 'own_number' needs a 10 to 15 digit phone on her row or in the
  same write, clearing the phone under 'own_number' refused, the phone trimmed. Both the GET shape and the PATCH
  echo coerce anything but 'own_number' to 'tdw', so the Settings row (the pwa half) never draws a rung the links
  would not honour, and it settles on the door's answer (FK5).
- `src/lib/discover/shapeVendor.js` · `enquireLinkFor` gains `tdwLink`: the caller's own rung-1 expression passed
  whole and returned unchanged for rung 1. Rung 1 is byte-identical on every surface by construction.
- **The eight routed sites:** shapeVendor (:169, the deck card and both previews), vendorCard (/v/), weddingPage,
  lib/vendor/weddings, couple/discover's heroes and their fallback, couple/muse, circle/muse. Each keeps its outer
  condition. The heroes name a vendor only by handle, so the route makes one extra read (the vendors behind at most
  three handles); a failed or empty read leaves rung 1.
- **The feeding selects** name both columns; the previews read the whole row.
- **Not emitters, named:** weddingTeam's `ownerEnquireLink` (exported, called by no surface; untouched, pinned
  byte-identical); vendorCard :347 (card() copies the link it is handed); the demo cards (vendorCard :625,
  demo/vendor.js :283) and shapeDemoRow :118.
- `docs/db/PUBLIC_SCHEMA.md` · the staleness note names 0171 (e-107).
- `scripts/b124_g61_enquiry_srv_bench.js` · rung b124.

FK4 holds by construction: a real vendor's card passes its own `enquiry_phone` key as the literal `null`
(vendorCard :567); her number reaches the public page only inside `enquire_link`, and only when she chose rung 2.

## Privacy: what the public door now reads

The public vendor card's door now reads one more personal field, `vendors.enquiry_phone` (and the switch `enquiry_routing`), only to build the Enquire link of a vendor who chose to send enquiries to her own number under the twice-stated consent screen (FK3), and never as a key of its own on the card (b124 3.5; b44's allowlist amended to fifteen columns under ruling (a) and FK4, accepted by the chair 2026-09-24).

## Sealed benches amended by label

- **b44 §3.3 and §3.5**, the public card's vendors allowlist: thirteen columns to fifteen (`enquiry_phone`,
  `enquiry_routing`), under ruling (a) and FK4, following the R-40.77 precedent in the same block. SELECT_FORBIDDEN
  unchanged. Both ways: the amended bench is RED against the base's production code (3.3 sees thirteen columns) and
  green cured.
- **b57 C3c**, "the page serves owner.enquire_link": the pattern now accepts the resolver form, which is handed the
  same owner-built expression; the next cell still pins that expression. Green at base and cured (a structural
  relaxation, not a cure cell).

## Proof

- b124 at 90f607d: **28 pass, 0 fail**. The census over every `enquire_link:` in src (engine excluded), each whole
  expression read: 0 stray, exactly 8 routed, each non-emitter found once, weddingTeam byte-identical. Each site's
  old expression, read from the base by `git show`, found verbatim as `tdwLink`. The resolver returning tdwLink
  unchanged for tdw, own_waba, unknown and absent. Every feeding select. FK4's literal. `/me`'s PATCH driven for real
  (its final handler with a Postgres-shaped double; the bench waits for the route's answer, since asyncHandler does
  not return its promise). Five production mutations, each red and restored by sha.
- **The differential, in series on 90f607d:** 77 benches reading me.js, the eight files, weddingTeam or the schema
  doc; the work stashed for the base side and restored by sha (0 mismatches). Exit codes identical except b44 and
  b57, which turned red on the unamended benches and are amended above. Output deltas, timestamps normalised: those
  two only. Red on both sides, untouched by this half: b07_f0772, b07_p4b, b07_p5, b10_p1, b51.
- **The floor:** its own turn.

## Next

The pwa half (b125): the Settings row with E1 to E12, the five renamed bytes, the consent gap, e-94's cure; it asks
for its base when ready. The walk of this half: DEV440's public page, rung 1 unchanged.
