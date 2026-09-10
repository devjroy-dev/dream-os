#!/usr/bin/env node
'use strict';
// scripts/b67_r8_date_checks_bench.js — TDW_19 G4.4 · R8-1 (F-42.11).
//
// THE CELLS THAT MATTER HERE ARE DRIVEN, NOT TEXTUAL. The acceptance is a
// behaviour — "one row per answered check, none for a refused one" — and a
// regex over `availability.js` looking for the word `insert` would pass on a
// writer wired to the wrong branch, wired after a `return`, or wired to a
// table nobody reads. So every §1 and §2 cell runs THE REAL ROUTER over an
// in-memory double and counts what actually reached `.insert()`.
//
// The double is b58's, extended in two ways and no more: it captures inserts,
// and it can be told to error a query so `describeDate`'s verify_failed path is
// reachable. Nothing about the door is restated here (the b58 lesson: a cell
// that re-implements its subject tests its own copy and stays green through
// the defect).

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const P = (n, d) => { pass++; console.log(`  GREEN  ${n}${d ? ' — ' + d : ''}`); };
const F = (n, d) => { fail++; console.log(`  RED    ${n}${d ? ' — ' + d : ''}`); };
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const codeOf = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');

const VID  = '23165e38-6510-4639-ab6a-9f35bab93742';
const CODE = 'DEV440';
const DATE = '2026-12-04';

// The founder's own fixture row, byte-for-byte b58's — the walk's date, a
// ceremony at full_day, which `verdictOf` reads as sold:true and the door
// answers as Booked. A full day still records (the kickoff's named mirror).
const SANGEET = {
  id: 'd7ae11d4-74b3-4f17-8ac5-0b918f8769c5', title: 'Sharma - sangeet',
  slot: 'full_day', kind: 'ceremony', event_time: null,
  state: 'upcoming', deleted_at: null, event_date: DATE,
};
const OPEN = {
  id: VID, status: 'active', discover_paused: false, date_check_enabled: true,
  category: 'photography', slot_capacity: null,
};

function makeDb(opts) {
  const o = opts || {};
  const inserts = [];
  const db = {
    inserts,
    from(table) {
      const f = { t: table, eqs: {}, ins: null };
      const api = {
        select() { return api; },
        eq(c, v) { f.eqs[c] = v; return api; },
        is() { return api; },
        neq() { return api; },
        in(c, v) { f.ins = { c, v }; return api; },
        // The capture. Records the TABLE as well as the row, so a writer aimed
        // at the wrong table cannot satisfy a cell counting `inserts.length`.
        insert(row) {
          inserts.push({ table: f.t, row });
          return Promise.resolve({ data: null, error: o.insertErr || null });
        },
        maybeSingle() {
          return Promise.resolve(
            f.t === 'vendors'
              ? { data: o.vendor || null, error: o.vendorErr || null }
              : { data: null, error: null },
          );
        },
        then(res) {
          if (o.queryErr) return Promise.resolve(res({ data: null, error: { message: 'boom' } }));
          let data = (o.rows || []).filter((r) => r.event_date === f.eqs.event_date
            && !r.deleted_at && r.state !== 'cancelled');
          if (f.ins) data = data.filter((r) => f.ins.v.includes(r.kind));
          return Promise.resolve(res({ data, error: null }));
        },
      };
      return api;
    },
  };
  return db;
}

// ── THE DRIVER ─────────────────────────────────────────────────────────────
// The REAL express router, invoked as express invokes it. No handler is
// reached into and no function is re-exported for the bench's convenience:
// what runs here is the mounted door, so a mutation anywhere on its path —
// a moved call, a swallowed await, a wrong branch — reddens these cells.
const router = require('../src/api/public/availability');

function drive(db, code, date, ip) {
  return new Promise((resolve, reject) => {
    const req = {
      method: 'GET', url: `/${code}/${date}`, originalUrl: `/${code}/${date}`,
      ip: ip || '203.0.113.7', headers: {}, app: { locals: { supabase: db } },
    };
    const res = {
      statusCode: 200, headers: {},
      set(k, v) { this.headers[k] = v; return this; },
      status(c) { this.statusCode = c; return this; },
      json(body) { resolve({ status: this.statusCode, body }); return this; },
    };
    router(req, res, (err) => (err ? reject(err) : resolve({ status: 404, body: null })));
  });
}

(async () => {
  console.log('\nb67 · R8-1 date_checks — dream-os\n');

  const { _resetBuckets } = require('../src/api/crew');

  // ═══ §1 · THE ANSWERED CHECK RECORDS — ONE ROW, ONE TABLE ════════════════
  {
    _resetBuckets();
    const db = makeDb({ vendor: OPEN, rows: [SANGEET] });
    const out = await drive(db, CODE, DATE);

    out.status === 200 && out.body && out.body.ok === true
      ? P('§1.1 the door answers the walk\'s date', `sold:${JSON.stringify(out.body.sold)}`)
      : F('§1.1 the door answers the walk\'s date', JSON.stringify(out));

    db.inserts.length === 1
      ? P('§1.2 ONE row per answered check', 'the acceptance, driven')
      : F('§1.2 ONE row per answered check', `${db.inserts.length} inserts: ${JSON.stringify(db.inserts)}`);

    db.inserts[0] && db.inserts[0].table === 'date_checks'
      ? P('§1.3 the row lands in `date_checks`', '0160\'s table, not another')
      : F('§1.3 the row lands in `date_checks`', JSON.stringify(db.inserts[0]));

    // A FULL DAY STILL RECORDS — the kickoff's named mirror. `verdictOf` reads
    // the founder's ceremony as sold:true; a Booked answer is an ANSWER, and
    // the demand it represents is exactly the demand a rate nudge is made of.
    db.inserts.length === 1 && out.body && out.body.sold === true
      ? P('§1.4 a check against a FULL day records', 'Booked is an answer, not a refusal')
      : F('§1.4 a check against a FULL day records', JSON.stringify({ n: db.inserts.length, sold: out.body && out.body.sold }));

    // FORK B, DRIVEN RATHER THAN PROMISED. The row carries the check and only
    // the check. A cell asserting "no phone column" in the migration would pass
    // while the writer sent an IP the table happily dropped; this asserts the
    // PAYLOAD, which is where an asker would actually leak from.
    const keys = db.inserts[0] ? Object.keys(db.inserts[0].row).sort() : [];
    JSON.stringify(keys) === JSON.stringify(['date', 'vendor_id'])
      ? P('§1.5 THE CHECK, NEVER THE ASKER', 'payload is exactly {vendor_id, date}')
      : F('§1.5 THE CHECK, NEVER THE ASKER', `payload keys [${keys.join(', ')}]`);

    db.inserts[0] && db.inserts[0].row.vendor_id === VID && db.inserts[0].row.date === DATE
      ? P('§1.6 the row names the vendor asked about and the date asked', `${VID.slice(0, 8)}… / ${DATE}`)
      : F('§1.6 the row names the vendor asked about and the date asked', JSON.stringify(db.inserts[0]));
  }

  // R-40.118 — PAST DATES ARE SERVED AND RECORDED, driven over a date behind us
  // rather than asserted from `isRealDate`'s source. A bride asking about a date
  // already gone is still demand.
  {
    _resetBuckets();
    const past = '2019-03-11';
    const db = makeDb({ vendor: OPEN, rows: [] });
    const out = await drive(db, CODE, past);
    out.status === 200 && db.inserts.length === 1 && db.inserts[0].row.date === past
      ? P('§1.7 R-40.118 — a PAST date is served and recorded', past)
      : F('§1.7 R-40.118 — a PAST date is served and recorded', JSON.stringify({ status: out.status, inserts: db.inserts }));
  }

  // ═══ §2 · EVERY REFUSAL RECORDS NOTHING ══════════════════════════════════
  // Each of these is a DIFFERENT return in the door, and each is driven, because
  // "none for a refused one" is a claim about five branches and not about one.
  {
    const cases = [
      ['§2.1 unknown handle',            { vendor: null }],
      ['§2.2 inactive vendor',           { vendor: { ...OPEN, status: 'paused' } }],
      ['§2.3 paused from the public lane', { vendor: { ...OPEN, discover_paused: true } }],
      ['§2.4 R-40.77 — the switch is OFF', { vendor: { ...OPEN, date_check_enabled: false } }],
      ['§2.5 R-40.78 — a trade with no capacity', { vendor: { ...OPEN, category: 'planning' } }],
    ];
    for (const [name, opts] of cases) {
      _resetBuckets();
      const db = makeDb({ rows: [], ...opts });
      const out = await drive(db, CODE, DATE);
      out.status === 404 && db.inserts.length === 0
        ? P(`${name} — 404, no row`, 'silence never means yes')
        : F(`${name} — 404, no row`, JSON.stringify({ status: out.status, inserts: db.inserts.length }));
    }

    // A malformed date never reaches a query, so it must never reach a row.
    _resetBuckets();
    const db = makeDb({ vendor: OPEN, rows: [] });
    const bad = await drive(db, CODE, '2026-02-31');
    bad.status === 404 && db.inserts.length === 0
      ? P('§2.6 a date that does not exist — 404, no row', '2026-02-31 round-trips to 03-03')
      : F('§2.6 a date that does not exist — 404, no row', JSON.stringify({ status: bad.status, inserts: db.inserts.length }));
  }

  // THE `vendor.id`-LESS PATH — the one line the chair asked the header to
  // carry. The `vendors` lookup errors, the door answers `blocked:null`, and
  // NOTHING is recorded, because there is no vendor identity to attribute a
  // check to. This cell exists so that a later writer moved above the lookup
  // reddens rather than inventing a row keyed on nobody.
  {
    _resetBuckets();
    const db = makeDb({ vendorErr: { message: 'connection dropped' }, rows: [] });
    const out = await drive(db, CODE, DATE);
    out.status === 200 && out.body && out.body.blocked === null && db.inserts.length === 0
      ? P('§2.7 the read failure answers `blocked:null` and records NOTHING', 'no vendor.id, no row')
      : F('§2.7 the read failure answers `blocked:null` and records NOTHING', JSON.stringify({ status: out.status, body: out.body, inserts: db.inserts.length }));
  }

  // THE LIMITER — a 429 is not a check. Driven at crew's own budget rather than
  // asserted from the constant, so a limiter moved BELOW the writer reddens.
  {
    _resetBuckets();
    // The budget is READ from crew, never restated — 30 is a number this bench
    // must not learn by heart (it is `LIMIT_IP_MISS`, a bare integer, derived).
    const { LIMIT_IP_MISS } = require('../src/api/crew');
    const db = makeDb({ vendor: OPEN, rows: [] });
    let last = null;
    for (let i = 0; i <= LIMIT_IP_MISS; i += 1) last = await drive(db, CODE, DATE, '198.51.100.4');
    last && last.status === 429 && db.inserts.length === LIMIT_IP_MISS
      ? P('§2.8 the rate-limited call records nothing', `${LIMIT_IP_MISS} answered, then 429 — ${db.inserts.length} rows`)
      : F('§2.8 the rate-limited call records nothing', JSON.stringify({ status: last && last.status, inserts: db.inserts.length, max: LIMIT_IP_MISS }));
  }

  // ═══ §3 · THE WRITE CANNOT CHANGE THE ANSWER (O-3) ═══════════════════════
  {
    _resetBuckets();
    const db = makeDb({ vendor: OPEN, rows: [SANGEET], insertErr: { message: 'permission denied' } });
    const out = await drive(db, CODE, DATE);
    out.status === 200 && out.body && out.body.ok === true && out.body.sold === true
      ? P('§3.1 a FAILED insert does not change the status code or the word', 'her answer is not our analytics\' problem')
      : F('§3.1 a FAILED insert does not change the status code or the word', JSON.stringify(out));
  }
  {
    _resetBuckets();
    const db = makeDb({ vendor: OPEN, rows: [SANGEET] });
    db.from = ((orig) => function (t) {
      if (t === 'date_checks') return { insert() { throw new Error('thrown, not returned'); } };
      return orig.call(db, t);
    })(db.from);
    let threw = false;
    const out = await drive(db, CODE, DATE).catch(() => { threw = true; return null; });
    !threw && out && out.status === 200 && out.body && out.body.ok === true
      ? P('§3.2 a THROWN insert does not become her 500', 'caught at the writer, not at asyncHandler')
      : F('§3.2 a THROWN insert does not become her 500', JSON.stringify({ threw, out }));
  }

  // ═══ §4 · F-42.47 / F-42.48 — PINNED, SO THE CURE FORCES A RE-READ ═══════
  // F-06.85's shape: O-1 rules that a resolved vendor past every gate records,
  // INCLUDING the door's fourth answer. That clause has no live effect today,
  // and these two cells hold the mechanical reason on the record so the sitting
  // that cures it cannot cure it silently. Both go RED on the cure, which is
  // the point: they are a tripwire, not an endorsement.
  {
    const { describeDate } = require('../src/lib/vendor/occupancy');
    const outs = await Promise.all([
      describeDate({}),
      describeDate({ supabase: makeDb({ queryErr: true }), vendorId: VID, date: DATE }),
      describeDate({ supabase: makeDb({ vendor: OPEN, rows: [SANGEET] }), vendorId: VID, date: DATE }),
    ]);
    // ⚠ AMENDED BY LABEL AT R8-2, NOT DELETED. The ASSERTION is unchanged and
    // still GREEN — `describeDate` still never returns falsy, and `occupancy.js`
    // was not touched. What changed is what follows from it: R8-1 recorded this
    // as the reason `if (!out)` was unreachable; R8-2 RETIRED that condition
    // with its reader, so this cell now guards the retirement instead. If a later
    // seat teaches `describeDate` to return falsy, this reddens and the door's
    // missing branch is found here rather than in production.
    outs.every((o) => o && typeof o === 'object')
      ? P('§4.1 F-42.47 — `describeDate` never returns falsy', 'which is why the door carries no `!out` branch — retired at R8-2')
      : F('§4.1 F-42.47 — `describeDate` never returns falsy', JSON.stringify(outs));

    const src41 = codeOf(read('src/api/public/availability.js'));
    !/if\s*\(\s*!out\s*\)/.test(src41)
      ? P('§4.1b F-42.47 — the dead `!out` condition is gone from the door', 'retire-with-the-reader')
      : F('§4.1b F-42.47 — the dead `!out` condition is gone from the door', 'the unreachable branch is still standing');

    // ⚠ AMENDED BY LABEL AND TIGHTENED AT R8-2. R8-1 filed this as the STATEMENT
    // of the defect: a verify_failed wears `occupancy:'off'` and the door's bare
    // gate refused it as a miss. The cure did not change what `describeDate`
    // returns — it changed what the DOOR reads off it. So this cell now pins the
    // DISCRIMINATOR the cure depends on: `blocked === null` is what separates
    // `unknown()` from `off()`, and if occupancy.js ever stopped setting it the
    // door's gate would silently start 404-ing read failures again. `reason` is
    // still asserted, but it is no longer what anything branches on.
    const vf = outs[1];
    const off42 = await describeDate({ supabase: makeDb({ vendor: { ...OPEN, category: 'planning' } }), vendorId: VID, date: DATE });
    vf && vf.blocked === null && vf.occupancy === 'off' && vf.reason === 'verify_failed'
      && off42 && off42.occupancy === 'off' && off42.blocked === false
      ? P('§4.2 F-42.48 — `blocked:null` separates a dropped read from a real refusal', 'both wear occupancy:off; only one is unknown')
      : F('§4.2 F-42.48 — `blocked:null` separates a dropped read from a real refusal', JSON.stringify({ vf, off42 }));

    // ⚠ AMENDED BY LABEL AT R8-2 — THE TRIPWIRE FIRED AND THIS IS WHAT IT NOW
    // GUARDS. R8-1 wrote this cell to assert the DEFECT (404, no row) and said in
    // its own reason that it "reddens the day the fourth answer becomes
    // reachable". That day is this one. The cell was not deleted and its subject
    // did not move: it still drives the real router over a checker whose read
    // drops. It now asserts the CURE, in all four of its parts.
    _resetBuckets();
    const db = makeDb({ vendor: OPEN, queryErr: true });
    const out = await drive(db, CODE, DATE);
    const b = out.body || {};
    out.status === 200
      && b.ok === true
      // 1. the fourth answer, not a miss — `blocked:null` is what the leaf reads.
      && b.blocked === null
      // 2. and it is `:189`'s body byte for byte, so a stranger cannot tell WHICH
      //    read dropped. `occupancy:'off'` on this wire would be a sentence about
      //    her trade that is not true and a tell that distinguishes the two.
      && b.occupancy === 'on'
      && b.sold === false && b.any_held === false
      // 3. Q3(a) — the demand was real, so the row lands.
      && db.inserts.length === 1
      && db.inserts[0].table === 'date_checks'
      // 4. and it is still the check and never the asker.
      && Object.keys(db.inserts[0].row).sort().join(',') === 'date,vendor_id'
      ? P('§4.3 F-42.48 cured, driven at the door — the fourth word AND the row', '200 blocked:null occupancy:on, one date_checks row')
      : F('§4.3 F-42.48 cured, driven at the door — the fourth word AND the row', JSON.stringify({ status: out.status, body: b, inserts: db.inserts }));
  }

  // ═══ §5 · ONE HOME (comment-stripped, R-40.105) ══════════════════════════
  {
    const src = codeOf(read('src/api/public/availability.js'));
    // ⚠ THE CELL COUNTS `.from('date_checks')`, NOT THE STRING. The first cut of
    // this cell counted the bare word and went RED at 3 — the writer's two log
    // prefixes name the table too, and they are not writers. A cell that cannot
    // tell a log line from a query is a cell that would force a real writer to
    // stop naming its table in its own error message.
    const froms = (src.match(/\.from\('date_checks'\)/g) || []).length;
    froms === 1
      ? P('§5.1 exactly ONE `.from(\'date_checks\')` in the door', 'one writer, one home')
      : F('§5.1 exactly ONE `.from(\'date_checks\')` in the door', `${froms} occurrences`);

    // ── §5.2 · TIGHTENED AT R8-2, AND THE REASON IS THAT IT WAS ABOUT TO LIE ──
    // R8-1's cell reddened on any file in `src/` that so much as NAMED the table,
    // and while the table had no reader that was a faithful proxy for the
    // sole-writer law. R8-2 ships its first reader, and the loose way out would
    // have been to add `src/lib/vendor/availability.js` to a skip list — which
    // buys the green by exempting a file from the law rather than by stating the
    // law properly. The predicate now asks the question the law actually asks:
    // does any OTHER file INSERT into this table. A reader passes; a second
    // writer reddens, wherever it hides.
    const WRITER   = 'src/api/public/availability.js';
    // ⚠ AND THE READERS ARE DECLARED BY NAME, so the cell TIGHTENS rather than
    // loosens: a third file naming `date_checks` — reader or not — reddens §5.3
    // and has to be argued into this list by the seat that adds it.
    const READERS  = ['src/lib/vendor/availability.js'];

    const namers = [], writers = [];
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) return walk(p);
      if (!/\.(js|ts)$/.test(e.name)) return;
      const rel  = path.relative(ROOT, p).split(path.sep).join('/');
      const code = codeOf(fs.readFileSync(p, 'utf8'));
      if (!/date_checks/.test(code)) return;
      if (rel !== WRITER) namers.push(rel);
      // A writer is a `.from('date_checks')` chain that reaches `.insert(`. The
      // window is the rest of the statement, so a `.insert(` on some OTHER
      // table's chain further down the file cannot be misread as this one's.
      let i = code.indexOf(".from('date_checks')");
      while (i !== -1) {
        const stmt = code.slice(i, i + 400).split(';')[0];
        if (/\.insert\s*\(/.test(stmt) && rel !== WRITER) writers.push(rel);
        i = code.indexOf(".from('date_checks')", i + 1);
      }
    });
    walk(path.join(ROOT, 'src'));

    writers.length === 0
      ? P('§5.2 no second WRITER anywhere in `src/`', 'sole-writer law, derived — readers are permitted, inserters are not')
      : F('§5.2 no second WRITER anywhere in `src/`', writers.join(', '));

    namers.slice().sort().join(',') === READERS.slice().sort().join(',')
      ? P('§5.3 the readers of `date_checks` are exactly the declared set', READERS.join(', '))
      : F('§5.3 the readers of `date_checks` are exactly the declared set', `found: ${namers.join(', ') || 'none'}`);
  }

  // ═══ §6 · 0160 · THE MIGRATION SAYS WHAT IT WRITES ═══════════════════════
  {
    const m = read('db/migrations/0160_date_checks.sql');
    /create table if not exists public\.date_checks/i.test(m)
      && /vendor_id\s+uuid not null references public\.vendors\(id\) on delete cascade/i.test(m)
      && /checked_at\s+timestamp with time zone not null default now\(\)/i.test(m)
      ? P('§6.1 0160 creates `date_checks` with the four ruled columns')
      : F('§6.1 0160 creates `date_checks` with the four ruled columns');

    /create index if not exists date_checks_vendor_checked_idx[\s\S]*?\(vendor_id, checked_at desc\)/i.test(m)
      ? P('§6.2 O-2 — the index is (vendor_id, checked_at desc)', 'the pulse is time-windowed')
      : F('§6.2 O-2 — the index is (vendor_id, checked_at desc)');

    /alter table public\.hot_dates[\s\S]*?add column if not exists source text not null default 'admin'/i.test(m)
      ? P('§6.3 Fork C — `hot_dates.source` defaults to admin', 'master :118, R-40.38')
      : F('§6.3 Fork C — `hot_dates.source` defaults to admin');

    !/check\s*\(\s*source/i.test(m)
      ? P('§6.4 O-4 — no CHECK on `source`', 'the feed\'s value does not exist yet')
      : F('§6.4 O-4 — no CHECK on `source`');

    // Fork B at the schema, not only at the payload: there is no column here
    // that COULD carry an asker, so a later writer cannot start sending one.
    !/\b(phone|ip|ip_address|session|user_agent|fingerprint|asker)\b/i.test(
      (m.match(/create table if not exists public\.date_checks[\s\S]*?\);/i) || [''])[0],
    )
      ? P('§6.5 the table has no column an asker could ride', 'Fork B in the schema')
      : F('§6.5 the table has no column an asker could ride');
  }

  // ═══ §7 · R8-2 · THE PULSE READ, DRIVEN OVER THE SHIPPED FOLD ════════════
  // The fold is imported, never restated. b58's tuition, paid once: a cell that
  // re-implements its subject tests its own copy and stays green through the
  // defect. A mutation to `datePulse` reddens every cell below.
  {
    const { datePulse, PULSE_WINDOW_DAYS, PULSE_MAX_ROWS } = require('../src/lib/vendor/availability');

    // A double that answers the pulse's ONE query and records the predicate it
    // was asked, so the window and the cap are asserted as ISSUED, not inferred
    // from the rows that came back.
    function pulseDb(rows, opts) {
      const o = opts || {};
      const seen = {};
      const api = {
        seen,
        from(t) { seen.table = t; return api; },
        select(c) { seen.select = c; return api; },
        eq(c, v) { seen[c] = v; return api; },
        gte(c, v) { seen.gteCol = c; seen.gteVal = v; return api; },
        order(c, x) { seen.orderCol = c; seen.orderDesc = x && x.ascending === false; return api; },
        limit(n) { seen.limit = n; return api; },
        then(res) {
          return Promise.resolve(res(o.err
            ? { data: null, error: { message: 'boom' } }
            : { data: rows, error: null }));
        },
      };
      return api;
    }
    const dbOf = (rows, opts) => ({ from: (t) => pulseDb(rows, opts).from(t) });

    // Three checks on 4 Dec, two on 6 Dec, one on a date already behind us.
    const R = [
      { date: '2026-12-04' }, { date: '2026-12-04' }, { date: '2026-12-04' },
      { date: '2026-12-06' }, { date: '2026-12-06' },
      { date: '2020-01-01' },
    ];

    const one = pulseDb(R);
    // ⚠ `.from(t)` IS FORWARDED, NOT SWALLOWED. The first cut of this wrapper
    // returned `one` without passing `t` through, so `seen.table` was never set
    // and §7.3 reddened on its own harness rather than on the subject — a cell
    // failing for a reason that is not the code's is a cell nobody will trust.
    const src = { from: (t) => one.from(t) };
    const p1 = await datePulse(src, VID);

    p1.ok === true
      && p1.dates.length === 3
      && p1.dates[0].date === '2026-12-04' && p1.dates[0].checks === 3
      && p1.dates[1].date === '2026-12-06' && p1.dates[1].checks === 2
      && p1.total === 6
      ? P('§7.1 the fold groups by `date` and COUNTS ROWS', 'busiest first — 3 on 04 Dec, 2 on 06 Dec')
      : F('§7.1 the fold groups by `date` and COUNTS ROWS', JSON.stringify(p1));

    // R-40.118 at the reader, not only at the writer: a date behind us is still
    // demand and is still counted. The cell names the row that proves it.
    (p1.dates || []).some((d) => d.date === '2020-01-01' && d.checks === 1)
      ? P('§7.2 R-40.118 — a PAST date is counted like any other', 'the window is on `checked_at`, never on `date`')
      : F('§7.2 R-40.118 — a PAST date is counted like any other', JSON.stringify(p1.dates));

    // The window and the cap as ISSUED. `checked_at` is WHEN SHE ASKED; keying
    // the window on `date` would be a different question with a different answer.
    const iso = /^\d{4}-\d{2}-\d{2}T/.test(one.seen.gteVal || '');
    const drift = Math.abs((Date.now() - Date.parse(one.seen.gteVal)) / 86400000 - PULSE_WINDOW_DAYS);
    one.seen.table === 'date_checks'
      && one.seen.select === 'date'                 // the asker cannot ride a wire that asks for one column
      && one.seen.vendor_id === VID
      && one.seen.gteCol === 'checked_at' && iso && drift < 0.01
      && one.seen.orderCol === 'checked_at' && one.seen.orderDesc === true
      && one.seen.limit === PULSE_MAX_ROWS && PULSE_MAX_ROWS === 1000
      ? P('§7.3 the query issued is the one 0160 indexed', 'vendor_id + checked_at >= now-7d desc, limit 1000')
      : F('§7.3 the query issued is the one 0160 indexed', JSON.stringify({ seen: one.seen, drift }));

    // ⚠ THE CAP IS DRIVEN, NOT READ OFF THE CONSTANT. `truncated` must be false
    // when the page is short and true when it is full, and the flag is ONE flag
    // for the whole response because the rows we did not read could have belonged
    // to any date — so every count becomes a floor together or none does.
    const p2 = await datePulse(dbOf(R.slice(0, 4)), VID, { limit: 4 });
    const p3 = await datePulse(dbOf(R.slice(0, 3)), VID, { limit: 4 });
    p2.truncated === true && p3.truncated === false && p1.truncated === false
      ? P('§7.4 `truncated` is one flag for the response and rises only at the cap', 'a full page is a floor, a short page is a total')
      : F('§7.4 `truncated` is one flag for the response and rises only at the cap', JSON.stringify({ p2: p2.truncated, p3: p3.truncated }));

    // An empty week is a SENTENCE the room may speak. A failed read is not.
    const p4 = await datePulse(dbOf([]), VID);
    const p5 = await datePulse(dbOf(null, { err: true }), VID);
    p4.ok === true && p4.dates.length === 0 && p4.total === 0
      && p5.ok === false && p5.dates === undefined
      ? P('§7.5 nobody-asked and could-not-look are different answers', 'the zero renders no card; the failure is a 500')
      : F('§7.5 nobody-asked and could-not-look are different answers', JSON.stringify({ p4, p5 }));

    // The route computes nothing — the b58 law, asserted textually against the
    // shipped route so a figure re-derived there in a later edit reddens here.
    const rsrc = codeOf(read('src/api/vendor/availability.js'));
    /datePulse\s*\(/.test(rsrc)
      && !/\.from\(['"]date_checks['"]\)/.test(rsrc)
      && !/reduce\s*\(|new Map\s*\(/.test(rsrc)
      ? P('§7.6 the route calls the fold and computes none of it', 'one home for the arithmetic')
      : F('§7.6 the route calls the fold and computes none of it');
  }

  // ═══ §8 · THE ROUTE ORDER IS LOAD-BEARING ════════════════════════════════
  // Express matches in declaration order and `/:vendorId` matches the literal
  // segment `pulse`. Declared below it, the pulse handler is never reached: the
  // request lands in the block-list door, resolveVendor compares her JWT's id
  // against the string 'pulse', and she gets a 403 on her own pulse with nothing
  // in any log to say why. It is a silent failure, so it gets a loud cell.
  {
    const rsrc = codeOf(read('src/api/vendor/availability.js'));
    const iPulse = rsrc.indexOf("router.get('/pulse'");
    const iParam = rsrc.indexOf("router.get('/:vendorId'");
    iPulse !== -1 && iParam !== -1 && iPulse < iParam
      ? P('§8.1 `/pulse` is declared ABOVE `/:vendorId`', 'a literal segment behind a param route is an unreachable route')
      : F('§8.1 `/pulse` is declared ABOVE `/:vendorId`', JSON.stringify({ iPulse, iParam }));

    // Mode A, and the reason is that these rows are private. A door with an id
    // in its path is a door someone eventually calls with somebody else's.
    /router\.get\('\/pulse',\s*requireAuth,\s*resolveVendor\(\)/.test(rsrc)
      ? P('§8.2 the pulse takes its vendor from the JWT and nowhere else', 'resolveVendor mode A — no paramName')
      : F('§8.2 the pulse takes its vendor from the JWT and nowhere else');
  }

  console.log(`\n${fail === 0 ? 'GREEN' : 'RED'} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
