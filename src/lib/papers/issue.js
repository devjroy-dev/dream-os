// src/lib/papers/issue.js · CE-47 · PRO · P1 · issuing, listing and withdrawing her papers (issued_papers, 0209).
const F = require('./figures');
const { newCode } = require('./code');
const { todayIST } = require('./verifiedWeddings');

const KINDS = ['certificate', 'id_card', 'statement', 'ca_pack'];
const PURPOSES = ['bank', 'landlord', 'visa', 'other'];
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;

/** Checks what she asked for. Returns { ok, ... } with the reason in plain words. */
function readAsk(body, now = Date.now()) {
  const kind = String(body && body.kind || '');
  if (!KINDS.includes(kind)) return { ok: false, error: 'Pick a paper to make.' };
  if (kind === 'certificate' || kind === 'id_card') return { ok: true, kind, from: null, to: null, purpose: null };
  const from = body.period_from, to = body.period_to;
  if (!isDay(from) || !isDay(to)) return { ok: false, error: 'Pick the first and last day of the period.' };
  if (from > to) return { ok: false, error: 'The first day must come before the last day.' };
  if (to > todayIST(now)) return { ok: false, error: 'The period cannot end after today.' };
  if ((Date.parse(to) - Date.parse(from)) / 864e5 > 366) return { ok: false, error: 'A period can be at most one year.' };
  let purpose = null;
  if (kind === 'statement') { purpose = String(body.purpose || ''); if (!PURPOSES.includes(purpose)) return { ok: false, error: 'Pick who the statement is for.' }; }
  return { ok: true, kind, from, to, purpose };
}

async function issuePaper({ supabase, vendor, body, now = Date.now() }) {
  const a = readAsk(body, now); if (!a.ok) return { ok: false, status: 400, error: a.error };
  const f = a.kind === 'statement' ? await F.statement({ supabase, vendor, from: a.from, to: a.to })
    : a.kind === 'ca_pack' ? await F.caPack({ supabase, vendor, from: a.from, to: a.to })
      : await F.professional({ supabase, vendor, now });
  if (!f.ok) return { ok: false, status: 503, error: f.error };
  for (let i = 0; i < 4; i++) {
    const row = { vendor_id: vendor.id, kind: a.kind, period_from: a.from, period_to: a.to, purpose: a.purpose, figures: f.figures, check_code: newCode() };
    const r = await supabase.from('issued_papers').insert(row).select('id, kind, period_from, period_to, purpose, figures, check_code, issued_at, withdrawn_at').single();
    if (!r.error) return { ok: true, paper: r.data };
    if (r.error.code !== '23505') return { ok: false, status: 500, error: 'TDW could not save the paper just now. Please try again.' };
  }
  return { ok: false, status: 500, error: 'TDW could not save the paper just now. Please try again.' };
}

async function listPapers({ supabase, vendorId }) {
  const r = await supabase.from('issued_papers').select('id, kind, period_from, period_to, purpose, figures, check_code, issued_at, withdrawn_at').eq('vendor_id', vendorId).order('issued_at', { ascending: false }).limit(100);
  return r.error ? { ok: false, error: 'TDW could not read your papers just now.' } : { ok: true, papers: r.data || [] };
}
async function getPaper({ supabase, vendorId, id }) {
  const r = await supabase.from('issued_papers').select('id, kind, period_from, period_to, purpose, figures, check_code, issued_at, withdrawn_at').eq('vendor_id', vendorId).eq('id', id).maybeSingle();
  return r.error ? { ok: false } : { ok: true, paper: r.data || null };
}
/** Withdraw: one way. A paper already withdrawn stays as it is (the first date stands). */
async function withdrawPaper({ supabase, vendorId, id, now = Date.now() }) {
  const r = await supabase.from('issued_papers').update({ withdrawn_at: new Date(now).toISOString() }).eq('vendor_id', vendorId).eq('id', id).is('withdrawn_at', null).select('id, withdrawn_at');
  if (r.error) return { ok: false, status: 500, error: 'TDW could not withdraw the paper just now.' };
  if (!r.data || !r.data.length) { const g = await getPaper({ supabase, vendorId, id }); return g.paper ? { ok: true, already: true } : { ok: false, status: 404, error: 'That paper is not in your account.' }; }
  return { ok: true, withdrawn_at: r.data[0].withdrawn_at };
}

module.exports = { issuePaper, listPapers, getPaper, withdrawPaper, readAsk, KINDS, PURPOSES };
