'use strict';
// src/lib/partners/orgs.js · CE-47 · PTN-A1 · partner organisations: the one place that validates, writes and shapes them.
// Shapes carry READY links (links.js). A blocked partner is never shaped for anyone but the admin.
const links = require('./links');

const KINDS = Object.freeze(['talent_agency', 'model_agency', 'fashion_house', 'studio', 'brand', 'wedding_planner', 'other']);
const KIND_WORDS = Object.freeze({ talent_agency: 'Talent agency', model_agency: 'Model agency', fashion_house: 'Fashion house',
  studio: 'Studio', brand: 'Brand', wedding_planner: 'Wedding planner', other: 'Other' });
// What each kind gets by default (the design note): agencies calls, brands and fashion houses briefs, planners requirements.
const WANTS_BY_KIND = Object.freeze({ talent_agency: ['calls'], model_agency: ['calls'], fashion_house: ['briefs', 'calls'],
  studio: ['calls'], brand: ['briefs'], wedding_planner: ['requirements'], other: ['calls'] });
// THE PARTNER MARK (the founder's words, 7 Oct 2026): "Verified" / "Unverified". ONE HOME for the words; every reader takes
// them from here (A2-0's interestRows.js included). They are SHOWN only while admin_config 'partners.check_label' is 'on'
// (one key for both seats; CLB reads it too). Off, a missing row, junk or no database: check_words is null everywhere.
const CHECK_WORDS = Object.freeze({ unchecked: 'Unverified', checked: 'Verified' });
const LABEL_KEY = 'partners.check_label';
async function markOn(sb) {   // read exactly as CLB reads it (src/api/vendor/collab.js): 'on', as text or JSON, any case
  try {
    const { data, error } = await sb.from('admin_config').select('value').eq('key', LABEL_KEY).maybeSingle();
    const v = !error && data ? String(data.value == null ? '' : data.value).trim().replace(/^"(.*)"$/, '$1').toLowerCase() : '';
    return v === 'on';
  } catch (_e) { return false; }
}
const FEE_LINE = 'This partner may charge its own fees. TDW takes no fee and has no part in it.';
const ORG_COLS = 'id, name, kind, instagram_handle, website, cities, roles, pay_rule, wants, calls_email, whatsapp_opt, whatsapp_phone, daily_cap, send_state, paused_until, check_state, checked_how, checked_at, blocked_at, blocked_reason, plan_state, created_at';

const strArr = (v, max = 20) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : []);

/** Validate a partner's own details. -> { ok, row } | { ok:false, error } (plain words). */
function validateOrgInput(b = {}, { partial = false } = {}) {
  const row = {};
  if (!partial || b.name !== undefined) {
    const n = typeof b.name === 'string' ? b.name.trim() : '';
    if (!n || n.length > 120) return { ok: false, error: 'Write the name of your organisation.' };
    row.name = n;
  }
  if (!partial || b.kind !== undefined) {
    if (!KINDS.includes(b.kind)) return { ok: false, error: 'Choose what kind of organisation you are.' };
    row.kind = b.kind;
  }
  if (!partial || b.instagram_handle !== undefined) {
    const h = links.normalizeIgHandle(b.instagram_handle);
    if (!h) return { ok: false, error: links.WORDS.badHandle };
    row.instagram_handle = h.toLowerCase();   // Instagram handles are case-blind; stored lower so one handle is one partner
  }
  if (b.website !== undefined) {
    if (b.website === null || String(b.website).trim() === '') row.website = null;
    else { const w = links.normalizeWebsite(b.website); if (!w) return { ok: false, error: links.WORDS.badWebsite }; row.website = w; }
  }
  if (b.calls_email !== undefined) {
    const e = b.calls_email === null ? '' : String(b.calls_email).trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: 'Write the email address calls should go to.' };
    row.calls_email = e || null;
  }
  if (b.cities !== undefined) row.cities = strArr(b.cities);
  if (b.roles !== undefined) row.roles = strArr(b.roles);
  if (b.pay_rule !== undefined) { if (!['paid_only', 'paid_and_credit'].includes(b.pay_rule)) return { ok: false, error: 'Choose paid only, or paid and credit only.' }; row.pay_rule = b.pay_rule; }
  if (b.wants !== undefined) { const w = strArr(b.wants).filter((x) => ['calls', 'briefs', 'requirements'].includes(x)); row.wants = w; }
  if (!partial && row.wants === undefined) row.wants = WANTS_BY_KIND[row.kind].slice();
  return { ok: true, row };
}

/** What a partner sees of itself. mark: markOn's answer; without it the mark is not shown (fails closed). */
function ownShape(o, mark = false) {
  return { id: o.id, name: o.name, kind: o.kind, kind_words: KIND_WORDS[o.kind], instagram_handle: o.instagram_handle,
    instagram_url: links.instagramUrl(o.instagram_handle), website: o.website, website_url: links.websiteUrl(o.website),
    cities: o.cities || [], roles: o.roles || [], pay_rule: o.pay_rule, wants: o.wants || [], calls_email: o.calls_email,
    whatsapp_opt: !!o.whatsapp_opt, daily_cap: o.daily_cap, send_state: o.send_state, paused_until: o.paused_until,
    check_state: o.check_state, check_words: mark === true ? (CHECK_WORDS[o.check_state] || null) : null, plan_state: o.plan_state };
}

/** The public partner page. NULL for a blocked partner (it vanishes at once). No phone, no email. */
function publicShape(o, mark = false) {
  if (!o || o.check_state === 'blocked') return null;
  return { name: o.name, kind_words: KIND_WORDS[o.kind], cities: o.cities || [], instagram_handle: o.instagram_handle,
    instagram_url: links.instagramUrl(o.instagram_handle), website_url: links.websiteUrl(o.website),
    check_words: mark === true ? (CHECK_WORDS[o.check_state] || null) : null, fee_line: FEE_LINE };
}

/** The partner a signed-in user belongs to (owner or member), or null. Blocked partners are returned with blocked=true. */
async function membershipFor(supabase, userId) {
  const { data: m, error } = await supabase.from('partner_members').select('partner_id, role').eq('user_id', userId).limit(1).maybeSingle();
  if (error) throw new Error(`partner membership read failed: ${error.message}`);
  if (!m) return null;
  const { data: o, error: oErr } = await supabase.from('partner_orgs').select(ORG_COLS).eq('id', m.partner_id).maybeSingle();
  if (oErr) throw new Error(`partner read failed: ${oErr.message}`);
  return o ? { role: m.role, org: o } : null;
}

module.exports = { KINDS, KIND_WORDS, WANTS_BY_KIND, CHECK_WORDS, LABEL_KEY, markOn, FEE_LINE, ORG_COLS, validateOrgInput, ownShape, publicShape, membershipFor };
