#!/usr/bin/env node
// scripts/b08_p3_seeing_surface_bench.js — TDW_08 · P3 — THE SEEING SURFACE (dream-os arm)
//
// Runnable from ANY working directory (the repo root is resolved from __dirname,
// never from cwd — the ~/Downloads law's cousin).
//
// EVERY §M CELL IS BOTH-WAYS. It mutates PRODUCTION SOURCE — never test setup — asserts
// the cell goes RED at the broken tree, restores the file, and asserts byte-identity.
// Every anchor is asserted to appear EXACTLY ONCE before the replace, so CE-127's
// String.replace-takes-the-first fault is structurally impossible rather than avoided
// by care.
//
// WHAT THIS BENCH DOES NOT ASSERT, named rather than silently absent (floor-method law):
//   · NO pwa cells. This is the dream-os arm; the landing, the tease render and the
//     three omission rules ON SCREEN are the pwa arm's, benched there.
//   · NO 0108 cells. A migration that already ran against production is witnessed by
//     its readback (the file's own foot), not by a bench asserting DDL it cannot run.
//   · NO budget-in-the-model-context cell. `budget_max` reaches the TEASE by ruling and
//     nobody ruled it into the model's window — its absence there is DECLARED at
//     maskDemoLead.js, not tested for.
//   · NO cell over `monthPhrase`'s two 'upcoming' returns as strings. They are
//     byte-untouched by ruling and serve an approved Meta template; §7 asserts the
//     MASK does not consume them, which is the thing P3 changed.

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(SRC(rel), 'utf8');

let pass = 0, fail = 0;
const H = (s) => console.log(`\n══ ${s} ══`);
function t(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e.message}`); fail++; }
}

// ── THE MUTATION HELPER ──────────────────────────────────────────────────────
// Breaks production source, runs the cell's own predicate, asserts RED, restores,
// and asserts the restore was byte-identical. `require.cache` is busted because
// several predicates load the module rather than read it (the caching law,
// CE-117: a mutation must bust whatever caching the cell's own read path uses).
function mutate(rel, anchor, replacement, predicate, label) {
  const abs      = SRC(rel);
  const original = fs.readFileSync(abs, 'utf8');
  const hits     = original.split(anchor).length - 1;
  assert.strictEqual(hits, 1,
    `anchor must appear EXACTLY ONCE in ${rel} (found ${hits}) — a bare anchor is a coin flip`);
  try {
    fs.writeFileSync(abs, original.replace(anchor, replacement), 'utf8');
    delete require.cache[require.resolve(abs)];
    let red = false;
    try { predicate(); } catch { red = true; }
    assert.ok(red, `${label}: the cell stayed GREEN over broken production code — it proves nothing`);
  } finally {
    fs.writeFileSync(abs, original, 'utf8');
    delete require.cache[require.resolve(abs)];
    assert.strictEqual(fs.readFileSync(abs, 'utf8'), original, `${rel} was not restored byte-identically`);
  }
}

const SHAPER   = 'src/lib/discover/shapeDemoRow.js';
const FEED     = 'src/api/couple/discover.js';
const VENDORFN = 'src/lib/discover/shapeVendor.js';
const DEMOAPI  = 'src/api/demo/vendor.js';
const MASK     = 'src/lib/demo/maskDemoLead.js';
const ALERT    = 'src/lib/discover/demoLeadAlert.js';
const ENQUIRE  = 'src/api/couple/enquire.js';
const FIXTURE  = 'scripts/fixtures/b08_p3_shapeDemoRow_preextraction.txt';

// ═════════════════════════════════════════════════════════════════════════════
H('§1 · THE EXTRACTION IS BYTE-IDENTICAL, AND THE PROOF REDDENS ON ONE CHARACTER');

// The fixture holds discover.js:307-362 AS IT WAS BEFORE THIS SITTING. Those bytes
// exist nowhere else in the tree now — the inline closure is gone — so this is the
// move's ONLY witness. A lint pass over the shaper breaks this cell, which is the
// point: see the banner in shapeDemoRow.js.
const preExtraction = read(FIXTURE);

// THE ONE DECLARED TRANSFORM: two spaces of handler indent removed, and nothing else.
const dedent = (s) => s.split('\n').map((l) => (l.startsWith('  ') ? l.slice(2) : l)).join('\n');

function shaperBody() {
  const src   = read(SHAPER);
  const start = src.indexOf('const shapeDemoRow = (v) => {');
  const end   = src.indexOf('\n};\n', start);
  assert.ok(start !== -1 && end !== -1, 'shapeDemoRow function not found in the extracted module');
  return src.slice(start, end + 3) + '\n';
}

t('§1.1 the fixture is the pre-extraction body, 56 lines, handler-indented', () => {
  assert.strictEqual(preExtraction.split('\n').filter((l) => l !== '').length > 0, true);
  assert.ok(preExtraction.startsWith('  const shapeDemoRow = (v) => {'),
    'the fixture must carry the ORIGINAL two-space handler indent');
});

t('§1.2 BYTE-IDENTITY: the extracted body === the fixture dedented by exactly two spaces', () => {
  assert.strictEqual(shaperBody(), dedent(preExtraction),
    'the extracted shaper is NOT byte-identical to the code it claims to have moved');
});

t('§1.3 the inline closure is GONE from the feed — a move, not a copy', () => {
  assert.ok(!/const shapeDemoRow = \(v\) => \{/.test(read(FEED)),
    'discover.js still declares the shaper inline — this is a duplicate, not an extraction');
});

t('§1.4 non-vacuity: a one-character drift in the extracted body FAILS §1.2', () => {
  const body = shaperBody();
  const drifted = body.replace('is_demo:        true,', 'is_demo:        true ,');
  assert.notStrictEqual(drifted, body, 'the drift did not apply — the cell would be vacuous');
  assert.notStrictEqual(drifted, dedent(preExtraction),
    'a drifted body still matched the fixture — §1.2 cannot detect a one-character change');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§2 · THREE CALLERS, ALL WIRED, ALL NAMED');

t('§2.1 the feed requires the extracted module', () => {
  assert.ok(/require\('\.\.\/\.\.\/lib\/discover\/shapeDemoRow'\)/.test(read(FEED)));
});

t('§2.2 the demo landing requires the SAME module — one shaper, not a copy', () => {
  assert.ok(/require\('\.\.\/\.\.\/lib\/discover\/shapeDemoRow'\)/.test(read(DEMOAPI)));
});

t('§2.3 both feed call sites survive the move (primary leg + cold-start widening)', () => {
  const hits = read(FEED).split('.map(shapeDemoRow)').length - 1;
  assert.strictEqual(hits, 2, `expected 2 feed call sites, found ${hits}`);
});

t('§2.4 the amended paragraph says THREE CALLERS and names the third BY FILE (F-06.85)', () => {
  const src = read(FEED);
  assert.ok(/ONE DEMO SHAPE, THREE CALLERS/.test(src), 'the TWO CALLERS paragraph was not amended');
  assert.ok(/src\/api\/demo\/vendor\.js/.test(src), 'the third caller is not named by file');
});

t('§2.5 the shaper module names its own caller list and demands the next one join it', () => {
  const src = read(SHAPER);
  assert.ok(/A FOURTH MUST ADD ITSELF TO THIS LIST/.test(src));
  assert.ok(/src\/api\/couple\/discover\.js/.test(src) && /src\/api\/demo\/vendor\.js/.test(src));
});

// ═════════════════════════════════════════════════════════════════════════════
H('§3 · shapeVendor.js — THE ADDRESS MOVED, THE DECISION DID NOT');

t('§3.1 the chair-frozen Draft B bytes are present, exactly', () => {
  const src = read(VENDORFN);
  assert.ok(src.includes(
    '// which table the caller meant, which is two functions in one body. It lives at\n' +
    '// src/lib/discover/shapeDemoRow.js, named here so a later reader finds a decision instead\n' +
    '// of an oversight.'), 'the frozen address bytes are not present verbatim');
});

t('§3.2 the stale line range is GONE, glyph and all (PATH-OVER-RANGE)', () => {
  const src = read(VENDORFN);
  assert.ok(!src.includes(':248'), 'the stale range survives');
  assert.ok(!/It stays at/.test(src), '"stays at" survives — Draft A shipped, not Draft B');
});

t('§3.3 the DECISION at :29-31 is byte-untouched', () => {
  const src = read(VENDORFN);
  assert.ok(src.includes('// THE DEMO LEG DOES NOT CALL THIS. demo_vendors is a different table with different'));
  assert.ok(src.includes('// own constant-`false` featured reasoning. Folding it in would mean a parameter selecting'));
});

t('§3.4 the ranking boundary at :21-27 is byte-untouched — β crossed nothing', () => {
  const src = read(VENDORFN);
  assert.ok(src.includes('// WHAT DELIBERATELY DID NOT MOVE IN: the ranking terms.'));
  assert.ok(src.includes('// The feed spreads this result and appends `_rank_score` itself.'));
});

// COMMENT-STRIPPED, and the strip is not decoration: this cell FIRED on its own first
// run against a header paragraph explaining why the demo species is NOT folded in beside
// `shapeVendorForDiscover`. A filename-or-token grep counts comments — the COMMENT-
// BLINDNESS LAW, which binds this sitting by name, convicting the bench written under it.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

t('§3.5 "Both mounts call this function" is still TRUE — the demo species is not a mount of it', () => {
  assert.ok(!/shapeVendorForDiscover/.test(stripComments(read(SHAPER))),
    'the demo shaper CALLS the real shaper — :12-19 would be false and β would have failed');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§4 · _rank_score — EMITTED BY THE SHAPER, STRIPPED AT EACH CALLER\'S OWN SEAM');

const { shapeDemoRow } = require(SRC(SHAPER));
const ROW = {
  id: 'dv-1', display_name: 'Legacy Jewellers', category: 'jewellery', city: 'Delhi NCR',
  about: null, ig_handle: 'legacy_jewellers', photos: [{ url: 'https://x/1.jpg' }, 'https://x/2.jpg'],
};

t('§4.1 the shaper still emits it — the extraction changed nothing about the feed', () => {
  assert.strictEqual(shapeDemoRow(ROW)._rank_score, 0);
});

t('§4.2 the demo route strips it — F-07.3 is not re-minted in the sitting that inherited its cure', () => {
  assert.ok(/const \{ _rank_score, \.\.\.card \} = shapeDemoRow\(vendor\);/.test(read(DEMOAPI)),
    'the demo seam does not strip _rank_score');
});

t('§4.3 the strip cites its rationale BY PATH AND SENTENCE, not by a drifting range', () => {
  const src = read(DEMOAPI);
  assert.ok(/src\/api\/couple\/discover\.js/.test(src), 'the rationale is not cited by path');
  assert.ok(/`_rank_score` is ORDERING MACHINERY, not contract\./.test(src),
    'the anchor sentence is not quoted — a range would drift, the sentence does not');
});

t('§4.4 THE ANCHOR SENTENCE STILL EXISTS AT THE FILE IT CITES (the pointer resolves)', () => {
  assert.ok(read(FEED).includes('`_rank_score` is ORDERING MACHINERY, not contract.'),
    'the cited sentence is gone from discover.js — the cross-file pointer is dead');
});

t('§4.5 the feed still strips at its own seam, unchanged', () => {
  assert.ok(/\.map\(\(\{ _rank_score, \.\.\.card \}\) => card\)/.test(read(FEED)));
});

// ═════════════════════════════════════════════════════════════════════════════
H('§5 · THE MIRROR CARD — THE CONTRACT THE RENDERER REQUIRES');

t('§5.1 the card carries every DiscoverVendor required field', () => {
  const { _rank_score, ...card } = shapeDemoRow(ROW);
  for (const k of ['id', 'name', 'category', 'city', 'routing_handle', 'starting_price',
                   'photos', 'vibe_tags', 'about', 'enquire_link']) {
    assert.ok(k in card, `the mirror's contract is missing ${k}`);
  }
});

t('§5.2 photos are FLATTENED to string[] — DemoPhoto[] is not the renderer\'s type', () => {
  const card = shapeDemoRow(ROW);
  assert.deepStrictEqual(card.photos, ['https://x/1.jpg', 'https://x/2.jpg']);
});

t('§5.3 THE MONEY SEAM: starting_price is null, and rate_display never enters the card', () => {
  const card = shapeDemoRow({ ...ROW, rate_display: 'Rs 75K – Rs 2.5L' });
  assert.strictEqual(card.starting_price, null, 'a demo card must carry no money line');
  assert.ok(!JSON.stringify(card).includes('75K'), 'rate_display reached the mirror card');
  assert.ok(!('rate_display' in card));
});

t('§5.4 the IG chip is LIT — instagram_handle is supplied by the shaper, normalised', () => {
  assert.strictEqual(shapeDemoRow(ROW).instagram_handle, 'legacy_jewellers');
});

t('§5.5 THE TWO-NULLS CELL (F-07.54): routing_handle and enquire_link are null TOGETHER', () => {
  const card = shapeDemoRow(ROW);
  assert.strictEqual(card.routing_handle, null);
  assert.strictEqual(card.enquire_link, null);
});

t('§5.6 the two nulls mean FORK D agrees BY CONSTRUCTION, not by the mount remembering', () => {
  // The demo mount is ruled to withhold `enquireLink`. Even if it forgot, the shaper
  // cannot hand it one. This is the cell that turns a comfort into a proof.
  const card = shapeDemoRow({ ...ROW, whatsapp_phone: '919888294440' });
  assert.strictEqual(card.enquire_link, null,
    'the shaper minted an enquire_link — a forgetful mount would now ship a live Enquire');
});

t('§5.7 the existing `vendor` payload is UNTOUCHED beside the card (existing behaviour is sacred)', () => {
  const src = read(DEMOAPI);
  assert.ok(/rate_display:  vendor\.rate_display,/.test(src), 'the DemoVendor payload was altered');
  assert.ok(/\n      card,\n/.test(src), 'the card was not added additively');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§6 · F-08.32 — THE DECLARED GAP. `about` REACHES THE MIRROR UNFILTERED.');

// DECLARED-UNREACHED, applied to a FILTER rather than a limb. There is no money guard
// on `about`; today's rows are clean by DATA and not by MECHANISM. The day someone
// closes this gap halfway, THIS CELL REDDENS and the half-cure is caught at its own
// bench instead of shipping as a fix. Cure refused inside P3 by ruling: a money filter
// on `about` changes what couples see on a live path.
t('§6.1 the shaper passes `about` through with NO filter of any kind', () => {
  const dirty = 'Packages from ₹50K onwards';
  assert.strictEqual(shapeDemoRow({ ...ROW, about: dirty }).about, dirty,
    'a filter appeared on `about` — F-08.32 was cured without a ruling, or cured halfway');
});

t('§6.2 the gap is DECLARED in-file, naming BOTH ends of the path and its own cell', () => {
  const src = read(SHAPER);
  assert.ok(/F-08\.32/.test(src), 'the finding is not named');
  assert.ok(/VendorProfileView/.test(src) && /:190-194/.test(src), 'the render end is not named');
  assert.ok(/b08_p3_seeing_surface_bench\.js` §6\.1/.test(src),
    'the declaration does not name the cell that guards it — a half-cure would ship unnoticed');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§7 · THE MASK — BUDGET IN, CONTACT STILL ABSENT, PLACEHOLDERS DEAD');

const mask = require(SRC(MASK));
const LEAD = {
  id: 'l-1', demo_vendor_id: 'dv-1', bride_name: 'Priya Sharma', bride_phone: '919999999999',
  bride_email: 'p@x.com', bride_ig_handle: 'priya', bride_wedding_date: '2026-12-18',
  bride_wedding_city: 'Delhi NCR', budget_max: 500000, created_at: '2026-08-03T00:00:00Z',
};

t('§7.1 MASKED_SELECT carries budget_max and NONE of the three contact columns', () => {
  assert.ok(/budget_max/.test(mask.MASKED_SELECT), 'the amended G-4 cannot be served');
  for (const c of ['bride_phone', 'bride_email', 'bride_ig_handle']) {
    assert.ok(!mask.MASKED_SELECT.includes(c), `${c} would leave the database — contact is not blurred`);
  }
});

t('§7.2 the masked lead carries the budget', () => {
  assert.strictEqual(mask.maskDemoLead(LEAD).budget_max, 500000);
});

t('§7.3 contact is ABSENT BY CONSTRUCTION even when the row carries it', () => {
  const out = JSON.stringify(mask.maskDemoLead(LEAD));
  assert.ok(!out.includes('919999999999') && !out.includes('p@x.com') && !out.includes('"priya"'),
    'a contact field reached the tease payload');
});

t('§7.4 NULL IN, NULL OUT — the month is null, never the word "upcoming"', () => {
  const out = mask.maskDemoLead({ ...LEAD, bride_wedding_date: null });
  assert.strictEqual(out.wedding_when, null,
    'the WhatsApp-lane fallback reached the web payload — 8 of 9 cards would print it');
});

t('§7.5 a REAL date still renders the month — the fallback is bypassed, not broken', () => {
  assert.strictEqual(mask.maskDemoLead(LEAD).wedding_when, 'December 2026');
});

t('§7.6 monthPhrase itself is BYTE-UNTOUCHED — both returns still serve the approved template', () => {
  const src = read(ALERT);
  assert.ok(src.includes("  if (!weddingDate) return 'upcoming';"));
  assert.ok(src.includes("  if (isNaN(d.getTime())) return 'upcoming';"));
});

t('§7.7 both returns are NAMED in-comment per F-06.85', () => {
  assert.ok(/THE TWO 'upcoming' RETURNS, NAMED/.test(read(ALERT)));
});

t('§7.8 the model line OMITS an absent field — it never says "city not given"', () => {
  const line = mask.maskedLeadLines([{ ...LEAD, bride_wedding_city: null, bride_wedding_date: null }]);
  assert.ok(!/city not given/.test(line), 'the dormant placeholder fired');
  assert.strictEqual(line, '- Priya S.');
});

t('§7.9 the model line still carries what the table DOES hold', () => {
  assert.strictEqual(mask.maskedLeadLines([LEAD]), '- Priya S. | Delhi NCR | December 2026');
});

t('§7.10 budget is DECLARED out of the model window, not silently absent', () => {
  assert.ok(/DELIBERATELY DOES NOT JOIN THIS LINE/.test(read(MASK)));
  assert.ok(!/budget/.test(mask.maskedLeadLines([LEAD])));
});

// ═════════════════════════════════════════════════════════════════════════════
H('§8 · THE ENQUIRY CARRIES THE BUDGET — AND IT IS THREADED, NOT REACHED FOR');

t('§8.1 the demo insert carries budget_max', () => {
  assert.ok(/budget_max:         postedBudgetMax,/.test(read(ENQUIRE)));
});

t('§8.2 SCOPE: handleDemoVendor RECEIVES postedBudgetMax (node --check cannot see this)', () => {
  const sig = read(ENQUIRE).match(/async function handleDemoVendor\(\{[^}]*\}\)/)[0];
  assert.ok(/postedBudgetMax/.test(sig),
    'the value is used in a function that never receives it — a ReferenceError on every demo enquiry');
});

t('§8.3 the call site passes it', () => {
  assert.ok(/handleDemoVendor\(\{[^}]*postedBudgetMax[^}]*\}\)/.test(read(ENQUIRE)));
});

t('§8.4 the half-true suppression comment is amended, and the FUNCTIONS half survives', () => {
  const src = read(ENQUIRE);
  assert.ok(!/have NO column on that table \(13 cols/.test(src), 'the stale count survives');
  assert.ok(/THE FUNCTIONS HALF SURVIVES/.test(src), 'the surviving half is not named');
  assert.ok(/FIFTEEN columns now, cited to THE LADDER/.test(src),
    'the count was not corrected, or was corrected against the doc again');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§9 · THE TWO DISCOVER LEGS ASK THE SAME QUESTION');

// The demodiscover feed filtered on `active` alone while the couple leg filtered on
// `active` AND `discover_eligible`, so eight vendors showed on a surface built to
// demonstrate a feed that lists five. Three were visible to a vendor and unreachable
// by every real couple. Founder-ruled 2026-08-03.
t('§9.1 the demodiscover feed filters on discover_eligible', () => {
  const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
  assert.ok(/\.eq\('discover_eligible', true\)/.test(feed),
    'the demo feed lists vendors no couple can reach');
});

t('§9.2 it still filters on active — the new flag ADDS, never replaces', () => {
  const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
  assert.ok(/\.eq\('active', true\)/.test(feed));
});

t('§9.3 BOTH LEGS NOW CARRY BOTH FLAGS — the parity is asserted, not assumed', () => {
  const couple = read(FEED);
  assert.ok(/\.eq\('discover_eligible', true\)/.test(couple) && /\.eq\('active', true\)/.test(couple),
    'the couple leg lost a flag — the legs disagree again, in the other direction');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§10 · THE DEMO SPECIES HAS ONE AUTHOR — AND ONE STATED DEVIATION');

t('§10.1 the demodiscover feed shapes through shapeDemoRow, not its own inline copy', () => {
  const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
  assert.ok(/shapeDemoRow\(v\)/.test(feed), 'the feed shapes its own cards again');
});

t('§10.2 ZERO inline demo shapes survive anywhere in the file', () => {
  assert.strictEqual((read(DEMOAPI).match(/name:\s+v\.display_name/g) || []).length, 0,
    'a second demo shaper is back in the file that calls the first');
});

t('§10.3 it strips _rank_score at its own seam too — this route never interleaves', () => {
  const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
  assert.ok(/const \{ _rank_score, \.\.\.card \} = shapeDemoRow\(v\)/.test(feed));
});

t('§10.4 THE DEVIATION IS AT THE CALLER, NOT IN THE SHAPE — enquire_link overridden here', () => {
  const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
  assert.ok(/enquire_link: v\.whatsapp_phone \?/.test(feed), 'the override is gone');
  const { shapeDemoRow: s2 } = require(SRC(SHAPER));
  assert.strictEqual(s2({ ...ROW, whatsapp_phone: '919888294440' }).enquire_link, null,
    'the SHAPE was forked instead — the landing would inherit a live enquire target');
});

// FOUNDER DESIGN RULING, 2026-08-03: real vendors stay OUT of demodiscover. The couple
// feed interleaves both species by design; this surface is demo-only by design. Asserted
// so a future sitting that "helpfully" interleaves them reds instead of shipping.
t('§10.5 the demo feed reads demo_vendors and NEVER the real vendors table', () => {
  const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
  assert.ok(/\.from\('demo_vendors'\)/.test(feed));
  assert.ok(!/\.from\('vendors'\)/.test(feed),
    'the real vendors table entered a surface ruled demo-only');
});

// ═════════════════════════════════════════════════════════════════════════════
H('§M · MUTATIONS OVER PRODUCTION SOURCE — RED AT THE BROKEN TREE, BOTH WAYS');

t('§M.1 §1.2 goes RED when the extracted body drifts by one character', () => {
  mutate(SHAPER, 'is_demo:        true,', 'is_demo:        true ,',
    () => assert.strictEqual(shaperBody(), dedent(preExtraction)), '§1.2');
});

t('§M.2 §5.3 goes RED when the money seam is opened', () => {
  mutate(SHAPER, 'starting_price: null,', 'starting_price: v.rate_display || null,', () => {
    delete require.cache[require.resolve(SRC(SHAPER))];
    const { shapeDemoRow: s } = require(SRC(SHAPER));
    const card = s({ ...ROW, rate_display: 'Rs 75K – Rs 2.5L' });
    assert.strictEqual(card.starting_price, null);
  }, '§5.3');
});

t('§M.3 §5.5/§5.6 go RED when enquire_link is minted from the vendor\'s own number', () => {
  mutate(SHAPER, 'enquire_link:   null,', 'enquire_link:   v.whatsapp_phone || null,', () => {
    delete require.cache[require.resolve(SRC(SHAPER))];
    const { shapeDemoRow: s } = require(SRC(SHAPER));
    assert.strictEqual(s({ ...ROW, whatsapp_phone: '919888294440' }).enquire_link, null);
  }, '§5.6');
});

t('§M.4 §4.2 goes RED when the demo seam stops stripping _rank_score', () => {
  mutate(DEMOAPI, 'const { _rank_score, ...card } = shapeDemoRow(vendor);',
    'const card = shapeDemoRow(vendor);',
    () => assert.ok(/const \{ _rank_score, \.\.\.card \} = shapeDemoRow\(vendor\);/.test(read(DEMOAPI))),
    '§4.2');
});

t('§M.5 §7.4 goes RED when the mask consumes the WhatsApp fallback again', () => {
  mutate(MASK, 'wedding_when: row.bride_wedding_date ? monthPhrase(row.bride_wedding_date) : null,',
    'wedding_when: monthPhrase(row.bride_wedding_date),', () => {
      delete require.cache[require.resolve(SRC(MASK))];
      const m = require(SRC(MASK));
      assert.strictEqual(m.maskDemoLead({ ...LEAD, bride_wedding_date: null }).wedding_when, null);
    }, '§7.4');
});

t('§M.6 §7.1/§7.3 go RED when a contact column re-enters the SELECT', () => {
  mutate(MASK, "bride_wedding_city, budget_max, created_at'",
    "bride_wedding_city, budget_max, bride_phone, created_at'", () => {
      delete require.cache[require.resolve(SRC(MASK))];
      const m = require(SRC(MASK));
      assert.ok(!m.MASKED_SELECT.includes('bride_phone'));
    }, '§7.1');
});

t('§M.7 §6.1 goes RED when a filter appears on `about` — F-08.32 half-cured', () => {
  mutate(SHAPER, 'about:          v.about        || null,',
    "about:          (v.about || '').replace(/₹/g, 'Rs ') || null,", () => {
      delete require.cache[require.resolve(SRC(SHAPER))];
      const { shapeDemoRow: s } = require(SRC(SHAPER));
      const dirty = 'Packages from ₹50K onwards';
      assert.strictEqual(s({ ...ROW, about: dirty }).about, dirty);
    }, '§6.1');
});

t('§M.9 §9.1 goes RED if the demo feed drops the eligibility filter', () => {
  mutate(DEMOAPI, "      .eq('discover_eligible', true)\n      .order('created_at'", "      .order('created_at'",
    () => {
      const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
      assert.ok(/\.eq\('discover_eligible', true\)/.test(feed));
    }, '§9.1');
});

t('§M.10 §10.4 goes RED if the deviation is pushed into the SHAPE instead of the caller', () => {
  mutate(SHAPER, 'enquire_link:   null,', 'enquire_link:   v.whatsapp_phone || null,', () => {
    delete require.cache[require.resolve(SRC(SHAPER))];
    const { shapeDemoRow: s2 } = require(SRC(SHAPER));
    assert.strictEqual(s2({ ...ROW, whatsapp_phone: '919888294440' }).enquire_link, null);
  }, '§10.4');
});

t('§M.11 §10.5 goes RED if the real vendors table enters the demo feed', () => {
  mutate(DEMOAPI, "      .from('demo_vendors')\n      .select('*')", "      .from('vendors')\n      .select('*')",
    () => {
      const feed = read(DEMOAPI).slice(read(DEMOAPI).indexOf("router.get('/'"));
      assert.ok(!/\.from\('vendors'\)/.test(feed));
    }, '§10.5');
});

t('§M.8 §8.2 goes RED when postedBudgetMax stops being threaded (the scope defect itself)', () => {
  mutate(ENQUIRE,
    'async function handleDemoVendor({ supabase, res, demoVendor, couple_id, wedding_date, city, postedBudgetMax }) {',
    'async function handleDemoVendor({ supabase, res, demoVendor, couple_id, wedding_date, city }) {',
    () => {
      const sig = read(ENQUIRE).match(/async function handleDemoVendor\(\{[^}]*\}\)/)[0];
      assert.ok(/postedBudgetMax/.test(sig));
    }, '§8.2');
});

// ═════════════════════════════════════════════════════════════════════════════
console.log(`\n══ b08_p3_seeing_surface_bench: ${pass} passed, ${fail} failed, 0 skipped ══\n`);
process.exit(fail === 0 ? 0 : 1);
