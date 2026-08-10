// engine.js — the agentic loop
// Session 4: adds create_lead, list_leads, update_lead_state tool handlers
// Session 5.5: adds runCoupleAgenticTurn for couple_thread conversations

const { buildDynamicContext, STATIC_SYSTEM_PROMPT } = require('./systemPrompt');
const { buildCoupleSystemPrompt } = require('./coupleSystemPrompt');
const { nextOnboardingMessage }   = require('./onboarding');
const { TOOLS }                   = require('./tools');
const { buildInvoiceMessage }     = require('../lib/invoiceMessage');
const { waNumberFor }             = require('../lib/waNumbers');   // F5 rider
const { generateInvoicePdf }     = require('../lib/invoicePdf');
const { formatRs }               = require('../lib/format');
// TDW_08 P5 Phase 4 — THE FACADE JOIN (FORK 3(a), CE-ruled). `MODEL_HAIKU`,
// `MODEL_SONNET`, `calculateCost` and `COMPLEXITY` were selected here and read
// NOWHERE in this file except `MODEL_HAIKU` at the couple lane's one model line,
// which now resolves through the router. Derived by command at bfcb88e: three of
// the four were ALREADY selected-but-unread — each occurred exactly once, in the
// import itself. The whole selection is retired rather than trimmed to a name
// nothing reads. `models.js` keeps its exports: `brideEngine.js:36` is a real
// reader of MODEL_SONNET and is untouched by this sitting.
const { resolveModel }  = require('../lib/modelRouter');
const { llmCreate }     = require('../lib/llm');
const { readLaneFlag }  = require('../lib/laneFlags');
const { resolveOrCreateClient } = require('../lib/clients');
const { sendWhatsApp }          = require('../lib/whatsapp');
const { captureField }          = require('../lib/coupleIdentity');
const { getReturningBrideIntent } = require('../lib/intentExtractor');
const { buildVendorSnapshot, logActivity, fetchRecentActivity, formatActivityBlock } = require('../lib/vendor/snapshot');
const { buildEnquiryEnrichment } = require('../lib/vendor/enquiryEnrichment');

// Tools that mutate the DB on the WhatsApp surface. Used to feed the
// cross-surface activity log (Phase 1.5). Read-only tools (list_*, query_*,
// get_my_tdw_link, hot_dates_context, respond_to_vendor, clarify) are excluded.
const WA_MUTATING_TOOLS = new Set([
  'note_to_self', 'create_lead', 'update_lead_state', 'update_conversation_state',
  'create_event', 'update_event_state', 'commit_event_proposals',
  'create_invoice', 'record_payment', 'log_expense', 'add_client',
  'update_routing_handle', 'update_invoice_prefix', 'send_to_couple',
]);

const MAX_ITERATIONS = 5;
const HISTORY_LIMIT  = 5;
// WhatsApp vendor session boundary: vendor's pace, short bursts. 10 minutes.
const VENDOR_SESSION_IDLE_MS = 10 * 60 * 1000;

// ── TDW_06 · F-06.151 / F-06.152 — THE HISTORY BUILDER'S TWO CURES ───────────
//
// F-06.151 (MERGE, NEVER DROP). The reduce below used to keep the FIRST of any
// consecutive same-role run and DISCARD the rest. The Anthropic API's
// alternation constraint is real, so deleting the reduce is not a lawful arm —
// the cure is to MERGE the run into one turn. Live cost of the old shape: any
// two consecutive outbounds on a couple thread already collapsed, and a
// vendor-relayed message written immediately after one of Eliza's own replies
// (the 2026-08-08 shape) never reached her context at all.
//
// F-06.152 (PROVENANCE SURVIVES). `sent_by` was fetched at the select and then
// destroyed by the role map, so a message relayed on the vendor's behalf was
// byte-indistinguishable from Eliza's own prose and she would believe she had
// quoted the figure herself. The marker is derived AT ASSEMBLY and prefixed IN
// MEMORY ONLY.
//
// [F-06.85 class — THIS LAW NAMES ITS MECHANISM. Two mechanical facts hold the
//  paragraph above true, and if either moves this comment becomes false:
//  (1) `MERGE_DELIMITER` contains at least one character OUTSIDE the class
//      `[\s,\-/]`. That class is `hasDayAdjacentToMonth`'s separator set at
//      `src/agent/datePrecision.js` (symbol `hasDayAdjacentToMonth`). Merged
//      USER turns are joined by this delimiter and the joined string reaches
//      `resolveWeddingDate` through `coupleOwnWords` below. A whitespace-only
//      delimiter would let "...thinking December" + "12 guests confirmed" mint
//      a DAY precision the bride never spoke — the provenance-hold class,
//      arriving through the front door of this very cure. `"\n"` alone is
//      INSIDE `\s` and is NOT safe. The `|` is what makes it inert.
//  (2) The provenance marker is prefixed onto `content` IN MEMORY and is never
//      written to `public.messages.body` and never transmitted. The durable row
//      and the wire stay byte-untouched. If a writer ever persists the marker,
//      the audit row stops being the bride's or the vendor's actual bytes.
//  The marker is NATURAL-LANGUAGE ATTRIBUTION and deliberately NOT a bracketed
//  system label: F-06.52 convicted bracket-machinery in context (the model
//  echoed "[Donna's snapshot]" back as its own words, cured at CE-78). On a
//  relayed message, attribution read aloud is a FEATURE — it is true, and it is
//  what the bride should hear.]
const MERGE_DELIMITER = '\n|\n';

// The `sent_by` value a vendor→bride relay writes. NEW vocabulary this sitting.
// Census of the live register at 16a4071 (`git grep -hoE "sent_by: *'[a-z_]+'"`):
// agent(26) · couple(10) · system(4) · vendor(2) · bride(1). `agent` is what
// `src/lib/vendor/replyToCouple.js` writes today (symbol `replyToCouple`) and it
// is also what Eliza's own prose writes — THAT COLLISION IS F-06.152. The relay
// takes its own value so the two are separable at the row, not by inference.
// THE WRITER ARRIVES AT THE HAND SITTING; this sitting mints the vocabulary and
// the reader only.
const RELAY_SENT_BY = 'vendor_relay';

// Founder-vetoed attribution. Bytes are copy-class and carry a veto.
const RELAY_ATTRIBUTION_PREFIX = 'Passed on from the vendor: ';

// Attribution applied at assembly. Anything that is not a relay row is returned
// byte-identical, so every pre-existing history shape is unchanged.
function markRelayProvenance(row) {
  const body = row.body || '';
  if (!body) return '';
  if (row.sent_by !== RELAY_SENT_BY) return body;
  return `${RELAY_ATTRIBUTION_PREFIX}${body}`;
}

// F-06.151's cure. Same-role runs MERGE; role boundaries still split, so the
// API's alternation constraint is preserved exactly as before.
function mergeSameRole(acc, msg) {
  if (acc.length === 0) return [msg];
  const last = acc[acc.length - 1];
  if (last.role === msg.role) {
    return [
      ...acc.slice(0, -1),
      { role: last.role, content: `${last.content}${MERGE_DELIMITER}${msg.content}` },
    ];
  }
  return [...acc, msg];
}

// ── Vendor agentic turn — DELETED AT ARC M5 (C6 / F-05.44, CE ruling R-M5-3) ──
// `runAgenticTurn` lived here, 43-374, with ZERO callers anywhere in src/**. The
// live vendor wire is the TS engine (vendorInbound.js -> runTurn), so this JS twin
// had been unreachable since before E-1. The census closed one level deeper than the
// charter knew: the ambiguity ask-gate the charter protected BY NAME lived INSIDE
// this function, and so did the only call site of classifyVendorMessage — "a real
// consumer" was true in the code sense and false in the reachability sense.
// classifier.js SURVIVES INTACT as a defused island (R-M5-3): the ambiguity logic is
// the only home that logic has anywhere, and a JS-wire revival is imaginable. Whoever
// revives this function will find its classifier waiting, uncalled and whole.

// ── Couple agentic turn ───────────────────────────────────────────
// Runs on couple_thread conversations.
// Collects event details, updates lead, notifies vendor with summary.
// ── BLOCK 06 M-0 · A-dedupe(α) — `rawInboundBody`, OPTIONAL AND DEFAULTING ────
// The history de-dupe at :83 exists to stop the message-in-hand appearing TWICE
// in the model's context: once as the audit row the door just wrote, once as the
// user turn appended at :135. It compared against `inboundMessage` — which was
// true only while `inboundMessage` and the stored row's body were the same
// string. F-05.60's substitution broke that silently (body='TDW-X what's your
// rate', inboundMessage='hi' → no match → her real sentence leaked back in, which
// is the ONLY reason the falsified turns still answered correctly: two defects
// cancelling). A1's strip does NOT restore the match — it replaces one mismatch
// with another — so the filter is given the value it was always asking for.
// DEFAULTS to `inboundMessage`: every caller that passes the body unchanged
// (vendorInbound :464/:572/:792) is byte-identical, asserted at the bench.
async function runCoupleAgenticTurn({ vendor, vendorUser, conversation, couplePhone, coupleId, inboundMessage, rawInboundBody, supabase, anthropic }) {
  // The row the door wrote holds what she ACTUALLY sent (γ refused: the audit row
  // is never rewritten to match a derived value). This is the string to filter on.
  const inboundBodyAsStored = (rawInboundBody === undefined || rawInboundBody === null)
    ? inboundMessage
    : rawInboundBody;

  // ── Load conversation history (session-bounded) ───────────────────
  const coupleSessionCutoff = new Date(Date.now() - VENDOR_SESSION_IDLE_MS).toISOString();

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('direction, body, sent_by, created_at')
    .eq('conversation_id', conversation.id)
    .gte('created_at', coupleSessionCutoff)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT + 1);

  const history = (recentMessages || [])
    .reverse()
    .filter(m => m.body !== inboundBodyAsStored || m.direction !== 'inbound')
    .filter(m => m.body && m.body.trim().length > 0)
    .slice(-HISTORY_LIMIT)
    .map(m => ({
      // F-06.85's premise below (search this file for `F-06.85`) is conditioned
      // on THIS ternary being the sole role source. It is unchanged: provenance
      // rides `content`, never `role`, so a relayed row stays `assistant` and
      // stays excluded from `coupleOwnWords`. Do not move provenance here.
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: markRelayProvenance(m),   // F-06.152 — in memory only
    }))
    .reduce(mergeSameRole, []);          // F-06.151 — merge, never drop

  // Detect returning bride — lead already exists for (vendor_id, couplePhone)
  const { data: existingLeadForCouple } = await supabase
    .from('leads')
    .select('id, name, intent_summary, intent_summary_at')
    .eq('vendor_id', vendor.id)
    .eq('phone', couplePhone)
    .maybeSingle();

  const isReturningBride = !!existingLeadForCouple?.name;
  const leadName = existingLeadForCouple?.name || null;

  // ── BLOCK 06 M-0 · D1-lite — the name this turn RESOLVED, handed back ────────
  // The capture branch computes `resolvedName` inside the tool loop and nothing
  // outside that branch could see it, so the door's binder was opened nameless
  // ('Dream Wedding enquiry', enquiryBinder.js:79) on every enquiry — structurally,
  // not by accident. Lifted to turn scope and returned; the door names the binder
  // with it AFTER the turn, when a name exists to give.
  let capturedLeadName = null;

  // Phase 3.5 Layer 1: inherit the bride's wedding SHAPE if she has a couple
  // record (from bride onboarding). Linked by phone via users. Many enquiring
  // brides won't have onboarded — then shape is null and the category profile
  // simply gathers what it needs fresh. Best-effort; never blocks the turn.
  let weddingShape = null;
  let knownBrideName = null;
  try {
    const { data: coupleUser } = await supabase
      .from('users').select('id, name').eq('phone', couplePhone).maybeSingle();
    if (coupleUser) {
      if (coupleUser.name && coupleUser.name.trim()) knownBrideName = coupleUser.name.trim();
      const { data: coupleRec } = await supabase
        .from('couples')
        .select('wedding_date, wedding_city, function_count, wedding_days, functions, budget_total')
        .eq('user_id', coupleUser.id)
        .maybeSingle();
      if (coupleRec) weddingShape = coupleRec;
    }
  } catch (e) {
    console.warn('[couple-agent] wedding-shape/name lookup failed (non-fatal):', e.message);
  }

  console.log(`[couple-agent] isReturningBride=${isReturningBride} phone=${couplePhone}${leadName ? ` name=${leadName}` : ''}`);

  // ── THE LANE GATE (FORK 5(a), CE-ruled) ─────────────────────────────────────
  // ONE gate, inside the turn, because `vendorInbound.js` reaches this function
  // from FOUR sites (:565, :675, :803, :948) and four gates is four drifts. The
  // file's own comment at :548 records the last sitting that learned this here:
  // "THE CHARTER NAMED ONE SITE. THE WORLD WAS A SET OF FOUR."
  //
  // F-08.56 — the lane-enable flag; see `src/lib/laneFlags.js` for the law. OFF
  // is yesterday's lane, byte for byte: `buildCoupleSystemPrompt` with
  // `useEliza:false` is proven identical to the pre-cure composer across 112
  // permutations. The flip is one admin_config row and sixty seconds, and it is
  // the founder's hand.
  const useEliza = await readLaneFlag(supabase, 'couple.eliza_enabled');
  console.log(`[couple-agent] lane=${useEliza ? 'eliza' : 'legacy'}`);

  const systemPrompt = buildCoupleSystemPrompt({ vendor, vendorUser, isReturningBride, leadName, weddingShape, knownBrideName, useEliza });

  const messages = [
    ...history,
    { role: 'user', content: inboundMessage },
  ];

  // ── Agentic loop ────────────────────────────────────────────────
  let iterations  = 0;
  let finalReply  = null;
  let leadCaptured = null;
  const toolCallsAudit = [];

  const COUPLE_TOOLS = [
    {
      name: 'capture_couple_lead',
      description: 'Save the collected event details as a structured lead. Call this once you have occasion, date/city, and budget. After calling this, call respond_to_couple to close the conversation.',
      input_schema: {
        type: 'object',
        properties: {
          occasion: { type: 'string', description: 'Type of event e.g. wedding, birthday, corporate' },
          event_date: { type: 'string', description: 'Date in YYYY-MM-DD or approximate e.g. 2027-03-01' },
          event_city: { type: 'string', description: 'City where the event is happening' },
          budget_min: { type: 'number', description: 'Minimum budget in Rs e.g. 150000' },
          budget_max: { type: 'number', description: 'Maximum budget in Rs' },
          name: { type: 'string', description: 'Couple or person name if shared' },
          function_count: { type: 'number', description: 'Number of wedding functions if she told you (e.g. mehendi+sangeet+wedding+reception = 4). Omit if already known/registered.' },
          wedding_days: { type: 'number', description: 'How many days the wedding spans, if she told you.' },
          functions: { type: 'string', description: 'Comma-separated function list she mentioned, e.g. "mehendi, sangeet, wedding, reception". Omit if already known.' },
          notes: { type: 'string', description: 'Anything else worth capturing' },
        },
        required: [],
      },
    },
    {
      name: 'respond_to_couple',
      description: 'Send a reply to the couple. Plain text, warm, conversational. One question at a time. Maximum 2 sentences.',
      input_schema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The message to send to the couple.' },
          conversation_done: { type: 'boolean', description: 'Set to true when you have collected all details and closed the conversation warmly.' },
        },
        required: ['message'],
      },
    },
  ];

  // ── Model: the Haiku ceiling, now RESOLVED rather than typed ──────
  // F-05.32 + E-3: this lane's ceiling is Haiku. The classifier call that stood here
  // fed NOTHING but the log token below (M5 / C6) — a paid Haiku round-trip per turn
  // buying one word of console output. Deleted; the turn is untouched.
  //
  // TDW_08 P5 Phase 4 (FORK 3(a)): the literal became a route. `0112` seeds
  // `model.wa_couple.default` to anthropic/haiku and `modelRouter.DEFAULTS`
  // matches, so a pre-seed deploy routes IDENTICALLY. The 60-second DeepSeek flip
  // is one admin_config row.
  //
  // ⚠ AND THE CEILING IS NOW ENFORCED ONE LAYER UP, WHICH IS F-08.84. Before this
  // join, "Haiku on this wire" was a compile-time fact. A route is an
  // admin_config row, and `guardKeys` guards PROVIDERS and KEYS, never MODELS —
  // so the join would have opened a config-time door through a compile-time
  // ceiling. `modelRouter`'s per-surface ALLOW-SET closes it: a resolved model
  // outside `wa_couple`'s set is refused loudly and falls to the surface's
  // default. `b05_f0532_haiku_ceiling_bench`'s couple-agent cell was re-based to
  // assert the RESOLVED ROUTE rather than the literal.
  const route       = await resolveModel(supabase, 'wa_couple', 'default');
  const modelToUse  = route.model;
  console.log(`[couple-agent] model selected: ${modelToUse} (provider=${route.provider})`);

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await llmCreate(route.provider, {
      model: modelToUse,
      max_tokens: 512,
      system: systemPrompt,
      tools: COUPLE_TOOLS,
      messages,
    });

    console.log(`[couple-agent] iteration ${iterations}, stop_reason: ${response.stop_reason}`);

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      if (!finalReply) {
        const textBlocks = response.content.filter(b => b.type === 'text');
        finalReply = textBlocks.map(b => b.text).join('\n').trim() || 'Thanks — we\'ll be in touch soon!';
      }
      break;
    }

    const toolResults = [];
    for (const toolUse of toolUseBlocks) {

      if (toolUse.name === 'capture_couple_lead') {
        if (isReturningBride && existingLeadForCouple?.id) {
          toolCallsAudit.push({ name: 'capture_couple_lead', input: toolUse.input, result: 'Lead already captured — skipped.' });
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: 'Lead already captured for this couple.' });
          continue;
        }

        const input = toolUse.input;

        // ── TDW_08 P5 · F-08.87 — THE PRECISION DROP, CURED AT THE ONE HOME ──────────
        // (CE ruling R-A2, Session A read-first, 2026-08-05.)
        //
        // THE DISEASE. This lane parsed the date inline and wrote `wedding_date` alone
        // (:307 update, :324 create), never `wedding_date_precision`. A bride who said
        // "December" had the model fill the day it always fills, and the row became a
        // hard 1 Dec — indistinguishable, forever, from a wedding actually on the 1st.
        // The vendor lane never had this: it has called `resolveWeddingDate` since
        // Patch 8d (see `create_lead`, :588-597).
        //
        // THE RULING, RE-SCOPED AND REPORTED (§0.2). The charter ruled the vendor
        // lane's resolver HOISTS to one home and both lanes call it. Half was already
        // true: the resolver never lived inside the vendor lane — it lives at
        // `src/agent/datePrecision.js` and is exported there beside
        // `formatDateWithPrecision`. So nothing hoists; THIS lane joins. One limb, not
        // two, and the two lanes can no longer drift because there is only one rule.
        //
        // FORWARD-ONLY BY RULING. Retroactive repair was REFUSED and the refusal is
        // recorded here rather than in a doc nobody re-reads: existing 1st-of-month
        // rows are indistinguishable from true 1st-of-month weddings, so a backfill
        // would have to guess, and a guess written into a date column is the disease
        // wearing a cure's clothes.
        //
        // THE HAYSTACK IS THE OWNER'S OWN WORDS, RULED (R-A2). `capture_couple_lead`
        // carries NO `raw_message` parameter — the vendor lane's `input.raw_message ||
        // inboundMessage` has no analogue here — and the bride commonly names the month
        // several turns before the capture fires ("December" at turn 2, the name at
        // turn 5). So the text handed to the resolver is HER user-role turns for this
        // session plus this inbound, and NOTHING the assistant wrote.
        //
        // [F-06.85: this paragraph is conditioned on a MECHANICAL fact — that `history`
        //  above (:90-102) carries role-tagged turns, `role: 'user'` for inbound only.
        //  Mechanism: the `.map()` at :95-98, whose ternary is the sole role source. If
        //  that mapping ever stops distinguishing direction, this filter silently starts
        //  feeding the assistant's prose to the resolver and this comment is false.]
        //
        // WHY ASSISTANT PROSE IS EXCLUDED, on the record: Eliza paraphrases. If she
        // writes back "so, a December wedding" and that sentence enters the haystack,
        // HER rewording mints a precision the bride never spoke — the provenance-hold
        // class, one column over. The owner's words are the only authority for what
        // the owner said.
        const { resolveWeddingDate } = require('./datePrecision');
        const coupleOwnWords = [
          ...history.filter(m => m.role === 'user').map(m => m.content),
          inboundMessage,
        ].filter(Boolean).join(' ');
        const resolvedDate = resolveWeddingDate({
          wedding_date: input.event_date,
          raw_message:  coupleOwnWords,
          name:         input.name,
        });

        // THE YEAR-BUMP SURVIVES (§8 — existing behaviour is sacred). The inline parse
        // this replaces rolled a past date forward a year, twice if needed; the resolver
        // has no such rule (`setFullYear` appears nowhere in datePrecision.js) because
        // the vendor lane's dates arrive from a vendor stating a real booking. A bride
        // saying "December" in August gets the model's "2025-12-01" as often as not, and
        // dropping this bump would file next winter's wedding in the past. Applied AFTER
        // resolution, deliberately: the sentinel is the 1st for 'month' and Jan 1 for
        // 'year', and moving the year leaves both sentinels exactly where they were, so
        // the precision the resolver derived survives the bump untouched.
        let event_date = resolvedDate.wedding_date;
        let event_date_precision = resolvedDate.precision;
        if (event_date) {
          const parsed = new Date(event_date);
          if (!isNaN(parsed.getTime())) {
            const today = new Date();
            if (parsed < today) {
              parsed.setFullYear(parsed.getFullYear() + 1);
              if (parsed < today) parsed.setFullYear(parsed.getFullYear() + 1);
            }
            event_date = parsed.toISOString().split('T')[0];
          }
        }
        if (event_date_precision === 'month' || event_date_precision === 'year') {
          console.log(`[couple-agent:capture] precision=${event_date_precision} — sentinel date kept (${event_date}), UI will render appropriately`);
        }

        // Upsert lead — dedup on (vendor_id, phone)
        const resolvedName = input.name || knownBrideName || null;
        if (resolvedName) capturedLeadName = resolvedName; // D1-lite — see :90
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('phone', couplePhone)
          .maybeSingle();

        if (existingLead) {
          // Update existing lead with collected details
          // ── TDW_06 · F-06.48 — THE MATCHED-LEAD UPDATE WAS DESTRUCTIVE ─────────────
          // Every field above read `input.x || null`, so a re-capture NULLED whatever the
          // model did not re-supply this turn. A bride who returns and says only "actually
          // make it the 14th" wiped her own city, budget, function count and notes — the
          // create path never had this problem because there was nothing to lose.
          //
          // Found while deriving F-06.48 on Droy's lead 7e3bd732 (walk, 27 Jul): its
          // budget_min 400000 SURVIVED an 11:53 touch, which is how we learned this update
          // had not run — had it run, the four lakh would have been erased. The defect was
          // latent, not firing, and one capture away from silent data loss.
          //
          // A partial update writes what it KNOWS and leaves the rest alone. Absence of a
          // field in one turn's extraction is not the owner saying the field is empty.
          const leadPatch = { name: resolvedName };
          // F-08.87: precision travels WITH the date and only with it. Guarded by the
          // same `if` deliberately — a partial update writes what it knows (F-06.48's
          // law, the paragraph above), and writing precision on a turn that supplied no
          // date would re-label a stored date from a sentence that never mentioned it.
          if (event_date) {
            leadPatch.wedding_date            = event_date;
            leadPatch.wedding_date_precision  = event_date_precision;
          }
          if (input.event_city)     leadPatch.wedding_city   = input.event_city;
          if (input.occasion)       leadPatch.event_types    = [input.occasion];
          if (input.budget_min)     leadPatch.budget_min     = input.budget_min;
          if (input.budget_max)     leadPatch.budget_max     = input.budget_max;
          if (input.function_count) leadPatch.function_count = input.function_count;
          if (input.wedding_days)   leadPatch.wedding_days   = input.wedding_days;
          if (input.functions)      leadPatch.functions      = input.functions;
          if (input.notes)          leadPatch.notes          = input.notes;
          await supabase.from('leads').update(leadPatch).eq('id', existingLead.id);
          leadCaptured = existingLead.id;
        } else {
          // Create new lead
          const { data: newLead } = await supabase.from('leads').insert({
            vendor_id:    vendor.id,
            phone:        couplePhone,
            name:         resolvedName,
            wedding_date: event_date,
            // F-08.87. NULL when no date was given — `leads_wedding_date_precision_check`
            // (PUBLIC_SCHEMA.md:1395-1396) admits day|month|year and NULL, never ''.
            // `resolveWeddingDate` returns null precision for a null date, so the two
            // columns cannot disagree by construction.
            wedding_date_precision: event_date_precision,
            wedding_city: input.event_city   || null,
            event_types:  input.occasion ? [input.occasion] : null,
            budget_min:   input.budget_min   || null,
            budget_max:   input.budget_max   || null,
            function_count: input.function_count || null,
            wedding_days:   input.wedding_days   || null,
            functions:      input.functions      || null,
            source:       'whatsapp',
            notes:        input.notes        || null,
            state:        'new',
          }).select('id').single();
          if (newLead) leadCaptured = newLead.id;
        }

        // ── Mirror lead fields into couples silently (P1-4) ─────────
        // captureField writes only wedding_date, wedding_city, budget_total.
        // Never partner_name (bride product owns that field).
        if (coupleId) {
          if (event_date) {
            await captureField(supabase, coupleId, 'wedding_date', event_date);
          }
          if (input.event_city) {
            await captureField(supabase, coupleId, 'wedding_city', input.event_city);
          }
          if (input.budget_min) {
            // budget_total on couples is a single integer (rupees).
            // leads carries budget_min/max range. Use the lower bound as
            // the conservative anchor — it's what the bride explicitly
            // committed to. If she narrows later via the bride product,
            // that overwrites this.
            await captureField(supabase, coupleId, 'budget_total', input.budget_min);
          }
        }

        // Build vendor notification summary
        const parts = [];
        if (resolvedName)     parts.push(`Name: ${resolvedName}`);
        if (input.occasion)   parts.push(`Occasion: ${input.occasion}`);
        if (event_date)       parts.push(`Date: ${event_date}`);
        if (input.event_city) parts.push(`City: ${input.event_city}`);
        if (input.budget_min) {
          // ── TDW_08 P5 · F-08.86 — Rs 4.5L ON THE VENDOR WIRE (CE ruling R-A3) ──────
          // SITE 1 OF 2. This string reaches a VENDOR's handset (the four notification
          // sites, vendorInbound.js:588/698/837/971). `Rs 4.5L` breaks the house money
          // register twice over — the L shorthand is forbidden outright, and toFixed(1)
          // rounds 4,55,000 to "4.6L", so the vendor read a figure the bride never said.
          //
          // THE HOME IS NOT NEW AND IS NOT INVENTED HERE. `witnessLine.rupees` is the
          // CJS wire's ONE grouped-money home (TDW_06 M-4, ruling R2-B); the TS engine's
          // `rs()` is the same output form one runtime over, and recordPrimitives.ts:122
          // states the split in law: per-runtime, no cross-runtime reach. Five modules
          // already import it under this exact comment. A third formatter is forbidden.
          //
          // THE FALLBACK IS THE ESTATE'S OWN IDIOM (`rupees(n) || \`Rs ${n}\``, as at
          // harvest.js:311 and api/vendor/leads.js:250): `rupees` returns null on a
          // non-finite or non-positive value, and a lead's budget must never render the
          // word "null" on a vendor's phone.
          //
          // THE RANGE FORM IS FOUNDER-VETOED, 2026-08-05, verbatim 「 yes 」:
          //   was  Rs 4.5L-6.0L
          //   now  Rs 4,50,000-Rs 6,00,000
          // The separator byte is preserved exactly; `Rs` repeats on the second bound
          // because the home emits its own prefix and stripping it would be a third
          // formatter wearing a substring's clothes.
          const { rupees } = require('../lib/witnessLine');
          const budMin = rupees(input.budget_min) || `Rs ${input.budget_min}`;
          const budMax = (input.budget_max && input.budget_max !== input.budget_min)
            ? (rupees(input.budget_max) || `Rs ${input.budget_max}`)
            : null;
          const bud = budMax ? `${budMin}-${budMax}` : budMin;
          parts.push(`Budget: ${bud}`);
        }
        const summary = parts.length > 0 ? parts.join(', ') : 'Details still being collected';

        // Notify vendor on their self-thread
        if (vendorUser?.phone) {
          const { data: vendorSelfConvo } = await supabase
            .from('conversations')
            .select('id')
            .eq('vendor_id', vendor.id)
            .eq('kind', 'vendor_self')
            .maybeSingle();

          // Phase 2.2 — opportunistic enrichment (📅 / 🔥 / 💰). Emits only the
          // lines it has data for; hydrates date/budget from the couple profile
          // when known. Never throws, never blanks.
          const enrichment = await buildEnquiryEnrichment(supabase, {
            vendorId:    vendor.id,
            vendor,
            coupleId,
            weddingDate: event_date,
            budgetMin:   input.budget_min,
            budgetMax:   input.budget_max,
          });

          const notifMsg = enrichment
            ? `New enquiry from ${couplePhone}. ${summary}. Lead saved.\n\n${enrichment}`
            : `New enquiry from ${couplePhone}. ${summary}. Lead saved.`;

          if (vendorSelfConvo) {
            await supabase.from('messages').insert({
              conversation_id: vendorSelfConvo.id,
              direction: 'outbound',
              channel: 'whatsapp',
              body: notifMsg,
              sent_by: 'system',
            });
          }

          // First-contact ping — vendor agent will see this lead as "active"
          // in the next turn for pronoun resolution. Best-effort.
          if (leadCaptured) {
            const { error: pingErr } = await supabase.from('pending_lead_pings').insert({
              vendor_id:     vendor.id,
              lead_id:       leadCaptured,
              lead_name:     input.name || null,
              bride_message: inboundMessage || null,
              intent_summary: null,
              source:        'bride_message',
            });
            if (pingErr) console.warn('[couple-agent:first-contact] ping insert failed:', pingErr.message);
          }

          // Send WhatsApp to vendor — handled in index.js after this returns
          // Store notification in toolCallsAudit for index.js to pick up
          toolCallsAudit.push({ name: 'vendor_notification', message: notifMsg });
        }

        console.log(`[couple-agent] lead captured for ${couplePhone} — ${summary}`);
        toolCallsAudit.push({ name: 'capture_couple_lead', input: toolUse.input, result: 'Lead saved.' });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: 'Lead saved successfully. The enquiry is now COMPLETE. Your only remaining action is to call respond_to_couple with a brief, warm closing line (e.g. "Perfect — I\'ve passed this to ' + (vendorUser?.name || vendor?.business_name || 'the vendor') + ', they\'ll be in touch soon!"). Do NOT ask any more questions. Do NOT reconsider what might be missing. Just send the closing line and stop.',
        });

      } else if (toolUse.name === 'respond_to_couple') {
        finalReply = toolUse.input.message;
        toolCallsAudit.push({ name: 'respond_to_couple', input: toolUse.input, result: 'Reply queued.' });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: 'Reply queued.',
        });
      }
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    if (finalReply !== null) break;
  }

  // Build vendor notification:
  // - First-contact: use the synthetic vendor_notification audit message (capture_couple_lead pushes one)
  // - Returning bride: enrich with a Haiku-extracted intent summary (cached on leads.intent_summary).
  //   On any extraction error or null result, fall back to the verbatim format.
  const firstContactNotif = toolCallsAudit.find(t => t.name === 'vendor_notification')?.message || null;

  let returningBrideNotif = null;
  if (isReturningBride) {
    const verbatimFallback = `${leadName || `...${couplePhone.slice(-4)}`} just messaged: "${inboundMessage}"`;
    try {
      const summary = await getReturningBrideIntent({
        inboundMessage,
        leadId: existingLeadForCouple.id,
        leadName,
        cachedSummary: existingLeadForCouple.intent_summary,
        cachedAt: existingLeadForCouple.intent_summary_at,
        supabase,
        anthropic,
      });
      returningBrideNotif = summary
        ? `${summary}\n\nHer message: "${inboundMessage}"`
        : verbatimFallback;
    } catch (err) {
      console.warn('[couple-agent] intent extraction error:', err.message);
      returningBrideNotif = verbatimFallback;
    }

    // Mirror first-contact behaviour: log this notification to vendor_self
    // messages so the vendor agent's next turn can see it in history.
    // Without this, the vendor's WhatsApp shows the notification but the
    // agent has no idea who "her" is when the vendor says "tell her ...".
    if (vendorUser?.phone && returningBrideNotif) {
      const { data: vendorSelfConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('vendor_id', vendor.id)
        .eq('kind', 'vendor_self')
        .maybeSingle();

      if (vendorSelfConvo) {
        await supabase.from('messages').insert({
          conversation_id: vendorSelfConvo.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: returningBrideNotif,
          sent_by: 'system',
        });
      }

      // Returning-bride ping — vendor agent will see this lead as "active"
      // in the next turn for pronoun resolution.
      const { error: pingErr } = await supabase.from('pending_lead_pings').insert({
        vendor_id:     vendor.id,
        lead_id:       existingLeadForCouple.id,
        lead_name:     leadName || null,
        bride_message: inboundMessage || null,
        intent_summary: existingLeadForCouple.intent_summary || null,
        source:        'bride_message',
      });
      if (pingErr) console.warn('[couple-agent:returning] ping insert failed:', pingErr.message);
    }
  }

  return {
    reply: finalReply || 'Thanks — we\'ll be in touch soon!',
    toolCalls: toolCallsAudit,
    iterations,
    vendorNotification: isReturningBride ? returningBrideNotif : firstContactNotif,
    // D1-lite (BLOCK 06 M-0) — ADDITIVE. The name this turn resolved, else the
    // name already on file, else null. The door reads it to name the binder;
    // every existing reader of this object is untouched.
    leadName: capturedLeadName || leadName,
  };
}

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  F-05.56 — EVERYTHING BELOW THIS LINE HAS ZERO CALLERS SINCE ARC M5.        ║
// ║  DEFUSED ISLAND. Filed + ruled at CE-68 (F-05.50(b) micro). Label only.     ║
// ╚════════════════════════════════════════════════════════════════════════════╝
//
// `handleOnboarding` (below) and `executeTool` (below it) run to the end of this
// file and are UNREACHABLE. Neither is exported — `module.exports` is
// `{ runCoupleAgenticTurn }` alone — and neither is called anywhere in `src/**` or
// `scripts/**`. Verified by command at 2028a0d and asserted at
// `b05_f0550_ping_drain_bench` §4.
//
// HOW THEY DIED: M5 deleted `runAgenticTurn` (the JS vendor loop, formerly :43-374)
// as an orphan, and these two were ITS callees. M5's census walked the orphan and
// its classifier and named `classifier.js` a defused island — correctly — but it did
// not walk one level further out to the functions the orphan had been the last
// caller of. So ~1,059 lines went dark in the same act and were never named. This is
// the CE-67 §C class exactly ("the charter protected a survivor living inside the
// corpse"), one ring wider.
//
// WHY THE LABEL MATTERS TO A READER WHO IS NOT LOOKING FOR IT: `executeTool` contains
// the THIRD writer of `pending_lead_pings` (the `create_lead` hand). `b05_arc_m5_bench`
// §3.1 counted three writers by text and called them "live"; one of them has been dead
// since M5. F-05.50(b)'s drain reads only what the two LIVE writers
// (`runCoupleAgenticTurn`, :332 and :424) put there. Anyone reading this file for the
// ping story must know which writers can still fire.
//
// DELETION IS NOT THIS MICRO'S. CE-68 ruled defuse-and-label here and said the
// deletion takes its OWN ruling — M5's own two-step, and its precedent governs
// (`classifier.js`'s header, `src/agent/classifier.js`). REVIVAL-OR-DELETION POINTER:
// whoever revives the JS vendor wire needs `runAgenticTurn` back from history
// (`git show a80dac8^:src/agent/engine.js`), and it will need these two and
// `classifier.js` waiting — which is why they are kept whole rather than gutted.
// Whoever deletes instead should take the three together, in one ruled act.
//
// ── Onboarding handler ────────────────────────────────────────────
async function handleOnboarding({ vendor, user, conversation, inboundMessage, supabase, anthropic }) {
  const result = await nextOnboardingMessage({
    vendor, user, inboundMessage, supabase, anthropic,
  });
  return { reply: result.reply, toolCalls: [], iterations: 1 };
}

// ── Tool executor (vendor agent) ──────────────────────────────────
async function executeTool({ name, input, vendor, conversation, supabase, channel = 'whatsapp', attachments = [] }) {
  switch (name) {

    case 'note_to_self': {
      const { error } = await supabase.from('notes').insert({
        vendor_id: vendor.id,
        conversation_id: conversation.id,
        content: input.content,
        tags: input.tags || null,
      });
      if (error) return `Error: ${error.message}`;
      console.log(`[tool:note_to_self] "${input.content}"`);
      return 'Note saved.';
    }

    case 'create_lead': {
      // Patch 8d — date + precision via helper. Keeps the 1st-of-month
      // sentinel in wedding_date when precision='month' so the DB has
      // a sortable date; PWA UI uses precision to render "July 2026"
      // instead of "1 Jul 2026". Year-precision similar (Jan 1 sentinel).
      const { resolveWeddingDate } = require('./datePrecision');
      const resolved = resolveWeddingDate({
        wedding_date: input.wedding_date,
        raw_message:  input.raw_message || inboundMessage,
        name:         input.name,
      });
      const wedding_date            = resolved.wedding_date;
      const wedding_date_precision  = resolved.precision; // 'day' | 'month' | 'year' | null
      if (wedding_date_precision === 'month' || wedding_date_precision === 'year') {
        console.log(`[tool:create_lead] precision=${wedding_date_precision} — sentinel date kept (${wedding_date}), UI will render appropriately`);
      }

      // Dedup: if phone present, check for existing lead with same vendor+phone
      if (input.phone) {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, name, wedding_date, state, client_id')
          .eq('vendor_id', vendor.id)
          .eq('phone', input.phone)
          .maybeSingle();

        if (existingLead) {
          console.log(`[tool:create_lead] dedup hit — returning existing lead ${existingLead.id} for phone ${input.phone}`);
          return `Lead already exists for this phone. ID: ${existingLead.id}. Name: ${existingLead.name || 'unknown'}. State: ${existingLead.state}.`;
        }
      }

      // Auto-link to existing client (phone match) — silent
      let clientIdToLink = null;
      if (input.phone) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('phone', input.phone)
          .maybeSingle();
        if (existingClient) {
          clientIdToLink = existingClient.id;
          console.log(`[tool:create_lead] auto-linking to existing client ${existingClient.id} on phone ${input.phone}`);
        }
      }

      const { data: lead, error } = await supabase.from('leads').insert({
        vendor_id:    vendor.id,
        name:         input.name         || null,
        phone:        input.phone        || null,
        email:        input.email        || null,
        wedding_date,
        wedding_date_precision,
        wedding_city: input.wedding_city || null,
        event_types:  input.event_types  || null,
        budget_min:   input.budget_min   || null,
        budget_max:   input.budget_max   || null,
        source:       input.source       || 'whatsapp',
        referrer_name: input.referrer_name || null,
        notes:        input.notes        || null,
        raw_message:  input.raw_message  || null,
        state:        'new',
        client_id:    clientIdToLink,
      }).select('id, name, wedding_date, client_id').single();

      if (error) {
        console.error('[tool:create_lead] error:', error);
        return `Error creating lead: ${error.message}`;
      }

      console.log(`[tool:create_lead] ${lead.name || 'unnamed'} — ${lead.wedding_date || 'no date'} (${lead.id})${lead.client_id ? ` [client: ${lead.client_id}]` : ''}`);

      // Write a pending ping so the next turn knows this lead is "active"
      // for pronoun resolution. Best-effort — failure doesn't block the lead.
      const { error: pingErr } = await supabase.from('pending_lead_pings').insert({
        vendor_id:     vendor.id,
        lead_id:       lead.id,
        lead_name:     lead.name || null,
        bride_message: null,
        intent_summary: null,
        source:        'vendor_create_lead',
      });
      if (pingErr) console.warn('[tool:create_lead] ping insert failed:', pingErr.message);

      return `Lead created. ID: ${lead.id}. Name: ${lead.name || 'unknown'}. Date: ${lead.wedding_date || 'not specified'}.${lead.client_id ? ' Linked to existing client.' : ''}`;
    }

    case 'list_leads': {
      let query = supabase
        .from('leads')
        .select('id, name, phone, wedding_date, wedding_date_precision, wedding_city, state, budget_min, budget_max, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (input.state !== 'all') {
        query = query.eq('state', input.state);
      }

      const { data: leads, error } = await query;
      if (error) return `Error fetching leads: ${error.message}`;

      if (!leads || leads.length === 0) {
        return input.state === 'all'
          ? 'No leads yet.'
          : `No leads with state: ${input.state}.`;
      }

      const { formatDateWithPrecision } = require('./datePrecision');
      const summary = leads.map(l => {
        const date   = formatDateWithPrecision(l.wedding_date, l.wedding_date_precision);
        const budget = l.budget_min
          ? `Rs ${(l.budget_min/100000).toFixed(1)}L${l.budget_max && l.budget_max !== l.budget_min ? `-${(l.budget_max/100000).toFixed(1)}L` : ''}`
          : 'budget unknown';
        return `${l.name || 'Unknown'} — ${l.phone || 'no phone'} — ${date} — ${l.state} — ${budget}`;
      }).join('\n');

      return `${leads.length} lead(s):\n${summary}`;
    }

    case 'update_lead_state': {
      const { error } = await supabase
        .from('leads')
        .update({ state: input.new_state })
        .eq('id', input.lead_id)
        .eq('vendor_id', vendor.id);

      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_lead_state] ${input.lead_id} -> ${input.new_state}`);
      return `Lead updated to ${input.new_state}.`;
    }

    case 'update_conversation_state': {
      const { error } = await supabase
        .from('conversations')
        .update({ state: input.new_state })
        .eq('id', conversation.id);
      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_state] -> ${input.new_state}`);
      return `Conversation state updated to ${input.new_state}.`;
    }

    case 'create_event': {
      // Sanitise linked_lead_id — agent sometimes passes a name instead of UUID
      let linked_lead_id = null;
      if (input.linked_lead_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.linked_lead_id)) {
        linked_lead_id = input.linked_lead_id;
      }

      const { data: event, error } = await supabase.from('events').insert({
        vendor_id:      vendor.id,
        title:          input.title,
        event_date:     input.event_date,
        event_time:     input.event_time || null,
        kind:           input.kind,
        linked_lead_id,
        notes:          input.notes || null,
        state:          'upcoming',
      }).select('id, title, event_date, kind').single();

      if (error) {
        console.error('[tool:create_event] error:', error);
        return `Error creating event: ${error.message}`;
      }

      console.log(`[tool:create_event] ${event.kind} "${event.title}" on ${event.event_date} (${event.id})`);
      return `Event created. ID: ${event.id}. ${event.kind}: ${event.title} on ${event.event_date}.`;
    }

    case 'commit_event_proposals': {
      // Patch 8 — bulk-commit events extracted from vendor calendar screenshot.
      const proposalId = input.proposal_id;
      const action     = input.action;
      const keepIdx    = Array.isArray(input.keep_indices) ? input.keep_indices : null;

      if (!proposalId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proposalId)) {
        return 'Error: proposal_id must be a UUID from the PENDING EVENT PROPOSALS context.';
      }

      // Fetch the proposal — must belong to this vendor and still be unresolved
      const { data: proposal, error: pErr } = await supabase
        .from('pending_event_proposals')
        .select('id, proposals, resolved_at')
        .eq('id', proposalId)
        .eq('vendor_id', vendor.id)
        .maybeSingle();

      if (pErr || !proposal) {
        return `Error: proposal ${proposalId} not found or not yours.`;
      }
      if (proposal.resolved_at) {
        return `That proposal has already been resolved. Send a fresh screenshot if you want to add more events.`;
      }

      const allProposals = Array.isArray(proposal.proposals) ? proposal.proposals : [];

      if (action === 'cancel') {
        await supabase
          .from('pending_event_proposals')
          .update({ resolved_at: new Date().toISOString(), resolution: 'cancel' })
          .eq('id', proposalId);
        return `Cancelled. No events were added.`;
      }

      // Decide which to commit
      let toCommit = [];
      if (action === 'save_all') {
        toCommit = allProposals;
      } else if (action === 'save_selected') {
        if (!keepIdx || keepIdx.length === 0) {
          return 'Error: save_selected requires keep_indices (1-based array of which events to keep).';
        }
        for (const idx of keepIdx) {
          if (idx >= 1 && idx <= allProposals.length) {
            toCommit.push(allProposals[idx - 1]);
          }
        }
        if (toCommit.length === 0) {
          return 'Error: keep_indices did not match any events in the proposal.';
        }
      } else {
        return `Error: unknown action "${action}". Use save_all, save_selected, or cancel.`;
      }

      // Bulk insert into events
      const rowsToInsert = toCommit.map(e => ({
        vendor_id:  vendor.id,
        title:      e.title,
        event_date: e.event_date,
        event_time: e.event_time || null,
        kind:       (typeof e.kind === 'string' ? e.kind : 'other'),
        notes:      e.notes || null,
        state:      'upcoming',
      }));

      const { data: inserted, error: insErr } = await supabase
        .from('events')
        .insert(rowsToInsert)
        .select('id');

      if (insErr) {
        console.error('[tool:commit_event_proposals] insert error:', insErr);
        return `Error inserting events: ${insErr.message}`;
      }

      await supabase
        .from('pending_event_proposals')
        .update({
          resolved_at: new Date().toISOString(),
          resolution: action,
        })
        .eq('id', proposalId);

      console.log(`[tool:commit_event_proposals] proposal ${proposalId} → committed ${inserted.length}/${allProposals.length} events (action: ${action})`);
      return `Committed ${inserted.length} event(s) to your calendar.`;
    }

    case 'create_invoice': {
      // 4a. Validation
      if (input.amount_total <= 0) return 'Invoice total must be greater than zero.';
      if (input.amount_advance != null && input.amount_advance < 0) return 'Advance amount cannot be negative.';
      if (input.amount_advance != null && input.amount_advance > input.amount_total) return 'Advance amount cannot exceed the invoice total.';

      // 4b. Fetch vendor row
      const { data: v } = await supabase
        .from('vendors')
        .select('id, business_name, upi_id, routing_handle, invoice_prefix, invoice_counter, user_id')
        .eq('id', vendor.id)
        .single();

      // 4c. Fetch user name (fallback for display)
      const { data: u } = await supabase
        .from('users')
        .select('name')
        .eq('id', v.user_id)
        .single();

      // 4d. Guard: routing handle
      if (!v.routing_handle) return 'Cannot create invoice — onboarding is incomplete. Contact support.';

      // 4e. Duplicate name check (only if lead_id not provided AND not confirmed)
      // confirmed_duplicate is set after the vendor confirms — stops the re-ask loop (3.0-A).
      if (!input.lead_id && !input.confirmed_duplicate) {
        // Check leads table
        const { data: leadMatches } = await supabase
          .from('leads')
          .select('id, name, wedding_date, wedding_date_precision, wedding_city')
          .eq('vendor_id', vendor.id)
          .ilike('name', `%${input.client_name}%`);

        // Check invoices table
        const { data: invoiceMatches } = await supabase
          .from('invoices')
          .select('id, client_name, invoice_number, state, created_at')
          .eq('vendor_id', vendor.id)
          .ilike('client_name', `%${input.client_name}%`)
          .neq('state', 'cancelled');

        const hasLeadMatches    = leadMatches    && leadMatches.length > 0;
        const hasInvoiceMatches = invoiceMatches && invoiceMatches.length > 0;

        if (hasLeadMatches || hasInvoiceMatches) {
          let msg = `Found existing records for "${input.client_name}":\n`;

          if (hasLeadMatches) {
            msg += `\nLeads:\n`;
            const { formatDateWithPrecision: fmtDP1 } = require('./datePrecision');
            msg += leadMatches.map(l => {
              const date = l.wedding_date ? `, wedding ${fmtDP1(l.wedding_date, l.wedding_date_precision)}` : '';
              const city = l.wedding_city ? `, ${l.wedding_city}` : '';
              return `- ${l.name}${date}${city} (lead ID: ${l.id})`;
            }).join('\n');
          }

          if (hasInvoiceMatches) {
            msg += `\nExisting invoices:\n`;
            msg += invoiceMatches.map(i => {
              const date = new Date(i.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              return `- ${i.invoice_number} (${i.state}, raised ${date})`;
            }).join('\n');
          }

          msg += `\n\nIs this the same ${input.client_name}, or a different person? If the vendor confirms it's the same, call create_invoice again with the same details and confirmed_duplicate set to true. If different, ask for a more specific name.`;

          return msg;
        }
      }

      // 4f. Set invoice prefix if null
      if (v.invoice_prefix === null) {
        const derivedPrefix = `TDW/${v.routing_handle}`;
        await supabase.from('vendors').update({ invoice_prefix: derivedPrefix }).eq('id', vendor.id);
        v.invoice_prefix = derivedPrefix;
      }

      // 4g. Increment counter (atomic)
      const { data: vUpd } = await supabase
        .from('vendors')
        .update({ invoice_counter: v.invoice_counter + 1 })
        .eq('id', vendor.id)
        .select('invoice_counter')
        .single();
      const newCounter = vUpd.invoice_counter;

      // 4h. Build invoice number
      const invoiceNumber = `${v.invoice_prefix}/${String(newCounter).padStart(2, '0')}`;

      // 4i. Insert invoice row
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert({
          vendor_id:      vendor.id,
          lead_id:        input.lead_id || null,
          invoice_number: invoiceNumber,
          client_name:    input.client_name,
          client_phone:   input.client_phone || null,
          description:    input.description  || null,
          amount_total:   input.amount_total,
          amount_advance: input.amount_advance || null,
          amount_paid:    0,
          due_date:       input.due_date || null,
          state:          'unpaid',
          notes:          input.notes || null,
        })
        .select('id')
        .single();

      if (invErr) return `Error creating invoice: ${invErr.message}`;

      // 4j. Compose message
      const vendorDisplayName = v.business_name || u?.name || 'Your vendor';

      const composedMessage = buildInvoiceMessage({
        clientName:        input.client_name,
        vendorDisplayName,
        invoiceNumber,
        description:       input.description  || null,
        amountTotal:       input.amount_total,
        amountAdvance:     input.amount_advance || null,
        dueDate:           input.due_date      || null,
        upiId:             v.upi_id            || null,
      });

      // 4k. Build return string
      let result = `Invoice ${invoiceNumber} created.\n\n`;
      result += `--- FORWARD THIS TO ${input.client_name.toUpperCase()} — DO NOT MODIFY ---\n`;
      result += composedMessage;
      result += `\n--- END ---`;
      if (!v.upi_id) {
        result += `\n\n(UPI ID not saved — client won't see a payment ID. Reply "set my UPI to [your UPI]" to add it.)`;
      }
      console.log(`[tool:create_invoice] ${invoiceNumber} for ${input.client_name} — Rs ${input.amount_total}`);
      return result;
    }

    case 'list_events': {
      // Compute IST date boundaries (UTC+5:30)
      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs);
      const istToday = istNow.toISOString().split('T')[0];

      let dateStart = istToday;
      let dateEnd   = null;

      if (input.window === 'today') {
        dateEnd = istToday;
      } else if (input.window === 'this_week') {
        // End of current week (Sunday). getUTCDay() returns 0=Sunday, 1=Monday...
        const daysUntilSunday = (7 - istNow.getUTCDay()) % 7;
        const sundayDate = new Date(istNow.getTime() + daysUntilSunday * 86400000);
        dateEnd = sundayDate.toISOString().split('T')[0];
      } else if (input.window === 'next_7_days') {
        const plus7 = new Date(istNow.getTime() + 7 * 86400000);
        dateEnd = plus7.toISOString().split('T')[0];
      }
      // upcoming_all: dateEnd stays null (no upper bound)

      let query = supabase
        .from('events')
        .select('id, title, event_date, event_time, kind, state, notes')
        .eq('vendor_id', vendor.id)
        .eq('state', 'upcoming')
        .gte('event_date', dateStart)
        .order('event_date', { ascending: true })
        .limit(20);

      if (dateEnd) query = query.lte('event_date', dateEnd);
      if (input.kind && input.kind !== 'all') query = query.eq('kind', input.kind);

      const { data: events, error } = await query;
      if (error) return `Error fetching events: ${error.message}`;

      if (!events || events.length === 0) {
        return `No events found in window: ${input.window}.`;
      }

      const summary = events.map(e => {
        const time = e.event_time ? ` at ${e.event_time.slice(0, 5)}` : '';
        return `${e.event_date}${time} — ${e.kind}: ${e.title}`;
      }).join('\n');

      return `${events.length} event(s):\n${summary}`;
    }

    case 'update_event_state': {
      const { error } = await supabase
        .from('events')
        .update({ state: input.new_state })
        .eq('id', input.event_id)
        .eq('vendor_id', vendor.id);

      if (error) return `Error: ${error.message}`;
      console.log(`[tool:update_event_state] ${input.event_id} -> ${input.new_state}`);
      return `Event marked ${input.new_state}.`;
    }

    case 'update_routing_handle': {
      // Clean: uppercase, alphanumeric + hyphen only
      const cleaned = (input.new_handle || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (cleaned.length < 3) {
        return 'Handle too short. Needs at least 3 alphanumeric characters.';
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from('vendors')
        .select('id')
        .eq('routing_handle', cleaned)
        .neq('id', vendor.id)
        .maybeSingle();

      if (existing) {
        return `Handle ${cleaned} is already taken. Ask the vendor to try another.`;
      }

      const { error } = await supabase
        .from('vendors')
        .update({ routing_handle: cleaned })
        .eq('id', vendor.id);

      if (error) return `Error updating handle: ${error.message}`;

      console.log(`[tool:update_routing_handle] vendor ${vendor.id} -> ${cleaned}`);
      return `Handle updated to ${cleaned}. New TDW link: wa.me/${waNumberFor('vendor')}?text=TDW-${cleaned}`;
    }

    case 'get_my_tdw_link': {
      const { data: v } = await supabase
        .from('vendors')
        .select('routing_handle')
        .eq('id', vendor.id)
        .maybeSingle();

      if (!v || !v.routing_handle) {
        return 'No TDW handle is set for this vendor. This is unexpected — escalate to Dev.';
      }

      const tdwNumber = waNumberFor('vendor');   // F5 rider: was the DEAD sandbox literal
      const link = `wa.me/${tdwNumber}?text=TDW-${v.routing_handle}`;
      console.log(`[tool:get_my_tdw_link] vendor ${vendor.id} -> ${link}`);
      return `TDW link: ${link}`;
    }

    case 'add_client': {
      try {
        const { client, created } = await resolveOrCreateClient(supabase, vendor.id, {
          name:          input.name,
          phone:         input.phone,
          email:         input.email,
          source:        'manual_add',
          referrer_name: input.referrer_name,
          notes:         input.notes,
        });

        // Back-link existing leads with matching phone (best-effort, silent)
        let backLinkedCount = 0;
        if (input.phone) {
          const { data: linkedRows, error: linkErr } = await supabase
            .from('leads')
            .update({ client_id: client.id })
            .eq('vendor_id', vendor.id)
            .eq('phone', input.phone)
            .is('client_id', null)
            .select('id');
          if (!linkErr && linkedRows) {
            backLinkedCount = linkedRows.length;
            if (backLinkedCount > 0) {
              console.log(`[tool:add_client] back-linked ${backLinkedCount} existing lead(s) to client ${client.id}`);
            }
          } else if (linkErr) {
            console.error('[tool:add_client] back-link failed (non-fatal):', linkErr.message);
          }
        }

        if (!created) {
          console.log(`[tool:add_client] dedup hit — returning existing client ${client.id}`);
          return `Client already exists: ${client.name}${client.phone ? ` (${client.phone})` : ''}.`;
        }

        console.log(`[tool:add_client] new client ${client.id} (${client.name})`);
        if (backLinkedCount > 0) console.log(`[tool:add_client] linked ${backLinkedCount} existing lead(s)`);
        return { name: client.name, phone: client.phone, source: client.source, created_at: client.created_at };
      } catch (err) {
        console.error('[tool:add_client] error:', err.message);
        return `Error adding client: ${err.message}`;
      }
    }

    case 'list_clients': {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id);

      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, phone, email, source, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[tool:list_clients] error:', error);
        return `Error listing clients: ${error.message}`;
      }

      if (!clients || clients.length === 0) {
        return 'No clients yet.';
      }

      const lines = clients.map((c, i) =>
        `${i + 1}. ${c.name}${c.phone ? ` (${c.phone})` : ''}${c.email ? ` — ${c.email}` : ''}`
      );
      console.log(`[tool:list_clients] returned ${clients.length} of ${count ?? clients.length} clients`);
      const total = count ?? clients.length;
      const footer = total > 10
        ? `\nShowing 10 of ${total} clients. Ask to see more or search by name to narrow results.`
        : '';
      return `Recent clients:\n${lines.join('\n')}${footer}`;
    }

    // P2-1 lift 2 — query_day
    case 'query_day': {
      const { date } = input;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return 'Invalid date format. Please provide YYYY-MM-DD.';
      }

      const [evRes, invRes, expRes] = await Promise.all([
        supabase.from('events')
          .select('title, event_date, event_time, kind, state')
          .eq('vendor_id', vendor.id)
          .eq('event_date', date)
          .in('state', ['upcoming', 'done'])
          .order('event_time', { ascending: true, nullsFirst: false }),

        supabase.from('invoices')
          .select('id, client_name, amount_total, amount_paid, state')
          .eq('vendor_id', vendor.id)
          .eq('due_date', date)
          .in('state', ['unpaid', 'advance_paid']),

        supabase.from('expenses')
          .select('description, amount, category, created_at')
          .eq('vendor_id', vendor.id)
          .gte('created_at', date + 'T00:00:00.000Z')
          .lt('created_at',  date + 'T23:59:59.999Z'),
      ]);

      const events   = evRes.data  || [];
      const invoices = invRes.data || [];
      const expenses = expRes.data || [];
      const sections = [];

      if (events.length > 0) {
        const lines = events.map(e => {
          const time = e.event_time ? `${e.event_time.slice(0, 5)} — ` : '';
          const done = e.state === 'done' ? ' [done]' : '';
          return `- ${time}${e.kind}: ${e.title}${done}`;
        });
        sections.push(`EVENTS (${events.length}):\n${lines.join('\n')}`);
      }

      if (invoices.length > 0) {
        const lines = invoices.map(i => {
          const owed = Math.round((i.amount_total || 0) - (i.amount_paid || 0));
          return `- ${i.client_name || 'Unknown'}: Rs ${owed.toLocaleString('en-IN')} due`;
        });
        sections.push(`INVOICES DUE (${invoices.length}):\n${lines.join('\n')}`);
      }

      if (expenses.length > 0) {
        const lines = expenses.map(e =>
          `- Rs ${Math.round(e.amount || 0).toLocaleString('en-IN')} — ${e.category || 'general'}${e.description ? ': ' + e.description : ''}`
        );
        sections.push(`EXPENSES LOGGED (${expenses.length}):\n${lines.join('\n')}`);
      }

      if (sections.length === 0) {
        return `Nothing on ${date} — no events, invoices due, or expenses logged.`;
      }

      console.log(`[tool:query_day] ${date} → ${events.length} events, ${invoices.length} invoices, ${expenses.length} expenses`);
      return `${date}:\n\n${sections.join('\n\n')}`;
    }

    // P2-1 lift 3 — hot_dates_context
    case 'hot_dates_context': {
      const monthsAhead = Math.max(1, Math.min(12, Number(input.months_ahead) || 3));

      const istNow    = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      const todayStr  = istNow.toISOString().split('T')[0];
      const endDate   = new Date(istNow.getFullYear(), istNow.getMonth() + monthsAhead, istNow.getDate())
        .toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('hot_dates')
        .select('date, note, region')
        .gte('date', todayStr)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .limit(30);

      if (error) {
        console.error('[tool:hot_dates_context] error:', error.message);
        return 'Could not fetch hot dates right now.';
      }

      const rows = data || [];
      if (rows.length === 0) {
        return `No Vivah Muhurat dates in the next ${monthsAhead} month${monthsAhead === 1 ? '' : 's'}.`;
      }

      const lines = rows.map(r => {
        const notePart   = r.note ? ` — ${r.note}` : '';
        const regionPart = r.region && r.region !== 'All India' ? ` (${r.region})` : '';
        return `- ${r.date}${notePart}${regionPart}`;
      });

      console.log(`[tool:hot_dates_context] ${rows.length} dates in next ${monthsAhead}mo`);
      return `Vivah Muhurat — next ${monthsAhead} month${monthsAhead === 1 ? '' : 's'}:\n${lines.join('\n')}`;
    }

    case 'respond_to_vendor': {
      console.log(`[tool:respond] "${input.message.slice(0, 80)}"`);
      return 'Reply queued.';
    }

    case 'clarify': {
      // No DB side effects. The agentic loop has already formatted this into
      // the numbered text reply and ended the turn. This case exists so the
      // tool dispatch doesn't fall through to "unknown tool".
      console.log(`[tool:clarify] "${(input.question || '').slice(0, 80)}" (${(input.options || []).length} options)`);
      return 'Clarification asked.';
    }

    case 'record_payment': {
      // Fetch invoice — must belong to this vendor
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', input.invoice_id)
        .eq('vendor_id', vendor.id)
        .single();

      if (invErr || !inv) return 'Invoice not found. Check the invoice ID and try again.';
      if (inv.state === 'paid')      return `Invoice ${inv.invoice_number} is already fully paid.`;
      if (inv.state === 'cancelled') return `Invoice ${inv.invoice_number} is cancelled — cannot record payment.`;

      const newAmountPaid = inv.amount_paid + input.amount_received;

      // Soft overpayment warning (shagun, tips — not blocked at DB)
      if (newAmountPaid > inv.amount_total) {
        const excess = newAmountPaid - inv.amount_total;
        console.warn(`[tool:record_payment] overpayment of Rs ${excess} on ${inv.invoice_number} — recording as-is`);
      }

      // Determine new state
      let newState = inv.state;
      if (input.payment_type === 'balance' || newAmountPaid >= inv.amount_total) {
        newState = 'paid';
      } else if (input.payment_type === 'advance' && inv.state === 'unpaid') {
        newState = 'advance_paid';
      }

      // Update invoice record
      await supabase.from('invoices').update({
        amount_paid: newAmountPaid,
        state:       newState,
        updated_at:  new Date().toISOString(),
      }).eq('id', inv.id);

      console.log(`[tool:record_payment] ${inv.invoice_number} Rs ${input.amount_received} received — ${inv.state} -> ${newState}`);

      // ── Lead → client promotion (silent, best-effort) ──────────────
      // Trigger: state moved to advance_paid OR paid (skips repeat-promotion)
      if ((newState === 'advance_paid' || newState === 'paid') && inv.state !== newState && inv.lead_id) {
        try {
          const { data: linkedLead } = await supabase
            .from('leads')
            .select('id, name, phone, email, referrer_name, notes, client_id')
            .eq('id', inv.lead_id)
            .maybeSingle();

          if (linkedLead && !linkedLead.client_id) {
            const { client, created } = await resolveOrCreateClient(supabase, vendor.id, {
              name:          linkedLead.name || inv.client_name,
              phone:         linkedLead.phone || inv.client_phone,
              email:         linkedLead.email,
              source:        'lead_promotion',
              referrer_name: linkedLead.referrer_name,
              notes:         linkedLead.notes,
            });

            await supabase.from('leads')
              .update({ client_id: client.id })
              .eq('id', linkedLead.id);

            await supabase.from('invoices')
              .update({ client_id: client.id })
              .eq('id', inv.id);

            console.log(`[tool:record_payment] promoted lead ${linkedLead.id} -> client ${client.id} (created=${created})`);
          } else if (linkedLead?.client_id) {
            await supabase.from('invoices')
              .update({ client_id: linkedLead.client_id })
              .eq('id', inv.id);
            console.log(`[tool:record_payment] invoice ${inv.id} linked to existing client ${linkedLead.client_id}`);
          }
        } catch (promoteErr) {
          console.error('[tool:record_payment] promotion failed (non-fatal):', promoteErr.message);
        }
      }

      // ── Stage 2: advance paid → generate booking confirmation PDF ──
      if (newState === 'advance_paid') {
        try {
          const { data: v } = await supabase
            .from('vendors')
            .select('business_name, upi_id, routing_handle, user_id')
            .eq('id', vendor.id)
            .single();

          const { data: u } = await supabase
            .from('users')
            .select('name, phone')
            .eq('id', v.user_id)
            .single();

          // Cross-surface notification: only fire when this turn originated on WhatsApp.
          // PWA-initiated record_payment actions show their progress in the PWA chat reply
          // and should NOT also blast a WhatsApp message. Surface that started it owns it.
          if (channel === 'whatsapp' && u?.phone) {
            await sendWhatsApp(u.phone, "Got it — recording your payment. Generating the invoice PDF, just a moment...");
          }

          // PDF amount_advance = newAmountPaid (total paid by client so far).
          // inv.amount_advance is set at invoice creation and never updated by record_payment.
          // Using it directly produces stale numbers (e.g. invoice created with Rs 36k advance
          // but client paid Rs 5k — PDF would show Rs 36k received). newAmountPaid is always
          // accurate: it is the cumulative amount paid as of this turn.
          const pdfBuffer = await generateInvoicePdf({
            invoice:    { ...inv, amount_paid: newAmountPaid, amount_advance: newAmountPaid },
            vendor:     v,
            vendorName: u?.name || 'Vendor',
          });

          const fileName = `${vendor.id}/INVOICE-${inv.invoice_number.replace(/^TDW\//, '').replace(/\//g, '-').toUpperCase()}.pdf`;

          const { error: uploadErr } = await supabase.storage
            .from('invoices')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
              upsert:      true,
            });

          if (uploadErr) {
            console.error('[tool:record_payment] PDF upload failed:', uploadErr.message);
            return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Booking confirmed. PDF generation failed — try again or contact support.`;
          }

          // Signed URL valid for 1 year
          const { data: signedData } = await supabase.storage
            .from('invoices')
            .createSignedUrl(fileName, 60 * 60 * 24 * 365);

          if (signedData?.signedUrl) {
            await supabase.from('invoices')
              .update({ pdf_url: signedData.signedUrl })
              .eq('id', inv.id);
          }

          const balance    = inv.amount_total - newAmountPaid;
          const balanceStr = balance > 0 ? `Balance: Rs ${formatRs(balance)}.` : 'Fully paid.';
          const pdfUrl     = signedData?.signedUrl || null;

          console.log(`[tool:record_payment] PDF generated for ${inv.invoice_number} — ${fileName}`);

          // PDF is delivered as a separate WhatsApp message by the delivery
          // layer (src/index.js), so the vendor can forward it to the client
          // without the status text traveling along as a caption. Reply text
          // below is vendor-facing only — it should never reach the client.
          if (pdfUrl) attachments.push(pdfUrl);

          return `Recorded — Rs ${formatRs(input.amount_received)} from ${inv.client_name} (${inv.invoice_number}). ${balanceStr}`;

        } catch (pdfErr) {
          console.error('[tool:record_payment] PDF error:', pdfErr.message);
          return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Booking confirmed. PDF could not be generated: ${pdfErr.message}`;
        }
      }

      // ── Stage 3: balance paid → plain text, invoice closed ──────────
      if (newState === 'paid') {
        return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Invoice ${inv.invoice_number} fully paid (Rs ${formatRs(inv.amount_total)}). All done.`;
      }

      // ── Partial payment — invoice still open ─────────────────────────
      const remaining = inv.amount_total - newAmountPaid;
      return `Payment recorded — Rs ${formatRs(input.amount_received)} received from ${inv.client_name}. Rs ${formatRs(remaining)} still outstanding on ${inv.invoice_number}.`;
    }

    case 'list_invoices': {
      const state = input.state || 'unpaid';

      let query = supabase
        .from('invoices')
        .select('id, invoice_number, client_name, amount_total, amount_paid, state, due_date, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (state !== 'all') query = query.eq('state', state);

      const { data: invoices, error } = await query;
      if (error) return `Error fetching invoices: ${error.message}`;
      if (!invoices || invoices.length === 0) {
        return state === 'all' ? 'No invoices yet.' : `No ${state} invoices.`;
      }

      const lines = invoices.map(i => {
        const balance = i.amount_total - i.amount_paid;
        const due     = i.due_date ? `, due ${i.due_date}` : '';
        const bal     = balance > 0 ? `, balance Rs ${formatRs(balance)}` : ' (paid)';
        return `${i.invoice_number} — ${i.client_name} — Rs ${formatRs(i.amount_total)}${bal} — ${i.state}${due} (ID: ${i.id})`;
      }).join('\n');

      return `${invoices.length} invoice(s):\n${lines}`;
    }

    // ── get_invoice_pdf (Phase 2.7) ─────────────────────────────────────
    // Fetches the booking confirmation PDF for an invoice and queues it as a
    // WhatsApp media attachment (index.js picks up attachments[] and sends
    // as a separate Twilio media message). Uses the stored pdf_url first;
    // re-signs from the canonical storage path if missing or stale (handles
    // legacy TDW-* filenames too via the new path). Honest if no PDF exists.
    case 'get_invoice_pdf': {
      if (!input.invoice_id) return 'Invoice ID required — call list_invoices first to get it.';

      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name, state, pdf_url')
        .eq('id', input.invoice_id)
        .eq('vendor_id', vendor.id)
        .maybeSingle();

      if (invErr || !inv) return 'Invoice not found. Check the ID from list_invoices.';

      const clientLabel = input.client_name || inv.client_name;

      // No PDF exists until advance is recorded (Stage 2).
      if (!['advance_paid', 'paid'].includes(inv.state)) {
        return `No PDF yet for ${clientLabel}'s invoice (${inv.invoice_number}) — the booking confirmation PDF is generated once the advance payment is recorded.`;
      }

      let pdfUrl = inv.pdf_url || null;

      // If stored pdf_url is missing, re-sign from the canonical path.
      // Also handles legacy TDW-* files by trying the new INVOICE-* name.
      if (!pdfUrl) {
        try {
          const canonicalPath = `${vendor.id}/INVOICE-${inv.invoice_number.replace(/^TDW\//, '').replace(/\//g, '-').toUpperCase()}.pdf`;
          const { data: signed } = await supabase.storage
            .from('invoices')
            .createSignedUrl(canonicalPath, 60 * 60 * 24 * 365);
          if (signed?.signedUrl) {
            pdfUrl = signed.signedUrl;
            // Save the re-signed URL so future lookups are instant.
            await supabase.from('invoices').update({ pdf_url: pdfUrl }).eq('id', inv.id);
            console.log(`[tool:get_invoice_pdf] re-signed URL for ${inv.invoice_number}`);
          }
        } catch (signErr) {
          console.warn('[tool:get_invoice_pdf] re-sign failed:', signErr.message);
        }
      }

      if (!pdfUrl) {
        return `Couldn't retrieve the PDF for ${clientLabel}'s invoice (${inv.invoice_number}). The PDF may not have been generated — try recording the advance payment again if this seems wrong.`;
      }

      // Queue as WhatsApp attachment — index.js sends it as a Twilio media message.
      attachments.push(pdfUrl);
      console.log(`[tool:get_invoice_pdf] PDF queued for ${inv.invoice_number} — ${pdfUrl.slice(0, 60)}...`);
      return `Here's ${clientLabel}'s booking confirmation PDF (${inv.invoice_number}) — sending it now.`;
    }

    case 'log_expense': {
      if (!input.amount || input.amount <= 0) return 'Expense amount must be greater than zero.';

      const { data: expense, error } = await supabase.from('expenses').insert({
        vendor_id:      vendor.id,
        amount:         input.amount,
        category:       input.category,
        description:    input.description   || null,
        expense_date:   input.expense_date  || null,
        client_name:    input.client_name   || null,
        linked_lead_id: input.linked_lead_id || null,
        notes:          input.notes         || null,
      }).select('id, category, amount, expense_date').single();

      if (error) {
        console.error('[tool:log_expense] error:', error);
        return `Error logging expense: ${error.message}`;
      }

      const dateStr = expense.expense_date || new Date().toISOString().split('T')[0];
      console.log(`[tool:log_expense] Rs ${input.amount} — ${input.category} — ${dateStr}`);
      return `Expense logged — Rs ${formatRs(input.amount)}, ${input.category}${input.description ? `: ${input.description}` : ''}, ${dateStr}.`;
    }

    case 'send_to_couple': {
      if (!input.lead_id) return 'I need to know which client this is for. Who should I send it to?';
      if (!input.message || !input.message.trim()) return 'There is no message to send.';

      console.log(`[tool:send_to_couple] called with lead_id=${input.lead_id} vendor=${vendor.id}`);
      const { replyToCouple } = require('../lib/vendor/replyToCouple');
      const result = await replyToCouple(supabase, {
        vendor,
        leadId:  input.lead_id,
        message: input.message,
      });
      console.log(`[tool:send_to_couple] replyToCouple result: ok=${result.ok} error=${result.error || '-'} phone=${result.phone || '-'} lead=${result.lead?.name || '-'}/${result.lead?.phone || 'NO_PHONE'}`);

      if (!result.ok) {
        if (result.error === 'no_phone') {
          const who = result.lead?.name ? result.lead.name : 'this client';
          return `I couldn't send it — I don't have a phone number for ${who} on file. Add their number and I'll be able to message them.`;
        }
        if (result.error === 'window_closed') {
          const who = result.lead?.name ? result.lead.name : 'them';
          return `I can't message ${who} on WhatsApp right now — they haven't messaged in over 24 hours, so WhatsApp's reply window is closed. You'll need to message them directly. Want me to draft something you can copy and send?`;
        }
        console.error('[tool:send_to_couple] failed:', result.error);
        return `I couldn't send that message right now (${result.error}). Try again in a moment.`;
      }

      const who = result.lead?.name ? result.lead.name : 'them';
      console.log(`[tool:send_to_couple] sent to lead ${input.lead_id} (${who}) — thread ${result.threadId}`);
      return `Sent to ${who}. They'll see it on WhatsApp as part of your conversation with them.`;
    }

        case 'update_invoice_prefix': {
      const cleaned = (input.new_prefix || '').toUpperCase().trim().replace(/[^A-Z0-9\-\/]/g, '');
      if (!cleaned || cleaned.length < 2) {
        return 'Prefix too short. Use at least 2 characters e.g. "DRP" or "DEVROY".';
      }
      if (cleaned.length > 20) {
        return 'Prefix too long. Keep it under 20 characters.';
      }

      // Fetch current prefix and counter for warning message
      const { data: v } = await supabase
        .from('vendors')
        .select('invoice_prefix, invoice_counter')
        .eq('id', vendor.id)
        .single();

      const oldPrefix = v?.invoice_prefix || '(none)';

      await supabase
        .from('vendors')
        .update({ invoice_prefix: cleaned })
        .eq('id', vendor.id);

      console.log(`[tool:update_invoice_prefix] vendor ${vendor.id} — ${oldPrefix} -> ${cleaned}`);

      const nextNum = String((v?.invoice_counter || 0) + 1).padStart(2, '0');
      return `Invoice prefix updated to ${cleaned}. Your next invoice will be ${cleaned}/${nextNum}. Previous invoices keep their original numbers (${oldPrefix}/01 and onwards).`;
    }

        default:
      return `Unknown tool: ${name}`;
  }
}

module.exports = { runCoupleAgenticTurn };
