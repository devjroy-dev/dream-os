import re

p = 'docs/DEVS_HOLY_GRAIL.md'
with open(p) as f: c = f.read()

# Update last updated
c = c.replace(
    "**Last updated:** 2026-05-22 (B-4 complete — journey canvases wired, CRUD endpoints, vendor auth SSO fix, circle deferred)",
    "**Last updated:** 2026-05-22 (B-4 extended — Circle scrapbook + My People + member feed + Moments placeholder + journey CRUD + dreamai/frost text selection fix + light mode contrast)"
)

# Add coding debt
old = "| Instagram DM lead capture | Low |"
new = """| Instagram DM lead capture | Low |
| Circle member delete REST endpoint — no `DELETE /couple/circle/:memberId` exists. Cleanup via Supabase SQL only. | Medium — pre-launch |
| Moments — photograph classification branch not yet in imagePipeline. personal photos vs product saves need separation. | Medium — B-Moments block |"""
c = c.replace(old, new)

with open(p, 'w') as f: f.write(c)
print("Holy Grail updated.")
