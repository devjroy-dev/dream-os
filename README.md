# dream-os


## Boot truth (verified 2026-07-14, TDW_01 Phase A)
- Railway service `dream-os` (production): **no custom start command** -> `npm start` -> `node src/index.js`.
- Railway service `dream-wedding` (production, same project): custom start command `node src/brideIndex.js`.
- Root `index.js` was a stale fork of `src/index.js` (Session-5 era) — deleted in TDW_01 Phase A. Nothing requires it.
