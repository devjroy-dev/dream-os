// Provide a global WebSocket on Node < 22 (Railway runs 20). supabase-js's
// createClient builds a realtime client that requires one; without it the
// engine's db.js throws at boot. 'ws' is already a dependency. The engine
// never uses realtime -- this only satisfies the constructor.
if (!globalThis.WebSocket) globalThis.WebSocket = require('ws');

// dream-os backend -- entry point
// Session 5: three-mode couple routing
// Session 5.5: couple-facing agent on Mode 1 + Mode 2

const express      = require('express');
const { waNumberFor } = require('./lib/waNumbers');   // F5 rider
const cors         = require('cors');
const ws           = require('ws');
const cookieParser = require('cookie-parser');
const Anthropic    = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runCoupleAgenticTurn } = require('./agent/engine');
const { buildBriefing } = require('./agent/briefing');
const { startCronJobs } = require('./cron');
const { startCapabilitiesSweep } = require('./capabilitiesSweep'); // CE-41 seat C: the switchboard's nightly reconciler
const { sendWhatsApp } = require('./lib/whatsapp');
const webhookCore = require('./lib/webhookCore'); // TDW_05 P1a: shared inbound/callback transport
const { generateInvoiceForBinder } = require('./api/vendor/invoices');
const { enquiryToBinder } = require('./lib/vendor/enquiryBinder'); // 5-B-2
const { ensureCoupleRow, captureField } = require('./lib/coupleIdentity');
const { buildDisambiguationQuestion, interpretDisambiguationReply, vendorDisplayName } = require('./agent/disambiguation');
const adminRouter  = require('./admin/router');
const requireAdmin = require('./api/admin/requireAdmin');
const apiRouter    = require('./api/router');
const { resolveAgentForVendor } = require('./api/middleware/agentBridge'); // 5-A
const { buildLlmForTurn, abandonActiveThread } = require('./api/vendor-engine/chat'); // TDW_06 P7b: the shared route builder (F-06.1 2nd limb) · TDW_04.5 F-04.98 C3: the fresh-thread seam
const { matchModeWord, applyModeFlip, MODE_FLIP_LINES, matchFreshWord, FRESH_THREAD_LINE } = require('./api/vendor-engine/vendorMode'); // TDW_06 P7b: WA mode words · TDW_04.5 F-04.98 C3: WA fresh word
const { processVendorInbound, metaInputsFrom, resolveVendorMedia } = require('./lib/vendorInbound'); // TDW_05 M2 + MEDIA-SHIM
const metaInbound = require('./lib/metaInbound'); // TDW_05 M2: dormant Meta inbound (vendor lane)
const razorpay      = require('./lib/billing/razorpay');  // TDW_10 billing: verifier + normaliser
const billingLedger = require('./lib/billing/ledger');    // TDW_10 billing: the SOLE writer of billing_events
const tierFlip      = require('./lib/billing/tierFlip');  // TDW_10 billing: the ONE flip path (two feeders, TDW_11:59)
const { resolveMetaMedia } = require('./lib/metaMedia'); // TDW_05 MEDIA-SHIM: lane-agnostic Meta media resolver
const { checkImageThrottle, markRejectionSent } = require('./lib/imageThrottle'); // TDW_05 M2: via deps
const { extractCalendarFromImage } = require('./lib/vendorCalendarImage'); // TDW_05 M2: via deps

const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TDW_WA_NUMBER              = waNumberFor('vendor');   // F5 rider: was the DEAD sandbox literal

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});
const anthropic = new Anthropic({
  apiKey:     process.env.ANTHROPIC_API_KEY,
  timeout:    12000,  // 12s — safe margin under Twilio's 15s webhook limit
  maxRetries: 0,      // We own the retry loop in engine.js
});

const app = express();
app.set('trust proxy', true);

// CORS — allow PWA origins to call dream-os API endpoints.
// The options live in ONE HOME, src/lib/corsOptions.js (F-39.2, CE-39 step 2a):
// the origin list, credentials, methods and headers are byte-for-byte what this
// file carried, plus `maxAge: 600` so a credentialed call no longer pays an
// OPTIONS preflight every 5 seconds. Add new origins THERE, not here.
const { corsOptions } = require('./lib/corsOptions');
app.use(cors(corsOptions));

// CORS error handler — return 403 JSON, not 500 HTML
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ ok: false, error: 'CORS: origin not allowed.' });
  }
  next(err);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '12mb', verify: (req, _res, buf) => { req.rawBody = buf; } })); // TDW_05 M2: rawBody for Meta sig
app.use(cookieParser());

app.locals.supabase  = supabase;
app.locals.anthropic = anthropic;

// ── Briefing test endpoint (manual trigger, no WhatsApp send) ──────
// Usage: GET /admin/test-briefing/:vendorId
// Returns the briefing message that would be sent, or the skip reason.
// ── F-07.87 CURED — GUARDED, NOT DELETED ─────────────────────────────────────
// THIS ROUTE WAS UNAUTHENTICATED. It is registered HERE, above the
// `app.use('/admin', adminRouter)` mount below, so Express matched it first and
// Panel A's `requireAuth` never ran. Any caller holding a vendor UUID received
// the vendor row, the user row (name AND phone), and a generated briefing.
//
// GUARD, not delete — the caller census decided it. Derived by command across
// BOTH repos: ZERO code callers anywhere (dream-os `grep -rn test-briefing` finds
// only this file's own three lines; dreamos-pwa finds none). Its only caller is
// a human with a curl. But `buildBriefing` itself is LIVE — src/cron.js:70 is
// its production caller — so this is a working diagnostic for a shipping code
// path, and deleting an operator's tool that nobody asked to delete is scope
// the founder did not grant. It gets the guard the mount below would have given
// it if it had been registered on the other side of the line.
app.get('/admin/test-briefing/:vendorId', requireAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .maybeSingle();

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', vendor.user_id)
      .maybeSingle();

    const result = await buildBriefing({ vendor, user, supabase });

    res.json({
      vendor_id: vendorId,
      vendor_name: user?.name || 'unknown',
      ...result,
    });
  } catch (err) {
    console.error('[test-briefing] error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/admin', adminRouter);
app.use('/api/v2', apiRouter);

app.get('/', (req, res) => {
  const { version } = require('../package.json');
  res.json({ status: 'alive', service: 'dream-os', version });
});

// ── vendorInboundDeps: every seam the shared vendor turn-core needs (M2) ─────────
// The 28-dep list mirrors index.js's own bindings (proven complete by a bare-call scan).
// COUNT CORRECTED AT F-05.50(b), DISCLOSED: this comment read "24" and was already
// stale at 27 before this micro added the 28th (fetchLeadPings). A count a reader
// cannot re-derive is the stale-comment class; corrected rather than made worse.
// CE-45 LCV-15 LSP_1: the chain's five seams (runTurn, fetchCalendarSnapshot, fetchScratchpad,
// fetchLeadPings, applyCalendarSignals) left with the chain; the list is 23, derived by command.
const vendorInboundDeps = {
  runCoupleAgenticTurn, sendWhatsApp, generateInvoiceForBinder, enquiryToBinder,
  ensureCoupleRow, captureField, buildDisambiguationQuestion, interpretDisambiguationReply,
  vendorDisplayName, resolveAgentForVendor,
  buildLlmForTurn, matchModeWord, applyModeFlip, MODE_FLIP_LINES,
  matchFreshWord, FRESH_THREAD_LINE, abandonActiveThread, // TDW_04.5 F-04.98 C3
  checkImageThrottle, markRejectionSent, extractCalendarFromImage, webhookCore, supabase, anthropic,
};

// ── Vendor inbound — Meta Cloud API, the only inbound (M2b). The Twilio /webhook/whatsapp
// and /webhook/twilio-status routes are DELETED; both now answer 404, which is the sunset's
// witnessed proof. Delivery statuses arrive here via extractStatuses. ────────────────────
app.get('/webhook/meta', (req, res) => {
  if (metaInbound.handleVerifyChallenge(req, res, process.env.META_VERIFY_TOKEN)) return;
  return res.status(400).send('Bad Request');
});
app.post('/webhook/meta', async (req, res) => {
  // Two accept-paths: a valid Meta signature, OR a trusted internal-replay. The shared-receiver
  // ingress verifies the Meta sig once and forwards pre-verified sub-payloads carrying
  // x-internal-replay. isInternalReplay withholds by default (INTERNAL_REPLAY_SECRET unset ⇒ always
  // false), so a forged header opens NO spoof path — it still falls through to Meta-sig or 403.
  const internalReplay = webhookCore.isInternalReplay(req);
  if (!internalReplay && process.env.DISABLE_META_SIGNATURE_CHECK !== 'true') {
    const okSig = metaInbound.verifyMetaSignature(req.rawBody, req.headers['x-hub-signature-256'], process.env.META_APP_SECRET);
    if (!okSig) { console.warn('[webhook:meta] invalid X-Hub-Signature-256'); return res.status(403).send('Forbidden'); }
  }
  res.status(200).send('ok'); // Meta wants a fast 200 regardless of downstream work

  try {
    for (const msg of metaInbound.normalizeMetaInbound(req.body)) {
      if (!msg.messageId) continue;
      if (webhookCore.sidSeen(msg.messageId)) { console.log(`[webhook:meta] dup wamid ${msg.messageId}, skipping`); continue; }
      webhookCore.recordSid(msg.messageId);
      const hasText  = !!(msg.text && msg.text.trim());
      const hasMedia = Array.isArray(msg.media) && msg.media.length > 0;
      if (!hasText && !hasMedia) { console.warn(`[webhook:meta] empty inbound from ${msg.from}, dropping`); continue; }
      // TDW_05 MEDIA-SHIM: resolve the first media item (media-ID -> stable public url) BEFORE
      // building inputs. resolveVendorMedia returns null on any failure -> mediaUrl stays null ->
      // the shared core proceeds text-only (never a dead turn). Text turns are untouched.
      const mediaItem = (Array.isArray(msg.media) && msg.media[0]) || null;
      const resolvedMedia = mediaItem
        ? await resolveVendorMedia(mediaItem, { resolveMetaMedia, supabase })
        : null;
      const inputs = metaInputsFrom(msg, req.body, resolvedMedia);
      await processVendorInbound(inputs, vendorInboundDeps);
    }
    // ── CE-41 SEAT C · THE SWITCHBOARD'S FAST PATH (R-41.37) ─────────────────
    // Meta's `message_template_status_update` field lands on this same receiver
    // once the founder subscribes it on the WABA (a dashboard step in the C1
    // packet note). A template row moves within seconds of Meta's word; the
    // nightly sweep reconciles. Unknown names are ignored inside the seam.
    for (const v of metaInbound.extractTemplateStatusUpdates(req.body)) {
      try {
        const { applyTemplateStatusEvent } = require('./capabilitiesSweep');
        const r = await applyTemplateStatusEvent(supabase, v);
        console.log(`[webhook:meta] template status ${v.message_template_name}=${v.event} → ${r.applied ? 'applied' : r.reason}`);
      } catch (e) { console.warn('[webhook:meta] template status seam', e && e.message); }
    }
    // ── F-41.125 · THE WABA'S OWN STATE, BESIDE THE TEMPLATE'S ────────────────
    // Meta enforces Messaging Policy §7 at the ACCOUNT: a WABA can be restricted, its
    // quality tier cut, or its sending suspended, and `account_update` is the only
    // notice. Nothing received it — the founder's first sign would have been sends
    // failing for a reason no log named.
    //
    // ⚠ IT LOGS AND DOES NOT ACT. A restriction is the founder's decision, not the
    // estate's: flipping keys off automatically would take the plane down on a webhook
    // whose shape has never executed here, and a WABA restriction that turns out to be
    // transient would leave the switchboard dark with nobody knowing why. The line is
    // loud, names the event, and stops.
    //
    // ⚠ AND IT PRINTS THE WHOLE VALUE. Every other receiver logs named fields, because
    // it knows the shape. THIS ONE DOES NOT — its first real execution is the founder's
    // webhook, so the raw value IS the evidence for whoever reads the next sitting.
    // The moment the shape is witnessed, this line should narrow to named fields.
    for (const a of metaInbound.extractAccountUpdates(req.body)) {
      try {
        console.warn(`[webhook:meta] ACCOUNT UPDATE event=${a.event} — WABA-level, the founder's to act on: ${JSON.stringify(a)}`);
      } catch (e) { console.warn('[webhook:meta] account update seam', e && e.message); }
    }
    for (const s of metaInbound.extractStatuses(req.body)) {
      // ── TDW_06 · F-06.143's SECOND LIMB DIES HERE (fork 3(b), chair-ruled) ──
      // This was a BLIND update: no `.select()`, no count, wrapped in a
      // swallowing catch, followed by a log line that reported the EVENT and
      // never the OUTCOME. On 2026-08-08 it matched zero rows twice and said
      // nothing about it, and the only trace of two failed bride enquiries was a
      // Railway line nobody was reading. The statement now lives in
      // `src/lib/vendor/relayStatus.js` (symbol `applyStatusEvent`), which reads
      // its matched-row count back and names a match to nothing BY NAME.
      //
      // THE SEAM IS THIN ON PURPOSE. A cure living inside this express route can
      // only be exercised by driving express; R-29.34 member (a) wants a cell on
      // a real entry point, and a callable is one. The receipt half (№14/№15)
      // rides INSIDE the same call, gated on the witness, so a receipt can never
      // be the first thing that notices a sid the estate does not hold.
      try {
        const { applyStatusEvent } = require('./lib/vendor/relayStatus');
        await applyStatusEvent(supabase, s, { sendWhatsApp, env: process.env });
      } catch (e) { console.warn('[webhook:meta] status seam', e && e.message); }
    }
  } catch (err) {
    console.error('[webhook:meta] inbound processing error:', err && err.message);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /webhook/razorpay — THE ONLY DOOR MONEY ENTERS THIS ESTATE BY
// TDW_10 · the billing sitting · R-BILL.9 · F-10.22's cure
// ═════════════════════════════════════════════════════════════════════════════
// Seated HERE, beside /webhook/meta, on purpose. It reads `req.rawBody` — the
// exact bytes, captured estate-wide by the express.json({ verify }) at line 103
// above for Meta's signature since TDW_05 M2. NO new middleware seat was
// invented: the raw-body capture this route needs has been running and proven on
// this service for months. Re-serialising req.body here would break every
// signature silently. (Pattern-over-shape, CE-202/203.)
//
// THE ORDER IS LOAD-BEARING: verify → ledger → 200 → flip.
//   • verify first, fail closed: an unsigned event never reaches the database.
//   • LEDGER BEFORE ACKNOWLEDGING. If the write fails we return 500 on purpose,
//     so Razorpay retries. A 200 on an unstored event is money that silently
//     never happened.
//   • 200 before flipping, because Razorpay requires a 2xx inside FIVE SECONDS
//     and disables a webhook that fails for 24 hours straight. The flip must
//     never be able to hold the response open.
//   • the flip is order-independent: it derives from the event's own
//     subscription state, never from an assumed delivery sequence — Razorpay
//     states plainly that events may arrive out of order.
app.post('/webhook/razorpay', async (req, res) => {
  const secret  = process.env.RAZORPAY_WEBHOOK_SECRET;
  const eventId = req.headers['x-razorpay-event-id'];

  // Unset secret is NOT an open door. Before the founder sets the Railway var,
  // this route accepts nothing at all.
  if (!secret) {
    console.warn('[webhook:razorpay] RAZORPAY_WEBHOOK_SECRET unset — refusing');
    return res.status(503).send('Not configured');
  }
  if (!razorpay.verifyRazorpaySignature(req.rawBody, req.headers['x-razorpay-signature'], secret)) {
    console.warn('[webhook:razorpay] invalid X-Razorpay-Signature');
    return res.status(403).send('Forbidden');
  }
  // The idempotency key IS the header. No header, no guarantee we can avoid
  // double-counting a retry — so it is a rejection, not a best-effort insert.
  if (!eventId) {
    console.warn('[webhook:razorpay] missing x-razorpay-event-id');
    return res.status(400).send('Bad Request');
  }

  let normalized;
  try {
    normalized = razorpay.normalizeRazorpayEvent(eventId, req.body);
  } catch (err) {
    console.error('[webhook:razorpay] normalise failed:', err && err.message);
    return res.status(400).send('Bad Request');
  }

  // Resolve the vendor BEFORE the ledger write so the row carries it. An
  // unresolvable event still gets written, with vendor_id null (R-BILL.7).
  let vendorId = null;
  try {
    vendorId = await tierFlip.resolveVendor(supabase, {
      subscriptionId: normalized.provider_subscription_id,
      notesVendorId:  normalized.notes_vendor_id,
    });
  } catch (err) {
    console.error('[webhook:razorpay] vendor resolve failed:', err && err.message);
  }
  if (!vendorId) {
    console.warn(`[webhook:razorpay] ORPHAN event ${eventId} (${normalized.event}) — `
      + `sub=${normalized.provider_subscription_id || 'none'} notes.vendor_id=${normalized.notes_vendor_id || 'none'}. `
      + 'Ledgered; no flip. Check the Subscription Link\'s Notes.');
  }

  const written = await billingLedger.recordEvent(supabase, { ...normalized, vendor_id: vendorId });

  if (written.status === 'error') {
    console.error(`[webhook:razorpay] ledger write failed for ${eventId}:`, written.error);
    return res.status(500).send('Ledger write failed'); // deliberate: let Razorpay retry
  }
  if (written.status === 'duplicate') {
    console.log(`[webhook:razorpay] duplicate event ${eventId} — one row, one flip, already done`);
    return res.status(200).send('ok');
  }

  res.status(200).send('ok'); // inside the five-second law; the flip follows

  try {
    if (vendorId && normalized.provider_subscription_id) {
      await tierFlip.linkSubscription(supabase, vendorId, normalized.provider_subscription_id);
    }
    if (vendorId && normalized.entitlement) {
      await tierFlip.applyEntitlement(supabase, {
        vendorId,
        entitlement: normalized.entitlement,
        provider:    normalized.provider,
        eventId:     normalized.event_id,
      });
    }
  } catch (err) {
    // The row is already banked. A flip failure is recoverable from the ledger;
    // it must never become an unacknowledged webhook.
    console.error(`[webhook:razorpay] post-ack processing error for ${eventId}:`, err && err.message);
  }
});

app.listen(PORT, () => {
  console.log(`[dream-os] listening on :${PORT}`);
  webhookCore.probeMessageSidColumn(supabase, { prefix: '[dream-os]' }); // TDW_05 P1b: durable-dedupe capability probe
  startCronJobs({ supabase });
  startCapabilitiesSweep({ supabase }); // binds src/lib/capabilities.js's client; 03:50 IST
  // F-41.81: a forward left `queued` by a process that died mid-send is terminal
  // and unread by anything. Boot is the moment after that process came back.
  require('./lib/couple/assistance').reconcileStrandedForwards(supabase)
    .catch(e => console.error(`[assistance:reconcile] boot sweep threw: ${e && e.message}`));
});
