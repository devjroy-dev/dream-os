# repo: dream-os · base a75c2bd · CE-47 · PTN-A2-1 server · handover

What it is: calls to partners (a vendor's collab call goes by email to the partners it fits), the partner's answer
("Suggest someone", by the emailed link or signed in), the partner's page on Collab Hub (hub_profiles owner_kind 'org'),
"Contact <partner>" with Report, and the partner mark in the founder's words. Nothing here charges, counts against a plan
or reaches Razorpay: the plan is A2-2.

Re-based on server train 10 (a75c2bd):
- The per-vendor gate is CLB's src/lib/hub/gate.js hubOpen, required directly. PTN has no gate seam of its own
  (seams.js keeps only createCallFor, addPartnerInterest, onPostCreated, kitFor, verifiedWeddingsFor).
- A2-0's interestRows.js is used as it landed; A2-1 does not ship it.
- src/index.js re-anchored: one line after startCronJobs; the F-44.416 lines in /webhook/razorpay are untouched.

Paths (24 manifest lines, no new folder): see scripts/floor-manifest-ptn-a2-1-srv.txt.
Shared files, by hand on a75c2bd:
- src/api/router.js: one mount, `router.use('/vendor', require('./vendor/partnerContact'));` above the core mount.
- src/index.js: one line after startCronJobs, `require('./lib/partners/sends').register(() => supabase);`.
- src/cron.js: one 14-line schedule block in the estate's form, every 5 minutes (minute 2 onward), Asia/Kolkata, after
  PRO's bill sweep: it drains partner_sends.
- src/lib/partners/orgs.js (A1's, landed): the mark's words and its switch (below).
- scripts/b290_ptn_a1_server_bench.js, amended by label: §10 (10.2 asks kitFor, still not landed; 10.3 "only PTN's own
  files require the seams") and 5.6 (the mark, below).

Migration 0218_partner_calls.sql: partner_sends (one row per partner, call and channel; only the token's sha256 kept;
state queued | sent | held_cap | held_window | held_paused | held_no_key | failed | closed, with why in plain words) and
partner_answers (name, role, link; the name refuses an "@" and any 10 digits; no phone or email column exists). RLS on;
service_role SELECT, INSERT, UPDATE, DELETE on both in the same transaction (e-273). collab_interest.partner_id gets its
foreign key to partner_orgs ON DELETE NO ACTION (not SET NULL: 0197's shape CHECK needs partner_id on every partner row;
partners are blocked, never deleted; accepted by the chair), added NOT VALID then VALIDATE. It waits for the chair's word
with WEB-4's register record.

THE MARK (the founder's words, 7 Oct 2026): "Verified" / "Unverified", one home, orgs.CHECK_WORDS. Shown ONLY while
admin_config 'partners.check_label' is 'on' (one key for both seats; read as CLB reads it: 'on' as text or JSON, any
case). Off, no row, junk or no database: check_words is null at the public partner page, the partner's own area and the
admin (the admin keeps check_state). The app hides a null mark (A1 app r4). The rule itself is with the founder.

Doors (all under /api/v2):
- /partner/calls (GET: calls sent to me, and today's line), /partner/calls/:send_id/suggest (POST)
- /public/partner/call/:token (GET), /:token/suggest (POST), /:token/stop and /:token/pause (POST)
- /vendor/partner-contact/:interest_id (POST: records the connection, never blocks; answers WhatsApp if the partner opted
  in, else email with the call link, else none), /vendor/partner-report (POST). Both 404 a row that is not hers.
- /admin/partners/:id/sends (GET, "What was sent": each call, channel, state in words, and who was suggested, name, role
  and link only). The admin Forward makes a TDW vendor's request her own call (source tdw_forward) through CLB-2a.
- /partner/p/<handle> is untouched and keeps serving until HUB-2's page is live and 'clb.hub' is on.

THE CONTRACT WITH CLB (b292 §13):
- A suggestion on a call whose vendor does not have Collab Hub open answers 403 with CLB's NOT_OPEN sentence, word for
  word (imported from src/lib/collab/interest.js), at both doors, and writes NO row. PTN asks hubOpen BEFORE any write;
  if CLB's own guard in addPartnerInterest wins a race, the answer is still 403 with that sentence.
- Bad input answers 400 in plain words (19 kinds at both doors, from a missing tick to a text body), no row written.
- A wrong link or a call not sent to you: 404. A database failure mid-suggestion: 503 "Could not save just now. Try
  again in a minute.", never a stack. Nothing a partner sends makes a 500; the next request goes through.

Environment (Railway dream-os):
- RESEND_API_KEY. Not set: nothing is sent, Resend is never called, each row waits as held_no_key with "RESEND_API_KEY is
  not set, so nothing was sent." and is tried every 15 minutes; once the key is set the waiting rows go out by themselves
  (b292 4.7, 4.8). The founder will look at Railway.
- PARTNER_MAIL_FROM (optional): default "The Dream Wedding <collabs@thedreamwedding.in>". The domain must be verified in
  Resend before the key is set.
- PARTNER_SESSION_SECRET (from A1): call links are an HMAC of the send id under it.

Sending rules (the drain): a closed call, or a blocked or stopped partner: closed. Paused: held. Outside 9 am to 8 pm IST:
held till 9 am. The partner's daily cap (default 10): held till 9 am. No calls email: closed. A refused send: tried
again, failed after the third. Subject: "Collab call: <needs> in <city>, <date>, <Paid|Credit only>". The body masks any
phone or email in her note; her Instagram is a link; stop and pause links and a List-Unsubscribe header.

No phone or email of a person in any response body (b292 §9 reads the raw bodies). The one exception, confirmed by the
chair: her Contact tap answers the partner's OWN calls address or WhatsApp link, only for a row on her own call (9.8).

WALK CARD (after deploy, before the key):
1. Admin > Partners > a partner > What was sent. A tester's call shows "Not sent: email is not set up yet".
2. A vendor who is not a tester posts a call: no row appears for any partner.
3. Open a partner's emailed link for a closed vendor's call and suggest someone: the page says "The vendor who posted this
   call does not have Collab Hub open yet, so nobody can be put forward on it."
4. Set RESEND_API_KEY. Within 15 minutes (and between 9 am and 8 pm) the waiting rows read "Sent".
5. Open the email: the stop link answers "Calls are stopped..."; no further call arrives for that partner.
6. No partner page, partner area or admin row shows "Verified" or "Unverified" while partners.check_label is off.
