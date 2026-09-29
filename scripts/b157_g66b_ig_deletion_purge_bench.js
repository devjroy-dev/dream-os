'use strict';
// scripts/b157_g66b_ig_deletion_purge_bench.js · CE-46 · G6-4 · F-44.247 · RUNG b157.
// Meta's Instagram data-deletion callback now purges her Instagram threads in ONE transaction (public.ig_deletion_purge).
// The SQL is run for real in PGlite (Postgres compiled to WebAssembly), fetched at run time by `npm pack` into the temp dir as b123
// and b140 fetch their faces, never a repo dependency. Mutations are applied to the SQL or the source IN MEMORY; nothing on disk is
// written. THE EXIT CODE IS THE VERDICT.
const fs = require('fs'); const os = require('os'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const P = (r) => path.join(ROOT, r); const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info ? `\n        ${String(info).slice(0, 300)}` : ''}`); } };
const sec = (s) => console.log(`\n§${s}`);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function pglite() {
  const dir = path.join(os.tmpdir(), 'b157-pglite');
  const main = path.join(dir, 'node_modules', '@electric-sql', 'pglite');
  if (!fs.existsSync(path.join(main, 'package.json'))) {
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(path.join(dir, 'package.json'))) fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"bigdel","private":true}');
    execSync('npm i @electric-sql/pglite@0 --no-audit --no-fund --loglevel=error', { cwd: dir, stdio: 'ignore' });
  }
  return require(main);
}
const MIG = fs.readdirSync(P('db/migrations')).find((f) => /_ig_deletion_purge\.sql$/.test(f));
const SQL = MIG ? read(`db/migrations/${MIG}`) : '';
const body = (sql) => sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');

const SCHEMA = `
CREATE ROLE service_role; CREATE ROLE anon; CREATE ROLE authenticated;
CREATE TABLE vendors (id uuid PRIMARY KEY);
CREATE TABLE conversations (id uuid PRIMARY KEY, vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE, kind text, channel text NOT NULL DEFAULT 'whatsapp', counterparty_ig_id text, counterparty_phone text);
CREATE TABLE messages (id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, channel text NOT NULL, body text);
CREATE TABLE pending_actions (id uuid PRIMARY KEY, vendor_id uuid, conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE);
CREATE TABLE notes (id uuid PRIMARY KEY, vendor_id uuid, conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL, content text);
CREATE TABLE leads (id uuid PRIMARY KEY, vendor_id uuid, phone text, name text, counterparty_ig_id text);
CREATE TABLE vendor_ig_connections (vendor_id uuid PRIMARY KEY, access_token text);`;
const A = '00000000-0000-0000-0000-00000000000a'; const B = '00000000-0000-0000-0000-00000000000b';
const u = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const SEED = `
INSERT INTO vendors VALUES ('${A}'), ('${B}');
INSERT INTO conversations VALUES ('${u(1)}','${A}','couple_thread','instagram','igsid-1',NULL), ('${u(2)}','${A}','couple_thread','whatsapp',NULL,'+919000000001'),
  ('${u(3)}','${B}','couple_thread','instagram','igsid-9',NULL);
INSERT INTO messages VALUES ('${u(11)}','${u(1)}','instagram','hi'), ('${u(12)}','${u(1)}','instagram','date?'), ('${u(13)}','${u(2)}','whatsapp','hello'),
  ('${u(14)}','${u(3)}','instagram','b hi');
INSERT INTO pending_actions VALUES ('${u(21)}','${A}','${u(1)}'), ('${u(22)}','${A}','${u(2)}');
INSERT INTO notes VALUES ('${u(31)}','${A}','${u(1)}','from ig');
INSERT INTO leads VALUES ('${u(41)}','${A}',NULL,'Priya','igsid-1'), ('${u(42)}','${A}','+919000000001','Riya',NULL), ('${u(43)}','${B}',NULL,'Zoya','igsid-9');
INSERT INTO vendor_ig_connections VALUES ('${A}','tokA'), ('${B}','tokB');`;
async function fresh(PG, sql) { const db = new PG.PGlite(); await db.exec(SCHEMA); await db.exec(SEED); await db.exec(sql); return db; }
const rows = async (db, q) => (await db.query(q)).rows;
async function state(db) {
  return {
    msgs: (await rows(db, 'SELECT id FROM messages ORDER BY id')).map((r) => r.id),
    convs: (await rows(db, 'SELECT id FROM conversations ORDER BY id')).map((r) => r.id),
    pend: (await rows(db, 'SELECT id FROM pending_actions ORDER BY id')).map((r) => r.id),
    note: (await rows(db, 'SELECT conversation_id FROM notes'))[0],
    leads: await rows(db, 'SELECT id, counterparty_ig_id FROM leads ORDER BY id'),
    conn: (await rows(db, 'SELECT vendor_id FROM vendor_ig_connections ORDER BY vendor_id')).map((r) => r.vendor_id),
  };
}
const probes = {
  async purge(PG, sql) { const db = await fresh(PG, sql); const r = (await rows(db, `SELECT public.ig_deletion_purge('${A}') AS r`))[0].r; return { r, s: await state(db) }; },
};
const scoped = (s) => JSON.stringify(s.msgs) === JSON.stringify([u(13), u(14)]) && JSON.stringify(s.convs) === JSON.stringify([u(2), u(3)]);
const leadsOk = (s) => s.leads.find((l) => l.id === u(41)).counterparty_ig_id === null && s.leads.find((l) => l.id === u(43)).counterparty_ig_id === 'igsid-9' && s.leads.length === 3;

(async () => {
  console.log('b157 · F-44.247: Meta\u2019s Instagram deletion purges her threads in one transaction (CE-46 G6-4)');
  sec('1  the source');
  const ig = strip(read('src/api/vendor/ig.js'));
  const dd = ig.slice(ig.indexOf("router.post('/data-deletion'"), ig.indexOf("router.get('/deletion-status'"));
  const deauth = ig.slice(ig.indexOf("router.post('/deauthorize'"), ig.indexOf("router.post('/data-deletion'"));
  ok(!!MIG, '1.1 one migration file carries the purge function', MIG);
  ok(/supabase\.rpc\('ig_deletion_purge', \{ p_vendor_id: found\.vendorId \}\)/.test(dd) && !/igConn\.disconnect/.test(dd) && /if \(d\.error\) \{[\s\S]*?status\(500\)/.test(dd),
    '1.2 the deletion callback makes ONE call (the purge) and answers 500 on its error, so Meta asks again');
  ok(/igConn\.disconnect\(supabase, found\.vendorId\)/.test(deauth), '1.3 the deauthorize callback is unchanged (the connection only)');
  const page = read('src/api/vendor/ig.js');
  ok(/Your Instagram conversations have been deleted\./.test(page) && /the Instagram identifier on it has been removed/.test(page) && /Photos you imported into your portfolio/.test(page),
    '1.4 the status page says the conversations are deleted, what happens to leads, and still says the photos stay');
  const b = body(SQL);
  ok((b.match(/BEGIN;/g) || []).length === 1 && /COMMIT;/.test(b) && !/CREATE TABLE|DROP TABLE|DROP COLUMN|ALTER TABLE/i.test(b), '1.5 one transaction; no table created, altered or dropped');
  ok(/REVOKE ALL ON FUNCTION public\.ig_deletion_purge\(uuid\) FROM PUBLIC;/.test(b) && /GRANT EXECUTE ON FUNCTION public\.ig_deletion_purge\(uuid\) TO service_role;/.test(b) && /SECURITY INVOKER/.test(b),
    '1.6 EXECUTE for service_role only (A-45.8); the function runs as its caller');

  sec('2  the function, run in Postgres (PGlite)');
  let PG; try { PG = pglite(); } catch (e) { ok(false, '2.0 PGlite is available (npm)', e.message); }
  if (PG) {
    const { r, s } = await probes.purge(PG, SQL);
    ok(r && r.messages === 2 && r.threads === 1 && r.leads_unlinked === 1 && r.connection === 1, '2.1 it reports what it did: 2 messages, 1 thread, 1 lead unlinked, 1 connection', JSON.stringify(r));
    ok(scoped(s), '2.2 her Instagram thread and its messages are gone; her WhatsApp thread and message stay', JSON.stringify({ m: s.msgs, c: s.convs }));
    ok(JSON.stringify(s.pend) === JSON.stringify([u(22)]) && s.note && s.note.conversation_id === null, '2.3 rows pointing at the thread follow their keys: its pending action cascades, the note stays with the link nulled');
    ok(leadsOk(s) && s.leads.find((l) => l.id === u(42)).counterparty_ig_id === null, '2.4 the Instagram identifier on her lead is nulled; the lead stays; another vendor\u2019s lead untouched', JSON.stringify(s.leads));
    ok(JSON.stringify(s.conn) === JSON.stringify([B]), '2.5 her connection row is deleted; another vendor\u2019s stays');
    { const db = await fresh(PG, SQL);
      await db.exec(`CREATE FUNCTION refuse() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'refused'; END $$;
        CREATE TRIGGER refuse_conn BEFORE DELETE ON vendor_ig_connections FOR EACH ROW EXECUTE FUNCTION refuse();`);
      const before = JSON.stringify(await state(db)); let threw = false;
      try { await db.query(`SELECT public.ig_deletion_purge('${A}')`); } catch (_e) { threw = true; }
      ok(threw && JSON.stringify(await state(db)) === before, '2.6 ONE transaction: when the last step fails, the messages, thread and lead link are all still there'); }
    { const db = await fresh(PG, SQL); let threw = false; try { await db.query('SELECT public.ig_deletion_purge(NULL)'); } catch (_e) { threw = true; }
      ok(threw, '2.7 a null vendor is refused, never read as "every vendor"'); }
    { const db = await fresh(PG, SQL);
      const g = (await rows(db, "SELECT has_function_privilege('service_role','public.ig_deletion_purge(uuid)','EXECUTE') AS s, has_function_privilege('anon','public.ig_deletion_purge(uuid)','EXECUTE') AS a, has_function_privilege('authenticated','public.ig_deletion_purge(uuid)','EXECUTE') AS t"))[0];
      ok(g.s === true && g.a === false && g.t === false, '2.8 service_role can run it; anon and authenticated cannot', JSON.stringify(g)); }

    sec('3  mutations (each must turn its cell red; applied in memory, nothing on disk written)');
    const M = [
      ['M1 the WhatsApp thread purged too (channel filter dropped)', "DELETE FROM public.conversations WHERE vendor_id = p_vendor_id AND channel = 'instagram';", 'DELETE FROM public.conversations WHERE vendor_id = p_vendor_id;', async (x) => scoped(x.s)],
      ['M2 every vendor\u2019s Instagram messages purged (vendor filter dropped)', 'WHERE m.conversation_id = c.id AND c.vendor_id = p_vendor_id AND', 'WHERE m.conversation_id = c.id AND', async (x) => scoped(x.s)],
      ['M3 the lead link left in place', 'UPDATE public.leads SET counterparty_ig_id = NULL WHERE vendor_id = p_vendor_id AND counterparty_ig_id IS NOT NULL;', 'UPDATE public.leads SET counterparty_ig_id = counterparty_ig_id WHERE false;', async (x) => leadsOk(x.s)],
      ['M4 the connection kept', 'DELETE FROM public.vendor_ig_connections WHERE vendor_id = p_vendor_id;', 'PERFORM 1;', async (x) => JSON.stringify(x.s.conn) === JSON.stringify([B])],
    ];
    for (const [name, from, to, green] of M) {
      if (!SQL.includes(from)) { ok(false, `3 ${name}: the anchor exists`); continue; }
      let red; try { red = !(await green(await probes.purge(PG, SQL.replace(from, to)))); } catch (_e) { red = true; }
      ok(red, `3 ${name}: turns its cell red`);
    }
    { const m = dd.replace("supabase.rpc('ig_deletion_purge', { p_vendor_id: found.vendorId })", 'igConn.disconnect(supabase, found.vendorId)');
      ok(!(/supabase\.rpc\('ig_deletion_purge'/.test(m) && !/igConn\.disconnect/.test(m)), '3 M5 the callback back on the bare disconnect: turns 1.2 red'); }
  }
  console.log(`\nb157 · ${pass} pass · ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('b157 crashed:', e && e.stack); process.exit(2); });
