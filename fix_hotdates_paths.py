with open('src/api/public/hotDates.js', 'r') as f:
    content = f.read()

content = content.replace(
    "const asyncHandler = require('../lib/asyncHandler');",
    "const asyncHandler = require('../../lib/asyncHandler');"
)
content = content.replace(
    "const { ok: okRes, err: errRes } = require('../lib/response');",
    "const { ok: okRes, err: errRes } = require('../../lib/response');"
)

with open('src/api/public/hotDates.js', 'w') as f:
    f.write(content)

print('Fixed: src/api/public/hotDates.js')
