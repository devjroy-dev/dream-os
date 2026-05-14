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

function detailPage({ vendor, user, state, messages, notes }) {
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
      <td style="color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;width:120px;">${k}</td>
      <td style="font-size:13px;">${v}</td>
    </tr>
  `).join('');

  const bubbles = messages.length === 0
    ? '<div class="empty-state">No messages yet.</div>'
    : messages.map(m => `
        <div class="message-row ${m.direction}">
          <div>
            <div class="bubble bubble-${m.direction}">${m.body || ''}</div>
            <div class="bubble-time">${formatTime(m.created_at)}</div>
          </div>
        </div>
      `).join('');

  const noteChips = notes.length === 0
    ? '<span style="color:#8C8480;font-size:13px;">No notes yet.</span>'
    : notes.map(n => `<span class="note-chip">${n.content}</span>`).join('');

  const body = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
      <a href="/admin" style="color:#8C8480;text-decoration:none;font-size:12px;">← All vendors</a>
    </div>

    <h1>${name}</h1>
    <p class="subtitle">${user?.phone || ''} · ${vendor.category || ''} · ${vendor.city || ''}</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <div class="card">
          <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:16px;">Profile</h3>
          <table>${profileRows}</table>
        </div>

        <div class="card">
          <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:12px;">Agent notes</h3>
          <div>${noteChips}</div>
        </div>
      </div>

      <div class="card" style="padding:20px;">
        <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C8480;margin-bottom:16px;">Conversation</h3>
        <div style="max-height:520px;overflow-y:auto;padding-right:4px;">
          ${bubbles}
        </div>
      </div>
    </div>
  `;

  return layout({ title: name, body });
}

module.exports = { detailPage };
