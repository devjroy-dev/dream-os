// memory.ts — the memory split.
//   Working thread: conversations + messages, with a clean reset on abandonment
//     (the stale-context fix). A thread older than CONVERSATION_TIMEOUT_MIN is
//     marked 'abandoned' and a fresh one starts — so a half-dead thread never
//     bleeds into a new question.
//   Durable facts: long-lived notes, written with the supersession rule
//     ("won't forget the stated until I verify the restated").
import { supabase } from './db.js';

const TIMEOUT_MIN = Number(process.env.CONVERSATION_TIMEOUT_MIN ?? 30);

export type ThreadMessage = { role: 'user' | 'assistant'; content: string };

// ── TDW_06 P6a (S-10), 0081 · THE TOMBSTONE CONSTANT — ONE HOME ──────────────
// F-04.51's tombstone row (written by loop.ts's wrapper on an outage). Its ONE
// home is here, so the writer (loop.ts imports it) and the reader (loadThread's
// pre-0081 interim below) share the same blessed string — never two copies to
// drift apart. The BYTES are unchanged from loop.ts's original: pre-0081
// tombstone rows already carry exactly this content, which is why the interim
// content-match catches them until they age out of the 20-row window.
export const TOMBSTONE = 'ERROR — no reply was generated (provider failure). Nothing was done.';

// 0081 (F-06.3's durable cure): a tombstone row must NEVER re-enter replay — a
// next-turn Victor read one as estate and ECHOED it verbatim. A post-0081 row
// carries meta.tombstone === true (the durable mark); a pre-0081 row has no meta,
// so the content-match on TOMBSTONE catches it (the interim). Both, one predicate.
function isTombstone(row: { meta?: unknown; content?: unknown }): boolean {
  const meta = row.meta as { tombstone?: boolean } | null | undefined;
  if (meta && meta.tombstone === true) return true; // durable mark (post-0081)
  return row.content === TOMBSTONE;                  // interim (pre-0081 rows)
}

// Get the agent's active conversation, or start a fresh one if the last is stale.
// Returns the conversation id + the recent thread (working memory).
export async function getOrCreateConversation(
  agentId: string,
  forcedConversationId?: string,
): Promise<{ conversationId: string; thread: ThreadMessage[] }> {
  // If the caller pins a conversation, use it as-is.
  if (forcedConversationId) {
    const thread = await loadThread(forcedConversationId);
    await supabase.from('conversations')
      .update({ last_active_at: new Date().toISOString(), state: 'active' })
      .eq('id', forcedConversationId);
    return { conversationId: forcedConversationId, thread };
  }

  const { data: latest } = await supabase
    .from('conversations')
    .select('id, last_active_at, state')
    .eq('agent_id', agentId)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = Date.now();
  const stale =
    !latest ||
    latest.state !== 'active' ||
    now - new Date(latest.last_active_at).getTime() > TIMEOUT_MIN * 60_000;

  if (latest && stale && latest.state === 'active') {
    // The previous thread timed out → close it cleanly so it can't bleed in.
    await supabase.from('conversations').update({ state: 'abandoned' }).eq('id', latest.id);
  }

  if (!stale && latest) {
    const thread = await loadThread(latest.id);
    await supabase.from('conversations')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', latest.id);
    return { conversationId: latest.id, thread };
  }

  // Start a fresh thread.
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ agent_id: agentId, mode: 'chat', channel: 'web', state: 'active' })
    .select('id')
    .single();
  if (error || !created) throw new Error(`could not start conversation: ${error?.message}`);
  return { conversationId: created.id, thread: [] };
}

async function loadThread(conversationId: string, limit = 20): Promise<ThreadMessage[]> {
  type Row = { role: string; content: string | null; meta?: unknown };
  // select() FIRST, then filters (the PostgREST builder order). One helper, two
  // column shapes, so the pre-0081 degrade re-runs the identical query minus meta.
  const q = (cols: string) => supabase
    .from('messages')
    .select(cols)
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(limit);
  // 0081: read meta for the tombstone mark. If the column is ABSENT (migration not
  // yet applied), the select errors on 'meta' — degrade to the pre-0081 shape (no
  // crash, no lost thread) and let the content-match interim carry the exclusion.
  let { data, error } = await q('role, content, meta');
  if (error && /\bmeta\b/i.test(error.message)) {
    // eslint-disable-next-line no-console
    console.warn('[memory] messages.meta absent (apply 0081) — reading without it; the tombstone interim still holds');
    ({ data, error } = await q('role, content'));
  }
  const rows = ((data ?? []) as unknown as Row[]).reverse();
  return rows
    .filter((r) => r.content)
    .filter((r) => !isTombstone(r)) // 0081 (F-06.3): a tombstone never re-enters replay — no next-turn echo
    .map((r) => ({ role: r.role as 'user' | 'assistant', content: r.content as string }));
}

// ── Donna messages — the Harvey<->Donna exchange, as a snapshot Harvey re-reads ──
// The OWNER thread (loadThread) persists Harvey<->owner. The Harvey<->Donna exchange
// lives in each turn's tool_calls and was NOT replayed — so every turn Harvey lost what
// Donna had told him, and drafted half-blind (the credit-committee drift, 2026-06-13).
// This composes the last `limit` Donna exchanges into one snapshot, both sides:
//   Harvey asked: <his dear_donna_talk message>
//   Donna:        <her listen_harvey_talk hand-back>
// Donna's raw donna_brief_read reads stay on HER side (nested in donna_calls) — she has
// already condensed them into the hand-back; Harvey carries the condensed picture, not
// the ocean. Scoped to THIS conversation. Composed, not raw-replayed — a snapshot.
export async function donnaMessages(conversationId: string, limit = 50): Promise<string> {
  const { data } = await supabase
    .from('messages')
    .select('tool_calls, created_at')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .not('tool_calls', 'is', null)
    .order('created_at', { ascending: true });

  type TCall = { name?: string; input?: { message?: string }; result?: unknown };
  const lines: string[] = [];
  for (const row of data ?? []) {
    const calls = Array.isArray(row.tool_calls) ? (row.tool_calls as TCall[]) : [];
    // Pair them in order: a dear_donna_talk (Harvey's ask) is followed by the matching
    // listen_harvey_talk (Donna's voiced hand-back).
    for (let i = 0; i < calls.length; i++) {
      const c = calls[i];
      if (c?.name === 'dear_donna_talk') {
        const ask = (c.input?.message ?? '').trim();
        // find the listen_harvey_talk that follows
        let saidVal = '';
        for (let j = i + 1; j < calls.length; j++) {
          if (calls[j]?.name === 'listen_harvey_talk') {
            saidVal = typeof calls[j].result === 'string' ? (calls[j].result as string).trim() : '';
            break;
          }
        }
        if (ask) lines.push(`Harvey asked: ${ask}`);
        if (saidVal) lines.push(saidVal.startsWith('Listen Harvey') ? saidVal : `Donna: ${saidVal}`);
      }
    }
  }
  if (!lines.length) return '';
  const recent = lines.slice(-limit); // last `limit` exchange-lines, chronological
  return `\n\n[Donna messages — your standing exchange with her in this conversation — what she has surfaced for you, turn by turn:]\n${recent.join('\n')}\n`;
}

// ── TDW_04 B6 sitting 2 (Q-B4-6(b), R-B6-3 CE-ruled) — THE WITNESS RETURNS ──
// The composed-reply save needs to UPDATE the exact row this function inserted:
// F-04.41's disease is that the door lines never reach this table, and its cure
// is the door patching them onto THIS row — which it can only do if the insert
// hands back the row's id. Resolving "the latest assistant message" door-side
// would be a guess about a row; the id is the witness (F-04.28's lesson, one
// table over). DISCLOSED SIGNATURE WIDENING (Q-B2-7's ratified law): the return
// goes Promise<void> -> Promise<string | null>; every existing caller ignores
// the return and is untouched. One behaviour note, also disclosed: the old body
// discarded the insert's error object entirely — a failed save was silent. It
// now warns. The insert itself is byte-identical; failure still never throws.
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'tool',
  content: string,
  toolCalls?: unknown,
  meta?: unknown, // 0081: {"mode":"advisor"} on advisor rows, {"tombstone":true} on the wrapper's row; ABSENT (bare) = business/consult — the asymmetry convention
): Promise<string | null> {
  const row: Record<string, unknown> = {
    conversation_id: conversationId,
    role,
    content,
    tool_calls: toolCalls ?? null,
  };
  // Only ever write the key when there's a mark — a bare row stays bare (asymmetry).
  if (meta !== undefined && meta !== null) row.meta = meta;

  let { data, error } = await supabase.from('messages').insert(row).select('id').single();
  // 0081 pre-DDL degrade: if the meta column is absent, drop it and write the row
  // anyway — a mark is never worth losing a message. Guarded like the usage ledger.
  if (error && row.meta !== undefined && /\bmeta\b/i.test(error.message)) {
    // eslint-disable-next-line no-console
    console.warn('[memory] messages.meta absent (apply 0081) — saved the row without the mark');
    const { meta: _dropped, ...bare } = row;
    ({ data, error } = await supabase.from('messages').insert(bare).select('id').single());
  }
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[memory] saveMessage failed:', error.message);
    return null;
  }
  return (data as { id?: string } | null)?.id ?? null;
}

// Load the agent's current (non-superseded) durable facts — its notes.
export async function loadFacts(agentId: string, limit = 50): Promise<string> {
  const { data } = await supabase
    .from('facts')
    .select('subject, content, verification_status, created_at')
    .eq('agent_id', agentId)
    .is('superseded_by', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!data || data.length === 0) return '';
  const lines = data.map(
    (f) => `- [${f.verification_status}] ${f.subject ? f.subject + ': ' : ''}${f.content}`,
  );
  return `\n\n## What you already know (your notes — newest first)\nTreat [verified] as confirmed, [stated] as claimed-not-yet-confirmed, [assumed] as your own inference.\n${lines.join('\n')}`;
}

// Load the agent's owner anchor — Donna's briefing on the one person he works for.
// Empty string when no owner is set yet (a fresh, un-briefed agent), so the soul's
// "until you've been briefed who your owner is, you don't have one" branch stands.
export async function loadOwner(agentId: string): Promise<{ block: string; consultDone: boolean }> {
  const { data } = await supabase
    .from('agent_owner')
    .select('owner_name, owner_descriptor, note, consult_done')
    .eq('agent_id', agentId)
    .maybeSingle();
  if (!data || !data.owner_name) return { block: '', consultDone: false };
  const desc = data.owner_descriptor ? ` — ${data.owner_descriptor}` : '';
  let block = `\n\n[Your owner — the one person you work for]\n${data.owner_name}${desc}.\n`;
  if (data.note && String(data.note).trim()) {
    block += `\nWhat you've come to understand about them:\n${String(data.note).trim()}\n`;
  }
  // First-meeting gate — scoped ONLY to the greeting/opener, never to the ongoing read.
  // consult_done=false: he has not yet delivered his opening to this owner. true: he has,
  // so he picks up as an ongoing relationship and does NOT re-introduce or repeat the opener.
  // The continuous getting-to-know (the note, the read) goes on regardless — this gates the
  // opening line only.
  const consultDone = data.consult_done === true;
  if (consultDone) {
    block += `\nYou have met this owner before — pick up as an ongoing relationship. You do not re-introduce yourself or repeat your opening line; you simply carry on as the next moment in work already underway. (Your read of them never stops deepening — only the greeting is behind you.)\n`;
  } else {
    block += `\nThis is your first meeting with this owner — open as you do, in your own way.\n`;
  }
  return { block, consultDone };
}

// Write a durable fact with the supersession rule. If a current fact with the
// same subject exists, the new one supersedes it (old kept, not deleted).
export async function rememberFact(args: {
  agentId: string;
  subject: string | null;
  content: string;
  factType?: string | null;
  verificationStatus?: 'stated' | 'verified' | 'assumed';
  sourceRef?: string | null;
}): Promise<{ message: string; factId: string | null; superseded: boolean }> {
  const { agentId, subject, content } = args;
  const verification = args.verificationStatus ?? 'stated';

  // Read before write: is there a current fact on this subject?
  let prior: { id: string; content: string; verification_status: string } | null = null;
  if (subject) {
    const { data } = await supabase
      .from('facts')
      .select('id, content, verification_status')
      .eq('agent_id', agentId)
      .ilike('subject', subject)
      .is('superseded_by', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    prior = data ?? null;
  }

  // Recognize-before-write: if a current fact on this subject already says materially
  // the same thing, and the new statement isn't an upgrade in truth-status, this is a
  // RESTATEMENT, not a change. Write nothing, supersede nothing — just acknowledge.
  // (Mirrors Donna's "see through restated wording" discipline at the data layer, and
  // kills both the false "superseded" and the redundant row.)
  if (prior) {
    const same = normalizeContent(prior.content) === normalizeContent(content);
    const statusUpgrade = prior.verification_status !== 'verified' && verification === 'verified';
    if (same && !statusUpgrade) {
      return { message: `Already on file ("${subject}") — unchanged, nothing to update.`, factId: prior.id, superseded: false };
    }
    if (same && statusUpgrade) {
      // Same fact, now confirmed: promote the existing row in place, don't duplicate.
      await supabase.from('facts').update({ verification_status: verification }).eq('id', prior.id);
      return { message: `Confirmed ("${subject}") — same value, now verified.`, factId: prior.id, superseded: false };
    }
  }

  const { data: inserted, error } = await supabase
    .from('facts')
    .insert({
      agent_id: agentId,
      subject,
      content,
      fact_type: args.factType ?? null,
      verification_status: verification,
      source_ref: args.sourceRef ?? null,
    })
    .select('id')
    .single();
  if (error || !inserted) return { message: `ERROR saving fact: ${error?.message}`, factId: null, superseded: false };

  if (prior) {
    await supabase.from('facts').update({ superseded_by: inserted.id }).eq('id', prior.id);
    return { message: `Updated "${subject}" — value changed, previous superseded. status=${verification}.`, factId: inserted.id, superseded: true };
  }
  return { message: `Noted${subject ? ` ("${subject}")` : ''}. status=${verification}.`, factId: inserted.id, superseded: false };
}

// Normalize content for restatement comparison. Canonicalizes Indian currency
// notation so "2.5L", "2.5 lakh", and "Rs 2,50,000" all reduce to the same value —
// the most common restatement pattern in this domain. This is a BOUNDED, domain
// normalizer, not a semantic matcher: it catches value/format restatements (budgets,
// amounts), NOT reworded prose. Catching "different words, same meaning" is Donna's
// job (the model recognizing it), reinforced by tier. Code is the narrow backstop.
function normalizeContent(s: string): string {
  let t = s.toLowerCase().replace(/rs\.?|inr|₹/g, ' ');
  // lakh / crore notation -> absolute number. "2.5l", "2.5 lakh" -> 250000.
  t = t.replace(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|l)\b/g, (_m, n) => String(Math.round(parseFloat(n) * 100000)));
  t = t.replace(/(\d+(?:\.\d+)?)\s*(?:crores?|cr)\b/g, (_m, n) => String(Math.round(parseFloat(n) * 10000000)));
  // strip formatting noise (commas, spaces, punctuation) so "2,50,000" == "250000".
  return t.replace(/[\s,()\-_.]/g, '').trim();
}
