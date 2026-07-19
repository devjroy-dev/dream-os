// donnaFind.ts — Donna's eyes. The one READ tool over the estate: the wide `records`
// table (binders) AND, since TDW_04 B0 item 4a, the typed `public.leads` plane (LD-1).
//
// Donna has write-atoms (recordPrimitives) but, until this, no way to LOOK. Without
// eyes she cannot reconcile against ground truth before writing — which is the whole
// of verify-before-create — and across turns she duplicates because she can't see
// what already exists. This is that read: search `records` by client / note / stage
// / date (any combination), and get back the matching rows WITH their ids, so a found
// id can feed straight into a write (binder_id), an edit, a hide, or a retrieve.
//
// It is a READ. It never mutates, never patches the snapshot. (Later this grows into
// Mike's warm retrieval; for now it is the plain, honest lookup — the eyes that let
// the verify-before-create instinct actually complete instead of hitting a wall.)
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import { vendorIdFromAgent } from '../vendorIdentity.js'; // TDW_04 B0 item 4a: the reverse bridge, mirroring donnaLead's plane
import type { ToolOutcome, ViewRow } from '../snapshotTypes.js';

// Map a found row to the shell's ViewRow (drops internal-only fields).
function toViewRow(r: { id: string; client: string | null; direction: string | null;
  amount: number | null; amount_received: number | null; amount_pending: number | null;
  payment_status: string | null; date: string | null; stage: string | null;
  note: string | null; doc_ref: string | null; phone: string | null;
  hidden?: boolean | null }): ViewRow {
  return {
    id: r.id, client: r.client, direction: r.direction, amount: r.amount,
    amount_received: r.amount_received, amount_pending: r.amount_pending,
    payment_status: r.payment_status, date: r.date, stage: r.stage,
    note: r.note, doc_ref: r.doc_ref, phone: r.phone, hidden: r.hidden ?? false,
  };
}

export const DONNA_FIND_TOOL: Anthropic.Tool = {
  name: 'donna_find',
  description:
    "Look in the cabinet before you write. Casts a WIDE net: give any names or terms you have — a person, a company, a fragment — and it returns the plausible matching binders, best match first, WITH their binder ids, for you to judge which (if any) is the one. Each term is matched across every field (name, note, doc, phone), so a term finds its record even if it was filed under a different field; a term that matches is enough, extra terms only sharpen the ranking and never shrink the net. Use it to reconcile against what's really on file before you create (so you never file a duplicate), to find the right existing record to add to, or to pull the binder id you need to edit, hide, or retrieve one. stage/date, when given, nudge the ranking rather than filtering. It searches BOTH planes in one pass: your binders (the cabinet) AND the enquiries plane — typed leads, tagged [ENQUIRY], which carry their own state and budget and are NOT binders (binder hands don't attach to an enquiry id). A person can exist on either plane or both, so finding a binder never means there is no enquiry, and finding neither means neither — but if a plane cannot be read, you will be told exactly that, and 'could not be read' is never 'there is none'. Archived (set-aside) records are ALWAYS included, tagged [ARCHIVED] — nothing is ever hidden from your search. Each result also shows which field your term matched on (e.g. 'matched on: note'), so a record that merely mentions a name in its notes is never mistaken for the record OF that name. If nothing matches, you'll get the most recent records back anyway, so a missing or differently-filed name is never a dead end. With nothing given, returns the most recent records.",
  input_schema: {
    type: 'object',
    properties: {
      client: { type: 'string', description: 'A name/person/company/term to search for. Matched (case-insensitive) across all text fields, not just the client column.' },
      note: { type: 'string', description: 'Another term to search for (e.g. a company, a detail). Matched across all text fields and ORed with the other terms — it widens the net, never narrows it.' },
      stage: { type: 'string', description: 'Match records at this stage (the lifecycle word for the field).' },
      date: { type: 'string', description: 'Match records on this exact date (YYYY-MM-DD).' },
      include_hidden: { type: 'boolean', description: 'Also return archived (hidden / set-aside) records. Default false. Needed to get the id of an archived record before retrieving it.' },
    },
  },
};

// The read tools, kept as their own list so the read/write seam is explicit (it is
// where Mike later splits placement from retrieval). READ_TOOL_NAMES lets the runtime
// route a read so it never flips `mutated` or touches the snapshot.
export const DONNA_WHATSDUE_TOOL: Anthropic.Tool = {
  name: 'donna_whatsdue',
  description:
    "What's due or overdue right now — the records whose follow-up date has arrived (today or earlier), so nothing slips. Use it when Harvey asks what's coming up / what's pending / what needs chasing, or to lead the day with what matters. Optionally give 'through' (YYYY-MM-DD) to look ahead to a date (e.g. end of the week) instead of just today. Returns the due records with their binder ids, soonest first.",
  input_schema: {
    type: 'object',
    properties: {
      through: { type: 'string', description: "Look ahead through this date (YYYY-MM-DD). Omit to see what's due as of today." },
    },
  },
};

export const READ_TOOLS: Anthropic.Tool[] = [DONNA_FIND_TOOL, DONNA_WHATSDUE_TOOL];
export const READ_TOOL_NAMES = new Set<string>(READ_TOOLS.map((t) => t.name));

type FoundRow = {
  id: string;
  amount: number | null;
  client: string | null;
  date: string | null;
  direction: string | null;
  doc_ref: string | null;
  note: string | null;
  phone: string | null;
  stage: string | null;
  amount_received: number | null;
  amount_pending: number | null;
  payment_status: string | null;
  reason_for_action: string | null;
  hidden: boolean | null;
};

type LeadFound = {
  id: string; name: string | null; phone: string | null; state: string | null;
  budget_max: number | null; wedding_date: string | null; wedding_city: string | null;
  notes: string | null;
}; // TDW_04 B0 item 4a — public.leads read shape (typed plane, LD-1)

const FIND_SELECT = 'id, amount, client, date, direction, doc_ref, note, phone, stage, amount_received, amount_pending, payment_status, reason_for_action, hidden';
// FIND_LIMIT — THE NAMED CONSTANT (M-4, ruled at the manual paper, 2026-07-18): 15,
// because recognition wants breadth — the zero-match fallback exists so a record
// whose name no longer points to it can be recognised, and a wider recents list is
// what makes that recovery real. Ruled into law with the reason attached because
// the number had already drifted while nobody owned it: the in-file comment said
// "10 records" while the code said 15 (R-B6-13's own record carried the 10) — a
// residue number drifts; a named constant with its reason cannot. Governs the
// matched cap, the zero-match recents, and the leads-plane slice alike.
const FIND_LIMIT = 15;

// One compact line per row, id first (the id is the whole point — it feeds the next
// write/edit/hide/retrieve). Empty cells are omitted so the line stays readable.
// Which text fields a token actually hit on this row. This is the metadata that stops a
// note-echo masquerading as a client match: if you search "Nova" and it only matched in
// this row's NOTE (not its client field), the line says so plainly — so a record named
// "Elena" that merely mentions Nova in its note can't be mistaken for the Nova record.
function matchedFields(r: FoundRow, tokens: string[]): string[] {
  if (tokens.length === 0) return [];
  const cols: Array<[string, string | null]> = [
    ['client', r.client], ['note', r.note], ['doc', r.doc_ref], ['phone', r.phone],
    ['self', r.reason_for_action],
  ];
  const hit: string[] = [];
  for (const [name, val] of cols) {
    const v = (val ?? '').toLowerCase();
    if (v && tokens.some((t) => v.includes(t.toLowerCase()))) hit.push(name);
  }
  return hit;
}

function describeRow(r: FoundRow, tokens: string[] = []): string {
  const bits: string[] = [];
  if (r.client) bits.push(`client="${r.client}"`);
  if (r.amount != null) bits.push(`Rs ${r.amount}${r.direction ? ' ' + r.direction : ''}`);
  if (r.amount_received != null) bits.push(`received Rs ${r.amount_received}`);
  if (r.amount_pending != null) bits.push(`pending Rs ${r.amount_pending}`);
  if (r.payment_status) bits.push(`payment ${r.payment_status}`);
  if (r.date) bits.push(`date ${r.date}`);
  if (r.stage) bits.push(`stage ${r.stage}`);
  if (r.phone) bits.push(`phone ${r.phone}`);
  if (r.doc_ref) bits.push(`doc ${r.doc_ref}`);
  if (r.note) bits.push(`"${r.note}"`);
  if (r.reason_for_action) bits.push(`self:"${r.reason_for_action}"`);
  const tail = r.hidden ? ' [ARCHIVED]' : '';
  const hit = matchedFields(r, tokens);
  const prov = hit.length ? ` — matched on: ${hit.join(', ')}` : '';
  return `[${r.id}] ${bits.join(' | ') || '(empty record)'}${tail}${prov}`;
}

// M-4 — RECOGNITION LINES (the ruled recents shape, seated in the mechanical-floors
// ZIP): name-as-shown · plane/archive tag · stage · id. The load-bearing pieces and
// nothing else. Phones and money are DROPPED from a recents dump — a dead-end (or
// no-argument) search needs to RECOGNISE a record, not to know its budget, and a rich
// dump of OTHER records' figures is F-04.70's donor pool one layer deeper (the ₹50,000
// came from a neighbouring line; a recents dump is the same neighbourhood). Matched
// payloads are untouched: a real match still rides describeRow whole, everything on it.
//
// TWO DOORS wear this shape, both gated on tokens.length === 0. (1) the ZERO-MATCH
// fallback (:408) — tokens given, nothing matched. (2) F-06.11 (CE-ruled 2026-07-18)
// the NO-ARGUMENT recents dump on the MAIN return (:448) — donna_find({}) with records
// present falls THROUGH the zero-match branch (rows.length > 0) into the main return,
// where it was riding describeRow whole (full budget/phone, both planes) — the last
// uncovered door, now floored to match (1).
function recognitionRow(r: FoundRow): string {
  const bits: string[] = [];
  if (r.client) bits.push(`client="${r.client}"`);
  if (r.stage) bits.push(`stage ${r.stage}`);
  const tail = r.hidden ? ' [ARCHIVED]' : '';
  return `[${r.id}] ${bits.join(' | ') || '(unnamed record)'}${tail}`;
}

export async function executeFindTool(
  agentId: string,
  input: Record<string, unknown>,
): Promise<ToolOutcome> {
  const client = typeof input.client === 'string' ? input.client.trim() : '';
  const note = typeof input.note === 'string' ? input.note.trim() : '';
  const stage = typeof input.stage === 'string' ? input.stage.trim() : '';
  const date = typeof input.date === 'string' ? input.date.trim() : '';
  const includeHidden = input.include_hidden === true;

  // WIDE NET, not a strict filter. The tool's job is recall — surface every plausible
  // binder and let Donna (the reasoning one) judge which is the one. So text terms are
  // ORed across ALL text columns: a term finds its row whether it was stored in client,
  // note, doc_ref, or phone (people cram "Karan, Stride Footwear" into client, then search
  // for "Stride Footwear" — both must hit the same row). A populated field that matches is
  // enough; an extra term that misses must NEVER zero the result. stage/date, when given,
  // are soft signals that boost rank, never hard filters that exclude.

  // TOKENIZE, then wide-net. The whole bug is that Donna files and searches the same
  // thing punctuated differently — she stores "Karan, Stride Footwear" (comma) and later
  // searches "Karan Stride Footwear" (no comma), so a whole-phrase substring match misses
  // on the comma. The fix: break whatever she passes into individual WORDS, and match each
  // word across every text field. "Karan" alone, "Stride Footwear", or the glued
  // "Karan Stride Footwear" all reduce to the same word-set and all find the row. A word
  // that matches any field is a hit; punctuation, word-order, and phrasing stop mattering.

  // ── THE SHELF IS PART OF THE DISK ──────────────────────────────────────────
  // donna_find searches records AND the shelf (briefs) in one pass. A work product
  // uploaded for review is a Brief, never a records row; a find that ignored the
  // shelf would report "empty" while the document sat right there (the C&T
  // supervision miss, 2026-06-11). So we run the same tokens against brief titles and
  // fold the hits into the result, each with its brief_id + pages so judgment can
  // read it next with donna_brief_read.
  // ── THE TYPED PLANE IS PART OF THE ESTATE ────────────────────────────────
  // TDW_04 B0 item 4a (CE-ruled 2026-07-15). donna_find was records-only: it could not
  // see public.leads at all, so a dispatched search over half the estate answered as if
  // the other half did not exist. LD-1: typed tables own leads; engine.records own
  // binders. A vendor's "Swati" may live on either plane; eyes that see one plane and
  // speak for both are the confusion this block exists to kill.
  //
  // Vendor-scoped and READ-ONLY, mirroring donnaLead's plane exactly: the reverse
  // identity bridge (vendorIdentity.ts) -> supabase.schema('public') -> .eq('vendor_id')
  // -> .is('deleted_at', null) (the read-path honesty law — a soft-deleted lead is gone).
  // This never writes and never patches the snapshot; it is the same honest lookup the
  // rest of this tool is.
  //
  // FAIL-CLOSED (F15's shape, and this tool's own disease): a guard read that ERRORS is
  // NOT a read that found nothing. This tool's empty branches say "Nothing on file yet"
  // and "No record matched" — if a failed leads read fell through to those sentences,
  // the tool would assert ABSENCE FROM A FAILED READ. That is F-04.21 head (b) rebuilt
  // inside the cure for it. So the error is carried, never swallowed, and every branch
  // below says the leads plane could not be read rather than that it was empty.
  //
  // SCOPE: reach only. Whether the model DISPATCHES this tool before speaking is the
  // confidence-triggered-retrieval gap (SURFACE_TRUTH_AUDIT §2:55) and belongs to Block
  // 06 — untouched here.
  // M-4 rider on the same ruling: when the leads slice rides the ZERO-MATCH dump
  // with no tokens at all (nothing matched anything — this is a recents dump, not a
  // match), its lines take the recognition shape too: name-as-shown · [ENQUIRY]
  // tag · state · id. Token-MATCHED enquiry lines are matches and keep their full
  // payload unchanged, on either branch ("matched payloads untouched" — the
  // ruling's own words).
  async function searchLeads(tokenList: string[], recognitionOnly = false): Promise<{ lines: string[]; error: string | null }> {
    const vendorId = await vendorIdFromAgent(agentId);
    if (!vendorId) {
      return { lines: [], error: 'the owner account for this agent could not be resolved' };
    }
    const pub = supabase.schema('public');
    let lq = pub
      .from('leads')
      .select('id, name, phone, state, budget_max, wedding_date, wedding_city, notes')
      .eq('vendor_id', vendorId)
      .is('deleted_at', null);
    if (tokenList.length > 0) {
      const cols = ['name', 'phone', 'wedding_city', 'notes'];
      const conds: string[] = [];
      for (const t of tokenList) for (const c of cols) conds.push(`${c}.ilike.%${t}%`);
      lq = lq.or(conds.join(','));
    }
    const { data, error } = await lq.order('created_at', { ascending: false }).limit(FIND_LIMIT);
    if (error) return { lines: [], error: error.message };
    const rowsL = (data ?? []) as LeadFound[];
    return {
      lines: rowsL.map((l) => {
        if (recognitionOnly) {
          const st = l.state ? ` | state ${l.state}` : '';
          return `  [ENQUIRY] ${l.id} — "${l.name ?? 'unknown'}"${st}` +
                 ` (typed lead — not a binder; binder hands don't attach to this id)`;
        }
        const bits: string[] = [];
        if (l.state) bits.push(`state ${l.state}`);
        if (l.budget_max != null) bits.push(`budget Rs ${l.budget_max}`);
        if (l.wedding_date) bits.push(`wedding ${l.wedding_date}`);
        if (l.wedding_city) bits.push(l.wedding_city);
        if (l.phone) bits.push(`phone ${l.phone}`);
        return `  [ENQUIRY] ${l.id} — "${l.name ?? 'unknown'}"${bits.length ? ' | ' + bits.join(' | ') : ''}` +
               ` (typed lead — not a binder; binder hands don't attach to this id)`;
      }),
      error: null,
    };
  }

  async function searchShelf(tokenList: string[]): Promise<string[]> {
    let bq = supabase
      .from('briefs')
      .select('id, title, pages')
      .eq('agent_id', agentId)
      .is('superseded_by', null);
    if (tokenList.length > 0) {
      const conds = tokenList.map((t) => `title.ilike.%${t}%`);
      bq = bq.or(conds.join(','));
    }
    const { data: briefs } = await bq.order('created_at', { ascending: false }).limit(20);
    const rowsB = (briefs ?? []) as { id: string; title: string; pages: number | null }[];
    return rowsB.map(
      (b) => `  [SHELF] ${b.id} — "${b.title}"${b.pages ? ` · ${b.pages} pages` : ''} (read it with donna_brief_read)`,
    );
  }

  // ── FILED REVIEWS ARE PART OF THE DISK TOO ────────────────────────
  // donna_review opens a binder (donna_review_binder) and donna_verdict files
  // findings under it — but until this, donna_find never looked there, so a filed
  // review never came back and the whole audit was re-run cold ("Reviews aren't
  // binders" — the operator, 2026-06-11). Same fix as the shelf: run the same tokens
  // against the binder's coordinates (client, work_ref, summary, disposition) and fold
  // the hits in tagged [REVIEW] with the review_id, so donna_review_read can open the
  // verdicts next. The verdicts are never copied here — only the binder's coordinates.
  async function searchReviews(tokenList: string[]): Promise<string[]> {
    let rq = supabase
      .from('donna_review_binder')
      .select('id, client, work_ref, status, disposition, created_at')
      .eq('agent_id', agentId);
    if (tokenList.length > 0) {
      const conds: string[] = [];
      for (const t of tokenList) {
        conds.push(`client.ilike.%${t}%`);
        conds.push(`work_ref.ilike.%${t}%`);
        conds.push(`summary.ilike.%${t}%`);
        conds.push(`disposition.ilike.%${t}%`);
      }
      rq = rq.or(conds.join(','));
    }
    const { data: revs } = await rq.order('created_at', { ascending: false }).limit(20);
    const rowsR = (revs ?? []) as { id: string; client: string | null; work_ref: string | null; status: string | null; disposition: string | null; created_at: string }[];
    return rowsR.map((r) => {
      const label = [r.client, r.work_ref].filter((x) => x && String(x).trim()).join(' / ') || '(unlabelled review)';
      const tail = `${r.status ? ` · ${r.status}` : ''} · filed ${String(r.created_at).slice(0, 10)}`;
      return `  [REVIEW] ${r.id} — "${label}"${tail} (read it with donna_review_read)`;
    });
  }

  // Split every supplied value on whitespace AND punctuation into words; keep words of 2+
  // chars (drops noise like a stray "a"); dedupe, case-insensitive.
  const rawText = [client, note].filter((t) => t.length > 0).join(' ');
  const tokens = Array.from(
    new Set(
      rawText
        .split(/[^\p{L}\p{N}]+/u)   // split on anything that isn't a letter/number
        .map((w) => w.trim())
        .filter((w) => w.length >= 2),
    ),
  );

  // Option B: hidden records are NEVER invisible to a search. Every search returns active
  // AND archived rows, each tagged ([ARCHIVED]) by describeRow. Invisibility is what let a
  // record split off unseen (the Nova/Elena chaos); the archive is now always in view,
  // marked, so the agent's judgment always sees the full shelf. include_hidden is retained
  // for compatibility but no longer gates anything — hidden always shows.
  void includeHidden;
  let q = supabase.from('records').select(FIND_SELECT).eq('agent_id', agentId);

  // ONE combined OR across every (token x text-column) pair. Critical: chaining multiple
  // .or() calls would AND the groups (PostgREST) and re-introduce the miss. So a SINGLE
  // .or(): any token matching any text column is a hit. (Tokens are already alphanumeric
  // after the split above, so they can't contain commas/parens that would break syntax.)
  const TEXT_COLS = ['client', 'note', 'doc_ref', 'phone', 'reason_for_action'];
  if (tokens.length > 0) {
    const conds: string[] = [];
    for (const t of tokens) {
      for (const c of TEXT_COLS) conds.push(`${c}.ilike.%${t}%`);
    }
    q = q.or(conds.join(','));
  }
  // If no usable text terms were given, fall back to stage/date as the filter so a
  // stage-only or date-only lookup still works; otherwise it's a recents list.
  if (tokens.length === 0) {
    if (stage) q = q.eq('stage', stage);
    if (date) q = q.eq('date', date);
  }

  // Pull a generous slice (we rank in-memory, so fetch more than we'll show).
  const { data, error } = await q
    .order('updated_at', { ascending: false })
    .limit(FIND_LIMIT * 3 + 1);

  if (error) return { display: `ERROR searching records: ${error.message}` };

  let rows = (data ?? []) as unknown as FoundRow[];
  if (rows.length === 0) {
    // A search can still come up empty when the NAME itself is gone — e.g. a record's
    // name was overwritten, so searching the old name matches nothing even though the row
    // is right there. An empty result must never be a dead end: fall back to the most
    // recent records (active AND archived, tagged) so the agent can recognise the one she
    // means by its CONTENTS when its name no longer points to it. Recovery comes from
    // surfacing the shelf, because a record whose only key is destroyed can't be reasoned to.
    // (Word-swept at B6 sitting 2, R-B6-13: "handle" was a second teacher of F-04.66's
    // word, engine-side — the display string below taught it to the model; this comment
    // taught it to the next maintainer. Both dropped; the referent is the NAME AS SHOWN.
    // The zero-match DUMP SIZE and payload, routed to Block 06 by the same ruling, were
    // RULED at the manual paper (M-4, 2026-07-18): FIND_LIMIT is the named constant
    // above, and this dump returns RECOGNITION LINES — recognitionRow's shape, phones
    // and money dropped from the zero-match dump only, matched payloads untouched.)
    const { data: recent } = await supabase
      .from('records')
      .select(FIND_SELECT)
      .eq('agent_id', agentId)
      .order('updated_at', { ascending: false })
      .limit(FIND_LIMIT);
    const recentRows = (recent ?? []) as unknown as FoundRow[];
    // The cabinet (records) gave nothing — but the document may be on the SHELF.
    // Search briefs with the same tokens before ever calling this a dead end.
    const shelfHits = await searchShelf(tokens);
    const reviewHits = await searchReviews(tokens);
    // TDW_04 B0 item 4a: the typed plane, and its fail-closed voice. M-4: with no
    // tokens this slice is a recents dump riding the zero-match fallback, so it
    // takes the recognition shape; with tokens it is a MATCH and stays whole.
    const leads = await searchLeads(tokens, tokens.length === 0);
    const leadTail = leads.error
      ? `\nEnquiries (typed leads): COULD NOT BE READ — ${leads.error}. This is not "none": the enquiry plane is unknown this turn. Say so rather than speak for it.`
      : leads.lines.length
        ? `\nAnd on the enquiries plane:\n${leads.lines.join('\n')}`
        : '';
    if (recentRows.length === 0) {
      if (shelfHits.length || reviewHits.length || leads.lines.length || leads.error) {
        const parts: string[] = ['No records in the cabinet — but the disk holds more:'];
        if (shelfHits.length) parts.push('On the shelf:\n' + shelfHits.join('\n'));
        if (reviewHits.length) parts.push('Filed reviews:\n' + reviewHits.join('\n'));
        if (leads.lines.length) parts.push('On the enquiries plane (typed leads):\n' + leads.lines.join('\n'));
        if (leads.error) parts.push(`Enquiries (typed leads): COULD NOT BE READ — ${leads.error}. Not "none" — unknown. Say so.`);
        return { display: parts.join('\n') };
      }
      // Both planes truthfully read, both empty. Only NOW may this sentence be spoken.
      return { display: 'Nothing on file yet — the cabinet is empty, no enquiry matches on the typed plane, the shelf holds no matching document, and no filed review matches.' };
    }
    const termNote = tokens.length ? ` for "${tokens.join(' ')}"` : '';
    const shelfTail = shelfHits.length ? `\nAnd on the shelf:\n${shelfHits.join('\n')}` : '';
    const reviewTail = reviewHits.length ? `\nAnd in filed reviews:\n${reviewHits.join('\n')}` : '';
    // F-06.14 (CE-ruled 2026-07-19): the zero-match dump is a RECOGNITION LIST, never a
    // result set. The live Sana specimen — a DeepSeek-Donna reading `[rec-34] Meher Card
    // Test` off this very list back to Harvey as "Sana Verma is on file, rec-34…" — was this
    // list misread as matches for the searched name. The framing now says, in the tool's own
    // voice, exactly what these lines are and are NOT: none of them is the searched name;
    // they are the owner's other recent binders, shown ONLY so a record whose name changed can
    // be recognised and re-pointed to; and if the searched name is not among them by its own
    // words, it is simply not on file — which is the honest answer, spoken as absence, never a
    // neighbour's line dressed as the searched record. (Phones and money stay dropped here —
    // recognitionRow, M-4 — so a misread list can at least never carry a neighbour's figure.)
    return {
      display:
        `No record matched${termNote}. NONE of the records below is that name — they are your other ` +
        `most recent binders (active and archived), shown only so you can recognise one whose name may ` +
        `have changed and re-point to it; they are recognition, not results for what you searched, and ` +
        `you never read one of them back as the record you were asked about. If the name${termNote ? ` (${tokens.join(' ')})` : ''} ` +
        `is not among these by its own words, it is not on file — say exactly that, and reach for none of ` +
        `these in its place:\n` +
        recentRows.map((r) => recognitionRow(r)).join('\n') + leadTail + shelfTail + reviewTail,
    };
  }

  // Rank by how many supplied signals each row hits — best candidate first. This is what
  // turns a wide net into a useful one: the row matching both name and company floats up,
  // a name-only hit still shows. stage/date matches add to the score (soft boost).
  const lc = (x: string | null) => (x ?? '').toLowerCase();
  const rowText = (r: FoundRow) => [r.client, r.note, r.doc_ref, r.phone, r.reason_for_action].map(lc).join(' ');
  function score(r: FoundRow): number {
    let sc = 0;
    const txt = rowText(r);
    for (const t of tokens) if (txt.includes(t.toLowerCase())) sc += 2; // more words hit = better candidate
    if (stage && lc(r.stage) === stage.toLowerCase()) sc += 1;
    if (date && r.date === date) sc += 1;
    return sc;
  }
  rows = rows
    .map((r) => ({ r, sc: score(r) }))
    .sort((a, b) => b.sc - a.sc)
    .map((x) => x.r);

  const more = rows.length > FIND_LIMIT;
  const shown = rows.slice(0, FIND_LIMIT);
  const header = more
    ? `Found more than ${FIND_LIMIT} — showing the ${FIND_LIMIT} best matches:`
    : `Found ${shown.length} record${shown.length === 1 ? '' : 's'}:`;
  const shelfHits = await searchShelf(tokens);
  const shelfTail = shelfHits.length ? `\nOn the shelf as well:\n${shelfHits.join('\n')}` : '';
  const reviewHits = await searchReviews(tokens);
  const reviewTail = reviewHits.length ? `\nFiled reviews as well:\n${reviewHits.join('\n')}` : '';
  // TDW_04 B0 item 4a: binders found does NOT mean the enquiry plane is empty — a twin
  // may sit on the typed plane with a different state (the Meera/Keka shape). Both
  // planes, every time, or an honest word about the one that could not be read.
  // F-06.11 (M-4 rider, CE-ruled 2026-07-18): this is the MAIN return, which a NO-ARGUMENT
  // call falls through to when the desk holds records (rows.length > 0, so the zero-match
  // fallback above is never entered). With no tokens this is a recents dump, not a match,
  // so its leads slice takes the recognition shape too — exactly as the zero-match slice
  // already does (searchLeads(tokens, tokens.length === 0), :382). Token-MATCHED enquiry
  // lines stay whole (budget/phone), unchanged: the flag is false whenever a token is present.
  const leads = await searchLeads(tokens, tokens.length === 0);
  const leadTail = leads.error
    ? `\nEnquiries (typed leads): COULD NOT BE READ — ${leads.error}. Not "none" — unknown. Say so rather than speak for it.`
    : leads.lines.length
      ? `\nOn the enquiries plane as well (typed leads — a binder and an enquiry can be the same person):\n${leads.lines.join('\n')}`
      : '';
  // F-06.11 (M-4, CE-ruled 2026-07-18): a NO-ARGUMENT call reaches HERE (not the zero-match
  // fallback) whenever the desk holds any record — an unranked recents dump wearing the
  // main-return costume. The recognition shape must reach this last uncovered door: with no
  // tokens, each record rides recognitionRow (name-as-shown · [ARCHIVED] tag · stage · id —
  // phones and money DROPPED), the same floor the zero-match dump already stands on (:408).
  // A real find (tokens present) is UNTOUCHED: it keeps describeRow whole, everything on it,
  // because a match wanted the payload. The tokeniser is correct; the net is not widened.
  const recentsShape = tokens.length === 0;
  const rendered = shown.map((r) => (recentsShape ? recognitionRow(r) : describeRow(r, tokens))).join('\n');
  return { display: `${header}\n${rendered}${leadTail}${shelfTail}${reviewTail}`, found: shown.map(toViewRow) };
}

// donna_whatsdue — the records whose follow-up date has arrived (followup_on <= asOf).
// `today` comes from the clock (the runtime passes it); `through` (optional, in input)
// looks ahead to a later date instead of just today. Soonest-due first. A READ — never
// mutates, never patches the snapshot.
const DUE_SELECT = 'id, amount, client, date, direction, doc_ref, note, phone, stage, hidden, followup_on, followup_note, repeat_every';

export async function executeWhatsDue(
  agentId: string,
  today: string,
  input: Record<string, unknown>,
): Promise<ToolOutcome> {
  const through = typeof input.through === 'string' && input.through.trim() ? input.through.trim() : today;
  const { data, error } = await supabase
    .from('records')
    .select(DUE_SELECT)
    .eq('agent_id', agentId)
    .eq('hidden', false)
    .not('followup_on', 'is', null)
    .lte('followup_on', through)
    .order('followup_on', { ascending: true })
    .limit(FIND_LIMIT + 1);
  if (error) return { display: `ERROR checking what's due: ${error.message}` };
  const rows = (data ?? []) as unknown as (FoundRow & { followup_on: string | null; followup_note: string | null; repeat_every: string | null })[];
  if (rows.length === 0) {
    return { display: through === today ? 'Nothing due as of today.' : `Nothing due through ${through}.` };
  }
  const shown = rows.slice(0, FIND_LIMIT);
  const lines = shown.map((r) => {
    const who = r.client ? ` ${r.client}` : '';
    const why = r.followup_note ? ` — ${r.followup_note}` : '';
    const rpt = r.repeat_every ? ` (repeats ${r.repeat_every})` : '';
    const overdue = r.followup_on && r.followup_on < today ? ' [OVERDUE]' : '';
    return `[${r.id}] due ${r.followup_on}${overdue}${who}${why}${rpt}`;
  });
  const header = `Due${through === today ? ' now' : ` through ${through}`}: ${shown.length}${rows.length > FIND_LIMIT ? '+' : ''}`;
  return { display: `${header}\n${lines.join('\n')}`, found: shown.map(toViewRow) };
}
