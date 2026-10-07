# TDW · CE-47 · WEB-4 · CUT 18 HANDOVER · F-44.401: an enquiry to a real vendor needs a Dreamer session (dream-os)

Cut at dream-os `d1aeab1`, 6 October 2026. Rung **b262**. No migration. HELD: it lands in the server train AFTER FE-9's
app half is live (EnquirySheet sends her session as `Authorization: Bearer <getAccessToken()>` and stops posting
couple_id, bride_name and bride_phone; a signed-out Dreamer is asked to sign in). Re-stamped onto that train's tip.

## The gap (FE-9 found it)
src/api/couple/enquire.js (POST /api/v2/discover/enquire) took identity from the session if present, ELSE the posted
couple_id (:204), and the phone from that Dreamer's row, ELSE the posted bride_phone (:358). So an enquiry could reach a
vendor with an unverified phone, or under another Dreamer's id.

## The cure (the chair's ruling)
- Identity from HER SESSION ONLY (resolveCoupleIfPresent: the Bearer header, else the `tdw_couple_token` cookie). The
  posted couple_id is never read.
- A REAL vendor needs a Dreamer session: none, or a session that is no Dreamer's: 401 { ok:false, error:"Please sign in
  to send an enquiry.", reason:"sign_in" }, nothing sent, nothing written.
- Her name and phone come from HER ROW only; the real handler is passed no body name or phone.
- DEMO vendors: identity from the session only; a signed-out demo tap stays alert-only, as today.

## Proven
b262 10/0, the real door driven over HTTP (b196_store; only the session resolver stood in): signed out, 401 and nothing
written; a vendor's token, 401; signed in with forged couple_id, name and phone in the body, her own name and phone
reach the lead and nothing anywhere carries the forged three; a signed-out demo tap not refused and never takes the posted
id; two mutations run (the body's couple_id believed again; the body's phone passed again). Clean tip: red.
Amended by label: b38 (Sarah, and each fresh bride its cells name, signed in with her own planted row; the fake upsert
gains the .select().single() the signed-in path uses) and b39 (Sarah signed in; the same upsert chain). Both read
line-for-line as on the clean tip. The nine other door benches were unmoved. b128 green on both trees.
Differential over every reader of the door and the session resolver, b128 and the source walkers (46 benches): exits
identical except b196, which flaked under the run's load. That is main's own flaky 1.16, cured by cut 16 r2; this cut
does not touch it.
