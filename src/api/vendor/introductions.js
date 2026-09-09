'use strict';
// src/api/vendor/introductions.js — R9-J1 · THE THREE DOORS. CE-42 seat E2, 4a
// packet 3a. Cut at dream-os f3e9ff0e5067667a3e1d6a3fe245f74d384f847d.
//
// ═══ WHY THIS FILE EXISTS — F-42.82 ══════════════════════════════════════════
// 4a shipped the arm. The door rider gave it a WhatsApp seat. R-42.8 then moved
// the ask to a screen, and `git grep -rn "introductions" -- src/api/` returned
// NOTHING: the library had no HTTP surface at all, so the screen the chair ruled
// had no address to call. e-5's shape one layer up, and this is that layer.
//
// ═══ THE ARM IS THE AUTHORITY. THESE DOORS DECIDE NOTHING ════════════════════
// Every refusal below is the ARM'S, forwarded with a status code:
//   a missing slot        → `nextSlot`'s founder-vetoed ask byte      → 400
//   a second introduction → INTRO_ALREADY_SENT, from the arm          → 409
//   the plane dark        → `cap.reason()`'s own sentence             → 503
//   a wrong name on send  → E3, ON THE SERVER                         → 409
// The screen re-implements none of them. It may check that a field is EMPTY,
// because a form that posts blanks is a form with no manners — but "is this
// number already introduced" and "is the plane on" are answers only the estate
// holds, and a client that guesses either is a second home for a law. A cell in
// the pwa packet reds if it appears there.
//
// ═══ A LIST IS NOT A PHONEBOOK (chair-ruled) ═════════════════════════════════
// GET returns the recipient's LAST FOUR digits and never the number. The vendor
// typed it and knows it; the wire does not need to carry a stranger's full
// handset to draw a list, and a screenshot of this room should not be able to
// leak one. `recipient_phone_last4` is a DERIVED field and no column is renamed.
//
// ═══ PLANE (SQL-provenance law) ══════════════════════════════════════════════
//   public.introductions — db/migrations/0161_introductions.sql, the witness for
//   every column here: id, vendor_id, recipient_phone, recipient_name, where_met,
//   page_code, status, wamid, sent_at, created_at. NOT in PUBLIC_SCHEMA.md, whose
//   snapshot is ladder tip 0154; the migration is the witness until the regen.
//   Reads and writes go through src/lib/vendor/introductions.js, which is the one
//   home — this file opens the table for the LIST read alone and mutates nothing.

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
// `err(res, status, message, code)` — the fourth argument is a STRING code and
// lands as `body.code` (src/lib/response.js:5-9). Derived, not assumed: the first
// cut of this file passed objects, which would have shipped `code: [object Object]`
// to a screen that branches on it.
const { ok: okRes, err: errRes } = require('../../lib/response');
const intro = require('../../lib/vendor/introductions');

// The vendor typed the number; the list does not carry it back.
function last4(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length >= 4 ? d.slice(-4) : null;
}

// ── GET / — her introductions, newest first ─────────────────────────────────
// The Sent list. `chipState` is NOT called here: it is the vendor-facing
// derivation and the screen's copy map keys on it, so the door ships the raw
// `status` and the pwa maps it. One home for the words, one for the facts.
router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from(intro.TABLE)
    .select('id, recipient_name, recipient_phone, where_met, status, wamid, created_at, sent_at')
    .eq('vendor_id', req.vendor.id)
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);
  const rows = (data || []).map((r) => ({
    id: r.id,
    recipient_name: r.recipient_name,
    recipient_phone_last4: last4(r.recipient_phone),
    where_met: r.where_met,
    // The screen reads this through its own copy map. `chip` is the DERIVED
    // vendor-facing state and it is the one the glass must trust: it is false for
    // a present row with no wamid, which is the whole point of it existing.
    status: r.status,
    chip: intro.chipState(r),
    created_at: r.created_at,
    sent_at: r.sent_at,
  }));
  return okRes(res, { introductions: rows });
}));

// ── POST / — stage one, and show her what it says ───────────────────────────
// 201 with the FILLED BODY so the preview renders the template's own bytes. The
// pwa never holds a copy of that sentence: Meta holds it exactly, the registry
// entry is proven byte-for-byte against the filing, and a paraphrase on the glass
// is how a registry and a filing drift apart (F-41.123's whole lesson).
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { recipient_phone, recipient_name, where_met } = req.body || {};
  const vendor = req.vendor;

  const staged = await intro.stageIntroduction(supabase, {
    vendor,
    draft: { recipient_phone, recipient_name, where_met },
  });

  if (!staged.ok) {
    // THE ARM'S OWN WORDS, FORWARDED. The codes are distinct because the three
    // refusals fail for different reasons and a walk must be able to say which.
    if (staged.code === intro.REFUSE.NO_NUMBER
      || staged.code === intro.REFUSE.NO_NAME
      || staged.code === intro.REFUSE.NO_WHERE) {
      return errRes(res, 400, staged.ask, 'missing_slot');
    }
    if (staged.code === intro.REFUSE.ALREADY_INTRODUCED) {
      return errRes(res, 409, staged.line, 'already_introduced');
    }
    return errRes(res, 500, staged.error || 'could not stage the introduction', staged.code);
  }

  // ── THE DARK GATE IS READ HERE, NOT AT SEND ──────────────────────────────
  // She must learn the plane is off BEFORE she is shown a message and asked to
  // approve it. Reading it only at send would put a confirm dialog in front of a
  // vendor for a send that could never happen, which is the estate telling her
  // something is possible and then refusing — the class R-41.11's whole
  // no-follow-up law exists to avoid at the recipient's end.
  //
  // THE STAGED ROW SURVIVES A 503. It is a fact she authored and the walk needs
  // it (the dark half files a row and refuses); it is not rolled back.
  const cap = require('../../lib/capabilities');
  const KEY = cap.CAPABILITY_KEYS.TDW_INTRODUCTION;
  if (cap.on(KEY) !== true) {
    const why = cap.reason(KEY);
    console.log(`[introduction:door] vendor=${vendor.id} staged=${staged.row.id} — plane dark: ${why}`);
    return errRes(res, 503, why, 'dark');
  }

  // THE ESTATE'S ENVELOPE, NOT A SECOND ONE. `ok()` spreads its payload at the
  // top level (src/lib/response.js:2-4) and hardcodes 200, so a 201 cannot use it
  // — but it can and must carry the SAME shape. The first cut wrapped this in a
  // `data:` object and would have handed the screen a different envelope from
  // every other vendor door it calls.
  return res.status(201).json({
    ok: true,
    ...{
      id: staged.row.id,
      recipient_name: staged.row.recipient_name,
      // The filled template body, built by the arm from `TEMPLATES.introduction`.
      body_filled: intro.filledBody({
        recipient_name: staged.row.recipient_name,
        vendor_name: vendor.business_name,
        where_met: staged.row.where_met,
      }),
      page_url: `https://thedreamwedding.in/v/${staged.row.page_code}`,
    },
  });
}));

// ── POST /:id/send — her approval, and E3 ON THE SERVER ─────────────────────
// The name is checked against THE STAGED ROW, not against anything the client
// says it staged. On the WhatsApp lane E3 was a wrong-recipient guard against a
// bare "yes"; on a form it is the same guard against a client that posts the
// wrong id or a name the vendor never confirmed. Same law, same place: the door.
router.post('/:id/send', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor = req.vendor;
  const { recipient_name } = req.body || {};

  const { data: row, error } = await supabase
    .from(intro.TABLE)
    .select('id, vendor_id, recipient_phone, recipient_name, where_met, page_code, status, wamid')
    .eq('id', req.params.id)
    .eq('vendor_id', vendor.id)        // her own row or none — never another vendor's
    .maybeSingle();
  if (error) return errRes(res, 500, error.message);
  if (!row) return errRes(res, 404, 'no introduction with that id', 'not_found');
  if (row.status !== 'staged') {
    return errRes(res, 409, 'that introduction is no longer waiting to be sent', 'not_staged');
  }

  // E3. `approvalNames` is the arm's, already benched, and it is not re-implemented
  // here: a second spelling of the wrong-recipient guard is a second guard.
  if (!intro.approvalNames(recipient_name, row.recipient_name)) {
    console.log(`[introduction:door] id=${row.id} NOT SENT: approval did not name ${row.recipient_name} — E3`);
    return errRes(res, 409, 'the approval did not name the recipient', 'name_mismatch');
  }

  const out = await intro.sendIntroduction(supabase, { vendor, row, answer: recipient_name });
  if (!out.sent) {
    // Meta refused, or the plane went dark between staging and sending. The
    // vendor reads the arm's own vetoed sentence, never a status code.
    const code = out.status === 'dark' ? 'dark' : 'not_delivered';
    return errRes(res, out.status === 'dark' ? 503 : 502, out.line || out.refusal, code);
  }
  return okRes(res, { id: row.id, status: out.status, wamid: out.wamid });
}));

module.exports = router;
