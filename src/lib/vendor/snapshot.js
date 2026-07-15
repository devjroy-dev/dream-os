// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/snapshot.js
// Phase 1.5 — shared vendor context, one source of truth for BOTH surfaces.
//
// WHY THIS EXISTS:
//   engine.js (WhatsApp PA) and the retired PWA engine (deleted, TDW_01 Phase A)
//   each had their own copy of the same 6-query snapshot fetch. This module is
//   the single definition every surface imports — guaranteeing all surfaces
//   read the SAME numbers. Live importer: src/agent/engine.js (WA).
//
//   It also owns the cross-surface activity log (migration 0063): a fail-safe
//   append-only record of every mutating action on either surface, so the PA
//   can say "you raised that invoice on the app a few minutes ago" and the
//   Business Manager can see what was done over WhatsApp.
//
// CONTRACT — do not change return shapes without updating both engines:
//   buildVendorSnapshot(supabase, vendorId, istToday, ist14days)
//     -> { state, recentNotes, openLeadsCount, upcomingEvents,
//          pendingInvoices, pendingEnquiries }
//
//   logActivity(supabase, { vendorId, surface, action, summary, entityType?, entityId? })
//     -> void. NEVER throws. A failed log must never block the real action.
//
//   fetchRecentActivity(supabase, vendorId, opts?)
//     -> array of { surface, action, summary, created_at } (newest first)
//
//   formatActivityBlock(rows, currentSurface)
//     -> string | '' . A RECENT ACTIVITY context block, or '' if nothing recent.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// Read window for cross-surface activity. 15 minutes matches the WhatsApp
// session boundary ("what you just did"), capped at 5 rows so context stays
// tight. Tune here if it feels too short/long in production.
const ACTIVITY_WINDOW_MS = 15 * 60 * 1000;
const ACTIVITY_MAX_ROWS  = 5;

// TDW_04 engine-lane (ST-3d, absorbed 02-HOTFIX-2 per L-9): RECORD MUTATIONS see
// further. The 15-minute window made a binder updated 38 minutes prior invisible to
// the assistant (M8's blind spot, Exhibit C) — so lead/binder mutations get their own
// wider tier: 24 hours, capped at 8 rows, merged beneath the standing 15-minute read.
// Everything else (harvest_patch, provider_downgrade, …) keeps the tight window.
// The two constants are TUNABLES flagged to the CE in the sitting handover; the
// behavior (mutations outlive 15 minutes) is the chartered fix.
const RECORD_MUTATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const RECORD_MUTATION_MAX_ROWS  = 8;
// Door actions that mutate a person's record on either plane. Binder doors log with
// action = tool name (donna_*, binder_create); lead doors log lead_* (leads.js).
const RECORD_MUTATION_ACTIONS = [
  'binder_create', 'donna_client', 'donna_edit', 'donna_money', 'donna_money_edit',
  'donna_stage', 'donna_note', 'donna_note_append', 'donna_date', 'donna_phone',
  'donna_doc', 'donna_hide', 'donna_unarchive',
  'lead_create', 'lead_update', 'lead_state', 'lead_delete',
];

// ── buildVendorSnapshot ──────────────────────────────────────────────────────
// The 6 parallel queries that populate the system-prompt dynamic context.
// Extracted verbatim from the (identical) fetches in engine.js + the retired
// PWA engine (deleted, TDW_01 Phase A).
async function buildVendorSnapshot(supabase, vendorId, istToday, ist14days) {
  const [
    { data: state },
    { data: recentNotes },
    { count: openLeadsCount },
    { data: upcomingEvents },
    { data: pendingInvoices },
    { data: pendingEnquiries },
  ] = await Promise.all([
    supabase.from('vendor_state').select('*').eq('vendor_id', vendorId).maybeSingle(),

    supabase.from('notes').select('content, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .in('state', ['new', 'contacted', 'quoted']),

    supabase.from('events').select('id, title, event_date, event_time, kind')
      .eq('vendor_id', vendorId)
      .eq('state', 'upcoming')
      .gte('event_date', istToday)
      .lte('event_date', ist14days)
      .order('event_date', { ascending: true })
      .limit(10),

    supabase.from('invoices').select('id, client_name, amount_total, amount_paid, due_date, state')
      .eq('vendor_id', vendorId)
      .in('state', ['unpaid', 'advance_paid'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10),

    supabase.from('leads').select('id, name, wedding_date, wedding_date_precision, wedding_city, budget_total, raw_message, created_at')
      .eq('vendor_id', vendorId)
      .eq('state', 'new')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    state,
    recentNotes:      recentNotes      || [],
    openLeadsCount:   openLeadsCount   || 0,
    upcomingEvents:   upcomingEvents   || [],
    pendingInvoices:  pendingInvoices  || [],
    pendingEnquiries: pendingEnquiries || [],
  };
}

// ── logActivity ──────────────────────────────────────────────────────────────
// Append a cross-surface activity row. FAIL-SAFE: any error is logged and
// swallowed — the real tool action has already happened (or is about to), and
// a logging failure must never propagate. Callers do NOT await-with-catch;
// they can fire-and-forget or await, either way this never throws.
async function logActivity(supabase, { vendorId, surface, action, summary, entityType = null, entityId = null }) {
  try {
    if (!vendorId || !surface || !action || !summary) {
      // Soft guard — don't write half-rows. Missing summary means nothing
      // useful to show the other surface anyway.
      return;
    }
    // entity_id is informational only (no FK). Guard against non-UUID junk
    // the caller might pass (e.g. a name) so the insert doesn't 400.
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeEntityId = entityId && uuidRe.test(entityId) ? entityId : null;

    const { error } = await supabase.from('vendor_activity_log').insert({
      vendor_id:   vendorId,
      surface,                       // 'whatsapp' | 'pwa'
      action,                        // tool name
      summary,                       // one-line snapshot
      entity_type: entityType,       // 'invoice' | 'lead' | ... | null
      entity_id:   safeEntityId,
    });
    if (error) console.warn('[activity-log] insert failed (non-fatal):', error.message);
  } catch (err) {
    console.warn('[activity-log] threw (non-fatal):', err.message);
  }
}

// ── fetchRecentActivity ──────────────────────────────────────────────────────
// Recent cross-surface actions for one vendor. Returns newest-first. Never
// throws — on error returns []. Read on every turn; cost is one indexed query.
async function fetchRecentActivity(supabase, vendorId, opts = {}) {
  const windowMs = opts.windowMs || ACTIVITY_WINDOW_MS;
  const maxRows  = opts.maxRows  || ACTIVITY_MAX_ROWS;
  try {
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const mutationCutoff = new Date(Date.now() - RECORD_MUTATION_WINDOW_MS).toISOString();

    // Two tiers, one indexed table: (1) the standing tight window, all actions;
    // (2) TDW_04 engine-lane (ST-3d): record mutations over the wide window.
    const [tight, mutations] = await Promise.all([
      supabase
        .from('vendor_activity_log')
        .select('id, surface, action, summary, created_at')
        .eq('vendor_id', vendorId)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(maxRows),
      supabase
        .from('vendor_activity_log')
        .select('id, surface, action, summary, created_at')
        .eq('vendor_id', vendorId)
        .in('action', RECORD_MUTATION_ACTIONS)
        .gte('created_at', mutationCutoff)
        .order('created_at', { ascending: false })
        .limit(RECORD_MUTATION_MAX_ROWS),
    ]);

    if (tight.error && mutations.error) {
      console.warn('[activity-log] read failed (non-fatal):', tight.error.message);
      return [];
    }

    // Merge, dedupe by row id, newest first. The tight tier keeps priority order;
    // wide-tier mutation rows join beneath anything already present.
    const seen = new Set();
    const merged = [];
    for (const r of [...(tight.data || []), ...(mutations.data || [])]) {
      if (r.id != null && seen.has(r.id)) continue;
      if (r.id != null) seen.add(r.id);
      merged.push(r);
    }
    merged.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    return merged;
  } catch (err) {
    console.warn('[activity-log] read threw (non-fatal):', err.message);
    return [];
  }
}

// ── formatActivityBlock ──────────────────────────────────────────────────────
// Render recent activity into a context block for the system prompt. The
// currentSurface is labelled "you, here" implicitly; the OTHER surface is
// named so the agent can say "on the app" / "on WhatsApp" precisely.
//
// Returns '' when there's nothing recent, so callers can concatenate freely.
function formatActivityBlock(rows, currentSurface) {
  if (!rows || rows.length === 0) return '';

  const label = (s) => {
    if (s === 'pwa')      return 'on the app';
    if (s === 'whatsapp') return 'on WhatsApp';
    return 'recently';
  };

  const lines = rows.map(r => {
    // Relative age for a human feel ("4 min ago"; hours past 90 min — the ST-3d
    // widened tier surfaces record mutations up to a day old, so minute-counts
    // alone would read absurd at "1200 min ago").
    const ageMin = Math.max(0, Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000));
    const ageStr = ageMin <= 0 ? 'just now'
      : ageMin <= 90 ? `${ageMin} min ago`
      : `${Math.round(ageMin / 60)} hr ago`;
    const where  = r.surface === currentSurface ? 'here' : label(r.surface);
    return `- ${r.summary} (${where}, ${ageStr})`;
  });

  return [
    // Header kept honest (TDW_04 engine-lane, ST-3d): the block now carries the tight
    // few-minutes window PLUS today's record mutations from the wider tier.
    'RECENT ACTIVITY — the last few minutes on BOTH surfaces (WhatsApp + app),',
    'plus today\'s lead/binder changes. The vendor uses two surfaces that share one',
    'memory. These actions already happened — do NOT repeat them, and if the vendor',
    'refers to one ("did that invoice go out?"), you already know it did.',
    'Acknowledge naturally.',
    ...lines,
  ].join('\n');
}

module.exports = {
  buildVendorSnapshot,
  logActivity,
  fetchRecentActivity,
  formatActivityBlock,
  ACTIVITY_WINDOW_MS,
  ACTIVITY_MAX_ROWS,
};
