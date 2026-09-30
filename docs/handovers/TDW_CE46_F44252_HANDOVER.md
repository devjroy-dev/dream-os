# TDW · CE-46 · G6-4 · F-44.252 · the shared-way Remove waits for her disconnect · handover

Base 93f054f (carried from 1ed3847; the tip diff of all 9 files SAME). Ruled 30 September 2026, (a) amended for her privacy. Found on the founder's walk the same morning: remove.js
unsubscribed at Remove, which also silenced Meta's account_update, so PARTNER_REMOVED never arrived and the S6 line
("Finish removing ... Disconnect.") could not clear itself. No migration; no pwa change.

- `remove.js`: on the SHARED way no Meta call at Remove; status 'removed', paused_reason 'removed:vendor'.
- HER TOKEN, confirmed by the chair (30 September 2026): on a shared removed row her business token stays SEALED and is kept for
  ONE purpose only, the 7-day unsubscribe; it is opened only through token.js businessTokenFor (b141 1.2), then nulled.
  PARTNER_REMOVED nulls it earlier. No other path reads it on a removed row: turn.js answers only an 'active' row. The MOVED way is unchanged (unsubscribe, deregister, token nulled).
- `events.js`: for a removed number every change but account_update is DISCARDED (never stored, never forwarded, never answered),
  read fresh, not from the map's 60 s cache. PARTNER_REMOVED on a removed row sets 'removed:partner_removed' and nulls the token.
- `removedSweep.js` + `cron.js` (03:45 IST nightly): a shared row still 'removed:vendor' 7 days after removed_at is unsubscribed
  with her kept token; the token is nulled and paused_reason becomes 'removed:swept' (the line retires). A Meta refusal waits for
  the next night; 190, 404 or not-subscribed count as done; a row with no usable token is closed as swept.
- The door's S6 line reads only 'removed:vendor' as waiting (unchanged).

## Rungs
b150 68/0 (§2 re-pinned by label for the shared way; §10 the new behaviour, 11 cells; M3 to M5 re-aimed; M11 and M12 new);
b141 1.2 re-pinned by label (removedSweep.js among the token's namers, opening only through token.js).
scripts/lib/b137_pgdouble.js gains `lt` (for the 7-day window).
