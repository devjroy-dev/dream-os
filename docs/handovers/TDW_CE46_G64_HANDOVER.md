# TDW · CE-46 · G6-4 · "Your own number", the room finished · dream-os half · handover

Base 7504315 (WEB-1 cut 2 r5), derived by command 28 September 2026. Migration 0182 and rungs b150 (this half) and b151 (dreamos-pwa)
allocated by the chair. Read-first ruled 28 September 2026: F-a (a), F-b, F-c, F-d, F-e, F-f, F-g as proposed; mock approved.

## Meta's rules, read 28 September 2026
- "Onboard WhatsApp Business app users", Offboarding: the Deregister API cannot be used on a number in use with both Cloud API and the
  WhatsApp Business app. She disconnects it in the app (Settings > Account > Business Platform > Disconnect Account); Meta then sends
  account_update PARTNER_REMOVED. The same page carries Meta's banner that Embedded Signup v2 is deprecated on 15 October 2026 (F-h).
- Deregister reference and "Register a business phone number": POST /<PNID>/deregister makes the number unusable with Cloud API; the
  number and its history are not deleted; it is registered again to be used again.
- Graph reference, /<WABA_ID>/subscribed_apps: DELETE, returning { success }.

## What this half does
- `POST /api/v2/vendor/solutions/number/remove` (requireAuth, resolveVendor, mode A; NOT behind the switchboard: a number on file can
  always be removed). `src/lib/ownNumber/remove.js`: her row read fresh; only active or suspended is removable; her token through
  token.js; unsubscribe (both ways), deregister (moved only); a Meta refusal returns `meta_unsubscribe` / `meta_deregister` and writes
  nothing (F-a (a)); 190, 404, "not subscribed" or "not registered" count as already gone. Then one update: status `removed`,
  business_token null, removed_at, paused_reason `removed:vendor`. Never a delete.
- The door: a removed row is not a number on file (`number: null`) and is told as
  `removed: { display_number, way, finish_in_app }`; finish_in_app is true on the shared way until PARTNER_REMOVED (F-c).
- events.js: a removed row stays removed under every account and quality event; GONE on it sets `removed:partner_removed`.
- connect.js: a removed row is reconnected in place (F-d), removed_at, paused_reason and sync_started_at cleared.
- The receiver keeps recording a removed number's events privately until the unsubscribe takes effect; turn.js already answers only an
  `active` row, so a removed number never answers (b150 8.1); wabaMap's loop guard reads active rows only (8.2).
- `vendors.enquiry_routing` is untouched: 'own_number' is a plain link to her phone, independent of TDW answering.

## Apply order
0182 in the SQL editor BEFORE the push (the door selects paused_reason, and remove writes removed_at and 'removed'); its report is the
commented SELECT at the file's foot (two rows). Then the push. Lands after WEB-1's cut 4, as kicked off.

## Rungs
b150 (new); b121 1.3 and b141 1.2 re-pinned by label (the third door; remove.js among the column's namers); b137 unchanged, re-run.
scripts/lib/b137_pgdouble.js gains `delete` (so b150 7.3 can witness F6's replace beside F-d's in-place).

## Owed, by name
- F-h: OWN_NUMBER_EXTRAS_SHARED / _MOVED read on Railway; if the move off Embedded Signup v2 is configuration, it rides this card; if
  code, G6-4's next cut, before 15 October 2026.
- W5 at the walk after landing (Swati's 8595356978 "hi" to 8757788550: no reply, route log "vendor", no dead letter).
- e-222 (owned): a pkill matched the seat's own shell while stopping the mock's dev server; pid-only from here.
