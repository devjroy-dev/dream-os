// src/lib/vendor/blockHands.js
//
// ══════════════════════════════════════════════════════════════════════════
// THE §1.5 RIDER'S TWO HANDS — donna_block_date / donna_unblock_date.
// The post-processors that turn the signals into calendar rows. (TDW_04 B2)
// ══════════════════════════════════════════════════════════════════════════
//
// A BLOCK IS NOT A BOOKING.
// A booking is a date the vendor SELLS. A block is a date the vendor WITHDRAWS
// FROM SALE. They are opposites, and until this file the machine had one hand for
// both — so F-04.37 happened: Victor filed `a7ca145f` as kind='family' and told
// the vendor "16 August is blocked." Three layers pushed him there and NOT ONE of
// them told him otherwise:
//   recordPrimitives.ts:358 — "Use it when the vendor says book, BLOCK, schedule…"
//   recordPrimitives.ts:365 — nine kinds offered. `blocked` not among them.
//   chat.js:191             — had he invented kind='blocked', the door erased it.
// CE-ruled (option (b), 2026-07-15): the vendor gets a hand for blocking that is
// not the booking hand. The teaching line becomes an INVENTORY FACT, not a prompt.
// Structure kills a class; exhortation doesn't.
//
// ── WHY THIS IS ITS OWN FILE, AND NOT "one post-processor in chat.js" ──────
// §1.5's charter text says "one signal-only tool beside its four siblings · one
// post-processor in chat.js". Building exactly that would have SHIPPED A DEFECT,
// for a reason the charter's author could not have seen without reading donna.ts:
//
//   DONNA_TOOLS IS ONE LIST (donna.ts:278). IT IS NOT SURFACE-AWARE.
//
// The moment donna_block_date joins RECORD_TOOLS, the model can call it on BOTH
// surfaces. chat.js is the WEB door. The WHATSAPP door is its twin,
// src/lib/vendor/calendarSignals.js — which handles the identical tool set
// (verified: donna_book_event 8/8 mentions, donna_edit_event 5/5,
// donna_cancel_event 4/4 — perfect twins). A post-processor in chat.js alone
// means a vendor on WhatsApp says "block the 20th", Victor answers "the day is
// being taken off the calendar" — AND NOTHING HAPPENS. The day stays sellable.
// He was told it was protected and it is not.
//
// That is F-04.21's disease, and it is the exact thing this rider exists to
// prevent — the rider whose blessed copy includes "Couldn't block {date} —
// nothing was written" BECAUSE a block the vendor asked for and did not get is
// the worst false-done the calendar can produce.
//
// And writing the hands TWICE — once per door — is F-04.38, which this same
// sitting closed four deliveries ago. The finding's own words: "The cure is not
// 'remember the other file.' It is: THERE IS NO OTHER FILE."
//
// So: ONE HOME. BOTH DOORS IMPORT IT. That is F-04.38's ruling applied forward
// instead of retroactively, and it is the only shape where the ratified thesis
// and the ratified copy are both true.
//
// ── PLANE ──────────────────────────────────────────────────────────────────
// Injected supabase client, therefore NO PLANE OF ITS OWN — resolvable only by
// caller trace (B1's ratified method). Its only writes go through blockDate /
// unblockDate, which go through eventWrite. It never touches a table directly.
//
// ── SIGNAL-ONLY, AND THEREFORE ABSENT FROM CHAT_MUTATING_TOOLS ─────────────
// §1.4's exclusion list needs NO NEW ENTRY, and that is the finding, not an
// oversight: CHAT_MUTATING_TOOLS is the turn-hook's list of tools whose writes
// the HOOK must log. These two are signal-only — the tool returns a sentence and
// writes nothing; the row is written HERE, and eventWrite logs it with
// entity_type='event' and the DB's own row id (Q-B2-1). Adding them to the hook's
// set would produce TWO ledger rows for one fact. Their four siblings
// (donna_invoice_pdf, donna_book_event, donna_edit_event, donna_cancel_event) are
// deliberately absent for exactly this reason — chat.js's own comment says so.
// The two new hands join them in that absence, by the same rule.

'use strict';

const { blockDate, unblockDate } = require('./availability');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Signals nest inside tool_calls[].donna_calls (loop.ts:48, :368-372) — a
// top-level-only scan collects nothing. Same shape as bookEvents' collector.
function collectDates(result, toolName) {
  const out = [];
  const collect = (call) => {
    if (!call || call.name !== toolName || !call.input) return;
    const date = typeof call.input.date === 'string' ? call.input.date.trim() : '';
    if (!DATE_RE.test(date)) return;
    const reason = typeof call.input.reason === 'string' && call.input.reason.trim()
      ? call.input.reason.trim() : null;
    out.push({ date, reason });
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  return out;
}

// ── donna_block_date ──────────────────────────────────────────────────────
// Routes through blockDate, which routes through eventWrite. So these hands
// inherit, for free, every ruling blockDate already carries and that option (a)
// would have had to reimplement and would have inherited none of:
//   Q-B1-6  title = the reason verbatim, else 'Blocked'
//   Q-B1-7  the soft-delete covenant
//           the reason round-trip (title=display / notes=source, exact)
//           ALREADY_BLOCKED, and behind it 0075's UNIQUE index
//           slot='full_day' — so no NULL-slot block is ever minted here
async function blockDates(supabase, vendorId, result) {
  const wants = collectDates(result, 'donna_block_date');
  const done = [];
  for (const w of wants) {
    try {
      const r = await blockDate(supabase, vendorId, w.date, w.reason);
      done.push({ date: w.date, reason: w.reason, ok: !!r.ok, code: r.code || null });
    } catch (e) {
      console.error('[blockHands:donna_block_date]', e.message);
      done.push({ date: w.date, reason: w.reason, ok: false, code: null });
    }
  }
  return done;
}

async function unblockDates(supabase, vendorId, result) {
  const wants = collectDates(result, 'donna_unblock_date');
  const done = [];
  for (const w of wants) {
    try {
      const r = await unblockDate(supabase, vendorId, { date: w.date });
      // unblockDate says 'Block not found.' for a date with no live block. That is
      // not a failure the vendor caused and not one he should read as an error —
      // it is "nothing to do". The two are told apart HERE because only here do we
      // know the vendor ASKED for it, rather than a door being probed.
      const notBlocked = !r.ok && r.error === 'Block not found.';
      done.push({ date: w.date, ok: !!r.ok, notBlocked });
    } catch (e) {
      console.error('[blockHands:donna_unblock_date]', e.message);
      done.push({ date: w.date, ok: false, notBlocked: false });
    }
  }
  return done;
}

// ── THE DOOR'S LINES ──────────────────────────────────────────────────────
// Copy list CE-BLESSED 2026-07-15. The last line of each trio is the point:
// ALREADY_BLOCKED and a failed write used to be console.error and silence on the
// booking path — the vendor was told "it is being placed on the calendar" and
// then nothing came back. These speak.
//
// The failed line claims exactly what was witnessed and names exactly what was
// not: "nothing was written" is TRUE — blockDate is fail-closed (F15) and
// eventWrite's conflict path writes NOTHING without force. This is the
// never-false-done covenant wearing calendar clothes.
function blockLines(done) {
  return done.map((d) => {
    const why = d.reason ? ` — ${d.reason}` : '';
    if (d.ok)                        return `Blocked: ${d.date}${why}. The day's off your calendar.`;
    if (d.code === 'ALREADY_BLOCKED') return `${d.date} was already blocked. Nothing changed.`;
    return `Couldn't block ${d.date} — nothing was written. Try again or block it from the calendar.`;
  }).join('\n');
}

function unblockLines(done) {
  return done.map((d) => {
    if (d.ok)         return `Unblocked: ${d.date}. The day's back on your calendar.`;
    if (d.notBlocked) return `${d.date} wasn't blocked. Nothing changed.`;
    return `Couldn't unblock ${d.date} — nothing was written. Try again or unblock it from the calendar.`;
  }).join('\n');
}

module.exports = { blockDates, unblockDates, blockLines, unblockLines };
