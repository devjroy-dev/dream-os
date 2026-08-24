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
const { resolveCoupleIfPresent } = require('../../lib/resolveCoupleIfPresent'); // F-07.62's cure
const { recordEnquiry } = require('../../lib/engagements');                     // TDW_16 P1: the spine's one home
// M-LEADGATE-A · R-36.8 — the tier gate's one home, shared with both leads doors.
const { hasFullLeadAccess } = require('../../lib/vendor/leadSerializer');
// `monthPhrase` is reused from its ONE HOME rather than re-derived. The coupling
// is named because it is not obvious: a real-vendor path importing from the DEMO
// species' alert module looks wrong at a glance. It is right — that function is
// the estate's only month-phrase authority, its 'upcoming' fallback is pinned by
// ruling, and a second implementation here would be the F-04.36 drift class.
// If it ever moves out of demoLeadAlert.js, this import is the reader that breaks
// loudly rather than the copy that silently disagrees.
const { monthPhrase } = require('../../lib/discover/demoLeadAlert');

// ── F-07.50's CURE, CARRIED FORWARD · THE LINK NOW LANDS WHERE THE LEAD IS ───
//
// THE ORIGINAL DEFECT (F-07.50, cured 07 P5): this read
// 'https://thedreamwedding.in/vendor/leads' — a path authored from the shape of
// the sentence, never from the route table. It did not exist. The value ships
// inside tdw_enquiry_alert_vendor, Meta-approved 2026-07-31, so every
// out-of-window vendor received a real message containing a dead link.
//
// WHY IT MOVES AGAIN NOW (F-16.21, ruled R-35.36). The cure pointed at
// /vendor/discover/leads — a live route, so the 404 was genuinely fixed. But
// that page filters `leads.source === 'discover'`, and `createLead` DEDUPES on
// (vendor_id, phone) and returns the existing row untouched. A bride enquiring
// from a phone the vendor already knows therefore produces no row that filter
// can see. The alert announced an enquiry and linked to a page that rendered
// "No TDW leads yet." — the estate contradicting itself inside one message.
// Witnessed in production 2026-08-21 on the founder's own vendor device.
//
// THE DESTINATION IS NOW BUSINESS LEADS, and this is permanent, not a stopgap:
// the founder ruled the storefront is profile and portfolio, not leads. That
// page filters on nothing but vendor_id and deleted_at, so it holds every lead
// however it arrived. /vendor/discover/leads is retired to a redirect stub in
// the same delivery — alerts already sitting in vendors' chat histories carry
// the old URL, and a founding partner tapping last week's message into a 404
// would be F-16.21's wound reopened by its own cure.
//
// THE FIX IS CODE, NOT META. {{3}} is a template VARIABLE, so the approved body
// is untouched and no refiling is needed; only the value passed here changes.
//
// ── A CORRECTION TO THIS COMMENT'S OWN EVIDENCE (labelled, R-35.36) ──────────
// The paragraph this replaces cited "the app's own BottomNav.tsx:104 links
// Leads to '/vendor/discover/leads'" as part of its derivation. THAT LINKER NO
// LONGER EXISTS: BottomNav.tsx at dreamos-pwa 8ebbe9e lists Home · Calendar ·
// Business · Storefront · More, with no Leads door at all. The conclusion held;
// its evidence had decayed. Corrected here rather than left to rot, because a
// comment whose citation is false teaches the next reader to distrust the ones
// that are true.
//
// ONE HOME, and it is checked. scripts/b07_p5_bench.js §12.1-§12.3 pins this
// constant against the pwa's actual route table (cross-repo, skipped-with-reason
// where the sibling tree is absent) so the next person to move that page reddens
// a cell instead of shipping a 404 to a vendor's phone.
const VENDOR_LEADS_URL = 'https://thedreamwedding.in/vendor/list/leads';

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

  // ── F-07.62 CURED (fork 2(a), CE-ruled at the auth sitting) ────────────────
  // THE IDENTITY IS RESOLVED ONCE, HERE, AND BOTH LEGS RECEIVE THE RESULT. The
  // posted `couple_id` was previously believed outright: it hydrated her name
  // and phone into the vendor's ping (:205 real leg, :521 demo leg) AND it chose
  // the row her enquiry was stored against (:252 binder, :438-450
  // `couple_enquiries`). Forging it put a real bride's name and phone into a
  // stranger's ping and his cabinet — the disease's two halves, one value.
  //
  // Resolving at the ENTRY rather than at each hydration site is deliberate:
  // there is one identity per request, so there is one place to decide it. A
  // per-site cure would have left the storage sites believing the body while the
  // hydration sites believed the token — one request, two identities, which is
  // the shape of the next finding rather than the end of this one.
  //
  // THE THREE ANSWERS AND WHAT EACH PRESERVES (helper's own header has the law):
  //   present:false            → the LOGGED-OUT bride. `couple_id` from the body,
  //                              byte-for-byte the old behaviour. Her door is a
  //                              product feature and this cure does not touch it.
  //   present:true + a coupleId → the authenticated bride. Her token WINS over
  //                              anything posted; forgery is discarded unread.
  //   present:true + null       → a credential resolving to no couple (the
  //                              founder's vendor-on-a-couple-surface specimen).
  //                              Identity is null: NOTHING hydrates, NOTHING is
  //                              stored against a couple. Deliberately NOT a
  //                              fallback to the posted id — that would let
  //                              anyone holding any valid JWT forge freely.
  const coupleAuth = await resolveCoupleIfPresent(req, supabase);
  const identityCoupleId = coupleAuth.present ? coupleAuth.coupleId : (couple_id || null);

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
    // M-LEADGATE-A: `tier` joins this SELECT. It is the whole input to the
    // redaction branch below and it was NOT here — the door has never had a
    // reason to know what a vendor pays. One column, no extra query.
    .select('id, business_name, routing_handle, user_id, category, city, base_fee_min, base_fee_max, tier')
    .eq('id', vendor_id)
    .eq('discover_eligible', true)
    .eq('discover_paused', false)
    .maybeSingle();

  if (vendor) {
    return await handleRealVendor({ supabase, res, vendor, couple_id: identityCoupleId,
                                    bride_name, bride_phone,
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
    // TDW_08 P3 — `postedBudgetMax` is THREADED, not reached for. It is derived at :106
    // in this handler's scope; the demo species is a separate function and a value that
    // is not in a parameter list is not in scope. Passing it is the only honest way in.
    return await handleDemoVendor({ supabase, res, demoVendor, couple_id: identityCoupleId, wedding_date, city, postedBudgetMax });
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
  // date/city rule below, and the reason is the door itself: this route is still
  // UNAUTHENTICATED (router.js:59 mounts it with no middleware), so `bride_name`
  // in the body is caller-supplied and her account is the truer witness. The
  // posted value still serves the logged-OUT bride, who has no couple_id at all.
  // ── THE TWO PRECEDENCES ARE OPPOSITE ON PURPOSE (CE-ruled STANDING LAW) ─────
  // IDENTITY fields (name, phone) — HYDRATED wins, posted is the fallback.
  // UTTERANCE fields (date, city) — POSTED wins, hydrated is the fallback
  //                                 (the demo leg's rule, in handleDemoVendor).
  //
  // The reason, so no future sitting "harmonizes" the two into one rule: her
  // ACCOUNT is the truer witness of WHO she is; her KEYSTROKES are the truer
  // witness of WHAT she asked. A bride may enquire about a December date for a
  // wedding her profile still calls undated, and that posted date is the truth of
  // the enquiry. She may not rename herself at an unauthenticated door.
  //
  // ── [F-06.85] THE MECHANISM MOVED. THIS SENTENCE HAS BEEN RE-READ. ──────────
  // The previous text of this block conditioned the identity half on a mechanical
  // fact — "this route carries NO auth middleware" — and named router.js:59 as
  // the mechanism so that the mechanism's next sitting would be FORCED back here.
  // The auth sitting is that sitting, and the convention worked: this paragraph
  // was re-read because the note demanded it, not because anyone remembered.
  //
  // WHAT CHANGED, EXACTLY. The route is STILL mounted bare at router.js:59 — no
  // middleware, no guard, and the logged-out enquiry survives untouched, which is
  // the product feature the CE addendum protects by name. What changed is that
  // `couple_id` no longer arrives from the body unexamined: the handler resolves
  // identity ONCE at its entry through resolveCoupleIfPresent (F-07.62's cure,
  // fork 2(a)), and the value reaching this line is the RESOLVED one.
  //
  // WHY THE PRECEDENCE SURVIVES THE CHANGE — and this is the part a future
  // sitting must not get wrong. The rule "hydrated wins over posted" was
  // originally justified by the door being unauthenticated: the body was the
  // weaker witness because ANY caller could write it. That justification is now
  // STRONGER, not weaker. When she is authenticated the hydration source is her
  // TOKEN rather than a posted id, so hydrated-wins is no longer a defensive
  // preference over an untrusted body — it is the only identity in the request
  // with a proof behind it. When she is logged out, nothing hydrates and the
  // posted name/phone serve her exactly as before. The precedence holds in both
  // states, for a better reason in one of them.
  //
  // THE NEW MECHANICAL CONDITION, for the next sitting that moves it: this block
  // now depends on `couple_id` being the RESOLVED identity, not the posted one.
  // Mechanism: the `identityCoupleId` binding at this file's POST entry, and
  // resolveCoupleIfPresent's three-answer contract. If either is changed — if the
  // helper is removed, if the entry stops substituting, or if a guard is finally
  // mounted at router.js:59 — this paragraph must be re-read again, because the
  // sentence "her account is the truer witness" would no longer be describing the
  // code underneath it. That is the whole of the F-06.85 convention: a soul
  // sentence conditioned on a mechanical fact names the mechanism, so the
  // mechanism cannot move in silence.
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
  // ── FOUNDER VETO, 2026-08-01 · FOUR STRINGS FROZEN AT THESE BYTES ─────────
  // The label was written when this line was DEAD: the real leg never hydrated,
  // so the fallback ran on every real enquiry and read correctly. F-07.56 made
  // the named arm the default and it rendered "Bride: Dev Test 23 is interested
  // in your work." — a form label spliced mid-sentence, live on a vendor's phone.
  // The name now renders BARE. Internal identifiers (`brideLine`, `bride_name`,
  // the columns) keep the internal register by the founder's word; only the
  // VENDOR-FACING bytes moved.
  const brideLine = brideNameFinal ? `${brideNameFinal}` : 'A couple on The Dream Wedding';
  const phoneLine = bridePhoneFinal ? `\nContact: ${bridePhoneFinal}` : '';

  // The 04 availability hint lives in ONE builder and is reused, never
  // re-derived (P5 fork F5, CE-ruled). Its clash predicate is
  // enquiryEnrichment.js:107-113 — vendor_id + event_date + state 'upcoming',
  // now also `deleted_at is null` per this sitting's cure.
  // ── M-LEADGATE-A · R-36.8 · THE BRANCH ────────────────────────────────────
  // Decided ONCE, here, and read by both legs below. `hasFullLeadAccess` also
  // emits R-36.10's loud line on a drifted spelling, so an unknown tier is
  // announced at the alert as well as at the leads doors.
  const fullAccess = hasFullLeadAccess(vendor.tier, vendor.id);

  // ── F5 · ENRICHMENT NEVER RIDES A BASIC ALERT, BY CONSTRUCTION ────────────
  // The builder is not called on the basic path at all — it is not called and
  // then discarded. That distinction is the whole of the ruling: a composed
  // string that is thrown away is one refactor from being interpolated, whereas
  // a function that never runs cannot leak what it never computed. The fourth
  // identity donor (`buildEnquiryEnrichment`, which I flagged uncleared at
  // read-first) is therefore cleared for this lane WITHOUT anyone having to
  // audit its internals — it is unreachable from here.
  //
  // Essential+ enrichment is byte-unmoved: same builder, same args, same block.
  let enrichment = '';
  if (fullAccess) try {
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

  // ── THE TWO BODIES ────────────────────────────────────────────────────────
  // ESSENTIAL+ — byte-unmoved. This expression is character-identical to what
  // shipped before this sitting; it is not re-derived, it is the same line.
  const fullBody = `\u2726 New enquiry from The Dream Wedding\n\n${brideLine} is interested in your work.${phoneLine}${enrichBlock}\n\nThey found you on the Discover feed. Reply on WhatsApp to connect.\n\n\u2014 TDW`;

  // BASIC — the redacted in-window variant. FOUNDER-VETOED 2026-08-24, shape
  // A-prime, verbatim: the approved template's OWN sentence, in-window.
  //
  // WHY IT IS THE TEMPLATE'S WORDS AND NOT A SECOND VOICE. A basic vendor lands
  // on whichever leg his 24h window happens to put him on, and he has no idea
  // that window exists. Two different sentences for one event would make the
  // transport visible to him as a change in how we speak. One sentence makes the
  // leg invisible, which is what it should always have been.
  //
  // THE STRAY `"` IS NOT CARRIED HERE [F-08.104]. On the template it is
  // load-bearing — deleting it would end an approved body with a variable, which
  // TEMPLATES.md:19 forbids. Off-template that constraint does not exist, so
  // reproducing the quote here would be importing a Meta workaround into a
  // free-form string for no reason. The two legs differ by exactly that one
  // character, and this paragraph is why.
  //
  // NOT ONE IDENTITY BYTE: `brideLine`, `phoneLine` and `enrichBlock` are all
  // absent from this expression. `vendor.business_name` is HIS name.
  const basicBody = `\u2726 New enquiry from The Dream Wedding\n\nHi ${vendor.business_name || 'there'}, a couple just asked about your work for their ${monthPhrase(wedding_date)} wedding. Open your Leads to see more: ${VENDOR_LEADS_URL}\n\n\u2014 TDW`;

  const body = fullAccess ? fullBody : basicBody;

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
      // ── M-LEADGATE-A · THE OOW LEG IS TIER-SWITCHED TOO ──────────────────
      // The charter named only the in-window variant; the chair took the OOW
      // leg into scope on the seat's report (c-36.8, chair-owned). It leaks
      // identically: `enquiry_alert_vendor`'s {{2}} IS her name.
      //
      // WHAT THIS REPLACES, AND WHY IT WAS NEVER SAFETY. The old vars carried
      // `brideNameFinal || 'a couple'`. That fallback made the template DEGRADE
      // TO ANONYMITY WHEN HYDRATION FAILED — the right-looking output arriving
      // as a bug's side-effect, on a path nobody chose it for. A basic vendor
      // getting 'a couple' would have looked like the policy working while
      // being a coincidence, and the first successful hydration would have
      // silently ended it. The deliberate template replaces the accident.
      try {
        await sendWa({
          line: 'vendor',
          to: user.phone,
          templateKey: fullAccess ? 'enquiry_alert_vendor' : 'lead_alert_basic',
          // Essential+ vars byte-unmoved. Basic rides the pinned surviving-field
          // set — his own name, the month phrase, the leads link — none of which
          // is hers. Both are positional arrays in the registry's declared order.
          vars: fullAccess
            ? [
                vendor.business_name || 'there',
                brideNameFinal || 'a couple',
                VENDOR_LEADS_URL,
              ]
            : [
                vendor.business_name || 'there',
                monthPhrase(wedding_date),
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
  // ── F-16.7's CURE, THE ONE-LINE HALF (R-35.30 fork 3) ────────────────────
  // `leadId` is NEW. `createLead` has always returned `{ ok, lead, deduped }`
  // (src/lib/vendor/leads.js:36 on the dedupe path, :76 on the create path) and
  // this handler has always thrown the row away, keeping only whether it
  // worked. The engagement spine needs the IDENTITY, so the id is kept — and
  // this is the whole change: one declaration, one assignment. `leadCreated`
  // keeps its exact meaning and every reader of it below is untouched.
  //
  // THIS IS public.leads.id AND NOTHING ELSE. `couple_enquiries.vendor_lead_id`
  // — written twenty lines down — holds the ENGINE BINDER id that
  // `enquiryToBinder` returns, despite the name. The two are different planes.
  // The rename of that column is filed and NOT taken here (F-16.7).
  let leadCreated = false;
  let leadId = null;
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
      raw_message: `${brideNameFinal || 'A couple'} enquired via the Discover feed on The Dream Wedding.`,
      notes:       'Discover enquiry — she found you on the feed.',
    });
    leadCreated = !!(leadRes && leadRes.ok);
    leadId      = (leadRes && leadRes.lead && leadRes.lead.id) || null;
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
      note:  `${brideNameFinal || 'A couple'} enquired via the Discover feed on The Dream Wedding.`,
    });
    vendorLeadId = binderRes?.binder?.id || null;
  } catch (err) {
    console.error('[enquire] enquiryToBinder error:', err.message);
  }

  // ── 4. Her enquiry row (only if logged in) ────────────────────────────────
  //
  // TDW_16 P1: the engagement is minted from THIS block's success, immediately
  // below it. It is deliberately not minted for a logged-out bride — she has no
  // couple_id, so there is no relationship to key, and the vendor still gets
  // his lead. That asymmetry is the same one this block already lives with.
  let enquirySaved = false;
  let enquiryRowId = null;
  if (couple_id) {
    const { data: enqRow, error: enqErr } = await supabase
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
      }, { onConflict: 'couple_id,vendor_id' })
      .select('id')
      .single();
    if (enqErr) console.error('[enquire] couple_enquiries upsert error:', enqErr.message);
    else { enquirySaved = true; enquiryRowId = enqRow && enqRow.id; }

    // ── TDW_16 P1 · THE SPINE ────────────────────────────────────────────────
    // One row per (couple, vendor, category), written through its ONE HOME. The
    // category handed over is the vendor's raw free text; `recordEnquiry`
    // routes it through `normaliseCategory` (R-35.31) — this door does not
    // normalise, does not validate, and does not know the eleven. That is the
    // point of one home.
    //
    // Failure here is logged and does not change her response. Her enquiry
    // reached the vendor the moment the lead landed; a missing spine row is a
    // linkage the next enquiry re-mints, not a reason to tell her the door
    // failed. `ok` keeps the meaning F-07.45 gave it.
    if (enquirySaved) {
      try {
        await recordEnquiry({
          supabase,
          coupleId:  couple_id,
          vendorId:  vendor.id,
          category:  vendor.category,
          enquiryId: enquiryRowId,
          leadId,
        });
      } catch (err) {
        console.error('[enquire] recordEnquiry threw:', err.message);
      }
    }
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
async function handleDemoVendor({ supabase, res, demoVendor, couple_id, wedding_date, city, postedBudgetMax }) {
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
      // three of the four that `demo_leads` can honestly hold.
      //
      // ── TDW_08 P3 · THIS PARAGRAPH WAS HALF-TRUE AND IS NOW AMENDED (F-06.85) ──
      // It used to read: "`functions` and `budget_band` have NO column on that table
      // (13 cols, PUBLIC_SCHEMA.md)". Two things were wrong with that sentence and
      // one of them is still right.
      //
      // THE COUNT WAS WRONG AND ITS SOURCE WAS THE REASON. `demo_leads` was already
      // FOURTEEN columns when that comment was read — `0106_demo_lifecycle.sql:69`
      // added `converted_lead_id`. `PUBLIC_SCHEMA.md` says thirteen because its own
      // header (:4) prints its ladder tip as `0099` and the tail is `0108`. It is a
      // STARTING witness; `information_schema` is the settling one. The table is
      // FIFTEEN columns now, cited to THE LADDER and not to the doc (F-08.33).
      //
      // THE BUDGET HALF IS DEAD. `0108_demo_lead_budget.sql` mints
      // `demo_leads.budget_max integer` on the founder's own amendment to G-4
      // 「 budget should be visible. contact blurred 」. It IS accepted here now.
      //
      // THE FUNCTIONS HALF SURVIVES AND IS THE STRONGER CLAIM. There is still no
      // function/event-type column on this table, none was asked for, and G-4's
      // functions clause is STRUCK. So `functions` remains genuinely columnless and
      // is still never accepted here.
      //
      // THE SHEET STAYS READ-ONLY ON BUDGET, AND POSTS IT. Read-only was never about
      // the column — it is display-and-confirm: the couple sees the band she already
      // chose upstream and confirms it rather than authoring it a second time. The
      // discard is what stops; the shape does not.
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
        // TDW_08 P3 — the band's CEILING, the same integer `bandCeiling` hands the
        // real plane at :106. NULL when she chose no band, and NULL is the honest
        // answer: every surface OMITS the budget line rather than blanking it.
        budget_max:         postedBudgetMax,
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

  // ── TDW_08 P1 · G-1 · THE ENQUIRY REFRESH ──────────────────────────────────
  // engaged + a fresh 72h clock. FAIL-OPEN BY CONSTRUCTION and deliberately so:
  // the lead is already stored and the alert has already fired, and no fault in
  // the lifecycle engine may cost a couple her enquiry. demoLifecycle returns a
  // TYPED REFUSAL rather than throwing for business conditions, so the catch
  // here is for infrastructure faults only.
  //
  // EXPECT A REFUSAL TODAY, and that is correct: every production demo row is
  // `legacy` until FORK F's ruled caller first fires, and engaging a row that
  // was never invited would stamp `engaged_at` over a contact that never
  // happened. The refusal is logged, not swallowed.
  try {
    const lc = await require('../../lib/demoLifecycle').onEnquiry(supabase, demoVendor.id);
    if (lc.ok === false) {
      console.log(`[enquire:demo] lifecycle no-op for ${demoVendor.ig_handle}: ${lc.reason} (${lc.detail})`);
    }
  } catch (err) {
    console.error(`[enquire:demo] lifecycle FAILED for ${demoVendor.id}: ${err.message} — ` +
      'the enquiry stands; only the clock did not move');
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
