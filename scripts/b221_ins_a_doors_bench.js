// scripts/b221_ins_a_doors_bench.js
// TDW · CE-47 · INS-A · b221 — THE INSURANCE ROOM'S DOORS (src/lib/vendor/insuranceRoom.js), THE ROUTE FILE, THE MOUNT,
// THE PUBLIC FIELD AND THE CRON, driven against an in-memory database (a chainable fake of the supabase calls these
// doors make, and no others: an unknown call throws, so a door cannot quietly use something the fake does not model).
// §7 mutates the source in a temporary copy and requires each mutation to turn a named cell red.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const ROOT = process.env.B221_ROOT || path.join(__dirname, '..');
const read = (r) => { try { return fs.readFileSync(path.join(ROOT, r), 'utf8'); } catch { return ''; } };
let pass = 0, fail = 0; const failed = [];
const Q = !!process.env.B221_QUIET;
function ok(c, name, info) { let v = false; try { v = typeof c === 'function' ? c() : c; } catch (e) { info = 'threw: ' + e.message; }
  if (v) { pass += 1; if (!Q) console.log(`  PASS  ${name}`); } else { fail += 1; failed.push(name); if (!Q) console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 200) + ']'}`); } }
const sec = (t) => { if (!Q) console.log(`\n§${t}`); };

// ── the fake ────────────────────────────────────────────────────────────────
function fakeDb(seed) {
  const T = JSON.parse(JSON.stringify(seed)); const files = {}; const log = [];
  let n = 0; const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  function query(table) {
    const f = []; let op = 'select', payload = null, conflict = null, single = false; let order = null;
    const api = {
      select() { return api; }, order(c, o) { order = [c, o && o.ascending !== false]; return api; },
      eq(c, v) { f.push((r) => r[c] === v); return api; }, is(c, v) { f.push((r) => (r[c] ?? null) === v); return api; },
      not(c, o, v) { if (o !== 'is' || v !== null) throw new Error('fake: not() shape'); f.push((r) => (r[c] ?? null) !== null); return api; },
      gte(c, v) { f.push((r) => r[c] >= v); return api; }, lte(c, v) { f.push((r) => r[c] <= v); return api; },
      in() { throw new Error('fake: in() not modelled'); },
      insert(row) { op = 'insert'; payload = row; return api; }, update(row) { op = 'update'; payload = row; return api; },
      upsert(row, o) { op = 'upsert'; payload = row; conflict = o && o.onConflict; return api; },
      maybeSingle() { single = true; return api.then((x) => x); },
      then(res, rej) {
        try {
          T[table] = T[table] || []; let out;
          if (op === 'insert') { const r = { id: id(), deleted_at: null, confirmed_at: null, reminded_30_on: null, reminded_7_on: null, doc_path: null, doc_mime: null, ...payload }; T[table].push(r); out = [r]; }
          else if (op === 'update') { out = T[table].filter((r) => f.every((g) => g(r))); out.forEach((r) => Object.assign(r, payload)); }
          else if (op === 'upsert') { const ex = T[table].find((r) => r[conflict] === payload[conflict]); if (ex) Object.assign(ex, payload); else T[table].push({ ...payload }); out = [payload]; }
          else { out = T[table].filter((r) => f.every((g) => g(r))); if (order) out = out.slice().sort((a, b) => (a[order[0]] < b[order[0]] ? -1 : 1) * (order[1] ? 1 : -1)); }
          log.push({ table, op });
          const data = single ? (out[0] ? { ...out[0] } : null) : out.map((r) => ({ ...r }));
          return Promise.resolve({ data, error: null }).then(res, rej);
        } catch (e) { return Promise.reject(e).then(res, rej); }
      },
    };
    return api;
  }
  const storage = { from: (b) => ({
    createSignedUploadUrl: async (p) => { log.push({ bucket: b, op: 'upload-url', p }); return { data: { signedUrl: `https://x/${b}/${p}?u`, token: 't' }, error: null }; },
    download: async (p) => (files[p] ? { data: { arrayBuffer: async () => Buffer.from(files[p]) }, error: null } : { data: null, error: { message: 'nf' } }),
    createSignedUrl: async (p, s) => ({ data: { signedUrl: `https://x/${b}/${p}?s=${s}` }, error: null }),
  }) };
  return { db: { from: query, storage }, T, files, log };
}

const room = (() => { const p = path.join(ROOT, 'src/lib/vendor/insuranceRoom.js'); delete require.cache[require.resolve(p)]; return require(p); })();
const V = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', W = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NOW = () => new Date('2026-10-04T06:00:00Z');   // 11:30 am IST, 4 October 2026
const seed = () => ({ vendors: [{ id: V, business_name: 'Swati Roy Makeup', user_id: 'u1' }, { id: W, business_name: 'Other Studio', user_id: 'u2' }], users: [{ id: 'u1', phone: '+910000000220' }, { id: 'u2', phone: '+910000000221' }], vendor_policies: [], vendor_insurance_settings: [] });
const good = { insurer: 'HDFC ERGO', kind: 'equipment', cover_amount: 300000, ends_on: '2027-02-14' };

(async () => {
  sec('1  the save door: her confirmation, checked');
  const f1 = fakeDb(seed()); const d1 = { supabase: f1.db, now: NOW };
  const s1 = await room.save(V, good, d1);
  ok(() => s1.status === 200 && s1.body.policy.facts === 'HDFC ERGO · Rs 3,00,000 · ends 14 February 2027' && s1.body.policy.state === 'in_date', '1.1 a saved policy reads back in plain words, Rs and the full month', JSON.stringify(s1.body));
  ok(() => f1.T.vendor_policies.length === 1 && !!f1.T.vendor_policies[0].confirmed_at && f1.T.vendor_policies[0].vendor_id === V, '1.2 saved under her own vendor id, confirmed by the save itself');
  for (const [k, bad, word] of [['insurer', '', 'insurer'], ['kind', 'car', 'kind of cover'], ['cover_amount', 'three lakh', 'cover amount'], ['ends_on', '14/02/2027', 'date']]) {
    const r = await room.save(V, { ...good, [k]: bad }, d1);
    ok(() => r.status === 400 && r.body.error.toLowerCase().includes(word), `1.3 a bad ${k} is refused in plain words`, r.body.error);
  }
  ok(() => f1.T.vendor_policies.length === 1, '1.4 nothing refused was written');
  const other = await room.save(V, { ...good, doc_path: `${W}/11111111-1111-4111-8111-111111111111.pdf`, doc_mime: 'application/pdf' }, d1);
  ok(() => other.status === 400, '1.5 a document path in another vendor\'s folder is refused');

  sec('2  the room, the edit, the delete, the document');
  const pid = f1.T.vendor_policies[0].id;
  const r0 = await room.room(V, d1);
  ok(() => r0.status === 200 && r0.body.policies.length === 1 && r0.body.show_mark === false && r0.body.mark_showing === false && r0.body.destinations.length === 14, '2.1 the room: her policy, the switch off, the A-to-Z list');
  // AMENDED BY LABEL, INS-A r2 (ruling b): each policy row carries its plain label, each entry its fee line.
  // AMENDED BY LABEL · R-47.1 (8 October): the pins follow the plain sentences; what each cell guards is unchanged.
  ok(() => r0.body.policies[0].checked === 'You confirmed these details. TDW has not checked them.' && r0.body.destinations.every((d) => d.fee_line.endsWith('TDW takes nothing.')), '2.1b each policy says "Not checked by TDW"; each entry says TDW takes nothing');
  const rw = await room.room(W, d1);
  ok(() => rw.body.policies.length === 0, '2.3 another vendor sees none of her policies');
  f1.T.vendor_policies[0].reminded_30_on = '2026-09-01';
  const e1 = await room.save(V, { ...good, ends_on: '2027-10-14' }, d1, pid);
  ok(() => e1.status === 200 && f1.T.vendor_policies[0].ends_on === '2027-10-14' && f1.T.vendor_policies[0].reminded_30_on === null, '2.4 an edit saves and clears the reminder stamps (a renewed date reminds afresh)');
  const e2 = await room.save(W, { ...good }, { supabase: f1.db, now: NOW }, pid);
  ok(() => e2.status === 404 && f1.T.vendor_policies[0].vendor_id === V && f1.T.vendor_policies[0].ends_on === '2027-10-14', '2.5 another vendor cannot edit her policy');
  const doc0 = await room.documentUrl(V, pid, d1);
  ok(() => doc0.status === 404, '2.6 no document kept: Open document says so');
  f1.T.vendor_policies[0].doc_path = `${V}/22222222-2222-4222-8222-222222222222.pdf`;
  const doc1 = await room.documentUrl(V, pid, d1);
  ok(() => doc1.status === 200 && doc1.body.url.includes('/policies/') && doc1.body.url.endsWith('?s=600'), '2.7 her document opens by a ten-minute address from the private bucket');
  ok((await room.documentUrl(W, pid, d1)).status === 404, '2.8 never to another vendor');
  ok((await room.remove(W, pid, d1)).status === 404 && !f1.T.vendor_policies[0].deleted_at, '2.9 another vendor cannot delete it');
  ok((await room.remove(V, pid, d1)).status === 200 && !!f1.T.vendor_policies[0].deleted_at && (await room.room(V, d1)).body.policies.length === 0, '2.10 she deletes it; it leaves the room');

  sec('3  upload and read: her folder, pre-fill only');
  const f3 = fakeDb(seed()); const d3 = { supabase: f3.db, now: NOW, readPolicy: async () => ({ insurer: 'HDFC ERGO', kind: 'equipment', cover_amount: 300000, ends_on: '2027-02-14' }) };
  const u = await room.uploadUrl(V, { mime: 'application/pdf' }, d3);
  ok(() => u.status === 200 && new RegExp(`^${V}/[0-9a-f-]{36}\\.pdf$`).test(u.body.path) && f3.log.some((l) => l.bucket === 'policies'), '3.1 the upload address is in her own folder of the policies bucket');
  ok((await room.uploadUrl(V, { mime: 'application/zip' }, d3)).status === 400, '3.2 only a PDF or a photo');
  f3.files[u.body.path] = 'pdfbytes';
  const rd = await room.read(V, { path: u.body.path, mime: 'application/pdf' }, d3);
  ok(() => rd.status === 200 && rd.body.prefill.insurer === 'HDFC ERGO' && f3.T.vendor_policies.length === 0, '3.3 the read pre-fills and saves nothing');
  ok((await room.read(W, { path: u.body.path, mime: 'application/pdf' }, d3)).status === 400, '3.4 another vendor cannot have her file read');

  // AMENDED BY LABEL, INS-A r2 (ruling a): "Get a quote" and the cover brief.
  sec('3b  get a quote: her brief, from her own counts, sent by her');
  const fb = fakeDb({ ...seed(), vendors: [{ id: V, business_name: 'Swati Roy Makeup', category: 'makeup', city: 'Delhi', user_id: 'u1' }, { id: W, business_name: 'Other Studio', category: 'decor', city: 'Pune', user_id: 'u2' }],
    vendor_seal: [{ vendor_id: W, weddings: 90 }, { vendor_id: V, weddings: 14 }],   // another vendor's row first, so an unkeyed read is caught
    events: [
      { vendor_id: V, kind: 'ceremony', state: 'upcoming', deleted_at: null, event_date: '2026-11-20' },
      { vendor_id: V, kind: 'ceremony', state: 'upcoming', deleted_at: null, event_date: '2026-11-20' },   // two functions, one day
      { vendor_id: V, kind: 'ceremony', state: 'upcoming', deleted_at: null, event_date: '2027-02-14' },
      { vendor_id: V, kind: 'ceremony', state: 'upcoming', deleted_at: null, event_date: '2027-10-05' },   // beyond 12 months
      { vendor_id: V, kind: 'ceremony', state: 'cancelled', deleted_at: null, event_date: '2026-12-01' },
      { vendor_id: V, kind: 'ceremony', state: 'upcoming', deleted_at: '2026-10-01T00:00:00Z', event_date: '2026-12-02' },
      { vendor_id: V, kind: 'trial', state: 'upcoming', deleted_at: null, event_date: '2026-12-03' },
      { vendor_id: V, kind: 'ceremony', state: 'upcoming', deleted_at: null, event_date: '2026-10-03' },   // yesterday
      { vendor_id: W, kind: 'ceremony', state: 'upcoming', deleted_at: null, event_date: '2026-12-04' },
    ] });
  const qb = await room.quoteBrief(V, { insurer: 'Digit', answers: { gearValue: 400000, worksAtVenues: true }, kinds: ['equipment', 'public_liability'] }, { supabase: fb.db, now: NOW });
  ok(() => qb.status === 200 && qb.body.insurer === 'Digit' && qb.body.url === 'https://www.godigit.com' && qb.body.fee_line === "The button below opens Digit's own website. Digit sets its own price and may charge its own fees. TDW takes nothing.", '3b.1 the insurer\'s own page and its fee line', JSON.stringify(qb.body));
  ok(() => qb.body.text.startsWith('This is a cover enquiry from Swati Roy Makeup, a makeup studio in Delhi.') && qb.body.text.includes('The studio has delivered 14 weddings through The Dream Wedding'), '3b.2 her name, trade and city, and her own counted weddings (not another vendor\'s)', qb.body.text);
  ok(() => qb.body.text.includes('The studio has 2 wedding days booked in the next 12 months'), '3b.3 booked days: upcoming bookings in the next 12 months, one per date; cancelled, deleted, other kinds, past, far and other vendors\' dates left out', qb.body.text);
  ok(() => fb.log.every((l) => l.op === 'select'), '3b.4 a brief writes nothing anywhere: nothing is sent to an insurer');
  ok((await room.quoteBrief(V, { insurer: 'Some Broker' }, { supabase: fb.db, now: NOW })).status === 400, '3b.5 only a listed insurer or comparison site');

  sec('4  the switch and the public mark agree');
  const f4 = fakeDb(seed()); const d4 = { supabase: f4.db, now: NOW };
  await room.save(V, good, d4);
  ok((await room.settings(V, { show_mark: 'yes' }, d4)).status === 400, '4.1 the switch takes On or Off only');
  const on = await room.settings(V, { show_mark: true }, d4);
  ok(() => on.body.show_mark === true && on.body.mark_showing === true, '4.2 switch on with a policy in date: the room says the mark is showing');
  const pub = await room.publicMark(f4.db, V, 'Swati Roy Makeup', NOW());
  ok(() => pub && pub.until === '2027-02-14' && pub.text.startsWith('Swati Roy Makeup uploaded this policy.'), '4.3 the public door shows the same mark');
  f4.T.vendor_policies[0].ends_on = '2026-10-03';
  ok((await room.publicMark(f4.db, V, 'Swati Roy Makeup', NOW())) === null && (await room.room(V, d4)).body.mark_showing === false, '4.4 the day after it ends, both lose the mark together');

  sec('5  the renewal sweep: sent once, held when the window is shut');
  const f5 = fakeDb(seed()); const sent = [];
  f5.T.vendor_policies.push({ id: 'p1', vendor_id: V, kind: 'public_liability', insurer: 'ICICI Lombard', cover_amount: 1000000, ends_on: '2026-11-02', confirmed_at: 'x', deleted_at: null, reminded_30_on: null, reminded_7_on: null });
  f5.T.vendor_policies.push({ id: 'p2', vendor_id: W, kind: 'equipment', insurer: 'Digit', cover_amount: 200000, ends_on: '2026-10-09', confirmed_at: 'x', deleted_at: null, reminded_30_on: '2026-09-10', reminded_7_on: null });
  f5.T.vendor_policies.push({ id: 'p3', vendor_id: V, kind: 'equipment', insurer: 'Digit', cover_amount: 200000, ends_on: '2026-10-20', confirmed_at: null, deleted_at: null });
  const sd = { now: NOW, sendWhatsApp: async (to, text) => { sent.push({ to, text }); return { sid: 's' }; }, vendorWindowOpen: async (_s, vid) => ({ open: vid === V }) };
  const a = await room.runRenewalSweep(f5.db, sd);
  ok(() => a.sent === 1 && a.held === 1 && sent.length === 1 && sent[0].to === '+910000000220' && sent[0].text.includes('ends on 2 November 2026'), '5.1 her window open: her 30-day reminder goes; the shut window is held, not sent', JSON.stringify(a));
  ok(() => f5.T.vendor_policies[0].reminded_30_on === '2026-10-04' && f5.T.vendor_policies[1].reminded_7_on === null, '5.2 stamped only when sent');
  const b = await room.runRenewalSweep(f5.db, sd);
  ok(() => b.sent === 0 && sent.length === 1, '5.3 the next run sends nothing twice');
  ok(() => !sent.some((s) => s.text.includes('Digit')), '5.4 an unconfirmed policy never reminds');

  sec('6  the wiring: route, mount, public field, cron');
  const RT = read('src/api/vendor/solutions/insurance.js');
  for (const [m, p, fn] of [['get', "'/'", 'room.room'], ['post', "'/kinds'", 'room.kinds'], ['post', "'/quote-brief'", 'room.quoteBrief'], ['post', "'/policies/upload-url'", 'room.uploadUrl'], ['post', "'/policies/read'", 'room.read'], ['post', "'/policies'", 'room.save'], ['patch', "'/policies/:id'", 'room.save'], ['delete', "'/policies/:id'", 'room.remove'], ['get', "'/policies/:id/document'", 'room.documentUrl'], ['patch', "'/settings'", 'room.settings']]) {
    ok(() => new RegExp(`router\\.${m}\\(${p.replace(/[/:.]/g, (c) => '\\' + c)}, \\.\\.\\.door\\(`).test(RT) && RT.includes(fn), `6.1 ${m.toUpperCase()} ${p} → ${fn}`);
  }
  ok(() => /const door = \(fn\) => \[requireAuth, resolveVendor\(\),/.test(RT), '6.2 every door signs in and resolves her vendor');
  // AMENDED BY LABEL, INS-A r2: the quote-brief door makes nine vendor-keyed doors (was eight).
  ok(() => (RT.match(/req\.vendor\.id/g) || []).length === 9, '6.3 every vendor door is keyed on her own vendor id');
  ok(() => /router\.use\('\/insurance', require\('\.\/insurance'\)\);/.test(read('src/api/vendor/solutions/index.js')), '6.4 mounted under Business Solutions');
  const VC = read('src/api/public/vendorCard.js');
  ok(() => /'insured',\n\]\);/.test(VC) && /insured:\s+insured \|\| null/.test(VC) && /publicMark\(supabase, v\.id, v\.business_name\)/.test(VC), '6.5 the public card carries `insured`, decided by the server, null when unproven');
  const CR = read('src/cron.js');
  ok(() => /cron\.schedule\('0 10 \* \* \*'[\s\S]{0,200}runRenewalSweep\(supabase\)[\s\S]{0,200}timezone: 'Asia\/Kolkata'/.test(CR), '6.6 the sweep runs at 10:00 am IST, with production\'s own send door');

  if (!process.env.B221_ROOT) {
    sec('7  mutations, each must turn a named cell red');
    const MUT = [
      ['the edit ignores her vendor id', 'src/lib/vendor/insuranceRoom.js', ".eq('id', id).eq('vendor_id', vendorId).is('deleted_at', null)\n", ".eq('id', id).is('deleted_at', null)\n", '2.5'],
      ['the sweep stamps a held reminder', 'src/lib/vendor/insuranceRoom.js', "if (!(w && w.open === true)) { held += 1; continue; }", "if (!(w && w.open === true)) { held += 1; await supabase.from('vendor_policies').update({ reminded_7_on: t }).eq('id', p.id); continue; }", '5.2'],
      ['any folder accepted', 'src/lib/vendor/insuranceRoom.js', 'new RegExp(`^${vendorId}/', 'new RegExp(`^[0-9a-f-]+/', '1.5'],
      ['the switch takes any value', 'src/lib/vendor/insuranceRoom.js', "typeof body.show_mark !== 'boolean'", 'body.show_mark === undefined', '4.1'],
      // AMENDED BY LABEL, INS-A r2: the booked-days count must keep to bookings.
      ['booked days count every kind', 'src/lib/vendor/insuranceRoom.js', ".eq('kind', 'ceremony').eq('state', 'upcoming')", ".eq('state', 'upcoming')", '3b.3'],
      ['the brief reads another vendor\'s seal', 'src/lib/vendor/insuranceRoom.js', "from('vendor_seal').select('weddings').eq('vendor_id', vendorId)", "from('vendor_seal').select('weddings')", '3b.2'],
      ['the document address lives an hour', 'src/lib/vendor/insuranceRoom.js', 'createSignedUrl(p.doc_path, 600)', 'createSignedUrl(p.doc_path, 3600)', '2.7'],
    ];
    for (const [name, file, from, to, cell] of MUT) {
      const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'b221-'));
      for (const d of ['src/lib/vendor', 'src/api/vendor/solutions', 'src/api/public']) fs.mkdirSync(path.join(tmp, d), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'src/agent'), { recursive: true });
      for (const f of ['src/lib/vendor/insurance.js', 'src/lib/vendor/insuranceRoom.js', 'src/lib/vendor/policyRead.js', 'src/lib/vendor/categoryFraming.js', 'src/agent/categories.js', 'src/lib/format.js', 'src/lib/istDay.js', 'src/api/vendor/solutions/insurance.js', 'src/api/vendor/solutions/index.js', 'src/api/public/vendorCard.js', 'src/cron.js']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
      const src = fs.readFileSync(path.join(tmp, file), 'utf8');
      if (!src.includes(from)) { ok(false, `7 · ${name}: the mutation's anchor is present`); continue; }
      fs.writeFileSync(path.join(tmp, file), src.replace(from, to));
      const r = require('child_process').spawnSync(process.execPath, [__filename], { env: { ...process.env, B221_ROOT: tmp, B221_QUIET: '1', B221_WANT: cell }, encoding: 'utf8' });
      ok(() => r.stdout.includes(`RED ${cell}`), `7 · ${name} → §${cell} red`, (r.stdout || r.stderr).slice(-200));
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (process.env.B221_WANT) { const hit = failed.find((n) => n.startsWith(process.env.B221_WANT + ' ')); console.log(hit ? `RED ${process.env.B221_WANT}` : 'NOT RED'); process.exit(0); }
  console.log(`\nb221 · ${pass} PASS · ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('b221 threw:', e && e.stack); process.exit(1); });
