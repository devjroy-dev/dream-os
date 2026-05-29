// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/snapshot.js
// Phase 1.5 — shared vendor context, one source of truth for BOTH surfaces.
//
// WHY THIS EXISTS:
//   engine.js (WhatsApp PA) and pwaEngine.js (PWA Business Manager) each had
//   their own copy of the same 6-query snapshot fetch. They drift over time.
//   This module is the single definition both import — guaranteeing the PA and
//   the Business Manager read the SAME numbers.
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

// ── buildVendorSnapshot ──────────────────────────────────────────────────────
// The 6 parallel queries that populate the system-prompt dynamic context.
// Extracted verbatim from the (identical) fetches in engine.js + pwaEngine.js.
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
    const { data, error } = await supabase
      .from('vendor_activity_log')
      .select('surface, action, summary, created_at')
      .eq('vendor_id', vendorId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(maxRows);
    if (error) {
      console.warn('[activity-log] read failed (non-fatal):', error.message);
      return [];
    }
    return data || [];
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
    // Relative minutes for a human feel ("4 min ago").
    const ageMin = Math.max(0, Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000));
    const ageStr = ageMin <= 0 ? 'just now' : `${ageMin} min ago`;
    const where  = r.surface === currentSurface ? 'here' : label(r.surface);
    return `- ${r.summary} (${where}, ${ageStr})`;
  });

  return [
    'RECENT ACTIVITY — last few minutes, BOTH surfaces (WhatsApp + app):',
    'The vendor uses two surfaces that share one memory. These actions already',
    'happened — do NOT repeat them, and if the vendor refers to one ("did that',
    'invoice go out?"), you already know it did. Acknowledge naturally.',
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
