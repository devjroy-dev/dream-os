# TDW · CE-46 · WEB-1 · CUT 4 HANDOVER · the site's data (dream-os)

Cut at dream-os 7504315 (base; carried from 79a3102 with no overlap by path), 28 September 2026 IST. Rung b148. Migration 0179.

## What shipped
1. `db/migrations/0179_vendor_sites.sql`: `vendor_sites` (one row per vendor: look CHECK quiet|bloom|atelier or null, look_options, pages, sections, seo, credit_shown default true, published_at, unpublished_at), `vendor_stories` (Prestige; slug unique per vendor, shape-checked), `vendor_testimonials` (Signature; consented_at NOT NULL). RLS enabled on all three in the transaction, no policy (SEC-1); the four privileges to service_role in the file (A-45.8).
2. `src/lib/site/siteModel.js` (new): the one home of R-46.9 as ruled on 28 September. Basic: one look by her trade; Essential and up: her pick (looks_open). Pages: the five (Work as Portfolio and Weddings) for Basic and Essential; Signature adds Reviews; Prestige adds Stories, FAQ, Book a consultation. Her order and hidden set are honoured, filtered to her tier (a downgrade hides, never deletes); Home and Contact are never hidden. Credit: shown on Basic and Essential, removable on Signature, removed on Prestige. The trade map as the founder okayed it.
3. `src/api/public/vendorCard.js`: two named fields, `packages` (name, description, total under her rate switch, the line items' words; F-44.241) and `site` ({ look, pages, credit, domain }). The door reads `tier` to decide `site` and never sends it: `tier` stays on WIRE_FORBIDDEN, and b148 §3 pins that no key at any depth of the card is tier. Her live domain (the canonical's field for cut 5) is read from `vendor_domains` where status is live. Each new read has its own try, so a missing table (0178 not yet applied) or row gives the default, never a 500 on a couple's page.
3b. `src/api/vendor/solutions/site.js` (new), mounted at `/api/v2/vendor/solutions/site`: GET / answers { look, looks_open, trade_look, looks } for the Your look screen; POST /look { look } saves one of the three (an upsert on vendor_id). Basic is refused with 403 "More looks are on Essential." and nothing written; a downgrade shows her trade's look again while her saved pick waits for an upgrade. The tier decides and is never in the answer; looks_open is.
4. Benches amended by label: b44 (CARD_WANT gains packages and site; SELECT_FORBIDDEN loses tier, which stays on WIRE_FORBIDDEN; the select is sixteen columns), b55 (packages and site appended after meta).
5. `scripts/b148_ce46_web1_site_card_bench.js` (33 cells, four mutations) and `scripts/lib/b148r_0179_rehearse.sh` with its plant.

## A deviation from the chair's words, named
The chair's charter named `site_tier` and `looks_open` as card fields. The public card may not carry the tier (b44, WIRE_FORBIDDEN), and `looks_open` only matters to the vendor's own room, which reads her tier from /me. So the card carries the capabilities the page draws (look, pages, credit, domain) and no tier. The room computes looks_open from /me's tier with the same siteModel rules (cut 5).

## Proven
b148 40/40 (5b pins the look door over HTTP); b44 59/0; b55 50/0; b124 green (the enquiry select pin holds: tier sits before seo_title); b53, b57, b58, b136 unchanged; b51 has the same 3 reds as at 79a3102. NOT run here: b148r (no Postgres in the seat); the chair runs it before the founder's SQL.

## OWED BEFORE THE FIRST VENDOR ON SIGNATURE (the founder, 28 September; taken up after the front end lands)
1. The ResellerClub wallet top-up (USD 10; the float the registrar debits at the buy, repaid by her Razorpay payment on settlement).
2. The reseller price-list read: one Railway Console line printing the raw products/reseller-price.json answer, to prove src/lib/domains/resellerclub.js yearOneRupees() reads its shape (prices[productkey].addnewdomain["1"]). The first read printed nothing; if the shape differs, a small dream-os cut reads the real one.
3. The founder's walk of a real search, after both.
The keys path is complete (static IP 208.77.246.15 whitelisted, the availability read green, five Railway variables, payment_link.paid on the Razorpay webhook); the P2 gate reads open.

## For later, named by the chair
Vercel's own registrar as an alternative to ResellerClub (no IP allowlist): not read; a read-first of its own if the ResellerClub whitelist ever becomes a burden.

## The founder's SQL (the §7 exception), after the push
The whole of 0179 as delivered, one paste in the Supabase editor. Witnesses:
`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('vendor_sites','vendor_stories','vendor_testimonials');` → three rows, all true.
`SELECT table_name, count(*) FROM information_schema.role_table_grants WHERE grantee='service_role' AND table_name IN ('vendor_sites','vendor_stories','vendor_testimonials') AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE') GROUP BY 1;` → three rows of 4.

## The walk
After the push and the SQL: open https://dream-os-production.up.railway.app/api/v2/public/vendor-card/dev440 in the browser. The card shows `packages` (DEV440's, with totals only if her rate switch is on) and `site` with look "quiet" (photography), the five pages, credit true, domain null. No `tier` anywhere in it.
