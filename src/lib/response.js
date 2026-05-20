'use strict';
function ok(res, payload = {}) {
  return res.status(200).json({ ok: true, ...payload });
}
function err(res, status, message, code) {
  const body = { ok: false, error: message };
  if (code) body.code = code;
  return res.status(status).json(body);
}
module.exports = { ok, err };
