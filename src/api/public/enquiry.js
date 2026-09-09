// src/api/public/enquiry.js
// CE-41 · SEAT D · D3c2b · F-41.128 — THE PUBLIC ENQUIRY READ (R-41.119, R-41.131).
// Cut at dream-os 3f323817cbdc332f07571d6790c46d354983d3cd.
//
//   GET /api/v2/public/enquiry/:token   — the one read behind /e/<token>
//
// ═══════════════════════════════════════════════════════════════════════════════
// THIS IS AN UNAUTHENTICATED READ ABOUT A COUPLE, AND THAT IS THE WHOLE PROBLEM.
// Anyone with the link sees it. There is no session, no vendor, no proof the reader
// is the outsider we sent it to — a forwarded WhatsApp message, a screenshot, a
// shared phone all reach here. So the door is built around what it REFUSES.
//
// ── WHAT IT RETURNS, EXHAUSTIVELY ─────────────────────────────────────────────
//   category    the trade, as a bare noun
//   city        where the wedding is
//   month       month and year, never the day
//   budget_band a BAND, never the figure
//
// ── WHAT IT NEVER RETURNS, AND WHY EACH ONE ──────────────────────────────────
//   HER PHONE       — roadmap §7's standing refusal: the couple's number never
//                     leaves with an outsider. This door is the last place it could
//                     be allowed to and the first place it would be noticed.
//   HER NAME        — a name plus a city plus a date is enough to find someone.
//   THE EXACT DATE  — the day is identifying in a way the month is not; "December
//                     2026 in Jaipur" describes thousands of weddings, "22 December
//                     2026 in Jaipur" describes far fewer.
//   THE BUDGET FIGURE — R-41.142's chair reading: a band, never `Rs 1,50,000`. The
//                     figure is a negotiating position and it is HERS, not ours to
//                     publish to whoever holds the link.
//   OTHER ITEMS     — the token names ONE enquiry. A reader who was sent the
//                     photography link does not learn she is also short a makeup
//                     artist; that is a second fact she did not consent to share.
//   ANY ID          — no request id, no couple id, no vendor ids. An id is a key to
//                     another door, and this door hands out no keys.
//
// ── THE TOKEN IS NOT A SECRET AND IS NOT TREATED AS ONE ──────────────────────
// `enq-<first eight hex of the item id>` (R-41.131). Eight hex is guessable by
// anyone willing to try, which is exactly why NOTHING BEHIND THIS DOOR IS PRIVATE:
// the four fields above are what we already put in the WhatsApp template that goes
// to a stranger. The token names an enquiry; it does not authorise anything.
//
// ⚠ IT ALSO REFUSES TO CONFIRM WHAT IT CANNOT SHOW. A token that matches nothing
// and a token that matches a CLOSED request get the SAME answer. Distinguishing
// them would turn the door into an oracle: try tokens, learn which enquiries exist.
// ═══════════════════════════════════════════════════════════════════════════════

// Shaped on its sibling src/api/public/vendorCard.js:433 — a plain async handler,
// no asyncHandler wrapper (there is no src/lib/http.js; the first cut imported one
// that does not exist). Same idiom, same directory, one less thing to be surprised by.
const express = require('express');
const router  = express.Router();
// F-42.57 — `categoryNoun` comes from the writer's module, which is the estate's ONE
// home for the trade's English (CATEGORY_NOUN at src/lib/couple/assistance.js:423).
// It was already exported; nothing new is minted here and nothing is copied.
const { publicEnquiry, categoryNoun } = require('../../lib/couple/assistance');

// The bands. Deliberately coarse and deliberately few — a band with ten steps is a
// figure wearing a disguise. `Rs` per the wallet law: no glyph, no K/L/Cr.
function budgetBand(rs) {
  const n = Number(rs) || 0;
  if (n <= 0)      return null;                    // no figure filed → say nothing
  if (n < 50000)   return 'under Rs 50,000';
  if (n < 100000)  return 'Rs 50,000 to Rs 1,00,000';
  if (n < 300000)  return 'Rs 1,00,000 to Rs 3,00,000';
  if (n < 1000000) return 'Rs 3,00,000 to Rs 10,00,000';
  return 'over Rs 10,00,000';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Month and year only. The day is dropped BEFORE the value leaves this function, so
// no later edit can render what was never carried.
function monthYear(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// ONE ANSWER FOR EVERY MISS. Not found, closed, malformed, no such item — all of
// them land here, so the door tells a prober nothing about which it was.
const NOTHING = { ok: true, found: false };

router.get('/:token', async (req, res) => {
  const raw = String(req.params.token || '');
  const m = raw.match(/^enq-([0-9a-f]{8})$/i);
  if (!m) return res.json(NOTHING);
  const prefix = m[1].toLowerCase();

  // ── THE READ IS THE WRITER'S, THE SHAPE IS THIS DOOR'S ───────────────────
  // b20_a2's one-home cell caught the first cut querying assistance_* directly:
  // those tables have exactly two readers-of-record, and a public door is not one.
  // `publicEnquiry` returns four raw values or null; EVERYTHING a stranger sees is
  // decided below, in one place, by name.
  const row = await publicEnquiry(req.app.locals.supabase, prefix);
  if (!row) return res.json(NOTHING);

  // Built field by field from named values. NEVER a spread of the row — a spread is
  // how `phone` arrives on a public payload the day someone adds a column.
  return res.json({
    ok: true,
    found: true,
    enquiry: {
      // ── F-42.57 · THE TRADE IN ENGLISH, NOT THE DATABASE'S TOKEN ─────────
      // This handed out `row.category` raw, so the page read `photography` — and
      // would have read `venue_catering` and `content_creator` the day either was
      // forwarded. R-40.88: no underscore leaves a document. Worse than the
      // underscore: the WhatsApp message that brings her here renders `{{4}}`
      // through this same function (assistance.js:1077 area), so the message said
      // "needs a venue and caterer" and the page said "venue_catering" — one fact,
      // two spellings, one of them not English.
      //
      // `categoryNoun` returns 'vendor' for anything it does not know, so an
      // unmapped token degrades to a true word rather than leaking the column.
      category:    row.category ? categoryNoun(row.category) : null,
      city:        row.city || null,
      month:       monthYear(row.wedding_date),
      budget_band: budgetBand(row.budget_rs),
    },
  });
});

module.exports = router;
