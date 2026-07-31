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
// DEMO VENDOR (a public.demo_vendors row — no account, no user yet):
//   1. The demo_lead_alert template on the marketing lane.        [P5, NEW]
//   2. A prospects row, state 'templated', notes 'demo_lead'.     [P5, NEW]
//   3. A demo_leads row — the enquiry stored against the demo     [P5, NEW]
//      vendor, hydrated server-side from her session. Everything a
//      public surface may read from it is masked at one home
//      (src/lib/demo/maskDemoLead.js); bride_phone reaches none.
//      LOGGED-OUT TAPS ARE ALERT-ONLY: bride_name/bride_phone are
//      NOT NULL, so an anonymous enquiry cannot form a row. Stated
//      at the branch, not worked around.
//   4. enquiry_taps analytics row.
//   What still has nowhere to land: no couple_enquiries row (that table's
//   vendor_id references the REAL vendors plane) and no engine binder (no agent
//   exists until the vendor claims). Both absences are true and stated.
//
// No JWT (discover is public). couple_id arrives in the body when the bride is
// logged in; the rows that need her are best-effort on it, and the response says
// which of them happened.
//
// Body: { vendor_id, couple_id?, bride_name?, bride_phone? }
// Returns: { ok, species, sent, vendor_notified, notify_mode, notify_refusal,
//            lead_created, enquiry_saved, batched? }
//   ok              = the enquiry EXISTS where the vendor will find it (the row).
//   vendor_notified = the WhatsApp PING left. The two are independent facts and
//                     the response states both — F-07.45's surface arm.

'use strict';

const express       = require('express');
const router        = express.Router();
const asyncHandler  = require('../../lib/asyncHandler');
// ── F-07.45 TRANSPORT ARM — sendWa, not the raw transport ────────────────────
// `sendWhatsApp` (src/lib/whatsapp.js) is the TRANSPORT. `sendWa`
// (src/lib/sendWa.js) is the GATE that sits above it. This door used the
// transport directly; see the block at the send site for what that cost.
const { sendWa, WaWindowClosedError } = require('../../lib/sendWa');
const { vendorWindowOpen } = require('../../lib/vendor/waWindow');
const { createLead }   = require('../../lib/vendor/leads');
const { enquiryToBinder } = require('../../lib/vendor/enquiryBinder');  // weld: enquiries → binders
const { sendDemoLeadAlert } = require('../../lib/discover/demoLeadAlert'); // P5: the free-lead hook
const { bandCeiling, normalizeFunctions } = require('../../lib/discover/enquiryFields');

// ── F-07.50 CURED · THE {{3}} LINK POINTED AT A 404 ──────────────────────────
// THIS READ: 'https://thedreamwedding.in/vendor/leads' — a path I authored from
// the shape of the sentence, never from the route table. IT DOES NOT EXIST.
// Derived by command against dreamos-pwa @ 5c16261: `find app/vendor -name
// page.tsx` lists /vendor/discover/leads and NO /vendor/leads; there is no
// rewrite or redirect in next.config.ts or middleware.ts; and the app's own
// BottomNav.tsx:104 links Leads to '/vendor/discover/leads'.
//
// SEVERITY: this value ships inside tdw_enquiry_alert_vendor, which Meta
// APPROVED on 2026-07-31 and which sendWa now dispatches. Every out-of-window
// vendor would have received a real message containing a dead link — the
// costume class delivered by an approved template, which is worse than the
// silence F-07.40 was minted to end.
//
// THE FIX IS CODE, NOT META. {{3}} is a template VARIABLE, so the approved body
// is untouched and no refiling is needed; only the value passed here changes.
//
// ONE HOME, and it is checked. The bench pins this constant against the pwa's
// actual route table (cross-repo, skipped-with-reason where the sibling tree is
// absent) so the next person to move that page reddens a cell instead of
// shipping a 404 to a vendor's phone.
const VENDOR_LEADS_URL = 'https://thedreamwedding.in/vendor/discover/leads';

router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const {
    vendor_id, couple_id, bride_name, bride_phone,
    // ── THE SHEET'S FOUR FIELDS (CE-ruled 2026-07-31) ────────────────────────
    // All OPTIONAL. Session hydration remains the default; a POSTed value
    // OVERRIDES it, because her explicit word beats her stored profile.
    //
    // WHY THIS RULING EXISTS. The sheet shows these four, prefilled, and lets
    // her edit them. A door that accepted the tap and discarded the edits would
    // be the costume class in form-shape: she corrects her wedding date, the
    // correction is thrown away, and the vendor's brief — and his availability
    // clash line — carry the OLD date while she believes she fixed it. Nothing
    // in the interface would ever say otherwise.
    //
    // The rule is symmetric and absolute: a field this door cannot honestly
    // land is rendered READ-ONLY on the sheet, never editable-and-dropped.
    functions,      // string[] — her wedding functions
    wedding_date,   // 'YYYY-MM-DD'
    city,           // text
    budget_band,    // the band's `value` — whole-rupee ceiling as a string, '' = no ceiling
  } = req.body || {};

  // Parsed at ONE home (src/lib/discover/enquiryFields.js) so the bench can drive
  // the real functions. These were inline here until the both-ways run proved the
  // cells written for them were tautologies — see that file's header.
  const postedBudgetMax = bandCeiling(budget_band);
  const postedFunctions = normalizeFunctions(functions);

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
    return await handleRealVendor({ supabase, res, vendor, couple_id, bride_name, bride_phone,
                                    postedFunctions, wedding_date, city, postedBudgetMax });
  }

  const { data: demoVendor } = await supabase
    .from('demo_vendors')
    .select('id, display_name, ig_handle, category, city, whatsapp_phone')
    .eq('id', vendor_id)
    .eq('discover_eligible', true)
    .eq('active', true)
    .maybeSingle();

  if (demoVendor) {
    return await handleDemoVendor({ supabase, res, demoVendor, couple_id, wedding_date, city });
  }

  return res.status(404).json({ ok: false, error: 'Vendor not found.' });
}));

// ─────────────────────────────────────────────────────────────────────────────
// THE REAL SPECIES
// ─────────────────────────────────────────────────────────────────────────────
async function handleRealVendor({ supabase, res, vendor, couple_id, bride_name, bride_phone,
                                  postedFunctions, wedding_date, city, postedBudgetMax }) {
  const { data: user } = await supabase
    .from('users')
    .select('phone')
    .eq('id', vendor.user_id)
    .maybeSingle();

  if (!user || !user.phone) {
    console.error(`[enquire] vendor ${vendor.id} is discover-eligible but has no user phone — enquiry refused`);
    return res.status(422).json({ ok: false, error: 'Vendor phone not available.' });
  }

  // ── F-07.56 CURED (CE-ruled) · THE REAL LEG HYDRATES TOO ────────────────────
  // The demo leg has hydrated her identity server-side since P5 (:455-477) and
  // the real leg never did — so the SAME bride reached a demo vendor as
  // "Dev Test 23" and a real, paying vendor as "a couple". The asymmetry was
  // witnessed live in production (demo_leads.bride_name, Legacy Jewellers).
  //
  // THE JOIN IS THE DEMO LEG'S, UNCHANGED: neither `name` nor `phone` lives on
  // `couples` (21 columns, PUBLIC_SCHEMA.md:280-304); the identity is one hop
  // away at `couples.user_id` -> `public.users` (9 columns, :872-884).
  //
  // HYDRATED WINS, BODY IS THE FALLBACK — deliberately the OPPOSITE of the
  // date/city rule at :467-468, and the reason is the door itself: this route is
  // UNAUTHENTICATED (router.js:59 mounts it with no middleware), so `bride_name`
  // in the body is caller-supplied and her account is the truer witness. The
  // posted value still serves the logged-OUT bride, who has no couple_id at all.
  // ── THE TWO PRECEDENCES ARE OPPOSITE ON PURPOSE (CE-ruled STANDING LAW) ─────
  // IDENTITY fields (name, phone) — HYDRATED wins, posted is the fallback.
  // UTTERANCE fields (date, city) — POSTED wins, hydrated is the fallback
  //                                 (the demo leg's rule, enquire.js :467-468).
  //
  // The reason, so no future sitting "harmonizes" the two into one rule: her
  // ACCOUNT is the truer witness of WHO she is; her KEYSTROKES are the truer
  // witness of WHAT she asked. A bride may enquire about a December date for a
  // wedding her profile still calls undated, and that posted date is the truth of
  // the enquiry. She may not rename herself at an unauthenticated door.
  //
  // [F-06.85: this paragraph is conditioned on a MECHANICAL fact — that this
  //  route carries NO auth middleware. Mechanism: src/api/router.js:59, which
  //  mounts '/discover/enquire' bare. If a guard ever appears there, the identity
  //  half's justification changes and this sentence must be re-read. The forged-
  //  couple_id exposure this trust implies is F-07.62, deferred to the AUTH
  //  SITTING by ruling — not cured here, and not to be quietly cured here either.]
  let hydratedName = null, hydratedPhone = null;
  if (couple_id) {
    try {
      const { data: couple } = await supabase
        .from('couples')
        .select('user_id')
        .eq('id', couple_id)
        .maybeSingle();
      if (couple?.user_id) {
        const { data: u } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', couple.user_id)
          .maybeSingle();
        hydratedName  = u?.name  || null;
        hydratedPhone = u?.phone || null;
      }
    } catch (err) {
      // Never fatal: a vendor hearing "a couple" is the OLD behaviour, not a new
      // failure, and refusing her enquiry over a name lookup would be worse.
      console.warn('[enquire:real] bride hydration failed (falling back to posted):', err.message);
    }
  }
  const brideNameFinal  = hydratedName  || bride_name  || null;
  const bridePhoneFinal = hydratedPhone || bride_phone || null;

  // ── 1. The vendor's ping, carrying the availability hint ──────────────────
  const brideLine = brideNameFinal ? `Bride: ${brideNameFinal}` : 'A bride on The Dream Wedding';
  const phoneLine = bridePhoneFinal ? `\nBride contact: ${bridePhoneFinal}` : '';

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
      // HER WORD REACHES THE CLASH PREDICATE. The builder's own contract already
      // ranks these above coupleId hydration ("takes precedence", :25, honoured
      // at :90), so passing them is the whole implementation of the override —
      // and it is what makes a corrected date produce a corrected clash line
      // rather than a confidently wrong one about the date she just fixed.
      weddingDate: wedding_date || undefined,
      budgetMax:   postedBudgetMax != null ? postedBudgetMax : undefined,
    });
  } catch (err) {
    console.warn('[enquire] enrichment failed (non-fatal):', err.message);
  }

  const enrichBlock = enrichment ? `\n\n${enrichment}` : '';
  const body = `\u2726 New enquiry from The Dream Wedding\n\n${brideLine} is interested in your work.${phoneLine}${enrichBlock}\n\nShe found you on the Discover feed. Reply on WhatsApp to connect.\n\n\u2014 TDW`;

  // ── F-07.45 CURED · THE TRANSPORT ARM ─────────────────────────────────────
  //
  // WHAT THIS CODE READ, AND WHY IT WAS WRONG. It called `sendWhatsApp` — the
  // raw transport — inside a try/catch, set `sent = false` in the catch, and
  // trusted that to be the whole truth. It was not, because `sendWhatsApp` has
  // THREE refusal shapes and only ONE of them throws:
  //
  //   opted out            → RETURNS {blocked:'opted_out',   sent:false}   (whatsapp.js:131-134)
  //   no Meta lane         → RETURNS {blocked:'no_meta_lane', sent:false}  (whatsapp.js:152-153)
  //   window closed / API  → THROWS MetaSendError                          (metaCloud.js:87-95)
  //
  // The return value was discarded. So on two of the three, `sent` stayed TRUE
  // and this door reported a delivery that never happened. F-07.40's "loud
  // swallow" cure was VACUOUS on exactly the paths it was minted to close.
  //
  // WHAT F-07.45 IS **NOT**. It was minted as a "LIVE STOP BREACH" — that
  // framing is retracted at the chair's own correction №29. `sendWhatsApp`
  // carries the F-05.2 cross-line opt-out gate ITSELF (whatsapp.js:131, its own
  // comment at :126-128 declaring the closure). STOP was never bypassed here.
  // The cure rides for the CORRECTED reasons alone.
  //
  // WHY sendWa, THEN. Three capabilities the transport genuinely lacks:
  //   1. TYPED refusals for all three shapes — every one THROWS a catchable
  //      WaError with a `.code`, so a caller cannot discard a refusal by
  //      forgetting to read a return value. The class of bug above becomes
  //      structurally unavailable.
  //   2. WINDOW DETERMINATION — the transport posts free-form text and lets Meta
  //      reject it. sendWa refuses BEFORE the wire and names why.
  //   3. THE TEMPLATE PATH — the only honest way to reach an out-of-window
  //      vendor, wired below.
  // The STOP gate transfers equivalently (sendWa.js:201-203, WaOptedOutError).
  // Nothing is lost in the move; the estate's "sendWa is the only outbound" law
  // (spec §3, TDW_05) is now true at this door instead of nearly true.
  //
  // The window is determined by the CALLER and passed as a boolean — the cron
  // precedent (cron.js:76), because sendWa's own default checker takes a single
  // conversationId and a vendor's inbound may land on any of his vendor_self
  // threads. The predicate lives at one home: src/lib/vendor/waWindow.js.
  let vendorNotified = false;
  let notifyMode     = null;   // 'text' | 'template' | null
  let notifyRefusal  = null;   // the typed code, for the log and the walk

  const win = await vendorWindowOpen(supabase, vendor.id);
  try {
    await sendWa({
      line: 'vendor',
      to: user.phone,
      text: body,
      windowOpen: win.open,
      supabase,
    });
    vendorNotified = true;
    notifyMode = 'text';
  } catch (err) {
    notifyRefusal = (err && err.code) || 'unknown';

    // ── F-07.40 · THE FALLBACK, WIRED ───────────────────────────────────────
    // A closed window is the ONE refusal a template can answer. Every other
    // refusal (opted out, line not configured, bad call) is a refusal a template
    // would not fix and MUST NOT paper over — an opted-out vendor is not
    // reachable by changing message format.
    //
    // `enquiry_alert_vendor` is in the registry at status 'pending'
    // (templates.js). sendWa's own gate therefore refuses it with
    // WaTemplateNotApprovedError until the founder flips the byte after Meta's
    // word. That refusal is TYPED and LOGGED, never silent, and the wiring does
    // not have to be built again on approval day.
    if (err instanceof WaWindowClosedError) {
      try {
        await sendWa({
          line: 'vendor',
          to: user.phone,
          templateKey: 'enquiry_alert_vendor',
          vars: [
            vendor.business_name || 'there',
            brideNameFinal || 'a couple',
            VENDOR_LEADS_URL,
          ],
          supabase,
        });
        vendorNotified = true;
        notifyMode = 'template';
        notifyRefusal = null;
      } catch (tplErr) {
        notifyRefusal = (tplErr && tplErr.code) || 'template_unknown';
      }
    }
  }

  if (!vendorNotified) {
    console.error(
      `[enquire] VENDOR NOT NOTIFIED — vendor ${vendor.id}: refusal '${notifyRefusal}' ` +
      `(window ${win.open ? 'open' : 'closed'}: ${win.reason}). ` +
      'The lead is stored and visible in his Leads tab; the WhatsApp ping did not leave. ' +
      '(F-07.40: enquiry_alert_vendor is filed but not yet approved by Meta.)'
    );
  }

  // `sent` is retained as the wire name existing callers already read; it now
  // means what it always claimed to mean. `vendor_notified` is its successor and
  // carries the same fact under the name the response should have used from the
  // start. Both are emitted; neither is a guess.
  const sent = vendorNotified;

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
      name:        brideNameFinal  || 'Dream Wedding enquiry',
      phone:       bridePhoneFinal || null,
      source:      'discover',
      // THE SHEET'S FOUR, EACH ON ITS OWN WITNESSED COLUMN (PUBLIC_SCHEMA.md,
      // public.leads): event_types ARRAY · wedding_date date · wedding_city text
      // · budget_max integer. All four are accepted by createLead's own params
      // (src/lib/vendor/leads.js:17-19) — nothing is invented here.
      event_types:  postedFunctions,
      wedding_date: wedding_date || null,
      // Her typed city beats the vendor's city, which was only ever a stand-in
      // for a value this door could not previously receive.
      wedding_city: city || vendor.city || null,
      budget_max:   postedBudgetMax,
      raw_message: `${brideNameFinal || 'A bride'} enquired via the Discover feed on The Dream Wedding.`,
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
      name:  brideNameFinal || 'Dream Wedding enquiry',
      phone: bridePhoneFinal || null,
      note:  `${brideNameFinal || 'A bride'} enquired via the Discover feed on The Dream Wedding.`,
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

  // ── F-07.45 CURED · THE SURFACE ARM ───────────────────────────────────────
  //
  // THIS READ `ok: true` UNCONDITIONALLY. Every caller branches on `ok`
  // (EnquirySheet.tsx checks `data.ok === false`; sanctuary reads `!r.ok` for
  // the failure toast), so a constant `true` meant V6's failure line was
  // UNREACHABLE BY CONSTRUCTION — a vetoed string that could never render, over
  // a door that could genuinely fail its writes. The toast was not wrong; it was
  // never asked.
  //
  // `ok` NOW MEANS: THE ENQUIRY EXISTS WHERE THE VENDOR WILL FIND IT.
  // That is `leadCreated` — the public.leads row his Leads tab reads and the row
  // `pending_lead_pings.lead_id` FKs to (0050:19). It is deliberately NOT:
  //   • `enquiry_saved` — false for a logged-out bride BY DESIGN, and she is
  //     still a real enquiry to the vendor. Requiring it would make V6's failure
  //     toast fire on the estate's most common anonymous path.
  //   • the binder — Donna's cabinet, the other plane. Its absence does not stop
  //     the vendor seeing the enquiry.
  //   • `vendor_notified` — RULED. The WhatsApp ping is a NOTIFICATION of a
  //     thing that already exists, not the thing itself. "Enquiry sent ✦ saved
  //     in Vendors" stays TRUE when the row landed and the ping was refused: the
  //     toast claims the ROW, not the PING, and the vendor finds it in his Leads
  //     tab either way. Binding `ok` to the ping would make her toast lie in the
  //     OTHER direction — telling her nothing happened when her enquiry is
  //     sitting in front of him.
  //
  // `vendor_notified` rides beside it carrying what the PING proved, so the fact
  // is on the wire and witnessable rather than inferred. This is the demo leg's
  // own pattern (:382 `notified_vendor: alert.sent === true`) — the asymmetry
  // between the two species closes toward the honest one.
  return res.json({
    ok: leadCreated,
    species: 'real',
    sent,
    vendor_notified: vendorNotified,
    notify_mode: notifyMode,
    notify_refusal: notifyRefusal,
    lead_created: leadCreated,
    enquiry_saved: enquirySaved,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// THE DEMO SPECIES — the free-lead hook
// ─────────────────────────────────────────────────────────────────────────────
async function handleDemoVendor({ supabase, res, demoVendor, couple_id, wedding_date, city }) {
  // ── SERVER-SIDE HYDRATION (CE-ruled 2026-07-31, Ask 3) ────────────────────
  // The sheet collects NEITHER a name NOR a phone. It prefills from her profile,
  // so her session IS the source, and asking a logged-in bride to retype what we
  // already hold would be a worse sheet and a second copy of one fact.
  //
  // THE JOIN, WITNESSED: neither column lives on `couples` (21 columns,
  // PUBLIC_SCHEMA.md — no `name`, no `phone`). The identity is one hop away:
  // `couples.user_id` → `public.users`, which carries `name` and `phone`. This is
  // the same hop the real-vendor leg already makes for the vendor's own number.
  let weddingDate = wedding_date || null, weddingCity = city || null, brideName = null, bridePhone = null;
  if (couple_id) {
    try {
      const { data: couple } = await supabase
        .from('couples')
        .select('wedding_date, wedding_city, user_id')
        .eq('id', couple_id)
        .maybeSingle();
      // POSTED OVERRIDES HYDRATED — the same rule as the real leg, applied to the
      // only two of the four that `demo_leads` can honestly hold. `functions` and
      // `budget_band` have NO column on that table (13 cols, PUBLIC_SCHEMA.md), so
      // they are never accepted here and the sheet renders those two READ-ONLY on
      // a demo card. Display-and-confirm is honest; edit-and-discard is not.
      weddingDate = wedding_date || couple?.wedding_date || null;
      weddingCity = city         || couple?.wedding_city || null;
      if (couple?.user_id) {
        const { data: u } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', couple.user_id)
          .maybeSingle();
        brideName  = u?.name  || null;
        bridePhone = u?.phone || null;
      }
    } catch (err) {
      console.warn('[enquire:demo] hydration failed (alert still fires):', err.message);
    }
  }

  const alert = await sendDemoLeadAlert(supabase, { demoVendor, weddingDate });

  // ── THE ENQUIRY IS STORED AGAINST THE DEMO VENDOR (spec §P5.2) ────────────
  // `demo_leads` was purpose-built for this — its own `notified_vendor` column is
  // this sitting's alert flag. Everything a public surface can read from it is
  // masked at one home (src/lib/demo/maskDemoLead.js); `bride_phone` reaches no
  // surface and no model context.
  //
  // This is what makes the APPROVED, BYTE-FROZEN template's promise true:
  // "their enquiry is waiting in your ready account." Without the row a claiming
  // vendor would arrive to an empty account holding a message that said otherwise.
  //
  // ── THE LOGGED-OUT BRANCH, STATED WHERE IT HAPPENS ────────────────────────
  // `bride_name` and `bride_phone` are both NOT NULL. An anonymous tap supplies
  // neither, so the row is IMPOSSIBLE — not skipped by preference, refused by the
  // schema. That path is ALERT-ONLY: the vendor still hears, and the hook still
  // fires, but there is no stored enquiry and nothing downstream pretends there
  // is. V6's logged-out toast already promises strictly less ("Enquiry sent",
  // without the saved-link half), so the surface and the storage agree.
  let leadStored = false;
  if (brideName && bridePhone) {
    try {
      const { error } = await supabase.from('demo_leads').insert({
        demo_vendor_id:     demoVendor.id,
        demo_vendor_handle: demoVendor.ig_handle,
        bride_name:         brideName,
        bride_phone:        bridePhone,
        bride_wedding_date: weddingDate,
        bride_wedding_city: weddingCity,
        // The alert's OWN result, never an assumption. If the template was
        // batched, refused, or had no target, this is false and the founder's
        // admin queue can see which vendors were never actually told.
        notified_vendor:    alert.sent === true,
      });
      if (error) throw error;
      leadStored = true;
    } catch (err) {
      console.error(
        `[enquire:demo] demo_lead STORE FAILED for demo vendor ${demoVendor.id}: ${err.message} — ` +
        'the alert fired but the enquiry is NOT stored; a claiming vendor will find an empty account'
      );
    }
  } else if (couple_id) {
    console.warn(
      `[enquire:demo] couple ${couple_id} has no name/phone on users — alert-only path, no demo_lead row`
    );
  }

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
  //
  // ── F-07.45 SURFACE ARM, THE DEMO HALF ────────────────────────────────────
  // This leg also read `ok: true` unconditionally. Its `ok` now means the same
  // thing as the real leg's: the enquiry EXISTS where the vendor will find it —
  // here, the `demo_leads` row a claiming vendor lands on. The alert-only path
  // (no name/phone, logged out) is NOT a failure: the row is refused by the
  // schema, by design, and V6's logged-out toast already promises strictly less.
  // So `ok` is false ONLY when a store was ATTEMPTED and FAILED — the one case
  // where the vendor is about to be told about an enquiry he cannot find, which
  // is precisely the sentence the loud log at :387 is already shouting about.
  const storeAttempted = !!(brideName && bridePhone);
  return res.json({
    ok: storeAttempted ? leadStored : true,
    species: 'demo',
    sent: alert.sent,
    vendor_notified: alert.sent === true,
    notify_mode: alert.sent === true ? 'template' : null,
    notify_refusal: alert.sent === true ? null : (alert.reason || 'unknown'),
    lead_created: leadStored,
    enquiry_saved: false,
    batched: alert.reason === 'batched_48h',
  });
}

module.exports = router;
