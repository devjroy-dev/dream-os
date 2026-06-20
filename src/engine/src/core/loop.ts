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
  model: 'haiku' | 'sonnet';
  escalated: boolean;
  tool_calls: { name: string; input: unknown; result: string; donna_calls?: { name: string; input: unknown; result: string }[] }[];
  cost_inr: number;
  tokens: { input: number; output: number; cache_read?: number; cache_write?: number };
  view: ViewRow[] | null; // rows to show for THIS turn (wakes the peek; fills the carousel)
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

export async function runTurn(args: {
  agentId: string;
  message: string;
  conversationId?: string;
  onEvent?: (e: TurnEvent) => void;
}): Promise<TurnResult> {
  const { agentId, message } = args;

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, tier, display_name, profession_preset, timezone, mode')
    .eq('id', agentId)
    .maybeSingle();
  if (error) throw new Error(`agent lookup failed: ${error.message}`);
  if (!agent) throw new Error(`agent not found: ${agentId}`);

  const tier = agent.tier as Tier;
  let model = startModelForTier(tier);
  let escalated = false;
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
    const dynamic = ownerBlock + `\n\n[${today}]\n` + factsBlock + snapshot + donnaMsgs + shelfBlock;
    const blocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: staticPrefix, cache_control: { type: 'ephemeral' } },
    ];
    if (dynamic.trim()) blocks.push({ type: 'text', text: dynamic });
    return blocks;
  };

  await saveMessage(conversationId, 'user', message);

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

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Victor's prose streamed token by token (victor_token) when a streaming door wired
    // onEvent; inert otherwise. finalMessage() assembles the SAME message .create() returned,
    // so everything below is unchanged.
    const stream = anthropic.messages.stream({
      model,
      max_tokens: 1024,
      system: buildSystem(),
      tools,
      messages,
    });
    stream.on('text', (delta) => args.onEvent?.({ type: 'victor_token', text: delta }));
    const resp = await stream.finalMessage();

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
      model = MODELS.sonnet;
      const idx = tools.findIndex((t) => t.name === 'escalate');
      if (idx >= 0) tools.splice(idx, 1);
      messages = [...priorTurns, { role: 'user', content: message }]; // clean re-run on Sonnet
      donnaSession = null; // fresh exchange on the re-run
      talks = 0;
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
        const donna = await runDonnaTurn(agentId, msg, donnaSession, today, todayIso, (a) => args.onEvent?.({ type: 'donna_action', name: a.name, input: a.input, result: a.result }));
        donnaSession = donna.session; // persist so the next dear_donna_talk RESUMES her
        totalIn += donna.input_tokens;
        totalOut += donna.output_tokens;
        costInr += donna.cost_inr;
        if (donna.mutated) mutatedThisRound = true;
        if (donna.view && donna.view.length) turnView = donna.view; // this ask produced a view

        // Donna's reply comes back in HER OWN VOICE, not a bare return. Logged as two
        // halves so the dialogue is legible: dear_donna_talk (Harvey -> Donna, with what
        // she actually did nested under it) and listen_harvey_talk (Donna -> Harvey).
        const said = donna.message.trim();
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

  await saveMessage(conversationId, 'assistant', reply, toolCalls.length ? toolCalls : undefined);

  // First-meeting greeting delivered on this turn → mark it so the opener never fires again,
  // on any device. consult_done gates ONLY the opening line, not the ongoing read of the owner.
  if (wasFirstMeeting) {
    await supabase.from('agent_owner').update({ consult_done: true }).eq('agent_id', agentId);
  }

  await supabase.from('usage').insert({
    agent_id: agentId,
    conversation_id: conversationId,
    model: modelLabel(model),
    input_tokens: totalIn,
    output_tokens: totalOut,
    cost_inr: costInr,
    escalated,
  });

  args.onEvent?.({ type: 'done', conversation_id: conversationId, cost_inr: costInr, view: turnView });

  return {
    reply,
    conversation_id: conversationId,
    model: modelLabel(model),
    escalated,
    tool_calls: toolCalls,
    cost_inr: costInr,
    tokens: { input: totalIn, output: totalOut, cache_read: cacheRead, cache_write: cacheWrite },
    view: turnView,
  };
}
