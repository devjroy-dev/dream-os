const { layout } = require('./layout');

function statusBadge(state) {
  if (!state || state === 'complete') return '<span class="badge badge-active">Active</span>';
  if (state === 'new') return '<span class="badge badge-invited">Invited</span>';
  return '<span class="badge badge-onboarding">Onboarding</span>';
}

function vendorsPage({ vendors, stats }) {
  const rows = vendors.length === 0
    ? `<tr><td colspan="6" class="empty-state">No vendors yet. <a href="/admin/invite">Invite your first one →</a></td></tr>`
    : vendors.map(v => `
        <tr>
          <td><a class="row-link" href="/admin/vendors/${v.id}"><strong>${v.name || '—'}</strong></a></td>
          <td>${v.phone || '—'}</td>
          <td>${v.category || '—'}</td>
          <td>${v.city || '—'}</td>
          <td>${statusBadge(v.onboarding_state)}</td>
          <td><a class="btn btn-sm btn-primary" href="/admin/vendors/${v.id}">View</a></td>
        </tr>
      `).join('');

  const body = `
    <h1>Vendors</h1>
    <p class="subtitle">Your founding cohort — ${vendors.length} invited so far</p>

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
            <th>Name</th>
            <th>Phone</th>
            <th>Category</th>
            <th>City</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <a href="/admin/invite" class="btn btn-gold" style="margin-top: 8px;">+ Invite vendor</a>
  `;

  return layout({ title: 'Vendors', body });
}

module.exports = { vendorsPage };
