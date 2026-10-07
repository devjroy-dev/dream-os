'use strict';
// src/lib/partners/hubPage.js · CE-47 · PTN-A2-1 · A PARTNER'S PAGE ON COLLAB HUB (hub_profiles owner_kind 'org', 0198).
// HUB-1 makes vendors' pages; nothing made an organisation's. ensureOrgProfile writes it, whatever the Hub's gate (the
// chair, 7 Oct 2026: the row is data; whether /c/<handle> shows it is CLB's public door's rule). It keeps the page's
// name, cities, roles, Instagram and website in step with partner_orgs; it never writes a check label (hub_profiles.
// check_state stays 'unchecked': the chair ruled no label until a written rule and a setter exist). A blocked partner's
// page is already hidden by CLB's public door (it reads partner_orgs.check_state).
// orgPageFor(sb, handle) is what CLB's /c/<handle> asks of PTN: the card fields, an empty work strip (no partner
// pictures yet), the fee line. Never a phone, an email or a price.
const profiles = require('../hub/profiles');
const { isCollabRole } = require('../collab/roles');
const { KIND_WORDS, FEE_LINE } = require('./orgs');
const SYNC = 'id, org_id, handle, display_name, roles, city, instagram_handle, website';
const fields = (o) => ({ display_name: String(o.name).slice(0, 120), roles: (o.roles || []).filter(isCollabRole),
  city: (o.cities || []).find((c) => c && c !== 'All cities') || null, instagram_handle: o.instagram_handle || null, website: o.website || null });
async function ensureOrgProfile(sb, org) {
  if (!org || !org.id) return null;
  const got = await sb.from('hub_profiles').select(SYNC).eq('org_id', org.id).maybeSingle();
  if (got.data) {
    const f = fields(org); const changed = Object.keys(f).some((k) => JSON.stringify(f[k]) !== JSON.stringify(got.data[k]));
    if (changed) await sb.from('hub_profiles').update({ ...f, updated_at: new Date().toISOString() }).eq('id', got.data.id);
    return { ...got.data, ...f };
  }
  const handle = await profiles.freeHandle(sb, [org.instagram_handle, org.name, `partner.${String(org.id).slice(0, 8)}`]);
  if (!handle) return null;
  const ins = await sb.from('hub_profiles').insert({ owner_kind: 'org', org_id: org.id, handle, open_to: [], ...fields(org) }).select(SYNC).single();
  if (ins.error) { const again = await sb.from('hub_profiles').select(SYNC).eq('org_id', org.id).maybeSingle(); return again.data || null; }
  return ins.data;
}
async function orgPageFor(sb, handle) {
  const h = profiles.toHandle(handle); if (!h) return null;
  const { data: p } = await sb.from('hub_profiles').select(profiles.COLS).eq('handle', h).eq('owner_kind', 'org').maybeSingle();
  if (!p) return null;
  const { data: o } = await sb.from('partner_orgs').select('kind, cities, check_state').eq('id', p.org_id).maybeSingle();
  if (!o || o.check_state === 'blocked') return null;
  const card = profiles.publicCard(p);
  delete card.checked; delete card.label;   // no check label on the Hub until the founder approves its written rule
  return { ...card, kind_words: KIND_WORDS[o.kind] || 'Partner', cities: o.cities || [], work: [], fee_line: FEE_LINE };
}
module.exports = { ensureOrgProfile, orgPageFor };
