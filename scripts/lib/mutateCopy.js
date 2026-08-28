// scripts/lib/mutateCopy.js — ONE HOME for mutating a copy instead of production
// source. F-19.18 (pwa) and F-38.38 (dream-os) are the same finding in two repos;
// this file and `dream-os/scripts/lib/mutateCopy.js` are the same shape in two
// module systems, the way `stripComments` already is.
//
// ── WHAT WENT WRONG, IN BOTH REPOS, AND WHY A `finally` IS NOT THE CURE ──────
//
// The estate's non-vacuity doctrine is right and the benches implement it
// correctly: mutate real production source, run the cells in a fresh process,
// assert they go RED, restore in a `finally`, then assert the restore was
// byte-identical. Read on the page it is airtight.
//
// A `finally` GUARDS A THROW. IT DOES NOT GUARD A SIGNAL. `timeout`, Ctrl-C, an
// OOM kill, a codespace restart — the process ends before the restore runs and
// production source is left holding the mutation. The bench's own restoration
// cell cannot catch it, because the process that would run it is gone.
//
// Both repos have now been bitten, on real seats, in ways that cost days:
//
//   F-19.18 · `app/coplanner/CircleSessionContext.tsx` kept an injected
//   `permissions: { can_see_budget: boolean };` from `tdw07_f0772_circle`'s
//   mutation leg. The bench then reddened ITSELF on the vocabulary it had
//   planted. Withdrawing the delivery did not clear it — the contamination
//   survived the withdrawal — so the red read as somebody else's for a full
//   sitting.
//
//   F-38.38 · `src/engine/src/core/donna.ts` kept `stampOf(it)` stripped from a
//   vendor-facing line by `b06_m1_bench.js`. That diff is PLAUSIBLE: a dropped
//   timestamp reads as a deliberate copy edit, not as corruption, and it would
//   have survived review.
//
// ── THE SHAPE, AND WHY IT IS THE COPY AND NOT A SIGNAL HANDLER ───────────────
//
// F-38.38 priced both cures and preferred this one in its own words: *a bench
// that never writes to production source cannot leave it dirty however it dies.*
// A `process.on('SIGTERM')` restore is strictly better than nothing, but it is
// still a race — SIGKILL takes no handler, and a handler that throws mid-restore
// leaves a half-written file, which is worse than the mutation it was curing.
//
// So the mutation happens in a SHADOW TREE and production source is never opened
// for writing at all. The shadow is a symlink farm: every top-level entry of the
// repo is a symlink back to the real one, so the child process reads the real
// tree for everything it does not mutate and pays no copy cost for it. Only the
// path down to a mutated file is materialised — the directories become real
// directories of symlinks, and the mutated file itself becomes a real file with
// the mutated bytes. A tree of eleven thousand files costs one directory of
// links plus one real file per mutation.
//
// THE SIGNAL ARM SURVIVES ANYWAY, and it is not redundant: `dispose()` is wired
// to SIGINT/SIGTERM/SIGHUP/SIGQUIT and to `exit`, so a killed run removes its own
// shadow instead of leaving temp dirs behind. The difference is what a MISSED
// dispose costs. Under the old shape it cost production source. Under this one it
// costs an orphaned directory in `os.tmpdir()`, which the OS reaps and no
// `git status` will ever show.
//
// ── WHAT THIS DELIBERATELY DOES NOT DO ──────────────────────────────────────
//
// It does not convert any bench by itself, and the two conversions shipped
// beside it are the two that were actually bitten. A 51-file sweep of the
// estate's safety machinery was priced and refused at CE-38 S3: a mass edit
// whose own non-vacuity cannot be proven in one sitting is exactly the shape
// D-38.1 warns about, and the machinery being swept is the machinery that
// catches everything else. Benches adopt this as they are touched, and each
// conversion proves its own non-vacuity at its own site.
//
// CommonJS here and ESM in the pwa, matching each repo's own `scripts/lib/`
// convention (`stripComments.js` / `stripComments.mjs`). Same API, same words,
// same reasons — a reader who has read one has read both.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * A shadow of `root` in which files may be mutated without ever writing to the
 * real tree.
 *
 * Usage, and it is deliberately the same three lines in both repos:
 *
 *   const shadow = createShadow(ROOT);
 *   try {
 *     shadow.write('app/x/y.tsx', mutatedBytes);
 *     spawnSync(process.execPath, [shadow.path('scripts/b.mjs')], { cwd: shadow.root });
 *   } finally { shadow.dispose(); }
 *
 * `shadow.root` is what the child sees as the repo root, because the bench
 * inside it resolves ROOT from its own the module's own resolved path — which now lives in
 * the shadow. Nothing in the bench has to know it is being shadowed, and that
 * is the property that makes the conversion small enough to prove.
 */
function createShadow(root, { prefix = 'tdw-shadow-' } = {}) {
  const real = path.resolve(root);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));

  // ── THE FARM. Top level only, and `.git` is NOT among them.
  //
  // A symlinked `.git` would make every `git` call inside the shadow report on
  // the REAL repository while standing in a directory whose worktree it does not
  // describe — so `git status` would answer questions about a tree the caller is
  // not in. That is a worse failure than the absence: absent, `git` refuses out
  // loud and a bench that needs git in the shadow finds out immediately. Present
  // and lying, it would launder a wrong answer into a verdict, which is the one
  // outcome this whole file exists to prevent.
  //
  // `node_modules` IS linked, because the child has to resolve its imports and a
  // dependency tree is not something a shadow should have a second copy of.
  for (const entry of fs.readdirSync(real)) {
    if (entry === '.git') continue;
    fs.symlinkSync(path.join(real, entry), path.join(dir, entry));
  }

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    // `force` so a dispose during teardown cannot itself throw and mask the
    // failure the caller was already reporting.
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* orphan in tmp — harmless */ }
  };

  // ── THE SIGNAL ARM. See the header: this protects the TEMP DIR, not the
  // source. It is cheap and it keeps a killed floor run from silting up tmp
  // across a long sitting.
  //
  // The handlers re-raise rather than exiting, so a Ctrl-C still reads to the
  // shell as a Ctrl-C. A helper that swallows SIGINT and exits 0 would teach the
  // runner that an interrupted floor passed, and the whole estate reads exit
  // codes as verdicts.
  const onSignal = (sig) => () => {
    dispose();
    process.removeAllListeners(sig);
    process.kill(process.pid, sig);
  };
  const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'];
  const wired = SIGNALS.map((s) => [s, onSignal(s)]);
  for (const [s, h] of wired) process.on(s, h);
  process.on('exit', dispose);

  /**
   * Materialise the path down to `rel` and write `content` there. Everything not
   * on this path stays a symlink to the real tree.
   *
   * The unfolding is the whole trick and it is worth stating plainly: a
   * directory on the path cannot stay a symlink, because writing through it
   * would write into the REAL directory it points at — which is the defect, not
   * the cure. So each one is replaced by a real directory whose entries are
   * symlinks to the real directory's entries, and the walk continues inside it.
   */
  const write = (rel, content) => {
    const parts = rel.split('/').filter(Boolean);
    let here = dir;
    let realHere = real;
    for (const seg of parts.slice(0, -1)) {
      here = path.join(here, seg);
      realHere = path.join(realHere, seg);
      const st = fs.lstatSync(here, { throwIfNoEntry: false });
      if (st && st.isSymbolicLink()) {
        fs.unlinkSync(here);
        fs.mkdirSync(here);
        for (const entry of fs.readdirSync(realHere)) {
          fs.symlinkSync(path.join(realHere, entry), path.join(here, entry));
        }
      } else if (!st) {
        fs.mkdirSync(here, { recursive: true });
      }
    }
    const leaf = path.join(here, parts[parts.length - 1]);
    // The leaf is a symlink to production source on first write. Unlinking it
    // first is not tidiness — writing through it would follow it home.
    if (fs.lstatSync(leaf, { throwIfNoEntry: false })) fs.unlinkSync(leaf);
    fs.writeFileSync(leaf, content);
    return leaf;
  };

  /**
   * Run a bench INSIDE the shadow. Every converted bench goes through this and
   * none of them spawns `node` itself, for one reason:
   *
   * ── F-38.42 · NODE RESOLVES SYMLINKS, SO A SHADOW IS ESCAPED BY DEFAULT ────
   *
   * Node canonicalises the main module's path before it sets the module's own resolved path.
   * The bench inside the shadow is a symlink to the real file, so without the
   * two flags below the module's own resolved path reports the REAL path, `ROOT` resolves to
   * the REAL repository, and the child reads production source while standing in
   * the shadow. Every mutation cell then reports GREEN — because the mutated
   * bytes are in a tree nobody read.
   *
   * That is a HOLLOW GREEN of the purest kind: a non-vacuity leg that proves
   * nothing while printing the same line it prints when it proves everything.
   * It was found by running it, not by reading it — `tdw07_f0772_circle` came
   * back `GREEN 102/102` with M-22b live in the shadow, and the flags turned the
   * same run into `RED 100/102` with `FAIL §14.5b` on the nose.
   *
   * So the flag pair is not a caller's option. It lives here, the helper owns
   * it, and a bench cannot get it wrong by forgetting it.
   */
  const exec = (rel, args = [], opts = {}) => spawnSync(
    process.execPath,
    ['--preserve-symlinks', '--preserve-symlinks-main', path.join(dir, rel), ...args],
    { encoding: 'utf8', cwd: dir, ...opts },
  );


  /**
   * Materialise a DIRECTORY in the shadow without writing any file in it.
   *
   * ── WHY THIS EXISTS, AND IT IS NOT A CONVENIENCE ────────────────────────────
   *
   * `write()` unfolds only the directories on the path to the file it writes.
   * Everything else stays a symlink to production — which is the whole economy of
   * the farm, and also a trap the moment a bench does anything but read.
   *
   * `b06_m1_bench` runs `npm run build` between the mutation and the child, because
   * the child imports `dist` rather than the TypeScript. `tsc -p src/engine/tsconfig.json`
   * has `outDir: "dist"`, which resolves to `src/engine/dist`. If the run's mutations
   * happen to live under `src/engine/`, `write()` will already have unfolded that
   * directory and the build lands safely inside the shadow. IF THEY DO NOT, `src` is
   * still a symlink, `src/engine/dist` resolves THROUGH IT, and the build writes
   * compiled output straight into production.
   *
   * That leak would not show in `git status` — build output is untracked or ignored —
   * so it is the same class of silent defect as F-19.18 with the one witness removed.
   * The first shadow build in this repo passed only because its mutation path happened
   * to cover the output directory. A property that holds by coincidence is not a
   * property, so a bench that builds inside a shadow names its output directory here
   * and stops depending on where its mutations happen to fall.
   */
  const unfold = (rel) => {
    const parts = rel.split('/').filter(Boolean);
    let here = dir;
    let realHere = real;
    for (const seg of parts) {
      here = path.join(here, seg);
      realHere = path.join(realHere, seg);
      const st = fs.lstatSync(here, { throwIfNoEntry: false });
      if (st && st.isSymbolicLink()) {
        fs.unlinkSync(here);
        fs.mkdirSync(here);
        if (fs.existsSync(realHere)) {
          for (const entry of fs.readdirSync(realHere)) {
            fs.symlinkSync(path.join(realHere, entry), path.join(here, entry));
          }
        }
      } else if (!st) {
        fs.mkdirSync(here, { recursive: true });
      }
    }
    return here;
  };
  return {
    root: dir,
    exec,
    unfold,
    /** Absolute path INSIDE the shadow for a repo-relative path. */
    path: (rel) => path.join(dir, rel),
    /** Bytes of a repo-relative file, read through the shadow. */
    read: (rel) => fs.readFileSync(path.join(dir, rel), 'utf8'),
    write,
    dispose,
  };
}

/**
 * The assertion every converted bench owes, in one home so it is worded once.
 *
 * A bench that mutates a copy must still prove it did not touch the original —
 * otherwise the conversion is a claim rather than a property, and this estate
 * has been burned by exactly that difference. Call it after the mutation leg
 * with the repo-relative paths that were mutated.
 */
function assertUntouched(root, rels, originals) {
  const moved = rels.filter((rel) => fs.readFileSync(path.join(root, rel), 'utf8') !== originals.get(rel));
  if (moved.length) {
    throw new Error('production source MOVED during a mutate-a-copy run: ' + moved.join(', '));
  }
  return true;
}

module.exports = { createShadow, assertUntouched };
