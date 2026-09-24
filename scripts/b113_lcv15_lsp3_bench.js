'use strict';
// scripts/b113_lcv15_lsp3_bench.js · CE-45 LCV-15 · LSP_3: the relay seat's chain era, deleted (L3-a)
//   §1  the dead set is absent: no definition, no export, no reader anywhere in src (with a grep CONTROL, C-44.4)
//   §2  the STAYS are present and callable; sendApproved (the door's one send leg) is byte-identical to 90f607d
//   §3  chat.js: RELAY_VERB_RE gone with its export; RELAY_CLAIM_RE, the guard's one home, kept
//   §4  composeBody gone, so runDonnaTurn has no caller outside src/engine
//   §5  the live relay YES through the REAL workingDoor to sendApprovedDraft: b101's card cell 4.4, run as a child and read by its line
//   §6  the money functions pinned to 90f607d (C-44.7)
//   §7  mutations of production code, each reddening its cell
// It reads no clock (C-44.13: nothing to shift, stated). Run: node scripts/b113_lcv15_lsp3_bench.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const src = (r) => fs.readFileSync(P(r), 'utf8');
const code = (t) => String(t).split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).map((l) => l.replace(/\/\/.*$/, '')).join('\n');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';
let pass = 0; let fail = 0; const failed = [];
function T(n, c) { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; failed.push(n); console.log(`  FAIL  ${n}`); } }
const sec = (t) => console.log(`\n${t}`);
const body = (t, name) => { const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return ''; let d = 0, st = false; for (let j = t.indexOf('{', i); j < t.length; j += 1) { if (t[j] === '{') { d += 1; st = true; } else if (t[j] === '}') { d -= 1; if (st && d === 0) return t.slice(i, j + 1); } } return ''; };
function compileAt(rel, text) { const file = P(rel); const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); m._compile(text, file); return m.exports; }
const RS = 'src/lib/vendor/relaySeat.js'; const CJ = 'src/api/vendor-engine/chat.js';
const DEAD = ['runRelaySeat', 'handleStage', 'handleSend', 'relayLaneLine', 'RELAY_CLAIM_RE_LOCAL', 'doorStage', 'extractRecipient', 'RECIPIENT_VERBS', 'NOT_A_NAME_RE',
  'buildPendingRelay', 'pendingRelayBlock', 'RELAY_STANDING_LAW', 'composeBody', 'doorAsked', 'RELAY_CONFIRM_SENT_BY', 'ASKING_KINDS', 'relayOutcomeAsks',
  'AFFIRM_RE', 'affirmativeNames', 'AFFIRM_PLAIN_RE', 'DECLINE_PLAIN_RE', 'askWhoLine', 'foldName', 'PWA_RELAY_UNAVAILABLE_LINE', 'collectSignals', 'STAGE_SIGNAL', 'SEND_SIGNAL'];
const STAYS = ['relayExpirySweep', 'relayReceipt', 'sendApprovedDraft', 'verbatimBody', 'looksLikeThePhone', 'declinedLine', 'expiredLine', 'noNumberLine', 'deliveredLine',
  'recipientLabel', 'showBlock', 'mismatchBlock', 'sentLine', 'windowClosedLine', 'windowUndeterminedLine', 'sendFailedLine', 'noLaneLine', 'doorbellLineV2', 'readLine', 'relaySubject', 'expiryNoticeLine'];
const PIN = {"planMoney":"2a7a1c76bf2efeabec03301805e5d5d2bdb38b310940284935496dad8b7f7efb","planPayment":"cddb6c299afe946ddfddf89cebb3a815c13db38cbd17c863a2b23a677244483e","planBooking":"086fbb9debf6a62fa52a8306037adef47cc1ece4e2ce2efd7e2c684a27e6a3fa","applyRow":"01f76e676659e01c3f0dd92b560726fcde136a8be4bcf3a12adf120cc7fc1b4b","reread":"e200a0f720c62637ea617ccacb508c9b7a0b58f49e7848323c5eff5a7bcdc8fc","sendApproved":"964ab08750cd354bbc0191180b878ccf97250eae3884bccec1ec7062268b44fd"};

(async () => {
  sec('1 the dead set is absent');
  const R = require(P(RS));
  const rs = code(src(RS));
  T(`1.1 none of the ${DEAD.length} is exported by relaySeat.js`, DEAD.every((n) => !(n in R)));
  T('1.2 none is DEFINED in relaySeat.js (function or const)', DEAD.every((n) => !new RegExp(`^(?:async function|function|const)\\s+${n}\\b`, 'm').test(rs)));
  const hits = execSync(`grep -rlnE --include=*.js --include=*.ts "\\b(${DEAD.join('|')})\\b" src || true`, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).filter((f) => !f.startsWith('src/engine/dist/'));
  const live = hits.filter((f) => new RegExp(`\\b(${DEAD.join('|')})\\b`).test(code(src(f))) && !/src\/engine\//.test(f));
  T('1.3 no file under src (the engine\'s own sources aside) names any of them outside a comment', live.length === 0);
  T('1.4 CONTROL: the grep finds them where comments still name them (an empty answer is not a broken grep)', hits.length > 0);

  sec('2 the STAYS');
  T(`2.1 all ${STAYS.length} live exports are present and callable`, STAYS.every((n) => typeof R[n] === 'function'));
  T('2.2 sendApproved (the door\'s one send leg) is byte-identical to 90f607d', sha(body(src(RS), 'sendApproved')) === PIN.sendApproved);
  T('2.3 relayToCouple.js and coupleDrafts.js are untouched (their blobs at 90f607d)', execSync('git diff --quiet 90f607d -- src/lib/vendor/relayToCouple.js src/lib/vendor/coupleDrafts.js; echo $?', { cwd: ROOT, encoding: 'utf8' }).trim() === '0');
  T('2.4 the historic rows\' cost literal \'relay_confirm\' stays in admin/router.js', /const AGENT_COST_SENT_BY = \['agent', 'relay_confirm'\];/.test(src('src/admin/router.js')));

  sec('3 chat.js');
  const C = require(P(CJ));
  T('3.1 RELAY_VERB_RE is neither exported nor defined', !('RELAY_VERB_RE' in C) && !/const RELAY_VERB_RE\s*=/.test(code(src(CJ))));
  T('3.2 RELAY_CLAIM_RE, the guard\'s one home, is kept and exported', C.RELAY_CLAIM_RE instanceof RegExp && C.RELAY_CLAIM_RE.test('Sent to Priya.'));

  sec('4 composeBody gone: runDonnaTurn has no caller outside src/engine');
  const donna = execSync('grep -rln --include=*.js "runDonnaTurn" src || true', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).filter((f) => !f.startsWith('src/engine/'));
  T('4.1 no file outside src/engine calls runDonnaTurn (comments aside)', donna.filter((f) => /runDonnaTurn\s*\(/.test(code(src(f)))).length === 0);

  sec('5 the live relay YES through the REAL workingDoor (b101\'s card, run whole)');
  const r = spawnSync(process.execPath, [P('scripts/b101_lcv11_relay_bench.js')], { cwd: ROOT, encoding: 'utf8', timeout: 200000 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  T('5.1 b101 is green at this tree (exit 0)', r.status === 0);
  T('5.2 its card cell 4.4 passed: her YES sends the STORED bytes from the vendor lane through sendApprovedDraft', /PASS\s+4\.4 THE CARD: her YES sends the STORED bytes/.test(out));

  sec('6 the money functions (C-44.7, hashes from 90f607d)');
  const wd = src('src/lib/vendor/workingDoor.js');
  for (const f of ['planMoney', 'planPayment', 'planBooking', 'applyRow', 'reread']) T(`6.1 ${f} is byte-identical to 90f607d`, sha(body(wd, f)) === PIN[f]);

  sec('7 mutations of production code');
  {
    const t = src(RS);
    const a = '  sendApprovedDraft: sendApproved,';
    T('7.1 the export anchor is present', t.includes(a));
    const M = compileAt(RS, t.replace(a, `${a}\n  runRelaySeat: async () => null,`));
    T('7.2 M1 a dead export restored reddens 1.1', 'runRelaySeat' in M);
    const N = compileAt(RS, t.replace(a, ''));
    T('7.3 M2 the send leg unexported reddens 2.1 (and b101 4.4 with it)', typeof N.sendApprovedDraft !== 'function');
  }
  {
    const t = src(CJ);
    const a = "module.exports.RELAY_CLAIM_RE";
    T('7.4 chat.js\'s RELAY_CLAIM_RE export anchor is present', t.includes(a));
  }

  console.log(`\nb113_lcv15_lsp3_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`   ${f}`)); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH THREW (unexpected):', e && e.stack || e); process.exit(2); });
