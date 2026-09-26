// src/lib/vendor/relaySeat.js
// ── TDW_06 · THE HAND · SITTING TWO — THE DOOR'S RELAY SEAT ─────────────────
//
// EVERYTHING VENDOR-FACING IN THIS ARC IS COMPOSED HERE, AND HERE IS A DOOR.
//
// R-29.18 / R-29.23: the SHOW frame, the E3 confirm and every deed line are
// composed AT THE DOOR from the tools' STRUCTURED RETURNS — never voiced by a
// model. The ruling's ground is 2026-08-08 itself: a frame the model voices is a
// frame the model can paraphrase, and 「 Message is ready. Send it? 」 is the
// specimen of exactly that death — the founder approved bytes he never saw.
// QUOTED-ARTEFACT IS MECHANICAL OR IT IS NOTHING.
//
// ── WHY THIS IS ITS OWN FILE AND NOT A BLOCK INSIDE vendorInbound.js ────────
// `vendorInbound.js` is 1661 lines and is the estate's most-read door. The
// relay's composition is a self-contained function of (supabase, vendor, result,
// deps) — the same property that let the wire guard seat at both doors from one
// home. Siting it here keeps the door's diff small and gives the PWA-door parity
// micro (R-29.21, chartered) ONE home to call rather than a block to copy.
// DECLARED AS A SITING CHOICE, cheap to move, the chair's to overrule.
//
// ── R-29.22 IS VACATED AND THIS FILE IS WHY (R-29.23, chair correction №6) ──
// The deed does NOT ride `loop.ts`'s `appendDeedTail` seam. That seam annotates
// `listen_harvey_talk.result` — DONNA'S REPORT TO HARVEY — so a deed sat there
// reaches the vendor only after a model reads it and composes a sentence about
// it, which is 08-08's mechanism one field over. Two further walls, both
// derived: `RELAY_DEED_SEAM`'s bytes (`\n— from the file: `) are a
// founder-vetoed RECORD-CORRECTION register and read as nonsense on a send; and
// `b06_f0613_relay_bench.js` §2.11 asserts `!/const RELAY_DEED_SEAM/.test(loop)`,
// so a second seam constant in `loop.ts` turns a green sealed cell red.
// `src/engine/src/core/relaySeam.ts` is BYTE-UNTOUCHED by this sitting and its
// site-count comment ("`refused` is authored at TWO sites") stays true — this
// file authors no `refused` array anywhere.
//
// ── THE ELEVEN BYTES ────────────────────────────────────────────────────────
// Every vendor-facing string below is FOUNDER-VETOED, 2026-08-11, 「 approve all 」
// on the eleven-byte slate, plus 「 approve 」 on ④b at the doorbell rider's
// ruling. APPROVED-COPY-CARRIES-ITS-HASH: the veto words ride beside the
// constants so the next session inherits the RULING and not merely the string.
// Byte ids below are the slate's own numbering and are load-bearing for the
// register — do not renumber them to tidy the file.
//
// ── THE PHONE RENDERS AS THE STORED BYTE, VERBATIM (R-5, founder 「 confirm 」) ─
// `+919625759924`, not `+91 96257 59924`. His own spaced form is retired as
// placeholder shape ON HIS WORD. House precedent is verbatim rendering
// (`vendorInbound.js:863`, founder-vetoed fixed copy) and the estate holds ZERO
// phone formatters. A formatter would make the displayed phone a TRANSFORMATION
// of the stored anchor rather than the anchor itself, and would owe an inverse
// cell over both of F-06.154's stored shapes. It buys nothing the guard needs.

'use strict';

const drafts = require('./coupleDrafts');
const { relayToCouple, ringDoorbell, findOrCreateCoupleThread, coupleDisplayName,
        sendContentTemplate, contentFits } = require('./relayToCouple');

// ── THE RECIPIENT LABEL — the founder's ruling in one function ──────────────
// 「 1-yes. infact, even when name is known, phone number should be mentioned. 」
// (2026-08-11). ONE form plus its nameless fallback. The phone is the draft
// row's own `couple_phone`: NOT NULL, stored, the mechanical subject itself.
// The name is display sugar from the one-home resolver on top of it.
// ── F-06.186's CURE, LAYER ① · A NUMBER IS NOT A NAME ───────────────────────
//
// FOUNDER-WITNESSED, walk ten, 7:02pm: 「 The draft I'm holding is for
// +918595986978 (+918595986978) 」 and 「 Send this to +918595986978
// (+918595986978)? 」 — the bride addressed by her own number, twice, in one
// sentence, on the vendor's screen.
//
// THE RESOLVER IS FAITHFUL AND IS NOT THE DEFECT. `coupleDisplayName` returns
// `leads.name || null`, and the lead row for that number holds THE PHONE IN ITS
// NAME COLUMN. So a true value arrived where a name was expected and the
// nameless fallback — which the founder ruled and which reads correctly — never
// got its turn.
//
// THE GUARD IS A RENDER GUARD, DELIBERATELY. It does not repair the row and does
// not touch the store: a display fix that silently rewrites data is two changes
// wearing one name. The upstream writer is named in this delivery's handover
// with its census; every code writer passes `name` through as given, so the
// phone entered as a MODEL TOOL INPUT and its cure is out of this radius.
//
// COMPARISON IS ON DIGITS. `+918595986978`, `918595986978` and `8595986978`
// are the same human and the same non-name; `counterparty_phone` is not
// format-normalized estate-wide (F-06.154), so a literal equality check would
// pass the very shapes this exists to catch. Suffix matching in both directions
// covers the country-code variance without matching two genuinely different
// numbers that merely share a tail — the shorter must be at least 7 digits.
const digitsOf = (s) => String(s || '').replace(/\D+/g, '');

function looksLikeThePhone(name, phone) {
  const a = digitsOf(name);
  const b = digitsOf(phone);
  if (!a || !b) return false;
  // A NAME WITH LETTERS IS A NAME. 「 Priya (+91…) 」 must never be swallowed by
  // this guard, and a name that happens to contain digits is still a name.
  if (/[a-z]/i.test(String(name))) return false;
  if (a === b) return true;
  const [shortD, longD] = a.length <= b.length ? [a, b] : [b, a];
  return shortD.length >= 7 && longD.endsWith(shortD);
}

function recipientLabel(name, phone) {
  if (looksLikeThePhone(name, phone)) return `${phone}`;
  return name ? `${name} (${phone})` : `${phone}`;
}

// ── ① THE SHOW FRAME + ② THE E3 CONFIRM ────────────────────────────────────
// Rendered from the STORED `body`, read back off the row the door just wrote.
// That read-back is A1's first hop and it is why the frame cannot drift: there
// is no variable here holding a second copy of the bytes.
function showBlock(body, name, phone) {
  // ── F-06.185's CURE · THE FOUNDER'S STRIKE, EXECUTED ──────────────────────
  // 「 word for word 」 was STRUCK from every vendor-facing byte by the founder on
  // 2026-08-11 (CE-214 ④; consolidated handover §4). The strike was executed on
  // ④b-v2 — its own comment records it — and NEVER on ①, so the struck phrase
  // kept shipping and the founder read it on his own handset at walk ten, 7:01pm,
  // a day after he struck it. A ruled copy act that ships half-executed is a
  // ruling the tree does not hold.
  // NO NEW VETO IS OWED: removing the struck words is the founder's own act. The
  // remaining sentence is shown to him in the delivery's cover.
  // WHY THE PHRASE WAS STRUCK, kept here so nobody restores it as a courtesy:
  // equality between what he was shown and what she receives is A1's CELL,
  // proven by the store's own row — never a sentence promising it.
  // ── P6b (CE-45 LCV-11, 22 September 2026): THE FRAME IS THE FOUNDER'S BYTE B37, ONE HOME (doorLines.js, hash-carried) ─
  // Its last line now reads "Send this to {client} ({phone})? Reply YES or NO." (R-44.24 applied to the frame, his word "this").
  // The August bytes above it are unchanged; the phone-only shape (F-06.186) is rendered there as recipientLabel renders it.
  // Required lazily so this module's import order stays as it was (doorLines reaches back for looksLikeThePhone).
  // ONE frame in the tree: the August string is not kept as a fallback (a retired byte surviving retirement is F-06.185's class).
  return require('./doorLines').showFrame(body, name, phone);
}

// ── THE DEED LINES ─────────────────────────────────────────────────────────
// Each is a pure function of the structured return. No model prose reaches any
// of them, and none of them narrates machinery: the vendor hears the fact and
// the register (`refusal_reason`, 0118) keeps the reason.

// ③ SENT.
const sentLine = (name, phone) => `Sent to ${recipientLabel(name, phone)}.`;

// ④ WINDOW CLOSED — she has not written. POSITIVE KNOWLEDGE ONLY.
// A BYTE WITH A NAMED SUCCESSOR: when the doorbell template is mapped, ④b
// replaces this on the mapped path and ④ survives as the fallback forever —
// a doorbell that did not go never claims it did.
const windowClosedLine = (name) =>
  `Not sent. ${name || 'She'} hasn't written in over 24 hours, and I can't open a new message to her until she does. ` +
  `The draft is saved. The moment she writes, say the word and it goes.`;

// ④b-v2 THE DOORBELL RANG — FOUNDER-AUTHORED AND VETOED 2026-08-11, byte-exact.
// ④b IS RETIRED. Two things changed and both are the founder's: the 「 word for
// word 」 phrase is struck from every vendor-facing byte (equality is A1's CELL
// and stays out of every sentence), and the second affirmative is gone (R-29.35)
// — so this line no longer asks him to say anything. It promises a receipt, and
// the receipt chain below is that promise's machinery.
const doorbellLineV2 = (name) =>
  `Done. ${name || 'she'}'s been notified on WhatsApp. I'll confirm the moment it's delivered and read.`;

// №14 — the delivered receipt. ALWAYS fires: Meta sends `delivered` unconditionally.
const deliveredLine = (name, phone) => `Delivered to ${recipientLabel(name, phone)}.`;
// №15 — the read receipt. Fires ONLY when Meta sends `read`; her privacy setting
// gates it and a receipt is NEVER synthesized from a delivered.
const readLine = (name) => `${name || 'She'}'s seen it.`;

// ── ④b v1 · RETIRED IN FACT (F-06.185) ──────────────────────────────────────
// The constant lived on here after its retirement 「 kept named rather than
// deleted so the register can see the retirement rather than infer it from an
// absence 」. That reasoning is sound for a REGISTER and wrong for a TREE: the
// chair's sweep found it still carrying the founder-struck 「 word for word 」,
// which is a retired byte surviving retirement — a class above a struck phrase.
// RETIRED-COPY-LEAVES-THE-TREE is the enforcement half of
// APPROVED-COPY-CARRIES-ITS-HASH: the register remembers, the tree does not.
// Its retirement is recorded at the consolidated handover §4 (「 ④b (retired)
// doorbellLine_RETIRED_v1 — superseded 」) and its successor is `doorbellLineV2`,
// founder-authored, below. Chair-verified reader-less before removal: the only
// occurrence in `src/` was its own declaration.

// ⑤ WINDOW UNDETERMINED — we do not know, and we do not say we do.
// This is a SEPARATE byte from ④ deliberately: ④ asserts she has not written,
// and on a failed query or a thrown client that assertion would be a false
// statement of fact wearing a courteous face.
const windowUndeterminedLine = () =>
  `Not sent. I couldn't confirm whether her line is open, and I won't send blind. The draft is saved.`;

// ⑥ EXPIRED.
const expiredLine = () =>
  `That draft is more than 24 hours old, so I haven't sent it. Tell me again and I'll write it fresh.`;

// ── №16 THE EXPIRY NOTICE — FOUNDER-VETOED 「 a 」, byte-exact ────────────────
// THE ESTATE'S FIRST CLOCK-SPEAKER. Every other byte on this slate answers a
// turn: the vendor said something and the door replied. This one arrives when
// NOBODY ACTED — his doorbell rang, her 24 hours ran out in silence, and the
// message he approved is now unsendable. Without it the draft simply vanishes
// and he learns nothing, which is the silence class this whole arc was minted
// against.
//
// WHY IT IS NOT ⑥. ⑥ answers a vendor who is IN A TURN asking about a stale
// draft — "Tell me again and I'll write it fresh" is a reply. №16 is a PUSH to a
// handset with no conversation open, so it must name what happened, name who did
// not answer, and offer the two moves he actually has. The two bytes are
// siblings and neither can wear the other's clothes.
//
// THE NAME RENDERS THROUGH THE F-06.186 GUARD — a bride on file only as a phone
// number is never addressed as though the digits were her name.
//
// A BYTE NEVER PROMISES A STATE THE MACHINE DOES NOT HOLD (F-06.170). This one
// says the message "didn't go out", and the sweep stamps `expired` BEFORE it
// speaks, so the sentence is true at the instant it is uttered.
//
// ── THE SUBJECT'S RENDER, AND WHY IT IS NOT `recipientLabel` ────────────────
// The founder's vetoed byte opens on a BARE NAME — 「 Priya didn't reply… 」 — and
// the charter rules "nameless = phone". `recipientLabel` would render
// 「 Priya (+919625759924) didn't reply… 」, which is a different sentence from
// the one he approved. So the guard is applied WITHOUT the parenthetical: the
// name when it is a name, the phone when it is not, matching ④ and ④b-v2's bare
// shape rather than ①/③'s labelled one. Both shapes are already on this slate;
// this byte takes the one its own vetoed text shows.
// `looksLikeThePhone` is F-06.186's cure and is this file's own — a bride whose
// `leads.name` is her digits is never addressed as though they were her name.
function relaySubject(name, phone) {
  if (name && !looksLikeThePhone(name, phone)) return name;
  return phone || 'She';
}

const expiryNoticeLine = (name, phone) =>
  `${relaySubject(name, phone)} didn't reply to the notification, so your message didn't go out. ` +
  `Want me to write it fresh, or send her another nudge?`;

// ⑦ SEND FAILED — ONE byte for every failure mode (ruled). The WHY lives in
// `refusal_reason`; the opt-out split is on the founder's shelf, not minted.
const sendFailedLine = (name) =>
  `I couldn't send it. Nothing reached ${name || 'her'}. The draft is saved and nothing has gone out.`;

// ⑧a CANNOT REACH — HER SIDE. A fact he can act on.
const noNumberLine = (name) =>
  `I don't have a number on file for ${name || 'her'}, so there's nothing to send to. ` +
  `Send me her number and I'll write it again.`;

// ⑧b CANNOT REACH — OUR SIDE. Never dressed as ⑧a: telling a vendor his
// customer has no number when the fault is ours is a false statement of fact.
const noLaneLine = (name) =>
  `I can't send from our number right now, so I haven't tried. Nothing has gone to ${name || 'her'}. The draft is saved.`;

// ⑨ THE MISMATCHED AFFIRMATIVE — re-show, never send (R-29.19). It never
// repeats the wrong name back: repeating a wrong name is how a wrong-recipient
// send starts.
const mismatchBlock = (body, name, phone) =>
  `I haven't sent anything. The draft I'm holding is for ${recipientLabel(name, phone)}. Here it is again:\n\n` +
  `"${body}"\n\nSend this to ${recipientLabel(name, phone)}?`;

// ── BYTE №13 — the plain decline ──────────────────────────────────────────
// FOUNDER-VETOED 2026-08-11 「 approve 」. A decline NEVER deletes; the row stays.
const declinedLine = (name) =>
  `Not sent. I've dropped it. Nothing went to ${name || 'her'}. ` +
  `Tell me when you want to write to her again.`;

// ── ② THE BODY FORK ───────────────────────────────────────────────────────
// VERBATIM: the vendor gave the words, so the estate delivers HIS bytes,
// byte-exact, with zero model in the body path. COMPOSE: intent without content
// — the model still composes (the founder's 「 i want it 」 stands) but the
// ROUTING is the door's.
function verbatimBody(text) {
  const m = require('../../api/vendor-engine/chat').VERBATIM_RE.exec(String(text || ''));
  if (!m) return null;
  const body = (m[1] || m[2] || '').trim();
  return body.length >= 8 ? body : null;
}

// ══ THE RECEIPT CHAIN (R-29.35) — ④b-v2's PROMISE, MADE MACHINERY ═══════════
//
// ④b-v2 says 「 I'll confirm the moment it's delivered and read. 」 A byte never
// promises a state the machine does not hold, so here is the machine.
//
// The status webhook already receives Meta's delivered/read events and lands
// them on `messages.delivery_status` by wamid. This reads that same event and,
// when the wamid belongs to a row THIS ARC wrote (`sent_by = 'vendor_relay'` —
// the marker with exactly one writer), speaks the receipt to the vendor.
//
// №15 IS GATED BY META, NEVER SYNTHESIZED. Her read receipts can be off; a
// `read` we never received is a read that did not happen, and inferring one from
// a `delivered` would be this arc's founding disease in its smallest possible
// form. If Meta does not send it, the vendor simply never hears it.
async function relayReceipt(supabase, { wamid, status, sendWhatsApp, env }) {
  if (!wamid || !status) return null;
  const want = String(status).toLowerCase();
  if (want !== 'delivered' && want !== 'read') return null;
  try {
    const { data: row } = await supabase
      .from('messages').select('id, conversation_id, sent_by, body')
      .eq('twilio_sid', wamid).maybeSingle();
    if (!row || row.sent_by !== 'vendor_relay') return null;   // not ours; say nothing

    const { data: convo } = await supabase
      .from('conversations').select('vendor_id, counterparty_phone')
      .eq('id', row.conversation_id).maybeSingle();
    if (!convo || !convo.vendor_id) return null;

    // ── F-06.180's CURE · THE HANDSET IS RESOLVED, NOT ASSUMED ───────────────
    // This selected `phone` from `public.vendors`, WHICH HAS NO SUCH COLUMN (38
    // columns, witnessed). `vend.phone` was therefore always undefined and this
    // function returned null on every real status Meta ever sent — №14 and №15
    // have never once reached a vendor's handset. Walk nine proved it on
    // production: `status=read matched=1 sent_by=vendor_relay` matched the right
    // row and no byte left the estate.
    const { vendorHandset } = require('./vendorHandset');
    const hand = await vendorHandset(supabase, convo.vendor_id);
    if (!hand.phone) {
      // NAMED, NOT SILENT. The old `return null` is exactly why this survived
      // from seating: a receipt that declines to speak must say why, or its
      // silence is indistinguishable from "not ours" (F-06.171's law).
      console.warn(`[relay:wa] ${want}_receipt undeliverable vendor=${convo.vendor_id} reason=${hand.reason}`);
      return null;
    }

    const name = await coupleDisplayName(supabase, convo.vendor_id, convo.counterparty_phone);
    const line = want === 'delivered'
      ? deliveredLine(name, convo.counterparty_phone)   // №14
      : readLine(name);                                 // №15
    const from = (env || process.env).VENDOR_WHATSAPP_NUMBER;
    if (typeof sendWhatsApp !== 'function' || !from) {
      console.warn(`[relay:wa] ${want}_receipt undeliverable — no transport or no vendor lane`);
      return null;
    }
    await sendWhatsApp(hand.phone, line, [], from);
    console.log(`[relay:wa] ${want}_receipt wamid=${wamid} vendor=${convo.vendor_id}`);
    return { line, kind: `${want}_receipt` };
  } catch (e) {
    console.warn('[relay:wa receipt]', e && e.message);
    return null;
  }
}

// THE APPROVED LEG. One home, reached from the door's own affirmative route and
// from the SEND signal alike — so the state machine, the window question, the
// lane pin and every deed line have exactly one implementation regardless of how
// the owner's yes arrived.
async function sendApproved(supabase, vendor, draft, name, deps) {
  // `preApproved` is the auto-send path: the row is ALREADY `approved` (his E3
  // yes, held across a shut window), so re-approving it would fail the state
  // guard correctly and strand a draft he has already authorised.
  const approved = deps.preApproved ? { ok: true } : await drafts.approve(supabase, draft.id);
  if (!approved.ok) {
    console.warn('[relaySeat] approve refused:', approved.reason);
    return null;   // the state machine refused; nothing moved and nothing is claimed
  }

  // ── THE SEND. Window asked FIRST, lane pinned, return read. ────────────────
  const out = await relayToCouple(supabase, {
    vendor,
    couplePhone: draft.couple_phone,
    body: draft.body,          // THE STORED BYTES. A1's last hop — same column, same row.
    sendWhatsApp: deps.sendWhatsApp,
    env: deps.env,
  });

  if (out.ok) {
    // THE SID TO BOTH ROWS. `relayToCouple` wrote the thread row's; this writes
    // the draft row's. F-06.143's class dies by construction at this site.
    await drafts.markSent(supabase, draft.id, out.twilioSid);
    return { line: sentLine(name, draft.couple_phone), kind: 'sent', draftId: draft.id };   // ③
  }

  // ── THE WINDOW-CLOSED FORK IS ASKED FIRST (R-29.35) ───────────────────────
  // The blanket refusal below used to run BEFORE this fork, so a doorbell that
  // rang had to un-refuse the row it had just terminated. Under R-29.35 the
  // draft must SURVIVE a rung doorbell — his approval is standing and the byte
  // promises a delivery — so the fork is asked before anything is resolved and
  // only the paths that truly end here stamp a terminal.
  if (out.kind === 'window_closed') {
    // ── THE ④-FORK, NOW THREE-ARMED (TDW_06/07 · M2) ─────────────────────────
    // ORDER IS THE RULING. The CONTENT arm is asked FIRST because it is strictly
    // better for both people when it can fire: she gets his actual words instead
    // of a knock on the door, and he gets ③ instead of a promise. The doorbell
    // survives beneath it as the fallback for a draft that cannot ride the
    // envelope, and byte ④ survives beneath THAT for a doorbell that did not
    // ring. Nothing is removed; a rung arm simply stops being the only one.
    //
    // ONLY on window_closed, all three: an UNDETERMINED window falls through to
    // ⑤ untouched, because sending on a window we could not read is a message
    // sent on a guess. THIS DOOR AND THE ALERT DOOR DIVERGE HERE ON PURPOSE and
    // the reason is named at `src/lib/vendor/enquiryAlert.js` (symbol
    // `sendVendorEnquiryAlert`): there the fallback is a template, lawful in both
    // window states; here the subject is a BRIDE receiving a vendor's words, and
    // a guess about her window is not a cost this lane pays.
    //
    // THE THREAD IS RESOLVED ONCE FOR BOTH ARMS. It used to be found inside the
    // doorbell's own argument list; hoisting it means a content send and a
    // doorbell can never land on two different rows for one (vendor, phone).
    const threadId = (await findOrCreateCoupleThread(supabase, vendor.id, draft.couple_phone)).threadId;

    const fit = contentFits(draft.body);
    if (fit.fits) {
      const contented = await sendContentTemplate(supabase, {
        vendor, couplePhone: draft.couple_phone, brideName: name, body: draft.body,
        deps: { ...deps, supabase, threadId },
      });
      if (contented.ok) {
        // THE DRAFT IS SPENT. `markContentSent` stamps the `sent` TERMINAL with
        // `resolved_at` and `content:<wamid>` — R-29.35's principle running its
        // other direction: ④b-v2 promised a delivery so its draft had to live;
        // ③ says the delivery HAPPENED, so this one must not.
        await drafts.markContentSent(supabase, draft.id, contented.twilioSid);
        console.log(`[relay:oow] content_sent wamid=${contented.twilioSid || 'nosid'} draft=${draft.id}`);
        // ③, UNCHANGED AND TRUE. The template frame is Meta's envelope; his
        // words reached her, which is exactly what this byte has always claimed.
        return { line: sentLine(name, draft.couple_phone), kind: 'sent', draftId: draft.id };
      }
      console.warn('[relaySeat] content arm declined:', contented.reason);
    } else {
      console.log(`[relay:oow] content_unfit reason=${fit.reason} draft=${draft.id} — falling to the doorbell`);
    }

    // ── THE DOORBELL ARM (R-29.24 ②), unchanged beneath the new one ─────────
    const rung = await ringDoorbell(supabase, {
      vendor, couplePhone: draft.couple_phone, brideName: name, env: deps.env,
      // supabase + threadId so the doorbell's own row lands on HER thread. Walk
      // seven delivered a message to her handset the estate had no record of.
      // The id is the fork's own, hoisted above the content arm: two
      // find-or-creates in one fork is two chances to land on two rows.
      deps: { ...deps, supabase, threadId },
    });
    if (rung.ok) {
      // ⑤ THE STATE MACHINE IS UNTOUCHED — the draft is still `refused` with
      // `window_closed`, written above. The doorbell's own sid is recorded in the
      // reason so the register knows a notification went and which one.
      // ── R-29.35 · THE DRAFT STAYS APPROVED. F-06.170's principle, applied:
      // A BYTE NEVER PROMISES A STATE THE MACHINE DOES NOT HOLD. ④b-v2 promises a
      // delivery, so the draft must still be alive to deliver. His E3 approval
      // already named her and showed her phone; a shut window never invalidated
      // it, and asking for a second affirmative was the chair's own design defect
      // (correction №9). Expiry (24h) and supersede still stand, and
      // 「 cancel the <name> draft 」 revokes it — byte №13 its receipt.
      await drafts.markDoorbell(supabase, draft.id, rung.twilioSid);
      console.log(`[relay:wa] doorbell_rang wamid=${rung.twilioSid || 'nosid'} draft=${draft.id}`);
      return { line: doorbellLineV2(name), kind: 'window_closed_doorbell', draftId: draft.id };   // ④b-v2
    }
    console.warn('[relaySeat] doorbell not rung:', rung.reason);
    await drafts.refuse(supabase, draft.id, `window_closed:${rung.reason}`);
    return { line: windowClosedLine(name), kind: 'window_closed', draftId: draft.id };          // ④, the fallback
  }
  // EVERY OTHER REFUSAL IS RECORDED WITH ITS REASON (0118, R-29.20) and stamps
  // `resolved_at` through the store's single transition primitive.
  await drafts.refuse(supabase, draft.id, out.reason || out.kind);
  if (out.kind === 'window_undetermined') return { line: windowUndeterminedLine(), kind: 'window_undetermined', draftId: draft.id }; // ⑤
  if (out.kind === 'no_vendor_lane') return { line: noLaneLine(name), kind: 'no_vendor_lane', draftId: draft.id };              // ⑧b
  if (out.kind === 'no_recipient') return { line: noNumberLine(name), kind: 'no_recipient', draftId: draft.id };                // ⑧a
  return { line: sendFailedLine(name), kind: out.kind || 'send_failed', draftId: draft.id };                                     // ⑦
}

/**
 * R-29.30 — the RELAY LANE'S OWN SENTENCE for a stage-2 interception.
 *
 * Returns null when this interception is NOT the relay's business, so F3 ships
 * exactly as it does today for every filing-lane costume. Returns a
 * founder-vetoed relay byte when a draft is open: the re-show, which is the safe
 * direction R-29.19 already ruled for an affirmative that could not be honoured.
 *
 * NOTHING IS SENT AND NO STATE MOVES HERE. The interception means the model
 * claimed a deed it did not do; the draft is exactly where it was and the vendor
 * is told so with the bytes written for that fact.
 */
// ══ M3 · THE EXPIRY SWEEP — THE ESTATE'S FIRST CLOCK-SPEAKER ════════════════
//
// Everything else in this arc answers an act. A vendor spoke, a bride replied, a
// webhook landed. THIS FIRES WHEN NOBODY DID ANYTHING, and that is the whole
// reason it needs a cron rather than a call site: the fact it reports — that
// twenty-four hours passed in silence — has no event to hang on.
//
// THE RULED STATE, and each clause is asked of a ROW, never of a string
// (`doorbellExpiredUnanswered`, `src/lib/vendor/coupleDrafts.js`): the draft is
// `approved` with `resolved_at` NULL, its `refusal_reason` begins `doorbell:`
// (so the estate ACTUALLY RANG HER — an unrung draft is not a message she failed
// to answer), and `expires_at` is past.
//
// ── ORDER: STAMP FIRST, SPEAK SECOND ───────────────────────────────────────
// Deliberate, and the asymmetry is priced. Stamping first means a transport
// failure costs the vendor a notice he never hears, logged loudly. Speaking
// first would mean a stamp failure costs him the SAME notice TWICE on the next
// hour's run. This arc's standing law is that a byte which did not go never
// claims it did — it says nothing about a byte going twice, so the cheaper
// failure wins and it is named here rather than discovered at 4am.
//
// ── IDEMPOTENCE IS THE STATE MACHINE, NOT A FLAG ───────────────────────────
// The stamp moves the row out of `approved`, which is clause 1 of the reader's
// own query. A re-run cannot see it. There is no "already swept" column to drift
// from the thing it describes.
//
// ── THE ⑥-COLLISION, AND WHY ITS ASYMMETRY IS ITSELF THE CELL ──────────────
// A bride arriving AFTER expiry already produces a vendor-facing byte:
// `approvedForPhone` self-heals the row to `expired` and `coupleArrival.js`
// speaks ⑥. So two paths could in principle narrate one draft. They cannot
// collide, and the reason is directional: if she arrives first, the row is no
// longer `approved` and this sweep finds NOTHING. The benign direction is the
// only one reachable, and that fact is asserted by a cell rather than trusted.
//
// ── THE SECOND ARM, DERIVED AND DECLARED ───────────────────────────────────
// A row can be expired-and-doorbelled while she DID write — if her arrival
// failed to carry the draft for any reason. №16 must not tell a vendor she
// ignored him when she did not. Such a row is stamped in the same act with
// `expired_after_reply:<sid>` and SPEAKS NOTHING. Without this arm the sweep
// would either strand the row forever or utter a false sentence, and silence is
// the only honest third option.
//
// THE REPLY FLOOR IS THE DOORBELL'S OWN ROW when it can be resolved (its wamid
// rides in `refusal_reason`), else the draft's `created_at`. The fallback is
// CONSERVATIVE IN THE SILENT DIRECTION: an inbound between staging and the ring
// would suppress №16 that could honestly have spoken. Silence over a wrong
// sentence, declared rather than discovered.
async function relayExpirySweep(supabase, deps = {}) {
  const now = deps.now || Date.now();
  const _drafts = deps.drafts || drafts;
  const out = { scanned: 0, spoke: 0, silent: 0, undelivered: 0, reason: 'ok' };
  if (!supabase) { out.reason = 'no_supabase'; return out; }

  const found = await _drafts.doorbellExpiredUnanswered(supabase, now);
  if (found.reason !== 'ok') { out.reason = found.reason; return out; }
  out.scanned = found.rows.length;
  if (!found.rows.length) return out;

  for (const draft of found.rows) {
    try {
      const sid = String(draft.refusal_reason || '').slice('doorbell:'.length) || 'nosid';
      const replied = await brideRepliedSince(supabase, draft, sid);

      // STAMP FIRST — both arms, one act, the register distinguishing them.
      const reason = replied ? `expired_after_reply:${sid}` : `expired_no_reply:${sid}`;
      const stamped = await _drafts.markSweptExpired(supabase, draft.id, reason);
      if (!stamped.ok) {
        console.warn(`[relay:expiry] stamp refused draft=${draft.id} reason=${stamped.reason} — nothing spoken`);
        continue;
      }

      if (replied) {
        out.silent += 1;
        console.log(`[relay:expiry] silent draft=${draft.id} — she wrote after the doorbell; ⑥ is the arrival's byte, not mine`);
        continue;
      }

      const name = await coupleDisplayName(supabase, draft.vendor_id, draft.couple_phone);
      const spoke = await pushToVendor(supabase, draft.vendor_id,
        expiryNoticeLine(name, draft.couple_phone), deps);   // №16
      if (spoke) {
        out.spoke += 1;
        console.log(`[relay:expiry] notice draft=${draft.id} vendor=${draft.vendor_id} doorbell=${sid}`);
      } else {
        out.undelivered += 1;
        console.warn(`[relay:expiry] notice UNDELIVERED draft=${draft.id} vendor=${draft.vendor_id} — `
          + `the row is stamped and he has not been told`);
      }
    } catch (e) {
      console.warn(`[relay:expiry] draft=${draft && draft.id} threw:`, e && e.message);
    }
  }
  return out;
}

// Has she written since the estate rang her? The floor is the doorbell's own row
// when resolvable, else the draft's creation. Scans `couple_thread` rows for her
// phone — the vendor-lane kinds, never `couple_self`, which sits on the BRIDE
// PNID (`src/lib/vendor/coupleWaWindow.js`, symbol `VENDOR_LANE_KINDS`).
async function brideRepliedSince(supabase, draft, sid) {
  try {
    let floor = draft.created_at;
    if (sid && sid !== 'nosid') {
      // WITNESS: `## public.messages` — `twilio_sid` col 10, `created_at` col 11.
      const { data: bell } = await supabase
        .from('messages').select('created_at').eq('twilio_sid', sid).maybeSingle();
      if (bell && bell.created_at) floor = bell.created_at;
    }
    // WITNESS: `## public.conversations` — `counterparty_phone` col 4, `kind` col 5.
    const { data: convos } = await supabase
      .from('conversations').select('id')
      .eq('counterparty_phone', draft.couple_phone).eq('kind', 'couple_thread');
    const ids = (convos || []).map((c) => c.id);
    if (!ids.length) return false;
    const { data: inbound } = await supabase
      .from('messages').select('id')
      .eq('direction', 'inbound').in('conversation_id', ids)
      .gt('created_at', floor).limit(1).maybeSingle();
    return !!inbound;
  } catch (e) {
    // FAILS TOWARD SILENCE. An unreadable history is not permission to tell a
    // vendor his customer ignored him.
    console.warn('[relay:expiry] reply check threw:', e && e.message);
    return true;
  }
}

// He is not in a turn, so there is no reply to append to. The same shape
// `relayReceipt` uses for №14/№15, through F-06.180's one home: `public.vendors`
// HAS NO `phone` COLUMN, and two sites believed otherwise for the life of the
// receipt chain.
async function pushToVendor(supabase, vendorId, line, deps = {}) {
  try {
    const send = deps.sendWhatsApp;
    const from = (deps.env || process.env).VENDOR_WHATSAPP_NUMBER;
    if (typeof send !== 'function' || !from || !vendorId) {
      console.warn('[relay:expiry] undeliverable — no transport, lane or vendor');
      return false;
    }
    const { vendorHandset } = require('./vendorHandset');
    const hand = await vendorHandset(supabase, vendorId);
    if (!hand.phone) {
      console.warn(`[relay:expiry] undeliverable vendor=${vendorId} reason=${hand.reason}`);
      return false;
    }
    const out = await send(hand.phone, line, [], from);
    // THE SENTINEL, READ (F-06.146). `sendWhatsApp` refuses BY RETURN.
    if (!out || out.sent !== true) {
      console.warn(`[relay:expiry] send refused vendor=${vendorId} reason=${(out && out.blocked) || 'not_sent'}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[relay:expiry] push threw:', e && e.message);
    return false;
  }
}

// CE-45 LCV-15 LSP_3 (L3-a): the chain era's seat is DELETED from this file: runRelaySeat and its lanes (handleStage, handleSend, relayLaneLine,
// RELAY_CLAIM_RE_LOCAL), the stager (doorStage, extractRecipient, RECIPIENT_VERBS, NOT_A_NAME_RE), the pending-relay block and its law, composeBody, the
// confirm-row reader (doorAsked, RELAY_CONFIRM_SENT_BY, ASKING_KINDS, relayOutcomeAsks), the affirm and decline regexes, askWhoLine, foldName,
// PWA_RELAY_UNAVAILABLE_LINE, and the introduction signals (collectSignals, STAGE_SIGNAL, SEND_SIGNAL). No live caller reached any of them at 90f607d.
module.exports = {
  relayExpirySweep,
  expiryNoticeLine,
  relaySubject,
  looksLikeThePhone,
  relayReceipt,
  // FORK 4(b) — the auto-send's callable, extracted so the BRIDE'S lane can send
  // an approved draft without running the vendor seat on her turn (R-29.30).
  sendApprovedDraft: sendApproved,
  doorbellLineV2,
  deliveredLine,
  readLine,
  verbatimBody,
  declinedLine,
  recipientLabel,
  showBlock,
  mismatchBlock,
  sentLine,
  windowClosedLine,
  windowUndeterminedLine,
  expiredLine,
  sendFailedLine,
  noNumberLine,
  noLaneLine,
};
