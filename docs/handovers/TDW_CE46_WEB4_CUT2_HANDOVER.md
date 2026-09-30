# TDW · CE-46 · WEB-4 · CUT 2 HANDOVER · the site content model, first cut (dream-os)

Cut at dream-os `70b0dd9`, CARRIED onto `7913ec0` (FE-5's DESIGN-1 dream-os half; no overlap by path) and re-stamped
onto `07f0804` (CE-47's succession note, docs only), 30 September 2026. Rung **b160** (b158 and b159 are
reserved for G6-6; derived at the cut). Migration **0187** (0185 and 0186 reserved by the chair; derived at the cut).
The brief: CE-46 to WEB-4, 30 September 2026, with the chair's rulings Q1 to Q15 on the read-first.

## What shipped
1. `db/migrations/0187_site_content_model.sql`. ALTERS `vendor_sites` (0179) with her choices: style, styles_picked,
   palette_id, palette_custom, palette_resolved, font_pair, motion, corners, texture, button_style, cover_mode, cover,
   monogram, site_name, copy. 0179's look, pages and sections are untouched, so WEB-1's live look door keeps working.
   ALTERS `vendor_testimonials` (0179) so the words arrive only from the client's own page (ruling 2): request_id,
   occasion, event_month, place, state (pending, approved, hidden), approved_at, hidden_at, submitted_at, video_url,
   video_duration_s, video_title; body may be null when a video carries the words. CREATES twelve tables, RLS on each in
   the same transaction, no policy, A-45.8 grants in the file: vendor_site_pages, vendor_site_sections, vendor_looks,
   vendor_look_photos (two focal points each, the portfolio's three approval states), vendor_collections,
   vendor_collection_looks, vendor_site_faq, vendor_testimonial_requests (only the token's sha256; 30 days; the phone
   cannot outlive the link's use), site_visits_daily, look_hearts_daily, site_visit_salt, site_visit_seen (no address,
   agent, cookie or token column anywhere). Every fixed-column CHECK mirrors `limits.js`.
2. `src/lib/site/styles.js` (new): the one home (Q8) of the six styles, the 18 curated palettes (each citing WEB-3's handoff
   source file and line it was copied from, R-42.6), the eight approved pairs, WEB-3's style-to-pair map (Q7,
   from its handoff) and the trade words of design §4.
3. `src/lib/site/contrast.js` (new): the gate. Body 4.5, large 3, labels on buttons 4.5; lightness moves, hue stays;
   text on the page moves the text, a label on a button or band moves the fill.
4. `src/lib/site/limits.js` (new): a limit on every field she types (the Gallery lesson), the from-price house form
   (refuses K, L, Cr, the rupee sign, western grouping, bare figures, a range), the Q5 warning when her page hides rates,
   slugs, focal points. The refusal lines are listed below for the founder's veto.
5. `src/lib/site/siteModel.js`: the WEB-1 half is kept for Basic (today's one-page site); `creditFor` now follows the
   ruling (W4-b: removable on Prestige only). The WEB-4 half adds `resolveSite` and its helpers: styles open by tier and
   the Q10 survivor rule, palettes by tier through the gate, pairs per style, sections with Q6 and Q11, Prestige pages,
   trade words, the Q13 site name and monogram, Q14's New mark, capabilities for her room. The tier is never returned.
6. `scripts/b160_ce46_web4_site_model_bench.js` (85 cells, twelve production mutations inside) and
   `scripts/lib/b160r_0187_rehearse.sh` with its plant.
7. `scripts/b148_ce46_web1_site_card_bench.js`: cells 1.10 and 3.1 amended BY LABEL for W4-b.

## Nothing is wired to a door or the public card yet
That is cut 3 (the card's growth and the vendor doors). This cut changes one live behaviour: the credit on the public
card now follows W4-b (a Prestige vendor shows the credit unless she removed it; a Signature vendor can no longer hide it).

## r5, the carry onto 7913ec0 (r6 re-stamps onto 07f0804, one docs-only commit; no code byte moves)
FE-5's 17 paths touch none of this cut's; the eleven r4 files apply byte-identical. One bench on the new tip reddened:
`scripts/d1_search_bench.js` 3.2 read every migration numbered 0185 or later and failed on any that creates a table, so
0187 turned it red (a live-listing pin, C-44.7). Amended BY LABEL to read its own delivery's migration, 0185, alone; it
still reddens on a table planted in 0185 (proved), and is 22/22 at the tip and on the cut.

## Found and reported
- **r3, WEB-3's handoff folded in** (ZIP sha256 6d444afa3ee321d582aaf56b3b938976fa51c0a4d3a1e4ab204d9b7b63dc3347). WEB-3 fixed the
  seven failing palettes AT SOURCE: Aurora lagoon's and Riviera amalfi's and goa's muted inks darkened; two roles added,
  `atx` (the accent as text on the paper; Heritage and Riviera) and `atd` (the accent as text on the deep band; Heritage); Noir's gold gradient ends and
  Aurora blush's wash moved. The registry now copies the handoff's source files, line by line. WEB-3's real style-to-pair
  map replaces the provisional one (Q7): couture 1 2 6, noir 3 1 2, heritage 4 2 8, aurora 5 6, gallery 6 1 3, riviera 7 8 2.
- **The gate now holds each style's own pairs**, read from where its prototype actually puts text and labels (a button
  label on vermilion in Heritage, on `atx` in Riviera, on the accent in Couture and Noir; the accent as small text in
  Noir; the footer name on the deep band in Heritage), plus the base pairs for every style. Under them the curated
  eighteen pass untouched (b160 3.3); a palette she builds from her own colour is still gated before it is sent (5.8).
  r2's general pairs would have repainted palettes that pass where they are drawn (9.11 proves the difference).
- **For the chair: Gallery offers Italiana · Jost** in WEB-3's handoff, while design §3 says "Gallery in Italiana would
  be wrong". The registry follows the prototype; which one stands is the chair's.
- **r4, the chair's packet (TDW_OPEN_WEB4)** carries the same kit byte for byte (6d444afa...). Added from its instruction:
  the `atd` pair on Heritage's deep band (4.5, small caps), the heart-count badge named on the base ink-on-ground pair.
- **Corners, button style and texture** have no values in any prototype, nor in the kit's design document (which only lists
  them among her choices, and has Couture refuse rounded pills and gradients on buttons); the model holds provisional closed sets
  (square/soft/round, solid/outline/pill, none) until WEB-3 names them.
- **A wamid column was taken out of 0187** before delivery: b51's law is that any table holding a wamid is reachable
  by the receipt router with the wamid UNIQUE. Cut 4 (the send) adds both together.
- **PUBLIC_SCHEMA.md is left alone** (the chair's word): 0187 is the witness until the next regeneration.

## Proven (in the seat's container; no whole floor here, rule (b))
- b160 85/0 on the cut; **0/85 on the clean tip** (every cell red, no crash; four hollow greens found and closed while
  proving it). Run on shifted clocks (the next IST day, months ahead, a year's end, 29 February 2028) and four time zones:
  85/0 each. It reads no clock.
- b160r 93/0: 0179 then 0187 applied on a throwaway Postgres 16 by a NON-SUPERUSER editor; a second 0187 refuses whole;
  the WEB-1 row survives with the new columns at their defaults; RLS and the four grants on all twelve; anon and
  authenticated refused on all twelve; every CHECK exercised both ways.
- Differential (engine built in both trees, radius derived by command: every bench reading the ladder directory, the
  site files or the card): 30 benches, **exits identical, cell counts identical**. The only output differences: the
  relabelled b148 cell; the ladder top named inside b10_p1/p2/p3's pre-existing reds (184 to 187); b14_d1's file count;
  b15's hole count; b91 listing 0187 among the ladder it checks (green, 12 tables, RLS on each).
- The clean tip's own reds, read at cell level and unchanged by the cut: b07_f0772 (1), b07_p4b (1), b10_p1, b10_p2,
  b10_p3 (ladder pins at 0112), b51 (3).

## Wording, approved by the chair for the founder's veto (R-45.30), with one change ruled 30 September (the Q5 warning)
Refusals: "{Field} can be up to {N} characters." · "{Field} cannot be empty." · "{Field} must be on one line." ·
"You can add up to {N}." · "Write the price as Rs 45,000." Warning (Q5), as the chair changed it: "Your page hides prices, but this text has a price in it, so it
will show." Field names: see `LIMITS` in limits.js (e.g. "Headline", "Small heading", "From price",
"Description for screen readers").

## The founder's SQL (BEFORE the push; CE-47's order, 30 September 2026)
Block 1, block 2, block F (the tail to the chair), then S0 (the read-only check on 0179), S0b (the count of any
testimonial rows that predate 0187), S1 (the whole of 0187, one paste), S2 (its witnesses), and only then block 3 (git).
0187 goes in BEFORE the push. No code in this cut reads anything 0187 adds (the card still selects look, pages and
credit_shown, all 0179's), so the running server is safe either way; applying first means the ladder the push records
never names a migration production lacks, and a paste that refuses whole stops the push rather than following it.
All four SQL texts are on the card.
