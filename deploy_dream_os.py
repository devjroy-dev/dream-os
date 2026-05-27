#!/usr/bin/env python3
"""
deploy_dream_os.py
Run this in /workspaces/dream-os to apply all unified onboarding changes.

Files modified:
  src/agent/onboarding.js       — new asked_name + asked_ig states, IG handle priority
  src/api/invite.js             — fix /consume for already-provisioned users
  src/api/router.js             — wire new onboarding endpoints
  src/api/vendor/me.js          — expose onboarding_state + instagram_handle in GET
  src/api/vendor/onboarding.js  — NEW: web onboarding endpoint
  src/api/couple/onboarding.js  — NEW: web onboarding endpoint
"""

import sys
from pathlib import Path

BASE = Path('.')

def read(p): return (BASE / p).read_text()
def write(p, t): (BASE / p).write_text(t)

def patch(p, old, new, label=''):
    t = read(p)
    if old not in t:
        print(f'  MISS [{label}] in {p}')
        print(f'  Looking for: {repr(old[:80])}')
        sys.exit(1)
    write(p, t.replace(old, new, 1))
    print(f'  OK  [{label}]')

def create(p, content):
    path = BASE / p
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print(f'  OK  [created {p}]')

print('\n── 1. src/agent/onboarding.js ─────────────────────────────────────────')

patch('src/agent/onboarding.js',
    "// States: new -> asked_category -> asked_city -> asked_travel -> asked_rate -> complete",
    "// States: new -> asked_name -> asked_ig -> asked_category -> asked_city -> asked_travel -> asked_rate -> complete"
, 'state comment')

patch('src/agent/onboarding.js',
    "    case 'new': {\n"
    "      await supabase.from('vendors').update({ onboarding_state: 'asked_category' }).eq('id', vendor.id);\n"
    "      return { reply: `Hi ${name} — Swati mentioned a little bit about you. I'm your chief of staff, and I'll be running the operational side of your business from here. Before we get started, tell me a bit about your work — what do you do?` };\n"
    "    }",

    "    case 'new': {\n"
    "      await supabase.from('vendors').update({ onboarding_state: 'asked_name' }).eq('id', vendor.id);\n"
    "      const greeting = name && name !== 'there'\n"
    "        ? `Hi ${name} — Swati mentioned you'd be joining. I'm your chief of staff.`\n"
    "        : `Hi — Swati said you'd be joining. I'm your chief of staff.`;\n"
    "      return { reply: `${greeting} Quick question before we begin — what should I call you? Just your first name is fine.` };\n"
    "    }\n"
    "\n"
    "    case 'asked_name': {\n"
    "      const firstName = inboundMessage.trim().split(/\\s+/)[0].slice(0, 60);\n"
    "      const cleanFirst = firstName.replace(/[^\\w'-]/g, '').trim() || firstName;\n"
    "      await supabase.from('users').update({ name: cleanFirst }).eq('id', vendor.user_id);\n"
    "      await supabase.from('vendors').update({ onboarding_state: 'asked_ig' }).eq('id', vendor.id);\n"
    "      return { reply: `Got it, ${cleanFirst}. One more thing — what's your Instagram handle? Your clients will use it to reach your PA. If you don't have one, just say skip.` };\n"
    "    }\n"
    "\n"
    "    case 'asked_ig': {\n"
    "      const trimmedIg = inboundMessage.trim();\n"
    "      const skipped = /^skip$/i.test(trimmedIg) || /^no$/i.test(trimmedIg) || !trimmedIg;\n"
    "      const igRaw = skipped ? null : trimmedIg.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);\n"
    "      const igUpdates = { onboarding_state: 'asked_category' };\n"
    "      if (igRaw) igUpdates.instagram_handle = igRaw;\n"
    "      await supabase.from('vendors').update(igUpdates).eq('id', vendor.id);\n"
    "      if (igRaw) {\n"
    "        return { reply: `@${igRaw} — perfect. Now tell me a bit about your work — what do you do?` };\n"
    "      }\n"
    "      return { reply: `No worries. Tell me a bit about your work — what do you do?` };\n"
    "    }"
, 'new + asked_name + asked_ig cases')

patch('src/agent/onboarding.js',
    "      // Auto-assign TDW handle: FIRSTNAME + PHONE3 cascade\n"
    "      const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');\n"
    "      const phone3    = (user?.phone || '').replace(/\\D/g, '').slice(-3);\n"
    "      const phone4    = (user?.phone || '').replace(/\\D/g, '').slice(-4);\n"
    "\n"
    "      const candidates = [\n"
    "        `${firstName}${phone3}`,\n"
    "        `${firstName}${phone4}`,\n"
    "        `${firstName}${phone3}${phone4}`,\n"
    "        `${firstName}${Date.now().toString().slice(-6)}`,\n"
    "      ];\n"
    "\n"
    "      let handle = null;\n"
    "      for (const candidate of candidates) {\n"
    "        if (!candidate || candidate.replace(/-/g, '').length < 2) continue;\n"
    "        const { data: existing } = await supabase\n"
    "          .from('vendors')\n"
    "          .select('id')\n"
    "          .eq('routing_handle', candidate)\n"
    "          .maybeSingle();\n"
    "        if (!existing) {\n"
    "          handle = candidate;\n"
    "          break;\n"
    "        }\n"
    "      }\n"
    "\n"
    "      await supabase\n"
    "        .from('vendors')\n"
    "        .update({ routing_handle: handle, instagram_handle: null, onboarding_state: 'complete' })\n"
    "        .eq('id', vendor.id);",

    "      // Auto-assign TDW handle — priority: IG handle → FIRSTNAME+PHONE3 → fallbacks\n"
    "      const { data: freshVendor } = await supabase\n"
    "        .from('vendors').select('instagram_handle, routing_handle').eq('id', vendor.id).maybeSingle();\n"
    "      if (freshVendor?.routing_handle) {\n"
    "        // Handle already set (e.g. from web onboarding) — skip generation\n"
    "        await supabase.from('vendors').update({ onboarding_state: 'complete' }).eq('id', vendor.id);\n"
    "      } else {\n"
    "        const igHandle  = (freshVendor?.instagram_handle || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);\n"
    "        const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');\n"
    "        const phone3    = (user?.phone || '').replace(/\\D/g, '').slice(-3);\n"
    "        const phone4    = (user?.phone || '').replace(/\\D/g, '').slice(-4);\n"
    "        const candidates = [\n"
    "          igHandle,\n"
    "          `${firstName}${phone3}`,\n"
    "          `${firstName}${phone4}`,\n"
    "          `${firstName}${phone3}${phone4}`,\n"
    "          `${firstName}${Date.now().toString().slice(-6)}`,\n"
    "        ].filter(Boolean);\n"
    "        let handle = null;\n"
    "        for (const candidate of candidates) {\n"
    "          if (!candidate || candidate.length < 2) continue;\n"
    "          const { data: existing } = await supabase\n"
    "            .from('vendors').select('id').eq('routing_handle', candidate).maybeSingle();\n"
    "          if (!existing) { handle = candidate; break; }\n"
    "        }\n"
    "        await supabase\n"
    "          .from('vendors')\n"
    "          .update({ routing_handle: handle, onboarding_state: 'complete' })\n"
    "          .eq('id', vendor.id);\n"
    "      }"
, 'handle priority logic')

print('\n── 2. src/api/invite.js ────────────────────────────────────────────────')

patch('src/api/invite.js',
    "  if (!code || !kind || !name || !phone) {\n"
    "    return res.status(400).json({ error: 'code, kind, name and phone are required.' });\n"
    "  }",
    "  if (!code || !kind || !phone) {\n"
    "    return res.status(400).json({ error: 'code, kind and phone are required.' });\n"
    "  }"
, 'name optional')

patch('src/api/invite.js',
    "  // 2. Check phone not already registered (users row exists)\n"
    "  //    The XOR trigger handles vendor/couple collision, but we want a clean\n"
    "  //    error before we attempt anything if this phone already has a users row.\n"
    "  const { data: existingUser } = await supabase\n"
    "    .from('users')\n"
    "    .select('id')\n"
    "    .eq('phone', cleanPhone)\n"
    "    .maybeSingle();\n"
    "\n"
    "  if (existingUser) {\n"
    "    console.log(`[invite:consume] phone already registered: ${cleanPhone}`);\n"
    "    return res.status(409).json({\n"
    "      error: 'This number is already registered. Please sign in instead.',\n"
    "      reason: 'phone_already_registered',\n"
    "    });\n"
    "  }\n"
    "\n"
    "  // 3. Create users row — needed before consume_invite_code() so we have a user_id\n"
    "  const { data: newUser, error: userError } = await supabase\n"
    "    .from('users')\n"
    "    .insert({ phone: cleanPhone, name: cleanName })\n"
    "    .select('id')\n"
    "    .single();\n"
    "\n"
    "  if (userError) {\n"
    "    console.error('[invite:consume] users insert error:', userError.message);\n"
    "    return res.status(500).json({ error: 'Something went wrong. Please try again.' });\n"
    "  }\n"
    "\n"
    "  const userId = newUser.id;\n"
    "\n"
    "  // 4. Atomic consume via DB function (0031)\n"
    "  //    consume_invite_code() raises P0001 with structured hints on failure.\n"
    "  const { data: consumeResult, error: consumeError } = await supabase\n"
    "    .rpc('consume_invite_code', { p_code: cleanCode, p_user_id: userId });\n"
    "\n"
    "  if (consumeError) {\n"
    "    // Best-effort rollback of the users row we just created\n"
    "    await supabase.from('users').delete().eq('id', userId);\n"
    "\n"
    "    const hint = consumeError.hint || '';\n"
    "    console.log(`[invite:consume] consume failed: ${cleanCode} hint=${hint}`);\n"
    "\n"
    "    if (hint === 'invite_code_invalid') {\n"
    "      return res.status(400).json({ error: 'Invite code not found.', reason: hint });\n"
    "    }\n"
    "    if (hint === 'invite_code_already_consumed') {\n"
    "      return res.status(409).json({ error: 'This invite code has already been used.', reason: hint });\n"
    "    }\n"
    "    console.error('[invite:consume] unexpected consume error:', consumeError.message);\n"
    "    return res.status(500).json({ error: 'Something went wrong. Please try again.' });\n"
    "  }\n"
    "\n"
    "  const result = consumeError === null && consumeResult?.[0];\n"
    "  const resultKind = result?.kind || kind;\n"
    "\n"
    "  // 5. Kind mismatch — consume succeeded but kind is wrong\n"
    "  //    Undo: mark code unconsumed again + delete users row.\n"
    "  //    This should not happen if /validate was called first, but belt-and-suspenders.\n"
    "  if (result && result.kind !== kind) {\n"
    "    console.log(`[invite:consume] kind mismatch post-consume: code=${cleanCode} code_kind=${result.kind} requested=${kind}. Rolling back.`);\n"
    "    await supabase\n"
    "      .from('invite_codes')\n"
    "      .update({ consumed_at: null, consumed_by_user_id: null })\n"
    "      .eq('code', cleanCode);\n"
    "    await supabase.from('users').delete().eq('id', userId);\n"
    "    return res.status(400).json({\n"
    "      error: 'This invite code is for a different role.',\n"
    "      reason: 'invite_code_wrong_kind',\n"
    "    });\n"
    "  }\n"
    "\n"
    "  console.log(`[invite:consume] consumed: ${cleanCode} user_id=${userId} kind=${resultKind}`);\n"
    "  return res.json({ ok: true, user_id: userId, kind: resultKind });",

    "  // 2. Check if phone already has a users row (WA-onboarded or pre-provisioned by admin).\n"
    "  //    If so: confirm correct role exists, mark code consumed, return already_provisioned.\n"
    "  //    This lets WA-onboarded vendors sign in via web invite without friction.\n"
    "  const { data: existingUser } = await supabase\n"
    "    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();\n"
    "\n"
    "  let userId;\n"
    "  let alreadyProvisioned = false;\n"
    "\n"
    "  if (existingUser) {\n"
    "    userId = existingUser.id;\n"
    "    const roleTable = kind === 'maker' ? 'vendors' : 'couples';\n"
    "    const { data: roleRow } = await supabase\n"
    "      .from(roleTable).select('id').eq('user_id', userId).maybeSingle();\n"
    "    if (!roleRow) {\n"
    "      return res.status(409).json({\n"
    "        error: `This number is registered as a ${kind === 'maker' ? 'Dreamer' : 'Maker'} account.`,\n"
    "        reason: 'wrong_role',\n"
    "      });\n"
    "    }\n"
    "    alreadyProvisioned = true;\n"
    "    if (cleanName) {\n"
    "      const { data: uRow } = await supabase.from('users').select('name').eq('id', userId).maybeSingle();\n"
    "      if (!uRow?.name) await supabase.from('users').update({ name: cleanName }).eq('id', userId);\n"
    "    }\n"
    "    console.log(`[invite:consume] ${cleanPhone} already provisioned as ${kind} — consuming code only`);\n"
    "  } else {\n"
    "    // 3. Create users row\n"
    "    const { data: newUser, error: userError } = await supabase\n"
    "      .from('users').insert({ phone: cleanPhone, name: cleanName }).select('id').single();\n"
    "    if (userError) {\n"
    "      console.error('[invite:consume] users insert error:', userError.message);\n"
    "      return res.status(500).json({ error: 'Something went wrong. Please try again.' });\n"
    "    }\n"
    "    userId = newUser.id;\n"
    "  }\n"
    "\n"
    "  // 4. Atomic consume via DB function\n"
    "  const { data: consumeResult, error: consumeError } = await supabase\n"
    "    .rpc('consume_invite_code', { p_code: cleanCode, p_user_id: userId });\n"
    "\n"
    "  if (consumeError) {\n"
    "    if (!alreadyProvisioned) await supabase.from('users').delete().eq('id', userId);\n"
    "    const hint = consumeError.hint || '';\n"
    "    if (hint === 'invite_code_invalid')\n"
    "      return res.status(400).json({ error: 'Invite code not found.', reason: hint });\n"
    "    if (hint === 'invite_code_already_consumed') {\n"
    "      if (alreadyProvisioned)\n"
    "        return res.json({ ok: true, user_id: userId, kind, already_provisioned: true });\n"
    "      return res.status(409).json({ error: 'This invite code has already been used.', reason: hint });\n"
    "    }\n"
    "    console.error('[invite:consume] unexpected error:', consumeError.message);\n"
    "    return res.status(500).json({ error: 'Something went wrong. Please try again.' });\n"
    "  }\n"
    "\n"
    "  const result = consumeResult?.[0];\n"
    "  const resultKind = result?.kind || kind;\n"
    "\n"
    "  // 5. Kind mismatch guard\n"
    "  if (result && result.kind !== kind) {\n"
    "    if (!alreadyProvisioned) {\n"
    "      await supabase.from('invite_codes').update({ consumed_at: null, consumed_by_user_id: null }).eq('code', cleanCode);\n"
    "      await supabase.from('users').delete().eq('id', userId);\n"
    "    }\n"
    "    return res.status(400).json({ error: 'This invite code is for a different role.', reason: 'invite_code_wrong_kind' });\n"
    "  }\n"
    "\n"
    "  console.log(`[invite:consume] ok code=${cleanCode} user=${userId} kind=${resultKind} already_provisioned=${alreadyProvisioned}`);\n"
    "  return res.json({ ok: true, user_id: userId, kind: resultKind, already_provisioned: alreadyProvisioned });"
, 'already_provisioned logic')

print('\n── 3. src/api/router.js ────────────────────────────────────────────────')

patch('src/api/router.js',
    "router.use('/vendor',             require('./vendor/core'));",
    "router.use('/vendor/onboarding',  require('./vendor/onboarding'));\nrouter.use('/vendor',             require('./vendor/core'));"
, 'vendor onboarding route')

patch('src/api/router.js',
    "router.use('/couple',         require('./couple/core'));",
    "router.use('/couple/onboarding', require('./couple/onboarding'));\nrouter.use('/couple',         require('./couple/core'));"
, 'couple onboarding route')

print('\n── 4. src/api/vendor/me.js ─────────────────────────────────────────────')

patch('src/api/vendor/me.js',
    "      featured_eligible:       vendor.featured_eligible       === true,\n"
    "    },\n"
    "  });\n"
    "});",
    "      featured_eligible:       vendor.featured_eligible       === true,\n"
    "      onboarding_state:        vendor.onboarding_state        || null,\n"
    "      instagram_handle:        vendor.instagram_handle        || null,\n"
    "    },\n"
    "  });\n"
    "});"
, 'expose onboarding_state')

print('\n── 5. src/api/vendor/onboarding.js (NEW) ───────────────────────────────')

create('src/api/vendor/onboarding.js', """\
// src/api/vendor/onboarding.js
// POST /api/v2/vendor/onboarding
//
// Web onboarding for vendors who joined via invite code (not WhatsApp).
// Captures identical fields to the WhatsApp conversational onboarding:
//   name, instagram_handle, business_name, category, city, open_to_travel, stated_rate
//
// Handle priority: IG handle → firstName+phone3 → fallbacks (mirrors WA flow).
// Sets onboarding_state = 'complete'. Returns { routing_handle, tdw_link }.
// Idempotent — safe to call again to update profile if already complete.

'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const VENDOR_WA = process.env.TDW_WA_NUMBER || '917982159047';

async function generateHandle(supabase, vendorId, user) {
  const { data: v } = await supabase
    .from('vendors').select('instagram_handle, routing_handle').eq('id', vendorId).maybeSingle();
  if (v?.routing_handle) return v.routing_handle; // already set — keep it
  const igHandle  = (v?.instagram_handle || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  const phone3    = (user?.phone || '').replace(/\\D/g, '').slice(-3);
  const phone4    = (user?.phone || '').replace(/\\D/g, '').slice(-4);
  const candidates = [
    igHandle,
    `${firstName}${phone3}`,
    `${firstName}${phone4}`,
    `${firstName}${phone3}${phone4}`,
    `${firstName}${Date.now().toString().slice(-6)}`,
  ].filter(Boolean);
  for (const c of candidates) {
    if (!c || c.length < 2) continue;
    const { data: existing } = await supabase
      .from('vendors').select('id').eq('routing_handle', c).maybeSingle();
    if (!existing) return c;
  }
  return `VENDOR${Date.now().toString().slice(-6)}`;
}

router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const { name, instagram_handle, business_name, category, city, open_to_travel, stated_rate } = req.body || {};

  if (!category || !category.trim()) return errRes(res, 400, 'category is required.');
  if (!city     || !city.trim())     return errRes(res, 400, 'city is required.');

  // Update users.name with person's first name
  const cleanName = (name || '').trim().split(/\\s+/)[0].slice(0, 60);
  if (cleanName) {
    await supabase.from('users').update({ name: cleanName }).eq('id', vendor.user_id);
  }

  const { data: user } = await supabase
    .from('users').select('name, phone').eq('id', vendor.user_id).maybeSingle();

  const cleanIg = (instagram_handle || '').trim().replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30) || null;

  // Write IG handle first so generateHandle can read it
  if (cleanIg) await supabase.from('vendors').update({ instagram_handle: cleanIg }).eq('id', vendor.id);

  const handle = await generateHandle(supabase, vendor.id, user || {});

  const vendorUpdate = {
    category:         category.trim().toLowerCase(),
    city:             city.trim(),
    open_to_travel:   open_to_travel === true || open_to_travel === 'true',
    routing_handle:   handle,
    onboarding_state: 'complete',
  };
  if (business_name && business_name.trim()) vendorUpdate.business_name = business_name.trim();
  if (cleanIg)                               vendorUpdate.instagram_handle = cleanIg;

  const { error: vendorErr } = await supabase.from('vendors').update(vendorUpdate).eq('id', vendor.id);
  if (vendorErr) return errRes(res, 500, 'Could not save profile. Please try again.');

  if (stated_rate && stated_rate.trim()) {
    const displayName = business_name?.trim() || cleanName || user?.name || 'Vendor';
    await supabase.from('vendor_state').upsert({
      vendor_id:      vendor.id,
      summary:        `${displayName} — ${category.trim()} based in ${city.trim()}. Typical rate: ${stated_rate.trim()}.`,
      pricing_policy: { stated_rate: stated_rate.trim() },
      recent_notes:   [],
      updated_at:     new Date().toISOString(),
    });
  }

  const tdwLink = `https://wa.me/${VENDOR_WA}?text=TDW-${handle}`;
  console.log(`[vendor:onboarding] complete vendor=${vendor.id} handle=${handle}`);
  return okRes(res, { routing_handle: handle, tdw_link: tdwLink, message: 'Profile complete.' });
}));

module.exports = router;
""")

print('\n── 6. src/api/couple/onboarding.js (NEW) ───────────────────────────────')

create('src/api/couple/onboarding.js', """\
// src/api/couple/onboarding.js
// POST /api/v2/couple/onboarding
//
// Web onboarding for couples who joined via invite code (not WhatsApp).
// All fields optional — mirrors WA dodge behaviour.
// Sets onboarding_state = 'complete'.

'use strict';

const express           = require('express');
const router            = express.Router();
const requireCoupleAuth = require('../middleware/requireCoupleAuth');
const asyncHandler      = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.post('/', requireCoupleAuth, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const coupleId = req.coupleUser.couple_id;

  const { wedding_date, partner_name, wedding_city, budget_total } = req.body || {};

  const updates = { onboarding_state: 'complete' };
  const notes   = [];

  if (wedding_date && typeof wedding_date === 'string' && wedding_date.trim()) {
    updates.wedding_date = wedding_date.trim();
    notes.push({ couple_id: coupleId, content: `Wedding date: ${wedding_date.trim()}`, tags: ['onboarding', 'date'] });
  }
  if (partner_name && typeof partner_name === 'string' && partner_name.trim()) {
    updates.partner_name = partner_name.trim().slice(0, 80);
    notes.push({ couple_id: coupleId, content: `Partner: ${partner_name.trim()}`, tags: ['onboarding', 'partner'] });
  }
  if (wedding_city && typeof wedding_city === 'string' && wedding_city.trim()) {
    updates.wedding_city = wedding_city.trim().slice(0, 80);
    notes.push({ couple_id: coupleId, content: `Wedding city: ${wedding_city.trim()}`, tags: ['onboarding', 'city'] });
  }
  if (budget_total) {
    const asInt = Number.isInteger(budget_total) ? budget_total : parseInt(budget_total, 10);
    if (Number.isInteger(asInt) && asInt > 0) {
      updates.budget_total = asInt;
      notes.push({ couple_id: coupleId, content: `Budget: Rs ${asInt.toLocaleString('en-IN')}`, tags: ['onboarding', 'budget'] });
    }
  }

  const { error } = await supabase.from('couples').update(updates).eq('id', coupleId);
  if (error) return errRes(res, 500, 'Could not save details. Please try again.');
  if (notes.length > 0) await supabase.from('notes').insert(notes);

  console.log(`[couple:onboarding] complete couple=${coupleId}`);
  return okRes(res, { message: 'Profile complete.' });
}));

module.exports = router;
""")

print('\n── Validating JS syntax ────────────────────────────────────────────────')
import subprocess
files = [
    'src/agent/onboarding.js',
    'src/api/invite.js',
    'src/api/router.js',
    'src/api/vendor/me.js',
    'src/api/vendor/onboarding.js',
    'src/api/couple/onboarding.js',
]
result = subprocess.run(['node', '--check'] + files, capture_output=True, text=True)
if result.returncode == 0:
    print('  ALL FILES CLEAN ✓')
else:
    print('  ERRORS:')
    print(result.stderr)
    sys.exit(1)

print('\n✅  dream-os patch complete. Commit with:')
print('  git add src/agent/onboarding.js src/api/invite.js src/api/router.js src/api/vendor/me.js src/api/vendor/onboarding.js src/api/couple/onboarding.js')
print('  git commit -m "feat(onboarding): unified name+ig flow, fix invite consume, web onboarding endpoints"')
