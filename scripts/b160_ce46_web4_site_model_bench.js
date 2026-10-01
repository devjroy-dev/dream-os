// scripts/b160_ce46_web4_site_model_bench.js
// TDW · CE-46 · WEB-4 cut 2 · b160 — THE SITE CONTENT MODEL: THE REGISTRY, THE CONTRAST GATE, THE LIMITS, siteModel v2, 0187.
// §1 the registry · §2 the gate's arithmetic · §3 the curated eighteen through the gate · §4 limits and prices ·
// §5 resolveSite by tier (Q6, Q7, Q10, Q11, Q13, Q14) · §6 the new-mark on shifted clocks · §7 totality ·
// §8 0187's text · §9 mutations of production code, in memory · §10 follow-up 1, corners, buttons and textures per style. No network, no database; 0187 is rehearsed by
// scripts/lib/b160r_0187_rehearse.sh. On a tree without the cut every module is absent and every cell that reads one
// is RED, never a crash: modules load through `load()`.
'use strict';
const fs = require('fs'); const path = require('path'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => { try { return fs.readFileSync(P(r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 240) + ']'}`); } }
const sec = (t) => console.log(`\n§${t}`);
function load(r) { try { const k = require.resolve(P(r)); delete require.cache[k]; return require(k); } catch { return null; } }
function freshFrom(r, src) { const m = new Module(P(r), module); m.filename = P(r); m.paths = Module._nodeModulePaths(path.dirname(P(r))); m._compile(src, P(r)); return m.exports; }
function mutate(r, from, to) { const src = read(r); if (!src.includes(from)) return { absent: true }; return freshFrom(r, src.replace(from, to)); }

const R = load('src/lib/site/styles.js') || {};
const C = load('src/lib/site/contrast.js') || {};
const L = load('src/lib/site/limits.js') || {};
const M = load('src/lib/site/siteModel.js') || {};
const MIG_NAME = (fs.readdirSync(P('db/migrations')).find((f) => /^\d{4}_site_content_model\.sql$/.test(f))) || '';
const MIG = MIG_NAME ? read('db/migrations/' + MIG_NAME) : '';
const HEXRE = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
function keysDeep(o, acc = []) { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { acc.push(k); keysDeep(v, acc); } return acc; }

sec('1  the registry: one home (Q8), every colour with its provenance (R-42.6)');
ok(() => JSON.stringify(R.STYLE_IDS) === JSON.stringify(['couture', 'noir', 'heritage', 'aurora', 'gallery', 'riviera']), '1.1 the six styles, in the design system order');
ok(() => R.PALETTES.length === 18 && R.STYLE_IDS.every((s) => R.palettesOf(s).length === 3) && new Set(R.PALETTES.map((p) => p.id)).size === 18, '1.2 eighteen curated palettes, three per style, ids unique');
ok(() => R.PALETTES.every((p) => ['ground', 'ink', 'muted', 'line', 'soft', 'accent', 'on_accent'].every((k) => typeof p.roles[k] === 'string' && p.roles[k])), '1.3 every palette carries the seven roles of design §2');
ok(() => R.PALETTES.every((p) => p.id.startsWith(p.style + '.') && p.source.startsWith('WEB-3 handoff 6d444afa3ee3 prototypes/' + p.style + '.html:')), '1.4 every palette cites WEB-3\'s handoff source for its own style, and the line (r3: fixed at source)');
ok(() => Object.keys(R.FONT_PAIRS).length === 8 && JSON.stringify(Object.values(R.FONT_PAIRS).map((f) => f.display + '/' + f.text)) === JSON.stringify(['Bodoni Moda/Inter Tight', 'Cormorant Garamond/Manrope', 'Italiana/Jost', 'Marcellus/Mulish', 'Fraunces/Plus Jakarta Sans', 'Instrument Serif/Instrument Sans', 'Gilda Display/Figtree', 'Cormorant Garamond/Figtree']), '1.5 the eight approved pairings of design §3, in its order');
const EIGHT = ['bodoni_inter_tight', 'cormorant_manrope', 'italiana_jost', 'marcellus_mulish', 'fraunces_jakarta', 'instrument_serif_sans', 'gilda_figtree', 'cormorant_figtree'];
const WEB3_MAP = { couture: [1, 2, 6], noir: [3, 1, 2], heritage: [4, 2, 8], aurora: [5, 6], gallery: [6, 1, 3], riviera: [7, 8, 2] };
ok(() => R.STYLE_IDS.every((s) => JSON.stringify(R.STYLES[s].pairs) === JSON.stringify(WEB3_MAP[s].map((n) => EIGHT[n - 1]))), '1.6 Q7: each style offers exactly WEB-3\'s pairs (read from its prototype\'s own font list), the first its default');
ok(() => ['rolling_words', 'film_grain', 'paper_texture', 'moving_sunlight'].every((l) => R.STYLE_IDS.some((s) => R.STYLES[s].layer === l)) && R.STYLES.aurora.layer === null && R.STYLES.gallery.layer === null, '1.7 the four switchable layers of design §2, none on Aurora or Gallery');
ok(() => JSON.stringify(R.TRADE_WORDS.looks) === JSON.stringify({ items: 'Looks', item: 'look', request: 'Request this look' }) && R.TRADE_WORDS.work.request === 'Ask about a similar shoot' && R.TRADE_WORDS.acts.request === 'Request this act' && R.TRADE_WORDS.events.request === 'Plan an event like this', '1.8 the trade words of design §4');
ok(() => Object.keys(M.TRADE_LOOK).every((k) => k in R.TRADE_ROW) && R.tradeRowFor('makeup') === 'looks' && R.tradeRowFor('photography') === 'work' && R.tradeRowFor('performer') === 'acts' && R.tradeRowFor('planning') === 'events' && R.tradeRowFor('nonsense') === 'looks', '1.9 every estate trade key has its row; an unknown trade reads Looks');

ok(() => R.PALETTES.every((p) => R.gatePairsFor(p.style).every(([a, b]) => { const all = { ...p.roles, ...p.extras }; return R.BASE_GATE.some((x) => x[0] === a && x[1] === b) || (a in all && b in all); })) && R.STYLES.heritage.gate.some(([a]) => a === 'atx') && R.STYLES.heritage.gate.some(([a, b, t]) => a === 'atd' && b === 'deep' && t === 4.5) && R.STYLES.riviera.gate.some(([a]) => a === 'atx') && R.BASE_GATE.some(([a, b, t]) => a === 'ink' && b === 'ground' && t === 4.5), '1.10 every style\'s own gate pairs name roles all three of its palettes hold (none silently skipped); atd on the deep band, and ink on ground (text and the heart badge) for all');

sec('2  the gate\'s arithmetic (WCAG 2.x)');
ok(() => Math.abs(C.ratio('#000000', '#ffffff') - 21) < 1e-9 && Math.abs(C.ratio('#fff', '#000') - 21) < 1e-9, '2.1 black on white is 21, either way round, short hex read');
ok(() => Math.abs(C.ratio('#777777', '#ffffff') - 4.478) < 0.002, '2.2 #777 on white is 4.48 (just under body text)', C.ratio && C.ratio('#777777', '#ffffff'));
ok(() => C.ratio('rgba(0,0,0,.5)', '#fff') === null && C.ratio('red', '#fff') === null && C.correct('#777', 'nope', 4.5) === null, '2.3 a translucent or named colour is not gated; it is reported, not guessed');
const hsl = (h) => { const x = C.parseHex(h); const mx = Math.max(...x), mn = Math.min(...x), d = mx - mn; if (!d) return [0, 0]; let hh; if (mx === x[0]) hh = ((x[1] - x[2]) / d + 6) % 6; else if (mx === x[1]) hh = (x[2] - x[0]) / d + 2; else hh = (x[0] - x[1]) / d + 4; return [hh * 60, d / (1 - Math.abs(mx + mn - 1))]; };
ok(() => { const c = C.correct('#d98b12', '#f6efe3', 3); return c.moved && c.ratio >= 3 && Math.abs(hsl(c.value)[0] - hsl('#d98b12')[0]) < 2; }, '2.4 a failing role reaches its target with its hue kept (within 2 degrees, the rounding of 8-bit channels)');
ok(() => { const c = C.correct('#0b0b0b', '#ffffff', 4.5); return c.moved === false && c.value === '#0b0b0b'; }, '2.5 a passing role is returned unchanged');
ok(() => { const r = { ink: '#777777', ground: '#ffffff', muted: '#999999', line: 'rgba(0,0,0,.1)', soft: '#eeeeee', accent: '#bbbbbb', on_accent: '#ffffff' }; const snap = JSON.stringify(r); const g = C.gatePalette(r, {}); return JSON.stringify(r) === snap && g.roles !== r && g.moved.length >= 3; }, '2.6 the gate returns copies and never edits what it was given');
ok(() => { const g = C.gatePalette({ ground: '#ffffff', accent: '#bbbbbb', on_accent: '#ffffff' }, {}); const m = g.moved.find((x) => x.against === 'on_accent'); return m && m.role === 'accent' && g.roles.on_accent === '#ffffff'; }, '2.7 a label on a button keeps its colour; the button deepens (the fill moves, not the words)');

sec('3  the curated eighteen through the gate');
const gated = (R.PALETTES || []).map((p) => ({ p, g: C.gatePalette ? C.gatePalette(p.roles, p.extras, R.gatePairsFor(p.style)) : null }));
const fails = (roles, extras, style) => ((style && R.gatePairsFor ? R.gatePairsFor(style) : C.PAIRS) || []).filter(([a, b, t]) => { const all = { ...roles, ...extras }; const r = C.ratio(all[a], all[b]); return r !== null && r < t; });
ok(() => gated.length === 18 && gated.every(({ p, g }) => fails(g.roles, g.extras, p.style).length === 0), '3.1 every palette SENT passes every pair its style holds (body 4.5, large 3, labels 4.5)', gated.filter(({ p, g }) => g && fails(g.roles, g.extras, p.style).length).map(({ p }) => p.id).join(','));
ok(() => gated.length === 18 && gated.every(({ p, g }) => g.moved.length > 0 || JSON.stringify({ ...g.roles, ...g.extras }) === JSON.stringify({ ...p.roles, ...p.extras })), '3.2 a palette that already passes is sent byte-identical to the prototype');
ok(() => gated.length === 18 && gated.every(({ g }) => g.moved.length === 0), '3.3 r3: WEB-3\'s fixed palettes need no correction; the gate moves nothing on the curated eighteen', gated.filter(({ g }) => g && g.moved.length).map(({ p }) => p.id).join(','));
ok(() => { const p = R.PALETTE_BY_ID['couture.ink']; return fails(p.roles, p.extras, 'couture').length === 0 && fails({ ...p.roles, muted: '#aaaaaa' }, p.extras, 'couture').length === 1; }, '3.4 control: the same check finds a failing role when one is planted');

sec('4  limits and prices (the Gallery lesson; Q5)');
ok(() => Object.entries(L.LIMITS).every(([k, d]) => { const at = 'a'.repeat(d.max); const over = 'a'.repeat(d.max + 1); const r1 = L.field(k, at); const r2 = L.field(k, over); return r1.ok && r1.value === at && !r2.ok && r2.error === `${d.label} can be up to ${d.max} characters.`; }), '4.1 every field: its maximum saves, one character more refuses with its plain line');
ok(() => Object.entries(L.LIMITS).filter(([, d]) => d.lines === 1).every(([k]) => !L.field(k, 'a\nb').ok) && L.field('studio_body', 'a\nb').ok, '4.2 one-line fields refuse a line break; body fields keep them');
ok(() => L.field('look_title', 'श'.repeat(60)).ok && !L.field('look_title', 'श'.repeat(61)).ok && L.field('look_title', '💍'.repeat(60)).ok, '4.3 characters are counted as a person counts them (Devanagari, emoji once each)');
ok(() => !L.field('look_title', '   ').ok && L.field('intro', '   ').ok && L.field('intro', '   ').value === null, '4.4 a required field refuses blank; an optional one reads blank as empty');
ok(() => L.list('announcement', ['a', 'b', 'c', 'd']).ok && !L.list('announcement', ['a', 'b', 'c', 'd', 'e']).ok && JSON.stringify(L.list('category', [' Bridal ', '', 'Reception']).value) === '["Bridal","Reception"]', '4.5 lists hold their count; blanks are dropped, items trimmed');
const FP = [['Rs 45,000', true, 45000], ['From Rs 1,50,000', true, 150000], ['Rs 500', true, 500], ['On request', true, null], ['', true, null],
  ['45k', false], ['Rs 45K', false], ['₹45,000', false], ['Rs 4.5 lakh', false], ['Rs 2 Cr', false], ['Rs 45000', false], ['Rs 450,000', false], ['45,000', false], ['Rs. 45,000', false], ['INR 45,000', false], ['Rs 45,000 to Rs 60,000', false], ['About 45', false]];
ok(() => FP.every(([t, good, rs]) => { const r = L.fromPrice(t); return r.ok === good && (!good || r.rupees === rs) && (good || r.error === 'Write the price as Rs 45,000.'); }), '4.6 the from price: the house form only; K, L, Cr, the rupee sign, western grouping and bare figures refused', FP.filter(([t, g]) => L.fromPrice && L.fromPrice(t).ok !== g).map(([t]) => t).join(' | '));
ok(() => L.priceWarning(['Bridal from Rs 45,000'], false) === 'Your page hides prices, but this text has a price in it, so it will show.' && L.priceWarning(['Bridal from Rs 45,000'], true) === null && L.priceWarning(['No figures here'], false) === null, '4.7 Q5: a figure in her words is warned about only when her page hides rates, and never refused');
ok(() => L.slugFrom('The Émerald Bride!', []) === 'the-emerald-bride' && L.slugFrom('The Emerald Bride', ['the-emerald-bride']) === 'the-emerald-bride-2' && L.slugFrom('!!!', []) === 'look' && L.SLUG.test(L.slugFrom('x'.repeat(200), [])), '4.8 slugs: plain, unique per vendor, never empty, always inside the column\'s CHECK');
ok(() => JSON.stringify(L.focal({ x: 120, y: -3 })) === '{"x":100,"y":0}' && JSON.stringify(L.focal(null)) === '{"x":50,"y":50}' && L.focal({ x: '33.333' }).x === 33.33, '4.9 focal points clamp to 0..100; absent or broken reads the centre');
// Each CHECK read inside its own table's block, so a page's 40-character title is never taken for a look's 60.
const TABLE_COLS = { vendor_sites: { site_name: 'site_name' }, vendor_site_pages: { title: 'page_title' }, vendor_site_sections: { eyebrow: 'section_eyebrow', heading: 'section_heading' },
  vendor_looks: { title: 'look_title', year_label: 'look_year', description: 'look_description', from_price_text: 'from_price', seo_title: 'seo_title', seo_description: 'seo_description' },
  vendor_look_photos: { caption: 'photo_caption', alt: 'photo_alt' }, vendor_collections: { name: 'collection_name', description: 'collection_text' },
  vendor_site_faq: { question: 'faq_question', answer: 'faq_answer' }, vendor_testimonials: { occasion: 'client_occasion', place: 'client_place', video_title: 'video_title' } };
function blockOf(t) { const m = MIG.match(new RegExp(`(?:CREATE TABLE|ALTER TABLE) public\\.${t}\\b[\\s\\S]*?;\\n`, 'g')); return m ? m.join('') : ''; }
const limitPairs = [];
for (const [t, cols] of Object.entries(TABLE_COLS)) for (const [col, key] of Object.entries(cols)) { const m = blockOf(t).match(new RegExp(`char_length\\(${col}\\) (?:BETWEEN 1 AND|<=) (\\d+)`)); limitPairs.push([t + '.' + col, m ? Number(m[1]) : null, L.LIMITS && L.LIMITS[key] ? L.LIMITS[key].max : undefined]); }
ok(() => limitPairs.length === 19 && limitPairs.every(([, db, code]) => db !== null && db === code), '4.10 the migration\'s CHECKs hold the same maxima as limits.js, table by table, column by column', limitPairs.filter(([, a, b]) => a !== b).map((x) => x.join(':')).join(' '));

sec('5  resolveSite by tier (the tier read, never returned)');
const site = { style: 'noir', styles_picked: ['noir', 'heritage', 'aurora', 'gallery'], palette_id: 'noir.wine', font_pair: 'italiana_jost', motion: 'cinematic', copy: {} };
const res = (tier, s, extra) => M.resolveSite({ tier, category: 'makeup', businessName: 'Studio Ivara', site: s, ...(extra || {}) });
ok(() => { const b = res('basic', site); return b.v === 'classic' && b.look === 'bloom' && b.credit === true && !('style' in b); }, '5.1 Basic keeps today\'s one-page site (v classic, her trade\'s look)');
ok(() => JSON.stringify(res('essential', site).styles_open) === '["noir","heritage"]' && res('signature', site).styles_open.length === 4 && res('prestige', site).styles_open.length === 6, '5.2 styles open: Essential 2, Signature 4, Prestige 6 (design §7)');
ok(() => { const s = { ...site, style: 'gallery' }; return JSON.stringify(res('essential', s).styles_open) === '["gallery","noir"]' && res('essential', s).style === 'gallery'; }, '5.3 Q10: on a downgrade the style in use survives, then the next of her picks in order');
ok(() => { const s = { ...site, style: 'riviera', styles_picked: ['noir', 'heritage'] }; return res('essential', s).style === 'riviera' && JSON.stringify(res('essential', s).styles_open) === '["riviera","noir"]'; }, '5.4 Q10: she swaps freely; the style she chose is always one of those open');
ok(() => { const s = { ...site, styles_picked: [], style: null }; return res('essential', s).style === 'couture' && res('essential', s).styles_open.length === 2; }, '5.5 nothing chosen: the first style, and two open for her to pick from');
ok(() => res('essential', site).palette.id === 'noir.wine' && res('essential', { ...site, palette_id: 'couture.rose' }).palette.id === 'noir.gold', '5.6 her palette only from her style\'s curated three; another style\'s falls back to the default');
ok(() => { const s = { ...site, palette_custom: { accent: '#3355ff' } }; return res('essential', s).palette.custom === false && res('signature', s).palette.custom === true && res('signature', s).palette.roles.accent !== '#e3a597'; }, '5.7 her own accent colour opens on Signature, not Essential');
ok(() => { const s = { style: 'heritage', styles_picked: ['heritage'], palette_custom: { accent: '#ffff00' } }; const p = res('signature', s).palette; return fails(p.roles, p.extras, 'heritage').length === 0 && p.extras.atx !== '#ffff00' && p.roles.accent === '#ffff00' && p.moved.some((m) => m.role === 'atx') && p.extras.atd === '#ffff00'; }, '5.8 her own colour passes the gate before it is sent (Heritage: a pale yellow stays her accent; on the paper its text form is darkened to read, on the deep band it already reads)');
ok(() => { const s = { ...site, palette_custom: { gradient: ['#ff0000', '#0000ff'] } }; return !('grad' in res('signature', s).palette.extras) && /linear-gradient/.test(res('prestige', s).palette.extras.grad); }, '5.9 gradients open on Prestige only');
ok(() => res('essential', { ...site, font_pair: 'gilda_figtree' }).font_pair.id === 'italiana_jost' && res('essential', { ...site, font_pair: 'bodoni_inter_tight' }).font_pair.id === 'bodoni_inter_tight' && res('essential', { ...site, style: 'couture', styles_picked: ['couture'], font_pair: 'instrument_serif_sans' }).font_pair.id === 'instrument_serif_sans', '5.10 Q7: only the pairs her style offers; another pair falls back to the style\'s first');
const secRows = [{ key: 'collections', shown: true, position: 5 }, { key: 'journal', shown: true }, { key: 'custom-press', shown: true, position: 55 }, { key: 'enquire', position: -10, shown: false }, { key: 'cover', position: 999 }, { key: 'faq', shown: false }, { key: 'pricing', heading: 'Rates', position: 1 }];
const shown = (t) => { try { return res(t, site, { sections: secRows }).sections.filter((x) => x.shown).map((x) => x.key); } catch { return []; } };
ok(() => !shown('essential').includes('collections') && !shown('essential').includes('journal') && shown('signature').includes('collections') && shown('signature').includes('journal'), '5.11 Q6: Collections and the Journal on Signature and Prestige; hidden below, her rows kept');
ok(() => !shown('essential').includes('custom-press') && shown('signature').includes('custom-press'), '5.12 custom sections on Signature and up');
ok(() => { const e = shown('essential'); return e[0] === 'cover' && e[e.length - 1] === 'enquire' && e.indexOf('pricing') === 1; }, '5.13 Q11: below Prestige the cover is first and the footer last whatever she stored; the middle follows her order', shown('essential').join(','));
ok(() => { const p = shown('prestige'); return p[0] === 'enquire' && p[p.length - 1] === 'cover'; }, '5.14 Prestige orders every section freely', shown('prestige').join(','));
ok(() => shown('essential').includes('enquire') && shown('prestige').includes('enquire') && !shown('essential').includes('faq'), '5.15 the footer (her enquiry) is never hidden; any middle section can be');
ok(() => res('essential', site, { sections: secRows }).sections.find((x) => x.key === 'pricing').heading === 'Rates' && res('essential', site, { sections: [{ key: 'pricing', heading: 'x'.repeat(61) }] }).sections.find((x) => x.key === 'pricing').heading === null, '5.16 a section\'s own heading is sent; one over its limit is not');
ok(() => res('essential', site).credit === true && res('signature', { ...site, credit_shown: false }).credit === true && res('prestige', { ...site, credit_shown: false }).credit === false && res('prestige', site).credit === true, '5.17 W4-b: the credit is removable on Prestige only');
// AMENDED BY LABEL, CE-47 WEB-4 cut 7 (b200): trade gains `row`, WEB-5's shape ('looks' | 'work' | 'acts' | 'events').
ok(() => JSON.stringify(res('essential', site).trade) === JSON.stringify({ items: 'Looks', item: 'look', request: 'Request this look', row: 'looks' }) && M.resolveSite({ tier: 'essential', category: 'performer', site }).trade.items === 'Acts' && M.resolveSite({ tier: 'essential', category: 'performer', site }).trade.row === 'acts', '5.18 the trade words follow her trade');
ok(() => { const s = { ...site, copy: { trade_override: { items: 'Shows', request: 'x'.repeat(33) } } }; const t = res('essential', s).trade; return t.items === 'Shows' && t.request === 'Request this look'; }, '5.19 her own trade words where they fit; one over its limit keeps the default');
ok(() => res('essential', site).site_name === 'Studio Ivara' && res('essential', { ...site, site_name: 'Ivara' }).site_name === 'Ivara' && res('essential', site).monogram === 'SI' && res('essential', { ...site, monogram: 'iv' }).monogram === 'IV', '5.20 Q13: her site name (else her business name) and the monogram from it, editable');
ok(() => ['basic', 'essential', 'signature', 'prestige', 'gold', undefined].every((t) => !keysDeep(res(t, site, { sections: secRows })).includes('tier') && !JSON.stringify(res(t, site)).includes('"prestige"') && !JSON.stringify(res(t, site)).includes('"signature"')), '5.21 no key named tier, and no tier\'s name as a value, at any depth, for any tier');
ok(() => res('gold', site).v === 'classic' && res(undefined, site).v === 'classic', '5.22 an unknown tier reads as Basic: never more than she has');
ok(() => { const a = M.capabilitiesFor('essential'), s = M.capabilitiesFor('signature'), p = M.capabilitiesFor('prestige'); return a.written_testimonials && !a.video_testimonials && s.video_testimonials && s.live_booking && !s.own_voice && p.own_voice && a.visitor_counts && !a.visitor_sources && s.visitor_sources && !s.visitor_saves && p.visitor_saves && !a.own_domain && s.own_domain; }, '5.23 design §7\'s remaining rows as capabilities for her room');
ok(() => { const r = res('prestige', site, { pages: [{ slug: 'press', title: 'Press', position: 2 }, { slug: 'Bad Slug', title: 'x' }, { slug: 'awards', title: 'Awards', position: 1, deleted_at: '2026-09-01' }] }); return JSON.stringify(r.pages) === '[{"slug":"press","title":"Press"}]' && res('signature', site, { pages: [{ slug: 'press', title: 'Press' }] }).pages.length === 0; }, '5.24 custom pages on Prestige only; a broken or deleted page never reaches the site');

sec('6  Q14 · New for 30 days, on shifted clocks (C-44.13)');
const look = (iso, mark) => ({ published_at: iso, new_mark: mark !== false });
const at = (iso) => new Date(iso);
ok(() => M.isNew(look('2026-09-30T18:29:00Z'), at('2026-10-01T00:00:00+05:30')) && M.isNew(look('2026-09-30T18:29:00Z'), at('2026-10-30T18:28:59Z')) && !M.isNew(look('2026-09-30T18:29:00Z'), at('2026-10-30T18:29:00Z')), '6.1 published before IST midnight: New the next IST day, and until exactly 30 days');
ok(() => M.isNew(look('2026-12-20T10:00:00Z'), at('2027-01-05T10:00:00Z')) && !M.isNew(look('2026-12-20T10:00:00Z'), at('2027-01-19T10:00:00Z')), '6.2 across a year\'s end');
ok(() => M.isNew(look('2028-02-10T00:00:00Z'), at('2028-03-10T23:59:59Z')) && !M.isNew(look('2028-02-10T00:00:00Z'), at('2028-03-11T00:00:00Z')), '6.3 across a leap day (29 February 2028 counts)');
ok(() => !M.isNew(look('2026-09-30T10:00:00Z', false), at('2026-10-01T10:00:00Z')) && !M.isNew({ new_mark: true }, at('2026-10-01T10:00:00Z')) && !M.isNew(look('2027-03-01T00:00:00Z'), at('2027-01-01T00:00:00Z')), '6.4 she can switch it off; a draft is never New; a future date is not New yet');

sec('7  totality: hostile values in every argument position');
const HOSTILE = [undefined, null, 0, NaN, -1, '', 'x', [], {}, [null], { a: 1 }, () => 1, Symbol('s'), 10n, new Date(NaN), { style: 'noir', styles_picked: 'noir', copy: [], palette_custom: 'x', sections: 'x' }, Object.create(null)];
ok(() => { for (const h of HOSTILE) { M.resolveSite(h); for (const k of ['tier', 'category', 'businessName', 'site', 'sections', 'pages']) M.resolveSite({ tier: 'prestige', site, [k]: h }); M.resolveSite({ tier: 'signature', site: { ...site, palette_custom: h, cover: h, copy: h, styles_picked: h } }); } return true; }, '7.1 resolveSite answers for every hostile input and never throws');
ok(() => { for (const h of HOSTILE) { C.ratio(h, '#fff'); C.ratio('#fff', h); C.correct(h, h, h); C.gatePalette(h, h); C.bestOn(h, h); } return true; }, '7.2 the gate never throws');
ok(() => { for (const h of HOSTILE) { for (const k of Object.keys(L.LIMITS)) L.field(k, h); L.field(h, 'x'); L.list('category', h); L.fromPrice(h); L.priceWarning(h, false); L.slugFrom(h, h); L.focal(h); M.monogramFor(h); M.isNew(h, h); } return true; }, '7.3 limits, monogram and the new-mark never throw');
ok(() => { const r = M.resolveSite(Symbol('s')); return r && r.v === 'classic' && r.credit === true; }, '7.4 the fallback is the least she could have: today\'s site, the credit shown');

sec('8  0187 as written');
ok(() => /^0187_site_content_model\.sql$/.test(MIG_NAME) && !/^018[56]_/.test(MIG_NAME), '8.1 the migration is 0187 (0185 and 0186 are reserved by the chair; derived at the cut)', MIG_NAME);
const created = [...MIG.matchAll(/CREATE TABLE public\.(\w+) \(/g)].map((m) => m[1]);
ok(() => created.length === 12 && created.every((t) => new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY;`).test(MIG)), '8.2 twelve tables, RLS enabled on each in the file (SEC-1)', created.join(','));
ok(() => { const g = (MIG.match(/GRANT SELECT, INSERT, UPDATE, DELETE ON([\s\S]*?)TO service_role;/) || [])[1] || ''; return created.length === 12 && created.every((t) => g.includes('public.' + t)); }, '8.3 A-45.8: the four privileges to service_role on every created table');
ok(() => /^BEGIN;$/m.test(MIG) && /^COMMIT;$/m.test(MIG) && MIG.indexOf('BEGIN;') < MIG.indexOf('ALTER TABLE public.vendor_sites') && MIG.lastIndexOf('COMMIT;') > MIG.lastIndexOf('GRANT'), '8.4 one transaction around everything');
const body = MIG.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
ok(() => MIG.length > 0 && !/\bDROP\b/i.test(body.replace(/ALTER COLUMN body DROP NOT NULL/, '')) && !/CREATE POLICY/.test(body) && !/\bDELETE FROM\b|\bTRUNCATE\b|\bUPDATE public\./i.test(body), '8.5 nothing dropped (bar body\'s NOT NULL, ruled), no policy, no data touched');
ok(() => /ADD COLUMN style\s+text CHECK \(style IS NULL OR style IN \('couture', 'noir', 'heritage', 'aurora', 'gallery', 'riviera'\)\)/.test(MIG) && R.STYLE_IDS.every((s) => MIG.includes(`'${s}'`)) && Object.keys(R.FONT_PAIRS).every((f) => MIG.includes(`'${f}'`)), '8.6 the style and pair CHECKs name exactly the registry\'s six and eight');
ok(() => /CHECK \(used_at IS NULL OR phone IS NULL\)/.test(MIG) && /expires_at\s+timestamptz NOT NULL DEFAULT \(now\(\) \+ interval '30 days'\)/.test(MIG) && /token_hash\s+text NOT NULL UNIQUE CHECK \(token_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/.test(MIG), '8.7 Q12 in the schema: 30 days, only the token\'s hash, no phone once used');
ok(() => /state\s+text NOT NULL DEFAULT 'pending'/.test(MIG) && /CHECK \(body IS NOT NULL OR video_url IS NOT NULL\)/.test(MIG), '8.8 a testimonial arrives pending, with words or a video');
ok(() => body.includes('CREATE TABLE public.site_visits_daily') && !/\b(ip|ip_address|user_agent|cookie)\b/i.test(body.slice(body.indexOf('site_visits_daily'))), '8.9 the visitor tables hold no address, agent or cookie column');
ok(() => /approval_state\s+text NOT NULL DEFAULT 'pending' CHECK \(approval_state IN \('pending', 'approved', 'rejected'\)\)/.test(MIG), '8.10 Q9: a look photo carries the portfolio\'s three approval states, pending first');

sec('9  mutations of production code, each in memory (each must turn a cell above red)');
const SM = 'src/lib/site/siteModel.js';
const m1 = mutate(SM, 'return [...new Set(order)].slice(0, n);', 'return [...new Set(order)];');
ok(() => !m1.absent && m1.resolveSite({ tier: 'essential', site }).styles_open.length === 6, '9.1 the allowance removed: Essential opens all six (5.2 reddens)');
const m2 = mutate(SM, 'const inUse = REG.STYLE_IDS.includes(s.style) ? [s.style] : [];', 'const inUse = [];');
ok(() => !m2.absent && m2.resolveSite({ tier: 'essential', site: { ...site, style: 'gallery' } }).style !== 'gallery', '9.2 the style in use not kept: a downgrade switches her style (5.3 reddens)');
const m3 = mutate(SM, 'const g = contrast.gatePalette(roles, extras, REG.gatePairsFor(style));', 'const g = { roles, extras, moved: [] };');
ok(() => { if (m3.absent) return false; const p = m3.resolveSite({ tier: 'signature', site: { style: 'heritage', styles_picked: ['heritage'], palette_custom: { accent: '#ffff00' } } }).palette; return fails(p.roles, p.extras, 'heritage').length > 0; }, '9.3 the gate removed: her pale yellow accent is sent failing (5.8 reddens)');
const m4 = mutate(SM, 'ordered = [...first, ...all.filter((a) => !a.fixed), ...last];', 'ordered = all;');
ok(() => !m4.absent && m4.resolveSite({ tier: 'essential', site, sections: secRows }).sections.filter((x) => x.shown)[0].key !== 'cover', '9.4 the fixed ends removed: below Prestige her footer can lead (5.13 reddens)');
const m5 = mutate(SM, 'return { key: a.key, custom: a.custom, allowed: a.allowed, shown: a.allowed && a.shown,', 'return { key: a.key, custom: a.custom, allowed: a.allowed, shown: a.shown,');
ok(() => !m5.absent && m5.resolveSite({ tier: 'essential', site, sections: secRows }).sections.filter((x) => x.shown).some((x) => x.key === 'collections'), '9.5 the tier filter removed: Collections show on Essential (5.11 reddens)');
const m6 = mutate(SM, "if (tierOf(tier) !== 'prestige') return true;", 'if (false) return true;');
ok(() => !m6.absent && m6.creditFor('signature', { credit_shown: false }) === false, '9.6 the Prestige-only rule removed: Signature can hide the credit (5.17 and b148 1.10 redden)');
const LM = 'src/lib/site/limits.js';
const m7 = mutate(LM, "if (chars(s) > L.max) return", 'if (false) return');
ok(() => !m7.absent && m7.field('look_title', 'a'.repeat(61)).ok === true, '9.7 the maximum check removed: a 61-character title saves (4.1 reddens)');
const m8 = mutate(LM, "|| /\\d\\s*(k|l|lakh|lakhs|lac|cr|crore)\\b/i.test(t)", '');
ok(() => !m8.absent && m8.fromPrice('Rs 45K').ok === true, '9.8 the K/L/Cr refusal removed: "Rs 45K" saves (4.6 reddens)');
const CM = 'src/lib/site/contrast.js';
const m9 = mutate(CM, "const [mv, other] = side === 'fill' ? [bgK, fgK] : [fgK, bgK];", 'const [mv, other] = [fgK, bgK];');
ok(() => !m9.absent && m9.gatePalette({ ground: '#ffffff', accent: '#bbbbbb', on_accent: '#ffffff' }, {}).roles.on_accent !== '#ffffff', '9.9 labels moved instead of fills: a white button label turns dark (2.7 reddens)');
const m10 = mutate(SM, "const NEW_DAYS = 30;", 'const NEW_DAYS = 31;');
ok(() => !m10.absent && m10.isNew(look('2026-09-30T18:29:00Z'), at('2026-10-30T18:29:00Z')), '9.10 the window widened by a day: 6.1 reddens');

const m11 = mutate(SM, 'const g = contrast.gatePalette(roles, extras, REG.gatePairsFor(style));', 'const g = contrast.gatePalette(roles, extras);');
ok(() => !m11.absent && m11.resolveSite({ tier: 'essential', site: { style: 'heritage', styles_picked: ['heritage'] } }).palette.moved.length > 0, '9.11 the style\'s own pairs dropped for the general ones: WEB-3\'s marigold is repainted though it passes where it is drawn (3.3 reddens)');

const m12 = mutate('src/lib/site/styles.js', "['atd', 'deep', 4.5, 'text'], ", '');
ok(() => { if (m12.absent) return false; const p = m12.PALETTE_BY_ID['heritage.peacock']; const all = { ...p.roles, ...p.extras, atd: '#5a4417' }; return !m12.gatePairsFor('heritage').some(([a]) => a === 'atd') && C.gatePalette(all, {}, m12.gatePairsFor('heritage')).roles.atd === '#5a4417'; }, '9.12 the atd pair removed: a dark accent-text on the maroon band is sent unread (1.10 reddens)');

sec('10  follow-up 1 · corners, buttons and textures per style (WEB-3\'s ids, the chair\'s ruling 2)');
const FIN = { couture: ['square', 'solid_ink', 'clean'], noir: ['square', 'gold_outline', 'grain'], heritage: ['arch', 'vermilion_framed', 'paper'], aurora: ['rounded', 'glow', 'clean'], gallery: ['square', 'solid_ink', 'clean'], riviera: ['postcard', 'solid', 'sunlight'] };
const fin = (tier, s) => { try { const x = M.resolveSite({ tier, category: 'makeup', site: s }); return [x.corners, x.buttons, x.texture]; } catch { return []; } };
ok(() => R.STYLE_IDS.every((st) => JSON.stringify(fin('prestige', { style: st })) === JSON.stringify(FIN[st])), '10.1 each style\'s defaults are WEB-3\'s first ids (corners, main button, texture)');
ok(() => JSON.stringify(R.FINISH.gallery.buttons) === '["solid_ink","outline","text_link","round_arrow"]' && JSON.stringify(R.FINISH.aurora.corners_proposed) === '["softer","round"]' && JSON.stringify(R.FINISH.riviera.textures) === '["sunlight","clean"]' && JSON.stringify(R.FINISH.noir.corners_proposed) === '[]', '10.2 the ids as WEB-3 listed them, proposed ones apart');
ok(() => { const re = /^[a-z_]{1,24}$/; return /corners\s+text CHECK \(corners IS NULL OR corners ~ '\^\[a-z_\]\{1,24\}\$'\)/.test(MIG) && Object.values(R.FINISH).every((f) => Object.values(f).every((ids) => ids.every((id) => re.test(id)))); }, '10.3 every id fits 0187\'s CHECK on these columns (^[a-z_]{1,24}$), so no migration moves');
ok(() => R.FINISH.couture.buttons.every((id) => !/pill|gold|glow|gradient|glass/.test(id)) && fin('prestige', { style: 'couture', button_style: 'glow' })[1] === 'solid_ink', '10.4 ruling 2: Couture offers no pill and no gradient button; another style\'s button falls back');
ok(() => { const s = { style: 'noir', styles_picked: ['noir', 'aurora'], button_style: 'hairline' }; const snap = JSON.stringify(s); const a = fin('signature', s)[1]; const b = fin('signature', { ...s, style: 'aurora' })[1]; return a === 'hairline' && b === 'glow' && fin('signature', { ...s })[1] === 'hairline' && JSON.stringify(s) === snap; }, '10.5 a choice not valid in her new style falls back to that style\'s default and is KEPT: back in Noir it returns');
ok(() => fin('prestige', { style: 'couture', corners: 'soft' })[0] === 'square' && fin('prestige', { style: 'riviera', texture: 'paper' })[2] === 'sunlight' && fin('prestige', { style: 'aurora', corners: 'round' })[0] === 'rounded', '10.6 PROPOSED ids stay closed until the chair lifts them after WEB-5\'s collision cell');
ok(() => fin('essential', { style: 'noir', styles_picked: ['noir'], texture: 'clean' })[2] === 'clean' && fin('essential', { style: 'heritage', styles_picked: ['heritage'], texture: 'clean' })[2] === 'clean' && fin('essential', { style: 'riviera', styles_picked: ['riviera'], texture: 'clean' })[2] === 'clean', '10.7 on every tier she can switch her style\'s own layer off (grain, paper, sunlight to clean)');
const LIFT = mutate(SM, 'const LIFTED = Object.freeze({});', "const LIFTED = Object.freeze({ riviera: { textures: ['paper'] }, couture: { corners: ['soft'] } });");
ok(() => !LIFT.absent && LIFT.resolveSite({ tier: 'prestige', site: { style: 'riviera', texture: 'paper' } }).texture === 'paper' && LIFT.resolveSite({ tier: 'essential', site: { style: 'riviera', styles_picked: ['riviera'], texture: 'paper' } }).texture === 'sunlight' && LIFT.resolveSite({ tier: 'essential', site: { style: 'couture', styles_picked: ['couture'], corners: 'soft' } }).corners === 'soft', '10.8 once lifted: a new texture is Prestige only (Essential keeps her style\'s layer), a lifted corner opens on every tier');
ok(() => fin('prestige', { style: 'aurora', texture: 'paper' })[2] === 'clean' && R.FINISH.aurora.textures.length === 1, '10.9 Aurora has no texture choice: its washes are the style, on every tier');
ok(() => { const H = [undefined, null, 0, 'x', [], {}, Symbol('s'), Object.create(null), { corners: {}, button_style: [], texture: 1 }]; for (const h of H) { M.finishFor('prestige', 'noir', h); M.finishFor(h, h, h); R.finishIds(h, h, h); } return true; }, '10.10 the finish resolution never throws');
const m13 = mutate(SM, 'const pick = (kind, want) => { const v = valid(kind); return v.includes(want) ? want : (v[0] || null); };', 'const pick = (kind, want) => want || (valid(kind)[0] || null);');
ok(() => !m13.absent && m13.resolveSite({ tier: 'prestige', site: { style: 'couture', button_style: 'glow' } }).buttons === 'glow', '9.13 the per-style validity removed: Couture takes Aurora\'s glow button (10.4 reddens)');
const m14 = mutate(SM, "const allowedTex = rank(tier) >= TIER_RANK.prestige ? textures : textures.filter((t) => t === dflt || t === 'clean');", 'const allowedTex = textures;');
const m14l = m14.absent ? m14 : freshFrom(SM, read(SM).replace("const allowedTex = rank(tier) >= TIER_RANK.prestige ? textures : textures.filter((t) => t === dflt || t === 'clean');", 'const allowedTex = textures;').replace('const LIFTED = Object.freeze({});', "const LIFTED = Object.freeze({ riviera: { textures: ['paper'] } });"));
ok(() => !m14.absent && m14l.resolveSite({ tier: 'essential', site: { style: 'riviera', styles_picked: ['riviera'], texture: 'paper' } }).texture === 'paper', '9.14 the Prestige gate on textures removed: Essential takes a lifted paper (10.8 reddens)');

console.log(`\nb160 ${pass} passed, ${fail} failed${fail ? ': ' + failed.join(' | ') : ''}`);
process.exit(fail ? 1 : 0);
