// src/lib/papers/render.js · CE-47 · PRO · P1 · the papers as files, drawn ONLY from the frozen figures (never a fresh
// read), so a file downloaded today says exactly what its check page says. PDFs by pdfkit (already a dependency, as
// invoicePdf.js); the CA pack is that PDF plus CSV files in one ZIP (Fork 1 (a), ruled: no new package).
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const W = require('./words');
const { toCsv } = require('./csv');
const { zip } = require('./zip');

const INK = '#1d1d1f', MUTE = '#6b6b6b', RULE = '#dddad3';
function pdf(draw) {
  return new Promise((resolve, reject) => {
    try { const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Producer: 'The Dream Wedding', Creator: 'The Dream Wedding' } });
      const chunks = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
      Promise.resolve(draw(doc)).then(() => doc.end(), reject);
    } catch (e) { reject(e); }
  });
}
const qr = (url) => QRCode.toBuffer(url, { margin: 1, width: 240 });
function head(doc, title, paper) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('THE DREAM WEDDING', { characterSpacing: 1.6 });
  doc.moveDown(1.2).font('Helvetica-Bold').fontSize(22).text(title);
  doc.moveDown(0.3).font('Helvetica').fontSize(10).fillColor(MUTE).text(`Check code ${paper.check_code}  ·  Issued ${W.fullDate(paper.issued_at)}`);
  doc.moveDown(1);
}
function rows(doc, list) {
  for (const [k, v] of list) {
    const y = doc.y; doc.moveTo(56, y).lineTo(539, y).strokeColor(RULE).lineWidth(0.6).stroke();
    doc.font('Helvetica').fontSize(11).fillColor(MUTE).text(k, 56, y + 8, { width: 200 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(String(v), 256, y + 8, { width: 283, align: 'right' });
    doc.y = Math.max(doc.y, y + 26);
  }
  doc.moveTo(56, doc.y).lineTo(539, doc.y).strokeColor(RULE).lineWidth(0.6).stroke(); doc.x = 56; doc.moveDown(1);
}
async function checkBlock(doc, paper) {
  const url = W.checkUrl(paper.check_code); const y = doc.y + 8;
  doc.image(await qr(url), 56, y, { width: 84 });
  doc.font('Helvetica').fontSize(10).fillColor(MUTE).text('Anyone can check this paper at', 156, y + 18, { width: 380 });
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(url, 156, doc.y + 2, { width: 380 });
  doc.x = 56; doc.y = y + 96;
}

/** What the paper states, as label and value lines: one home for the PDF AND the check page. */
function lines(paper) {
  const f = paper.figures || {};
  const base = [['Name', f.name], ['Trade', f.trade], ['City', f.city]];
  if (paper.kind === 'certificate' || paper.kind === 'id_card') return [...base, ['Weddings on TDW', `${f.weddings_verified}, verified by TDW`]];
  const period = `${W.fullDate(paper.period_from)} to ${W.fullDate(paper.period_to)}`;
  if (paper.kind === 'statement') return [...base, ['Period', period], ['Invoices raised', String(f.invoices_raised)], ['Invoiced', W.rs(f.invoiced)], ['Received on these invoices', W.rs(f.received)]];
  return [['Name', f.name], ['Period', period]];
}
function note(paper) {
  if (paper.kind === 'statement') return W.statementNote((paper.figures || {}).name, paper.issued_at);
  if (paper.kind === 'certificate' || paper.kind === 'id_card') return W.WEDDINGS_NOTE;
  return 'Her own records from TDW for her CA: invoices, expenses with GST, and TDS, month by month.';
}

// CUT 2 · the ID's photo (R3 (b)): fetched at render from the URL kept on the paper, 5 s at most, JPEG or PNG only (what
// pdfkit draws); a Cloudinary picture is asked for as JPEG. If it cannot be had, the ID prints without it, as before.
const isImg = (b) => b && b.length > 8 && ((b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47));
async function defaultFetchImage(url) {
  const tries = [url]; if (/\/upload\//.test(url) && /res\.cloudinary\.com/.test(url)) tries.push(url.replace('/upload/', '/upload/f_jpg,w_600/'));
  for (const u of tries) {
    try { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 5000);
      const r = await fetch(u, { signal: ac.signal }); clearTimeout(t); if (!r.ok) continue;
      const b = Buffer.from(await r.arrayBuffer()); if (b.length <= 5 * 1024 * 1024 && isImg(b)) return b;
    } catch (_e) { /* next */ }
  }
  return null;
}
async function idCard(doc, paper, o) {
  const f = paper.figures || {}; const x = 56, y = doc.y, w = 483, h = 230;
  doc.roundedRect(x, y, w, h, 14).lineWidth(0.8).strokeColor(RULE).stroke();
  const img = f.photo_url && /^https:\/\//.test(f.photo_url) ? await (o.fetchImage || defaultFetchImage)(f.photo_url) : null;
  let tx = x + 24;
  if (img) { try { doc.save(); doc.roundedRect(x + 20, y + 20, 140, 180, 10).clip(); doc.image(img, x + 20, y + 20, { cover: [140, 180], align: 'center', valign: 'center' }); doc.restore(); tx = x + 180; } catch (_e) { doc.restore(); } }
  doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text(f.name || '', tx, y + 28, { width: x + w - tx - 20 });
  doc.font('Helvetica').fontSize(12).fillColor(MUTE).text(`${f.trade || ''}  ·  ${f.city || ''}`, tx, doc.y + 6, { width: x + w - tx - 20 });
  doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(`${f.weddings_verified} weddings on TDW, verified by TDW`, tx, doc.y + 14, { width: x + w - tx - 20 });
  doc.image(await qr(W.checkUrl(paper.check_code)), x + w - 96, y + h - 96, { width: 76 });
  doc.font('Helvetica').fontSize(9).fillColor(MUTE).text(paper.check_code, tx, y + h - 30, { width: 200 });
  doc.x = 56; doc.y = y + h + 18;
  return !!img;
}

async function paperPdf(paper, o = {}) {
  return pdf(async (doc) => {
    head(doc, W.KIND_TITLE[paper.kind], paper);
    if (paper.kind === 'statement' && paper.purpose) doc.font('Helvetica').fontSize(11).fillColor(MUTE).text(W.PURPOSE[paper.purpose], 56, doc.y).moveDown(0.6);
    if (paper.kind === 'id_card') await idCard(doc, paper, o); else rows(doc, lines(paper));
    doc.font('Helvetica').fontSize(10).fillColor(INK).text(note(paper), 56, doc.y, { width: 483, lineGap: 2 }).moveDown(1);
    if (paper.kind === 'ca_pack') caSummaryTable(doc, paper.figures);
    await checkBlock(doc, paper);
  });
}
function caSummaryTable(doc, f) {
  const H = ['Month', 'Invoiced', 'GST charged', 'Received', 'Spent', 'GST paid', 'TDS'];
  const X = [56, 140, 206, 272, 338, 404, 470]; const months = Object.keys(f.months || {}).sort();   // the last column ends at 536, inside the 539 margin
  doc.font('Helvetica-Bold').fontSize(9).fillColor(INK); const y0 = doc.y; H.forEach((h, i) => doc.text(h, X[i], y0, { width: i ? 66 : 84, align: i ? 'right' : 'left' }));
  doc.y = y0 + 16;
  for (const m of months) { const t = f.months[m]; const y = doc.y; doc.font('Helvetica').fontSize(9).fillColor(INK);
    [W.monthName(m), W.rs(t.invoiced), W.rs(t.gst_charged), W.rs(t.received), W.rs(t.spent), W.rs(t.gst_paid), W.rs(t.tds)].forEach((v, i) => doc.text(v, X[i], y, { width: i ? 66 : 84, align: i ? 'right' : 'left' }));
    doc.y = y + 15; if (doc.y > 760) { doc.addPage(); } }
  if (!months.length) doc.font('Helvetica').fontSize(10).fillColor(MUTE).text('No invoices, expenses or TDS entries in this period.', 56);
  doc.moveDown(1);
  doc.font('Helvetica').fontSize(9).fillColor(MUTE).text('GST input credit depends on your GST registration. Your CA confirms it. Expenses without a date are counted on the day they were added to TDW.', 56, doc.y, { width: 483 });
  doc.moveDown(1);
}

/** The CA pack ZIP: the summary PDF, summary.csv, and per month one CSV each for sales, purchases and TDS (only the
 *  months and kinds that have rows). File names are plain and sort by month. */
async function caPackZip(paper, o = {}) {
  const f = paper.figures || {}; const files = [{ name: `TDW_CA_pack_${paper.period_from}_to_${paper.period_to}.pdf`, data: await paperPdf(paper, o) }];
  const months = Object.keys(f.months || {}).sort();
  files.push({ name: 'summary.csv', data: toCsv(['Month', 'Invoiced (Rs)', 'GST charged (Rs)', 'Received (Rs)', 'Spent (Rs)', 'GST paid on purchases (Rs)', 'TDS deducted (Rs)'],
    months.map((m) => { const t = f.months[m]; return [W.monthName(m), t.invoiced, t.gst_charged, t.received, t.spent, t.gst_paid, t.tds]; })) });
  const by = (arr, m) => (arr || []).filter((x) => String(x.date).slice(0, 7) === m);
  for (const m of months) {
    const s = by(f.sales, m), p = by(f.purchases, m), d = by(f.deductions, m);
    if (s.length) files.push({ name: `${m}_sales.csv`, data: toCsv(['Date', 'Invoice number', 'Client', 'Total (Rs)', 'GST rate (%)', 'GST (Rs)', 'Received (Rs)'], s.map((x) => [W.fullDate(x.date), x.number, x.client, x.total, x.gst_rate ?? '', x.gst_amount ?? '', x.paid])) });
    if (p.length) files.push({ name: `${m}_purchases.csv`, data: toCsv(['Date', 'Category', 'Description', 'Supplier', 'Supplier GSTIN', 'Bill number', 'Value before GST (Rs)', 'GST rate (%)', 'GST (Rs)', 'Total (Rs)'], p.map((x) => [W.fullDate(x.date), x.category, x.description, x.supplier, x.supplier_gstin, x.bill_number, x.taxable ?? '', x.gst_rate ?? '', x.gst_amount ?? '', x.total])) });
    if (d.length) files.push({ name: `${m}_tds.csv`, data: toCsv(['Date', 'Client', 'Client PAN', 'Section', 'Gross (Rs)', 'TDS rate (%)', 'TDS (Rs)', 'Net received (Rs)', 'Certificate number', 'Financial year'], d.map((x) => [W.fullDate(x.date), x.client, x.pan, x.section, x.gross, x.rate, x.tds, x.net, x.certificate, x.fy])) });
  }
  return zip(files);
}

/** The file for a paper: { name, type, body }. */
async function paperFile(paper, o = {}) {
  if (paper.kind === 'ca_pack') return { name: `TDW_CA_pack_${paper.period_from}_to_${paper.period_to}.zip`, type: 'application/zip', body: await caPackZip(paper, o) };
  const slug = W.KIND_TITLE[paper.kind].replace(/\s+/g, '_');
  return { name: `TDW_${slug}_${paper.check_code}.pdf`, type: 'application/pdf', body: await paperPdf(paper, o) };
}

module.exports = { paperFile, paperPdf, caPackZip, lines, note, isImg };
