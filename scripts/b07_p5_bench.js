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

t('§7.6 F-07.40: enquiry_alert_vendor is REGISTERED on the vendor line and NOT approved', () => {
  const { TEMPLATES, isApproved } = require(SRC('src/lib/templates.js'));
  const tpl = TEMPLATES.enquiry_alert_vendor;
  assert.ok(tpl, 'enquiry_alert_vendor is not in the registry — the fallback has no carrier');
  assert.strictEqual(tpl.line, 'vendor');
  assert.strictEqual(tpl.category, 'UTILITY');
  // The gate, not the enum, is the mechanism (templates.js header). Assert the GATE.
  assert.strictEqual(isApproved('enquiry_alert_vendor'), false,
    'the template reports APPROVED before Meta has said so — sendWa would send it');
});

// §7.7 is ASYNC and lives in the async re-drive, for the same reason §7.2-§7.5
// do. It was registered here on the first take and reported a vacuous green;
// the awaited form then failed for a real reason (see the env note in §0).

t('§7.8 F-07.40 re-derived: no APPROVED vendor-line template honestly carries an enquiry', () => {
  const { TEMPLATES } = require(SRC('src/lib/templates.js'));
  const approvedVendor = Object.values(TEMPLATES)
    .filter(v => v.line === 'vendor' && v.status === 'approved')
    .map(v => v.key);
  // The derivation is the POINT of this cell: if a future template joins the
  // vendor line as approved, this goes RED and F-07.40 is re-opened for a human
  // to re-read the bodies — the gap is not allowed to close by accident.
  assert.deepStrictEqual(approvedVendor.sort(),
    ['crew_assignment', 'morning_nudge_vendor', 'payment_reminder'],
    'the approved vendor-line set MOVED — re-derive F-07.40 by hand before trusting the fallback');
  for (const k of approvedVendor) {
    assert.ok(!/enquir/i.test(TEMPLATES[k].body),
      `${k} now mentions an enquiry — re-read F-07.40`);
  }
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
  "    status: 'pending',\n  },",
  "    status: 'approved',\n  },",
  '§7.6 (the approval gate)',
  () => {
    const { isApproved } = require(SRC('src/lib/templates.js'));
    assert.strictEqual(isApproved('enquiry_alert_vendor'), false);
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
const CANVAS = path.join(ROOT, '..', 'dreamos-pwa', 'app/(frost)/frost/canvas/discover/page.tsx');
if (!fs.existsSync(CANVAS)) {
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
    ['§7.7', async () => {
      const { sendWa, WaTemplateNotApprovedError } = require(SRC('src/lib/sendWa.js'));
      const calls = []; let threw = null;
      try {
        await sendWa({ line: 'vendor', to: '919888294440', templateKey: 'enquiry_alert_vendor', vars: ['A','B','C'] },
          { sendTemplate: async (a) => { calls.push(a); return { ok: true }; },
            sendText:     async (a) => { calls.push(a); return { ok: true }; },
            isOptedOut:   async () => false });
      } catch (e) { threw = e; }
      assert.ok(threw instanceof WaTemplateNotApprovedError, `got ${threw && threw.name}`);
      assert.strictEqual(calls.length, 0, 'a refusal still reached the transport'); }],
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

  console.log(`\n${'─'.repeat(66)}`);
  console.log(`b07_p5_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`failed cells: ${fails.join(' · ')}`); process.exit(1); }
  process.exit(0);
})();
