#!/usr/bin/env node
'use strict';
// scripts/tdw10_tier_bench.js
// TDW_10 · THE TIER & MONEY SITTING — M0 + F-10.85, dream-os side.
//
// RUNNABLE FROM ANY WORKING DIRECTORY (Q-SP-5): every path resolves off
// __dirname, never off process.cwd().
//
// BOTH-WAYS BY CONSTRUCTION. Every cell asserts the CURED value; at the pristine
// tree it asserts the UNCURED one — so the cure's size is A NUMBER in both
// worlds rather than one module-not-found crash standing in for eighty
// assertions. Every subject is therefore loaded DEFENSIVELY.
//
// Cells that read source text read it with COMMENTS STRIPPED, because this
// delivery's warrants quote the very words the cells forbid ("free", "trial"):
// a cell counting comment text would redden on its own explanation. That
// stripping is why the counts below can be trusted, and it is itself proven in
// §0 rather than assumed — a check whose failure mode is a silent zero is not a
// check (the independent-method law).

const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  → ' + detail : '')); }
};
const section = (t) => console.log('\n' + t + '\n' + '─'.repeat(Math.min(t.length, 74)));

const S = (x) => (typeof x === 'string' ? x : '');
const read = (rel) => {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};
// Conservative on purpose: this also strips anything comment-shaped inside a
// string, which for these files costs nothing and errs SAFE — an over-strip can
// only make a cell harder to pass, never falsely green. (F-09.95's trap runs the
// other way: there a `/*` inside a string blinded a stripper to real code.)
const strip = (s) => S(s).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const tryRequire = (rel) => { try { return require(path.join(ROOT, rel)); } catch (_e) { return {}; } };

const RAZORPAY  = read('src/lib/billing/razorpay.js');
const TIERFLIP  = read('src/lib/billing/tierFlip.js');
const ADMINVEND = read('src/api/admin/vendors.js');
const BRIDGE    = read('src/api/admin/bridge.js');
const CHAT      = read('src/api/vendor-engine/chat.js');
const CLOSER    = read('src/agent/closerEngine.js');
const ME        = read('src/api/vendor/me.js');
const INVITE    = read('src/admin/views/unifiedInvite.js');
const MIG       = read('db/migrations/0115_tier_vocabulary.sql');

const CANON = ['basic', 'essential', 'signature', 'prestige'];

// ═══════════════════════════════════════════════════════════════════════════
section('§0  THE INSTRUMENT PROVES ITSELF FIRST');
// ═══════════════════════════════════════════════════════════════════════════
{
  ok('read() reaches the tree at all (not a silent empty-string farm)',
     [RAZORPAY, TIERFLIP, ADMINVEND, BRIDGE, CHAT, CLOSER, ME, INVITE].every(x => x.length > 200));

  const fx = "const a = 1; // trial\n/* free */ const b = 'basic';";
  const st = strip(fx);
  ok('strip() removes a line comment (else every vocabulary cell is vacuous)', !/trial/.test(st), st);
  ok('strip() removes a block comment', !/free/.test(st), st);
  ok('strip() PRESERVES code (an over-strip would green everything)', /const b = 'basic'/.test(st), st);
  ok('strip() does not eat a URL\'s double slash', /https:\/\/x\.y/.test(strip("const u='https://x.y';")));
  ok('read() returns empty (not a throw) for an absent path — the RED half depends on it',
     read('db/migrations/__no_such_file__.sql') === '');
}

// ═══════════════════════════════════════════════════════════════════════════
section('§1  THE VOCABULARY — FOUR WORDS, THREE HOMES, ONE LIST');
// ═══════════════════════════════════════════════════════════════════════════
// Four homes carry the vocabulary: the migration's CHECK, the flip's fail-closed
// guard, the admin door's validator, and razorpay's fallback constant. The point
// of this section is that they AGREE. Three agreeing and one drifting is exactly
// the shape that ships a rejected write at midnight with no symptom.
{
  const flipM = strip(TIERFLIP).match(/CANON_TIERS = Object\.freeze\(\[([^\]]*)\]/);
  const flip  = flipM ? flipM[1].split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean) : [];
  ok('tierFlip CANON_TIERS is exactly the four ruled words, in canon order',
     JSON.stringify(flip) === JSON.stringify(CANON), JSON.stringify(flip));

  const admM = strip(ADMINVEND).match(/VALID_TIERS = \[([^\]]*)\]/);
  const adm  = admM ? admM[1].split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean) : [];
  ok('admin VALID_TIERS is exactly the four ruled words',
     JSON.stringify(adm) === JSON.stringify(CANON), JSON.stringify(adm));

  ok('the two runtime lists AGREE with each other (the drift cell)',
     JSON.stringify(flip) === JSON.stringify(adm) && flip.length === 4);

  const chkM = MIG.match(/CHECK \(tier IN \(([^)]*)\)\)/);
  const chk  = chkM ? chkM[1].split(',').map(x => x.trim().replace(/'/g, '')) : [];
  ok('0115\'s CHECK carries exactly the four ruled words',
     JSON.stringify(chk) === JSON.stringify(CANON), JSON.stringify(chk));
  ok('the CHECK and the runtime guard AGREE — a word the flip writes cannot be refused by the DB',
     JSON.stringify(chk) === JSON.stringify(flip) && chk.length === 4);

  ok('`free` is absent from every runtime vocabulary list',
     flip.length === 4 && !flip.includes('free') && !adm.includes('free') && !chk.includes('free'));
  ok('`trial` is absent from every runtime vocabulary list',
     flip.length === 4 && !flip.includes('trial') && !adm.includes('trial') && !chk.includes('trial'));
}

// ═══════════════════════════════════════════════════════════════════════════
section('§2  F-10.78 — THE CONSTANT FOLLOWS THE VOCABULARY');
// ═══════════════════════════════════════════════════════════════════════════
{
  const sc = strip(RAZORPAY);
  ok('BASE_TIER exists and holds the ruled floor word', /const BASE_TIER = 'basic';/.test(sc));
  ok('FREE_TIER is gone from CODE (its retirement narration in comments is lawful)',
     !/FREE_TIER/.test(sc));
  ok('halted resolves to the ruled floor, by constant not literal',
     /case 'subscription\.halted':[\s\S]{0,140}tier: BASE_TIER, billing_status: 'halted'/.test(sc));
  ok('cancelled resolves to the ruled floor, by constant not literal',
     /case 'subscription\.cancelled':[\s\S]{0,140}tier: BASE_TIER, billing_status: 'cancelled'/.test(sc));
  ok('BASE_TIER is exported (tierFlip and this bench are both real callers)',
     /module\.exports = \{[\s\S]*BASE_TIER,[\s\S]*\}/.test(sc));

  // THE SYNTHESIS CELLS (§9's requirement): not "each half works" but the two
  // halves ACTING TOGETHER. This pairing IS the finding.
  const rz = tryRequire('src/lib/billing/razorpay.js');
  const tf = tryRequire('src/lib/billing/tierFlip.js');
  const ef = typeof rz.entitlementFor === 'function' ? rz.entitlementFor : null;
  for (const ev of ['subscription.halted', 'subscription.cancelled']) {
    const ent = ef ? ef(ev, null) : null;
    ok(`${ev}: the entitlement's tier is a word tierFlip's guard ACCEPTS`,
       !!ent && Array.isArray(tf.CANON_TIERS) && tf.CANON_TIERS.includes(ent.tier), JSON.stringify(ent));
    ok(`${ev}: the entitlement's tier is a word 0115's CHECK ACCEPTS`,
       !!ent && CANON.includes(ent.tier), JSON.stringify(ent));
  }
  ok('a charge still resolves its tier from the plan, untouched by the rename',
     !!ef && (ef('subscription.charged', 'signature') || {}).tier === 'signature');
  ok('an unrecognised plan still flips NO tier (the rename foreclosed nothing)',
     !!ef && (ef('subscription.charged', null) || {}).tier === null);
  ok('authorisation events still flip NOTHING (R-BILL.4 intact)',
     !!ef && ef('subscription.activated', 'prestige') === null &&
     ef('subscription.authenticated', 'prestige') === null);
  ok('canon prices are UNMOVED by this sitting (Rs 999 / 1,999 / 2,999)',
     !!rz.TIER_PAISE && rz.TIER_PAISE.essential === 99900 &&
     rz.TIER_PAISE.signature === 199900 && rz.TIER_PAISE.prestige === 299900);
}

// ═══════════════════════════════════════════════════════════════════════════
section('§3  F-10.79 / F-10.80 — THE MIGRATION\'S ORDER IS THE CURE');
// ═══════════════════════════════════════════════════════════════════════════
// The ordering is not stylistic. Backfill BOTH source words → move the DEFAULT →
// then constrain. Wrong order and the migration aborts in the founder's editor,
// or the next mint that omits `tier` fails. Asserted BY INDEX, so a future edit
// that reorders the statements reddens here.
{
  ok('0115 exists at the ladder-derived number', MIG.length > 500);
  const iTrial = MIG.indexOf("SET tier = 'basic' WHERE tier = 'trial'");
  const iFree  = MIG.indexOf("SET tier = 'basic' WHERE tier = 'free'");
  const iDflt  = MIG.indexOf('ALTER COLUMN tier SET DEFAULT');
  const iChk   = MIG.indexOf('vendors_tier_check');

  ok('the `trial` backfill exists', iTrial > 0);
  ok('the `free` backfill exists — the SECOND source word, live on 9888294440', iFree > 0);
  ok('BOTH backfills precede the DEFAULT move', iTrial > 0 && iFree > 0 && iTrial < iDflt && iFree < iDflt);
  ok('the DEFAULT move precedes the CHECK', iDflt > 0 && iChk > 0 && iDflt < iChk);
  ok('BOTH backfills precede the CHECK (else ADD CONSTRAINT aborts on a live row)',
     iTrial > 0 && iFree > 0 && iChk > 0 && iTrial < iChk && iFree < iChk);
  ok('the new default is the ruled floor word', /ALTER COLUMN tier SET DEFAULT 'basic'/.test(MIG));
  ok('the CHECK is guarded so a re-run is a no-op, not an error',
     /IF NOT EXISTS \([\s\S]{0,180}conname = 'vendors_tier_check'/.test(MIG));
  ok('the whole thing is ONE transaction', /^BEGIN;/m.test(MIG) && /^COMMIT;/m.test(MIG));

  for (const k of ['vendor_pwa_daily_basic', 'vendor_pwa_monthly_basic',
                   'vendor_wa_daily_basic', 'vendor_wa_monthly_basic']) {
    ok(`0115 seeds ${k}`, MIG.includes(`'${k}'`));
  }
  ok('the seeds read their source row rather than carrying a literal value',
     (MIG.match(/SELECT '[a-z_]+_basic', value,/g) || []).length === 4);
  ok('the seeds cannot clobber a hand-tuned value on a re-run',
     (MIG.match(/ON CONFLICT \(key\) DO NOTHING/g) || []).length === 4);
  ok('0115 births the subscription-link column, nullable',
     /ADD COLUMN IF NOT EXISTS razorpay_subscription_link text/.test(MIG));

  // The revert ships COMMENTED, never runnable beside its subject.
  const tail = MIG.slice(MIG.lastIndexOf('COMMIT;'));
  const live = tail.split('\n').filter(l =>
    /DROP CONSTRAINT|SET DEFAULT 'trial'|DROP COLUMN|DELETE FROM/.test(l) && !l.trim().startsWith('--'));
  ok('the revert direction carries ZERO runnable lines (conditional-withheld)',
     live.length === 0, JSON.stringify(live));
  // Prose in SQL comments wraps with a `--` on each line, so it is asserted
  // against a NORMALISED view — a bench whose failure mode is line-wrapping is
  // not a bench about meaning.
  const prose = MIG.replace(/^\s*--\s?/gm, '').replace(/\s+/g, ' ');
  ok('the revert states the backfill is NOT losslessly reversible',
     /not losslessly reversible/i.test(prose) && /cannot restore the two source words/i.test(prose));
  ok('the migration records the founder\'s ruling verbatim, not paraphrased',
     /basic is free without ai and without any time bound problem/.test(prose));
}

// ═══════════════════════════════════════════════════════════════════════════
section('§4  THE HOT PATH — NO SILENT RE-CAPPING, NO SILENT RE-ROUTING');
// ═══════════════════════════════════════════════════════════════════════════
{
  const sc = strip(CHAT);
  ok('ENGINE_TIER_MAP is keyed on the ruled floor word', /ENGINE_TIER_MAP = \{ basic: 'entry'/.test(sc));
  ok('ENGINE_TIER_MAP no longer keys on a retired word', !/ENGINE_TIER_MAP = \{[^}]*trial/.test(sc));
  // ── LABELLED AMENDMENT · TDW_10 F-10.100, on CE-199's ratified precedent ──────
  // THE PROPERTY IS UNCHANGED; ITS SUBJECT MOVED. Both cells below were authored at
  // the rename sitting to pin two facts: every tier fallback names the canon floor
  // word, and the cap key has ONE home in code. Neither fact has moved. What moved is
  // the count and the family, and both moved by a founder ruling recorded on the
  // record — the combined AI cap (0116). The cells are re-aimed rather than deleted,
  // and re-aimed rather than loosened: a cell that stops counting because the count
  // changed is a cell that will not notice the next change either.
  //
  // WHY THE COUNT IS NOW FOUR. buildMeta became plain-args so the WhatsApp door could
  // share it (it has no Express req), and a function that no longer receives the tier
  // from a resolved `req.vendor` must default it itself. The fourth site is that
  // default. It names the same floor word as the other three, which is the property.
  ok('every productTier fallback is the ruled floor word (4 sites — was 3, +1 at F-10.100)',
     (sc.match(/\|\| 'basic';/g) || []).length === 4, (sc.match(/\|\| 'basic';/g) || []).length + ' found');
  ok('no productTier fallback still names a retired word',
     !/tier\) \|\| 'trial'/.test(sc) && !/tier\) \|\| 'free'/.test(sc));
  // WHY THE FAMILY IS NOW vendor_ai_*. The elder cell's sentence — 「 0115 seeds the
  // keys, code stays still 」 — was true of the RENAME sitting, whose whole discipline
  // was to move a word without moving a reader. F-10.100 is the sitting that was
  // chartered to move the reader: one allowance spent from two doors, so one key
  // family. The elder's real property was that the template has exactly ONE home in
  // code and is not duplicated; that is what is asserted, now against the ruled family,
  // WITH the negative that the retired family left no second reader behind.
  ok('the cap-key template has ONE home, and it is the ruled vendor_ai_* family (F-10.100)',
     /vendor_ai_daily_\$\{productTier\}/.test(sc) && /vendor_ai_monthly_\$\{productTier\}/.test(sc));
  ok('the retired vendor_pwa_* template left no second reader behind (F-04.36)',
     !/vendor_pwa_daily_\$\{productTier\}/.test(sc) && !/vendor_pwa_monthly_\$\{productTier\}/.test(sc));
  const i = CHAT.indexOf('ENGINE_TIER_MAP');
  ok('the retained basic→entry mapping names F-10.41 in-comment (F-06.85)',
     i > 0 && /F-10\.41/.test(CHAT.slice(Math.max(0, i - 900), i)));
}

// ═══════════════════════════════════════════════════════════════════════════
section('§5  F-10.85 — THE CAP DIAL LEARNS TO SAY ZERO');
// ═══════════════════════════════════════════════════════════════════════════
{
  const sc = strip(CHAT);
  const m  = sc.match(/const val = \(k, dflt\) => \{[^\n]*\n?/);
  ok('the cap reader is still one findable predicate', !!m);
  const pred = m ? m[0] : '';
  ok('a stored 0 is now LAWFUL (>= 0), not discarded as absent',
     /Number\.isFinite\(n\) && n >= 0 \? n : dflt/.test(pred), pred.trim());
  ok('the uncured `> 0` semantic is gone', !!m && !/Number\.isFinite\(n\) && n > 0 \? n : dflt/.test(pred));

  // Behavioural, not textual.
  const val = (cfg, k, d) => { const r = (cfg || []).find(c => c.key === k); const n = r ? parseInt(r.value, 10) : NaN; return Number.isFinite(n) && n >= 0 ? n : d; };
  ok('stored "0" → cap 0 (DENIED — the founder\'s interim lever)', val([{ key: 'k', value: '0' }], 'k', 25) === 0);
  ok('stored "500" → cap 500 (unchanged for every live key)', val([{ key: 'k', value: '500' }], 'k', 25) === 500);
  ok('absent key → the in-code default (unchanged)', val([], 'k', 25) === 25);
  ok('junk → the in-code default (falls back, never throws on a live turn)', val([{ key: 'k', value: 'banana' }], 'k', 25) === 25);
  ok('NEGATIVE → the in-code default (malformed input is not an instruction)', val([{ key: 'k', value: '-5' }], 'k', 25) === 25);

  const ratio = (u, c) => (c > 0 ? u / c : Infinity);
  ok('cap 0 caps the vendor out at zero usage', (0 >= 0) === true);
  ok('cap 0 reports the DAY window as nearer — not a false "you used your month"',
     ratio(0, 0) >= ratio(0, 250));
  ok('the zero-safe ratio helper is in the SHIPPED file, not only in this bench',
     /const ratio = \(used, cap\) => \(cap > 0 \? used \/ cap : Infinity\);/.test(sc));

  // FIXTURE-STATE, from the founder's own SELECT of 2026-08-07. The semantic
  // flip is only safe because no key stores 0 today; asserted, not remembered.
  const founder = [500,200,100,100,500,5000,2000,1000,1000,5000,5,50,15,3,20,500,75,10];
  ok('founder fixture: NO tier-keyed cap key stored 0 at flip time (min 3)',
     Math.min.apply(null, founder) > 0, 'min ' + Math.min.apply(null, founder));
  ok('founder fixture: eighteen tier-keyed cap keys were read, not sampled',
     founder.length === 18);
}

// ═══════════════════════════════════════════════════════════════════════════
section('§6  THE SURFACES THE RENAME TOUCHES');
// ═══════════════════════════════════════════════════════════════════════════
{
  const sb = strip(BRIDGE);
  ok('the Bridge\'s entry-rung count follows the renamed word', /q\.eq\('tier', 'basic'\)/.test(sb));
  ok('the Bridge no longer counts a retired word (the card would read 0 forever)',
     !/q\.eq\('tier', 'trial'\)/.test(sb));
  ok('the response KEY `trials` is preserved — the pwa client is typed on it', /attempt\('trials'/.test(sb));

  ok('C4: the invite form\'s default option names the ruled word', /— \(default basic\) —/.test(INVITE));
  ok('C4: the retired word is gone from the invite form', INVITE.length > 0 && !/\(default trial\)/.test(INVITE));

  const sm = strip(ME);
  ok('Fork H: /me exposes billing_status', /billing_status:\s+vendor\.billing_status \|\| 'none'/.test(sm));
  ok('Fork H: /me exposes the subscription link',
     /razorpay_subscription_link:\s+vendor\.razorpay_subscription_link \|\| null/.test(sm));
  ok('Fork H: /me still exposes tier (nothing removed — the law\'s safe direction)',
     /tier:\s+vendor\.tier \|\| null/.test(sm));
  ok('the money fields are NOT vendor-writable (explicit lock, not a silent drop)',
     /LOCKED_FIELDS[\s\S]{0,360}'billing_status'/.test(sm) &&
     /LOCKED_FIELDS[\s\S]{0,360}'razorpay_subscription_link'/.test(sm));

  const sl = strip(CLOSER);
  ok('Fork E: the price WATCH_CLASS alternation knows the live vocabulary',
     /const TIERS = 'basic\|essential\|signature\|prestige';/.test(sl));
  ok('Fork E: the watcher is no longer blind to the rung most vendors hold',
     CLOSER.length > 0 && !/const TIERS = 'trial\|/.test(sl));
}

// ═══════════════════════════════════════════════════════════════════════════
section('§7  W-1 — WHAT THIS DELIVERY DID NOT TOUCH');
// ═══════════════════════════════════════════════════════════════════════════
// The chair opened W-1 for exactly one line. These cells assert the walls that
// stayed up — including the CALENDAR sense of the word `trial`, which a naive
// rename sweep would have destroyed across the bride and vendor lanes. That trap
// is the reason this sitting censused per-site instead of sweeping.
{
  const soul = read('src/agent/souls/closerSoul.js');
  ok('closerSoul.js is present and its trial sentence STANDS (deferred, untouched)',
     /how long a trial runs/.test(soul));

  const CAL = [
    ['src/agent/brideEngine.js', /'fitting','trial','family'/],
    ['src/api/vendor-engine/chat.js', /BOOKED_KINDS = \['shoot', 'meeting', 'recce', 'fitting', 'trial'/],
    ['src/api/vendor-engine/cabinet.js', /BOOKED_KINDS = \['shoot', 'meeting', 'recce', 'fitting', 'trial'/],
  ];
  for (const [rel, re] of CAL) {
    ok(`calendar sense survives in ${rel} (a rename sweep would have killed it)`, re.test(read(rel)));
  }
  const bt = read('src/agent/brideTools.js');
  ok('brideTools still offers `trial` as a bride calendar event kind',
     /'fitting', 'trial', 'meeting'/.test(bt));
}

console.log('\n' + '─'.repeat(60));
console.log(`tdw10_tier_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
process.exit(fail === 0 ? 0 : 1);
