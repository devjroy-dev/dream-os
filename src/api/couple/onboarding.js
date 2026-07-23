// src/api/couple/onboarding.js
// POST /api/v2/couple/onboarding
//
// Web onboarding for couples who joined via invite code (not WhatsApp).
// All fields optional — mirrors WA dodge behaviour.
// Sets onboarding_state = 'complete'.
//
// ── F-05.18 (TDW_05, CE-64): THE FIELD CONTRACT, EXTENDED ────────────────────────────
// This handler read exactly four fields while the (auth) web form posted seven, five of
// which had ZERO columns anywhere in `public` — a contract no backend implemented. The
// founder ruled EXTEND (not TRIM), and the CE ruled fork A3: the phantoms resolve to
// three homes, only TWO of which are new.
//
//   PHANTOM SENT         →  RULED HOME                        →  NEW COLUMN?
//   ──────────────────────────────────────────────────────────────────────────
//   wedding_country      →  couples.wedding_city   (EXISTING) →  no
//   name                 →  users.name             (EXISTING) →  no
//   residence_country    →  couples.residence_city (0100)     →  YES
//   wedding_style        →  couples.wedding_style  (0100)     →  YES
//   user_segment         →  NOT STORED (ruled U3)             →  no
//
// wedding_country → wedding_city (A3-a): the form's field renders under "Where will your
// wedding take place?", fed by CitySearchDropdown over ALL_CITIES, placeholder "Select
// city or country". It holds a CITY. `couples.wedding_city` already existed, was already
// read here, and is already written by PATCH /couple/me. Minting a second column beside
// it would be F-05.20's disease — a name that reads as correct — put into a schema.
//
// name → users.name (A3-b): `public.couples` has NO name column, only partner_name.
// me.js's own header says so, and me.js:85-91 is the existing writer. This handler adopts
// that writer's shape rather than inventing a second home.
//
// user_segment NOT STORED (A3-c, ruled U3): the client computed it from the two place
// fields. A client-computed derivable stored raw is the divergence class; a derivative
// stored server-side is a smaller version of the same class. The deciding evidence was a
// census: `user_segment` has ZERO readers estate-wide, on both planes. A column that does
// not exist cannot go stale. WHEN A READER IS BORN, derive-on-read is chartered THEN and
// the port of the form's 73-city `isIndiaCity` set to a server home is priced THEN.
// Both are banked by name in this sitting's handover so neither surprises anyone.
//
// ── NO NOTES FOR THE NEW COLUMNS (executor decision, disclosed) ──────────────────────
// The four original fields each push a `notes` row. The two NEW columns deliberately do
// NOT. Note contents are agent-surfaced strings; the founder's copy veto on this sitting
// closed at ZERO NEW WORDS, and minting "Lives in: Mumbai" would ship unvetoed copy under
// cover of a schema change. The columns write to `couples` and stop there. If notes are
// wanted for them, the strings go through the veto first.
//
// ── W-1 ─────────────────────────────────────────────────────────────────────────────
// Zero soul/prompt/voice work. The four existing note strings are BYTE-UNTOUCHED below.

'use strict';

const express           = require('express');
const router            = express.Router();
const requireCoupleAuth = require('../middleware/requireCoupleAuth');
const asyncHandler      = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.post('/', requireCoupleAuth, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const coupleId = req.coupleUser.couple_id;
  const userId   = req.coupleUser.user_id;

  const {
    wedding_date, partner_name, wedding_city, budget_total,
    residence_city, wedding_style, name,
  } = req.body || {};

  const updates = { onboarding_state: 'complete' };
  const notes   = [];

  if (wedding_date && typeof wedding_date === 'string' && wedding_date.trim()) {
    updates.wedding_date = wedding_date.trim();
    notes.push({ couple_id: coupleId, content: `Wedding date: ${wedding_date.trim()}`, tags: ['onboarding', 'date'] });
  }
  if (partner_name && typeof partner_name === 'string' && partner_name.trim()) {
    updates.partner_name = partner_name.trim().slice(0, 80);
    notes.push({ couple_id: coupleId, content: `Partner: ${partner_name.trim()}`, tags: ['onboarding', 'partner'] });
  }
  if (wedding_city && typeof wedding_city === 'string' && wedding_city.trim()) {
    updates.wedding_city = wedding_city.trim().slice(0, 80);
    notes.push({ couple_id: coupleId, content: `Wedding city: ${wedding_city.trim()}`, tags: ['onboarding', 'city'] });
  }
  if (budget_total) {
    const asInt = Number.isInteger(budget_total) ? budget_total : parseInt(budget_total, 10);
    if (Number.isInteger(asInt) && asInt > 0) {
      updates.budget_total = asInt;
      notes.push({ couple_id: coupleId, content: `Budget: Rs ${asInt.toLocaleString('en-IN')}`, tags: ['onboarding', 'budget'] });
    }
  }

  // F-05.18 / 0100 — the two new columns. Same optional-and-trimmed shape as their
  // neighbours; `residence_city` takes wedding_city's 80 because it holds the same kind
  // of value from the same dropdown. No notes row, per the disclosure above.
  if (residence_city && typeof residence_city === 'string' && residence_city.trim()) {
    updates.residence_city = residence_city.trim().slice(0, 80);
  }
  if (wedding_style && typeof wedding_style === 'string' && wedding_style.trim()) {
    updates.wedding_style = wedding_style.trim().slice(0, 40);
  }

  const { error } = await supabase.from('couples').update(updates).eq('id', coupleId);
  if (error) return errRes(res, 500, 'Could not save details. Please try again.');
  if (notes.length > 0) await supabase.from('notes').insert(notes);

  // F-05.18 / fork B1 — the third write, on the OTHER plane. Shape lifted from
  // me.js:85-91, including its NON-FATAL posture: a failed name write is logged and the
  // request still succeeds, because `couples` is already committed by this point and a
  // 500 here would tell the caller nothing landed when most of it did. Same trade the
  // existing writer makes; making it silently different here would be the drift.
  if (name && typeof name === 'string' && name.trim() && userId) {
    const { error: uErr } = await supabase
      .from('users')
      .update({ name: name.trim().slice(0, 80) })
      .eq('id', userId);
    if (uErr) {
      console.error('[couple:onboarding] users name error:', uErr.message);
    }
  }

  console.log(`[couple:onboarding] complete couple=${coupleId}`);
  return okRes(res, { message: 'Profile complete.' });
}));

module.exports = router;
