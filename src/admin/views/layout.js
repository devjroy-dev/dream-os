// layout.js — shared HTML wrapper for all admin pages

function layout({ title, body, activeNav = 'vendors' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Dream OS Admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'DM Sans', -apple-system, sans-serif;
      background: #F8F7F5;
      color: #0C0A09;
      min-height: 100vh;
    }

    nav {
      background: #0C0A09;
      padding: 0 32px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    nav .wordmark {
      font-family: Georgia, serif;
      font-weight: 300;
      font-size: 15px;
      color: #F8F7F5;
      letter-spacing: 0.08em;
    }

    nav .wordmark span {
      color: #C9A84C;
    }

    nav .nav-links {
      display: flex;
      gap: 24px;
    }

    nav a {
      color: #8C8480;
      text-decoration: none;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      transition: color 0.15s;
    }

    nav a:hover, nav a.active { color: #F8F7F5; }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 40px 32px;
    }

    h1 {
      font-family: Georgia, serif;
      font-weight: 300;
      font-size: 28px;
      letter-spacing: 0.02em;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 13px;
      color: #8C8480;
      margin-bottom: 32px;
    }

    .card {
      background: #fff;
      border: 1px solid #E2DED8;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #8C8480;
      padding: 10px 16px;
      border-bottom: 1px solid #E2DED8;
    }

    td {
      padding: 14px 16px;
      font-size: 13px;
      border-bottom: 1px solid #F4F1EC;
      vertical-align: middle;
    }

    tr:last-child td { border-bottom: none; }

    tr:hover td { background: #FAFAFA; }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 500;
    }

    .badge-active   { background: #E8F5E9; color: #2E7D32; }
    .badge-onboarding { background: #FFF3E0; color: #E65100; }
    .badge-invited  { background: #F3E5F5; color: #6A1B9A; }
    .badge-new      { background: #E3F2FD; color: #1565C0; }

    .btn {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: opacity 0.15s;
    }

    .btn:hover { opacity: 0.85; }

    .btn-primary {
      background: #0C0A09;
      color: #F8F7F5;
    }

    .btn-gold {
      background: #C9A84C;
      color: #0C0A09;
    }

    .btn-sm {
      padding: 6px 14px;
      font-size: 11px;
    }

    input[type=text], input[type=password], input[type=tel] {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #E2DED8;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      background: #FAFAFA;
      color: #0C0A09;
      margin-top: 6px;
    }

    input:focus {
      outline: none;
      border-color: #C9A84C;
      background: #fff;
    }

    label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8C8480;
    }

    .form-group { margin-bottom: 18px; }

    .error-msg {
      background: #FFF3F3;
      border: 1px solid #FFCDD2;
      color: #C62828;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .success-msg {
      background: #F1F8E9;
      border: 1px solid #C5E1A5;
      color: #33691E;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .message-row {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }

    .message-row.inbound { justify-content: flex-start; }
    .message-row.outbound { justify-content: flex-end; }

    .bubble {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
    }

    .bubble-inbound {
      background: #fff;
      border: 1px solid #E2DED8;
      border-bottom-left-radius: 3px;
    }

    .bubble-outbound {
      background: #0C0A09;
      color: #F8F7F5;
      border-bottom-right-radius: 3px;
    }

    .bubble-time {
      font-size: 10px;
      color: #8C8480;
      margin-top: 4px;
      text-align: right;
    }

    .note-chip {
      display: inline-block;
      background: #F4F1EC;
      border: 1px solid #E2DED8;
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 12px;
      margin: 4px;
      color: #555250;
    }

    .stat-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: #fff;
      border: 1px solid #E2DED8;
      border-radius: 8px;
      padding: 20px 24px;
    }

    .stat-number {
      font-family: Georgia, serif;
      font-size: 32px;
      font-weight: 300;
      color: #0C0A09;
    }

    .stat-label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8C8480;
      margin-top: 4px;
    }

    a.row-link { color: #0C0A09; text-decoration: none; }
    a.row-link:hover { color: #C9A84C; }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #8C8480;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <nav>
    <div class="wordmark">dream<span>os</span> admin</div>
    <div class="nav-links">
      <a href="/admin" class="${activeNav === 'vendors' ? 'active' : ''}">Vendors</a>
      <a href="/admin/couples" class="${activeNav === 'couples' ? 'active' : ''}">Couples</a>
      <a href="/admin/unified-invite" class="${activeNav === 'invite' ? 'active' : ''}">Invite</a>
      <a href="/admin/invite-codes" class="${activeNav === 'invite-codes' ? 'active' : ''}">Invite Codes</a>
      <a href="/admin/logout">Sign out</a>
    </div>
  </nav>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

module.exports = { layout };
