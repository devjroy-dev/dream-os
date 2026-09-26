# CE-45 · ELZ-1 · F-44.176 · THE STUDIO'S NAME ON TDW'S SHARED LINE · HANDOVER

Base 727ed5c. The founder's choice, 26 September 2026: "a. make sure that this prefix is only there when the tdw shared line is used. not for
vendor own number". Rung b131.

## What shipped

src/lib/vendor/relayToCouple.js only. A relay or quote sent to a couple FROM TDW'S SHARED LINE opens with "{studio}: " (his bytes), studio being
the vendor's business_name, else name; no name, no prefix; a text already opening with the studio's name is not prefixed twice. The prefix is
decided by the NUMBER THE SEND LEAVES FROM: only when it is VENDOR_WHATSAPP_NUMBER. Today every direct relay leaves from that number; a send from
a vendor's own number (G6, when relays route there) carries none, with no second change. The prefixed string is both what is sent and what the
couple_thread row records; the draft row keeps the approved bytes. The window-closed template path is untouched (its template names the vendor).

## Proof

b131 12/12 (the real relayToCouple driven; the own-number, no-name and no-double cells; the template path and the staging seat untouched;
two mutations red). Re-pinned by label, sent == "{studio}: " + stored: b06_relay_hand (§3.3's anchor, §13.6), b101 4.4, b114 1.3, b118b 1.2 and
2.2; b113 2.3 re-aimed (coupleDrafts.js untouched since 90f607d; relayToCouple.js changed only here). The differential at 727ed5c (27 benches,
engine built both sides): only b131 differs; b39 (32/34) and b59 (105/1) identical on both sides, pre-existing.

## Walk

To be recorded: "Tell Sarah ..." from the app or WhatsApp; the handset shows "Dev Roy Photography: ..."; her thread row holds the same text.
