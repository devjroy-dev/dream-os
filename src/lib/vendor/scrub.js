// src/lib/vendor/scrub.js
// THE PERSONA FIREWALL — one home, every caller.
//
// ── WHY THIS FILE EXISTS (F-04.38, TDW_04 B2, CE-ruled 2026-07-15) ──────────
// These two functions lived in src/api/vendor-engine/chat.js — the WEB door. But
// chat.js has a TWIN: src/lib/vendor/calendarSignals.js, the WhatsApp door's
// calendar apparatus, factored out of chat.js so "one mind, two surfaces" (its
// own header). The twin duplicates bookEvents / mutateEvents / retroLinkOnFile /
// lockstepBinderToEvent / bookingLines / mutationLines — and carried NEITHER
// firewall. `grep -c scrub calendarSignals.js` returned 0.
//
// So B1's F-04.33 cure (the render seam) and F-04.34 cure (scrub-with-witness at
// the write door) landed "at all four write sites" — all four write sites IN
// chat.js. Six more sat one file away, uncured, writing public.events.title RAW
// from the same model over WhatsApp. What was cured on one surface was uncured on
// the other, and `persona_scrub_on_write` — Block 06's live evidence feed — never
// fired there at all.
//
// The disease is old and has a name: FINDINGS_LOG #9 (2026-05-19) — a sweep that
// replaced `${API}` and missed `API +`. One shape cured, its twin missed, nine
// files, three build failures. Fourteen months later, same shape.
//
// The cure is not "remember the other file." It is: THERE IS NO OTHER FILE. The
// firewall has one home and both doors import it. Structure kills a class;
// exhortation doesn't.
//
// F-04.38's OTHER half — routing calendarSignals' writes through eventWrite — is
// BLOCK 05's (Q-B2-1, CE-ruled: exempt by ruling, not by plane, until 05 re-routes
// it with WA smokes to prove the change). This file is the scrub half only.
//
// ── PLANE ──────────────────────────────────────────────────────────────────
// scrubText is a pure string function and reaches no database at all.
// scrubForStorage takes an INJECTED supabase client and therefore has NO PLANE OF
// ITS OWN — resolvable only by caller trace (B1's ratified method; the same
// property availability.js's header documents). Its only DB reach is logActivity,
// which writes public.vendor_activity_log, never events. It cannot touch a
// calendar row on either plane.
//
// ── DISCLOSED DEVIATION FROM THE RELOCATION LAW (Q-B2-7, CE-RULED 2026-07-15) ──
// THE LAW: "the diff must show RELOCATION, NOT REWRITE. If a reviewer cannot see
// that a moved function is byte-identical to its origin, the sitting failed."
//
//   scrubText       — MOVED BYTE-IDENTICAL from chat.js:40-72. Body unchanged,
//                     comments carried whole. The law holds without adaptation.
//
//   scrubForStorage — SIGNATURE ADAPTED, ruled, and named here so no reviewer has
//                     to discover it. Origin: chat.js:272-285, `(req, value, ctx,
//                     field)`, dereferencing req.app.locals.supabase (:277) and
//                     req.vendor.id (:278), with `surface: 'pwa'` HARDCODED (:279).
//                     calendarSignals.js has no `req` — BY DESIGN ("Pure functions
//                     over an explicit (supabase, vendor, agentId, result) — no
//                     Express req", its header). A req-shaped function is
//                     unreachable from it. The ruled mechanic ("verbatim move")
//                     and the binding constraint ("both callers reach it") could
//                     not both hold; the CE ruled the law bends, STATED, never
//                     silently: "The law's purpose is reviewability, not handcuffs
//                     — a disclosed, ruled signature change serves it; a silent one
//                     betrays it."
//                     THE LOGIC IS BYTE-IDENTICAL. Three req.* dereferences became
//                     three parameters. Nothing else moved.
//
//   REJECTED, and why it matters: a `{ app: { locals: { supabase } }, vendor }`
//   shim would have preserved byte-identity — and frozen `surface:'pwa'` into every
//   WhatsApp scrub row. That is a FALSE surface in the one artifact that exists
//   because a silent fix was refused (F-04.34's witness log, Block 06's feed). It
//   would have bought the law's letter by writing a lie into the evidence. The law
//   exists to make diffs honest; that would have used it to make one dishonest.
//
// ── THE SURFACE VALUE IS NOT A CHOICE ──────────────────────────────────────
// It was read from the estate, not invented: logActivity's own signature comment
// enumerates the vocabulary — `surface, // 'whatsapp' | 'pwa'` (snapshot.js:130) —
// and src/agent/engine.js:270 already writes `surface: 'whatsapp'` from this very
// WhatsApp door. Callers pass it; this file never guesses it.

'use strict';

const { logActivity } = require('./snapshot');

// ── TDW_06 F-06.9 — THE ID FLOOR (CE-ruled 2026-07-18) ──────────────────────────
// A floor UNDER the speaker soul, the way this firewall floors persona NAMES. The soul
// already forbids it — harveySoul:152, "his records you speak of by their names as they
// are shown … never by an internal key or code … a counsel who quotes reference numbers
// at his owner has mistaken the cabinet for the conversation." But a soul is held by a
// model, and the live specimen showed a Haiku-Victor speaking a raw id outward anyway. So
// the wire gets a mechanical floor the model cannot miss: a record/lead id is estate
// machinery, never a referent the owner reads — the NAME-AS-SHOWN carries the referent.
//
// MINT (CE-ruled): the id is STRIPPED to NOTHING — bracket and all. A placeholder token
// ("[id]", "#ref") would re-introduce the very machinery this floor removes.
//
// PATTERN — TWO SHAPES, and why (F-06.9 uuid floor + F-06.15 short-id floor):
//   (1) uuid (8-4-4-4-12 hex) — the id shape PRODUCTION's own estate emits: records/leads
//       carry uuid primary keys, and donnaFind renders them as `[<uuid>] …`. F-06.9's floor.
//   (2) the short id `(?:lead|conv|msg|rec|ev)-<digits>` — F-06.15 (CE-ruled 2026-07-19).
//       F-06.9 dropped this shape "as a dead defensive regex — that shape does not occur in
//       the estate (grep-confirmed)." The grep was right about PRODUCTION's OWN rendering
//       (uuid), and wrong about the WIRE: the floor exists precisely because a MODEL holds
//       the soul, and the DeepSeek lanes emit exactly this short shape in outward prose —
//       live specimens `rec-34` (L2 SD-WEEK), `lead-33` (L3 SD-C1), `rec-42` (L3 SD-C5),
//       raw in the vendor-facing reply. A model-emitted id-shape is not less of a leak for
//       never having come off the estate's own renderer, and "the estate doesn't render it"
//       was never the question — "can it ride the wire" is, and it did. So the floor covers
//       the shape the SPEAKER GREP itself already names a raw id (`\b(?:lead|conv|msg|rec|ev)
//       -\d+\b`, b06_gauntlet's §2.3 witness) — the floor and the witness now agree, byte for
//       byte, instead of the witness convicting a shape the floor let through. Collision-safe
//       on the wire: no vendor-facing date, Rs figure, or phone number carries a `word-digits`
//       shape with one of these five machinery prefixes.
//
// DELTA-SAFE: scrubText runs per streaming victor_token beat, so this NEVER trims or
// collapses whitespace globally (that would eat inter-token spaces on the stream). It
// consumes at most one hugging space around a bracketed id and leaves the rest untouched.
// Granularity is the persona firewall's own: an id split ACROSS two deltas slips this
// beat exactly as a split "Donna" would — the same disclosed residual, not a new one.
const _UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
// F-06.15: the machinery short-id shape the models emit outward — the SAME family the
// speaker grep counts as a raw id, so the floor strips exactly what the witness convicts.
const _SHORTID = '(?:lead|conv|msg|rec|ev)-\\d+';
const BRACKET_UUID_RE = new RegExp(' ?\\[\\s*' + _UUID + '\\s*\\][ \\t]?', 'gi');
const BARE_UUID_RE = new RegExp(_UUID, 'gi');
const BRACKET_SHORTID_RE = new RegExp(' ?\\[\\s*' + _SHORTID + '\\s*\\][ \\t]?', 'gi');
const BARE_SHORTID_RE = new RegExp('\\b' + _SHORTID + '\\b', 'gi');
function stripIds(s) {
  return String(s)
    .replace(BRACKET_UUID_RE, ' ').replace(BARE_UUID_RE, '')
    .replace(BRACKET_SHORTID_RE, ' ').replace(BARE_SHORTID_RE, '');
}

// ── Publication firewall: engine beats -> the wire names the PWA already reads ───
// The engine speaks victor_token / dispatch / donna_action / donna_report. The PWA reads
// the older Myra wire (text_delta / handoff / operator_action / operator_report), so the
// frontend stays untouched. The operator (Donna) is shown but never named; tool tokens
// collapse to a category — her name and hands never cross the wire.
function scrubText(text) {
  if (!text) return '';
  let s = String(text).replace(/\bdonna_[a-z_]+\b/gi, 'operator tool');
  // ── TDW_04 B0 seal rider — F-04.27 LAYER (ii) (CE-ruled 2026-07-15) ──────────
  // The blind `\bDonna\b -> Operator` replacement REWROTE VOCATIVES, and a rewritten
  // vocative changes who a sentence is spoken TO. Founder specimen, 2026-07-15 14:34:07
  // (engine.messages, witnessed):
  //   stored   "You've got a filing mess here, Donna. Pull the phone numbers…"
  //   rendered "You've got a filing mess here, Operator. Pull the phone numbers…"
  // Victor was delegating to Donna. The vendor read Victor telling HIM he had a filing
  // mess and asking HIM to go pull phone numbers. The copy law was satisfied — zero
  // persona strings rendered — while the MEANING inverted. A scrub that turns a wrong
  // sentence into a plausible wrong sentence is worse than one that breaks visibly,
  // because nobody notices. Same disease as F-04.21 head (a): the surface reads fine
  // and means something the system never established.
  //
  // The cure is the smallest honest form (CE-ruled): the VOCATIVE PATTERN collapses to
  // empty — the comma-clause goes with it — instead of re-addressing. A bare,
  // non-vocative mention keeps the existing replacement.
  //
  // THIS DOES NOT CURE LAYER (i). Victor still puts an internal delegation to Donna on
  // the vendor's wire; that is the speaker, and it is Block 06's (routed there, top
  // shelf, beside F-04.21's head (a)). This only stops the PRODUCT from actively
  // re-aiming his sentences at the vendor.
  s = s
    // ", Donna." / ", Donna —" / ", Donna," / ", Donna?" / ", Donna" at end
    .replace(/,\s*Donna\b(?=\s*[.,!?;:—–]|\s*$)/g, '')
    // sentence-initial "Donna, pull …" -> "Pull …"
    .replace(/(^|[.!?—–]\s+)Donna,\s*([a-z])/g, (_m, pre, ch) => pre + ch.toUpperCase());
  s = s
    .replace(/\bDonna\b/g, 'Operator')
    .replace(/\bHarvey\b/g, 'Victor');
  // F-06.9 (CE-ruled 2026-07-18): the id floor runs LAST, after the persona firewall, so
  // no raw record/lead id can ride outward prose. Under the soul, never instead of it.
  return stripIds(s);
}

// ── TDW_04 B1 SEAL RIDER — F-04.34, SCRUB-WITH-WITNESS AT THE WRITE DOOR ────
// (CE-ruled 2026-07-15, after Q-B1-11 split the census's two classes.)
//
// THE CLAUSE, final text: "Internal persona names are never stored or rendered on
// vendor planes at any layer. The vendor-facing persona name is lawful in content,
// banned in chrome. Sweeps verify storage and render separately, against this
// distinction."
//
// So substitution is the RIGHT tool here, and only because Q-B1-11 settled that
// Victor-in-storage is lawful. scrubText maps INTERNAL (Harvey/Donna) -> vendor-facing
// (Victor/Operator). The door then guarantees no internal name can land in a
// vendor-plane row, whatever the model produces.
//
// WHY A WITNESS AND NOT A SILENT FIX. A silent scrub would clean the pipe and HIDE the
// model defect — and the model defect is the real one. Founder specimen 2026-07-15
// 15:45: Victor titled the VENDOR'S OWN block "Harvey - personal unavailable",
// filling the estate's `<client> - <purpose>` client slot (cf. "Ananya - recce") with
// HIMSELF. Data stays clean; the defect stays visible. This log is Block 06's evidence
// feed — F-04.34(ii) is theirs, not this door's.
//
// The witness NEVER blocks the write: logActivity is fail-safe by contract
// (snapshot.js:112-141) and a booking must not fail because a ledger row didn't land.
//
// F-04.38: `surface` is now a PARAMETER, not the hardcoded 'pwa' of the origin —
// because this function now serves two surfaces and a witness row that names the
// wrong one is worse than no witness at all.
function scrubForStorage(supabase, vendorId, surface, value, ctx, field) {
  if (value == null) return value;
  const raw   = String(value);
  const clean = scrubText(raw);
  if (clean !== raw) {
    logActivity(supabase, {
      vendorId,
      surface,
      action:   'persona_scrub_on_write',
      summary:  `${ctx}.${field}: internal persona name scrubbed at write — model produced "${raw.slice(0, 140)}"`,
    }).catch(() => {});
  }
  return clean;
}

// ── COVERAGE MAP ───────────────────────────────────────────────────────────
// Published per the protocol candidate F-04.33 created and B2 is the first sitting
// to honour with a firewall in its charter: "any sitting that touches a firewall
// function must state the firewall's full coverage map in its handover." The map
// lives HERE, beside the firewall, because a map in a handover is a map nobody
// re-reads — a ruling with no artifact is a ruling that will be forgotten.
//
// scrubText IS applied to:
//   WEB (chat.js):            result.reply (:728) · translateBeat's victor_token and
//                             dispatch beats · bookingLines · mutationLines ·
//                             invoiceLines
//   WHATSAPP (calendarSignals.js): bookingLines · mutationLines        [F-04.38, B2]
//
// scrubText's ID FLOOR (F-06.9 uuid + F-06.15 short-id, TDW_06, CE-ruled 2026-07-18/19)
// rides EXACTLY the surfaces above — it is the last transform inside scrubText, so every
// caller of scrubText inherits it and no other. Both id shapes are stripped to nothing from
// this outward prose — a production uuid (records/leads/shelf/reviews) AND the model-emitted
// short shape `(?:lead|conv|msg|rec|ev)-NN` (F-06.15: the DeepSeek lanes' `rec-34`/`lead-33`
// specimens) — the name-as-shown carries the referent. Because it lives INSIDE scrubText, the
// NOT-applied list below is its exemption list too: a lawful id inside a nested donna_find
// hand, on the evidence plane, or on any read path is UNTOUCHED — only the outward wire is
// floored.
//
// scrubForStorage IS applied to (every public.events write these two doors make):
//   WEB (chat.js):            bookEvents insert title · insert notes · dedupe-patch
//                             notes · mutateEvents patch loop (title/notes)
//   WHATSAPP (calendarSignals.js): the same four                       [F-04.38, B2]
//
// scrubText/scrubForStorage are NOT applied to:
//   · src/agent/engine.js's own event writes (:940/:1028/:1239) — the WA engine
//     proper, Protocol §8's named file. Q-B2-6: EXEMPT BY RULING until 05/06.
//     ** THIS IS AN OPEN PERSONA-LEAK SURFACE. Named, not cured, not hidden. **
//   · bride/couple XOR paths (brideEngine.js, api/couple/events.js) — different
//     owner, out of the vendor copy law's scope.
//   · ANY READ PATH. The calendar grid, the day sheet, /api/v2/vendor/events and
//     all of B5 render events.title RAW. That is exactly why the write-door scrub
//     exists rather than a render-time one: storage is the only layer that can be
//     guaranteed once, for every reader that will ever exist (F-04.34's lesson —
//     "A4's sweep proved zero RENDERED persona strings and never checked STORAGE").
//   · engine.messages, ever. THE EVIDENCE PLANE IS NEVER SWEPT (standing rule,
//     SURFACE_TRUTH_AUDIT §3.5): it is the turn log and the trail 06 exists to
//     read. Rewriting it would destroy the record of the defect.

module.exports = { scrubText, scrubForStorage };
