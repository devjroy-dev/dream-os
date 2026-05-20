// lib/api/_base.ts
// Foundation: base URL, auth header, response handler.
// All API calls go through getJson / postJson / patchJson — never raw fetch in screens.
//
// Token refresh (added): when any authenticated request returns 401,
// the client attempts one silent refresh using the stored refresh_token.
// On success: updates localStorage with new tokens, retries the original request.
// On failure: clears session, redirects to /wedding/login.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  'https://dream-os-production.up.railway.app';

export const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

const SESSION_KEY = 'vendor_session';

// ── Session helpers ───────────────────────────────────────────────────────
function readSession(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeSession(patch: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = readSession() || {};
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {}
}

function clearAndRedirect(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(SESSION_KEY); } catch {}
  window.location.href = '/wedding/login';
}

// ── Auth header ───────────────────────────────────────────────────────────
export function getAuthHeader(): Record<string, string> {
  const session = readSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// ── Token refresh ─────────────────────────────────────────────────────────
// Called when a request returns 401. Attempts to get a new access_token
// using the stored refresh_token via Supabase's token endpoint.
// Returns true if refresh succeeded (new tokens stored), false otherwise.
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts — only one in-flight at a time
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const session = readSession();
      if (!session?.refresh_token) return false;

      // Supabase token refresh endpoint
      const res = await fetch(`${API_BASE}/api/v2/vendor/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (!res.ok) return false;

      const data = await res.json().catch(() => null);
      if (!data?.access_token) return false;

      // Update stored tokens
      writeSession({
        access_token:  data.access_token,
        refresh_token: data.refresh_token || session.refresh_token,
      });

      return true;
    } catch {
      return false;
    } finally {
      isRefreshing     = false;
      refreshPromise   = null;
    }
  })();

  return refreshPromise;
}

// ── Response handler ──────────────────────────────────────────────────────
export async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({ ok: false, error: 'Invalid JSON from server.' }));
  return body as T;
}

// ── Fetch with auto-refresh ───────────────────────────────────────────────
// Wraps fetch: on 401, refresh once and retry. On second 401, redirect to login.
async function fetchWithAuth(url: string, init: RequestInit): Promise<Response> {
  let res = await fetch(url, init);

  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearAndRedirect();
      // Return the 401 so the caller can handle it (redirect already queued)
      return res;
    }
    // Retry with new token
    const newHeaders = {
      ...(init.headers as Record<string, string> || {}),
      ...getAuthHeader(),
    };
    res = await fetch(url, { ...init, headers: newHeaders });

    if (res.status === 401) {
      // Refresh token itself expired — force logout
      clearAndRedirect();
    }
  }

  return res;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────
export async function getJson<T>(path: string, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) Object.assign(headers, getAuthHeader());

  const res = auth
    ? await fetchWithAuth(`${API_BASE}${path}`, { method: 'GET', headers })
    : await fetch(`${API_BASE}${path}`, { method: 'GET', headers });

  return handleResponse<T>(res);
}

export async function postJson<T>(path: string, body: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) Object.assign(headers, getAuthHeader());

  const init: RequestInit = { method: 'POST', headers, body: JSON.stringify(body) };

  const res = auth
    ? await fetchWithAuth(`${API_BASE}${path}`, init)
    : await fetch(`${API_BASE}${path}`, init);

  return handleResponse<T>(res);
}

export async function patchJson<T>(path: string, body: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) Object.assign(headers, getAuthHeader());

  const init: RequestInit = { method: 'PATCH', headers, body: JSON.stringify(body) };

  const res = auth
    ? await fetchWithAuth(`${API_BASE}${path}`, init)
    : await fetch(`${API_BASE}${path}`, init);

  return handleResponse<T>(res);
}

export async function deleteJson<T>(path: string, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) Object.assign(headers, getAuthHeader());

  const init: RequestInit = { method: 'DELETE', headers };

  const res = auth
    ? await fetchWithAuth(`${API_BASE}${path}`, init)
    : await fetch(`${API_BASE}${path}`, init);

  return handleResponse<T>(res);
}
