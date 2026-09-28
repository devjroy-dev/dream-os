// src/lib/domains/vercelDomains.js — TDW · CE-46 · WEB-1 cut 2 · THE HOST, BEHIND ONE CLIENT.
//
// Vercel's REST API (read 28 September 2026): POST /v10/projects/{id}/domains
// adds a domain to the project; GET /v9/projects/{id}/domains/{domain} reads it
// (`verified`); GET /v6/domains/{domain}/config reads `misconfigured` and, once
// the records point here, the certificate follows on Vercel's side. Bearer
// VERCEL_TOKEN; teamId from VERCEL_TEAM_ID when set. The registrar's
// nameservers are set to Vercel's (NAMESERVERS) at registration, so no record
// is typed by anyone. Injectable fetch, as resellerclub.js.
'use strict';

const NAMESERVERS = Object.freeze(['ns1.vercel-dns.com', 'ns2.vercel-dns.com']);
const API = () => (process.env.VERCEL_API_BASE || 'https://api.vercel.com').replace(/\/$/, '');

function env() {
  const token = (process.env.VERCEL_TOKEN || '').trim();
  const project = (process.env.VERCEL_PROJECT_ID || '').trim();
  if (!token || !project) throw new Error('vercel: VERCEL_TOKEN and VERCEL_PROJECT_ID are required');
  const team = (process.env.VERCEL_TEAM_ID || '').trim();
  return { token, project, team };
}

async function call(deps, method, pathname, body) {
  const f = deps.fetch || globalThis.fetch;
  const { token, team } = env();
  const url = `${API()}${pathname}${team ? (pathname.includes('?') ? '&' : '?') + 'teamId=' + encodeURIComponent(team) : ''}`;
  const r = await f(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok && !(r.status === 409)) throw new Error(`vercel ${pathname} ${r.status}: ${String(text).slice(0, 200)}`);
  return { status: r.status, body: json };
}

/** Adds the domain to the project; 409 (already added) counts as added. */
async function addDomain(domain, deps = {}) {
  const { project } = env();
  const r = await call(deps, 'POST', `/v10/projects/${encodeURIComponent(project)}/domains`, { name: domain });
  return { added: r.status === 200 || r.status === 201 || r.status === 409, verified: Boolean(r.body && r.body.verified) };
}

/** What Vercel sees now: verified (ownership) and configured (DNS points here). */
async function status(domain, deps = {}) {
  const { project } = env();
  const d = await call(deps, 'GET', `/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}`);
  const c = await call(deps, 'GET', `/v6/domains/${encodeURIComponent(domain)}/config`);
  return { verified: Boolean(d.body && d.body.verified), configured: c.body ? c.body.misconfigured === false : false };
}

module.exports = { addDomain, status, NAMESERVERS };
