#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b07_p5_bench.js — TDW_07 P5 · THE ENQUIRY PIPELINE, BOTH SPECIES
//
// Runnable from ANY working directory (protocol §9: "a cure nobody can re-run
// quietly stops being a cure"). Paths resolve from __dirname, never from cwd.
//
//   node scripts/b07_p5_bench.js
//
// ── WHAT THIS BENCH IS ───────────────────────────────────────────────────────
// §1 BEHAVIOURAL — drives the REAL `sendDemoLeadAlert` against a fake supabase
//    and an injected sendWa. These are the cells that can be driven end to end
//    from a build container: the batch window, the stamp, the state/notes
//    ruling, the refusal paths.
// §2 STRUCTURAL — asserts the cures exist in the SHIPPED SOURCE. A predicate on
//    a live query and a middleware on a route cannot be driven without a
//    database and an HTTP stack; per the PROVABLE-EQUIVALENT DOCTRINE (CE-115) a
//    bench proves wiring exists, never that the thing is usable, and the walk
//    card names which truths only the founder's device can witness.
// §3 MUTATION — proves §1 and §2 are non-vacuous by breaking PRODUCTION CODE
//    (never test setup) and asserting the corresponding cell goes RED.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');

// ── TEST SETUP, DISCLOSED (never production code) ────────────────────────────
// `sendWa` resolves the marketing lane's FROM from `MARKETING_WHATSAPP_NUMBER`
// (sendWa.js:108-109) and throws WaLineNotConfiguredError when it is absent —
// BEFORE any injected transport is reached. This bench's subject is the alert
// module's own logic, not the lane's env wiring, so the var is set here. It is
// set on the PROCESS, not in any shipped file, and the §1.8 refusal cell proves
// the refusal path still works when a send is genuinely rejected.
process.env.MARKETING_WHATSAPP_NUMBER = process.env.MARKETING_WHATSAPP_NUMBER || '+918810531764';

// Comment-stripped view of a source file. §3 caught the whole-file grep as
// VACUOUS: `source: 'discover'` appears in this sitting's own explanatory
// comment AND in the code, so breaking the code left the cell green. A cell that
// a comment can satisfy is not testing code.
function code(src) {
  return src.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
}

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
function H(h) { console.log(`\n${h}`); }

// ── the fake plane ───────────────────────────────────────────────────────────
// Shaped to the exact calls demoLeadAlert makes: .from().select().eq().maybeSingle()
// and .from().insert().select().single(). Nothing more is simulated, because
// anything more would be simulating code this bench does not drive.
function fakeSupabase({ prospect = null, insertErr = null, updateErr = null }) {
  const log = { inserted: null, updated: null, updatedId: null };
  return {
    log,
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({ data: table === 'prospects' ? prospect : null }),
        insert(row) {
          log.inserted = { table, row };
          return {
            select() { return this; },
            single: async () => insertErr
              ? { data: null, error: new Error(insertErr) }
              : { data: { id: 'prospect-new' }, error: null },
          };
        },
        update(patch) {
          log.updated = { table, patch };
          return { eq: async (_c, id) => { log.updatedId = id; return { error: updateErr ? new Error(updateErr) : null }; } };
        },
      };
    },
  };
}

const DEMO = {
  id: 'demo-1',
  display_name: 'Swati Roy',
  ig_handle: 'swati',
  category: 'makeup',
  city: 'Delhi',
  whatsapp_phone: '919888294440',
};

const NOW = Date.UTC(2026, 6, 31, 12, 0, 0);

// Injected sendWa: records the call, or throws the shape under test.
function sender({ throws = null } = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      sendTemplate: async (args) => { calls.push(args); if (throws) throw throws; return { ok: true }; },
      sendText:     async () => { throw new Error('free-form must never be used for a demo alert'); },
      isOptedOut:   async () => false,
      isWindowOpen: async () => true,
    },
  };
}

// ── THE UNCURED TREE MUST GO RED, NOT CRASH ─────────────────────────────────
// At the pre-P5 tree `src/lib/discover/demoLeadAlert.js` does not exist, and a
// bare require would abort the process before a single cell was counted. A
// process that dies is not a bench that failed: the estate has already paid for
// that confusion once (F-06.100, CRASHED mislabelling a real refusal). So the
// absence is CAUGHT and every §1 cell reports RED with the absence as its
// reason — which is exactly the truth about the uncured tree.
let alertMod = null, alertLoadErr = null;
try { alertMod = require(SRC('src/lib/discover/demoLeadAlert.js')); }
catch (e) { alertLoadErr = e.message; }

function M() {
  if (!alertMod) throw new Error(`demoLeadAlert module absent (uncured tree): ${alertLoadErr}`);
  return alertMod;
}
const sendDemoLeadAlert = (...a) => M().sendDemoLeadAlert(...a);
const monthPhrase       = (...a) => M().monthPhrase(...a);
const claimLinkFor      = (...a) => M().claimLinkFor(...a);
const BATCH_WINDOW_MS   = alertMod ? alertMod.BATCH_WINDOW_MS   : null;
const DEMO_LEAD_NOTE    = alertMod ? alertMod.DEMO_LEAD_NOTE    : null;
const STATE_AFTER_SEND  = alertMod ? alertMod.STATE_AFTER_SEND  : null;

// ═════════════════════════════════════════════════════════════════════════════
H('§1 — BEHAVIOURAL: the free-lead hook, driven through the real module');

t('§1.1 the ruled state is `templated`, NOT `demo_lead` (F2 — the CHECK admits no demo_lead)', () => {
  assert.strictEqual(M().STATE_AFTER_SEND, 'templated');
  assert.strictEqual(M().DEMO_LEAD_NOTE, 'demo_lead');
});

t('§1.2 the batch window is the spec\'s 48h', () => {
  assert.strictEqual(M().BATCH_WINDOW_MS, 48 * 60 * 60 * 1000);
});

t('§1.3 first enquiry SENDS: exactly one template, on the marketing lane', async () => {
  const s = sender();
  const sb = fakeSupabase({ prospect: null });
  const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, weddingDate: '2026-12-04', now: NOW, deps: s.deps });
  assert.strictEqual(r.sent, true, 'must send on first contact');
  assert.strictEqual(s.calls.length, 1, `exactly one template, got ${s.calls.length}`);
});

t('§1.4 EXACTLY-ONE: a second call inside 48h sends NOTHING', async () => {
  const s = sender();
  const stamped = { id: 'p1', phone: DEMO.whatsapp_phone, last_template_at: new Date(NOW - 3600e3).toISOString() };
  const sb = fakeSupabase({ prospect: stamped });
  const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
  assert.strictEqual(s.calls.length, 0, 'no template may leave inside the window');
  assert.strictEqual(r.sent, false);
  assert.strictEqual(r.reason, 'batched_48h');
  assert.strictEqual(r.ok, true, 'batching is a success, not a failure');
});

t('§1.5 THE WINDOW\'S FAR EDGE: 48h + 1ms sends again', async () => {
  const s = sender();
  const win = M().BATCH_WINDOW_MS;
  const old = { id: 'p1', phone: DEMO.whatsapp_phone, last_template_at: new Date(NOW - win - 1).toISOString() };
  const sb = fakeSupabase({ prospect: old });
  const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
  assert.strictEqual(r.sent, true, 'outside the window the hook must fire again');
  assert.strictEqual(s.calls.length, 1);
});

t('§1.6 THE WARM UPSERT: state templated, notes demo_lead, ref + stamp written', async () => {
  const s = sender();
  const sb = fakeSupabase({ prospect: null });
  await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
  const row = sb.log.inserted && sb.log.inserted.row;
  assert.ok(row, 'a prospect row must be written');
  assert.strictEqual(row.state, 'templated');
  assert.strictEqual(row.notes, 'demo_lead');
  assert.strictEqual(row.demo_vendor_ref, DEMO.id);
  assert.strictEqual(row.last_template_at, new Date(NOW).toISOString());
  assert.strictEqual(row.source, 'other', "source CHECK admits only sheet|manual|other — 'discover' is not legal");
});

t('§1.7 an EXISTING prospect is updated, never duplicated (phone is UNIQUE)', async () => {
  const s = sender();
  const sb = fakeSupabase({ prospect: { id: 'p9', phone: DEMO.whatsapp_phone, last_template_at: null } });
  await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
  assert.strictEqual(sb.log.inserted, null, 'must not insert over a UNIQUE phone');
  assert.ok(sb.log.updated, 'must update the existing row');
  assert.strictEqual(sb.log.updated.patch.state, 'templated');
  assert.strictEqual(sb.log.updated.patch.notes, 'demo_lead');
});

t('§1.8 STOP: an opted-out refusal sends nothing and is REPORTED, not swallowed', async () => {
  const err = new Error('recipient has opted out'); err.code = 'opted_out'; err.name = 'WaOptedOutError';
  const s = sender({ throws: err });
  const sb = fakeSupabase({ prospect: null });
  const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
  assert.strictEqual(r.sent, false);
  assert.strictEqual(r.ok, false, 'a refusal is not a success');
  assert.strictEqual(r.reason, 'opted_out');
  assert.strictEqual(sb.log.inserted, null, 'a refused send must NOT stamp the batch window');
});

t('§1.9 NO TARGET: whatsapp_phone NULL — the live production state — reports honestly', async () => {
  const s = sender();
  const sb = fakeSupabase({ prospect: null });
  const r = await sendDemoLeadAlert(sb, { demoVendor: { ...DEMO, whatsapp_phone: null }, now: NOW, deps: s.deps });
  assert.strictEqual(r.sent, false);
  assert.strictEqual(r.reason, 'no_whatsapp_phone');
  assert.strictEqual(s.calls.length, 0);
});

t('§1.10 the claim link is the founder-given origin, handle-encoded', () => {
  assert.strictEqual(claimLinkFor('swati'), 'https://thedreamwedding.in/demo/vendor/swati');
  assert.strictEqual(claimLinkFor('weddingdecor.india'), 'https://thedreamwedding.in/demo/vendor/weddingdecor.india');
  assert.strictEqual(claimLinkFor(''), null, 'no handle ⇒ no link ⇒ no send');
});

t('§1.11 {{2}} never ships empty (Meta rejects empty variables)', () => {
  assert.strictEqual(monthPhrase('2026-12-04'), 'December 2026');
  assert.strictEqual(monthPhrase(null), 'upcoming');
  assert.strictEqual(monthPhrase('not-a-date'), 'upcoming');
});

t('§1.12 the alert NEVER throws — the enquiry survives every failure', async () => {
  const s = sender({ throws: new Error('transport down') });
  const sb = fakeSupabase({ prospect: null });
  const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.sent, false);
});

// ═════════════════════════════════════════════════════════════════════════════
H('§2 — STRUCTURAL: the cures in the shipped source');

const enquire   = read('src/api/couple/enquire.js');
const enrich    = read('src/lib/vendor/enquiryEnrichment.js');
const demoAdmin = read('src/api/admin/demoAdmin.js');
const demoVend  = read('src/api/demo/vendor.js');
const prospects = read('src/lib/prospects.js');

t('§2.1 №22 — the lead is BUILT: createLead called with source discover', () => {
  const c = code(enquire);
  assert.ok(/createLead\s*\(\s*supabase/.test(c), 'createLead must actually be CALLED, not merely imported');
  assert.ok(/source:\s*'discover'/.test(c), "the lead must carry source 'discover' IN CODE, not only in a comment");
});

t('§2.2 F-07.35 — the door reads discover_paused, as the feed does', () => {
  assert.ok(/\.eq\('discover_paused',\s*false\)/.test(enquire), 'the pause predicate must reach the door');
});

t('§2.3 species resolution reads demo_vendors from the DB, never a body flag', () => {
  assert.ok(/from\('demo_vendors'\)/.test(enquire), 'the door must resolve the demo species itself');
  assert.ok(!/req\.body[^\n]*is_demo/.test(enquire), 'the door must never trust a client is_demo flag');
});

t('§2.4 F-07.40 — the vendor-ping failure is LOUD and the wire carries `sent`', () => {
  assert.ok(/VENDOR NOT NOTIFIED/.test(enquire), 'the swallow must be loud');
  assert.ok(/lead_created/.test(enquire) && /enquiry_saved/.test(enquire),
    'the response must carry field-by-field truth for the sheet to be honest about');
});

t('§2.5 F5 — the clash predicate excludes soft-deleted events', () => {
  const q = enrich.slice(enrich.indexOf("from('events')"), enrich.indexOf("from('events')") + 400);
  assert.ok(/\.is\('deleted_at',\s*null\)/.test(q), 'a deleted event must not be quoted back at the vendor');
});

t('§2.6 F-07.36 — BOTH claim routes carry requireAdminPassword', () => {
  assert.ok(/router\.get\('\/claims',\s*requireAdminPassword/.test(demoAdmin), 'GET /claims must be guarded');
  assert.ok(/router\.patch\('\/claims\/:id\/contacted',\s*requireAdminPassword/.test(demoAdmin), 'PATCH must be guarded');
});

t('§2.7 F-07.36 — no route in this file is left unguarded', () => {
  const routes = demoAdmin.match(/router\.(get|post|patch|delete)\([^)]*/g) || [];
  const naked = routes.filter(r => !/requireAdminPassword/.test(r));
  assert.strictEqual(naked.length, 0, `unguarded admin routes: ${naked.join(' | ')}`);
});

t('§2.8 F-07.37 — the claim route no longer returns ok on a failed insert', () => {
  // Scoped to the CATCH BLOCK's code. The removed line survives as a quotation
  // inside the cure's comment (the estate's "THIS BLOCK READ:" convention), so a
  // whole-file string grep would convict the record of the fix rather than the
  // fix. What must be true is behavioural: the catch returns a failure.
  const claimRoute = demoVend.slice(demoVend.indexOf("router.post('/:handle/claim'"));
  const catchBody  = code(claimRoute.slice(claimRoute.indexOf('} catch (err) {')));
  assert.ok(!/res\.json\(\{\s*ok:\s*true/.test(catchBody), 'the catch must not return ok:true');
  assert.ok(/ok:\s*false/.test(catchBody), 'a failed claim must report failure');
  assert.ok(/status\(50\d\)/.test(catchBody), 'a server-side failure must carry a 5xx');
});

t('§2.9 F-07.38 — the conversion job\'s catch is loud, not silent', () => {
  assert.ok(!/catch \(_e\) \{ \/\* vendor lookup shape/.test(prospects), 'the silent catch must be gone');
  assert.ok(/prospects:conversion\] lookup FAILED/.test(prospects), 'the failure must announce itself');
});

t('§2.10 the demo leg promises no reply and saves no enquiry row (spec §3 guardrail)', () => {
  const leg = enquire.slice(enquire.indexOf('handleDemoVendor({ supabase, res, demoVendor'));
  assert.ok(/enquiry_saved:\s*false/.test(leg), 'there is no couple_enquiries row for a demo vendor');
  assert.ok(!/replied/.test(leg), 'the demo path must never describe a reply');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§3 — MUTATION: proving §1 and §2 are non-vacuous (PRODUCTION code broken)');

function mutate(relPath, from, to, cellName, cell) {
  const abs = SRC(relPath);
  if (!fs.existsSync(abs) || !fs.readFileSync(abs, 'utf8').includes(from)) {
    t(`§3 ${cellName} goes RED when its production code is broken`, () => {
      throw new Error(`mutation anchor absent (uncured tree): ${relPath}`);
    });
    return;
  }
  const original = fs.readFileSync(abs, 'utf8');
  fs.writeFileSync(abs, original.replace(from, to));
  let wentRed = false;
  try {
    delete require.cache[require.resolve(abs)];
    cell();
  } catch (_e) { wentRed = true; }
  fs.writeFileSync(abs, original);
  delete require.cache[require.resolve(abs)];
  t(`§3 ${cellName} goes RED when its production code is broken`, () => {
    assert.ok(wentRed, `${cellName} passed over broken production code — the cell is vacuous`);
  });
}

mutate('src/lib/discover/demoLeadAlert.js',
  "const STATE_AFTER_SEND = 'templated';",
  "const STATE_AFTER_SEND = 'cold';",
  '§1.1 (the ruled state)',
  () => {
    const m = require(SRC('src/lib/discover/demoLeadAlert.js'));
    assert.strictEqual(m.STATE_AFTER_SEND, 'templated');
  });

mutate('src/lib/discover/demoLeadAlert.js',
  'const BATCH_WINDOW_MS = 48 * 60 * 60 * 1000;',
  'const BATCH_WINDOW_MS = 1 * 60 * 60 * 1000;',
  '§1.2 (the 48h window)',
  () => {
    const m = require(SRC('src/lib/discover/demoLeadAlert.js'));
    assert.strictEqual(m.BATCH_WINDOW_MS, 48 * 60 * 60 * 1000);
  });

mutate('src/api/couple/enquire.js',
  "source:      'discover',",
  "source:      'whatsapp',",
  '§2.1 (source discover)',
  () => {
    assert.ok(/source:\s*'discover'/.test(code(read('src/api/couple/enquire.js'))));
  });

mutate('src/api/couple/enquire.js',
  ".eq('discover_paused', false)",
  ".eq('discover_eligible', true)",
  '§2.2 (F-07.35 the pause predicate)',
  () => {
    const s = read('src/api/couple/enquire.js');
    assert.ok(/\.eq\('discover_paused',\s*false\)/.test(s));
  });

mutate('src/api/admin/demoAdmin.js',
  "router.get('/claims', requireAdminPassword,",
  "router.get('/claims',",
  '§2.6/§2.7 (F-07.36 the middleware)',
  () => {
    const s = read('src/api/admin/demoAdmin.js');
    const routes = s.match(/router\.(get|post|patch|delete)\([^)]*/g) || [];
    assert.strictEqual(routes.filter(r => !/requireAdminPassword/.test(r)).length, 0);
  });

mutate('src/lib/vendor/enquiryEnrichment.js',
  ".is('deleted_at', null)\n        .limit(3);",
  ".limit(3);",
  '§2.5 (F5 the deleted_at cure)',
  () => {
    const s = read('src/lib/vendor/enquiryEnrichment.js');
    const q = s.slice(s.indexOf("from('events')"), s.indexOf("from('events')") + 400);
    assert.ok(/\.is\('deleted_at',\s*null\)/.test(q));
  });

// ═════════════════════════════════════════════════════════════════════════════
(async () => {
  // §1's async cells were registered synchronously above via t(); re-drive the
  // async ones explicitly so their assertions are actually awaited.
  const asyncCells = [
    ['§1.3', async () => { const s = sender(), sb = fakeSupabase({ prospect: null });
      const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, weddingDate: '2026-12-04', now: NOW, deps: s.deps });
      assert.strictEqual(r.sent, true); assert.strictEqual(s.calls.length, 1); }],
    ['§1.4', async () => { const s = sender();
      const sb = fakeSupabase({ prospect: { id: 'p1', phone: DEMO.whatsapp_phone, last_template_at: new Date(NOW - 3600e3).toISOString() } });
      const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
      assert.strictEqual(s.calls.length, 0); assert.strictEqual(r.reason, 'batched_48h'); }],
    ['§1.8', async () => { const e = new Error('opt'); e.code = 'opted_out';
      const s = sender({ throws: e }), sb = fakeSupabase({ prospect: null });
      const r = await sendDemoLeadAlert(sb, { demoVendor: DEMO, now: NOW, deps: s.deps });
      assert.strictEqual(r.ok, false); assert.strictEqual(sb.log.inserted, null); }],
  ];
  H('§4 — ASYNC RE-DRIVE (the awaited form of §1\'s promise cells)');
  for (const [n, fn] of asyncCells) {
    try { await fn(); pass++; console.log(`  ok   ${n} awaited`); }
    catch (e) { fail++; fails.push(`${n} awaited`); console.log(`  FAIL ${n} awaited\n         ${e.message}`); }
  }

  console.log(`\n${'─'.repeat(66)}`);
  console.log(`b07_p5_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`failed cells: ${fails.join(' · ')}`); process.exit(1); }
  process.exit(0);
})();
