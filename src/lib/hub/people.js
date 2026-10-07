'use strict';
// src/lib/hub/people.js · CE-47 · HUB-1 · THE PEOPLE TAB'S READ: only people who joined (a hub page exists).
// Filters: role (a collab role), city, open_to. mine=1 is "My people": her roster (vendor_roster, kept as ruled) plus
// everyone with a yes credit with her, each once. Each row carries "Worked with N people" (yes credits only).
const { publicCard, COLS, OPEN_TO } = require('./profiles');
const { isCollabRole } = require('../collab/roles');
const { sameCity } = require('../vendor/cityMatch');

async function workedCounts(sb, ids) {
  const out = new Map(ids.map((i) => [i, new Set()]));
  if (!ids.length) return out;
  const a = await sb.from('hub_credits').select('giver_profile_id, person_profile_id').eq('state', 'yes').in('person_profile_id', ids);
  const b = await sb.from('hub_credits').select('giver_profile_id, person_profile_id').eq('state', 'yes').in('giver_profile_id', ids);
  for (const c of [...(a.data || []), ...(b.data || [])]) {
    if (out.has(c.person_profile_id)) out.get(c.person_profile_id).add(c.giver_profile_id);
    if (out.has(c.giver_profile_id)) out.get(c.giver_profile_id).add(c.person_profile_id);
  }
  return out;
}

async function myPeopleIds(sb, me) {
  const ids = new Set();
  if (me.vendor_id) {
    const { data: roster } = await sb.from('vendor_roster').select('member_vendor_id').eq('owner_vendor_id', me.vendor_id);
    const vids = (roster || []).map((r) => r.member_vendor_id).filter(Boolean);
    if (vids.length) { const { data } = await sb.from('hub_profiles').select('id').in('vendor_id', vids); for (const r of data || []) ids.add(r.id); }
  }
  const a = await sb.from('hub_credits').select('giver_profile_id, person_profile_id').eq('state', 'yes').eq('person_profile_id', me.id);
  const b = await sb.from('hub_credits').select('giver_profile_id, person_profile_id').eq('state', 'yes').eq('giver_profile_id', me.id);
  for (const c of a.data || []) ids.add(c.giver_profile_id);
  for (const c of b.data || []) ids.add(c.person_profile_id);
  ids.delete(me.id);
  return [...ids];
}

async function people(sb, me, q = {}) {
  if (q.role && !isCollabRole(q.role)) throw new Error('role is not a collab role');
  if (q.open_to && !OPEN_TO.includes(q.open_to)) throw new Error('open_to is paid, barter or credit_only');
  let rows;
  if (q.mine) {
    const ids = await myPeopleIds(sb, me);
    rows = ids.length ? ((await sb.from('hub_profiles').select(COLS).in('id', ids)).data || []) : [];
  } else {
    rows = (await sb.from('hub_profiles').select(COLS).neq('id', me.id).order('created_at', { ascending: false }).limit(500)).data || [];
  }
  rows = rows.filter((p) => (!q.role || (p.roles || []).includes(q.role)) && (!q.city || sameCity(p.city, q.city)) && (!q.open_to || (p.open_to || []).includes(q.open_to)));
  const counts = await workedCounts(sb, rows.map((r) => r.id));
  return rows.slice(0, 100).map((p) => { const n = (counts.get(p.id) || new Set()).size;
    return { id: p.id, ...publicCard(p), worked_with: n, worked_with_words: n ? `Worked with ${n} ${n === 1 ? 'person' : 'people'}` : 'New on Collab Hub' }; });
}

module.exports = { people, myPeopleIds, workedCounts };
