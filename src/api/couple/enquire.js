// src/api/couple/enquire.js
// POST /api/v2/discover/enquire
//
// ── TDW_07 P5 — THE ENQUIRY PIPELINE, BOTH SPECIES ───────────────────────────
// One Discover "Enquire" tap resolves to a SPECIES and fans out accordingly.
//
// REAL VENDOR (a public.vendors row):
//   1. WhatsApp ping to the vendor, free-form, carrying the availability hint.
//   2. public.leads row via createLead, source 'discover'.        [P5, NEW]
//   3. engine.records binder via enquiryToBinder (Donna's cabinet).
//   4. couple_enquiries row → her "Enquired" list.
//   5. enquiry_taps analytics row.
//
// DEMO VENDOR (a public.demo_vendors row — no account, no user, no leads):
//   1. The demo_lead_alert template on the marketing lane.        [P5, NEW]
//   2. A prospects row, state 'templated', notes 'demo_lead'.     [P5, NEW]
//   3. enquiry_taps analytics row.
//   The other three have nowhere to land: there is no vendor row to own a lead,
//   no engine agent to own a binder. That absence is stated, not worked around.
//
// No JWT (discover is public). couple_id arrives in the body when the bride is
// logged in; the rows that need her are best-effort on it, and the response says
// which of them happened.
//
// Body: { vendor_id, couple_id?, bride_name?, bride_phone? }
// Returns: { ok, species, sent, lead_created, enquiry_saved, batched? }

'use strict';

const express       = require('express');
const router        = express.Router();
const asyncHandler  = require('../../lib/asyncHandler');
const { sendWhatsApp } = require('../../lib/whatsapp');
const { createLead }   = require('../../lib/vendor/leads');
const { enquiryToBinder } = require('../../lib/vendor/enquiryBinder');  // weld: enquiries → binders
const { sendDemoLeadAlert } = require('../../lib/discover/demoLeadAlert'); // P5: the free-lead hook

router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { vendor_id, couple_id, bride_name, bride_phone } = req.body || {};

  if (!vendor_id) {
    return res.status(400).json({ ok: false, error: 'vendor_id required' });
  }

  // ── SPECIES RESOLUTION — FROM THE DATABASE, NEVER FROM THE BODY ───────────
  // The Discover card carries `is_demo` (discover.js:247) and the client could
  // send it. It is not asked for and would not be believed if it were: an
  // untrusted flag deciding which table a write lands in is a door that can be
  // told what to be. `vendors.id` and `demo_vendors.id` are both uuid primary
  // keys in different tables — a real id cannot collide with a demo id, so the
  // resolution order below is total and unambiguous.
  //
  // ── F-07.35 CURED · THE PAUSE PREDICATE REACHES THE DOOR ─────────────────
  // THIS SELECT READ: .eq('discover_eligible', true) ALONE.
  // The FEED excludes paused vendors — discover.js:69, `.eq('discover_paused',
  // false)`, the 0101 predicate. The DOOR did not, so a vendor who used his own
  // pause switch vanished from the feed and kept receiving Discover enquiries
  // through any link that still had his id. P1's copy promises that "enquiries
  // already in flight still reach you" — IN FLIGHT, not new ones minted after he
  // paused. The two surfaces now read the same two columns.
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, routing_handle, user_id, category, city, base_fee_min, base_fee_max')
    .eq('id', vendor_id)
    .eq('discover_eligible', true)
    .eq('discover_paused', false)
    .maybeSingle();

  if (vendor) {
    return await handleRealVendor({ supabase, res, vendor, couple_id, bride_name, bride_phone });
  }

  const { data: demoVendor } = await supabase
    .from('demo_vendors')
    .select('id, display_name, ig_handle, category, city, whatsapp_phone')
    .eq('id', vendor_id)
    .eq('discover_eligible', true)
    .eq('active', true)
    .maybeSingle();

  if (demoVendor) {
    return await handleDemoVendor({ supabase, res, demoVendor, couple_id });
  }

  return res.status(404).json({ ok: false, error: 'Vendor not found.' });
}));

// ─────────────────────────────────────────────────────────────────────────────
// THE REAL SPECIES
// ─────────────────────────────────────────────────────────────────────────────
async function handleRealVendor({ supabase, res, vendor, couple_id, bride_name, bride_phone }) {
  const { data: user } = await supabase
    .from('users')
    .select('phone')
    .eq('id', vendor.user_id)
    .maybeSingle();

  if (!user || !user.phone) {
    console.error(`[enquire] vendor ${vendor.id} is discover-eligible but has no user phone — enquiry refused`);
    return res.status(422).json({ ok: false, error: 'Vendor phone not available.' });
  }

  // ── 1. The vendor's ping, carrying the availability hint ──────────────────
  const brideLine = bride_name ? `Bride: ${bride_name}` : 'A bride on The Dream Wedding';
  const phoneLine = bride_phone ? `\nBride contact: ${bride_phone}` : '';

  // The 04 availability hint lives in ONE builder and is reused, never
  // re-derived (P5 fork F5, CE-ruled). Its clash predicate is
  // enquiryEnrichment.js:107-113 — vendor_id + event_date + state 'upcoming',
  // now also `deleted_at is null` per this sitting's cure.
  let enrichment = '';
  try {
    const { buildEnquiryEnrichment } = require('../../lib/vendor/enquiryEnrichment');
    enrichment = await buildEnquiryEnrichment(supabase, {
      vendorId: vendor.id,
      vendor,
      coupleId: couple_id,
    });
  } catch (err) {
    console.warn('[enquire] enrichment failed (non-fatal):', err.message);
  }

  const enrichBlock = enrichment ? `\n\n${enrichment}` : '';
  const body = `\u2726 New enquiry from The Dream Wedding\n\n${brideLine} is interested in your work.${phoneLine}${enrichBlock}\n\nShe found you on the Discover feed. Reply on WhatsApp to connect.\n\n\u2014 TDW`;

  // ── F-07.40 CURED (in part) · THE SWALLOW GOES LOUD ───────────────────────
  // THIS CATCH READ: console.error(...); sent = false;  — and `sent` was
  // returned to a caller that never looked at it (the sole caller, sanctuary
  // page.tsx:1582, does not read the response at all). So a free-form send
  // refused outside Meta's 24h customer-service window produced: no delivery, no
  // alarm, and a success-shaped response. That is the whole defect — the vendor
  // never hears, and neither does anyone else.
  //
  // WHAT THIS CURE DOES AND DOES NOT DO. It makes the failure LOUD (error-level,
  // named, with the vendor id) and TRUE ON THE WIRE (`sent` is reported and the
  // caller now reads it). It does NOT deliver the message: no approved
  // vendor-lane template can honestly carry an enquiry alert — derived at
  // 133d709 against the registry, all three candidates rejected as costume
  // (morning_nudge_vendor claims a morning and carries a STOP that would
  // disable enquiry alerts; crew_assignment claims a crew; payment_reminder is
  // unrelated). The fallback template ships DRAFTED in this sitting's handover
  // for the founder's veto and Meta filing at seal — the P1 rider pattern.
  // Until it is approved, an out-of-window vendor is a KNOWN, LOGGED gap.
  let sent = true;
  try {
    await sendWhatsApp(user.phone, body);
  } catch (err) {
    sent = false;
    console.error(
      `[enquire] VENDOR NOT NOTIFIED — vendor ${vendor.id}: ${err.message}. ` +
      'The lead is stored and visible in his Leads tab; the WhatsApp ping did not leave. ' +
      '(F-07.40: no approved vendor-lane fallback template exists yet.)'
    );
  }

  // ── 2. The lead. public.leads, source 'discover'. ─────────────────────────
  //
  // ── №22 CURED · THE LEAD HALF OF THE CHAIN WAS NEVER BUILT ───────────────
  // `createLead` was IMPORTED at this file's head and NEVER CALLED. The comments
  // said createLead, the error string said createLead, and the code called
  // `enquiryToBinder` — so every Discover enquiry since this door was born
  // produced an engine binder and NO `public.leads` row. `source: 'discover'`
  // had zero write sites in the entire estate, and the spec's acceptance §5
  // ("lands as a lead with source discover") was unmeetable by construction.
  //
  // The FK proves this was one defect and not two: `pending_lead_pings.lead_id`
  // is `uuid not null references leads(id)` (0050:19), so no lead row meant no
  // ping row was ever physically possible either. The brief was unfed BECAUSE
  // the lead was unbuilt.
  //
  // `leads.source` carries NO CHECK constraint — PUBLIC_SCHEMA.md:1392-1397 lists
  // only leads_wedding_date_precision_check and the primary key — so 'discover'
  // is accepted as written. Witness recorded here because a source value that
  // fails a constraint fails at RUNTIME, on a live couple's tap.
  let leadCreated = false;
  try {
    const leadRes = await createLead(supabase, vendor.id, {
      name:        bride_name  || 'Dream Wedding enquiry',
      phone:       bride_phone || null,
      wedding_city: vendor.city || null,
      source:      'discover',
      raw_message: `${bride_name || 'A bride'} enquired via the Discover feed on The Dream Wedding.`,
      notes:       'Discover enquiry — she found you on the feed.',
    });
    leadCreated = !!(leadRes && leadRes.ok);
    if (!leadCreated) {
      console.error(`[enquire] createLead refused for vendor ${vendor.id}: ${leadRes && leadRes.error}`);
    }
  } catch (err) {
    console.error('[enquire] createLead threw:', err.message);
  }

  // ── 3. The binder. UNCHANGED — existing behaviour is sacred (§8). ─────────
  // This is not a duplicate of the lead: the two planes are the Plane Doctrine's
  // own split (protocol §3.4). `leads` is the typed public plane the vendor's
  // Leads tab and the ping FK read; `engine.records` is Donna's cabinet. Both
  // have readers, so both are written, and neither is invented here — this call
  // is byte-for-byte what the door already did.
  let vendorLeadId = null;
  try {
    const binderRes = await enquiryToBinder(supabase, vendor.id, {
      name:  bride_name || 'Dream Wedding enquiry',
      phone: bride_phone || null,
      note:  `${bride_name || 'A bride'} enquired via the Discover feed on The Dream Wedding.`,
    });
    vendorLeadId = binderRes?.binder?.id || null;
  } catch (err) {
    console.error('[enquire] enquiryToBinder error:', err.message);
  }

  // ── 4. Her enquiry row (only if logged in) ────────────────────────────────
  let enquirySaved = false;
  if (couple_id) {
    const { error: enqErr } = await supabase
      .from('couple_enquiries')
      .upsert({
        couple_id,
        vendor_id:       vendor.id,
        vendor_name:     vendor.business_name || null,
        vendor_category: vendor.category      || null,
        vendor_city:     vendor.city          || null,
        routing_handle:  vendor.routing_handle || null,
        vendor_lead_id:  vendorLeadId,
        created_at:      new Date().toISOString(),
      }, { onConflict: 'couple_id,vendor_id' });
    if (enqErr) console.error('[enquire] couple_enquiries upsert error:', enqErr.message);
    else enquirySaved = true;
  }

  // ── 5. Analytics tap ──────────────────────────────────────────────────────
  try {
    await supabase.from('enquiry_taps').insert({
      handle:    vendor.routing_handle || vendor.id,
      source:    'discover_inapp',
      tapped_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[enquire] enquiry_taps insert error:', err.message);
  }

  // THE RESPONSE CARRIES THE TRUTH, FIELD BY FIELD. The sheet reads these to
  // decide what to tell her, and it can only be honest about what it is told.
  // `enquiry_saved` is false for a logged-out bride BY DESIGN — there is no
  // couple row to hang it on — and the surface must not promise a saved link
  // when this says false (V6's split, founder-vetoed 2026-07-31).
  return res.json({
    ok: true,
    species: 'real',
    sent,
    lead_created: leadCreated,
    enquiry_saved: enquirySaved,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// THE DEMO SPECIES — the free-lead hook
// ─────────────────────────────────────────────────────────────────────────────
async function handleDemoVendor({ supabase, res, demoVendor, couple_id }) {
  // Her date, when we know it — the template's {{2}}. Read here rather than in
  // the alert module so that module stays a sender and not a profile reader.
  let weddingDate = null;
  if (couple_id) {
    try {
      const { data: couple } = await supabase
        .from('couples')
        .select('wedding_date')
        .eq('id', couple_id)
        .maybeSingle();
      weddingDate = couple?.wedding_date || null;
    } catch (err) {
      console.warn('[enquire:demo] couple date read failed (alert still fires):', err.message);
    }
  }

  const alert = await sendDemoLeadAlert(supabase, { demoVendor, weddingDate });

  // The tap is recorded on BOTH species — the demo leg's only durable analytics.
  try {
    await supabase.from('enquiry_taps').insert({
      handle:    demoVendor.ig_handle || demoVendor.id,
      source:    'discover_demo',
      tapped_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[enquire:demo] enquiry_taps insert error:', err.message);
  }

  // ── THE GUARDRAIL WITH TEETH (spec §3) ────────────────────────────────────
  // "demo cards are unmarked by design but their enquiry path NEVER pretends a
  // reply happened — the couple sees 'sent,' and truthful reply states only."
  // `sent` here is the ALERT's own fact, straight from the module: true when a
  // template left, false when it was batched, refused, or had no target. The
  // surface says "Enquiry sent" on true and the failure line otherwise. Nothing
  // in this response describes a reply, because no reply has happened and this
  // door will never be the thing that says one did.
  //
  // NOTE: `enquiry_saved` is false on this leg, always. There is no
  // couple_enquiries row for a demo vendor — that table's `vendor_id` references
  // the real vendors plane. Her Journey therefore will not list a demo enquiry,
  // and that is a TRUE absence, stated here so no surface invents it.
  return res.json({
    ok: true,
    species: 'demo',
    sent: alert.sent,
    lead_created: false,
    enquiry_saved: false,
    batched: alert.reason === 'batched_48h',
  });
}

module.exports = router;
