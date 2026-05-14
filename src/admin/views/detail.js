const { layout } = require('./layout');

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    hour12: true,
  });
}

function formatBudget(min, max) {
  if (!min && !max) return '—';
  const fmt = n => `Rs ${(n/100000).toFixed(1)}L`;
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`;
  return fmt(min || max);
}

function stateBadge(state) {
  const map = {
    new:       'badge-new',
    contacted: 'badge-onboarding',
    quoted:    'badge-invited',
    booked:    'badge-active',
    lost:      '',
  };
  return `<span class="badge ${map[state] || ''}" style="${state==='lost'?'background:#F5F5F5;color:#9E9E9E;':''}">${state}</span>`;
}

function detailPage({ vendor, user, state, messages, notes, leads }) {
  const name = user?.name || vendor?.business_name || 'Vendor';

  const statusLabel = !vendor.onboarding_state || vendor.onboarding_state === 'complete'
    ? 'Active' : vendor.onboarding_state === 'new' ? 'Invited' : 'Onboarding';

  const profileRows = [
    ['Name', name],
    ['Phone', user?.phone || '—'],
    ['Category', vendor.category || '—'],
    ['City', vendor.city || '—'],
    ['Status', statusLabel],
    ['Summary', state?.summary || '—'],
  ].map(([k, v]) => `
    <tr>
      <td style="color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;width:120px;padding:8px 0;">${k}</td>
      <td style="font-size:13px;padding:8px 0;">${v}</td>
    </tr>
  `).join('');

  const bubbles = messages.length === 0
    ? '<div class="empty-state">No messages yet.</div>'
    : messages.map(m => `
        <div class="message-row ${m.direction}">
          <div>
            <div class="bubble bubble-${m.direction}">${(m.body || '').replace(/</g,'&lt;')}</div>
            <div class="bubble-time">${formatTime(m.created_at)}</div>
          </div>
        </div>
      `).join('');

  const noteChips = notes.length === 0
    ? '<span style="color:#8C8480;font-size:13px;">No notes yet.</span>'
    : notes.map(n => `<span class="note-chip">${n.content}</span>`).join('');

  const leadsRows = leads.length === 0
    ? `<tr><td colspan="6" class="empty-state" style="padding:24px;">No leads yet.</td></tr>`
    : leads.map(l => `
        <tr>
          <td style="font-size:13px;"><strong>${l.name || '—'}</strong></td>
          <td style="font-size:12px;">${l.wedding_date || '—'}</td>
          <td style="font-size:12px;">${l.wedding_city || '—'}</td>
          <td style="font-size:12px;">${formatBudget(l.budget_min, l.budget_max)}</td>
          <td>${stateBadge(l.state)}</td>
          <td style="font-size:11px;color:#8C8480;">${formatTime(l.created_at)}</td>
        </tr>
      `).join('');

  const body = `
    <div style="margin-bottom:8px;">
      <a href="/admin" style="color:#8C8480;text-decoration:none;font-size:12px;">← All vendors</a>
    </div>

    <h1>${name}</h1>
    <p class="subtitle">${user?.phone || ''} · ${vendor.category || ''} · ${vendor.city || ''}</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
      <div>
        <div class="card">
          <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:12px;">Profile</h3>
          <table>${profileRows}</table>
        </div>
        <div class="card">
          <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:12px;">Agent notes</h3>
          <div>${noteChips}</div>
        </div>
      </div>
      <div class="card" style="padding:20px;">
        <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:16px;">Conversation</h3>
        <div style="max-height:420px;overflow-y:auto;">
          ${bubbles}
        </div>
      </div>
    </div>

    <div class="card" style="padding:0;">
      <div style="padding:16px 20px;border-bottom:1px solid #E2DED8;display:flex;align-items:center;justify-content:space-between;">
        <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;">
          Leads (${leads.length})
        </h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>City</th>
            <th>Budget</th>
            <th>State</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>${leadsRows}</tbody>
      </table>
    </div>
  `;

  return layout({ title: name, body });
}

module.exports = { detailPage };
