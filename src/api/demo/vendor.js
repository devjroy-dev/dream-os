// src/api/demo/vendor.js
// Public demo vendor endpoints — NO AUTH REQUIRED.
// All data reads from demo_vendors and demo_leads only.
// The ig_handle in the URL is the only identity. No JWT. No session.
//
// Endpoints:
//   GET  /api/v2/demo/vendor/:handle          — profile + photos
//   GET  /api/v2/demo/vendor/:handle/leads    — mock leads list
//   GET  /api/v2/demo/vendor/:handle/context  — DreamAi context blob
//   POST /api/v2/demo/vendor/:handle/chat     — SSE DreamAi stream, no auth
//   GET  /api/v2/demo/discover                — all active demo vendors (swipe feed)

'use strict';

// TDW_07 P5 — F-07.41 / F-07.42. Every read of `demo_leads` on THIS (public,
// unauthenticated) router goes through the masking home. The coverage map lives
// there; if you add a fourth reader below, add it to that map too.
const { maskDemoLeads, maskedLeadLines, maskedLeadSummary, MASKED_SELECT } = require('../../lib/demo/maskDemoLead');
// TDW_08 P3 — the mirror eats the couple's own card shape. THE SAME function the couple
// feed calls, not a copy of it: the landing renders `components/shared/VendorProfileView`
// under the words "This is how couples see you", and a second shape would make that
// sentence false at the data layer while it read true on the screen.
const { shapeDemoRow } = require('../../lib/discover/shapeDemoRow');

const express   = require('express');
const router    = express.Router();

const DEMO_SYSTEM_PROMPT = `You are DreamAi, the AI business assistant for The Dream Wedding (TDW) — India's premium wedding vendor platform.

RESPONSE RULES
1. Maximum 2-3 sentences per reply unless something complex is asked.
2. Plain text only. No bullet points, no bold, no markdown.
3. Plain Indian English. Not formal, not corporate.
4. No filler phrases. No "I'd be happy to", "certainly", "of course". Just the answer.
5. Never ask more than one question per reply.
6. Never introduce yourself or sign off.

CONTEXT
You are in DEMO MODE. You have this vendor's profile and leads loaded below.
Give genuinely useful, specific advice based on their actual data.
Never say "this is a demo" or "this is mock data" — treat everything as real.
When asked about leads — give specific names, dates, states from the context.
When asked for advice — give real, actionable wedding industry advice.`;

async function getDemoVendor(supabase, handle) {
  const { data, error } = await supabase
    .from('demo_vendors')
    .select('*')
    .eq('ig_handle', handle)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// GET /demo/vendor/:handle — profile
router.get('/:handle', async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const vendor = await getDemoVendor(supabase, req.params.handle);
    if (!vendor) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    // ── TDW_08 P3 · THE MIRROR CARD, ADDED BESIDE `vendor` AND NOT INSTEAD OF IT ──
    // `vendor` is BYTE-UNTOUCHED. Three surfaces already read it by name
    // (app/demo/vendor/[handle]/page.tsx, /discover, /portfolio) and existing
    // behaviour is sacred (protocol §8). `card` is additive: the couple-shaped
    // `DiscoverVendor` the mirror requires, from the ONE shaper the couple feed uses.
    //
    // `_rank_score` IS STRIPPED HERE, AT THIS CALLER'S OWN SEAM. The shaper emits it
    // because the feed needs it to order; this route never interleaves, so it would
    // reach the wire as a field `lib/types/discover.ts` does not declare — F-07.3's
    // disease, re-minted in the sitting that inherited its cure.
    //
    // CITED BY PATH, NOT BY RANGE, AND THE DEVIATION IS DECLARED: CE ruled this
    // comment carry `couple/discover.js:448-450`. This delivery's own extraction moved
    // that rationale to :408-410, so the frozen range would have shipped already wrong —
    // the exact failure THE PATH-OVER-RANGE LAW was promoted to end, in the delivery
    // that promoted it. The anchor is the sentence, which does not drift:
    //   src/api/couple/discover.js — "`_rank_score` is ORDERING MACHINERY, not contract."
    const { _rank_score, ...card } = shapeDemoRow(vendor);   // eslint-disable-line no-unused-vars

    return res.json({
      ok: true,
      vendor: {
        id:            vendor.id,
        ig_handle:     vendor.ig_handle,
        display_name:  vendor.display_name,
        category:      vendor.category,
        city:          vendor.city,
        about:         vendor.about,
        rate_display:  vendor.rate_display,
        photos:        vendor.photos || [],
        whatsapp_phone: vendor.whatsapp_phone,
      },
      card,
    });
  } catch (err) {
    console.error('[demo/vendor/:handle]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// GET /demo/vendor/:handle/leads
router.get('/:handle/leads', async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const vendor = await getDemoVendor(supabase, req.params.handle);
    if (!vendor) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    // MASKED (F-07.41). This route is unauthenticated; `bride_phone` and
    // `bride_email` are not selected and cannot be served.
    const { data: leads, error } = await supabase
      .from('demo_leads')
      .select(MASKED_SELECT)
      .eq('demo_vendor_id', vendor.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, leads: maskDemoLeads(leads) });
  } catch (err) {
    console.error('[demo/vendor/:handle/leads]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// GET /demo/vendor/:handle/context
router.get('/:handle/context', async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const vendor = await getDemoVendor(supabase, req.params.handle);
    if (!vendor) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    // MASKED (F-07.41) + F-07.42: `l.state` was read here against a table that
    // has no such column, so every lead reported as "new" forever.
    const { data: leads } = await supabase
      .from('demo_leads')
      .select(MASKED_SELECT)
      .eq('demo_vendor_id', vendor.id)
      .order('created_at', { ascending: false });
    const leadList = maskedLeadLines(leads);
    return res.json({
      ok: true,
      vendor: { name: vendor.display_name, category: vendor.category, city: vendor.city, about: vendor.about, rate_display: vendor.rate_display },
      // F-07.42: `new` and `booked` filtered on a column that does not exist and
      // were therefore permanently 0 while reading as measurements. Only `total`
      // is derivable, so only `total` is claimed.
      leads_summary: {
        total:  maskedLeadSummary(leads).total,
        leads:  maskDemoLeads(leads),
      },
      context_text: `Vendor: ${vendor.display_name} | ${vendor.category} | ${vendor.city}\nRate: ${vendor.rate_display || 'not set'}\nAbout: ${vendor.about || 'not set'}\n\nLeads (${(leads||[]).length} total):\n${leadList || 'No leads yet.'}`,
    });
  } catch (err) {
    console.error('[demo/vendor/:handle/context]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// POST /demo/vendor/:handle/chat — SSE DreamAi stream, no auth
router.post('/:handle/chat', async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const anthropic = req.app.locals.anthropic;
  if (!anthropic) return res.status(500).json({ ok: false, error: 'AI not configured.' });

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ ok: false, error: 'message is required.' });
  }

  try {
    const vendor = await getDemoVendor(supabase, req.params.handle);
    if (!vendor) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });

    // ── THE CENTER OF THE F-07.41 RULING ─────────────────────────────────────
    // This is the MODEL's context, on an UNAUTHENTICATED route. Masking the two
    // JSON payloads and leaving this raw would be the scrub-that-exists-but-
    // isn't-applied class (F-04.33): a visitor could not read the leads, but
    // could ASK THE MODEL, and the model would be holding real names, exact
    // dates, and — via `select('*')` — phone numbers and email addresses.
    //
    // F-07.42 dies in the same lines: `l.state` and `l.raw_message` do not exist
    // on this table, so the model was told, as fact, that every lead's status was
    // "new" and every message was empty — invented state handed to a language
    // model and then spoken aloud in the vendor's own studio.
    const { data: leads } = await supabase
      .from('demo_leads')
      .select(MASKED_SELECT)
      .eq('demo_vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    const leadLines = maskedLeadLines(leads);

    const dynamicContext = `VENDOR: ${vendor.display_name} | ${vendor.category} | ${vendor.city}\nRATE: ${vendor.rate_display || 'not set'}\nABOUT: ${vendor.about || 'not set'}\n\nLEADS (${(leads||[]).length} total):\n${leadLines}`;  // maskedLeadLines returns its own empty-state line

    const messages = [
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() },
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let streamDead = false;
    req.on('close', () => { streamDead = true; });

    const safe = (data) => {
      if (streamDead || res.writableEnded) return;
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    safe({ type: 'thinking' });

    const stream = await anthropic.messages.stream({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: [
        { type: 'text', text: DEMO_SYSTEM_PROMPT },
        { type: 'text', text: dynamicContext },
      ],
      messages,
    });

    for await (const event of stream) {
      if (streamDead || res.writableEnded) break;
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        safe({ type: 'text_delta', text: event.delta.text });
      }
    }

    safe({ type: 'done', tool_calls: [], refresh: false });
    if (!res.writableEnded) { res.write('data: [DONE]\n\n'); res.end(); }

  } catch (err) {
    console.error('[demo/vendor/:handle/chat]', err.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', text: 'Something went wrong. Try again.' })}\n\n`);
      res.end();
    }
  }
});

// GET /demo/discover — all active demo vendors shaped for Frost swipe feed
router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data: vendors, error } = await supabase
      .from('demo_vendors')
      .select('*')
      .eq('active', true)
      // ── TDW_08 P3 · `discover_eligible` JOINS THE FILTER, BY FOUNDER RULING ────
      // This feed showed EIGHT vendors while the couple's own Discover showed FIVE,
      // because the couple leg filters on BOTH flags (couple/discover.js:378-379) and
      // this one filtered on `active` alone. Three rows — active, not eligible — were
      // visible here and invisible to every real couple.
      //
      // demodiscover exists to show a vendor what Discover looks like. A feed that
      // lists vendors no couple can reach teaches him something false, which is the
      // same disease as a mirror that renders a card the couple never sees. The two
      // legs now answer the same question with the same filter.
      .eq('discover_eligible', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const shaped = (vendors || []).map(v => ({
      id:             v.id,
      name:           v.display_name,
      category:       v.category,
      city:           v.city,
      // ── F-07.54 CURED · THE SECOND MINT (CE census correction) ──────────
      // This route (`router.get('/', …)` above) is the demodiscover FEED, and
      // its consumer rebuilds a TDW-line link from this field when
      // `enquire_link` is null (demodiscover/page.tsx:187, hardcoded against
      // 917982159047). `ig_handle` is not a routing token — vendorInbound
      // resolves `vendors.routing_handle` only — so the rebuilt link is
      // unresolvable by construction. Nulled at the mint, same as
      // couple/discover.js's demo branch. This surface renders no IG chip and
      // never received `instagram_handle`, so nothing here is displaced.
      routing_handle: null,
      starting_price: null,
      photos:         Array.isArray(v.photos) ? v.photos.map(p => (typeof p === 'string' ? p : p.url)).filter(Boolean) : [],
      vibe_tags:      [],
      about:          v.about,
      enquire_link:   v.whatsapp_phone ? `https://wa.me/${v.whatsapp_phone.replace(/[^0-9]/g, '')}` : null,
    }));
    return res.json({ ok: true, vendors: shaped, page: 0, has_more: false, total: shaped.length });
  } catch (err) {
    console.error('[demo/discover]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// ── TDW_08 P1 · G-1 · THE OPEN BEACON ────────────────────────────────────────
// POST /api/v2/demo/vendor/:handle/opened — A PURE ANALYTICS BEACON. It stamps
// `opened_at` and moves `invited -> opened`. IT MUTATES NO CLOCK: the first-open
// +72h extension was RETIRED by the founder on 2026-08-02 (CE-137 §1), and the
// 72h window is now set at `engaged` and nowhere else. Unauthenticated BY CONSTITUTION (G-6: no login wall before
// claim), and it is the SEVENTH unauthenticated door on this surface, not the
// first — GET /:handle, /:handle/leads, /:handle/context, POST /:handle/chat,
// GET / and POST /:handle/claim all precede it. It leaks nothing GET /:handle's
// own 404 does not already leak, which is what distinguishes it from
// F-07.105/106's identity oracles; its nearest relative is F-07.64.
//
// TWO PUBLIC URLS, DECLARED NOT DISCOVERED: router.js mounts THIS router at both
// `/api/v2/demo/vendor` (:147) and `/api/v2/demo/discover` (:148), so this route
// answers at both paths whether or not that is wanted. Stated here because a
// limiter keyed per-IP is unaffected but anyone counting doors must count two.
//
// THE PRIMARY BOUND IS STRUCTURAL, NOT THE LIMITER: idempotency binds to
// `opened_at IS NULL` (CE-137 §2). The first hit stamps; every later hit changes
// no byte. So a flood buys ONE timestamp and then nothing but write load.
//
// THE LIMITER'S JUSTIFICATION, RESTATED HONESTLY RATHER THAN INHERITED: it was
// adopted at CE-135 when this door moved a business clock. It no longer does —
// it writes one timestamp — so the case for it is WEAKER than the case that
// bought it. It stays because it is built, driven and proven against crew's real
// exports, and removing working code to save nothing is churn. Anyone reading
// this later should know the reasoning changed under it (CE-137 §2).
//
// THE LIMITER IS NOT NEW (CE-135 §2). It is `crew.js`'s
// CE-ruled hand-rolled bucket, reused rather than rebuilt, at crew's OWN
// `LIMIT_IP_MISS` budget — 30 / 10 min / IP — because that is crew's budget for
// "the only brute-force surface" and this door is the same shape: unauthenticated,
// handle-keyed, publicly enumerable. `app.set('trust proxy', true)`
// (src/index.js:55) makes req.ip the real client.
//
// CREW'S PER-PROCESS DISCLOSURE IS INHERITED VERBATIM, because a limiter whose
// limits are not what they appear is worse than none if nobody says so: this
// ceiling is PER PROCESS. Railway can run more than one instance of this service
// and each would hold its own buckets, so the effective global ceiling is
// (limit x instances), and a restart forgets every bucket.
//
// FILED, NOT CURED, AND IT IS THE LARGER DOOR: POST /:handle/chat at :131 is
// unauthenticated on this same surface and burns model tokens per request with
// no limiter at all. Bigger exposure than this one; not this sitting's.
router.post('/:handle/opened', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { hit, LIMIT_IP_MISS } = require('../crew');
  const gate = hit(`demo_opened:${req.ip}`, LIMIT_IP_MISS);
  if (!gate.allowed) {
    res.set('Retry-After', String(gate.retryAfter));
    return res.status(429).json({ ok: false, code: 'rate_limited' });
  }
  try {
    const r = await require('../../lib/demoLifecycle').onOpened(supabase, req.params.handle);
    if (r.ok === false && r.reason === 'not_found') {
      return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    }
    // A refusal on state is a 200: the landing is a public page and a visitor
    // opening an expired or removed demo is not an error they can act on. The
    // beacon reports what happened and never becomes a second 404 surface.
    return res.json({ ok: true, state: r.ok ? r.state : null, extended: r.extended === true });
  } catch (err) {
    console.error('[demo/opened]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

module.exports = router;

// POST /demo/vendor/:handle/claim — vendor claims their demo studio
// Notifies admin immediately via Supabase insert into demo_claim_requests
router.post('/:handle/claim', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { handle } = req.params;
  const { phone, vendor_name } = req.body || {};

  if (!phone || !handle) {
    return res.status(400).json({ ok: false, error: 'phone and handle required' });
  }

  try {
    // Log to a simple table — create if needed via migration, or use demo_leads as fallback
    // Insert into demo_vendors claim field OR a separate table
    await supabase.from('demo_claim_requests').insert({
      ig_handle:   handle,
      vendor_name: vendor_name || handle,
      phone:       phone,
      claimed_at:  new Date().toISOString(),
    }).throwOnError();

    console.log(`[demo/claim] ${handle} claimed by ${phone}`);
    return res.json({ ok: true });
  } catch (err) {
    // ── F-07.37 CURED · SUCCESS-ON-FAILURE, CONFESSED BY ITS OWN COMMENT ────
    // THIS BLOCK READ:
    //     // Fallback — still return ok so vendor sees success screen
    //     console.error('[demo/claim] insert failed:', ... '— still returning ok');
    //     return res.json({ ok: true });
    // A vendor whose claim did NOT land was shown a success screen. He then
    // waited for a call that could never come, because the row the founder's
    // queue reads (GET /admin/demo/claims) was never written. The comment names
    // the trade and takes the wrong side of it: a success screen is not worth a
    // vendor believing he is in a pipeline he is not in.
    //
    // This is the founding-lie family — the class the wire guard was built to
    // intercept on the model's mouth (TDW_06). It has no business being authored
    // deliberately in a route handler. `.throwOnError()` above already makes the
    // failure reachable; this returns it.
    //
    // P5 raises the stakes: demo_lead_alert's {{3}} sends real vendors here.
    console.error(`[demo/claim] FAILED for ${handle} / ${phone}: ${err.message} — reporting failure`);
    return res.status(502).json({
      ok: false,
      error: 'Could not save your claim. Please try again.',
    });
  }
});
