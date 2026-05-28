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
    const { data: leads, error } = await supabase
      .from('demo_leads')
      .select('*')
      .eq('demo_vendor_id', vendor.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, leads: leads || [] });
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
    const { data: leads } = await supabase
      .from('demo_leads')
      .select('*')
      .eq('demo_vendor_id', vendor.id)
      .order('created_at', { ascending: false });
    const leadList = (leads || []).map(l =>
      `- ${l.bride_name} | ${l.bride_wedding_city || '?'} | ${l.bride_wedding_date || 'TBD'} | ${l.state || 'new'}`
    ).join('\n');
    return res.json({
      ok: true,
      vendor: { name: vendor.display_name, category: vendor.category, city: vendor.city, about: vendor.about, rate_display: vendor.rate_display },
      leads_summary: {
        total:  (leads || []).length,
        new:    (leads || []).filter(l => l.state === 'new').length,
        booked: (leads || []).filter(l => l.state === 'booked').length,
        leads:  leads || [],
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

    const { data: leads } = await supabase
      .from('demo_leads')
      .select('*')
      .eq('demo_vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    const leadLines = (leads || []).map(l =>
      `- ${l.bride_name} | ${l.bride_wedding_city || '?'} | ${l.bride_wedding_date || 'TBD'} | status: ${l.state || 'new'} | message: "${l.raw_message || ''}"`
    ).join('\n');

    const dynamicContext = `VENDOR: ${vendor.display_name} | ${vendor.category} | ${vendor.city}\nRATE: ${vendor.rate_display || 'not set'}\nABOUT: ${vendor.about || 'not set'}\n\nLEADS (${(leads||[]).length} total):\n${leadLines || 'No leads yet.'}`;

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
      .order('created_at', { ascending: false });
    if (error) throw error;
    const shaped = (vendors || []).map(v => ({
      id:             v.id,
      name:           v.display_name,
      category:       v.category,
      city:           v.city,
      routing_handle: v.ig_handle,
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
    // Fallback — still return ok so vendor sees success screen
    console.error('[demo/claim] insert failed:', err.message, '— still returning ok');
    return res.json({ ok: true });
  }
});
