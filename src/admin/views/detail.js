// src/admin/views/detail.js

const TDW_WA_NUMBER = process.env.TDW_WA_NUMBER || '917982159047';

function renderDetail({ vendor, user, state, messages, notes, leads, enquiries = [], monthCostInr = '0.00', costByModel = {}, invoices = [], expenses = [], totalBilled = 0, totalPaid = 0, totalOutstanding = 0, totalExpenses = 0, clients = [] }) {
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

  // ── Format helpers ───────────────────────────────────────────────
  const fmtRs = n => {
    const s = String(n);
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest  = s.slice(0, -3);
    const groups = [];
    let i = rest.length;
    while (i > 0) { groups.unshift(rest.slice(Math.max(0, i - 2), i)); i -= 2; }
    return groups.join(',') + ',' + last3;
  };

  const stateColour = s => ({
    unpaid:       '#E67E22',
    advance_paid: '#2980B9',
    paid:         '#27AE60',
    cancelled:    '#999',
  }[s] || '#999');

  // ── Money tab ─────────────────────────────────────────────────────
  const moneyTab = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:28px;">
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Total Billed</div>
        <div style="font-size:20px;font-weight:700;color:#1A1A1A;">Rs ${fmtRs(totalBilled)}</div>
      </div>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Total Received</div>
        <div style="font-size:20px;font-weight:700;color:#27AE60;">Rs ${fmtRs(totalPaid)}</div>
      </div>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Outstanding</div>
        <div style="font-size:20px;font-weight:700;color:#E67E22;">Rs ${fmtRs(totalOutstanding)}</div>
      </div>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;">
        <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Total Expenses</div>
        <div style="font-size:20px;font-weight:700;color:#C0392B;">Rs ${fmtRs(totalExpenses)}</div>
      </div>
    </div>

    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;margin-bottom:12px;">Invoices</div>
    ${invoices.length === 0 ? '<div class="empty-state">No invoices yet.</div>' : (() => {
      const LIMIT = 5;
      const invoiceRow = i => {
        const balance = i.amount_total - i.amount_paid;
        const due = i.due_date ? `<div style="font-size:10px;color:#999;">due ${i.due_date}</div>` : '';
        const pdfLink = i.pdf_url ? `<a href="${i.pdf_url}" target="_blank" style="color:#B08D6A;font-size:11px;">View</a>` : '<span style="color:#ccc;font-size:11px;">—</span>';
        return `<tr style="border-bottom:1px solid #f5f5f5;">
          <td style="padding:8px 0;font-weight:600;">${i.invoice_number}</td>
          <td style="padding:8px 0;">${i.client_name}</td>
          <td style="padding:8px 0;text-align:right;">Rs ${fmtRs(i.amount_total)}</td>
          <td style="padding:8px 0;text-align:right;color:#27AE60;">Rs ${fmtRs(i.amount_paid)}</td>
          <td style="padding:8px 0;text-align:right;color:#E67E22;">${balance > 0 ? 'Rs ' + fmtRs(balance) : '—'}${due}</td>
          <td style="padding:8px 0;text-align:center;"><span style="background:${stateColour(i.state)}22;color:${stateColour(i.state)};padding:2px 8px;border-radius:4px;font-size:11px;">${i.state}</span></td>
          <td style="padding:8px 0;text-align:center;">${pdfLink}</td>
        </tr>`;
      };
      const visible = invoices.slice(0, LIMIT);
      const hidden  = invoices.slice(LIMIT);
      const hiddenRows = hidden.length > 0
        ? `<tbody id="inv-extra" style="display:none;">${hidden.map(invoiceRow).join('')}</tbody>
           <tbody><tr><td colspan="7" style="padding:10px 0;">
             <a href="#" onclick="var e=document.getElementById('inv-extra');var l=document.getElementById('inv-lnk');e.style.display=e.style.display==='none'?'':'none';l.textContent=e.style.display===''?'Show ${hidden.length} more ↓':'Show fewer ↑';return false;" id="inv-lnk" style="font-size:12px;color:#B08D6A;">Show ${hidden.length} more ↓</a>
           </td></tr></tbody>`
        : '';
      return `<table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;">
          <th style="text-align:left;padding:6px 0;">Invoice</th>
          <th style="text-align:left;padding:6px 0;">Client</th>
          <th style="text-align:right;padding:6px 0;">Total</th>
          <th style="text-align:right;padding:6px 0;">Paid</th>
          <th style="text-align:right;padding:6px 0;">Balance</th>
          <th style="text-align:center;padding:6px 0;">State</th>
          <th style="text-align:center;padding:6px 0;">PDF</th>
        </tr></thead>
        <tbody>${visible.map(invoiceRow).join('')}</tbody>
        ${hiddenRows}
      </table>`;
    })()}

    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#999;margin-top:28px;margin-bottom:12px;">Expenses</div>
    ${expenses.length === 0 ? '<div class="empty-state">No expenses logged yet.</div>' : (() => {
      const LIMIT = 5;
      const expRow = e => `<tr style="border-bottom:1px solid #f5f5f5;">
        <td style="padding:8px 0;color:#999;">${e.expense_date || '—'}</td>
        <td style="padding:8px 0;">${e.category}</td>
        <td style="padding:8px 0;">${e.description || '—'}</td>
        <td style="padding:8px 0;">${e.client_name || '—'}</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;color:#C0392B;">Rs ${fmtRs(e.amount)}</td>
      </tr>`;
      const visible = expenses.slice(0, LIMIT);
      const hidden  = expenses.slice(LIMIT);
      const hiddenRows = hidden.length > 0
        ? `<tbody id="exp-extra" style="display:none;">${hidden.map(expRow).join('')}</tbody>
           <tbody><tr><td colspan="5" style="padding:10px 0;">
             <a href="#" onclick="var e=document.getElementById('exp-extra');var l=document.getElementById('exp-lnk');e.style.display=e.style.display==='none'?'':'none';l.textContent=e.style.display===''?'Show ${hidden.length} more ↓':'Show fewer ↑';return false;" id="exp-lnk" style="font-size:12px;color:#B08D6A;">Show ${hidden.length} more ↓</a>
           </td></tr></tbody>`
        : '';
      return `<table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;">
          <th style="text-align:left;padding:6px 0;">Date</th>
          <th style="text-align:left;padding:6px 0;">Category</th>
          <th style="text-align:left;padding:6px 0;">Description</th>
          <th style="text-align:left;padding:6px 0;">Client</th>
          <th style="text-align:right;padding:6px 0;">Amount</th>
        </tr></thead>
        <tbody>${visible.map(expRow).join('')}</tbody>
        ${hiddenRows}
      </table>`;
    })()}
  `;

  // ── Clients tab ───────────────────────────────────────────────────
  const sourceLabel = s => ({
    manual_add:      'Manual',
    lead_promotion:  'Promoted from lead',
    discover:        'Discover',
  }[s] || s);

  const sourceColour = s => ({
    manual_add:      '#7F8C8D',
    lead_promotion:  '#27AE60',
    discover:        '#8E44AD',
  }[s] || '#999');

  // Same-name duplicate detection (case-insensitive, trimmed)
  const nameCounts = {};
  clients.forEach(c => {
    const key = (c.name || '').trim().toLowerCase();
    if (key) nameCounts[key] = (nameCounts[key] || 0) + 1;
  });
  const isDuplicate = c => {
    const key = (c.name || '').trim().toLowerCase();
    return nameCounts[key] > 1;
  };

  const clientsTab = clients.length === 0
    ? '<div class="empty-state">No clients yet.</div>'
    : (() => {
        const LIMIT = 5;
        const clientRow = c => {
          const dupPill = isDuplicate(c)
            ? '<span style="background:#F1C40F22;color:#B7950B;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px;">possible duplicate</span>'
            : '';
          const dateStr = c.created_at ? c.created_at.slice(0, 10) : '—';
          return `<tr style="border-bottom:1px solid #f5f5f5;">
            <td style="padding:8px 0;font-weight:600;">${c.name}${dupPill}</td>
            <td style="padding:8px 0;">${c.phone || '<span style=\"color:#ccc;\">—</span>'}</td>
            <td style="padding:8px 0;">${c.email || '<span style=\"color:#ccc;\">—</span>'}</td>
            <td style="padding:8px 0;text-align:center;"><span style="background:${sourceColour(c.source)}22;color:${sourceColour(c.source)};padding:2px 8px;border-radius:4px;font-size:11px;">${sourceLabel(c.source)}</span></td>
            <td style="padding:8px 0;">${c.referrer_name || '<span style=\"color:#ccc;\">—</span>'}</td>
            <td style="padding:8px 0;color:#999;font-size:11px;">${dateStr}</td>
          </tr>`;
        };
        const visible = clients.slice(0, LIMIT);
        const hidden  = clients.slice(LIMIT);
        const hiddenRows = hidden.length > 0
          ? `<tbody id="cli-extra" style="display:none;">${hidden.map(clientRow).join('')}</tbody>
             <tbody><tr><td colspan="6" style="padding:10px 0;">
               <a href="#" onclick="var e=document.getElementById('cli-extra');var l=document.getElementById('cli-lnk');e.style.display=e.style.display==='none'?'':'none';l.textContent=e.style.display===''?'Show ${hidden.length} more ↓':'Show fewer ↑';return false;" id="cli-lnk" style="font-size:12px;color:#B08D6A;">Show ${hidden.length} more ↓</a>
             </td></tr></tbody>`
          : '';
        return `<table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #eee;">
            <th style="text-align:left;padding:6px 0;">Name</th>
            <th style="text-align:left;padding:6px 0;">Phone</th>
            <th style="text-align:left;padding:6px 0;">Email</th>
            <th style="text-align:center;padding:6px 0;">Source</th>
            <th style="text-align:left;padding:6px 0;">Referrer</th>
            <th style="text-align:left;padding:6px 0;">Added</th>
          </tr></thead>
          <tbody>${visible.map(clientRow).join('')}</tbody>
          ${hiddenRows}
        </table>`;
      })();

  // ── Build AI cost display string
  const costModelParts = Object.entries(costByModel).map(([m, c]) => {
    const label = m.includes('sonnet') ? 'Sonnet' : m.includes('haiku') ? 'Haiku' : m;
    return `${label}: Rs ${parseFloat(c).toFixed(2)}`;
  });
  const costDisplay = parseFloat(monthCostInr) === 0
    ? 'Rs 0.00 (no agent calls this month)'
    : `Rs ${monthCostInr}${costModelParts.length > 0 ? ' · ' + costModelParts.join(', ') : ''}`;

  const profileRows = [
    ['Name',           name],
    ['Phone',          user?.phone || '—'],
    ['Category',       vendor.category || '—'],
    ['Style',          vendor.style_notes || '—'],
    ['City',           vendor.city || '—'],
    ['Status',         statusLabel],
    ['TDW Link',       tdwDisplay],
    ['Instagram',      igDisplay],
    ['Summary',        state?.summary || '—'],
    ['AI Cost (month)', costDisplay],
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
      <a class="tab" onclick="showTab('money',this)">Money</a>
      <a class="tab" onclick="showTab('clients',this)">Clients</a>
    </div>
    <div id="leads" class="tab-content active">${leadsList}</div>
    <div id="enquiries" class="tab-content">${enquiriesList}</div>
    <div id="notes" class="tab-content">${notesList}</div>
    <div id="money" class="tab-content">${moneyTab}</div>
    <div id="clients" class="tab-content">${clientsTab}</div>
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
