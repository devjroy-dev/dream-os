const { layout } = require('./layout');

function invitePage({ success, error } = {}) {
  const body = `
    <h1>Invite a vendor</h1>
    <p class="subtitle">They'll receive a personal greeting from the chief of staff when they message in.</p>

    ${success ? `<div class="success-msg">✓ ${success} has been invited. Share the WhatsApp number with them.</div>` : ''}
    ${error ? `<div class="error-msg">Something went wrong: ${error}</div>` : ''}

    <div class="card" style="max-width: 480px;">
      <form method="POST" action="/admin/invite">
        <div class="form-group">
          <label>Vendor's first name</label>
          <input type="text" name="name" placeholder="Aditya" required autofocus />
        </div>
        <div class="form-group">
          <label>WhatsApp number (with country code)</label>
          <input type="tel" name="phone" placeholder="+918757788550" required />
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: 8px;">Invite vendor</button>
      </form>
    </div>

    <div class="card" style="max-width: 480px; margin-top: 0;">
      <p style="font-size: 12px; color: #8C8480; line-height: 1.6;">
        After inviting, share this number with the vendor:<br>
        <strong style="font-size: 14px; color: #0C0A09;">+1 415 523 8886</strong><br><br>
        They'll receive a personal greeting from the chief of staff when they first message in.
        You can track their onboarding status on the vendor list.
      </p>
    </div>
  `;

  return layout({ title: 'Invite', body });
}

module.exports = { invitePage };
