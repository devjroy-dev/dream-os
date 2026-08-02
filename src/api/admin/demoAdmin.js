// src/api/admin/demoAdmin.js
// Admin endpoints for managing demo vendor profiles.
// Protected by requireAdmin (bearer or cookie) — F-07.86, the private guard died.
//
//   GET    /api/v2/admin/demo/vendors         — list all demo vendors
//   POST   /api/v2/admin/demo/vendors         — create demo vendor
//   DELETE /api/v2/admin/demo/vendors/:id     — deactivate demo vendor
//   GET    /api/v2/admin/demo/leads           — list all demo leads
//   POST   /api/v2/admin/demo/leads           — seed a mock lead
//   POST   /api/v2/admin/demo/cloudinary-sign — sign a Cloudinary upload

'use strict';

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');

// ── F-07.86 · THE PRIVATE GUARD DIES (CE ruling F-6(b)) ──────────────────────
// THIS FILE CARRIED ITS OWN `requireAdminPassword` — a header-only guard with
// no cookie limb, reading `x-admin-password` and comparing it against
// ADMIN_PASSWORD. Two authorities guarding one panel was the disease's second
// face: a fold that cured `requireAdmin` alone would have left these ten routes
// dark, or worse, still admitting a raw credential over the wire after the
// credential had left every other client.
//
// It now imports the ONE guard. Its ten routes ride the same bearer and cookie
// limbs as every other /api/v2/admin/* route, and the `x-admin-password` header
// is dead estate-wide.
//
// F-07.77's fail-closed behaviour is NOT lost in the swap — it moved home.
// requireAdmin refuses every session when ADMIN_SESSION_SECRET is absent, and
// says so on a named log line, exactly as this file's own guard did for
// ADMIN_PASSWORD. The refusal STATUS changes from 401 to 401/403 depending on
// which limb was attempted; that is disclosed rather than papered, because a
// caller reading for 401 specifically will now see 403 on a bad token.
const requireAdminPassword = require('./requireAdmin');

// ── TDW_08 P1 · FORK E (ENFORCE) ─────────────────────────────────────────────
// The four presence WRITERS in this file moved behind demoLifecycle. They are
// the create (:61), the deactivate (:76), and the discover grant/revoke
// (:115/:130) as they stood at 3d47041. The five demo_vendors READERS in this
// file are deliberately UNCHANGED — FORK A(b) keeps presence on the booleans and
// this sitting was chartered to move writers, not predicates.
const demoLifecycle = require('../../lib/demoLifecycle');

// ── TDW_08 SITTING A · THE INVITE CALLER'S TWO DEPENDENCIES ─────────────────
// sendWa is the SINGLE outbound gate (spec §3). The route never touches a
// transport directly, so the cross-line STOP gate and the isApproved gate bind
// this send exactly as they bind every other one.
//
// claimLinkFor is IMPORTED, never re-derived. The founder gave that URL shape
// verbatim on 2026-07-31 and demoLeadAlert.js:49-55 is where it lives; this file
// already carries a SECOND, DIFFERENT demo URL shape at the create route
// (`demo.thedreamwedding.in/vendor/...`, :76) which has no such provenance.
// Writing the literal here would have made three shapes in one estate.
const { sendWa } = require('../../lib/sendWa');
const { claimLinkFor } = require('../../lib/discover/demoLeadAlert');

// GET /admin/demo/vendors
router.get('/vendors', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_vendors').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, vendors: data || [] });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors
router.post('/vendors', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { ig_handle, display_name, category, city, whatsapp_phone, about, rate_display, photos } = req.body || {};
  if (!ig_handle || !display_name || !category || !city) {
    return res.status(400).json({ ok: false, error: 'ig_handle, display_name, category, city are required.' });
  }
  if (!Array.isArray(photos) || photos.length < 3) {
    return res.status(400).json({ ok: false, error: 'Minimum 3 photos required.' });
  }
  try {
    const { data, error } = await supabase
      .from('demo_vendors')
      // demoLifecycle.buildInsertPatch supplies ALL FOUR presence fields
      // (active, discover_eligible, discover_eligible_at, state:'built') so this
      // route never authors presence itself.
      .insert(demoLifecycle.buildInsertPatch({ ig_handle: ig_handle.toLowerCase().trim(), display_name: display_name.trim(), category, city, whatsapp_phone: whatsapp_phone || null, about: about || null, rate_display: rate_display || null, photos, created_by: 'admin' }))
      .select().single();
    if (error) throw error;
    return res.json({ ok: true, vendor: data, demo_url: `https://demo.thedreamwedding.in/vendor/${data.ig_handle}` });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, error: 'A demo vendor with this IG handle already exists.' });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /admin/demo/vendors/:id
router.delete('/vendors/:id', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    // Was `.update({ active: false })` — presence written in the route. The
    // module now owns it. The EFFECT is unchanged: removal flips `active` only
    // (CE-136 §3), because `active=false` already hides the row from both the
    // couple feed (`discover_eligible AND active`) and the demo lane (`active`
    // alone), and leaving `discover_eligible` untouched is what lets restore()
    // return the row to its prior presence without guessing.
    const r = await demoLifecycle.deactivate(supabase, req.params.id);
    if (r.ok === false && r.reason === 'not_found') return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// GET /admin/demo/leads
router.get('/leads', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_leads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, leads: data || [] });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/leads — seed a mock lead
router.post('/leads', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { demo_vendor_id, demo_vendor_handle, bride_name, bride_phone, bride_wedding_city, bride_wedding_date, state, raw_message, otp_verified } = req.body || {};
  if (!demo_vendor_id || !demo_vendor_handle || !bride_name || !bride_phone) {
    return res.status(400).json({ ok: false, error: 'demo_vendor_id, demo_vendor_handle, bride_name, bride_phone required.' });
  }
  try {
    const { data, error } = await supabase
      .from('demo_leads')
      .insert({ demo_vendor_id, demo_vendor_handle, bride_name, bride_phone, bride_wedding_city: bride_wedding_city || null, bride_wedding_date: bride_wedding_date || null, state: state || 'new', raw_message: raw_message || null, otp_verified: otp_verified || false, notified_vendor: false, admin_notified: false })
      .select().single();
    if (error) throw error;
    return res.json({ ok: true, lead: data });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors/:id/discover-grant
router.post('/vendors/:id/discover-grant', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_vendors').select('id').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    const r = await demoLifecycle.setDiscoverEligible(supabase, req.params.id, true);
    if (r.ok === false) return res.status(409).json({ ok: false, error: r.reason });
    return res.json({ ok: true, vendor: { id: r.row.id, display_name: r.row.display_name, discover_eligible: r.row.discover_eligible } });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors/:id/discover-revoke
router.post('/vendors/:id/discover-revoke', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_vendors').select('id').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    // THE C-2 CURE lands here: the module CLEARS discover_eligible_at on revoke.
    const r = await demoLifecycle.setDiscoverEligible(supabase, req.params.id, false);
    if (r.ok === false) return res.status(409).json({ ok: false, error: r.reason });
    return res.json({ ok: true, vendor: { id: r.row.id, display_name: r.row.display_name, discover_eligible: r.row.discover_eligible } });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /admin/demo/vendors/:id/invite — THE INVITE CALLER (TDW_08 Sitting A)
//
// WHY THIS ROUTE EXISTS. demoLifecycle.onInvited has been complete, correct and
// UNREACHABLE since it shipped: nothing in the estate called it, so every
// production row stayed `legacy`, onEnquiry refused every real enquiry, and the
// lifecycle logged a no-op on a machine that could not be entered. This is the
// door. Founder ruling: 「 I fire invites through admin console 」.
//
// THE ORDER IS LOAD-BEARING — PRE-CHECK, then SEND, then STATE (CE-146 §5).
//   · pre-check BEFORE the send, because a template is a real message to a real
//     handset and spending one on a row the module will then refuse is not a
//     recoverable mistake.
//   · state AFTER the send, because `invited` ASSERTS that a template was sent.
//     That is CE-135 §4(2)'s principle — the same argument that makes onInvited
//     refuse a phoneless row — applied one layer out. A refused or failed send
//     must leave the row exactly as it was.
//
// THE PRE-CHECK READS THE MODULE'S OWN FROZEN LIST, never a literal. Duplicating
// `['legacy','built']` here would make this file a second authority on a
// transition rule, which is precisely the drift demoLifecycle was built to end.
// One authority (demoLifecycle.INVITE_STATES), two readers.
//
// THIS SEND IS tdw_demo_invite's FIRST EVER. Approved 2026-07-19 and never
// called by any code path until this route — the template was approved, paid
// for and unreachable, exactly as tdw_morning_nudge_vendor was before F4.
//
// ⚠ TWO THINGS THIS ROUTE DOES NOT DO, declared rather than discovered:
//   · IT DOES NOT CONSULT THE 25/day CAP (F-08.12). readDailyCap's only consumers
//     are runOpenerJob (prospects.js:213) and the admin cap route
//     (api/admin/prospects.js:109) — the cap governs the cold-prospect BATCH
//     SWEEP and nothing else. Spec §3's "25/day governance owns invite volume"
//     describes a volume control that does not exist for hand-fired sends.
//     Pressing this eleven times sends eleven templates. The cure belongs with
//     the bulk build, where volume actually arises.
//   · IT DOES NOT DECLARE nudgeClass, so WaNudgeOptedOutError can never fire here
//     (sendWa.js:209 gates that limb on the caller's own declaration). An invite
//     is not a nudge. The FULL cross-line opt-out still binds and is handled.
//
// ⚠ F-08.17 — TWO PRODUCTION DEMO ROWS SHARE ONE HANDSET (founder SELECT,
// 2026-08-02). `prospects` holds one row per phone and `demo_vendor_ref` is
// single-valued, so inviting the second of a shared-phone pair OVERWRITES the
// first's linkage and STOP from that handset then reaches only the second. Filed,
// not cured — the fix is a linkage table and it is not this sitting's. Until it
// is, this route must not be fired on both rows of a shared-phone pair.
router.post('/vendors/:id/invite', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    // ── 1 · PRE-CHECK. Mirrors the grant/revoke sibling shape at :131-134 and
    //        :145-148, widened from an existence probe to the two facts that
    //        decide whether a template may be spent.
    const { data: row, error } = await supabase
      .from('demo_vendors')
      .select('id, ig_handle, display_name, whatsapp_phone, state')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    if (demoLifecycle.INVITE_STATES.includes(row.state) === false) {
      return res.status(409).json({ ok: false, error: 'illegal_transition', detail: `${row.state} -> invited` });
    }
    if (!row.whatsapp_phone) {
      return res.status(409).json({ ok: false, error: 'no_phone', detail: row.ig_handle });
    }

    // ── 2 · THE SEND. Through the one gate, on the marketing line
    //        (templates.js:112), which routes via MARKETING_PHONE_NUMBER_ID and
    //        carries the cross-line STOP gate. The body is founder-frozen; this
    //        route supplies only the two declared variables.
    const claimLink = claimLinkFor(row.ig_handle);
    if (!claimLink) {
      return res.status(409).json({ ok: false, error: 'no_handle', detail: row.id });
    }
    try {
      await sendWa({
        line: 'marketing',
        to: row.whatsapp_phone,
        templateKey: 'demo_invite',
        vars: { name: row.display_name, claim_link: claimLink },
        supabase,
      });
    } catch (e) {
      const code = (e && e.code) || 'send_failed';
      if (code === 'opted_out') {
        console.log(`[admin/demo/invite] REFUSED ${row.ig_handle} — recipient has opted out; no state written`);
        return res.status(409).json({ ok: false, error: 'opted_out', detail: row.ig_handle });
      }
      console.error(`[admin/demo/invite] SEND FAILED for ${row.ig_handle}: ${code} — ${e && e.message} `
        + '(no state written; the row is exactly as it was)');
      return res.status(502).json({ ok: false, error: code, detail: e && e.message });
    }

    // ── 3 · THE STATE. Only now, and only through the module.
    const r = await demoLifecycle.onInvited(supabase, row.id, { via: 'admin_console' });
    if (r.ok === false) {
      // Unreachable after the pre-check unless the row moved between the two
      // reads. LOUD, never papered: a template has already reached a handset and
      // the row does not say so, which is the one inconsistency this route's
      // whole ordering exists to prevent.
      console.error(`[admin/demo/invite] SENT BUT NOT STAMPED for ${row.ig_handle}: ${r.reason} `
        + `(${r.detail}) — the vendor has the message and the row does not record it`);
      return res.status(500).json({ ok: false, error: 'sent_not_stamped', detail: r.reason });
    }

    // A FAILED LINKAGE IS A 200 WITH A FLAG, NOT AN ERROR (CE-147 §4). The send
    // happened and the state is true; answering 409 while the vendor's handset is
    // buzzing would be the house's "never a false done" inverted into a false
    // failure. The flag is what the founder reads, and onInvited has already
    // logged the reason loudly.
    return res.json({
      ok: true,
      vendor: { id: r.row.id, display_name: r.row.display_name, discover_eligible: r.row.discover_eligible },
      state: r.state,
      prospect_linked: r.prospect_linked === true,
    });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/cloudinary-sign
router.post('/cloudinary-sign', requireAdminPassword, async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const preset    = process.env.CLOUDINARY_UPLOAD_PRESET || 'dream_wedding_uploads';
  if (!cloudName || !apiKey || !apiSecret) return res.status(500).json({ ok: false, error: 'Cloudinary not configured.' });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder    = 'demo_vendors';
  const toSign    = `folder=${folder}&timestamp=${timestamp}&upload_preset=${preset}${apiSecret}`;
  const signature = crypto.createHash('sha256').update(toSign).digest('hex');
  return res.json({
    ok: true,
    params: { timestamp, folder, upload_preset: preset, api_key: apiKey, signature },
    upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  });
});

module.exports = router;

// GET /admin/demo/claims — list all claim requests newest first
// ── F-07.36 CURED · THE MIDDLEWARE EVERY SIBLING ALREADY HAD ────────────────
// These two routes carried NO `requireAdminPassword` while every other route in
// this file does (:27 · :38 · :61 · :99 · :114). `demo_claim_requests` holds
// vendor NAMES and PHONE NUMBERS (PUBLIC_SCHEMA.md:348-356) — an unauthenticated
// GET listed the estate's entire claim pipeline to anyone who knew the path, and
// an unauthenticated PATCH let them mark claims contacted.
//
// It mattered before this sitting and it matters more after it: TDW_07 P5 points
// `demo_lead_alert`'s {{3}} at the claim landing, so every demo alert we send
// drives a real vendor's phone number into this table.
//
// (These two handlers are declared BELOW `module.exports = router` at :146. That
// is ugly but not a defect — the export holds the router by reference and later
// `router.get`/`router.patch` calls mutate the same object, so both routes do
// register. Verified, and left where it stands: moving them is a diff that looks
// like a fix and changes nothing. The missing middleware was the defect.)
router.get('/claims', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_claim_requests')
      .select('*')
      .order('claimed_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, claims: data || [] });
  } catch (err) {
    console.error('[admin/demo/claims]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// PATCH /admin/demo/claims/:id/contacted — toggle contacted flag
router.patch('/claims/:id/contacted', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id } = req.params;
  const { contacted } = req.body || {};
  try {
    const { data, error } = await supabase
      .from('demo_claim_requests')
      .update({ contacted: !!contacted })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ ok: true, claim: data });
  } catch (err) {
    console.error('[admin/demo/claims/:id/contacted]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});
