# repo: dream-os · base bcdb364 · CE-47 · PTN-A2-1c r2 · the history of a send (0219), the fold for A2-3, F-44.410 · handover

r2 (the chair, 8 Oct 2026): ONE change, the third template key, from template.tdw_request_sent to
template.tdw_collab_request_sent, the name the founder filed and Meta approved (ID 1665884328396587). Four places: 0219
(the insert and the ROLLBACK), b296 cell 1.6, the Postgres proof's cell 3, this handover. r1 (203c101f) is withdrawn.
Base: the five changed files of r1 were cut on 1e79acc; each is byte for byte the same blob on bcdb364 (git rev-parse),
so nothing else moved.

What it is: the full history of every send, one line per move, kept for good; "Try again" and its line made one
statement in the database; the two WhatsApp opt-in columns and the three template rows folded in for A2-3 (unused until
then); and one finding fixed on the way, F-44.410. Ordered by the chair, 8 Oct 2026. The register's record for 0219 is
WEB-4's, as for 0218.

## Before 0219 (what A2-1b disclosed)
partner_sends.why holds 300 characters and the drain overwrites it on every attempt, so only the LAST reason was kept.
"Try again" wrote "Tried again by <admin> on <date>. Last refusal: <...>" into why, and the next attempt overwrote that.
Nothing older survived.

## 0219_partner_send_log.sql (one transaction, additive)
1. partner_send_log: send_id (cascade from partner_sends), at, kind (drain | retried | lane_changed), state (0218's eight),
   channel (email | whatsapp), attempts, why (300), by_whom (120). Index (send_id, at DESC). RLS on and the four grants
   to service_role in the same transaction (e-273). A trigger refuses UPDATE: a line is never changed. DELETE comes only
   from the cascade (a deleted call takes its sends and their lines).
2. partner_send_revive(p_send, p_by, p_note) RETURNS uuid: the A2-1b guarded UPDATE (WHERE id = p_send AND state =
   'failed') and its log line from the same RETURNING, as ONE statement. LANGUAGE sql, every name schema-qualified, no
   search_path set, SECURITY INVOKER; REVOKE ALL from PUBLIC, anon, authenticated; EXECUTE to service_role only (0211's
   form). queue.js now calls it by rpc instead of its own UPDATE; it answers the id, or null when nothing moved (409).
3. THE FOLD (unused until A2-3): partner_orgs.whatsapp_opt_at timestamptz NULL and whatsapp_opt_words text NULL (300);
   capabilities rows template.tdw_partner_call, template.tdw_partner_picked, template.tdw_collab_request_sent, kind template,
   status pending, ON CONFLICT DO NOTHING; auto_on is not written, so 0149's default false stands. Meta's status event
   (capabilitiesSweep.applyTemplateStatusEvent) moves them; nothing here flips a row.
4. ROLLBACK, by hand only, in the file's last comment.

### 0219 on real Postgres 16 (scripts/lib/ptn_a2_1c_pg_proof.sh; capabilities cut from 0149's bytes and partner_sends
from 0218's, never retyped; the seat's own proof, NOT run on the founder's machine; refuses with exit 3 without Postgres)
    PASS  1 0219 applies, and a second run is harmless
    PASS  2 RLS on, service_role holds SELECT, INSERT, UPDATE, DELETE
    PASS  3 two columns on partner_orgs; three template rows pending, auto_on false
    PASS  4 a log line refuses UPDATE; a deleted send takes its lines
    PASS  5 the revive is refused to anon and authenticated (nothing moved)
    session A got the id 1 time(s); session B got it 0 time(s) after waiting 1544 ms; row: queued 0; log: 1 retried/A/Tried again by A
    PASS  6 two presses at once: one queued row, ONE log line, the other press nothing
    PASS  7 a row that is not failed: nothing moves, no line
    ptn_a2_1c_pg_proof: 7 passed, 0 failed

## The drain's lines (src/lib/partners/sends.js)
One line (kind drain) each time a row's state or reason CHANGES. A row held pass after pass stays one line; a second
refusal with the same words adds none (its try count is on the row). The drain reads the row's state, reason and tries
BEFORE its update, whatever the client hands back. The line never blocks a send: an error or a throw from the log
write is logged ("[partners] send log: ...") and the drain goes on. So pushing before 0219 is applied loses lines, never
sends. WhatsApp rows are still skipped by the drain (A2-2's) and write nothing.

## The log door
GET /api/v2/admin/partners/sends/:send_id/log, behind requireAdmin with every other door there. 404 "No such send." for
a bad or unknown id. Lines newest first, at most 100: at, kind and its words ("The sender", "Tried again", "Lane
changed"), the state and its words, the lane in words, tries, the reason in plain words, Resend's own words beside a
refusal, and who tried it again. No phone and no email.

DISCLOSED: "who" is "admin" for every admin. Admin sign-in is one shared password, its session holds no name, and
req.admin is never set (src/api/admin/requireAdmin.js, src/lib/adminSession.js). The log keeps what the door is given.

## F-44.410 (PTN's, found and fixed here): Resend's own words can carry an address
Resend's test-mode refusal names the account's own email ("You can only send testing emails to your own email address
(x@y.z)"). A2-1b showed Resend's words beside a failed row, and a revived row's why ("... Last refusal: <Resend's
words>"). A2-1's per-partner door showed the raw why. All three would have put that address in an admin body.
Now every reason shown goes through words.providerWords: an email-shaped run reads "an address", and ten or more digits
read "a number". A domain name, a date and plain words are unchanged. The database keeps Resend's words as they came;
only what is shown is cut. Doors covered: GET /sends (A2-1b), GET /:id/sends (A2-1), GET /sends/:send_id/log (here).

## Proofs in the seat's container
- b296 (new): 23/0. §1 0219's text (one transaction; e-273; the trigger; 0211's form; the states are 0218's and have
  words; the fold; nothing else altered; the rollback names every object). §2 the real drain's lines (sent; held four
  passes stays one line; refused, failed, tried again, sent; a log write that errors and one that throws, sends still
  go; WhatsApp writes nothing). §3 the door over real HTTP (401, 404, newest first, words, no address in the raw body).
  §4 F-44.410 on all three doors.
- b296 --mutate: 12/0, through scripts/lib/mutation_guard.js, each restored by sha with no marker left. The six
  mutations: the change test dropped reddens 2.2; the catch rethrowing reddens 2.5; oldest first reddens 3.3; Resend's
  raw words on the log door reddens 3.5; the address cut dropped reddens 4.1; 0219's REVOKE dropped reddens 1.4. The
  series refuses (exit 3) under 512 MB free.
- b295 (amended by label for the rpc): 41/0; --mutate 8/0 (its M1 now takes "AND state = 'failed'" out of 0219's
  function and reddens 5.3).
- Radius, base bcdb364 against r2, each alone, detached with its own log and rc: b282 37/0, b284 48/0, b286 35/0,
  b290 93/0, b292 95/0, b293 33/0, b294 23/0, b295 41/0, and the e-274 walkers (b07_f0789 19/0, b128 13/0, b91 53/0,
  b15 21/0, bOB_d2 76/0, bOB_m 19/0, bOB_micro 32/0, bOB_taxonomy 78/0): identical exits and counts on both sides.
- No timing cell in b296, so no 20-run series (e-275). Lesson 4: nothing reads ../dream-os or any other tree.

## Order on the day
Apply 0219 in Supabase (STEP A in the blocks), then block 1. Either order is safe (see "The drain's lines": without 0219
"Try again" answers 503 "Could not save just now" and the history door 503, and sends go on), but 0219 first means no
line is lost.

## Walk card (after deploy)
1. Admin: a failed row, "Try again". GET /sends/<id>/log shows "Tried again" by admin, then the drain's line when it goes.
2. While Resend is in test mode, a failed row's Resend words read "... your own email address (an address) ...".
