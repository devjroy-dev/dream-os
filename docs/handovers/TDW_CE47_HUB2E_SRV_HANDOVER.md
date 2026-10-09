# TDW · CE-47 · HUB-2e SERVER · "Your page": her page follows her TDW profile, and her pictures come from her portfolio · handover

Base: dream-os 5058d8c (server train 15). No migration, no backfill, no Railway value. For server train 16. Seat: CLB.

## The rulings this carries
- **Read through** (the chair, 8 Oct 2026). Her page shows her name, city and Instagram as her TDW profile says them now. The handle, her page's address /c/<handle>, stays fixed so shared links keep working. The stored copy on hub_profiles is only a fallback.
- **The founder's answers** (8 Oct). Her page follows her TDW profile for name, city and Instagram. She never corrects one fact in two places. Roles, open to, website and pictures are hers to set on "Your page". Her pictures come only from her TDW portfolio, with no second uploader.
- **R-47.2** (the founder, 8 Oct). A picture of hers in vendor_portfolio may go on her page in any approval state, except one the image safety check holds. That held state is not named yet; WEB-4's contract will name it. Until then the rule lives in one function, `pictureOnPage`, with an empty `HELD_STATES` list, so the held state is added in one place. Pictures in looks (vendor_look_photos) are never offered, because only vendor_portfolio is read.

## How it works
- `src/lib/hub/profiles.js`:
  - `livePages(sb, rows)` takes the pages as loaded and, in one query each, reads the vendors rows (name, city, Instagram) and the portfolio rows for those vendors. It lays her current name, city and Instagram over the stored copy and keeps only the pictures still in her portfolio that may be shown.
  - Pages of organisations and people are returned as they are (PTN's hubPage.js keeps those in step).
  - If her vendors row cannot be read, the stored copy shows. If her portfolio cannot be read, her chosen pictures show as stored.
  - A read never writes.
  - `pagePictures(sb, vendorId)`: her pictures that may go on her page, in her portfolio's order (position, then date).
- `livePages` is called wherever pages are loaded: her own page (GET /hub/me and after a save), Work's posters, Mine's names and posters, People (before the city chip filters, so a vendor who moved is found under her city now), waiting requests, and the public page with every name on it.
- `GET /api/v2/vendor/hub/me/pictures` (new): her pictures to choose from, each with `on_page`, and `most: 12`.
- `PATCH /api/v2/vendor/hub/me`:
  - `work_urls` must be pictures of hers from that list, kept in the order she chose, at most 12.
  - `city`, `display_name` and `instagram_handle` are refused with a sentence that says where to change them.
  - Roles, open to and website work as before.
  - A save answers with a line.
- Cost: on each Hub door that shows pages, one query to vendors and one to vendor_portfolio, by the ids of the pages on that screen.

## Pages already made
Nothing is migrated. From the day this lands, every vendor page shows her current name, city and Instagram, because they are read through. The pictures stored on a page before today are shown only if they are still in her portfolio. No vendor has set any yet, since no app screen called the door.

## R-47.1: the new lines (no old line changes)
| Where | Old line | New line |
|---|---|---|
| After she saves her page | | Your page is saved. |
| She picks a picture that is not hers | | You can choose only pictures from your TDW portfolio. |
| She picks more than 12 | | You can choose up to 12 pictures. |
| The door is asked to change her name, city or Instagram | | Your name, city and Instagram come from your TDW profile. Change them there. |
| Her portfolio cannot be read | | Your portfolio could not be read. Please try again. |

## Files
- CHANGED `src/lib/hub/profiles.js`: `livePages`, `pagePictures`, `pictureOnPage`, `HELD_STATES`, all exported.
- CHANGED `src/api/vendor/hub.js`:
  - GET /me reads through.
  - New GET /me/pictures.
  - PATCH /me checks pictures against her portfolio, refuses name, city and Instagram, and answers with its line.
  - Work and Mine read through. `MAX_PICTURES = 12`.
- CHANGED `src/lib/hub/people.js`: People reads through before the city chip filters; waiting requests read through.
- CHANGED `src/api/public/hub.js`: her page and every name on it read through.
- ADDED `scripts/b288_hub2e_server_bench.js`:
  - §1 read through (1.1 to 1.7) and §2 pictures (2.1 to 2.6, where 2.6 is the one home of the picture rule).
  - §3 her fields (3.1 to 3.3) and §4 the words.
  - §5 mutations M1 to M6 through scripts/lib/mutation_guard.js, with free space checked first and nothing pending after.
- ADDED `scripts/floor-manifest-ce47-hub2e-srv.txt`, this handover, and the b288 ledger.
- No bench is amended: b283, b284, b286, b287 and b282 stay green as they are.

## Proof (on 5058d8c; each run its own log, one at a time, under env -u ANTHROPIC_API_KEY -u DEEPSEEK_API_KEY)
- b288 25/0: 17 cells, 5.0, M1 to M6 each reddening the cell it names, and 5.9. It ran 20 times under load (b290 and b292 looping, green the whole time), 20 of 20 green; the ledger is docs/handovers/b288_ledger_HUB2E.txt.
- Unchanged and green: b287 21/0, b283 42/0, b284 48/0, b286 35/0, b282 37/0, b280 53/0.
- PTN's benches, which read profiles.js through hubPage.js: b290 93/0, b292 95/0, b293 33/0, b294 23/0, b295 41/0, b296 23/0, b298 27/0.
- e-274 walkers green: b07_f0789, b128, the four bOB, b15, b91.
- Lesson 1: a grep of scripts/ for profiles.js, people.js, vendor/hub.js and public/hub.js found b282 to b288 and PTN's b290 to b298. All of them were run.
- No mutation was left pending after any run.
