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
const { sendWhatsApp } = require('./lib/whatsapp');
const webhookCore = require('./lib/webhookCore'); // TDW_05 P1a: shared inbound/callback transport
const { generateInvoiceForBinder } = require('./api/vendor/invoices');
const { enquiryToBinder } = require('./lib/vendor/enquiryBinder'); // 5-B-2
const { ensureCoupleRow, captureField } = require('./lib/coupleIdentity');
const { buildDisambiguationQuestion, interpretDisambiguationReply, vendorDisplayName } = require('./agent/disambiguation');
const adminRouter  = require('./admin/router');
const apiRouter    = require('./api/router');
const { resolveAgentForVendor } = require('./api/middleware/agentBridge'); // 5-A
const { runTurn } = require('./engine/dist/core/loop');                     // 5-A
const { fetchCalendarSnapshot, fetchScratchpad, applyCalendarSignals } = require('./lib/vendor/calendarSignals'); // 5-A calendar parity
const { fetchLeadPings } = require('./lib/vendor/leadPings');               // TDW_05 F-05.50(b): the enquiry-ping drain
const { buildLlmForTurn, abandonActiveThread } = require('./api/vendor-engine/chat'); // TDW_06 P7b: the shared route builder (F-06.1 2nd limb) · TDW_04.5 F-04.98 C3: the fresh-thread seam
const { matchModeWord, applyModeFlip, MODE_FLIP_LINES, matchFreshWord, FRESH_THREAD_LINE } = require('./api/vendor-engine/vendorMode'); // TDW_06 P7b: WA mode words · TDW_04.5 F-04.98 C3: WA fresh word
const { processVendorInbound, metaInputsFrom, resolveVendorMedia } = require('./lib/vendorInbound'); // TDW_05 M2 + MEDIA-SHIM
const metaInbound = require('./lib/metaInbound'); // TDW_05 M2: dormant Meta inbound (vendor lane)
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
// Locked list: production domain + Vercel shell + local dev.
// Add new origins here when new deploy targets are introduced.
const ALLOWED_ORIGINS = [
  'https://thedreamwedding.in',
  'https://www.thedreamwedding.in',
  'https://thedreamai.in',
  'https://www.thedreamai.in',
  'https://dreamos-pwa.vercel.app',
  'https://demo.thedreamwedding.in',
  'https://demodiscover.thedreamwedding.in',
  'https://demobride.thedreamwedding.in',
  'https://demodreamer.thedreamwedding.in',
  'http://localhost:3000',
  'http://localhost:3001',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // dreamos-pwa Vercel previews
    if (/^https:\/\/dreamos-pwa[a-z0-9-]*\.vercel\.app$/.test(origin)) return cb(null, true);
    // dreamai Vercel previews
    if (/^https:\/\/dreamai[a-z0-9-]*\.vercel\.app$/.test(origin)) return cb(null, true);
    // GitHub Codespaces (dev)
    if (/^https:\/\/[a-z0-9-]+-\d+\.app\.github\.dev$/.test(origin)) return cb(null, true);
    return cb(null, false);  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password', 'Accept'],
}));

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
app.get('/admin/test-briefing/:vendorId', async (req, res) => {
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
const vendorInboundDeps = {
  runCoupleAgenticTurn, sendWhatsApp, generateInvoiceForBinder, enquiryToBinder,
  ensureCoupleRow, captureField, buildDisambiguationQuestion, interpretDisambiguationReply,
  vendorDisplayName, resolveAgentForVendor, runTurn, fetchCalendarSnapshot, fetchScratchpad,
  fetchLeadPings, // TDW_05 F-05.50(b)
  applyCalendarSignals, buildLlmForTurn, matchModeWord, applyModeFlip, MODE_FLIP_LINES,
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
    for (const s of metaInbound.extractStatuses(req.body)) {
      try { await supabase.from('messages').update({ delivery_status: s.status }).eq('twilio_sid', s.id); }
      catch (_e) { /* status best-effort */ }
      console.log(`[webhook:meta] status wamid=${s.id} status=${s.status}`);
    }
  } catch (err) {
    console.error('[webhook:meta] inbound processing error:', err && err.message);
  }
});

app.listen(PORT, () => {
  console.log(`[dream-os] listening on :${PORT}`);
  webhookCore.probeMessageSidColumn(supabase, { prefix: '[dream-os]' }); // TDW_05 P1b: durable-dedupe capability probe
  startCronJobs({ supabase });
});
