# TDW · CE-47 · WEB-4 · CUT 26 HANDOVER · the first build from her own photos, and the R-47.1 lines (dream-os)

Cut at dream-os `bcdb364`, 8 October 2026, for server train 13. Rung: b271 (the chair's number; b270 is WEB-8's).
No migration. Twenty paths: eight in src, nine benches and the manifest, two handovers.

## 1 The first build from her own photos (the chair's rulings of 8 October)
(a) TDW's untouched draft, with no new column. The website step now records the `updated_at` it wrote, in its own
step in `vendor_first_builds.steps` (`counts.draft_written_at`). The draft is TDW's and untouched only while all four
of these hold:
- its `updated_at` still equals that stamp;
- that step wrote it with no photos (no looks, no cover slides);
- she has no looks;
- her site was never published or styled.
Every write of hers goes through the room's `saveDraft`, which stamps `updated_at`, so any edit of hers makes the
draft hers for good. Discard deletes the draft, and a missing draft is never TDW's.

(b) `POST /api/v2/vendor/first-build { step: 'website' }` runs only the website step again, inside her latest build,
and fills only under (a). `GET /latest` carries `website_can_fill`. There is no hook on upload. The contract FE-9
builds to:
```
POST /first-build { step: 'website' }
  200 { ok: true, build_id, already: false }   the website step runs again in her latest build (same build_id)
  200 { ok: true, build_id, already: true }    a build is already running; that is its id
  409 { ok: false, error, code }               code WEBSITE_HERS | NO_PHOTOS | NO_BUILD, each with its line below
  400 { ok: false, error, code: 'STEP_UNKNOWN' }  for any step but 'website'
POST /first-build (no step)                    today's full build, unchanged; the answer now also carries `already`
GET  /first-build/latest -> { ok, build: { build_id, state, steps, site_ready, website_can_fill } | null }
```
The flip to running is one guarded UPDATE (`state <> 'running'`), and 0220's unique index refuses a second runner.

(c) A look's `source` now follows its photo: 'instagram' for a photo from Instagram, and 'manual' for every other
photo. **A look's source 'manual' now includes looks TDW made from her uploaded photos.** The look PHOTO's own source
('instagram' or 'upload') is the truth her site's rule reads (`siteCard.showsOnHerSite`). A pending uploaded photo
stays off her public site until it is approved, as before. No migration.

(d) The photos step is skipped only when Instagram is not connected. When her portfolio holds her own photos, the
line is "Your portfolio has 6 photos. We used them for your website." The second sentence appears only when the
website step put them on her draft. If her website was already hers, the line is "Your portfolio has 6 photos."
alone. With no Instagram and no photos, the not-connected line stays.

Two things the chair should know:
- A build recorded before this cut has no stamp. Its draft is treated as hers, so `website_can_fill` is false and
  nothing is filled. A POST would answer WEBSITE_HERS, whose line is not true for a vendor who never edited her
  draft. The app does not call the door when `website_can_fill` is false. Those vendors build their website in the
  room, as they do today.
- An edit of hers in the same millisecond as TDW's write would carry the same stamp. I did not guard against this.

## 2 Proven
- **b271:** 37 passed, 0 failed. The five mutations each redden their cell: the stamp check removed, the look source
  reverted, the photos line not reconciled, the wrote-no-photos condition removed, and the step allow-list removed.
  There are no timing cells.
- **Amended by label, words only:** b148 5b.2; b160 4.7; b196 6.13, 6.16, 6.19; b198 4.2; b200 3.1, 4.8, 4.14, 5.7;
  b261 2.2, 2.3, 2.4, 2.5, 2.8, 5.1; b263 4.2; b264 2.4, 2.5, 5.1, 6.1, 6b.1, 6b.2, 6b.5, and the 8.1 mutation's target.
- **Differential, base `bcdb364` against the cut, radius benches:** b146, b148, b160, b196, b197, b198, b200, b205,
  b20_a2, b261, b263, b264 and b66. Every exit is 0 on both trees, with the same counts.
- **e-274's walkers on the cut, all exit 0:** b07_f0789, b128_g61, b15, b91 and bOB_* ×4. b55 is not due, because
  vendorCard.js does not move.

## 3 R-47.1: the lines in WEB-4's rooms, old beside new
The chair accepted the table of 8 October as written. The lines marked NEW or BEYOND are for the chair's reading.

### The website room (src/api/vendor/solutions/siteRoom.js)
| Old | New |
|---|---|
| The new website is on Essential and up. | removed (no longer used since cut 16) |
| That style is not one of the styles your plan opens. | Your plan does not include that style. |
| Your plan opens N styles. Remove one to add another. | Your plan includes N styles. Remove one before you add another. |
| That colour set is not one of this style's. | That colour set does not belong to this style. Pick one of its own. |
| Your own colour is on Signature and up. | Choosing your own colour is available on Signature. |
| Gradients are on Prestige. | Colour blends are available on Prestige. |
| That font pair is not one this style offers. | This style does not offer that font pairing. Pick one of its own. |
| That choice is not one this style offers. | This style does not offer that option. |
| Textures are on Prestige. | Background textures are available on Prestige. |
| Removing the credit is on Prestige. | Removing the TDW line at the bottom of your site is available on Prestige. |
| Extra pages are on Prestige. | Extra pages are available on Prestige. |
| Collections are on Signature and up. | Collections are available on Signature. |
| That section is not on your plan. | Your plan does not include that section. |
| Upload the photo again, then add it. | That photo could not be found. Upload it again, then add it. |
| Add at least one photo first. | Add at least one photo to this look first. |
| Video testimonials are on Signature and up. | Video reviews are available on Signature. |
| Basic has one style. More styles open on Essential. | Basic includes one style. More styles are available on Essential. |
| Colour sets open on Essential. | Colour sets are available on Essential. |
| Font pairings open on Essential. | Font pairings are available on Essential. |
| Client reviews open on Essential. | Client reviews are available on Essential. |
| Visitor counts open on Essential. | Visitor counts are available on Essential. |
| Too many tries. Please try again in an hour. | You have tried too many times. Please try again in an hour. (BEYOND: "Too many tries." has no verb) |
| NEW, the list of changes before Publish: Style changed / Your styles changed / Colours changed / Fonts changed / Movement changed / Corners changed / Buttons changed / Texture changed / Cover changed / Monogram changed / Site name changed / Words changed / Credit changed / Pages changed | You changed your style. / You changed the styles you picked. / You changed your colours. / You changed your fonts. / You changed how your site moves. / You changed the corners. / You changed the buttons. / You changed the background texture. / You changed your cover. / You changed your monogram. / You changed your site name. / You changed the words on your site. / You changed the TDW line at the bottom of your site. / You changed your pages. |
| NEW: \<Name\> section changed / Your own section section changed | You changed the \<Name\> section. / You changed one of your own sections. |

Kept, because each reads alone as a complete sentence: "That was not found.", "That could not be saved yet. Please try
again.", "A look can hold up to 12 photos.", "You can have up to 60 looks on your site.", "Use a YouTube or Instagram
link.", "Enter the number with its country code, like +91 98765 43210.", "There are no changes to publish.", the
30-day style line, and "Only words your client sent through their link can be shown."

### The first build (src/lib/vendor/firstBuild.js and its door)
| Old | New |
|---|---|
| Skipped: no bio on your Instagram. | Your Instagram has no bio, so we left your About empty. |
| Skipped: no Instagram connected. | Instagram is not connected, so we left your About empty. |
| Eliza needs your city before she can answer about it. | Add your city so Eliza can answer clients' questions. (gaps joined "a, b and c") |
| No Instagram connected, so we added no photos. | Instagram is not connected, so we added no photos. (the chair, 8 October: today's words fail R-47.1; shown only with no Instagram and no photos) |
| This step could not finish. You can add this yourself. | TDW could not finish this step. You can fill in this part yourself. (BEYOND: "this" had nothing to refer to when read alone) |
| Your website could not start building. Please try again. | TDW could not start building your website. Please try again. (BEYOND: a website does not build itself) |
| NEW (d), approved | Your portfolio has 6 photos. We used them for your website. / Your portfolio has 1 photo. We used it for your website. |
| NEW (d), her website already hers | Your portfolio has 6 photos. |
| NEW, the door's refusals | Your website already has your own work, so we left it as it is. (the step's existing line) / Your portfolio has no photos yet, so we did not change your website. / TDW has not made a website draft for you yet. / That step cannot be run on its own. |
| More styles, colour sets and font pairings (opens, with plan Essential) | More styles, colour sets and font pairings are available on Essential. |
| The client reviews section (Essential) | The client reviews section is available on Essential. |
| Collections and the journal (Signature) | Collections and the journal are available on Signature. |
| Your own domain (Signature) | Your own domain is available on Signature. |

The four `opens` lines follow the chair's ruling of 8 October: each is one whole sentence from the server, with its
plan in it. The app shows the line as it is and adds nothing. The `plan` field stays for the app's logic.
Kept: the rest of the first-build lines, which are full sentences.

### Her own domain (src/api/vendor/solutions/domain.js)
| Old | New |
|---|---|
| A search term is required. | The search needs a name. |
| Your own domain opens on Signature. | Your own domain is available on Signature. |
| Your own name is not open yet. | Buying your own domain through TDW is not available yet. (BEYOND) |
| Response failed its contract. | TDW could not show this. Please try again. (BEYOND: build words a vendor can see on a 500) |

### The old website door (src/api/vendor/solutions/site.js), BEYOND
| Old | New |
|---|---|
| More looks are on Essential. | More looks are available on Essential. |
| Your look could not be saved yet. | Your look could not be saved. Please try again. |

### Field limits (src/lib/site/limits.js)
| Old | New |
|---|---|
| Your page hides prices, but this text has a price in it, so it will show. | Your prices are hidden on your page, but this text has a price in it, and that price will show. |

Kept: "\<Field\> can be up to N characters.", "\<Field\> cannot be empty.", "\<Field\> must be on one line.", "You can
add up to N.", and "Write the price as Rs 45,000."

### What a visitor reads: the enquiry on her site (src/lib/website/enquiry.js) and the review form (src/api/public/testimonial.js)
| Old | New |
|---|---|
| Choose a package from the list. | Please choose a package from the list. |
| Please choose a date from today on. | Please choose today's date or a later date. |
| Please send again to agree to the line above Send. | Your enquiry was not sent. Please press Send again to agree to the words above the button. |
| Too many tries. Please try again in an hour. (both files) | You have tried too many times. Please try again in an hour. |
| One moment. | Your last message is still being answered. Please wait a moment. |
| Choose the month of the wedding or occasion. | Please choose the month of the wedding or occasion. |
| Use a YouTube or Instagram link. (the review form) | Please use a YouTube or Instagram link. |
| This studio takes written words only. | This studio accepts written reviews only, not videos. |

Kept: "Please add your name.", "Please add a 10-digit mobile number.", "Please add your mobile number.", "Please choose
the occasion.", "Your enquiry could not be sent. Please try again in a moment.", "Please write a message.", "Your
message could not be sent. Please try again in a moment.", "This link is not available.", "Please tick the box to let
the studio show your words.", "Please write a few words.", and "Your words could not be saved. Please try again in a
moment."

Held, not changed:
- "Not found." in siteEnquiry.js must stay byte-equal to the public card's 404 body (vendorCard.js, not WEB-4's alone,
  and b55's), so that a miss tells the visitor nothing. Both should change together, in one cut the chair names.
- "Lookup failed." in siteKind.js is read by the app's code, not by a person: kind.ts reads only `ok` and `v`.

### The founder's lines (each changes only on his yes)
My record holds no line in WEB-4's rooms that the founder approved word for word. One line was written expressly "to
the founder's veto": it is a message she sends under her own name. It is unchanged here, and the proposal below waits
for his yes.
| Today (siteRoom.js, copyTextFor) | Proposed, for his yes |
|---|---|
| Hi \<person\>, would you write a few words about working with \<studio\>? It takes a minute: \<link\> | Hello \<person\>, \<studio\> would like a few words from you about working together. It takes about a minute to write them here: \<link\> |
The other refusal lines in siteRoom.js and limits.js were listed "for the founder's veto" through the chair (R-45.30)
in cuts 2 to 5. None was approved word for word on my record. If the chair holds a record of his approval for any of
them, name it and I will move it into this table and restore its words.

## 4 Walk card (for WALK-1)
VENDOR: a NEW test vendor on Basic who skips Instagram at set-up. SWITCH ON FIRST: nothing.
1 Skip "Connect Instagram" and let the build run with no photos. SEE: photos "Instagram is not connected, so we added
  no photos."; website "Your website draft is ready to check. It has no photos yet."
2 Upload two photos to her portfolio. Then, on Home, take the offer to build her website from them (FE-9's button,
  shown when `website_can_fill` is true). SEE: the website step runs again and ends with "Your website draft is ready
  to check."; the photos line now reads "Your portfolio has 2 photos. We used them for your website."
3 Open Website. SEE: the draft has her two photos as cover slides and two looks, each a draft. Nothing is published.
4 With a SECOND new test vendor, repeat step 1. Then change the site name in the room, and upload a photo. SEE: no
  offer to build from her photos. Her site name stays as she typed it.
5 Cut 16's card is in TDW_CE47_WEB4_CUT16_HANDOVER.md (added by this cut).
IT FAILED IF: anything is published; the photos line says "not connected" after step 2; her edit in step 4 is
overwritten; or the button is offered after step 4.

## 5 Register
No migration, so there is no record. Records 219 (PTN) and 203 (INS) follow when those seats cut.
