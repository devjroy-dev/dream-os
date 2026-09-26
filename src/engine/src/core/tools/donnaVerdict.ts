// donnaVerdict.ts — Donna's hand for filing a supervision verdict (one requirement).
//
// The Supervisor posture (Bible 4.1): work product checked against a standard, the
// output a verdict-with-citation per requirement — never a verdict on vibes. Harvey
// judges; Donna files. He relays the verdict through dear_donna_talk; she reaches for
// THIS hand and writes one row into donna_audit_verdict.
//
// verdict is FREE TEXT. The auditor pair demonstrated four shapes (PASS / FAIL /
// MISSING / AMBIGUOUS) — named below as EXAMPLES, never a closed set. Another trade
// may produce two or ten. She files the word the work produced; the vocabulary lives
// in Harvey's judgment and the codex, never in this tool.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import type { ToolOutcome } from '../snapshotTypes.js';

export const DONNA_VERDICT_TOOL: Anthropic.Tool = {
  name: 'donna_verdict',
  description:
    "File one supervision verdict — the result of checking a single requirement against a standard. One row per requirement judged. The verdict word is yours to record as given (the auditor's review showed PASS, FAIL, MISSING, AMBIGUOUS — but trades differ; file whatever word the review produced). Always carry the evidence reference (the page, the section, the cabinet row it rests on) and, where given, the standard version it was measured against — a verdict you cannot point to a source is not one you file.",
  input_schema: {
    type: 'object',
    properties: {
      requirement: { type: 'string', description: 'The checklist item being judged, e.g. "clause 12 must exist", "margin cap not breached".' },
      verdict: { type: 'string', description: 'The result word, as given to you — free text, no fixed set.' },
      evidence_ref: { type: 'string', description: 'Where it rests: document + page, codex section, or cabinet row. The citation.' },
      standard_ref: { type: 'string', description: 'Which standard version this was measured against, if given.' },
      run_ref: { type: 'string', description: 'The review/engagement this verdict belongs to, if one is named.' },
      review_id: { type: 'string', description: 'The review binder this verdict belongs under (from donna_review). Files the verdict into that review.' },
      note: { type: 'string', description: 'The measured reason, the search-was-done attestation, or the clarification routed to the principal.' },
    },
    required: ['requirement', 'verdict'],
  },
};

type VerdictInput = {
  requirement: string;
  verdict: string;
  evidence_ref?: string;
  standard_ref?: string;
  run_ref?: string;
  review_id?: string;
  note?: string;
};

export async function executeDonnaVerdict(agentId: string, input: VerdictInput): Promise<ToolOutcome> {
  const requirement = (input.requirement ?? '').trim();
  const verdict = (input.verdict ?? '').trim();
  if (!requirement || !verdict) {
    return { display: 'ERROR: donna_verdict needs at least a requirement and a verdict.' };
  }
  const { data, error } = await supabase
    .from('donna_audit_verdict')
    .insert({
      agent_id: agentId,
      run_ref: input.run_ref ?? null,
      review_id: input.review_id ?? null,
      requirement,
      verdict,
      evidence_ref: input.evidence_ref ?? null,
      standard_ref: input.standard_ref ?? null,
      note: input.note ?? null,
    })
    .select('id')
    .single();
  if (error || !data) {
    return { display: `ERROR filing verdict: ${error?.message ?? 'insert failed'}` };
  }
  const cite = input.evidence_ref ? ` (${input.evidence_ref})` : '';
  return { display: `Filed: ${requirement} -> ${verdict}${cite}.` };
}
