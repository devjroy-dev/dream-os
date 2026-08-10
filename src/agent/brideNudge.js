// src/agent/brideNudge.js — morning nudge builder for bride service
// Called by src/brideCron.js at 8am IST daily.
// Returns { send: true, message: string } or { send: false, reason: string }
// Does NOT send anything — that is the cron's responsibility.
//
// Content:
//   1. Days to wedding (if wedding_date set)
//   2. Today's events (couple_events scoped to today IST)
//   3. Bookings with balance_due_date within 14 days
//
// 24h window check: same as vendor briefing — only send free-form if bride
// messaged within last 24h. If window closed, cron skips (template pending).
//
// ── DECLARED, NOT SILENTLY WIDENED (protocol §8; TDW_06 relay-seam sitting) ──
// The window block below is the estate's THIRD implementation of this predicate
// and the only couple-side one, and it is LEFT IN PLACE deliberately. A fourth
// now exists at `src/lib/vendor/coupleWaWindow.js` (symbol `coupleWindowOpen`),
// built for the vendor lane's send path.
//
// THE TWO ARE NOT INTERCHANGEABLE AND THE DIFFERENCE IS THE POINT:
//   · this block keys on ONE `couple_self` conversation row (`maybeSingle()`),
//     and `couple_self` sits on the BRIDE PNID.
//   · `coupleWindowOpen` keys on the (business PNID, user MSISDN) PAIR per
//     F-06.147, and its allowlist is `couple_thread` — the VENDOR PNID.
// A bride's inbound here does NOT open the vendor lane's window and vice versa.
// Folding this block onto that module is a real cure with a real regression
// surface — `src/brideCron.js` branches on the `window_closed` reason returned
// below — and it is CHARTERED AS ITS OWN MICRO, founder-sequenced. It is not
// done here, it is named here, and the fold re-baselines
// `scripts/b05_p4_crons_bench.js` at the sitting that ships it.
//
// [F-06.85 class: the paragraph above is conditioned on a MECHANICAL fact — that
//  this file still carries its own inline window block, and that
//  `coupleWaWindow.js`'s `VENDOR_LANE_KINDS` still excludes `couple_self`. If
//  either moves, re-read this header.]

async function buildNudge({ couple, user, supabase }) {
  const coupleId = couple.id;
  const name     = user?.name || 'there';

  // ── IST helpers ────────────────────────────────────────────────────
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow        = new Date(Date.now() + IST_OFFSET_MS);
  const istTodayStr   = istNow.toISOString().split('T')[0];  // YYYY-MM-DD

  // ── 1. Check 24h customer service window ──────────────────────────
  const { data: selfConvo } = await supabase
    .from('conversations')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('kind', 'couple_self')
    .maybeSingle();

  if (!selfConvo) {
    return { send: false, reason: 'no_conversation' };
  }

  const { data: lastInbound } = await supabase
    .from('messages')
    .select('created_at')
    .eq('conversation_id', selfConvo.id)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastInbound) {
    return { send: false, reason: 'no_inbound_ever' };
  }

  const hoursSinceLast = (Date.now() - new Date(lastInbound.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLast > 24) {
    return { send: false, reason: 'window_closed', hours: Math.round(hoursSinceLast) };
  }

  // ── 2. Days to wedding ────────────────────────────────────────────
  let daysToWedding = null;
  if (couple.wedding_date) {
    const weddingMs  = new Date(couple.wedding_date).getTime();
    const todayMs    = new Date(istTodayStr).getTime();
    const diff       = Math.round((weddingMs - todayMs) / (1000 * 60 * 60 * 24));
    if (diff >= 0) daysToWedding = diff;
  }

  // ── 3. Today's events ─────────────────────────────────────────────
  const { data: todayEvents } = await supabase
    .from('events')
    .select('title, event_time, kind')
    .eq('couple_id', coupleId)
    .eq('event_date', istTodayStr)
    .in('state', ['upcoming', 'confirmed'])
    .order('event_time', { ascending: true, nullsFirst: false });

  // ── 4. Dues within 14 days ────────────────────────────────────────
  const in14Days = new Date(istNow.getTime() + 14 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const { data: dueSoon } = await supabase
    .from('couple_bookings')
    .select('vendor_name, amount_total, amount_paid, balance_due_date')
    .eq('couple_id', coupleId)
    .not('balance_due_date', 'is', null)
    .lte('balance_due_date', in14Days)
    .gte('balance_due_date', istTodayStr)
    .in('state', ['booked', 'advance_paid'])
    .order('balance_due_date', { ascending: true });

  // ── 5. Build message ──────────────────────────────────────────────
  const lines = [];

  // Opening — days to wedding
  if (daysToWedding === 0) {
    lines.push(`Good morning ${name} — it's your wedding day! 🌸`);
  } else if (daysToWedding === 1) {
    lines.push(`Good morning ${name} — tomorrow's the day. One more sleep. 🌸`);
  } else if (daysToWedding !== null) {
    lines.push(`Good morning ${name} — ${daysToWedding} days to go. 🌸`);
  } else {
    lines.push(`Good morning ${name}. 🌸`);
  }

  // Today's events
  if (todayEvents && todayEvents.length > 0) {
    lines.push('');
    lines.push('Today:');
    for (const ev of todayEvents) {
      const time = ev.event_time ? ` at ${ev.event_time.slice(0, 5)}` : '';
      lines.push(`• ${ev.title}${time}`);
    }
  }

  // Dues
  if (dueSoon && dueSoon.length > 0) {
    lines.push('');
    lines.push('Payments due soon:');
    for (const b of dueSoon) {
      const balance = b.amount_total != null
        ? `Rs ${((b.amount_total - b.amount_paid) / 100000).toFixed(1)}L`
        : 'amount TBD';
      const daysUntil = Math.round(
        (new Date(b.balance_due_date).getTime() - new Date(istTodayStr).getTime()) / (1000 * 60 * 60 * 24)
      );
      const when = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `${b.balance_due_date}`;
      lines.push(`• ${b.vendor_name} — ${balance} due ${when}`);
    }
  }

  // Nothing to report beyond greeting — still send, it's a habit-forming nudge
  const message = lines.join('\n');

  return { send: true, message };
}

module.exports = { buildNudge };
