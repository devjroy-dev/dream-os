// src/lib/nudgeOptout.js — TDW_05 P4, F-05.22's cure. THE NUDGE-CLASS OPT-OUT.
//
// THE FINDING THIS CURES: two approved templates have been telling recipients to
// "Reply STOP MORNINGS to pause these updates" (templates.js:51, :65) while NO
// code anywhere read those words. The estate was making a promise it had no
// machinery to keep. This module is the machinery.
//
// ── WHAT THIS IS NOT ────────────────────────────────────────────────────────
//
// This is NOT the full STOP. Those are two different products and conflating
// them is the mistake this file is shaped to prevent:
//
//   FULL STOP    prospects.state='opted_out' · CROSS-LINE by design · terminal ·
//                owned by src/lib/prospects.js · gated in sendWa + whatsapp.js
//                → UNTOUCHED BY THIS FILE. Not read, not written, not imported.
//
//   NUDGE-CLASS  nudge_optout(phone, lane) · LANE-SCOPED by design · reversible ·
//                owned here · suppresses the morning nudge / morning briefing —
//                and, since G2, the couple lane's MARKETING sends.
//                ⚠ THAT SENTENCE USED TO END "AND NOTHING ELSE", and G2's
//                'couple' lane is what made it false. Amended at the site rather
//                than left to rot: R-G2.7 gives this module a third lane whose
//                reader is the review-ask cron, not a morning nudge. The
//                MECHANISM is unchanged — a (phone, lane) reversible pause that
//                only a caller declaring itself can trip — and it is the
//                mechanism, not the current reader list, that this module is.
//                The full stop below is still untouched by all of it.
//
// ── WHY LANE-SCOPED, WHERE THE SIBLING IS NOT (chair amendment, CE-63) ──────
//
// prospects.phone is UNIQUE on the phone alone because a full stop SHOULD reach
// across lines: one human said stop, so stop everywhere. That property belongs to
// the full stop. It does not belong here. The case that forces it: a makeup
// artist planning her own wedding is one number on BOTH lanes. Silencing her
// bride-side morning nudge must not silence her vendor briefings — those are her
// livelihood. So the key is (phone, lane), and a row on one lane says nothing
// about the other.
//
// ── THE MATCHER IS DELIBERATELY NARROW ──────────────────────────────────────
//
// It matches ONLY the qualified phrase. Bare "STOP" returns null and falls
// through to whatever the path does today, byte-untouched — because bare STOP is
// the full stop's word, and a nudge module that quietly swallowed it would
// downgrade a terminal opt-out into a pause. That is a compliance failure wearing
// a feature's uniform. The qualifier is the whole safety property.
'use strict';

const { normalizeTo } = require('./metaCloud');

// ⚠ THE CONSTANT AND THE CONSTRAINT MOVE TOGETHER OR NEITHER MOVES.
// `nudge_optout_lane_check` admits exactly the values listed here, and it is the
// DATABASE that refuses an unknown one — witnessed at docs/db/PUBLIC_SCHEMA.md's
// constraints addendum, `CHECK ((lane = ANY (ARRAY['bride','vendor'])))` before
// G2. Widening this Set alone would have shipped a lane every write rejects:
// F-40.45's exact class, a derivation that reads right in the tree and is
// refused at the write. `db/migrations/0134_reviews_and_seal.sql` §3 widens the
// CHECK in the same delivery, and `_assertLane` below is what keeps a caller
// from reaching the database with a value neither of them knows.
//
// 'couple' — G2, R-G2.7. Her marketing pause: written by the `Stop messages`
// handler on the bride line, read by the review-ask cron before it sends.
const LANES = new Set(['bride', 'vendor', 'couple']);

// ── the qualifier-aware matcher ─────────────────────────────────────────────
// Reads the FIRST TWO tokens, upper-cased, punctuation-stripped — the same
// tokenizing idiom as prospects.js's _firstToken, extended by one token.
//
//   verb  ∈ {STOP, PAUSE}      / {START, RESUME, UNPAUSE}
//   noun  ∈ {MORNING, MORNINGS}
//
// PAUSE/RESUME/UNPAUSE are admitted because a human told "Reply STOP MORNINGS"
// reasonably types the synonym, and a pause you can't unpause is a trap. They are
// admitted ONLY in the two-token form: bare "PAUSE" is not a word this estate
// assigns meaning to, and bare "STOP" belongs to the full stop.
const STOP_VERBS  = new Set(['STOP', 'PAUSE']);
const START_VERBS = new Set(['START', 'RESUME', 'UNPAUSE']);
const NUDGE_NOUNS = new Set(['MORNING', 'MORNINGS']);

function _tokens(text) {
  return String(text || '')
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(t => t.toUpperCase());
}

// → 'stop' | 'start' | null
// null for EVERYTHING else, including bare STOP. The caller falls through.
function matchNudgeWord(text) {
  const t = _tokens(text);
  if (t.length !== 2) return null;          // exactly two tokens; no trailing prose
  const [verb, noun] = t;
  if (!NUDGE_NOUNS.has(noun)) return null;
  if (STOP_VERBS.has(verb))  return 'stop';
  if (START_VERBS.has(verb)) return 'start';
  return null;
}

function _assertLane(lane) {
  // THE MESSAGE READS `LANES`, IT DOES NOT RESTATE IT. It used to spell
  // "expected 'bride' | 'vendor'" as a literal, which is a second home for the
  // vocabulary — and the second home is always the one that goes stale, as it
  // did the moment G2 added a third lane. Derived from the Set so it cannot.
  if (!LANES.has(lane)) {
    throw new RangeError(
      `nudgeOptout: unknown lane '${lane}' (expected ${[...LANES].map((l) => `'${l}'`).join(' | ')})`
    );
  }
}

// ── the read gate ───────────────────────────────────────────────────────────
// POSITIVE: true iff a (phone, lane) row exists AND its state is 'opted_out'.
// Mirrors sendWa.defaultIsOptedOut's shape exactly, which is why the ratified
// resume needs zero gate change — a resumed row reads false here by construction.
//
// NO SUPABASE → false, and that is a NAMED RESIDUAL, not a silent open: the cron
// paths and both inbound paths always supply a handle. A caller that forgets one
// gets the pre-cure behaviour (nudge sends), never a crash inside a cron loop.
async function isNudgeOptedOut({ supabase, phone, lane }) {
  _assertLane(lane);
  if (!supabase) return false;
  const p = normalizeTo(phone);
  const { data } = await supabase
    .from('nudge_optout')
    .select('state')
    .eq('phone', p)
    .eq('lane', lane)
    .eq('state', 'opted_out')
    .limit(1)
    .maybeSingle();
  return !!data;
}

// ── the writer ──────────────────────────────────────────────────────────────
// Upserts on the (phone, lane) natural key — the unique constraint 0086 carries.
// state 'opted_out' on STOP MORNINGS; 'resumed' on START MORNINGS.
//
// The write happens BEFORE the confirmation is sent, deliberately mirroring
// prospects.js:129-131: if the confirmation send fails, the opt-out must still
// have landed. Silence after a failed acknowledgement is recoverable; continuing
// to send morning messages to someone who asked you to stop is not.
async function setNudgeOptout({ supabase, phone, lane, state, source }) {
  _assertLane(lane);
  if (state !== 'opted_out' && state !== 'resumed') {
    throw new RangeError(`nudgeOptout: unknown state '${state}' (expected 'opted_out' | 'resumed')`);
  }
  const p = normalizeTo(phone);
  const { data, error } = await supabase
    .from('nudge_optout')
    .upsert(
      {
        phone: p,
        lane,
        state,
        source: source || 'inbound_stop_mornings',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone,lane' },
    )
    .select('id, phone, lane, state')
    .single();
  if (error) throw error;
  return data;
}

// ── TDW_06 F-06.130: THE GLITCH-REPORT WORD (the promise V-W has been making) ────────────
// THE DISEASE THIS CURES: `STAGE2_WA_REPORT` — 'reply REPORT to flag this turn' — has been
// appended to the WA leg's intercept since the M-2 engine half shipped, and `matchGlitchWord`
// had ZERO instances in the tree. A live vendor-facing promise with no mechanism behind it is
// F-04.27's own class, made by the guard whose whole subject is claims that outrun mechanism.
//
// SITED HERE, and the siting is a CORRECTED one, disclosed rather than quietly fixed. It was
// first written into vendorMode.js beside matchFreshWord on topical symmetry, and reached
// _processVendorInbound through the `deps` object its two siblings use. That broke FIVE sealed
// benches at once with `matchGlitchWord is not a function` — every bench that drives the real
// processVendorInbound builds its OWN deps object, and none of them carry a key that did not
// exist when they were written. That is CE-59's both-sides clause arriving as a red: changing
// one side of a contract obliges the other side's payload. The mechanical evidence overrode
// the topical instinct. THE RIGHT HOME WAS ALWAYS HERE — `matchNudgeWord`, the precedent this
// cure cites, is required DIRECTLY at vendorInbound.js:32 and has never been a dep, and this
// is where `_tokens` already lives, so the tokeniser is REUSED rather than exported or copied.
// The deps contract is byte-identical to origin and no sealed bench sees this movement.
//
// FORK 1 -> 1b, CE-ruled: the nudge tokeniser AT LENGTH ONE — punctuation-stripped and
// case-insensitive. V-W instructs in caps on the house convention (STOP MORNINGS), but BOTH
// shipped matchers are case-insensitive, and a keyboard that autocapitalises also
// autopunctuates: `Report.` and `report` must both land. 1a would drop `Report.`; 1c would
// drop `report` and break the pattern both siblings set.
//
// NARROW BY CONSTRUCTION, matchFreshWord's own reason restated: exactly ONE token, so a
// message that merely CONTAINS the word is a REAL TURN and falls through — "send me the
// report for last week" reaches the engine untouched, benched as its own cell. No collision
// exists: unlike bare STOP, `report` is claimed by no other machinery in this estate.
const GLITCH_WORD = 'REPORT';

// ── G2 · F-19.08's MATCHER — THE `Stop messages` QUICK REPLY ────────────────
// Meta forwards a custom quick-reply tap to our webhook AS AN INBOUND MESSAGE
// whose body is the button's own title, and does nothing else — no suppression,
// no state, no acknowledgement (P0-A ledger, "The Stop button owes code"). So
// the thing to match is the title, exactly.
//
// ⚠ THIS MATCHER EXISTS BECAUSE `matchFullStopWord` WOULD OTHERWISE EAT IT, AND
// THAT IS A LIVE DEFECT, NOT A HYPOTHETICAL. The full-stop matcher reads the
// FIRST TOKEN ONLY, so `Stop messages` is `STOP` to it — and the full stop is
// terminal and CROSS-LINE. A couple who tapped the button on `tdw_referral_invite`
// any time since 2026-08-28 was recorded as a permanent, all-lanes opt-out, which
// also silences her own vendor's enquiry replies. It is the exact disease
// F-05.22's ordering comment one branch up was written to prevent, arriving from
// a button instead of a typed phrase. The branch that uses this matcher therefore
// runs BEFORE the full stop, and the ordering is load-bearing there too.
//
// NARROW BY CONSTRUCTION, the house idiom: exactly TWO tokens, punctuation
// stripped, case-insensitive. A message that merely contains the words is a real
// turn and falls through — "stop messages from my planner please" reaches the
// engine untouched. `STOP` alone is still the full stop's and is not claimed here.
const STOP_MESSAGES_TOKENS = ['STOP', 'MESSAGES'];

function matchStopMessages(text) {
  const t = _tokens(text);
  return t.length === 2 && t[0] === STOP_MESSAGES_TOKENS[0] && t[1] === STOP_MESSAGES_TOKENS[1];
}

function matchGlitchWord(text) {
  const t = _tokens(text);
  return t.length === 1 && t[0] === GLITCH_WORD;
}

module.exports = {
  matchNudgeWord, isNudgeOptedOut, setNudgeOptout, LANES,
  matchGlitchWord, GLITCH_WORD,
  matchStopMessages, STOP_MESSAGES_TOKENS,   // G2 · F-19.08
};
