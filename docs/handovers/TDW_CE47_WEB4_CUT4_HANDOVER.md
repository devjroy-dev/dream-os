# TDW · CE-47 · WEB-4 · CUT 4 HANDOVER · visitors and saved looks, and a look photo's reason (dream-os)

Cut at dream-os `995496d` (WEB-4 cut 3 landed), 30 September 2026. Rung **b197** (31 cells, three mutations run as live
doors). Migration **0188** (0186 reserved for G6-6; derived at the cut). SQL: 0188 goes in BEFORE the push.

## What shipped
1. `db/migrations/0188_look_photo_review.sql`: vendor_look_photos gains rejection_reason (1 to 200 characters) and
   reviewed_at. Nothing dropped, no data touched; the table's RLS and grants (0187) carry.
2. `src/api/admin/photos.js`: on `?kind=look`, a rejection keeps its reason (trimmed, at most 200) and time; an approval
   clears the reason and keeps the time. `src/api/vendor/solutions/siteRoom.js`: her look list shows `reason` beside
   `review: 'not_approved'` (null otherwise). **The code reads rejection_reason, so 0188 must be applied before the push.**
3. `src/api/public/siteVisit.js`, mounted at /api/v2/public/site (router.js):
   POST /visit { code, page: home|look|collection|journal|page, look_slug?, ref?, utm_source? } and
   POST /heart { code, look_slug, on }. Both answer 204 with no body, before they count.
   Nobody identified (the brief §6; gap 7): no cookie, no stored address, no user agent stored. A visitor counts once a
   day per vendor by a digest of today's salt, address, agent and vendor; the salt is 32 random bytes for India's day and
   is deleted with the day's digests the first time a later day is seen (no scheduled job needed). Bots and link-preview
   fetchers (WhatsApp, Telegram, Facebook's) are not counted; Basic vendors are not counted; unknown pages, drafts and
   unknown looks are not counted. Sources: google, instagram, facebook, whatsapp, direct, other (utm_source first, then
   the referrer's host). Counting is read-then-write, so two visits in the same instant may count once (the daily
   table's unique index stops a duplicate row); the figures are a guide, not a ledger. Rate limit in memory per process
   by a hash of the address (240 an hour); over it, quietly not counted.
4. Her room: GET /api/v2/vendor/solutions/site/visitors?days=7|28 → { visitors: { days, from, to, visitors, views,
   daily[{day, visitors, views}], top_look{slug, title, views}|null, by_source{…}|null, saved_looks[{slug, title,
   hearts}]|null } }. Essential: counts and the most opened look; Signature adds sources; Prestige adds which looks brides
   save. What her plan does not open is null (WEB-6 draws the plan's line, never a zero). Days are India's calendar days.
   "visitors" counts each person once a day, summed over the days.
5. `scripts/lib/b196_store.js`: gains gte, lt and lte (b196 still 77/0).

## Proven (in the seat; the whole floor is the founder's block F)
b197 31/0; on the clean tip 995496d it cannot load the absent modules and exits 1 with 0 passed. b197r (0179, 0187, 0188
on Postgres 16 as the non-superuser editor) 13/0: a second 0188 refuses whole; 200 saves, 201 and empty refuse; anon
refused. b196 77/0. Differential, engine built both sides, radius by command (87 benches: the touched paths, every source
walker, every ladder reader): exits identical; output moves only the ladder top named in b10_p1/p2/p3's pre-existing reds
(0187 to 0188), b91 listing 0188, and b196's own stderr lines.

## For the pwa seats
WEB-5's pages call POST /api/v2/public/site/visit on each page view (sendBeacon is right: nothing comes back) and
/heart when a visitor hearts or un-hearts a look. WEB-6 reads /site/visitors for its Visitors screen and shows a photo's
`reason` under "Not approved".
