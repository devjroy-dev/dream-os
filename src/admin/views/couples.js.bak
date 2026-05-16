// couples.js — admin list page for couples
// Mirrors vendors.js for the bride product.

const { layout } = require('./layout');

function statusBadge(state) {
  if (!state || state === 'complete') return '<span class="badge badge-active">Active</span>';
  if (state === 'new') return '<span class="badge badge-invited">Invited</span>';
  return '<span class="badge badge-onboarding">Onboarding</span>';
}

function formatDate(d) {
  if (!d) return '—';
  // d is YYYY-MM-DD, render as-is
  return d;
}

function couplesPage({ couples, stats }) {
  const rows = couples.length === 0
    ? `<tr><td colspan="7" class="empty-state">No couples yet. <a href="/admin/couples/invite">Invite your first one →</a></td></tr>`
    : couples.map(c => `
        <tr>
          <td><a class="row-link" href="/admin/couples/${c.id}"><strong>${c.name || '—'}</strong></a></td>
          <td>${c.phone || '—'}</td>
          <td>${c.partner_name || '—'}</td>
          <td>${formatDate(c.wedding_date)}</td>
          <td>${c.wedding_city || '—'}</td>
          <td>${statusBadge(c.onboarding_state)}</td>
          <td><a class="btn btn-sm btn-primary" href="/admin/couples/${c.id}">View</a></td>
        </tr>
      `).join('');

  const body = `
    <h1>Couples</h1>
    <p class="subtitle">${couples.length} couple${couples.length === 1 ? '' : 's'} invited so far</p>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-number">${stats.active}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${stats.onboarding}</div>
        <div class="stat-label">Onboarding</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${stats.invited}</div>
        <div class="stat-label">Invited</div>
      </div>
    </div>

    <div class="card" style="padding: 0;">
      <table>
        <thead>
          <tr>
            <th>Bride</th>
            <th>Phone</th>
            <th>Partner</th>
            <th>Wedding date</th>
            <th>City</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <a href="/admin/couples/invite" class="btn btn-gold" style="margin-top: 8px;">+ Invite couple</a>
  `;

  return layout({ title: 'Couples', body, activeNav: 'couples' });
}

module.exports = { couplesPage };
