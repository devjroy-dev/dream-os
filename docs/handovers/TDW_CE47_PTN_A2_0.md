# repo: dream-os · base 813679e · CE-47 · PTN-A2-0 r2 · handover

What it is: ONE new file, src/lib/partners/interestRows.js, exporting partnerRowsFor. A pure mapping for CLB's HUB-2b:
no gate, no send, no door, no write, no migration, no shared file. It lands first in server train 10; HUB-2b requires it
and places the rows on a vendor's Interested list.

FOR CLB, IN WRITING
(a) The signature:
    partnerRowsFor(sb, rows) -> Promise<Array<row>>
    sb    a supabase client. ONE read: partner_orgs (id, name, kind, cities, instagram_handle, website, check_state),
          .in('id', <the partner ids>). No read at all when no partner row is passed.
    rows  collab_interest rows as CLB holds them. Mapped only when source === 'partner' and partner_id is set; every
          other row is ignored and never echoed. Not an array: []. Order kept.
    A failed read throws Error("partnerRowsFor: partner_orgs could not be read (<reason>)"); CLB decides what she sees.
(b) Every field a row returns, in this order, and nothing else (exported as ROW_KEYS and PARTNER_KEYS):
    id           collab_interest.id
    source       'partner'
    name         the suggested person's name, cut to its words (an email or a run of ten digits is removed; a name that
                 was nothing else drops the row)
    role         the role key as stored, or null
    role_word    plain word: model, stylist, studio, or the trade's word (makeup -> "makeup artist"); null when no role
    link         a ready http(s) address, or null. Null also when it carries an "@", a run of ten digits, a login, or
                 is a WhatsApp address (wa.me, whatsapp.com), short links included
    partner      { name, kind_words, cities, instagram_url, website_url }  (ready addresses; the same number and
                 WhatsApp rule on the website and the handle)
    check_words  the partner mark's words for the partner's state, taken ONLY from orgs.CHECK_WORDS (one home).
                 The founder's words (7 Oct 2026) are "Verified" and "Unverified"; they land in orgs.js with
                 PTN-A2-1, and this file needs no change when they do (b293 is green under both). A SEPARATE field,
                 never a label and not inside partner. CLB adds the label only when 'partners.check_label' is on
                 (one key for both seats, off, failing closed until the founder approves the rule). This file
                 reads no switch.
    fee_line     "This partner may charge its own fees. TDW takes no fee and has no part in it."
    Not read and never carried: body, external_user_id, vendor_id, post_id, send_id, platform, how, the partner's
    calls_email or phone. b293 §5 serialises the output of hostile rows (emails and phones in names, bodies, links and
    in the partner's own name, handle and website) and finds no "@", no email shape, no run of ten digits and no
    WhatsApp link.
(c) A BLOCKED partner's row is DROPPED (b293 3.1, and 3.5: only blocked rows in, [] out). A partner_orgs row that cannot
    be found is dropped too (3.2).

Proofs in the seat's container:
- b293: 33/0 (green also with orgs.CHECK_WORDS already reading Verified / Unverified). RED at the clean base (absent subject, 0.0). --mutate 6/0: the blocked filter dropped reddens 3.1; the
  phone strip in names dropped reddens 5.1; the WhatsApp host refusal dropped reddens 5.1 (a short link with no digits
  is the case only it catches). Each restored byte for byte.
- e-274 walkers alone, and the radius (b280 collab v2, b290 partners A1): identical exits and counts at base and cut.
- No timing cell, so no 20-run series (e-275).

Its relation to PTN-A2-1: A2-1 re-bases on train 10's tip and uses this file as it lands. The switch is
'partners.check_label', one key for both seats; CLB reads it.

r2 (7 Oct 2026, the founder's words for the mark): r1's bytes held the old words in one comment, three bench cells
and this handover, and named the wrong switch key. r2 holds no mark words of its own (b293 4.5) and reads them from
orgs.CHECK_WORDS (4.1). The function's behaviour and output fields are unchanged from r1.
