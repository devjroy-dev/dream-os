#!/usr/bin/env python3
"""
update_holy_grail.py — B-4 session
"""
from datetime import date

COMPLETED_BLOCK  = '| Bride B-4 | dreamos-pwa | ⬜ Next — start here |'
COMPLETED_DONE   = '| Bride B-4 | dreamos-pwa | ✅ Done |'

NEXT_BLOCK_OLD   = '| Bride B-5 | dream-os | ⬜ |'
NEXT_BLOCK_NEW   = '| Bride B-5 | dream-os | ⬜ Next — start here |'

SESSION_SUMMARY  = 'B-4 complete — journey canvases wired to real backend'

path = 'docs/DEVS_HOLY_GRAIL.md'
with open(path, 'r') as f:
    src = f.read()

changed = 0
import re

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

src = re.sub(
    r'\*\*Last updated:\*\* [^\n]+',
    f'**Last updated:** {date.today()} ({SESSION_SUMMARY})',
    src
)
print(f'✓ Last-updated: {date.today()}')
changed += 1

with open(path, 'w') as f:
    f.write(src)

print(f'\n{"✅" if changed else "⚠"} {changed} change(s) applied.')
