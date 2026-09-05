// src/lib/templates.js — Meta WhatsApp message-template registry (Block 05, P2).
//
// TRANSPORT (P-06.T, settled 2026-07-18): Meta WhatsApp Cloud API, DIRECT, TDW as
// Tech Provider on its own WABA. A Meta template is referenced by its NAME + LANGUAGE
// on the WABA — that pair is the identity. There is deliberately NO twilioTemplateSid /
// Content SID here: the webhook spec's `twilioTemplateSid` field is stale and dropped.
//
// Each entry:
//   key        — the registry key (what callers pass as templateKey)
//   name       — the Meta template name (submitted to the WABA)
//   language   — the Meta language code the template is filed under
//   line       — 'bride' | 'vendor' | 'marketing' (sendWa resolves FROM by this)
//   category   — 'UTILITY' | 'MARKETING' (Meta category)
//   variables  — ordered semantic names; body {{1}} = variables[0], {{2}} = variables[1], …
//   body       — the exact body filed with Meta (kept in sync with docs/TEMPLATES.md)
//   status     — 'draft' | 'submitted' | 'pending' | 'approved'
//                ('pending' added TDW_07 P1 for `demo_lead_alert` — filed with Meta,
//                 awaiting its word. That wait ENDED: Meta approved tdw_demo_lead_alert
//                 on 2026-07-29 at ~17:31 UTC, Utility retained, and TDW_07 P2 flipped
//                 the field. The value survives in this enum because the state is real
//                 and the next template filed will pass through it. The gate is unchanged
//                 — it tests `=== 'approved'` and nothing else, so every non-approved
//                 value refuses identically. The enum is documentation; the gate is the
//                 mechanism, and only the gate decides.)
//                 [F-06.85: this paragraph is conditioned on a MECHANICAL fact — Meta's
//                  review state — so it is re-read whenever that fact moves. It has moved
//                  once, at TDW_07 P2. Mechanism: `isApproved` at the bottom of this file.]
//                sendWa will ONLY send a business-initiated message when status==='approved'.
//                All six ship 'draft'; the founder flips each to 'approved' after Meta approves.
//
// Bodies are single-line by design (no '\n' → no double-line-break rejection), no variable
// is adjacent to another, and none begins/ends a body — see docs/TEMPLATES.md §1.

'use strict';

const TEMPLATE_LANGUAGE = process.env.WA_TEMPLATE_LANGUAGE || 'en';

const TEMPLATES = {
  marketing_opener: {
    key: 'marketing_opener',
    name: 'tdw_marketing_opener',
    language: TEMPLATE_LANGUAGE,
    line: 'marketing',
    category: 'MARKETING',
    variables: ['name'],
    // Couple-facing agent is named Mira (see TEMPLATES.md §5). Filed 2026-07-19.
    body:
      "Hi {{1}}, this is Mira from The Dream Wedding. We keep your vendors, payments, " +
      "and timeline in one place. Reply here and I'll show you how it would work for " +
      "your wedding. Reply STOP to opt out.",
    status: 'approved',
  },

  morning_nudge_vendor: {
    key: 'morning_nudge_vendor',
    name: 'tdw_morning_nudge_vendor',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name', 'summary'],
    body:
      "Good morning {{1}}. Here's your day: {{2}}. Reply STOP MORNINGS to pause these updates.",
    status: 'approved',
  },

  morning_nudge_bride: {
    key: 'morning_nudge_bride',
    name: 'tdw_morning_nudge_bride',
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'UTILITY',
    variables: ['name', 'summary'],
    // First-person "Here's where things stand" is Mira's voice (couple-facing agent).
    body:
      "Good morning {{1}} \uD83C\uDF38 Here's where things stand for your wedding: {{2}}. " +
      "Reply STOP MORNINGS anytime to pause.",
    status: 'approved',
  },

  // ── TDW_06 THE HAND · THE DOORBELL (R-29.24) ──────────────────────────────
  // AUTHORED FROM THE WIRE WITNESS AND NO OTHER SOURCE (F-08.75). Founder-
  // witnessed on his own Meta Template Manager, 2026-08-11: name
  // `tdw_enquiry_update_couple` · UTILITY · English · quick-reply 「 See the
  // update 」 · body submitted BYTE-IDENTICAL to the chair's vetoed draft. Meta
  // approved it minutes after filing.
  //
  // WHAT IT IS FOR: the vendor→bride window is a 24-hour customer-service window
  // and it closes. Before this template the estate's only honest answer on a shut
  // window was byte ④ — 「 Not sent. She hasn't written in over 24 hours 」 — and
  // the vendor's message simply waited. THIS IS THE DOORBELL: it does not carry
  // his message (a UTILITY template cannot), it tells her there IS one, and her
  // reply re-opens the window so the real words can follow, word for word.
  //
  // LANE: 'vendor'. NON-NEGOTIABLE and celled. A doorbell sent from the bride
  // PNID invites her reply onto the wrong number, and the whole mechanic dies
  // silently — she answers into a lane that has no draft waiting.
  //
  // {{1}} bride first name · {{2}} vendor display name. Single line, no variable
  // adjacent to another, none at the body's start or end — §1's own rules.
  enquiry_update_couple: {
    key: 'enquiry_update_couple',
    name: 'tdw_enquiry_update_couple',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name', 'vendor'],
    body:
      "Hi {{1}} — your vendor {{2}} has an update on your wedding enquiry. " +
      "Reply here and it will be shared with you right away.",
    status: 'approved',
  },

  // ── TDW_06/07 THE OOW COMPLETION · M1 — THE ENQUIRY BRIEF ─────────────────
  // AUTHORED FROM THE WIRE WITNESS AND NO OTHER SOURCE (F-08.75). The founder
  // captured this off his own Meta Template Manager Edit screen: name
  // `tdw_enquiry_brief_vendor` · UTILITY · English · NO button · body verbatim
  // below. Approved on the WABA since 2026-08-05 and UNMAPPED until this
  // sitting — `enquiryAlert.js`'s old OOW registry named its absence
  // deliberately rather than guessing a mapper, and this entry is that wait
  // ending with the bytes in hand.
  //
  // WHAT IT IS FOR, AND WHY IT REPLACES `enquiry_alert_vendor` ON THIS PATH.
  // The alert that has been reaching out-of-window vendors says a bride
  // enquired and does NOT say what she asked — `{{3}}` is this template's whole
  // reason to exist. `enquiry_alert_vendor`'s three slots (name/bride/link)
  // cannot carry her words; this one's four can.
  //
  // {{3}} IS HER OWN SENTENCE — scrubbed, newline-collapsed, truncated at a
  // declared cap (CE ruling, Fork 2 arm (a); the composer is
  // `src/lib/vendor/enquiryAlert.js`, symbol `briefSummary`). NEVER an invented
  // field, and never the model's frame: the model's frame is multi-line on the
  // returning-bride shape and a template parameter cannot carry a newline.
  //
  // LANE: 'vendor'. The vendor's own handset, the vendor's own PNID.
  //
  // BODY SHAPE against docs/TEMPLATES.md §1: single line · variables 1..4, no
  // gaps · the body neither begins nor ends on a variable · no two variables
  // adjacent. Checked line by line against §1 at authoring.
  //
  // [F-06.85: conditioned on a MECHANICAL fact — Meta's review state for
  //  tdw_enquiry_brief_vendor. Mechanism: `isApproved` at the bottom of this
  //  file. If Meta pauses or reclassifies it, `status` moves and the door's
  //  send refuses honestly with no other change.]
  enquiry_brief_vendor: {
    key: 'enquiry_brief_vendor',
    name: 'tdw_enquiry_brief_vendor',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name', 'bride', 'summary', 'link'],
    body:
      "Hi {{1}}, a new enquiry just came in on The Dream Wedding. It's from {{2}}, " +
      "and here's what they shared: {{3}}. Open your Leads at {{4}} to see everything and reply.",
    status: 'approved',
  },

  // ── TDW_06/07 THE OOW COMPLETION · M2 — THE CONTENT-CARRYING REPLY ────────
  // AUTHORED FROM THE WIRE WITNESS AND NO OTHER SOURCE (F-08.75). Founder-
  // captured off his own Edit screen: name `tdw_enquiry_reply_couple` ·
  // English · quick-reply 「 Reply 」 · APPROVED 2026-08-11, founder-submitted.
  //
  // WHAT IT IS, AND HOW IT DIFFERS FROM THE DOORBELL. `enquiry_update_couple`
  // (above) is the DOORBELL: it tells her there IS a message and carries none.
  // This one CARRIES HIS WORDS. On a shut window the estate now has two arms —
  // the content template when the approved draft fits, the doorbell when it does
  // not — and byte ④ survives beneath both as the honest refusal.
  //
  // {{3}} IS HIS APPROVED BYTES, BYTE-EXACT. That is the equality law's true
  // object on this leg and it is asserted by a CELL, never by a sentence: the
  // template frame is META'S ENVELOPE, not the message (CE ruling, Fork 1). The
  // fit test that decides whether these bytes may ride at all lives at
  // `src/lib/vendor/relayToCouple.js`, symbol `contentFits`.
  //
  // LANE: 'vendor'. NON-NEGOTIABLE, the doorbell's own reasoning verbatim — a
  // send from the bride PNID invites her reply onto a number holding no draft,
  // and the mechanic dies silently.
  //
  // ── A NAMED §1 DIVERGENCE, RECORDED RATHER THAN "FIXED" ───────────────────
  // §1's third rule asks that no two variables be adjacent, separated by REAL
  // WORDS. `{{1}} — {{2}}` is separated by an em-dash, which is punctuation.
  // THE BODY IS NOT ALTERED HERE AND MUST NOT BE: Meta has already approved
  // these exact bytes, and a registry whose body has drifted from the filed one
  // builds a payload Meta rejects at send time (the `enquiry_alert_vendor` and
  // `vendor_welcome` comments both record that same law). The estate already
  // holds the precedent live: `enquiry_update_couple` above opens
  // 「 Hi {{1}} — your vendor {{2}} 」, the identical shape, approved and rung on
  // production. The divergence is DECLARED so it is a decision on the record
  // rather than a drift nobody noticed.
  //
  // NO BUTTON COMPONENT IS SENT for the quick-reply. Derived, not assumed:
  // `buildTemplatePayload` (below) emits a `body` component only, and
  // `enquiry_update_couple` — which carries a quick-reply 「 See the update 」 —
  // sends green through that same builder on production. A quick-reply button
  // takes no send-time parameter.
  //
  // [F-06.85: conditioned on Meta's review state. Mechanism: `isApproved`.]
  enquiry_reply_couple: {
    key: 'enquiry_reply_couple',
    name: 'tdw_enquiry_reply_couple',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name', 'vendor', 'message'],
    body:
      'Hi {{1}} — {{2}} has replied to your wedding enquiry: "{{3}}" ' +
      'Reply here to continue the conversation.',
    status: 'approved',
  },

  crew_assignment: {
    key: 'crew_assignment',
    name: 'tdw_crew_assignment',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['member', 'assignment', 'link'],
    body:
      "Hi {{1}}, you're on the crew for {{2}}. Open your crew page for the full details " +
      "and checklist: {{3}} — reply here if anything's unclear.",
    status: 'approved',
  },

  // ── THE FIFTH TEMPLATE — BLOCK 19 G1.1, F-40.21 · APPROVED, STILL DARK ────
  // ⚠ APPROVED IS NOT LIVE, AND THE SECOND GATE IS WHY.
  // Meta returned **Utility, Active** on Direct 1739793260373677, founder-
  // witnessed in WhatsApp Manager 2026-09-05. `isApproved('wedding_credit')`
  // now returns TRUE — and NOTHING SENDS, because
  // `src/lib/vendor/creditInvite.js` requires `WEDDING_CREDIT_SEND_ENABLED=1`
  // as well, and that flag is unset in every environment. Two gates that fail
  // for DIFFERENT reasons: the registry says "Meta has approved these words",
  // the flag says "we have decided to send". One of them has now moved.
  //
  // THE FLAG STAYS SHUT UNTIL R-40.16 IS SATISFIED — a relay-class send needs a
  // number that is neither a real vendor's nor a registered couple's, and the
  // estate holds none. Until the founder has one, the claim path is walked by
  // pasting the URL by hand, exactly as it is today.
  //
  // ⚠ THE CENSUS SENTENCE THIS REPLACED WAS TRUE WHEN WRITTEN AND IS NOW FALSE.
  // It read "this template does not exist on either WABA", citing G0 §3's count
  // of 26 on Direct. It does exist now. A comment that survives the fact it
  // describes is the class band 5 named, so it moves with the byte.
  //
  // THE FOUNDER SUBMITS IT FROM WHATSAPP MANAGER. Numbered steps ride the build
  // handover; this seat does not submit and does not claim it has. Until Meta
  // returns Approved on Direct 1739793260373677, the claim path is walked by the
  // founder pasting the claim URL himself, which the walk card states.
  //
  // CATEGORY IS UTILITY and that is a judgement with a known risk: F-19.07 is
  // the estate's own precedent for Meta reclassifying a Utility template as
  // MARKETING, and F-40.12 records the review-ask template being classed
  // MARKETING for a similar shape. This message is a transactional notice about
  // a specific act by a specific person naming the recipient's own role, with a
  // decline path in the body — the Utility case is real, and the risk is stated
  // in the handover rather than discovered on submission.
  //
  // THE BODY IS STRING #32, RATIFIED (R-40.18) AND BYTE-FROZEN. It is
  // transcribed from `docs/mocks/wedding-pages-mock.html`'s W4-wa frame, not
  // re-voiced. The apostrophe in `{{3}}’s` is TYPOGRAPHIC (R-40.19) and the dash
  // is an em dash; both are the ratified bytes and neither is an ascii twin.
  wedding_credit: {
    key: 'wedding_credit',
    name: 'tdw_wedding_credit',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['owner', 'role', 'wedding', 'link'],
    body:
      // ⚠ THE BODY WAS RE-AUTHORED AND RE-SUBMITTED — F-40.91.
      // The first cut opened on {{1}} and closed on {{4}}, and META REFUSES BOTH:
      // "Variables can't be at the start or end of the template." The founder hit
      // that wall in the Manager on 2026-09-05 with this exact text. A census of all
      // eighteen registered bodies found this was the ONLY violator — every older
      // template happens to open and close on prose, which is why the estate had
      // never met the rule and had no cell for it. `b54` now asserts it.
      // These are the bytes actually filed with Meta; the registry and the Manager
      // must never hold different words under one template name.
      'You’ve been credited on a wedding page. {{1}} credited you as {{2}} on ' +
      '{{3}}’s wedding page. Open {{4}} to add your name or decline — nothing is ' +
      'published under your name until you choose.',
    status: 'approved',
  },

  // ── THE SIXTH · G1.2's CONSENT ASK — DARK (master §2.2's build-dark law) ───
  // F-40.49: a page whose couple has no TDW account cannot be published under
  // R-G11c.2, and that is most of a photographer's back catalogue. This is the
  // message that reaches such a couple. Filed on Direct 1739793260373677 on
  // 2026-09-05, category UTILITY, status "In review" in the Manager at filing.
  //
  // `status: 'approved'` — Meta returned **Utility, Active**, founder-witnessed
  // 2026-09-05. The OTHER gate, `WEDDING_CONSENT_SEND_ENABLED`, remains unset,
  // so this still sends nothing. Two things move together when a send opens —
  // this line and the flag — and neither alone opens it.
  //
  // A SECOND FLAG AND NOT A SHARED ONE: vendors who were credited and couples
  // who are not on the platform are different audiences with different review
  // outcomes, so one switch governing both would mean the founder cannot open
  // the safer one without opening the other.
  //
  // ⚠ THE SEAT PREDICTED MARKETING AND WAS WRONG — recorded, not deleted.
  // Before submission this file argued the message was WEAKER on the Utility
  // test than `wedding_credit`: the recipient is not credited on the page, and
  // the act it notifies is a REQUEST rather than a completed one. F-19.07 and
  // F-40.12 were the precedents. Meta returned UTILITY on both.
  // The reasoning was defensible and the outcome refuted it, which is worth more
  // in the record than a prediction quietly removed once it failed — the next
  // seat weighing a Utility filing should know this estate's read was pessimistic
  // here, and by how much.
  //
  // THE BODY OPENS AND CLOSES ON PROSE, by rule and not by luck — see
  // `wedding_credit` above and F-40.91. It was authored this way after Meta
  // refused the first shape.
  wedding_consent: {
    key: 'wedding_consent',
    name: 'tdw_wedding_consent',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['owner', 'wedding', 'link'],
    body:
      'Your wedding page is ready to see. {{1}} has made a page for {{2}}, with ' +
      'everyone who worked it credited. Open {{3}} to have a look and choose \u2014 ' +
      'nothing is published until you say yes, and you can turn it off at any time.',
    status: 'approved',
  },

  // ── THE SEVENTH BLOCK-19 TEMPLATE — G2, R-G2.10 · THE REVIEW ASK ─────────
  // ⚠ THIS ONE ALREADY EXISTS ON THE WABA AND HAS SINCE 2026-08-28. It is the
  // first entry in this registry that was APPROVED BEFORE IT WAS REGISTERED:
  // Meta id 1713996623186968 on Direct 1739793260373677, censused in
  // docs/reports/TDW_19_G0_DERIVATIONS.md §3.1 row 3. Registering it is this
  // seat's whole job on this entry; not one byte of it is authored here.
  //
  // ── PROVENANCE: THE LEDGER, NOT A LIVE GET (G0 §3, closing paragraph) ─────
  // `docs/specs/TDW_19_P0A_LEDGER.md` B1 records the body and the button
  // VERBATIM as APPROVED, and that record — not a `fields=components` call — is
  // the authoring source, because the ledger was written at the create screen
  // with the founder watching it. Both are transcribed below character for
  // character. THE BUTTON TEXT IS `Write a Review` WITH A CAPITAL R: the
  // pre-submission draft read lowercase, Meta locked the capitalised form, and
  // the ledger's byte note says P1 authors from there.
  //
  // ── CATEGORY IS `MARKETING`, AND THAT IS THE TRUTH, NOT A CHOICE ──────────
  // Submitted UTILITY, reclassified by Meta's classifier at the create screen,
  // accepted by the founder (F-19.07, F-40.12). R-G2.10 REFUSED a fresh Utility
  // submission — the classifier has moved this shape twice now, and a third
  // attempt spends the founder's time to learn a thing the ledger already knows.
  // A registry that recorded UTILITY here would be lying about a live template.
  //
  // ── WHAT MARKETING COSTS, AND WHERE THAT COST IS PAID ────────────────────
  // A MARKETING send honours a per-recipient opt-out. The ledger's P1
  // inheritance table makes that a CONDITION, not an open question. It is NOT
  // paid here — `status` and `category` are documentation; the gate is the
  // mechanism. It is paid in `src/lib/vendor/reviewAsk.js`, which routes through
  // `sendWa` precisely so the opt-out gates run, and in the 'couple' lane this
  // delivery adds to `nudgeOptout`.
  //
  // ── LINE IS 'bride' AND IT IS DERIVED, NOT DEFAULTED ─────────────────────
  // The recipient is a COUPLE, and the couple's number in this estate is the
  // bride lane's (BRIDE_PHONE_NUMBER_ID; `resolveFrom`/`phoneNumberIdFor` in
  // sendWa.js). The doorbell templates one screen up carry `line: 'vendor'` for
  // the opposite reason, stated there: they invite a reply onto the number that
  // holds a waiting draft. Nothing waits on a review reply, and a couple who
  // answers this should land where Mira's lane already knows her.
  //
  // ── THE BUTTON IS WHY `buildTemplatePayload` GREW AN ARM ─────────────────
  // `button: { type:'url', index:0 }` below is READ BY THE BUILDER and is the
  // first entry in this file to declare one. A dynamic URL button takes a
  // send-time parameter; a quick reply does not, which is why
  // `enquiry_update_couple`'s comment ("NO BUTTON COMPONENT IS SENT") is true
  // there and does not cover this entry. See the builder at the foot of this file.
  //
  // ⚠ THE PARAMETER IS THE SUFFIX, NEVER THE FULL URL. Meta's sample field took
  // `https://thedreamwedding.in/r/k7m2qp`; the API parameter at send time is
  // `k7m2qp` alone. Sending the full URL yields
  // `https://thedreamwedding.in/r/https://thedreamwedding.in/r/k7m2qp` — the
  // ledger's AMENDMENT 1 send-shape note, named here so this entry inherits it
  // rather than discovering it on a live send. `reviewAsk.js` passes the vendor's
  // `routing_handle` lowercased and nothing else.
  //
  // [F-06.85: conditioned on Meta's review state — a MECHANICAL fact. Mechanism:
  //  `isApproved` at the bottom of this file. If Meta pauses or reclassifies it,
  //  `status` moves and the send refuses honestly with no other change.]
  review_request: {
    key: 'review_request',
    name: 'tdw_review_request',
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'MARKETING',
    variables: ['couple', 'vendor'],
    body:
      'Hi {{1}}, thank you for choosing {{2}} for your wedding. ' +
      'If you have a minute, a Google review would mean a lot to them.',
    // The URL button, as APPROVED: base `https://thedreamwedding.in/r/`, one
    // dynamic suffix. `base` is documentation — Meta holds it, the send never
    // transmits it — and it is recorded so a reader can see what the suffix is
    // appended to without opening the ledger.
    button: {
      type: 'url',
      index: 0,
      text: 'Write a Review',
      base: 'https://thedreamwedding.in/r/',
      variable: 'code',
    },
    status: 'approved',
  },

  payment_reminder: {
    key: 'payment_reminder',
    // Meta name is tdw_payment_due (NOT tdw_payment_reminder) to avoid colliding with the
    // pre-existing approved tdw_payment_reminder (4-var legacy) already on the WABA.
    // Registry KEY stays payment_reminder — callers are unaffected.
    name: 'tdw_payment_due',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['milestone', 'due'],
    body:
      "Reminder: {{1}} is due {{2}}. Reply PAID once it lands and I'll update your books.",
    status: 'approved',
  },

  demo_invite: {
    key: 'demo_invite',
    name: 'tdw_demo_invite',
    language: TEMPLATE_LANGUAGE,
    line: 'marketing',
    // Approved as UTILITY on 2026-07-19 (tightened copy held). If Meta ever reclassifies
    // it to MARKETING later, flip this to 'MARKETING' to keep the registry truthful.
    category: 'UTILITY',
    variables: ['name', 'claim_link'],
    // Tightened to earn Utility: "set up / access your account" not "explore / take a look".
    // First-person "reply here if you need any help" is Mira's voice (couple-facing agent).
    body:
      "Hi {{1}}, your demo workspace has been set up and is ready. Open it here to access " +
      "your account: {{2}} — reply here if you need any help.",
    status: 'approved',
  },

  // TDW_07 · D-6 · the sitting-one rider. The demo-lead relay: a couple enquires on a
  // demo card, and the unregistered vendor hears about it on WhatsApp with a claim link.
  // AUTHORED AND SUBMITTED IN SITTING ONE regardless of phase progress, because Meta's
  // approval latency must never sit on P5's critical path (P-06.T clause 5, the same
  // reason all six Block 05 bodies were filed same-day).
  //
  // TRANSPORT: submitted to META, not Twilio. The spec's D-4/P5 wording ("submitted to
  // Twilio same day") predates P-06.T and the CE-36 seal and is HISTORICAL — Twilio is
  // fallback-only at zero balance, and M2b deleted the transport outright (CE-62).
  //
  // LINE: 'marketing' — it is outreach to a business that has not signed up. It rides
  // MARKETING_PHONE_NUMBER_ID via sendWa's phoneNumberIdFor (sendWa.js:128) and is
  // therefore subject to the STOP gate and the 25/day marketing governance, per spec §3.
  //
  // CATEGORY 'UTILITY' follows the demo_invite precedent (:97 above), which cleared as
  // UTILITY on 2026-07-19 with "set up / access your account" phrasing: this body is the
  // same shape — an account that exists, an enquiry that is waiting, a link to reach it.
  // If Meta reclassifies it MARKETING, flip this one field to keep the registry truthful
  // (the demo_invite comment records that same escape hatch).
  //
  // COMPLIANCE, checked against docs/TEMPLATES.md §1 line by line: variables numbered
  // 1..3 with no gaps · the body neither BEGINS nor ENDS with a variable · no two
  // variables adjacent · single line, no '\n' anywhere. The spec's draft body opened on
  // {Name} and would have been filed against our own rule; the founder's veto took
  // draft (a), which does not.
  //
  // STATUS 'pending' — HONEST. Meta has not spoken. sendWa's gate is `isApproved`
  // TDW_07 P2 — META HAS SPOKEN. Approved 2026-07-29 ~17:31 UTC, category UTILITY
  // RETAINED (dashboard state "Active – Quality pending"; the quality tag is merely
  // unsent-yet and is not an approval condition). `status` flips to 'approved' below and
  // `sendWa`'s gate now PASSES this template. The category byte is untouched, as ruled.
  // The registry still never claims a review outcome it has not been told — it was told.
  // [F-06.85: conditioned on Meta's review state; mechanism = isApproved.]
  demo_lead_alert: {
    key: 'demo_lead_alert',
    name: 'tdw_demo_lead_alert',
    language: TEMPLATE_LANGUAGE,
    line: 'marketing',
    category: 'UTILITY',
    variables: ['name', 'month', 'claim_link'],
    // FOUNDER-VETOED 2026-07-29, draft (a), verbatim 「 1. the first one 」.
    body:
      "Hi {{1}}, a couple just asked about your work for their {{2}} wedding on The Dream " +
      "Wedding. Their enquiry is waiting in your ready account: {{3}} — reply here if you " +
      "need any help.",
    status: 'approved',
  },

  // ── M-LEADGATE-A · R-36.8 — THE BASIC-TIER ENQUIRY CARRIER ─────────────────
  // The out-of-window leg of the redaction policy. A basic vendor whose 24h
  // window is closed hears that an enquiry exists, for which month, and where to
  // open it — and NOTHING about who she is.
  //
  // ── PROVENANCE: AUTHORED FROM THE WIRE PASTE ALONE (F-08.75, ABSOLUTE) ─────
  // Founder's WhatsApp Manager witness, 2026-08-24. Meta id 966395332526543,
  // status `Active – Quality pending`, category MARKETING, English. `Active` is
  // the approval state; `Quality pending` is the quality RATING, a separate axis
  // that does not gate sending — hence `status: 'approved'` below, which is the
  // only value `isApproved` accepts.
  //
  // NO BUTTON COMPONENT — founder-confirmed against the body preview, and
  // consistent with both his screenshots. `buildTemplatePayload` emits a body
  // component only, so this entry needs no capability it does not already have.
  // The conditional scope grant for button support DID NOT FIRE.
  //
  // ══ THE TRAILING `"` IS REAL, IS APPROVED, AND MUST NOT BE "FIXED" [F-08.104]
  // The body below ends with a stray double-quote. It is not a transcription
  // slip: Meta's own character counter reads 127, and the body without that
  // quote is 126. Two instruments with different failure modes agree, and one is
  // Meta's. It renders on the live template card, so it is in the APPROVED
  // artefact and it reaches vendors' handsets.
  //
  // AND THE OBVIOUS FIX IS A TRAP. docs/TEMPLATES.md:19 states the house rule:
  // NO BODY BEGINS OR ENDS WITH A VARIABLE. Delete the quote and this body ends
  // with `{{3}}` — in breach of the rule that exists because Meta rejects that
  // shape. The stray character is accidentally load-bearing.
  //
  // So the cure is a REAL trailing clause, never a deletion — e.g.
  // `... see more: {{3}} — reply here if you need any help.` (already Mira's
  // approved voice on demo_invite, TEMPLATES.md §6). That edit re-submits the
  // template to review, which drops it out of `Active`, and `isApproved` at the
  // foot of this file tests exactly that — so the OOW leg would refuse every
  // basic alert until re-approval. IT RIDES ITS OWN MICRO, AFTER THE WALK.
  lead_alert_basic: {
    key: 'lead_alert_basic',
    name: 'tdw_lead_alert_basic',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'MARKETING',
    // Pinned by ruling as the SURVIVING-FIELD SET, and the wire matches it
    // exactly: {{1}} the VENDOR'S OWN name (never hers), {{2}} the month phrase,
    // {{3}} the leads link. Not one variable carries identity.
    variables: ['vendor_name', 'month', 'leads_link'],
    body:
      "Hi {{1}}, a couple just asked about your work for their {{2}} wedding on The " +
      "Dream Wedding. Open your Leads to see more: {{3}}\"",
    status: 'approved',
  },

  // ── TDW_07 P5 · F-07.40 — THE VENDOR-LANE ENQUIRY CARRIER ──────────────────
  // RE-DERIVED AT 9b84c6d (this sitting, by command against this registry, not
  // carried from the prior sitting's claim). The vendor line's approved set is
  // exactly three, and NOT ONE of them can honestly carry a new enquiry:
  //   morning_nudge_vendor — "Good morning {{1}}. Here's your day: {{2}}." claims
  //     a morning that is not happening, AND carries "Reply STOP MORNINGS to
  //     pause these updates". Wearing it would let a vendor who paused MORNINGS
  //     silently lose his ENQUIRY ALERTS. That is worse than the gap it fills.
  //   crew_assignment — "you're on the crew for {{2}}" claims a crew.
  //   payment_reminder — "{{1}} is due {{2}}" claims a payment.
  // All three rejected as costume, twice now, by two independent derivations.
  //
  // FILED AND APPROVED. The founder filed it 2026-07-31 and Meta returned
  // ACTIVE the same day (WhatsApp Manager, template_details for
  // tdw_enquiry_alert_vendor: "Active – Quality pending", Utility, English —
  // founder screenshot on the chat record). "Quality pending" is the QUALITY
  // RATING, not the review state; Active is the approval. So this ships
  // 'approved' and sendWa's gate now PASSES it: an out-of-window vendor is
  // reached by template instead of being a logged gap.
  //
  // The body below is BYTE-IDENTICAL to what was filed — verified against the
  // founder's own screenshot, which renders it with the review samples
  // substituted ("Hi Swati, ... from Priya ... /vendor/leads"). A registry whose
  // body has drifted from the filed one builds a payload Meta rejects at send
  // time, which is why this is checked rather than assumed.
  //
  // NAMED RESIDUAL, NOT DERIVED: the WABA language code. Meta's UI says
  // "English", which is ambiguous between 'en' and 'en_US'. TEMPLATE_LANGUAGE
  // defaults to 'en' and demo_lead_alert sends live on that same value, which is
  // the strongest evidence available without the API — but it is evidence about
  // a DIFFERENT template. If the first real send returns a Meta 132001
  // (template name/language mismatch), the language is the suspect and
  // WA_TEMPLATE_LANGUAGE is the one-env-var cure.  //
  // Shaped to docs/TEMPLATES.md §1: single line, no adjacent variables, none at
  // body start or end. Deliberately parallel to demo_lead_alert so a vendor who
  // is prospected and then joins reads one product, not two.
  //
  // [F-06.85: conditioned on a MECHANICAL fact — Meta's review state for
  //  tdw_enquiry_alert_vendor. Mechanism: isApproved at the bottom of this file.
  //  When that fact moves, this paragraph and `status` are re-read together.]
  enquiry_alert_vendor: {
    key: 'enquiry_alert_vendor',
    name: 'tdw_enquiry_alert_vendor',      // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name', 'bride', 'link'],
    // DRAFTED BY THE RETIRED SEAT, carried forward VERBATIM per the chair's
    // ruling; routes to the founder's veto and files with Meta immediately.
    body:
      "Hi {{1}}, a new enquiry just came in from {{2}} on The Dream Wedding. Open your " +
      "Leads to see the details: {{3}} — reply here if you need any help.",
    status: 'approved',
  },

  // ── TDW_14 D-2 · C-6 — THE CIRCLE LANE'S FIRST CONTENT TEMPLATE ─────────────
  // AUTHORED FROM THE WIRE, NOT FROM THE DRAFT (F-08.75, absolute). The body
  // below was transcribed from the founder's own handset render of a live send
  // and cross-checked against the WhatsApp Manager preview — never from the
  // sheet the copy was vetoed on. A registry whose body has drifted from the
  // filed one builds a payload Meta rejects at send time; enquiry_alert_vendor's
  // comment says the same thing one entry up, and this entry obeys it.
  //
  // ── THE WIRE WITNESS ────────────────────────────────────────────────────────
  //   Meta template ID  2069520823656352 · Utility · English
  //   Dashboard state   "Active – Quality pending", 2026-08-13 (founder screen).
  //                     "Quality pending" is the QUALITY RATING, not the review
  //                     state — Active is the approval. Same reading as
  //                     enquiry_alert_vendor's; the distinction has now been
  //                     misread once in this estate's history and twice read
  //                     correctly, so it is written down again here.
  //   Live send         PNID 1193630900506451 (the BRIDE lane — the circle rides
  //                     it, per TEMPLATES.md §7.1) → +918757788550, accepted with
  //                     wamid.HBgMOTE4NzU3Nzg4NTUwFQIAERgSNjY2MTMxNzg0MkRDNDEwQ0FEAA==
  //   Delivery          bride-webhook status callbacks sent · delivered · read.
  //   Render            witnessed on the handset; see the slot-order note below.
  //
  // ── WHY `variables` IS IN THIS ORDER, AND HOW WE KNOW ──────────────────────
  // PARAMETERS ARE POSITIONAL AND META ONLY COUNTS THEM. A payload whose three
  // values are correct but ordered wrong is ACCEPTED, returns a wamid, delivers
  // cleanly, and reads "Hi <bride>, your place in <invitee>'s wedding circle" —
  // wrong, silently, on a real invitee's phone. No API response can catch that.
  // The order below is not inferred from the filing form: it is READ OFF THE
  // DELIVERED MESSAGE, which rendered "Hi Mehek, your place in Dev Test 23's
  // wedding circle …" for parameters sent as [Mehek, Dev Test 23, <link>].
  //
  // ── COPY PROVENANCE — the refusal is part of the record ────────────────────
  // The FIRST draft ("your invitation to join {{2}}'s wedding circle … is still
  // open. Tap here to set up your access") was refused by Meta's pre-submission
  // classifier as MARKETING, verbatim: "This message template will be rejected."
  // Three signals, each visible in hindsight: "invitation" is an OFFER; "is still
  // open" is URGENCY; "set up your access" implies the recipient HAS NOTHING YET.
  // Meta's own dialog defines Utility as messages about "an existing order or
  // account", and all three approved UTILITY bodies in this file obey that
  // literally — demo_invite ("has been set up and is ready"), vendor_welcome
  // ("has been created"), enquiry_alert_vendor ("just came in"): each asserts in
  // PAST TENSE a thing that already exists, then names the action servicing it.
  // vendor_welcome's own comment records this identical failure one template
  // earlier. The precedent was in this file and the executor read past it.
  //
  // The cure is TRUTHFUL rather than merely compliant, and the distinction is the
  // point: `invite_circle_member` writes the circle_members row — her name, her
  // role, her token — at the moment the bride invites. So "your place … has been
  // created" asserts a record that GENUINELY EXISTS at send time. The template
  // name moved with the body (tdw_circle_invite_reminder → tdw_circle_place_ready)
  // because "invite" was doing part of the damage.
  //
  // ── [F-14.6] THE WINDOW SIGNAL ON THIS LANE IS A TRAP — READ BEFORE SENDING ─
  // Any future caller of this key MUST derive last-inbound from `messages`.
  // `conversations.last_message_at` is bumped by COPLANNER WEB SENDS
  // (src/api/circle/messages.js — the thread write and the bump), so supplying it
  // to sendWa as the window signal claims an open 24h WhatsApp session because
  // somebody typed in a browser. sendWa refuses to guess (WaWindowUndeterminedError);
  // it must not be taught to guess wrong. CE-212 §⑤ binds every new send site at
  // birth and this is its circle specimen.
  //
  // ── [F-14.7] THE MEMBER'S STOP IS HALF-ARMED, AND THE CURE IS RULED ────────
  // [F-06.85: conditioned on machinery that does not exist yet, and naming it.]
  // A circle member has no opt-out row of her own and cannot make one. FULL STOP
  // (prospects.state='opted_out') is phone-keyed and consulted on every send, so
  // it blocks her ONLY IF her phone already exists as an opted-out prospect row —
  // and no circle path anywhere creates one. NUDGE-CLASS (nudge_optout) is
  // lane-scoped to 'bride'|'vendor', so a member's pause would also silence her
  // bride-lane morning nudge.
  //
  // RULED (CE-32, at this template's filing): a STOP lands on the LANE IT WAS
  // SAID IN — a member's stop silences circle-lane outbounds to her and touches
  // nothing else. The cure is `nudge_optout`'s lane vocabulary widened with
  // 'circle' at its one home (_assertLane widened with it), consulted at every
  // circle send site AT BIRTH. Minting a prospects row for a member was REFUSED:
  // a wedding guest must never enter the marketing lane's terminal register.
  //
  // THIS ENTRY SHIPS NO CALLER (CE-32 ruling ③ — D-2 stops at filing; a reminder
  // cron for a population of one member is scope wearing a uniform). The cure
  // above therefore has nothing to attach to yet. IT IS OWED BY THE FIRST
  // DELIVERY THAT SENDS THIS TEMPLATE. RE-READ THIS PARAGRAPH THEN.
  circle_place_ready: {
    key: 'circle_place_ready',
    name: 'tdw_circle_place_ready',        // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-13
    language: TEMPLATE_LANGUAGE,
    line: 'bride',                         // the circle rides the bride number (TEMPLATES.md §7.1)
    category: 'UTILITY',
    variables: ['invitee', 'bride', 'link'],   // ORDER PROVEN BY THE RENDER — see above
    body:
      'Hi {{1}}, your place in {{2}}\'s wedding circle on The Dream Wedding has been ' +
      'created. Open it here to complete your setup: {{3}} — reply here if you need any help.',
    status: 'approved',
  },


  // These carry the login / PIN-reset / circle-join one-time codes over the Meta
  // transport. At M2b (CE-62, founder gate (ii)) they became the ONLY OTP path: the
  // OTP_WA_NUMBER Twilio fallback was deleted, so a lane with no PNID now throws rather
  // than degrading to a second transport (see src/lib/otpSend.js).
  //
  // AUTHENTICATION templates are SPECIAL (verified against Meta's authentication-message
  // spec, 2026-07): the body text is Meta-PRESET and not author-editable — the business
  // supplies ONLY the one-time code (the {{1}} body variable) plus optional add-ons
  // (security-recommendation line, expiry footer, the OTP button). So the brand words
  // ("Dream Wedding" / "DreamAI") CANNOT live in the template body — brand is carried by
  // the sending phone number's WhatsApp display name, NOT the copy. Functionally ONE auth
  // template could serve all five sites; the five keys below are registered per-site for
  // clean per-site tracking + founder veto, and MAY be collapsed by the founder to fewer
  // WABA templates (point several keys at one `name`). FOUNDER FILES + APPROVES ON THE
  // WABA AND SETS THE FINAL NAMES; the `name`s below are PROPOSED (tdw_ convention) and
  // overridable in one line. `status` starts 'draft'; the founder flips each to 'approved'
  // after Meta approves (same convention as the six above). The Meta OTP send is gated on
  // the lane's *_PHONE_NUMBER_ID (see otpSend.js), so these stay dormant until cutover.
  //
  // PROPOSED preset add-ons (FOUNDER VETO — filed on the WABA, not shipped as copy here):
  //   • add_security_recommendation: true   → "For your security, do not share this code."
  //   • code_expiration_minutes: 5          → "This code expires in 5 minutes." (matches OTP_TTL_MS)
  //   • OTP button: COPY_CODE, text "Copy Code"
  //
  // `variables: ['code']` documents the single body variable; auth payloads are built by
  // buildAuthTemplatePayload() (below), which ALSO threads the code into the OTP button.
// ── F-10.42 SETTLED · THE STATUS FIELD WAS INERT ON THIS FAMILY, NOT STALE ────
// The registry carried `status: 'draft'` on all five AUTHENTICATION templates
// while vendors and couples demonstrably logged in every day. The obvious reading
// — "the field is stale" — was wrong in a way that mattered, and the call graph
// says why:
//
//     otpSend.js  ->  templates.buildAuthTemplatePayload  ->  metaCloud.sendMetaTemplate
//
// `buildAuthTemplatePayload` (this file, at the bottom) gates on
// `category === 'AUTHENTICATION'` and on a non-empty code. IT NEVER READS
// `status`. And `isApproved` has exactly ONE true caller estate-wide —
// src/lib/sendWa.js, symbol sendWa — which the OTP path never routes through;
// otpSend.js's own header states that bypass is STRUCTURAL and deliberate
// (AUTHENTICATION templates are opt-out-exempt). So nothing on the OTP path ever
// consulted these five fields. They were not lying about Meta; they were
// unread.
//
// THE FLIP IS A TRUTH REPAIR WITH ZERO BEHAVIOURAL EFFECT, and that is exactly
// why it was worth doing rather than leaving: P4 builds the registry's runtime
// twin, and a twin born reading `draft` on five live templates would have been
// born lying. All five carry the in-file witness one line up — FOUNDER-FINAL on
// the WABA, Meta-witnessed 2026-08-04 — which is the evidence the flip stands on.
//
// [F-06.85: this paragraph is conditioned on MECHANICAL facts — the call graph
//  and Meta's review state. Mechanisms: `buildAuthTemplatePayload` below, and
//  `isApproved` below. If either grows a status read, this paragraph is re-read.]
// CITATION-NEEDS-A-CELL's cousin, minted with this flip: a status field ships with
// a cell asserting it, or it is prose. See scripts/b10_p3_mint_deck_bench.js §6.
  couple_login_otp: {
    key: 'couple_login_otp',
    name: 'tdw_couple_login_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',  // preset, not author-editable
    status: 'approved',   // F-10.42, see the AUTHENTICATION note above

  },

  couple_reset_otp: {
    key: 'couple_reset_otp',
    name: 'tdw_couple_reset_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'approved',   // F-10.42, see the AUTHENTICATION note above
  },

  circle_join_otp: {
    key: 'circle_join_otp',
    name: 'tdw_circle_join_otp',           // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'bride',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'approved',   // F-10.42, see the AUTHENTICATION note above
  },

  vendor_login_otp: {
    key: 'vendor_login_otp',
    name: 'tdw_vendor_login_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'approved',   // F-10.42, see the AUTHENTICATION note above
  },

  vendor_reset_otp: {
    key: 'vendor_reset_otp',
    name: 'tdw_vendor_reset_otp',          // FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'AUTHENTICATION',
    variables: ['code'],
    body: '[Meta preset auth body] {{1}} is your verification code.',
    status: 'approved',   // F-10.42, see the AUTHENTICATION note above
  },
  // ── TDW_10 ADMIN P3 · R-P3.3 — THE WELCOME, WIRED AND DARK ──────────────────
  // Ships at 'draft' DELIBERATELY. The founder files this with Meta by hand in
  // Business Manager (the tdw_enquiry_brief_vendor precedent) and flips this one
  // field when Meta approves — no code push, no redeploy. Until then sendWa's
  // isApproved gate refuses the send and the mint's success card renders the
  // refusal in words. A button that pretended to send would be worse than no
  // button; a button that refuses honestly is the F-08.17 shape, already proven.
  //
  // ONE VARIABLE, and the reason is copy law rather than taste: a second variable
  // reading "Your account manager is {{2}}" would name either a persona — never
  // permitted in a vendor-facing byte — or a human who does not exist. The clause
  // died with the variable (chair copy ruling, founder-vetoed 「 2-all ok 」).
  //
  // BODY SHAPE, against docs/TEMPLATES.md §1: single line, no variable adjacent to
  // another, none begins or ends the body. UTILITY is the honest category — this
  // is transactional notice that an account the founder just created exists.
  vendor_welcome: {
    key: 'vendor_welcome',
    name: 'tdw_vendor_welcome',
    language: TEMPLATE_LANGUAGE,
    line: 'vendor',
    category: 'UTILITY',
    variables: ['name'],
    // ── THE BODY MOVED AT FILING TIME, AND THIS FIELD MOVES WITH IT ──────────
    // The drafted body read: "Hi {{1}}, your Dream Wedding account is ready. Reply
    // here and I'll set up your profile so couples can find you." META'S OWN
    // CLASSIFIER REFUSED IT as Utility before submission — 「 Category does not
    // match … this message template will be rejected 」 — because 「 so couples can
    // find you 」 is a BENEFIT CLAIM, and a benefit claim reads as Marketing no
    // matter which category is ticked.
    //
    // The estate had already solved this once. `demo_invite` above earned Utility
    // by tightening to "set up / access your account" rather than "explore / take
    // a look", and its comment says so. This body follows that precedent: it names
    // an account that EXISTS and the action that services it, and promises nothing.
    // Founder-filed 2026-08-06, In review at filing.
    //
    // THIS FIELD IS DOCUMENTATION, NOT THE WIRE — buildTemplatePayload sends name,
    // language and the variable — so a divergence breaks nothing today. It is
    // corrected because P4 builds this registry's runtime twin, and a twin born
    // describing a sentence Meta does not hold is born lying.
    body:
      'Hi {{1}}, your Dream Wedding vendor account has been created. ' +
      'Reply here to complete your account setup.',
    // ── APPROVED. THE ONE FIELD, ON META'S WORD (2026-08-06) ─────────────────
    // WhatsApp Manager, template_details for tdw_vendor_welcome:
    // "Active – Quality pending", Utility, English, updated 6 Aug 2026 —
    // founder screenshot on the chat record. "Quality pending" is the QUALITY
    // RATING, not the review state; ACTIVE is the approval. That reading is not
    // new here: it is the estate's own precedent, established for
    // tdw_demo_lead_alert (TDW_07 P2) and restated for tdw_enquiry_alert_vendor
    // above, both of which shipped 'approved' from the identical dashboard state.
    //
    // WHAT THIS ONE WORD DOES. `sendWa`'s gate reads `isApproved` and nothing
    // else, so this flip is the ENTIRE difference between the mint's Send welcome
    // refusing and sending. No code path changed; the dark lane went live because
    // the registry stopped saying no. That is the shape the wired-and-dark design
    // was for — the founder files, Meta rules, one field moves, no redeploy of
    // logic.
    //
    // THE BODY ABOVE IS BYTE-IDENTICAL TO WHAT WAS FILED, verified against the
    // founder's screenshot, which renders it with the review sample substituted
    // ("Hi Swati, your Dream Wedding vendor account has been created. Reply here
    // to complete your account setup."). A registry whose body has drifted from
    // the filed one builds a payload Meta rejects at send time.
    //
    // [F-06.85: conditioned on Meta's review state — a MECHANICAL fact.
    //  Mechanism: `isApproved` at the bottom of this file. If Meta ever pauses or
    //  reclassifies this template, this word moves back and the mint's card
    //  returns to its honest refusal with no other change.]
    status: 'approved',
  },

};

// ── helpers ────────────────────────────────────────────────────────────────

function getTemplate(key) {
  return TEMPLATES[key] || null;
}

function isApproved(key) {
  const t = TEMPLATES[key];
  return !!t && t.status === 'approved';
}

// Build the Meta Cloud API `template` payload body from ordered vars.
// vars may be an array (positional) or an object keyed by the semantic variable names.
// Throws a RangeError if the count doesn't match the template's declared variables —
// a caller must supply exactly one value per {{n}}.
//
// ── G2 · THE URL-BUTTON ARM (R-G2.6) ───────────────────────────────────────
// This builder emitted a BODY COMPONENT AND NOTHING ELSE for its whole life, and
// that was correct for sixteen entries: fifteen carry no button, and the two
// quick replies (`enquiry_update_couple`, `enquiry_reply_couple`) take no
// send-time parameter — a fact their own comments derive from a live green send.
//
// A DYNAMIC URL BUTTON IS THE FIRST SHAPE THAT DOES. `tdw_review_request` is
// approved with `base + {{1}}`, and Meta requires its suffix as its own
// component. Without this arm the send omits it and the template's one call to
// action goes nowhere.
//
// ⚠ IT IS OFF BY CONSTRUCTION FOR EVERY ENTRY THAT DECLARES NO BUTTON. The arm
// is gated on `t.button`, which exactly one entry has. Sixteen payloads are
// byte-identical before and after this change, and that is asserted by a cell
// that snapshots all seventeen rather than by this sentence
// (`scripts/b55_g2_reviews_bench.js` §1).
//
// THE VALUE IS THE SUFFIX. The builder does not know the base and never
// concatenates one; if a caller hands it a full URL, Meta receives a doubled
// address. `reviewAsk.js` is the only caller and it passes a routing handle.
function buildTemplatePayload(key, vars) {
  const t = TEMPLATES[key];
  if (!t) throw new RangeError(`unknown template: ${key}`);

  const declared = t.variables || [];
  let ordered;
  if (Array.isArray(vars)) {
    ordered = vars;
  } else if (vars && typeof vars === 'object') {
    ordered = declared.map((nm) => vars[nm]);
  } else {
    ordered = [];
  }

  if (ordered.length !== declared.length || ordered.some((v) => v == null)) {
    throw new RangeError(
      `template ${key} expects ${declared.length} var(s) [${declared.join(', ')}], ` +
      `got ${Array.isArray(vars) ? ordered.length : Object.keys(vars || {}).length}`
    );
  }

  // Meta payload shape: { name, language:{code}, components:[{type:'body', parameters:[{type:'text', text}]}] }
  const components = declared.length
    ? [{
        type: 'body',
        parameters: ordered.map((v) => ({ type: 'text', text: String(v) })),
      }]
    : [];

  // The button component, when and only when the entry declares one. Its value
  // is read from `vars` by the button's OWN variable name — never from the body's
  // positional list, because the button's {{1}} and the body's {{1}} are two
  // different variables that happen to share a number.
  if (t.button && t.button.type === 'url') {
    const supplied = (vars && !Array.isArray(vars)) ? vars[t.button.variable] : undefined;
    if (supplied == null || String(supplied).length === 0) {
      throw new RangeError(
        `template ${key} declares a url button and requires '${t.button.variable}' (the SUFFIX, not a full URL)`
      );
    }
    components.push({
      type: 'button',
      sub_type: 'url',
      index: String(t.button.index == null ? 0 : t.button.index),
      parameters: [{ type: 'text', text: String(supplied) }],
    });
  }

  return { name: t.name, language: { code: t.language }, components };
}

// Build the Meta Cloud API `template` payload for an AUTHENTICATION-category template.
// The one-time `code` is threaded into BOTH components Meta requires for an auth send:
//   • body   — parameter {{1}} = the code (Meta preset text renders "<code> is your ...")
//   • button — the OTP button, carrying the code so tapping it copies/autofills the code.
//
// BUTTON SHAPE (verified against Meta's authentication-message send spec, 2026-07):
//   { type:'button', sub_type:'url', index:'0', parameters:[{ type:'text', text:<code> }] }
// This is Meta's widely-documented COPY_CODE / one-tap send form. A NEWER variant exists
// for copy-code buttons — sub_type:'copy_code' with parameters:[{ type:'coupon_code',
// coupon_code:<code> }] — which some stacks now require. Which form Meta accepts depends on
// the button TYPE the founder files (COPY_CODE vs ONE_TAP). This is a READ-FIRST decision
// flagged for the chair: if the live send is rejected on the button component, flip THIS
// one function to the coupon_code form (single site). The body component is identical in
// both forms. The code NEVER appears in a log line — it travels only as these params.
function buildAuthTemplatePayload(key, code) {
  const t = TEMPLATES[key];
  if (!t) throw new RangeError(`unknown template: ${key}`);
  if (t.category !== 'AUTHENTICATION') {
    throw new RangeError(`template ${key} is not an AUTHENTICATION template`);
  }
  if (code == null || String(code).length === 0) {
    throw new RangeError(`auth template ${key} requires a non-empty code`);
  }
  const c = String(code);
  return {
    name: t.name,
    language: { code: t.language },
    components: [
      { type: 'body',   parameters: [{ type: 'text', text: c }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: c }] },
    ],
  };
}

module.exports = { TEMPLATES, getTemplate, isApproved, buildTemplatePayload, buildAuthTemplatePayload };
