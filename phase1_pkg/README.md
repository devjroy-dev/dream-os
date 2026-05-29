# DreamAi — Phase 1 package

Engine trust & disambiguation. 6 files changed, all in `src/agent/`.

## Apply

From the **dream-os repo root** in your Codespaces terminal:

```bash
unzip phase1_pkg.zip
bash phase1_pkg/apply.sh
```

The script backs up your originals (to `.phase1_backup/<timestamp>/`),
drops the new files in, runs `node --check` on each, and prints a summary.
If any file fails syntax check it auto-restores the backup and stops.

Then review and commit:

```bash
git diff
git add src/agent/
git commit -m "Phase 1: engine trust + disambiguation (honest fallback, clarify, date-precision revalidation, ambiguity gate)"
```

## Rollback

```bash
cp .phase1_backup/<timestamp>/src/agent/* src/agent/
```

## What changed

| # | Fix | Files |
|---|---|---|
| 1.1 | Honest fallback — agents no longer reply "Got it." when a turn fails | engine.js, circleEngine.js |
| 1.2 | `clarify` tool on WhatsApp vendor — numbered question before risky writes | tools.js, engine.js, systemPrompt.js |
| 1.3 | Date-precision server revalidation — invented days/months/years are erased, not stored (fixes WhatsApp + PWA) | datePrecision.js |
| 1.4 | Merged complexity+ambiguity classifier — one Haiku pre-flight call; cold ambiguous content is gated before the agent can auto-act | classifier.js, engine.js |

## Notes

- `classifyMessage` (legacy) is unchanged — bride + couple-thread paths still use it.
  Only the vendor self-thread switched to the new merged `classifyVendorMessage`.
- The ambiguity gate only fires on **cold** messages (no recent session history),
  so it won't interrupt active conversations.
- A reference `phase1.patch` is included if you'd rather `git apply` than drop files.
  (The drop-in via apply.sh is the recommended path.)
