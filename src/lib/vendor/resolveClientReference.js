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
function norm(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Token-boundary match: does the candidate name contain a WORD that starts
// with the needle? This is what makes "riya" match "Riya Bose" but NOT
// "Priya" (where "riya" is only a mid-word substring). A multi-word needle
// ("priya mehta") matches if the full needle is a prefix of the full name.
function nameMatches(candidateName, needle) {
  const cn = norm(candidateName);
  const nd = norm(needle);
  if (!cn || !nd) return false;
  // Full-name prefix (handles multi-word needles like "priya m").
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
      .select('id, name, phone, wedding_date, wedding_date_precision, wedding_city, created_at')
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
      const detail = [dateBit ? `wedding ${dateBit}` : null, l.wedding_city || null]
        .filter(Boolean).join(' · ') || 'lead';
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

  // De-duplicate PEOPLE. A person can appear as both a client and a lead and
  // an invoice. We collapse by normalised name + phone so we don't show the
  // same human three times. Preference order: client > lead > invoice (a
  // client is the most "real" record). Keep the richest detail.
  const byKey = new Map();
  const rank  = { client: 3, lead: 2, invoice: 1 };
  for (const cand of candidates) {
    const key = `${norm(cand.name)}|${cand.phone || ''}`;
    const existing = byKey.get(key);
    if (!existing || rank[cand.kind] > rank[existing.kind]) {
      byKey.set(key, cand);
    }
  }

  // If phone is missing on some records, the same name with no phone could be
  // a separate key from the same name WITH a phone. Collapse name-only dupes
  // into the phoned record when one exists.
  const collapsed = collapseNameOnlyDupes([...byKey.values()]);

  // Stable order: most recently touched first.
  collapsed.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return collapsed;
}

// If "Priya|<phone>" and "Priya|" both exist, drop the phone-less one — it's
// the same person seen from a record that lacked the phone.
function collapseNameOnlyDupes(list) {
  const phonedNames = new Set(
    list.filter(c => c.phone).map(c => norm(c.name))
  );
  return list.filter(c => c.phone || !phonedNames.has(norm(c.name)));
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

  const options = matches.map(m => ({
    label: `${m.name}${m.detail ? ` — ${m.detail}` : ''} (existing)`,
    // value carries kind + id so the caller can resolve the exact record.
    value: `${valuePrefix}:${m.kind}:${m.id}`,
  }));

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
  findMatches,   // exported for tests
  nameMatches,   // exported for tests
  norm,
};
