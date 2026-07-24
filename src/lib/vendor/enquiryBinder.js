// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendor/enquiryBinder.js
// THE WELD (engine edition, Phase 5-B): a bride enquiry becomes a binder on the
// vendor — now in the ENGINE cabinet (engine.records), through Donna's hands.
//
// Same contract as before (dedupe by phone; return { ok, binder:{id}, deduped })
// so couple/enquire.js swaps with no caller change, and couple_enquiries.vendor_lead_id
// keeps a valid pointer (now an engine.records binder id — never a hard FK).
//
// Mirrors the door-layer transformation: executeKriyaTool(supabase, vendorId, ...)
// -> executeRecordTool(agentId, ...). The vendor is resolved to their engine agent
// via the shared bridge (same resolver the web middleware + WhatsApp use), so an
// enquiry logged by a bride and a binder logged by the vendor land in the SAME
// cabinet, the SAME shape. The marketplace is just another caller.
'use strict';

const { executeRecordTool }      = require('../../engine/dist/core/tools/recordPrimitives');
const { resolveAgentForVendor }  = require('../../api/middleware/agentBridge');
const { resolveAuthUserId }      = require('../resolveUsersId'); // ARC M3 / F-05.47

const isErr = (r) => !!r && typeof r.display === 'string' && r.display.startsWith('ERROR');

// ── BLOCK 06 M-0 · ONE REFERENT FOR THE NAMELESS DEFAULT ─────────────────────
// This string was a literal at the donna_client call below. The never-clobber
// guard on the dedupe path has to compare against it, and two copies of one
// string is how a guard silently stops guarding (the referent lesson, third
// application in this estate). BYTES UNCHANGED — this is an extraction, not a
// copy change; the veto slot stays empty.
const DEFAULT_CLIENT_NAME = 'Dream Wedding enquiry';

// Create (or find) an engine binder for an inbound enquiry on this vendor.
//   supabase, vendorId, { name, phone, note, noteIfNew, date }
// Returns { ok, binder: { id }, deduped }.
//
// ── F-05.59 CURED (C1) · `note` VS `noteIfNew`, AND WHY THERE ARE TWO ────────
// `note`      — a claim true on EVERY path. Appended whether the binder is fresh
//               or found. This is what `note` has always meant.
// `noteIfNew` — a claim true ONLY of a binder opened by THIS enquiry. Written on
//               the fresh path, SKIPPED on the dedupe path.
// The disease: the door passed "Enquiry via your TDW link. First message: …" as
// an always-note, and this function appended it on every dedupe hit — so a
// repeat enquiry stored a first-message claim about a message that was not the
// first (production specimen: binder 1e774015, the same sentence twice). The
// caller could not suppress it, because the only value that knows the answer is
// `deduped`, which this function returns and which no caller read (F-05.54).
// Splitting the parameter puts the claim under the control of the fact that
// decides it, HERE, at the one writer — rather than asking every caller to
// re-derive it. ZERO bytes of the sentence itself change.
async function enquiryToBinder(supabase, vendorId, params) {
  const { name, phone, note, noteIfNew, date } = params || {};

  // Bridge the vendor to their engine agent (one resolver, every surface).
  const { data: vendor } = await supabase
    .from('vendors').select('*').eq('id', vendorId).maybeSingle();
  if (!vendor) return { ok: false, error: 'vendor not found' };
  // ── F-05.47 CURED · THE PLANE SWAP, AND THE THROW IT BECAME ───────────────
  // THIS LINE READ: resolveAgentForVendor(supabase, vendor, vendor.user_id).
  // `vendors.user_id` is a public.users.id. The bridge writes whatever it is
  // handed into engine.users.auth_user_id, which carries a FOREIGN KEY to
  // auth.users(id) — so every call raised 23503 and threw. The couple door calls
  // this ONE STEP BEFORE the agent turn (vendorInbound.js:586, and again at :624),
  // neither guarded, so the cabinet write killed the conversation: a bride sent a
  // TDW code and got a hiccup line instead of an answer, three times.
  //
  // The value was correct code once. Pre-auth-mint, users.id WAS the identity and
  // the two planes were one; 0063 split them and the FK made the difference fatal.
  // Seven of the eight resolveAgentForVendor call sites already pass a genuine auth
  // id (six web sites pass req.auth.user_id — requireAuth.js:45's getUser().id —
  // and vendorInbound.js:803 passes users.auth_user_id). This was the lone deviant;
  // the census is in the handover, because the cure covers the SET, not the specimen.
  const authUserId = await resolveAuthUserId(supabase, vendor.user_id);
  if (!authUserId) {
    // THE OTHER MODE OF THE SAME SEAM. resolveAgentForVendor throws on a falsy id
    // (agentBridge.js:17-19), and an uncaught throw here is the same dead
    // conversation by a different route. This module's OWN contract is
    // { ok:false, error } — the one at :31 — so the honest failure travels the way
    // this file already says failures travel, and the bride still gets her answer.
    // No live subject exists today: both auth-less users own no vendor (founder
    // probe P3). The bench drives this mode synthetically and says so.
    console.error(`[enquiry-binder] vendor ${vendor.id} has no auth identity (users.id ${vendor.user_id}) — cabinet skipped, conversation continues`);
    return { ok: false, error: 'vendor has no auth identity' };
  }
  const { agentId } = await resolveAgentForVendor(supabase, vendor, authUserId);
  const eng = supabase.schema('engine');

  // Dedupe by phone — the engine equivalent of the old binder phone check.
  if (phone) {
    const { data: existing } = await eng
      .from('records').select('id, client')
      .eq('agent_id', agentId).eq('phone', phone).eq('hidden', false)
      .limit(1).maybeSingle();
    if (existing) {
      // Repeat enquiry: append to the note, don't open a duplicate binder.
      if (note) await executeRecordTool(agentId, 'donna_note_append', { binder_id: existing.id, note });

      // F-05.59's cure, stated as an absence: `noteIfNew` is DELIBERATELY not
      // written here. This binder is not new; a first-message claim about it
      // would be false. The silence is the fix.

      // ── D1-lite · THE NEVER-CLOBBER RENAME ────────────────────────────────
      // A binder opened by an earlier enquiry carries the nameless default. Once
      // a turn resolves a real name, filling it in is the whole point. But the
      // vendor may have renamed this binder himself in the months since — and a
      // marketplace hand overwriting a human's word is a worse defect than a
      // nameless row. So the rename fires on EXACTLY ONE precondition: the
      // client cell is still byte-identical to the default this file wrote. Any
      // other value — his, Donna's, anyone's — is left alone.
      if (name && existing.client === DEFAULT_CLIENT_NAME) {
        await executeRecordTool(agentId, 'donna_client', { binder_id: existing.id, client: name });
      }

      // The returned binder keeps its historical shape — { id } only — even though
      // the SELECT above now also reads `client` for the guard. The one caller that
      // reads this value (couple/enquire.js:88 → couple_enquiries.vendor_lead_id)
      // sees byte-identical output.
      return { ok: true, binder: { id: existing.id }, deduped: true };
    }
  }

  // Open a fresh binder: client first (opens it), then attach the rest by id.
  // ref_id is the raw uuid (item.id is the prefixed snapshot key — the 3-C lesson).
  const opened = await executeRecordTool(agentId, 'donna_client', {
    client: name || DEFAULT_CLIENT_NAME,
  });
  if (isErr(opened)) return { ok: false, error: opened.display };
  const binderId = opened.item && opened.item.ref_id;
  if (!binderId) return { ok: false, error: 'could not open binder' };

  if (phone) await executeRecordTool(agentId, 'donna_phone', { binder_id: binderId, phone });
  if (date)  await executeRecordTool(agentId, 'donna_date',  { binder_id: binderId, date });
  if (note)  await executeRecordTool(agentId, 'donna_note',  { binder_id: binderId, note });
  // This binder IS new, so the first-message claim is TRUE here and only here.
  // `donna_note_append` rather than `donna_note` so a caller passing both keeps
  // both lines (donna_note REPLACES; append grows the story — writeFields:137).
  if (noteIfNew) {
    await executeRecordTool(agentId, note ? 'donna_note_append' : 'donna_note', { binder_id: binderId, note: noteIfNew });
  }
  // Every inbound enquiry enters as a LEAD — never a client until the owner says so.
  await executeRecordTool(agentId, 'donna_stage', { binder_id: binderId, stage: 'lead' });

  return { ok: true, binder: { id: binderId }, deduped: false };
}

module.exports = { enquiryToBinder };
