# TDW · CE-47 · WEB-4 · CUT 7 HANDOVER · the website panel's two doors, and the rest (dream-os)

Cut at dream-os `8f2cd0d` (WEB-4 cut 6 landed), re-stamped r2 onto `0af0869` (ELZ-4 C2; none of these paths), 1 October 2026. Rung **b200** (47 cells). Migration **0191** (additive; goes in
BEFORE the push). Built to WEB-7's contract as the chair relayed it, with the chair's rulings.

## The two doors
- `POST /api/v2/public/site-enquiry/:code` (src/api/public/siteEnquiry.js -> src/lib/website/enquiry.js). Origin: https://
  thedreamwedding.in, her own subdomain, or her verified (live) domain with or without www.; anything else, a missing Origin
  included, is the card's one 404 body. Body 4 kB at most. Fields checked in this order, one plain line each: name (1 to 40),
  phone (IN: +91 then 6-9 and nine digits; elsewhere the country's calling code then 6 to 14 digits, checked against
  `country`), occasion (1 to 40), date (optional; not before today in India, not more than 3 years on), consent (true, with a
  version of 32 at most). Writes: the couple_thread by phone (the WhatsApp lane's key, so a later WhatsApp threads with it);
  the lead (source 'website', name, phone, occasion, date, consent time and version; an open lead for vendor + phone touched in
  the last 7 days gains the facts instead, no second lead, no second notice); the first inbound row, channel 'website',
  "Website enquiry: {occasion}, {date or 'no date'}, from {page title or 'the home page'}."; the chat token (32 random bytes
  base64url, only its sha256 kept, bound to vendor, phone, thread and page title, 24 hours); and ONE vendor notice through the
  engine's head (now src/agent/noticeHead.js): "New enquiry from {name} on your website: {occasion}, {date}". No model call.
- `POST /api/v2/public/site-chat/:code` (src/lib/website/turn.js, on ownNumber/turn.js's shape). By the token only: the phone
  and the thread are the token's binding, never the request's. Held ({ ok, replies: [], held: true }, no turn) when
  flag.website_eliza is off, or she has taken over (a vendor_relay row inside her reply_quiet_minutes, the own-number and
  Instagram rule). Otherwise one turn of the couple lane with counterparty { channel 'website', phone, website { page,
  enquireLink } }; the reply is split into items with the own number's splitText and recorded as website outbound rows.
  409 "One moment." while a turn for the token runs; 503 on a model failure, the engine's stand-in, or a turn over 25 s (no
  reply text is invented). No vendor notice: the token lives 24 hours, inside F-44.227's 7 days from door 1's row.
- Limits (in memory per process, keys hashed, no address stored): door 1 per address 10 an hour, per vendor + phone 3 a day;
  door 2 per address 60 an hour, per token 30 a day; both doors per vendor 200 a day, then 429 and one line in the log
  ("[website][founder] ..."). A restart resets the counts.

## The switches (0191 seeds both 'off'; the founder flips them on the switchboard)
`flag.website_chat`: both doors open only when 'on' (or 'armed' for WEBSITE_WALK_VENDOR_ID); off, every call is the 404 ("website
off"). `flag.website_eliza`: Eliza answers the chat only when 'on' (or 'armed' for the walk vendor); off, the chat is held for
her. So after landing nothing answers until he flips them; the walk can arm them for one vendor first.

## Her take-over reply (the chair's ruling, proven by b200 §7)
coupleWaWindow.js now ignores channel 'website' rows, so a website visitor's thread reads no WhatsApp window and her reply
from the app takes today's window-closed path: relaySeat -> sendContentTemplate with the approved template
`enquiry_reply_couple` (her words inside it), falling back to ringDoorbell. Without the line her reply would have gone
free-form to a number that never wrote to the business.

## The engine hunks (now WEB-4's, as ruled)
'website' in resolveCounterparty (with the website fact); LINE_WORD.website "your website"; source 'website'; the persona on
for the website (its own switch is read by its caller); the turn reports `stoodIn` when it used its fixed stand-in. LINE_WORD,
formatPhone and enquiryHead moved verbatim to src/agent/noticeHead.js so engine.js keeps its one export. The prompt
(coupleSystemPrompt.js) carries the website fact on the website only, after the cache breakpoint; every other channel's bytes
are unchanged. b115 re-pinned by label.

## Also in cut 7
Canonical = her own subdomain (the founder); site.trade.row; "Client reviews"; palette swatches; GET /site/collections; GET
/site/credit-lookup. Layouts per section ride when WEB-5 names them.

## Findings
countries-list 3.4.1 holds 252 rows, not 258 (src/lib/website/countries.js, generated, with its tarball's sha256): WEB-7 to check.
Own-number inbound rows (channel 'whatsapp_own') also sit on couple_thread and the window counts them, though they arrive on her
own number, not TDW's: a pre-existing case, not changed here; for the chair.

## Proven
b200 47/0 (three mutations run: the window line, the token's phone, the open-lead rule); on the clean tip 0 passed, 10 failed.
b200r 12/0 on Postgres 16 as the editor. Amended by label: b06_bride_arrival, b06_relay_foundations, b06_relay_hand, b0607 (their
fakes learn .neq), b115 (the re-pin), b160 (trade.row), b196 (canonical). Differential: 118 benches (every reader of a touched
path, the source walkers, the ladder readers), engine built both sides: exits identical; output moved only the ladder top in
b10_p1's pre-existing red.
