// engine.js — the agentic loop
// Session 4: adds create_lead, list_leads, update_lead_state tool handlers
// Session 5.5: adds runCoupleAgenticTurn for couple_thread conversations

const { buildCoupleSystemPrompt } = require('./coupleSystemPrompt');
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
const { captureField }          = require('../lib/coupleIdentity');
const { getReturningBrideIntent } = require('../lib/intentExtractor');
const { buildEnquiryEnrichment } = require('../lib/vendor/enquiryEnrichment');


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

// ── THE ATTRIBUTION BYTES — FOUNDER-VETOED 2026-08-11, HIS WORD 「 1 」 ────────
// APPROVED COPY CARRIES ITS DECISION, so the next session inherits the RULING and
// not just the string. Options were put to the founder and he took the NAMED form:
//
//     VETOED TEMPLATE:  `From <vendor's display name>: `
//     WORKED EXAMPLE:   「 From Rohan Mehta: Hi Priya — the amount for the
//                          December shoot is Rs 60,000. 」
//     RETIRED:          `Passed on from the vendor: ` — the generic form shipped
//                       at 7a7bc21 is RETIRED as the primary, not reworded. It
//                       survives BELOW as the fallback only.
//
// ── WHICH NAME · DERIVED BY CENSUS, NOT PICKED ──────────────────────────────
// The register is `vendorUser.name` FIRST, `vendor.business_name` SECOND — the
// person, then the studio. Cited, not asserted:
//   · `src/agent/coupleSystemPrompt.js` (symbol `buildCoupleSystemPrompt`) builds
//     exactly this precedence and speaks it to the bride ~30 times — it is the
//     register of HER OWN ROOM.
//   · THIS FILE already uses the identical precedence in the live bride-facing
//     tool-result copy that tells Eliza to say 「 I've passed this to X 」.
// COLUMN WITNESSES: `public.users.name` (col 3, docs/db/PUBLIC_SCHEMA.md:875) ·
// `public.vendors.business_name` (col 3, docs/db/PUBLIC_SCHEMA.md:981).
// NO LOOKUP IS PERFORMED. Both objects are already parameters of this function,
// and the history load is conversation-scoped to one `couple_thread`, which
// carries exactly one `vendor_id`. The prefix is computed ONCE per turn.
//
// ⚠ THE ESTATE DOES **NOT** SPEAK ONE NAME PER VENDOR TO A BRIDE, and this
// comment exists so the next reader is not surprised by it. Census (method: git
// grep on both column names, every hit read for who hears it; blind spot: the TS
// engine and dreamos-pwa were not censused). THREE LIVE bride-facing sites, TWO
// orders: `coupleSystemPrompt.js` and this file put the PERSON first;
// `src/agent/disambiguation.js` (symbol `vendorDisplayName`, asked of a couple
// holding threads with several vendors) puts the BUSINESS first. Filed as a
// finding at this sitting's seal. THIS BYTE JOINS THE THREAD'S OWN REGISTER —
// a relay reading 「 From Rohan Studios 」 while Eliza calls him 「 Rohan Mehta 」
// two lines later would show the bride two names for one vendor in one
// conversation, which is the only failure that matters here.
const RELAY_ATTRIBUTION_GENERIC = 'From the vendor: ';

// THE HONEST FALLBACK. A missing name renders the generic form. A name is NEVER
// invented, never guessed from another column, and never the phone number — an
// unnamed vendor is a fact about the row, not a gap to fill.
function relayAttributionPrefix(vendor, vendorUser) {
  const person = typeof (vendorUser && vendorUser.name) === 'string' ? vendorUser.name.trim() : '';
  const studio = typeof (vendor && vendor.business_name) === 'string' ? vendor.business_name.trim() : '';
  const name = person || studio;
  return name ? `From ${name}: ` : RELAY_ATTRIBUTION_GENERIC;
}

// Attribution applied at assembly. Anything that is not a relay row is returned
// byte-identical, so every pre-existing history shape is unchanged.
function markRelayProvenance(row, prefix) {
  const body = row.body || '';
  if (!body) return '';
  if (row.sent_by !== RELAY_SENT_BY) return body;
  return `${prefix}${body}`;
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

  // ONE computation, thread-lifetime: a couple_thread carries exactly one
  // vendor_id and both objects are already this function's parameters.
  const relayPrefix = relayAttributionPrefix(vendor, vendorUser);

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
      content: markRelayProvenance(m, relayPrefix),   // F-06.152 — in memory only
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

// CE-45 LCV-15 LSP_4 (L4-a): F-05.56's DEFUSED ISLAND (handleOnboarding, executeTool and every tool case in it, commit_event_proposals among them),
// callerless since ARC M5, is DELETED with its box; so are the requires only it read, WA_MUTATING_TOOLS, and src/agent/tools.js, systemPrompt.js and
// classifier.js. onboarding.js is kept callerless (R2). What remains is the couple lane: runCoupleAgenticTurn, byte-identical, the lone export.

module.exports = { runCoupleAgenticTurn };
