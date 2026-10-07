'use strict';
// src/lib/hub/people.js · CE-47 · HUB-1 · THE PEOPLE TAB'S READ: only people who joined (a hub page exists).
// Filters: role (a collab role), city, open_to. mine=1 is "My people": her roster (vendor_roster, kept as ruled) plus
// everyone with a yes credit with her, each once. Each row carries "Worked with N people" (yes credits only).
const { publicCard, COLS, OPEN_TO } = require('./profiles');
const { isCollabRole } = require('../collab/roles');
const { sameCity } = require('../vendor/cityMatch');
const { upsertRosterEdge } = require('../vendor/roster');

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
  const why = await myPeopleWhy(sb, me);   // HUB-2: every row says whether it is in My people, and why
  return rows.slice(0, 100).map((p) => { const n = (counts.get(p.id) || new Set()).size; const w = why.get(p.id) || null;
    return { id: p.id, ...publicCard(p), worked_with: n, worked_with_words: n ? `Worked with ${n} ${n === 1 ? 'person' : 'people'}` : 'New on Collab Hub',
      in_my_people: !!w, why: w ? w.why : null, why_words: w ? w.words : null, can_take_off: !!(w && w.can_take_off),
      can_add: !w && p.owner_kind === 'vendor' && !!me.vendor_id }; });
}

// ── HUB-2 · MY PEOPLE (CE-47 ruling, 7 Oct 2026) ──────────────────────────────────────────────────────────────
// A vendor adds another vendor directly (vendor_roster). An organisation or a person joins My people only through a
// credit they answered yes to. Nobody outside the vendor pool appears on a list without having agreed.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthWords = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})/); return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
const NOT_A_VENDOR = 'Only vendors can be added. People and organisations join when they say yes to a shoot.';

/** id -> { why: 'added' | 'said_yes', words, can_take_off }. A yes credit wins: taking off an edge would not remove them. */
async function myPeopleWhy(sb, me) {
  const out = new Map();
  const a = await sb.from('hub_credits').select('id, call_id, shoot_name, month, giver_profile_id, person_profile_id, decided_at').eq('state', 'yes').eq('person_profile_id', me.id);
  const b = await sb.from('hub_credits').select('id, call_id, shoot_name, month, giver_profile_id, person_profile_id, decided_at').eq('state', 'yes').eq('giver_profile_id', me.id);
  for (const c of [...(a.data || []), ...(b.data || [])]) {
    const other = c.giver_profile_id === me.id ? c.person_profile_id : c.giver_profile_id;
    if (other === me.id || out.has(other)) continue;
    let name = c.shoot_name; let month = c.month;
    if (c.call_id) { const { data: call } = await sb.from('collab_posts').select('id, details, event_date').eq('id', c.call_id).maybeSingle();
      name = call && call.details ? String(call.details).slice(0, 60) : 'a TDW call'; month = call ? call.event_date : null; }
    out.set(other, { why: 'said_yes', words: `said yes to ${name}${monthWords(month) ? `, ${monthWords(month)}` : ''}`, can_take_off: false });
  }
  if (me.vendor_id) {
    const { data: rosterRows } = await sb.from('vendor_roster').select('id, member_vendor_id, source').eq('owner_vendor_id', me.vendor_id);
    const edges = (rosterRows || []).filter((r) => r.member_vendor_id);
    if (edges.length) {
      const { data: pages } = await sb.from('hub_profiles').select('id, vendor_id').in('vendor_id', edges.map((r) => r.member_vendor_id));
      for (const pg of pages || []) {
        if (pg.id === me.id || out.has(pg.id)) continue;
        const e = edges.find((r) => r.member_vendor_id === pg.vendor_id);
        out.set(pg.id, { why: 'added', words: e.source === 'manual' ? 'you added them' : 'you worked together on a TDW call', can_take_off: e.source === 'manual' });
      }
    }
  }
  return out;
}

/** Credits she gave that are still waiting: shown apart, never on the list. */
async function waitingForYes(sb, me) {
  const { data } = await sb.from('hub_credits').select('person_profile_id').eq('state', 'offered').eq('giver_profile_id', me.id);
  const ids = [...new Set((data || []).map((c) => c.person_profile_id))];
  if (!ids.length) return [];
  const already = await myPeopleWhy(sb, me);
  const { data: pages } = await sb.from('hub_profiles').select(COLS).in('id', ids.filter((i) => !already.has(i)));
  return (pages || []).map((p) => ({ id: p.id, ...publicCard(p), words: 'Waiting for their yes', line: 'Not on your list until they say yes' }));
}

/** Add a vendor to her people. Vendors only; a person or an organisation is refused. One edge, never two. */
async function addVendor(sb, me, profileId) {
  if (!me.vendor_id) throw new Error('only a vendor keeps My people');
  const { data: t } = await sb.from('hub_profiles').select(COLS).eq('id', String(profileId || '')).maybeSingle();
  if (!t) throw new Error('no such page');
  if (t.owner_kind !== 'vendor' || !t.vendor_id) throw new Error(NOT_A_VENDOR);
  if (t.id === me.id) throw new Error('that is your own page');
  const r = await upsertRosterEdge(sb, { ownerVendorId: me.vendor_id, memberVendorId: t.vendor_id, name: t.display_name, source: 'manual' });
  return { added: !!r.created, line: r.created ? 'Added to your people.' : 'Already in your people.' };
}

/** Take a vendor she added off her people. Only her own manual edge; never a yes credit; never an edge on a wedding team. */
async function removeVendor(sb, me, profileId) {
  if (!me.vendor_id) throw new Error('only a vendor keeps My people');
  const { data: t } = await sb.from('hub_profiles').select(COLS).eq('id', String(profileId || '')).maybeSingle();
  if (!t || t.owner_kind !== 'vendor' || !t.vendor_id) throw new Error(NOT_A_VENDOR);
  const { data: e } = await sb.from('vendor_roster').select('id, source').eq('owner_vendor_id', me.vendor_id).eq('member_vendor_id', t.vendor_id).maybeSingle();
  if (!e) throw new Error('they are not on your list as a vendor you added');
  if (e.source !== 'manual') throw new Error('you worked together on a TDW call, so they stay');
  const { data: team } = await sb.from('team_members').select('id').eq('roster_vendor_id', e.id).limit(1);
  if (team && team.length) throw new Error('they are on one of your wedding teams. Take them off the team first.');
  const { error } = await sb.from('vendor_roster').delete().eq('id', e.id).eq('owner_vendor_id', me.vendor_id);
  if (error) throw new Error(error.message);
  return { removed: true, line: 'Taken off your people. Shoots they said yes to stay on both pages.' };
}

module.exports = { people, myPeopleIds, workedCounts, myPeopleWhy, waitingForYes, addVendor, removeVendor, NOT_A_VENDOR };
