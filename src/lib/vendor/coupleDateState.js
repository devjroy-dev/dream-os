'use strict';
// src/lib/vendor/coupleDateState.js  FACT 3: A DATE'S STATE FOR ELIZA. CE-45 ELZ-1 cut 1 (R-45.25; R-45.26(1); F1-r2 as ruled).
//
// WHAT IT ANSWERS. A couple asks the studio about a date. Eliza calls the date_state tool with the date AS THE COUPLE WROTE IT
// (the model is the ear for WHICH words are the date: a date grammar over her whole sentence was refused on evidence, because
// "we are 2 of us, budget 5 lakh" read as 2 and 5 October). Code answers WHAT the date's state is and nothing else: a fact in her
// turn, never a sentence (R-45.26(1)).
//
// ONE READER, THE /v PAGE'S (R-40.77, R-45.25): the same gates, in the same order, as src/api/public/availability.js's route:
// the vendor active and not paused, vendors.date_check_enabled true, then describeDate and verdictOf. An occupancy-off trade with a
// known answer is refused by that route (it 404s), so here it is check_off. verdictOf is IMPORTED, never restated (b58's lesson:
// a copy of the thing it guards tests the copy).
//
// THE FOUR STATES (the chair's ruling on F1-r2):
//   free       the check is on and the whole day is open: not blocked, no slot sold out, nothing held
//   taken      blocked, sold out, part of the day held, or it could not be checked just now (she never says booked: R-45.25)
//   check_off  the vendor has not switched the date check on (or is inactive, paused, or the route would refuse)
//   unreadable the words are not a date the estate can read
// NO WRITE: public.date_checks is the public door's record of strangers' checks (recordCheck, its sole writer); a couple's question
// on WhatsApp is not one. TOTAL: never throws; every failure is 'taken' (unknown is not free) or 'unreadable'.
const { resolveSpokenDate } = require('./spokenDate');

const STATES = Object.freeze(['free', 'taken', 'check_off', 'unreadable']);

// The verdict (availability.js verdictOf's shape) to a state. Exported for b117a.
function stateOfVerdict(v) {
  try {
    if (!v || typeof v !== 'object') return 'taken';
    if (v.blocked === null || v.blocked === undefined) return 'taken';
    if (v.blocked === true || v.sold === true || v.any_held === true) return 'taken';
    return v.blocked === false ? 'free' : 'taken';
  } catch (_e) { return 'taken'; }
}

async function dateState({ supabase, vendor, dateAsSpoken, nowMs } = {}) {
  let iso = null;
  try {
    const said = typeof dateAsSpoken === 'string' ? dateAsSpoken.trim() : '';
    if (!said) return { date: null, state: 'unreadable' };
    const d = resolveSpokenDate(said, { direction: 'future', nowMs: Number.isFinite(nowMs) ? nowMs : Date.now() });
    if (!d || !d.ok || typeof d.iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.iso)) return { date: null, state: 'unreadable' };
    iso = d.iso;
    if (!supabase || !vendor || !vendor.id) return { date: iso, state: 'taken' };

    // The route's gates, read fresh from the row (the vendor object a caller holds may be partial).
    const { data: row, error } = await supabase
      .from('vendors')
      .select('id, status, discover_paused, date_check_enabled')
      .eq('id', vendor.id)
      .maybeSingle();
    if (error || !row) return { date: iso, state: 'taken' };
    if (row.status !== 'active' || row.discover_paused === true || row.date_check_enabled !== true) return { date: iso, state: 'check_off' };

    const { describeDate } = require('./occupancy');
    const out = await describeDate({ supabase, vendorId: row.id, date: iso });
    if (!out) return { date: iso, state: 'taken' };
    if (out.occupancy === 'off' && out.blocked !== null) return { date: iso, state: 'check_off' }; // the route 404s here
    const { verdictOf } = require('../../api/public/availability');
    return { date: iso, state: stateOfVerdict(verdictOf(out)) };
  } catch (_e) {
    return { date: iso, state: iso ? 'taken' : 'unreadable' };
  }
}

// The fact as it is handed back to her: the date as a day she can say, and the state. No sentence.
function dateStateFact(r) {
  try {
    const state = r && STATES.includes(r.state) ? r.state : 'taken';
    let date = null;
    if (r && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
      const [y, m, d] = r.date.split('-').map(Number);
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      date = `${d} ${MONTHS[m - 1]} ${y}`;
    }
    return JSON.stringify({ date, state });
  } catch (_e) { return JSON.stringify({ date: null, state: 'taken' }); }
}

module.exports = { dateState, dateStateFact, stateOfVerdict, STATES };
