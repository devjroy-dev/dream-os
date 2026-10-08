'use strict';
// src/api/partner/index.js · CE-47 · PTN-A1 · the partner lane (mounted at /api/partner). A partner is its own kind:
// never a vendor or a Dreamer. Sign-in is the estate's own: phone, name (when new) and a WhatsApp code (F-44.271).
//   POST /auth/send-otp   { phone }                    -> { ok }
//   POST /auth/verify-otp { phone, otp, name? }        -> { ok, token, has_org } | 400 name_required (the code is KEPT)
//   GET  /me                                           -> { ok, name, partner: own shape | null, people }
//   POST /org             { name, kind, instagram_handle, website?, ... } -> { ok, partner }   (the signed-in person is owner)
//   PATCH /org            { any of the org fields }    -> { ok, partner }   (owner or member)
//   POST /people          { phone, name }              -> { ok }  (owner only; TDW sends them nothing until they sign in)
// The code rides the vendor line's AUTHENTICATION template (tdw_vendor_login_otp; Meta's fixed code wording names no role).
const express = require('express');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const wa = require('../../lib/partners/wa');   // A2-3
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { sendOtpCode } = require('../../lib/otpSend');
const { ensureAuthIdentity, identityForPhone } = require('../../lib/ensureAuthIdentity');
const { provisionRole, NameRequiredError } = require('../../lib/provisionRole');
const { textPresent } = require('../../lib/onboardingPredicate');
const { mintPartnerSession } = require('../../lib/partners/partnerSession');
const orgs = require('../../lib/partners/orgs');
const requirePartner = require('../middleware/requirePartner');
const hubPage = require('../../lib/partners/hubPage');
const calls = require('../../lib/partners/calls');
const answers = require('../../lib/partners/answers');
// PTN-A2-1: the partner's Collab Hub page follows its details. Best effort: a failure here never fails the partner's save.
const syncHub = async (sb, org) => { try { await hubPage.ensureOrgProfile(sb, org); } catch (e) { console.warn('[partner] hub page:', e.message); } };

const router = express.Router();
const PHONE_RE = /^\+[0-9]{8,15}$/;
const OTP_TTL_MS = 5 * 60 * 1000;
const BCRYPT_ROUNDS = 10;
const generateOtp = () => String(require('crypto').randomInt(0, 1_000_000)).padStart(6, '0');
let _authClient = null;
const authClient = () => (_authClient ||= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }));

router.post('/auth/send-otp', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  if (!PHONE_RE.test(phone)) return errRes(res, 400, 'Write your phone number with the country code, for example +91 98111 00021.');
  const otp = generateOtp();
  const { error } = await supabase.from('otp_sessions').upsert(
    { phone, otp_hash: await bcrypt.hash(otp, BCRYPT_ROUNDS), purpose: 'login', expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(), created_at: new Date().toISOString() },
    { onConflict: 'phone' });
  if (error) { console.error('[partner:send-otp] upsert error:', error.message); return errRes(res, 500, 'TDW could not finish this just now. Please try again.'); }
  try { await sendOtpCode({ to: phone, code: otp, lane: 'vendor', templateKey: 'vendor_login_otp' }); }
  catch (e) {
    console.error('[partner:send-otp] send error:', e.message);
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return errRes(res, 500, 'TDW could not send the code on WhatsApp. Please try again.');
  }
  return okRes(res, {});
}));

router.post('/auth/verify-otp', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const code = String(req.body.otp || '').trim();
  const name = textPresent(req.body.name) ? String(req.body.name).trim().slice(0, 80) : null;
  if (!PHONE_RE.test(phone) || !/^\d{6}$/.test(code)) return errRes(res, 400, 'Write the 6-digit code that TDW sent you on WhatsApp.');
  const { data: row } = await supabase.from('otp_sessions').select('otp_hash, purpose, expires_at').eq('phone', phone).maybeSingle();
  if (!row) return errRes(res, 400, 'TDW has no code for this number. Ask for a new code.', 'otp_not_found');
  if (new Date(row.expires_at) < new Date()) { await supabase.from('otp_sessions').delete().eq('phone', phone); return errRes(res, 400, 'The code has expired. Ask for a new code.', 'otp_expired'); }
  if (row.purpose !== 'login' || !(await bcrypt.compare(code, row.otp_hash))) return errRes(res, 400, 'That code is not right. Please try again.', 'otp_invalid');

  // The identity, then the users row, as every lane makes it (provisionRole, role 'partner': no role table).
  const { data: userRow } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
  let authUserId;
  try {
    authUserId = userRow ? (await ensureAuthIdentity({ supabase, authClient: authClient(), userId: userRow.id, phone })).authUserId
      : await identityForPhone({ authClient: authClient(), phone });
  } catch (e) { console.error('[partner:verify-otp] identity error:', e.message); return errRes(res, 500, 'TDW could not finish this just now. Please try again.'); }
  let prov;
  try { prov = await provisionRole(supabase, { authUserId, phone, name, role: 'partner' }); }
  catch (e) {
    if (e instanceof NameRequiredError) return errRes(res, 400, 'Write your name.', 'name_required');   // the code stays valid for the retry
    console.error('[partner:verify-otp] provision error:', e.message); return errRes(res, 500, 'TDW could not finish this just now. Please try again.');
  }
  await supabase.from('otp_sessions').delete().eq('phone', phone);
  const token = mintPartnerSession({ userId: prov.user_id });
  if (!token) { console.error('[partner:verify-otp] PARTNER_SESSION_SECRET is not set'); return errRes(res, 503, 'Partner sign-in is not open yet.'); }
  const m = await orgs.membershipFor(supabase, prov.user_id);
  if (m && m.org.check_state === 'blocked') return errRes(res, 403, requirePartner.BLOCKED, 'PARTNER_BLOCKED');
  return okRes(res, { token, has_org: !!m });
}));

router.get('/me', requirePartner({ orgRequired: false }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: u } = await supabase.from('users').select('name').eq('id', req.partnerUser.id).maybeSingle();
  let people = [];
  if (req.partner) {
    const { data: ms } = await supabase.from('partner_members').select('user_id, role').eq('partner_id', req.partner.id);
    const ids = (ms || []).map((x) => x.user_id);
    const { data: us } = ids.length ? await supabase.from('users').select('id, name, phone').in('id', ids) : { data: [] };
    people = (ms || []).map((x) => { const p = (us || []).find((y) => y.id === x.user_id) || {}; return { name: p.name || null, phone: p.phone || null, role: x.role }; });
  }
  return okRes(res, { name: (u && u.name) || null, partner: req.partner ? orgs.ownShape(req.partner.org, await orgs.markOn(supabase)) : null, role: req.partner ? req.partner.role : null, people });
}));

router.post('/org', requirePartner({ orgRequired: false }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (req.partner) return errRes(res, 409, 'You already belong to an organisation on TDW.');
  const v = orgs.validateOrgInput(req.body || {});
  if (!v.ok) return errRes(res, 400, v.error);
  const { data: taken } = await supabase.from('partner_orgs').select('id').eq('instagram_handle', v.row.instagram_handle).maybeSingle();
  if (taken) return errRes(res, 409, 'Another partner on TDW already uses this Instagram handle. If the handle is yours, write to partners@thedreamwedding.in.');
  const { data: org, error } = await supabase.from('partner_orgs').insert(v.row).select(orgs.ORG_COLS).single();
  if (error) { console.error('[partner:org] insert error:', error.message); return errRes(res, 500, 'TDW could not finish this just now. Please try again.'); }
  const { error: mErr } = await supabase.from('partner_members').insert({ partner_id: org.id, user_id: req.partnerUser.id, role: 'owner', added_by: req.partnerUser.id });
  if (mErr) { await supabase.from('partner_orgs').delete().eq('id', org.id); return errRes(res, 500, 'TDW could not finish this just now. Please try again.'); }
  await syncHub(supabase, org);
  return okRes(res, { partner: orgs.ownShape(org, await orgs.markOn(supabase)) });
}));

router.patch('/org', requirePartner(), asyncHandler(async (req, res) => {
  const v = orgs.validateOrgInput(req.body || {}, { partial: true });
  if (!v.ok) return errRes(res, 400, v.error);
  const b = req.body || {};
  if (b.send_state !== undefined) { if (!['active', 'paused'].includes(b.send_state)) return errRes(res, 400, 'Choose whether to get calls or to stop them for a while.'); v.row.send_state = b.send_state; }
  // A2-3: the partner's yes to calls on WhatsApp, kept with its time and the founder's words (0219). A yes needs the
  // partner's own WhatsApp number in full international form; a no clears the yes and keeps nothing it does not need.
  const optIn = wa.optInPatch(b, (req.partner && req.partner.org) || {});
  if (!optIn.ok) return errRes(res, 400, optIn.error);
  Object.assign(v.row, optIn.row);
  if (!Object.keys(v.row).length) return errRes(res, 400, 'You have not changed anything.');
  v.row.updated_at = new Date().toISOString();
  const { data: org, error } = await req.app.locals.supabase.from('partner_orgs').update(v.row).eq('id', req.partner.id).select(orgs.ORG_COLS).single();
  if (error) return errRes(res, 500, 'TDW could not finish this just now. Please try again.');
  await syncHub(req.app.locals.supabase, org);
  return okRes(res, { partner: orgs.ownShape(org, await orgs.markOn(req.app.locals.supabase)) });
}));

// ── Calls for you (PTN-A2-1) ─────────────────────────────────────────────────────────────────────────────────
// Only calls actually sent to this partner. The vendor's phone and email never appear; her note is masked.
router.get('/calls', requirePartner(), asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const { data: rows } = await sb.from('partner_sends').select('id, post_id, state, sent_at, created_at').eq('partner_id', req.partner.id).eq('state', 'sent').order('sent_at', { ascending: false }).limit(50);
  const ids = (rows || []).map((r) => r.id);
  const { data: ans } = ids.length ? await sb.from('partner_answers').select('send_id').in('send_id', ids) : { data: [] };
  const today = calls.todayIST(); const { data: sentToday } = await sb.from('partner_sends').select('id', { count: 'exact', head: false }).eq('partner_id', req.partner.id).eq('state', 'sent').gte('sent_at', new Date(Date.parse(`${today}T00:00:00+05:30`)).toISOString());
  const out = [];
  for (const r of rows || []) {
    const c = await calls.loadCall(sb, r.post_id); if (!c) continue;
    out.push({ send_id: r.id, sent_at: r.sent_at, ...calls.callShape(c), suggested: (ans || []).filter((a) => a.send_id === r.id).length });
  }
  const used = (sentToday || []).length; const cap = req.partner.org.daily_cap || 10;
  return okRes(res, { calls: out, today_line: `You have received ${used} of your ${cap} calls for today. To stop calls for a while, go to Settings.` });
}));
router.post('/calls/:send_id/suggest', requirePartner(), asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const { data: send } = await sb.from('partner_sends').select('id, partner_id, post_id, channel, state').eq('id', String(req.params.send_id || '')).maybeSingle();
  if (!send || send.partner_id !== req.partner.id) return errRes(res, 404, 'This call was not sent to you.');
  const out = await answers.suggest(sb, send, (req.body || {}).people, { agreed: (req.body || {}).agreed });
  return out.ok ? okRes(res, out) : errRes(res, out.status || 400, out.error);
}));

router.post('/people', requirePartner(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (req.partner.role !== 'owner') return errRes(res, 403, 'Only the owner of this partner account can add people.');
  const phone = typeof req.body.phone === 'string' ? req.body.phone.replace(/[^0-9+]/g, '') : '';
  const name = textPresent(req.body.name) ? String(req.body.name).trim().slice(0, 80) : null;
  if (!PHONE_RE.test(phone)) return errRes(res, 400, "Write the person's phone number with the country code.");
  if (!name) return errRes(res, 400, "Write the person's name.");
  let { data: u } = await supabase.from('users').select('id, name').eq('phone', phone).maybeSingle();
  if (!u) {
    const { data: made, error } = await supabase.from('users').insert({ phone, name }).select('id, name').single();
    if (error) return errRes(res, 500, 'TDW could not finish this just now. Please try again.');
    u = made;
  }
  const { error: mErr } = await supabase.from('partner_members').upsert({ partner_id: req.partner.id, user_id: u.id, role: 'member', added_by: req.partnerUser.id }, { onConflict: 'partner_id,user_id', ignoreDuplicates: true });
  if (mErr) return errRes(res, 500, 'TDW could not finish this just now. Please try again.');
  return okRes(res, {});
}));

module.exports = router;
