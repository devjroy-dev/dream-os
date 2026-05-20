// src/lib/vendor/couture.js
// Couture availability + appointments business logic.
'use strict';

async function listSlots(supabase, vendorId, state = 'all') {
  let q = supabase.from('couture_availability')
    .select('id, slot_at, duration_minutes, fee_inr, state, booked_by_appointment_id')
    .eq('vendor_id', vendorId)
    .order('slot_at', { ascending: true });
  if (state !== 'all') q = q.eq('state', state);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, slots: data || [], total: (data || []).length };
}

async function addSlot(supabase, vendorId, body) {
  const { slot_at, duration_minutes, fee_inr } = body;
  if (!slot_at)  return { ok: false, error: 'slot_at is required.' };
  if (!fee_inr)  return { ok: false, error: 'fee_inr is required.' };

  const { data, error } = await supabase.from('couture_availability').insert({
    vendor_id: vendorId,
    slot_at,
    duration_minutes: duration_minutes || 60,
    fee_inr:  Number(fee_inr),
    state:    'open',
  }).select().single();

  if (error?.code === '23505') return { ok: false, error: 'A slot already exists at that time.', code: 'DUPLICATE_SLOT' };
  if (error) return { ok: false, error: error.message };
  return { ok: true, slot: data };
}

async function removeSlot(supabase, vendorId, slotId) {
  const { data: slot } = await supabase.from('couture_availability')
    .select('state').eq('id', slotId).eq('vendor_id', vendorId).maybeSingle();
  if (!slot) return { ok: false, error: 'Slot not found.' };
  if (slot.state === 'booked') return { ok: false, error: 'Cannot remove a booked slot.' };

  const { error } = await supabase.from('couture_availability').delete().eq('id', slotId).eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function listAppointments(supabase, vendorId, state = 'all') {
  const now = new Date().toISOString();
  let q = supabase.from('couture_appointments')
    .select('id, couple_id, appointment_at, duration_minutes, fee_inr, state, paid_at, vendor_payout_inr, notes, created_at')
    .eq('vendor_id', vendorId);

  if (state === 'upcoming') q = q.gte('appointment_at', now).in('state', ['booked','confirmed']);
  else if (state === 'past') q = q.lt('appointment_at', now);
  else if (state !== 'all') q = q.eq('state', state);

  q = q.order('appointment_at', { ascending: state === 'upcoming' });
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, appointments: data || [], total: (data || []).length };
}

async function updateAppointment(supabase, vendorId, appointmentId, body) {
  const ALLOWED_STATES = ['confirmed', 'completed', 'cancelled', 'no_show'];
  const update = {};
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.state !== undefined) {
    if (!ALLOWED_STATES.includes(body.state)) return { ok: false, error: `Invalid state. Allowed: ${ALLOWED_STATES.join(', ')}.` };
    update.state = body.state;
  }
  if (Object.keys(update).length === 0) return { ok: false, error: 'No editable fields.' };

  const { data, error } = await supabase.from('couture_appointments')
    .update(update).eq('id', appointmentId).eq('vendor_id', vendorId)
    .select().single();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'Appointment not found.' };
  return { ok: true, appointment: data };
}

module.exports = { listSlots, addSlot, removeSlot, listAppointments, updateAppointment };
