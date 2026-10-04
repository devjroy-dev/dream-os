// scripts/b207_ce47_web4_cut12_bench.js
// TDW · CE-47 · WEB-4 cut 12 · b207 — F-44.272, OPTION A: 0193 MAKES THE FILES MATCH THE LIVE DATABASE, A NO-OP LIVE.
// Source cells on db/migrations/0193_live_links_declared.sql (the 22 links verbatim and guarded; pending_actions dropped
// if it exists; discover_heroes as live, every statement guarded; no row written) and on the stale comment. The database
// proof is b207r (scripts/lib/b207r_0193_rehearse.sh, Postgres 16): live copy unchanged, files' copy brought to live.
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..'); const read = (r) => { try { return fs.readFileSync(path.join(ROOT, r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
const M = read('db/migrations/0193_live_links_declared.sql');
const code = M.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
const LIVE = read('scripts/lib/b207r_0193_live_links.sql').split('\n').filter((l) => l.startsWith('ALTER TABLE'))
  .map((l) => { const m = l.match(/^ALTER TABLE public\.(\w+) ADD CONSTRAINT (\w+) (.*);$/); return m && { tbl: m[1], con: m[2], def: m[3] }; }).filter(Boolean);

sec('1  the 22 links, exactly as the live catalogue gives them');
const rows = [...code.matchAll(/\('(\w+)', '(\w+)', '((?:[^']|'')*)'\)/g)].map((m) => ({ tbl: m[1], con: m[2], def: m[3].replace(/''/g, "'") }));
ok(() => LIVE.length === 22 && rows.length === 22, '1.1 twenty-two links declared, the same count as the founder\'s live read', `${rows.length}/${LIVE.length}`);
ok(() => LIVE.every((l) => rows.some((r) => r.tbl === l.tbl && r.con === l.con && r.def === l.def)), '1.2 each is the live link verbatim: table, constraint name, pg_get_constraintdef text');
ok(() => new Set(rows.map((r) => r.tbl)).size === 7 && rows.every((r) => ['contracts', 'payment_schedules', 'tds_ledger', 'team_members', 'team_messages', 'team_payments', 'team_tasks'].includes(r.tbl)), '1.3 on the seven tables only');
ok(() => /IF to_regclass\('public\.' \|\| l\.tbl\) IS NOT NULL\s+AND NOT EXISTS \(SELECT 1 FROM pg_constraint c WHERE c\.conname = l\.con AND c\.conrelid = to_regclass\('public\.' \|\| l\.tbl\)\) THEN/.test(code), '1.4 each is added only where its table exists and no constraint of that NAME is on it (a no-op live)');

sec('2  pending_actions, discover_heroes, and nothing else');
ok(() => /^DROP TABLE IF EXISTS public\.pending_actions;$/m.test(code) && (code.match(/DROP TABLE/g) || []).length === 1, '2.1 the one table drop: pending_actions, IF EXISTS (absent live)');
ok(() => /DROP COLUMN IF EXISTS vendor_id;/.test(code) && /ADD COLUMN IF NOT EXISTS cloudinary_public_id text;/.test(code) && /ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now\(\);/.test(code), '2.2 discover_heroes as live: vendor_id out, cloudinary_public_id and updated_at in, each guarded');
ok(() => /IS DISTINCT FROM 'uuid_generate_v4\(\)' THEN\s+ALTER TABLE public\.discover_heroes ALTER COLUMN id SET DEFAULT uuid_generate_v4\(\);/.test(code), '2.3 the id default set only where it differs from live\'s');
ok(() => code.length > 0 && !/\b(INSERT|UPDATE|DELETE|TRUNCATE)\b/i.test(code.replace(/ON DELETE (CASCADE|SET NULL)/g, '')), '2.4 no row is written, changed or removed by 0193');
ok(() => /^BEGIN;$/m.test(code) && /^COMMIT;$/m.test(code), '2.5 one transaction');
ok(() => fs.readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => /^0193_/.test(f)).length === 1 && fs.existsSync(path.join(ROOT, 'db/migrations/0192_meta_gate_rows.sql')), '2.6 0193 is the one migration at its number, after 0192');

sec('3  the stale word, and nothing reads pending_actions');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
const src = walk(path.join(ROOT, 'src')).filter((f) => !f.includes(`${path.sep}engine${path.sep}dist${path.sep}`));
ok(() => src.every((f) => !/from\(['"]pending_actions['"]\)/.test(fs.readFileSync(f, 'utf8'))), '3.1 no server code reads or writes pending_actions');
ok(() => /`pending_actions`, once named here\n\/\/ beside `notes`, does not exist in the live database; 0193 drops it from the files\.\)/.test(read('src/lib/prospectExit.js')) && !/`notes` \(0002:32\) and `pending_actions` \(0002:46\) both key/.test(read('src/lib/prospectExit.js')), '3.2 prospectExit.js no longer counts pending_actions in its blast radius, and says why');

sec('4  mutations, run against these cells');
const strip = (s) => s.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
const mut1 = strip(M.replace("       AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conname = l.con AND c.conrelid = to_regclass('public.' || l.tbl)) THEN", '       THEN'));
ok(() => mut1 !== code && !/AND NOT EXISTS \(SELECT 1 FROM pg_constraint/.test(mut1), '4.1 the name guard removed: 1.4\'s pattern is gone (b207r r3.1 shows live then refuses)');
const mut2 = strip(M.replace("DROP TABLE IF EXISTS public.pending_actions;", 'DELETE FROM public.pending_actions;'));
ok(() => /\bDELETE\b/.test(mut2.replace(/ON DELETE (CASCADE|SET NULL)/g, '')), '4.2 a row-writing statement slipped in: 2.4\'s scan catches it');

console.log(`\nb207 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
