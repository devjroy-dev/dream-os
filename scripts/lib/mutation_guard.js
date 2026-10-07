'use strict';
// scripts/lib/mutation_guard.js · CE-47 · F-44.258's cure (chartered to FE-6, cut 1; benches only).
// Lives in scripts/lib/ so run-floor.sh's flat glob never collects it as a bench (e-44.20).
//
// THE DEFECT: a mutating bench plants a change in production source and restores it on exit and on SIGINT, SIGTERM and
// SIGHUP. A run killed in the SIGKILL class (kill -9, a seat's turn ending, a container stopping) runs none of those,
// so the mutation stays on disk (seen: b143_v2 M4 in v2/app/vendor/(shell)/posts/ads/page.tsx, 30 Sept 2026).
//
// THE CURE, IN THIS ORDER, so a kill at ANY instant leaves the tree recoverable:
//   apply():   1. the original is kept beside the marker (scripts/.mutation-pending/<id>.orig), written and synced;
//              2. the marker (<id>.json: the file's path and the original's sha256) is written and synced;
//              3. only then is the mutation written to the file.
//              A kill before 2 leaves no marker and an untouched file; a kill after 2 leaves a marker to recover from.
//   restore(): the original is written back, its sha checked, then the marker and the kept copy are removed.
//   recover(): at EVERY start, before anything is read: every marker is restored from its kept copy and checked by
//              sha. If a kept copy or the restored file does not match its marker's sha, the bench must refuse to run.
// The pending folder is NOT ignored by git on purpose: while a marker exists, `git status` shows it (F-44.258 (a)).
// `node scripts/lib/mutation_guard.js --selftest` proves the kill-and-recover path on a temp tree, both ways.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const pendingDir = (root) => path.join(root, 'scripts', '.mutation-pending');

function writeSynced(file, data) {
  const fd = fs.openSync(file, 'w');
  try { fs.writeSync(fd, data); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

/** Settle every pending mutation under root (CE-47's tightenings (a) and (b)).
 *  Returns { restored: [rel], cleared: [rel], orphans: [name], refused: [reason] }.
 *  For each marker, the file ON DISK decides:
 *    equals the original's sha   -> the mutation never landed (or was already put back): clear, touch nothing;
 *    equals the mutated sha      -> restore from the kept copy (itself checked), check the file, clear;
 *    equals neither              -> REFUSE: someone has edited the file since; a killed run never overwrites that.
 *  Partial states: a kept copy with no marker is removed and the file is not touched (a kill between apply's steps 1
 *  and 2, or after restore() removed the marker); a marker with no kept copy is cleared only if the file equals the
 *  original's sha, otherwise REFUSED. */
function recover(root) {
  const dir = pendingDir(root); const out = { restored: [], cleared: [], orphans: [], refused: [] };
  if (!fs.existsSync(dir)) return out;
  const names = fs.readdirSync(dir);
  for (const name of names.filter((n) => n.endsWith('.orig')).sort()) {
    if (!names.includes(name.replace(/\.orig$/, '.json'))) { fs.unlinkSync(path.join(dir, name)); out.orphans.push(name); }
  }
  for (const name of names.filter((n) => n.endsWith('.json')).sort()) {
    const markerFile = path.join(dir, name); const keptFile = markerFile.replace(/\.json$/, '.orig');
    let m; try { m = JSON.parse(fs.readFileSync(markerFile, 'utf8')); } catch (e) { out.refused.push(`${name}: the marker is unreadable (${e.message})`); continue; }
    const abs = path.join(root, m.rel);
    const disk = fs.existsSync(abs) ? sha(fs.readFileSync(abs, 'utf8')) : '(absent)';
    const three = `on disk ${disk}, original ${m.sha}, mutated ${m.mutSha}`;
    const clear = () => { try { fs.unlinkSync(markerFile); } catch (_e) { /* gone */ } try { fs.unlinkSync(keptFile); } catch (_e) { /* gone */ } };
    if (disk === m.sha) { clear(); out.cleared.push(m.rel); continue; }
    if (!fs.existsSync(keptFile)) { out.refused.push(`${m.rel}: the kept original is missing and the file is not the original (${three})`); continue; }
    if (disk !== m.mutSha) { out.refused.push(`${m.rel}: the file was edited since the mutation (${three})`); continue; }
    const kept = fs.readFileSync(keptFile, 'utf8');
    if (sha(kept) !== m.sha) { out.refused.push(`${m.rel}: the kept original does not match its marker (${three}, kept ${sha(kept)})`); continue; }
    writeSynced(abs, kept);
    if (sha(fs.readFileSync(abs, 'utf8')) !== m.sha) { out.refused.push(`${m.rel}: the file does not match the original after the restore (${three})`); continue; }
    clear(); out.restored.push(m.rel);
  }
  try { if (!fs.readdirSync(dir).length) fs.rmdirSync(dir); } catch (_e) { /* not empty or gone */ }
  return out;
}

/** The start guard every mutating bench calls first. Prints what it restored; exits 2 (refuses to run) on a mismatch. */
function recoverOrRefuse(root, bench) {
  const r = recover(root);
  for (const rel of r.restored) console.log(`  ${bench}: a pending mutation from a killed run was restored by sha: ${rel}`);
  for (const rel of r.cleared) console.log(`  ${bench}: a pending marker was cleared; the file was already the original: ${rel}`);
  for (const n of r.orphans) console.log(`  ${bench}: a kept copy with no marker was removed; no file touched: ${n}`);
  if (r.refused.length) {
    console.log(`  ${bench}: REFUSING TO RUN. A pending mutation could not be restored by sha (F-44.258):`);
    for (const why of r.refused) console.log(`    ${why}`);
    console.log(`  Put the file back from git, remove scripts/.mutation-pending/, and run again.`);
    process.exit(2);
  }
  return r;
}

/** Plant one mutation. Returns { restore() } whose restore() is idempotent and checks the sha. */
function apply(root, rel, from, to, owner = 'bench') {
  const abs = path.join(root, rel); const orig = fs.readFileSync(abs, 'utf8'); const h = sha(orig);
  if (!orig.includes(from)) throw new Error(`mutation_guard: the anchor is not found in ${rel}`);   // the caller's own count rule stands (b143_v2: exactly once)
  const dir = pendingDir(root); fs.mkdirSync(dir, { recursive: true });
  const id = `${owner}-${sha(rel).slice(0, 12)}`;
  const markerFile = path.join(dir, id + '.json'); const keptFile = path.join(dir, id + '.orig');
  if (fs.existsSync(markerFile)) throw new Error(`mutation_guard: ${rel} already has a pending mutation; recover first`);
  const mutated = orig.replace(from, to); const mh = sha(mutated);                // the mutated sha, computed BEFORE the write
  writeSynced(keptFile, orig);                                                    // 1
  writeSynced(markerFile, JSON.stringify({ rel, sha: h, mutSha: mh, owner, at: new Date().toISOString() }));   // 2
  writeSynced(abs, mutated);                                                      // 3
  let done = false;
  return {
    sha: h,
    restore() {
      if (done) return true; done = true;
      writeSynced(abs, orig);
      const back = sha(fs.readFileSync(abs, 'utf8')) === h;
      // THE MARKER GOES FIRST, then the kept copy: a kill between the two leaves a kept copy with no marker, which the
      // next start removes touching nothing (the file is already the original). The other order would leave a marker
      // with no kept copy, which is safe only because the file happens to be the original, and is refused otherwise.
      if (back) { try { fs.unlinkSync(markerFile); } catch (_e) { /* gone */ } try { fs.unlinkSync(keptFile); } catch (_e) { /* gone */ } try { if (!fs.readdirSync(dir).length) fs.rmdirSync(dir); } catch (_e) { /* not empty */ } }
      return back;
    },
  };
}

module.exports = { apply, recover, recoverOrRefuse, pendingDir, sha };

// ── the self-test (run on the floor by scripts/b174_f44258_mutation_guard_bench.js). Cells by label:
//   S1 guarded: a SIGKILLed child leaves its mutation on disk          S2 the next start restores it by sha, clears the marker
//   S3 unguarded: the mutation stays, nothing can recover it (F-44.258 reproduced)
//   A1 the marker carries the original's AND the mutated sha           A2 on disk = original: marker cleared, file untouched
//   A3 on disk = neither (edited since): REFUSED, file untouched, the three shas printed
//   A4 a kept copy that fails its sha: REFUSED, not restored
//   B1 a kept copy with no marker: removed at start, file untouched
//   B2 a marker with no kept copy, file = original: cleared           B3 a marker with no kept copy, file mutated: REFUSED
//   B4 restore() removes the marker before the kept copy (a kill between leaves only the harmless orphan)
if (require.main === module && process.argv.includes('--selftest')) {
  const os = require('os'); const { spawnSync } = require('child_process');
  let pass = 0; let fail = 0;
  const ok = (c, n, i) => { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; console.log(`  FAIL  ${n}${i ? '  [' + String(i).slice(0, 300) + ']' : ''}`); } };
  const ORIG = 'export const A = 1;\n';
  const tree = () => { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mguard-')); fs.mkdirSync(path.join(root, 'scripts'), { recursive: true }); fs.writeFileSync(path.join(root, 'app.ts'), ORIG); return root; };
  const read = (root) => fs.readFileSync(path.join(root, 'app.ts'), 'utf8');
  const files = (root) => (fs.existsSync(pendingDir(root)) ? fs.readdirSync(pendingDir(root)).sort() : []);
  const killChild = (root, guarded) => spawnSync(process.execPath, ['-e', guarded
    ? `const g=require(${JSON.stringify(__filename)}); g.apply(${JSON.stringify(root)},'app.ts','= 1','= 999','selftest'); process.kill(process.pid,'SIGKILL');`
    : `const fs=require('fs'),p=${JSON.stringify(path.join(root, 'app.ts'))}; const o=fs.readFileSync(p,'utf8'); process.on('exit',()=>fs.writeFileSync(p,o)); fs.writeFileSync(p,o.replace('= 1','= 999')); process.kill(process.pid,'SIGKILL');`], { encoding: 'utf8' });
  const roots = [];
  try {
    let root = tree(); roots.push(root);
    let r = killChild(root, true);
    ok(r.signal === 'SIGKILL' && read(root).includes('= 999'), 'S1 guarded: a SIGKILLed child leaves its mutation on disk', `${r.signal} ${read(root).trim()}`);
    const marker = JSON.parse(fs.readFileSync(path.join(pendingDir(root), files(root).find((n) => n.endsWith('.json'))), 'utf8'));
    ok(marker.sha === sha(ORIG) && marker.mutSha === sha(ORIG.replace('= 1', '= 999')), 'A1 the marker carries the original\u2019s and the mutated sha', JSON.stringify(marker));
    let rec = recover(root);
    ok(rec.restored.length === 1 && !rec.refused.length && read(root) === ORIG && !fs.existsSync(pendingDir(root)), 'S2 the next start restores it by sha and clears the marker', JSON.stringify(rec));

    root = tree(); roots.push(root); r = killChild(root, false);
    ok(r.signal === 'SIGKILL' && read(root).includes('= 999') && !fs.existsSync(pendingDir(root)), 'S3 unguarded: the mutation stays and nothing can recover it (F-44.258 reproduced)');

    // A2: the marker is written but the mutation never landed (a kill between steps 2 and 3): cleared, file untouched
    root = tree(); roots.push(root); let h = apply(root, 'app.ts', '= 1', '= 5', 'selftest'); fs.writeFileSync(path.join(root, 'app.ts'), ORIG); void h;
    const mt0 = fs.statSync(path.join(root, 'app.ts')).mtimeMs; rec = recover(root);
    ok(rec.cleared.length === 1 && !rec.restored.length && !rec.refused.length && read(root) === ORIG && fs.statSync(path.join(root, 'app.ts')).mtimeMs === mt0 && !fs.existsSync(pendingDir(root)),
      'A2 on disk equals the original: the marker is cleared and the file is not touched', JSON.stringify(rec));

    // A3: edited since the mutation: refused, the file kept as edited, the three shas named
    root = tree(); roots.push(root); h = apply(root, 'app.ts', '= 1', '= 5', 'selftest'); fs.writeFileSync(path.join(root, 'app.ts'), 'export const A = 42; // edited by hand\n');
    rec = recover(root);
    ok(rec.refused.length === 1 && /edited since/.test(rec.refused[0]) && (rec.refused[0].match(/[0-9a-f]{64}/g) || []).length === 3 && read(root).includes('42') && files(root).length === 2,
      'A3 on disk equals neither: REFUSED, the edit kept, the three shas printed', JSON.stringify(rec));

    // A4: the kept copy fails its sha
    root = tree(); roots.push(root); h = apply(root, 'app.ts', '= 1', '= 7', 'selftest');
    fs.writeFileSync(path.join(pendingDir(root), files(root).find((n) => n.endsWith('.orig'))), 'tampered\n');
    rec = recover(root);
    ok(rec.refused.length === 1 && !rec.restored.length && read(root).includes('= 7'), 'A4 a kept copy that fails its sha is REFUSED, not restored', JSON.stringify(rec));

    // B1: a kept copy with no marker (a kill between apply's steps 1 and 2): removed, the file untouched
    root = tree(); roots.push(root); h = apply(root, 'app.ts', '= 1', '= 8', 'selftest'); fs.unlinkSync(path.join(pendingDir(root), files(root).find((n) => n.endsWith('.json')))); fs.writeFileSync(path.join(root, 'app.ts'), ORIG);
    const mt1 = fs.statSync(path.join(root, 'app.ts')).mtimeMs; rec = recover(root);
    ok(rec.orphans.length === 1 && !rec.refused.length && read(root) === ORIG && fs.statSync(path.join(root, 'app.ts')).mtimeMs === mt1 && !fs.existsSync(pendingDir(root)),
      'B1 a kept copy with no marker is removed at start and the file is not touched', JSON.stringify(rec));

    // B2 and B3: a marker with no kept copy
    root = tree(); roots.push(root); h = apply(root, 'app.ts', '= 1', '= 9', 'selftest'); fs.unlinkSync(path.join(pendingDir(root), files(root).find((n) => n.endsWith('.orig')))); fs.writeFileSync(path.join(root, 'app.ts'), ORIG);
    rec = recover(root);
    ok(rec.cleared.length === 1 && !rec.refused.length && read(root) === ORIG && !fs.existsSync(pendingDir(root)), 'B2 a marker with no kept copy, the file the original: cleared', JSON.stringify(rec));
    root = tree(); roots.push(root); h = apply(root, 'app.ts', '= 1', '= 9', 'selftest'); fs.unlinkSync(path.join(pendingDir(root), files(root).find((n) => n.endsWith('.orig'))));
    rec = recover(root);
    ok(rec.refused.length === 1 && /kept original is missing/.test(rec.refused[0]) && read(root).includes('= 9'), 'B3 a marker with no kept copy, the file mutated: REFUSED', JSON.stringify(rec));

    // B4: restore() removes the marker first; stop it between the two unlinks and the next start meets only an orphan
    root = tree(); roots.push(root); h = apply(root, 'app.ts', '= 1', '= 3', 'selftest');
    const realUnlink = fs.unlinkSync; let n = 0;
    fs.unlinkSync = (f) => { n += 1; if (n === 2) throw new Error('killed between the two removals'); return realUnlink(f); };
    try { h.restore(); } catch (_e) { /* the simulated kill */ } finally { fs.unlinkSync = realUnlink; }
    const left = files(root); rec = recover(root);
    ok(left.length === 1 && left[0].endsWith('.orig') && rec.orphans.length === 1 && !rec.refused.length && read(root) === ORIG,
      'B4 restore() removes the marker before the kept copy: a kill between leaves only the harmless orphan', JSON.stringify({ left, rec }));
  } finally { for (const r of roots) fs.rmSync(r, { recursive: true, force: true }); }
  console.log(`\nmutation_guard selftest · ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
