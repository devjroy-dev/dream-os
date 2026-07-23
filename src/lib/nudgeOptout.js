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
//                owned here · suppresses the morning nudge / morning briefing and
//                NOTHING ELSE. Bookings, payments, invoices, agent replies and
//                every other send continue.
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

const LANES = new Set(['bride', 'vendor']);

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
  if (!LANES.has(lane)) throw new RangeError(`nudgeOptout: unknown lane '${lane}' (expected 'bride' | 'vendor')`);
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

module.exports = { matchNudgeWord, isNudgeOptedOut, setNudgeOptout, LANES };
