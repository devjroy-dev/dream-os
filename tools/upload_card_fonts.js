#!/usr/bin/env node
// tools/upload_card_fonts.js — ONE-TIME. Uploads the two estate faces the post
// cards are rendered in (src/lib/vendor/postCards.js CARD_FONTS) to Cloudinary.
// CE-42 seat R6, packet 4b-1 · ruling 2 ("estate fonts uploaded once — a numbered
// founder step").
//
//   node tools/upload_card_fonts.js
//
// ═══ WHY IT ASKS INSTEAD OF READING ENV ══════════════════════════════════════
// The Cloudinary keys live on Railway, not in the Codespace. The secrets law is
// that a credential never lands in a transcript, a shell history or a file, so
// this tool ASKS for the three values and reads the secret with the echo off.
// Nothing is printed back and nothing is written to disk.
//
// ═══ WHAT CLOUDINARY REQUIRES (its "Custom fonts" page, read 2026-09-10) ═════
// A custom text-overlay font is a RAW, AUTHENTICATED upload, addressed in the
// overlay by its full public_id INCLUDING the extension; .woff2 is accepted; a
// custom font's public_id may not contain an underscore. The names below are
// CARD_FONTS' names — one constant, required from the arm, never retyped.
//
// ═══ SAFE TO RUN TWICE ═══════════════════════════════════════════════════════
// overwrite:false — a second run reports ALREADY THERE and changes nothing.
//
// LOCATION: tools/, deliberately NOT scripts/. run-floor.sh runs every
// scripts/*.js, and a floor that tried a live upload would be the wrong kind of red.
'use strict';

const path = require('path');
const readline = require('readline');
const { CARD_FONTS } = require('../src/lib/vendor/postCards');

const DIR = path.join(__dirname, 'card_fonts');
const FILES = [
  { file: 'CormorantGaramond-Medium.woff2', public_id: CARD_FONTS.display },
  { file: 'DMSans-Medium.woff2',            public_id: CARD_FONTS.body },
];

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = function (s) { if (s.includes(question)) rl.output.write(s); };
    }
    rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(String(answer || '').trim()); });
  });
}

(async () => {
  const cloud_name = await ask('Cloudinary cloud name: ');
  const api_key    = await ask('Cloudinary API key: ');
  const api_secret = await ask('Cloudinary API secret (hidden): ', { hidden: true });
  if (!cloud_name || !api_key || !api_secret) { console.log('STOP — all three values are needed.'); process.exit(1); }

  const cloudinary = require('cloudinary').v2;
  let failed = 0;
  for (const f of FILES) {
    try {
      const r = await cloudinary.uploader.upload(path.join(DIR, f.file), {
        cloud_name, api_key, api_secret,
        resource_type: 'raw', type: 'authenticated', public_id: f.public_id,
        overwrite: false,
      });
      console.log(`${r.existing ? 'ALREADY THERE' : 'UPLOADED'}  ${r.public_id}  (${r.type}, ${r.resource_type})`);
    } catch (e) {
      failed++;
      // Cloudinary's own message, never the request — the request carries the secret.
      console.log(`FAILED  ${f.public_id}  ${(e && (e.message || (e.error && e.error.message))) || 'unknown error'}`);
    }
  }
  console.log(failed ? `STOP — ${failed} upload(s) failed; paste this output back.` : 'DONE — both faces are on Cloudinary.');
  process.exit(failed ? 1 : 0);
})();
