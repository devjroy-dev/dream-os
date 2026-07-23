// brideOnboarding.js — conversational onboarding flow for new brides
//
// Mirrors src/agent/onboarding.js for the bride product. Same shape,
// different content, bride-specific Haiku extractor, skip-on-dodge transitions.
//
// States: new -> asked_date -> asked_functions -> asked_partner -> asked_city -> asked_budget -> complete
//
// Onboarding runs OUTSIDE the agent loop. The state machine is deterministic
// and unbreakable. Haiku is used only as a structured extractor at asked_date
// (parallel to vendor side using Haiku at asked_category).
//
// Locked at B1 — never change script text without founder approval.
// AMENDED AT CE-65 (founder gates G1/G2, stage-2 veto): the greeting's
// demo-fixture clause DROPPED (F-05.31) and Mira named at the two introduction sites; the
// dodge composer folded onto the one authored register. Everything else in
// this file — the five questions, the five extraction/classification calls —
// is out of scope by ruling and byte-untouched.

const { MODEL_HAIKU } = require('./models');
// The soul's one home: the name given at the greeting/completion sites, and
// the register the dodge composer reads instead of re-describing the voice.
const { MIRA, MIRA_REGISTER } = require('./miraSoul');

// ── Locked script text — exact wording approved by founder ───────────────────

const LOCKED = {
  // Sent the moment a freshly-invited bride's first message arrives.
  // Triggered when couples.onboarding_state = 'new'.
  // Takes the bride's first name. If name is missing/empty, falls back to
  // the no-name version so the greeting still works for legacy invites.
  // F-05.31 (CE-65, founder gate G2: "DROP THE LINE"): this opener used to name a
  // DEMO/FIXTURE VENDOR — hardcoded into every real bride's first message. The name
  // itself is deliberately not repeated here (grep-zero is the check anyone runs;
  // a comment carrying the corpse makes that check lie). It is on the record in
  // docs/FINDINGS_LOG.md at CE-65. It dated from the invite-only bride app;
  // that era is over. Replacement authored by the executor, founder-confirmed at
  // the stage-2 veto. This is also where Mira's name is given for the first
  // time — the one introduction her soul allows.
  greeting: (name) => {
    const firstName = (name || '').trim().split(' ')[0];
    return firstName
      ? `Hi ${firstName} — ${MIRA} here, from The Dream Wedding. Glad you're here. So: when is the big day?`
      : `Hi — ${MIRA} here, from The Dream Wedding. Glad you're here. So: when is the big day?`;
  },

  // Bare question text used by the dodge classifier to ground its judgement.
  // Not sent on its own — the date question lives inside greeting().
  ask_date: `When is the big day?`,

  // After date captured. Phase 3.5 — capture the wedding SHAPE (a wedding is a
  // span, not one day). Asked once here; every category enquiry reads from it.
  ask_functions: `Is it a single day, or spread across a few functions — mehendi, sangeet, the wedding, reception? Roughly which ones, and over how many days?`,

  // After date captured.
  ask_partner: `And who's the lucky person?`,

  // After partner captured.
  ask_city: `Have you decided where the functions are going to take place?`,

  // After city captured.
  ask_budget: `And how flexible are you with your budget, a ballpark figure?`,

  // After budget captured. Completes onboarding. Ends with the vendor-listing
  // question — her next message routes to the agent loop's first-turn handler.
  complete: (name) =>
    `So ${name || 'there'}, you're all set. I'm ${MIRA} — and I'm not just here to remind you of things, I'm here to help you decide whatever you need to for the wedding. Starting from your outfit to what songs to play for your special dance performance (I really hope you are doing one).\n\nAnd to have the best possible experience at the TDW, check out thedreamwedding.in. It's already waiting for you to sign in.\n\nLet's start with you telling me what all vendors you've already booked, or do you want to do that later?`
};

// ── Dodge detection — Haiku-based intent classification ─────────────────────

// Earlier sessions used a regex match. That breaks on phrasings we didn't
// anticipate ("I'd rather not say" gets saved as the literal name).
// Now Haiku does the intent classification with the question as context.
// Regex remains as the fallback if Haiku errors out — we never silently
// accept a dodge as an answer.

const DODGE_PHRASES = [
  /\bi\s*don'?t\s+know\b/i,
  /\bnot\s+(sure|decided|yet|fixed)\b/i,
  /\bno\s+(idea|clue)\b/i,
  /\btbd\b/i,
  /\bskip\b/i,
  /\blater\b/i,
  /\bhaven'?t\s+(decided|figured|thought)\b/i,
  /\bwe'?ll\s+(see|figure|decide)\b/i,
  /\bnothing\s+(fixed|set|yet)\b/i,
  /\b(rather|prefer)\s+not\b/i,
  /\bprivate\b/i,
  /\bpass\b/i,
  /^\s*(idk|dunno|nope|na)\s*$/i,
];

function looksLikeDodgeRegex(message) {
  const trimmed = (message || '').trim();
  if (!trimmed) return true;
  if (/^\s*(no|nope|na|idk|dunno)\s*$/i.test(trimmed)) return true;
  return DODGE_PHRASES.some(rx => rx.test(trimmed));
}

async function looksLikeDodge(message, currentQuestion, anthropic) {
  const trimmed = (message || '').trim();
  if (!trimmed) return true;

  // If anthropic client isn't provided (defensive — shouldn't happen),
  // fall back to regex
  if (!anthropic) {
    return looksLikeDodgeRegex(trimmed);
  }

  const prompt = `You are evaluating a message in a wedding-planning onboarding conversation.

Question asked: "${currentQuestion}"
Bride's reply: "${trimmed}"

Is the bride's reply a DODGE — meaning she's avoiding answering the question, declining to share, deferring, or saying she doesn't know — rather than actually answering it?

Examples of DODGES: "I don't know yet", "not sure", "TBD", "skip", "later", "I'd rather not say", "private", "pass on that", "we'll see", "haven't decided", "next question", "rather keep that to myself".
Examples of ANSWERS: "February 2027", "Rohit", "Goa", "around 35 lakhs", "Mumbai or Goa, undecided", "his name is Arjun", or anything that directly answers the question even if hedged.

Reply with exactly one word: DODGE or ANSWER. No punctuation, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 8,
      messages: [{ role: 'user', content: prompt }],
    });
    const verdict = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
      .toUpperCase();
    return verdict.startsWith('DODGE');
  } catch (err) {
    console.warn(`[brideOnboarding:looksLikeDodge] Haiku failed — falling back to regex check:`, err.message);
    return looksLikeDodgeRegex(trimmed);
  }
}

// ── Haiku extractor — runs at asked_date, mirrors vendor's extractCategoryDetails

async function extractOnboardingDetails(inboundMessage, anthropic) {
  const prompt = `You are extracting wedding planning details from a WhatsApp message sent by an Indian bride.

Extract the following fields from the message and return ONLY valid JSON, no other text:

{
  "wedding_date": "<YYYY-MM-DD if exact date, or a season/month string like 'February 2027' or 'winter 2026', or null>",
  "partner_name": "<partner's name if mentioned, or null>",
  "wedding_city": "<city name if mentioned, or null>",
  "budget_total": <integer rupees if budget mentioned (e.g. 3500000 for 35L), or null>,
  "function_count": <integer number of functions if she mentions them (e.g. mehendi+sangeet+wedding = 3), or null>,
  "wedding_days": <integer days the wedding spans if mentioned, or null>,
  "functions": "<comma-separated function names if mentioned (e.g. 'mehendi, sangeet, wedding'), or null>"
}

RULES:
- wedding_date: if she gives a specific date, format YYYY-MM-DD. If she gives a month + year, return "Month YYYY". If a season, return e.g. "winter 2027". If nothing date-like, return null.
- partner_name: only if she names her partner. Don't infer.
- wedding_city: only if she names a city.
- budget_total: convert lakhs (L) and crores (Cr) to integer rupees. 30L = 3000000, 1Cr = 10000000. Return integer only, no commas.
- function_count / wedding_days / functions: ONLY if she volunteers them in this message (most won't — she's usually just answering the date). Otherwise null.
- Return ONLY the JSON object. No explanation, no markdown, no backticks.

EXAMPLES:

Message: "Feb 2027"
{"wedding_date":"February 2027","partner_name":null,"wedding_city":null,"budget_total":null}

Message: "We're getting married 14th December 2026"
{"wedding_date":"2026-12-14","partner_name":null,"wedding_city":null,"budget_total":null}

Message: "Sometime in winter next year"
{"wedding_date":"winter 2027","partner_name":null,"wedding_city":null,"budget_total":null}

Message: "Feb 2027, his name's Rohit and we're doing it in Goa, budget around 35L"
{"wedding_date":"February 2027","partner_name":"Rohit","wedding_city":"Goa","budget_total":3500000}

Message: "December, 30 lakhs"
{"wedding_date":"December 2026","partner_name":null,"wedding_city":null,"budget_total":3000000}

Message: "Not sure yet"
{"wedding_date":null,"partner_name":null,"wedding_city":null,"budget_total":null}

Now extract from this message:
"${inboundMessage}"`;

  try {
    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 200,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    return {
      wedding_date: typeof parsed.wedding_date === 'string' && parsed.wedding_date.trim() ? parsed.wedding_date.trim() : null,
      partner_name: typeof parsed.partner_name === 'string' && parsed.partner_name.trim() ? parsed.partner_name.trim() : null,
      wedding_city: typeof parsed.wedding_city === 'string' && parsed.wedding_city.trim() ? parsed.wedding_city.trim() : null,
      budget_total: Number.isInteger(parsed.budget_total) && parsed.budget_total > 0 ? parsed.budget_total : null,
      function_count: Number.isInteger(parsed.function_count) && parsed.function_count > 0 ? parsed.function_count : null,
      wedding_days:   Number.isInteger(parsed.wedding_days)   && parsed.wedding_days   > 0 ? parsed.wedding_days   : null,
      functions:      typeof parsed.functions === 'string' && parsed.functions.trim() ? parsed.functions.trim().slice(0, 200) : null,
    };
  } catch (err) {
    console.warn(`[brideOnboarding:extract] Haiku extraction failed — treating message as raw text:`, err.message);
    return { wedding_date: null, partner_name: null, wedding_city: null, budget_total: null, function_count: null, wedding_days: null, functions: null };
  }
}

// ── Wedding-shape extractor — runs at asked_functions (Phase 3.5) ────────────

async function extractWeddingShape(inboundMessage, anthropic) {
  const prompt = `Extract the SHAPE of an Indian wedding from this WhatsApp message. The bride was JUST asked: "Is it a single day, or spread across a few functions — mehendi, sangeet, the wedding, reception? Roughly which ones, and over how many days?" Her reply may refer back to that list (e.g. "all of them", "everything", "the usual"). Return ONLY valid JSON:

{ "function_count": <integer or null>, "wedding_days": <integer or null>, "functions": "<comma-separated list as she described, or null>" }

RULES:
- The question NAMED these four standard functions: mehendi, sangeet, wedding, reception. If she says "all of them", "everything", "all four", "the works", or similar → functions = "mehendi, sangeet, wedding, reception" and function_count = 4.
- If she names specific ones → list exactly those, lowercased.
- function_count: how many distinct functions (derive from the list if she named or implied them).
- wedding_days: how many days it spans (e.g. "around 4 days" = 4; single-day = 1). null if she didn't say.
- "just one day" / "single day" → function_count 1, wedding_days 1, functions null.
- Return ONLY the JSON, no explanation.

EXAMPLES:
Message: "All of them. Around 4 days"
{"function_count":4,"wedding_days":4,"functions":"mehendi, sangeet, wedding, reception"}

Message: "Everything, over 5 days"
{"function_count":4,"wedding_days":5,"functions":"mehendi, sangeet, wedding, reception"}

Message: "Mehendi, sangeet and the wedding, over 3 days"
{"function_count":3,"wedding_days":3,"functions":"mehendi, sangeet, wedding"}

Message: "Just the wedding, one day"
{"function_count":1,"wedding_days":1,"functions":null}

Message: "It's a big one — mehendi, haldi, sangeet, wedding and reception across 4 days"
{"function_count":5,"wedding_days":4,"functions":"mehendi, haldi, sangeet, wedding, reception"}

Message: "${inboundMessage}"`;

  try {
    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 120,
      messages:   [{ role: 'user', content: prompt }],
    });
    const raw = response.content
      .filter(b => b.type === 'text').map(b => b.text).join('').trim()
      .replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    return {
      function_count: Number.isInteger(parsed.function_count) && parsed.function_count > 0 ? parsed.function_count : null,
      wedding_days:   Number.isInteger(parsed.wedding_days)   && parsed.wedding_days   > 0 ? parsed.wedding_days   : null,
      functions:      typeof parsed.functions === 'string' && parsed.functions.trim() ? parsed.functions.trim().slice(0, 200) : null,
    };
  } catch (err) {
    console.warn(`[brideOnboarding:extractWeddingShape] Haiku extraction failed:`, err.message);
    return { function_count: null, wedding_days: null, functions: null };
  }
}

// ── Budget-only extractor — runs at asked_budget ─────────────────────────────

async function extractBudget(inboundMessage, anthropic) {
  const prompt = `Extract a wedding budget from this WhatsApp message from an Indian bride. Return ONLY valid JSON:

{ "budget_total": <integer rupees or null> }

RULES:
- Convert lakhs (L) and crores (Cr) to integer rupees. 30L = 3000000, 1Cr = 10000000, 50 lakh = 5000000.
- Handle: "30L", "30 lakhs", "Rs 30,00,000", "3 million", "around 35L", "35-40L" (use lower bound), "no fixed budget" (null).
- Return ONLY the JSON, no explanation.

Message: "${inboundMessage}"`;

  try {
    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 60,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
      .replace(/```json|```/g, '')
      .trim();

    const parsed = JSON.parse(raw);
    return Number.isInteger(parsed.budget_total) && parsed.budget_total > 0 ? parsed.budget_total : null;
  } catch (err) {
    console.warn(`[brideOnboarding:extractBudget] Haiku extraction failed:`, err.message);
    return null;
  }
}

// ── Dodge transition composer — Haiku on the one register (CE-65 fold) ──────────────────────────
// When the bride dodges an onboarding question, we still want a graceful
// one-line transition before the next question. The transition is composed
// by Haiku so each one feels natural rather than scripted.
//
// Cost: one extra Haiku call (~30 tokens out) per dodge. Dodges are rare,
// so the latency tax only hits the bride who already chose not to answer.
//
// Falls back to a safe hardcoded line if Haiku fails — never blocks the flow.

const DODGE_FALLBACK = {
  date:    `No rush — we'll figure that out as we go.`,
  functions: `No worries — we can map out the functions later.`,
  partner: `Fair, parking that for now.`,
  city:    `Fair, big decision.`,
  budget:  `Cool, we'll figure it out as we go.`,
};

async function composeDodgeTransition(dodgedField, nextQuestion, anthropic) {
  const fieldDescriptions = {
    date:    "when her wedding is",
    functions: "how many functions her wedding has and over how many days",
    partner: "her partner's name",
    city:    "where the wedding will happen",
    budget:  "her wedding budget",
  };

  const fieldDesc = fieldDescriptions[dodgedField] || "that question";

  const prompt = `${MIRA_REGISTER}

The bride just dodged a question about ${fieldDesc} during onboarding — she said something like "I don't know yet" or "not sure". She's not pressing for help, she just doesn't want to answer right now.

Write ONE short transitional sentence (maximum 8 words) that:
- Acknowledges the dodge without pressing
- Does not ask any question
- Does not moralize, doesn't say "no worries", doesn't sound corporate
- DOES NOT use the phrase "circle back" or any variant ("we'll circle back", "circle back on that", etc.) — this phrase is banned

Then output a newline, then exactly this question text verbatim:
"${nextQuestion}"

Return ONLY the two-line reply. No preamble, no quotes, no markdown.

EXAMPLES of good acknowledgments (do not copy verbatim, write fresh in same register — and never use "circle back"):
- "Fair, parking that for now."
- "Cool, no rush."
- "Got it, moving on."
- "Right, next."
- "Sure, later then."
- "Skipping for now."
- "Noted, on we go."`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
      .replace(/^["'`]+|["'`]+$/g, '');

    // Sanity check: must include the next question text verbatim.
    if (!raw.includes(nextQuestion)) {
      return `${DODGE_FALLBACK[dodgedField] || 'Right.'} ${nextQuestion}`;
    }

    // Additional check: reject if the model still slipped "circle back" in
    if (/\bcircle\s+back\b/i.test(raw)) {
      return `${DODGE_FALLBACK[dodgedField] || 'Right.'} ${nextQuestion}`;
    }

    return raw;
  } catch (err) {
    console.warn(`[brideOnboarding:composeDodge] Haiku failed — using fallback:`, err.message);
    return `${DODGE_FALLBACK[dodgedField] || 'Right.'} ${nextQuestion}`;
  }
}

// ── Main onboarding handler ──────────────────────────────────────────────────
// Mirrors vendor onboarding.nextOnboardingMessage signature.

async function nextBrideOnboardingMessage({ couple, user, inboundMessage, supabase, anthropic }) {
  const state = couple.onboarding_state;
  const name  = user?.name || 'there';

  switch (state) {

    // ── new: send greeting, advance to asked_date ───────────────────────────
    // The very first message we ever receive from a freshly-invited bride
    // hits this. We don't read her message content — we just greet her.
    case 'new': {
      await supabase.from('couples').update({ onboarding_state: 'asked_date' }).eq('id', couple.id);
      return { reply: LOCKED.greeting(user?.name) };
    }

    // ── asked_date: Haiku extraction across all four fields ─────────────────
    case 'asked_date': {
      // Dodge handling first — if she dodges the date, skip and ask partner
      if (await looksLikeDodge(inboundMessage, LOCKED.ask_date, anthropic)) {
        await supabase.from('couples').update({ onboarding_state: 'asked_partner' }).eq('id', couple.id);
        const reply = await composeDodgeTransition('date', LOCKED.ask_partner, anthropic);
        return { reply };
      }

      const extracted = await extractOnboardingDetails(inboundMessage, anthropic);
      const updates = {};
      const notesToInsert = [];

      if (extracted.wedding_date) {
        updates.wedding_date = parseDateForDb(extracted.wedding_date);
        notesToInsert.push({ couple_id: couple.id, content: `Wedding date: ${extracted.wedding_date}`, tags: ['onboarding', 'date'] });
      }
      if (extracted.partner_name) {
        updates.partner_name = extracted.partner_name;
        notesToInsert.push({ couple_id: couple.id, content: `Partner: ${extracted.partner_name}`, tags: ['onboarding', 'partner'] });
      }
      if (extracted.wedding_city) {
        updates.wedding_city = extracted.wedding_city;
        notesToInsert.push({ couple_id: couple.id, content: `Wedding city: ${extracted.wedding_city}`, tags: ['onboarding', 'city'] });
      }
      if (extracted.budget_total) {
        updates.budget_total = extracted.budget_total;
        notesToInsert.push({ couple_id: couple.id, content: `Budget: Rs ${extracted.budget_total.toLocaleString('en-IN')}`, tags: ['onboarding', 'budget'] });
      }
      // Phase 3.5: persist wedding shape if she volunteered it alongside the date.
      if (extracted.function_count) updates.function_count = extracted.function_count;
      if (extracted.wedding_days)   updates.wedding_days   = extracted.wedding_days;
      if (extracted.functions) {
        updates.functions = extracted.functions;
        notesToInsert.push({ couple_id: couple.id, content: `Wedding shape: ${extracted.functions}${extracted.wedding_days ? ` over ${extracted.wedding_days} days` : ''}`, tags: ['onboarding', 'functions'] });
      }

      // Advance state past whatever was captured
      const nextState = nextStateAfter('asked_date', extracted);
      updates.onboarding_state = nextState;

      await supabase.from('couples').update(updates).eq('id', couple.id);
      if (notesToInsert.length > 0) await supabase.from('notes').insert(notesToInsert);

      return { reply: replyForState(nextState, user?.name, extracted) };
    }

    // ── asked_functions: capture the wedding shape (Phase 3.5) ──────────────
    case 'asked_functions': {
      if (await looksLikeDodge(inboundMessage, LOCKED.ask_functions, anthropic)) {
        await supabase.from('couples').update({ onboarding_state: 'asked_partner' }).eq('id', couple.id);
        const reply = await composeDodgeTransition('functions', LOCKED.ask_partner, anthropic);
        return { reply };
      }

      const shape = await extractWeddingShape(inboundMessage, anthropic);
      const updates = { onboarding_state: 'asked_partner' };
      if (shape.function_count) updates.function_count = shape.function_count;
      if (shape.wedding_days)   updates.wedding_days   = shape.wedding_days;
      if (shape.functions)      updates.functions      = shape.functions;

      await supabase.from('couples').update(updates).eq('id', couple.id);

      if (shape.functions || shape.function_count) {
        await supabase.from('notes').insert({
          couple_id: couple.id,
          content: `Wedding shape: ${shape.functions || `${shape.function_count} functions`}${shape.wedding_days ? ` over ${shape.wedding_days} days` : ''}`,
          tags: ['onboarding', 'functions'],
        });
      }

      // Acknowledge naturally, then ask the partner question.
      const ack = shape.functions
        ? `Got it — ${shape.functions}. `
        : (shape.function_count ? `Got it. ` : `Noted. `);
      return { reply: `${ack}${LOCKED.ask_partner}` };
    }

    // ── asked_partner: capture partner name ─────────────────────────────────
    case 'asked_partner': {
      if (await looksLikeDodge(inboundMessage, LOCKED.ask_partner, anthropic)) {
        await supabase.from('couples').update({ onboarding_state: 'asked_city' }).eq('id', couple.id);
        const reply = await composeDodgeTransition('partner', LOCKED.ask_city, anthropic);
        return { reply };
      }
      // Light parsing: take the message as-is, trimmed. Strip preambles.
      const partnerName = inboundMessage.trim().replace(/^(his|her|their)\s+name'?s?\s+/i, '').replace(/^it'?s\s+/i, '').slice(0, 80);

      await supabase.from('couples').update({
        partner_name: partnerName,
        onboarding_state: 'asked_city',
      }).eq('id', couple.id);

      await supabase.from('notes').insert({
        couple_id: couple.id,
        content: `Partner: ${partnerName}`,
        tags: ['onboarding', 'partner'],
      });

      return { reply: `${partnerName}. ${LOCKED.ask_city}` };
    }

    // ── asked_city: capture wedding city ────────────────────────────────────
    case 'asked_city': {
      if (await looksLikeDodge(inboundMessage, LOCKED.ask_city, anthropic)) {
        await supabase.from('couples').update({ onboarding_state: 'asked_budget' }).eq('id', couple.id);
        const reply = await composeDodgeTransition('city', LOCKED.ask_budget, anthropic);
        return { reply };
      }
      const city = inboundMessage.trim().slice(0, 80);

      await supabase.from('couples').update({
        wedding_city: city,
        onboarding_state: 'asked_budget',
      }).eq('id', couple.id);

      await supabase.from('notes').insert({
        couple_id: couple.id,
        content: `Wedding city: ${city}`,
        tags: ['onboarding', 'city'],
      });

      return { reply: `${city}. ${LOCKED.ask_budget}` };
    }

    // ── asked_budget: Haiku extracts integer rupees, then complete ──────────
    case 'asked_budget': {
      if (await looksLikeDodge(inboundMessage, LOCKED.ask_budget, anthropic)) {
        await supabase.from('couples').update({ onboarding_state: 'complete' }).eq('id', couple.id);
        return { reply: LOCKED.complete(user?.name) };
      }

      const budgetTotal = await extractBudget(inboundMessage, anthropic);
      const updates = { onboarding_state: 'complete' };
      if (budgetTotal) {
        updates.budget_total = budgetTotal;
        await supabase.from('notes').insert({
          couple_id: couple.id,
          content: `Budget: Rs ${budgetTotal.toLocaleString('en-IN')}`,
          tags: ['onboarding', 'budget'],
        });
      }

      await supabase.from('couples').update(updates).eq('id', couple.id);
      return { reply: LOCKED.complete(user?.name) };
    }

    default: {
      // Should never reach here once onboarding_state is 'complete' — the engine
      // routes those messages to the agent loop. Defensive fallback only.
      return { reply: `Something's off on my end. Message Dev at hello@thedreamwedding.in.` };
    }
  }
}

// ── State transition helper ──────────────────────────────────────────────────
// Given the current state and what was extracted at asked_date, decide
// which state to advance to. Mirrors vendor's "skip city if city extracted"
// pattern, generalised to all four fields.

function nextStateAfter(currentState, extracted) {
  if (currentState === 'asked_date') {
    // Phase 3.5: the wedding SHAPE comes right after the date. Skip it only if
    // she already volunteered the functions in her date message.
    if (!extracted.functions && !extracted.function_count) return 'asked_functions';
    if (!extracted.partner_name) return 'asked_partner';
    if (!extracted.wedding_city) return 'asked_city';
    if (!extracted.budget_total) return 'asked_budget';
    return 'complete';
  }
  return 'complete';
}

// ── Reply composer for asked_date advancement ────────────────────────────────

function replyForState(nextState, name, extracted) {
  // Build a contextual "Got it — X" confirmation prefix based on what we captured
  const confirms = [];
  if (extracted.wedding_date) confirms.push(extracted.wedding_date);
  if (extracted.wedding_city) confirms.push(extracted.wedding_city);
  if (extracted.partner_name) confirms.push(extracted.partner_name);
  if (extracted.budget_total) confirms.push(`Rs ${extracted.budget_total.toLocaleString('en-IN')}`);

  const prefix = confirms.length > 0 ? `Got it — ${confirms.join(', ')}. ` : '';

  switch (nextState) {
    case 'asked_functions': return `${prefix}${LOCKED.ask_functions}`;
    case 'asked_partner': return `${prefix}${LOCKED.ask_partner}`;
    case 'asked_city':    return `${prefix}${LOCKED.ask_city}`;
    case 'asked_budget':  return `${prefix}${LOCKED.ask_budget}`;
    case 'complete':      return LOCKED.complete(name);
    default:              return `${prefix}${LOCKED.ask_partner}`;
  }
}

// ── Date string → Postgres date helper ───────────────────────────────────────
// If Haiku returned an exact ISO date (YYYY-MM-DD), use it.
// If approximate ("February 2027", "winter 2027"), store first-of-month estimate
// to keep the column DATE-typed. Approximate phrasing is preserved in notes.

function parseDateForDb(dateString) {
  if (!dateString) return null;
  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  // "Month YYYY"
  const monthMatch = dateString.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthMatch) {
    const months = { january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8, september:9, october:10, november:11, december:12 };
    const m = months[monthMatch[1].toLowerCase()];
    if (m) return `${monthMatch[2]}-${String(m).padStart(2,'0')}-01`;
  }
  // "winter YYYY" / "summer YYYY" / "monsoon YYYY" — store first of season month
  const seasonMatch = dateString.match(/^(winter|spring|summer|monsoon|autumn|fall)\s+(\d{4})$/i);
  if (seasonMatch) {
    const seasons = { winter:12, spring:3, summer:5, monsoon:7, autumn:10, fall:10 };
    const m = seasons[seasonMatch[1].toLowerCase()];
    return `${seasonMatch[2]}-${String(m).padStart(2,'0')}-01`;
  }
  // Fallback: null, but the note still captures the raw string
  return null;
}

module.exports = { nextBrideOnboardingMessage, LOCKED, extractWeddingShape };
