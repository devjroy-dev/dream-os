// donna.ts — what is left of DONNA's runtime: the durable near-horizon note.
//
//   rebuildSnapshot(agentId) — builds agent_snapshot's note from the ground-truth tables.
//   patchNote(agentId, outcome) — patches the note surgically from a confirmed write's
//                                 real result (its live requirers: agent/harvest.js,
//                                 api/vendor/leads.js, lib/executeAndPatch.js,
//                                 lib/vendor/promotion.js, all through the dist).
//
// CE-45 · LCV-16 · LSP_5 · L5-c (the chair's ruling, 25 September 2026): runDonnaTurn,
// DonnaSession, DonnaTurn, snapshotText and every declaration and import ONLY they reached
// (a reachability walk from the two live exports, LSP_3's method) are deleted. Their last
// callers were loop.ts's business branches (L5-a/L5-b) and relaySeat's composeBody (LSP_3).
// The source tables remain ground truth.
import { supabase } from './db.js';
import { recordItem, rs } from './tools/recordPrimitives.js'; // recordItem: TDW_04 engine-lane (ST-3a) · rs: TDW_06 M-4 (R2-B) the house money register
import { vendorIdFromAgent } from './vendorIdentity.js'; // TDW_02: rebuild reads the typed lead plane
import { phoneKey } from './phoneKey.js';
import type { SnapshotItem, ToolOutcome } from './snapshotTypes.js';

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
      .select('id, name, phone, state, budget_max, created_at') // phone: TDW_04 engine-lane (ST-3b match key); created_at: TDW_06 M-1 (P1)
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .not('state', 'in', '("booked","lost")')
      .order('created_at', { ascending: false })
      .limit(12);
    for (const l of leads ?? []) {
      const val = l.budget_max != null ? ` (${rs(l.budget_max)})` : ''; // TDW_06 M-4 (R2-B)
      items.push({
        id: `lead:${l.id}`, kind: 'lead',
        text: `${l.name ?? 'unknown'} — lead, ${l.state ?? 'new'}${val}`,
        status: 'open', horizon: null, ref_type: 'leads', ref_id: l.id,
        // TDW_04 engine-lane (ST-3b): match keys, mirroring donnaLead's leadItem.
        name: l.name ?? null,
        phone_key: phoneKey(l.phone as string | null),
        arrived_at: (l as { created_at?: string | null }).created_at ?? null, // TDW_06 M-1 (P1)
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
    .select('id, client, amount, amount_received, amount_pending, payment_status, direction, date, stage, note, phone, created_at, updated_at') // created_at: TDW_06 M-1 (P1) · updated_at: TDW_06 F-06.97 — the column this read has ORDERED by since ST-3a and never carried
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
          ? `You haven't confirmed ${rs(m.amount as number)}${who} — was due ${new Date(m.due_at as string).toDateString()}`
          : `${rs(m.amount as number)}${who} — ${m.direction === 'in' ? 'due in' : 'due out'}, ${m.status}, ${m.verification_status}`,
        status: overdue ? 'overdue' : 'open',
        horizon: m.due_at ?? null, ref_type: 'money_entries', ref_id: m.id,
      });
    }
  }

  const note: Note = { items, rebuilt_at: new Date().toISOString() };
  await writeNote(agentId, note);
  return note;
}

// ── TDW_06 · F-06.52 — THE MACHINERY-LABELED CONTEXT (CE-ruled 2026-07-25) ────────
// THE DERIVATION THAT LOCATED THIS: harveySoul's live prompt FORBIDS narrating the
// machinery — sentence 36, "no narrating your machinery, no reading him the workings of
// the back office — narrating the machinery is billing the client for your own filing
// cabinet." The law exists, it is live, and it is in the business room where the
// specimens occurred (loop.ts:378 composes HARVEY_SOUL there). It was ignored anyway:
// 22 Jul "Donna's snapshot shows", 27 Jul 12:29 "Let me pull the fresh leads from
// Donna's snapshot", 13:37 "I'm reading the snapshot Operator keeps" — the first two
// witnessed on the columns via persona_scrub_on_wire, so the MODEL wrote her name and
// the wire-scrub converted it. A stronger sentence was not the answer; the register
// arc had already proved that.
//
// WHY IT WAS IGNORED, and this is the whole finding: WE HAND HIM THE VOCABULARY. The
// context injected two inches above that law was labeled "[Donna's snapshot]". The model
// is not inventing machinery-talk; it is ECHOING A LABEL WE WROTE. The soul was fighting
// its own context, and context wins that fight every time.
//
// THE CURE IS THE P1 FAMILY INVERTED: P1 ADDED a legible line so a payload could answer
// a question its shape hid. Here we REMOVE a leaky label so a payload stops teaching a
// vocabulary the soul forbids. Both are the same principle — the payload should carry
// what it means and nothing it doesn't.
//
// FRAMING ONLY, CONTENT UNTOUCHED — the register arm's value-invariance logic applied to
// labels: every item, figure, stamp and line below is byte-identical; only the header
// changes. The estate's own model of a clean frame is next door: memory.ts:230 already
// says "[Your owner — the one person you work for]", not "[the owner note Donna keeps]".
// It arrives as HIS standing knowledge, which is what it actually is.
//
// W-1: these are injection frames in machinery files, not soul bytes. The wall stays shut.
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
