# TDW · CE-47 · WEB-4 · CUT 19 HANDOVER · the first-build door (dream-os)

Cut at dream-os `bf1fc4d`, 6 October 2026, for the server train after 4. Rung **b264**. Migration **0220** (its SQL
before the push). The chair's contract with FE-9's three amendments. No path shared with cut 17 or cut 18.

## The doors (her session; her vendor from it)
- POST /api/v2/vendor/first-build -> { ok, build_id }. One at a time: a second POST while one runs returns the same id
  (and the database holds one running build per vendor).
- GET /api/v2/vendor/first-build/:build_id -> { ok, state, steps: [{ key, state, line, counts, opens }], site_ready }.
- GET /api/v2/vendor/first-build/latest -> { ok, build: { build_id, state, steps, site_ready } | null } (Home).
- Mounted by ONE line in src/api/vendor/core.js: `router.use('/first-build', require('./firstBuild'));` (ruling 1).
- No message is sent to her when it finishes; the app polls every 2 seconds, bounded.

## The five steps (src/lib/vendor/firstBuild.js), in order, each saved as it finishes; a restart resumes
- photos: up to min(20, her remaining portfolio room) through igImport (source 'instagram'). The line names what did
  not fit: "We added 18 of your photos. 6 more did not fit." (counts.no_room too).
- website: her site DRAFT only (vendor_site_drafts): her name, ONE neutral style for every trade, written explicitly
  (gallery, with its default palette and pairing; r2: a style is never tied to a profession, the founder's ruling of
  4 October; the photo rule comes after WEB-8's 30-feed test), three cover
  slides, up to 12 looks (status 'draft', titled "Look N": the import carries no caption, so nothing is invented).
  Skipped, with a plain line, when she already has a site, a draft or looks. On Basic, the step carries
  opens: [{ line, plan }] for the parts her plan does not open.
- packages: ensureSeeded; skipped with "You already have packages, so we left them as they are." if she has any.
- storefront: fills only an EMPTY About, from her Instagram bio (read in this module: fields user_id, username,
  biography; igOAuth untouched). No bio: "Skipped: no bio on your Instagram.", nothing filled.
- eliza: WRITES NOTHING (ruling 2): checks her trade, city and a priced package exist, and names any gap.
NEVER: publishes (looks are drafts; no publish call); overwrites a field she filled; invents a fact.
A failed step says "This step could not finish. You can add this yourself."; the others still run; the build reads failed.

## Proven
b264 24/0: a whole build; nothing published; nothing of hers overwritten; skipped steps carry the server's line; no bio
is skipped; Eliza writes no row; one at a time; latest; a restart resumes without re-importing; a failed step does not
stop the others; Basic's opens; the doors over HTTP (waited on the build's own state, bounded, no fixed pause); 0220;
three mutations. 20 of 20 green under load (e-275). Clean tip: red.
0220 rehearsed on Postgres 16: a second running build refused by the unique index; another allowed once the first is
done; RLS on; the service_role grant.
Differential, 106 benches (readers of core.js, the import, the portfolio, the seeds, the migrations folder, and the
source walkers), engines built: exits identical. Output moved only in b10_p1's ladder top (0217 -> 0220, its own
pre-existing red) and b15's derived count.

## Walk card (for WALK-1)
VENDOR: a NEW test vendor on Basic, with no photos, no packages and no About, and an Instagram account with a bio and at
least 20 photos. SWITCH ON FIRST: nothing on the server; FE-9's screen must be live.
1 Sign up, then connect Instagram. SEE: the build starts by itself; the steps tick in order: photos, website, packages,
  storefront, Eliza.
2 SEE: "We added 20 of your photos." (and "N more did not fit." when she has more).
3 SEE: "Your website draft is ready to check.", with Basic's locked parts shown as "Available on Essential / Signature".
  Open Website. SEE: the Gallery style (the same for every trade), her business name, three cover slides, up to 12
  looks titled "Look 1", "Look 2", all drafts. Open her public site. SEE: nothing published yet.
4 SEE: "We added 3 starter packages."; "We filled in your About from your Instagram bio." (her bio, word for word);
  "Eliza knows your packages and prices."
5 Leave the screen and come back to Home. SEE: "Your business is ready to check".
6 Run it again on the same vendor. SEE: website, packages and storefront left as they are (skipped, each with its line).
IT FAILED IF: anything is published; a field she filled changes; the style differs by trade; a step shows no line; or
Home does not show it after she leaves.
