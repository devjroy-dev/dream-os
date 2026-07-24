// today.ts — the clock. A single source of truth for "what day is it", so Harvey
// and Donna read the SAME date every turn and never drift from each other.
//
// WHY THIS EXISTS: nothing injected the current date, so the agents could not reason
// about time — "next Friday", "due in 3 days", "is this overdue" all failed, and they
// guessed the year. This gives them today, in the owner's timezone (a date in UTC
// would read as yesterday to an IST user late at night).
//
// It is a plain dated line, injected into the dynamic (never-cached) context each turn,
// because the date changes daily and must never be cached stale.

// Format today's date in the given IANA timezone (e.g. "Asia/Kolkata") as a line the
// agents can read: weekday, day month year, plus the ISO date for exactness.
export function todayLine(timezone: string | null): string {
  const tz = timezone && timezone.trim() ? timezone : 'Asia/Kolkata';
  const now = new Date();
  let human: string;
  let iso: string;
  try {
    human = new Intl.DateTimeFormat('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz,
    }).format(now);
    // en-CA gives YYYY-MM-DD; pin it to the same timezone so ISO matches the human date.
    iso = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz,
    }).format(now);
  } catch {
    // Bad/unknown timezone string → fall back to UTC rather than throw.
    human = now.toUTCString();
    iso = now.toISOString().slice(0, 10);
  }
  return `Today is ${human} (${iso}).`;
}

// Just the bare ISO date (YYYY-MM-DD) in the owner's timezone — for CODE that needs
// to compare or compute against today (e.g. donna_whatsdue's overdue/range logic),
// as opposed to the human sentence todayLine() injects into prompts. Comparing a
// date against the full sentence would string-sort wrongly (every date sorts before
// "Today is..."), so anything doing date math must use this, never todayLine().
export function todayISO(timezone: string | null): string {
  const tz = timezone && timezone.trim() ? timezone : 'Asia/Kolkata';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz,
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ── TDW_06 M-1 · P1 + F-06.27 · THE ARRIVAL STAMP — ONE REGISTER, ONE DERIVATION ──
//
// WHY THIS EXISTS, and why it lives HERE and not at each render site.
//
// F-06.27 (M-1): three shipped renders — donnaBench:185, donnaBench:188 and
// donnaFind:308 — dated a row with `String(created_at).slice(0, 10)`. Every
// created_at in the estate is `timestamp with time zone` defaulting `now()`, so
// that slice is a UTC calendar date. At IST (+05:30) EVERY ROW BORN BETWEEN
// 00:00 AND 05:30 LOCAL RENDERS AS THE PREVIOUS DAY — a row filed at 01:30 on the
// 25th reads `2026-07-24`. The disease was already named in this file's own header
// ("a date in UTC would read as yesterday to an IST user late at night"); the cure
// was already here in todayISO. The renders simply never asked for it. So the fix
// is not a new idea, it is this file finally being used by the sites that needed it.
//
// AND IT IS LOAD-BEARING FOR P1, not cosmetic. M-1's whole purpose is to hand the
// agents an arrival time they can answer a recency question from. A stamp that can
// be a day wrong is worse than no stamp: it invites the exact false inference
// F-06.22 punishes. A recency cure built on a broken clock is not a cure.
//
// THE FORM IS THE FOUNDER'S, LOCKED 2026-07-24 (「 ddmmyy locked 」):
//   dd-mm-yy HH:MM IST   e.g.  25-07-26 14:20 IST
// SAID ONCE, THEN SETTLED (the ruling's own instruction): the two-digit year is
// ambiguous in principle — `25-07-26` could be read day-first or year-first. It was
// put to the founder with that ambiguity named and ACCEPTED as his house register.
// It is settled law from here; no site re-litigates it and no site invents a variant.
// ONE REGISTER EVERYWHERE: donnaFind's reads, donna_history's lines, and the
// snapshot's arrival field all call THIS function and render its exact bytes.
//
// The timezone abbreviation is mapped explicitly rather than taken from Intl,
// because Intl's `timeZoneName: 'short'` yields "GMT+5:30" for Asia/Kolkata, not
// "IST" — the founder's register wants the name. Unknown zones fall back to Intl's
// short name rather than guessing, and an unparseable timestamp returns null so a
// caller renders NOTHING instead of a wrong date (the F-06.22 discipline: an absent
// stamp is an honest gap, a wrong stamp is false certainty).
const TZ_ABBREV: Record<string, string> = { 'Asia/Kolkata': 'IST', 'Asia/Calcutta': 'IST' };

export function arrivalStamp(ts: string | null | undefined, timezone?: string | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  const tz = timezone && timezone.trim() ? timezone : 'Asia/Kolkata';
  try {
    const dmy = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: '2-digit', year: '2-digit', timeZone: tz,
    }).format(d).replace(/\//g, '-');
    const hm = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
    }).format(d);
    let abbrev = TZ_ABBREV[tz];
    if (!abbrev) {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short', timeZone: tz })
        .formatToParts(d);
      abbrev = parts.find((p) => p.type === 'timeZoneName')?.value ?? tz;
    }
    return `${dmy} ${hm} ${abbrev}`;
  } catch {
    return null; // bad zone → no stamp, never a wrong one
  }
}
