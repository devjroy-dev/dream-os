// onboarding.js — conversational onboarding flow for new vendors
//
// EVENT vendors   (photographer, MUA, decor, venue, etc.) — the work happens ON
//                 the wedding day. Flow: name -> ig -> category -> city ->
//                 travel -> rate -> complete.
// DELIVERY vendors (designer, jeweller) — the work is MADE and DELIVERED before
//                 the wedding. "Travel to the venue" and "rate per wedding day"
//                 are the wrong questions. Flow forks after category/city into:
//                 craft -> reach (pan-India?) -> price -> complete.
//
// Session 8.1: asked_category uses Haiku smart extraction.
//   - Normalises category against locked taxonomy (categories.js)
//   - Extracts style_notes (qualifiers like "luxury", "celebrity", "budget")
//   - If vendor mentions city in same message, captures it and skips asked_city
//
// Completion (handle assignment + final message) is shared by both flows via
// completeOnboarding() — single source of truth, and the place the old
// out-of-scope `handle` ReferenceError used to crash.

const { MODEL_HAIKU }                    = require('./models');
const { VENDOR_CATEGORIES, CATEGORY_ALIASES } = require('./categories');

const TDW_WA_NUMBER = process.env.TDW_WA_NUMBER || '14787788550';

// Categories whose work is made-and-delivered before the wedding. These get the
// craft -> reach -> price sub-flow instead of travel -> rate.
const DELIVERY_CATEGORIES = new Set(['designer', 'jewellery']);

// ── Category-specific question wording (delivery vendors only) ────────────────
function craftQuestion(category) {
  if (category === 'designer')
    return 'What do you make mostly — bridal lehengas, gowns, sherwanis, sarees? Whatever you specialise in.';
  if (category === 'jewellery')
    return 'What do you work in mostly — full bridal sets, necklaces, individual pieces? And the style: polki, kundan, gold, diamond, temple?';
  return 'Tell me a bit about what you make.';
}

function priceQuestion(category) {
  if (category === 'designer')
    return "And what's the typical price range for a custom outfit with you? A ballpark is fine.";
  if (category === 'jewellery')
    return "And what's the typical price range for a piece or a full set? A ballpark is fine.";
  return "And what's your typical price range? A ballpark is fine.";
}

// Pan-India reach — the delivery-vendor stand-in for "open to travel".
function reachQuestion(city) {
  return city
    ? `And are your services available pan-India, or mostly within ${city}?`
    : `And are your services available pan-India, or mostly local?`;
}

// ── Category extractor ────────────────────────────────────────────────────────
// Calls Haiku with a strict JSON-only prompt to extract:
//   { category, style_notes, city }
// from whatever the vendor typed.
// Falls back to raw input if Haiku fails or returns unexpected output.

async function extractCategoryDetails(inboundMessage, anthropic) {
  const categoryList = VENDOR_CATEGORIES.join(', ');

  const prompt = `You are extracting vendor profile data from a WhatsApp message sent by a wedding vendor in India.

Extract the following fields from the message and return ONLY valid JSON, no other text:

{
  "category": "<one value from the allowed list>",
  "style_notes": "<qualifier words only, or null>",
  "city": "<city name if mentioned, or null>"
}

ALLOWED CATEGORIES: ${categoryList}

RULES:
- category: pick the single best match from the allowed list. If nothing fits, use "other".
- style_notes: capture qualifier words only — things like "luxury", "celebrity", "budget", "boutique", "destination", "traditional", "contemporary". Do NOT include the category word itself. If no qualifier, return null.
- city: extract only if the vendor clearly stated their city. If not mentioned, return null.
- Return ONLY the JSON object. No explanation, no markdown, no backticks.

EXAMPLES:
Message: "I'm a luxury decorator based in Delhi"
{"category":"decor","style_notes":"luxury","city":"Delhi"}

Message: "I do candid photography"
{"category":"photography","style_notes":"candid","city":null}

Message: "Bridal MUA, working out of Mumbai"
{"category":"makeup","style_notes":"bridal","city":"Mumbai"}

Message: "I'm a wedding planner"
{"category":"planning","style_notes":null,"city":null}

Message: "Celebrity makeup artist"
{"category":"makeup","style_notes":"celebrity","city":null}

Message: "I do mehendi and I'm based in Pune"
{"category":"mehendi","style_notes":null,"city":"Pune"}

Now extract from this message:
"${inboundMessage}"`;

  try {
    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 150,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    // Strip accidental markdown fences if model adds them
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    // Validate: category must be in the allowed list
    const category   = VENDOR_CATEGORIES.includes(parsed.category) ? parsed.category : 'other';
    const styleNotes = typeof parsed.style_notes === 'string' && parsed.style_notes.trim()
      ? parsed.style_notes.trim().toLowerCase()
      : null;
    const city = typeof parsed.city === 'string' && parsed.city.trim()
      ? parsed.city.trim()
      : null;

    console.log(`[onboarding:extract] category="${category}" style_notes="${styleNotes}" city="${city}"`);
    return { category, style_notes: styleNotes, city };

  } catch (err) {
    // Fallback: strip common preambles, store raw input as category
    console.warn(`[onboarding:extract] Haiku extraction failed — using raw input:`, err.message);
    const fallback = inboundMessage
      .trim()
      .replace(/^(i'm an?|i am an?|im an?|i do|i am a)\s+/i, '')
      .toLowerCase()
      .trim();
    return { category: fallback, style_notes: null, city: null };
  }
}

// ── Shared completion ─────────────────────────────────────────────────────────
// Assigns the TDW routing handle, marks onboarding complete, and returns the
// final hand-off message. Called by BOTH the event flow (asked_rate) and the
// delivery flow (asked_price), so the closing experience is identical.
//
// NOTE: `handle` is declared in this function's top scope (not inside the
// if/else) so it is always defined when the final message is built. The old
// code declared it inside the else block, which threw a ReferenceError on the
// `${handle}` references below and meant the closing message was never sent.
async function completeOnboarding({ vendor, user, supabase }) {
  const { data: freshVendor } = await supabase
    .from('vendors').select('instagram_handle, routing_handle').eq('id', vendor.id).maybeSingle();

  let handle = freshVendor?.routing_handle || null;

  if (handle) {
    // Handle already set (e.g. from web onboarding) — keep it, just complete.
    await supabase.from('vendors').update({ onboarding_state: 'complete' }).eq('id', vendor.id);
  } else {
    const igHandle  = (freshVendor?.instagram_handle || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    const phone3    = (user?.phone || '').replace(/\D/g, '').slice(-3);
    const phone4    = (user?.phone || '').replace(/\D/g, '').slice(-4);
    const candidates = [
      igHandle,
      `${firstName}${phone3}`,
      `${firstName}${phone4}`,
      `${firstName}${phone3}${phone4}`,
      `${firstName}${Date.now().toString().slice(-6)}`,
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (!candidate || candidate.length < 2) continue;
      const { data: existing } = await supabase
        .from('vendors').select('id').eq('routing_handle', candidate).maybeSingle();
      if (!existing) { handle = candidate; break; }
    }
    // Last-resort fallback so handle is never null.
    if (!handle) handle = `VENDOR${Date.now().toString().slice(-6)}`;
    await supabase
      .from('vendors')
      .update({ routing_handle: handle, onboarding_state: 'complete' })
      .eq('id', vendor.id);
  }

  await supabase.from('notes').insert({
    vendor_id: vendor.id,
    content: `TDW handle: ${handle}`,
    tags: ['onboarding', 'tdw'],
  });

  const tdwLink = `wa.me/${TDW_WA_NUMBER}?text=TDW-${handle}`;
  return {
    reply: `Perfect — you're all set. Here's your TDW link: ${tdwLink} — put this in your Instagram bio so couples can reach you directly. Or just tell me about a lead who messaged and I'll log it. From here just talk to me like you'd talk to a trusted assistant.

Also head over to thedreamwedding.in and sign in as a Maker — your dashboard is ready and waiting for you.`,
  };
}

// ── Main onboarding handler ───────────────────────────────────────────────────

async function nextOnboardingMessage({ vendor, user, inboundMessage, supabase, anthropic }) {
  const state = vendor.onboarding_state;
  const name  = user?.name || 'there';

  switch (state) {

    case 'new': {
      await supabase.from('vendors').update({ onboarding_state: 'asked_name' }).eq('id', vendor.id);
      const greeting = name && name !== 'there'
        ? `Hi ${name} —`
        : `Hi —`;
      return { reply: `${greeting} I'm your chief of staff, here to help you manage every aspect of your business. Quick question before we begin — what should I call you? Just your first name is fine.` };
    }

    case 'asked_name': {
      const firstName = inboundMessage.trim().split(/\s+/)[0].slice(0, 60);
      const cleanFirst = firstName.replace(/[^\w'-]/g, '').trim() || firstName;
      await supabase.from('users').update({ name: cleanFirst }).eq('id', vendor.user_id);
      await supabase.from('vendors').update({ onboarding_state: 'asked_ig' }).eq('id', vendor.id);
      return { reply: `Got it, ${cleanFirst}. One more thing — what's your Instagram handle? Your clients will use it to reach your PA. If you don't have one, just say skip.` };
    }

    case 'asked_ig': {
      const trimmedIg = inboundMessage.trim();
      const skipped = /^skip$/i.test(trimmedIg) || /^no$/i.test(trimmedIg) || !trimmedIg;
      const igRaw = skipped ? null : trimmedIg.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
      const igUpdates = { onboarding_state: 'asked_category' };
      if (igRaw) igUpdates.instagram_handle = igRaw;
      await supabase.from('vendors').update(igUpdates).eq('id', vendor.id);
      if (igRaw) {
        return { reply: `@${igRaw} — perfect. Now tell me a bit about your work — what do you do?` };
      }
      return { reply: `No worries. Tell me a bit about your work — what do you do?` };
    }

    case 'asked_category': {
      // ── Smart extraction via Haiku ──────────────────────────────
      const extracted = await extractCategoryDetails(inboundMessage, anthropic);
      const { category, style_notes, city } = extracted;
      const isDelivery = DELIVERY_CATEGORIES.has(category);

      // If vendor mentioned city, capture it and skip asked_city
      if (city) {
        const nextState = isDelivery ? 'asked_craft' : 'asked_travel';
        await supabase.from('vendors').update({
          category,
          style_notes,
          city,
          onboarding_state: nextState,
        }).eq('id', vendor.id);

        await supabase.from('notes').insert([
          { vendor_id: vendor.id, content: `Category: ${category}${style_notes ? ` (${style_notes})` : ''}`, tags: ['onboarding', 'category'] },
          { vendor_id: vendor.id, content: `Based in ${city}`, tags: ['onboarding', 'city'] },
        ]);

        const categoryDisplay = style_notes ? `${style_notes} ${category}` : category;
        if (isDelivery) {
          return { reply: `Got it — ${categoryDisplay} based in ${city}. ${craftQuestion(category)}` };
        }
        return { reply: `Got it — ${categoryDisplay} based in ${city}. Are you open to travelling for work, or mostly local?` };
      }

      // No city extracted — proceed to asked_city
      await supabase.from('vendors').update({
        category,
        style_notes,
        onboarding_state: 'asked_city',
      }).eq('id', vendor.id);

      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Category: ${category}${style_notes ? ` (${style_notes})` : ''}`,
        tags: ['onboarding', 'category'],
      });

      const categoryDisplay = style_notes ? `${style_notes} ${category}` : category;
      return { reply: `Got it — ${categoryDisplay}. And where are you based mostly?` };
    }

    case 'asked_city': {
      const city = inboundMessage.trim();
      const isDelivery = DELIVERY_CATEGORIES.has(vendor.category);
      const nextState = isDelivery ? 'asked_craft' : 'asked_travel';
      await supabase.from('vendors').update({ city, onboarding_state: nextState }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Based in ${city}`, tags: ['onboarding', 'city'] });
      if (isDelivery) {
        return { reply: `${city} — ${craftQuestion(vendor.category)}` };
      }
      return { reply: `${city} — and are you open to travelling for work, or mostly local?` };
    }

    // ── DELIVERY sub-flow: craft -> reach -> price ──────────────────────────
    case 'asked_craft': {
      // What they make. Stored as style_notes (appended) + a note.
      const craft = inboundMessage.trim();
      const existingNotes = vendor.style_notes ? `${vendor.style_notes}; ` : '';
      const newStyleNotes = `${existingNotes}${craft}`.slice(0, 300);
      await supabase.from('vendors').update({
        style_notes: newStyleNotes,
        onboarding_state: 'asked_reach',
      }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Makes: ${craft}`, tags: ['onboarding', 'craft'] });
      return { reply: `Got it. ${reachQuestion(vendor.city)}` };
    }

    case 'asked_reach': {
      // Pan-India reach — the delivery stand-in for "open to travel".
      // Reuses vendors.open_to_travel / travel_notes so downstream readers are
      // unchanged (true = ships/serves pan-India).
      const open_to_travel = /yes|pan.?india|all over|everywhere|anywhere|nationwide|across india|ship/i.test(inboundMessage);
      const travel_notes   = inboundMessage.trim();
      await supabase.from('vendors').update({ open_to_travel, travel_notes, onboarding_state: 'asked_price' }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Reach: ${inboundMessage.trim()}`, tags: ['onboarding', 'reach'] });
      return { reply: priceQuestion(vendor.category) };
    }

    case 'asked_price': {
      // Typical price range. Stored in the same slot as event vendors' rate so
      // any pricing logic that reads pricing_policy.stated_rate still works.
      const price = inboundMessage.trim();
      await supabase.from('vendor_state').upsert({
        vendor_id: vendor.id,
        summary: `${user?.name || 'Vendor'} — ${vendor.category || ''}${vendor.style_notes ? ` (${vendor.style_notes})` : ''} based in ${vendor.city || ''}. Typical price range: ${price}. Founding cohort vendor.`,
        pricing_policy: { stated_rate: price },
        recent_notes: [],
        updated_at: new Date().toISOString(),
      });
      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Typical price range: ${price}`,
        tags: ['onboarding', 'pricing'],
      });

      return await completeOnboarding({ vendor, user, supabase });
    }

    // ── EVENT sub-flow: travel -> rate ──────────────────────────────────────
    case 'asked_travel': {
      const open_to_travel = /yes|open|travel|anywhere|pan.?india|outstation|outside/i.test(inboundMessage);
      const travel_notes   = inboundMessage.trim();
      await supabase.from('vendors').update({ open_to_travel, travel_notes, onboarding_state: 'asked_rate' }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Travel: ${inboundMessage.trim()}`, tags: ['onboarding', 'travel'] });
      return { reply: `Got it. And what's your typical rate for a wedding day? Ballpark is fine.` };
    }

    case 'asked_rate': {
      const rate = inboundMessage.trim();

      await supabase.from('vendor_state').upsert({
        vendor_id: vendor.id,
        summary: `${user?.name || 'Vendor'} — ${vendor.category || ''}${vendor.style_notes ? ` (${vendor.style_notes})` : ''} based in ${vendor.city || ''}. Typical rate: ${rate}. Founding cohort vendor.`,
        pricing_policy: { stated_rate: rate },
        recent_notes: [],
        updated_at: new Date().toISOString(),
      });
      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Typical wedding day rate: ${rate}`,
        tags: ['onboarding', 'pricing'],
      });

      return await completeOnboarding({ vendor, user, supabase });
    }

    default: {
      return { reply: `Something's off on my end. Message Dev at hello@thedreamwedding.in and he'll sort it.` };
    }
  }
}

module.exports = { nextOnboardingMessage };
