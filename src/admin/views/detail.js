// src/admin/views/detail.js

const TDW_WA_NUMBER = process.env.TDW_WA_NUMBER || '14787788550';

function renderDetail({ vendor, user, state, messages, notes, leads, enquiries = [] }) {
  const name = user?.name || vendor.id.slice(0, 8);

  const statusLabel = vendor.onboarding_state === 'complete' || !vendor.onboarding_state
    ? 'Active' : vendor.onboarding_state === 'new' ? 'Invited' : 'Onboarding';

  const tdwHandle  = vendor.routing_handle || null;
  const tdwDisplay = tdwHandle
    ? `<a href="https://wa.me/${TDW_WA_NUMBER}?text=TDW-${tdwHandle}" target="_blank" style="color:#B08D6A;text-decoration:none;">TDW-${tdwHandle}</a> <span style="color:#999;font-size:11px;">· wa.me/${TDW_WA_NUMBER}?text=TDW-${tdwHandle}</span>`
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
      <td style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:.1em;width:120px;padding:8px 0;">${k}</td>
      <td style="font-size:13px;padding:8px 0;">${v}</td>
    </tr>
  `).join('');

  const bubbles = messages.length === 0
    ? '<div class="empty-state">No messages yet.</div>'
    : messages.slice().reverse().map(m => `
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

  const thStyle = 'text-align:left;padding:8px 0;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #eee;';
  const leadsList = leads.length === 0
    ? '<div class="empty-state">No leads yet.</div>'
    : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr>
            <th style="${thStyle}">Name</th>
            <th style="${thStyle}">Phone</th>
            <th style="${thStyle}">Date</th>
            <th style="${thStyle}">City</th>
            <th style="${thStyle}">Budget</th>
            <th style="${thStyle}">State</th>
            <th style="${thStyle}">Received</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(l => {
            const budget = l.budget_min
              ? `Rs ${(l.budget_min/100000).toFixed(1)}L${l.budget_max && l.budget_max !== l.budget_min ? `–${(l.budget_max/100000).toFixed(1)}L` : ''}`
              : '—';
            return `<tr style="border-bottom:1px solid #f0f0f0;">
              <td style="padding:8px 0;">${l.name || '—'}</td>
              <td style="font-size:12px;">${l.phone || '—'}</td>
              <td style="font-size:12px;">${l.wedding_date || '—'}</td>
              <td style="font-size:12px;">${l.wedding_city || '—'}</td>
              <td style="font-size:12px;">${budget}</td>
              <td style="font-size:12px;">${l.state}</td>
              <td style="font-size:12px;">${new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;


  const enquiriesList = enquiries.length === 0
    ? '<div class="empty-state">No enquiries yet.</div>'
    : enquiries.map(e => {
        const threadBubbles = e.messages.map(m => `
          <div class="message-row ${m.direction}">
            <div>
              <div class="bubble ${m.direction === 'inbound' ? 'bubble-in' : 'bubble-out'}">${m.body || ''}</div>
              <div class="msg-meta">${m.sent_by} · ${new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
            </div>
          </div>`).join('');
        return `
          <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:16px;">
            <div style="font-size:12px;color:#999;margin-bottom:12px;">
              <strong style="color:#333;">${e.phone}</strong> · ${new Date(e.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
            <div style="height:300px;overflow-y:auto;">${threadBubbles || '<div class="empty-state">No messages.</div>'}</div>
          </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — dream-os admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f7f7f7; color: #333; font-family: 'DM Sans', system-ui, sans-serif; min-height: 100vh; }
    .topbar { background: #fff; border-bottom: 1px solid #eee; padding: 16px 32px; display: flex; align-items: center; gap: 16px; }
    .topbar a { color: #999; text-decoration: none; font-size: 13px; }
    .topbar a:hover { color: #333; }
    .topbar .sep { color: #ddd; }
    h1 { font-size: 20px; font-weight: 500; }
    .subtitle { color: #999; font-size: 13px; margin-top: 2px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 32px; }
    .two-col { display: flex; gap: 32px; align-items: flex-start; margin-bottom: 32px; }
    .left-col { width: 380px; flex-shrink: 0; }
    .right-col { flex: 1; min-width: 0; }
    .card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #999; margin-bottom: 16px; }
    .tabs { display: flex; gap: 0; border-bottom: 1px solid #eee; margin-bottom: 24px; }
    .tab { padding: 10px 20px; font-size: 13px; color: #999; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
    .tab.active { color: #333; border-bottom-color: #B08D6A; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .message-row { display: flex; margin-bottom: 12px; }
    .message-row.outbound { justify-content: flex-end; }
    .bubble { padding: 10px 14px; border-radius: 12px; max-width: 70%; font-size: 13px; line-height: 1.5; }
    .bubble-in { background: #f5f5f5; }
    .bubble-out { background: #FFF3E8; }
    .msg-meta { font-size: 10px; color: #999; margin-top: 4px; }
    .message-row.outbound .msg-meta { text-align: right; }
    .note-row { padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
    .note-content { font-size: 13px; }
    .note-meta { font-size: 11px; color: #999; margin-top: 4px; }
    .empty-state { color: #999; font-size: 13px; padding: 16px 0; }
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
    <div class="two-col">
      <div class="left-col">
        <div class="card">
          <div class="card-title">Profile</div>
          <table><tbody>${profileRows}</tbody></table>
        </div>
      </div>
      <div class="right-col">
        <div class="card">
          <div class="card-title">Messages</div>
          <div style="height:520px;overflow-y:auto;">${bubbles}</div>
        </div>
      </div>
    </div>
    <div class="tabs">
      <a class="tab active" onclick="showTab('leads',this)">Leads</a>
      <a class="tab" onclick="showTab('enquiries',this)">Enquiries</a>
      <a class="tab" onclick="showTab('notes',this)">Notes</a>
    </div>
    <div id="leads" class="tab-content active">${leadsList}</div>
    <div id="enquiries" class="tab-content">${enquiriesList}</div>
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
