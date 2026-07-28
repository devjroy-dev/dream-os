// donnaLead.ts — Donna's lead tool, READ-BEFORE-WRITE — TDW_02 P1: files into
// public.leads (the typed plane, LD-1) so the Leads CRUD sees what Victor
// captures the moment it is captured. Previously targeted engine-schema `leads`
// — a table verified EMPTY in prod (never wired into DONNA_TOOLS; Amendment One
// D1) — so this rewrite changes where truth lands without changing any lived
// behavior. Also exports ESCALATE_TOOL (plumbing, name unchanged — no character).
//
// Recognize-before-create preserved: an existing lead for this vendor matched
// by exact phone or case-insensitive name is ENRICHED (fill blanks, update
// value/state), never duplicated — the double-Priya fix, now on the typed plane.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import { vendorIdFromAgent } from '../vendorIdentity.js';
import { leadDraftMeta } from '../draftContracts.js';
import type { ToolOutcome, SnapshotItem } from '../snapshotTypes.js';
import { phoneKey } from '../phoneKey.js'; // TDW_04 engine-lane (ST-3b)
import { rs } from './recordPrimitives.js'; // TDW_06 M-4 (R2-B) — the house money register, one grouped home

// Columns read back on every write — draft_meta INCLUDED (enrich reads the standing
// provenance). Pre-0072 resilience lives in writeLead's column-guarded retry below,
// not in this SELECT. (Comment corrected to code truth, 02-HOTFIX 2026-07-15.)
const SEL = 'id, name, phone, wedding_date, wedding_date_precision, wedding_city, budget_max, state, source, referrer_name, notes, raw_message, draft_meta, created_at'; // created_at: TDW_06 M-1 (P1)

type LeadRow = {
  id: string; name?: string | null; phone?: string | null;
  wedding_date?: string | null; wedding_date_precision?: string | null; wedding_city?: string | null;
  budget_max?: number | null; state?: string | null; source?: string | null;
  referrer_name?: string | null; notes?: string | null; raw_message?: string | null;
  created_at?: string | null; // TDW_06 M-1 (P1)
};

// Build the snapshot item for a lead row (open pipeline item, sourced from truth).
function leadItem(row: LeadRow): SnapshotItem {
  const val = row.budget_max != null ? ` (${rs(row.budget_max)})` : ''; // TDW_06 M-4 (R2-B)
  const state = row.state ?? 'new';
  const closed = state === 'booked' || state === 'lost';
  return {
    id: `lead:${row.id}`,
    kind: 'lead',
    text: `${row.name ?? 'unknown'} — lead, ${state}${val}`,
    status: closed ? 'confirmed' : 'open',
    horizon: null,
    ref_type: 'leads',
    ref_id: row.id,
    // TDW_04 engine-lane (ST-3b, absorbed 02-HOTFIX-2): twin-annotation match keys
    // (annotation-only — never drive a write; the R1(b)/R2 boundary holds).
    name: row.name ?? null,
    phone_key: phoneKey(row.phone),
    arrived_at: row.created_at ?? null, // TDW_06 M-1 (P1) — see recordItem's note
  };
}

export const DONNA_LEAD_TOOL: Anthropic.Tool = {
  name: 'donna_lead',
  description:
    'Log a lead/enquiry the moment the owner mentions a potential customer — even with just a name or a figure. If a lead matching that phone or name already exists, this updates it rather than duplicating; a name match alone never merges a phone onto the existing lead. Call it immediately; never wait for full details. Leads are enquiries not yet engaged; an engaged client with work underway is a binder (donna_client), not a lead. The id this returns is NOT a binder_id — never point binder hands (follow-ups, money, notes, dates) at it; anything beyond the lead\'s own fields belongs on a binder opened separately. When enriching a lead already on file, pass the name AS FILED — a partner\'s name travels as an explicit name-edit or a note, never as a new spelling of the lead (CE-19).',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: "The lead's name." },
      contact: { type: 'string', description: 'Phone or email, if mentioned.' },
      wedding_date: { type: 'string', description: "The wedding date if mentioned — YYYY-MM-DD when exact, or YYYY-MM when only the month is known (a bare month name means the nearest upcoming one)." },
      wedding_city: { type: 'string', description: 'The city or place of the wedding, if mentioned.' },
      source: { type: 'string', description: 'ONLY when the owner explicitly named where they came from (whatsapp, instagram, referral, discover). If he did not name a channel, OMIT this entirely — never infer or guess one; the system marks unattributed captures itself.' },
      referrer: { type: 'string', description: 'Who referred them, if mentioned. A referrer is NOT the lead.' },
      value_estimate: { type: 'number', description: 'Rough deal value in Rs, if mentioned.' },
      stage: { type: 'string', enum: ['new', 'contacted', 'quoted', 'won', 'lost'], description: 'Pipeline stage, if it has moved.' },
    },
    required: [],
  },
};

export const ESCALATE_TOOL: Anthropic.Tool = {
  name: 'escalate',
  description:
    'Call this when the request needs more reasoning than you can give well — a tricky negotiation, multi-step planning, an ambiguous high-stakes call. It re-runs this turn on a more capable model. Use it for genuine difficulty, not routine logging.',
  input_schema: { type: 'object', properties: {}, required: [] },
};

type DonnaLeadInput = {
  name?: string;
  contact?: string;
  wedding_date?: string;
  wedding_city?: string;
  source?: string;
  referrer?: string;
  value_estimate?: number;
  stage?: string;
};

// Word-map (spec P1.2): engine stage words -> public.leads.state. `won` -> `booked`;
// the known set passes through; anything else lands as `new` with the original
// word preserved in notes (never silently discarded).
const PASS_THROUGH = new Set(['new', 'contacted', 'quoted', 'lost']);
function mapStage(word?: string): { state: string | null; strayWord: string | null } {
  if (!word) return { state: null, strayWord: null };
  const w = word.trim().toLowerCase();
  if (w === 'won') return { state: 'booked', strayWord: null };
  if (PASS_THROUGH.has(w)) return { state: w, strayWord: null };
  return { state: 'new', strayWord: word };
}

// CE-13 (Amendment One P1 acceptance, confirmed by F2): parse the tool's date word
// into the 0052 columns. YYYY-MM-DD -> exact (precision day/NULL). YYYY-MM -> the
// 1st-of-month sentinel + precision 'month'. Anything else never pollutes a date
// column — it lands in notes verbatim instead.
function parseWeddingDate(s?: string): { date: string; precision: string | null } | { noteWord: string } | null {
  if (!s || !s.trim()) return null;
  const w = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(w)) return { date: w, precision: null };
  if (/^\d{4}-\d{2}$/.test(w)) return { date: `${w}-01`, precision: 'month' };
  return { noteWord: w };
}

// ── TDW_06 · F-06.92 (CE-ruled 2026-07-28, R-1 fork 1(e)) — PLAIN SPEECH FOR A
// STORED DATE, AND THE PRECISION IS NOT INVENTED. ───────────────────────────────
// This renders a wedding date for the `notWrittenNote` below, which Donna reads
// aloud and Harvey repeats. TWO laws are load-bearing here and both were paid for:
//  (1) PRECISION. `parseWeddingDate` above stores a MONTH-precision date as the
//      1st-of-month SENTINEL (`2027-03` -> `2027-03-01`, precision 'month'). A
//      renderer blind to `wedding_date_precision` prints "1 March 2027" for a row
//      that only ever held "March 2027" — a day the estate never had, minted
//      inside the very cure that exists to kill false certainty. So the precision
//      column decides the shape: 'month' -> "March 2027"; anything else -> the day.
//  (2) NO `Date` OBJECT. F-06.27's UTC slice: `new Date('2027-03-05')` is UTC
//      midnight and formats to the previous day west of Greenwich. The parts are
//      read off the string and never round-trip through a clock.
// Returns null when the value is not a plain ISO date — the caller then says
// nothing rather than guessing, which is the same law one layer up.
const WEDDING_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
function humanWeddingDate(iso?: string | null, precision?: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  if (!m) return null;
  const monthName = WEDDING_MONTHS[Number(m[2]) - 1];
  if (!monthName) return null;
  return precision === 'month' ? `${monthName} ${m[1]}` : `${Number(m[3])} ${monthName} ${m[1]}`;
}

// Append lines to a notes value without losing what stands.
function growNotes(existing: string | null | undefined, additions: string[]): string | null {
  const adds = additions.filter(Boolean);
  if (!adds.length) return existing ?? null;
  return existing && existing.trim() ? `${existing}\n${adds.join('\n')}` : adds.join('\n');
}

// Insert/update that survives a pre-0072 database: if draft_meta doesn't exist
// yet (42703), retry the same write without it, honestly logged. The recorded
// sequencing choice is 0072-first; this is the graceful floor beneath it.
async function writeLead(
  op: 'insert' | 'update',
  payload: Record<string, unknown>,
  id?: string,
): Promise<{ data: LeadRow | null; error: { message: string } | null }> {
  const pub = supabase.schema('public');
  const run = async (body: Record<string, unknown>) => {
    if (op === 'insert') return pub.from('leads').insert(body).select(SEL).single();
    return pub.from('leads').update(body).eq('id', id as string).select(SEL).single();
  };
  let { data, error } = await run(payload);
  if (error && 'draft_meta' in payload && /draft_meta/i.test(error.message)) {
    // eslint-disable-next-line no-console
    console.warn('[donna_lead] draft_meta column absent (apply migration 0072) — wrote without it');
    const { draft_meta: _dm, ...rest } = payload;
    ({ data, error } = await run(rest));
  }
  return { data: data as LeadRow | null, error };
}

export async function executeDonnaLead(
  agentId: string,
  input: DonnaLeadInput,
  rawMessage?: string,
): Promise<ToolOutcome> {
  const vendorId = await vendorIdFromAgent(agentId);
  if (!vendorId) {
    return { display: 'ERROR filing lead: could not resolve the owner account for this agent — nothing was written. Tell the owner the lead needs to be added from the Leads screen for now.' };
  }
  const pub = supabase.schema('public');
  const { state: mappedState, strayWord } = mapStage(input.stage);

  // ── Read before write: exact phone first (strongest key), then case-insensitive
  //    name — same recognize-before-create shape as before, vendor-scoped, live rows only.
  //    FAIL-CLOSED (02-HOTFIX 2026-07-15, CE-mandated hardening, not a proven-defect fix):
  //    a guard read that ERRORS is not the same as a guard read that found nothing. The
  //    old shape discarded the error and fell through to insert — a transient read failure
  //    would silently mint a duplicate. Now: no truthful read, no write, honest ERROR back.
  let existing: LeadRow[] = [];
  // TDW_04 B6 door rider (Q-R-1, F-04.78): the match KEY is now remembered.
  // Phone is the identity+merge key (masterplan); a name is the weak key — the
  // Tara specimen cross-filled a phone through a name-only match after an
  // ANSWERED disambiguation. Shapes (b)+(c) below hang off this one fact.
  let matchedBy: 'phone' | 'name' | null = null;
  if (input.contact) {
    const { data, error: readErr } = await pub.from('leads').select(SEL)
      .eq('vendor_id', vendorId).eq('phone', input.contact)
      .is('deleted_at', null).order('created_at', { ascending: false });
    if (readErr) return { display: `ERROR filing lead: could not check existing leads (${readErr.message}) — nothing was written. A truthful read must land before any write; try again in a moment.` };
    existing = (data as LeadRow[]) || [];
    if (existing.length) matchedBy = 'phone';
  }
  if (!existing.length && input.name) {
    const { data, error: readErr } = await pub.from('leads').select(SEL)
      .eq('vendor_id', vendorId).ilike('name', input.name)
      .is('deleted_at', null).order('created_at', { ascending: false });
    if (readErr) return { display: `ERROR filing lead: could not check existing leads (${readErr.message}) — nothing was written. A truthful read must land before any write; try again in a moment.` };
    existing = (data as LeadRow[]) || [];
    if (existing.length) matchedBy = 'name';
  }

  if (existing.length >= 1) {
    const cur = existing[0];
    const ambiguous = existing.length > 1;
    const patch: Record<string, unknown> = {};
    const noteAdds: string[] = [];

    if (input.name && !cur.name) patch.name = input.name;
    // Q-R-1 SHAPE (b) — F-04.78's cure, half one: a NAME-ONLY match NEVER fills
    // the phone cell. Identity keys don't merge on the weak key: the Tara row
    // took person #2's phone through exactly this line. On a phone match the
    // guard is vacuous (cur.phone equals the key that matched); the fill now
    // exists only where the strong key already vouched for identity.
    if (input.contact && !cur.phone && matchedBy === 'phone') patch.phone = input.contact; // verbatim, no formatting
    const phoneWithheld = matchedBy === 'name' && !!input.contact && !cur.phone; // shape (c) speaks it below
    if (input.wedding_city && !cur.wedding_city) patch.wedding_city = input.wedding_city;
    const parsedDateU = parseWeddingDate(input.wedding_date);
    if (parsedDateU && 'date' in parsedDateU && !cur.wedding_date) {
      patch.wedding_date = parsedDateU.date;
      patch.wedding_date_precision = parsedDateU.precision;
    } else if (parsedDateU && 'noteWord' in parsedDateU) {
      noteAdds.push(`date words from Victor: "${parsedDateU.noteWord}"`);
    }
    if (input.source && !cur.source) patch.source = input.source;
    if (input.referrer && !cur.referrer_name) patch.referrer_name = input.referrer;
    if (rawMessage && !cur.raw_message) patch.raw_message = rawMessage;
    if (input.value_estimate != null) {
      patch.budget_max = input.value_estimate;
      if (!/estimate via Victor/.test(cur.notes || '')) noteAdds.push('estimate via Victor');
    }
    if (mappedState) patch.state = mappedState;
    if (strayWord) noteAdds.push(`stage word from Victor: "${strayWord}"`);
    if (noteAdds.length) patch.notes = growNotes(cur.notes, noteAdds);

    // Q-R-1 SHAPE (c) — half two: the single-match return gains the ambiguous
    // branch's own honesty (:228's shape). Applied on the WEAK-key match only;
    // the phone-match branch stays byte-identical (a phone match is the strong
    // key's own certainty — interpretation disclosed, ratify-or-revert). Both
    // sentences are minted utility copy — the veto-on-sight list, per ruling.
    const nameMatchNote = matchedBy === 'name'
      ? ` Note: matched by NAME to the lead already on file — if this is a different person with the same name, tell me and I'll file them separately.${phoneWithheld ? ` Their phone number was NOT written onto this lead — a name match alone doesn't merge identities; confirm it's the same person and I'll add it.` : ''}`
      : '';

    // ── TDW_06 · F-06.92 (CE-ruled 2026-07-28, R-1 fork 1(e)) — THE PAPER STATES
    // WHAT IT REFUSED. ────────────────────────────────────────────────────────────
    // THE DISEASE, derived at read-first through this door's own bytes: every enrich
    // guard above is `if (input.X && !cur.X)` — a SILENT no-op. On the F-04.78 / SD-REL
    // specimen this door returned `Updated existing lead "Tara Relay Test" (id=…) —
    // raw_message.` and said NOTHING about Jaipur, nothing about 5 March 2027, and
    // nothing about Udaipur / 5 December having been refused. Donna is ordered by
    // donnaSoul's relay paragraph to speak the result's own sentence AND, in the same
    // paragraph, to speak "no workings, no machinery" — and the only substantive thing
    // in that paper was a column key. The two clauses could not both be obeyed, so the
    // mouth completed from the only meaningful facts left in its context: THE DISPATCH'S.
    // F-04.78's relay is not a disobedience; it is a paper that cannot support an
    // honest sentence. This note is that paper's missing half.
    //
    // SCOPE, ruled: OWNER-MEANINGFUL fields only — name, city, wedding date, referrer.
    // `source` and `raw_message` are Victor-set plumbing and are EXCLUDED BY RULING:
    // putting them in the paper re-admits the machinery that caused the disease. The
    // phone is excluded too — Q-R-1 shape (c) above already speaks it, and saying it
    // twice is bloat, not honesty. A field is reported ONLY where the two values
    // actually DIFFER: where the owner re-sent what already stands, nothing was
    // refused and there is nothing to report.
    //
    // COPY: founder-vetoed 2026-07-28, the chair-amended plain-speech form, his bytes.
    // EXECUTOR INTERPRETATION, DISCLOSED (ratify-or-revert): the approved sentence was
    // rendered on a TWO-refusal specimen ("If either should change"); the one-refusal
    // and three-or-more forms below are the executor's grammatical extension of his
    // bytes, nothing else changed.
    const notWritten: string[] = [];
    if (input.name && cur.name && input.name.trim().toLowerCase() !== cur.name.trim().toLowerCase()) {
      notWritten.push(`the name stays ${cur.name} (you said ${input.name.trim()})`);
    }
    if (input.wedding_city && cur.wedding_city && input.wedding_city.trim().toLowerCase() !== cur.wedding_city.trim().toLowerCase()) {
      notWritten.push(`the city stays ${cur.wedding_city} (you said ${input.wedding_city.trim()})`);
    }
    if (parsedDateU && 'date' in parsedDateU && cur.wedding_date && parsedDateU.date !== cur.wedding_date) {
      const stands = humanWeddingDate(cur.wedding_date, cur.wedding_date_precision);
      const given = humanWeddingDate(parsedDateU.date, parsedDateU.precision);
      // Both halves must render, or the clause is dropped whole — a half-spoken
      // comparison is worse than silence.
      if (stands && given) notWritten.push(`the wedding date stays ${stands} (you said ${given})`);
    }
    if (input.referrer && cur.referrer_name && input.referrer.trim().toLowerCase() !== cur.referrer_name.trim().toLowerCase()) {
      notWritten.push(`the referrer stays ${cur.referrer_name} (you said ${input.referrer.trim()})`);
    }
    const notWrittenTail = notWritten.length === 1 ? 'If that should change' : notWritten.length === 2 ? 'If either should change' : 'If any should change';
    const notWrittenNote = notWritten.length
      ? ` Not written — the record already stands: ${notWritten.join(', ')}. ${notWrittenTail}, say so and I'll change it.`
      : '';

    // ── FORK C · THE PLAIN CLAUSE (TDW_06 Donna cure sitting, 2026-07-28; CE R-2/R-8).
    // THE SAME SENTENCE AS `notWrittenNote`, AND NOTHING ELSE. This is the field
    // Victor's composer may be handed at loop.ts:710 beside her voiced line, so that a
    // relay which echoes the dispatch cannot be the only thing he ever sees (SD-REL,
    // 3-for-3 on L3 — the return condition CE-99 ruled met).
    //
    // WHY IT IS NOT `display` — F-06.102, minted this sitting: `display` ships
    // `(id=${cur.id})`, the raw column-key join `${changed}` and the typed-lead binder
    // clause. Those are F-06.52's machinery donor and F-04.66's raw ids; handing them to
    // a mouth is the disease this block exists to kill. The RECEIPT is clean plain
    // speech; the DISPLAY that carries it is not. Only the receipt travels.
    //
    // F-06.85 BOTH DIRECTIONS: donnaSoul's header binds the founder-vetoed WORKED
    // EXAMPLE 1 to this clause family — its receipt line mirrors this shape and its tail
    // is `notWrittenTail`'s TWO-refusal arm. IF THIS CLAUSE FORM, ITS JOIN, OR THAT
    // TERNARY CHANGES, RE-READ EXAMPLE 1 IN donnaSoul.ts BEFORE SHIPPING — and if the
    // example is re-authored, re-read this. Neither may drift alone; b06_f0681 §5.3c
    // asserts the binding mechanically so neither can drift silently either.
    //
    // Leading space stripped: `notWrittenNote` is a TAIL appended to a sentence, this is
    // a sentence in its own right. Empty stays undefined, never '' — fail-closed means a
    // door with nothing plain to say says nothing (R-8), and `plain: ''` would be a door
    // claiming it had spoken.
    const plainClause = notWritten.length ? notWrittenNote.trim() : undefined;

    if (Object.keys(patch).length === 0) {
      return { display: `Lead "${cur.name ?? cur.phone ?? 'unknown'}" already on file (id=${cur.id}) — nothing new to add.${nameMatchNote}${notWrittenNote}`, item: leadItem(cur), plain: plainClause };
    }

    // Recompute draft state from the merged row (spec P3: every update recomputes).
    // P4-c: PRESERVE provenance — an enrich recomputes `missing` but never clobbers
    // a standing source/harvested[] trail (harvest's provenance survives her hand;
    // symmetric with updateLead). 'victor' only when no prior draft stood.
    const merged = { ...cur, ...patch } as Record<string, unknown>;
    const fresh = leadDraftMeta(merged, 'victor');
    if (fresh === null) {
      patch.draft_meta = null; // promotion always wins
    } else {
      const prior = (cur as unknown as { draft_meta?: { source?: string; harvested?: string[] } }).draft_meta;
      patch.draft_meta = {
        missing: fresh.missing,
        source: (prior && prior.source) || 'victor',
        ...(prior && prior.harvested ? { harvested: prior.harvested } : {}),
      };
    }

    const { data, error } = await writeLead('update', patch, cur.id);
    if (error) return { display: `ERROR updating lead: ${error.message}` };
    const row = data ?? ({ ...cur, ...patch } as LeadRow);
    const changed = Object.keys(patch).filter((k) => k !== 'draft_meta').join(', ');
    const flag = ambiguous ? ` Note: ${existing.length} leads matched — updated the most recent; if you meant a different one, tell me which.` : '';
    return { display: `Updated existing lead "${row.name ?? 'unknown'}" (id=${cur.id}) — ${changed}. (Typed lead — this id is not a binder; binder hands like follow-ups, money or notes don't attach to it.)${flag}${nameMatchNote}${notWrittenNote}`, item: leadItem(row), plain: plainClause };
  }

  // ── No match -> create new (the typed-plane draft; thin is welcome).
  const noteAdds: string[] = [];
  if (input.value_estimate != null) noteAdds.push('estimate via Victor');
  if (strayWord) noteAdds.push(`stage word from Victor: "${strayWord}"`);
  const parsedDate = parseWeddingDate(input.wedding_date);
  if (parsedDate && 'noteWord' in parsedDate) noteAdds.push(`date words from Victor: "${parsedDate.noteWord}"`);

  const row: Record<string, unknown> = {
    vendor_id:     vendorId,
    name:          input.name ?? null,
    phone:         input.contact ?? null,           // verbatim string; no formatting
    wedding_date:  parsedDate && 'date' in parsedDate ? parsedDate.date : null,
    wedding_date_precision: parsedDate && 'date' in parsedDate ? parsedDate.precision : null,
    wedding_city:  input.wedding_city ?? null,
    budget_max:    input.value_estimate ?? null,    // budget_min stays null (spec P1.2)
    source:        input.source ?? 'victor',
    referrer_name: input.referrer ?? null,
    state:         mappedState ?? 'new',
    raw_message:   rawMessage ?? null,
    notes:         growNotes(null, noteAdds),
  };
  row.draft_meta = leadDraftMeta(row, 'victor');

  const { data, error } = await writeLead('insert', row);
  if (error) return { display: `ERROR saving lead: ${error.message}` };
  const saved = data as LeadRow;
  return {
    display: `Lead saved. id=${saved.id}, name=${saved.name ?? 'unknown'}, state=${saved.state ?? 'new'}. (Typed lead — this id is not a binder; binder hands like follow-ups, money or notes don't attach to it.)`,
    item: leadItem(saved),
  };
}
