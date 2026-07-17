// src/agent/harvest.js — TDW_02 P4: out-of-band harvest, both planes, forward-only.
//
// Fired fire-and-forget from the chat door AFTER the turn's reply is sent (both
// streaming and JSON paths). Never blocks a request; never throws to one. It reads
// NOTHING but the current turn (LD-3 forward-only): the vendor's raw message, the
// turn's tool_calls, and the vendor's OPEN DRAFTS — typed leads with standing
// draft_meta (cap 6, newest) + records rows with non-empty missing_cells (cap 6).
//
// The model proposes; THE CODE DECIDES. Application rules (spec P4, code-enforced):
//   1. field/cell MUST be in that row's current missing set — else drop.
//   2. Target MUST currently be null/absent — never overwrite.
//   3. Row MUST belong to this vendor/agent — else drop AND log harvest_cross_scope.
//   4. Values pass the same validators as the real write doors: typed patches go
//      through updateLead (recompute + promotion built in); records patches go
//      through executeAndPatch -> the Donna doors (supersession + witnessed-edit
//      discipline hold) — never raw SQL onto records.
//   5. Applied -> draft state recomputed; `action:'harvest_patch'` logged to
//      vendor_activity_log (Amendment One CE-4: the live column is `action`);
//      snapshots patched via the same confirmed-write paths the doors use.
//   6. Malformed JSON -> one silent retry -> give up silently. Best-effort.
//
// MODEL SEAM (TDW_02 §8 executor decision, recorded): the single function
// callHarvestModel below runs Anthropic Haiku DIRECT — byte-identical to the
// P5 facade's documented fallback — until P5 lands llm.js/modelRouter.js and
// admin_config 0073 routes surface `harvest` to glm-4.7-flash. P5 replaces
// exactly this one function's body. Cost until then: Haiku (logged in handover).
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { updateLead } = require('../lib/vendor/leads');
const { leadMissing } = require('../lib/draftContracts');
const { missingCells } = require('../lib/recordCompleteness');
const { executeAndPatch } = require('../lib/executeAndPatch');
const { patchNote } = require('../engine/dist/core/donna');
const { loadRecords } = require('../engine/dist/core/recordsView');
const { phoneKey } = require('../engine/dist/core/phoneKey'); // F-04.68's cure (B6-S1, R-B6-24): ST-3b's own key fn, the ONE home
const { logActivity } = require('../lib/vendor/snapshot');

const { resolveModel } = require('../lib/modelRouter'); // TDW_02 P5: the seam swap
const { llmCreate } = require('../lib/llm');

const HAIKU = 'claude-haiku-4-5-20251001';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = [
  'You extract ALREADY-STATED facts from one business message to fill gaps in existing draft records.',
  'You receive: the message, the tool calls the assistant already made this turn, and a list of open draft rows with their MISSING fields.',
  'Propose a patch ONLY when the message itself plainly states a value for a field that row is missing. Never infer, never guess, never invent.',
  'A value already filed by a tool call this turn needs no patch.',
  'Dates must be ISO: YYYY-MM-DD when exact, YYYY-MM when only the month is known. Amounts are plain integer rupees.',
  'Respond with STRICT JSON and NOTHING else — no prose, no fences:',
  '{"patches":[{"plane":"typed","table":"leads","id":"<id>","field":"<field>","value":"<value>"},{"plane":"records","id":"<id>","cell":"<cell>","value":"<value>"}]}',
  'No patches -> {"patches":[]}',
].join('\n');

// ── the P5 seam, SWAPPED (spec P4->P5): route via resolveModel('harvest'); the
// retry leg stays Haiku direct — the facade's own fallback, and rule 6's floor.
async function callHarvestModel(userPrompt, supabase, opts = {}) {
  const params = { max_tokens: 700, system: SYSTEM, messages: [{ role: 'user', content: userPrompt }] };
  if (opts.forceHaiku) {
    const resp = await anthropic.messages.create({ ...params, model: HAIKU });
    return (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  }
  const route = await resolveModel(supabase, 'harvest', 'default');
  const resp = route.provider === 'anthropic'
    ? await anthropic.messages.create({ ...params, model: route.model })
    : await llmCreate(route.provider, { ...params, model: route.model });
  return (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

function parsePatches(text) {
  try {
    const clean = String(text).replace(/```json|```/g, '').trim();
    const obj = JSON.parse(clean);
    return Array.isArray(obj.patches) ? obj.patches : null;
  } catch (_e) { return null; }
}

// ── typed-plane value validation/normalization (mirror of the door's rules) ────
function normalizeTyped(field, value) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (field === 'wedding_date') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return { wedding_date: v };
    if (/^\d{4}-\d{2}$/.test(v)) return { wedding_date: `${v}-01`, wedding_date_precision: 'month' };
    return null; // never pollute a date column
  }
  if (field === 'budget_max') {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n > 0 ? { budget_max: n } : null;
  }
  if (field === 'name' || field === 'wedding_city') {
    // P7/F11 guard: a name or city must contain letters — GLM harvested "201"
    // (from "the 21st") into Meera's city. Digits-only or symbol-only -> drop.
    return /[a-zA-Z\u0900-\u097F]/.test(v) ? { [field]: v } : null;
  }
  if (field === 'phone') return { phone: v }; // verbatim, no formatting
  return null; // unknown field -> drop (rule 1 also catches this)
}

// records-plane cell -> Donna door mapping (rule 4: the real doors only).
function recordsDoor(row, cell, value) {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (cell === 'date') {
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(v)) return null;
    return { tool: 'donna_date', input: { binder_id: row.id, date: /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v } };
  }
  if (cell === 'phone')  return { tool: 'donna_phone', input: { binder_id: row.id, phone: v } };
  if (cell === 'client') return { tool: 'donna_edit',  input: { binder_id: row.id, client: v } };
  if (cell === 'amount') {
    if (!row.direction) return null; // amount is only expected on a money story (CE-16)
    return { tool: 'donna_money', input: { binder_id: row.id, amount: v, direction: row.direction } };
  }
  return null;
}

// ── F-04.72's CURE (TDW_04 B6 rider; ruled R-B6-29, SHAPE (a)) ────────────────
// THE DISAMBIGUATION HOLD: when the model's reply in the SAME TURN contains an
// open entity-clarify ("is this a new person, or the same Kavya already on
// file?"), the harvest HOLDS every patch whose match key collides with the
// entity under question — that turn only. The filing layer earned its dedup
// gate at the identity layer; this extends the same courtesy to the harvest,
// which cross-filed the new Kavya's phone + wedding date into the OLD Kavya's
// money-bearing binder DURING the exact turn the model was honestly asking
// which Kavya (row c66ad01c, founder-pasted, FINDINGS_LOG F-04.72).
//
// MECHANICS, code-decides (the model's clarify is prose, so the detector is
// mechanical over that prose — never a second model call):
//   · a segment of the reply is "a question" iff it contains '?';
//   · an entity is "under question" iff a question segment names a draft row's
//     name key (first name token, lowercased, letters/digits only, >= 2 chars;
//     word-bounded for ascii keys, substring for non-ascii scripts — stated);
//   · the hold applies to ALL patches, BOTH planes, whose target row's name
//     key equals a key under question (shape (b)'s cross-plane collision is
//     exactly this: lead "Kavya Smoke Test" and binder "Kavya" share key
//     "kavya" — both hold). Held ≠ dropped-by-rule: held patches are counted
//     and ledgered (`action:'harvest_hold'`) so the hold is witnessable.
//   · turn-only by construction: the harvest is stateless and forward-only
//     (LD-3); the next turn's restated fact re-harvests freely — which is how
//     turn 2's lawful lead patches landed in the specimen.
// COST ASYMMETRY, stated: a false hold loses one turn's enrichment on one
// entity (recoverable next mention); a false pass contaminates a money-bearing
// record through lawful hands. The detector leans toward holding.
// If replyText is absent (an older caller), NOTHING holds — behaviour is
// byte-identical to pre-rider harvest. Verification: scripts/b6_rider_bench.js.
const HOLD_KEY_MIN = 2;
function nameKey(label) {
  const s = String(label || '').trim().toLowerCase();
  if (!s) return null;
  const tok = (s.split(/\s+/)[0] || '').replace(/[^\p{L}\p{N}]/gu, '');
  return tok.length >= HOLD_KEY_MIN ? tok : null;
}
function questionSegments(replyText) {
  return String(replyText || '')
    .split(/\n+|(?<=[.!?])\s+/)
    .filter((seg) => seg.includes('?'));
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function computeDisambiguationHolds(replyText, labels) {
  const held = new Set();
  const qs = questionSegments(replyText);
  if (!qs.length) return held;
  for (const label of labels) {
    const key = nameKey(label);
    if (!key || held.has(key)) continue;
    const ascii = /^[a-z0-9]+$/.test(key);
    const re = ascii ? new RegExp('\\b' + escapeRe(key) + '\\b') : null;
    if (qs.some((seg) => { const s = seg.toLowerCase(); return ascii ? re.test(s) : s.includes(key); })) {
      held.add(key);
    }
  }
  return held;
}
// ── end F-04.72 cure region ───────────────────────────────────────────────────

function leadSnapshotItem(l) {
  const val = l.budget_max != null ? ` (Rs ${l.budget_max})` : '';
  const state = l.state ?? 'new';
  return {
    id: `lead:${l.id}`, kind: 'lead',
    text: `${l.name ?? 'unknown'} — lead, ${state}${val}`,
    status: (state === 'booked' || state === 'lost') ? 'confirmed' : 'open',
    horizon: null, ref_type: 'leads', ref_id: l.id,
    // TDW_04 B6-S1 — F-04.68's CURE (ruled R-B6-24): the fourth writer joins the
    // other three. patchNote replaces items WHOLESALE, so a key-less item here
    // stripped ST-3b's fusion keys from every harvest-touched lead; phone_key has
    // no render fallback, so the STRONG fusion key died silently per touch.
    // Mirrors leads.js patchLeadSnapshot / donnaLead leadItem / donna.ts rebuild.
    // Verification line: scripts/b6_s1_bench.js §1.
    name: l.name ?? null,
    phone_key: phoneKey(l.phone),
  };
}

// ── the entry: everything inside is best-effort, nothing escapes ──────────────
async function runHarvest({ supabase, vendor, agentId, message, toolCalls, replyText }) {
  try {
    const pub = supabase;

    // Open drafts, both planes (rule-3 scope is established HERE: only rows
    // fetched under this vendor/agent are patchable; any other id is cross-scope).
    const { data: typedRows } = await pub
      .from('leads')
      .select('id, name, phone, wedding_date, wedding_city, budget_max, state, draft_meta')
      .eq('vendor_id', vendor.id)
      .is('deleted_at', null)
      .not('draft_meta', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6);
    const typed = typedRows || [];

    let recordRows = [];
    try {
      const all = await loadRecords(agentId);
      recordRows = (all || []).filter((r) => missingCells(r).length > 0).slice(0, 6);
    } catch (e) { console.warn('[harvest] records load failed (skipping plane):', e.message); }

    if (!typed.length && !recordRows.length) return; // nothing open -> nothing to do

    const draftsBlock = [
      ...typed.map((l) => `- plane=typed table=leads id=${l.id} label=${l.name || 'unnamed'} missing=[${(l.draft_meta.missing || []).join(',')}]`),
      ...recordRows.map((r) => `- plane=records id=${r.id} label=${r.client || 'unnamed binder'} missing=[${missingCells(r).join(',')}]`),
    ].join('\n');
    const prompt =
      `MESSAGE:\n${message}\n\nTOOL CALLS THIS TURN (already filed — needs no patch):\n` +
      `${JSON.stringify(toolCalls || []).slice(0, 3000)}\n\nOPEN DRAFTS:\n${draftsBlock}`;

    // Rule 6: one silent retry, then give up silently.
    let patches = null;
    try { patches = parsePatches(await callHarvestModel(prompt, pub)); } catch (e) { console.warn('[harvest] routed model failed:', e.message); }
    if (patches === null) patches = parsePatches(await callHarvestModel(prompt + '\n\nSTRICT JSON ONLY.', pub, { forceHaiku: true }));
    if (patches === null) { console.warn('[harvest] unparseable twice — gave up'); return; }
    if (!patches.length) { console.log('[harvest] applied=0 dropped=0 (model proposed nothing)'); return; }

    // F-04.72 (R-B6-29 shape (a)): keys under open clarification THIS turn,
    // computed over BOTH planes' draft labels against the model's own reply.
    const holds = computeDisambiguationHolds(replyText, [
      ...typed.map((l) => l.name),
      ...recordRows.map((r) => r.client),
    ]);
    const holdLogged = new Set();
    const holdPatch = async (key, rowLabel) => {
      if (holdLogged.has(key)) return;
      holdLogged.add(key);
      await logActivity(pub, { vendorId: vendor.id, surface: 'pwa', action: 'harvest_hold', summary: `harvest held patches for "${rowLabel || key}" — the turn's reply left which-${key} open (F-04.72's gate); restate after answering and it files` });
    };

    let applied = 0, dropped = 0, crossScope = 0, held = 0;

    for (const p of patches) {
      try {
        if (p.plane === 'typed') {
          const row = typed.find((l) => l.id === p.id);
          if (!row) {
            crossScope++;
            await logActivity(pub, { vendorId: vendor.id, surface: 'pwa', action: 'harvest_cross_scope', summary: `harvest dropped a patch for unknown/foreign lead id ${String(p.id).slice(0, 40)}` });
            continue;
          }
          const tk = nameKey(row.name);                                   // F-04.72: the hold sits
          if (tk && holds.has(tk)) { held++; await holdPatch(tk, row.name); continue; } // ABOVE the field rules
          const missing = (row.draft_meta && row.draft_meta.missing) || [];
          if (!missing.includes(p.field)) { dropped++; continue; }        // rule 1
          if (row[p.field] != null && row[p.field] !== '') { dropped++; continue; } // rule 2
          const norm = normalizeTyped(p.field, p.value);
          if (!norm) { dropped++; continue; }                              // rule 4 (typed)
          const r = await updateLead(pub, vendor.id, row.id, norm);        // the real door
          if (!r.ok) { dropped++; continue; }
          // Harvest trail: recompute already ran in the door; mark provenance.
          if (r.lead && r.lead.draft_meta) {
            // P4-a fix: build the trail on the FRESH post-door draft_meta —
            // updateLead carries harvested[] forward, so sequential patches stack
            // instead of the stale pre-patch row clobbering earlier entries.
            const fresh = r.lead.draft_meta;
            await pub.from('leads').update({
              draft_meta: {
                missing: fresh.missing,
                source: 'harvest',
                harvested: [ ...(fresh.harvested || []), p.field ],
              },
            }).eq('id', row.id).eq('vendor_id', vendor.id);
          }
          try { await patchNote(agentId, { display: 'harvest lead patch', item: leadSnapshotItem({ ...row, ...norm }) }); }
          catch (e) { console.warn('[harvest] snapshot patch failed (write landed):', e.message); }
          await logActivity(pub, { vendorId: vendor.id, surface: 'pwa', action: 'harvest_patch', summary: `harvest: lead ${row.name || row.id} ← ${p.field}`, entityType: 'lead', entityId: row.id });
          applied++;
        } else if (p.plane === 'records') {
          const row = recordRows.find((r) => r.id === p.id);
          if (!row) {
            crossScope++;
            await logActivity(pub, { vendorId: vendor.id, surface: 'pwa', action: 'harvest_cross_scope', summary: `harvest dropped a patch for unknown/foreign binder id ${String(p.id).slice(0, 40)}` });
            continue;
          }
          const rk = nameKey(row.client);                                 // F-04.72: same hold, other
          if (rk && holds.has(rk)) { held++; await holdPatch(rk, row.client); continue; } // plane — shape (b)'s case
          if (!missingCells(row).includes(p.cell)) { dropped++; continue; } // rules 1+2 (missing == absent)
          const door = recordsDoor(row, p.cell, p.value);
          if (!door) { dropped++; continue; }                              // rule 4 (records)
          const outcome = await executeAndPatch(agentId, door.tool, door.input); // real door + confirmed-write snapshot patch
          if (outcome && typeof outcome.display === 'string' && outcome.display.startsWith('ERROR')) { dropped++; continue; }
          await logActivity(pub, { vendorId: vendor.id, surface: 'pwa', action: 'harvest_patch', summary: `harvest: binder ${row.client || row.id} ← ${p.cell}`, entityType: 'client', entityId: row.id });
          applied++;
        } else {
          dropped++; // unknown plane
        }
      } catch (e) {
        dropped++;
        console.warn('[harvest] patch application failed (dropped):', e.message);
      }
    }

    console.log(`[harvest] applied=${applied} dropped=${dropped} held=${held} cross_scope=${crossScope}`);
  } catch (e) {
    console.warn('[harvest] run failed (non-fatal, best-effort):', e.message);
  }
}

module.exports = { runHarvest };
// F-04.72 bench seam (scripts/b6_rider_bench.js drives the REAL bodies):
module.exports._disambiguation = { nameKey, questionSegments, computeDisambiguationHolds };
