// scripts/b300_ce47_web4_cut29_bench.js
// TDW · CE-47 · WEB-4 cut 29 · b300 — THE SCHEMA REGISTER PAIR REGEN of 8 October 2026, proven from its bytes.
// The founder ran db/queries/public_schema_dump.sql and the three sections of public_constraints_dump.sql on the live
// database at 20:05 IST (ladder 0220, with 0203), row limit off. The four CSVs are kept beside the document
// (docs/db/snapshots/2026-10-08/) so the regen can be re-run by anyone, and this rung re-runs it:
// §1 the bytes are the founder's · §2 the pipe, re-run in a scratch tree from 5058d8c's document, gives the committed
// document byte for byte · §3 the register is empty and the document says so · §4 the header states what was run ·
// §5 mutations, run (each must redden its cell; r2: 5.5 and 5.6, a later migration leaves 2.2 green and a hand-edit still reddens it) · §6 the one record after the regen: 0210 (PRO P3), from its bytes.
// No timing cell. 0210's file rides PRO P3's package; on 5058d8c alone §2 and b15 are red (the record names 0210 before
// its file is there); on the combined tree (PRO P3, then this cut) they are green.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os'); const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);

const SNAP = 'docs/db/snapshots/2026-10-08';
const SHA = { 'cols.csv': 'cbe1c3d523eb38b3b5c27d94a2362eac17b57f777e5722f404bedba10d25cca7',
  's1.csv': '4ff8a0b16f3981c6975f4fa2caff614ea0aa156c83a4cc603a7203a969d4c878',
  's2.csv': '776b5ca15e93e3b253f3f3929d2bb5d48781cc70b239b263aaa44f275feabf88',
  's3.csv': 'ea9e99f70ec57bb3a905a69283378069abc4b5253cac0e9198a90341f73b7882' };
const ARGS = { date: '2026-10-08', tip: '0220', repo: '5058d8c' };
const PRIOR_DOC = execSync('git show 5058d8c:docs/db/PUBLIC_SCHEMA.md', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString();
const DOC = read('docs/db/PUBLIC_SCHEMA.md');

// The pipe, re-run in a scratch tree: db/queries (both generators), db/migrations (the ladder and the register, as
// given), docs/db/PUBLIC_SCHEMA.md (5058d8c's, the document the regen overwrote). Returns the regenerated document, or
// { abort } when either generator refuses.
// CE-47 WEB-4 cut 29 r2 (the chair, 8 October): THE LADDER IS TAKEN AS OF THE SNAPSHOT, never from the live folder.
// The document's header counts the files in db/migrations, so a migration that lands after the regen (CLB's 0221,
// PTN's 0222) must not move 2.2. The scratch ladder is 5058d8c's db/migrations (git archive, once), plus the register
// as committed now and the files its records name, taken from the live folder (0210 rides PRO P3; on 5058d8c alone it
// is absent and 2.1 is red, as it must be). `opts.live` names another live folder (5.5 and 5.6 use it).
const LADDER_AT = '5058d8c';
const LADDER = fs.mkdtempSync(path.join(os.tmpdir(), 'b300-ladder-'));
execSync(`git archive ${LADDER_AT} db/migrations | tar -x -C "${LADDER}"`, { cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'] });
process.on('exit', () => { try { fs.rmSync(LADDER, { recursive: true, force: true }); } catch (_e) { /* gone */ } });
function snapshotLadder(dst, live, registerText) {
  fs.cpSync(path.join(LADDER, 'db', 'migrations'), dst, { recursive: true });
  const reg = registerText !== undefined ? registerText : fs.readFileSync(path.join(live, 'OUT_OF_ORDER.json'), 'utf8');
  fs.writeFileSync(path.join(dst, 'OUT_OF_ORDER.json'), reg);
  const files = fs.readdirSync(live);
  for (const r of JSON.parse(reg).register || []) {
    const f = files.find((x) => x.startsWith(String(r.number).padStart(4, '0') + '_') && x.endsWith('.sql'));
    if (f) fs.copyFileSync(path.join(live, f), path.join(dst, f));
  }
}
function regen(opts) {
  const o = opts || {};
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b300-'));
  try {
    fs.mkdirSync(path.join(tmp, 'db', 'queries'), { recursive: true }); fs.mkdirSync(path.join(tmp, 'docs', 'db'), { recursive: true });
    for (const f of ['format_public_schema.js', 'append_constraints_to_public_schema.js']) fs.copyFileSync(P('db/queries/' + f), path.join(tmp, 'db', 'queries', f));
    snapshotLadder(path.join(tmp, 'db', 'migrations'), o.live || P('db/migrations'), o.register);
    fs.writeFileSync(path.join(tmp, 'docs', 'db', 'PUBLIC_SCHEMA.md'), PRIOR_DOC);
    const csv = {}; for (const f of Object.keys(SHA)) { csv[f] = path.join(tmp, f); fs.writeFileSync(csv[f], o.csv && o.csv[f] !== undefined ? o.csv[f] : read(`${SNAP}/${f}`)); }
    const out = path.join(tmp, 'docs', 'db', 'PUBLIC_SCHEMA.md');
    const a = spawnSync(process.execPath, [path.join(tmp, 'db', 'queries', 'format_public_schema.js'), csv['cols.csv'], out, ARGS.date, ARGS.tip, ARGS.repo], { encoding: 'utf8', cwd: tmp });
    if (a.status !== 0) return { abort: 'format', log: (a.stdout || '') + (a.stderr || '') };
    const b = spawnSync(process.execPath, [path.join(tmp, 'db', 'queries', 'append_constraints_to_public_schema.js'), csv['s1.csv'], csv['s2.csv'], csv['s3.csv'], ARGS.date, ARGS.tip, ARGS.repo], { encoding: 'utf8', cwd: tmp });
    if (b.status !== 0) return { abort: 'append', log: (b.stdout || '') + (b.stderr || '') };
    return { doc: fs.readFileSync(out, 'utf8') };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

sec('1  the bytes are the founder\'s (taken 8 October 2026, 20:05 IST, row limit off)');
for (const [f, h] of Object.entries(SHA)) {
  ok(() => crypto.createHash('sha256').update(fs.readFileSync(P(`${SNAP}/${f}`))).digest('hex') === h, `1.${Object.keys(SHA).indexOf(f) + 1} ${f} sha256 ${h.slice(0, 8)}... (the chair's)`);
}

sec('2  the pipe, re-run from the bytes, gives the committed document');
const R0 = regen();
ok(() => R0.doc !== undefined, '2.1 both generators run to the end on these bytes (every guard passes)', R0.log);
ok(() => R0.doc === DOC, '2.2 the regenerated document equals docs/db/PUBLIC_SCHEMA.md byte for byte (never hand-edited)');

sec('3  the register is paid; one record stands after it (0210, PRO P3, the chair\'s word of 8 October)');
const J = JSON.parse(read('db/migrations/OUT_OF_ORDER.json'));
const HIST = JSON.parse(execSync('git show 5058d8c:db/migrations/OUT_OF_ORDER.json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
ok(() => Array.isArray(J.register) && JSON.stringify(J.register.map((r) => r.number)) === '[210]' && JSON.stringify(J._README) === JSON.stringify(HIST._README), '3.1 OUT_OF_ORDER.json: the sixteen paid records are gone and exactly one stands, 0210; its README unchanged', JSON.stringify(J.register.map((r) => r.number)));
ok(() => JSON.stringify(HIST.register.map((r) => r.number)) === '[183,204,196,200,208,209,205,195,197,198,211,218,201,202,219,203]', '3.2 the sixteen records paid are the sixteen 5058d8c held, in history order');
ok(() => !/_No out-of-order migration is outstanding at this snapshot\._/.test(DOC) && /\| `0210_pro_brands_trends\.sql` \(\*\*CE-47 · PRO · P3/.test(DOC) && !/`0219_partner_send_log\.sql` \(/.test(DOC), '3.3 the document\'s register lists 0210 alone (the paid records are gone from it)');

sec('4  the header states what was run');
ok(() => /\*\*Snapshot taken:\*\* 2026-10-08,[^\n]*\*\*157 tables, 1839 columns\.\*\*/.test(DOC), '4.1 157 tables, 1839 columns, taken 2026-10-08');
ok(() => /\*\*Applied ladder tip at snapshot:\*\* `0220`/.test(DOC) && /\*\*Repo tip at authoring:\*\* `5058d8c`/.test(DOC), '4.2 ladder tip 0220 (vendor_first_builds is in the bytes); repo tip 5058d8c');
ok(() => /§1 \*\*616\/616\*\* · §2 \*\*251\/251\*\* · §3 \*\*503\/503\*\*/.test(DOC), '4.3 the addendum\'s three guards: 616, 251, 503');
ok(() => DOC.includes('## public.vendor_first_builds ') && DOC.includes('## public.partner_send_log '), '4.4 the newest tables are carried (0220 and 0219)');

sec('5  mutations, run');
{ const cut = read(`${SNAP}/cols.csv`).split('\n'); const i = cut.findIndex((l, k) => k > 0 && /^157,/.test(l)); const capped = cut.slice(0, i).concat(cut.slice(i).join('\n').replace(/^157,[^\n]*"[^"]*"\n?/, '').split('\n')).join('\n');
  const r = regen({ csv: { 'cols.csv': capped } });
  ok(() => r.abort === 'format', '5.1 one table dropped from cols.csv (a capped result): the formatter refuses, nothing written (2.1 reddens)', r.log && r.log.slice(0, 200)); }
{ const s2 = read(`${SNAP}/s2.csv`).split('\n'); const r = regen({ csv: { 's2.csv': s2.slice(0, -2).concat(s2.slice(-1)).join('\n') } });
  ok(() => r.abort === 'append', '5.2 one foreign key dropped from s2.csv: the appender refuses (2.1 reddens)'); }
{ const back = JSON.stringify(Object.assign({}, J, { register: J.register.concat(HIST.register.filter((r) => r.number === 203)) }), null, 2) + '\n';
  const r = regen({ register: back });
  ok(() => r.doc !== undefined && r.doc !== DOC, '5.3 a paid record left in the register: the document differs (2.2 reddens)'); }
ok(() => DOC.replace('157 tables, 1839 columns', '157 tables, 1840 columns') !== R0.doc, '5.4 one hand-edit of the document: it no longer equals the pipe\'s (2.2 reddens)');
// r2: a migration landing after the snapshot (above the tip) leaves 2.2 green: the ladder is the snapshot's own.
{ const live = fs.mkdtempSync(path.join(os.tmpdir(), 'b300-live-'));
  try { fs.cpSync(P('db/migrations'), live, { recursive: true }); fs.writeFileSync(path.join(live, '0299_after_the_snapshot.sql'), '-- a migration that lands after the regen\nSELECT 1;\n');
    const r = regen({ live }); ok(() => r.doc === DOC, '5.5 a new migration above the tip (0299, landing after the snapshot) leaves 2.2 green');
    const tampered = DOC.replace('**157 tables, 1839 columns.**', '**157 tables, 1838 columns.**');
    ok(() => tampered !== DOC && r.doc !== tampered, '5.6 with that later migration present, a hand-edit of the document is still caught (2.2 reddens)'); }
  finally { fs.rmSync(live, { recursive: true, force: true }); } }

sec('6  the record for 0210 (PRO P3), from its bytes');
const R10 = J.register.find((r) => r.number === 210) || { note: '', stale_for: '', state: '' };
const T10 = ['pro_brands', 'pro_pitches', 'pro_kits', 'pro_trend_briefs'];
const good210 = (x) => Boolean(x) && T10.every((t) => x.note.includes('`' + t + '`')) && /pro_pitch_record/.test(x.note) && x.stale_for === T10.map((t) => '`public.' + t + '`').join(', ')
  && /^OWED/.test(x.state) && /fills a hole below the applied ladder tip/.test(x.note) && /2615ae76/.test(x.note) && /Alters no existing table/.test(x.note);
ok(() => good210(R10), '6.1 0210: the four tables and the function named; RLS and the grants; stale_for exactly the four; OWED until the next PAIR regen; from its bytes');
ok(() => { const f = P('db/migrations/0210_pro_brands_trends.sql'); return !fs.existsSync(f) || crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') === '2615ae76fb12590c466b22743fe7759b490d5f2d7234935eb9e5178be46296c4'; }, '6.2 where 0210 is present (the combined tree), its bytes are the ones the record was written from');
ok(() => T10.every((t) => !DOC.includes('## public.' + t + ' ')), '6.3 the snapshot does not carry the four tables (they are owed, not paid)');
ok(() => !good210(Object.assign({}, R10, { stale_for: T10.slice(0, 3).map((t) => '`public.' + t + '`').join(', ') })), '6.4 mutation: a table left out of stale_for: 6.1 reddens');
{ const none = JSON.stringify(Object.assign({}, J, { register: [] }), null, 2) + '\n'; const r = regen({ register: none });
  ok(() => r.doc !== undefined && r.doc !== DOC, '6.5 mutation: the record removed: the document differs (2.2 reddens)'); }

console.log(`\nb300 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
