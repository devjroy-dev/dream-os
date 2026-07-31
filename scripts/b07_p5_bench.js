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
// F-07.45's §7.7 needs the VENDOR lane's FROM for the same reason: sendWa
// resolves the lane BEFORE it reaches the template-approval gate (sendWa.js:195),
// so without this the cell refuses as WaLineNotConfiguredError and proves nothing
// about the approval gate it was written to prove. Process-level only; no shipped
// file carries it. The first take omitted it and the awaited cell failed honestly.
process.env.VENDOR_WHATSAPP_NUMBER = process.env.VENDOR_WHATSAPP_NUMBER || '+917011788380';

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
        // LABELED AMENDMENT (F-07.49): `.in()` and `.limit()` added because the
        // guard queries users with both phone forms. This plane already answers
        // non-prospects tables with `null` — i.e. UNREGISTERED — so §1's
        // meaning is unchanged; without these two the chain threw, the guard
        // fail-closed as designed, and §1.3/§1.4 went red on the CURED tree.
        // The fixture was behind production, not the other way round.
        in() { return this; },
        limit() { return this; },
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

mutate('src/lib/discover/enquiryFields.js',
  // NOTE: `bandCeiling` is defended TWICE — the '' early-return AND `n > 0`,
  // which also rejects Number('')===0. The first mutation attempted here broke
  // one guard and changed no behaviour, so it was not a probe at all. This one
  // breaks the contract at a single point that the other guard cannot cover.
  "  if (s === '') return null;",
  "  if (s === '') return 0;",
  '§6.6 (the zero-ceiling trap)',
  () => {
    delete require.cache[require.resolve(SRC('src/lib/discover/enquiryFields.js'))];
    const { bandCeiling } = require(SRC('src/lib/discover/enquiryFields.js'));
    assert.strictEqual(bandCeiling(''), null);
  });

mutate('src/api/couple/enquire.js',
  "      weddingDate: wedding_date || undefined,",
  "      weddingDate: undefined,",
  '§6.3 (her word reaching the clash predicate)',
  () => {
    const e = code(read('src/api/couple/enquire.js'));
    const enrich = e.slice(e.indexOf('buildEnquiryEnrichment(supabase'));
    assert.ok(/weddingDate:\s*wedding_date/.test(enrich.slice(0, 600)));
  });

mutate('src/lib/demo/maskDemoLead.js',
  "return `${parts[0]} ${surnameInitial.toUpperCase()}.`;",
  "return s;",
  '§5.1 (V8 the vetoed mask)',
  () => {
    const m = require(SRC('src/lib/demo/maskDemoLead.js'));
    assert.strictEqual(m.maskName('Priya Sharma'), 'Priya S.');
  });

mutate('src/api/demo/vendor.js',
  "const leadLines = maskedLeadLines(leads);",
  "const leadLines = (leads || []).map(l => `- ${l.bride_name}`).join('\\n');",
  '§5.8 (the model context mask)',
  () => {
    const v = read('src/api/demo/vendor.js');
    const chat = v.slice(v.indexOf("router.post('/:handle/chat'"));
    assert.ok(!/l\.bride_name/.test(chat));
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
H('§5 — F-07.41 / F-07.42: THE MASK, ITS COVERAGE, AND THE PHANTOM COLUMNS');

let maskMod = null, maskErr = null;
try { maskMod = require(SRC('src/lib/demo/maskDemoLead.js')); }
catch (e) { maskErr = e.message; }
function K() { if (!maskMod) throw new Error(`mask module absent (uncured tree): ${maskErr}`); return maskMod; }

const ROW = {
  id: 'l1', demo_vendor_id: 'demo-1',
  bride_name: 'Priya Sharma', bride_phone: '919625759924',
  bride_email: 'priya@example.com', bride_ig_handle: 'priyas',
  bride_wedding_date: '2026-12-04', bride_wedding_city: 'Delhi',
  created_at: '2026-07-31T00:00:00.000Z',
};

t('§5.1 V8 — the vetoed masked form: first name + surname initial', () => {
  assert.strictEqual(K().maskName('Priya Sharma'), 'Priya S.');
  assert.strictEqual(K().maskName('  priya   sharma  '), 'priya S.');
  assert.strictEqual(K().maskName('Priya'), 'Priya', 'a single name has no surname to initial');
  assert.strictEqual(K().maskName(''), K().FALLBACK_NAME);
});

t('§5.2 PII IS ABSENT BY CONSTRUCTION — phone/email/ig cannot appear', () => {
  const m = K().maskDemoLead(ROW);
  const flat = JSON.stringify(m);
  assert.ok(!/919625759924/.test(flat), 'bride_phone must never be served');
  assert.ok(!/priya@example\.com/.test(flat), 'bride_email must never be served');
  assert.ok(!/priyas/.test(flat), 'bride_ig_handle must never be served');
  assert.ok(!('bride_phone' in m) && !('bride_email' in m), 'the keys must not exist at all');
});

t('§5.3 V9 — month + year, never the exact day', () => {
  const m = K().maskDemoLead(ROW);
  assert.strictEqual(m.wedding_when, 'December 2026');
  assert.ok(!/2026-12-04/.test(JSON.stringify(m)), 'the exact date must not survive');
});

t('§5.4 the mask BUILDS, never spreads — a new PII column cannot leak by default', () => {
  const withNewSecret = { ...ROW, bride_passport: 'X1234567' };
  const flat = JSON.stringify(K().maskDemoLead(withNewSecret));
  assert.ok(!/X1234567/.test(flat), 'a column added tomorrow must not reach a public surface');
});

t('§5.5 F-07.42 — the model is told only what the table holds', () => {
  const lines = K().maskedLeadLines([ROW]);
  assert.ok(!/status/.test(lines), '`state` does not exist; the model must not be told one');
  assert.ok(!/message:/.test(lines), '`raw_message` does not exist; the model must not be told one');
  assert.ok(/Priya S\./.test(lines) && /December 2026/.test(lines), 'it must still say what is true');
  assert.ok(!/919625759924/.test(lines), 'PII must not reach the model context');
});

t('§5.6 F-07.42 — the summary counts only what is derivable', () => {
  const sum = K().maskedLeadSummary([ROW, ROW]);
  assert.strictEqual(sum.total, 2);
  assert.ok(!('new' in sum) && !('booked' in sum), 'permanently-zero counters must not exist');
});

t('§5.7 THE COVERAGE MAP IS APPLIED — zero select(*) on demo_leads in the public router', () => {
  const v = read('src/api/demo/vendor.js');
  const blocks = v.split("from('demo_leads')").slice(1);
  assert.strictEqual(blocks.length, 3, `expected 3 public demo_leads readers, found ${blocks.length}`);
  blocks.forEach((b, i) => {
    const head = b.slice(0, 200);
    assert.ok(/MASKED_SELECT/.test(head), `demo_leads reader #${i + 1} does not use MASKED_SELECT`);
    assert.ok(!/select\('\*'\)/.test(head), `demo_leads reader #${i + 1} still selects *`);
  });
});

t('§5.8 the MODEL CONTEXT goes through the mask (the ruling\'s center)', () => {
  const v = read('src/api/demo/vendor.js');
  const chat = v.slice(v.indexOf("router.post('/:handle/chat'"));
  assert.ok(/maskedLeadLines\(/.test(chat), 'the chat route must build its context from masked rows');
  assert.ok(!/l\.bride_name/.test(chat), 'no raw row field may be interpolated into the model context');
});

t('§5.9 the enquiry IS stored against the demo vendor, with notified_vendor from the alert', () => {
  const e = code(read('src/api/couple/enquire.js'));
  assert.ok(/from\('demo_leads'\)\.insert/.test(e), 'the demo enquiry must be stored');
  assert.ok(/notified_vendor:\s*alert\.sent === true/.test(e), 'the flag must come from the alert result');
  assert.ok(/from\('users'\)/.test(e) && /couple\.user_id/.test(e), 'hydration joins couples.user_id -> users');
});

t('§5.10 the logged-out path is ALERT-ONLY and cannot form a row', () => {
  const e = code(read('src/api/couple/enquire.js'));
  assert.ok(/if \(brideName && bridePhone\)/.test(e),
    'the row must be gated on the two NOT NULL columns, so an anonymous tap cannot form one');
});


// ═════════════════════════════════════════════════════════════════════════════
H("§6 — THE SHEET'S FOUR FIELDS: accepted, landed, and never edit-and-discarded");

const enq6 = code(read('src/api/couple/enquire.js'));

t('§6.1 the door ACCEPTS all four', () => {
  ['functions', 'wedding_date', 'city', 'budget_band'].forEach((f) => {
    assert.ok(new RegExp(`\\b${f},`).test(enq6), `the door must accept \`${f}\``);
  });
});

t('§6.2 REAL leg — every accepted field lands on a witnessed leads column', () => {
  const leg = enq6.slice(enq6.indexOf('createLead(supabase, vendor.id'));
  assert.ok(/event_types:\s*postedFunctions/.test(leg), 'functions -> leads.event_types');
  assert.ok(/wedding_date:\s*wedding_date/.test(leg), 'wedding_date -> leads.wedding_date');
  assert.ok(/wedding_city:\s*city\s*\|\|/.test(leg), 'city -> leads.wedding_city, hers first');
  assert.ok(/budget_max:\s*postedBudgetMax/.test(leg), 'budget_band -> leads.budget_max');
});

t('§6.3 HER WORD REACHES THE CLASH PREDICATE (the ruling\'s point)', () => {
  const enrich = enq6.slice(enq6.indexOf('buildEnquiryEnrichment(supabase'));
  assert.ok(/weddingDate:\s*wedding_date/.test(enrich.slice(0, 600)),
    'a corrected date must reach the availability hint, or the vendor is told about the wrong day');
});

t('§6.4 DEMO leg — posted OVERRIDES hydrated, on both fields it can hold', () => {
  assert.ok(/weddingDate = wedding_date \|\| couple\?\.wedding_date/.test(enq6), 'posted date wins');
  assert.ok(/weddingCity = city\s*\|\| couple\?\.wedding_city/.test(enq6), 'posted city wins');
});

t('§6.5 DEMO leg NEVER accepts functions or budget — no column exists to hold them', () => {
  const leg = enq6.slice(enq6.indexOf('async function handleDemoVendor'));
  assert.ok(!/postedFunctions/.test(leg), 'functions has no demo_leads column; it must not be threaded here');
  assert.ok(!/postedBudgetMax/.test(leg), 'budget has no demo_leads column; it must not be threaded here');
});

t("§6.6 the open-ended band is NO CEILING, not a zero (REAL production fn)", () => {
  const { bandCeiling } = require(SRC('src/lib/discover/enquiryFields.js'));
  assert.strictEqual(bandCeiling(''), null, "the top band ('') means no ceiling");
  assert.strictEqual(bandCeiling(null), null);
  assert.strictEqual(bandCeiling('300000'), 300000);
  assert.notStrictEqual(bandCeiling(''), 0, 'Number("") is 0 — the richest band must not become the poorest lead');
});

t('§6.7 an empty functions array is null, not an empty ARRAY write (REAL production fn)', () => {
  const { normalizeFunctions } = require(SRC('src/lib/discover/enquiryFields.js'));
  assert.strictEqual(normalizeFunctions([]), null);
  assert.strictEqual(normalizeFunctions(undefined), null);
  assert.strictEqual(normalizeFunctions(['  ', '']), null, 'blank entries must not become phantom functions');
  assert.deepStrictEqual(normalizeFunctions([' Mehendi ', 'Sangeet']), ['Mehendi', 'Sangeet']);
});

// F-07.47's cells are async; they queue here and are driven in the async foot,
// per the async-on-sync vacuity this bench already paid for once.
const asyncQueue = [];

// ═════════════════════════════════════════════════════════════════════════════
H('§7 — F-07.45: the transport arm and the surface arm');

// ── the window predicate, driven as production code ──────────────────────────
let winMod = null, winLoadErr = null;
try { winMod = require(SRC('src/lib/vendor/waWindow.js')); }
catch (e) { winLoadErr = e.message; }
function W() {
  if (!winMod) throw new Error(`waWindow module absent (uncured tree): ${winLoadErr}`);
  return winMod;
}

// A fake plane shaped to the two queries waWindow makes, and NOTHING else — if
// the module reaches for a column this does not serve, the cell fails loudly
// rather than passing over an accidental undefined.
function winSupabase({ convos = [{ id: 'c1' }], lastInboundAgoH = null, convoError = null, msgError = null } = {}) {
  return {
    from(table) {
      if (table === 'conversations') {
        const q = {
          select: () => q, eq: () => q,
          then: undefined,
        };
        q.eq = () => q;
        q.select = () => q;
        // terminal: the module awaits the builder itself after two .eq()
        return Object.assign(q, {
          then: (res) => res({ data: convoError ? null : convos, error: convoError }),
        });
      }
      if (table === 'messages') {
        const q = {};
        q.select = () => q; q.eq = () => q; q.in = () => q; q.order = () => q; q.limit = () => q;
        q.maybeSingle = async () => ({
          data: msgError || lastInboundAgoH === null
            ? null
            : { created_at: new Date(Date.now() - lastInboundAgoH * 3600e3).toISOString() },
          error: msgError,
        });
        return q;
      }
      throw new Error(`waWindow reached an unexpected table: ${table}`);
    },
  };
}

t('§7.1 the door imports sendWa, NOT the raw transport (F-07.45 transport arm)', () => {
  const src = code(read('src/api/couple/enquire.js'));
  assert.ok(/require\(['"]\.\.\/\.\.\/lib\/sendWa['"]\)/.test(src),
    'enquire.js does not require sendWa');
  assert.ok(!/require\(['"]\.\.\/\.\.\/lib\/whatsapp['"]\)/.test(src),
    'enquire.js still requires the raw transport — the bypass survives');
  assert.ok(!/\bsendWhatsApp\s*\(/.test(src),
    'enquire.js still CALLS sendWhatsApp');
});

// §7.2-§7.5 are ASYNC and are driven in the async re-drive at the foot of this
// file. They are NOT registered here: `t()` is synchronous and returns before an
// async cell's assertions ever run, so registering them here would have counted
// four greens over code nobody executed. My own §8 mutation caught exactly that
// — the 24h-ceiling mutation could not turn the cell red because the cell was
// never running. Disclosed rather than quietly relocated.

// M-INVERTED 2026-07-31: this cell asserted `isApproved === false` and was
// GREEN for the right reason while Meta held the template. Meta returned ACTIVE,
// so the old assertion would now be green over a STALE TRUTH — the P2 precedent
// (§8.4 reconciled to assert the NEW truth both directions). Re-authored to
// assert APPROVED, so that a regression of the flip reddens this cell.
t('§7.6 F-07.40: enquiry_alert_vendor is REGISTERED on the vendor line and APPROVED', () => {
  const { TEMPLATES, isApproved } = require(SRC('src/lib/templates.js'));
  const tpl = TEMPLATES.enquiry_alert_vendor;
  assert.ok(tpl, 'enquiry_alert_vendor is not in the registry — the fallback has no carrier');
  assert.strictEqual(tpl.line, 'vendor');
  assert.strictEqual(tpl.category, 'UTILITY');
  // The gate, not the enum, is the mechanism (templates.js header). Assert the GATE.
  assert.strictEqual(isApproved('enquiry_alert_vendor'), true,
    'the template is not approved — the out-of-window vendor is unreachable again');
  // The BODY is pinned to what Meta approved. A registry body that drifts from
  // the filed one builds a payload Meta rejects at send time.
  assert.ok(tpl.body.startsWith('Hi {{1}}, a new enquiry just came in from {{2}}'),
    'the approved body has drifted');
  assert.deepStrictEqual(tpl.variables, ['name', 'bride', 'link']);
});

// §7.7 is ASYNC and lives in the async re-drive, for the same reason §7.2-§7.5
// do. It was registered here on the first take and reported a vacuous green;
// the awaited form then failed for a real reason (see the env note in §0).

// M-INVERTED 2026-07-31. THIS CELL DID ITS JOB AND WENT RED. It asserted the
// approved vendor-line set was exactly three and that NONE of them mentioned an
// enquiry — a tripwire whose stated purpose was "if a future template joins the
// vendor line as approved, this goes RED and F-07.40 is re-opened for a human to
// re-read the bodies; the gap is not allowed to close by accident." Meta approved
// tdw_enquiry_alert_vendor and the tripwire tripped on precisely that event.
// Re-authored to the NEW truth, keeping the tripwire live for a FIFTH template.
t('§7.8 F-07.40 CLOSED: exactly one approved vendor-line template carries an enquiry', () => {
  const { TEMPLATES } = require(SRC('src/lib/templates.js'));
  const approvedVendor = Object.values(TEMPLATES)
    .filter(v => v.line === 'vendor' && v.status === 'approved')
    .map(v => v.key).sort();
  assert.deepStrictEqual(approvedVendor,
    ['crew_assignment', 'enquiry_alert_vendor', 'morning_nudge_vendor', 'payment_reminder'],
    'the approved vendor-line set MOVED — re-derive F-07.40 by hand before trusting the fallback');
  // THE CARRIER, and only it, may speak of an enquiry. The other three were
  // rejected as costume twice by derivation; if one of them ever acquires the
  // word, that is a body edit nobody benched and this reddens.
  const CARRIER = 'enquiry_alert_vendor';
  for (const k of approvedVendor) {
    const mentions = /enquir/i.test(TEMPLATES[k].body);
    if (k === CARRIER) {
      assert.ok(mentions, 'the carrier no longer mentions the enquiry it exists to announce');
    } else {
      assert.ok(!mentions, `${k} now mentions an enquiry — re-read F-07.40`);
    }
  }
  // The STOP hazard that disqualified morning_nudge_vendor must never reach the
  // carrier: an enquiry alert a vendor can silence by pausing MORNINGS is the
  // defect the whole finding was about.
  assert.ok(!/STOP/i.test(TEMPLATES[CARRIER].body),
    'the enquiry carrier has acquired a STOP instruction — the morning_nudge trap');
});

t('§7.9 SURFACE ARM: `ok` is bound to the lead write, not hardcoded true', () => {
  const src = code(read('src/api/couple/enquire.js'));
  assert.ok(/ok:\s*leadCreated/.test(src),
    'the real leg no longer binds ok to leadCreated');
  // The literal `ok: true` must not survive on either species' RESPONSE. The
  // 400/404 guards legitimately use `ok: false`, so only the true-literal is
  // forbidden here.
  assert.ok(!/return res\.json\(\{\s*\n?\s*ok:\s*true,/.test(src),
    'a response still returns a hardcoded ok:true — the false-done survives');
});

t('§7.10 SURFACE ARM: vendor_notified rides BOTH legs, carrying the ping fact', () => {
  const src = code(read('src/api/couple/enquire.js'));
  const hits = src.match(/vendor_notified:/g) || [];
  assert.strictEqual(hits.length, 2,
    `vendor_notified appears on ${hits.length} legs, expected 2 (real + demo)`);
  assert.ok(/vendor_notified:\s*vendorNotified/.test(src), 'the real leg does not carry the ping fact');
  assert.ok(/vendor_notified:\s*alert\.sent === true/.test(src), 'the demo leg does not carry the alert fact');
});

t('§7.11 the fallback is wired ONLY on a closed window, never over other refusals', () => {
  const src = code(read('src/api/couple/enquire.js'));
  assert.ok(/instanceof WaWindowClosedError/.test(src),
    'the template fallback is not gated on WaWindowClosedError');
  assert.ok(/templateKey:\s*'enquiry_alert_vendor'/.test(src),
    'the fallback does not reach for the filed template');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§8 — MUTATION for §7 (PRODUCTION code broken, then restored)');

// The waWindow mutation is ASYNC (the predicate is), so it is queued and driven
// inside the async foot — `mutate()` is synchronous and would score it vacuous.

mutate('src/lib/templates.js',
  "    status: 'approved',\n  },\n\n  // ── AUTHENTICATION",
  "    status: 'revoked',\n  },\n\n  // ── AUTHENTICATION",
  '§7.6 (the approval gate)',
  () => {
    const { isApproved } = require(SRC('src/lib/templates.js'));
    assert.strictEqual(isApproved('enquiry_alert_vendor'), true);
  });

mutate('src/api/couple/enquire.js',
  'ok: leadCreated,',
  'ok: true,',
  '§7.9 (the surface arm)',
  () => {
    const src = code(read('src/api/couple/enquire.js'));
    assert.ok(/ok:\s*leadCreated/.test(src));
  });

mutate('src/api/couple/enquire.js',
  "const { sendWa, WaWindowClosedError } = require('../../lib/sendWa');",
  "const { sendWhatsApp } = require('../../lib/whatsapp');",
  '§7.1 (the transport arm)',
  () => {
    const src = code(read('src/api/couple/enquire.js'));
    assert.ok(/require\(['"]\.\.\/\.\.\/lib\/sendWa['"]\)/.test(src));
  });

// ═════════════════════════════════════════════════════════════════════════════
H('§9 — ARRIVAL STATE (cross-repo, chair-ruled buildable statically)');

// THE CONVENTION IS NOT NEW. `b07_p1_bench.js:349` already reaches a sibling
// dreamos-pwa checkout and SKIPS with a named reason when it is absent. The P5
// F-A handover declined this cell believing a cross-repo read would be a
// smuggled grep; the estate had already settled the honest form, and this
// follows it exactly. The skip is DISCLOSED, never a silently preserved count
// (floor-method law).
// ── THE ONE CROSS-REPO GUARD (F-07.51) ───────────────────────────────────────
// §9 probed a FILE; §12 probed a DIRECTORY. A `/workspaces/dreamos-pwa` that
// exists but is empty, partial, or is some other checkout made §9 SKIP and §12
// RUN — and fail — in the SAME run. The founder's paste is the specimen: 80
// cells (§9's three skipped) with §12.2 red. Two guards asking two questions
// about one fact is how a bench reports a defect the tree does not have.
//
// ONE question, asked once, keyed on the WITNESSED package name — the same
// string the repo head-guard law (§10) puts in every apply block. A directory
// that cannot produce that byte is not the pwa tree, whatever it is called.
const PWA_ROOT = path.join(ROOT, '..', 'dreamos-pwa');
function pwaTreeVisible() {
  try {
    const pkg = path.join(PWA_ROOT, 'package.json');
    return fs.existsSync(pkg) && /"name":\s*"web"/.test(fs.readFileSync(pkg, 'utf8'));
  } catch (_e) { return false; }
}
const PWA_VISIBLE = pwaTreeVisible();

const CANVAS = path.join(PWA_ROOT, 'app/(frost)/frost/canvas/discover/page.tsx');
if (!PWA_VISIBLE) {
  console.log('  skip §9.1–§9.3 — the dreamos-pwa tree is not beside this one; these three');
  console.log('       cells assert the canvas closed-frame render source and cannot run here.');
} else {
  const canvas = code(fs.readFileSync(CANVAS, 'utf8'));

  t('§9.1 the closed frame renders IDENTITY at t=0 (name · category·city · price)', () => {
    assert.ok(/vendor\.name/.test(canvas),        'no name token on the canvas');
    assert.ok(/vendor\.category/.test(canvas),    'no category token on the canvas');
    assert.ok(/vendor\.city/.test(canvas),        'no city token on the canvas');
    assert.ok(/formatRs\(vendor\.starting_price\)/.test(canvas),
      'no starting-price token — D-1 governed price is absent from the closed frame');
  });

  t('§9.2 the info layer does not steal the swipe surface', () => {
    // The whole cure is additive-and-inert: a container that takes pointer
    // events would change the deck's gesture, which the spec forbids outright
    // ("Frost gesture mechanics byte-identical through P1/P6").
    // The container OPENS above the token it wraps, so the window looks
    // BACKWARD from the render site. The first take looked forward and went
    // red against correct code — a cell aimed at the wrong side of its anchor.
    const at  = canvas.indexOf('vendor.category');
    const seg = canvas.slice(Math.max(0, at - 900), at);
    assert.ok(/pointerEvents:\s*'none'/.test(seg),
      'the info layer is not pointerEvents:none — the swipe surface moved');
  });

  t('§9.3 blind is reachable ONLY through its toggle — it is never the arrival state', () => {
    // NOT a slice from the first occurrence: `code()` strips only lines that
    // BEGIN with a comment marker, so a JSX block comment's continuation lines
    // survive and the first `isBlindMode` hit is prose about the diagnosis. A
    // cell a comment can satisfy — or defeat — is not testing code (§3's law,
    // this time in the other direction). Anchor on the declaration.
    assert.ok(/isBlindMode[^\n]{0,80}useState\(false\)/.test(canvas),
      'isBlindMode does not default false — blind could be the arrival state');
    assert.ok(!/localStorage[\s\S]{0,80}blind/i.test(canvas),
      'blind has acquired a persistence path — arrival state is no longer derivable');
  });
}

// ═════════════════════════════════════════════════════════════════════════════
H('§10 — F-07.47: the phone is normalized before it touches prospects');

// A prospects plane that RECORDS what it was asked for, so a cell can assert the
// exact value used at the read and at the insert — the two sites the finding is
// about. `existing` is stored under the NORMALIZED key, as the estate stores it.
function prospectPlane({ existingNormalized = null } = {}) {
  const log = { readPhone: null, insertedPhone: null, inserted: 0 };
  return {
    log,
    from(table) {
      // F-07.49 grew a users read ABOVE the prospect read. This plane predates
      // it and threw on the new table, reddening all five §10 cells on the
      // CURED tree — a fixture failing to keep up with production, disclosed
      // rather than quietly widened. Unregistered is the right default here:
      // §10 is about phone NORMALIZATION, not about the guard, which §11 owns.
      if (table === 'users') {
        const q = {}; q.select = () => q; q.in = () => q; q.limit = () => q;
        q.maybeSingle = async () => ({ data: null });
        return q;
      }
      if (table !== 'prospects') throw new Error(`unexpected table ${table}`);
      const q = {};
      q.select = () => q;
      q.eq = (_col, val) => { log.readPhone = val; return q; };
      q.maybeSingle = async () => ({
        data: (existingNormalized && log.readPhone === existingNormalized)
          ? { id: 'p-existing', phone: existingNormalized, state: 'templated',
              notes: 'demo_lead', demo_vendor_ref: 'demo-1', last_template_at: null }
          : null,
      });
      q.insert = (row) => {
        log.inserted += 1; log.insertedPhone = row.phone;
        return { select: () => ({ single: async () => ({ data: { id: 'p-new' }, error: null }) }) };
      };
      q.update = () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }) });
      return q;
    },
  };
}

const PLUS_VENDOR = {
  id: 'demo-1', ig_handle: 'swati', display_name: 'Swati',
  category: 'Photography', city: 'Delhi',
  whatsapp_phone: '+919888294440',        // the '+' form a founder fixture would type
};
const NORMALIZED = '919888294440';

asyncQueue.push(
  ['§10.1 a "+"-form column is NORMALIZED before the prospects READ', async () => {
    const s = sender(); const sb = prospectPlane();
    await sendDemoLeadAlert(sb, { demoVendor: PLUS_VENDOR, now: NOW, deps: s.deps });
    assert.strictEqual(sb.log.readPhone, NORMALIZED,
      `the prospect read used '${sb.log.readPhone}', not the normalized form`);
  }],

  ['§10.2 a "+"-form column is NORMALIZED before the prospects INSERT', async () => {
    const s = sender(); const sb = prospectPlane();
    await sendDemoLeadAlert(sb, { demoVendor: PLUS_VENDOR, now: NOW, deps: s.deps });
    assert.strictEqual(sb.log.insertedPhone, NORMALIZED,
      `the prospect row was written as '${sb.log.insertedPhone}'`);
  }],

  ['§10.3 THE FINDING ITSELF: a "+"-form fixture MINTS NO SECOND ROW', async () => {
    // The existing prospect is stored normalized, as every other writer stores
    // it. Uncured, the raw '+' value misses it and inserts a duplicate. This is
    // the cell the finding was minted for.
    const s = sender(); const sb = prospectPlane({ existingNormalized: NORMALIZED });
    await sendDemoLeadAlert(sb, { demoVendor: PLUS_VENDOR, now: NOW, deps: s.deps });
    assert.strictEqual(sb.log.inserted, 0,
      'a SECOND prospects row was minted for a number that already existed normalized');
  }],

  ['§10.4 an already-normalized column is unchanged (the normalizer is idempotent)', async () => {
    const s = sender(); const sb = prospectPlane();
    await sendDemoLeadAlert(sb, {
      demoVendor: { ...PLUS_VENDOR, whatsapp_phone: NORMALIZED }, now: NOW, deps: s.deps });
    assert.strictEqual(sb.log.readPhone, NORMALIZED);
    assert.strictEqual(sb.log.insertedPhone, NORMALIZED);
  }],

  ['§10.5 a whitespace-only column is REFUSED, not sent (normalize-before-guard)', async () => {
    const s = sender(); const sb = prospectPlane();
    const r = await sendDemoLeadAlert(sb, {
      demoVendor: { ...PLUS_VENDOR, whatsapp_phone: '   ' }, now: NOW, deps: s.deps });
    assert.strictEqual(r.sent, false);
    assert.strictEqual(r.reason, 'no_whatsapp_phone');
    assert.strictEqual(s.calls.length, 0, 'a whitespace phone reached the transport');
  }],
);


// ═════════════════════════════════════════════════════════════════════════════
H('§11 — F-07.49: the demo alert never speaks to a registered user');

// A plane that serves BOTH tables the guard now touches. `usersRow` is what the
// users lookup returns; null = the phone is not registered.
function guardPlane({ usersRow = null, usersThrows = false } = {}) {
  const log = { usersQueriedWith: null, prospectRead: false, inserted: 0 };
  return {
    log,
    from(table) {
      if (table === 'users') {
        const q = {};
        q.select = () => q;
        q.in = (_c, vals) => { log.usersQueriedWith = vals; return q; };
        q.limit = () => q;
        q.maybeSingle = async () => {
          if (usersThrows) throw new Error('users plane down');
          return { data: usersRow };
        };
        return q;
      }
      if (table === 'prospects') {
        const q = {};
        q.select = () => q;
        q.eq = () => { log.prospectRead = true; return q; };
        q.maybeSingle = async () => ({ data: null });
        q.insert = () => { log.inserted += 1;
          return { select: () => ({ single: async () => ({ data: { id: 'p' }, error: null }) }) }; };
        q.update = () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }) });
        return q;
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

asyncQueue.push(
  ['§11.1 THE FINDING: a phone belonging to a registered user is REFUSED, nothing sent', async () => {
    const s = sender(); const sb = guardPlane({ usersRow: { id: 'u-1', phone: '+919888294440' } });
    const r = await sendDemoLeadAlert(sb, {
      demoVendor: { ...PLUS_VENDOR, whatsapp_phone: '919888294440' }, now: NOW, deps: s.deps });
    assert.strictEqual(r.sent, false);
    assert.strictEqual(r.reason, 'registered_user');
    assert.strictEqual(s.calls.length, 0, 'the template reached the transport anyway');
  }],

  ['§11.2 NO PROSPECT ROW is minted for a customer (the guard returns above both sites)', async () => {
    const s = sender(); const sb = guardPlane({ usersRow: { id: 'u-1', phone: '+919888294440' } });
    await sendDemoLeadAlert(sb, {
      demoVendor: { ...PLUS_VENDOR, whatsapp_phone: '919888294440' }, now: NOW, deps: s.deps });
    assert.strictEqual(sb.log.inserted, 0, 'a prospects row was minted for a registered user');
    assert.strictEqual(sb.log.prospectRead, false, 'the prospect plane was touched at all');
  }],

  ['§11.3 BOTH phone forms are checked — a "+"-stored user cannot slip the guard', async () => {
    const s = sender(); const sb = guardPlane();
    await sendDemoLeadAlert(sb, {
      demoVendor: { ...PLUS_VENDOR, whatsapp_phone: '919888294440' }, now: NOW, deps: s.deps });
    assert.deepStrictEqual(sb.log.usersQueriedWith, ['919888294440', '+919888294440'],
      `the guard queried ${JSON.stringify(sb.log.usersQueriedWith)}`);
  }],

  ['§11.4 an UNREGISTERED phone still alerts — the guard is not a blanket refusal', async () => {
    const s = sender(); const sb = guardPlane({ usersRow: null });
    const r = await sendDemoLeadAlert(sb, {
      demoVendor: { ...PLUS_VENDOR, whatsapp_phone: '918595986978' }, now: NOW, deps: s.deps });
    assert.strictEqual(r.sent, true, `unregistered phone was refused: ${r.reason}`);
    assert.strictEqual(s.calls.length, 1);
  }],

  ['§11.5 a FAILED lookup refuses rather than assuming unregistered', async () => {
    const s = sender(); const sb = guardPlane({ usersThrows: true });
    const r = await sendDemoLeadAlert(sb, {
      demoVendor: { ...PLUS_VENDOR, whatsapp_phone: '919888294440' }, now: NOW, deps: s.deps });
    assert.strictEqual(r.sent, false);
    assert.strictEqual(r.reason, 'registered_check_failed');
    assert.strictEqual(s.calls.length, 0);
  }],
);

// ═════════════════════════════════════════════════════════════════════════════
H('§12 — F-07.50: the link inside the approved template resolves');

t('§12.1 the Leads URL lives at ONE named home, not inline in the vars array', () => {
  const src = code(read('src/api/couple/enquire.js'));
  assert.ok(/const VENDOR_LEADS_URL = 'https:\/\/thedreamwedding\.in\/vendor\/discover\/leads';/.test(src),
    'the Leads URL constant is missing or has drifted');
  assert.ok(!/'https:\/\/thedreamwedding\.in\/vendor\/leads'/.test(src),
    'the DEAD /vendor/leads path is still present — it 404s and ships in an approved template');
});

// Cross-repo, b07_p1_bench.js:349 convention: sibling tree or a named skip.
if (!PWA_VISIBLE) {
  console.log('  skip §12.2–§12.3 — the dreamos-pwa tree is not beside this one; these two');
  console.log('       cells resolve the template link against the real route table.');
} else {
  t('§12.2 that URL resolves to a REAL Next route (a page.tsx exists there)', () => {
    assert.ok(fs.existsSync(path.join(PWA_ROOT, 'app/vendor/discover/leads/page.tsx')),
      'the Leads route moved — the approved template now points at a 404');
  });

  t('§12.3 the dead path has NOT quietly acquired a route (this cell is the tripwire)', () => {
    // If /vendor/leads is ever created, this cell reddens and a human decides
    // which of the two is canonical — rather than two Leads pages drifting apart.
    assert.ok(!fs.existsSync(path.join(PWA_ROOT, 'app/vendor/leads/page.tsx')),
      '/vendor/leads now exists too — decide which is canonical before shipping both');
  });
}

// ═════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// §13 — F-07.54: THE DEMO SPECIES CARRIES NO ROUTING TOKEN
// The disease is an UNRESOLVABLE token on TDW's own line, never a wa.me link as
// such. vendorInbound resolves `vendors.routing_handle` and never reads
// demo_vendors, so a demo `ig_handle` shipped as a token misses Step B, skips
// Step B.5 (guard: !startsWith('TDW-')) and lands in Step C — dead end at zero
// threads, MISROUTE into an unrelated vendor at one.
// ═══════════════════════════════════════════════════════════════════════════
H('§13 — F-07.54: the demo species carries no routing token');

const DISC6 = code(fs.readFileSync(SRC('src/api/couple/discover.js'), 'utf8'));
const DEMOV = code(fs.readFileSync(SRC('src/api/demo/vendor.js'), 'utf8'));
const demoBranch = DISC6.slice(0, DISC6.indexOf('routing_handle: v.routing_handle'));

t('§13.1 mint 1 — the Frost feed demo branch emits routing_handle: null', () => {
  assert.ok(/routing_handle:\s*null/.test(demoBranch), 'demo branch still mints a token');
  assert.ok(!/routing_handle:\s*v\.ig_handle/.test(DISC6), 'ig_handle still shipped as a token');
});

t('§13.2 mint 1 — the Frost feed demo branch emits enquire_link: null', () => {
  assert.ok(!/enquire_link:\s*v\.ig_handle\s*\?/.test(DISC6), 'demo enquire_link still built from ig_handle');
});

t('§13.3 D-3 SURVIVES — the demo branch still emits instagram_handle for the chip', () => {
  assert.ok(/instagram_handle:\s*normalizeIgHandle\(v\.ig_handle\)/.test(DISC6),
    'the IG chip lost its feed — the cure over-reached');
});

t('§13.4 mint 2 — the demodiscover feed emits routing_handle: null', () => {
  assert.ok(!/routing_handle:\s*v\.ig_handle/.test(DEMOV), 'second mint still ships a token');
});

// GUARD CELL, NAMED (§11.4 convention): this passes on BOTH trees by design. The
// chair EXEMPTED demo/vendor.js's enquire_link — it is a direct-phone link to the
// demo vendor's OWN number, tokenless, and carries none of F-07.54's disease.
// The cell exists so a later sitting cannot "finish the job" by deleting it.
t('§13.5 GUARD — the demodiscover direct-phone link is left ALIVE by ruling', () => {
  assert.ok(/enquire_link:\s*v\.whatsapp_phone\s*\?/.test(DEMOV),
    'the exempted direct-phone link was removed — that is a Block 08 surface');
});

if (!PWA_VISIBLE) {
  console.log('  skip §13.6–§13.9 — the dreamos-pwa tree is not beside this one; the four');
  console.log('       mount-watching cells read consumer sources and cannot run here.');
} else {
  // THE MOUNTS ARE WATCHED, NOT TOUCHED (CE-ruled). Each rebuilds a TDW-line link
  // ONLY from `routing_handle`, so nulling that field at the mints is sufficient.
  // These cells redden if any mount acquires a SECOND source for that link —
  // which is the only way the mint-side cure could be silently defeated.
  const M = (rel) => fs.readFileSync(path.join(PWA_ROOT, rel), 'utf8');
  const SANCT_SRC = M('app/(frost)/frost/canvas/sanctuary/page.tsx');
  const CANVAS_SRC = M('app/(frost)/frost/canvas/discover/page.tsx');
  const DEMOD_SRC = M('app/demodiscover/page.tsx');

  t('§13.6 sanctuary\'s sheet mount derives its link ONLY from routing_handle', () => {
    assert.ok(/enquireLink=\{vendor\.enquire_link\|\|\(vendor\.routing_handle\?/.test(code(SANCT_SRC)),
      'the sanctuary mount acquired a second link source');
  });
  t('§13.7 canvas\'s enquireLink helper derives ONLY from routing_handle', () => {
    assert.ok(/\(vendor\.routing_handle \? makeEnquireLink\(vendor\.routing_handle\) : null\)/.test(code(CANVAS_SRC)),
      'the canvas helper acquired a second link source');
  });
  t('§13.8 canvas\'s sheet mount derives its link ONLY from routing_handle', () => {
    assert.ok(/enquireLink=\{vendor\.enquire_link \|\| \(vendor\.routing_handle \?/.test(code(CANVAS_SRC)),
      'the canvas mount acquired a second link source');
  });
  t('§13.9 demodiscover derives its TDW-line fallback ONLY from routing_handle', () => {
    const c = code(DEMOD_SRC);
    assert.ok(/vendor\.routing_handle \? `https:\/\/wa\.me\/917982159047\?text=TDW-\$\{vendor\.routing_handle\}`/.test(c),
      'the demodiscover fallback acquired a second token source');
    assert.ok(!/ig_handle/.test(c), 'demodiscover began reading ig_handle directly');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// §14 — F-07.55: template sends are no longer invisible
// ═══════════════════════════════════════════════════════════════════════════
H('§14 — F-07.55: the template dispatch is visible');

const SENDWA = fs.readFileSync(SRC('src/lib/sendWa.js'), 'utf8');

// SELF-CAUGHT BY §17's MUTATION: the first take counted RAW `console.`
// occurrences, so commenting the line out still satisfied it — the same disease
// F-07.52 was minted for, reproduced in my own cell. Cells judge CODE.
t('§14.1 sendWa carries exactly ONE console statement (was zero)', () => {
  const n = (code(SENDWA).match(/console\./g) || []).length;
  assert.strictEqual(n, 1, `expected exactly one log line, found ${n}`);
});

t('§14.2 the line names bare number · template key · wamid · line', () => {
  const c = code(SENDWA);
  assert.ok(/\[sendWa:template\]/.test(c), 'no template log tag');
  assert.ok(/normalizeTo\(to\)/.test(c), 'the number is not bared');
  assert.ok(/\$\{templateKey\}/.test(c), 'the template key is not named');
  assert.ok(/wamid/.test(c), 'the wamid is not carried');
  assert.ok(/\[line=\$\{line\}\]/.test(c), 'the lane is not named');
});

// THE PRIVACY EXCLUSION IS THE LINE'S STATED LAW (CE-ratified, F-07.41's family).
// Template vars carry customer data — her name, her wedding month. A later
// sitting "improving" this log by rendering them reddens here.
t('§14.3 the line does NOT log the rendered payload or vars', () => {
  const logLine = code(SENDWA).split('\n').find(l => l.includes('[sendWa:template]'));
  assert.ok(logLine, 'the log line vanished');
  assert.ok(!/payload|vars/.test(logLine), 'customer data entered the log');
});

// ═══════════════════════════════════════════════════════════════════════════
// §15 — F-07.56: the real leg hydrates her identity too
// ═══════════════════════════════════════════════════════════════════════════
H('§15 — F-07.56: the real leg speaks her name');

const ENQ = fs.readFileSync(SRC('src/api/couple/enquire.js'), 'utf8');
const realLeg = ENQ.slice(ENQ.indexOf('async function handleRealVendor'),
                         ENQ.indexOf('async function handleDemoVendor'));
const realCode = code(realLeg);

t('§15.1 the real leg makes the couples -> users hop', () => {
  assert.ok(/from\('couples'\)[\s\S]{0,200}user_id/.test(realCode), 'no couples hop');
  assert.ok(/from\('users'\)[\s\S]{0,200}select\('name, phone'\)/.test(realCode), 'no users hop');
});

t('§15.2 HYDRATED wins, posted is the fallback (identity precedence)', () => {
  assert.ok(/hydratedName\s*\|\|\s*bride_name/.test(realCode), 'posted still overrides identity');
  assert.ok(/hydratedPhone\s*\|\|\s*bride_phone/.test(realCode), 'posted still overrides phone');
});

// THE SEVEN-SITE CURE. The finding named three consumers; the leg had seven.
// Curing three would leave the cabinet, binder and prospect saying "a couple"
// while the ping said her name — a hollow green inside the vendor's own drawer.
t('§15.3 ZERO raw bride_name/bride_phone consumers remain in the real leg', () => {
  const body = realCode.split('\n').slice(1).join('\n');   // drop the signature
  const raw = body.split('\n').filter(l =>
    /\bbride_name\b|\bbride_phone\b/.test(l) &&
    !/brideNameFinal|bridePhoneFinal|hydratedName|hydratedPhone/.test(l));
  assert.strictEqual(raw.length, 0, `raw consumers still present:\n${raw.join('\n')}`);
});

// GUARD CELL, NAMED: the UTTERANCE precedence must NOT be harmonized to match the
// identity one. Passes on both trees; it exists to hold the distinction.
t('§15.4 GUARD — the demo leg keeps POSTED-over-HYDRATED for date and city', () => {
  const demoLeg = code(ENQ.slice(ENQ.indexOf('async function handleDemoVendor')));
  assert.ok(/wedding_date \|\| couple\?\.wedding_date/.test(demoLeg), 'date precedence flipped');
  assert.ok(/city\s*\|\| couple\?\.wedding_city/.test(demoLeg), 'city precedence flipped');
});

// ═══════════════════════════════════════════════════════════════════════════
// §16 — F-07.57: the returning-bride notification read a null
// ═══════════════════════════════════════════════════════════════════════════
H('§16 — F-07.57: the single-thread branch uses its OWN vendor identity');

const VIN = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');

t('§16.1 the returning notification is keyed on the branch\'s own thread vendor', () => {
  const line = code(VIN).split('\n').find(l => l.includes("vendorInbound:notification(returning)"));
  assert.ok(line, 'the returning-notification site vanished');
  assert.ok(/vendorId: existingThread\.vendor_id/.test(line),
    'the notification still reads a variable that is null in this branch');
});

t('§16.2 no use of matchedByTdw survives OUTSIDE its own guard block', () => {
  const c = code(VIN);
  const lines = c.split('\n');
  const guardAt = lines.findIndex(l => /if \(matchedByTdw\) \{/.test(l));
  assert.ok(guardAt > 0, 'the Step B guard vanished');
  // the sticky/binder uses live inside the block; the single-thread branch is far below.
  const afterBranch = lines.slice(lines.findIndex(l => /if \(threadCount === 1\)/.test(l)));
  const leaks = afterBranch.filter(l => /matchedByTdw/.test(l));
  assert.strictEqual(leaks.length, 0, `unguarded use(s) remain:\n${leaks.join('\n')}`);
});


// ═══════════════════════════════════════════════════════════════════════════
// §17 — BOTH-WAYS: every §13–§16 cell RED at the uncured tree, by mutating
// PRODUCTION code. §13–§16 read their sources into consts at module load, so
// the §3 `mutate()` helper (which busts require-cache) would be VACUOUS for
// them — the const would still hold pre-mutation bytes and the cell would pass
// over broken code. This helper re-reads the file inside the closure, which is
// the only form that can turn these particular cells red.
// ═══════════════════════════════════════════════════════════════════════════
H('§17 — both-ways: the §13–§16 cells over BROKEN production code');

function mutateSrc(rel, from, to, cellName, assertOnFresh) {
  const abs = SRC(rel);
  const original = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (original === null || !original.includes(from)) {
    t(`§17 ${cellName} goes RED when its production code is broken`, () => {
      throw new Error(`mutation anchor absent (uncured tree): ${rel} <- ${from}`);
    });
    return;
  }
  fs.writeFileSync(abs, original.replace(from, to));
  let wentRed = false;
  try { assertOnFresh(fs.readFileSync(abs, 'utf8')); } catch (_e) { wentRed = true; }
  fs.writeFileSync(abs, original);
  assert.strictEqual(fs.readFileSync(abs, 'utf8'), original, `${rel} not restored byte-identical`);
  t(`§17 ${cellName} goes RED when its production code is broken`, () => {
    assert.ok(wentRed, `${cellName} passed over broken production code — the cell is vacuous`);
  });
}

// F-07.54 mint 1 — put the token back.
mutateSrc('src/api/couple/discover.js',
  'routing_handle: null,', 'routing_handle: v.ig_handle || null,',
  '§13.1 (mint 1 token)', (src) => {
    const c = code(src);
    const branch = c.slice(0, c.indexOf('routing_handle: v.routing_handle'));
    assert.ok(/routing_handle:\s*null/.test(branch));
    assert.ok(!/routing_handle:\s*v\.ig_handle/.test(c));
  });

// F-07.54 mint 1 — put the link back.
mutateSrc('src/api/couple/discover.js',
  'enquire_link:   null,', 'enquire_link:   v.ig_handle ? `${ENQUIRE_BASE}${v.ig_handle}` : null,',
  '§13.2 (mint 1 link)', (src) => {
    assert.ok(!/enquire_link:\s*v\.ig_handle\s*\?/.test(code(src)));
  });

// D-3 — take the chip's feed away. This must redden, or the cure could silently
// starve the chip and no cell would notice.
mutateSrc('src/api/couple/discover.js',
  'instagram_handle: normalizeIgHandle(v.ig_handle)', 'instagram_handle: null',
  '§13.3 (the chip feed)', (src) => {
    assert.ok(/instagram_handle:\s*normalizeIgHandle\(v\.ig_handle\)/.test(code(src)));
  });

// F-07.54 mint 2 — put the second token back.
mutateSrc('src/api/demo/vendor.js',
  'routing_handle: null,', 'routing_handle: v.ig_handle,',
  '§13.4 (mint 2 token)', (src) => {
    assert.ok(!/routing_handle:\s*v\.ig_handle/.test(code(src)));
  });

// F-07.55 — remove the log line entirely.
mutateSrc('src/lib/sendWa.js',
  'console.log(`[sendWa:template]', '// console.log(`[sendWa:template]',
  '§14.1 (the log line)', (src) => {
    // MIRRORS THE HARDENED CELL EXACTLY. The first take asserted on raw text
    // while the cell asserts on stripped code — a mutation that does not ask
    // the cell's own question proves nothing about the cell.
    assert.strictEqual((code(src).match(/console\./g) || []).length, 1);
  });

// F-07.55 — the privacy law: log the payload and this must redden.
mutateSrc('src/lib/sendWa.js',
  '[line=${line}]`);', '[line=${line}] ${JSON.stringify(payload)}`);',
  '§14.3 (the privacy exclusion)', (src) => {
    const logLine = code(src).split('\n').find(l => l.includes('[sendWa:template]'));
    assert.ok(logLine && !/payload|vars/.test(logLine));
  });

// F-07.56 — flip the identity precedence back to posted-first.
mutateSrc('src/api/couple/enquire.js',
  'const brideNameFinal  = hydratedName  || bride_name  || null;',
  'const brideNameFinal  = bride_name  || hydratedName  || null;',
  '§15.2 (identity precedence)', (src) => {
    const leg = code(src.slice(src.indexOf('async function handleRealVendor'),
                              src.indexOf('async function handleDemoVendor')));
    assert.ok(/hydratedName\s*\|\|\s*bride_name/.test(leg));
  });

// F-07.56 — restore ONE of the seven raw consumers. The seven-site cure must be
// provable as seven, not three: reverting a single site has to redden.
mutateSrc('src/api/couple/enquire.js',
  "raw_message: `${brideNameFinal || 'A bride'} enquired",
  "raw_message: `${bride_name || 'A bride'} enquired",
  '§15.3 (the seventh consumer)', (src) => {
    const leg = code(src.slice(src.indexOf('async function handleRealVendor'),
                               src.indexOf('async function handleDemoVendor')));
    const body = leg.split('\n').slice(1).join('\n');
    const raw = body.split('\n').filter(l =>
      /\bbride_name\b|\bbride_phone\b/.test(l) &&
      !/brideNameFinal|bridePhoneFinal|hydratedName|hydratedPhone/.test(l));
    assert.strictEqual(raw.length, 0);
  });

// F-07.57 — put the null read back. THE FIXTURE DRIVES THIS, not production:
// the demo-null cure removes production's dominant source of unresolvable
// tokens, so the trigger is manufactured here rather than waited for.
mutateSrc('src/lib/vendorInbound.js',
  "vendorId: existingThread.vendor_id, surface: 'whatsapp', ctx: 'vendorInbound:notification(returning)'",
  "vendorId: matchedByTdw.id, surface: 'whatsapp', ctx: 'vendorInbound:notification(returning)'",
  '§16.1 (the null read)', (src) => {
    const line = code(src).split('\n').find(l => l.includes("vendorInbound:notification(returning)"));
    assert.ok(line && /vendorId: existingThread\.vendor_id/.test(line));
  });


// ═══════════════════════════════════════════════════════════════════════════
// §18 — FORK B: the done-state is the confirming surface
// BOTH HALVES, per the chair's bench note: the frozen string PRESENT in the
// done-state, AND the success-toast suppression conditioned on the sheet path,
// with the FAILURE toast's firing asserted UNCHANGED. Both inverse mutations
// must redden: un-suppressing success, and suppressing failure.
// ═══════════════════════════════════════════════════════════════════════════
H('§18 — Fork B: the done-state confirms, the success toast stands down');

if (!PWA_VISIBLE) {
  console.log('  skip §18.1–§18.8 — the dreamos-pwa tree is not beside this one; these cells');
  console.log('       read the sheet and both mounts and cannot run here.');
} else {
  const PREL  = (rel) => path.join(PWA_ROOT, rel);
  const PREAD = (rel) => fs.readFileSync(PREL(rel), 'utf8');
  const SHEET_R = 'components/frost/EnquirySheet.tsx';
  const SANCT_R = 'app/(frost)/frost/canvas/sanctuary/page.tsx';
  const CANV_R  = 'app/(frost)/frost/canvas/discover/page.tsx';

  // The vetoed bytes, written here as the CONTRACT rather than read from the
  // file — a cell that reads its expectation from the thing under test proves
  // nothing. These are the founder's words: V6's two success arms, and the one
  // new string vetoed 2026-07-31.
  const FROZEN_SAVED = "Enquiry sent \u2726 saved in Vendors";
  const FROZEN_PLAIN = "Enquiry sent";
  const FROZEN_FAIL  = "Could not send. Try again.";
  const VETOED_NEW   = "Continue on WhatsApp";

  const sheet = PREAD(SHEET_R);

  t('§18.1 the done-state renders the frozen confirmation, same enquiry_saved conditional', () => {
    assert.ok(/done\.enquiry_saved \? CONFIRM_SAVED : CONFIRM_PLAIN/.test(code(sheet)),
      'the done-state does not carry the frozen conditional');
  });

  t('§18.2 the frozen strings are BYTE-IDENTICAL to the toast arms they re-home', () => {
    assert.ok(sheet.includes(`'${FROZEN_SAVED}'`), 'the saved arm drifted from the vetoed bytes');
    assert.ok(sheet.includes(`'${FROZEN_PLAIN}'`), 'the plain arm drifted from the vetoed bytes');
  });

  // BORN OF THE FOUNDER'S WALK. Presence-cells cannot see duplication: §18.1
  // asserted the confirmation was there, and it was — beneath a second copy of
  // the expectation line the header already renders. Cells that assert PRESENCE
  // must be paired with cells that assert COUNT wherever a surface can repeat.
  t('§18.8 the expectation line renders EXACTLY ONCE (it is the header\'s)', () => {
    const n = (code(sheet).match(/\{EXPECTATION\}/g) || []).length;
    assert.strictEqual(n, 1, `the expectation line renders ${n} times, not once`);
  });

  // BORN OF THE FOUNDER'S WALK (second catch): Fork B leaves the sheet up, and
  // the card panel behind it is only hidden by the sheet's HEIGHT. The done-state
  // is short, so the panel re-emerged and the surface showed two stacked cards.
  t('\u00a718.9 the card panel stands down while the sheet is up', () => {
    const sanct = code(PREAD(SANCT_R));
    assert.ok(/visible=\{panelOpen && !sheetOpen\}/.test(sanct),
      'the panel is still visible behind the sheet — two stacked cards');
  });

  t('§18.3 the affordance renders ONLY when a lawful address exists', () => {
    assert.ok(/\{enquireLink && \(/.test(sheet),
      'the affordance is unconditional — a demo card would render a dead control');
  });

  t('§18.4 the affordance carries the vetoed label, byte-exact', () => {
    assert.ok(sheet.includes(`'${VETOED_NEW}'`), 'the vetoed string drifted');
  });

  // F1(b): the auto-fire is dead. The link survives as a tapped affordance only.
  t('§18.5 submit no longer opens a second channel unasked', () => {
    // SELF-CAUGHT: the first take took `indexOf('return (')` from position 0,
    // which matched an effect-cleanup `return () => ...` ABOVE submit and sliced
    // backwards to nothing. The boundary must be searched FROM the function head.
    const c = code(sheet);
    const from = c.indexOf('async function submit');
    const submit = c.slice(from, c.indexOf('return (', from));
    assert.ok(!/window\.open/.test(submit), 'the auto-fire is still in the submit handler');
    assert.ok(/if \(result\.ok\) setDone\(result\)/.test(submit), 'success does not raise the done-state');
  });

  for (const [label, rel] of [['sanctuary', SANCT_R], ['canvas', CANV_R]]) {
    const src = PREAD(rel);
    t(`§18.6 ${label}: the SUCCESS toast stands down when the sheet confirms`, () => {
      assert.ok(/if \(r\.ok\) return;/.test(code(src)),
        `${label} still raises a toast over the done-state`);
    });
    t(`§18.7 ${label}: the FAILURE toast fires UNCHANGED, byte-exact`, () => {
      assert.ok(code(src).includes(`setEnquiryToast('${FROZEN_FAIL}')`),
        `${label}'s failure arm drifted — it is F-07.45's arm and must not move`);
      assert.ok(/setTimeout\(\(\) => setEnquiryToast\(null\), 2600\)|setTimeout\(\(\)=>setEnquiryToast\(null\),2600\)/.test(code(src)),
        `${label}'s failure toast lost its dismissal`);
    });
  }

  // ── BOTH INVERSE MUTATIONS, on PWA production code ────────────────────────
  // mutateSrc() is dream-os-rooted; this is its PWA twin. Same law (promoted at
  // this sitting): a mutation helper must bust whatever caching the cell's read
  // path uses — here the read is inside the closure, so a fresh read suffices.
  function mutatePwa(rel, from, to, cellName, assertOnFresh) {
    const abs = PREL(rel);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (original === null || !original.includes(from)) {
      t(`§18 ${cellName} goes RED when its production code is broken`, () => {
        throw new Error(`mutation anchor absent: ${rel} <- ${from}`);
      });
      return;
    }
    fs.writeFileSync(abs, original.replace(from, to));
    let wentRed = false;
    try { assertOnFresh(fs.readFileSync(abs, 'utf8')); } catch (_e) { wentRed = true; }
    fs.writeFileSync(abs, original);
    assert.strictEqual(fs.readFileSync(abs, 'utf8'), original, `${rel} not restored byte-identical`);
    t(`§18 ${cellName} goes RED when its production code is broken`, () => {
      assert.ok(wentRed, `${cellName} passed over broken production code — vacuous`);
    });
  }

  // INVERSE 1 — un-suppress the success toast. Must redden.
  mutatePwa(SANCT_R, 'if (r.ok) return;', '', '§18.6 (success suppression)',
    (src) => { assert.ok(/if \(r\.ok\) return;/.test(code(src))); });

  // INVERSE 2 — suppress the FAILURE toast. Must redden: it is F-07.45's arm.
  mutatePwa(SANCT_R, "setEnquiryToast('Could not send. Try again.');", '',
    '§18.7 (failure toast firing)',
    (src) => { assert.ok(code(src).includes("setEnquiryToast('Could not send. Try again.')")); });

  // INVERSE 5 — leave the panel visible behind the sheet. Must redden.
  mutatePwa(SANCT_R, 'visible={panelOpen && !sheetOpen}', 'visible={panelOpen}',
    '\u00a718.9 (the stacked panel)',
    (src) => { assert.ok(/visible=\{panelOpen && !sheetOpen\}/.test(code(src))); });

  // INVERSE 4 — put the duplicate expectation line back. Must redden.
  mutatePwa(SHEET_R, '{enquireLink && (',
    '<div>{EXPECTATION}</div>\n            {enquireLink && (',
    '\u00a718.8 (the duplicate expectation line)',
    (src) => { assert.strictEqual((code(src).match(/\{EXPECTATION\}/g) || []).length, 1); });

  // INVERSE 3 — restore F1(b)'s auto-fire. Must redden.
  mutatePwa(SHEET_R, 'if (result.ok) setDone(result);',
    "if (enquireLink) { try { window.open(enquireLink, '_blank'); } catch {} }",
    '§18.5 (the auto-fire death)',
    (src) => {
      const c = code(src);
      const submit = c.slice(c.indexOf('async function submit'), c.indexOf('return ('));
      assert.ok(!/window\.open/.test(submit));
      assert.ok(/if \(result\.ok\) setDone\(result\)/.test(submit));
    });
}


// ═══════════════════════════════════════════════════════════════════════════
// §19 — THE VENDOR PING'S FOUR VETOED STRINGS (founder-approved 2026-08-01)
// Frozen at these BYTES. F-07.56 activated a latent copy defect: the label was
// written when the named arm was dead, and hydration made it the default —
// "Bride: Dev Test 23 is interested in your work." reached a real vendor.
// ═══════════════════════════════════════════════════════════════════════════
H('§19 — the vendor ping: four vetoed strings, frozen');

const ENQ19 = () => fs.readFileSync(SRC('src/api/couple/enquire.js'), 'utf8');
const realLeg19 = (src) => code(src.slice(src.indexOf('async function handleRealVendor'),
                                          src.indexOf('async function handleDemoVendor')));

t('§19.1 the NAMED arm renders the hydrated name BARE — no label', () => {
  const leg = realLeg19(ENQ19());
  assert.ok(/brideNameFinal \? `\$\{brideNameFinal\}`/.test(leg),
    'the named arm is not bare — a label is spliced into the sentence again');
  assert.ok(!/`Bride: \$\{brideNameFinal\}`/.test(leg), 'the Bride: label is back');
});

t('§19.2 the FALLBACK arm says COUPLE, not bride', () => {
  const leg = realLeg19(ENQ19());
  assert.ok(leg.includes("'A couple on The Dream Wedding'"), 'the fallback drifted');
  assert.ok(!leg.includes("'A bride on The Dream Wedding'"), 'the bride form survives');
});

t('§19.3 the contact line is `Contact:`, unlabelled by role', () => {
  const leg = realLeg19(ENQ19());
  assert.ok(/\\nContact: \$\{bridePhoneFinal\}/.test(leg), 'the contact line drifted');
  assert.ok(!/Bride contact:/.test(leg), 'the old contact label survives');
});

t('§19.4 the closing sentence reads THEY, not she', () => {
  const leg = realLeg19(ENQ19());
  assert.ok(leg.includes('They found you on the Discover feed. Reply on WhatsApp to connect.'),
    'the closing sentence drifted from the vetoed bytes');
  assert.ok(!leg.includes('She found you on the Discover feed'), 'the she form survives');
});

// BOTH-WAYS: each vetoed string's mutation must REDDEN. Vetoed copy is frozen at
// the BYTE (the §18.2 law) — a drift that renders "close enough" is still drift.
mutateSrc('src/api/couple/enquire.js',
  'brideNameFinal ? `${brideNameFinal}` : ', 'brideNameFinal ? `Bride: ${brideNameFinal}` : ',
  '\u00a719.1 (the bare named arm)',
  (src) => { const l = realLeg19(src); assert.ok(/brideNameFinal \? `\$\{brideNameFinal\}`/.test(l) && !/`Bride: \$\{brideNameFinal\}`/.test(l)); });

mutateSrc('src/api/couple/enquire.js',
  "'A couple on The Dream Wedding'", "'A bride on The Dream Wedding'",
  '\u00a719.2 (the couple fallback)',
  (src) => { const l = realLeg19(src); assert.ok(l.includes("'A couple on The Dream Wedding'") && !l.includes("'A bride on The Dream Wedding'")); });

mutateSrc('src/api/couple/enquire.js',
  '\\nContact: ${bridePhoneFinal}', '\\nBride contact: ${bridePhoneFinal}',
  '\u00a719.3 (the contact line)',
  (src) => { const l = realLeg19(src); assert.ok(/\\nContact: \$\{bridePhoneFinal\}/.test(l) && !/Bride contact:/.test(l)); });

mutateSrc('src/api/couple/enquire.js',
  'They found you on the Discover feed.', 'She found you on the Discover feed.',
  '\u00a719.4 (the closing sentence)',
  (src) => { const l = realLeg19(src); assert.ok(l.includes('They found you on the Discover feed.') && !l.includes('She found you on the Discover feed')); });

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
  // ── F-07.45's async cells, driven where they actually run ────────────────
  asyncCells.push(
    ['§7.2', async () => { const r = await W().vendorWindowOpen(winSupabase({ convos: [] }), 'v1');
      assert.strictEqual(r.open, false); assert.strictEqual(r.reason, 'no_conversation'); }],
    ['§7.3', async () => { const r = await W().vendorWindowOpen(winSupabase({ lastInboundAgoH: 1 }), 'v1');
      assert.strictEqual(r.open, true); assert.strictEqual(r.reason, 'in_window'); }],
    ['§7.4', async () => { const r = await W().vendorWindowOpen(winSupabase({ lastInboundAgoH: 30 }), 'v1');
      assert.strictEqual(r.open, false); assert.strictEqual(r.reason, 'window_closed'); }],
    ['§7.5', async () => { const r = await W().vendorWindowOpen({ from() { throw new Error('plane down'); } }, 'v1');
      assert.strictEqual(r.open, false); assert.ok(/window_check_threw/.test(r.reason)); }],
    // M-INVERTED 2026-07-31 with §7.6: this cell proved sendWa REFUSED the pending
  // template. Meta approved it, so the refusal is no longer the truth to assert —
  // the DISPATCH is. A cell left asserting the old refusal would have gone red at
  // the flip and been "fixed" by deleting it; it is re-aimed instead.
  ['§7.7', async () => {
    const { sendWa } = require(SRC('src/lib/sendWa.js'));
    const calls = [];
    const r = await sendWa(
      { line: 'vendor', to: '919888294440', templateKey: 'enquiry_alert_vendor',
        vars: ['Swati', 'Priya', 'https://thedreamwedding.in/vendor/leads'] },
      { sendTemplate: async (a) => { calls.push(a); return { ok: true }; },
        sendText:     async (a) => { calls.push(a); return { ok: true }; },
        isOptedOut:   async () => false },
    );
    assert.strictEqual(r.sent, true, 'the approved template did not dispatch');
    assert.strictEqual(r.mode, 'template');
    assert.strictEqual(calls.length, 1, 'the template did not reach the transport');
    assert.strictEqual(calls[0].key, 'enquiry_alert_vendor');
    // The payload Meta will actually receive, built from the registry.
    assert.strictEqual(calls[0].payload.name, 'tdw_enquiry_alert_vendor',
      'the WABA name does not match what the founder filed'); }],
  );

  H('§4 — ASYNC RE-DRIVE (the awaited form of §1\'s promise cells)');
  for (const [n, fn] of asyncCells) {
    try { await fn(); pass++; console.log(`  ok   ${n} awaited`); }
    catch (e) { fail++; fails.push(`${n} awaited`); console.log(`  FAIL ${n} awaited\n         ${e.message}`); }
  }


  // ── ASYNC MUTATION: the 24h ceiling, broken in PRODUCTION code ───────────
  // `mutate()` is synchronous and scored this vacuous on the first run — the
  // cell it drove returned a promise nobody awaited, so breaking the constant
  // could not turn it red. This is the awaited form.
  {
    const abs = SRC('src/lib/vendor/waWindow.js');
    const from = 'const WINDOW_HOURS = 24;';
    const to   = 'const WINDOW_HOURS = 99999;';
    if (!fs.existsSync(abs) || !fs.readFileSync(abs, 'utf8').includes(from)) {
      fail++; fails.push('§8 §7.4 async mutation');
      console.log('  FAIL §8 §7.4 (the 24h ceiling) — mutation anchor absent (uncured tree)');
    } else {
      const original = fs.readFileSync(abs, 'utf8');
      fs.writeFileSync(abs, original.replace(from, to));
      let wentRed = false;
      try {
        delete require.cache[require.resolve(abs)];
        const m = require(abs);
        const r = await m.vendorWindowOpen(winSupabase({ lastInboundAgoH: 30 }), 'v1');
        assert.strictEqual(r.reason, 'window_closed');
      } catch (_e) { wentRed = true; }
      fs.writeFileSync(abs, original);
      delete require.cache[require.resolve(abs)];
      if (wentRed) { pass++; console.log('  ok   §8 §7.4 (the 24h ceiling) goes RED when its production code is broken'); }
      else { fail++; fails.push('§8 §7.4 async mutation'); console.log('  FAIL §8 §7.4 (the 24h ceiling) passed over broken production code — vacuous'); }
    }
  }

  for (const [n, fn] of asyncQueue) {
    try { await fn(); pass++; console.log(`  ok   ${n}`); }
    catch (e) { fail++; fails.push(n); console.log(`  FAIL ${n}\n         ${e.message}`); }
  }

  console.log(`\n${'─'.repeat(66)}`);
  console.log(`b07_p5_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`failed cells: ${fails.join(' · ')}`); process.exit(1); }
  process.exit(0);
})();
