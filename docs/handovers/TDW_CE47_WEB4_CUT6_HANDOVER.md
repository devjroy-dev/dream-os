# TDW · CE-47 · WEB-4 · CUT 6 HANDOVER · pages kept on Publish, and the card's publish gate read first (dream-os)

Cut at dream-os `00fe68b` (WEB-4 cut 5 landed), 1 October 2026. Rung **b199**. Migration **0190** (goes in BEFORE the
push, like every function change: the door calls the function by name either way, but only 0190 keeps page rows).

## a · Publish keeps a page's row (the chair's item a on cut 5)
`db/migrations/0190_site_publish_pages_in_place.sql` replaces `site_publish_draft(uuid)` with the same function, one
difference: her draft's pages are updated IN PLACE BY SLUG (title, position, shown); a slug not yet live is inserted;
only live pages ABSENT from the draft are soft-deleted. A page's id no longer changes on Publish, so a section carrying
its page_id stays tied. Settings and sections exactly as 0189. No search_path; grants restated (EXECUTE to service_role).

## b · the card decides published_at first (item b)
The card's classic site read now names `published_at` (SITE_SELECT; b148 4.x amended by label), so an unpublished paid
vendor's card skips every site read (sections, pages, looks, collections, testimonials, questions) and awaits exactly
as many stages as a Basic card. A published site reads them as before.

## Not in this cut, by the chair's order
The panel's two doors (POST /api/v2/public/site-enquiry/:code and /site-chat/:code) wait for WEB-7's contract;
site.trade.row waits for WEB-5's shape; the whole-site unpublish waits for the founder. They ride the next package.

## Proven
b199 8/0 (one mutation run: the early gate removed, the unpublished card reads the site tables again); on the clean tip
00fe68b 1 passed and 7 failed (the one pass is 1.3, a control: a published site still reads its rows). b199r 15/0 on
Postgres 16 as the editor (0179, 0187, 0188, 0189, 0190): the kept page keeps its id through two Publishes, its section
stays tied, the absent page is soft-deleted, three rows in all; the same rehearsal on 0189 alone fails those four checks.
b198 40/0 (8.2 amended by label: the mutation removes both gates), b196 77/0, b148 41/0.
