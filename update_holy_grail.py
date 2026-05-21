#!/usr/bin/env python3
"""
update_holy_grail.py
Run from dream-os repo root at the end of every session.
  cd /workspaces/dream-os
  python3 update_holy_grail.py

Edit the UPDATES dict — change only what your session completed.
"""

from datetime import date

# ── EDIT THIS SECTION ────────────────────────────────────────────────────────
# Replace the block you completed and advance the Next pointer.
# Copy the exact row text from the Holy Grail — spacing matters.

COMPLETED_BLOCK  = '| Bride B-3a (Coplanner API) | dream-os | ⬜ Next — start here |'
COMPLETED_DONE   = '| Bride B-3a (Coplanner API) | dream-os | ✅ Done |'

NEXT_BLOCK_OLD   = '| Bride B-4 | dreamos-pwa | ⬜ |'
NEXT_BLOCK_NEW   = '| Bride B-4 | dreamos-pwa | ⬜ Next — start here |'

SESSION_SUMMARY  = 'B-3a complete — coplanner API'

# ── DO NOT EDIT BELOW ────────────────────────────────────────────────────────

path = 'docs/DEVS_HOLY_GRAIL.md'
with open(path, 'r') as f:
    src = f.read()

changed = 0

if COMPLETED_BLOCK in src:
    src = src.replace(COMPLETED_BLOCK, COMPLETED_DONE)
    print(f'✓ Marked done: {COMPLETED_BLOCK[:60]}')
    changed += 1
else:
    print(f'SKIP: {COMPLETED_BLOCK[:60]}')

if NEXT_BLOCK_OLD in src:
    src = src.replace(NEXT_BLOCK_OLD, NEXT_BLOCK_NEW)
    print(f'✓ Advanced next: {NEXT_BLOCK_NEW[:60]}')
    changed += 1
else:
    print(f'SKIP: {NEXT_BLOCK_OLD[:60]}')

# Update last-updated line
import re
src = re.sub(
    r'\*\*Last updated:\*\* [^\n]+',
    f'**Last updated:** {date.today()} ({SESSION_SUMMARY})',
    src
)
print(f'✓ Last-updated: {date.today()} ({SESSION_SUMMARY})')
changed += 1

with open(path, 'w') as f:
    f.write(src)

print(f'\n{"✅" if changed else "⚠"} {changed} change(s) applied.')
if changed:
    print('\nCommit with:')
    print('  git add docs/DEVS_HOLY_GRAIL.md')
    print(f'  git commit -m "docs: Holy Grail — {SESSION_SUMMARY}"')
