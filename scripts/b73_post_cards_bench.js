#!/usr/bin/env node
'use strict';
// scripts/b73_post_cards_bench.js — G4.2 · THE CARDS ARM + ITS DOOR (CE-42 4b-1).
// Seat R6. Cut at dream-os 548944a847027c35cc3ffbd8131a89f802867ffc.
//
// BENCH NUMBER DERIVED, NOT CLAIMED: `ls scripts | grep -oE '^b[0-9]{2}_' | sort -u | tail`
// ended b71_, b72_ at the cut, so this takes b73. The chair may re-allocate.
//
// ═══ BOTH WAYS ═══════════════════════════════════════════════════════════════
// The arm is NEW, so "red at the uncured tree" is a MODULE_NOT_FOUND and proves
// nothing about any cell. Each cell's red is therefore proven by MUTATING THE
// PRODUCTION SOURCE (never this file's setup) — the manifest in the handover
// names every mutation, the cell it reddened, and the restore.
//
// ═══ WHAT IS AND IS NOT DOUBLED ══════════════════════════════════════════════
// The supabase stub answers only the two PostgREST chains the REAL readers build
// (src/lib/vendor/weddings.js `listForOwner` / `photosFor`), over real row shapes
// (PUBLIC_SCHEMA.md weddings :1485–:1503, wedding_photos :1474–:1479). The readers
// themselves run for real. The Cloudinary SDK runs for real: `cloudinary.url` is a
// pure function and signs locally — no network call is made by any cell.
//
// §4 READS THE SIBLING'S lib/worklist/theme.ts. With no ../dreamos-pwa it REFUSES
// (exit 3, run-floor's code) rather than passing a token cell it could not check.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const SIBLING_THEME = path.resolve(ROOT, '../dreamos-pwa/lib/worklist/theme.ts');
if (!fs.existsSync(SIBLING_THEME)) {
  console.log('REFUSED — ../dreamos-pwa/lib/worklist/theme.ts not present; §4 cannot hold CARD_INK to the tokens. Clone dreamos-pwa beside dream-os.');
  process.exit(3);
}

let PASS = 0; const FAILS = [];
async function cell(name, fn) {
  try { await fn(); PASS++; console.log(`  GREEN  ${name}`); }
  catch (e) { FAILS.push(name); console.log(`  RED    ${name}\n         ${e && e.message}`); }
}

// ── the stub: the two chains the real readers build, nothing else ─────────────
function makeDb(tables) {
  return {
    from(name) {
      let rows = (tables[name] || []).slice();
      const orders = [];
      const api = {
        select() { return api; },
        eq(col, val) { rows = rows.filter((r) => r[col] === val); return api; },
        order(col, opts) { orders.push([col, !opts || opts.ascending !== false]); return api; },
        then(resolve) {
          const sorted = rows.slice().sort((a, b) => {
            for (const [col, asc] of orders) {
              if (a[col] < b[col]) return asc ? -1 : 1;
              if (a[col] > b[col]) return asc ? 1 : -1;
            }
            return 0;
          });
          resolve({ data: sorted, error: null });
        },
      };
      return api;
    },
  };
}

const V_ID = '23165e38-6510-4639-ab6a-9f35bab93742';
const VENDOR = { id: V_ID, business_name: 'Dev Roy Photography', routing_handle: 'DEV440', category: 'photography' };
const ENV = { CLOUDINARY_CLOUD_NAME: 'tdwbench', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's' };
const PHOTO_URL = 'https://res.cloudinary.com/tdwbench/image/upload/v1725600000/weddings/v/efd/IMG_1-ab12cd34.jpg';

// DEV440's four pages as S2 returned them (2026-09-10), newest first by created_at.
function s2Tables(over = {}) {
  const page = (id, slug, title, vis, consent, created) => Object.assign({
    id, owner_vendor_id: V_ID, event_id: null, couple_id: null, slug, title, venue: null, city: null,
    wedding_date: null, wedding_date_precision: null, delivered_at: null,
    couple_consent: consent, visibility: vis, created_at: created, updated_at: created,
  }, over[id] || {});
  return {
    weddings: [
      page('f9f0', 'wedding-test-newest', 'wedding test newest', 'published', true, '2026-09-07T14:08:45Z'),
      page('e592', 'pre-wedding-g2-test', 'Pre wedding g2 test', 'draft', false, '2026-09-07T13:23:19Z'),
      page('c25a', 'verma-event', 'Verma Event', 'published', true, '2026-09-05T09:16:42Z'),
      page('efdf', 'wedding', 'Wedding', 'published', true, '2026-09-04T20:13:01Z'),
    ],
    wedding_photos: [
      { id: 'ph3', wedding_id: 'efdf', url: PHOTO_URL.replace('IMG_1', 'IMG_3'), public_id: 'IMG_3-x', position: 2, created_at: '2026-09-04T20:14:03Z' },
      { id: 'ph1', wedding_id: 'efdf', url: PHOTO_URL, public_id: 'IMG_1-ab12cd34', position: 0, created_at: '2026-09-04T20:14:01Z' },
      { id: 'ph2', wedding_id: 'efdf', url: PHOTO_URL.replace('IMG_1', 'IMG_2'), public_id: 'IMG_2-x', position: 1, created_at: '2026-09-04T20:14:02Z' },
    ],
  };
}

const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

(async () => {
  const pc = require(path.join(ROOT, 'src/lib/vendor/postCards.js'));

  console.log('§1 · THE LAST GALLERY (ruled: newest page with ≥1 photo; published + consented only)');
  await cell('1.1 zero-photo pages are skipped; DEV440 lands on `wedding` and its FIRST photo by position', async () => {
    const out = await pc.buildCards(makeDb(s2Tables()), VENDOR, { env: ENV });
    assert.strictEqual(out.ok, true, JSON.stringify(out));
    assert.strictEqual(out.page.slug, 'wedding');
    assert.ok(out.cards.post.includes('/IMG_1-ab12cd34.jpg'), out.cards.post);
  });
  await cell('1.2 no page carries a photo → no_gallery, the vetoed byte', async () => {
    const t = s2Tables(); t.wedding_photos = [];
    const out = await pc.buildCards(makeDb(t), VENDOR, { env: ENV });
    assert.deepStrictEqual([out.ok, out.code, out.error], [false, 'no_gallery', 'Publish a wedding page with photos to make cards from it.']);
  });
  await cell('1.3 the newest page WITH photos is a draft → not_live; no fallback to an older page (declared reading)', async () => {
    const t = s2Tables({ efdf: { visibility: 'draft' } });
    t.weddings.push({ ...t.weddings[2], id: 'old', slug: 'older', created_at: '2026-01-01T00:00:00Z' });
    t.wedding_photos.push({ id: 'phx', wedding_id: 'old', url: PHOTO_URL, public_id: 'x', position: 0, created_at: '2026-01-01T00:00:00Z' });
    const out = await pc.buildCards(makeDb(t), VENDOR, { env: ENV });
    assert.deepStrictEqual([out.ok, out.code, out.error], [false, 'not_live', 'Publish the page and get the couple\u2019s consent first.']);
  });
  await cell('1.4 published but couple_consent=false → not_live', async () => {
    const out = await pc.buildCards(makeDb(s2Tables({ efdf: { couple_consent: false } })), VENDOR, { env: ENV });
    assert.strictEqual(out.code, 'not_live');
  });
  await cell('1.5 no routing handle → no_address, the tent-card door\'s own byte', async () => {
    const out = await pc.buildCards(makeDb(s2Tables()), { ...VENDOR, routing_handle: null }, { env: ENV });
    assert.deepStrictEqual([out.code, out.error], ['no_address', 'This page has no address yet.']);
    const tent = fs.readFileSync(path.join(ROOT, 'src/api/vendor/studio/weddings.js'), 'utf8');
    assert.ok(tent.includes("'This page has no address yet.'"), 'the carried byte no longer exists at its source');
  });

  console.log('§2 · THE CAPTION (the vetoed byte, filled; nothing renders bare)');
  const page = { title: 'Wedding', city: null, venue: null };
  await cell('2.1 DEV440 today (city null): the " — {city}" clause drops with its dash', async () => {
    assert.strictEqual(pc.captionFor({ page, vendor: VENDOR }),
      'Wedding. Photographed by Dev Roy Photography. More on my page: thedreamwedding.in/v/DEV440');
  });
  await cell('2.2 city present → "{title} — {city}."', async () => {
    assert.strictEqual(pc.captionFor({ page: { ...page, city: 'Udaipur' }, vendor: VENDOR }),
      'Wedding \u2014 Udaipur. Photographed by Dev Roy Photography. More on my page: thedreamwedding.in/v/DEV440');
  });
  await cell('2.3 venue folds as "{title} at {venue}"; a title that already names it is not doubled', async () => {
    assert.strictEqual(pc.titleLine({ title: 'Priya & Arjun', venue: 'Leela Palace' }), 'Priya & Arjun at Leela Palace');
    assert.strictEqual(pc.titleLine({ title: 'Wedding at Leela Palace', venue: 'Leela Palace' }), 'Wedding at Leela Palace');
  });
  await cell('2.4 F-42.172 ruled: the role line reads by category — makeup is "Makeup by", never "Photographed by"', async () => {
    const c = pc.captionFor({ page, vendor: { ...VENDOR, category: 'makeup' } });
    assert.strictEqual(c, 'Wedding. Makeup by Dev Roy Photography. More on my page: thedreamwedding.in/v/DEV440');
    for (const [cat, verb] of [['photography', 'Photographed by'], ['decor', 'D\u00e9cor by'], ['planning', 'Planned by']]) {
      assert.strictEqual(pc.creditSentence({ business_name: 'S', category: cat }), `${verb} S`, cat);
    }
  });
  await cell('2.6 F-42.172 (a): the RAW word reads first — mehendi/mehndi/henna are "Mehendi by" though categoryFraming folds them to other', async () => {
    for (const cat of ['mehendi', 'Mehndi artist', 'henna']) {
      assert.strictEqual(pc.creditSentence({ business_name: 'S', category: cat }), 'Mehendi by S', cat);
    }
    const cf = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/categoryFraming.js'), 'utf8');
    assert.ok(/'mehendi':\s*'other'/.test(cf), 'the alias to other was touched — the ruling says it stands');
  });
  await cell('2.7 F-42.172: a category with no ruled verb falls to "By {business_name}"', async () => {
    for (const cat of ['hairstylist', 'transport', 'jewellery', null]) {
      assert.strictEqual(pc.creditSentence({ business_name: 'S', category: cat }), 'By S', String(cat));
    }
  });
  await cell('2.5 no bare placeholder across a matrix of absent slots', async () => {
    for (const city of [null, '', 'Jaipur']) for (const venue of [null, 'The Oberoi']) for (const name of [null, 'Studio X'])
      for (const category of ['photography', 'decor']) {
        const c = pc.captionFor({ page: { title: 'T', city, venue }, vendor: { ...VENDOR, business_name: name, category } });
        assert.ok(!/\{|\}|undefined|null|\u2014 \.|\.\.| \./.test(c), `bare slot in: ${c}`);
      }
  });

  console.log('§3 · THE CARDS (Cloudinary, signed, one fixed layout per kind)');
  const built = await pc.buildCards(makeDb(s2Tables()), VENDOR, { env: ENV });
  await cell('3.1 three kinds, each a signed res.cloudinary.com URL at its ruled size', async () => {
    assert.deepStrictEqual(Object.keys(built.cards), ['post', 'status', 'story']);
    for (const k of ['post', 'status', 'story']) {
      assert.ok(built.cards[k].startsWith('https://res.cloudinary.com/tdwbench/image/upload/s--'), `${k} unsigned or off-host: ${built.cards[k]}`);
    }
    assert.ok(/c_fill,g_auto,h_1080,w_1080/.test(built.cards.post), 'post is not 1:1 1080');
    assert.ok(/c_fill,g_auto,h_1920,w_1080/.test(built.cards.status), 'status is not 9:16');
    assert.ok(/c_fill,g_auto,h_1920,w_1080/.test(built.cards.story), 'story is not 9:16');
  });
  await cell('3.2 the faces are CARD_FONTS, and neither name carries an underscore (Cloudinary refuses them)', async () => {
    for (const f of Object.values(pc.CARD_FONTS)) {
      assert.ok(!f.includes('_'), f);
      assert.ok(built.cards.post.includes(`l_text:${f}_`), `${f} not used`);
    }
  });
  await cell('3.3 only the Status carries the page address (a status has no link)', async () => {
    const addr = 'thedreamwedding.in%252Fv%252FDEV440';
    assert.ok(built.cards.status.includes(addr), 'status lost its address');
    assert.ok(!built.cards.post.includes(addr) && !built.cards.story.includes(addr), 'address leaked onto post/story');
  });
  await cell('3.4 the Story lifts its lowest line clear of Instagram\'s bottom band (y ≥ 400 of 1920)', async () => {
    const ys = [...built.cards.story.matchAll(/g_south_west,x_\d+,y_(\d+)/g)].map((m) => Number(m[1]));
    assert.ok(ys.length >= 2 && Math.min(...ys) >= 400, `story ys: ${ys}`);
  });
  await cell('3.5 the photo id is read from its secure_url; the column only when the URL does not parse', async () => {
    assert.strictEqual(pc.publicIdOf({ url: PHOTO_URL, public_id: 'IMG_1-ab12cd34' }), 'weddings/v/efd/IMG_1-ab12cd34');
    assert.strictEqual(pc.publicIdOf({ url: 'not a url', public_id: 'col-id' }), 'col-id');
  });
  await cell('3.6 no Cloudinary keys → not_configured, and no URL is built', async () => {
    const out = await pc.buildCards(makeDb(s2Tables()), VENDOR, { env: {} });
    assert.deepStrictEqual([out.ok, out.code, out.cards], [false, 'not_configured', undefined]);
  });
  await cell('3.7 a comma or slash in a title reaches Cloudinary double-escaped (SDK), never splitting the layer', async () => {
    const t = s2Tables({ efdf: { title: 'Priya, Arjun / Goa' } });
    const out = await pc.buildCards(makeDb(t), VENDOR, { env: ENV });
    assert.ok(out.cards.post.includes('Priya%252C%20Arjun%20%252F%20Goa'), out.cards.post);
  });

  console.log('§4 · THE INK IS GRAPHITE, HELD TO THE SIBLING\'S theme.ts');
  await cell('4.1 every CARD_INK value equals GRAPHITE\'s token of the same name', async () => {
    const theme = fs.readFileSync(SIBLING_THEME, 'utf8');
    const i = theme.indexOf('export const GRAPHITE');
    assert.ok(i > -1, 'GRAPHITE not found in theme.ts');
    const body = theme.slice(theme.indexOf('{', i), theme.indexOf('\n};', i));
    for (const [token, hex] of Object.entries(pc.CARD_INK)) {
      const m = body.match(new RegExp(`'${token}'\\s*:\\s*'#([0-9A-Fa-f]{6})'`));
      assert.ok(m, `GRAPHITE has no '${token}'`);
      assert.strictEqual(hex.toUpperCase(), m[1].toUpperCase(), `${token}: card ${hex} vs theme ${m[1]}`);
    }
  });

  console.log('§5 · THE DOOR (drives src/api/vendor/posts.js through express)');
  const express = require('express');
  const appFor = (db, vendor) => {
    const app = express();
    app.use((req, _res, next) => { req.app.locals.supabase = db; req.vendor = vendor; next(); });
    const mod = path.join(ROOT, 'src/api/vendor/posts.js');
    for (const m of [mod, path.join(ROOT, 'src/api/middleware/requireAuth.js'), path.join(ROOT, 'src/api/middleware/resolveVendor.js')]) delete require.cache[require.resolve(m)];
    require.cache[require.resolve(path.join(ROOT, 'src/api/middleware/requireAuth.js'))] = { exports: (_q, _s, n) => n() };
    require.cache[require.resolve(path.join(ROOT, 'src/api/middleware/resolveVendor.js'))] = { exports: () => (_q, _s, n) => n() };
    app.use('/posts', require(mod));
    return app;
  };
  const get = (app, url) => new Promise((resolve) => {
    const srv = http.createServer(app).listen(0, () => {
      http.get({ port: srv.address().port, path: url }, (r) => {
        let b = ''; r.on('data', (c) => { b += c; });
        r.on('end', () => { srv.close(); let j; try { j = JSON.parse(b || '{}'); } catch { j = { _nonjson: b.slice(0, 200) }; } resolve({ status: r.statusCode, body: j }); });
      });
    });
  });
  const saved = { ...process.env };
  Object.assign(process.env, ENV);
  await cell('5.1 200 carries page, caption and three cards in the estate envelope (ok at top level)', async () => {
    const r = await get(appFor(makeDb(s2Tables()), VENDOR), '/posts/cards');
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    assert.strictEqual(r.body.ok, true);
    assert.strictEqual(r.body.page.slug, 'wedding');
    assert.ok(r.body.caption.startsWith('Wedding.'));
    assert.deepStrictEqual(Object.keys(r.body.cards), ['post', 'status', 'story']);
  });
  await cell('5.2 refusals forward the arm\'s byte with a distinct code: 404 no_gallery · 409 not_live', async () => {
    const t = s2Tables(); t.wedding_photos = [];
    const a = await get(appFor(makeDb(t), VENDOR), '/posts/cards');
    assert.deepStrictEqual([a.status, a.body.code, a.body.error], [404, 'no_gallery', pc.COPY.NO_GALLERY]);
    const b = await get(appFor(makeDb(s2Tables({ efdf: { couple_consent: false } })), VENDOR), '/posts/cards');
    assert.deepStrictEqual([b.status, b.body.code, b.body.error], [409, 'not_live', pc.COPY.NOT_LIVE]);
  });
  process.env = saved;
  await cell('5.3 AUTH IS ON THE DOOR and it is mounted — asserted against the SHIPPED SOURCE (the harness stubs both)', async () => {
    const code = strip(fs.readFileSync(path.join(ROOT, 'src/api/vendor/posts.js'), 'utf8'));
    const routes = code.match(/router\.(get|post|put|patch|delete)\(/g) || [];
    const guarded = code.match(/requireAuth, resolveVendor\(\)/g) || [];
    // 4b-2 added GET/POST /broadcast: three doors, three guards. 4b-3b adds the two
    // Sunday doors (five). AMENDED BY LABEL (R-41.121, seat R6 4b-3b): the cell
    // pinned the clock spelling `=== 3`; its meaning is EVERY door guarded, and a
    // door with no guard still reddens it — the count pair must match and grow.
    assert.ok(routes.length >= 3 && routes.length === guarded.length, `${routes.length} routes, ${guarded.length} guarded`);
    const core = strip(fs.readFileSync(path.join(ROOT, 'src/api/vendor/core.js'), 'utf8'));
    assert.ok(/router\.use\('\/posts',\s*require\('\.\/posts'\)\)/.test(core), 'not mounted at /posts');
  });
  await cell('5.4 the upload tool lives OUTSIDE scripts/ (the floor runs every scripts/*.js)', async () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'tools/upload_card_fonts.js')));
    assert.ok(!fs.readdirSync(path.join(ROOT, 'scripts')).some((f) => /upload.*font/i.test(f)));
    for (const f of ['CormorantGaramond-Medium.woff2', 'DMSans-Medium.woff2']) assert.ok(fs.existsSync(path.join(ROOT, 'tools/card_fonts', f)), f);
  });

  console.log(`\nb73 · ${PASS} GREEN · ${FAILS.length} RED${FAILS.length ? ' — ' + FAILS.join(' | ') : ''}`);
  process.exit(FAILS.length === 0 ? 0 : 1);
})().catch((e) => { console.log('ERROR ' + (e && e.stack)); process.exit(1); });
