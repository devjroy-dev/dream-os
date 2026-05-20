// lib/api/vendor.ts
// One exported async function per vendor contract endpoint.
// Screen components import from here — never raw fetch.

import { getJson, postJson, patchJson, API_BASE, getAuthHeader, USE_MOCKS } from './_base';
import { getMockContext, getMockLeads, getMockClients, getMockInvoices,
         getMockExpenses, getMockEvents, getMockMe } from '../mocks/vendor';
import type {
  MeResponse, VendorContextResponse, TodayResponse,
  LeadsResponse,
  ClientsResponse, ClientDetailResponse,
  InvoicesResponse, ExpensesResponse, EventsResponse,
  ChatResponse, ContactCard, ClarifyPayload,
  SendOtpResponse, VerifyOtpResponse, PinStatusResponse, PinLoginResponse,
} from '../types/vendor';

// ── Profile ───────────────────────────────────────────────────────────────
export function fetchMe(): Promise<MeResponse> {
  if (USE_MOCKS) return Promise.resolve(getMockMe());
  return getJson<MeResponse>('/api/v2/vendor/me');
}

// ── Context (snapshot panel) ──────────────────────────────────────────────
export function fetchContext(vendorId: string): Promise<VendorContextResponse> {
  if (USE_MOCKS) return Promise.resolve(getMockContext());
  return getJson<VendorContextResponse>(`/api/v2/vendor/context/${vendorId}`);
}

// ── Today dashboard ───────────────────────────────────────────────────────
export function fetchToday(vendorId: string): Promise<TodayResponse> {
  if (USE_MOCKS) {
    return Promise.resolve({
      ok: true,
      vendor: { name: 'Dev', category: 'photography', city: 'Delhi' },
      needs_attention: { overdue_invoices: [], new_leads: [], events_today: [] },
      this_week: [],
      money_snapshot: { total_outstanding: 0, unpaid_count: 0, advance_paid_count: 0 },
      open_leads_count: 0,
    });
  }
  return getJson<TodayResponse>(`/api/v2/vendor/today/${vendorId}`);
}

// ── Leads ─────────────────────────────────────────────────────────────────
export function fetchLeads(vendorId: string, state = 'all'): Promise<LeadsResponse> {
  if (USE_MOCKS) return Promise.resolve(getMockLeads());
  return getJson<LeadsResponse>(`/api/v2/vendor/leads/${vendorId}?state=${state}`);
}

export function patchLeadState(leadId: string, state: string, reason?: string): Promise<LeadStateResponse> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, lead: { id: leadId, state } });
  return patchJson<LeadStateResponse>(`/api/v2/vendor/leads/${leadId}/state`, { state, reason });
}

// ── Clients ───────────────────────────────────────────────────────────────
export function fetchClients(vendorId: string): Promise<ClientsResponse> {
  if (USE_MOCKS) return Promise.resolve(getMockClients());
  return getJson<ClientsResponse>(`/api/v2/vendor/clients/${vendorId}`);
}

export function fetchClientDetail(vendorId: string, clientId: string): Promise<ClientDetailResponse> {
  if (USE_MOCKS) {
    const clients = getMockClients().clients;
    const client = clients.find(c => c.id === clientId) ?? clients[0];
    return Promise.resolve({
      ok: true,
      client: { id: client.id, name: client.name, phone: client.phone, email: client.email, notes: client.notes },
      leads: [],
      invoices: [],
    });
  }
  return getJson<ClientDetailResponse>(`/api/v2/vendor/clients/${vendorId}/${clientId}`);
}

// ── Invoices ──────────────────────────────────────────────────────────────
export function fetchInvoices(vendorId: string, state = 'all'): Promise<InvoicesResponse> {
  if (USE_MOCKS) return Promise.resolve(getMockInvoices());
  return getJson<InvoicesResponse>(`/api/v2/vendor/invoices/${vendorId}?state=${state}`);
}

// ── Expenses ──────────────────────────────────────────────────────────────
export function fetchExpenses(vendorId: string): Promise<ExpensesResponse> {
  if (USE_MOCKS) return Promise.resolve(getMockExpenses());
  return getJson<ExpensesResponse>(`/api/v2/vendor/expenses/${vendorId}`);
}

// ── Events ────────────────────────────────────────────────────────────────
export function fetchEvents(vendorId: string, state = 'upcoming'): Promise<EventsResponse> {
  if (USE_MOCKS) return Promise.resolve(getMockEvents());
  return getJson<EventsResponse>(`/api/v2/vendor/events/${vendorId}?state=${state}`);
}

// ── Chat — JSON fallback (mock / non-streaming clients) ───────────────────
export function sendChat(vendorId: string, message: string, history: {role:string;content:string}[], aiPrimer?: string): Promise<ChatResponse> {
  if (USE_MOCKS) {
    return Promise.resolve({ ok: true, reply: `Mock reply to: "${message}"`, tool_calls: [] });
  }
  const body: Record<string,unknown> = { vendor_id: vendorId, message, history };
  if (aiPrimer) body.ai_primer = aiPrimer;
  return postJson<ChatResponse>('/api/v2/vendor/chat', body);
}

// ── Chat — SSE streaming ──────────────────────────────────────────────────
// Sends Accept: text/event-stream. Backend streams text_delta events
// word-by-word, then a done event with tool_calls, refresh, contact, clarify.
//
// Calls onDelta(text) for each streamed word.
// Calls onDone(result) when the stream closes with the full result.
// Returns a cleanup function — call it to abort the stream.

export type StreamDonePayload = {
  tool_calls: string[];
  refresh?: boolean;
  contact?: ContactCard;
  clarify?: ClarifyPayload;
};

export function streamChat(
  vendorId: string,
  message: string,
  aiPrimer: string | undefined,
  onDelta: (text: string) => void,
  onDone: (result: StreamDonePayload) => void,
  onError: (msg: string) => void,
): () => void {
  const controller = new AbortController();
  const bodyPayload: Record<string, unknown> = { vendor_id: vendorId, message, history: [] };
  if (aiPrimer) bodyPayload.ai_primer = aiPrimer;
  const bodyStr = JSON.stringify(bodyPayload);

  async function attemptStream(retried = false): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...getAuthHeader(),
    };

    const res = await fetch(`${API_BASE}/api/v2/vendor/chat`, {
      method: 'POST',
      headers,
      body: bodyStr,
      signal: controller.signal,
    });

    // ── Token refresh on 401 ───────────────────────────────────────────
    if (res.status === 401 && !retried) {
      try {
        const session = (() => {
          if (typeof window === 'undefined') return null;
          try { return JSON.parse(window.localStorage.getItem('vendor_session') || ''); } catch { return null; }
        })();

        if (!session?.refresh_token) throw new Error('no refresh token');

        const refreshRes = await fetch(`${API_BASE}/api/v2/vendor/auth/refresh`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refresh_token: session.refresh_token }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json().catch(() => null);
          if (data?.access_token && typeof window !== 'undefined') {
            window.localStorage.setItem('vendor_session', JSON.stringify({
              ...session,
              access_token:  data.access_token,
              refresh_token: data.refresh_token || session.refresh_token,
            }));
            return attemptStream(true);
          }
        }
      } catch {
        // Refresh failed — fall through to redirect
      }
      if (typeof window !== 'undefined') {
        try { window.localStorage.removeItem('vendor_session'); } catch {}
        window.location.href = '/wedding/login';
      }
      return;
    }

    if (!res.ok || !res.body) {
      onError('Connection failed. Try again.');
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;

        try {
          const event = JSON.parse(payload);
          if (event.type === 'text_delta' && event.text) {
            onDelta(event.text);
          } else if (event.type === 'done') {
            onDone({
              tool_calls: event.tool_calls ?? [],
              refresh:    event.refresh,
              contact:    event.contact,
              clarify:    event.clarify,
            });
          } else if (event.type === 'error') {
            onError(event.message ?? 'Agent error. Try again.');
          }
        } catch {
          // Malformed SSE line — skip
        }
      }
    }
  }

  (async () => {
    try {
      await attemptStream();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      onError('Network error. Try again.');
    }
  })();

  return () => controller.abort();
}


// ── Auth ──────────────────────────────────────────────────────────────────
export function sendOtp(phone: string): Promise<SendOtpResponse> {
  return postJson<SendOtpResponse>('/api/v2/vendor/auth/send-otp', { phone }, false);
}

export function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  return postJson<VerifyOtpResponse>('/api/v2/vendor/auth/verify-otp', { phone, otp, purpose: 'login' }, false);
}

export function pinStatus(phone: string): Promise<PinStatusResponse> {
  return getJson<PinStatusResponse>(`/api/v2/auth/pin-status?phone=${encodeURIComponent(phone)}&role=vendor`, false);
}

export function pinLogin(phone: string, pin: string): Promise<PinLoginResponse> {
  return postJson<PinLoginResponse>('/api/v2/vendor/auth/pin-login', { phone, pin }, false);
}

export function setPin(vendorId: string, pin: string): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>('/api/v2/vendor/auth/set-pin', { vendor_id: vendorId, pin }, false);
}

export function forgotPin(phone: string): Promise<SendOtpResponse> {
  return postJson<SendOtpResponse>('/api/v2/vendor/auth/forgot-pin', { phone }, false);
}

// ════════════════════════════════════════════════════════════════════
// Block 1b — typed write functions (20 new exports)
// ════════════════════════════════════════════════════════════════════

import { deleteJson } from './_base';
import type {
  // Common
  ApiErr,
  LeadStateResponse,
  // Leads
  CreateLeadRequest, CreateLeadResponse,
  UpdateLeadRequest, UpdateLeadResponse, LeadDetailResponse,
  // Clients
  CreateClientRequest, CreateClientResponse,
  UpdateClientRequest, UpdateClientResponse,
  // Invoices
  CreateInvoiceRequest, CreateInvoiceResponse,
  UpdateInvoiceRequest, UpdateInvoiceResponse,
  RecordPaymentRequest, RecordPaymentResponse,
  InvoicePdfResponse,
  // Expenses
  CreateExpenseRequest, CreateExpenseResponse,
  UpdateExpenseRequest, UpdateExpenseResponse,
  // Events
  CreateEventRequest, CreateEventResponse,
  UpdateEventRequest, UpdateEventResponse,
  // Profile
  UpdateMeRequest, UpdateMeResponse,
  UpdateRoutingHandleRequest, UpdateRoutingHandleResponse,
  UpdateInvoicePrefixRequest, UpdateInvoicePrefixResponse,
  // Availability
  AvailabilityResponse, BlockDateRequest, BlockDateResponse,
  // Hot dates
  HotDatesResponse,
  // Shared row types for mocks
  Lead, Client, Invoice, Expense, VendorEvent,
} from '../types/vendor';
import {
  makeMockLead, makeMockClient, makeMockInvoice,
  makeMockExpense, makeMockEvent,
} from '../mocks/vendor';

// ── Leads ─────────────────────────────────────────────────────────────────

export function createLead(body: CreateLeadRequest): Promise<CreateLeadResponse | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, data: makeMockLead(body), deduped: false });
  return postJson<CreateLeadResponse | ApiErr>('/api/v2/vendor/leads', body);
}

export function updateLead(leadId: string, body: UpdateLeadRequest): Promise<UpdateLeadResponse | ApiErr> {
  if (USE_MOCKS) {
    const base = makeMockLead({ name: body.name ?? 'Mock Lead', ...body });
    return Promise.resolve({ ok: true, lead: { ...base, id: leadId } });
  }
  return patchJson<UpdateLeadResponse | ApiErr>(`/api/v2/vendor/leads/${leadId}`, body);
}

export function fetchLeadDetail(leadId: string): Promise<LeadDetailResponse | ApiErr> {
  if (USE_MOCKS) {
    const lead = makeMockLead({ name: 'Mock Lead Detail' });
    return Promise.resolve({ ok: true, lead: { ...lead, id: leadId } });
  }
  return getJson<LeadDetailResponse | ApiErr>(`/api/v2/vendor/leads/${leadId}/detail`);
}

/** Convenience wrapper — sets state to 'lost'. */
export function loseLead(leadId: string, reason?: string): Promise<LeadStateResponse | ApiErr> {
  return patchLeadState(leadId, 'lost', reason);
}

// ── Clients ───────────────────────────────────────────────────────────────

export function createClient(body: CreateClientRequest): Promise<CreateClientResponse | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, client: makeMockClient(body), deduped: false, restored: false });
  return postJson<CreateClientResponse | ApiErr>('/api/v2/vendor/clients', body);
}

export function updateClient(clientId: string, body: UpdateClientRequest): Promise<UpdateClientResponse | ApiErr> {
  if (USE_MOCKS) {
    const base = makeMockClient({ name: body.name ?? 'Mock Client', ...body });
    return Promise.resolve({ ok: true, client: { ...base, id: clientId } });
  }
  return patchJson<UpdateClientResponse | ApiErr>(`/api/v2/vendor/clients/${clientId}`, body);
}

/** Hard delete — leads.client_id and invoices.client_id are SET NULL on delete. */
export function deleteClient(clientId: string): Promise<{ ok: true; deleted: true } | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, deleted: true });
  return deleteJson<{ ok: true; deleted: true } | ApiErr>(`/api/v2/vendor/clients/${clientId}`);
}

// ── Invoices ──────────────────────────────────────────────────────────────

export function createInvoice(body: CreateInvoiceRequest): Promise<CreateInvoiceResponse | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, invoice: makeMockInvoice(body), pdf_pending: true });
  return postJson<CreateInvoiceResponse | ApiErr>('/api/v2/vendor/invoices', body);
}

export function updateInvoice(invoiceId: string, body: UpdateInvoiceRequest): Promise<UpdateInvoiceResponse | ApiErr> {
  if (USE_MOCKS) {
    const base = makeMockInvoice({ amount_total: body.amount_total ?? 0, ...body });
    return Promise.resolve({ ok: true, invoice: { ...base, id: invoiceId } });
  }
  return patchJson<UpdateInvoiceResponse | ApiErr>(`/api/v2/vendor/invoices/${invoiceId}`, body);
}

export function recordPayment(invoiceId: string, body: RecordPaymentRequest): Promise<RecordPaymentResponse | ApiErr> {
  if (USE_MOCKS) {
    return Promise.resolve({ ok: true, invoice: null, payment_recorded: body.amount, new_state: 'advance_paid' });
  }
  return postJson<RecordPaymentResponse | ApiErr>(`/api/v2/vendor/invoices/${invoiceId}/payments`, body);
}

export function fetchInvoicePdf(invoiceId: string): Promise<InvoicePdfResponse | ApiErr> {
  if (USE_MOCKS) {
    return Promise.resolve({ ok: true, pdf_url: 'https://example.com/mock.pdf', expires_in: 3600 });
  }
  return getJson<InvoicePdfResponse | ApiErr>(`/api/v2/vendor/invoices/${invoiceId}/pdf`);
}

/** Cancel invoice — sets state to 'cancelled'. Alias: "delete" / "remove" per standing rule. */
export { patchInvoiceCancel as cancelInvoice };
function patchInvoiceCancel(invoiceId: string): Promise<{ ok: true; invoice: { id: string; state: string } } | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, invoice: { id: invoiceId, state: 'cancelled' } });
  return patchJson<{ ok: true; invoice: { id: string; state: string } } | ApiErr>(`/api/v2/vendor/invoices/${invoiceId}/cancel`, {});
}

// ── Expenses ──────────────────────────────────────────────────────────────

export function createExpense(body: CreateExpenseRequest): Promise<CreateExpenseResponse | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, expense: makeMockExpense(body) });
  return postJson<CreateExpenseResponse | ApiErr>('/api/v2/vendor/expenses', body);
}

export function updateExpense(expenseId: string, body: UpdateExpenseRequest): Promise<UpdateExpenseResponse | ApiErr> {
  if (USE_MOCKS) {
    const base = makeMockExpense({ amount: body.amount ?? 0, ...body });
    return Promise.resolve({ ok: true, expense: { ...base, id: expenseId } });
  }
  return patchJson<UpdateExpenseResponse | ApiErr>(`/api/v2/vendor/expenses/${expenseId}`, body);
}

export function deleteExpense(expenseId: string): Promise<{ ok: true; deleted: true } | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, deleted: true });
  return deleteJson<{ ok: true; deleted: true } | ApiErr>(`/api/v2/vendor/expenses/${expenseId}`);
}

// ── Events ────────────────────────────────────────────────────────────────

export function createEvent(body: CreateEventRequest): Promise<CreateEventResponse | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, event: makeMockEvent(body) });
  return postJson<CreateEventResponse | ApiErr>('/api/v2/vendor/events', body);
}

export function updateEvent(eventId: string, body: UpdateEventRequest): Promise<UpdateEventResponse | ApiErr> {
  if (USE_MOCKS) {
    const base = makeMockEvent({ title: body.title ?? 'Event', event_date: body.event_date ?? new Date().toISOString().split('T')[0], ...body });
    return Promise.resolve({ ok: true, event: { ...base, id: eventId } });
  }
  return patchJson<UpdateEventResponse | ApiErr>(`/api/v2/vendor/events/${eventId}`, body);
}

export function deleteEvent(eventId: string): Promise<{ ok: true; deleted: true } | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, deleted: true });
  return deleteJson<{ ok: true; deleted: true } | ApiErr>(`/api/v2/vendor/events/${eventId}`);
}

export function cancelEvent(eventId: string): Promise<{ ok: true; event: { id: string; state: string } } | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, event: { id: eventId, state: 'cancelled' } });
  return patchJson<{ ok: true; event: { id: string; state: string } } | ApiErr>(`/api/v2/vendor/events/${eventId}/cancel`, {});
}

// ── Profile ───────────────────────────────────────────────────────────────

export function updateMe(body: UpdateMeRequest): Promise<UpdateMeResponse | ApiErr> {
  if (USE_MOCKS) {
    return Promise.resolve({
      ok: true,
      vendor: {
        id: '2eb5d3fb-31eb-4b26-859a-cf10ae477d53',
        name: 'Dev Jroy',
        business_name: body.business_name ?? 'Frost Studio',
        city: body.city ?? 'Delhi',
        open_to_travel: body.open_to_travel ?? true,
        upi_id: body.upi_id ?? null,
        gstin: body.gstin ?? null,
        aesthetic_tags: body.aesthetic_tags ?? [],
        rate_min: body.rate_min ?? null,
        rate_max: body.rate_max ?? null,
        discover_preview: false,
      },
    });
  }
  return patchJson<UpdateMeResponse | ApiErr>('/api/v2/vendor/me', body);
}

export function updateRoutingHandle(body: UpdateRoutingHandleRequest): Promise<UpdateRoutingHandleResponse | ApiErr> {
  if (USE_MOCKS) {
    const h = body.routing_handle.toUpperCase();
    return Promise.resolve({ ok: true, routing_handle: h, wa_link: `https://wa.me/14787788550?text=TDW-${h}` });
  }
  return patchJson<UpdateRoutingHandleResponse | ApiErr>('/api/v2/vendor/me/routing-handle', body);
}

export function updateInvoicePrefix(body: UpdateInvoicePrefixRequest): Promise<UpdateInvoicePrefixResponse | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, prefix: body.prefix.toUpperCase(), current_counter: 16 });
  return patchJson<UpdateInvoicePrefixResponse | ApiErr>('/api/v2/vendor/me/invoice-prefix', body);
}

// ── Availability ──────────────────────────────────────────────────────────

export function fetchAvailability(vendorId: string, from?: string, to?: string): Promise<AvailabilityResponse | ApiErr> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  const qs = params.toString() ? `?${params.toString()}` : '';
  if (USE_MOCKS) return Promise.resolve({ ok: true, blocks: [], total: 0 });
  return getJson<AvailabilityResponse | ApiErr>(`/api/v2/vendor/availability/${vendorId}${qs}`);
}

export function blockDate(body: BlockDateRequest): Promise<BlockDateResponse | ApiErr> {
  if (USE_MOCKS) {
    return Promise.resolve({
      ok: true,
      block: { id: 'mock-block-' + Date.now(), blocked_date: body.blocked_date, reason: body.reason ?? null, created_at: new Date().toISOString() },
    });
  }
  return postJson<BlockDateResponse | ApiErr>('/api/v2/vendor/availability', body);
}

export function unblockDate(blockId: string): Promise<{ ok: true; deleted: true } | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, deleted: true });
  return deleteJson<{ ok: true; deleted: true } | ApiErr>(`/api/v2/vendor/availability/${blockId}`);
}

// ── Hot dates ─────────────────────────────────────────────────────────────

export function fetchHotDates(): Promise<HotDatesResponse | ApiErr> {
  if (USE_MOCKS) return Promise.resolve({ ok: true, dates: [], total: 0 });
  return getJson<HotDatesResponse | ApiErr>('/api/v2/hot-dates');
}
