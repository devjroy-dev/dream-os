#!/usr/bin/env node
'use strict';
// tools/lc2_seed_json.js — TDW · CE-43 · LC-2 · regenerates db/seeds/package_seeds.json
// from the founder-vetoed source. Run from anywhere:  node tools/lc2_seed_json.js
// The JSON is committed; b81 asserts it equals this parse, so re-run after any
// source edit (a source edit is itself a founder veto act, R-43.10).
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const { parseSeedSource } = require(path.join(root, 'src/lib/vendor/packageSeedParse'));
const src = fs.readFileSync(path.join(root, 'db/seeds/package_seeds.source.txt'), 'utf8');
const out = { generated_by: 'tools/lc2_seed_json.js', source: 'db/seeds/package_seeds.source.txt', categories: parseSeedSource(src) };
fs.writeFileSync(path.join(root, 'db/seeds/package_seeds.json'), JSON.stringify(out, null, 2) + '\n');
const n = out.categories.reduce((s, c) => s + c.options.length, 0);
console.log(`wrote db/seeds/package_seeds.json: ${out.categories.length} categories, ${n} options`);
