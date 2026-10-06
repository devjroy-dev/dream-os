// scripts/b220_ins_a_rules_bench.js
// TDW · CE-47 · INS-A · b220 — THE INSURANCE ROOM'S RULES (src/lib/vendor/insurance.js), THE READER'S CHECKS
// (policyRead.js), THE FULL MONTH (format.js) AND MIGRATION 0200. Pure cells against fixture IST days; §6 mutates
// the source in a temporary copy and requires each mutation to turn a named cell red.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const ROOT = process.env.B220_ROOT || path.join(__dirname, '..');
const read = (r) => { try { return fs.readFileSync(path.join(ROOT, r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; if (!process.env.B220_QUIET) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); if (!process.env.B220_QUIET) console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => { if (!process.env.B220_QUIET) console.log(`\n§${t}`); };
const fresh = (r) => { const p = path.join(ROOT, r); delete require.cache[require.resolve(p)]; return require(p); };

// AMENDED BY LABEL, INS-A r3: the rules refuse to load on a non-canonical trade, so loading is itself a cell.
let I = null, loadErr = null; try { I = fresh('src/lib/vendor/insurance.js'); } catch (e) { loadErr = e.message; }
ok(() => I !== null, '0.1 the rules load: every trade checked against the canonical eleven at load', loadErr);
if (!I) {   // nothing below can run without the rules: say so and stop, in both the normal and the mutation protocol
  if (process.env.B220_WANT) { console.log(failed.some((n) => n.startsWith(process.env.B220_WANT + ' ')) ? `RED ${process.env.B220_WANT}` : 'NOT RED'); process.exit(0); }
  console.log(`\nb220 · ${pass} PASS · ${fail} FAIL (the rules did not load; nothing else ran)`); process.exit(1);
}
const F = fresh('src/lib/format.js');
const R = fresh('src/lib/vendor/policyRead.js');
const T = '2026-10-04';
const P = (o) => ({ ends_on: '2027-02-14', confirmed_at: '2026-10-01T00:00:00Z', deleted_at: null, ...o });

sec('1  the full month, the rupees');
ok(() => F.formatDateLong('2027-02-14') === '14 February 2027', '1.1 a date-only string reads as its calendar day, full month');
ok(() => F.formatDateLong('2026-11-02') === '2 November 2026', '1.2 no leading zero, full month');
ok(() => F.formatDateLong(null) === null && F.formatDateLong('nope') === null, '1.3 nothing in, nothing out');
ok(() => typeof F.formatDate === 'function' && F.formatDate('2027-02-14') === '14 Feb 2027', '1.4 the short form is untouched');

sec('2  kinds of cover: kinds, never products');
const mua = I.kindsFor({ trade: 'makeup', gearValue: 400000, eventsPerYear: 60, worksAtVenues: true }).map((k) => k.key);
ok(() => JSON.stringify(mua) === JSON.stringify(['equipment', 'public_liability', 'personal_accident']), '2.1 a makeup artist at venues with kit and 60 events: kit, liability, accident, in table order', mua);
ok(() => I.kindsFor({ trade: 'jewellery' }).map((k) => k.key).includes('jewellers_block'), '2.2 jewellery brings jeweller\'s block');
ok(() => I.kindsFor({ trade: 'planner', holdsClientMoney: true }).some((k) => k.key === 'professional_indemnity'), '2.3 a planner holding client money: professional indemnity');
ok(() => I.KINDS.every((k) => k.example && k.example.length > 30), '2.4 every kind carries a wedding example');
// AMENDED BY LABEL, INS-A r3 (the floor's bOB 6.1 red): the trades are the canonical eleven, read through the one alias table.
const CANON = fresh('src/agent/categories.js').VENDOR_CATEGORIES;
ok(() => I.KINDS.every((k) => k.trades.every((t) => CANON.includes(t))), '2.8 every trade a kind names is one of the canonical eleven');
ok(() => /require\('\.\.\/\.\.\/agent\/categories'\)/.test(read('src/lib/vendor/insurance.js')) && /require\('\.\/categoryFraming'\)/.test(read('src/lib/vendor/insurance.js')), '2.9 the list and the alias table are imported from their homes, not copied');
ok(() => I.kindsFor({ trade: 'catering' }).some((k) => k.key === 'public_liability') && I.kindsFor({ trade: 'Photography' }).some((k) => k.key === 'equipment') && I.kindsFor({ trade: 'mehendi' }).length === 0, '2.10 a retired or loose word is read through the alias table (catering → venue_catering, mehendi → other)');
const allWords = JSON.stringify(I.KINDS) + JSON.stringify(I.DESTINATIONS);
ok(() => !/\b(recommend|best|top|cheapest|ranked|rating)\b/i.test(allWords), '2.5 no recommending or ranking word anywhere in the room\'s words');
ok(() => !/\b(couple|bride)\b/i.test(allWords + read('src/lib/vendor/insuranceRoom.js').replace(/^\s*\/\/.*$/gm, '')), '2.6 no "couple" or "bride" in a word a vendor reads');
ok(() => JSON.stringify(I.KIND_KEYS) === JSON.stringify(['equipment', 'public_liability', 'professional_indemnity', 'goods_in_transit', 'shop_and_stock', 'jewellers_block', 'personal_accident', 'event_cancellation', 'other']), '2.7 the kind keys are exactly 0200\'s check list');

sec('3  where to buy: A to Z, labelled, no price');
const D = I.destinations();
ok(() => D.length === 14 && D.map((d) => d.name).join('|') === D.map((d) => d.name).slice().sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })).join('|'), '3.1 fourteen, A to Z');
ok(() => D.some((d) => d.name === 'Acko' && d.label === 'Insurer'), '3.2 Acko is listed (ruling a)');
ok(() => D.filter((d) => d.label === 'Comparison site').map((d) => d.name).sort().join() === 'InsuranceDekho,Policybazaar', '3.3 the two brokers are labelled "Comparison site" (ruling 3)');
ok(() => D.every((d) => /^https:\/\/[a-z0-9.-]+\.[a-z.]+$/.test(d.url) && d.mode === 'link'), '3.4 each is an https home page and a plain link');
// AMENDED BY LABEL, INS-A r2 (CE-47 ruling b, 6 October): `fee_line` joins each entry; still no price, rank or score.
ok(() => D.every((d) => Object.keys(d).sort().join() === 'fee_line,label,mode,name,url'), '3.5 no price, rank or score field travels');
// r2 · the founder's principle: "Get a quote" says plainly what it is, and the brief says where each figure came from.
ok(() => D.every((d) => d.fee_line === `This opens ${d.name}'s own website. ${d.name} sets its own price and may charge its own fees. TDW takes nothing.`), '3.6 every entry names its own fees and says TDW takes nothing (ruling b)');
ok(() => I.NOT_CHECKED === 'Details confirmed by you. Not checked by TDW.', '3.7 a policy row says plainly it is not checked by TDW (ruling b)');
const BR = I.coverBrief({ studioName: 'Swati Roy Makeup', trade: 'Makeup', city: 'Delhi', weddingsCounted: 14, bookedDays: 38, answers: { gearValue: 400000, worksAtVenues: true, holdsClientMoney: false }, kindKeys: ['equipment', 'public_liability', 'car'] });
ok(() => BR.includes('Weddings delivered through The Dream Wedding: 14 (counted by The Dream Wedding).') && BR.includes('Wedding days booked in the next 12 months: 38 (from the studio\'s own calendar on The Dream Wedding).'), '3.8 the two figures only TDW holds, each saying where it came from', BR);
ok(() => BR.includes('Value of kit and equipment: Rs 4,00,000 (as stated by the studio).') && BR.includes('Works at venues: Yes (as stated by the studio).') && BR.includes('Holds client money before the event: No (as stated by the studio).'), '3.9 her own answers marked as hers, money in Rs with Indian grouping');
ok(() => BR.includes('Kinds of cover to quote for: Kit and equipment cover, Public liability.') && !/car/i.test(BR.split('\n').slice(-2).join(' ')), '3.10 only real kinds travel; an unknown key is dropped');
ok(() => !/\b(recommend|best|top|cheapest|ranked|rating|couple|bride)\b/i.test(BR), '3.11 the brief recommends nothing and names no client');
const BR0 = I.coverBrief({ studioName: '', weddingsCounted: null, bookedDays: undefined });
ok(() => BR0.startsWith('Cover enquiry from a wedding studio.') && BR0.includes(': 0 (counted') && !BR0.includes('Rs ') && !BR0.includes('Works at venues'), '3.12 with nothing known, zeros are said and unanswered lines are left out, never guessed');

sec('4  a policy\'s state, and the public mark');
ok(() => I.policyState('2027-02-14', T).key === 'in_date' && I.policyState('2026-11-02', T).key === 'renew_soon' && I.policyState('2026-10-03', T).key === 'ended', '4.1 in date, renew soon from 30 days, ended');
ok(() => I.policyState('2026-10-04', T).key === 'renew_soon', '4.2 the last day is still in date');
const m = I.insuredMark({ showMark: true, studioName: 'Swati Roy Makeup', todayKey: T, policies: [P({}), P({ ends_on: '2026-11-02' })] });
ok(() => m && m.label === 'Insured' && m.until === '2027-02-14', '4.3 switch on and a policy in date: the mark, dated by the latest end');
ok(() => m && m.text === 'Policy uploaded by Swati Roy Makeup, valid until 14 February 2027. Details confirmed by Swati Roy Makeup; TDW has not verified the policy.', '4.4 the ruled tap text, with the studio name (ruling b)');
ok(() => I.insuredMark({ showMark: false, studioName: 'S', todayKey: T, policies: [P({})] }) === null, '4.5 switch off: no mark');
ok(() => I.insuredMark({ showMark: true, studioName: 'S', todayKey: T, policies: [P({ ends_on: '2026-10-03' })] }) === null, '4.6 every policy ended: no mark (it comes off by itself)');
ok(() => I.insuredMark({ showMark: true, studioName: 'S', todayKey: T, policies: [P({ confirmed_at: null })] }) === null, '4.7 an unconfirmed policy never counts');
ok(() => I.insuredMark({ showMark: true, studioName: 'S', todayKey: T, policies: [P({ deleted_at: '2026-10-02T00:00:00Z' })] }) === null, '4.8 a deleted policy never counts');

sec('5  reminders: 30 and 7, each once');
ok(() => I.reminderDue(P({ ends_on: '2026-11-03' }), T) === 30, '5.1 thirty days out: the 30-day reminder');
ok(() => I.reminderDue(P({ ends_on: '2026-11-03', reminded_30_on: T }), T) === null, '5.2 once sent, not again');
ok(() => I.reminderDue(P({ ends_on: '2026-10-11', reminded_30_on: '2026-09-11' }), T) === 7, '5.3 seven days out: the 7-day reminder');
ok(() => I.reminderDue(P({ ends_on: '2026-12-31' }), T) === null && I.reminderDue(P({ ends_on: '2026-10-01' }), T) === null, '5.4 nothing far out, nothing after the end');
ok(() => I.reminderText(P({ kind: 'public_liability', insurer: 'ICICI Lombard', ends_on: '2026-11-02' }), T) === 'Your public liability with ICICI Lombard ends on 2 November 2026, in 29 days. Open Insurance in Business Solutions to add the renewed policy.', '5.5 the words count from today, full month');

sec('5b  the reader hands back only what passes the save door\'s checks');
ok(() => JSON.stringify(R.clean({ insurer: 'HDFC ERGO', kind: 'equipment', cover_amount_rupees: 300000, ends_on: '2027-02-14' })) === JSON.stringify({ insurer: 'HDFC ERGO', kind: 'equipment', cover_amount: 300000, ends_on: '2027-02-14' }), '5b.1 a clean read pre-fills all four');
ok(() => Object.values(R.clean({ insurer: '', kind: 'car', cover_amount_rupees: '3 lakh', ends_on: '14/02/2027' })).every((v) => v === null), '5b.2 a doubtful read pre-fills nothing');

sec('5c  migration 0200');
const M = read('db/migrations/0200_insurance_room.sql'); const code = M.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
ok(() => /^BEGIN;$/m.test(code) && /^COMMIT;$/m.test(code), '5c.1 one transaction');
ok(() => (code.match(/CREATE TABLE public\.(\w+)/g) || []).join() === 'CREATE TABLE public.vendor_policies,CREATE TABLE public.vendor_insurance_settings', '5c.2 two new tables, nothing else created');
ok(() => !/ALTER TABLE public\.(?!vendor_policies|vendor_insurance_settings)\w+/.test(code) && !/\b(INSERT|UPDATE|DELETE FROM|DROP)\b/.test(code.replace(/ON DELETE CASCADE/g, '').replace(/GRANT SELECT, INSERT, UPDATE, DELETE/g, '')), '5c.3 no existing table altered, no row written');
ok(() => (code.match(/ENABLE ROW LEVEL SECURITY/g) || []).length === 2 && (code.match(/TO service_role/g) || []).length === 2, '5c.4 both locked down: RLS on, service_role only');
ok(() => I.KIND_KEYS.every((k) => code.includes(`'${k}'`)), '5c.5 the check list carries every kind key');
ok(() => /show_mark\s+boolean NOT NULL DEFAULT false/.test(code), '5c.6 the mark is off until she turns it on');
ok(() => fs.readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => /^0200_/.test(f)).length === 1, '5c.7 one 0200 (reserved to INS)');

if (!process.env.B220_ROOT) {
  sec('6  mutations, each must turn a named cell red');
  const MUT = [
    ['mark shows with the switch off', 'src/lib/vendor/insurance.js', 'if (!showMark) return null;', 'if (false) return null;', '4.5'],
    ['an ended policy keeps the mark', 'src/lib/vendor/insurance.js', "counts(p) && daysBetween(todayKey, p.ends_on) >= 0", 'counts(p)', '4.6'],
    ['an unconfirmed policy counts', 'src/lib/vendor/insurance.js', 'const counts = (p) => p && !p.deleted_at && !!p.confirmed_at;', 'const counts = (p) => p && !p.deleted_at;', '4.7'],
    ['the 30-day reminder sends twice', 'src/lib/vendor/insurance.js', "return p.reminded_30_on ? null : 30;", 'return 30;', '5.2'],
    ['the list loses its order', 'src/lib/vendor/insurance.js', ".sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))", '.reverse()', '3.1'],
    ['a broker labelled as an insurer', 'src/lib/vendor/insurance.js', "{ name: 'Policybazaar', kind: 'comparison'", "{ name: 'Policybazaar', kind: 'insurer'", '3.3'],
    ['the tap text names TDW as checker', 'src/lib/vendor/insurance.js', '; TDW has not verified the policy.`', '; verified by TDW.`', '4.4'],
    // AMENDED BY LABEL, INS-A r2: two mutations for the brief and the fee line.
    ['the fee line drops "TDW takes nothing"', 'src/lib/vendor/insurance.js', 'may charge its own fees. TDW takes nothing.`', 'may charge its own fees.`', '3.6'],
    ['the brief hides where the weddings figure came from', 'src/lib/vendor/insurance.js', ' (counted by The Dream Wedding).`', '.`', '3.8'],
    // AMENDED BY LABEL, INS-A r3: a retired token typed back into the table is refused at load.
    ['a retired trade token back in the table', 'src/lib/vendor/insurance.js', "trades: ['decor', 'venue_catering', 'performer']", "trades: ['decor', 'catering', 'performer']", '0.1'],
    ['a short month', 'src/lib/format.js', "`${Number(m[3])} ${MONTHS_LONG[Number(m[2]) - 1]} ${m[1]}`", "`${Number(m[3])} ${MONTHS_LONG[Number(m[2]) - 1].slice(0, 3)} ${m[1]}`", '1.1'],
    ['the reader passes a bad date', 'src/lib/vendor/policyRead.js', "if (typeof raw.ends_on === 'string' && DATE.test(raw.ends_on) && !Number.isNaN(Date.parse(raw.ends_on + 'T00:00:00Z'))) out.ends_on = raw.ends_on;", 'if (raw.ends_on) out.ends_on = raw.ends_on;', '5b.2'],
  ];
  for (const [name, file, from, to, cell] of MUT) {
    const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'b220-'));
    for (const d of ['src/lib/vendor', 'db/migrations']) fs.mkdirSync(path.join(tmp, d), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'src/agent'), { recursive: true });
    for (const f of ['src/lib/vendor/insurance.js', 'src/lib/vendor/policyRead.js', 'src/lib/vendor/insuranceRoom.js', 'src/lib/vendor/categoryFraming.js', 'src/agent/categories.js', 'src/lib/format.js', 'db/migrations/0200_insurance_room.sql']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
    const src = fs.readFileSync(path.join(tmp, file), 'utf8');
    if (!src.includes(from)) { ok(false, `6 · ${name}: the mutation's anchor is present`); continue; }
    fs.writeFileSync(path.join(tmp, file), src.replace(from, to));
    const r = require('child_process').spawnSync(process.execPath, [__filename], { env: { ...process.env, B220_ROOT: tmp, B220_QUIET: '1', B220_WANT: cell }, encoding: 'utf8' });
    ok(() => r.stdout.includes(`RED ${cell}`), `6 · ${name} → §${cell} red`, (r.stdout || r.stderr).slice(-200));
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.env.B220_WANT) { const hit = failed.find((n) => n.startsWith(process.env.B220_WANT + ' ')); console.log(hit ? `RED ${process.env.B220_WANT}` : 'NOT RED'); process.exit(0); }
console.log(`\nb220 · ${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);
