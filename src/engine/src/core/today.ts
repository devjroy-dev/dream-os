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
