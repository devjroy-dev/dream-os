#!/usr/bin/env node
'use strict';
// scripts/b68_introductions_bench.js — R9-J1 · INTRODUCTIONS. CE-42 seat E2, 4a.
// Runnable from any working directory, clean clone, no network, no keys:
//   node scripts/b68_introductions_bench.js
//
// Bench number RE-DERIVED at 09317d6, after R8-1 landed:
//   `ls scripts/ | grep -E '^b[0-9]{2}_' | sed 's/^b\([0-9]\{2\}\)_.*/\1/' | sort -n | uniq | tail -1` → 67
// This bench was cut as b67 against fd9d0da4 and RENAMED at the re-cut: R8-1's
// scripts/b67_r8_date_checks_bench.js landed on the same number first. R-40.86 —
// bench numbers are PER REPO, not per seat, and a number derived before a
// sibling seat's push is a number derived against a tree that has moved.
//
// EVERY CELL DRIVES THE REAL EXPORTED CODE. Nothing here re-implements its
// subject (R-40.94), and every §-number below names what a MUTATION of production
// code reddens — the manifest records the mutations actually run at the cut.
//
//   §1  THE GATE, BOTH WAYS. cap.on()=false → the row is filed DARK, the refusal
//       carries reason()'s own sentence, and sendWa is NEVER CALLED (asserted as
//       a call count, not as an absence of output). cap.on()=true → the send runs
//       and the wamid lands. Mutating `=== true` to a truthy check keeps §1a green
//       and reddens nothing — so §1a additionally pins that `approved` and `armed`
//       are BOTH refused, which is the assertion the law actually makes.
//   §2  ROW-PRESENCE IS NOT A SEND (the chair's named cell). `chipState` is driven
//       over every status × wamid pair the CHECK constraint permits. A dark row is
//       'not_sent' however present it is; a `sent` row with a null wamid is
//       'sent_no_receipt' and never 'sent'.
//   §3  E3, INHERITED. A bare "yes" does not send. The affirmative must name the
//       recipient, and a mismatch re-shows rather than sending.
//   §4  THE SLOTS. Three, in order, each carrying its founder-vetoed byte; {{2}}
//       and the button suffix are never asked for.
//   §5  THE COPY. The four new bytes hash-pin as LITERALS here (the committed
//       half of the approved-copy law), and the module's load-time self-check is
//       proven to exist by requiring a MUTATED COPY and catching the throw —
//       F-42.46's cure, non-vacuous by construction.
//   §6  THE REGISTRY. `tdw_introduction` exists, is MARKETING, rides the marketing
//       line, declares its url button by variable name, and its body is BYTE-FOR-
//       BYTE docs/TEMPLATES.md:283. Permute the variables and §6 reds.
//   §7  THE KEYS. Both constants 4a's readers name are present and spelled to the
//       rows 0149/0151 seed. No `perm.*` is added here — 4b owns those.
//   §8  THE ROUTER ARM. A receipt for an introduction wamid lands in
//       `public.introductions` and reports `home=introduction`; two rows on one
//       wamid refuse rather than speak (R-40.110).
//   §9  THE MIGRATION. 0161 declares the partial UNIQUE on wamid, the partial
//       UNIQUE on (vendor_id, recipient_phone), and `where_met NOT NULL` — the
//       three places R-41.11 and R-40.110 are structural rather than conventional.
//       Read comment-stripped (R-40.105 / the comment-blindness law).

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const intro = require(path.join(ROOT, 'src/lib/vendor/introductions.js'));
const capMod = require(path.join(ROOT, 'src/lib/capabilities.js'));
const lines = require(path.join(ROOT, 'src/lib/victorLines.js'));
const { TEMPLATES } = require(path.join(ROOT, 'src/lib/templates.js'));

let pass = 0, fail = 0;
const T = (name, cond) => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.error(`  FAIL ${name}`); }
};

// ── A SUPABASE DOUBLE THAT REFUSES WHAT THE DATABASE REFUSES (R-41.146) ──────
// It is a double and not a mock: it holds rows, applies 0161's CHECK on `status`
// and its partial UNIQUE on (vendor_id, recipient_phone), and returns the shapes
// the arm reads. A double that accepts what Postgres rejects proves nothing.
const STATUSES = ['staged','declined','queued','dark','sent','sent_no_wamid','delivered','read','failed'];

function makeDb(seed = []) {
  const rows = seed.map(r => ({ ...r }));
  const db = { rows, inserts: 0, updates: 0 };
  db.from = (table) => {
    assert.strictEqual(table, 'introductions', `the arm read the wrong table: ${table}`);
    const q = { _filters: [], _neq: [] };
    q.select = () => q;
    q.eq = (col, val) => { q._filters.push([col, val]); return q; };
    q.neq = (col, val) => { q._neq.push([col, val]); return q; };
    q.limit = () => Promise.resolve({ data: match(), error: null });
    q.single = () => {
      const m = match();
      return Promise.resolve({ data: m[0] || null, error: m.length ? null : { message: 'no row' } });
    };
    q.insert = (row) => {
      if (!STATUSES.includes(row.status)) {
        return { select: () => ({ single: () => Promise.resolve({ data: null, error: { message: `introductions_status_check` } }) }) };
      }
      const live = rows.filter(r => r.vendor_id === row.vendor_id
        && r.recipient_phone === row.recipient_phone && r.status !== 'declined');
      if (live.length) {
        return { select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'uq_introductions_vendor_recipient' } }) }) };
      }
      const full = { id: `row-${rows.length + 1}`, wamid: null, error_code: null, ...row };
      rows.push(full); db.inserts++;
      return { select: () => ({ single: () => Promise.resolve({ data: { ...full }, error: null }) }) };
    };
    q.update = (patch) => {
      const u = { _f: [] };
      u.eq = (col, val) => { u._f.push([col, val]); return u; };
      const apply = () => {
        const hit = rows.filter(r => u._f.every(([c, v]) => r[c] === v));
        hit.forEach(r => { Object.assign(r, patch); db.updates++; });
        return hit;
      };
      u.select = () => Promise.resolve({ data: apply().map(r => ({ ...r })), error: null });
      u.then = (res) => { apply(); return Promise.resolve({ error: null }).then(res); };
      return u;
    };
    function match() {
      return rows.filter(r => q._filters.every(([c, v]) => r[c] === v)
        && q._neq.every(([c, v]) => r[c] !== v)).map(r => ({ ...r }));
    }
    return q;
  };
  return db;
}

const VENDOR = Object.freeze({
  id: 'vendor-dev440', business_name: 'Dev Roy Photography', routing_handle: 'DEV440',
});
const DRAFT = Object.freeze({
  recipient_phone: '+919999000111', recipient_name: 'Anita Verma', where_met: 'the Verma wedding',
});

const capDouble = (status) => ({
  on: (k) => k === capMod.CAPABILITY_KEYS.TDW_INTRODUCTION && status === 'on',
  reason: (k) => (status === 'on' ? null : `${k} is ${status} on the switchboard`),
});

(async () => {
  console.log('b68 · R9-J1 introductions');

  // ── §1 · THE GATE, BOTH WAYS ───────────────────────────────────────────────
  console.log('\n§1 the gate');
  {
    const db = makeDb();
    const staged = await intro.stageIntroduction(db, { vendor: VENDOR, draft: DRAFT });
    T('a complete draft stages', staged.ok === true && staged.row.status === 'staged');

    let sendWaCalls = 0;
    const sendWa = async () => { sendWaCalls++; return { sent: true, result: { wamid: 'wamid.OFF' } }; };
    const out = await intro.sendIntroduction(db, { vendor: VENDOR, row: staged.row, answer: 'yes, send it to Anita Verma' },
      { cap: capDouble('approved'), sendWa });

    T('§1a approved is NOT on — the arm refuses', out.sent === false && out.status === 'dark');
    T('§1a the refusal carries reason()\'s own sentence',
      /is approved on the switchboard/.test(String(out.refusal)));
    T('§1a NOTHING touched the network (call count, not silence)', sendWaCalls === 0);
    T('§1a the row is FILED dark, not skipped', db.rows[0].status === 'dark');
    T('§1a the dark row carries no wamid', db.rows[0].wamid === null);

    const db2 = makeDb();
    const st2 = await intro.stageIntroduction(db2, { vendor: VENDOR, draft: DRAFT });
    const armedOut = await intro.sendIntroduction(db2, { vendor: VENDOR, row: st2.row, answer: 'send it to Anita Verma' },
      { cap: capDouble('armed'), sendWa });
    T('§1a armed is NOT on either', armedOut.sent === false && armedOut.status === 'dark');
  }
  {
    const db = makeDb();
    const staged = await intro.stageIntroduction(db, { vendor: VENDOR, draft: DRAFT });
    let seen = null, calls = 0;
    const sendWa = async (opts) => { calls++; seen = opts; return { sent: true, result: { wamid: 'wamid.HBgM' } }; };
    const out = await intro.sendIntroduction(db, { vendor: VENDOR, row: staged.row, answer: 'yes send to Anita Verma' },
      { cap: capDouble('on'), sendWa });

    T('§1b on → the send runs exactly once', calls === 1 && out.sent === true);
    T('§1b the wamid is recorded on the row', db.rows[0].wamid === 'wamid.HBgM' && db.rows[0].status === 'sent');
    T('§1b it rides the MARKETING line', seen.line === 'marketing');
    T('§1b it names the filed template key', seen.templateKey === 'introduction');
    T('§1b the button suffix is the row\'s own page_code, an OBJECT slot not a position',
      seen.vars.page_code === 'DEV440');
    T('§1b the three body slots are filled from the row',
      seen.vars.recipient_name === 'Anita Verma' && seen.vars.vendor_name === 'Dev Roy Photography'
      && seen.vars.where_met === 'the Verma wedding');
    T('§1b the send is correlated to its row', String(seen.ctx).includes(staged.row.id));
  }
  {
    // Meta refused it — B1:88-92's instrument. The code is recorded and the
    // vendor is told NOT DELIVERED rather than left with silence.
    const db = makeDb();
    const staged = await intro.stageIntroduction(db, { vendor: VENDOR, draft: DRAFT });
    const sendWa = async () => ({ sent: false, error_code: '131049', error_title: 'per-user marketing cap' });
    const out = await intro.sendIntroduction(db, { vendor: VENDOR, row: staged.row, answer: 'yes, Anita Verma' },
      { cap: capDouble('on'), sendWa });
    T('§1c a refused send records Meta\'s own code', db.rows[0].error_code === '131049' && db.rows[0].status === 'failed');
    T('§1c the vendor is told NOT DELIVERED, in the vetoed byte',
      out.line === lines.VICTOR_LINES.INTRO_NOT_DELIVERED);
    T('§1c and it promises no retry (R-41.11: no follow-up, ever)', /will not retry/.test(out.line));
  }

  // ── §2 · ROW-PRESENCE IS NOT A SEND ────────────────────────────────────────
  console.log('\n§2 row-presence is not a send');
  {
    for (const s of ['staged', 'declined', 'queued', 'dark']) {
      T(`§2 '${s}' with no wamid reads not_sent`, intro.chipState({ status: s, wamid: null }) === 'not_sent');
    }
    T('§2 a present row is still not a send', intro.chipState({ id: 'x', status: 'dark', wamid: null }) === 'not_sent');
    T('§2 sent WITHOUT a wamid is never \'sent\'', intro.chipState({ status: 'sent', wamid: null }) === 'sent_no_receipt');
    T('§2 sent_no_wamid is never \'sent\'', intro.chipState({ status: 'sent_no_wamid', wamid: null }) === 'sent_no_receipt');
    T('§2 sent WITH a wamid is sent', intro.chipState({ status: 'sent', wamid: 'w1' }) === 'sent');
    T('§2 delivered needs its wamid too', intro.chipState({ status: 'delivered', wamid: null }) === 'not_sent');
    T('§2 delivered with a wamid is delivered', intro.chipState({ status: 'delivered', wamid: 'w1' }) === 'delivered');
    T('§2 read with a wamid is read', intro.chipState({ status: 'read', wamid: 'w1' }) === 'read');
    T('§2 failed reads not_delivered', intro.chipState({ status: 'failed', wamid: 'w1' }) === 'not_delivered');
    T('§2 no row at all reads none', intro.chipState(null) === 'none');
    T('§2 every status in 0161\'s CHECK is answered',
      STATUSES.every(s => typeof intro.chipState({ status: s, wamid: null }) === 'string'));
  }

  // ── §3 · E3, INHERITED ─────────────────────────────────────────────────────
  console.log('\n§3 E3 — the affirmative names the recipient');
  {
    T('§3 a bare yes does not approve', intro.approvalNames('yes', 'Anita Verma') === false);
    T('§3 "send it" does not approve', intro.approvalNames('send it', 'Anita Verma') === false);
    T('§3 naming her approves', intro.approvalNames('yes, send it to Anita Verma', 'Anita Verma') === true);
    T('§3 naming her in any case approves', intro.approvalNames('SEND TO ANITA VERMA', 'Anita Verma') === true);
    T('§3 naming SOMEONE ELSE does not approve', intro.approvalNames('yes, send it to Rohan Mehta', 'Anita Verma') === false);
    T('§3 an empty answer does not approve', intro.approvalNames('', 'Anita Verma') === false);

    const db = makeDb();
    let calls = 0;
    const staged = await intro.stageIntroduction(db, { vendor: VENDOR, draft: DRAFT });
    const out = await intro.sendIntroduction(db, { vendor: VENDOR, row: staged.row, answer: 'yes' },
      { cap: capDouble('on'), sendWa: async () => { calls++; return { sent: true, result: {} }; } });
    T('§3 a bare yes sends NOTHING even with the plane on', calls === 0 && out.sent === false);
    T('§3 the refusal is typed, not a sentence', out.refusal === intro.REFUSE.NOT_APPROVED);
    T('§3 the draft is RE-SHOWN, never sent', /Send this to Anita Verma/.test(String(out.reshow)));
    T('§3 the row did not move to queued on a bad affirmative', db.rows[0].status === 'staged');
  }

  // ── §4 · THE SLOTS ─────────────────────────────────────────────────────────
  console.log('\n§4 the three slots');
  {
    T('§4 exactly three slots are asked for', intro.SLOT_ORDER.length === 3);
    T('§4 the vendor is NEVER asked her own business name',
      !intro.SLOT_ORDER.includes('vendor_name') && !intro.SLOT_ORDER.includes('page_code'));
    T('§4 an empty draft asks for the number first',
      intro.nextSlot({}).ask === lines.VICTOR_LINES.INTRO_ASK_NUMBER);
    T('§4 with the number, it asks for the name',
      intro.nextSlot({ recipient_phone: '+91999' }).ask === lines.VICTOR_LINES.INTRO_ASK_NAME);
    T('§4 the walk\'s own shape — number and place given — asks ONLY the name',
      intro.nextSlot({ recipient_phone: '+91999', where_met: 'the Verma wedding' }).ask === lines.VICTOR_LINES.INTRO_ASK_NAME);
    T('§4 without a meeting place it asks for one (R-41.11)',
      intro.nextSlot({ recipient_phone: '+91999', recipient_name: 'A' }).ask === lines.VICTOR_LINES.INTRO_ASK_WHERE);
    T('§4 whitespace is not an answer', intro.nextSlot({ recipient_phone: '   ' }).slot === 'recipient_phone');
    T('§4 a complete draft asks nothing', intro.nextSlot(DRAFT) === null);

    const db = makeDb();
    await intro.stageIntroduction(db, { vendor: VENDOR, draft: DRAFT });
    const again = await intro.stageIntroduction(db, { vendor: VENDOR, draft: DRAFT });
    T('§4 R-41.11 no second introduction — refused in CODE before the database',
      again.ok === false && again.code === intro.REFUSE.ALREADY_INTRODUCED);
    T('§4 and the refusal wrote no second row', db.rows.length === 1);
    T('§4 and it SPEAKS — the structural law is not a silent dead end',
      again.line === lines.VICTOR_LINES.INTRO_ALREADY_SENT);
    T('§4 the refusal states the law, it does not offer the forbidden follow-up',
      /go once/.test(again.line) && !/would you like|try again|instead/i.test(again.line));
  }

  // ── §5 · THE COPY ──────────────────────────────────────────────────────────
  console.log('\n§5 the founder-vetoed bytes');
  {
    // ── ONE HOME FOR THE HASH LITERALS (chair-ruled at the re-cut) ─────────
    // The committed half of the approved-copy law lives in b40's PINNED, which
    // now carries all five introduction bytes. THIS bench does not re-pin them:
    // two benches holding one hash literal is two homes for one fact, and the
    // first edit to either makes them disagree while both stay green about
    // themselves. What b68 owns is BEHAVIOUR — the load-time guard, the copy
    // law, and which byte each refusal actually speaks.
    const FIVE = ['INTRO_ASK_NUMBER','INTRO_ASK_NAME','INTRO_ASK_WHERE','INTRO_NOT_DELIVERED','INTRO_ALREADY_SENT'];
    for (const k of FIVE) {
      T(`§5 ${k} is a string in the one home`, typeof lines.VICTOR_LINES[k] === 'string' && lines.VICTOR_LINES[k].length > 0);
      T(`§5 ${k} carries a pinned hash in the module`, /^[0-9a-f]{64}$/.test(String(lines.LINE_HASHES[k])));
    }
    T('§5 b40 is the ONE home for the hash literals — b68 re-pins none',
      !/[0-9a-f]{64}/.test(fs.readFileSync(path.join(ROOT, 'scripts/b68_introductions_bench.js'), 'utf8')
        .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n')));
    T('§5 and b40 pins all five', (() => {
      const b40 = fs.readFileSync(path.join(ROOT, 'scripts/b40_victor_sitting_bench.js'), 'utf8');
      return FIVE.every(k => new RegExp(`${k}:\\s*'[0-9a-f]{64}'`).test(b40));
    })());
    T('§5 the module self-check passes', lines.assertLineHashes() === true);
    T('§5 no persona name in any byte (copy law)',
      Object.values(lines.VICTOR_LINES).every(s => !/victor|mira|donna|eliza|harvey/i.test(s)));

    // F-42.46 · THE LOAD-TIME GUARD IS REAL. Proven by requiring a MUTATED COPY
    // and catching the throw — an assertion about the FILE would pass on a
    // comment, which is precisely the defect this cures.
    const src = fs.readFileSync(path.join(ROOT, 'src/lib/victorLines.js'), 'utf8');
    const mutated = src.replace(
      "\"What's their name? It goes at the top of the message.\"",
      "\"What's their name? It goes at the top of the message!\"");
    T('§5 the mutation actually changed a byte', mutated !== src);
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'b68-')), 'victorLines.js');
    fs.writeFileSync(tmp, mutated);
    let threw = false;
    try { require(tmp); } catch (e) { threw = /APPROVED COPY DRIFT/.test(String(e && e.message)); }
    T('§5 an edited byte DIES AT REQUIRE, not at the next floor run (F-42.46)', threw === true);
  }

  // ── §6 · THE REGISTRY ──────────────────────────────────────────────────────
  console.log('\n§6 the registry entry (F-42.36)');
  {
    const t = TEMPLATES.introduction;
    T('§6 the entry exists at all', !!t);
    T('§6 it names the filed template', t.name === 'tdw_introduction');
    T('§6 MARKETING as filed, never argued down', t.category === 'MARKETING');
    T('§6 it rides the marketing line', t.line === 'marketing');
    T('§6 three variables, in Meta\'s positional order',
      JSON.stringify(t.variables) === JSON.stringify(['recipient_name', 'vendor_name', 'where_met']));
    T('§6 the url button is declared (F-41.123: an entry without one is refused 131008)',
      t.button && t.button.type === 'url' && t.button.index === 0);
    T('§6 the suffix is read BY NAME, never positionally', t.button.variable === 'page_code');
    T('§6 the base is the storefront, which /v/<code> resolves',
      t.button.base === 'https://thedreamwedding.in/v/');
    const filed = fs.readFileSync(path.join(ROOT, 'docs/TEMPLATES.md'), 'utf8')
      .split('\n').find(l => l.startsWith('> Hi {{1}}, this is {{2}}'));
    T('§6 the body is BYTE-FOR-BYTE the filed string (TEMPLATES.md:283)',
      !!filed && t.body === filed.replace(/^> /, '').trim());
    T('§6 the mandatory opt-out sentence is present (MARKETING category)',
      /Reply STOP/.test(t.body));
  }

  // ── §7 · THE KEYS ──────────────────────────────────────────────────────────
  console.log('\n§7 the roster (F-42.31)');
  {
    const K = capMod.CAPABILITY_KEYS;
    T('§7 TDW_INTRODUCTION names the row 0149:78 seeds', K.TDW_INTRODUCTION === 'template.tdw_introduction');
    T('§7 ASSIST_FORWARD_ALERT names the row 0151:19 seeds', K.ASSIST_FORWARD_ALERT === 'flag.assist_forward_alert');
    T('§7 the arm spells no key by hand — it reads the roster',
      !/['"]template\.tdw_introduction['"]/.test(
        fs.readFileSync(path.join(ROOT, 'src/lib/vendor/introductions.js'), 'utf8')
          .split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')));
    T('§7 4a adds NO perm.* constant — 4b owns those with their readers',
      !Object.values(K).some(v => String(v).startsWith('perm.')));
    T('§7 on() is true for \'on\' alone', capMod.on('template.tdw_introduction') === false);
  }

  // ── §8 · THE ROUTER ARM (R-40.110) ─────────────────────────────────────────
  console.log('\n§8 the eighth home');
  {
    const rs = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/relayStatus.js'), 'utf8');
    const code = rs.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    T('§8 the arm reads public.introductions', /\.from\('introductions'\)/.test(code));
    T('§8 it matches on the wamid', /\.from\('introductions'\)[\s\S]{0,400}\.eq\('wamid', wamid\)/.test(code));
    T('§8 it .select()s, so one row is distinguishable from none',
      /\.from\('introductions'\)[\s\S]{0,500}\.select\(/.test(code));
    T('§8 it reports its own home', /home=introduction/.test(code));
    T('§8 an ambiguous sid refuses rather than speaking', /home=introduction_ambiguous/.test(code));
    T('§8 it records Meta\'s error code on the row',
      /\.from\('introductions'\)[\s\S]{0,300}firstErrCode\(status\)/.test(code));
  }

  // ── §9 · THE MIGRATION, READ COMMENT-STRIPPED (R-40.105) ───────────────────
  console.log('\n§9 0161');
  {
    const raw = fs.readFileSync(path.join(ROOT, 'db/migrations/0161_introductions.sql'), 'utf8');
    const sql = raw.split('\n').filter(l => !/^\s*--/.test(l)).join('\n');
    T('§9 the table is created', /create table if not exists public\.introductions/.test(sql));
    T('§9 R-40.110 · the partial UNIQUE on wamid',
      /create unique index if not exists uq_introductions_wamid[\s\S]{0,120}where wamid is not null/.test(sql));
    T('§9 R-40.110 · and its partial index',
      /create index if not exists introductions_wamid_idx[\s\S]{0,120}where wamid is not null/.test(sql));
    T('§9 R-41.11 · no second introduction, structurally',
      /uq_introductions_vendor_recipient[\s\S]{0,160}\(vendor_id, recipient_phone\)/.test(sql));
    T('§9 R-41.11 · where_met is NOT NULL, so the law is not a convention',
      /where_met\s+text not null/.test(sql));
    T('§9 recipient_name is NOT NULL — the body opens with it',
      /recipient_name\s+text not null/.test(sql));
    T('§9 the status set is 0158\'s vocabulary plus staged and declined',
      STATUSES.every(s => new RegExp(`'${s}'`).test(sql)));
    T('§9 it writes NO prospects row (Fork A)', !/prospects/.test(sql));
    T('§9 the FK is to vendors, cascading', /references public\.vendors\(id\) on delete cascade/.test(sql));
  }

  console.log(`\nb68 ${pass}/${pass + fail}`);
  if (fail) process.exit(1);
})().catch((e) => { console.error('b68 THREW:', e && e.stack); process.exit(1); });
