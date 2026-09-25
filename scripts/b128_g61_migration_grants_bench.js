'use strict';
// scripts/b128_g61_migration_grants_bench.js · TDW CE-45 · G6-1 · F-44.168 · A-45.8 · rung b128.
//
// WHAT IT HOLDS: a migration that creates a table grants service_role SELECT, INSERT, UPDATE and DELETE on it IN THE
// SAME FILE (A-45.8). On this project a table created by postgres in public reaches service_role with only TRUNCATE,
// REFERENCES, TRIGGER (and MAINTAIN), per the founder's pg_default_acl witness of 25 September, so without its own grant
// the one role this estate reads with cannot read it: 0171 shipped that way and the door answered 500 (F-44.168).
// It reads every db/migrations/NNNN_*.sql from 0171 on (comments stripped), finds each CREATE TABLE and the GRANTs in the
// same file. 0171 is the ONE named exemption, cured by 0172, and the exemption is checked both ways (0171 still lacks
// the grant; 0172 grants exactly 0171's tables). The checker is proven on synthetic texts, and a production mutation of
// 0172 must redden it. No clock is read. THE EXIT CODE IS THE VERDICT.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const MIG = path.join(ROOT, 'db', 'migrations');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
let pass = 0; let fail = 0; const failed = [];
function ok(c, name, info) { if (c) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 220) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);

const NEED = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
const EXEMPT = { '0171_own_number.sql': { curedBy: '0172_own_number_grants.sql', why: 'F-44.168: 0171 shipped without grants; 0172 grants its two tables' } };
const strip = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
const norm = (t) => t.trim().replace(/^public\./i, '').replace(/"/g, '').toLowerCase();
function tablesCreated(sql) {
  const out = []; const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_."]+)/gi; let m;
  while ((m = re.exec(strip(sql)))) out.push(norm(m[1]));
  return out;
}
function grantsTo(sql, role) {
  const got = {}; const re = /GRANT\s+([A-Z ,]+?)\s+ON\s+(?:TABLE\s+)?([^;]+?)\s+TO\s+([^;]+);/gi; let m;
  while ((m = re.exec(strip(sql)))) {
    const grantees = m[3].split(',').map((g) => g.trim().toLowerCase());
    if (!grantees.includes(role)) continue;
    const privs = /^ALL(\s+PRIVILEGES)?$/i.test(m[1].trim()) ? NEED.slice() : m[1].split(',').map((p) => p.trim().toUpperCase());
    for (const t of m[2].split(',').map(norm)) got[t] = new Set([...(got[t] || []), ...privs]);
  }
  return got;
}
const missing = (sql) => { const g = grantsTo(sql, 'service_role'); return tablesCreated(sql).filter((t) => !NEED.every((p) => g[t] && g[t].has(p))); };

sec('1  the checker, proven on synthetic migrations (so a silent pass cannot be a blind grep)');
ok(JSON.stringify(missing('BEGIN; CREATE TABLE public.a (id int); COMMIT;')) === '["a"]', '1.1 a bare CREATE TABLE is caught');
ok(missing('CREATE TABLE IF NOT EXISTS public.a (id int); GRANT SELECT, INSERT, UPDATE, DELETE ON public.a TO service_role;').length === 0, '1.2 its full grant clears it');
ok(JSON.stringify(missing('CREATE TABLE public.a (id int); GRANT SELECT ON public.a TO service_role;')) === '["a"]', '1.3 a partial grant (SELECT only) is still caught');
ok(JSON.stringify(missing('CREATE TABLE public.a (id int); GRANT SELECT, INSERT, UPDATE, DELETE ON public.a TO anon;')) === '["a"]', '1.4 a grant to another role does not count');
ok(missing('CREATE TABLE public.a (id int); CREATE TABLE b (id int); GRANT ALL ON public.a, b TO service_role;').length === 0, '1.5 GRANT ALL and a table list both count');
ok(JSON.stringify(missing('CREATE TABLE public.a (id int); -- GRANT SELECT, INSERT, UPDATE, DELETE ON public.a TO service_role;')) === '["a"]', '1.6 a commented-out grant does not count');

sec('2  every table-creating migration from 0171 on (A-45.8)');
const files = fs.readdirSync(MIG).filter((f) => /^\d{4}_.*\.sql$/.test(f) && Number(f.slice(0, 4)) >= 171).sort();
ok(files.includes('0171_own_number.sql') && files.includes('0172_own_number_grants.sql'), '2.0 the scope includes 0171 and 0172', files.join(' '));
const offenders = files.filter((f) => !EXEMPT[f]).map((f) => [f, missing(fs.readFileSync(path.join(MIG, f), 'utf8'))]).filter(([, m]) => m.length);
ok(offenders.length === 0, '2.1 every CREATE TABLE from 0171 on (the exemption aside) grants service_role SELECT, INSERT, UPDATE, DELETE in its own file', JSON.stringify(offenders));

sec('3  the one exemption, held both ways');
const m171 = fs.readFileSync(path.join(MIG, '0171_own_number.sql'), 'utf8');
const t171 = tablesCreated(m171).sort();
ok(JSON.stringify(t171) === '["vendor_wa_events","vendor_wabas"]' && missing(m171).length === 2, '3.1 0171 still creates its two tables without the grant (the exemption is not stale)', JSON.stringify(t171));
const P172 = path.join(MIG, '0172_own_number_grants.sql');
const m172 = fs.readFileSync(P172, 'utf8');
const g172 = grantsTo(m172, 'service_role');
const cures = (sql) => { const g = grantsTo(sql, 'service_role'); return t171.every((t) => NEED.every((p) => g[t] && g[t].has(p))); };
ok(cures(m172) && Object.keys(g172).sort().join() === t171.join(), '3.2 0172 grants service_role all four on exactly 0171\u2019s two tables, nothing else');
const s172 = strip(m172);
ok(!/\bTO\s+[^;]*\b(anon|authenticated|public)\b/i.test(s172) && /\bBEGIN\s*;[\s\S]*\bCOMMIT\s*;/i.test(s172) && /--\s+REVOKE SELECT, INSERT, UPDATE, DELETE ON public\.vendor_wabas, public\.vendor_wa_events FROM service_role;/.test(m172),
  '3.3 0172 grants nothing to anon, authenticated or PUBLIC (0170\u2019s line), in one transaction, its revert commented');
ok(Object.keys(EXEMPT).length === 1 && EXEMPT['0171_own_number.sql'].curedBy === '0172_own_number_grants.sql', '3.4 the exemption table names 0171 alone, cured by 0172');

sec('4  mutation of production code (must turn its cell red; restored by sha)');
const before = sha(m172);
const mut = m172.replace('GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_wa_events TO service_role;\n', '');
let applied = mut !== m172; let red = false;
if (applied) { fs.writeFileSync(P172, mut); try { red = !cures(fs.readFileSync(P172, 'utf8')); } finally { fs.writeFileSync(P172, m172); } }
ok(applied && red && sha(fs.readFileSync(P172, 'utf8')) === before, '4 M1 0172 loses vendor_wa_events\u2019 grant: applies, reddens 3.2, restored by sha', JSON.stringify({ applied, red }));

console.log(`\nb128 · ${pass} pass · ${fail} fail`);
if (fail) { console.log('FAILED: ' + failed.join(' | ')); process.exit(1); }
process.exit(0);
