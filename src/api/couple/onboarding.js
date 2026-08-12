// src/api/couple/onboarding.js
// POST /api/v2/couple/onboarding
//
// Web onboarding for couples who joined via invite code (not WhatsApp).
// The two MANDATORY fields (BRIDE_FIELDS: name, budget) hold the door; the rest
// stay optional — mirrors WA dodge behaviour for everything R-OB.6 marks optional.
// Sets onboarding_state = 'complete' ONLY when the predicate says complete.
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

// ═══ F-OB.10's CURE — ARC OB · CE-32 · THE PREDICATE-WIRE MICRO, item ① ═════
// WHAT THIS ENDPOINT USED TO DO: `const updates = { onboarding_state: 'complete' }`
// — the marker was the FIRST KEY OF THE OBJECT, written before a single field
// was read, and every field below it was optional. A bride could POST `{}` and
// be stamped complete. That is F-OB.2's disease in a worse form than the vendor
// lane ever had it (the vendor endpoint at least validated `city`), and it is
// the mechanism by which 11 of 28 brides are on file with no name.
//
// WHAT IT DOES NOW: it validates through THE ONE PREDICATE HOME
// (src/lib/onboardingPredicate.js · brideComplete) and writes 'complete' ONLY
// when the predicate says complete. It becomes the predicate's FOURTH reader,
// and the bride lane's half of the shape COMMON named — gate, form's API, and
// backfill reading one definition.
//
// R-OB.8 HOLDS HERE AS IT DOES AT THE VENDOR TWIN: onboarding_state is a
// FLOW-POSITION MARKER, never the predicate. Nothing here reads it to decide
// anything; it is written as a CONSEQUENCE of the verdict, never as a
// substitute for asking.
//
// THE REFUSAL IS ATOMIC, on the vendor endpoint's ruled shape (CE-32 fork b):
// an incomplete submission writes NOTHING — not `couples`, not `users`, not one
// note row. The alternative (save what came, refuse the stamp) produces a row
// whose state depends on how many times a form was half-filled. One submission,
// one verdict, one write.
//
// BODY OVER ROW, NEVER BODY ALONE — also the vendor twin's shape. A bride who
// filled half this form last week and returns to finish it must not be told she
// is missing what she already told us, so the live row and users.name are read
// first and the body is layered over them. This handler previously read NOTHING
// before writing, which is why it could not have merged even if it had wanted to.
//
// ⚠ THE OPTIONAL FOUR ARE STILL OPTIONAL. wedding_date, partner_name,
// wedding_city, residence_city and wedding_style do NOT gate — R-OB.6 marks
// them optional, and an optional field that blocks the door is a mandatory
// field wearing a different word. Only BRIDE_FIELDS = ['name','budget'] hold it.
// The header's old sentence 「 All fields optional 」 was true of the mandatory
// two as well, and that is the half this cure kills.
const { brideComplete, INCOMPLETE_REFUSAL } = require('../../lib/onboardingPredicate');

// A trimmed string, or undefined — never an empty string. Lifted from the
// vendor twin (`trimmedOr`) rather than re-derived, because "" is not an answer
// to either of the two on this lane either.
function trimmedOr(raw, fallback) {
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return fallback;
}

// Budget coercion. The predicate demands a number STRICTLY GREATER THAN ZERO —
// 0 is what an empty numeric input coerces to. This is the SAME parseInt-then-
// positive-integer rule the estate's two existing budget writers already use
// (src/agent/brideEngine.js's execSaveWeddingDetail, and couple/me.js's PATCH
// guard, which cites it) — a third disagreeing rule would be the clash the
// founder's conditional ruling on that PATCH exists to prevent.
//
// Anything unparseable resolves to UNDEFINED, deliberately NOT to a refusal of
// its own: an unreadable budget is a budget the estate does not have, so it
// falls through to the predicate and comes back as `missing: ['budget']` rather
// than as a second error sentence saying the same thing in other words.
function coerceBudget(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const asInt = Number.isInteger(raw) ? raw : parseInt(raw, 10);
  return Number.isInteger(asInt) && asInt > 0 ? asInt : undefined;
}

router.post('/', requireCoupleAuth, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const coupleId = req.coupleUser.couple_id;
  const userId   = req.coupleUser.user_id;

  const {
    wedding_date, partner_name, wedding_city, budget_total,
    residence_city, wedding_style, name,
  } = req.body || {};

  // ── 1 · THE MERGED SHAPE — the live row under the body ───────────────────
  // Read before write. `users.name` and `couples.budget_total` are the only two
  // the predicate reads, but the row is fetched for both so a returning bride
  // is judged on everything on file, not on what this submission happened to
  // carry.
  const { data: couple } = await supabase
    .from('couples').select('budget_total').eq('id', coupleId).maybeSingle();
  const { data: user } = userId
    ? await supabase.from('users').select('name').eq('id', userId).maybeSingle()
    : { data: null };

  const candidateName   = trimmedOr(name, user?.name);
  const candidateBudget = coerceBudget(budget_total) !== undefined
    ? coerceBudget(budget_total)
    : couple?.budget_total;

  // ── 2 · THE PREDICATE IS THE ONLY JUDGE OF 'complete' ────────────────────
  const verdict = brideComplete({ name: candidateName }, { budget_total: candidateBudget });
  if (!verdict.complete) {
    // Raw json() rather than errRes for the vendor twin's reason: the contract
    // carries a THIRD field, `missing[]`, the machine-readable field keys OB-P
    // renders its form from. errRes's shape is { ok, error, code } and is not
    // widened for one caller. The keys are BRIDE_FIELDS' vocabulary — an
    // interface, not labels; the founder-vetoed display words live in the PWA.
    //
    // NO `allowed[]` ON THIS LANE. The vendor 400 carries it because the vendor
    // form has a picker over a server-owned taxonomy; the bride's two fields are
    // a name and a number, and shipping an empty or irrelevant key for symmetry
    // would be a field with no reader at birth (wire-or-delete-at-birth).
    return res.status(400).json({
      ok:      false,
      error:   INCOMPLETE_REFUSAL,
      code:    'INCOMPLETE',
      missing: verdict.missing,
    });
  }

  // ── 3 · COMPLETE: the writes, and only now ───────────────────────────────
  // users.name goes FIRST and its failure is FATAL, which INVERTS the posture
  // this handler used to hold — and the inversion is the point. The old comment
  // reasoned that a failed name write must not 500 "because `couples` is already
  // committed by this point"; under the atomic rule nothing is committed at this
  // point, so the honest answer to a failed write is to say so. Same order and
  // same posture as the vendor twin.
  if (candidateName && candidateName !== user?.name && userId) {
    const { error: uErr } = await supabase
      .from('users').update({ name: candidateName.slice(0, 80) }).eq('id', userId);
    if (uErr) {
      console.error('[couple:onboarding] users name error:', uErr.message);
      return errRes(res, 500, 'Could not save details. Please try again.');
    }
  }

  const updates = { onboarding_state: 'complete' };
  const notes   = [];

  // The predicate's own two are written from the CANDIDATE, so a returning
  // bride's stored budget survives a submission that did not resend it.
  if (candidateBudget) {
    updates.budget_total = candidateBudget;
    if (candidateBudget !== couple?.budget_total) {
      notes.push({ couple_id: coupleId, content: `Budget: Rs ${candidateBudget.toLocaleString('en-IN')}`, tags: ['onboarding', 'budget'] });
    }
  }

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
  // budget_total's OLD block stood here and is SUPERSEDED, not deleted twice:
  // the candidate write above is the same parseInt-then-positive-integer rule,
  // reading the MERGED value so a returning bride is not re-asked. Its note row
  // moved with it, and now fires only on an actual change rather than on every
  // resubmission — the note is a record of what she told us, not of how many
  // times a form was submitted.

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

  // F-05.18 / fork B1's name write STOOD HERE, last and non-fatal. It MOVED to
  // step 3 above — first and fatal. The old posture's own reasoning is what
  // retired it: it tolerated a silent failure because `couples` was already
  // committed by that line. Under the atomic rule nothing is committed until
  // the verdict passes, so the trade it was making no longer exists, and a
  // bride whose NAME — one of the two mandatory fields — failed to save must
  // not be told 'Profile complete.' That is the marker lying again, one layer
  // down. RETIRE-WITH-THE-READER: the ordering ruling owns the comment that
  // justified the old order.

  console.log(`[couple:onboarding] complete couple=${coupleId}`);
  return okRes(res, { message: 'Profile complete.' });
}));

module.exports = router;
