#!/usr/bin/env node
'use strict';
// scripts/b58_g31_availability_bench.js — TDW_19 G3.1, the dream-os half.
//
// Every textual cell strips comments before asserting (`codeOf`), because this
// estate's files carry more prose than code and a cell that greps raw source
// passes on its own explanation of what it was supposed to check.
//
// The DRIVEN cells run the real `describeDate` and the real `hit` over an
// in-memory double. They are the ones that matter: a cell that reads a source
// file is answering a path question, and R-G31.1's second limb is a behaviour.

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

const VID = '23165e38-6510-4639-ab6a-9f35bab93742';

// ── THE DOUBLE ─────────────────────────────────────────────────────────────
// Returns exactly what Supabase's builder returns for the queries under test.
// It is thenable so `await q` works, and `maybeSingle` resolves separately.
function makeDb({ rows = [], vendor = null, vendorErr = null }) {
  return { from(table) {
    const f = { t: table, eqs: {}, ins: null };
    const api = {
      select() { return api; },
      eq(c, v) { f.eqs[c] = v; return api; },
      is() { return api; },
      neq() { return api; },
      in(c, v) { f.ins = { c, v }; return api; },
      maybeSingle() {
        return Promise.resolve(
          f.t === 'vendors' ? { data: vendor, error: vendorErr } : { data: null, error: null },
        );
      },
      then(res) {
        let data = rows.filter((r) => r.event_date === f.eqs.event_date
          && !r.deleted_at && r.state !== 'cancelled');
        if (f.ins) data = data.filter((r) => f.ins.v.includes(r.kind));
        return Promise.resolve(res({ data, error: null }));
      },
    };
    return api;
  } };
}

(async () => {
  console.log('\nb58 · G3.1 availability — dream-os\n');

  // ═══ §1 · THE DRIVEN CELLS — R-G31.1 over the founder's own fixture ══════
  const { describeDate } = require('../src/lib/vendor/occupancy');
  const SANGEET = {
    id: 'd7ae11d4-74b3-4f17-8ac5-0b918f8769c5', title: 'Sharma - sangeet',
    slot: 'full_day', kind: 'ceremony', event_time: null,
    state: 'upcoming', deleted_at: null, event_date: '2026-12-04',
  };
  const PHOTOG = { slot_capacity: null, category: 'photography' };

  // ⚠ THE SHIPPED ARITHMETIC, IMPORTED — NOT RESTATED. The first cut of this
  // bench re-implemented `sold` and `any_held` here and drove its own copy;
  // deleting the length guard from the route then reddened NOTHING. The cure was
  // architectural rather than a stronger regex: the route now computes nothing
  // inline and exports `verdictOf`, and these cells drive the bytes that ship.
  const { verdictOf } = require('../src/api/public/availability');
  const soldOf = (o) => verdictOf(o).sold;
  const heldOf = (o) => verdictOf(o).any_held;

  {
    const o = await describeDate({ supabase: makeDb({ rows: [SANGEET], vendor: PHOTOG }), vendorId: VID, date: '2026-12-04' });
    // THE CELL THAT EXISTS BECAUSE THE CHAIR AND THE SEAT BOTH HAD TO CHECK.
    o.blocked === false
      ? P('§1.1 the walk\'s date is NOT `blocked`', 'a ceremony is not a block — blocked:false')
      : F('§1.1 the walk\'s date is NOT `blocked`', `got ${JSON.stringify(o.blocked)}`);
    soldOf(o)
      ? P('§1.2 R-G31.1 second limb — every slot at capacity', 'sold:true → Booked')
      : F('§1.2 R-G31.1 second limb — every slot at capacity', JSON.stringify(o.slots));
    // The mutation that proves §1.2 is doing work: read `blocked` alone and the
    // walk's own date answers with the WRONG ruled word.
    (o.blocked === true) === false && heldOf(o)
      ? P('§1.3 `blocked` alone would answer "Some of the day is held"', 'the defect §1.2 prevents, demonstrated')
      : F('§1.3 `blocked` alone would answer "Some of the day is held"');
  }
  {
    const o = await describeDate({ supabase: makeDb({ rows: [], vendor: PHOTOG }), vendorId: VID, date: '2027-02-11' });
    (!soldOf(o) && !heldOf(o) && o.blocked === false)
      ? P('§1.4 an empty day is Free', 'blocked:false, sold:false, any_held:false')
      : F('§1.4 an empty day is Free', JSON.stringify(o));
  }
  {
    // Morning only, at photography's capacity of 1 — the honest middle.
    const morning = Object.assign({}, SANGEET, { slot: 'morning', id: 'x1' });
    const o = await describeDate({ supabase: makeDb({ rows: [morning], vendor: PHOTOG }), vendorId: VID, date: '2026-12-04' });
    (!soldOf(o) && heldOf(o))
      ? P('§1.5 a part-day booking is NOT Booked', 'sold:false, any_held:true → "Some of the day is held"')
      : F('§1.5 a part-day booking is NOT Booked', JSON.stringify(o.slots));
  }
  {
    // ⚠ `[].every(...)` IS TRUE. Without the length guard an occupancy-off
    // trade — slots:[] — would compute sold:true and answer Booked forever.
    const o = await describeDate({ supabase: makeDb({ rows: [], vendor: { slot_capacity: null, category: 'planning' } }), vendorId: VID, date: '2026-12-04' });
    o.occupancy === 'off'
      ? P('§1.6 a planner is occupancy:off', 'RULED_OFF — R-40.78\'s subject')
      : F('§1.6 a planner is occupancy:off', JSON.stringify(o.occupancy));
    soldOf(o) === false
      ? P('§1.7 the empty-slots guard holds', '`[].every()` is true; the length check refuses it')
      : F('§1.7 the empty-slots guard holds', 'sold:true on an empty slot list — Booked forever');
  }

  // ═══ §2 · THE DOOR'S SOURCE — consent, siting, and what never ships ══════
  const av = codeOf(read('src/api/public/availability.js'));
  /date_check_enabled\s*!==\s*true/.test(av)
    ? P('§2.1 the door enforces R-40.77 itself', 'not only the leaf — a curl gets the same nothing')
    : F('§2.1 the door enforces R-40.77 itself');
  /occupancy\s*===\s*'off'/.test(av)
    ? P('§2.2 R-40.78 refused at the door')
    : F('§2.2 R-40.78 refused at the door');
  // The leak this door exists to avoid: the SHAPE of somebody else's day.
  !/\bslots:\s*(out\.slots|slots)\b/.test(av)
    ? P('§2.3 `slots` never reaches the wire', 'three booleans, never the outline of a booking')
    : F('§2.3 `slots` never reaches the wire');
  // Three-valued honesty: a could-not-see must not be coerced to false.
  /blocked:\s*out\.blocked === null/.test(av)
    ? P('§2.4 `blocked:null` survives to the wire', 'could-not-see is never Free')
    : F('§2.4 `blocked:null` survives to the wire');
  !/(title|client|couple|assigned_member|event_time)/.test(av.replace(/require\([^)]*\)/g, ''))
    ? P('§2.5 no nameable field is read or sent')
    : F('§2.5 no nameable field is read or sent');
  {
    // Reuse, not a fourth primitive.
    const usesCrew = /require\('\.\.\/crew'\)/.test(av) && /LIMIT_IP_MISS/.test(av);
    usesCrew ? P('§2.6 crew\'s bucket reused at its own budget', 'the third instance, not a new limiter')
             : F('§2.6 crew\'s bucket reused at its own budget');
    const { hit, _resetBuckets, LIMIT_IP_MISS } = require('../src/api/crew');
    _resetBuckets();
    let last = null;
    for (let i = 0; i < LIMIT_IP_MISS + 1; i++) last = hit('availability:1.2.3.4', LIMIT_IP_MISS);
    last.allowed === false
      ? P('§2.7 the limiter actually refuses', `driven to ${LIMIT_IP_MISS + 1} — 429 at the ceiling`)
      : F('§2.7 the limiter actually refuses');
    _resetBuckets();
  }
  /router\.use\('\/public\/availability'/.test(codeOf(read('src/api/router.js')))
    ? P('§2.8 mounted on the public lane', 'beside its exposure-class siblings, never under /vendor')
    : F('§2.8 mounted on the public lane');

  // ═══ §3 · THE CARD ══════════════════════════════════════════════════════
  const vc = codeOf(read('src/api/public/vendorCard.js'));
  /'date_check_enabled',\s*'weddings',/.test(vc)
    ? P('§3.1 both new fields are on the frozen key set', 'the door grows by named field only')
    : F('§3.1 both new fields are on the frozen key set');
  /date_check_enabled: v\.date_check_enabled === true/.test(vc)
    ? P('§3.2 the switch is coerced `=== true`', 'a null is not a yes')
    : F('§3.2 the switch is coerced `=== true`');
  (/\.eq\('visibility', 'published'\)/.test(vc) && /\.eq\('couple_consent', true\)/.test(vc))
    ? P('§3.3 the weddings read uses idx_weddings_live\'s own predicate')
    : F('§3.3 the weddings read uses idx_weddings_live\'s own predicate');
  /publicWedding/.test(vc) && !/season:/.test(vc)
    ? P('§3.4 the card shapes weddings through the ONE shaper', 'no restated field list, no second season')
    : F('§3.4 the card shapes weddings through the ONE shaper');
  !/WEDDINGS_SELECT[^;]*couple_id|WEDDINGS_SELECT[^;]*consent_phone|WEDDINGS_SELECT[^;]*consent_token/.test(vc)
    ? P('§3.5 the weddings allowlist reaches no consent column')
    : F('§3.5 the weddings allowlist reaches no consent column');

  // ═══ §4 · THE SWITCH'S ONE HOME ═════════════════════════════════════════
  const me = codeOf(read('src/api/vendor/me.js'));
  /BOOLEAN_FIELDS = \[[^\]]*'date_check_enabled'/.test(me.replace(/\n\s*/g, ' '))
    ? P('§4.1 the switch is guarded as a boolean', '{"date_check_enabled":"maybe"} is a 400, never a coercion')
    : F('§4.1 the switch is guarded as a boolean');
  (me.match(/date_check_enabled/g) || []).length >= 5
    ? P('§4.2 allowlist, guard, both selects and both shapes all carry it')
    : F('§4.2 allowlist, guard, both selects and both shapes all carry it',
        `${(me.match(/date_check_enabled/g) || []).length} references`);
  {
    // No second door. The estate's rule is one home per fact.
    const others = fs.readdirSync(path.join(ROOT, 'src/api/vendor'))
      .filter((f) => f.endsWith('.js') && f !== 'me.js')
      .filter((f) => /date_check_enabled/.test(codeOf(read('src/api/vendor/' + f))));
    others.length === 0
      ? P('§4.3 no second writer anywhere under src/api/vendor')
      : F('§4.3 no second writer anywhere under src/api/vendor', others.join(', '));
  }
  {
    // ⚠ SQL COMMENTS ARE `--`, AND `codeOf` DOES NOT KNOW THAT. The first cut of
    // §4.5 grepped the raw file and reddened on the word "constraint" inside the
    // migration's own R-40.27 provenance block — the cell was reading the
    // explanation of what it was checking. That is exactly the disease `codeOf`
    // exists for, met one syntax over, so the stripper is stated here rather
    // than the assertion loosened.
    const mig = read('db/migrations/0140_date_check_switch.sql')
      .split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
    /not null default false/.test(mig)
      ? P('§4.4 the column defaults OFF', 'silence never means yes')
      : F('§4.4 the column defaults OFF');
    /add column if not exists/.test(mig) && !/drop |alter column|create index|constraint/i.test(mig)
      ? P('§4.5 additive only', 'no constraint created, dropped or re-pointed')
      : F('§4.5 additive only');
  }

  console.log(`\n${fail === 0 ? 'GREEN' : 'RED'} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
