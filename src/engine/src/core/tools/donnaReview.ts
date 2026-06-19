// donnaReview.ts — Donna's hand for the review binder (the container for a supervision
// review). She improvised this out of records twice; now it has its own home. One
// binder per review; the per-requirement verdicts (donna_verdict) point to it by id.
//
// Open a binder (no id) -> returns a new review_id. Update one (with id) -> patches the
// fields given. The binder holds the review as a unit: what was reviewed, against which
// standard version, the overall disposition, the summary.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import type { ToolOutcome } from '../snapshotTypes.js';

export const DONNA_REVIEW_TOOL: Anthropic.Tool = {
  name: 'donna_review',
  description:
    "Open or update a review binder — the container for one supervision review. Open it once when a review begins (no id) and you get back a review id; pass that id to each verdict you file so they gather under this one review. Update the binder (with its id) as the picture firms up — the overall disposition, the summary. Hold here: whose work / which engagement (client), the work product reviewed (work_ref — a shelf brief id or a plain description), the standard version it is measured against (standard_ref), the overall call on the file (disposition), and the review in your words (summary).",
  input_schema: {
    type: 'object',
    properties: {
      review_id: { type: 'string', description: 'The binder to update. Omit to open a new one.' },
      client: { type: 'string', description: 'Whose work / which engagement.' },
      work_ref: { type: 'string', description: 'The work product reviewed — a shelf brief id, or a description.' },
      standard_ref: { type: 'string', description: 'The standard version measured against (the pointer).' },
      disposition: { type: 'string', description: 'The overall call on the file, e.g. "not ready for sign-off".' },
      summary: { type: 'string', description: 'The review in your words — the narrative the verdicts detail.' },
      status: { type: 'string', description: 'Where the review sits: review / escalated / closed.' },
    },
    required: [],
  },
};

type ReviewInput = {
  review_id?: string;
  client?: string;
  work_ref?: string;
  standard_ref?: string;
  disposition?: string;
  summary?: string;
  status?: string;
};

export async function executeDonnaReview(agentId: string, input: ReviewInput): Promise<ToolOutcome> {
  const fields: Record<string, unknown> = {};
  for (const k of ['client', 'work_ref', 'standard_ref', 'disposition', 'summary', 'status'] as const) {
    if (typeof input[k] === 'string' && input[k]!.trim()) fields[k] = input[k]!.trim();
  }

  if (input.review_id) {
    fields.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('donna_review_binder')
      .update(fields)
      .eq('id', input.review_id)
      .eq('agent_id', agentId)
      .select('id')
      .single();
    if (error || !data) return { display: `ERROR updating review binder: ${error?.message ?? 'not found'}` };
    return { display: `Review binder ${input.review_id} updated.` };
  }

  fields.agent_id = agentId;
  const { data, error } = await supabase
    .from('donna_review_binder')
    .insert(fields)
    .select('id')
    .single();
  if (error || !data) return { display: `ERROR opening review binder: ${error?.message ?? 'insert failed'}` };
  return { display: `Review binder opened: ${data.id}. File each verdict to this id so they gather under one review.` };
}
