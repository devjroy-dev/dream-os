// src/lib/contractPdf.js — THE WEDDING SERVICES AGREEMENT
//
// G3.2 · R-G32.1 through .15 · built to `dreamos-pwa/docs/mocks/contracts-mock.html`
// at pwa `6d014ea`, frames **`S3-paper-first`** and **`S3-paper-sign`**, founder-vetoed
// 2026-09-06 with R-40.51 on row 15.
//
// ═══ WHAT IS AND IS NOT AUTHORED HERE ══════════════════════════════════════
// Almost none of this file's prose is this file's. Every clause sentence is
// `docs/specs/TDW_19_CONTRACT_GENERIC_v3.md` VERBATIM — the instrument the founder's
// lawyer approved (R-40.46) — and the twelve clause bodies are transcribed, never
// re-voiced. `{{field}}` tokens are the only thing that fills.
//
// EIGHT STRINGS *ARE* THIS FILE'S, and all eight are rows 65–72 of
// `docs/mocks/G32_VETO_SHEET.md`, vetoed: the eyebrow, the running title, the identity
// line, the seal page's eyebrow, the seal label, the OTP sentence, the digest label and
// the folio. They are the document's CHROME, which v3 does not specify. No other byte in
// this file may be edited without a veto pass.
//
// ═══ IT IS PURE, AND THAT IS THE WHOLE OF ITS CONSTITUTION ════════════════
// `invoicePdf.js`'s split is the shape copied here and the split is the point:
//
//     the typed source   src/lib/vendor/contractSource.js   — reads, never renders
//     the renderer       THIS FILE                          — renders, never reads
//     the url writer     contracts.js `setSealedPath`       — the only writer of it
//
// THIS FILE OPENS NO DATABASE HANDLE AND TAKES NONE. It cannot: `supabase` is not a
// parameter. A renderer that could read is a renderer that will, and then the document
// and its source disagree about what a contract says — which is F-39.49 exactly, one
// plane over.
//
// ⚠ AND IT HAS **ONE CALL SITE**, WHICH `generateInvoicePdf` DOES NOT.
// That function has three (`engine.js:1613`, `api/vendor/invoices.js:183`,
// `api/vendor/money.js:570`) and its own source home records that two of the three
// hand-build their arguments and one does not pass `schedule` at all. This one is
// called from `renderContract` in `src/lib/vendor/contractSource.js` and from NOWHERE
// ELSE; `b56` asserts the count by grep and reds at two.
//
// ═══ THE SEAL BLOCK PRINTS ONLY ON A SIGNED COPY ═══════════════════════════
// `signature` null → the block does not render at all. Not a placeholder, not a greyed
// mark: a document that shows an empty seal is a document that looks signed from across
// a room. Same law as `invoicePdf.js`'s `seal` argument, and for the same reason.
//
// ═══ GEOMETRY ══════════════════════════════════════════════════════════════
// A4, margins {top:50, bottom:50, left:60, right:60} pt — IDENTICAL to
// `invoicePdf.js:35`, and the mock is drawn at exactly these numbers, so a size here is
// a size there. The mock's frames are 794×1123 = 96dpi of this page.
//
// Returns: Buffer (PDF bytes) ready to upload to Supabase storage.
'use strict';

const PDFDocument = require('pdfkit');
const { formatRs, formatDate } = require('./format');

// ── Colours & typography · the invoice document's five, unchanged ────────────
// Not a sixth colour and not a different five. These two documents go to the same
// couple in the same thread and a second palette would read as a second sender.
const COLOUR_BLACK      = '#1A1A1A';
const COLOUR_GREY_DARK  = '#555555';
const COLOUR_GREY_LIGHT = '#999999';
const COLOUR_ACCENT     = '#B08D6A';  // warm gold
const COLOUR_DIVIDER    = '#E5E5E5';

// ── THE FILL MARK IS THE MOCK'S AND NOT THE DOCUMENT'S ──────────────────────
// The mock underlines a filled `{{field}}` in gold so the founder can SEE which words
// came out of a row. The PDF does not: a couple reading her own agreement has no use
// for the distinction, and underlining half a sentence would make a plain document look
// like a form. Stated here because the difference between the ratified frame and the
// build is otherwise a finding against one of them (R-39.15).
const MARK_FILLS = false;

// ── BLANKS ──────────────────────────────────────────────────────────────────
// ⚠ AN UNFILLED TOKEN PRINTS AN UNDERSCORE RUN, NOT THE TOKEN AND NOT `N/A`.
// The register's §4 rule 3 forbids `N/A` and forbids a greyed zero; the record's own
// veto row 23 says `Blank fields print as blanks. Fill what applies.` This is that
// sentence kept. Printing `{{deposit_pct}}` on a couple's agreement would be the
// product's plumbing arriving in her hand.
const BLANK = '__________';

function val(v) {
  if (v === null || v === undefined) return BLANK;
  const s = String(v).trim();
  return s === '' ? BLANK : s;
}
function rs(n) {
  return (n === null || n === undefined || n === '') ? BLANK : `Rs ${formatRs(n)}`;
}
function pct(n) {
  return (n === null || n === undefined || n === '') ? BLANK : `${n}%`;
}

// ── generateContractPdf ──────────────────────────────────────────────────────
// contract  : object — the `contracts` row (title, terms, annexes, deposit_pct, state)
// vendor    : object — the `vendors` row (identity, address, city, rails, gstin)
// client    : object — the `clients` row (name, phone)
// functions : array  — the couple's `events`, ordered by date; [] when none.
//                      ⚠ ONE ROW PER FUNCTION, READ AT RENDER (R-G32.7). This file is
//                      handed the list; it does not know how it was found, and the
//                      anchor `event_id` is not what produced it.
// profile   : object — `contract_profiles.fields`; {} when she has not set them
// money     : object — `{ fee_total, deposit_amount, milestones[] }`, ALL DERIVED by
//                      the source. ⚠ THIS FILE COMPUTES NO MONEY. `deposit_amount` is
//                      30% of the fee exactly once, in `contractSource.js`, because
//                      R-G32.6 gives that number ONE home and a renderer that
//                      recalculated it would be the second.
// signature : object|null — the `contract_signatures` row, or null. NULL → no seal.
//
// Returns: Promise<Buffer>
// ⚠ **`sealed` IS A THIRD STATE, NOT A SECOND NAME FOR `signature` — R-G32.19.**
// F-40.195: the first cut rendered ONE document and printed `document_sha256`
// inside it. A hash inside a document can never be a hash OF the document
// containing it, and the acceptance card compared that printed value against the
// column it was printed FROM — a check that could not fail. Worse, the sealed copy
// was rendered BEFORE `setSealedPath` ran, so it printed `__________` where clause
// 12 promises a fingerprint.
//
// Two renders now, from one function:
//   `sealed: false` → **the agreement as she read it**, no seal page. Its bytes
//                     are what `document_sha256` hashes, and they are stored at
//                     `.agreed.pdf` so the hash has something to be checked against.
//   `sealed: true`  → the same pages PLUS the seal, which prints the hash of the
//                     pages before it. That claim is true and checkable; the old
//                     one was neither.
async function generateContractPdf({ contract, vendor, client, functions, profile, money, signature, sealed = true }) {
  return new Promise((resolve, reject) => {
    try {
      // ⚠ `bufferPages` IS NOT DECORATION. Row 72's folio reads `Page 1 of 5`, and
      // the 5 is not known until the last clause is set. Without buffering the only
      // honest folio would be `Page 1`, which on a five-page agreement tells a couple
      // nothing about whether she has been sent all of it.
      const doc = new PDFDocument({
        size:    'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
        bufferPages: true,
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const startX    = doc.page.margins.left;
      const rightX    = startX + pageWidth;
      const bottomY   = doc.page.height - doc.page.margins.bottom;

      const P    = profile  || {};
      const T    = (contract && contract.terms)   || {};
      const AX   = (contract && contract.annexes) || {};
      const M    = money    || {};
      const fns  = Array.isArray(functions) ? functions : [];
      const business = vendor.business_name || 'Your Vendor';

      // ── helpers · the invoice document's, deliberately ────────────────────
      const rule = (weight = 0.5) => {
        const y = doc.y + 6;
        doc.moveTo(startX, y).lineTo(rightX, y)
           .strokeColor(weight > 0.5 ? COLOUR_ACCENT : COLOUR_DIVIDER)
           .lineWidth(weight).stroke();
        doc.y = y + 12;
      };
      const eyebrow = (label) => {
        doc.fontSize(7.5).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
           .text(String(label).toUpperCase(), startX, doc.y, { characterSpacing: 1 });
      };
      const h2 = (label) => {
        need(40);
        doc.moveDown(0.6);
        doc.fontSize(13).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
           .text(label, startX, doc.y, { width: pageWidth });
        doc.moveDown(0.3);
      };
      const p = (text, grey) => {
        need(28);
        doc.fontSize(9.5).fillColor(grey ? COLOUR_GREY_DARK : COLOUR_BLACK).font('Helvetica')
           .text(text, startX, doc.y, { width: pageWidth, lineGap: 2.2 });
        doc.moveDown(0.35);
      };
      // ⚠ THE PAGE BREAK IS EXPLICIT AND MEASURED, NEVER LEFT TO pdfkit.
      // pdfkit will happily break a clause between its heading and its first line.
      // A heading alone at the foot of a page is how a reader loses a clause.
      function need(h) {
        if (doc.y + h > bottomY - 26) { doc.addPage(); doc.y = doc.page.margins.top; }
      }

      // ── THE TABLES ────────────────────────────────────────────────────────
      // Each is v3's own shape; the fill decides only how many lines it has. They are
      // closures rather than module functions because every one of them needs `doc`,
      // and threading a pdfkit handle through four signatures to avoid a closure would
      // buy nothing and cost four chances to pass the wrong one.
      const COLS_DATES = [0.22, 0.16, 0.14, 0.28, 0.20];
      function tRow(cells, widths, opts) {
        const o = opts || {};
        need(24);
        let x = startX;
        const y = doc.y;
        let tallest = 0;
        cells.forEach((cell, i) => {
          const w = pageWidth * widths[i];
          doc.fontSize(o.head ? 7.5 : 9.5)
             .fillColor(o.head ? COLOUR_GREY_LIGHT : COLOUR_BLACK)
             .font('Helvetica');
          const text = o.head ? String(cell).toUpperCase() : String(cell);
          const align = (o.right && o.right.indexOf(i) >= 0) ? 'right' : 'left';
          doc.text(text, x, y + (o.head ? 4 : 5),
                   { width: w - 8, align, characterSpacing: o.head ? 1 : 0 });
          tallest = Math.max(tallest, doc.y - y);
          x += w;
        });
        doc.y = y + Math.max(tallest, o.head ? 16 : 20);
        doc.moveTo(startX, doc.y).lineTo(rightX, doc.y)
           .strokeColor(COLOUR_DIVIDER).lineWidth(0.5).stroke();
        doc.y += 2;
      }

      // ⚠ ONE ROW PER FUNCTION, AND WHEN THERE ARE NONE THE TABLE IS NOT DRAWN.
      // An empty five-column grid on a couple's agreement says "we forgot"; a
      // sentence says what is true. `function_N_venue` and `function_N_city` come
      // out of `terms` keyed by the event's id, because `public.events` has neither
      // column and gains none (R-G32.8).
      function dateTable(fns, T) {
        if (!fns.length) {
          p('The functions and their venues are set out in the annexes attached to this ' +
            'agreement.', true);
          return;
        }
        tRow(['Function', 'Date', 'Time', 'Venue', 'City'], COLS_DATES, { head: true });
        fns.forEach((e) => {
          const k = (T.functions && T.functions[e.id]) || {};
          tRow([
            val(e.title), formatDate(e.event_date),
            val(e.event_time ? hhmm(e.event_time) : (e.slot || null)),
            val(k.venue), val(k.city),
          ], COLS_DATES);
        });
      }

      // ⚠ THE DEPOSIT IS MILESTONE 1 AND IS NOT PRINTED TWICE. R-G32.6: one number,
      // one home. The row reads `now` because v3's own table does.
      function moneyTable(M, contract) {
        const W = [0.42, 0.16, 0.22, 0.20];
        tRow(['Deposit, on signing', pct(contract.deposit_pct), rs(M.deposit_amount), 'now'],
             W, { right: [1, 2, 3] });
        (M.milestones || []).forEach((m) => {
          tRow([val(m.label), pct(m.pct), rs(m.amount), m.due ? formatDate(m.due) : BLANK],
               W, { right: [1, 2, 3] });
        });
      }

      function cancelTable(P) {
        const W = [0.62, 0.38];
        tRow(['You tell us', 'You pay'], W, { head: true, right: [1] });
        tRow([`more than ${val(P.cancel_tier_1_days)} days before`, pct(P.cancel_tier_1_pct)], W, { right: [1] });
        tRow([`${val(P.cancel_tier_2_days)}–${val(P.cancel_tier_1_days)} days before`, pct(P.cancel_tier_2_pct)], W, { right: [1] });
        tRow([`${val(P.cancel_tier_3_days)}–${val(P.cancel_tier_2_days)} days before`, pct(P.cancel_tier_3_pct)], W, { right: [1] });
        tRow([`fewer than ${val(P.cancel_tier_3_days)} days before`, pct(P.cancel_tier_4_pct)], W, { right: [1] });
      }

      // ── CLAUSES 7 TO 11 — v3 verbatim, transcribed, not summarised ────────
      // ⚠ Clause 8's optional blocks are printed WHOLE and unconditionally, and the
      // register §7 note is why: `couples.publish_weddings` :388 and
      // `weddings.couple_consent` :1235 both default false and SIGNING MUST NOT
      // WRITE EITHER. The clause says publication is switched on only by the couple,
      // in her own account. A composer that flipped a flag on signature would make
      // the instrument's own sentence false — so this file prints the sentence and
      // touches nothing.
      function clausesSevenToEleven() {
        h2('7 · What we need from you');
        p('One named person we can call at each function, with their number.', true);
        p("The venue's permission for us to work — including for our equipment, lighting, " +
          'power, and a drone if one is in the annex — and a heads-up on any restriction they ' +
          'place on us, as soon as you know.', true);
        p('Safe access to the spaces we need, at the times agreed, and somewhere secure to ' +
          'keep equipment.', true);
        p('Your decisions and approvals when we ask for them. If a delay on your side pushes ' +
          "a deadline, clause 6's clock moves by the same amount.", true);
        p(`Meals and water for our team on a long day — ${val(P.meals_provision)} — and a word ` +
          'with us about anything that affects our safety or our work, or anyone who ' +
          "mustn't be photographed.", true);
        p('We\u2019ll always be courteous to you and your guests, and we ask the same. If ' +
          'someone on our team is threatened or harassed, we may withdraw from that function ' +
          "and we'll tell your named contact why, at the time.", true);

        h2('8 · Your photographs, and the wedding page');
        p('We own the copyright in what we create. Once the full fee is paid, you have a ' +
          'permanent, worldwide licence to use it for yourselves and your family — print it, ' +
          'share it, frame it, post it — forever, at no further cost. Guests you share with ' +
          'get it on the same personal-use terms.');
        p("You can't sell it, license it to anyone else, enter it in a competition as your " +
          'own, or let it be used in advertising, without our written permission.', true);
        p("We'd like to show your wedding in our portfolio, on our website and social media, " +
          'and to people considering booking us. You can say no now, or change your mind later ' +
          `— tell us and we'll stop within ${val(P.takedown_days)} days, though we can't recall ` +
          "what's already printed or already shared by someone else.", true);
        p('The platform can publish a page for your wedding, with photographs and a credit to ' +
          'everyone who worked on it. Signing this agreement does not switch that on. It is ' +
          'switched on only by you, in your own account, by the setting called "Publish our ' +
          'wedding" — which is off unless you turn it on, and which you can turn off again at ' +
          `any time, for any reason, without asking anyone. When it's off, the page comes down ` +
          `within ${val(P.takedown_days)} days. Nothing above overrides that switch.`, true);
        p('The credit. If that page is published, everyone who worked on your wedding is ' +
          `credited by their role — we'd be credited as ${val(P.vendor_credit_role)}, and ` +
          "we'll name the others so they're credited too. Nobody pays to be credited, and no " +
          'credit is placed or ranked by payment.', true);
        p('Your guests. Nobody is named in anything published without their own say-so, and ' +
          'any guest who asks to be taken out of a published photograph is taken out within ' +
          `${val(P.takedown_days)} days.`, true);
        p("Anything you give us — photographs, music, artwork, text — you're telling us you " +
          'have the right to let us use it.', true);

        h2("9 · If something beyond anyone's control happens");
        p('Floods, fire, an earthquake, an epidemic or a public-health restriction, a ' +
          'government order or curfew, riot or unrest, a strike or a failure of transport or ' +
          "power we couldn't work around, serious illness or injury to us or a key member of " +
          'our team, or a death in your family or ours — if any of that stops a function ' +
          'happening, neither of us has broken this agreement and neither owes the other ' +
          'damages.');
        p("We'll move the wedding first, not cancel it. Clause 5's once-only limit doesn't " +
          "apply here, and everything you've paid moves with it. If after genuinely trying we " +
          `can't agree new dates within ${val(P.fm_window_months)} months, either of us can ` +
          'end this in writing: we keep the value of work already done and costs we\u2019ve ' +
          `committed and can't get back — itemised for you — refund the rest within ` +
          `${val(P.refund_days)} days, and neither of us owes the other anything more.`, true);
        p("This clause isn't available to someone who could have gone ahead and chose not to, " +
          "and it doesn't cover a change of plan, a change of mind, or running short of money. " +
          'Whoever relies on it tells the other as soon as they reasonably can, and says what ' +
          "they're doing about it.", true);

        h2("10 · If someone can't make it");
        p('We may use employees, assistants and freelancers, and we stay responsible to you ' +
          'for their work and their conduct as if it were ours.');
        if (T.named_professional) {
          p(`${val(T.named_professional)} will personally be there. If illness, injury or ` +
            "clause 9 prevents that, we'll send someone of comparable skill at no extra cost " +
            "and tell you as soon as we know. If you'd rather not accept the substitute, you " +
            "can cancel that function and we'll refund what it was worth — clause 5's slab " +
            "won't apply to that refund.", true);
        }
        p("Where no individual is named, we'll allocate our team as we judge best, with the " +
          'number of people the annex states.', true);

        h2('11 · The short ones');
        p("What we're liable for. We'll work with reasonable skill and care. Our total " +
          'liability under this agreement, for everything, is limited to the fee we\u2019ve ' +
          'actually received — and neither of us is liable to the other for indirect or ' +
          'consequential loss. Cameras, lights and memory cards do fail; we use professional ' +
          'equipment and back up as the annex says, and if something is still lost that way ' +
          "and not through carelessness, we'll refund a fair share of the fee for what was " +
          'lost. None of this limits liability for death or personal injury caused by ' +
          "negligence, for fraud, or for anything else the law won't let us limit.");
        p('Your details stay private. We keep your information, your guest list and your ' +
          "family's business to ourselves, use it only to do this work, keep it no longer than " +
          'clause 6 and the law require, and never sell it or share it for marketing. You can ' +
          'ask us what we hold, ask us to correct it, and ask us to erase it — except for what ' +
          "clause 8 licenses us, what we're required to keep, and what's already published " +
          'with your consent.', true);
        // ⚠ ONE HOME FOR THE JURISDICTION. `vendors.city` :1138 prints at clause 1 and
        // again here, from the same read. It is never typed a second time (register §7).
        p(`Law and where. Indian law applies, and the courts at ${val(vendor.city)} decide ` +
          "anything we can't settle between us — which we'll always try to do first.", true);
      }

      function hhmm(t) {
        const m = /^(\d{2}):(\d{2})/.exec(String(t));
        if (!m) return t;
        let h = Number(m[1]); const ap = h >= 12 ? 'pm' : 'am';
        h = h % 12; if (h === 0) h = 12;
        return `${h}:${m[2]} ${ap}`;
      }

      // ═══ ROWS 65-67 · THE HEAD (VETOED) ══════════════════════════════════
      eyebrow('Agreement');
      doc.moveDown(0.2);
      doc.fontSize(22).fillColor(COLOUR_BLACK).font('Helvetica-Bold')
         .text('Wedding services', startX, doc.y, { width: pageWidth });
      doc.fontSize(9).fillColor(COLOUR_GREY_LIGHT).font('Helvetica')
         .text(`${business} · ${val(vendor.routing_handle && String(vendor.routing_handle).toUpperCase())} · ${formatDate(T.agreement_date || new Date().toISOString())}`,
               startX, doc.y + 3, { width: pageWidth });
      doc.moveDown(0.6);
      rule(1);

      // ═══ 1 · WHO THIS IS BETWEEN — v3 verbatim ═══════════════════════════
      h2('1 · Who this is between');
      p(`Made on ${formatDate(T.agreement_date || new Date().toISOString())}, between:`);
      p(`${business} — a ${val(P.vendor_category_words)} business at ${val(vendor.address)}, ` +
        `${val(vendor.city)}, signing through ${val(P.vendor_signatory_name)}, on ` +
        `${val(vendor.phone)}. Called "we" below.`);
      p('and');
      p(`${val(client && client.name)} and ${val(T.partner_2_name)}, on ` +
        `${val(client && client.phone)}. Called "you" below.`);
      p('Either of you may agree things with us, and either of you can be held to what is ' +
        'agreed here — unless you tell us in writing that only one named person may instruct us.', true);

      // ═══ 2 · WHAT WE'RE DOING ════════════════════════════════════════════
      h2("2 · What we're doing");
      p(`We'll do what the attached annexes describe: ${val(annexList(AX))}. Those annexes are ` +
        'part of this agreement.');
      p("If an annex isn't attached, that service isn't included. Anything not written in this " +
        `agreement or an attached annex isn't included either — in particular: ${val(P.exclusions || T.exclusions)}.`, true);
      p(`We'll do the work with the skill and care you'd expect of a ${val(P.vendor_category_words)} ` +
        'business, ourselves or through our team.', true);
      p('Changing the plan. Either of us can suggest a change. It counts once you\u2019ve both ' +
        "agreed it in writing and we've told you what it costs and you've said yes to that price.", true);
      p('We can say no to something that would be unsafe, unlawful, or against the venue\u2019s ' +
        "rules. That isn't us breaking this agreement.", true);

      // ═══ 3 · THE DATES — ONE ROW PER FUNCTION (R-G32.7) ══════════════════
      h2('3 · The dates');
      dateTable(fns, T);
      p('These dates are the whole point of this agreement. From the moment your deposit ' +
        "reaches us, we hold them for you and won't take another booking that stops us being " +
        'there. Before the deposit reaches us, we hold nothing.', true);

      // ═══ 4 · MONEY ═══════════════════════════════════════════════════════
      h2('4 · Money');
      p(`The fee is ${rs(M.fee_total)} — ${val(T.fee_breakdown)}.`);

      // ⚠ THE GST BLOCK IS OMITTED WHOLE WHEN SHE IS NOT REGISTERED, OR WHEN
      // EITHER SETTING IS BLANK — register §4 rule 3, and R-G32.12. Not greyed,
      // not "N/A", not a zero rate. The record says `Add your GSTIN to print the
      // tax block.` (veto row 29) and that is the whole of the surface.
      if (vendor.gstin && P.gst_treatment && P.gst_pct) {
        p(`That fee is ${val(P.gst_treatment)} of GST. GST at ${pct(P.gst_pct)} is ` +
          `${rs(M.gst_amount)}, so you pay ${rs(M.fee_payable_with_gst)}. Our GSTIN is ` +
          `${val(vendor.gstin)} and you'll get a tax invoice for every payment. If the rate ` +
          'changes by law before your wedding, the amount changes with it.');
      }

      p(`The deposit is ${pct(contract.deposit_pct)} — ${rs(M.deposit_amount)} — paid when you ` +
        "sign. It's what holds your dates. There's no separate booking amount, retainer or " +
        'advance; this is that money, under one name.');
      moneyTable(M, contract);
      p(`Pay us directly — UPI ${val(vendor.upi_id)}, or ${val(vendor.account_name)} / ` +
        `${val(vendor.account_number)} / IFSC ${val(vendor.ifsc)}, or cash against a receipt. ` +
        'No money under this agreement goes through any platform, and no one takes a ' +
        'commission on it.', true);
      p(`Travel and extra hours. For functions outside ${val(vendor.city)}, travel and stay are ` +
        `${val(P.travel_terms)}. Hours beyond what the annex says are ${rs(P.overtime_rate)} per ` +
        `${val(P.overtime_unit)}, and we'll tell you before the clock starts wherever we can.`, true);
      p(`If a payment is late. More than ${val(P.late_grace_days)} days late, we may charge ` +
        `${pct(P.late_interest_pct)} a month on what's overdue, and if it stays unpaid we may ` +
        'pause work until it\u2019s cleared — but never in the week before a function, and ' +
        "we'll always tell you first. Time lost to a pause is added to the delivery time at " +
        'clause 6. We hand over the finished work once the full fee has reached us.', true);

      // ═══ 5 · IF PLANS CHANGE ═════════════════════════════════════════════
      h2('5 · If plans change');
      p(`Postponing. Weddings move. Tell us in writing at least ${val(P.postpone_notice_days)} ` +
        "days before the first function and we'll move everything you've paid to new dates " +
        `within ${val(P.postpone_window_months)} months, if we're free. This works once.`, true);
      p('Cancelling. Tell us in writing; that date is the date of cancellation.', true);
      cancelTable(P);
      p(`What you've already paid comes off what you owe. If you've paid more, we refund the ` +
        `difference in ${val(P.refund_days)} days; if less, you pay it in ${val(P.refund_days)} days.`, true);
      p(`Is the deposit refundable? ${val(P.deposit_refundable)}`, true);

      // ═══ 6 · WHAT YOU GET, AND WHEN ══════════════════════════════════════
      h2('6 · What you get, and when');
      p('We deliver what the attached annexes list.');
      p(`Within ${val(P.delivery_days)} days of your last function, unless an annex gives a ` +
        'different time for a particular item. Days lost to a payment pause or to clause 9 ' +
        'are added on.', true);
      p(`How: ${val(P.delivery_method)}. If it's a download link, it stays live ` +
        `${val(P.link_live_days)} days and we'll tell you the date it expires.`, true);
      p(`Changes: ${val(P.revision_rounds)} round(s) included. Further rounds are ` +
        `${rs(P.revision_rate)} each.`, true);
      p(`We keep the original files for ${val(P.archive_months)} months, then we may delete ` +
        "them. Please take and keep your own copy. We're not a backup service.", true);

      // ═══ 12 · SIGNING — v3 verbatim, and the seal ════════════════════════
      // ⚠ Clauses 7–11 ride the same transcription and are elided from THIS cut's
      // source only in the sense that they are printed by `clausesSevenToEleven`
      // below; nothing of v3 is dropped. The bench asserts all twelve headings.
      clausesSevenToEleven();

      h2('12 · Signing');
      p("We'll send this to you on WhatsApp. You read it on your phone, we send a one-time " +
        `password to ${val(client && client.phone)}, and you enter it and tap "I agree". That ` +
        'is your signature. We then seal a PDF of what you agreed — carrying the date, the ' +
        'time, both our numbers and a digest of the document — and both of us get that PDF on ' +
        'WhatsApp. The sealed PDF is the signed agreement. This is a contract made ' +
        'electronically under section 10A of the Information Technology Act, 2000, and neither ' +
        "of us will later say it doesn't count because it was signed this way.");
      p("If you'd rather sign on paper, say so and we will — a signed paper copy has exactly " +
        'the same effect.', true);

      rule();
      p(`${val(P.vendor_signatory_name)}, for ${business} \u2014 ${val(vendor.phone)}`);
      p(`${val(client && client.name)} and ${val(T.partner_2_name)} — ${val(client && client.phone)}`);
      p(`Attached: ${val(annexList(AX))}`);

      // ═══ ROWS 68-71 · THE SEAL (VETOED) — SIGNED COPIES ONLY ═════════════
      // ⚠ THE SEAL PAGE IS OMITTED WHEN `sealed` IS FALSE — that is what makes the
      // digest checkable. `signature.verified_at` still gates it as well: an
      // unverified signing is a code sent and not entered, and a seal over it would
      // say a document was signed that was not.
      if (sealed && signature && signature.verified_at) {
        need(120);
        const y0 = doc.y + 8;
        doc.fontSize(7.5).fillColor(COLOUR_ACCENT).font('Helvetica')
           .text('SIGNED ELECTRONICALLY', startX + 16, y0 + 14, { characterSpacing: 1.4 });
        doc.fontSize(9.5).fillColor(COLOUR_BLACK).font('Helvetica')
           .text(`${val(client && client.name)} · ${val(signature.signer_phone)} · ` +
                 `${formatDate(signature.verified_at)}, ${istClock(signature.verified_at)}`,
                 startX + 16, doc.y + 3, { width: pageWidth - 32 });
        doc.fontSize(9.5).fillColor(COLOUR_GREY_DARK).font('Helvetica')
           .text('Confirmed by one-time password sent to that number.',
                 startX + 16, doc.y + 2, { width: pageWidth - 32 });
        // ⚠ **THE LABEL NAMES WHAT THE HASH IS OF — R-G32.19's whole point.**
        // `DOCUMENT FINGERPRINT` was a claim the bytes could not support. This says
        // exactly which bytes, so a couple (or her lawyer) can recompute it.
        doc.fontSize(7.5).fillColor(COLOUR_ACCENT).font('Helvetica')
           .text('FINGERPRINT OF THE AGREEMENT AS SIGNED (SHA-256 OF THE PAGES BEFORE THIS ONE)',
                 startX + 16, doc.y + 8, { characterSpacing: 1.1, width: pageWidth - 32 });
        // ⚠ THE DIGEST IS PRINTED WHOLE. A digest truncated for looks is a digest
        // nobody can check, and clause 12 promises a checkable one.
        doc.fontSize(8).fillColor(COLOUR_GREY_DARK).font('Courier')
           .text(val(signature.document_sha256), startX + 16, doc.y + 2, { width: pageWidth - 32 });
        const y1 = doc.y + 12;
        doc.rect(startX, y0, pageWidth, y1 - y0).strokeColor(COLOUR_ACCENT).lineWidth(0.5).stroke();
        doc.y = y1 + 6;
      }

      // ═══ ROW 72 · THE FOLIO (VETOED) ═════════════════════════════════════
      // Written on every page at the end, because the count is not known until the
      // document is finished. `bufferPages` is why that is possible at all.
      stampFolios(doc, business, client, startX, pageWidth);

      doc.end();
    } catch (err) { reject(err); }
  });

  // ── locals ────────────────────────────────────────────────────────────────
  function annexList(AX) {
    const NAMES = {
      a: 'Annex A — Photography and film', b: 'Annex B — Makeup and hair',
      c: 'Annex C — Décor and production', d: 'Annex D — Planning and coordination',
      e: 'Annex E — Mehendi', f: 'Annex F — Venue', g: 'Annex G — Other services',
    };
    const on = Object.keys(NAMES).filter((k) => AX && AX[k]);
    return on.length ? on.map((k) => NAMES[k]).join(', ') : null;
  }
}

module.exports = { generateContractPdf, BLANK, MARK_FILLS };

// ── helpers hoisted out of the promise so the file reads as a document ───────
function istClock(iso) {
  try {
    const d = new Date(iso);
    const s = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    return `${s.replace(/\s?([AP])M/i, (m, g) => ' ' + g.toLowerCase() + 'm')} IST`;
  } catch (_) { return ''; }
}

function stampFolios(doc, business, client, startX, pageWidth) {
  const range = doc.bufferedPageRange ? doc.bufferedPageRange() : null;
  if (!range) return;
  const who = `${business} · ${(client && client.name) || ''}`.replace(/ · $/, '');
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    // ⚠ THE BOTTOM MARGIN IS ZEROED FOR THE FOLIO AND RESTORED IMMEDIATELY.
    // pdfkit ADDS A PAGE for any text drawn below the margin box — so a footer
    // written at `height - bottom + 14` silently appended one page per page, and
    // a five-page agreement rendered as twelve. Found on the render, not in the
    // source: `pdfinfo` said 12 and the frame says 5. The walk law, one plane down.
    const keep = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - keep + 14;
    doc.moveTo(startX, y - 8).lineTo(startX + pageWidth, y - 8)
       .strokeColor('#E5E5E5').lineWidth(0.5).stroke();
    doc.fontSize(7.5).fillColor('#999999').font('Helvetica')
       .text(who, startX, y, { width: pageWidth * 0.7, lineBreak: false });
    doc.fontSize(7.5).fillColor('#999999').font('Helvetica')
       .text(`Page ${i + 1} of ${range.count}`, startX, y,
             { width: pageWidth, align: 'right', lineBreak: false });
    doc.page.margins.bottom = keep;
  }
}
