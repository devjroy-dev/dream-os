# Vendor Suit — the dreamai engine inside dream-os

This is the **dreamai engine** (advisory Victor + consult Victor + Donna), taken **as-is**
from `dreamai@78807dd` — the last state of the navy thedreamai.in PWA, just before `/desk`.
It is the proven artifact. **Do not rewrite it, do not hand-port it to JS, do not cherry-pick
its tools.** The value is the scar tissue; bring it whole or reopen old wounds.

Internal names are **Harvey** and **Donna** everywhere (souls, tools `dear_donna_talk`,
`donna_*`, the loop). That is the convention — keep it. Victor/Operator is only the
front-facing mask the engine applies at the display layer.

## What this is (Phase 0)
The engine source lives in `src/` (TypeScript, untouched). It compiles to CommonJS into
`dist/` and is `require()`d by dream-os **in the same process**. Nothing is wired yet —
this phase only lands the engine and proves it loads beside a still-running Myra.

## Build & prove
```
npm install                 # picks up typescript + @types + dotenv
npm run build:engine        # tsc -> src/engine/dist (CommonJS)
node src/engine/smoke.js     # inert load check (Harvey & Donna intact)
npm run typecheck:engine     # tsc --noEmit, must be clean
```

## Layout
```
src/engine/
  src/            engine source, verbatim from dreamai@78807dd (TS) — untouched
  tsconfig.json   CommonJS compile config (NodeNext .js specifiers resolve fine)
  package.json    {"type":"commonjs"} — explicit CJS island, bulletproof
  smoke.js        inert load test
  dist/           compiled output (gitignored)
```

## What is NOT done here
No dream-os route calls the engine. No migration applied. No Myra removed. The PWA is
untouched. Those are Phases 1–6 (see DREAMAI_ENGINE_INTO_DREAMOS.md).

## If something looks wrong
Suspect order: **tool → table → plumbing → soul.** Never doubt Harvey/Donna's character
without curl + SQL conviction. The souls are proven.
