// donna.ts — DONNA's runtime: the engine in the hood.
//
//   snapshotText(agentId)        — the durable near-horizon note, formatted for
//                                  Harvey's context. Reads agent_snapshot; builds it
//                                  once if missing. Patched surgically, not rebuilt.
//   runDonnaTurn(agentId, msg, prior) — Donna as an always-Haiku agent, now RESUMABLE.
//                                  Takes Harvey's message (an instruction, or his answer
//                                  to what she just asked), does the work against ground
//                                  truth, PATCHES the snapshot from each confirmed write,
//                                  and speaks back to Harvey (via listen_harvey_talk, or
//                                  plain text as a fallback). Returns her session so the
//                                  next call resumes the same conversation — a real
//                                  back-and-forth, not a one-shot.
//
// Harvey does the hard parse and hands Donna clean, simple lines; Donna is ALWAYS Haiku.
// The snapshot is her durable working-copy of what's open and near; the source tables
// remain ground truth.
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './db.js';
import { MODELS, calcCostInr } from './models.js';
import { DONNA_SOUL } from './donnaSoul.js';
import { RECORD_TOOLS, executeRecordTool, recordItem } from './tools/recordPrimitives.js'; // recordItem: TDW_04 engine-lane (ST-3a)
import { READ_TOOLS, READ_TOOL_NAMES, executeFindTool, executeWhatsDue } from './tools/donnaFind.js';
import { BENCH_READ_TOOLS, BENCH_READ_NAMES, executeTally, executeHistory } from './tools/donnaBench.js';
import { SHELF_READ_TOOLS, SHELF_READ_NAMES, executeShelf, executeBriefRead } from './tools/donnaShelf.js';
import { REVIEW_READ_TOOLS, REVIEW_READ_NAMES, executeReviewRead } from './tools/donnaReviewRead.js';
import { DONNA_VERDICT_TOOL, executeDonnaVerdict } from './tools/donnaVerdict.js';
import { DONNA_REVIEW_TOOL, executeDonnaReview } from './tools/donnaReview.js';
import { LISTEN_HARVEY_TALK_TOOL } from './tools/listenHarvey.js';
import { DONNA_LEAD_TOOL, executeDonnaLead } from './tools/donnaLead.js'; // TDW_02 P1 (Amendment One CE-1)
import { vendorIdFromAgent } from './vendorIdentity.js'; // TDW_02: rebuild reads the typed lead plane
import { phoneKey, nameKey } from './phoneKey.js'; // TDW_04 engine-lane (ST-3b): twin annotation at render
import type { SnapshotItem, ToolOutcome, ViewRow } from './snapshotTypes.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Note = { items: SnapshotItem[]; rebuilt_at: string | null };

// Near-horizon windows (Bible Part 0.7): claims/loops 15d, money 30d, payment
// lookback 7d. Applied where the data carries a horizon date; claims have none yet
// (claim-horizon dates land with the open-loop tracker, Step 6), so unverified
// claims show as currently-open regardless of date until then.
const DAY = 86_400_000;

// ── Durable note: read / write / patch / rebuild ─────────────────────────────
async function readNoteRow(agentId: string): Promise<Note | null> {
  const { data } = await supabase
    .from('agent_snapshot')
    .select('note')
    .eq('agent_id', agentId)
    .maybeSingle();
  return (data?.note as Note) ?? null;
}

async function writeNote(agentId: string, note: Note): Promise<void> {
  await supabase.from('agent_snapshot').upsert(
    { agent_id: agentId, note },
    { onConflict: 'agent_id' },
  );
}

// Full rebuild from ground truth — the FALLBACK (first build / inconsistency),
// never the routine. Windowed to the near horizon.
export async function rebuildSnapshot(agentId: string): Promise<Note> {
  const items: SnapshotItem[] = [];
  const now = Date.now();

  // Open leads (pipeline not yet booked/lost) — TYPED PLANE since TDW_02 P1:
  // donna_lead files into public.leads (engine.leads is stop-written, empty).
  // Resolved via the reverse identity bridge; soft-deleted rows never rebuild
  // (the read-path honesty law — founder ruling, the Priya case). Item text
  // mirrors donnaLead's leadItem register exactly so patched and rebuilt
  // entries read identically.
  const vendorId = await vendorIdFromAgent(agentId);
  if (vendorId) {
    const { data: leads } = await supabase
      .schema('public')
      .from('leads')
      .select('id, name, phone, state, budget_max') // phone: TDW_04 engine-lane (ST-3b match key)
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .not('state', 'in', '("booked","lost")')
      .order('created_at', { ascending: false })
      .limit(12);
    for (const l of leads ?? []) {
      const val = l.budget_max != null ? ` (Rs ${l.budget_max})` : '';
      items.push({
        id: `lead:${l.id}`, kind: 'lead',
        text: `${l.name ?? 'unknown'} — lead, ${l.state ?? 'new'}${val}`,
        status: 'open', horizon: null, ref_type: 'leads', ref_id: l.id,
        // TDW_04 engine-lane (ST-3b): match keys, mirroring donnaLead's leadItem.
        name: l.name ?? null,
        phone_key: phoneKey(l.phone as string | null),
      });
    }
  }

  // Binders — engine.records, the working plane. TDW_04 engine-lane sitting
  // (ST-3a, absorbed 02-HOTFIX-2 per L-9): F16's data-loss trap dies here. Before
  // this, ANY rebuild silently erased every binder line — booked work and received
  // money vanished from the one context the model trusts, and could only return via
  // fresh surgical patches. The rebuild now reads the plane: non-hidden binders,
  // most recently touched first, limit 12 (symmetric with the lead read above).
  // Items go through the SAME recordItem register the surgical patches use, so
  // rebuilt and patched entries read identically (the standing register law).
  const { data: recs } = await supabase
    .from('records')
    .select('id, client, amount, amount_received, amount_pending, payment_status, direction, date, stage, note, phone')
    .eq('agent_id', agentId)
    .eq('hidden', false)
    .order('updated_at', { ascending: false })
    .limit(12);
  for (const r of recs ?? []) {
    items.push(recordItem(r));
  }

  // Unverified claims (stated, not superseded) — the blind-spot map.
  const { data: facts } = await supabase
    .from('facts')
    .select('id, subject, content')
    .eq('agent_id', agentId)
    .eq('verification_status', 'stated')
    .is('superseded_by', null)
    .order('created_at', { ascending: false })
    .limit(12);
  for (const f of facts ?? []) {
    items.push({
      id: f.subject ? `claim:${String(f.subject).trim().toLowerCase()}` : `claim:fact:${f.id}`,
      kind: 'claim',
      text: `${f.subject ? f.subject + ': ' : ''}${f.content} — stated, not yet confirmed`,
      status: 'unverified', horizon: null, ref_type: 'facts', ref_id: f.id,
    });
  }

  // Money due/expected within 30 days, plus a 7-day lookback for unverified
  // payments that should have landed.
  // TDW_04 engine-lane (ST-3e, absorbed 02-HOTFIX-2 per L-9): GATED OFF. money_entries
  // is a table NOTHING writes yet ("honest-empty until Step 7") — an empty read here is
  // how "no current booking or payment in flight" got asserted over a booked binder
  // holding Rs 20k received (Exhibit C / Finding 7). A snapshot must never let an
  // assertion stand on a table with no writers. Step 7's session flips this constant
  // ON in the same delivery that lands the writers — never before.
  const MONEY_ENTRIES_LIVE = false;
  if (MONEY_ENTRIES_LIVE) {
    const { data: money } = await supabase
      .from('money_entries')
      .select('id, direction, amount, counterparty, status, verification_status, due_at')
      .eq('agent_id', agentId)
      .in('status', ['expected', 'overdue'])
      .order('due_at', { ascending: true })
      .limit(20);
    for (const m of money ?? []) {
      const due = m.due_at ? new Date(m.due_at).getTime() : null;
      const aheadOk = due == null || due <= now + 30 * DAY;
      const lookbackOk = due != null && due >= now - 7 * DAY && m.verification_status !== 'verified';
      if (!aheadOk && !lookbackOk) continue;
      const who = m.counterparty ? ` ${m.counterparty}` : '';
      const overdue = due != null && due < now;
      items.push({
        id: `money:${m.id}`,
        kind: overdue ? 'payment_due' : 'money',
        text: overdue
          ? `You haven't confirmed Rs ${m.amount}${who} — was due ${new Date(m.due_at as string).toDateString()}`
          : `Rs ${m.amount}${who} — ${m.direction === 'in' ? 'due in' : 'due out'}, ${m.status}, ${m.verification_status}`,
        status: overdue ? 'overdue' : 'open',
        horizon: m.due_at ?? null, ref_type: 'money_entries', ref_id: m.id,
      });
    }
  }

  const note: Note = { items, rebuilt_at: new Date().toISOString() };
  await writeNote(agentId, note);
  return note;
}

async function getNote(agentId: string): Promise<Note> {
  const existing = await readNoteRow(agentId);
  if (existing && Array.isArray(existing.items)) return existing;
  return rebuildSnapshot(agentId); // first build
}

// Surgical patch: upsert one item by id (or remove it). This is Donna being a
// sharp worker — touch only what changed, leave the rest.
export async function patchNote(agentId: string, outcome: ToolOutcome): Promise<void> {
  if (!outcome.item && !outcome.remove) return;
  const note = await getNote(agentId);
  let items = note.items;
  if (outcome.remove) items = items.filter((it) => it.id !== outcome.remove);
  if (outcome.item) {
    const item = outcome.item;
    const idx = items.findIndex((it) => it.id === item.id);
    if (idx >= 0) items[idx] = item; // update in place
    else items.push(item);           // genuinely new
  }
  await writeNote(agentId, { items, rebuilt_at: note.rebuilt_at });
}

// What Harvey sees each turn: the durable note, formatted. Declarative lines only.
//
// TDW_04 engine-lane (ST-3b, absorbed 02-HOTFIX-2 per L-9): TWIN ANNOTATION at render.
// When a `lead:` item and a `record:` item share a person (phone_key first, name key
// as fallback — the same discipline as the PWA's R1(b) chip), the two lines fuse into
// ONE joined line naming both planes, so Victor can never again voice one twin as the
// whole truth (Exhibit C: "lost, Rs 300,000" spoken over a booked binder holding Rs 20k).
// Match keys ride the items (written by leadItem/recordItem since this sitting); items
// written before it fall back to the name prefix of `text` — both registers open with
// the person's name. Render-only: the note on disk is untouched; nothing is written,
// linked, or merged (the R1(b)/R2 boundary — the engagements spine is TDW_16's).
// The header line is Block 06's (ST-3c) — untouched here.
function itemMatchKeys(it: SnapshotItem): { phone: string | null; name: string | null } {
  const fromText = it.text.split(' — ')[0]?.trim() ?? '';
  return {
    phone: it.phone_key ?? null,
    name: nameKey(it.name ?? fromText),
  };
}

export async function snapshotText(agentId: string): Promise<string> {
  const note = await getNote(agentId);
  if (!note.items.length) {
    return "\n\n[Donna's snapshot] Nothing open or near yet — clean slate.\n";
  }

  const leads   = note.items.filter((it) => it.kind === 'lead');
  const records = note.items.filter((it) => it.ref_type === 'records');
  const joinedIds = new Set<string>();
  const twinLineById = new Map<string, string>(); // lead item id -> joined line

  for (const lead of leads) {
    const lk = itemMatchKeys(lead);
    // Phone-first discipline (the PWA chip's): when BOTH sides carry a phone key,
    // the phones decide — differing phones mean NOT the same person even if names
    // collide. Name matching is the fallback only where a phone is absent on either
    // side (the Kavya asymmetry). Basis is recorded PER TWIN so the annotation never
    // claims a phone match it didn't make.
    const twins: Array<{ item: SnapshotItem; basis: 'phone' | 'name' }> = [];
    for (const rec of records) {
      const rk = itemMatchKeys(rec);
      if (lk.phone && rk.phone) {
        if (lk.phone === rk.phone) twins.push({ item: rec, basis: 'phone' });
        continue;
      }
      if (!!lk.name && !!rk.name && lk.name === rk.name) twins.push({ item: rec, basis: 'name' });
    }
    if (!twins.length) continue;
    const name = (lead.name ?? lead.text.split(' — ')[0] ?? 'unknown').trim();
    const sep = (t: string): string => {
      const i = t.indexOf(' — ');
      return i === -1 ? t : t.slice(i + 3).trim() || t;
    };
    const leadRest = sep(lead.text);
    const recParts = twins.map((t) => sep(t.item.text));
    const bases = new Set(twins.map((t) => t.basis));
    const basisWord = bases.size > 1 ? 'phone/name' : (twins[0].basis as string);
    twinLineById.set(
      lead.id,
      `- ${name} — TWO ENTRIES, same person by ${basisWord}: enquiry says ${leadRest}; binder says ${recParts.join(' · ')} — reconcile before advising.`,
    );
    joinedIds.add(lead.id);
    for (const t of twins) joinedIds.add(t.item.id);
  }

  const lines: string[] = [];
  for (const it of note.items) {
    if (twinLineById.has(it.id)) { lines.push(twinLineById.get(it.id) as string); continue; }
    if (joinedIds.has(it.id)) continue; // a record already folded into its twin's joined line
    lines.push(`- ${it.text}`);
  }
  return `\n\n[Donna's snapshot — what's open and near, kept true for you]\n${lines.join('\n')}\n`;
}

// ── Donna, resumable: working WITH Harvey turn by turn ───────────────────────
// Her hands (write atoms) + her eyes (donna_find) + her voice (listen_harvey_talk).
// She does silent work with the first two; she speaks to Harvey with the third (or, as
// a fallback, with plain text). A segment ends when she speaks. Her message history is
// returned as a DonnaSession so the NEXT call resumes the same conversation — that is
// what makes the exchange two-way instead of a one-shot.
const DONNA_TOOLS: Anthropic.Tool[] = [...RECORD_TOOLS, ...READ_TOOLS, ...BENCH_READ_TOOLS, ...SHELF_READ_TOOLS, ...REVIEW_READ_TOOLS, DONNA_LEAD_TOOL, DONNA_VERDICT_TOOL, DONNA_REVIEW_TOOL, LISTEN_HARVEY_TALK_TOOL];
// Bounds Donna's OWN tool-work within one segment (file/search/speak). This is NOT the
// Harvey<->Donna exchange count — that is fused upstream in the loop.
const DONNA_WORK_ITERS = 6;

// Her conversation state, carried across calls within one Harvey turn. pendingToolUseId
// is set only when she ended by asking via listen_harvey_talk ALONE — then Harvey's next
// message resolves that tool call as its result (clean alternation). Otherwise his reply
// arrives as a fresh user turn.
export type DonnaSession = {
  messages: Anthropic.MessageParam[];
  pendingToolUseId: string | null;
};

export type DonnaTurn = {
  message: string;          // what she said back to Harvey this segment
  session: DonnaSession;    // her conversation so far, for resume
  tool_calls: { name: string; input: unknown; result: string }[];
  cost_inr: number;
  input_tokens: number;
  output_tokens: number;
  // 02-HOTFIX (2026-07-15): cache buckets surfaced so the turn ledger sees her whole
  // billing shape. Zero on today's anthropic path (she is uncached by design — Block
  // 06 owns her cache); nonzero if a compat endpoint reports buckets or 06 caches her.
  cache_read_tokens: number;
  cache_write_tokens: number;
  mutated: boolean;
  view: ViewRow[] | null;   // rows a READ surfaced this segment (the peek's payload)
};

export async function runDonnaTurn(
  agentId: string,
  harveyMessage: string,
  prior: DonnaSession | null,
  today?: string,
  todayIso?: string,
  onAction?: (a: { name: string; input: unknown; result: string }) => void,
  scratchpad?: string,
  rawMessage?: string, // TDW_02 P1: the vendor's raw line, threaded from the loop for donna_lead's raw_message (D9)
  transportIn?: { provider: string; stream: (p: unknown) => any; create: (p: unknown) => Promise<any> }, // TDW_02 P5
  modelOverride?: string, // TDW_02 P5: non-anthropic routes run one model, both hands
): Promise<DonnaTurn> {
  const toolCalls: DonnaTurn['tool_calls'] = [];
  // record() pushes a tool-call AND fires it live, so each of Donna's hands leaves the
  // engine the instant it completes (stream cadence for the pair-at-work view) instead of
  // batched at return. onAction is a no-op on the non-streaming path (the door passes none).
  const record = (name: string, input: unknown, result: string) => { toolCalls.push({ name, input, result }); onAction?.({ name, input, result }); };
  let inTok = 0, outTok = 0, cost = 0, mutated = false;
  let cacheRead = 0, cacheWrite = 0; // 02-HOTFIX: her buckets, priced and surfaced
  let view: ViewRow[] | null = null; // last READ's rows win — that's THIS ask's view

  const donnaSystem =
    DONNA_SOUL +
    (today ? `\n\n[${today}] Use this when something is dated relative to now (a deadline, "next Friday", whether a date has passed).` : '') +
    "\n\nTHE SHAPE OF YOUR CABINET — the room you keep, so you always see what your hands touch: " +
    "one binder is one row, and a binder carries ONE money story — its amount and direction are THE " +
    "money of that engagement; received, pending and payment status are that story's parts. A different " +
    "money — a vendor's payable beside a client's contract, a second deal with the same person — is its " +
    "OWN binder. Money is never silently lost: writing money over a standing figure replaces it and " +
    "CONFESSES old to new, written into the binder's story and the event trail; deliberate corrections " +
    "also have their own door, donna_money_edit. " +
    "The note GROWS — lines added through donna_edit or donna_note_append stack beneath what stands; " +
    "donna_note alone rewrites it clean. Nothing is ever destroyed: archived binders wait in the cabinet, " +
    "and every write leaves a dated line in the event trail that donna_history reads back. Figures travel " +
    "as they arrived — '2.5L', '90k', plain rupees — and the hands compute the zeros, never you. " +
    "Beside the cabinet stands THE SHELF: documents distilled into Briefs — §-numbered, page-anchored " +
    "indexes with their gaps declared. donna_shelf shows what's on it; donna_brief_read opens one. " +
    "A citation from a Brief is §-and-page, always — the chain back to the stored original — and a " +
    "declared gap is the index admitting blindness, never evidence of absence." +
    "\n\nYou are working with Harvey, turn by turn. He hands you something — an instruction, or his " +
    "answer to what you just asked. You do the work against the real records (reconciling against what " +
    "already exists before you write), and you speak back to him with listen_harvey_talk: hand him your " +
    "finding, or ask him exactly what you need to finish (which client, which binder) and his answer " +
    "comes next. Keep each reply to one or two plain lines. You prepare; you never advise — that is his." +
    // The owner's scratchpad — his own hand, door-fed into Donna's vision (never Harvey's).
    (scratchpad ? `\n\n${scratchpad}` : "");

  // Build the message list: resume the prior conversation, or start fresh.
  const messages: Anthropic.MessageParam[] = prior ? [...prior.messages] : [];
  if (prior && prior.pendingToolUseId) {
    // She ended by asking via listen_harvey_talk (alone); Harvey's reply is that call's result.
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: prior.pendingToolUseId, content: `Harvey: ${harveyMessage}` }],
    });
  } else {
    messages.push({ role: 'user', content: `Harvey: ${harveyMessage}` });
  }

  let message = '';
  let pendingToolUseId: string | null = null;

  // The OPEN BINDER. Within one turn Donna works a record across several atoms:
  // donna_client opens a binder, then donna_note / donna_money / donna_date etc.
  // belong ON that binder. When an attribute atom arrives with no binder_id, it
  // should land on the open binder — NOT spawn an orphan row (the stutter that
  // forced her to self-correct with extra donna_edit calls). donna_client with no
  // binder_id legitimately OPENS a new binder (a genuinely new client/engagement),
  // so it sets the open binder rather than attaching to the prior one. An explicit
  // binder_id always wins and updates the open binder to that record.
  let currentBinderId: string | null = null;
  const ATTRIBUTE_ATOMS = new Set([
    'donna_money', 'donna_date', 'donna_note', 'donna_phone', 'donna_doc', 'donna_stage',
    'donna_invoice_pdf',
  ]);

  let transport = transportIn ?? null;
  let donnaModel = modelOverride ?? MODELS.haiku; // anthropic path: Donna is ALWAYS Haiku (unchanged)
  for (let i = 0; i < DONNA_WORK_ITERS; i++) {
    let resp: Anthropic.Message;
    try {
      const params = {
        model: donnaModel,
        max_tokens: 2048, // v2 pipe: she writes memos now, not just murmurs — roomy, still bounded (a full reply ~Rs 0.7)
        system: donnaSystem,
        tools: DONNA_TOOLS,
        messages,
      };
      resp = transport ? await transport.create(params) : await anthropic.messages.create(params);
      if (transport && transport.provider !== 'anthropic') {
        for (const b of resp.content) {
          if (b.type === 'tool_use' && (b.input === null || typeof b.input !== 'object')) throw new Error(`tool_fidelity: ${b.name}`);
        }
      }
    } catch (e) {
      if (transport && transport.provider !== 'anthropic') {
        // eslint-disable-next-line no-console
        console.warn(`[provider_downgrade] donna: ${transport.provider} failed (${(e as Error).message}) — Haiku for the rest of this segment`);
        transport = null;
        donnaModel = MODELS.haiku;
        i--;
        continue;
      }
      throw e;
    }
    inTok += resp.usage?.input_tokens ?? 0;
    outTok += resp.usage?.output_tokens ?? 0;
    // 02-HOTFIX (2026-07-15): the buckets exist on her responses too (zero while she is
    // uncached on anthropic; real on bucket-reporting compat endpoints). Priced the same
    // way Victor's are — the cost calc was silently dropping them before.
    cacheRead += resp.usage?.cache_read_input_tokens ?? 0;
    cacheWrite += resp.usage?.cache_creation_input_tokens ?? 0;
    cost += calcCostInr(donnaModel, resp.usage?.input_tokens ?? 0, resp.usage?.output_tokens ?? 0, resp.usage?.cache_read_input_tokens ?? 0, resp.usage?.cache_creation_input_tokens ?? 0);

    const toolUse = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const textThis = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('\n').trim();

    if (toolUse.length === 0) {
      // Bare text with no tool = her words to Harvey (the fallback channel; her voice is
      // never dropped even if she forgets the tool). Segment ends.
      message = textThis || 'Done.';
      messages.push({ role: 'assistant', content: resp.content });
      break;
    }

    const listen = toolUse.find((t) => t.name === 'listen_harvey_talk');
    const work = toolUse.filter((t) => t.name !== 'listen_harvey_talk');

    // Do the silent work first (search/file), collecting results for every work tool.
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of work) {
      let outcome: ToolOutcome;
      if (READ_TOOL_NAMES.has(tu.name) || BENCH_READ_NAMES.has(tu.name) || SHELF_READ_NAMES.has(tu.name) || REVIEW_READ_NAMES.has(tu.name)) {
        // A read: her eyes. Never mutates, never touches the snapshot.
        if (tu.name === 'donna_shelf') {
          outcome = await executeShelf(agentId);
        } else if (tu.name === 'donna_brief_read') {
          outcome = await executeBriefRead(agentId, tu.input as Record<string, unknown>);
        } else if (tu.name === 'donna_review_read') {
          outcome = await executeReviewRead(agentId, tu.input as Record<string, unknown>);
        } else if (tu.name === 'donna_tally') {
          outcome = await executeTally(agentId, tu.input as Record<string, unknown>);
        } else if (tu.name === 'donna_history') {
          outcome = await executeHistory(agentId, tu.input as Record<string, unknown>);
        } else if (tu.name === 'donna_whatsdue') {
          // "What's due" needs the bare ISO date to compare/range against — NOT the
          // human sentence in `today` (comparing a date to "Today is..." sorts wrong).
          outcome = await executeWhatsDue(agentId, todayIso ?? new Date().toISOString().slice(0, 10), tu.input as Record<string, unknown>);
        } else {
          outcome = await executeFindTool(agentId, tu.input as Record<string, unknown>);
        }
      } else {
        // OPEN-BINDER DEFAULT: an attribute atom with no binder_id lands on the binder
        // Donna is already working this turn, instead of orphaning a new row. (client
        // opens a binder; attributes attach to it.) An explicit binder_id always wins.
        const input = tu.input as Record<string, unknown>;
        if (tu.name === 'donna_verdict') {
          // A supervision verdict: filed to donna_audit_verdict, free-form. It is a
          // record, not a snapshot item — it does not touch the near-horizon note.
          outcome = await executeDonnaVerdict(agentId, input as Parameters<typeof executeDonnaVerdict>[1]);
          record(tu.name, tu.input, outcome.display);
          results.push({ type: 'tool_result', tool_use_id: tu.id, content: outcome.display });
          continue;
        }
        if (tu.name === 'donna_review') {
          // The review binder: the container for a supervision review. Verdicts point
          // to it. A record, not a snapshot item.
          outcome = await executeDonnaReview(agentId, input as Parameters<typeof executeDonnaReview>[1]);
          record(tu.name, tu.input, outcome.display);
          results.push({ type: 'tool_result', tool_use_id: tu.id, content: outcome.display });
          continue;
        }
        if (tu.name === 'donna_lead') {
          // TDW_02 P1: the lead hand files into public.leads (typed plane, LD-1).
          // A lead is not a binder — it never becomes the open binder, and its
          // snapshot item is patched from the CONFIRMED write like every mutation.
          outcome = await executeDonnaLead(agentId, input as Parameters<typeof executeDonnaLead>[1], rawMessage);
          mutated = true;
          await patchNote(agentId, outcome);
          record(tu.name, tu.input, outcome.display);
          results.push({ type: 'tool_result', tool_use_id: tu.id, content: outcome.display });
          continue;
        }
        if (
          ATTRIBUTE_ATOMS.has(tu.name) &&
          (input.binder_id == null || input.binder_id === '') &&
          currentBinderId
        ) {
          input.binder_id = currentBinderId;
        }
        outcome = await executeRecordTool(agentId, tu.name, input);
        mutated = true;
        await patchNote(agentId, outcome); // patch from the CONFIRMED write, not intent
        // Whatever we just wrote becomes the open binder for the rest of this turn.
        if (outcome.item?.ref_id) currentBinderId = outcome.item.ref_id;
      }
      if (outcome.found && outcome.found.length) view = outcome.found; // a read surfaced rows -> this turn has a view
      record(tu.name, tu.input, outcome.display);
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: outcome.display });
    }

    if (listen) {
      // She spoke. Her message goes up to Harvey; this segment ends.
      message = (listen.input as { message?: string }).message ?? (textThis || '');
      toolCalls.push({ name: 'listen_harvey_talk', input: listen.input, result: '(spoken to Harvey)' });
      messages.push({ role: 'assistant', content: resp.content });
      if (work.length === 0) {
        // listen ALONE: leave it unresolved and resume by feeding Harvey's reply as its
        // tool_result (clean user/assistant alternation).
        pendingToolUseId = listen.id;
      } else {
        // listen mixed with work: every tool_use in this assistant turn must be resolved
        // now, so give listen a synthetic result; Harvey's reply will resume as a fresh
        // user turn next call.
        results.push({ type: 'tool_result', tool_use_id: listen.id, content: 'Delivered to Harvey.' });
        messages.push({ role: 'user', content: results });
      }
      break;
    }

    // Only work this round — feed results back and let her continue (search → then file,
    // or file → then speak next iteration).
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({ role: 'user', content: results });
  }

  if (!message) message = 'Done.';
  return {
    message,
    session: { messages, pendingToolUseId },
    tool_calls: toolCalls,
    cost_inr: cost,
    input_tokens: inTok,
    output_tokens: outTok,
    cache_read_tokens: cacheRead,
    cache_write_tokens: cacheWrite,
    mutated,
    view,
  };
}
