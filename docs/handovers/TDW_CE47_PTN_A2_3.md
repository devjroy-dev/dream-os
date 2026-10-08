# repo: dream-os · base dae04b0 · CE-47 · PTN-A2-3 · calls to partners on WhatsApp, from the marketing line · handover

What it is: a partner that says yes gets its collab calls on WhatsApp, as the founder's filed template tdw_partner_call,
sent from the MARKETING line (the chair's ruling with the founder's yes, 8 Oct 2026). Its replies are answered by PTN's
own arm in the marketing lane, above the lane's STOP arm, so a partner's STOP stops calls and never opts the number out
of every line. The 72-hour check (ruled into code, 8 Oct 2026) and r3's R-47.1 rewrite of PTN's server lines ride here.
No migration: 0219 (on main, applied) already holds whatsapp_opt_at, whatsapp_opt_words and the template rows.

## The pieces
1. src/lib/templates.js: the three filed templates, bodies byte for byte as filed (the founder's screenshots), Utility,
   line 'marketing', status 'approved' (Meta approved all three on 8 Oct 2026). tdw_partner_call carries its URL button:
   base https://thedreamwedding.in/partner/call/, one suffix, the call's token (the suffix, never the full address).
   tdw_partner_picked and tdw_collab_request_sent are registered and NOT yet sent by anything (see "Not in this package").
2. src/lib/partners/wa.js (new, PTN): the partner's yes (the founder's sentence, word for word: "Send me collab calls
   from The Dream Wedding on WhatsApp, at this number"); the lane (WhatsApp for a partner that said yes and gave its
   number, else email, else none; ONE lane per call); whether the lane is open (the registry AND the switchboard row
   template.tdw_partner_call read approved or on, so a Meta pause shuts the lane by itself); the one send through sendWa.
3. src/api/partner/index.js PATCH /org: takes whatsapp_opt with the partner's own whatsapp_phone. A yes with no whole
   number is refused in plain words. orgs.ownShape shows the partner its OWN number and whether its yes stands.
4. src/lib/partners/sends.js: enqueue makes the row on the partner's lane. The drain carries WhatsApp rows through the
   same gates as email (closed, blocked, stopped, paused, 9 am to 8 pm, the daily cap). A WhatsApp row whose lane is not
   open moves to email with ONE 'lane_changed' line in partner_send_log, or closes when the partner has no email. A number
   opted out on every line closes the row (never retried). Any other refusal is tried three times, then reads in plain
   words; no phone number is kept in the reason.
5. THE 72-HOUR CHECK (sends.js): at the point a row could first be sent (every gate passed, and for email the key set),
   a row made more than 72 hours earlier is closed and never sent. Reason: "This call was not sent. It waited more than 3
   days before TDW could send it." State: "This call was not sent, because it waited too long." (both approved by the
   chair, 8 Oct 2026; words.stateWords draws the state line on every door). A row already tried, or tried again by an
   admin (0219's 'retried' line, one bounded read only for a row past 72 hours), is not a first send and is not closed by
   age. A row waiting for the email key is not closed while it waits.
6. src/lib/partners/waInbound.js (new, PTN) and ONE call block in src/lib/prospects.js (the owner's yes: the chair, 8
   Oct 2026), after the introduction and broadcast arms and above STOP, in their shape. One bounded read of partner_orgs
   by the sender's number, among partners that said yes and are not blocked. Words: STOP CALLS or STOP stops calls;
   PAUSE CALLS pauses them for 7 days; START CALLS or START turns them on; anything else gets the help reply. No prospect
   is made, no words are kept as marketing consent, no sales turn runs, no account is made. Any error in the arm falls
   through to today's lane. vendorInbound.js is untouched.

## The chair's three conditions for the prospects.js block
- THE DIFFERENTIAL over the lane's real bytes (b298 §7): prospects.js at dae04b0 (read from git, compiled at its own
  path) and in this tree, on 7 cases of numbers that are not a partner that said yes (a stranger's STOP; a stranger's
  hello; an opted-out prospect's START; a prospect in session; a broadcast recipient's STOP; a partner number with no
  yes; a blocked partner's number): the same verdict, the same rows written, the same messages sent. The arm costs one
  read of partner_orgs, and none when the broadcast arm answered first. An arm that throws gives today's behaviour.
- THE MUTATION (b298 M1): the arm's match dropped reddens §6.1 "A PARTNER'S STOP MUST NOT OPT THE NUMBER OUT".
- vendorInbound.js untouched: not in this package's paths.

## Railway, for the founder's walk
- MARKETING_PHONE_NUMBER_ID and MARKETING_WHATSAPP_NUMBER must be set on BOTH the dream-os vendor service (the drain
  sends from there) and the marketing service (replies arrive there): Railway > each service > Variables. The number
  ID must equal the marketing number's Phone number ID in WhatsApp Manager > Phone numbers. FINDINGS_LOG records
  MARKETING_PHONE_NUMBER_ID as "still sandbox" on 21 July 2026: confirm it is the real marketing number.
- PARTNER_SESSION_SECRET: whether it is set today cannot be seen from the seat. Railway > the dream-os vendor service >
  Variables shows it by name. Without it a call makes no rows at all (no token for the link), and the Forward door
  answers that forwarding is not open yet.
- Until the sweep reads Meta's APPROVED into template.tdw_partner_call (the nightly run at 03:50 IST, or "Check now" on
  the admin switchboard), the WhatsApp lane reads not open and every call goes by email.

## Not in this package (the chair's call)
- Sending tdw_partner_picked (when a vendor taps Contact on a partner's suggestion) and tdw_collab_request_sent (to the
  vendor when the admin forwards her request). Both are registered and approved. Each is a few lines at its own door
  (partnerContact.js, the admin forward door), with its own cell. PTN proposes them as A2-4, or folded here on your yes.
- The partner's Settings switch for WhatsApp (the app): A2-1 app part 2.

## R-47.1: every line read, old and new side by side (PTN's server rooms)
r3's table, carried and re-checked on dae04b0 (every PTN file was byte for byte the same on dae04b0 as on 3945a69).
One change from r3: "Tick "She asked for this" first." is a ruled line and stays word for word (the founder's table).

| File | Who reads it | Old line | New line |
|---|---|---|---|
| lib/partners/answers.js | partner | Tick "These people have agreed to be suggested for this call" first. | Tick the box "These people have agreed to be suggested for this call" before you send. |
| lib/partners/answers.js | partner | Write at least one name. | Write the name of at least one person. |
| lib/partners/answers.js | partner | Write only a name. No phone number or email. | Write only the person's name. Do not add a phone number or an email address. |
| lib/partners/answers.js | partner | Choose a role this call needs. | Choose one of the roles that this call needs. |
| lib/partners/answers.js | partner | Write the profile link, for example https://www.instagram.com/name | Write a link to the person's profile, for example https://www.instagram.com/name |
| lib/partners/answers.js | partner | Sent. {v} sees them on the call. | Your suggestions are sent. {v} can now see them on the call. |
| lib/partners/answers.js | partner | Calls are stopped. To get them again, sign in and go to Settings. | TDW will send you no more calls. To get calls again, sign in and turn them on in Settings. |
| lib/partners/answers.js | partner | Calls are paused for a week. | TDW will send you no calls for one week. |
| lib/partners/words.js | partner, admin | This call is closed or its date has passed. | This call is no longer open, because the vendor closed it or its date has passed. |
| lib/partners/words.js | partner, admin | This partner account is blocked. Write to partners@thedreamwedding.in. | TDW has blocked this partner account. To ask why, write to partners@thedreamwedding.in. |
| lib/partners/words.js | admin | Calls are stopped for this partner. | This partner has stopped calls. |
| lib/partners/words.js | admin | Calls are paused for this partner. | This partner has paused calls. |
| lib/partners/words.js | admin | This partner has no email for calls. | This partner has not given an email address for calls. |
| lib/partners/words.js | admin | RESEND_API_KEY is not set, so nothing was sent. | Nothing was sent, because RESEND_API_KEY is not set in Railway. |
| lib/partners/words.js | admin | Calls go out between 9 am and 8 pm, India time. | TDW sends calls only between 9 am and 8 pm, India time. |
| lib/partners/words.js | admin | This partner has had its calls for today. | This partner has received all its calls for today. |
| lib/partners/words.js | admin | Collab Hub is not open to this vendor yet, so the call was not sent to partners. | The call was not sent to partners, because Collab Hub is not open to this vendor yet. |
| lib/partners/words.js | vendor | {p} answered for {first}. Contact goes through {p}. | {p} answered on behalf of {first}. To reach {first}, contact {p}. |
| lib/partners/words.js | vendor, partner | Pay not said | Not stated |
| lib/partners/words.js | admin | Waiting to go | This call is waiting to be sent. |
| lib/partners/words.js | admin | Sent | This call was sent. |
| lib/partners/words.js | admin | Waiting: today's calls are used | This call waits for tomorrow, because the partner has received all its calls for today. |
| lib/partners/words.js | admin | Waiting for 9 am | This call waits until 9 am, because TDW sends calls only between 9 am and 8 pm. |
| lib/partners/words.js | admin | Waiting: calls are paused | This call waits, because the partner has paused calls. |
| lib/partners/words.js | admin | Not sent: email is not set up yet | This call was not sent, because email is not set up yet. |
| lib/partners/words.js | admin | Could not be sent | This call could not be sent. |
| lib/partners/words.js | admin | Not sent: the call closed | This call was not sent, because the call has closed. |
| lib/partners/words.js | admin | Resend is still in test mode: it sends only to your own address until the domain is verified. | Resend is still in test mode. Until the domain is verified, Resend sends email only to your own address. |
| lib/partners/words.js | admin | Too many emails at once. Resend asked to slow down. | TDW sent too many emails at once, and Resend asked it to slow down. |
| lib/partners/words.js | admin | Resend could not be reached. | TDW could not reach Resend. |
| lib/partners/words.js | admin | Resend refused it. | Resend refused this email. |
| lib/partners/queue.js | admin | No such send. | This call to a partner does not exist. |
| lib/partners/queue.js | admin | Only a row that could not be sent can be tried again. | Only a call that could not be sent can be tried again. |
| lib/partners/queue.js | admin | This row was already tried again. | This call has already been tried again. |
| lib/partners/queue.js | admin | Set up email first: the row would only fail again. | Email is not set up yet, so this call would fail again. Set up email first. |
| lib/partners/queue.js | admin | The call has closed or its date has passed, so it is not tried again. | This call is not tried again, because the vendor closed it or its date has passed. |
| lib/partners/queue.js | admin | This partner is blocked, so the call is not tried again. | This call is not tried again, because TDW has blocked this partner. |
| lib/partners/queue.js | admin | This partner has stopped calls, so the call is not tried again. | This call is not tried again, because this partner has stopped calls. |
| lib/partners/queue.js | admin | Tried again. It goes with the next send, between 9 am and 8 pm. | TDW will send this call again in its next round, between 9 am and 8 pm. |
| lib/partners/queue.js | admin | Choose waiting, failed, sent or all. | Choose one of these lists: waiting, failed, sent or all. |
| lib/partners/queue.js | admin | Could not read the sends just now. Try again in a minute. | TDW could not read the list of calls just now. Please try again in a minute. |
| lib/partners/queue.js | admin | Could not save just now. Try again in a minute. | TDW could not save this just now. Please try again in a minute. |
| lib/partners/queue.js | admin | Could not read the history just now. Try again in a minute. | TDW could not read the history of this call just now. Please try again in a minute. |
| lib/partners/queue.js | admin | The sender | TDW tried to send this call. |
| lib/partners/queue.js | admin | Tried again | An admin pressed Try again. |
| lib/partners/queue.js | admin | Lane changed | An admin changed how this call is sent. |
| lib/partners/answers.js | partner | Could not save just now. Try again in a minute. | TDW could not save this just now. Please try again in a minute. |
| lib/partners/connections.js | admin | Connections: {used}. Exempt from the plan. | This partner has made {used} connections. TDW does not charge this partner for connections. |
| lib/partners/connections.js | admin | Plan: Rs 2,999 a month. | This partner pays for the plan, Rs 2,999 a month. |
| lib/partners/connections.js | admin | Plan: none yet. After the 3rd, Rs 2,999 a month. | This partner has no plan yet. After its 3rd connection, the plan costs Rs 2,999 a month. |
| lib/partners/connections.js | admin | Connections: 2 of 3 free used. (then the plan line) | This partner has used 2 of its 3 free connections. (then the plan line; past 3: "..., and 5 connections in all.") |
| lib/partners/contacts.js | admin | Write their name. | Write the contact's name. |
| lib/partners/contacts.js | admin | Write how we know them. | Write how TDW knows this contact. |
| lib/partners/forward.js | admin | Write her phone number with the country code, for example +91 98111 00007. | Write the vendor's phone number with the country code, for example +91 98111 00007. |
| lib/partners/forward.js | admin | Write what she needs, for example a model. | Write what the vendor needs, for example a model. |
| lib/partners/forward.js | admin | Choose what she needs from the list. | Choose what the vendor needs from the list. |
| lib/partners/forward.js | admin | Write the city. | Write the city of the shoot. |
| lib/partners/forward.js | admin | Choose the date. | Choose the date of the shoot. |
| lib/partners/forward.js | admin | Write the budget, from and to, in Rs. | Write the lowest and the highest budget in rupees. |
| lib/partners/forward.js | admin | Choose Paid or Credit only. | Choose whether the work is Paid or Credit only. |
| lib/partners/orgs.js | partner | Write the email address calls should go to. | Write the email address where TDW should send calls. |
| lib/partners/orgs.js | partner | Choose paid only, or paid and credit only. | Choose which calls you want: paid only, or paid and credit only. |
| lib/partners/sends.js | partner (email) | Needs: {shape.needs} | The vendor needs {shape.needs}. |
| lib/partners/sends.js | partner (email) | Where and when: {shape.city}, {shape.date_words} | The shoot is in {shape.city} on {shape.date_words}. |
| lib/partners/sends.js | partner (email) | Pay: {shape.pay_words} | The vendor offers this pay: {shape.pay_words}. |
| lib/partners/sends.js | partner (email) | Note from the vendor: {shape.note} | The vendor wrote this note: {shape.note} |
| lib/partners/sends.js | partner (email) | Their Instagram: {shape.vendor.instagram_url} | You can see the vendor's Instagram here: {shape.vendor.instagram_url} |
| lib/partners/sends.js | partner (email) | To suggest someone, open this link: | To suggest someone for this call, open this link: |
| lib/partners/sends.js | partner (email) | Name each person and add a profile link. They show on the call as suggested by {org.name}. | For each person, write their name and a link to their profile. The vendor will see them on the call as suggested by {org.name}. |
| lib/partners/sends.js | partner (email) | The vendor contacts you, not your people. | If the vendor chooses someone, the vendor contacts {org.name}, not the person. |
| lib/partners/sends.js | partner (email) | You get this because {org.name} asked for collab calls on The Dream Wedding. | You are getting this email because {org.name} asked The Dream Wedding to send it collab calls. |
| lib/partners/sends.js | partner (email) | To stop these emails: {calls.stopUrl(token)} | To stop these emails, open this link: {calls.stopUrl(token)} |
| lib/partners/sends.js | partner (email) | To pause them for a week: {calls.pauseUrl(token)} | To pause these emails for one week, open this link: {calls.pauseUrl(token)} |
| api/admin/partners.js | admin | Could not read contacts. | TDW could not read the contacts. Please try again. |
| api/admin/partners.js | admin | Could not save the contact. | TDW could not save the contact. Please try again. |
| api/admin/partners.js | admin | No such contact. | This contact does not exist. |
| api/admin/partners.js | admin | Could not read requests. | TDW could not read the requests. Please try again. |
| api/admin/partners.js | admin | Forwarding is not open yet: PARTNER_SESSION_SECRET is not set. | Forwarding is not open yet, because PARTNER_SESSION_SECRET is not set in Railway. |
| api/admin/partners.js | admin | Choose the vendor again. | TDW could not find this vendor. Choose the vendor again. |
| api/admin/partners.js | admin | The date has passed. Choose a date ahead. | This date has passed. Choose a date in the future. |
| api/admin/partners.js | admin | Choose what she needs from the list. | Choose what the vendor needs from the list. |
| api/admin/partners.js | admin | Could not make her call. Check the details and try again. | TDW could not make the vendor's call. Check the details and try again. |
| api/admin/partners.js | admin | Could not save the request. | TDW could not save the request. Please try again. |
| api/admin/partners.js | admin | No such request. | This request does not exist. |
| api/admin/partners.js | admin | No such recipient. | This person is not on this request. |
| api/admin/partners.js | admin | Could not save. | TDW could not save this. Please try again. |
| api/admin/partners.js | admin | Could not read partners. | TDW could not read the partners. Please try again. |
| api/admin/partners.js | admin | No such partner. | This partner does not exist. |
| api/admin/partners.js | admin | Write why this partner is blocked. | Write why you are blocking this partner. |
| api/admin/partners.js | admin | No such report. | This report does not exist. |
| api/partner/index.js | partner | Something went wrong. Please try again. | TDW could not finish this just now. Please try again. |
| api/partner/index.js | partner | We could not send the code on WhatsApp. Please try again. | TDW could not send the code on WhatsApp. Please try again. |
| api/partner/index.js | partner | Write the 6-digit code from WhatsApp. | Write the 6-digit code that TDW sent you on WhatsApp. |
| api/partner/index.js | partner | No code found. Ask for a new code. | TDW has no code for this number. Ask for a new code. |
| api/partner/index.js | partner | This Instagram handle is already used by a partner on TDW. Write to partners@thedreamwedding.in if it is yours. | Another partner on TDW already uses this Instagram handle. If the handle is yours, write to partners@thedreamwedding.in. |
| api/partner/index.js | partner | Choose to get calls, or to stop them for a while. | Choose whether to get calls or to stop them for a while. |
| api/partner/index.js | partner | Nothing to change. | You have not changed anything. |
| api/partner/index.js | partner | You have had {used} of your {cap} calls today. To stop calls for a while, go to Settings. | You have received {used} of your {cap} calls for today. To stop calls for a while, go to Settings. |
| api/partner/index.js | partner | Only the owner can add people. | Only the owner of this partner account can add people. |
| api/partner/index.js | partner | Write their phone number with the country code. | Write the person's phone number with the country code. |
| api/partner/index.js | partner | Write their name. | Write the person's name. |
| api/public/partnerPublic.js | partner, visitor | This request has ended. | This request is closed. |
| api/public/partnerPublic.js | partner, visitor | This request has ended. Its date has passed. | This request is closed, because its date has passed. |
| api/vendor/partnerContact.js | partner (message from the vendor) |  The call: {link} |  You can see the call here: {link} |
| api/vendor/partnerContact.js | vendor | {o.name} has not given a way to reach it yet. TDW has told no one else. | {o.name} has not yet given TDW a way to contact it. TDW has not shared your request with anyone else. |
| api/vendor/partnerContact.js | vendor | Thank you. TDW will look at this. | Thank you. An admin at TDW will look at your report. |
| api/middleware/requirePartner.js | partner | This partner account is blocked. Write to partners@thedreamwedding.in. | TDW has blocked this partner account. To ask why, write to partners@thedreamwedding.in. |
| api/middleware/requirePartner.js | partner | Please sign in again. | Your sign-in has ended. Please sign in again. |
| api/middleware/requirePartner.js | partner | Add your organisation first. | Add your organisation before you continue. |
| api/middleware/requirePartner.js | partner | Something went wrong. Please try again. | TDW could not finish this just now. Please try again. |

New lines in A2-3 (no old line):
| File | Who reads it | New line |
|---|---|---|
| lib/partners/words.js | admin | This call was not sent, because WhatsApp is not open for this partner and it has no email for calls. |
| lib/partners/words.js | admin | TDW sent this call by email, because WhatsApp is not open for this partner. |
| lib/partners/words.js | admin | This call was not sent, because this number has stopped all WhatsApp messages from TDW. |
| lib/partners/words.js | admin | The marketing number is not set up in Railway. |
| lib/partners/words.js | admin | Meta has not approved the call template. |
| lib/partners/words.js | admin | WhatsApp refused this message. |
| lib/partners/wa.js | partner | To get calls on WhatsApp, write your WhatsApp number with the country code, for example +91 98111 00021. |
| lib/partners/waInbound.js | partner (WhatsApp reply) | TDW will send you no more collab calls. To get calls again, reply START CALLS. |
| lib/partners/waInbound.js | partner (WhatsApp reply) | TDW will send you no collab calls for one week. |
| lib/partners/waInbound.js | partner (WhatsApp reply) | TDW will send you collab calls again. |
| lib/partners/waInbound.js | partner (WhatsApp reply) | Thank you for your message. To answer a call, open its View details link. To stop calls, reply STOP CALLS. |

The four WhatsApp replies are free text inside the 24-hour window the partner's own reply opens. They are PTN's words
under R-47.1; they go to the founder for his yes if you want them in his table.

Lines read and KEPT, with the reason:
- Labels and values, which are not sentences and stand where no sentence is needed: the lanes "Email" and
  "WhatsApp"; the kinds of organisation ("Talent agency" and so on); "A wedding vendor" (a stand-in for a missing
  name); "Not stated" (a value under the heading Pay); "via {partner}" (a tag beside a suggested name); the email's
  subject line "Collab call: 2 models in Delhi NCR, 18 October 2026, Paid"; the sign-off "The Dream Wedding".
- CLB's NOT_OPEN line. It is CLB's words, used by PTN's door; CLB rewrites it in CLB's room.
- Lines that already pass the test and are unchanged:
  "You can suggest up to 5 people at a time." · "Choose what kind of contact this is." · "Write the phone number with
  the country code, for example +91 98111 00031." · "Write the Instagram handle only, for example modelconnect.in" ·
  "Write the website address, for example https://modelconnect.in" · "Write the name of your organisation." ·
  "Choose what kind of organisation you are." · "The sending domain is not verified in Resend yet." · "Resend refused
  the key. Check RESEND_API_KEY in Railway." · "Resend's sending limit for the day or month is used up." · "This
  partner's email for calls is not a valid address." · "Resend had a fault on its side." · "Choose at least one person
  to send it to." · "Write your phone number with the country code, for example +91 98111 00021." · "The code has
  expired. Ask for a new code." · "That code is not right. Please try again." · "Write your name." · "Partner sign-in
  is not open yet." · "You already belong to an organisation on TDW." · "This call was not sent to you." · "This
  partner page does not exist." · "This link does not work. Ask the person who sent it for a new one." · "This link
  does not work. Ask The Dream Wedding for a new one." · "This suggestion is not on one of your calls." · "Choose why
  you are reporting this." · "{vendor}, a makeup artist on The Dream Wedding, has posted a collab call." · "Hello
  {partner}. I am writing about {name}, whom you suggested for my collab call on The Dream Wedding."

ONE LINE THAT STILL FAILS, AND WHY IT IS NOT REWRITTEN HERE: the Forward page's hand message (forward.js messageFor,
"... Budget Rs 3,000 to Rs 5,000. Paid. See the request and answer here: {link}"). The founder approved its
replacement, version A, word for word on 8 Oct 2026. Version A needs {sender}, and the chair's yes on where {sender}
comes from (PTN's proposal of 8 Oct: a first-name field on the Forward page, never a gap) is still open. On that yes,
version A goes in word for word, with a bench cell that pins it. The message is not rewritten in between, because
the founder ruled "Do not reword the default."

The app's twins of these lines are rewritten in the call page package (A2-1 app part 1), with their own table.


## The founder's lines, and the lines the chair approved (word for word; they change only on a yes)
| Where | The line as it stands |
|---|---|
| lib/partners/orgs.js | This partner may charge its own fees. TDW takes no fee and has no part in it. |
| lib/partners/orgs.js (CHECK_WORDS) | Verified · Unverified |
| the mark (app) | Verified means TDW has seen that the organisation is real: its own website or Instagram, and a call with a named person there. · It does not mean TDW vouches for its work, its fees or its people. |
| lib/partners/forward.js | Tick "She asked for this" first. |
| lib/partners/wa.js | Send me collab calls from The Dream Wedding on WhatsApp, at this number |
| lib/templates.js partner_call | Hi {{1}}. {{2}} has raised a request for {{3}} for a shoot on {{4}} in {{5}}. Tap View details to respond. Reply STOP CALLS to stop these messages, or PAUSE CALLS to pause them for a week. (button: View details) |
| lib/templates.js partner_picked | Update on your suggestion: {{1}} wants to talk about {{2}} for the shoot on {{3}}. They will contact you directly. TDW takes no fee and has no part in any fee. |
| lib/templates.js collab_request_sent | Your request for {{1}} in {{2}} on {{3}} has gone to {{4}} partners. When someone is suggested, you will see it on your call in The Dream Wedding. |
| lib/partners/words.js (the chair) | This call was not sent. It waited more than 3 days before TDW could send it. · This call was not sent, because it waited too long. |
| the hand message (A2-1 app part 2) | Hi {name}, this is {sender} from The Dream Wedding. ... Happy to answer anything here on WhatsApp too. (version A, waits on {sender}) |

## Proofs in the seat's container (base dae04b0)
- b298 (new): 27/0; under TZ=UTC 27/0; 20 of 20 runs green under load (two busy cores), its differential compares two
  runs of the lane and holds a clock (e-275). --mutate: 8/0, through scripts/lib/mutation_guard.js, each restored by sha, no marker left (M1 the arm's match dropped reddens §6.1; M2 the 72-hour check dropped
  reddens §5.1; M3 the lane fall-back dropped reddens §4.3; M4 email chosen before WhatsApp reddens §3.1).
- Amended by label (r3's words, carried; b296 2.6 for the WhatsApp lane): b290 93/0 (mutate 2/0), b292 95/0 (mutate
  10/0), b295 41/0 (mutate 8/0), b296 23/0 (mutate 12/0).
- b111 (LCV-15's, AMENDED BY LABEL, named here): its cell 2.1 pinned prospects.js byte for byte. It now reads the file
  with PTN's one block taken out, which is still byte for byte the pinned 46af98d: the stop words, the two lists and the
  lane's own opt-out are unchanged. 28/0 at base and tree.
- docs/TEMPLATES.md §2 gains rows 18, 19 and 20 for the three filed templates (b64, the slot tripwire, compares every
  registered template to its §2 row: 149/0 at base, 164/0 here, the 15 new cells being the three rows).
- THE EMAIL KEY'S ONE WRITER: email.js stays the only writer of held_no_key (b292's M5 still reddens 4.7). The 72-hour
  check runs for an email row only once the key is set.
- scripts/lib/ptn_fakedb.js (PTN's helper): like() and is() added for the marketing lane's two arms; order() keeps the
  first sort key, as PostgREST does.
- Radius, dae04b0 against this tree, each bench alone, detached with its own log and rc: the 43 benches that read
  prospects.js, the template registry, sendWa, PTN's files or ptn_fakedb (the marketing lane's b5c, b66, b71, b75, b68,
  the sendWa gate b05_p2, the switchboard b61, b55, b14 and the rest), with b282, b284, b286, b294 and the e-274 walkers
  (b07_f0789, b128, b91, b15, bOB x4): 55 benches, identical exits and counts, except b64 (149 to 164, the three new §2
  rows) and b111 (amended by label above).

## Walk card (after deploy, and after the founder sets the marketing variables)
1. As a partner, in Settings (app part 2) or by the door: say yes with your WhatsApp number.
2. A vendor posts a call that fits. Between 9 am and 8 pm the partner gets tdw_partner_call from the marketing number;
   View details opens the call page.
3. Reply STOP CALLS: the reply says calls have stopped; the number still gets every other TDW message.
