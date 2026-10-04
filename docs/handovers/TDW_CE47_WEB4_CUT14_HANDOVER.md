# TDW · CE-47 · WEB-4 · CUT 14 HANDOVER · two seam bugs from the founder's walk (dream-os)

Cut at dream-os `49cc9f7` (WEB-4 cut 11 r2 landed), 4 October 2026, ahead of cut 13 (the chair's order). Rung **b208**.
No migration.

1 · THE SITE SWITCH: GET /api/v2/public/site-kind/:code (src/api/public/siteKind.js) answered `{ v }`. The app's
    lib/site/kind.ts (WEB-5) takes 'styles' only when `j.ok && j.v === 'styles'`, so every vendor got the classic page,
    even after Publish. The 200 now answers `{ ok: true, v }`. Nothing else in the door changes: the same rule decides v,
    the same cache, the same 404 body.
2 · THE SEO SAVE: PATCH /api/v2/vendor/me refused seo_title and seo_description ("No editable fields provided."): the
    GET read them (G3.1 s2, 0147), the allowlist never let them in. Both join ALLOWED_FIELDS. Each is trimmed; empty or
    only spaces is null (the card door's defaults then speak); over the room's caps (title 70, description 200; 0147's
    CHECKs, counted in characters as the database counts) is a 400 with a plain line, nothing written, never cut short:
    "Your Google title can be up to 70 characters." / "Your Google description can be up to 200 characters."
    Not text: "Your Google title must be text." (and the description's).

## Proven
b208 14/0. The site-kind door driven and its answer read through the app's own rule: published Prestige -> styles;
unpublished and Basic -> classic; no vendor -> the 404, classic; and the door as it was (rebuilt from the cut) answers
{ v: "styles" } that the app's rule still reads as classic: the bug, shown. The real PATCH door driven: both saved trimmed;
empty to null; exactly at the caps saved; one over refused with the plain line; characters not bytes; not text refused; the
pair out of the allowlist reproduces the founder's 400; a save without the pair leaves it alone. Two mutations run.
Clean tip 49cc9f7: 3 passed (controls), 11 failed. b198 40/0 with 6.2 amended by label (the answer is `ok` and `v`).
Differential over the readers of both doors and the source walkers (46 benches), engine built both sides: exits
identical; output moved only in b198's labelled cell.
The founder's block 2 runs each bench on its own exit (no pipe through tail), the lesson from cut 11.
