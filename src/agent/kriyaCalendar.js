// ─────────────────────────────────────────────────────────────────────────────
// src/agent/kriyaCalendar.js
// Kriya's calendar hands — the owner's TIME, the companion to her binder hands
// (engagements). Two dumb primitives, same manner as the bench: the tool name is
// the whole interface; no logic baked in.
//
//   kriya_calendar_add   — put something on the owner's calendar: a shoot, a
//                          meeting, a task — or a BLOCK (kind 'blocked') marking
//                          a day the owner is unavailable. A block is reason-
//                          agnostic; any reason the owner gives rides in title.
//   kriya_calendar_check — read a date (or a range): what's on it, and therefore
//                          whether the owner is free. Any event on a day — a shoot
//                          OR a block — means not free.
//
// The calendar is its OWN table (events), the right shape for time; Kriya reaches
// it through these hands so one mind sees both the binder (the engagement) and the
// calendar (the time + the blocks) and reasons across them.
'use strict';

const KIND_VALUES = ['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'blocked', 'other'];

const KRIYA_CALENDAR_TOOLS = [
  { name: 'kriya_calendar_add',
    description: "Put something on the owner's calendar: a shoot, a call, a meeting, a task — give title, date (YYYY-MM-DD), kind, and time (HH:MM, optional; omit for all-day). Resolve the date against today — a shoot or booking is in the future; a bare month/day means its next occurrence, never a past year. To mark a day the owner is UNAVAILABLE, use kind 'blocked' — a block means not-free, whatever the reason (personal, professional, out of town); the reason, if the owner gives one, goes in title. For a range of blocked days, add one block per day. Check the date first (kriya_calendar_check) if you need to know whether the owner is already committed.",
    input_schema: { type: 'object', properties: {
      title: { type: 'string', description: 'Short title — "Shoot for Priya", "Recce at Leela", or for a block the reason if any ("Out of town").' },
      date: { type: 'string', description: 'YYYY-MM-DD.' },
      kind: { type: 'string', enum: KIND_VALUES, description: "What it is. Use 'blocked' to mark the day unavailable." },
      time: { type: 'string', description: 'HH:MM (24-hour). Optional — omit for all-day.' },
      notes: { type: 'string', description: 'Anything more, plain words. Optional.' },
    }, required: ['title', 'date', 'kind'] } },
  { name: 'kriya_calendar_edit',
    description: "Change an event already on the calendar — its date, time, or title. Give event_id and ONLY the fields you're changing. This UPDATES the existing event in place; it never makes a second one. Use to move a shoot, retime a call, rename an entry. Resolve a bare date against today the same way as adding — the next occurrence, never a past year. Who/what an event is for lives in the binder (the engagement); this hand is the calendar row only.",
    input_schema: { type: 'object', properties: {
      event_id: { type: 'string', description: 'The id of the event to change (shown in brackets when the calendar is read).' },
      date: { type: 'string', description: 'New date, YYYY-MM-DD. Optional.' },
      time: { type: 'string', description: 'New time, HH:MM (24-hour). Optional. Pass empty to clear to all-day.' },
      title: { type: 'string', description: 'New title. Optional.' },
      kind: { type: 'string', enum: KIND_VALUES, description: 'New kind. Optional.' },
    }, required: ['event_id'] } },
  { name: 'kriya_calendar_cancel',
    description: "Take an event off the calendar — give event_id. The event is set to cancelled (recoverable, never destroyed), so the date frees up. Use when the owner calls something off or removes it.",
    input_schema: { type: 'object', properties: {
      event_id: { type: 'string', description: 'The id of the event to cancel (shown in brackets when the calendar is read).' },
    }, required: ['event_id'] } },
  { name: 'kriya_calendar_check',
    description: "Read the owner's calendar for a date, or a range — what's on it, and therefore whether the owner is free. Give 'date' for one day, or 'from'+'to' for a range. Returns every event in the window, blocks included; ANY event on a day means the owner is not free that day. Use before booking, or when the owner asks what's on their calendar / whether they're free.",
    input_schema: { type: 'object', properties: {
      date: { type: 'string', description: 'A single day, YYYY-MM-DD.' },
      from: { type: 'string', description: 'Range start, YYYY-MM-DD.' },
      to: { type: 'string', description: 'Range end, YYYY-MM-DD.' },
    } } },
];

const KRIYA_CALENDAR_NAMES = new Set(KRIYA_CALENDAR_TOOLS.map((t) => t.name));

async function executeKriyaCalendar(supabase, vendorId, name, input) {
  if (name === 'kriya_calendar_add') {
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const date = typeof input.date === 'string' ? input.date.trim() : '';
    const kind = KIND_VALUES.includes(input.kind) ? input.kind : null;
    if (!title || !date) return { display: 'ERROR: kriya_calendar_add needs title and date.', error: true };
    if (!kind) return { display: `ERROR: kriya_calendar_add needs a valid kind (${KIND_VALUES.join(', ')}).`, error: true };
    const row = {
      vendor_id: vendorId, couple_id: null, title, event_date: date,
      kind, state: 'upcoming',
    };
    if (typeof input.time === 'string' && input.time.trim()) row.event_time = input.time.trim();
    if (typeof input.notes === 'string' && input.notes.trim()) row.notes = input.notes.trim();
    const { data, error } = await supabase.from('events').insert(row).select('id').single();
    if (error) return { display: `ERROR adding to calendar: ${error.message}`, error: true };
    const when = row.event_time ? `${date} ${row.event_time}` : date;
    const label = kind === 'blocked' ? `Blocked ${when} — "${title}" (owner unavailable).` : `Calendar: "${title}" on ${when} (${kind}).`;
    return { display: `${label} [${data.id}]`, mutated: true, event_id: data.id };
  }

  if (name === 'kriya_calendar_check') {
    const one = typeof input.date === 'string' ? input.date.trim() : '';
    const from = typeof input.from === 'string' ? input.from.trim() : '';
    const to = typeof input.to === 'string' ? input.to.trim() : '';
    let q = supabase.from('events')
      .select('id, title, event_date, event_time, kind, state')
      .eq('vendor_id', vendorId).neq('state', 'cancelled');
    if (one) q = q.eq('event_date', one);
    else if (from || to) {
      if (from) q = q.gte('event_date', from);
      if (to) q = q.lte('event_date', to);
    } else {
      return { display: 'ERROR: kriya_calendar_check needs date, or from/to.', error: true };
    }
    q = q.order('event_date', { ascending: true });
    const { data, error } = await q;
    if (error) return { display: `ERROR checking calendar: ${error.message}`, error: true };
    const rows = data || [];
    const span = one ? one : `${from || '…'}→${to || '…'}`;
    if (rows.length === 0) return { display: `Calendar ${span}: nothing on it — the owner is free.`, summary: 'checked the calendar — nothing scheduled, the dates are free.' };
    const lines = rows.map((e) => {
      const t = e.event_time ? ` ${e.event_time}` : '';
      const blocked = e.kind === 'blocked' ? ' [BLOCKED — unavailable]' : '';
      return `  ${e.event_date}${t} — ${e.title} (${e.kind})${blocked} [${e.id}]`;
    });
    const anyBlock = rows.some((e) => e.kind === 'blocked');
    const head = `Calendar ${span}: ${rows.length} on it${anyBlock ? ' — includes a BLOCK, owner unavailable those days' : ''}.`;
    const fmtD = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '…';
    const spanLabel = one ? fmtD(one) : `${fmtD(from)}–${fmtD(to)}`;
    const blockedCount = rows.filter((e) => e.kind === 'blocked').length;
    const calSummary = `checked the calendar — ${rows.length} item${rows.length === 1 ? '' : 's'}, ${spanLabel}${blockedCount ? `; ${blockedCount} blocked day${blockedCount === 1 ? '' : 's'}` : ''}.`;
    return { display: `${head}\n${lines.join('\n')}`, summary: calSummary };
  }

  if (name === 'kriya_calendar_edit') {
    const id = typeof input.event_id === 'string' ? input.event_id.trim() : '';
    if (!id) return { display: 'ERROR: kriya_calendar_edit needs event_id.', error: true };
    // Read ground truth first — we never edit a row we haven't seen.
    const { data: cur, error: readErr } = await supabase.from('events')
      .select('id, title, event_date, event_time, kind, state')
      .eq('id', id).eq('vendor_id', vendorId).maybeSingle();
    if (readErr) return { display: `ERROR reading event: ${readErr.message}`, error: true };
    if (!cur) return { display: `ERROR: no event ${id} on this calendar.`, error: true };
    const patch = {};
    if (typeof input.date === 'string' && input.date.trim()) patch.event_date = input.date.trim();
    if (typeof input.title === 'string' && input.title.trim()) patch.title = input.title.trim();
    if (input.kind != null && KIND_VALUES.includes(input.kind)) patch.kind = input.kind;
    if (typeof input.time === 'string') patch.event_time = input.time.trim() || null;
    if (Object.keys(patch).length === 0) return { display: `Nothing to change on event ${id} — no new date, time, title, or kind given.`, error: true, event_id: id };
    const { error: updErr } = await supabase.from('events').update(patch)
      .eq('id', id).eq('vendor_id', vendorId);
    if (updErr) return { display: `ERROR changing event: ${updErr.message}`, error: true };
    const nd = patch.event_date || cur.event_date;
    const ntRaw = ('event_time' in patch) ? patch.event_time : cur.event_time;
    const nt = ntRaw ? ` ${String(ntRaw).slice(0,5)}` : '';
    const ntitle = patch.title || cur.title;
    const nkind = patch.kind || cur.kind;
    const changed = Object.keys(patch).map((k) => k.replace('event_', '')).join(', ');
    return { display: `Changed "${ntitle}" — now ${nd}${nt} (${nkind}). [updated: ${changed}] [${id}]`, mutated: true, event_id: id,
      summary: `moved "${ntitle}" to ${new Date(nd + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${nt}.` };
  }

  if (name === 'kriya_calendar_cancel') {
    const id = typeof input.event_id === 'string' ? input.event_id.trim() : '';
    if (!id) return { display: 'ERROR: kriya_calendar_cancel needs event_id.', error: true };
    const { data: cur, error: readErr } = await supabase.from('events')
      .select('id, title, event_date').eq('id', id).eq('vendor_id', vendorId).maybeSingle();
    if (readErr) return { display: `ERROR reading event: ${readErr.message}`, error: true };
    if (!cur) return { display: `ERROR: no event ${id} on this calendar.`, error: true };
    const { error: updErr } = await supabase.from('events').update({ state: 'cancelled' })
      .eq('id', id).eq('vendor_id', vendorId);
    if (updErr) return { display: `ERROR cancelling event: ${updErr.message}`, error: true };
    return { display: `Cancelled "${cur.title}" (was ${cur.event_date}) — the date is free again. [${id}]`, mutated: true, event_id: id,
      summary: `cancelled "${cur.title}".` };
  }

  return { display: `ERROR: unknown calendar tool ${name}.`, error: true };
}

module.exports = { KRIYA_CALENDAR_TOOLS, KRIYA_CALENDAR_NAMES, executeKriyaCalendar };
