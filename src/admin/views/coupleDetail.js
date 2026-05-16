// coupleDetail.js — bride detail page for admin
//
// Simpler than vendor's detail.js — no leads, clients, invoices, expenses,
// or enquiries tabs. B1 ships profile + notes + events + conversation.

const { layout } = require('./layout');

function statusBadge(state) {
  if (!state || state === 'complete') return '<span class="badge badge-active">Active</span>';
  if (state === 'new') return '<span class="badge badge-invited">Invited</span>';
  return '<span class="badge badge-onboarding">Onboarding</span>';
}

function formatDate(d) {
  if (!d) return '—';
  return d;
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
}

function formatBudget(n) {
  if (n === null || n === undefined) return '—';
  return `Rs ${parseInt(n, 10).toLocaleString('en-IN')}`;
}

function renderConversation(messages) {
  if (!messages || messages.length === 0) {
    return `<div class="empty-state">No messages yet.</div>`;
  }
  return messages.map(m => {
    const direction = m.direction === 'inbound' ? 'inbound' : 'outbound';
    const bubble    = m.direction === 'inbound' ? 'bubble-inbound' : 'bubble-outbound';
    const time      = formatDateTime(m.created_at);
    const body      = (m.body || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    return `
      <div class="message-row ${direction}">
        <div>
          <div class="bubble ${bubble}">${body}</div>
          <div class="bubble-time">${time}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderNotes(notes) {
  if (!notes || notes.length === 0) {
    return `<div class="empty-state">No notes yet.</div>`;
  }
  return notes.map(n => {
    const tagsHtml = (n.tags || []).map(t => `<span class="note-chip" style="font-size:10px;">${t}</span>`).join('');
    return `
      <div style="padding: 12px 0; border-bottom: 1px solid #F4F1EC;">
        <div style="font-size:13px;color:#0C0A09;line-height:1.5;">${(n.content || '').replace(/</g,'&lt;')}</div>
        <div style="margin-top:6px;display:flex;align-items:center;gap:10px;">
          ${tagsHtml}
          <span style="font-size:10px;color:#8C8480;">${formatDateTime(n.created_at)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderEvents(events) {
  if (!events || events.length === 0) {
    return `<div class="empty-state">No upcoming events.</div>`;
  }
  return events.map(e => `
    <div style="padding: 12px 0; border-bottom: 1px solid #F4F1EC; display:flex; gap:16px; align-items:center;">
      <div style="min-width:90px;font-family:Georgia,serif;font-size:14px;color:#0C0A09;">${formatDate(e.event_date)}${e.event_time ? `<br><span style="font-size:11px;color:#8C8480;">${e.event_time}</span>` : ''}</div>
      <div style="flex:1;">
        <div style="font-size:13px;color:#0C0A09;font-weight:500;">${(e.title || '—').replace(/</g,'&lt;')}</div>
        <div style="font-size:11px;color:#8C8480;margin-top:2px;text-transform:uppercase;letter-spacing:0.06em;">${e.kind}</div>
      </div>
    </div>
  `).join('');
}

function coupleDetailPage({ couple, user, state, notes, events, messages }) {
  const brideName = user?.name || '—';
  const phone     = user?.phone || '—';

  const body = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
      <div>
        <h1>${brideName}</h1>
        <p class="subtitle">${phone} · ${statusBadge(couple.onboarding_state)}</p>
      </div>
      <a href="/admin/couples" class="btn btn-sm" style="background:#fff;border:1px solid #E2DED8;color:#0C0A09;">← All couples</a>
    </div>

    <div class="card">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
        <div>
          <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8C8480;">Partner</div>
          <div style="font-size:14px;color:#0C0A09;margin-top:4px;">${couple.partner_name || '—'}</div>
        </div>
        <div>
          <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8C8480;">Wedding date</div>
          <div style="font-size:14px;color:#0C0A09;margin-top:4px;">${formatDate(couple.wedding_date)}</div>
        </div>
        <div>
          <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8C8480;">Wedding city</div>
          <div style="font-size:14px;color:#0C0A09;margin-top:4px;">${couple.wedding_city || '—'}</div>
        </div>
        <div>
          <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8C8480;">Budget</div>
          <div style="font-size:14px;color:#0C0A09;margin-top:4px;">${formatBudget(couple.budget_total)}</div>
        </div>
        ${couple.events_planned && couple.events_planned.length > 0 ? `
          <div style="grid-column:1/-1;">
            <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8C8480;">Events planned</div>
            <div style="margin-top:6px;">${couple.events_planned.map(e => `<span class="note-chip">${e}</span>`).join('')}</div>
          </div>
        ` : ''}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
      <div class="card">
        <h2 style="font-family:Georgia,serif;font-weight:300;font-size:18px;margin-bottom:14px;">Recent notes</h2>
        ${renderNotes(notes)}
      </div>

      <div class="card">
        <h2 style="font-family:Georgia,serif;font-weight:300;font-size:18px;margin-bottom:14px;">Upcoming events</h2>
        ${renderEvents(events)}
      </div>
    </div>

    <div class="card">
      <h2 style="font-family:Georgia,serif;font-weight:300;font-size:18px;margin-bottom:14px;">Conversation</h2>
      ${renderConversation(messages)}
    </div>
  `;

  return layout({ title: brideName, body, activeNav: 'couples' });
}

module.exports = { coupleDetailPage };
