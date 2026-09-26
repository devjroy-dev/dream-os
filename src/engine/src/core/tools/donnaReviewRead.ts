// donnaReviewRead.ts — Donna's LENS over the review store. One read, no writes.
//
// She had the WRITE hands (donna_review opens a binder, donna_verdict files a
// finding under it) but no way to LOOK BACK: "The find hand doesn't pull reviews
// — it pulls binders from the cabinet. Reviews aren't binders." (operator, the
// Aravali review-gap probe, 2026-06-11). So a filed review never returned on a
// later search and the whole audit was re-run cold.
//
// This is the missing door, the donna_brief_read analogue for reviews:
//
// donna_review_read — open one review binder by its review_id: the binder header
//                     (client, work product, standard, disposition, summary,
//                     status) and EVERY verdict filed under it, reassembled via
//                     donna_audit_verdict.review_id. The find surfaces the binder
//                     (tagged [REVIEW] with its id); this hand opens it.
//
// A READ: never mutates, never touches the snapshot. The single-source law holds
// — the verdicts live ONLY in donna_audit_verdict; this hand reads them where
// they are, it never copies them anywhere.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import type { ToolOutcome } from '../snapshotTypes.js';

export const DONNA_REVIEW_READ_TOOL: Anthropic.Tool = {
  name: 'donna_review_read',
  description:
    "Open one review you have already filed and read it back in full. Give review_id (donna_find surfaces filed reviews tagged [REVIEW] with their id). Returns the binder — who/what it reviewed, the standard measured against, the overall disposition and your summary — and EVERY verdict filed under it: each requirement, its verdict word, the evidence cited, and the note. Use it when the owner asks where a reviewed file stands, so you reassemble the real review instead of running it again from scratch. A read only — the verdicts stay where they live; this just opens them.",
  input_schema: {
    type: 'object',
    properties: {
      review_id: { type: 'string', description: 'The review binder to open (donna_find shows filed reviews tagged [REVIEW] with their id).' },
    },
    required: ['review_id'],
  },
};

export const REVIEW_READ_TOOLS: Anthropic.Tool[] = [DONNA_REVIEW_READ_TOOL];
export const REVIEW_READ_NAMES = new Set<string>(REVIEW_READ_TOOLS.map((t) => t.name));

type Binder = {
  id: string; client: string | null; work_ref: string | null;
  standard_ref: string | null; disposition: string | null;
  summary: string | null; status: string | null; created_at: string;
};
type Verdict = {
  requirement: string | null; verdict: string | null;
  evidence_ref: string | null; note: string | null; created_at: string;
};

export async function executeReviewRead(agentId: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  const reviewId = typeof input.review_id === 'string' ? input.review_id.trim() : '';
  if (!reviewId) return { display: 'ERROR: donna_review_read needs review_id (donna_find surfaces filed reviews tagged [REVIEW] with their id).' };

  const { data: b, error } = await supabase
    .from('donna_review_binder')
    .select('id, client, work_ref, standard_ref, disposition, summary, status, created_at')
    .eq('id', reviewId).eq('agent_id', agentId).single();
  if (error || !b) return { display: `ERROR: review ${reviewId} not found in the cabinet.` };
  const binder = b as Binder;

  const { data: vs } = await supabase
    .from('donna_audit_verdict')
    .select('requirement, verdict, evidence_ref, note, created_at')
    .eq('agent_id', agentId).eq('review_id', reviewId)
    .order('created_at', { ascending: true });
  const verdicts = (vs ?? []) as Verdict[];

  const title = [binder.client, binder.work_ref].filter((x) => x && String(x).trim()).join(' / ') || '(unlabelled review)';
  const lines = [`REVIEW "${title}" — filed ${String(binder.created_at).slice(0, 10)}${binder.status ? ` \u00b7 ${binder.status}` : ''}:`];
  if (binder.standard_ref && binder.standard_ref.trim()) lines.push(`  measured against: ${binder.standard_ref}`);
  if (binder.disposition && binder.disposition.trim()) lines.push(`  disposition: ${binder.disposition}`);
  if (binder.summary && binder.summary.trim()) lines.push(`  summary: ${binder.summary}`);
  if (!verdicts.length) {
    lines.push(`  \u2014 no verdicts filed under this review yet.`);
  } else {
    lines.push(`  ${verdicts.length} verdict${verdicts.length === 1 ? '' : 's'} filed:`);
    for (const v of verdicts) {
      lines.push(`    - ${v.requirement ?? '(requirement unstated)'} -> ${v.verdict ?? '(no verdict word)'}`);
      if (v.evidence_ref && v.evidence_ref.trim()) lines.push(`        evidence: ${v.evidence_ref}`);
      if (v.note && v.note.trim()) lines.push(`        note: ${v.note}`);
    }
  }
  return { display: lines.join('\n') };
}
