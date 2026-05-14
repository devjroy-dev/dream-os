// src/admin/views/detail.js
// Session 5: adds TDW handle + Instagram to vendor profile rows

const TDW_WA_NUMBER = process.env.TDW_WA_NUMBER || '14787788550';

function renderDetail({ vendor, user, state, messages, notes, leads }) {
  const name = user?.name || vendor.id.slice(0, 8);

  const statusLabel = vendor.onboarding_state === 'complete' || !vendor.onboarding_state
    ? 'Active' : vendor.onboarding_state === 'new' ? 'Invited' : 'Onboarding';

  const tdwHandle  = vendor.routing_handle || null;
  const tdwDisplay = tdwHandle
    ? `<a href="https://wa.me/${TDW_WA_NUMBER}?text=TDW-${tdwHandle}" target="_blank" style="color:#B08D6A;text-decoration:none;">TDW-${tdwHandle}</a> <span style="color:#8C8480;font-size:11px;">· wa.me/${TDW_WA_NUMBER}?text=TDW-${tdwHandle}</span>`
    : '—';
  const igDisplay  = vendor.instagram_handle
    ? `<a href="https://instagram.com/${vendor.instagram_handle}" target="_blank" style="color:#B08D6A;text-decoration:none;">@${vendor.instagram_handle}</a>`
    : '—';

  const profileRows = [
    ['Name',      name],
    ['Phone',     user?.phone || '—'],
    ['Category',  vendor.category || '—'],
    ['City',      vendor.city || '—'],
    ['Status',    statusLabel],
    ['TDW Link',  tdwDisplay],
    ['Instagram', igDisplay],
    ['Summary',   state?.summary || '—'],
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
            <div class="bubble ${m.direction === 'inbound' ? 'bubble-in' : 'bubble-out'}">${m.body || ''}</div>
            <div class="msg-meta">${m.sent_by} · ${new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
          </div>
        </div>`).join('');

  const notesList = notes.length === 0
    ? '<div class="empty-state">No notes yet.</div>'
    : notes.map(n => `
        <div class="note-row">
          <div class="note-content">${n.content}</div>
          <div class="note-meta">${(n.tags || []).join(', ')} · ${new Date(n.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
        </div>`).join('');

  const leadsList = leads.length === 0
    ? '<div class="empty-state">No leads yet.</div>'
    : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="border-bottom:1px solid #2a2a2a;">
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Name</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Date</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">City</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Budget</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">State</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Received</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(l => {
            const budget = l.budget_min
              ? `Rs ${(l.budget_min/100000).toFixed(1)}L${l.budget_max && l.budget_max !== l.budget_min ? `–${(l.budget_max/100000).toFixed(1)}L` : ''}`
              : '—';
            return `<tr style="border-bottom:1px solid #1a1a1a;">
              <td style="padding:8px 0;">${l.name || '—'}</td>
              <td style="font-size:12px;">${l.wedding_date || '—'}</td>
              <td style="font-size:12px;">${l.wedding_city || '—'}</td>
              <td style="font-size:12px;">${budget}</td>
              <td style="font-size:12px;">${l.state}</td>
              <td style="font-size:12px;">${new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — dream-os admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111; color: #E8E0D8; font-family: 'DM Sans', system-ui, sans-serif; min-height: 100vh; }
    .topbar { background: #1a1a1a; border-bottom: 1px solid #2a2a2a; padding: 16px 32px; display: flex; align-items: center; gap: 16px; }
    .topbar a { color: #8C8480; text-decoration: none; font-size: 13px; }
    .topbar a:hover { color: #E8E0D8; }
    .topbar .sep { color: #2a2a2a; }
    h1 { font-size: 20px; font-weight: 500; }
    .subtitle { color: #8C8480; font-size: 13px; margin-top: 2px; }
    .container { max-width: 960px; margin: 0 auto; padding: 32px; }
    .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #8C8480; margin-bottom: 16px; }
    .tabs { display: flex; gap: 0; border-bottom: 1px solid #2a2a2a; margin-bottom: 24px; }
    .tab { padding: 10px 20px; font-size: 13px; color: #8C8480; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
    .tab.active { color: #E8E0D8; border-bottom-color: #B08D6A; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .message-row { display: flex; margin-bottom: 12px; }
    .message-row.outbound { justify-content: flex-end; }
    .bubble { padding: 10px 14px; border-radius: 12px; max-width: 70%; font-size: 13px; line-height: 1.5; }
    .bubble-in { background: #2a2a2a; }
    .bubble-out { background: #3a2e24; }
    .msg-meta { font-size: 10px; color: #8C8480; margin-top: 4px; }
    .message-row.outbound .msg-meta { text-align: right; }
    .note-row { padding: 10px 0; border-bottom: 1px solid #1f1f1f; }
    .note-content { font-size: 13px; }
    .note-meta { font-size: 11px; color: #8C8480; margin-top: 4px; }
    .empty-state { color: #8C8480; font-size: 13px; padding: 16px 0; }
    table { width: 100%; }
  </style>
</head>
<body>
  <div class="topbar">
    <a href="/admin">dream-os</a>
    <span class="sep">/</span>
    <span style="font-size:13px;">${name}</span>
  </div>
  <div class="container">
    <div style="margin-bottom:24px;">
      <h1>${name}</h1>
      <p class="subtitle">${user?.phone || ''} · ${vendor.category || ''} · ${vendor.city || ''}</p>
    </div>
    <div class="card">
      <div class="card-title">Profile</div>
      <table><tbody>${profileRows}</tbody></table>
    </div>
    <div class="tabs">
      <a class="tab active" onclick="showTab('messages',this)">Messages</a>
      <a class="tab" onclick="showTab('leads',this)">Leads</a>
      <a class="tab" onclick="showTab('notes',this)">Notes</a>
    </div>
    <div id="messages" class="tab-content active">${bubbles}</div>
    <div id="leads" class="tab-content">${leadsList}</div>
    <div id="notes" class="tab-content">${notesList}</div>
  </div>
  <script>
    function showTab(id, el) {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      el.classList.add('active');
    }
  </script>
</body>
</html>`;
}

module.exports = { renderDetail };
