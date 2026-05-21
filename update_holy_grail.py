#!/usr/bin/env python3
"""
update_holy_grail.py
Run from dream-os repo root after completing a block:
  cd /workspaces/dream-os
  python3 update_holy_grail.py

Edit the UPDATES dict below before running.
Only change what your session completed.
"""

from datetime import date

# ── EDIT THIS SECTION BEFORE RUNNING ─────────────────────────────────────────

UPDATES = {
    # Block you just completed — change ⬜ to ✅
    # Format: 'exact string to find': 'replacement string'
    '| Bride B-1 | dream-os | ⬜ Next — start here |':
    '| Bride B-1 | dream-os | ✅ Done |',

    # Move "Next — start here" to the next block
    '| Bride B-2a (Discover landing) | dreamos-pwa | ⬜ |':
    '| Bride B-2a (Discover landing) | dreamos-pwa | ⬜ Next — start here |',

    # Update last-updated line
    '**Last updated:** 2026-05-21 (Vendor port complete. Bride blocks specced. SSO wired. B-F done.)':
    f'**Last updated:** {date.today()} (B-1 complete)',
}

# ── DO NOT EDIT BELOW THIS LINE ──────────────────────────────────────────────

path = 'docs/DEVS_HOLY_GRAIL.md'

with open(path, 'r') as f:
    src = f.read()

changed = 0
for old, new in UPDATES.items():
    if old in src:
        src = src.replace(old, new)
        print(f'✓ {old[:70]}')
        changed += 1
    else:
        print(f'SKIP (not found): {old[:70]}')

with open(path, 'w') as f:
    f.write(src)

if changed > 0:
    print(f'\n✅ {changed} update(s) applied.')
    print('Commit with:')
    print('  git add docs/DEVS_HOLY_GRAIL.md')
    print('  git commit -m "docs: Holy Grail — mark block complete, advance next pointer"')
else:
    print('\nNo changes made. Check the UPDATES dict.')
