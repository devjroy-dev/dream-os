// distill.ts — THE CLERK. One document in, one Brief on the shelf.
//
// The mechanism (Bible Part 14.6): the original lands in Supabase Storage (the
// cupboard — bytes, immutable, never parsed in place); a one-time Sonnet pass (the
// reading clerk, hired per document, then dismissed) reads it natively and produces
// the BRIEF — §-numbered, page-mapped, declared-gaps — which is inserted on the
// shelf (`briefs`). Donna's lens hands read ONLY the shelf. The citation chain:
// verdict row → § → page → stored original.
//
// The clerk's standing instruction lives in docs/BRIEF_FORMAT.md and is embedded
// below as CLERK_INSTRUCTION (the doc is the source; keep them in step).
//
// Briefs are IMMUTABLE (migration 0020): this module only ever INSERTS. A
// re-distillation of the same document inserts a new Brief and marks the old one
// superseded — old kept, chain unbroken.
import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'node:crypto';
import { supabase } from './db.js';
import { MODELS, calcCostInr } from './models.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUCKET = 'documents';
// The clerk's output budget — sized for circular-class monsters (two SEBI master
// circulars beheaded the original 8192 mid-§, replicated). 32k sits inside Sonnet's
// output bounds; a monster distill runs ~Rs 30-40, once per document, then Haiku
// forever. When even this truncates, SALVAGE applies (below) — never silent loss.
const CLERK_MAX_TOKENS = 32000;

const CLERK_INSTRUCTION = `You are the reading clerk. You read ONE document, once, and produce its BRIEF — the distilled, page-anchored index that is the only form in which this document will be read at working time. The original stays in storage as the final authority; your Brief is its honest index.

THE CHAIN YOU MUST NEVER BREAK: verdict → § → page → original. Every section carries the page it begins on. A § with no true page must not be emitted — content whose page cannot be determined goes into declared_gaps, never under a guessed anchor.

YOUR LAWS:
1. Distill, never transcribe. One § per substantive clause/schedule/section, following the document's own structure and numbering where it has one ("Section 3.2" -> ref "§3.2"); unstructured documents get sequential refs §1, §2, ... in reading order.
2. Load-bearing language verbatim, in quotes, inside the §'s text: numbers, caps, deadlines, notice periods, obligations, defined terms, schedule names. Paraphrase the surroundings; never paraphrase the operative words.
3. Declared gaps, plainly: whatever you could not read (scanned tables, illegible pages, images, missing schedules) — one plain sentence each in declared_gaps. An empty string asserts "nothing was unreadable."
4. Never invent: no guessed pages, no inferred sections, no "documents like this usually have." Absence is reported as absence — and where the document's own text promises an attachment that is not there, that absence is itself a §-entry.
5. The whole document accounted for: every page covered by some § or named in declared_gaps. If you cannot index it all within budget, cover what you honestly can and DECLARE THE CUT as a gap ("Sections beyond p.40 not indexed in this Brief").

OUTPUT: ONLY the JSON object below — no prose before or after, no markdown fences.
{"title": "<the document's own title, or a faithful descriptive name with date>", "pages": <count as actually seen>, "sections": [{"ref": "§3.2", "page": 7, "text": "..."}], "declared_gaps": "<one plain sentence per gap, or empty string>"}`;

export type DistillResult = {
  document_id: string;
  brief_id: string;
  title: string;
  pages: number | null;
  sections_count: number;
  declared_gaps: string;
  cost_inr: number;
  stop_reason: string | null;   // the clerk's own stop: 'end_turn' clean, 'max_tokens' truncated
  truncated: boolean;           // true = salvaged partial Brief, cut declared in gaps
  transcript_ref: string;       // cupboard path of the clerk's raw output — nothing evaporates
  superseded_brief_id?: string;
};

// SALVAGE — the format's truncation law, enforced in code (the model cannot see its
// own ceiling coming). From a beheaded JSON: recover title/pages, then every COMPLETE
// section object before the cut. One complete § is enough to shelve a partial Brief
// with the cut declared; zero means honest failure (transcript persisted either way).
function salvageBrief(raw: string): { title: string | null; pages: number | null; sections: Array<{ ref: string; page: number; text: string }> } {
  const titleM = raw.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const pagesM = raw.match(/"pages"\s*:\s*(\d+)/);
  const sections: Array<{ ref: string; page: number; text: string }> = [];
  const start = raw.indexOf('"sections"');
  if (start !== -1) {
    const arr = raw.indexOf('[', start);
    let i = arr === -1 ? -1 : arr + 1;
    while (i !== -1 && i < raw.length) {
      const open = raw.indexOf('{', i);
      if (open === -1) break;
      // Walk to the matching close brace, string-aware.
      let depth = 0, j = open, inStr = false, esc = false, close = -1;
      for (; j < raw.length; j++) {
        const c = raw[j];
        if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
        if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { close = j; break; } }
      }
      if (close === -1) break; // beheaded mid-object — stop; everything before is whole
      try {
        const obj = JSON.parse(raw.slice(open, close + 1));
        if (obj && typeof obj.ref === 'string' && typeof obj.page === 'number' && typeof obj.text === 'string') sections.push(obj);
      } catch { /* malformed object — skip, keep walking */ }
      i = close + 1;
    }
  }
  return {
    title: titleM ? JSON.parse('"' + titleM[1] + '"') : null,
    pages: pagesM ? parseInt(pagesM[1], 10) : null,
    sections,
  };
}

// Ensure the cupboard exists (idempotent — "already exists" is success).
async function ensureBucket(): Promise<void> {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`storage bucket: ${error.message}`);
  }
}

// Run the clerk against bytes already in hand, for a documents row that exists.
// Used by upload (fresh bytes) and re-distillation (bytes fetched from the cupboard).
async function runClerk(agentId: string, docId: string, storageRef: string, filename: string, dataB64: string): Promise<DistillResult> {
  // STREAMED by necessity: a 32k output budget can run past the SDK's 10-minute
  // non-streaming ceiling, so it refuses to even start unstreamed. Same call, same
  // instruction — the engine just collects the stream into one final message.
  const stream = anthropic.messages.stream({
    model: MODELS.sonnet,
    max_tokens: CLERK_MAX_TOKENS,
    system: CLERK_INSTRUCTION,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: dataB64 } },
        { type: 'text', text: 'Produce the Brief for this document. JSON only.' },
      ],
    }],
  });
  const resp = await stream.finalMessage();
  const costInr = calcCostInr(MODELS.sonnet, resp.usage.input_tokens, resp.usage.output_tokens);
  const stopReason = resp.stop_reason ?? null;
  const raw = resp.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('').trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

  // THE CLERK'S TRANSCRIPT — persisted to the cupboard beside the original, success
  // or failure, before any parsing. Nothing the clerk writes ever evaporates again.
  const transcriptRef = `${storageRef}.clerk.txt`;
  await supabase.storage.from(BUCKET).upload(transcriptRef, Buffer.from(raw, 'utf-8'), {
    contentType: 'text/plain', upsert: true,
  });

  let title: string | null = null;
  let pages: number | null = null;
  let sections: Array<{ ref: string; page: number; text: string }> = [];
  let declaredGaps = '';
  let truncated = false;

  try {
    const parsed = JSON.parse(raw) as { title?: string; pages?: number; sections?: Array<{ ref: string; page: number; text: string }>; declared_gaps?: string };
    title = typeof parsed.title === 'string' ? parsed.title : null;
    pages = typeof parsed.pages === 'number' ? parsed.pages : null;
    sections = Array.isArray(parsed.sections) ? parsed.sections.filter(
      (s) => s && typeof s.ref === 'string' && typeof s.page === 'number' && typeof s.text === 'string',
    ) : [];
    declaredGaps = typeof parsed.declared_gaps === 'string' ? parsed.declared_gaps : '';
  } catch {
    // Beheaded or malformed — SALVAGE: keep every complete § before the cut.
    const s = salvageBrief(raw);
    title = s.title; pages = s.pages; sections = s.sections;
    truncated = true;
    if (sections.length) {
      const last = sections[sections.length - 1];
      declaredGaps = `Brief truncated at the clerk's output budget (stop: ${stopReason ?? 'unknown'}); indexed through ${last.ref} (p.${last.page}) — content beyond not indexed. Re-distill after a budget raise for full coverage.`;
    }
  }

  if (!sections.length) {
    await supabase.from('events').insert({
      agent_id: agentId, actor: 'system', action: 'distill_failed',
      entity_type: 'documents', entity_id: docId,
      summary: `no salvageable sections (stop: ${stopReason ?? 'unknown'}); transcript at ${transcriptRef}`,
    });
    throw new Error(`the clerk produced no salvageable sections (stop: ${stopReason ?? 'unknown'}) — no Brief shelved. Original stored; clerk transcript kept at ${transcriptRef}. Retry distillation.`);
  }

  // The shelf: insert (immutable; a prior Brief for this document gets superseded).
  const { data: prior } = await supabase
    .from('briefs').select('id')
    .eq('document_id', docId).is('superseded_by', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  const { data: brief, error: briefErr } = await supabase
    .from('briefs')
    .insert({
      document_id: docId,
      agent_id: agentId,
      title: title && title.trim() ? title.trim() : filename,
      sections,
      pages,
      declared_gaps: declaredGaps,
      distilled_by: 'sonnet',
    })
    .select('id, title, pages, declared_gaps').single();
  if (briefErr) throw new Error(`briefs insert: ${briefErr.message}`);

  let supersededId: string | undefined;
  if (prior?.id) {
    await supabase.from('briefs').update({ superseded_by: brief.id }).eq('id', prior.id);
    supersededId = prior.id;
  }

  await supabase.from('events').insert({
    agent_id: agentId, actor: 'system', action: truncated ? 'distill_partial' : 'distill',
    entity_type: 'documents', entity_id: docId,
    summary: `${sections.length} §s shelved as brief ${brief.id}${truncated ? ' (TRUNCATED — cut declared in gaps)' : ''}; stop: ${stopReason ?? 'unknown'}`,
  });

  return {
    document_id: docId,
    brief_id: brief.id,
    title: brief.title,
    pages: brief.pages,
    sections_count: sections.length,
    declared_gaps: brief.declared_gaps ?? '',
    cost_inr: costInr,
    stop_reason: stopReason,
    truncated,
    transcript_ref: transcriptRef,
    ...(supersededId ? { superseded_brief_id: supersededId } : {}),
  };
}

// The whole clerk run: cupboard → card → Brief → shelf.
export async function uploadAndDistill(
  agentId: string,
  filename: string,
  contentType: string,
  dataB64: string,
): Promise<DistillResult> {
  if (contentType !== 'application/pdf') {
    throw new Error(`the clerk reads PDFs only for now (got ${contentType})`);
  }
  const bytes = Buffer.from(dataB64, 'base64');
  if (!bytes.length) throw new Error('empty file');

  await ensureBucket();
  const storageRef = `${agentId}/${randomUUID()}_${filename.replace(/[^\w.\-]+/g, '_')}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storageRef, bytes, {
    contentType, upsert: false,
  });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({ agent_id: agentId, storage_ref: storageRef, filename, content_type: contentType })
    .select('id').single();
  if (docErr) throw new Error(`documents insert: ${docErr.message}`);

  return runClerk(agentId, doc.id, storageRef, filename, dataB64);
}

// RE-DISTILLATION — the retry the failure message promises: the original is fetched
// from the cupboard (no re-upload), the clerk reads it again, the new Brief shelves
// and supersedes any prior. The card and the original are never touched.
export async function redistill(documentId: string): Promise<DistillResult> {
  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, agent_id, storage_ref, filename')
    .eq('id', documentId).single();
  if (error || !doc) throw new Error(`document not found: ${documentId}`);
  const { data: file, error: dlErr } = await supabase.storage.from(BUCKET).download(doc.storage_ref);
  if (dlErr || !file) throw new Error(`cupboard fetch failed: ${dlErr?.message ?? 'no file'}`);
  const dataB64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  return runClerk(doc.agent_id, doc.id, doc.storage_ref, doc.filename, dataB64);
}
