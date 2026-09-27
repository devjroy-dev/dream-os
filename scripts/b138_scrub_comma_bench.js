'use strict';
// scripts/b138_scrub_comma_bench.js  RUNG b138 · CE-46 ASK-2 cut 2a · F-44.210. THE EXIT CODE IS THE VERDICT.
// scrub.js's register arm (registerScrub, REGISTER_RE) took the comma AFTER a rupee figure as part of the figure, so every money
// line that a comma follows lost its punctuation on the way to the vendor ("Rs 76,000, due 30 September" read "Rs 76,000 due 30
// September"). Found by running the question agent's 34 worked replies through scrubText (the read-first of 27 September).
//   §1  a comma is part of a figure only when a digit follows it: grouped figures stay grouped, a trailing comma survives
//   §2  the question agent's worked replies (askAgent.EXAMPLES, every "Good reply") pass scrubText byte-identical
//   §3  the door's money lines pass scrubText byte-identical (doorLines.render, the B73 form and the tally)
//   §4  the arm's standing guarantees are untouched (b06_m4 §2.5's own assertion, repeated here as a control)
//   §5  the mutation: the pre-cure pattern restored reddens §1 and §2; the file is restored and the dirt check gates the verdict
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const src = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
let pass = 0; let fail = 0; const failed = [];
function T(name, cond, detail) { if (cond) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ''}`); } }
const sec = (t) => console.log(`\n${t}`);
const SCf = 'src/lib/vendor/scrub.js';
const fresh = (rel) => { delete require.cache[P(rel)]; return require(P(rel)); };

const goodReplies = (AA) => [...AA.EXAMPLES.matchAll(/Good reply[^:]*: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
const CASES = [
  ['Rs 76,000, due 30 September 2026', 'Rs 76,000, due 30 September 2026'],
  ['Kavita Rao, Before the wedding, Rs 76,000, due 30 September 2026.', 'Kavita Rao, Before the wedding, Rs 76,000, due 30 September 2026.'],
  ['Rs 1,50,000, quoted on 21 September 2026', 'Rs 1,50,000, quoted on 21 September 2026'],
  ['Rs 80,000,', 'Rs 80,000,'],
  ['₹20,000, twice', 'Rs 20,000, twice'],
  ['Rs 1,50,000.', 'Rs 1,50,000.'],
  ['Rs 5000', 'Rs 5,000'],
  ['advance of ₹4 lakh', 'advance of Rs 4,00,000'],
  ['2 lakh, 3 lakh', 'Rs 2,00,000, Rs 3,00,000'],
];
function pins(SC) {
  const r = CASES.map(([i, o]) => SC.registerScrub(i) === o);
  return { all: r.every(Boolean), failed: CASES.filter((_c, k) => !r[k]).map((c) => c[0]) };
}

async function main() {
  const SC = fresh(SCf);
  const AA = require(P('src/lib/vendor/askAgent.js'));
  const DL = require(P('src/lib/vendor/doorLines.js'));

  sec('§1 a comma is part of a figure only when a digit follows it');
  { const p = pins(SC); T('1.1 nine forms both ways: a trailing comma survives, grouped figures stay grouped, scale words still re-dress', p.all, p.failed.join(' | ')); }
  T('1.2 the whole wire: scrubText keeps the comma too (the arm runs inside it)', SC.scrubText('Due this week, Rs 76,000: Kavita Rao, Before the wedding, Rs 76,000, due 30 September 2026.') === 'Due this week, Rs 76,000: Kavita Rao, Before the wedding, Rs 76,000, due 30 September 2026.');
  T('1.3 the pattern in the file: a comma joins digits only (the byte, read as text)', src(SCf).includes(String.raw`(\d+(?:,\d+)*(?:\.\d+)?)`) && !src(SCf).includes(String.raw`([\d,]+(?:\.\d+)?)`));

  sec('§2 the question agent\'s worked replies survive the wire byte-identical');
  { const g = goodReplies(AA); const bad = g.filter((x) => SC.scrubText(x) !== x); T(`2.1 ${g.length} worked replies through scrubText: every one byte-identical`, g.length >= 34 && bad.length === 0, bad.slice(0, 2).join(' | ')); }

  sec('§3 the door\'s money lines survive the wire byte-identical');
  { const week = DL.weekLines([{ client: 'Priya Nair', milestone: 'Delivery', amount: '18,000', date: '30 September 2026' }, { client: 'Kavita Rao', milestone: 'Advance', amount: '76,000', date: '2 October 2026' }], []); T('3.1 two B73 lines', typeof week === 'string' && SC.scrubText(week) === week); }
  { const tally = DL.render('B80', { total: '10,66,000', n: 18 }); T('3.2 the tally B80', typeof tally === 'string' && SC.scrubText(tally) === tally); }
  T('3.3 a comma after a rupee figure inside a door sentence', SC.scrubText('Owed: Rs 1,33,000, and Rs 80,000, by 1 October 2026.') === 'Owed: Rs 1,33,000, and Rs 80,000, by 1 October 2026.');

  sec('§4 the arm\'s standing guarantees (control)');
  T('4.1 b06_m4 §2.5: "advance of ₹4 lakh" reads Rs 4,00,000', SC.registerScrub('advance of ₹4 lakh') === 'advance of Rs 4,00,000');
  T('4.2 the persona and id floors still run after the arm', SC.scrubText('Harvey says Rs 5000, lead-7') === 'Victor says Rs 5,000, ');

  sec('§5 the mutation: the pre-cure pattern restored must redden §1 and §2');
  const before = sha(src(SCf));
  const FROM = String.raw`(\d+(?:,\d+)*(?:\.\d+)?)(?:\s*(cr|crore|crores|l|lakh|lakhs|lac|lacs|k|thousand)\b)?`;
  const TO = String.raw`([\d,]+(?:\.\d+)?)(?:\s*(cr|crore|crores|l|lakh|lakhs|lac|lacs|k|thousand)\b)?`;
  let reddened = false; let note = '';
  const orig = src(SCf);
  try {
    if (orig.split(FROM).length !== 2) note = 'anchor not unique or absent';
    else {
      fs.writeFileSync(P(SCf), orig.replace(FROM, TO));
      const M = fresh(SCf);
      const p = pins(M); const g = goodReplies(AA).filter((x) => M.scrubText(x) !== x);
      reddened = !p.all && g.length > 0;
      note = `pins failed ${p.failed.length}, replies changed ${g.length}`;
    }
  } catch (e) { note = e.message; reddened = true; }
  finally { fs.writeFileSync(P(SCf), orig); fresh(SCf); }
  T('5.1 M1 the old pattern `[\\d,]+` restored: §1 and §2 redden', reddened, note);
  const dirt = execSync('git status --porcelain -- src/lib/vendor/scrub.js', { cwd: ROOT, encoding: 'utf8' });
  T('5.2 scrub.js restored to its pre-mutation sha256 (A-45.4\'s dirt check gates the verdict)', sha(src(SCf)) === before, dirt.trim());

  console.log(`\nb138_scrub_comma_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log('FAILED:'); failed.forEach((f) => console.log(`  ${f}`)); }
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.log(`b138 ERROR ${e && e.stack}`); process.exit(2); });
