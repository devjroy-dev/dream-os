function loginPage({ error } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Dream OS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, sans-serif;
      background: #F8F7F5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-card {
      background: #fff;
      border: 1px solid #E2DED8;
      border-radius: 12px;
      padding: 40px;
      width: 360px;
    }
    .wordmark {
      font-family: Georgia, serif;
      font-weight: 300;
      font-size: 22px;
      color: #0C0A09;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .wordmark span { color: #C9A84C; }
    .subtitle {
      font-size: 12px;
      color: #8C8480;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 32px;
    }
    label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8C8480;
      display: block;
      margin-bottom: 6px;
    }
    input[type=password] {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #E2DED8;
      border-radius: 6px;
      font-size: 14px;
      background: #FAFAFA;
      margin-bottom: 20px;
    }
    input:focus { outline: none; border-color: #C9A84C; background: #fff; }
    button {
      width: 100%;
      padding: 12px;
      background: #0C0A09;
      color: #F8F7F5;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      cursor: pointer;
    }
    button:hover { opacity: 0.85; }
    .error {
      background: #FFF3F3;
      border: 1px solid #FFCDD2;
      color: #C62828;
      padding: 10px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 16px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="wordmark">dream<span>os</span></div>
    <div class="subtitle">Admin access</div>
    ${error ? '<div class="error">Incorrect password. Try again.</div>' : ''}
    <form method="POST" action="/admin/login">
      <label>Password</label>
      <input type="password" name="password" autofocus placeholder="••••••••••" />
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>`;
}

module.exports = { loginPage };
