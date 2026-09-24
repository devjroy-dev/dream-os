# TDW · CE-45 · G6-1 · FE_2b's DREAM-OS HALF · HANDOVER

Base: `085741a` (given under R-45.14 after LCV-15's LSP_4; built at 547c340, carried to cd71986 and then 085741a byte for byte; cut as FE2b_SRV_1b, since the manifest's base line changed).
Cures **F-44.154** (the seat's e-117): `enquiry_phone` was accepted and stored without its country code, and the
estate's one phone home was not used, so a bare 10-digit mobile produced a wa.me link WhatsApp reads without +91.

## What changed

- `src/api/vendor/me.js` · the door stores `enquiry_phone` as `toE164(trimmed)` (`src/lib/phone.js`, the one home,
  b57_e164_guard): a bare 10-digit mobile gains +91; a longer number is taken as already carrying its country code.
- `src/lib/discover/shapeVendor.js` · `enquireLinkFor` normalises through `toE164` before building `wa.me/<digits>`
  (11 to 15 digits after it; anything else falls back to rung 1). A raw value stored before this cut, the founder's
  own from FE2_1's walk included, now links correctly. No SQL.

## Proof

- **b124 at 085741a: 35 pass, 0 fail** (and at cd71986). 4.4 amended by label (stored through toE164); one cell per form typed
  (8757788550, +91 87577 88550, 918757788550, +1 415 555 0123), each stored as its E.164; 2.4, the raw stored value's
  link; M6 (the resolver skips toE164) and M7 (the door stores as typed), each red and restored by sha.
- **The differential, in series on cd71986:** 23 benches reading me.js, shapeVendor.js or the phone home, and
  b57_e164_guard (toE164 gains two importers); the work stashed for the base side and restored (0 sha mismatches).
  Exit codes identical; no output deltas. Red on both sides, untouched: b07_p4b, b10_p3, b51.
- **The floor:** its own turn.

## The walk (with the pwa half)

Settings: type the number without +91, save; the public page's Enquire opens a chat with +91 in front.
