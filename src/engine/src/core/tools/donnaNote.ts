// donnaNote.ts — Donna's note tool (was `remember`). Lets the engine write a durable fact to its
// own notes, with the supersession rule. Stored facts are ONLY things stated by
// the user or verified by proof/affirmation — never the engine's free opinions.
//
// Returns a ToolOutcome so Donna can patch her snapshot from the confirmed write:
// a STATED claim becomes an unverified snapshot item; a VERIFIED one removes the
// claim from the snapshot (it's no longer "unconfirmed"). The snapshot item id is
// keyed by subject so a restatement patches the same line, never duplicates.
import type Anthropic from '@anthropic-ai/sdk';
import { rememberFact } from '../memory.js';
import type { ToolOutcome, SnapshotItem } from '../snapshotTypes.js';

export const DONNA_NOTE_TOOL: Anthropic.Tool = {
  name: 'donna_note',
  description:
    "Save a durable fact to your notes — something the owner stated or that's been confirmed, worth recalling later (a client's budget, a preference, a deadline, a decision). Use a stable subject so a later restatement updates the same note instead of duplicating. Only store things stated or verified — never your own guesses. If the owner restates something (e.g. a budget changed), call this again with the same subject; it supersedes the old value automatically.",
  input_schema: {
    type: 'object',
    properties: {
      subject: { type: 'string', description: 'Stable key for what this is about, e.g. "Priya budget", "studio cancellation policy".' },
      content: { type: 'string', description: 'The fact itself, in plain words.' },
      fact_type: { type: 'string', description: 'Optional: client | preference | pricing | idea | status | decision.' },
      verification_status: {
        type: 'string',
        enum: ['stated', 'verified'],
        description: "'stated' = said but not yet confirmed (owner's own action about themselves can be taken as confirmed; anything relayed about a third party stays stated). 'verified' = owner affirmed it or proof was seen. Default 'stated'.",
      },
    },
    required: ['content'],
  },
};

type RememberInput = {
  subject?: string;
  content: string;
  fact_type?: string;
  verification_status?: 'stated' | 'verified';
};

// Stable snapshot id for a claim, keyed by subject so restatements patch one line.
function claimId(subject: string | null, factId: string | null): string {
  if (subject) return `claim:${subject.trim().toLowerCase()}`;
  return `claim:fact:${factId ?? 'unknown'}`;
}

export async function executeDonnaNote(agentId: string, input: RememberInput): Promise<ToolOutcome> {
  const subject = input.subject ?? null;
  const status = input.verification_status ?? 'stated';
  const res = await rememberFact({
    agentId,
    subject,
    content: input.content,
    factType: input.fact_type ?? null,
    verificationStatus: status,
  });
  if (!res.factId) return { display: res.message };

  const id = claimId(subject, res.factId);

  if (status === 'verified') {
    // A confirmed fact is no longer an unverified claim — drop it from the snapshot.
    return { display: res.message, remove: id };
  }

  // A stated claim is unconfirmed — surface it in the snapshot as not-yet-true.
  const item: SnapshotItem = {
    id,
    kind: 'claim',
    text: `${subject ? subject + ': ' : ''}${input.content} — stated, not yet confirmed`,
    status: 'unverified',
    horizon: null,
    ref_type: 'facts',
    ref_id: res.factId,
  };
  return { display: res.message, item };
}
