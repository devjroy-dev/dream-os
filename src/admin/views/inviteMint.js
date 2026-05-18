// src/admin/views/inviteMint.js
// Admin view for minting invite codes.
// Rendered by GET /admin/invite-codes (list + mint form)
// and POST /admin/invite-codes/mint (generate + redirect back).

'use strict';

const { layout } = require('./layout');

function inviteMintPage({ generated, error, recentCodes = [] } = {}) {
  const body = `
    <h1>Invite codes</h1>
    <p class="subtitle">Mint single-use codes for Dreamers (brides) and Makers (vendors). Codes never expire until consumed.</p>

    ${error ? `<div class="error-msg">${error}</div>` : ''}

    ${generated ? `
      <div class="card" style="max-width:520px;margin-bottom:24px;border-color:#C5E1A5;">
        <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:12px;">Code generated — share this</p>
        <div style="display:flex;align-items:center;gap:16px;">
          <span id="gen-code" style="font-family:monospace;font-size:28px;font-weight:600;letter-spacing:.18em;color:#0C0A09;">${generated.code}</span>
          <button onclick="copyCode()" class="btn btn-sm btn-primary" id="copy-btn">Copy</button>
        </div>
        <p style="font-size:12px;color:#8C8480;margin-top:10px;">
          Kind: <strong>${generated.kind}</strong>
          ${generated.tier ? ` &nbsp;·&nbsp; Tier: <strong>${generated.tier}</strong>` : ''}
          ${generated.notes ? ` &nbsp;·&nbsp; Note: ${generated.notes}` : ''}
        </p>
      </div>
      <script>
        function copyCode() {
          navigator.clipboard.writeText('${generated.code}');
          const btn = document.getElementById('copy-btn');
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 2000);
        }
      </script>
    ` : ''}

    <div class="card" style="max-width:520px;">
      <form method="POST" action="/admin/invite-codes/mint">
        <div class="form-group">
          <label>Kind</label>
          <select name="kind" required style="width:100%;padding:10px 14px;border:1px solid #E2DED8;border-radius:6px;font-size:14px;font-family:inherit;background:#FAFAFA;color:#0C0A09;margin-top:6px;">
            <option value="dreamer">Dreamer — bride</option>
            <option value="maker">Maker — vendor</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tier <span style="color:#C9A84C;">(optional — leave blank for now)</span></label>
          <input type="text" name="tier" placeholder="essential / signature / prestige" />
          <p style="font-size:11px;color:#8C8480;margin-top:6px;">Tier pricing is not yet active. This field is provisioning-ready for future use.</p>
        </div>
        <div class="form-group">
          <label>Internal note <span style="color:#C9A84C;">(optional)</span></label>
          <input type="text" name="notes" placeholder="e.g. Anjali referral, press list, founding cohort" />
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:8px;">Generate code</button>
      </form>
    </div>

    ${recentCodes.length > 0 ? `
      <h2 style="font-family:Georgia,serif;font-weight:300;font-size:20px;margin-bottom:16px;">Recent codes</h2>
      <div class="card" style="padding:0;">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Kind</th>
              <th>Tier</th>
              <th>Notes</th>
              <th>Created</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${recentCodes.map(c => `
              <tr>
                <td><span style="font-family:monospace;font-size:13px;font-weight:600;letter-spacing:.1em;">${c.code}</span></td>
                <td>
                  <span class="badge ${c.kind === 'dreamer' ? 'badge-new' : 'badge-invited'}">
                    ${c.kind}
                  </span>
                </td>
                <td style="color:#8C8480;">${c.tier || '—'}</td>
                <td style="color:#8C8480;font-size:12px;">${c.notes || '—'}</td>
                <td style="color:#8C8480;font-size:12px;">${new Date(c.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</td>
                <td>
                  ${c.consumed_at
                    ? `<span class="badge badge-active">Used</span>`
                    : `<span class="badge badge-onboarding">Available</span>`
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;

  return layout({ title: 'Invite Codes', body, activeNav: 'vendors' });
}

module.exports = { inviteMintPage };
