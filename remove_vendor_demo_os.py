#!/usr/bin/env python3
"""
remove_vendor_demo_os.py
Run in /workspaces/dream-os

Removes all vendor demo code from dream-os:
1. src/api/admin/demo.js — delete entire file
2. src/api/public/demo.js — delete entire file
3. src/api/public/demoChat.js — delete entire file
4. src/api/public/vendor.js — delete entire file (public vendor demo endpoint)
5. src/api/router.js — remove demo route registrations
6. src/cron.js — remove demo expiry cron job
7. src/index.js — remove demo subdomain from CORS
8. db/migrations/0056_remove_demo_columns.sql — drop demo columns from vendors
"""

import sys, subprocess, os
from pathlib import Path

BASE = Path('.')

def read(p): return (BASE / p).read_text()
def write(p, t): (BASE / p).write_text(t)

def patch(p, old, new, label):
    t = read(p)
    if old not in t:
        print(f'  MISS [{label}]')
        print(f'  Looking for: {repr(old[:80])}')
        sys.exit(1)
    write(p, t.replace(old, new, 1))
    print(f'  OK   [{label}]')

def delete_file(p, label):
    path = BASE / p
    if path.exists():
        path.unlink()
        print(f'  OK   [deleted {p}]')
    else:
        print(f'  SKIP [{p} already gone]')

print('\n── 1. Delete demo API files ─────────────────────────────────────────────')
delete_file('src/api/admin/demo.js',     'admin/demo.js')
delete_file('src/api/public/demo.js',    'public/demo.js')
delete_file('src/api/public/demoChat.js','public/demoChat.js')
delete_file('src/api/public/vendor.js',  'public/vendor.js')

print('\n── 2. src/api/router.js — remove demo routes ───────────────────────────')
patch('src/api/router.js',
    "router.use('/admin/demo',           require('./admin/demo'));\n",
    '',
    'remove admin/demo route'
)

# Remove the public demo block
p_router = BASE / 'src/api/router.js'
t_router = p_router.read_text()

# Remove public demo route block
import re
t_router = re.sub(
    r"// Public vendor demo endpoint\n.*?require\('./public/vendor'\)\);\n",
    '',
    t_router, flags=re.DOTALL
)
t_router = re.sub(
    r"// Public demo session.*?demoAdminRouter\(req, res, next\);\n\}\);\n",
    '',
    t_router, flags=re.DOTALL
)
# Remove demoAdminRouter variable
t_router = re.sub(
    r"const demoAdminRouter = require\('./admin/demo'\);\n",
    '',
    t_router
)
p_router.write_text(t_router)
print('  OK   [removed public demo routes from router.js]')

print('\n── 3. src/cron.js — remove demo expiry job ─────────────────────────────')
p_cron = BASE / 'src/cron.js'
t_cron = p_cron.read_text()

# Remove the demo expiry cron function and its scheduling
t_cron = re.sub(
    r"\n// .*demo.*\nasync function.*?demo.*?\{.*?\}\n",
    '',
    t_cron, flags=re.DOTALL | re.IGNORECASE
)

# Remove demo expiry from cron schedule
t_cron = re.sub(
    r".*demo.*expir.*\n",
    '',
    t_cron, flags=re.IGNORECASE
)

# Update the console.log that mentions demo expiry hourly
t_cron = t_cron.replace(
    "console.log('[cron] jobs registered: morning briefing at 08:00 IST (02:30 UTC), demo expiry hourly, collab expiry at 03:15 IST');",
    "console.log('[cron] jobs registered: morning briefing at 08:00 IST (02:30 UTC), collab expiry at 03:15 IST');"
)
p_cron.write_text(t_cron)
print('  OK   [removed demo expiry cron]')

print('\n── 4. src/index.js — remove demo subdomain from CORS ───────────────────')
patch('src/index.js',
    "  'https://demo.thedreamwedding.in',\n",
    '',
    'remove demo subdomain from CORS'
)

print('\n── 5. DB migration — drop demo columns ─────────────────────────────────')
migration = """-- 0056_remove_demo_columns.sql
-- Remove vendor demo system columns.
-- Demo feature deleted: used real JWTs + phone numbers causing session contamination.
-- Bride demo (tdw_bride_demo_session in localStorage) is unaffected.

ALTER TABLE vendors
  DROP COLUMN IF EXISTS demo_handle,
  DROP COLUMN IF EXISTS demo_active,
  DROP COLUMN IF EXISTS demo_expires_at,
  DROP COLUMN IF EXISTS demo_created_at,
  DROP COLUMN IF EXISTS demo_session_token,
  DROP COLUMN IF EXISTS demo_session_expires_at,
  DROP COLUMN IF EXISTS demo_notes,
  DROP COLUMN IF EXISTS demo_instagram;

-- Also remove the demo_profile_views table if it exists
DROP TABLE IF EXISTS demo_profile_views;
"""
write('db/migrations/0056_remove_demo_columns.sql', migration)
print('  OK   [created 0056_remove_demo_columns.sql]')

print('\n── 6. Validate JS syntax ────────────────────────────────────────────────')
files = ['src/api/router.js', 'src/cron.js', 'src/index.js']
result = subprocess.run(['node', '--check'] + files, capture_output=True, text=True)
if result.returncode == 0:
    print('  ALL FILES CLEAN \u2713')
else:
    print('  ERRORS:')
    print(result.stderr)
    sys.exit(1)

print('\n\u2705  dream-os vendor demo removed. Commit with:')
print('  git add -A')
print('  git commit -m "chore: remove vendor demo system from dream-os"')
print('  git push')
