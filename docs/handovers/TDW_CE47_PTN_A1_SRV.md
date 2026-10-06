# repo: dream-os · base d1aeab15bec5 · CE-47 · PTN-A1 server half · handover

What it is: partners as their own kind (never a vendor or a Dreamer), the admin's Partners, Contacts and "Forward a request"
(by hand only), the public partner page and the request link page. Connections are counted, never charged. The WhatsApp
route, calls to partners, briefs, requirements, applicants, the plan and email are PTN-A2.

Paths (22 manifest lines, 2 new folders): see scripts/floor-manifest-ptn-a1-srv.txt. Edited: src/api/router.js (3 mounts),
src/lib/provisionRole.js (role 'partner': users row only, name required when new, no role table).

Doors (all under /api/v2):
- /partner/auth/send-otp, /partner/auth/verify-otp (the vendor line's AUTHENTICATION template; name_required keeps the code)
- /partner/me (GET), /partner/org (POST, PATCH), /partner/people (POST, owner only)
- /public/partner/p/:handle (the partner page; 404 for a blocked partner), /public/partner/request/:token (no phone, no email)
- /admin/partners (tabs unchecked|checked|blocked|reports), /:id, /:id/check, /:id/block (reason required), /:id/unblock,
  /:id/exempt, /reports/:rid/handled, /contacts (GET, POST), /contacts/:id (PATCH), /forward (GET, POST), /forward/:id,
  /forward/recipients/:rid/sent

Seams declared and not called (PTN-A2): createCallFor, addPartnerInterest, onPostCreated (CLB-2a); kitFor,
verifiedWeddingsFor (PRO). b290 §10.3 proves no caller.

Environment: PARTNER_SESSION_SECRET (Railway dream-os). Without it sign-in answers 503 "Partner sign-in is not open yet."
and forwarding answers 503. The forward link is an HMAC of the recipient id under this secret: changing the secret
retires every forward link already sent.

Proofs in the seat's container:
- b290: 93/0; RED at the clean base (absent subject); --mutate (links.js scheme refusals dropped) reddens section 2, restored.
- Differential over 27 radius benches plus the e-274 walkers: identical exits and pass counts at base and cut. Six base
  reds identical both sides, none reading these files (b07_f0772 12.14, b07_f0791 2.2, b08_p1, b10_p1 ladder top, b10_p2,
  b10_p3).
- b128 reddens when one grant is dropped from 0216 (restored).
- Postgres 16, real run: 0216 and 0217 on stub users and vendors, exit 0; a second run is harmless; RLS true on all seven
  tables; service_role holds SELECT, INSERT, UPDATE, DELETE on all seven; 31 CHECK cases (3 good rows accepted, 28 refused:
  javascript:/ftp:/data: websites, handles with a space or "@", the same handle in another case, unknown kinds and states,
  cap 51, a bad email, no how-we-know, a phone without +, "she did not ask", no vendor at all, outside without phone,
  budget to below from, unpaid, a non-sha256 token, two links for one person, an unknown channel, an unknown reason,
  one exchange counted twice, an unknown member role).
