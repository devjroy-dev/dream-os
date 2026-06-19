// consultAccess.ts — the durable phone-keyed meter for consult. The agents stay
// ephemeral and memoryless; THIS is the only thing that persists per number, and it
// carries no conversation content — only access accounting + the demand signal.
//
// Drives four things from one record:
//   1. The 3-sessions-per-IST-day free gate (4th attempt → blocked).
//   2. Opener-on-first-of-day + the one-time timer reset (firstEver flag).
//   3. The hot-topics demand map (which domains are consulted — "information is gold").
//   4. Time-valued engagement (duration + turn_count per session — the TikTok signal).
import { supabase } from './db.js';
import { todayISO } from './today.js';

const FREE_PER_DAY = 3;
const IST = 'Asia/Kolkata';

export interface AccessDecision {
  blocked: boolean;       // hit the daily free cap → 4th+ attempt
  restricted: boolean;    // admin kill-switch on this number
  firstEver: boolean;     // never consulted before → opener + the one-time reset
  firstOfDay: boolean;    // first session today → opener fires
  sessionsToday: number;  // count AFTER this session is granted
}

// Normalise a phone to a stable key (digits, +country). Mirrors the page's fullPhone.
export function normalisePhone(raw: string): string {
  const d = (raw || '').replace(/[^0-9]/g, '');
  if ((raw || '').trim().startsWith('+')) return '+' + d;
  if (d.startsWith('0')) return '+91' + d.slice(1);
  if (d.length === 10) return '+91' + d;
  return '+91' + d;
}

// Called at consult-mint: decides whether to grant the session, and logs it if granted.
// Returns the decision so the page can fire the opener / reset / block message.
export async function grantConsultSession(phoneRaw: string, domain: string): Promise<AccessDecision> {
  const phone = normalisePhone(phoneRaw);
  const day = todayISO(IST);

  const { data: rec } = await supabase
    .from('consult_access')
    .select('phone, day, sessions_today, total_sessions, restricted, first_ever_done')
    .eq('phone', phone)
    .maybeSingle();

  // Admin kill-switch — denied regardless of count.
  if (rec?.restricted) {
    return { blocked: true, restricted: true, firstEver: false, firstOfDay: false, sessionsToday: rec.sessions_today ?? 0 };
  }

  const isNewDay = !rec || rec.day !== day;
  const usedToday = isNewDay ? 0 : (rec.sessions_today ?? 0);

  // Gate: 3 free per IST-day. 4th attempt blocked.
  if (usedToday >= FREE_PER_DAY) {
    return { blocked: true, restricted: false, firstEver: false, firstOfDay: false, sessionsToday: usedToday };
  }

  const firstEver = !rec || !rec.first_ever_done;   // never had the one-time reset
  const firstOfDay = usedToday === 0;               // first session this IST-day → opener
  const sessionsToday = usedToday + 1;

  if (!rec) {
    const { error: insErr } = await supabase.from('consult_access').insert({
      phone, day, sessions_today: 1, total_sessions: 1,
      restricted: false, first_ever_done: true, last_domain: domain, last_seen: new Date().toISOString(),
    });
    if (insErr) console.error('[consult_access] INSERT FAILED:', insErr.message, insErr.details ?? '');
  } else {
    const { error: updErr } = await supabase.from('consult_access').update({
      day, sessions_today: sessionsToday,
      total_sessions: (rec.total_sessions ?? 0) + 1,
      first_ever_done: true, last_domain: domain, last_seen: new Date().toISOString(),
    }).eq('phone', phone);
    if (updErr) console.error('[consult_access] UPDATE FAILED:', updErr.message, updErr.details ?? '');
  }

  // Durable session log — the demand + engagement signal. Written now (start); the
  // close call patches ended_at / duration / turns. Survives the agent's deletion.
  const { error: logErr } = await supabase.from('consult_sessions').insert({
    phone, domain, started_at: new Date().toISOString(), first_of_day: firstOfDay, first_ever: firstEver,
  });
  if (logErr) console.error('[consult_sessions] INSERT FAILED:', logErr.message, logErr.details ?? '');

  return { blocked: false, restricted: false, firstEver, firstOfDay, sessionsToday };
}

// Called when a session closes (expiry / cap / leave). Patches the latest open session
// row for this phone with end time + duration + turn count — the time-valued signal.
export async function closeConsultSession(phoneRaw: string, turnCount: number): Promise<void> {
  const phone = normalisePhone(phoneRaw);
  const { data: open } = await supabase
    .from('consult_sessions')
    .select('id, started_at')
    .eq('phone', phone)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!open) return;
  const ended = new Date();
  const started = new Date(open.started_at as string);
  const durationSec = Math.max(0, Math.round((ended.getTime() - started.getTime()) / 1000));
  await supabase.from('consult_sessions')
    .update({ ended_at: ended.toISOString(), duration_sec: durationSec, turn_count: turnCount })
    .eq('id', open.id);
}
