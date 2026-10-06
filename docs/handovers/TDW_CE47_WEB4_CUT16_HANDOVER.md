# TDW · CE-47 · WEB-4 · CUT 16 HANDOVER · Basic's one free style (dream-os)

Cut at dream-os `d1aeab1`, 6 October 2026, LAST in server train 3. Rung **b261**. Migration **0195** (its SQL before the
push). The founder's decision, the chair's rulings 1 to 5.

## What changes
- **One style on Basic** (src/lib/site/siteModel.js): STYLE_ALLOWANCE basic 0 -> 1. Her palette and font pairing are fixed
  to her style's defaults (the first curated palette, the first offered pair). Basic's sections: cover, looks, band,
  pricing, studio, faq, enquire (reviews stays Essential; collections and the journal Signature). resolveSite draws
  Basic as a styles site.
- **The flags** (capabilitiesFor): `palettes`, `font_pairs`, and `opens`, each locked item with the plan that opens it
  ("Essential" / "Signature" / "Prestige"; `more_styles` names the next plan). Each locked section carries `opens`.
- **The room** (src/api/vendor/solutions/siteRoom.js) opens to Basic. Each lock is refused by name: "Basic has one style.
  More styles open on Essential.", "Colour sets open on Essential.", "Font pairings open on Essential.", "Removing the
  credit is on Prestige."; review requests and visitor counts stay Essential ("Client reviews open on Essential.",
  "Visitor counts open on Essential."). On Basic, choosing a style replaces her one pick.
- **The 30-day clock** (ruling 2), Basic only: vendor_sites.style_changed_at is set at Publish when the PUBLISHED style
  changes. Her first published style is free; drafts are free. Refused at the settings door and at Publish with "You can
  change your style once every 30 days. You can change it again on <day month>." The room returns style_clock
  { last_changed_on, next_change_on, next_change_words, locked }.
- **The public side**: the site-kind door and vendorCard draw a PUBLISHED Basic site as styles (look pages too); an
  unpublished Basic site stays the classic page. Publish is allowed on Basic.
- **Her own domain** (src/api/vendor/solutions/domain.js): ordering or wiring one below Signature: "Your own domain opens
  on Signature."
- **0195**: vendor_sites.style_changed_at; vendor_portfolio.source and vendor_look_photos.source ('upload' default,
  CHECK upload | instagram; cut 17's columns, no writer yet). Additive; no table created; no row rewritten.
- **The register** (db/migrations/OUT_OF_ORDER.json, the one writer in train 3), in history order: 183, 204 (main's,
  untouched), 196, 200, 208, 209 (train 2), 205 (OFF-A1b's record, verbatim), 195. 197 and 201 are not in train 3.

## Proven
b261 32/0. Amended by label: b146 (the vendor on Signature), b160 5.1 / 5.22 / 7.4, b196 3.3 and 1.16 (corrected by cut 17: r2
replaced the zeroed meter with a CAUSAL stage meter, deterministic under load; 1.19 its control), b198 4.8, b208 1.2. Differential at d1aeab1, 101 benches:
exits identical but two. b196 is 1/0, its flaky cell on the clean tip. b15 is red on this base ALONE, expected: the
formatter aborts on 0205's record until OFF-A1b r2 brings 0205's file, ahead of this cut; the chair proves b15 green on
the combined tree.
