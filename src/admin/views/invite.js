const { layout } = require('./layout');
const { waNumberFor } = require('../../lib/waNumbers');
const TDW_WA_NUMBER = waNumberFor('vendor');   // F5 rider: one home for the pair

function invitePage({ success, successName, error } = {}) {
  const waLink = successName
    ? `https://wa.me/${TDW_WA_NUMBER}?text=Hi`
    : null;

  const body = `
    <h1>Invite a vendor</h1>
    <p class="subtitle">They'll receive a personal greeting from the chief of staff when they first message in.</p>

    ${success ? `
      <div class="success-msg">
        ✓ <strong>${successName}</strong> has been invited.
      </div>
      <div class="card" style="max-width: 480px; margin-bottom: 24px;">
        <p style="font-size:12px;color:#8C8480;margin-bottom:12px;text-transform:uppercase;letter-spacing:.1em;">Share this with them</p>
        <p style="font-size:14px;color:#0C0A09;line-height:1.8;">
          Hey ${successName} — tap this link to get started with your chief of staff:<br>
          <strong><a href="${waLink}" style="color:#C9A84C;">${waLink}</a></strong>
        </p>
        <div style="margin-top:16px;display:flex;gap:12px;">
          <button onclick="navigator.clipboard.writeText('Hey ${successName} — tap this link to get started with your chief of staff: ${waLink}')" class="btn btn-primary btn-sm">Copy message</button>
          <a href="https://wa.me/?text=${encodeURIComponent(`Hey ${successName} — tap this link to get started with your chief of staff: ${waLink}`)}" class="btn btn-gold btn-sm" target="_blank">Send via WhatsApp</a>
        </div>
      </div>
    ` : ''}

    ${error ? `<div class="error-msg">Something went wrong: ${error}</div>` : ''}

    <div class="card" style="max-width: 480px;">
      <form method="POST" action="/admin/invite">
        <div class="form-group">
          <label>Vendor's first name</label>
          <input type="text" name="name" placeholder="Kavya" required autofocus />
        </div>
        <div class="form-group">
          <label>WhatsApp number — include country code</label>
          <input type="tel" name="phone" placeholder="+918757788550" required />
          <p style="font-size:11px;color:#8C8480;margin-top:6px;">Always include the + and country code. India = +91 followed by 10 digits.</p>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:8px;">Invite vendor</button>
      </form>
    </div>
  `;

  return layout({ title: 'Invite', body });
}

module.exports = { invitePage };
