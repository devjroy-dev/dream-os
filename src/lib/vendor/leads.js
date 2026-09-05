// src/lib/vendor/leads.js
// Shared write logic for vendor leads.
// Called by REST handlers (src/api/vendor/leads.js) and the couple enquiry
// door (src/api/couple/enquire.js). No duplication of write logic.
//
// All functions:
//   - Accept a supabase client + structured params
//   - Return { ok: true, ... } or { ok: false, error: string }
//   - Never throw -- callers check ok flag

'use strict';

const { leadDraftMeta, leadMissing } = require('../draftContracts'); // TDW_02 P3: typed-plane draft recompute

// ── M-DOORBOOT · R-37.35 — ONE RETURN SHAPE, ONE HOME ───────────────────────
// This string is BYTE-UNMOVED from the create path's own select. It is lifted
// to a constant so the dedupe branch can return the SAME SHAPE by construction
// rather than by a second hand-typed list that would drift. `updateLead` keeps
// its own identical literal deliberately — see the cell that asserts the two
// agree, which is what makes the drift visible instead of silent.
const LEAD_RETURN_SELECT =
  'id, name, phone, email, wedding_date, wedding_date_precision, wedding_city, budget_max, state, source, client_id, draft_meta, created_at';
const LEAD_RETURN_KEYS = LEAD_RETURN_SELECT.split(',').map((s) => s.trim());

// The dedupe branch must READ two columns the return shape does not carry —
// `budget_min` and `event_types` — because fill-when-absent cannot decide
// whether to fill a column it never looked at. They are read and NOT returned:
// widening the wire is a separate act needing its own ruling.
const DEDUPE_READ_SELECT = `${LEAD_RETURN_SELECT}, budget_min, event_types`;

// ── THE DISPOSITION TABLE (R-37.37) ─────────────────────────────────────────
// Every column-bearing parameter `createLead` accepts, dispositioned one by
// one. Nothing joins the enrich set silently: §10 of the bench reds if the
// destructure grows a key that appears in neither list.
//
//   ENRICH   — a returning bride's own answer may fill this when the row is
//              absent there. NEVER overwrites a held value, in either direction.
//   REFUSED  — ruled out with its reason, so a later reader amends a ruling
//              rather than discovering a gap:
//     phone         the dedupe key itself; it MATCHED, so it is equal by
//                   construction and there is nothing to fill.
//     source        'discover' is a fixed literal, and R-35.35 deliberately
//                   routed the TDW badge through `engagements` BECAUSE the
//                   dedupe can never set source. Filling it now resurrects a
//                   signal the estate retired on purpose.
//     raw_message   a fixed stock sentence on this door. A stock sentence is
//     notes         not an enrichment; filling a null with boilerplate adds
//                   no information and costs the row its own emptiness.
//     email         not posted by the Discover door at all.
//     referrer_name not posted by the Discover door at all.
//
//   ── G1.2's TWO, DISPOSITIONED RATHER THAN ADDED (R-G12.3/.11) ─────────────
//   Both are REFUSED for the enrich set, and the bench is what forced the
//   question: `b38` §10 went RED the moment the destructure grew two keys that
//   appeared in neither list, and its §10.2 caught the column-bearing bound
//   moving 12 -> 14. The instrument was right and this seat had walked past the
//   register — the disposition is the cure, never a widened bound (e-6, owned).
//
//     wedding_id    the guest download door's own fact, and a returning bride
//                   arriving through Discover has no wedding page behind her.
//                   Worse if enriched: a dedupe hit would attach a lead she
//                   made months ago to whichever page she most recently
//                   downloaded from, silently rewriting its provenance. A lead
//                   came from ONE page or from none, and that is decided at
//                   creation and never revised.
//     wedding_date_precision
//                   NOT an answer of hers — it is a statement about how coarse
//                   `wedding_date` is. Enriching it independently is how a row
//                   ends up claiming DAY precision over a first-of-month date
//                   nobody chose, which is the degenerate-band defect at
//                   R-37.40 wearing a different column. It moves only with the
//                   date it describes, and the download door writes the two
//                   together or neither.
const ENRICH_KEYS = ['name', 'wedding_date', 'wedding_city', 'event_types', 'budget_min', 'budget_max'];
const ENRICH_REFUSED_KEYS = ['phone', 'email', 'source', 'referrer_name', 'raw_message', 'notes',
                             'wedding_id', 'wedding_date_precision'];

// ── R-37.40 · F-16.31 — THE BAND IS ONE ANSWER LIVING IN TWO COLUMNS ────────
// THE DEFECT THIS CURES, and it shipped through this file's own first cut.
// Fill-when-absent reasons per COLUMN. `budget_min` and `budget_max` are not
// two facts; they are one band the bride picked off one row of chips. Reasoned
// per column, a row holding `budget_min 1000000` (the open "Rs 10,00,000+"
// answer) that receives "Rs 5,00,000 - 10,00,000" keeps its floor (held) and
// fills its ceiling (absent) — and comes to rest at 1000000/1000000, a
// DEGENERATE BAND SHE HAS NEVER CHOSEN. Neither the old answer nor the new.
// Founder-witnessed on the standing Sarah row, 26 Aug.
//
// So the pair is dispositioned as a UNIT:
//   ABSENT  iff BOTH bounds are null      -> her band may fill both
//   HELD    if EITHER bound is non-null   -> nothing moves, either bound
// Fill both together or fill neither. There is no state in which one bound
// moves and the other does not.
//
// [WHY THE TOP BAND IS NOT AN EXCEPTION] "Rs 10,00,000+" posts a floor and a
// genuinely ABSENT ceiling (bandCeiling('') is null by design — see
// enquiryFields.js, where Number('') === 0 is the trap that function exists to
// avoid). Filling a both-null row from it writes the floor and leaves the
// ceiling null. That is the band landing WHOLE, not half of it: the open band's
// ceiling is absent in the answer itself, not missing from it.
//
// [WHY A CELL CANNOT PROVE THIS FROM A BOTH-NULL FIXTURE — c-D.4] From
// absence, per-column and unit-band semantics produce the IDENTICAL row. A
// walk starting both-null cannot distinguish them, and this executor read one
// such walk as evidence of a narrowing it could not have shown. The
// discriminating case is ONE-HELD-ONE-NULL, and §11 of the bench asserts it in
// both directions. A fixture that cannot fail is not a fixture.
const ENRICH_PAIRS = [['budget_min', 'budget_max']];
const PAIRED_KEYS = new Set([].concat.apply([], ENRICH_PAIRS));
// `enrich` is an OPTION, not a column. Named here so the guard cell can hold
// the destructure's column-bearing bound without counting it.
const NON_COLUMN_PARAMS = ['enrich'];

// ── THE TWO ABSENCE TESTS ARE DELIBERATELY ASYMMETRIC ───────────────────────
// TARGET side (the row we might fill): absent means `null`/`undefined`, plus an
// empty array (R-37.36's F5.3 — an empty list carries no information). A `''`
// on the row is a HELD value and stays held: "never move what it holds" is the
// ruling's own wording and the conservative direction is the safe one.
// SOURCE side (her word): absent adds `''` — the door must never write
// emptiness into a null and call it an answer.
const isBlankArray = (v) => Array.isArray(v) && v.length === 0;
const targetAbsent = (v) => v === null || v === undefined || isBlankArray(v);
const sourceAbsent = (v) => v === null || v === undefined || v === '' || isBlankArray(v);

// R-37.35's shape guarantee, executed rather than promised: whatever the dedupe
// branch returns is projected onto the create path's own key list.
function projectLeadReturn(row) {
  const out = {};
  for (const k of LEAD_RETURN_KEYS) out[k] = row[k] === undefined ? null : row[k];
  return out;
}

async function createLead(supabase, vendorId, params) {
  const {
    name, phone, email, wedding_date: rawDate, wedding_city,
    event_types, budget_min, budget_max, source,
    referrer_name, raw_message, notes,
    // ── G1.2 · TWO ADDITIVE PARAMS, BOTH DEFAULTING TO NULL (R-G12.3/.11) ──
    // The guest download door needs to say WHICH page earned the lead and
    // that her date is a MONTH, not a day. Both were accepted by neither the
    // destructure nor the INSERT below, so a caller passing them had them
    // SILENTLY DROPPED — derived by reading this function rather than trusting
    // that a named param arrives (protocol §6, and the mistake I nearly made).
    //
    // WIDENED HERE AND NOT FORKED. `leads` already has four INSERT sites and
    // this door does not become a fifth; the estate's sole-writer law is worth
    // more than the tidiness of leaving a shared function untouched. Both are
    // optional and default null, so the vendor POST door and the couple
    // enquiry door are byte-unaffected — proven by cell, not by assertion.
    wedding_id, wedding_date_precision,
    // ── M-DOORBOOT · R-37.34 · THE ENRICH OPTION, AND WHY IT CARRIES VALUES ──
    // This is NOT a boolean, and the reason is R-37.37 in mechanical form:
    // ENRICH ONLY FROM HER WORD, NEVER FROM A FALLBACK.
    //
    // By the time the parameters above reach this function they have already
    // been COALESCED by the caller. `wedding_city` arrives as
    // `city || vendor.city || null` and `name` as
    // `brideNameFinal || 'Dream Wedding enquiry'` — so from in here the
    // vendor's own city and a stock literal are INDISTINGUISHABLE from the
    // bride's typing. A boolean flag would therefore have made R-37.37
    // unenforceable at this layer: the law would live in a comment while the
    // code filled her nulls with the vendor's city in her voice.
    //
    // So the caller hands the UNCOALESCED values, and this function can only
    // ever write what she actually said. The law is structural, not clerical.
    //
    // [F-06.85 CONVENTION] THIS BLOCK IS CONDITIONED ON A MECHANICAL FACT:
    // that `enquire.js` coalesces before calling. Mechanism named so it cannot
    // move in silence — src/api/couple/enquire.js, `handleRealVendor`, the
    // `brideNameFinal` / `wedding_city` bindings at its createLead call. If a
    // future sitting stops coalescing there, or teaches this function to see
    // the raw request, re-read this paragraph: the sentence "from in here they
    // are indistinguishable" would no longer be describing the code beneath it.
    //
    // ABSENT on the vendor-POST caller BY RULING (R-37.34, fork F3 carved
    // out): a vendor re-typing a lead he owns is not a returning bride. He
    // already holds `updateLead` and a Business Leads edit surface, and
    // R-37.32 was ruled about her. He gets the dedupe, never the enrichment.
    enrich,
  } = params;

  let wedding_date = null;
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) wedding_date = parsed.toISOString().split('T')[0];
  }

  if (phone) {
    // ── M-DOORBOOT · R-37.35 — THE THREE-COLUMN READ IS RETIRED ─────────────
    // This select was `'id, name, state'`. Three columns, and `result.lead` is
    // what the vendor POST door hands to `patchLeadSnapshot`, which reads
    // `lead.budget_max` (src/api/vendor/leads.js, patchLeadSnapshot) — so on
    // EVERY dedupe hit that value was `undefined` and Donna's snapshot line
    // silently lost the money. Not a theory: it records inside F-16.30's
    // radius. Reading the full shape cures it as a derived consequence.
    const { data: existing } = await supabase
      .from('leads')
      .select(DEDUPE_READ_SELECT)
      .eq('vendor_id', vendorId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      // ── F-16.30 · R-37.32 — ENRICH-ON-DEDUPE, NULL-ONLY ───────────────────
      // THE DISEASE THIS CURES, in one sentence: the dedupe answered "don't
      // duplicate" with "don't listen." A bride returning to a vendor who
      // already knew her number had her whole sheet — date, city, budget,
      // functions — discarded, and the door reported success. Third field to
      // hit this wall: F-16.21 (the badge), F-16.22 (the second stamp),
      // F-16.25 (the open-ended band, founder-witnessed discarded 26 Aug).
      //
      // The idiom is the estate's own fill-when-absent, not a new invention —
      // R-37.1's mint, provisionRole's backfill, coupleIdentity's guard.
      // FILL WHAT THE LEAD LACKS, NEVER MOVE WHAT IT HOLDS.
      if (!enrich) {
        return { ok: true, lead: projectLeadReturn(existing), deduped: true, enriched: false };
      }

      const patch = {};
      for (const key of ENRICH_KEYS) {
        if (PAIRED_KEYS.has(key)) continue;           // R-37.40: settled as a unit below
        if (!targetAbsent(existing[key])) continue;   // it holds something — leave it
        if (sourceAbsent(enrich[key])) continue;      // she said nothing — nothing to give
        patch[key] = enrich[key];
      }

      // ── R-37.40 · THE PAIRS SETTLE TOGETHER OR NOT AT ALL ─────────────────
      // The two `continue`s below are the whole cure, and the ORDER matters:
      // the held-test comes first and looks at BOTH columns, so a row holding
      // either bound is out of reach entirely. That is what stops one bound
      // moving while the other stays and minting a band she never chose.
      for (const pair of ENRICH_PAIRS) {
        const held = pair.some((k) => !targetAbsent(existing[k]));
        if (held) continue;                                      // the band is answered — leave it whole
        // [NO `offered` GUARD HERE, AND THAT IS DELIBERATE] The first cut had
        // one — `if (!pair.some(k => !sourceAbsent(enrich[k]))) continue;`. The
        // mutation harness proved it INERT: mutating it to always-true bit no
        // cell, because when she answered no band both bounds are already
        // sourceAbsent and the loop below skips each on its own. It was dead
        // code wearing a guard's uniform, which is worse than no guard — a
        // later reader would have trusted it. Removed rather than declared.
        for (const k of pair) {
          // Her band lands whole. A bound she left open (the top band's absent
          // ceiling) is skipped rather than written, because writing null into
          // null is not a fill and would put an empty key in `enriched_fields`.
          if (!sourceAbsent(enrich[k])) patch[k] = enrich[k];
        }
      }

      if (!Object.keys(patch).length) {
        return { ok: true, lead: projectLeadReturn(existing), deduped: true, enriched: false };
      }

      // ── R-37.34 · THE WRITE IS DELEGATED, NOT MINTED ──────────────────────
      // `updateLead` already owns the draft_meta recompute (leadMissing over
      // the five-field contract, prior source and harvested[] trail preserved).
      // A raw UPDATE here would fill `wedding_date` and leave `draft_meta`
      // asserting it missing — a second writer disagreeing with the first.
      // One home for the recompute; this branch decides WHAT, never HOW.
      const upd = await updateLead(supabase, vendorId, existing.id, patch);
      if (!upd.ok) {
        // The lead EXISTS and the bride's enquiry is filed. An enrichment that
        // could not land is reported, never fatal — refusing her enquiry over
        // a fill would be strictly worse than the disease being cured.
        console.warn(`[leads:createLead] enrich-on-dedupe failed for lead ${existing.id}: ${upd.error}`);
        return { ok: true, lead: projectLeadReturn(existing), deduped: true, enriched: false };
      }
      return {
        ok: true,
        lead: projectLeadReturn(upd.lead),
        deduped: true,
        enriched: true,
        enriched_fields: Object.keys(patch),
      };
    }
  }

  let clientIdToLink = null;
  if (phone) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle();
    if (existingClient) clientIdToLink = existingClient.id;
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      vendor_id:     vendorId,
      name:          name          || null,
      phone:         phone         || null,
      email:         email         || null,
      wedding_date,
      wedding_city:  wedding_city  || null,
      event_types:   event_types   || null,
      budget_min:    budget_min    || null,
      budget_max:    budget_max    || null,
      source:        source        || 'whatsapp',
      // NULL unless the caller said so. A precision beside a NULL date would
      // be a claim about a date that does not exist, so the door sets the two
      // together or not at all.
      wedding_id:             wedding_id             || null,
      wedding_date_precision: wedding_date_precision || null,
      referrer_name: referrer_name || null,
      notes:         notes         || null,
      raw_message:   raw_message   || null,
      state:         'new',
      client_id:     clientIdToLink,
      // TDW_02 P3: write-first draft state, computed at the single write point.
      draft_meta:    leadDraftMeta({ name, phone, wedding_date, wedding_city, budget_max }, 'owner'),
    })
    .select('id, name, phone, email, wedding_date, wedding_date_precision, wedding_city, budget_max, state, source, client_id, draft_meta, created_at')
    .single();

  if (error) return { ok: false, error: `Could not create lead: ${error.message}` };
  return { ok: true, lead, deduped: false };
}

async function updateLead(supabase, vendorId, leadId, patch) {
  const EDITABLE = [
    'name', 'phone', 'email', 'wedding_date', 'wedding_date_precision', 'wedding_city',
    'event_types', 'budget_min', 'budget_max', 'source',
    'referrer_name', 'raw_message', 'notes',
  ]; // wedding_date_precision added TDW_02 P4-b: the 0052 sentinel convention was
     // silently dropped here, storing month-known dates as fake-exact days.

  const update = {};
  for (const key of EDITABLE) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }

  if (update.wedding_date) {
    const parsed = new Date(update.wedding_date);
    if (isNaN(parsed.getTime())) return { ok: false, error: 'Invalid wedding_date. Use YYYY-MM-DD.' };
    update.wedding_date = parsed.toISOString().split('T')[0];
  }
  if (update.wedding_date_precision != null &&
      !['day', 'month', 'year'].includes(update.wedding_date_precision)) {
    delete update.wedding_date_precision; // 0052 CHECK values only; junk never reaches the column
  }

  if (Object.keys(update).length === 0) return { ok: false, error: 'No editable fields provided.' };

  // TDW_02 P3: every update recomputes draft state (spec P3; empty -> NULL = promotion).
  // Read the current expected cells, merge the patch, recompute — preserving the
  // prior source and any harvested[] trail (P4 writes those; recompute never erases them).
  const { data: current } = await supabase
    .from('leads')
    .select('name, phone, wedding_date, wedding_city, budget_max, draft_meta')
    .eq('id', leadId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();
  if (current) {
    const merged  = { ...current, ...update };
    const missing = leadMissing(merged);
    if (!missing.length) {
      update.draft_meta = null; // promotion
    } else {
      const prior = current.draft_meta || {};
      update.draft_meta = {
        missing,
        source: prior.source || 'owner',
        ...(prior.harvested ? { harvested: prior.harvested } : {}),
      };
    }
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .select('id, name, phone, email, wedding_date, wedding_date_precision, wedding_city, budget_max, state, source, client_id, draft_meta, created_at')
    .maybeSingle();

  if (!lead && !error) return { ok: false, error: 'Lead not found.' };
  if (error) return { ok: false, error: error.message };
  return { ok: true, lead };
}

async function loseLead(supabase, vendorId, leadId, reason) {
  const { data: existing } = await supabase
    .from('leads')
    .select('id, name, state')
    .eq('id', leadId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'Lead not found.' };
  if (existing.state === 'lost') return { ok: true, lead: existing, already_lost: true };

  const { data: lead, error } = await supabase
    .from('leads')
    .update({ state: 'lost' })
    .eq('id', leadId)
    .eq('vendor_id', vendorId)
    .select('id, name, state')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  if (reason) {
    const content = `Lead "${existing.name || 'unnamed'}" marked lost. Reason: ${reason}`;
    const { error: noteErr } = await supabase
      .from('notes')
      .insert({ vendor_id: vendorId, content, tags: ['lead', 'state_change'] });
    if (noteErr) console.error('[leads:loseLead] note insert failed (non-fatal):', noteErr.message);
  }

  return { ok: true, lead };
}

async function getLeadDetail(supabase, vendorId, leadId) {
  const [leadRes, invoicesRes, eventsRes] = await Promise.all([
    supabase.from('leads')
      .select('id, name, phone, email, wedding_date, wedding_city, event_types, budget_min, budget_max, state, source, referrer_name, raw_message, notes, client_id, vendor_summary, draft_meta, created_at')
      .eq('id', leadId)
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .maybeSingle(),

    supabase.from('invoices')
      .select('id, invoice_number, client_name, amount_total, amount_paid, state, due_date')
      .eq('lead_id', leadId)
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    supabase.from('events')
      .select('id, title, kind, event_date, event_time, state')
      .eq('linked_lead_id', leadId)
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .order('event_date', { ascending: true }),
  ]);

  if (!leadRes.data) return { ok: false, error: 'Lead not found.' };
  if (leadRes.error) return { ok: false, error: leadRes.error.message };

  const lead = leadRes.data;

  let client = null;
  if (lead.client_id) {
    const { data: c } = await supabase
      .from('clients')
      .select('id, name, phone, email')
      .eq('id', lead.client_id)
      .maybeSingle();
    client = c || null;
  }

  // Fetch couple conversation thread (last 20 non-system messages)
  let conversation = [];
  if (lead.phone) {
    const { data: thread } = await supabase
      .from('conversations')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('counterparty_phone', lead.phone)
      .eq('kind', 'couple_thread')
      .maybeSingle();

    if (thread) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('direction, body, created_at, sent_by')
        .eq('conversation_id', thread.id)
        .neq('sent_by', 'system')
        .not('body', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      // Reverse to chronological order for display
      conversation = (msgs || []).filter(m => m.body && m.body.trim()).reverse();
    }
  }

  return {
    ok:             true,
    lead,
    vendor_summary: lead.vendor_summary || null,
    conversation,
    invoices:       invoicesRes.data || [],
    events:         eventsRes.data   || [],
    client,
  };
}

module.exports = {
  createLead, updateLead, loseLead, getLeadDetail,
  // Exported for the M-DOORBOOT bench's §10 guard cell. The disposition table
  // is CODE, not prose: the cell reds when the destructure grows a key that
  // neither list carries, which is the R-37.4 pattern one door over.
  LEAD_RETURN_SELECT, LEAD_RETURN_KEYS, ENRICH_KEYS, ENRICH_REFUSED_KEYS, NON_COLUMN_PARAMS,
  ENRICH_PAIRS,
};
