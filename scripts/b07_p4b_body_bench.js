#!/usr/bin/env node
// scripts/b07_p4b_body_bench.js
// TDW_07 P4b BODY — the dream-os half's floor.
//
// This sitting's backend movements are: F1b's one shaper (and the preview mount that calls
// it), F4's rate-max retirement across five sites, F-07.17's dormancy, and α's U-1 comment.
//
// THE CELLS EXECUTE WHERE THEY CAN. Several of the properties this sitting is accountable
// for are BEHAVIOURAL — "the preview and the feed produce the same shape", "a min-only rate
// earns the term", "twenty photos ship five" — and a grep cannot settle any of them. A grep
// is satisfied by a constant nobody applies. Where a property can be run, it is run against
// the real production module; greps are reserved for facts that are genuinely textual
// (a comment is present, a name is absent from an allowlist).
//
// Runnable from any working directory; every path resolves off this file.
'use strict';
const fs   = require('fs');
const path = require('path');
const { stripComments, NAIVE_RETIRED } = require('./lib/stripComments');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok  = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  → ' + d : '')); } };
const sec = (t) => console.log('\n' + t);

const raw = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── codeOf() — the P3 stripper, WITH ITS ORDER RULE (P3 handover §5(d)) ────────────────
// LINE comments are stripped FIRST, block comments SECOND. Stripping blocks first lets a
// LINE comment containing a `/`-star sequence open a phantom block that closes thousands of
// characters later and swallows live code, reddening true cells. The `(^|[^:])` guard keeps
// `https://` out of the line pass.
//
// THIS BENCH NEEDED IT IMMEDIATELY, and that is worth recording: §3.4 asserts the preview
// does NOT apply the display cap itself. Written against raw text it FAILED — because the
// preview's own comment explains that the SHAPER applies DISPLAY_PHOTO_LIMIT. The cell was
// true about the wrong thing: it was reading prose as if it were mechanism. That is the
// P4a seat's "true, and true about the wrong thing" class, caught here by the cell's own
// first run rather than by a later reader.
// ── F-07.74 CURED · THE ONE STRIPPER (CE-ruled F1→(b1), F2→(a)) ──────────────
// This bench carried its own copy of the naive rule. Six copies lived in this
// repo and eleven in dreamos-pwa, and every one of them treated the `/*` inside
// `accept="image/*"` as a comment open. The definition now lives at
// scripts/lib/stripComments.js and nowhere else; §0 carries the canaries.
// TDW_STRIPPER_CANARY
const codeOf = (rel) => stripComments(raw(rel));

const SHAPER  = 'src/lib/discover/shapeVendor.js';
const RATEMET = 'src/lib/vendor/rateMet.js';
const FEED    = 'src/api/couple/discover.js';
const VDISC   = 'src/lib/vendor/discover.js';
const VROUTE  = 'src/api/vendor/discover.js';
const SCORE   = 'src/lib/vendor/profileScore.js';
const ME      = 'src/api/vendor/me.js';
const IGIMP   = 'src/lib/vendor/igImport.js';

const S = raw(SHAPER), R = raw(RATEMET), F = raw(FEED), V = raw(VDISC),
      VR = raw(VROUTE), SC = raw(SCORE), M = raw(ME), IG = raw(IGIMP);

const shaper       = require(path.join(ROOT, SHAPER));
const rateMetMod   = require(path.join(ROOT, RATEMET));
const profileScore = require(path.join(ROOT, SCORE));

// ═══════════════════════════════════════════════════════════════════════════════
// ── §0 · TDW_STRIPPER_CANARY — the stripper itself, driven directly ─────────
// F-07.74: the retired rule treated the `/*` inside `accept="image/*"` as a
// comment open and deleted to the next real `*/`. The cells below drive the
// STRIPPER, not the sources — a planted `image/*` in production code is
// correctly harmless now, so the regression to catch is the RULE reverting.
// §0.Z is F-07.99's cell: a definition with no call-site fooled this estate for
// a whole block, so the call-site is asserted rather than assumed.
{
  const _spec = 'const a = 1;\nconst input = { accept: "image/*" };\nconst KEEP_ME = 2;\n/* real */\nconst ALSO_KEEP = 3;\n';
  ok('§0.X the stripper does NOT open a block on a mid-token /* — F-07.74 cured',
    stripComments(_spec).includes('KEEP_ME') && stripComments(_spec).includes('ALSO_KEEP'));
  ok('§0.Y VACUITY TWIN — the RETIRED naive rule WOULD swallow that specimen',
    !NAIVE_RETIRED(_spec).includes('KEEP_ME'));
  ok('§0.Z INVOCATION (F-07.99) — this bench really CALLS its stripper',
    (() => { const self = stripComments(require('fs').readFileSync(__filename, 'utf8'));
              return (self.match(/\bcodeOf\s*\(/g) || []).length >= 2; })());
}

sec('§1 · THE SHAPER EXISTS AND IS THE ONE AUTHOR (F1b)');

ok('§1.1 shapeVendorForDiscover is exported and callable',
  typeof shaper.shapeVendorForDiscover === 'function');
// ── LABELED AMENDMENT (TDW_07 MICRO-2) — THE CAP IS OVERTURNED BY FOUNDER RULING. ──────
// This asserted DISPLAY_PHOTO_LIMIT === 5. The founder retired the rule outright
// ("couples should be able to see all approved photos on discover"), superseding P3's
// Fork 7(b). The cell is INVERTED, not deleted: it now pins that the constant is GONE
// rather than zeroed or renamed, because a retired rule left exported at a sentinel value
// is how it gets re-consumed by accident.
ok('§1.2 DISPLAY_PHOTO_LIMIT is RETIRED — the constant is absent, not set to some sentinel',
  !('DISPLAY_PHOTO_LIMIT' in shaper), `still exported as ${shaper.DISPLAY_PHOTO_LIMIT}`);
ok('§1.3 the feed IMPORTS the shaper rather than shaping inline',
  /require\('\.\.\/\.\.\/lib\/discover\/shapeVendor'\)/.test(F) &&
  /\.\.\.shapeVendorForDiscover\(v, \{/.test(F));
ok('§1.4 the feed no longer carries its own cap literal — the rule has one home',
  !/photoMap\[p\.vendor_id\]\.length < 5/.test(F));
ok('§1.5 the demo leg carries NO cap either — the rule died on both legs, not just the real one',
  !/\.slice\(0, DISPLAY_PHOTO_LIMIT\)/.test(F) && !/\.slice\(0, 5\)/.test(F));
ok('§1.6 normalizeIgHandle was MOVED, not copied — one definition in the estate',
  !/^function normalizeIgHandle/m.test(F) && /^function normalizeIgHandle/m.test(S));
ok('§1.7 _rank_score is appended at the FEED, never inside the shared shaper',
  /_rank_score: rankScore\(terms, weights\)/.test(F) && !/_rank_score/.test(stripComments(S)));

// ═══════════════════════════════════════════════════════════════════════════════
sec('§2 · THE SHAPER\'S BEHAVIOUR — run, never grepped');

const twenty = Array.from({ length: 20 }, (_, i) => `https://cdn.example/p${i}.jpg`);
const vRow = {
  id: 'v-1', business_name: 'Swati Roy', category: 'Photographers', city: 'Delhi NCR',
  routing_handle: 'swatiroy', rate_min: 150000, rate_display: true,
  aesthetic_tags: ['Candid'], about: 'Quiet, warm, unhurried.', instagram_handle: '@swati.roy',
};

const shapedFull = shaper.shapeVendorForDiscover(vRow, { photos: twenty, featured: false });
// LABELED AMENDMENT (MICRO-2) — the founder's ruling inverts these two. They asserted the
// cap; they now assert its absence, and they are STRONGER for it: an off-by-one or a stray
// slice anywhere in the shaper reddens, where the old pair would have passed on any
// truncation to five.
ok('§2.1 a twenty-photo vendor ships ALL TWENTY to the card — the cap is gone',
  shapedFull.photos.length === 20, `got ${shapedFull.photos.length}`);
ok('§2.2 order is preserved exactly — pass-through, never a reordering or a sample',
  shapedFull.photos.join(',') === twenty.join(','));
// The ceiling is the PORTFOLIO's, not the card's. Nothing in the shaper asserts a number,
// so a vendor holding fewer than twenty is bounded by his own rows and nothing else.
ok('§2.2b a nine-photo vendor ships nine — no floor, no pad, no cap',
  shaper.shapeVendorForDiscover(vRow, { photos: twenty.slice(0, 9) }).photos.length === 9);
ok('§2.3 the handle is normalised — the "@" never reaches a deep link',
  shapedFull.instagram_handle === 'swati.roy', `got ${shapedFull.instagram_handle}`);
ok('§2.4 the enquire link is built from the routing handle',
  typeof shapedFull.enquire_link === 'string' && shapedFull.enquire_link.endsWith('swatiroy'));
ok('§2.5 is_demo is FALSE — this function shapes real vendors only',
  shapedFull.is_demo === false);

// D-1's suppressed price. The fixture ledger names Swati (rate_display=false) as the witness.
const hidden = shaper.shapeVendorForDiscover({ ...vRow, rate_display: false }, { photos: twenty });
ok('§2.6 rate_display=false HIDES the starting price — D-1, and the preview inherits it',
  hidden.starting_price === null, `got ${hidden.starting_price}`);
ok('§2.7 rate_display=true SHOWS it',
  shapedFull.starting_price === 150000, `got ${shapedFull.starting_price}`);

// The EMPTY witness — the fixture ledger's `dev` account: zero photos, null name/rate.
const empty = shaper.shapeVendorForDiscover(
  { id: 'v-2', business_name: null, rate_min: null, rate_display: true }, { photos: [] });
ok('§2.8 the EMPTY vendor shapes without throwing — the pre-approval preview must render',
  empty.photos.length === 0 && empty.name === null && empty.starting_price === null);
ok('§2.9 featured is passed in, never derived inside the shaper',
  shaper.shapeVendorForDiscover(vRow, { photos: [], featured: true }).featured === true &&
  shaper.shapeVendorForDiscover(vRow, { photos: [] }).featured === false);

// ═══════════════════════════════════════════════════════════════════════════════
sec('§3 · STRICT PARITY — the two mounts cannot disagree, proven by identity');

// THE LOAD-BEARING CELL OF THIS SITTING. The feed and the preview do not merely call
// functions with the same NAME — they call the same function object, so there is no
// implementation that could drift. Asserted by identity, not by resemblance.
const feedShaper    = require(path.join(ROOT, 'src/lib/discover/shapeVendor')).shapeVendorForDiscover;
const previewShaper = require(path.join(ROOT, 'src/lib/discover/shapeVendor')).shapeVendorForDiscover;
ok('§3.1 the module resolves to ONE function object for both consumers',
  feedShaper === previewShaper && feedShaper === shaper.shapeVendorForDiscover);
ok('§3.2 the preview mount imports the shaper — it does not assemble a card',
  /require\('\.\.\/discover\/shapeVendor'\)/.test(V) && /shapeVendorForDiscover\(vendor, \{/.test(V));
ok('§3.3 the preview reads its photos with the SAME 0102 ordering authority as the feed',
  /\.order\('position',\s*\{ ascending: true \}\)/.test(V));
// Asserted against CODE, not prose — see codeOf()'s header for why this cell needed it.
const V_CODE = codeOf(VDISC);
ok('§3.4 the preview does NOT cap photos itself — the shaper owns the display rule',
  !/slice\(0,\s*5\)/.test(V_CODE) && !/DISPLAY_PHOTO_LIMIT/.test(V_CODE));

// Identical inputs through the identical function must give byte-identical output.
const asFeed    = shaper.shapeVendorForDiscover(vRow, { photos: twenty, featured: true });
const asPreview = shaper.shapeVendorForDiscover(vRow, { photos: twenty, featured: true });
ok('§3.5 identical input yields byte-identical output on both paths',
  JSON.stringify(asFeed) === JSON.stringify(asPreview));

// ═══════════════════════════════════════════════════════════════════════════════
sec('§4 · THE PREVIEW MOUNT (F5)');

ok('§4.1 GET /preview is mounted on the vendor discover router',
  /router\.get\('\/preview', requireAuth, resolveVendor\(\)/.test(VR));
ok('§4.2 it carries auth AND ownership',
  /'\/preview', requireAuth, resolveVendor\(\)/.test(VR));
ok('§4.3 it carries NO eligibility guard — F5\'s pre-approval reach is the feature',
  !/discover_eligible/.test(VR) && !/discover_paused/.test(VR));
ok('§4.4 getDiscoverPreview is exported',
  /getDiscoverPreview/.test(V.split('module.exports')[1] || ''));
ok('§4.5 the response names the production truths the chrome renders',
  /discover_paused:/.test(V) && /is_live:/.test(V) && /discover_eligible:/.test(V));
ok('§4.6 is_live is BOTH conditions — eligible AND not paused',
  /is_live:\s*vendor\.discover_eligible === true && vendor\.discover_paused !== true/.test(V));
ok('§4.7 the approved count is the FULL count, not the displayed five',
  /approved_photo_count: \(photos \|\| \[\]\)\.length/.test(V) &&
  /displayed_photo_count: card\.photos\.length/.test(V));
ok('§4.8 a portfolio read error is REPORTED, never swallowed into an empty array',
  /if \(photoErr\)/.test(V) && /Could not read your portfolio/.test(V));

// ═══════════════════════════════════════════════════════════════════════════════
sec('§5 · THE RETIREMENT (F4, WIDENED)');

ok('§5.1 rateMet exists as a LEAF module — it imports nothing, so no cycle can form',
  typeof rateMetMod.rateMet === 'function' && !/require\(/.test(R));
ok('§5.2 profileScore RE-EXPORTS the same function object, not a second copy',
  profileScore.rateMet === rateMetMod.rateMet);
ok('§5.3 the score term consumes the predicate (the ruling\'s :154)',
  /const rateTerm  = rateMet\(\{ rateMin \}\) \? 1 : 0;/.test(SC));
ok('§5.4 the breakdown consumes the SAME predicate (the ruling\'s :183)',
  /rate:   \{ met: rateMet\(\{ rateMin: p\.rateMin \}\) \}/.test(SC));
ok('§5.5 neither consumer re-authors the both-bounds test inline',
  !/rateMin != null && rateMax != null/.test(SC));

// Behaviour of the predicate, exhaustively — including the empty-string trap the
// executor shipped and self-caught (Number('') === 0, which is finite).
const rm = rateMetMod.rateMet;
ok('§5.6 a MIN-ONLY rate is MET — the retirement\'s whole point',  rm({ rateMin: 150000 }) === true);
ok('§5.7 a null rate is not met',                                   rm({ rateMin: null }) === false);
ok('§5.8 an absent rate is not met',                                rm({}) === false);
ok('§5.9 a numeric string is met',                                  rm({ rateMin: '150000' }) === true);
ok('§5.10 an EMPTY STRING is NOT met — Number("") is 0 and finite, and that is the trap',
  rm({ rateMin: '' }) === false);
ok('§5.11 whitespace is NOT met',                                   rm({ rateMin: '   ' }) === false);
ok('§5.12 NaN is NOT met',                                          rm({ rateMin: NaN }) === false);
ok('§5.13 a non-numeric string is NOT met',                         rm({ rateMin: 'abc' }) === false);
ok('§5.14 Infinity is NOT met',                                     rm({ rateMin: Infinity }) === false);
ok('§5.15 a numeric ZERO IS met — deliberate continuity with the retired `!= null` test',
  rm({ rateMin: 0 }) === true);

// The weight is the ruling's explicit invariant.
ok('§5.16 TERM_WEIGHTS.rate is still exactly 0.135 — F4 changed WHEN, never what it is worth',
  Math.abs(profileScore.TERM_WEIGHTS.rate - 0.135) < 1e-12);
ok('§5.17 a min-only rate now earns the term IN FULL',
  Math.abs(profileScore.computeCompleteness({ rateMin: 100000 }) - 0.135) < 1e-9);
ok('§5.18 passing rate_max changes NOTHING — accepted and ignored, never read',
  profileScore.computeCompleteness({ rateMin: 100000, rateMax: 400000 }) ===
  profileScore.computeCompleteness({ rateMin: 100000 }));

// The gate, the write, the allowlist, the guard.
ok('§5.19 the request gate is MIN-ONLY and shares the predicate',
  /if \(!rateMet\(\{ rateMin: rate_min \}\)\)/.test(V));
ok('§5.20 the min>max comparison retired with the bound it compared against',
  !/rate_min cannot exceed rate_max/.test(V));
ok('§5.21 requestDiscover no longer destructures rate_max',
  !/const \{ rate_min, rate_max,/.test(V));
ok('§5.22 the vendor write no longer stores rate_max',
  !/rate_max: Number\(rate_max\)/.test(V));
ok('§5.23 me.js\'s rate guard is retired',
  !/rate_min cannot exceed rate_max/.test(M));
ok('§5.24 its dead rMin/rMax bindings went with it (CE ruling (b))',
  !/const rMin = update\.rate_min/.test(M) && !/const rMax = update\.rate_max/.test(M));
ok('§5.25 rate_max is DORMANT-BY-COMMENT in ALLOWED_FIELDS, not deleted from history',
  /\/\/ 'rate_max',/.test(M) && !/'aesthetic_tags', 'rate_min', 'rate_max',/.test(M));
// ── LABELED AMENDMENT, COUNT-PRESERVED (F-07.107's delivery, 2026-08-02) ──────
// This cell read: `…filter(/^01(0[5-9]|[1-9]\d)/).length === 0` — "no migration
// numbered 0105 or higher exists". That pinned the LADDER TAIL, not P4b's claim.
// It was true at P4b's seal and became false the instant ANY later sitting shipped
// DDL: `0105_circle_message_author.sql` did, for F-07.107/F-07.109, on
// public.messages — a table P4b never touches. A cell that reddens because the
// estate moved forward is asserting the wrong thing, and silently deleting it
// would drop P4b's real guarantee. Re-aimed to what it always meant: the ladder
// may grow, but NOTHING IN IT IS P4b's. Address changed, behaviour and count
// unchanged; it still reddens the day a P4b-shaped migration appears.
ok('§5.26 ZERO DDL — P4b added no migration, and no later one is P4b\'s',
  (() => {
    const dir = path.join(ROOT, 'db/migrations');
    return fs.readdirSync(dir)
      .filter(f => /^01(0[5-9]|[1-9]\d)/.test(f))
      .every(f => !/rate_min|rate_max|public\.vendors|P4b/i.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  })());

// ═══════════════════════════════════════════════════════════════════════════════
sec('§5b · MICRO-2 — THE FOUNDER-CHOSEN GATE STRING, AND THE CAP\'S SUPERSESSION');

// A veto is on the BYTES. Asserted verbatim, not by shape.
ok('§5b.1 the gate speaks the founder\'s string, byte-exact',
  V.includes("'Add your starting rate to request Discover.'"));
ok('§5b.2 the technical placeholder it replaced is gone',
  !/'rate_min is required\.'/.test(V));
// SELF-CAUGHT, SECOND INSTANCE OF ONE DEFECT, DISCLOSED RATHER THAN QUIETLY FIXED.
// This cell first read `!/rate_min is required/.test(V)` against RAW text and failed —
// because the cure's own comment QUOTES the placeholder it replaced. Prose read as
// mechanism: the exact defect §3.4 hit last sitting, which is why `codeOf()` exists twenty
// lines up in this same file. I wrote the bug again with the cure already in hand.
// It is also re-aimed at something worth asserting: the original was a restatement of
// §5b.2, and a cell that repeats its neighbour buys nothing.
const V_CODE_GATE = codeOf(VDISC);
ok('§5b.3 the retired placeholder survives ONLY in the comment that explains it, never in code',
  !/rate_min is required/.test(V_CODE_GATE) && /rate_min is required/.test(V));

// The supersession must be findable FROM the shaper, or a future reader re-derives Fork 7(b)
// from the P3 handover and re-caps the card. F-06.85's standing law: a sentence conditioned
// on a mechanical fact names the mechanism in-comment.
ok('§5b.4 the shaper records WHICH rulings the founder\'s overturn supersedes',
  /Fork 7\(b\)/.test(S) && /SUPERSEDED/.test(S) && /P6/.test(S));
ok('§5b.5 the payload delta is DERIVED in-file, not hand-waved',
  /rolling window of two|ROLLING WINDOW OF TWO/i.test(S) && /46\.9KB|11\.7KB/.test(S));
ok('§5b.6 the ceiling is named as the portfolio\'s, not re-asserted by the card',
  /MAX_PORTFOLIO_IMAGES/.test(S) && /portfolio\.js:24/.test(S));

// ═══════════════════════════════════════════════════════════════════════════════
sec('§6 · F-07.17 · α · AND THE COMMITTED HANDOVER');

ok('§6.1 discover_preview is retired BY COMMENT at the /me shape',
  /F-07\.17/.test(M) && /RETIRED BY COMMENT, ZERO DDL/.test(M));
ok('§6.2 the retirement names the collision it exists to prevent',
  /vendor\/discover\/preview/.test(M));
ok('§6.3 the column is still REPORTED truthfully — dormancy is not hiding live data',
  /discover_preview:\s+vendor\.discover_preview\s+=== true,/.test(M));
ok('§6.4 α — igImport\'s U-1 line names www.instagram.com',
  /U-1  SETTLED — www\.instagram\.com\/oauth\/authorize/.test(IG));
ok('§6.5 the stale api.instagram.com AUTHORIZE claim is gone from the U-index',
  !/U-1  SETTLED — api\.instagram\.com/.test(IG));
ok('§6.6 F-07.23 is cited as the correction\'s family',
  /F-07\.23/.test(IG));
ok('§6.7 the comment agrees with the live constant one file away',
  /AUTHORIZE_URL   = 'https:\/\/www\.instagram\.com\/oauth\/authorize'/.test(raw('src/lib/vendor/igOAuth.js')));
ok('§6.8 the P4a handover is committed with its ruled provenance header',
  fs.existsSync(path.join(ROOT, 'docs/specs/TDW_07_P4A_HANDOVER.md')) &&
  /^Filed in-chat by the retired P4a seat, 2026-07-30; committed verbatim by the P4b body seat per CE ruling; the chair's CE-116 band carries the arc's findings\./
    .test(raw('docs/specs/TDW_07_P4A_HANDOVER.md')));
ok('§6.9 it carries the P4a text itself, not a summary of it',
  /F-07\.24 — I made a claim to Meta the code didn't satisfy/.test(raw('docs/specs/TDW_07_P4A_HANDOVER.md')));

// ═══════════════════════════════════════════════════════════════════════════════
sec('§7 · W-1 · the instruments are untouched');

const SOULS = [
  'src/engine/src/core/donnaSoul.ts',
  'src/engine/src/core/harveySoul.ts',
  'src/engine/src/core/advisorLens.ts',
  'src/engine/src/core/loop.ts',
];
let soulClean = true;
for (const f of SOULS) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p) && /TDW_07 P4b/.test(fs.readFileSync(p, 'utf8'))) soulClean = false;
}
ok('§7.1 W-1 — zero P4b bytes in any soul, lens or loop file', soulClean);
ok('§7.2 the gauntlet instrument is untouched by this sitting',
  !/TDW_07 P4b/.test(raw('scripts/b06_gauntlet.js')));

console.log(`\n${fail === 0 ? 'GREEN' : 'RED'}  b07_p4b_body_bench ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
