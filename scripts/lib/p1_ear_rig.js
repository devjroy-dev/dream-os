// scripts/lib/p1_ear_rig.js · TDW CE-44 · LCV-1 · LC-Victor P1, THE EAR TABLE · v2 (fed from a file).
//
// COMMITTED HERE, NOT UNDER scripts/ (F-44.41, chair-ruled): scripts/run-floor.sh:226 collects every
// scripts/*.js as a bench, and this rig run bare refuses (exit 2) on missing keys, so at scripts/ it
// would redden the founder's floor. scripts/lib/ is outside that flat glob. This is the source as it
// ran on 2026-09-19 (table sha256 aa29bbbd...), with only its paths moved one folder deeper.
//
// MEASUREMENT ONLY. APPLIED FOR THE RUN AND NOT COMMITTED (chair ruling, CE-44). The run block
// removed this file and the corpus file after the run and proved `git status --porcelain` empty.
// Its source is committed here inside P2's code cut, as ruled.
//
// FED FROM A FILE (chair re-ruling, CE-44, 2026-09-19). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// never enter the founder's Codespace. The corpus is the CSV the founder downloads from the
// Supabase SQL editor (the corpus SELECT), moved by the run block to scripts/out/p1_corpus.csv
// (ignored, .gitignore:38). This rig makes NO database connection of any kind.
//
// WHAT IT DOES. Each vendor sentence is heard cold by three candidate ears and each returns ONE
// structured request through the `ear_request` tool. Nothing else happens:
//   · the ONLY tool offered is `ear_request`, so no estate hand can be named, let alone run;
//   · the model is called through src/lib/llm.js `llmCreate`, never `runDonnaTurn` (which boards
//     DONNA_TOOLS and executes hands: donna.ts:353, :530, :736);
//   · `admin_config` is never read or written; the two seats are constants, the same two models
//     as SWITCHABLE (src/lib/modelRouter.js:116 to :119);
//   · the one write is the table file under scripts/out/.
//
// THE THREE CANDIDATES. C1 deepseek-v4-flash hears the vendor's sentence. C2
// claude-haiku-4-5-20251001 hears the vendor's sentence. C3 deepseek-v4-flash hears VICTOR'S
// STORED RELAY for that same turn (the control: what Donna's model actually received).
//
// IT REFUSES, naming every reason at once, before any model call, when: a key is missing; the
// corpus file is absent or has no data rows; a column is missing; any row carries a fixture tail
// outside the two fixtures, or a tail with more than one agent, or an agent with more than one
// tail; the fixture join did not resolve exactly two agents; the fingerprint columns differ between rows; more than sixty rows; or `n` is not 1..k.
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FIXTURE_TAILS = ['9888294440', '8595356978'];
const MAX_ROWS = 60;
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(__dirname, '..', 'out');
const CORPUS = path.join(OUT_DIR, 'p1_corpus.csv');
const COLUMNS = ['n', 'fixture_tail', 'agent_id', 'created_utc', 'lane', 'sentence', 'relay',
  'fp_user_rows', 'fp_with_relay', 'fp_earliest_utc', 'fp_latest_utc', 'fx_agents'];
const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'DEEPSEEK_API_KEY'];

const SEATS = {
  C1: { provider: 'deepseek',  model: 'deepseek-v4-flash',         hears: 'vendor' },
  C2: { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', hears: 'vendor' },
  C3: { provider: 'deepseek',  model: 'deepseek-v4-flash',         hears: 'relay'  },
};

// Card rows, verbatim. Sources: the CE-44 4a handover §6 (the founder's own sentences on card 4a),
// the 4a read-first §4 card 2, R-44.9's relay sentence, and the founder's advice question (R-44.4).
const CARD_ROWS = [
  'Khanna paid the middle payment on 18 September.',
  'Swati Test paid the middle payment on 18 September',
  'Swati Test paid the remainder today',
  'full',
  'Add Meera as a confirmed client, fee 60,000',
  "tell Priya we're free on the 22nd",
  'how should i price my package. i want to increase',
];

const SYSTEM = 'You read one message from a wedding vendor and record it with the ear_request tool. You never reply to the vendor.';

const EAR_TOOL = {
  name: 'ear_request',
  description: 'Record what the vendor is asking for. Do not answer the vendor. Do not resolve names to records.',
  input_schema: {
    type: 'object',
    properties: {
      route:            { type: 'string', enum: ['task', 'search', 'neither'] },
      act:              { type: 'string', description: 'booking_confirmed, advance_paid, milestone_paid, attach_package, quote_send, relay, lead, date, block_date, unblock_date, edit_event, cancel_event, assign_crew, note, invoice, find, whatsdue, history, tally, or none' },
      client_as_spoken: { type: 'string', description: 'The client exactly as the vendor said it. Empty if none.' },
      amount_rupees:    { type: 'integer', description: 'Whole rupees, only if the vendor said a figure.' },
      date:             { type: 'string', description: 'YYYY-MM-DD, only if the vendor said a day.' },
      milestone:        { type: 'string', description: 'The payment as the vendor named it. Empty if none.' },
      missing:          { type: 'array', items: { type: 'string' } },
      advice_part:      { type: 'boolean', description: 'True if any part of the message asks for advice rather than a task or a search.' },
    },
    required: ['route', 'act', 'client_as_spoken', 'missing', 'advice_part'],
  },
};


// RFC 4180: quoted fields may hold commas, newlines and doubled quotes. A BOM is dropped.
function parseCsv(text) {
  const t = text.replace(/^\uFEFF/, '');
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(f); f = '';
      if (!(row.length === 1 && row[0] === '')) rows.push(row);
      row = [];
    } else f += c;
  }
  if (q) throw new Error('an unterminated quoted field');
  if (f !== '' || row.length) { row.push(f); if (!(row.length === 1 && row[0] === '')) rows.push(row); }
  return rows;
}

function readCorpus() {
  const refusals = [];
  if (!fs.existsSync(CORPUS)) return { refusals: [`corpus file absent: ${path.relative(ROOT, CORPUS)}`] };
  let rows;
  try { rows = parseCsv(fs.readFileSync(CORPUS, 'utf8')); } catch (e) { return { refusals: [`corpus file unreadable as CSV: ${e.message}`] }; }
  if (rows.length < 2) return { refusals: ['corpus file has no data rows'] };
  const header = rows[0].map((h) => h.trim());
  const miss = COLUMNS.filter((c) => !header.includes(c));
  if (miss.length) return { refusals: [`corpus file lacks column(s): ${miss.join(', ')}`] };
  const recs = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] === undefined ? '' : r[i]])));
  const fp = { user_rows: recs[0].fp_user_rows, with_relay: recs[0].fp_with_relay, earliest_utc: recs[0].fp_earliest_utc, latest_utc: recs[0].fp_latest_utc };
  if (recs.some((r) => r.fx_agents !== '2')) refusals.push(`the fixture join resolved ${[...new Set(recs.map((r) => r.fx_agents))].join('/')} agent(s), not 2`);
  if (recs.some((r) => r.fp_user_rows !== fp.user_rows || r.fp_with_relay !== fp.with_relay || r.fp_earliest_utc !== fp.earliest_utc || r.fp_latest_utc !== fp.latest_utc)) refusals.push('the fingerprint columns differ between rows');
  const foreign = [...new Set(recs.map((r) => r.fixture_tail).filter((t) => !FIXTURE_TAILS.includes(t)))];
  if (foreign.length) refusals.push(`rows outside the two fixtures: fixture_tail ${foreign.join(', ')}`);
  const tailAgents = new Map(); const agentTails = new Map();
  for (const r of recs) {
    if (!tailAgents.has(r.fixture_tail)) tailAgents.set(r.fixture_tail, new Set()); tailAgents.get(r.fixture_tail).add(r.agent_id);
    if (!agentTails.has(r.agent_id)) agentTails.set(r.agent_id, new Set()); agentTails.get(r.agent_id).add(r.fixture_tail);
  }
  for (const [t, a] of tailAgents) if (a.size !== 1) refusals.push(`fixture ${t} carries ${a.size} agents`);
  for (const [a, t] of agentTails) if (t.size !== 1) refusals.push(`agent ${a} carries ${t.size} fixture tails`);
  if (recs.length > MAX_ROWS) refusals.push(`${recs.length} rows (the corpus is the ${MAX_ROWS} most recent)`);
  if (recs.some((r, i) => r.n !== String(i + 1))) refusals.push('column n is not 1..k in order');
  if (recs.some((r) => !String(r.sentence).trim())) refusals.push('a row has an empty sentence');
  // An export may write a SQL NULL as an empty field or as the word NULL; both mean no relay.
  const relayOf = (v) => { const t = String(v || '').trim(); return t && !/^null$/i.test(t) ? t : null; };
  const recent = recs.map((r) => ({ source: 'fixture', lane: r.lane, sentence: String(r.sentence).trim(), relay: relayOf(r.relay), at: r.created_utc }));
  const fixtures = [...tailAgents].map(([t, a]) => `${t} agent ${[...a][0]}`);
  return { refusals, fp, recent, fixtures };
}

async function hear(llm, seat, text) {
  try {
    const resp = await llm.llmCreate(seat.provider, {
      model: seat.model,
      max_tokens: 400,
      system: SYSTEM,
      tools: [EAR_TOOL],
      tool_choice: { type: 'tool', name: 'ear_request' },
      messages: [{ role: 'user', content: text }],
    });
    const use = (resp && resp.usage) || {};
    const call = ((resp && resp.content) || []).find((b) => b && b.type === 'tool_use' && b.name === 'ear_request');
    if (!call) return { req: null, error: 'NO_REQUEST: the model returned no ear_request call', use };
    return { req: call.input, error: null, use };
  } catch (e) {
    return { req: null, error: `NO_REQUEST: ${(e && e.message) || String(e)}`, use: {} };
  }
}

function cell(v) {
  if (v === undefined || v === null || v === '') return '';
  const s = Array.isArray(v) ? v.join(', ') : String(v);
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ⏎ ');
}


async function run({ llm, tip, now, outDir, log, corpus }) {
  const { fp, recent, fixtures } = corpus;
  const rows = [...recent, ...CARD_ROWS.map((s) => ({ source: 'card', lane: '', sentence: s, relay: null, at: '' }))];
  const totals = { C1: { in: 0, out: 0, calls: 0 }, C2: { in: 0, out: 0, calls: 0 }, C3: { in: 0, out: 0, calls: 0 } };
  const lines = [];
  let n = 0;
  for (const r of rows) {
    n += 1;
    for (const key of ['C1', 'C2', 'C3']) {
      const seat = SEATS[key];
      const heard = seat.hears === 'relay' ? r.relay : r.sentence;
      if (!heard) {
        lines.push([n, r.source, r.lane, r.sentence, `${key} ${seat.model}`, '(no relay stored for this turn)', 'NO_RELAY', '', '', '', '', '', '', '', '']);
        continue;
      }
      const h = await hear(llm, seat, heard);
      totals[key].calls += 1;
      totals[key].in += Number(h.use.input_tokens || 0);
      totals[key].out += Number(h.use.output_tokens || 0);
      const q = h.req || {};
      lines.push([n, r.source, r.lane, r.sentence, `${key} ${seat.model}`, key === 'C3' ? heard : '(the sentence)',
        h.error ? h.error : q.route, q.act, q.client_as_spoken, q.amount_rupees, q.date, q.milestone, q.missing, q.advice_part, '']);
    }
    log(`row ${n}/${rows.length}`);
  }
  const head = [
    '# P1 · the ear table · LC-Victor · CE-44',
    '',
    `- dream-os tip: \`${tip}\``,
    `- generated (UTC): ${now}`,
    `- seats: C1 ${SEATS.C1.provider}/${SEATS.C1.model} hears the vendor · C2 ${SEATS.C2.provider}/${SEATS.C2.model} hears the vendor · C3 ${SEATS.C3.provider}/${SEATS.C3.model} hears Victor's stored relay (control)`,
    `- fixtures (from the corpus file): ${fixtures.join(' · ')}`,
    `- FINGERPRINT user_rows=${fp.user_rows} with_relay=${fp.with_relay} earliest_utc=${fp.earliest_utc} latest_utc=${fp.latest_utc}`,
    `- rows: ${recent.length} fixture (most recent first) + ${CARD_ROWS.length} card`,
    `- usage: ${['C1', 'C2', 'C3'].map((k) => `${k} ${totals[k].calls} calls, ${totals[k].in} in / ${totals[k].out} out tokens`).join(' · ')}`,
    '',
    'The `founder` column is empty: it is his, for what he meant.',
    '',
    '| # | source | lane | sentence as sent | candidate | heard | route | act | client_as_spoken | amount_rupees | date | milestone | missing | advice_part | founder |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  const body = lines.map((l) => `| ${l.map(cell).join(' | ')} |`);
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `p1_ear_table_${now.replace(/[-:]/g, '').replace(/\..*$/, '')}Z.md`);
  fs.writeFileSync(file, head.concat(body).join('\n') + '\n');
  return { file, rows: rows.length, totals };
}

async function main() {
  const corpus = readCorpus();
  if (corpus.fp) console.log(`FINGERPRINT user_rows=${corpus.fp.user_rows} with_relay=${corpus.fp.with_relay} earliest_utc=${corpus.fp.earliest_utc} latest_utc=${corpus.fp.latest_utc}`);
  const refusals = [];
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) refusals.push(`missing environment variable(s): ${missing.join(', ')}`);
  refusals.push(...corpus.refusals);
  if (refusals.length) {
    console.log(`REFUSED: ${refusals.join('; ')}. No model was called and nothing was written.`);
    process.exit(2);
  }
  const llm = require('../../src/lib/llm');
  const tip = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  const now = new Date().toISOString();
  const res = await run({ llm, tip, now, outDir: OUT_DIR, log: (s) => console.log(s), corpus });
  console.log(`TABLE ${path.relative(ROOT, res.file)} · ${res.rows} rows × 3 candidates`);
}

if (require.main === module) {
  main().catch((e) => { console.log(`RIG FAILED: ${(e && e.message) || String(e)}`); process.exit(1); });
}

module.exports = { run, hear, parseCsv, readCorpus, EAR_TOOL, SEATS, CARD_ROWS, SYSTEM, COLUMNS, CORPUS };
