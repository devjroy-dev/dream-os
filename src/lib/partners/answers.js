'use strict';
// src/lib/partners/answers.js · CE-47 · PTN-A2-1 · A PARTNER SUGGESTS PEOPLE FOR A CALL.
// The same path whether the booker opens the emailed link (no sign-in) or a signed-in member taps "Suggest someone".
// Each person enters the call's Interested list through CLB-2a's addPartnerInterest (seams), and a partner_answers row
// keeps what the partner sent: name, role, profile link. NO phone or email, ever (rule J): a name holding an "@" or a
// run of ten digits is refused, here and by the table's CHECK. TDW never contacts these people; joinLinkFor gives a
// partner row null. A2-1 does NOT limit answers by the plan: the founder's 4th-connection gate is A2-2's.
const calls = require('./calls');
const { normalizeWebsite } = require('./links');
const seams = require('./seams');
const { hubOpen } = require('../hub/gate');                 // CLB's Rule 1, one home (HUB-2b)
const { NOT_OPEN } = require('../collab/interest');        // CLB's sentence, said as landed, never re-worded here
const MAX = 10;
const cleanName = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 120);
const WORDS = Object.freeze({
  needAgree: 'Tick "These people have agreed to be suggested for this call" first.',
  needOne: 'Write at least one name.',
  tooMany: `You can suggest up to ${MAX} people at a time.`,
  badName: 'Write only a name. No phone number or email.',
  badRole: 'Choose a role this call needs.',
  badLink: 'Write the profile link, for example https://www.instagram.com/name',
  closed: 'This call is closed or its date has passed.',
  blocked: 'This partner account is blocked. Write to partners@thedreamwedding.in.',
  done: (v) => `Sent. ${v} sees them on the call.`,
  notOpen: NOT_OPEN,
  notSaved: 'Could not save just now. Try again in a minute.',
});
// THE CONTRACT (the chair, 7 Oct 2026): a suggestion on a call whose vendor does not have Collab Hub open answers 403 with
// CLB's NOT_OPEN sentence and writes NO row; bad input answers 400; nothing a partner sends can make a 500. Every refusal
// below carries its status; a failure of the database itself answers 503 with plain words, never a stack.
const isText = (v) => typeof v === 'string';
async function sendForToken(sb, token) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(String(token || ''))) return null;
  const { data } = await sb.from('partner_sends').select('id, partner_id, post_id, channel, state').eq('token_hash', calls.tokenHash(token)).maybeSingle();
  return data || null;
}
async function suggest(sb, send, people, opts = {}) {
  try { return await suggestInner(sb, send, people, opts); }
  catch (e) {
    if (e && e.message === NOT_OPEN) return { ok: false, status: 403, error: WORDS.notOpen };   // CLB's own guard won a race
    console.warn('[partners] suggest:', e && e.message);
    return { ok: false, status: 503, error: WORDS.notSaved };
  }
}
async function suggestInner(sb, send, people, { agreed, now = new Date(), deps = {} } = {}) {
  if (agreed !== true) return { ok: false, status: 400, error: WORDS.needAgree };
  if (Array.isArray(people) && people.some((p) => !p || typeof p !== 'object' || Array.isArray(p) || !isText(p.name)
    || (p.role != null && !isText(p.role)) || (p.link != null && !isText(p.link)))) return { ok: false, status: 400, error: WORDS.badName };
  const list = Array.isArray(people) ? people.filter((p) => p && cleanName(p.name)) : [];
  if (!list.length) return { ok: false, status: 400, error: WORDS.needOne };
  if (list.length > MAX) return { ok: false, status: 400, error: WORDS.tooMany };
  const { data: org } = await sb.from('partner_orgs').select('id, check_state').eq('id', send.partner_id).maybeSingle();
  if (!org || org.check_state === 'blocked') return { ok: false, status: 403, error: WORDS.blocked };
  const c = await calls.loadCall(sb, send.post_id);
  if (!c || !calls.isOpen(c.post, now)) return { ok: false, status: 400, error: WORDS.closed };
  if (!(await hubOpen(sb, c.post.vendor_id))) return { ok: false, status: 403, error: WORDS.notOpen };   // before ANY row
  const callRoles = c.roles.map((r) => r.role);
  const rows = [];
  for (const p of list) {
    const name = cleanName(p.name);
    if (/@|\d{10,}/.test(name.replace(/\s/g, ''))) return { ok: false, status: 400, error: WORDS.badName };
    const role = p.role == null || p.role === '' ? (callRoles.length === 1 ? callRoles[0] : null) : String(p.role);
    if (role && !callRoles.includes(role)) return { ok: false, status: 400, error: WORDS.badRole };
    let link = null;
    if (p.link != null && String(p.link).trim()) { link = normalizeWebsite(String(p.link)); if (!link) return { ok: false, status: 400, error: WORDS.badLink }; }
    rows.push({ name, role, link });
  }
  const at = now.toISOString(); const out = [];
  for (const r of rows) {
    const got = await (deps.addPartnerInterest || seams.addPartnerInterest)(sb, { post_id: send.post_id, partner_id: send.partner_id, send_id: send.id, name: r.name, role: r.role, link: r.link, agreed_at: at });
    if (!got.existed) await sb.from('partner_answers').insert({ send_id: send.id, interest_id: got.id, talent_name: r.name, talent_role: r.role, talent_link: r.link, agreed: true });
    out.push({ name: r.name, existed: !!got.existed });
  }
  return { ok: true, people: out, line: WORDS.done(c.face.name) };
}
async function stopOrPause(sb, send, what, now = new Date()) {
  const patch = what === 'stop' ? { send_state: 'stopped' } : { send_state: 'active', paused_until: new Date(now.getTime() + 7 * 86400e3).toISOString() };
  await sb.from('partner_orgs').update({ ...patch, updated_at: now.toISOString() }).eq('id', send.partner_id);
  return what === 'stop' ? 'Calls are stopped. To get them again, sign in and go to Settings.' : 'Calls are paused for a week.';
}
module.exports = { MAX, WORDS, sendForToken, suggest, stopOrPause };
