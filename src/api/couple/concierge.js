// src/api/couple/concierge.js
// POST /api/v2/couple/concierge/request
// Bride taps "Ask a Personal Concierge" in Meridian.
// Logs to admin_activity_log + sends WA notification to admin.
// No gate — all brides. Later tier-gate via couples.tier check.

'use strict';

const express          = require('express');
const router           = express.Router();
const asyncHandler     = require('../../lib/asyncHandler');
const { sendWhatsApp } = require('../../lib/whatsapp');

// ── F-07.76 · FORK 4(b) RULED — THE RECIPIENT IS A DECISION, NOT A DEFAULT ───
// THIS READ: `process.env.ADMIN_PHONE || '<a hardcoded number>'`.
//
// CE-120 set ADMIN_PHONE on Railway deliberately: the founder's own number had
// been reached BY ACCIDENT through that fallback and now reaches him BY DECISION.
// A surviving literal silently restores the accident on any env loss — the door
// would keep "working" while nobody could say who it was working for. Env-only,
// and an absent env is a LOUD SKIP (see the send site below), never a guess.
const ADMIN_PHONE = process.env.ADMIN_PHONE;

router.post('/request', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id: userId, couple_id } = req.coupleUser;

  // Load bride context
  const { data: couple } = await supabase
    .from('couples')
    .select('wedding_date, wedding_city, users!couples_user_id_fkey(name, phone)')
    .eq('id', couple_id)
    .maybeSingle();

  const brideName  = couple?.users?.name || 'A bride';
  const bridePhone = couple?.users?.phone || null;
  const weddingDate = couple?.wedding_date
    ? new Date(couple.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'date TBD';
  const city = couple?.wedding_city || '';

  // Fetch last Meridian message for context
  const { data: lastMsg } = await supabase
    .from('conversations')
    .select('id')
    .eq('couple_id', couple_id)
    .eq('kind', 'meridian_self')
    .maybeSingle();

  let lastMeridianText = null;
  if (lastMsg?.id) {
    const { data: msg } = await supabase
      .from('messages')
      .select('body')
      .eq('conversation_id', lastMsg.id)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    lastMeridianText = msg?.body || null;
  }

  // ── THE ROW, READ (disclosed addition — see the handover's §3.1) ───────────
  // Fork 1(b)'s ruling rests on a stated premise: "the :90 frozen sentence claims
  // the ROW and the row is true." THIS READ discarded the insert's outcome through
  // `.then(()=>{}).catch(()=>{})` — so a failed insert left the premise false and
  // silent, and the couple was told a concierge would reach her over nothing at
  // all. Reading the send while leaving the row unread would cure the smaller half
  // of the same disease. The write is still NON-FATAL (she has done her part), but
  // it is no longer INVISIBLE.
  let logged = false;
  try {
    const { error: logErr } = await supabase.from('admin_activity_log').insert({
      admin_email: 'system',
      action:      'concierge_request',
      target_type: 'couple',
      target_id:   couple_id,
      metadata: {
        bride_name:   brideName,
        bride_phone:  bridePhone,
        wedding_date: weddingDate,
        city,
        last_meridian_message: lastMeridianText,
        requested_at: new Date().toISOString(),
      },
    });
    if (logErr) throw logErr;
    logged = true;
  } catch (err) {
    // NON-FATAL, exactly as before — but LOUD. supabase-js returns `{error}` for a
    // DB refusal and THROWS for a transport failure; both shapes land here, because
    // a door that reads one and not the other is the very class this slice cures.
    console.error(
      `[concierge/request] admin_activity_log INSERT FAILED for couple ${couple_id}: ` +
      `${err.message} — the request is NOT on file; the WA notify below is the only ` +
      'record this bride ever asked (F-05.48 slice one).'
    );
  }

  // WA notification to admin
  const waBody = [
    `✦ Meridian Concierge Request`,
    ``,
    `Bride: ${brideName}`,
    bridePhone ? `Contact: ${bridePhone}` : '',
    `Wedding: ${weddingDate}${city ? ` · ${city}` : ''}`,
    lastMeridianText ? `\nLast message: "${lastMeridianText.slice(0, 120)}"` : '',
    ``,
    `— TDW Admin`,
  ].filter(l => l !== null).join('\n').trim();

  // ── F-05.48 SLICE ONE · FORK 1(b) RULED — THE DOOR READS ITS OWN RESULT ────
  //
  // THIS READ: `await sendWhatsApp(ADMIN_PHONE, waBody)` inside a try/catch, the
  // return value DISCARDED. That is refusal-blindness, and it is the same defect
  // F-07.45 cured one door over (couple/enquire.js:330-344 carries the derivation).
  //
  // THE MECHANISM, derived by command at this tip — `sendWhatsApp` has FOUR exits
  // and only ONE of them throws:
  //   opted out       -> RETURNS {blocked:'opted_out',              sent:false}  (whatsapp.js:133)
  //   media on Meta   -> RETURNS {blocked:'meta_media_unsupported', sent:false}  (whatsapp.js:139)
  //   no Meta lane    -> RETURNS {blocked:'no_meta_lane',           sent:false}  (whatsapp.js:153)
  //   sent            -> RETURNS {sid, wamid, meta, line, result,   sent:true }  (whatsapp.js:145)
  //   transport fault -> THROWS  MetaSendError                                   (metaCloud.js)
  // The catch below saw the FIFTH and none of the first three, so a concierge
  // request that reached nobody looked exactly like one that reached the founder.
  //
  // `sent` IS THE ONLY HONEST KEY. `.sid` carries `wamid`, and whatsapp.js:142
  // admits null when Meta returns none — so `{sid:null, sent:true}` is reachable
  // and a `.sid` truth-test would report a delivered message as a failure. Every
  // assertion here is on `sent === true`, strictly.
  //
  // [F-06.85: this paragraph is conditioned on MECHANICAL facts — the four exits
  //  and the nullable wamid. Mechanism: src/lib/whatsapp.js:133/139/145/153 and
  //  the wamid coalesce at :142. If any exit is added, removed, or re-shaped, this
  //  paragraph is false and must be re-read before this block is trusted.]
  //
  // FORK 1(b), RULED: the failure is OPERATOR-TRUTH — a loud log plus a response
  // field. The couple's copy at the return below is FROZEN and does not move a
  // byte: her sentence claims the ROW, and the row is now read above, so it is true
  // independently of whether the wire carried.
  let adminNotified = false;
  let notifyRefusal = null;   // the blocked code / error name, for the log and the walk

  if (!ADMIN_PHONE) {
    // FORK 4(b)'s loud floor. No recipient is configured, so there is nothing to
    // send TO — and a send to `undefined` would resolve a lane and post rubbish at
    // Meta. Skip, name it, and let the response carry the truth.
    notifyRefusal = 'admin_phone_unset';
    console.error(
      '[concierge/request] ADMIN_PHONE is not set on this service — NO admin notification sent. ' +
      `The request ${logged ? 'IS on file in admin_activity_log' : 'is NOT on file either'}; ` +
      'set ADMIN_PHONE in Railway to restore the notify (F-07.76).'
    );
  } else {
    try {
      const out = await sendWhatsApp(ADMIN_PHONE, waBody);
      adminNotified = !!(out && out.sent === true);
      if (!adminNotified) {
        notifyRefusal = (out && out.blocked) || 'unknown';
        console.error(
          `[concierge/request] admin notify REFUSED (${notifyRefusal}) for couple ${couple_id} — ` +
          'the founder was NOT told about this concierge request. ' +
          `The request ${logged ? 'IS on file in admin_activity_log' : 'is NOT on file either'}.`
        );
      }
    } catch (err) {
      notifyRefusal = (err && (err.code || err.name)) || 'send_failed';
      console.error(
        `[concierge/request] admin notify THREW (${notifyRefusal}: ${err.message}) for couple ${couple_id} — ` +
        'the founder was NOT told about this concierge request. ' +
        `The request ${logged ? 'IS on file in admin_activity_log' : 'is NOT on file either'}.`
      );
    }
  }

  return res.json({
    ok: true,
    message: 'Our concierge will reach you at the earliest.',
    // OPERATOR-TRUTH, ruled: these three are for the walk, the log reader and any
    // future admin surface. No couple-facing string reads them, and none is added.
    logged,
    admin_notified: adminNotified,
    admin_notify_refusal: adminNotified ? null : notifyRefusal,
  });
}));

// GET /api/v2/couple/concierge/requests — admin only
router.get('/requests', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  // ── F-07.77 · FORK 3(a) RULED — THE TRAPDOOR DIES, FAILING CLOSED ─────────
  //
  // THIS READ: `adminPw !== (process.env.ADMIN_PASSWORD || '<a literal>')` — a
  // live admin password standing in the clear in a PUBLIC repository. The secret
  // is rotated and the env is set (CE-120, the founder's word); the literal was
  // the surviving trapdoor.
  //
  // THE ASYMMETRY LAW (CE ruling, F-07.77): the two ADMIN_PASSWORD sites are NOT
  // symmetric and MUST NOT receive the same patch. Deleting the `|| '<literal>'`
  // here and stopping would be FAIL-OPEN: with the env absent and no header sent,
  // `undefined !== undefined` is FALSE and this route would OPEN. The sibling at
  // api/admin/demoAdmin.js:22 already carries a `!pw ||` presence limb and is safe
  // under the same deletion; this site had none. Proven by truth-table at
  // read-first before a byte was written.
  //
  // The blast radius, scoped honestly: api/couple/core.js:13 mounts
  // requireCoupleAuth above this router unconditionally, so the fail-open would
  // have been reachable by an AUTHENTICATED bride, not the open internet — and she
  // would have read every bride's name, phone, wedding date and last Meridian
  // message. A privilege escalation, not a public leak, and cured either way.
  //
  // THE SHAPE, matching api/admin/requireAdmin.js:5 and demoAdmin.js:22: env-only,
  // and BOTH limbs required — a missing secret refuses, a missing header refuses.
  const adminPw   = req.headers['x-admin-password'];
  const adminWant = process.env.ADMIN_PASSWORD;
  if (!adminWant || !adminPw || adminPw !== adminWant) {
    if (!adminWant) {
      console.error(
        '[concierge/requests] ADMIN_PASSWORD is not set on this service — REFUSING every ' +
        'caller. This door fails CLOSED by design (F-07.77); set the env to restore it.'
      );
    }
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }

  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('*')
    .eq('action', 'concierge_request')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, requests: data || [] });
}));

module.exports = router;
