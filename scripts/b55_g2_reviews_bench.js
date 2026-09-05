#!/usr/bin/env node
'use strict';
// scripts/b55_g2_reviews_bench.js — BLOCK 19 · G2 SITTING 1.
//
// FLOOR METHOD: the EXIT CODE IS THE VERDICT. 0 green, 1 red, 2 refused.
// Both-ways law: every cell below is proven non-vacuous by MUTATING PRODUCTION
// SOURCE — never a fixture, never the bench's own setup — and the mutation list
// is printed at the foot so a reader can re-run any one of them by hand.
//
// ⚠ §1 IS THE CELL THE CHAIR NAMED AND IT IS THE MOST IMPORTANT ONE HERE.
// `buildTemplatePayload` is the function EVERY live template send in this estate
// passes through. G2 gave it a second arm. The snapshot cell renders all
// SEVENTEEN entries and asserts that the sixteen which declare no button are
// byte-identical to the body-only shape they had before — so "off by
// construction" is a fact with a cell behind it rather than a sentence in a
// comment (the citation-needs-a-cell law).

const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(__dirname, '..');
const R = (p) => path.join(ROOT, p);

let pass = 0, fail = 0;
const fails = [];

function sec(t) { console.log(`\n${t}`); }
function ok(name)        { pass++; console.log(`  GREEN  ${name}`); }
function no(name, why)   { fail++; fails.push(`${name} — ${why}`); console.log(`  RED    ${name} — ${why}`); }
function cell(name, fn) {
  try { const r = fn(); if (r === true) ok(name); else no(name, String(r)); }
  catch (e) { no(name, e && e.message); }
}

// ── the subjects, required fresh so a mutation run sees the mutated file ─────
function fresh(mod) {
  const p = require.resolve(R(mod));
  delete require.cache[p];
  return require(p);
}

// ═══ §1 · THE BUILDER'S ARM IS OFF BY CONSTRUCTION FOR EVERY OTHER ENTRY ════
sec('\u00a71 \u00b7 buildTemplatePayload \u2014 the sixteen-entry snapshot (R-G2.6)');

const T = fresh('src/lib/templates.js');

// A body-only payload, computed independently of the builder, so the assertion
// is against a SECOND derivation and not against the function under test.
function expectedBodyOnly(entry, vars) {
  const declared = entry.variables || [];
  return JSON.stringify({
    name: entry.name,
    language: { code: entry.language },
    components: declared.length
      ? [{ type: 'body', parameters: declared.map((n) => ({ type: 'text', text: String(vars[n]) })) }]
      : [],
  });
}

cell('every entry that declares no button renders body-only', () => {
  const all  = Object.keys(T.TEMPLATES);
  const keys = all.filter((k) => !T.TEMPLATES[k].button);
  // Derived, not hardcoded: exactly ONE entry declares a button, so buttonless
  // is total minus one. An appended entry moves both numbers together.
  // FULLY DERIVED. A hardcoded total is a second home for the census, and this
  // seat has already been wrong about that number once (e-4: sixteen reported,
  // twenty in the tree). The assertion that carries meaning is that EXACTLY ONE
  // entry declares a button and every other renders body-identical — both of
  // which are true at any registry size, so an appended entry never reddens this
  // cell for the wrong reason.
  if (keys.length !== all.length - 1) return `${all.length - keys.length} entries declare a button; expected exactly 1`;
  for (const k of keys) {
    const e = T.TEMPLATES[k];
    if (e.category === 'AUTHENTICATION') continue;      // its own builder
    const vars = {};
    (e.variables || []).forEach((n, i) => { vars[n] = `v${i + 1}`; });
    const got  = JSON.stringify(T.buildTemplatePayload(k, vars));
    const want = expectedBodyOnly(e, vars);
    if (got !== want) return `${k} payload moved: ${got}`;
  }
  return true;
});

cell('no buttonless payload carries a component of type button', () => {
  for (const k of Object.keys(T.TEMPLATES)) {
    const e = T.TEMPLATES[k];
    if (e.button || e.category === 'AUTHENTICATION') continue;
    const vars = {};
    (e.variables || []).forEach((n, i) => { vars[n] = `v${i + 1}`; });
    const p = T.buildTemplatePayload(k, vars);
    if ((p.components || []).some((c) => c.type === 'button')) return `${k} grew a button`;
  }
  return true;
});

// ═══ §2 · THE REVIEW ASK'S REGISTRY ENTRY IS THE LEDGER'S BYTES ═════════════
sec('\u00a72 \u00b7 the registry entry (R-G2.10, ledger B1)');

const LEDGER_BODY =
  'Hi {{1}}, thank you for choosing {{2}} for your wedding. ' +
  'If you have a minute, a Google review would mean a lot to them.';

cell('body is byte-identical to the APPROVED body in the ledger', () => {
  const e = T.getTemplate('review_request');
  if (!e) return 'review_request is not in the registry';
  return e.body === LEDGER_BODY ? true : `body drifted:\n    got  ${JSON.stringify(e.body)}\n    want ${JSON.stringify(LEDGER_BODY)}`;
});

cell('category is MARKETING \u2014 the truth, not the submitted intent', () => {
  const e = T.getTemplate('review_request');
  return e.category === 'MARKETING' ? true : `category is ${e.category}`;
});

cell('button text is `Write a Review` with a capital R (Meta locked it)', () => {
  const e = T.getTemplate('review_request');
  return e.button && e.button.text === 'Write a Review' ? true : `button text is ${e.button && e.button.text}`;
});

cell('line is bride \u2014 the couple\u2019s own number', () => {
  const e = T.getTemplate('review_request');
  return e.line === 'bride' ? true : `line is ${e.line}`;
});

cell('the payload carries a url button component at index 0', () => {
  const p = T.buildTemplatePayload('review_request', { couple: 'Ananya', vendor: 'Dev Roy Photography', code: 'dev440' });
  const b = (p.components || []).find((c) => c.type === 'button');
  if (!b) return 'no button component emitted';
  if (b.sub_type !== 'url') return `sub_type is ${b.sub_type}`;
  if (b.index !== '0') return `index is ${b.index}`;
  if (b.parameters[0].text !== 'dev440') return `parameter is ${b.parameters[0].text}`;
  return true;
});

cell('the button parameter is the SUFFIX \u2014 a full URL is refused, never doubled', () => {
  // The ledger's send-shape note: the full URL yields
  // https://thedreamwedding.in/r/https://thedreamwedding.in/r/dev440
  const RA = fresh('src/lib/vendor/reviewAsk.js');
  const code = RA.reviewCode('DEV440');
  if (code !== 'dev440') return `reviewCode gave ${code}`;
  const p = T.buildTemplatePayload('review_request', { couple: 'A', vendor: 'B', code });
  const b = (p.components || []).find((c) => c.type === 'button');
  return String(b.parameters[0].text).includes('http') ? 'a full URL reached the parameter' : true;
});

cell('a missing button variable is refused loudly, not sent silently', () => {
  try {
    T.buildTemplatePayload('review_request', { couple: 'A', vendor: 'B' });
    return 'it built a payload with no button parameter';
  } catch (e) { return /url button/.test(e.message) ? true : `wrong error: ${e.message}`; }
});

// ═══ §3 · THE SEND IS DARK, AND THE FLAG IS THE ONLY THING HOLDING IT ═══════
sec('\u00a73 \u00b7 the two gates (build-dark law)');

cell('both gates shut with the flag unset', () => {
  delete process.env.REVIEW_ASK_SEND_ENABLED;
  const RA = fresh('src/lib/vendor/reviewAsk.js');
  const g = RA.sendGate();
  if (g.open) return 'the gate is OPEN with no flag set';
  if (!/REVIEW_ASK_SEND_ENABLED/.test(g.reason)) return `reason does not name the flag: ${g.reason}`;
  return true;
});

cell('the registry gate is ALREADY OPEN \u2014 so the flag is the only hold', () => {
  // Stated as a cell because it is the one asymmetry with G1.1's credit invite,
  // whose registry status is `pending` and does half the holding.
  const RA = fresh('src/lib/vendor/reviewAsk.js');
  return RA.sendGate().approved === true ? true : 'template is not approved; this cell\u2019s premise has changed';
});

(async () => {
  delete process.env.REVIEW_ASK_SEND_ENABLED;
  const RA = fresh('src/lib/vendor/reviewAsk.js');
  let sendWaCalled = false;
  const out = await RA.sendReviewAsk(
    { to: '919888294440', couple: 'A', vendor: 'B', code: 'dev440' },
    { sendWa: async () => { sendWaCalled = true; return { sent: true }; } },
  );
  if (out.sent === true || sendWaCalled) { no('a shut gate never reaches the transport', 'it sent'); }
  else if (out.skipped !== true) { no('a shut gate never reaches the transport', 'not marked skipped'); }
  else ok('a shut gate never reaches the transport');

  // ── the open gate declares nudgeClass and the couple lane ────────────────
  process.env.REVIEW_ASK_SEND_ENABLED = '1';
  const RA2 = fresh('src/lib/vendor/reviewAsk.js');
  let seen = null;
  await RA2.sendReviewAsk(
    { to: '919888294440', couple: 'A', vendor: 'B', code: 'DEV440' },
    { sendWa: async (o) => { seen = o; return { sent: true, result: { wamid: 'w1' } }; } },
  );
  delete process.env.REVIEW_ASK_SEND_ENABLED;

  if (!seen) no('an open gate routes through sendWa', 'sendWa was never called');
  else {
    cell('the send declares nudgeClass \u2014 the opt-out CONDITION is paid', () => seen.nudgeClass === true ? true : 'nudgeClass absent; the couple lane gate would be skipped');
    cell('the send rides the bride line, not marketing', () => seen.line === 'bride' ? true : `line is ${seen.line}`);
    cell('the code reaches the payload lowercased', () => seen.vars.code === 'dev440' ? true : `code is ${seen.vars.code}`);
  }

  process.env.REVIEW_ASK_SEND_ENABLED = '1';
  const RA3 = fresh('src/lib/vendor/reviewAsk.js');
  const nh = await RA3.sendReviewAsk({ to: '91', couple: 'A', vendor: 'B', code: '' }, { sendWa: async () => ({ sent: true }) });
  delete process.env.REVIEW_ASK_SEND_ENABLED;
  if (nh.sent) no('no routing_handle is refused', 'it sent'); else ok('no routing_handle is refused');

  // ═══ §4 · THE SEAL'S ARITHMETIC ══════════════════════════════════════════
  sec('\u00a74 \u00b7 the seal (R-G2.2, R-G2.3, R-G2.4)');
  const S = fresh('src/lib/vendor/seal.js');

  cell('under three weddings there is no seal', () => S.sealIsVisible({ weddings: 2 }) === false ? true : 'a seal at two');
  cell('at three there is', () => S.sealIsVisible({ weddings: 3 }) === true ? true : 'no seal at three');
  cell('null is not a seal', () => S.sealIsVisible(null) === false ? true : 'null passed');

  cell('D is measured event_date \u2192 delivered_at', () => {
    const r = S.computeSeal([{ delivered_at: '2026-03-10T00:00:00Z', events: { event_date: '2026-02-04' } }]);
    return r.delivery_days === 34 ? true : `got ${r.delivery_days}, want 34`;
  });

  cell('a back-catalogue page counts in N and is excluded from D', () => {
    const r = S.computeSeal([
      { delivered_at: '2026-03-10T00:00:00Z', events: { event_date: '2026-02-04' } },
      { delivered_at: '2026-06-01T00:00:00Z', events: null },
    ]);
    if (r.weddings !== 2) return `N is ${r.weddings}, want 2`;
    if (r.delivery_days !== 34) return `D is ${r.delivery_days}, want 34 \u2014 the eventless page dragged the mean`;
    if (r.measured_from !== 1) return `measured_from is ${r.measured_from}`;
    return true;
  });

  cell('no measurable page yields NULL, never 0', () => {
    const r = S.computeSeal([{ delivered_at: '2026-06-01T00:00:00Z', events: null }]);
    return r.delivery_days === null ? true : `D is ${r.delivery_days}; 0 would read as same-day delivery`;
  });

  cell('a delivery before its own event date is dropped, not clamped', () => {
    const r = S.computeSeal([
      { delivered_at: '2026-01-01T00:00:00Z', events: { event_date: '2026-02-04' } },
      { delivered_at: '2026-03-10T00:00:00Z', events: { event_date: '2026-02-04' } },
    ]);
    return r.delivery_days === 34 ? true : `bad data reached the mean: ${r.delivery_days}`;
  });

  cell('vendor_seal has no rating column anywhere in the migration (R-G2.2)', () => {
    const sql = fs.readFileSync(R('db/migrations/0134_reviews_and_seal.sql'), 'utf8');
    const table = sql.slice(sql.indexOf('CREATE TABLE IF NOT EXISTS public.vendor_seal'));
    const body = table.slice(0, table.indexOf(');'));
    return /\brating\b/.test(body) ? 'a rating column exists with no source' : true;
  });

  // ═══ §5 · ONCE PER COUPLE, BY UNIQUE KEY ═════════════════════════════════
  sec('\u00a75 \u00b7 the once-ever guarantee (R-G2.10)');

  cell('the UNIQUE key is on couple_id and is in the migration', () => {
    const sql = fs.readFileSync(R('db/migrations/0134_reviews_and_seal.sql'), 'utf8');
    return /reviews_asked_couple_key UNIQUE \(couple_id\)/.test(sql) ? true : 'no unique key on couple_id';
  });

  const N = fresh('src/lib/vendor/reviewsNightly.js');

  {
    const supa = fakeSupabase({ claimError: { code: '23505', message: 'duplicate key' } });
    const r = await N.runAskSweep(supa, { sendReviewAsk: async () => ({ sent: true }) });
    if (r.already !== 1) no('a duplicate claim is already-asked', `already=${r.already}`);
    else if (r.asked !== 0) no('a duplicate claim is already-asked', 'it sent anyway');
    else ok('a duplicate claim is already-asked, and no send follows');
  }

  {
    const order = [];
    const supa = fakeSupabase({ onClaim: () => order.push('claim') });
    await N.runAskSweep(supa, { sendReviewAsk: async () => { order.push('send'); return { sent: false, skipped: true }; } });
    if (order.join(',') !== 'claim,send') no('claim precedes send', `order was ${order.join(',')}`);
    else ok('claim precedes send');
  }

  // ═══ §6 · THE COUPLE'S STOP, AND THE ORDERING THAT MAKES IT WORK ═════════
  sec('\u00a76 \u00b7 F-19.08\u2019s cure and its placement');
  const NO = fresh('src/lib/nudgeOptout.js');

  cell("`Stop messages` matches, punctuation and case free", () => NO.matchStopMessages('Stop messages.') === true ? true : 'the button title does not match');
  cell('bare STOP is NOT claimed \u2014 it stays the full stop\u2019s word', () => NO.matchStopMessages('STOP') === false ? true : 'the couple branch swallowed the full stop');
  cell('a sentence containing the words falls through to the engine', () => NO.matchStopMessages('stop messages from my planner') === false ? true : 'a real turn was swallowed');
  cell("LANES carries 'couple'", () => NO.LANES.has('couple') ? true : "no 'couple' lane");
  // ⚠ `setNudgeOptout` IS ASYNC, so its RangeError arrives as a REJECTED PROMISE
  // and a synchronous try/catch never sees it. The bench's first cut caught
  // nothing and reported "it accepted an unknown lane" — a RED against correct
  // production code, which is a bench defect and the worse kind of red.
  let laneErr = null;
  try { await NO.setNudgeOptout({ supabase: null, phone: '1', lane: 'nope', state: 'opted_out' }); }
  catch (e) { laneErr = e; }
  cell('an unknown lane is still refused', () => laneErr && /unknown lane/.test(laneErr.message) ? true : `no refusal: ${laneErr && laneErr.message}`);
  cell('the refusal message is DERIVED from LANES, not restated', () => laneErr && /'couple'/.test(laneErr.message) ? true : `the message went stale: ${laneErr && laneErr.message}`);

  cell('the migration widens the lane CHECK \u2014 the constant alone would be refused', () => {
    const sql = fs.readFileSync(R('db/migrations/0134_reviews_and_seal.sql'), 'utf8');
    return /nudge_optout_lane_check[\s\S]*'couple'/.test(sql) ? true : 'LANES was widened without the CHECK';
  });

  cell('the couple branch runs BEFORE the full stop in brideInbound', () => {
    const src = fs.readFileSync(R('src/lib/brideInbound.js'), 'utf8');
    const a = src.indexOf('matchStopMessages(trimmedBody)');
    const b = src.indexOf('matchFullStopWord(trimmedBody)');
    if (a < 0) return 'the couple branch is absent';
    if (b < 0) return 'the full stop branch is absent';
    return a < b ? true : 'the full stop runs first and would swallow the button as a terminal opt-out';
  });

  cell('the reply byte lives in nudgeCopy, never inline', () => {
    const src = fs.readFileSync(R('src/lib/brideInbound.js'), 'utf8');
    if (/You won't get any more messages/.test(src)) return 'the byte is inline in the handler';
    const copy = fresh('src/lib/nudgeCopy.js');
    return copy.getNudgeCopy('couple_stop_confirmation') === "You won't get any more messages like this from us."
      ? true : 'the vetoed byte is not in its home';
  });

  // ═══ §7 · THE INVOICE AND THE CARD ═══════════════════════════════════════
  sec('\u00a77 \u00b7 the seal on the two surfaces');

  cell('CARD_KEYS carries seal and nothing else moved', () => {
    const VC = fresh('src/api/public/vendorCard.js');
    const want = ['business_name','category','city','handle','is_demo','enquiry_phone','about','starting_price','photos','enquire_link','seal'];
    return VC.CARD_KEYS.join(',') === want.join(',') ? true : `CARD_KEYS is ${VC.CARD_KEYS.join(',')}`;
  });

  cell('the renderer takes a fifth argument and both LIVE call sites pass it', () => {
    // ── THE READ-FIRST SAID THREE CALL SITES. THERE ARE TWO. ────────────────
    // `src/agent/engine.js:1613` calls `generateInvoicePdf` from INSIDE THE
    // DEFUSED ISLAND — below F-05.56's banner at :753, zero callers since ARC
    // M5, frozen and awaiting retirement. Passing it a fifth argument reddened
    // `b05_f0550_ping_drain_bench` §4.3, whose whole job is to hold that region
    // byte-frozen against base 5335bb2, and the bench was RIGHT: a dead branch
    // does not need an argument, and editing it to look complete would have
    // spent a freeze guard to decorate code nobody runs.
    // engine.js is therefore UNTOUCHED by this delivery, and this cell asserts
    // that too — so the island's freeze is a property this bench also protects.
    const gen = fs.readFileSync(R('src/lib/invoicePdf.js'), 'utf8');
    if (!/generateInvoicePdf\(\{ invoice, vendor, vendorName, schedule, seal \}\)/.test(gen)) return 'the renderer has no seal argument';
    const live = [
      ['src/api/vendor/money.js',    /seal: src\.seal/],
      ['src/api/vendor/invoices.js', /seal: null/],
    ];
    for (const [f, re] of live) {
      if (!re.test(fs.readFileSync(R(f), 'utf8'))) return `${f} does not pass seal`;
    }
    const eng = fs.readFileSync(R('src/agent/engine.js'), 'utf8');
    const island = eng.slice(eng.indexOf('F-05.56 \u2014 EVERYTHING BELOW THIS LINE'));
    if (/seal/.test(island)) return 'the defused island was edited; its freeze guard will red';
    return true;
  });

  cell('the renderer never decides visibility \u2014 three lives in one home', () => {
    const gen = fs.readFileSync(R('src/lib/invoicePdf.js'), 'utf8');
    if (/SEAL_MIN_WEDDINGS|>=\s*3/.test(gen)) return 'the renderer learned what three means';
    const vc = fs.readFileSync(R('src/api/public/vendorCard.js'), 'utf8');
    if (/>=\s*3/.test(vc)) return 'the door learned what three means';
    return true;
  });

  cell('the seal draws ABOVE the foot rule and does not move footY', () => {
    const gen = fs.readFileSync(R('src/lib/invoicePdf.js'), 'utf8');
    if (!/footY - 30/.test(gen) || !/footY - 17/.test(gen)) return 'the seal is not placed upward from footY';
    if (/footY \+= |y = footY/.test(gen)) return 'the foot block advances y; the 40pt pagination cure is spent';
    return true;
  });

  cell('no Rs and no rupee glyph reach the seal\u2019s EMITTED bytes', () => {
    // ⚠ IT ASSERTS THE OUTPUT, NOT THE SOURCE. The first cut grepped the source
    // block and went RED on the comment `NO Rs, EVER` — a cell reading its own
    // prose. Money law is about what the page says, so the cell renders the
    // strings the block actually emits and reads those.
    for (const seal of [{ weddings: 4, delivery_days: 34 }, { weddings: 3, delivery_days: null }]) {
      const facts = seal.delivery_days == null
        ? `${seal.weddings} weddings`
        : `${seal.weddings} weddings \u00b7 delivers in ${seal.delivery_days} days`;
      for (const line of ['TDW-VERIFIED', facts]) {
        if (/\u20b9/.test(line)) return `a rupee glyph is on the seal: ${line}`;
        if (/\bRs\b/.test(line)) return `Rs is on the seal: ${line}`;
        if (/[0-9],[0-9]{2},[0-9]{3}/.test(line)) return `a money figure is on the seal: ${line}`;
      }
    }
    return true;
  });

  // ═══ §8 · THE ROOM'S READ DOOR (ZIP 1b) ═════════════════════════════════
  sec('\u00a78 \u00b7 GET /google-reviews \u2014 one read, no writer');

  const C = fresh('src/api/vendor/solutions/contract.js');

  cell('the contract digest is self-consistent after the shape was added', () =>
    C.computeDigest() === C.CONTRACT_DIGEST ? true
      : `computed ${C.computeDigest()} \u2260 literal ${C.CONTRACT_DIGEST}`);

  cell('the room\u2019s payload passes its own shape', () => {
    const v = C.shape('GoogleReviewsRoom', {
      asked: [], askedCount: 0, landedCount: 0, seal: null,
      gbpAvailableFrom: '2026-10-27', sendEnabled: false,
    });
    return v.ok ? true : JSON.stringify(v);
  });

  cell('the shape REFUSES an extra field \u2014 P3\u2019s lesson, still armed', () => {
    const v = C.shape('GoogleReviewsRoom', {
      asked: [], askedCount: 0, landedCount: 0, seal: null,
      gbpAvailableFrom: '2026-10-27', sendEnabled: false, rating: 4.8,
    });
    return v.ok === false ? true : 'a rating field passed the contract';
  });

  cell('no `rating` is declared anywhere in the room\u2019s shape (R-G2.2)', () => {
    const src = fs.readFileSync(R('src/api/vendor/solutions/contract.js'), 'utf8');
    const block = src.slice(src.indexOf('ReviewAsk:'), src.indexOf('});', src.indexOf('ReviewAsk:')));
    return /rating/.test(block) ? 'a rating field exists with no source' : true;
  });

  cell('the door is a READ \u2014 it writes nothing', () => {
    const src = fs.readFileSync(R('src/api/vendor/solutions/index.js'), 'utf8');
    const from = src.indexOf("router.get('/google-reviews'");
    const to   = src.indexOf('router.get(', from + 10);
    const block = src.slice(from, to);
    for (const verb of ['.insert(', '.update(', '.upsert(', '.delete(', '.rpc(']) {
      if (block.includes(verb)) return `the room's door calls ${verb}`;
    }
    return true;
  });

  cell('the door is scoped to the calling vendor and to nothing else', () => {
    const src = fs.readFileSync(R('src/api/vendor/solutions/index.js'), 'utf8');
    const from = src.indexOf("router.get('/google-reviews'");
    const to   = src.indexOf('router.get(', from + 10);
    const block = src.slice(from, to);
    if (!/requireAuth, resolveVendor\(\)/.test(block)) return 'the door is not behind the vendor guard';
    // ⚠ COMMENT LINES ARE STRIPPED BEFORE COUNTING. The first cut counted three
    // and reddened on correct code: the third match was this door's OWN COMMENT
    // saying it scopes by vendor_id. A cell that reads its own prose is the same
    // defect as the money cell one section up, and it is cured the same way —
    // assert the EXECUTABLE bytes, never the file's account of them.
    const exec = block.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    const eqs = exec.match(/\.eq\('vendor_id', req\.vendor\.id\)/g) || [];
    return eqs.length === 2 ? true : `expected both reads scoped by vendor_id, found ${eqs.length}`;
  });

  cell('the door reports the gate rather than deciding it', () => {
    const src = fs.readFileSync(R('src/api/vendor/solutions/index.js'), 'utf8');
    const from = src.indexOf("router.get('/google-reviews'");
    const to   = src.indexOf('router.get(', from + 10);
    const block = src.slice(from, to);
    if (!/sendGate\(\)\.open/.test(block)) return 'the door does not read sendGate';
    if (/REVIEW_ASK_SEND_ENABLED/.test(block)) return 'the door reads the env var directly \u2014 a second home for the gate';
    return true;
  });

  cell('the door does not restate what three means', () => {
    const src = fs.readFileSync(R('src/api/vendor/solutions/index.js'), 'utf8');
    const from = src.indexOf("router.get('/google-reviews'");
    const to   = src.indexOf('router.get(', from + 10);
    const block = src.slice(from, to);
    if (/>=\s*3|SEAL_MIN_WEDDINGS\s*=/.test(block)) return 'the door learned the floor';
    return /sealIsVisible/.test(block) ? true : 'the door does not use the one visibility rule';
  });

  // ═══ VERDICT ════════════════════════════════════════════════════════════
  console.log(`\n${'='.repeat(70)}`);
  console.log(`b55_g2_reviews_bench  ${pass} GREEN  ${fail} RED`);
  if (fail) { console.log('\nRED CELLS:'); fails.forEach((f) => console.log('  - ' + f)); }
  console.log(`${'='.repeat(70)}`);
  console.log(`
NON-VACUITY \u2014 SEVEN PRODUCTION MUTATIONS, EACH RED ON THE CELLS NAMED:
  1 src/lib/templates.js  drop \`if (t.button ...)\` from buildTemplatePayload   \u2192 \u00a72 button cells
  2 src/lib/templates.js  review_request.button.text \u2192 'Write a review'        \u2192 \u00a72 capital R
  3 src/lib/templates.js  review_request.category \u2192 'UTILITY'                  \u2192 \u00a72 MARKETING
  4 src/lib/vendor/reviewAsk.js  remove \`nudgeClass: true\`                      \u2192 \u00a73 CONDITION
  5 src/lib/vendor/seal.js  count eventless pages into spans as 0               \u2192 \u00a74 back-catalogue, NULL
  6 src/lib/brideInbound.js  move the couple branch below the full stop         \u2192 \u00a76 ordering
  7 src/lib/invoicePdf.js  advance y in the seal block instead of footY-offset  \u2192 \u00a77 pagination cure
  8 src/api/vendor/solutions/contract.js  drop a field from GoogleReviewsRoom    \u2192 \u00a78 digest, shape
  9 src/api/vendor/solutions/index.js  drop one .eq('vendor_id', req.vendor.id)  \u2192 \u00a78 scoping
`);
  process.exit(fail ? 1 : 0);
})();

// ── the fake, declared: it refuses unknown tables so a query the code invents
//    is a RED rather than a silent undefined (P3's lesson).
function fakeSupabase({ claimError = null, onClaim = () => {} } = {}) {
  const WEDDING = {
    id: 'w1', owner_vendor_id: 'v1', couple_id: 'c1',
    couples: { id: 'c1', user_id: 'u1' },
    vendors: { business_name: 'Dev Roy Photography', routing_handle: 'DEV440' },
  };
  return {
    from(table) {
      if (table === 'weddings') {
        const q = {
          select: () => q, eq: () => q, not: () => q,
          then: (res) => res({ data: [WEDDING], error: null }),
        };
        return q;
      }
      if (table === 'reviews_asked') {
        return {
          insert: () => { onClaim(); return { select: () => ({ maybeSingle: async () => claimError ? { data: null, error: claimError } : { data: { id: 'r1' }, error: null } }) }; },
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      if (table === 'users') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { phone: '919625759924', name: 'Ananya' }, error: null }) }) }) };
      }
      throw new Error(`fakeSupabase: unexpected table '${table}'`);
    },
  };
}
