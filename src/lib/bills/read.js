'use strict';
// src/lib/bills/read.js · CE-47 · PRO · P2 · READING A PURCHASE BILL, TO PRE-FILL ONLY.
//
// THE READER (the founder's yes, 7 October 2026, decision D): the calendar import's reader. Claude Haiku through the
// vendor side's existing client (llmCreate('anthropic'), ANTHROPIC_API_KEY), the model id from the existing constant
// MODEL_HAIKU, the bill sent as base64 BYTES in one call: never a URL, nothing to Cloudinary, no Google Vision.
// INS's policyRead.js is the shape this follows.
//
// What comes back is a PROPOSAL. It is cut to the fields parse.js knows, every value is type-checked here, and
// parse.js check() is the gate: nothing becomes an expense until its numbers hold and she confirms. The model's raw
// reply is never stored or returned: only the cleaned fields go into the draft. A failed read is an empty form.
// Injectable `create` for the bench.

const { MODEL_HAIKU } = require('../../agent/models');

const IN_PER_M = 1.0, OUT_PER_M = 5.0, USD_RS = 88;   // list prices, USD per million tokens; a round rupee rate (as policyRead)
const READABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const PROMPT = `This is a purchase bill or tax invoice from an Indian seller. Reply with ONE JSON object and nothing else:
{"supplier_name": string|null, "supplier_gstin": string|null, "bill_number": string|null, "bill_date": "YYYY-MM-DD"|null,
 "total": number|null, "taxable_value": number|null, "cgst": number|null, "sgst": number|null, "igst": number|null, "printed_rate": number|null}
supplier_gstin is the SELLER's GSTIN, not the buyer's. Amounts are in rupees as printed. printed_rate is the GST rate in
percent as printed (CGST 9% plus SGST 9% is 18). Use null for anything not printed clearly. Do not add up or guess.`;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e9 ? Math.round(v * 100) / 100 : null);
const str = (v, max) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null);

/** Only the known fields, each of its own type; anything else is dropped. The shape parse.js check() reads. */
function clean(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const g = str(r.supplier_gstin, 20);
  const d = str(r.bill_date, 10);
  return {
    supplier_name: str(r.supplier_name, 120), supplier_gstin: g ? g.toUpperCase().replace(/\s/g, '') : null,
    bill_number: str(r.bill_number, 30), expense_date: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null,
    amount: num(r.total), taxable_value: num(r.taxable_value), cgst: num(r.cgst), sgst: num(r.sgst), igst: num(r.igst),
    printed_rate: num(r.printed_rate),
  };
}

async function readBill({ base64, mime }, deps = {}) {
  if (!READABLE.includes(mime) || !base64) return clean(null);
  const create = deps.create || ((p) => require('../llm').llmCreate('anthropic', p));
  const block = mime === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } };
  try {
    const resp = await create({ model: MODEL_HAIKU, max_tokens: 400, messages: [{ role: 'user', content: [block, { type: 'text', text: PROMPT }] }] });
    const u = resp && resp.usage;
    if (u) console.log(`[billRead] cost Rs ${(((u.input_tokens || 0) * IN_PER_M + (u.output_tokens || 0) * OUT_PER_M) / 1e6 * USD_RS).toFixed(2)}`);
    const text = ((resp && resp.content) || []).filter((b) => b.type === 'text').map((b) => b.text).join('').replace(/```json|```/g, '').trim();
    let parsed = null; try { parsed = JSON.parse(text); } catch { parsed = null; }
    return clean(parsed);
  } catch (e) {
    console.warn('[billRead] read failed:', e && e.message);   // never the bill's content in a log line
    return clean(null);
  }
}

module.exports = { readBill, clean, PROMPT, READABLE };
