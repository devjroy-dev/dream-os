// donnaShelf.ts — Donna's LENS over the shelf. Two reads, no writes.
//
// The shelf (briefs) holds the clerk's card-files: each document distilled into
// §-numbered, page-anchored sections with DECLARED GAPS. Donna never holds fifty
// pages — she holds the index. These two hands are how:
//
// donna_shelf      — what's on the shelf: every live Brief's title, pages, § count,
//                    and its gap declaration, with the brief ids her next pull needs.
// donna_brief_read — open one Brief: the full § list, or exactly one § by ref, or
//                    only the §s whose text matches a term. Every § carries its page.
//
// The chain these hands serve (never break it): a citation is §-and-page or it is
// not a citation. The Brief is the index, not the authority — the stored original
// is the final word, and declared gaps mean the index itself admits incompleteness
// there. Superseded Briefs never appear: the shelf shows only current truth.
//
// Both are READS: they never mutate, never touch the snapshot.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import type { ToolOutcome } from '../snapshotTypes.js';

export const DONNA_SHELF_TOOL: Anthropic.Tool = {
  name: 'donna_shelf',
  description:
    "Look at the shelf — every document that has been distilled into a Brief (its §-numbered, page-anchored index). Returns each live Brief's id, title, page count, how many §-entries it holds, and its DECLARED GAPS — what the index itself admits it could not read, so you never treat a gap as an absence. Use it to know what documents you can cite from before a review, and to get the brief id that donna_brief_read needs. Superseded Briefs never appear — the shelf is current truth only.",
  input_schema: { type: 'object', properties: {} },
};

export const DONNA_BRIEF_READ_TOOL: Anthropic.Tool = {
  name: 'donna_brief_read',
  description:
    "Open one Brief from the shelf and read from its index. Give brief_id (donna_shelf shows them) and, optionally: ref (one exact § — '§3.2' — when you know where to look) or term (only the §s whose text mentions it — a clause topic, a defined term, a schedule name — when you're hunting). With neither, the whole § list returns. Every § carries the page it begins on — a finding you cite from here is cited as §-and-page, the chain back to the stored original. The Brief's declared gaps ride every read: where the index admits blindness, say so rather than treating silence as absence.",
  input_schema: {
    type: 'object',
    properties: {
      brief_id: { type: 'string', description: 'The Brief to open (from donna_shelf).' },
      ref: { type: 'string', description: "One exact § to pull, e.g. '§3.2'." },
      term: { type: 'string', description: 'Return only §s whose text contains this (case-insensitive).' },
    },
    required: ['brief_id'],
  },
};

export const SHELF_READ_TOOLS: Anthropic.Tool[] = [DONNA_SHELF_TOOL, DONNA_BRIEF_READ_TOOL];
export const SHELF_READ_NAMES = new Set<string>(SHELF_READ_TOOLS.map((t) => t.name));

type Section = { ref: string; page: number; text: string };

export async function executeShelf(agentId: string): Promise<ToolOutcome> {
  const { data, error } = await supabase
    .from('briefs')
    .select('id, title, pages, sections, declared_gaps, created_at')
    .eq('agent_id', agentId).is('superseded_by', null)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return { display: `ERROR reading the shelf: ${error.message}` };
  const rows = data ?? [];
  if (!rows.length) return { display: 'The shelf is empty — no documents have been distilled into Briefs yet.' };
  const lines = [`THE SHELF — ${rows.length} live Brief${rows.length === 1 ? '' : 's'}:`];
  for (const b of rows) {
    const n = Array.isArray(b.sections) ? b.sections.length : 0;
    lines.push(`  - ${b.id} — "${b.title}"${b.pages ? ` · ${b.pages} pages` : ''} · ${n} §-entries · shelved ${String(b.created_at).slice(0, 10)}`);
    if (b.declared_gaps && String(b.declared_gaps).trim()) lines.push(`      gaps declared: ${b.declared_gaps}`);
  }
  return { display: lines.join('\n') };
}

export async function executeBriefRead(agentId: string, input: Record<string, unknown>): Promise<ToolOutcome> {
  const briefId = typeof input.brief_id === 'string' ? input.brief_id.trim() : '';
  if (!briefId) return { display: 'ERROR: donna_brief_read needs brief_id (donna_shelf shows them).' };
  const ref = typeof input.ref === 'string' ? input.ref.trim() : '';
  const term = typeof input.term === 'string' ? input.term.trim().toLowerCase() : '';

  const { data: b, error } = await supabase
    .from('briefs')
    .select('id, title, pages, sections, declared_gaps, superseded_by')
    .eq('id', briefId).eq('agent_id', agentId).single();
  if (error || !b) return { display: `ERROR: Brief ${briefId} not found on this shelf.` };

  const all = (Array.isArray(b.sections) ? b.sections : []) as Section[];
  let picked = all;
  let how = 'full index';
  if (ref) {
    picked = all.filter((s) => s.ref === ref || s.ref === `§${ref.replace(/^§/, '')}`);
    how = `ref ${ref}`;
  } else if (term) {
    picked = all.filter((s) => s.text.toLowerCase().includes(term) || s.ref.toLowerCase().includes(term));
    how = `term "${term}"`;
  }

  const lines = [`BRIEF "${b.title}"${b.pages ? ` (${b.pages} pages)` : ''}${b.superseded_by ? ' [SUPERSEDED — a newer Brief exists; cite that one]' : ''} — ${how}:`];
  if (!picked.length) {
    lines.push(ref
      ? `  No § with ref ${ref} in this Brief. The index holds ${all.length} §s — read without ref to see them, and remember the declared gaps before treating this as absence.`
      : `  No § mentions "${term}" in this index (${all.length} §s). Check the declared gaps before treating this as absence — and the stored original is the final word.`);
  } else {
    for (const s of picked) lines.push(`  ${s.ref} (p.${s.page}): ${s.text}`);
    if (picked.length < all.length && !ref) lines.push(`  …${picked.length} of ${all.length} §s matched.`);
  }
  if (b.declared_gaps && String(b.declared_gaps).trim()) {
    lines.push(`  DECLARED GAPS (the index admits blindness here): ${b.declared_gaps}`);
  }
  return { display: lines.join('\n') };
}
