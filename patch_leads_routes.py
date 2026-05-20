import os

with open('src/api/vendor/leads.js', 'r') as f:
    content = f.read()

# Remove the scattered requires that were added inline
content = content.replace(
    "\nconst { createLead } = require('../../lib/vendor/leads');\nconst asyncHandler   = require('../../lib/asyncHandler');\nconst { ok: okRes, err: errRes } = require('../../lib/response');\n\nrouter.post",
    "\nrouter.post"
)
content = content.replace(
    "\nconst { updateLead } = require('../../lib/vendor/leads');\n\nrouter.patch('/:leadId',",
    "\nrouter.patch('/:leadId',"
)
content = content.replace(
    "\nconst { getLeadDetail } = require('../../lib/vendor/leads');\n\nrouter.get('/:leadId/detail',",
    "\nrouter.get('/:leadId/detail',"
)

# Add clean requires at the top, after the existing requires block
old_requires = "const ALLOWED_STATES         = ['new', 'contacted', 'quoted', 'booked', 'lost'];"
new_requires = (
    "const asyncHandler   = require('../../lib/asyncHandler');\n"
    "const { ok: okRes, err: errRes } = require('../../lib/response');\n"
    "const { createLead, updateLead, loseLead, getLeadDetail } = require('../../lib/vendor/leads');\n"
    "\n"
    + old_requires
)
content = content.replace(old_requires, new_requires, 1)

with open('src/api/vendor/leads.js', 'w') as f:
    f.write(content)

print('Cleaned: src/api/vendor/leads.js')
