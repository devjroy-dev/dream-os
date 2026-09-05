#!/usr/bin/env node
'use strict';
// scripts/b54_g11c_couple_switch_bench.js
// BLOCK 19 · G1.1c · THE COUPLE'S SWITCH — the sitting's bench.
//
// Every cell asserts a SURFACE or a BEHAVIOUR. None asserts a line number and
// none asserts where a constant lives — the bench-discipline law.
//
// THIS BENCH CARRIES WHAT b53:261 USED TO (R-G11c.9). That cell asserted, by
// bare absence, that nothing in src/lib/vendor/weddings.js writes couple_consent.
// G1.1c gives createWedding a consent SEED, so the old assertion reds and was
// narrowed to its two true subjects. The obligation did not vanish with it: the
// seed is asserted POSITIVELY here, and both ways — removing it REDS, and
// sourcing it from anywhere but the couple's own row REDS. A bare absence
// assertion replaced by a bare absence assertion would have been a swap, not a
// cure.
//
// THE MUTATION PASS (--mutate) edits PRODUCTION CODE, never test setup, re-runs
// the cells in a child process, and requires RED.

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

const MIG    = 'db/migrations/0132_couple_switch.sql';
const LIB    = 'src/lib/vendor/weddings.js';
const DOOR   = 'src/api/couple/me.js';
const STUDIO = 'src/api/vendor/studio/weddings.js';
const M0131  = 'db/migrations/0131_wedding_pages.sql';

for (const rel of [MIG, LIB, DOOR, STUDIO, M0131]) {
  if (!fs.existsSync(P(rel))) {
    console.log('REFUSED \u2014 ' + rel + ' is absent');
    process.exit(3);
  }
}

let pass = 0, fail = 0;
const ok = (n, c, d) => {
  if (c) { pass++; console.log('  ok   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? '  \u2192 ' + d : '')); }
};
const sec = (t) => console.log('\n' + t);

const fresh = (rel) => { delete require.cache[P(rel)]; return require(P(rel)); };
const W = fresh(LIB);

// A stub that answers the two shapes these functions actually use. Behaviour is
// driven through the REAL functions rather than asserted about their source, so
// a cell that passes here passes because the code does the thing.
function stub(tables) {
  return {
    from(name) {
      const q = { _t: name, _f: {} };
      q.select = () => q;
      q.eq = (c, v) => { q._f[c] = v; return q; };
      q.maybeSingle = async () => {
        const rows = (tables[q._t] || []).filter((r) =>
          Object.entries(q._f).every(([k, v]) => r[k] === v));
        return { data: rows[0] || null, error: null };
      };
      return q;
    },
  };
}

const FIXTURE = {
  events: [
    { id: 'ev-1', linked_lead_id: 'lead-dev440' },   // the linked fixture event
    { id: 'ev-2', linked_lead_id: null },            // an event with no lead
  ],
  engagements: [
    { lead_id: 'lead-dev440', vendor_id: 'v-DEV440',  couple_id: 'c-sarah' },
    { lead_id: 'lead-droy550', vendor_id: 'v-DROY550', couple_id: 'c-sarah' },
  ],
  couples: [
    { id: 'c-sarah', publish_weddings: true },
    { id: 'c-off',   publish_weddings: false },
  ],
};

const run = (p) => p.then((v) => v, (e) => { throw e; });

(async () => {

// ── C1 · 0132 DECLARES THE TWO HOMES ────────────────────────────────────────
sec('C1 \u00b7 0132 \u2014 one home for her answer, one link for the page');
const mig = read(MIG);
ok('couples.publish_weddings is boolean NOT NULL DEFAULT false',
  /ADD COLUMN IF NOT EXISTS publish_weddings\s+boolean\s+NOT NULL\s+DEFAULT false/i.test(mig));
ok('consent is never assumed \u2014 the default is false, not true',
  !/publish_weddings\s+boolean\s+NOT NULL\s+DEFAULT true/i.test(mig));
ok('weddings.couple_id references couples ON DELETE SET NULL',
  /ADD COLUMN IF NOT EXISTS couple_id uuid NULL REFERENCES public\.couples \(id\) ON DELETE SET NULL/i.test(mig));
ok('the couple index is PARTIAL \u2014 the NULLs are not paid for',
  /CREATE INDEX IF NOT EXISTS idx_weddings_couple[\s\S]{0,160}WHERE couple_id IS NOT NULL/i.test(mig));
ok('0132 never touches public.events (events_owner_xor is never approached)',
  !/\bALTER TABLE public\.events\b/i.test(mig) && !/\bUPDATE public\.events\b/i.test(mig));
ok('idx_weddings_live is neither dropped nor redefined \u2014 the public door is untouched',
  !/DROP INDEX[\s\S]{0,80}idx_weddings_live/i.test(mig) && !/CREATE INDEX[\s\S]{0,80}idx_weddings_live/i.test(mig));

// ── C2 · ONE WRITER, ONE TRANSACTION ────────────────────────────────────────
sec('C2 \u00b7 couple_set_publish \u2014 both facts move together or neither does');
const fnBody = mig.slice(mig.indexOf('CREATE OR REPLACE FUNCTION couple_set_publish'),
                         mig.indexOf('$$ LANGUAGE plpgsql;'));
ok('the function exists', fnBody.length > 0);
ok('it writes couples.publish_weddings', /UPDATE public\.couples[\s\S]{0,120}publish_weddings\s*=\s*p_publish/i.test(fnBody));
ok('it writes weddings.couple_consent in the SAME body (one transaction)',
  /UPDATE public\.weddings[\s\S]{0,140}couple_consent\s*=\s*p_publish/i.test(fnBody));
ok('the wedding UPDATE is scoped by HER couple_id',
  /UPDATE public\.weddings[\s\S]{0,220}WHERE w\.couple_id = p_couple_id/i.test(fnBody));
ok('NO wedding id is accepted \u2014 consent is not grantable on another page',
  !/p_wedding_id/i.test(fnBody));
ok('a missing couple raises rather than silently touching nothing',
  /IF NOT FOUND THEN[\s\S]{0,80}RAISE EXCEPTION/i.test(fnBody));
ok('null arguments are refused, never coerced', /p_publish IS NULL[\s\S]{0,80}RAISE EXCEPTION/i.test(fnBody));

// ── C3 · THE SEED — POSITIVELY, WHERE b53:261 USED TO ASSERT BY ABSENCE ─────
sec('C3 \u00b7 the seed reads HER row, never a request body (R-G11c.9)');
ok('WEDDING_COLS carries couple_id', W.WEDDING_COLS.includes('couple_id'));
ok('consentSeedFor reads publish_weddings TRUE off the couple row',
  await run(W.consentSeedFor(stub(FIXTURE), 'c-sarah')) === true);
ok('consentSeedFor reads FALSE off a couple who has not answered yes',
  await run(W.consentSeedFor(stub(FIXTURE), 'c-off')) === false);
ok('consentSeedFor seeds FALSE for no couple at all \u2014 never undefined',
  await run(W.consentSeedFor(stub(FIXTURE), null)) === false);
ok('consentSeedFor seeds FALSE for a couple that does not exist',
  await run(W.consentSeedFor(stub(FIXTURE), 'c-ghost')) === false);
const libSrc = read(LIB);
const createFn = libSrc.slice(libSrc.indexOf('async function createWedding'),
                              libSrc.indexOf('async function addCredit'));
ok('createWedding seeds couple_consent from the derived seed, not a literal',
  /couple_consent:\s*consentSeed/.test(createFn));
ok('the seed is derived by consentSeedFor off the resolved couple — nothing else',
  /const consentSeed\s*=\s*await consentSeedFor\(supabase, coupleId\);/.test(createFn));
ok('createWedding reads no positional `arguments` — no back door round the seed',
  !/arguments\s*\[/.test(createFn));
ok('createWedding takes NO consent and NO couple from its caller',
  !/couple_consent[,)]/.test(createFn.slice(0, createFn.indexOf('{'))) &&
  !/coupleId\s*[,}]/.test(createFn.slice(0, createFn.indexOf('{'))));
ok('the vendor lane never reads a request body for consent',
  !/req\.body/.test(libSrc));

// ── C4 · THE SPINE, AND THE DEAD ROUTE IT REPLACED ──────────────────────────
sec('C4 \u00b7 resolveCoupleForEvent \u2014 the engagement, scoped to THIS owner');
ok('an event with a lead resolves the owner\u2019s engagement couple',
  await run(W.resolveCoupleForEvent(stub(FIXTURE), { ownerVendorId: 'v-DEV440', eventId: 'ev-1' })) === 'c-sarah');
ok('the SAME lead does not resolve for a DIFFERENT vendor (the scope is real)',
  await run(W.resolveCoupleForEvent(stub(FIXTURE), { ownerVendorId: 'v-OTHER', eventId: 'ev-1' })) === null);
ok('an event with no lead resolves null, never throws (back-catalogue is legal)',
  await run(W.resolveCoupleForEvent(stub(FIXTURE), { ownerVendorId: 'v-DEV440', eventId: 'ev-2' })) === null);
ok('no event at all resolves null (R-G11.21, event_id is nullable)',
  await run(W.resolveCoupleForEvent(stub(FIXTURE), { ownerVendorId: 'v-DEV440', eventId: null })) === null);
ok('the derivation never reads events.couple_id \u2014 the XOR route is dead (F-40.45)',
  !/events[\s\S]{0,200}couple_id/.test(libSrc.slice(libSrc.indexOf('async function resolveCoupleForEvent'),
                                                    libSrc.indexOf('async function consentSeedFor'))));

// ── C5 · THE DOOR ───────────────────────────────────────────────────────────
sec('C5 \u00b7 PATCH /couple/me \u2014 the switch\u2019s sole writer');
const door = read(DOOR);
ok('publish_weddings is a PICKED field, never a spread body',
  /const \{[^}]*publish_weddings[^}]*\} = req\.body \|\| \{\};/.test(door) &&
  // Parenthesised too: `...(req.body || {})` is the same defect wearing brackets,
  // and the first cut of this cell missed it — the mutation pass caught that.
  !/\.\.\.\s*\(?\s*req\.body/.test(door));
ok('it routes to couple_set_publish, not to a raw table update',
  /supabase\.rpc\('couple_set_publish'/.test(door));
ok('it is NOT folded into couplesPatch \u2014 the column keeps one writer',
  !/couplesPatch\.publish_weddings/.test(door));
ok('a non-boolean is REFUSED, never coerced into an answer she did not give',
  /typeof publish_weddings !== 'boolean'[\s\S]{0,120}400/.test(door));
ok('the rpc is scoped by the JWT couple_id, never a body-supplied id',
  /p_couple_id:\s*couple_id/.test(door));
ok('the GET serves the switch\u2019s default FROM THE ROW, with === true',
  /publish_weddings:\s*couple\.publish_weddings === true/.test(door) &&
  /publish_weddings,/.test(door));

// ── C6 · THE VENDOR LANE STILL CANNOT CHOOSE (R-G11.10 holds) ───────────────
sec('C6 \u00b7 no vendor door writes consent as a choice');
ok('the studio door writes no couple_consent byte', !/couple_consent\s*:/.test(read(STUDIO)));
ok('the studio door writes no publish_weddings byte', !/publish_weddings/.test(read(STUDIO)));
ok('the studio door does not accept a couple_id from the vendor', !/couple_id/.test(read(STUDIO)));
ok('0131 remains the sole witness for weddings (0132 adds, never redefines)',
  /couple_consent\s+boolean\s+NOT NULL DEFAULT false/i.test(read(M0131)));

console.log('\n' + (fail === 0 ? 'GREEN' : 'RED') + ' \u2014 ' + pass + ' pass, ' + fail + ' fail');

if (process.argv.includes('--cells-only')) process.exit(fail === 0 ? 0 : 1);

// ══════════════════════════════════════════════════════════════════════════════
// THE MUTATION PASS — production bytes, never test setup.
// The four the chair named, plus two the seat added for the arms it built.
// ══════════════════════════════════════════════════════════════════════════════
if (process.argv.includes('--mutate')) {
  sec('MUTATIONS \u2014 each must turn the cells RED');
  const MUT = [
    [STUDIO, 'a vendor door starts writing consent (R-G11.10 broken)',
      "  const wedding = await W.createWedding(supabase, {",
      "  const wedding = await W.createWedding(supabase, {\n    couple_consent: true,"],

    [DOOR, 'the door spreads the body instead of picking (a vendor-shaped field lands)',
      "  const couplesPatch = {};",
      "  const couplesPatch = { ...(req.body || {}) };"],

    [LIB, 'the seed is dropped \u2014 a page is born unconsented regardless of her answer',
      "      couple_consent: consentSeed,\n", ""],

    [LIB, 'the seed is sourced from the caller instead of her row',
      "  const consentSeed = await consentSeedFor(supabase, coupleId);",
      "  const consentSeed = arguments[1] && arguments[1].couple_consent === true;"],

    [LIB, 'the engagement scope drops vendor_id \u2014 another studio\u2019s lead resolves',
      "    .eq('lead_id', ev.linked_lead_id)\n    .eq('vendor_id', ownerVendorId)",
      "    .eq('lead_id', ev.linked_lead_id)"],

    [DOOR, 'publish_weddings is folded into couplesPatch \u2014 a second writer appears',
      "    const { data: pubRows, error: pErr } = await supabase.rpc('couple_set_publish', {",
      "    couplesPatch.publish_weddings = publish_weddings;\n    const { data: pubRows, error: pErr } = await supabase.rpc('couple_set_publish', {"],
  ];
  for (const [rel, name, from, to] of MUT) {
    const abs = P(rel);
    const before = fs.readFileSync(abs);
    const txt = before.toString('utf8');
    if (!txt.includes(from)) { ok(name, false, 'mutation site absent \u2014 the code moved'); continue; }
    fs.writeFileSync(abs, txt.replace(from, to));
    const r = spawnSync(process.execPath, [__filename, '--cells-only'], { encoding: 'utf8' });
    fs.writeFileSync(abs, before);
    ok(name + ' \u2192 RED', r.status !== 0, 'exit ' + r.status);
    ok(name + ' \u2192 restored byte-for-byte', Buffer.compare(before, fs.readFileSync(abs)) === 0);
  }
  console.log('\n' + (fail === 0 ? 'GREEN' : 'RED') + ' \u2014 ' + pass + ' pass, ' + fail + ' fail');
}

process.exit(fail === 0 ? 0 : 1);
})();
