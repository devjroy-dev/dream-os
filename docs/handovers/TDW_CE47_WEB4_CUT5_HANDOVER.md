# TDW · CE-47 · WEB-4 · CUT 5 HANDOVER · the limiters, her own domain, and the pwa seats' asks (dream-os)

Cut at dream-os `a0bfe02` (WEB-4 cut 4 landed), 30 September 2026. Rung **b198**. No migration.

## a · the try limiters (the chair's item a)
`src/lib/site/limiter.js` is the one in-memory limiter for the site's public doors (siteVisit.js, testimonial.js). Every
entry carries its own expiry; expired entries are swept every 500 calls and whenever the map is full; the map never holds
more than 5000 keys (past that, the oldest go first). Keys are hashes, never raw addresses. A token's lifetime count is
kept 31 days, one past its link's 30. A restart resets every count; each door's database guard still bounds what matters.

## b · her own domain reads as direct (the chair's item b)
`sourceOf` classes a referrer on her own linked, live domain (vendor_domains, status live, not deleted; with and without
www.) as direct, as thedreamwedding.in already was. A domain not yet live is not hers yet (other).
**The page sends `ref` on entry only** (document.referrer on the first page of a visit), so the class is where the
visitor came from, not the page before.

## c · Instagram on her site
Still with the founder. Nothing built; not in CARD_KEYS.

## 1 · her draft and Publish (the chair's item 1; WEB-6's W6-k)
Migration **0189** (additive; goes in BEFORE the push): `vendor_site_drafts`, one row per vendor (settings, sections,
pages), RLS, grants to service_role; and `site_publish_draft(uuid)`, which applies the draft to the live rows and
deletes it in one transaction (a draft the live row refuses fails whole and moves nothing: b198r). No search_path is set
(b91's rule); every name in it is schema-qualified.
Her room: PATCH /settings, PUT /sections and PUT /pages (Prestige) write the draft, validated exactly as before.
GET /room returns `stored` (the draft over the live rows), `changes { count, list[{area, line}], published_at }`,
`is_live` (false until her first Publish) and `preview { token, expires_at }`. POST /publish (400 "There are no changes
to publish." when there is no draft); POST /discard. Looks, collections, questions, testimonials and prices are NOT
drafted; rate_display stays one immediate switch.
**The public card reads live rows only, and an Essential-and-up site stays today's page until her first Publish.**
This moves cut 3's card for those vendors back to the classic shape until they publish; no pwa page reads the styles
fields yet, so nothing visible changes at landing, and nobody's site flips to a default style she never chose.
Change lines (for the veto, R-45.30): "Style changed" · "Your styles changed" · "Colours changed" · "Fonts changed" ·
"Movement changed" · "Corners changed" · "Buttons changed" · "Texture changed" · "Cover changed" · "Monogram changed" ·
"Site name changed" · "Words changed" · "Credit changed" · "{Cover|Looks|Collections|Band|Kind words|Prices|Studio|
Journal|Questions|Enquire|Your own} section changed" · "Pages changed" · "There are no changes to publish."

## 2 · the preview (item 2; W6-l)
`GET /api/v2/public/vendor-card/<handle>?preview=<token>` serves HER DRAFT to her room's token only; add `&style=<id>`
for a style card (a style her plan opens). The answer carries `Cache-Control: no-store` and `X-Robots-Tag: noindex,
nofollow`. The token is stateless (src/lib/site/preview.js): vendor id, expiry and an HMAC; 30 minutes; signed with
SITE_PREVIEW_SECRET if set, else a key derived from the service key. Another vendor's token, a tampered or an old one
serves the live site.

## 3 · the site-kind door (item 3)
`GET /api/v2/public/site-kind/:code` → `{ v: 'classic' | 'styles' }` (styles = Essential and up AND published), with
`Cache-Control: public, max-age=60, s-maxage=60`; every miss is the card's one 404 body. WEB-5's middleware reads only this.

## 4 · card fields for WEB-5's port (item 4)
`looks[].second` (the second approved photograph, or null) · `testimonials[].video.poster` (the YouTube still from the
address: watch, youtu.be, shorts, embed, www. or m.; else null) · the band section's `body` now also carries `photo` (its
first approved photo) and `button` (her words, 32 at most; her room's PUT /sections takes `body.button`) beside `words[]`,
`lines[]`, `destinations[]` and `photos[]`. **`site.trade.row` is not a field**: `site.trade` carries `items`, `item`
and `request`; WEB-5 to say what `row` means and it rides the next package.

## Proven
b198 40/0 (items a, b, 1 to 4; six mutations run as live code); red on the clean tip a0bfe02 (exit 1, 0 passed).
b198r 20/0 on Postgres 16 as the non-superuser editor (0179, 0187, 0188, 0189; publish applies settings, sections and
pages, deletes the draft, stamps published_at; a refused draft moves nothing; anon and authenticated refused). b196
77/0 (amended by label: planted sites are published; the limiter), b197 31/0, b148 41/0, b44 61/0.
