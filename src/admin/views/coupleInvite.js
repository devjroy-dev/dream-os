// coupleInvite.js — admin invite form for new couples
// Mirrors invite.js (vendor invite) for couples.

const { layout } = require('./layout');
const { waNumberFor } = require('../../lib/waNumbers');

// ── F5 RIDER · THE MIS-ROUTE, CURED (TDW_05 P4) ─────────────────────────────
// This line previously read:
//     process.env.TDW_WA_NUMBER_BRIDE || process.env.TDW_WA_NUMBER || '917982159047'
// On the COUPLE invite page. Both tail terms are the VENDOR lane: the env var and
// the literal. So unless TDW_WA_NUMBER_BRIDE happened to be set, an admin inviting
// a BRIDE handed her a link to the VENDOR line — she would have messaged the wrong
// assistant on her first contact with the product. The variable name (TDW_WA_NUMBER,
// the vendor's name) is what let it read as correct for as long as it did.
// waNumberFor('bride') resolves TDW_WA_NUMBER_BRIDE || 917011788380 and deliberately
// does NOT fall through to the vendor var — preserving that fall-through would be
// preserving the bug's mechanism.
const TDW_WA_NUMBER = waNumberFor('bride');

function coupleInvitePage({ success, successName, error } = {}) {
  const waLink = successName
    ? `https://wa.me/${TDW_WA_NUMBER}?text=Hi`
    : null;

  const body = `
    <h1>Invite a couple</h1>
    <p class="subtitle">She'll be greeted by her assistant the moment she first messages in.</p>

    ${success ? `
      <div class="success-msg">
        ✓ <strong>${successName}</strong> has been invited.
      </div>
      <div class="card" style="max-width: 480px; margin-bottom: 24px;">
        <p style="font-size:12px;color:#8C8480;margin-bottom:12px;text-transform:uppercase;letter-spacing:.1em;">Share this with her</p>
        <p style="font-size:14px;color:#0C0A09;line-height:1.8;">
          Hey ${successName} — tap this link to meet your wedding assistant:<br>
          <strong><a href="${waLink}" style="color:#C9A84C;">${waLink}</a></strong>
        </p>
        <div style="margin-top:16px;display:flex;gap:12px;">
          <button onclick="navigator.clipboard.writeText('Hey ${successName} — tap this link to meet your wedding assistant: ${waLink}')" class="btn btn-primary btn-sm">Copy message</button>
          <a href="https://wa.me/?text=${encodeURIComponent(`Hey ${successName} — tap this link to meet your wedding assistant: ${waLink}`)}" class="btn btn-gold btn-sm" target="_blank">Send via WhatsApp</a>
        </div>
      </div>
    ` : ''}

    ${error ? `<div class="error-msg">Something went wrong: ${error}</div>` : ''}

    <div class="card" style="max-width: 480px;">
      <form method="POST" action="/admin/couples/invite">
        <div class="form-group">
          <label>Bride or groom's first name</label>
          <input type="text" name="name" placeholder="Priya" required autofocus />
        </div>
        <div class="form-group">
          <label>Pronouns</label>
          <div style="display:flex;gap:14px;margin-top:8px;">
            <label style="display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:normal;color:#0C0A09;font-size:14px;cursor:pointer;">
              <input type="radio" name="pronouns" value="she" required style="width:auto;margin:0;" /> She / Her
            </label>
            <label style="display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:normal;color:#0C0A09;font-size:14px;cursor:pointer;">
              <input type="radio" name="pronouns" value="he" style="width:auto;margin:0;" /> He / Him
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>WhatsApp number — include country code</label>
          <input type="tel" name="phone" placeholder="+919876543210" required />
          <p style="font-size:11px;color:#8C8480;margin-top:6px;">Always include the + and country code. This is the WhatsApp number she'll message us from.</p>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:8px;">Invite couple</button>
      </form>
    </div>
  `;

  return layout({ title: 'Invite couple', body, activeNav: 'couples' });
}

module.exports = { coupleInvitePage };
