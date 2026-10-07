# repo: dream-os · base 2d349dc · CE-47 · PTN-A2-1b · waiting and sent, every partner; trying a row again · handover

What it is: two admin doors and one home for the words, so the admin sees what is WAITING before anything is sent, and
a row stopped at three refusals is never the end. No migration, no new table, no Railway value, no shared file outside
PTN's own.

Doors (both on the /api/v2/admin/partners router, behind the same requireAdmin as every other door there):
- GET /api/v2/admin/partners/sends?show=waiting|failed|sent|all (default waiting). Every partner's rows, newest first,
  at most 200: the partner (id, name), the call (who, what, city, date in words), the lane in words (channel is a
  column: "Email" or "WhatsApp", so WhatsApp rows join this list as they are, no second door), the state in words, the
  reason in plain words, Resend's own words beside it on a failed row, tries made, the next try, can_retry. A show that
  is not one of the four: 400 "Choose waiting, failed, sent or all." No phone and no email of anyone in the body.
  Declared before /:id, so "sends" is never read as a partner id; a real id still opens its partner.
- POST /api/v2/admin/partners/sends/:send_id/retry. Tries ONE row again, and only a 'failed' one: back to queued,
  tries to 0, next try now. The drain takes it on its next pass, and 9 am to 8 pm and the partner's daily cap still
  bind it (a revive at 10 pm waits for 9 am; over the cap it waits for tomorrow). Refused, writing nothing:
  404 "No such send."; 409 "Only a row that could not be sent can be tried again."; 409 "Set up email first: the row
  would only fail again." (email row, no RESEND_API_KEY); 409 "The call has closed or its date has passed, so it is not
  tried again."; 409 for a blocked partner or one that stopped calls. Two presses at once: one moves the row, the other
  answers 409 "This row was already tried again." Success: "Tried again. It goes with the next send, between 9 am and
  8 pm."
- GET /:id/sends (A2-1's per-partner list) now also carries lane_words, why_words, attempts and can_retry.

THE ONE GUARDED UPDATE: queue.js sends exactly one UPDATE, through PostgREST:
  UPDATE partner_sends SET state='queued', attempts=0, not_before=now, why=<note>, updated_at=now
  WHERE id=$1 AND state='failed' RETURNING id
Proven on real Postgres 16 against partner_sends cut from 0218's own bytes (scripts/lib/ptn_a2_1b_pg_proof.sh; not a
bench, needs Postgres, refuses with exit 3 without it):
  session A returned 1 row(s); session B returned 0 row(s) after waiting 1546 ms on A's lock; the row now: queued 0 Tried again by A
  a third press after both: 0 row(s)
  PROVED: two presses at once make one queued row

THE PLAIN WORDS (src/lib/partners/words.js, one home: SEND_WORDS moved here from the admin door, LANE_WORDS, and
failureWords), matched on the messages Resend documents (resend.com/docs/api-reference/errors, read 8 Oct 2026):
the domain not verified; Resend still in test mode; the key refused (missing, not active, suspended); the daily or
monthly limit used up; too many at once; a partner's email that is not an address; a fault on Resend's side; Resend
unreachable; anything else "Resend refused it." with Resend's own words kept beside.

THE HISTORY, DISCLOSED: partner_sends.why holds 300 characters (0218) and the drain overwrites it on every attempt, so
it holds only the latest reason. The revive writes "Tried again by <admin> on <date>. Last refusal: <...>" into why
(within its 300), which the next attempt overwrites. A full history (every try, every revive, who and when) needs its
own append-only table: 0219_partner_send_log, proposed to the chair on 8 Oct 2026, not in this package.

Lessons:
- 4 (the sibling): nothing here reads ../dream-os or any other tree.
- 5 (F-44.419): b295's mutations go through scripts/lib/mutation_guard.js (brought from dreamos-pwa 4572df0 byte for
  byte, sha 0e425e6d684d1863...; its own --selftest 11/0 here): the kept copy and marker are written first, every start
  recovers by sha, every restore is checked by sha. A --mutate child skips recovery (the marker it would see is its
  parent's live mutation). The series refuses (exit 3) with under 512 MB free. Proven: --mutate was killed with
  SIGKILL mid-mutation; the marker and kept copy stayed (git status shows them, by design); the next plain run
  printed "a pending mutation from a killed run was restored by sha: src/lib/partners/queue.js", queue.js was back to
  its sha, and no marker remained.

Proofs in the seat's container (base 2d349dc):
- b295: 41/0. §1 over real HTTP: no token 401, a vendor's token 403, a partner's token 403, each with no list and
  nothing written; an admin's opens. §2 the order. §3 the list (waiting newest first; failed, sent, all; a bad show
  400; the WhatsApp row in the same list; the plain words; the raw body holds no email and no phone). §4 seven
  refusals, each writing nothing. §5 two presses at once, one queued row. §6 through the real drain: revived at 10 pm
  waits for 9 am; over the cap waits; at noon under the cap it goes. §7 fail three times, revive, fail three times,
  revive again, then it goes. §8 the words against Resend's documented messages. §9 the per-partner door.
- --mutate 8/0: the state='failed' guard dropped reddens 5.1; /sends declared after /:id reddens 2.1; the closed-call
  refusal dropped reddens 4.4; the domain words dropped reddens 8.1; each restored by sha, no marker left.
- Radius base against tree, each alone: b282 37/0, b284 48/0, b286 35/0, b290 93/0, b292 95/0, b293 33/0, b294 23/0,
  and the e-274 walkers (b07_f0789 19/0, b128 13/0, b91 53/0, b15, bOB): identical exits and counts.
- No timing cell, so no 20-run series (e-275).

WALK CARD (after deploy):
1. Admin, open GET /api/v2/admin/partners/sends from the app's coming "Waiting and sent" screen (A2-1 app package);
   until then the founder's read-only look (partner_orgs joined to partner_sends) shows the same rows.
2. A failed row reads "Could not be sent" and, while the domain is unverified, "The sending domain is not verified in
   Resend yet."
3. Fix the cause, press Try again: the row reads "Waiting to go"; it goes on the next pass between 9 am and 8 pm.
