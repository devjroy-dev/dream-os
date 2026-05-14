// src/agent/briefing.js — morning briefing builder
// Called by src/cron.js at 8am IST daily.
// Returns { send: true, message: string } or { send: false, reason: string }
// Does NOT send anything — that is the cron's responsibility.

async function buildBriefing({ vendor, user, supabase }) {
  const vendorId = vendor.id;
  const name = user?.name || 'there';

  // ── 1. Check 24h customer service window ───────────────────────
  // WhatsApp only allows free-form outbound if vendor messaged within last 24h.
  // Fetch vendor_self conversation IDs first, then query messages
  const { data: selfConvos } = await supabase
    .from('conversations')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('kind', 'vendor_self');

  const selfConvoIds = (selfConvos || []).map(c => c.id);

  if (selfConvoIds.length === 0) {
    return { send: false, reason: 'no_inbound_ever' };
  }

  const { data: lastInbound } = await supabase
    .from('messages')
    .select('created_at')
    .eq('direction', 'inbound')
    .in('conversation_id', selfConvoIds)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastInbound) {
    return { send: false, reason: 'no_inbound_ever' };
  }

  const hoursSinceLastInbound = (Date.now() - new Date(lastInbound.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastInbound > 24) {
    return { send: false, reason: 'window_closed', hours: Math.round(hoursSinceLastInbound) };
  }

  // ── 2. Open leads count ─────────────────────────────────────────
  const { count: openLeadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .in('state', ['new', 'contacted', 'quoted']);

  // ── 3. Shoots today and this week ──────────────────────────────
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffsetMs);
  const istToday = istNow.toISOString().split('T')[0];
  const daysUntilSunday = (7 - istNow.getUTCDay()) % 7;
  const istSunday = new Date(istNow.getTime() + daysUntilSunday * 86400000).toISOString().split('T')[0];

  const { data: shootsToday } = await supabase
    .from('events')
    .select('id, title, event_time')
    .eq('vendor_id', vendorId)
    .eq('kind', 'shoot')
    .eq('state', 'upcoming')
    .eq('event_date', istToday);

  const { data: shootsThisWeek } = await supabase
    .from('events')
    .select('id, title, event_date')
    .eq('vendor_id', vendorId)
    .eq('kind', 'shoot')
    .eq('state', 'upcoming')
    .gt('event_date', istToday)
    .lte('event_date', istSunday);

  // ── 4. Overdue follow-ups (no reply in 72h) ────────────────────
  const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data: openThreads } = await supabase
    .from('conversations')
    .select('id, counterparty_phone')
    .eq('vendor_id', vendorId)
    .eq('kind', 'couple_thread')
    .neq('state', 'closed');

  const overdueThreads = [];

  for (const thread of (openThreads || [])) {
    // Get most recent message in this thread
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('direction, created_at, body')
      .eq('conversation_id', thread.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Overdue = last message was inbound AND older than 72h
    if (lastMsg && lastMsg.direction === 'inbound' && lastMsg.created_at < cutoff72h) {
      // Try to get couple name from leads
      const { data: lead } = await supabase
        .from('leads')
        .select('name')
        .eq('vendor_id', vendorId)
        .eq('phone', thread.counterparty_phone)
        .maybeSingle();

      overdueThreads.push({
        phone: thread.counterparty_phone,
        name: lead?.name || null,
        hours: Math.round((Date.now() - new Date(lastMsg.created_at).getTime()) / (1000 * 60 * 60)),
      });
    }
  }

  // ── 5. Upcoming events (non-shoot, next 7 days) ────────────────
  const ist7days = new Date(istNow.getTime() + 7 * 86400000).toISOString().split('T')[0];

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, event_date, kind')
    .eq('vendor_id', vendorId)
    .eq('state', 'upcoming')
    .neq('kind', 'shoot')
    .gte('event_date', istToday)
    .lte('event_date', ist7days)
    .order('event_date', { ascending: true })
    .limit(5);

  // ── 6. Build message ───────────────────────────────────────────
  const parts = [`Morning ${name}.`];

  // Shoots today
  if (shootsToday && shootsToday.length > 0) {
    const shootNames = shootsToday.map(s => s.title).join(', ');
    parts.push(`You have ${shootsToday.length === 1 ? 'a shoot' : `${shootsToday.length} shoots`} today: ${shootNames}.`);
  }

  // Shoots this week (excluding today)
  if (shootsThisWeek && shootsThisWeek.length > 0) {
    const shootNames = shootsThisWeek.map(s => `${s.title} (${s.event_date})`).join(', ');
    parts.push(`This week: ${shootNames}.`);
  }

  // Open leads
  if (openLeadsCount > 0) {
    parts.push(`${openLeadsCount} open lead${openLeadsCount === 1 ? '' : 's'} in pipeline.`);
  }

  // Overdue follow-ups
  for (const t of overdueThreads) {
    const who = t.name || t.phone;
    parts.push(`${who} messaged ${t.hours}h ago — no reply yet.`);
  }

  // Upcoming non-shoot events
  if (upcomingEvents && upcomingEvents.length > 0) {
    const eventNames = upcomingEvents.map(e => `${e.title} (${e.event_date})`).join(', ');
    parts.push(`Upcoming: ${eventNames}.`);
  }

  // Empty state — nothing urgent
  if (parts.length === 1) {
    parts.push('Quiet day ahead. Pipeline is clear.');
  }

  return {
    send: true,
    message: parts.join(' '),
  };
}

module.exports = { buildBriefing };
