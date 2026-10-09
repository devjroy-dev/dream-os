# repo: dream-os · base 5058d8c · CE-47 · PTN-A2-4 · the two notices and the hand message · handover

What it is: the chair's calls of 8 Oct 2026 for A2-4. TDW now sends the two filed templates that A2-3 registered and
left unsent, each at its own door with its own cell, and the Forward page's hand message is version A, the founder's
words of 8 Oct 2026, word for word, with the admin's own first name in it. No migration (0219 holds the switchboard
rows). No Railway value is needed to apply it.

## The pieces
1. tdw_partner_picked, AT THE CONTACT DOOR (src/api/vendor/partnerContact.js). When a vendor taps Contact on a person
   that a partner suggested, and the tap makes a NEW connection, the partner hears it on WhatsApp: the vendor's name,
   the person's name and the date of the shoot. It goes from the MARKETING line, where a partner's replies meet PTN's
   arm. The notice runs after the vendor's answer, so it never delays or changes it; any failure is only logged. A
   second tap on the same person sends nothing.
2. Its gates (src/lib/partners/wa.js notifyPicked), the same as a call's: the partner said yes to WhatsApp; it is not
   blocked; it has not stopped calls; it has not paused them; the time is 9 am to 8 pm, India time; the lane is open
   (the registry AND the switchboard row template.tdw_partner_picked read approved or on).
3. tdw_collab_request_sent, AT THE ADMIN FORWARD DOOR (src/api/admin/partners.js POST /forward). When the admin
   forwards a request for a vendor on TDW, the vendor hears on WhatsApp what she asked for, the city, the date and how
   many partners it went to. The phone is the vendor's own account phone (vendors.user_id, then users.phone), read by
   the sender only and never returned. A vendor outside TDW is not messaged. The admin reads in one line whether she
   was told, and if not, why (the new lines below). A failure never undoes the request.
4. THE LINE FOR tdw_collab_request_sent IS THE VENDOR LINE (src/lib/templates.js, one word: 'marketing' to 'vendor';
   the filed body is unchanged). PTN's call, ruled yes by the chair: she is a vendor, and her reply must meet the vendor
   lane she already uses. A reply on the marketing number would meet the marketing lane, whose sales turn would treat
   her as a stranger and mint a prospect for her. If the chair rules the marketing line, it is this one word and b299
   4.1 and its mutation M4 turn around. RULED by the chair, 8 Oct 2026: the vendor line, once the founder confirms the
   vendor number sits in the same WhatsApp Business Account as the approved template.
   Meta check for the walk: a template is approved on the WhatsApp Business Account, so the vendor number must sit in
   the SAME account as the one where the three templates were approved (WhatsApp Manager > Phone numbers lists both
   numbers when they share one). If they do not, Meta refuses the send; the admin then reads "TDW could not message
   the vendor on WhatsApp. Tell her yourself." and nothing else changes.
5. THE HAND MESSAGE, VERSION A (src/lib/partners/forward.js messageFor), word for word:
   "Hi {name}, this is {sender} from The Dream Wedding. One of our vendors, {vendor}, is looking for {needs} for a shoot
   on {date} in {city}, and I thought of you. The details are here, and you can suggest someone in a minute: {link}
   Happy to answer anything here on WhatsApp too." (the line break before "Happy" is the founder's.)
   {sender} is the first name the admin types on the Forward page (the admin session is one shared password and holds
   no name). The server takes it on POST /forward { sender } and GET /forward/:id?sender=. A name is letters, spaces,
   dots, apostrophes and hyphens, up to 30. WITHOUT A VALID NAME NO MESSAGE IS MADE: every recipient's message is null
   and the answer carries need_sender, the line that asks for the name. The message never has a gap and never reads
   "undefined". {needs} reads "a model", "a photographer", and so on, never doubled ("a a model").
6. scripts/b299_ptn_a2_4_notices_bench.js (new, rung b299).

## Order with the app
The app package (A2-4 app, dreamos-pwa) sends sender and shows the notice line. Land them in one train. If they land
apart, the APP FIRST is safe: the server at 5058d8c ignores sender and keeps today's message. The server first is not:
the old Forward page sends no name, so it would get no message to copy until the app lands.

## R-47.1: every line read, old and new side by side
No line a reader saw before is reworded in this package. The one line replaced is the hand message, and its new words
are the founder's own (the founder's table below), not PTN's.

| File | Who reads it | Old line | New line |
|---|---|---|---|
| lib/partners/forward.js | contact (sent by the admin) | Hello {name}. {vendor}, a {trade} on The Dream Wedding, needs a {role} in {city} on {date}. Budget Rs {from} to Rs {to}. {Paid}. See the request and answer here: {link} | Version A, the founder's words (the founder's table). |

New lines in A2-4 (no old line):
| File | Who reads it | New line |
|---|---|---|
| lib/partners/forward.js | admin | Write your first name before you make the messages. TDW puts it in each message. |
| api/admin/partners.js | admin | TDW told the vendor on WhatsApp that her request has gone to partners. |
| api/admin/partners.js | admin | This vendor is not on TDW, so TDW did not message her. Tell her yourself. |
| api/admin/partners.js | admin | TDW did not message the vendor, because TDW sends WhatsApp messages only between 9 am and 8 pm. |
| api/admin/partners.js | admin | TDW did not message the vendor, because Meta has not approved the message yet. |
| api/admin/partners.js | admin | TDW did not message the vendor, because her account has no phone number. |
| api/admin/partners.js | admin | TDW could not message the vendor on WhatsApp. Tell her yourself. |

Kept, with the reason: "A vendor on The Dream Wedding" (a stand-in for a missing business name in the picked notice)
and "the date on the call" (a stand-in for a missing date). They are values inside the founder's filed sentence, not
sentences. The four WhatsApp replies (waInbound.js) are unchanged; the founder approved them as they stand (8 Oct 2026,
20:52), so they now sit in the founder's table.

## The founder's lines, and the lines the chair approved (word for word; they change only on a yes)
| Where | The line as it stands |
|---|---|
| lib/partners/forward.js (version A, approved 8 Oct 2026) | Hi {name}, this is {sender} from The Dream Wedding. One of our vendors, {vendor}, is looking for {needs} for a shoot on {date} in {city}, and I thought of you. The details are here, and you can suggest someone in a minute: {link} / Happy to answer anything here on WhatsApp too. |
| lib/templates.js partner_picked (filed) | Update on your suggestion: {{1}} wants to talk about {{2}} for the shoot on {{3}}. They will contact you directly. TDW takes no fee and has no part in any fee. |
| lib/templates.js collab_request_sent (filed) | Your request for {{1}} in {{2}} on {{3}} has gone to {{4}} partners. When someone is suggested, you will see it on your call in The Dream Wedding. |
| lib/templates.js partner_call (filed) | unchanged from A2-3 |
| lib/partners/waInbound.js (approved 8 Oct 2026, 20:52) | TDW will send you no more collab calls. To get calls again, reply START CALLS. |
| lib/partners/waInbound.js | TDW will send you no collab calls for one week. |
| lib/partners/waInbound.js | TDW will send you collab calls again. |
| lib/partners/waInbound.js | Thank you for your message. To answer a call, open its View details link. To stop calls, reply STOP CALLS. |
| lib/partners/orgs.js, the mark, "Tick "She asked for this" first.", the opt-in sentence, the 72-hour lines | unchanged from A2-3 |

## R-47.2
No partner page reads approval_state (reported 8 Oct). This package adds no reader of it.

## Proofs in the seat's container (base 5058d8c), every run under TZ=UTC
- b299 (new): 18/0; under TZ=UTC 18/0; 20 of 20 runs green under load (two busy cores). --mutate through scripts/lib/mutation_guard.js, each file restored
  by sha, no marker left: M1 version A made without a name reddens 1.2; M2 the yes gate dropped reddens 3.2; M3 a
  repeat tap notifies again reddens 3.5; M4 collab_request_sent from the marketing line reddens 4.1. Its waits are on
  the thing itself, bounded (the notice's own read of collab_posts.select('event_date'), or its send): no fixed sleep.
- AMENDED BY LABEL, named here: b290 6.5 now pins version A with the sender "Dev"; 6.6 pins that no name makes no
  message and returns the line that asks for it (93/0). b298 1.1 accepts the vendor line for collab_request_sent (27/0).
- docs/TEMPLATES.md rows 19 and 20 say where each template is now sent; row 20 says the vendor line. b64 reads §2's
  slots only, unchanged.
- b07_p5 §7.8 (TDW_06/07's, NOT amended, named here): it enumerates the approved vendor-line templates, and
  collab_request_sent now joins that set. The cell was already red at 5058d8c (the set moved in earlier sittings), so
  the exit is the same. No code chooses a template by its line (searched: src/), so nothing else follows from it.
- Radius, 5058d8c against this tree, each bench alone with its own log and rc: the 55 benches of A2-3's radius with
  b283, b287, b298 and b299 (59). Identical exits and counts except the amended and new ones above.

## Walk card (after deploy; DEV440 / 9888294440 only)
Use only DEV440's vendor and a contact whose phone is 9888294440 ("Test DEV440"); choose no other contact.
1. Forward page: type your first name, forward a request for DEV440's vendor to "Test DEV440" only, between 9 am and
   8 pm. The page says TDW told the vendor; 9888294440 gets tdw_collab_request_sent from the vendor number. The
   person's sheet holds version A with your name.
2. Leave the name empty: the page asks for it, and nothing is sent.
3. tdw_partner_picked is NOT walked with a test partner. RULED (b) by the chair, 8 Oct 2026: no partner signs up on
   9888294440, because the partner lane signs a person in on the same users row as the vendor and would attach a
   partner organisation to DEV440's own sign-in. The picked notice waits for a real partner that said yes to WhatsApp.
4. The email lane is walked the same way: steps 23 to 27 of the email walk are skipped. The first real call to a real
   partner is the proof, read from Resend's "Emails" page and this query in Supabase:
     SELECT state, why, sent_at FROM partner_sends ORDER BY created_at DESC LIMIT 5;
