'use strict';
// scripts/b115_lcv15_lsp4_bench.js · CE-45 LCV-15 · LSP_4: F-05.56's island and the orphans it left, deleted (L4-a; 7.6 ruled (i))
//   §1 the island is absent (no entry point, no tool case, no banner; a grep CONTROL)   §2 the couple lane byte-identical by hash, the lone export
//   §3 engine.js's dropped requires and WA_MUTATING_TOOLS absent; the couple half's requires kept   §4 the four deleted paths absent (A-45.1), unrequired;
//   onboarding.js present and callerless (R2)   §5 floor-base without b08_p5_unblock (20 lines)   §6 the couple lane DRIVEN: b08_p5_unblock run whole
//   §7 the money functions pinned   §8 mutations. It reads no clock (C-44.13). Run: node scripts/b115_lcv15_lsp4_bench.js
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const { execSync, spawnSync } = require('child_process'); const Module = require('module');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r); const src = (r) => fs.readFileSync(P(r), 'utf8');
const code = (t) => String(t).split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).map((l) => l.replace(/\/\/.*$/, '')).join('\n');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'; process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';
let pass = 0; let fail = 0; const failed = [];
function T(n, c) { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; failed.push(n); console.log(`  FAIL  ${n}`); } }
const sec = (t) => console.log(`\n${t}`);
// the body from its signature to its closing brace, skipping a DESTRUCTURED parameter list (runCoupleAgenticTurn takes `({ … })`: a first-brace
// reader would pin the parameters alone, a hollow pin; the seat's first byte-identity read did exactly that and was re-derived with this one)
function body(t, name) {
  const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return '';
  let j = t.indexOf('(', i); let d = 0;
  for (; j < t.length; j += 1) { if (t[j] === '(') d += 1; else if (t[j] === ')') { d -= 1; if (d === 0) break; } }
  const k = t.indexOf('{', j); d = 0;
  for (let m = k; m < t.length; m += 1) { if (t[m] === '{') d += 1; else if (t[m] === '}') { d -= 1; if (d === 0) return t.slice(i, m + 1); } }
  return '';
}
function compileAt(rel, text) { const file = P(rel); const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(text, file); return m.exports; }
const EN = 'src/agent/engine.js';
// LABELED AMENDMENT · CE-45 ELZ-1 cut 1 (R-45.26, the chair's ruling on r2: "b115's pins move by label"): runCoupleAgenticTurn
// (FACT 1's read, the date_state tool) and relayAttributionPrefix (F-44.157, the studio first) re-pinned to cut 1's bytes; was
// 3c6235d33869 and cd1ef9aa05b6 at cd71986. markRelayProvenance, mergeSameRole and every money pin unchanged.
const PIN = {"runCoupleAgenticTurn":"ced902e22c42136655eb53f94edf77a324397252b7d330c291f8fb9353300392","relayAttributionPrefix":"2d00b510384e056828c5e873773c3ff56fd21633e8ba36816328b580aa40e6eb","markRelayProvenance":"85a17f5582fd938decfd62701a7e8c9524b24c0c28ae422e81f39d87e8aad0e5","mergeSameRole":"67e5b8d69484f55fc0da7f58b8864656fc1f887749e08bf65cf67097aa768732","planMoney":"2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb","planPayment":"cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e","planBooking":"086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa","applyRow":"01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b","reread":"e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc"};
const DELETED = ['src/agent/tools.js', 'src/agent/systemPrompt.js', 'src/agent/classifier.js', 'src/lib/vendor/replyToCouple.js'];
const ISLAND = ['handleOnboarding', 'executeTool', 'commit_event_proposals', 'WA_MUTATING_TOOLS'];

(async () => {
  sec('1 the island is absent');
  const en = src(EN);
  T('1.1 no F-05.56 banner in engine.js', !/F-05\.56 \u2014 EVERYTHING BELOW THIS LINE/.test(en));
  const hits = execSync(`grep -rlnE --include=*.js --include=*.ts "\\b(${ISLAND.join('|')})\\b" src || true`, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).filter((f) => !f.startsWith('src/engine/dist/'));
  const live = hits.filter((f) => new RegExp(`\\b(${ISLAND.join('|')})\\b`).test(code(src(f))));
  T('1.2 no file under src names handleOnboarding, executeTool, commit_event_proposals or WA_MUTATING_TOOLS outside a comment', live.length === 0);
  T('1.3 CONTROL: the grep finds them where comments still name them (an empty answer is not a broken grep)', hits.length > 0);
  // LABELED · ELZ-1 cut 1: the cap moves from 740 to 770 lines with R-45.26 (the fact read and the fourth tool); one export still.
  T('1.4 engine.js is the couple lane alone: 770 lines or fewer, one exported name', en.split('\n').length <= 770 && JSON.stringify(Object.keys(require(P(EN)))) === '["runCoupleAgenticTurn"]');

  sec('2 the couple lane, byte-identical (C-44.7, hashes from cd71986)');
  for (const f of ['runCoupleAgenticTurn', 'relayAttributionPrefix', 'markRelayProvenance', 'mergeSameRole']) T(`2.1 ${f} is byte-identical to its pin (cd71986; the couple turn and the prefix at ELZ-1 cut 1)`, sha(body(en, f)) === PIN[f]);
  T('2.2 the pin covers the whole couple turn (its body, not its parameters): over 20,000 characters', body(en, 'runCoupleAgenticTurn').length > 20000);

  sec('3 the requires');
  const req = (m) => new RegExp(`require\\('${m.replace(/[./]/g, (x) => `\\${x}`)}'\\)`).test(code(en));
  const GONE = ['./systemPrompt', './onboarding', './tools', '../lib/invoiceMessage', '../lib/waNumbers', '../lib/invoicePdf', '../lib/format', '../lib/clients', '../lib/whatsapp', '../lib/vendor/snapshot'];
  const KEPT = ['./coupleSystemPrompt', '../lib/modelRouter', '../lib/llm', '../lib/laneFlags', '../lib/coupleIdentity', '../lib/intentExtractor', '../lib/vendor/enquiryEnrichment'];
  T(`3.1 the ${GONE.length} requires only the island read are gone`, GONE.every((m) => !req(m)));
  T(`3.2 the ${KEPT.length} the couple lane reads are kept`, KEPT.every((m) => req(m)));

  sec('4 the deleted paths (A-45.1) and onboarding.js (R2)');
  T(`4.1 all ${DELETED.length} named paths are absent`, DELETED.every((p) => !fs.existsSync(P(p))));
  const requirers = execSync('grep -rlnE --include=*.js --include=*.ts "require\\([^)]*(agent/tools|agent/systemPrompt|agent/classifier|/replyToCouple|\\./tools|\\./systemPrompt|\\./classifier)\'" src || true', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).filter((f) => !f.startsWith('src/engine/'));
  T('4.2 nothing in src requires any of them', requirers.length === 0);
  const onb = execSync('grep -rlnE --include=*.js "require\\([^)]*onboarding\'\\)" src || true', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).filter((f) => !/brideOnboarding|vendorOnboarding/.test(f));
  T('4.3 onboarding.js is KEPT (R2) and callerless: present, and nothing in src requires ./onboarding', fs.existsSync(P('src/agent/onboarding.js')) && onb.filter((f) => /require\(['"]\.\/onboarding['"]\)|agent\/onboarding['"]/.test(code(src(f)))).length === 0);

  sec('5 floor-base (ruled (i): the line died with its red)');
  const fb = src('scripts/floor-base.txt');
  T('5.1 floor-base.txt holds no b08_p5_unblock line and 20 lines in all', !/b08_p5_unblock/.test(fb) && fb.split('\n').filter((l) => l.trim()).length === 20);

  sec('6 the couple lane DRIVEN (b08_p5_unblock run whole: runCoupleAgenticTurn over its double)');
  const r = spawnSync(process.execPath, [P('scripts/b08_p5_unblock_bench.js')], { cwd: ROOT, encoding: 'utf8', timeout: 200000 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  T('6.1 b08_p5_unblock exits 0 at this tree (it drives the real runCoupleAgenticTurn)', r.status === 0);
  T('6.2 its driven cell 1.1 passed: a month-only capture lands precision=month through the couple turn', /ok\s+\u00a7?1\.1 CREATE: a month-only capture lands precision=month/.test(out));

  sec('7 the money functions (C-44.7, hashes from cd71986)');
  const wd = src('src/lib/vendor/workingDoor.js');
  for (const f of ['planMoney', 'planPayment', 'planBooking', 'applyRow', 'reread']) T(`7.1 ${f} is byte-identical to cd71986`, sha(body(wd, f)) === PIN[f]);

  sec('8 mutations of production code');
  const a = 'module.exports = { runCoupleAgenticTurn };';
  T('8.1 the export anchor is present', en.includes(a));
  const M = compileAt(EN, en.replace(a, `async function executeTool() { return null; }\n${a}`));
  T('8.2 M1 an island entry point restored reddens 1.2 (its definition is code again)', /\bexecuteTool\b/.test(code(en.replace(a, `async function executeTool() { return null; }\n${a}`))) && typeof M.runCoupleAgenticTurn === 'function');
  const b2 = body(en, 'runCoupleAgenticTurn');
  T('8.3 M2 one byte of runCoupleAgenticTurn changed reddens 2.1', sha(b2.replace('iterations,', 'iterations ,')) !== PIN.runCoupleAgenticTurn);

  console.log(`\nb115_lcv15_lsp4_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`   ${f}`)); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH THREW (unexpected):', e && e.stack || e); process.exit(2); });
