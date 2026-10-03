# TDW · CE-47 · WEB-4 · CUT 10 HANDOVER · the Today summary's three additions (dream-os)

Cut at dream-os `5f51bce` (WEB-4 cut 9 r2 landed), 3 October 2026. Rung **b204**. No migration. Additive only: every key
GET /api/v2/vendor/today-summary had stays, with one shape change the chair ruled (week[].crew becomes objects).

1 · `has_any`: the feed's own meaning (worklistToday.js, F-2): has this vendor EVER had anything, so Today's title line
   needs no feed request. Anything already in hand says true; only on the all-empty path the feed's five head-count probes
   (leads, invoices, events, contracts, team_tasks) are read, together. A failed probe is not a no: true, as the feed does.
2 · `week[].crew` = `[{ name, confirmation }]`: her team members on the event, with the confirmation as the crew read gives
   it (bands.js; crew_confirmations, 0087 D): confirmed, pending or declined; a member with no row reads 'pending'; [] for
   none; another vendor's member never named.
3 · `parts: { counts, reply_to, week, money_due }`: each true when every read it stands on succeeded. A failed part comes
   back NULL, never 0 or [] (week_capped with the week), so the app can say "could not load" and never "nothing".
   counts stands on the two lead counts, the week and the invoices; reply_to on the newest leads, their threads and their
   messages; week on the events, the linked leads, the crew's names and their confirmations; money_due on the invoices.
4 · `responded` (on each reply_to row), in one line: true when the newest message on the WhatsApp thread with that number
   went OUT from her side (her, her team or Eliza); false when the client wrote last or there is no thread yet.
READS: at most ten per call in three stages read together (the crew's confirmations join the second stage). A vendor with
nothing in hand: the five reads, then the five probes (ten, two stages).

## Proven
b204 15/0 (three mutations run: a failed probe read as no; the pending default removed; a failed part sent as []); on the
clean tip 5f51bce 0 passed. b203 22/0 with six cells amended by label to the additions. Differential over the readers of the
door and the source walkers (28 benches), engine built both sides: exits identical; output moved only in b203's labelled cells.
