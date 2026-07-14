// src/lib/vendor/events.js
// Shared write logic for vendor events.
// Called by REST handlers (src/api/vendor/events.js) and the vendor
// engine chat door (src/api/vendor-engine/chat.js — Victor).

'use strict';

const ALLOWED_KINDS = [
  'shoot', 'call', 'meeting', 'task', 'reminder', 'recce',
  'fitting', 'trial', 'family', 'ceremony', 'social', 'other',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── createEvent ──────────────────────────────────────────────────────────

async function createEvent(supabase, vendorId, params) {
  const { title, event_date, event_time, kind, linked_lead_id, notes } = params;

  if (!title || !title.trim()) return { ok: false, error: 'title is required.' };
  if (!event_date) return { ok: false, error: 'event_date is required.' };
  if (!kind) return { ok: false, error: 'kind is required.' };
  if (!ALLOWED_KINDS.includes(kind)) {
    return { ok: false, error: 'Invalid kind. Must be one of: ' + ALLOWED_KINDS.join(', ') + '.' };
  }

  // Sanitise linked_lead_id -- model sometimes passes a name instead of UUID
  const safeLeadId = (linked_lead_id && UUID_RE.test(linked_lead_id)) ? linked_lead_id : null;

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      vendor_id:      vendorId,
      title:          title.trim(),
      event_date,
      event_time:     event_time || null,
      kind,
      linked_lead_id: safeLeadId,
      notes:          notes || null,
      state:          'upcoming',
    })
    .select('id, title, kind, event_date, event_time, state, linked_lead_id, notes')
    .single();

  if (error) return { ok: false, error: 'Could not create event: ' + error.message };
  return { ok: true, event };
}

// ── updateEvent ──────────────────────────────────────────────────────────

async function updateEvent(supabase, vendorId, eventId, patch) {
  const EDITABLE = ['title', 'event_date', 'event_time', 'kind', 'notes'];
  const update = {};
  for (const key of EDITABLE) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }

  if (update.kind && !ALLOWED_KINDS.includes(update.kind)) {
    return { ok: false, error: 'Invalid kind. Must be one of: ' + ALLOWED_KINDS.join(', ') + '.' };
  }
  if (Object.keys(update).length === 0) return { ok: false, error: 'No editable fields provided.' };

  const { data: event, error } = await supabase
    .from('events')
    .update(update)
    .eq('id', eventId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .select('id, title, kind, event_date, event_time, state, linked_lead_id, notes')
    .maybeSingle();

  if (!event && !error) return { ok: false, error: 'Event not found.' };
  if (error) return { ok: false, error: error.message };
  return { ok: true, event };
}

// ── deleteEvent ──────────────────────────────────────────────────────────
// Soft delete. Distinct from cancel (state='cancelled') -- delete is for
// events created in error.

async function deleteEvent(supabase, vendorId, eventId) {
  const { data: existing } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'Event not found.' };

  const { error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('vendor_id', vendorId);

  if (error) return { ok: false, error: error.message };
  console.log('[events:delete] soft-deleted ' + eventId + ' ("' + existing.title + '")');
  return { ok: true, deleted: true };
}

module.exports = { createEvent, updateEvent, deleteEvent };
