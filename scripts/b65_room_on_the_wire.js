#!/usr/bin/env node
'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// b65 · R-41.142 · THE ROOM COMES BACK — the return leg, and the row that keeps it.
// CE-41 seat D, D3d. Cut at dream-os 69697565f2524b9d365130a243213df98145a3d7.
//
// `room` has travelled UP since F-41.98 and nothing came down. This bench guards the
// return leg: the door reports the ENGINE'S resolved value on both transports, writes
// it to the row the engine witnessed, and reads it back out again.
//
// ⚠ THE READ PATH IS ASSERTED AS HARD AS THE WRITE. Twice this sitting a cure landed
// on a write path and not its read — F-41.103 (the consent gate could never pass for
// a found prospect) and F-41.104 (the queue could never render "Consent noted") — and
// BOTH were caught by a walk, not the floor. §3 exists so this is not the third.
// ═══════════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const P = (...a) => path.join(__dirname, '..', ...a);
// A CELL THAT CANNOT SEE ITS SUBJECT MUST FAIL, NEVER THROW (seat A's close note §6).
// At an uncured tree 0159 does not exist; readFileSync would take the whole bench down
// and report ZERO failures with no verdict — the worst of both, and the exact shape
// that made §7c's first cut unusable earlier today.
const read = (rel) => (fs.existsSync(P(rel)) ? fs.readFileSync(P(rel), 'utf8') : '');
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

let pass = 0, fail = 0; const fails = [];
const ok = (label, cond) => { if (cond === true) pass++; else { fail++; fails.push(label); }
  console.log(`  ${cond === true ? 'ok  ' : 'FAIL'}  ${label}`); };
const section = (t) => console.log(`\n── ${t}`);

const DOOR = 'src/api/vendor-engine/chat.js';
const door = strip(read(DOOR));
const raw = read(DOOR);
const mig = read('db/migrations/0159_messages_room.sql');

console.log('b65 · R-41.142 — the room comes back');

section('1. the value is the ENGINE\'s, never the door\'s re-derivation');
ok('1.1 both legs read result.victor_mode, not the request\'s assertion',
   (door.match(/\(result && result\.victor_mode\) \?\? null/g) || []).length >= 2);
// The door DOES read body.room at :3213 — `roomAssert` — and must: that is F-41.98's
// design, the surface asserts and the engine decides. The first cut of this cell
// forbade `body.room` anywhere and convicted the correct line. What must never happen
// is the RESPONSE being built from the REQUEST: the client would then be told what it
// asked for rather than what happened, and a seam would draw on an assertion the
// engine had overridden. Scoped to the two response legs.
ok('1.2 the response legs are built from the RESULT, never from the request assertion',
   /done\.room = \(result &&/.test(door) && /room: \(result &&/.test(door)
   && !/done\.room = .*body\.room/.test(door) && !/room: .*body\.room/.test(door));
ok('1.2b the door still reads body.room to ASSERT into the engine (F-41.98 intact)',
   /const roomAssert = body\.room === 'advisor'/.test(door));
ok('1.3 consult is carried as null, NEVER folded to business',
   !/victor_mode\s*\|\|\s*'business'/.test(door) && !/\?\?\s*'business'/.test(door));

section('2. both transports, or neither');
ok('2.1 the stream\'s done event carries it', /done\.room = \(result && result\.victor_mode\) \?\? null;/.test(door));
ok('2.2 the non-stream JSON reply carries it', /room: \(result && result\.victor_mode\) \?\? null,/.test(door));

section('3. THE READ PATH — F-41.103 and F-41.104 were both this, one door over');
ok('3.1 the history query SELECTS room', /\.select\('id, role, content, created_at, room'\)/.test(door));
ok('3.2 and the map carries it OUT — selecting then dropping it is the same defect with a step',
   /room: m\.room \?\? null/.test(door));

section('4. the row is written by the id the ENGINE witnessed');
ok('4.1 recordMessageRoom exists and updates engine.messages', /async function recordMessageRoom/.test(door)
   && /from\('messages'\)\.update\(\{ room \}\)/.test(door));
ok('4.2 it keys on assistant_message_id, never "the newest row for this conversation"',
   /\.eq\('id', id\)/.test(door) && !/order\('created_at'[^)]*\)[\s\S]{0,80}update\(\{ room \}/.test(door));
ok('4.3 no id → it writes nothing rather than guessing one',
   /const id = result && result\.assistant_message_id;\s*if \(!id\) return;/.test(door));
ok('4.4 a failure NEVER fails the turn — the reply is already given',
   /catch \(e\) \{ console\.warn\('\[door:message-room\]'/.test(door));
ok('4.5 it is wired at BOTH reply sites, once each',
   (door.match(/await recordMessageRoom\(req\.app\.locals\.supabase, result\);/g) || []).length === 2);

section('5. 0159 — two words, and NULL is consult');
ok('5.1 the column is nullable text with a CHECK on exactly two words',
   /add column if not exists room text/.test(mig)
   && /room in \('advisor', 'business'\)/.test(mig)
   && /room is null or/.test(mig));
ok('5.2 consult is NOT admitted as a string — absence is the value',
   !/'consult'/.test(mig.replace(/--.*$/gm, '')));
ok('5.3 the migration says out loud that NULL must never fold to business',
   /NEVER FOLD NULL TO 'business'/.test(mig));

console.log(`\n${fail ? 'RED' : 'GREEN'} — b65_room_on_the_wire ${pass}/${pass + fail}`);
if (fail) { console.log('FAILED: ' + fails.join(' · ')); process.exit(1); }
