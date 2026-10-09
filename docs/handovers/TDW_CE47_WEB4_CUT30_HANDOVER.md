# TDW · CE-47 · WEB-4 · CUT 30 HANDOVER · R-47.2, a vendor's pictures belong to her (dream-os)

Cut at dream-os `6c25fb3` (server train 16 landed), 9 October 2026. Migration 0223. Rung b301. Both numbers wait for
the chair's word. This is WEB-4's lead cut for the founder's rule of 8 October 2026. The app's admin screens follow as
WEB-4's own app package; FE-9 takes the vendor badges and the Report sheet.

## 1 The rule, and where it lives
`src/lib/vendor/pictureRules.js` is the ONE home. Every door that shows a picture reads it.
- Her own pages (website, storefront, portfolio, looks, media kit, Hub page, Instagram package cards) show every
  picture that is not `held`.
- Discover shows a picture only when it is `passed` and not hidden from Discover.
- The admin's only power is hide from Discover, and its one-tap undo. There is no remove button anywhere. A removal
  for a legal reason is done by hand, logged first, and the vendor is told on her portfolio.
- A Dreamer's report goes to the admin and never hides a picture by itself.
- THE HOLD RULE (the chair's ruling of 9 October, from the founder's dry run) is one constant, HOLD_RULE: hold when
  adult is LIKELY or above, or violence is LIKELY or above. Racy, spoof and medical are read by nothing. On the 78 live
  pictures it holds 0.

## 2 0223 (db/migrations/0223_picture_rules.sql), one transaction
- vendor_portfolio gains safety_state (NOT NULL DEFAULT 'unchecked', CHECK unchecked|passed|held), safety_checked_at,
  safety_scores (Google's five likelihoods, for the admin), discover_hidden_at and discover_hidden_by.
- vendor_look_photos gains safety_state, safety_checked_at and safety_scores. No look reaches Discover.
- picture_reports: one per Dreamer per picture (UNIQUE), with the four reasons and the admin's outcome.
- picture_notices: what she is told on her portfolio, and when she saw it.
- Partial indexes for the sweep (unchecked) and the queue (held).
- RLS on, and the four service_role grants for both new tables, in the transaction (e-273).
- SWITCH DAY (Choice 1): approved becomes 'passed'. Pending and rejected stay 'unchecked'. Rejected is also hidden from
  Discover, by 'switch day: was rejected'.
- approval_state, reviewed_at, reviewed_by_admin and rejection_reason stay as history, read by nothing. A later
  migration drops them once a full train has run with no reader.

S1 (before, read only; the fixed count query from (d) item 10): two rows, the counts by approval_state.
S2 (after 0223; one row):
```sql
SELECT 1 AS rows_expected,
  (SELECT count(*) FROM public.vendor_portfolio WHERE safety_state = 'passed')        AS passed,
  (SELECT count(*) FROM public.vendor_portfolio WHERE safety_state = 'unchecked')     AS unchecked,
  (SELECT count(*) FROM public.vendor_portfolio WHERE discover_hidden_at IS NOT NULL) AS hidden,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.picture_reports'::regclass) AS reports_rls,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.picture_notices'::regclass) AS notices_rls,
  has_table_privilege('service_role', 'public.picture_reports', 'INSERT') AS reports_grant,
  has_table_privilege('service_role', 'public.picture_notices', 'INSERT') AS notices_grant;
```
On 8 October's counts it reads 59, 19, 14, true, true, true, true. If pictures were added since, the first three move
by that many and nothing else does.

## 3 The safety check (src/lib/vendor/safetyCheck.js)
- Google Vision SAFE_SEARCH_DETECTION, on the existing GOOGLE_VISION_API_KEY.
- It runs INSIDE every upload door, before the answer, with a 4-second limit: the vendor portfolio door, a fresh look
  upload in the website room, and the Instagram import (batches of 16).
- A picture it cannot check (no key, no answer, an error) is 'unchecked': live on her own pages, not on Discover.
- The sweep checks unchecked pictures, 64 at a time, every 15 minutes at :13, :28, :43 and :58 (src/cron.js, minutes
  of its own). It writes only a row still unchecked, so an admin's release in between is never undone.
- A look photo picked from her portfolio copies its picture's safety state. Admin uploads are 'passed'.

## 4 The doors (the contract for FE-9, WEB-8 and the admin package)
VENDOR (her session):
- `POST /api/v2/vendor/portfolio`: takes only image_url, caption, aesthetic_tags, is_hero and in_carousel.
  approval_state, source and safety_state sent by her are IGNORED (the chair's ruling 5). source is 'upload' at this
  door. Answer: `{ image }`.
- Each image carries `shown_on_her_pages`, `shown_on_discover` and `notice` (null, or one of the founder's two
  lines). It never carries approval_state or rejection_reason.
- `GET /api/v2/vendor/portfolio/:vendorId[?state=all|held|hidden|shown]` -> `{ images, total, notices: [{ id, line,
  created_at }] }`. The notices are the unseen ones, newest first.
- `PATCH /api/v2/vendor/portfolio/notices/:noticeId/seen` -> `{}`. The notice stops showing.
- The website room's look photos: `review` is now 'shown' or 'held' (it was approved, not_approved or waiting), with
  `notice`. There is no `reason` any more. A look reads 'live' with any photo that is not held. WEB-8 reads `review`.
DREAMER (signed in; requireCoupleAuth at the mount):
- `POST /api/v2/discover/report { vendor_id, image_url, reason, note? }`. reason is one of not_wedding_work,
  not_their_work, offensive or other. Answers:
  - 200 `{ already: false }`, or `{ already: true }` for a second report by the same Dreamer;
  - 400 for an unknown reason or a note over 300 characters;
  - 404 for a picture not on Discover;
  - 401 when she is signed out.
  Discover's cards carry addresses, so the picture is found by vendor and exact address, among Discover's own.
ADMIN (`/api/v2/admin/photos`):
- `GET /queue` -> `{ held: [{ kind: portfolio|look, ... }], reports: [{ reason, reason_line, note, picture, vendor
  }] }`.
- `POST /:id/discover-hide` and `POST /:id/discover-show`: one tap each way.
- `POST /:id/release { kind? }`: the one act on a held picture.
- `POST /reports/:id/handled { outcome: hidden_from_discover | no_change }`.
- `POST /:id/legal-removal { reason, kind? }`: the act is logged first; if the log cannot be written, nothing is
  removed. Then the picture is deleted, and she is told by a notice on her portfolio in the founder's words.
- Every act writes one admin_activity_log line.
- GONE: `/:id/approve`, `/:id/reject`, `/bulk-approve`, and `DELETE /api/v2/admin/vendors/:vendorId/portfolio/:id`.
  The admin vendor-portfolio list now carries `held` and `hidden_from_discover`.

## 5 Every reader moved (both repos' readers were listed in (a); PRO's kit.js, CLB's hub/profiles.js and igCards.js added)
- Discover: couple/discover.js (feed, heroes), couple/taste.js, lib/vendor/discover.js (her preview), profileScore
  (counts what Discover shows).
- Her own pages: public/vendorCard.js (storefront, look photos ×2), lib/site/siteCard.js, lib/brands/kit.js (PRO's
  media kit), lib/hub/profiles.js (CLB's Hub page; its HELD_STATES now ['held'] on safety_state, which also covers
  igCards.js), vendor/collab.js (CLB's hero photo), lib/papers/issue.js (PRO's papers).
- Writers: lib/vendor/portfolio.js, lib/vendor/igImport.js, solutions/siteRoom.js, lib/vendor/firstBuild.js (it
  builds nothing from a held picture), admin/vendorPortfolio.js.
- Counts: portfolioSummary's `approved` now counts what Discover shows; `held` and `hidden` replace pending and
  rejected. admin/discover.js keeps its key.
- A walker cell (b301 4.1) proves no code in src reads approval_state, rejection_reason or reviewed_by_admin, except
  the rule file that strips them from her wire.

## 6 Switch day, in one founder sitting (the founder's Choice 1; the gap ruled)
a. Run S1. Then run 0223 (the backfill is in it). Then run S2.
b. The code, in its train.
c. `railway run node tools/r47_2_switch_day_pass.js`: the sweep, called once by hand. It prints counts only. Every
   picture is then passed or held. Between b and c, the 5 pending pictures show on her own pages for minutes before the
   check, as ruled.

## 7 Proven
- **b301:** 48 passed, 0 failed, with these sections:
  - §1 the rule file, with the chair's threshold pinned (racy VERY_LIKELY is passed; adult LIKELY is held);
  - §2 the check and the sweep;
  - §3 the vendor door over HTTP (approval_state and source sent by her are ignored);
  - §4 every reader moved;
  - §5 the admin doors over HTTP (no remove button; a legal removal is logged first);
  - §6 the Report door over HTTP (it hides nothing);
  - §7 0223;
  - §8 five mutations: racy put back in the rule; the door trusting her body; a report that hides; the log-first guard
    removed; Discover forgetting "hidden". Each reddens its cell.
- **Amended by label** (each cell keeps its shape; "approved" reads "not held", "pending" reads "held", the admin's
  approve reads release):
  - b07_p1 (its fake gains `is()`), b07_p2 (one fixture gains safety_state), b07_p3 (§2.3, §9.1 to §9.4; §10.6 names
    cut 30's one collab line);
  - b10_p3 (its fixture carries safety_state; back to its base two reds);
  - b44 (its fake gains `neq`; §7.1 and §7.3: a held picture is the one her storefront withholds);
  - b196 (§1.5, §1.6, §3.1, §3.2, §4, §5 and §8.8; Google stood in by file name; §9's parser reads IF NOT EXISTS);
  - b197 (§2 and §7.5: a held look photo, the reject door gone, the release; §6's parser), b198 (§9's parser);
  - b240 (10.5: a held photo is refused on papers), b245 (4.3: the kit withholds only held);
  - b263 (§2: source from the door's own argument, her body ignored; §3 and 6.2: both sources live unless held);
  - b271 (1.2: the look photo carries its picture's safety state);
  - b288 (2.1 and 2.6: HELD_STATES is ['held']; M4 now empties it).
- **The differential:** every other rung in the radius exits as it does on 6c25fb3. See the card.
- **scripts/lib/b196_store.js:** gains `not(col, 'is', null)` (the stand-in for the "hidden" filter). Nothing else in
  it moves.

## 8 R-47.1
| Old | New |
|---|---|
| (new, admin) | That picture was not found. / That picture is not held. / That report was not found. |
| (new, admin) | Choose hide from Discover, or no change. |
| (new, admin) | Write the legal reason, in 3 to 300 characters. |
| (new, admin) | The removal could not be recorded, so nothing was removed. Please try again. |
| (new, Dreamer) | Please sign in to report a picture. / Choose one of the reasons. / The note can be up to 300 characters. |
| (new, Dreamer) | That picture was not found on Discover. / Your report could not be sent. Please try again. |
| (gone) | The admin's approve and reject answers, and her rejection reason, which she no longer sees. |

### The founder's lines (approved word for word, 8 October 2026, 21:33; used exactly, changed only on his yes)
| Line | Where |
|---|---|
| TDW is checking this picture. It is not shown yet. | `notice` on a held picture (portfolio and look photos) |
| This picture is not shown on Discover. | `notice` on a picture hidden from Discover |
| This is not wedding work. / This is someone else's work. / This picture is offensive. / Something else. | the four report reasons |
| TDW removed one of your pictures for a legal reason: <reason>. | the notice on her portfolio after a legal removal |
| Hi <person>, would you write a few words about working with <studio>? It takes a minute: <link> | unchanged (8 October) |

## 9 Walk card (WALK-1, on DEV440 / 9888294440 only)
VENDOR: DEV440's own vendor. SWITCH ON FIRST: nothing. (Do it after switch day.)
1 Upload a picture from the phone. SEE: it is on her portfolio and her website at once, with no "waiting" badge.
2 Open Discover as a signed-in Dreamer (9888294440), and open that picture. Use the three-dot menu, then Report, then
  "This is someone else's work." SEE: "sent". The picture is still on Discover.
3 Admin, "Pictures to look at": the report is listed. Tap hide from Discover. SEE: gone from Discover, still on her
  website. In her portfolio: "This picture is not shown on Discover." Tap show on Discover. SEE: it is back.
4 Admin: a legal removal with a reason. SEE: the picture is gone everywhere, and her portfolio shows "TDW removed one
  of your pictures for a legal reason: <reason>." Mark it read. SEE: it goes.
IT FAILED IF: a fresh upload waits for anyone; a report hides a picture by itself; the admin has any remove button
besides the legal removal; she sees an old rejection reason.
