#!/usr/bin/env node
// scripts/b07_p3_bench.js
// TDW_07 P3 — THE FLOOR: the 20-cap, `position` ordering, the cover's one hand,
// the IG mirror's never-hotlink property, and F-07.12/.14's cures.
//
// Runnable from ANY working directory (Q-SP-5): every path resolves off __dirname.
// Exit code is the verdict; the PASS count is the number.
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.join(__dirname, '..');

const P  = require(path.join(ROOT, 'src/lib/vendor/portfolio.js'));
const IG = require(path.join(ROOT, 'src/lib/vendor/igImport.js'));
const D  = require(path.join(ROOT, 'src/lib/vendor/discover.js'));

let pass = 0, fail = 0;
// ── THE COMMENT STRIPPER ─────────────────────────────────────────────────────
// P1's executor filed this defect as its deviation (iv); P2's reproduced it one
// sitting later; I reproduced it twice more here (§6.3 and §10.2 both greened or
// reddened on MY OWN explanatory comments rather than on code). A cell that greps
// a bare identifier convicts the paragraph that explains why the identifier is
// absent. Every source-grepping cell below reads codeOf(), never the raw file.
// Softening the comments to buy the green is refused by name: a green bought by
// deleting evidence is not a green.
// ORDER IS LOAD-BEARING AND WAS WRONG ONCE: line comments are stripped FIRST,
// block comments SECOND. Stripping blocks first lets a line comment containing
// `/wedding/auth/*` open a phantom block that swallows to the next real `*/` —
// in app/vendor/layout.tsx that ate ten thousand characters of live code and
// reddened a true cell. The `(^|[^:])` guard keeps `https://` out of the line pass.
const codeOf = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
  .split('\n').map(l => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  → ' + detail : '')); }
};
const section = (t) => console.log('\n' + t);

// ── A FAKE SUPABASE ──────────────────────────────────────────────────────────
// Implements exactly the query shapes the production code uses. It is a FIXTURE,
// so no assertion below may be satisfied by changing it — every mutation in the
// ledger at the foot of this file is applied to a PRODUCTION source file.
function makeDb(rows = []) {
  let auto = 0;
  const store = { vendor_portfolio: rows.map(r => ({ ...r })) };

  function builder(table) {
    const st = { op: 'select', cols: '*', filters: [], orders: [], head: false, countMode: null, payload: null };
    const api = {
      select(cols, opts) {
        if (st.op !== 'insert' && st.op !== 'update') st.op = 'select';
        st.cols = cols || '*';
        if (opts && opts.count) { st.countMode = opts.count; st.head = !!opts.head; }
        return api;
      },
      insert(obj) { st.op = 'insert'; st.payload = obj; return api; },
      update(obj) { st.op = 'update'; st.payload = obj; return api; },
      delete()    { st.op = 'delete'; return api; },
      eq(col, val) { st.filters.push([col, val]); return api; },
      in(col, vals) { st.filters.push([col, vals, 'in']); return api; },
      order(col, opts) { st.orders.push([col, opts && opts.ascending !== false]); return api; },
      limit() { return api; },
      single()      { return Promise.resolve(run(true)); },
      maybeSingle() { return Promise.resolve(run(true)); },
      then(res, rej) { return Promise.resolve(run(false)).then(res, rej); },
    };

    function match(r) {
      return st.filters.every(([c, v, mode]) => mode === 'in' ? v.includes(r[c]) : r[c] === v);
    }
    function run(one) {
      const t = store[table];
      if (st.op === 'insert') {
        const row = { id: 'row-' + (++auto), created_at: new Date(Date.now() + auto).toISOString(), ...st.payload };
        t.push(row);
        return { data: one ? row : [row], error: null };
      }
      if (st.op === 'update') {
        const hits = t.filter(match);
        hits.forEach(r => Object.assign(r, st.payload));
        return { data: one ? (hits[0] || null) : hits, error: null };
      }
      if (st.op === 'delete') {
        const keep = t.filter(r => !match(r));
        const removed = t.length - keep.length;
        store[table] = keep;
        return { data: null, error: null, count: removed };
      }
      let out = t.filter(match);
      for (let i = st.orders.length - 1; i >= 0; i--) {
        const [col, asc] = st.orders[i];
        out = out.slice().sort((a, b) => {
          const x = a[col], y = b[col];
          if (x === y) return 0;
          return (x > y ? 1 : -1) * (asc ? 1 : -1);
        });
      }
      if (st.countMode) return { count: out.length, data: st.head ? null : out, error: null };
      return { data: one ? (out[0] || null) : out, error: null };
    }
    return api;
  }
  return { from: (t) => builder(t), __store: store };
}

const V = 'vendor-1';
const photo = (i, extra = {}) => ({
  id: 'p' + i, vendor_id: V, image_url: `https://res.cloudinary.com/dccso5ljv/image/upload/v17${i}/x${i}.jpg`,
  caption: null, aesthetic_tags: [], is_hero: false, in_carousel: true,
  approval_state: 'approved', created_at: `2026-07-0${i}T00:00:00Z`, position: i - 1, ...extra,
});

(async () => {

section('§1 · THE CAP — ONE CONSTANT, FOUR CONSUMERS (Fork 6)');
ok('§1.1 the cap is 20 at its one home', P.MAX_PORTFOLIO_IMAGES === 20, String(P.MAX_PORTFOLIO_IMAGES));
{
  const literals = (codeOf('src/lib/vendor/portfolio.js').match(/MAX_PORTFOLIO_IMAGES\s*=\s*\d+/g) || []);
  ok('§1.2 exactly one assignment of the constant exists', literals.length === 1, JSON.stringify(literals));
}
{
  const disc = codeOf('src/lib/vendor/discover.js');
  ok('§1.3 discover.js IMPORTS the cap, never mints a second copy',
    /require\('\.\/portfolio'\)/.test(disc) && !/MAX_PORTFOLIO_IMAGES\s*=\s*\d/.test(disc));
}
{
  const db = makeDb(Array.from({ length: 20 }, (_, i) => photo(i + 1)));
  const room = await P.canAcceptMore(db, V, 1);
  ok('§1.4 canAcceptMore refuses at twenty', room.ok === false && room.cap_reached === true);
  ok('§1.5 the refusal carries the founder-vetoed sentence (copy A3), verbatim',
    room.error === 'Your portfolio holds 20 photos, the maximum. Remove one to add another.', room.error);
  const reg = await P.registerImage(db, V, { image_url: 'https://res.cloudinary.com/x/image/upload/v1/y.jpg' });
  ok('§1.6 CAP SITE 1 — the register door refuses the twenty-first', reg.ok === false);
  ok('§1.7 and no row was written', db.__store.vendor_portfolio.length === 20);
}
{
  const db = makeDb(Array.from({ length: 19 }, (_, i) => photo(i + 1)));
  const room = await P.canAcceptMore(db, V, 1);
  ok('§1.8 nineteen still has room, and the remaining count is honest',
    room.ok === true && room.remaining === 1, JSON.stringify(room));
}

section('§2 · POSITION IS THE ORDER (Fork 1(a))');
{
  const db = makeDb([photo(1), photo(2), photo(3)]);
  const reg = await P.registerImage(db, V, { image_url: 'https://res.cloudinary.com/x/image/upload/v1/new.jpg' });
  ok('§2.1 a new photo APPENDS at position = count', reg.ok && reg.image.position === 3, JSON.stringify(reg.image && reg.image.position));
  ok('§2.2 a new photo never seizes the cover', reg.image.is_hero === false);
  ok('§2.3 and it lands pending, not approved', reg.image.approval_state === 'pending');
}
{
  const db = makeDb([photo(1), photo(2), photo(3)]);
  const list = await P.listImages(db, V, 'all');
  ok('§2.4 listImages returns position order', list.images.map(i => i.id).join(',') === 'p1,p2,p3');
  ok('§2.5 and it SELECTs the position column at all', /position/.test(JSON.stringify(list.images[0])));
}

section('§3 · THE COVER, WRITTEN BY ONE HAND (Fork 2(b))');
{
  const db = makeDb([photo(1), photo(2), photo(3)]);
  await P.setHeroImage(db, V, 'p3');
  const rows = db.__store.vendor_portfolio;
  const byId = Object.fromEntries(rows.map(r => [r.id, r]));
  ok('§3.1 the star moves the row to position 0', byId.p3.position === 0);
  ok('§3.2 and sets is_hero on it IN THE SAME HAND', byId.p3.is_hero === true);
  ok('§3.3 and clears is_hero everywhere else', byId.p1.is_hero === false && byId.p2.is_hero === false);
  ok('§3.4 the survivors re-index contiguously', [byId.p3.position, byId.p1.position, byId.p2.position].join(',') === '0,1,2');
}
{
  const db = makeDb([photo(1), photo(2), photo(3)]);
  await P.reorderImages(db, V, ['p2', 'p3', 'p1']);
  const byId = Object.fromEntries(db.__store.vendor_portfolio.map(r => [r.id, r]));
  ok('§3.5 a DRAG to first also takes the cover — the badge can never lie',
    byId.p2.position === 0 && byId.p2.is_hero === true);
  ok('§3.6 exactly one row holds is_hero after any ordering write',
    db.__store.vendor_portfolio.filter(r => r.is_hero).length === 1);
}

section('§4 · REORDER IS FAIL-CLOSED');
{
  const db = makeDb([photo(1), photo(2), photo(3)]);
  const before = db.__store.vendor_portfolio.map(r => r.position).join(',');
  const r1 = await P.reorderImages(db, V, ['p1', 'p2']);
  ok('§4.1 an INCOMPLETE set is refused', r1.ok === false);
  const r2 = await P.reorderImages(db, V, ['p1', 'p1', 'p2']);
  ok('§4.2 DUPLICATES are refused', r2.ok === false);
  const r3 = await P.reorderImages(db, V, ['p1', 'p2', 'not-mine']);
  ok('§4.3 a FOREIGN id is refused', r3.ok === false);
  ok('§4.4 and not one position moved through any of the three refusals',
    db.__store.vendor_portfolio.map(r => r.position).join(',') === before);
}

section('§5 · DELETE KEEPS CONTIGUITY (0102 readback C as an invariant)');
{
  const db = makeDb([photo(1), photo(2), photo(3)]);
  await P.deleteImage(db, V, 'p1');
  const rows = db.__store.vendor_portfolio.slice().sort((a, b) => a.position - b.position);
  ok('§5.1 the gap closes to a 0..n-1 run', rows.map(r => r.position).join(',') === '0,1');
  ok('§5.2 and the cover re-seats onto the new first row', rows[0].is_hero === true);
}

section('§6 · F-07.12 — THE ADMIN DELETE PATH HAS ITS FUNCTION BACK');
ok('§6.1 deleteFromCloudinary is exported', typeof P.deleteFromCloudinary === 'function');
{
  const admin = codeOf('src/api/admin/vendorPortfolio.js');
  ok('§6.2 the admin router still destructures it from vendor/portfolio (the import was never the bug)',
    /deleteFromCloudinary[^}]*}\s*=\s*require\('\.\.\/\.\.\/lib\/vendor\/portfolio'\)/.test(admin));
  ok('§6.3 and it did NOT swap to admin/cloudinary, which takes a public_id this table does not store',
    !/lib\/admin\/cloudinary/.test(admin));
}
{
  // The round trip: the row must actually leave, which it never did while the
  // destructured name was undefined and the call threw before the delete.
  const db = makeDb([photo(1), photo(2)]);
  const res = await P.deleteImage(db, V, 'p2');
  ok('§6.4 delete round-trip: ok true and the row is gone',
    res.ok === true && db.__store.vendor_portfolio.length === 1);
}

section('§7 · F-07.14 — THE DESTROY NO LONGER SKIPS IN SILENCE');
{
  const warns = [];
  const real = console.warn; console.warn = (...a) => warns.push(a.join(' '));
  await P.deleteFromCloudinary('https://example.com/no-version-segment');
  console.warn = real;
  ok('§7.1 an unparseable url logs a named SKIP', warns.some(w => /destroy SKIPPED/.test(w)), JSON.stringify(warns));
}

section('§8 · THE IG MIRROR — NEVER HOTLINK (the addendum\'s own capitals)');
ok('§8.1 an estate url is recognised', IG.isEstateUrl('https://res.cloudinary.com/dccso5ljv/image/upload/v1/x.jpg') === true);
ok('§8.2 an Instagram CDN url is NOT', IG.isEstateUrl('https://scontent.cdninstagram.com/v/t51/1_n.jpg') === false);
// ── §8.3 · LABELED AMENDMENT, TDW_07 P4a ────────────────────────────────────
// COUNT DISCLOSED, NOT PRESERVED: 1 cell → 2 cells, so b07_p3_bench reads 50/50
// where the P3 seal recorded 49/49. The floor-method law asks for the number to
// be said out loud, not for the number to be held still. (My first draft of this
// comment claimed "count preserved 1 → 1" and was simply wrong — corrected here
// rather than left as a tidy-looking falsehood.)
// WAS: `listInstagramMedia()` throws IG_SEAM_UNSET.
// WHY IT MOVED: that cell asserted a SITTING-SCOPED POSTURE — "the seam is not
// wired yet" — and P4a is the sitting chartered to wire it. Leaving it would
// make a correct build red; deleting it would drop the property it was protecting.
// Same class as F-07.5's "0101 stays unreserved" cells, re-scoped rather than
// removed, per the M0_RANGE precedent.
//
// THE LAW IT WAS REALLY PROTECTING HAS NOT CHANGED, and is what it now asserts:
// an import that cannot reach Instagram must REFUSE, never return an empty list,
// because a silent empty is indistinguishable from a vendor with no posts
// (F-04.113's class). The mechanism moved from a throw to an ok:false; the
// property is identical and is now tested against the REAL function over a
// stubbed fetch rather than against its unwired stub.
// TITLE RE-AUTHORED TOO: a green cell under a false title is a small hollow
// green — P2's own words, and the reason this comment names the change.
{
  const realFetch = global.fetch;
  // No token at all → refusal, and it never touches the network.
  const noTok = await IG.listInstagramMedia(null);
  ok('§8.3a a missing connection REFUSES rather than returning an empty list',
     noTok.ok === false, JSON.stringify(noTok));

  // Meta refuses (401). The cell proves the refusal travels AND that the
  // access token never appears in the error text — the secrets law, benched.
  global.fetch = async () => ({
    ok: false, status: 401,
    json: async () => ({ error: { code: 190, type: 'OAuthException' } }),
  });
  const refused = await IG.listInstagramMedia('SEKRET-TOKEN-VALUE');
  global.fetch = realFetch;
  ok('§8.3 a Meta refusal REFUSES LOUDLY rather than returning an empty list',
     refused.ok === false && refused.http_status === 401
       && !JSON.stringify(refused).includes('SEKRET-TOKEN-VALUE'),
     JSON.stringify(refused));
}
{
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/igImport.js'), 'utf8');
  ok('§8.4 the five unknowns are named in-file for the founder/chair',
    /U-1/.test(src) && /U-2/.test(src) && /U-3/.test(src) && /U-4/.test(src) && /U-5/.test(src));
  ok('§8.5 the mirror refuses to persist a non-estate url',
    /Mirror produced a non-estate URL; refused/.test(src));
}

section('§9 · FORK 4(b) — IMPORTED ROWS LAND APPROVED, MANUAL STAYS PENDING');
{
  const db = makeDb([]);
  const manual = await P.registerImage(db, V, { image_url: 'https://res.cloudinary.com/x/image/upload/v1/m.jpg' });
  const imported = await P.registerImage(db, V, { image_url: 'https://res.cloudinary.com/x/image/upload/v1/i.jpg', approval_state: 'approved' });
  ok('§9.1 the manual door still lands pending', manual.image.approval_state === 'pending');
  ok('§9.2 the import door lands approved — the founder\'s incentive, live on arrival',
    imported.image.approval_state === 'approved');
  const bogus = await P.registerImage(db, V, { image_url: 'https://res.cloudinary.com/x/image/upload/v1/b.jpg', approval_state: 'rejected' });
  ok('§9.3 no other value can be smuggled through the field', bogus.image.approval_state === 'pending');
}
{
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/igImport.js'), 'utf8');
  ok('§9.4 the intended asymmetry is stated AT THE WRITE SITE, as ruled',
    /ASYMMETRY WITH THE MANUAL PATH IS INTENDED, NOT DRIFT/.test(src));
}

section('§10 · THE FEED (Fork 1(a) invisible-migration + Fork 7(b))');
{
  const feed    = codeOf('src/api/couple/discover.js');
  const feedRaw = fs.readFileSync(path.join(ROOT, 'src/api/couple/discover.js'), 'utf8');
  ok('§10.1 the feed orders by position', /\.order\('position',\s*\{\s*ascending:\s*true/.test(feed));
  ok('§10.2 is_hero is no longer an ORDERING key on the feed query',
    !/\.order\('is_hero'/.test(feed));
  ok('§10.3 but is_hero SURVIVES as the score\'s input — the term is untouched',
    /if \(p\.is_hero\) hasHero\[p\.vendor_id\] = true;/.test(feed));
  ok('§10.4 :378\'s heroPhotoMap selector is untouched', /\.eq\('is_hero', true\)/.test(feed));
  // ── LABELED AMENDMENT (TDW_07 P4b · F1b) — RE-AIMED AT THE RULE'S NEW HOME, AND
  // STRENGTHENED FROM A GREP TO A BEHAVIOUR. Fork 7(b) is unchanged in substance: the feed
  // still ships FIVE. What changed is WHERE the rule lives — it moved out of the feed's
  // accumulation loop into shapeVendor.js's DISPLAY_PHOTO_LIMIT so the vendor's preview
  // mount obeys the identical rule. The old cell grepped the loop's `< 5` literal and would
  // now redden over a move that changed no output, which is the false-title class. It is
  // re-authored, and it now EXECUTES the shaper instead of reading it: a grep can be
  // satisfied by a constant nobody applies.
  const { shapeVendorForDiscover, DISPLAY_PHOTO_LIMIT } = require(path.join(ROOT, 'src/lib/discover/shapeVendor'));
  const twentyPhotos = Array.from({ length: 20 }, (_, i) => `https://cdn.example/p${i}.jpg`);
  const shapedTwenty = shapeVendorForDiscover({ id: 'v', rate_display: true }, { photos: twentyPhotos });
  ok('§10.5 Fork 7(b) — a twenty-photo vendor still ships FIVE to the card, proven by running the shaper',
    shapedTwenty.photos.length === 5 && DISPLAY_PHOTO_LIMIT === 5, `got ${shapedTwenty.photos.length}`);
  ok('§10.5b the five are the FIRST five in position order — the cap takes the front, never a sample',
    shapedTwenty.photos.join(',') === twentyPhotos.slice(0, 5).join(','));
  ok('§10.5c the rule has ONE home — the feed loop no longer carries its own cap literal',
    !/photoMap\[p\.vendor_id\]\.length < 5/.test(feed) && /DISPLAY_PHOTO_LIMIT/.test(feedRaw));
}
{
  const collab = codeOf('src/api/vendor/collab.js');
  ok('§10.6 the fourth is_hero consumer (collab hero_photo) is byte-untouched',
    /p\.approval_state === 'approved' && p\.is_hero/.test(collab));
}

section('§11 · CAP SITE 3 + 4 ARE WIRED AT THEIR DOORS');
{
  const vr = codeOf('src/api/vendor/portfolio.js');
  const ar = codeOf('src/api/admin/vendorPortfolio.js');
  ok('§11.1 the vendor signing door checks room before minting params',
    /upload-url[\s\S]{0,600}canAcceptMore/.test(vr));
  ok('§11.2 the admin signing door does too', /upload-url[\s\S]{0,600}canAcceptMore/.test(ar));
  ok('§11.3 the reorder route is declared ABOVE the parameterised sibling',
    vr.indexOf("'/reorder'") !== -1 && vr.indexOf("'/reorder'") < vr.indexOf("'/:imageId'"));
}
ok('§11.4 CAP SITE 4 — the status carries max_portfolio_images', (() => {
  const src = codeOf('src/lib/vendor/discover.js');
  return /max_portfolio_images:\s*MAX_PORTFOLIO_IMAGES/.test(src);
})());

console.log('\n' + '─'.repeat(72));
console.log('  THE MUTATION LEDGER — every line names a PRODUCTION byte whose');
console.log('  mutation must redden the named section. Each was run at the');
console.log('  executor\'s hand and cmp-restored; counts in the handover.');
console.log('    M-1  portfolio.js   MAX_PORTFOLIO_IMAGES 20 → 21          ⇒ §1.1/§1.6 RED');
console.log('    M-2  portfolio.js   canAcceptMore returns ok:true always  ⇒ §1.4/§1.6/§1.7 RED');
console.log('    M-3  portfolio.js   registerImage position = 0, not count ⇒ §2.1 RED');
console.log('    M-4  portfolio.js   writeOrder drops the is_hero write    ⇒ §3.2/§3.5/§5.2 RED');
console.log('    M-5  portfolio.js   reorderImages skips the length check  ⇒ §4.1/§4.4 RED');
console.log('    M-6  portfolio.js   deleteImage stops re-indexing         ⇒ §5.1 RED');
console.log('    M-7  portfolio.js   deleteFromCloudinary off the exports  ⇒ §6.1/§6.4 RED');
console.log('    M-8  portfolio.js   the F-07.14 warn line deleted         ⇒ §7.1 RED');
console.log('    M-9  igImport.js    isEstateUrl returns true always       ⇒ §8.2 RED');
console.log('    M-10 igImport.js    the seam returns [] instead of refusing  ⇒ §8.3 RED  [P4a labeled amendment]');
console.log('    M-11 portfolio.js   approval_state passed through raw     ⇒ §9.3 RED');
console.log('    M-12 couple/discover.js  order reverted to is_hero desc   ⇒ §10.1/§10.2 RED');
console.log('─'.repeat(72));

console.log('\n' + (fail === 0 ? 'GREEN' : 'RED') + ` — b07_p3_bench ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
})();
