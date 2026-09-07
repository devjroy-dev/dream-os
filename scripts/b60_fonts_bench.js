// scripts/b60_fonts_bench.js
// TDW · BLOCK 19 · G3.2 sitting 2 — R-40.112, FINAL WORDING.
//
//   A font census asserts OUTLINES from the embedded font and INK from a
//   rasteriser; a green NAMES WHICH OF THE TWO IT MEASURED.
//
// ═══ WHY THIS FILE EXISTS, AND WHY ITS FIRST TWO SHAPES WERE NOT ENOUGH ════
// F-40.232 and F-40.233 had ONE ROOT CAUSE — fontkit's woff2 transform — and two
// symptoms.
//
//   · Packet 1 certified three faces on a probe that stopped one call before
//     `doc.end()`, which is where fontkit subsets and embeds. Forty DM Sans
//     codepoints threw there: a hyphen, a semicolon, every accented letter.
//   · The first cure DECOMPOSED the composite glyphs. That cleared the symptom —
//     composites are what the transform mangles worst — and left the disease in the
//     face that was not decomposed. Cormorant embedded, produced bytes, and DREW
//     NOTHING: `pdftoppm` and PyMuPDF independently found zero dark pixels, and the
//     letterhead of every agreement would have been invisible.
//   · The census that certified it asserted A NON-EMPTY BUFFER. A PDF whose glyphs
//     are blank still has bytes.
//
// Both failures are the same mistake from the same direction: asserting the step
// before the one that matters. This file is the correction, and its two arms are
// chosen so that neither can be the whole of a green:
//
//   OUTLINES — extracts the embedded `FontFile2` from the generated PDF and asks
//     FONTKIT, pdfkit's own embedder, whether every glyph in the subset carries
//     path commands. This is not a proxy the way bytes-nonempty was: it reads the
//     bytes that actually reach the page. Pure node, runs anywhere.
//   PIXELS — rasterises and counts dark pixels. This is the couple's view, and no
//     derivation substitutes for it. Needs a rasteriser, which this repo carries no
//     manifest for, so it may be absent.
//
// ⚠ A GREEN NAMES ITS ARMS. `outlines: 676/676 · pixels: SKIPPED — no rasteriser`
// is a DECLARED PARTIAL, never a green that means more than it measured. FLOOR
// GREEN — the floor of record — requires BOTH arms and is asserted under `--check`.
// A seat container without poppler reports the partial and says so.
//
// ⚠ AND THE CELL IS ASYNC. `doc.end()` emits on the next tick; a synchronous
// `Buffer.concat` measures nothing and reds EVERYTHING — F-40.232's shape from the
// other side, and the first version of this file did exactly that.
//
// ⚠ AND IT READS THE DIRECTORY, NOT A LIST (R-40.64's shape in a bench). The face
// that breaks production is the one somebody added without adding it to the list.
'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');
const PDFDocument = require('pdfkit');
const fontkit     = require('fontkit');

const FONT_DIR = path.join(__dirname, '..', 'src', 'assets', 'fonts');
const FACE_RE  = /\.(ttf|otf|woff|woff2|ttc)$/i;
const FLOOR    = process.argv.includes('--check');

// ── THE BLANKS, DECLARED BY NAME — 22, ratified ────────────────────────────
// A codepoint that legitimately draws nothing. Anything NOT here that draws nothing
// is a defect, which is the whole point of naming them: the list is short,
// auditable, and it cannot grow silently to cover a broken face.
const BLANK_BY_DESIGN = new Map([
  [0x0009, 'TAB'], [0x000A, 'LINE FEED'], [0x000D, 'CARRIAGE RETURN'],
  [0x0020, 'SPACE'], [0x00A0, 'NO-BREAK SPACE'], [0x00AD, 'SOFT HYPHEN'],
  [0x2000, 'EN QUAD'], [0x2001, 'EM QUAD'], [0x2002, 'EN SPACE'], [0x2003, 'EM SPACE'],
  [0x2004, 'THREE-PER-EM SPACE'], [0x2005, 'FOUR-PER-EM SPACE'], [0x2006, 'SIX-PER-EM SPACE'],
  [0x2007, 'FIGURE SPACE'], [0x2008, 'PUNCTUATION SPACE'], [0x2009, 'THIN SPACE'],
  [0x200A, 'HAIR SPACE'], [0x200B, 'ZERO WIDTH SPACE'], [0x202F, 'NARROW NO-BREAK SPACE'],
  [0x205F, 'MEDIUM MATHEMATICAL SPACE'], [0x3000, 'IDEOGRAPHIC SPACE'],
  [0xFEFF, 'ZERO WIDTH NO-BREAK SPACE'],
]);

let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass += 1; console.log(`  PASS  ${label}`); }
  else      { fail += 1; console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`); }
}
function section(t) { console.log(`\n── ${t} ──`); }

// The cmap is read with FONTKIT — pdfkit's own dependency. A second parser would be
// a second opinion about what the font contains, and the one that matters is the
// embedder's.
function codepointsOf(file) {
  const f = fontkit.openSync(file);
  const font = f.fonts ? f.fonts[0] : f;
  return font.characterSet.slice().sort((a, b) => a - b);
}

// ⚠ ONE DOCUMENT, ONE CODEPOINT PER PAGE. 676 separate PDFs is minutes; one PDF of
// 676 pages is seconds, and the page index IS the codepoint index — which is what
// lets the pixels arm attribute a blank page to a codepoint rather than to a guess.
const PAGE = { size: [120, 60], margins: { top: 0, bottom: 0, left: 0, right: 0 } };
function renderAll(file, cps) {
  return new Promise((resolve) => {
    const doc = new PDFDocument(PAGE);
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   ()  => resolve({ ok: true, buf: Buffer.concat(chunks) }));
    doc.on('error', (e) => resolve({ ok: false, err: e.message }));
    try {
      doc.registerFont('X', file);
      cps.forEach((cp, i) => {
        if (i) doc.addPage(PAGE);
        doc.font('X').fontSize(28).text(String.fromCodePoint(cp), 20, 8, { lineBreak: false });
      });
      doc.end();
    } catch (e) { resolve({ ok: false, err: e.message }); }
  });
}
// A single codepoint, for attributing a throw. The batch dies whole, so when it
// throws the census falls back to one document per codepoint to NAME the offenders
// rather than report "the face throws".
function renderOne(file, cp) {
  return new Promise((resolve) => {
    const doc = new PDFDocument(PAGE);
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   ()  => resolve({ ok: true, buf: Buffer.concat(chunks) }));
    doc.on('error', (e) => resolve({ ok: false, err: e.message }));
    try {
      doc.registerFont('X', file);
      doc.font('X').fontSize(28).text(String.fromCodePoint(cp), 20, 8, { lineBreak: false });
      doc.end();
    } catch (e) { resolve({ ok: false, err: e.message }); }
  });
}

// ── ARM 1 · OUTLINES ───────────────────────────────────────────────────────
// Pull the embedded `FontFile2` back out of the PDF and read it with fontkit. These
// are the exact bytes the viewer will draw from.
function embeddedSubset(buf) {
  const s = buf.toString('latin1');
  const ref = /\/FontFile2\s+(\d+)\s+0\s+R/.exec(s);
  if (!ref) return null;
  const obj = new RegExp('(?:^|[^0-9])' + ref[1] + '\\s+0\\s+obj([\\s\\S]*?)endobj').exec(s);
  if (!obj) return null;
  const st = /stream\r?\n([\s\S]*?)\r?\nendstream/.exec(obj[1]);
  if (!st) return null;
  let raw = Buffer.from(st[1], 'latin1');
  if (/FlateDecode/.test(obj[1])) { try { raw = zlib.inflateSync(raw); } catch (e) { return null; } }
  try { return fontkit.create(raw); } catch (e) { return null; }
}
// Glyph 0 is `.notdef` and is excluded by construction: it is SUPPOSED to be empty
// in a subset, and counting it would put a permanent -1 in every result.
function glyphsWithOutline(font) {
  let drawn = 0, total = 0;
  for (let gid = 1; gid < font.numGlyphs; gid += 1) {
    total += 1;
    let n = 0;
    try { n = font.getGlyph(gid).path.commands.length; } catch (e) { n = 0; }
    if (n > 0) drawn += 1;
  }
  return { drawn, total };
}

// ── ARM 2 · PIXELS ─────────────────────────────────────────────────────────
// The couple's view. Absent is DECLARED, never silently skipped into a green.
function rasteriser() {
  for (const bin of ['pdftoppm', 'pdftocairo']) {
    try { execFileSync(bin, ['-v'], { stdio: 'ignore' }); return bin; }
    catch (e) { /* not present */ }
  }
  return null;
}
// Returns `{ dark }` per page, in page order.
//
// ⚠ RAW PGM, NOT PNG — AND THAT CHOICE IS THE WHOLE OF THIS FUNCTION'S HISTORY.
// Two versions of this arm were vacuous because they decoded PNG wrong:
//   v1 walked the inflated buffer flat and counted every PNG FILTER BYTE (0-4) as
//      ink. A blank page read 21,657 dark pixels.
//   v2 skipped the filter byte and stepped by channel — and STILL read 7,199 on a
//      blank page, because poppler emits filters 1 (Sub) and 2 (Up): the bytes are
//      DELTAS from a neighbour, not pixel values, and a white run under Sub is all
//      zeroes, every one of them below the threshold.
// Both times the arm passed a face already proved to draw nothing.
//
// `pdftoppm -gray` without `-png` writes NETPBM PGM: a five-token ASCII header and
// then one raw byte per pixel. No compression, no filters, no channel count to get
// wrong. There is nothing left to decode incorrectly, which is the point — the
// counter that keeps being wrong should stop being clever.
function darkPerPage(bin, pdfPath, tmp) {
  const prefix = path.join(tmp, 'pg');
  execFileSync(bin, ['-r', '72', '-gray', pdfPath, prefix], { stdio: 'ignore' });
  const files = fs.readdirSync(tmp).filter((n) => /^pg-\d+\.pgm$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  return files.map((n) => {
    const buf = fs.readFileSync(path.join(tmp, n));
    // Header: P5 <w> <h> <maxval>, whitespace-separated, then a single whitespace
    // byte and the raster. Comments (#) are legal and skipped.
    let i = 0; const tok = [];
    while (tok.length < 4 && i < buf.length) {
      while (i < buf.length && /\s/.test(String.fromCharCode(buf[i]))) i += 1;
      if (buf[i] === 0x23) { while (i < buf.length && buf[i] !== 0x0A) i += 1; continue; }
      let s = '';
      while (i < buf.length && !/\s/.test(String.fromCharCode(buf[i]))) { s += String.fromCharCode(buf[i]); i += 1; }
      tok.push(s);
    }
    i += 1;                                   // the single whitespace after maxval
    const [magic, w, h, maxv] = [tok[0], Number(tok[1]), Number(tok[2]), Number(tok[3])];
    if (magic !== 'P5' || maxv !== 255) return { dark: -1, why: `unsupported pgm ${magic}/${maxv}` };
    const raster = buf.slice(i);
    if (raster.length !== w * h) return { dark: -1, why: `raster ${raster.length} != ${w * h}` };
    let dark = 0;
    for (let k = 0; k < raster.length; k += 1) if (raster[k] < 200) dark += 1;
    return { dark, px: w * h };
  });
}

(async () => {
  console.log(`b60_fonts_bench — R-40.112: outlines from the embedded font, ink from a rasteriser${FLOOR ? '  [--check: FLOOR OF RECORD]' : ''}\n`);

  section('1. the directory is the census, and it is not empty');
  const faces = fs.existsSync(FONT_DIR)
    ? fs.readdirSync(FONT_DIR).filter((f) => FACE_RE.test(f)).sort() : [];
  ok('src/assets/fonts/ exists', fs.existsSync(FONT_DIR));
  // Derived, not hardcoded at three: a hardcoded count is a second home for the
  // census, and R-40.64 is that shape.
  ok('the directory declares at least one embeddable face', faces.length > 0, `found ${faces.length}`);
  console.log(`        faces: ${faces.join(', ')}`);
  // ⚠ NO woff2 SHIPS. F-40.233's root cause is fontkit's woff2 transform, and the
  // three faces are decompressed `.ttf` with the mock's own outlines and metrics.
  ok('no face ships as woff/woff2 — F-40.233 is the root cause',
     !faces.some((f) => /\.woff2?$/i.test(f)),
     faces.filter((f) => /\.woff2?$/i.test(f)).join(' '));

  section('2. every face ships its licence');
  const licences = fs.readdirSync(FONT_DIR).filter((f) => /^OFL.*\.txt$/i.test(f));
  ok('at least one OFL text is present', licences.length > 0);
  for (const family of new Set(faces.map((f) => f.split('-')[0]))) {
    ok(`${family} has an OFL beside it`,
       licences.some((l) => l.toLowerCase().includes(family.toLowerCase())));
  }

  const bin = rasteriser();

  // ── §0 · THE COUNTER PROVES ITSELF BEFORE IT MAY SPEAK ───────────────────
  // ⚠ STANDING RULE, and it exists because this arm was VACUOUS on its first
  // outing: it counted PNG filter bytes as ink, so a blank page read 21,657 dark
  // pixels and a face proved twice to draw nothing passed 230/230. A pixel counter
  // is proven by a BLANK PAGE READING ZERO before it is allowed to call anything
  // green. The mutation is the proof, not the count.
  if (bin) {
    section('0. the pixel counter is proven on a blank page (F-40.233, third instance)');
    const tmp0 = fs.mkdtempSync(path.join(os.tmpdir(), 'b60-cal-'));
    const face0 = path.join(FONT_DIR, fs.readdirSync(FONT_DIR).filter((f) => FACE_RE.test(f))[0] || '');
    // Two pages: a SPACE (blank by design) and a capital H (must draw).
    const probe = await renderAll(face0, [0x0020, 0x0048]);
    let counted = [{ dark: -1 }, { dark: -1 }];
    if (probe.ok) {
      fs.writeFileSync(path.join(tmp0, 'p.pdf'), probe.buf);
      try { counted = darkPerPage(bin, path.join(tmp0, 'p.pdf'), tmp0); } catch (e) { /* stays -1 */ }
    }
    ok('a SPACE reads exactly zero dark pixels', counted[0] && counted[0].dark === 0,
       `read ${counted[0] && counted[0].dark}`);
    ok('a capital H reads more than zero', counted[1] && counted[1].dark > 0,
       `read ${counted[1] && counted[1].dark}`);
    console.log(`        page raster: ${counted[0] && counted[0].px} px, format PGM (raw, unfiltered)`);
    try { fs.rmSync(tmp0, { recursive: true, force: true }); } catch (e) { /* best effort */ }
  }

  section(`3. EVERY codepoint of EVERY face — outlines${bin ? ' and pixels' : ', pixels SKIPPED'} (R-40.112)`);
  if (!bin) {
    console.log('        ⚠ no rasteriser (pdftoppm / pdftocairo) on PATH.');
    console.log('        The pixels arm is DECLARED SKIPPED. This run is a partial, not a green.');
  }
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'b60-'));

  for (const file of faces) {
    const full = path.join(FONT_DIR, file);
    let cps;
    try { cps = codepointsOf(full); }
    catch (e) { ok(`${file} — cmap is readable`, false, e.message); continue; }
    // Surrogate halves are not characters; String.fromCodePoint would build a lone
    // surrogate and the failure would be the test's, not the font's.
    cps = cps.filter((cp) => !(cp >= 0xD800 && cp <= 0xDFFF));

    // ── embed ────────────────────────────────────────────────────────────
    let out = await renderAll(full, cps);
    if (!out.ok) {
      // NAME the offenders rather than report "the face throws".
      const bad = [];
      for (const cp of cps) { const r = await renderOne(full, cp); if (!r.ok) bad.push(cp); }
      ok(`${file} — all ${cps.length} codepoints embed`, false,
         `${bad.length} throw: ${bad.slice(0, 12).map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0')).join(' ')}${bad.length > 12 ? ' …' : ''}`);
      continue;
    }

    // ── ARM 1 · outlines ─────────────────────────────────────────────────
    const sub = embeddedSubset(out.buf);
    if (!sub) { ok(`${file} — the embedded subset is readable`, false, 'no FontFile2 in the PDF'); continue; }
    const g = glyphsWithOutline(sub);
    const expectedBlank = cps.filter((cp) => BLANK_BY_DESIGN.has(cp)).length;
    // Every glyph in the subset must carry path commands EXCEPT the blanks the map
    // names. `.notdef` is already excluded by `glyphsWithOutline`.
    const outlinesOk = g.drawn >= (g.total - expectedBlank);
    ok(`${file} — outlines: ${g.drawn}/${g.total} glyphs carry path commands`, outlinesOk,
       outlinesOk ? '' : `${g.total - g.drawn} empty, only ${expectedBlank} are blank by design`);

    // ── ARM 2 · pixels ───────────────────────────────────────────────────
    if (!bin) {
      console.log(`        ${file} — pixels: SKIPPED — no rasteriser`);
      continue;
    }
    const tmp = fs.mkdtempSync(path.join(tmpRoot, 'f-'));
    const pdfPath = path.join(tmp, 'probe.pdf');
    fs.writeFileSync(pdfPath, out.buf);
    let counts;
    try { counts = darkPerPage(bin, pdfPath, tmp); }
    catch (e) { ok(`${file} — pixels: the rasteriser ran`, false, e.message); continue; }
    const blankPages = [];
    counts.forEach((r, i) => {
      const cp = cps[i];
      const n = r && typeof r.dark === 'number' ? r.dark : -1;
      if (n <= 0 && !BLANK_BY_DESIGN.has(cp)) blankPages.push(cp);
    });
    const inked = counts.length - blankPages.length;
    ok(`${file} — pixels: ${inked}/${counts.length} codepoints draw ink`,
       blankPages.length === 0,
       blankPages.length
         ? `${blankPages.length} draw nothing: ${blankPages.slice(0, 12).map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0')).join(' ')}${blankPages.length > 12 ? ' …' : ''}`
         : '');
    // ⚠ THE TWO ARMS MUST AGREE, AND IN ONE UNIT. The first version of this cell
    // compared CODEPOINTS (230) against GLYPHS (222) as if they were the same
    // denominator: a cmap can map several codepoints to one glyph, and a subset can
    // carry glyphs the cmap never reaches. It red on a face that draws perfectly.
    // Recast per codepoint — for each one, does the glyph it maps to carry a path,
    // and did that page draw ink — so the two arms ask the SAME question twice.
    const src = fontkit.openSync(full);
    const srcFont = src.fonts ? src.fonts[0] : src;
    const disagree = [];
    cps.forEach((cp, i) => {
      if (BLANK_BY_DESIGN.has(cp)) return;
      let hasPath = false;
      try {
        const gs = srcFont.glyphsForString(String.fromCodePoint(cp));
        hasPath = gs.length > 0 && gs[0].path.commands.length > 0;
      } catch (e) { hasPath = false; }
      const drewInk = counts[i] && counts[i].dark > 0;
      if (hasPath !== drewInk) disagree.push(cp);
    });
    ok(`${file} — the two arms agree, codepoint by codepoint`, disagree.length === 0,
       disagree.length
         ? `${disagree.length} disagree: ${disagree.slice(0, 12).map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0')).join(' ')}`
         : '');
  }
  try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (e) { /* best effort */ }

  section('4. the faces the renderer names are the faces on disk');
  // ⚠ THE RENDERER'S OWN STRINGS, not a copy of them. A census green about a
  // directory the renderer no longer points at is F-40.232's neighbour: proving the
  // thing next to the thing that matters.
  const rp = path.join(__dirname, '..', 'src', 'lib', 'contractPdf.js');
  const renderer = fs.existsSync(rp) ? fs.readFileSync(rp, 'utf8') : '';
  const named = [...renderer.matchAll(/'([A-Za-z0-9._-]+\.(?:ttf|otf|woff2?))'/g)].map((m) => m[1]);
  ok('the renderer names at least one face file', named.length > 0);
  for (const n of new Set(named)) ok(`the renderer's ${n} exists on disk`, faces.includes(n));

  // ── THE FLOOR OF RECORD ──────────────────────────────────────────────────
  const arms = bin ? 'outlines + pixels' : 'outlines only (pixels SKIPPED — no rasteriser)';
  console.log(`\nb60_fonts_bench: ${pass} GREEN  ${fail} RED   ·   arms run: ${arms}`);
  if (FLOOR && !bin) {
    console.log('\nFLOOR RED — --check is the floor of record and requires BOTH arms.');
    console.log('Install poppler (pdftoppm) and re-run. A partial is not a floor.');
    process.exit(1);
  }
  if (fail) {
    console.log('\nNON-VACUITY — the mutations this bench catches:');
    console.log('  1  restore a woff2 face                          → §1 reds, and its glyphs draw nothing');
    console.log('  2  drop an OFL text                              → §2 reds');
    console.log('  3  rename a face without touching contractPdf.js → §4 reds');
    console.log('  4  drop the await in renderAll                   → §3 reds on EVERYTHING');
    console.log('  5  add a codepoint to BLANK_BY_DESIGN to hide it → the map is 22 named entries; a 23rd is visible in the diff');
  }
  process.exit(fail ? 1 : 0);
})();
