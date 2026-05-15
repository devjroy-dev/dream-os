# B1 — Couple Identity + WhatsApp Onboarding
**Spec written:** 2026-05-15
**Estimated time:** 90-120 minutes (single session)
**Prerequisite:** Session 8.5a complete, Session 6.5 complete (+91 number live for vendors, +14787788550 freed for brides)

---

## Goal

A bride with a valid `couple_invites` token can text +14787788550 and complete onboarding. Her couple row, wedding details, and conversation are stored in dream-os Supabase. Admin (Swati) can generate tokens and see the couples list.

By end of B1:
- The bride product exists. Swati can onboard the first founding bride.
- A bride sees the BFF voice in WhatsApp.
- The data foundation is in place for B2 (Muse + Circle).

**Out of scope for B1:** Muse, Circle, tasks, receipts, vendor connections, Surprise Me, morning nudge, PWA work, silent onboarding via vendor number.

---

## Pre-flight checks

Before writing any code, verify:

1. `curl https://dream-os-production.up.railway.app` returns vendor side `{"status":"alive","service":"dream-os","version":"8.5"}`. Vendor side is healthy.
2. Confirm +14787788550 is currently NOT receiving live vendor traffic (Session 6.5 moved vendors to +91).
3. Confirm Twilio webhook for +14787788550 — note current target. Will be repointed at end of B1.
4. Confirm Railway can host a second service from the same repo. (`dream-wedding` service to be created, pointing at the same repo, but with a different start command targeting `src/brideIndex.js`.)
5. Confirm GOOGLE_API_KEY exists in Railway env (will be referenced but not used in B1; needed in B2).

---

## Migration: `0013_couples_onboarding.sql`

**Tables affected:**
- `couples` (existing — add columns)
- `couple_state` (new)
- `couple_invites` (new)

**SQL:**

```sql
-- 0013_couples_onboarding.sql
-- B1 — bride onboarding via couple_invites tokens
-- Adds couples.onboarding_state, couples.whatsapp_linked, couples.nudge_sent_at
-- Adds couple_state table (bride agent working memory)
-- Adds couple_invites table (Swati's invite-token control plane)

ALTER TABLE couples
  ADD COLUMN onboarding_state text DEFAULT 'new'
    CHECK (onboarding_state IN ('new', 'asked_partner', 'asked_date', 'asked_city', 'asked_budget', 'complete')),
  ADD COLUMN whatsapp_linked boolean NOT NULL DEFAULT false,
  ADD COLUMN nudge_sent_at timestamptz;

CREATE TABLE couple_state (
  couple_id uuid PRIMARY KEY REFERENCES couples(id) ON DELETE CASCADE,
  summary text,
  vendor_shortlist jsonb NOT NULL DEFAULT '[]',
  taste_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER couple_state_updated_at
  BEFORE UPDATE ON couple_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE couple_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  bride_name text NOT NULL,
  generated_by text NOT NULL DEFAULT 'swati',
  notes text,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  used_by_phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX couple_invites_token_idx ON couple_invites(token);
CREATE INDEX couple_invites_used_idx ON couple_invites(used);
CREATE INDEX couple_invites_created_at_idx ON couple_invites(created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE couple_state;
ALTER PUBLICATION supabase_realtime ADD TABLE couple_invites;
```

**Apply via Supabase SQL editor.** Verify with:

```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'couples' AND column_name IN ('onboarding_state', 'whatsapp_linked', 'nudge_sent_at');
SELECT count(*) FROM couple_state;  -- expect 0
SELECT count(*) FROM couple_invites;  -- expect 0
```

---

## Code: file-by-file

Build in this exact order. Test each file works before moving to next.

### 1. `src/lib/coupleIdentity.js` (new)

Shared helper. Provides:
- `ensureCoupleRow(phone, name)` — idempotent create-or-fetch. Returns couple_id. Used in B1 by bride agent (creates row when token validated); used in Session 9 by vendor agent (creates row on first TDW contact).
- `captureField(coupleId, fieldName, value)` — updates couples row for a single field. Validates field is in allowed list.

```javascript
// src/lib/coupleIdentity.js
// B1: shared couple identity helper
// Used by bride agent at B1 (post-token-validation)
// Used by vendor agent at Session 9 (silent onboarding on TDW contact)

import { supabase } from './supabase.js';

const CAPTURABLE_FIELDS = new Set([
  'partner_name', 'wedding_date', 'wedding_city',
  'budget_total', 'events_planned', 'planning_state'
]);

export async function ensureCoupleRow(phone, name = null) {
  // idempotent: returns existing couple_id if one exists for this phone, else creates
  const { data: existingUser } = await supabase
    .from('users').select('id').eq('phone', phone).maybeSingle();

  let userId = existingUser?.id;
  if (!userId) {
    const { data: newUser, error: ue } = await supabase
      .from('users').insert({ phone, name }).select('id').single();
    if (ue) throw ue;
    userId = newUser.id;
  } else if (name) {
    // backfill name if we have it and they don't
    await supabase.from('users').update({ name }).eq('id', userId).is('name', null);
  }

  const { data: existingCouple } = await supabase
    .from('couples').select('id').eq('user_id', userId).maybeSingle();

  if (existingCouple) return { coupleId: existingCouple.id, userId, created: false };

  const { data: newCouple, error: ce } = await supabase
    .from('couples').insert({
      user_id: userId,
      onboarding_state: 'new',
      whatsapp_linked: true
    }).select('id').single();
  if (ce) throw ce;

  await supabase.from('couple_state').insert({ couple_id: newCouple.id });

  return { coupleId: newCouple.id, userId, created: true };
}

export async function captureField(coupleId, fieldName, value) {
  if (!CAPTURABLE_FIELDS.has(fieldName)) {
    throw new Error(`captureField: ${fieldName} not in allowed list`);
  }
  const { error } = await supabase
    .from('couples').update({ [fieldName]: value }).eq('id', coupleId);
  if (error) throw error;
}
```

### 2. `src/agent/brideTools.js` (new)

Three tools. Patterns mirror `src/agent/tools.js`.

```javascript
// src/agent/brideTools.js
// B1: 3 tools — note_to_self, save_wedding_detail, add_event
// More added in B2/B3/B4 — see ROADMAP_BRIDE.md

import { supabase } from '../lib/supabase.js';
import { captureField } from '../lib/coupleIdentity.js';

export const BRIDE_TOOLS = [
  {
    name: 'note_to_self',
    description: 'Save a fact, preference, observation, or detail that should be remembered about this bride or her wedding. Use for anything the bride mentions that isn\'t a structured field (partner_name/date/city/budget). e.g. "Mom prefers gold", "fiancé is allergic to roses", "want to incorporate Bengali traditions".',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The note content, in concise factual form' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags e.g. ["family", "preferences"]' }
      },
      required: ['content']
    }
  },
  {
    name: 'save_wedding_detail',
    description: 'Save a structured field about the wedding. Use during onboarding and any time the bride mentions partner name, wedding date, wedding city, budget, or events planned.',
    input_schema: {
      type: 'object',
      properties: {
        field: { type: 'string', enum: ['partner_name', 'wedding_date', 'wedding_city', 'budget_total', 'events_planned'] },
        value: { description: 'The value. For wedding_date: YYYY-MM-DD. For budget_total: integer rupees. For events_planned: array of strings. Otherwise string.' }
      },
      required: ['field', 'value']
    }
  },
  {
    name: 'add_event',
    description: 'Add an event to the bride\'s calendar — fitting, trial, vendor meeting, family event, ceremony event, anything time-bound she mentions. Always specify a date.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short event title e.g. "Fitting at Studio Anvaya"' },
        event_date: { type: 'string', description: 'YYYY-MM-DD' },
        event_time: { type: 'string', description: 'HH:MM 24-hour, optional' },
        kind: { type: 'string', enum: ['fitting', 'trial', 'meeting', 'task', 'reminder', 'recce', 'family', 'ceremony', 'other'] },
        notes: { type: 'string', description: 'Optional. Location, contact, prep notes.' }
      },
      required: ['title', 'event_date', 'kind']
    }
  }
];

// Tool executors. Each returns { ok: bool, result: object } for the engine.

export async function executeBrideTool(toolName, input, context) {
  const { coupleId, conversationId } = context;
  switch (toolName) {
    case 'note_to_self':
      return await execNoteToSelf(input, coupleId, conversationId);
    case 'save_wedding_detail':
      return await execSaveWeddingDetail(input, coupleId);
    case 'add_event':
      return await execAddEvent(input, coupleId);
    default:
      return { ok: false, result: { error: `Unknown tool: ${toolName}` } };
  }
}

async function execNoteToSelf({ content, tags = [] }, coupleId, conversationId) {
  // B1 uses existing notes table (vendor-side). couple_id column added in B3 migration 0015.
  // For B1 we store with vendor_id NULL and use conversation_id as the join key.
  // **TEMP:** notes table needs couple_id column. Adding this in 0013 to avoid TEMP comment.
  const { error } = await supabase.from('notes').insert({
    couple_id: coupleId,
    conversation_id: conversationId,
    content,
    tags
  });
  if (error) return { ok: false, result: { error: error.message } };
  return { ok: true, result: { saved: true, content } };
}

async function execSaveWeddingDetail({ field, value }, coupleId) {
  try {
    await captureField(coupleId, field, value);
    return { ok: true, result: { field, value, saved: true } };
  } catch (e) {
    return { ok: false, result: { error: e.message } };
  }
}

async function execAddEvent({ title, event_date, event_time, kind, notes }, coupleId) {
  // events table will get couple_id column in B3 migration 0015.
  // For B1 — add couple_id column to events in migration 0013 instead (additive).
  const { data, error } = await supabase.from('events').insert({
    couple_id: coupleId,
    title,
    event_date,
    event_time: event_time || null,
    kind,
    notes: notes || null,
    state: 'upcoming'
  }).select('id, title, event_date').single();
  if (error) return { ok: false, result: { error: error.message } };
  return { ok: true, result: data };
}
```

**Schema update needed:** Migration 0013 must ALSO add `couple_id` columns to `notes` and `events` tables (nullable, additive). This avoids TEMP comments in code and lets B1 use these tables. Update 0013 SQL:

```sql
-- additions to 0013_couples_onboarding.sql
ALTER TABLE notes
  ADD COLUMN couple_id uuid REFERENCES couples(id) ON DELETE CASCADE;

ALTER TABLE events
  ADD COLUMN couple_id uuid REFERENCES couples(id) ON DELETE CASCADE;

CREATE INDEX notes_couple_id_idx ON notes(couple_id);
CREATE INDEX events_couple_id_idx ON events(couple_id);
```

Vendor-side `notes` and `events` continue using `vendor_id`. Bride-side uses `couple_id`. Both nullable, mutually exclusive in practice. At Session 9 convergence, consider a CHECK constraint enforcing exactly one is set.

### 3. `src/agent/brideSystemPrompt.js` (new)

See separate file `src/agent/brideSystemPrompt.js` shipped with this spec. Locked at B1.

### 4. `src/agent/brideOnboarding.js` (new)

State machine for onboarding. Mirrors `src/agent/onboarding.js` pattern.

```javascript
// src/agent/brideOnboarding.js
// B1: bride onboarding state machine
// States: new → asked_partner → asked_date → asked_city → asked_budget → complete

const TOKEN_REGEX = /^([A-Z]+)-([A-Z0-9]{6})$/;

const DEAD_END = "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in";

const GREETINGS = {
  // Sent once token is validated, at start of asked_partner
  initial: (name) => `Hi ${name} — welcome to The Dream Wedding. So glad you're here. Tell me about your partner.`,

  // Subsequent onboarding prompts (the agent composes these via system prompt, but reference here)
  asked_date: "When's the big day? Doesn't have to be exact — even a season works.",
  asked_city: "Where's the wedding happening?",
  asked_budget: "Roughly what's your budget? No pressure — even a ballpark helps me help you.",

  complete: (name) => `Perfect, ${name} — you're all set. I'll be here whenever you need me. Forward me anything you want to remember, ask me to schedule things, or just think out loud. Most things I can do, you'll discover as we go.`
};

export function parseToken(firstMessage) {
  // Extract token from first word of message (case-insensitive). Returns the upper-cased token or null.
  const firstWord = (firstMessage || '').trim().split(/\s+/)[0];
  if (!firstWord) return null;
  const candidate = firstWord.toUpperCase();
  return TOKEN_REGEX.test(candidate) ? candidate : null;
}

export async function validateToken(supabase, token) {
  const { data, error } = await supabase
    .from('couple_invites')
    .select('id, token, bride_name, used')
    .eq('token', token)
    .maybeSingle();
  if (error || !data) return { valid: false, reason: 'not_found' };
  if (data.used) return { valid: false, reason: 'already_used' };
  return { valid: true, invite: data };
}

export async function markTokenUsed(supabase, inviteId, phone) {
  await supabase.from('couple_invites').update({
    used: true,
    used_at: new Date().toISOString(),
    used_by_phone: phone
  }).eq('id', inviteId);
}

export { DEAD_END, GREETINGS };
```

### 5. `src/agent/brideEngine.js` (new)

The agentic loop. Mirrors `src/agent/engine.js` with three differences:
1. No terminal reply tool (no `respond_to_bride`)
2. No first-question post-processing strip
3. Token validation as the first gate in `handleBrideMessage`

Full file structure:

```javascript
// src/agent/brideEngine.js
// B1: bride agentic loop
// Differences from engine.js:
//   - No terminal reply tool. The final assistant text message IS the reply.
//   - No first-question post-processing strip. Allows breath.
//   - Token validation gate before any agent work.

import { supabase } from '../lib/supabase.js';
import { runWithModelRouting } from '../lib/models.js';  // existing helper from 8.1/8.2
import { ensureCoupleRow } from '../lib/coupleIdentity.js';
import { STATIC_SYSTEM_PROMPT, buildDynamicContext } from './brideSystemPrompt.js';
import { BRIDE_TOOLS, executeBrideTool } from './brideTools.js';
import { parseToken, validateToken, markTokenUsed, DEAD_END, GREETINGS } from './brideOnboarding.js';

const MAX_ITERATIONS = 5;

export async function handleBrideMessage({ phone, body, twilioSid }) {
  // 1. Check if this phone has a couples row already
  const { data: existingUser } = await supabase
    .from('users').select('id, name').eq('phone', phone).maybeSingle();

  let coupleId, isNewBride = false, brideName;

  if (existingUser) {
    const { data: couple } = await supabase
      .from('couples').select('id').eq('user_id', existingUser.id).maybeSingle();
    if (couple) {
      coupleId = couple.id;
      brideName = existingUser.name;
    }
  }

  // 2. If no couple yet, this is a first-message. Token gate.
  if (!coupleId) {
    const token = parseToken(body);
    if (!token) return { reply: DEAD_END };

    const { valid, reason, invite } = await validateToken(supabase, token);
    if (!valid) return { reply: DEAD_END };

    // Token valid — create users + couples + couple_state rows
    const { coupleId: newCoupleId, userId } = await ensureCoupleRow(phone, invite.bride_name);
    coupleId = newCoupleId;
    brideName = invite.bride_name;
    isNewBride = true;

    await markTokenUsed(supabase, invite.id, phone);
  }

  // 3. Ensure conversation exists (kind = couple_self)
  const conversation = await ensureCoupleSelfConversation(coupleId, phone);

  // 4. Log inbound message
  await logMessage({
    conversationId: conversation.id,
    direction: 'inbound', body, twilioSid
  });

  // 5. If new bride, send the initial greeting (no LLM call needed — locked text)
  if (isNewBride) {
    const greeting = GREETINGS.initial(brideName);
    await supabase.from('couples').update({ onboarding_state: 'asked_partner' }).eq('id', coupleId);
    await logMessage({
      conversationId: conversation.id, direction: 'outbound',
      body: greeting, sentBy: 'agent', model: 'system'
    });
    return { reply: greeting };
  }

  // 6. Run the agentic loop
  const reply = await runLoop({ coupleId, conversationId: conversation.id, body });

  await logMessage({
    conversationId: conversation.id, direction: 'outbound',
    body: reply, sentBy: 'agent'
  });

  return { reply };
}

async function runLoop({ coupleId, conversationId, body }) {
  const dynamicContext = await buildDynamicContext(coupleId);
  const history = await loadConversationHistory(conversationId);

  let messages = [
    ...history,
    { role: 'user', content: body }
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await runWithModelRouting({
      systemBlocks: [STATIC_SYSTEM_PROMPT, dynamicContext],
      tools: BRIDE_TOOLS,
      messages,
      // Three-tier routing: classifier decides Haiku/Sonnet/Gemini
      // Inherits from src/lib/models.js — caller doesn't choose
    });

    if (response.stop_reason === 'end_turn') {
      // Final reply — return the assistant text
      const textBlock = response.content.find(b => b.type === 'text');
      return textBlock?.text || "I'm here. What's up?";
    }

    if (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter(b => b.type === 'tool_use');
      const toolResults = await Promise.all(toolCalls.map(async tc => {
        const result = await executeBrideTool(tc.name, tc.input, { coupleId, conversationId });
        return { type: 'tool_result', tool_use_id: tc.id, content: JSON.stringify(result.result) };
      }));
      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults }
      ];
      continue;
    }

    // Unknown stop reason — exit
    break;
  }

  // Hit MAX_ITERATIONS without an end_turn — return a graceful fallback
  return "Give me a moment — I'll get back to you.";
}

async function ensureCoupleSelfConversation(coupleId, phone) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('counterparty_phone', phone)
    .eq('kind', 'couple_self')
    .maybeSingle();
  if (existing) return existing;

  const { data: created } = await supabase.from('conversations').insert({
    counterparty_phone: phone,
    kind: 'couple_self',
    state: 'planning',
    mode: 'auto'
  }).select('id').single();
  return created;
}

async function loadConversationHistory(conversationId, limit = 10) {
  const { data } = await supabase
    .from('messages')
    .select('direction, body')
    .eq('conversation_id', conversationId)
    .not('body', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []).reverse()
    .filter(m => m.body && m.body.trim().length > 0)
    .map(m => ({ role: m.direction === 'inbound' ? 'user' : 'assistant', content: m.body }));
}

async function logMessage({ conversationId, direction, body, twilioSid, sentBy, model }) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    direction,
    channel: 'whatsapp',
    body,
    twilio_sid: twilioSid,
    sent_by: sentBy || (direction === 'inbound' ? 'couple' : 'agent'),
    model: model || null
  });
}
```

### 6. `src/brideIndex.js` (new)

Webhook server entry point. Mirrors `src/index.js` but minimal.

```javascript
// src/brideIndex.js
// B1: bride webhook server, Railway service "dream-wedding"

import express from 'express';
import twilio from 'twilio';
import { handleBrideMessage } from './agent/brideEngine.js';
import { sendWhatsApp } from './lib/sendWhatsApp.js';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const VERSION = '0.9.0-b1';

app.get('/', (req, res) => {
  res.json({ status: 'alive', service: 'dream-wedding', version: VERSION });
});

app.post('/webhook/whatsapp', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  res.type('text/xml');

  try {
    const from = req.body.From;  // e.g. "whatsapp:+918757788550"
    const phone = from.replace('whatsapp:', '');
    const body = (req.body.Body || '').trim();
    const twilioSid = req.body.MessageSid;

    // Empty-message guard (inherited from vendor side Bug #1 fix)
    if (!body && (req.body.NumMedia && req.body.NumMedia > 0)) {
      res.send(twiml.toString());
      await sendWhatsApp({
        to: phone,
        body: "I'll be able to process images soon — for now, please type your message and I'll help."
      });
      return;
    }
    if (!body) {
      res.send(twiml.toString());
      return;
    }

    res.send(twiml.toString());  // ack to Twilio immediately

    const { reply } = await handleBrideMessage({ phone, body, twilioSid });
    if (reply) {
      await sendWhatsApp({ to: phone, body: reply });
    }
  } catch (e) {
    console.error('[bride-webhook-error]', e);
    res.send(twiml.toString());
  }
});

app.post('/webhook/twilio-status', async (req, res) => {
  // Reuse vendor side handler shape — log status updates
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[bride-server] listening on ${PORT}`);
});
```

### 7. Admin pages

Three routes under existing admin shell. Reuse existing auth middleware.

- `src/admin/couples/invites.js` — GET shows form + table of invites; POST generates new token
- `src/admin/couples/list.js` — GET shows couples list with filter/search
- `src/admin/couples/[id].js` — GET shows couple detail (profile + conversation history)

Token generation logic:

```javascript
// In src/admin/couples/invites.js POST handler
import crypto from 'crypto';

function generateToken(brideName) {
  const namePart = brideName.split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `${namePart}-${randomPart}`;
}

// On submit:
const token = generateToken(brideName);
await supabase.from('couple_invites').insert({
  token, bride_name: brideName, notes
});
const waLink = `https://wa.me/14787788550?text=${encodeURIComponent(token)}`;
// Display token + waLink to Swati for copy
```

### 8. Railway service "dream-wedding"

In Railway dashboard:
1. Create new service from same repo (`devjroy-dev/dream-os`)
2. Start command: `node src/brideIndex.js`
3. Env vars (some shared, some new):
   - `BRIDE_TWILIO_WHATSAPP_NUMBER = whatsapp:+14787788550`
   - Same `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` as vendor service
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` — shared with vendor
4. Deploy. Verify `curl https://dream-wedding-production.up.railway.app/` returns the alive JSON.

### 9. Twilio webhook flip

In Twilio console:
1. WhatsApp Senders → +14787788550 → Configuration
2. Incoming webhook → `https://dream-wedding-production.up.railway.app/webhook/whatsapp`
3. Status callback → `https://dream-wedding-production.up.railway.app/webhook/twilio-status`
4. Save

Before flipping: confirm with founder that the tdw-2 backend currently consuming this webhook is OK to lose access. The +14787788550 number is being permanently moved to dream-os. Tdw-2 backend stops receiving WhatsApp messages from this number.

---

## Smoke tests (sequential, run after deploy)

### Test 1: Health check
- `curl https://dream-wedding-production.up.railway.app/` → `{"status":"alive","service":"dream-wedding","version":"0.9.0-b1"}`

### Test 2: Token generation
- Visit `thedreamai.in/admin/couples/invites` (or current admin URL)
- Generate token: bride_name = "Test One"
- Expected: token like `TESTONE-A8F2K9`, wa.me link displayed
- Verify in Supabase: `couple_invites` row exists, used=false

### Test 3: Dead-end for first-message without token
- From Dev's phone, send "hello" to +14787788550 (fresh — no prior history with this number)
- Expected reply: "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in"
- Verify: no couples row created, no messages logged

### Test 4: Token validation + greeting
- Tap the wa.me link from Test 2 with a different test phone (or Swati's phone)
- WhatsApp opens with `TESTONE-A8F2K9` pre-filled. Send.
- Expected: greeting "Hi Test One — welcome to The Dream Wedding..." in BFF voice
- Verify: users row, couples row (onboarding_state = `asked_partner`), couple_state row, conversation kind=`couple_self`, both messages logged
- Verify: couple_invites row updated — used=true, used_at filled, used_by_phone filled

### Test 5: Same token tapped again
- From a third phone, tap the same wa.me link from Test 2. Send.
- Expected: dead-end message
- Verify: no new rows created

### Test 6: Onboarding flow
- Continue conversation from Test 4
- Reply: "My partner is Rohit, we're getting married in February in Goa, budget is around 35L"
- Expected: agent uses BFF voice, calls save_wedding_detail for each field, confirms naturally
- Verify: couples.partner_name, wedding_date (approximate Feb 2027), wedding_city = Goa, budget_total = 3500000 (or similar)
- Verify: onboarding_state advances through fields, ends at `complete`
- Verify: completion message uses BFF voice ("Perfect, Test One — you're all set...")

### Test 7: Calendar
- Send: "I have a fitting at Studio Anvaya next Saturday at 11am"
- Expected: agent calls add_event, replies confirming naturally
- Verify: events row, couple_id set, title contains "Studio Anvaya", event_date is next Saturday, event_time 11:00, kind = fitting

### Test 8: Note
- Send: "Mom thinks I should wear pastels, not the gold lehenga she always pushes"
- Expected: agent calls note_to_self, replies with a touch of wit ("Mom's playing both sides. Saved it.")
- Verify: notes row, couple_id set, content captured, tags include something like "family" or "preferences"

### Test 9: BFF voice spot-check
- Send: "I'm overwhelmed, I don't know where to start"
- Expected: response is NOT therapy voice. Is concrete and forward-moving. Something like: "Same energy as every bride. Let's pick one thing — what's bugging you most this week?"
- This is qualitative — Dev/Swati judgment call. If voice is off, iterate brideSystemPrompt.js immediately, redeploy.

### Test 10: Vendor side regression check
- From Dev's vendor phone (+918757788550), send a message to +91 7982159047 (vendor number)
- Verify: vendor agent responds as before. Bride-side build did not affect vendor side.

---

## Deferred / known limits at end of B1

- No Muse, Circle, tasks, receipts, vendor connections (later B-sessions)
- No morning nudge (B3)
- No /surprise command (B4)
- No silent onboarding via vendor TDW links (Session 9)
- Image messages return placeholder text. Real handling in B2 (Muse) + B3 (receipts)
- No PWA work — public landing remains tdw-2's existing page

---

## Closing the session

Once all 10 smoke tests pass:

1. Update `docs/HANDOVER_BRIDE.md` — fully rewrite with what shipped, what was tested, known gaps, first thing for next session (B2)
2. Update `docs/SCHEMA.md` — add couple_invites, couple_state, columns added to couples/notes/events
3. Update `docs/ROADMAP_BRIDE.md` — mark B1 done, note any deviations from this spec
4. Update `docs/ROADMAP.md` — only if any vendor fires came up
5. Commit all four:
   ```
   git add docs/ src/ db/
   git commit -m "B1: bride agent + couple_invites + admin couples — complete"
   git push
   ```
6. Bump version to 0.9.0-b1
7. Session done.

---

## Risks for B1

1. **Webhook flip race:** if Twilio webhook is repointed before Railway service is deployed and verified healthy, brides taking the flow during that gap get failures. Mitigation: deploy and verify Railway service first, then flip webhook last.

2. **Token regex too strict:** some bride names contain spaces or special characters. Solution above strips non-A-Z and uses only the first word's uppercase letters. Verify on names like "Mary Anne" → `MARYANNE-XXXXXX`, "D'Cunha" → `DCUNHA-XXXXXX`.

3. **Conversation history shape mismatch:** vendor side has been tuned over 8 sessions. The bride engine reuses the same `messages` table but with different kind/sent_by patterns. Possible mismatch with how engine.js loads history. Confirmed by code review the loader filters work for both kinds.

4. **Three-tier routing not yet tuned:** B1 inherits `runWithModelRouting` from vendor side. Classifier was trained on vendor messages. Bride messages may route differently than expected. Acceptable for B1 — monitor cost tracking, tune in B2 if needed.

5. **Onboarding flow conversational, not scripted:** The state machine moves on `couples.onboarding_state` field updates, which the LLM controls via save_wedding_detail. If LLM doesn't call save_wedding_detail, state never advances. Mitigation: brideSystemPrompt.js has a strong rule that during onboarding, every relevant detail must call save_wedding_detail. Smoke test verifies this.

6. **+14787788550 has historical messages from vendor flows:** the conversation history loader pulls last 10 messages by conversation_id, which is bride-specific. No leak risk. But the `users` table may have rows from prior vendor traffic — phone numbers that look like brides but are actually past vendor counterparties. The phone-match logic will treat them as known users and skip token validation. Mitigation: before flipping webhook, audit users for any phones associated only with this number — verify they're not real bride candidates.
