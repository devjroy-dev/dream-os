// src/lib/vendor/crewSnapshot.js
//
// TDW_04.5 P6 — THE CREW-STATE SNAPSHOT LINES, IN ONE HOME.
//
// WHY THIS FILE EXISTS AT ALL. Both vendor doors build Victor a calendar snapshot:
// `api/vendor-engine/chat.js::fetchCalendarSnapshot` (the PWA) and
// `lib/vendor/calendarSignals.js::fetchCalendarSnapshot` (WhatsApp). C4's precedent
// says the crew-state disclosure must be VERBATIM-IDENTICAL in both. The cheap way to
// honour that is to write the line twice and compare the copies; the estate's own law
// (F-04.36) says that is exactly how two homes for one rule are born. So the lines are
// built HERE, once, and both doors import them. They are byte-identical because there
// is one of them — not because someone checked.
//
// THE SITING, AND ITS ONE DELIBERATE ASYMMETRY (CE-61, Fork A):
//   · the GAP line and the DECLINE line live in BOTH homes. A planner lives on the
//     handset; a staffing line the handset cannot render is a line the vendor never
//     reads. R-B6-1's surface-scoping was NARROWED on the record for exactly these two.
//   · the DATE-PRESSURE line STAYS PWA-ONLY. It was not asked for, so it did not move.
//     Its siting ruling (R-B6-1 / B4 §3) stands untouched.
//
// ZERO MODEL CALLS. Three DB reads, and the first one serves both lines — the events
// read scopes the decline query as well as answering the gap question, so the second
// line costs two reads, not four.
//
// THE HONESTY LAW, INHERITED (F-04.21's family, and the gap line's own words carried
// forward verbatim): A FAILED READ SAYS NOTHING — never "0 functions", never "no
// declines". Absence is only evidence if you looked. Every read below fails to '' and
// an absent line claims nothing, which is the honest degradation.
//
// STATE, NEVER EVENT (CE-61, Fork C). The decline line reports what is TRUE NOW: who
// declined and is still on the function. It carries no "new", no "since", no arrival.
// The record is why: F-04.102 is an assertion of completion that never happened, and
// the grammar that teaches it is the grammar of the ARRIVING event. Whether Victor
// re-raises a decline he already mentioned is his judgment, held in his character —
// never a freshness column's. There is no freshness column, and this file does not
// invent one.

const OCCUPYING_KINDS_REQUIRE = () => require('./occupancy').OCCUPYING_KINDS;

// The gap line's own window, distinct BY RULING from the pressure line's 30 (CE-48).
// The spec's "next 3 weeks". The decline line shares it — a decline inside the
// production horizon is the one that can still be acted on, and sharing the window
// is what lets one events read serve both lines.
const CREW_WINDOW_DAYS = 21;

function isPlanner(category) {
  const { normaliseCategory } = require('./categoryFraming');
  return normaliseCategory(category) === 'planning';
}

/**
 * Read the crew state once and render both lines.
 *
 * @returns {{ gap: string, decline: string }} — each '' when it has nothing to say
 *          OR when a read failed. The caller concatenates; '' contributes nothing.
 *
 * GATING, and the difference between the two lines is deliberate:
 *   · gap     — PLANNER ONLY. P1.3's ruling, unchanged. An unstaffed function is a
 *               planner's problem shape; a photographer shooting alone is not short-staffed.
 *   · decline — EVERY VENDOR. The crew page is all-vendor by P-1/P-3, so every vendor
 *               can receive a decline, and a decline the app hears but never says is
 *               the same disease F-04.92 just cured on the CRUD rail. Flipping this to
 *               planner-only is the `if (!planner) return ...` one-liner below — named
 *               here so the choice is visible rather than buried.
 */
async function fetchCrewState(supabase, vendorId, category, nowIso) {
  const out = { gap: '', decline: '' };
  if (!supabase || !vendorId) return out;

  const today = (nowIso || new Date().toISOString()).slice(0, 10);
  const horizon = new Date(`${today}T00:00:00Z`);
  horizon.setUTCDate(horizon.getUTCDate() + CREW_WINDOW_DAYS - 1);
  const to = horizon.toISOString().slice(0, 10);

  // ── READ 1: the window's occupying, live functions. Serves BOTH lines. ──────
  let rows = null;                       // null = the read failed -> BOTH lines stay silent
  try {
    const OCCUPYING_KINDS = OCCUPYING_KINDS_REQUIRE();
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, assigned_member_ids')
      .eq('vendor_id', vendorId)
      .in('kind', OCCUPYING_KINDS)
      .gte('event_date', today).lte('event_date', to)
      .is('deleted_at', null).neq('state', 'cancelled')   // liveRowsOn's two covenant lines
      .order('event_date', { ascending: true })
      .limit(50);
    if (!error && data) rows = data;
  } catch (e) {
    console.warn('[crewSnapshot:events]', e.message);
  }
  if (rows === null) return out;         // a failed read says nothing

  // ── THE GAP LINE (P1.3, planner-gated) ─────────────────────────────────────
  // The gap = occupying && crew empty. Grammar agrees in all four places, singular
  // and plural, because a snapshot line that reads wrong teaches Victor to speak wrong.
  if (isPlanner(category)) {
    const gaps = rows.filter((e) => !Array.isArray(e.assigned_member_ids) || e.assigned_member_ids.length === 0);
    if (gaps.length) {
      const soonest = gaps[0];
      const days = Math.round((Date.parse(`${soonest.event_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
      const n = gaps.length;
      const noun = n === 1 ? 'function' : 'functions';
      const verb = n === 1 ? 'has' : 'have';
      const on   = n === 1 ? 'it' : 'them';
      const dw   = days === 1 ? 'day' : 'days';
      out.gap = `\n[${n} ${noun} in the next 3 weeks ${verb} no one on ${on} (${soonest.title} — ${days} ${dw}).]`;
    }
  }

  // ── THE DECLINE LINE (the folded whisper; state, never event) ──────────────
  // THE GATE IS assigned_member_ids, NOT crew_confirmations. Ruling №2's binding
  // clause: `events.assigned_member_ids` is the SOURCE OF TRUTH for a member being on
  // a function (0087 §D says so in its own header), and crew_confirmations carries only
  // the member's RESPONSE. Confirmations are NOT pruned on unassign — accepted as design
  // at CE-48 — so a decline row can outlive the assignment that provoked it. Reporting
  // one of those would be Victor telling the vendor about a person who is no longer on
  // the job: true of a row, false of the world.
  //
  // "STILL ASSIGNED" IS THE SUBSTANCE, not a qualifier. A decline does not remove
  // anybody — crew.js writes crew_confirmations and touches nothing else — so the state
  // being reported is genuinely two facts at once: they said no, and they are still on it.
  // That gap between the record and the roster is the entire reason this line is worth a
  // read. Victor is being handed a fact to speak, not a completed action to narrate.
  const byId = new Map(rows.map((e) => [e.id, e]));
  const ids = rows
    .filter((e) => Array.isArray(e.assigned_member_ids) && e.assigned_member_ids.length)
    .map((e) => e.id);
  if (!ids.length) return out;

  let declines = null;
  try {
    const { data, error } = await supabase
      .from('crew_confirmations')
      .select('event_id, member_id, status')
      .in('event_id', ids)
      .eq('status', 'declined');
    if (!error && data) declines = data;
  } catch (e) {
    console.warn('[crewSnapshot:confirmations]', e.message);
  }
  if (declines === null) return out;     // gap line already stands; the decline stays silent
  if (!declines.length) return out;

  // Only those still on the function they declined.
  const live = declines.filter((d) => {
    const ev = byId.get(d.event_id);
    return ev && Array.isArray(ev.assigned_member_ids) && ev.assigned_member_ids.map(String).includes(String(d.member_id));
  });
  if (!live.length) return out;

  let names = null;
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('vendor_id', vendorId)
      .in('id', [...new Set(live.map((d) => String(d.member_id)))]);
    if (!error && data) names = data;
  } catch (e) {
    console.warn('[crewSnapshot:members]', e.message);
  }
  if (names === null) return out;        // no name, no sentence — never a bare uuid

  const nameById = new Map(names.map((m) => [String(m.id), m.name]));
  const parts = live
    .map((d) => {
      const who = nameById.get(String(d.member_id));
      const ev = byId.get(d.event_id);
      return (who && ev && ev.title) ? `${who} on the ${ev.title}` : null;
    })
    .filter(Boolean);
  if (!parts.length) return out;         // a member whose name did not resolve is dropped,
                                         // never rendered as an id (F-04.66's law: the
                                         // snapshot speaks referents a person can say)

  out.decline = `\n[Crew declined, still assigned: ${parts.join(' · ')}.]`;
  return out;
}

module.exports = { fetchCrewState, CREW_WINDOW_DAYS, isPlanner };
