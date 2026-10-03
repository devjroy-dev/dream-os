# TDW · CE-47 · WEB-4 · CUT 9 r2 HANDOVER · Today's slim summary, Check a date's enquiries, one stored line (dream-os)

Cut at dream-os `6e43161`, carried r2 onto `bb60f31` (ADS-2's server cut; none of these paths), 3 October 2026.
Rung **b203** (b202 is FE-8's on dreamos-pwa). No migration. r2 folds in FE-8's six gaps as the chair ruled them.

## 1 · GET /api/v2/vendor/today-summary (src/api/vendor/todaySummary.js; mounted in vendor/core.js)
Behind her session (requireAuth, resolveVendor()); read-only. One response:
    { ok, today: 'YYYY-MM-DD' (India; the feed's own date),
      counts: { new_leads, open_leads, reply_waiting, reply_waiting_capped, events_this_week, invoices_due },
      reply_to: [ { lead_id, name, phone, conversation_id, responded, last_message: { body, at, channel } } ]   3 max
      week: [ { id, title, date, time, kind, state, linked_lead_id, place, crew: [names] } ]                    20 max
      week_capped,
      money_due: { total, count, overdue_count, next: { id, client_name, due_date, amount_due } | null } }      (rupees)
- reply_to / reply_waiting (gaps 1, 2): the worklist feed's lead_unanswered set (leads in 'new', not deleted; leadFeed.js),
  her newest first, including an enquiry with no thread (conversation_id null; the message is its raw_message, 140 max, at
  created_at). With a thread: its newest message. reply_waiting is an exact count, so reply_waiting_capped is false.
  responded (the per-row flag Today reads): true when the newest message on her thread with that number is hers.
- week (gaps 4, 5): today and the seven days after, in India; not deleted; 20 max with week_capped. place = the event's
  notes (first line), else the linked lead's wedding_city, else null; crew = her team members' names on it, [] for none.
- money_due (gap 6): EVERY invoice in 'unpaid' or 'advance_paid' (invoices.js's total_outstanding rule), read whole as
  invoices.js reads it: no aggregate read is enabled on this estate (none anywhere in src). count = DISTINCT clients owing
  (client_id, else lead_id, else the client's name); overdue = a due date before today; next = the earliest due.
- READS: at most nine per call, in three stages read together: five (two counts, the newest three unanswered, the week,
  the owed invoices); then up to three (their threads by phone, the linked leads' cities, the crew's names); then one (the
  newest messages of those threads). Five on an empty account. A failed part answers empty, never a 500.
Today can drop the today feed for these parts: `today` is the feed's date; `responded` is the per-row flag.

## 2 · Check a date (gap 3): GET /api/v2/vendor/day/:vendorId/:date (src/api/vendor/day.js, the door fetchDay calls)
Now also answers `enquiries: [{ lead_id, name }]` (her OPEN leads, 'new', 'contacted', 'quoted', not deleted, whose
wedding_date is that day; newest first; 20 max) and `enquiries_capped`. A decoration leg: a failed read is [] and false.
Every key the day door had is unchanged (b105 4.1 amended by label to take only the two new keys off before comparing).

## 3 · The stored Discover line
src/api/couple/enquire.js writes notes "Discover enquiry: found you on the feed." on a NEW Discover lead. Rows written
before keep "Discover enquiry — she found you on the feed."; no backfill. (b36's fixture keeps the old line: an old row.)

## Proven
b203 22/0: the shape against planted rows (each gap a cell), the reads (nine in three stages; still nine with 400 more
leads, events and invoices, money due counting every invoice; five on an empty account), failed parts empty, the day door's
enquiries run from its own source (20 with the flag; lost and other vendors' leads out; a failed read [] and false), no
session 401 from the real requireAuth, the mount, the stored line, two mutations run. On the clean tip: 0 passed.
b105 67/0 (by label), b196 to b200 and b36 green. Differential on the combined tree (readers of every touched path and the
source walkers): exits identical; output moved only b46's printed byte offset of the /money mount in core.js.
