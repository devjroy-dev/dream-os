// loop.ts — the agentic loop. Harvey is the front; Donna is the engine in the hood.
//
// Wake-up order: working thread + durable facts + Donna's snapshot (the real state,
// kept true) → Harvey reasons → Harvey advises and, when something must be done,
// TALKS to Donna via `dear_donna_talk`. Harvey holds NO DB tools; the only operational
// path is through Donna. The channel is now TWO-WAY: Donna can answer or ask back (via
// her listen_harvey_talk), Harvey answers by calling dear_donna_talk again, and Donna
// RESUMES the same conversation — a real back-and-forth within one turn, not a one-shot.
// A fuse caps the exchange so a soul-waver can't loop into a runaway; the count itself
// is left to the souls to govern (we only watch how they naturally resolve it).
// Ground-truth-before-mutation lives in the tools; patch-from-confirmed-return lives in
// Donna (she patches the snapshot from each write's real result).
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './db.js';
import {
  MODELS, startModelForTier, canEscalate, calcCostInr, modelLabel, type Tier,
} from './models.js';
import { HARVEY_SOUL } from './harveySoul.js';
import { CONSULTANT_HARVEY_SOUL } from './consultantHarveySoul.js';
import { ESCALATE_TOOL } from './tools/donnaLead.js';
import { DEAR_DONNA_TALK_TOOL } from './tools/dearDonna.js';
import { DEAR_DONNA_HANDBOOK_TOOL } from './tools/dearDonnaHandbook.js';
import { snapshotText, runDonnaTurn, type DonnaSession } from './donna.js';
import type { ViewRow } from './snapshotTypes.js';
import { todayLine, todayISO } from './today.js';
import { resolveField, getHandbookIndex, getHandbookFull, getSection } from './handbook.js';
import {
  getOrCreateConversation, saveMessage, loadFacts, loadOwner, donnaMessages, type ThreadMessage,
} from './memory.js';

// Outer cap on Harvey's own iterations. Raised from 6 to give room for a multi-exchange
// Harvey<->Donna conversation (each dear_donna_talk is one Harvey iteration) plus a
// handbook lookup and his final reply. The Harvey<->Donna exchange itself is bounded by
// TALK_FUSE below, not by this.
const MAX_ITERATIONS = 12;
// The fuse on the Harvey<->Donna back-and-forth. A healthy exchange (he is impatient)
// converges in one or two; this only trips if they genuinely circle, turning a runaway
// into a logged abort. It does NOT shape how they talk — it makes a loop observable
// and safe instead of a hung, billing turn. Soul governs the real count.
const TALK_FUSE = 5;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type TurnResult = {
  reply: string;
  conversation_id: string;
  model: string; // TDW_02 P5: widened — non-anthropic routes carry their real model string
  escalated: boolean;
  tool_calls: { name: string; input: unknown; result: string; donna_calls?: { name: string; input: unknown; result: string }[] }[];
  provider_downgrade?: boolean; // TDW_02 P5: a non-anthropic hand failed mid-turn; door logs it
  cost_inr: number;
  tokens: { input: number; output: number; cache_read?: number; cache_write?: number };
  view: ViewRow[] | null; // rows to show for THIS turn (wakes the peek; fills the carousel)
  // TDW_04 B6 sitting 2 (Q-B4-6(b), R-B6-3): the id of the assistant row saved at
  // :523 — the door's composed-reply save (F-04.41's cure) patches the door lines
  // onto exactly this row, never a guessed one. Absent when the save missed.
  assistant_message_id?: string;
  // TDW_06 D-6 (F-04.81's mechanical half; the §0.2 report's proposed trigger,
  // SITING RULED HERE): Donna's session ended this turn holding pendingToolUseId —
  // she spoke ALONE (donna.ts: `work.length === 0` -> `pendingToolUseId = listen.id`),
  // i.e. "she asked and is waiting for an answer" — and the turn ended before that
  // answer could arrive. This field carries her final message text in exactly that
  // state, and is absent/empty otherwise. A mechanical signal already on the wire,
  // no language detection (Q-R-3's aesthetic, one rule further in). The door's guard
  // (chat.js::donnaOpenLine) reads it beside the turn's nested donna_calls — the
  // only convicting reader, per D-1.
  pendingDonnaQuestion?: string;
};

// Live beats — surfaced as they happen, ONLY when runTurn is handed an onEvent
// callback (the streaming door). The non-streaming path passes none, so every emit
// below is inert. Mirrors dreamai's TurnEvent so the door + PWA translate identically.
export type TurnEvent =
  | { type: 'dispatch'; to: 'donna'; message: string }
  | { type: 'victor_token'; text: string }
  | { type: 'donna_action'; name: string; input: unknown; result: string }
  | { type: 'donna_report'; message: string }
  | { type: 'answer'; reply: string }
  | { type: 'done'; conversation_id: string; cost_inr: number; view: ViewRow[] | null };

// The turn's argument contract. NAMED, not inlined, for one reason: shape (d) below
// gives it two referents (the guarded export and the inner body), and TypeScript needs
// the contract to have one home. MOVED VERBATIM from runTurn's inline signature — the
// diff shows relocation, never a rewrite (§3.1's standard for a moved thing).
type RunTurnArgs = {
  agentId: string;
  message: string;
  conversationId?: string;
  calendarSnapshot?: string;
  scratchpad?: string;
  recentActivity?: string; // TDW_02 P4 (CE-4): door-built cross-surface activity block
  // TDW_02 P5 — the facade seams (Amendment One CE-7: tier is a read-through at turn
  // start, NEVER a backfill of agents.tier). All optional; ABSENT => the pre-facade
  // anthropic path runs byte-identical (regression law, acceptance 9).
  tierOverride?: Tier;      // engine tier mapped from the PRODUCT tier at the door
  modelOverride?: string;   // set ONLY on non-anthropic routes: one model, both hands
  transport?: { provider: string; stream: (p: unknown) => any; create: (p: unknown) => Promise<any> };
  // TDW_02 P7 (Amendment Two): Donna's hand may route separately (LD-7 role split).
  // ABSENT => she follows Victor's wiring exactly as P5 shipped it.
  donnaTransport?: { provider: string; stream: (p: unknown) => any; create: (p: unknown) => Promise<any> };
  donnaModelOverride?: string;
  onEvent?: (e: TurnEvent) => void;
};

// ══════════════════════════════════════════════════════════════════════════
// THE TOMBSTONE — F-04.51's cure. Shape (d), CE-ruled 2026-07-16.
// ══════════════════════════════════════════════════════════════════════════
//
// THE DISEASE, WITNESSED (turn log 2026-07-16, 09:40-09:44): saveMessage(user) at the
// top of the body commits BEFORE the model call. Two turns died on an Anthropic balance
// exhaustion and BOTH persisted the user's message with no assistant reply. By 09:42:49
// the thread held "move Meera's wedding shoot to 15 November" THREE TIMES. Victor
// answered the third in 1.36s, tool_calls: null — "Done." — reading the orphans as
// already-handled. Then: "I have Meera's wedding locked at 15 November as of the last
// move." IT NEVER WAS. He was reading HIS OWN FABRICATED "Done" as estate fact. The
// balance was refilled; the thread stayed poisoned. AN OUTAGE BECAME A DATA-INTEGRITY
// EVENT. No orphan may ever again read as handled.
//
// THE MECHANISM: this function had NO OUTER TRY. The only try (the streamCall's) rethrows
// whenever the provider is anthropic — its downgrade branch is for NON-anthropic
// transports only — so a balance exhaustion propagates straight out, past a user row that
// has already landed.
//
// LINE NUMBERS, ONCE, HONESTLY: F-04.51's literature (the finding, the charter §2.1, the
// spine packet) cites this file at 0b0f260 — saveMessage(user) :218 · the streamCall's
// rethrow :285 · saveMessage(assistant) :403 · the agent_owner stamp :408 · the usage
// insert :430 · the return :445. THIS WRAPPER'S INSERT MOVED ALL OF THEM DOWN. They are
// named below by STATEMENT, never by number, for exactly that reason: the next reader is
// instructed to verify every file:line against HEAD, and a comment citing :285 would send
// them to the wrong place and earn a drift finding it deserved. Grep the statement.
//
// WHY (d) AND NOT THE THREE COSTED SHAPES — the charter ordered the lean verified and
// the verification killed it:
//   (a) wrap the body    — a 4-line change buried in a 226-line/200-non-blank re-indent
//                          of the function every turn in the estate runs through.
//   (b) wrapper export   — RULED OUT ON EVIDENCE. Its premise was that a second
//                          getOrCreateConversation call is "idempotent and cheap". Read
//                          whole at the spine sitting: it is NOT cheap (neither prod door
//                          passes a conversationId, so the unforced path runs: select
//                          latest + loadThread's 20-row load + update = THREE round
//                          trips, not one query); it is NOT a lookup (it WRITES on every
//                          path — last_active_at always, state:'active' on the forced
//                          path, abandon+insert on the stale one); and its identity is
//                          divergent past CONVERSATION_TIMEOUT_MIN — the second call
//                          would ABANDON the turn's own conversation and insert a new
//                          one, filing the tombstone in a thread that does not hold the
//                          user's message. A hang is what takes that long, and a hang is
//                          this cure's own use case.
//   (c) catch per site   — the escape surface is not the throw statements; it is the 8
//                          awaits below plus the streamCall's rethrow. Nine-plus points,
//                          and you must prove
//                          you found them all. §0.3 says you will not.
//   (d) THIS            — the inner body PUBLISHES the id it computes; the wrapper never
//                          re-derives it. One getOrCreateConversation call, unchanged, at
//                          its original site. Zero re-indent. Callers untouched: the
//                          export name never moves (server.ts:8, chat.js:24, index.js:29,
//                          smoke.js's typeof assertion all read `runTurn`).
//
// THE §1.5 HAZARD, GUARD CE-RULED IN: saveMessage(assistant) lands well before the
// return — the agent_owner consult stamp and the usage-ledger insert both await between
// them. A naively-scoped catch would append "no reply was generated" to a
// thread that had just saved a real one: F-04.51's own disease — a thread that lies to
// the next turn — REBUILT INSIDE ITS CURE. So the catch fires ONLY on
// `ctx.conversationId && !ctx.saved`, and ALWAYS rethrows: the door's error path is
// preserved byte-for-byte and a real reply can never gain a tombstone denying it.
type TurnCtx = {
  // Published ONLY once the user row has landed (see the publish site's note — it is a
  // guard, not a convenience). Absent => nothing was recorded => nothing to mark.
  conversationId?: string;
  // Set the instant the real assistant row lands. true => a true reply is on the thread
  // and NOTHING may overwrite or contradict it.
  saved?: boolean;
};

// FOUNDER-BLESSED VERBATIM (2026-07-16), machine-voice deliberate: an outage must not
// sound like Victor. A persona impersonating health during failure IS the disease.
// Copy law: no persona name in product chrome. Do not rewrite this string.
const TOMBSTONE = 'ERROR — no reply was generated (provider failure). Nothing was done.';

export async function runTurn(args: RunTurnArgs): Promise<TurnResult> {
  const ctx: TurnCtx = {};
  try {
    return await runTurnInner(args, ctx);
  } catch (e) {
    // The user's message is already on the thread. Mark it answered-by-failure so the
    // next turn cannot read the orphan as handled.
    if (ctx.conversationId && !ctx.saved) {
      try {
        await saveMessage(ctx.conversationId, 'assistant', TOMBSTONE);
      } catch (tombErr) {
        // The tombstone is a courtesy to the next turn; it NEVER masks the real failure.
        // eslint-disable-next-line no-console
        console.error('[tombstone] could not write the failure row:', (tombErr as Error).message);
      }
    }
    throw e; // the door's error path, unchanged
  }
}

async function runTurnInner(args: RunTurnArgs, ctx: TurnCtx): Promise<TurnResult> {
  const { agentId, message } = args;

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, tier, display_name, profession_preset, timezone, mode')
    .eq('id', agentId)
    .maybeSingle();
  if (error) throw new Error(`agent lookup failed: ${error.message}`);
  if (!agent) throw new Error(`agent not found: ${agentId}`);

  const tier = (args.tierOverride ?? agent.tier) as Tier; // CE-7 read-through
  let model = args.modelOverride ?? startModelForTier(tier);
  let escalated = false;
  // The turn's transport. On downgrade (non-anthropic fidelity/API failure) this
  // flips to null for the REMAINDER of the turn — pure anthropic Haiku, spec P5.
  let transport = args.transport ?? null;
  let providerDowngrade = false;
  const streamCall = (params: unknown) =>
    transport ? transport.stream(params) : anthropic.messages.stream(params as Anthropic.MessageStreamParams);
  // CONSULT MODE: a standalone domain-expert session (consultantHarvey). No Donna, no
  // owner/snapshot/facts, no first-meeting gate — ephemeral. The whole Codex rides as
  // his preparation. Everything advisory does with Donna is skipped below when consult.
  const isConsult = (agent.mode as string | null) === 'consult';

  // ── Wake-up read: working thread + durable facts + Donna's snapshot ────────
  const { conversationId, thread } = await getOrCreateConversation(agentId, args.conversationId);
  // Consult sessions are ephemeral: no owner anchor, no durable facts, no Donna snapshot.
  const { block: ownerBlock, consultDone } = isConsult
    ? { block: '', consultDone: true }
    : await loadOwner(agentId); // who he works for — Donna's briefing
  const wasFirstMeeting = !isConsult && !consultDone; // consult has no first-meeting gate
  const factsBlock = isConsult ? '' : await loadFacts(agentId);
  let snapshot = isConsult ? '' : await snapshotText(agentId); // Donna hands Harvey the real state
  const donnaMsgs = isConsult ? '' : await donnaMessages(conversationId); // his Donna exchange this conversation (session-scoped)

  // ── Document Shelf: PASSIVE sight of what Donna holds (Bible 5.1.6). The titles
  //    of every live Brief stand in Harvey's dynamic context each turn — full title
  //    + page count, never the sections, never the content. Ambient awareness, not
  //    a tool: he must never have to elect to look, or the confidence-triggered-
  //    retrieval gap (the RBI mislabel, 2026-06-11) returns. He still goes to Donna
  //    (dear_donna_talk) for every actual fact; the shelf line only tells him WHICH
  //    document exists, by name, so he routes and names it cleanly. Dynamic (never
  //    cached): changes when documents are added. Consult mode has no Donna, no shelf.
  let shelfBlock = '';
  if (!isConsult) {
    const { data: shelfRows } = await supabase
      .from('briefs')
      .select('title, pages')
      .eq('agent_id', agentId)
      .is('superseded_by', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (shelfRows && shelfRows.length) {
      const lines = shelfRows.map((b) => {
        const pages = b.pages ? ` \u00b7 ${b.pages} pages` : '';
        return `  \u00b7 ${b.title}${pages}`;
      });
      shelfBlock =
        `\n\n[Document Shelf — the documents Donna holds for you:\n` +
        lines.join('\n') +
        `]\n`;
    }
  }

  // ── Field + referencer: tell Harvey his client's trade, and put the Codex
  //    index in front of him so he knows what he can consult. Resolved from the
  //    agent's profession_preset; if no handbook exists for the field, Harvey
  //    advises without a referencer rather than claiming one he lacks.
  const field = resolveField(agent.profession_preset as string | null);
  // ADVISORY: index in front of Harvey, sections pulled via dear_donna_handbook.
  // CONSULT: the WHOLE Codex loaded as his silent preparation — no index, no retrieval,
  // no Donna. He speaks from it as his own knowledge and never names it.
  const handbook = isConsult ? null : await getHandbookIndex(field);
  const consultPrep = isConsult ? await getHandbookFull(field) : null;
  // VENDOR SUIT -- the always-on SMM lens. Every advisory Victor carries the social-
  // media Codex whole, as his own standing mastery (the analyst 'method' construction,
  // repurposed), because wedding vendors live on Instagram. Not loaded for consult.
  const smmLens = isConsult ? null : await getHandbookFull('social_media_management');
  let fieldBlock = '';
  if (isConsult) {
    if (consultPrep) {
      fieldBlock =
        `\n\n[YOUR PREPARATION for this room — the field is ${consultPrep.field.replace(/_/g, ' ')}. This is what you have already studied, cold, before the client sat down. It is yours; you speak from it as your own knowledge and you never name it, never point to it, never call it a reference or a codex. There is only you and what you know.]\n` +
        consultPrep.full_md + '\n';
    } else if (agent.profession_preset) {
      fieldBlock = `\n\n[The field is ${String(agent.profession_preset)}. You have no prepared material for it — advise from what you know and name plainly what you'd need.]\n`;
    }
  } else {
    // VENDOR SUIT -- the two-handbook lens: SMM always-on standing mastery + the
    // vendor's trade Codex as the retrievable overlay. In dreamaivendor every advisory
    // agent is a vendor, so advisory carries SMM always-on.
    let block = '';
    if (smmLens) {
      block +=
        `\n\n[YOUR STANDING EXPERTISE — social media and the creator economy, always open to you. Your clients live on Instagram; you carry this whole and reason from it as your own mastery. You never name it, never point to it, never call it a reference. There is only you and what you know.]\n` +
        smmLens.full_md + '\n';
    }
    if (handbook) {
      block +=
        `\n\n[Your client's field: ${handbook.field.replace(/_/g, ' ')}]\n` +
        `[Your reference — ${handbook.title ?? 'the Codex'} — index below. Consult any section by number via dear_donna_handbook.]\n` +
        handbook.index_md + '\n';
    } else if (agent.profession_preset) {
      block += `\n\n[Your client's specific trade: ${String(agent.profession_preset)}. You have no indexed reference for this trade yet — advise from what you know and from your standing expertise, and name what you'd need.]\n`;
    }
    fieldBlock = block;
  }

  // Prompt caching (matches the dream-os bride engine pattern): the STATIC prefix —
  // Harvey's soul + the Codex index — is identical every turn and every loop
  // iteration, so we mark it cache_control:ephemeral and pay full rate for it only
  // once per ~5-min window; subsequent calls read it ~10% cost. The DYNAMIC tail —
  // this owner's live facts + Donna's snapshot — is never cached (it changes per turn,
  // and the snapshot is re-read mid-turn after a mutation). Tools ride the cached
  // prefix automatically. Donna is left uncached on purpose: her prompt (~1.1k tokens)
  // is below the Haiku 2048-token cache minimum, so caching it would no-op.
  const staticPrefix = (isConsult ? CONSULTANT_HARVEY_SOUL : HARVEY_SOUL) + fieldBlock;
  // The clock: today's date, in the owner's timezone, in the DYNAMIC (never-cached)
  // block — it changes daily and must never be cached stale. Reaches Harvey here;
  // Donna reads the same date via todayLine() in her own runtime.
  const today = todayLine(agent.timezone as string | null);
  const todayIso = todayISO(agent.timezone as string | null);
  const buildSystem = (): Anthropic.TextBlockParam[] => {
    const calBlock = args.calendarSnapshot ? `\n\n${args.calendarSnapshot}` : '';
    const actBlock = args.recentActivity ? `\n\n${args.recentActivity}` : ''; // TDW_02 P4 (CE-4), never cached
    const dynamic = ownerBlock + `\n\n[${today}]\n` + factsBlock + snapshot + donnaMsgs + shelfBlock + calBlock + actBlock;
    const blocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: staticPrefix, cache_control: { type: 'ephemeral' } },
    ];
    if (dynamic.trim()) blocks.push({ type: 'text', text: dynamic });
    return blocks;
  };

  await saveMessage(conversationId, 'user', message);
  // ── (d): THE PUBLISH, AND ITS SITE IS THE WHOLE GUARD ─────────────────────
  // The wrapper never re-derives this id (that was shape (b), ruled out on evidence);
  // the body hands it up. ONE getOrCreateConversation call, one source of thread identity.
  //
  // IT IS PUBLISHED **HERE**, NOT AT THE RESOLVE ABOVE, AND THE SPINE BENCH IS WHY.
  // The spine's own §1.4 sketch said "publish at the resolve" — written from reading, and
  // WRONG. Between the resolve and this line sit loadOwner / loadFacts / snapshotText /
  // donnaMessages / the shelf read — every one an await that can throw. Published early,
  // a throw in that window tombstones a thread WITH NO USER ROW IN IT: an assistant row
  // denying a reply to a message that was never recorded, and on a FRESH conversation it
  // becomes the thread's FIRST message — leaving loadThread to open every later turn's
  // messages array with an assistant turn. F-04.51's disease (a thread that lies to the
  // next turn) rebuilt INSIDE its cure. Witnessed on the bench, T-4, before it shipped.
  //
  // The tombstone marks an ORPHAN. An orphan requires a user row. There is now a user row.
  // (The CE's ruled predicate — `ctx.conversationId && !ctx.saved` — is untouched; only
  // the sketch's publish site moved. A turn that dies above this line leaves NOTHING,
  // which is exactly right: nothing was recorded, so nothing needs answering.)
  ctx.conversationId = conversationId;

  // Harvey holds NO DB tools — only the two-way line to Donna, his own reference lookup
  // (+ escalate on mid tier). dear_donna_handbook only when a handbook exists.
  // Consult Harvey has NO Donna and NO tools — he is standalone, all knowledge already
  // in his preparation. Advisory keeps the Donna line, handbook lookup, and escalate.
  const tools: Anthropic.Tool[] = [];
  if (!isConsult) {
    tools.push(DEAR_DONNA_TALK_TOOL);
    if (handbook) tools.push(DEAR_DONNA_HANDBOOK_TOOL);
    if (canEscalate(tier)) tools.push(ESCALATE_TOOL);
  }

  const priorTurns: Anthropic.MessageParam[] = (thread as ThreadMessage[]).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  let messages: Anthropic.MessageParam[] = [...priorTurns, { role: 'user', content: message }];

  let reply: string | null = null;
  let turnView: ViewRow[] | null = null; // the latest READ's rows become this turn's view
  let accumulatedText = ''; // Harvey's counsel, captured from EVERY iteration — not
                            // just the terminal no-tool one. Fixes the bug where text
                            // emitted alongside a tool call (advise-while-delegating)
                            // was discarded, leaving only a "Got it." stub.
  let totalIn = 0, totalOut = 0, costInr = 0;
  let cacheRead = 0, cacheWrite = 0; // surfaced so the cache hit is visible in /chat
  const toolCalls: TurnResult['tool_calls'] = [];

  // The two-way exchange state, carried across Harvey's iterations within this turn.
  let donnaSession: DonnaSession | null = null; // Donna's live conversation, for resume
  let talks = 0;                                // Harvey<->Donna round-trips this turn
  // TDW_06 D-6: her open question, tracked beside the session. Set from each
  // exchange's own return — non-empty exactly while the session holds
  // pendingToolUseId (she ended by speaking ALONE and is waiting); a later
  // exchange that resumes and resolves her clears it, because runDonnaTurn
  // resets pendingToolUseId per segment and only re-arms it on listen-alone.
  let pendingDonnaQuestion = '';

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Victor's prose streamed token by token (victor_token) when a streaming door wired
    // onEvent; inert otherwise. finalMessage() assembles the SAME message .create() returned,
    // so everything below is unchanged.
    let resp: Anthropic.Message;
    try {
      const stream = streamCall({
        model,
        max_tokens: 1024,
        system: buildSystem(),
        tools,
        messages,
      });
      stream.on('text', (delta: string) => args.onEvent?.({ type: 'victor_token', text: delta }));
      resp = await stream.finalMessage();
      // Fidelity gate (non-anthropic): malformed tool_use input => throw into the fallback.
      if (transport && transport.provider !== 'anthropic') {
        for (const b of resp.content) {
          if (b.type === 'tool_use' && (b.input === null || typeof b.input !== 'object')) {
            throw new Error(`tool_fidelity: ${b.name}`);
          }
        }
      }
    } catch (e) {
      if (transport && transport.provider !== 'anthropic') {
        // ONE silent same-turn downgrade to Haiku (spec P5). Logged; door writes activity.
        // eslint-disable-next-line no-console
        console.warn(`[provider_downgrade] ${transport.provider} failed (${(e as Error).message}) — Haiku for the rest of this turn`);
        providerDowngrade = true;
        transport = null;
        model = MODELS.haiku;
        i--; // re-run this iteration on the fallback
        continue;
      }
      throw e;
    }

    totalIn += resp.usage?.input_tokens ?? 0;
    totalOut += resp.usage?.output_tokens ?? 0;
    cacheRead += resp.usage?.cache_read_input_tokens ?? 0;
    cacheWrite += resp.usage?.cache_creation_input_tokens ?? 0;
    costInr += calcCostInr(model, resp.usage?.input_tokens ?? 0, resp.usage?.output_tokens ?? 0, resp.usage?.cache_read_input_tokens ?? 0, resp.usage?.cache_creation_input_tokens ?? 0);

    const toolUse = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');

    // Capture any text Harvey emitted THIS iteration, whether or not he also called a
    // tool. The last non-empty text he produces is his counsel — keep it.
    const textThisRound = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('\n').trim();
    if (textThisRound) accumulatedText = textThisRound;

    if (toolUse.length === 0) {
      reply = textThisRound || accumulatedText || 'Got it.';
      break;
    }

    const esc = toolUse.find((t) => t.name === 'escalate');
    if (esc && !escalated) {
      escalated = true;
      model = MODELS.sonnet; // escalate is anthropic-dimension only (mid/top tiers route anthropic)
      const idx = tools.findIndex((t) => t.name === 'escalate');
      if (idx >= 0) tools.splice(idx, 1);
      messages = [...priorTurns, { role: 'user', content: message }]; // clean re-run on Sonnet
      donnaSession = null; // fresh exchange on the re-run
      talks = 0;
      pendingDonnaQuestion = ''; // D-6: the re-run's exchange starts clean too
      continue;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    let mutatedThisRound = false;
    for (const tu of toolUse) {
      let result: string;
      if (tu.name === 'dear_donna_talk') {
        const msg = (tu.input as { message?: string }).message ?? '';

        // Fuse: if Harvey and Donna have gone back and forth past the cap without
        // closing, stop the exchange (logged) and tell Harvey to wrap up to the client.
        if (talks >= TALK_FUSE) {
          // eslint-disable-next-line no-console
          console.log(`[H<->D] FUSE TRIPPED at ${talks} exchanges — agent ${agentId}, conv ${conversationId}`);
          const abort =
            "You and Donna have gone back and forth several times without closing this. " +
            "Stop here: tell the client what you have and what is still open, in your own voice.";
          toolCalls.push({ name: 'dear_donna_talk', input: tu.input, result: '(exchange limit reached)' });
          results.push({ type: 'tool_result', tool_use_id: tu.id, content: abort });
          continue;
        }

        talks++;
        // eslint-disable-next-line no-console
        console.log(`[H->D #${talks}] ${msg}`);

        args.onEvent?.({ type: 'dispatch', to: 'donna', message: msg });
        const donna = await runDonnaTurn(agentId, msg, donnaSession, today, todayIso, (a) => args.onEvent?.({ type: 'donna_action', name: a.name, input: a.input, result: a.result }), args.scratchpad, message, (args.donnaTransport ?? transport) ?? undefined, args.donnaModelOverride ?? args.modelOverride);
        donnaSession = donna.session; // persist so the next dear_donna_talk RESUMES her
        totalIn += donna.input_tokens;
        totalOut += donna.output_tokens;
        // 02-HOTFIX (2026-07-15): her cache buckets fold into the turn totals so the
        // ledger sees the WHOLE turn's billing shape, not just Victor's. (On the
        // anthropic path she is uncached today, so these are zero — the seam exists
        // for the day Block 06 caches her, and for compat endpoints that report buckets.)
        cacheRead += donna.cache_read_tokens;
        cacheWrite += donna.cache_write_tokens;
        costInr += donna.cost_inr;
        if (donna.mutated) mutatedThisRound = true;
        if (donna.view && donna.view.length) turnView = donna.view; // this ask produced a view

        // Donna's reply comes back in HER OWN VOICE, not a bare return. Logged as two
        // halves so the dialogue is legible: dear_donna_talk (Harvey -> Donna, with what
        // she actually did nested under it) and listen_harvey_talk (Donna -> Harvey).
        const said = donna.message.trim();
        // TDW_06 D-6: pendingToolUseId is the trigger (donna.ts's listen-ALONE arm);
        // her final message text is what the guard's line will quote. An exchange
        // that resolved her (work+listen, or a fresh segment) writes '' here.
        pendingDonnaQuestion = donna.session.pendingToolUseId ? said : '';
        const voiced = /^listen[,\s]+harvey/i.test(said) ? said : `Listen Harvey \u2014 ${said}`;
        // eslint-disable-next-line no-console
        console.log(`[D->H #${talks}] ${voiced}`);
        args.onEvent?.({ type: 'donna_report', message: voiced });

        toolCalls.push({
          name: 'dear_donna_talk',
          input: tu.input,
          result: '(handed to Donna)',
          donna_calls: donna.tool_calls.map((dc) => ({ name: dc.name, input: dc.input, result: dc.result })),
        });
        toolCalls.push({ name: 'listen_harvey_talk', input: { message: msg }, result: voiced });

        results.push({ type: 'tool_result', tool_use_id: tu.id, content: voiced });
        continue;
      } else if (tu.name === 'dear_donna_handbook') {
        const ref = (tu.input as { ref?: string }).ref ?? '';
        const section = await getSection(field, ref);
        result = section ?? `No section "${ref}" found in your reference. Check the index for the right number.`;
      } else if (tu.name === 'escalate') {
        result = 'Already escalated.';
      } else {
        result = `Unknown tool: ${tu.name}`;
      }
      toolCalls.push({ name: tu.name, input: tu.input, result });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
    }

    // Donna already patched the snapshot surgically from each confirmed write.
    // Re-read it so the rest of the turn reasons on the true, post-write state.
    if (mutatedThisRound) snapshot = await snapshotText(agentId);

    messages.push({ role: 'assistant', content: resp.content });
    messages.push({ role: 'user', content: results });
  }

  if (!reply) reply = accumulatedText || 'Hmm, that took longer than expected — try that again?';

  args.onEvent?.({ type: 'answer', reply });

  // TDW_04 B6 sitting 2 (Q-B4-6(b)): the id is captured, not discarded — the door's
  // composed-reply save targets exactly this row. saveMessage's widened return is
  // null on a missed insert; the field simply stays absent and the door writes nothing.
  const assistantMessageId = await saveMessage(conversationId, 'assistant', reply, toolCalls.length ? toolCalls : undefined);
  // (d)'s §1.5 guard, CE-ruled: a real reply has landed. Everything below — the
  // agent_owner consult stamp, the usage-ledger insert — can still throw, and if it does
  // the wrapper must NOT tombstone a thread that already holds the true answer.
  ctx.saved = true;

  // First-meeting greeting delivered on this turn → mark it so the opener never fires again,
  // on any device. consult_done gates ONLY the opening line, not the ongoing read of the owner.
  if (wasFirstMeeting) {
    await supabase.from('agent_owner').update({ consult_done: true }).eq('agent_id', agentId);
  }

  // 02-HOTFIX (2026-07-15): the ledger records the cache buckets. Root cause of the
  // "stripped ~900-token calls" field-report item: a cold-cache turn bills its ~32.5k
  // prefix (soul + Codex + TOOLS) as cache_creation_input_tokens — a bucket this table
  // had no column for — so fresh-input-only rows read like toolless calls with broken
  // cost math. Nothing was stripped; the ledger was blind. Column-guarded like
  // donnaLead's writeLead: a pre-DDL database degrades to the old row shape, honestly
  // logged, and NEVER loses the ledger row (caps count on these rows — CE-6).
  const usageRow: Record<string, unknown> = {
    agent_id: agentId,
    conversation_id: conversationId,
    model: args.modelOverride ? model : modelLabel(model), // raw string on routed providers
    input_tokens: totalIn,
    output_tokens: totalOut,
    cost_inr: costInr,
    escalated,
    cache_read_tokens: cacheRead,
    cache_write_tokens: cacheWrite,
  };
  {
    const { error: usageErr } = await supabase.from('usage').insert(usageRow);
    if (usageErr && /cache_(read|write)_tokens/i.test(usageErr.message)) {
      // eslint-disable-next-line no-console
      console.warn('[usage] cache columns absent (apply the 02-HOTFIX engine DDL) — wrote without them');
      const { cache_read_tokens: _cr, cache_write_tokens: _cw, ...bare } = usageRow;
      const { error: bareErr } = await supabase.from('usage').insert(bare);
      if (bareErr) console.error('[usage] ledger write failed:', bareErr.message);
    } else if (usageErr) {
      // eslint-disable-next-line no-console
      console.error('[usage] ledger write failed:', usageErr.message);
    }
  }

  args.onEvent?.({ type: 'done', conversation_id: conversationId, cost_inr: costInr, view: turnView });

  return {
    reply,
    conversation_id: conversationId,
    model: args.modelOverride ? model : modelLabel(model),
    escalated,
    provider_downgrade: providerDowngrade || undefined,
    tool_calls: toolCalls,
    cost_inr: costInr,
    tokens: { input: totalIn, output: totalOut, cache_read: cacheRead, cache_write: cacheWrite },
    view: turnView,
    assistant_message_id: assistantMessageId || undefined, // Q-B4-6(b): the row the door may patch
    pendingDonnaQuestion: pendingDonnaQuestion || undefined, // D-6: absent when no open question
  };
}
