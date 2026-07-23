// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/leadPings.js
// TDW_05 · F-05.50(b) — THE ENQUIRY-PING DRAIN. The reader `pending_lead_pings`
// never had.
//
// THE DISEASE (CE-68's corrected statement): a couple-side enquiry closes with the
// bride told "I've passed this to <vendor>, they'll be in touch soon!"
// (engine.js:353). The vendor's HANDSET does get the alert — sendWhatsApp fires at
// all four couple call sites (vendorInbound.js:419/:527/:630/:747). The vendor's
// ASSISTANT does not. The notice row writes sent_by:'system' into public.messages
// (engine.js:325/:418) and the engine reads engine.messages (memory.ts:93, through a
// client bound db:{schema:'engine'} at db.ts:16) — a different table on a different
// schema, so the role filter is only the second of two independent causes.
// vendorInbound.js:813 states the doctrine in the estate's own words: public.messages
// is delivery telemetry, engine.messages carries memory. So the bride's promise was
// KEPT ON THE HUMAN WIRE AND BROKEN ON THE AGENT WIRE — and a vendor replying
// "tell her we're free" handed Victor a pronoun with no referent.
//
// `pending_lead_pings` (0050) was built for exactly that referent and has had ZERO
// readers since M5 deleted the orphan that held its only drain. THIS FILE IS THE
// DRAIN. It is the READER the arc_m5 §3.1 census named as missing.
//
// SHAPE — CE-ruled R1(a), and the siting is load-bearing, not stylistic:
//   · DOOR-BUILT, not engine-built. FORCED: the engine's supabase client is bound to
//     schema 'engine' (db.ts:16) and cannot read public.pending_lead_pings at all.
//     The door holds both planes in scope (vendorInbound.js:881: vendor.id + agentId).
//     loop.ts receives an opaque string, exactly the `recentActivity` contract.
//   · The block lands in Victor's SYSTEM DYNAMIC TAIL (loop.ts, beside calBlock/
//     actBlock) — NEVER in the message stream. THIS IS THE PROVENANCE PROPERTY:
//     loop.ts:441-446 builds `vendorWords` from user-role thread messages plus the
//     message in hand, deliberately the OWNER'S words only, because F-04.70's
//     Rs 50,000 came from exactly the neighbouring blocks. A bride's rupee figure
//     riding in `bride_message` must never vouch for a write. Sited here it cannot:
//     the block is not in the corpus by construction. A bench cell asserts it.
//   · Gated on `estateInRoom` (loop.ts:255), NOT its own gate. An advisor room
//     LOSES the estate by ruling A-3 (loop.ts:246-251) precisely to remove the
//     donor pool; a ping exempted from that gate would re-open it.
//
// LIFECYCLE — CE-ruled R2 (L1): STAMP AT READ. Surfacing IS draining. The handset
// already carried the alert, so the ping's surviving job is turn-context, and a
// surfaced ping has done it. One UPDATE per turn, idempotent by construction (the
// second read inside the same window matches nothing).
//   THE NAMED COST, ACCEPTED AT R2 AND DISCLOSED HERE RATHER THAN DISCOVERED LATER:
//   a ping read on an UNRELATED turn inside its window is SPENT. If the vendor texts
//   "what's my Thursday" ninety seconds after a bride enquires, the ping surfaces on
//   that turn and is stamped; the pronoun turn that follows will not see it again.
//   (L2) — stamp on ACT — is the faithful cure to that and was rejected as exceeding
//   this micro: it needs a hook into the engine's TS tool layer and is W-1-adjacent.
//
// WINDOW: 0050's own ten minutes, unchanged. It is the PING'S freshness constant,
// not the session's. Two other instruments disagree about "a while" —
// engine.js:34 VENDOR_SESSION_IDLE_MS (10 min) and memory.ts:10 TIMEOUT_MIN
// (default 30) — two instruments serving two purposes, banked as a datum at CE-68
// and unified by nobody in this micro.
//
// MONEY: this block renders the ping's OWN columns only (CE ruling, shape (A)) — no
// join to public.leads, no budget figure. The bride's verbatim sentence is the
// block's only money, in her own words, so no second authority for one fact exists
// (the hand-vs-word divergence class). witnessLine.js's `rupees()` therefore has NO
// SUBJECT here and is DELIBERATELY NOT IMPORTED: a decorative import of a formatter
// with nothing to format is F-05.20's disease. If a future ruling puts a numeric
// budget in this block, `rupees` is exported from src/lib/witnessLine.js:295 and is
// the ONE home — never a second grouping function, never Intl.
//
// COPY: every user-visible byte below was drafted current-vs-proposed and RATIFIED
// by the founder at the veto slot (「 A, WA-only, go 」, 2026-07-24) BEFORE this file
// was written. Nothing here was minted after the word.
//
// SURFACE: the WhatsApp vendor door only, CE-ruled. The PWA door
// (api/vendor-engine/chat.js:1457/:1550) passes `recentActivity` and would pass this
// the same way — DEFERRED-NAMED, zero bytes now.
'use strict';

// 0050's own definition of "active": acknowledged_at IS NULL AND created_at within
// ten minutes. Named here so the query and the doc agree in one place.
const PING_WINDOW_MS = 10 * 60 * 1000;

// The block's fixed prose. FOUNDER-RATIFIED BYTES — do not edit without the slot.
const HEAD_1 = 'RECENT ENQUIRY — a bride has messaged about this lead in the last few';
const HEAD_2 = 'minutes. If the vendor says "her", "she", or "them" without naming';
const HEAD_3 = 'anyone, this is who he means. He has already seen the alert on his';
const HEAD_4_ONE  = 'handset — do not re-announce it, just answer what he asks.';
const HEAD_4_MANY = 'handset — do not re-announce it. MORE THAN ONE is open below: do not';
const HEAD_5_MANY = 'guess which one he means — ask him.';
// The honest null. `lead_name` is nullable and a ping carries no phone column, so
// there is nothing else truthful to call her. (A phone would be the wrong reflex
// anyway — M-4 dropped phones from the zero-match payload for its own reasons.)
const NAMELESS = '(name not given yet)';

// Age, the actBlock's arithmetic (snapshot.js:214-217).
// DISCLOSED DEVIATION: that sibling has a THIRD branch — hours, past 90 minutes —
// which CANNOT FIRE inside a ten-minute window. It is omitted rather than shipped
// dead (F-05.20's class). If the window ever widens, snapshot.js:214-217 is the
// sibling to copy WHOLE, not to re-derive.
function pingAge(createdAt) {
  const ageMin = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  return ageMin <= 0 ? 'just now' : `${ageMin} min ago`;
}

// One row -> its line(s). `bride_message` and `intent_summary` travel VERBATIM
// (founder's word: 「 i go with your recomendation 」). No clip, no clean-up, no
// re-formatting of anything inside them — a reformatted quote is not a quote.
function pingLines(row) {
  const who = (row.lead_name && String(row.lead_name).trim()) || NAMELESS;
  const out = [`- ${who} (enquired ${pingAge(row.created_at)})`];
  if (row.bride_message) out[0] += ` — her message: "${row.bride_message}"`;
  // The returning-bride continuation: the cached intent summary the notification
  // already used (engine.js:424's ping carries it), on its own line.
  if (row.intent_summary) out.push(`  — earlier: "${row.intent_summary}"`);
  return out;
}

// rows -> the block, or '' for none. ZERO-STATE IS ABSENCE: no header, no empty
// state — the actBlock's own discipline (snapshot.js:202). A header standing over
// nothing teaches the model that "recent enquiry" sometimes means no enquiry.
function formatLeadPings(rows) {
  if (!rows || rows.length === 0) return '';
  const head = rows.length > 1
    ? [HEAD_1, HEAD_2, HEAD_3, HEAD_4_MANY, HEAD_5_MANY]
    : [HEAD_1, HEAD_2, HEAD_3, HEAD_4_ONE];
  const lines = [];
  for (const r of rows) lines.push(...pingLines(r));
  return [...head, ...lines].join('\n');
}

// The drain. Reads this vendor's active pings, formats the block, and STAMPS THEM
// DRAINED (R2/L1). Returns '' on nothing and on any failure — a Victor without the
// block is diminished, not wrong, and an enquiry must never cost the vendor his
// turn (the categoryFraming fail-safe-to-null precedent, vendorInbound.js:877-879).
//
// ORDER IS DELIBERATE: format FIRST, stamp SECOND, and the stamp's failure does NOT
// suppress the block. If the UPDATE fails the ping stays open and re-surfaces next
// turn — surfacing twice is a smaller harm than losing the referent, and the warn
// says so out loud (the writers' own best-effort shape, engine.js:339).
async function fetchLeadPings(supabase, vendorId) {
  try {
    if (!vendorId) return '';
    const cutoff = new Date(Date.now() - PING_WINDOW_MS).toISOString();
    // COLUMNS WITNESSED TWICE, AGREEING: db/migrations/0050_pending_lead_pings.sql
    // :16-27 and docs/db/PUBLIC_SCHEMA.md:723-735 (9 columns). The partial index
    // idx_pending_pings_vendor_open — (vendor_id, created_at DESC) WHERE
    // acknowledged_at IS NULL, PUBLIC_SCHEMA.md:2672 — serves this predicate exactly
    // as written, which is why no migration rides this micro.
    const { data, error } = await supabase
      .from('pending_lead_pings')
      .select('id, lead_name, bride_message, intent_summary, created_at')
      .eq('vendor_id', vendorId)
      .is('acknowledged_at', null)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });
    if (error || !data || !data.length) return '';

    const block = formatLeadPings(data);

    // STAMP AT READ (R2/L1) — ONE update, every surfaced id, this turn.
    // IDEMPOTENCY IS STRUCTURAL, not a flag: the SELECT above filters
    // acknowledged_at IS NULL, so a second read inside the same window matches
    // nothing, formats nothing, and updates nothing.
    const { error: ackErr } = await supabase
      .from('pending_lead_pings')
      .update({ acknowledged_at: new Date().toISOString() })
      .in('id', data.map((r) => r.id));
    if (ackErr) console.warn('[leadPings] drain stamp failed (ping stays open, will re-surface):', ackErr.message);

    return block;
  } catch (e) {
    console.warn('[leadPings]', e.message);
    return '';
  }
}

module.exports = { fetchLeadPings, formatLeadPings, pingAge, PING_WINDOW_MS };
