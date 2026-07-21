// src/lib/vendor/resolveClientReference.js
//
// Shared client-reference resolver — the single source of truth for
// "which person does the vendor mean?" across every tool (create_invoice,
// create_event, record_payment, and future flows).
//
// WHY THIS EXISTS
// Before this, each tool hand-rolled its own name disambiguation (or none).
// create_invoice asked "same or different?"; create_event didn't ask at all.
// Result: "Priya gets cards but Riya doesn't" — disambiguation depended on
// whether the agent happened to notice, not on enforced logic. This resolver
// makes the behaviour identical everywhere:
//
//   0 matches  → status 'none'      (brand-new person; proceed as new)
//   1 match    → status 'one'       (STILL ambiguous: existing vs a new person
//                                     with the same first name — offer a card)
//   2+ matches → status 'many'      (clearly ambiguous — offer one card each)
//
// The caller decides what the card values mean (invoice vs event), but the
// SEARCH and the MATCH SHAPE are centralised here so every flow is consistent.
//
// This resolver does NOT mutate. It only reads + reports. The caller builds
// the clarify payload from `buildClarifyOptions` (a convenience) or rolls its
// own using `matches`.

// Normalise a name for comparison: lowercase, collapse whitespace.
// Used by the dedup keys (name+phone) — NOT punctuation-folded on purpose: two
// people are "the same" only on a shared phone, never on a re-punctuated name.
function norm(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// TDW_04.5 F-04.98 CURE 2 — the punctuation-blind fold. Lowercase, then collapse
// every run of NON-alphanumeric characters (punctuation, symbols, AND whitespace)
// to a single space, and trim. `\p{L}\p{N}` + the `u` flag keep it Unicode-safe —
// only punctuation/spacing folds, every letter (Devanagari included) survives. This
// is what lets 'ananya recce' meet the true title 'ananya - recce': the " - " and
// the " " both fold to one space, so the two strings become byte-identical BEFORE
// the token discipline below runs. It NEVER loosens that discipline — a fold only
// re-spaces; it can never turn a mid-word substring into a token prefix, so
// 'riya' still cannot reach 'priya' (R-B6, held by the tests).
function foldPunct(s) {
  return (s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// The coarse DB-side prefilter's tokens. A `%raw%` ilike cannot survive a hyphen
// inside the title ('%Ananya recce%' never matches 'Ananya - recce'); an AND of
// per-token ilikes does ('%ananya%' AND '%recce%' both hit it), and nameMatches
// refines the coarse net exactly as before. Shared so BOTH resolveEvent copies
// (chat.js + calendarSignals.js) widen identically — one home, no third drift.
function nameNeedleTokens(raw) {
  return foldPunct(raw).split(' ').filter(Boolean);
}

// Token-boundary match: does the candidate name contain a WORD that starts
// with the needle? This is what makes "riya" match "Riya Bose" but NOT
// "Priya" (where "riya" is only a mid-word substring). A multi-word needle
// ("priya mehta") matches if the full needle is a prefix of the full name.
// F-04.98 CURE 2: both sides fold punctuation first (foldPunct), so the match is
// blind to hyphens/dots/slashes between tokens while the token-start discipline —
// the whole reason "riya" ≠ "Priya" — is preserved untouched.
function nameMatches(candidateName, needle) {
  const cn = foldPunct(candidateName);
  const nd = foldPunct(needle);
  if (!cn || !nd) return false;
  // Full-name prefix (handles multi-word needles like "priya m", and the folded
  // 'ananya recce' as a prefix of the folded 'ananya recce').
  if (cn.startsWith(nd)) return true;
  // Any name token starts with the needle (handles "riya" → "Riya Bose",
  // and "mehta" → "Priya Mehta").
  return cn.split(' ').some(tok => tok.startsWith(nd));
}

// Search clients, leads, and invoices for a name. Returns a de-duplicated
// list of candidate people, each shaped uniformly:
//   { kind: 'client'|'lead'|'invoice', id, name, phone, detail }
// `detail` is a short human string for the card label (wedding date, invoice #).
async function findMatches(supabase, vendorId, rawName) {
  const needle = norm(rawName);
  if (!needle || !vendorId) return [];

  const like = `%${rawName.trim()}%`;

  // Query the three tables in parallel. Each is best-effort; a failure in one
  // does not sink the others. The ilike is a coarse DB-side prefilter; we
  // refine with token-boundary matching below so "riya" does NOT match
  // "Priya" (substring) — only names whose word starts with the needle.
  const [clientsRes, leadsRes, invoicesRes] = await Promise.allSettled([
    supabase.from('clients')
      .select('id, name, phone, created_at')
      .eq('vendor_id', vendorId)
      .ilike('name', like),
    supabase.from('leads')
      .select('id, name, phone, wedding_date, wedding_date_precision, wedding_city, state, created_at')
      .eq('vendor_id', vendorId)
      .ilike('name', like),
    supabase.from('invoices')
      .select('id, client_name, invoice_number, state, created_at')
      .eq('vendor_id', vendorId)
      .ilike('client_name', like)
      .neq('state', 'cancelled'),
  ]);

  const candidates = [];

  if (clientsRes.status === 'fulfilled' && clientsRes.value.data) {
    for (const c of clientsRes.value.data) {
      if (!nameMatches(c.name, rawName)) continue;
      candidates.push({
        kind:   'client',
        id:     c.id,
        name:   c.name,
        phone:  c.phone || null,
        detail: c.phone ? c.phone : 'client on file',
        created_at: c.created_at,
      });
    }
  }

  if (leadsRes.status === 'fulfilled' && leadsRes.value.data) {
    const { formatDateWithPrecision } = safeDatePrecision();
    for (const l of leadsRes.value.data) {
      if (!nameMatches(l.name, rawName)) continue;
      const dateBit = l.wedding_date
        ? (formatDateWithPrecision
            ? formatDateWithPrecision(l.wedding_date, l.wedding_date_precision)
            : l.wedding_date)
        : null;
      const detail = [
        dateBit ? `wedding ${dateBit}` : null,
        l.wedding_city || null,
        l.state && l.state !== 'new' ? l.state : null,
      ].filter(Boolean).join(' · ') || 'lead';
      candidates.push({
        kind:   'lead',
        id:     l.id,
        name:   l.name,
        phone:  l.phone || null,
        detail,
        created_at: l.created_at,
      });
    }
  }

  if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data) {
    for (const i of invoicesRes.value.data) {
      if (!nameMatches(i.client_name, rawName)) continue;
      candidates.push({
        kind:   'invoice',
        id:     i.id,
        name:   i.client_name,
        phone:  null,
        detail: `${i.invoice_number} · ${i.state}`,
        created_at: i.created_at,
      });
    }
  }

  // De-duplicate PEOPLE — carefully. The ONLY safe signal that two records
  // are the same human is a shared phone. So:
  //   • Records WITH a phone: collapse by name+phone (same person across
  //     client/lead/invoice tables). Preference client > lead > invoice.
  //   • Records WITHOUT a phone: keep EACH distinct record. Two phone-less
  //     "Aryan" leads may be two different people — collapsing them would let
  //     the vendor pick "Aryan" and silently resolve to the wrong record
  //     (a real data-integrity harm). Better to show each as its own card
  //     with distinguishing detail (date/city/state) and let the vendor choose.
  const phoned   = new Map();   // key: name|phone  → collapsed candidate
  const phoneless = [];          // each kept as-is (distinct row)
  const rank = { client: 3, lead: 2, invoice: 1 };

  for (const cand of candidates) {
    if (cand.phone) {
      const key = `${norm(cand.name)}|${cand.phone}`;
      const existing = phoned.get(key);
      if (!existing || rank[cand.kind] > rank[existing.kind]) {
        phoned.set(key, cand);
      }
    } else {
      phoneless.push(cand);
    }
  }

  // A phone-less record whose name+phone twin already exists in `phoned` is
  // the same person seen from a record that lacked the phone — drop it.
  const phonedNames = new Set([...phoned.values()].map(c => norm(c.name)));
  const keptPhoneless = phoneless.filter(c => !phonedNames.has(norm(c.name)));

  const collapsed = [...phoned.values(), ...keptPhoneless];

  // Stable order: most recently touched first.
  collapsed.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return collapsed;
}

// Main entry point. Returns:
//   { status: 'none'|'one'|'many', matches: [...] }
async function resolveClientReference(supabase, vendorId, rawName) {
  const matches = await findMatches(supabase, vendorId, rawName);
  let status;
  if (matches.length === 0)      status = 'none';
  else if (matches.length === 1) status = 'one';
  else                           status = 'many';
  return { status, matches };
}

// Convenience: build clarify options (cards) from matches for a given intent.
// `valuePrefix` is what the caller wants tapped values to start with — e.g.
// 'invoice_for' or 'event_for'. Each existing match becomes a card whose value
// resolves the exact record (kind + id). A trailing "new person" card is
// always appended so the vendor can say "no, this is someone new".
//
// Returns { question, options } ready to drop into a clarify payload.
function buildClarifyOptions(rawName, matches, opts = {}) {
  const valuePrefix = opts.valuePrefix || 'resolve';
  const newValue    = opts.newValue    || `${valuePrefix}:new:${rawName}`;
  const noun        = opts.noun        || 'this';

  // Build base labels.
  const base = matches.map(m => ({
    name:   m.name,
    detail: m.detail,
    label:  `${m.name}${m.detail ? ` — ${m.detail}` : ''} (existing)`,
    value:  `${valuePrefix}:${m.kind}:${m.id}`,
    created_at: m.created_at,
  }));

  // If any labels are identical (e.g. four "Aryan" leads with no detail),
  // append a short distinguishing tag so the vendor can still choose the
  // RIGHT one rather than guessing — never show two identical cards.
  const labelCounts = base.reduce((acc, o) => {
    acc[o.label] = (acc[o.label] || 0) + 1; return acc;
  }, {});
  const options = base.map((o, i) => {
    if (labelCounts[o.label] > 1) {
      const when = o.created_at
        ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : `#${i + 1}`;
      return { label: `${o.name} — added ${when} (existing)`, value: o.value };
    }
    return { label: o.label, value: o.value };
  });

  options.push({
    label: matches.length === 1
      ? `New person — different ${rawName.trim()}`
      : `New person — not listed`,
    value: newValue,
  });

  const question = matches.length === 1
    ? `I have a ${matches[0].name} on file — is ${noun} for them, or someone new?`
    : `I found a few people matching "${rawName.trim()}" — which one?`;

  return { question, options };
}

// Lazy, safe require of datePrecision (avoids a hard dependency / circular risk).
function safeDatePrecision() {
  try {
    return require('../../agent/datePrecision');
  } catch {
    return {};
  }
}

module.exports = {
  resolveClientReference,
  buildClarifyOptions,
  findMatches,        // exported for tests
  nameMatches,        // exported for tests
  nameNeedleTokens,   // F-04.98 CURE 2 — the widened event-title prefilter tokens
  foldPunct,          // exported for tests
  norm,
};
