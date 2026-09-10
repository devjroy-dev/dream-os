#!/usr/bin/env node
'use strict';
// tools/f42148_rebind.js — D-prime · THE ONE MIS-BIND, REPAIRED. (R-42.4)
// CE-42 seat E. Authorised in SHAPE by the chair on a class SELECT that read ONE ROW.
//
// ═══ WHAT IS WRONG ═══════════════════════════════════════════════════════════
//   auth.users   ce496223-e460-40b4-b457-afe30841f310   phone 918757788550
//   public.users 3c8eb9e0-e746-4d95-9630-17897aa64f05   phone +919999900550  "Droy"
// The identity for ONE number is bound to a users row for ANOTHER. Both born
// 2026-06-23, twenty-one seconds apart, in the dead browser-OTP era. Droy holds
// the only key to a door that is not his, and +918757788550 (users
// f0fc38c5-ac73-41c2-92dd-48a0d2e858b1) is DETERMINISTICALLY locked out:
// createUser can never succeed, the heal always finds ce496223, the bind always
// collides on users_auth_user_id_key.
//
// ═══ MINT BEFORE CLEAR — THE RULED ORDER, AND WHY IT IS NOT THE OBVIOUS ONE ══
// The obvious order is "unbind Droy, then give the identity to its owner". That
// leaves Droy holding ZERO identities in the gap, and he has no other: the second
// read returned no auth row for 919999900550 at all. If anything failed after the
// clear, the founder's own account would join the locked-out set — two accounts
// down instead of one.
// So: MINT Droy his own identity FIRST, verify it, and move his row onto it in a
// SINGLE UPDATE. old id -> new id, never null in between. That one write both
// rebinds Droy and releases ce496223.
//
// ═══ WHAT THIS SCRIPT DOES NOT DO ════════════════════════════════════════════
// It does NOT bind ce496223 to f0fc38c5. Once released, `ensureAuthIdentity`'s
// own heal path binds it at that account's next verify-otp — the arm already does
// this correctly and a second writer here would be a second opinion on a law the
// estate already holds. One write, not two.
//
// ═══ SAFETY ══════════════════════════════════════════════════════════════════
// DRY RUN IS THE DEFAULT. `--live` is required to write, and even then every
// precondition is re-checked against the live rows immediately before the write —
// never from this header, which is a description and not evidence.
// Reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY FROM THE ENVIRONMENT. Run it
// where the key already lives (the Railway shell). Never paste a key.

const { createClient } = require('@supabase/supabase-js');

const AUTH_ID    = 'ce496223-e460-40b4-b457-afe30841f310';
const HOLDER_ID  = '3c8eb9e0-e746-4d95-9630-17897aa64f05';   // Droy, +919999900550
const CLAIMANT   = 'f0fc38c5-ac73-41c2-92dd-48a0d2e858b1';   // +918757788550
const HOLDER_PH  = '+919999900550';
const CLAIM_TEN  = '8757788550';
const HOLDER_TEN = '9999900550';

const LIVE = process.argv.includes('--live');
const ten  = (p) => String(p == null ? '' : p).replace(/\D/g, '').slice(-10);
const say  = (...a) => console.log(...a);

function stop(msg) {
  say('');
  say('  STOP — PRECONDITION FAILED');
  say(`  ${msg}`);
  say('  Nothing was written. Paste this whole output back before anything else.');
  process.exit(1);
}

(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) stop('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in this shell.');

  const db = createClient(url, key, { auth: { persistSession: false } });

  say('');
  say('════════════════════════════════════════════════════════════');
  say(`  F-42.148 REBIND — ${LIVE ? '*** LIVE RUN — THIS WILL WRITE ***' : 'DRY RUN (no writes)'}`);
  say('════════════════════════════════════════════════════════════');

  // ── 1 · the two public.users rows, read fresh ──────────────────────────────
  const { data: rows, error: rowsErr } = await db
    .from('users').select('id, phone, name, auth_user_id').in('id', [HOLDER_ID, CLAIMANT]);
  if (rowsErr) stop(`users read failed: ${rowsErr.message}`);

  const holder   = (rows || []).find((r) => r.id === HOLDER_ID);
  const claimant = (rows || []).find((r) => r.id === CLAIMANT);
  if (!holder)   stop(`the holder row ${HOLDER_ID} is gone. The estate has changed since this was written.`);
  if (!claimant) stop(`the claimant row ${CLAIMANT} is gone. The estate has changed since this was written.`);

  say('  HOLDER    ' + `${holder.id}  ${holder.phone}  ${holder.name || '(no name)'}`);
  say('            auth_user_id = ' + (holder.auth_user_id || 'null'));
  say('  CLAIMANT  ' + `${claimant.id}  ${claimant.phone}`);
  say('            auth_user_id = ' + (claimant.auth_user_id || 'null'));
  say('');

  if (holder.auth_user_id !== AUTH_ID) {
    stop(`the holder no longer holds ${AUTH_ID} (it holds ${holder.auth_user_id || 'null'}). Already repaired, or repaired differently.`);
  }
  if (claimant.auth_user_id) {
    stop(`the claimant is ALREADY bound to ${claimant.auth_user_id}. Nothing to repair.`);
  }
  if (ten(holder.phone) !== HOLDER_TEN) {
    stop(`the holder's phone is ${holder.phone}, not ${HOLDER_PH}. This script is pinned to one pair.`);
  }
  if (ten(claimant.phone) !== CLAIM_TEN) {
    stop(`the claimant's phone is ${claimant.phone}, which does not end ${CLAIM_TEN}.`);
  }

  // ── 2 · nobody may already own the holder's own number ─────────────────────
  // If an identity for 919999900550 exists, createUser below would fail and the
  // repair shape is different. The second read said none exists; this re-asks,
  // because a read from an hour ago is not evidence about a write happening now.
  let existingForHolder = null;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) stop(`listUsers failed: ${error.message}`);
    const us = (data && data.users) || [];
    const hit = us.find((u) => u && u.phone && ten(u.phone) === HOLDER_TEN);
    if (hit) { existingForHolder = hit; break; }
    if (us.length < 200) break;
  }
  if (existingForHolder) {
    stop(`an auth identity for ${HOLDER_PH} ALREADY EXISTS (${existingForHolder.id}). ` +
         'Minting a second would be the very bug this estate protects against. ' +
         'The repair is then a single UPDATE onto that id — re-rule before running.');
  }
  say(`  CHECKED   no auth identity exists for ${HOLDER_PH} — safe to mint one`);

  // ── 3 · the identity being released ────────────────────────────────────────
  const { data: authRow, error: authErr } = await db.auth.admin.getUserById(AUTH_ID);
  if (authErr) stop(`getUserById(${AUTH_ID}) failed: ${authErr.message}`);
  const au = authRow && authRow.user;
  if (!au) stop(`auth identity ${AUTH_ID} does not exist.`);
  if (ten(au.phone) !== CLAIM_TEN) {
    stop(`auth ${AUTH_ID} has phone ${au.phone}, which does not end ${CLAIM_TEN}. Do not move it.`);
  }
  say(`  RELEASING ${AUTH_ID}  phone ${au.phone}  email ${au.email || '(none)'}`);
  say('            its email is keyed to the IDENTITY, not to the holder, so it stays correct');
  say('');

  // ── 4 · the plan ───────────────────────────────────────────────────────────
  say('  PLAN');
  say(`   1. admin.createUser({ phone: '${HOLDER_PH}', phone_confirm: true })  — no SMS`);
  say(`   2. ONE update: users ${HOLDER_ID}.auth_user_id  ${AUTH_ID}  ->  <new id>`);
  say('      old id -> new id in a single write. Droy never holds zero identities.');
  say(`   3. ${AUTH_ID} is then unheld. ensureAuthIdentity heals ${CLAIMANT}`);
  say('      onto it at that account\'s next verify-otp. THIS SCRIPT DOES NOT DO THAT.');
  say('');

  if (!LIVE) {
    say('  DRY RUN — nothing was written. Every precondition above passed.');
    say('  Paste this output back. Re-run with --live only when told to.');
    return;
  }

  // ── 5 · live ───────────────────────────────────────────────────────────────
  const { data: made, error: makeErr } =
    await db.auth.admin.createUser({ phone: HOLDER_PH, phone_confirm: true });
  if (makeErr) stop(`createUser failed, NOTHING was changed: ${makeErr.message}`);
  const newId = made && made.user && made.user.id;
  if (!newId) stop('createUser returned no id. NOTHING was changed.');
  say(`  MINTED    ${newId} for ${HOLDER_PH}`);

  const { error: updErr } = await db
    .from('users').update({ auth_user_id: newId }).eq('id', HOLDER_ID).eq('auth_user_id', AUTH_ID);
  if (updErr) {
    say('');
    say('  ⚠ THE MINT SUCCEEDED AND THE REBIND DID NOT.');
    say(`  ⚠ auth identity ${newId} now exists for ${HOLDER_PH} and is bound to NOBODY.`);
    say(`  ⚠ users ${HOLDER_ID} still holds ${AUTH_ID} — Droy is NOT broken.`);
    say(`  ⚠ Paste this whole output back. Do not re-run: a second run would refuse at`);
    say('  ⚠ step 2 having found the identity it just minted, which is the correct refusal.');
    stop(`rebind failed: ${updErr.message}`);
  }

  const { data: after } = await db
    .from('users').select('id, phone, auth_user_id').in('id', [HOLDER_ID, CLAIMANT]);
  say('');
  say('  DONE');
  for (const r of (after || [])) say(`   ${r.id}  ${r.phone}  auth_user_id = ${r.auth_user_id || 'null'}`);
  say('');
  say(`  ${AUTH_ID} is now unheld.`);
  say(`  ${CLAIMANT} (+91${CLAIM_TEN}) heals onto it at its next verify-otp — no SQL needed.`);
  say('  Walk it: request an OTP on that number and sign in.');
})().catch((e) => {
  say('');
  say(`  THREW: ${(e && e.message) || e}`);
  say('  Paste this output back before doing anything else.');
  process.exit(1);
});
