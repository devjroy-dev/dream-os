#!/usr/bin/env python3
"""
deploy_admin_invite.py
Run this in /workspaces/dream-os

Creates a unified "Invite" admin page that does everything in one action:
  - name + phone + role + tier → creates account + mints invite code
  - shows WA link AND invite code together after submission
  - replaces the fragmented /admin/invite + /admin/couples/invite + /admin/invite-codes

Changes:
  1. src/admin/views/unifiedInvite.js  (NEW) — the new page view
  2. src/admin/router.js               — add GET/POST /admin/unified-invite
  3. src/admin/views/layout.js         — add "Invite" nav link
"""

import sys
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
    print(f'  OK  [{label}]')

def create(p, content):
    path = BASE / p
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print(f'  OK  [created {p}]')

print('\n── 1. src/admin/views/unifiedInvite.js (NEW) ───────────────────────────')

create('src/admin/views/unifiedInvite.js', r"""
// src/admin/views/unifiedInvite.js
// Unified invite page — one action creates the account AND mints the invite code.
// Shows WA link + invite code together so admin can share either or both.

'use strict';

const { layout } = require('./layout');

const VENDOR_WA = process.env.TDW_WA_NUMBER      || '917982159047';
const BRIDE_WA  = process.env.BRIDE_WA_NUMBER     || '14787788550';

function unifiedInvitePage({ result, error } = {}) {

  const successBlock = result ? `
    <div class="card" style="max-width:560px;margin-bottom:28px;border-color:#C5E1A5;">
      <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:16px;">
        ✓ ${result.name} has been invited as a ${result.kind === 'maker' ? 'Maker' : 'Dreamer'}
      </p>

      <!-- WA Link -->
      <div style="margin-bottom:20px;">
        <p style="font-size:11px;font-weight:600;color:#0C0A09;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em;">
          WhatsApp link
        </p>
        <p style="font-size:12px;color:#8C8480;margin-bottom:10px;line-height:1.6;">
          They text this number and get onboarded conversationally.
        </p>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <code id="wa-link" style="font-size:13px;color:#0C0A09;background:#F0EDE8;padding:8px 12px;border-radius:6px;flex:1;word-break:break-all;">
            ${result.waLink}
          </code>
          <button onclick="copyEl('wa-link','wa-btn')" id="wa-btn" class="btn btn-sm btn-primary">Copy</button>
          <a href="https://wa.me/?text=${encodeURIComponent(`Hey ${result.name} — tap this to get started: ${result.waLink}`)}"
             target="_blank" class="btn btn-sm btn-gold">Send via WA</a>
        </div>
      </div>

      <!-- Invite code -->
      <div style="padding-top:16px;border-top:1px solid #E2DED8;">
        <p style="font-size:11px;font-weight:600;color:#0C0A09;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em;">
          Web invite code
        </p>
        <p style="font-size:12px;color:#8C8480;margin-bottom:10px;line-height:1.6;">
          They go to thedreamwedding.in → "I have an invite" and enter this code.
        </p>
        <div style="display:flex;align-items:center;gap:16px;">
          <span id="inv-code" style="font-family:monospace;font-size:28px;font-weight:700;letter-spacing:.2em;color:#0C0A09;">
            ${result.code}
          </span>
          <button onclick="copyEl('inv-code','inv-btn')" id="inv-btn" class="btn btn-sm btn-primary">Copy</button>
        </div>
        <p style="font-size:11px;color:#8C8480;margin-top:8px;">
          Kind: <strong>${result.kind}</strong>
          ${result.tier ? ` &nbsp;·&nbsp; Tier: <strong>${result.tier}</strong>` : ''}
        </p>
      </div>

      <!-- Ready-to-send message -->
      <div style="margin-top:20px;padding:14px;background:#F8F7F5;border-radius:8px;">
        <p style="font-size:11px;font-weight:600;color:#0C0A09;margin-bottom:8px;">Ready-to-send message</p>
        <p id="full-msg" style="font-size:13px;color:#0C0A09;line-height:1.7;white-space:pre-wrap;">Hey ${result.name} — you've been invited to The Dream Wedding.\n\nOption 1 (WhatsApp): Tap this link — ${result.waLink}\nOption 2 (Web): Go to thedreamwedding.in and enter code ${result.code}</p>
        <div style="margin-top:10px;display:flex;gap:10px;">
          <button onclick="copyEl('full-msg','full-btn')" id="full-btn" class="btn btn-sm btn-primary">Copy message</button>
          <a href="https://wa.me/?text=${encodeURIComponent(`Hey ${result.name} — you've been invited to The Dream Wedding.\n\nOption 1 (WhatsApp): Tap this link — ${result.waLink}\nOption 2 (Web): Go to thedreamwedding.in and enter code ${result.code}`)}"
             target="_blank" class="btn btn-sm btn-gold">Send via WA</a>
        </div>
      </div>
    </div>

    <script>
      function copyEl(srcId, btnId) {
        const el = document.getElementById(srcId);
        navigator.clipboard.writeText(el.textContent.trim());
        const btn = document.getElementById(btnId);
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 2000);
      }
    </script>
  ` : '';

  const body = `
    <h1>Invite someone</h1>
    <p class="subtitle">One action — creates the account, mints the invite code, and gives you both the WA link and the web code.</p>

    ${error ? `<div class="error-msg">${error}</div>` : ''}
    ${successBlock}

    <div class="card" style="max-width:520px;">
      <form method="POST" action="/admin/unified-invite">

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group">
            <label>Role *</label>
            <select name="kind" required style="width:100%;padding:10px 14px;border:1px solid #E2DED8;border-radius:6px;font-size:14px;font-family:inherit;background:#FAFAFA;color:#0C0A09;margin-top:6px;">
              <option value="maker">Maker — vendor</option>
              <option value="dreamer">Dreamer — bride/couple</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tier</label>
            <select name="tier" style="width:100%;padding:10px 14px;border:1px solid #E2DED8;border-radius:6px;font-size:14px;font-family:inherit;background:#FAFAFA;color:#0C0A09;margin-top:6px;">
              <option value="">— (default trial) —</option>
              <option value="essential">Essential</option>
              <option value="signature">Signature</option>
              <option value="prestige">Prestige</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>First name *</label>
          <input type="text" name="name" placeholder="Kavya" required autofocus />
        </div>

        <div class="form-group">
          <label>WhatsApp number *</label>
          <input type="tel" name="phone" placeholder="+919876543210" required />
          <p style="font-size:11px;color:#8C8480;margin-top:6px;">E.164 format — include + and country code. India = +91 then 10 digits.</p>
        </div>

        <div class="form-group">
          <label>Internal note <span style="color:#C9A84C;">(optional)</span></label>
          <input type="text" name="notes" placeholder="e.g. Swati referral, press list, founding cohort" />
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top:8px;width:100%;">
          Create account + generate invite →
        </button>
      </form>
    </div>
  `;

  return layout({ title: 'Invite', body, activeNav: 'invite' });
}

module.exports = { unifiedInvitePage, VENDOR_WA, BRIDE_WA };
""")

print('\n── 2. src/admin/router.js — add unified-invite routes ──────────────────')

# Add require at top
patch('src/admin/router.js',
    "const { invitePage }  = require('./views/invite');",
    "const { invitePage }  = require('./views/invite');\nconst { unifiedInvitePage, VENDOR_WA, BRIDE_WA } = require('./views/unifiedInvite');",
    'add unifiedInvite require'
)

# Add routes just before module.exports
patch('src/admin/router.js',
    "module.exports = router;",
    r"""
// ── Unified invite — GET /admin/unified-invite ────────────────────────────────
router.get('/unified-invite', (req, res) => {
  res.send(unifiedInvitePage());
});

// ── Unified invite — POST /admin/unified-invite ───────────────────────────────
// 1. Validate inputs
// 2. Check if phone already in users table
// 3. If not: call invite_vendor() or invite_couple() RPC to create account
// 4. Set tier if provided
// 5. Mint unique invite code and insert into invite_codes with intended_phone
// 6. Return both WA link and invite code

router.post('/unified-invite', express.urlencoded({ extended: true }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { kind, name, phone, tier, notes } = req.body;

  // Validate
  if (!kind || !['maker', 'dreamer'].includes(kind))
    return res.send(unifiedInvitePage({ error: 'Role must be Maker or Dreamer.' }));
  if (!name || !name.trim())
    return res.send(unifiedInvitePage({ error: 'Name is required.' }));
  if (!phone || !phone.trim())
    return res.send(unifiedInvitePage({ error: 'Phone number is required.' }));

  const cleanName  = name.trim();
  const cleanPhone = phone.trim();
  const cleanTier  = tier?.trim() || null;
  const cleanNotes = notes?.trim() || null;

  // Check if already exists
  const { data: existingUser } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();

  if (!existingUser) {
    // Create account via RPC
    const rpc = kind === 'maker' ? 'invite_vendor' : 'invite_couple';
    const params = kind === 'maker'
      ? { p_phone: cleanPhone, p_name: cleanName }
      : { p_phone: cleanPhone, p_name: cleanName, p_pronouns: 'they/them' };

    const { error: rpcErr } = await supabase.rpc(rpc, params);
    if (rpcErr) {
      console.error(`[admin:unified-invite] RPC ${rpc} error:`, rpcErr.message);
      return res.send(unifiedInvitePage({ error: `Could not create account: ${rpcErr.message}` }));
    }

    // Set tier on vendor if provided
    if (cleanTier && kind === 'maker') {
      const { data: userRow } = await supabase.from('users').select('id').eq('phone', cleanPhone).maybeSingle();
      if (userRow) {
        await supabase.from('vendors').update({ tier: cleanTier }).eq('user_id', userRow.id);
      }
    }

    console.log(`[admin:unified-invite] created ${kind} account for ${cleanPhone}`);
  } else {
    console.log(`[admin:unified-invite] ${cleanPhone} already exists — skipping account creation`);
  }

  // Mint unique invite code
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function genCode() {
    let c = '';
    for (let i = 0; i < 8; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return c;
  }

  let code;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = genCode();
    const { data: existing } = await supabase
      .from('invite_codes').select('code').eq('code', candidate).maybeSingle();
    if (!existing) { code = candidate; break; }
  }

  if (!code) {
    return res.send(unifiedInvitePage({ error: 'Could not generate a unique invite code. Please try again.' }));
  }

  const { error: codeErr } = await supabase.from('invite_codes').insert({
    code,
    kind,
    tier:           cleanTier,
    intended_phone: cleanPhone,
    notes:          cleanNotes,
    created_by:     'admin',
  });

  if (codeErr) {
    console.error('[admin:unified-invite] code insert error:', codeErr.message);
    return res.send(unifiedInvitePage({ error: 'Account created but code generation failed. Please mint a code manually.' }));
  }

  const waNumber = kind === 'maker' ? VENDOR_WA : BRIDE_WA;
  const waLink   = `https://wa.me/${waNumber}`;

  console.log(`[admin:unified-invite] invited ${cleanName} (${cleanPhone}) as ${kind} — code=${code}`);

  return res.send(unifiedInvitePage({
    result: {
      name:   cleanName,
      kind,
      tier:   cleanTier,
      code,
      waLink,
    },
  }));
});

module.exports = router;
""",
    'add unified-invite routes'
)

print('\n── 3. src/admin/views/layout.js — add Invite nav link ──────────────────')

patch('src/admin/views/layout.js',
    '      <a href="/admin/invite-codes" class="${activeNav === \'invite-codes\' ? \'active\' : \'\'}">Invite Codes</a>',
    '      <a href="/admin/unified-invite" class="${activeNav === \'invite\' ? \'active\' : \'\'}">Invite</a>\n      <a href="/admin/invite-codes" class="${activeNav === \'invite-codes\' ? \'active\' : \'\'}">Invite Codes</a>',
    'add Invite nav link'
)

print('\n── Validating JS syntax ────────────────────────────────────────────────')
import subprocess
files = [
    'src/admin/views/unifiedInvite.js',
    'src/admin/router.js',
    'src/admin/views/layout.js',
]
result = subprocess.run(['node', '--check'] + files, capture_output=True, text=True)
if result.returncode == 0:
    print('  ALL FILES CLEAN ✓')
else:
    print('  ERRORS:')
    print(result.stderr)
    sys.exit(1)

print('\n✅  Admin invite patch complete. Commit with:')
print('  git add src/admin/views/unifiedInvite.js src/admin/router.js src/admin/views/layout.js')
print('  git commit -m "feat(admin): unified invite page — account + code + WA link in one action"')
print('  git push')
