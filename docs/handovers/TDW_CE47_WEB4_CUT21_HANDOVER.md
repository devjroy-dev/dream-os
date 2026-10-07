# TDW · CE-47 · WEB-4 · CUT 21 HANDOVER · the first build with no Instagram (dream-os)

Cut at dream-os `68b6568`, 6 October 2026, for server train 6 (with cut 20). Rung: b264 extended by label (§6b). No
migration. Only src/lib/vendor/firstBuild.js and b264 change (with this handover and the manifest). No path shared with
cut 20 (ig.js, igOAuth.js, pwaPaths.js, b77, b265) or cut 18 (enquire.js, b38, b39, b262).

## What changes (src/lib/vendor/firstBuild.js)
- photos, no Instagram token: SKIPPED (was failed), "No Instagram connected, so we added no photos.", counts
  { imported: 0, no_room: 0 }.
- storefront, no Instagram token: SKIPPED, "Skipped: no Instagram connected."; a connected account with an empty bio keeps
  "Skipped: no bio on your Instagram.".
- website: still builds her draft from what her portfolio holds; with no photos at all the line is "Your website draft is
  ready to check. It has no photos yet." (plain, never a promise).
A build with no Instagram now ends 'done', not 'failed'. A real failure (Instagram connected, Meta down) still reads
failed, unchanged.

## Proven
b264 30/0, 20 of 20 under load (e-275). §6b: the whole no-Instagram build (no step failed; every skipped step carries a
line; the build done; nothing published), each line as ruled, and the empty-bio line kept. Against main's firstBuild.js:
26 passed, 4 failed (the new cells). The source walkers (28): exits and output identical on both trees.

## Walk card (for WALK-1, inside FE-9's two-minute card)
VENDOR: a NEW test vendor on Basic who skips Instagram at set-up. SWITCH ON FIRST: nothing.
1 Skip "Connect Instagram" and let the build run. SEE: photos "No Instagram connected, so we added no photos."; website
  "Your website draft is ready to check. It has no photos yet."; packages "We added 3 starter packages."; storefront
  "Skipped: no Instagram connected."; Eliza's line.
2 SEE: the build ends as finished (Home: "Your business is ready to check"), not as failed. Her public site: nothing
  published.
IT FAILED IF: any step reads failed; a skipped step shows no line; or anything is published.
