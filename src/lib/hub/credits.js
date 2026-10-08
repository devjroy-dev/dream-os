'use strict';
// src/lib/hub/credits.js · CE-47 · HUB-1 · "WORKED WITH": the centre of the Hub.
// A credit names a giver and a person. It comes from a TDW call (only the call's poster gives it, after the call's
// date) or from "a shoot we did together" (a name, a city, a month; at most 20 offered a month by one giver). It shows
// NOWHERE until the person says yes. Either side may take it back; it then leaves both pages. A partner's talent who
// never joined has no page, so can never be offered one (PTN's rule J).
const { callTitle } = require('./title');   // HUB-2d: a call's title, one home
const MONTHLY_SHOOT_OFFERS = 20;
const CREDIT_COLS = 'id, call_id, shoot_name, city, month, giver_profile_id, person_profile_id, state, offered_at, decided_at, taken_back_at';
const YM = /^(\d{4})-(\d{2})$/;
const clean = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

function monthStart(ym, now) {
  const m = String(ym || '').match(YM); if (!m) return null;
  const y = +m[1]; const mo = +m[2]; if (mo < 1 || mo > 12) return null;
  const d = `${m[1]}-${m[2]}-01`;
  const nowYm = now.getUTCFullYear() * 12 + now.getUTCMonth(); if (y * 12 + (mo - 1) > nowYm) return null;   // not in the future
  return d;
}

async function profileIds(sb, ids) {
  const uniq = [...new Set((ids || []).filter((x) => typeof x === 'string' && x))];
  if (!uniq.length) return [];
  const { data } = await sb.from('hub_profiles').select('id').in('id', uniq);
  return (data || []).map((r) => r.id);
}

/** From her TDW call. Returns the rows made (an existing offer for the same person and call is not made twice). */
async function offerForCall(sb, giver, callId, personIds, deps = {}) {
  const now = deps.now ? deps.now() : new Date();
  if (giver.owner_kind !== 'vendor') throw new Error('Only the vendor who posted the call can send these requests.');
  const { data: call } = await sb.from('collab_posts').select('id, vendor_id, event_date').eq('id', callId).maybeSingle();
  if (!call || call.vendor_id !== giver.vendor_id) throw new Error('This call is not yours.');
  if (new Date(`${call.event_date}T23:59:59+05:30`) > now) throw new Error('You can send these requests after the shoot date.');
  const people = (await profileIds(sb, personIds)).filter((id) => id !== giver.id);
  if (!people.length) throw new Error('Add at least one person who has a Collab Hub page.');
  const { data: had } = await sb.from('hub_credits').select('person_profile_id').eq('call_id', callId);
  const seen = new Set((had || []).map((r) => r.person_profile_id));
  const rows = people.filter((p) => !seen.has(p)).map((p) => ({ call_id: callId, giver_profile_id: giver.id, person_profile_id: p, state: 'offered', offered_at: now.toISOString() }));
  if (!rows.length) return [];
  const { data, error } = await sb.from('hub_credits').insert(rows).select(CREDIT_COLS);
  if (error) throw new Error(error.message);
  return data || [];
}

/** "A shoot we did together": name, city, month (YYYY-MM, not in the future), at most 20 offers a month. */
async function offerForShoot(sb, giver, input, deps = {}) {
  const now = deps.now ? deps.now() : new Date();
  const name = clean(input && input.shoot_name, 80); const city = clean(input && input.city, 60);
  const month = monthStart(input && input.month, now);
  if (!name) throw new Error('Add a name for the shoot.');
  if (!city) throw new Error('Add the city.');
  if (!month) throw new Error('Choose a month that is not in the future.');
  const people = (await profileIds(sb, input && input.people)).filter((id) => id !== giver.id);
  if (!people.length) throw new Error('Add at least one person who has a Collab Hub page.');
  const since = new Date(now.getTime() - 30 * 86400000).toISOString();
  const { data: recent } = await sb.from('hub_credits').select('id, call_id, offered_at').eq('giver_profile_id', giver.id);
  const used = (recent || []).filter((r) => r.call_id == null && r.offered_at >= since).length;
  if (used + people.length > MONTHLY_SHOOT_OFFERS) throw new Error(`You can send up to ${MONTHLY_SHOOT_OFFERS} of these requests in any 30 days. You have ${Math.max(0, MONTHLY_SHOOT_OFFERS - used)} left.`);
  const rows = people.map((p) => ({ shoot_name: name, city, month, giver_profile_id: giver.id, person_profile_id: p, state: 'offered', offered_at: now.toISOString() }));   // offered_at set here: the monthly count reads it
  const { data, error } = await sb.from('hub_credits').insert(rows).select(CREDIT_COLS);
  if (error) throw new Error(error.message);
  return data || [];
}

/** The person answers: yes shows it on both pages, no shows it nowhere. Only an offered credit can be answered. */
async function answer(sb, me, creditId, yes, deps = {}) {
  const now = deps.now ? deps.now() : new Date();
  const { data: c } = await sb.from('hub_credits').select(CREDIT_COLS).eq('id', creditId).maybeSingle();
  if (!c || c.person_profile_id !== me.id) throw new Error('This request is not for you.');
  if (c.state !== 'offered') throw new Error(c.state === 'yes' ? 'You already said yes to this request.' : c.state === 'no' ? 'You already said no to this request.' : 'This request was taken back.');
  const { error } = await sb.from('hub_credits').update({ state: yes ? 'yes' : 'no', decided_at: now.toISOString() }).eq('id', creditId);
  if (error) throw new Error(error.message);
  return { id: creditId, state: yes ? 'yes' : 'no' };
}

/** Either side takes it back; it leaves both pages. */
async function takeBack(sb, me, creditId, deps = {}) {
  const now = deps.now ? deps.now() : new Date();
  const { data: c } = await sb.from('hub_credits').select(CREDIT_COLS).eq('id', creditId).maybeSingle();
  if (!c || (c.person_profile_id !== me.id && c.giver_profile_id !== me.id)) throw new Error('This request is not for you.');
  if (c.state === 'taken_back') return { id: creditId, state: 'taken_back' };
  const { error } = await sb.from('hub_credits').update({ state: 'taken_back', taken_back_at: now.toISOString(), taken_back_by: me.id }).eq('id', creditId);
  if (error) throw new Error(error.message);
  return { id: creditId, state: 'taken_back' };
}

/** The "Worked with" lines for one page: only yes credits where this page is giver or person, grouped by shoot. */
async function workedWith(sb, profileId) {
  const a = await sb.from('hub_credits').select(CREDIT_COLS).eq('state', 'yes').eq('person_profile_id', profileId);
  const b = await sb.from('hub_credits').select(CREDIT_COLS).eq('state', 'yes').eq('giver_profile_id', profileId);
  const mine = [...(a.data || []), ...(b.data || [])];
  const groups = new Map();
  for (const c of mine) {
    const key = c.call_id ? `call:${c.call_id}` : `shoot:${c.giver_profile_id}:${String(c.shoot_name).toLowerCase()}:${c.month}`;
    if (!groups.has(key)) groups.set(key, c);
  }
  const lines = [];
  for (const [key, c] of groups) {
    const all = c.call_id
      ? ((await sb.from('hub_credits').select(CREDIT_COLS).eq('call_id', c.call_id).eq('state', 'yes')).data || [])
      : ((await sb.from('hub_credits').select(CREDIT_COLS).eq('giver_profile_id', c.giver_profile_id).eq('state', 'yes')).data || [])
        .filter((x) => x.call_id == null && String(x.shoot_name).toLowerCase() === String(c.shoot_name).toLowerCase() && x.month === c.month);
    const ids = new Set(); for (const x of all) { ids.add(x.giver_profile_id); ids.add(x.person_profile_id); }
    ids.delete(profileId);
    let name = c.shoot_name; let city = c.city; let month = c.month;
    if (c.call_id) {
      const { data: call } = await sb.from('collab_posts').select('id, requirement_type, city, event_date, event_type, details').eq('id', c.call_id).maybeSingle();
      const its = call ? ((await sb.from('collab_post_items').select('post_id, requirement_type, needed').eq('post_id', call.id)).data || []) : [];
      name = call ? callTitle(call, its) : 'A call on TDW'; city = call ? call.city : null; month = call ? `${String(call.event_date).slice(0, 7)}-01` : null;
    }
    lines.push({ key, from_call: !!c.call_id, shoot_name: name, city, month, with_ids: [...ids] });
  }
  return lines.sort((x, y) => String(y.month).localeCompare(String(x.month)));
}

module.exports = { MONTHLY_SHOOT_OFFERS, CREDIT_COLS, monthStart, offerForCall, offerForShoot, answer, takeBack, workedWith };
