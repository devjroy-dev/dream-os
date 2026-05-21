// src/lib/vendor/leads.js
// Shared write logic for vendor leads.
// Called by both REST handlers (src/api/vendor/leads.js) and agent tool
// executors (src/agent/pwaEngine.js). No duplication of write logic.
//
// All functions:
//   - Accept a supabase client + structured params
//   - Return { ok: true, ... } or { ok: false, error: string }
//   - Never throw -- callers check ok flag

'use strict';

async function createLead(supabase, vendorId, params) {
  const {
    name, phone, email, wedding_date: rawDate, wedding_city,
    event_types, budget_min, budget_max, source,
    referrer_name, raw_message, notes,
  } = params;

  let wedding_date = null;
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) wedding_date = parsed.toISOString().split('T')[0];
  }

  if (phone) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id, name, state')
      .eq('vendor_id', vendorId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle();
    if (existing) return { ok: true, lead: existing, deduped: true };
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
      referrer_name: referrer_name || null,
      notes:         notes         || null,
      raw_message:   raw_message   || null,
      state:         'new',
      client_id:     clientIdToLink,
    })
    .select('id, name, phone, email, wedding_date, wedding_city, state, source, client_id, created_at')
    .single();

  if (error) return { ok: false, error: `Could not create lead: ${error.message}` };
  return { ok: true, lead, deduped: false };
}

async function updateLead(supabase, vendorId, leadId, patch) {
  const EDITABLE = [
    'name', 'phone', 'email', 'wedding_date', 'wedding_city',
    'event_types', 'budget_min', 'budget_max', 'source',
    'referrer_name', 'raw_message', 'notes',
  ];

  const update = {};
  for (const key of EDITABLE) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }

  if (update.wedding_date) {
    const parsed = new Date(update.wedding_date);
    if (isNaN(parsed.getTime())) return { ok: false, error: 'Invalid wedding_date. Use YYYY-MM-DD.' };
    update.wedding_date = parsed.toISOString().split('T')[0];
  }

  if (Object.keys(update).length === 0) return { ok: false, error: 'No editable fields provided.' };

  const { data: lead, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .select('id, name, phone, email, wedding_date, wedding_city, state, source, client_id, created_at')
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
      .select('id, name, phone, email, wedding_date, wedding_city, event_types, budget_min, budget_max, state, source, referrer_name, raw_message, notes, client_id, vendor_summary, created_at')
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

module.exports = { createLead, updateLead, loseLead, getLeadDetail };
