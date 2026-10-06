// src/lib/vendor/policyRead.js — TDW · CE-47 · INS-A · READING AN UPLOADED POLICY, TO PRE-FILL ONLY.
//
// Charter c: "pre-filled from the document if you can read it reliably; she always confirms". So this returns ONLY
// fields it read cleanly and that pass the same checks the confirm door applies; anything doubtful comes back null
// and she types it. It never saves anything. One Haiku call per upload (A-15: about Rs 0.40 for a two-page PDF at
// list prices; printed on every call as [policyRead] cost). Injectable `create` for the bench.
'use strict';

const { KIND_KEYS } = require('./insurance');
const HAIKU = 'claude-haiku-4-5-20251001';
const IN_PER_M = 1.0, OUT_PER_M = 5.0, USD_RS = 88;   // list prices, USD per million tokens; the rupee rate is a round figure

const PROMPT = `This is an insurance policy document. Reply with ONE JSON object and nothing else:
{"insurer": string|null, "kind": one of ${JSON.stringify(KIND_KEYS)} or null, "cover_amount_rupees": integer|null, "ends_on": "YYYY-MM-DD"|null}
Use null for anything not printed clearly in the document. ends_on is the last day the policy is in force. cover_amount_rupees is the total sum insured in whole rupees.`;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** The checks the confirm door applies, reused here so a pre-fill can never hold a value the door would refuse. */
function clean(raw) {
  const out = { insurer: null, kind: null, cover_amount: null, ends_on: null };
  if (!raw || typeof raw !== 'object') return out;
  if (typeof raw.insurer === 'string' && raw.insurer.trim().length >= 2 && raw.insurer.trim().length <= 120) out.insurer = raw.insurer.trim();
  if (KIND_KEYS.includes(raw.kind)) out.kind = raw.kind;
  const amt = Number(raw.cover_amount_rupees);
  if (Number.isInteger(amt) && amt > 0 && amt < 1e10) out.cover_amount = amt;
  if (typeof raw.ends_on === 'string' && DATE.test(raw.ends_on) && !Number.isNaN(Date.parse(raw.ends_on + 'T00:00:00Z'))) out.ends_on = raw.ends_on;
  return out;
}

const READABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];   // a HEIC photo is kept but not read

async function readPolicy({ base64, mime }, deps = {}) {
  if (!READABLE.includes(mime) || !base64) return clean(null);
  const create = deps.create || ((p) => require('../llm').llmCreate('anthropic', p));
  const block = mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } };
  try {
    const resp = await create({ model: HAIKU, max_tokens: 300, messages: [{ role: 'user', content: [block, { type: 'text', text: PROMPT }] }] });
    const u = resp && resp.usage;
    if (u) console.log(`[policyRead] cost Rs ${(((u.input_tokens || 0) * IN_PER_M + (u.output_tokens || 0) * OUT_PER_M) / 1e6 * USD_RS).toFixed(2)}`);
    const text = ((resp && resp.content) || []).filter((b) => b.type === 'text').map((b) => b.text).join('').replace(/```json|```/g, '').trim();
    let parsed = null; try { parsed = JSON.parse(text); } catch { parsed = null; }
    return clean(parsed);
  } catch (e) {
    console.warn('[policyRead] read failed:', e && e.message);   // a failed read is an empty form, never an error to her
    return clean(null);
  }
}

module.exports = { readPolicy, clean, PROMPT, READABLE };
