# TDW · CE-47 · WEB-4 · CUT 3 HANDOVER · the site's public fields, a look's own page, her room, kind words (dream-os)

Cut at dream-os `313fe40`, re-stamped r2 onto `df5457a` (ELZ-4's layer C; no path shared), 30 September 2026. Rung **b196** (77 cells, four mutations run as live doors). No migration;
no SQL. Follow-up 1 (per-style corners, buttons, textures) is FOLDED IN (CE-47's ruling 1): its three files are
byte-equal to the ZIP the chair verified (a8be6984...): styles.js, siteModel.js, b160.

## What shipped
1. **The public card** (src/api/public/vendorCard.js, shaping in src/lib/site/siteCard.js): five named fields join
   CARD_KEYS: `looks`, `collections`, `testimonials`, `faq`, `eliza`. `site` names its shape by `v`.
   Basic: today's card byte for byte, plus `site.v 'classic'`, four empty lists and `eliza` {not_in_plan, not_in_plan};
   its packages keep today's rule. Essential and up read their own rows (each read guarded: a failure is an empty list,
   never a 500) and get the six-style site: style, palette (gated), fonts, motion, finish ids, cover, sections, pages,
   trade words, copy, credit, domain, and `site.seo` {title, description, image 1200 wide, canonical}.
   Rules held: a published look appears only once it has an approved photograph; a cover, band or studio picture shows
   only when it is one of her approved photographs; testimonials approved and the client's own only (request_id or
   submitted_at); video only on Signature and Prestige; collections on Signature and Prestige; Q4 on the styles site
   (a package below her starting price shows no figure); prices follow rate_display. `can`, the tier and the price
   switch are on no card at any depth (b44 2.3b by name, with a control; b196 1.12).
2. **A look's own page**: GET /api/v2/public/vendor-card/:code/look/:slug. Every miss is the card's one 404 body; a
   failed vendor read is the card's own 500.
3. **Her room** (src/api/vendor/solutions/siteRoom.js, under /site): GET /room (stored, resolved, the ids each style
   offers, to_fix.packages_below_starting_price); PATCH /settings (each choice held to her style and plan); PUT
   /sections; PUT /pages (Prestige); looks (create, edit, delete, publish, unpublish; per-look public_state and per-photo
   review); look photos (signed upload into her own folder; add by portfolio id or exact stored address, which carries
   that photo's approval; any other upload waits); collections (Signature and up); PUT /faq; testimonials (list,
   request, revoke, approve, hide, delete; no edit door).
4. **The admin queue** (src/api/admin/photos.js): `?kind=look` runs the same queue and approve, reject and bulk doors over
   vendor_look_photos. The portfolio queue is unchanged. Look photos have no reason column in 0187, so a rejected look
   photo reads "not_approved" with no reason until a later migration adds one.
5. **The client's page** (src/api/public/testimonial.js, /api/v2/public/testimonial/:token): GET the form; POST the words.
   Single use is the database's: one UPDATE marks the request used and nulls its phone only where it is unused,
   unrevoked and unexpired. Try limits in memory per process: 5 POSTs per token in its life; 20 POSTs and 60 GETs per
   address an hour. **A restart resets the counts; the single-use UPDATE still bounds every token.** No address and no
   raw token is stored; only the token's sha256.

## r2 · the chair's three cures and two asks (CE-47, 30 September 2026)
1. **Reads together.** The card's new reads run in two stages (stage 1: her styles row, sections, pages, looks,
   collections, testimonials, questions; stage 2: those looks' photos and those collections' members), not nine in a row;
   a look's page reads the credits' vendors and its package together. b196 1.16 to 1.18 count the awaited stages (a
   Signature card awaits exactly two more than a Basic one) with a control on the meter. The card's and a look page's
   bytes are identical between r1 and r2 for the same stored rows (six answers compared).
2. **India's month.** "Not after this month" on the client's page is India's calendar month (UTC+5:30). b196 6.19 and
   6.20 (00:30 IST on 1 October accepts October; 23:59 IST on 30 September refuses it; across a year's end). The same
   class was looked for in siteRoom.js and siteCard.js: none there. The New mark and the 30-day link count elapsed time,
   not calendar months; the testimonial month is stored and read as a date string with no time zone.
3. **A failed insert no longer burns the link.** The request is released (used_at back to null where the id matches and
   used_at is this write's own timestamp); the phone stays nulled. The client's line changes to "Your words could not be
   saved. Please try again in a moment." (for the veto). b196 6.21 and 6.22.
- **Real column names.** b196 §9 records every column each door WROTE and READ during the whole run and holds them to
  PUBLIC_SCHEMA.md and every migration after its ladder tip (0179 and 0187 among them), with a control (9.3).
- **Video links.** One rule for look videos and client testimonials: youtube.com, www.youtube.com, m.youtube.com,
  youtu.be, instagram.com, www.instagram.com; https; 300 characters at most (b196 6.23).

## For the pwa seats
- The client's page lives at `https://thedreamwedding.in/kind-words/<token>` (the link the request door returns);
  WEB-7 builds that page against the two doors above.
- The request door returns `copy_text`, a message that ends with the link and has nothing after it (R-46.17), and
  `send: 'coming_soon'` when she asks for WhatsApp (R-46.14).

## Wording for the founder's veto (R-45.30)
Room: "The new website is on Essential and up." · "That was not found." · "That could not be saved yet. Please try
again." · "That style is not one of the styles your plan opens." · "Your plan opens {n} styles. Remove one to add
another." · "That colour set is not one of this style's." · "Your own colour is on Signature and up." · "Gradients are
on Prestige." · "That font pair is not one this style offers." · "That choice is not one this style offers." · "Textures
are on Prestige." · "Removing the credit is on Prestige." · "Extra pages are on Prestige." · "Collections are on
Signature and up." · "That section is not on your plan." · "Upload the photo again, then add it." · "A look can hold up
to 12 photos." · "You can have up to 60 looks on your site." · "Add at least one photo first." · "Use a YouTube or
Instagram link." · "Enter the number with its country code, like +91 98765 43210." · "Only words your client sent
through their link can be shown."
Request text: "Hi {first name}, would you write a few words about working with {studio}? It takes a minute: {link}"
Client's page: "This link is not available." · "Too many tries. Please try again in an hour." · "Please tick the box to
let the studio show your words." · "Please write a few words." · "Choose the month of the wedding or occasion." · "Use a
YouTube or Instagram link." · "This studio takes written words only." · "Your words could not be saved. Please try again
in a moment."

## Proven (in the seat; the whole floor is the founder's block F)
b196 66/0 on the cut, including four mutations run as live doors (the carry's vendor scope removed lets another vendor's
photo carry; the single-use guard removed saves the words twice); red on the clean tip 313fe40 (the modules are absent;
it reports and exits 1, no pass). Shifted clocks green. b160 97/0 (follow-up 1). Amended by label: b44 (§2.1/2.2 the five
names; 2.3b and 2.3c `can` at every depth), b55 (the key list), b148 (3.1, 3.3, 3.3b, 4.5).
Differential: the 46 benches that read a touched path or walk the source tree, engine built both sides: exits identical;
output differences only the labelled amendments, b58's emitted-key count (16 to 21, all declared) and timestamps.
